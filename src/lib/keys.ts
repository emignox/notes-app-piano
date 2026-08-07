// ─────────────────────────────────────────────────────────────────────────────
// Tonalità: circolo delle quinte, armature, accordi di una tonalità e
// progressioni in numeri romani.
//
// Tutto è calcolato, non elencato: da qui vengono le 12 tonalità maggiori e le
// 12 minori senza scrivere a mano 24 tabelle che poi divergono.
// ─────────────────────────────────────────────────────────────────────────────

import { buildChord, buildScale } from './harmony';
import type { ChordQuality } from './harmony';
import { italianOf, parseNote } from './notes';

/** Il circolo, dal Do e in senso orario (quinte in su). */
export const CIRCLE_SHARP = ['C', 'G', 'D', 'A', 'E', 'B', 'F#'] as const;
/** In senso antiorario (quarte in su): il lato dei bemolli. */
export const CIRCLE_FLAT = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'] as const;

const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

export interface KeyInfo {
  /** Tonica senza ottava: "C", "F#", "Bb". */
  tonic: string;
  mode: 'maggiore' | 'minore';
  /** Numero di alterazioni in armatura (positivo diesis, negativo bemolli). */
  accidentals: number;
  /** Le alterazioni in ordine di armatura: ["F#", "C#"]. */
  signature: string[];
  /** La relativa: minore di una maggiore e viceversa. */
  relative: string;
  label: string;
}

const MAJOR_ACCIDENTALS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
};

const RELATIVE_MINOR: Record<string, string> = {
  C: 'A', G: 'E', D: 'B', A: 'F#', E: 'C#', B: 'G#', 'F#': 'D#', 'C#': 'A#',
  F: 'D', Bb: 'G', Eb: 'C', Ab: 'F', Db: 'Bb', Gb: 'Eb', Cb: 'Ab',
};

export function keyInfo(tonic: string, mode: 'maggiore' | 'minore' = 'maggiore'): KeyInfo {
  const major = mode === 'maggiore'
    ? tonic
    : (Object.entries(RELATIVE_MINOR).find(([, m]) => m === tonic)?.[0] ?? 'C');
  const n = MAJOR_ACCIDENTALS[major] ?? 0;
  const signature =
    n > 0
      ? SHARP_ORDER.slice(0, n).map(l => `${l}#`)
      : FLAT_ORDER.slice(0, -n).map(l => `${l}b`);
  return {
    tonic,
    mode,
    accidentals: n,
    signature,
    relative: mode === 'maggiore' ? RELATIVE_MINOR[major] ?? 'A' : major,
    label: `${italianOf(tonic)} ${mode}`,
  };
}

/** Come si legge l'armatura a voce: "2 diesis (Fa♯, Do♯)". */
export function signatureText(info: KeyInfo): string {
  if (info.accidentals === 0) return 'nessuna alterazione';
  const names = info.signature.map(s => italianOf(s)).join(', ');
  const n = Math.abs(info.accidentals);
  const word = info.accidentals > 0 ? 'diesis' : n === 1 ? 'bemolle' : 'bemolli';
  return `${n} ${word} (${names})`;
}

// ── Accordi di una tonalità ─────────────────────────────────────────────────

/** Qualità dei sette gradi, in maggiore e in minore naturale. */
const DEGREE_TRIADS: Record<'maggiore' | 'minore', ChordQuality[]> = {
  maggiore: ['maggiore', 'minore', 'minore', 'maggiore', 'maggiore', 'minore', 'diminuito'],
  minore: ['minore', 'diminuito', 'maggiore', 'minore', 'minore', 'maggiore', 'maggiore'],
};

const DEGREE_SEVENTHS: Record<'maggiore' | 'minore', ChordQuality[]> = {
  maggiore: [
    'settima maggiore', 'settima minore', 'settima minore', 'settima maggiore',
    'settima di dominante', 'settima minore', 'semidiminuito',
  ],
  minore: [
    'settima minore', 'semidiminuito', 'settima maggiore', 'settima minore',
    'settima minore', 'settima maggiore', 'settima di dominante',
  ],
};

// Il numero romano dice il GRADO (maiuscolo = accordo maggiore, minuscolo =
// minore); il simbolo dopo dice la qualità. Vanno tenuti separati, altrimenti
// esce roba come "vii°7" per un semidiminuito, che è un'altra cosa.
const ROMAN_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'];
const ROMAN_MINOR = ['i', 'ii', 'III', 'iv', 'v', 'VI', 'VII'];

/** Il suffisso che si scrive dopo il numero romano, per ogni qualità. */
const ROMAN_SUFFIX: Record<ChordQuality, string> = {
  maggiore: '',
  minore: '',
  diminuito: '°',
  aumentato: '+',
  'settima di dominante': '7',
  'settima maggiore': 'maj7',
  'settima minore': '7',
  semidiminuito: 'ø7',
  'settima diminuita': '°7',
};

export interface DegreeChord {
  degree: number;
  roman: string;
  root: string;
  quality: ChordQuality;
  notes: string[];
  /** A cosa serve quel grado: la funzione armonica. */
  role: string;
}

const ROLES_MAJOR = [
  'tonica: la casa, il punto di riposo',
  'sottodominante: prepara la dominante (è il "due" del II-V-I)',
  'mediante: colore fra tonica e dominante, poco usato da solo',
  'sottodominante: si allontana da casa senza tensione',
  'dominante: crea tensione e chiede di tornare alla tonica',
  'relativa minore: stessa aria della tonica, in ombra',
  'sensibile: instabile, quasi sempre di passaggio',
];

