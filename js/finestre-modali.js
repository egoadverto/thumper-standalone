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
Sviluppato da Paolo Cioli con il supporto dell'intelligenza artificiale.
Strumento di supporto alla gestione e al coordinamento dei team.

[EN] This program is free software: you can redistribute it and/or modify it
under the terms of the GNU Affero General Public License, version 3, as
published by the Free Software Foundation. See the LICENSE file. It is
distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY.
For uses the AGPL does not allow — such as embedding it in a proprietary
product or reselling it without releasing the source — a commercial licence
is available: see LICENZA-COMMERCIALE.md.
Developed by Paolo Cioli with the support of artificial intelligence.
A tool to support team management and coordination.
*/
"use strict";

/* ==========================================================
   10. FINESTRE DI MODIFICA
   ========================================================== */
// bloccante: per finestre obbligate (es. "Chi sei?" al primo avvio) — niente
// chiusura accidentale cliccando fuori o premendo Esc, si esce solo dai suoi pulsanti
function finestra(titolo, corpo, piede, bloccante){
  chiudi();
  const v = document.createElement("div");
  v.className="velo"; v.id="velo";
  if(bloccante) v.dataset.bloccante = "1";
  v.innerHTML = `<div class="finestra" role="dialog" aria-modal="true">
    <header><h4 class="din">${titolo}</h4></header>
    <div class="corpo-f">${corpo}</div>
    <footer>${piede}</footer></div>`;
  document.body.appendChild(v);
  if(!bloccante) v.addEventListener("mousedown", e=>{ if(e.target===v) chiudi(); });
  document.addEventListener("keydown", escChiudi);
  applicaLingua();
  const primo = v.querySelector("input,select,textarea");
  if(primo) primo.focus();
  return v;
}
function escChiudi(e){
  if(e.key!=="Escape") return;
  const v = document.getElementById("velo");
  if(v && v.dataset.bloccante) return;
  chiudi();
}
let PULIZIA = null;              // da eseguire quando la finestra si chiude, comunque si chiuda
function chiudi(){
  if(PULIZIA){ try{ PULIZIA(); }catch(err){} PULIZIA = null; }
  const v = document.getElementById("velo");
  if(v) v.remove();
  document.removeEventListener("keydown", escChiudi);
}
function val(id){ const e=document.getElementById(id); return e?e.value.trim():""; }
function numVal(id){ const v=parseFloat(val(id).replace(",",".")); return isNaN(v)?0:v; }

/* Campo di ricerca a discesa: sostituisce il menu a tendina quando le voci sono centinaia.
   opzioni = [{id, eti, sotto, chiavi}] ; azione = {eti, fn} voce in fondo alla lista */
function creaCombo(idInput, opzioni, cfg){
  cfg = cfg || {};
  const inp = document.getElementById(idInput);
  if(!inp) return null;
  const box = inp.parentNode;
  let lista = null, evidenza = -1, filtrate = [];

  const etiDi = id => { const o = opzioni.find(x=>x.id===id); return o ? o.eti : ""; };
  const imposta = (id, silenzioso) => {
    inp.dataset.id = id || "";
    inp.value = id ? etiDi(id) : "";
    if(!silenzioso && cfg.onScegli) cfg.onScegli(id || "");
  };
  const chiudiLista = () => { if(lista){ lista.remove(); lista = null; evidenza = -1; } };

  const disegna = () => {
    const q = inp.value.trim().toLowerCase();
    filtrate = !q ? opzioni.slice(0,60)
      : opzioni.filter(o => (o.chiavi || (o.eti+" "+(o.sotto||""))).toLowerCase().includes(q)).slice(0,60);
    if(!lista){ lista = document.createElement("div"); lista.className = "cb-lista"; box.appendChild(lista); }
    let html = filtrate.map((o,i)=>
      `<div class="cb-voce" role="option" data-i="${i}" aria-selected="${i===evidenza}">
         <span>${esc(o.eti)}</span>${o.sotto?`<span class="cb-sotto">${esc(o.sotto)}</span>`:""}</div>`).join("");
    if(!filtrate.length) html = `<div class="cb-vuoto">Nessun risultato per “${esc(inp.value.trim())}”</div>`;
    if(cfg.azione) html += `<div class="cb-voce cb-azione" data-azione="1">${esc(cfg.azione.eti)}</div>`;
    lista.innerHTML = html;
    const att = lista.querySelector('[aria-selected="true"]');
    if(att) att.scrollIntoView({block:"nearest"});
  };

  inp.addEventListener("focus", ()=>{ evidenza = -1; disegna(); });
  inp.addEventListener("input", ()=>{ evidenza = -1; disegna(); });
  inp.addEventListener("keydown", e=>{
    if(e.key === "ArrowDown" || e.key === "ArrowUp"){
      e.preventDefault();
      if(!lista) disegna();
      evidenza += (e.key === "ArrowDown" ? 1 : -1);
      if(evidenza < 0) evidenza = filtrate.length - 1;
      if(evidenza >= filtrate.length) evidenza = 0;
      disegna();
    } else if(e.key === "Enter"){
      if(lista && evidenza >= 0 && filtrate[evidenza]){ e.preventDefault(); imposta(filtrate[evidenza].id); chiudiLista(); }
    } else if(e.key === "Escape"){
      if(lista){ e.stopPropagation(); chiudiLista(); }
    }
  });
  box.addEventListener("mousedown", e=>{
    const az = e.target.closest("[data-azione]");
    if(az){ e.preventDefault(); chiudiLista(); cfg.azione.fn(); return; }
    const v = e.target.closest(".cb-voce");
    if(v && v.dataset.i !== undefined){ e.preventDefault(); imposta(filtrate[+v.dataset.i].id); chiudiLista(); }
  });
  inp.addEventListener("blur", ()=>{
    setTimeout(()=>{
      chiudiLista();
      // se il testo non corrisponde a una scelta valida, ripristina
      const corr = opzioni.find(o => o.eti.toLowerCase() === inp.value.trim().toLowerCase());
      if(corr) imposta(corr.id);
      else if(!inp.value.trim() && cfg.consentiVuoto) imposta("");
      else imposta(inp.dataset.id || "", true);
    }, 130);
  });

  imposta(cfg.valore || "", true);
  return {valore: ()=>inp.dataset.id || "", imposta};
}
function opzioniCombo(lista){
  return lista.map(c=>({
    id:c.id, eti:etichettaCommessa(c),
    sotto:[c.descrizione, c.stato!=="attiva"?STATI[c.stato]:""].filter(Boolean).join(" · "),
    chiavi:[c.numero,c.cliente,c.descrizione].join(" ")
  }));
}

// la persona in organico che corrisponde a chi è entrato ("Chi sei?"), se c'è: è la scelta
// proposta negli editor di attività e assenze aperti senza una riga del calendario di partenza
function personaAutore(){
  if(!AUTORE) return null;
  const n = AUTORE.trim().toLowerCase();
  const p = S.persone.find(x => x.attivo !== false && (x.nome||"").trim().toLowerCase() === n);
  return p ? p.id : null;
}
// segnaposto: aggiunge "— scegli la persona —" in testa, selezionato se non c'è una scelta.
// Senza, un <select> senza voce selezionata mostrerebbe la prima persona dell'elenco e la
// salverebbe senza che nessuno l'abbia scelta
function opzioniPersone(sel, segnaposto){
  const v = personeOrdinate(true);
  // chi è uscito dall'organico DOPO essere stato scelto resta comunque in elenco, marcato:
  // altrimenti il select non troverebbe la voce, ricadrebbe sulla prima persona attiva e
  // salverebbe quella al posto sua senza dirlo (lo strumento segnala, non corregge da solo)
  const p = sel ? persona(sel) : null;
  if(p && !v.includes(p)) v.push(p);
  return (segnaposto ? `<option value="" ${sel?"":"selected"}>${tr("— scegli la persona —")}</option>` : "") + v.map(p=>
    `<option value="${p.id}" ${p.id===sel?"selected":""}>${esc(p.nome)}${p.attivo===false?` (${tr("Non attivo")})`:""}</option>`).join("");
}

