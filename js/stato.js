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
   3. STATO
   ========================================================== */
// versione del programma (non lo schema dati: quella è meta.versione, cosa diversa —
// vedi PLANNER_DATA in CLAUDE.md), mostrata in Impostazioni > Licenza. Politica di
// aggiornamento in CLAUDE.md (repo Thumper01-dev), sezione "Versione dell'app": semver,
// un push su main = un rilascio, incremento a cura di chi fa il push in base a cosa contiene.
const VERSIONE_APP = "1.1.0";
let S = null;
let modificabile = false;
let modificato = false;
let manico = null;          // handle del file (Chrome/Edge)
let cartellaSalvataggio = null;   // handle della cartella di dati.js, solo per i backup di sessione
// meta.salvatoIl del dati.js su cui questa sessione si basa (dall'avvio o dall'ultimo salvataggio
// riuscito): se al momento di salvare il file su disco ne ha uno diverso, qualcun altro ha salvato
// nel frattempo — vedi salva() in persistenza.js
let salvatoIlConosciuto = null;
const V = {
  vista:"piano",
  inizio:iso(inizioSettimana(new Date())),
  giorni:84,   // finestra visibile in giorni: 12 settimane di default, non piu' un multiplo fisso di 7 coi preset a mese
  colonna:34,
  filtroCommessa:"",
  nascondiFatte:false,
  annoFest:new Date().getFullYear(),
  calAnteprima:"attivo",  // "attivo" o chiave di PRESET_FESTIVITA — solo la vista Anteprima, mai config.festivitaNazionali
  sottoImp:"calendario",
  sottoVer:"carichi",
  repAmbito:"tutti",
  repOrdine:"gruppo",
  sottoAna:"persone",
  sottoCom:"elenco",
  opzioniAperte:new Set(),  // chiavi "giorno|personaId" delle righe di sovraccarico espanse
  leadModifica:new Set()    // id delle voci di lead time (Fornitura esterna/Sviluppo interno) sbloccate per la modifica
};

function nuovoId(pref){ return pref + "_" + crypto.randomUUID(); }
function persona(id){ return S.persone.find(p=>p.id===id); }
function commessa(id){ return S.commesse.find(c=>c.id===id); }
function gruppo(id){ return S.gruppi.find(g=>g.id===id); }
function mansione(id){ return (S.mansioni||[]).find(m=>m.id===id); }
function natura(id){ return (S.tipologie||[]).find(t=>t.id===id); }
function festivita(id){ return (S.config.festivitaNazionali||[]).find(v=>v.id===id); }
function backlogItem(id){ return (S.backlog||[]).find(x=>x.id===id); }
// ore nominali configurate per quel giorno della settimana: la fonte è sempre questa tabella
function oreGiornoSettimana(isoStr){
  const v = (S.config.oreGiorniSettimana || {})[d(isoStr).getDay()];
  return (v != null && v !== "") ? +v : 8;
}
// coefficiente di efficienza: quota delle ore nominali davvero disponibile per lavorare
function efficienza(){
  const e = S.config.efficienza;
  return (e != null && e > 0) ? e : 1;
}
// ore nominali che una persona ha in quel giorno, prima di assenze ed efficienza: quelle del
// giorno della settimana, salvo un orario personale più corto (part-time), che fa da tetto
// individuale. Un orario personale più lungo non supera comunque il tetto del giorno.
function capacitaPersonaGiorno(p, isoStr){
  const giorno = oreGiornoSettimana(isoStr);
  const personale = (p && p.oreGiorno != null) ? p.oreGiorno : null;
  return (personale != null && personale < giorno) ? personale : giorno;
}
// ore nominali "di oggi": per i contesti (elenchi, riepiloghi) senza un giorno preciso a cui riferirsi
function capacitaOggi(p){ return capacitaPersonaGiorno(p, iso(new Date())); }
// quota di lavoro assegnabile in un giorno: il ritmo scelto, mai oltre le ore
// davvero disponibili quel giorno (tetto della settimana e permessi inclusi)
function quotaGiorno(personaId, isoStr, orePerGiorno){
  const richiesta = orePerGiorno != null ? orePerGiorno : capacitaPersonaGiorno(persona(personaId), isoStr);
  return Math.max(0, Math.min(richiesta, capacitaGiorno(personaId, isoStr)));
}

