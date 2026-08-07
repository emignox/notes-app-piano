// ─────────────────────────────────────────────────────────────────────────────
// Mozart, a due mani.
//
// Sei pagine intere, dal minuetto scritto a sei anni fino al tema della Sonata
// K. 331. Le melodie sono quelle di Mozart: gli accompagnamenti sono ridotti
// dove la mano di un principiante non arriva, e ogni riduzione è dichiarata
// nella nota della sezione.
// ─────────────────────────────────────────────────────────────────────────────

import type { Piece, PieceStep } from '../../types';
import { alberti, p, rep, s, seq } from '../kit';

// ═════════════════════════════════════════════════════════════════════════════
// Minuetto in Fa maggiore K. 2 — facile 7
//
// Nannerl-Notenbuch, 1762. Forma binaria: A di 8 battute, B di 16, tutte e due
// con la ripetizione. Il disegno è sempre lo stesso: due crome che salgono di
// terza, legate, e due semiminime staccate. La sinistra tiene note lunghe.
// ═════════════════════════════════════════════════════════════════════════════

/** A: batt. 1–8. Finisce in mezza cadenza sul Do (il V grado). */
const k2A: PieceStep[] = seq(
  // batt. 1 — l'attacco, forte
  s('8', 'F5', 'F3', { dyn: 'f', leg: true, fin: 3, finL: 5, tieL: true }),
  s('8', 'A5', 'F3', { fin: 5, tieL: true }),
  s('q', 'C5', 'F3', { art: 'staccato', fin: 2 }),
  s('q', 'C5', 'A3', { art: 'staccato', artL: 'staccato', finL: 3 }),
  // batt. 2 — stesso disegno un grado sotto, sul Si bemolle
  s('8', 'D5', 'Bb3', { leg: true, fin: 3, finL: 4, tieL: true }),
  s('8', 'F5', 'Bb3', { fin: 5, tieL: true }),
  s('q', 'Bb4', 'Bb3', { art: 'staccato', fin: 1 }),
  s('q', 'Bb4', 'Bb3', { art: 'staccato', artL: 'staccato' }),
  // batt. 3 — la sospensione Fa–Mi sopra il Do
  s('8', 'A4', 'C4', { leg: true, fin: 3, finL: 1, tieL: true }),
  s('8', 'C5', 'C4', { fin: 5, tieL: true }),
  s('q', 'F4', 'C4', { art: 'staccato', fin: 2 }),
  s('q', 'E4', 'C3', { art: 'staccato', artL: 'staccato', fin: 1, finL: 5 }),
  // batt. 4 — cadenza
  s('q', 'E4', 'F3', { tie: true, fin: 1, finL: 4, artL: 'staccato' }),
  s('q', 'E4', 'C3', { artL: 'staccato', finL: 2 }),
  s('q', 'F4', 'F2', { art: 'tenuto', artL: 'staccato', fin: 2, finL: 5 }),
  // batt. 5 — la risposta, un'ottava sotto e piano
  s('8', 'C4', 'C3', { dyn: 'p', leg: true, fin: 1, finL: 5, tieL: true }),
  s('8', 'E4', 'C3', { fin: 3, tieL: true }),
  s('q', 'G4', 'C3', { art: 'staccato', fin: 5, tieL: true }),
  s('q', 'G4', 'C3', { art: 'staccato' }),
  // batt. 6 — l'intervallo si allarga: terza, quarta…
  s('8', 'C4', 'C3', { leg: true, fin: 1, tieL: true }),
  s('8', 'F4', 'C3', { fin: 4, tieL: true }),
  s('q', 'A4', 'C3', { art: 'staccato', fin: 5, tieL: true }),
  s('q', 'A4', 'C3', { art: 'staccato' }),
  // batt. 7 — qui Mozart scrive una terzina: resa in due semicrome e una croma
  s('16', 'C4', 'C3', { leg: true, hair: 'cresc', fin: 1, finL: 5, tieL: true }),
  s('16', 'E4', 'C3', { leg: true, fin: 3, tieL: true }),
  s('8', 'G4', 'C3', { leg: true, fin: 5 }),
  s('q', 'Bb4', 'E3', { fin: 5, finL: 3, artL: 'staccato' }),
  s('q', 'A4', 'F3', { fin: 4, finL: 2, artL: 'staccato' }),
  // batt. 8 — mezza cadenza sul Do
  s('q', 'A4', 'C4', { tie: true, hair: 'end', dyn: 'mf', fin: 4, finL: 1 }),
  s('q', 'A4', 'G3', { finL: 3, artL: 'staccato' }),
  s('q', 'G4', 'C3', { art: 'tenuto', artL: 'staccato', fin: 3, finL: 5, bar: 'repeat' }),
);

/** B: batt. 9–24. Va in Sol minore, torna in Fa e ripete il tema d'inizio. */
const k2B: PieceStep[] = seq(
  // batt. 9 — settima diminuita sul Fa diesis
  s('8', 'C5', 'F#3', { dyn: 'p', leg: true, fin: 2, finL: 4, tieL: true }),
  s('8', 'Eb5', 'F#3', { fin: 4, tieL: true }),
  s('q', 'A4', 'F#3', { art: 'staccato', fin: 1, tieL: true }),
  s('q', 'A4', 'F#3', { art: 'staccato' }),
  // batt. 10 — risolve in Sol minore
  s('8', 'Bb4', 'G3', { leg: true, fin: 2, finL: 3, tieL: true }),
  s('8', 'D5', 'G3', { fin: 4, tieL: true }),
  s('q', 'G4', 'G3', { art: 'staccato', fin: 1, tieL: true }),
  s('q', 'G4', 'G3', { art: 'staccato' }),
  // batt. 11 — accordo di Re maggiore, dominante di Sol
  s('8', 'A4', 'C4', { leg: true, fin: 2, finL: 1, tieL: true }),
  s('8', 'C5', 'C4', { fin: 4 }),
  s('q', 'F#4', 'D4', { art: 'staccato', fin: 1, finL: 1 }),
  s('q', 'F#4', 'D3', { art: 'staccato', artL: 'staccato', finL: 5 }),
  // batt. 12 — cadenza in Sol
  s('q', 'F#4', 'G3', { tie: true, fin: 1, finL: 3, artL: 'staccato' }),
  s('q', 'F#4', 'D3', { artL: 'staccato', finL: 5 }),
  s('q', 'G4', 'G2', { art: 'tenuto', artL: 'staccato', fin: 2, finL: 5 }),
  // batt. 13 — settima di dominante sul Mi: si rientra in Fa
  s('8', 'Bb4', 'E3', { dyn: 'mf', leg: true, fin: 2, finL: 4, tieL: true }),
  s('8', 'D5', 'E3', { fin: 4, tieL: true }),
  s('q', 'G4', 'E3', { art: 'staccato', fin: 1, tieL: true }),
  s('q', 'G4', 'E3', { art: 'staccato' }),
  // batt. 14 — Fa maggiore
  s('8', 'A4', 'F3', { leg: true, fin: 2, finL: 3, tieL: true }),
  s('8', 'C5', 'F3', { fin: 4, tieL: true }),
  s('q', 'F4', 'F3', { art: 'staccato', fin: 1, tieL: true }),
  s('q', 'F4', 'F3', { art: 'staccato' }),
  // batt. 15 — la settima Si bemolle sopra il Do
  s('8', 'Bb4', 'Bb3', { leg: true, fin: 4, finL: 3, tieL: true }),
  s('8', 'G4', 'Bb3', { fin: 2 }),
  s('q', 'E4', 'C4', { art: 'staccato', fin: 1, finL: 1 }),
  s('q', 'E4', 'C3', { art: 'staccato', artL: 'staccato', finL: 5 }),
  // batt. 16 — cadenza in Fa
  s('q', 'E4', 'F3', { tie: true, fin: 1, finL: 4, artL: 'staccato' }),
  s('q', 'E4', 'C3', { artL: 'staccato', finL: 2 }),
  s('q', 'F4', 'F2', { art: 'tenuto', artL: 'staccato', fin: 2, finL: 5 }),
  // batt. 17 — torna il tema, ma il basso parte dal La
  s('8', 'F5', 'A3', { dyn: 'f', leg: true, fin: 3, finL: 3, tieL: true }),
  s('8', 'A5', 'A3', { fin: 5, tieL: true }),
  s('q', 'C5', 'A3', { art: 'staccato', fin: 2, tieL: true }),
  s('q', 'C5', 'A3', { art: 'staccato' }),
  // batt. 18
  s('8', 'D5', 'Bb3', { leg: true, fin: 3, finL: 2, tieL: true }),
  s('8', 'F5', 'Bb3', { fin: 5, tieL: true }),
  s('q', 'Bb4', 'Bb3', { art: 'staccato', fin: 1, tieL: true }),
  s('q', 'Bb4', 'Bb3', { art: 'staccato' }),
  // batt. 19
  s('8', 'A4', 'C4', { leg: true, fin: 3, finL: 1, tieL: true }),
  s('8', 'C5', 'C4', { fin: 5, tieL: true }),
  s('q', 'F4', 'C4', { art: 'staccato', fin: 2 }),
  s('q', 'E4', 'C3', { art: 'staccato', artL: 'staccato', fin: 1, finL: 5 }),
  // batt. 20 — cadenza d'inganno sul Re minore, con la corona
  s('q', 'E4', 'D3', { tie: true, tieL: true, text: 'rit.', dyn: 'mp', fin: 1, finL: 5 }),
  s('q', 'E4', 'D3', { tieL: true }),
  s('q', 'F4', 'D3', { artB: 'fermata', fin: 2 }),
  // batt. 21 — si riparte, a tempo
  s('8', 'F5', 'A3', { dyn: 'f', text: 'a tempo', leg: true, fin: 3, finL: 3, tieL: true }),
  s('8', 'A5', 'A3', { fin: 5, tieL: true }),
  s('q', 'C5', 'A3', { art: 'staccato', fin: 2, tieL: true }),
  s('q', 'C5', 'A3', { art: 'staccato' }),
  // batt. 22
  s('8', 'D5', 'Bb3', { leg: true, fin: 3, finL: 2, tieL: true }),
  s('8', 'F5', 'Bb3', { fin: 5, tieL: true }),
  s('q', 'Bb4', 'Bb3', { art: 'staccato', fin: 1, tieL: true }),
  s('q', 'Bb4', 'Bb3', { art: 'staccato' }),
  // batt. 23
  s('8', 'A4', 'C4', { hair: 'dim', leg: true, fin: 3, finL: 1, tieL: true }),
  s('8', 'C5', 'C4', { fin: 5, tieL: true }),
  s('q', 'F4', 'C4', { art: 'staccato', fin: 2 }),
  s('q', 'E4', 'C3', { art: 'staccato', artL: 'staccato', fin: 1, finL: 5 }),
  // batt. 24 — cadenza vera in Fa
  s('q', 'E4', 'F3', { hair: 'end', dyn: 'p', tie: true, text: 'rit.', fin: 1, finL: 4, artL: 'staccato' }),
  s('q', 'E4', 'C3', { artL: 'staccato', finL: 2 }),
  s('q', 'F4', 'F2', { artB: 'fermata', fin: 2, finL: 5, bar: 'end' }),
);

const k2Steps: PieceStep[] = seq(rep(2, ...k2A), rep(2, ...k2B));

const minuettoK2 = p({
  id: 'mozart-k2-minuetto-fa',
  title: 'Minuetto in Fa maggiore K. 2',
  composer: 'W. A. Mozart',
  difficulty: 'facile',
  level: 7,
  emoji: '🕯️',
  bpm: 112,
  meter: '3/4',
  key: { tonic: 'F', mode: 'maggiore' },
  tempoText: 'Tempo di Menuetto',
  hint: 'Due crome legate, due semiminime staccate: è tutto il minuetto. La difficoltà vera è tenere ferma la sinistra sulle note lunghe mentre la destra articola.',
  about: 'Scritto nel quaderno di Nannerl nel 1762, quando Mozart aveva sei anni. Forma binaria: A di otto battute, B di sedici, tutte e due ripetute.',
  focus: [
    'staccato e legato nella stessa battuta, con la stessa mano',
    'la sinistra tiene: minime e minime puntate senza ribattere',
    'i contrasti secchi forte/piano fra una frase e la risposta',
  ],
  sections: [
    { name: 'A', from: 0, to: k2A.length, note: 'Otto battute che scendono per gradi e finiscono in mezza cadenza sul Do. Studia prima le due semiminime staccate da sole.' },
    { name: 'A — ripetizione', from: k2A.length, to: 2 * k2A.length, note: 'La stessa musica: cambia solo che ora la sai. Cerca di far sentire il piano di batt. 5 più piano della prima volta.' },
    { name: 'B', from: 2 * k2A.length, to: 2 * k2A.length + k2B.length, note: 'Sedici battute: settima diminuita, passaggio in Sol minore, rientro in Fa e ritorno del tema. La corona di batt. 20 è una cadenza d\'inganno: fermati davvero.' },
    { name: 'B — ripetizione', from: 2 * k2A.length + k2B.length, to: 2 * k2A.length + 2 * k2B.length, note: 'Ultimo giro: chiudi in diminuendo, la seconda volta la cadenza è quella buona.' },
  ],
  steps: k2Steps,
});

