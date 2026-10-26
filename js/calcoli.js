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
Sviluppato da Paolo Cioli con il supporto dell'intelligenza artificiale.
Strumento di supporto alla gestione e al coordinamento dei team.

[EN] This program is free software: you can redistribute it and/or modify it
under the terms of the GNU Affero General Public License, version 3, as
published by the Free Software Foundation. See the LICENSE file. It is
distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY.
For uses the AGPL does not allow — such as embedding it in a proprietary
product or reselling it without releasing the source — a commercial licence
is available: see LICENZA-COMMERCIALE.md.
Developed by Paolo Cioli with the support of artificial intelligence.
A tool to support team management and coordination.
*/
"use strict";

/* ==========================================================
   4. CALCOLI
   ========================================================== */
// "generica" = Assenza in UI: per i casi straordinari (lutto, permesso studio o sindacale), con note
const TIPI_GIORNO = {ferie:"Ferie", permesso:"Permesso", generica:"Assenza", malattia:"Malattia",
                     smart:"Smart working", trasferta:"Trasferta"};
const SIGLE_GIORNO = {ferie:"Ferie", permesso:"Perm.", generica:"Ass.", malattia:"Mal.",
                      smart:"Smart", trasferta:"Trasferta"};
const FUORI_SEDE = ["smart","trasferta"];

/* Ore tolte da un'assenza (o da una trasferta) in ognuno dei suoi giorni: null = giornata intera,
   un numero = solo quelle ore. Ferie, permesso, assenza e trasferta possono essere l'una o l'altra;
   la malattia è sempre a giornata intera. Compatibilità: i vecchi permessi hanno sempre un numero
   (anche 0) e restano a ore; ferie salvate con 0 ore restano a giornata intera. */
function oreAssenza(a){
  if(a.tipo === "malattia" || a.ore == null) return null;
  if(a.tipo === "permesso") return +a.ore || 0;
  return a.ore > 0 ? +a.ore : null;
}
function vociGiorno(personaId, isoStr){
  return (S.assenze||[]).filter(a => a.personaId===personaId && isoStr>=a.dal && isoStr<=a.al);
}
// smart working e trasferta non sono "assenze" nel senso di assenzaGiorno/assenzaTotale: la loro
// riduzione di capacità (solo la trasferta ne ha una, vedi trasfertaGiorno) si calcola a parte
function assenzaGiorno(personaId, isoStr){
  const v = vociGiorno(personaId, isoStr).filter(a => !FUORI_SEDE.includes(a.tipo));
  // un'assenza a giornata intera vince su quelle a ore dello stesso giorno, qualunque sia l'ordine
  // di inserimento; più assenze a ore nello stesso giorno (permesso + assenza...) sommano le ore
  const intera = v.find(a => oreAssenza(a) == null);
  if(intera || v.length < 2) return intera || v[0] || null;
  return Object.assign({}, v[0], {ore: v.reduce((s, a) => s + oreAssenza(a), 0)});
}
// versione senza la guardia di assenzaTotale, per chi (assenzaTotale stessa, capacitaGiorno) deve
// poter interrogare una voce fuori sede senza innescare una chiamata circolare
function vociFuoriSedeGiorno(personaId, isoStr){
  return vociGiorno(personaId, isoStr).find(a => FUORI_SEDE.includes(a.tipo)) || null;
}
// lavoro fuori sede: lo smart working non incide mai sulle ore disponibili (si presume la persona
// stia comunque facendo lo stesso lavoro, solo da un altro posto); la trasferta sì, perché è
// un'attività diversa che sospende quella ordinaria — vedi trasfertaGiorno. La guardia blocca la
// fascia solo se la VERA assenza del giorno (ferie/malattia/permesso) occupa l'intera giornata:
// ferie e malattia sempre (sono sempre a giornata intera in questo modello), il permesso solo se
// le ore coprono tutto l'orario disponibile — un permesso di poche ore lascia il resto della
// giornata libero per lo smart working o la trasferta, che restano visibili. Non basta
// assenzaTotale() come guardia unica: per una trasferta a giornata intera senza nessun'altra vera
// assenza, assenzaTotale sarebbe vera SOLO a causa della trasferta stessa, e la fascia
// sparirebbe dal calendario invece di mostrarsi come tale.
function voceFuoriSede(personaId, isoStr){
  if(!eLavorativo(isoStr)) return null;
  const a = assenzaGiorno(personaId, isoStr);
  if(a){
    const o = oreAssenza(a);
    if(o == null || o >= capacitaPersonaGiorno(persona(personaId), isoStr)) return null;
  }
  return vociFuoriSedeGiorno(personaId, isoStr);
}
function tipoFuoriSede(personaId, isoStr){
  const v = voceFuoriSede(personaId, isoStr);
  return v ? v.tipo : null;
}
// la voce di trasferta del giorno, se c'è: null (o assente) l'ore significa tutta la giornata,
// un numero significa solo quelle ore — stessa idea del campo "ore" del permesso
function trasfertaGiorno(personaId, isoStr){
  const v = vociFuoriSedeGiorno(personaId, isoStr);
  return (v && v.tipo === "trasferta") ? v : null;
}
function inDeroga(personaId, isoStr){
  const v = voceFuoriSede(personaId, isoStr);
  return !!(v && v.tipo === "smart" && v.deroga);
}
function limiteSmart(p){
  const l = (p && p.smartMax != null) ? p.smartMax : S.config.smartMaxSettimana;
  return (l == null) ? 2 : l;
}
// giorni di smart ordinari della settimana: le trasferte e le deroghe eccezionali non contano
function smartDellaSettimana(personaId, isoStr){
  const lun = inizioSettimana(d(isoStr));
  const out = [];
  for(let i=0;i<7;i++){
    const k = iso(sommaGiorni(lun,i));
    const v = voceFuoriSede(personaId, k);
    if(v && v.tipo === "smart" && !v.deroga) out.push(k);
  }
  return out;
}
function smartOltreLimite(personaId, isoStr){
  const v = voceFuoriSede(personaId, isoStr);
  if(!v || v.tipo !== "smart" || v.deroga) return false;
  return smartDellaSettimana(personaId, isoStr).indexOf(isoStr) >= limiteSmart(persona(personaId));
}
// simulazione usata dalla finestra: quante giornate avrebbe la settimana salvando cosi'
function riepilogoSmart(personaId, dal, al, escludiId, comeDeroga){
  const lim = limiteSmart(persona(personaId));
  const nuovi = [];
  for(let k = d(dal); iso(k) <= al; k = sommaGiorni(k,1)){
    const s = iso(k);
    if(eLavorativo(s) && !assenzaTotale(personaId, s)) nuovi.push(s);
  }
  const settimane = Array.from(new Set(nuovi.map(s => iso(inizioSettimana(d(s)))))).sort();
  return settimane.map(lun=>{
    let ord = 0, der = 0;
    for(let i=0;i<7;i++){
      const s = iso(sommaGiorni(d(lun), i));
      if(!eLavorativo(s) || assenzaTotale(personaId, s)) continue;
      const v = vociGiorno(personaId, s).find(x => x.tipo === "smart" && x.id !== escludiId);
      if(v) v.deroga ? der++ : ord++;
    }
    const miei = nuovi.filter(s => iso(inizioSettimana(d(s))) === lun).length;
    if(comeDeroga) der += miei; else ord += miei;
    return {lun, ord, der, lim, sfora: ord > lim};
  });
}
function assenzaTotale(personaId, isoStr){
  // a ore: blocca il giorno solo se le ore coprono tutto l'orario della persona
  const copre = v => { const o = oreAssenza(v); return o == null || o >= capacitaPersonaGiorno(persona(personaId), isoStr); };
  const a = assenzaGiorno(personaId, isoStr);
  if(a) return copre(a);
  const t = trasfertaGiorno(personaId, isoStr);
  return t ? copre(t) : false;
}
// vincolo dell'attività: "inizio" = parte il, "fine" = consegna entro, "finestra" = dal…al ripartito
function modoAtt(a){ return a.modo || (a.scadenza ? "fine" : "inizio"); }
// ore di riunioni e formazione (S.eventi) di una persona in un giorno: impegni fissi, prendono le
// loro ore prima di ogni attività e restano anche oltre la capacità (il giorno risulta in sovraccarico)
/* L'elenco delle riunioni e formazioni dopo un salvataggio dall'editor. Nuova: si aggiunge.
   Esistente: cambia per tutti i partecipanti, oppure con "soloPer" (id di una persona) quella
   persona esce dalla voce comune e riceve una voce sua con i dati nuovi; gli altri restano com'erano. */
