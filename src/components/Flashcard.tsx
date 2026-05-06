import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Volume2 } from 'lucide-react';
import type { NoteEntry, NoteResult, AnswerState } from '../types';
import type { LiveNote } from '../hooks/usePitchDetection';
import { Staff } from './Staff';
import { PianoKeyboard } from './PianoKeyboard';
import { NoteNameButtons } from './NoteNameButtons';
import { ResultFeedback } from './ResultFeedback';

interface FlashcardProps {
  note: NoteEntry;
  allNotes: NoteEntry[];
  sessionIndex: number;
  sessionTotal: number;
  results: NoteResult[];
  streak: number;
  // mic props come from App (global)
  micActive: boolean;
  liveNote: LiveNote | null;
  confirmedNote: { note: LiveNote; id: number } | null;
  onAnswer: (correct: boolean) => void;
  onPlayNote: (toneNote: string) => void;
  suppressMic: (ms?: number) => void;
}

function normalizeAnswer(answer: string): string {
  const enharmonic: Record<string, string> = {
    Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B',
  };
  return enharmonic[answer.replace(/\d+$/, '')] ?? answer.replace(/\d+$/, '');
}

function noteMatchesAnswer(note: NoteEntry, answer: string): boolean {
  const normalized = normalizeAnswer(answer);
  const parts = note.vexflowKey.split('/');
  const noteStr = parts[0];
  const letter = noteStr[0].toUpperCase();
  const acc = noteStr.slice(1);
  const enharmonic: Record<string, string> = {
    Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B',
  };
  const noteNormalized = acc === 'b'
    ? (enharmonic[`${letter}b`] ?? `${letter}${acc}`)
    : `${letter}${acc}`;
  return noteNormalized === normalized;
}

const IT_NAMES: Record<string, string> = {
  C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si',
};
function toItalian(name: string): string {
  const base = name.replace('#', '');
  return (IT_NAMES[base] ?? name) + (name.includes('#') ? '♯' : '');
}

export function Flashcard({
  note, allNotes, sessionIndex, sessionTotal, results, streak,
  micActive, liveNote, confirmedNote,
  onAnswer, onPlayNote, suppressMic,
}: FlashcardProps) {
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [pressedNote, setPressedNote] = useState<string | null>(null);

  const { startOctave, endOctave } = useMemo(() => {
    const octaves = allNotes.map(n => parseInt(n.toneNote.match(/\d+$/)?.[0] ?? '4'));
    return { startOctave: Math.min(...octaves), endOctave: Math.max(...octaves) };
  }, [allNotes]);

  const onPlayNoteRef = useRef(onPlayNote);
  useEffect(() => { onPlayNoteRef.current = onPlayNote; });

  const suppressMicRef = useRef(suppressMic);
  useEffect(() => { suppressMicRef.current = suppressMic; });

  // Track confirmedNote ref so we can read its id without adding it as a dep
  const confirmedNoteRef = useRef(confirmedNote);
  useEffect(() => { confirmedNoteRef.current = confirmedNote; });

  // Any confirmedNote with id <= this was set before the current card appeared — ignore it
  const cardStartIdRef = useRef(0);

  // Reset on new card: snapshot the current confirmedNote id so stale detections are ignored
  useEffect(() => {
    setAnswerState('idle');
    setPressedNote(null);
    suppressMicRef.current(1500);
    cardStartIdRef.current = confirmedNoteRef.current?.id ?? 0;
    suppressMicRef.current(300); // tiny gap for card transition, seenSilenceRef handles echo
  }, [sessionIndex]);

  // Auto-play — disabled when mic is active to avoid feedback loop
  useEffect(() => {
    if (micActive) return;
    const timer = setTimeout(() => onPlayNoteRef.current(note.toneNote), 400);
    return () => clearTimeout(timer);
  }, [sessionIndex, note.toneNote, micActive]);

  const handleAnswer = useCallback(
    (answer: string, fromPiano = false) => {
      if (answerState !== 'idle') return;
      const correct = noteMatchesAnswer(note, answer);
      setAnswerState(correct ? 'correct' : 'wrong');
      if (fromPiano) setPressedNote(answer);
      if (correct) setTimeout(() => onAnswer(true), 600);
      // wrong: user taps "Continua" to advance
    },
    [answerState, note, onAnswer],
  );

  const handleContinueAfterWrong = useCallback(() => {
    onAnswer(false);
  }, [onAnswer]);

  // React to confirmed mic detections — only if the note was confirmed AFTER this card appeared
  useEffect(() => {
    if (!micActive || !confirmedNote || answerState !== 'idle') return;
    if (confirmedNote.id <= cardStartIdRef.current) return; // stale detection from previous card
    handleAnswer(confirmedNote.note.name);
  }, [confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePianoKey = useCallback(
    (toneNote: string) => {
      if (answerState !== 'idle') return;
      onPlayNote(toneNote);
      handleAnswer(toneNote.replace(/\d+$/, ''), true);
    },
    [answerState, onPlayNote, handleAnswer],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Progress + streak */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">{sessionIndex + 1}/{sessionTotal}</span>
          {streak >= 2 && <span className="text-xs font-bold text-orange-400">🔥{streak}</span>}
        </div>
        <div className="flex gap-1 flex-wrap justify-end max-w-[55%]">
          {Array.from({ length: sessionTotal }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-4 rounded-full transition-all ${
                i < sessionIndex ? 'bg-indigo-500' : i === sessionIndex ? 'bg-white' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Staff */}
      <div className="relative">
        <Staff notes={allNotes} currentIndex={sessionIndex} results={results} currentAnswerState={answerState} />
        <button
          onClick={() => onPlayNote(note.toneNote)}
          className="absolute top-1.5 right-1.5 p-1.5 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-all"
          title="Ascolta la nota"
        >
          <Volume2 className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Mic listening banner (shown only when mic is active) */}
      {micActive && (
        <div className="rounded-xl bg-indigo-950/70 border border-indigo-500/40 px-4 py-2.5 flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
          </span>
          <span className="text-sm text-indigo-300 flex-1">Suona la nota sul piano…</span>
          {liveNote && (
            <span className="font-bold text-base text-white bg-indigo-600 px-3 py-1 rounded-lg">
              {toItalian(liveNote.name)}{liveNote.octave}
            </span>
          )}
        </div>
      )}

      {/* Feedback — always present to avoid layout shift */}
      <ResultFeedback
        answerState={answerState}
        correctNote={note}
        onContinue={answerState === 'wrong' ? handleContinueAfterWrong : undefined}
      />

      {/* Note name buttons */}
      <div className="bg-gray-800/60 rounded-xl p-2.5 border border-gray-700">
        <p className="text-xs text-gray-500 mb-2 text-center">seleziona il nome della nota</p>
        <NoteNameButtons onSelect={(n) => handleAnswer(n)} disabled={answerState !== 'idle'} />
      </div>

      {/* Piano keyboard */}
      <div className="bg-gray-800/60 rounded-xl p-2 border border-gray-700">
        <p className="text-xs text-gray-500 mb-1.5 text-center">oppure clicca sulla tastiera</p>
        <PianoKeyboard
          onKeyPress={handlePianoKey}
          correctNote={answerState !== 'idle' ? note.toneNote : null}
          pressedNote={pressedNote}
          showAnswer={answerState !== 'idle'}
          startOctave={startOctave}
          endOctave={endOctave}
        />
      </div>
    </div>
  );
}
