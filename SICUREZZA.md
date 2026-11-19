# Verifica di sicurezza — riepilogo e piano di correzione

**Oggetto:** Thumper (`VERSIONE_APP` 1.6.2). **Tipo:** verifica mirata (profilo *quick*), solo lettura del sorgente.
**Limiti:** nessun codice eseguito durante la verifica; un solo passaggio di caccia, senza secondo controllo indipendente; i validatori dello strumento non girano su Windows, quindi il registro di copertura non è validato. Il report originale fu fatto sul ramo `release-1.6.3` (commit `94d22dd`); i punti citati corrispondono al codice di questo ramo (1.6.2). **Nessuna correzione è stata applicata al codice**: questo documento è il piano, da eseguire in un secondo momento.

## Esito

Nessun difetto grave. Il modello di fiducia dichiarato (circa 15 utenti fidati, una condivisione di rete, nessuna autenticazione) è coerente con il codice. **Il confine di sicurezza reale è l'ACL della condivisione**, fuori dal repository: chi può scrivere `data.js`, `Thumper.html` o `js/*` esegue codice nei browser di tutti i colleghi. Non ci sono `eval`, `Function`, `insertAdjacentHTML`, `postMessage`, `fetch`. Tre problemi confermati (tutti di gravità bassa), un punto da decidere.

## Problemi confermati e correzioni da fare

| # | Gravità | Problema | Dove | Stato |
|---|---|---|---|---|
| 1 | bassa | XSS memorizzato nel nome di festività/chiusura: finisce in `title="…"` senza `esc()` | `js/render-piano.js:91` | **Da fare** |
| 2 | bassa | Iniezione di formule nei CSV (`= + - @` a inizio cella valutati da Excel) | `js/csv.js:55`, `js/report.js:191,195` | **Da fare** |
| 3 | bassa | L'interruttore "proteggi attività" si spegne senza il codice | `js/avvio.js:373` | **Da fare** |

### 1. XSS nel nome di festività/chiusura
*Come si sfrutta:* chi può modificare il calendario scrive un nome tipo `x" onmouseover="…"` in una festività o chiusura aziendale (`js/finestre-modali.js:1160`, `js/avvio.js:282`); si salva nel file dati e scatta al passaggio del mouse sull'intestazione del giorno di ogni collega. Richiede solo la modalità modifica, non il codice.
*Correzione:* in `js/render-piano.js:91` sostituire `title="${nomeFestivita(g.k)}"` con `title="${esc(nomeFestivita(g.k))}"`.

