import { ChevronRight, RotateCcw, Target, Unlock } from 'lucide-react';
import type { NoteEntry } from '../types';
import { Bar, Btn, Card, Confetti, Panel, Pill } from './ui';
import { noteById } from '../data/curriculum';

export interface SessionLogEntry {
  noteId: string;
  correct: boolean;
  ms: number;
}

interface SessionSummaryProps {
  log: SessionLogEntry[];
  xpGained: number;
  canUnlockNext: boolean;
  nextNote: NoteEntry | null;
  weakIds: string[];
  onRetry: () => void;
  onUnlock: () => void;
  onDrill: () => void;
}

export function SessionSummary({
  log,
  xpGained,
  canUnlockNext,
  nextNote,
  weakIds,
  onRetry,
  onUnlock,
  onDrill,
}: SessionSummaryProps) {
  const total = log.length;
  const correct = log.filter(l => l.correct).length;
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  const avgMs = total === 0 ? 0 : log.reduce((s, l) => s + l.ms, 0) / total;
  const perfect = total > 0 && correct === total;

  const emoji = perfect ? '🏆' : pct >= 80 ? '🎹' : pct >= 55 ? '👍' : '💪';
  const title = perfect ? 'Perfetta!' : pct >= 80 ? 'Ottimo lavoro' : pct >= 55 ? 'Ci siamo' : 'Continua così';

  return (
    <>
      {perfect && <Confetti />}
      <Card className="anim-up flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">{emoji}</div>
        <div>
          <h2 className="text-2xl font-black text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink2">
            {correct}/{total} · {pct}% · {(avgMs / 1000).toFixed(1)}s di media
          </p>
        </div>

        <div className="w-full">
          <Bar pct={pct / 100} color={perfect ? 'bg-emerald-500' : 'bg-brand'} />
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          {log.map((l, i) => (
            <span
              key={i}
              title={noteById(l.noteId)?.displayName}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                l.correct ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            >
              {l.correct ? '✓' : '✗'}
            </span>
          ))}
        </div>

        <Pill tone="brand">+{xpGained} XP</Pill>

        {canUnlockNext && nextNote && (
          <Panel className="w-full border-brand/50 bg-brand/10 px-4 py-3">
            <p className="text-sm font-bold text-ink">Sei pronto per una nota nuova 🎉</p>
            <p className="mt-0.5 text-xs text-ink2">
              La prossima è {nextNote.displayName} ({nextNote.englishName})
            </p>
            <Btn full className="mt-2.5" onClick={onUnlock}>
              <Unlock className="h-4 w-4" />
              Sblocca {nextNote.displayName}
              <ChevronRight className="h-4 w-4" />
            </Btn>
          </Panel>
        )}

        <div className="flex w-full flex-wrap justify-center gap-2.5">
          <Btn variant={canUnlockNext ? 'soft' : 'primary'} onClick={onRetry}>
            <RotateCcw className="h-4 w-4" />
            Altra sessione
          </Btn>
          {weakIds.length > 0 && (
            <Btn variant="soft" onClick={onDrill}>
              <Target className="h-4 w-4" />
              Note difficili ({weakIds.length})
            </Btn>
          )}
        </div>

        {!canUnlockNext && (
          <p className="text-xs text-ink3">
            La prossima nota si sblocca quando questa ti viene naturale: 3 risposte giuste, senza esitare.
          </p>
        )}
      </Card>
    </>
  );
}
