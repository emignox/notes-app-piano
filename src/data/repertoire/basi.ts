// ─────────────────────────────────────────────────────────────────────────────
// La fascia FACILE: sei pagine intere, in ordine di difficoltà reale.
//
// Sono i primi pezzi a due mani. La regola che li tiene insieme: la destra
// canta, la sinistra sostiene e sta ferma il più possibile. Le battute sono
// contate una per una nei commenti — è lì che si sbaglia.
// ─────────────────────────────────────────────────────────────────────────────

import type { Piece } from '../../types';
import { p, s, seq, type Marks } from '../kit';

// ── 1 · Studio in Do ─────────────────────────────────────────────────────────
// Posizione fissa: destra Do4–Sol4 (1–5), sinistra Do3–Sol3 (5–1). Le mani non
// si spostano mai: quello che si impara è tenere due righe sotto gli occhi.
const studioDo = p({
  id: 'studio-do-due-mani',
  title: 'Studio in Do a due mani',
  composer: 'Esercizio',
  difficulty: 'facile',
  level: 1,
  emoji: '🌱',
  bpm: 72,
  meter: '4/4',
  key: { tonic: 'C', mode: 'maggiore' },
  tempoText: 'Andante tranquillo',
  hint: 'Nessuna mano si sposta: le dita restano sui cinque tasti di partenza per tutto il pezzo.',
  about: 'Uno studio scritto per questa app: quattro sezioni che presentano una alla volta le tre cose difficili di un pezzo a due mani.',
  focus: [
    'tenere la nota lunga di una mano mentre l\'altra si muove',
    'legare quattro note senza staccare il dito',
    'far crescere il suono senza accelerare',
  ],
  sections: [
    { name: 'A — la destra canta', from: 0, to: 22, note: 'La sinistra tiene note lunghe: contale, non lasciarle andare prima.' },
    { name: 'B — parla la sinistra', from: 22, to: 44, note: 'Qui la melodia è sotto. La destra tiene fermo un dito solo: è più difficile di quanto sembri.' },
    { name: "A' — insieme", from: 44, to: 66, note: 'Le due mani suonano la stessa melodia a un\'ottava di distanza: devono partire nello stesso istante.' },
    { name: 'Coda', from: 66, to: 80, note: 'Accordi tenuti e diminuendo fino alla corona finale.' },
  ],
  steps: seq(
    // ── A ───────────────────────────────────────────────────────────────────
    // batt. 1 — la destra sale, la sinistra tiene il Do per tutta la battuta
    s('q', 'C4', 'C3', { dyn: 'mp', fin: 1, finL: 5, leg: true, tieL: true }),
    s('q', 'D4', 'C3', { leg: true, tieL: true }),
    s('q', 'E4', 'C3', { leg: true, tieL: true }),
    s('q', 'F4', 'C3', { leg: true }),
    // batt. 2
    s('h', 'G4', 'C3', { leg: true, tieL: true }),
    s('h', 'E4', 'C3', { leg: true }),
    // batt. 3
    s('q', 'F4', 'F3', { finL: 2, leg: true, tieL: true }),
    s('q', 'E4', 'F3', { leg: true, tieL: true }),
    s('q', 'D4', 'F3', { leg: true, tieL: true }),
    s('q', 'C4', 'F3', { leg: true }),
    // batt. 4 — fine della prima frase, sospesa sul Re
    s('w', 'D4', 'G3', { finL: 1 }),
    // batt. 5
    s('q', 'E4', 'C3', { fin: 3, finL: 5, leg: true, tieL: true }),
    s('q', 'D4', 'C3', { leg: true, tieL: true }),
    s('q', 'E4', 'C3', { leg: true, tieL: true }),
    s('q', 'F4', 'C3', { leg: true }),
    // batt. 6
    s('h', 'G4', 'F3', { finL: 2, leg: true, tieL: true }),
    s('h', 'F4', 'F3', { leg: true }),
    // batt. 7
    s('q', 'E4', 'G3', { finL: 1, leg: true, tieL: true }),
    s('q', 'D4', 'G3', { leg: true, tieL: true }),
    s('q', 'C4', 'G3', { leg: true, tieL: true }),
    s('q', 'D4', 'G3', { leg: true }),
    // batt. 8 — chiusa sul Do
    s('w', 'C4', 'C3', { finL: 5 }),

    // ── B ───────────────────────────────────────────────────────────────────
    // batt. 9 — la melodia passa sotto, la destra tiene il Do4
    s('q', 'C4', 'C3', { dyn: 'mf', fin: 1, finL: 5, tie: true, legL: true }),
    s('q', 'C4', 'D3', { tie: true, legL: true }),
    s('q', 'C4', 'E3', { tie: true, legL: true }),
    s('q', 'C4', 'F3', { tie: true, legL: true }),
    // batt. 10
    s('h', 'C4', 'G3', { tie: true, finL: 1, legL: true }),
    s('h', 'C4', 'E3', { legL: true }),
    // batt. 11 — la destra cambia nota tenuta
    s('q', 'F4', 'F3', { fin: 4, finL: 2, tie: true, legL: true }),
    s('q', 'F4', 'E3', { tie: true, legL: true }),
    s('q', 'F4', 'D3', { tie: true, legL: true }),
    s('q', 'F4', 'C3', { legL: true }),
    // batt. 12
    s('w', 'D4', 'G3', { fin: 2, finL: 1 }),
    // batt. 13
    s('q', 'E4', 'E3', { fin: 3, finL: 3, tie: true, legL: true }),
    s('q', 'E4', 'F3', { tie: true, legL: true }),
    s('q', 'E4', 'G3', { tie: true, legL: true }),
    s('q', 'E4', 'F3', { tie: true, legL: true }),
    // batt. 14
    s('h', 'E4', 'E3', { tie: true, legL: true }),
    s('h', 'E4', 'C3', { legL: true }),
    // batt. 15 — le due mani in moto contrario
    s('q', 'G4', 'C3', { hair: 'cresc', fin: 5, finL: 5, leg: true, legL: true }),
    s('q', 'F4', 'D3', { leg: true, legL: true }),
    s('q', 'E4', 'E3', { leg: true, legL: true }),
    s('q', 'D4', 'F3', { leg: true, legL: true }),
    // batt. 16
    s('w', 'C4', 'C3', { fin: 1, finL: 5 }),

    // ── A' ──────────────────────────────────────────────────────────────────
    // batt. 17 — stessa melodia della prima sezione, ora nelle due mani
    s('q', 'C4', 'C3', { dyn: 'f', fin: 1, finL: 5, leg: true, legL: true }),
    s('q', 'D4', 'D3', { leg: true, legL: true }),
    s('q', 'E4', 'E3', { leg: true, legL: true }),
    s('q', 'F4', 'F3', { leg: true, legL: true }),
    // batt. 18
    s('h', 'G4', 'G3', { leg: true, legL: true }),
    s('h', 'E4', 'E3', { leg: true, legL: true }),
    // batt. 19
    s('q', 'F4', 'F3', { leg: true, legL: true }),
    s('q', 'E4', 'E3', { leg: true, legL: true }),
    s('q', 'D4', 'D3', { leg: true, legL: true }),
    s('q', 'C4', 'C3', { leg: true, legL: true }),
    // batt. 20
    s('w', 'D4', 'D3', { fin: 2, finL: 4 }),
    // batt. 21
    s('q', 'E4', 'E3', { fin: 3, finL: 3, leg: true, legL: true }),
    s('q', 'D4', 'D3', { leg: true, legL: true }),
    s('q', 'E4', 'E3', { leg: true, legL: true }),
    s('q', 'F4', 'F3', { leg: true, legL: true }),
    // batt. 22
    s('h', 'G4', 'G3', { leg: true, legL: true }),
    s('h', 'F4', 'F3', { leg: true, legL: true }),
    // batt. 23
    s('q', 'E4', 'E3', { leg: true, legL: true }),
    s('q', 'D4', 'D3', { leg: true, legL: true }),
    s('q', 'C4', 'C3', { leg: true, legL: true }),
    s('q', 'D4', 'D3', { leg: true, legL: true }),
    // batt. 24
    s('w', 'C4', 'C3', { fin: 1, finL: 5 }),

    // ── Coda ────────────────────────────────────────────────────────────────
    // batt. 25 — accordi tenuti sotto, la destra scende piano
    s('h', 'G4', ['C3', 'E3', 'G3'], { dyn: 'p', text: 'dolce', fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('h', 'F4', ['C3', 'E3', 'G3'], { leg: true }),
    // batt. 26
    s('h', 'E4', ['B2', 'D3', 'G3'], { finL: [5, 2, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('h', 'D4', ['B2', 'D3', 'G3'], { leg: true }),
    // batt. 27
    s('h', 'C4', ['C3', 'E3', 'G3'], { leg: true, tieL: true, artL: 'tenuto' }),
    s('h', 'E4', ['C3', 'E3', 'G3'], { leg: true }),
    // batt. 28
    s('w', 'D4', ['B2', 'D3', 'G3'], { artL: 'tenuto' }),
    // batt. 29 — si allarga
    s('h', 'E4', ['C3', 'E3', 'G3'], { text: 'rit.', hair: 'dim', leg: true, tieL: true }),
    s('h', 'F4', ['C3', 'E3', 'G3'], { leg: true }),
    // batt. 30
    s('h', 'G4', ['B2', 'D3', 'G3'], { leg: true, tieL: true }),
    s('h', 'E4', ['B2', 'D3', 'G3'], { leg: true }),
    // batt. 31
    s('h', 'D4', ['B2', 'D3', 'G3'], { dyn: 'pp', leg: true, tieL: true }),
    s('h', 'C4', ['B2', 'D3', 'G3'], { leg: true }),
    // batt. 32 — corona
    s('w', 'C4', ['C3', 'E3', 'G3'], { fin: 1, finL: [5, 3, 1], artB: 'fermata', bar: 'end' }),
  ),
});

// ── 2 · Fra Martino ──────────────────────────────────────────────────────────
// È un canone: la stessa melodia entra due battute dopo nell'altra mano. Primo
// giro guida la destra, secondo giro guida la sinistra.
//
//   frase 1  Do Re Mi Do            (4 semiminime)
//   frase 2  Mi Fa Sol              (semiminima, semiminima, minima)
//   frase 3  Sol La Sol Fa Mi Do    (4 crome + 2 semiminime)
//   frase 4  Do Sol Do              (semiminima, semiminima, minima)
const fraMartino = p({
  id: 'fra-martino-canone',
  title: 'Fra Martino',
  composer: 'Tradizionale',
  difficulty: 'facile',
  level: 2,
  emoji: '🔔',
  bpm: 92,
  meter: '4/4',
  key: { tonic: 'C', mode: 'maggiore' },
  tempoText: 'Allegretto, come una campana',
  hint: 'La sinistra ripete la melodia della destra con due battute di ritardo: la difficoltà è non farsi trascinare dall\'altra mano.',
  about: 'Canone popolare francese («Frère Jacques»). Qui è scritto come canone vero, a due voci reali.',
  focus: [
    'suonare due frasi diverse insieme senza confondersi',
    'entrare in tempo dopo due battute di attesa',
    'le crome della terza frase, uguali in tutte e due le mani',
  ],
  sections: [
    { name: 'Giro 1 — guida la destra', from: 0, to: 46, note: 'La sinistra entra alla battuta 3. Studia prima le mani separate, poi conta ad alta voce.' },
    { name: 'Giro 2 — guida la sinistra', from: 46, to: 92, note: 'Stesse note, ruoli scambiati: adesso è la destra a dover aspettare.' },
    { name: 'Coda', from: 92, to: 98, note: 'Le due mani finalmente insieme, in ottava, con la corona sull\'ultimo Do.' },
  ],
  steps: seq(
    // ── Giro 1: la destra espone, la sinistra imita ─────────────────────────
    // batt. 1 — frase 1 (destra sola)
    s('q', 'C4', undefined, { dyn: 'mp', fin: 1, leg: true }),
    s('q', 'D4', undefined, { leg: true }),
    s('q', 'E4', undefined, { leg: true }),
    s('q', 'C4', undefined, {}),
    // batt. 2 — frase 1 ripetuta
    s('q', 'C4', undefined, { fin: 1, leg: true }),
    s('q', 'D4', undefined, { leg: true }),
    s('q', 'E4', undefined, { leg: true }),
    s('q', 'C4', undefined, {}),
    // batt. 3 — destra frase 2 · entra la sinistra con la frase 1
    s('q', 'E4', 'C3', { fin: 3, finL: 5, leg: true, legL: true }),
    s('q', 'F4', 'D3', { leg: true, legL: true }),
    s('q', 'G4', 'E3', { tie: true, legL: true }),
    s('q', 'G4', 'C3', {}),
    // batt. 4
    s('q', 'E4', 'C3', { fin: 3, finL: 5, leg: true, legL: true }),
    s('q', 'F4', 'D3', { leg: true, legL: true }),
    s('q', 'G4', 'E3', { tie: true, legL: true }),
    s('q', 'G4', 'C3', {}),
    // batt. 5 — destra frase 3 (crome) · sinistra frase 2
    s('8', 'G4', 'E3', { fin: 5, finL: 3, leg: true, tieL: true }),
    s('8', 'A4', 'E3', { leg: true }),
    s('8', 'G4', 'F3', { leg: true, tieL: true }),
    s('8', 'F4', 'F3', { leg: true }),
    s('q', 'E4', 'G3', { leg: true, finL: 1, tieL: true }),
    s('q', 'C4', 'G3', {}),
    // batt. 6
    s('8', 'G4', 'E3', { hair: 'cresc', fin: 5, finL: 3, leg: true, tieL: true }),
    s('8', 'A4', 'E3', { leg: true }),
    s('8', 'G4', 'F3', { leg: true, tieL: true }),
    s('8', 'F4', 'F3', { leg: true }),
    s('q', 'E4', 'G3', { leg: true, finL: 1, tieL: true }),
    s('q', 'C4', 'G3', {}),
    // batt. 7 — destra frase 4 · sinistra frase 3
    s('8', 'C4', 'G3', { dyn: 'mf', fin: 4, finL: 2, tie: true }),
    s('8', 'C4', 'A3', { finL: 1 }),
    s('8', 'G3', 'G3', { fin: 1, finL: 2, tie: true }),
    s('8', 'G3', 'F3', { finL: 3 }),
    s('q', 'C4', 'E3', { fin: 4, tie: true, finL: 4 }),
    s('q', 'C4', 'C3', { finL: 5 }),
    // batt. 8
    s('8', 'C4', 'G3', { fin: 4, finL: 2, tie: true }),
    s('8', 'C4', 'A3', { finL: 1 }),
    s('8', 'G3', 'G3', { fin: 1, finL: 2, tie: true }),
    s('8', 'G3', 'F3', { finL: 3 }),
    s('q', 'C4', 'E3', { fin: 4, tie: true, finL: 4 }),
    s('q', 'C4', 'C3', { finL: 5 }),
    // batt. 9 — la destra tiene, la sinistra chiude il canone (frase 4)
    s('q', ['C4', 'E4'], 'C3', { fin: [1, 3], finL: 1, tie: true }),
    s('q', ['C4', 'E4'], 'G2', { finL: 5, tie: true }),
    s('h', ['C4', 'E4'], 'C3', { finL: 1, tie: true }),
    // batt. 10
    s('q', ['C4', 'E4'], 'C3', { finL: 1, tie: true }),
    s('q', ['C4', 'E4'], 'G2', { finL: 5, tie: true }),
    s('h', ['C4', 'E4'], 'C3', { finL: 1 }),

    // ── Giro 2: la sinistra espone, la destra imita ─────────────────────────
    // batt. 11 — frase 1 (sinistra sola)
    s('q', undefined, 'C3', { dyn: 'p', finL: 5, legL: true }),
    s('q', undefined, 'D3', { legL: true }),
    s('q', undefined, 'E3', { legL: true }),
    s('q', undefined, 'C3', {}),
    // batt. 12
    s('q', undefined, 'C3', { finL: 5, legL: true }),
    s('q', undefined, 'D3', { legL: true }),
    s('q', undefined, 'E3', { legL: true }),
    s('q', undefined, 'C3', {}),
    // batt. 13 — sinistra frase 2 · entra la destra con la frase 1
    s('q', 'C4', 'E3', { fin: 1, finL: 3, leg: true, legL: true }),
    s('q', 'D4', 'F3', { leg: true, legL: true }),
    s('q', 'E4', 'G3', { leg: true, finL: 1, tieL: true }),
    s('q', 'C4', 'G3', {}),
    // batt. 14
    s('q', 'C4', 'E3', { fin: 1, finL: 3, leg: true, legL: true }),
    s('q', 'D4', 'F3', { leg: true, legL: true }),
    s('q', 'E4', 'G3', { leg: true, finL: 1, tieL: true }),
    s('q', 'C4', 'G3', {}),
    // batt. 15 — sinistra frase 3 (crome) · destra frase 2
    s('8', 'E4', 'G3', { fin: 3, finL: 2, tie: true, legL: true }),
    s('8', 'E4', 'A3', { finL: 1, legL: true }),
    s('8', 'F4', 'G3', { tie: true, finL: 2, legL: true }),
    s('8', 'F4', 'F3', { finL: 3, legL: true }),
    s('q', 'G4', 'E3', { tie: true, finL: 4, legL: true }),
    s('q', 'G4', 'C3', { finL: 5 }),
    // batt. 16
    s('8', 'E4', 'G3', { hair: 'cresc', fin: 3, finL: 2, tie: true, legL: true }),
    s('8', 'E4', 'A3', { finL: 1, legL: true }),
    s('8', 'F4', 'G3', { tie: true, finL: 2, legL: true }),
    s('8', 'F4', 'F3', { finL: 3, legL: true }),
    s('q', 'G4', 'E3', { tie: true, finL: 4, legL: true }),
    s('q', 'G4', 'C3', { finL: 5 }),
    // batt. 17 — sinistra frase 4 · destra frase 3
    s('8', 'G4', 'C3', { dyn: 'f', fin: 5, finL: 1, leg: true, tieL: true }),
    s('8', 'A4', 'C3', { leg: true }),
    s('8', 'G4', 'G2', { leg: true, finL: 5, tieL: true }),
    s('8', 'F4', 'G2', { leg: true }),
    s('q', 'E4', 'C3', { leg: true, finL: 1, tieL: true }),
    s('q', 'C4', 'C3', {}),
    // batt. 18
    s('8', 'G4', 'C3', { fin: 5, finL: 1, leg: true, tieL: true }),
    s('8', 'A4', 'C3', { leg: true }),
    s('8', 'G4', 'G2', { leg: true, finL: 5, tieL: true }),
    s('8', 'F4', 'G2', { leg: true }),
    s('q', 'E4', 'C3', { leg: true, finL: 1, tieL: true }),
    s('q', 'C4', 'C3', {}),
    // batt. 19 — la sinistra tiene il Do, la destra chiude il canone
    s('q', 'C4', 'C3', { fin: 4, finL: 5, tieL: true }),
    s('q', 'G3', 'C3', { fin: 1, tieL: true }),
    s('h', 'C4', 'C3', { fin: 4, tie: true, tieL: true }),
    // batt. 20
    s('q', 'C4', 'C3', { tieL: true }),
    s('q', 'G3', 'C3', { fin: 1, tieL: true }),
    s('h', 'C4', 'C3', { fin: 4 }),

    // ── Coda: insieme, in ottava ────────────────────────────────────────────
    // batt. 21
    s('q', 'C4', 'C3', { dyn: 'mf', text: 'rit.', fin: 4, finL: 1, artB: 'tenuto' }),
    s('q', 'G3', 'G2', { fin: 1, finL: 5, artB: 'tenuto' }),
    s('h', 'C4', 'C3', { fin: 4, finL: 1, artB: 'tenuto' }),
    // batt. 22
    s('q', 'C4', 'C3', { dyn: 'p', artB: 'tenuto' }),
    s('q', 'G3', 'G2', { fin: 1, finL: 5, artB: 'tenuto' }),
    s('h', 'C4', 'C3', { fin: 4, finL: 1, artB: 'fermata', bar: 'end' }),
  ),
});

// ── 3 · Brilla brilla ────────────────────────────────────────────────────────
// Forma A–B–B–A, due volte: la prima con la sinistra in accordi tenuti, la
// seconda con la sinistra che si muove in semiminime. Il tema è quello di
// «Ah, vous dirai-je maman», su cui Mozart scrisse le sue dodici variazioni.
//
//   A   Do Do Sol Sol | La La Sol— | Fa Fa Mi Mi | Re Re Do—
//   B   Sol Sol Fa Fa | Mi Mi Re—  | (ripetuta)
const brillaBrilla = p({
  id: 'brilla-brilla',
  title: 'Brilla brilla',
  composer: 'Tradizionale',
  difficulty: 'facile',
  level: 3,
  emoji: '⭐',
  bpm: 96,
  meter: '4/4',
  key: { tonic: 'C', mode: 'maggiore' },
  tempoText: 'Moderato',
  hint: 'La forma intera A–B–B–A suonata due volte: la seconda con la sinistra che si muove, ed è lì che serve attenzione.',
  about: 'La melodia francese di «Ah, vous dirai-je maman», quella su cui Mozart scrisse le variazioni K. 265.',
  focus: [
    'la mano destra allarga appena per prendere il La4 col mignolo',
    'accordi di due note nella sinistra, tenuti per tutta la battuta',
    'nella variazione la sinistra suona bassi staccati mentre la destra resta legata',
  ],
  sections: [
    { name: 'A — il tema', from: 0, to: 14, note: 'Sinistra: due note tenute per tutta la battuta. Tienile davvero giù.' },
    { name: 'B — la parte centrale', from: 14, to: 28, note: 'Solo due frasi discendenti: cerca di dirle piano, come un\'eco.' },
    { name: 'B — ripetuta', from: 28, to: 42, note: 'Stesse note, un filo più sonore: è una ripetizione, non una fotocopia.' },
    { name: 'A — ritorno', from: 42, to: 56, note: 'Ritorna il tema. Chiudi la frase sul Do senza fretta.' },
    { name: 'Variazione — A', from: 56, to: 72, note: 'La sinistra passa alle semiminime staccate: il polso resta morbido, la destra continua legata.' },
    { name: 'Variazione — B', from: 72, to: 88, note: 'Attenzione ai cambi di accordo a metà battuta.' },
    { name: 'Variazione — B ripetuta', from: 88, to: 104, note: 'Uguale, ma più piena: qui è il punto più forte del pezzo.' },
    { name: 'Variazione — A e finale', from: 104, to: 120, note: 'Ultime quattro battute in diminuendo, poi la corona sull\'accordo di Do.' },
  ],
  steps: seq(
    // ── Primo giro: sinistra in accordi tenuti ──────────────────────────────
    // batt. 1
    s('q', 'C4', ['C3', 'G3'], { dyn: 'mp', fin: 1, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'C4', ['C3', 'G3'], { leg: true, tieL: true }),
    s('q', 'G4', ['C3', 'G3'], { fin: 5, leg: true, tieL: true }),
    s('q', 'G4', ['C3', 'G3'], { leg: true }),
    // batt. 2
    s('q', 'A4', ['F2', 'C3'], { fin: 5, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'A4', ['F2', 'C3'], { leg: true }),
    s('h', 'G4', ['C3', 'G3'], { fin: 5, finL: [5, 1] }),
    // batt. 3
    s('q', 'F4', ['F2', 'C3'], { fin: 4, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'F4', ['F2', 'C3'], { leg: true }),
    s('q', 'E4', ['C3', 'G3'], { fin: 3, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'E4', ['C3', 'G3'], { leg: true }),
    // batt. 4
    s('q', 'D4', ['G2', 'D3'], { fin: 2, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'D4', ['G2', 'D3'], { leg: true }),
    s('h', 'C4', ['C3', 'G3'], { fin: 1, finL: [5, 1] }),
    // batt. 5 — B, come un'eco
    s('q', 'G4', ['C3', 'G3'], { dyn: 'p', fin: 5, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'G4', ['C3', 'G3'], { leg: true }),
    s('q', 'F4', ['F2', 'C3'], { fin: 4, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'F4', ['F2', 'C3'], { leg: true }),
    // batt. 6
    s('q', 'E4', ['C3', 'G3'], { fin: 3, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'E4', ['C3', 'G3'], { leg: true }),
    s('h', 'D4', ['G2', 'D3'], { fin: 2, finL: [5, 1] }),
    // batt. 7
    s('q', 'G4', ['C3', 'G3'], { fin: 5, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'G4', ['C3', 'G3'], { leg: true }),
    s('q', 'F4', ['F2', 'C3'], { fin: 4, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'F4', ['F2', 'C3'], { leg: true }),
    // batt. 8
    s('q', 'E4', ['C3', 'G3'], { fin: 3, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'E4', ['C3', 'G3'], { leg: true }),
    s('h', 'D4', ['G2', 'D3'], { fin: 2, finL: [5, 1] }),
    // batt. 9 — B ripetuta
    s('q', 'G4', ['C3', 'G3'], { dyn: 'mp', fin: 5, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'G4', ['C3', 'G3'], { leg: true }),
    s('q', 'F4', ['F2', 'C3'], { finL: [5, 1], leg: true, tieL: true }),
    s('q', 'F4', ['F2', 'C3'], { leg: true }),
    // batt. 10
    s('q', 'E4', ['C3', 'G3'], { finL: [5, 1], leg: true, tieL: true }),
    s('q', 'E4', ['C3', 'G3'], { leg: true }),
    s('h', 'D4', ['G2', 'D3'], { finL: [5, 1] }),
    // batt. 11
    s('q', 'G4', ['C3', 'G3'], { fin: 5, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'G4', ['C3', 'G3'], { leg: true }),
    s('q', 'F4', ['F2', 'C3'], { finL: [5, 1], leg: true, tieL: true }),
    s('q', 'F4', ['F2', 'C3'], { leg: true }),
    // batt. 12
    s('q', 'E4', ['C3', 'G3'], { finL: [5, 1], leg: true, tieL: true }),
    s('q', 'E4', ['C3', 'G3'], { leg: true }),
    s('h', 'D4', ['G2', 'D3'], { finL: [5, 1] }),
    // batt. 13 — ritorna A
    s('q', 'C4', ['C3', 'G3'], { fin: 1, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'C4', ['C3', 'G3'], { leg: true, tieL: true }),
    s('q', 'G4', ['C3', 'G3'], { fin: 5, leg: true, tieL: true }),
    s('q', 'G4', ['C3', 'G3'], { leg: true }),
    // batt. 14
    s('q', 'A4', ['F2', 'C3'], { fin: 5, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'A4', ['F2', 'C3'], { leg: true }),
    s('h', 'G4', ['C3', 'G3'], { finL: [5, 1] }),
    // batt. 15
    s('q', 'F4', ['F2', 'C3'], { fin: 4, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'F4', ['F2', 'C3'], { leg: true }),
    s('q', 'E4', ['C3', 'G3'], { finL: [5, 1], leg: true, tieL: true }),
    s('q', 'E4', ['C3', 'G3'], { leg: true }),
    // batt. 16
    s('q', 'D4', ['G2', 'D3'], { fin: 2, finL: [5, 1], leg: true, tieL: true }),
    s('q', 'D4', ['G2', 'D3'], { leg: true }),
    s('h', 'C4', ['C3', 'G3'], { fin: 1, finL: [5, 1] }),

    // ── Secondo giro: la sinistra si muove ──────────────────────────────────
    // batt. 17
    s('q', 'C4', 'C3', { dyn: 'f', fin: 1, finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'C4', 'G3', { leg: true, finL: 1 }),
    s('q', 'G4', 'E3', { fin: 5, leg: true, finL: 3, artL: 'staccato' }),
    s('q', 'G4', 'G3', { leg: true, finL: 1 }),
    // batt. 18
    s('q', 'A4', 'F2', { fin: 5, finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'A4', 'C3', { leg: true, finL: 1 }),
    s('q', 'G4', 'C3', { tie: true, finL: 5, artL: 'staccato' }),
    s('q', 'G4', 'G3', { finL: 1 }),
    // batt. 19
    s('q', 'F4', 'F2', { fin: 4, finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'F4', 'C3', { leg: true, finL: 1 }),
    s('q', 'E4', 'C3', { fin: 3, leg: true, finL: 5, artL: 'staccato' }),
    s('q', 'E4', 'G3', { leg: true, finL: 1 }),
    // batt. 20
    s('q', 'D4', 'G2', { fin: 2, finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'D4', 'D3', { leg: true, finL: 1 }),
    s('q', 'C4', 'C3', { fin: 1, tie: true, finL: 5, artL: 'staccato' }),
    s('q', 'C4', 'G3', { finL: 1 }),
    // batt. 21 — B
    s('q', 'G4', 'C3', { dyn: 'mf', fin: 5, finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'G4', 'G3', { leg: true, finL: 1 }),
    s('q', 'F4', 'F2', { fin: 4, leg: true, finL: 5, artL: 'staccato' }),
    s('q', 'F4', 'C3', { leg: true, finL: 1 }),
    // batt. 22
    s('q', 'E4', 'C3', { fin: 3, finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'E4', 'G3', { leg: true, finL: 1 }),
    s('q', 'D4', 'G2', { fin: 2, tie: true, finL: 5, artL: 'staccato' }),
    s('q', 'D4', 'D3', { finL: 1 }),
    // batt. 23
    s('q', 'G4', 'C3', { fin: 5, finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'G4', 'G3', { leg: true, finL: 1 }),
    s('q', 'F4', 'F2', { leg: true, finL: 5, artL: 'staccato' }),
    s('q', 'F4', 'C3', { leg: true, finL: 1 }),
    // batt. 24
    s('q', 'E4', 'C3', { finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'E4', 'G3', { leg: true, finL: 1 }),
    s('q', 'D4', 'G2', { tie: true, finL: 5, artL: 'staccato' }),
    s('q', 'D4', 'D3', { finL: 1 }),
    // batt. 25 — B ripetuta, la più piena
    s('q', 'G4', 'C3', { dyn: 'f', hair: 'cresc', fin: 5, finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'G4', 'G3', { leg: true, finL: 1 }),
    s('q', 'F4', 'F2', { leg: true, finL: 5, artL: 'staccato' }),
    s('q', 'F4', 'C3', { leg: true, finL: 1 }),
    // batt. 26
    s('q', 'E4', 'C3', { hair: 'end', finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'E4', 'G3', { leg: true, finL: 1 }),
    s('q', 'D4', 'G2', { tie: true, finL: 5, artL: 'staccato' }),
    s('q', 'D4', 'D3', { finL: 1 }),
    // batt. 27
    s('q', 'G4', 'C3', { fin: 5, finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'G4', 'G3', { leg: true, finL: 1 }),
    s('q', 'F4', 'F2', { leg: true, finL: 5, artL: 'staccato' }),
    s('q', 'F4', 'C3', { leg: true, finL: 1 }),
    // batt. 28
    s('q', 'E4', 'C3', { finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'E4', 'G3', { leg: true, finL: 1 }),
    s('q', 'D4', 'G2', { tie: true, finL: 5, artL: 'staccato' }),
    s('q', 'D4', 'D3', { finL: 1 }),
    // batt. 29 — ultimo ritorno di A
    s('q', 'C4', 'C3', { dyn: 'mf', fin: 1, finL: 5, leg: true, artL: 'staccato' }),
    s('q', 'C4', 'G3', { leg: true, finL: 1 }),
    s('q', 'G4', 'E3', { fin: 5, leg: true, finL: 3 }),
    s('q', 'G4', 'G3', { leg: true, finL: 1 }),
    // batt. 30
    s('q', 'A4', 'F2', { fin: 5, finL: 5, leg: true }),
    s('q', 'A4', 'C3', { leg: true, finL: 1 }),
    s('q', 'G4', 'C3', { tie: true, finL: 5 }),
    s('q', 'G4', 'G3', { finL: 1 }),
    // batt. 31 — si allarga
    s('q', 'F4', 'F2', { dyn: 'p', text: 'rit.', hair: 'dim', fin: 4, finL: 5, leg: true }),
    s('q', 'F4', 'C3', { leg: true, finL: 1 }),
    s('q', 'E4', 'C3', { fin: 3, leg: true, finL: 5 }),
    s('q', 'E4', 'G3', { leg: true, finL: 1 }),
    // batt. 32
    s('q', 'D4', 'G2', { fin: 2, finL: 5, leg: true }),
    s('q', 'D4', 'D3', { leg: true, finL: 1 }),
    s('h', 'C4', ['C3', 'E3', 'G3'], { fin: 1, finL: [5, 3, 1], leg: true }),
    // batt. 33 — corona
    s('w', 'C4', ['C3', 'E3', 'G3'], { dyn: 'pp', fin: 1, finL: [5, 3, 1], artB: 'fermata', bar: 'end' }),
  ),
});

// ── 4 · Inno alla gioia ──────────────────────────────────────────────────────
// Il tema completo della Nona: sedici battute, quattro frasi (a a' b a'). Qui
// in Sol maggiore, dove sta tutto sotto le cinque dita (1 = Sol4, 5 = Re5).
// La melodia non usa mai il Fa♯: l'unico Fa♯ è negli accordi della sinistra.
//
//   a   Si Si Do Re | Re Do Si La | Sol Sol La Si | Si. La La
//   a'  … | … | … | La. Sol Sol
//   b   La La Si Sol | La Si Do Si Sol | La Si Do Si La | Sol La Re
//   a'  come sopra
//
// Accordi della sinistra: SOL = Sol2 Si2 Re3 · DO = Do3 Mi3 Sol3 · RE = La2 Re3 Fa♯3
const innoAllaGioia = p({
  id: 'beethoven-inno-alla-gioia',
  title: 'Inno alla gioia',
  composer: 'L. van Beethoven',
  difficulty: 'facile',
  level: 4,
  emoji: '🕊️',
  bpm: 88,
  meter: '4/4',
  key: { tonic: 'G', mode: 'maggiore' },
  tempoText: 'Andante maestoso',
  hint: 'Sedici battute vere, poi ripetute forte con la sinistra che si muove: la difficoltà è il ritmo puntato di fine frase.',
  about: 'Il tema del finale della Nona sinfonia di Beethoven, nella forma in cui lo canta il coro.',
  focus: [
    'la figura puntata (semiminima col punto + croma) alla fine di ogni frase',
    'accordi di tre note nella sinistra, tenuti per due movimenti',
    'la frase centrale, dove la destra fa due crome in mezzo alle semiminime',
  ],
  sections: [
    { name: 'a — prima frase', from: 0, to: 15, note: 'Quattro battute. L\'ultima ha il ritmo puntato: conta «un-due-e».' },
    { name: "a' — seconda frase", from: 15, to: 30, note: 'Uguale alla prima, ma finisce sul Sol invece che sul La: qui la frase chiude.' },
    { name: 'b — la frase centrale', from: 30, to: 47, note: 'Le crome. Studiale lente e separate: sono le uniche note veloci del pezzo.' },
    { name: 'a\' — ritorno', from: 47, to: 62, note: 'Ritorna il tema, piano: è un\'eco prima della ripresa forte.' },
    { name: 'Ripresa forte — a', from: 62, to: 79, note: 'La sinistra passa a basso + accordo su ogni movimento. Il basso pesa, l\'accordo no.' },
    { name: "Ripresa forte — a'", from: 79, to: 96, note: 'Stessa mano sinistra. Tieni la destra legata sopra i colpi della sinistra.' },
    { name: 'Ripresa forte — b', from: 96, to: 114, note: 'La frase centrale con la sinistra in movimento: è il punto più difficile del brano.' },
    { name: 'Finale', from: 114, to: 132, note: 'Ultima frase, poi rallentando fino alla corona sul Sol.' },
  ],
  steps: seq(
    // ── Prima esposizione: sinistra in accordi di due movimenti ─────────────
    // batt. 1 — SOL | DO
    s('q', 'B4', ['G2', 'B2', 'D3'], { dyn: 'p', text: 'cantabile', fin: 3, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'B4', ['G2', 'B2', 'D3'], { leg: true }),
    s('q', 'C5', ['C3', 'E3', 'G3'], { fin: 4, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'D5', ['C3', 'E3', 'G3'], { fin: 5, leg: true }),
    // batt. 2 — SOL | RE
    s('q', 'D5', ['G2', 'B2', 'D3'], { finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'C5', ['G2', 'B2', 'D3'], { leg: true }),
    s('q', 'B4', ['A2', 'D3', 'F#3'], { finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'A4', ['A2', 'D3', 'F#3'], { leg: true }),
    // batt. 3 — SOL | RE
    s('q', 'G4', ['G2', 'B2', 'D3'], { fin: 1, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'G4', ['G2', 'B2', 'D3'], { leg: true }),
    s('q', 'A4', ['A2', 'D3', 'F#3'], { fin: 2, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'B4', ['A2', 'D3', 'F#3'], { fin: 3, leg: true }),
    // batt. 4 — SOL | RE · il ritmo puntato
    s('qd', 'B4', ['G2', 'B2', 'D3'], { finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'A4', ['G2', 'B2', 'D3'], { fin: 2, leg: true }),
    s('h', 'A4', ['A2', 'D3', 'F#3'], { finL: [5, 3, 1], artL: 'tenuto' }),
    // batt. 5 — SOL | DO
    s('q', 'B4', ['G2', 'B2', 'D3'], { dyn: 'mp', fin: 3, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'B4', ['G2', 'B2', 'D3'], { leg: true }),
    s('q', 'C5', ['C3', 'E3', 'G3'], { fin: 4, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'D5', ['C3', 'E3', 'G3'], { fin: 5, leg: true }),
    // batt. 6 — SOL | RE
    s('q', 'D5', ['G2', 'B2', 'D3'], { finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'C5', ['G2', 'B2', 'D3'], { leg: true }),
    s('q', 'B4', ['A2', 'D3', 'F#3'], { finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'A4', ['A2', 'D3', 'F#3'], { leg: true }),
    // batt. 7 — SOL | RE
    s('q', 'G4', ['G2', 'B2', 'D3'], { fin: 1, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'G4', ['G2', 'B2', 'D3'], { leg: true }),
    s('q', 'A4', ['A2', 'D3', 'F#3'], { fin: 2, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'B4', ['A2', 'D3', 'F#3'], { fin: 3, leg: true }),
    // batt. 8 — RE | SOL · la frase chiude sul Sol
    s('qd', 'A4', ['A2', 'D3', 'F#3'], { fin: 2, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'G4', ['A2', 'D3', 'F#3'], { fin: 1, leg: true }),
    s('h', 'G4', ['G2', 'B2', 'D3'], { finL: [5, 3, 1], artL: 'tenuto' }),
    // batt. 9 — RE | SOL · comincia la frase centrale
    s('q', 'A4', ['A2', 'D3', 'F#3'], { dyn: 'mf', fin: 2, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'A4', ['A2', 'D3', 'F#3'], { leg: true }),
    s('q', 'B4', ['G2', 'B2', 'D3'], { fin: 3, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'G4', ['G2', 'B2', 'D3'], { fin: 1, leg: true }),
    // batt. 10 — RE | SOL · le crome
    s('q', 'A4', ['A2', 'D3', 'F#3'], { fin: 2, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'B4', ['A2', 'D3', 'F#3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'C5', ['A2', 'D3', 'F#3'], { fin: 4, leg: true }),
    s('q', 'B4', ['G2', 'B2', 'D3'], { finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'G4', ['G2', 'B2', 'D3'], { fin: 1, leg: true }),
    // batt. 11 — RE per tutta la battuta
    s('q', 'A4', ['A2', 'D3', 'F#3'], { fin: 2, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'B4', ['A2', 'D3', 'F#3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'C5', ['A2', 'D3', 'F#3'], { fin: 4, leg: true, tieL: true }),
    s('q', 'B4', ['A2', 'D3', 'F#3'], { leg: true, tieL: true }),
    s('q', 'A4', ['A2', 'D3', 'F#3'], { fin: 2, leg: true }),
    // batt. 12 — SOL | RE · la destra scende sotto la posizione
    s('q', 'G4', ['G2', 'B2', 'D3'], { fin: 1, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'A4', ['G2', 'B2', 'D3'], { fin: 2, leg: true }),
    s('h', 'D4', ['A2', 'D3', 'F#3'], { fin: 1, finL: [5, 3, 1], artL: 'tenuto' }),
    // batt. 13 — SOL | DO · ritorna il tema, piano
    s('q', 'B4', ['G2', 'B2', 'D3'], { dyn: 'p', fin: 3, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'B4', ['G2', 'B2', 'D3'], { leg: true }),
    s('q', 'C5', ['C3', 'E3', 'G3'], { fin: 4, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'D5', ['C3', 'E3', 'G3'], { fin: 5, leg: true }),
    // batt. 14 — SOL | RE
    s('q', 'D5', ['G2', 'B2', 'D3'], { finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'C5', ['G2', 'B2', 'D3'], { leg: true }),
    s('q', 'B4', ['A2', 'D3', 'F#3'], { finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'A4', ['A2', 'D3', 'F#3'], { leg: true }),
    // batt. 15 — SOL | RE
    s('q', 'G4', ['G2', 'B2', 'D3'], { fin: 1, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'G4', ['G2', 'B2', 'D3'], { leg: true }),
    s('q', 'A4', ['A2', 'D3', 'F#3'], { fin: 2, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'B4', ['A2', 'D3', 'F#3'], { fin: 3, leg: true }),
    // batt. 16 — RE | SOL
    s('qd', 'A4', ['A2', 'D3', 'F#3'], { fin: 2, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'G4', ['A2', 'D3', 'F#3'], { fin: 1, leg: true }),
    s('h', 'G4', ['G2', 'B2', 'D3'], { finL: [5, 3, 1], artL: 'tenuto', bar: 'double' }),

    // ── Ripresa: sinistra in basso + accordo su ogni movimento ──────────────
    // batt. 17 — SOL | DO
    s('q', 'B4', 'G2', { dyn: 'f', fin: 3, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'B4', ['B2', 'D3'], { leg: true, finL: [3, 1] }),
    s('q', 'C5', 'C3', { fin: 4, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'D5', ['E3', 'G3'], { fin: 5, leg: true, finL: [3, 1] }),
    // batt. 18 — SOL | RE
    s('q', 'D5', 'G2', { finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'C5', ['B2', 'D3'], { leg: true, finL: [3, 1] }),
    s('q', 'B4', 'A2', { finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'A4', ['D3', 'F#3'], { leg: true, finL: [3, 1] }),
    // batt. 19 — SOL | RE
    s('q', 'G4', 'G2', { fin: 1, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'G4', ['B2', 'D3'], { leg: true, finL: [3, 1] }),
    s('q', 'A4', 'A2', { fin: 2, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'B4', ['D3', 'F#3'], { fin: 3, leg: true, finL: [3, 1] }),
    // batt. 20 — SOL | RE
    s('q', 'B4', 'G2', { tie: true, finL: 5, leg: true, artL: 'tenuto' }),
    s('8', 'B4', ['B2', 'D3'], { leg: true, finL: [3, 1], tieL: true }),
    s('8', 'A4', ['B2', 'D3'], { fin: 2, leg: true }),
    s('q', 'A4', 'A2', { tie: true, finL: 5, artL: 'tenuto' }),
    s('q', 'A4', ['D3', 'F#3'], { finL: [3, 1] }),
    // batt. 21 — SOL | DO
    s('q', 'B4', 'G2', { fin: 3, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'B4', ['B2', 'D3'], { leg: true, finL: [3, 1] }),
    s('q', 'C5', 'C3', { fin: 4, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'D5', ['E3', 'G3'], { fin: 5, leg: true, finL: [3, 1] }),
    // batt. 22 — SOL | RE
    s('q', 'D5', 'G2', { finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'C5', ['B2', 'D3'], { leg: true, finL: [3, 1] }),
    s('q', 'B4', 'A2', { finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'A4', ['D3', 'F#3'], { leg: true, finL: [3, 1] }),
    // batt. 23 — SOL | RE
    s('q', 'G4', 'G2', { fin: 1, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'G4', ['B2', 'D3'], { leg: true, finL: [3, 1] }),
    s('q', 'A4', 'A2', { fin: 2, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'B4', ['D3', 'F#3'], { fin: 3, leg: true, finL: [3, 1] }),
    // batt. 24 — RE | SOL
    s('q', 'A4', 'A2', { fin: 2, tie: true, finL: 5, leg: true, artL: 'tenuto' }),
    s('8', 'A4', ['D3', 'F#3'], { leg: true, finL: [3, 1], tieL: true }),
    s('8', 'G4', ['D3', 'F#3'], { fin: 1, leg: true }),
    s('q', 'G4', 'G2', { tie: true, finL: 5, artL: 'tenuto' }),
    s('q', 'G4', ['B2', 'D3'], { finL: [3, 1] }),
    // batt. 25 — RE | SOL · frase centrale
    s('q', 'A4', 'A2', { fin: 2, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'A4', ['D3', 'F#3'], { leg: true, finL: [3, 1] }),
    s('q', 'B4', 'G2', { fin: 3, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'G4', ['B2', 'D3'], { fin: 1, leg: true, finL: [3, 1] }),
    // batt. 26 — RE | SOL
    s('q', 'A4', 'A2', { fin: 2, finL: 5, leg: true, artL: 'tenuto' }),
    s('8', 'B4', ['D3', 'F#3'], { fin: 3, leg: true, finL: [3, 1], tieL: true }),
    s('8', 'C5', ['D3', 'F#3'], { fin: 4, leg: true }),
    s('q', 'B4', 'G2', { finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'G4', ['B2', 'D3'], { fin: 1, leg: true, finL: [3, 1] }),
    // batt. 27 — RE per tutta la battuta
    s('q', 'A4', 'A2', { fin: 2, finL: 5, leg: true, artL: 'tenuto' }),
    s('8', 'B4', ['D3', 'F#3'], { fin: 3, leg: true, finL: [3, 1], tieL: true }),
    s('8', 'C5', ['D3', 'F#3'], { fin: 4, leg: true }),
    s('q', 'B4', 'A2', { finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'A4', ['D3', 'F#3'], { fin: 2, leg: true, finL: [3, 1] }),
    // batt. 28 — SOL | RE
    s('q', 'G4', 'G2', { fin: 1, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'A4', ['B2', 'D3'], { fin: 2, leg: true, finL: [3, 1] }),
    s('q', 'D4', 'A2', { fin: 1, tie: true, finL: 5, artL: 'tenuto' }),
    s('q', 'D4', ['D3', 'F#3'], { finL: [3, 1] }),
    // batt. 29 — SOL | DO · ultima frase
    s('q', 'B4', 'G2', { fin: 3, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'B4', ['B2', 'D3'], { leg: true, finL: [3, 1] }),
    s('q', 'C5', 'C3', { fin: 4, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'D5', ['E3', 'G3'], { fin: 5, leg: true, finL: [3, 1] }),
    // batt. 30 — SOL | RE
    s('q', 'D5', 'G2', { finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'C5', ['B2', 'D3'], { leg: true, finL: [3, 1] }),
    s('q', 'B4', 'A2', { finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'A4', ['D3', 'F#3'], { leg: true, finL: [3, 1] }),
    // batt. 31 — SOL | RE · si allarga
    s('q', 'G4', 'G2', { text: 'rit.', hair: 'dim', fin: 1, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'G4', ['B2', 'D3'], { leg: true, finL: [3, 1] }),
    s('q', 'A4', 'A2', { fin: 2, finL: 5, leg: true, artL: 'tenuto' }),
    s('q', 'B4', ['D3', 'F#3'], { fin: 3, leg: true, finL: [3, 1] }),
    // batt. 32 — RE | SOL
    s('q', 'A4', 'A2', { dyn: 'mp', fin: 2, tie: true, finL: 5, leg: true, artL: 'tenuto' }),
    s('8', 'A4', ['D3', 'F#3'], { leg: true, finL: [3, 1], tieL: true }),
    s('8', 'G4', ['D3', 'F#3'], { fin: 1, leg: true }),
    s('q', 'G4', 'G2', { tie: true, finL: 5, artL: 'tenuto' }),
    s('q', 'G4', ['B2', 'D3'], { finL: [3, 1] }),
    // batt. 33 — corona
    s('w', 'G4', ['G2', 'B2', 'D3'], { dyn: 'p', fin: 1, finL: [5, 3, 1], artB: 'fermata', bar: 'end' }),
  ),
});

// ── 5 · Ninna nanna di Brahms ────────────────────────────────────────────────
// Op. 49 n. 4, in Re maggiore, con il levare di due crome. Le due strofe sono
// scritte per intero: la melodia è identica, cambia solo il colore.
// La sinistra tiene un accordo per battuta, legatissimo — non si stacca mai.
//
//   Accordi: RE = Re3 Fa♯3 La3 · LA7 = La2 Do♯3 Sol3 · SOL = Sol2 Si2 Re3
const ninnaNanna = p({
  id: 'brahms-ninna-nanna',
  title: 'Ninna nanna',
  composer: 'J. Brahms',
  difficulty: 'facile',
  level: 5,
  emoji: '🌙',
  bpm: 84,
  meter: '3/4',
  key: { tonic: 'D', mode: 'maggiore' },
  pickup: 1,
  tempoText: 'Andante, dolce',
  hint: 'Due strofe intere in 3/4, con il levare. La destra cambia posizione quattro volte per battuta gruppo: le diteggiature dicono dove.',
  about: 'Il «Wiegenlied» op. 49 n. 4 che Brahms scrisse nel 1868 per il figlio di un\'amica viennese.',
  focus: [
    'partire in levare, sul terzo movimento',
    'tenere l\'accordo della sinistra per tutta la battuta senza ribatterlo',
    'i due spostamenti della destra: posizione bassa (1 = Re4) e alta (1 = Sol4)',
  ],
  sections: [
    { name: 'Strofa 1 — prima parte', from: 0, to: 32, note: 'Levare e otto battute. Suona tutto piano: la melodia non deve mai spingere.' },
    { name: 'Strofa 1 — seconda parte', from: 32, to: 56, note: 'Le minime: sono il punto in cui si respira. L\'ultima battuta porta già il levare della strofa 2.' },
    { name: 'Strofa 2 — prima parte', from: 56, to: 86, note: 'Stesse note, un filo più presenti. Cura il legato della sinistra fra un accordo e l\'altro.' },
    { name: 'Strofa 2 — seconda parte e finale', from: 86, to: 108, note: 'Diminuendo e rallentando fino alla corona: l\'ultimo Re si spegne.' },
  ],
  steps: seq(
    // ── Strofa 1 ────────────────────────────────────────────────────────────
    // levare — posizione bassa: 1 = Re4
    s('8', 'F#4', undefined, { dyn: 'p', text: 'dolce', fin: 3, leg: true }),
    s('8', 'F#4', undefined, { leg: true }),
    // batt. 1 — RE
    s('qd', 'A4', ['D3', 'F#3', 'A3'], { fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'F#4', ['D3', 'F#3', 'A3'], { fin: 3, leg: true, tieL: true }),
    s('q', 'F#4', ['D3', 'F#3', 'A3'], { leg: true }),
    // batt. 2 — RE
    s('q', 'A4', ['D3', 'F#3', 'A3'], { fin: 5, finL: [5, 3, 1], tieL: true, artL: 'tenuto' }),
    s('q', undefined, ['D3', 'F#3', 'A3'], { tieL: true }),
    s('8', 'F#4', ['D3', 'F#3', 'A3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'A4', ['D3', 'F#3', 'A3'], { fin: 5, leg: true }),
    // batt. 3 — LA7 · posizione alta: 1 = Sol4
    s('q', 'D5', ['A2', 'C#3', 'G3'], { fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('qd', 'C#5', ['A2', 'C#3', 'G3'], { fin: 4, leg: true, tieL: true }),
    s('8', 'B4', ['A2', 'C#3', 'G3'], { fin: 3, leg: true }),
    // batt. 4 — LA7
    s('q', 'B4', ['A2', 'C#3', 'G3'], { fin: 3, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'A4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true, tieL: true }),
    s('8', 'E4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true, tieL: true }),
    s('8', 'F#4', ['A2', 'C#3', 'G3'], { fin: 3, leg: true }),
    // batt. 5 — LA7
    s('q', 'G4', ['A2', 'C#3', 'G3'], { fin: 4, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'E4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true, tieL: true }),
    s('8', 'E4', ['A2', 'C#3', 'G3'], { leg: true, tieL: true }),
    s('8', 'F#4', ['A2', 'C#3', 'G3'], { fin: 3, leg: true }),
    // batt. 6 — LA7
    s('q', 'G4', ['A2', 'C#3', 'G3'], { fin: 4, finL: [5, 3, 1], tieL: true, artL: 'tenuto' }),
    s('q', undefined, ['A2', 'C#3', 'G3'], { tieL: true }),
    s('8', 'E4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true, tieL: true }),
    s('8', 'G4', ['A2', 'C#3', 'G3'], { fin: 4, leg: true }),
    // batt. 7 — LA7 · di nuovo in posizione alta
    s('8', 'C#5', ['A2', 'C#3', 'G3'], { fin: 4, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'B4', ['A2', 'C#3', 'G3'], { fin: 3, leg: true, tieL: true }),
    s('q', 'A4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true, tieL: true }),
    s('q', 'C#5', ['A2', 'C#3', 'G3'], { fin: 4, leg: true }),
    // batt. 8 — RE
    s('q', 'D5', ['D3', 'F#3', 'A3'], { fin: 5, finL: [5, 3, 1], tieL: true, artL: 'tenuto' }),
    s('q', undefined, ['D3', 'F#3', 'A3'], { tieL: true }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { fin: 1, leg: true, tieL: true }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { leg: true }),
    // batt. 9 — SOL · posizione alta
    s('h', 'D5', ['G2', 'B2', 'D3'], { dyn: 'mp', fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'B4', ['G2', 'B2', 'D3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'G4', ['G2', 'B2', 'D3'], { fin: 1, leg: true }),
    // batt. 10 — RE · posizione bassa
    s('h', 'A4', ['D3', 'F#3', 'A3'], { fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'F#4', ['D3', 'F#3', 'A3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { fin: 1, leg: true }),
    // batt. 11 — SOL · posizione alta
    s('q', 'G4', ['G2', 'B2', 'D3'], { hair: 'cresc', fin: 1, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'A4', ['G2', 'B2', 'D3'], { fin: 2, leg: true, tieL: true }),
    s('q', 'B4', ['G2', 'B2', 'D3'], { fin: 3, leg: true }),
    // batt. 12 — RE
    s('h', 'A4', ['D3', 'F#3', 'A3'], { dyn: 'mf', fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { fin: 1, leg: true, tieL: true }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { leg: true }),
    // batt. 13 — SOL
    s('h', 'D5', ['G2', 'B2', 'D3'], { dyn: 'p', fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'B4', ['G2', 'B2', 'D3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'G4', ['G2', 'B2', 'D3'], { fin: 1, leg: true }),
    // batt. 14 — RE
    s('h', 'A4', ['D3', 'F#3', 'A3'], { fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'F#4', ['D3', 'F#3', 'A3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { fin: 1, leg: true }),
    // batt. 15 — LA7
    s('q', 'G4', ['A2', 'C#3', 'G3'], { fin: 4, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'F#4', ['A2', 'C#3', 'G3'], { fin: 3, leg: true, tieL: true }),
    s('q', 'E4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true }),
    // batt. 16 — RE · e il levare della seconda strofa
    s('h', 'D4', ['D3', 'F#3', 'A3'], { fin: 1, finL: [5, 3, 1], tieL: true, artL: 'tenuto' }),
    s('8', 'F#4', ['D3', 'F#3', 'A3'], { dyn: 'mp', fin: 3, leg: true, tieL: true }),
    s('8', 'F#4', ['D3', 'F#3', 'A3'], { leg: true }),

    // ── Strofa 2 ────────────────────────────────────────────────────────────
    // batt. 17 — RE
    s('qd', 'A4', ['D3', 'F#3', 'A3'], { fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'F#4', ['D3', 'F#3', 'A3'], { fin: 3, leg: true, tieL: true }),
    s('q', 'F#4', ['D3', 'F#3', 'A3'], { leg: true }),
    // batt. 18 — RE
    s('q', 'A4', ['D3', 'F#3', 'A3'], { fin: 5, finL: [5, 3, 1], tieL: true, artL: 'tenuto' }),
    s('q', undefined, ['D3', 'F#3', 'A3'], { tieL: true }),
    s('8', 'F#4', ['D3', 'F#3', 'A3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'A4', ['D3', 'F#3', 'A3'], { fin: 5, leg: true }),
    // batt. 19 — LA7 · posizione alta
    s('q', 'D5', ['A2', 'C#3', 'G3'], { fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('qd', 'C#5', ['A2', 'C#3', 'G3'], { fin: 4, leg: true, tieL: true }),
    s('8', 'B4', ['A2', 'C#3', 'G3'], { fin: 3, leg: true }),
    // batt. 20 — LA7
    s('q', 'B4', ['A2', 'C#3', 'G3'], { fin: 3, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'A4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true, tieL: true }),
    s('8', 'E4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true, tieL: true }),
    s('8', 'F#4', ['A2', 'C#3', 'G3'], { fin: 3, leg: true }),
    // batt. 21 — LA7
    s('q', 'G4', ['A2', 'C#3', 'G3'], { fin: 4, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'E4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true, tieL: true }),
    s('8', 'E4', ['A2', 'C#3', 'G3'], { leg: true, tieL: true }),
    s('8', 'F#4', ['A2', 'C#3', 'G3'], { fin: 3, leg: true }),
    // batt. 22 — LA7
    s('q', 'G4', ['A2', 'C#3', 'G3'], { fin: 4, finL: [5, 3, 1], tieL: true, artL: 'tenuto' }),
    s('q', undefined, ['A2', 'C#3', 'G3'], { tieL: true }),
    s('8', 'E4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true, tieL: true }),
    s('8', 'G4', ['A2', 'C#3', 'G3'], { fin: 4, leg: true }),
    // batt. 23 — LA7
    s('8', 'C#5', ['A2', 'C#3', 'G3'], { fin: 4, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'B4', ['A2', 'C#3', 'G3'], { fin: 3, leg: true, tieL: true }),
    s('q', 'A4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true, tieL: true }),
    s('q', 'C#5', ['A2', 'C#3', 'G3'], { fin: 4, leg: true }),
    // batt. 24 — RE
    s('q', 'D5', ['D3', 'F#3', 'A3'], { fin: 5, finL: [5, 3, 1], tieL: true, artL: 'tenuto' }),
    s('q', undefined, ['D3', 'F#3', 'A3'], { tieL: true }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { fin: 1, leg: true, tieL: true }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { leg: true }),
    // batt. 25 — SOL
    s('h', 'D5', ['G2', 'B2', 'D3'], { dyn: 'p', fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'B4', ['G2', 'B2', 'D3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'G4', ['G2', 'B2', 'D3'], { fin: 1, leg: true }),
    // batt. 26 — RE
    s('h', 'A4', ['D3', 'F#3', 'A3'], { fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'F#4', ['D3', 'F#3', 'A3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { fin: 1, leg: true }),
    // batt. 27 — SOL
    s('q', 'G4', ['G2', 'B2', 'D3'], { fin: 1, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'A4', ['G2', 'B2', 'D3'], { fin: 2, leg: true, tieL: true }),
    s('q', 'B4', ['G2', 'B2', 'D3'], { fin: 3, leg: true }),
    // batt. 28 — RE
    s('h', 'A4', ['D3', 'F#3', 'A3'], { fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { fin: 1, leg: true, tieL: true }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { leg: true }),
    // batt. 29 — SOL
    s('h', 'D5', ['G2', 'B2', 'D3'], { dyn: 'pp', fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'B4', ['G2', 'B2', 'D3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'G4', ['G2', 'B2', 'D3'], { fin: 1, leg: true }),
    // batt. 30 — RE
    s('h', 'A4', ['D3', 'F#3', 'A3'], { fin: 5, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('8', 'F#4', ['D3', 'F#3', 'A3'], { fin: 3, leg: true, tieL: true }),
    s('8', 'D4', ['D3', 'F#3', 'A3'], { fin: 1, leg: true }),
    // batt. 31 — LA7 · si allarga
    s('q', 'G4', ['A2', 'C#3', 'G3'], { text: 'rit.', fin: 4, finL: [5, 3, 1], leg: true, tieL: true, artL: 'tenuto' }),
    s('q', 'F#4', ['A2', 'C#3', 'G3'], { fin: 3, leg: true, tieL: true }),
    s('q', 'E4', ['A2', 'C#3', 'G3'], { fin: 2, leg: true }),
    // batt. 32 — RE · corona
    s('hd', 'D4', ['D3', 'F#3', 'A3'], { fin: 1, finL: [5, 3, 1], artB: 'fermata', bar: 'end' }),
  ),
});

// ── 6 · Minuetto in Sol ──────────────────────────────────────────────────────
// BWV Anh. 114, dal Quaderno di Anna Magdalena Bach (in realtà di Christian
// Petzold). La melodia è quella originale, nota per nota; la mano sinistra è
// ridotta all'accompagnamento di minuetto — basso staccato sul primo movimento,
// accordo di due note sul secondo e sul terzo.
//
//   Accordi: SOL = Sol2 + Si2 Re3 · RE = Re3 + Fa♯3 La3 · DO = Do3 + Mi3 Sol3
//            LAm = La2 + Do3 Mi3 · MIm = Mi3 + Sol3 Si3 · LA = La2 + Do♯3 Mi3

/** La cadenza di Sol che chiude sia la prima sia la seconda parte. */
const cadenzaSol = (m: Marks) =>
  s('hd', 'G4', ['G2', 'B2', 'D3'], { fin: 2, finL: [5, 3, 1], ...m });

// Prima parte, batt. 1–15 (la 16ª è la cadenza).
const minuettoA = seq(
  // batt. 1 — SOL
  s('q', 'D5', 'G2', { dyn: 'mf', fin: 5, finL: 5, artL: 'staccato' }),
  s('8', 'G4', ['B2', 'D3'], { fin: 1, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'A4', ['B2', 'D3'], { leg: true }),
  s('8', 'B4', ['B2', 'D3'], { leg: true, tieL: true }),
  s('8', 'C5', ['B2', 'D3'], { leg: true }),
  // batt. 2 — SOL
  s('q', 'D5', 'G2', { fin: 5, finL: 5, artL: 'staccato' }),
  s('q', 'G4', ['B2', 'D3'], { fin: 1, art: 'staccato', finL: [3, 1] }),
  s('q', 'G4', ['B2', 'D3'], { art: 'staccato' }),
  // batt. 3 — DO · la destra sale: 1 = Do5
  s('q', 'E5', 'C3', { fin: 3, finL: 5, artL: 'staccato' }),
  s('8', 'C5', ['E3', 'G3'], { fin: 1, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'D5', ['E3', 'G3'], { leg: true }),
  s('8', 'E5', ['E3', 'G3'], { leg: true, tieL: true }),
  s('8', 'F#5', ['E3', 'G3'], { fin: 4, leg: true }),
  // batt. 4 — SOL
  s('q', 'G5', 'G2', { fin: 5, finL: 5, artL: 'staccato' }),
  s('q', 'G4', ['B2', 'D3'], { fin: 1, art: 'staccato', finL: [3, 1] }),
  s('q', 'G4', ['B2', 'D3'], { art: 'staccato' }),
  // batt. 5 — LAm · torna la posizione 1 = Sol4
  s('q', 'C5', 'A2', { dyn: 'mp', fin: 4, finL: 5, leg: true, artL: 'staccato' }),
  s('8', 'D5', ['C3', 'E3'], { fin: 5, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'C5', ['C3', 'E3'], { leg: true }),
  s('8', 'B4', ['C3', 'E3'], { leg: true, tieL: true }),
  s('8', 'A4', ['C3', 'E3'], { leg: true }),
  // batt. 6 — SOL
  s('q', 'B4', 'G2', { fin: 3, finL: 5, leg: true, artL: 'staccato' }),
  s('8', 'C5', ['B2', 'D3'], { fin: 4, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'B4', ['B2', 'D3'], { leg: true }),
  s('8', 'A4', ['B2', 'D3'], { leg: true, tieL: true }),
  s('8', 'G4', ['B2', 'D3'], { leg: true }),
  // batt. 7 — RE poi SOL · la destra scende: 1 = Fa♯4
  s('q', 'F#4', 'D3', { fin: 1, finL: 5, leg: true, artL: 'staccato' }),
  s('8', 'G4', ['B2', 'D3'], { fin: 2, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'A4', ['B2', 'D3'], { leg: true }),
  s('8', 'B4', ['B2', 'D3'], { fin: 4, leg: true, tieL: true }),
  s('8', 'G4', ['B2', 'D3'], { leg: true }),
  // batt. 8 — RE · fine della prima frase
  s('hd', 'A4', ['D3', 'F#3', 'A3'], { fin: 3, finL: [5, 3, 1], artL: 'tenuto' }),
  // batt. 9 — SOL
  s('q', 'D5', 'G2', { dyn: 'mf', fin: 5, finL: 5, artL: 'staccato' }),
  s('8', 'G4', ['B2', 'D3'], { fin: 1, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'A4', ['B2', 'D3'], { leg: true }),
  s('8', 'B4', ['B2', 'D3'], { leg: true, tieL: true }),
  s('8', 'C5', ['B2', 'D3'], { leg: true }),
  // batt. 10 — SOL
  s('q', 'D5', 'G2', { fin: 5, finL: 5, artL: 'staccato' }),
  s('q', 'G4', ['B2', 'D3'], { fin: 1, art: 'staccato', finL: [3, 1] }),
  s('q', 'G4', ['B2', 'D3'], { art: 'staccato' }),
  // batt. 11 — DO
  s('q', 'E5', 'C3', { fin: 3, finL: 5, artL: 'staccato' }),
  s('8', 'C5', ['E3', 'G3'], { fin: 1, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'D5', ['E3', 'G3'], { leg: true }),
  s('8', 'E5', ['E3', 'G3'], { leg: true, tieL: true }),
  s('8', 'F#5', ['E3', 'G3'], { fin: 4, leg: true }),
  // batt. 12 — SOL
  s('q', 'G5', 'G2', { fin: 5, finL: 5, artL: 'staccato' }),
  s('q', 'G4', ['B2', 'D3'], { fin: 1, art: 'staccato', finL: [3, 1] }),
  s('q', 'G4', ['B2', 'D3'], { art: 'staccato' }),
  // batt. 13 — LAm
  s('q', 'C5', 'A2', { hair: 'cresc', fin: 4, finL: 5, leg: true, artL: 'staccato' }),
  s('8', 'D5', ['C3', 'E3'], { fin: 5, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'C5', ['C3', 'E3'], { leg: true }),
  s('8', 'B4', ['C3', 'E3'], { leg: true, tieL: true }),
  s('8', 'A4', ['C3', 'E3'], { leg: true }),
  // batt. 14 — SOL
  s('q', 'B4', 'G2', { fin: 3, finL: 5, leg: true, artL: 'staccato' }),
  s('8', 'C5', ['B2', 'D3'], { fin: 4, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'B4', ['B2', 'D3'], { leg: true }),
  s('8', 'A4', ['B2', 'D3'], { leg: true, tieL: true }),
  s('8', 'G4', ['B2', 'D3'], { leg: true }),
  // batt. 15 — LAm, SOL, RE · la cadenza
  s('q', 'A4', 'A2', { dyn: 'f', fin: 3, finL: 5, leg: true, artL: 'staccato' }),
  s('8', 'B4', ['B2', 'D3'], { fin: 4, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'A4', ['B2', 'D3'], { leg: true }),
  s('8', 'G4', ['D3', 'F#3'], { fin: 2, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'F#4', ['D3', 'F#3'], { fin: 1, leg: true }),
);

// Seconda parte, batt. 17–31 (la 32ª è la stessa cadenza di Sol).
const minuettoB = seq(
  // batt. 17 — SOL · la destra sale in alto: 1 = Sol5
  s('q', 'B5', 'G2', { dyn: 'f', fin: 3, finL: 5, leg: true, artL: 'staccato' }),
  s('8', 'G5', ['B2', 'D3'], { fin: 1, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'A5', ['B2', 'D3'], { fin: 2, leg: true }),
  s('8', 'B5', ['B2', 'D3'], { leg: true, tieL: true }),
  s('8', 'G5', ['B2', 'D3'], { leg: true }),
  // batt. 18 — RE · 1 = Re5
  s('q', 'A5', 'D3', { fin: 5, finL: 5, leg: true, artL: 'staccato' }),
  s('8', 'D5', ['F#3', 'A3'], { fin: 1, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'E5', ['F#3', 'A3'], { fin: 2, leg: true }),
  s('8', 'F#5', ['F#3', 'A3'], { fin: 3, leg: true, tieL: true }),
  s('8', 'D5', ['F#3', 'A3'], { leg: true }),
  // batt. 19 — MIm
  s('q', 'G5', 'E3', { fin: 4, finL: 5, leg: true, artL: 'staccato' }),
  s('8', 'E5', ['G3', 'B3'], { fin: 2, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'F#5', ['G3', 'B3'], { leg: true }),
  s('8', 'G5', ['G3', 'B3'], { leg: true, tieL: true }),
  s('8', 'D5', ['G3', 'B3'], { fin: 1, leg: true }),
  // batt. 20 — LA · 1 = La4
  s('q', 'C#5', 'A2', { dyn: 'mp', fin: 3, finL: 5, leg: true, artL: 'staccato' }),
  s('8', 'B4', ['C#3', 'E3'], { fin: 2, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'C#5', ['C#3', 'E3'], { leg: true }),
  s('q', 'A4', ['C#3', 'E3'], { fin: 1 }),
  // batt. 21 — LA · la scala col passaggio del pollice
  s('8', 'A4', 'A2', { fin: 1, finL: 5, leg: true, artL: 'staccato', tieL: true }),
  s('8', 'B4', 'A2', { fin: 2, leg: true }),
  s('8', 'C#5', ['C#3', 'E3'], { fin: 3, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'D5', ['C#3', 'E3'], { fin: 1, leg: true }),
  s('8', 'E5', ['C#3', 'E3'], { fin: 2, leg: true, tieL: true }),
  s('8', 'F#5', ['C#3', 'E3'], { fin: 3, leg: true }),
  // batt. 22 — SOL, RE, LA
  s('q', 'G5', 'G2', { fin: 4, finL: 5, leg: true, artL: 'staccato' }),
  s('q', 'F#5', ['D3', 'F#3'], { fin: 3, leg: true, finL: [3, 1] }),
  s('q', 'E5', ['C#3', 'E3'], { fin: 2, leg: true, finL: [3, 1] }),
  // batt. 23 — RE, RE, LA
  s('q', 'F#5', 'D3', { fin: 5, finL: 5, artL: 'staccato' }),
  s('q', 'A4', ['F#3', 'A3'], { fin: 1, finL: [3, 1] }),
  s('q', 'C#5', ['C#3', 'E3'], { fin: 3, finL: [3, 1] }),
  // batt. 24 — RE · a metà strada, in Re maggiore
  s('hd', 'D5', ['D3', 'F#3', 'A3'], { fin: 4, finL: [5, 3, 1], artL: 'tenuto' }),
  // batt. 25 — SOL · la destra torna in basso
  s('q', 'D5', 'G2', { dyn: 'mf', fin: 5, finL: 5, artL: 'staccato' }),
  s('8', 'G4', ['B2', 'D3'], { fin: 2, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'F#4', ['B2', 'D3'], { fin: 1, leg: true }),
  s('q', 'G4', ['B2', 'D3'], { fin: 2, finL: [3, 1] }),
  // batt. 26 — DO
  s('q', 'E5', 'C3', { fin: 5, finL: 5, artL: 'staccato' }),
  s('8', 'G4', ['E3', 'G3'], { fin: 2, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'F#4', ['E3', 'G3'], { fin: 1, leg: true }),
  s('q', 'G4', ['E3', 'G3'], { fin: 2, finL: [3, 1] }),
  // batt. 27 — SOL, RE, SOL
  s('q', 'D5', 'G2', { fin: 5, finL: 5, leg: true, artL: 'staccato' }),
  s('q', 'C5', ['D3', 'F#3'], { fin: 4, leg: true, finL: [3, 1] }),
  s('q', 'B4', ['B2', 'D3'], { fin: 3, leg: true, finL: [3, 1] }),
  // batt. 28 — RE
  s('8', 'A4', 'D3', { fin: 3, finL: 5, leg: true, artL: 'staccato', tieL: true }),
  s('8', 'G4', 'D3', { fin: 2, leg: true }),
  s('8', 'F#4', ['F#3', 'A3'], { fin: 1, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'G4', ['F#3', 'A3'], { fin: 2, leg: true }),
  s('q', 'A4', ['F#3', 'A3'], { fin: 3, finL: [3, 1] }),
  // batt. 29 — RE · la scala che sale, col pollice sotto sul Sol
  s('8', 'D4', 'D3', { hair: 'cresc', fin: 1, finL: 5, leg: true, artL: 'staccato', tieL: true }),
  s('8', 'E4', 'D3', { fin: 2, leg: true }),
  s('8', 'F#4', ['F#3', 'A3'], { fin: 3, leg: true, finL: [3, 1], tieL: true }),
  s('8', 'G4', ['F#3', 'A3'], { fin: 1, leg: true }),
  s('8', 'A4', ['F#3', 'A3'], { fin: 2, leg: true, tieL: true }),
  s('8', 'B4', ['F#3', 'A3'], { fin: 3, leg: true }),
  // batt. 30 — DO, SOL, RE
  s('q', 'C5', 'C3', { dyn: 'f', fin: 4, finL: 5, leg: true, artL: 'staccato' }),
  s('q', 'B4', ['B2', 'D3'], { fin: 3, leg: true, finL: [3, 1] }),
  s('q', 'A4', ['D3', 'F#3'], { fin: 2, leg: true, finL: [3, 1] }),
  // batt. 31 — SOL, SOL, RE
  s('8', 'B4', 'G2', { fin: 3, finL: 5, leg: true, artL: 'staccato', tieL: true }),
  s('8', 'D5', 'G2', { fin: 5, leg: true }),
  s('q', 'G4', ['B2', 'D3'], { fin: 2, leg: true, finL: [3, 1] }),
  s('q', 'F#4', ['D3', 'F#3'], { fin: 1, leg: true, finL: [3, 1] }),
);

const minuetto = p({
  id: 'bach-minuetto-sol',
  title: 'Minuetto in Sol',
  composer: 'C. Petzold (attr. J. S. Bach)',
  difficulty: 'facile',
  level: 6,
  emoji: '🎩',
  bpm: 108,
  meter: '3/4',
  key: { tonic: 'G', mode: 'maggiore' },
  tempoText: 'Tempo di minuetto',
  hint: 'Il brano intero con i due ritornelli: 64 battute. La destra ha la melodia originale, la sinistra è ridotta a basso + accordo.',
  about: 'Dal Quaderno di Anna Magdalena Bach (1725). Per due secoli attribuito a Bach, è in realtà di Christian Petzold, organista a Dresda.',
  focus: [
    'il basso staccato sul primo movimento: è quello che fa la danza',
    'i tre spostamenti della destra nella seconda parte (fino al Si5)',
    'il passaggio del pollice nelle due scale, batt. 21 e batt. 29',
  ],
  sections: [
    { name: 'Prima parte', from: 0, to: 64, note: 'Sedici battute che finiscono in Sol. La sinistra non cambia quasi mai posizione: imparala per prima.' },
    { name: 'Prima parte — ritornello', from: 64, to: 128, note: 'Si risuona uguale. Approfittane per curare lo staccato dei bassi e la chiusura delle frasi.' },
    { name: 'Seconda parte', from: 128, to: 190, note: 'Comincia in alto e passa per Re maggiore alla batt. 24. Le due scale col pollice sotto sono qui.' },
    { name: 'Seconda parte — ritornello', from: 190, to: 252, note: 'Ultimo giro: rallenta solo sull\'ultima battuta, prima è a tempo.' },
  ],
  steps: seq(
    minuettoA, cadenzaSol({ bar: 'repeat' }),
    minuettoA, cadenzaSol({ bar: 'double' }),
    minuettoB, cadenzaSol({ bar: 'repeat' }),
    minuettoB, cadenzaSol({ dyn: 'mf', text: 'rit.', artB: 'fermata', bar: 'end' }),
  ),
});

export const basi: Piece[] = [studioDo, fraMartino, brillaBrilla, innoAllaGioia, ninnaNanna, minuetto];
