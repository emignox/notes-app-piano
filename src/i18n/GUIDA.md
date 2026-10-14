# Come si traducono i testi dell'app

L'app è scritta in italiano e parla anche inglese e francese. **Il testo italiano
è la chiave**: `t('Oggi')` dà "Today", "Aujourd'hui" o "Oggi" a seconda della
lingua scelta nelle Opzioni. Se una frase manca nel dizionario resta in italiano:
un'app mezza tradotta funziona lo stesso.

Regola sopra tutte le altre: **in italiano l'app deve restare identica, carattere
per carattere**. Tradurre non cambia nessuna funzione.

## 1. Nel codice

```ts
import { t } from '../i18n';          // il percorso cambia con la cartella

<h1>{t('Oggi')}</h1>
<button aria-label={t('Chiudi')}>…</button>
t('Hai risposto a {n} note', { n: count })        // segnaposto {nome}
```

* Si avvolge **solo ciò che l'utente legge**: testo nei tag, `title`, `aria-label`,
  `placeholder`, `alt`, messaggi, etichette, spiegazioni. **Mai** identificatori,
  chiavi, classi CSS, `kind`, `id`, valori confrontati con `===`, nomi delle note
  usati dalla logica, chiavi di localStorage, nomi di file, espressioni regolari.
* Un testo che è sia etichetta sia identificatore (es. `'maggiore'`): la logica
  resta com'è, si traduce al momento di mostrarlo: `{t(label)}`.
* **Costanti a livello di modulo**: `const ETICHETTE = { a: 'Facile' }` si valuta
  UNA volta, all'avvio, in italiano. Non scrivere `t()` lì dentro. Lascia i testi
  italiani nella costante e traduci dove si disegna: `{t(ETICHETTE[x])}`. Così il
  controllo non li vede come chiavi: **aggiungili a mano al dizionario** (vedi 3).
* **Testi con numeri o nomi**: un `t()` solo con i segnaposto, mai pezzi incollati:
  `t('{n} note', { n })`, non `n + t(' note')`. L'italiano risultante deve essere
  identico a prima. I plurali: due chiavi, scelte dalla stessa condizione di prima
  (`n === 1 ? t('1 nota') : t('{n} note', { n })`).
* **Frasi con elementi dentro** (grassetto, link): meglio spezzare in pezzi interi
  che frasi tradotte a metà; se serve, un `t()` per pezzo. Non cambiare la struttura
  dei tag.
* **Una variabile locale chiamata `t`** (es. `tab => …`, `t => navigate(t)`) nasconde
  la funzione: rinominala (`tab`, `tt`).
* Dati (lezioni, brani, glossario…): **non si riscrivono i file dei dati**. Dove si
  mostrano, si traducono i campi di testo: `t(lesson.title)` oppure, per strutture
  grandi, `localize(dati, CAMPI)` (da `../i18n`; `CAMPI` = insieme dei nomi dei
  campi che sono testo da mostrare, mai gli id). I testi dei dati NON possono stare
  in `t('…')` letterali: si dichiarano in `src/i18n/sources/<area>.ts` (vedi 3).
* Cose che restano italiane in tutte le lingue: nomi propri di opere, i termini
  musicali internazionali (allegro, legato, rit., sforzando, pp, fermata, …),
  le didascalie dentro le partiture (sono nel file MusicXML).

## 2. Come tradurre

Tono: caldo, diretto, dà del "tu" (come l'italiano). Frasi corte come nell'originale.

| Italiano | English | Français |
|---|---|---|
| chiave di violino / di basso | treble clef / bass clef | clé de sol / clé de fa |
| pentagramma, rigo | staff | portée |
| battuta | measure | mesure |
| movimento (unità di tempo) | beat | temps |
| semibreve, minima, semiminima, croma, semicroma | whole, half, quarter, eighth, sixteenth note | ronde, blanche, noire, croche, double croche |
| pausa | rest | silence |
| diesis, bemolle, bequadro | sharp, flat, natural | dièse, bémol, bécarre |
| diteggiatura, pollice | fingering, thumb | doigté, pouce |
| mano destra / sinistra | right / left hand | main droite / gauche |
| terza maggiore / minore | major / minor third | tierce majeure / mineure |
| scala maggiore, minore naturale / armonica / melodica | major scale, natural / harmonic / melodic minor | gamme majeure, mineure naturelle / harmonique / mélodique |
| arpeggio, accordo, rivolto | arpeggio, chord, inversion | arpège, accord, renversement |
| settima di dominante | dominant seventh | septième de dominante |
| tonica, dominante, sottodominante | tonic, dominant, subdominant | tonique, dominante, sous-dominante |
| armatura di chiave | key signature | armure |
| ritornello | repeat | reprise |
| pedale | pedal | pédale |
| brano, pezzo | piece | morceau / pièce |

Nomi delle note **dentro le frasi** (testo statico): inglese = lettere (Do → C, Re → D,
Mi → E, Fa → F, Sol → G, La → A, Si → B; ♯ ♭ restano); francese = do, ré, mi, fa,
sol, la, si (con l'accento su ré). Attenzione ai falsi amici: "Mi" è la nota E, "re"
è la nota D, "la" e "si" possono essere articolo/congiunzione in italiano.
Le tonalità: "Do maggiore" → "C major" / "do majeur".

I segnaposto `{nome}` restano identici e non si traducono. Punteggiatura e
maiuscole come nella lingua di arrivo (l'inglese non usa l'apostrofo tipografico
dove l'italiano sì: va bene l'apostrofo normale `'`).

## 3. I dizionari

* `src/i18n/en/<area>.ts` e `src/i18n/fr/<area>.ts`, un file per area, con le stesse
  chiavi:

  ```ts
  export default {
    'Oggi': 'Today',
    'Hai risposto a {n} note': 'You answered {n} notes',
  } as Record<string, string>;
  ```

* La chiave è **esattamente** la stringa italiana passata a `t()` (stesso testo, stessi
  spazi, stessi apostrofi: se nel codice c'è `l'` con apostrofo dritto, la chiave
  ha l'apostrofo dritto).
* **Testi dei dati o delle costanti** (non in `t('…')` letterali): si dichiarano in
  `src/i18n/sources/<area>.ts`:

  ```ts
  import { modules } from '../../data/lessons';
  export default { fields: ['title', 'text', 'prompt'], data: [modules] };
  ```

  `fields` sono i nomi dei campi di testo (anche dentro elenchi); il controllo
  cammina in `data` e pretende la voce in en e fr per ogni stringa trovata lì.
  Se un testo da tradurre non sta in nessun campo (es. una costante di
  etichette), mettilo in un piccolo oggetto di `data` con un campo dedicato.

## 4. Verifica

```
npx tsc --noEmit -p tsconfig.app.json     # tipi
npx eslint <i tuoi file>                  # lint
npm run check:i18n                         # mancano voci? segnaposto diversi?
```

`npm run check:i18n` elenca ciò che manca: va portato a zero per i tuoi file.
Alla fine un confronto automatico dell'italiano prima/dopo (lo lancia chi
coordina): ogni differenza di una virgola è un errore tuo da correggere.
