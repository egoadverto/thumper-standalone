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
   8. RENDER — PERSONE
   ========================================================== */
/* ----------------------------------------------------------
   Scheda della persona: sola lettura, stesso linguaggio della
   scheda commessa. Non calcola niente di nuovo, raccoglie in
   un posto solo quello che è già sparso fra calendario,
   carichi e assenze.
   ---------------------------------------------------------- */
function apriSchedaPersona(id){
  const p = persona(id); if(!p) return;
  const g = gruppo(p.gruppoId);
  const gg = giorniVisibili();
  const carichi = caricoPersone();
  const mia = carichi.get(p.id) || new Map();

  let disp = 0, pian = 0, oltre = 0;
  gg.forEach(x=>{
    const c = capacitaGiorno(p.id, x.k), o = mia.get(x.k) || 0;
    disp += c; pian += o;
    if(o > 0 && o > c + 0.001) oltre++;
  });
  const sat = disp > 0 ? pian / disp : 0;

  /* stesso calcolo, ma sul mese di calendario in corso: indipendente dalla
     finestra scelta in barra, che puo' guardare altrove (es. mesi futuri) */
  const oggiDt = new Date();
  const meseGG = giorniMese(oggiDt);
  let dispMese = 0, pianMese = 0, oltreMese = 0;
  meseGG.forEach(k=>{
    const c = capacitaGiorno(p.id, k), o = mia.get(k) || 0;
    dispMese += c; pianMese += o;
    if(o > 0 && o > c + 0.001) oltreMese++;
  });
  const satMese = dispMese > 0 ? pianMese / dispMese : 0;

  const att = S.assegnazioni.filter(a => a.personaId === p.id)
    .map(a => ({a, e:estremi(a), c:commessa(a.commessaId)}))
    .filter(x => x.c)
    .sort((x,y)=> (x.e?x.e.dal:"") < (y.e?y.e.dal:"") ? 1 : -1);   // le più recenti in cima
  const aperte = att.filter(x => !x.a.fatta);

  const righeAtt = att.slice(0, 40).map(x=>{
    const tardi = !x.a.fatta && sforaConsegna(x.a);
    return `<tr class="${x.a.fatta?"spenta":""}">
      <td><span class="commessa-link" data-scheda="${x.c.id}"><span class="pastiglia" style="background:${coloreCommessa(x.c)}"></span><span class="mono">${esc(x.c.numero)}</span></span>
        <div class="nota">${esc(x.c.cliente)||""}${x.a.descrizione?" · "+esc(x.a.descrizione):""}</div></td>
      <td class="mono" style="white-space:nowrap${tardi?";color:var(--allarme);font-weight:700":""}">${
        x.e ? itData(x.e.dal)+" – "+itData(x.e.al) : "–"}</td>
      <td class="num-cella mono">${x.e?arr(x.e.ore):0}</td>
      <td class="num-cella">${x.a.annullata
        ? '<span style="color:var(--allarme);font-weight:700;font-size:16px">✕</span>'
        : x.a.fatta
        ? '<span style="color:#0A7A34;font-weight:700;font-size:16px">✓</span>'
        : '<span style="color:var(--linea-forte);font-size:16px">○</span>'}</td></tr>`;
  }).join("") || `<tr><td colspan="4" style="color:var(--tenue);padding:14px">${tr("Nessuna attività assegnata.")}</td></tr>`;

  /* giornate fuori sede, dalla più recente */
  const ass = (S.assenze||[]).filter(a => a.personaId === p.id)
    .sort((a,b)=> a.dal < b.dal ? 1 : -1).slice(0, 12);
  const righeAss = ass.map(a=>`<div class="sc-nota-voce">
      <div class="quando">
        <div class="mono">${itData(a.dal)}</div>
        <div class="nota mono">${a.dal !== a.al ? "→ "+itData(a.al) : ""}</div>
      </div>
      <div class="testo-nota">${tr(TIPI_GIORNO[a.tipo] || a.tipo)}${
        a.tipo==="permesso" ? ` <span class="nota">(${a.ore||0} h)</span>` : ""}${
        a.deroga ? ` <span class="chip sospesa">✦ deroga</span>` : ""}
        <div class="nota">${tr("{0} giorni", diffGiorni(a.dal, a.al)+1)}</div></div>
    </div>`).join("") || `<div class="nota">${tr("Nessuna giornata registrata.")}</div>`;

  /* segnalazioni ricavate, niente da compilare */
  const avvisi = [];
  if(p.attivo === false) avvisi.push(tr("Persona non attiva: non compare nel calendario né nei carichi."));
  if(oltre) avvisi.push(tr("{0} giornate con più ore assegnate di quelle disponibili, nel periodo mostrato.", oltre));
  const settimane = new Set();
  (S.assenze||[]).filter(a => a.personaId === p.id && a.tipo === "smart").forEach(a=>{
    let cur = d(a.dal), giri = 0;
    while(iso(cur) <= a.al && giri++ < 400){ settimane.add(iso(inizioSettimana(cur))); cur = sommaGiorni(cur,1); }
  });
  const sfori = Array.from(settimane).filter(lun => smartDellaSettimana(p.id, lun).length > limiteSmart(p));
  if(sfori.length) avvisi.push(tr("{0} settimane oltre il limite di smart working.", sfori.length));
  const tardive = aperte.filter(x => sforaConsegna(x.a)).length;
  if(tardive) avvisi.push(tr("{0} attività finiscono oltre la data di consegna richiesta.", tardive));
  const boxAvvisi = avvisi.length
    ? avvisi.map(t=>`<div class="sc-avviso"><span>⚠</span><span>${t}</span></div>`).join("")
    : `<div class="nota">${tr("Nessuna segnalazione.")}</div>`;

  const extra = (p.gruppiExtra||[]).map(x=>{const y=gruppo(x); return y?`<span class="tag din" title="${esc(y.nome)}">${esc(y.sigla)}</span>`:"";}).join(" ");

  finestra(esc(p.nome),
    `<div class="sc-intestazione">
       ${g?`<span class="sigla din">${esc(g.sigla)}</span> <span>${esc(g.nome)}</span>`:`<span class="nota">${tr("Senza gruppo")}</span>`}
       <span class="chip ${p.attivo===false?"archiviata":"attiva"}">${p.attivo===false?tr("Non attivo"):tr("Attivo")}</span>
       ${p.smartMax!=null?`<span class="chip sospesa">✦ ${tr("deroga smart")}</span>`:""}
       <span style="margin-left:auto">${extra}</span>
     </div>

     <div class="sc-due">
       <div class="sc-sx">

         <div class="sc-sezione">
           <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap">
             <h5 class="titoletto din" style="margin:0 0 8px">${tr("Nel mese corrente")}</h5>
             <span class="nota" style="margin:0 0 8px">${tr("{0} {1}, indipendentemente dalla finestra impostata in barra.", tr(MESI[oggiDt.getMonth()]), oggiDt.getFullYear())}</span>
           </div>
           <div class="sc-stat">
             <div><div class="eti">${tr("Ore disponibili")}</div><div class="val mono din">${arr(dispMese)}</div></div>
             <div><div class="eti">${tr("Ore pianificate")}</div><div class="val mono din">${arr(pianMese)}</div></div>
             <div><div class="eti">${tr("Saturazione")}</div><div class="val mono din ${classeSat(satMese)}" style="padding:0 4px">${dispMese>0?Math.round(satMese*100)+"%":"–"}</div></div>
             <div><div class="eti">${tr("Nr. giorni over")}</div><div class="val mono din" ${oltreMese?'style="color:var(--allarme)"':""}>${oltreMese||"–"}</div></div>
           </div>
         </div>

         <div class="sc-sezione">
           <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap">
             <h5 class="titoletto din" style="margin:0 0 8px">Nel periodo mostrato</h5>
             <span class="nota" style="margin:0 0 8px">${tr("Dal {0} al {1}, come impostato in barra.",
                gg.length?itData(gg[0].k):"–", gg.length?itData(gg[gg.length-1].k):"–")}</span>
           </div>
           <div class="sc-stat">
             <div><div class="eti">${tr("Ore disponibili")}</div><div class="val mono din">${arr(disp)}</div></div>
             <div><div class="eti">${tr("Ore pianificate")}</div><div class="val mono din">${arr(pian)}</div></div>
             <div><div class="eti">${tr("Saturazione")}</div><div class="val mono din ${classeSat(sat)}" style="padding:0 4px">${disp>0?Math.round(sat*100)+"%":"–"}</div></div>
             <div><div class="eti">${tr("Nr. giorni over")}</div><div class="val mono din" ${oltre?'style="color:var(--allarme)"':""}>${oltre||"–"}</div></div>
           </div>
         </div>

         <div class="sc-sezione">
           <h5 class="titoletto din">Attività</h5>
           <p class="nota" style="margin:0 0 6px">${tr("{0} in tutto, di cui {1} ancora aperte.", att.length, aperte.length)}</p>
           <table><thead><tr><th>Progetto</th><th>Date</th>
             <th class="num-cella" style="width:56px">Ore</th>
             <th class="num-cella" style="width:64px">Conclusa</th></tr></thead>
             <tbody>${righeAtt}</tbody></table>
           ${att.length > 40 ? `<p class="nota">${tr("Mostrate le 40 più recenti.")}</p>` : ""}
         </div>

       </div>
       <div class="sc-dx">

         <div class="sc-sezione">
           <h5 class="titoletto din">Impostazioni</h5>
           <table><tbody>
             <tr><th style="width:130px">${tr("Ore al giorno")}</th><td class="mono">${capacitaOggi(p)}${
               p.oreGiorno!=null?` <span class="nota">${tr("personale")}</span>`:` <span class="nota">${tr("da impostazioni")}</span>`}</td></tr>
             <tr><th>${tr("Max smart")}</th><td class="mono">${limiteSmart(p)}${
               p.smartMax!=null?` <span class="nota">${tr("deroga personale")}</span>`:` <span class="nota">${tr("limite generale")}</span>`}</td></tr>
             <tr><th>${tr("Gruppo")}</th><td>${g?esc(g.nome):"–"}</td></tr>
             <tr><th>${tr("Anche in")}</th><td>${extra||"–"}</td></tr>
           </tbody></table>
         </div>

         <div class="sc-sezione">
           <h5 class="titoletto din">Segnalazioni</h5>
           ${boxAvvisi}
         </div>

         <div class="sc-sezione">
           <h5 class="titoletto din">Giornate fuori sede</h5>
           <div class="sc-note-elenco">${righeAss}</div>
         </div>

       </div>
     </div>`,
    `<button class="btn sinistra" id="sp-modifica">Modifica persona</button>
     ${att.length ? `<button class="btn" id="sp-piano">Vedi nel piano</button>` : ""}
     <button class="btn primario" id="sp-chiudi">Chiudi</button>`);
  const finestraEl = document.querySelector(".finestra");
  finestraEl.classList.add("enorme");
  finestraEl.querySelectorAll("[data-scheda]").forEach(el=>{
    el.onclick = ()=>{ chiudi(); apriSchedaCommessa(el.dataset.scheda); };
  });
  document.getElementById("sp-chiudi").onclick = chiudi;
  document.getElementById("sp-modifica").onclick = ()=>{
    if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
    apriPersona(p.id);
  };
  const bp = document.getElementById("sp-piano");
  if(bp) bp.onclick = ()=>{
    const prima = att.filter(x=>x.e).map(x=>x.e.dal).sort()[0];
    if(prima){ V.inizio = iso(inizioSettimana(d(prima))); document.getElementById("da").value = V.inizio; }
    V.vista = "piano";
    document.querySelectorAll(".scheda").forEach(x=>x.setAttribute("aria-selected", x.dataset.vista==="piano"));
    chiudi(); rendi();
  };
}

