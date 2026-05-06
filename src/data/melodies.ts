import type { Melody, MelodyNote } from '../types';

function n(toneNote: string, dur: 'w' | 'h' | 'q' | '8' = 'q'): MelodyNote {
  const octave = toneNote.match(/\d+/)?.[0] ?? '4';
  const isSharp = toneNote.includes('#');
  // Detect flat: note name has 'b' and is longer than 2 chars like 'Bb4', 'Eb4' etc.
  const noteWithoutOctave = toneNote.replace(/\d+$/, '');
  const isFlat = !isSharp && noteWithoutOctave.length > 1 && noteWithoutOctave.endsWith('b');
  const base = noteWithoutOctave.replace(/[#b]/g, '').toLowerCase();

  let vexKey: string;
  if (isSharp) {
    vexKey = `${base}#/${octave}`;
  } else if (isFlat) {
    vexKey = `${base}b/${octave}`;
  } else {
    vexKey = `${base}/${octave}`;
  }

  const durationSec = dur === 'w' ? 2.0 : dur === 'h' ? 1.0 : dur === 'q' ? 0.5 : 0.25;

  return {
    toneNote,
    vexflowKey: vexKey,
    duration: dur,
    durationSec,
    clef: 'treble',
    accidental: isSharp ? 'sharp' : isFlat ? 'flat' : undefined,
  };
}

export const melodies: Melody[] = [
  {
    id: 'inno-alla-gioia',
    title: 'Inno alla Gioia',
    composer: 'Beethoven',
    difficulty: 'facile',
    emoji: '🎵',
    requiredToneNotes: ['C4', 'D4', 'E4', 'F4', 'G4'],
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
  },
  {
    id: 'stella-lucente',
    title: 'Stella Lucente',
    composer: 'Mozart (trad.)',
    difficulty: 'facile',
    emoji: '⭐',
    requiredToneNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
    notes: [
      n('C4'), n('C4'), n('G4'), n('G4'),
      n('A4'), n('A4'), n('G4', 'h'),
      n('F4'), n('F4'), n('E4'), n('E4'),
      n('D4'), n('D4'), n('C4', 'h'),
      n('G4'), n('G4'), n('F4'), n('F4'),
      n('E4'), n('E4'), n('D4', 'h'),
      n('G4'), n('G4'), n('F4'), n('F4'),
      n('E4'), n('E4'), n('D4', 'h'),
      n('C4'), n('C4'), n('G4'), n('G4'),
      n('A4'), n('A4'), n('G4', 'h'),
      n('F4'), n('F4'), n('E4'), n('E4'),
      n('D4'), n('D4'), n('C4', 'h'),
    ],
  },
  {
    id: 'canone-pachelbel',
    title: 'Canone',
    composer: 'Pachelbel',
    difficulty: 'medio',
    emoji: '🎼',
    requiredToneNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
    notes: [
      n('D4'), n('A4'), n('B4'), n('F4'),
      n('G4'), n('D4'), n('G4'), n('A4'),
      n('F4'), n('C4'), n('D4'), n('A4'),
      n('B4'), n('F4'), n('G4'), n('D4'),
      n('D4'), n('E4'), n('F4'), n('G4'),
      n('A4'), n('G4'), n('F4'), n('E4'),
      n('D4'), n('F4'), n('A4'), n('G4'),
      n('F4'), n('E4'), n('D4', 'h'), n('D4', 'h'),
    ],
  },
  {
    id: 'minuetto-bach',
    title: 'Minuetto',
    composer: 'Petzold / Bach',
    difficulty: 'medio',
    emoji: '🎹',
    requiredToneNotes: ['G4', 'A4', 'B4', 'C5', 'D5'],
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
  },
  {
    id: 'aria-bach',
    title: 'Aria',
    composer: 'Bach',
    difficulty: 'difficile',
    emoji: '🎻',
    requiredToneNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
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
  },
  {
    id: 'sonatina-clementi',
    title: 'Sonatina',
    composer: 'Clementi',
    difficulty: 'difficile',
    emoji: '🎶',
    requiredToneNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
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
  },
];
