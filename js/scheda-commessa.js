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
   8septies. SCHEDA COMMESSA
   ========================================================== */

function apriSchedaCommessa(id){
  const c = commessa(id); if(!c) return;
  const i = datiCommessa(c);
  const pct = i.ore ? Math.round(i.oreFatte / i.ore * 100) : 0;

  const righe = i.att.slice().sort((x,y)=>{
    const ex = estremi(x), ey = estremi(y);
    return (ex ? ex.dal : "") < (ey ? ey.dal : "") ? -1 : 1;
  }).map(a=>{
    const p = persona(a.personaId), e = estremi(a);
    const g = p ? gruppo(p.gruppoId) : null;
    const tardi = !a.fatta && sforaConsegna(a);
    const date = e ? itData(e.dal) + " – " + itData(e.al) : "–";
    return `<tr>
      <td>${p?esc(p.nome):"?"}${a.descrizione?`<div>${esc(a.descrizione)}</div>`:""}${
        a.note?`<div class="nota">${esc(a.note)}</div>`:""}</td>
      <td>${g?`<span class="tag din">${esc(g.sigla)}</span>`:""}</td>
      <td class="mono" style="white-space:nowrap${tardi?";color:var(--allarme);font-weight:700":""}">${date}${
        a.scadenza?`<div class="nota">${tr("entro {0}", itData(a.scadenza))}${tardi?" ⚠":""}</div>`:""}</td>
      <td class="num-cella mono">${e?arr(e.ore):0}${
        e&&Math.abs(e.ore-(a.oreTotali||0))>0.01?`<div class="nota">${tr("di {0}", a.oreTotali)}</div>`:""}</td>
      <td class="num-cella">${a.annullata
        ? '<span style="color:var(--allarme);font-weight:700">✕</span>'
        : a.fatta
        ? '<span style="color:#0A7A34;font-weight:700">✓</span>'
        : '<span style="color:var(--linea-forte)">○</span>'}</td></tr>`;
  }).join("") || `<tr><td colspan="5" style="color:var(--tenue);padding:14px">Nessuna attività pianificata su questo progetto.</td></tr>`;

  /* --- segnalazioni: tutte ricavate dal piano, niente da inserire a mano --- */
  const avvisi = [];
  if(i.ritardo) avvisi.push(tr("La consegna più critica sfora di {0} giorni.", i.ritardo));
  if(c.consegnaCliente && rischioCliente(c)) avvisi.push(tr("Il piano supera la consegna concordata."));
  const tipoProgetto = c.natura ? natura(c.natura) : null;
  if(tipoProgetto && tipoProgetto.richiedeConsegna && !c.consegnaCliente && c.stato === "attiva")
    avvisi.push(tr("Consegna non indicata."));
  if(!i.tot && c.stato === "attiva") avvisi.push(tr("Progetto attivo senza nessuna attività pianificata."));
  if(c.stato === "chiusa" && i.tot && i.fatte < i.tot)
    avvisi.push(tr("Progetto chiuso con {0} attività non concluse.", i.tot - i.fatte));
  const boxAvvisi = avvisi.length
    ? avvisi.map(t=>`<div class="sc-avviso"><span>⚠</span><span>${t}</span></div>`).join("")
    : `<div class="nota">${tr("Nessuna segnalazione.")}</div>`;

  const gruppiEti = i.gruppi.map(gid=>{ const g = gruppo(gid); return g ? `<span class="tag din">${esc(g.sigla)}</span>` : ""; }).join(" ");

  finestra(esc(c.numero) + (c.cliente ? " · " + esc(c.cliente) : ""),
    `<div class="sc-intestazione">
       <span class="pastiglia" style="background:${coloreCommessa(c)}"></span>
       <span class="chip ${c.stato}">${statoEti(c.stato)}</span>
       <span class="nota">${tr("Anno {0}", annoCommessa(c)||"–")}</span>
       ${c.natura&&natura(c.natura)?`<span class="tag din">${esc(natura(c.natura).nome)}</span>`:""}
       ${c.consegnaCliente?`<span class="chip ${rischioCliente(c)?"ritardo":"attiva"}">${tr("Consegna {0}", itData(c.consegnaCliente))}</span>`:""}
       ${c.stato==="chiusa"&&c.chiusaIl?`<span class="nota">${tr("Chiusa il {0}", itData(c.chiusaIl))}${
         S.config.giorniArchiviazione>0
           ? tr(" · archiviazione tra {0} gg", Math.max(0, S.config.giorniArchiviazione - diffGiorni(c.chiusaIl, iso(new Date()))))
           : ""}</span>`:""}
       <span style="margin-left:auto">${gruppiEti}</span>
     </div>
     ${c.descrizione ? `<p style="margin:0 0 14px">${esc(c.descrizione)}</p>` : ""}

     <div class="sc-due">
       <div class="sc-sx">

         <div class="sc-sezione">
           <h5 class="titoletto din">Pianificazione</h5>
           <div class="sc-stat">
             <div><div class="eti">Ore pianificate</div><div class="val mono din">${arr(i.ore)}</div>
               ${Math.abs(i.dichiarate-i.ore)>0.01?`<div class="nota">su ${arr(i.dichiarate)} previste</div>`:""}</div>
             <div><div class="eti">Ore concluse</div><div class="val mono din">${arr(i.oreFatte)}</div>
               <div class="nota">${tr("{0}% delle ore", pct)}</div></div>
             <div><div class="eti">Attività</div><div class="val mono din"${i.tot&&i.fatte===i.tot?' style="color:#0A7A34"':""}>${i.fatte}/${i.tot}</div></div>
             <div><div class="eti">Persone</div><div class="val mono din">${i.n||"–"}</div></div>
             <div><div class="eti">Periodo</div><div class="val mono" style="font-size:13px;white-space:normal;line-height:1.3">${i.dal?itData(i.dal)+" –<br>"+itData(i.al):"–"}</div></div>
           </div>
           <table style="margin-top:10px"><thead><tr>
             <th>Risorsa</th><th style="width:34px">Gr.</th><th>Date</th>
             <th class="num-cella" style="width:52px">Ore</th>
             <th class="num-cella" style="width:64px">Conclusa</th>
           </tr></thead><tbody>${righe}</tbody></table>
         </div>

         <div class="sc-sezione">
           <h5 class="titoletto din">Note e decisioni</h5>
           <div id="sc-note"><div class="sc-vuoto">${tr("Le note vivono nel file appunti dentro la cartella del progetto. Collega la cartella per vederle.")}</div></div>
         </div>

       </div>
       <div class="sc-dx">

         <div class="sc-sezione">
           <h5 class="titoletto din">Documenti</h5>
           <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
             <button class="btn piccolo" id="sc-copia">${tr("Copia percorso")}</button>
             <button class="btn piccolo" id="sc-collega">${RADICI.length ? tr("Cambia cartella") : tr("Collega cartella")}</button>
             <button class="btn piccolo tenue" id="sc-mostra-percorso">${tr("Percorso…")}</button>
           </div>
           <div class="campo" id="sc-box-percorso" hidden>
             <label for="sc-percorso">Percorso della cartella</label>
             <div style="display:flex;gap:6px">
               <input type="text" id="sc-percorso" class="mono" value="${esc(c.cartella||"")}">
               <button class="btn piccolo" id="sc-salva-percorso">${tr("Salva")}</button>
             </div>
             <span class="aiuto">${tr("Serve per aprire i file nel loro programma: il browser non lo sa da solo. Di norma si compone da sé.")}</span>
           </div>
           <div id="sc-doc"><div class="sc-vuoto">${tr("Cartella non collegata.")}
             <div class="nota" style="margin-top:6px">${tr("Il permesso di lettura scade quando chiudi la pagina: va ridato a ogni apertura.")}</div></div></div>
         </div>

         <div class="sc-sezione">
           <h5 class="titoletto din">Segnalazioni</h5>
           ${boxAvvisi}
         </div>

       </div>
     </div>

     <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--linea);display:flex;align-items:center;gap:10px;flex-wrap:wrap">
       <button class="btn" id="sc-tempi">Calcola il giorno ultimo di inizio</button>
       <span class="nota">${c.consegnaCliente ? tr('Risale dalla consegna concordata togliendo sviluppo interno e fornitura esterna.')
                                              : tr("Serve la consegna concordata: si imposta con “Modifica progetto”.")}</span>
     </div>
     <div id="sc-limiti"></div>`,
    `<button class="btn sinistra" id="sc-modifica">Modifica progetto</button>
     ${i.dal ? `<button class="btn" id="sc-piano">Vedi nel piano</button>` : ""}
     <button class="btn primario" id="sc-chiudi">Chiudi</button>`);
  document.querySelector(".finestra").classList.add("enorme");
  document.getElementById("sc-collega").onclick = ()=>collegaCartella(c);
  document.getElementById("sc-mostra-percorso").onclick = ()=>{
    const b = document.getElementById("sc-box-percorso");
    b.hidden = !b.hidden;
    if(!b.hidden){
      const campo = document.getElementById("sc-percorso");
      if(!campo.value) campo.value = percorsoDi(c);
      campo.focus();
    }
  };
  document.getElementById("sc-salva-percorso").onclick = ()=>{
    if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
    c.cartella = document.getElementById("sc-percorso").value.trim();
    imparaPrefisso(c, c.cartella);
    segnaModificato(); brindisi(tr("Percorso salvato"));
    disegnaCartella(c);
  };
  const bcp = document.getElementById("sc-copia");
  if(bcp) bcp.onclick = ()=>{
    const p = percorsoDi(c);
    if(p) copiaTesto(p); else brindisi(tr("Percorso non ancora noto"));
  };
  document.querySelector(".finestra").addEventListener("click", e=>{
    const v = e.target.closest("[data-vedi]");
    if(v) return mostraFile(c, v.dataset.vedi);
    const p = e.target.closest("[data-percorso]");
    if(p) return copiaTesto(p.dataset.percorso);
    const el = e.target.closest("[data-elimina]");
    if(el) return eliminaNota(c, parseInt(el.dataset.elimina, 10), el.dataset.testa);
    if(e.target.id === "sc-cambia-firma"){
      e.preventDefault();
      if(chiediAutore(true)) disegnaCartella(c);
      return;
    }
    if(e.target.id === "sc-crea-note") return creaFileNote(c);
    if(e.target.id === "sc-salva-nota"){
      const t = document.getElementById("sc-testo-nota");
      if(t && t.value.trim()) scriviNota(c, t.value);
    }
  });
  if(CARTELLE.has(c.id)) disegnaCartella(c);
  else if(RADICI.length) agganciaDaRadice(c).then(()=>disegnaCartella(c));
  document.getElementById("sc-tempi").onclick = ()=>{
    const box = document.getElementById("sc-limiti");
    const v = verificaTempi(c);
    if(!v){
      box.className = "avviso";
      box.innerHTML = `<b>${tr("Manca la consegna concordata")}</b>`
        + tr('Aprendo “Modifica progetto” puoi indicare la data di consegna concordata: da lì il pianificatore risale all\'ultimo giorno utile di inizio delle attività pianificate.');
      applicaLingua();
      return;
    }
    if(!v.lim){
      box.className = "avviso";
      box.innerHTML = `<b>${tr("Nessuna scadenza calcolabile")}</b>`
        + tr('La data limite si calcola dalle attività pianificate su questo progetto, ciascuna con la propria tipologia di sviluppo interno — non dal progetto stesso: aggiungine almeno una.');
      applicaLingua();
      return;
    }
    const L = v.lim;
    const rig = v.righe.map(r=>{
      const pz = persona(r.a.personaId);
      const g = pz ? gruppo(pz.gruppoId) : null;
      const tardi = r.ritardo != null && r.ritardo > 0;
      const tp = r.a.tipologiaId === "nessuna" ? tr("nessuno sviluppo interno")
               : tipologiaProdotto(tipologiaAttivita(r.a));
      return `<tr>
        <td>${pz?esc(pz.nome):"?"}<div class="nota">${g?esc(g.sigla):""}</div></td>
        <td class="num-cella mono">${r.a.oreTotali}</td>
        <td>${typeof tp === "string" ? tp : (tp ? esc(tp.nome) : `<span class="nota">${tr("non indicata")}</span>`)}
          <div class="nota mono">${tr("entro {0}", itData(r.lim.fineUfficio))}</div></td>
        <td class="mono">${r.e?itData(r.e.dal):"–"}</td>
        <td class="mono"${tardi?' style="color:var(--allarme);font-weight:700"':""}>${r.ultimo?itData(r.ultimo):tr("non ci sta")}</td>
        <td class="num-cella mono"${tardi?' style="color:var(--allarme);font-weight:700"':""}>${
          r.ritardo == null ? "–" : r.ritardo > 0 ? tr("+{0} gg", r.ritardo) : tr("{0} gg di margine", -r.ritardo)}</td></tr>`;
    }).join("") || `<tr><td colspan="6" style="color:var(--tenue);padding:12px">${tr("Nessuna attività pianificata: l'ultimo inizio si calcola quando inserisci il monte ore.")}</td></tr>`;

    box.className = "avviso";
    box.innerHTML = `<b>${tr("Date limite a ritroso dalla consegna")}</b>
      <p class="nota" style="margin:2px 0 8px">${tr("La più stretta fra le attività pianificate su questo progetto.")}</p>
      <table style="margin:8px 0"><tbody>
        <tr><th style="width:230px">${tr("Consegna concordata")}</th><td class="mono">${itData(L.consegna)}</td></tr>
        <tr><th>${tr("Sviluppo interno")}</th><td class="mono">${tr("− {0} gg", L.gProd)}${L.tip?" · "+esc(L.tip.nome):' · <span style="color:var(--allarme)">'+tr("tipologia non indicata")+"</span>"}</td></tr>
        <tr><th>${tr("Fornitura esterna (lead time maggiore)")}</th><td class="mono">${tr("− {0} gg", L.gForn)}${L.forn?" · "+esc(L.forn.nome):' · <span style="color:var(--allarme)">'+tr("tabella vuota")+"</span>"}</td></tr>
        ${L.marg?`<tr><th>${tr("Margine di sicurezza")}</th><td class="mono">${tr("− {0} gg lavorativi", L.marg)}</td></tr>`:""}
        <tr><th>${tr("Fine ufficio entro")}</th><td class="mono"><b>${itData(L.fineUfficio)}</b></td></tr>
      </tbody></table>
      <table><thead><tr><th>Persona</th><th class="num-cella">Ore</th><th>${tr("Sviluppo interno")}</th>
        <th>${tr("Inizio pianificato")}</th>
        <th>${tr("Ultimo inizio utile")}</th><th class="num-cella">${tr("Scarto")}</th></tr></thead><tbody>${rig}</tbody></table>
      <p class="nota" style="margin-top:10px">${tr("Ogni attività è valutata da sola, al ritmo con cui è pianificata. Se le lavorazioni devono seguirsi una dopo l'altra, l'inizio reale va anticipato di conseguenza.")}</p>
      ${v.sfora ? `<p style="margin:8px 0 0;color:var(--allarme)"><b>${tr("⚠ Il piano attuale finisce il {0}, ovvero {1} giorni oltre la data limite.", itData(v.finePiano), v.giorniOltre)}</b></p>` : ""}`;
    applicaLingua();
  };
  document.getElementById("sc-chiudi").onclick = chiudi;
  document.getElementById("sc-modifica").onclick = ()=>{
    if(!modificabile) return brindisi(tr("Attiva prima la modifica"));
    apriCommessa(c.id);
  };
  const bp = document.getElementById("sc-piano");
  if(bp) bp.onclick = ()=>{
    V.filtroCommessa = c.id;
    if(comboFiltro) comboFiltro.imposta(c.id, true);
    V.inizio = iso(inizioSettimana(d(i.dal)));
    V.vista = "piano";
    document.querySelectorAll(".scheda").forEach(x=>x.setAttribute("aria-selected", x.dataset.vista==="piano"));
    document.getElementById("da").value = V.inizio;
    chiudi(); rendi();
  };
}
