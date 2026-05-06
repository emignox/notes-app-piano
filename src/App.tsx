import { useState, useCallback } from 'react';
import { Music, RotateCcw, ChevronRight, Sun, Moon, Loader2, Volume2, Flame, Mic, MicOff } from 'lucide-react';
import { useLearning } from './hooks/useLearning';
import { useAudio } from './hooks/useAudio';
import { usePitchDetection } from './hooks/usePitchDetection';
import { ProgressBar } from './components/ProgressBar';
import { LevelIntro } from './components/LevelIntro';
import { Flashcard } from './components/Flashcard';
import { MelodyMode } from './components/MelodyMode';
import { curriculum } from './data/curriculum';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);
  const [appMode, setAppMode] = useState<'learn' | 'melody'>('learn');

  const { state, currentNote, sessionComplete, dismissIntro, recordAnswer, advanceLevel, resetProgress } = useLearning();
  const { isLoading, initialize, playNote, playError, playMelody } = useAudio();

  // Global mic — persists across sessions and level changes
  const { isListening, permissionDenied, liveNote, confirmedNote, start: startMic, stop: stopMic, suppress: suppressMic } = usePitchDetection();
  const toggleMic = useCallback(async () => {
    if (isListening) stopMic(); else await startMic();
  }, [isListening, startMic, stopMic]);

  const handleStartAudio = useCallback(async () => {
    await initialize();
    setAudioStarted(true);
  }, [initialize]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (correct) {
        playNote(state.currentSession[state.currentIndex]?.toneNote ?? 'C4');
        suppressMic(2500);
      } else {
        playError();
        suppressMic(900); // grace period before next card accepts mic input
      }
      recordAnswer(correct);
    },
    [playNote, playError, suppressMic, recordAnswer, state.currentSession, state.currentIndex]
  );

  const handlePlayNote = useCallback((toneNote: string) => {
    playNote(toneNote);
    suppressMic(2500); // block mic for 2.5s after playing to avoid feedback loop
  }, [playNote, suppressMic]);

  const learnedNoteNames = state.learnedNotes.map(n => `${n.displayName} (${n.englishName})`);
  const scorePercent = state.currentSession.length > 0
    ? Math.round((state.score / state.currentSession.length) * 100) : 0;
  const isLastLevel = state.currentLevel >= curriculum.length - 1;

  const bg = darkMode
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white'
    : 'bg-gradient-to-br from-slate-100 via-white to-indigo-50 text-gray-900';
  const cardBg = darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-200';
  const headerBg = darkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/80 border-gray-200';

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      {/* Header */}
      <header className={`${headerBg} border-b px-3 py-2.5 sticky top-0 z-10 backdrop-blur-md`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Music className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <h1 className="text-base font-bold text-indigo-400 truncate">Piano Note Trainer</h1>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Streak badge */}
            {state.streak >= 2 && (
              <div className="flex items-center gap-0.5 px-2 py-1 bg-orange-500/20 border border-orange-500/40 rounded-lg">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-bold text-orange-300">{state.streak}</span>
              </div>
            )}

            {/* Mic toggle — global, always shows text */}
            <button
              onClick={toggleMic}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${
                isListening
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-900/50'
                  : 'bg-slate-700/60 border-slate-500 text-slate-200 hover:border-indigo-400 hover:text-indigo-300'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening ? 'Mic ON' : 'Mic'}
            </button>

            {/* Audio button */}
            {!audioStarted ? (
              <button
                onClick={handleStartAudio}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white text-xs rounded-lg font-medium transition-all"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>🔊</span>}
                Audio
              </button>
            ) : isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            ) : (
              <button
                onClick={handlePlayNote.bind(null, currentNote?.toneNote ?? 'C4')}
                className="flex items-center gap-1 px-2 py-1.5 bg-green-800/50 hover:bg-green-700/60 border border-green-600/40 rounded-lg transition-all"
                title="Riproduci nota corrente"
              >
                <Volume2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-300 hidden sm:inline">Audio</span>
              </button>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-all"
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
            </button>
            <button
              onClick={() => { if (window.confirm('Vuoi azzerare tutto il progresso?')) resetProgress(); }}
              className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-red-800/50 transition-all"
              title="Reset progresso"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-3 py-3 sm:py-5 space-y-3">
        <ProgressBar currentLevel={state.currentLevel} learnedNoteNames={learnedNoteNames} />

        {/* Canzoncine button */}
        {appMode === 'learn' && (
          <button
            onClick={() => setAppMode('melody')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-900/50 hover:bg-indigo-800/60 border border-indigo-500/40 hover:border-indigo-400/60 text-indigo-300 hover:text-indigo-200 font-semibold text-sm transition-all"
          >
            <span>🎵</span>
            Canzoncine
          </button>
        )}

        {/* Melody mode */}
        {appMode === 'melody' && (
          <div className={`rounded-2xl border ${cardBg} p-3 sm:p-4`}>
            <MelodyMode
              learnedToneNotes={state.learnedNotes.map(n => n.toneNote)}
              playMelody={playMelody}
              suppressMic={suppressMic}
              onPlayNote={handlePlayNote}
              onBack={() => setAppMode('learn')}
            />
          </div>
        )}

        {/* Level intro */}
        {appMode === 'learn' && state.showIntro && state.learnedNotes.length > 0 && (
          <div className={`rounded-2xl border ${cardBg} p-2`}>
            <LevelIntro
              note={state.learnedNotes[state.learnedNotes.length - 1]}
              levelNumber={state.currentLevel}
              onListen={() => playNote(state.learnedNotes[state.learnedNotes.length - 1].toneNote)}
              onStart={dismissIntro}
            />
          </div>
        )}

        {/* Session complete */}
        {appMode === 'learn' && sessionComplete && !state.showIntro && (
          <div className="rounded-2xl border border-indigo-500/50 bg-gradient-to-b from-indigo-900/40 to-slate-900/60 p-6 text-center space-y-4">
            <div className="text-5xl">{scorePercent === 100 ? '🏆' : scorePercent >= 70 ? '🎹' : '💪'}</div>
            <h2 className="text-2xl font-bold text-white">
              {scorePercent === 100 ? 'Perfetto!' : scorePercent >= 70 ? 'Ottimo lavoro!' : 'Continua così!'}
            </h2>
            <div className="flex items-center justify-center gap-3">
              <span className={`text-2xl font-bold ${scorePercent === 100 ? 'text-green-300' : scorePercent >= 70 ? 'text-yellow-300' : 'text-orange-300'}`}>
                {state.score}/{state.currentSession.length}
              </span>
              <span className="text-slate-400 text-sm">·</span>
              <span className={`text-lg font-semibold ${scorePercent === 100 ? 'text-green-400' : scorePercent >= 70 ? 'text-yellow-400' : 'text-orange-400'}`}>
                {scorePercent}%
              </span>
            </div>
            {/* Per-note results summary */}
            <div className="flex gap-1.5 justify-center flex-wrap">
              {state.answerResults.map((r, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    r === 'correct' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}
                  title={state.currentSession[i]?.displayName}
                >
                  {r === 'correct' ? '✓' : '✗'}
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center flex-wrap pt-1">
              <button
                onClick={dismissIntro}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Riprova
              </button>
              {!isLastLevel ? (
                <button
                  onClick={advanceLevel}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/50"
                >
                  Nota successiva
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <p className="text-yellow-400 font-bold text-lg w-full">🎉 Curriculum completato!</p>
              )}
            </div>
          </div>
        )}

        {/* Mic permission denied warning */}
        {appMode === 'learn' && permissionDenied && (
          <div className="rounded-xl bg-red-900/30 border border-red-500/40 px-4 py-2.5 text-sm text-red-300 text-center">
            Microfono negato — controlla i permessi del browser
          </div>
        )}

        {/* Flashcard quiz */}
        {appMode === 'learn' && !state.showIntro && !sessionComplete && currentNote && (
          <div className={`rounded-2xl border ${cardBg} p-3 sm:p-4`}>
            <Flashcard
              note={currentNote}
              allNotes={state.currentSession}
              sessionIndex={state.currentIndex}
              sessionTotal={state.currentSession.length}
              results={state.answerResults}
              streak={state.streak}
              micActive={isListening}
              liveNote={liveNote}
              confirmedNote={confirmedNote}
              onAnswer={handleAnswer}
              onPlayNote={handlePlayNote}
              suppressMic={suppressMic}
            />
          </div>
        )}
      </main>
    </div>
  );
}
