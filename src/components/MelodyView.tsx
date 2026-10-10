// ─────────────────────────────────────────────────────────────────────────────
// Canzoncine: leggere note vere, in fila, con un senso musicale.
//
// Ogni melodia si apre nel Leggio, come i brani: pentagramma grande, la
// tastiera sotto che si accende, la cascata delle note, Ascolta ed Esercita
// (il Leggio aspetta le tue note, anche dal piano vero col microfono).
// L'elenco dice quali puoi già leggere con le note che hai imparato.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import type { Melody } from '../types';
import { melodies } from '../data/melodies';
import { melodyEntry } from '../data/library';
import { italianOf, parseNote } from '../lib/notes';
import type { ProgressApi } from '../hooks/useProgress';
import type { AudioApi } from '../hooks/useAudio';
import type { ChordMatch, ConfirmedNote, LiveNote } from '../hooks/usePitchDetection';
import { PageHeader, Section, Segmented } from './ui';
import { Leggio } from './leggio/Leggio';

export type SongSection = 'melodie' | 'pezzi';

interface MelodyViewProps {
  progress: ProgressApi;
  audio: AudioApi;
  mic: {
    isListening: boolean;
    liveNote: LiveNote | null;
    level: number;
    confirmedNote: ConfirmedNote | null;
    suppress: (ms?: number) => void;
    expect: (notes: number[] | null, token?: string) => void;
    chordMatch: ChordMatch | null;
  };
  section: SongSection;
  onSection: (s: SongSection) => void;
  /** Dal piano di oggi: la canzone da aprire subito. */
  initialMelodyId?: string;
  onToggleMic?: () => void;
}

function stars(pct: number): string {
  if (pct >= 100) return '★★★';
  if (pct >= 80) return '★★☆';
  if (pct >= 55) return '★☆☆';
  return '';
}

// ── Elenco ──────────────────────────────────────────────────────────────────

function MelodyCard({
  melody,
  learned,
  best,
  onSelect,
}: {
  melody: Melody;
  learned: string[];
  best: number;
  onSelect: (m: Melody, force: boolean) => void;
}) {
  const missing = melody.requiredToneNotes.filter(t => !learned.includes(t));
  const open = missing.length === 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(melody, !open)}
      className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors active:bg-surface2"
    >
      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-surface2 text-2xl ${open ? '' : 'opacity-60 grayscale'}`}>
        {melody.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] font-semibold tracking-tight ${open ? 'text-ink' : 'text-ink2'}`}>{melody.title}</span>
        <span className="mt-0.5 block truncate text-[13px] text-ink3">
          {melody.composer} · {melody.notes.length} note · {melody.difficulty}
        </span>
        {!open && (
          <span className="mt-0.5 block truncate text-[11px] text-ink3">
            ti servono: {missing.slice(0, 6).map(t => `${italianOf(t)}${parseNote(t).octave}`).join(' ')}
            {missing.length > 6 ? ` +${missing.length - 6}` : ''}
          </span>
        )}
      </span>
      {best > 0 ? (
        <span className="flex-shrink-0 text-right text-[11px] font-semibold text-amber-400">
          {stars(best)}
          <span className="block font-medium tabular-nums text-ink3">{best}%</span>
        </span>
      ) : !open ? (
        <Lock className="h-4 w-4 flex-shrink-0 text-ink3" />
      ) : null}
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink3/60" />
    </button>
  );
}

export function MelodyView({ progress, audio, mic, section, onSection, initialMelodyId, onToggleMic }: MelodyViewProps) {
  const [selected, setSelected] = useState<Melody | null>(
    () => melodies.find(m => m.id === initialMelodyId) ?? null,
  );
  const learned = useMemo(() => progress.unlockedNotes.map(n => n.toneNote), [progress.unlockedNotes]);
  const entry = useMemo(() => (selected ? melodyEntry(selected) : null), [selected]);
  /** Il record: dal Leggio o, per chi l'aveva già, dalla vecchia lettura. */
  const best = (m: Melody) =>
    Math.max(progress.data.melodyBest[m.id] ?? 0, progress.data.melodyBest[`leggio:melodia-${m.id}`] ?? 0);

  const open = melodies.filter(m => m.requiredToneNotes.every(t => learned.includes(t)));

  const locked = melodies.filter(m => !open.includes(m));
  const row = (m: Melody) => (
    <MelodyCard
      key={m.id}
      melody={m}
      learned={learned}
      best={best(m)}
      onSelect={mel => setSelected(mel)}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Repertorio" title="Canzoni" subtitle="Melodie a una mano: leggi le note una dopo l'altra, al tuo tempo." />
      <Segmented
        value={section}
        onChange={onSection}
        options={[
          { value: 'pezzi', label: 'Brani' },
          { value: 'melodie', label: 'Melodie' },
        ]}
      />
      {open.length > 0 && (
        <Section label="Le puoi già leggere" action={<span className="text-xs tabular-nums text-ink3">{open.length}</span>}>
          <div className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">{open.map(row)}</div>
        </Section>
      )}
      {locked.length > 0 && (
        <Section label="Con le prossime note" action={<span className="text-xs tabular-nums text-ink3">{locked.length}</span>}>
          <div className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">{locked.map(row)}</div>
        </Section>
      )}

      {entry && (
        <Leggio
          key={entry.id}
          entry={entry}
          audio={audio}
          mic={mic}
          progress={progress}
          onToggleMic={onToggleMic}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
