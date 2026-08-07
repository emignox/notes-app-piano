// ─────────────────────────────────────────────────────────────────────────────
// Costruzione della sessione di studio.
//
// Tre principi:
//  · PRIORITÀ AI RIPASSI SCADUTI (ripetizione spaziata) e alle note deboli;
//  · INTERLEAVING: note mescolate, mai due volte la stessa di fila. Studiare
//    "a blocchi" dà l'illusione di saperle, mescolare costruisce il ricordo;
//  · DUE DIREZIONI: leggere il pentagramma (segno→nome) e trovare il tasto
//    (nome→tastiera). La seconda arriva solo quando la prima regge.
// ─────────────────────────────────────────────────────────────────────────────

import type { Direction, NoteEntry } from '../types';
import type { Card } from './srs';
import { cardKey, DAY_MS, isDue, mastery } from './srs';

export interface Question {
  noteId: string;
  dir: Direction;
  /** Prima apparizione in assoluto: la carta viene presentata, non "chiesta". */
  isNew: boolean;
}

export interface BuildOptions {
  unlocked: NoteEntry[];
  cards: Record<string, Card>;
  length: number;
  now?: number;
  /** Allenamento mirato: solo queste note (modalità "note difficili"). */
  focusIds?: string[];
  /** Quota di esercizi "trova il tasto" (0-1). */
  findRatio?: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function scoreFor(note: NoteEntry, cards: Record<string, Card>, now: number, focusIds?: string[]): number {
  const card = cards[cardKey(note.id, 'read')];
  let score: number;
  if (!card || card.reps === 0) {
    score = 120;                                        // mai vista → massima priorità
  } else if (isDue(card, now)) {
    const overdueDays = (now - card.due) / DAY_MS;
    score = 80 + clamp(overdueDays * 4, 0, 30);         // scaduta, tanto più quanto è in ritardo
  } else {
    score = 45 * (1 - mastery(card));                   // non scaduta: pesa la debolezza
  }
  if (focusIds && focusIds.includes(note.id)) score += 250;
  if (card && now - card.last < 45_000) score -= 35;    // appena vista: lasciala respirare
  return Math.max(1, score) + Math.random() * 10;
}

function weightedDraw(weights: number[], skipIndex: number): number {
  let total = 0;
  for (let i = 0; i < weights.length; i++) if (i !== skipIndex) total += weights[i];
  if (total <= 0) return skipIndex === 0 && weights.length > 1 ? 1 : 0;
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    if (i === skipIndex) continue;
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.findIndex((_, i) => i !== skipIndex);
}

/**
 * Dispone gli elementi separando il più possibile quelli uguali.
 * A ogni passo sceglie quello che resta più volte fra i candidati diversi
 * dall'ultimo piazzato; a parità, a caso, così due sessioni non sono identiche.
 */
export function spread<T>(items: T[]): T[] {
  const left = new Map<T, number>();
  for (const it of items) left.set(it, (left.get(it) ?? 0) + 1);

  const out: T[] = [];
  let last: T | undefined;
  while (out.length < items.length) {
    let best: T | undefined;
    let bestCount = 0;
    let ties = 0;
    for (const [item, count] of left) {
      if (count === 0 || (item === last && left.size > 1)) continue;
      if (count > bestCount) { best = item; bestCount = count; ties = 1; }
      else if (count === bestCount) { ties++; if (Math.random() < 1 / ties) best = item; }
    }
    // Restava solo la nota appena piazzata: inevitabile (poche note sbloccate).
    if (best === undefined) {
      for (const [item, count] of left) if (count > 0) { best = item; break; }
      if (best === undefined) break;
    }
    out.push(best);
    const n = (left.get(best) ?? 1) - 1;
    if (n === 0) left.delete(best); else left.set(best, n);
    last = best;
  }
  return out;
}

export function buildSession(opts: BuildOptions): Question[] {
  const { unlocked, cards, focusIds } = opts;
  if (unlocked.length === 0) return [];
  const now = opts.now ?? Date.now();
  const pool = focusIds?.length ? unlocked.filter(n => focusIds.includes(n.id)) : unlocked;
  if (pool.length === 0) return [];

  const targetLen = clamp(Math.round(opts.length), 4, 30);
  const weights = pool.map(n => scoreFor(n, cards, now, focusIds));

  // Le note urgenti (nuove o scadute) entrano comunque almeno una volta.
  const mustHave = pool
    .map((_, i) => ({ i, w: weights[i] }))
    .filter(x => x.w >= 78)
    .sort((a, b) => b.w - a.w)
    .slice(0, targetLen)
    .map(x => x.i);

  const picks: number[] = [...mustHave];
  let guard = 0;
  while (picks.length < targetLen && guard++ < 500) {
    const last = picks[picks.length - 1] ?? -1;
    picks.push(weightedDraw(weights, pool.length > 1 ? last : -1));
  }

  // Interleaving. Mescolare a caso e poi tentare qualche scambio non basta:
  // il mescolamento RICREA le ripetizioni e la riparazione, cercando solo in
  // avanti, spesso non trova un posto dove spostarle. Risultato: capitava la
  // stessa nota due volte di fila, cioè la domanda più inutile che ci sia —
  // l'hai appena vista, non stai ricordando nulla.
  //
  // Qui invece si dispone per costruzione: a ogni passo si prende la nota che
  // resta più volte da piazzare, escludendo quella appena messa. Finché una
  // sola nota non supera la metà dei posti, il risultato non ha ripetizioni
  // adiacenti — ed è dimostrabile, non affidato al caso.
  const ordered = spread(picks);

  // Direzione: "trova il tasto" solo su note già nominabili, e mai sulla nuova.
  const findRatio = opts.findRatio ?? (unlocked.length >= 3 ? 0.25 : 0);
  const alreadyIntroduced = new Set<string>();
  return ordered.map((idx, slot) => {
    const note = pool[idx];
    const readCard = cards[cardKey(note.id, 'read')];
    // "Nuova" solo alla prima apparizione: dalla seconda in poi non lo è più.
    const firstEver = !readCard || readCard.reps === 0;
    const isNew = firstEver && !alreadyIntroduced.has(note.id);
    if (firstEver) alreadyIntroduced.add(note.id);
    const canFind = !firstEver && mastery(readCard) >= 0.25;
    const useFind = canFind && findRatio > 0 && (slot % Math.max(2, Math.round(1 / findRatio)) === 1);
    return { noteId: note.id, dir: (useFind ? 'find' : 'read') as Direction, isNew };
  });
}

/** Le note peggiori: alimenta l'allenamento mirato e la schermata progressi. */
export function weakestNotes(
  unlocked: NoteEntry[],
  cards: Record<string, Card>,
  count = 5,
): { note: NoteEntry; card?: Card; score: number }[] {
  return unlocked
    .map(note => {
      const card = cards[cardKey(note.id, 'read')];
      // Chi non è mai stato provato non è "debole": è solo nuovo → in fondo.
      const score = !card || card.reps === 0 ? 0.5 : 1 - mastery(card);
      return { note, card, score };
    })
    .filter(x => x.card && x.card.reps > 0 && x.score > 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

/** Quante carte sono da ripassare adesso. */
export function dueCount(unlocked: NoteEntry[], cards: Record<string, Card>, now = Date.now()): number {
  return unlocked.reduce((acc, n) => {
    const c = cards[cardKey(n.id, 'read')];
    return acc + (c && c.reps > 0 && isDue(c, now) ? 1 : 0);
  }, 0);
}

/** Estrazione singola per lo Sprint: pesa le note deboli, evita la ripetizione. */
export function pickOne(
  unlocked: NoteEntry[],
  cards: Record<string, Card>,
  lastId: string | null,
): NoteEntry {
  const pool = unlocked.length > 1 && lastId ? unlocked.filter(n => n.id !== lastId) : unlocked;
  const weights = pool.map(n => {
    const c = cards[cardKey(n.id, 'read')];
    return 1 + (c && c.reps > 0 ? 3 * (1 - mastery(c)) : 2);
  });
  return pool[weightedDraw(weights, -1)] ?? unlocked[0];
}
