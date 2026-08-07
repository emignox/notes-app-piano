// ─────────────────────────────────────────────────────────────────────────────
// Scale, arpeggi e accordi costruiti per formula, non elencati a mano.
//
// Il punto delicato è la SCRITTURA delle note: una scala usa ogni lettera una
// volta sola. In Fa maggiore la quarta nota è Si♭, mai La♯ — stesso tasto, ma
// scriverla male rende il pentagramma illeggibile (due note sulla stessa riga e
// nessuna sulla successiva). Per questo le note si costruiscono scegliendo
// prima la LETTERA e poi l'alterazione che la porta all'altezza giusta.
// ─────────────────────────────────────────────────────────────────────────────

import { midiOf, noteFromMidi, parseNote } from './notes';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const NATURAL: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * Scrive la nota che sta a `targetPc` usando la lettera indicata.
 * Es. lettera "B" e altezza di La♯ → "Bb" (Si bemolle), non "A#".
 *
 * Arriva fino alla doppia alterazione, che non è un capriccio: la settima di
 * Dodim7 è un Si♭♭ e il 7° grado del Sol♯ minore armonica è un Fa♯♯. Scritte
 * come La e Sol darebbero due volte la stessa lettera nella stessa figura.
 */
const ACC_FOR_DIFF: Record<number, string> = { 2: '##', 1: '#', 0: '', [-1]: 'b', [-2]: 'bb' };

function spell(letterIndex: number, targetPc: number, octave: number): string {
  const letter = LETTERS[((letterIndex % 7) + 7) % 7];
  let diff = (((targetPc - NATURAL[letter]) % 12) + 12) % 12;
  if (diff > 6) diff -= 12;
  const acc = ACC_FOR_DIFF[diff] ?? '';
  return `${letter}${acc}${octave}`;
}

/** Come `spell`, ma sceglie l'ottava che tiene la scala in salita. */
function spellAbove(letterIndex: number, semitonesFromRoot: number, root: string): string {
  const rootMidi = midiOf(root);
  const targetMidi = rootMidi + semitonesFromRoot;
  const pc = ((targetMidi % 12) + 12) % 12;
  const octave = Math.floor(targetMidi / 12) - 1;
  // La lettera può cadere nell'ottava sopra o sotto rispetto al calcolo diretto
  // (Si♯ e Do♭ sono i casi limite): si aggiusta confrontando le altezze.
  for (const o of [octave, octave - 1, octave + 1]) {
    const note = spell(letterIndex, pc, o);
    if (midiOf(note) === targetMidi) return note;
  }
  // Oltre la doppia alterazione (servirebbe un triplo diesis: succede solo in
  // tonalità che non esistono nella pratica) si rinuncia alla scrittura teorica
  // e si tiene l'ALTEZZA giusta: meglio un nome approssimato che una nota
  // sbagliata. Verificato dal test: senza questo, Dodim7 suonava 0-3-6-11.
  return noteFromMidi(targetMidi);
}

// ── Scale ───────────────────────────────────────────────────────────────────

export type ScaleType = 'maggiore' | 'minore naturale' | 'minore armonica' | 'minore melodica';

const SCALE_STEPS: Record<ScaleType, number[]> = {
  maggiore: [0, 2, 4, 5, 7, 9, 11],
  'minore naturale': [0, 2, 3, 5, 7, 8, 10],
  'minore armonica': [0, 2, 3, 5, 7, 8, 11],
  'minore melodica': [0, 2, 3, 5, 7, 9, 11],
};

export const SCALE_EXPLAIN: Record<ScaleType, string> = {
  maggiore:
    'Tono, tono, semitono, tono, tono, tono, semitono. I due semitoni cadono fra il 3° e il 4° grado e fra il 7° e l\'8°: è quel disegno a dare il suono "luminoso".',
  'minore naturale':
    'Come la maggiore ma con 3ª, 6ª e 7ª abbassate. Il semitono fra il 2° e il 3° grado è ciò che si sente come "malinconico".',
  'minore armonica':
    'La minore naturale con la 7ª rialzata: si crea un salto di tre semitoni fra il 6° e il 7° grado, quel colore un po\' orientale. Serve ad avere una sensibile che "tira" verso la tonica.',
  'minore melodica':
    'In salita si alzano 6ª e 7ª per rendere la linea scorrevole; in discesa si torna alla minore naturale. Nasce dal canto, non dalla teoria.',
};

