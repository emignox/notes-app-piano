export type Clef = 'treble' | 'bass';

export interface NoteEntry {
  id: string;           // 'c4_treble', 'fs4_treble', 'bb4_treble'
  clef: Clef;
  pitch: string;        // "C/4", "F#/4"
  displayName: string;  // "Do", "Fa♯", "Si♭"
  englishName: string;  // "C4", "F#4", "Bb4"
  vexflowKey: string;   // "c/4", "f#/4", "bb/4"
  accidental?: 'sharp' | 'flat' | 'natural';
  noteValue: 'whole' | 'half' | 'quarter';
  toneNote: string;     // nome per Tone.js
  stageId: string;      // gruppo del percorso
  mnemonic?: string;    // trucco mnemonico (solo per alcune note chiave)
  landmark?: boolean;   // nota di riferimento
}

export interface Stage {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  from: number;   // indice inclusivo nel curriculum
  to: number;     // indice inclusivo
}

export type NoteResult = 'unanswered' | 'correct' | 'wrong';

export type AnswerState = 'idle' | 'correct' | 'wrong';

/** Direzione dell'esercizio: leggere la nota, oppure trovarla sulla tastiera. */
export type Direction = 'read' | 'find';

export interface MelodyNote {
  toneNote: string;
  vexflowKey: string;
  duration: 'w' | 'h' | 'q' | '8';
  /** Durata in battiti: la durata in secondi dipende dal tempo scelto. */
  beats: number;
  clef: Clef;
  accidental?: 'sharp' | 'flat';
}

/**
 * Un passo di un pezzo a due mani: cosa suonano insieme la destra e la sinistra.
 * Array vuoto = quella mano tace (pausa). Più note = accordo.
 */
export interface PieceStep {
  duration: 'w' | 'h' | 'q' | '8';
  beats: number;
  treble: string[];
  bass: string[];
}

export type Hand = 'both' | 'right' | 'left';

export interface Piece {
  id: string;
  title: string;
  composer: string;
  difficulty: 'facile' | 'medio' | 'difficile';
  emoji: string;
  bpm: number;
  hint: string;
  steps: PieceStep[];
}

export interface Melody {
  id: string;
  title: string;
  composer: string;
  difficulty: 'facile' | 'medio' | 'difficile';
  emoji: string;
  bpm: number;
  requiredToneNotes: string[];
  notes: MelodyNote[];
}
