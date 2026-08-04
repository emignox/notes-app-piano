// ─────────────────────────────────────────────────────────────────────────────
// Ripetizione spaziata (SM-2 adattato) + calcolo della padronanza.
//
// Perché: la memoria funziona per rievocazione distanziata nel tempo. Ripassare
// una nota che già conosci è tempo sprecato; ripassarla poco prima di
// dimenticarla è il momento in cui l'apprendimento è massimo.
//
// Adattamenti rispetto a SM-2 classico:
//  · il voto non lo dà l'utente ma il TEMPO DI RISPOSTA (per leggere le note
//    conta la fluidità, non solo l'esattezza: 4 secondi non è "saputo");
//  · l'errore rimanda la carta a 10 minuti (rientra nella stessa sessione).
// ─────────────────────────────────────────────────────────────────────────────

import type { Direction } from '../types';

export const DAY_MS = 86_400_000;
const RELEARN_MS = 10 * 60_000;

/** Soglie di fluidità in ms. Sotto FAST = automatismo, sopra SLOW = stai contando. */
export const FAST_MS = 1800;
export const SLOW_MS = 4000;

export interface Card {
  noteId: string;
  dir: Direction;
  ease: number;        // 1.3 – 2.8
  interval: number;    // giorni (0 = in riapprendimento)
  reps: number;        // risposte totali date
  lapses: number;      // quante volte è stata sbagliata dopo averla saputa
  due: number;         // timestamp del prossimo ripasso
  last: number;        // timestamp dell'ultima risposta
  correct: number;
  wrong: number;
  avgMs: number;       // media mobile del tempo di risposta
  streak: number;      // risposte corrette consecutive
  bestStreak: number;
}

export const cardKey = (noteId: string, dir: Direction): string => `${noteId}|${dir}`;

export function newCard(noteId: string, dir: Direction): Card {
  return {
    noteId,
    dir,
    ease: 2.5,
    interval: 0,
    reps: 0,
    lapses: 0,
    due: 0,
    last: 0,
    correct: 0,
    wrong: 0,
    avgMs: 0,
    streak: 0,
    bestStreak: 0,
  };
}

export type Speed = 'fast' | 'ok' | 'slow';

export function speedOf(ms: number): Speed {
  if (ms <= FAST_MS) return 'fast';
  if (ms <= SLOW_MS) return 'ok';
  return 'slow';
}

/** Voto 0-5 in stile SM-2, dedotto da esattezza + fluidità. */
export function gradeOf(correct: boolean, ms: number, usedHint: boolean): number {
  if (!correct) return 1;
  if (usedHint) return 3;
  const s = speedOf(ms);
  return s === 'fast' ? 5 : s === 'ok' ? 4 : 3;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface ReviewInput {
  correct: boolean;
  ms: number;
  usedHint?: boolean;
  now?: number;
}

/** Applica un ripasso e restituisce la carta aggiornata (pura, nessun effetto). */
export function review(card: Card, input: ReviewInput): Card {
  const now = input.now ?? Date.now();
  const ms = clamp(input.ms, 120, 30_000);
  const q = gradeOf(input.correct, ms, input.usedHint ?? false);

  const reps = card.reps + 1;
  // Media mobile: le prime risposte pesano tanto, poi si stabilizza.
  const avgMs = card.avgMs === 0 ? ms : Math.round(card.avgMs * 0.7 + ms * 0.3);

  if (!input.correct) {
    return {
      ...card,
      reps,
      avgMs,
      wrong: card.wrong + 1,
      lapses: card.interval >= 1 ? card.lapses + 1 : card.lapses,
      streak: 0,
      ease: clamp(card.ease - 0.2, 1.3, 2.8),
      interval: 0,
      due: now + RELEARN_MS,
      last: now,
    };
  }

  const streak = card.streak + 1;
  const easeDelta = q === 5 ? 0.1 : q === 4 ? 0 : -0.05;
  const ease = clamp(card.ease + easeDelta, 1.3, 2.8);

  // Intervalli di "laurea" per le prime due risposte giuste, poi moltiplicatore.
  let interval: number;
  if (streak === 1) interval = 1;
  else if (streak === 2) interval = 3;
  else interval = Math.round(Math.max(card.interval, 1) * ease);
  if (q === 3) interval = Math.max(1, Math.round(interval * 0.6)); // lenta → ripassa prima
  interval = clamp(interval, 1, 180);

  return {
    ...card,
    reps,
    avgMs,
    correct: card.correct + 1,
    streak,
    bestStreak: Math.max(card.bestStreak, streak),
    ease,
    interval,
    due: now + interval * DAY_MS,
    last: now,
  };
}

export function isDue(card: Card, now = Date.now()): boolean {
  return card.due <= now;
}

export function accuracyOf(card: Card): number {
  const total = card.correct + card.wrong;
  return total === 0 ? 0 : card.correct / total;
}

/**
 * Padronanza 0-1: pesa esattezza, fluidità e quanto lontano è stato spinto
 * l'intervallo. Le prime risposte contano poco (non si "impara" in 2 tentativi).
 */
export function mastery(card: Card): number {
  if (card.reps === 0) return 0;
  const acc = accuracyOf(card);
  const speed = card.avgMs === 0
    ? 0
    : clamp((SLOW_MS + 1000 - card.avgMs) / (SLOW_MS + 1000 - FAST_MS), 0, 1);
  const retention = clamp(card.interval / 16, 0, 1);
  const raw = 0.35 * acc + 0.25 * speed + 0.4 * retention;
  const warmup = Math.min(1, card.reps / 3);
  return clamp(raw * warmup, 0, 1);
}

export type Tier = 0 | 1 | 2 | 3 | 4;

/** 0 = mai vista · 1 = da scoprire · 2 = incerta · 3 = solida · 4 = automatica */
export function tierOf(card: Card | undefined): Tier {
  if (!card || card.reps === 0) return 0;
  const m = mastery(card);
  if (m < 0.2) return 1;
  if (m < 0.45) return 2;
  if (m < 0.75) return 3;
  return 4;
}

export const TIER_LABELS = ['Da imparare', 'Iniziata', 'Incerta', 'Solida', 'Automatica'] as const;

/** Colori della mappa di padronanza (coerenti fra heatmap e badge). */
export const TIER_COLORS = ['#334155', '#b45309', '#ca8a04', '#15803d', '#4f46e5'] as const;

/** Quando è pronta la prossima nota: sapere + saperlo in fretta, non solo indovinare. */
export function readyForNext(card: Card | undefined): boolean {
  if (!card) return false;
  return card.correct >= 3 && card.streak >= 2 && card.avgMs > 0 && card.avgMs < SLOW_MS + 1500;
}