/** Una scala su una o due ottave, scritta correttamente. */
export function buildScale(root: string, type: ScaleType, octaves = 1): string[] {
  const { letter } = parseNote(root);
  const rootLetter = LETTERS.indexOf(letter as (typeof LETTERS)[number]);
  const steps = SCALE_STEPS[type];
  const out: string[] = [];
  for (let o = 0; o < octaves; o++) {
    steps.forEach((semi, i) => out.push(spellAbove(rootLetter + i, semi + 12 * o, root)));
  }
  out.push(spellAbove(rootLetter, 12 * octaves, root)); // la tonica in cima
  return out;
}

// ── Accordi ─────────────────────────────────────────────────────────────────

export type ChordQuality =
  | 'maggiore'
  | 'minore'
  | 'diminuito'
  | 'aumentato'
  | 'settima di dominante'
  | 'settima maggiore'
  | 'settima minore'
  | 'semidiminuito'
  | 'settima diminuita';

interface ChordSpec {
  /** Semitoni dalla fondamentale. */
  steps: number[];
  /** Salti di lettera dalla fondamentale (0 = fondamentale, 2 = terza…). */
  letters: number[];
  /** Sigla come si scrive sugli spartiti, dopo il nome della nota. */
  symbol: string;
  formula: string;
  explain: string;
}

export const CHORDS: Record<ChordQuality, ChordSpec> = {
  maggiore: {
    steps: [0, 4, 7],
    letters: [0, 2, 4],
    symbol: '',
    formula: '1 · 3 · 5',
    explain:
      'Fondamentale, terza MAGGIORE (4 semitoni) e quinta giusta (altri 3). La terza grande sotto e la piccola sopra: è questo ordine a farlo suonare aperto e sereno.',
  },
  minore: {
    steps: [0, 3, 7],
    letters: [0, 2, 4],
    symbol: 'm',
    formula: '1 · ♭3 · 5',
    explain:
      'Identico al maggiore ma con la terza abbassata di un semitono. Cambia UNA nota e cambia tutto il carattere: prima la terza piccola, poi la grande.',
  },
  diminuito: {
    steps: [0, 3, 6],
    letters: [0, 2, 4],
    symbol: 'dim',
    formula: '1 · ♭3 · ♭5',
    explain:
      'Due terze minori impilate: suona instabile, "sospeso", e chiede di risolvere da qualche parte. Si usa di passaggio, raramente per fermarsi.',
  },
  aumentato: {
    steps: [0, 4, 8],
    letters: [0, 2, 4],
    symbol: 'aug',
    formula: '1 · 3 · ♯5',
    explain:
      'Due terze maggiori impilate: nessuna nota sembra la "casa", per questo dà quel senso di sogno o di sospensione.',
  },
  'settima di dominante': {
    steps: [0, 4, 7, 10],
    letters: [0, 2, 4, 6],
    symbol: '7',
    formula: '1 · 3 · 5 · ♭7',
    explain:
      'Un accordo maggiore più la settima minore. È il motore della musica tonale: crea tensione e vuole risolvere sull\'accordo un quinta sotto (Sol7 → Do).',
  },
  'settima maggiore': {
    steps: [0, 4, 7, 11],
    letters: [0, 2, 4, 6],
    symbol: 'maj7',
    formula: '1 · 3 · 5 · 7',
    explain:
      'Maggiore con la settima grande, a un semitono dalla tonica. Non spinge a risolvere: si ferma lì, morbido — il suono del jazz e della bossa nova.',
  },
  'settima minore': {
    steps: [0, 3, 7, 10],
    letters: [0, 2, 4, 6],
    symbol: 'm7',
    formula: '1 · ♭3 · 5 · ♭7',
    explain:
      'Minore con settima minore: pacato e senza tensione. È l\'accordo di partenza del giro II-V-I (Rem7 → Sol7 → Do).',
  },
  semidiminuito: {
    steps: [0, 3, 6, 10],
    letters: [0, 2, 4, 6],
    symbol: 'm7♭5',
    formula: '1 · ♭3 · ♭5 · ♭7',
    explain:
      'Un diminuito con la settima MINORE, non diminuita: per questo si chiama "semi". Si scrive m7♭5 o Ø. È il II grado delle tonalità minori — l\'inizio del II-V-I minore.',
  },
  'settima diminuita': {
    steps: [0, 3, 6, 9],
    letters: [0, 2, 4, 6],
    symbol: 'dim7',
    formula: '1 · ♭3 · ♭5 · ♭♭7',
    explain:
      'Tre terze minori impilate: l\'accordo perfettamente simmetrico. Diviso in quattro parti uguali l\'ottava, ogni sua nota può fare da fondamentale — quindi ne esistono solo tre diversi in tutta la musica, e da lì si può andare ovunque.',
  },
};

