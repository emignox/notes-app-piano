// ─────────────────────────────────────────────────────────────────────────────
// Le FORME della musica: accordi, arpeggi, bassi, scale che tornano.
//
// Chi legge bene non legge nota per nota: vede blocchi. Una battuta di venti
// note è quasi sempre "un accordo suonato in un certo modo", e lo stesso modo
// torna dieci volte nel brano. Qui l'app fa al posto tuo il lavoro di
// riconoscerle, così impari a vederle e, la volta dopo, le riconosci da solo.
//
// Si ragiona mano per mano, a finestre di tempo: una battuta, e se in una
// battuta ci sono due accordi, le sue metà (fino a un movimento). Una finestra
// diventa un'etichetta SOLO se le sue note stanno quasi tutte in un accordo
// noto (almeno l'80%, e tre note dell'accordo presenti): meglio nessuna
// etichetta che una sbagliata. Una melodia, di solito, non passa.
//
// Le forme trovate:
//  · blocchi    — le note dell'accordo suonate insieme;
//  · arpeggio   — le note dell'accordo una dopo l'altra, in salita o in discesa;
//  · alberti    — basso, nota alta, nota di mezzo, nota alta (do-sol-mi-sol);
//  · valzer     — un basso e poi l'accordo (uno-due-tre);
//  · spezzato   — le note di un accordo in un altro ordine, o con la melodia sopra;
//  · scala      — note vicine, in una direzione (cinque almeno);
//  · ripetuta   — la stessa nota ripetuta (quattro volte almeno).
// ─────────────────────────────────────────────────────────────────────────────

import { CHORDS, buildChord } from './harmony';
import type { ChordQuality } from './harmony';
import { parseNote } from './notes';

/** Le parti di una nota che servono (il Leggio ne ha molte di più). */
export interface FNote {
  midi: number;
  staff: number;
  start: number;
  dur: number;
  grace: boolean;
  /** Continuazione di una legatura di valore: non si ribatte. */
  cont: boolean;
  /** Il nome come è scritto: Si♭ e non La♯. */
  name: string;
}

export interface FStep {
  beat: number;
  measure: number;
  notes: FNote[];
}

export type FormaKind = 'blocchi' | 'arpeggio' | 'alberti' | 'valzer' | 'spezzato' | 'scala' | 'ripetuta';

export interface Forma {
  id: number;
  kind: FormaKind;
  /** 0 = la mano destra (rigo alto), 1 = la sinistra. */
  staff: number;
  /** Il primo e l'ultimo passo (indici dei passi del Leggio), estremi compresi. */
  from: number;
  to: number;
  /** Prima e ultima battuta (indici). */
  m0: number;
  m1: number;
  /** Accordo: fondamentale (come è scritta), qualità, e basso se non è la fondamentale. */
  root?: string;
  quality?: ChordQuality;
  bass?: string;
  /** 0 = stato fondamentale, 1 = primo rivolto… */
  inversion?: number;
  /** Le note dell'accordo, dal basso verso l'alto della sua costruzione: 1, 3, 5, 7. */
  tones?: string[];
  /** Scala. */
  dir?: 'su' | 'giu';
  chromatic?: boolean;
  /** Nota ripetuta, e quante volte. */
  note?: string;
  times?: number;
  /** Uguale per le forme dello stesso tipo, anche se su note diverse. */
  signature: string;
  /** Quante volte compare nel brano. */
  count: number;
  /** Indice della famiglia colorata (le più frequenti), o −1. */
  family: number;
}

const QUALITIES: ChordQuality[] = [
  'maggiore', 'minore', 'diminuito', 'aumentato',
  'settima di dominante', 'settima maggiore', 'settima minore', 'semidiminuito', 'settima diminuita',
];

/** Un nome di ripiego per la fondamentale se la partitura non la scrive. */
const FALLBACK_NAME = ['Do', 'Re♭', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];

const pcOf = (midi: number) => ((midi % 12) + 12) % 12;

const IT_TO_EN: Record<string, string> = { Do: 'C', Re: 'D', Mi: 'E', Fa: 'F', Sol: 'G', La: 'A', Si: 'B' };
const EN_TO_IT: Record<string, string> = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const ACC_SYMBOL: Record<string, string> = { '': '', '#': '♯', b: '♭', '##': '♯♯', bb: '♭♭' };
const SYMBOL_ACC: Record<string, string> = { '♯': '#', '♭': 'b', '♯♯': '##', '♭♭': 'bb' };

/**
 * Le note dell'accordo scritte a partire dalla fondamentale (Fa♯ minore
 * settima: Fa♯–La–Do♯–Mi). Servono solo per le note dell'accordo che nel rigo
 * non ci sono: quelle presenti si mostrano come sono scritte, perché chi
 * impara guarda il rigo (e una partitura può scrivere Re♭ dove la teoria
 * vuole Do♯). Null se la fondamentale non si legge.
 */