function eventiModificati(elenco, ev, dati, soloPer){
  if(!ev) return elenco.concat([Object.assign({}, dati, {id:nuovoId("e")})]);
  if(!soloPer) return elenco.map(x => x.id === ev.id ? Object.assign({}, x, dati) : x);
  return elenco.map(x => x.id === ev.id ? Object.assign({}, x, {personeIds: x.personeIds.filter(id => id !== soloPer)}) : x)
    .concat([Object.assign({}, dati, {id:nuovoId("e"), personeIds:[soloPer]})]);
}
function oreEventi(personaId, isoStr){
  return (S.eventi||[]).reduce((s, e) => s + (e.giorno === isoStr && (e.personeIds||[]).includes(personaId) ? (+e.ore||0) : 0), 0);
}
// giorni realmente lavorabili da una persona fra due date, estremi compresi
function giorniUtili(personaId, dal, al){
  const out = [];
  if(!dal || !al || al < dal) return out;
  let cur = d(dal), giri = 0;
  while(iso(cur) <= al && giri++ < 3000){
    const k = iso(cur);
    if(eLavorativo(k) && !assenzaTotale(personaId, k)) out.push(k);
    cur = sommaGiorni(cur, 1);
  }
  return out;
}
// ore al giorno effettive: nella modalità finestra sono ricavate, non digitate
function orePerGiornoEff(a){
  if(modoAtt(a) === "finestra"){
    const gg = giorniUtili(a.personaId, a.dataInizio, a.scadenza);
    return gg.length ? (a.oreTotali||0)/gg.length : 0;
  }
  return a.orePerGiorno != null ? a.orePerGiorno : capacitaPersonaGiorno(persona(a.personaId), a.dataInizio);
}
// distribuisce le ore di un'attività sui giorni utili come se fosse l'unica della persona:
// è la base della modalità finestra in simulaPersona()
function distribuzioneIsolata(a){
  const mappa = new Map();
  const p = persona(a.personaId);
  if(!p) return mappa;
  const modo = modoAtt(a);
  // chiusura anticipata (fatta) o sospensione (sospesa): le ore oltre quel giorno non sono
  // più impegnate. Stesso meccanismo di dataFine per entrambe: la sospensione non implica
  // fatta (l'attività non è conclusa, solo in pausa) — vedi assegnazioni[].sospesa in CLAUDE.md
  const limiteChiusura = ((a.fatta || a.sospesa) && a.dataFine) ? a.dataFine : null;
  // finestra: il monte ore si spalma in parti uguali sui giorni utili fra le due date
  if(modo === "finestra"){
    const gg = giorniUtili(a.personaId, a.dataInizio, a.scadenza);
    if(!gg.length) return mappa;
    const tot = Math.max(0, a.oreTotali||0);
    // ripartizione proporzionale alle ore disponibili: con giorni tutti uguali torna una divisione esatta,
    // con un sabato da mezza giornata quel giorno riceve la metà invece di sforare
    const pesi = gg.map(k => capacitaGiorno(a.personaId, k));
    const somma = pesi.reduce((x,y)=>x+y, 0);
    gg.forEach((k,i)=>{
      if(limiteChiusura && k > limiteChiusura) return;
      mappa.set(k, somma > 0 ? tot * pesi[i] / somma : tot / gg.length);
    });
    return mappa;
  }
  // orePerGiorno null significa "a tempo pieno": segue le ore della persona e si adegua se cambiano.
  // La partenza (a.dataInizio) resta sempre fissa qui, anche in modalita' "fine": non si ricalcola
  // mai a ritroso da sola quando cambiano ore/efficienza, altrimenti sposterebbe una data ormai
  // passata o gia' iniziata. Se il ritmo cala e il monte ore non ci sta piu' entro la scadenza, la
  // consegna scivola in avanti e lo segnala sforaConsegna: l'utente rivede l'attivita' a mano,
  // lo strumento non la ricorregge da solo. La partenza si ricalcola (partenzaDaScadenza) solo
  // quando l'utente la imposta esplicitamente nell'editor (vedi risolviInizio in finestre-modali.js).
  let inizio = a.dataInizio;
  let resto = Math.max(0, a.oreTotali||0);
  let cur = d(inizio);
  let giri = 0;
  const limite = limiteChiusura;
  while(resto > 0.001 && giri < 2000){
    const k = iso(cur);
    if(limite && k > limite) break;
    if(eLavorativo(k) && !assenzaTotale(a.personaId,k)){
      const q = Math.min(quotaGiorno(a.personaId, k, a.orePerGiorno), resto);
      mappa.set(k, q);
      resto -= q;
    }
    cur = sommaGiorni(cur,1);
    giri++;
  }
  return mappa;
}
/* ----------------------------------------------------------
   Più attività della stessa persona nello stesso giorno.
   Le ore ordinarie di un giorno non superano mai la capacità della persona (capacitaGiorno):
   le attività se le dividono, e quelle che restano senza ore si allungano. Due classi:
   - brevi (prioritaria): in nessun giorno chiedono più della soglia "attività brevi"
     (config.sogliaBreve, default 50%) delle ore nominali del giorno — un'attività di un
     giorno con poche ore, o un ritmo fissato basso (deroga, finestra). Prendono le loro ore
     per prime, in ordine di partenza; se non ci stanno, il resto slitta al giorno dopo;
   - le altre si dividono in parti uguali le ore rimaste, ciascuna senza superare il proprio
     ritmo (deroga/finestra) né il proprio residuo; quello che a una non serve passa alle
     altre (nessuna prevale);
   Overtime (S.overtime, deciso giorno per giorno dall'utente, mai per attività): in quel giorno
   la capacità della persona sale a capacità × (1 + config.overtimeMax), default 0%
   (overtime non previsto); le attività se ne dividono le ore con le stesse regole di sempre.
   Il giorno con overtime risulta comunque oltre il limite (capacitaGiorno resta quella
   ordinaria), come promemoria. Le ore che non ci stanno slittano.
   ---------------------------------------------------------- */
