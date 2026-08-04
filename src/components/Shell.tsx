// Cornice dell'app: barra in alto con lo stato (livello, serie, obiettivo,
// microfono) e navigazione in basso — a portata di pollice, che su telefono è
// l'unica posizione che conta.

import { BarChart3, ListMusic, Mic, MicOff, Music4, Settings, Zap } from 'lucide-react';
import type { LevelInfo } from '../lib/xp';
import { Ring } from './ui';

export type Tab = 'practice' | 'melody' | 'sprint' | 'stats' | 'settings';

interface TopBarProps {
  level: LevelInfo;
  dayStreak: number;
  goalPct: number;
  todayAnswers: number;
  dailyGoal: number;
  micOn: boolean;
  onToggleMic: () => void;
}

export function TopBar({
  level,
  dayStreak,
  goalPct,
  todayAnswers,
  dailyGoal,
  micOn,
  onToggleMic,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-md safe-top">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-3 py-2">
        <div className="flex items-center gap-2">
          <Ring pct={level.pct} size={36} stroke={3.5}>
            <span className="text-[11px] font-black text-ink">{level.level}</span>
          </Ring>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-bold text-ink">Piano Trainer</p>
            <p className="text-[10px] text-ink3">{level.intoLevel}/{level.needed} XP</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center gap-3">
          <span
            className={`flex items-center gap-1 text-sm font-bold ${dayStreak > 0 ? 'text-orange-400' : 'text-ink3'}`}
            title="Giorni di fila"
          >
            🔥 {dayStreak}
          </span>
          <span className="flex items-center gap-1.5" title="Obiettivo di oggi">
            <Ring pct={goalPct} size={26} stroke={3} color={goalPct >= 1 ? '#10b981' : 'var(--c-brand)'}>
              {goalPct >= 1 ? <span className="text-[9px]">✓</span> : null}
            </Ring>
            <span className="text-xs font-semibold tabular-nums text-ink2">
              {todayAnswers}/{dailyGoal}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleMic}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
            micOn
              ? 'border-brand bg-brand text-white shadow-md shadow-brand/30'
              : 'border-line bg-surface2 text-ink2'
          }`}
          title={micOn ? 'Spegni il microfono' : 'Rispondi suonando sul piano'}
        >
          {micOn ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {micOn ? 'ON' : ''}
        </button>
      </div>
    </header>
  );
}

const TABS: { id: Tab; label: string; icon: typeof Music4 }[] = [
  { id: 'practice', label: 'Pratica', icon: Music4 },
  { id: 'melody', label: 'Canzoni', icon: ListMusic },
  { id: 'sprint', label: 'Sprint', icon: Zap },
  { id: 'stats', label: 'Progressi', icon: BarChart3 },
  { id: 'settings', label: 'Opzioni', icon: Settings },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-2xl">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
                active ? 'text-brand' : 'text-ink3'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
