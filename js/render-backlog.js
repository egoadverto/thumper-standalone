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
   8quater. RENDER — BACKLOG
   ----------------------------------------------------------
   Elenco separato di attività non ancora pianificate (nessuna commessa,
   nessuna data): un semplice Kanban a 3 colonne per stato. Non entra mai nei
   calcoli di carico/capacità — solo un'attività "promossa" (diventata una
   vera assegnazione, vedi apriAttivita) ci entra, e a quel punto esce dal
   backlog. Zero relazione con distribuzione/mediana/scarto: la lista qui
   sotto è pura visualizzazione + CRUD.
   ========================================================== */

// raggruppa il backlog per stato, più recenti in cima in ciascuna colonna
function backlogPerStato(){
  const colonne = {};
  Object.keys(STATI_BACKLOG).forEach(k => colonne[k] = []);
  // creato è solo una data (senza ora): gli elementi dello stesso giorno pareggiano sempre.
  // reverse() prima dell'ordinamento stabile li lascia in ordine di inserimento inverso,
  // così anche a parità di data l'ultimo creato resta in cima
  (S.backlog||[]).slice().reverse().sort((a,b)=> (b.creato||"").localeCompare(a.creato||"")).forEach(it=>{
    (colonne[it.stato] || colonne.dafare).push(it);
  });
  return colonne;
}

function rendiBacklog(){
  const colonne = backlogPerStato();
  const totale = (S.backlog||[]).length;

  const carta = it => {
    const ow = it.ownerId ? persona(it.ownerId) : null;
    return `<div class="bk-card">
      <div class="bk-card-alto">
        <span class="chip bk-pri-${esc(it.priorita)}">${esc(tr(PRIORITA_BACKLOG[it.priorita] || it.priorita))}</span>
        ${ow ? `<span class="nota">${esc(ow.nome)}</span>` : ""}
      </div>
      <div class="bk-card-titolo" data-mod-backlog="${it.id}">${esc(it.titolo)}</div>
      ${it.descrizione ? `<div class="nota">${esc(it.descrizione)}</div>` : ""}
      <div class="bk-card-azioni">
        <select data-bk-stato="${it.id}" aria-label="${tr('Stato')}" ${modificabile?"":"disabled"}>
          ${Object.keys(STATI_BACKLOG).map(k=>`<option value="${k}" ${it.stato===k?"selected":""}>${tr(STATI_BACKLOG[k])}</option>`).join("")}
        </select>
        <button class="btn piccolo" data-bk-promuovi="${it.id}">${tr("Promuovi")}</button>
        <button class="btn piccolo pericolo" data-del-backlog="${it.id}">${tr("Elimina")}</button>
      </div>
    </div>`;
  };

  const colonna = (chiave) => `
    <div class="bk-colonna">
      <h3 class="bk-titolo din">${tr(STATI_BACKLOG[chiave])} <span class="conteggio mono">${colonne[chiave].length}</span></h3>
      <div class="bk-lista">
        ${colonne[chiave].map(carta).join("") || `<div class="nota" style="padding:8px 2px">${tr("Nessun elemento.")}</div>`}
      </div>
    </div>`;

  document.getElementById("pagina").innerHTML = `<div class="contenuto">
    <div class="pannello">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <h2 class="din" style="margin:0">${tr("Backlog")}</h2>
        <span class="conteggio mono" style="margin:0">${tr("{0} elementi", totale)}</span>
        <button class="btn primario" style="margin-left:auto" data-mod-backlog="">${tr("+ Nuovo elemento")}</button>
      </div>
      <p class="nota" style="margin:0 0 14px">${tr("Richieste, idee o attività fuori progetto, ancora senza commessa né data. “Promuovi” le trasforma in un'attività pianificata vera e propria.")}</p>
      <div class="bk-tabellone">
        ${Object.keys(STATI_BACKLOG).map(colonna).join("")}
      </div>
    </div>
  </div>`;
}
