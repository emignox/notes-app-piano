// Obiettivi: rendono visibile il progresso che altrimenti resta invisibile.
// Tutti calcolati dai dati già salvati — nessun contatore extra da mantenere.

import { curriculum, TOTAL_LEVELS } from '../data/curriculum';
import type { Persisted } from './storage';
import { cardKey, tierOf } from './srs';
import { t } from '../i18n';

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

// Titolo e descrizione si leggono al momento dell'uso (getter): così seguono la
// lingua scelta anche se l'elenco è costruito una volta sola, all'avvio.
export const achievements: Achievement[] = [
  { id: 'first', emoji: '🎯', get title() { return t('Primo passo'); }, get desc() { return t('Prima risposta data'); }, check: p => p.answers >= 1 },
  { id: 'a100', emoji: '💯', get title() { return t('Cento'); }, get desc() { return t('100 risposte totali'); }, check: p => p.answers >= 100 },
  { id: 'a500', emoji: '🎖️', get title() { return t('Cinquecento'); }, get desc() { return t('500 risposte totali'); }, check: p => p.answers >= 500 },
  { id: 'a2000', emoji: '🏛️', get title() { return t('Duemila'); }, get desc() { return t('2000 risposte totali'); }, check: p => p.answers >= 2000 },
  { id: 'streak10', emoji: '🔥', get title() { return t('Serie da 10'); }, get desc() { return t('10 risposte giuste di fila'); }, check: p => p.bestStreak >= 10 },
  { id: 'streak25', emoji: '⚡', get title() { return t('Serie da 25'); }, get desc() { return t('25 risposte giuste di fila'); }, check: p => p.bestStreak >= 25 },
  { id: 'streak50', emoji: '☄️', get title() { return t('Serie da 50'); }, get desc() { return t('50 risposte giuste di fila'); }, check: p => p.bestStreak >= 50 },
  { id: 'day3', emoji: '📅', get title() { return t('Tre giorni'); }, get desc() { return t('3 giorni di fila'); }, check: p => p.bestDayStreak >= 3 },
  { id: 'day7', emoji: '🗓️', get title() { return t('Una settimana'); }, get desc() { return t('7 giorni di fila'); }, check: p => p.bestDayStreak >= 7 },
  { id: 'day30', emoji: '🏆', get title() { return t('Un mese intero'); }, get desc() { return t('30 giorni di fila'); }, check: p => p.bestDayStreak >= 30 },
  { id: 'goal10', emoji: '✅', get title() { return t('Costanza'); }, get desc() { return t('Obiettivo giornaliero raggiunto 10 volte'); }, check: p => p.goalsMet >= 10 },
  { id: 'treble', emoji: '🎼', get title() { return t('Chiave di violino'); }, get desc() { return t('Tutte le note base di violino solide'); }, check: p => stageSolid(p, 'treble-core') },
  { id: 'bass', emoji: '🎹', get title() { return t('Chiave di basso'); }, get desc() { return t('Tutte le note base di basso solide'); }, check: p => stageSolid(p, 'bass-core') },
  { id: 'sharps', emoji: '♯', get title() { return t('Diesis'); }, get desc() { return t('Tutti i diesis solidi'); }, check: p => stageSolid(p, 'sharps') },
  { id: 'flats', emoji: '♭', get title() { return t('Bemolle'); }, get desc() { return t('Tutti i bemolle solidi'); }, check: p => stageSolid(p, 'flats') },
  { id: 'perfect1', emoji: '✨', get title() { return t('Sessione perfetta'); }, get desc() { return t('Una sessione senza errori'); }, check: p => p.perfectSessions >= 1 },
  { id: 'perfect10', emoji: '🌟', get title() { return t('Dieci volte perfetto'); }, get desc() { return t('10 sessioni senza errori'); }, check: p => p.perfectSessions >= 10 },
  { id: 'sprint20', emoji: '🏃', get title() { return t('Sprinter'); }, get desc() { return t('20 note in un minuto'); }, check: p => (p.sprintBest['60'] ?? 0) >= 20 },
  { id: 'sprint35', emoji: '🚀', get title() { return t('Lettura a vista'); }, get desc() { return t('35 note in un minuto'); }, check: p => (p.sprintBest['60'] ?? 0) >= 35 },
  { id: 'melody', emoji: '🎵', get title() { return t('Canzone perfetta'); }, get desc() { return t('Una melodia senza errori'); }, check: p => Object.values(p.melodyBest).some(v => v >= 100) },
  { id: 'melody3', emoji: '🎶', get title() { return t('Repertorio'); }, get desc() { return t('3 melodie senza errori'); }, check: p => Object.values(p.melodyBest).filter(v => v >= 100).length >= 3 },
  { id: 'fast', emoji: '💫', get title() { return t('Riflessi'); }, get desc() { return t('Una nota riconosciuta sotto 1,2 s di media'); }, check: hasFastCard },
  { id: 'all', emoji: '👑', get title() { return t('Percorso completo'); }, get desc() { return t('Tutte le note sbloccate'); }, check: p => p.unlockedCount >= TOTAL_LEVELS },
];

/** Restituisce gli obiettivi appena conquistati (da mostrare come festeggiamento). */
export function newlyUnlocked(state: Persisted): Achievement[] {
  return achievements.filter(a => !state.achievements.includes(a.id) && a.check(state));
}
