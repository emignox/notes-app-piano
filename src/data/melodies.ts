// ─────────────────────────────────────────────────────────────────────────────
// Repertorio. Le note richieste si ricavano dalla melodia stessa, così una
// canzone non può mai restare bloccata per un elenco sbagliato scritto a mano.
//
// Le durate sono in BATTITI: i secondi dipendono dal tempo scelto dall'utente,
// che può rallentare per leggere e accelerare quando è pronto.
// ─────────────────────────────────────────────────────────────────────────────

import type { Melody, MelodyNote } from '../types';
import { parseNote } from '../lib/notes';

type Dur = 'w' | 'h' | 'q' | '8';

const BEATS: Record<Dur, number> = { w: 4, h: 2, q: 1, '8': 0.5 };

/** Nota della melodia: il pentagramma e l'alterazione si ricavano dal nome. */
function n(toneNote: string, duration: Dur = 'q'): MelodyNote {
  const { letter, acc, octave } = parseNote(toneNote);
  return {
    toneNote,
    vexflowKey: `${letter.toLowerCase()}${acc}/${octave}`,
    duration,
    beats: BEATS[duration],
    clef: 'treble',
    accidental: acc === '#' ? 'sharp' : acc === 'b' ? 'flat' : undefined,
  };
}

/** Come `n`, ma in chiave di basso: la mano sinistra legge anche lei. */
function b(toneNote: string, duration: Dur = 'q'): MelodyNote {
  return { ...n(toneNote, duration), clef: 'bass' };
}

interface MelodyInput {
  id: string;
  title: string;
  composer: string;
  difficulty: Melody['difficulty'];
  emoji: string;
  bpm: number;
  notes: MelodyNote[];
}

function melody(input: MelodyInput): Melody {
  return {
    ...input,
    requiredToneNotes: [...new Set(input.notes.map(x => x.toneNote))],
  };
}

const RANK = { facile: 0, medio: 1, difficile: 2 } as const;

