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
   8bis. RENDER — COMMESSE
   ========================================================== */
const F = {testo:"", stato:"vive", anno:"", natura:"", ordine:"recenti", soloRitardo:false};

function datiCommessa(c){
  const att = S.assegnazioni.filter(a=>a.commessaId===c.id);
  let ore = 0, oreFatte = 0, dichiarate = 0, dal = null, al = null;
  att.forEach(a=>{
    dichiarate += a.oreTotali || 0;
    const e = estremi(a); if(!e) return;
    ore += e.ore;
    if(a.fatta) oreFatte += e.ore;
    if(!dal || e.dal < dal) dal = e.dal;
    if(!al || e.al > al) al = e.al;
  });
  let ritardo = 0;
  att.forEach(a=>{
    if(a.fatta || !sforaConsegna(a)) return;
    const e = estremi(a);
    if(e) ritardo = Math.max(ritardo, diffGiorni(a.scadenza, e.al));
  });
  const gruppi = Array.from(new Set(att.map(a=>{
    const p = persona(a.personaId); return p ? p.gruppoId : null;
  }).filter(Boolean)));
  const vt = c.consegnaCliente ? verificaTempi(c) : null;
  return {ore, oreFatte, dichiarate, dal, al, att, gruppi, ritardo, vt,
          rischio: !!(vt && vt.sfora), oltre: vt ? vt.giorniOltre : 0,
          n:new Set(att.map(a=>a.personaId)).size,
          fatte:att.filter(a=>a.fatta).length, tot:att.length,
          sospese:att.filter(a=>a.sospesa).length};
}