function chordTones(root: string, quality: ChordQuality): string[] | null {
  const m = /^(Do|Re|Mi|Fa|Sol|La|Si)(♯♯|♭♭|♯|♭)?$/.exec(root);
  if (!m) return null;
  const en = IT_TO_EN[m[1]] + (m[2] ? SYMBOL_ACC[m[2]] : '');
  try {
    return buildChord(`${en}4`, quality).map(n => {
      const { letter, acc } = parseNote(n);
      return EN_TO_IT[letter] + (ACC_SYMBOL[acc] ?? '');
    });
  } catch {
    return null;
  }
}

interface Ev {
  /** Indice del passo del Leggio. */
  step: number;
  beat: number;
  measure: number;
  /** Le note della mano in questo istante, dalla più grave. */
  notes: FNote[];
}

interface Chord {
  root: number;
  quality: ChordQuality;
}

const template = (root: number, quality: ChordQuality) => CHORDS[quality].steps.map(s => (root + s) % 12);

/** L'accordo che spiega meglio queste note, o null (vedi l'intestazione). */
function bestChord(notes: FNote[]): Chord | null {
  const n = notes.length;
  if (n < 3) return null;
  const present = new Array<number>(12).fill(0);
  let lowest = Infinity;
  for (const x of notes) {
    present[pcOf(x.midi)]++;
    if (x.midi < lowest) lowest = x.midi;
  }
  const bassPc = pcOf(lowest);
  let best: { chord: Chord; key: number[] } | null = null;
  for (let qi = 0; qi < QUALITIES.length; qi++) {
    const quality = QUALITIES[qi];
    for (let root = 0; root < 12; root++) {
      const tones = template(root, quality);
      let have = 0;
      let inside = 0;
      for (const pc of tones) if (present[pc]) { have++; inside += present[pc]; }
      if (have < 3) continue;
      const out = n - inside;
      if (out > Math.floor(n * 0.2)) continue;
      if (out > 0 && n < 5) continue;
      // Meno note fuori, meno note dell'accordo assenti, fondamentale al basso,
      // accordo più piccolo, qualità più comune.
      const key = [out, tones.length - have, bassPc === root ? 0 : 1, tones.length, qi];
      if (!best || cmp(key, best.key) < 0) best = { chord: { root, quality }, key };
    }
  }
  return best ? best.chord : null;
}

