// ─────────────────────────────────────────────────────────────────────────────
// Lettura ritmica: figure da leggere e battere a tempo.
//
// Leggere la musica è leggere DUE cose: quale nota e QUANDO. Il resto dell'app
// allena la prima; qui c'è la seconda. Si legge una figura di due battute, il
// metronomo conta una battuta a vuoto, e si batte (sullo schermo o con un
// tasto qualsiasi del piano). Ogni attacco viene misurato in millisecondi.
//
// Le figure si costruiscono a CELLULE, cioè a gruppi che occupano un
// movimento o due e che un musicista legge come un blocco ("ta – ti-ti"), non
// nota per nota. I livelli aggiungono una cellula nuova alla volta, nello
// stesso ordine delle lezioni di ritmo.
// ─────────────────────────────────────────────────────────────────────────────

/** Una figura della notazione: durata VexFlow, valore in movimenti, pausa o nota. */
export interface RhythmItem {
  /** 'w' 'h' 'q' '8' '16', con 'd' finale se puntata. */
  dur: string;
  beats: number;
  rest: boolean;
}

interface Cell {
  id: string;
  items: RhythmItem[];
  /** Su quali movimenti (0-3) può cominciare: le figure lunghe stanno sui tempi forti. */
  starts: number[];
  /** Quanto spesso esce, rispetto alle altre del livello. */
  weight: number;
}

const n = (dur: string, beats: number): RhythmItem => ({ dur, beats, rest: false });
const r = (dur: string, beats: number): RhythmItem => ({ dur, beats, rest: true });

const CELLS: Record<string, Cell> = {
  w: { id: 'w', items: [n('w', 4)], starts: [0], weight: 1 },
  h: { id: 'h', items: [n('h', 2)], starts: [0, 2], weight: 3 },
  q: { id: 'q', items: [n('q', 1)], starts: [0, 1, 2, 3], weight: 5 },
  qr: { id: 'qr', items: [r('q', 1)], starts: [1, 2, 3], weight: 2 },
  hr: { id: 'hr', items: [r('h', 2)], starts: [2], weight: 1 },
  ee: { id: 'ee', items: [n('8', 0.5), n('8', 0.5)], starts: [0, 1, 2, 3], weight: 4 },
  hd: { id: 'hd', items: [n('hd', 3)], starts: [0], weight: 1 },
  qde: { id: 'qde', items: [n('qd', 1.5), n('8', 0.5)], starts: [0, 2], weight: 2 },
  re: { id: 're', items: [r('8', 0.5), n('8', 0.5)], starts: [0, 1, 2, 3], weight: 2 },
  sync: { id: 'sync', items: [n('8', 0.5), n('q', 1), n('8', 0.5)], starts: [0, 2], weight: 2 },
  ssss: { id: 'ssss', items: [n('16', 0.25), n('16', 0.25), n('16', 0.25), n('16', 0.25)], starts: [0, 1, 2, 3], weight: 2 },
  ess: { id: 'ess', items: [n('8', 0.5), n('16', 0.25), n('16', 0.25)], starts: [0, 1, 2, 3], weight: 2 },
};

export interface RhythmLevel {
  level: number;
  title: string;
  /** Che cosa c'è di nuovo, in una riga. */
  focus: string;
  cells: string[];
  bpm: number;
}

export const RHYTHM_LEVELS: RhythmLevel[] = [
  { level: 1, title: 'Semibreve, minima, semiminima', focus: 'Contare quanto dura una nota: 4, 2, 1 movimenti.', cells: ['w', 'h', 'q'], bpm: 72 },
  { level: 2, title: 'Le pause', focus: 'Anche il silenzio si conta: non anticipare la nota dopo una pausa.', cells: ['h', 'q', 'qr', 'hr'], bpm: 72 },
  { level: 3, title: 'Le crome', focus: 'Due crome in un movimento: "ti-ti". Il piede batte solo la prima.', cells: ['h', 'q', 'qr', 'ee'], bpm: 70 },
  { level: 4, title: 'Il punto', focus: 'La minima puntata dura tre; la semiminima puntata e croma, "ta-a-ti".', cells: ['q', 'ee', 'hd', 'qde', 'qr'], bpm: 70 },
  { level: 5, title: 'Controtempo', focus: 'Pausa di croma e sincope: l\'attacco cade FRA due battiti.', cells: ['q', 'ee', 're', 'sync', 'qr'], bpm: 66 },
  { level: 6, title: 'Le semicrome', focus: 'Quattro in un movimento, o croma e due semicrome: "ti-ri-ti-ri".', cells: ['q', 'ee', 'ssss', 'ess', 'qr'], bpm: 60 },
];

export const MAX_RHYTHM_LEVEL = RHYTHM_LEVELS.length;

