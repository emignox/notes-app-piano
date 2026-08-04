// ─────────────────────────────────────────────────────────────────────────────
// L'unico posto in cui vive il progresso: carte SRS, XP, serie, statistiche,
// obiettivi e impostazioni. Le modifiche passano da `apply`, che aggiorna in
// modo sincrono anche il ref: così due risposte ravvicinate non si perdono.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Direction, NoteEntry } from '../types';
import { curriculum, TOTAL_LEVELS } from '../data/curriculum';
import type { Achievement } from '../lib/achievements';
import { newlyUnlocked } from '../lib/achievements';
import { setHaptics } from '../lib/haptics';
import type { Persisted, Settings } from '../lib/storage';
import { clearAll, emptyState, load, save, shiftDay, todayKey } from '../lib/storage';
import type { Card } from '../lib/srs';
import { cardKey, newCard, readyForNext, review } from '../lib/srs';
import { dueCount as computeDue } from '../lib/session';
import { levelInfo } from '../lib/xp';
import { xpForAnswer } from '../lib/xp';

const MAX_DAYS_KEPT = 180;

export interface AnswerOutcome {
  xp: number;
  reasons: string[];
  streak: number;
  leveledUp: number | null;
  achievements: Achievement[];
  card: Card;
}

function pruneDays(days: Persisted['days']): Persisted['days'] {
  const keys = Object.keys(days).sort();
  if (keys.length <= MAX_DAYS_KEPT) return days;
  const keep = keys.slice(-MAX_DAYS_KEPT);
  return Object.fromEntries(keep.map(k => [k, days[k]]));
}

function withAchievements(state: Persisted): { state: Persisted; unlocked: Achievement[] } {
  const unlocked = newlyUnlocked(state);
  if (unlocked.length === 0) return { state, unlocked };
  return {
    state: { ...state, achievements: [...state.achievements, ...unlocked.map(a => a.id)] },
    unlocked,
  };
}

