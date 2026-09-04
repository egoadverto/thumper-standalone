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
   2. UTILITÀ DATE
   ========================================================== */
function d(x){ // stringa ISO -> Date locale a mezzogiorno (evita problemi di ora legale)
  if(x instanceof Date) return new Date(x.getFullYear(),x.getMonth(),x.getDate(),12);
  const p = String(x).split("-");
  return new Date(+p[0], +p[1]-1, +p[2], 12);
}
function iso(dt){
  const y=dt.getFullYear(), m=String(dt.getMonth()+1).padStart(2,"0"), g=String(dt.getDate()).padStart(2,"0");
  return y+"-"+m+"-"+g;
}
function sommaGiorni(dt,n){ const r=new Date(dt); r.setDate(r.getDate()+n); r.setHours(12,0,0,0); return r; }
function diffGiorni(a,b){ return Math.round((d(b)-d(a))/86400000); }
function inizioSettimana(dt){ const r=d(dt); const g=(r.getDay()+6)%7; return sommaGiorni(r,-g); }
// spezza un elenco di giorni consecutivi in blocchi da 7, per le tabelle "per settimana"
function spezzaInSettimane(gg){
  const sett = [];
  for(let i=0;i<gg.length;i+=7) sett.push(gg.slice(i,i+7));
  return sett;
}
// gg/mm/aaaa in italiano; in inglese ISO aaaa-mm-gg invece di mm/dd/aaaa — quest'ultimo
// e' ambiguo fuori dagli USA, l'ISO non lo e' per nessuno
function itData(x){
  const t=d(x), gg=String(t.getDate()).padStart(2,"0"), mm=String(t.getMonth()+1).padStart(2,"0"), aaaa=t.getFullYear();
  return lingua === "en" ? aaaa+"-"+mm+"-"+gg : gg+"/"+mm+"/"+aaaa;
}
// elenco (stringhe ISO) dei giorni del mese di calendario a cui appartiene la data data,
// indipendente dalla finestra temporale scelta in barra (usato per le statistiche "mese corrente")
function giorniMese(dt){
  const rif = d(dt);
  const ultimo = new Date(rif.getFullYear(), rif.getMonth()+1, 0).getDate();
  const out = [];
  for(let g=1; g<=ultimo; g++) out.push(iso(new Date(rif.getFullYear(), rif.getMonth(), g, 12)));
  return out;
}
// preset di periodo a mesi solari per la barra "Dal/Periodo": ampiezza mesi consecutivi che
// finiscono col mese corrente, partendo da "offset" mesi fa (0 = mese corrente compreso)
function periodoAMesi(offset, ampiezza){
  const oggi = new Date();
  const inizio = new Date(oggi.getFullYear(), oggi.getMonth()-offset, 1, 12);
  const fine = new Date(oggi.getFullYear(), oggi.getMonth()-offset+ampiezza, 0, 12);
  return {inizio: iso(inizio), giorni: diffGiorni(iso(inizio), iso(fine)) + 1};
}
const PRESET_PERIODO = {
  "mese-corrente":   () => periodoAMesi(0, 1),
  "mese-precedente": () => periodoAMesi(1, 1),
  "3m":  () => periodoAMesi(2, 3),
  "6m":  () => periodoAMesi(5, 6),
  "12m": () => periodoAMesi(11, 12),
};
const MESI=["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GG=["D","L","M","M","G","V","S"];
const NOMI_GG_SETT=["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];

function pasqua(anno){ // algoritmo di Meeus/Butcher
  const a=anno%19,b=Math.floor(anno/100),c=anno%100,e=Math.floor(b/4),f=b%4,
        g=Math.floor((b+8)/25),h=Math.floor((b-g+1)/3),i=(19*a+b-e-h+15)%30,
        k=Math.floor(c/4),l=c%4,m=(32+2*f+2*k-i-l)%7,n=Math.floor((a+11*i+22*m)/451),
        mese=Math.floor((i+m-7*n+114)/31),giorno=((i+m-7*n+114)%31)+1;
  return new Date(anno,mese-1,giorno,12);
}
// il giorno di una voce di festivitaNazionali in un anno specifico, secondo il suo tipo:
// "fissa" (giorno/mese), "pasqua" (± N giorni da Pasqua), "settimana" (N-esimo giorno
// della settimana di un mese, occorrenza -1 = ultimo) — vedi CLAUDE.md
function giornoVoceFestivita(v, anno){
  if(v.tipo === "pasqua") return sommaGiorni(pasqua(anno), v.offset);
  if(v.tipo === "settimana"){
    if(v.occorrenza === -1){
      const ultimo = new Date(anno, v.mese, 0);
      const scarto = (ultimo.getDay() - v.giornoSettimana + 7) % 7;
      return new Date(anno, v.mese-1, ultimo.getDate()-scarto, 12);
    }
    const primo = new Date(anno, v.mese-1, 1);
    const scarto = (v.giornoSettimana - primo.getDay() + 7) % 7;
    return new Date(anno, v.mese-1, 1+scarto+(v.occorrenza-1)*7, 12);
  }
  return new Date(anno, v.mese-1, v.giorno, 12);
}
// descrizione leggibile di una voce, per l'elenco in Impostazioni (non lega il giorno a un anno preciso)
function testoVoceFestivita(v){
  if(v.tipo === "pasqua"){
    if(!v.offset) return tr("Pasqua");
    return tr(v.offset > 0 ? "Pasqua + {0} gg" : "Pasqua − {0} gg", Math.abs(v.offset));
  }
  if(v.tipo === "settimana"){
    const occ = v.occorrenza === -1 ? tr("ultimo") : tr("{0}°", v.occorrenza);
    return tr("{0} {1} di {2}", occ, tr(NOMI_GG_SETT[v.giornoSettimana]).toLowerCase(), tr(MESI[v.mese-1]).toLowerCase());
  }
  return v.giorno + " " + tr(MESI[v.mese-1]).toLowerCase();
}
// preset di partenza per l'elenco personalizzabile config.festivitaNazionali — vedi CLAUDE.md.
// Solo festività nazionali (non regionali/cantonali): l'utente parte da qui e poi modifica.
const PRESET_FESTIVITA = {
  italia: [
    {id:"01-01", nome:"Capodanno", tipo:"fissa", mese:1, giorno:1},
    {id:"01-06", nome:"Epifania", tipo:"fissa", mese:1, giorno:6},
    {id:"pasquetta", nome:"Lunedì dell'Angelo", tipo:"pasqua", offset:1},
    {id:"04-25", nome:"Festa della Liberazione", tipo:"fissa", mese:4, giorno:25},
    {id:"05-01", nome:"Festa del lavoro", tipo:"fissa", mese:5, giorno:1},
    {id:"06-02", nome:"Festa della Repubblica", tipo:"fissa", mese:6, giorno:2},
    {id:"08-15", nome:"Ferragosto", tipo:"fissa", mese:8, giorno:15},
    {id:"11-01", nome:"Ognissanti", tipo:"fissa", mese:11, giorno:1},
    {id:"12-08", nome:"Immacolata", tipo:"fissa", mese:12, giorno:8},
    {id:"12-25", nome:"Natale", tipo:"fissa", mese:12, giorno:25},
    {id:"12-26", nome:"Santo Stefano", tipo:"fissa", mese:12, giorno:26}
  ],
  germania: [
    {id:"neujahr", nome:"Neujahr", tipo:"fissa", mese:1, giorno:1},
    {id:"karfreitag", nome:"Karfreitag", tipo:"pasqua", offset:-2},
    {id:"ostermontag", nome:"Ostermontag", tipo:"pasqua", offset:1},
    {id:"tag-der-arbeit", nome:"Tag der Arbeit", tipo:"fissa", mese:5, giorno:1},
    {id:"christi-himmelfahrt", nome:"Christi Himmelfahrt", tipo:"pasqua", offset:39},
    {id:"pfingstmontag", nome:"Pfingstmontag", tipo:"pasqua", offset:50},
    {id:"tag-der-einheit", nome:"Tag der Deutschen Einheit", tipo:"fissa", mese:10, giorno:3},
    {id:"weihnachten-1", nome:"1. Weihnachtstag", tipo:"fissa", mese:12, giorno:25},
    {id:"weihnachten-2", nome:"2. Weihnachtstag", tipo:"fissa", mese:12, giorno:26}
  ],
  usa: [
    {id:"new-year", nome:"New Year's Day", tipo:"fissa", mese:1, giorno:1},
    {id:"mlk-day", nome:"Martin Luther King Jr. Day", tipo:"settimana", mese:1, giornoSettimana:1, occorrenza:3},
    {id:"presidents-day", nome:"Presidents' Day", tipo:"settimana", mese:2, giornoSettimana:1, occorrenza:3},
    {id:"memorial-day", nome:"Memorial Day", tipo:"settimana", mese:5, giornoSettimana:1, occorrenza:-1},
    {id:"juneteenth", nome:"Juneteenth", tipo:"fissa", mese:6, giorno:19},
    {id:"independence-day", nome:"Independence Day", tipo:"fissa", mese:7, giorno:4},
    {id:"labor-day", nome:"Labor Day", tipo:"settimana", mese:9, giornoSettimana:1, occorrenza:1},
    {id:"columbus-day", nome:"Columbus Day", tipo:"settimana", mese:10, giornoSettimana:1, occorrenza:2},
    {id:"veterans-day", nome:"Veterans Day", tipo:"fissa", mese:11, giorno:11},
    {id:"thanksgiving", nome:"Thanksgiving Day", tipo:"settimana", mese:11, giornoSettimana:4, occorrenza:4},
    {id:"christmas", nome:"Christmas Day", tipo:"fissa", mese:12, giorno:25}
  ]
};
const NOME_PAESE_PRESET = {italia:"Italia", germania:"Germania", usa:"USA"};
// fuso orario di riferimento di ciascun preset — solo informativo, non entra mai nei calcoli:
// gli USA ne hanno più d'uno, qui si usa l'orientale (New York) come riferimento
const FUSO_PAESE_PRESET = {
  italia:   {zona:"Europe/Rome",     std:"UTC+1", estivo:"UTC+2"},
  germania: {zona:"Europe/Berlin",   std:"UTC+1", estivo:"UTC+2"},
  usa:      {zona:"America/New_York", std:"UTC−5", estivo:"UTC−4"}
};
function testoFusoPreset(paese){
  const f = FUSO_PAESE_PRESET[paese];
  return f ? tr("Fuso orario: {0}, {1} ({2} in orario estivo).", f.zona, f.std, f.estivo) : "";
}
// le date di un preset per un anno specifico, senza toccare config.festivitaNazionali —
// usata dal selettore "Calendario" dell'Anteprima in Impostazioni, che è di sola visualizzazione
function vociAnnoPresetFestivita(paese, anno){
  return (PRESET_FESTIVITA[paese]||[]).map(v => ({k: iso(giornoVoceFestivita(v, anno)), nome:v.nome}))
    .sort((a,b)=> a.k < b.k ? -1 : 1);
}
const cacheFest = {};
function svuotaCacheFest(){ Object.keys(cacheFest).forEach(k=>delete cacheFest[k]); }
// valide per qualsiasi anno: ogni voce di config.festivitaNazionali calcolata secondo il suo tipo
function festivitaAnno(anno){
  if(cacheFest[anno]) return cacheFest[anno];
  const el = {};
  (S.config.festivitaNazionali||[]).forEach(v=>{
    el[iso(giornoVoceFestivita(v, anno))] = {nome:v.nome, id:v.id};
  });
  cacheFest[anno] = el;
  return el;
}
function nomeFestivita(isoStr){
  const naz = festivitaAnno(+isoStr.slice(0,4))[isoStr];
  if(naz) return naz.nome;
  const ch = (S.config.chiusure||[]).find(c => isoStr >= c.dal && isoStr <= c.al);
  return ch ? (ch.nome || "Chiusura aziendale") : null;
}
function eFestivo(isoStr){ return !!nomeFestivita(isoStr); }
function eLavorativo(isoStr){
  const gs = d(isoStr).getDay();
  return S.config.giorniLavorativi.includes(gs) && !eFestivo(isoStr);
}
