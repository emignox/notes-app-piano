// ─────────────────────────────────────────────────────────────────────────────
// Doppio pentagramma (chiave di violino + chiave di basso, con la graffa).
//
// Le due voci vengono formattate NELLA STESSA chiamata al Formatter: è ciò che
// tiene le note delle due mani allineate in verticale, cioè la cosa che rende
// leggibile un pezzo per pianoforte. Dove una mano tace c'è una pausa vera, non
// un buco: così i tempi restano leggibili.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveConnector, StaveNote, Voice } from 'vexflow';
import type { Hand, NoteResult, PieceStep } from '../types';
import { parseNote, sortByPitch, vexKeyOf } from '../lib/notes';

interface GrandStaffProps {
  steps: PieceStep[];
  activeIndex: number;
  results: NoteResult[];
  /** Note del passo corrente già suonate: diventano verdi una per una. */
  found?: string[];
  /** Quale mano si sta studiando: l'altra resta in grigio. */
  hand?: Hand;
}

const INK = '#101828';
const GOOD = '#15803d';
const BAD = '#dc2626';
const GHOST = '#94a3b840';
const MUTED = '#94a3b870';

const STEP_W = 62;
const CLEF_W = 62;
const PAD = 26;
// Compatto ma non stretto: le due chiavi devono stare in schermo insieme alle
// tastiere, senza far scorrere la pagina a ogni nota.
const HEIGHT = 226;
const TREBLE_Y = 4;
const BASS_Y = 104;

const TREBLE_REST = 'b/4';
const BASS_REST = 'd/3';

function buildStepNote(
  notes: string[],
  duration: string,
  clef: 'treble' | 'bass',
  color: string,
): StaveNote {
  // Nel pianoforte le gambe della destra vanno in su e quelle della sinistra in
  // giù: senza questo gli accordi di sinistra sembrano attaccati al rigo sopra.
  const stem = clef === 'treble' ? 1 : -1;
  if (notes.length === 0) {
    return new StaveNote({
      keys: [clef === 'treble' ? TREBLE_REST : BASS_REST],
      duration: `${duration}r`,
      clef,
    }).setStyle({ fillStyle: color, strokeStyle: color });
  }
  const sorted = sortByPitch(notes);
  const note = new StaveNote({ keys: sorted.map(vexKeyOf), duration, clef });
  sorted.forEach((n, i) => {
    const { acc } = parseNote(n);
    if (acc) note.addModifier(new Accidental(acc === '#' ? '#' : 'b'), i);
  });
  note.setStyle({ fillStyle: color, strokeStyle: color });
  try {
    note.setStemDirection(stem);
  } catch {
    /* verso predefinito */
  }
  return note;
}

export function GrandStaff({ steps, activeIndex, results, found = [], hand = 'both' }: GrandStaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const width = useMemo(() => CLEF_W + Math.max(1, steps.length) * STEP_W + PAD, [steps.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || steps.length === 0) return;
    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, HEIGHT);
    const ctx = renderer.getContext();
    ctx.setFont('Arial', 10);

    const treble = new Stave(12, TREBLE_Y, width - 24);
    treble.addClef('treble');
    treble.setContext(ctx).draw();

    const bass = new Stave(12, BASS_Y, width - 24);
    bass.addClef('bass');
    bass.setContext(ctx).draw();

    // La graffa: è il segno che dice "queste due righe sono un unico strumento".
    try {
      new StaveConnector(treble, bass).setType(StaveConnector.type.BRACE).setContext(ctx).draw();
      new StaveConnector(treble, bass).setType(StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
      new StaveConnector(treble, bass).setType(StaveConnector.type.SINGLE_RIGHT).setContext(ctx).draw();
    } catch {
      /* senza graffa si legge comunque */
    }

    const colorFor = (i: number, isActiveHand: boolean): string => {
      if (i < activeIndex) return results[i] === 'wrong' ? BAD : results[i] === 'correct' ? GOOD : INK;
      if (i === activeIndex) return isActiveHand ? INK : MUTED;
      return GHOST;
    };

    const rightActive = hand !== 'left';
    const leftActive = hand !== 'right';

    const trebleNotes = steps.map((st, i) =>
      buildStepNote(st.treble, st.duration, 'treble', colorFor(i, rightActive)),
    );
    const bassNotes = steps.map((st, i) =>
      buildStepNote(st.bass, st.duration, 'bass', colorFor(i, leftActive)),
    );

    const totalBeats = Math.max(1, Math.ceil(steps.reduce((sum, st) => sum + st.beats, 0)));
    const trebleVoice = new Voice({ numBeats: totalBeats, beatValue: 4 }).setMode(Voice.Mode.SOFT);
    trebleVoice.addTickables(trebleNotes);
    const bassVoice = new Voice({ numBeats: totalBeats, beatValue: 4 }).setMode(Voice.Mode.SOFT);
    bassVoice.addTickables(bassNotes);

    new Formatter()
      .joinVoices([trebleVoice])
      .joinVoices([bassVoice])
      .format([trebleVoice, bassVoice], width - CLEF_W - PAD);

    trebleVoice.draw(ctx, treble);
    bassVoice.draw(ctx, bass);

    // La posizione della colonna è una misura del disegno, non uno stato React:
    // si scrive direttamente sull'elemento, senza far ridisegnare il componente.
    if (cursorRef.current) {
      let x = CLEF_W + activeIndex * STEP_W;
      try {
        const active = trebleNotes[activeIndex];
        if (active) x = active.getAbsoluteX();
      } catch {
        /* stima di riserva */
      }
      cursorRef.current.style.left = `${x - 15}px`;
    }

    return () => { container.innerHTML = ''; };
  }, [steps, activeIndex, results, hand, width]);

  // Tiene il passo corrente al centro.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const targetX = Math.max(0, CLEF_W + activeIndex * STEP_W - el.clientWidth / 2);
    el.scrollTo({ left: targetX, behavior: 'smooth' });
  }, [activeIndex]);

  return (
    <div
      ref={scrollRef}
      className="thin-scroll w-full overflow-x-auto rounded-2xl border border-amber-300/40 shadow-inner"
      style={{
        height: HEIGHT,
        background: 'linear-gradient(180deg, var(--c-paper) 0%, var(--c-paper2) 100%)',
      }}
    >
      <div className="relative" style={{ width, height: HEIGHT }}>
        {/* Colonna che unisce visivamente le due mani sul passo corrente */}
        {activeIndex < steps.length && (
          <div
            ref={cursorRef}
            className="pointer-events-none absolute rounded-lg border-2 border-brand/40 bg-brand/5"
            style={{
              left: CLEF_W + activeIndex * STEP_W - 15,
              top: TREBLE_Y + 34,
              width: 30,
              height: BASS_Y + 96 - TREBLE_Y - 34,
            }}
          />
        )}
        <div ref={containerRef} className="absolute inset-0" />
        {found.length > 0 && (
          <div className="absolute left-3 top-1 text-[10px] font-bold text-emerald-700">
            {found.length} ✓
          </div>
        )}
      </div>
    </div>
  );
}
