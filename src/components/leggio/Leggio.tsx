// ─────────────────────────────────────────────────────────────────────────────
// Il Leggio: lo spartito a tutto schermo, pensato per telefono e iPad.
//
// Quello che fanno le app a pagamento, qui gratis:
//  · UNA riga di pentagramma, grande, che scorre da sola sotto una linea fissa
//    — niente pagine da girare, niente note minuscole;
//  · la tastiera in basso si accende sui tasti da premere, col nome scritto;
//  · la CASCATA: le note scendono sulla tastiera e la toccano quando vanno
//    suonate;
//  · ASCOLTA: il brano suona e le note si accendono sul loro rigo;
//  · ESERCITA: il brano aspetta te. Va avanti solo quando suoni le note
//    accese (toccando la tastiera o sul piano vero col microfono). Se studi
//    una mano sola, l'altra la suona l'app, a tempo;
//  · un gruppo di battute da ripetere, alla velocità che serve.
//
// Le note, i tempi e le mani non sono scritti due volte: si leggono dalla
// partitura stessa, dopo il disegno, scorrendola con il cursore di OSMD.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { ChevronLeft, ChevronRight, ChevronsDown, FileMusic, Hand as HandIcon, Mic, MicOff, Minus, Pause, Play, Plus, RotateCcw, Rows2, Target, X } from 'lucide-react';
import type { LibraryEntry } from '../../data/library';
import { LEVEL_LABEL, composerStyle } from '../../data/library';
import { PORTRAIT } from '../../data/images';
import { pieceToMusicXml } from '../../lib/pieceToMusicXml';
import type { AudioApi } from '../../hooks/useAudio';
import type { ProgressApi } from '../../hooks/useProgress';
import type { ChordMatch } from '../../hooks/usePitchDetection';
import { haptics } from '../../lib/haptics';
import { Cascade } from './Cascade';
import type { FallingNote } from './Cascade';
import { LeggioKeyboard } from './LeggioKeyboard';
import { BAD_COLOR, GOOD_COLOR, HAND_COLOR, midiName, midiTone, whiteKeysFor, windowFor } from './keys';

interface MicApi {
  isListening: boolean;
  expect: (notes: number[] | null, token?: string) => void;
  chordMatch: ChordMatch | null;
  suppress: (ms?: number) => void;
}

interface Props {
  entry: LibraryEntry;
  audio: AudioApi;
  mic: MicApi;
  progress: ProgressApi;
  onClose: () => void;
  onToggleMic?: () => void;
  /** Per i pezzi dell'app: lo studio guidato a sezioni. */
  onGuided?: () => void;
}

type View = 'spartito' | 'cascata' | 'entrambi';
const VIEW_LABEL: Record<View, string> = { spartito: 'Spartito', entrambi: 'Tutti e due', cascata: 'Cascata' };
type HandSel = 'both' | 'right' | 'left';
type Mode = 'idle' | 'listen' | 'practice' | 'done';

interface TNote {
  midi: number;
  staff: number;
  /** In movimenti (semiminime) dall'inizio. */
  start: number;
  dur: number;
  grace: boolean;
  /** Continuazione di una legatura di valore: non si ribatte. */
  cont: boolean;
  svg: SVGGElement | null;
  /** La testa di QUESTA nota (negli accordi il gruppo SVG è uno solo). */
  head: SVGGElement | null;
  /** Il nome come è scritto: Si♭ e non La♯, se la partitura dice si bemolle. */
  name: string;
}

interface TStep {
  beat: number;
  measure: number;
  notes: TNote[];
}

// Le parti di OSMD che servono, tipizzate il minimo indispensabile.
interface OsmdNote {
  halfTone: number;
  Pitch?: { FundamentalNote: number; AccidentalHalfTones: number };
  IsGraceNote?: boolean;
  isRest(): boolean;
  Length: { RealValue: number };
  NoteTie?: { StartNote: OsmdNote; Notes: OsmdNote[] } | null;
  ParentStaff?: { idInMusicSheet: number };
}
interface OsmdGNote {
  sourceNote?: OsmdNote;
  getSVGGElement?: () => SVGGElement;
}

const SOLFEGE: Record<number, string> = { 0: 'Do', 2: 'Re', 4: 'Mi', 5: 'Fa', 7: 'Sol', 9: 'La', 11: 'Si' };

/** Il nome della nota con l'alterazione scritta in partitura. */
function spelled(n: OsmdNote, midi: number): string {
  const base = n.Pitch ? SOLFEGE[n.Pitch.FundamentalNote] : undefined;
  if (!base || !n.Pitch) return midiName(midi);
  const a = Math.round(n.Pitch.AccidentalHalfTones);
  return base + (a > 0 ? '♯'.repeat(a) : '♭'.repeat(-a));
}

/** Le note che non tocca a te: grigie, ma sempre leggibili. */
const MUTED = '#94a3b8';

const allows = (hand: HandSel, staff: number) => hand === 'both' || (hand === 'right' ? staff === 0 : staff !== 0);

