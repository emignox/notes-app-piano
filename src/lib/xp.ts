// ─────────────────────────────────────────────────────────────────────────────
// Punti esperienza e livelli del giocatore.
// Premia la fluidità (rispondere in fretta vale più che rispondere), non solo
// la quantità: è ciò che spinge verso l'automatismo nella lettura.
// ─────────────────────────────────────────────────────────────────────────────

import { FAST_MS, SLOW_MS } from './srs';

export interface XpGain {
  total: number;
  reasons: string[];
}

export function xpForAnswer(correct: boolean, ms: number, streak: number, usedHint: boolean): XpGain {
  if (!correct) return { total: 1, reasons: ['tentativo'] };

  const reasons: string[] = [];
  let total = 10;

  if (!usedHint && ms <= FAST_MS) {
    total += 6;
    reasons.push('fulmine ⚡');
  } else if (ms > SLOW_MS) {
    total -= 3;
  }
  if (usedHint) total -= 3;

  if (streak > 0 && streak % 5 === 0) {
    total += 10;
    reasons.push(`serie ×${streak} 🔥`);
  }

  return { total: Math.max(1, total), reasons };
}

/** XP cumulativi necessari per raggiungere il livello L (L ≥ 1). */
export function xpToReachLevel(level: number): number {
  return 30 * level * (level - 1);
}

export interface LevelInfo {
  level: number;
  intoLevel: number;
  needed: number;
  pct: number;
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  while (xpToReachLevel(level + 1) <= xp && level < 200) level++;
  const base = xpToReachLevel(level);
  const next = xpToReachLevel(level + 1);
  const needed = next - base;
  const intoLevel = xp - base;
  return { level, intoLevel, needed, pct: needed === 0 ? 0 : intoLevel / needed };
}

/** Titolo del livello: dà un senso di identità che il numero da solo non dà. */
export function levelTitle(level: number): string {
  if (level >= 25) return 'Maestro';
  if (level >= 18) return 'Concertista';
  if (level >= 13) return 'Solista';
  if (level >= 9) return 'Musicista';
  if (level >= 6) return 'Allievo esperto';
  if (level >= 3) return 'Allievo';
  return 'Principiante';
}
