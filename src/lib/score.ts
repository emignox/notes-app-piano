// ─────────────────────────────────────────────────────────────────────────────
// Il "motore" di uno spartito: tutto ciò che sta fra i dati di un pezzo e il
// modo in cui va disegnato o suonato.
//
// Tre idee tengono in piedi il file:
//
//  1. Le BATTUTE non si scrivono a mano, si calcolano. Il pezzo dichiara il
//     metro (e l'eventuale levare) e le stanghette cadono dove devono. Così una
//     battuta non può risultare "storta" per una svista, e il validatore se ne
//     accorge subito.
//
//  2. La LEGATURA DI VALORE è una cosa sola con l'esecuzione: la nota legata
//     non si ribatte, quindi non si suona una seconda volta e non viene
//     richiesta all'utente. È la stessa nota che continua.
//
//  3. La LEGATURA DI FRASE e le dinamiche non cambiano le note, cambiano il
//     TEMPO IN CUI RESTANO GIÙ e la FORZA con cui partono. Vivono in
//     `buildPerformance`, che traduce lo spartito in eventi sonori — è quello
//     che fa la differenza fra un ascolto meccanico e uno che sembra suonato.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Articulation,
  Dynamic,
  Hand,
  HandMarks,
  Piece,
  PieceStep,
  StepDuration,
} from '../types';

// ── Durate ──────────────────────────────────────────────────────────────────

/** Durata in movimenti (semiminima = 1), punto compreso. */
export const DURATION_BEATS: Record<StepDuration, number> = {
  w: 4, wd: 6,
  h: 2, hd: 3,
  q: 1, qd: 1.5,
  '8': 0.5, '8d': 0.75,
  '16': 0.25,
};

/** Scompone la durata nel formato di VexFlow: figura + numero di punti. */
export function vexDuration(d: StepDuration): { base: string; dots: number } {
  return d.endsWith('d') ? { base: d.slice(0, -1), dots: 1 } : { base: d, dots: 0 };
}

// ── Metro ───────────────────────────────────────────────────────────────────

export interface MeterInfo {
  num: number;
  den: number;
  /** Durata della battuta in movimenti da semiminima. */
  barBeats: number;
  label: string;
}

export function meterInfo(meter: string): MeterInfo {
  const [a, b] = meter.split('/');
  const num = Number(a) || 4;
  const den = Number(b) || 4;
  return { num, den, barBeats: (num * 4) / den, label: meter };
}

export interface Measure {
  /** Indici dei passi che stanno in questa battuta. */
  indices: number[];
  /** Numero di battuta (il levare è la 0). */
  number: number;
  /** Battuta incompleta d'inizio. */
  pickup: boolean;
  beats: number;
}

/**
 * Divide i passi in battute secondo il metro. Una nota che sfora la stanghetta
 * resta comunque nella battuta in cui è cominciata: il validatore segnala il
 * caso, qui non si perde nulla.
 */
export function splitMeasures(piece: Piece): Measure[] {
  const { barBeats } = meterInfo(piece.meter);
  const measures: Measure[] = [];
  let current: Measure = {
    indices: [],
    number: piece.pickup ? 0 : 1,
    pickup: !!piece.pickup,
    beats: 0,
  };
  let capacity = piece.pickup || barBeats;

  piece.steps.forEach((step, i) => {
    current.indices.push(i);
    current.beats += step.beats;
    if (current.beats >= capacity - 1e-6) {
      measures.push(current);
      capacity = barBeats;
      current = { indices: [], number: current.number + 1, pickup: false, beats: 0 };
    }
  });

  if (current.indices.length > 0) measures.push(current);
  return measures;
}

// ── Mani ────────────────────────────────────────────────────────────────────

export type SingleHand = 'right' | 'left';

export const notesOf = (step: PieceStep, hand: SingleHand): string[] =>
  hand === 'right' ? step.treble : step.bass;

export const marksOf = (step: PieceStep, hand: SingleHand): HandMarks | undefined =>
  hand === 'right' ? step.r : step.l;

/**
 * Il passo `i` è la CONTINUAZIONE di una legatura di valore? In tal caso la
 * nota è già suonata e già premuta: non va né ribattuta né richiesta.
 */
export function isTiedInto(steps: PieceStep[], i: number, hand: SingleHand): boolean {
  const prev = steps[i - 1];
  if (!prev || !marksOf(prev, hand)?.tie) return false;
  const here = notesOf(steps[i], hand);
  const before = notesOf(prev, hand);
  return here.length > 0 && before.length > 0;
}

/**
 * Le note che l'utente deve davvero premere in questo passo: quelle tenute da
 * una legatura di valore sono già sotto le dita.
 */