function apriAttivita(id, pre){
  if(!modificabile && id){ return anteprimaAttivita(id); }
  if(!modificabile) return;
  if(S.commesse.length===0){ alert(tr("Aggiungi prima un progetto in Progetti.")); return; }
  const a = id ? S.assegnazioni.find(x=>x.id===id) : null;
  const p = pre || {};
  // nuova attività: la persona della riga cliccata, altrimenti chi è entrato; mai la prima
  // dell'elenco per default, che finirebbe assegnata a qualcuno che nessuno ha scelto
  const pid = a ? a.personaId : (p.personaId || personaAutore() || "");
  const oreG = a ? a.orePerGiorno : null;
  const modoIni = a ? modoAtt(a) : "inizio";
  const dataRif = a ? (modoIni==="fine"?a.scadenza:a.dataInizio) : (p.dataInizio||iso(new Date()));
  // "Duplica attività" (pre) passa solo persona e progetto: tutto il resto (descrizione, ore,
  // date, tipologia, dipendenze) si compila da capo, per non trascinarsi dietro per copia e
  // incolla scelte che nessuno ha riguardato (vedi CLAUDE.md)
  const tipoIni = a ? a.tipologiaId : (p.tipologiaId || "");
  /* Stessa impaginazione della scheda commessa: a sinistra chi fa cosa e
     quando, a destra prodotto e stato. In fondo, a tutta larghezza, i
     riquadri che il pianificatore riempie da solo mentre compili. */
  const corpo = `
    <div class="sc-due">
      <div class="sc-sx">

        <div class="sc-sezione">
          <h5 class="titoletto din">Chi e cosa</h5>
          <div class="riga-campi">
            <div class="campo"><label for="f-persona">Persona</label><select id="f-persona">${opzioniPersone(pid, !a)}</select></div>
            <div class="campo"><label for="f-commessa">Progetto</label>
              <div class="cerca"><input type="text" id="f-commessa" placeholder="Cerca numero o riferimento" autocomplete="off"></div>
            </div>
          </div>
          <div class="avviso" id="f-nuova" hidden>
            <b>Nuovo progetto</b>
            <div class="riga-campi" style="margin-top:6px">
              <div class="campo"><label for="n-num">Numero</label><input type="text" id="n-num"></div>
              <div class="campo"><label for="n-cli">Riferimento</label><input type="text" id="n-cli"></div>
            </div>
            <div style="display:flex;gap:8px"><button class="btn piccolo primario" id="n-crea">Crea e seleziona</button>
            <button class="btn piccolo" id="n-annulla">Annulla</button></div>
          </div>
          <div class="campo" style="margin-top:10px"><label for="f-desc">Descrizione dell'attività</label>
            <textarea id="f-desc" rows="2" placeholder="Es. schema di potenza, cablaggio quadro, distinta">${esc(a&&a.descrizione?a.descrizione:(p.descrizione||""))}</textarea></div>
        </div>

        <div class="sc-sezione">
          <h5 class="titoletto din">Quando</h5>
          <div class="riga-campi">
            <div class="campo"><label for="f-modo">Vincolo</label><select id="f-modo">
              <option value="inizio" ${modoIni==="inizio"?"selected":""}>Parte il</option>
              <option value="fine" ${modoIni==="fine"?"selected":""}>Consegna entro il</option>
              <option value="finestra" ${modoIni==="finestra"?"selected":""}>Dal … al … (carico ripartito)</option>
            </select></div>
            <div class="campo"><label for="f-inizio" id="f-lab-data">${modoIni==="fine"?"Data di consegna":modoIni==="finestra"?"Dal":"Giorno di partenza"}</label>
              <input type="date" id="f-inizio" value="${a?(modoIni==="fine"?a.scadenza:a.dataInizio):(p.dataInizio||iso(new Date()))}"></div>
            <div class="campo" id="f-box-al"><label for="f-al">Al</label>
              <input type="date" id="f-al" ${modoIni==="finestra"?"":"disabled"}
                value="${a&&modoIni==="finestra"&&a.scadenza?a.scadenza:iso(sommaGiorni(d(a?a.dataInizio:(p.dataInizio||iso(new Date()))),14))}">
              <span class="aiuto" id="f-aiuto-al">${modoIni==="finestra"?"Fine della finestra.":"Serve solo col carico ripartito."}</span></div>
          </div>
          <div class="riga-campi" style="margin-top:10px">
            <div class="campo"><label for="f-ore">Monte ore</label>
              <input type="number" id="f-ore" min="0.5" step="0.5" value="${a?a.oreTotali:8}">
              <span class="aiuto">Ore complessive del lavoro.</span></div>
            <div class="campo" id="f-box-oreg"><label for="f-oreg">Ore al giorno — deroga</label>
              <input type="number" id="f-oreg" min="0.5" step="0.5" ${modoIni==="finestra"?"disabled":""}
                placeholder="${tr("vuoto = {0} h come da organico", capacitaPersonaGiorno(persona(pid), dataRif))}" value="${oreG!=null?oreG:""}">
              <span class="aiuto" id="f-aiuto-oreg">${modoIni==="finestra"?"Col carico ripartito il ritmo lo decide la finestra.":"Sovrascrive le ore giornaliere della persona, solo qui."}</span></div>
          </div>
          <div class="campo" style="margin-top:10px"><label for="f-dopo">Parte dopo</label>
            <div class="dip-scelte" id="f-dip-scelte"></div>
            <div class="cerca dip-cerca"><input type="text" id="f-dopo" placeholder="Cerca un'attività del progetto…" autocomplete="off"></div>
          </div>
        </div>

      </div>
      <div class="sc-dx">

        <div class="sc-sezione">
          <h5 class="titoletto din">Sviluppo interno</h5>
          <div class="campo"><label for="f-tipologia">Tipologia di sviluppo interno</label>
            <select id="f-tipologia">
              <option value="">— non indicata —</option>
              <option value="nessuna" ${tipoIni==="nessuna"?"selected":""}>Nessuno sviluppo interno</option>
              ${(S.config.leadProduzione||[]).map(x=>`<option value="${x.id}" ${tipoIni===x.id?"selected":""}>${tr("{0} · {1}", esc(x.nome), testoValoreLead(x))}</option>`).join("")}
            </select></div>
        </div>

        <div class="sc-sezione">
          <h5 class="titoletto din">Stato</h5>
          <div class="campo"><label for="f-fine">Giorno</label>
            <input type="date" id="f-fine" value="${a&&a.dataFine?a.dataFine:iso(new Date())}" ${a&&(a.fatta||a.sospesa)?"":"disabled"}></div>
          <div class="campo" style="margin-top:6px"><label class="spunta"><input type="checkbox" id="f-fatta" ${a&&a.fatta?"checked":""}> Conclusa</label></div>
          <div class="campo" style="margin-top:4px"><label class="spunta"><input type="checkbox" id="f-annullata" ${a&&a.annullata?"checked":""}> Annullata</label></div>
          <div class="campo" style="margin-top:4px"><label class="spunta"><input type="checkbox" id="f-sospesa" ${a&&a.sospesa?"checked":""}> Sospesa</label></div>
        </div>

        <div class="sc-sezione">
          <h5 class="titoletto din">Note</h5>
          <div class="campo"><textarea id="f-note" rows="2" aria-label="Note">${esc(a?a.note:"")}</textarea>
            <span class="aiuto">Testo libero: vincoli, accordi, promemoria.</span></div>
        </div>

      </div>
    </div>

    <div id="f-liberate" hidden></div>
    <div class="avviso" id="f-anteprima"></div>
    <div id="f-consiglio" hidden></div>`;
  const piede = `${a?'<button class="btn pericolo sinistra" id="f-elimina">Elimina</button>':""}
    ${a?'<button class="btn" id="f-duplica">Duplica attività</button>':""}
    <button class="btn" id="f-annulla">Annulla</button>
    <button class="btn primario" id="f-ok">${a?"Salva attività":"Aggiungi attività"}</button>`;
  finestra(a?"Modifica attività":"Nuova attività", corpo, piede)
    .querySelector(".finestra").classList.add("con-lista", "enorme");

  const optC = opzioniCombo(commesseSceglibili(a?a.commessaId:null));
  const pannelloNuova = document.getElementById("f-nuova");
  const combo = creaCombo("f-commessa", optC, {
    valore: a ? a.commessaId : (p.commessaId || ""),
    onScegli: ()=>{ disegnaDipendenze(); anteprima(); },
    azione: {eti:"+ Crea un nuovo progetto", fn: ()=>{
      pannelloNuova.hidden = false;
      document.getElementById("n-num").focus();
    }}
  });
  document.getElementById("n-annulla").onclick = ()=>{ pannelloNuova.hidden = true; };
  document.getElementById("n-crea").onclick = ()=>{
    const numero = val("n-num");
    if(!numero){ alert(tr("Serve il numero di progetto.")); return; }
    if(S.commesse.some(x => (x.numero||"").toLowerCase() === numero.toLowerCase())){
      alert(tr("Esiste già un progetto con questo numero: deve essere univoco.")); return;
    }
    const nuova = {id:nuovoId("c"), numero, cliente:val("n-cli"), descrizione:"",
                   colore:null, stato:"attiva", apertura:iso(new Date())};
    S.commesse.push(nuova);
    optC.length = 0;
    opzioniCombo(commesseSceglibili()).forEach(o=>optC.push(o));
    combo.imposta(nuova.id, true);
    disegnaDipendenze();
    pannelloNuova.hidden = true;
    segnaModificato();
    anteprima();
    brindisi(tr("Progetto {0} creato", numero));
  };

  /* "Parte dopo": le attività dello stesso progetto che devono finire prima che questa
     parta. Si aggiungono una alla volta dal campo di ricerca e restano come etichette
     rimovibili. Il campo propone solo le attività ammesse: dello stesso progetto, non già
     scelte, non annullate e che non chiuderebbero un ciclo (cioè non già dipendenti, anche
     indirettamente, da questa). Cambiando progetto le scelte dell'altro non si salvano. */
  const sceltePred = new Set(a && a.dipendeDa ? a.dipendeDa : []);
  const idAtt = a ? a.id : "nuova";
  const optDopo = [];
  const comboDopo = creaCombo("f-dopo", optDopo, {
    consentiVuoto: true,
    onScegli: id => {
      if(!id) return;
      sceltePred.add(id);
      comboDopo.imposta("", true);
      disegnaDipendenze(); anteprima();
    }
  });
  const disegnaDipendenze = () => {
    const cid = combo.valore();
    const box = document.getElementById("f-dip-scelte");
    const scelte = predScelti().map(pid => S.assegnazioni.find(x => x.id === pid));
    box.innerHTML = scelte.map(x => `<span class="dip-etichetta">${esc(nomeAttivita(x))}
      <button type="button" class="dip-togli" data-togli="${x.id}" title="${tr("Togli")}" aria-label="${tr("Togli")}">×</button></span>`).join("");
    box.querySelectorAll("[data-togli]").forEach(b => b.onclick = () => {
      sceltePred.delete(b.dataset.togli); disegnaDipendenze(); anteprima();
    });
    optDopo.length = 0;
    S.assegnazioni.filter(x => cid && x.commessaId === cid && x.id !== idAtt && !x.annullata
        && !sceltePred.has(x.id) && !creaCiclo(idAtt, x.id))
      .sort((x, y) => ((estremi(x)||{}).dal||"9999") < ((estremi(y)||{}).dal||"9999") ? -1 : 1)
      .forEach(x => { const e = estremi(x); optDopo.push({id:x.id, eti:nomeAttivita(x),
        sotto: e ? itData(e.dal) + " – " + itData(e.al) : ""}); });
    const inp = document.getElementById("f-dopo");
    inp.disabled = !cid || !optDopo.length;
    inp.placeholder = !cid ? tr("Scegli prima il progetto.")
      : optDopo.length ? tr("Cerca un'attività del progetto…") : tr("Nessuna attività del progetto da cui possa dipendere.");
  };
  // le scelte valide per il progetto selezionato ora, da salvare
  const predScelti = () => {
    const cid = combo.valore();
    return Array.from(sceltePred).filter(pid => {
      const x = S.assegnazioni.find(y => y.id === pid);
      return x && x.commessaId === cid && !creaCiclo(idAtt, pid);
    });
  };

  const perGiornoForm = () => (val("f-modo") === "finestra") ? null : (val("f-oreg") ? numVal("f-oreg") : null);
  const risolviInizio = () => {
    if(val("f-modo") !== "fine") return val("f-inizio");
    // un'attività esistente che si sta concludendo è storia, non un piano da ricalcolare:
    // altrimenti chiudendola in anticipo la partenza si sposterebbe a ritroso da oggi
    // invece che dalla vecchia scadenza, falsificando quando è iniziata davvero (e con
    // lei l'anteprima e il conteggio dei giorni liberati oltre la chiusura).
    if(a && document.getElementById("f-fatta").checked) return a.dataInizio;
    return partenzaDaScadenza(val("f-persona"), val("f-inizio"), numVal("f-ore"), perGiornoForm());
  };
  // stesso id dell'attività in modifica: distribuzione() la mette al posto di quella salvata,
  // invece di contarla due volte insieme alla versione vecchia
  const oggettoForm = () => ({id:a ? a.id : "nuova", personaId:val("f-persona"), commessaId:combo.valore(),
    modo:val("f-modo"), dataInizio:risolviInizio(),
    scadenza: val("f-modo") === "fine" ? val("f-inizio") : val("f-modo") === "finestra" ? val("f-al") : null,
    oreTotali:numVal("f-ore"), orePerGiorno:perGiornoForm(), dipendeDa:predScelti()});

  // avvisi di sequenza per la versione in modifica che va dal primo all'ultimo giorno di "ch":
  // parte prima che finisca un'attività da cui dipende, o finisce dopo la partenza di una
  // che dipende da lei. Solo segnalazione: niente viene spostato
  const avvisiSequenza = (ch) => {
    if(!ch || !ch.length || document.getElementById("f-fatta").checked) return "";
    const dal = ch[0], al = ch[ch.length - 1], out = [];
    predScelti().map(pid => S.assegnazioni.find(x => x.id === pid)).filter(p => p && !p.annullata).forEach(p => {
      if(p.sospesa){ out.push(tr("⚠ Dipende da “{0}”, che è sospesa.", esc(nomeAttivita(p)))); return; }
      const e = estremi(p);
      if(e && e.al >= dal) out.push(tr("⚠ Parte il {0}, prima che finisca “{1}” ({2}).", itData(dal), esc(nomeAttivita(p)), itData(e.al)));
    });
    if(a && combo.valore() === a.commessaId) successori(a).filter(x => !x.fatta).forEach(x => {
      const e = estremi(x);
      if(e && e.dal <= al) out.push(tr("⚠ Finisce il {0}, dopo la partenza di “{1}” ({2}), che dipende da questa.", itData(al), esc(nomeAttivita(x)), itData(e.dal)));
    });
    // nessun <br>: dentro .avviso il <b> è già un blocco a sé
    return out.map(t => `<b style="color:var(--allarme);margin:3px 0 0">${t}</b>`).join("");
  };

  // consiglio sull'ultimo giorno di partenza, se la commessa ha una consegna concordata.
  // Usa la tipologia scelta QUI per l'attività (non più un default di progetto, rimosso):
  // cambiando "f-tipologia" il consiglio si ricalcola, vedi il listener più sotto.
  const consiglio = () => {
    const box = document.getElementById("f-consiglio");
    const c = commessa(combo.valore());
    // stessa data limite di Verifiche: quella della tipologia scelta qui, ristretta dalle
    // attività che dipendono da questa (limiteAttivita)
    const lim = c ? limiteAttivita(c, Object.assign(oggettoForm(), {tipologiaId:val("f-tipologia") || null})) : null;
    if(!lim){ box.hidden = true; box.innerHTML = ""; return; }
    const ultimo = lim.impossibile ? null : ultimoInizio(oggettoForm(), lim.fineUfficio);
    const inizioPrev = (distribuzione(oggettoForm()).size ? Array.from(distribuzione(oggettoForm()).keys()).sort()[0] : null);
    const tardi = !!(ultimo && inizioPrev && inizioPrev > ultimo);
    box.hidden = false;
    box.className = "avviso";
    box.innerHTML = `<b>${tr("Consegna: {0}", itData(lim.consegna))}</b>`
      + tr("Tolti {0} gg di fornitura esterna e {1} gg di sviluppo interno{2}, l'ufficio deve chiudere entro il {3}.",
           lim.gForn, lim.gProd, lim.marg ? tr(" più {0} gg lavorativi di margine", lim.marg) : "", itData(lim.fineUfficioPropria || lim.fineUfficio))
      + (lim.impossibile ? `<br><b style="color:var(--allarme)">${tr("⚠ “{0}”, che dipende da questa, non rientra più nella data limite.", esc(nomeAttivita(lim.vincoloDa)))}</b>`
        : lim.vincoloDa ? `<br>${tr("Per lasciare il tempo a “{0}”, che dipende da questa, deve finire entro il {1}.", esc(nomeAttivita(lim.vincoloDa)), itData(lim.fineUfficio))}` : "")
      + (lim.mancaForn ? `<br><span class="nota">${tr("Nessun lead time di fornitura esterna in tabella: il calcolo lo considera zero (si imposta in Impostazioni).")}</span>` : "")
      + (lim.mancaTip ? `<br><span class="nota">${tr("Tipologia di sviluppo interno non indicata qui sopra: il calcolo la considera zero.")}</span>` : "")
      + (ultimo
          ? `<br><b${tardi?' style="color:var(--allarme)"':""}>${tr("Ultimo giorno utile per partire: {0}", itData(ultimo))}</b>`
            + (tardi ? " " + tr("⚠ Con la partenza attuale si arriva in ritardo.") : "")
          : lim.impossibile ? ""
          : `<br><b style="color:var(--allarme)">${tr("⚠ Con questo monte ore non si rientra più nella data limite.")}</b>`)
      + ` <button type="button" class="btn piccolo" id="f-usa-limite">${tr("Vincola alla data limite")}</button>`;
    const bu = document.getElementById("f-usa-limite");
    if(bu) bu.onclick = ()=>{
      document.getElementById("f-modo").value = "fine";
      document.getElementById("f-inizio").value = lim.fineUfficio;
      anteprima();
    };
  };

  const anteprima = () => {
    const modo = val("f-modo");
    document.getElementById("f-lab-data").textContent =
      tr(modo === "fine" ? "Data di consegna" : modo === "finestra" ? "Dal" : "Giorno di partenza");
    /* i campi non spariscono: restano al loro posto disattivati, cosi' la
       finestra non cambia forma mentre si compila */
    const fin = modo === "finestra";
    document.getElementById("f-al").disabled = !fin;
    document.getElementById("f-oreg").disabled = fin;
    document.getElementById("f-aiuto-al").textContent =
      fin ? tr("Fine della finestra.") : tr("Serve solo col carico ripartito.");
    document.getElementById("f-aiuto-oreg").textContent =
      fin ? tr("Col carico ripartito il ritmo lo decide la finestra.")
          : tr("Sovrascrive le ore giornaliere della persona, solo qui.");
    document.getElementById("f-oreg").placeholder =
      tr("vuoto = {0} h come da organico", capacitaPersonaGiorno(persona(val("f-persona")), val("f-inizio") || iso(new Date())));
    const box = document.getElementById("f-anteprima");
    box.hidden = false;   // i messaggi bloccanti qui sotto lo mostrano sempre; in fondo sparisce se vuoto
    if(!val("f-persona")){
      box.className = "avviso";
      box.innerHTML = "<b>"+tr("Scegli la persona")+"</b>"+tr("Indica chi farà questa attività.");
      consiglio(); aggiornaLiberate(null); return;
    }
    const perG = perGiornoForm();
    const inizio = risolviInizio();

    if(modo === "fine" && !inizio){
      box.className = "avviso";
      box.innerHTML = "<b>"+tr("Non ci sono abbastanza giorni")+"</b>"
        + tr("Con queste ore la lavorazione non entra prima della data di consegna: riduci il monte ore, alza le ore al giorno o sposta la consegna.");
      consiglio(); aggiornaLiberate(null); return;
    }
    if(modo === "finestra" && (!val("f-al") || val("f-al") < val("f-inizio"))){
      box.className = "avviso";
      box.innerHTML = "<b>"+tr("Finestra non valida")+"</b>"+tr("La data finale deve essere uguale o successiva a quella iniziale.");
      consiglio(); aggiornaLiberate(null); return;
    }

    const finto = oggettoForm();
    // lo stato (conclusa/sospesa) conta per decidere se resta in overtime, ma non entra
    // nell'anteprima: le giornate liberate dalla chiusura le calcola aggiornaLiberate
    const fattaOra = document.getElementById("f-fatta").checked, sospOra = document.getElementById("f-sospesa").checked;
    finto.straordinario = restaOvertime(a, Object.assign({}, finto,
      {fatta:fattaOra, sospesa:sospOra, dataFine:(fattaOra || sospOra) ? val("f-fine") : null}));
    const m = distribuzione(finto);
    const ch = Array.from(m.keys()).sort();
    box.className = "avviso";
    if(!ch.length){
      box.innerHTML = "<b>"+tr("Nessun giorno utile")+"</b>"
        + (modo === "finestra" ? tr("Nella finestra scelta non ci sono giorni lavorabili per questa persona.")
                               : tr("Controlla monte ore e giorno di partenza."));
      consiglio(); aggiornaLiberate(null); return;
    }
    // a tempo pieno il ritmo è il massimo davvero assegnato in un giorno: per un'attività breve
    // o divisa con altre è meno delle ore della persona
    const oreAlDi = modo === "finestra" ? orePerGiornoEff(finto)
      : (perG != null ? perG : Math.min(capacitaPersonaGiorno(persona(val("f-persona")), ch[0]), Math.max(...m.values())));
    const cap = capacitaPersonaGiorno(persona(val("f-persona")), ch[0]);
    const passato = ch[0] < iso(new Date());
    const slitta = modo === "inizio" && ch[0] !== val("f-inizio");
    /* Il riquadro mostra solo ciò che chiede attenzione: il riepilogo di date e ore al
       giorno ripeteva quello che si legge già nei campi e nel piano, ed è stato tolto. Senza
       nulla da segnalare il riquadro sparisce. */
    const righe = [];
    const allarme = t => `<b style="color:var(--allarme)">${t}</b>`;
    if(modo === "finestra" && oreAlDi > cap + 0.001)
      righe.push(allarme(tr("⚠ Servono più ore di quelle disponibili ({0} h al giorno): la finestra è troppo stretta.", cap)));
    if(passato) righe.push(allarme(tr("⚠ La partenza cade nel passato.")));
    if(slitta) righe.push(tr("Il {0} non è un giorno utile, la partenza slitta al primo disponibile.", itData(val("f-inizio"))));
    const sl = slittamentiAltre(finto);
    if(finto.straordinario) righe.push(tr("In overtime: le sue ore si aggiungono a quelle delle altre attività, senza spostarle."));
    else if(sl.length) righe.push(allarme(tr("⚠ Salvando, finiscono più tardi:")) + " "
      + sl.map(x => esc(testoSlittamento(x))).join("; ") + ". "
      + (overtimeMax() > 0 ? tr("Al salvataggio potrai scegliere se accettare lo slittamento o fare overtime.")
                           : tr("Al salvataggio ti verrà chiesto se accettare lo slittamento.")));
    box.innerHTML = righe.map(t => `<div>${t}</div>`).join("") + avvisiSequenza(ch);
    box.hidden = !box.innerHTML;
    consiglio();
    aggiornaLiberate(ch, oreAlDi);
  };

  const aggiornaLiberate = (ch, oreAlDi) => {
    const boxLib = document.getElementById("f-liberate");
    const spuntaFine = document.getElementById("f-fatta").checked || document.getElementById("f-sospesa").checked;
    document.getElementById("f-fine").disabled = !spuntaFine;
    if(!spuntaFine || !ch){ boxLib.hidden = true; }
    else {
      const fine = val("f-fine");
      const previste = ch.filter(k => !fine || k <= fine);
      const tagliate = ch.length - previste.length;
      const oreTagliate = tagliate * oreAlDi;
      boxLib.hidden = false;
      boxLib.className = tagliate > 0 ? "avviso" : "";
      boxLib.innerHTML = tagliate > 0
        ? "<b>" + (tagliate===1 ? tr("Si libera 1 giornata") : tr("Si liberano {0} giornate", tagliate)) + "</b>"
          + tr("Circa {0} h tornano disponibili su {1} dopo il {2}. Al salvataggio ti chiedo se anticipare le attività successive.",
               arr(oreTagliate), esc(persona(val("f-persona")).nome), itData(fine))
        : `<span class="nota">${tr("Nessuna giornata futura da liberare.")}</span>`;
    }
  };
  ["f-persona","f-inizio","f-al","f-ore","f-oreg","f-modo","f-fatta","f-fine","f-sospesa","f-tipologia"].forEach(i=>{
    const e = document.getElementById(i);
    e.addEventListener("input", anteprima);
    e.addEventListener("change", anteprima);
  });
  disegnaDipendenze();
  anteprima();
  // annullata implica sempre fatta: un'attività annullata è comunque risolta, non ha
  // più bisogno di attenzione. Il collegamento vive solo qui nell'editor, non come
  // vincolo nel modello dati — vedi commento su assegnazioni[].annullata in CLAUDE.md
  document.getElementById("f-annullata").addEventListener("change", e=>{
    if(e.target.checked){
      document.getElementById("f-fatta").checked = true;
      document.getElementById("f-fine").value = iso(new Date());
      document.getElementById("f-sospesa").checked = false;
    }
    anteprima();
  });
  document.getElementById("f-fatta").addEventListener("change", e=>{
    if(!e.target.checked) document.getElementById("f-annullata").checked = false;
    else document.getElementById("f-sospesa").checked = false;
    anteprima();
  });
  // sospesa NON implica fatta (l'attività non è conclusa, solo in pausa): mutuamente
  // esclusiva con fatta/annullata, non le implica né ne è implicata — vedi CLAUDE.md
  document.getElementById("f-sospesa").addEventListener("change", e=>{
    if(e.target.checked){
      document.getElementById("f-fatta").checked = false;
      document.getElementById("f-annullata").checked = false;
      document.getElementById("f-fine").value = iso(new Date());
    }
    anteprima();
  });

  document.getElementById("f-annulla").onclick = chiudi;
  if(a) document.getElementById("f-elimina").onclick = ()=>{
    const consenso = S.config.proteggiAttivita ? autorizza(tr("Eliminare questa attività?")) : confirm(tr("Eliminare questa attività?"));
    if(consenso){
      S.assegnazioni = S.assegnazioni.filter(x=>x.id!==a.id);
      dipendenzeValide(S.assegnazioni);   // chi dipendeva da lei non ne dipende più
      invalida(); segnaModificato(); chiudi(); rendi();
    }
  };
  if(a) document.getElementById("f-duplica").onclick = ()=>{
    const pre = {personaId:a.personaId, commessaId:a.commessaId};
    chiudi();
    apriAttivita(null, pre);
  };
  document.getElementById("f-ok").onclick = async ()=>{
    const modo = val("f-modo");
    const inizio = risolviInizio();
    if(modo === "fine" && !inizio){
      alert(tr("Con queste ore la lavorazione non entra prima della data di consegna: riduci il monte ore, alza le ore al giorno o sposta la consegna."));
      return;
    }
    if(modo === "finestra"){
      if(!val("f-al") || val("f-al") < val("f-inizio")){
        alert(tr("La finestra non è valida: la data finale deve essere uguale o successiva a quella iniziale."));
        return;
      }
      if(!giorniUtili(val("f-persona"), val("f-inizio"), val("f-al")).length){
        alert(tr("Nella finestra scelta non ci sono giorni lavorabili per questa persona."));
        return;
      }
    }
    const fattaChk = document.getElementById("f-fatta").checked;
    const sospesaChk = document.getElementById("f-sospesa").checked;
    const dati = {personaId:val("f-persona"), commessaId:combo.valore(), modo, dataInizio:inizio,
                  scadenza: modo === "fine" ? val("f-inizio") : modo === "finestra" ? val("f-al") : null,
                  oreTotali:numVal("f-ore"),
                  orePerGiorno: (modo === "finestra" || !val("f-oreg")) ? null : numVal("f-oreg"),
                  fatta: fattaChk,
                  dataFine: (fattaChk || sospesaChk) ? val("f-fine") : null,
                  annullata: document.getElementById("f-annullata").checked,
                  sospesa: sospesaChk,
                  note:val("f-note"), descrizione: val("f-desc"),
                  tipologiaId: val("f-tipologia") || null,
                  dipendeDa: predScelti()};
    if(!dati.personaId){ alert(tr("Scegli la persona che farà questa attività.")); return; }
    if(!dati.commessaId){ alert(tr("Scegli un progetto dall'elenco.")); return; }
    if(!dati.dataInizio || dati.oreTotali<=0){ alert(tr("Servono una data e un monte ore maggiore di zero.")); return; }
    // cambio di progetto su un'attività già collegata: le dipendenze valgono solo dentro lo
    // stesso progetto, quindi si perdono — lo si dice prima, mai in silenzio
    if(a && dati.commessaId !== a.commessaId){
      const persi = [...predecessori(a), ...successori(a)];
      if(persi.length){
        const r = await bannerScelta(tr("Spostandola su un altro progetto perde i collegamenti"),
          `<ul>${persi.map(x => `<li>${esc(nomeAttivita(x))}</li>`).join("")}</ul>
           <p class="nota">${tr("Le dipendenze valgono solo fra attività dello stesso progetto.")}</p>`,
          [{r:"annulla", eti:tr("Torna all'editor")}, {r:"sposta", eti:tr("Sposta e togli i collegamenti")}]);
        if(r !== "sposta") return;
      }
    }
    // annullandola o sospendendola ora: cosa fare delle attività che dipendono da lei
    const tipoCatena = !a ? null : (dati.annullata && !a.annullata) ? "annulla" : (dati.sospesa && !a.sospesa) ? "sospendi" : null;
    const catena = tipoCatena ? await chiediCatena(a, tipoCatena) : null;
    if(tipoCatena && catena === null) return;
    // dipendenze: non si salva se parte prima che finiscano quelle da cui dipende; la data
    // proposta finisce nei campi dell'editor, da rivedere e salvare di nuovo
    const seq = await controllaPrecedenti(Object.assign({id:a ? a.id : "nuova"}, dati));
    if(seq === null) return;
    if(seq !== "ok"){
      if(modo === "finestra") document.getElementById("f-al").value = seq.scadenza;
      document.getElementById("f-inizio").value = seq.dataInizio;
      anteprima();
      return;
    }
    // le altre attività della persona che slitterebbero: l'utente accetta lo slittamento,
    // sceglie l'overtime o torna all'editor — mai uno spostamento silenzioso
    const scelta = await decidiSlittamento(a, Object.assign({id:a ? a.id : "nuova"}, dati));
    if(scelta === null) return;
    dati.straordinario = scelta;
    const successive = await controllaSuccessive(Object.assign({id:a ? a.id : "nuova"}, dati));
    if(successive === null) return;
    const primaFine = a ? (estremi(a) || {}).al : null;
    if(a) Object.assign(a, dati);
    else S.assegnazioni.push(Object.assign({id:nuovoId("a")}, dati));
    // promozione da backlog: solo ora che l'attività è davvero salvata l'item esce dal
    // backlog — annullare questa finestra prima d'ora lo lascia intatto (vedi promuoviBacklogItem)
    if(!a && p.backlogId) S.backlog = (S.backlog||[]).filter(x=>x.id!==p.backlogId);
    // cambiando progetto, le attività del vecchio che dipendevano da questa perdono il legame
    dipendenzeValide(S.assegnazioni);
    invalida();
    spostaSuccessive(successive);
    applicaCatena(catena, tipoCatena, dati.dataFine); segnaModificato(); chiudi(); rendi();
    // se la chiusura anticipata (o la sospensione) ha liberato giornate, chiedo cosa farne
    const proponi = () => {
      if(a && (dati.fatta || dati.sospesa) && dati.dataFine && primaFine && dati.dataFine < primaFine)
        proponiAnticipo([{personaId:a.personaId, dopoIl:dati.dataFine}]);
    };
    // annullata lasciando le successive: prima la proposta di anticiparle, poi quella sopra
    if(!(catena && catena.r === "anticipa" && apriAnticipoSuccessive(a, proponi))) proponi();
  };
}
function anteprimaAttivita(id){
  const a = S.assegnazioni.find(x=>x.id===id); if(!a) return;
  const c = commessa(a.commessaId), p = persona(a.personaId), e = estremi(a);
  finestra("Attività",
    `<table><tbody>
      <tr><th style="width:130px">Progetto</th><td><span class="pastiglia" style="background:${coloreCommessa(c)}"></span><span class="mono">${esc(c.numero)}</span>${c.cliente?" · "+esc(c.cliente):""}</td></tr>
      ${c.cliente?`<tr><th>Riferimento</th><td>${esc(c.cliente)}</td></tr>`:""}
      ${c.descrizione?`<tr><th>Descrizione</th><td>${esc(c.descrizione)}</td></tr>`:""}
      <tr><th>Persona</th><td>${esc(p.nome)}</td></tr>
      ${a.descrizione?`<tr><th>Attività</th><td>${esc(a.descrizione)}</td></tr>`:""}
      <tr><th>Monte ore</th><td class="mono">${a.oreTotali} h · ${arr(orePerGiornoEff(a))} h/giorno</td></tr>
      <tr><th>Periodo</th><td class="mono">${e?itData(e.dal)+" → "+itData(e.al):"–"}</td></tr>
      <tr><th>Vincolo</th><td>${modoAtt(a)==="fine"?tr("Consegna entro il {0}", itData(a.scadenza)):modoAtt(a)==="finestra"?tr("Finestra dal {0} al {1}, carico ripartito", itData(a.dataInizio), itData(a.scadenza)):tr("Parte il {0}", itData(a.dataInizio))}</td></tr>
      ${a.annullata?`<tr><th>Stato</th><td style="color:var(--allarme)"><b>✕ Annullata</b></td></tr>`
        :a.fatta?`<tr><th>Stato</th><td style="color:var(--positivo)"><b>✓ Conclusa</b></td></tr>`:""}
      ${predecessori(a).length?`<tr><th>Parte dopo</th><td>${predecessori(a).map(x=>esc(nomeAttivita(x))).join("<br>")}</td></tr>`:""}
      ${successori(a).length?`<tr><th>${tr("Dipendono da questa")}</th><td>${successori(a).map(x=>esc(nomeAttivita(x))).join("<br>")}</td></tr>`:""}
      ${a.note?`<tr><th>Note</th><td>${esc(a.note)}</td></tr>`:""}
    </tbody></table>
    <p class="nota" style="margin-top:12px">Attiva la modifica in alto a destra per cambiare questa attività.</p>`,
    `<button class="btn" onclick="document.getElementById('velo').remove()">Chiudi</button>`);
}

