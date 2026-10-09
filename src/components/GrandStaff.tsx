// ─────────────────────────────────────────────────────────────────────────────
// Doppio pentagramma: uno spartito vero, non una fila di note.
//
// Tre scelte spiegano quasi tutto il file.
//
// 1. SI VA A CAPO. Prima il pezzo era una striscia unica che scorreva di lato:
//    va bene per nove note, non per una pagina di Chopin. Qui le battute si
//    impaginano in sistemi (righe) larghi quanto lo schermo, come su carta.
//
// 2. IL DISEGNO SI FA UNA VOLTA SOLA. Ridisegnare duecento battute a ogni nota
//    suonata è il modo sicuro di rendere l'app a scatti sul telefono. Il
//    pentagramma viene disegnato quando cambia il pezzo (o la larghezza), e a
//    ogni nota si aggiornano soltanto i COLORI, scrivendo sugli elementi SVG
//    già presenti.
//
// 3. I SEGNI SONO PARTE DELLA MUSICA. Legature di frase e di valore, staccati,
//    accenti, corone, dinamiche, forcelle, pedale, diteggiatura: senza questi
//    uno spartito dice cosa premere ma non come suonare, ed è esattamente la
//    differenza fra leggere e fare musica.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Accidental,
  Annotation,
  Articulation,
  Barline,
  Beam,
  Curve,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveConnector,
  StaveNote,
  StaveTie,
  Voice,
} from 'vexflow';
import type { Articulation as Artic, Hand, NoteResult, Piece, PieceStep } from '../types';
import { parseNote, sortByPitch, staffSlot, vexKeyOf } from '../lib/notes';
import {
  marksOf,
  notesOf,
  slurRuns,
  splitMeasures,
  tiePairs,
  vexDuration,
} from '../lib/score';
import type { SingleHand } from '../lib/score';

interface GrandStaffProps {
  piece: Piece;
  activeIndex: number;
  results: NoteResult[];
  /** Note del passo corrente già suonate: il passo si scalda di verde. */
  found?: string[];
  /** Quale mano si sta studiando: l'altra resta in grigio. */
  hand?: Hand;
  /** Diteggiatura a schermo (si può spegnere: a qualcuno dà fastidio). */
  fingering?: boolean;
  /** Sezione in studio: fuori da qui le note restano spente. */
  range?: { from: number; to: number };
  /**
   * In ascolto: si accendono le note che stanno suonando, invece del
   * riquadro che scorre. Si segue la musica guardando le note, non un cursore.
   */
  listening?: boolean;
}

// ── Colori ──────────────────────────────────────────────────────────────────

const INK = '#101828';
/**
 * Le note che devono ancora arrivare. Erano quasi trasparenti (25%), linee
 * aggiuntive comprese: sembravano galleggiare fuori dal rigo e soprattutto non
 * si potevano leggere in anticipo — che è proprio quello che fa chi suona.
 */
const UPCOMING = '#334155';
const GOOD = '#15803d';
const HALF = '#65a30d';
const BAD = '#dc2626';
/** Fuori dalla sezione che si studia: in secondo piano, ma leggibile. */
const GHOST = '#94a3b8b0';
const MUTED = '#94a3b880';
/** Le note che suonano adesso, durante l'ascolto. */
const PLAYING = '#4f46e5';
const MARK = '#475569';
const FAINT = '#94a3b8';

// ── Misure del disegno ──────────────────────────────────────────────────────

/** La graffa si disegna a SINISTRA del rigo: senza questo margine è tagliata. */
const MARGIN = 18;
/**
 * VexFlow non disegna la prima linea alla `y` che gli passi: lascia sempre
 * quattro spazi sopra, per i tagli addizionali e i segni. Sono questi 40 px, e
 * ignorarli vuol dire scrivere le dinamiche dentro il pentagramma invece che
 * sotto — che è esattamente l'errore che questo numero evita.
 */
const STAVE_OFFSET = 40;
/** Altezza di un pentagramma (quattro spazi da dieci). */
const STAFF_H = 40;
/** Mezzo spazio: la distanza fra una linea e lo spazio accanto. */
const HALF_SPACE = 5;
/** Lunghezza di un gambo, misurata dalla testa della nota. */
const STEM = 35;
const SYSTEM_GAP = 10;
/** Riga in cima alla pagina per l'indicazione di andamento. */
const HEAD_H = 24;

/**
 * Le quote verticali di un sistema. Prima erano fisse (46 px fra i due righi),
 * e bastava che la sinistra salisse sopra il Do centrale — gli accordi del
 * Notturno e del Valzer — perché le sue note finissero nello spazio fra i
 * righi, mescolate con quelle della destra: lo spartito sembrava sparso.
 * Adesso ogni sistema si prende lo spazio che chiedono le SUE note: linee
 * aggiuntive, gambi, diteggiatura, dinamiche, pedale.
 */
const trebleTop = (s: SystemBox) => s.y + s.top;
const trebleStaveY = (s: SystemBox) => trebleTop(s) - STAVE_OFFSET;
const trebleBottom = (s: SystemBox) => trebleTop(s) + STAFF_H;
const bassTop = (s: SystemBox) => trebleBottom(s) + s.gap;
const bassStaveY = (s: SystemBox) => bassTop(s) - STAVE_OFFSET;
const bassBottom = (s: SystemBox) => bassTop(s) + STAFF_H;
const systemHeight = (s: SystemBox) => s.top + STAFF_H + s.gap + STAFF_H + s.bottom;

/**
 * Quanto è alto il riquadro dello spartito. Poco più di un sistema e mezzo: si
 * legge la riga corrente e si vede arrivare la prossima, senza mangiarsi lo
 * schermo che serve alla tastiera.
 */
