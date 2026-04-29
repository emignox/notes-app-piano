import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Volume2, Mic, MicOff } from 'lucide-react';
import type { NoteEntry, NoteResult, AnswerState } from '../types';
import { Staff } from './Staff';
import { PianoKeyboard } from './PianoKeyboard';
import { NoteNameButtons } from './NoteNameButtons';
import { ResultFeedback } from './ResultFeedback';
import { usePitchDetection } from '../hooks/usePitchDetection';

interface FlashcardProps {
  note: NoteEntry;
  allNotes: NoteEntry[];
  sessionIndex: number;
  sessionTotal: number;
  results: NoteResult[];
  streak: number;
  onAnswer: (correct: boolean) => void;
  onPlayNote: (toneNote: string) => void;
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

// Italian note names for display
const IT_NAMES: Record<string, string> = {
  C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si',
};
function toItalian(name: string): string {
  const base = name.replace('#', '');
  const acc = name.includes('#') ? '♯' : '';
  return (IT_NAMES[base] ?? name) + acc;
}

export function Flashcard({
  note, allNotes, sessionIndex, sessionTotal, results, streak, onAnswer, onPlayNote,
}: FlashcardProps) {
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [pressedNote, setPressedNote] = useState<string | null>(null);
  const [micMode, setMicMode] = useState(false);

  const { startOctave, endOctave } = useMemo(() => {
    const octaves = allNotes.map(n => parseInt(n.toneNote.match(/\d+$/)?.[0] ?? '4'));
    return { startOctave: Math.min(...octaves), endOctave: Math.max(...octaves) };
  }, [allNotes]);

  const { isListening, permissionDenied, liveNote, confirmedNote, start, stop } = usePitchDetection();

  const onPlayNoteRef = useRef(onPlayNote);
  useEffect(() => { onPlayNoteRef.current = onPlayNote; });

  // Reset on new card
  useEffect(() => {
    setAnswerState('idle');
    setPressedNote(null);
  }, [sessionIndex]);

  // Auto-play note when card appears
  useEffect(() => {
    const timer = setTimeout(() => onPlayNoteRef.current(note.toneNote), 400);
    return () => clearTimeout(timer);
  }, [sessionIndex, note.toneNote]);

  const handleAnswer = useCallback(
    (answer: string, fromPiano = false) => {
      if (answerState !== 'idle') return;
      const correct = noteMatchesAnswer(note, answer);
      setAnswerState(correct ? 'correct' : 'wrong');
      if (fromPiano) setPressedNote(answer);
      setTimeout(() => onAnswer(correct), 1400);
    },
    [answerState, note, onAnswer]
  );

  // React to confirmed mic detections
  useEffect(() => {
    if (!micMode || !confirmedNote || answerState !== 'idle') return;
    handleAnswer(confirmedNote.note.name);
  }, [confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePianoKey = useCallback(
    (toneNote: string) => {
      if (answerState !== 'idle') return;
      onPlayNote(toneNote);
      handleAnswer(toneNote.replace(/\d+$/, ''), true);
    },
    [answerState, onPlayNote, handleAnswer]
  );

  const toggleMic = useCallback(async () => {
    if (isListening) {
      stop();
      setMicMode(false);
    } else {
      setMicMode(true);
      await start();
    }
  }, [isListening, start, stop]);

  // Cleanup mic when component unmounts
  useEffect(() => () => stop(), [stop]);

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
          title="Riascolta"
        >
          <Volume2 className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* ── Mic button — prominent, always visible ── */}
      <button
        onClick={toggleMic}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 ${
          isListening
            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/50'
            : 'bg-slate-800/70 border-slate-600 text-slate-200 hover:border-indigo-500 hover:text-indigo-300'
        }`}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        {isListening ? 'Microfono attivo — tocca per disattivare' : '🎹 Suona sul tuo piano'}
      </button>

      {/* Mic listening banner */}
      {isListening && (
        <div className="rounded-xl bg-indigo-950/70 border border-indigo-500/40 px-4 py-3 flex items-center gap-3">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
          </span>
          <span className="text-sm text-indigo-300 flex-1">Suona la nota sul piano…</span>
          {liveNote && (
            <span className="font-bold text-base text-white bg-indigo-600 px-3 py-1 rounded-lg">
              {toItalian(liveNote.name)}{liveNote.octave}
            </span>
          )}
        </div>
      )}

      {permissionDenied && (
        <p className="text-xs text-red-400 text-center">
          Microfono negato — controlla i permessi del browser
        </p>
      )}

      {/* Feedback */}
      {answerState !== 'idle' && <ResultFeedback answerState={answerState} correctNote={note} />}

      {/* Note name buttons */}
      <div className="bg-gray-800/60 rounded-xl p-2.5 border border-gray-700">
        <p className="text-xs text-gray-500 mb-2 text-center">oppure seleziona il nome</p>
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