// avviso "una volta sola" dopo l'aggiornamento alla ripartizione delle ore fra attività dello
// stesso giorno: compare finché il file dati non viene salvato con la versione nuova (meta.
// versioneApp, scritto da serializza), e solo se qualche attività aperta finisce davvero più
// tardi. Senza un file dati vero (demo) non c'è nulla da avvisare.
function avvisoAggiornamento(){
  if(!window.PLANNER_DATA && !manico && !salvatoIlConosciuto) return;
  const sl = slittamentiAggiornamento();
  if(!sl.length) return;
  finestra(tr("Nuove regole per le attività nello stesso giorno"),
    `<p style="margin:0 0 10px">${tr("Da questa versione una giornata non supera più le ore disponibili: le attività della stessa persona che si sovrappongono si dividono le ore, e alcune finiscono più tardi di prima. Le date salvate non cambiano, cambia il calcolo.")}</p>
     <p style="margin:0 0 6px"><b>${sl.length === 1 ? tr("1 attività finisce più tardi:") : tr("{0} attività finiscono più tardi:", sl.length)}</b></p>
     <table><thead><tr><th>${tr("Persona")}</th><th>${tr("Progetto")}</th></tr></thead><tbody>
     ${sl.map(x => { const p = persona(x.a.personaId); return `<tr><td>${esc(p ? p.nome : "?")}</td><td>${esc(testoSlittamento(x))}</td></tr>`; }).join("")}
     </tbody></table>
     <p class="nota" style="margin:10px 0 0">${tr("Questo avviso compare finché il piano non viene salvato con la nuova versione.")}</p>`,
    `<button class="btn primario" id="ag-ok">${tr("Ho capito")}</button>`);
  document.querySelector(".finestra").classList.add("larga");
  document.getElementById("ag-ok").onclick = chiudi;
}
// "25-0412 · Cliente: fine 15/10 → 16/10" — una riga per attività che slitta
function testoSlittamento(x){
  const c = commessa(x.a.commessaId);
  return tr("{0}: fine {1} → {2}", (c ? c.numero + (c.cliente ? " · " + c.cliente : "") : "?")
    + (x.a.descrizione ? " (" + x.a.descrizione + ")" : ""), itData(x.prima), itData(x.dopo));
}
// decide come salvare "nuova" (versione non ancora salvata di un'attività): se farebbe finire
// più tardi altre attività della stessa persona, chiede con un banner. Restituisce il valore
// di straordinario da salvare (true = overtime), oppure null se l'utente annulla
async function decidiSlittamento(vecchia, nuova){
  if(restaOvertime(vecchia, nuova)) return true;
  const sl = slittamentiAltre(Object.assign({}, nuova, {straordinario:false}));
  if(!sl.length) return false;
  // con l'overtime le altre restano dove sono, ma questa attività può finire più tardi se il
  // tetto della giornata (config.overtimeMax) non basta: il banner lo dice prima della scelta
  let fineOvertime = null;
  if(overtimeMax() > 0){
    const ot = Object.assign({}, nuova, {straordinario:true});
    const m = simulaPersona(ot.personaId, elencoConModifica(ot)).get(ot.id);
    fineOvertime = m && m.size ? Array.from(m.keys()).sort().pop() : null;
  }
  const r = await bannerSlittamento(nuova.personaId, sl, fineOvertime);
  return r === "overtime" ? true : r === "slitta" ? false : null;
}
// banner sopra a tutto (anche all'editor aperto, che resta com'è): slittamento, overtime o annulla
function bannerSlittamento(personaId, sl, fineOvertime){
  const p = persona(personaId);
  return bannerScelta(tr("Altre attività di {0} finirebbero più tardi", esc(p ? p.nome : "")),
    `<ul>${sl.map(x => `<li>${esc(testoSlittamento(x))}</li>`).join("")}</ul>
     <p class="nota">${overtimeMax() > 0
       ? tr("Con l'overtime le altre restano dove sono e le giornate arrivano al massimo al {0}% delle ore ordinarie.", Math.round(100 + overtimeMax()*100))
         + (fineOvertime ? " " + tr("Questa attività finirebbe il {0}.", itData(fineOvertime)) : "")
       : tr("L'overtime non è previsto: si attiva in Impostazioni → Calendario e orario → Overtime massimo.")}</p>`,
    [{r:"annulla", eti:tr("Annulla")},
     ...(overtimeMax() > 0 ? [{r:"overtime", eti:tr("Overtime")}] : []),
     {r:"slitta", eti:tr("Accetta lo slittamento"), primario:true}]);
}
/* Banner di scelta generico, sopra a tutto (anche all'editor aperto, che resta com'è).
   pulsanti = [{r, eti, primario}]: risolve con la "r" del pulsante premuto; Esc chiude solo
   il banner, non l'editor sotto, e vale "annulla". Il fuoco va sul pulsante primario.
   Con "leggi" (funzione che riceve il banner) risolve con {r, dati: leggi(banner)}, per
   raccogliere le spunte prima che il banner sparisca. */
