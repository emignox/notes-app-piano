// ─────────────────────────────────────────────────────────────────────────────
// Teoria musicale: parsing note, enarmonie, posizione sul pentagramma.
// Tutto ciò che riguarda "come si chiama" e "dove sta" una nota vive qui.
// ─────────────────────────────────────────────────────────────────────────────

import type { Clef, NoteEntry } from '../types';
import { getLang, t } from '../i18n';

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

export const IT_NAMES: Record<string, string> = {
  C: 'Do',
  // In francese si scrive "Ré": il nome si legge al momento dell'uso, segue la lingua.
  get D() { return getLang() === 'fr' ? 'Ré' : 'Re'; },
  E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si',
};

const SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * Le doppie alterazioni servono davvero: la settima dell'accordo di settima
 * diminuita su Do è un Si♭♭ (stesso tasto del La, ma è la SETTIMA, non la
 * sesta), e il settimo grado del Sol♯ minore armonica è un Fa♯♯. Scriverle
 * come La e Sol farebbe comparire due volte la stessa lettera e renderebbe
 * incomprensibile sia il pentagramma sia la formula dell'accordo.
 */
export type Acc = '' | '#' | 'b' | '##' | 'bb';

export interface ParsedNote {
  letter: string;
  acc: Acc;
  octave: number;
}

