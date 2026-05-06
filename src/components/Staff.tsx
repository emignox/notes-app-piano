import { useEffect, useRef, useMemo } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import type { NoteEntry, NoteResult, AnswerState } from '../types';

interface StaffProps {
  notes: NoteEntry[];
  currentIndex: number;
  results: NoteResult[];
  currentAnswerState: AnswerState;
  durations?: string[];  // per-note VexFlow durations
}

const NOTE_WIDTH = 68;
const CLEF_WIDTH = 58;
const PADDING = 24;

// Single stave dimensions
const SINGLE_H = 165;
const SINGLE_STAVE_Y = 38;

// Grand staff dimensions (treble + bass)
const GRAND_H = 310;
const TREBLE_Y = 30;
const BASS_Y = 175;

function noteColor(
  originalIdx: number,
  currentIndex: number,
  results: NoteResult[],
  currentAnswerState: AnswerState,
): string {
  if (originalIdx < currentIndex) return results[originalIdx] === 'correct' ? '#16a34a' : '#dc2626';
  if (originalIdx === currentIndex) {
    if (currentAnswerState === 'correct') return '#16a34a';
    if (currentAnswerState === 'wrong') return '#dc2626';
    return '#6366f1';
  }
  return '#94a3b830'; // ghost for upcoming
}

function buildStaveNote(entry: NoteEntry, color: string, duration = 'q'): StaveNote {
  const sn = new StaveNote({ keys: [entry.vexflowKey], duration, clef: entry.clef });
  if (entry.accidental) {
    const sym = entry.accidental === 'sharp' ? '#' : entry.accidental === 'flat' ? 'b' : 'n';
    sn.addModifier(new Accidental(sym), 0);
  }
  sn.setStyle({ fillStyle: color, strokeStyle: color });
  return sn;
}

export function Staff({ notes, currentIndex, results, currentAnswerState, durations }: StaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isMixed = useMemo(() => {
    const clefs = new Set(notes.map(n => n.clef));
    return clefs.size > 1;
  }, [notes]);

  // Split notes by clef, keeping original indices for coloring
  const trebleEntries = useMemo(
    () => notes.map((n, i) => ({ note: n, idx: i })).filter(x => x.note.clef === 'treble'),
    [notes],
  );
  const bassEntries = useMemo(
    () => notes.map((n, i) => ({ note: n, idx: i })).filter(x => x.note.clef === 'bass'),
    [notes],
  );

  const totalHeight = isMixed ? GRAND_H : SINGLE_H;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || notes.length === 0) return;
    container.innerHTML = '';

    const maxNotes = isMixed
      ? Math.max(trebleEntries.length, bassEntries.length)
      : notes.length;
    const width = CLEF_WIDTH + maxNotes * NOTE_WIDTH + PADDING;

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, totalHeight);
    const ctx = renderer.getContext();
    ctx.setFont('Arial', 10);

    if (!isMixed) {
      // ── Single stave ──────────────────────────────────────────────
      const stave = new Stave(10, SINGLE_STAVE_Y, width - 20);
      stave.addClef(notes[0].clef);
      stave.setContext(ctx).draw();

      const staveNotes = notes.map((entry, idx) =>
        buildStaveNote(entry, noteColor(idx, currentIndex, results, currentAnswerState), durations?.[idx] ?? 'q'),
      );
      const totalBeats = durations
        ? durations.reduce((sum, d) => sum + (d === 'w' ? 4 : d === 'h' ? 2 : d === 'q' ? 1 : 0.5), 0)
        : notes.length;
      const voice = new Voice({ numBeats: Math.ceil(totalBeats), beatValue: 4 }).setMode(Voice.Mode.SOFT);
      voice.addTickables(staveNotes);
      new Formatter().joinVoices([voice]).format([voice], width - CLEF_WIDTH - PADDING);
      voice.draw(ctx, stave);
    } else {
      // ── Grand staff (treble + bass) ───────────────────────────────
      const trebleStave = new Stave(10, TREBLE_Y, width - 20);
      trebleStave.addClef('treble');
      trebleStave.setContext(ctx).draw();

      const bassStave = new Stave(10, BASS_Y, width - 20);
      bassStave.addClef('bass');
      bassStave.setContext(ctx).draw();

      const formatAndDraw = (
        entries: { note: NoteEntry; idx: number }[],
        stave: Stave,
      ) => {
        if (entries.length === 0) return;
        const staveNotes = entries.map(({ note, idx }) =>
          buildStaveNote(note, noteColor(idx, currentIndex, results, currentAnswerState), durations?.[idx] ?? 'q'),
        );
        const entryBeats = durations
          ? entries.reduce((sum, { idx }) => {
              const d = durations[idx] ?? 'q';
              return sum + (d === 'w' ? 4 : d === 'h' ? 2 : d === 'q' ? 1 : 0.5);
            }, 0)
          : entries.length;
        const voice = new Voice({ numBeats: Math.ceil(entryBeats), beatValue: 4 }).setMode(Voice.Mode.SOFT);
        voice.addTickables(staveNotes);
        new Formatter().joinVoices([voice]).format([voice], width - CLEF_WIDTH - PADDING);
        voice.draw(ctx, stave);
      };

      formatAndDraw(trebleEntries, trebleStave);
      formatAndDraw(bassEntries, bassStave);
    }

    return () => { container.innerHTML = ''; };
  }, [notes, currentIndex, results, currentAnswerState, isMixed, trebleEntries, bassEntries, totalHeight, durations]);

  // Auto-scroll to keep active note centred
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const localIdx = isMixed
      ? (notes[currentIndex]?.clef === 'treble'
          ? trebleEntries.findIndex(x => x.idx === currentIndex)
          : bassEntries.findIndex(x => x.idx === currentIndex))
      : currentIndex;
    const targetX = Math.max(0, CLEF_WIDTH + localIdx * NOTE_WIDTH - el.clientWidth / 2);
    el.scrollTo({ left: targetX, behavior: 'smooth' });
  }, [currentIndex, isMixed, notes, trebleEntries, bassEntries]);

  // Arrow indicator position
  const currentClef = notes[currentIndex]?.clef ?? 'treble';
  const localIdx = isMixed
    ? (currentClef === 'treble'
        ? trebleEntries.findIndex(x => x.idx === currentIndex)
        : bassEntries.findIndex(x => x.idx === currentIndex))
    : currentIndex;
  const arrowX = CLEF_WIDTH + Math.max(0, localIdx) * NOTE_WIDTH + NOTE_WIDTH / 2 - 7;
  const arrowY = isMixed
    ? (currentClef === 'treble' ? TREBLE_Y - 16 : BASS_Y - 16)
    : SINGLE_STAVE_Y - 16;
  const totalWidth = CLEF_WIDTH + Math.max(
    isMixed ? Math.max(trebleEntries.length, bassEntries.length) : notes.length,
    1,
  ) * NOTE_WIDTH + PADDING;

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto w-full rounded-xl shadow-inner border border-amber-200/80"
      style={{ height: totalHeight, background: 'linear-gradient(180deg, #fffbeb 0%, #fef9e7 100%)' }}
    >
      <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
        <div ref={containerRef} className="absolute inset-0" />
        {currentAnswerState === 'idle' && currentIndex < notes.length && localIdx >= 0 && (
          <div
            className="absolute pointer-events-none select-none font-bold"
            style={{ left: arrowX, top: arrowY, color: '#6366f1', fontSize: 13, lineHeight: 1 }}
          >
            ▼
          </div>
        )}
      </div>
    </div>
  );
}