// ═════════════════════════════════════════════════════════════════════════════
// Minuetto in Sol maggiore K. 1e — medio 1
//
// Il primo pezzo di Mozart che ci sia arrivato (1761–62, aveva cinque anni).
// Quattro frasi di quattro battute, ognuna aperta da un levare di due crome.
// La trama è a due voci in decime parallele: la sinistra è una vera melodia.
// Batt. 7–8 vanno in Re; batt. 9–10 rientrano passando per il La minore.
// ═════════════════════════════════════════════════════════════════════════════

/** A: levare + batt. 1–8. Chiude in Re maggiore. */
const k1eA: PieceStep[] = seq(
  // levare
  s('8', 'B4', undefined, { dyn: 'mf', leg: true, fin: 3 }),
  s('8', 'G4', undefined, { fin: 1 }),
  // batt. 1 — decime parallele: destra e sinistra salgono insieme
  s('q', 'B4', 'G3', { leg: true, legL: true, fin: 2, finL: 5 }),
  s('q', 'C5', 'A3', { leg: true, legL: true, fin: 3, finL: 4 }),
  s('q', 'D5', 'B3', { fin: 4, finL: 3 }),
  // batt. 2 — e ridiscendono; le due crome sono il levare della frase dopo
  s('q', 'D5', 'B3', { leg: true, legL: true, fin: 4, finL: 3 }),
  s('q', 'C5', 'A3', { fin: 3, finL: 4 }),
  s('8', 'A4', undefined, { leg: true, fin: 2 }),
  s('8', 'F#4', undefined, { fin: 1 }),
  // batt. 3
  s('q', 'A4', 'F#3', { leg: true, legL: true, fin: 2, finL: 5 }),
  s('q', 'B4', 'G3', { leg: true, legL: true, fin: 3, finL: 4 }),
  s('q', 'C5', 'A3', { fin: 4, finL: 3 }),
  // batt. 4
  s('q', 'C5', 'A3', { leg: true, legL: true, fin: 4, finL: 3 }),
  s('q', 'B4', 'G3', { fin: 3, finL: 4 }),
  s('8', 'B4', undefined, { leg: true, fin: 3 }),
  s('8', 'G4', undefined, { fin: 1 }),
  // batt. 5 — seconda frase, più acuta e più forte
  s('q', 'E5', 'G3', { dyn: 'f', leg: true, fin: 3, finL: 4, tieL: true }),
  s('8', 'G5', 'G3', { leg: true, fin: 5, tieL: true }),
  s('8', 'E5', 'G3', { leg: true, fin: 3 }),
  s('q', 'C#5', 'E3', { fin: 1, finL: 5 }),
  // batt. 6 — scala discendente verso il Re
  s('8', 'E5', 'C#3', { leg: true, fin: 5, finL: 5, tieL: true }),
  s('8', 'C#5', 'C#3', { leg: true, fin: 3 }),
  s('8', 'A4', 'A2', { leg: true, fin: 2, finL: 5, tieL: true }),
  s('8', 'G4', 'A2', { leg: true, fin: 1 }),
  s('q', 'F#4', 'D3', { fin: 1, finL: 3 }),
  // batt. 7 — Mozart scrive una terzina: qui due semicrome e una croma
  s('16', 'B4', 'G3', { leg: true, hair: 'dim', fin: 4, finL: 3, tieL: true }),
  s('16', 'A4', 'G3', { leg: true, fin: 3, tieL: true }),
  s('8', 'G4', 'G3', { leg: true, fin: 2 }),
  s('q', 'F#4', 'A3', { leg: true, fin: 1, finL: 2, artL: 'staccato' }),
  s('q', 'E4', 'A2', { fin: 1, finL: 5, artL: 'staccato' }),
  // batt. 8 — cadenza in Re (due movimenti: il terzo lo prende il levare)
  s('q', 'D4', 'D3', { hair: 'end', dyn: 'mf', tie: true, art: 'tenuto', fin: 2, finL: 3 }),
  s('q', 'D4', 'D2', { finL: 5, artL: 'staccato', bar: 'repeat' }),
);

/** B: levare + batt. 9–15. La battuta 16 sta a parte perché cambia in fondo. */
const k1eB: PieceStep[] = seq(
  // levare
  s('8', 'D5', undefined, { dyn: 'p', leg: true, fin: 4 }),
  s('8', 'B4', undefined, { fin: 2 }),
  // batt. 9 — la sensibile Sol diesis: si passa per il La minore
  s('q', 'G#4', 'E3', { leg: true, fin: 1, finL: 5 }),
  s('q', 'F5', 'D4', { leg: true, fin: 5, finL: 1 }),
  s('q', 'E5', 'C4', { fin: 4, finL: 2 }),
  // batt. 10
  s('q', 'D5', 'B3', { leg: true, legL: true, fin: 3, finL: 3 }),
  s('q', 'C5', 'A3', { fin: 2, finL: 4 }),
  s('8', 'C5', 'A3', { leg: true, legL: true, fin: 2, finL: 4 }),
  s('8', 'A4', 'F#3', { fin: 1, finL: 5 }),
  // batt. 11
  s('q', 'F#4', 'D3', { leg: true, fin: 1, finL: 5 }),
  s('q', 'E5', 'C4', { leg: true, fin: 4, finL: 1 }),
  s('q', 'D5', 'B3', { fin: 3, finL: 2 }),
  // batt. 12
  s('q', 'C5', 'A3', { leg: true, legL: true, fin: 2, finL: 3 }),
  s('q', 'B4', 'G3', { fin: 1, finL: 4, artL: 'staccato' }),
  s('8', 'E5', undefined, { dyn: 'mf', leg: true, fin: 4 }),
  s('8', 'C5', undefined, { fin: 2 }),
  // batt. 13
  s('q', 'A4', 'C4', { leg: true, fin: 1, finL: 1, tieL: true }),
  s('8', 'C5', 'C4', { leg: true, fin: 3, tieL: true }),
  s('8', 'A4', 'C4', { leg: true, fin: 1 }),
  s('q', 'F#4', 'A3', { fin: 1, finL: 3 }),
  // batt. 14 — arpeggio di settima di dominante
  s('8', 'D4', 'F#3', { leg: true, hair: 'cresc', fin: 1, finL: 4, tieL: true }),
  s('8', 'F#4', 'F#3', { leg: true, fin: 2 }),
  s('8', 'A4', 'D3', { leg: true, fin: 4, finL: 5, tieL: true }),
  s('8', 'C5', 'D3', { leg: true, fin: 5 }),
  s('q', 'B4', 'G3', { fin: 4, finL: 3 }),
  // batt. 15 — ultima terzina, di nuovo in semicrome
  s('16', 'E5', 'C4', { hair: 'end', dyn: 'mf', leg: true, fin: 5, finL: 1, tieL: true }),
  s('16', 'C5', 'C4', { leg: true, fin: 3, tieL: true }),
  s('8', 'A4', 'C4', { leg: true, fin: 1 }),
  s('q', 'G4', 'D4', { leg: true, fin: 2, finL: 1, artL: 'staccato' }),
  s('q', 'F#4', 'D3', { fin: 1, finL: 5, artL: 'staccato' }),
);

/** Batt. 16 la prima volta: due movimenti, il terzo lo prende il levare. */
const k1eB16: PieceStep[] = [
  s('h', 'G4', 'G3', { art: 'tenuto', artL: 'tenuto', fin: 2, finL: 4, bar: 'repeat' }),
];

/** Batt. 16 l'ultima volta: battuta piena, con la corona. */
const k1eB16end: PieceStep[] = [
  s('hd', 'G4', 'G2', { text: 'rit.', artB: 'fermata', fin: 2, finL: 5, bar: 'end' }),
];

const k1eSteps: PieceStep[] = seq(
  rep(2, ...k1eA),
  k1eB, k1eB16,
  k1eB, k1eB16end,
);

const minuettoK1e = p({
  id: 'mozart-k1e-minuetto-sol',
  title: 'Minuetto in Sol maggiore K. 1e',
  composer: 'W. A. Mozart',
  difficulty: 'medio',
  level: 1,
  emoji: '🪶',
  bpm: 126,
  meter: '3/4',
  key: { tonic: 'G', mode: 'maggiore' },
  pickup: 1,
  tempoText: 'Allegretto',
  hint: 'Le due mani suonano quasi sempre la stessa melodia a distanza di decima: se la sinistra non canta, il pezzo non c\'è. Attenzione al levare di due crome, che torna sei volte.',
  about: 'Il primo pezzo di Mozart che ci sia arrivato, dal quaderno di Nannerl (1761–62). Sedici battute in due sezioni ripetute; la prima chiude in Re maggiore.',
  focus: [
    'entrare in levare senza rallentare la battuta prima',
    'la sinistra come seconda voce, legata, non come accompagnamento',
    'la scala discendente di batt. 6 con la mano che cambia posizione',
  ],
  sections: [
    { name: 'A', from: 0, to: k1eA.length, note: 'Due frasi: la prima sale e scende per gradi in decime, la seconda scende dal Mi acuto fino al Re. Studia la sinistra da sola: è una melodia intera.' },
    { name: 'A — ripetizione', from: k1eA.length, to: 2 * k1eA.length, note: 'Stessa musica. Fai sentire il forte di batt. 5 come un cambio di registro, non come un colpo.' },
    { name: 'B', from: 2 * k1eA.length, to: 2 * k1eA.length + k1eB.length + 1, note: 'Il Sol diesis di batt. 9 tira verso il La minore; da lì si rientra in Sol. Batt. 14 è un arpeggio di settima di dominante: tienilo legato.' },
    { name: 'B — ripetizione', from: 2 * k1eA.length + k1eB.length + 1, to: 2 * k1eA.length + 2 * k1eB.length + 2, note: 'L\'ultima battuta è piena e ha la corona: allarga il tempo già da batt. 15.' },
  ],
  steps: k1eSteps,
});

// ═════════════════════════════════════════════════════════════════════════════
// Sonata in Do maggiore K. 545 — primo movimento, esposizione — medio 3
//
// La "Sonata facile" del 1788. Qui c'è l'esposizione: tema con basso albertino,
// le due scale, il passaggio in Sol maggiore, il secondo tema, gli arpeggi e la
// chiusa. Tagliata la ripetizione letterale di batt. 16–17 e il passo di
// bravura di batt. 20–25; la mano sinistra delle batt. 13–15, che nell'originale
// è in semicrome, è ridotta a crome.
// ═════════════════════════════════════════════════════════════════════════════

/** Batt. 1–4: il tema, sopra il basso albertino. */
const k545tema: PieceStep[] = seq(
  // batt. 1 — Do–Mi–Sol sopra l'albertino di Do
  s('8', 'C5', alberti('C4', 'E4', 'G4')[0], { dyn: 'p', leg: true, tie: true, fin: 1, finL: 5 }),
  s('8', 'C5', alberti('C4', 'E4', 'G4')[1], { leg: true, tie: true, finL: 1 }),
  s('8', 'C5', alberti('C4', 'E4', 'G4')[2], { leg: true, tie: true, finL: 3 }),
  s('8', 'C5', alberti('C4', 'E4', 'G4')[3], { leg: true, finL: 1 }),
  s('8', 'E5', 'C4', { leg: true, tie: true, fin: 3, finL: 5 }),
  s('8', 'E5', 'G4', { leg: true, finL: 1 }),
  s('8', 'G5', 'E4', { leg: true, tie: true, fin: 5, finL: 3 }),
  s('8', 'G5', 'G4', { leg: true, finL: 1 }),
  // batt. 2 — la risposta, con le due semicrome
  s('8', 'B4', 'D4', { leg: true, tie: true, fin: 2, finL: 4 }),
  s('8', 'B4', 'G4', { leg: true, tie: true, finL: 1 }),
  s('8', 'B4', 'F4', { leg: true, finL: 2 }),
  s('16', 'C5', 'G4', { leg: true, tieL: true, fin: 3, finL: 1 }),
  s('16', 'D5', 'G4', { leg: true, fin: 4 }),
  s('8', 'C5', 'C4', { tie: true, fin: 3, finL: 5 }),
  s('8', 'C5', 'G4', { finL: 1 }),
  s('8', undefined, 'E4', { finL: 3 }),
  s('8', undefined, 'G4', { finL: 1 }),
  // batt. 3 — il tema una terza sopra, sull'albertino di Fa
  s('8', 'A5', alberti('C4', 'F4', 'A4')[0], { leg: true, tie: true, fin: 5, finL: 5 }),
  s('8', 'A5', alberti('C4', 'F4', 'A4')[1], { leg: true, tie: true, finL: 1 }),
  s('8', 'A5', alberti('C4', 'F4', 'A4')[2], { leg: true, tie: true, finL: 3 }),
  s('8', 'A5', alberti('C4', 'F4', 'A4')[3], { leg: true, finL: 1 }),
  s('8', 'G5', 'C4', { leg: true, tie: true, fin: 4, finL: 5 }),
  s('8', 'G5', 'G4', { leg: true, finL: 1 }),
  s('8', 'C6', 'E4', { leg: true, tie: true, fin: 5, finL: 3 }),
  s('8', 'C6', 'G4', { leg: true, finL: 1 }),
  // batt. 4 — cadenza sul Mi
  s('8', 'G5', 'B3', { leg: true, tie: true, fin: 4, finL: 5 }),
  s('8', 'G5', 'G4', { leg: true, finL: 1 }),
  s('8', 'F5', 'D4', { leg: true, fin: 3, finL: 4 }),
  s('16', 'E5', 'G4', { leg: true, tieL: true, fin: 2, finL: 1 }),
  s('16', 'F5', 'G4', { leg: true, fin: 3 }),
  s('8', 'E5', 'C4', { tie: true, fin: 2, finL: 5 }),
  s('8', 'E5', 'G4', { finL: 1 }),
  s('8', undefined, 'E4', { finL: 3 }),
  s('8', undefined, 'G4', { finL: 1 }),
);

