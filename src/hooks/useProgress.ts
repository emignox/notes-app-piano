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
import { DAY_MS, cardKey, newCard, readyForNext, review } from '../lib/srs';
import { dueCount as computeDue } from '../lib/session';
import { confusionName } from '../lib/diagnosis';
import { levelInfo } from '../lib/xp';
import { xpForAnswer } from '../lib/xp';

const MAX_DAYS_KEPT = 180;

/** Più di così fra un gesto e l'altro non è studio: è una pausa. */
const IDLE_MS = 60_000;
/** Il tempo accumulato si salva a pezzi, non a ogni tocco. */
const FLUSH_MS = 15_000;

/** Quando torna un esercizio di teoria sbagliato, scatola per scatola (giorni). */
const THEORY_BOX_DAYS = [0, 1, 3, 7, 21];

/** Figure ritmiche pulite di fila per passare al livello dopo. */
const RHYTHM_CLEAN_TO_ADVANCE = 3;

const DAY_ZERO: Persisted['days'][string] = { answers: 0, correct: 0, xp: 0 };

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

/** Aggiunge `n` a un contatore del giorno (teoria, canzoni) senza toccare il resto. */
function bumpDay(p: Persisted, field: 'theory' | 'songs', n = 1): Persisted['days'] {
  const today = todayKey();
  const day = p.days[today] ?? DAY_ZERO;
  return pruneDays({ ...p.days, [today]: { ...day, [field]: (day[field] ?? 0) + n } });
}

