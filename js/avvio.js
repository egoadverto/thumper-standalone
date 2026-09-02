/*
Thumper — Micro Planner
Copyright (c) 2026 Paolo Cioli

[IT] Questo programma è software libero: puoi ridistribuirlo e modificarlo
nei termini della GNU Affero General Public License, versione 3, pubblicata
dalla Free Software Foundation. Vedi il file LICENSE. È distribuito nella
speranza che sia utile, ma SENZA ALCUNA GARANZIA.
Per usi che l'AGPL non consente — per esempio incorporarlo in un prodotto
proprietario o rivenderlo senza rilasciare il sorgente — è disponibile una
licenza commerciale: vedi LICENZA-COMMERCIALE.md.
Sviluppato fuori dalle mansioni assegnate e con
mezzi propri. Strumento di uso generale per uffici, non specifico
di alcuna azienda.

[EN] This program is free software: you can redistribute it and/or modify it
under the terms of the GNU Affero General Public License, version 3, as
published by the Free Software Foundation. See the LICENSE file. It is
distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY.
For uses the AGPL does not allow — such as embedding it in a proprietary
product or reselling it without releasing the source — a commercial licence
is available: see LICENZA-COMMERCIALE.md.
Developed outside assigned duties and with personal
means. A general-purpose tool for offices, not specific to any
one company.
*/
"use strict";

/* ==========================================================
   12. AVVIO E EVENTI
   ========================================================== */
const OPT_FILTRO = [];
let comboFiltro = null;

/* La barra del periodo e' una sola: nel calendario sta in alto, nei carichi
   viene spostata dentro il pannello a cui si riferisce. Si sposta l'elemento
   invece di duplicarlo, cosi' i comandi e i loro gestori restano unici. */
function sistemaBarra(){
  const b = document.getElementById("strumenti");
  const dentro = document.getElementById("casa-strumenti");
  const casa = document.getElementById("posto-strumenti");
  if(!b) return;
  const dove = (V.vista === "carichi" && V.sottoVer !== "tempi" && dentro) ? dentro : casa;
  if(dove && b.parentNode !== dove) dove.appendChild(b);
  b.style.marginBottom = dove === casa ? "" : "12px";
}

function rendi(){
  /* Prima di tutto la barra torna fuori dalla pagina: il disegno riscrive
     #pagina da capo e la distruggerebbe, lasciando l'app senza comandi. */
  const barra = document.getElementById("strumenti");
  const casa = document.getElementById("posto-strumenti");
  if(barra && casa && barra.parentNode !== casa) casa.appendChild(barra);

  // la barra del periodo compare solo dove i numeri dipendono davvero dal periodo
  document.getElementById("strumenti").style.display =
    (V.vista==="piano" || (V.vista==="carichi" && V.sottoVer!=="tempi")) ? "flex" : "none";
  // larghezza colonne, filtro commessa, legenda e pulsanti di inserimento servono solo al calendario
  document.querySelectorAll(".solo-piano").forEach(x=>{ x.style.display = V.vista==="piano" ? "" : "none"; });
  OPT_FILTRO.length = 0;
  opzioniCombo(commesseSceglibili(V.filtroCommessa)).forEach(o=>OPT_FILTRO.push(o));
  if(V.vista==="piano") rendiPiano();
  else if(V.vista==="carichi") rendiCarichi();
  else if(V.vista==="commesse") rendiCommesse();
  else if(V.vista==="anagrafiche") rendiAnagrafiche();
  else if(V.vista==="backlog") rendiBacklog();
  else rendiImpostazioni();
  sistemaBarra();                       // dopo il disegno: il segnaposto esiste solo ora
  document.getElementById("lingua-it").setAttribute("aria-pressed", String(lingua === "it"));
  document.getElementById("lingua-en").setAttribute("aria-pressed", String(lingua === "en"));
  applicaLingua();
}