function cmp(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

interface Seg {
  /** Indici (nell'elenco degli eventi della mano) del primo e dell'ultimo evento. */
  first: number;
  last: number;
  chord: Chord;
  kind: Exclude<FormaKind, 'scala' | 'ripetuta'>;
  pattern: string;
}

/** Come sono suonate le note di un accordo: il tipo di forma e il suo disegno. */
function classify(evs: Ev[]): { kind: Seg['kind']; pattern: string } {
  const singles = evs.filter(e => e.notes.length === 1);
  const multi = evs.filter(e => e.notes.length >= 2);
  const total = evs.reduce((s, e) => s + e.notes.length, 0);

  // Solo accordi (almeno due note insieme in quasi tutti gli istanti).
  if (multi.length >= Math.ceil(evs.length * 0.7) && total / evs.length >= 2.5) {
    return { kind: 'blocchi', pattern: `n${Math.round(total / evs.length)}` };
  }
  // Un basso e poi l'accordo: il passo del valzer.
  if (evs.length >= 3 && evs[0].notes.length === 1) {
    const rest = evs.slice(1);
    const chordy = rest.filter(e => e.notes.length >= 2).length;
    const bass = evs[0].notes[0].midi;
    const above = Math.min(...rest.flatMap(e => e.notes.map(x => x.midi)));
    if (chordy >= Math.ceil(rest.length * 0.7) && chordy >= 2 && above - bass >= 5) return { kind: 'valzer', pattern: 'b+c' };
  }
  // Una nota alla volta.
  if (singles.length === evs.length && evs.length >= 4) {
    const midis = evs.map(e => e.notes[0].midi);
    const distinct = [...new Set(midis)].sort((a, b) => a - b);
    if (distinct.length === 3) {
      const ranks = midis.map(m => distinct.indexOf(m));
      const alberti = [0, 2, 1, 2];
      for (let phase = 0; phase < 4; phase++) {
        if (ranks.every((r, i) => r === alberti[(i + phase) % 4])) return { kind: 'alberti', pattern: '0212' };
      }
    }
    let up = 0;
    let down = 0;
    for (let i = 1; i < midis.length; i++) {
      if (midis[i] > midis[i - 1]) up++;
      else if (midis[i] < midis[i - 1]) down++;
    }
    if (up === 0 || down === 0) return { kind: 'arpeggio', pattern: up ? 'su' : 'giu' };
    return { kind: 'spezzato', pattern: 'mix' };
  }
  return { kind: 'spezzato', pattern: 'mix' };
}

/** Le forme di tutto il brano. */
export function analyseForme(steps: FStep[]): Forma[] {
  // L'inizio e la lunghezza di ogni battuta, in movimenti.
  const measureStart = new Map<number, number>();
  const measureEnd = new Map<number, number>();
  for (const s of steps) {
    if (!measureStart.has(s.measure)) measureStart.set(s.measure, s.beat);
    const end = s.beat + Math.max(0.25, ...s.notes.map(n => n.dur));
    measureEnd.set(s.measure, Math.max(measureEnd.get(s.measure) ?? 0, end));
  }
  const measures = [...measureStart.keys()].sort((a, b) => a - b);

  const out: Forma[] = [];
  for (const staff of [0, 1]) {
    // Gli eventi della mano: niente abbellimenti né note legate (non si ribattono).
    const events: Ev[] = [];
    steps.forEach((s, i) => {
      const notes = s.notes.filter(n => n.staff === staff && !n.grace && !n.cont).sort((a, b) => a.midi - b.midi);
      if (notes.length) events.push({ step: i, beat: s.beat, measure: s.measure, notes });
    });
    if (events.length < 3) continue;
    const claimed = new Array<boolean>(events.length).fill(false);

    // 1 · Note ripetute.
    for (let i = 0; i < events.length;) {
      let j = i;
      while (j + 1 < events.length && events[j + 1].notes.length === 1 && events[i].notes.length === 1 && events[j + 1].notes[0].midi === events[i].notes[0].midi) j++;
      if (events[i].notes.length === 1 && j - i + 1 >= 4) {
        const note = events[i].notes[0];
        out.push({
          id: 0, kind: 'ripetuta', staff, from: events[i].step, to: events[j].step, m0: events[i].measure, m1: events[j].measure,
          note: note.name, times: j - i + 1, signature: 'ripetuta', count: 0, family: -1,
        });
        for (let k = i; k <= j; k++) claimed[k] = true;
      }
      i = j + 1;
    }

    // 2 · Scale: note vicine in una sola direzione.
    for (let i = 0; i + 1 < events.length;) {
      if (claimed[i] || events[i].notes.length !== 1) { i++; continue; }
      let j = i;
      let sign = 0;
      while (j + 1 < events.length && !claimed[j + 1] && events[j + 1].notes.length === 1) {
        const d = events[j + 1].notes[0].midi - events[j].notes[0].midi;
        if (Math.abs(d) < 1 || Math.abs(d) > 2) break;
        const sg = Math.sign(d);
        if (sign !== 0 && sg !== sign) break;
        sign = sg;
        j++;
      }
      if (j - i + 1 >= 5) {
        let chromatic = true;
        for (let k = i; k < j; k++) if (Math.abs(events[k + 1].notes[0].midi - events[k].notes[0].midi) !== 1) chromatic = false;
        out.push({
          id: 0, kind: 'scala', staff, from: events[i].step, to: events[j].step, m0: events[i].measure, m1: events[j].measure,
          dir: sign > 0 ? 'su' : 'giu', chromatic, signature: `scala|${sign > 0 ? 'su' : 'giu'}|${chromatic ? 'cr' : 'di'}`, count: 0, family: -1,
        });
        for (let k = i; k <= j; k++) claimed[k] = true;
        i = j + 1;
      } else i++;
    }

    // 3 · Accordi: finestre di una battuta, divise a metà quando serve.
    const free = (a: number, b: number): number[] => {
      const idx: number[] = [];
      for (let k = 0; k < events.length; k++) if (!claimed[k] && events[k].beat >= a - 1e-6 && events[k].beat < b - 1e-6) idx.push(k);
      return idx;
    };
    const evalIdx = (idx: number[]) => (idx.length >= 3 || idx.reduce((s, k) => s + events[k].notes.length, 0) >= 3
      ? bestChord(idx.flatMap(k => events[k].notes)) : null);
    const segs: Seg[] = [];
    const windows = (a: number, b: number): void => {
      const idx = free(a, b);
      if (idx.length === 0) return;
      // Una nota ripetuta o una scala in mezzo spezza la finestra: una forma
      // non deve "scavalcarla" (si sovrapporrebbero sul rigo).
      const runs: number[][] = [[idx[0]]];
      for (let k = 1; k < idx.length; k++) {
        if (idx[k] === idx[k - 1] + 1) runs[runs.length - 1].push(idx[k]);
        else runs.push([idx[k]]);
      }
      if (runs.length > 1) {
        for (const r of runs) windows(events[r[0]].beat, events[r[r.length - 1]].beat + 1e-3);
        return;
      }
      const whole = evalIdx(idx);
      const half = (b - a) / 2;
      const canSplit = half >= 1 - 1e-6 && idx.length >= 2;
      const mid = a + half;
      if (!canSplit) {
        if (whole) pushSeg(idx, whole);
        return;
      }
      if (whole) {
        const l = evalIdx(free(a, mid));
        const r = evalIdx(free(mid, b));
        if (!(l && r && (l.root !== r.root || l.quality !== r.quality))) { pushSeg(idx, whole); return; }
      }
      windows(a, mid);
      windows(mid, b);
    };
    const pushSeg = (idx: number[], chord: Chord) => {
      const evs = idx.map(k => events[k]);
      const { kind, pattern } = classify(evs);
      segs.push({ first: idx[0], last: idx[idx.length - 1], chord, kind, pattern });
    };
    for (const m of measures) {
      const a = measureStart.get(m) ?? 0;
      const b = Math.max(a + 1, measureEnd.get(m) ?? a + 4);
      windows(a, b);
    }

    // 4 · Finestre vicine con lo stesso accordo e lo stesso modo: una forma sola.
    const merged: Seg[] = [];
    for (const s of segs) {
      const prev = merged[merged.length - 1];
      if (prev && prev.chord.root === s.chord.root && prev.chord.quality === s.chord.quality && prev.kind === s.kind
        && prev.pattern === s.pattern && s.first === prev.last + 1) {
        prev.last = s.last;
      } else merged.push({ ...s });
    }

    for (const s of merged) {
      const evs = events.slice(s.first, s.last + 1).filter((_, i) => !claimed[s.first + i]);
      const notes = evs.flatMap(e => e.notes);
      const names = new Map<number, Map<string, number>>();
      let lowest = notes[0];
      for (const n of notes) {
        const m = names.get(pcOf(n.midi)) ?? new Map<string, number>();
        m.set(n.name, (m.get(n.name) ?? 0) + 1);
        names.set(pcOf(n.midi), m);
        if (n.midi < lowest.midi) lowest = n;
      }
      const nameOf = (pc: number) => {
        const m = names.get(pc);
        if (!m) return FALLBACK_NAME[pc];
        return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
      };
      const tonesPc = template(s.chord.root, s.chord.quality);
      const bassPc = pcOf(lowest.midi);
      const inversion = Math.max(0, tonesPc.indexOf(bassPc));
      const rootName = nameOf(s.chord.root);
      const built = chordTones(rootName, s.chord.quality);
      const tones = tonesPc.map((pc, i) => (names.has(pc) ? nameOf(pc) : built?.[i] ?? FALLBACK_NAME[pc]));
      const bass = bassPc === s.chord.root ? undefined : nameOf(bassPc);
      out.push({
        id: 0, kind: s.kind, staff, from: events[s.first].step, to: events[s.last].step,
        m0: events[s.first].measure, m1: events[s.last].measure,
        root: rootName, quality: s.chord.quality,
        bass,
        inversion,
        tones,
        // Alberti, valzer e arpeggio sono un GESTO: lo stesso su accordi diversi.
        // I blocchi e le note spezzate dipendono da com'è fatto l'accordo (la
        // mano ha una forma diversa per un minore, per un rivolto).
        signature: s.kind === 'alberti' || s.kind === 'valzer' || s.kind === 'arpeggio'
          ? `${s.kind}|${s.pattern}`
          : `${s.kind}|${s.chord.quality}|${s.pattern}|${inversion}`,
        dir: s.kind === 'arpeggio' ? (s.pattern === 'giu' ? 'giu' : 'su') : undefined,
        count: 0, family: -1,
      });
    }
  }

  out.sort((a, b) => a.from - b.from || a.staff - b.staff);

  // Le forme che tornano: stessa firma, anche su altre note. Le sei più frequenti
  // (almeno tre volte) hanno un colore.
  const counts = new Map<string, number>();
  for (const f of out) counts.set(f.signature, (counts.get(f.signature) ?? 0) + 1);
  const families = [...counts.entries()].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([sig]) => sig);
  out.forEach((f, i) => {
    f.id = i;
    f.count = counts.get(f.signature) ?? 1;
    f.family = families.indexOf(f.signature);
  });
  return out;
}

/** Le famiglie di forme del brano, dalla più frequente, con la prima occorrenza. */
export function familiesOf(forme: Forma[]): { family: number; sample: Forma; count: number }[] {
  const seen = new Map<number, { family: number; sample: Forma; count: number }>();
  for (const f of forme) {
    if (f.family < 0) continue;
    const cur = seen.get(f.family);
    if (cur) cur.count++;
    else seen.set(f.family, { family: f.family, sample: f, count: 1 });
  }
  return [...seen.values()].sort((a, b) => a.family - b.family);
}
