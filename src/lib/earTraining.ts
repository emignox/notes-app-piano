// ─────────────────────────────────────────────────────────────────────────────
// Allenamento dell'orecchio.
//
// Suonare Chopin non è premere i tasti giusti: è sentire PRIMA come deve
// suonare la frase, e accorgersi subito quando non suona così. L'orecchio si
// allena come la lettura: poco alla volta, un elemento nuovo per livello, e
// con il confronto — quando sbagli senti la tua risposta accanto a quella
// giusta, perché è la differenza fra le due che si impara.
//
// Ogni esercizio sale di livello da solo: 8 risposte giuste sulle ultime 10.
// ─────────────────────────────────────────────────────────────────────────────

import type { ChordQuality, ScaleType } from './harmony';
import { buildChord, buildScale } from './harmony';
import { italianOf, midiOf, noteFromMidi } from './notes';
import type { RhythmPattern } from './rhythmReading';
import { generatePattern, lengthInBeats } from './rhythmReading';

export type EarDrillId = 'intervalli' | 'triadi' | 'settime' | 'scale' | 'melodia' | 'ritmo';

export interface EarDrill {
  id: EarDrillId;
  title: string;
  emoji: string;
  /** A cosa serve, in una riga. */
  why: string;
  levels: string[];
}

export const EAR_DRILLS: EarDrill[] = [
  {
    id: 'intervalli',
    title: 'Intervalli',
    emoji: '↕️',
    why: 'La distanza fra due note: è con questa che si sente una melodia.',
    levels: ['terza M, quinta, ottava', '+ terza m e quarta', '+ seconde e sesta M', '+ tritono e settima m, anche discendenti', 'tutti, anche suonati insieme'],
  },
  {
    id: 'triadi',
    title: 'Maggiore o minore',
    emoji: '☯️',
    why: 'Il carattere di un accordo: luminoso, in ombra, instabile, sospeso.',
    levels: ['maggiore / minore', '+ diminuito', '+ aumentato', 'tutti, in rivolto'],
  },
  {
    id: 'settime',
    title: 'Accordi di settima',
    emoji: '🎷',
    why: 'Riposo o tensione: sono le settime a dire dove va l\'armonia.',
    levels: ['maj7 / 7', '+ m7', '+ semidiminuito e dim7'],
  },
  {
    id: 'scale',
    title: 'Scale',
    emoji: '🪜',
    why: 'Maggiore e le tre minori: il colore di un intero brano.',
    levels: ['maggiore / minore naturale', '+ minore armonica', '+ minore melodica'],
  },
  {
    id: 'melodia',
    title: 'Dettato melodico',
    emoji: '🎶',
    why: 'Senti una frase e la ritrovi sulla tastiera: suonare a orecchio.',
    levels: ['3 note per grado congiunto', '4 note con terze', '5 note con salti', '5 note in minore'],
  },
  {
    id: 'ritmo',
    title: 'Dettato ritmico',
    emoji: '🥁',
    why: 'Senti un ritmo e riconosci come si scrive.',
    levels: ['semiminime e minime', '+ pause', '+ crome', '+ punto', '+ controtempo', '+ semicrome'],
  },
];

export function drillById(id: EarDrillId): EarDrill {
  return EAR_DRILLS.find(d => d.id === id) ?? EAR_DRILLS[0];
}

// ── Domande ─────────────────────────────────────────────────────────────────

/** Cosa far sentire. */
export type Sound =
  | { kind: 'melodic'; notes: string[]; secs?: number }
  | { kind: 'together'; notes: string[] }
  | { kind: 'rhythm'; pattern: RhythmPattern };

export interface EarChoice {
  label: string;
  correct: boolean;
  /** Per il confronto dopo l'errore: come suona QUESTA risposta. */
  sound?: Sound;
  /** Per il dettato ritmico: la figura da mostrare. */
  pattern?: RhythmPattern;
}

export interface EarQuestion {
  prompt: string;
  sound: Sound;
  choices: EarChoice[];
  /** Dettato melodico: le note da ritrovare (la prima è data). */
  answer?: string[];
  /** Una riga che aiuta a ricordare, mostrata dopo la risposta. */
  tip?: string;
}

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const INTERVAL_LABEL: Record<number, string> = {
  1: 'seconda minore', 2: 'seconda maggiore', 3: 'terza minore', 4: 'terza maggiore', 5: 'quarta giusta',
  6: 'tritono', 7: 'quinta giusta', 8: 'sesta minore', 9: 'sesta maggiore', 10: 'settima minore',
  11: 'settima maggiore', 12: 'ottava',
};

/** Canzoni che cominciano con l'intervallo (salendo): il modo più veloce di riconoscerlo. */
const INTERVAL_SONG: Record<number, string> = {
  1: '"Lo squalo": due note che si avvicinano minacciose.',
  2: '"Fra Martino": Fra-Mar…',
  3: '"Greensleeves": l\'attacco malinconico.',
  4: '"Oh when the saints": Oh-when…',
  5: 'la marcia nuziale di Wagner: Ecco la sposa…',
  6: 'la sigla dei Simpson: The Simp-sons.',
  7: '"Brilla brilla stellina": il salto fra Bril-la e bril-la.',
  9: '"My Bonnie": My-Bon…',
  10: 'la sigla di Star Trek (quella originale).',
  12: '"Over the rainbow": Some-where.',
};