const VIEWPORT_H = 400;
const VIEWPORT_MAX = 540;
/**
 * Quanto si può rimpicciolire una pagina larga prima di farla scorrere di
 * lato: più o meno la misura delle app di spartiti sul telefono in verticale.
 * Per i pezzi così densi si suggerisce di girare il telefono.
 */
const MIN_ZOOM = 0.6;

const MIN_MEASURE_W = 68;

const STEM_UP = 1;
const STEM_DOWN = -1;

const ARTICULATION_CODE: Record<Artic, string> = {
  staccato: 'a.',
  accent: 'a>',
  tenuto: 'a-',
  marcato: 'a^',
  fermata: 'a@a',
};

const DYNAMIC_TEXT: Record<string, string> = {
  pp: 'pp', p: 'p', mp: 'mp', mf: 'mf', f: 'f', ff: 'ff', sf: 'sf',
};

/**
 * Le parole che riguardano il TEMPO vanno sopra il rigo, dove il pianista le
 * cerca; quelle che riguardano il CARATTERE ("dolce", "cantabile") vanno fra i
 * due righi insieme alla dinamica, che è dove le mette qualunque edizione
 * pianistica. Non è pignoleria: sopra il rigo c'è già la diteggiatura, e le due
 * cose si scriverebbero una sull'altra.
 */
const AGOGIC = /\b(rit|ritard|rall|accel|allarg|string|a tempo|tempo|mosso|calando|smorz)/i;

// ── Impaginazione ───────────────────────────────────────────────────────────

interface MeasureBox {
  indices: number[];
  number: number;
  natural: number;
  width: number;
  x: number;
  /** Prima battuta del sistema: porta chiave e armatura. */
  opensSystem: boolean;
}

interface SystemBox {
  measures: MeasureBox[];
  y: number;
  /** Dalla cima del sistema alla prima linea del violino. */
  top: number;
  /** Fra l'ultima linea del violino e la prima del basso. */
  gap: number;
  /** Sotto l'ultima linea del basso. */
  bottom: number;
  /** Righe dei testi sopra il violino (indicazioni, nomi di sezione), in px dalla prima linea. */
  textRow: number;
  sectionRow: number;
  /** Riga delle dinamiche, sotto il violino; riga del pedale, sotto il basso. */
  dynRow: number;
  pedRow: number;
}

/**
 * Lo spazio che chiedono le note di un sistema. In mezzi spazi: la linea più
 * bassa del rigo è 0, la più alta 8. La destra ha i gambi in su (salgono di un
 * gambo sopra la nota più alta), la sinistra in giù.
 */
function measureSystem(piece: Piece, indices: number[], fingering: boolean, sectionStarts: Set<number>) {
  let maxT = -Infinity, minT = Infinity, maxB = -Infinity, minB = Infinity;
  // La diteggiatura di un accordo è una colonna di cifre: una riga per cifra.
  let finR = 0, finL = 0;
  let artR = false, artL = false, dyn = false, agogic = false, ped = false, section = false;
  const digits = (fin: number | number[] | undefined) => (fin === undefined ? 0 : Array.isArray(fin) ? fin.length : 1);
  for (const i of indices) {
    const st = piece.steps[i];
    for (const n of st.treble) { const v = staffSlot(n, 'treble'); maxT = Math.max(maxT, v); minT = Math.min(minT, v); }
    for (const n of st.bass) { const v = staffSlot(n, 'bass'); maxB = Math.max(maxB, v); minB = Math.min(minB, v); }
    if (fingering) {
      finR = Math.max(finR, digits(st.r?.fin));
      finL = Math.max(finL, digits(st.l?.fin));
    }
    if (st.r?.art) artR = true;
    if (st.l?.art) artL = true;
    if (st.dyn || st.hair || (st.text && !AGOGIC.test(st.text))) dyn = true;
    if (st.text && AGOGIC.test(st.text)) agogic = true;
    if (st.ped) ped = true;
    if (sectionStarts.has(i)) section = true;
  }
  if (maxT === -Infinity) { maxT = 4; minT = 4; }
  if (maxB === -Infinity) { maxB = 4; minB = 4; }

  // Sopra il violino: gambi, diteggiatura, poi le righe di testo.
  let above = Math.max(0, (maxT - 8) * HALF_SPACE + STEM);
  above += finR * 11;
  const textRow = above + 14;
  if (agogic) above = textRow;
  const sectionRow = above + 14;
  if (section) above = sectionRow;
  const top = Math.max(44, above + 8);

  // Fra i righi: sotto le note della destra, la fascia delle dinamiche, sopra
  // le note della sinistra (che salgono sopra il Do centrale con le linee aggiuntive).
  const belowT = Math.max(HALF_SPACE, -minT * HALF_SPACE + 7) + (artR ? 10 : 0);
  const aboveB = Math.max(HALF_SPACE, (maxB - 8) * HALF_SPACE + 7) + (artL ? 10 : 0);
  const dynBand = dyn ? 20 : 8;
  const gap = Math.max(40, belowT + dynBand + aboveB);
  const dynRow = belowT + 14;

  // Sotto il basso: gambi in giù, diteggiatura, pedale.
  let below = Math.max(0, -minB * HALF_SPACE + STEM);
  below += finL * 11;
  const pedRow = below + 14;
  if (ped) below = pedRow;
  const bottom = Math.max(26, below + 8);

  return { top, gap, bottom, textRow, sectionRow, dynRow, pedRow };
}

const hasAccidental = (n: string) => parseNote(n).acc !== '';

