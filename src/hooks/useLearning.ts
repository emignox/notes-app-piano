import { useState, useCallback, useEffect } from 'react';
import type { NoteEntry, LearningState, NoteResult } from '../types';
import { curriculum } from '../data/curriculum';

const STORAGE_KEY = 'piano-notes-progress';

interface StoredProgress {
  currentLevel: number;
}

function loadProgress(): StoredProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredProgress;
  } catch {
    // ignore
  }
  return { currentLevel: 0 };
}

function saveProgress(level: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentLevel: level }));
  } catch {
    // ignore
  }
}

// One card per learned note, shuffled. Level 0→1 card, level N→N+1 cards.
function generateSession(learnedNotes: NoteEntry[]): NoteEntry[] {
  if (learnedNotes.length === 0) return [];
  const session = [...learnedNotes];
  for (let i = session.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [session[i], session[j]] = [session[j], session[i]];
  }
  return session;
}

function emptyResults(length: number): NoteResult[] {
  return Array(length).fill('unanswered');
}

export function useLearning() {
  const [state, setState] = useState<LearningState>(() => {
    const stored = loadProgress();
    const level = Math.min(stored.currentLevel, curriculum.length - 1);
    const learnedNotes = curriculum.slice(0, level + 1);
    return {
      currentLevel: level,
      learnedNotes,
      currentSession: [],
      currentIndex: 0,
      score: 0,
      showIntro: false,
      answerResults: [],
      streak: 0,
    };
  });

  const [sessionComplete, setSessionComplete] = useState(false);

  const startSession = useCallback(() => {
    setState(prev => {
      const session = generateSession(prev.learnedNotes);
      return { ...prev, currentSession: session, currentIndex: 0, score: 0, answerResults: emptyResults(session.length) };
    });
    setSessionComplete(false);
  }, []);

  const showIntroForLevel = useCallback((level: number) => {
    const learnedNotes = curriculum.slice(0, level + 1);
    setState(prev => ({
      ...prev,
      currentLevel: level,
      learnedNotes,
      showIntro: true,
      currentSession: [],
      currentIndex: 0,
      score: 0,
      answerResults: [], streak: 0,
    }));
    saveProgress(level);
    setSessionComplete(false);
  }, []);

  const dismissIntro = useCallback(() => {
    setState(prev => {
      const session = generateSession(prev.learnedNotes);
      return {
        ...prev,
        showIntro: false,
        currentSession: session,
        currentIndex: 0,
        score: 0,
        answerResults: emptyResults(session.length),
      };
    });
    setSessionComplete(false);
  }, []);

  const recordAnswer = useCallback((correct: boolean) => {
    setState(prev => {
      const newResults = [...prev.answerResults] as NoteResult[];
      newResults[prev.currentIndex] = correct ? 'correct' : 'wrong';
      const nextScore = prev.score + (correct ? 1 : 0);
      const nextIndex = prev.currentIndex + 1;
      const nextStreak = correct ? prev.streak + 1 : 0;
      if (nextIndex >= prev.currentSession.length) setSessionComplete(true);
      return { ...prev, score: nextScore, currentIndex: nextIndex, answerResults: newResults, streak: nextStreak };
    });
  }, []);

  const advanceLevel = useCallback(() => {
    setState(prev => {
      const nextLevel = Math.min(prev.currentLevel + 1, curriculum.length - 1);
      const learnedNotes = curriculum.slice(0, nextLevel + 1);
      saveProgress(nextLevel);
      return {
        ...prev,
        currentLevel: nextLevel,
        learnedNotes,
        showIntro: true,
        currentSession: [],
        currentIndex: 0,
        score: 0,
        answerResults: [], streak: 0,
      };
    });
    setSessionComplete(false);
  }, []);

  const resetProgress = useCallback(() => {
    saveProgress(0);
    const learnedNotes = curriculum.slice(0, 1);
    setState({
      currentLevel: 0,
      learnedNotes,
      currentSession: [],
      currentIndex: 0,
      score: 0,
      showIntro: true,
      answerResults: [], streak: 0,
    });
    setSessionComplete(false);
  }, []);

  const currentNote =
    state.currentSession.length > 0 && state.currentIndex < state.currentSession.length
      ? state.currentSession[state.currentIndex]
      : null;

  useEffect(() => {
    setState(prev => ({ ...prev, showIntro: true }));
  }, []);

  return {
    state,
    currentNote,
    sessionComplete,
    startSession,
    showIntroForLevel,
    dismissIntro,
    recordAnswer,
    advanceLevel,
    resetProgress,
  };
}
