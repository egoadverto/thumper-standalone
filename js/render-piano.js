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
   6. RENDER — PIANIFICAZIONE
   ========================================================== */
function giorniVisibili(){
  const n = V.giorni;
  const start = d(V.inizio);
  const out = [];
  for(let i=0;i<n;i++){
    const dt = sommaGiorni(start,i);
    const k = iso(dt);
    out.push({k, dt, lav:eLavorativo(k), fest:eFestivo(k), gs:dt.getDay()});
  }
  return out;
}

function rendiPiano(){
  const pagina = document.getElementById("pagina");
  const gg = giorniVisibili();
  const C = V.colonna;
  const W = gg.length * C;
  const oggiK = iso(new Date());
  document.documentElement.style.setProperty("--col", C+"px");

  if(S.persone.filter(p=>p.attivo!==false).length === 0){
    pagina.innerHTML = `<div class="vuoto-messaggio"><b>${tr("Nessuna persona in elenco")}</b>`
      + tr("Aggiungi le persone dell'ufficio nella scheda Anagrafiche per iniziare a pianificare.") + `</div>`;
    return;
  }

  // sfondo colonne
  let sf = "";
  gg.forEach((g,i)=>{
    const x = i*C;
    if(g.fest) sf += `<div class="col-fest" style="left:${x}px;width:${C}px"></div>`;
    else if(!g.lav) sf += `<div class="col-nonlav" style="left:${x}px;width:${C}px"></div>`;
    sf += `<div class="${g.gs===1?"col-sett":"col-linea"}" style="left:${x}px"></div>`;
    if(g.k===oggiK) sf += `<div class="linea-oggi" style="left:${x}px"></div>`;
  });

  // testata: bande mese
  let mesi = "";
  let m0 = 0;
  for(let i=1;i<=gg.length;i++){
    if(i===gg.length || gg[i].dt.getMonth() !== gg[m0].dt.getMonth()){
      const larg = (i-m0)*C;
      mesi += `<div class="mese" style="left:${m0*C}px;width:${larg}px">${MESI[gg[m0].dt.getMonth()]} ${gg[m0].dt.getFullYear()}</div>`;
      m0 = i;
    }
  }
  let testaGiorni = "";
  gg.forEach((g,i)=>{
    const cls = ["gt"];
    if(g.fest) cls.push("fest"); else if(!g.lav) cls.push("nonlav");
    if(g.k===oggiK) cls.push("oggi");
    const tit = g.fest ? ` title="${nomeFestivita(g.k)}"` : "";
    testaGiorni += `<div class="${cls.join(" ")}" style="left:${i*C}px"${tit}><b class="mono">${g.dt.getDate()}</b><span>${GG[g.gs]}</span></div>`;
  });

  const carichi = caricoPersone();
  const dist = distribuzioni();
  const indice = {};
  gg.forEach((g,i)=> indice[g.k]=i);

  let righe = "";
  S.gruppi.forEach(gr=>{
    const membri = S.persone.filter(p => p.attivo!==false && p.gruppoId===gr.id).sort(perNome);
    if(membri.length===0) return;
    righe += `<div class="riga gruppo">
      <div class="cella-nomi"><span class="sigla din">${gr.sigla}</span>
      <span class="gruppo-nome din">${esc(gr.nome)}</span>
      <span class="gruppo-conta mono">${membri.length}</span></div>
      <div class="pista" style="width:${W}px;height:26px"></div></div>`;

    membri.forEach(p=>{
      let att = S.assegnazioni.filter(a => a.personaId===p.id);
      if(V.filtroCommessa) att = att.filter(a => a.commessaId===V.filtroCommessa);
      if(V.nascondiFatte) att = att.filter(a => !a.fatta);
      const {info, n} = corsie(att);

      // blocchi
      let blocchi = "";
      info.forEach(x=>{
        const c = commessa(x.a.commessaId);
        if(!c) return;
        let i0 = indice[x.e.dal], i1 = indice[x.e.al];
        if(i0===undefined && i1===undefined){
          if(x.e.al < gg[0].k || x.e.dal > gg[gg.length-1].k) return;
        }
        if(i0===undefined) i0 = 0;
        if(i1===undefined) i1 = gg.length-1;
        const left = i0*C, wid = Math.max(C-2, (i1-i0+1)*C - 2);
        const gDist = dist.get(x.a.id);
        const perG = arr(orePerGiornoEff(x.a));
        const tardi = sforaConsegna(x.a);
        const vincolo = modoAtt(x.a)==="fine" ? "&#10;Consegna entro il "+itData(x.a.scadenza)+(tardi?" ⚠ NON RISPETTATA":"")
                      : modoAtt(x.a)==="finestra" ? "&#10;Finestra: carico ripartito" : "";
        blocchi += `<div class="blocco ${tardi?"tardi":""}${x.a.fatta?" fatta":""}" data-att="${x.a.id}" title="${esc(c.numero+" · "+c.cliente)}${x.a.descrizione?"&#10;"+esc(x.a.descrizione):""}&#10;${arr(x.e.ore)} h totali · ${perG} h/giorno&#10;${itData(x.e.dal)} → ${itData(x.e.al)}${vincolo}${x.a.annullata?"&#10;✕ Annullata":x.a.fatta?"&#10;✓ Conclusa":""}"
          style="left:${left}px;width:${wid}px;top:${x.corsia*26+3}px;background:${coloreCommessa(c)}">
          ${x.a.annullata?'<span class="segno" title="Annullata">✕</span>':x.a.fatta?'<span class="segno" title="Conclusa">✓</span>':""}<span class="num mono">${esc(c.numero)}</span>
          <span class="cli">${esc(c.cliente)}</span>
          <span class="ore mono">${arr(x.e.ore)}h</span></div>`;
      });

      // assenze
      let assenze = "", haPermesso = false;
      (S.assenze||[]).filter(a=>a.personaId===p.id).forEach(a=>{
        let i0 = indice[a.dal], i1 = indice[a.al];
        if(i0===undefined && a.dal < gg[0].k && a.al >= gg[0].k) i0 = 0;
        if(i1===undefined && a.al > gg[gg.length-1].k && a.dal <= gg[gg.length-1].k) i1 = gg.length-1;
        if(i0===undefined || i1===undefined) return;
        if(FUORI_SEDE.includes(a.tipo)) return;   // reso come fascia, non come assenza
        if(a.tipo==="permesso") haPermesso = true;   // riga più alta: banda dedicata, vedi sotto
        const et = tr(SIGLE_GIORNO[a.tipo] || a.tipo);
        const larg = (i1-i0+1)*C - 3;
        const dett = a.tipo==="permesso" ? et+" "+(a.ore||0)+"h" : et;
        assenze += `<div class="assenza ${a.tipo}" data-assenza="${a.id}"
          title="${esc(p.nome)} · ${et}&#10;${itData(a.dal)} → ${itData(a.al)}${a.tipo==="permesso"?"&#10;"+(a.ore||0)+" ore al giorno":""}"
          style="left:${i0*C+1}px;width:${larg}px">${larg>38?dett:(larg>16?et[0]:"")}</div>`;
      });
      // riga più alta di 13px quando c'e' un permesso: gli lascia una banda dedicata sopra
      // quella di smart working/trasferta (.fs-fascia), cosi' i due non si sovrappongono mai
      // nei giorni in cui coincidono (permesso di poche ore + smart lo stesso giorno).
      const h = n*26 + 24 + (haPermesso ? 13 : 0);

      // fasce fuori sede: giorni consecutivi dello stesso tipo uniti in un'unica barra
      let fuori = "", corsa = null, chiave = null;
      const chiudiCorsa = fine => {
        if(corsa === null) return;
        const [tipo, stato, vid] = chiave.split("|");
        const larg = (fine-corsa+1)*C - 3;
        const voce = (S.assenze||[]).find(x=>x.id===vid);
        const eti = (stato==="d" ? "✦ " : "") + tr(SIGLE_GIORNO[tipo]);
        const coda = stato==="o" ? "&#10;⚠ Oltre il limite di "+limiteSmart(p)+" giorni a settimana"
                   : stato==="d" ? "&#10;✦ Deroga eccezionale" + (voce&&voce.motivo ? ": "+esc(voce.motivo) : "") : "";
        fuori += `<div class="fs-fascia ${tipo} ${stato==="o"?"oltre":stato==="d"?"deroga":""}" data-assenza="${vid}"
          title="${esc(p.nome)} · ${TIPI_GIORNO[tipo]}&#10;${itData(gg[corsa].k)} → ${itData(gg[fine].k)}${coda}"
          style="left:${corsa*C+1}px;width:${larg}px;bottom:13px">${larg>40?eti:""}</div>`;
        corsa = null; chiave = null;
      };
      gg.forEach((g,i)=>{
        const voce = voceFuoriSede(p.id, g.k);
        const stato = !voce ? "" : smartOltreLimite(p.id, g.k) ? "o" : inDeroga(p.id, g.k) ? "d" : "n";
        const k = voce ? voce.tipo + "|" + stato + "|" + voce.id : null;
        if(k !== chiave) { chiudiCorsa(i-1); if(k){ corsa = i; chiave = k; } }
        if(i === gg.length-1) chiudiCorsa(i);
      });

      // nastro di carico
      const mia = carichi.get(p.id) || new Map();
      let nastro = "";
      gg.forEach((g,i)=>{
        const cap = capacitaGiorno(p.id, g.k);
        const ore = mia.get(g.k) || 0;
        nastro += `<div class="n-cella" style="left:${i*C}px;width:${C}px"></div>`;
        if(ore > 0 && cap > 0){
          const r = ore/cap;
          const alt = Math.min(1, r) * 9;
          const cls = r > 1.001 ? "oltre" : (r > 0.999 ? "pieno" : "");
          nastro += `<div class="n-carico ${cls}" title="${esc(p.nome)} · ${itData(g.k)}&#10;${arr(ore)} h su ${cap} h" style="left:${i*C}px;width:${C-1}px;height:${r>1.001?9:alt}px"></div>`;
        } else if(ore > 0 && cap === 0){
          nastro += `<div class="n-carico oltre" title="Ore pianificate in un giorno non disponibile" style="left:${i*C}px;width:${C-1}px;height:9px"></div>`;
        }
      });

      let ggAssenza = 0, ggSmart = 0, ggTrasf = 0, ggOltre = 0;
      gg.forEach(g=>{
        if(eLavorativo(g.k) && assenzaGiorno(p.id, g.k)) ggAssenza++;
        const t = tipoFuoriSede(p.id, g.k);
        if(t === "smart") ggSmart++; else if(t === "trasferta") ggTrasf++;
        if(smartOltreLimite(p.id, g.k)) ggOltre++;
      });
      const extra = (p.gruppiExtra||[]).map(id=>{const g=gruppo(id); return g?`<span class="tag din">${esc(g.sigla)}</span>`:"";}).join("");
      const oreP = capacitaPersonaGiorno(p, gg[0].k);
      righe += `<div class="riga" data-persona="${p.id}">
        <div class="cella-nomi">
          <div class="persona-nome"><b>${esc(p.nome)}</b>${extra}</div>
          <div class="persona-sub mono">${tr("{0} h/giorno", oreP)}${ggAssenza?` · <span style="color:#0A7A34;font-weight:700">${tr("{0} gg assenza", ggAssenza)}</span>`:""}${ggSmart?` · <span style="color:#438A8C;font-weight:700">${tr("{0} smart", ggSmart)}</span>`:""}${ggTrasf?` · <span style="color:#343A40;font-weight:700">${tr("{0} trasf.", ggTrasf)}</span>`:""}${ggOltre?` · <span style="color:var(--allarme);font-weight:700">${tr("⚠ {0} oltre limite", ggOltre)}</span>`:""}</div>
        </div>
        <div class="pista" style="width:${W}px;height:${h}px" data-pista="${p.id}">
          ${blocchi}${fuori}${assenze}
          <div class="nastro">${nastro}<div class="n-limite"></div></div>
        </div></div>`;
    });
  });

  pagina.innerHTML = `<div class="tabella" id="tabella">
    <div class="sfondo" style="left:var(--colonna-nomi);width:${W}px">${sf}</div>
    <div class="riga testata">
      <div class="cella-nomi"><div class="din" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase">Persona</div>
      <div class="persona-sub">${tr("{0} in organico", S.persone.filter(p=>p.attivo!==false).length)}</div></div>
      <div class="pista" style="width:${W}px">
        <div class="mesi din">${mesi}</div>
        <div class="giorni-test mono">${testaGiorni}</div>
      </div>
    </div>
    ${righe}
    <div class="riga coda"><div class="cella-nomi"></div><div class="pista" style="width:${W}px"></div></div>
  </div>`;

  const tab = document.getElementById("tabella");
  // porta "oggi" in vista se presente
  if(indice[oggiK] !== undefined) tab.scrollLeft = Math.max(0, indice[oggiK]*C - 200);
  // .sfondo e' assoluto dentro .tabella, che scorre su se stessa: "inset:0" lo alza solo
  // quanto il riquadro visibile, non quanto il contenuto scorribile. Senza un'altezza
  // esplicita sparisce scendendo oltre la prima schermata di righe.
  const sfondo = tab.querySelector(".sfondo");
  if(sfondo) sfondo.style.height = tab.scrollHeight + "px";
  agganciaPiano(tab, gg, C);
}
function arr(n){ return Math.round(n*10)/10; }
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

