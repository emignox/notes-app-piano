export type Clef = 'treble' | 'bass';

export interface NoteEntry {
  id: string;           // 'c4_treble', 'fs4_treble', 'bb4_treble'
  clef: Clef;
  pitch: string;        // "C/4", "F#/4"
  displayName: string;  // "Do", "Fa♯", "Si♭"
  englishName: string;  // "C4", "F#4", "Bb4"
  vexflowKey: string;   // "c/4", "f#/4", "bb/4"
  accidental?: 'sharp' | 'flat' | 'natural' | 'double-sharp' | 'double-flat';
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

// ── Pezzi a due mani ────────────────────────────────────────────────────────

/** Figure disponibili. La `d` finale è il punto: `hd` = minima puntata. */
export type StepDuration =
  | 'w' | 'wd'
  | 'h' | 'hd'
  | 'q' | 'qd'
  | '8' | '8d'
  | '16';

/** Dinamiche, dal più piano al più forte. `sf` è un singolo colpo. */
export type Dynamic = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff' | 'sf';

/** Segni di articolazione: dicono COME si attacca e si lascia la nota. */
export type Articulation = 'staccato' | 'accent' | 'tenuto' | 'marcato' | 'fermata';

/** Forcelle: `<` che cresce, `>` che cala, e il punto in cui finiscono. */
export type Hairpin = 'cresc' | 'dim' | 'end';

/**
 * Segni di una singola mano in un passo.
 *
 * `leg` è la legatura di FRASE (legato): dice "questa nota si lega alla
 * prossima senza staccare il dito". Una serie di passi con `leg` diventa una
 * sola legatura disegnata sopra tutto il gruppo.
 *
 * `tie` è la legatura di VALORE: stessa nota, suono unico più lungo. La nota
 * legata non si ribatte — e infatti non viene richiesta all'utente.
 */
export interface HandMarks {
  leg?: boolean;
  tie?: boolean;
  art?: Articulation;
  /** Diteggiatura, una cifra per nota dell'accordo (dal grave all'acuto). */
  fin?: number | number[];
}

/**
 * Un passo di un pezzo a due mani: cosa suonano insieme la destra e la sinistra.
 * Array vuoto = quella mano tace (pausa). Più note = accordo.
 */
export interface PieceStep {
  duration: StepDuration;
  beats: number;
  treble: string[];
  bass: string[];
  /** Segni della mano destra e della sinistra. */
  r?: HandMarks;
  l?: HandMarks;
  /** Dinamica che entra in vigore da questo passo. */
  dyn?: Dynamic;
  /** Forcella che inizia (o finisce) qui. */
  hair?: Hairpin;
  /** Indicazione di carattere o agogica: "dolce", "rit.", "a tempo". */
  text?: string;
  /** Pedale di risonanza: giù o su. */
  ped?: 'down' | 'up';
  /** Stanghetta speciale DOPO questo passo (quelle normali sono automatiche). */
  bar?: 'double' | 'end' | 'repeat';
}

export type Hand = 'both' | 'right' | 'left';

/** Una parte del pezzo che si può studiare da sola. `to` è escluso. */
export interface PieceSection {
  name: string;
  from: number;
  to: number;
  note?: string;
}

export interface Piece {
  id: string;
  title: string;
  composer: string;
  difficulty: 'facile' | 'medio' | 'difficile';
  /** Ordinamento fine dentro la stessa difficoltà: 1 = il più abbordabile. */
  level: number;
  emoji: string;
  bpm: number;
  hint: string;
  /** Metro: "4/4", "3/4", "6/8", "2/4", "3/8". */
  meter: string;
  /** Armatura di chiave. */
  key: { tonic: string; mode: 'maggiore' | 'minore' };
  /** Battiti di levare prima della prima battuta piena (anacrusi). */
  pickup?: number;
  /** Indicazione di andamento in testa: "Andante cantabile". */
  tempoText?: string;
  /** Da dove viene il brano, in una riga. */
  about?: string;
  /** Le difficoltà vere del pezzo, dette in anticipo. */
  focus?: string[];
  sections?: PieceSection[];
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