function primoGiornoUtile(personaId, dal){
  let cur = d(dal);
  for(let giri = 0; giri < 400; giri++){
    const k = iso(cur);
    if(eLavorativo(k) && !assenzaTotale(personaId, k)) return k;
    cur = sommaGiorni(cur, 1);
  }
  return dal;
}
// soglia "attività breve" e tetto di overtime, entrambi in frazione (0.5 = 50%)
function sogliaBreve(){
  const v = S.config.sogliaBreve;
  return (v != null && v >= 0) ? v : 0.5;
}
function overtimeMax(){
  const v = S.config.overtimeMax;
  return (v != null && v > 0) ? v : 0;
}
// overtime deciso per quella persona in quel giorno (S.overtime: {id, personaId, giorno})
function haOvertime(personaId, k){
  return (S.overtime || []).some(o => o.personaId === personaId && o.giorno === k);
}
// aggiunge l'overtime ai giorni indicati (quelli già presenti si saltano) e restituisce la
// funzione che lo toglie di nuovo: serve a provare l'effetto prima che l'utente confermi
function aggiungiOvertime(personaId, giorni){
  const nuovi = Array.from(new Set(giorni)).filter(k => !haOvertime(personaId, k)).map(k => ({id:nuovoId("o"), personaId, giorno:k}));
  S.overtime = (S.overtime || []).concat(nuovi); invalida();
  return () => { S.overtime = S.overtime.filter(o => !nuovi.includes(o)); invalida(); };
}
// giorni in cui, passando da "prima" a "dopo" (due distribuzioni complete: id -> iso -> ore),
// un'attività aperta della persona perde ore e non è già in overtime: sono i giorni dove un
// overtime evita lo slittamento. "tranne" è l'id dell'attività che si sta modificando: i giorni
// che lascia liberi spostandola non sono conflitti
function giorniDaRecuperare(personaId, prima, dopo, tranne){
  const out = new Set();
  S.assegnazioni.forEach(x=>{
    if(x.personaId !== personaId || x.fatta || x.sospesa || x.id === tranne) return;
    const n = dopo.get(x.id);
    (prima.get(x.id) || new Map()).forEach((ore, k)=>{
      if((((n && n.get(k)) || 0) < ore - 0.001) && !haOvertime(personaId, k)) out.add(k);
    });
  });
  return Array.from(out).sort();
}
// ore al giorno che l'attività chiede per ritmo, se ne ha uno fissato (deroga o media della
// finestra); null = a tempo pieno, chiede tutto quello che resta
function ritmoFissato(a){
  if(modoAtt(a) === "finestra") return orePerGiornoEff(a);
  return a.orePerGiorno != null ? a.orePerGiorno : null;
}
// breve = in nessun giorno chiede più della soglia delle ore nominali di quel giorno
// (ore nominali, prima dell'efficienza: "metà di una giornata da 8 h" sono 4 h)
function sogliaOre(a){
  const k = primoGiornoUtile(a.personaId, a.dataInizio);
  return sogliaBreve() * capacitaPersonaGiorno(persona(a.personaId), k) + 0.001;
}
// breve "davvero": poche ore in tutto, indipendentemente dal ritmo — passa avanti anche a chi chiude
function cortaInOre(a){ return (a.oreTotali||0) <= sogliaOre(a); }
function prioritaria(a){
  const ritmo = ritmoFissato(a);
  return ritmo != null ? ritmo <= sogliaOre(a) : cortaInOre(a);
}
// distribuzioni di tutte le attività di una persona, prese da "elenco" (di solito
// S.assegnazioni, o una sua copia con una modifica non ancora salvata): id -> (iso -> ore)
function simulaPersona(personaId, elenco){
  const out = new Map();
  const att = [];
  const esiste = !!persona(personaId);
  elenco.forEach(a=>{
    if(a.personaId !== personaId) return;
    const m = new Map();
    out.set(a.id, m);
    if(!esiste || !a.dataInizio) return;
    // stessa chiusura anticipata/sospensione di distribuzioneIsolata: oltre dataFine niente ore
    const limite = ((a.fatta || a.sospesa) && a.dataFine) ? a.dataFine : null;
    // finestra: la ripartizione "ideale" è quella da sola; quello che non ci sta in un
    // giorno resta come debito per i giorni successivi
    const base = modoAtt(a) === "finestra"
      ? distribuzioneIsolata(Object.assign({}, a, {fatta:false, sospesa:false})) : null;
    const giorniBase = base ? Array.from(base.keys()).sort() : null;
    const inizio = base ? giorniBase[0] : a.dataInizio;
    if(!inizio || (limite && limite < inizio)) return;
    att.push({a, m, inizio, limite, base, fineBase: base ? giorniBase[giorniBase.length-1] : null,
              debito:0, resto:Math.max(0, a.oreTotali||0), prior: prioritaria(a), corta: cortaInOre(a)});
  });
  if(!att.length) return out;
  // ordine di precedenza delle brevi: chi parte prima; a pari data, l'ordine di inserimento
  const perPartenza = (x,y)=> x.inizio < y.inizio ? -1 : x.inizio > y.inizio ? 1 : 0;
  // a pari partenza le brevi vere (poche ore in tutto) passano davanti a chi è "breve" solo per il ritmo
  const prior = att.filter(x => x.prior).sort((x,y)=> perPartenza(x,y) || (y.corta - x.corta));
  const aperta = (x, k) => x.resto > 0.001 && !(x.limite && k > x.limite);
  // quanto vuole l'attività oggi: il ritmo della finestra (con il debito dei giorni in cui non
  // ci è stata), la deroga, oppure tutto il residuo se è a tempo pieno
  // a tempo pieno chiede al massimo una giornata ordinaria (ord): l'overtime di un giorno serve
  // a non far slittare le altre, non a far lavorare di più chi non ha conflitti
  const voglio = (x, k, ord) => {
    if(x.base){ x.debito += x.base.get(k) || 0; return Math.min(x.resto, k >= x.fineBase ? x.resto : x.debito); }
    return Math.min(x.resto, x.a.orePerGiorno != null ? x.a.orePerGiorno : ord);
  };
  const assegna = (x, k, q) => {
    if(q <= 0.001) return 0;
    x.m.set(k, q); x.resto -= q; if(x.base) x.debito = Math.max(0, x.debito - q);
    return q;
  };
  let cur = d(att.reduce((m,x)=> x.inizio < m ? x.inizio : m, att[0].inizio));
  for(let giri = 0; giri < 5000; giri++){
    const k = iso(cur);
    const vive = att.filter(x => x.inizio <= k && aperta(x, k));
    if(!vive.length){
      const prossime = att.filter(x => x.inizio > k && aperta(x, x.inizio)).map(x => x.inizio).sort();
      if(!prossime.length) break;
      cur = d(prossime[0]);
      continue;
    }
    if(eLavorativo(k) && !assenzaTotale(personaId, k)){
      // riunioni e formazione prima di tutto: le attività si dividono le ore che restano
      const ord = capacitaGiorno(personaId, k);
      const capPiena = ord * (haOvertime(personaId, k) ? 1 + overtimeMax() : 1);
      const ev = oreEventi(personaId, k), cap = Math.max(0, capPiena - ev);
      const desiderio = new Map(vive.map(x => [x, voglio(x, k, ord)]));
      let libere = cap;
      // chi oggi può chiudere (partita prima, il residuo ci sta) passa avanti a chi parte oggi, breve
      // o no: le nuove vengono servite per ultime e prendono tutte le ore rimaste, anche oltre il
      // loro ritmo (la persona non resta ferma), così la fine dell'altra non slitta
      const chiude = x => x.inizio < k && x.resto <= desiderio.get(x) + 0.001;
      const ultime = vive.some(chiude) ? vive.filter(x => x.inizio === k && !x.corta) : [];
      prior.forEach(x=>{
        if(!desiderio.has(x) || ultime.includes(x)) return;
        let q = Math.min(desiderio.get(x), libere);
        // una breve senza ritmo non si spezza: se oggi non ci sta intera ma in un giorno libero sì,
        // parte intera il giorno dopo (spezzarla costa più del tempo che serve a chiuderla).
        // shortcut: "giorno libero" = la capacità di oggi dopo le riunioni, non quella di un giorno qualunque
        if(x.corta && !x.base && ritmoFissato(x.a) == null && !x.m.size && q < desiderio.get(x) - 0.001 && x.resto <= cap + 0.001) q = 0;
        libere -= assegna(x, k, q);
      });
      // le altre si dividono il resto: in ordine di bisogno crescente, così chi ha bisogno di
      // meno della propria parte lascia la differenza alle successive
      const altre = vive.filter(x => !x.prior && !ultime.includes(x)).sort((x,y)=> desiderio.get(x) - desiderio.get(y));
      altre.forEach((x,i)=>{
        libere -= assegna(x, k, Math.min(desiderio.get(x), libere / (altre.length - i)));
      });
      ultime.sort((x,y)=> x.resto - y.resto).forEach((x,i)=>{
        libere -= assegna(x, k, Math.min(x.resto, libere / (ultime.length - i)));
      });
    }
    cur = sommaGiorni(cur, 1);
  }
  return out;
}
// l'elenco delle attività con "a" al posto della versione salvata (o in più, se è nuova)
function elencoConModifica(a){
  let trovata = false;
  const elenco = (S.assegnazioni || []).map(x => { if(x.id === a.id){ trovata = true; return a; } return x; });
  if(!trovata) elenco.push(a);
  return elenco;
}
// distribuzione di una singola attività, tenendo conto delle altre della stessa persona.
// "a" può essere una versione non ancora salvata (anteprima dell'editor, spostamenti di prova)
function distribuzione(a){
  return simulaPersona(a.personaId, elencoConModifica(a)).get(a.id) || new Map();
}
// confronto fra versioni "1.4.0": negativo se a < b, zero se uguali, positivo se a > b
function confrontaVersioni(a, b){
  const pa = String(a||"0").split(".").map(Number), pb = String(b||"0").split(".").map(Number);
  for(let i=0;i<3;i++){ const d = (pa[i]||0) - (pb[i]||0); if(d) return d; }
  return 0;
}
// dalla 1.4.0 le attività della stessa persona si dividono le ore (simulaPersona): un file
// salvato con una versione precedente può avere attività aperte che ora finiscono più tardi.
// Le elenca confrontando con il calcolo di prima (ogni attività da sola, distribuzioneIsolata)
const VERSIONE_RIPARTIZIONE = "1.4.0";
function slittamentiAggiornamento(){
  if(confrontaVersioni(S.meta && S.meta.versioneApp, VERSIONE_RIPARTIZIONE) >= 0) return [];
  const out = [];
  S.assegnazioni.forEach(a=>{
    if(a.fatta || a.sospesa) return;
    const e = estremi(a), m = distribuzioneIsolata(a);
    const prima = m.size ? Array.from(m.keys()).sort().pop() : null;
    if(e && prima && e.al > prima) out.push({a, prima, dopo:e.al});
  });
  return out.sort((u,v)=> u.prima < v.prima ? -1 : 1);
}
// attività aperte che, salvando "a" così, finirebbero più tardi di adesso: è quello che
// l'utente deve accettare (o evitare con l'overtime) prima che diventi definitivo
function slittamentiAltre(a){
  const dist = distribuzioni();
  const dopo = simulaPersona(a.personaId, elencoConModifica(a));
  const out = [];
  S.assegnazioni.forEach(x=>{
    if(x.id === a.id || x.personaId !== a.personaId || x.fatta) return;
    const fine = m => (m && m.size) ? Array.from(m.keys()).sort().pop() : null;
    const prima = fine(dist.get(x.id)), poi = fine(dopo.get(x.id));
    if(prima && poi && poi > prima) out.push({a:x, prima, dopo:poi});
  });
  return out.sort((u,v)=> u.prima < v.prima ? -1 : 1);
}
// pianificazione inversa: dalla scadenza risale al giorno di partenza
function partenzaDaScadenza(personaId, scadenza, oreTotali, orePerGiorno){
  const p = persona(personaId);
  if(!p || !scadenza || !(oreTotali > 0)) return null;
  // la risalita non deve mai proporre di lavorare oggi o nel passato: si ferma
  // al primo giorno lavorativo utile successivo a oggi, anche se le ore non
  // ci stanno piu' tutte (in quel caso segnala l'impossibilita' con null,
  // non sconfina in un giorno gia' passato)
  const limiteMinimo = giornoUtile(personaId, iso(new Date()));
  let resto = oreTotali, cur = d(scadenza), giri = 0, primo = null;
  while(resto > 0.001 && giri < 2000){
    const k = iso(cur);
    if(k < limiteMinimo) break;
    if(eLavorativo(k) && !assenzaTotale(personaId, k)){
      resto -= Math.min(quotaGiorno(personaId, k, orePerGiorno), resto);
      primo = k;
    }
    cur = sommaGiorni(cur, -1);
    giri++;
  }
  return resto > 0.001 ? null : primo;
}

