// ─────────────────────────────────────────────────────────────────────────────
// Teoria musicale: parsing note, enarmonie, posizione sul pentagramma.
// Tutto ciò che riguarda "come si chiama" e "dove sta" una nota vive qui.
// ─────────────────────────────────────────────────────────────────────────────

import type { Clef, NoteEntry } from '../types';

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

export const IT_NAMES: Record<string, string> = {
  C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si',
};

const SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export interface ParsedNote {
  letter: string;
  acc: '' | '#' | 'b';
  octave: number;
}

const NOTE_RE = /^([A-Ga-g])([#b]?)(-?\d+)?$/;

/** Accetta "C", "C#", "Bb4", "F#4". Ottava assente → 4. */
export function parseNote(note: string): ParsedNote {
  const m = NOTE_RE.exec((note ?? '').trim());
  if (!m) return { letter: 'C', acc: '', octave: 4 };
  return {
    letter: m[1].toUpperCase(),
    acc: (m[2] as '' | '#' | 'b') ?? '',
    octave: m[3] ? parseInt(m[3], 10) : 4,
  };
}

export function midiOf(note: string): number {
  const { letter, acc, octave } = parseNote(note);
  const alter = acc === '#' ? 1 : acc === 'b' ? -1 : 0;
  return (octave + 1) * 12 + SEMITONE[letter] + alter;
}

export function noteFromMidi(midi: number): string {
  const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${sharpNames[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

/** Classe di altezza 0..11 — ignora l'ottava. Do♯ e Re♭ danno lo stesso valore. */
export function pitchClass(note: string): number {
  return ((midiOf(note) % 12) + 12) % 12;
}

/** Confronto enarmonico senza ottava: "Bb" ≡ "A#". */
export function samePitchClass(a: string, b: string): boolean {
  return pitchClass(a) === pitchClass(b);
}

/** Nome italiano con alterazione: "C#" → "Do♯", "Bb4" → "Si♭". */
export function italianOf(note: string): string {
  const { letter, acc } = parseNote(note);
  const base = IT_NAMES[letter] ?? letter;
  return base + (acc === '#' ? '♯' : acc === 'b' ? '♭' : '');
}

/** Nome inglese "pulito" con simboli musicali: "C#4" → "C♯". */
export function englishOf(note: string): string {
  const { letter, acc } = parseNote(note);
  return letter + (acc === '#' ? '♯' : acc === 'b' ? '♭' : '');
}

export type NameStyle = 'it' | 'en' | 'both';

/** Etichetta secondo la preferenza dell'utente. */
export function label(note: string, style: NameStyle = 'it'): string {
  if (style === 'en') return englishOf(note);
  if (style === 'both') return `${italianOf(note)} (${englishOf(note)})`;
  return italianOf(note);
}

/** Etichetta completa con ottava, per il feedback: "Do♯ (C♯4)". */
export function fullLabel(note: string, style: NameStyle = 'it'): string {
  const { octave } = parseNote(note);
  if (style === 'en') return `${englishOf(note)}${octave}`;
  if (style === 'it') return italianOf(note);
  return `${italianOf(note)} (${englishOf(note)}${octave})`;
}

/** Chiave nel formato VexFlow: "C#4" → "c#/4". */
export function vexKeyOf(note: string): string {
  const { letter, acc, octave } = parseNote(note);
  return `${letter.toLowerCase()}${acc}/${octave}`;
}

/** Ordina dal grave all'acuto: VexFlow vuole gli accordi in ordine crescente. */
export function sortByPitch(notes: string[]): string[] {
  return [...notes].sort((a, b) => midiOf(a) - midiOf(b));
}

/** Stessa nota, stessa ottava (tollerante alle enarmonie: Si♭ = La♯). */
export function sameNote(a: string, b: string): boolean {
  return midiOf(a) === midiOf(b);
}

// ── Posizione sul pentagramma ────────────────────────────────────────────────

/** Indice diatonico: conta solo i gradi della scala (le alterazioni non spostano la nota). */
export function diatonicIndex(letter: string, octave: number): number {
  const i = LETTERS.indexOf(letter.toUpperCase() as (typeof LETTERS)[number]);
  return octave * 7 + (i < 0 ? 0 : i);
}

export function diatonicOf(note: string): number {
  const { letter, octave } = parseNote(note);
  return diatonicIndex(letter, octave);
}

/** Prima linea (la più bassa) di ogni chiave. Violino → Mi4, Basso → Sol2. */
const BOTTOM_LINE: Record<Clef, number> = {
  treble: diatonicIndex('E', 4),
  bass: diatonicIndex('G', 2),
};

/**
 * Slot verticale: 0 = prima linea, 1 = primo spazio, 2 = seconda linea…
 * 8 = quinta linea. Negativo sotto il pentagramma, >8 sopra.
 */
export function staffSlot(note: string, clef: Clef): number {
  return diatonicOf(note) - BOTTOM_LINE[clef];
}

const ord = (n: number) => `${n}ª`;

/**
 * Descrizione della posizione, generata (non scritta a mano ⇒ sempre corretta).
 * Es. Mi4 in chiave di violino → "1ª linea del pentagramma".
 */
export function describePosition(note: string, clef: Clef): string {
  const slot = staffSlot(note, clef);

  if (slot >= 0 && slot <= 8) {
    return slot % 2 === 0
      ? `${ord(slot / 2 + 1)} linea del pentagramma`
      : `${ord((slot + 1) / 2)} spazio del pentagramma`;
  }

  if (slot < 0) {
    const k = -slot;
    if (k % 2 === 0) return `${ord(k / 2)} linea aggiuntiva sotto il pentagramma`;
    return k === 1
      ? 'spazio sotto la prima linea'
      : `spazio sotto la ${ord((k - 1) / 2)} linea aggiuntiva`;
  }

  const m = slot - 8;
  if (m % 2 === 0) return `${ord(m / 2)} linea aggiuntiva sopra il pentagramma`;
  return m === 1
    ? 'spazio sopra la quinta linea'
    : `spazio sopra la ${ord((m - 1) / 2)} linea aggiuntiva`;
}

/** true se la nota poggia su una linea (utile per il colpo d'occhio linea/spazio). */
export function isOnLine(note: string, clef: Clef): boolean {
  const slot = staffSlot(note, clef);
  return ((slot % 2) + 2) % 2 === 0;
}

// ── Note di riferimento (landmark reading) ──────────────────────────────────
// I lettori esperti non contano le linee: ancorano la nota a pochi punti fissi.

export interface Landmark {
  clef: Clef;
  note: string;
  label: string;
  short: string;
}

export const LANDMARKS: Landmark[] = [
  { clef: 'treble', note: 'C4', label: 'Do centrale', short: 'Do centrale' },
  { clef: 'treble', note: 'G4', label: 'Sol della chiave di violino (2ª linea)', short: 'Sol (2ª linea)' },
  { clef: 'treble', note: 'C5', label: 'Do del 3° spazio', short: 'Do (3° spazio)' },
  { clef: 'treble', note: 'F5', label: 'Fa della 5ª linea', short: 'Fa (5ª linea)' },
  { clef: 'bass', note: 'G2', label: 'Sol della 1ª linea', short: 'Sol (1ª linea)' },
  { clef: 'bass', note: 'C3', label: 'Do del 2° spazio', short: 'Do (2° spazio)' },
  { clef: 'bass', note: 'F3', label: 'Fa della chiave di basso (4ª linea)', short: 'Fa (4ª linea)' },
  { clef: 'bass', note: 'C4', label: 'Do centrale', short: 'Do centrale' },
];

const STEP_WORDS = ['', 'un grado', 'due gradi', 'tre gradi', 'quattro gradi', 'cinque gradi', 'sei gradi'];

/** "due gradi sopra il Do centrale" — l'aiuto che insegna a leggere per riferimenti. */
export function landmarkHint(note: string, clef: Clef): string {
  const target = diatonicOf(note);
  const pool = LANDMARKS.filter(l => l.clef === clef);
  let best = pool[0];
  let bestDist = Infinity;
  for (const l of pool) {
    const d = Math.abs(diatonicOf(l.note) - target);
    if (d < bestDist) { best = l; bestDist = d; }
  }
  if (!best) return describePosition(note, clef);
  if (bestDist === 0) return `È una nota di riferimento: ${best.label}`;
  const dir = diatonicOf(best.note) < target ? 'sopra' : 'sotto';
  const steps = STEP_WORDS[bestDist] ?? `${bestDist} gradi`;
  return `${steps} ${dir} il ${best.short}`;
}

export function isLandmark(note: string, clef: Clef): boolean {
  return LANDMARKS.some(l => l.clef === clef && diatonicOf(l.note) === diatonicOf(note));
}

// ── Intervalli (lettura per distanze) ───────────────────────────────────────

const INTERVAL_NAMES = [
  'unisono', 'seconda', 'terza', 'quarta', 'quinta', 'sesta', 'settima', 'ottava',
];

/** Nome dell'intervallo diatonico fra due note + direzione. */
export function intervalLabel(from: string, to: string): string {
  const d = diatonicOf(to) - diatonicOf(from);
  const size = Math.abs(d);
  const name = INTERVAL_NAMES[size] ?? `${size + 1}ª`;
  if (d === 0) return 'stessa nota';
  return `${name} ${d > 0 ? '↑' : '↓'}`;
}

/** "grado congiunto" vs "salto": la distinzione base della lettura melodica. */
export function motionLabel(from: string, to: string): 'stessa' | 'grado' | 'salto' {
  const d = Math.abs(diatonicOf(to) - diatonicOf(from));
  return d === 0 ? 'stessa' : d === 1 ? 'grado' : 'salto';
}

// ── Orientarsi sulla tastiera ───────────────────────────────────────────────
// Sul piano non si contano i tasti dal bordo: si guardano i gruppi di tasti
// neri (due e tre) e da lì si ricava tutto. Questi aiuti insegnano quello.

const KEY_HINTS: Record<string, string> = {
  C: 'il tasto bianco subito a SINISTRA del gruppo di DUE tasti neri',
  D: 'il tasto bianco IN MEZZO ai due tasti neri',
  E: 'il tasto bianco subito a DESTRA del gruppo di DUE tasti neri',
  F: 'il tasto bianco subito a SINISTRA del gruppo di TRE tasti neri',
  G: 'il tasto bianco fra il 1° e il 2° dei TRE tasti neri',
  A: 'il tasto bianco fra il 2° e il 3° dei TRE tasti neri',
  B: 'il tasto bianco subito a DESTRA del gruppo di TRE tasti neri',
};

/** Come trovare il tasto senza contare: relazione con i gruppi di tasti neri. */
export function keyboardHint(note: string): string {
  const { letter, acc } = parseNote(note);
  const base = KEY_HINTS[letter] ?? '';
  if (acc === '#') return `il tasto NERO subito a destra di ${italianOf(letter)} — ${base}`;
  if (acc === 'b') return `il tasto NERO subito a sinistra di ${italianOf(letter)} — ${base}`;
  return base;
}

// ── Helper su NoteEntry ─────────────────────────────────────────────────────

/** Confronta la risposta dell'utente ("Do", "C#", "Bb") con la nota della carta. */
export function entryMatchesAnswer(entry: NoteEntry, answer: string): boolean {
  return samePitchClass(entry.englishName, answer);
}

export function entryLabel(entry: NoteEntry, style: NameStyle = 'it'): string {
  return label(entry.englishName, style);
}

export function entryFullLabel(entry: NoteEntry, style: NameStyle = 'it'): string {
  return fullLabel(entry.englishName, style);
}
