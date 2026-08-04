// Piccoli mattoncini condivisi: superfici, anelli di progresso, pulsanti,
// festeggiamenti. Tenuti insieme perché sono tutti brevi e usati da tutte le
// schermate.

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

export function Card({
  children,
  className = '',
  pad = 'p-3 sm:p-4',
}: {
  children: ReactNode;
  className?: string;
  pad?: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-surface ${pad} ${className}`}>{children}</div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface2 ${className}`}>{children}</div>;
}

type BtnVariant = 'primary' | 'ghost' | 'soft' | 'danger' | 'success';

const BTN_STYLES: Record<BtnVariant, string> = {
  primary:
    'bg-brand text-white shadow-lg shadow-brand/25 hover:brightness-110 active:brightness-95',
  soft: 'bg-surface2 text-ink border border-line hover:border-brand/60',
  ghost: 'text-ink2 hover:text-ink hover:bg-surface2',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
};

export function Btn({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  title,
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  className?: string;
  disabled?: boolean;
  title?: string;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 ${BTN_STYLES[variant]} ${full ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'good' | 'bad' | 'warn';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-surface2 text-ink2 border-line',
    brand: 'bg-brand/15 text-brand border-brand/40',
    good: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    bad: 'bg-red-500/15 text-red-400 border-red-500/40',
    warn: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Anello di progresso: usato per obiettivo giornaliero e livello. */
export function Ring({
  pct,
  size = 40,
  stroke = 4,
  color = 'var(--c-brand)',
  track = 'var(--c-line)',
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function Bar({ pct, className = '', color = 'bg-brand' }: { pct: number; className?: string; color?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-surface2 ${className}`}>
      <div
        className={`h-full rounded-full ${color} transition-[width] duration-500`}
        style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%` }}
      />
    </div>
  );
}

/** Interruttore a due o più voci, per passare fra sezioni della stessa scheda. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-2xl border border-line bg-surface2 p-1">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${
            value === o.value ? 'bg-brand text-white shadow-sm' : 'text-ink2'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-sm font-bold tracking-wide text-ink uppercase">{children}</h2>
      {hint && <p className="mt-0.5 text-xs text-ink3">{hint}</p>}
    </div>
  );
}

const CONFETTI_COLORS = ['#6366f1', '#a855f7', '#22c55e', '#f59e0b', '#ec4899', '#38bdf8'];

export function Confetti({ pieces = 26 }: { pieces?: number }) {
  const [items] = useState(() =>
    Array.from({ length: pieces }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 7,
    })),
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {items.map((it, i) => (
        <span
          key={i}
          className="anim-confetti absolute top-0 block rounded-sm"
          style={{
            left: `${it.left}%`,
            width: it.size,
            height: it.size * 0.6,
            background: it.color,
            animationDelay: `${it.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Segnalazione breve all'utente (obiettivi, livelli, sbloccati). */
export type Notify = (emoji: string, title: string, desc?: string) => void;

export interface ToastData {
  id: number;
  emoji: string;
  title: string;
  desc?: string;
}

/** Notifiche brevi in alto: obiettivi conquistati, livello, nota sbloccata. */
export function Toasts({ items, onDone }: { items: ToastData[]; onDone: (id: number) => void }) {
  useEffect(() => {
    if (items.length === 0) return;
    const timers = items.map(it => setTimeout(() => onDone(it.id), 3400));
    return () => timers.forEach(clearTimeout);
  }, [items, onDone]);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex flex-col items-center gap-2 px-3 safe-top">
      {items.map(it => (
        <div
          key={it.id}
          className="anim-up flex w-full max-w-sm items-center gap-3 rounded-2xl border border-brand/50 bg-surface/95 px-4 py-3 shadow-xl backdrop-blur"
        >
          <span className="text-2xl">{it.emoji}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{it.title}</p>
            {it.desc && <p className="truncate text-xs text-ink2">{it.desc}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
