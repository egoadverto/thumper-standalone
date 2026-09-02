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
   7. RENDER — CARICHI
   ========================================================== */
function rendiCarichi(){
  const gg = giorniVisibili();
  const carichi = caricoPersone();
  const persone = personeOrdinate(true);

  // settimane
  const sett = spezzaInSettimane(gg);

  let intest = sett.map(s=>`<th class="num-cella">${itData(s[0].k).slice(0,5)}</th>`).join("");
  let corpo = "";
  S.gruppi.forEach(gr=>{
    const membri = persone.filter(p=>p.gruppoId===gr.id);
    if(!membri.length) return;
    corpo += `<tr><td colspan="${sett.length+2}" style="background:#E4E9ED"><span class="sigla din">${gr.sigla}</span> <span class="din">${esc(gr.nome)}</span></td></tr>`;
    membri.forEach(p=>{
      const mia = carichi.get(p.id) || new Map();
      let ggOltre = 0;
      gg.forEach(g=>{
        const o = mia.get(g.k) || 0;
        if(o > 0 && o > capacitaGiorno(p.id, g.k) + 0.001) ggOltre++;
      });
      const celle = sett.map(s=>{
        let o=0, c=0;
        s.forEach(g=>{ o += mia.get(g.k)||0; c += capacitaGiorno(p.id,g.k); });
        if(c===0 && o===0) return `<td class="num-cella q0 mono">–</td>`;
        const r = c>0 ? o/c : 2;
        const q = r>1.001?"q4":r>=.85?"q3":r>=.5?"q2":r>0?"q1":"q0";
        return `<td class="num-cella ${q} mono" title="${arr(o)} h su ${c} h disponibili">${o?arr(o):"·"}</td>`;
      }).join("");
      corpo += `<tr><td>${esc(p.nome)}</td>${celle}
        <td class="num-cella mono" ${ggOltre?'style="color:var(--allarme);font-weight:700"':'style="color:var(--tenue)"'}>${ggOltre||"–"}</td></tr>`;
    });
  });

  // giorni in sovraccarico
  let sovra = [];
  persone.forEach(p=>{
    const mia = carichi.get(p.id) || new Map();
    gg.forEach(g=>{
      const o = mia.get(g.k)||0;
      if(o<=0) return;
      const c = capacitaGiorno(p.id, g.k);
      if(o > c + 0.001) sovra.push({p, k:g.k, o, c});
    });
  });
  sovra.sort((a,b)=> a.k<b.k?-1:1);

  const rigaSovra = sovra.length ? sovra.map(s=>{
    const motivo = s.c===0 ? (eLavorativo(s.k) ? "persona assente" : (eFestivo(s.k) ? "giorno festivo" : "giorno non lavorativo")) : "oltre capacità";
    // "persona assente"/giorno non lavorativo: nessuna attivita' da spostare risolverebbe niente
    const candidati = s.c > 0 ? candidatiRiassegnazione(s.p.id, s.k) : [];
    const chiave = s.k + "|" + s.p.id;
    const aperta = V.opzioniAperte.has(chiave);
    const riga = `<tr class="riga-sovra${aperta?" aperta":""}"><td class="mono">${itData(s.k)}</td><td>${esc(s.p.nome)}</td>
      <td class="num-cella mono">${arr(s.o)}</td><td class="num-cella mono">${arr(s.c)}</td>
      <td class="num-cella mono" style="color:var(--allarme)"><b>+${arr(s.o-s.c)}</b></td><td>${motivo}</td>
      <td>${candidati.length ? `<button class="btn piccolo${aperta?" primario":""}" data-apri-opzioni="${esc(chiave)}"><span class="freccia">▸</span>${tr("Opzioni ({0})", candidati.length)}</button>` : ""}</td></tr>`;
    if(!aperta) return riga;
    const cRisolvibili = candidati.some(x=>x.spostamento || x.sostituto);
    return riga + `<tr class="riga-opzioni"><td colspan="7"><div class="opzioni-corpo">
        <p class="opzioni-intro">${cRisolvibili
          ? tr("Attività che occupano questa giornata, ordinate per margine — quanti giorni restano prima del loro limite. Puoi spostare quella che preferisci, di data o di persona.")
          : tr("Nessuno spostamento risolve questa giornata, né di data né di persona. Le attività coinvolte, per capire da dove viene il sovraccarico:")}</p>
        ${candidati.map((x,i)=>rigaOpzione(x, i===0 && !!(x.spostamento || x.sostituto))).join("")}
      </div></td></tr>`;
  }).join("") : `<tr><td colspan="7" style="color:var(--tenue);padding:14px">Nessun sovraccarico nel periodo mostrato.</td></tr>`;

  function rigaOpzione(x, migliore){
    const margineTesto = x.margine == null ? tr("nessuna scadenza") : tr("{0} gg", x.margine);
    const numero = x.c ? esc(x.c.numero) : "–";
    const cliente = x.c && x.c.cliente ? esc(x.c.cliente) : "";
    const intestazione = `<div class="opz-commessa"${x.c?` data-scheda="${x.c.id}"`:""}><span class="pallino-commessa" style="background:${x.c?coloreCommessa(x.c):"#9AA7B0"}"></span>
      <span><b class="mono">${numero}</b><span class="cliente">${cliente}</span></span></div>
      <div class="opz-margine"><div class="num din"${x.margine!=null&&x.margine<=2?' style="color:var(--allarme)"':""}>${margineTesto}</div><div class="eti">${tr("di margine")}</div></div>`;
    if(x.spostamento || x.sostituto){
      const righe = [];
      if(x.spostamento) righe.push(`<div class="proposta-riga">
        <span class="testo"><span class="etichetta-via">${tr("Stessa persona")}</span>${tr("Sposta al {0} (primo giorno libero) → libera {1}h.", itData(x.spostamento.dataInizio), arr(x.ore))}</span>
        <button class="btn piccolo${x.sostituto?"":" primario"}" data-applica-riassegnazione="${x.a.id}" data-nuova-data="${x.spostamento.dataInizio}">${tr("Applica")}</button>
      </div>`);
      if(x.sostituto) righe.push(`<div class="proposta-riga">
        <span class="testo"><span class="etichetta-via">${tr("Stesso giorno")}</span>${tr("Sposta su {0} → libera {1}h.", esc(x.sostituto.nome), arr(x.ore))}</span>
        <button class="btn piccolo primario" data-applica-sostituzione="${x.a.id}" data-nuova-persona="${x.sostituto.id}">${tr("Applica")}</button>
      </div>`);
      return `<div class="carta-opzione${migliore?" migliore":""}">${intestazione}<div class="opz-proposte">${righe.join("")}</div></div>`;
    }
    return `<div class="carta-opzione non-applicabile">${intestazione}
      <div class="opz-proposta">${x.margine===0 ? tr("Già al limite: nessuno spostamento in avanti è possibile.") : tr("Nessun giorno libero disponibile entro il limite, né un collega con la stessa mansione libero quel giorno.")}</div>
      <div class="opz-azione"></div>
    </div>`;
  }

  // tempi medi delle commesse concluse, separati per natura
  const stat = statisticheCommesse();
  const daClassificare = stat[""].ore.length + stat[""].senzaAttivita;
  const rigaNatura = k => {
    const g = stat[k], so = sintesi(g.ore), sd = sintesi(g.durate);
    return `<tr><td><b>${esc(natura(k).nome)}</b></td>
      <td class="num-cella mono">${g.ore.length||"–"}</td>
      <td class="num-cella">${fmtSintesi(so,"ore")}</td>
      <td class="num-cella mono">${so.poco?"–":arr(so.min)+" – "+arr(so.max)}</td>
      <td class="num-cella">${fmtSintesi(sd,"giorni")}</td>
      <td class="num-cella mono">${sd.poco?"–":fmtDurata(sd.min)+" – "+fmtDurata(sd.max)}</td></tr>`;
  };
  const rigaGruppo = gr => {
    const celle = S.tipologie.map(t=>{
      const s = sintesi(stat[t.id].perGruppo[gr.id] || []);
      return `<td class="num-cella">${fmtSintesi(s,"ore")}${s.poco?"":`<div class="nota">${tr("su {0} progetti", s.n)}</div>`}</td>`;
    }).join("");
    return `<tr><td><span class="sigla din">${esc(gr.sigla)}</span> ${esc(gr.nome)}</td>${celle}</tr>`;
  };

  // commesse la cui consegna concordata col cliente non regge piu'
  const rischio = S.commesse.filter(c => c.consegnaCliente && c.stato !== "chiusa" && c.stato !== "archiviata")
    .map(c => ({c, v:verificaTempi(c)}))
    .filter(x => x.v && (x.v.sfora || !x.v.finePiano))
    // senza nessuna attività non c'è una data limite da ordinare: quelli vanno per primi,
    // sono i più urgenti da sistemare (una scadenza concordata e ancora nulla in piano)
    .sort((x,y) => (x.v.lim?x.v.lim.fineUfficio:"") < (y.v.lim?y.v.lim.fineUfficio:"") ? -1 : 1);

  // consegne che non rientrano piu'
  const tardive = S.assegnazioni.filter(a=>{
    if(!sforaConsegna(a) || a.fatta) return false;
    const cz = commessa(a.commessaId);
    return !!cz && cz.stato !== "chiusa" && cz.stato !== "archiviata";
  }).map(a=>{
    const e = estremi(a);
    return {a, p:persona(a.personaId), c:commessa(a.commessaId), e,
            ritardo: e ? diffGiorni(a.scadenza, e.al) : 0};
  }).filter(x=>x.p && x.c).sort((x,y)=> x.a.scadenza < y.a.scadenza ? -1 : 1);

  const sez = {};
  sez.carichi = `
    <div class="pannello">
      <h2 class="din">Carico per settimana</h2>
      <div id="casa-strumenti"></div>
      <p class="nota">Ore pianificate rapportate alle ore disponibili, al netto di weekend, festività e assenze.
      L'ultima colonna conta le singole giornate in cui le ore assegnate superano quelle disponibili, nel periodo mostrato.</p>
      <div style="overflow:auto"><table><thead><tr><th>Persona</th>${intest}<th class="num-cella">Giorni oltre</th></tr></thead><tbody>${corpo}</tbody></table></div>
    </div>
    <div class="pannello">
      <h2 class="din">Giorni in sovraccarico</h2>
      <table><thead><tr><th>Giorno</th><th>Persona</th><th class="num-cella">Pianificate</th><th class="num-cella">Disponibili</th><th class="num-cella">Eccesso</th><th>Causa</th><th></th></tr></thead>
      <tbody>${rigaSovra}</tbody></table>
    </div>
`;
  sez.tempi = `
    <div class="pannello">
      <h2 class="din">Media tempistiche</h2>
      <p class="nota">Calcolati sui progetti chiusi e archiviati, tutta la storia disponibile e non solo il periodo mostrato.
      Il valore centrale è la mediana e il ± è lo scarto mediano, che non si lascia spostare dal caso isolato; accanto trovi
      il minimo e il massimo reali. Finché i progetti conclusi sono meno di cinque il pianificatore non calcola la mediana,
      che cambierebbe troppo a ogni chiusura: elenca i valori dei singoli progetti, che sono fatti e non stime.</p>
      <p class="nota"><b>Sono medie delle ore stimate in pianificazione, non di ore consuntivate: qui dentro nessuno registra il tempo realmente speso.</b></p>
      <p class="nota">"Giorni lavorati" conta i giorni in cui c'è stata almeno un'ora su quel progetto, non l'intervallo dal primo
      all'ultimo giorno toccato: le pause per altro (altri progetti, ferie, attesa fornitori...) non allungano il conto.</p>
      <h3>Per tipologia</h3>
      <table><thead><tr><th>Tipologia</th><th class="num-cella">Concluse</th>
        <th class="num-cella">Ore per progetto</th><th class="num-cella">Da / a</th>
        <th class="num-cella">Giorni lavorati</th><th class="num-cella">Da / a</th></tr></thead><tbody>
      ${S.tipologie.length ? S.tipologie.map(t=>rigaNatura(t.id)).join("") : '<tr><td colspan="6" style="color:var(--tenue);padding:14px">Nessuna tipologia definita.</td></tr>'}
      </tbody></table>
      ${daClassificare ? `<p class="nota" style="margin-top:10px">${tr(daClassificare===1
        ? "⚠ Un progetto concluso non ha la tipologia indicata e resta fuori dal conto. Si imposta nella scheda del progetto, campo “Tipologia”."
        : "⚠ {0} progetti conclusi non hanno la tipologia indicata e restano fuori dal conto. Si imposta nella scheda del progetto, campo “Tipologia”.", daClassificare)}</p>` : ""}
      <h3>Ore per gruppo, quando il gruppo è coinvolto</h3>
      <p class="nota">Serve a distribuire il monte ore quando arriva un progetto nuovo. I progetti in cui un gruppo non ha
      lavorato non entrano nella sua mediana, altrimenti gli zeri la schiaccerebbero verso il basso.</p>
      <table><thead><tr><th>Gruppo</th>${S.tipologie.map(t=>`<th class="num-cella">${esc(t.nome)}</th>`).join("")}</tr></thead>
      <tbody>${S.gruppi.map(rigaGruppo).join("")}</tbody></table>
    </div>
    <div class="pannello">
      <h2 class="din">Attività a rischio</h2>
      <p class="nota">${tr('Progetti aperti con una consegna concordata. La data limite di ciascuno è la più stretta fra le sue attività pianificate: la consegna meno il tempo di sviluppo interno dell\'attività, il lead time di fornitura esterna più lungo e l\'eventuale margine. Compaiono qui quelli il cui piano finisce oltre quella data e quelli non ancora pianificati — compresi quelli senza nessuna attività, per cui la data limite non è ancora calcolabile. Il dettaglio per persona è nella scheda del progetto.')}</p>
      <table><thead><tr><th>Progetto</th><th>Riferimento</th><th>Consegna</th><th>Fine ufficio entro</th>
        <th>Fine pianificata</th><th class="num-cella">Oltre di</th></tr></thead><tbody>
      ${rischio.length ? rischio.map(x=>`<tr>
        <td><span class="commessa-link" data-scheda="${x.c.id}"><span class="pastiglia" style="background:${coloreCommessa(x.c)}"></span><span class="mono">${esc(x.c.numero)}</span></span></td>
        <td>${esc(x.c.cliente)||"–"}</td>
        <td class="mono">${itData(x.c.consegnaCliente)}</td>
        <td class="mono">${x.v.lim ? itData(x.v.lim.fineUfficio) : `<span class="nota">${tr("non calcolabile")}</span>`}</td>
        <td class="mono" ${x.v.sfora?'style="color:var(--allarme)"':""}><b>${x.v.finePiano?itData(x.v.finePiano):tr("non pianificata")}</b></td>
        <td class="num-cella mono" style="color:var(--allarme)"><b>${x.v.finePiano?tr("+{0} gg", x.v.giorniOltre):"–"}</b></td></tr>`).join("")
        : '<tr><td colspan="6" style="color:var(--tenue);padding:14px">Tutte le consegne concordate rientrano nei tempi.</td></tr>'}
      </tbody></table>
    </div>
    <div class="pannello">
      <h2 class="din">Tempistiche non rispettate</h2>
      <p class="nota">Solo progetti aperti e attività ancora da concludere. Compare qui ciò che ha una data di consegna
      (finestra attività, vincolo “Consegna entro il”) e che con le ore attuali non rientra più: la partenza è già stata anticipata al massimo.</p>
      <table><thead><tr><th>Progetto</th><th>Persona</th><th>Consegna entro</th><th>Finisce il</th><th class="num-cella">Ritardo</th></tr></thead><tbody>
      ${tardive.length ? tardive.map(x=>`<tr>
        <td><span class="commessa-link" data-scheda="${x.c.id}"><span class="pastiglia" style="background:${coloreCommessa(x.c)}"></span><span class="mono">${esc(x.c.numero)}</span></span></td>
        <td>${esc(x.p.nome)}</td><td class="mono">${itData(x.a.scadenza)}</td>
        <td class="mono" style="color:var(--allarme)"><b>${itData(x.e.al)}</b></td>
        <td class="num-cella mono" style="color:var(--allarme)"><b>${tr("+{0} gg", x.ritardo)}</b></td></tr>`).join("")
        : '<tr><td colspan="5" style="color:var(--tenue);padding:14px">Tutte le consegne vincolate rientrano.</td></tr>'}
      </tbody></table>
    </div>`;

  sez.report = sezioneReport();

  if(!sez[V.sottoVer]) V.sottoVer = "carichi";
  const barra = Object.keys(SOTTO_VER).map(k =>
    `<button class="sotto-scheda din" role="tab" data-sottover="${k}" aria-selected="${k===V.sottoVer}">${tr(SOTTO_VER[k])}</button>`).join("");
  // per carichi/report la barra del periodo finisce dentro il pannello stesso (vedi sistemaBarra()):
  // una nota che dica dov'e' non ha piu' senso li', resta utile solo per "tempi" che non ne ha una.
  const spiega = (V.sottoVer === "carichi" || V.sottoVer === "report") ? "" :
    "Questi conteggi guardano tutti i progetti disponibili e non dipendono dal periodo mostrato nel calendario.";

  document.getElementById("pagina").innerHTML = `<div class="contenuto">
    <div class="sotto-schede" role="tablist">${barra}</div>
    ${spiega ? `<p class="nota non-stampare" style="margin:-8px 0 14px">${tr(spiega)}</p>` : ""}
    ${sez[V.sottoVer]}
  </div>`;
}