export function useProgress() {
  const [data, setData] = useState<Persisted>(load);
  const ref = useRef(data);
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);

  const apply = useCallback((fn: (p: Persisted) => Persisted): Persisted => {
    const next = fn(ref.current);
    ref.current = next;
    setData(next);
    return next;
  }, []);

  useEffect(() => { save(data); }, [data]);

  // Tema e vibrazione sono effetti globali: si applicano appena cambiano.
  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme;
    document.documentElement.style.colorScheme = data.settings.theme;
  }, [data.settings.theme]);

  useEffect(() => { setHaptics(data.settings.haptics); }, [data.settings.haptics]);

  const unlockedNotes = useMemo<NoteEntry[]>(
    () => curriculum.slice(0, Math.min(data.unlockedCount, TOTAL_LEVELS)),
    [data.unlockedCount],
  );

  const newestNote = unlockedNotes[unlockedNotes.length - 1];

  // ── Risposta ──────────────────────────────────────────────────────────────
  const answer = useCallback(
    (noteId: string, dir: Direction, correct: boolean, ms: number, usedHint = false): AnswerOutcome => {
      const now = Date.now();
      const nextStreak = correct ? streakRef.current + 1 : 0;
      streakRef.current = nextStreak;
      setStreak(nextStreak);

      const gain = xpForAnswer(correct, ms, nextStreak, usedHint);
      const key = cardKey(noteId, dir);
      let updatedCard: Card = newCard(noteId, dir);
      let leveledUp: number | null = null;

      const result = apply(prev => {
        const current = prev.cards[key] ?? newCard(noteId, dir);
        updatedCard = review(current, { correct, ms, usedHint, now });

        const today = todayKey();
        const prevDay = prev.days[today] ?? { answers: 0, correct: 0, xp: 0 };
        const day = {
          answers: prevDay.answers + 1,
          correct: prevDay.correct + (correct ? 1 : 0),
          xp: prevDay.xp + gain.total,
        };

        const goal = prev.settings.dailyGoal;
        const justMetGoal = prevDay.answers < goal && day.answers >= goal;

        let dayStreak = prev.dayStreak;
        if (prev.lastDay !== today) {
          dayStreak = prev.lastDay === shiftDay(today, -1) ? prev.dayStreak + 1 : 1;
        }
        if (dayStreak === 0) dayStreak = 1;

        const xp = prev.xp + gain.total;
        if (levelInfo(xp).level > levelInfo(prev.xp).level) leveledUp = levelInfo(xp).level;

        return {
          ...prev,
          cards: { ...prev.cards, [key]: updatedCard },
          xp,
          answers: prev.answers + 1,
          correct: prev.correct + (correct ? 1 : 0),
          bestStreak: Math.max(prev.bestStreak, nextStreak),
          days: pruneDays({ ...prev.days, [today]: day }),
          dayStreak,
          bestDayStreak: Math.max(prev.bestDayStreak, dayStreak),
          lastDay: today,
          goalsMet: prev.goalsMet + (justMetGoal ? 1 : 0),
        };
      });

      const { state, unlocked } = withAchievements(result);
      if (unlocked.length > 0) apply(() => state);

      return { xp: gain.total, reasons: gain.reasons, streak: nextStreak, leveledUp, achievements: unlocked, card: updatedCard };
    },
    [apply],
  );

  const resetStreak = useCallback(() => {
    streakRef.current = 0;
    setStreak(0);
  }, []);

  // ── Fine sessione ─────────────────────────────────────────────────────────
  const finishSession = useCallback(
    (wrongCount: number): Achievement[] => {
      const result = apply(prev => ({
        ...prev,
        sessions: prev.sessions + 1,
        perfectSessions: prev.perfectSessions + (wrongCount === 0 ? 1 : 0),
      }));
      const { state, unlocked } = withAchievements(result);
      if (unlocked.length > 0) apply(() => state);
      return unlocked;
    },
    [apply],
  );

  // ── Sbloccare la nota successiva ──────────────────────────────────────────
  const canUnlockNext = useMemo(() => {
    if (data.unlockedCount >= TOTAL_LEVELS) return false;
    if (!newestNote) return false;
    return readyForNext(data.cards[cardKey(newestNote.id, 'read')]);
  }, [data.unlockedCount, data.cards, newestNote]);

  const unlockNext = useCallback((): NoteEntry | null => {
    if (ref.current.unlockedCount >= TOTAL_LEVELS) return null;
    const result = apply(prev => ({ ...prev, unlockedCount: prev.unlockedCount + 1 }));
    const { state, unlocked } = withAchievements(result);
    if (unlocked.length > 0) apply(() => state);
    return curriculum[result.unlockedCount - 1] ?? null;
  }, [apply]);

  const markIntroSeen = useCallback(
    (noteId: string) => {
      apply(prev =>
        prev.introSeen.includes(noteId) ? prev : { ...prev, introSeen: [...prev.introSeen, noteId] },
      );
    },
    [apply],
  );

  // ── Sprint e melodie ──────────────────────────────────────────────────────
  const recordSprint = useCallback(
    (durationSec: number, score: number): { best: boolean; achievements: Achievement[] } => {
      const k = String(durationSec);
      const prevBest = ref.current.sprintBest[k] ?? 0;
      const isBest = score > prevBest;
      const result = apply(prev => ({
        ...prev,
        sprintBest: { ...prev.sprintBest, [k]: Math.max(prevBest, score) },
      }));
      const { state, unlocked } = withAchievements(result);
      if (unlocked.length > 0) apply(() => state);
      return { best: isBest, achievements: unlocked };
    },
    [apply],
  );

  const recordMelody = useCallback(
    (melodyId: string, pct: number): Achievement[] => {
      const result = apply(prev => ({
        ...prev,
        melodyBest: { ...prev.melodyBest, [melodyId]: Math.max(prev.melodyBest[melodyId] ?? 0, pct) },
      }));
      const { state, unlocked } = withAchievements(result);
      if (unlocked.length > 0) apply(() => state);
      return unlocked;
    },
    [apply],
  );

  // ── Impostazioni e reset ──────────────────────────────────────────────────
  const setSettings = useCallback(
    (patch: Partial<Settings>) => {
      apply(prev => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    },
    [apply],
  );

  const resetAll = useCallback(() => {
    clearAll();
    const fresh = { ...emptyState(), settings: ref.current.settings };
    ref.current = fresh;
    setData(fresh);
    resetStreak();
  }, [resetStreak]);

  const replaceState = useCallback((next: Persisted) => {
    ref.current = next;
    setData(next);
  }, []);

  // ── Valori derivati per la UI ─────────────────────────────────────────────
  const today = todayKey();
  const todayStat = data.days[today] ?? { answers: 0, correct: 0, xp: 0 };
  const level = levelInfo(data.xp);
  const due = useMemo(() => computeDue(unlockedNotes, data.cards), [unlockedNotes, data.cards]);
  const goalPct = Math.min(1, todayStat.answers / Math.max(1, data.settings.dailyGoal));

  return {
    data,
    settings: data.settings,
    unlockedNotes,
    newestNote,
    streak,
    level,
    todayStat,
    goalPct,
    due,
    canUnlockNext,
    isComplete: data.unlockedCount >= TOTAL_LEVELS,
    answer,
    resetStreak,
    finishSession,
    unlockNext,
    markIntroSeen,
    recordSprint,
    recordMelody,
    setSettings,
    resetAll,
    replaceState,
  };
}

export type ProgressApi = ReturnType<typeof useProgress>;
