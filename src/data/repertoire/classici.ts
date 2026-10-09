// ─────────────────────────────────────────────────────────────────────────────
// Classici scritti per l'app, nota per nota.
//
// Per Elisa (Beethoven, WoO 59): il TEMA, cioè la parte che tutti conoscono —
// levare, otto battute, la ripresa e la chiusa sul La. Le due mani si passano
// il disegno: la sinistra sale in arpeggio (La-Mi-La), la destra risponde.
// È scritto a semicrome, una per passo: la nota lunga della destra è legata
// di valore, e nel Leggio diventa la croma che si legge sulla partitura.
// ─────────────────────────────────────────────────────────────────────────────

import type { Piece, PieceStep } from '../../types';
import { p, s, seq } from '../kit';

/** Battuta di sola destra: il "mi-re♯" che apre ogni frase. */
const motive = (): PieceStep[] => seq(
  s('16', 'E5', undefined, { fin: 5, leg: true }),
  s('16', 'D#5', undefined, { fin: 4, leg: true }),
  s('16', 'E5', undefined, { fin: 5, leg: true }),
  s('16', 'B4', undefined, { fin: 2, leg: true }),
  s('16', 'D5', undefined, { fin: 4, leg: true }),
  s('16', 'C5', undefined, { fin: 3 }),
);

/**
 * Battuta ad arpeggio: la destra tiene una croma mentre la sinistra sale in
 * tre semicrome, poi la destra risponde con le sue tre.
 */
const arp = (top: string, bass: [string, string, string], answer: [string | undefined, string | undefined, string | undefined], fingers = false): PieceStep[] => seq(
  s('16', top, bass[0], { tie: true, ped: 'down', ...(fingers ? { finL: 5 } : {}) }),
  s('16', top, bass[1], fingers ? { finL: 2 } : {}),
  s('16', undefined, bass[2], fingers ? { finL: 1 } : {}),
  s('16', answer[0], undefined, fingers ? { fin: 1, leg: true } : { leg: true }),
  s('16', answer[1], undefined, fingers ? { fin: 2, leg: true } : { leg: true }),
  s('16', answer[2], undefined, fingers ? { fin: 3, ped: 'up' } : { ped: 'up' }),
);

const LA: [string, string, string] = ['A2', 'E3', 'A3'];
const MI: [string, string, string] = ['E2', 'E3', 'G#3'];

const firstHalf = (): PieceStep[] => seq(
  motive(),                                            // batt. 1
  arp('A4', LA, ['C4', 'E4', 'A4'], true),             // batt. 2
  arp('B4', MI, ['E4', 'G#4', 'B4']),                  // batt. 3
  arp('C5', LA, ['E4', 'E5', 'D#5']),                  // batt. 4
  motive(),                                            // batt. 5
  arp('A4', LA, ['C4', 'E4', 'A4']),                   // batt. 6
  arp('B4', MI, ['E4', 'C5', 'B4']),                   // batt. 7
);

export const perElisa: Piece = p({
  id: 'beethoven-per-elisa',
  title: 'Per Elisa — il tema',
  composer: 'L. van Beethoven',
  difficulty: 'facile',
  // fra il Minuetto di Bach (6) e il primo Minuetto di Mozart (7)
  level: 6.5,
  emoji: '💌',
  bpm: 84,
  meter: '3/8',
  key: { tonic: 'A', mode: 'minore' },
  pickup: 0.5,
  tempoText: 'Poco moto',
  hint: 'Le mani si passano il disegno: prima la sinistra sale in arpeggio, poi la destra risponde. Mai insieme, sempre a turno.',
  about: 'Il Bagatella in la minore WoO 59, scritta nel 1810: il pezzo per pianoforte più famoso al mondo. Qui il tema, con la sua ripresa.',
  focus: [
    'il "mi-re♯" leggero, quasi un sussurro (pp)',
    'il passaggio del disegno dalla sinistra alla destra senza buchi',
    'il pedale che cambia a ogni battuta di arpeggio',
  ],
  sections: [
    { name: 'Tema', from: 0, to: 50, note: 'Il levare e le otto battute. Studia prima la sinistra sola: tre note che salgono, sempre uguali.' },
    { name: 'Ripresa', from: 50, to: 96, note: 'Lo stesso tema, che questa volta si chiude sul La.' },
  ],
  steps: seq(
    // levare
    s('16', 'E5', undefined, { dyn: 'pp', fin: 5, leg: true }),
    s('16', 'D#5', undefined, { fin: 4, leg: true }),
    firstHalf(),
    // batt. 8, prima volta: il La e di nuovo il "mi-re♯" per ricominciare
    s('16', 'A4', 'A2', { tie: true, ped: 'down' }),
    s('16', 'A4', 'E3'),
    s('16', undefined, 'A3', { ped: 'up' }),
    s('16'),
    s('16', 'E5', undefined, { leg: true }),
    s('16', 'D#5', undefined, { leg: true }),
    // ripresa
    firstHalf(),
    // batt. 8, seconda volta: la chiusa sul La
    s('16', 'A4', 'A2', { tie: true, ped: 'down' }),
    s('16', 'A4', 'E3', { tie: true }),
    s('16', 'A4', 'A3', { tie: true }),
    s('8d', 'A4', undefined, { bar: 'end' }),
  ),
});

export const classici: Piece[] = [perElisa];
