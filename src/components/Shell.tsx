// Cornice dell'app: barra in alto con lo stato (livello, serie, obiettivo,
// microfono) e navigazione in basso — a portata di pollice, che su telefono è
// l'unica posizione che conta.

import { BarChart3, BookOpen, Flame, ListMusic, Mic, MicOff, Music4, Settings, Volume2, VolumeX, Zap } from 'lucide-react';
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
  settingsOpen: boolean;
  onOpenSettings: () => void;
}

const ICON_BTN = 'flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95';

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
  settingsOpen,
  onOpenSettings,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-canvas/75 backdrop-blur-xl backdrop-saturate-150 safe-top">
      <div className="mx-auto flex h-13 max-w-2xl items-center gap-2 px-4">
        {/* Il livello come marchio: l'anello si riempie con l'esperienza. */}
        <div className="flex min-w-0 items-center gap-2.5" title={`Livello ${level.level} · ${level.intoLevel}/${level.needed} XP`}>
          <Ring pct={level.pct} size={30} stroke={2.5}>
            <span className="text-[11px] font-bold tabular-nums text-ink">{level.level}</span>
          </Ring>
          <span className="truncate text-[15px] font-semibold tracking-tight text-ink">Piano Trainer</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <span
            className={`mr-1 flex items-center gap-1 text-[13px] font-semibold tabular-nums ${dayStreak > 0 ? 'text-orange-400' : 'text-ink3'}`}
            title="Giorni di fila"
          >
            <Flame className="h-4 w-4" /> {dayStreak}
          </span>
          <span className="mr-1 flex items-center" title={`Obiettivo di oggi: ${todayAnswers}/${dailyGoal}`}>
            <Ring pct={goalPct} size={22} stroke={2.5} color={goalPct >= 1 ? '#10b981' : 'var(--c-brand)'}>
              {goalPct >= 1 ? <span className="text-[9px] text-emerald-400">✓</span> : null}
            </Ring>
          </span>

          {/* Stato dell'audio + prova: se il telefono resta muto è qui che si guarda */}
          <button
            type="button"
            onClick={onTestAudio}
            className={`${ICON_BTN} ${audioOn ? 'text-ink2 hover:bg-surface2' : 'bg-amber-500/15 text-amber-400'}`}
            title={audioOn ? 'Prova il suono' : 'Audio spento — tocca per attivarlo'}
            aria-label={audioOn ? 'Prova il suono' : 'Attiva l’audio'}
          >
            {audioOn ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
          </button>

          <button
            type="button"
            onClick={onToggleMic}
            className={`${ICON_BTN} ${micOn ? 'bg-brand text-white' : 'text-ink2 hover:bg-surface2'}`}
            title={micOn ? 'Spegni il microfono' : 'Rispondi suonando sul piano'}
            aria-label={micOn ? 'Spegni il microfono' : 'Accendi il microfono'}
            aria-pressed={micOn}
          >
            {micOn ? <Mic className="h-[18px] w-[18px]" /> : <MicOff className="h-[18px] w-[18px]" />}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className={`${ICON_BTN} ${settingsOpen ? 'bg-surface2 text-ink' : 'text-ink2 hover:bg-surface2'}`}
            title="Opzioni"
            aria-label="Opzioni"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}

// Le Opzioni stanno nell'ingranaggio in alto: in basso solo ciò che si usa
// ogni giorno.
const TABS: { id: Tab; label: string; icon: typeof Music4 }[] = [
  { id: 'practice', label: 'Oggi', icon: Music4 },
  { id: 'melody', label: 'Canzoni', icon: ListMusic },
  { id: 'technique', label: 'Studio', icon: BookOpen },
  { id: 'sprint', label: 'Sprint', icon: Zap },
  { id: 'stats', label: 'Progressi', icon: BarChart3 },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line/60 bg-canvas/80 backdrop-blur-xl backdrop-saturate-150 safe-bottom">
      <div className="mx-auto flex max-w-2xl px-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-1.5 pt-2 transition-colors ${
                active ? 'text-ink' : 'text-ink3 hover:text-ink2'
              }`}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {active && <span className="absolute top-0 h-0.5 w-6 rounded-full bg-brand" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
