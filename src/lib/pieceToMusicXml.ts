// ─────────────────────────────────────────────────────────────────────────────
// Da un pezzo dell'app (passi a due mani) a una partitura MusicXML.
//
// Serve al Leggio: tutti i brani, quelli scritti a mano per l'app e le
// partiture complete, si aprono nello stesso lettore con lo stesso aspetto.
//
// Una scelta che conta per la leggibilità: nei passi una nota tenuta mentre
// l'altra mano si muove è scritta come più note legate (quattro semiminime
// legate per una semibreve). Qui le note legate dentro la stessa battuta si
// FONDONO nella figura vera, quando esiste: sul leggio si legge una semibreve,
// non quattro note con tre archetti.
// ─────────────────────────────────────────────────────────────────────────────

import type { HandMarks, Piece, PieceStep } from '../types';
import { keyInfo } from './keys';
import { parseNote, sortByPitch } from './notes';
import { splitMeasures } from './score';

/** Suddivisioni per semiminima: la semicroma vale 1. */
const DIV = 4;

/** Durate scrivibili con una figura sola (in suddivisioni), dalla più lunga. */
const FIGURES: [number, string, boolean][] = [
  [24, 'whole', true],
  [16, 'whole', false],
  [12, 'half', true],
  [8, 'half', false],
  [6, 'quarter', true],
  [4, 'quarter', false],
  [3, 'eighth', true],
  [2, 'eighth', false],
  [1, '16th', false],
];

const ALTER: Record<string, number> = { '': 0, '#': 1, b: -1, '##': 2, bb: -2 };
const ART_XML: Record<string, string> = {
  staccato: '<staccato/>',
  accent: '<accent/>',
  tenuto: '<tenuto/>',
  marcato: '<strong-accent type="up"/>',
};

type Hand = 'r' | 'l';

interface Event {
  notes: string[];
  /** Durata in suddivisioni. */
  dur: number;
  /** Primo passo dell'evento (per segni e legature). */
  first: number;
  last: number;
  marks?: HandMarks;
  tieIn: boolean;
  tieOut: boolean;
}

const sameNotes = (a: string[], b: string[]) => a.length === b.length && a.every((n, i) => n === b[i]);
const notesOf = (st: PieceStep, h: Hand) => sortByPitch(h === 'r' ? st.treble : st.bass);
const marksOf = (st: PieceStep, h: Hand) => (h === 'r' ? st.r : st.l);

/** Le figure (con eventuali legature) che compongono una durata. */
function split(dur: number): [number, string, boolean][] {
  const out: [number, string, boolean][] = [];
  let left = dur;
  while (left > 0) {
    const f = FIGURES.find(([d]) => d <= left) ?? FIGURES[FIGURES.length - 1];
    out.push(f);
    left -= f[0];
  }
  return out;
}

/** Gli eventi di una mano in una battuta, con le note legate fuse. */
function handEvents(steps: PieceStep[], indices: number[], h: Hand, prevTie: boolean): Event[] {
  const out: Event[] = [];
  indices.forEach((i, k) => {
    const st = steps[i];
    const notes = notesOf(st, h);
    const dur = Math.round(st.beats * DIV);
    const marks = marksOf(st, h);
    const prev = out[out.length - 1];
    const tieIn = k === 0 ? prevTie && notes.length > 0 : !!prev?.tieOut;
    // Fusione: stessa nota (o pausa) che continua, e la somma ha una figura sola.
    const merge = prev && sameNotes(prev.notes, notes) && (notes.length === 0 || prev.tieOut)
      && FIGURES.some(([d]) => d === prev.dur + dur);
    if (merge) {
      prev.dur += dur;
      prev.last = i;
      prev.tieOut = notes.length > 0 && !!marks?.tie;
      return;
    }
    out.push({ notes, dur, first: i, last: i, marks, tieIn, tieOut: notes.length > 0 && !!marks?.tie });
  });
  return out;
}

