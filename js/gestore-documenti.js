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
   8sexies. GESTORE CARTELLE E NOTE COMMESSA
   ----------------------------------------------------------
   Due funzionalita' fisicamente intrecciate nel codice: la
   lettura/collegamento delle cartelle su disco e le note
   markdown della commessa condividono le stesse routine di
   rendering (disegnaCartella disegna insieme albero e note),
   quindi restano in un unico file invece di essere separate
   artificialmente.
   ========================================================== */

function dbApri(){
  return new Promise((ok, no)=>{
    let r;
    try{ r = indexedDB.open("pianificatore", 1); }catch(err){ return no(err); }
    r.onupgradeneeded = ()=>{ r.result.createObjectStore("mani"); };
    r.onsuccess = ()=>ok(r.result);
    r.onerror = ()=>no(r.error);
  });
}
async function ricordaRadici(){
  try{
    const db = await dbApri();
    await new Promise((ok,no)=>{
      const tx = db.transaction("mani","readwrite");
      tx.objectStore("mani").put(RADICI.slice(), "radici");
      tx.oncomplete = ok; tx.onerror = ()=>no(tx.error);
    });
  }catch(err){ /* nessun magazzino: si prosegue senza ricordo */ }
}
async function recuperaRadici(){
  let salvate = null;
  try{
    const db = await dbApri();
    salvate = await new Promise((ok,no)=>{
      const tx = db.transaction("mani","readonly");
      const q = tx.objectStore("mani").get("radici");
      q.onsuccess = ()=>ok(q.result || null); q.onerror = ()=>no(q.error);
    });
  }catch(err){ return; }
  if(!salvate || !salvate.length) return;
  for(const h of salvate){
    let stato = "prompt";
    try{ stato = await h.queryPermission({mode:"readwrite"}); }catch(err){ continue; }
    if(stato === "granted") aggiungiRadice(h); else RADICI_SOSPESE.push(h);
  }
  imparaPrefissiDaDati();
  aggiornaBottoneCartelle();
}
/* un clic solo: Windows chiede conferma, niente da rinavigare */
async function riprendiRadici(){
  const restano = [];
  for(const h of RADICI_SOSPESE){
    let stato = "denied";
    try{ stato = await h.requestPermission({mode:"readwrite"}); }catch(err){}
    if(stato === "granted") aggiungiRadice(h); else restano.push(h);
  }
  RADICI_SOSPESE = restano;
  imparaPrefissiDaDati();
  aggiornaBottoneCartelle();
  brindisi(RADICI.length ? tr("Collegamento ripreso") : tr("Permesso negato"));
}
/* riprende una sola cartella sospesa, invece di tutte insieme */
async function riprendiRadiceSingola(nome){
  const i = RADICI_SOSPESE.findIndex(r=>r.name===nome);
  if(i < 0) return;
  const h = RADICI_SOSPESE[i];
  let stato = "denied";
  try{ stato = await h.requestPermission({mode:"readwrite"}); }catch(err){}
  if(stato === "granted"){
    RADICI_SOSPESE.splice(i,1);
    aggiungiRadice(h);
    ricordaRadici();
    imparaPrefissiDaDati();
    aggiornaBottoneCartelle();
    brindisi(tr("Collegamento ripreso: {0}", h.name));
  }else{
    brindisi(tr("Permesso negato"));
  }
}
/* scollega una cartella archivio attiva: le commesse agganciate attraverso di
   lei perdono il collegamento (si ritrovano da sole se ricollegata, o da
   un'altra radice ancora presente) */
function rimuoviRadice(nome){
  const i = RADICI.findIndex(r=>r.name===nome);
  if(i < 0) return;
  RADICI.splice(i,1);
  for(const [id, dd] of DENTRO){
    if(dd.radice === nome){ CARTELLE.delete(id); DENTRO.delete(id); ALBERI.delete(id); }
  }
  ricordaRadici();
  aggiornaBottoneCartelle();
  brindisi(tr("Cartella scollegata: {0}", nome));
}
/* dimentica una cartella sospesa: sparisce dall'elenco e il browser non la
   riproporra' piu' al prossimo avvio (a differenza di "Riprendi", che serve
   quando la si vuole tenere) */