function bannerScelta(titolo, corpo, pulsanti, leggi){
  return new Promise(risolvi => {
    const v = document.createElement("div");
    v.className = "velo-banner";
    v.innerHTML = `<div class="banner-scelta" role="alertdialog" aria-modal="true" aria-labelledby="bs-titolo">
      <b id="bs-titolo">${titolo}</b>
      ${corpo}
      <div class="bs-pulsanti">${pulsanti.map(b =>
        `<button class="btn${b.primario ? " primario" : ""}" data-r="${b.r}">${b.eti}</button>`).join("")}</div></div>`;
    const fine = r => { window.removeEventListener("keydown", esc_, true);
      const dati = leggi ? leggi(v) : null; v.remove(); risolvi(leggi ? {r, dati} : r); };
    // Esc chiude solo il banner, non l'editor sotto: intercettato prima di escChiudi
    const esc_ = e => { if(e.key === "Escape"){ e.stopImmediatePropagation(); e.preventDefault(); fine("annulla"); } };
    window.addEventListener("keydown", esc_, true);
    v.querySelectorAll("[data-r]").forEach(b => b.onclick = () => fine(b.dataset.r));
    document.body.appendChild(v);
    (v.querySelector(".bs-pulsanti .primario") || v.querySelector(".bs-pulsanti [data-r]")).focus();
  });
}

/* Dipendenze fine-inizio al salvataggio. Un'attività non si salva se parte prima che sia
   finita una da cui dipende: niente "salva comunque" — per partire prima bisogna togliere la
   dipendenza, cioè dichiarare apertamente che non c'è. Il banner propone la prima partenza
   utile (partenzaInSequenza), che l'utente applica con un clic: nulla si sposta da solo.
   Restituisce la versione proposta se l'utente la sceglie, null se annulla, "ok" se non c'è
   nessun blocco. */
async function controllaPrecedenti(nuova){
  const b = blocchiSequenza(nuova);
  if(!b.length) return "ok";
  const prop = partenzaInSequenza(nuova);
  const eProp = prop ? estremiConModifica(prop, prop) : null;
  const r = await bannerScelta(tr("Non può partire prima che finiscano le attività da cui dipende"),
    `<ul>${b.map(x => `<li>${x.sospesa
        ? tr("“{0}” è sospesa: non è finita.", esc(nomeAttivita(x.p)))
        : tr("“{0}” finisce il {1}.", esc(nomeAttivita(x.p)), itData(x.fine))}</li>`).join("")}</ul>
     <p class="nota">${eProp ? tr("Partirebbe il {0}.", itData(b[0].dal))
       : b.some(x => x.sospesa) ? tr("Un'attività sospesa non ha una fine: riprendila o togli la dipendenza.")
       : tr("Con “Consegna entro il” la partenza la decide la consegna: spostala più avanti.")}
       ${tr("Se non dipende davvero da queste, toglile da “Parte dopo”.")}</p>`,
    [{r:"annulla", eti:tr("Annulla")},
     ...(eProp ? [{r:"proposta", eti:tr("Parti il {0}", itData(eProp.dal)), primario:true}] : [])]);
  return r === "proposta" ? prop : null;
}
/* Le attività che dipendono da "nuova" e che, salvandola, partirebbero prima della sua nuova
   fine: lo slittamento di un'attività a monte non si vieta (è la realtà), si dice. Risolve con
   [] se non c'è nulla da chiedere, con l'elenco da spostare dopo il salvataggio se l'utente
   sceglie di spostarle, con false se salva lasciandole dove sono, con null se annulla.
   "applica": i pulsanti dicono "Applica" invece di "Salva" (riassegnazioni suggerite). */
async function controllaSuccessive(nuova, applica){
  const sc = successoriScavalcati(nuova);
  if(!sc.length) return [];
  const r = await bannerScelta(tr("Finirebbe dopo la partenza di attività che dipendono da questa"),
    `<ul>${sc.map(x => `<li>${tr("“{0}” parte il {1}, la nuova fine di questa è il {2}.",
        esc(nomeAttivita(x.s)), itData(x.dal), itData(x.fine))}</li>`).join("")}</ul>
     <p class="nota">${tr("Se le lasci dove sono restano segnate ⚠ fuori sequenza nel piano finché qualcuno non le sposta.")}</p>`,
    [{r:"annulla", eti:tr("Annulla")},
     {r:"lascia", eti:applica ? tr("Applica e lasciale dove sono") : tr("Salva e lasciale dove sono")},
     {r:"sposta", eti:applica ? tr("Applica e spostale dopo") : tr("Salva e spostale dopo"), primario:true}]);
  return r === "sposta" ? sc.map(x => x.s) : r === "lascia" ? false : null;
}
// dopo il salvataggio: sposta in avanti le attività scelte nel banner, ciascuna alla sua prima
// partenza utile; quelle che non si possono spostare (consegna fissa) restano segnalate
function spostaSuccessive(elenco){
  if(!elenco || !elenco.length) return;
  const ferme = [];
  elenco.forEach(x => {
    const prop = partenzaInSequenza(x);
    if(!prop){ if(blocchiSequenza(x).length) ferme.push(x); return; }
    x.dataInizio = prop.dataInizio;
    if(modoAtt(x) === "finestra") x.scadenza = prop.scadenza;
    invalida();
  });
  if(ferme.length) brindisi(tr("Non spostate (consegna fissa o attività sospesa): {0}", ferme.map(nomeAttivita).join("; ")));
}

/* Annullare o sospendere un'attività da cui ne dipendono altre: banner con tutta la catena a
   valle (catenaAValle). Spuntate di default quelle che dipendono solo da questa catena; a
   parte, senza spunta, quelle che dipendono anche da un'altra attività ancora aperta.
   Annullando: annulla anche le spuntate / lasciale e anticipale / lasciale dove sono.
   Sospendendo: sospendi anche le spuntate / lasciale dove sono. "Torna all'editor" non salva
   nulla. Risolve con null (torna all'editor), oppure {r, ids}. Nessuna catena: {r:"lascia"}. */
async function chiediCatena(a, tipo){
  const sosp = tipo === "sospendi";
  const cat = catenaAValle(a, sosp);
  if(!cat.length) return {r:"lascia", ids:[]};
  const voce = c => { const e = estremi(c.x);
    return `<label class="spunta bs-voce"><input type="checkbox" data-spunta="${c.x.id}" ${c.piena ? "checked" : ""}>
      <span>${esc(nomeAttivita(c.x))} <span class="nota mono">${e ? itData(e.dal) + " – " + itData(e.al) : "–"}</span>${
      c.altri.length ? `<span class="nota"> · ${tr("dipende anche da {0}", c.altri.map(p => "“" + esc(nomeAttivita(p)) + "”").join(", "))}</span>` : ""}</span></label>`; };
  const piene = cat.filter(c => c.piena), parte = cat.filter(c => !c.piena);
  const r = await bannerScelta(sosp
      ? tr("Sospendere anche le attività che dipendono da questa?")
      : tr("Annullare anche le attività che dipendono da questa?"),
    `<div class="bs-elenco">${piene.map(voce).join("")}
     ${parte.length ? `<p class="nota" style="margin:8px 0 2px">${tr("Dipendono anche da altre attività ancora aperte:")}</p>${parte.map(voce).join("")}` : ""}</div>
     <p class="nota">${sosp
       ? tr("Se le lasci dove sono, restano ⚠ fuori sequenza: aspettano un'attività ferma. Riprenderle resta sempre manuale.")
       : tr("Se questa attività non serve più perché il lavoro è già stato fatto o c'è una strada più veloce, quelle che dipendono da lei possono partire prima.")}</p>`,
    [{r:"annulla", eti:tr("Torna all'editor")}, {r:"lascia", eti:tr("Lasciale dove sono")},
     ...(sosp ? [] : [{r:"anticipa", eti:tr("Lasciale e anticipale")}]),
     {r:"tutte", eti:sosp ? tr("Sospendi anche le spuntate") : tr("Annulla anche le spuntate")}],
    v => Array.from(v.querySelectorAll("[data-spunta]:checked")).map(c => c.dataset.spunta));
  return r.r === "annulla" ? null : {r:r.r, ids:r.dati};
}
// applica la scelta del banner, dopo il salvataggio dell'attività: stessa data di fine/sospensione
function applicaCatena(scelta, tipo, dataFine){
  if(!scelta || scelta.r !== "tutte") return;
  scelta.ids.map(id => S.assegnazioni.find(x => x.id === id)).filter(Boolean).forEach(x => {
    if(tipo === "sospendi"){ x.sospesa = true; x.dataFine = dataFine; }
    else {
      // come annullando un progetto: una sospesa tiene il troncamento già congelato
      if(!x.sospesa) x.dataFine = dataFine;
      x.fatta = true; x.annullata = true; x.sospesa = false;
    }
  });
  invalida();
}
/* Dopo l'annullamento: finestra con le attività che dipendevano direttamente da questa, la
   partenza attuale, quella proposta e se il calendario della persona è libero. Spuntate di
   default solo quelle che non fanno finire più tardi altro. "poi" viene chiamata alla
   chiusura (la proposta di anticipo delle attività della stessa persona). Falso se non c'è
   niente da proporre. */
function apriAnticipoSuccessive(a, poi){
  const pr = proposteAnticipo(a);
  if(!pr.length){ brindisi(tr("Nessuna attività da anticipare")); return false; }
  finestra(tr("Anticipare le attività che dipendevano da questa?"),
    `<table><thead><tr><th style="width:30px"></th><th>${tr("Chi e cosa")}</th><th>${tr("Ora")}</th><th>${tr("Proposta")}</th><th>${tr("Calendario")}</th></tr></thead><tbody>
     ${pr.map(z => `<tr><td>${z.nuova ? `<input type="checkbox" data-anticipa="${z.x.id}" ${z.sl.length ? "" : "checked"}>` : ""}</td>
       <td>${esc(nomeAttivita(z.x))}</td><td class="mono">${itData(z.e.dal)}</td>
       <td class="mono">${z.nuova ? itData(z.dal) : "–"}</td>
       <td>${z.motivo === "consegna" ? `<span class="nota">${tr("Consegna fissa: la partenza la decide la consegna.")}</span>`
           : z.motivo === "sospesa" ? `<span class="nota">${tr("Dipende anche da “{0}”, che è sospesa.", esc(nomeAttivita(z.da)))}</span>`
           : z.sl.length ? `<span style="color:var(--allarme)">${tr("⚠ Non libero, finiscono più tardi:")}</span> ${z.sl.map(q => esc(testoSlittamento(q))).join("; ")}`
           : tr("Libero")}</td></tr>`).join("")}
     </tbody></table>`,
    `<button class="btn" id="as-no">${tr("Non anticipare")}</button>
     <button class="btn primario" id="as-ok">${tr("Anticipa le selezionate")}</button>`);
  document.querySelector(".finestra").classList.add("larga");
  const fine = () => { chiudi(); rendi(); if(poi) poi(); };
  document.getElementById("as-no").onclick = fine;
  document.getElementById("as-ok").onclick = () => {
    const ids = Array.from(document.querySelectorAll("[data-anticipa]:checked")).map(c => c.dataset.anticipa);
    pr.filter(z => z.nuova && ids.includes(z.x.id)).forEach(z => {
      z.x.dataInizio = z.nuova.dataInizio;
      if(modoAtt(z.x) === "finestra") z.x.scadenza = z.nuova.scadenza;
    });
    if(ids.length){ invalida(); segnaModificato(); brindisi(tr(ids.length === 1 ? "{0} attività anticipata" : "{0} attività anticipate", ids.length)); }
    fine();
  };
  return true;
}