const ROLES_MINOR = [
  'tonica: la casa, qui in minore',
  'sottodominante instabile: ha la quinta diminuita, apre il II-V-I minore',
  'relativa maggiore: le stesse note della tonica, ma in luce',
  'sottodominante: si allontana da casa senza tensione',
  'dominante debole: qui è minore e non "tira"; con la 7ª della minore armonica diventa V maggiore',
  'il grado della cadenza d\'inganno: V → VI invece di V → i',
  'sottotonica: sta un TONO sotto la tonica, quindi non è una sensibile',
];

/** I sette accordi che si formano su una scala, con la loro funzione. */
export function diatonicChords(
  tonic: string,
  mode: 'maggiore' | 'minore' = 'maggiore',
  sevenths = false,
  octave = 4,
): DegreeChord[] {
  const scale = buildScale(`${tonic}${octave}`, mode === 'maggiore' ? 'maggiore' : 'minore naturale', 1);
  const qualities = sevenths ? DEGREE_SEVENTHS[mode] : DEGREE_TRIADS[mode];
  const romans = mode === 'maggiore' ? ROMAN_MAJOR : ROMAN_MINOR;
  return qualities.map((quality, i) => {
    const root = scale[i];
    const { letter, acc } = parseNote(root);
    return {
      degree: i + 1,
      roman: `${romans[i]}${ROMAN_SUFFIX[quality]}`,
      root: `${letter}${acc}`,
      quality,
      notes: buildChord(root, quality),
      role: mode === 'maggiore' ? ROLES_MAJOR[i] : ROLES_MINOR[i],
    };
  });
}

// ── Progressioni ────────────────────────────────────────────────────────────

export interface Progression {
  id: string;
  name: string;
  /** Gradi come numeri (1 = I). Il modo decide se maggiore o minore. */
  degrees: number[];
  mode: 'maggiore' | 'minore';
  sevenths?: boolean;
  roman: string;
  why: string;
  where: string;
}

export const PROGRESSIONS: Progression[] = [
  {
    id: 'i-iv-v',
    name: 'Giro base',
    degrees: [1, 4, 5, 1],
    mode: 'maggiore',
    roman: 'I – IV – V – I',
    why:
      'I tre accordi che contengono, fra tutti e tre, le sette note della scala: con questi tre si armonizza qualsiasi melodia in tonalità. Il V crea tensione, il I la scioglie.',
    where: 'Metà delle canzoni popolari, tutto il rock\'n\'roll, quasi ogni canto tradizionale.',
  },
  {
    id: 'i-v-vi-iv',
    name: 'Giro pop',
    degrees: [1, 5, 6, 4],
    mode: 'maggiore',
    roman: 'I – V – vi – IV',
    why:
      'Aggiunge la relativa minore (vi) al giro base: dà un momento di ombra prima di riaprire sul IV. È il motivo per cui suona "emotivo" senza essere triste.',
    where: 'Da "Let It Be" a mezza classifica degli ultimi trent\'anni.',
  },
  {
    id: 'ii-v-i',
    name: 'II – V – I',
    degrees: [2, 5, 1],
    mode: 'maggiore',
    sevenths: true,
    roman: 'ii7 – V7 – Imaj7',
    why:
      'La cadenza più forte che esista: il ii prepara, il V7 carica la tensione (ha il tritono), il I la risolve. Le voci si muovono di pochissimo fra un accordo e l\'altro — per questo suona così liscia.',
    where: 'La cellula fondamentale del jazz: gran parte degli standard sono catene di II-V-I.',
  },
  {
    id: 'blues',
    name: 'Giro di blues (12 battute)',
    degrees: [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5],
    mode: 'maggiore',
    sevenths: true,
    roman: 'I7 I7 I7 I7 | IV7 IV7 I7 I7 | V7 IV7 I7 V7',
    why:
      'Dodici battute, tre accordi, tutti di settima di dominante — anche il I, che in teoria "non potrebbe". È proprio quella tensione mai risolta a dare il suono blues.',
    where: 'Blues, rock, boogie: uno schema che si suona in tutto il mondo senza bisogno di parlarsi.',
  },
  {
    id: 'i-vi-ii-v',
    name: 'Anatole',
    degrees: [1, 6, 2, 5],
    mode: 'maggiore',
    sevenths: true,
    roman: 'Imaj7 – vi7 – ii7 – V7',
    why:
      'Dal vi in poi ogni accordo scende di una quinta verso il successivo (vi → ii → V → I): è il "giro delle quinte" in miniatura, e per questo torna sempre al punto di partenza. Si può ripetere all\'infinito senza che l\'orecchio si stanchi.',
    where: '"Rhythm changes", standard jazz, doo-wop anni Cinquanta.',
  },
];

/** Gli accordi veri di una progressione in una tonalità data. */
export function realize(prog: Progression, tonic: string, octave = 4): DegreeChord[] {
  const chords = diatonicChords(tonic, prog.mode, prog.sevenths ?? false, octave);
  const out = prog.degrees.map(d => chords[d - 1]);
  // Nel blues anche il I e il IV sono di settima di dominante: è la sua firma.
  if (prog.id === 'blues') {
    return out.map(c => ({
      ...c,
      quality: 'settima di dominante' as ChordQuality,
      notes: buildChord(`${c.root}${octave}`, 'settima di dominante'),
      // Si tiene solo il numero romano e ci si rimette il 7: "Imaj7" → "I7".
      roman: `${c.roman.replace(/[^IViv]/g, '')}7`,
    }));
  }
  return out;
}
