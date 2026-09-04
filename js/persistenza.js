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
   5. PERSISTENZA
   ========================================================== */
function serializza(){
  S.meta.salvatoIl = new Date().toISOString();
  return "// Dati di Thumper — Micro Planner. Non modificare a mano.\n" +
         "window.PLANNER_DATA = " + JSON.stringify(S, null, 1) + ";\n";
}
const MAX_BACKUP = 5;   // copie precedenti tenute nella sottocartella backup/, le altre si scartano
// copia il contenuto che sta per essere sovrascritto in cartella/backup/, poi tiene solo le ultime MAX_BACKUP.
// È un extra: se fallisce (permessi, disco pieno...) non deve mai bloccare il salvataggio vero.
async function backupPrimaDiScrivere(vecchioTesto){
  if(!cartellaSalvataggio || !vecchioTesto) return;
  try{
    const dirBackup = await cartellaSalvataggio.getDirectoryHandle("backup", {create:true});
    const ora = new Date();
    const bollo = iso(ora) + "_" + String(ora.getHours()).padStart(2,"0")
                + String(ora.getMinutes()).padStart(2,"0") + String(ora.getSeconds()).padStart(2,"0");
    const wb = await (await dirBackup.getFileHandle("dati-" + bollo + ".js", {create:true})).createWritable();
    await wb.write(vecchioTesto); await wb.close();
    const nomi = [];
    for await (const v of dirBackup.values()) if(v.kind === "file" && /^dati-.*\.js$/.test(v.name)) nomi.push(v.name);
    nomi.sort();
    while(nomi.length > MAX_BACKUP) await dirBackup.removeEntry(nomi.shift());
  }catch(err){ /* backup saltato, il salvataggio prosegue lo stesso */ }
}
// il meta di un dati.js già scritto, dal suo testo grezzo — usato solo per accorgersi se
// qualcuno ha salvato nel frattempo (vedi salva()), non per caricarlo davvero: se il testo non
// si legge come dati Thumper validi non si può verificare, e allora non si blocca il salvataggio
// per un file che magari non è nemmeno il nostro (meglio un salvataggio in più che uno bloccato a vuoto)
function metaDiTesto(testo){
  try{
    const i = testo.indexOf("{"), j = testo.lastIndexOf("}");
    return JSON.parse(testo.slice(i, j+1)).meta || null;
  }catch(err){ return null; }
}
// finestra di Thumper (non l'avviso nativo del browser) per lo stesso caso delle note: il
// salvataggio è già stato annullato quando questa viene aperta, serve solo ad avvisare e a
// offrire la scorciatoia per ricaricare — nessuna azione qui riguarda dati non ancora salvati
function finestraConflittoSalvataggio(meta){
  const quando = meta.salvatoIl ? new Date(meta.salvatoIl).toLocaleString(lingua==="it"?"it-IT":"en-GB") : "";
  finestra(tr("Salvataggio annullato"),
    `<p>${tr("Qualcuno ha salvato il piano nel frattempo — il tuo salvataggio è stato annullato per non perdere le sue modifiche.")}</p>
     <div class="avviso">${meta.salvatoDa ? `<b>${esc(meta.salvatoDa)}</b>` : ""}${esc(quando)}</div>
     <p>${tr("Ricarica l'ultima versione, poi rifai a mano le modifiche che avevi appena fatto.")}</p>`,
    `<button class="btn" id="conflitto-chiudi">${tr("Ho capito")}</button>
     <button class="btn primario" id="conflitto-apri">${tr("Apri file…")}</button>`);
  document.getElementById("conflitto-chiudi").onclick = chiudi;
  document.getElementById("conflitto-apri").onclick = () => { chiudi(); apriFile(); };
}
// true (e avvisa) se il testo riletto da disco ha un salvatoIl diverso da quello con cui questa
// sessione è partita: significa che qualcun altro ha già salvato, sovrascriverlo perderebbe le
// sue modifiche. Come per le note dei progetti: si annulla, non si sovrascrive e non si unisce da soli.
function conflittoSalvataggio(vecchio){
  if(!vecchio) return false;
  const meta = metaDiTesto(vecchio);
  if(!meta || meta.salvatoIl === salvatoIlConosciuto) return false;
  finestraConflittoSalvataggio(meta);
  return true;
}
async function salva(){
  const vecchioTimestamp = S.meta.salvatoIl;   // ripristinato se il salvataggio si ferma senza scrivere nulla
  const testo = serializza();
  if(manico){
    try{
      const vecchio = await manico.getFile().then(f=>f.text()).catch(()=>"");
      if(conflittoSalvataggio(vecchio)){ S.meta.salvatoIl = vecchioTimestamp; return; }
      const w = await manico.createWritable();
      await w.write(testo); await w.close();
      if(cartellaSalvataggio) await backupPrimaDiScrivere(vecchio);
      salvatoIlConosciuto = S.meta.salvatoIl;
      modificato = false; aggiornaStato(); brindisi(tr("Salvato in dati.js"));
      return;
    }catch(err){ manico = null; cartellaSalvataggio = null; }
  }
  if(window.showDirectoryPicker){
    try{
      const dir = await window.showDirectoryPicker({mode:"readwrite", id:"dati-planner"});
      manico = await dir.getFileHandle("dati.js", {create:true});
      cartellaSalvataggio = dir;
      const vecchio = await manico.getFile().then(f=>f.text()).catch(()=>"");
      if(conflittoSalvataggio(vecchio)){ S.meta.salvatoIl = vecchioTimestamp; return; }
      const w = await manico.createWritable();
      await w.write(testo); await w.close();
      await backupPrimaDiScrivere(vecchio);
      salvatoIlConosciuto = S.meta.salvatoIl;
      modificato = false; aggiornaStato(); brindisi(tr("Salvato in dati.js"));
      return;
    }catch(err){
      if(err && err.name === "AbortError"){ S.meta.salvatoIl = vecchioTimestamp; return; }
    }
  } else if(window.showSaveFilePicker){
    try{
      manico = await window.showSaveFilePicker({
        suggestedName:"dati.js",
        types:[{description:"Dati Thumper", accept:{"text/javascript":[".js"]}}]
      });
      const vecchio = await manico.getFile().then(f=>f.text()).catch(()=>"");
      if(conflittoSalvataggio(vecchio)){ S.meta.salvatoIl = vecchioTimestamp; return; }
      const w = await manico.createWritable();
      await w.write(testo); await w.close();
      salvatoIlConosciuto = S.meta.salvatoIl;
      modificato = false; aggiornaStato(); brindisi(tr("Salvato in dati.js"));
      return;
    }catch(err){
      if(err && err.name === "AbortError"){ S.meta.salvatoIl = vecchioTimestamp; return; }
    }
  }
  scarica("dati.js", testo);
  modificato = false; aggiornaStato();
  brindisi(tr("dati.js scaricato: spostalo nella cartella di rete sovrascrivendo il vecchio"));
}
function scarica(nome, testo){
  const b = new Blob([testo], {type:"text/javascript"});
  const u = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = u; a.download = nome; a.click();
  setTimeout(()=>URL.revokeObjectURL(u), 4000);
}
async function apriFile(){
  if(window.showOpenFilePicker){
    try{
      const [h] = await window.showOpenFilePicker({types:[{description:"Dati Thumper", accept:{"text/javascript":[".js"],"application/json":[".json"]}}]});
      const f = await h.getFile();
      // handle di un file singolo, non della sua cartella: niente backup finché non si rifà "Salva"
      if(caricaTesto(await f.text())){ manico = h; cartellaSalvataggio = null; }
      return;
    }catch(err){ if(err && err.name==="AbortError") return; }
  }
  const inp = document.createElement("input");
  inp.type="file"; inp.accept=".js,.json";
  inp.onchange = async () => {
    if(!inp.files[0]) return;
    if(caricaTesto(await inp.files[0].text())){ manico = null; cartellaSalvataggio = null; }  // niente handle: si salva scaricando
  };
  inp.click();
}
function caricaTesto(testo){
  try{
    const i = testo.indexOf("{");
    const j = testo.lastIndexOf("}");
    const dati = JSON.parse(testo.slice(i, j+1));
    S = normalizza(dati);
    salvatoIlConosciuto = S.meta.salvatoIl || null;
    const n = archiviaScadute();
    invalida(); modificato = !!n; aggiornaStato(); rendi();
    brindisi(n ? tr("Dati caricati · {0} archiviate automaticamente", n) : tr("Dati caricati"));
    return true;
  }catch(err){
    alert(tr("Il file non è leggibile: ") + err.message);
    return false;                                  // il file non e' valido: non va usato per salvare
  }
}
function normalizza(x){
  const base = datiDemo();
  const s = Object.assign({}, base, x);
  s.meta = Object.assign({versione:1,salvatoDa:"",salvatoIl:""}, x.meta||{});
  s.config = Object.assign({}, base.config, x.config||{});
  // file salvati prima che ogni giorno della settimana avesse le sue ore: le vecchie "ore
  // al giorno predefinite"/"ore standard" riempiono i giorni che nel file non erano impostati
  {
    const xOre = (x.config && x.config.oreGiorniSettimana) || {};
    const cfgVecchia = x.config || {};
    const legacy = cfgVecchia.oreStandard != null ? +cfgVecchia.oreStandard
                 : cfgVecchia.oreGiornoDefault != null ? +cfgVecchia.oreGiornoDefault : null;
    const oreSett = {};
    [0,1,2,3,4,5,6].forEach(n=>{
      const v = xOre[n];
      oreSett[n] = (v != null && v !== "") ? +v : (legacy != null ? legacy : 8);
    });
    s.config.oreGiorniSettimana = oreSett;
  }
  if(s.config.efficienza == null) s.config.efficienza = 1;
  delete s.config.oreStandard;
  delete s.config.oreGiornoDefault;
  delete s.config.patrono;   // sostituito da una voce in config.chiusure
  // festività nazionali: da elenco fisso (10 voci italiane + Pasquetta, con opt-out in
  // festivitaEscluse) a elenco personalizzabile come le mansioni — vedi CLAUDE.md. Un vecchio
  // dati.js senza festivitaNazionali riparte dal preset Italia, rispettando le esclusioni già
  // salvate (stesso id delle vecchie chiavi "MM-GG"/"pasquetta").
  if(!s.config.festivitaNazionali){
    const escluse = new Set((x.config && x.config.festivitaEscluse) || []);
    s.config.festivitaNazionali = PRESET_FESTIVITA.italia.filter(v => !escluse.has(v.id)).map(v=>Object.assign({}, v));
  }
  delete s.config.festivitaEscluse;
  s.gruppi = x.gruppi && x.gruppi.length ? x.gruppi : base.gruppi;
  // distingue, dentro uno stesso gruppo, chi non fa lo stesso lavoro: usata dalle riassegnazioni
  // suggerite per capire chi puo' davvero sostituire chi (vedi calcoli.js candidatiPersona())
  s.mansioni = x.mansioni || [];
  // tipologia di progetto (ex "natura"): elenco personalizzabile come le mansioni. I due valori
  // fissi di prima ("ordine"/"sviluppo") diventano le voci di default, con lo stesso id: i vecchi
  // dati.js con commessa.natura="ordine" restano validi senza bisogno di migrare quel campo.
  s.tipologie = x.tipologie || [
    {id:"ordine", sigla:"ORD", nome:"Per ordine", richiedeConsegna:true},
    {id:"sviluppo", sigla:"STD", nome:"Sviluppo nuova gamma", richiedeConsegna:false}
  ];
  s.persone = (x.persone || []).map(p => { const q = Object.assign({smartMax:null, mansioneId:null}, p); delete q.smart; return q; });
  // vecchi file avevano solo "settimane": diventa "valore" + "unita" (default settimane, per compatibilità)
  const normalizzaVoceLead = (v, prefisso) => {
    const q = Object.assign({id:nuovoId(prefisso)}, v);
    if(q.valore == null) q.valore = q.settimane;
    delete q.settimane;
    q.unita = q.unita === "giorni" ? "giorni" : "settimane";
    return q;
  };
  s.config.leadFornitura = (s.config.leadFornitura || []).map(v => normalizzaVoceLead(v, "lf"));
  // richiedeFornitura di default true: chi non la tocca vede lo stesso calcolo di sempre
  // (fornitura esterna sempre sommata allo sviluppo interno)
  s.config.leadProduzione = (s.config.leadProduzione || []).map(v => {
    const q = normalizzaVoceLead(v, "lp");
    if(q.richiedeFornitura == null) q.richiedeFornitura = true;
    return q;
  });
  s.commesse = (x.commesse || []).map(c => {
    const q = Object.assign({
      stato: (c.attiva === false ? "chiusa" : "attiva"), apertura: null, colore: null, descrizione: "", chiusaIl: null,
      consegnaCliente: null, tipologiaId: null, natura: null, cartella: ""
    }, c, {stato: c.stato || (c.attiva === false ? "chiusa" : "attiva")});
    // chi era gia' chiuso senza data prende oggi: il conto alla rovescia parte da adesso, non retroattivo
    if(q.stato === "chiusa" && !q.chiusaIl) q.chiusaIl = iso(new Date());
    return q;
  });
  // stesso calcolo di capacitaPersonaGiorno(), ma autonomo: qui S non è ancora assegnata
  const oreDi = (pid, isoStr) => {
    const q = s.persone.find(z => z.id === pid);
    const giorno = +s.config.oreGiorniSettimana[d(isoStr).getDay()];
    const personale = (q && q.oreGiorno != null) ? q.oreGiorno : null;
    return (personale != null && personale < giorno) ? personale : giorno;
  };
  s.assegnazioni = (x.assegnazioni || []).map(a=>{
    const q = Object.assign({}, a);
    if(q.orePerGiorno != null && q.orePerGiorno === oreDi(q.personaId, q.dataInizio)) q.orePerGiorno = null;
    // i file salvati prima della modalità finestra non hanno il campo: si ricava dal vincolo
    if(!q.modo) q.modo = q.scadenza ? "fine" : "inizio";
    return q;
  });
  s.assenze = x.assenze || [];
  // backlog: elenco separato, non entra mai nel piano finché non viene promosso in
  // un'assegnazione (vedi apriAttivita/promuoviBacklogItem) — default per ogni campo,
  // così un vecchio dati.js senza backlog (o con voci scritte a mano incomplete) non si rompe
  // stato e priorità sono elenchi chiusi: un valore scritto a mano fuori elenco tornerebbe
  // al default solo a video, lasciando il dato salvato diverso da quello che si vede
  s.backlog = (x.backlog || []).map(b => {
    const q = Object.assign(
      {priorita:"media", stato:"dafare", ownerId:null, descrizione:"", creato:iso(new Date())}, b);
    if(!STATI_BACKLOG[q.stato]) q.stato = "dafare";
    if(!PRIORITA_BACKLOG[q.priorita]) q.priorita = "media";
    return q;
  });
  return s;
}
// archiviazione automatica: sposta in archivio le commesse chiuse da piu' del periodo impostato
function archiviaScadute(){
  const soglia = S.config.giorniArchiviazione;
  if(!soglia || soglia <= 0) return 0;
  const oggi = iso(new Date());
  let n = 0;
  S.commesse.forEach(c=>{
    if(c.stato !== "chiusa" || !c.chiusaIl) return;
    if(diffGiorni(c.chiusaIl, oggi) >= soglia){ c.stato = "archiviata"; n++; }
  });
  return n;
}

function brindisi(msg){
  const el = document.createElement("div");
  el.className = "brindello"; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 4200);
}