// dopo una chiusura anticipata (o il fermo di un intero progetto): a chi ha liberato giornate
// propone di spostare avanti le attività successive. Una finestra sola, una sezione per
// persona con il suo nome come titolo. voci: [{personaId, dopoIl}]. Le attività concluse,
// annullate o sospese non si propongono: non hanno una partenza da anticipare.
function proponiAnticipo(voci){
  const sezioni = voci.map(v => {
    const candidate = S.assegnazioni.filter(x=>{
      if(x.personaId !== v.personaId || x.fatta || x.sospesa) return false;
      const e = estremi(x);
      return e && e.dal > v.dopoIl;
    }).map(x=>({x, e:estremi(x)})).sort((u,w)=> u.e.dal < w.e.dal ? -1 : 1).slice(0, 20);
    return {p:persona(v.personaId), dopoIl:v.dopoIl, candidate, primoUtile:giornoUtile(v.personaId, v.dopoIl)};
  }).filter(z => z.p && z.candidate.length).sort((u,w)=> perNome(u.p, w.p));
  if(!sezioni.length) return false;

  finestra("Anticipare le attività successive?",
    sezioni.map((z,i)=>`<div class="sc-sezione" data-sezione="${i}"${i?' style="margin-top:18px"':""}>
     <h5 class="titoletto din">${esc(z.p.nome)}</h5>
     <p style="margin:0 0 12px">${tr("{0} ha capacità libera dopo il {1}. Scegli quali lavorazioni anticipare: quelle che lasci ferme restano dove sono.", esc(z.p.nome), itData(z.dopoIl))}</p>
     <div class="campo"><label for="an-data-${i}">${tr("Fai partire la prima dal")}</label>
       <input type="date" id="an-data-${i}" value="${z.primoUtile}">
       <span class="aiuto">${tr("Le altre selezionate slittano della stessa quantità, mantenendo le distanze tra loro.")}</span></div>
     <table><thead><tr><th style="width:30px"></th><th>Progetto</th><th>Dal</th><th>Al</th><th class="num-cella">Ore</th></tr></thead><tbody>
     ${z.candidate.map((k,idx)=>{
       const cz = commessa(k.x.commessaId);
       return `<tr><td><input type="checkbox" data-anticipa="${k.x.id}" ${idx===0?"checked":""}></td>
         <td><span class="pastiglia" style="background:${coloreCommessa(cz)}"></span><span class="mono">${cz?esc(cz.numero):"?"}</span>${cz&&cz.cliente?" · "+esc(cz.cliente):""}</td>
         <td class="mono">${itData(k.e.dal)}</td><td class="mono">${itData(k.e.al)}</td>
         <td class="num-cella mono">${arr(k.e.ore)}</td></tr>`;
     }).join("")}
     </tbody></table></div>`).join(""),
    `<button class="btn" id="an-no">Non spostare niente</button>
     <button class="btn primario" id="an-ok">Anticipa le selezionate</button>`);
  document.querySelector(".finestra").classList.add("larga");
  document.getElementById("an-no").onclick = chiudi;
  document.getElementById("an-ok").onclick = ()=>{
    // ogni sezione ha la sua data: le selezionate di quella persona slittano tutte dello stesso delta
    const spostamenti = [];
    sezioni.forEach((z,i)=>{
      const scelte = Array.from(document.querySelectorAll(`[data-sezione="${i}"] [data-anticipa]:checked`))
        .map(c => S.assegnazioni.find(x=>x.id===c.dataset.anticipa)).filter(Boolean);
      if(!scelte.length) return;
      const prima = scelte.map(x=>estremi(x)).filter(Boolean).map(e=>e.dal).sort()[0];
      const delta = diffGiorni(prima, val("an-data-" + i));
      scelte.forEach(x => spostamenti.push({x, nuova:Object.assign({}, x,
        {dataInizio: iso(sommaGiorni(d(x.dataInizio), delta))},
        x.scadenza ? {scadenza: iso(sommaGiorni(d(x.scadenza), delta))} : {})}));
    });
    if(!spostamenti.length){ chiudi(); return; }
    // dipendenze: nessuna può partire prima che finisca un'attività da cui dipende
    const bloccate = spostamenti.map(z => ({x:z.x, b:blocchiSequenza(z.nuova)})).filter(z => z.b.length);
    if(bloccate.length){
      alert(tr("Non si può anticipare così:") + "\n" + bloccate.map(z => "• " + nomeAttivita(z.x) + " — "
        + z.b.map(q => q.sospesa ? tr("“{0}” è sospesa: non è finita.", nomeAttivita(q.p))
                                 : tr("“{0}” finisce il {1}.", nomeAttivita(q.p), itData(q.fine))).join(" ")).join("\n")
        + "\n" + tr("Scegli una data più avanti o non selezionarle."));
      return;
    }
    spostamenti.forEach(z=>{ z.x.dataInizio = z.nuova.dataInizio; if(z.x.scadenza) z.x.scadenza = z.nuova.scadenza; });
    invalida(); segnaModificato(); chiudi(); rendi();
    brindisi(tr(spostamenti.length===1 ? "{0} attività anticipata" : "{0} attività anticipate", spostamenti.length));
  };
  return true;
}
// primo giorno utile per la persona, a partire dal giorno dopo quello indicato
function giornoUtile(personaId, dopoIl){
  let cur = sommaGiorni(d(dopoIl), 1), giri = 0;
  while(giri++ < 400){
    const k = iso(cur);
    if(eLavorativo(k) && !assenzaTotale(personaId, k)) return k;
    cur = sommaGiorni(cur, 1);
  }
  return iso(sommaGiorni(d(dopoIl), 1));
}

function apriGruppo(id){
  const g = id ? gruppo(id) : null;
  const membri = g ? S.persone.filter(p=>p.gruppoId===g.id).sort(perNome) : [];
  const corpo = `
    <div class="riga-campi">
      <div class="campo" style="flex:0 1 110px"><label for="g-sigla">Sigla</label>
        <input type="text" id="g-sigla" maxlength="4" value="${esc(g?g.sigla:"")}">
        <span class="aiuto">Da 2 a 4 lettere.</span></div>
      <div class="campo" style="flex:2 1 240px"><label for="g-nome">Nome del gruppo</label>
        <input type="text" id="g-nome" value="${esc(g?g.nome:"")}"></div>
    </div>
    ${g&&membri.length?`<p class="nota">${tr(membri.length===1?"Assegnato a {0} persona: {1}.":"Assegnato a {0} persone: {1}.", membri.length, membri.map(p=>esc(p.nome)).join(", "))}</p>`:""}`;
  const piede = `${g?'<button class="btn pericolo sinistra" id="g-elimina">Elimina</button>':""}
    <button class="btn" id="g-annulla">Annulla</button><button class="btn primario" id="g-ok">Salva</button>`;
  finestra(g?"Modifica gruppo":"Nuovo gruppo", corpo, piede);
  document.getElementById("g-annulla").onclick = chiudi;
  if(g) document.getElementById("g-elimina").onclick = ()=>{
    if(membri.length){
      alert(tr("Il gruppo ha {0} persone assegnate: spostale in un altro gruppo prima di eliminarlo.", membri.length));
      return;
    }
    if(S.gruppi.length <= 1){ alert(tr("Deve restare almeno un gruppo.")); return; }
    if(!autorizza(tr("Eliminare questo gruppo?"))) return;
    S.gruppi = S.gruppi.filter(x=>x.id!==g.id);
    S.persone.forEach(p=>{ p.gruppiExtra = (p.gruppiExtra||[]).filter(x=>x!==g.id); });
    segnaModificato(); chiudi(); rendi();
  };
  document.getElementById("g-ok").onclick = ()=>{
    const sigla = val("g-sigla").toUpperCase(), nome = val("g-nome");
    if(!sigla || !nome){ alert(tr("Servono sigla e nome del gruppo.")); return; }
    if(g) Object.assign(g, {sigla, nome});
    else S.gruppi.push({id:nuovoId("g"), sigla, nome});
    segnaModificato(); chiudi(); rendi();
  };
}

// distingue, dentro uno stesso gruppo, chi non fa lo stesso lavoro — vedi candidatiPersona() in calcoli.js
function apriMansione(id){
  const m = id ? mansione(id) : null;
  const membri = m ? S.persone.filter(p=>p.mansioneId===m.id).sort(perNome) : [];
  const corpo = `
    <div class="riga-campi">
      <div class="campo" style="flex:0 1 110px"><label for="m-sigla">Sigla</label>
        <input type="text" id="m-sigla" maxlength="4" value="${esc(m?m.sigla:"")}">
        <span class="aiuto">Da 2 a 4 lettere.</span></div>
      <div class="campo" style="flex:2 1 240px"><label for="m-nome">Nome della mansione</label>
        <input type="text" id="m-nome" value="${esc(m?m.nome:"")}" placeholder="Es. Progettista elettrico"></div>
    </div>
    ${m&&membri.length?`<p class="nota">${tr(membri.length===1?"Assegnata a {0} persona: {1}.":"Assegnata a {0} persone: {1}.", membri.length, membri.map(p=>esc(p.nome)).join(", "))}</p>`:""}`;
  const piede = `${m?'<button class="btn pericolo sinistra" id="m-elimina">Elimina</button>':""}
    <button class="btn" id="m-annulla">Annulla</button><button class="btn primario" id="m-ok">Salva</button>`;
  finestra(m?"Modifica mansione":"Nuova mansione", corpo, piede);
  document.getElementById("m-annulla").onclick = chiudi;
  if(m) document.getElementById("m-elimina").onclick = ()=>{
    if(membri.length && !autorizza(tr("{0} persone hanno questa mansione: resteranno senza. Procedere?", membri.length))) return;
    if(!membri.length && !autorizza(tr("Eliminare questa mansione?"))) return;
    S.mansioni = S.mansioni.filter(x=>x.id!==m.id);
    S.persone.forEach(p=>{ if(p.mansioneId===m.id) p.mansioneId = null; });
    segnaModificato(); chiudi(); rendi();
  };
  document.getElementById("m-ok").onclick = ()=>{
    const sigla = val("m-sigla").toUpperCase(), nome = val("m-nome");
    if(!sigla || !nome){ alert(tr("Servono sigla e nome della mansione.")); return; }
    if(m) Object.assign(m, {sigla, nome});
    else S.mansioni.push({id:nuovoId("m"), sigla, nome});
    segnaModificato(); chiudi(); rendi();
  };
}

// tipologia di progetto (ex "natura"): stesso principio delle mansioni, elenco personalizzabile
function apriTipologia(id){
  const t = id ? natura(id) : null;
  const usate = t ? S.commesse.filter(c=>c.natura===t.id) : [];
  const corpo = `
    <div class="riga-campi">
      <div class="campo" style="flex:0 1 110px"><label for="t-sigla">Sigla</label>
        <input type="text" id="t-sigla" maxlength="4" value="${esc(t?t.sigla:"")}">
        <span class="aiuto">Da 2 a 4 lettere.</span></div>
      <div class="campo" style="flex:2 1 240px"><label for="t-nome">Nome della tipologia</label>
        <input type="text" id="t-nome" value="${esc(t?t.nome:"")}" placeholder="Es. Manutenzione"></div>
    </div>
    <label class="spunta"><input type="checkbox" id="t-consegna" ${t&&t.richiedeConsegna?"checked":""}> Richiede una consegna concordata</label>
    <span class="aiuto">Se attiva, i progetti attivi di questa tipologia senza consegna concordata compaiono come segnalazione nella loro scheda.</span>
    ${t&&usate.length?`<p class="nota">${tr(usate.length===1?"Usata da {0} progetto: {1}.":"Usata da {0} progetti: {1}.", usate.length, usate.map(c=>esc(c.numero)).join(", "))}</p>`:""}`;
  const piede = `${t?'<button class="btn pericolo sinistra" id="t-elimina">Elimina</button>':""}
    <button class="btn" id="t-annulla">Annulla</button><button class="btn primario" id="t-ok">Salva</button>`;
  finestra(t?"Modifica tipologia":"Nuova tipologia", corpo, piede);
  document.getElementById("t-annulla").onclick = chiudi;
  if(t) document.getElementById("t-elimina").onclick = ()=>{
    if(usate.length && !autorizza(tr("{0} progetti hanno questa tipologia: resteranno senza. Procedere?", usate.length))) return;
    if(!usate.length && !autorizza(tr("Eliminare questa tipologia?"))) return;
    S.tipologie = S.tipologie.filter(x=>x.id!==t.id);
    S.commesse.forEach(c=>{ if(c.natura===t.id) c.natura = null; });
    segnaModificato(); chiudi(); rendi();
  };
  document.getElementById("t-ok").onclick = ()=>{
    const sigla = val("t-sigla").toUpperCase(), nome = val("t-nome");
    if(!sigla || !nome){ alert(tr("Servono sigla e nome della tipologia.")); return; }
    const richiedeConsegna = document.getElementById("t-consegna").checked;
    if(t) Object.assign(t, {sigla, nome, richiedeConsegna});
    else S.tipologie.push({id:nuovoId("t"), sigla, nome, richiedeConsegna});
    segnaModificato(); chiudi(); rendi();
  };
}