/** Le note dell'accordo in posizione fondamentale. */
export function buildChord(root: string, quality: ChordQuality): string[] {
  const { letter } = parseNote(root);
  const rootLetter = LETTERS.indexOf(letter as (typeof LETTERS)[number]);
  const spec = CHORDS[quality];
  return spec.steps.map((semi, i) => spellAbove(rootLetter + spec.letters[i], semi, root));
}

/**
 * Rivolto: si prende la nota più grave e la si porta sopra le altre. Le note
 * sono le stesse, cambia solo quale sta in basso.
 */
export function invert(notes: string[], times: number): string[] {
  const out = [...notes];
  for (let n = 0; n < times; n++) {
    const lowest = out.shift();
    if (!lowest) break;
    const { letter, acc, octave } = parseNote(lowest);
    out.push(`${letter}${acc}${octave + 1}`);
  }
  return out;
}

export interface InversionInfo {
  index: number;
  /** Nome italiano: fondamentale, primo rivolto… */
  name: string;
  /** Come lo chiamano in inglese, che è il termine che si trova nei tutorial. */
  english: string;
  /** Quale grado dell'accordo finisce al basso. */
  bass: string;
  explain: string;
}

const INVERSION_NAMES = ['fondamentale', 'primo rivolto', 'secondo rivolto', 'terzo rivolto'];
const INVERSION_EN = ['root position', '1st inversion', '2nd inversion', '3rd inversion'];
const BASS_DEGREE = ['la fondamentale', 'la terza', 'la quinta', 'la settima'];

export function inversionsOf(quality: ChordQuality): InversionInfo[] {
  const size = CHORDS[quality].steps.length;
  return Array.from({ length: size }, (_, i) => ({
    index: i,
    name: INVERSION_NAMES[i],
    english: INVERSION_EN[i],
    bass: BASS_DEGREE[i],
    explain:
      i === 0
        ? 'La fondamentale sta al basso: la posizione più stabile, quella con cui si impara l\'accordo.'
        : `Al basso c'è ${BASS_DEGREE[i]}. Stesse note, stesso accordo: cambia solo l'ordine, e con esso il colore e — soprattutto — la comodità per la mano.`,
  }));
}

/** Nome per esteso: "Do maggiore (C)", "Sol settima di dominante (G7)". */
export function chordSymbol(root: string, quality: ChordQuality): string {
  const { letter, acc } = parseNote(root);
  return `${letter}${acc === '#' ? '♯' : acc === 'b' ? '♭' : ''}${CHORDS[quality].symbol}`;
}

// ── Arpeggi ─────────────────────────────────────────────────────────────────

export type ArpeggioPattern = 'salita' | 'discesa' | 'andata e ritorno' | 'alternato';

export const PATTERN_EXPLAIN: Record<ArpeggioPattern, string> = {
  salita: 'Dal grave all\'acuto. Il verso base: serve a memorizzare l\'accordo sotto le dita.',
  discesa: 'Dall\'acuto al grave. Sembra uguale ma non lo è: il passaggio del pollice cade in un altro punto, e va allenato a parte.',
  'andata e ritorno': 'Su e giù senza fermarsi. È qui che si scopre se il giro di boa in cima è pulito o se si inciampa.',
  alternato:
    'Si salta avanti e indietro fra le note invece di prenderle in fila (1-3-2-4…). Rompe l\'automatismo: costringe a pensare le note, non la sequenza memorizzata.',
};

/** Applica il verso di esecuzione a una salita di partenza. */
export function applyPattern(ascending: string[], pattern: ArpeggioPattern): string[] {
  switch (pattern) {
    case 'salita':
      return ascending;
    case 'discesa':
      return [...ascending].reverse();
    case 'andata e ritorno':
      return [...ascending, ...[...ascending].reverse().slice(1)];
    case 'alternato': {
      const out: string[] = [];
      for (let i = 0; i < ascending.length; i++) {
        out.push(ascending[i]);
        if (i + 2 < ascending.length) out.push(ascending[i + 2]);
      }
      return out;
    }
  }
}

// ── Modi e scale non diatoniche ─────────────────────────────────────────────

export type ModeName = 'ionico' | 'dorico' | 'frigio' | 'lidio' | 'misolidio' | 'eolio' | 'locrio';

