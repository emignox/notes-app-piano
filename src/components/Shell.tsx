// Cornice dell'app: barra in alto con lo stato (livello, serie, obiettivo,
// microfono) e navigazione in basso — a portata di pollice, che su telefono è
// l'unica posizione che conta.

import { BarChart3, BookOpen, ListMusic, Mic, MicOff, Music4, Settings, Volume2, VolumeX, Zap } from 'lucide-react';
import type { LevelInfo } from '../lib/xp';
import { Ring } from './ui';

export type Tab = 'practice' | 'melody' | 'technique' | 'sprint' | 'stats' | 'settings';

/**
 * Dove portare l'utente dentro una scheda: il piano di oggi non dice "vai allo
 * Studio", apre la lezione giusta (o il ripasso, o la canzone).
 */
export interface Intent {
  lessonId?: string;
  review?: boolean;
  rhythm?: boolean;
  melodyId?: string;
  pieces?: boolean;
  /** Un pezzo a due mani da aprire subito (dalle lezioni "Verso Chopin"). */
  pieceId?: string;
  /** Una sezione dello Studio (Orecchio). */
  ear?: boolean;
}

export type Navigate = (tab: Tab, intent?: Intent) => void;

interface TopBarProps {
  level: LevelInfo;
  dayStreak: number;
  goalPct: number;
  todayAnswers: number;
  dailyGoal: number;
  micOn: boolean;
  onToggleMic: () => void;
  audioOn: boolean;
  onTestAudio: () => void;
}

export function TopBar({
  level,
  dayStreak,
  goalPct,
  todayAnswers,
  dailyGoal,
  micOn,
  onToggleMic,
  audioOn,
  onTestAudio,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/82 shadow-sm backdrop-blur-xl safe-top">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-3 py-2">
        <div className="flex items-center gap-2">
          <Ring pct={level.pct} size={36} stroke={3.5}>
            <span className="text-[11px] font-black text-ink">{level.level}</span>
          </Ring>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-black tracking-tight text-ink">Piano Trainer</p>
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

        {/* Stato dell'audio + prova: se il telefono resta muto è qui che si guarda */}
        <button
          type="button"
          onClick={onTestAudio}
          className={`rounded-xl border p-2 transition-all active:scale-95 ${
            audioOn
              ? 'border-line bg-surface2 text-ink2'
              : 'border-amber-500/50 bg-amber-500/15 text-amber-400'
          }`}
          title={audioOn ? 'Prova il suono' : 'Audio spento — tocca per attivarlo'}
          aria-label={audioOn ? 'Prova il suono' : 'Attiva l’audio'}
        >
          {audioOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

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
  { id: 'practice', label: 'Oggi', icon: Music4 },
  { id: 'melody', label: 'Canzoni', icon: ListMusic },
  { id: 'technique', label: 'Studio', icon: BookOpen },
  { id: 'sprint', label: 'Sprint', icon: Zap },
  { id: 'stats', label: 'Progressi', icon: BarChart3 },
  { id: 'settings', label: 'Opzioni', icon: Settings },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-2 pb-2 safe-bottom">
      <div className="mx-auto flex max-w-2xl rounded-2xl border border-line/80 bg-surface/92 p-1 shadow-[0_-8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex min-h-13 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 transition-all ${
                active ? 'bg-brand/15 text-brand' : 'text-ink3 hover:bg-surface2 hover:text-ink2'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[9px] font-semibold leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