// festività nazionale personalizzabile — vedi giornoVoceFestivita()/testoVoceFestivita() in utilita-date.js
function apriFestivita(id){
  const v = id ? festivita(id) : null;
  const tipo = v ? v.tipo : "fissa";
  const opzMesi = sel => MESI.map((m,i)=>`<option value="${i+1}" ${sel===i+1?"selected":""}>${tr(m)}</option>`).join("");
  const opzGiorniSett = sel => NOMI_GG_SETT.map((n,i)=>`<option value="${i}" ${sel===i?"selected":""}>${tr(n)}</option>`).join("");
  const corpo = `
    <div class="riga-campi">
      <div class="campo" style="flex:2 1 220px"><label for="fe-nome">Nome</label>
        <input type="text" id="fe-nome" value="${esc(v?v.nome:"")}"></div>
      <div class="campo" style="flex:1 1 200px"><label for="fe-tipo">Tipo</label>
        <select id="fe-tipo">
          <option value="fissa" ${tipo==="fissa"?"selected":""}>Data fissa</option>
          <option value="pasqua" ${tipo==="pasqua"?"selected":""}>Relativa a Pasqua</option>
          <option value="settimana" ${tipo==="settimana"?"selected":""}>N-esimo giorno della settimana</option>
        </select></div>
    </div>
    <div class="riga-campi" data-campi="fissa">
      <div class="campo" style="flex:0 1 110px"><label for="fe-giorno">Giorno</label>
        <input type="number" id="fe-giorno" min="1" max="31" value="${v&&v.tipo==="fissa"?v.giorno:1}"></div>
      <div class="campo"><label for="fe-mese-fissa">Mese</label>
        <select id="fe-mese-fissa">${opzMesi(v&&v.tipo==="fissa"?v.mese:1)}</select></div>
    </div>
    <div class="campo" data-campi="pasqua">
      <label for="fe-offset">Giorni da Pasqua</label>
      <input type="number" id="fe-offset" step="1" value="${v&&v.tipo==="pasqua"?v.offset:1}">
      <span class="aiuto">Negativo = prima di Pasqua (es. −2 per il Venerdì Santo), positivo = dopo (es. 1 per il Lunedì dell'Angelo).</span>
    </div>
    <div class="riga-campi" data-campi="settimana">
      <div class="campo"><label for="fe-mese-sett">Mese</label>
        <select id="fe-mese-sett">${opzMesi(v&&v.tipo==="settimana"?v.mese:1)}</select></div>
      <div class="campo"><label for="fe-giorno-sett">Giorno della settimana</label>
        <select id="fe-giorno-sett">${opzGiorniSett(v&&v.tipo==="settimana"?v.giornoSettimana:1)}</select></div>
      <div class="campo"><label for="fe-occorrenza">Occorrenza</label>
        <select id="fe-occorrenza">
          ${[1,2,3,4].map(n=>`<option value="${n}" ${v&&v.tipo==="settimana"&&v.occorrenza===n?"selected":""}>${n}°</option>`).join("")}
          <option value="-1" ${v&&v.tipo==="settimana"&&v.occorrenza===-1?"selected":""}>Ultimo</option>
        </select></div>
    </div>`;
  const piede = `${v?'<button class="btn pericolo sinistra" id="fe-elimina">Elimina</button>':""}
    <button class="btn" id="fe-annulla">Annulla</button><button class="btn primario" id="fe-ok">Salva</button>`;
  finestra(v?"Modifica festività":"Nuova festività", corpo, piede);
  const mostraCampi = () => {
    const t = val("fe-tipo");
    document.querySelectorAll("[data-campi]").forEach(el => el.hidden = el.dataset.campi !== t);
  };
  mostraCampi();
  document.getElementById("fe-tipo").addEventListener("change", mostraCampi);
  document.getElementById("fe-annulla").onclick = chiudi;
  if(v) document.getElementById("fe-elimina").onclick = ()=>{
    if(!autorizza(tr("Eliminare questa festività?"))) return;
    S.config.festivitaNazionali = S.config.festivitaNazionali.filter(x=>x.id!==v.id);
    invalida(); segnaModificato(); chiudi(); rendi();
  };
  document.getElementById("fe-ok").onclick = ()=>{
    const nome = val("fe-nome");
    if(!nome){ alert(tr("Serve il nome della festività.")); return; }
    const t = val("fe-tipo");
    let dati;
    if(t === "fissa") dati = {tipo:t, mese:+val("fe-mese-fissa"), giorno:Math.min(31,Math.max(1,+val("fe-giorno")||1))};
    else if(t === "pasqua") dati = {tipo:t, offset:parseInt(val("fe-offset"))||0};
    else dati = {tipo:t, mese:+val("fe-mese-sett"), giornoSettimana:+val("fe-giorno-sett"), occorrenza:+val("fe-occorrenza")};
    dati.nome = nome;
    if(v){
      // ripulisce i campi del tipo precedente, se cambiato (es. da "pasqua" a "fissa")
      delete v.mese; delete v.giorno; delete v.offset; delete v.giornoSettimana; delete v.occorrenza;
      Object.assign(v, dati);
    } else {
      S.config.festivitaNazionali.push(Object.assign({id:nuovoId("fe")}, dati));
    }
    invalida(); segnaModificato(); chiudi(); rendi();
  };
}

function apriBacklogItem(id){
  if(!modificabile) return;
  const it = id ? backlogItem(id) : null;
  const corpo = `
    <div class="campo"><label for="bk-titolo">Titolo</label>
      <input type="text" id="bk-titolo" value="${esc(it?it.titolo:"")}" placeholder="Es. Richiesta cliente, idea, task fuori progetto"></div>
    <div class="campo"><label for="bk-descrizione">Descrizione</label>
      <textarea id="bk-descrizione" rows="3">${esc(it?it.descrizione||"":"")}</textarea></div>
    <div class="riga-campi">
      <div class="campo"><label for="bk-priorita">Priorità</label><select id="bk-priorita">
        ${Object.keys(PRIORITA_BACKLOG).map(k=>`<option value="${k}" ${(it?it.priorita:"media")===k?"selected":""}>${tr(PRIORITA_BACKLOG[k])}</option>`).join("")}
      </select></div>
      <div class="campo"><label for="bk-stato">Stato</label><select id="bk-stato">
        ${Object.keys(STATI_BACKLOG).map(k=>`<option value="${k}" ${(it?it.stato:"dafare")===k?"selected":""}>${tr(STATI_BACKLOG[k])}</option>`).join("")}
      </select></div>
      <div class="campo"><label for="bk-owner">Responsabile</label><select id="bk-owner">
        <option value="">${tr("— nessuno —")}</option>${opzioniPersone(it?it.ownerId:"")}
      </select></div>
    </div>`;
  const piede = `${it?'<button class="btn pericolo sinistra" id="bk-elimina">Elimina</button>':""}
    <button class="btn" id="bk-annulla">Annulla</button><button class="btn primario" id="bk-ok">Salva</button>`;
  finestra(it?"Modifica elemento backlog":"Nuovo elemento backlog", corpo, piede);
  document.getElementById("bk-annulla").onclick = chiudi;
  if(it) document.getElementById("bk-elimina").onclick = ()=>{
    if(!autorizza(tr("Eliminare questo elemento dal backlog?"))) return;
    S.backlog = S.backlog.filter(x=>x.id!==it.id);
    segnaModificato(); chiudi(); rendi();
  };
  document.getElementById("bk-ok").onclick = ()=>{
    const titolo = val("bk-titolo");
    if(!titolo){ alert(tr("Serve il titolo.")); return; }
    const dati = {titolo, descrizione: val("bk-descrizione"), priorita: val("bk-priorita"),
                  stato: val("bk-stato"), ownerId: val("bk-owner") || null};
    if(it) Object.assign(it, dati);
    else S.backlog.push(Object.assign({id:nuovoId("bk"), creato:iso(new Date())}, dati));
    segnaModificato(); chiudi(); rendi();
  };
}

// apre l'editor attività pre-compilato da un elemento di backlog: l'item resta nel backlog
// finché l'attività non viene davvero salvata (vedi apriAttivita) — annullare la finestra
// non deve far sparire nulla, non c'è "doppia gestione" finché la promozione non è confermata
function promuoviBacklogItem(id){
  if(!modificabile) return;
  const it = backlogItem(id); if(!it) return;
  apriAttivita(null, {personaId: it.ownerId, descrizione: it.titolo, backlogId: it.id});
}

function apriPersona(id){
  const p = id ? persona(id) : null;
  const corpo = `
    <div class="campo"><label for="p-nome">Nome e cognome</label><input type="text" id="p-nome" value="${esc(p?p.nome:"")}"></div>
    <div class="riga-campi">
      <div class="campo"><label for="p-gruppo">Gruppo principale</label><select id="p-gruppo">
        ${S.gruppi.map(g=>`<option value="${g.id}" ${p&&p.gruppoId===g.id?"selected":""}>${esc(g.nome)}</option>`).join("")}
      </select></div>
      <div class="campo"><label for="p-mansione">Mansione</label><select id="p-mansione">
        <option value="">— nessuna —</option>
        ${(S.mansioni||[]).map(m=>`<option value="${m.id}" ${p&&p.mansioneId===m.id?"selected":""}>${esc(m.nome)}</option>`).join("")}
      </select><span class="aiuto">Distingue chi, nello stesso gruppo, non fa lo stesso lavoro. Si gestiscono in Organico → Gruppi e mansioni.</span></div>
      <div class="campo"><label for="p-ore">Ore al giorno — part-time</label>
        <input type="number" id="p-ore" min="0" step="0.5" placeholder="segue i giorni lavorativi" value="${p&&p.oreGiorno?p.oreGiorno:""}">
        <span class="aiuto">Vuoto = segue le ore del giorno impostate in Impostazioni. Compila solo se questa persona lavora meno ore di un giorno pieno.</span></div>
    </div>
    <div class="campo"><label>Anche operativo in</label><div class="caselle">
      ${S.gruppi.map(g=>`<label><input type="checkbox" data-extra="${g.id}" ${p&&(p.gruppiExtra||[]).includes(g.id)?"checked":""}> ${esc(g.nome)}</label>`).join("")}
    </div><span class="aiuto">La persona resta su una sola riga, quella del gruppo principale, ma in Verifiche può essere proposta come sostituto anche in questi gruppi.</span></div>
    <div class="campo"><label for="p-smart">Deroga al limite di smart working</label>
      <input type="number" id="p-smart" min="0" max="7" step="1" placeholder="${tr("{0} giorni a settimana", S.config.smartMaxSettimana)}" value="${p&&p.smartMax!=null?p.smartMax:""}">
      <span class="aiuto">Vuoto = limite generale. Compila solo per chi ha un'autorizzazione diversa.</span></div>
    <div class="campo"><label class="spunta"><input type="checkbox" id="p-attivo" ${!p||p.attivo!==false?"checked":""}> In organico</label></div>`;
  const piede = `${p?'<button class="btn pericolo sinistra" id="p-elimina">Elimina</button>':""}
    <button class="btn" id="p-annulla">Annulla</button><button class="btn primario" id="p-ok">Salva</button>`;
  finestra(p?"Modifica persona":"Nuova persona", corpo, piede)
    .querySelector(".finestra").classList.add("larga");
  document.getElementById("p-annulla").onclick = chiudi;
  if(p) document.getElementById("p-elimina").onclick = ()=>{
    const n = S.assegnazioni.filter(a=>a.personaId===p.id).length;
    if(!autorizza(n ? tr("Questa persona ha {0} attività pianificate che verranno eliminate. Procedere?", n) : tr("Eliminare questa persona?"))) return;
    S.persone = S.persone.filter(x=>x.id!==p.id);
    S.assegnazioni = S.assegnazioni.filter(a=>a.personaId!==p.id);
    S.assenze = S.assenze.filter(a=>a.personaId!==p.id);
    // il backlog non si elimina con la persona: gli elementi restano, senza responsabile
    (S.backlog||[]).forEach(b=>{ if(b.ownerId===p.id) b.ownerId = null; });
    // riunioni e formazione: esce dai partecipanti; un evento rimasto senza nessuno sparisce
    (S.eventi||[]).forEach(e=>{ e.personeIds = e.personeIds.filter(id=>id!==p.id); });
    S.eventi = (S.eventi||[]).filter(e=>e.personeIds.length);
    invalida(); segnaModificato(); chiudi(); rendi();
  };
  document.getElementById("p-ok").onclick = ()=>{
    const nome = val("p-nome");
    if(!nome){ alert(tr("Serve il nome.")); return; }
    const extra = Array.from(document.querySelectorAll("[data-extra]")).filter(c=>c.checked).map(c=>c.dataset.extra);
    const ore = val("p-ore") ? numVal("p-ore") : null;
    const inOrganico = document.getElementById("p-attivo").checked;
    if(p && p.attivo !== false && !inOrganico){
      const n = S.assegnazioni.filter(x=>x.personaId===p.id).length;
      if(!autorizza(tr("Togliendo {0} dall'organico le sue {1} attività spariscono dal calendario. I dati restano nel file. Procedere?", nome, n))) return;
    }
    const dati = {nome, gruppoId:val("p-gruppo"), gruppiExtra:extra.filter(g=>g!==val("p-gruppo")),
                  mansioneId: val("p-mansione") || null,
                  oreGiorno:ore, smartMax: val("p-smart") ? numVal("p-smart") : null,
                  attivo:inOrganico};
    if(p) Object.assign(p, dati); else S.persone.push(Object.assign({id:nuovoId("p")}, dati));
    invalida(); segnaModificato(); chiudi(); rendi();
  };
}

