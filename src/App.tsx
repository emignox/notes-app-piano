import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from './hooks/useProgress';
import { useAudio } from './hooks/useAudio';
import { usePitchDetection } from './hooks/usePitchDetection';
import type { Tab } from './components/Shell';
import { BottomNav, TopBar } from './components/Shell';
import type { SongSection } from './components/MelodyView';
import type { ToastData } from './components/ui';
import { Toasts } from './components/ui';
import { GlossarioProvider } from './components/RichText';

// Le viste arrivano solo quando vengono aperte. Anche Pratica, pur essendo la
// schermata iniziale, resta separata: così la cornice dell'app può comparire
// prima che il browser analizzi VexFlow e il motore degli spartiti.
const PracticeView = lazy(() =>
  import('./components/PracticeView').then(module => ({ default: module.PracticeView })),
);
const MelodyView = lazy(() =>
  import('./components/MelodyView').then(module => ({ default: module.MelodyView })),
);
const PieceView = lazy(() =>
  import('./components/PieceView').then(module => ({ default: module.PieceView })),
);
const StudyView = lazy(() =>
  import('./components/StudyView').then(module => ({ default: module.StudyView })),
);
const SprintView = lazy(() =>
  import('./components/SprintView').then(module => ({ default: module.SprintView })),
);
const StatsView = lazy(() =>
  import('./components/StatsView').then(module => ({ default: module.StatsView })),
);
const SettingsView = lazy(() =>
  import('./components/SettingsView').then(module => ({ default: module.SettingsView })),
);

function ViewFallback() {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink3">
      Caricamento…
    </div>
  );
}

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

  // Prova del suono: l'unico modo onesto di capire se il telefono è muto per
  // colpa del browser o per l'interruttore silenzioso è farlo suonare.
  const testAudio = useCallback(async () => {
    const ok = await audio.test();
    if (ok) {
      notify('🔊', 'Senti un Do?', 'Se no: interruttore silenzioso e volume del telefono.');
    } else {
      notify('🔇', 'Audio ancora bloccato', 'Tocca lo schermo e riprova.');
    }
  }, [audio, notify]);

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
      level: pitch.level,
      confirmedNote: pitch.confirmedNote,
      suppress: pitch.suppress,
    }),
    [pitch.isListening, pitch.liveNote, pitch.level, pitch.confirmedNote, pitch.suppress],
  );

  return (
    <GlossarioProvider audio={audio}>
    <div className="min-h-screen bg-canvas text-ink">
      <TopBar
        level={progress.level}
        dayStreak={progress.data.dayStreak}
        goalPct={progress.goalPct}
        todayAnswers={progress.todayStat.answers}
        dailyGoal={progress.settings.dailyGoal}
        micOn={pitch.isListening}
        onToggleMic={toggleMic}
        audioOn={audio.running}
        onTestAudio={testAudio}
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

        <Suspense fallback={<ViewFallback />}>
          {tab === 'practice' && (
            <PracticeView progress={progress} audio={audio} mic={mic} notify={notify} onNavigate={setTab} />
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
          {tab === 'technique' && (
            <StudyView progress={progress} audio={audio} mic={mic} notify={notify} />
          )}
          {tab === 'sprint' && (
            <SprintView
              progress={progress}
              audio={audio}
              mic={{ isListening: pitch.isListening, confirmedNote: pitch.confirmedNote, suppress: pitch.suppress }}
              notify={notify}
            />
          )}
          {tab === 'stats' && <StatsView progress={progress} />}
          {tab === 'settings' && <SettingsView progress={progress} onTestSound={testAudio} />}
        </Suspense>
      </main>

      <BottomNav tab={tab} onChange={t => { setTab(t); window.scrollTo({ top: 0 }); }} />
      <Toasts items={toasts} onDone={dismissToast} />
    </div>
    </GlossarioProvider>
  );
}
