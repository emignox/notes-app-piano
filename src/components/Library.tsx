// La libreria dei brani, come in un negozio di app: un brano in evidenza,
// scaffali per livello, filtri per livello e compositore, copertine con il
// ritratto del compositore. Ogni brano si apre nel Leggio; i pezzi scritti per
// l'app hanno anche lo studio guidato.

import { useMemo, useState } from 'react';
import { BookOpen, Play } from 'lucide-react';
import type { Level, LibraryEntry } from '../data/library';
import { COMPOSER_STYLE, LEVEL_LABEL, composerStyle, featuredToday, library } from '../data/library';
import { PORTRAIT } from '../data/images';
import type { Piece } from '../types';
import type { ProgressApi } from '../hooks/useProgress';
import { ImageCover, Section } from './ui';

interface Props {
  progress: ProgressApi;
  onOpen: (entry: LibraryEntry) => void;
  onGuided: (piece: Piece) => void;
}

function Dots({ level }: { level: Level }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`livello ${level} di 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`h-1 w-1 rounded-full ${i <= level ? 'bg-white' : 'bg-white/30'}`} />
      ))}
    </span>
  );
}

/** La copertina: ritratto del compositore (o la sua tinta), titolo in basso. */
function Cover({ entry, big = false }: { entry: LibraryEntry; big?: boolean }) {
  const st = composerStyle(entry.composer);
  const img = PORTRAIT[entry.composer];
  return (
    <ImageCover
      src={img?.src}
      position={img?.position ?? 'center 22%'}
      light={img?.light}
      tint={st.from}
      className={`flex flex-col justify-between ${big ? 'aspect-[16/11] rounded-[24px] p-5 sm:aspect-[21/9]' : 'aspect-[4/5] rounded-[18px] p-3'}`}
    >
      <div className="flex items-center justify-between gap-2">
        {big ? (
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">Brano del giorno</span>
        ) : (
          <span />
        )}
        <Dots level={entry.level} />
      </div>
      {!img && <span className={`absolute right-3 top-8 select-none opacity-20 ${big ? 'text-8xl' : 'text-5xl'}`}>{st.emoji}</span>}
      <div>
        <p className={`font-bold leading-tight tracking-tight text-white ${big ? 'text-[28px] sm:text-[34px]' : 'text-[15px]'}`}>{entry.title}</p>
        {entry.subtitle && <p className={`mt-0.5 text-white/75 ${big ? 'text-sm' : 'line-clamp-2 text-[11px]'}`}>{entry.subtitle}</p>}
      </div>
    </ImageCover>
  );
}

function EntryCard({ entry: e, best, onOpen, onGuided }: { entry: LibraryEntry; best: number; onOpen: Props['onOpen']; onGuided: Props['onGuided'] }) {
  const st = composerStyle(e.composer);
  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={() => onOpen(e)} className="block w-full text-left transition-transform active:scale-[0.98]" aria-label={`Apri ${e.title} nel Leggio`}>
        <Cover entry={e} />
      </button>
      <div className="px-0.5">
        <p className="truncate text-[13px] font-semibold text-ink">{st.short}</p>
        <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink3">{e.about}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          {best > 0 && <span className="font-semibold text-emerald-400">record {best}%</span>}
          {e.source.kind === 'piece' ? (
            <button
              type="button"
              onClick={() => { if (e.source.kind === 'piece') onGuided(e.source.piece); }}
              className="flex items-center gap-1 font-semibold text-brand"
            >
              <BookOpen className="h-3 w-3" /> Studio guidato
            </button>
          ) : (
            <span className="text-ink3">partitura originale</span>
          )}
        </div>
      </div>
    </div>
  );
}

const chip = (active: boolean) =>
  `shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active ? 'border-ink bg-ink text-canvas' : 'border-line text-ink2 hover:border-ink3/60'
  }`;

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
    <div className="flex flex-col gap-6">
      {/* In evidenza */}
      <div className="relative">
        <button type="button" onClick={() => onOpen(featured)} className="block w-full text-left active:scale-[0.99]">
          <Cover entry={featured} big />
        </button>
        <div className="pointer-events-none absolute bottom-5 right-5 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
          <Play className="h-4 w-4 fill-black" /> Apri
        </div>
      </div>

      {/* Filtri */}
      <div className="space-y-2">
        <div className="thin-scroll -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5">
          {([0, 1, 2, 3, 4, 5] as (Level | 0)[]).map(l => (
            <button key={l} type="button" onClick={() => setLevel(l)} className={chip(level === l)}>
              {l === 0 ? 'Tutti i livelli' : LEVEL_LABEL[l]}
            </button>
          ))}
        </div>
        <div className="thin-scroll -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5">
          <button type="button" onClick={() => setComposer(null)} className={chip(!composer)}>
            Tutti
          </button>
          {composers.map(c => (
            <button key={c} type="button" onClick={() => setComposer(composer === c ? null : c)} className={chip(composer === c)}>
              {composerStyle(c).short}
            </button>
          ))}
        </div>
      </div>

      {/* Brani: senza filtri, uno scaffale per livello; con i filtri, la griglia. */}
      {filtered ? (
        <Section label={`${shown.length} ${shown.length === 1 ? 'brano' : 'brani'}`}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
            {shown.map(e => <EntryCard key={e.id} entry={e} best={best(e)} onOpen={onOpen} onGuided={onGuided} />)}
          </div>
          {shown.length === 0 && <p className="py-6 text-center text-sm text-ink3">Nessun brano con questi filtri.</p>}
        </Section>
      ) : (
        ([1, 2, 3, 4, 5] as Level[]).map(l => {
          const row = library.filter(e => e.level === l);
          if (row.length === 0) return null;
          return (
            <Section
              key={l}
              label={LEVEL_LABEL[l]}
              action={
                <button type="button" onClick={() => setLevel(l)} className="text-[13px] font-medium text-brand">
                  Vedi tutti
                </button>
              }
            >
              <div className="thin-scroll -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
                {row.map(e => (
                  <div key={e.id} className="w-[42%] max-w-52 flex-none snap-start sm:w-44">
                    <EntryCard entry={e} best={best(e)} onOpen={onOpen} onGuided={onGuided} />
                  </div>
                ))}
              </div>
            </Section>
          );
        })
      )}
    </div>
  );
}
