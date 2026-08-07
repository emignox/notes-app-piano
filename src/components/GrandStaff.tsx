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
import { parseNote, sortByPitch, vexKeyOf } from '../lib/notes';
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
}

// ── Colori ──────────────────────────────────────────────────────────────────

const INK = '#101828';
const GOOD = '#15803d';
const HALF = '#65a30d';
const BAD = '#dc2626';
const GHOST = '#94a3b840';
const MUTED = '#94a3b880';
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
/** Aria sopra al riquadro dei 40 px: nomi di sezione e indicazioni. */
const TOP_PAD = 10;
/**
 * Sopra il rigo di violino si accalcano tre cose diverse. Hanno una fascia
 * ciascuna, misurata dalla prima linea, altrimenti si scrivono una sull'altra:
 * la diteggiatura la mette VexFlow subito sopra le note, e le altre due vanno
 * più in alto.
 */
const TEXT_BAND = -26;
const SECTION_BAND = -40;
/** Altezza di un pentagramma (quattro spazi da dieci). */
const STAFF_H = 40;
/** Fra l'ultima linea del violino e la prima del basso: dinamiche e forcelle. */
const INNER_GAP = 46;
/**
 * Sotto l'ultima linea del basso: pedale e diteggiatura sinistra. È largo
 * perché la diteggiatura VexFlow la mette sopra i GAMBI, e un gambo lungo la
 * spinge in alto di una sessantina di pixel: se questo spazio non basta, le
 * cifre del sistema seguente finiscono addosso al pedale di questo.
 */
const BOTTOM_PAD = 34;
// Lo scarto dei 40 px si conta UNA volta sola: il rigo di basso è posizionato
// in modo che il proprio scarto cada dentro lo spazio fra i due righi.
const SYSTEM_H = TOP_PAD + STAFF_H + INNER_GAP + STAVE_OFFSET + STAFF_H + BOTTOM_PAD;
const SYSTEM_GAP = 8;
/** Riga in cima alla pagina per l'indicazione di andamento. */
const HEAD_H = 24;

/** Le quote verticali di un sistema, tutte ricavate dalla sua `y`. */
const trebleStaveY = (systemY: number) => systemY + TOP_PAD;
const trebleTop = (systemY: number) => trebleStaveY(systemY) + STAVE_OFFSET;
const trebleBottom = (systemY: number) => trebleTop(systemY) + STAFF_H;
const bassStaveY = (systemY: number) => trebleStaveY(systemY) + STAFF_H + INNER_GAP;
const bassBottom = (systemY: number) => bassStaveY(systemY) + STAVE_OFFSET + STAFF_H;

/**
 * Quanto è alto il riquadro dello spartito. Poco più di un sistema e mezzo: si
 * legge la riga corrente e si vede arrivare la prossima, senza mangiarsi lo
 * schermo che serve alla tastiera.
 */
const VIEWPORT_H = 400;

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

function layout(piece: Piece, width: number): { systems: SystemBox[]; height: number } {
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
      natural: naturalWidth(piece.steps, m.indices),
      width: 0,
      x: 0,
      opensSystem: false,
    };
    // Il tempo si scrive solo all'inizio: occupa spazio solo nel primo sistema.
    const extra = i === 0 ? 26 : 0;
    if (row.length > 0 && used + box.natural + extra > avail) {
      systems.push({ measures: row, y: 0 });
      row = [];
      used = prefix;
    }
    used += box.natural + extra;
    row.push(box);
  });
  if (row.length > 0) systems.push({ measures: row, y: 0 });

  const head = piece.tempoText ? HEAD_H : 0;
  systems.forEach((sys, si) => {
    sys.y = head + si * (SYSTEM_H + SYSTEM_GAP);
    const total = sys.measures.reduce((sum, m) => sum + m.natural, 0);
    const room = avail - prefix - (si === 0 ? 26 : 0);
    // L'ultimo sistema non si allarga a forza: due battute stiracchiate su
    // tutta la riga sono il segno più tipico di una pagina impaginata male.
    const raw = room / total;
    const scale = si === systems.length - 1 ? Math.min(raw, 1.25) : raw;
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

  const height = head + systems.length * SYSTEM_H + (systems.length - 1) * SYSTEM_GAP + 6;
  return { systems, height };
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
  return GHOST;
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
  }
}