function apriCommessa(id, pre){
  const c = id ? commessa(id) : null;
  pre = pre || {};
  const colore = c ? c.colore : null;
  /* Stessa impaginazione della scheda commessa: fascia in alto, due colonne
     con titoletti di sezione. Cambia il contenuto, non il linguaggio visivo. */
  const corpo = `
    <div class="sc-intestazione">
      <span class="pastiglia" style="background:${coloreCommessa(c||{numero:pre.numero||"nuova"})}"></span>
      <span class="din">${c ? esc(c.numero) + (c.cliente ? " · " + esc(c.cliente) : "") : tr("Nuovo progetto")}</span>
      ${c ? chipStato(c) : ""}
    </div>

    <div class="sc-due">
      <div class="sc-sx">

        <div class="sc-sezione">
          <h5 class="titoletto din">Identificazione</h5>
          <div class="riga-campi">
            <div class="campo"><label for="c-num">Numero progetto</label><input type="text" id="c-num" value="${esc(c?c.numero:(pre.numero||""))}"></div>
            <div class="campo"><label for="c-cli">Riferimento (facoltativo)</label><input type="text" id="c-cli" value="${esc(c?c.cliente:"")}"></div>
          </div>
          <div class="campo"><label for="c-desc">Descrizione (facoltativa)</label><input type="text" id="c-desc" value="${esc(c?c.descrizione:"")}"></div>
        </div>

        <div class="sc-sezione">
          <h5 class="titoletto din">Stato</h5>
          <div class="riga-campi">
            <div class="campo"><label for="c-stato">Stato</label><select id="c-stato">
              ${Object.keys(STATI).map(k=>`<option value="${k}" ${c&&c.stato===k?"selected":""}>${statoEti(k)}</option>`).join("")}
            </select></div>
            <div class="campo"><label for="c-data-stato" id="c-data-eti">Data</label>
              <input type="date" id="c-data-stato"></div>
          </div>
          <div class="campo"><label class="spunta"><input type="checkbox" id="c-archiviata" ${c&&c.archiviata?"checked":""}> ${tr("Archiviata")}</label>
            <span class="aiuto">${tr("Non compare più nelle ricerche e nei menu, resta nel calendario e nello storico.")}</span></div>
        </div>

        <div class="sc-sezione">
          <h5 class="titoletto din">Colore sul calendario</h5>
          <div class="colori" id="c-colori">
            <button type="button" data-colore="" style="background:${coloreCommessa(c||{numero:pre.numero||"nuova"})};position:relative" title="Automatico dal numero" aria-pressed="${!colore}">A</button>
            ${TAVOLOZZA.map(x=>`<button type="button" data-colore="${x}" style="background:${x}" aria-pressed="${x===colore}"></button>`).join("")}
          </div><span class="aiuto">“A” lascia il colore derivato dal numero di progetto.</span>
        </div>

      </div>
      <div class="sc-dx">

        <div class="sc-sezione">
          <h5 class="titoletto din">Tipologia</h5>
          <div class="campo"><label for="c-natura">Tipologia del progetto</label>
            <select id="c-natura">
              <option value="">— da indicare —</option>
              ${S.tipologie.map(t=>`<option value="${t.id}" ${c&&c.natura===t.id?"selected":""}>${esc(t.nome)}</option>`).join("")}
            </select>
            <span class="aiuto">${tr('Separa le tipologie nelle statistiche dei tempi medi. Si gestiscono in Progetti → Tipologie.')}</span></div>
        </div>

        <div class="sc-sezione">
          <h5 class="titoletto din">Consegna e tempi</h5>
          <div class="campo"><label for="c-apertura">Data di apertura</label>
            <input type="date" id="c-apertura" value="${c&&c.apertura?c.apertura:iso(new Date())}">
            <span class="aiuto">Serve a filtrare per anno.</span></div>
          <div class="campo"><label for="c-consegna">${tr("Consegna concordata (facoltativa)")}</label>
            <input type="date" id="c-consegna" value="${c&&c.consegnaCliente?c.consegnaCliente:""}"></div>
        </div>

      </div>
    </div>
    ${c ? `<div class="sc-sezione" style="margin-top:20px" id="c-fermo" hidden>
      <h5 class="titoletto din" id="c-fermo-titolo"></h5>
      <p class="aiuto">${tr("La data accanto allo stato è l'ultimo giorno di lavoro, anche nel passato: le ore fino a quel giorno restano nello storico, quelle dopo si liberano.")}</p>
      <div id="c-fermo-elenco"></div>
    </div>` : ""}
    ${c ? `<div class="sc-sezione" style="margin-top:20px" id="c-attivita-collegate">
      <h5 class="titoletto din">Attività di progetto</h5>
      ${tabellaAttivitaCommessa(datiCommessa(c).att)}
    </div>` : ""}`;
  const piede = `${c?'<button class="btn pericolo sinistra" id="c-elimina">Elimina</button>':""}
    <button class="btn" id="c-annulla">Annulla</button><button class="btn primario" id="c-ok">Salva</button>`;
  finestra(c?"Modifica progetto":"Nuovo progetto", corpo, piede);
  document.querySelector(".finestra").classList.add("enorme");

  let scelto = colore;
  document.getElementById("c-colori").onclick = e=>{
    const b = e.target.closest("[data-colore]"); if(!b) return;
    scelto = b.dataset.colore;
    document.querySelectorAll("#c-colori button").forEach(x=>x.setAttribute("aria-pressed", x.dataset.colore===scelto));
  };
  document.getElementById("c-annulla").onclick = chiudi;
  if(c) document.getElementById("c-elimina").onclick = ()=>{
    const n = S.assegnazioni.filter(a=>a.commessaId===c.id).length;
    // riunioni e formazione del progetto esistono per lui: si eliminano con le sue attività
    const ne = (S.eventi||[]).filter(e=>e.commessaId===c.id).length;
    if(!autorizza(ne ? tr("Questo progetto ha {0} attività pianificate e {1} riunioni o formazioni che verranno eliminate. Procedere?", n, ne)
                 : n ? tr("Questo progetto ha {0} attività pianificate che verranno eliminate. Procedere?", n) : tr("Eliminare questo progetto?"))) return;
    S.commesse = S.commesse.filter(x=>x.id!==c.id);
    S.assegnazioni = S.assegnazioni.filter(a=>a.commessaId!==c.id);
    S.eventi = (S.eventi||[]).filter(e=>e.commessaId!==c.id);
    invalida(); segnaModificato(); chiudi(); rendi();
  };
  /* Stato e data: la data accanto allo stato è sempre visibile, vuota e spenta su "Attiva".
     Riaprendo un progetto sospeso, annullato o chiuso mostra quando è successo (in sola
     lettura: è il giorno a cui si sono fermate le attività). Scegliendo uno stato nuovo si
     accende, con oggi di default e anche nel passato; per sospensione e annullamento sotto
     compare l'elenco di cosa succede a ogni attività — vedi CLAUDE.md, "Sospensione di
     un'attività/progetto". */
  const campoData = document.getElementById("c-data-stato");
  const tipoFermo = st => c && st !== c.stato ? (st === "sospesa" ? "sospendi" : st === "annullata" ? "annulla" : null) : null;
  const mostraFermo = tipo => {
    document.getElementById("c-fermo").hidden = !tipo;
    if(!tipo) return;
    const voci = fermoProgetto(c, campoData.value || iso(new Date()), tipo);
    document.getElementById("c-fermo-titolo").textContent = tipo === "annulla" ? tr("Annullamento del progetto") : tr("Sospensione del progetto");
    const effetto = v => v.giaFerma ? tr("già ferma dal {0}: resta così", itData(v.fine))
      : !v.ultimo ? tr("non ancora iniziata: nessuna ora resta")
      : (v.fineOra && v.fineOra <= v.fine) ? tr("finisce il {0}, prima di questa data: nessuna ora in meno", itData(v.fineOra))
      : tr("lavora fino al {0}, poi si ferma", itData(v.ultimo));
    document.getElementById("c-fermo-elenco").innerHTML = !voci.length
      ? `<p class="nota">${tr("Nessuna attività aperta da fermare.")}</p>`
      : `<p style="margin:8px 0 4px"><b>${tipo === "annulla"
          ? (voci.length === 1 ? tr("1 attività verrà annullata:") : tr("{0} attività verranno annullate:", voci.length))
          : (voci.length === 1 ? tr("1 attività verrà sospesa:") : tr("{0} attività verranno sospese:", voci.length))}</b></p>
         <table><tbody>${voci.map(v => `<tr><td>${esc(nomeAttivita(v.a))}</td><td>${effetto(v)}</td></tr>`).join("")}</tbody></table>`;
  };
  let dataScelta = "";   // la data scelta per lo stato nuovo, tenuta se si cambia stato più volte
  const aggiornaStato = () => {
    const st = val("c-stato") || "attiva", salvato = c && st === c.stato;
    campoData.disabled = st === "attiva" || salvato;
    campoData.value = st === "attiva" ? "" : salvato ? (dataStato(c) || "") : (dataScelta || iso(new Date()));
    document.getElementById("c-data-eti").textContent = st === "attiva" ? tr("Data")
      : st === "chiusa" ? tr("Data di chiusura") : tr("Ultimo giorno di lavoro");
    const arch = document.getElementById("c-archiviata");
    arch.disabled = st === "attiva";
    if(arch.disabled) arch.checked = false;
    if(c) mostraFermo(tipoFermo(st));
  };
  campoData.onchange = () => { dataScelta = campoData.value; if(c) mostraFermo(tipoFermo(val("c-stato"))); };
  document.getElementById("c-stato").onchange = aggiornaStato;
  aggiornaStato();
  // l'anticipo si propone dopo il salvataggio, a editor chiuso: una finestra sola per tutte le persone
  const dopoFermo = persone => { if(persone.length) proponiAnticipo(persone); };
  document.getElementById("c-ok").onclick = ()=>{
    const numero = val("c-num");
    if(!numero){ alert(tr("Serve il numero di progetto.")); return; }
    const doppio = S.commesse.some(x => x.id !== (c?c.id:null) && (x.numero||"").toLowerCase() === numero.toLowerCase());
    if(doppio){ alert(tr("Esiste già un progetto con questo numero: deve essere univoco.")); return; }
    const nuovoStato = val("c-stato") || "attiva";
    // si può chiudere solo se ogni attività è risolta (conclusa o annullata): non blocca
    // il resalvataggio di un progetto già chiuso in passato con attività irrisolte (dati
    // precedenti a questa regola) — blocca solo l'atto di chiudere, non l'edit successivo
    if(nuovoStato === "chiusa" && c && c.stato !== "chiusa"){
      const info = datiCommessa(c);
      if(info.tot && info.fatte < info.tot){
        alert(tr("Non puoi chiudere questo progetto: {0} attività non sono ancora concluse o annullate.", info.tot - info.fatte));
        return;
      }
    }
    const cambia = !c || nuovoStato !== c.stato, data = campoData.value;
    if(cambia && nuovoStato !== "attiva" && !data){ alert(tr("Indica la data accanto allo stato.")); return; }
    // sospendere e annullare chiedono sempre conferma (con la protezione, il codice); chiudere
    // solo il codice, se la protezione è attiva
    const tipo = tipoFermo(nuovoStato);
    if(cambia && (nuovoStato === "sospesa" || nuovoStato === "annullata")){
      const n = tipo ? fermoProgetto(c, data, tipo).length : 0;   // un progetto nuovo non ha attività
      if(!autorizza(nuovoStato === "annullata"
          ? (n ? tr("Annullare il progetto con ultimo giorno di lavoro il {0}? Le {1} attività ancora aperte (comprese le sospese) verranno annullate; le ore già lavorate restano nello storico.", itData(data), n)
               : tr("Annullare il progetto con ultimo giorno di lavoro il {0}?", itData(data)))
          : (n ? tr("Sospendere il progetto con ultimo giorno di lavoro il {0}? Le {1} attività ancora aperte verranno sospese; riprenderle sarà manuale.", itData(data), n)
               : tr("Sospendere il progetto con ultimo giorno di lavoro il {0}?", itData(data))))) return;
    }
    if(c && cambia && nuovoStato === "chiusa" && protetto() && !autorizza(tr("Chiudere il progetto il {0}?", itData(data)))) return;
    // sospesa+dataFine: storia congelata, ore dopo liberate, non implica fatta. Riattivare è
    // manuale, attività per attività
    const persone = tipo ? applicaFermoProgetto(c, data, tipo) : [];
    const dati = {numero, cliente:val("c-cli"), descrizione:val("c-desc"), colore:scelto || null,
                  stato:nuovoStato, apertura:val("c-apertura") || null,
                  consegnaCliente:val("c-consegna") || null,
                  natura:val("c-natura") || null,
                  archiviata: nuovoStato !== "attiva" && document.getElementById("c-archiviata").checked};
    if(cambia){
      dati.chiusaIl = (nuovoStato === "chiusa" || nuovoStato === "annullata") ? data : null;
      dati.sospesaIl = nuovoStato === "sospesa" ? data : null;
    }
    if(c) Object.assign(c, dati); else S.commesse.push(Object.assign({id:nuovoId("c")}, dati));
    segnaModificato(); chiudi(); rendi(); dopoFermo(persone);
  };
}

/* Riunioni e formazione (S.eventi): una versione semplificata dell'editor attività. Tipo,
   descrizione, una o più persone (anche un gruppo intero), progetto facoltativo, giorno e
   ore, attiva o conclusa. Niente vincoli di inizio/fine né sviluppo interno: è un impegno
   fisso, prende le sue ore prima di ogni attività e le riassegnazioni non lo spostano mai. */