function rendiAnagrafiche(){
  // smart working oltre il tetto: su tutte le giornate registrate, non su un periodo mostrato
  const settimane = new Set();
  (S.assenze||[]).filter(a => a.tipo === "smart").forEach(a=>{
    let cur = d(a.dal), giri = 0;
    while(iso(cur) <= a.al && giri++ < 400){ settimane.add(iso(inizioSettimana(cur))); cur = sommaGiorni(cur,1); }
  });
  const sfori = [];
  personeOrdinate(true).forEach(p=>{
    Array.from(settimane).forEach(lun=>{
      const el = smartDellaSettimana(p.id, lun);
      const lim = limiteSmart(p);
      if(el.length > lim) sfori.push({p, lun, n:el.length, lim, giorni:el});
    });
  });
  sfori.sort((a,b)=> a.lun < b.lun ? 1 : -1);   // le più recenti in cima
  const deroghe = (S.assenze||[]).filter(a => a.deroga)
    .sort((a,b)=> a.dal < b.dal ? 1 : -1)
    .map(a => ({p:persona(a.personaId), a})).filter(x=>x.p);

  const attive = S.persone.filter(p=>p.attivo!==false);
  const oreTot = attive.reduce((s,p)=>s + capacitaOggi(p), 0);

  /* ---------- persone, raggruppate per gruppo ---------- */
  let rP = "";
  const perGruppo = new Map();
  personeOrdinate(false, true).forEach(p=>{
    const k = p.gruppoId || "";
    if(!perGruppo.has(k)) perGruppo.set(k, []);
    perGruppo.get(k).push(p);
  });
  perGruppo.forEach((membri, gid)=>{
    const g = gruppo(gid);
    rP += `<tr class="riga-gruppo"><td colspan="8">
      ${g?`<span class="sigla din">${esc(g.sigla)}</span> <span class="din">${esc(g.nome)}</span>`
         :`<span class="din">${tr("Senza gruppo")}</span>`}
      <span class="nota">${tr("{0} persone", membri.length)}</span></td></tr>`;
    membri.forEach(p=>{
      const extra = (p.gruppiExtra||[]).map(id=>{const x=gruppo(id); return x?`<span class="tag din">${esc(x.sigla)}</span>`:"";}).join(" ");
      const m = p.mansioneId ? mansione(p.mansioneId) : null;
      const n = S.assegnazioni.filter(a=>a.personaId===p.id).length;
      rP += `<tr class="${p.attivo===false?"spenta":""}">
        <td>${esc(p.nome)}</td>
        <td>${extra||"–"}</td>
        <td>${m?`<span class="sigla din">${esc(m.sigla)}</span>`:"–"}</td>
        <td class="num-cella mono">${capacitaOggi(p)}</td>
        <td class="num-cella mono" ${p.smartMax!=null?'style="color:#438A8C;font-weight:700"':""}>${limiteSmart(p)}${p.smartMax!=null?" ✦":""}</td>
        <td class="num-cella mono">${n||"–"}</td>
        <td>${p.attivo===false?`<span class="chip archiviata">${tr("Non attivo")}</span>`:`<span class="chip attiva">${tr("Attivo")}</span>`}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn piccolo" data-scheda-persona="${p.id}">Scheda</button>
          <button class="btn piccolo" data-mod-persona="${p.id}">Modifica</button></td></tr>`;
    });
  });
  if(!S.persone.length) rP = `<tr><td colspan="8" style="color:var(--tenue);padding:14px">Nessuna persona in elenco.</td></tr>`;

  /* ---------- giornate fuori sede ---------- */
  const rA = (S.assenze||[]).slice().sort((a,b)=>a.dal<b.dal?1:-1).map(a=>{
    const p = persona(a.personaId);
    const et = tr(TIPI_GIORNO[a.tipo] || a.tipo);
    return `<tr><td>${p?esc(p.nome):"?"}</td>
      <td>${et}${a.tipo==="permesso"?" ("+(a.ore||0)+" h)":""}${a.deroga?` <span class="chip sospesa">✦ deroga${a.motivo?": "+esc(a.motivo):""}</span>`:""}</td>
      <td class="mono">${itData(a.dal)}</td><td class="mono">${itData(a.al)}</td>
      <td class="num-cella mono">${diffGiorni(a.dal, a.al)+1}</td>
      <td style="text-align:right"><button class="btn piccolo" data-mod-assenza="${a.id}">Modifica</button></td></tr>`;
  }).join("") || '<tr><td colspan="6" style="color:var(--tenue);padding:14px">Nessuna giornata registrata.</td></tr>';

  const sez = {};

  sez.persone = `
    <div class="pannello">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <h2 class="din" style="margin:0">Persone</h2>
        <button class="btn primario" style="margin-left:auto" data-mod-persona="">+ Nuova persona</button>
      </div>
      <div class="sc-stat" style="margin-bottom:14px">
        <div><div class="eti">${tr("In organico")}</div><div class="val mono din">${attive.length}</div></div>
        <div><div class="eti">${tr("Gruppi")}</div><div class="val mono din">${S.gruppi.length}</div></div>
        <div><div class="eti">${tr("Ore al giorno")}</div><div class="val mono din">${arr(oreTot)}</div></div>
        <div><div class="eti">${tr("Attività assegnate")}</div><div class="val mono din">${S.assegnazioni.length}</div></div>
        <div><div class="eti">${tr("Sforamenti smart")}</div><div class="val mono din" ${sfori.length?'style="color:var(--allarme)"':""}>${sfori.length||"–"}</div></div>
      </div>
      <table><thead><tr><th>Nome</th><th style="width:90px">Anche in</th>
        <th style="width:70px">Mansione</th>
        <th class="num-cella" style="width:80px">h/giorno</th>
        <th class="num-cella" style="width:90px">Max smart</th>
        <th class="num-cella" style="width:80px">Attività</th>
        <th style="width:100px">Stato</th><th></th></tr></thead><tbody>${rP}</tbody></table>
      <p class="nota" style="margin-top:10px">${tr("Il limite di smart working è di {0} giorni a settimana; ✦ segnala chi ha una deroga personale.", S.config.smartMaxSettimana)}</p>
    </div>`;

  sez.gruppi = `
    <div class="pannello">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
        <h2 class="din" style="margin:0">Gruppi di lavoro</h2>
        <button class="btn primario" style="margin-left:auto" data-mod-gruppo="">+ Nuovo gruppo</button>
      </div>
      <p class="nota">L'ordine qui sotto è l'ordine delle fasce nel calendario. La sigla compare nel calendario e accanto ai nomi.</p>
      <table><thead><tr><th style="width:60px">Sigla</th><th>Nome</th><th class="num-cella" style="width:80px">Persone</th>
        <th class="num-cella" style="width:80px">Ore/giorno</th>
        <th style="width:90px">Ordine</th><th></th></tr></thead><tbody>
      ${S.gruppi.map((g,idx)=>{
        const membri = S.persone.filter(p=>p.gruppoId===g.id && p.attivo!==false);
        const ore = membri.reduce((s,p)=>s + capacitaOggi(p), 0);
        return `<tr><td><span class="sigla din">${esc(g.sigla)}</span></td>
          <td>${esc(g.nome)}</td>
          <td class="num-cella mono">${membri.length||"–"}</td>
          <td class="num-cella mono">${ore?arr(ore):"–"}</td>
          <td><button class="btn piccolo" data-su-gruppo="${idx}" ${idx===0?"disabled":""}>▲</button>
              <button class="btn piccolo" data-giu-gruppo="${idx}" ${idx===S.gruppi.length-1?"disabled":""}>▼</button></td>
          <td style="text-align:right"><button class="btn piccolo" data-mod-gruppo="${g.id}">Modifica</button></td></tr>`;
      }).join("") || '<tr><td colspan="6" style="color:var(--tenue);padding:14px">Nessun gruppo.</td></tr>'}
      </tbody></table>
    </div>
    <div class="pannello">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
        <h2 class="din" style="margin:0">Mansioni</h2>
        <button class="btn primario" style="margin-left:auto" data-mod-mansione="">+ Nuova mansione</button>
      </div>
      <p class="nota">Distingue, dentro uno stesso gruppo, chi non fa lo stesso lavoro — usata per capire chi può davvero sostituire chi quando il pianificatore propone una riassegnazione in Verifiche.</p>
      <table><thead><tr><th style="width:60px">Sigla</th><th>Nome</th><th class="num-cella" style="width:80px">Persone</th><th></th></tr></thead><tbody>
      ${(S.mansioni||[]).map(m=>{
        const membri = S.persone.filter(p=>p.mansioneId===m.id && p.attivo!==false);
        return `<tr><td><span class="sigla din">${esc(m.sigla||"–")}</span></td>
          <td>${esc(m.nome)}</td>
          <td class="num-cella mono">${membri.length||"–"}</td>
          <td style="text-align:right"><button class="btn piccolo" data-mod-mansione="${m.id}">Modifica</button></td></tr>`;
      }).join("") || '<tr><td colspan="4" style="color:var(--tenue);padding:14px">Nessuna mansione: le riassegnazioni suggerite proporranno solo spostamenti di data, mai di persona.</td></tr>'}
      </tbody></table>
    </div>`;

  sez.assenze = `
    <div class="pannello">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <h2 class="din" style="margin:0">Ferie, permessi e giornate fuori sede</h2>
        <span class="conteggio mono" style="margin:0">${tr("{0} registrate", (S.assenze||[]).length)}</span>
        <button class="btn primario" style="margin-left:auto" data-mod-assenza="">+ Nuova giornata</button>
      </div>
      <table><thead><tr><th>Persona</th><th>Tipo</th><th style="width:110px">Dal</th>
        <th style="width:110px">Al</th><th class="num-cella" style="width:70px">Giorni</th>
        <th></th></tr></thead><tbody>${rA}</tbody></table>
    </div>`;

  sez.controlli = `
    <div class="pannello">
      <h2 class="din">Smart working oltre il limite</h2>
      <p class="nota">${tr("Il tetto generale è di {0} giorni a settimana; le trasferte non rientrano nel conteggio. Chi ha una deroga viene contato sul proprio limite.", S.config.smartMaxSettimana)}<br>Il controllo guarda tutte le giornate registrate, passate e future, non un periodo scelto.</p>
      <table><thead><tr><th>Settimana dal</th><th>Persona</th><th class="num-cella">Giorni</th>
        <th class="num-cella">Limite</th><th>Giorni interessati</th></tr></thead><tbody>
      ${sfori.length ? sfori.map(x=>`<tr><td class="mono">${itData(x.lun)}</td><td>${esc(x.p.nome)}</td>
        <td class="num-cella mono" style="color:var(--allarme)"><b>${x.n}</b></td>
        <td class="num-cella mono">${x.lim}</td>
        <td class="mono">${x.giorni.map(k=>itData(k).slice(0,5)).join("  ")}</td></tr>`).join("")
        : '<tr><td colspan="5" style="color:var(--tenue);padding:14px">Nessuno sforamento registrato.</td></tr>'}
      </tbody></table>
    </div>
    <div class="pannello">
      <h2 class="din">Deroghe registrate</h2>
      <table><thead><tr><th>Persona</th><th style="width:110px">Dal</th><th style="width:110px">Al</th><th>Motivo</th><th></th></tr></thead><tbody>
      ${deroghe.length ? deroghe.map(x=>`<tr><td>${esc(x.p.nome)}</td>
        <td class="mono">${itData(x.a.dal)}</td><td class="mono">${itData(x.a.al)}</td>
        <td>${esc(x.a.motivo)||"–"}</td>
        <td style="text-align:right"><button class="btn piccolo" data-mod-assenza="${x.a.id}">Modifica</button></td></tr>`).join("")
        : '<tr><td colspan="5" style="color:var(--tenue);padding:14px">Nessuna deroga registrata.</td></tr>'}
      </tbody></table>
    </div>`;

  if(!sez[V.sottoAna]) V.sottoAna = "persone";
  const schede = Object.keys(SOTTO_ANA).map(k =>
    `<button class="sotto-scheda din" role="tab" data-sottoana="${k}" aria-selected="${k===V.sottoAna}">${tr(SOTTO_ANA[k])}${
      k === "controlli" && sfori.length ? ` <span class="chip ritardo">${sfori.length}</span>` : ""}</button>`).join("");

  document.getElementById("pagina").innerHTML = `<div class="contenuto">
    <div class="sotto-schede" role="tablist">${schede}</div>
    ${sez[V.sottoAna]}
  </div>`;
}
