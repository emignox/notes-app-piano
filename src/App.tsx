import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from './hooks/useProgress';
import { useAudio } from './hooks/useAudio';
import { usePitchDetection } from './hooks/usePitchDetection';
import type { Tab } from './components/Shell';
import { BottomNav, TopBar } from './components/Shell';
import { PracticeView } from './components/PracticeView';
import type { SongSection } from './components/MelodyView';
import { MelodyView } from './components/MelodyView';
import { PieceView } from './components/PieceView';
import { SprintView } from './components/SprintView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import type { ToastData } from './components/ui';
import { Toasts } from './components/ui';

export default function App() {
  const progress = useProgress();
  const audio = useAudio(progress.settings.volume);
  const pitch = usePitchDetection();

  const [tab, setTab] = useState<Tab>('practice');
  const [songSection, setSongSection] = useState<SongSection>('melodie');
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastId = useRef(0);

  const notify = useCallback((emoji: string, title: string, desc?: string) => {
    toastId.current += 1;
    setToasts(prev => [...prev.slice(-2), { id: toastId.current, emoji, title, desc }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // L'audio parte al primo tocco: i browser lo richiedono, e chiedere all'utente
  // di premere un pulsante "Audio" era un attrito inutile.
  const initRef = useRef(audio.initialize);
  useEffect(() => { initRef.current = audio.initialize; });
  useEffect(() => {
    const kick = () => { void initRef.current(); };
    window.addEventListener('pointerdown', kick, { once: true, passive: true });
    window.addEventListener('keydown', kick, { once: true });
    return () => {
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
  }, []);

  const toggleMic = useCallback(async () => {
    if (pitch.isListening) {
      pitch.stop();
      return;
    }
    await audio.initialize();
    await pitch.start();
  }, [pitch, audio]);

  const mic = useMemo(
    () => ({
      isListening: pitch.isListening,
      liveNote: pitch.liveNote,
      confirmedNote: pitch.confirmedNote,
      suppress: pitch.suppress,
    }),
    [pitch.isListening, pitch.liveNote, pitch.confirmedNote, pitch.suppress],
  );

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <TopBar
        level={progress.level}
        dayStreak={progress.data.dayStreak}
        goalPct={progress.goalPct}
        todayAnswers={progress.todayStat.answers}
        dailyGoal={progress.settings.dailyGoal}
        micOn={pitch.isListening}
        onToggleMic={toggleMic}
      />

      <main className="mx-auto max-w-2xl space-y-3 px-3 pb-28 pt-3">
        {pitch.permissionDenied && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            Microfono negato: controlla i permessi del browser per usare il piano vero come risposta.
          </div>
        )}
        {audio.status === 'fallback' && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-400">
            Campioni di pianoforte non disponibili (sei offline?): sto usando un suono sintetico.
          </div>
        )}

        {tab === 'practice' && (
          <PracticeView progress={progress} audio={audio} mic={mic} notify={notify} />
        )}
        {tab === 'melody' &&
          (songSection === 'melodie' ? (
            <MelodyView
              progress={progress}
              audio={audio}
              mic={mic}
              notify={notify}
              section={songSection}
              onSection={setSongSection}
            />
          ) : (
            <PieceView
              progress={progress}
              audio={audio}
              mic={{ isListening: pitch.isListening, confirmedNote: pitch.confirmedNote, suppress: pitch.suppress }}
              notify={notify}
              section={songSection}
              onSection={setSongSection}
            />
          ))}
        {tab === 'sprint' && (
          <SprintView
            progress={progress}
            audio={audio}
            mic={{ isListening: pitch.isListening, confirmedNote: pitch.confirmedNote, suppress: pitch.suppress }}
            notify={notify}
          />
        )}
        {tab === 'stats' && <StatsView progress={progress} />}
        {tab === 'settings' && <SettingsView progress={progress} />}
      </main>

      <BottomNav tab={tab} onChange={setTab} />
      <Toasts items={toasts} onDone={dismissToast} />
    </div>
  );
}