let cacheDist = null;
function distribuzioni(){
  if(cacheDist) return cacheDist;
  cacheDist = new Map();
  new Set(S.assegnazioni.map(a => a.personaId)).forEach(pid=>
    simulaPersona(pid, S.assegnazioni).forEach((m, id) => cacheDist.set(id, m)));
  return cacheDist;
}
function invalida(){ cacheDist = null; svuotaCacheFest(); }

/* Ordine alfabetico dei nomi: localeCompare tiene conto di accenti e maiuscole.
   Locale del browser (undefined), non fisso "it": altrimenti nomi con accenti
   non italiani si ordinerebbero secondo regole non loro. */
function perNome(a, b){ return (a.nome||"").localeCompare(b.nome||"", undefined, {sensitivity:"base"}); }
function personeOrdinate(soloAttivi, perGruppo){
  const v = soloAttivi ? S.persone.filter(p=>p.attivo !== false) : S.persone.slice();
  if(!perGruppo) return v.sort(perNome);
  /* i gruppi restano nell'ordine deciso in Impostazioni, le persone in ordine
     alfabetico dentro ciascuno; chi non ha gruppo finisce in fondo */
  const pos = g => { const i = S.gruppi.findIndex(x=>x.id === g); return i < 0 ? 999 : i; };
  return v.sort((a,b)=> (pos(a.gruppoId) - pos(b.gruppoId)) || perNome(a,b));
}

// ore davvero disponibili quel giorno: ore nominali, meno le ore di permesso o trasferta (ore
// reali, non scalate), il tutto per il coefficiente di efficienza
function capacitaGiorno(personaId, isoStr){
  if(!eLavorativo(isoStr)) return 0;
  const p = persona(personaId);
  let cap = capacitaPersonaGiorno(p, isoStr);
  const a = assenzaGiorno(personaId, isoStr);
  if(a){
    // limite noto e accettato: permesso + trasferta lo stesso giorno sottrae solo le ore
    // del permesso, non anche quelle della trasferta (caso raro, non risolto per ora)
    const o = oreAssenza(a);
    cap = o == null ? 0 : Math.max(0, cap - o);
  } else {
    const t = trasfertaGiorno(personaId, isoStr);
    if(t){ const o = oreAssenza(t); cap = o == null ? 0 : Math.max(0, cap - o); }
  }
  // riunioni e formazione non si scalano con l'efficienza (come un permesso): contano a ore reali
  const ev = Math.min(oreEventi(personaId, isoStr), cap);
  return ev + (cap - ev) * efficienza();
}
// mappa personaId -> (iso -> ore assegnate)
function caricoPersone(){
  const dist = distribuzioni();
  const out = new Map();
  S.assegnazioni.forEach(a=>{
    if(!out.has(a.personaId)) out.set(a.personaId, new Map());
    const m = out.get(a.personaId);
    dist.get(a.id).forEach((ore,k)=> m.set(k, (m.get(k)||0) + ore));
  });
  // riunioni e formazione pesano sul carico come le attività
  (S.eventi||[]).forEach(e => (e.personeIds||[]).forEach(pid => {
    if(!out.has(pid)) out.set(pid, new Map());
    const m = out.get(pid);
    m.set(e.giorno, (m.get(e.giorno)||0) + (+e.ore||0));
  }));
  return out;
}

/* ----------------------------------------------------------
   Riassegnazioni suggerite: sposta la data (stessa persona) o la persona
   (stesse date), mai indietro nel tempo, mai in automatico. Non sceglie da
   sola: elenca le attività candidate di un giorno in sovraccarico, ordinate
   per margine, e propone dove/a chi ciascuna potrebbe spostarsi — la
   persona decide quale, se decide di spostarne una.
   ---------------------------------------------------------- */