const INTERVAL_SETS = [[4, 7, 12], [3, 4, 5, 7, 12], [2, 3, 4, 5, 7, 9, 12], [1, 2, 3, 4, 5, 6, 7, 9, 10, 12], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]];
const TRIAD_SETS: ChordQuality[][] = [['maggiore', 'minore'], ['maggiore', 'minore', 'diminuito'], ['maggiore', 'minore', 'diminuito', 'aumentato'], ['maggiore', 'minore', 'diminuito', 'aumentato']];
const SEVENTH_SETS: ChordQuality[][] = [
  ['settima maggiore', 'settima di dominante'],
  ['settima maggiore', 'settima di dominante', 'settima minore'],
  ['settima maggiore', 'settima di dominante', 'settima minore', 'semidiminuito', 'settima diminuita'],
];
const SCALE_SETS: ScaleType[][] = [['maggiore', 'minore naturale'], ['maggiore', 'minore naturale', 'minore armonica'], ['maggiore', 'minore naturale', 'minore armonica', 'minore melodica']];

const CHORD_TIP: Partial<Record<ChordQuality, string>> = {
  maggiore: 'Maggiore: aperto, luminoso, "a casa".',
  minore: 'Minore: in ombra. È solo la terza, più bassa di un semitono.',
  diminuito: 'Diminuito: stretto, teso, vuole muoversi.',
  aumentato: 'Aumentato: sospeso, come una domanda senza risposta.',
  'settima maggiore': 'maj7: morbido, sognante, nessuna fretta.',
  'settima di dominante': '7: tensione che chiede di risolvere su un accordo una quinta sotto.',
  'settima minore': 'm7: pacato, rotondo.',
  semidiminuito: 'm7♭5: instabile ma elegante, prepara il dominante in minore.',
  'settima diminuita': 'dim7: drammatico, simmetrico: nei pezzi romantici arriva nei momenti di massima tensione.',
};

/** Una tonica comoda da ascoltare: fra Sol3 e Fa4. */
const roots = (): string => noteFromMidi(55 + Math.floor(Math.random() * 11));

function intervalQuestion(level: number): EarQuestion {
  const set = INTERVAL_SETS[Math.min(level, INTERVAL_SETS.length) - 1];
  const semis = pick(set);
  const base = midiOf(roots());
  const mode = level >= 5 ? pick(['su', 'giù', 'insieme'] as const) : level >= 4 ? pick(['su', 'giù'] as const) : 'su';
  const make = (s: number): Sound => {
    const a = noteFromMidi(base);
    const b = noteFromMidi(mode === 'giù' ? base - s : base + s);
    return mode === 'insieme' ? { kind: 'together', notes: [a, b] } : { kind: 'melodic', notes: [a, b], secs: 0.75 };
  };
  return {
    prompt: mode === 'insieme' ? 'Due note insieme: che intervallo è?' : `Due note, ${mode === 'su' ? 'la seconda più acuta' : 'la seconda più grave'}: che intervallo è?`,
    sound: make(semis),
    choices: shuffle(set.map(s => ({ label: INTERVAL_LABEL[s], correct: s === semis, sound: make(s) }))),
    tip: INTERVAL_SONG[semis] ? `Per ricordarla: ${INTERVAL_SONG[semis]}` : undefined,
  };
}

function chordQuestion(sets: ChordQuality[][], level: number, title: string): EarQuestion {
  const set = sets[Math.min(level, sets.length) - 1];
  const quality = pick(set);
  const root = roots();
  const inversion = sets === TRIAD_SETS && level >= 4 ? Math.floor(Math.random() * 3) : 0;
  const voice = (q: ChordQuality): Sound => {
    let notes = buildChord(root, q);
    for (let i = 0; i < inversion; i++) notes = [...notes.slice(1), noteFromMidi(midiOf(notes[0]) + 12)];
    return { kind: 'together', notes };
  };
  return {
    prompt: title,
    sound: voice(quality),
    choices: shuffle(set.map(q => ({ label: q, correct: q === quality, sound: voice(q) }))),
    tip: CHORD_TIP[quality],
  };
}

