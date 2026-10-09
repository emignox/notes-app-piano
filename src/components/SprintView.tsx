// ─────────────────────────────────────────────────────────────────────────────
// Sprint: quante note riesci a leggere in un minuto.
//
// Serve a una cosa precisa: trasformare il riconoscimento da "ragionato" ad
// automatico. Sotto pressione non c'è tempo di contare le linee, e questo
// costringe a usare le note di riferimento. È l'allenamento alla fluidità.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Timer, Trophy } from 'lucide-react';
import { pickOne } from '../lib/session';
import { samePitchClass } from '../lib/notes';
import { haptics } from '../lib/haptics';
import type { NoteEntry } from '../types';
import type { ProgressApi } from '../hooks/useProgress';
import type { AudioApi } from '../hooks/useAudio';
import type { LiveNote } from '../hooks/usePitchDetection';
import { Bar, Btn, Card, Confetti, Panel, Pill } from './ui';
import type { Notify } from './ui';
import { Staff } from './Staff';
import { NoteNameButtons } from './NoteNameButtons';

interface SprintViewProps {
  progress: ProgressApi;
  audio: AudioApi;
  mic: {
    isListening: boolean;
    confirmedNote: { note: LiveNote; id: number } | null;
    suppress: (ms?: number) => void;
  };
  notify: Notify;
}

const DURATIONS = [30, 60, 120];

