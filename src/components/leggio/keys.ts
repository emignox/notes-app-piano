// Geometria della tastiera del Leggio: dove sta ogni tasto, in frazioni della
// larghezza. La usano sia la tastiera sia la cascata di note, che così cadono
// esattamente sopra il tasto da premere.

import { italianOf, noteFromMidi } from '../../lib/notes';

const BLACK = new Set([1, 3, 6, 8, 10]);
export const isBlack = (midi: number) => BLACK.has(((midi % 12) + 12) % 12);

export interface KeyBox {
  /** Bordo sinistro e larghezza, in frazioni (0–1) della tastiera. */
  x: number;
  w: number;
  black: boolean;
}

export function keyLayout(from: number, to: number): Map<number, KeyBox> {
  const whites: number[] = [];
  for (let m = from; m <= to; m++) if (!isBlack(m)) whites.push(m);
  const W = 1 / Math.max(1, whites.length);
  const out = new Map<number, KeyBox>();
  whites.forEach((m, i) => out.set(m, { x: i * W, w: W, black: false }));
  const bw = W * 0.62;
  for (let m = from; m <= to; m++) {
    if (!isBlack(m)) continue;
    const left = out.get(m - 1);
    if (left) out.set(m, { x: left.x + W - bw / 2, w: bw, black: true });
  }
  return out;
}

/** Quanti tasti bianchi stanno comodi in una larghezza (un dito ~ 26-30 px). */
export function whiteKeysFor(width: number): number {
  return Math.max(10, Math.min(52, Math.floor(width / 27)));
}

/**
 * La finestra di tastiera da mostrare per coprire [lo, hi]: comincia su un Do
 * o un Fa, ha (almeno) `whites` tasti bianchi, e si allarga se le note non ci
 * stanno. Muoverla il meno possibile è compito di chi la usa.
 */
export function windowFor(lo: number, hi: number, whites: number): [number, number] {
  let start = lo;
  while (isBlack(start) || ![0, 5].includes(((start % 12) + 12) % 12)) start--;
  let end = start;
  let count = 1;
  while (count < whites || end < hi) {
    end++;
    if (!isBlack(end)) count++;
  }
  return [Math.max(21, start), Math.min(108, end)];
}

export const midiName = (midi: number) => italianOf(noteFromMidi(midi));
export const midiTone = (midi: number) => noteFromMidi(midi);

/** Colori del Leggio: blu la destra, viola la sinistra, verde giusto, rosso sbagliato. */
export const HAND_COLOR = ['#3b82f6', '#a855f7'] as const;
export const GOOD_COLOR = '#22c55e';
export const BAD_COLOR = '#ef4444';
