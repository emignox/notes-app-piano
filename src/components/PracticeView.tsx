// ─────────────────────────────────────────────────────────────────────────────
// Il ciclo di studio: schermata di avvio → presentazione nota nuova → sessione
// → riepilogo.
//
// Dentro la sessione, una risposta sbagliata NON viene archiviata: la carta
// rientra in coda qualche domanda dopo. È il "riapprendimento" di Anki, ed è la
// differenza fra rivedere un errore e impararlo davvero. Quando rientra porta
// con sé la diagnosi dell'errore, e alla fine si allenano insieme la nota
// sbagliata e quella con cui l'hai confusa.
//
// La schermata di avvio è il PIANO DI OGGI, calcolato dal tuo stato: ripasso
// (le carte davvero scadute), nota nuova se sei pronto, teoria (gli errori da
// riprendere o la lezione dopo), musica (la canzone che puoi già leggere).
// Ogni passo apre direttamente la cosa giusta.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Check, ChevronRight, Eye, Music, Play, Target, Timer, Unlock } from 'lucide-react';
import type { NoteEntry } from '../types';
import type { Question } from '../lib/session';
import { buildSession, weakestNotes } from '../lib/session';
import { curriculum, noteById, TOTAL_LEVELS } from '../data/curriculum';
import { modules } from '../data/lessons';
import { melodies } from '../data/melodies';
import { levelTitle } from '../lib/xp';
import { italianOf, parseNote } from '../lib/notes';
import type { Card as SrsCard } from '../lib/srs';
import { cardKey, SLOW_MS } from '../lib/srs';
import { KIND_LABEL, confusionPartner, diagnose, topConfusions } from '../lib/diagnosis';
import type { ProgressApi } from '../hooks/useProgress';
import type { AudioApi } from '../hooks/useAudio';
import type { ConfirmedNote, LiveNote } from '../hooks/usePitchDetection';
import { Btn, Card, ImageCover, PageHeader, Panel, Pill, Section } from './ui';
import { IMG } from '../data/images';
import type { Notify } from './ui';
import type { Intent, Navigate } from './Shell';
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
  onNavigate: Navigate;
}

type Phase = 'start' | 'intro' | 'running' | 'summary';

const MAX_REQUEUE = 2;

/** Che cosa manca alla nota più recente per far sbloccare la prossima. */
function readiness(card: SrsCard | undefined): string {
  if (!card || card.reps === 0) return 'ancora da provare';
  const need: string[] = [];
  if (card.correct < 3) need.push(`${3 - card.correct} ${3 - card.correct === 1 ? 'risposta giusta' : 'risposte giuste'}`);
  if (card.streak < 2) need.push('due giuste di fila');
  if (card.avgMs >= SLOW_MS + 1500) need.push('un po\' più di sicurezza');
  return need.length ? `mancano ${need.join(', ')}` : 'quasi pronta';
}

/** Che cosa fa un passo del piano quando lo tocchi. */
type PlanAction =
  | { kind: 'session' }
  | { kind: 'unlock' }
  | { kind: 'go'; tab: 'technique' | 'melody'; intent: Intent };

interface PlanStep {
  key: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  done: boolean;
  action: PlanAction;
}