export function SprintView({ progress, audio, mic, notify }: SprintViewProps) {
  const { data, settings, unlockedNotes } = progress;
  const [duration, setDuration] = useState(60);
  const [phase, setPhase] = useState<'setup' | 'running' | 'result'>('setup');
  const [left, setLeft] = useState(duration);
  const [note, setNote] = useState<NoteEntry | null>(null);
  const [flash, setFlash] = useState<'none' | 'good' | 'bad'>('none');
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [isRecord, setIsRecord] = useState(false);
  // Contatore delle carte: serve come `key` per rimontare il pentagramma.
  const [cardSeq, setCardSeq] = useState(0);

  const deadlineRef = useRef(0);
  const askedAtRef = useRef(0);
  const lockRef = useRef(false);
  const lastIdRef = useRef<string | null>(null);
  const micBaseRef = useRef(0);

  const showAccidentals = useMemo(
    () => unlockedNotes.some(n => n.accidental === 'sharp' || n.accidental === 'flat'),
    [unlockedNotes],
  );

  const best = data.sprintBest[String(duration)] ?? 0;

  const nextNote = useCallback(() => {
    const picked = pickOne(unlockedNotes, data.cards, lastIdRef.current);
    lastIdRef.current = picked.id;
    setCardSeq(s => s + 1);
    setNote(picked);
    setFlash('none');
    askedAtRef.current = performance.now();
    lockRef.current = false;
  }, [unlockedNotes, data.cards]);

  const stop = useCallback(
    (finalScore: number) => {
      const { best: newBest, achievements } = progress.recordSprint(duration, finalScore);
      achievements.forEach(a => notify(a.emoji, a.title, a.desc));
      setIsRecord(newBest && finalScore > 0);
      if (newBest && finalScore > 0) {
        audio.playSuccess();
        haptics.levelUp();
      }
      setPhase('result');
    },
    [progress, duration, notify, audio],
  );

  const start = useCallback(() => {
    setScore(0);
    setMisses(0);
    setIsRecord(false);
    setLeft(duration);
    deadlineRef.current = performance.now() + duration * 1000;
    micBaseRef.current = mic.confirmedNote?.id ?? 0;
    lastIdRef.current = null;
    setPhase('running');
    nextNote();
  }, [duration, nextNote, mic.confirmedNote]);

  // Cronometro
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    if (phase !== 'running') return;
    const tick = setInterval(() => {
      const remaining = Math.max(0, (deadlineRef.current - performance.now()) / 1000);
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(tick);
        stop(scoreRef.current);
      }
    }, 100);
    return () => clearInterval(tick);
  }, [phase, stop]);

  const answer = useCallback(
    (given: string) => {
      if (phase !== 'running' || !note || lockRef.current) return;
      lockRef.current = true;
      const ms = performance.now() - askedAtRef.current;
      const correct = samePitchClass(given, note.englishName);

      progress.answer(note.id, 'read', correct, ms, false, given);

      if (correct) {
        setScore(s => s + 1);
        setFlash('good');
        haptics.tap();
        setTimeout(nextNote, 90);
      } else {
        setMisses(m => m + 1);
        setFlash('bad');
        haptics.wrong();
        audio.playError();
        mic.suppress(700);
        setTimeout(nextNote, 850);
      }
    },
    [phase, note, progress, nextNote, audio, mic],
  );

  // Microfono: si può sprintare suonando sul piano vero.
  useEffect(() => {
    if (phase !== 'running' || !mic.isListening || !mic.confirmedNote) return;
    if (mic.confirmedNote.id <= micBaseRef.current) return;
    micBaseRef.current = mic.confirmedNote.id;
    answer(mic.confirmedNote.note.name);
  }, [mic.confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'setup') {
    return (
      <div className="flex flex-col gap-3">
        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-black text-ink">Sprint</h2>
            <p className="mt-0.5 text-sm text-ink2">
              Quante note leggi prima che scada il tempo? Non contare le linee: guarda e rispondi.
            </p>
          </div>

          <div className="flex gap-2">
            {DURATIONS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`flex-1 rounded-xl border py-3 text-sm font-bold transition-all ${
                  duration === d
                    ? 'border-brand bg-brand/15 text-brand'
                    : 'border-line bg-surface2 text-ink2'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Pill tone="warn">
              <Trophy className="h-3 w-3" />
              record {best}
            </Pill>
            <span className="text-xs text-ink3">{unlockedNotes.length} note in gioco</span>
          </div>

          <Btn full onClick={start} disabled={unlockedNotes.length === 0}>
            <Play className="h-4 w-4" />
            Via!
          </Btn>
        </Card>

        <Panel className="px-4 py-3 text-xs leading-relaxed text-ink2">
          Suggerimento: prima dello sprint fai una sessione normale. Lo sprint consolida ciò che sai
          già, non serve a imparare note nuove.
        </Panel>
      </div>
    );
  }

  if (phase === 'result') {
    const pct = score + misses === 0 ? 0 : Math.round((score / (score + misses)) * 100);
    return (
      <>
        {isRecord && <Confetti />}
        <Card className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">{isRecord ? '🏆' : score >= best * 0.8 ? '🔥' : '💪'}</div>
          <h2 className="text-2xl font-black text-ink">{isRecord ? 'Nuovo record!' : 'Tempo scaduto'}</h2>
          <p className="text-5xl font-black text-brand tabular-nums">{score}</p>
          <p className="text-sm text-ink2">
            note in {duration}s · {pct}% di precisione · record {Math.max(best, score)}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Btn variant="soft" onClick={() => setPhase('setup')}>Cambia durata</Btn>
            <Btn onClick={start}>Ancora</Btn>
          </div>
        </Card>
      </>
    );
  }

  // In corso
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <Timer className="h-4 w-4 text-brand" />
          <span className="tabular-nums">{left.toFixed(1)}s</span>
        </span>
        <span className="text-sm font-black tabular-nums text-brand">{score}</span>
      </div>
      <Bar pct={left / duration} color={left / duration < 0.25 ? 'bg-red-500' : 'bg-brand'} />

      <div
        className={`rounded-2xl transition-colors ${
          flash === 'good' ? 'ring-2 ring-emerald-500' : flash === 'bad' ? 'ring-2 ring-red-500' : ''
        }`}
      >
        {note && (
          <Staff
            key={cardSeq}
            entries={[note]}
            activeIndex={0}
            answerState={flash === 'good' ? 'correct' : flash === 'bad' ? 'wrong' : 'idle'}
            variant="focus"
          />
        )}
      </div>

      {flash === 'bad' && note && (
        <p className="text-center text-sm font-bold text-red-400">
          Era {note.displayName} ({note.englishName})
        </p>
      )}

      <Panel className="p-2.5">
        <NoteNameButtons
          onSelect={answer}
          disabled={flash === 'bad'}
          style={settings.noteNames}
          showAccidentals={showAccidentals}
        />
      </Panel>
    </Card>
  );
}
