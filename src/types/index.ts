export interface NoteEntry {
  id: string;
  clef: 'treble' | 'bass';
  pitch: string;        // e.g. "C/4", "F#/4", "Bb/3"
  displayName: string;  // e.g. "Do", "Fa♯", "Si♭"
  englishName: string;  // e.g. "C4", "F#4", "Bb3"
  vexflowKey: string;   // VexFlow format e.g. "c/4", "f#/4", "bb/3"
  accidental?: 'sharp' | 'flat' | 'natural';
  noteValue: 'whole' | 'half' | 'quarter';
  description: string;  // e.g. "Prima linea del pentagramma in chiave di violino"
  toneNote: string;     // Tone.js note name e.g. "C4", "F#4"
}

export type NoteResult = 'unanswered' | 'correct' | 'wrong';

export interface LearningState {
  currentLevel: number;
  learnedNotes: NoteEntry[];
  currentSession: NoteEntry[];
  currentIndex: number;
  score: number;
  showIntro: boolean;
  answerResults: NoteResult[];
  streak: number;
}

export type AnswerState = 'idle' | 'correct' | 'wrong';

export interface MelodyNote {
  toneNote: string;      // e.g. "E4", "C5"
  vexflowKey: string;    // e.g. "e/4", "c/5"
  duration: 'w' | 'h' | 'q' | '8';
  durationSec: number;   // per audio: w=2.0, h=1.0, q=0.5, 8=0.25
  clef: 'treble' | 'bass';
  accidental?: 'sharp' | 'flat';
}

export interface Melody {
  id: string;
  title: string;
  composer: string;
  difficulty: 'facile' | 'medio' | 'difficile';
  emoji: string;
  requiredToneNotes: string[];  // toneNotes che l'utente deve aver imparato
  notes: MelodyNote[];
}
