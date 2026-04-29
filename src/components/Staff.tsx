import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import type { NoteEntry, NoteResult, AnswerState } from '../types';

interface StaffProps {
  notes: NoteEntry[];
  currentIndex: number;
  results: NoteResult[];
  currentAnswerState: AnswerState;
}

const NOTE_WIDTH = 68;
const CLEF_WIDTH = 58;
const PADDING = 24;
const HEIGHT = 165;

function noteColor(idx: number, currentIndex: number, results: NoteResult[], currentAnswerState: AnswerState): string {
  if (idx < currentIndex) return results[idx] === 'correct' ? '#16a34a' : '#dc2626';
  if (idx === currentIndex) {
    if (currentAnswerState === 'correct') return '#16a34a';
    if (currentAnswerState === 'wrong') return '#dc2626';
    return '#6366f1';
  }
  return '#c4b5fd33'; // ghost gray for upcoming notes
}

export function Staff({ notes, currentIndex, results, currentAnswerState }: StaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || notes.length === 0) return;
    container.innerHTML = '';

    const width = CLEF_WIDTH + notes.length * NOTE_WIDTH + PADDING;
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, HEIGHT);
    const ctx = renderer.getContext();
    ctx.setFont('Arial', 10);

    const stave = new Stave(10, 38, width - 20);
    stave.addClef(notes[0].clef);
    stave.setContext(ctx).draw();

    const staveNotes = notes.map((entry, idx) => {
      const color = noteColor(idx, currentIndex, results, currentAnswerState);
      const sn = new StaveNote({ keys: [entry.vexflowKey], duration: 'q', clef: entry.clef });
      if (entry.accidental) {
        const sym = entry.accidental === 'sharp' ? '#' : entry.accidental === 'flat' ? 'b' : 'n';
        sn.addModifier(new Accidental(sym), 0);
      }
      sn.setStyle({ fillStyle: color, strokeStyle: color });
      return sn;
    });

    const voice = new Voice({ numBeats: notes.length, beatValue: 4 }).setMode(Voice.Mode.SOFT);
    voice.addTickables(staveNotes);
    new Formatter().joinVoices([voice]).format([voice], width - CLEF_WIDTH - PADDING);
    voice.draw(ctx, stave);

    return () => { container.innerHTML = ''; };
  }, [notes, currentIndex, results, currentAnswerState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const targetX = Math.max(0, CLEF_WIDTH + currentIndex * NOTE_WIDTH - el.clientWidth / 2);
    el.scrollTo({ left: targetX, behavior: 'smooth' });
  }, [currentIndex]);

  // x centre of the active note within the scrollable content
  const arrowX = CLEF_WIDTH + currentIndex * NOTE_WIDTH + NOTE_WIDTH / 2 - 7;
  const totalWidth = CLEF_WIDTH + notes.length * NOTE_WIDTH + PADDING;

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto w-full rounded-xl shadow-inner border border-amber-200/80"
      style={{ height: HEIGHT, background: 'linear-gradient(180deg, #fffbeb 0%, #fef9e7 100%)' }}
    >
      {/* Arrow indicator — lives inside the scroll container so it scrolls with notes */}
      <div className="relative" style={{ width: totalWidth, height: HEIGHT }}>
        <div ref={containerRef} className="absolute inset-0" />
        {currentAnswerState === 'idle' && currentIndex < notes.length && (
          <div
            className="absolute pointer-events-none select-none"
            style={{ left: arrowX, top: 4, color: '#6366f1', fontSize: 13, fontWeight: 700, lineHeight: 1 }}
          >
            ▼
          </div>
        )}
      </div>
    </div>
  );
}
