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

function opzioniPersone(sel){
  const v = personeOrdinate(true);
  // chi è uscito dall'organico DOPO essere stato scelto resta comunque in elenco, marcato:
  // altrimenti il select non troverebbe la voce, ricadrebbe sulla prima persona attiva e
  // salverebbe quella al posto sua senza dirlo (lo strumento segnala, non corregge da solo)
  const p = sel ? persona(sel) : null;
  if(p && !v.includes(p)) v.push(p);
  return v.map(p=>
    `<option value="${p.id}" ${p.id===sel?"selected":""}>${esc(p.nome)}${p.attivo===false?` (${tr("Non attivo")})`:""}</option>`).join("");
}

function apriAttivita(id, pre){
  if(!modificabile && id){ return anteprimaAttivita(id); }
  if(!modificabile) return;
  if(S.commesse.length===0){ alert(tr("Aggiungi prima un progetto in Progetti.")); return; }
  const a = id ? S.assegnazioni.find(x=>x.id===id) : null;
  const p = pre || {};
  const pid = a?a.personaId:(p.personaId||(S.persone[0]&&S.persone[0].id));
  const oreG = a ? a.orePerGiorno : null;
  const modoIni = a ? modoAtt(a) : "inizio";
  const dataRif = a ? (modoIni==="fine"?a.scadenza:a.dataInizio) : (p.dataInizio||iso(new Date()));
  /* Stessa impaginazione della scheda commessa: a sinistra chi fa cosa e
     quando, a destra prodotto e stato. In fondo, a tutta larghezza, i
     riquadri che il pianificatore riempie da solo mentre compili. */
  const corpo = `
    <div class="sc-due">
      <div class="sc-sx">

        <div class="sc-sezione">
          <h5 class="titoletto din">Chi e cosa</h5>
          <div class="riga-campi">
            <div class="campo"><label for="f-persona">Persona</label><select id="f-persona">${opzioniPersone(pid)}</select></div>
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
            <input type="text" id="f-desc" value="${esc(a&&a.descrizione?a.descrizione:(p.descrizione||""))}" placeholder="Es. schema di potenza, cablaggio quadro, distinta">
            <span class="aiuto">Distingue i lavori diversi della stessa persona sullo stesso progetto.</span></div>
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
        </div>

      </div>
      <div class="sc-dx">

        <div class="sc-sezione">
          <h5 class="titoletto din">Sviluppo interno</h5>
          <div class="campo"><label for="f-tipologia">Tipologia di sviluppo interno</label>
            <select id="f-tipologia">
              <option value="">— non indicata —</option>
              <option value="nessuna" ${a&&a.tipologiaId==="nessuna"?"selected":""}>Nessuno sviluppo interno</option>
              ${(S.config.leadProduzione||[]).map(x=>`<option value="${x.id}" ${a&&a.tipologiaId===x.id?"selected":""}>${tr("{0} · {1}", esc(x.nome), testoValoreLead(x))}</option>`).join("")}
            </select>
            <span class="aiuto">${tr('Determina il lead time di sviluppo interno di questa attività, e la data limite di inizio qui sotto. Anche la documentazione può averne uno proprio (es. tempo di preparazione sul supporto richiesto): aggiungila come voce normale in Impostazioni → Lead time, non è un caso speciale.')}</span></div>
        </div>

        <div class="sc-sezione">
          <h5 class="titoletto din">Stato</h5>
          <div class="campo"><label class="spunta"><input type="checkbox" id="f-fatta" ${a&&a.fatta?"checked":""}> Attività conclusa</label></div>
          <div class="campo" style="margin-top:8px"><label for="f-fine">Conclusa il</label>
            <input type="date" id="f-fine" value="${a&&a.dataFine?a.dataFine:iso(new Date())}"></div>
        </div>

        <div class="sc-sezione">
          <h5 class="titoletto din">Note</h5>
          <div class="campo"><input type="text" id="f-note" value="${esc(a?a.note:"")}" aria-label="Note">
            <span class="aiuto">Testo libero: vincoli, accordi, promemoria.</span></div>
        </div>

      </div>
    </div>

    <div id="f-liberate" hidden></div>
    <div class="avviso" id="f-anteprima"></div>
    <div id="f-consiglio" hidden></div>`;
  const piede = `${a?'<button class="btn pericolo sinistra" id="f-elimina">Elimina</button>':""}
    <button class="btn" id="f-annulla">Annulla</button>
    <button class="btn primario" id="f-ok">${a?"Salva attività":"Aggiungi attività"}</button>`;
  finestra(a?"Modifica attività":"Nuova attività", corpo, piede)
    .querySelector(".finestra").classList.add("con-lista", "enorme");

  const optC = opzioniCombo(commesseSceglibili(a?a.commessaId:null));
  const pannelloNuova = document.getElementById("f-nuova");
  const combo = creaCombo("f-commessa", optC, {
    valore: a ? a.commessaId : "",
    onScegli: ()=>{ anteprima(); },
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
    pannelloNuova.hidden = true;
    segnaModificato();
    anteprima();
    brindisi(tr("Progetto {0} creato", numero));
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
  const oggettoForm = () => ({id:"x", personaId:val("f-persona"), commessaId:combo.valore(),
    modo:val("f-modo"), dataInizio:risolviInizio(),
    scadenza: val("f-modo") === "fine" ? val("f-inizio") : val("f-modo") === "finestra" ? val("f-al") : null,
    oreTotali:numVal("f-ore"), orePerGiorno:perGiornoForm()});

  // consiglio sull'ultimo giorno di partenza, se la commessa ha una consegna concordata.
  // Usa la tipologia scelta QUI per l'attività (non più un default di progetto, rimosso):
  // cambiando "f-tipologia" il consiglio si ricalcola, vedi il listener più sotto.
  const consiglio = () => {
    const box = document.getElementById("f-consiglio");
    const c = commessa(combo.valore());
    const lim = c ? dateLimite({consegnaCliente:c.consegnaCliente, tipologiaId:val("f-tipologia") || null}) : null;
    if(!lim){ box.hidden = true; box.innerHTML = ""; return; }
    const ultimo = ultimoInizio(oggettoForm(), lim.fineUfficio);
    const inizioPrev = (distribuzione(oggettoForm()).size ? Array.from(distribuzione(oggettoForm()).keys()).sort()[0] : null);
    const tardi = !!(ultimo && inizioPrev && inizioPrev > ultimo);
    box.hidden = false;
    box.className = "avviso";
    box.innerHTML = `<b>${tr("Consegna: {0}", itData(lim.consegna))}</b>`
      + tr("Tolti {0} gg di fornitura esterna e {1} gg di sviluppo interno{2}, l'ufficio deve chiudere entro il {3}.",
           lim.gForn, lim.gProd, lim.marg ? tr(" più {0} gg lavorativi di margine", lim.marg) : "", itData(lim.fineUfficio))
      + (lim.mancaForn ? `<br><span class="nota">${tr("Nessun lead time di fornitura esterna in tabella: il calcolo lo considera zero (si imposta in Impostazioni).")}</span>` : "")
      + (lim.mancaTip ? `<br><span class="nota">${tr("Tipologia di sviluppo interno non indicata qui sopra: il calcolo la considera zero.")}</span>` : "")
      + (ultimo
          ? `<br><b${tardi?' style="color:var(--allarme)"':""}>${tr("Ultimo giorno utile per partire: {0}", itData(ultimo))}</b>`
            + (tardi ? " " + tr("⚠ Con la partenza attuale si arriva in ritardo.") : "")
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
      modo === "fine" ? "Data di consegna" : modo === "finestra" ? "Dal" : "Giorno di partenza";
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
    const m = distribuzione(finto);
    const ch = Array.from(m.keys()).sort();
    box.className = "avviso";
    if(!ch.length){
      box.innerHTML = "<b>"+tr("Nessun giorno utile")+"</b>"
        + (modo === "finestra" ? tr("Nella finestra scelta non ci sono giorni lavorabili per questa persona.")
                               : tr("Controlla monte ore e giorno di partenza."));
      consiglio(); aggiornaLiberate(null); return;
    }
    const oreAlDi = modo === "finestra" ? orePerGiornoEff(finto) : (perG != null ? perG : capacitaPersonaGiorno(persona(val("f-persona")), ch[0]));
    const cap = capacitaPersonaGiorno(persona(val("f-persona")), ch[0]);
    const passato = ch[0] < iso(new Date());
    const slitta = modo === "inizio" && ch[0] !== val("f-inizio");
    const gior = ch.length === 1 ? tr("1 giornata di lavoro") : tr("{0} giornate di lavoro", ch.length);

    if(modo === "finestra"){
      const uniformi = new Set(Array.from(m.values()).map(v=>Math.round(v*100))).size === 1;
      box.innerHTML = `<b>${uniformi ? tr("{0} h al giorno su {1} giornate utili", arr(oreAlDi), ch.length)
                                     : tr("in media {0} h al giorno su {1} giornate utili", arr(oreAlDi), ch.length)}</b>`
        + (uniformi
            ? tr("Dal {0} al {1}: il monte ore è diviso in parti uguali fra i giorni lavorabili, weekend, festività e assenze esclusi.",
                 itData(ch[0]), itData(ch[ch.length-1]))
            : tr("Dal {0} al {1}: il monte ore è ripartito in proporzione alle ore disponibili, perché non tutti i giorni ne hanno altrettante.",
                 itData(ch[0]), itData(ch[ch.length-1])))
        + (oreAlDi > cap + 0.001
            ? `<br><b style="color:var(--allarme)">${tr("⚠ Servono più ore di quelle disponibili ({0} h al giorno): la finestra è troppo stretta.", cap)}</b>`
            : "")
        + (passato ? `<br><b style="color:var(--allarme)">${tr("⚠ La partenza cade nel passato.")}</b>` : "");
    } else {
      box.innerHTML = `<b>${modo === "fine" ? tr("Deve partire il {0}", itData(ch[0])) : gior}</b>`
        + tr("Dal {0} al {1}, {2} h al giorno", itData(ch[0]), itData(ch[ch.length-1]), arr(oreAlDi))
        + (perG == null ? tr(" a tempo pieno.") : ".")
        + (slitta ? tr(" Il {0} non è un giorno utile, la partenza slitta al primo disponibile.", itData(val("f-inizio")))
                  : tr(" Weekend, festività e assenze sono già saltati."))
        + (passato ? `<br><b style="color:var(--allarme)">${tr("⚠ La partenza cade nel passato.")}</b>` : "");
    }
    consiglio();
    aggiornaLiberate(ch, oreAlDi);
  };

  const aggiornaLiberate = (ch, oreAlDi) => {
    const boxLib = document.getElementById("f-liberate");
    const spuntaFine = document.getElementById("f-fatta").checked;
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
        : `<span class="nota">${tr("Conclusa nei tempi previsti: non si libera capacità.")}</span>`;
    }
  };
  ["f-persona","f-inizio","f-al","f-ore","f-oreg","f-modo","f-fatta","f-fine","f-tipologia"].forEach(i=>{
    const e = document.getElementById(i);
    e.addEventListener("input", anteprima);
    e.addEventListener("change", anteprima);
  });
  anteprima();

  document.getElementById("f-annulla").onclick = chiudi;
  if(a) document.getElementById("f-elimina").onclick = ()=>{
    const consenso = S.config.proteggiAttivita ? autorizza(tr("Eliminare questa attività?")) : confirm(tr("Eliminare questa attività?"));
    if(consenso){
      S.assegnazioni = S.assegnazioni.filter(x=>x.id!==a.id);
      invalida(); segnaModificato(); chiudi(); rendi();
    }
  };
  document.getElementById("f-ok").onclick = ()=>{
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
    const dati = {personaId:val("f-persona"), commessaId:combo.valore(), modo, dataInizio:inizio,
                  scadenza: modo === "fine" ? val("f-inizio") : modo === "finestra" ? val("f-al") : null,
                  oreTotali:numVal("f-ore"),
                  orePerGiorno: (modo === "finestra" || !val("f-oreg")) ? null : numVal("f-oreg"),
                  fatta: document.getElementById("f-fatta").checked,
                  dataFine: document.getElementById("f-fatta").checked ? val("f-fine") : null,
                  note:val("f-note"), descrizione: val("f-desc"),
                  tipologiaId: val("f-tipologia") || null};
    if(!dati.commessaId){ alert(tr("Scegli un progetto dall'elenco.")); return; }
    if(!dati.dataInizio || dati.oreTotali<=0){ alert(tr("Servono una data e un monte ore maggiore di zero.")); return; }
    const primaFine = a ? (estremi(a) || {}).al : null;
    if(a) Object.assign(a, dati);
    else S.assegnazioni.push(Object.assign({id:nuovoId("a")}, dati));
    // promozione da backlog: solo ora che l'attività è davvero salvata l'item esce dal
    // backlog — annullare questa finestra prima d'ora lo lascia intatto (vedi promuoviBacklogItem)
    if(!a && p.backlogId) S.backlog = (S.backlog||[]).filter(x=>x.id!==p.backlogId);
    invalida(); segnaModificato(); chiudi(); rendi();
    // se la chiusura anticipata ha liberato giornate, chiedo cosa farne
    if(a && dati.fatta && dati.dataFine && primaFine && dati.dataFine < primaFine){
      proponiAnticipo(a.personaId, dati.dataFine, a.id);
    }
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
      ${a.fatta?`<tr><th>Stato</th><td style="color:#0A7A34"><b>✓ Conclusa</b></td></tr>`:""}
      ${a.note?`<tr><th>Note</th><td>${esc(a.note)}</td></tr>`:""}
    </tbody></table>
    <p class="nota" style="margin-top:12px">Attiva la modifica in alto a destra per cambiare questa attività.</p>`,
    `<button class="btn" onclick="document.getElementById('velo').remove()">Chiudi</button>`);
}

// dopo una chiusura anticipata: propone di spostare avanti le attività successive
function proponiAnticipo(personaId, dopoIl, escludiId){
  const p = persona(personaId);
  const candidate = S.assegnazioni.filter(x=>{
    if(x.personaId !== personaId || x.id === escludiId || x.fatta) return false;
    const e = estremi(x);
    return e && e.dal > dopoIl;
  }).map(x=>({x, e:estremi(x)})).sort((u,v)=> u.e.dal < v.e.dal ? -1 : 1).slice(0, 20);

  if(!candidate.length) return false;
  const primoUtile = giornoUtile(personaId, dopoIl);

  finestra("Anticipare le attività successive?",
    `<p style="margin:0 0 12px">${tr("{0} ha capacità libera dopo il {1}. Scegli quali lavorazioni anticipare: quelle che lasci ferme restano dove sono.", esc(p.nome), itData(dopoIl))}</p>
     <div class="campo"><label for="an-data">Fai partire la prima dal</label>
       <input type="date" id="an-data" value="${primoUtile}">
       <span class="aiuto">Le altre selezionate slittano della stessa quantità, mantenendo le distanze tra loro.</span></div>
     <table><thead><tr><th style="width:30px"></th><th>Progetto</th><th>Dal</th><th>Al</th><th class="num-cella">Ore</th></tr></thead><tbody>
     ${candidate.map((k,idx)=>{
       const cz = commessa(k.x.commessaId);
       return `<tr><td><input type="checkbox" data-anticipa="${k.x.id}" ${idx===0?"checked":""}></td>
         <td><span class="pastiglia" style="background:${coloreCommessa(cz)}"></span><span class="mono">${cz?esc(cz.numero):"?"}</span>${cz&&cz.cliente?" · "+esc(cz.cliente):""}</td>
         <td class="mono">${itData(k.e.dal)}</td><td class="mono">${itData(k.e.al)}</td>
         <td class="num-cella mono">${arr(k.e.ore)}</td></tr>`;
     }).join("")}
     </tbody></table>`,
    `<button class="btn" id="an-no">Non spostare niente</button>
     <button class="btn primario" id="an-ok">Anticipa le selezionate</button>`);
  document.querySelector(".finestra").classList.add("larga");
  document.getElementById("an-no").onclick = chiudi;
  document.getElementById("an-ok").onclick = ()=>{
    const scelte = Array.from(document.querySelectorAll("[data-anticipa]")).filter(c=>c.checked)
      .map(c => S.assegnazioni.find(x=>x.id===c.dataset.anticipa)).filter(Boolean);
    if(!scelte.length){ chiudi(); return; }
    const dataScelta = val("an-data");
    const prima = scelte.map(x=>estremi(x)).filter(Boolean).map(e=>e.dal).sort()[0];
    const delta = diffGiorni(prima, dataScelta);
    scelte.forEach(x=>{
      x.dataInizio = iso(sommaGiorni(d(x.dataInizio), delta));
      if(x.scadenza) x.scadenza = iso(sommaGiorni(d(x.scadenza), delta));
    });
    invalida(); segnaModificato(); chiudi(); rendi();
    brindisi(tr(scelte.length===1 ? "{0} attività anticipata" : "{0} attività anticipate", scelte.length));
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
    </div><span class="aiuto">Etichetta informativa: la persona resta su una sola riga, quella del gruppo principale.</span></div>
    <div class="campo"><label for="p-smart">Deroga al limite di smart working</label>
      <input type="number" id="p-smart" min="0" max="7" step="1" placeholder="${S.config.smartMaxSettimana} giorni a settimana" value="${p&&p.smartMax!=null?p.smartMax:""}">
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
      ${c ? `<span class="chip ${c.stato}">${statoEti(c.stato)}</span>` : ""}
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
          <h5 class="titoletto din">Stato e apertura</h5>
          <div class="riga-campi">
            <div class="campo"><label for="c-stato">Stato</label><select id="c-stato">
              ${Object.keys(STATI).map(k=>`<option value="${k}" ${c&&c.stato===k?"selected":""}>${statoEti(k)}</option>`).join("")}
            </select><span class="aiuto">Gli archiviati restano nel calendario ma spariscono dalle ricerche.</span></div>
            <div class="campo"><label for="c-apertura">Data di apertura</label>
              <input type="date" id="c-apertura" value="${c&&c.apertura?c.apertura:iso(new Date())}">
              <span class="aiuto">Serve a filtrare per anno.</span></div>
          </div>
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
          <div class="campo"><label for="c-consegna">Consegna concordata</label>
            <input type="date" id="c-consegna" value="${c&&c.consegnaCliente?c.consegnaCliente:""}">
            <span class="aiuto">${tr('Facoltativa. La data limite di inizio si calcola dalle attività pianificate su questo progetto (ognuna con la propria tipologia di sviluppo interno), non da qui: si vede in Scheda → “Calcola il giorno ultimo di inizio”.')}</span></div>
        </div>

      </div>
    </div>`;
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
    if(!autorizza(n ? tr("Questo progetto ha {0} attività pianificate che verranno eliminate. Procedere?", n) : tr("Eliminare questo progetto?"))) return;
    S.commesse = S.commesse.filter(x=>x.id!==c.id);
    S.assegnazioni = S.assegnazioni.filter(a=>a.commessaId!==c.id);
    invalida(); segnaModificato(); chiudi(); rendi();
  };
  document.getElementById("c-ok").onclick = ()=>{
    const numero = val("c-num");
    if(!numero){ alert(tr("Serve il numero di progetto.")); return; }
    const doppio = S.commesse.some(x => x.id !== (c?c.id:null) && (x.numero||"").toLowerCase() === numero.toLowerCase());
    if(doppio){ alert(tr("Esiste già un progetto con questo numero: deve essere univoco.")); return; }
    const nuovoStato = val("c-stato") || "attiva";
    const dati = {numero, cliente:val("c-cli"), descrizione:val("c-desc"), colore:scelto || null,
                  stato:nuovoStato, apertura:val("c-apertura") || null,
                  consegnaCliente:val("c-consegna") || null,
                  natura:val("c-natura") || null};
    if(nuovoStato === "chiusa") dati.chiusaIl = (c && c.stato === "chiusa" && c.chiusaIl) ? c.chiusaIl : iso(new Date());
    else if(nuovoStato !== "archiviata") dati.chiusaIl = null;
    if(c) Object.assign(c, dati); else S.commesse.push(Object.assign({id:nuovoId("c")}, dati));
    segnaModificato(); chiudi(); rendi();
  };
}

function apriAssenza(id){
  if(!modificabile) return;
  const a = id ? S.assenze.find(x=>x.id===id) : null;
  const corpo = `
    <div class="campo"><label for="s-persona">Persona</label><select id="s-persona">${opzioniPersone(a?a.personaId:"")}</select></div>
    <div class="riga-campi">
      <div class="campo"><label for="s-tipo">Tipo</label><select id="s-tipo">
        ${Object.keys(TIPI_GIORNO).map(k=>`<option value="${k}" ${a&&a.tipo===k?"selected":""}>${tr(TIPI_GIORNO[k])}</option>`).join("")}
      </select><span class="aiuto" id="s-nota"></span></div>
      <div class="campo"><label for="s-ore">Ore</label><input type="number" id="s-ore" min="0" step="0.5" value="${a?a.ore||0:0}">
        <span class="aiuto">Solo per permessi e trasferte a ore.</span></div>
    </div>
    <div class="campo" id="s-trasf-campo" hidden>
      <label class="spunta"><input type="checkbox" id="s-trasf-intero" ${(!a || a.ore==null)?"checked":""}> Tutta la giornata</label>
      <span class="aiuto">Deseleziona per indicare solo alcune ore (es. mezza giornata).</span>
    </div>
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
  finestra(a?"Modifica giornata":"Ferie, permesso, malattia o smart", corpo, piede);
  const nota = document.getElementById("s-nota"), campoOre = document.getElementById("s-ore");
  const boxConta = document.getElementById("s-conteggio"), boxDeroga = document.getElementById("s-deroga-campo");
  const campoTrasf = document.getElementById("s-trasf-campo"), trasfIntero = document.getElementById("s-trasf-intero");
  const aggiornaTipo = () => {
    const t = val("s-tipo");
    campoTrasf.hidden = (t !== "trasferta");
    const interoGiorno = t === "trasferta" && trasfIntero.checked;
    campoOre.disabled = !(t === "permesso" || (t === "trasferta" && !interoGiorno));
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
      : t === "permesso"  ? "Riduce le ore disponibili del giorno."
      : "La persona non è disponibile: le attività saltano questi giorni.");
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
    const ore = (tipo === "trasferta" && document.getElementById("s-trasf-intero").checked)
      ? null : numVal("s-ore");
    const dati = {personaId:val("s-persona"), tipo, ore, dal, al,
                  deroga, motivo: deroga ? val("s-motivo") : ""};
    if(a) Object.assign(a, dati); else S.assenze.push(Object.assign({id:nuovoId("s")}, dati));
    invalida(); segnaModificato(); chiudi(); rendi();
  };
}