function avvia(){
  // se manca uno dei file di contorno, meglio dirlo subito che comportarsi in modo strano
  if(typeof DIZ === "undefined"){
    window.DIZ = {};
    alert("Manca il file dizionario.js: la pagina funziona ma solo in italiano.\n"
        + "Copialo nella stessa cartella di Thumper.html.");
  }
  const marcatore = getComputedStyle(document.documentElement).getPropertyValue("--css-caricato").trim();
  if(marcatore !== "si"){
    alert("Manca il file stile.css: la pagina è leggibile ma senza grafica.\n"
        + "Copialo nella stessa cartella di Thumper.html.");
  }

  S = normalizza(window.PLANNER_DATA || datiDemo());
  salvatoIlConosciuto = S.meta.salvatoIl || null;
  document.getElementById("da").value = V.inizio;

  document.getElementById("schede").addEventListener("click", e=>{
    const b = e.target.closest(".scheda"); if(!b) return;
    V.vista = b.dataset.vista;
    document.querySelectorAll(".scheda").forEach(x=>x.setAttribute("aria-selected", x===b));
    rendi();
  });

  document.getElementById("btn-modifica").onclick = ()=>{
    if(modificabile && modificato && !confirm(tr("Ci sono modifiche non salvate. Uscire comunque dalla modalità modifica?"))) return;
    modificabile = !modificabile;
    /* chi si è fatto riconoscere all'avvio firma anche il piano */
    if(modificabile){
      if(AUTORE) S.meta.salvatoDa = AUTORE;
      else if(!S.meta.salvatoDa){
        const n = prompt(tr("Chi sta modificando il piano? (compare come ultimo autore)"),"");
        if(n){ S.meta.salvatoDa = n; AUTORE = n; aggiornaBottoneUtente(); }
      }
    }
    aggiornaStato(); rendi();
  };
  document.getElementById("btn-salva").onclick = salva;
  document.getElementById("btn-apri").onclick = apriFile;
  document.getElementById("btn-cartelle").onclick = azioneCartelle;
  document.getElementById("btn-utente").onclick = ()=>chiediChiSei(false);

  // menu "altre azioni" in barra: le voci dentro restano quelle di sempre (stessi
  // pulsanti, stessi gestori), qui c'e' solo l'apri/chiudi del contenitore
  const menuAltro = document.getElementById("menu-altro");
  const menuLista = document.getElementById("menu-lista");
  const btnAltro = document.getElementById("btn-altro");
  const chiudiMenuAltro = () => { menuLista.hidden = true; btnAltro.setAttribute("aria-expanded","false"); };
  btnAltro.onclick = e => {
    e.stopPropagation();
    const apri = menuLista.hidden;
    menuLista.hidden = !apri;
    btnAltro.setAttribute("aria-expanded", String(apri));
  };
  menuLista.addEventListener("click", chiudiMenuAltro);
  document.addEventListener("click", e => { if(!menuLista.hidden && !menuAltro.contains(e.target)) chiudiMenuAltro(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && !menuLista.hidden) chiudiMenuAltro(); });

  document.getElementById("da").onchange = e=>{ V.inizio = iso(inizioSettimana(d(e.target.value))); rendi(); };
  document.getElementById("nascondi-fatte").onchange = e=>{ V.nascondiFatte = e.target.checked; rendi(); };
  document.getElementById("settimane").onchange = e=>{
    const v = e.target.value;
    const preset = PRESET_PERIODO[v];
    if(preset){
      const r = preset();
      V.inizio = r.inizio; V.giorni = r.giorni;
      document.getElementById("da").value = V.inizio;
    } else {
      V.giorni = +v * 7;
    }
    rendi();
  };
  document.getElementById("zoom").onchange = e=>{ V.colonna = +e.target.value; rendi(); };
  comboFiltro = creaCombo("filtro-commessa", OPT_FILTRO, {
    consentiVuoto:true,
    onScegli: id => { V.filtroCommessa = id; rendi(); }
  });
  const salta = n => { V.inizio = iso(sommaGiorni(d(V.inizio), n)); document.getElementById("da").value = V.inizio; rendi(); };
  document.getElementById("nav-indietro").onclick = ()=>salta(-7);
  document.getElementById("nav-avanti").onclick = ()=>salta(7);
  document.getElementById("nav-oggi").onclick = ()=>{ V.inizio = iso(inizioSettimana(new Date())); document.getElementById("da").value=V.inizio; rendi(); };
  document.getElementById("btn-nuova-att").onclick = ()=>{ if(!modificabile) return brindisi("Attiva prima la modifica"); apriAttivita(null,{}); };
  document.getElementById("btn-nuova-assenza").onclick = ()=>{ if(!modificabile) return brindisi("Attiva prima la modifica"); apriAssenza(null); };

  // eventi delegati per le schede tabellari
  document.getElementById("pagina").addEventListener("click", e=>{
    const sub = e.target.closest("[data-sotto]");
    if(sub){ V.sottoImp = sub.dataset.sotto; rendiImpostazioni(); applicaLingua(); return; }
    const subv = e.target.closest("[data-sottover]");
    if(subv){ V.sottoVer = subv.dataset.sottover; rendi(); return; }
    const suba = e.target.closest("[data-sottoana]");
    if(suba){ V.sottoAna = suba.dataset.sottoana; rendi(); return; }
    const subc = e.target.closest("[data-sottocom]");
    if(subc){ V.sottoCom = subc.dataset.sottocom; rendi(); return; }
    const ao = e.target.closest("[data-apri-opzioni]");
    if(ao){
      const k = ao.dataset.apriOpzioni;
      if(V.opzioniAperte.has(k)) V.opzioniAperte.delete(k); else V.opzioniAperte.add(k);
      rendi(); return;
    }
    const ar = e.target.closest("[data-applica-riassegnazione]");
    if(ar){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
      applicaRiassegnazione(ar.dataset.applicaRiassegnazione, ar.dataset.nuovaData);
      return;
    }
    const as = e.target.closest("[data-applica-sostituzione]");
    if(as){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
      applicaSostituzione(as.dataset.applicaSostituzione, as.dataset.nuovaPersona);
      return;
    }
    const bs = e.target.closest("[data-scheda]");
    if(bs){ apriSchedaCommessa(bs.dataset.scheda); return; }
    if(e.target.closest("[data-nuova-cerca]")){
      if(!modificabile) return brindisi("Attiva prima la modifica");
      apriCommessa(null, {numero:F.testo.trim()}); return;
    }
    const bg = e.target.closest("[data-mod-gruppo]");
    const su = e.target.closest("[data-su-gruppo]");
    const giu = e.target.closest("[data-giu-gruppo]");
    if(bg || su || giu){
      if(!modificabile){ brindisi(tr("Attiva prima la modifica")); return; }
      if(bg){ apriGruppo(bg.dataset.modGruppo || null); return; }
      const i = +(su ? su.dataset.suGruppo : giu.dataset.giuGruppo);
      const j = su ? i-1 : i+1;
      if(j < 0 || j >= S.gruppi.length) return;
      const t = S.gruppi[i]; S.gruppi[i] = S.gruppi[j]; S.gruppi[j] = t;
      segnaModificato(); rendi(); return;
    }
    const bm = e.target.closest("[data-mod-mansione]");
    if(bm){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
      apriMansione(bm.dataset.modMansione || null); return;
    }
    const bt = e.target.closest("[data-mod-tipologia]");
    if(bt){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
      apriTipologia(bt.dataset.modTipologia || null); return;
    }
    const bf = e.target.closest("[data-mod-festivita]");
    if(bf){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
      apriFestivita(bf.dataset.modFestivita || null); return;
    }
    const bk = e.target.closest("[data-mod-backlog]");
    if(bk){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
      apriBacklogItem(bk.dataset.modBacklog || null); return;
    }
    const bkp = e.target.closest("[data-bk-promuovi]");
    if(bkp){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
      promuoviBacklogItem(bkp.dataset.bkPromuovi); return;
    }
    const bkd = e.target.closest("[data-del-backlog]");
    if(bkd){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
      if(!autorizza(tr("Eliminare questo elemento dal backlog?"))) return;
      S.backlog = S.backlog.filter(x=>x.id!==bkd.dataset.delBacklog);
      segnaModificato(); rendi(); return;
    }
    const rr = e.target.closest("[data-rimuovi-radice]");
    if(rr){ rimuoviRadice(rr.dataset.rimuoviRadice); rendiImpostazioni(); return; }
    const dr = e.target.closest("[data-dimentica-radice]");
    if(dr){ dimenticaRadiceSospesa(dr.dataset.dimenticaRadice); rendiImpostazioni(); return; }
    const rip = e.target.closest("[data-riprendi-radice]");
    if(rip){ riprendiRadiceSingola(rip.dataset.riprendiRadice).then(rendiImpostazioni); return; }
    if(e.target.id === "btn-aggiungi-radice"){ collegaRadice().then(rendiImpostazioni); return; }
    if(e.target.id === "btn-riprendi-tutte-radici"){ riprendiRadici().then(rendiImpostazioni); return; }
    if(e.target.id === "preset-applica"){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
      const paese = document.getElementById("preset-nazionale").value;
      const preset = PRESET_FESTIVITA[paese];
      if(!autorizza(tr("Sostituire l'elenco attuale con le {0} festività di {1}?", preset.length, NOME_PAESE_PRESET[paese]))) return;
      S.config.festivitaNazionali = preset.map(v=>Object.assign({}, v));
      invalida(); segnaModificato(); rendi();
      return;
    }
    if(e.target.id === "rep-stampa"){ window.print(); return; }
    if(e.target.id === "rep-csv"){ reportCsv(); return; }
    const sp = e.target.closest("[data-scheda-persona]");
    if(sp){ apriSchedaPersona(sp.dataset.schedaPersona); return; }
    const bp = e.target.closest("[data-mod-persona]");
    const bc = e.target.closest("[data-mod-commessa]");
    const ba = e.target.closest("[data-mod-assenza]");
    const dc = e.target.closest("[data-del-chiusura]");
    if(bp||bc||ba||dc){
      if(!modificabile){ brindisi("Attiva prima la modifica"); return; }
    }
    if(e.target.id === "btn-archivia"){
      if(!modificabile) return brindisi("Attiva prima la modifica");
      const n = S.commesse.filter(c=>c.stato==="chiusa").length;
      if(!confirm(tr("Archiviare {0} progetti chiusi? Restano nel calendario e nello storico, ma non compaiono più nelle ricerche.", n))) return;
      S.commesse.forEach(c=>{ if(c.stato==="chiusa") c.stato="archiviata"; });
      segnaModificato(); rendi(); return;
    }
    if(bp) apriPersona(bp.dataset.modPersona || null);
    else if(bc) apriCommessa(bc.dataset.modCommessa || null);
    else if(ba) apriAssenza(ba.dataset.modAssenza || null);
    else if(dc){ S.config.chiusure.splice(+dc.dataset.delChiusura,1); invalida(); segnaModificato(); rendi(); }
    else if(e.target.id==="ch-aggiungi"){
      if(!modificabile) return brindisi("Attiva prima la modifica");
      const dal=val("ch-dal"), al=val("ch-al");
      if(!dal||!al||al<dal){ alert(tr("Controlla le date della chiusura.")); return; }
      S.config.chiusure.push({nome:val("ch-nome")||"Chiusura", dal, al});
      invalida(); segnaModificato(); rendi();
    }
    else if(e.target.id==="lf-aggiungi" || e.target.id==="lp-aggiungi"){
      if(!modificabile) return brindisi("Attiva prima la modifica");
      const forn = e.target.id === "lf-aggiungi";
      const nome = val(forn?"lf-nome":"lp-nome");
      const valore = numVal(forn?"lf-valore":"lp-valore");
      const unita = val(forn?"lf-unita":"lp-unita") === "giorni" ? "giorni" : "settimane";
      if(!nome){ alert(tr("Serve il nome della voce.")); return; }
      if(!(valore > 0)){ alert(tr("Il valore deve essere maggiore di zero.")); return; }
      const lista = forn ? (S.config.leadFornitura = S.config.leadFornitura||[])
                         : (S.config.leadProduzione = S.config.leadProduzione||[]);
      const voce = {id:nuovoId(forn?"lf":"lp"), nome, valore, unita};
      if(!forn) voce.richiedeFornitura = document.getElementById("lp-fornitura").checked;
      lista.push(voce);
      segnaModificato(); rendi();
    }
    else if(e.target.closest("[data-modifica-forn]") || e.target.closest("[data-modifica-prod]")){
      if(!modificabile) return brindisi("Attiva prima la modifica");
      const bm = e.target.closest("[data-modifica-forn]");
      const id = bm ? bm.dataset.modificaForn : e.target.closest("[data-modifica-prod]").dataset.modificaProd;
      if(V.leadModifica.has(id)) V.leadModifica.delete(id); else V.leadModifica.add(id);
      rendi();
    }
    else if(e.target.closest("[data-del-forn]") || e.target.closest("[data-del-prod]")){
      if(!modificabile) return brindisi("Attiva prima la modifica");
      const bf = e.target.closest("[data-del-forn]");
      if(bf){
        S.config.leadFornitura = (S.config.leadFornitura||[]).filter(v=>v.id!==bf.dataset.delForn);
        V.leadModifica.delete(bf.dataset.delForn);
      } else {
        const bp2 = e.target.closest("[data-del-prod]");
        const id = bp2.dataset.delProd;
        const usata = S.assegnazioni.filter(a=>a.tipologiaId===id).length;
        if(usata && !confirm(tr("{0} attività usano questa tipologia: resteranno senza tempo di sviluppo interno. Procedere?", usata))) return;
        S.config.leadProduzione = (S.config.leadProduzione||[]).filter(v=>v.id!==id);
        S.assegnazioni.forEach(a=>{ if(a.tipologiaId===id) a.tipologiaId = null; });
        V.leadModifica.delete(id);
      }
      segnaModificato(); rendi();
    }
    else if(e.target.id==="fest-prec"){ V.annoFest--; rendiImpostazioni(); }
    else if(e.target.id==="fest-succ"){ V.annoFest++; rendiImpostazioni(); }
    else if(e.target.id==="btn-codice"){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
      const nuovo = val("cfg-codice");
      if(nuovo.length < 4){ alert(tr("Il codice deve avere almeno 4 caratteri.")); return; }
      if(protetto() && !autorizza(tr("Cambio del codice di protezione."))) return;
      S.config.codice = impronta(nuovo);
      segnaModificato(); rendi(); brindisi(tr("Protezione aggiornata"));
    }
    else if(e.target.id==="btn-codice-off"){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
      if(!autorizza(tr("Rimozione della protezione."))) return;
      S.config.codice = null;
      segnaModificato(); rendi(); brindisi(tr("Protezione rimossa"));
    }
    else if(e.target.id==="btn-csv") esportaCsv();
    else if(e.target.id==="btn-scarica") scarica("dati.js", serializza());
    else if(e.target.id==="btn-svuota"){
      if(!modificabile) return brindisi("Attiva prima la modifica");
      if(!autorizza(tr("Elimina persone, progetti, attività e assenze. I gruppi e le impostazioni restano. Procedere?"))) return;
      S.persone=[]; S.commesse=[]; S.assegnazioni=[]; S.assenze=[];
      invalida(); segnaModificato(); rendi();
    }
  });
  document.getElementById("pagina").addEventListener("keydown", e=>{
    if(e.target.id === "cfg-codice" && e.key === "Enter"){
      e.preventDefault();
      const b = document.getElementById("btn-codice");
      if(b) b.click();
    }
  });
  document.getElementById("pagina").addEventListener("input", e=>{
    if(e.target.id === "q-testo"){
      F.testo = e.target.value;
      rendiCommesse();
      const campo = document.getElementById("q-testo");
      campo.focus(); campo.setSelectionRange(campo.value.length, campo.value.length);
    }
  });
  document.getElementById("pagina").addEventListener("change", e=>{
    if(e.target.id==="cfg-archivio"){
      if(!modificabile){ e.target.value = S.config.giorniArchiviazione; return brindisi("Attiva prima la modifica"); }
      S.config.giorniArchiviazione = Math.max(0, parseInt(e.target.value) || 0);
      const n = archiviaScadute();
      segnaModificato(); rendi();
      if(n) brindisi(tr(n===1 ? "{0} progetto archiviato" : "{0} progetti archiviati", n));
    }
    else if(e.target.id==="cfg-smart"){ if(!modificabile) return; S.config.smartMaxSettimana = Math.max(0, parseInt(e.target.value)||0); segnaModificato(); rendi(); }
    else if(e.target.id==="cfg-prot-att"){
      if(!modificabile){ e.target.checked = !e.target.checked; return brindisi(tr("Attiva prima la modifica")); }
      S.config.proteggiAttivita = e.target.checked;
      segnaModificato(); rendi();
    }
    else if(e.target.id==="preset-nazionale"){ document.getElementById("preset-fuso").textContent = testoFusoPreset(e.target.value); }
    else if(e.target.id==="anteprima-calendario"){ V.calAnteprima = e.target.value; rendiImpostazioni(); }
    else if(e.target.id==="rep-ambito"){ V.repAmbito = e.target.value; rendi(); }
    else if(e.target.id==="rep-ordine"){ V.repOrdine = e.target.value; rendi(); }
    else if(e.target.id==="q-stato"){ F.stato = e.target.value; rendiCommesse(); }
    else if(e.target.id==="q-anno"){ F.anno = e.target.value; rendiCommesse(); }
    else if(e.target.id==="q-natura"){ F.natura = e.target.value; rendiCommesse(); }
    else if(e.target.id==="q-ritardo"){ F.soloRitardo = e.target.checked; rendiCommesse(); }
    else if(e.target.id==="q-ordine"){ F.ordine = e.target.value; rendiCommesse(); }
    else if(e.target.id==="cfg-efficienza"){
      const pctAttuale = Math.round((S.config.efficienza!=null?S.config.efficienza:1)*100);
      if(!modificabile){ e.target.value = pctAttuale; return brindisi("Attiva prima la modifica"); }
      const pct = Math.max(1, parseFloat(e.target.value) || 100);
      S.config.efficienza = pct/100;
      invalida(); segnaModificato(); rendi();
      brindisi(tr("Ricalcolate le attività a tempo pieno"));
    }
    else if(e.target.id==="cfg-margine"){
      if(!modificabile){ e.target.value = S.config.margineGiorni||0; return brindisi("Attiva prima la modifica"); }
      S.config.margineGiorni = Math.max(0, parseInt(e.target.value) || 0);
      segnaModificato();
    }
    else if(e.target.dataset && (e.target.dataset.lfNome!==undefined || e.target.dataset.lfValore!==undefined || e.target.dataset.lfUnita!==undefined
                              || e.target.dataset.lpNome!==undefined || e.target.dataset.lpValore!==undefined || e.target.dataset.lpUnita!==undefined)){
      if(!modificabile) return brindisi("Attiva prima la modifica");
      const ds = e.target.dataset;
      const forn = ds.lfNome!==undefined || ds.lfValore!==undefined || ds.lfUnita!==undefined;
      const id = ds.lfNome || ds.lfValore || ds.lfUnita || ds.lpNome || ds.lpValore || ds.lpUnita;
      const voce = (forn ? S.config.leadFornitura : S.config.leadProduzione).find(v=>v.id===id);
      if(!voce) return;
      if(ds.lfNome!==undefined || ds.lpNome!==undefined){
        const n = e.target.value.trim();
        if(!n){ e.target.value = voce.nome; return; }
        voce.nome = n;
      } else if(ds.lfUnita!==undefined || ds.lpUnita!==undefined){
        voce.unita = e.target.value === "giorni" ? "giorni" : "settimane";
      } else {
        const s = parseFloat(e.target.value.replace(",","."));
        if(!(s > 0)){ e.target.value = voce.valore; return; }
        voce.valore = s;
      }
      segnaModificato();
    }
    else if(e.target.dataset && e.target.dataset.lpFornitura!==undefined){
      if(!modificabile){ e.target.checked = !e.target.checked; return brindisi("Attiva prima la modifica"); }
      const voce = (S.config.leadProduzione||[]).find(v=>v.id===e.target.dataset.lpFornitura);
      if(!voce) return;
      voce.richiedeFornitura = e.target.checked;
      segnaModificato();
    }
    else if(e.target.dataset && e.target.dataset.bkStato!==undefined){
      if(!modificabile) return brindisi("Attiva prima la modifica");
      const it = backlogItem(e.target.dataset.bkStato);
      if(!it) return;
      it.stato = e.target.value;
      segnaModificato(); rendi();
    }
    else if(e.target.dataset && e.target.dataset.giorno!==undefined){
      if(!modificabile){ e.target.checked=!e.target.checked; return brindisi("Attiva prima la modifica"); }
      const n = +e.target.dataset.giorno;
      if(e.target.checked) S.config.giorniLavorativi.push(n);
      // le ore del giorno restano salvate anche da spento: si ritrovano se lo si riattiva
      else S.config.giorniLavorativi = S.config.giorniLavorativi.filter(x=>x!==n);
      invalida(); segnaModificato(); rendiImpostazioni(); applicaLingua();
    }
    else if(e.target.dataset && e.target.dataset.oregiorno!==undefined){
      if(!modificabile) return brindisi("Attiva prima la modifica");
      const n = e.target.dataset.oregiorno;
      if(!S.config.oreGiorniSettimana) S.config.oreGiorniSettimana = {};
      const v = parseFloat(String(e.target.value).replace(",","."));
      if(!(v > 0)){ e.target.value = S.config.oreGiorniSettimana[n]; return; }
      S.config.oreGiorniSettimana[n] = v;
      invalida(); segnaModificato(); rendiImpostazioni(); applicaLingua();
    }
  });

  window.addEventListener("beforeunload", e=>{
    if(modificato){ e.preventDefault(); e.returnValue=""; }
  });

  const archiviate = archiviaScadute();
  if(archiviate){
    modificato = true;
    setTimeout(()=>brindisi(tr(archiviate===1
      ? "{0} progetto archiviato automaticamente: salva per confermare"
      : "{0} progetti archiviati automaticamente: salva per confermare", archiviate)), 600);
  }

  document.getElementById("lingua-scelta").addEventListener("click", e=>{
    const b = e.target.closest("[data-l]");
    if(!b || b.dataset.l === lingua) return;
    lingua = b.dataset.l;
    location.hash = lingua;
    salvaLingua(lingua);
    rendi();
  });

  aggiornaStato();
  rendi();
  aggiornaBottoneUtente();
  chiediChiSei(true);
  recuperaRadici();
}
avvia();
