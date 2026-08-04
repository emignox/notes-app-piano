// ─────────────────────────────────────────────────────────────────────────────
// Pezzi a due mani, su doppio pentagramma.
//
// Sono scritti a "passi": in ogni passo si dice cosa suona la destra e cosa la
// sinistra. Le due mani cambiano insieme, che è il caso di tutti gli
// arrangiamenti facili — e permette di allineare in verticale le due voci senza
// gestire ritmi indipendenti.
//
// La mano sinistra resta volutamente semplice (note singole o triadi tenute):
// serve a leggere la chiave di basso, non a fare acrobazie.
// ─────────────────────────────────────────────────────────────────────────────

import type { Piece, PieceStep } from '../types';

type Dur = 'w' | 'h' | 'q' | '8';

const BEATS: Record<Dur, number> = { w: 4, h: 2, q: 1, '8': 0.5 };

const list = (v?: string | string[]): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** Un passo: durata, cosa fa la destra, cosa fa la sinistra. */
function s(duration: Dur, treble?: string | string[], bass?: string | string[]): PieceStep {
  return { duration, beats: BEATS[duration], treble: list(treble), bass: list(bass) };
}

export const pieces: Piece[] = [
  {
    id: 'due-mani-do',
    title: 'Due mani su Do',
    composer: 'Esercizio',
    difficulty: 'facile',
    emoji: '🤲',
    bpm: 66,
    hint: 'Le due mani salgono insieme: destra dal Do centrale, sinistra un\'ottava sotto. Serve a prendere l\'abitudine di leggere due righe alla volta.',
    steps: [
      s('q', 'C4', 'C3'),
      s('q', 'D4', 'D3'),
      s('q', 'E4', 'E3'),
      s('q', 'F4', 'F3'),
      s('h', 'G4', 'G3'),
      s('q', 'F4', 'F3'),
      s('q', 'E4', 'E3'),
      s('q', 'D4', 'D3'),
      s('w', 'C4', 'C3'),
    ],
  },
  {
    id: 'accordi-base',
    title: 'Accordi Do · Fa · Sol',
    composer: 'Esercizio',
    difficulty: 'facile',
    emoji: '🎯',
    bpm: 60,
    hint: 'I tre accordi che aprono metà delle canzoni. La sinistra tiene la triade, la destra suona la nota più importante (la fondamentale).',
    steps: [
      s('h', 'C5', ['C3', 'E3', 'G3']),
      s('h', 'C5', ['C3', 'E3', 'G3']),
      s('h', 'C5', ['F3', 'A3', 'C4']),
      s('h', 'C5', ['F3', 'A3', 'C4']),
      s('h', 'B4', ['G3', 'B3', 'D4']),
      s('h', 'B4', ['G3', 'B3', 'D4']),
      s('w', 'C5', ['C3', 'E3', 'G3']),
    ],
  },
  {
    id: 'fra-martino-2m',
    title: 'Fra Martino (due mani)',
    composer: 'Tradizionale',
    difficulty: 'facile',
    emoji: '🔔',
    bpm: 80,
    hint: 'Melodia nella destra, basso che alterna Do e Sol nella sinistra: il modo più comune di accompagnare.',
    steps: [
      s('q', 'C4', 'C3'),
      s('q', 'D4'),
      s('q', 'E4', 'G3'),
      s('q', 'C4'),
      s('q', 'C4', 'C3'),
      s('q', 'D4'),
      s('q', 'E4', 'G3'),
      s('q', 'C4'),
      s('q', 'E4', 'C3'),
      s('q', 'F4'),
      s('h', 'G4', 'G3'),
      s('q', 'E4', 'C3'),
      s('q', 'F4'),
      s('h', 'G4', 'G3'),
    ],
  },
  {
    id: 'brilla-2m',
    title: 'Brilla Brilla (due mani)',
    composer: 'Tradizionale',
    difficulty: 'medio',
    emoji: '⭐',
    bpm: 78,
    hint: 'La sinistra cambia accordo quando cambia l\'armonia: Do, Fa, Sol. Ascolta come il basso sostiene la melodia.',
    steps: [
      s('q', 'C4', 'C3'),
      s('q', 'C4'),
      s('q', 'G4', 'G3'),
      s('q', 'G4'),
      s('q', 'A4', 'F3'),
      s('q', 'A4'),
      s('h', 'G4', 'C3'),
      s('q', 'F4', 'F3'),
      s('q', 'F4'),
      s('q', 'E4', 'C3'),
      s('q', 'E4'),
      s('q', 'D4', 'G3'),
      s('q', 'D4'),
      s('h', 'C4', 'C3'),
    ],
  },
  {
    id: 'inno-gioia-2m',
    title: 'Inno alla Gioia (due mani)',
    composer: 'Beethoven',
    difficulty: 'medio',
    emoji: '🎵',
    bpm: 84,
    hint: 'Il tema più famoso di sempre, con il basso essenziale. Prima solo la destra, poi solo la sinistra, e infine insieme.',
    steps: [
      s('q', 'E4', 'C3'),
      s('q', 'E4'),
      s('q', 'F4', 'G3'),
      s('q', 'G4'),
      s('q', 'G4', 'C3'),
      s('q', 'F4'),
      s('q', 'E4', 'G3'),
      s('q', 'D4'),
      s('q', 'C4', 'C3'),
      s('q', 'C4'),
      s('q', 'D4', 'G3'),
      s('q', 'E4'),
      s('h', 'E4', 'C3'),
      s('h', 'D4', 'G3'),
    ],
  },
  {
    id: 'ninna-2m',
    title: 'Ninna Nanna (due mani)',
    composer: 'Brahms',
    difficulty: 'difficile',
    emoji: '🌙',
    bpm: 70,
    hint: 'Tempo lento, accordi tenuti: perfetto per leggere senza fretta le due chiavi insieme.',
    steps: [
      s('q', 'E4', ['C3', 'G3']),
      s('q', 'E4'),
      s('h', 'G4', ['C3', 'G3']),
      s('q', 'E4', ['C3', 'G3']),
      s('q', 'E4'),
      s('h', 'G4', ['C3', 'G3']),
      s('q', 'E4', ['C3', 'E3']),
      s('q', 'G4'),
      s('h', 'C5', ['F3', 'A3']),
      s('q', 'B4', ['G3', 'B3']),
      s('q', 'A4'),
      s('q', 'A4', ['G3', 'D4']),
      s('h', 'G4', ['C3', 'G3']),
    ],
  },
];

export function pieceById(id: string): Piece | undefined {
  return pieces.find(p => p.id === id);
}

/** Tutte le note che il pezzo richiede (per mano). */
export function pieceNotes(piece: Piece, hand: 'right' | 'left'): string[] {
  const key = hand === 'right' ? 'treble' : 'bass';
  return [...new Set(piece.steps.flatMap(st => st[key]))];
}