// attività aperte della persona con ore quel giorno: quelle che una riassegnazione può spostare
function attivitaNelGiorno(personaId, isoGiorno){
  const dist = distribuzioni();
  return S.assegnazioni.filter(a => a.personaId === personaId && !a.fatta)
    .map(a => ({a, mappa:dist.get(a.id)}))
    .filter(x => x.mappa && (x.mappa.get(isoGiorno) || 0) > 0);
}
// attività della persona che occupano quel giorno, con margine (giorni prima del proprio
// limite: la scadenza dell'attività se c'è, altrimenti la data limite della commessa) e,
// se esistono, il primo spostamento di data in avanti e/o un collega sostituto
function candidatiRiassegnazione(personaId, isoGiorno){
  return attivitaNelGiorno(personaId, isoGiorno)
    .map(x => {
      const c = commessa(x.a.commessaId);
      const e = estremi(x.a);
      const lim = c ? limiteAttivita(c, x.a) : null;
      const limUff = lim && lim.fineUfficio;
      // se ci sono entrambe le date vince la più stretta: la scadenza forzata dell'attività
      // non deve mai mascherare una scadenza d'ufficio più vicina (e viceversa), altrimenti il
      // margine mostrato è ottimista e il PM sposta un'attività che in realtà è già a rischio
      const limite = (x.a.scadenza && limUff) ? (x.a.scadenza < limUff ? x.a.scadenza : limUff)
                   : (x.a.scadenza || limUff || null);
      const margine = (e && limite) ? diffGiorni(e.al, limite) : null;
      return {a:x.a, c, ore:x.mappa.get(isoGiorno), margine,
              spostamento: e ? provaSpostamento(x.a, x.mappa, margine) : null,
              sostituto: candidatiPersona(x.a, x.mappa)};
    })
    .sort((x,y) => x.margine == null ? -1 : y.margine == null ? 1 : y.margine - x.margine);
}
// un collega che potrebbe fare la stessa attività, stesse date: stesso gruppo (principale o
// "anche operativo in", nei due sensi) e stessa mansione della persona attuale, con ore libere
// ogni giorno che l'attività occupa. Senza una mansione sulla persona attuale non si propone
// nessuno: non c'è modo di sapere chi altro potrebbe farla.
function candidatiPersona(a, mappaAttuale){
  const attuale = persona(a.personaId);
  if(!attuale || !attuale.mansioneId) return null;
  const stessoGruppo = p => p.gruppoId === attuale.gruppoId
    || (attuale.gruppiExtra||[]).includes(p.gruppoId)
    || (p.gruppiExtra||[]).includes(attuale.gruppoId);
  const candidati = S.persone.filter(p => p.id !== attuale.id && p.attivo !== false
    && p.mansioneId === attuale.mansioneId && stessoGruppo(p)).sort(perNome);
  const carichi = caricoPersone();
  for(const p of candidati){
    const carico = carichi.get(p.id) || new Map();
    let ok = true;
    for(const [k, ore] of mappaAttuale){
      if((carico.get(k)||0) + ore > capacitaGiorno(p.id, k) + 0.001){ ok = false; break; }
    }
    if(ok) return p;
  }
  return null;
}
// prova a spostare tutta l'attività di 1, 2, 3... giorni (mai indietro) finché non trova il
// primo giorno che libera il sovraccarico senza superare il margine né crearne uno nuovo altrove
function provaSpostamento(a, mappaAttuale, margine){
  const tetto = margine != null ? Math.max(0, margine) : 90;   // tetto di sicurezza se non c'è un limite noto
  const carico = caricoPersone().get(a.personaId) || new Map();
  for(let n = 1; n <= tetto; n++){
    const copia = Object.assign({}, a, {
      dataInizio: iso(sommaGiorni(d(a.dataInizio), n)),
      scadenza: a.scadenza ? iso(sommaGiorni(d(a.scadenza), n)) : a.scadenza
    });
    const nuovaMappa = distribuzione(copia);
    if(!nuovaMappa.size) continue;
    const giorni = new Set([...mappaAttuale.keys(), ...nuovaMappa.keys()]);
    let ok = true;
    for(const k of giorni){
      const risultante = (carico.get(k)||0) - (mappaAttuale.get(k)||0) + (nuovaMappa.get(k)||0);
      if(risultante > capacitaGiorno(a.personaId, k) + 0.001){ ok = false; break; }
    }
    if(ok) return {dataInizio: copia.dataInizio};
  }
  return null;
}
// applica uno spostamento già trovato da provaSpostamento: stesso meccanismo del trascinamento
// del blocco nel calendario (sposta dataInizio e, se c'è, la scadenza di conseguenza)
// dipendenze: spostare in avanti un'attività a monte può farla finire dopo la partenza di
// quelle che dipendono da lei — prima di applicare si chiede, come nell'editor e nel Gantt
// (controllaSuccessive). Spostarla in avanti non può invece violare le sue precedenti.
async function applicaRiassegnazione(attivitaId, nuovaDataInizio){
  const a = S.assegnazioni.find(x=>x.id===attivitaId);
  if(!a) return;
  const n = diffGiorni(a.dataInizio, nuovaDataInizio);
  // provaSpostamento propone solo giorni che non creano sovraccarico
  const nuova = Object.assign({}, a, {dataInizio:nuovaDataInizio},
    a.scadenza ? {scadenza: iso(sommaGiorni(d(a.scadenza), n))} : {});
  const successive = await controllaSuccessive(nuova, true);
  if(successive === null) return;
  a.dataInizio = nuova.dataInizio;
  if(a.scadenza) a.scadenza = nuova.scadenza;
  invalida(); spostaSuccessive(successive); segnaModificato(); rendi();
  brindisi(tr("Attività spostata al {0}", itData(nuovaDataInizio)));
}
// sostituisce chi fa l'attività, stesse date: nessun altro campo cambia
// stesse date, ma il calendario del collega può farla finire più tardi: stesso controllo
async function applicaSostituzione(attivitaId, nuovaPersonaId){
  const a = S.assegnazioni.find(x=>x.id===attivitaId);
  const p = persona(nuovaPersonaId);
  if(!a || !p) return;
  // candidatiPersona propone solo un collega libero in quei giorni
  const successive = await controllaSuccessive(Object.assign({}, a, {personaId:nuovaPersonaId}), true);
  if(successive === null) return;
  a.personaId = nuovaPersonaId;
  invalida(); spostaSuccessive(successive); segnaModificato(); rendi();
  brindisi(tr("Attività riassegnata a {0}", p.nome));
}
// vero se la lavorazione finisce oltre la data di consegna registrata
function sforaConsegna(a){
  if(!a.scadenza) return false;
  const e = estremi(a);
  return !!(e && e.al > a.scadenza);
}
function estremi(a){
  const m = distribuzioni().get(a.id);
  if(!m || m.size===0) return null;
  const ch = Array.from(m.keys()).sort();
  return {dal:ch[0], al:ch[ch.length-1], ore:Array.from(m.values()).reduce((x,y)=>x+y,0)};
}
/* ----------------------------------------------------------
   Lead time e date limite.
   Catena a valle dell'ufficio:
   fine progettazione → approvvigionamento → produzione → consegna al cliente.
   ---------------------------------------------------------- */
// ogni voce ha un valore in giorni o settimane "di calendario": qui si riduce tutto a giorni
function giorniCalendario(v){ return Math.round(+v.valore * (v.unita === "giorni" ? 1 : 7)); }
function testoValoreLead(v){ return `${v.valore} ${tr(v.unita === "giorni" ? "gg" : "sett.")}`; }
// il calcolo usa la voce più lunga (in giorni di calendario equivalenti): è quella che detta i tempi
function leadFornituraMax(){
  const l = (S.config.leadFornitura||[]).filter(x => giorniCalendario(x) > 0);
  if(!l.length) return null;
  return l.reduce((m,x) => giorniCalendario(x) > giorniCalendario(m) ? x : m);
}
function tipologiaProdotto(id){ return (S.config.leadProduzione||[]).find(x=>x.id===id) || null; }
// arretra fino al primo giorno lavorativo utile (indietro nel tempo)
function ultimoLavorativo(isoStr){
  let cur = d(isoStr), giri = 0;
  while(giri++ < 400){ const k = iso(cur); if(eLavorativo(k)) return k; cur = sommaGiorni(cur,-1); }
  return isoStr;
}
// arretra di N giorni LAVORATIVI (salta weekend/festività/chiusure): usato per il margine di
// sicurezza, che è un cuscinetto dell'ufficio e segue il suo calendario di lavoro,
// non quello di calendario dei lead time — altrimenti un margine di 2gg impostato su una
// scadenza di lunedì verrebbe interamente "mangiato" dal weekend.
function indietroLavorativo(isoStr, n){
  let cur = d(isoStr);
  for(let i=0;i<n;i++){ do{ cur = sommaGiorni(cur,-1); }while(!eLavorativo(iso(cur))); }
  return iso(cur);
}
// data entro cui l'ufficio deve avere finito, risalendo dalla consegna concordata
function dateLimite(c){
  if(!c || !c.consegnaCliente) return null;
  const forn = leadFornituraMax();
  const senzaProd = c.tipologiaId === "nessuna";     // questa lavorazione non ha un suo sviluppo interno da contare
  const tip = senzaProd ? null : tipologiaProdotto(c.tipologiaId);
  // ogni tipologia di sviluppo interno decide se dipende anche dalla fornitura esterna
  // (richiedeFornitura, default true): "nessuna"/tipologia mancante non cambiano idea, si
  // comportano come prima (la fornitura esterna resta comunque nel calcolo)
  const usaForn = senzaProd || !tip || tip.richiedeFornitura !== false;
  const gForn = (forn && usaForn) ? giorniCalendario(forn) : 0;
  const gProd = tip ? giorniCalendario(tip) : 0;
  const marg = Math.max(0, +S.config.margineGiorni || 0);
  const grezza = iso(sommaGiorni(d(c.consegnaCliente), -(gForn + gProd)));
  const fineSenzaMargine = ultimoLavorativo(grezza);
  return {consegna:c.consegnaCliente, forn, tip, gForn, gProd, marg,
          fineUfficio: marg ? indietroLavorativo(fineSenzaMargine, marg) : fineSenzaMargine,
          senzaProd, mancaForn: usaForn && !forn, mancaTip:!tip && !senzaProd};
}
/* Una commessa può contenere lavorazioni diverse (più fasi di sviluppo interno,
   della documentazione) con tempi a valle diversi: la tipologia si indica sulla
   singola attività, non più a livello di commessa (nessun default ereditato). */