// riunione o formazione in sola lettura: la scheda di consultazione, come per le attività
function anteprimaEvento(id){
  const ev = evento(id); if(!ev) return;
  const c = commessa(ev.commessaId);
  const attivi = S.persone.filter(p => p.attivo !== false);
  const tutti = attivi.length > 1 && attivi.every(p => ev.personeIds.includes(p.id));
  const nomi = ev.personeIds.map(pid => persona(pid)).filter(Boolean).sort(perNome).map(p => esc(p.nome));
  finestra(tr(TIPI_EVENTO[ev.tipo]),
    `<table><tbody>
      <tr><th style="width:130px">${tr("Tipo")}</th><td>${tr(TIPI_EVENTO[ev.tipo])}</td></tr>
      <tr><th>${tr("Descrizione")}</th><td>${esc(ev.descrizione)}</td></tr>
      ${c?`<tr><th>${tr("Progetto")}</th><td><span class="pastiglia" style="background:${coloreCommessa(c)}"></span><span class="mono">${esc(c.numero)}</span>${c.cliente?" · "+esc(c.cliente):""}</td></tr>`:""}
      <tr><th>${tr("Giorno")}</th><td class="mono">${itData(ev.giorno)} · ${arr(ev.ore)} h</td></tr>
      <tr><th>${tr("Persone")}</th><td>${tutti ? tr("Tutto l'organico") + ` <span class="nota">(${tr("{0} persone", nomi.length)})</span>` : nomi.join(", ")}</td></tr>
      ${ev.fatta?`<tr><th>${tr("Stato")}</th><td style="color:var(--positivo)"><b>✓ ${tr("Conclusa")}</b></td></tr>`:""}
    </tbody></table>
    <p class="nota" style="margin-top:12px">${tr("Attiva la modifica in alto a destra per cambiarla.")}</p>`,
    `<button class="btn" id="ev-chiudi">${tr("Chiudi")}</button>`);
  document.getElementById("ev-chiudi").onclick = chiudi;
}
function apriEvento(id, pre){
  if(!modificabile){ if(id) anteprimaEvento(id); return; }
  const ev = id ? evento(id) : null;
  pre = pre || {};
  const attivi = () => S.persone.filter(p => p.attivo !== false);
  const scelti = new Set(ev ? ev.personeIds : [pre.personaId || personaAutore()].filter(Boolean));
  // una riunione che comprende già tutto l'organico riparte con la spunta, non con centinaia di etichette
  const tuttiAllInizio = !!ev && attivi().length > 1 && attivi().every(p => scelti.has(p.id));
  const corpo = `
    <div class="riga-campi">
      <div class="campo"><label for="ev-tipo">${tr("Tipo")}</label><select id="ev-tipo">
        ${Object.keys(TIPI_EVENTO).map(k=>`<option value="${k}" ${(ev?ev.tipo:pre.tipo)===k?"selected":""}>${tr(TIPI_EVENTO[k])}</option>`).join("")}
      </select></div>
      <div class="campo"><label for="ev-progetto">${tr("Progetto (facoltativo)")}</label>
        <div class="cerca"><input type="text" id="ev-progetto" placeholder="${tr("Cerca numero o riferimento")}" autocomplete="off"></div></div>
    </div>
    <div class="campo"><label for="ev-desc">${tr("Descrizione")}</label><input type="text" id="ev-desc" value="${esc(ev?ev.descrizione:"")}"></div>
    <div class="riga-campi">
      <div class="campo"><label for="ev-giorno">${tr("Giorno")}</label><input type="date" id="ev-giorno" value="${ev?ev.giorno:(pre.giorno||iso(new Date()))}"></div>
      <div class="campo"><label for="ev-ore">${tr("Ore")}</label><input type="number" id="ev-ore" min="0.5" step="0.5" value="${ev?ev.ore:1}"></div>
    </div>
    <div class="campo"><label for="ev-cerca-persone">${tr("Persone")}</label>
      <label class="spunta"><input type="checkbox" id="ev-tutti" ${tuttiAllInizio?"checked":""}> <b>${tr("Tutto l'organico")}</b></label>
      <div class="dip-scelte" id="ev-scelte"></div>
      <div class="cerca dip-cerca"><input type="text" id="ev-cerca-persone" autocomplete="off"></div></div>
    <div class="campo"><label class="spunta"><input type="checkbox" id="ev-fatta" ${ev&&ev.fatta?"checked":""}> ${tr("Conclusa")}</label></div>`;
  const piede = `${ev?'<button class="btn pericolo sinistra" id="ev-elimina">Elimina</button>':""}
    <button class="btn" id="ev-annulla">Annulla</button><button class="btn primario" id="ev-ok">Salva</button>`;
  finestra(ev ? tr("Modifica riunione o formazione") : tr("Nuova riunione o formazione"), corpo, piede)
    .querySelector(".finestra").classList.add("con-lista");
  // progetto: lo stesso campo di ricerca dell'editor attività, qui si può lasciare vuoto
  const comboP = creaCombo("ev-progetto", opzioniCombo(commesseSceglibili(ev ? ev.commessaId : null)),
    {valore: ev ? ev.commessaId || "" : "", consentiVuoto: true});
  /* persone: come "Parte dopo" nell'editor attività — si cercano una alla volta e restano come
     etichette rimovibili; nella ricerca ci sono anche i gruppi, che aggiungono tutti i loro
     membri. "Tutto l'organico" sostituisce l'elenco: niente lista di tutte le persone a schermo. */
  const optPersone = [];
  const comboPers = creaCombo("ev-cerca-persone", optPersone, {
    consentiVuoto: true,
    onScegli: v => {
      if(!v) return;
      if(v.startsWith("g:")) attivi().filter(p => p.gruppoId === v.slice(2)).forEach(p => scelti.add(p.id));
      else scelti.add(v);
      comboPers.imposta("", true);
      disegnaPersone();
    }
  });
  const disegnaPersone = () => {
    const tutti = document.getElementById("ev-tutti").checked;
    const box = document.getElementById("ev-scelte");
    box.hidden = tutti;
    box.innerHTML = Array.from(scelti).map(pid => persona(pid)).filter(Boolean).sort(perNome).map(p =>
      `<span class="dip-etichetta">${esc(p.nome)}${p.attivo===false?" ("+tr("non attivo")+")":""}
       <button type="button" class="dip-togli" data-togli="${p.id}" title="${tr("Togli")}" aria-label="${tr("Togli")}">×</button></span>`).join("");
    box.querySelectorAll("[data-togli]").forEach(b => b.onclick = () => { scelti.delete(b.dataset.togli); disegnaPersone(); });
    optPersone.length = 0;
    S.gruppi.forEach(g => {
      const n = attivi().filter(p => p.gruppoId === g.id && !scelti.has(p.id)).length;
      if(n) optPersone.push({id:"g:" + g.id, eti:tr("Gruppo: {0}", g.nome), sotto:tr("{0} persone", n)});
    });
    personeOrdinate(true).filter(p => !scelti.has(p.id)).forEach(p =>
      optPersone.push({id:p.id, eti:p.nome, sotto:(gruppo(p.gruppoId)||{}).nome || ""}));
    const inp = document.getElementById("ev-cerca-persone");
    inp.disabled = tutti || !optPersone.length;
    inp.placeholder = tutti ? tr("Tutto l'organico") : tr("Cerca una persona o un gruppo…");
  };
  document.getElementById("ev-tutti").onchange = disegnaPersone;
  disegnaPersone();
  const personeScelte = () => document.getElementById("ev-tutti").checked
    ? attivi().map(p => p.id) : Array.from(scelti).filter(pid => persona(pid));
  document.getElementById("ev-annulla").onclick = chiudi;
  // aperta dalla riga di una persona, con altri partecipanti: eliminare o cambiare giorno e ore
  // chiede se vale per tutti o solo per lei — chi agisce dalla propria riga non deve cambiare o
  // cancellare la riunione agli altri senza accorgersene
  const da = ev && pre.daPersona && ev.personeIds.length > 1 && ev.personeIds.includes(pre.daPersona) ? persona(pre.daPersona) : null;
  if(ev) document.getElementById("ev-elimina").onclick = async ()=>{
    let soloLei = false;
    if(da){
      const r = await bannerScelta(tr("Eliminare per tutti o solo per {0}?", esc(da.nome)),
        `<p class="nota">${tr("Questa riunione o formazione riguarda {0} persone.", ev.personeIds.length)}</p>`,
        [{r:"annulla", eti:tr("Torna indietro")}, {r:"solo", eti:tr("Togli solo {0}", esc(da.nome))},
         {r:"tutti", eti:tr("Elimina per tutti i {0}", ev.personeIds.length)}]);
      if(r === "annulla") return;
      soloLei = r === "solo";
    }
    if(soloLei) S.eventi = eventiModificati(S.eventi, ev, {personeIds: ev.personeIds.filter(id => id !== da.id)});
    else {
      const msg = tr("Eliminare questa riunione o formazione?");
      if(!da && !(S.config.proteggiAttivita ? autorizza(msg) : confirm(msg))) return;
      if(da && S.config.proteggiAttivita && !autorizza(msg)) return;
      S.eventi = S.eventi.filter(x => x.id !== ev.id);
    }
    invalida(); segnaModificato(); chiudi(); rendi();
  };
  document.getElementById("ev-ok").onclick = async ()=>{
    const dati = {tipo:val("ev-tipo"), descrizione:val("ev-desc"), commessaId:comboP.valore() || null,
                  giorno:val("ev-giorno"), ore:numVal("ev-ore"), fatta:document.getElementById("ev-fatta").checked,
                  personeIds:personeScelte()};
    if(!dati.descrizione){ alert(tr("Scrivi una descrizione.")); return; }
    if(!dati.personeIds.length){ alert(tr("Scegli almeno una persona.")); return; }
    if(!dati.giorno || !(dati.ore > 0)){ alert(tr("Servono un giorno e delle ore maggiori di zero.")); return; }
    // giorno, ore o tipo cambiati partendo dalla riga di una persona: per tutti o solo per lei
    let soloPer = null;
    if(da && dati.personeIds.includes(da.id) && (dati.giorno !== ev.giorno || dati.ore !== +ev.ore || dati.tipo !== ev.tipo)){
      const r = await bannerScelta(tr("Cambiare per tutti o solo per {0}?", esc(da.nome)),
        `<p class="nota">${tr("Questa riunione o formazione riguarda {0} persone. “Solo per {1}” la toglie dalla riunione comune e le crea una voce sua con i dati nuovi.", ev.personeIds.length, esc(da.nome))}</p>`,
        [{r:"annulla", eti:tr("Torna all'editor")}, {r:"solo", eti:tr("Cambia solo per {0}", esc(da.nome))},
         {r:"tutti", eti:tr("Cambia per tutti i {0}", ev.personeIds.length), primario:true}]);
      if(r === "annulla") return;
      if(r === "solo") soloPer = da.id;
    }
    const nuovi = eventiModificati(S.eventi, ev, dati, soloPer);
    // le attività aperte delle persone coinvolte che per questo finirebbero più tardi: lo si dice
    // prima di salvare, come per un'attività (verifica e segnala, nessuno slittamento in silenzio)
    const coinvolte = new Set([...dati.personeIds, ...(ev ? ev.personeIds : [])]);
    const fine = () => new Map(S.assegnazioni.filter(a => coinvolte.has(a.personaId) && !a.fatta && !a.sospesa)
      .map(a => [a, (estremi(a)||{}).al]));
    const prima = fine();
    const vecchi = S.eventi;
    S.eventi = nuovi; invalida();
    const dopo = fine();
    S.eventi = vecchi; invalida();
    const slittano = Array.from(prima).filter(([a, al]) => al && dopo.get(a) && dopo.get(a) > al);
    if(slittano.length){
      const r = await bannerScelta(tr("Alcune attività finiscono più tardi"),
        `<ul>${slittano.map(([a, al]) => `<li>${esc(nomeAttivita(a))}: ${itData(al)} → ${itData(dopo.get(a))}</li>`).join("")}</ul>
         <p class="nota">${tr("Riunioni e formazione hanno la precedenza: le attività si dividono le ore che restano.")}</p>`,
        [{r:"annulla", eti:tr("Torna all'editor")}, {r:"salva", eti:tr("Salva comunque"), primario:true}]);
      if(r !== "salva") return;
    }
    S.eventi = nuovi;
    invalida(); segnaModificato(); chiudi(); rendi();
  };
}
function apriAssenza(id){
  if(!modificabile) return;
  const a = id ? S.assenze.find(x=>x.id===id) : null;
  const corpo = `
    <div class="campo"><label for="s-persona">Persona</label><select id="s-persona">${opzioniPersone(a ? a.personaId : (personaAutore() || ""), !a)}</select></div>
    <div class="riga-campi">
      <div class="campo"><label for="s-tipo">Tipo</label><select id="s-tipo">
        ${Object.keys(TIPI_GIORNO).map(k=>`<option value="${k}" ${a&&a.tipo===k?"selected":""}>${tr(TIPI_GIORNO[k])}</option>`).join("")}
      </select><span class="aiuto" id="s-nota"></span></div>
      <div class="campo"><label for="s-ore">Ore</label><input type="number" id="s-ore" min="0" step="0.5" value="${a&&oreAssenza(a)!=null?oreAssenza(a):""}">
        <span class="aiuto">${tr("Ore tolte in ognuno dei giorni indicati.")}</span></div>
    </div>
    <div class="campo" id="s-trasf-campo" hidden>
      <label class="spunta"><input type="checkbox" id="s-trasf-intero" ${(a ? oreAssenza(a)==null : true)?"checked":""}> Tutta la giornata</label>
      <span class="aiuto">Deseleziona per indicare solo alcune ore (es. mezza giornata).</span>
    </div>
    <div class="campo" id="s-note-campo" hidden><label for="s-note">${tr("Note (facoltative)")}</label>
      <input type="text" id="s-note" placeholder="${tr("Es. permesso studio, lutto, permesso sindacale")}" value="${esc(a&&a.tipo==="generica"&&a.motivo?a.motivo:"")}"></div>
    <div class="riga-campi">
      <div class="campo"><label for="s-dal">Dal</label><input type="date" id="s-dal" value="${a?a.dal:iso(new Date())}"></div>
      <div class="campo"><label for="s-al">Al</label><input type="date" id="s-al" value="${a?a.al:iso(new Date())}"></div>
    </div>
    <div id="s-conteggio" hidden></div>
    <div class="campo" id="s-deroga-campo" hidden>
      <label class="spunta"><input type="checkbox" id="s-deroga" ${a&&a.deroga?"checked":""}> Deroga eccezionale, non conta sul limite</label>
      <input type="text" id="s-motivo" placeholder="Motivo (es. guasto all'auto)" value="${esc(a&&a.motivo?a.motivo:"")}">
      <span class="aiuto">Il tetto settimanale resta invariato: questa giornata viene registrata come eccezione motivata.</span>
    </div>`;
  const piede = `${a?'<button class="btn pericolo sinistra" id="s-elimina">Elimina</button>':""}
    <button class="btn" id="s-annulla">Annulla</button><button class="btn primario" id="s-ok">Salva</button>`;
  finestra(a?"Modifica giornata":"Ferie, permessi, assenze, malattia o smart", corpo, piede);
  const nota = document.getElementById("s-nota"), campoOre = document.getElementById("s-ore");
  const boxConta = document.getElementById("s-conteggio"), boxDeroga = document.getElementById("s-deroga-campo");
  const campoTrasf = document.getElementById("s-trasf-campo"), trasfIntero = document.getElementById("s-trasf-intero");
  // ferie, permesso, assenza e trasferta: giornata intera o solo alcune ore; malattia e smart no
  const conDurata = t => ["ferie","permesso","generica","trasferta"].includes(t);
  let tipoPrima = val("s-tipo");
  const aggiornaTipo = () => {
    const t = val("s-tipo");
    // passando a un permesso nuovo si parte "a ore", come il permesso di sempre
    if(t !== tipoPrima && !a && t === "permesso") trasfIntero.checked = false;
    tipoPrima = t;
    campoTrasf.hidden = !conDurata(t);
    document.getElementById("s-note-campo").hidden = t !== "generica";
    campoOre.disabled = !conDurata(t) || trasfIntero.checked;
    const campoAl = document.getElementById("s-al");
    let dal = val("s-dal"), al = val("s-al"), pid = val("s-persona");
    if(dal && al && al < dal){ campoAl.value = dal; al = dal; }
    if(t !== "smart" || !dal || !al || al < dal){
      boxConta.hidden = true; boxDeroga.hidden = true;
    } else {
      const deroga = document.getElementById("s-deroga").checked;
      const r = riepilogoSmart(pid, dal, al, a ? a.id : null, deroga);
      const sfora = r.some(x => x.sfora);
      boxConta.hidden = false;
      boxConta.className = sfora ? "avviso" : "";
      boxConta.innerHTML = (sfora ? "<b>"+tr("Limite superato")+"</b>" : "") + r.map(x =>
        `<div class="nota" style="${x.sfora?"color:var(--allarme);font-weight:700":""}">`
        + tr(x.ord===1 ? "Settimana del {0}: {1} giornata su {2}" : "Settimana del {0}: {1} giornate su {2}",
             itData(x.lun), x.ord, x.lim)
        + (x.der ? tr(" · {0} in deroga", x.der) : "") + `</div>`).join("");
      boxDeroga.hidden = !sfora && !deroga;
    }
    nota.textContent = tr(
        t === "smart"     ? "Lavoro fuori sede: ore invariate, ma conta sul limite settimanale."
      : t === "trasferta" ? "Riduce le ore disponibili del giorno: tutta la giornata, oppure solo le ore indicate."
      : t === "malattia"  ? "La persona non è disponibile: le attività saltano questi giorni."
      : "Tutta la giornata: le attività saltano questi giorni. A ore: riduce solo le ore indicate.");
  };
  ["s-tipo","s-persona","s-dal","s-al","s-deroga","s-trasf-intero"].forEach(i=>{
    const el = document.getElementById(i);
    el.addEventListener("change", aggiornaTipo);
    el.addEventListener("input", aggiornaTipo);
  });
  aggiornaTipo();
  document.getElementById("s-annulla").onclick = chiudi;
  if(a) document.getElementById("s-elimina").onclick = ()=>{
    S.assenze = S.assenze.filter(x=>x.id!==a.id);
    invalida(); segnaModificato(); chiudi(); rendi();
  };
  document.getElementById("s-ok").onclick = ()=>{
    if(!val("s-persona")){ alert(tr("Scegli la persona.")); return; }
    const dal = val("s-dal"), al = val("s-al");
    if(!dal || !al || al < dal){ alert(tr("Controlla le date: la fine non può precedere l'inizio.")); return; }
    const tipo = val("s-tipo");
    const deroga = tipo === "smart" && document.getElementById("s-deroga").checked;
    if(tipo === "smart"){
      const r = riepilogoSmart(val("s-persona"), dal, al, a ? a.id : null, deroga);
      const sfora = r.find(x => x.sfora);
      if(sfora){
        alert(tr("{0} arriverebbe a {1} giornate di smart working nella settimana del {2}, contro un limite di {3}.",
              persona(val("s-persona")).nome, sfora.ord, itData(sfora.lun), sfora.lim)
          + "\n\n"
          + tr("Se è un'eccezione, spunta “Deroga eccezionale” e indica il motivo: il limite resta {0} e la giornata viene registrata a parte.", sfora.lim));
        return;
      }
      if(deroga && !val("s-motivo")){ alert(tr("Indica il motivo della deroga.")); return; }
    }
    // ore vuote = giornata intera (malattia e smart sempre); a ore servono ore maggiori di zero
    const intero = !["ferie","permesso","generica","trasferta"].includes(tipo) || document.getElementById("s-trasf-intero").checked;
    if(!intero && !(numVal("s-ore") > 0)){ alert(tr("Indica le ore, oppure spunta “Tutta la giornata”.")); return; }
    const ore = intero ? null : numVal("s-ore");
    // "motivo": il perché della deroga allo smart working, o le note facoltative di un'assenza
    const dati = {personaId:val("s-persona"), tipo, ore, dal, al,
                  deroga, motivo: deroga ? val("s-motivo") : tipo === "generica" ? val("s-note") : ""};
    if(a) Object.assign(a, dati); else S.assenze.push(Object.assign({id:nuovoId("s")}, dati));
    invalida(); segnaModificato(); chiudi(); rendi();
  };
}