const STATI = {attiva:"Attiva", sospesa:"Sospesa", chiusa:"Chiusa", archiviata:"Archiviata"};
// sezioni della scheda Impostazioni, nell'ordine in cui compaiono
const SOTTO_IMP = {calendario:"Calendario e orario", tempi:"Lead time",
                   protezione:"Protezione", dati:"Archivio e dati", licenza:"Licenza"};
// sezioni della scheda Verifiche: la prima segue il periodo mostrato, la seconda guarda tutta la storia
const SOTTO_VER = {carichi:"Carichi e capacità", tempi:"Tempistiche", report:"Report carico"};
const SOTTO_ANA = {persone:"Persone", gruppi:"Gruppi e mansioni", assenze:"Ferie e permessi", controlli:"Controlli"};
const SOTTO_COM = {elenco:"Elenco", tipologie:"Tipologie"};
// colonne del backlog e priorità di un elemento: elenchi fissi, non personalizzabili
// (a differenza di mansioni/tipologie, non c'è un caso d'uso reale per estenderli)
const STATI_BACKLOG = {dafare:"Da fare", incorso:"In corso", fatto:"Fatto"};
const PRIORITA_BACKLOG = {alta:"Alta", media:"Media", bassa:"Bassa"};
function statoEti(k){ return tr(STATI[k] || k); }
// colore stabile ricavato dal numero: con centinaia di commesse sceglierlo a mano non ha senso
function coloreCommessa(c){
  if(!c) return "#63737F";
  if(c.colore) return c.colore;
  let h = 0;
  const s = String(c.numero||c.id);
  for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
  return TAVOLOZZA[h % TAVOLOZZA.length];
}
function annoCommessa(c){
  if(c.apertura) return +c.apertura.slice(0,4);
  const m = String(c.numero||"").match(/^(\d{2})[-_\/.]/);
  if(m) return 2000 + (+m[1]);
  const m4 = String(c.numero||"").match(/(20\d{2})/);
  if(m4) return +m4[1];
  const att = S.assegnazioni.filter(a=>a.commessaId===c.id).map(a=>a.dataInizio).sort();
  return att.length ? +att[0].slice(0,4) : null;
}
// commesse selezionabili: le archiviate restano nello storico ma non nei menu
function commesseSceglibili(inclusa){
  return S.commesse.filter(c => c.stato !== "archiviata" || c.id === inclusa);
}
function etichettaCommessa(c){ return c.numero + (c.cliente ? " · " + c.cliente : ""); }

/* Protezione delle operazioni distruttive.
   È un blocco contro il clic distratto, non una misura di sicurezza: il codice
   è offuscato ma il file resta leggibile da chiunque. */
function impronta(testo){
  let h = 2166136261;
  for(let i=0;i<testo.length;i++){ h ^= testo.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}
function protetto(){ return !!(S && S.config && S.config.codice); }
function autorizza(descrizione){
  if(!protetto()) return confirm(descrizione);
  const dato = prompt(descrizione + "\n\n" + tr("Inserisci il codice di protezione:"), "");
  if(dato === null) return false;
  if(impronta(dato) === S.config.codice) return true;
  alert(tr("Codice errato: operazione annullata."));
  return false;
}

function segnaModificato(){
  modificato = true;
  aggiornaStato();
}
function aggiornaStato(){
  const pal = document.getElementById("pallino");
  const txt = document.getElementById("testo-stato");
  document.getElementById("btn-salva").disabled = !modificabile || !modificato;
  document.getElementById("btn-modifica").textContent = modificabile ? "Torna in sola lettura" : "Attiva modifica";
  document.body.classList.toggle("sola-lettura", !modificabile);
  if(!modificabile){ pal.className="pallino lettura"; txt.textContent="Sola lettura"; }
  else if(modificato){ pal.className="pallino modificato"; txt.textContent="Modifiche non salvate"; }
  else { pal.className="pallino"; txt.textContent="Allineato"; }
  applicaLingua();   // il testo qui sopra e' scritto raw: senza questo, in lingua "en" resterebbe
                      // in italiano finche' qualcos'altro non forza un rendi() completo
}
