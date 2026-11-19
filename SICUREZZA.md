# Verifica di sicurezza — riepilogo e azioni di correzione

**Oggetto:** Thumper (`VERSIONE_APP` 1.6.2). **Tipo:** verifica mirata (profilo *quick*), solo lettura del sorgente.
**Limiti:** nessun codice eseguito durante la verifica; un solo passaggio di caccia, senza secondo controllo indipendente; i validatori dello strumento non girano su Windows, quindi il registro di copertura non è validato. Il report originale fu fatto sul ramo `release-1.6.3` (commit `94d22dd`); le correzioni qui sotto sono applicate a questo ramo, dove i punti citati corrispondono.

## Esito

Nessun difetto grave. Il modello di fiducia dichiarato (circa 15 utenti fidati, una condivisione di rete, nessuna autenticazione) è coerente con il codice. **Il confine di sicurezza reale è l'ACL della condivisione**, fuori dal repository: chi può scrivere `data.js`, `Thumper.html` o `js/*` esegue codice nei browser di tutti i colleghi. Non ci sono `eval`, `Function`, `insertAdjacentHTML`, `postMessage`, `fetch`. Tre problemi confermati (tutti di gravità bassa), un punto da decidere.

## Problemi confermati e correzioni

| # | Gravità | Problema | Dove | Stato |
|---|---|---|---|---|
| 1 | bassa | XSS memorizzato nel nome di festività/chiusura: finiva in `title="…"` senza `esc()` | `js/render-piano.js:91` | **Corretto**: `esc(nomeFestivita(g.k))` |
| 2 | bassa | Iniezione di formule nei CSV (`= + - @` a inizio cella valutati da Excel) | `js/csv.js`, `js/report.js` | **Corretto**: helper unico `cellaCsv()` che prefissa `'` ai testi a rischio; numeri (anche negativi) invariati |
| 3 | bassa | L'interruttore "proteggi attività" si spegneva senza il codice | `js/avvio.js` (`cfg-prot-att`) | **Corretto**: con codice attivo, spegnerlo chiede `autorizza()`; se rifiutato la spunta torna com'era |

**Dettagli**

1. *Come si sfrutta:* chi può modificare il calendario scrive un nome tipo `x" onmouseover="…"` in una festività o chiusura aziendale; si salva nel file dati e scatta al passaggio del mouse sull'intestazione del giorno di ogni collega. Richiede solo la modalità modifica, non il codice.
2. *Come si sfrutta:* un collega scrive una formula in un campo libero (persona, progetto, cliente, descrizione, note…), un altro esporta `plan.csv` o `workload_*.csv` e lo apre in Excel. Il prefisso `'` fa leggere la cella come testo.
3. *Impatto reale:* più stretto di quanto sembrasse. Sospendere o annullare un progetto chiede **sempre** il codice (`js/finestre-modali.js`), a prescindere dall'opzione. L'opzione governa solo l'eliminazione di una singola attività o di una riunione/formazione. Il codice resta dichiarato come protezione contro i clic distratti, non come autenticazione.

## Allineamento della documentazione (derivato dal punto 3)

La tabella *Azioni protette* e la spunta in Impostazioni dicevano che anche "annullare un progetto" dipende dall'opzione: falso nel codice. Corretti testi in `js/impostazioni.js`, `dizionario.js` (IT→EN) e `manuale.html` (italiano e inglese); aggiunta la nota che spegnere la spunta chiede il codice.

## Rifiniture applicate (hardening, non vulnerabilità)

- `icsTesto` (`js/csv.js`): `.replace(/;/g,"\;")` non faceva nulla → ora `"\;"`; un `\r` isolato ora diventa `\n` (`/\r\n|\r|\n/g`).
- `href="${link}"` in `js/gestore-documenti.js` ora passa da `esc()` (nessuno sfruttamento oggi: `aUri` usa `encodeURI`).

## Punto aperto: serve una decisione di prodotto

**Note modificabili in sola consultazione.** `scriviNota`, `eliminaNota`, `creaFileNote` (`js/gestore-documenti.js`) e il gestore di click in `js/scheda-commessa.js` non controllano `modificabile`: in sola consultazione si possono aggiungere ed eliminare note nei file `.md` condivisi. Altre azioni nello stesso file lo controllano. Non è documentato se sia voluto (le note vivono fuori dal file dati).
*Se non voluto:* `if(!modificabile) return brindisi(tr("Attiva prima la modifica"));` in testa alle tre funzioni, oppure `mode:'read'` nel selettore. **Non applicato**, in attesa della decisione.

## Altre note di hardening, non applicate (accettate o a basso valore)

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

## Come si è controllato dopo le correzioni

- Sintassi di tutti i `js/*.js` e di `dizionario.js` (`node --check`).
- Prova mirata su `cellaCsv` e `icsTesto`: `=1+1`, `@x`, `-cmd` prefissati; `-3,5`, `12`, date ISO invariati; virgolette raddoppiate; `;` e `\r` protetti nell'ICS.
- **Non fatto:** prova nel browser (apertura del Piano con una festività dal nome malevolo, export e apertura in Excel, spegnimento della spunta con codice attivo). Da fare prima del rilascio.