function agganciaPiano(tab, gg, C){
  tab.addEventListener("click", ev=>{
    const nome = ev.target.closest(".cella-nomi");
    if(nome){
      const riga = nome.closest("[data-persona]");
      if(riga){ apriSchedaPersona(riga.dataset.persona); return; }
    }
    const b = ev.target.closest(".blocco");
    if(b){ apriAttivita(b.dataset.att); return; }
    const s = ev.target.closest("[data-assenza]");
    if(s){
      if(!modificabile) return brindisi(tr("Attiva prima la modifica per aprire questa giornata"));
      apriAssenza(s.dataset.assenza); return;
    }
    const pista = ev.target.closest("[data-pista]");
    if(pista && modificabile){
      const r = pista.getBoundingClientRect();
      const i = Math.floor((ev.clientX - r.left)/C);
      const k = gg[Math.max(0,Math.min(gg.length-1,i))].k;
      apriAttivita(null, {personaId:pista.dataset.pista, dataInizio:k});
    }
  });

  // trascinamento orizzontale dei blocchi
  tab.addEventListener("mousedown", ev=>{
    if(!modificabile) return;
    const b = ev.target.closest(".blocco");
    if(!b) return;
    ev.preventDefault();
    const x0 = ev.clientX, left0 = parseFloat(b.style.left);
    let spostato = 0;
    b.classList.add("trascino");
    const muovi = e => {
      spostato = Math.round((e.clientX - x0)/C);
      b.style.left = (left0 + spostato*C) + "px";
    };
    const molla = () => {
      document.removeEventListener("mousemove", muovi);
      document.removeEventListener("mouseup", molla);
      b.classList.remove("trascino");
      if(spostato !== 0){
        const a = S.assegnazioni.find(z=>z.id===b.dataset.att);
        if(a){
          // il blocco e' disegnato dal primo/ultimo giorno EFFETTIVO con ore (estremi,
          // che salta i non lavorativi), non dai dati grezzi: se dataInizio o scadenza
          // cadono di sabato/domenica lo spostamento va calcolato da dove si vede il
          // blocco, altrimenti sbaglia esattamente dei giorni di weekend saltati
          const e = estremi(a);
          const rifInizio = (e && e.dal) || a.dataInizio;
          a.dataInizio = iso(sommaGiorni(d(rifInizio), spostato));
          // se e' ancorata alla consegna, trascinare sposta tutto il blocco, scadenza compresa
          if(a.scadenza){
            const rifFine = (modoAtt(a) === "finestra" && e && e.al) ? e.al : a.scadenza;
            a.scadenza = iso(sommaGiorni(d(rifFine), spostato));
          }
          invalida(); segnaModificato(); rendi();
        }
      } else { b.style.left = left0+"px"; }
    };
    document.addEventListener("mousemove", muovi);
    document.addEventListener("mouseup", molla);
  });
}
