// La libreria dei brani, come in un negozio di app: un brano in evidenza,
// filtri per livello e compositore, copertine colorate. Ogni brano si apre
// nel Leggio; i pezzi scritti per l'app hanno anche lo studio guidato.

import { useMemo, useState } from 'react';
import { BookOpen, Play, Sparkles } from 'lucide-react';
import type { Level, LibraryEntry } from '../data/library';
import { COMPOSER_STYLE, LEVEL_LABEL, composerStyle, featuredToday, library } from '../data/library';
import type { Piece } from '../types';
import type { ProgressApi } from '../hooks/useProgress';

interface Props {
  progress: ProgressApi;
  onOpen: (entry: LibraryEntry) => void;
  onGuided: (piece: Piece) => void;
}

function Dots({ level }: { level: Level }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`livello ${level} di 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= level ? 'bg-white' : 'bg-white/30'}`} />
      ))}
    </span>
  );
}

function Cover({ entry, big = false }: { entry: LibraryEntry; big?: boolean }) {
  const st = composerStyle(entry.composer);
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl p-3 text-white ${big ? 'min-h-40 sm:min-h-48' : 'min-h-28'}`}
      style={{ background: `linear-gradient(135deg, ${st.from}, ${st.to})` }}
    >
      <span className={`absolute -right-3 -top-4 select-none opacity-25 ${big ? 'text-8xl' : 'text-6xl'}`}>{st.emoji}</span>
      <div className="relative flex items-center justify-between gap-2">
        <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">{st.short}</span>
        <Dots level={entry.level} />
      </div>
      <div className="relative">
        <p className={`font-black leading-tight drop-shadow ${big ? 'text-2xl sm:text-3xl' : 'text-base'}`}>{entry.title}</p>
        {entry.subtitle && <p className="mt-0.5 text-[11px] font-semibold text-white/85">{entry.subtitle}</p>}
      </div>
    </div>
  );
}

function EntryCard({ entry: e, best, onOpen, onGuided }: { entry: LibraryEntry; best: number; onOpen: Props['onOpen']; onGuided: Props['onGuided'] }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <button type="button" onClick={() => onOpen(e)} className="block w-full p-1.5 text-left active:scale-[0.99]">
        <Cover entry={e} />
      </button>
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-1">
        <p className="line-clamp-2 text-xs leading-snug text-ink2">{e.about}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {best > 0 && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">record {best}%</span>}
          {e.source.kind === 'xml'
            ? <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-bold text-ink3">partitura originale completa</span>
            : <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-bold text-ink3">con studio guidato</span>}
        </div>
        <div className="mt-auto flex gap-2">
          <button type="button" onClick={() => onOpen(e)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-black text-white active:scale-[0.98]">
            <Play className="h-4 w-4" /> Leggio
          </button>
          {e.source.kind === 'piece' && (
            <button
              type="button"
              onClick={() => { if (e.source.kind === 'piece') onGuided(e.source.piece); }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface2 px-3 py-2.5 text-sm font-bold text-ink2 active:scale-[0.98]"
            >
              <BookOpen className="h-4 w-4" /> Guidato
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Library({ progress, onOpen, onGuided }: Props) {
  const [level, setLevel] = useState<Level | 0>(0);
  const [composer, setComposer] = useState<string | null>(null);

  // I grandi compositori in ordine di storia; esercizi e canti popolari in fondo.
  const composers = useMemo(() => {
    const order = Object.keys(COMPOSER_STYLE);
    const rank = (c: string) => (order.includes(c) ? order.indexOf(c) : order.length);
    return [...new Set(library.map(e => e.composer))].sort((a, b) => rank(a) - rank(b));
  }, []);
  const filtered = level !== 0 || composer !== null;
  const shown = library.filter(e => (level === 0 || e.level === level) && (!composer || e.composer === composer));

  const [featured] = useState(featuredToday);

  const best = (e: LibraryEntry) => progress.data.melodyBest[`leggio:${e.id}`] ?? 0;

  return (
    <div className="flex flex-col gap-3">
      {/* In evidenza */}
      <button type="button" onClick={() => onOpen(featured)} className="text-left active:scale-[0.99]">
        <div className="relative">
          <Cover entry={featured} big />
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-black text-slate-900 shadow-lg">
            <Play className="h-4 w-4" /> Apri
          </div>
          <span className="absolute left-3 top-10 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
            <Sparkles className="h-3 w-3" /> Brano del giorno
          </span>
        </div>
      </button>

      {/* Filtri */}
      <div className="thin-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        {([0, 1, 2, 3, 4, 5] as (Level | 0)[]).map(l => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${level === l ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink2'}`}
          >
            {l === 0 ? 'Tutti' : LEVEL_LABEL[l]}
          </button>
        ))}
      </div>
      <div className="thin-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        <button
          type="button"
          onClick={() => setComposer(null)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${!composer ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink2'}`}
        >
          Tutti i compositori
        </button>
        {composers.map(c => {
          const st = composerStyle(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => setComposer(composer === c ? null : c)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${composer === c ? 'border-transparent text-white' : 'border-line bg-surface text-ink2'}`}
              style={composer === c ? { background: `linear-gradient(135deg, ${st.from}, ${st.to})` } : undefined}
            >
              {st.emoji} {st.short}
            </button>
          );
        })}
      </div>

      {/* Brani: senza filtri, uno scaffale per livello; con i filtri, la griglia. */}
      {filtered ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map(e => <EntryCard key={e.id} entry={e} best={best(e)} onOpen={onOpen} onGuided={onGuided} />)}
        </div>
      ) : (
        ([1, 2, 3, 4, 5] as Level[]).map(l => {
          const row = library.filter(e => e.level === l);
          if (row.length === 0) return null;
          return (
            <section key={l} className="space-y-1.5">
              <div className="flex items-baseline justify-between px-0.5">
                <h3 className="text-base font-black text-ink">{LEVEL_LABEL[l]}</h3>
                <button type="button" onClick={() => setLevel(l)} className="text-xs font-bold text-brand">
                  Vedi tutti ({row.length})
                </button>
              </div>
              <div className="thin-scroll -mx-3 flex snap-x snap-mandatory scroll-px-3 gap-3 overflow-x-auto px-3 pb-1">
                {row.map(e => (
                  <div key={e.id} className="w-[78%] max-w-80 flex-none snap-start sm:w-72">
                    <EntryCard entry={e} best={best(e)} onOpen={onOpen} onGuided={onGuided} />
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
      {shown.length === 0 && <p className="py-6 text-center text-sm text-ink3">Nessun brano con questi filtri.</p>}
    </div>
  );
}
