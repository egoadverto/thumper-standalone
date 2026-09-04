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
   8ter. REPORT
   ----------------------------------------------------------
   Report del carico: una fotografia dell'ufficio nel periodo
   scelto in barra, filtrabile su tutti, un gruppo o una persona.
   Non calcola niente di nuovo: usa gli stessi conteggi della
   scheda Carichi, aggregati in modo leggibile e stampabile.
   ========================================================== */

function personeAmbito(){
  const vive = S.persone.filter(p=>p.attivo !== false);
  const a = V.repAmbito || "tutti";
  if(a.startsWith("g:")) return vive.filter(p=>p.gruppoId === a.slice(2));
  if(a.startsWith("p:")) return vive.filter(p=>p.id === a.slice(2));
  return vive;
}
function etichettaAmbito(){
  const a = V.repAmbito || "tutti";
  if(a.startsWith("g:")){ const g = gruppo(a.slice(2)); return g ? g.nome : "—"; }
  if(a.startsWith("p:")){ const p = persona(a.slice(2)); return p ? p.nome : "—"; }
  return tr("Tutto l'ufficio");
}

/* numeri per persona nel periodo: disponibili, pianificate, giorni oltre */
function contiReport(gg, persone){
  const carichi = caricoPersone();
  return persone.map(p=>{
    const mia = carichi.get(p.id) || new Map();
    let disp = 0, pian = 0, oltre = 0, primoOltre = null;
    gg.forEach(g=>{
      const c = capacitaGiorno(p.id, g.k);
      const o = mia.get(g.k) || 0;
      disp += c; pian += o;
      if(o > 0 && o > c + 0.001){ oltre++; if(!primoOltre) primoOltre = g.k; }
    });
    return {p, disp, pian, oltre, primoOltre,
            sat: disp > 0 ? pian / disp : (pian > 0 ? 2 : 0)};
  });
}
/* Ordinamento del report: vale sia per la tabella sia per il CSV, cosi'
   quello che stampi e quello che esporti sono nello stesso ordine. */
const ORDINI_REPORT = {gruppo:"Gruppo e nome", nome:"Nome", carico:"Più carichi prima",
                       oltre:"Più giorni in sovraccarico"};
function ordinaReport(righe){
  const posG = g => { const i = S.gruppi.findIndex(x=>x.id === g); return i < 0 ? 999 : i; };
  const modo = V.repOrdine || "gruppo";
  return righe.slice().sort((a,b)=>{
    if(modo === "nome")   return perNome(a.p, b.p);
    if(modo === "carico") return (b.sat - a.sat) || perNome(a.p, b.p);
    if(modo === "oltre")  return (b.oltre - a.oltre) || (b.sat - a.sat) || perNome(a.p, b.p);
    return (posG(a.p.gruppoId) - posG(b.p.gruppoId)) || perNome(a.p, b.p);
  });
}

function classeSat(r){ return r > 1.001 ? "q4" : r >= .85 ? "q3" : r >= .5 ? "q2" : r > 0 ? "q1" : "q0"; }