function tipologiaAttivita(a){
  return a ? a.tipologiaId : null;
}
/* Data limite di un'attività: quella della SUA tipologia, ristretta dalla catena di
   dipendenze a valle (vedi "Dipendenze fine-inizio" più sotto). Un'attività da cui ne
   dipende un'altra deve finire il giorno lavorativo prima dell'ultimo giorno utile per far
   partire quella successiva — altrimenti mostrerebbe una scadenza "falsa tranquilla" che non
   lascia il tempo alla catena. Solo calcolo: nessuna data salvata viene mai spostata.
   Campi in più rispetto a dateLimite(), solo se la catena stringe davvero:
   fineUfficioPropria (la data della sola tipologia), vincoloDa (l'attività successiva che
   detta la data), impossibile (quella successiva non rientra più nella sua data limite). */
function limiteAttivita(c, a, visti){
  const propria = dateLimite({consegnaCliente:c.consegnaCliente, tipologiaId:tipologiaAttivita(a)});
  if(!propria || !a) return propria;
  visti = new Set(visti || []);
  visti.add(a.id);
  let fine = propria.fineUfficio, vincoloDa = null, impossibile = false;
  successori(a).filter(b => !b.fatta && !b.sospesa && !visti.has(b.id)).forEach(b => {
    const lb = limiteAttivita(c, b, visti);
    if(!lb) return;
    const ub = lb.impossibile ? null : ultimoInizio(b, lb.fineUfficio);
    if(!ub){ if(!impossibile){ impossibile = true; vincoloDa = b; } return; }
    const entro = ultimoLavorativo(iso(sommaGiorni(d(ub), -1)));
    if(entro < fine){ fine = entro; if(!impossibile) vincoloDa = b; }
  });
  if(!vincoloDa) return propria;
  return Object.assign({}, propria, {fineUfficio:fine, fineUfficioPropria:propria.fineUfficio, vincoloDa, impossibile});
}

/* ----------------------------------------------------------
   Dipendenze fine-inizio fra attività (assegnazioni[].dipendeDa: id delle attività che
   devono essere finite prima che questa parta). Solo fra attività dello stesso progetto,
   niente cicli. Lo strumento segnala, non sposta: una sequenza violata produce solo un
   avviso, mai uno spostamento automatico dell'attività successiva (vedi CLAUDE.md).
   ---------------------------------------------------------- */
// le attività da cui "a" dipende: solo quelle che esistono ancora e stanno nel suo progetto
function predecessori(a, elenco){
  const tutte = elenco || S.assegnazioni;
  return ((a && a.dipendeDa) || []).map(id => tutte.find(x => x.id === id))
    .filter(x => x && x.id !== a.id && x.commessaId === a.commessaId);
}
// le attività che dipendono direttamente da "a"
function successori(a, elenco){
  return (elenco || S.assegnazioni).filter(x => x.id !== a.id && x.commessaId === a.commessaId
    && (x.dipendeDa || []).includes(a.id));
}
// id di tutte le attività coinvolte in almeno una dipendenza (icona nel Gantt)
function idsCollegati(){
  const s = new Set();
  S.assegnazioni.forEach(a => predecessori(a).forEach(p => { s.add(a.id); s.add(p.id); }));
  return s;
}
// tutte le attività che dipendono da quella con questo id, direttamente o lungo la catena
function discendenti(id, elenco){
  const tutte = elenco || S.assegnazioni;
  const visti = new Set(), coda = [id];
  while(coda.length){
    const cur = coda.shift();
    tutte.forEach(x => { if((x.dipendeDa || []).includes(cur) && !visti.has(x.id)){ visti.add(x.id); coda.push(x.id); } });
  }
  return visti;
}
// vero se far dipendere "id" da "predId" chiuderebbe un cerchio (A dopo B dopo A)
function creaCiclo(id, predId, elenco){
  return predId === id || discendenti(id, elenco).has(predId);
}
/* Riporta in ordine dipendeDa su tutte le attività: toglie id inesistenti, doppioni, sé
   stessa, attività di altri progetti (es. dopo un cambio di progetto) e i legami che
   chiuderebbero un ciclo (un dati.js scritto a mano). Un campo vuoto viene tolto, così un
   file senza dipendenze resta identico a prima. Modifica l'elenco ricevuto. */
function dipendenzeValide(elenco){
  const perId = new Map(elenco.map(a => [a.id, a]));
  const accettati = elenco.map(a => ({id:a.id, dipendeDa:[]}));
  elenco.forEach((a, i) => {
    (Array.isArray(a.dipendeDa) ? a.dipendeDa : []).forEach(pid => {
      const p = perId.get(pid);
      if(!p || p.id === a.id || p.commessaId !== a.commessaId) return;
      if(accettati[i].dipendeDa.includes(pid)) return;
      if(creaCiclo(a.id, pid, accettati)) return;
      accettati[i].dipendeDa.push(pid);
    });
  });
  elenco.forEach((a, i) => {
    if(accettati[i].dipendeDa.length) a.dipendeDa = accettati[i].dipendeDa;
    else delete a.dipendeDa;
  });
  return elenco;
}
/* Problemi di sequenza di un'attività che partirebbe il giorno "dal": le attività da cui
   dipende e che a quel punto non sono ancora finite. Un'attività annullata non si farà più e
   non blocca nessuno; una sospesa non è finita, quindi blocca sempre (le sue ore si fermano
   alla sospensione, la sua fine apparente non vuol dire che il lavoro sia fatto). */
function sequenzaViolata(a, dal){
  // come blocchiSequenza: un'attività conclusa o sospesa non ha più una partenza da controllare
  if(!a || !dal || a.fatta || a.sospesa) return [];
  return predecessori(a).filter(p => !p.annullata).map(p => {
    if(p.sospesa) return {p, sospesa:true};
    const e = estremi(p);
    return (e && e.al >= dal) ? {p, fine:e.al} : null;
  }).filter(Boolean);
}
// tutte le sequenze violate di un progetto, una riga per coppia (attività, predecessore)
function sequenzeViolateCommessa(c){
  const out = [];
  S.assegnazioni.filter(a => a.commessaId === c.id).forEach(a => {
    const e = estremi(a);
    if(!e) return;
    sequenzaViolata(a, e.dal).forEach(v => out.push(Object.assign({a, dal:e.dal}, v)));
  });
  return out;
}
/* Controlli al salvataggio (editor, trascinamento nel Gantt, anticipo dopo una chiusura).
   "nuova" è la versione non ancora salvata di un'attività (stesso id di quella salvata, come
   per distribuzione()): le date di tutte le attività coinvolte si calcolano come se fosse già
   salvata, perché con la stessa persona la ripartizione delle ore sposta anche le altre. */
// estremi di x se "nuova" prendesse il posto della versione salvata
function estremiConModifica(x, nuova){
  const m = simulaPersona(x.personaId, elencoConModifica(nuova)).get(x.id);
  if(!m || !m.size) return null;
  const ch = Array.from(m.keys()).sort();
  return {dal:ch[0], al:ch[ch.length-1]};
}
/* Le attività da cui "nuova" dipende che non le permettono di partire quando partirebbe:
   finiscono il giorno della sua partenza o dopo, oppure sono sospese (non finite). Una
   annullata non blocca nessuno. Un'attività conclusa o sospesa non viene controllata: non
   ha più una partenza da pianificare. Non vuoto = il salvataggio va bloccato. */