### 2. Formule nei CSV
*Come si sfrutta:* un collega scrive una formula in un campo libero (persona, progetto, cliente, descrizione, note, predecessori), un altro esporta `plan.csv` o `workload_*.csv` e lo apre in Excel.
*Correzione:* una funzione unica in `js/csv.js`, usata anche da `js/report.js`:
```js
// Excel valuta come formula una cella che inizia con = + - @ (o TAB/CR): la si prefissa con '.
// I numeri, anche negativi (virgola decimale), restano numeri.
function cellaCsv(v){
  let s = String(v);
  if(/^[=+\-@\t\r]/.test(s) && !/^-?\d+(,\d+)?$/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g,'""')}"`;
}
```
In `esportaCsv` sostituire la costruzione della cella con `r.map(cellaCsv)`; in `js/report.js` togliere `virgolette` e usare `r.map(cellaCsv)`. `csv.js` è caricato dopo `report.js` ma la funzione è usata solo a runtime, quindi l'ordine non conta.

### 3. Interruttore "proteggi attività"
*Impatto reale:* più stretto di quanto sembrasse. Sospendere o annullare un progetto chiede **sempre** il codice (`js/finestre-modali.js:1454`), a prescindere dall'opzione. L'opzione governa solo l'eliminazione di una singola attività (`:557`) o di una riunione/formazione (`:1590-1591`), che altrimenti usano un semplice `confirm()`. Il codice è dichiarato protezione contro i clic distratti, non autenticazione.
*Correzione:* in `js/avvio.js`, nel ramo `cfg-prot-att` (riga 373), prima di `S.config.proteggiAttivita = e.target.checked;`:
```js
if(!e.target.checked && protetto() && !autorizza(tr("Disattivazione della protezione delle attività."))){ e.target.checked = true; return; }
```
e aggiungere la chiave in `dizionario.js`: `"Disattivazione della protezione delle attività.":"Turning off the protection of activities."`.

### Documentazione da allineare (derivato dal punto 3)
La tabella *Azioni protette* (`js/impostazioni.js:254`) e la spunta (`:258`), con le voci in `dizionario.js:272-273`, e il manuale (`manuale.html:720-721` italiano, `:1425` inglese) dicono che anche "annullare un progetto" dipende dall'opzione: nel codice non è vero. Cambiare "annullare un progetto" in "una riunione" (o "riunione o formazione") in tutti questi punti; nel manuale aggiungere che sospendere/annullare un progetto chiede sempre il codice e che spegnere la spunta lo richiede a sua volta. Alternativa: far dipendere dall'opzione anche l'annullo, ma cambia il comportamento attuale.

## Rifiniture facoltative (hardening, non vulnerabilità)

- `icsTesto` (`js/csv.js:73`): `.replace(/;/g,"\;")` non fa nulla (`"\;"` in JS è `";"`) → usare `"\\;"`. Un `\r` isolato non è gestito: usare `/\r\n|\r|\n/g` al posto di `/\r?\n/g`.
- `href="${link}"` in `js/gestore-documenti.js:323`: avvolgere in `esc()` per coerenza (oggi nessuno sfruttamento, `aUri` usa `encodeURI`).

## Punto aperto: serve una decisione di prodotto

**Note modificabili in sola consultazione.** `scriviNota`, `eliminaNota`, `creaFileNote` (`js/gestore-documenti.js`) e il gestore di click in `js/scheda-commessa.js` non controllano `modificabile`: in sola consultazione si possono aggiungere ed eliminare note nei file `.md` condivisi. Altre azioni nello stesso file lo controllano. Non è documentato se sia voluto (le note vivono fuori dal file dati).
*Se non voluto:* `if(!modificabile) return brindisi(tr("Attiva prima la modifica"));` in testa alle tre funzioni, oppure `mode:'read'` nel selettore. In attesa della tua decisione.

## Altre note di hardening (accettate o a basso valore)

- `esc()` non converte l'apice singolo: sicuro finché tutti gli attributi usano le virgolette doppie. Regola da mantenere.
- `finestra()`, `bannerScelta()`, `tr()` non fanno escape dei parametri: oggi tutti i chiamanti usano `esc()`. Convenzione fragile da ricordare nelle revisioni.
- `normalizza()` fa `Object.assign` senza validazione dello schema: nessun inquinamento globale, rilevante solo per un file dati modificato a mano.
- `coloreCommessa()` e gli id negli attributi: valori da tavolozza fissa o generati, non digitabili da interfaccia.
- `conflittoSalvataggio` sovrascrive se il file su disco non ha meta leggibile (il precedente va in `backup/`): finestra TOCTOU nota e documentata.
- Eliminazione di un'assenza (`js/finestre-modali.js`) senza conferma né codice: incoerente con le altre eliminazioni, da valutare.
- Nessun CSP: il `document.write` con handler inline in `Thumper.html` richiederebbe `unsafe-inline`.

## Dipendente dal deploy (fuori dal sorgente, da verificare in azienda)

ACL NTFS/SMB su `Thumper.html`, `js/*`, `data.js`, `backup/` e sulle cartelle progetto (**è il controllo più importante: solo chi deve poter cambiare il codice deve poterlo scrivere**); permessi del browser per `file://` e File System Access; registrazione del gestore `ms-word:`.

## Esiti negativi verificati

Nomi di file/cartelle e testi delle note passano sempre da `esc()`; SVG mostrato via `<img>` (script non eseguiti); `AUTORE` non può iniettare intestazioni nelle note; la cancellazione dei backup tocca solo `dati-*.js` in `backup/`.

## Non coperto dalla verifica

`js/render-backlog.js`, gli altri `innerHTML` di `js/report.js`, parte del rendering delle note in `js/gestore-documenti.js`, il percorso di eliminazione delle assenze.

## Come verificare dopo aver applicato le correzioni

- `node --check` su tutti i `js/*.js` e su `dizionario.js`; se hai la suite `node --test`, eseguirla.
- Prova mirata su `cellaCsv`: `=1+1`, `@x`, `-cmd` prefissati; `-3,5`, `12`, date ISO invariati; virgolette raddoppiate. Su `icsTesto`: `;` e `\r` protetti.
- Nel browser: aprire il Piano con una festività dal nome `x" onmouseover="alert(1)` (nessun alert al passaggio del mouse), esportare il CSV e aprirlo in Excel con una descrizione `=1+1`, spegnere la spunta con codice attivo (deve chiederlo).
