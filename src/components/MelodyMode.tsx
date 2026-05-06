import { useState, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, Volume2, ChevronLeft } from 'lucide-react';
import type { NoteEntry, NoteResult, AnswerState, MelodyNote } from '../types';
import { melodies } from '../data/melodies';
import type { Melody } from '../types';
import { Staff } from './Staff';
import { NoteNameButtons } from './NoteNameButtons';
import { PianoKeyboard } from './PianoKeyboard';

interface MelodyModeProps {
  learnedToneNotes: string[];
  playMelody: (notes: Array<{ toneNote: string; durationSec: number }>) => void;
  suppressMic: (ms?: number) => void;
  onPlayNote: (toneNote: string) => void;
  onBack: () => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const IT_NAMES: Record<string, string> = {
  C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si',
};
function toItalianDisplay(toneNote: string): string {
  const base = toneNote.replace(/[#b\d]/g, '');
  const it = IT_NAMES[base] ?? base;
  if (toneNote.includes('#')) return `${it}♯`;
  if (toneNote.replace(/\d+$/, '').endsWith('b')) return `${it}♭`;
  return it;
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
  const noteNormalized =
    acc === 'b'
      ? (enharmonic[`${letter}b`] ?? `${letter}${acc}`)
      : `${letter}${acc}`;
  return noteNormalized === normalized;
}

function melodyNoteToEntry(mn: MelodyNote): NoteEntry {
  const displayName = toItalianDisplay(mn.toneNote);
  const noteValue =
    mn.duration === 'w' ? 'whole' : mn.duration === 'h' ? 'half' : 'quarter';
  return {
    id: mn.toneNote,
    clef: mn.clef,
    pitch: mn.vexflowKey.replace('/', '/'),
    displayName,
    englishName: mn.toneNote,
    vexflowKey: mn.vexflowKey,
    accidental: mn.accidental,
    noteValue,
    description: '',
    toneNote: mn.toneNote,
  };
}

// ── MelodyCard ────────────────────────────────────────────────────────────────

interface MelodyCardProps {
  melody: Melody;
  learned: string[];
  onSelect: (m: Melody) => void;
}

function MelodyCard({ melody, learned, onSelect }: MelodyCardProps) {
  const missing = melody.requiredToneNotes.filter(n => !learned.includes(n));
  const isAvailable = missing.length === 0;

  const diffColor =
    melody.difficulty === 'facile'
      ? 'bg-green-700/80 text-green-100'
      : melody.difficulty === 'medio'
      ? 'bg-yellow-700/80 text-yellow-100'
      : 'bg-red-800/80 text-red-100';

  return (
    <button
      onClick={() => isAvailable && onSelect(melody)}
      disabled={!isAvailable}
      className={`w-full text-left rounded-2xl border p-4 transition-all ${
        isAvailable
          ? 'bg-slate-800/80 border-indigo-500/60 hover:border-indigo-400 hover:bg-slate-700/80 active:scale-[0.98] shadow-md shadow-indigo-900/20'
          : 'bg-slate-900/60 border-slate-700/50 opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0 mt-0.5">{melody.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-base truncate">{melody.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${diffColor}`}>
              {melody.difficulty}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{melody.composer}</p>
          <p className="text-xs text-slate-500 mt-1">{melody.notes.length} note</p>
          {!isAvailable && (
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-xs text-slate-500">Serve:</span>
              {missing.map(t => (
                <span
                  key={t}
                  className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded"
                >
                  {toItalianDisplay(t)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ── ChallengeResult ───────────────────────────────────────────────────────────

interface ChallengeResultProps {
  score: number;
  total: number;
  melody: Melody;
  onRetry: () => void;
  onBack: () => void;
}

function ChallengeResult({ score, total, melody, onRetry, onBack }: ChallengeResultProps) {
  const pct = Math.round((score / total) * 100);
  const emoji = pct === 100 ? '🏆' : pct >= 70 ? '🎹' : '💪';
  const message = pct === 100 ? 'Perfetto!' : pct >= 70 ? 'Ottimo lavoro!' : 'Continua così!';
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="text-5xl">{emoji}</div>
      <h2 className="text-2xl font-bold text-white">{message}</h2>
      <p className="text-slate-400 text-sm">{melody.title} · {melody.composer}</p>
      <div className="flex items-center gap-3">
        <span
          className={`text-2xl font-bold ${
            pct === 100 ? 'text-green-300' : pct >= 70 ? 'text-yellow-300' : 'text-orange-300'
          }`}
        >
          {score}/{total}
        </span>
        <span className="text-slate-500">·</span>
        <span
          className={`text-lg font-semibold ${
            pct === 100 ? 'text-green-400' : pct >= 70 ? 'text-yellow-400' : 'text-orange-400'
          }`}
        >
          {pct}%
        </span>
      </div>
      <div className="flex gap-3 flex-wrap justify-center pt-2">
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
        >
          Riprova
        </button>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
        >
          Altre melodie
        </button>
      </div>
    </div>
  );
}

// ── MelodyChallenge ───────────────────────────────────────────────────────────

interface MelodyChallengeProps {
  melody: Melody;
  onPlayNote: (toneNote: string) => void;
  playMelody: (notes: Array<{ toneNote: string; durationSec: number }>) => void;
  suppressMic: (ms?: number) => void;
  onBack: () => void;
}

function MelodyChallenge({
  melody,
  onPlayNote,
  playMelody,
  suppressMic,
  onBack,
}: MelodyChallengeProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [results, setResults] = useState<NoteResult[]>(() =>
    melody.notes.map(() => 'unanswered'),
  );
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const noteEntries: NoteEntry[] = useMemo(
    () => melody.notes.map(melodyNoteToEntry),
    [melody],
  );
  const durations: string[] = melody.notes.map(mn => mn.duration);

  const { startOctave, endOctave } = useMemo(() => {
    const octaves = noteEntries.map(n => parseInt(n.toneNote.match(/\d+$/)?.[0] ?? '4'));
    return { startOctave: Math.min(...octaves), endOctave: Math.max(...octaves) };
  }, [noteEntries]);

  const handlePlayMelody = useCallback(() => {
    const totalDuration = melody.notes.reduce((s, n) => s + n.durationSec, 0);
    suppressMic(Math.ceil((totalDuration + 1) * 1000));
    playMelody(melody.notes.map(n => ({ toneNote: n.toneNote, durationSec: n.durationSec })));
  }, [melody, playMelody, suppressMic]);

  const advance = useCallback(
    () => {
      const next = currentIdx + 1;
      if (next >= melody.notes.length) {
        setDone(true);
      } else {
        setCurrentIdx(next);
        setAnswerState('idle');
      }
    },
    [currentIdx, melody.notes.length],
  );

  const handleAnswer = useCallback(
    (answer: string) => {
      if (answerState !== 'idle' || done) return;
      const entry = noteEntries[currentIdx];
      const correct = noteMatchesAnswer(entry, answer);
      setAnswerState(correct ? 'correct' : 'wrong');
      setResults(prev => {
        const updated = [...prev];
        updated[currentIdx] = correct ? 'correct' : 'wrong';
        return updated;
      });
      if (correct) {
        setScore(s => s + 1);
        onPlayNote(entry.toneNote);
        suppressMic(2000);
      }
      setTimeout(() => advance(), correct ? 1200 : 1500);
    },
    [answerState, done, noteEntries, currentIdx, onPlayNote, suppressMic, advance],
  );

  const handlePianoKey = useCallback(
    (toneNote: string) => {
      if (answerState !== 'idle' || done) return;
      onPlayNote(toneNote);
      handleAnswer(toneNote.replace(/\d+$/, ''));
    },
    [answerState, done, onPlayNote, handleAnswer],
  );

  const handleRetry = useCallback(() => {
    setCurrentIdx(0);
    setAnswerState('idle');
    setResults(melody.notes.map(() => 'unanswered'));
    setScore(0);
    setDone(false);
  }, [melody]);

  if (done) {
    return (
      <ChallengeResult
        score={score}
        total={melody.notes.length}
        melody={melody}
        onRetry={handleRetry}
        onBack={onBack}
      />
    );
  }

  const currentEntry = noteEntries[currentIdx];

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-all flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-slate-300" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">
            {melody.emoji} {melody.title}
          </p>
          <p className="text-xs text-slate-400">{melody.composer}</p>
        </div>
        <span className="text-xs text-slate-400 flex-shrink-0">
          {currentIdx + 1}/{melody.notes.length}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 flex-wrap">
        {melody.notes.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-4 rounded-full transition-all ${
              i < currentIdx
                ? results[i] === 'correct'
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : i === currentIdx
                ? 'bg-indigo-400'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Staff + listen button */}
      <div className="relative">
        <Staff
          notes={noteEntries}
          currentIndex={currentIdx}
          results={results}
          currentAnswerState={answerState}
          durations={durations}
        />
        <button
          onClick={handlePlayMelody}
          className="absolute top-1.5 right-1.5 flex items-center gap-1 px-2 py-1.5 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-all text-xs text-gray-300"
          title="Ascolta la melodia"
        >
          <Volume2 className="w-3.5 h-3.5 text-gray-400" />
          <span className="hidden sm:inline">Ascolta</span>
        </button>
      </div>

      {/* Feedback */}
      {answerState !== 'idle' && (
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-lg transition-all ${
            answerState === 'correct'
              ? 'bg-green-900/60 border border-green-500 text-green-300'
              : 'bg-red-900/60 border border-red-500 text-red-300'
          }`}
        >
          {answerState === 'correct' ? (
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          )}
          <span>
            {answerState === 'correct'
              ? 'Corretto!'
              : `Sbagliato! Era ${currentEntry.displayName} (${currentEntry.englishName})`}
          </span>
        </div>
      )}

      {/* Note name buttons */}
      <div className="bg-gray-800/60 rounded-xl p-2.5 border border-gray-700">
        <p className="text-xs text-gray-500 mb-2 text-center">seleziona il nome della nota</p>
        <NoteNameButtons onSelect={handleAnswer} disabled={answerState !== 'idle'} />
      </div>

      {/* Piano keyboard */}
      <div className="bg-gray-800/60 rounded-xl p-2 border border-gray-700">
        <p className="text-xs text-gray-500 mb-1.5 text-center">oppure clicca sulla tastiera</p>
        <PianoKeyboard
          onKeyPress={handlePianoKey}
          correctNote={answerState !== 'idle' ? currentEntry.toneNote : null}
          pressedNote={null}
          showAnswer={answerState !== 'idle'}
          startOctave={startOctave}
          endOctave={endOctave}
        />
      </div>
    </div>
  );
}

// ── MelodyMode (main export) ──────────────────────────────────────────────────

export function MelodyMode({
  learnedToneNotes,
  playMelody,
  suppressMic,
  onPlayNote,
  onBack,
}: MelodyModeProps) {
  const [view, setView] = useState<'select' | 'challenge'>('select');
  const [selectedMelody, setSelectedMelody] = useState<Melody | null>(null);

  const handleSelectMelody = useCallback((m: Melody) => {
    setSelectedMelody(m);
    setView('challenge');
  }, []);

  const handleBackToSelect = useCallback(() => {
    setView('select');
    setSelectedMelody(null);
  }, []);

  if (view === 'challenge' && selectedMelody) {
    return (
      <MelodyChallenge
        melody={selectedMelody}
        onPlayNote={onPlayNote}
        playMelody={playMelody}
        suppressMic={suppressMic}
        onBack={handleBackToSelect}
      />
    );
  }

  // Select view
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-slate-300" />
        </button>
        <div>
          <h2 className="font-bold text-white text-lg">Canzoncine</h2>
          <p className="text-xs text-slate-400">Scegli una melodia da indovinare</p>
        </div>
      </div>

      {/* Melody cards */}
      <div className="flex flex-col gap-3">
        {melodies.map(melody => (
          <MelodyCard
            key={melody.id}
            melody={melody}
            learned={learnedToneNotes}
            onSelect={handleSelectMelody}
          />
        ))}
      </div>
    </div>
  );
}
