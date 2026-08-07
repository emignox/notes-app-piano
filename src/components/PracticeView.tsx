// ─────────────────────────────────────────────────────────────────────────────
// Il ciclo di studio: schermata di avvio → presentazione nota nuova → sessione
// → riepilogo.
//
// Dentro la sessione, una risposta sbagliata NON viene archiviata: la carta
// rientra in coda qualche domanda dopo. È il "riapprendimento" di Anki, ed è la
// differenza fra rivedere un errore e impararlo davvero.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useRef, useState } from 'react';
import { Play, Sparkles, Target, Timer } from 'lucide-react';
import type { Question } from '../lib/session';
import { buildSession, weakestNotes } from '../lib/session';
import { curriculum, noteById, TOTAL_LEVELS } from '../data/curriculum';
import { levelTitle } from '../lib/xp';
import { parseNote } from '../lib/notes';
import type { ProgressApi } from '../hooks/useProgress';
import type { AudioApi } from '../hooks/useAudio';
import type { ConfirmedNote, LiveNote } from '../hooks/usePitchDetection';
import { Bar, Btn, Card, Panel, Pill } from './ui';
import type { Notify } from './ui';
import { NoteIntro } from './NoteIntro';
import { PracticeCard } from './PracticeCard';
import type { SessionLogEntry } from './SessionSummary';
import { SessionSummary } from './SessionSummary';
import { PlacementTest } from './PlacementTest';

interface PracticeViewProps {
  progress: ProgressApi;
  audio: AudioApi;
  mic: {
    isListening: boolean;
    liveNote: LiveNote | null;
    level: number;
    confirmedNote: ConfirmedNote | null;
    suppress: (ms?: number) => void;
  };
  notify: Notify;
  onNavigate: (tab: 'technique' | 'melody') => void;
}

type Phase = 'start' | 'intro' | 'running' | 'summary';

const MAX_REQUEUE = 2;