/** Scorre tutta la partitura col cursore e ne ricava la sequenza delle note. */
function extract(osmd: OpenSheetMusicDisplay): TStep[] {
  const c = osmd.cursor;
  c.reset();
  c.show();
  const steps: TStep[] = [];
  let guard = 0;
  while (!c.iterator.EndReached && guard++ < 60000) {
    const beat = c.iterator.CurrentEnrolledTimestamp.RealValue * 4;
    const measure = c.iterator.CurrentMeasureIndex;
    const notes: TNote[] = [];
    for (const g of c.GNotesUnderCursor() as unknown as OsmdGNote[]) {
      const n = g.sourceNote;
      if (!n || n.isRest()) continue;
      const tie = n.NoteTie;
      const cont = !!tie && tie.StartNote !== n;
      const len = tie && !cont ? tie.Notes.reduce((s, x) => s + x.Length.RealValue, 0) : n.Length.RealValue;
      const grace = !!n.IsGraceNote;
      const midi = n.halfTone + 12;
      notes.push({
        midi,
        name: spelled(n, midi),
        staff: n.ParentStaff?.idInMusicSheet ?? 0,
        start: grace ? beat - 0.12 : beat,
        dur: grace ? 0.1 : len * 4,
        grace,
        cont,
        svg: g.getSVGGElement?.() ?? null,
        head: null,
      });
    }
    // Le teste dell'accordo, dal basso in alto, vanno alle note dalla più grave.
    const groups = new Map<SVGGElement, TNote[]>();
    for (const n of notes) if (n.svg) groups.set(n.svg, [...(groups.get(n.svg) ?? []), n]);
    for (const [el, ns] of groups) {
      const heads = Array.from(el.querySelectorAll<SVGGElement>('.vf-notehead'));
      if (heads.length !== ns.length) continue;
      const mid = (h: SVGGElement) => { const b = h.getBBox(); return b.y + b.height / 2; };
      heads.sort((a, b) => mid(b) - mid(a));
      [...ns].sort((a, b) => a.midi - b.midi).forEach((n, i) => { n.head = heads[i]; });
    }
    steps.push({ beat, measure, notes });
    c.next();
  }
  c.hide();
  return steps;
}

/** Accende una nota sul rigo: colore sullo stile (vince su OSMD) e un alone. */
function paint(el: SVGGElement | null, color: string | null) {
  if (!el) return;
  const els = [el, ...Array.from(el.querySelectorAll<SVGElement>('path, ellipse, rect, polygon'))];
  for (const e of els) {
    if (color) {
      e.style.setProperty('fill', color, 'important');
      e.style.setProperty('stroke', color, 'important');
    } else {
      e.style.removeProperty('fill');
      e.style.removeProperty('stroke');
    }
  }
  el.style.filter = color ? `drop-shadow(0 0 4px ${color})` : '';
}

