// ─────────────────────────────────────────────────────────────────────────────
// Progressi. La parte importante è la MAPPA DI PADRONANZA: un colore per nota,
// così si vede a occhio dove si è solidi e dove no — e la si può toccare per
// sapere quando tornerà al ripasso.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { Flame, Target, Trophy, Zap } from 'lucide-react';
import { curriculum, stages, TOTAL_LEVELS } from '../data/curriculum';
import { achievements as allAchievements } from '../lib/achievements';
import { cardKey, mastery, tierOf, TIER_COLORS, TIER_LABELS } from '../lib/srs';
import { describePosition } from '../lib/notes';
import { levelTitle } from '../lib/xp';
import { shiftDay, todayKey } from '../lib/storage';
import type { ProgressApi } from '../hooks/useProgress';
import { Bar, Card, Panel, Pill, Ring, SectionTitle } from './ui';

interface StatsViewProps {
  progress: ProgressApi;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface2 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-ink3">{label}</p>
      <p className="mt-0.5 text-lg font-black leading-none text-ink">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-ink3">{hint}</p>}
    </div>
  );
}

const DAYS_SHOWN = 28;

export function StatsView({ progress }: StatsViewProps) {
  const { data, level, todayStat, goalPct } = progress;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const accuracy = data.answers === 0 ? 0 : Math.round((data.correct / data.answers) * 100);

  const activity = useMemo(() => {
    const today = todayKey();
    return Array.from({ length: DAYS_SHOWN }, (_, i) => {
      const key = shiftDay(today, -(DAYS_SHOWN - 1 - i));
      return { key, stat: data.days[key] };
    });
  }, [data.days]);

  const selected = selectedId ? curriculum.find(n => n.id === selectedId) : null;
  const selectedCard = selected ? data.cards[cardKey(selected.id, 'read')] : undefined;

  const bestSprint = Math.max(0, ...Object.values(data.sprintBest));
  const perfectMelodies = Object.values(data.melodyBest).filter(v => v >= 100).length;
  const unlockedAch = allAchievements.filter(a => data.achievements.includes(a.id));

  return (
    <div className="flex flex-col gap-3">
      {/* Livello e obiettivo del giorno */}
      <Card className="flex items-center gap-4">
        <Ring pct={level.pct} size={64} stroke={6}>
          <div className="text-center leading-none">
            <p className="text-lg font-black text-ink">{level.level}</p>
            <p className="text-[9px] uppercase text-ink3">liv.</p>
          </div>
        </Ring>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{levelTitle(level.level)}</p>
          <p className="text-xs text-ink3">
            {level.intoLevel}/{level.needed} XP al livello {level.level + 1}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill tone="warn">
              <Flame className="h-3 w-3" />
              {data.dayStreak} giorni
            </Pill>
            <Pill tone={goalPct >= 1 ? 'good' : 'neutral'}>
              <Target className="h-3 w-3" />
              {todayStat.answers}/{data.settings.dailyGoal} oggi
            </Pill>
          </div>
        </div>
      </Card>

      {/* Mappa di padronanza */}
      <Card>
        <SectionTitle hint="tocca una nota per i dettagli">Mappa delle note</SectionTitle>
        <div className="space-y-3">
          {stages.map(stage => {
            const notes = curriculum.slice(stage.from, stage.to + 1);
            return (
              <div key={stage.id}>
                <p className="mb-1.5 text-[11px] font-semibold text-ink3">
                  {stage.emoji} {stage.title}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {notes.map((note, i) => {
                    const index = stage.from + i;
                    const locked = index >= data.unlockedCount;
                    const card = data.cards[cardKey(note.id, 'read')];
                    const tier = tierOf(card);
                    return (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => setSelectedId(selectedId === note.id ? null : note.id)}
                        className={`flex h-11 w-11 flex-col items-center justify-center rounded-lg border text-[10px] font-bold transition-all ${
                          selectedId === note.id ? 'ring-2 ring-brand' : ''
                        } ${locked ? 'border-line bg-surface2 text-ink3 opacity-50' : 'border-transparent text-white'}`}
                        style={locked ? undefined : { backgroundColor: TIER_COLORS[tier] }}
                      >
                        <span className="text-[11px] leading-none">{locked ? '🔒' : note.displayName}</span>
                        {!locked && <span className="mt-0.5 text-[8px] opacity-80">{note.englishName}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {TIER_LABELS.map((lbl, i) => (
            <span key={lbl} className="flex items-center gap-1 text-[10px] text-ink3">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TIER_COLORS[i] }} />
              {lbl}
            </span>
          ))}
        </div>

        {selected && (
          <Panel className="anim-up mt-3 px-3 py-2.5">
            <p className="font-bold text-ink">
              {selected.displayName} ({selected.englishName})
            </p>
            <p className="mt-0.5 text-xs text-ink3">
              {describePosition(selected.englishName, selected.clef)} ·{' '}
              {selected.clef === 'treble' ? 'violino' : 'basso'}
            </p>
            {selectedCard && selectedCard.reps > 0 ? (
              <div className="mt-2 space-y-1.5 text-xs text-ink2">
                <Bar pct={mastery(selectedCard)} />
                <p>
                  Padronanza {Math.round(mastery(selectedCard) * 100)}% ·{' '}
                  {selectedCard.correct}/{selectedCard.correct + selectedCard.wrong} giuste ·{' '}
                  {(selectedCard.avgMs / 1000).toFixed(1)}s di media
                </p>
                <p className="text-ink3">
                  {selectedCard.interval >= 1
                    ? `Prossimo ripasso fra ${selectedCard.interval} ${selectedCard.interval === 1 ? 'giorno' : 'giorni'}`
                    : 'Da rivedere in questa sessione'}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-ink3">Ancora da esercitare.</p>
            )}
          </Panel>
        )}
      </Card>

      {/* Numeri */}
      <Card>
        <SectionTitle>Numeri</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Risposte" value={String(data.answers)} />
          <Stat label="Precisione" value={`${accuracy}%`} />
          <Stat label="Serie record" value={String(data.bestStreak)} />
          <Stat label="Note sbloccate" value={`${data.unlockedCount}/${TOTAL_LEVELS}`} />
          <Stat label="Sessioni" value={String(data.sessions)} hint={`${data.perfectSessions} perfette`} />
          <Stat label="Sprint" value={String(bestSprint)} hint="record note/tempo" />
        </div>
      </Card>

      {/* Attività */}
      <Card>
        <SectionTitle hint="ultime 4 settimane">Costanza</SectionTitle>
        <div className="flex flex-wrap gap-1">
          {activity.map(({ key, stat }) => {
            const n = stat?.answers ?? 0;
            const bg =
              n === 0 ? 'var(--c-surface2)' : n < 10 ? '#312e81' : n < 30 ? '#4f46e5' : '#818cf8';
            return (
              <span
                key={key}
                title={`${key}: ${n} risposte`}
                className="h-5 w-5 rounded-sm"
                style={{ backgroundColor: bg }}
              />
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink3">
          {perfectMelodies > 0 && `${perfectMelodies} canzoni suonate senza errori · `}
          record di costanza: {data.bestDayStreak} giorni
        </p>
      </Card>

      {/* Obiettivi */}
      <Card>
        <SectionTitle hint={`${unlockedAch.length}/${allAchievements.length} conquistati`}>
          Obiettivi
        </SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {allAchievements.map(a => {
            const got = data.achievements.includes(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-start gap-2 rounded-xl border px-2.5 py-2 ${
                  got ? 'border-brand/40 bg-brand/10' : 'border-line bg-surface2 opacity-55'
                }`}
              >
                <span className="text-xl leading-none">{got ? a.emoji : '🔒'}</span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-ink">{a.title}</p>
                  <p className="text-[10px] leading-tight text-ink3">{a.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="flex items-center justify-center gap-1.5 pb-1 text-center text-[11px] text-ink3">
        <Zap className="h-3 w-3" />
        {data.xp} XP totali
        {bestSprint > 0 && (
          <>
            {' · '}
            <Trophy className="h-3 w-3" />
            {bestSprint} nello sprint
          </>
        )}
      </p>
    </div>
  );
}
