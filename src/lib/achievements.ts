// Obiettivi: rendono visibile il progresso che altrimenti resta invisibile.
// Tutti calcolati dai dati già salvati — nessun contatore extra da mantenere.

import { curriculum, TOTAL_LEVELS } from '../data/curriculum';
import type { Persisted } from './storage';
import { cardKey, tierOf } from './srs';

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  check: (p: Persisted) => boolean;
}

function stageSolid(p: Persisted, stageId: string): boolean {
  const notes = curriculum.filter(n => n.stageId === stageId);
  const unlocked = curriculum.slice(0, p.unlockedCount).map(n => n.id);
  if (!notes.every(n => unlocked.includes(n.id))) return false;
  return notes.every(n => tierOf(p.cards[cardKey(n.id, 'read')]) >= 3);
}

function hasFastCard(p: Persisted): boolean {
  return Object.values(p.cards).some(c => c.correct >= 5 && c.avgMs > 0 && c.avgMs < 1200);
}

export const achievements: Achievement[] = [
  { id: 'first', emoji: '🎯', title: 'Primo passo', desc: 'Prima risposta data', check: p => p.answers >= 1 },
  { id: 'a100', emoji: '💯', title: 'Cento', desc: '100 risposte totali', check: p => p.answers >= 100 },
  { id: 'a500', emoji: '🎖️', title: 'Cinquecento', desc: '500 risposte totali', check: p => p.answers >= 500 },
  { id: 'a2000', emoji: '🏛️', title: 'Duemila', desc: '2000 risposte totali', check: p => p.answers >= 2000 },
  { id: 'streak10', emoji: '🔥', title: 'Serie da 10', desc: '10 risposte giuste di fila', check: p => p.bestStreak >= 10 },
  { id: 'streak25', emoji: '⚡', title: 'Serie da 25', desc: '25 risposte giuste di fila', check: p => p.bestStreak >= 25 },
  { id: 'streak50', emoji: '☄️', title: 'Serie da 50', desc: '50 risposte giuste di fila', check: p => p.bestStreak >= 50 },
  { id: 'day3', emoji: '📅', title: 'Tre giorni', desc: '3 giorni di fila', check: p => p.bestDayStreak >= 3 },
  { id: 'day7', emoji: '🗓️', title: 'Una settimana', desc: '7 giorni di fila', check: p => p.bestDayStreak >= 7 },
  { id: 'day30', emoji: '🏆', title: 'Un mese intero', desc: '30 giorni di fila', check: p => p.bestDayStreak >= 30 },
  { id: 'goal10', emoji: '✅', title: 'Costanza', desc: 'Obiettivo giornaliero raggiunto 10 volte', check: p => p.goalsMet >= 10 },
  { id: 'treble', emoji: '🎼', title: 'Chiave di violino', desc: 'Tutte le note base di violino solide', check: p => stageSolid(p, 'treble-core') },
  { id: 'bass', emoji: '🎹', title: 'Chiave di basso', desc: 'Tutte le note base di basso solide', check: p => stageSolid(p, 'bass-core') },
  { id: 'sharps', emoji: '♯', title: 'Diesis', desc: 'Tutti i diesis solidi', check: p => stageSolid(p, 'sharps') },
  { id: 'flats', emoji: '♭', title: 'Bemolle', desc: 'Tutti i bemolle solidi', check: p => stageSolid(p, 'flats') },
  { id: 'perfect1', emoji: '✨', title: 'Sessione perfetta', desc: 'Una sessione senza errori', check: p => p.perfectSessions >= 1 },
  { id: 'perfect10', emoji: '🌟', title: 'Dieci volte perfetto', desc: '10 sessioni senza errori', check: p => p.perfectSessions >= 10 },
  { id: 'sprint20', emoji: '🏃', title: 'Sprinter', desc: '20 note in un minuto', check: p => (p.sprintBest['60'] ?? 0) >= 20 },
  { id: 'sprint35', emoji: '🚀', title: 'Lettura a vista', desc: '35 note in un minuto', check: p => (p.sprintBest['60'] ?? 0) >= 35 },
  { id: 'melody', emoji: '🎵', title: 'Canzone perfetta', desc: 'Una melodia senza errori', check: p => Object.values(p.melodyBest).some(v => v >= 100) },
  { id: 'melody3', emoji: '🎶', title: 'Repertorio', desc: '3 melodie senza errori', check: p => Object.values(p.melodyBest).filter(v => v >= 100).length >= 3 },
  { id: 'fast', emoji: '💫', title: 'Riflessi', desc: 'Una nota riconosciuta sotto 1,2 s di media', check: hasFastCard },
  { id: 'all', emoji: '👑', title: 'Percorso completo', desc: 'Tutte le note sbloccate', check: p => p.unlockedCount >= TOTAL_LEVELS },
];

/** Restituisce gli obiettivi appena conquistati (da mostrare come festeggiamento). */
export function newlyUnlocked(state: Persisted): Achievement[] {
  return achievements.filter(a => !state.achievements.includes(a.id) && a.check(state));
}