export function levelInfo(level: number): RhythmLevel {
  return RHYTHM_LEVELS[Math.max(0, Math.min(RHYTHM_LEVELS.length - 1, level - 1))];
}

/** Una figura: battute da 4/4, ciascuna una lista di figure. */
export type RhythmPattern = RhythmItem[][];

/**
 * Due battute di 4/4 con le cellule del livello. Le cellule NUOVE del livello
 * escono più spesso (è quello che si sta imparando), e ogni figura ne contiene
 * almeno una. Mai una figura fatta solo di pause.
 */
export function generatePattern(level: number, bars = 2, random: () => number = Math.random): RhythmPattern {
  const info = levelInfo(level);
  const prev = level > 1 ? levelInfo(level - 1).cells : [];
  const fresh = info.cells.filter(c => !prev.includes(c));

  for (let attempt = 0; attempt < 50; attempt++) {
    const used = new Set<string>();
    const pattern: RhythmPattern = [];
    for (let b = 0; b < bars; b++) {
      const bar: RhythmItem[] = [];
      let pos = 0;
      while (pos < 4) {
        const fits = info.cells
          .map(id => CELLS[id])
          .filter(c => c.starts.includes(pos) && c.items.reduce((s, i) => s + i.beats, 0) <= 4 - pos);
        const weights = fits.map(c => c.weight * (fresh.includes(c.id) ? 2 : 1));
        let x = random() * weights.reduce((s, w) => s + w, 0);
        let pick = fits[fits.length - 1];
        for (let i = 0; i < fits.length; i++) {
          x -= weights[i];
          if (x <= 0) { pick = fits[i]; break; }
        }
        bar.push(...pick.items);
        used.add(pick.id);
        pos += pick.items.reduce((s, i) => s + i.beats, 0);
      }
      pattern.push(bar);
    }
    const hasNotes = pattern.flat().filter(i => !i.rest).length >= 3;
    const hasFresh = fresh.length === 0 || fresh.some(f => used.has(f));
    if (hasNotes && hasFresh) return pattern;
  }
  return Array.from({ length: bars }, () => [n('q', 1), n('q', 1), n('q', 1), n('q', 1)]);
}

/** Gli attacchi da battere, in movimenti dall'inizio della figura. */
export function onsetsOf(pattern: RhythmPattern): number[] {
  const out: number[] = [];
  let t = 0;
  for (const bar of pattern) for (const item of bar) {
    if (!item.rest) out.push(t);
    t += item.beats;
  }
  return out;
}

export function lengthInBeats(pattern: RhythmPattern): number {
  return pattern.flat().reduce((s, i) => s + i.beats, 0);
}

export type HitGrade = 'ok' | 'quasi' | 'fuori' | 'persa';

export interface RhythmScore {
  /** Esito per ogni attacco atteso, in ordine. */
  grades: HitGrade[];
  /** Scarto in ms per ogni attacco battuto (+ = in ritardo). */
  deviations: (number | null)[];
  extra: number;
  /** Media degli scarti con segno: dice se si tende ad anticipare o ritardare. */
  bias: number;
  meanAbs: number;
  clean: boolean;
}

/**
 * Tolleranze: dentro OK_MS l'attacco è a tempo; fino a CLOSE_MS è "quasi";
 * oltre, fuori tempo. Sono larghe per chi comincia e restano strette rispetto
 * allo spazio fra due crome a 70 bpm (430 ms).
 */
const OK_MS = 90;
const CLOSE_MS = 170;
const MATCH_MS = 260;

/** Confronta gli attacchi attesi (ms) con quelli battuti (ms, stesso orologio). */
export function scoreTaps(expected: number[], taps: number[]): RhythmScore {
  const used = new Set<number>();
  const deviations: (number | null)[] = [];
  const grades: HitGrade[] = [];
  for (const t of expected) {
    let best = -1;
    let bestD = Infinity;
    taps.forEach((tap, i) => {
      if (used.has(i)) return;
      const d = Math.abs(tap - t);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best >= 0 && bestD <= MATCH_MS) {
      used.add(best);
      const dev = taps[best] - t;
      deviations.push(dev);
      grades.push(Math.abs(dev) <= OK_MS ? 'ok' : Math.abs(dev) <= CLOSE_MS ? 'quasi' : 'fuori');
    } else {
      deviations.push(null);
      grades.push('persa');
    }
  }
  const devs = deviations.filter((d): d is number => d !== null);
  const extra = taps.length - used.size;
  const bias = devs.length ? devs.reduce((s, d) => s + d, 0) / devs.length : 0;
  const meanAbs = devs.length ? devs.reduce((s, d) => s + Math.abs(d), 0) / devs.length : 0;
  const clean = extra === 0 && grades.every(g => g === 'ok' || g === 'quasi') && grades.filter(g => g === 'quasi').length <= 1;
  return { grades, deviations, extra, bias, meanAbs, clean };
}