function dimenticaRadiceSospesa(nome){
  const i = RADICI_SOSPESE.findIndex(r=>r.name===nome);
  if(i < 0) return;
  RADICI_SOSPESE.splice(i,1);
  ricordaRadici();
  aggiornaBottoneCartelle();
  brindisi(tr("Cartella dimenticata: {0}", nome));
}
function azioneCartelle(){
  return (!RADICI.length && RADICI_SOSPESE.length) ? riprendiRadici() : collegaRadice();
}

const APRIBILI = {docx:"ms-word", doc:"ms-word", docm:"ms-word", rtf:"ms-word",
                  xlsx:"ms-excel", xls:"ms-excel", xlsm:"ms-excel",
                  pptx:"ms-powerpoint", ppt:"ms-powerpoint"};
const INTERNI  = ["md","txt","csv","log"];
const IMMAGINI = ["jpg","jpeg","png","gif","webp","bmp","svg"];

function estensione(n){ const i = n.lastIndexOf("."); return i < 0 ? "" : n.slice(i+1).toLowerCase(); }
function tipoFile(n){
  const e = estensione(n);
  if(INTERNI.includes(e)) return "interno";
  if(IMMAGINI.includes(e)) return "immagine";
  if(APRIBILI[e]) return "office";
  if(e === "pdf") return "pdf";
  return "altro";
}
function unisciPercorso(base, rel){
  base = (base || "").replace(/[\\/]+$/, "");
  if(!base) return "";
  return rel ? base + "\\" + rel.replace(/\//g, "\\") : base;
}
// da "F:\a b\c.docx" a "file:///F:/a%20b/c.docx" ; da "\\srv\c" a "file://///srv/c"
function aUri(p){
  if(!p) return "";
  const s = p.replace(/\\/g, "/");
  /* encodeURI lascia passare # e ?, che in un indirizzo troncano il percorso */
  const cod = x => encodeURI(x).replace(/#/g, "%23").replace(/\?/g, "%3F");
  return s.startsWith("//")
    ? "file://///" + cod(s.replace(/^\/+/, ""))
    : "file:///" + cod(s);
}
function collegamentoApri(base, rel, nome){
  if(!base) return "";
  const p = unisciPercorso(base, rel);
  const t = tipoFile(nome);
  if(t === "office") return APRIBILI[estensione(nome)] + ":ofe|u|" + aUri(p);
  if(t === "pdf") return aUri(p);
  return "";
}
/* Cerca la cartella della commessa dentro la radice: prima fra le cartelle
   di primo livello, poi dentro ciascuna di esse. Due livelli bastano per la
   struttura "Commesse / intervallo / commessa" e non si scende oltre, per
   non trasformare l'apertura di una scheda in una scansione del disco. */
/* Il numero deve combaciare per intero: "8015" non deve agganciare "801512".
   Dopo il numero ci puo' essere solo un separatore, non un'altra cifra. */
function nomeCorrisponde(nome, numero){
  const n = (nome || "").trim();
  if(!n.toLowerCase().startsWith(numero.toLowerCase())) return false;
  const dopo = n.charAt(numero.length);
  return dopo === "" || !/[0-9]/.test(dopo);
}

async function cercaCartella(radice, numero){
  if(!radice || !numero) return null;
  const primi = [];
  try{
    for await (const v of radice.values()){
      if(v.kind !== "directory" || v.name.startsWith(".")) continue;
      if(nomeCorrisponde(v.name, numero)) return {handle:v, dentro:""};
      primi.push(v);
    }
  }catch(err){ return null; }
  for(const p of primi){
    try{
      for await (const v of p.values()){
        if(v.kind === "directory" && nomeCorrisponde(v.name, numero))
          return {handle:v, dentro:p.name};
      }
    }catch(err){}
  }
  return null;
}

/* cerca la commessa in tutte le cartelle archivio collegate, in ordine */
async function agganciaDaRadice(c){
  if(!RADICI.length || !c || !c.numero) return false;
  for(const r of RADICI){
    const trovata = await cercaCartella(r, c.numero.trim());
    if(trovata){
      CARTELLE.set(c.id, trovata.handle);
      DENTRO.set(c.id, {radice:r.name, dentro:trovata.dentro});
      return true;
    }
  }
  return false;
}
/* aggiunge una cartella archivio; se ne era gia' collegata una con lo stesso
   nome la sostituisce, cosi' ricollegare non moltiplica le voci */
function aggiungiRadice(h){
  const i = RADICI.findIndex(r=>r.name === h.name);
  if(i >= 0) RADICI[i] = h; else RADICI.push(h);
}

/* Il browser non rivela il percorso: si conosce solo il nome delle cartelle.
   Il pezzo iniziale (il disco) si impara la prima volta che l'utente salva un
   percorso a mano, e da li' in poi si propone da solo. */
/* coda del percorso: intervallo (se c'e') piu' nome della cartella commessa */
function codaDi(c){
  const h = CARTELLE.get(c.id);
  if(!h) return "";
  const d = DENTRO.get(c.id) || {};
  return (d.dentro ? d.dentro + "\\" : "") + h.name;
}
function percorsoProposto(c){
  const coda = codaDi(c);
  if(!coda) return "";
  const d = DENTRO.get(c.id) || {};
  const pre = d.radice ? PREFISSI.get(d.radice) : "";
  return pre ? pre + "\\" + coda : (d.radice ? d.radice + "\\" + coda : coda);
}
/* dal percorso salvato si ricava il pezzo iniziale, togliendo la coda nota.
   Vale solo per la radice in cui questa commessa e' stata trovata: archivi
   diversi hanno percorsi diversi e non devono contaminarsi. */
function imparaPrefisso(c, percorso){
  const coda = codaDi(c);
  const d = DENTRO.get(c.id) || {};
  if(!coda || !percorso || !d.radice) return;
  const fine = "\\" + coda;
  if(percorso.toLowerCase().endsWith(fine.toLowerCase()))
    PREFISSI.set(d.radice, percorso.slice(0, percorso.length - fine.length));
}

/* Basta che una commessa per archivio abbia il percorso salvato: da quella si
   ricava il pezzo iniziale e tutte le altre dello stesso archivio si compongono
   da sole, senza salvare niente in dati.js. */
function imparaPrefissiDaDati(){
  for(const r of RADICI){
    if(PREFISSI.get(r.name)) continue;
    const n = r.name.toLowerCase();
    for(const c of S.commesse){
      if(!c.cartella) continue;
      /* confronto per segmenti: "COMMESSE" non deve agganciarsi a "COMMESSE_OLD" */
      const parti = c.cartella.split("\\");
      const i = parti.map(s=>s.trim().toLowerCase()).lastIndexOf(n);
      if(i >= 0){ PREFISSI.set(r.name, parti.slice(0, i + 1).join("\\")); break; }
    }
  }
}
/* il percorso valido per questa commessa: quello salvato, oppure quello composto */
function percorsoDi(c){
  if(c.cartella) return c.cartella;
  const d = DENTRO.get(c.id) || {};
  return d.radice && PREFISSI.get(d.radice) ? percorsoProposto(c) : "";
}

function daQuanto(ms){
  if(!ms) return "";
  const g = Math.max(0, Math.floor((Date.now() - ms) / 86400000));
  return new Intl.RelativeTimeFormat(lingua, {numeric:"auto"}).format(-g, "day");
}

/* lettura ricorsiva, fermata a 3 livelli per non impantanarsi su cartelle enormi */
async function leggiAlbero(dir, prof, base, piatto){
  const nodi = [];
  for await (const voce of dir.values()){
    if(voce.name.startsWith("~$") || voce.name.startsWith(".")) continue;
    const rel = base ? base + "/" + voce.name : voce.name;
    if(voce.kind === "directory"){
      nodi.push({tipo:"cartella", nome:voce.name, rel,
                 figli: prof > 0 ? await leggiAlbero(voce, prof - 1, rel, piatto) : []});
    }else{
      let f = null;
      try{ f = await voce.getFile(); }catch(err){}
      const n = {tipo:"file", nome:voce.name, rel, handle:voce,
                 quando: f ? f.lastModified : 0};
      piatto.set(rel, n);
      nodi.push(n);
    }
  }
  nodi.sort((a,b)=> a.tipo !== b.tipo ? (a.tipo === "cartella" ? -1 : 1)
                                      : a.nome.localeCompare(b.nome));
  return nodi;
}

function disegnaAlbero(nodi, base, liv){
  if(!nodi.length) return `<div class="nota" style="padding:4px 0">${tr("Cartella vuota.")}</div>`;
  return nodi.map(n=>{
    if(n.tipo === "cartella"){
      return `<details ${liv === 0 ? "open" : ""}><summary>${esc(n.nome)}
        <span class="nota">${n.figli.length} ${n.figli.length === 1 ? tr("elemento") : tr("elementi")}</span></summary>
        <div class="alb-figli">${disegnaAlbero(n.figli, base, liv + 1)}</div></details>`;
    }
    const t = tipoFile(n.nome);
    const link = collegamentoApri(base, n.rel, n.nome);
    let azione = "";
    if(t === "interno" || t === "immagine")
      azione = `<button class="btn piccolo" data-vedi="${esc(n.rel)}">${tr("Apri")}</button>`;
    else if(link)
      azione = `<a class="btn piccolo" href="${link}"${t === "pdf" ? ' target="_blank"' : ""}>${tr("Apri")}</a>`;
    else if(base)
      azione = `<button class="btn piccolo tenue" data-percorso="${esc(unisciPercorso(base, n.rel))}">${tr("Percorso")}</button>`;
    return `<div class="alb-riga">
      <span class="alb-nome mono">${esc(n.nome)}</span>
      <span class="nota alb-quando">${daQuanto(n.quando)}</span>
      ${azione}</div>`;
  }).join("");
}

/* --- note dentro il file appunti --- */
function trovaAppunti(piatto){
  let scelto = null;
  piatto.forEach((n, rel)=>{
    if(rel.includes("/")) return;                       // solo nella radice della commessa
    const e = estensione(n.nome);
    if(e !== "md" && e !== "txt") return;
    if(!/appunti|note|notes/i.test(n.nome)) return;
    if(!scelto || e === "md") scelto = n;
  });
  return scelto;
}
function leggiNote(testo){
  const voci = [];
  (testo || "").split(/\r?\n/).forEach((riga, n)=>{
    const m = riga.match(/^###\s+(\d{4}-\d{2}-\d{2})\s*·\s*(.+?)\s*$/);
    if(m){ voci.push({quando:m[1], chi:m[2], testo:"", da:n, riga:riga}); }
    else if(voci.length && !/^#{1,6}\s/.test(riga)){
      const v = voci[voci.length - 1];
      v.testo = (v.testo + "\n" + riga).trim();
    }
  });
  return voci.reverse();                                 // la piu' recente in alto
}
function disegnaNote(voci){
  if(!voci.length) return `<div class="nota">${tr("Nessuna nota nel file appunti.")}</div>`;
  return voci.map(v=>`<div class="sc-nota-voce">
      <div class="quando">
        <div class="mono">${esc(v.quando)}</div>
        <div class="chi">${esc(v.chi)}</div>
      </div>
      <div class="testo-nota">${esc(v.testo).replace(/\n/g, "<br>")}</div>
      <button class="btn-x" data-elimina="${v.da}" data-testa="${esc(v.riga)}"
        title="${tr("Elimina questa nota")}" aria-label="${tr("Elimina questa nota")}">✕</button>
    </div>`).join("");
}

/* ---------- azioni ---------- */
/* Collegamento della cartella grande dalla barra: vale per tutta la
   sessione e per tutte le commesse. Va rifatto a ogni apertura della
   pagina, perche' il permesso non e' memorizzabile. */
async function collegaRadice(){
  if(!window.showDirectoryPicker)
    return alert(tr("Questo browser non sa leggere le cartelle. Servono Chrome o Edge."));
  let h;
  try{ h = await window.showDirectoryPicker({mode:"readwrite", id:"commesse"}); }
  catch(err){ return; }
  aggiungiRadice(h);
  ricordaRadici();
  imparaPrefissiDaDati();
  aggiornaBottoneCartelle();
  brindisi(tr("Cartelle collegate: {0}", h.name));
}
function aggiornaBottoneCartelle(){
  const b = document.getElementById("btn-cartelle");
  if(!b) return;
  const sospese = !RADICI.length && RADICI_SOSPESE.length;
  b.classList.toggle("primario", !!sospese);
  b.textContent = RADICI.length ? tr("Cartelle: {0}", RADICI.map(r=>r.name).join(", "))
                : sospese      ? tr("Riprendi cartelle")
                               : tr("Collega cartelle");
  b.title = RADICI.length ? tr("Collegate in questa sessione. Premi per aggiungerne un'altra.")
          : sospese      ? tr("Le cartelle di ieri sono ricordate: un clic per riprenderle.")
                         : tr("Collega la cartella che contiene tutti i progetti");
}

async function collegaCartella(c){
  if(!window.showDirectoryPicker){
    alert(tr("Questo browser non sa leggere le cartelle. Servono Chrome o Edge."));
    return;
  }
  let h;
  try{ h = await window.showDirectoryPicker({mode:"readwrite", id:"commesse"}); }
  catch(err){ return; }                                  // annullato dall'utente

  const num = (c.numero || "").trim();
  if(num && nomeCorrisponde(h.name, num)){
    CARTELLE.set(c.id, h); DENTRO.set(c.id, {radice:"", dentro:""});  // hai scelto proprio questa commessa
  }else{
    aggiungiRadice(h);                                   // hai scelto una cartella archivio
    ricordaRadici();
    imparaPrefissiDaDati();
    aggiornaBottoneCartelle();
    const box = document.getElementById("sc-doc");
    if(box) box.innerHTML = `<div class="nota">${tr("Cerco {0} dentro {1}…", esc(num), esc(h.name))}</div>`;
    /* scelta esplicita: si cerca SOLO qui dentro, altrimenti una cartella
       collegata prima potrebbe rispondere al posto di quella appena scelta */
    CARTELLE.delete(c.id); DENTRO.delete(c.id); ALBERI.delete(c.id);
    const trovata = await cercaCartella(h, num);
    if(trovata){
      CARTELLE.set(c.id, trovata.handle);
      DENTRO.set(c.id, {radice:h.name, dentro:trovata.dentro});
    }else{
      brindisi(tr("Dentro {0} non trovo nessuna cartella che inizi per {1}", h.name, num));
    }
  }
  await disegnaCartella(c);
}

async function disegnaCartella(c){
  const boxDoc = document.getElementById("sc-doc");
  const boxNote = document.getElementById("sc-note");
  const h = CARTELLE.get(c.id);
  if(!boxDoc) return;
  if(!h){
    boxDoc.innerHTML = `<div class="sc-vuoto">${tr("Cartella non collegata.")}
      <div class="nota" style="margin-top:6px">${RADICI.length
        ? tr("Dentro {0} non trovo nessuna cartella che inizi per {1}", esc(RADICI.map(r=>r.name).join(", ")), esc(c.numero||""))
        : tr("Collega una volta sola la cartella che contiene tutti i progetti: i singoli si trovano da soli.")}</div></div>`;
    return;
  }
  imparaPrefissiDaDati();
  const base = percorsoDi(c);
  boxDoc.innerHTML = `<div class="nota">${tr("Lettura in corso…")}</div>`;
  const piatto = new Map();
  let albero;
  try{ albero = await leggiAlbero(h, 2, "", piatto); }
  catch(err){
    boxDoc.innerHTML = `<div class="sc-avviso"><span>⚠</span><span>${tr("Non riesco a leggere la cartella: ")}${esc(err.message)}</span></div>`;
    return;
  }
  ALBERI.set(c.id, piatto);

  const dove = (DENTRO.get(c.id) || {}).dentro;
  boxDoc.innerHTML = `<div class="alb-radice mono">${esc(h.name)}</div>
    ${dove ? `<div class="nota" style="margin:-2px 0 6px">${tr("in {0}", esc(dove))}</div>` : ""}
    <div class="albero">${disegnaAlbero(albero, base, 0)}</div>
    ${base ? "" : `<div class="nota" style="margin-top:8px">${
      tr("Senza percorso i file Office e PDF non si possono aprire: salvalo su un progetto qualsiasi e gli altri si compongono da soli.")}</div>`}`;

  const campo = document.getElementById("sc-percorso");
  if(campo && !campo.value) campo.value = percorsoProposto(c);

  /* note */
  if(boxNote){
    const f = trovaAppunti(piatto);
    if(!f){
      boxNote.innerHTML = `<div class="sc-vuoto">${tr("Nessun file appunti nella cartella.")}
        <div style="margin-top:8px"><button class="btn piccolo" id="sc-crea-note">${tr("Crea il file note")}</button></div></div>`;
    }else{
      let testo = "";
      try{ testo = await (await f.handle.getFile()).text(); }catch(err){}
      boxNote.innerHTML = `<div class="nota" style="margin-bottom:6px">${esc(f.nome)}</div>
        <div class="sc-note-elenco">${disegnaNote(leggiNote(testo))}</div>
        <div class="sc-nuova-nota">
          <textarea id="sc-testo-nota" rows="2" placeholder="${tr("Aggiungi una nota…")}"></textarea>
          <button class="btn primario" id="sc-salva-nota">${tr("Salva")}</button>
        </div>
        <div class="nota" style="margin-top:4px">${
          AUTORE ? tr("Firmi come {0}", esc(AUTORE)) : tr("La firma ti verrà chiesta al primo salvataggio")
        } · <a href="#" id="sc-cambia-firma">${tr("cambia")}</a></div>`;
    }
  }
  applicaLingua();
}

/* Aggiunge una nota in fondo al file appunti.
   Il file viene riletto un attimo prima di scrivere: se nel frattempo e'
   cambiato, la scrittura viene annullata invece di cancellare quello che
   ha scritto un collega. E se la lettura fallisce non si scrive MAI, per
   non sostituire un file intero con la sola nota nuova. */
async function scriviNota(c, testo){
  const h = CARTELLE.get(c.id);
  const piatto = ALBERI.get(c.id);
  if(!h || !piatto) return;
  if(!chiediAutore()) return;
  const f = trovaAppunti(piatto);
  let handle, vecchio = "";
  try{
    if(f){
      handle = f.handle;
      vecchio = await (await handle.getFile()).text();
    }else{
      handle = await h.getFileHandle(c.numero + " - NOTES.md", {create:true});
      vecchio = await (await handle.getFile()).text();   // vuoto se appena creato
    }
  }catch(err){
    return alert(tr("Non riesco a leggere il file appunti: la nota non è stata salvata.") + "\n" + err.message);
  }

  const blocco = "\n### " + iso(new Date()) + " · " + AUTORE + "\n" + testo.trim() + "\n";
  try{
    const controllo = await (await handle.getFile()).text();
    if(controllo !== vecchio){
      alert(tr("Qualcuno ha scritto nel file mentre stavi scrivendo: rileggo, la tua nota è ancora nella casella."));
      await disegnaCartella(c);
      return;
    }
    const w = await handle.createWritable();
    await w.write(vecchio.replace(/\s*$/, "") + "\n" + blocco);
    await w.close();
  }catch(err){
    return alert(tr("Non riesco a scrivere nel file appunti: ") + err.message);
  }
  brindisi(tr("Nota salvata nel file appunti"));
  await disegnaCartella(c);
}

async function creaFileNote(c){
  const h = CARTELLE.get(c.id); if(!h) return;
  try{
    const handle = await h.getFileHandle(c.numero + " - NOTES.md", {create:true});
    if((await handle.getFile()).size > 0){        // esisteva gia': non va svuotato
      brindisi(tr("Il file esiste già: lo rileggo"));
      return disegnaCartella(c);
    }
    const w = await handle.createWritable();
    await w.write("# " + c.numero + (c.cliente ? " · " + c.cliente : "") + "\n");
    await w.close();
    brindisi(tr("File note creato"));
    await disegnaCartella(c);
  }catch(err){ alert(tr("Non riesco a creare il file: ") + err.message); }
}

/* Toglie una nota dal file appunti. Il file viene riletto un attimo prima,
   cosi' se nel frattempo qualcun altro ci ha scritto ce ne accorgiamo invece
   di cancellare la riga sbagliata. Il resto del file non viene toccato. */
async function eliminaNota(c, da, attesa){
  const piatto = ALBERI.get(c.id);
  const f = piatto && trovaAppunti(piatto);
  if(!f) return;
  if(!confirm(tr("Elimino questa nota?") + "\n\n" + attesa)) return;

  /* riletto DOPO la conferma: nel frattempo un collega potrebbe aver scritto */
  let testo;
  try{ testo = await (await f.handle.getFile()).text(); }
  catch(err){ return alert(tr("Non riesco a leggere il file appunti: ") + err.message); }

  const crlf = testo.includes("\r\n");                  // si conserva il fine riga originale
  const righe = testo.split(/\r?\n/);
  if(righe[da] !== attesa){                             // non basta che sia "una" nota: dev'essere QUESTA
    alert(tr("Il file appunti è cambiato nel frattempo: lo rileggo, riprova."));
    return disegnaCartella(c);
  }
  let fine = da + 1;
  while(fine < righe.length && !/^#{1,6}\s/.test(righe[fine])) fine++;
  righe.splice(da, fine - da);
  try{
    const w = await f.handle.createWritable();
    await w.write(righe.join(crlf ? "\r\n" : "\n"));     // nessuna normalizzazione del resto del file
    await w.close();
  }catch(err){ return alert(tr("Non riesco a scrivere nel file appunti: ") + err.message); }
  brindisi(tr("Nota eliminata"));
  await disegnaCartella(c);
}

async function mostraFile(c, rel){
  const piatto = ALBERI.get(c.id);
  const n = piatto && piatto.get(rel);
  if(!n) return;
  let f;
  try{ f = await n.handle.getFile(); }
  catch(err){ return alert(tr("Non riesco ad aprire il file: ") + err.message); }
  if(tipoFile(n.nome) === "immagine"){
    const u = URL.createObjectURL(f);
    finestra(esc(n.nome), `<img src="${u}" style="max-width:100%;display:block">`,
      `<button class="btn primario" id="mf-chiudi">Chiudi</button>`);
    PULIZIA = ()=>URL.revokeObjectURL(u);        // vale anche con Esc o clic sullo sfondo
    document.querySelector(".finestra").classList.add("larga");
    document.getElementById("mf-chiudi").onclick = ()=>{ chiudi(); apriSchedaCommessa(c.id); };
  }else{
    const t = await f.text();
    finestra(esc(n.nome), `<pre class="mono testo-file">${esc(t)}</pre>`,
      `<button class="btn primario" id="mf-chiudi">Chiudi</button>`);
    document.querySelector(".finestra").classList.add("larga");
    document.getElementById("mf-chiudi").onclick = ()=>{ chiudi(); apriSchedaCommessa(c.id); };
  }
}

function copiaTesto(t){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(()=>brindisi(tr("Percorso copiato")),
                                          ()=>brindisi(t));
  }else{
    const a = document.createElement("textarea");
    a.value = t; document.body.appendChild(a); a.select();
    try{ document.execCommand("copy"); brindisi(tr("Percorso copiato")); }
    catch(err){ brindisi(t); }
    a.remove();
  }
}