/** Gli esercizi di teoria da riprendere adesso (solo quelli delle lezioni). */
function dueTheory(boxes: Persisted['theoryBoxes'], now = Date.now()): string[] {
  return Object.entries(boxes)
    .filter(([id, b]) => id.includes('#') && b.due <= now)
    .map(([id]) => id);
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
    document.documentElement.dataset.largeText = String(data.settings.largeText);
    document.documentElement.dataset.highContrast = String(data.settings.highContrast);
    document.documentElement.dataset.reducedMotion = String(data.settings.reducedMotion);
    document.documentElement.style.colorScheme = data.settings.theme;
  }, [data.settings]);

  useEffect(() => { setHaptics(data.settings.haptics); }, [data.settings.haptics]);

  const unlockedNotes = useMemo<NoteEntry[]>(
    () => curriculum.slice(0, Math.min(data.unlockedCount, TOTAL_LEVELS)),
    [data.unlockedCount],
  );

  const newestNote = unlockedNotes[unlockedNotes.length - 1];

  // ── Risposta ──────────────────────────────────────────────────────────────
  const answer = useCallback(
    (noteId: string, dir: Direction, correct: boolean, ms: number, usedHint = false, given?: string): AnswerOutcome => {
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
        const prevDay = prev.days[today] ?? DAY_ZERO;
        const day = {
          ...prevDay,
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

        // Cosa hai risposto al posto della nota giusta: è la materia prima
        // della diagnosi (chiave scambiata, gradino, alterazione…).
        let confusions = prev.confusions;
        if (!correct && given) {
          const name = confusionName(given);
          const forNote = prev.confusions[noteId] ?? {};
          confusions = { ...prev.confusions, [noteId]: { ...forNote, [name]: (forNote[name] ?? 0) + 1 } };
        }

        return {
          ...prev,
          cards: { ...prev.cards, [key]: updatedCard },
          confusions,
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
        days: bumpDay(prev, 'songs'),
      }));
      const { state, unlocked } = withAchievements(result);
      if (unlocked.length > 0) apply(() => state);
      return unlocked;
    },
    [apply],
  );

  /** Segna una lezione come completata e assegna gli XP una volta sola. */
  const completeLesson = useCallback(
    (lessonId: string, xp: number): Achievement[] => {
      const result = apply(prev =>
        prev.lessonsDone.includes(lessonId)
          ? prev
          : { ...prev, lessonsDone: [...prev.lessonsDone, lessonId], xp: prev.xp + xp },
      );
      const { state, unlocked } = withAchievements(result);
      if (unlocked.length > 0) apply(() => state);
      return unlocked;
    },
    [apply],
  );

  /**
   * Esito di un esercizio di teoria. Oltre al conteggio, alimenta il ripasso
   * spaziato: chi sbaglia entra nella prima scatola e torna subito; ogni
   * risposta giusta lo allontana, finché esce del tutto.
   */
  const recordTheory = useCallback(
    (itemId: string, correct: boolean) => {
      const now = Date.now();
      apply(prev => {
        const [ok, tot] = prev.theory[itemId] ?? [0, 0];
        const boxes = { ...prev.theoryBoxes };
        const current = boxes[itemId];
        if (!correct) {
          boxes[itemId] = { box: 0, due: now };
        } else if (current) {
          const box = current.box + 1;
          if (box >= THEORY_BOX_DAYS.length) delete boxes[itemId];
          else boxes[itemId] = { box, due: now + THEORY_BOX_DAYS[box] * DAY_MS };
        }
        return {
          ...prev,
          theory: { ...prev.theory, [itemId]: [ok + (correct ? 1 : 0), tot + 1] },
          theoryBoxes: boxes,
          days: bumpDay(prev, 'theory'),
        };
      });
    },
    [apply],
  );

  /** Una figura ritmica letta e battuta: tre pulite di fila e si sale di livello. */
  const recordRhythm = useCallback(
    (clean: boolean, maxLevel: number): number | null => {
      let levelUp: number | null = null;
      apply(prev => {
        const r = prev.rhythm;
        const streak = clean ? r.clean + 1 : 0;
        const advance = streak >= RHYTHM_CLEAN_TO_ADVANCE && r.level < maxLevel;
        if (advance) levelUp = r.level + 1;
        return {
          ...prev,
          rhythm: advance ? { level: r.level + 1, clean: 0 } : { level: r.level, clean: streak },
          days: bumpDay(prev, 'theory'),
        };
      });
      return levelUp;
    },
    [apply],
  );

  /** Scegliere a mano il livello del ritmo (tornare indietro è legittimo). */
  const setRhythmLevel = useCallback(
    (level: number) => {
      apply(prev => ({ ...prev, rhythm: { level, clean: 0 } }));
    },
    [apply],
  );

  /**
   * Conclude il test iniziale senza mai togliere contenuti già sbloccati. Le
   * note lette nel test entrano nel ripasso con la risposta data: chi le sa
   * già non riparte da zero, chi le ha sbagliate le rivede presto.
   */
  const completePlacement = useCallback(
    (unlockedCount: number, answers: { noteId: string; correct: boolean; ms: number }[]) => {
      const now = Date.now();
      apply(prev => {
        const count = Math.max(prev.unlockedCount, Math.min(TOTAL_LEVELS, unlockedCount));
        const cards = { ...prev.cards };
        for (const a of answers) {
          const key = cardKey(a.noteId, 'read');
          cards[key] = review(cards[key] ?? newCard(a.noteId, 'read'), { correct: a.correct, ms: a.ms, now });
        }
        // Le note sbloccate dal test non hanno bisogno della presentazione:
        // le conosci. La vedrai per quelle che arrivano da qui in poi.
        const known = count > 1 ? curriculum.slice(0, count).map(n => n.id) : [];
        return {
          ...prev,
          onboardingDone: true,
          placementScore: answers.filter(a => a.correct).length,
          unlockedCount: count,
          cards,
          introSeen: [...new Set([...prev.introSeen, ...known])],
        };
      });
    },
    [apply],
  );

  // ── Tempo di studio vero ──────────────────────────────────────────────────
  // Si somma il tempo fra un gesto e l'altro (tocchi, note suonate) finché le
  // pause restano sotto il minuto. Niente stime dal numero di risposte: chi
  // studia un pezzo lentamente sta studiando, anche se risponde poco.
  const activityRef = useRef({ last: 0, pending: 0 });

  const flushActivity = useCallback(() => {
    const ms = activityRef.current.pending;
    if (ms <= 0) return;
    activityRef.current.pending = 0;
    const day = todayKey();
    apply(prev => ({
      ...prev,
      studyMinutes: { ...prev.studyMinutes, [day]: (prev.studyMinutes[day] ?? 0) + ms / 60_000 },
    }));
  }, [apply]);

  const touchActivity = useCallback(() => {
    const now = Date.now();
    const a = activityRef.current;
    if (a.last && now - a.last < IDLE_MS) a.pending += now - a.last;
    a.last = now;
    if (a.pending >= FLUSH_MS) flushActivity();
  }, [flushActivity]);

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushActivity(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushActivity);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushActivity);
    };
  }, [flushActivity]);

  /** Memorizza la progressione di un loop e propone il tempo successivo. */
  const recordPieceLoop = useCallback(
    (key: string, perfect: boolean, bpm: number) => {
      let nextBpm = bpm;
      apply(prev => {
        const old = prev.pieceLoops[key] ?? { perfectRuns: 0, bpm };
        const perfectRuns = perfect ? old.perfectRuns + 1 : 0;
        nextBpm = perfectRuns >= 2 ? bpm + 4 : bpm;
        return {
          ...prev,
          pieceLoops: {
            ...prev.pieceLoops,
            [key]: { perfectRuns: perfectRuns >= 2 ? 0 : perfectRuns, bpm: nextBpm },
          },
        };
      });
      return nextBpm;
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
  const theoryDue = useMemo(() => dueTheory(data.theoryBoxes), [data.theoryBoxes]);
  const todayMinutes = Math.round(data.studyMinutes[today] ?? 0);

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
    theoryDue,
    todayMinutes,
    canUnlockNext,
    isComplete: data.unlockedCount >= TOTAL_LEVELS,
    answer,
    resetStreak,
    finishSession,
    unlockNext,
    markIntroSeen,
    recordSprint,
    recordMelody,
    completeLesson,
    recordTheory,
    recordRhythm,
    setRhythmLevel,
    completePlacement,
    touchActivity,
    recordPieceLoop,
    setSettings,
    resetAll,
    replaceState,
  };
}

export type ProgressApi = ReturnType<typeof useProgress>;