export const melodies: Melody[] = [
  melody({
    id: 'scala-do',
    title: 'Scala di Do',
    composer: 'Esercizio',
    difficulty: 'facile',
    emoji: '🪜',
    bpm: 80,
    notes: [
      n('C4'), n('D4'), n('E4'), n('F4'), n('G4'), n('A4'), n('B4'), n('C5', 'h'),
      n('B4'), n('A4'), n('G4'), n('F4'), n('E4'), n('D4'), n('C4', 'w'),
    ],
  }),
  melody({
    id: 'arpeggio-do',
    title: 'Arpeggio di Do',
    composer: 'Esercizio',
    difficulty: 'facile',
    emoji: '🎯',
    bpm: 80,
    notes: [
      n('C4'), n('E4'), n('G4'), n('C5', 'h'),
      n('G4'), n('E4'), n('C4', 'w'),
    ],
  }),
  melody({
    id: 'fra-martino',
    title: 'Fra Martino',
    composer: 'Tradizionale',
    difficulty: 'facile',
    emoji: '🔔',
    bpm: 92,
    notes: [
      n('C4'), n('D4'), n('E4'), n('C4'),
      n('C4'), n('D4'), n('E4'), n('C4'),
      n('E4'), n('F4'), n('G4', 'h'),
      n('E4'), n('F4'), n('G4', 'h'),
      n('G4', '8'), n('A4', '8'), n('G4', '8'), n('F4', '8'), n('E4'), n('C4'),
      n('G4', '8'), n('A4', '8'), n('G4', '8'), n('F4', '8'), n('E4'), n('C4'),
      n('C4'), n('G4'), n('C4', 'h'),
    ],
  }),
  melody({
    id: 'inno-alla-gioia',
    title: 'Inno alla Gioia',
    composer: 'Beethoven',
    difficulty: 'facile',
    emoji: '🎵',
    bpm: 96,
    notes: [
      n('E4'), n('E4'), n('F4'), n('G4'),
      n('G4'), n('F4'), n('E4'), n('D4'),
      n('C4'), n('C4'), n('D4'), n('E4'),
      n('E4', 'h'), n('D4', 'h'),
      n('E4'), n('E4'), n('F4'), n('G4'),
      n('G4'), n('F4'), n('E4'), n('D4'),
      n('C4'), n('C4'), n('D4'), n('E4'),
      n('D4', 'h'), n('C4', 'h'),
    ],
  }),
  melody({
    id: 'brilla-stellina',
    title: 'Brilla Brilla Stellina',
    composer: 'Tradizionale',
    difficulty: 'facile',
    emoji: '⭐',
    bpm: 92,
    notes: [
      n('C4'), n('C4'), n('G4'), n('G4'),
      n('A4'), n('A4'), n('G4', 'h'),
      n('F4'), n('F4'), n('E4'), n('E4'),
      n('D4'), n('D4'), n('C4', 'h'),
      n('G4'), n('G4'), n('F4'), n('F4'),
      n('E4'), n('E4'), n('D4', 'h'),
      n('C4'), n('C4'), n('G4'), n('G4'),
      n('A4'), n('A4'), n('G4', 'h'),
      n('F4'), n('F4'), n('E4'), n('E4'),
      n('D4'), n('D4'), n('C4', 'w'),
    ],
  }),
  melody({
    id: 'tanti-auguri',
    title: 'Tanti Auguri',
    composer: 'Tradizionale',
    difficulty: 'medio',
    emoji: '🎂',
    bpm: 100,
    notes: [
      n('G4', '8'), n('G4', '8'), n('A4'), n('G4'), n('C5'), n('B4', 'h'),
      n('G4', '8'), n('G4', '8'), n('A4'), n('G4'), n('D5'), n('C5', 'h'),
      n('G4', '8'), n('G4', '8'), n('G5'), n('E5'), n('C5'), n('B4'), n('A4', 'h'),
      n('F5', '8'), n('F5', '8'), n('E5'), n('C5'), n('D5'), n('C5', 'h'),
    ],
  }),
  melody({
    id: 'jingle-bells',
    title: 'Jingle Bells',
    composer: 'Pierpont',
    difficulty: 'medio',
    emoji: '❄️',
    bpm: 104,
    notes: [
      n('E4'), n('E4'), n('E4', 'h'),
      n('E4'), n('E4'), n('E4', 'h'),
      n('E4'), n('G4'), n('C4'), n('D4'), n('E4', 'w'),
      n('F4'), n('F4'), n('F4'), n('F4'),
      n('F4'), n('E4'), n('E4'), n('E4', 'h'),
      n('E4'), n('D4'), n('D4'), n('E4'), n('D4', 'h'), n('G4', 'h'),
    ],
  }),
  melody({
    id: 'ninna-nanna',
    title: 'Ninna Nanna',
    composer: 'Brahms',
    difficulty: 'medio',
    emoji: '🌙',
    bpm: 76,
    notes: [
      n('E4', '8'), n('E4', '8'), n('G4', 'h'),
      n('E4', '8'), n('E4', '8'), n('G4', 'h'),
      n('E4'), n('G4'), n('C5', 'h'),
      n('B4'), n('A4'), n('A4'), n('G4', 'h'),
      n('D4'), n('E4'), n('F4'), n('D4', 'h'),
      n('D4'), n('E4'), n('F4'), n('D4', 'h'),
      n('F4'), n('A4'), n('C5'), n('B4'), n('A4'), n('G4', 'h'),
    ],
  }),
  melody({
    id: 'minuetto-bach',
    title: 'Minuetto',
    composer: 'Petzold / Bach',
    difficulty: 'medio',
    emoji: '🎹',
    bpm: 100,
    notes: [
      n('G4'), n('A4'), n('B4'), n('C5'),
      n('D5', 'h'), n('G4', 'h'),
      n('C5'), n('B4'), n('A4'), n('G4'),
      n('A4', 'w'),
      n('B4'), n('C5'), n('D5'), n('G4'),
      n('A4', 'h'), n('A4', 'h'),
      n('B4'), n('A4'), n('G4'), n('A4'),
      n('B4', 'h'), n('G4', 'h'),
    ],
  }),
  melody({
    id: 'canone-pachelbel',
    title: 'Canone',
    composer: 'Pachelbel',
    difficulty: 'medio',
    emoji: '🎼',
    bpm: 90,
    notes: [
      n('D5'), n('A4'), n('B4'), n('F#4'),
      n('G4'), n('D4'), n('G4'), n('A4'),
      n('F#4'), n('C5'), n('D5'), n('A4'),
      n('B4'), n('F#4'), n('G4'), n('D4'),
      n('D4'), n('E4'), n('F#4'), n('G4'),
      n('A4'), n('G4'), n('F#4'), n('E4'),
      n('D4'), n('F#4'), n('A4'), n('G4'),
      n('F#4'), n('E4'), n('D4', 'h'), n('D4', 'h'),
    ],
  }),
  melody({
    id: 'aria-bach',
    title: 'Aria',
    composer: 'Bach',
    difficulty: 'difficile',
    emoji: '🎻',
    bpm: 84,
    notes: [
      n('D5', 'h'), n('C5'), n('B4'),
      n('A4', 'h'), n('G4', 'h'),
      n('F4'), n('G4'), n('A4'), n('B4'),
      n('C5', 'w'),
      n('E5', 'h'), n('D5'), n('C5'),
      n('B4', 'h'), n('A4', 'h'),
      n('G4'), n('A4'), n('B4'), n('C5'),
      n('D5', 'w'),
    ],
  }),
  melody({
    id: 'sonatina-clementi',
    title: 'Sonatina',
    composer: 'Clementi',
    difficulty: 'difficile',
    emoji: '🎶',
    bpm: 108,
    notes: [
      n('C5'), n('G4', '8'), n('A4', '8'),
      n('G4', 'h'), n('E4', 'h'),
      n('F4'), n('D4', '8'), n('E4', '8'),
      n('D4', 'h'), n('C4', 'h'),
      n('G4'), n('E4', '8'), n('F4', '8'),
      n('E4', 'h'), n('C4', 'h'),
      n('A4'), n('F4', '8'), n('G4', '8'),
      n('C5', 'w'),
    ],
  }),

  // ── Chiave di basso: la sinistra legge melodie vere ──
  melody({
    id: 'scala-do-basso',
    title: 'Scala di Do (basso)',
    composer: 'Esercizio',
    difficulty: 'facile',
    emoji: '🪜',
    bpm: 80,
    notes: [
      b('C3'), b('D3'), b('E3'), b('F3'), b('G3'), b('A3'), b('B3'), b('C4', 'h'),
      b('B3'), b('A3'), b('G3'), b('F3'), b('E3'), b('D3'), b('C3', 'w'),
    ],
  }),
  melody({
    id: 'fra-martino-basso',
    title: 'Fra Martino (basso)',
    composer: 'Tradizionale',
    difficulty: 'facile',
    emoji: '🔔',
    bpm: 92,
    notes: [
      b('C3'), b('D3'), b('E3'), b('C3'),
      b('C3'), b('D3'), b('E3'), b('C3'),
      b('E3'), b('F3'), b('G3', 'h'),
      b('E3'), b('F3'), b('G3', 'h'),
      b('G3', '8'), b('A3', '8'), b('G3', '8'), b('F3', '8'), b('E3'), b('C3'),
      b('G3', '8'), b('A3', '8'), b('G3', '8'), b('F3', '8'), b('E3'), b('C3'),
      b('C3'), b('G2'), b('C3', 'h'),
    ],
  }),
  melody({
    id: 'inno-basso',
    title: 'Inno alla Gioia (basso)',
    composer: 'Beethoven',
    difficulty: 'medio',
    emoji: '🎵',
    bpm: 96,
    notes: [
      b('E3'), b('E3'), b('F3'), b('G3'),
      b('G3'), b('F3'), b('E3'), b('D3'),
      b('C3'), b('C3'), b('D3'), b('E3'),
      b('E3', 'h'), b('D3', 'h'),
      b('E3'), b('E3'), b('F3'), b('G3'),
      b('G3'), b('F3'), b('E3'), b('D3'),
      b('C3'), b('C3'), b('D3'), b('E3'),
      b('D3', 'h'), b('C3', 'h'),
    ],
  }),
  melody({
    id: 'saints',
    title: 'Oh When the Saints',
    composer: 'Spiritual',
    difficulty: 'facile',
    emoji: '🎺',
    bpm: 112,
    notes: [
      n('C4'), n('E4'), n('F4'), n('G4', 'w'),
      n('C4'), n('E4'), n('F4'), n('G4', 'w'),
      n('C4'), n('E4'), n('F4'), n('G4', 'h'), n('E4', 'h'), n('C4', 'h'), n('E4', 'h'), n('D4', 'w'),
      n('E4'), n('E4'), n('D4'), n('C4', 'h'), n('C4'), n('E4'), n('G4', 'h'), n('G4'), n('F4', 'w'),
      n('E4'), n('F4'), n('G4', 'h'), n('E4', 'h'), n('C4', 'h'), n('D4', 'h'), n('C4', 'w'),
    ],
  }),
  melody({
    id: 'saints-basso',
    title: 'Oh When the Saints (basso)',
    composer: 'Spiritual',
    difficulty: 'medio',
    emoji: '🎺',
    bpm: 112,
    notes: [
      b('C3'), b('E3'), b('F3'), b('G3', 'w'),
      b('C3'), b('E3'), b('F3'), b('G3', 'w'),
      b('C3'), b('E3'), b('F3'), b('G3', 'h'), b('E3', 'h'), b('C3', 'h'), b('E3', 'h'), b('D3', 'w'),
      b('E3'), b('E3'), b('D3'), b('C3', 'h'), b('C3'), b('E3'), b('G3', 'h'), b('G3'), b('F3', 'w'),
      b('E3'), b('F3'), b('G3', 'h'), b('E3', 'h'), b('C3', 'h'), b('D3', 'h'), b('C3', 'w'),
    ],
  }),
  melody({
    id: 'valzer-candele',
    title: 'Valzer delle candele',
    composer: 'Tradizionale scozzese',
    difficulty: 'medio',
    emoji: '🕯️',
    bpm: 84,
    notes: [
      n('C4'), n('F4', 'h'), n('F4'), n('F4'), n('A4'),
      n('G4', 'h'), n('F4'), n('G4'), n('A4'),
      n('F4', 'h'), n('F4'), n('A4'), n('C5'),
      n('D5', 'w'),
      n('D5'), n('C5', 'h'), n('A4'), n('A4'), n('F4'),
      n('G4', 'h'), n('F4'), n('G4'), n('A4'),
      n('F4', 'h'), n('D4'), n('D4'), n('C4'),
      n('F4', 'w'),
    ],
  }),
  // ── Alterazioni ──
  melody({
    id: 'scala-fa',
    title: 'Scala di Fa (il Si♭)',
    composer: 'Esercizio',
    difficulty: 'medio',
    emoji: '♭',
    bpm: 84,
    notes: [
      n('F4'), n('G4'), n('A4'), n('Bb4'), n('C5'), n('D5'), n('E5'), n('F5', 'h'),
      n('E5'), n('D5'), n('C5'), n('Bb4'), n('A4'), n('G4'), n('F4', 'w'),
    ],
  }),
  melody({
    id: 'greensleeves',
    title: 'Greensleeves (semplificata)',
    composer: 'Tradizionale inglese',
    difficulty: 'medio',
    emoji: '🍃',
    bpm: 96,
    notes: [
      n('A4'), n('C5', 'h'), n('D5'),
      n('E5'), n('F5'), n('E5'), n('D5', 'h'), n('B4'),
      n('G4'), n('A4'), n('B4'), n('C5', 'h'), n('A4'),
      n('A4'), n('G#4'), n('A4'), n('B4', 'h'), n('G#4'),
      n('E4', 'h'), n('A4'), n('C5', 'h'), n('D5'),
      n('E5'), n('F5'), n('E5'), n('D5', 'h'), n('B4'),
      n('G4'), n('A4'), n('B4'), n('C5'), n('B4'), n('A4'),
      n('G#4'), n('F#4'), n('G#4'), n('A4', 'w'),
    ],
  }),
  melody({
    id: 'do-minore-armonica',
    title: 'Do minore armonica',
    composer: 'Verso il Preludio n. 20',
    difficulty: 'difficile',
    emoji: '🌑',
    bpm: 80,
    notes: [
      n('C4'), n('D4'), n('Eb4'), n('F4'), n('G4'), n('Ab4'), n('B4'), n('C5', 'h'),
      n('B4'), n('Ab4'), n('G4'), n('F4'), n('Eb4'), n('D4'), n('C4', 'h'),
      n('C4'), n('Eb4'), n('G4'), n('C5', 'h'), n('B4'), n('C5', 'w'),
    ],
  }),
].sort((a, b) => RANK[a.difficulty] - RANK[b.difficulty]);

export function melodyById(id: string): Melody | undefined {
  return melodies.find(m => m.id === id);
}