function blocchiSequenza(nuova){
  if(!nuova || nuova.fatta || nuova.sospesa) return [];
  const e = estremiConModifica(nuova, nuova);
  if(!e) return [];
  return predecessori(nuova).filter(p => !p.annullata).map(p => {
    if(p.sospesa) return {p, sospesa:true, dal:e.dal};
    const ep = estremiConModifica(p, nuova);
    return (ep && ep.al >= e.dal) ? {p, fine:ep.al, dal:e.dal} : null;
  }).filter(Boolean);
}
/* La stessa attività spostata in avanti al primo giorno utile dopo la fine di tutte quelle
   da cui dipende — è la proposta del pulsante "Parti il …", mai applicata da sola.
   "Parte il" sposta la partenza, il carico ripartito sposta la finestra intera; con
   "consegna entro il" la partenza la decide la consegna, quindi nessuna proposta (null),
   e nessuna nemmeno se una di quelle da cui dipende è sospesa (non ha una fine). */
function partenzaInSequenza(nuova){
  let cur = nuova;
  for(let giri = 0; giri < 10; giri++){
    const b = blocchiSequenza(cur);
    if(!b.length) return cur === nuova ? null : cur;
    if(b.some(x => x.sospesa) || modoAtt(cur) === "fine") return null;
    const fine = b.map(x => x.fine).sort().pop();
    const parti = giornoUtile(cur.personaId, fine);
    if(modoAtt(cur) === "finestra"){
      // la finestra si sposta intera, stessa durata: dal suo primo giorno con ore a "parti"
      const e = estremiConModifica(cur, cur);
      const delta = diffGiorni(e ? e.dal : cur.dataInizio, parti);
      cur = Object.assign({}, cur, {dataInizio: iso(sommaGiorni(d(cur.dataInizio), delta)),
                                    scadenza: iso(sommaGiorni(d(cur.scadenza), delta))});
    } else cur = Object.assign({}, cur, {dataInizio: parti});   // "Parte il": il giorno proposto, tale e quale
  }
  return null;
}
/* Le attività che dipendono da "nuova" e che, salvandola, partirebbero prima della sua
   nuova fine — solo quelle che oggi sono in regola: lo slittamento di un'attività a monte
   non si può vietare (è la realtà), ma va detto. Quelle già fuori sequenza prima della
   modifica sono già segnalate nel Gantt. */
function successoriScavalcati(nuova){
  const e = estremiConModifica(nuova, nuova);
  if(!e) return [];
  const prima = estremi(S.assegnazioni.find(x => x.id === nuova.id) || {id:null});
  return successori(nuova).filter(s => !s.fatta && !s.sospesa).map(s => {
    const es = estremiConModifica(s, nuova);
    if(!es || es.dal > e.al) return null;
    const ePrima = estremi(s);
    if(prima && ePrima && ePrima.dal <= prima.al) return null;   // era già fuori sequenza
    return {s, dal:es.dal, fine:e.al};
  }).filter(Boolean);
}
/* Annullare o sospendere un'attività da cui ne dipendono altre: tutta la catena a valle
   (direttamente o lungo la catena) ancora da fare, da proporre nel banner. Per l'annullamento
   contano anche le sospese (come annullando un progetto), per la sospensione no: sono già ferme.
   "piena" = dipende solo da "a", da altre attività della catena o da attività già risolte:
   proposta spuntata. Altrimenti "altri" elenca le attività aperte fuori dalla catena da cui
   dipende anche (va avanti per conto suo?): proposta a parte, non spuntata. */
function catenaAValle(a, perSospendere){
  const disc = discendenti(a.id);
  const risolta = p => p.fatta || (perSospendere && p.sospesa);
  const tutte = S.assegnazioni.filter(x => disc.has(x.id) && !risolta(x));
  const piene = new Set([a.id]);
  for(let cambiato = true; cambiato; ){
    cambiato = false;
    tutte.forEach(x => {
      if(!piene.has(x.id) && predecessori(x).every(p => risolta(p) || piene.has(p.id))){ piene.add(x.id); cambiato = true; }
    });
  }
  const inizio = x => (estremi(x) || {}).dal || "9999";
  return tutte.sort((x, y) => inizio(x) < inizio(y) ? -1 : 1).map(x => ({x, piena:piene.has(x.id),
    altri: predecessori(x).filter(p => !risolta(p) && !piene.has(p.id))}));
}
/* Dopo l'annullamento di "a" (già salvato), per ogni attività che dipendeva direttamente da
   lei: la partenza più anticipata possibile (primo giorno utile da oggi, e dopo la fine delle
   altre attività da cui dipende ancora) e "sl", le altre attività della stessa persona che
   finirebbero più tardi — cioè se il suo calendario è davvero libero. Solo proposte: si
   applicano con una spunta. "motivo" spiega perché una non si può anticipare. */
function proposteAnticipo(a){
  const oggi = iso(new Date());
  return successori(a).filter(x => !x.fatta && !x.sospesa).map(x => {
    const e = estremi(x);
    if(!e) return null;
    if(modoAtt(x) === "fine") return {x, e, motivo:"consegna"};
    const altre = predecessori(x).filter(p => !p.annullata);
    const sospesa = altre.find(p => p.sospesa);
    if(sospesa) return {x, e, motivo:"sospesa", da:sospesa};
    const fineAltre = altre.map(p => (estremi(p) || {}).al).filter(Boolean).sort().pop();
    let dal = primoGiornoUtile(x.personaId, oggi);
    if(fineAltre && fineAltre >= dal) dal = giornoUtile(x.personaId, fineAltre);
    if(dal >= e.dal) return null;   // non si guadagna niente
    const delta = diffGiorni(e.dal, dal);
    const nuova = modoAtt(x) === "finestra"
      ? Object.assign({}, x, {dataInizio: iso(sommaGiorni(d(x.dataInizio), delta)), scadenza: iso(sommaGiorni(d(x.scadenza), delta))})
      : Object.assign({}, x, {dataInizio: dal});
    return {x, e, nuova, dal, sl: slittamentiAltre(nuova)};
  }).filter(Boolean);
}
/* Fermare un intero progetto a una data (sospensione o annullamento, scelta dall'utente, anche
   nel passato): "data" è l'ultimo giorno di lavoro, le ore dopo si liberano. Per ogni attività
   toccata dice cosa succede: sospendendo le aperte; annullando anche le sospese, ma una sospesa
   già ferma prima di quella data resta al suo giorno (dopo non ha lavorato: spostarla avanti le
   attribuirebbe ore mai fatte). "ultimo" = ultimo giorno con ore dopo il fermo (null: non era
   ancora iniziata), "fineOra" = la fine di oggi, per capire se libera giornate. */
function fermoProgetto(c, data, tipo){
  const annulla = tipo === "annulla";
  return S.assegnazioni.filter(a => a.commessaId === c.id && !a.fatta && !a.annullata && (annulla || !a.sospesa))
    .map(a => {
      const giaFerma = !!(a.sospesa && a.dataFine && a.dataFine <= data);
      const fine = giaFerma ? a.dataFine : data;
      const m = distribuzione(Object.assign({}, a, {fatta:false, sospesa:true, dataFine:fine}));
      const giorni = Array.from(m.keys()).sort();
      return {a, fine, giaFerma, ultimo: giorni.length ? giorni[giorni.length-1] : null,
              fineOra: (estremi(a) || {}).al || null};
    });
}
/* Applica il fermo calcolato da fermoProgetto(): sospende o annulla anche il progetto, con la
   data scelta (sospesaIl, o chiusaIl per l'annullamento). Restituisce le persone che hanno giornate
   liberate, per la proposta di anticipo: [{personaId, dopoIl}] */