export function PracticeView({ progress, audio, mic, notify, onNavigate }: PracticeViewProps) {
  const { data, settings, unlockedNotes, newestNote, streak } = progress;

  const needsIntro = !!newestNote && !data.introSeen.includes(newestNote.id);
  const [phase, setPhase] = useState<Phase>(needsIntro ? 'intro' : 'start');
  const [queue, setQueue] = useState<Question[]>([]);
  const [pos, setPos] = useState(0);
  const [xpGained, setXpGained] = useState(0);

  const logRef = useRef<SessionLogEntry[]>([]);
  const [log, setLog] = useState<SessionLogEntry[]>([]);
  const requeuesRef = useRef<Record<string, number>>({});

  const weak = useMemo(
    () => weakestNotes(unlockedNotes, data.cards, 6),
    [unlockedNotes, data.cards],
  );
  const weakIds = weak.map(w => w.note.id);

  const showAccidentals = useMemo(
    () => unlockedNotes.some(n => n.accidental === 'sharp' || n.accidental === 'flat'),
    [unlockedNotes],
  );

  const startSession = useCallback(
    (focusIds?: string[]) => {
      // Con poche note sbloccate una sessione lunga è solo ripetizione a vuoto.
      const cap = Math.max(4, unlockedNotes.length * 3);
      const questions = buildSession({
        unlocked: unlockedNotes,
        cards: data.cards,
        length: Math.min(settings.sessionLength, cap),
        focusIds,
      });
      if (questions.length === 0) return;
      logRef.current = [];
      requeuesRef.current = {};
      setLog([]);
      setQueue(questions);
      setPos(0);
      setXpGained(0);
      setPhase('running');
    },
    [unlockedNotes, data.cards, settings.sessionLength],
  );

  const finish = useCallback(() => {
    const wrongCount = logRef.current.filter(l => !l.correct).length;
    const unlocked = progress.finishSession(wrongCount);
    unlocked.forEach(a => notify(a.emoji, a.title, a.desc));
    if (wrongCount === 0 && logRef.current.length > 0) audio.playSuccess();
    progress.recordStudyMinutes(Math.max(1, Math.ceil(logRef.current.length / 8)));
    setPhase('summary');
  }, [progress, notify, audio]);

  const handleResult = useCallback(
    (correct: boolean, ms: number, usedHint: boolean) => {
      const q = queue[pos];
      if (!q) return;

      const outcome = progress.answer(q.noteId, q.dir, correct, ms, usedHint);
      setXpGained(x => x + outcome.xp);

      const entry: SessionLogEntry = { noteId: q.noteId, correct, ms };
      logRef.current = [...logRef.current, entry];
      setLog(logRef.current);

      if (outcome.leveledUp) {
        notify('🎉', `Livello ${outcome.leveledUp}!`, levelTitle(outcome.leveledUp));
      }
      outcome.achievements.forEach(a => notify(a.emoji, a.title, a.desc));

      // Riapprendimento: la nota sbagliata torna fra poche domande.
      const seen = requeuesRef.current[q.noteId] ?? 0;
      const requeue = !correct && seen < MAX_REQUEUE;
      if (requeue) {
        requeuesRef.current[q.noteId] = seen + 1;
        setQueue(prev => {
          const copy = [...prev];
          copy.splice(Math.min(copy.length, pos + 3), 0, { ...q, isNew: false });
          return copy;
        });
      }

      const nextLength = queue.length + (requeue ? 1 : 0);
      if (pos + 1 >= nextLength) finish();
      else setPos(pos + 1);
    },
    [queue, pos, progress, notify, finish],
  );

  const toggleInput = useCallback(() => {
    progress.setSettings({ readInput: settings.readInput === 'names' ? 'keys' : 'names' });
  }, [progress, settings.readInput]);

  const current = queue[pos];
  const currentNote = current ? noteById(current.noteId) : undefined;

  // La tastiera mostra l'ottava della nota (due se serve indovinare anche quella):
  // tasti grandi e sempre nella stessa posizione.
  const range = useMemo(() => {
    const oct = parseNote(currentNote?.englishName ?? newestNote?.englishName ?? 'C4').octave;
    return { from: `C${oct}`, to: `B${oct + (settings.strictOctave ? 1 : 0)}` };
  }, [currentNote, newestNote, settings.strictOctave]);

  if (!data.onboardingDone) {
    return (
      <PlacementTest
        onComplete={score => {
          progress.completePlacement(score);
          const label = score <= 1 ? 'Fondamenta' : score <= 3 ? 'Lettura e ritmo' : 'Armonia e repertorio';
          notify('🎓', `Percorso: ${label}`, `${score}/5 risposte corrette · puoi cambiare ritmo quando vuoi.`);
        }}
      />
    );
  }

  // ── Presentazione nota nuova ──────────────────────────────────────────────
  if (phase === 'intro' && newestNote) {
    const oct = parseNote(newestNote.englishName).octave;
    return (
      <NoteIntro
        note={newestNote}
        level={data.unlockedCount - 1}
        total={TOTAL_LEVELS}
        keyFrom={`C${oct}`}
        keyTo={`B${oct}`}
        onListen={() => { audio.playNote(newestNote.toneNote); mic.suppress(1800); }}
        onStart={() => { progress.markIntroSeen(newestNote.id); startSession(); }}
      />
    );
  }

  // ── Sessione in corso ─────────────────────────────────────────────────────
  if (phase === 'running' && current && currentNote) {
    return (
      <Card>
        <PracticeCard
          key={pos}
          note={currentNote}
          dir={current.dir}
          isNew={current.isNew}
          index={pos}
          total={queue.length}
          streak={streak}
          settings={settings}
          keyFrom={range.from}
          keyTo={range.to}
          showAccidentals={showAccidentals}
          micActive={mic.isListening}
          liveNote={mic.liveNote}
          micLevel={mic.level}
          confirmedNote={mic.confirmedNote}
          onResult={handleResult}
          onToggleInput={toggleInput}
          playNote={audio.playNote}
          playError={audio.playError}
          suppressMic={mic.suppress}
        />
      </Card>
    );
  }

  // ── Riepilogo ─────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    return (
      <SessionSummary
        log={log}
        xpGained={xpGained}
        canUnlockNext={progress.canUnlockNext}
        nextNote={curriculum[data.unlockedCount] ?? null}
        weakIds={weakIds}
        onRetry={() => startSession()}
        onDrill={() => startSession(weakIds)}
        onUnlock={() => {
          const note = progress.unlockNext();
          if (note) {
            notify('🔓', `Nota sbloccata: ${note.displayName}`, note.englishName);
            setPhase('intro');
          }
        }}
      />
    );
  }

  // ── Schermata di avvio ────────────────────────────────────────────────────
  const isFirstEver = data.answers === 0;
  const minutes = data.studyMinutes[new Date().toLocaleDateString('sv-SE')] ?? 0;
  const readingDone = progress.todayStat.answers >= Math.min(8, settings.dailyGoal);
  const reviewDone = progress.due === 0 && progress.todayStat.answers > 0;

  return (
    <div className="flex flex-col gap-3">
      <Card className="relative overflow-hidden border-brand/30 bg-gradient-to-br from-brand/20 via-surface to-surface">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-brand2/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">Il tuo studio di oggi</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-ink">Poco, bene, ogni giorno.</h1>
              <p className="mt-1 text-sm text-ink2">Completa un passo alla volta: il prossimo è già scelto.</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-black tabular-nums text-ink">{minutes}</p>
              <p className="text-[10px] uppercase tracking-wide text-ink3">minuti</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className={`rounded-xl border p-3 ${reviewDone ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-line bg-surface/70'}`}>
              <p className="font-black text-ink">{reviewDone ? '✓ ' : '1 · '}Ripasso</p>
              <p className="mt-0.5 text-ink3">{progress.due || 3} carte mirate</p>
            </div>
            <div className={`rounded-xl border p-3 ${readingDone ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-brand/30 bg-brand/10'}`}>
              <p className="font-black text-ink">{readingDone ? '✓ ' : '2 · '}Lettura</p>
              <p className="mt-0.5 text-ink3">8 risposte pulite</p>
            </div>
            <button type="button" onClick={() => onNavigate('technique')} className="rounded-xl border border-line bg-surface/70 p-3 text-left transition-colors hover:border-brand/50">
              <p className="font-black text-ink">3 · Teoria</p><p className="mt-0.5 text-ink3">{progress.theoryDue.length > 0 ? `${progress.theoryDue.length} errori da riprendere` : 'una lezione breve'}</p>
            </button>
            <button type="button" onClick={() => onNavigate('melody')} className="rounded-xl border border-line bg-surface/70 p-3 text-left transition-colors hover:border-brand/50">
              <p className="font-black text-ink">4 · Repertorio</p><p className="mt-0.5 text-ink3">una sezione lenta</p>
            </button>
          </div>
        </div>
      </Card>
      <Card className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">Sessione di lettura</h2>
            <p className="mt-0.5 text-sm text-ink2">
              {unlockedNotes.length} note nel tuo repertorio
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {progress.due > 0 && <Pill tone="warn">{progress.due} da ripassare</Pill>}
            {progress.canUnlockNext && <Pill tone="good">nota nuova pronta</Pill>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-ink3">
          <Pill>
            <Timer className="h-3 w-3" />
            {Math.min(settings.sessionLength, Math.max(4, unlockedNotes.length * 3))} domande
          </Pill>
          <Pill>
            {settings.readInput === 'names' ? 'rispondi coi nomi' : 'rispondi sulla tastiera'}
          </Pill>
          {mic.isListening && <Pill tone="brand">microfono attivo</Pill>}
        </div>

        <Btn full onClick={() => startSession()}>
          <Play className="h-4 w-4" />
          Inizia
        </Btn>

        {weakIds.length > 0 && (
          <Btn variant="soft" full onClick={() => startSession(weakIds)}>
            <Target className="h-4 w-4" />
            Allena le {weakIds.length} note più incerte
          </Btn>
        )}
      </Card>

      <Card className="focus-hide">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-ink3">Piano reale</p>
            <p className="mt-1 text-sm font-bold text-ink">Calibrazione microfono</p>
          </div>
          <Pill tone={mic.isListening ? (mic.level > 0.08 ? 'good' : 'warn') : 'neutral'}>
            {mic.isListening ? (mic.level > 0.08 ? 'segnale pronto' : 'suona una nota') : 'tocca 🎤 in alto'}
          </Pill>
        </div>
        {mic.isListening ? (
          <div className="mt-3 space-y-2">
            <Bar pct={Math.min(1, mic.level * 3.2)} color={mic.level > 0.08 ? 'bg-emerald-500' : 'bg-amber-500'} />
            <div className="flex items-center justify-between text-xs text-ink2">
              <span>{mic.liveNote ? `Rilevata: ${mic.liveNote.name}${mic.liveNote.octave}` : 'In ascolto…'}</span>
              <span className="tabular-nums">livello {Math.round(mic.level * 100)}%</span>
            </div>
            <p className="text-[11px] leading-relaxed text-ink3">Prova tre note a volume normale. Se la barra resta bassa, avvicina il telefono; se resta piena anche nel silenzio, allontanalo.</p>
          </div>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-ink3">Accendi il microfono e suona tre note prima della sessione. L’app ti dirà se il segnale è abbastanza chiaro.</p>
        )}
      </Card>

      {isFirstEver && (
        <Panel className="space-y-2 px-4 py-3 text-sm leading-relaxed text-ink2">
          <p className="flex items-center gap-2 font-bold text-ink">
            <Sparkles className="h-4 w-4 text-brand" />
            Come funziona
          </p>
          <p>1. Una nota alla volta: si sblocca la successiva solo quando la precedente ti viene automatica.</p>
          <p>2. Le note tornano quando stai per dimenticarle — non a caso: è ripetizione spaziata.</p>
          <p>3. Se hai un piano vero, accendi il 🎤 e rispondi suonando: è il modo più efficace.</p>
        </Panel>
      )}

      {weak.length > 0 && (
        <Card>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink3">Da tenere d'occhio</p>
          <div className="flex flex-wrap gap-2">
            {weak.map(w => (
              <Pill key={w.note.id} tone="warn">
                {w.note.displayName} ({w.note.englishName})
              </Pill>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
