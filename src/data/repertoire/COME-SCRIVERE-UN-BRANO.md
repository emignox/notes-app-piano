# Come si scrive un brano

Guida operativa per aggiungere pezzi a due mani. Ogni brano è codice TypeScript
in un file di questa cartella, e viene verificato da `npm run check:pezzi`.

## Il minimo indispensabile

```ts
import { p, s } from '../kit';

export const mieiBrani = [
  p({
    id: 'mozart-k1-minuetto',
    title: 'Minuetto in Sol K. 1',
    composer: 'W. A. Mozart',
    difficulty: 'medio',   // 'facile' | 'medio' | 'difficile'
    level: 2,              // ordine FINE dentro la stessa difficoltà (1 = più abbordabile)
    emoji: '🎼',
    bpm: 100,
    meter: '3/4',
    key: { tonic: 'G', mode: 'maggiore' },
    pickup: 1,             // battiti di levare, opzionale
    tempoText: 'Allegretto',
    hint: 'Una riga che dice cosa si impara qui.',
    about: 'Da dove viene il brano, una riga.',
    focus: ['legato della destra', 'salti della sinistra'],
    sections: [
      { name: 'A', from: 0, to: 48, note: 'la parte che tutti riconoscono' },
      { name: 'B', from: 48, to: 96 },
    ],
    steps: [ /* ... */ ],
  }),
];
```

## Il passo: `s(figura, destra, sinistra, segni)`

```ts
s('q', 'E5', ['A2', 'E3'], { dyn: 'p', leg: true, fin: 5 })
//  │     │       │            └─ i segni (tutti opzionali)
//  │     │       └─ mano sinistra: nota, accordo, o niente = pausa
//  │     └─ mano destra
//  └─ figura
```

**Figure**: `'w'` semibreve (4), `'h'` minima (2), `'q'` semiminima (1),
`'8'` croma (0.5), `'16'` semicroma (0.25). La `d` finale è il punto:
`'hd'` = 3, `'qd'` = 1.5, `'8d'` = 0.75, `'wd'` = 6.

**Note**: `'C4'`, `'F#4'`, `'Bb3'`. Do centrale = `C4`. Servono sempre
l'ottava. Vanno bene anche `'F##4'` e `'Bbb3'` dove la teoria le richiede.

### I segni

Senza suffisso valgono per la **mano destra**; `…L` per la sinistra, `…B` per
entrambe.

| segno | significato |
|---|---|
| `leg` / `legL` / `legB` | **legatura di frase**: questa nota si lega alla prossima, il dito non stacca. Una serie di passi con `leg` diventa un unico arco. |
| `tie` / `tieL` / `tieB` | **legatura di valore**: *stessa nota* che continua nel passo dopo. Non si ribatte, e all'utente non viene richiesta. |
| `art` / `artL` / `artB` | `'staccato'`, `'accent'`, `'tenuto'`, `'marcato'`, `'fermata'` |
| `fin` / `finL` | diteggiatura: `3` oppure `[1, 3, 5]` (una cifra per nota dell'accordo, dal grave all'acuto) |
| `dyn` | `'pp' 'p' 'mp' 'mf' 'f' 'ff' 'sf'` — vale da qui in avanti |
| `hair` | `'cresc'`, `'dim'`, `'end'` — forcella, interpolata fino al segno che la chiude |
| `text` | `'dolce'`, `'rit.'`, `'a tempo'`, `'cantabile'` |
| `ped` | `'down'` / `'up'` |
| `bar` | `'double'`, `'end'`, `'repeat'` — stanghetta speciale dopo questo passo |

**`leg` e `tie` non sono la stessa cosa.** `tie` fra due note diverse è un
errore e il validatore lo blocca. Per il legato fra note diverse serve `leg`.

### Aiuti

```ts
rep(4, ...passi)     // ripete un gruppo (nella musica si ripete moltissimo)
seq(a, b, c)         // concatena gruppi, per tenere il codice a livello di battute
waltz('G2', ['B3','D4'], ['D5', undefined, undefined])  // basso + accordo + accordo
```

## Le regole che il validatore fa rispettare

1. **Le battute devono tornare.** Le stanghette non si scrivono: si calcolano
   dal `meter` e dal `pickup`. Se una battuta ha un movimento di troppo o di
   meno, è un errore. È l'errore numero uno: conta i movimenti battuta per
   battuta mentre scrivi.
2. **Massimo 5 note per mano** e **apertura massima di un'ottava** (12
   semitoni) dentro un accordo di una mano sola.
3. **`tie` solo fra note uguali**, mai sull'ultimo passo, mai su una pausa.
4. **Estensione**: tutto dentro gli 88 tasti. In pratica destra `C4`–`C6`,
   sinistra `C2`–`C4`. Fuori da lì arriva un avviso.
5. **Le mani non si scavalcano** (avviso).
6. **Le sezioni** devono coprire tutti i passi senza buchi.
7. **Il posto nel percorso** dato da `difficulty` + `level` dev'essere libero:
   la lista viene ordinata da sola, ma due brani nello stesso posto finiscono in
   un ordine arbitrario.

Gira `npm run check:pezzi` finché non escono errori.

## Le regole che il validatore *non* può controllare

Queste contano di più, e stanno a chi scrive.

- **Lunghezza vera.** Un brano è una pagina, non un incipit: **almeno 60 passi**,
  meglio 100–250. Si scrive la forma intera (A–B, A–B–A, tema con le sue
  ripetizioni), non le prime quattro battute.
- **La melodia dev'essere quella giusta.** Se il titolo dice Mozart, le note
  sono di Mozart. Semplificare l'accompagnamento è legittimo e necessario;
  cambiare il tema no.
- **L'ottava dell'accompagnamento.** È l'errore di trascrizione più insidioso
  del lotto, perché nessun controllo lo prende: scrivere la sinistra un'ottava
  sopra il suo registro non viola nessuna regola — le mani non si scavalcano
  mai — eppure chiude la sonorità, riempie il pentagramma di tagli addizionali
  e manda le due mani sugli stessi tasti. L'unico modo di accorgersene è
  **guardare la pagina disegnata**: se il basso esce dal rigo verso l'alto per
  intere battute, è nell'ottava sbagliata. (È già successo, sul K. 545.)
- **Deve essere suonabile da un principiante.** La sinistra sta ferma o si
  muove per gradi; niente salti continui oltre l'ottava; niente cambi di
  posizione a ogni battuta. Meglio un accompagnamento ridotto a note lunghe
  che uno fedele e impossibile.
- **L'espressione non è decorazione.** Ogni frase ha una legatura, ogni brano
  ha almeno una dinamica di partenza e un paio di cambi, i bassi di un valzer
  sono staccati, una cadenza finale rallenta. Note tutte uguali senza segni
  sono il difetto che stiamo togliendo da questa app.
- **Diteggiatura** almeno sulla prima nota di ogni frase e dove la mano cambia
  posizione: è lì che un principiante si blocca.
- **`hint` e `focus`** dicono la verità sulla difficoltà del pezzo, in italiano,
  senza entusiasmo pubblicitario.
