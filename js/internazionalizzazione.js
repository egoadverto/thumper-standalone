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
   INTERNAZIONALIZZAZIONE
   ========================================================== */

// scelta della lingua salvata in sessioni precedenti: sopravvive solo alla ricarica
// della stessa pagina finche' resta nell'indirizzo (#it/#en); riaprendo da un collegamento
// pulito serve la memoria del browser, altrimenti si riparte sempre dalla lingua di Windows.
function linguaSalvata(){ try{ return localStorage.getItem("planer-lingua"); }catch(err){ return null; } }
function salvaLingua(l){ try{ localStorage.setItem("planer-lingua", l); }catch(err){} }

let lingua = (location.hash.indexOf("en") >= 0) ? "en"
           : (location.hash.indexOf("it") >= 0) ? "it"
           : linguaSalvata()
           || ((navigator.language || "it").toLowerCase().indexOf("it") === 0 ? "it" : "en");

// i paragrafi lunghi vanno a capo nei file js/ solo per leggibilità del sorgente: quell'a-capo
// (con l'indentazione che lo segue) finisce dentro al testo vero e proprio così com'è, sia nel
// nodo DOM sia nell'argomento passato a tr(). Le voci del dizionario invece sono scritte su
// un'unica riga: un confronto esatto tra i due non troverebbe mai corrispondenza. Si confronta
// perciò dopo aver ridotto ogni sequenza di spazi/a-capo a uno spazio singolo, sui due lati.
function normalizzaSpazi(s){ return s.replace(/\s+/g, " ").trim(); }
const DIZ_NORM = {};
Object.keys(DIZ).forEach(k => { DIZ_NORM[normalizzaSpazi(k)] = DIZ[k]; });

// traduzione con segnaposto: tr("Occupa {0} giornate", n)
function tr(testo, ...v){
  const chiave = normalizzaSpazi(testo);
  let out = (lingua === "en" && DIZ_NORM[chiave]) ? DIZ_NORM[chiave] : testo;
  v.forEach((x,i)=>{ out = out.split("{"+i+"}").join(x); });
  return out;
}

// applica la lingua all'interfaccia già disegnata, conservando l'originale italiano
function applicaLingua(){
  document.documentElement.lang = lingua;
  const radici = [document.getElementById("app"), document.getElementById("velo")].filter(Boolean);
  radici.forEach(radice=>{
    const cam = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT);
    let n;
    while((n = cam.nextNode())){
      const grezzo = n.nodeValue, netto = grezzo.trim();
      if(!netto) continue;
      if(lingua === "it"){
        if(n.__it !== undefined) n.nodeValue = n.__it;
        continue;
      }
      const t = DIZ_NORM[normalizzaSpazi(netto)];
      if(!t) continue;
      if(n.__it === undefined) n.__it = grezzo;
      n.nodeValue = grezzo.replace(netto, t);
    }
    radice.querySelectorAll("[placeholder],[title]").forEach(el=>{
      ["placeholder","title"].forEach(att=>{
        const v = el.getAttribute(att);
        if(v === null) return;
        const chiave = "__" + att;
        if(lingua === "it"){ if(el[chiave] !== undefined) el.setAttribute(att, el[chiave]); return; }
        const t = DIZ_NORM[normalizzaSpazi(v.trim())];
        if(!t) return;
        if(el[chiave] === undefined) el[chiave] = v;
        el.setAttribute(att, t);
      });
    });
  });
}