// ── Il componente ───────────────────────────────────────────────────────────

interface Geom {
  x: number;
  systemY: number;
}

export function GrandStaff({
  piece,
  activeIndex,
  results,
  found = [],
  hand = 'both',
  fingering = true,
  range,
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
  const [height, setHeight] = useState(SYSTEM_H);

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

    const { systems, height: total } = layout(piece, width);
    setHeight(total);

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, total);
    const ctx = renderer.getContext();

    const { spec } = keySpecOf(piece);
    const n = piece.steps.length;

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
      systemY: number;
    }
    const drawables: Drawable[] = [];

    systems.forEach((sys, si) => {
      sys.measures.forEach(m => {
        const tStave = new Stave(m.x, trebleStaveY(sys.y), m.width);
        const bStave = new Stave(m.x, bassStaveY(sys.y), m.width);

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
          systemY: sys.y,
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
        ctx.fillText(String(d.number), d.trebleStave.getX() + 2, trebleTop(d.systemY) - 6);
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
            geom[i] = { x, systemY: d.systemY };
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
    const gapY = (i: number) => trebleBottom(geom[i].systemY) + INNER_GAP / 2 + 5;

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
          agogic ? trebleTop(g.systemY) + TEXT_BAND : gapY(i),
        );
        ctx.restore();
      }

      if (step.ped) {
        ctx.save();
        ctx.setFont('Georgia', 10, 'normal', 'italic');
        ctx.setFillStyle(MARK);
        ctx.fillText(step.ped === 'down' ? 'Ped.' : '✳', g.x - 4, bassBottom(g.systemY) + 20);
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
      ctx.fillText(sec.name, opensRow ? MARGIN + 2 : g.x - 6, trebleTop(g.systemY) + SECTION_BAND);
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
    for (let i = 0; i < piece.steps.length; i++) {
      const inRange = i >= from && i < to;
      const cr = colorOf(i, activeIndex, results, rightActive, rRatio, inRange);
      const cl = colorOf(i, activeIndex, results, leftActive, lRatio, inRange);
      if (memo.treble[i] !== cr) { paint(treble[i], cr); memo.treble[i] = cr; }
      if (memo.bass[i] !== cl) { paint(bass[i], cl); memo.bass[i] = cl; }
    }

    const cursor = cursorRef.current;
    const g = geomRef.current[activeIndex];
    if (cursor && g) {
      cursor.style.opacity = '1';
      cursor.style.left = `${g.x - 16}px`;
      cursor.style.top = `${trebleTop(g.systemY) - 8}px`;
      cursor.style.height = `${bassBottom(g.systemY) - trebleTop(g.systemY) + 16}px`;
    } else if (cursor) {
      cursor.style.opacity = '0';
    }
  }, [piece.steps, activeIndex, results, found, hand, range]);

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
    const target = Math.max(0, g.systemY - 20);
    if (Math.abs(el.scrollTop - target) > 8) {
      el.scrollTo({ top: target, behavior: 'smooth' });
    }
  }, [activeIndex, width]);

  const viewH = Math.min(height, VIEWPORT_H);

  return (
    <div ref={wrapRef} className="w-full">
      <div
        ref={scrollRef}
        className="thin-scroll w-full overflow-y-auto overflow-x-hidden rounded-2xl border border-amber-300/40 shadow-inner"
        style={{
          height: viewH,
          background: 'linear-gradient(180deg, var(--c-paper) 0%, var(--c-paper2) 100%)',
        }}
      >
        <div className="relative" style={{ width: '100%', height }}>
          <div
            ref={cursorRef}
            className="pointer-events-none absolute rounded-lg border-2 border-brand/40 bg-brand/5 transition-[left,top] duration-150"
            style={{ left: 0, top: 0, width: 32, height: 120, opacity: 0 }}
          />
          <div ref={svgRef} className="absolute inset-0" />
        </div>
      </div>
    </div>
  );
}