export function requiredNotes(steps: PieceStep[], i: number, hand: Hand): string[] {
  const step = steps[i];
  if (!step) return [];
  const forHand = (h: SingleHand) => (isTiedInto(steps, i, h) ? [] : notesOf(step, h));
  if (hand === 'right') return forHand('right');
  if (hand === 'left') return forHand('left');
  return [...forHand('right'), ...forHand('left')];
}

/** Il passo esiste ma è tutto legato dal precedente: si scorre da solo. */
export function isFullyTied(steps: PieceStep[], i: number, hand: Hand): boolean {
  const step = steps[i];
  if (!step) return false;
  const played = hand === 'right' ? step.treble : hand === 'left' ? step.bass
    : [...step.treble, ...step.bass];
  return played.length > 0 && requiredNotes(steps, i, hand).length === 0;
}

// ── Legature di frase ───────────────────────────────────────────────────────

/**
 * Le legature da disegnare, come coppie di indici. Una serie di passi marcati
 * `leg` produce un unico arco che arriva fino alla prima nota NON marcata: è
 * così che si legge una legatura, l'ultima nota è compresa.
 */
export function slurRuns(steps: PieceStep[], hand: SingleHand): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  steps.forEach((step, i) => {
    const leg = !!marksOf(step, hand)?.leg;
    const sounds = notesOf(step, hand).length > 0;
    if (leg && sounds) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      // La legatura si chiude sulla nota successiva se questa suona ancora.
      runs.push([start, sounds ? i : i - 1]);
      start = -1;
    }
  });
  if (start >= 0) runs.push([start, steps.length - 1]);
  return runs.filter(([a, b]) => b > a);
}

/** Le legature di valore da disegnare: coppie (passo, passo seguente). */
export function tiePairs(steps: PieceStep[], hand: SingleHand): [number, number][] {
  const pairs: [number, number][] = [];
  steps.forEach((step, i) => {
    if (marksOf(step, hand)?.tie && steps[i + 1] && notesOf(steps[i + 1], hand).length > 0) {
      pairs.push([i, i + 1]);
    }
  });
  return pairs;
}

// ── Dinamiche ───────────────────────────────────────────────────────────────

/** Quanto forte parte la nota, da 0 a 1. Scala d'ascolto, non fisica. */
const DYNAMIC_LEVEL: Record<Dynamic, number> = {
  pp: 0.22, p: 0.36, mp: 0.5, mf: 0.62, f: 0.78, ff: 0.94, sf: 1,
};

export const DYNAMIC_LABEL: Record<Dynamic, string> = {
  pp: 'pianissimo — molto piano',
  p: 'piano',
  mp: 'mezzopiano',
  mf: 'mezzoforte',
  f: 'forte',
  ff: 'fortissimo',
  sf: 'sforzato — un colpo solo',
};

/**
 * La curva delle dinamiche passo per passo. Le forcelle vengono interpolate
 * fino al segno che le chiude: è ciò che rende un crescendo un crescendo e non
 * un gradino.
 */
export function dynamicCurve(steps: PieceStep[]): number[] {
  const level = new Array<number>(steps.length);
  let current = DYNAMIC_LEVEL.mf;

  // Primo giro: i livelli espliciti.
  steps.forEach((step, i) => {
    if (step.dyn) current = DYNAMIC_LEVEL[step.dyn];
    level[i] = current;
  });

  // Secondo giro: le forcelle scavalcano i livelli fissi nel loro tratto.
  for (let i = 0; i < steps.length; i++) {
    const hair = steps[i].hair;
    if (hair !== 'cresc' && hair !== 'dim') continue;
    let end = steps.length - 1;
    for (let j = i + 1; j < steps.length; j++) {
      if (steps[j].dyn || steps[j].hair) { end = j; break; }
    }
    const from = level[i];
    const arrival = steps[end].dyn;
    // Senza un segno d'arrivo la forcella vale un gradino di dinamica.
    const to = arrival
      ? DYNAMIC_LEVEL[arrival]
      : Math.min(1, Math.max(0.15, from + (hair === 'cresc' ? 0.22 : -0.22)));
    const span = Math.max(1, end - i);
    for (let j = i; j <= end; j++) {
      level[j] = from + ((to - from) * (j - i)) / span;
    }
    i = end - 1;
  }

  return level.map(v => Math.min(1, Math.max(0.12, v)));
}

// ── Articolazione → durata reale ────────────────────────────────────────────

/**
 * Quanto della durata scritta la nota resta davvero premuta.
 * Il legato supera l'1: le note si sovrappongono appena, ed è esattamente
 * quello che si sente quando un pianista non stacca il dito.
 */
function holdRatio(art: Articulation | undefined, legato: boolean): number {
  switch (art) {
    case 'staccato': return 0.35;
    case 'marcato': return 0.55;
    case 'accent': return legato ? 1.0 : 0.85;
    case 'tenuto': return 1.0;
    case 'fermata': return 1.0;
    default: return legato ? 1.03 : 0.86;
  }
}

