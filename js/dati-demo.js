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
   1. DATI PREDEFINITI  (usati solo se manca dati.js)
   ========================================================== */
const GRUPPI_BASE = [
  {id:"g1", sigla:"PM", nome:"Progettazione meccanica"},
  {id:"g2", sigla:"PE", nome:"Progettazione elettrica"},
  {id:"g3", sigla:"PT", nome:"Progettazione termodinamica"},
  {id:"g4", sigla:"AP", nome:"Applications"}
];

const TAVOLOZZA = ["#1B6E93","#2E7D6B","#4B7A2E","#8C6D0F","#A34A16","#96315C",
                   "#6B4A96","#3D5A96","#3F8C8C","#506270","#7A5A3A","#5C6E42"];

function datiDemo(){
  const oggi = new Date();
  const lun = inizioSettimana(oggi);
  const g = n => iso(sommaGiorni(lun, n));
  return {
    meta:{versione:1, salvatoDa:"", salvatoIl:""},
    config:{
      efficienza:1,
      giorniLavorativi:[1,2,3,4,5],
      chiusure:[],
      smartMaxSettimana:2,
      giorniArchiviazione:180,
      codice:null,
      proteggiAttivita:false,
      oreGiorniSettimana:{1:8,2:8,3:8,4:8,5:8,6:8,0:8},
      margineGiorni:0,
      leadFornitura:[],
      leadProduzione:[]
    },
    gruppi:GRUPPI_BASE.map(x=>({...x})),
    mansioni:[],
    persone:[
      {id:"p1", nome:"Rossi Marco", gruppoId:"g1", gruppiExtra:[], oreGiorno:null, smartMax:null, attivo:true},
      {id:"p2", nome:"Bianchi Elena", gruppoId:"g1", gruppiExtra:["g4"], oreGiorno:null, smartMax:null, attivo:true},
      {id:"p3", nome:"Conti Davide", gruppoId:"g2", gruppiExtra:[], oreGiorno:null, attivo:true},
      {id:"p4", nome:"Ferrari Luca", gruppoId:"g3", gruppiExtra:["g1"], oreGiorno:6, attivo:true},
      {id:"p5", nome:"Greco Sara", gruppoId:"g4", gruppiExtra:[], oreGiorno:null, attivo:true}
    ],
    commesse:[
      {id:"c1", numero:"25-0412", cliente:"Frimeccanica", descrizione:"Linea produttiva A", colore:null, stato:"attiva", apertura:g(-20)},
      {id:"c2", numero:"25-0455", cliente:"Termonova", descrizione:"", colore:null, stato:"attiva", apertura:g(-5)},
      {id:"c3", numero:"25-0470", cliente:"Glacia Industrie", descrizione:"Revamping centrale", colore:null, stato:"attiva", apertura:g(0)}
    ],
    assegnazioni:[
      {id:"a1", personaId:"p1", commessaId:"c1", dataInizio:g(0), oreTotali:56, orePerGiorno:8, note:""},
      {id:"a2", personaId:"p1", commessaId:"c2", dataInizio:g(3), oreTotali:24, orePerGiorno:4, note:""},
      {id:"a3", personaId:"p2", commessaId:"c1", dataInizio:g(2), oreTotali:40, orePerGiorno:8, note:""},
      {id:"a4", personaId:"p3", commessaId:"c3", dataInizio:g(0), oreTotali:30, orePerGiorno:6, note:""},
      {id:"a5", personaId:"p4", commessaId:"c1", dataInizio:g(7), oreTotali:36, orePerGiorno:6, note:""},
      {id:"a6", personaId:"p5", commessaId:"c2", dataInizio:g(1), oreTotali:16, orePerGiorno:8, note:""}
    ],
    assenze:[
      {id:"s1", personaId:"p2", dal:g(8), al:g(12), tipo:"ferie", ore:0}
    ],
    backlog:[
      {id:"bk1", titolo:"Richiesta preventivo revisione quadro", descrizione:"", priorita:"alta", stato:"dafare", ownerId:null, creato:g(-2)},
      {id:"bk2", titolo:"Aggiornare disegno standard staffa", descrizione:"Da rifare in formato nativo", priorita:"media", stato:"incorso", ownerId:"p3", creato:g(-6)},
      {id:"bk3", titolo:"Verifica normativa nuova direttiva macchine", descrizione:"", priorita:"bassa", stato:"fatto", ownerId:"p1", creato:g(-15)}
    ]
  };
}