/** Batt. 5–8: le due scale, su e giù, con la sinistra a bicordi. */
const k545scale: PieceStep[] = seq(
  // batt. 5 — la scala sale dal La e ritorna
  s('8', 'A4', 'F4', { dyn: 'mf', leg: true, tieL: true, fin: 1, finL: 1 }),
  s('16', 'B4', 'F4', { leg: true, tieL: true, fin: 2 }),
  s('16', 'C5', 'F4', { leg: true, fin: 3 }),
  s('16', 'D5', undefined, { leg: true, fin: 1 }),
  s('16', 'E5', undefined, { leg: true, fin: 2 }),
  s('16', 'F5', undefined, { leg: true, fin: 3 }),
  s('16', 'G5', undefined, { leg: true, fin: 4 }),
  s('16', 'A5', undefined, { leg: true, fin: 5 }),
  s('16', 'G5', undefined, { leg: true, fin: 4 }),
  s('16', 'F5', undefined, { leg: true, fin: 3 }),
  s('16', 'E5', undefined, { leg: true, fin: 2 }),
  s('16', 'D5', ['F3', 'C4'], { leg: true, tieL: true, fin: 1, finL: [5, 1] }),
  s('16', 'C5', ['F3', 'C4'], { leg: true, tieL: true, fin: 3 }),
  s('16', 'B4', ['F3', 'C4'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'A4', ['F3', 'C4'], { leg: true, fin: 1 }),
  // batt. 6 — un grado sotto
  s('8', 'G4', ['E3', 'C4'], { leg: true, tieL: true, fin: 1, finL: [5, 1] }),
  s('16', 'A4', ['E3', 'C4'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'B4', ['E3', 'C4'], { leg: true, fin: 3 }),
  s('16', 'C5', undefined, { leg: true, fin: 1 }),
  s('16', 'D5', undefined, { leg: true, fin: 2 }),
  s('16', 'E5', undefined, { leg: true, fin: 3 }),
  s('16', 'F5', undefined, { leg: true, fin: 4 }),
  s('16', 'G5', undefined, { leg: true, fin: 5 }),
  s('16', 'F5', undefined, { leg: true, fin: 4 }),
  s('16', 'E5', undefined, { leg: true, fin: 3 }),
  s('16', 'D5', undefined, { leg: true, fin: 2 }),
  s('16', 'C5', ['E3', 'C4'], { leg: true, tieL: true, fin: 1, finL: [5, 1] }),
  s('16', 'B4', ['E3', 'C4'], { leg: true, tieL: true, fin: 3 }),
  s('16', 'A4', ['E3', 'C4'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'G4', ['E3', 'C4'], { leg: true, fin: 1 }),
  // batt. 7 — ancora un grado sotto
  s('8', 'F4', ['D3', 'C4'], { leg: true, tieL: true, fin: 1, finL: [5, 1] }),
  s('16', 'G4', ['D3', 'C4'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'A4', ['D3', 'C4'], { leg: true, fin: 3 }),
  s('16', 'B4', undefined, { leg: true, fin: 1 }),
  s('16', 'C5', undefined, { leg: true, fin: 2 }),
  s('16', 'D5', undefined, { leg: true, fin: 3 }),
  s('16', 'E5', undefined, { leg: true, fin: 4 }),
  s('16', 'F5', undefined, { leg: true, fin: 5 }),
  s('16', 'E5', undefined, { leg: true, fin: 4 }),
  s('16', 'D5', undefined, { leg: true, fin: 3 }),
  s('16', 'C5', undefined, { leg: true, fin: 2 }),
  s('16', 'B4', ['D3', 'B3'], { leg: true, tieL: true, fin: 1, finL: [5, 2] }),
  s('16', 'A4', ['D3', 'B3'], { leg: true, tieL: true, fin: 3 }),
  s('16', 'G4', ['D3', 'B3'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'F4', ['D3', 'B3'], { leg: true, fin: 1 }),
  // batt. 8 — l'ultima, dal Mi
  s('8', 'E4', ['C3', 'C4'], { leg: true, tieL: true, fin: 1, finL: [5, 1] }),
  s('16', 'F4', ['C3', 'C4'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'G4', ['C3', 'C4'], { leg: true, fin: 3 }),
  s('16', 'A4', undefined, { leg: true, fin: 1 }),
  s('16', 'B4', undefined, { leg: true, fin: 2 }),
  s('16', 'C5', undefined, { leg: true, fin: 3 }),
  s('16', 'D5', undefined, { leg: true, fin: 4 }),
  s('16', 'E5', undefined, { leg: true, fin: 5 }),
  s('16', 'D5', undefined, { leg: true, fin: 4 }),
  s('16', 'C5', undefined, { leg: true, fin: 3 }),
  s('16', 'B4', undefined, { leg: true, fin: 2 }),
  s('16', 'A4', ['C3', 'E3'], { leg: true, tieL: true, fin: 1, finL: [5, 3] }),
  s('16', 'G4', ['C3', 'E3'], { leg: true, tieL: true, fin: 3 }),
  s('16', 'F4', ['C3', 'E3'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'E4', ['C3', 'E3'], { leg: true, fin: 1 }),
);

/** Batt. 9–12: la scala che porta in Sol maggiore e la cadenza. */
const k545verso: PieceStep[] = seq(
  // batt. 9 — sotto, la sinistra tiene una semibreve
  s('8', 'D4', ['F3', 'A3'], { hair: 'cresc', leg: true, tieL: true, fin: 1, finL: [5, 3] }),
  s('16', 'E4', ['F3', 'A3'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'F4', ['F3', 'A3'], { leg: true, tieL: true, fin: 3 }),
  s('16', 'G4', ['F3', 'A3'], { leg: true, tieL: true, fin: 1 }),
  s('16', 'A4', ['F3', 'A3'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'B4', ['F3', 'A3'], { leg: true, tieL: true, fin: 3 }),
  s('16', 'C#5', ['F3', 'A3'], { leg: true, tieL: true, fin: 4 }),
  s('16', 'D5', ['F3', 'A3'], { leg: true, tieL: true, fin: 5 }),
  s('16', 'A4', ['F3', 'A3'], { leg: true, tieL: true, fin: 1 }),
  s('16', 'B4', ['F3', 'A3'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'C#5', ['F3', 'A3'], { leg: true, tieL: true, fin: 3 }),
  s('16', 'D5', ['F3', 'A3'], { leg: true, tieL: true, fin: 4 }),
  s('16', 'E5', ['F3', 'A3'], { leg: true, tieL: true, fin: 1 }),
  s('16', 'F5', ['F3', 'A3'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'G5', ['F3', 'A3'], { leg: true, fin: 3 }),
  // batt. 10 — la scala scende dall'acuto
  s('16', 'A5', 'F3', { hair: 'end', dyn: 'f', leg: true, tieL: true, fin: 4, finL: 5 }),
  s('16', 'B5', 'F3', { leg: true, tieL: true, fin: 5 }),
  s('16', 'C6', 'F3', { leg: true, tieL: true, fin: 4 }),
  s('16', 'B5', 'F3', { leg: true, tieL: true, fin: 3 }),
  s('16', 'A5', 'F3', { leg: true, tieL: true, fin: 2 }),
  s('16', 'G5', 'F3', { leg: true, fin: 1 }),
  s('16', 'F5', 'G3', { leg: true, tieL: true, fin: 3, finL: 4 }),
  s('16', 'E5', 'G3', { leg: true, fin: 2 }),
  s('16', 'F5', 'A3', { leg: true, tieL: true, fin: 1, finL: 3 }),
  s('16', 'G5', 'A3', { leg: true, tieL: true, fin: 2 }),
  s('16', 'A5', 'A3', { leg: true, tieL: true, fin: 3 }),
  s('16', 'G5', 'A3', { leg: true, tieL: true, fin: 2 }),
  s('16', 'F5', 'A3', { leg: true, tieL: true, fin: 1 }),
  s('16', 'E5', 'A3', { leg: true, fin: 3 }),
  s('16', 'D5', 'F#3', { leg: true, tieL: true, fin: 2, finL: 4 }),
  s('16', 'C5', 'F#3', { leg: true, fin: 1 }),
  // batt. 11 — la destra a crome staccate, la sinistra ad arpeggi
  s('16', 'B4', 'G2', { tie: true, fin: 2, finL: 5 }),
  s('16', 'B4', 'B2', { art: 'staccato', finL: 4 }),
  s('16', 'G5', 'D3', { tie: true, fin: 5, finL: 2 }),
  s('16', 'G5', 'G3', { art: 'staccato', finL: 1 }),
  s('16', 'E5', 'G2', { tie: true, fin: 3, finL: 5 }),
  s('16', 'E5', 'C3', { art: 'staccato', finL: 3 }),
  s('16', 'C5', 'E3', { tie: true, fin: 1, finL: 2 }),
  s('16', 'C5', 'G3', { art: 'staccato', finL: 1 }),
  s('16', 'D5', 'G2', { tie: true, fin: 2, finL: 5 }),
  s('16', 'D5', 'B2', { art: 'staccato', finL: 4 }),
  s('16', 'G5', 'D3', { tie: true, fin: 5, finL: 2 }),
  s('16', 'G5', 'G3', { art: 'staccato', finL: 1 }),
  s('16', 'E5', 'G2', { tie: true, fin: 3, finL: 5 }),
  s('16', 'E5', 'C3', { art: 'staccato', finL: 3 }),
  s('16', 'C5', 'E3', { tie: true, fin: 1, finL: 2 }),
  s('16', 'C5', 'G3', { art: 'staccato', finL: 1 }),
  // batt. 12 — cadenza secca sul Sol
  s('q', 'D5', 'G2', { artB: 'staccato', fin: 2, finL: 5 }),
  s('q', ['B4', 'D5', 'G5'], 'G3', { artB: 'staccato', fin: [1, 2, 5], finL: 1 }),
  s('q', 'G4', 'G2', { artB: 'staccato', fin: 1, finL: 5 }),
  s('q', undefined, undefined, {}),
);

/** Batt. 13–15: il secondo tema in Sol. Sinistra ridotta a crome. */
const k545secondo: PieceStep[] = seq(
  // batt. 13 — la sinistra sola annuncia il tema
  s('8', undefined, 'C#4', { dyn: 'p', text: 'legato', legL: true, finL: 2 }),
  s('8', undefined, 'D4', { legL: true, finL: 1 }),
  s('8', undefined, 'C#4', { legL: true, finL: 2 }),
  s('8', undefined, 'D4', { legL: true, finL: 1 }),
  s('8', undefined, 'C4', { legL: true, finL: 2 }),
  s('8', undefined, 'D4', { legL: true, finL: 1 }),
  s('8', undefined, 'C4', { legL: true, finL: 2 }),
  s('8', undefined, 'D4', { finL: 1 }),
  // batt. 14 — entra il secondo tema, dall'alto
  s('8', 'D6', 'B3', { leg: true, fin: 5, finL: 3 }),
  s('8', 'B5', 'D4', { leg: true, fin: 3, finL: 1 }),
  s('8', 'G5', 'B3', { leg: true, tie: true, fin: 1, finL: 3 }),
  s('8', 'G5', 'D4', { leg: true, tie: true, finL: 1 }),
  s('8', 'G5', 'B3', { leg: true, finL: 3 }),
  s('16', 'A5', 'D4', { leg: true, tieL: true, fin: 2, finL: 1 }),
  s('16', 'B5', 'D4', { leg: true, fin: 3 }),
  s('8', 'A5', 'B3', { leg: true, fin: 2, finL: 3 }),
  s('8', 'G5', 'D4', { art: 'staccato', fin: 1, finL: 1 }),
  // batt. 15 — il trillo di Mozart, qui scritto come nota puntata
  s('8', 'G5', 'C4', { leg: true, tie: true, fin: 2, finL: 2 }),
  s('16', 'G5', 'D4', { leg: true, tieL: true, finL: 1 }),
  s('16', 'F#5', 'D4', { leg: true, fin: 1 }),
  s('8', 'F#5', 'B3', { tie: true, art: 'tenuto', fin: 1, finL: 3 }),
  s('8', 'F#5', 'D4', { finL: 1 }),
  s('8', undefined, 'A3', { finL: 4 }),
  s('8', undefined, 'D4', { finL: 1 }),
  s('8', undefined, 'B3', { finL: 3 }),
  s('8', undefined, 'D4', { finL: 1 }),
);

/**
 * Batt. 18–19: gli arpeggi spezzati fra le due mani.
 *
 * Qui Mozart scrive la sinistra in chiave di violino, fino al Do5. L'app tiene
 * sempre la chiave di basso, e cinque tagli addizionali non si leggono: la
 * sinistra è portata giù di un'ottava. Stesse note, stesso disegno.
 */
const k545arpeggi: PieceStep[] = seq(
  // batt. 18 — Sol, poi Do
  s('16', 'D6', undefined, { dyn: 'mf', tie: true, fin: 5 }),
  s('16', 'D6', 'B2', { tie: true, legL: true, finL: 5 }),
  s('16', 'D6', 'D3', { tie: true, legL: true, finL: 4 }),
  s('16', 'D6', 'G3', { legL: true, finL: 2 }),
  s('16', undefined, 'B3', { tieL: true, finL: 1 }),
  s('16', 'D6', 'B3', { leg: true, tieL: true, fin: 5 }),
  s('16', 'B5', 'B3', { leg: true, tieL: true, fin: 3 }),
  s('16', 'G5', 'B3', { leg: true, fin: 1 }),
  s('16', 'E5', undefined, { tie: true, fin: 1 }),
  s('16', 'E5', 'C3', { tie: true, legL: true, finL: 5 }),
  s('16', 'E5', 'E3', { tie: true, legL: true, finL: 4 }),
  s('16', 'E5', 'G3', { legL: true, finL: 2 }),
  s('16', undefined, 'C4', { tieL: true, finL: 1 }),
  s('16', 'E5', 'C4', { leg: true, tieL: true, fin: 1 }),
  s('16', 'G5', 'C4', { leg: true, tieL: true, fin: 3 }),
  s('16', 'E5', 'C4', { leg: true, fin: 1 }),
  // batt. 19 — Re settima, poi Sol
  s('16', 'C6', undefined, { tie: true, fin: 4 }),
  s('16', 'C6', 'A2', { tie: true, legL: true, finL: 5 }),
  s('16', 'C6', 'C3', { tie: true, legL: true, finL: 4 }),
  s('16', 'C6', 'F#3', { legL: true, finL: 2 }),
  s('16', undefined, 'A3', { tieL: true, finL: 1 }),
  s('16', 'C6', 'A3', { leg: true, tieL: true, fin: 4 }),
  s('16', 'A5', 'A3', { leg: true, tieL: true, fin: 2 }),
  s('16', 'F#5', 'A3', { leg: true, fin: 1 }),
  s('16', 'D5', undefined, { tie: true, fin: 1 }),
  s('16', 'D5', 'B2', { tie: true, legL: true, finL: 5 }),
  s('16', 'D5', 'D3', { tie: true, legL: true, finL: 4 }),
  s('16', 'D5', 'F#3', { legL: true, finL: 2 }),
  s('16', undefined, 'B3', { tieL: true, finL: 1 }),
  s('16', 'D5', 'B3', { leg: true, tieL: true, fin: 1 }),
  s('16', 'F#5', 'B3', { leg: true, tieL: true, fin: 3 }),
  s('16', 'D5', 'B3', { leg: true, fin: 1 }),
);

/** Batt. 26–28: la chiusa, con l'eco un'ottava sotto. */
const k545chiusa: PieceStep[] = seq(
  // batt. 26 — forte (anche qui la sinistra è scritta in chiave di violino:
  // gli accordi di batt. 26 e il primo di batt. 27 scendono di un'ottava)
  s('q', 'G5', ['G3', 'B3'], { dyn: 'f', art: 'tenuto', fin: 5, finL: [3, 1] }),
  s('16', 'G5', undefined, { leg: true, fin: 5 }),
  s('16', 'D5', undefined, { leg: true, fin: 2 }),
  s('16', 'G5', undefined, { leg: true, fin: 4 }),
  s('16', 'B5', undefined, { leg: true, fin: 5 }),
  s('16', 'D6', undefined, { leg: true, fin: 5 }),
  s('16', 'B5', undefined, { leg: true, fin: 3 }),
  s('16', 'G5', undefined, { leg: true, fin: 1 }),
  s('16', 'B5', undefined, { leg: true, fin: 3 }),
  s('16', 'C6', ['D3', 'A3', 'C4'], { leg: true, tieL: true, fin: 5, finL: [5, 2, 1] }),
  s('16', 'A5', ['D3', 'A3', 'C4'], { leg: true, tieL: true, fin: 3 }),
  s('16', 'F#5', ['D3', 'A3', 'C4'], { leg: true, tieL: true, fin: 1 }),
  s('16', 'A5', ['D3', 'A3', 'C4'], { leg: true, fin: 3 }),
  // batt. 27 — l'eco, un'ottava sotto e piano
  s('q', 'G5', ['G3', 'B3'], { dyn: 'p', art: 'tenuto', fin: 5, finL: [3, 1] }),
  s('16', 'G4', undefined, { leg: true, fin: 1 }),
  s('16', 'D4', undefined, { leg: true, fin: 1 }),
  s('16', 'G4', undefined, { leg: true, fin: 2 }),
  s('16', 'B4', undefined, { leg: true, fin: 3 }),
  s('16', 'D5', undefined, { leg: true, fin: 5 }),
  s('16', 'B4', undefined, { leg: true, fin: 3 }),
  s('16', 'G4', undefined, { leg: true, fin: 1 }),
  s('16', 'B4', undefined, { leg: true, fin: 3 }),
  s('16', 'C5', ['D3', 'A3', 'C4'], { leg: true, tieL: true, fin: 4, finL: [5, 2, 1] }),
  s('16', 'A4', ['D3', 'A3', 'C4'], { leg: true, tieL: true, fin: 2 }),
  s('16', 'F#4', ['D3', 'A3', 'C4'], { leg: true, tieL: true, fin: 1 }),
  s('16', 'A4', ['D3', 'A3', 'C4'], { leg: true, fin: 2 }),
  // batt. 28 — tre accordi e via
  s('q', 'G4', ['G3', 'B3'], { dyn: 'f', artB: 'staccato', fin: 1, finL: [3, 1] }),
  s('q', ['D5', 'B5'], ['G2', 'G3'], { artB: 'staccato', fin: [2, 5], finL: [5, 1] }),
  s('q', ['B4', 'G5'], ['G2', 'G3'], { artB: 'staccato', fin: [1, 5], finL: [5, 1] }),
  s('q', undefined, undefined, { bar: 'end' }),
);

const k545Steps: PieceStep[] = seq(
  k545tema, k545scale, k545verso, k545secondo, k545arpeggi, k545chiusa,
);

const k545end1 = k545tema.length;
const k545end2 = k545end1 + k545scale.length;
const k545end3 = k545end2 + k545verso.length;
const k545end4 = k545end3 + k545secondo.length;
const k545end5 = k545end4 + k545arpeggi.length;

const sonataK545 = p({
  id: 'mozart-k545-i',
  title: 'Sonata in Do maggiore K. 545 — I. Allegro',
  composer: 'W. A. Mozart',
  difficulty: 'medio',
  level: 3,
  emoji: '🏛️',
  bpm: 108,
  meter: '4/4',
  key: { tonic: 'C', mode: 'maggiore' },
  tempoText: 'Allegro',
  hint: 'La "sonata facile" è facile da leggere e difficile da suonare: il basso albertino deve restare piano e regolare mentre la destra canta, e le scale devono essere pari.',
  about: 'Vienna, 1788. Qui c\'è l\'esposizione del primo movimento: tema, scale, passaggio in Sol maggiore, secondo tema, arpeggi e chiusa.',
  focus: [
    'il basso albertino: uguale, leggero, e sempre sotto la melodia',
    'le scale di batt. 5–9, con il pollice che passa senza scatti',
    'il salto di registro del secondo tema (batt. 14 parte dal Re acuto)',
  ],
  sections: [
    { name: 'Tema', from: 0, to: k545end1, note: 'Batt. 1–4. Impara prima la sola sinistra: quattro crome per accordo, sempre nello stesso ordine.' },
    { name: 'Le scale', from: k545end1, to: k545end2, note: 'Batt. 5–8. La stessa scala quattro volte, ogni volta un grado più in basso. La sinistra entra solo sul primo e sul quarto movimento.' },
    { name: 'Verso Sol maggiore', from: k545end2, to: k545end3, note: 'Batt. 9–12. Il Do diesis apre la porta a Sol maggiore. Batt. 11 va staccata, batt. 12 chiude secca.' },
    { name: 'Secondo tema', from: k545end3, to: k545end4, note: 'Batt. 13–15. La sinistra sola annuncia il tema (nell\'originale è in semicrome: qui in crome). Poi la destra scende dal Re acuto.' },
    { name: 'Arpeggi', from: k545end4, to: k545end5, note: 'Batt. 18–19. Le due mani si passano lo stesso arpeggio: conta le semicrome, non guardare le dita. Qui Mozart scrive la sinistra in chiave di violino; è portata giù di un\'ottava perché resti leggibile.' },
    { name: 'Chiusa', from: k545end5, to: k545Steps.length, note: 'Batt. 26–28. La stessa frase forte e poi un\'ottava sotto, piano: è un\'eco, non una ripetizione.' },
  ],
  steps: k545Steps,
});

// ═════════════════════════════════════════════════════════════════════════════
// "Ah, vous dirai-je maman" K. 265 — tema e Variazione I — facile 8
//
// Il tema è la canzoncina francese che tutti conoscono; la variazione I la
// riveste di semicrome, sempre con lo stesso giro: nota di volta sopra, nota
// principale, nota di volta sotto. L'accompagnamento è ridotto a basso e
// accordo, due semiminime per battuta.
// ═════════════════════════════════════════════════════════════════════════════

/** Tema, A: batt. 1–8. */
const k265temaA: PieceStep[] = seq(
  // batt. 1–2 — "Ah vous dirai-je"
  s('q', 'C5', 'C3', { dyn: 'p', leg: true, fin: 1, finL: 5 }),
  s('q', 'C5', ['E3', 'G3'], { leg: true, finL: [3, 1] }),
  s('q', 'G5', 'C3', { leg: true, fin: 5, finL: 5 }),
  s('q', 'G5', ['E3', 'G3'], { leg: true, finL: [3, 1] }),
  // batt. 3–4 — "maman"
  s('q', 'A5', 'F3', { leg: true, fin: 5, finL: 5 }),
  s('q', 'A5', ['A3', 'C4'], { leg: true, finL: [3, 1] }),
  s('q', 'G5', 'C3', { tie: true, art: 'tenuto', fin: 4, finL: 5 }),
  s('q', 'G5', ['E3', 'G3'], { finL: [3, 1] }),
  // batt. 5–6 — la discesa
  s('q', 'F5', 'F3', { hair: 'dim', leg: true, fin: 4, finL: 5 }),
  s('q', 'F5', ['A3', 'C4'], { leg: true, finL: [3, 1] }),
  s('q', 'E5', 'C3', { leg: true, fin: 3, finL: 5 }),
  s('q', 'E5', ['E3', 'G3'], { leg: true, finL: [3, 1] }),
  // batt. 7–8 — cadenza
  s('q', 'D5', 'G2', { hair: 'end', dyn: 'mp', leg: true, fin: 2, finL: 5 }),
  s('q', 'D5', ['B2', 'F3'], { leg: true, finL: [4, 1] }),
  s('q', 'C5', 'C3', { tie: true, art: 'tenuto', fin: 1, finL: 5 }),
  s('q', 'C5', ['E3', 'G3'], { finL: [3, 1], bar: 'repeat' }),
);

/** Tema, B e ritorno: batt. 9–24. */
const k265temaB: PieceStep[] = seq(
  // batt. 9–10
  s('q', 'G5', 'C3', { dyn: 'mf', leg: true, fin: 5, finL: 5 }),
  s('q', 'G5', ['E3', 'G3'], { leg: true, finL: [3, 1] }),
  s('q', 'F5', 'F3', { leg: true, fin: 4, finL: 5 }),
  s('q', 'F5', ['A3', 'C4'], { leg: true, finL: [3, 1] }),
  // batt. 11–12
  s('q', 'E5', 'C3', { leg: true, fin: 3, finL: 5 }),
  s('q', 'E5', ['E3', 'G3'], { leg: true, finL: [3, 1] }),
  s('q', 'D5', 'G2', { tie: true, art: 'tenuto', fin: 2, finL: 5 }),
  s('q', 'D5', ['B2', 'F3'], { finL: [4, 1] }),
  // batt. 13–14 — la stessa frase, più piano
  s('q', 'G5', 'C3', { dyn: 'p', leg: true, fin: 5, finL: 5 }),
  s('q', 'G5', ['E3', 'G3'], { leg: true, finL: [3, 1] }),
  s('q', 'F5', 'F3', { leg: true, fin: 4, finL: 5 }),
  s('q', 'F5', ['A3', 'C4'], { leg: true, finL: [3, 1] }),
  // batt. 15–16
  s('q', 'E5', 'C3', { leg: true, fin: 3, finL: 5 }),
  s('q', 'E5', ['E3', 'G3'], { leg: true, finL: [3, 1] }),
  s('q', 'D5', 'G2', { tie: true, art: 'tenuto', fin: 2, finL: 5 }),
  s('q', 'D5', ['B2', 'F3'], { finL: [4, 1] }),
  // batt. 17–18 — torna il tema
  s('q', 'C5', 'C3', { dyn: 'mf', leg: true, fin: 1, finL: 5 }),
  s('q', 'C5', ['E3', 'G3'], { leg: true, finL: [3, 1] }),
  s('q', 'G5', 'C3', { leg: true, fin: 5, finL: 5 }),
  s('q', 'G5', ['E3', 'G3'], { leg: true, finL: [3, 1] }),
  // batt. 19–20
  s('q', 'A5', 'F3', { leg: true, fin: 5, finL: 5 }),
  s('q', 'A5', ['A3', 'C4'], { leg: true, finL: [3, 1] }),
  s('q', 'G5', 'C3', { tie: true, art: 'tenuto', fin: 4, finL: 5 }),
  s('q', 'G5', ['E3', 'G3'], { finL: [3, 1] }),
  // batt. 21–22
  s('q', 'F5', 'F3', { hair: 'dim', leg: true, fin: 4, finL: 5 }),
  s('q', 'F5', ['A3', 'C4'], { leg: true, finL: [3, 1] }),
  s('q', 'E5', 'C3', { leg: true, fin: 3, finL: 5 }),
  s('q', 'E5', ['E3', 'G3'], { leg: true, finL: [3, 1] }),
  // batt. 23–24 — cadenza
  s('q', 'D5', 'G2', { hair: 'end', dyn: 'p', leg: true, fin: 2, finL: 5 }),
  s('q', 'D5', ['B2', 'F3'], { leg: true, finL: [4, 1] }),
  s('q', 'C5', 'C3', { tie: true, art: 'tenuto', fin: 1, finL: 5 }),
  s('q', 'C5', ['E3', 'G3'], { finL: [3, 1], bar: 'double' }),
);

/** Variazione I: batt. 1–16, semicrome continue alla destra. */
const k265var: PieceStep[] = seq(
  // batt. 1 — il giro attorno al Do
  s('16', 'D5', 'C3', { dyn: 'mf', leg: true, fin: 2, finL: 5, tieL: true }),
  s('16', 'C5', 'C3', { leg: true, fin: 1, tieL: true }),
  s('16', 'B4', 'C3', { leg: true, tieL: true }),
  s('16', 'C5', 'C3', { leg: true }),
  s('16', 'B4', ['E3', 'G3'], { leg: true, finL: [3, 1], tieL: true }),
  s('16', 'C5', ['E3', 'G3'], { leg: true, tieL: true }),
  s('16', 'B4', ['E3', 'G3'], { leg: true, tieL: true }),
  s('16', 'C5', ['E3', 'G3'], { leg: true }),
  // batt. 2 — lo stesso giro attorno al Sol
  s('16', 'A5', 'C3', { leg: true, fin: 5, finL: 5, tieL: true }),
  s('16', 'G5', 'C3', { leg: true, fin: 4, tieL: true }),
  s('16', 'F#5', 'C3', { leg: true, fin: 3, tieL: true }),
  s('16', 'G5', 'C3', { leg: true, fin: 4 }),
  s('16', 'F#5', ['E3', 'G3'], { leg: true, finL: [3, 1], tieL: true }),
  s('16', 'G5', ['E3', 'G3'], { leg: true, tieL: true }),
  s('16', 'F#5', ['E3', 'G3'], { leg: true, tieL: true }),
  s('16', 'G5', ['E3', 'G3'], { leg: true }),
  // batt. 3 — attorno al La, e la mano sale
  s('16', 'G#5', 'F3', { leg: true, fin: 3, finL: 5, tieL: true }),
  s('16', 'A5', 'F3', { leg: true, fin: 4, tieL: true }),
  s('16', 'C6', 'F3', { leg: true, fin: 5, tieL: true }),
  s('16', 'B5', 'F3', { leg: true, fin: 4 }),
  s('16', 'D6', ['A3', 'C4'], { leg: true, fin: 5, finL: [3, 1], tieL: true }),
  s('16', 'C6', ['A3', 'C4'], { leg: true, fin: 4, tieL: true }),
  s('16', 'B5', ['A3', 'C4'], { leg: true, fin: 3, tieL: true }),
  s('16', 'A5', ['A3', 'C4'], { leg: true, fin: 2 }),
  // batt. 4 — la prima scala che scende
  s('16', 'A5', 'C3', { leg: true, fin: 2, finL: 5, tieL: true }),
  s('16', 'G5', 'C3', { leg: true, fin: 1, tieL: true }),
  s('16', 'E6', 'C3', { leg: true, fin: 5, tieL: true }),
  s('16', 'D6', 'C3', { leg: true, fin: 4 }),
  s('16', 'C6', ['E3', 'G3'], { leg: true, fin: 3, finL: [3, 1], tieL: true }),
  s('16', 'B5', ['E3', 'G3'], { leg: true, fin: 2, tieL: true }),
  s('16', 'A5', ['E3', 'G3'], { leg: true, fin: 1, tieL: true }),
  s('16', 'G5', ['E3', 'G3'], { leg: true, fin: 2 }),
  // batt. 5 — la stessa cosa un grado sotto
  s('16', 'G5', 'F3', { leg: true, fin: 2, finL: 5, tieL: true }),
  s('16', 'F5', 'F3', { leg: true, fin: 1, tieL: true }),
  s('16', 'D6', 'F3', { leg: true, fin: 5, tieL: true }),
  s('16', 'C6', 'F3', { leg: true, fin: 4 }),
  s('16', 'B5', ['A3', 'C4'], { leg: true, fin: 3, finL: [3, 1], tieL: true }),
  s('16', 'A5', ['A3', 'C4'], { leg: true, fin: 2, tieL: true }),
  s('16', 'G5', ['A3', 'C4'], { leg: true, fin: 1, tieL: true }),
  s('16', 'F5', ['A3', 'C4'], { leg: true, fin: 2 }),
  // batt. 6 — e ancora un grado sotto
  s('16', 'F5', 'C3', { leg: true, fin: 2, finL: 5, tieL: true }),
  s('16', 'E5', 'C3', { leg: true, fin: 1, tieL: true }),
  s('16', 'C6', 'C3', { leg: true, fin: 5, tieL: true }),
  s('16', 'B5', 'C3', { leg: true, fin: 4 }),
  s('16', 'A5', ['E3', 'G3'], { leg: true, fin: 3, finL: [3, 1], tieL: true }),
  s('16', 'G5', ['E3', 'G3'], { leg: true, fin: 2, tieL: true }),
  s('16', 'F5', ['E3', 'G3'], { leg: true, fin: 1, tieL: true }),
  s('16', 'E5', ['E3', 'G3'], { leg: true, fin: 2 }),
  // batt. 7 — qui Mozart lascia le semicrome e va a crome
  s('8', 'D5', 'G2', { leg: true, fin: 1, finL: 5, tieL: true }),
  s('8', 'A5', 'G2', { leg: true, fin: 5 }),
  s('8', 'G5', ['B2', 'F3'], { leg: true, fin: 4, finL: [4, 1], tieL: true }),
  s('8', 'B4', ['B2', 'F3'], { fin: 1 }),
  // batt. 8 — cadenza
  s('16', 'C5', 'C3', { leg: true, fin: 5, finL: 5, tieL: true }),
  s('16', 'G4', 'C3', { leg: true, fin: 3, tieL: true }),
  s('16', 'E4', 'C3', { leg: true, fin: 1, tieL: true }),
  s('16', 'G4', 'C3', { leg: true, fin: 3 }),
  s('q', 'C5', ['E3', 'G3'], { art: 'tenuto', fin: 5, finL: [3, 1], bar: 'repeat' }),
  // batt. 9 — seconda metà: il giro scende di grado in grado
  s('16', 'A5', 'C3', { dyn: 'p', leg: true, fin: 4, finL: 5, tieL: true }),
  s('16', 'G5', 'C3', { leg: true, fin: 3, tieL: true }),
  s('16', 'F#5', 'C3', { leg: true, fin: 2, tieL: true }),
  s('16', 'G5', 'C3', { leg: true, fin: 3 }),
  s('16', 'F#5', ['E3', 'G3'], { leg: true, fin: 2, finL: [3, 1], tieL: true }),
  s('16', 'G5', ['E3', 'G3'], { leg: true, fin: 3, tieL: true }),
  s('16', 'A5', ['E3', 'G3'], { leg: true, fin: 4, tieL: true }),
  s('16', 'G5', ['E3', 'G3'], { leg: true, fin: 3 }),
  // batt. 10
  s('16', 'G5', 'F3', { leg: true, fin: 4, finL: 5, tieL: true }),
  s('16', 'F5', 'F3', { leg: true, fin: 3, tieL: true }),
  s('16', 'E5', 'F3', { leg: true, fin: 2, tieL: true }),
  s('16', 'F5', 'F3', { leg: true, fin: 3 }),
  s('16', 'E5', ['A3', 'C4'], { leg: true, fin: 2, finL: [3, 1], tieL: true }),
  s('16', 'F5', ['A3', 'C4'], { leg: true, fin: 3, tieL: true }),
  s('16', 'G5', ['A3', 'C4'], { leg: true, fin: 4, tieL: true }),
  s('16', 'F5', ['A3', 'C4'], { leg: true, fin: 3 }),
  // batt. 11 — il Re diesis è la nota di volta cromatica
  s('16', 'F5', 'C3', { leg: true, fin: 4, finL: 5, tieL: true }),
  s('16', 'E5', 'C3', { leg: true, fin: 3, tieL: true }),
  s('16', 'D#5', 'C3', { leg: true, fin: 2, tieL: true }),
  s('16', 'E5', 'C3', { leg: true, fin: 3 }),
  s('16', 'D#5', ['E3', 'G3'], { leg: true, fin: 2, finL: [3, 1], tieL: true }),
  s('16', 'E5', ['E3', 'G3'], { leg: true, fin: 3, tieL: true }),
  s('16', 'F5', ['E3', 'G3'], { leg: true, fin: 4, tieL: true }),
  s('16', 'E5', ['E3', 'G3'], { leg: true, fin: 3 }),
  // batt. 12
  s('16', 'E5', 'G2', { leg: true, fin: 4, finL: 5, tieL: true }),
  s('16', 'D5', 'G2', { leg: true, fin: 3, tieL: true }),
  s('16', 'C#5', 'G2', { leg: true, fin: 2, tieL: true }),
  s('16', 'D5', 'G2', { leg: true, fin: 3 }),
  s('16', 'C#5', ['B2', 'F3'], { leg: true, fin: 2, finL: [4, 1], tieL: true }),
  s('16', 'D5', ['B2', 'F3'], { leg: true, fin: 3, tieL: true }),
  s('16', 'E5', ['B2', 'F3'], { leg: true, fin: 4, tieL: true }),
  s('16', 'D5', ['B2', 'F3'], { leg: true, fin: 3 }),
  // batt. 13 — le stesse battute, ma ora con l'arpeggio in cima
  s('16', 'A5', 'C3', { dyn: 'mf', leg: true, fin: 4, finL: 5, tieL: true }),
  s('16', 'G5', 'C3', { leg: true, fin: 3, tieL: true }),
  s('16', 'F#5', 'C3', { leg: true, fin: 2, tieL: true }),
  s('16', 'G5', 'C3', { leg: true, fin: 3 }),
  s('16', 'E6', ['E3', 'G3'], { leg: true, fin: 5, finL: [3, 1], tieL: true }),
  s('16', 'C6', ['E3', 'G3'], { leg: true, fin: 3, tieL: true }),
  s('16', 'A5', ['E3', 'G3'], { leg: true, fin: 1, tieL: true }),
  s('16', 'G5', ['E3', 'G3'], { leg: true, fin: 2 }),
  // batt. 14
  s('16', 'G5', 'F3', { leg: true, fin: 4, finL: 5, tieL: true }),
  s('16', 'F5', 'F3', { leg: true, fin: 3, tieL: true }),
  s('16', 'E5', 'F3', { leg: true, fin: 2, tieL: true }),
  s('16', 'F5', 'F3', { leg: true, fin: 3 }),
  s('16', 'D6', ['A3', 'C4'], { leg: true, fin: 5, finL: [3, 1], tieL: true }),
  s('16', 'B5', ['A3', 'C4'], { leg: true, fin: 3, tieL: true }),
  s('16', 'G5', ['A3', 'C4'], { leg: true, fin: 1, tieL: true }),
  s('16', 'F5', ['A3', 'C4'], { leg: true, fin: 2 }),
  // batt. 15
  s('16', 'F5', 'C3', { hair: 'dim', leg: true, fin: 4, finL: 5, tieL: true }),
  s('16', 'E5', 'C3', { leg: true, fin: 3, tieL: true }),
  s('16', 'D#5', 'C3', { leg: true, fin: 2, tieL: true }),
  s('16', 'E5', 'C3', { leg: true, fin: 3 }),
  s('16', 'C6', ['E3', 'G3'], { leg: true, fin: 5, finL: [3, 1], tieL: true }),
  s('16', 'G5', ['E3', 'G3'], { leg: true, fin: 3, tieL: true }),
  s('16', 'F5', ['E3', 'G3'], { leg: true, fin: 2, tieL: true }),
  s('16', 'E5', ['E3', 'G3'], { leg: true, fin: 1 }),
  // batt. 16 — chiusa
  s('8d', 'G5', 'G2', { hair: 'end', dyn: 'p', text: 'rit.', leg: true, fin: 4, finL: 5, tieL: true }),
  s('16', 'E5', 'G2', { leg: true, fin: 2 }),
  s('q', 'D5', ['B2', 'F3'], { artB: 'fermata', fin: 1, finL: [4, 1], bar: 'end' }),
);

const k265Steps: PieceStep[] = seq(
  rep(2, ...k265temaA),
  k265temaB,
  k265var,
);

const k265end1 = k265temaA.length;
const k265end2 = 2 * k265temaA.length;
const k265end3 = k265end2 + k265temaB.length;

const variazioniK265 = p({
  id: 'mozart-k265-ah-vous-dirai',
  title: '"Ah, vous dirai-je maman" K. 265 — tema e Variazione I',
  composer: 'W. A. Mozart',
  difficulty: 'facile',
  level: 8,
  emoji: '⭐',
  bpm: 72,
  meter: '2/4',
  key: { tonic: 'C', mode: 'maggiore' },
  tempoText: 'Andante',
  hint: 'Il tema lo sai già a memoria: serve a leggere due righe insieme senza pensare alle note. La variazione è il salto vero — semicrome continue, e la mano che sale fino al Mi acuto.',
  about: 'Vienna, 1781–82. Dodici variazioni su una canzone francese; qui ci sono il tema e la prima variazione.',
  focus: [
    'tenere le semicrome pari, senza accelerare quando la mano scende',
    'i tre cambi di posizione della destra nelle battute 3–6 della variazione',
    'la sinistra deve restare piano: è solo basso e accordo',
  ],
  sections: [
    { name: 'Tema', from: 0, to: k265end1, note: 'Batt. 1–8. Due semiminime per battuta: usa questa parte per imparare a leggere le due chiavi insieme.' },
    { name: 'Tema — ripetizione', from: k265end1, to: k265end2, note: 'Uguale. Prova a suonarla senza guardare le mani.' },
    { name: 'Tema — seconda parte', from: k265end2, to: k265end3, note: 'Batt. 9–24: la frase centrale detta due volte (la seconda più piano), poi torna il tema d\'inizio.' },
    { name: 'Variazione I', from: k265end3, to: k265Steps.length, note: 'Batt. 1–16. Il disegno è sempre lo stesso: nota sopra, nota principale, nota sotto. Studia una battuta alla volta e a metà velocità: le scale di batt. 4–6 partono in alto e scendono.' },
  ],
  steps: k265Steps,
});

// ═════════════════════════════════════════════════════════════════════════════
// "Eine kleine Nachtmusik" K. 525 — I. Allegro — medio 2
//
// Riduzione a due mani della serenata del 1787: la destra prende il primo
// violino, la sinistra il violoncello. Ci sono il tema d'apertura, la frase
// piano che gli risponde e il secondo tema in Re maggiore; poi il tema torna
// per chiudere. Le terzine dell'originale sono rese in due semicrome e i
// trilli sono lasciati cadere.
// ═════════════════════════════════════════════════════════════════════════════

/** Batt. 1–4: il tema d'apertura, le due mani all'unisono a due ottave. */
const k525tema: PieceStep[] = seq(
  // batt. 1 — Sol, silenzio, Re: è tutto qui
  s('q', 'G5', ['G2', 'G3'], { dyn: 'f', artB: 'marcato', fin: 5, finL: [5, 1] }),
  s('8', undefined, undefined, {}),
  s('8', 'D5', 'D3', { fin: 1, finL: 4 }),
  s('q', 'G5', ['G2', 'G3'], { artB: 'marcato', fin: 5, finL: [5, 1] }),
  s('8', undefined, undefined, {}),
  s('8', 'D5', 'D3', { fin: 1, finL: 4 }),
  // batt. 2 — l'arpeggio sale fino al Re acuto
  s('8', 'G5', 'G3', { leg: true, legL: true, fin: 3, finL: 5 }),
  s('8', 'D5', 'D3', { leg: true, legL: true, fin: 1, finL: 5 }),
  s('8', 'G5', 'G3', { leg: true, legL: true, fin: 3, finL: 3 }),
  s('8', 'B5', 'B3', { leg: true, legL: true, fin: 4, finL: 2 }),
  s('q', 'D6', 'D4', { artB: 'marcato', fin: 5, finL: 1 }),
  s('q', undefined, undefined, {}),
  // batt. 3 — la stessa figura sull'accordo di Fa diesis diminuito
  s('q', 'C6', 'C4', { artB: 'marcato', fin: 4, finL: 1 }),
  s('8', undefined, undefined, {}),
  s('8', 'A5', 'A3', { fin: 2, finL: 3 }),
  s('q', 'C6', 'C4', { artB: 'marcato', fin: 4, finL: 1 }),
  s('8', undefined, undefined, {}),
  s('8', 'A5', 'A3', { fin: 2, finL: 3 }),
  // batt. 4 — e ridiscende sul Re
  s('8', 'C6', 'C4', { leg: true, legL: true, fin: 4, finL: 1 }),
  s('8', 'A5', 'A3', { leg: true, legL: true, fin: 2, finL: 3 }),
  s('8', 'F#5', 'F#3', { leg: true, legL: true, fin: 1, finL: 4 }),
  s('8', 'A5', 'A3', { leg: true, legL: true, fin: 2, finL: 3 }),
  s('q', 'D5', 'D3', { artB: 'marcato', fin: 1, finL: 5 }),
  s('q', undefined, undefined, {}),
);

/** Batt. 5–10: il "razzo", sopra il Sol ribattuto della sinistra. */
const k525razzo: PieceStep[] = seq(
  // batt. 5
  s('8', 'G5', 'G3', { dyn: 'f', fin: 2, finL: 5 }),
  s('8', undefined, 'G3', {}),
  s('8', 'G5', 'G3', { leg: true, tie: true, fin: 2 }),
  s('8', 'G5', 'G3', { leg: true, tie: true }),
  s('8', 'G5', 'G3', { leg: true }),
  s('8', 'B5', 'G3', { leg: true, fin: 4 }),
  s('8', 'A5', 'G3', { leg: true, fin: 3 }),
  s('8', 'G5', 'G3', { art: 'staccato', fin: 2 }),
  // batt. 6 — il gruppetto scritto per esteso
  s('16', 'A5', 'G3', { leg: true, tieL: true, fin: 3, finL: 5 }),
  s('16', 'G5', 'G3', { leg: true, fin: 2 }),
  s('8', 'F#5', 'G3', { leg: true, fin: 1 }),
  s('8', 'F#5', 'G3', { leg: true, tie: true }),
  s('8', 'F#5', 'G3', { leg: true, tie: true }),
  s('8', 'F#5', 'G3', { leg: true }),
  s('8', 'A5', 'G3', { leg: true, fin: 3 }),
  s('8', 'C6', 'G3', { leg: true, fin: 5 }),
  s('8', 'F#5', 'G3', { art: 'staccato', fin: 1 }),
  // batt. 7
  s('8', 'A5', 'G3', { leg: true, fin: 3, finL: 5 }),
  s('8', 'G5', 'G3', { leg: true, fin: 2 }),
  s('8', 'G5', 'G3', { leg: true, tie: true }),
  s('8', 'G5', 'G3', { leg: true, tie: true }),
  s('8', 'G5', 'G3', { leg: true }),
  s('8', 'B5', 'G3', { leg: true, fin: 4 }),
  s('8', 'A5', 'G3', { leg: true, fin: 3 }),
  s('8', 'G5', 'G3', { art: 'staccato', fin: 2 }),
  // batt. 8 — come batt. 6
  s('16', 'A5', 'G3', { leg: true, tieL: true, fin: 3, finL: 5 }),
  s('16', 'G5', 'G3', { leg: true, fin: 2 }),
  s('8', 'F#5', 'G3', { leg: true, fin: 1 }),
  s('8', 'F#5', 'G3', { leg: true, tie: true }),
  s('8', 'F#5', 'G3', { leg: true, tie: true }),
  s('8', 'F#5', 'G3', { leg: true }),
  s('8', 'A5', 'G3', { leg: true, fin: 3 }),
  s('8', 'C6', 'G3', { leg: true, fin: 5 }),
  s('8', 'F#5', 'G3', { art: 'staccato', fin: 1 }),
  // batt. 9 — la scala sale a gradini, il basso con lei
  s('8', 'G5', 'G3', { hair: 'cresc', art: 'staccato', fin: 2, finL: 5 }),
  s('8', 'G5', 'G3', { art: 'staccato' }),
  s('8', 'F#5', 'A3', { leg: true, fin: 1, finL: 4 }),
  s('16', 'E5', 'A3', { leg: true, tieL: true }),
  s('16', 'F#5', 'A3', {}),
  s('8', 'G5', 'B3', { art: 'staccato', fin: 2, finL: 3 }),
  s('8', 'G5', 'B3', { art: 'staccato' }),
  s('8', 'A5', 'F#3', { leg: true, fin: 3, finL: 5 }),
  s('16', 'G5', 'F#3', { leg: true, tieL: true, fin: 2 }),
  s('16', 'A5', 'F#3', { fin: 3 }),
  // batt. 10 — e chiude sul Re acuto
  s('8', 'B5', 'G3', { art: 'staccato', fin: 4, finL: 5 }),
  s('8', 'B5', 'G3', { art: 'staccato' }),
  s('8', 'C6', 'A3', { leg: true, fin: 5, finL: 4 }),
  s('16', 'B5', 'A3', { leg: true, tieL: true, fin: 4 }),
  s('16', 'C6', 'A3', { fin: 5 }),
  s('q', 'D6', 'B3', { hair: 'end', dyn: 'f', artB: 'marcato', fin: 5, finL: 3 }),
  s('q', undefined, undefined, {}),
);

/** Batt. 11–17: la risposta piano, con le acciaccature sciolte via. */
const k525risposta: PieceStep[] = seq(
  // batt. 11
  s('h', 'D5', ['G2', 'D3'], { dyn: 'p', leg: true, fin: 2, finL: [5, 1] }),
  s('h', 'E5', ['C3', 'E3'], { leg: true, fin: 3, finL: [5, 3] }),
  // batt. 12
  s('q', 'C5', 'D3', { leg: true, legL: true, tieL: true, fin: 1, finL: 5 }),
  s('q', 'C5', 'D3', { leg: true }),
  s('q', 'B4', 'E3', { leg: true, legL: true, tieL: true, fin: 1, finL: 4 }),
  s('q', 'B4', 'E3', { leg: true }),
  // batt. 13
  s('q', 'A4', 'C3', { leg: true, fin: 1, finL: 5 }),
  s('q', 'A4', 'C3', { leg: true }),
  s('8', 'G4', 'D3', { leg: true, tieL: true, fin: 2, finL: 4 }),
  s('8', 'F#4', 'D3', { leg: true, fin: 1 }),
  s('8', 'E4', 'D3', { art: 'staccato', tieL: true, fin: 1 }),
  s('8', 'F#4', 'D3', { art: 'staccato', fin: 2 }),
  // batt. 14 — tre note staccate che portano al ritornello
  s('8', 'G4', 'B2', { art: 'staccato', artL: 'staccato', fin: 1, finL: 5 }),
  s('8', undefined, undefined, {}),
  s('8', 'A4', 'D3', { art: 'staccato', artL: 'staccato', fin: 2, finL: 3 }),
  s('8', undefined, undefined, {}),
  s('8', 'B4', 'G3', { art: 'staccato', tieL: true, fin: 3, finL: 1 }),
  s('8', undefined, 'G3', {}),
  s('q', undefined, undefined, {}),
  // batt. 15
  s('h', 'D5', ['G2', 'D3'], { leg: true, fin: 2, finL: [5, 1] }),
  s('h', 'E5', ['C3', 'E3'], { leg: true, fin: 3, finL: [5, 3] }),
  // batt. 16 — la stessa frase in crome staccate
  s('8', 'D5', 'D3', { leg: true, tieL: true, fin: 2, finL: 5 }),
  s('8', 'C5', 'D3', { leg: true, tieL: true, fin: 1 }),
  s('8', 'C5', 'D3', { art: 'staccato', tieL: true }),
  s('8', 'C5', 'D3', { art: 'staccato' }),
  s('8', 'C5', 'E3', { leg: true, tieL: true, fin: 1, finL: 4 }),
  s('8', 'B4', 'E3', { leg: true, tieL: true }),
  s('8', 'B4', 'E3', { art: 'staccato', tieL: true }),
  s('8', 'B4', 'E3', { art: 'staccato' }),
  // batt. 17 — scende fino al Fa diesis: siamo sulla dominante di Sol
  s('8', 'B4', 'C3', { leg: true, tieL: true, fin: 3, finL: 5 }),
  s('8', 'A4', 'C3', { leg: true, fin: 2 }),
  s('8', 'A4', 'C3', { art: 'staccato', tieL: true }),
  s('8', 'A4', 'C3', { art: 'staccato' }),
  s('8', 'G4', 'D3', { leg: true, tieL: true, fin: 1, finL: 4 }),
  s('8', 'F#4', 'D3', { leg: true, fin: 2 }),
  s('8', 'E4', 'D3', { leg: true, tieL: true, fin: 1 }),
  s('8', 'F#4', 'D3', { fin: 2 }),
);

/** Il secondo tema, in Re maggiore (batt. 28–35 dell'originale). */
const k525secondo: PieceStep[] = seq(
  // batt. 28 — la frase discende dal La
  s('qd', 'A5', ['D3', 'A3'], { dyn: 'p', text: 'dolce', leg: true, tieL: true, fin: 5, finL: [5, 1] }),
  s('16', 'G5', ['D3', 'A3'], { leg: true, tieL: true, fin: 4 }),
  s('16', 'E5', ['D3', 'A3'], { leg: true, fin: 2 }),
  s('8', 'D5', undefined, { fin: 1 }),
  s('8', undefined, undefined, {}),
  s('8', 'B5', undefined, { art: 'staccato', fin: 5 }),
  s('8', undefined, undefined, {}),
  // batt. 29 — tre note staccate, in giù
  s('8', 'G5', 'E3', { art: 'staccato', tieL: true, fin: 3, finL: 4 }),
  s('8', undefined, 'E3', {}),
  s('8', 'E5', 'D3', { art: 'staccato', tieL: true, fin: 1, finL: 5 }),
  s('8', undefined, 'D3', {}),
  s('8', 'A5', 'C#3', { art: 'staccato', tieL: true, fin: 5, finL: 5 }),
  s('8', undefined, 'C#3', {}),
  s('q', undefined, 'A2', { finL: 5 }),
  // batt. 30 — la stessa cosa un grado sotto
  s('q', 'F#5', undefined, { leg: true, tie: true, fin: 3 }),
  s('8', 'F#5', 'A#3', { leg: true, tieL: true, finL: 4 }),
  s('16', 'E5', 'A#3', { leg: true, tieL: true, fin: 2 }),
  s('16', 'C#5', 'A#3', { leg: true, fin: 1 }),
  s('8', 'B4', 'B3', { fin: 1, finL: 3, tieL: true }),
  s('8', undefined, 'B3', {}),
  s('8', 'G5', 'G3', { art: 'staccato', fin: 4, finL: 5, tieL: true }),
  s('8', undefined, 'G3', {}),
  // batt. 31 — cadenza
  s('h', 'F#5', 'A2', { leg: true, art: 'tenuto', fin: 3, finL: 5 }),
  s('q', 'E5', ['E3', 'A3'], { art: 'tenuto', fin: 2, finL: [5, 2] }),
  s('q', undefined, undefined, {}),
  // batt. 32 — il La ribattuto
  s('8', undefined, 'D3', { dyn: 'mp', finL: 5, tieL: true }),
  s('8', 'A5', 'D3', { art: 'staccato', fin: 3 }),
  s('8', 'A5', 'E3', { art: 'staccato', finL: 4, tieL: true }),
  s('8', 'A5', 'E3', { art: 'staccato' }),
  s('8', 'A5', 'F#3', { art: 'staccato', finL: 3, tieL: true }),
  s('8', 'A5', 'F#3', { art: 'staccato' }),
  s('8', 'A5', 'D#3', { art: 'staccato', finL: 5, tieL: true }),
  s('8', 'A5', 'D#3', { art: 'staccato' }),
  // batt. 33 — e sale al Do diesis
  s('8', 'A5', 'E3', { art: 'staccato', hair: 'cresc', fin: 3, finL: 4, tieL: true }),
  s('8', 'A5', 'E3', { art: 'staccato' }),
  s('8', 'A5', 'D3', { art: 'staccato', finL: 5, tieL: true }),
  s('8', 'A5', 'D3', { art: 'staccato' }),
  s('8', 'A5', 'C#3', { art: 'staccato', finL: 5, tieL: true }),
  s('8', 'A5', 'C#3', { art: 'staccato' }),
  s('8', 'B5', 'A2', { art: 'staccato', fin: 4, finL: 5, tieL: true }),
  s('8', 'C#6', 'A2', { art: 'staccato', fin: 5 }),
  // batt. 34
  s('8', 'C#6', 'B2', { hair: 'end', dyn: 'mf', leg: true, fin: 4, finL: 5, tieL: true }),
  s('8', 'D6', 'B2', { fin: 5 }),
  s('8', undefined, 'G3', { finL: 2, tieL: true }),
  s('8', 'B5', 'G3', { art: 'staccato', fin: 3 }),
  s('8', 'B5', 'A3', { leg: true, fin: 3, finL: 1, tieL: true }),
  s('8', 'A5', 'A3', { fin: 2 }),
  s('8', undefined, 'A2', { finL: 5, tieL: true }),
  s('8', 'C#5', 'A2', { fin: 1 }),
  // batt. 35 — l'ultima discesa, e siamo di nuovo sulla dominante di Sol
  s('q', 'D5', 'D3', { leg: true, art: 'tenuto', fin: 1, finL: 5 }),
  s('8', undefined, ['F#3', 'A3'], { finL: [3, 1], tieL: true }),
  s('8', 'A5', ['F#3', 'A3'], { leg: true, fin: 5 }),
  s('8', 'D6', 'D3', { leg: true, fin: 5, finL: 5, tieL: true }),
  s('8', 'C#6', 'D3', { leg: true, fin: 4 }),
  s('8', 'B5', ['F#3', 'A3'], { leg: true, fin: 3, finL: [3, 1], tieL: true }),
  s('8', 'A5', ['F#3', 'A3'], { text: 'rit.', fin: 2 }),
);

/** L'accordo finale. */
const k525finale: PieceStep[] = [
  s('w', ['G4', 'B4', 'D5', 'G5'], ['G2', 'G3'], {
    dyn: 'ff', artB: 'fermata', fin: [1, 2, 3, 5], finL: [5, 1], bar: 'end',
  }),
];

const k525Steps: PieceStep[] = seq(
  k525tema, k525razzo, k525risposta, k525secondo,
  rep(1, ...k525tema), k525finale,
);

const k525end1 = k525tema.length;
const k525end2 = k525end1 + k525razzo.length;
const k525end3 = k525end2 + k525risposta.length;
const k525end4 = k525end3 + k525secondo.length;

const nachtmusikK525 = p({
  id: 'mozart-k525-i',
  title: 'Eine kleine Nachtmusik K. 525 — I. Allegro',
  composer: 'W. A. Mozart',
  difficulty: 'medio',
  level: 2,
  emoji: '🌙',
  bpm: 126,
  meter: '4/4',
  key: { tonic: 'G', mode: 'maggiore' },
  tempoText: 'Allegro',
  hint: 'Le prime quattro battute sono più difficili di quel che sembrano: i silenzi valgono quanto le note, e le due mani devono cadere insieme al millimetro.',
  about: 'Serenata per archi del 1787. Qui, ridotti a due mani: il tema d\'apertura, la frase piano che gli risponde, il secondo tema in Re maggiore e il ritorno del tema.',
  focus: [
    'contare le pause di croma di batt. 1 e 3 senza anticipare',
    'il Sol ribattuto della sinistra per sei battute: leggero e uguale',
    'il salto di carattere fra il forte d\'apertura e il piano di batt. 11',
  ],
  sections: [
    { name: 'Tema d\'apertura', from: 0, to: k525end1, note: 'Batt. 1–4. Le due mani suonano la stessa cosa a due ottave di distanza: se non tornano insieme si sente subito.' },
    { name: 'Il razzo', from: k525end1, to: k525end2, note: 'Batt. 5–10. La sinistra ribatte il Sol per quattro battute: tienila leggera, il peso sta nella destra.' },
    { name: 'Risposta piano', from: k525end2, to: k525end3, note: 'Batt. 11–17. Tutto un altro carattere: legato, morbido, e la sinistra a note lunghe. Le acciaccature dell\'originale non ci sono.' },
    { name: 'Secondo tema', from: k525end3, to: k525end4, note: 'Batt. 28–35, in Re maggiore. Le terzine di Mozart sono scritte qui in due semicrome. Il La ribattuto di batt. 32–33 va staccato e pianissimo.' },
    { name: 'Ritorno del tema', from: k525end4, to: k525Steps.length, note: 'Torna l\'apertura e si chiude con l\'accordo di Sol. La corona finale: lascia suonare.' },
  ],
  steps: k525Steps,
});

// ═════════════════════════════════════════════════════════════════════════════
// Sonata in La maggiore K. 331 — I. Tema (Andante grazioso) — difficile 1
//
// Il tema che apre la sonata della "Marcia turca": diciotto battute in 6/8, in
// due sezioni ripetute. Il ritmo puntato croma-semicroma è il pezzo: se si
// appiattisce in due crome uguali, non è più Mozart. La sinistra tiene il Mi
// come un pedale interno mentre il basso si muove sotto.
//
// Semplificazioni: gli arpeggi di batt. 9–10 sono raccolti in accordi tenuti,
// l'appoggiatura di batt. 10 e la voce interna della destra di batt. 17 non ci
// sono, e la volatina di trentaduesimi di batt. 17 è scritta in semicrome.
// ═════════════════════════════════════════════════════════════════════════════

/** A: batt. 1–8. */
const k331A: PieceStep[] = seq(
  // batt. 1 — il ritmo puntato, e la sinistra in decime sotto
  s('8d', 'C#5', ['A3', 'E4'], { dyn: 'p', text: 'dolce', leg: true, fin: 3, finL: [5, 1] }),
  s('16', 'D5', 'B3', { leg: true, fin: 4, finL: 4 }),
  s('8', 'C#5', ['A3', 'E4'], { leg: true, fin: 3, finL: [5, 1] }),
  s('q', 'E5', ['C#4', 'E4'], { leg: true, fin: 5, finL: [3, 1] }),
  s('8', 'E5', ['C#4', 'E4'], { fin: 5 }),
  // batt. 2 — la stessa frase un grado sotto
  s('8d', 'B4', ['G#3', 'E4'], { leg: true, fin: 2, finL: [5, 1] }),
  s('16', 'C#5', 'A3', { leg: true, fin: 3, finL: 4 }),
  s('8', 'B4', ['G#3', 'E4'], { leg: true, fin: 2, finL: [5, 1] }),
  s('q', 'D5', ['B3', 'E4'], { leg: true, fin: 4, finL: [4, 1] }),
  s('8', 'D5', ['B3', 'E4'], { fin: 4 }),
  // batt. 3 — due note sole, ma la sinistra continua a camminare
  s('q', 'A4', ['F#3', 'E4'], { leg: true, fin: 1, finL: [5, 1] }),
  s('8', 'A4', ['F#3', 'E4'], { leg: true, fin: 1 }),
  s('q', 'B4', ['G#3', 'E4'], { leg: true, fin: 2, finL: [5, 1] }),
  s('8', 'B4', ['G#3', 'E4'], { fin: 2 }),
  // batt. 4 — la destra si apre a due voci
  s('q', ['E4', 'C#5'], 'A3', { leg: true, fin: [1, 3], finL: 3 }),
  s('16', ['B4', 'E5'], 'D3', { leg: true, tieL: true, fin: [2, 5], finL: 5 }),
  s('16', 'D5', 'D3', { leg: true, fin: 4 }),
  s('q', ['A4', 'C#5'], 'E3', { leg: true, tieL: true, fin: [1, 3], finL: 4 }),
  s('8', ['G#4', 'B4'], 'E3', { fin: [1, 2] }),
  // batt. 5 — come batt. 1
  s('8d', 'C#5', ['A3', 'E4'], { leg: true, fin: 3, finL: [5, 1] }),
  s('16', 'D5', 'B3', { leg: true, fin: 4, finL: 4 }),
  s('8', 'C#5', ['A3', 'E4'], { leg: true, fin: 3, finL: [5, 1] }),
  s('q', 'E5', ['C#4', 'E4'], { leg: true, fin: 5, finL: [3, 1] }),
  s('8', 'E5', ['C#4', 'E4'], { fin: 5 }),
  // batt. 6 — come batt. 2
  s('8d', 'B4', ['G#3', 'E4'], { leg: true, fin: 2, finL: [5, 1] }),
  s('16', 'C#5', 'A3', { leg: true, fin: 3, finL: 4 }),
  s('8', 'B4', ['G#3', 'E4'], { leg: true, fin: 2, finL: [5, 1] }),
  s('q', 'D5', ['B3', 'E4'], { leg: true, fin: 4, finL: [4, 1] }),
  s('8', 'D5', ['B3', 'E4'], { fin: 4 }),
  // batt. 7 — la salita all'accordo, con lo sforzato
  s('q', 'A4', ['F#3', 'E4'], { leg: true, hair: 'cresc', fin: 1, finL: [5, 1] }),
  s('8', 'B4', ['G#3', 'E4'], { leg: true, fin: 2, finL: [5, 1] }),
  s('q', 'C#5', ['A3', 'E4'], { leg: true, fin: 3, finL: [4, 1] }),
  s('8', ['F#4', 'B4', 'D5'], 'D3', { hair: 'end', dyn: 'sf', art: 'accent', fin: [1, 3, 5], finL: 5 }),
  // batt. 8 — cadenza in La
  s('q', ['E4', 'A4', 'C#5'], 'E3', { dyn: 'p', fin: [1, 3, 5], finL: 3 }),
  s('8', ['D4', 'E4', 'G#4', 'B4'], 'E2', { fin: [1, 2, 3, 5], finL: 5 }),
  s('q', ['C#4', 'E4', 'A4'], 'A2', { art: 'tenuto', fin: [1, 2, 5], finL: 5 }),
  s('8', undefined, undefined, { bar: 'repeat' }),
);

/** B: batt. 9–18. */
const k331B: PieceStep[] = seq(
  // batt. 9 — nuova frase, sempre puntata; gli arpeggi diventano accordi
  s('8d', 'E5', ['A3', 'C#4', 'E4'], { dyn: 'mf', leg: true, tieL: true, fin: 3, finL: [5, 3, 1] }),
  s('16', 'F#5', ['A3', 'C#4', 'E4'], { leg: true, tieL: true, fin: 4 }),
  s('8', 'E5', ['A3', 'C#4', 'E4'], { leg: true, fin: 3 }),
  s('q', 'F#5', ['A3', 'D4', 'F#4'], { leg: true, tieL: true, fin: 4, finL: [5, 2, 1] }),
  s('8', 'F#5', ['A3', 'D4', 'F#4'], { fin: 4 }),
  // batt. 10 — sale al La e ridiscende (senza l'appoggiatura dell'originale)
  s('8d', 'A5', ['A3', 'D4', 'F#4'], { leg: true, tieL: true, fin: 5, finL: [5, 2, 1] }),
  s('16', 'G#5', ['A3', 'D4', 'F#4'], { leg: true, tieL: true, fin: 4 }),
  s('8', 'F#5', ['A3', 'D4', 'F#4'], { leg: true, fin: 3 }),
  s('8', 'F#5', ['A3', 'C#4', 'E4'], { leg: true, tieL: true, fin: 3, finL: [5, 3, 1] }),
  s('8', 'E5', ['A3', 'C#4', 'E4'], { leg: true, tieL: true, fin: 2 }),
  s('8', 'E5', ['A3', 'C#4', 'E4'], { art: 'staccato', fin: 2 }),
  // batt. 11 — due arpeggi discendenti, l'ultima nota staccata
  s('8', 'E5', ['A3', 'C#4'], { dyn: 'f', leg: true, tieL: true, fin: 5, finL: [5, 2] }),
  s('8', 'C#5', ['A3', 'C#4'], { leg: true, fin: 3 }),
  s('8', 'A4', undefined, { art: 'staccato', fin: 1 }),
  s('8', 'E5', ['G#3', 'D4'], { leg: true, tieL: true, fin: 5, finL: [5, 1] }),
  s('8', 'D5', ['G#3', 'D4'], { leg: true, fin: 4 }),
  s('8', 'B4', undefined, { art: 'staccato', fin: 2 }),
  // batt. 12 — e la frase si chiude come batt. 4
  s('8', 'E5', ['A3', 'C#4'], { leg: true, tieL: true, fin: 5, finL: [5, 2] }),
  s('8', 'C#5', ['A3', 'C#4'], { leg: true, fin: 3 }),
  s('8', 'A4', ['F#3', 'D#4'], { art: 'staccato', fin: 1, finL: [5, 1] }),
  s('q', ['A4', 'C#5'], ['E3', 'E4'], { leg: true, tieL: true, fin: [1, 3], finL: [5, 1] }),
  s('8', ['G#4', 'B4'], ['E3', 'E4'], { fin: [1, 2] }),
  // batt. 13 — torna il tema
  s('8d', 'C#5', ['A3', 'E4'], { dyn: 'p', leg: true, fin: 3, finL: [5, 1] }),
  s('16', 'D5', 'B3', { leg: true, fin: 4, finL: 4 }),
  s('8', 'C#5', ['A3', 'E4'], { leg: true, fin: 3, finL: [5, 1] }),
  s('q', 'E5', ['C#4', 'E4'], { leg: true, fin: 5, finL: [3, 1] }),
  s('8', 'E5', ['C#4', 'E4'], { fin: 5 }),
  // batt. 14
  s('8d', 'B4', ['G#3', 'E4'], { leg: true, fin: 2, finL: [5, 1] }),
  s('16', 'C#5', 'A3', { leg: true, fin: 3, finL: 4 }),
  s('8', 'B4', ['G#3', 'E4'], { leg: true, fin: 2, finL: [5, 1] }),
  s('q', 'D5', ['B3', 'E4'], { leg: true, fin: 4, finL: [4, 1] }),
  s('8', 'D5', ['B3', 'E4'], { fin: 4 }),
  // batt. 15 — di nuovo lo sforzato
  s('q', 'A4', ['F#3', 'E4'], { leg: true, hair: 'cresc', fin: 1, finL: [5, 1] }),
  s('8', 'B4', ['G#3', 'E4'], { leg: true, fin: 2, finL: [5, 1] }),
  s('q', 'C#5', ['A3', 'E4'], { leg: true, fin: 3, finL: [4, 1] }),
  s('8', ['F#4', 'B4', 'D5'], 'D3', { hair: 'end', dyn: 'sf', art: 'accent', fin: [1, 3, 5], finL: 5 }),
  // batt. 16 — la cadenza, ma questa volta non chiude
  s('q', ['E4', 'A4', 'C#5'], 'E3', { dyn: 'p', fin: [1, 3, 5], finL: 3 }),
  s('8', ['E4', 'G#4', 'B4'], 'E2', { fin: [1, 2, 4], finL: 5 }),
  s('q', ['G#4', 'B4'], 'A2', { leg: true, tieL: true, fin: [1, 3], finL: 5 }),
  s('8', ['A4', 'C#5'], 'A2', { fin: [1, 3] }),
  // batt. 17 — forte, con le ottave alla sinistra e la volatina
  s('q', ['A4', 'C#5'], ['A2', 'A3'], { dyn: 'f', leg: true, fin: [1, 3], finL: [5, 1] }),
  s('8', ['G#4', 'D5'], ['B2', 'B3'], { leg: true, fin: [1, 4], finL: [5, 1] }),
  s('8d', ['A4', 'E5'], ['C#3', 'C#4'], { leg: true, tieL: true, fin: [1, 5], finL: [5, 1] }),
  s('16', 'F#5', ['C#3', 'C#4'], { leg: true, fin: 3 }),
  s('16', 'G#5', ['D3', 'D4'], { leg: true, tieL: true, fin: 4, finL: [5, 1] }),
  s('16', 'A5', ['D3', 'D4'], { leg: true, fin: 5 }),
  // batt. 18 — l'ultima battuta
  s('q', 'A4', ['E3', 'C#4'], { text: 'rit.', leg: true, fin: 1, finL: [5, 1] }),
  s('16', 'C#5', ['E3', 'D4'], { leg: true, tieL: true, fin: 3, finL: [5, 1] }),
  s('16', 'B4', ['E3', 'D4'], { leg: true, fin: 2 }),
  s('q', 'A4', ['A3', 'C#4'], { artB: 'fermata', fin: 1, finL: [5, 3] }),
  s('8', undefined, undefined, { bar: 'end' }),
);

const k331Steps: PieceStep[] = seq(rep(2, ...k331A), rep(2, ...k331B));

const temaK331 = p({
  id: 'mozart-k331-i-tema',
  title: 'Sonata in La maggiore K. 331 — I. Tema (Andante grazioso)',
  composer: 'W. A. Mozart',
  difficulty: 'difficile',
  level: 1,
  emoji: '👑',
  bpm: 60,
  meter: '6/8',
  key: { tonic: 'A', mode: 'maggiore' },
  tempoText: 'Andante grazioso',
  hint: 'Il ritmo puntato è tutto: la semicroma è corta davvero, e va appoggiata sulla croma che la precede. La sinistra suona due voci insieme — il Mi fermo e il basso che scende.',
  about: 'Il tema della sonata che finisce con la Marcia turca (1783). Diciotto battute in 6/8, due sezioni ripetute; su questo tema Mozart scrive poi sei variazioni.',
  focus: [
    'croma puntata più semicroma, senza appiattirla in due crome',
    'la sinistra a due note: pedale sul Mi e basso che cammina',
    'gli accordi di batt. 8 e 16, che vanno presi insieme e piano',
    'lo sforzato di batt. 7 e 15 dentro una frase che resta grazie',
  ],
  sections: [
    { name: 'A', from: 0, to: k331A.length, note: 'Batt. 1–8. Studia prima la sola sinistra: sotto il Mi ribattuto c\'è una linea che scende La–Sol♯–Fa♯. Poi aggiungi la destra e conta le semicrome ad alta voce.' },
    { name: 'A — ripetizione', from: k331A.length, to: 2 * k331A.length, note: 'La seconda volta più dolce ancora: è un tema, non un\'esposizione.' },
    { name: 'B', from: 2 * k331A.length, to: 2 * k331A.length + k331B.length, note: 'Batt. 9–18. La frase nuova sale fino al La; batt. 11–12 sono due arpeggi in giù con l\'ultima nota staccata. Da batt. 17 forte, con le ottave alla sinistra.' },
    { name: 'B — ripetizione', from: 2 * k331A.length + k331B.length, to: 2 * k331A.length + 2 * k331B.length, note: 'L\'ultima volta rallenta da batt. 18 e tieni la corona: il tema finisce, le variazioni no.' },
  ],
  steps: k331Steps,
});

export const mozart: Piece[] = [
  minuettoK2, variazioniK265, minuettoK1e, nachtmusikK525, sonataK545, temaK331,
];
