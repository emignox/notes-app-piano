// ─────────────────────────────────────────────────────────────────────────────
// Gli attrezzi per SCRIVERE un pezzo.
//
// Un brano lungo è centinaia di passi: se ogni passo fosse un oggetto scritto
// per esteso, il file diventerebbe illeggibile e pieno di errori di copia. Qui
// stanno due sole funzioni — `s()` per un passo, `p()` per il pezzo — pensate
// perché una battuta di musica stia su una riga di codice.
//
//   s('q', 'E5', ['A2','E3'], { dyn:'p', leg:true, fin:5 })
//   └─ figura   └─ destra  └─ sinistra   └─ i segni
//
// I segni senza suffisso valgono per la MANO DESTRA (che porta la melodia, ed
// è quella che si articola); `…L` per la sinistra, `…B` per tutte e due.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Articulation,
  Dynamic,
  Hairpin,
  HandMarks,
  Piece,
  PieceSection,
  PieceStep,
  StepDuration,
} from '../types';
import { DURATION_BEATS } from '../lib/score';

/** Le note di una mano: niente (pausa), una nota, o un accordo. */
export type Voice = string | string[] | undefined;

export interface Marks {
  /** Legatura di frase verso la nota seguente (legato). */
  leg?: boolean;
  legL?: boolean;
  legB?: boolean;
  /** Legatura di valore: la nota continua nel passo dopo, senza ribatterla. */
  tie?: boolean;
  tieL?: boolean;
  tieB?: boolean;
  art?: Articulation;
  artL?: Articulation;
  artB?: Articulation;
  /** Diteggiatura (1 = pollice). Un numero, o uno per nota dell'accordo. */
  fin?: number | number[];
  finL?: number | number[];
  dyn?: Dynamic;
  hair?: Hairpin;
  text?: string;
  ped?: 'down' | 'up';
  bar?: 'double' | 'end' | 'repeat';
}

const list = (v: Voice): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

function handMarks(m: Marks, side: 'r' | 'l'): HandMarks | undefined {
  const out: HandMarks = {};
  if (side === 'r') {
    if (m.leg || m.legB) out.leg = true;
    if (m.tie || m.tieB) out.tie = true;
    if (m.art ?? m.artB) out.art = m.art ?? m.artB;
    if (m.fin !== undefined) out.fin = m.fin;
  } else {
    if (m.legL || m.legB) out.leg = true;
    if (m.tieL || m.tieB) out.tie = true;
    if (m.artL ?? m.artB) out.art = m.artL ?? m.artB;
    if (m.finL !== undefined) out.fin = m.finL;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Un passo: figura, cosa fa la destra, cosa fa la sinistra, i segni. */
export function s(duration: StepDuration, treble?: Voice, bass?: Voice, m: Marks = {}): PieceStep {
  const step: PieceStep = {
    duration,
    beats: DURATION_BEATS[duration],
    treble: list(treble),
    bass: list(bass),
  };
  const r = handMarks(m, 'r');
  const l = handMarks(m, 'l');
  if (r) step.r = r;
  if (l) step.l = l;
  if (m.dyn) step.dyn = m.dyn;
  if (m.hair) step.hair = m.hair;
  if (m.text) step.text = m.text;
  if (m.ped) step.ped = m.ped;
  if (m.bar) step.bar = m.bar;
  return step;
}

/**
 * Ripete un gruppo di passi. Nella musica reale si ripete moltissimo: senza
 * questo, metà di un valzer sarebbe copia-incolla (e la copia prima o poi
 * diverge dall'originale).
 */
export function rep(times: number, ...steps: PieceStep[]): PieceStep[] {
  const out: PieceStep[] = [];
  for (let i = 0; i < times; i++) out.push(...steps.map(st => ({ ...st })));
  return out;
}

/** Concatena gruppi di passi tenendo il codice a livello di "battute". */
export const seq = (...groups: (PieceStep | PieceStep[])[]): PieceStep[] => groups.flat();

/**
 * Un accompagnamento di valzer: basso sul primo tempo, accordo sul secondo e
 * sul terzo. È la figura che regge quasi ogni valzer, minuetto e ländler.
 */
export function waltz(bassNote: string, chord: string[], melody: [Voice, Voice, Voice] = [undefined, undefined, undefined], m: Marks = {}): PieceStep[] {
  return [
    s('q', melody[0], bassNote, m),
    s('q', melody[1], chord),
    s('q', melody[2], chord),
  ];
}

/** Basso albertino: la figura di accompagnamento più mozartiana che ci sia. */
export function alberti(low: string, mid: string, high: string): [string, string, string, string] {
  return [low, high, mid, high];
}

export interface PieceInit extends Omit<Piece, 'steps'> {
  steps: PieceStep[];
}

/** Crea il pezzo. Esiste per avere un solo punto in cui aggiungere controlli. */
export function p(init: PieceInit): Piece {
  return init;
}

export type { PieceSection };
