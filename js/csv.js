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
   11. CSV
   ========================================================== */
function esportaCsv(){
  const MODI = {inizio:"Parte il", fine:"Consegna entro il", finestra:"Finestra ripartita"};
  const righe = [["Person","Group","Project","Reference","Type","Description","From","To","Constraint","Due by",
                  "Activity","Total hours","Hours/day","In-house development","Delivery","Office deadline","Latest viable start","Notes"]];
  S.assegnazioni.forEach(a=>{
    const p = persona(a.personaId), c = commessa(a.commessaId), e = estremi(a);
    if(!p||!c) return;
    const g = gruppo(p.gruppoId);
    const lim = limiteAttivita(c, a);                 // la scadenza della SUA tipologia
    const ult = lim ? ultimoInizio(a, lim.fineUfficio) : null;
    const tp = a.tipologiaId === "nessuna" ? tr("nessuno sviluppo interno")
             : (tipologiaProdotto(tipologiaAttivita(a)) || {}).nome || "";
    righe.push([p.nome, g?g.nome:"", c.numero, c.cliente, c.natura&&natura(c.natura)?natura(c.natura).nome:"", c.descrizione||"",
      e?itData(e.dal):"", e?itData(e.al):"", tr(MODI[modoAtt(a)]), a.scadenza?itData(a.scadenza):"",
      a.descrizione||"", a.oreTotali, arr(orePerGiornoEff(a)), tp,
      c.consegnaCliente?itData(c.consegnaCliente):"", lim?itData(lim.fineUfficio):"", ult?itData(ult):"",
      a.note||""]);
  });
  const csv = "\uFEFF" + righe.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(";")).join("\r\n");
  const b = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const u = URL.createObjectURL(b);
  const a = document.createElement("a"); a.href=u; a.download="plan.csv"; a.click();
  setTimeout(()=>URL.revokeObjectURL(u),4000);
}