export function Leggio({ entry, audio, mic, progress, onClose, onToggleMic, onGuided }: Props) {
  const style = composerStyle(entry.composer);
  const tall = typeof window !== 'undefined' && window.innerHeight > window.innerWidth * 1.15;
  const [view, setView] = useState<View>(tall ? 'entrambi' : 'spartito');
  const [hand, setHand] = useState<HandSel>('both');
  const [rate, setRate] = useState(entry.startRate);
  const [mode, setMode] = useState<Mode>('idle');
  const [steps, setSteps] = useState<TStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [loop, setLoop] = useState<number | null>(null);
  const [found, setFound] = useState<number[]>([]);
  const [badKey, setBadKey] = useState<number | null>(null);
  const [result, setResult] = useState<{ pct: number; secs: number; notes: number } | null>(null);
  const [win, setWin] = useState<[number, number]>([48, 72]);
  const [names, setNames] = useState(entry.level <= 2);
  /** Dove stanno i righi (in px dentro lo spartito), per le etichette delle mani. */
  const [staffTops, setStaffTops] = useState<{ top: number; height: number }[]>([]);

  const host = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const keysBox = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const lit = useRef<SVGGElement[]>([]);
  const spotLayer = useRef<HTMLDivElement>(null);
  const nameLayer = useRef<HTMLDivElement>(null);
  /** Altezza dello spartito a grandezza 1: cresce in proporzione allo zoom. */
  const h1 = useRef(0);
  const scrollTarget = useRef(0);
  const scrollTargetY = useRef<number | null>(null);
  const play = useRef({ start: 0, t0: 0, spb: 0.5 });
  const shownBeat = useRef(0);
  const practice = useRef({ errors: 0, total: 0, stepError: false, startedAt: 0 });
  const micBase = useRef(mic.chordMatch?.id ?? 0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const spb = 60 / (entry.bpm * rate);

  // ── Caricamento e disegno ─────────────────────────────────────────────────
  /**
   * Disegna lo spartito alla grandezza giusta per lo spazio che ha: il rigo
   * deve riempire l'altezza, ma sul telefono in verticale deve restare
   * visibile almeno una battuta. Ridisegnare crea nuovi elementi SVG, quindi
   * le note si rileggono dalla partitura ogni volta.
   */
  const fit = useCallback(() => {
    const osmd = osmdRef.current;
    const box = scroller.current;
    if (!osmd || !box || box.clientHeight < 40) return;
    if (!h1.current) {
      osmd.zoom = 1;
      osmd.render();
      h1.current = host.current?.querySelector('svg')?.getBoundingClientRect().height ?? 250;
    }
    const byHeight = (box.clientHeight * 0.94) / Math.max(100, h1.current);
    const byWidth = window.innerWidth / 260;
    osmd.zoom = Math.max(0.6, Math.min(2.6, byHeight, byWidth));
    osmd.render();
    setSteps(extract(osmd));
    const lines = (osmd.GraphicSheet as unknown as { MusicPages: { MusicSystems: { StaffLines: { PositionAndShape: { AbsolutePosition: { y: number } } }[] }[] }[] })
      .MusicPages[0]?.MusicSystems[0]?.StaffLines ?? [];
    setStaffTops(lines.map(l => ({ top: l.PositionAndShape.AbsolutePosition.y * 10 * osmd.zoom, height: 40 * osmd.zoom })));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { OpenSheetMusicDisplay: Osmd } = await import('opensheetmusicdisplay');
        const xml = entry.source.kind === 'piece'
          ? pieceToMusicXml(entry.source.piece)
          : await (await fetch(entry.source.url)).text();
        if (cancelled || !host.current) return;
        host.current.innerHTML = '';
        const osmd = new Osmd(host.current, {
          backend: 'svg',
          autoResize: false,
          renderSingleHorizontalStaffline: true,
          autoBeam: entry.source.kind === 'piece',
          drawTitle: false,
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawCredits: false,
          drawPartNames: false,
          drawPartAbbreviations: false,
          drawMeasureNumbers: true,
          drawMeasureNumbersOnlyAtSystemStart: false,
          followCursor: false,
          cursorsOptions: [{ type: 0, color: '#6366f1', alpha: 0, follow: false }],
        });
        // Margini minimi: lo spazio in altezza va tutto al rigo.
        osmd.EngravingRules.PageTopMargin = 2;
        osmd.EngravingRules.PageBottomMargin = 2;
        osmd.EngravingRules.PageLeftMargin = 1;
        osmd.EngravingRules.PageRightMargin = 1;
        // Una riga sola anche per i brani lunghi: di suo OSMD va a capo dopo
        // 32767 px, e il rigo della destra finirebbe fuori dallo schermo.
        osmd.EngravingRules.SheetMaximumWidth = 4_000_000;
        await osmd.load(xml);
        if (cancelled) return;
        osmdRef.current = osmd;
        h1.current = 0;
        fit();
        setLoading(false);
      } catch (e) {
        console.error(e);
        if (!cancelled) { setFailed(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; osmdRef.current = null; };
  }, [entry]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rotazione dell'iPad o del telefono: si ridisegna per il nuovo spazio.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => { clearTimeout(t); t = setTimeout(fit, 250); };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, [fit]);

  const changeView = (v: View) => {
    setView(v);
    if (v !== 'cascata') requestAnimationFrame(() => requestAnimationFrame(fit));
  };

  // ── Battute e anelli di ripetizione ───────────────────────────────────────
  const measureCount = useMemo(() => steps.reduce((m, s) => Math.max(m, s.measure + 1), 0), [steps]);
  const loops = useMemo(() => {
    const out: { label: string; from: number; to: number }[] = [];
    for (let m = 0; m < measureCount; m += 4) out.push({ label: `${m + 1}–${Math.min(measureCount, m + 4)}`, from: m, to: Math.min(measureCount - 1, m + 3) });
    return out;
  }, [measureCount]);

  /** Il tratto di passi da suonare: il brano intero o il gruppo di battute scelto. */
  const range = useMemo((): [number, number] => {
    if (loop === null || !loops[loop]) return [0, steps.length];
    const { from, to } = loops[loop];
    const a = steps.findIndex(s => s.measure >= from && s.measure <= to);
    if (a < 0) return [0, steps.length];
    let b = a;
    while (b < steps.length && steps[b].measure >= from && steps[b].measure <= to) b++;
    return [a, b];
  }, [loop, loops, steps]);

  const required = useCallback(
    (i: number) => [...new Set((steps[i]?.notes ?? []).filter(n => !n.cont && !n.grace && allows(hand, n.staff)).map(n => n.midi))],
    [steps, hand],
  );
  const nextRequired = useCallback(
    (from: number) => {
      for (let i = from; i < range[1]; i++) if (required(i).length > 0) return i;
      return -1;
    },
    [required, range],
  );

  const stopAll = useCallback(() => {
    audio.stopSequence();
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, [audio]);
  useEffect(() => () => stopAll(), [stopAll]);

  // ── Ascolta ───────────────────────────────────────────────────────────────
  const listen = useCallback(async () => {
    stopAll();
    await audio.initialize();
    const [a, b] = range;
    if (a >= b) return;
    const t0 = steps[a].beat;
    const events = [];
    for (let i = a; i < b; i++) {
      for (const n of steps[i].notes) {
        if (n.cont || !allows(hand, n.staff)) continue;
        events.push({
          notes: [midiTone(n.midi)],
          at: Math.max(0, (n.start - t0) * spb),
          hold: Math.max(0.06, n.dur * spb * 0.96),
          velocity: n.staff === 0 ? 0.64 : 0.5,
          stepIndex: i,
        });
      }
    }
    if (events.length === 0) return;
    const times = steps.slice(a, b).map(s => (s.beat - t0) * spb);
    play.current = { start: performance.now() + 120, t0, spb };
    mic.suppress(Math.ceil(((steps[b - 1].beat - t0) * spb + 2) * 1000));
    setResult(null);
    setMode('listen');
    setIdx(a);
    audio.playPerformance(events, times, i => setIdx(a + i), () => setMode(m => (m === 'listen' ? 'idle' : m)));
  }, [audio, stopAll, range, steps, hand, spb, mic]);

  // ── Esercita ──────────────────────────────────────────────────────────────
  const startPractice = useCallback(async () => {
    stopAll();
    await audio.initialize();
    const first = nextRequired(range[0]);
    if (first < 0) return;
    practice.current = { errors: 0, total: 0, stepError: false, startedAt: performance.now() };
    setFound([]);
    setResult(null);
    setIdx(first);
    setMode('practice');
  }, [audio, stopAll, nextRequired, range]);

  /** L'altra mano, suonata dall'app: le note di questo passo e di quelli fino al prossimo tuo. */
  const accompany = useCallback(
    (from: number, to: number) => {
      if (hand === 'both') return;
      const t0 = steps[from].beat;
      const events = [];
      for (let i = from; i < to && i < steps.length; i++) {
        for (const n of steps[i].notes) {
          if (n.cont || allows(hand, n.staff)) continue;
          events.push({ notes: [midiTone(n.midi)], at: Math.max(0, (n.start - t0) * spb), hold: Math.max(0.06, n.dur * spb * 0.95), velocity: 0.42, stepIndex: i });
        }
      }
      // Il microfono sente anche l'altoparlante, ma cerca solo le note della
      // tua mano: quelle dell'accompagnamento non le aspetta.
      if (events.length) audio.playPerformance(events, []);
    },
    [hand, steps, spb, audio],
  );

  const completeStep = useCallback(() => {
    const p = practice.current;
    p.total += 1;
    if (p.stepError) p.errors += 1;
    p.stepError = false;
    const next = nextRequired(idx + 1);
    accompany(idx, next < 0 ? range[1] : next);
    setFound([]);
    if (next < 0) {
      const pct = p.total ? Math.round(((p.total - p.errors) / p.total) * 100) : 0;
      const secs = Math.round((performance.now() - p.startedAt) / 1000);
      setResult({ pct, secs, notes: p.total });
      setMode('done');
      if (pct >= 90) audio.playSuccess();
      progress.recordMelody(`leggio:${entry.id}`, pct);
      return;
    }
    setIdx(next);
  }, [idx, nextRequired, accompany, range, audio, progress, entry.id]);

  /** Note giuste arrivate dal microfono, anche più insieme (un accordo). */
  const accept = useCallback(
    (midis: number[]) => {
      if (mode !== 'practice') return;
      const need = required(idx);
      const fresh = midis.filter(m => need.includes(m) && !found.includes(m));
      if (fresh.length === 0) return;
      const now = [...found, ...fresh];
      setFound(now);
      haptics.correct();
      if (need.every(m => now.includes(m))) completeStep();
    },
    [mode, required, idx, found, completeStep],
  );

  /** Un tasto toccato sullo schermo: giusto, o sbagliato (rosso). */
  const input = useCallback(
    (midi: number) => {
      if (mode !== 'practice') return;
      const need = required(idx);
      if (need.includes(midi)) {
        if (found.includes(midi)) return;
        const now = [...found, midi];
        setFound(now);
        haptics.correct();
        if (need.every(m => now.includes(m))) completeStep();
      } else {
        practice.current.stepError = true;
        haptics.wrong();
        setBadKey(midi);
        timers.current.push(setTimeout(() => setBadKey(k => (k === midi ? null : k)), 450));
      }
    },
    [mode, required, idx, found, completeStep],
  );

  const pressKey = useCallback(
    (midi: number) => {
      void audio.initialize();
      audio.playNote(midiTone(midi), 0.8);
      mic.suppress(700);
      input(midi);
    },
    [audio, mic, input],
  );

  // Il piano vero, col microfono: l'app dice quali note aspetta, e il
  // microfono le cerca tutte insieme (accordi compresi). Dal microfono non
  // arrivano errori: una nota sentita male non deve diventare uno sbaglio.
  const expect = mic.expect;
  useEffect(() => {
    expect(mode === 'practice' && mic.isListening ? required(idx) : null, `${idx}`);
  }, [expect, mode, mic.isListening, required, idx]);
  useEffect(() => () => expect(null), [expect]);

  useEffect(() => {
    const m = mic.chordMatch;
    if (!mic.isListening || !m || m.id <= micBase.current) return;
    micBase.current = m.id;
    accept(m.midis);
  }, [mic.chordMatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Note accese sul rigo e scorrimento ────────────────────────────────────
  useEffect(() => {
    lit.current.forEach(el => paint(el, null));
    lit.current = [];
    const spots = spotLayer.current;
    const labels = nameLayer.current;
    spots?.replaceChildren();
    labels?.replaceChildren();
    const step = steps[idx];
    if (!step || loading) return;
    const need = mode === 'practice' ? required(idx) : [];
    const colorOf = (n: TNote): string | null => {
      if (mode === 'practice') {
        if (!need.includes(n.midi)) return null;
        return found.includes(n.midi) ? GOOD_COLOR : HAND_COLOR[n.staff] ?? HAND_COLOR[0];
      }
      return allows(hand, n.staff) ? HAND_COLOR[n.staff] ?? HAND_COLOR[0] : null;
    };
    // Prima il gruppo intero (gambo, cediglie) e poi ogni testa col suo colore.
    for (const n of step.notes) {
      if (!n.svg) continue;
      paint(n.svg, colorOf(n) ?? MUTED);
      lit.current.push(n.svg);
    }
    const origin = spots?.getBoundingClientRect();
    const placed: { x: number; y: number }[] = [];
    const ordered = [...step.notes].sort((a, b) => b.midi - a.midi);
    for (const n of ordered) {
      const color = colorOf(n);
      if (n.head) { paint(n.head, color ?? MUTED); lit.current.push(n.head); }
      const target = n.head ?? n.svg;
      if (!color || !target || !origin || n.cont) continue;
      // L'alone dietro la testa: si vede da lontano, anche sul leggio del piano.
      const r = target.getBoundingClientRect();
      const cx = r.left - origin.left + r.width / 2;
      const cy = n.head ? r.top - origin.top + r.height / 2 : r.bottom - origin.top - Math.min(r.width, r.height) / 2;
      const size = Math.max(22, (n.head ? r.height : Math.min(r.width, r.height)) * 2.4);
      const spot = document.createElement('div');
      spot.className = 'leggio-spot';
      Object.assign(spot.style, {
        left: `${cx - size / 2}px`, top: `${cy - size / 2}px`, width: `${size}px`, height: `${size}px`,
        background: `radial-gradient(circle, ${color}55 0%, ${color}22 60%, transparent 72%)`,
        boxShadow: `0 0 0 2px ${color}66`,
      });
      spots?.appendChild(spot);
      if (names && labels) {
        // Il nome a destra della testa; negli accordi i nomi si scalano per non coprirsi.
        let y = cy;
        for (const p of placed) if (Math.abs(p.x - cx) < 24 && Math.abs(p.y - y) < 17) y = p.y + 17;
        placed.push({ x: cx, y });
        const tag = document.createElement('span');
        tag.className = 'leggio-name';
        tag.textContent = n.name;
        Object.assign(tag.style, { left: `${cx + size / 2 - 4}px`, top: `${y - 9}px`, background: color });
        labels.appendChild(tag);
      }
    }
    // La nota corrente si porta a un terzo della larghezza: si vede cosa viene.
    const first = step.notes.find(n => n.head ?? n.svg);
    const el = first?.head ?? first?.svg;
    const box = scroller.current;
    if (el && box) {
      const r = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      scrollTarget.current = Math.max(0, r.left + r.width / 2 - b.left + box.scrollLeft - box.clientWidth * 0.3);
      // In verticale ci si muove solo se la nota esce dallo spazio visibile.
      const top = r.top - b.top;
      scrollTargetY.current = top < 8 || r.bottom - b.top > box.clientHeight - 8
        ? Math.max(0, top + box.scrollTop - box.clientHeight / 2 + r.height / 2)
        : null;
    }
  }, [idx, steps, mode, hand, found, required, loading, names]);

  // Scorrimento morbido verso il bersaglio (anche su iPad, dove lo "smooth"
  // nativo si inceppa con aggiornamenti frequenti).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const box = scroller.current;
      if (box) {
        const d = scrollTarget.current - box.scrollLeft;
        if (Math.abs(d) > 0.5) box.scrollLeft += d * 0.18;
        const ty = scrollTargetY.current;
        if (ty !== null) {
          const dy = ty - box.scrollTop;
          if (Math.abs(dy) > 0.5) box.scrollTop += dy * 0.18;
          else scrollTargetY.current = null;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Tastiera: quale porzione mostrare ─────────────────────────────────────
  useEffect(() => {
    if (!steps.length) return;
    const ahead = steps.slice(idx, idx + (mode === 'listen' ? 24 : 10)).flatMap(s => s.notes.filter(n => allows(hand, n.staff)).map(n => n.midi));
    if (!ahead.length) return;
    const lo = Math.min(...ahead);
    const hi = Math.max(...ahead);
    const width = keysBox.current?.clientWidth ?? window.innerWidth;
    setWin(cur => (lo >= cur[0] && hi <= cur[1] ? cur : windowFor(lo - 2, hi + 2, whiteKeysFor(width))));
  }, [idx, steps, hand, mode]);

  /** I nomi scritti delle note del passo, per la tastiera e per "Suona". */
  const stepNames = useMemo(() => new Map((steps[idx]?.notes ?? []).map(n => [n.midi, n.name])), [steps, idx]);

  const litKeys = useMemo(() => {
    const m = new Map<number, string>();
    const step = steps[idx];
    if (!step) return m;
    if (mode === 'practice') {
      for (const midi of required(idx)) {
        const staff = step.notes.find(n => n.midi === midi)?.staff ?? 0;
        m.set(midi, found.includes(midi) ? GOOD_COLOR : HAND_COLOR[staff] ?? HAND_COLOR[0]);
      }
    } else if (mode === 'listen') {
      for (const n of step.notes) if (!n.cont && allows(hand, n.staff)) m.set(n.midi, HAND_COLOR[n.staff] ?? HAND_COLOR[0]);
    } else {
      for (const n of step.notes) if (!n.cont) m.set(n.midi, HAND_COLOR[n.staff] ?? HAND_COLOR[0]);
    }
    if (badKey !== null) m.set(badKey, BAD_COLOR);
    return m;
  }, [steps, idx, mode, required, found, badKey, hand]);

  // ── Cascata ───────────────────────────────────────────────────────────────
  const falling = useMemo<FallingNote[]>(() => steps.flatMap(s => s.notes.filter(n => !n.cont).map(n => ({ midi: n.midi, start: n.start, dur: Math.max(0.12, n.dur), staff: n.staff, name: n.name }))), [steps]);
  const barBeats = useMemo(() => {
    const out: number[] = [];
    let last = -1;
    for (const s of steps) if (s.measure !== last) { out.push(s.beat); last = s.measure; }
    return out;
  }, [steps]);
  const live = useRef({ mode, idx, steps });
  useEffect(() => { live.current = { mode, idx, steps }; });
  const nowBeat = useCallback(() => {
    const { mode: md, idx: i, steps: st } = live.current;
    if (md === 'listen') {
      const p = play.current;
      return p.t0 + Math.max(0, (performance.now() - p.start) / 1000 / p.spb);
    }
    // Fermi o in attesa: si scivola dolcemente sul passo corrente.
    const target = st[i]?.beat ?? 0;
    shownBeat.current += (target - shownBeat.current) * 0.15;
    return shownBeat.current;
  }, []);

  // ── Interfaccia ───────────────────────────────────────────────────────────
  const measureNow = (steps[idx]?.measure ?? 0) + 1;
  const need = mode === 'practice' ? required(idx) : [];
  const showScore = view !== 'cascata';
  const showCascade = view !== 'spartito';

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-canvas text-ink safe-top">
      {/* Testata */}
      <div className="flex items-center gap-2 border-b border-line/70 px-3 py-2" style={{ background: `linear-gradient(90deg, ${style.from}33, transparent)` }}>
        <button type="button" onClick={() => { stopAll(); onClose(); }} className="rounded-xl bg-surface2 p-2 text-ink2 active:scale-95" aria-label="Chiudi il leggio">
          <X className="h-5 w-5" />
        </button>
        {PORTRAIT[entry.composer] && (
          <img
            src={PORTRAIT[entry.composer]?.src}
            alt=""
            className="hidden h-9 w-9 flex-none rounded-full object-cover ring-1 ring-white/15 min-[400px]:block"
            style={{ objectPosition: PORTRAIT[entry.composer]?.position }}
          />
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-bold tracking-tight sm:text-base">{entry.title}</p>
          <p className="truncate text-[11px] text-ink3 sm:text-xs">
            <span className="hidden sm:inline">{entry.composer} · {LEVEL_LABEL[entry.level]} · </span>
            <span className="sm:hidden">{style.short} · </span>
            batt. {measureNow}/{measureCount || '–'}
          </p>
        </div>
        {onToggleMic && (
          <button
            type="button"
            onClick={onToggleMic}
            aria-pressed={mic.isListening}
            aria-label={mic.isListening ? 'Spegni il microfono' : 'Accendi il microfono: suona sul piano vero'}
            className={`relative rounded-xl border p-2 active:scale-95 ${mic.isListening ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400' : 'border-line bg-surface2 text-ink3'}`}
          >
            {mic.isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            {mic.isListening && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />}
          </button>
        )}
        <div className="flex overflow-hidden rounded-xl border border-line text-[11px] font-bold sm:text-xs">
          {(['spartito', 'entrambi', 'cascata'] as View[]).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => changeView(v)}
              aria-label={VIEW_LABEL[v]}
              className={`flex items-center gap-1 px-2.5 py-1.5 ${view === v ? 'bg-brand text-white' : 'bg-surface2 text-ink2'}`}
            >
              {v === 'spartito' ? <FileMusic className="h-4 w-4" /> : v === 'cascata' ? <ChevronsDown className="h-4 w-4" /> : <Rows2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{VIEW_LABEL[v]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Spartito e cascata */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scroller}
          className={`thin-scroll relative overflow-auto ${showScore ? (showCascade ? 'h-[58%] flex-none' : 'flex-1') : 'h-0 flex-none'}`}
          style={{ background: 'linear-gradient(180deg, var(--c-paper) 0%, var(--c-paper2) 100%)' }}
        >
          {/* min-h-full e non h-full: se il rigo è più alto dello spazio (telefono in
              orizzontale) si scorre anche in verticale invece di tagliarlo. */}
          <div className="flex min-h-full w-max items-center">
            <div className="relative flex flex-none">
              {/* Le etichette delle mani restano ferme a sinistra mentre il rigo scorre. */}
              <div className="sticky left-0 z-20 w-0 flex-none">
                {staffTops.slice(0, 2).map((st, i) => (
                  <span
                    key={i}
                    className="absolute left-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-black text-white shadow sm:left-2 sm:px-2 sm:text-xs"
                    style={{ top: st.top + st.height / 2 - 10, background: HAND_COLOR[i] }}
                  >
                    {i === 0 ? 'm.d.' : 'm.s.'}
                  </span>
                ))}
              </div>
              <div ref={spotLayer} className="pointer-events-none absolute inset-0" />
              <div ref={host} className="relative flex-none pl-[30vw] pr-[60vw]" />
              <div ref={nameLayer} className="pointer-events-none absolute inset-0" />
            </div>
          </div>
        </div>
        {entry.credit && (
          <p
            className="pointer-events-none absolute right-2 z-10 max-w-[70%] truncate text-right text-[9px] text-slate-500/80 sm:text-[10px]"
            style={showScore && showCascade ? { top: 'calc(58% - 16px)' } : { top: '4px' }}
          >
            {entry.credit}
          </p>
        )}
        {showScore && !loading && (
          <div
            className="pointer-events-none absolute top-0 w-9 -translate-x-1/2 border-x border-brand/20 bg-brand/[0.07]"
            style={{ left: '30%', height: showCascade ? '58%' : '100%' }}
          />
        )}
        {showCascade && (
          <div className="relative min-h-0 flex-1 bg-gradient-to-b from-slate-950 to-slate-900">
            {/* Stessi margini della tastiera (le frecce ai lati): colonne allineate ai tasti. */}
            <div className="absolute inset-y-0 left-7 right-7">
            <Cascade
              notes={falling}
              from={win[0]}
              to={win[1]}
              nowBeat={nowBeat}
              windowBeats={Math.max(3, 3.2 / spb)}
              barBeats={barBeats}
              dimStaff={hand === 'right' ? 1 : hand === 'left' ? 0 : null}
            />
            </div>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-canvas/80 text-sm font-bold text-ink2">
            Preparo lo spartito…
          </div>
        )}
        {failed && (
          <div className="absolute inset-0 grid place-items-center text-sm font-bold text-red-400">
            Non riesco a caricare la partitura.
          </div>
        )}
        {mode === 'practice' && need.length > 0 && (
          <div
            className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-1.5 text-sm font-black text-white shadow-lg ring-1 ring-white/10 sm:text-base"
            style={{ top: showCascade && showScore ? 'calc(58% + 8px)' : showScore ? undefined : '8px', bottom: showCascade ? undefined : '8px' }}
          >
            Suona: {[...need].sort((a, b) => a - b).map(m => stepNames.get(m) ?? midiName(m)).join(' + ')}
          </div>
        )}
        {mode === 'done' && result && (
          <div className="absolute inset-0 grid place-items-center bg-canvas/85 p-4">
            <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-5 text-center shadow-2xl">
              <div className="text-5xl">{result.pct >= 95 ? '🏆' : result.pct >= 80 ? '🎹' : '💪'}</div>
              <p className="mt-2 text-2xl font-black">{result.pct}% giuste</p>
              <p className="mt-1 text-sm text-ink2">{result.notes} passaggi in {result.secs}s · tempo {Math.round(rate * 100)}%</p>
              <p className="mt-2 text-xs text-ink3">
                {result.pct >= 95 ? 'Pulito. Alza il tempo del 10% e rifallo.' : 'Rifallo allo stesso tempo: la precisione viene prima della velocità.'}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={startPractice} className="flex items-center justify-center gap-1.5 rounded-xl bg-surface2 py-3 text-sm font-bold">
                  <RotateCcw className="h-4 w-4" /> Ancora
                </button>
                <button
                  type="button"
                  onClick={() => { setRate(r => Math.min(1.2, Math.round((r + 0.1) * 100) / 100)); timers.current.push(setTimeout(startPractice, 50)); }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-brand py-3 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" /> Più veloce
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comandi: due righe sul telefono, una sola su iPad. */}
      <div className="flex flex-col gap-2 border-t border-line/70 bg-surface px-3 py-2 sm:flex-row sm:items-center">
        <div className="flex flex-none items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => (mode === 'listen' ? (stopAll(), setMode('idle')) : listen())}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-black active:scale-95 ${mode === 'listen' ? 'bg-amber-500 text-white' : 'bg-surface2 text-ink'}`}
          >
            {mode === 'listen' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {mode === 'listen' ? 'Pausa' : 'Ascolta'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => (mode === 'practice' ? (stopAll(), setMode('idle')) : startPractice())}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-black active:scale-95 ${mode === 'practice' ? 'bg-emerald-600 text-white' : 'bg-brand text-white'}`}
          >
            <Target className="h-4 w-4" />
            {mode === 'practice' ? 'Stop' : 'Esercita'}
          </button>
          {/* Le mani con gli stessi colori e le stesse sigle del rigo. */}
          <div className="ml-auto flex overflow-hidden rounded-xl border border-line text-xs font-black sm:ml-0">
            {(['right', 'both', 'left'] as HandSel[]).map(h => (
              <button
                key={h}
                type="button"
                aria-label={h === 'both' ? 'Due mani' : h === 'right' ? 'Mano destra' : 'Mano sinistra'}
                onClick={() => { stopAll(); setMode('idle'); setHand(h); }}
                className={`flex items-center gap-1 px-2.5 py-2.5 ${hand === h ? 'text-white' : 'bg-surface2 text-ink2'}`}
                style={hand === h ? { background: h === 'both' ? 'var(--color-brand)' : HAND_COLOR[h === 'right' ? 0 : 1] } : undefined}
              >
                {h === 'both' ? <><HandIcon className="h-3.5 w-3.5" /><HandIcon className="-ml-1.5 h-3.5 w-3.5 -scale-x-100" /></> : h === 'right' ? 'm.d.' : 'm.s.'}
              </button>
            ))}
          </div>
        </div>
        <div className="thin-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
          <div className="flex flex-none items-center gap-0.5 rounded-xl border border-line bg-surface2 px-0.5 text-xs font-bold">
            <button type="button" onClick={() => setRate(r => Math.max(0.25, Math.round((r - 0.05) * 100) / 100))} className="rounded-lg p-1.5 active:scale-90" aria-label="Più lento">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center tabular-nums" title="Velocità">{Math.round(rate * 100)}%</span>
            <button type="button" onClick={() => setRate(r => Math.min(1.25, Math.round((r + 0.05) * 100) / 100))} className="rounded-lg p-1.5 active:scale-90" aria-label="Più veloce">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNames(v => !v)}
            aria-pressed={names}
            className={`flex-none rounded-full border px-3 py-1 text-xs font-black ${names ? 'border-brand bg-brand/15 text-brand' : 'border-line text-ink3'}`}
          >
            Do Re Mi
          </button>
          <span className="mx-0.5 h-5 w-px flex-none bg-line" />
          <button type="button" onClick={() => { stopAll(); setMode('idle'); setLoop(null); setIdx(0); }} className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${loop === null ? 'border-brand bg-brand/15 text-brand' : 'border-line text-ink2'}`}>
            Tutto
          </button>
          {loops.map((l, i) => (
            <button
              key={l.label}
              type="button"
              onClick={() => { stopAll(); setMode('idle'); setLoop(i); setIdx(steps.findIndex(s => s.measure >= l.from)); }}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold tabular-nums ${loop === i ? 'border-brand bg-brand/15 text-brand' : 'border-line text-ink2'}`}
            >
              {l.label}
            </button>
          ))}
          {onGuided && (
            <button type="button" onClick={() => { stopAll(); onGuided(); }} className="flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-bold text-ink2">
              Studio guidato <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tastiera */}
      <div ref={keysBox} className="h-[19vh] max-h-56 min-h-28 flex-none bg-slate-950 safe-bottom sm:h-[22vh]">
        <div className="flex h-full items-stretch gap-1">
          <button type="button" onClick={() => setWin(([a, b]) => windowFor(a - 12, b - 12, whiteKeysFor(keysBox.current?.clientWidth ?? 390)))} className="w-6 flex-none text-slate-500" aria-label="Tastiera più in basso">
            <ChevronLeft className="mx-auto h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <LeggioKeyboard from={win[0]} to={win[1]} lit={litKeys} names={stepNames} onPress={pressKey} />
          </div>
          <button type="button" onClick={() => setWin(([a, b]) => windowFor(a + 12, b + 12, whiteKeysFor(keysBox.current?.clientWidth ?? 390)))} className="w-6 flex-none text-slate-500" aria-label="Tastiera più in alto">
            <ChevronRight className="mx-auto h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