/** Quanto pesa l'attacco rispetto alla dinamica in corso. */
function accentBoost(art: Articulation | undefined): number {
  if (art === 'accent' || art === 'marcato') return 1.28;
  if (art === 'staccato') return 0.96;
  return 1;
}

/** La corona allunga il passo: qui di quanto. */
const FERMATA_STRETCH = 1.7;

// ── Dallo spartito al suono ─────────────────────────────────────────────────

export interface PerfEvent {
  notes: string[];
  /** Secondi dall'inizio dell'esecuzione. */
  at: number;
  /** Quanto tenere premuto, in secondi. */
  hold: number;
  velocity: number;
  stepIndex: number;
}

export interface Performance {
  events: PerfEvent[];
  /** Momento in cui inizia ogni passo: serve a muovere il cursore. */
  stepTimes: number[];
  totalSec: number;
}

/**
 * Traduce il pezzo in eventi sonori, per una mano o per tutte e due.
 *
 * Qui si concentra tutto ciò che rende un ascolto utile allo studio: le note
 * legate diventano un suono solo, lo staccato accorcia, il legato sovrappone,
 * le dinamiche cambiano forza, la corona allarga il tempo.
 */
export function buildPerformance(piece: Piece, hand: Hand, bpm: number): Performance {
  const { steps } = piece;
  const dyn = dynamicCurve(steps);
  const secPerBeat = 60 / Math.max(20, bpm);

  const hands: SingleHand[] =
    hand === 'right' ? ['right'] : hand === 'left' ? ['left'] : ['right', 'left'];

  // Durata reale di ogni passo: la corona è l'unica cosa che allarga il tempo.
  const stepSec = steps.map(st => {
    const hasFermata = st.r?.art === 'fermata' || st.l?.art === 'fermata';
    return st.beats * secPerBeat * (hasFermata ? FERMATA_STRETCH : 1);
  });

  const stepTimes: number[] = [];
  let t = 0;
  for (let i = 0; i < steps.length; i++) {
    stepTimes.push(t);
    t += stepSec[i];
  }
  const totalSec = t;

  const events: PerfEvent[] = [];

  for (const h of hands) {
    for (let i = 0; i < steps.length; i++) {
      const notes = notesOf(steps[i], h);
      if (notes.length === 0) continue;
      // Nota legata dal passo prima: fa parte del suono precedente, non si ribatte.
      if (isTiedInto(steps, i, h)) continue;

      // La legatura di valore può concatenarsi: si somma tutta la catena.
      let last = i;
      let sounding = stepSec[i];
      while (marksOf(steps[last], h)?.tie && steps[last + 1] && notesOf(steps[last + 1], h).length > 0) {
        last += 1;
        sounding += stepSec[last];
      }

      const marks = marksOf(steps[last], h);
      const ratio = holdRatio(marks?.art, !!marksOf(steps[i], h)?.leg);
      const velocity = Math.min(1, dyn[i] * accentBoost(marksOf(steps[i], h)?.art));

      events.push({
        notes,
        at: stepTimes[i],
        hold: Math.max(0.08, sounding * ratio),
        velocity,
        stepIndex: i,
      });
    }
  }

  events.sort((a, b) => a.at - b.at);
  return { events, stepTimes, totalSec };
}

// ── Indicazioni leggibili ───────────────────────────────────────────────────

export const ARTICULATION_LABEL: Record<Articulation, string> = {
  staccato: 'staccato — nota corta, staccata dal dito',
  accent: 'accento — attacca con più peso',
  tenuto: 'tenuto — tieni tutto il valore',
  marcato: 'marcato — corta ma pesante',
  fermata: 'corona — fermati e respira',
};

/** Cosa dire all'utente del passo corrente, in una riga. */
export function stepAdvice(steps: PieceStep[], i: number, hand: Hand): string | null {
  const step = steps[i];
  if (!step) return null;
  const bits: string[] = [];
  if (step.dyn) bits.push(DYNAMIC_LABEL[step.dyn]);
  if (step.hair === 'cresc') bits.push('crescendo');
  if (step.hair === 'dim') bits.push('diminuendo');
  if (step.text) bits.push(step.text);
  const marks = hand === 'left' ? step.l : step.r;
  if (marks?.art) bits.push(ARTICULATION_LABEL[marks.art]);
  else if (marks?.leg) bits.push('legato — non staccare il dito');
  if (step.ped === 'down') bits.push('pedale giù');
  if (step.ped === 'up') bits.push('pedale su');
  return bits.length > 0 ? bits.join(' · ') : null;
}

/** Tutte le note richieste da una mano, per dimensionare la tastiera. */
export function pieceNotes(piece: Piece, hand: SingleHand): string[] {
  return [...new Set(piece.steps.flatMap(st => notesOf(st, hand)))];
}