/**
 * Larghezza "naturale" di una battuta: quanto spazio chiede il suo contenuto.
 * Note lunghe respirano, crome stanno strette. È la stessa logica con cui un
 * incisore decide quante battute stanno in una riga.
 */
function naturalWidth(steps: PieceStep[], indices: number[]): number {
  let w = 18;
  for (const i of indices) {
    const st = steps[i];
    const b = st.beats;
    const base = b >= 4 ? 44 : b >= 3 ? 38 : b >= 2 ? 34 : b >= 1 ? 26 : b >= 0.75 ? 22 : b >= 0.5 ? 20 : 15;
    const acc = st.treble.some(hasAccidental) || st.bass.some(hasAccidental) ? 9 : 0;
    const thick = Math.max(st.treble.length, st.bass.length) > 2 ? 5 : 0;
    w += base + acc + thick;
  }
  return Math.max(MIN_MEASURE_W, w);
}

/**
 * Impagina il pezzo. `minWidths` è lo spazio minimo VERO di ogni battuta,
 * misurato da VexFlow sulle note costruite: la stima a occhio andava bene per
 * le battute semplici, ma dodici crome a due mani con le alterazioni
 * finivano oltre la stanghetta. Una battuta che non entra nello schermo
 * nemmeno da sola si prende la sua larghezza, e lo spartito scorre di lato.
 */
function layout(
  piece: Piece,
  width: number,
  fingering: boolean,
  minWidths: number[],
): { systems: SystemBox[]; height: number; contentWidth: number } {
  const measures = splitMeasures(piece);
  const { signatureCount } = keySpecOf(piece);
  // Chiave + armatura + (solo in testa) indicazione di tempo.
  const prefix = 34 + signatureCount * 11 + 14;
  const avail = Math.max(200, width - MARGIN * 2);

  const systems: SystemBox[] = [];
  let row: MeasureBox[] = [];
  let used = prefix;

  measures.forEach((m, i) => {
    const box: MeasureBox = {
      indices: m.indices,
      number: m.number,
      natural: Math.max(naturalWidth(piece.steps, m.indices), (minWidths[i] ?? 0) + 24),
      width: 0,
      x: 0,
      opensSystem: false,
    };
    // Il tempo si scrive solo all'inizio: occupa spazio solo nel primo sistema.
    const extra = i === 0 ? 26 : 0;
    // Una battuta corta (il levare) non resta da sola su una riga intera,
    // stirata da un margine all'altro: va con la battuta che segue, se ci sta.
    const fits = used + box.natural + extra <= avail;
    if (row.length > 0 && !fits) {
      systems.push(emptySystem(row));
      row = [];
      used = prefix;
    }
    used += box.natural + extra;
    row.push(box);
  });
  if (row.length > 0) systems.push(emptySystem(row));

  const sectionStarts = new Set((piece.sections ?? []).map(sec => sec.from));
  const head = piece.tempoText ? HEAD_H : 0;
  let y = head;
  let contentWidth = width;
  systems.forEach((sys, si) => {
    Object.assign(sys, measureSystem(piece, sys.measures.flatMap(m => m.indices), fingering, sectionStarts));
    sys.y = y;
    y += systemHeight(sys) + SYSTEM_GAP;
    const total = sys.measures.reduce((sum, m) => sum + m.natural, 0);
    const lead = prefix + (si === 0 ? 26 : 0);
    // Mai più stretta del necessario: se non entra, il sistema si allarga.
    const sysAvail = Math.max(avail, lead + total);
    contentWidth = Math.max(contentWidth, sysAvail + MARGIN * 2);
    const room = sysAvail - lead;
    // L'ultimo sistema, e una battuta corta rimasta sola, non si allargano a
    // forza: battute stiracchiate su tutta la riga sono il segno più tipico di
    // una pagina impaginata male.
    const raw = room / total;
    const lonely = sys.measures.length === 1 && total < avail * 0.4;
    const scale = si === systems.length - 1 || lonely ? Math.min(raw, 1.25) : raw;
    let x = MARGIN + prefix + (si === 0 ? 26 : 0);
    sys.measures.forEach((m, mi) => {
      m.opensSystem = mi === 0;
      m.width = m.natural * scale;
      m.x = x;
      x += m.width;
    });
    // La prima battuta si prende anche lo spazio di chiave e armatura.
    const first = sys.measures[0];
    first.x = MARGIN;
    first.width += prefix + (si === 0 ? 26 : 0);
  });

  return { systems, height: y - SYSTEM_GAP + 6, contentWidth: Math.ceil(contentWidth) };
}

/**
 * Quanto rimpicciolire la pagina perché ci stia la battuta più densa. Si
 * sceglie UNA dimensione per tutto il pezzo, come un'edizione stampata: la
 * pagina si impagina più larga e poi si riduce allo schermo, quindi le righe
 * restano piene e ci stanno più battute per riga.
 */
function pageZoom(piece: Piece, width: number, minWidths: number[]): number {
  const { signatureCount } = keySpecOf(piece);
  const lead = 34 + signatureCount * 11 + 14;
  const widths = splitMeasures(piece)
    .map((m, i) => Math.max(naturalWidth(piece.steps, m.indices), (minWidths[i] ?? 0) + 24))
    .sort((a, b) => a - b);
  // Si guarda la battuta al 90° percentile, non la più larga: una fioritura
  // di venti note non deve rimpicciolire tutto il pezzo. Quelle poche
  // battute scorrono di lato, e lo spartito le segue da solo.
  const fit = (w: number) => width / (lead + w + MARGIN * 2);
  // Se basta rimpicciolire poco perché entrino TUTTE, si fa così.
  const all = fit(widths[widths.length - 1] ?? 0);
  if (all >= 0.75) return Math.min(1, all);
  const typical = widths[Math.floor((widths.length - 1) * 0.9)] ?? 0;
  return Math.max(MIN_ZOOM, Math.min(1, fit(typical)));
}