function rendiCommesse(){
  const anni = Array.from(new Set(S.commesse.map(annoCommessa).filter(Boolean))).sort((a,b)=>b-a);
  const q = F.testo.trim().toLowerCase();
  const oggiK = iso(new Date());

  let elenco = S.commesse.filter(c=>{
    if(F.stato === "vive" && (c.stato === "archiviata" || c.stato === "chiusa")) return false;
    if(F.stato !== "vive" && F.stato !== "" && c.stato !== F.stato) return false;
    if(F.anno && String(annoCommessa(c)) !== F.anno) return false;
    if(F.natura && (c.natura||"") !== (F.natura === "vuota" ? "" : F.natura)) return false;
    if(F.soloRitardo){ const q0 = datiCommessa(c); if(!q0.ritardo && !q0.rischio) return false; }
    if(q && !(c.numero + " " + c.cliente + " " + (c.descrizione||"")).toLowerCase().includes(q)) return false;
    return true;
  });

  const info = new Map();
  elenco.forEach(c => info.set(c.id, datiCommessa(c)));
  const ord = {
    recenti: (a,b) => (b.apertura||"") < (a.apertura||"") ? -1 : 1,
    numero:  (a,b) => a.numero < b.numero ? -1 : a.numero > b.numero ? 1 : 0,
    cliente: (a,b) => (a.cliente||"").localeCompare(b.cliente||""),
    ore:     (a,b) => info.get(b.id).ore - info.get(a.id).ore,
    concluse:(a,b) => {
      const x = info.get(a.id), y = info.get(b.id);
      const rx = x.tot ? x.fatte / x.tot : -1, ry = y.tot ? y.fatte / y.tot : -1;
      return (ry - rx) || (y.tot - x.tot);
    }
  };
  elenco = elenco.slice().sort(ord[F.ordine] || ord.recenti);

  const righe = elenco.map(c=>{
    const i = info.get(c.id);
    const attiva = i.al && i.al >= oggiK && i.dal <= oggiK;
    return `<tr class="${c.stato==="archiviata"?"spenta":""}">
      <td><span class="commessa-link" data-scheda="${c.id}"><span class="pastiglia" style="background:${coloreCommessa(c)}"></span><span class="mono">${esc(c.numero)}</span></span></td>
      <td>${esc(c.cliente)||"–"}</td>
      <td>${esc(c.descrizione)||"–"}</td>
      <td>${c.natura&&natura(c.natura)?`<span class="tag din" title="${esc(natura(c.natura).nome)}">${esc(natura(c.natura).sigla)}</span>`:"–"}</td>
      <td>${i.gruppi.map(gid=>{const g=gruppo(gid); return g?`<span class="tag din" title="${esc(g.nome)}">${esc(g.sigla)}</span>`:"";}).join(" ")||"–"}</td>
      <td><span class="chip ${c.stato}">${statoEti(c.stato)}</span>${attiva?' <span class="chip attiva">in corso</span>':""}${i.ritardo?` <span class="chip ritardo">⚠ ${tr("+{0} gg", i.ritardo)}</span>`:""}</td>
      <td class="num-cella mono">${i.n||"–"}</td>
      <td class="num-cella mono">${i.ore?arr(i.ore):"–"}</td>
      <td class="num-cella mono" ${i.tot&&i.fatte===i.tot?'style="color:#0A7A34;font-weight:700"':""}>${i.tot?i.fatte+"/"+i.tot:"–"}</td>
      <td class="mono" style="white-space:nowrap">${i.dal?itData(i.dal)+" → "+itData(i.al):"–"}</td>
      <td class="mono" style="white-space:nowrap" ${i.rischio?'title="Il piano finisce oltre la data limite"':""}>${
        c.consegnaCliente ? itData(c.consegnaCliente) + (i.rischio?` <span class="chip ritardo">${tr("⚠ +{0} gg", i.oltre)}</span>`:"") : "–"}</td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn piccolo" data-scheda="${c.id}">Scheda</button>
        <button class="btn piccolo" data-mod-commessa="${c.id}">Modifica</button></td></tr>`;
  }).join("") || `<tr><td colspan="12" style="padding:18px">
      <div style="color:var(--tenue);margin-bottom:10px">Nessun progetto corrisponde ai filtri.</div>
      ${q ? `<button class="btn primario" data-nuova-cerca="1">${tr("Crea il progetto “{0}”", esc(F.testo.trim()))}</button>` : ""}
    </td></tr>`;

  const daChiudere = S.commesse.filter(c=>c.stato==="chiusa").length;

  const sez = {};
  sez.elenco = `
    <div class="pannello">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <h2 class="din" style="margin:0">Progetti</h2>
        <span class="conteggio mono" style="margin:0">${tr("{0} mostrate su {1}", elenco.length, S.commesse.length)}</span>
        <button class="btn primario" style="margin-left:auto" data-mod-commessa="">+ Nuovo progetto</button>
      </div>
      <div class="filtri">
        <div class="campo" style="min-width:260px"><label for="q-testo">Cerca</label>
          <input type="text" id="q-testo" placeholder="Numero, riferimento o descrizione" value="${esc(F.testo)}" autocomplete="off"></div>
        <div class="campo"><label for="q-stato">Stato</label><select id="q-stato">
          <option value="vive" ${F.stato==="vive"?"selected":""}>Attive e sospese</option>
          <option value="" ${F.stato===""?"selected":""}>Tutte</option>
          ${Object.keys(STATI).map(k=>`<option value="${k}" ${F.stato===k?"selected":""}>${statoEti(k)}</option>`).join("")}
        </select></div>
        <div class="campo"><label for="q-natura">Tipologia</label><select id="q-natura">
          <option value="">Tutte</option>
          ${S.tipologie.map(t=>`<option value="${t.id}" ${F.natura===t.id?"selected":""}>${esc(t.nome)}</option>`).join("")}
          <option value="vuota" ${F.natura==="vuota"?"selected":""}>Da indicare</option>
        </select></div>
        <div class="campo"><label for="q-anno">Anno</label><select id="q-anno">
          <option value="">Tutti</option>
          ${anni.map(a=>`<option value="${a}" ${F.anno===String(a)?"selected":""}>${a}</option>`).join("")}
        </select></div>
        <div class="campo" style="flex:0 1 auto"><label>&nbsp;</label>
          <label class="spunta"><input type="checkbox" id="q-ritardo" ${F.soloRitardo?"checked":""}> Solo in ritardo</label></div>
        <div class="campo"><label for="q-ordine">Ordina per</label><select id="q-ordine">
          <option value="recenti" ${F.ordine==="recenti"?"selected":""}>Più recenti</option>
          <option value="numero" ${F.ordine==="numero"?"selected":""}>Numero</option>
          <option value="cliente" ${F.ordine==="cliente"?"selected":""}>Riferimento</option>
          <option value="ore" ${F.ordine==="ore"?"selected":""}>Ore pianificate</option>
          <option value="concluse" ${F.ordine==="concluse"?"selected":""}>Attività concluse</option>
        </select></div>
      </div>
      <div style="overflow:auto">
      <table><thead><tr><th>Numero</th><th>Riferimento</th><th>Descrizione</th>
        <th>Tipo</th><th>Gruppi</th><th>Stato</th>
        <th class="num-cella">Persone</th><th class="num-cella">Ore</th><th class="num-cella">Concluse</th>
        <th>Periodo pianificato</th><th>Consegna</th><th></th></tr></thead>
      <tbody>${righe}</tbody></table></div>
      ${daChiudere ? `<div style="margin-top:14px;display:flex;align-items:center;gap:10px">
        <button class="btn" id="btn-archivia">${tr("Archivia i {0} progetti chiusi", daChiudere)}</button>
        <span class="nota">Le sposta fuori dalle ricerche senza toccare lo storico del calendario.</span></div>` : ""}
    </div>`;

  sez.tipologie = `
    <div class="pannello">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
        <h2 class="din" style="margin:0">Tipologie</h2>
        <button class="btn primario" style="margin-left:auto" data-mod-tipologia="">+ Nuova tipologia</button>
      </div>
      <p class="nota">Classifica i progetti (es. per ordine, sviluppo di nuova gamma, manutenzione...): usata nei filtri di Progetti e nelle medie di Verifiche → Tempistiche.</p>
      <table><thead><tr><th style="width:60px">Sigla</th><th>Nome</th><th style="width:160px">Consegna richiesta</th><th class="num-cella" style="width:80px">Progetti</th><th></th></tr></thead><tbody>
      ${(S.tipologie||[]).map(t=>{
        const usati = S.commesse.filter(c=>c.natura===t.id);
        return `<tr><td><span class="sigla din">${esc(t.sigla||"–")}</span></td>
          <td>${esc(t.nome)}</td>
          <td>${t.richiedeConsegna?tr("Sì"):"–"}</td>
          <td class="num-cella mono">${usati.length||"–"}</td>
          <td style="text-align:right"><button class="btn piccolo" data-mod-tipologia="${t.id}">Modifica</button></td></tr>`;
      }).join("") || '<tr><td colspan="5" style="color:var(--tenue);padding:14px">Nessuna tipologia: i progetti restano senza classificazione.</td></tr>'}
      </tbody></table>
    </div>`;

  if(!sez[V.sottoCom]) V.sottoCom = "elenco";
  const schede = Object.keys(SOTTO_COM).map(k =>
    `<button class="sotto-scheda din" role="tab" data-sottocom="${k}" aria-selected="${k===V.sottoCom}">${tr(SOTTO_COM[k])}</button>`).join("");

  document.getElementById("pagina").innerHTML = `<div class="contenuto">
    <div class="sotto-schede" role="tablist">${schede}</div>
    ${sez[V.sottoCom]}
  </div>`;
}
