// ─────────────────────────────────────────────────────────────────────────────
// Stato persistente (localStorage), versionato e con migrazione dalla v1
// (che salvava solo `currentLevel`).
// ─────────────────────────────────────────────────────────────────────────────

import type { Card } from './srs';
import type { NameStyle } from './notes';

const KEY = 'piano-trainer-v2';
const LEGACY_KEY = 'piano-notes-progress';

export interface Settings {
  theme: 'dark' | 'light';
  noteNames: NameStyle;
  /** Suona la nota PRIMA della risposta. Default off: altrimenti alleni l'orecchio, non la lettura. */
  hintSoundBefore: boolean;
  /** Suona la nota quando viene svelata la risposta (associazione segno→suono). */
  soundOnReveal: boolean;
  keyLabels: 'all' | 'c' | 'none';
  /** Come si risponde nell'esercizio di lettura: nomi delle note o tastiera. */
  readInput: 'names' | 'keys';
  haptics: boolean;
  sessionLength: number;
  dailyGoal: number;
  showTimer: boolean;
  /** Nell'esercizio "trova il tasto" pretende anche l'ottava giusta. */
  strictOctave: boolean;
  /** Mostra l'aiuto da solo dopo qualche secondo (impalcatura che poi sparisce). */
  autoHint: boolean;
  melodyBpm: number;
  metronome: boolean;
  volume: number;
}

export const defaultSettings: Settings = {
  theme: 'dark',
  noteNames: 'it',
  hintSoundBefore: false,
  soundOnReveal: true,
  keyLabels: 'c',
  readInput: 'names',
  haptics: true,
  sessionLength: 12,
  dailyGoal: 30,
  showTimer: true,
  strictOctave: false,
  autoHint: true,
  melodyBpm: 90,
  metronome: false,
  volume: 0.8,
};

export interface DayStat {
  answers: number;
  correct: number;
  xp: number;
}

export interface Persisted {
  version: 2;
  createdAt: number;
  unlockedCount: number;
  cards: Record<string, Card>;
  xp: number;
  answers: number;
  correct: number;
  bestStreak: number;
  sessions: number;
  perfectSessions: number;
  goalsMet: number;
  days: Record<string, DayStat>;
  dayStreak: number;
  bestDayStreak: number;
  lastDay: string;
  sprintBest: Record<string, number>;
  melodyBest: Record<string, number>;
  achievements: string[];
  introSeen: string[];
  settings: Settings;
}

export function todayKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function shiftDay(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return todayKey(date);
}

export function emptyState(): Persisted {
  return {
    version: 2,
    createdAt: Date.now(),
    unlockedCount: 1,
    cards: {},
    xp: 0,
    answers: 0,
    correct: 0,
    bestStreak: 0,
    sessions: 0,
    perfectSessions: 0,
    goalsMet: 0,
    days: {},
    dayStreak: 0,
    bestDayStreak: 0,
    lastDay: '',
    sprintBest: {},
    melodyBest: {},
    achievements: [],
    introSeen: [],
    settings: { ...defaultSettings },
  };
}

function migrateLegacy(): Persisted | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw) as { currentLevel?: number };
    const state = emptyState();
    state.unlockedCount = Math.max(1, (old.currentLevel ?? 0) + 1);
    return state;
  } catch {
    return null;
  }
}

export function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      const base = emptyState();
      return {
        ...base,
        ...parsed,
        version: 2,
        cards: parsed.cards ?? {},
        days: parsed.days ?? {},
        sprintBest: parsed.sprintBest ?? {},
        melodyBest: parsed.melodyBest ?? {},
        achievements: parsed.achievements ?? [],
        introSeen: parsed.introSeen ?? [],
        settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      };
    }
  } catch {
    /* dati corrotti → si riparte pulito */
  }
  return migrateLegacy() ?? emptyState();
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function save(state: Persisted) {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota piena o modalità privata */
    }
  }, 250);
}

export function clearAll() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignora */
  }
}

/** Esporta/importa il progresso: utile per cambiare telefono senza perdere tutto. */
export function exportState(state: Persisted): string {
  return JSON.stringify(state);
}

export function importState(json: string): Persisted | null {
  try {
    const parsed = JSON.parse(json) as Partial<Persisted>;
    if (typeof parsed.unlockedCount !== 'number') return null;
    return { ...emptyState(), ...parsed, version: 2, settings: { ...defaultSettings, ...(parsed.settings ?? {}) } };
  } catch {
    return null;
  }
}