function pitchXml(note: string): string {
  const { letter, acc, octave } = parseNote(note);
  const alter = ALTER[acc] ?? 0;
  return `<pitch><step>${letter}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${octave}</octave></pitch>`;
}

function directionXml(st: PieceStep, staff: number, offset: number): string {
  const parts: string[] = [];
  const off = offset ? `<offset>${offset}</offset>` : '';
  if (st.dyn) parts.push(`<direction placement="below"><direction-type><dynamics><${st.dyn}/></dynamics></direction-type>${off}<staff>${staff}</staff></direction>`);
  if (st.hair === 'cresc' || st.hair === 'dim') parts.push(`<direction placement="below"><direction-type><wedge type="${st.hair === 'cresc' ? 'crescendo' : 'diminuendo'}"/></direction-type>${off}<staff>${staff}</staff></direction>`);
  if (st.hair === 'end') parts.push(`<direction placement="below"><direction-type><wedge type="stop"/></direction-type>${off}<staff>${staff}</staff></direction>`);
  if (st.text) parts.push(`<direction placement="${/rit|rall|accel|tempo|mosso/i.test(st.text) ? 'above' : 'below'}"><direction-type><words font-style="italic">${escapeXml(st.text)}</words></direction-type>${off}<staff>${staff}</staff></direction>`);
  return parts.join('');
}

/**
 * Il pedale, nella scrittura a linea: una parentesi sotto il rigo che dura
 * quanto il pedale resta giù, con una tacca dove lo si cambia. Un "giù" a
 * pedale già abbassato è un cambio. (Con i soli segni "Ped." e "*" OSMD li
 * impila uno sotto l'altro e lo spartito diventa altissimo.)
 */
