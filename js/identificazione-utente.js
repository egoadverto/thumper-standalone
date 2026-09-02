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
   8quinquies. IDENTIFICAZIONE UTENTE (AUTORE)
   ========================================================== */

/* Chi sei: identificazione, non autenticazione. Non c'e' nessun server che
   verifichi niente e chiunque puo' scegliere il nome di chiunque. Serve a
   sapere chi firma le note e chi ha salvato il piano, non a impedire
   l'accesso: quello, con un file locale, non e' ottenibile. */
function chiediChiSei(primoAvvio){
  const elenco = personeOrdinate(true);
  finestra(tr("Chi sei?"),
    `<div class="marchio din verticale"><svg class="logo grande" viewBox="0 0 64 64" aria-hidden="true"><g stroke-width="9" stroke-linecap="round" fill="none"><path d="M16 34 L32 18" stroke="#152029"/><path d="M24 42 L52 14" stroke="#0F6E8C"/><path d="M32 50 L54 28" stroke="#C97A0A"/></g></svg><span class="marchio-testo"><b>Thumper</b><span>Micro Planner</span></span></div>
     <p style="margin:0 0 2px;text-align:center">${tr("Il nome firma le note che scrivi e il salvataggio del piano.")}</p>
     <p class="nota" style="margin:0 0 14px;text-align:center">${tr("Non è una password: serve a farsi riconoscere dai colleghi.")}</p>
     <div class="campo"><label for="lg-persona">Nome</label>
       <select id="lg-persona">
         <option value="">— altro nome —</option>
         ${elenco.map(p=>`<option value="${esc(p.nome)}" ${AUTORE===p.nome?"selected":""}>${esc(p.nome)}</option>`).join("")}
       </select></div>
     <div class="campo" id="lg-box-altro" ${AUTORE && !elenco.some(p=>p.nome===AUTORE) ? "" : "hidden"}>
       <label for="lg-altro">Scrivi il tuo nome</label>
       <input type="text" id="lg-altro" value="${esc(AUTORE||"")}"></div>`,
    `${primoAvvio?`<button class="btn sinistra" id="lg-salta">${tr("Solo consultazione")}</button>`:""}
     <button class="btn primario" id="lg-ok">${tr("Entra")}</button>`,
    primoAvvio);

  const sel = document.getElementById("lg-persona");
  const box = document.getElementById("lg-box-altro");
  if(AUTORE && !elenco.some(p=>p.nome===AUTORE)) sel.value = "";
  sel.onchange = ()=>{
    box.hidden = !!sel.value;
    if(!sel.value) document.getElementById("lg-altro").focus();
  };
  const conferma = ()=>{
    const n = sel.value || val("lg-altro");
    if(!n) return brindisi(tr("Scegli o scrivi un nome"));
    AUTORE = n.trim();
    chiudi();
    aggiornaBottoneUtente();
    brindisi(tr("Ciao {0}", AUTORE));
  };
  document.getElementById("lg-ok").onclick = conferma;
  const salta = document.getElementById("lg-salta");
  if(salta) salta.onclick = ()=>{ chiudi(); aggiornaBottoneUtente(); };
}
function aggiornaBottoneUtente(){
  const b = document.getElementById("btn-utente");
  if(!b) return;
  b.textContent = AUTORE || tr("Chi sei?");
  b.title = AUTORE ? tr("Firmi come {0}. Premi per cambiare.", AUTORE) : tr("Fatti riconoscere");
  b.classList.toggle("primario", !AUTORE);
}

function chiediAutore(forza){
  if(AUTORE && !forza) return AUTORE;
  if(!forza){ chiediChiSei(false); return ""; }
  const n = prompt(tr("Con che nome vuoi firmare le note?"), AUTORE || S.meta.salvatoDa || "");
  if(n && n.trim()) AUTORE = n.trim();
  return AUTORE;
}

/* Il browser puo' conservare la "chiave" di una cartella nel proprio
   magazzino interno. Su file:// quel magazzino e' spesso disattivato:
   in quel caso tutto continua a funzionare, solo senza il ricordo. */