export const MODES: { name: ModeName; degree: number; steps: number[]; color: string }[] = [
  { name: 'ionico', degree: 1, steps: [0, 2, 4, 5, 7, 9, 11], color: 'È la scala maggiore. Suono neutro, "di casa".' },
  { name: 'dorico', degree: 2, steps: [0, 2, 3, 5, 7, 9, 10], color: 'Minore ma con la 6ª maggiore: minore senza tristezza, elegante. Il modo del jazz modale e di tanto folk.' },
  { name: 'frigio', degree: 3, steps: [0, 1, 3, 5, 7, 8, 10], color: 'Minore con la 2ª abbassata: quel semitono all\'inizio dà il colore spagnolo/flamenco.' },
  { name: 'lidio', degree: 4, steps: [0, 2, 4, 6, 7, 9, 11], color: 'Maggiore con la 4ª alzata: sospeso, luminoso, "da colonna sonora".' },
  { name: 'misolidio', degree: 5, steps: [0, 2, 4, 5, 7, 9, 10], color: 'Maggiore con la 7ª abbassata: è il modo dell\'accordo di dominante, quindi di blues e rock.' },
  { name: 'eolio', degree: 6, steps: [0, 2, 3, 5, 7, 8, 10], color: 'È la minore naturale. Il minore per antonomasia.' },
  { name: 'locrio', degree: 7, steps: [0, 1, 3, 5, 6, 8, 10], color: 'Ha la quinta diminuita: instabile, quasi inutilizzabile come centro. Più teorico che pratico.' },
];

export type OtherScale = 'pentatonica maggiore' | 'pentatonica minore' | 'blues' | 'cromatica';

const OTHER_STEPS: Record<OtherScale, number[]> = {
  'pentatonica maggiore': [0, 2, 4, 7, 9],
  'pentatonica minore': [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  cromatica: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export const OTHER_EXPLAIN: Record<OtherScale, string> = {
  'pentatonica maggiore':
    'La maggiore senza il 4° e il 7° grado, cioè senza le due note che creano attrito. Restano cinque note che stanno bene con tutto: per questo è la prima scala per improvvisare.',
  'pentatonica minore':
    'Cinque note ricavate dalla minore togliendo 2ª e 6ª. È la scala del rock e del blues: i cinque tasti NERI del pianoforte, suonati da Mi♭ a Mi♭, sono già una pentatonica minore pronta (partendo invece da Fa♯ gli stessi tasti danno la pentatonica maggiore).',
  blues:
    'La pentatonica minore più la "blue note" (♭5): una nota che non appartiene alla tonalità e che proprio per questo dà il carattere. Va usata di passaggio, non per fermarcisi.',
  cromatica:
    'Tutti e dodici i semitoni. Non ha una tonalità: serve come passaggio, come esercizio di indipendenza delle dita e per capire la tastiera.',
};

/** Un modo costruito sulla sua tonica. */
export function buildMode(root: string, mode: ModeName, octaves = 1): string[] {
  const spec = MODES.find(m => m.name === mode);
  const steps = spec ? spec.steps : MODES[0].steps;
  return fromSteps(root, steps, octaves);
}

export function buildOtherScale(root: string, scale: OtherScale, octaves = 1): string[] {
  return fromSteps(root, OTHER_STEPS[scale], octaves, scale === 'cromatica');
}

/** Costruisce una scala da una formula di semitoni. */
function fromSteps(root: string, steps: number[], octaves: number, chromatic = false): string[] {
  const { letter } = parseNote(root);
  const rootLetter = LETTERS.indexOf(letter as (typeof LETTERS)[number]);
  const out: string[] = [];
  for (let o = 0; o < octaves; o++) {
    steps.forEach((semi, i) => {
      // Nella cromatica le lettere non bastano: si scrive coi diesis, che è la
      // convenzione in salita.
      if (chromatic) {
        const midi = midiOf(root) + semi + 12 * o;
        out.push(noteFromMidi(midi));
      } else {
        out.push(spellAbove(rootLetter + letterStepFor(steps, i), semi + 12 * o, root));
      }
    });
  }
  const topMidi = midiOf(root) + 12 * octaves;
  out.push(chromatic ? noteFromMidi(topMidi) : spellAbove(rootLetter, 12 * octaves, root));
  return out;
}

/**
 * Quale lettera tocca a ogni grado. Per le scale a sette note è una lettera per
 * grado; per le pentatoniche si sceglie la lettera più vicina all'altezza, che
 * è come si scrivono davvero.
 */
function letterStepFor(steps: number[], i: number): number {
  if (steps.length === 7) return i;
  const approx = [0, 1, 2, 3, 4, 5, 6];
  return approx[Math.round((steps[i] / 12) * 7)] ?? i;
}
