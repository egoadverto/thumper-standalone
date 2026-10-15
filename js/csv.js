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
   11. CSV
   ========================================================== */
// Il file esportato è sempre in inglese, a prescindere dalla lingua dell'interfaccia: un file
// scaricato non ha un pubblico che sceglie la lingua (vedi CLAUDE.md). Per lo stesso motivo le
// date sono ISO aaaa-mm-gg, uguali per tutti — non itData(), che cambia con la lingua.
function esportaCsv(){
  const MODI = {inizio:"Starts on", fine:"Due by", finestra:"Spread load"};
  const num = v => String(v).replace(".", ",");   // virgola decimale, come il CSV del report (Excel in italiano)
  const righe = [["Person","Group","Project","Reference","Type","Description","From","To","Constraint","Due by",
                  "Activity","Total hours","Hours/day","In-house development","Delivery","Office deadline","Latest viable start","Notes"]];
  S.assegnazioni.forEach(a=>{
    const p = persona(a.personaId), c = commessa(a.commessaId), e = estremi(a);
    if(!p||!c) return;
    const g = gruppo(p.gruppoId);
    const lim = limiteAttivita(c, a);                 // la scadenza della SUA tipologia
    const ult = lim ? ultimoInizio(a, lim.fineUfficio) : null;
    const tp = a.tipologiaId === "nessuna" ? "No internal development"
             : (tipologiaProdotto(tipologiaAttivita(a)) || {}).nome || "";
    righe.push([p.nome, g?g.nome:"", c.numero, c.cliente, c.natura&&natura(c.natura)?natura(c.natura).nome:"", c.descrizione||"",
      e?e.dal:"", e?e.al:"", MODI[modoAtt(a)], a.scadenza||"",
      a.descrizione||"", num(a.oreTotali), num(arr(orePerGiornoEff(a))), tp,
      c.consegnaCliente||"", lim?lim.fineUfficio:"", ult||"",
      a.note||""]);
  });
  const csv = "\uFEFF" + righe.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(";")).join("\r\n");
  const b = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const u = URL.createObjectURL(b);
  const a = document.createElement("a"); a.href=u; a.download="plan.csv"; a.click();
  setTimeout(()=>URL.revokeObjectURL(u),4000);
}

/* ----------------------------------------------------------
   Calendario iCal (.ics) delle attività di una persona.
   Un evento "giornata intera" continuo per attività, dal primo all'ultimo giorno
   con ore (estremi: le date già ripartite fra attività dello stesso giorno), senza
   ore, segnato come "libero" (la persona resta disponibile per chiamate e riunioni).
   Solo esportazione, a sola lettura: nessun dato salvato, si può fare anche senza
   modifica attiva. Come importarlo (calendario dedicato, quando svuotarlo) è spiegato
   solo nel manuale, non nella finestra.
   ---------------------------------------------------------- */