function scaleQuestion(level: number): EarQuestion {
  const set = SCALE_SETS[Math.min(level, SCALE_SETS.length) - 1];
  const type = pick(set);
  const root = noteFromMidi(57 + Math.floor(Math.random() * 6));
  const sound = (t: ScaleType): Sound => ({ kind: 'melodic', notes: [...buildScale(root, t), noteFromMidi(midiOf(root) + 12)], secs: 0.32 });
  const tips: Record<ScaleType, string> = {
    maggiore: 'Maggiore: la terza è alta, tutto sorride.',
    'minore naturale': 'Minore naturale: terza, sesta e settima basse; arriva in cima senza spinta.',
    'minore armonica': 'Armonica: la settima alzata crea un salto di un tono e mezzo, dal sapore "orientale".',
    'minore melodica': 'Melodica (salendo): comincia minore e finisce come una maggiore.',
  };
  return {
    prompt: 'Che scala è?',
    sound: sound(type),
    choices: shuffle(set.map(t => ({ label: t, correct: t === type, sound: sound(t) }))),
    tip: tips[type],
  };
}

/** Frasi brevi dentro una scala, sempre a partire dalla tonica (data). */
function melodyQuestion(level: number): EarQuestion {
  const minor = level >= 4;
  const scale = minor
    ? ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G#4', 'A4', 'B4', 'C5']
    : ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
  const length = level === 1 ? 3 : level === 2 ? 4 : 5;
  const maxJump = level === 1 ? 1 : level === 2 ? 2 : 4;
  const span = level === 1 ? 4 : 8;
  let idx = 0;
  const steps = [0];
  for (let i = 1; i < length; i++) {
    const options: number[] = [];
    for (let d = -maxJump; d <= maxJump; d++) {
      const next = idx + d;
      if (d !== 0 && next >= 0 && next <= span) options.push(next);
    }
    idx = pick(options);
    steps.push(idx);
  }
  const notes = steps.map(s => scale[s]);
  return {
    prompt: `Ritrova la frase sulla tastiera. Comincia da ${italianOf(notes[0])}${minor ? ' (la minore)' : ''}.`,
    sound: { kind: 'melodic', notes, secs: 0.6 },
    choices: [],
    answer: notes,
    tip: 'Canta la frase a bassa voce prima di cercarla: se la sai cantare, la trovi.',
  };
}

function rhythmQuestion(level: number): EarQuestion {
  const target = generatePattern(level, 1);
  const key = (p: RhythmPattern) => p.flat().map(i => `${i.dur}${i.rest ? 'r' : ''}`).join(' ');
  const others: RhythmPattern[] = [];
  for (let guard = 0; others.length < 2 && guard < 60; guard++) {
    const p = generatePattern(level, 1);
    if (key(p) !== key(target) && !others.some(o => key(o) === key(p))) others.push(p);
  }
  const choices: EarChoice[] = [
    { label: '', correct: true, pattern: target, sound: { kind: 'rhythm', pattern: target } },
    ...others.map((p): EarChoice => ({ label: '', correct: false, pattern: p, sound: { kind: 'rhythm', pattern: p } })),
  ];
  return {
    prompt: 'Quale di queste figure hai sentito?',
    sound: { kind: 'rhythm', pattern: target },
    choices: shuffle(choices).map((c, i) => ({ ...c, label: String.fromCharCode(65 + i) })),
    tip: 'Conta "1 e 2 e 3 e 4 e" mentre ascolti: ogni nota cade su un numero o su una "e".',
  };
}

export function makeQuestion(drill: EarDrillId, level: number): EarQuestion {
  switch (drill) {
    case 'intervalli': return intervalQuestion(level);
    case 'triadi': return chordQuestion(TRIAD_SETS, level, 'Che accordo è?');
    case 'settime': return chordQuestion(SEVENTH_SETS, level, 'Che accordo di settima è?');
    case 'scale': return scaleQuestion(level);
    case 'melodia': return melodyQuestion(level);
    case 'ritmo': return rhythmQuestion(level);
  }
}

/** Durata in secondi di un suono, per sapere quanto tenere sordo il microfono. */
export function soundLength(sound: Sound, bpm = 80): number {
  if (sound.kind === 'together') return 2;
  if (sound.kind === 'melodic') return sound.notes.length * (sound.secs ?? 0.6) + 1;
  return (lengthInBeats(sound.pattern) + 4) * (60 / bpm) + 1;
}

// ── Livelli ─────────────────────────────────────────────────────────────────

export interface EarProgress {
  level: number;
  /** Esiti delle ultime risposte a questo livello (al massimo 10). */
  recent: boolean[];
  correct: number;
  total: number;
}

export const EAR_START: EarProgress = { level: 1, recent: [], correct: 0, total: 0 };

/** Aggiorna dopo una risposta: sale con 8/10, scende se le ultime 6 vanno quasi tutte storte. */
export function nextEarProgress(p: EarProgress, correct: boolean, maxLevel: number): EarProgress {
  const recent = [...p.recent, correct].slice(-10);
  const base = { ...p, recent, correct: p.correct + (correct ? 1 : 0), total: p.total + 1 };
  const ok = recent.filter(Boolean).length;
  if (recent.length >= 10 && ok >= 8 && p.level < maxLevel) return { ...base, level: p.level + 1, recent: [] };
  const last6 = recent.slice(-6);
  if (last6.length === 6 && last6.filter(Boolean).length <= 2 && p.level > 1) return { ...base, level: p.level - 1, recent: [] };
  return base;
}