function applicaFermoProgetto(c, data, tipo){
  const voci = fermoProgetto(c, data, tipo);
  const liberate = new Map();
  voci.forEach(v => {
    if(v.fineOra && v.fine < v.fineOra) liberate.set(v.a.personaId, v.fine);
    v.a.dataFine = v.fine;
    if(tipo === "annulla"){ v.a.fatta = true; v.a.annullata = true; v.a.sospesa = false; }
    else v.a.sospesa = true;
  });
  if(tipo === "annulla"){ c.stato = "annullata"; c.chiusaIl = data; c.sospesaIl = null; }
  else { c.stato = "sospesa"; c.sospesaIl = data; }
  invalida();
  return Array.from(liberate, ([personaId, dopoIl]) => ({personaId, dopoIl}));
}
// id delle attività fuori sequenza oggi: partono prima che finisca una da cui dipendono (⚠ nel Gantt)
function idsFuoriSequenza(){
  const s = new Set();
  S.assegnazioni.forEach(a => {
    if(!a.dipendeDa) return;
    const e = estremi(a);
    if(e && sequenzaViolata(a, e.dal).length) s.add(a.id);
  });
  return s;
}
// "Rossi Marco · calcoli dimensionali": come si chiama un'attività negli avvisi
function nomeAttivita(a){
  const p = persona(a.personaId);
  return (p ? p.nome : "?") + (a.descrizione ? " · " + a.descrizione : "");
}

// ultimo giorno in cui l'attività può partire mantenendo il ritmo pianificato
function ultimoInizio(a, entroIl){
  if(!entroIl || !(a.oreTotali > 0)) return null;
  const ritmo = orePerGiornoEff(a);
  if(!(ritmo > 0)) return null;
  return partenzaDaScadenza(a.personaId, entroIl, a.oreTotali, ritmo);
}
// confronto fra piano attuale e date limite di una commessa. Senza nessuna tipologia di
// progetto (rimossa: la tipologia si indica solo per attività) la scadenza del progetto
// non è un valore a parte da calcolare a priori: è la più stretta fra quelle delle sue
// attività pianificate. Senza nessuna attività non c'è niente da cui derivarla, quindi
// "lim" resta null — nessun calcolo finché non ce n'è almeno una (vedi CLAUDE.md).
function verificaTempi(c){
  if(!c || !c.consegnaCliente) return null;
  const righe = S.assegnazioni.filter(a => a.commessaId === c.id).map(a=>{
    const e = estremi(a);
    const lA = limiteAttivita(c, a);
    const ultimo = (lA && !lA.impossibile) ? ultimoInizio(a, lA.fineUfficio) : null;
    return {a, e, lim:lA, ultimo,
            ritardo: (e && ultimo) ? diffGiorni(ultimo, e.dal) : null,
            oltre: (e && lA) ? Math.max(0, diffGiorni(lA.fineUfficio, e.al)) : 0};
  }).sort((x,y)=> (y.ritardo||0) - (x.ritardo||0));
  const finePiano = righe.reduce((m,r)=> r.e && (!m || r.e.al > m) ? r.e.al : m, null);
  const primoUltimo = righe.map(r=>r.ultimo).filter(Boolean).sort()[0] || null;
  const giorniOltre = righe.reduce((m,r)=> Math.max(m, r.oltre), 0);
  const lim = righe.reduce((m,r)=> (r.lim && (!m || r.lim.fineUfficio < m.fineUfficio)) ? r.lim : m, null);
  return {lim, righe, finePiano, primoUltimo, giorniOltre, sfora: giorniOltre > 0};
}
/* ----------------------------------------------------------
   Statistiche sulle commesse concluse.
   Attenzione: sono medie delle ORE STIMATE in pianificazione, non di ore
   consuntivate. Nessuno registra qui il tempo realmente speso.
   ---------------------------------------------------------- */
const MIN_CAMPIONE = 5;   // sotto questa soglia il dato è troppo ballerino per essere mostrato

function mediana(v){
  if(!v || !v.length) return null;
  const s = v.slice().sort((a,b)=>a-b);
  const m = Math.floor(s.length/2);
  return s.length % 2 ? s[m] : (s[m-1] + s[m]) / 2;
}
// scarto mediano assoluto: dispersione robusta, non la sposta il singolo caso fuori scala
function scartoMediano(v){
  const md = mediana(v);
  if(md == null) return null;
  return mediana(v.map(x => Math.abs(x - md)));
}
function sintesi(v){
  v = v || [];
  if(v.length < MIN_CAMPIONE) return {n:v.length, poco:true, valori:v.slice().sort((a,b)=>a-b)};
  return {n:v.length, poco:false, mediana:mediana(v), scarto:scartoMediano(v),
          media:v.reduce((a,b)=>a+b,0)/v.length, min:Math.min(...v), max:Math.max(...v)};
}
function commessaConclusa(c){ return c.stato === "chiusa" || c.stato === "annullata"; }

// raccoglie ore e durate delle commesse concluse, separando le tipologie di progetto
function statisticheCommesse(){
  const out = {};
  S.tipologie.map(t=>t.id).concat("").forEach(k => out[k] = {ore:[], durate:[], perGruppo:{}, senzaAttivita:0});
  const dist = distribuzioni();
  S.commesse.filter(commessaConclusa).forEach(c=>{
    const att = S.assegnazioni.filter(a => a.commessaId === c.id);
    const g = out[c.natura && out[c.natura] ? c.natura : ""];
    if(!att.length){ g.senzaAttivita++; return; }
    // ore REALMENTE distribuite (estremi(a).ore), non il monte ore pianificato (a.oreTotali):
    // un'attività chiusa in anticipo (annullata compresa) non deve contare ore mai lavorate
    g.ore.push(att.reduce((s,a)=> s + ((estremi(a)||{}).ore||0), 0));
    // giorni lavorativi in cui c'e' stata almeno un'ora su QUESTA commessa: non "dal primo giorno
    // toccato all'ultimo" (che conterebbe anche le pause per altro — altre commesse, ferie, attesa
    // fornitori) e non risente di quando cade nell'anno solare, perche' nei non lavorativi non si
    // registrano mai ore.
    const giorni = new Set();
    att.forEach(a=>{ const m = dist.get(a.id); if(m) m.forEach((ore,k)=>{ if(ore>0) giorni.add(k); }); });
    if(giorni.size) g.durate.push(giorni.size);
    // ore per gruppo: conta solo il gruppo principale di chi ha lavorato, per non contare due volte
    S.gruppi.forEach(gr=>{
      const ore = att.filter(a=>{ const p = persona(a.personaId); return p && p.gruppoId === gr.id; })
                     .reduce((s,a)=> s + ((estremi(a)||{}).ore||0), 0);
      if(ore > 0) (g.perGruppo[gr.id] = g.perGruppo[gr.id] || []).push(ore);
    });
  });
  return out;
}
// durata leggibile: sotto le due settimane in giorni, sopra in settimane
function fmtDurata(giorni){
  if(giorni == null) return "–";
  return giorni < 14 ? tr("{0} gg", arr(giorni)) : tr("{0} sett", arr(giorni/7));
}
// con poche commesse non ha senso una mediana: mostro i valori veri, che nessuno può scambiare per una media
function fmtSintesi(s, unita){
  const uno = x => unita === "giorni" ? fmtDurata(x) : tr("{0} h", arr(x));
  if(!s || !s.n) return `<span class="nota">${tr("nessuna")}</span>`;
  if(s.poco) return `<span class="mono">${s.valori.map(uno).join(" · ")}</span>`
    + `<div class="nota">${tr("valori singoli")}</div>`;
  return `<b class="mono">${uno(s.mediana)} ± ${unita === "giorni" ? tr("{0} gg", arr(s.scarto)) : tr("{0} h", arr(s.scarto))}</b>`;
}

// scorciatoia: la commessa ha una consegna concordata che il piano attuale non rispetta
function rischioCliente(c){
  const v = verificaTempi(c);
  return !!(v && v.sfora);
}
// assegna una corsia verticale a ogni attività sovrapposta; "eventi" (riunioni e formazione,
// un giorno solo) dividono le stesse corsie, con x.ev al posto di x.a
function corsie(attivita, eventi){
  const info = attivita.map(a=>({a, e:estremi(a)})).filter(x=>x.e)
    .concat((eventi||[]).map(ev => ({ev, e:{dal:ev.giorno, al:ev.giorno, ore:+ev.ore||0}})));
  info.sort((x,y)=> x.e.dal < y.e.dal ? -1 : x.e.dal > y.e.dal ? 1 : 0);
  const fine = [];
  info.forEach(x=>{
    let c = 0;
    while(c < fine.length && fine[c] >= x.e.dal) c++;
    fine[c] = x.e.al;
    x.corsia = c;
  });
  return {info, n:Math.max(1, fine.length)};
}
