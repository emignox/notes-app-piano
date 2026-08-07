// ─────────────────────────────────────────────────────────────────────────────
// Pentagramma (VexFlow) in due modalità:
//
//  · focus    → una sola nota, grande, centrata, altezza calcolata sulle linee
//               aggiuntive che servono. È la vista dell'esercizio di lettura.
//  · sequence → più note con scorrimento e colori per risposta: melodie e
//               ripasso, con doppio pentagramma se ci sono entrambe le chiavi.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef } from 'react';
import { Accidental, Annotation, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import type { AnswerState, NoteEntry, NoteResult } from '../types';
import { staffSlot } from '../lib/notes';

interface StaffProps {
  entries: NoteEntry[];
  activeIndex?: number;
  results?: NoteResult[];
  answerState?: AnswerState;
  durations?: string[];
  variant?: 'focus' | 'sequence';
}

const INK = '#101828';
const GOOD = '#15803d';
const BAD = '#dc2626';
const GHOST = '#94a3b840';

const NOTE_WIDTH = 68;
const CLEF_WIDTH = 58;
const PADDING = 24;
// Le y sono quelle passate a Stave(): la prima linea cade 40px più in basso.
// Le altezze lasciano posto alle linee aggiuntive sopra e sotto.
const SINGLE_H = 152;
const SINGLE_STAVE_Y = 14;
const GRAND_H = 258;
const TREBLE_Y = 6;
const BASS_Y = 122;

function colorFor(
  idx: number,
  activeIndex: number,
  results: NoteResult[],
  answerState: AnswerState,
): string {
  if (idx < activeIndex) {
    if (results[idx] === 'wrong') return BAD;
    return results[idx] === 'correct' ? GOOD : INK;
  }
  if (idx === activeIndex) {
    if (answerState === 'correct') return GOOD;
    if (answerState === 'wrong') return BAD;
    return INK;
  }
  return GHOST;
}

const VEX_ACCIDENTAL: Record<NonNullable<NoteEntry['accidental']>, string> = {
  sharp: '#', flat: 'b', natural: 'n', 'double-sharp': '##', 'double-flat': 'bb',
};

/**
 * Scrive il nome della nota sotto di essa, piccolo e in rosso.
 * Serve quando si sbaglia: al posto di un riquadro che occupa spazio e tempo,
 * l'informazione sta dov'è il problema — sul pentagramma, accanto alla nota —
 * e ci resta, così la si può guardare senza dover interrompere l'esecuzione.
 */
function addNameLabel(sn: StaveNote, text: string, color: string) {
  const a = new Annotation(text);
  a.setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
  a.setStyle({ fillStyle: color, strokeStyle: color });
  sn.addModifier(a, 0);
}

/**
 * Marca i nomi delle note dopo il disegno. VexFlow non porta le classi fin
 * dentro l'SVG, e il foglio di stile impone il carattere musicale a TUTTI i
 * testi: senza questo aggancio il nome uscirebbe in Bravura, grande e storto.
 */
function tagNameLabels(container: HTMLElement, labels: Set<string>) {
  if (labels.size === 0) return;
  container.querySelectorAll('text').forEach(t => {
    if (labels.has((t.textContent ?? '').trim())) t.setAttribute('class', 'nota-nome');
  });
}

function buildNote(entry: NoteEntry, color: string, duration: string, label?: string): StaveNote {
  const sn = new StaveNote({ keys: [entry.vexflowKey], duration, clef: entry.clef });
  if (entry.accidental) {
    sn.addModifier(new Accidental(VEX_ACCIDENTAL[entry.accidental]), 0);
  }
  sn.setStyle({ fillStyle: color, strokeStyle: color });
  if (label) addNameLabel(sn, label, color);
  return sn;
}

/**
 * Rende l'SVG elastico: si adatta alla larghezza dello schermo senza tagliare.
 * VexFlow scrive width/height anche negli STILI inline, che vincono sugli
 * attributi: vanno sovrascritti entrambi, altrimenti il disegno resta a 1:1.
 */
function makeResponsive(container: HTMLElement, width: number, height: number) {
  const svg = container.querySelector('svg');
  if (!svg) return;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.width = '100%';
  svg.style.height = '100%';
}

// ── Modalità focus ──────────────────────────────────────────────────────────

// Disegno stretto: scalando sulla larghezza dello schermo il pentagramma
// diventa grande e leggibile anche su telefoni piccoli.
const FOCUS_W = 240;
const MARGIN_V = 22;
const LINE_GAP = 5;      // mezza distanza fra le linee
// VexFlow riserva 4 spazi (40px) sopra la prima linea: la y passata a Stave()
// NON è la linea più alta. Senza questo scarto la nota finisce fuori dal foglio.
const STAVE_TOP_PAD = 40;
const STAVE_LINES_H = 40;
// La chiave sporge sopra e sotto le linee: va lasciato il posto anche a lei.
const CLEF_OVERSHOOT = 15;

function FocusStaff({ entry, answerState }: { entry: NoteEntry; answerState: AnswerState }) {
  const ref = useRef<HTMLDivElement>(null);

  // L'altezza segue l'inchiostro (pentagramma + chiave + nota, anche con molte
  // linee aggiuntive) così il disegno è sempre centrato e mai tagliato.
  const { height, staveY } = useMemo(() => {
    const slot = staffSlot(entry.englishName, entry.clef);
    const bottomLine = STAVE_TOP_PAD + STAVE_LINES_H;
    const noteY = bottomLine - slot * LINE_GAP;
    const inkTop = Math.min(STAVE_TOP_PAD - CLEF_OVERSHOOT, noteY - 10);
    const inkBottom = Math.max(bottomLine + CLEF_OVERSHOOT, noteY + 10);
    return { height: inkBottom - inkTop + MARGIN_V * 2, staveY: MARGIN_V - inkTop };
  }, [entry]);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(FOCUS_W, height);
    const ctx = renderer.getContext();

    const stave = new Stave(8, staveY, FOCUS_W - 16);
    stave.addClef(entry.clef);
    stave.setContext(ctx).draw();

    const color = answerState === 'correct' ? GOOD : answerState === 'wrong' ? BAD : INK;
    const note = buildNote(entry, color, 'w', answerState === 'wrong' ? entry.displayName : undefined);

    // Le note partono dal centro del pentagramma: la carta è una nota sola e al
    // centro si legge meglio che appiccicata alla chiave.
    stave.setNoteStartX(Math.round(stave.getX() + stave.getWidth() / 2) - 14);

    const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT);
    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice], 40);
    voice.draw(ctx, stave);

    if (answerState === 'wrong') tagNameLabels(container, new Set([entry.displayName]));
    makeResponsive(container, FOCUS_W, height);
    return () => { container.innerHTML = ''; };
  }, [entry, answerState, height, staveY]);

  return (
    <div
      className="w-full overflow-hidden rounded-2xl border border-amber-300/40 shadow-inner"
      style={{
        aspectRatio: `${FOCUS_W} / ${height}`,
        maxHeight: 260,
        background: 'linear-gradient(180deg, var(--c-paper) 0%, var(--c-paper2) 100%)',
      }}
    >
      <div ref={ref} className="h-full w-full" />
    </div>
  );
}