const NOTE_RE = /^([A-Ga-g])(##|bb|[#b]?)(-?\d+)?$/;

/** Accetta "C", "C#", "Bb4", "F#4", "Bbb4", "F##4". Ottava assente → 4. */
export function parseNote(note: string): ParsedNote {
  const m = NOTE_RE.exec((note ?? '').trim());
  if (!m) return { letter: 'C', acc: '', octave: 4 };
  return {
    letter: m[1].toUpperCase(),
    acc: (m[2] as Acc) ?? '',
    octave: m[3] ? parseInt(m[3], 10) : 4,
  };
}

/** Quanti semitoni sposta l'alterazione: ♯ = +1, ♯♯ = +2, ♭♭ = −2. */
export function alterOf(acc: Acc): number {
  if (acc.startsWith('#')) return acc.length;
  if (acc.startsWith('b')) return -acc.length;
  return 0;
}

/** L'alterazione nel vocabolario di NoteEntry, per il disegno sul pentagramma. */
export function accidentalKind(acc: Acc): NoteEntry['accidental'] {
  switch (acc) {
    case '#': return 'sharp';
    case 'b': return 'flat';
    case '##': return 'double-sharp';
    case 'bb': return 'double-flat';
    default: return undefined;
  }
}

/** L'alterazione con i simboli veri: "##" → "♯♯". */
export function accSymbol(acc: Acc): string {
  return acc === '#' ? '♯' : acc === 'b' ? '♭' : acc === '##' ? '♯♯' : acc === 'bb' ? '♭♭' : '';
}

export function midiOf(note: string): number {
  const { letter, acc, octave } = parseNote(note);
  return (octave + 1) * 12 + SEMITONE[letter] + alterOf(acc);
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
  return base + accSymbol(acc);
}

/** Nome inglese "pulito" con simboli musicali: "C#4" → "C♯". */
export function englishOf(note: string): string {
  const { letter, acc } = parseNote(note);
  return letter + accSymbol(acc);
}

/**
 * Il nome di una nota dentro una frase già scritta (aiuti, diagnosi): lettere
 * in inglese, Do Re Mi (Do Ré Mi) nelle altre lingue. Non dipende dall'opzione
 * "Nomi delle note", che governa i pulsanti e le etichette.
 */
export function nameInText(note: string): string {
  return getLang() === 'en' ? englishOf(note) : italianOf(note);
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

/**
 * Stesso NOME scritto, ottava a parte: lettera e alterazione. Chi risponde col
 * nome deve leggere ciò che c'è sul rigo: un Si♭ non è un La♯, anche se il
 * tasto è lo stesso. (Col tasto o suonando, invece, conta il tasto.)
 */
export function sameSpelling(a: string, b: string): boolean {
  const x = parseNote(a);
  const y = parseNote(b);
  return x.letter === y.letter && x.acc === y.acc;
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

/** Il numero ordinale: 1ª in italiano, 1st in inglese, 1re / 1er in francese. */
const ord = (n: number, masc = false): string => {
  const lang = getLang();
  if (lang === 'en') {
    const rest = n % 100;
    const suffix = rest >= 11 && rest <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
    return `${n}${suffix}`;
  }
  if (lang === 'fr') return n === 1 ? (masc ? '1er' : '1re') : `${n}e`;
  return `${n}ª`;
};

/**
 * Descrizione della posizione, generata (non scritta a mano ⇒ sempre corretta).
 * Es. Mi4 in chiave di violino → "1ª linea del pentagramma".
 */
export function describePosition(note: string, clef: Clef): string {
  const slot = staffSlot(note, clef);

  if (slot >= 0 && slot <= 8) {
    return slot % 2 === 0
      ? t('{ord} linea del pentagramma', { ord: ord(slot / 2 + 1) })
      : t('{ord} spazio del pentagramma', { ord: ord((slot + 1) / 2, true) });
  }

  if (slot < 0) {
    const k = -slot;
    if (k % 2 === 0) return t('{ord} linea aggiuntiva sotto il pentagramma', { ord: ord(k / 2) });
    return k === 1
      ? t('spazio sotto la prima linea')
      : t('spazio sotto la {ord} linea aggiuntiva', { ord: ord((k - 1) / 2) });
  }

  const m = slot - 8;
  if (m % 2 === 0) return t('{ord} linea aggiuntiva sopra il pentagramma', { ord: ord(m / 2) });
  return m === 1
    ? t('spazio sopra la quinta linea')
    : t('spazio sopra la {ord} linea aggiuntiva', { ord: ord((m - 1) / 2) });
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

/** Etichette e nomi brevi in italiano: si traducono quando si mostrano. */
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

export const STEP_WORDS = ['', 'un grado', 'due gradi', 'tre gradi', 'quattro gradi', 'cinque gradi', 'sei gradi'];

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
  if (bestDist === 0) return t('È una nota di riferimento: {ref}', { ref: t(best.label) });
  const dir = diatonicOf(best.note) < target ? 'sopra' : 'sotto';
  const word = STEP_WORDS[bestDist];
  const steps = word === undefined ? t('{n} gradi', { n: bestDist }) : t(word);
  return `${steps} ${t(`${dir} il ${best.short}`)}`;
}

export function isLandmark(note: string, clef: Clef): boolean {
  return LANDMARKS.some(l => l.clef === clef && diatonicOf(l.note) === diatonicOf(note));
}

// ── Intervalli (lettura per distanze) ───────────────────────────────────────

export const INTERVAL_NAMES = [
  'unisono', 'seconda', 'terza', 'quarta', 'quinta', 'sesta', 'settima', 'ottava',
];

/** Nome dell'intervallo diatonico fra due note + direzione. */
export function intervalLabel(from: string, to: string): string {
  const d = diatonicOf(to) - diatonicOf(from);
  const size = Math.abs(d);
  const base = INTERVAL_NAMES[size];
  const name = base === undefined ? `${size + 1}ª` : t(base);
  if (d === 0) return t('stessa nota');
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

export const KEY_HINTS: Record<string, string> = {
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
  const hint = base === '' ? '' : t(base);
  const name = nameInText(letter);
  if (acc === '#') return t('il tasto NERO subito a destra di {note} — {hint}', { note: name, hint });
  if (acc === 'b') return t('il tasto NERO subito a sinistra di {note} — {hint}', { note: name, hint });
  if (acc === '##') return t('due semitoni a destra di {note} — {hint}', { note: name, hint });
  if (acc === 'bb') return t('due semitoni a sinistra di {note} — {hint}', { note: name, hint });
  return hint;
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

/** Una nota qualsiasi pronta per il pentagramma (esempi ed esercizi delle lezioni). */
export function noteEntry(note: string, clef: Clef, i = 0, duration?: string): NoteEntry {
  const { acc } = parseNote(note);
  return {
    id: `${note}-${i}`,
    clef,
    pitch: note,
    // Letto al momento dell'uso: segue la lingua (in francese "Ré").
    get displayName() { return italianOf(note); },
    englishName: note,
    vexflowKey: vexKeyOf(note),
    accidental: accidentalKind(acc),
    noteValue: duration === 'w' ? 'whole' : duration === 'h' ? 'half' : 'quarter',
    toneNote: note,
    stageId: 'lesson',
  };
}
