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
   8quater. STATO DI SESSIONE — CARTELLA DELLA COMMESSA
   ----------------------------------------------------------
   Due cose separate, ed e' importante capire perche':
   - IL PERCORSO (es. Z:\PROGETTI\25-0412 - Frimeccanica) lo scrive
     l'utente e finisce in dati.js. Il browser non lo rivela
     mai da solo. Serve per costruire i collegamenti che
     aprono i file nel loro programma.
   - IL PERMESSO di leggere la cartella lo concede l'utente
     scegliendola con la finestra di Windows. Non e'
     memorizzabile: scade quando si chiude la pagina.
   ========================================================== */
const CARTELLE = new Map();   // id commessa -> handle, vive solo in questa sessione
const ALBERI   = new Map();   // id commessa -> elenco piatto dei file letti
const RADICI   = [];          // le cartelle archivio collegate in questa sessione
const PREFISSI = new Map();   // nome radice -> pezzo iniziale del percorso (es. Z:\PROGETTI)
const DENTRO   = new Map();   // id commessa -> {radice, dentro} dove e' stata trovata
let RADICI_SOSPESE = [];      // ricordate dal browser, in attesa di una conferma
/* Chi firma le note. Vive solo in questa sessione e NON finisce in dati.js:
   il nome di chi ha salvato il piano non deve firmare le note di un collega. */
let AUTORE = "";