function PlanRow({ step, n, isNext, onRun }: { step: PlanStep; n: number; isNext: boolean; onRun: (a: PlanAction) => void }) {
  const Icon = step.icon;
  return (
    <button
      type="button"
      onClick={() => onRun(step.action)}
      className={`flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-surface2 ${isNext && !step.done ? 'bg-brand/[0.06]' : ''}`}
    >
      <span
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
          step.done ? 'bg-emerald-500/15 text-emerald-400' : isNext ? 'bg-brand text-white' : 'bg-surface2 text-ink3'
        }`}
      >
        {step.done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`flex items-center gap-2 text-[15px] font-semibold tracking-tight ${step.done ? 'text-ink3' : 'text-ink'}`}>
          <span className="text-[11px] font-medium tabular-nums text-ink3">{n}</span>
          <span className="truncate">{step.title}</span>
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-ink3">{step.detail}</span>
      </span>
      <ChevronRight className={`h-4 w-4 flex-shrink-0 ${isNext && !step.done ? 'text-brand' : 'text-ink3/60'}`} />
    </button>
  );
}

/** Saluto e data di oggi, per il titolo della pagina. */
function todayTitle(): { greeting: string; date: string } {
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 5 ? 'Buonanotte' : h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const date = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  return { greeting, date };
}

export function PracticeView({ progress, audio, mic, notify, onNavigate }: PracticeViewProps) {
  const { data, settings, unlockedNotes, newestNote, streak } = progress;
  const [title] = useState(todayTitle);

  const needsIntro = !!newestNote && !data.introSeen.includes(newestNote.id);
  const [phase, setPhase] = useState<Phase>(needsIntro ? 'intro' : 'start');
  const [queue, setQueue] = useState<Question[]>([]);
  const [pos, setPos] = useState(0);
  const [xpGained, setXpGained] = useState(0);

  const logRef = useRef<SessionLogEntry[]>([]);
  const [log, setLog] = useState<SessionLogEntry[]>([]);
  const requeuesRef = useRef<Record<string, number>>({});
  /** Diagnosi dell'ultimo errore per nota: la si ricorda quando la nota torna. */
  const [warnings, setWarnings] = useState<Record<string, string>>({});

  const weak = useMemo(
    () => weakestNotes(unlockedNotes, data.cards, 6),
    [unlockedNotes, data.cards],
  );
  const weakIds = weak.map(w => w.note.id);

  const confusions = useMemo(
    () => topConfusions(unlockedNotes, data.confusions, 3),
    [unlockedNotes, data.confusions],
  );

  const showAccidentals = useMemo(
    () => unlockedNotes.some(n => n.accidental === 'sharp' || n.accidental === 'flat'),
    [unlockedNotes],
  );

  // Con poche note sbloccate una sessione lunga è solo ripetizione a vuoto.
  const sessionLength = Math.min(settings.sessionLength, Math.max(4, unlockedNotes.length * 3));

  const startSession = useCallback(
    (focusIds?: string[]) => {
      const questions = buildSession({
        unlocked: unlockedNotes,
        cards: data.cards,
        length: sessionLength,
        focusIds,
      });
      if (questions.length === 0) return;
      logRef.current = [];
      requeuesRef.current = {};
      setWarnings({});
      setLog([]);
      setQueue(questions);
      setPos(0);
      setXpGained(0);
      setPhase('running');
      window.scrollTo({ top: 0 });
    },
    [unlockedNotes, data.cards, sessionLength],
  );

  /** Le note sbagliate più quelle con cui le hai confuse: si allenano insieme. */
  const drillIds = useCallback((pairs: { note: NoteEntry; given: string }[]): string[] => {
    const ids = new Set<string>();
    for (const { note, given } of pairs) {
      ids.add(note.id);
      const partner = confusionPartner(note, given, unlockedNotes);
      if (partner) ids.add(partner.id);
    }
    return [...ids];
  }, [unlockedNotes]);

  const finish = useCallback(() => {
    const wrongCount = logRef.current.filter(l => !l.correct).length;
    const unlocked = progress.finishSession(wrongCount);
    unlocked.forEach(a => notify(a.emoji, a.title, a.desc));
    if (wrongCount === 0 && logRef.current.length > 0) audio.playSuccess();
    setPhase('summary');
  }, [progress, notify, audio]);

  const handleResult = useCallback(
    (correct: boolean, ms: number, usedHint: boolean, given: string) => {
      const q = queue[pos];
      const note = q ? noteById(q.noteId) : undefined;
      if (!q || !note) return;

      const outcome = progress.answer(q.noteId, q.dir, correct, ms, usedHint, given);
      setXpGained(x => x + outcome.xp);

      const mistake = correct ? null : diagnose(note, given, q.dir);
      setWarnings(prev => {
        const next = { ...prev };
        if (mistake) next[q.noteId] = mistake.text;
        else delete next[q.noteId];
        return next;
      });

      const entry: SessionLogEntry = { noteId: q.noteId, dir: q.dir, correct, ms, given: correct ? undefined : given, mistake };
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

  const unlockAndIntroduce = useCallback(() => {
    const note = progress.unlockNext();
    if (note) {
      notify('🔓', `Nota sbloccata: ${note.displayName}`, note.englishName);
      setPhase('intro');
    }
  }, [progress, notify]);

  const current = queue[pos];
  const currentNote = current ? noteById(current.noteId) : undefined;

  // La tastiera mostra l'ottava della nota (due se serve indovinare anche quella):
  // tasti grandi e sempre nella stessa posizione.
  const range = useMemo(() => {
    const oct = parseNote(currentNote?.englishName ?? newestNote?.englishName ?? 'C4').octave;
    return { from: `C${oct}`, to: `B${oct + (settings.strictOctave ? 1 : 0)}` };
  }, [currentNote, newestNote, settings.strictOctave]);

  // ── Il piano di oggi ──────────────────────────────────────────────────────
  const learned = useMemo(() => unlockedNotes.map(n => n.toneNote), [unlockedNotes]);
  const plan = useMemo<PlanStep[]>(() => {
    const today = progress.todayStat;
    const steps: PlanStep[] = [];

    const unseen = unlockedNotes.filter(n => (data.cards[cardKey(n.id, 'read')]?.reps ?? 0) === 0).length;
    const newestCard = newestNote ? data.cards[cardKey(newestNote.id, 'read')] : undefined;
    steps.push({
      key: 'lettura',
      icon: Eye,
      title: progress.due > 0 ? 'Ripasso di lettura' : 'Lettura',
      detail:
        progress.due > 0
          ? `${progress.due} ${progress.due === 1 ? 'nota torna' : 'note tornano'} oggi, prima di dimenticarle`
          : unseen > 0
            ? `${unseen} ${unseen === 1 ? 'nota' : 'note'} da provare per la prima volta`
            : newestNote && !progress.canUnlockNext && !progress.isComplete
              ? `${newestNote.displayName}: ${readiness(newestCard)} per sbloccare la prossima`
              : 'una sessione breve per restare sciolto',
      done: progress.due === 0 && today.answers >= sessionLength,
      action: { kind: 'session' },
    });

    if (progress.canUnlockNext) {
      const next = curriculum[data.unlockedCount];
      steps.push({
        key: 'nuova',
        icon: Unlock,
        title: `Nota nuova: ${next?.displayName ?? ''}`,
        detail: `${newestNote?.displayName} ti viene automatica: è il momento di aggiungerne una`,
        done: false,
        action: { kind: 'unlock' },
      });
    }

    const nextLesson = modules.flatMap(m => m.lessons).find(l => !data.lessonsDone.includes(l.id));
    const theoryDone = (today.theory ?? 0) > 0 && progress.theoryDue.length === 0;
    if (progress.theoryDue.length > 0) {
      steps.push({
        key: 'teoria',
        icon: BookOpen,
        title: 'Ripasso di teoria',
        detail: `${progress.theoryDue.length} ${progress.theoryDue.length === 1 ? 'esercizio sbagliato torna' : 'esercizi sbagliati tornano'} oggi`,
        done: false,
        action: { kind: 'go', tab: 'technique', intent: { review: true } },
      });
    } else if (nextLesson) {
      steps.push({
        key: 'teoria',
        icon: BookOpen,
        title: `Lezione: ${nextLesson.title}`,
        detail: `${nextLesson.minutes}′ · ${nextLesson.goal}`,
        done: theoryDone,
        action: { kind: 'go', tab: 'technique', intent: { lessonId: nextLesson.id } },
      });
    } else {
      steps.push({
        key: 'teoria',
        icon: BookOpen,
        title: 'Lettura ritmica',
        detail: `livello ${data.rhythm.level}: leggi una figura e battila a tempo`,
        done: theoryDone,
        action: { kind: 'go', tab: 'technique', intent: { rhythm: true } },
      });
    }

    const song = melodies.find(
      m => m.requiredToneNotes.every(t => learned.includes(t)) && (data.melodyBest[m.id] ?? 0) < 100,
    );
    steps.push(
      song
        ? {
            key: 'musica',
            icon: Music,
            title: `Suona: ${song.title}`,
            detail: (data.melodyBest[song.id] ?? 0) > 0
              ? `record ${data.melodyBest[song.id]}%: punta al 100%`
              : `${song.notes.length} note, tutte fra quelle che sai leggere`,
            done: (today.songs ?? 0) > 0,
            action: { kind: 'go', tab: 'melody', intent: { melodyId: song.id } },
          }
        : {
            key: 'musica',
            icon: Music,
            title: 'Un brano',
            detail: 'nel Leggio: un gruppo di battute, prima a mani separate',
            done: (today.songs ?? 0) > 0,
            action: { kind: 'go', tab: 'melody', intent: { pieces: true } },
          },
    );
    return steps;
  }, [progress, data, unlockedNotes, newestNote, sessionLength, learned]);

  const runStep = (action: PlanAction) => {
    if (action.kind === 'session') startSession();
    else if (action.kind === 'unlock') unlockAndIntroduce();
    else onNavigate(action.tab, action.intent);
  };

  if (!data.onboardingDone) {
    return (
      <PlacementTest
        onComplete={(count, answers) => {
          progress.completePlacement(count, answers);
          const label = count <= 1 ? 'dalla prima nota' : `${count} note già sbloccate`;
          notify('🎓', 'Punto di partenza fissato', `Si parte ${count <= 1 ? label : `con ${label}`}.`);
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
          warning={warnings[current.noteId]}
        />
      </Card>
    );
  }

  // ── Riepilogo ─────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const wrong = log
      .filter(l => !l.correct && l.given)
      .map(l => ({ note: noteById(l.noteId), given: l.given as string }))
      .filter((x): x is { note: NoteEntry; given: string } => !!x.note);
    return (
      <SessionSummary
        log={log}
        xpGained={xpGained}
        canUnlockNext={progress.canUnlockNext}
        nextNote={curriculum[data.unlockedCount] ?? null}
        onRetry={() => startSession()}
        onDrill={() => startSession(drillIds(wrong))}
        onUnlock={unlockAndIntroduce}
      />
    );
  }

  // ── Schermata di avvio ────────────────────────────────────────────────────
  const isFirstEver = data.answers === 0;
  const nextIdx = plan.findIndex(s => !s.done);
  const allDone = nextIdx < 0;

  const next = allDone ? null : plan[nextIdx];
  const doneCount = plan.filter(p => p.done).length;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader eyebrow={title.date} title={title.greeting} />

      {/* Il prossimo passo, in grande: si comincia con un tocco. */}
      <ImageCover
        src={IMG.hero?.src}
        position={IMG.hero?.position}
        tint="#1b1a3a"
        className="flex min-h-72 flex-col justify-end rounded-[24px] p-5 sm:min-h-80"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
          {allDone ? 'Piano completato' : `Prossimo · ${nextIdx + 1} di ${plan.length}`}
        </p>
        <p className="mt-1 text-[26px] font-bold leading-tight tracking-tight text-white">
          {allDone ? 'Fatto, per oggi.' : next?.title}
        </p>
        <p className="mt-1 max-w-md text-sm leading-snug text-white/75">
          {allDone ? 'Se hai ancora voglia: un brano nel Leggio o uno sprint.' : next?.detail}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => (next ? runStep(next.action) : onNavigate('melody', { pieces: true }))}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-black active:scale-[0.97]"
          >
            <Play className="h-4 w-4 fill-black" /> {allDone ? 'Apri i brani' : 'Continua'}
          </button>
          <div className="text-white/80">
            <span className="text-lg font-semibold tabular-nums text-white">{progress.todayMinutes}</span>
            <span className="ml-1 text-xs">min oggi</span>
          </div>
        </div>
      </ImageCover>

      <Section label="Il piano di oggi" action={<span className="text-xs font-medium tabular-nums text-ink3">{doneCount}/{plan.length}</span>}>
        <div className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
          {plan.map((step, i) => (
            <PlanRow key={step.key} step={step} n={i + 1} isNext={i === nextIdx} onRun={runStep} />
          ))}
        </div>
      </Section>

      <Section label="Lettura delle note">
      <Card className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Sessione di lettura</h2>
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
            {sessionLength} domande
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
      </Section>

      {confusions.length > 0 && (
        <Section label="Le note che confondi">
        <Card>
          <div className="space-y-1.5">
            {confusions.map(c => (
              <p key={`${c.note.id}>${c.given}`} className="text-sm text-ink2">
                <span className="font-bold text-ink">
                  {c.note.displayName}
                  {c.note.clef === 'bass' ? ' (basso)' : ''}
                </span>{' '}
                letta come <span className="font-bold text-ink">{italianOf(c.given)}</span>{' '}
                <span className="text-xs text-ink3">· {KIND_LABEL[c.mistake.kind]} · {c.count}×</span>
              </p>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink3">
            Allenarle una accanto all'altra, mescolate, è il modo più veloce per smettere di scambiarle.
          </p>
          <Btn variant="soft" full className="mt-3" onClick={() => startSession(drillIds(confusions))}>
            <Target className="h-4 w-4" />
            Allenale insieme
          </Btn>
        </Card>
        </Section>
      )}

      {isFirstEver && (
        <Section label="Come funziona">
        <Panel className="space-y-2 px-4 py-3 text-sm leading-relaxed text-ink2">
          <p>1. Una nota alla volta: si sblocca la successiva solo quando la precedente ti viene automatica.</p>
          <p>2. Le note tornano quando stai per dimenticarle — non a caso: è ripetizione spaziata.</p>
          <p>3. Se hai un piano vero, tocca 🎤 in alto e rispondi suonando: è il modo più efficace.</p>
        </Panel>
        </Section>
      )}
    </div>
  );
}
