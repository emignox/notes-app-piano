// ─────────────────────────────────────────────────────────────────────────────
// Il percorso di apprendimento.
//
// Le voci sono GENERATE dal nome della nota: id, pentagramma, nome italiano e
// suono derivano tutti dalla stessa fonte, così non possono più andare fuori
// sincrono (la vecchia versione scritta a mano aveva le descrizioni sfasate di
// una posizione e un Fa6 che suonava Fa5).
//
// L'ORDINE È PARTE DEI DATI SALVATI: il progresso è "quante note ho sbloccato",
// quindi si può solo aggiungere in coda, mai riordinare.
// ─────────────────────────────────────────────────────────────────────────────

import type { Clef, NoteEntry, Stage } from '../types';
import { isLandmark, italianOf, parseNote } from '../lib/notes';

interface NoteOpts {
  mnemonic?: string;
}

function makeNote(clef: Clef, toneNote: string, stageId: string, opts: NoteOpts = {}): NoteEntry {
  const { letter, acc, octave } = parseNote(toneNote);
  const id = `${toneNote.toLowerCase().replace('#', 's')}_${clef}`;
  return {
    id,
    clef,
    pitch: `${letter}${acc}/${octave}`,
    displayName: italianOf(toneNote),
    englishName: toneNote,
    vexflowKey: `${letter.toLowerCase()}${acc}/${octave}`,
    accidental: acc === '#' ? 'sharp' : acc === 'b' ? 'flat' : undefined,
    noteValue: 'whole',
    toneNote,
    stageId,
    landmark: isLandmark(toneNote, clef),
    mnemonic: opts.mnemonic,
  };
}

const MNEMONICS: Record<string, string> = {
  c4_treble:
    'Il Do centrale è il tuo punto zero: unica linetta appoggiata sotto il pentagramma. Sul piano è il Do vicino alla serratura/logo.',
  g4_treble:
    'La chiave di violino è una spirale che si avvolge proprio attorno alla 2ª linea: quella linea è il SOL. Da qui puoi contare tutto.',
  c5_treble: 'Do del 3° spazio: sta esattamente in mezzo al pentagramma, un\'ottava sopra il Do centrale.',
  f5_treble: 'Fa sulla linea più alta: chiude il pentagramma di violino.',
  f3_bass:
    'La chiave di basso ha DUE PUNTI che abbracciano la 4ª linea: quella linea è il FA. È il riferimento gemello del Sol di violino.',
  g2_bass: 'Sol sulla linea più bassa: apre il pentagramma di basso.',
  c3_bass: 'Do del 2° spazio: un\'ottava sotto il Do centrale.',
  c4_bass: 'Stesso Do centrale della chiave di violino, ma qui sta SOPRA il pentagramma: è il ponte fra le due mani.',
  fs4_treble: 'Il diesis ♯ alza di un semitono: stessa posizione del Fa, ma suoni il tasto nero subito a destra.',
  bb4_treble: 'Il bemolle ♭ abbassa di un semitono: stessa posizione del Si, ma suoni il tasto nero subito a sinistra.',
};

function build(clef: Clef, notes: string[], stageId: string): NoteEntry[] {
  return notes.map(n => {
    const entry = makeNote(clef, n, stageId);
    return MNEMONICS[entry.id] ? { ...entry, mnemonic: MNEMONICS[entry.id] } : entry;
  });
}

// ── I gruppi, nell'ordine in cui si sbloccano ───────────────────────────────

const trebleCore = build('treble', ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'], 'treble-core');
const bassCore = build('bass', ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'], 'bass-core');
const sharps = build('treble', ['F#4', 'C#4', 'G#4', 'D#4', 'A#4'], 'sharps');
const flats = build('treble', ['Bb4', 'Eb4', 'Ab4', 'Db4', 'Gb4'], 'flats');
const ledger = build('treble', ['C3', 'F6'], 'ledger');
const extended = [
  ...build('treble', ['A5', 'B5', 'C6'], 'extended'),
  ...build('bass', ['F2', 'E2'], 'extended'),
];

export const curriculum: NoteEntry[] = [
  ...trebleCore,
  ...bassCore,
  ...sharps,
  ...flats,
  ...ledger,
  ...extended,
];

export const TOTAL_LEVELS = curriculum.length;

// ── Metadati dei gruppi (per la mappa del percorso) ─────────────────────────

function range(stageId: string): { from: number; to: number } {
  const idx = curriculum.reduce<number[]>((acc, n, i) => (n.stageId === stageId ? [...acc, i] : acc), []);
  return { from: idx[0] ?? 0, to: idx[idx.length - 1] ?? 0 };
}

export const stages: Stage[] = [
  {
    id: 'treble-core',
    title: 'Chiave di Violino',
    subtitle: 'Le note della mano destra, dal Do centrale al Sol acuto',
    emoji: '🎼',
    ...range('treble-core'),
  },
  {
    id: 'bass-core',
    title: 'Chiave di Basso',
    subtitle: 'Le note della mano sinistra, da Sol2 al Do centrale',
    emoji: '🎹',
    ...range('bass-core'),
  },
  {
    id: 'sharps',
    title: 'Diesis ♯',
    subtitle: 'I tasti neri che salgono di un semitono',
    emoji: '⬆️',
    ...range('sharps'),
  },
  {
    id: 'flats',
    title: 'Bemolle ♭',
    subtitle: 'I tasti neri che scendono di un semitono',
    emoji: '⬇️',
    ...range('flats'),
  },
  {
    id: 'ledger',
    title: 'Linee aggiuntive',
    subtitle: 'Fuori dal pentagramma: acuti e gravi estremi',
    emoji: '🪜',
    ...range('ledger'),
  },
  {
    id: 'extended',
    title: 'Registri estesi',
    subtitle: 'Gli estremi della tastiera',
    emoji: '🚀',
    ...range('extended'),
  },
];

export function stageOf(index: number): Stage {
  return stages.find(s => index >= s.from && index <= s.to) ?? stages[0];
}

export function noteById(id: string): NoteEntry | undefined {
  return curriculum.find(n => n.id === id);
}