function pedalXml(st: PieceStep, offset: number, state: { down: boolean }): string {
  if (!st.ped) return '';
  const off = offset ? `<offset>${offset}</offset>` : '';
  let type: 'start' | 'change' | 'stop' | null = null;
  if (st.ped === 'down') {
    type = state.down ? 'change' : 'start';
    state.down = true;
  } else if (state.down) {
    type = 'stop';
    state.down = false;
  }
  return type ? `<direction placement="below"><direction-type><pedal type="${type}" line="yes"/></direction-type>${off}<staff>2</staff></direction>` : '';
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Inizio e fine delle legature di frase di una mano, per indice di passo. */
function slurBounds(steps: PieceStep[], h: Hand): { starts: Set<number>; stops: Set<number> } {
  const starts = new Set<number>();
  const stops = new Set<number>();
  let open = -1;
  steps.forEach((st, i) => {
    const sounds = notesOf(st, h).length > 0;
    const leg = !!marksOf(st, h)?.leg && sounds;
    if (leg && open < 0) open = i;
    if (!leg && open >= 0) {
      const end = sounds ? i : i - 1;
      if (end > open) { starts.add(open); stops.add(end); }
      open = -1;
    }
  });
  return { starts, stops };
}

export function pieceToMusicXml(piece: Piece): string {
  const measures = splitMeasures(piece);
  const [num, den] = piece.meter.split('/').map(Number);
  const fifths = keyInfo(piece.key.tonic, piece.key.mode).accidentals;
  const slurs = { r: slurBounds(piece.steps, 'r'), l: slurBounds(piece.steps, 'l') };
  const stepStart: number[] = [];
  let acc = 0;
  piece.steps.forEach((st, i) => { stepStart[i] = acc; acc += Math.round(st.beats * DIV); });

  const tieOpen = { r: false, l: false };
  const pedal = { down: false };
  const xmlMeasures = measures.map((m, mi) => {
    const mDur = m.indices.reduce((s, i) => s + Math.round(piece.steps[i].beats * DIV), 0);
    const mStart = stepStart[m.indices[0]] ?? 0;
    let body = '';
    if (mi === 0) {
      body += `<attributes><divisions>${DIV}</divisions><key><fifths>${fifths}</fifths><mode>${piece.key.mode === 'minore' ? 'minor' : 'major'}</mode></key>`
        + `<time><beats>${num}</beats><beat-type>${den}</beat-type></time><staves>2</staves>`
        + `<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>`;
      body += `<direction placement="above"><direction-type><words font-weight="bold">${escapeXml(piece.tempoText ?? '')}</words></direction-type><staff>1</staff><sound tempo="${piece.bpm}"/></direction>`;
    }

    (['r', 'l'] as Hand[]).forEach((h, hi) => {
      const staff = hi + 1;
      const voice = hi === 0 ? 1 : 5;
      if (hi === 1) body += `<backup><duration>${mDur}</duration></backup>`;
      const events = handEvents(piece.steps, m.indices, h, tieOpen[h]);
      let pos = mStart;
      for (const ev of events) {
        // Segni dei passi che cadono dentro questo evento, alla loro posizione.
        if (h === 'r') {
          for (let i = ev.first; i <= ev.last; i++) body += directionXml(piece.steps[i], 1, stepStart[i] - pos) + pedalXml(piece.steps[i], stepStart[i] - pos, pedal);
        }
        const figures = split(ev.dur);
        figures.forEach(([d, type, dot], fi) => {
          const firstFig = fi === 0;
          const lastFig = fi === figures.length - 1;
          const tieStart = !lastFig || ev.tieOut;
          const tieStop = !firstFig || ev.tieIn;
          const notes = ev.notes.length ? ev.notes : [null];
          notes.forEach((n, ni) => {
            const fin = ev.marks?.fin;
            const digit = Array.isArray(fin) ? fin[ni] : ni === 0 ? fin : undefined;
            const notations: string[] = [];
            if (n && tieStop) notations.push('<tied type="stop"/>');
            if (n && tieStart) notations.push('<tied type="start"/>');
            if (n && ni === 0 && firstFig && slurs[h].starts.has(ev.first)) notations.push('<slur type="start" number="1"/>');
            if (n && ni === 0 && lastFig && slurs[h].stops.has(ev.last)) notations.push('<slur type="stop" number="1"/>');
            const art = ev.marks?.art;
            if (n && firstFig && art === 'fermata') notations.push('<fermata type="upright"/>');
            if (n && firstFig && art && ART_XML[art]) notations.push(`<articulations>${ART_XML[art]}</articulations>`);
            if (n && firstFig && digit !== undefined) notations.push(`<technical><fingering>${digit}</fingering></technical>`);
            body += '<note>'
              + (ni > 0 ? '<chord/>' : '')
              + (n ? pitchXml(n) : '<rest/>')
              + `<duration>${d}</duration>`
              + (n && tieStop ? '<tie type="stop"/>' : '')
              + (n && tieStart ? '<tie type="start"/>' : '')
              + `<voice>${voice}</voice><type>${type}</type>${dot ? '<dot/>' : ''}<staff>${staff}</staff>`
              + (notations.length ? `<notations>${notations.join('')}</notations>` : '')
              + '</note>';
          });
        });
        pos += ev.dur;
      }
      tieOpen[h] = events.length > 0 && events[events.length - 1].tieOut;
    });

    const lastIdx = m.indices[m.indices.length - 1];
    const bar = piece.steps[lastIdx]?.bar;
    if (bar === 'end' || mi === measures.length - 1) body += '<barline location="right"><bar-style>light-heavy</bar-style></barline>';
    else if (bar === 'double') body += '<barline location="right"><bar-style>light-light</bar-style></barline>';
    else if (bar === 'repeat') body += '<barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward"/></barline>';

    return `<measure number="${m.number}"${m.pickup ? ' implicit="yes"' : ''}>${body}</measure>`;
  });

  return '<?xml version="1.0" encoding="UTF-8"?>'
    + '<score-partwise version="3.1">'
    + `<work><work-title>${escapeXml(piece.title)}</work-title></work>`
    + `<identification><creator type="composer">${escapeXml(piece.composer)}</creator></identification>`
    + '<part-list><score-part id="P1"><part-name>Pianoforte</part-name></score-part></part-list>'
    + `<part id="P1">${xmlMeasures.join('')}</part></score-partwise>`;
}