// testo dentro un campo iCal: \ ; , e a capo vanno protetti (RFC 5545, 3.3.11)
function icsTesto(s){
  return String(s).replace(/\\/g,"\\\\").replace(/;/g,"\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");
}
// righe oltre 75 byte vanno spezzate, con uno spazio all'inizio della continuazione
function icsPiega(riga){
  const enc = new TextEncoder();
  if(enc.encode(riga).length <= 75) return riga;
  const out = []; let pezzo = "", lim = 75;
  for(const ch of riga){
    if(enc.encode(pezzo + ch).length > lim){ out.push(pezzo); pezzo = ""; lim = 74; }
    pezzo += ch;
  }
  out.push(pezzo);
  return out.join("\r\n ");
}
const icsData = isoStr => isoStr.replace(/-/g, "");
// attività da esportare: "attive" = non concluse né sospese (tutto il loro arco, anche la parte
// già passata); "tutto" = ogni attività che tocca gli ultimi N mesi o il futuro, concluse comprese
function attivitaCalendario(personaId, modo, mesi, oggiIso){
  const limite = new Date(d(oggiIso)); limite.setMonth(limite.getMonth() - (mesi || 0));
  const dal = iso(limite);
  return S.assegnazioni.filter(a => a.personaId === personaId)
    .map(a => ({a, e:estremi(a), c:commessa(a.commessaId)}))
    .filter(x => x.e && x.c)
    .filter(x => modo === "attive" ? (!x.a.fatta && !x.a.sospesa) : x.e.al >= dal)
    .sort((x,y) => x.e.dal < y.e.dal ? -1 : x.e.dal > y.e.dal ? 1 : 0);
}
// assenze e giornate fuori sede della persona, con lo stesso filtro di periodo delle attività:
// "attive" = quelle che finiscono da oggi in poi, "tutto" = anche gli ultimi N mesi
function assenzeCalendario(personaId, modo, mesi, oggiIso){
  const limite = new Date(d(oggiIso)); limite.setMonth(limite.getMonth() - (mesi || 0));
  const dal = modo === "attive" ? oggiIso : iso(limite);
  return (S.assenze||[]).filter(a => a.personaId === personaId && a.dal && a.al && a.al >= dal)
    .sort((x,y) => x.dal < y.dal ? -1 : x.dal > y.dal ? 1 : 0);
}
// "fuori sede" (Outlook: OOF) solo se la giornata intera è persa per il lavoro ordinario;
// smart working e permessi a ore lasciano la persona raggiungibile, quindi "libero"
function assenzaTuttoIlGiorno(a){
  return a.tipo === "ferie" || a.tipo === "malattia" || (a.tipo === "trasferta" && a.ore == null);
}
function testoIcs(personaId, modo, mesi, adesso, conAssenze){
  const p = persona(personaId);
  const ora = adesso || new Date();
  const stamp = ora.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const righe = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Thumper//Micro Planner//IT",
                 "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
                 "X-WR-CALNAME:" + icsTesto("Thumper – " + (p ? p.nome : ""))];
  attivitaCalendario(personaId, modo, mesi, iso(ora)).forEach(({a, e, c})=>{
    // stessi segni del Gantt, per distinguere a colpo d'occhio la storia dal lavoro aperto
    const segno = a.annullata ? "✕ " : a.fatta ? "✓ " : a.sospesa ? "⏸ " : "";
    const titolo = segno + c.numero + (c.cliente ? " " + c.cliente : "") + (a.descrizione ? " · " + a.descrizione : "");
    const stato = a.annullata ? tr("Annullata") : a.fatta ? tr("Conclusa") : a.sospesa ? tr("Sospesa") : "";
    const descr = [tr("Monte ore: {0} h", arr(a.oreTotali||0)), stato, a.note || ""].filter(Boolean).join("\n");
    righe.push("BEGIN:VEVENT",
      "UID:" + a.id + "@thumper",
      "DTSTAMP:" + stamp,
      "DTSTART;VALUE=DATE:" + icsData(e.dal),
      "DTEND;VALUE=DATE:" + icsData(iso(sommaGiorni(d(e.al), 1))),   // fine esclusa: il giorno dopo l'ultimo
      "SUMMARY:" + icsTesto(titolo),
      "DESCRIPTION:" + icsTesto(descr),
      "TRANSP:TRANSPARENT",
      "X-MICROSOFT-CDO-BUSYSTATUS:FREE",
      "X-MICROSOFT-CDO-ALLDAYEVENT:TRUE",
      "END:VEVENT");
  });
  if(conAssenze) assenzeCalendario(personaId, modo, mesi, iso(ora)).forEach(a=>{
    const ore = a.ore != null && (a.tipo === "permesso" || a.tipo === "trasferta") ? " · " + tr("{0} h", arr(a.ore)) : "";
    const fuori = assenzaTuttoIlGiorno(a);
    righe.push("BEGIN:VEVENT",
      "UID:" + a.id + "@thumper",
      "DTSTAMP:" + stamp,
      "DTSTART;VALUE=DATE:" + icsData(a.dal),
      "DTEND;VALUE=DATE:" + icsData(iso(sommaGiorni(d(a.al), 1))),
      "SUMMARY:" + icsTesto(tr(TIPI_GIORNO[a.tipo] || a.tipo) + ore),
      ...(a.motivo ? ["DESCRIPTION:" + icsTesto(a.motivo)] : []),
      "TRANSP:" + (fuori ? "OPAQUE" : "TRANSPARENT"),
      "X-MICROSOFT-CDO-BUSYSTATUS:" + (fuori ? "OOF" : "FREE"),
      "X-MICROSOFT-CDO-ALLDAYEVENT:TRUE",
      "END:VEVENT");
  });
  righe.push("END:VCALENDAR");
  return righe.map(icsPiega).join("\r\n") + "\r\n";
}
// finestra di scelta: persona, solo attive o tutto con quanto storico. Funziona anche in sola lettura
function apriEsportaCalendario(personaId){
  const sceltaIniziale = personaId
    || personaAutore()
    || ((personeOrdinate(true)[0] || {}).id);
  finestra(tr("Esporta calendario"),
    `<div class="campo"><label for="ec-persona">Persona</label><select id="ec-persona">${opzioniPersone(sceltaIniziale)}</select></div>
     <div class="campo" style="margin-top:10px">
       <label class="spunta"><input type="radio" name="ec-modo" id="ec-attive" value="attive" checked> Solo attività attive</label>
       <span class="aiuto">Quelle non ancora concluse né sospese, dall'inizio alla fine.</span>
       <label class="spunta" style="margin-top:6px"><input type="radio" name="ec-modo" id="ec-tutto" value="tutto"> Tutto il calendario</label>
       <span class="aiuto">Anche le attività concluse, annullate e sospese, per tenerne traccia.</span>
     </div>
     <div class="campo" style="margin-top:6px"><label for="ec-mesi">Storico da includere</label>
       <select id="ec-mesi" disabled>
         <option value="1">1 mese</option><option value="3">3 mesi</option>
         <option value="6">6 mesi</option><option value="12" selected>1 anno</option>
       </select></div>
     <div class="campo" style="margin-top:10px"><label class="spunta"><input type="checkbox" id="ec-assenze"> Includi assenze e giornate fuori sede</label>
       <span class="aiuto">Ferie, malattia, permessi, smart working e trasferte, nello stesso periodo.</span></div>
     <p class="nota" id="ec-conta"></p>`,
    `<button class="btn" id="ec-annulla">Annulla</button>
     <button class="btn primario" id="ec-ok">Scarica .ics</button>`);
  const modo = () => document.getElementById("ec-tutto").checked ? "tutto" : "attive";
  const aggiorna = () => {
    document.getElementById("ec-mesi").disabled = modo() !== "tutto";
    const n = attivitaCalendario(val("ec-persona"), modo(), +val("ec-mesi"), iso(new Date())).length;
    const na = document.getElementById("ec-assenze").checked
      ? assenzeCalendario(val("ec-persona"), modo(), +val("ec-mesi"), iso(new Date())).length : 0;
    document.getElementById("ec-conta").textContent = (n === 1 ? tr("1 attività nel file.") : tr("{0} attività nel file.", n))
      + (document.getElementById("ec-assenze").checked ? " " + (na === 1 ? tr("1 assenza.") : tr("{0} assenze.", na)) : "");
    document.getElementById("ec-ok").disabled = n + na === 0;
  };
  ["ec-persona","ec-attive","ec-tutto","ec-mesi","ec-assenze"].forEach(i => document.getElementById(i).addEventListener("change", aggiorna));
  aggiorna();
  document.getElementById("ec-annulla").onclick = chiudi;
  document.getElementById("ec-ok").onclick = ()=>{
    const pid = val("ec-persona"), p = persona(pid);
    const testo = testoIcs(pid, modo(), +val("ec-mesi"), null, document.getElementById("ec-assenze").checked);
    const b = new Blob([testo], {type:"text/calendar;charset=utf-8"});
    const u = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href = u;
    // nome file sempre in inglese, come gli altri file esportati (vedi CLAUDE.md)
    a.download = "calendar_" + (p ? p.nome.replace(/[^\w\-]+/g, "_") : "person") + "_" + iso(new Date()) + ".ics";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(u), 4000);
    chiudi();
  };
}
