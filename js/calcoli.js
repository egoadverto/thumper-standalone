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
   4. CALCOLI
   ========================================================== */
const TIPI_GIORNO = {ferie:"Ferie", permesso:"Permesso a ore", malattia:"Malattia",
                     smart:"Smart working", trasferta:"Trasferta"};
const SIGLE_GIORNO = {ferie:"Ferie", permesso:"Perm.", malattia:"Mal.",
                      smart:"Smart", trasferta:"Trasferta"};
const FUORI_SEDE = ["smart","trasferta"];

function vociGiorno(personaId, isoStr){
  return (S.assenze||[]).filter(a => a.personaId===personaId && isoStr>=a.dal && isoStr<=a.al);
}
// smart working e trasferta non sono "assenze" nel senso di assenzaGiorno/assenzaTotale: la loro
// riduzione di capacità (solo la trasferta ne ha una, vedi trasfertaGiorno) si calcola a parte
function assenzaGiorno(personaId, isoStr){
  return vociGiorno(personaId, isoStr).find(a => !FUORI_SEDE.includes(a.tipo)) || null;
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
    if(a.tipo !== "permesso") return null;
    if((a.ore||0) >= capacitaPersonaGiorno(persona(personaId), isoStr)) return null;
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
  const a = assenzaGiorno(personaId, isoStr);
  if(a){
    if(a.tipo === "permesso"){
      const p = persona(personaId);
      return (a.ore||0) >= capacitaPersonaGiorno(p, isoStr);
    }
    return true;
  }
  const t = trasfertaGiorno(personaId, isoStr);
  if(t) return t.ore == null || t.ore >= capacitaPersonaGiorno(persona(personaId), isoStr);
  return false;
}
// vincolo dell'attività: "inizio" = parte il, "fine" = consegna entro, "finestra" = dal…al ripartito
function modoAtt(a){ return a.modo || (a.scadenza ? "fine" : "inizio"); }
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
// distribuisce le ore di un'attività sui giorni utili
function distribuzione(a){
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
  S.assegnazioni.forEach(a => cacheDist.set(a.id, distribuzione(a)));
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
    if(a.tipo === "permesso") cap = Math.max(0, cap - (a.ore||0));
    else cap = 0;
  } else {
    const t = trasfertaGiorno(personaId, isoStr);
    if(t) cap = (t.ore != null) ? Math.max(0, cap - t.ore) : 0;
  }
  return cap * efficienza();
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
  return out;
}

/* ----------------------------------------------------------
   Riassegnazioni suggerite: sposta la data (stessa persona) o la persona
   (stesse date), mai indietro nel tempo, mai in automatico. Non sceglie da
   sola: elenca le attività candidate di un giorno in sovraccarico, ordinate
   per margine, e propone dove/a chi ciascuna potrebbe spostarsi — la
   persona decide quale, se decide di spostarne una.
   ---------------------------------------------------------- */
// attività della persona che occupano quel giorno, con margine (giorni prima del proprio
// limite: la scadenza dell'attività se c'è, altrimenti la data limite della commessa) e,
// se esistono, il primo spostamento di data in avanti e/o un collega sostituto
function candidatiRiassegnazione(personaId, isoGiorno){
  const dist = distribuzioni();
  return S.assegnazioni.filter(a => a.personaId === personaId && !a.fatta)
    .map(a => ({a, mappa:dist.get(a.id)}))
    .filter(x => x.mappa && (x.mappa.get(isoGiorno) || 0) > 0)
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
function applicaRiassegnazione(attivitaId, nuovaDataInizio){
  const a = S.assegnazioni.find(x=>x.id===attivitaId);
  if(!a) return;
  const n = diffGiorni(a.dataInizio, nuovaDataInizio);
  a.dataInizio = nuovaDataInizio;
  if(a.scadenza) a.scadenza = iso(sommaGiorni(d(a.scadenza), n));
  invalida(); segnaModificato(); rendi();
  brindisi(tr("Attività spostata al {0}", itData(nuovaDataInizio)));
}
// sostituisce chi fa l'attività, stesse date: nessun altro campo cambia
function applicaSostituzione(attivitaId, nuovaPersonaId){
  const a = S.assegnazioni.find(x=>x.id===attivitaId);
  const p = persona(nuovaPersonaId);
  if(!a || !p) return;
  a.personaId = nuovaPersonaId;
  invalida(); segnaModificato(); rendi();
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
function limiteAttivita(c, a){
  return dateLimite({consegnaCliente:c.consegnaCliente, tipologiaId:tipologiaAttivita(a)});
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
    const ultimo = lA ? ultimoInizio(a, lA.fineUfficio) : null;
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
function commessaConclusa(c){ return c.stato === "chiusa" || c.stato === "archiviata"; }

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
// assegna una corsia verticale a ogni attività sovrapposta
function corsie(attivita){
  const info = attivita.map(a=>({a, e:estremi(a)})).filter(x=>x.e);
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
