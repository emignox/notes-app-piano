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
];

export function melodyById(id: string): Melody | undefined {
  return melodies.find(m => m.id === id);
}