function emptySystem(measures: MeasureBox[]): SystemBox {
  return { measures, y: 0, top: 0, gap: 0, bottom: 0, textRow: 0, sectionRow: 0, dynRow: 0, pedRow: 0 };
}

/** L'armatura nel vocabolario di VexFlow: "Bb", "C#m"… */
function keySpecOf(piece: Piece): { spec: string; signatureCount: number } {
  const spec = piece.key.tonic + (piece.key.mode === 'minore' ? 'm' : '');
  const SHARPS: Record<string, number> = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6 };
  const count = SHARPS[piece.key.tonic] ?? 0;
  // In minore l'armatura è quella della relativa maggiore: tre alterazioni in più.
  const minorCount: Record<string, number> = { A: 0, E: 1, B: 2, 'F#': 3, 'C#': 4, 'G#': 5, D: 1, G: 2, C: 3, F: 4, Bb: 5, Eb: 6 };
  return {
    spec,
    signatureCount: piece.key.mode === 'minore' ? minorCount[piece.key.tonic] ?? 0 : count,
  };
}

// ── Costruzione delle note ──────────────────────────────────────────────────

function buildNote(
  step: PieceStep,
  hand: SingleHand,
  clef: 'treble' | 'bass',
  fingering: boolean,
): StaveNote {
  const notes = notesOf(step, hand);
  const { base, dots } = vexDuration(step.duration);
  const stem = clef === 'treble' ? STEM_UP : STEM_DOWN;

  if (notes.length === 0) {
    const rest = new StaveNote({
      keys: [clef === 'treble' ? 'b/4' : 'd/3'],
      duration: `${base}${'d'.repeat(dots)}r`,
      clef,
    });
    for (let i = 0; i < dots; i++) Dot.buildAndAttach([rest], { all: true });
    return rest;
  }

  const sorted = sortByPitch(notes);
  const note = new StaveNote({
    keys: sorted.map(vexKeyOf),
    duration: `${base}${'d'.repeat(dots)}`,
    clef,
  });
  for (let i = 0; i < dots; i++) Dot.buildAndAttach([note], { all: true });

  try {
    note.setStemDirection(stem);
  } catch {
    /* verso predefinito */
  }

  const marks = marksOf(step, hand);

  if (marks?.art) {
    try {
      // Nel pianoforte i segni stanno dalla parte opposta al gambo, così non
      // finiscono in mezzo alle travature.
      const art = new Articulation(ARTICULATION_CODE[marks.art]);
      art.setPosition(clef === 'treble' ? 3 : 4);
      note.addModifier(art, 0);
    } catch {
      /* un segno mancante non deve far saltare la pagina */
    }
  }

  if (fingering && marks?.fin !== undefined) {
    const digits = Array.isArray(marks.fin) ? marks.fin : [marks.fin];
    digits.forEach((d, i) => {
      if (i >= sorted.length) return;
      try {
        const a = new Annotation(String(d));
        a.setFont('Arial', 9, 'bold');
        a.setVerticalJustification(clef === 'treble' ? Annotation.VerticalJustify.TOP : Annotation.VerticalJustify.BOTTOM);
        note.addModifier(a, i);
      } catch {
        /* la diteggiatura è un aiuto, non un requisito */
      }
    });
  }

  return note;
}

/** Il colore di un passo, secondo dove siamo arrivati e com'è andata. */
function colorOf(
  i: number,
  activeIndex: number,
  results: NoteResult[],
  handActive: boolean,
  foundRatio: number,
  inRange: boolean,
): string {
  if (!inRange) return GHOST;
  if (i < activeIndex) {
    return results[i] === 'wrong' ? BAD : results[i] === 'correct' ? GOOD : INK;
  }
  if (i === activeIndex) {
    if (!handActive) return MUTED;
    // Il passo si scalda man mano che le note dell'accordo arrivano.
    return foundRatio >= 1 ? GOOD : foundRatio > 0 ? HALF : INK;
  }
  return handActive ? UPCOMING : MUTED;
}

/**
 * Applica un colore a tutto ciò che è stato disegnato per un passo.
 *
 * Si scrive sullo `style` di ogni elemento e non sull'attributo, perché la
 * regola CSS di un elemento vince sull'attributo di presentazione che VexFlow
 * gli ha messo addosso al momento del disegno. È il trucco che permette di
 * ricolorare una pagina intera senza ridisegnarla.
 */
function paint(bucket: SVGGElement[] | undefined, color: string): void {
  if (!bucket) return;
  for (const group of bucket) {
    const kids = group.querySelectorAll<SVGElement>('path, rect, text, ellipse, line, polygon');
    for (const el of kids) {
      el.style.fill = color;
      el.style.stroke = color;
    }
    // La nota che suona durante l'ascolto ha anche un alone: si trova con la
    // coda dell'occhio, senza cercarla.
    group.style.filter = color === PLAYING ? `drop-shadow(0 0 3px ${PLAYING})` : '';
  }
}

// ── Il componente ───────────────────────────────────────────────────────────

interface Geom {
  x: number;
  sys: SystemBox;
}

