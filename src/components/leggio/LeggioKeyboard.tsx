// La tastiera del Leggio: larga quanto lo schermo, si accende sui tasti da
// premere (blu la destra, viola la sinistra), diventa verde quando li trovi e
// rossa quando sbagli. Con il nome della nota scritto sul tasto acceso: chi
// impara non deve cercarlo.

import { memo, useMemo } from 'react';
import { keyLayout, midiName } from './keys';

interface Props {
  from: number;
  to: number;
  /** Tasti accesi: midi → colore. */
  lit: Map<number, string>;
  /** Nomi da scrivere sui tasti accesi (come sono scritti in partitura). */
  names?: Map<number, string>;
  onPress?: (midi: number) => void;
}

export const LeggioKeyboard = memo(function LeggioKeyboard({ from, to, lit, names, onPress }: Props) {
  const layout = useMemo(() => keyLayout(from, to), [from, to]);
  const keys = [...layout.entries()].sort((a, b) => Number(a[1].black) - Number(b[1].black));

  return (
    <div className="relative h-full w-full select-none overflow-hidden rounded-t-xl bg-slate-900 pt-1" style={{ touchAction: 'none' }}>
      {keys.map(([midi, k]) => {
        const color = lit.get(midi);
        const isC = midi % 12 === 0;
        return (
          <button
            key={midi}
            type="button"
            aria-label={`${midiName(midi)}${Math.floor(midi / 12) - 1}`}
            data-midi={midi}
            onPointerDown={e => { e.preventDefault(); onPress?.(midi); }}
            className={`absolute flex flex-col items-center justify-end border ${
              k.black
                ? 'top-1 z-10 rounded-b-md border-black/70'
                : 'bottom-0 rounded-b-lg border-slate-300/80'
            }`}
            style={{
              left: `${k.x * 100}%`,
              width: `${k.w * 100}%`,
              height: k.black ? '62%' : 'calc(100% - 4px)',
              background: color
                ? color
                : k.black
                  ? 'linear-gradient(180deg,#1e293b,#020617)'
                  : 'linear-gradient(180deg,#ffffff,#eef2f7)',
              boxShadow: color ? `0 0 14px ${color}` : undefined,
            }}
          >
            {color ? (
              k.black ? (
                // Il tasto nero è stretto: il nome sta in una pillola appena sotto.
                <span
                  className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow sm:text-[11px]"
                  style={{ background: color }}
                >
                  {names?.get(midi) ?? midiName(midi)}
                </span>
              ) : (
                <span className="mb-1.5 text-[11px] font-black leading-none text-white drop-shadow sm:text-xs">
                  {names?.get(midi) ?? midiName(midi)}
                </span>
              )
            ) : (
              !k.black && isC && (
                <span className="mb-1 text-[9px] font-semibold leading-none text-slate-400">Do{Math.floor(midi / 12) - 1}</span>
              )
            )}
          </button>
        );
      })}
    </div>
  );
});
