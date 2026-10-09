// Riepilogo di una sessione. Non solo "quante giuste": QUALI note e PERCHÉ
// sono andate storte, con il consiglio per il tipo di errore che hai fatto di
// più — e il pulsante per allenare proprio quelle note, subito.

import { ChevronRight, RotateCcw, Target, Unlock } from 'lucide-react';
import type { Direction, NoteEntry } from '../types';
import type { Mistake, MistakeKind } from '../lib/diagnosis';
import { KIND_ADVICE, KIND_LABEL } from '../lib/diagnosis';
import { italianOf } from '../lib/notes';
import { Bar, Btn, Card, Confetti, Panel, Pill } from './ui';
import { noteById } from '../data/curriculum';

export interface SessionLogEntry {
  noteId: string;
  dir: Direction;
  correct: boolean;
  ms: number;
  /** Cosa è stato risposto (solo se sbagliato) e perché era sbagliato. */
  given?: string;
  mistake?: Mistake | null;
}

interface SessionSummaryProps {
  log: SessionLogEntry[];
  xpGained: number;
  canUnlockNext: boolean;
  nextNote: NoteEntry | null;
  onRetry: () => void;
  onUnlock: () => void;
  /** Allena le note sbagliate in questa sessione (con quelle con cui le confondi). */
  onDrill: () => void;
}

export function SessionSummary({
  log,
  xpGained,
  canUnlockNext,
  nextNote,
  onRetry,
  onUnlock,
  onDrill,
}: SessionSummaryProps) {
  const total = log.length;
  const correct = log.filter(l => l.correct).length;
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  const okTimes = log.filter(l => l.correct).map(l => l.ms);
  const avgMs = okTimes.length === 0 ? 0 : okTimes.reduce((s, x) => s + x, 0) / okTimes.length;
  const perfect = total > 0 && correct === total;

  // Un errore per nota e per risposta: se torna due volte uguale conta una.
  const mistakes = log
    .filter(l => !l.correct && l.mistake)
    .filter((l, i, all) => all.findIndex(x => x.noteId === l.noteId && x.given === l.given) === i);
  const kindCount = new Map<MistakeKind, number>();
  for (const l of log) if (!l.correct && l.mistake) kindCount.set(l.mistake.kind, (kindCount.get(l.mistake.kind) ?? 0) + 1);
  const mainKind = [...kindCount.entries()].sort((a, b) => b[1] - a[1])[0];

  // La nota più lenta fra quelle giuste: veloce = automatica, lenta = ragionata.
  const slowest = log
    .filter(l => l.correct && l.dir === 'read')
    .sort((a, b) => b.ms - a.ms)[0];

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
            {correct}/{total} · {pct}% · {(avgMs / 1000).toFixed(1)}s per nota
          </p>
        </div>

        <div className="w-full">
          <Bar pct={pct / 100} color={perfect ? 'bg-emerald-500' : 'bg-brand'} />
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          {log.map((l, i) => {
            const note = noteById(l.noteId);
            return (
              <span
                key={i}
                title={note?.englishName}
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${l.correct ? 'bg-emerald-600' : 'bg-red-600'}`}
              >
                {note?.displayName ?? '?'}
              </span>
            );
          })}
        </div>

        <Pill tone="brand">+{xpGained} XP</Pill>

        {mistakes.length > 0 && (
          <Panel className="w-full space-y-2 px-4 py-3 text-left">
            <p className="text-xs font-black uppercase tracking-wide text-ink3">Cosa è andato storto</p>
            {mistakes.slice(0, 4).map((l, i) => {
              const note = noteById(l.noteId);
              return (
                <div key={i} className="text-xs leading-relaxed text-ink2">
                  <span className="font-bold text-ink">
                    {note?.displayName} {note?.clef === 'bass' ? '(basso)' : ''}
                  </span>{' '}
                  → hai risposto <span className="font-bold text-red-400">{italianOf(l.given ?? '')}</span>.{' '}
                  {l.mistake?.text}
                </div>
              );
            })}
            {mainKind && mainKind[1] >= 2 && (
              <p className="border-t border-line/60 pt-2 text-xs font-semibold leading-relaxed text-ink">
                Errore ricorrente — {KIND_LABEL[mainKind[0]]} ({mainKind[1]}×): {KIND_ADVICE[mainKind[0]]}
              </p>
            )}
          </Panel>
        )}

        {perfect && slowest && slowest.ms > 2500 && (
          <p className="text-xs text-ink3">
            Tutto giusto. La più lenta è stata {noteById(slowest.noteId)?.displayName} ({(slowest.ms / 1000).toFixed(1)}s): tornerà
            presto finché non diventa automatica.
          </p>
        )}

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
          {mistakes.length > 0 && (
            <Btn variant={canUnlockNext ? 'soft' : 'primary'} onClick={onDrill}>
              <Target className="h-4 w-4" />
              Allena gli errori
            </Btn>
          )}
          <Btn variant={canUnlockNext || mistakes.length > 0 ? 'soft' : 'primary'} onClick={onRetry}>
            <RotateCcw className="h-4 w-4" />
            Altra sessione
          </Btn>
        </div>

        {!canUnlockNext && (
          <p className="text-xs text-ink3">
            La prossima nota si sblocca quando questa ti viene naturale: 3 risposte giuste, due di fila, senza esitare.
          </p>
        )}
      </Card>
    </>
  );
}