export function GrandStaff({
  piece,
  activeIndex,
  results,
  found = [],
  hand = 'both',
  fingering = true,
  range,
  listening = false,
}: GrandStaffProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const groupsRef = useRef<{ treble: SVGGElement[][]; bass: SVGGElement[][] }>({
    treble: [],
    bass: [],
  });
  const geomRef = useRef<Geom[]>([]);
  /**
   * L'ultimo colore scritto per ogni passo. In un pezzo di 250 passi quasi
   * tutti restano identici da una nota alla successiva: senza questa memoria si
   * riscriverebbero migliaia di proprietà CSS per cambiarne tre.
   */
  const paintedRef = useRef<{ treble: string[]; bass: string[] }>({ treble: [], bass: [] });
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(VIEWPORT_H);
  const [tallest, setTallest] = useState(0);
  const [contentW, setContentW] = useState(0);
  /** Riduzione della pagina, scelta sulla battuta più densa (vedi pageZoom). */
  const [zoom, setZoom] = useState(1);

  // La larghezza decide l'impaginazione, quindi va misurata davvero.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Disegno completo: solo quando cambia il pezzo o la larghezza ──────────
  useEffect(() => {
    const container = svgRef.current;
    if (!container || width < 200 || piece.steps.length === 0) return;
    container.innerHTML = '';

    const { spec } = keySpecOf(piece);
    const n = piece.steps.length;

    // Lo spazio minimo vero di ogni battuta, con le note costruite davvero
    // (alterazioni comprese): l'impaginazione non deve indovinarlo.
    const minWidths = splitMeasures(piece).map(m => {
      try {
        const beatsOf = m.indices.reduce((sum, i) => sum + piece.steps[i].beats, 0);
        const tv = new Voice({ numBeats: Math.max(1, beatsOf), beatValue: 4 }).setMode(Voice.Mode.SOFT);
        tv.addTickables(m.indices.map(i => buildNote(piece.steps[i], 'right', 'treble', fingering)));
        const bv = new Voice({ numBeats: Math.max(1, beatsOf), beatValue: 4 }).setMode(Voice.Mode.SOFT);
        bv.addTickables(m.indices.map(i => buildNote(piece.steps[i], 'left', 'bass', fingering)));
        try {
          Accidental.applyAccidentals([tv, bv], spec);
        } catch {
          /* senza alterazioni automatiche la misura è solo un po' più stretta */
        }
        return new Formatter().joinVoices([tv]).joinVoices([bv]).preCalculateMinTotalWidth([tv, bv]);
      } catch {
        return 0;
      }
    });

    const pz = pageZoom(piece, width, minWidths);
    const { systems, height: total, contentWidth } = layout(piece, Math.floor(width / pz), fingering, minWidths);
    setZoom(pz);
    setHeight(total);
    setTallest(Math.max(...systems.map(systemHeight)));
    setContentW(contentWidth);

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(contentWidth, total);
    const ctx = renderer.getContext();

    const trebleNotes: (StaveNote | null)[] = new Array(n).fill(null);
    const bassNotes: (StaveNote | null)[] = new Array(n).fill(null);
    const groups = {
      treble: Array.from({ length: n }, () => [] as SVGGElement[]),
      bass: Array.from({ length: n }, () => [] as SVGGElement[]),
    };
    const geom: Geom[] = new Array(n);
    const systemOf = new Array<number>(n).fill(0);

    const svgCtx = ctx as unknown as { openGroup?: (c?: string) => SVGGElement; closeGroup?: () => void };
    /** Disegna qualcosa dentro un gruppo SVG e lo appende al passo `i`. */
    const inGroup = (bucket: SVGGElement[][], i: number, draw: () => void) => {
      const g = svgCtx.openGroup?.();
      try {
        draw();
      } catch {
        /* un segno che non si disegna non deve fermare la pagina */
      }
      svgCtx.closeGroup?.();
      if (g && bucket[i]) bucket[i].push(g);
    };

    /** Travature da disegnare, ognuna legata al passo in cui comincia. */
    const beams: { beam: Beam; index: number; hand: SingleHand }[] = [];

    const beamGroups = (() => {
      try {
        return Beam.getDefaultBeamGroups(piece.meter);
      } catch {
        return undefined;
      }
    })();

    // ── Passata 1: costruire e formattare tutto ─────────────────────────────
    interface Drawable {
      trebleStave: Stave;
      bassStave: Stave;
      indices: number[];
      trebleVoice: Voice;
      bassVoice: Voice;
      number: number;
      opensSystem: boolean;
      sys: SystemBox;
    }
    const drawables: Drawable[] = [];

    systems.forEach((sys, si) => {
      sys.measures.forEach(m => {
        const tStave = new Stave(m.x, trebleStaveY(sys), m.width);
        const bStave = new Stave(m.x, bassStaveY(sys), m.width);

        if (m.opensSystem) {
          tStave.addClef('treble');
          bStave.addClef('bass');
          // Una tonalità che VexFlow non conosce non deve far sparire la
          // pagina: si perde l'armatura, non lo spartito.
          if (spec !== 'C' && spec !== 'Am') {
            try {
              tStave.addKeySignature(spec);
              bStave.addKeySignature(spec);
            } catch {
              /* si legge con le alterazioni scritte nota per nota */
            }
          }
          if (si === 0) {
            tStave.addTimeSignature(piece.meter);
            bStave.addTimeSignature(piece.meter);
          }
        }

        // Stanghette speciali richieste dal pezzo (ritornelli, doppia, finale).
        const lastIdx = m.indices[m.indices.length - 1];
        const bar = piece.steps[lastIdx]?.bar;
        if (bar === 'end' || lastIdx === piece.steps.length - 1) {
          tStave.setEndBarType(Barline.type.END);
          bStave.setEndBarType(Barline.type.END);
        } else if (bar === 'double') {
          tStave.setEndBarType(Barline.type.DOUBLE);
          bStave.setEndBarType(Barline.type.DOUBLE);
        } else if (bar === 'repeat') {
          tStave.setEndBarType(Barline.type.REPEAT_END);
          bStave.setEndBarType(Barline.type.REPEAT_END);
        }

        tStave.setContext(ctx);
        bStave.setContext(ctx);
        tStave.format();
        bStave.format();
        // Le due chiavi hanno larghezze diverse: senza allineare l'inizio delle
        // note, le due mani non risultano incolonnate — ed è tutto il punto di
        // un doppio pentagramma.
        const startX = Math.max(tStave.getNoteStartX(), bStave.getNoteStartX());
        tStave.setNoteStartX(startX);
        bStave.setNoteStartX(startX);

        const tNotes = m.indices.map(i => {
          const n = buildNote(piece.steps[i], 'right', 'treble', fingering);
          trebleNotes[i] = n;
          systemOf[i] = si;
          return n;
        });
        const bNotes = m.indices.map(i => {
          const n = buildNote(piece.steps[i], 'left', 'bass', fingering);
          bassNotes[i] = n;
          return n;
        });

        const beats = m.indices.reduce((sum, i) => sum + piece.steps[i].beats, 0);
        const tVoice = new Voice({ numBeats: Math.max(1, beats), beatValue: 4 }).setMode(Voice.Mode.SOFT);
        tVoice.addTickables(tNotes);
        const bVoice = new Voice({ numBeats: Math.max(1, beats), beatValue: 4 }).setMode(Voice.Mode.SOFT);
        bVoice.addTickables(bNotes);

        // Le alterazioni non si scrivono a mano: si deducono dall'armatura e
        // da cosa è già successo nella battuta. Scriverle a mano vuol dire
        // sbagliare i bequadri, che è l'errore che confonde di più chi legge.
        try {
          Accidental.applyAccidentals([tVoice, bVoice], spec);
        } catch {
          /* meglio senza che rotto */
        }

        // Le travature: due crome unite si leggono come un movimento solo.
        // Ognuna resta agganciata al passo in cui comincia, così si spegne e si
        // accende insieme alle sue note.
        const collect = (notes: StaveNote[], stem: number, h: SingleHand) => {
          try {
            const made = Beam.generateBeams(notes, {
              groups: beamGroups,
              stemDirection: stem,
              maintainStemDirections: true,
            });
            made.forEach(beam => {
              const first = beam.getNotes()[0];
              const at = notes.indexOf(first as StaveNote);
              beams.push({ beam, index: m.indices[at < 0 ? 0 : at], hand: h });
            });
          } catch {
            /* senza travature si legge comunque */
          }
        };
        collect(tNotes, STEM_UP, 'right');
        collect(bNotes, STEM_DOWN, 'left');

        const justify = Math.max(40, m.width - (startX - m.x) - 12);
        new Formatter()
          .joinVoices([tVoice])
          .joinVoices([bVoice])
          .format([tVoice, bVoice], justify);

        drawables.push({
          trebleStave: tStave,
          bassStave: bStave,
          indices: m.indices,
          trebleVoice: tVoice,
          bassVoice: bVoice,
          number: m.number,
          opensSystem: m.opensSystem,
          sys,
        });
      });
    });

    // ── Passata 2: disegnare ────────────────────────────────────────────────
    drawables.forEach(d => {
      d.trebleStave.draw();
      d.bassStave.draw();
      if (d.opensSystem) {
        try {
          new StaveConnector(d.trebleStave, d.bassStave).setType(StaveConnector.type.BRACE).setContext(ctx).draw();
          new StaveConnector(d.trebleStave, d.bassStave).setType(StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
        } catch {
          /* senza graffa si legge comunque */
        }
        // Il numero di battuta: serve per dirsi "riprendiamo da 17".
        ctx.save();
        ctx.setFont('Arial', 9, 'normal');
        ctx.setFillStyle(FAINT);
        ctx.fillText(String(d.number), d.trebleStave.getX() + 2, trebleTop(d.sys) - 6);
        ctx.restore();
      }
      // La stanghetta che unisce i due righi: è ciò che rende la battuta unica
      // per tutto lo strumento invece che due battute separate.
      try {
        new StaveConnector(d.trebleStave, d.bassStave).setType(StaveConnector.type.SINGLE_RIGHT).setContext(ctx).draw();
      } catch {
        /* la stanghetta del rigo basta */
      }
    });

    // Le note, una alla volta, ciascuna nel suo gruppo SVG: è ciò che permette
    // poi di ricolorare senza ridisegnare.
    drawables.forEach(d => {
      const drawVoice = (
        voice: Voice,
        stave: Stave,
        bucket: SVGGElement[][],
        notes: (StaveNote | null)[],
        primary: boolean,
      ) => {
        voice.setStave(stave);
        d.indices.forEach(i => {
          const note = notes[i];
          if (!note) return;
          inGroup(bucket, i, () => {
            note.setContext(ctx);
            note.setStave(stave);
            note.draw();
          });
          // La posizione del passo si legge dalla voce superiore: è quella su
          // cui si allinea il cursore.
          if (primary) {
            let x = stave.getNoteStartX();
            try {
              x = note.getAbsoluteX();
            } catch {
              /* stima di riserva */
            }
            geom[i] = { x, sys: d.sys };
          }
        });
      };
      drawVoice(d.trebleVoice, d.trebleStave, groups.treble, trebleNotes, true);
      drawVoice(d.bassVoice, d.bassStave, groups.bass, bassNotes, false);
    });

    beams.forEach(({ beam, index, hand: h }) => {
      inGroup(h === 'right' ? groups.treble : groups.bass, index, () => {
        beam.setContext(ctx).draw();
      });
    });

    // ── Legature ────────────────────────────────────────────────────────────
    const notesFor = (h: SingleHand) => (h === 'right' ? trebleNotes : bassNotes);

    (['right', 'left'] as SingleHand[]).forEach(h => {
      const src = notesFor(h);
      const bucket = h === 'right' ? groups.treble : groups.bass;

      // Di valore: stessa nota che continua. Se le due note finiscono su righe
      // diverse la legatura si spezza in due tronconi, come si fa sulla carta.
      tiePairs(piece.steps, h).forEach(([a, b]) => {
        const na = src[a];
        const nb = src[b];
        if (!na || !nb) return;
        if (systemOf[a] === systemOf[b]) {
          inGroup(bucket, a, () => { new StaveTie({ firstNote: na, lastNote: nb }).setContext(ctx).draw(); });
        } else {
          inGroup(bucket, a, () => { new StaveTie({ firstNote: na }).setContext(ctx).draw(); });
          inGroup(bucket, b, () => { new StaveTie({ lastNote: nb }).setContext(ctx).draw(); });
        }
      });

      // Di frase: l'arco che dice "non staccare il dito". Va dalla parte
      // opposta ai gambi, altrimenti taglia le note.
      slurRuns(piece.steps, h).forEach(([a, b]) => {
        let start = a;
        for (let i = a; i <= b; i++) {
          if (i < b && systemOf[i + 1] === systemOf[start]) continue;
          const nx = src[start];
          const ny = src[i];
          const at = start;
          if (nx && ny && nx !== ny) {
            inGroup(bucket, at, () => {
              new Curve(nx, ny, {
                // Sopra i gambi per la destra, sotto per la sinistra: l'arco
                // scavalca il gruppo invece di passare in mezzo alle teste
                // delle note, che è come si legge su carta.
                invert: h === 'left',
                position: Curve.Position.NEAR_HEAD,
                yShift: h === 'right' ? -3 : 3,
              })
                .setContext(ctx)
                .draw();
            });
          }
          start = i + 1;
        }
      });
    });

    // ── Dinamiche, forcelle, testi, pedale ──────────────────────────────────
    // Stanno fra i due righi (le dinamiche) o fuori (testi e pedale), e restano
    // sempre in nero: sono indicazioni stampate, non note da suonare.
    const gapY = (i: number) => trebleBottom(geom[i].sys) + geom[i].sys.dynRow;

    piece.steps.forEach((step, i) => {
      const g = geom[i];
      if (!g) return;

      if (step.dyn) {
        ctx.save();
        ctx.setFont('Georgia', 14, 'bold', 'italic');
        ctx.setFillStyle(INK);
        ctx.fillText(DYNAMIC_TEXT[step.dyn] ?? step.dyn, g.x - 4, gapY(i));
        ctx.restore();
      }

      if (step.text) {
        const agogic = AGOGIC.test(step.text);
        ctx.save();
        ctx.setFont('Georgia', 11, 'normal', 'italic');
        ctx.setFillStyle(MARK);
        ctx.fillText(
          step.text,
          // Accanto alla dinamica, se in questo punto ce n'è una.
          agogic ? g.x - 4 : g.x + (step.dyn ? 20 : -4),
          agogic ? trebleTop(g.sys) - g.sys.textRow : gapY(i),
        );
        ctx.restore();
      }

      if (step.ped) {
        ctx.save();
        ctx.setFont('Georgia', 10, 'normal', 'italic');
        ctx.setFillStyle(MARK);
        ctx.fillText(step.ped === 'down' ? 'Ped.' : '✳', g.x - 4, bassBottom(g.sys) + g.sys.pedRow);
        ctx.restore();
      }
    });

    // Le forcelle si disegnano solo dentro una riga: a cavallo di due righe si
    // interrompono al margine, che è anche come si fa sulla carta.
    let openAt = -1;
    let openKind: 'cresc' | 'dim' | null = null;
    piece.steps.forEach((step, i) => {
      if (step.hair === 'cresc' || step.hair === 'dim') {
        openAt = i;
        openKind = step.hair;
        return;
      }
      if (openAt < 0 || !openKind) return;
      const closes = step.hair === 'end' || !!step.dyn || i === piece.steps.length - 1;
      if (!closes) return;
      const a = geom[openAt];
      const b = geom[i];
      if (a && b && systemOf[openAt] === systemOf[i] && b.x - a.x > 14) {
        const y = gapY(openAt);
        const h = 4;
        ctx.save();
        ctx.setLineWidth(1);
        ctx.setStrokeStyle(MARK);
        ctx.beginPath();
        if (openKind === 'cresc') {
          ctx.moveTo(b.x, y - h); ctx.lineTo(a.x, y); ctx.lineTo(b.x, y + h);
        } else {
          ctx.moveTo(a.x, y - h); ctx.lineTo(b.x, y); ctx.lineTo(a.x, y + h);
        }
        ctx.stroke();
        ctx.restore();
      }
      openAt = -1;
      openKind = null;
    });

    // I nomi delle sezioni: in un pezzo lungo dicono dove ci si trova. Stanno
    // sopra il numero di battuta, sulla riga più alta del sistema.
    piece.sections?.forEach(sec => {
      const g = geom[sec.from];
      if (!g) return;
      // Se la sezione apre una riga, il nome va al margine: sopra le note c'è
      // la colonna della diteggiatura, e i due si scriverebbero uno sull'altro.
      const opensRow = sec.from === 0 || systemOf[sec.from - 1] !== systemOf[sec.from];
      ctx.save();
      ctx.setFont('Arial', 10, 'bold');
      ctx.setFillStyle('#b45309');
      ctx.fillText(sec.name, opensRow ? MARGIN + 2 : g.x - 6, trebleTop(g.sys) - g.sys.sectionRow);
      ctx.restore();
    });

    // L'indicazione di andamento, in testa alla pagina e non a una battuta.
    if (piece.tempoText) {
      ctx.save();
      ctx.setFont('Georgia', 13, 'bold', 'italic');
      ctx.setFillStyle(INK);
      ctx.fillText(piece.tempoText, MARGIN + 2, HEAD_H - 6);
      ctx.restore();
    }

    groupsRef.current = groups;
    geomRef.current = geom;
    // Elementi nuovi, nessun colore ancora scritto: la memoria riparte vuota.
    paintedRef.current = { treble: [], bass: [] };

    return () => {
      container.innerHTML = '';
      groupsRef.current = { treble: [], bass: [] };
      geomRef.current = [];
      paintedRef.current = { treble: [], bass: [] };
    };
  }, [piece, width, fingering]);

  // ── Aggiornamento leggero: colori e cursore ───────────────────────────────
  const repaint = useCallback(() => {
    const { treble, bass } = groupsRef.current;
    if (treble.length === 0) return;
    const rightActive = hand !== 'left';
    const leftActive = hand !== 'right';
    const from = range?.from ?? 0;
    const to = range?.to ?? piece.steps.length;

    const step = piece.steps[activeIndex];
    const ratioFor = (h: SingleHand): number => {
      if (!step) return 0;
      const need = notesOf(step, h).length;
      if (need === 0) return 0;
      const got = notesOf(step, h).filter(n => found.includes(n)).length;
      return got / need;
    };
    const rRatio = ratioFor('right');
    const lRatio = ratioFor('left');

    const memo = paintedRef.current;
    // In ascolto il passo che suona si accende; quelli già passati tornano
    // neri (i colori giusto/sbagliato sono dell'esercizio, non dell'ascolto).
    const listenColor = (i: number, active: boolean, inRange: boolean) =>
      !inRange ? GHOST : !active ? MUTED : i === activeIndex ? PLAYING : i < activeIndex ? INK : UPCOMING;
    for (let i = 0; i < piece.steps.length; i++) {
      const inRange = i >= from && i < to;
      const cr = listening ? listenColor(i, rightActive, inRange) : colorOf(i, activeIndex, results, rightActive, rRatio, inRange);
      const cl = listening ? listenColor(i, leftActive, inRange) : colorOf(i, activeIndex, results, leftActive, lRatio, inRange);
      if (memo.treble[i] !== cr) { paint(treble[i], cr); memo.treble[i] = cr; }
      if (memo.bass[i] !== cl) { paint(bass[i], cl); memo.bass[i] = cl; }
    }

    const cursor = cursorRef.current;
    const g = geomRef.current[activeIndex];
    if (cursor && g && !listening) {
      cursor.style.opacity = '1';
      cursor.style.left = `${g.x - 16}px`;
      cursor.style.top = `${trebleTop(g.sys) - 8}px`;
      cursor.style.height = `${bassBottom(g.sys) - trebleTop(g.sys) + 16}px`;
    } else if (cursor) {
      cursor.style.opacity = '0';
    }
  }, [piece.steps, activeIndex, results, found, hand, range, listening]);

  useEffect(() => {
    repaint();
  }, [repaint, width, fingering]);

  // Tiene in vista la riga che si sta suonando (non la singola nota: sulla
  // carta si guarda il sistema, non il centimetro).
  useEffect(() => {
    const el = scrollRef.current;
    const g = geomRef.current[activeIndex];
    if (!el || !g) return;
    // Ci si ferma una ventina di pixel sopra il sistema, non al suo bordo:
    // lassù ci sono la diteggiatura e i segni di espressione, e fermarsi esatti
    // li taglierebbe via proprio mentre servono.
    const z = zoom;
    const target = Math.max(0, (g.sys.y - 6) * z);
    // Di lato si scorre solo se una battuta larga ha allargato la pagina.
    const x = g.x * z;
    const left = x < el.scrollLeft + 24 || x > el.scrollLeft + el.clientWidth - 40
      ? Math.max(0, x - el.clientWidth * 0.3)
      : el.scrollLeft;
    if (Math.abs(el.scrollTop - target) > 8 || left !== el.scrollLeft) {
      el.scrollTo({ top: target, left, behavior: 'smooth' });
    }
  }, [activeIndex, width, zoom]);

  // Un sistema alto (note molto acute o molto gravi) non deve uscire dal riquadro.
  const viewH = Math.min(height * zoom, Math.min(VIEWPORT_MAX, Math.max(VIEWPORT_H, Math.round(tallest * zoom * 1.35))));

  return (
    <div ref={wrapRef} className="w-full">
      <div
        ref={scrollRef}
        className="thin-scroll w-full overflow-auto overscroll-contain rounded-2xl border border-amber-300/40 shadow-inner"
        style={{
          height: viewH,
          background: 'linear-gradient(180deg, var(--c-paper) 0%, var(--c-paper2) 100%)',
        }}
      >
        <div className="relative" style={{ width: contentW ? contentW * zoom : '100%', height: height * zoom }}>
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: contentW || '100%', height, transform: zoom !== 1 ? `scale(${zoom})` : undefined }}
          >
            <div
              ref={cursorRef}
              className="pointer-events-none absolute rounded-lg border-2 border-brand/40 bg-brand/5 transition-[left,top] duration-150"
              style={{ left: 0, top: 0, width: 32, height: 120, opacity: 0 }}
            />
            <div ref={svgRef} className="absolute inset-0" />
          </div>
        </div>
      </div>
      {zoom < 0.72 && width < 500 && (
        <p className="mt-1.5 px-1 text-center text-[11px] text-ink3">
          Spartito fitto: gira il telefono in orizzontale per vederlo più grande.
        </p>
      )}
    </div>
  );
}