// ── Modalità sequenza ───────────────────────────────────────────────────────

function SequenceStaff({
  entries,
  activeIndex,
  results,
  answerState,
  durations,
}: {
  entries: NoteEntry[];
  activeIndex: number;
  results: NoteResult[];
  answerState: AnswerState;
  durations?: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Posizione reale della nota attiva, letta dal disegno: la freccia deve stare
  // sopra la nota vera, non sopra una stima basata su una larghezza fissa.
  // È una misura, non uno stato: si scrive direttamente sull'elemento.
  const arrowRef = useRef<HTMLDivElement>(null);

  const isMixed = useMemo(() => new Set(entries.map(e => e.clef)).size > 1, [entries]);

  const trebleEntries = useMemo(
    () => entries.map((note, idx) => ({ note, idx })).filter(x => x.note.clef === 'treble'),
    [entries],
  );
  const bassEntries = useMemo(
    () => entries.map((note, idx) => ({ note, idx })).filter(x => x.note.clef === 'bass'),
    [entries],
  );

  const totalHeight = isMixed ? GRAND_H : SINGLE_H;
  const maxNotes = isMixed ? Math.max(trebleEntries.length, bassEntries.length) : entries.length;
  const width = CLEF_WIDTH + Math.max(1, maxNotes) * NOTE_WIDTH + PADDING;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || entries.length === 0) return;
    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, totalHeight);
    const ctx = renderer.getContext();
    ctx.setFont('Arial', 10);

    const beats = (d: string) => (d === 'w' ? 4 : d === 'h' ? 2 : d === 'q' ? 1 : 0.5);

    const drawGroup = (group: { note: NoteEntry; idx: number }[], stave: Stave) => {
      if (group.length === 0) return;
      const notes = group.map(({ note, idx }) =>
        buildNote(
          note,
          colorFor(idx, activeIndex, results, answerState),
          durations?.[idx] ?? 'q',
          // Solo dove si è sbagliato: sulle altre sarebbe la risposta servita.
          results[idx] === 'wrong' || (idx === activeIndex && answerState === 'wrong')
            ? note.displayName
            : undefined,
        ),
      );
      const total = group.reduce((sum, { idx }) => sum + beats(durations?.[idx] ?? 'q'), 0);
      const voice = new Voice({ numBeats: Math.max(1, Math.ceil(total)), beatValue: 4 }).setMode(Voice.Mode.SOFT);
      voice.addTickables(notes);
      new Formatter().joinVoices([voice]).format([voice], width - CLEF_WIDTH - PADDING);
      voice.draw(ctx, stave);

      const activePos = group.findIndex(g => g.idx === activeIndex);
      if (activePos > -1 && arrowRef.current) {
        try {
          arrowRef.current.style.left = `${notes[activePos].getAbsoluteX() - 6}px`;
        } catch {
          /* resta la stima iniziale */
        }
      }
    };

    if (!isMixed) {
      const stave = new Stave(10, SINGLE_STAVE_Y, width - 20);
      stave.addClef(entries[0].clef);
      stave.setContext(ctx).draw();
      drawGroup(entries.map((note, idx) => ({ note, idx })), stave);
    } else {
      const treble = new Stave(10, TREBLE_Y, width - 20);
      treble.addClef('treble');
      treble.setContext(ctx).draw();
      const bass = new Stave(10, BASS_Y, width - 20);
      bass.addClef('bass');
      bass.setContext(ctx).draw();
      drawGroup(trebleEntries, treble);
      drawGroup(bassEntries, bass);
    }

    // I nomi scritti sotto le note sbagliate vanno resi testo normale.
    tagNameLabels(
      container,
      new Set(
        entries
          .filter((_, idx) => results[idx] === 'wrong' || (idx === activeIndex && answerState === 'wrong'))
          .map(e => e.displayName),
      ),
    );

    return () => { container.innerHTML = ''; };
  }, [entries, activeIndex, results, answerState, durations, isMixed, trebleEntries, bassEntries, width, totalHeight]);

  const currentClef = entries[activeIndex]?.clef ?? 'treble';
  const localIdx = isMixed
    ? (currentClef === 'treble'
        ? trebleEntries.findIndex(x => x.idx === activeIndex)
        : bassEntries.findIndex(x => x.idx === activeIndex))
    : activeIndex;

  // Tiene la nota attiva al centro dello scorrimento.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const targetX = Math.max(0, CLEF_WIDTH + localIdx * NOTE_WIDTH - el.clientWidth / 2);
    el.scrollTo({ left: targetX, behavior: 'smooth' });
  }, [localIdx]);

  // +20: la prima linea sta 40px sotto la y dello Stave, la freccia va appena sopra.
  const arrowX = CLEF_WIDTH + Math.max(0, localIdx) * NOTE_WIDTH + NOTE_WIDTH / 2 - 6;
  const arrowY = (isMixed ? (currentClef === 'treble' ? TREBLE_Y : BASS_Y) : SINGLE_STAVE_Y) + 20;

  return (
    <div
      ref={scrollRef}
      className="thin-scroll w-full overflow-x-auto rounded-2xl border border-amber-300/40 shadow-inner"
      style={{
        height: totalHeight,
        background: 'linear-gradient(180deg, var(--c-paper) 0%, var(--c-paper2) 100%)',
      }}
    >
      <div className="relative" style={{ width, height: totalHeight }}>
        <div ref={containerRef} className="absolute inset-0" />
        {answerState === 'idle' && activeIndex < entries.length && localIdx >= 0 && (
          <div
            ref={arrowRef}
            className="pointer-events-none absolute select-none font-bold"
            style={{ left: arrowX, top: arrowY, color: 'var(--c-brand)', fontSize: 14, lineHeight: 1 }}
          >
            ▼
          </div>
        )}
      </div>
    </div>
  );
}

export function Staff({
  entries,
  activeIndex = 0,
  results,
  answerState = 'idle',
  durations,
  variant = 'sequence',
}: StaffProps) {
  if (entries.length === 0) return null;
  if (variant === 'focus') {
    const entry = entries[Math.min(activeIndex, entries.length - 1)];
    return <FocusStaff entry={entry} answerState={answerState} />;
  }
  return (
    <SequenceStaff
      entries={entries}
      activeIndex={activeIndex}
      results={results ?? entries.map(() => 'unanswered')}
      answerState={answerState}
      durations={durations}
    />
  );
}