function sezioneReport(){
  const gg = giorniVisibili();
  const persone = personeAmbito();
  const righe = contiReport(gg, persone);
  const carichi = caricoPersone();

  const disp = righe.reduce((s,r)=>s + r.disp, 0);
  const pian = righe.reduce((s,r)=>s + r.pian, 0);
  const oltre = righe.reduce((s,r)=>s + r.oltre, 0);
  const sature = righe.filter(r=>r.sat > 1.001).length;
  const sat = disp > 0 ? pian / disp : 0;

  // settimane dell'ambito
  const sett = spezzaInSettimane(gg);
  const perSett = sett.map(s=>{
    let d = 0, o = 0;
    persone.forEach(p=>{
      const mia = carichi.get(p.id) || new Map();
      s.forEach(g=>{ d += capacitaGiorno(p.id, g.k); o += mia.get(g.k) || 0; });
    });
    return {dal:s[0].k, disp:d, pian:o, sat: d > 0 ? o / d : (o > 0 ? 2 : 0)};
  });

  const opzioni = `<option value="tutti" ${(V.repAmbito||"tutti")==="tutti"?"selected":""}>${tr("Tutto l'ufficio")}</option>`
    + S.gruppi.map(g=>`<option value="g:${g.id}" ${V.repAmbito==="g:"+g.id?"selected":""}>${tr("Gruppo")} · ${esc(g.nome)}</option>`).join("")
    + personeOrdinate(true).map(p=>`<option value="p:${p.id}" ${V.repAmbito==="p:"+p.id?"selected":""}>${esc(p.nome)}</option>`).join("");

  const corpoPersone = ordinaReport(righe).map(r=>{
    const g = gruppo(r.p.gruppoId);
    return `<tr>
      <td>${esc(r.p.nome)}</td>
      <td>${g?`<span class="tag din">${esc(g.sigla)}</span>`:""}</td>
      <td class="num-cella mono">${arr(r.disp)}</td>
      <td class="num-cella mono">${arr(r.pian)}</td>
      <td class="num-cella mono ${classeSat(r.sat)}">${r.disp>0?Math.round(r.sat*100)+"%":"–"}</td>
      <td class="num-cella mono"${r.oltre?' style="color:var(--allarme);font-weight:700"':' style="color:var(--tenue)"'}>${r.oltre||"–"}</td>
      <td class="mono">${r.primoOltre?itData(r.primoOltre):"–"}</td></tr>`;
  }).join("") || `<tr><td colspan="7" style="color:var(--tenue);padding:14px">${tr("Nessuna persona in questo ambito.")}</td></tr>`;

  return `
    <div class="pannello rep-comandi non-stampare">
      <div class="filtri" style="margin:0">
        <div class="campo" style="min-width:240px"><label for="rep-ambito">Ambito</label>
          <select id="rep-ambito">${opzioni}</select></div>
        <div class="campo" style="min-width:200px"><label for="rep-ordine">Ordina per</label>
          <select id="rep-ordine">${Object.keys(ORDINI_REPORT).map(k=>
            `<option value="${k}" ${(V.repOrdine||"gruppo")===k?"selected":""}>${tr(ORDINI_REPORT[k])}</option>`).join("")}</select></div>
        <div class="campo" style="align-self:flex-end;flex-direction:row;gap:6px">
          <button class="btn" id="rep-stampa">${tr("Stampa / PDF")}</button>
          <button class="btn" id="rep-csv">${tr("Esporta CSV")}</button>
        </div>
      </div>
    </div>

    <div class="pannello area-stampa">
      <div id="casa-strumenti" class="non-stampare"></div>
      <div class="marchio din solo-stampa stampa-intestazione">
        <svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><g stroke-width="9" stroke-linecap="round" fill="none">
          <path d="M16 34 L32 18" stroke="#152029"/><path d="M24 42 L52 14" stroke="#0F6E8C"/><path d="M32 50 L54 28" stroke="#C97A0A"/>
        </g></svg>
        <span class="marchio-testo"><b>Thumper</b><span>Micro Planner</span></span>
      </div>
      <h2 class="din">${tr("Carico di lavoro")} · ${esc(etichettaAmbito())}</h2>
      <p class="nota">${tr("Periodo dal {0} al {1} · {2} persone · stampato il {3}",
          gg.length?itData(gg[0].k):"–", gg.length?itData(gg[gg.length-1].k):"–",
          persone.length, itData(iso(new Date())))}</p>

      <div class="sc-stat" style="margin:12px 0 16px">
        <div><div class="eti">${tr("Ore disponibili")}</div><div class="val mono din">${arr(disp)}</div></div>
        <div><div class="eti">${tr("Ore pianificate")}</div><div class="val mono din">${arr(pian)}</div></div>
        <div><div class="eti">${tr("Saturazione")}</div><div class="val mono din" ${sat>1.001?'style="color:var(--allarme)"':""}>${disp>0?Math.round(sat*100)+"%":"–"}</div></div>
        <div><div class="eti">${tr("Giorni in sovraccarico")}</div><div class="val mono din" ${oltre?'style="color:var(--allarme)"':""}>${oltre||"–"}</div></div>
        <div><div class="eti">${tr("Persone oltre il 100%")}</div><div class="val mono din" ${sature?'style="color:var(--allarme)"':""}>${sature||"–"}</div></div>
      </div>

      <h3 class="din titoletto">${tr("Per persona")}</h3>
      <table><thead><tr><th>Persona</th><th style="width:40px">Gr.</th>
        <th class="num-cella">Disponibili</th><th class="num-cella">Pianificate</th>
        <th class="num-cella">Saturazione</th><th class="num-cella">Giorni oltre</th>
        <th>Primo giorno critico</th></tr></thead><tbody>${corpoPersone}</tbody></table>

      <h3 class="din titoletto" style="margin-top:20px">${tr("Per settimana")}</h3>
      <table><thead><tr><th>Settimana dal</th>
        <th class="num-cella">Disponibili</th><th class="num-cella">Pianificate</th>
        <th class="num-cella">Saturazione</th></tr></thead><tbody>
        ${perSett.map(s=>`<tr>
          <td class="mono">${itData(s.dal)}</td>
          <td class="num-cella mono">${arr(s.disp)}</td>
          <td class="num-cella mono">${arr(s.pian)}</td>
          <td class="num-cella mono ${classeSat(s.sat)}">${s.disp>0?Math.round(s.sat*100)+"%":"–"}</td>
        </tr>`).join("")}
      </tbody></table>

      <p class="nota" style="margin-top:14px">${tr("Le ore sono quelle pianificate, non consuntivate: il report dice cosa è stato <u>preventivato</u>, non cosa è stato fatto.")}</p>
      <p class="stampa-piede solo-stampa">Thumper — Micro Planner · ${tr("generato il {0}", itData(iso(new Date())))}</p>
    </div>`;
}

/* CSV con punto e virgola e virgola decimale: e' quello che si apre bene
   con Excel in italiano senza passare dalla procedura di importazione */
function reportCsv(){
  const gg = giorniVisibili();
  const righe = contiReport(gg, personeAmbito());
  const num = v => String(arr(v)).replace(".", ",");
  const testa = ["Person","Group","Available hours","Planned hours","Saturation %","Days over","First critical day"];
  const corpo = ordinaReport(righe).map(r=>{
    const g = gruppo(r.p.gruppoId);
    return [r.p.nome, g ? g.sigla : "", num(r.disp), num(r.pian),
            r.disp > 0 ? Math.round(r.sat*100) : "", r.oltre || 0,
            r.primoOltre ? itData(r.primoOltre) : ""];
  });
  const virgolette = v => `"${String(v).replace(/"/g, '""')}"`;
  const testo = "\uFEFF" + [testa, ...corpo].map(r=>r.map(virgolette).join(";")).join("\r\n");
  const b = new Blob([testo], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = "workload_" + iso(new Date()) + ".csv";
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  brindisi(tr("CSV scaricato"));
}
