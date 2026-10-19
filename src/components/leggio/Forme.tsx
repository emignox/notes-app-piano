// La vista "Forme" del Leggio: sopra il rigo della destra e sotto quello della
// sinistra, una striscia con le forme riconosciute (accordi, arpeggi, bassi,
// scale…). Le forme che tornano hanno lo stesso colore, e una legenda le elenca
// con un tocco per andare alla prima. Il riconoscimento è in `lib/forme.ts`.

import type { Forma } from '../../lib/forme';
import { t } from '../../i18n';
import { STRIP_PX, familyLabel, formaColor, formaLabel, formaText, formaTitle } from './formeText';

export function FormeStrip({
  shapes,
  staff,
  boxes,
  openId,
  onOpen,
}: {
  shapes: Forma[];
  staff: number;
  boxes: Map<number, { x: number; w: number }>;
  openId: number | null;
  onOpen: (id: number) => void;
}) {
  return (
    <div className="relative flex-none" style={{ height: STRIP_PX }}>
      {shapes.filter(f => f.staff === staff).map(f => {
        const b = boxes.get(f.id);
        if (!b) return null;
        const color = formaColor(f);
        const narrow = b.w < 96;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onOpen(f.id)}
            aria-pressed={openId === f.id}
            className="absolute top-1 flex h-5 items-center overflow-hidden whitespace-nowrap rounded-md px-1.5 text-[11px] font-bold leading-none text-white active:scale-95"
            style={{
              left: b.x,
              width: b.w,
              background: `${color}${openId === f.id ? 'ff' : 'cc'}`,
              boxShadow: openId === f.id ? `0 0 0 2px ${color}` : undefined,
            }}
          >
            <span className="truncate">{formaLabel(f, narrow)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Le famiglie che tornano nel brano, con un tocco per andare alla prima. */
export function FormeLegend({
  families,
  onGo,
}: {
  families: { family: number; sample: Forma; count: number }[];
  onGo: (f: Forma) => void;
}) {
  return (
    <div className="thin-scroll flex items-center gap-1.5 overflow-x-auto border-t border-line/70 bg-surface px-3 py-1.5">
      <span className="flex-none text-[11px] font-bold uppercase tracking-wider text-ink3">{t('Forme che tornano')}</span>
      {families.length === 0 && <span className="flex-none text-xs text-ink3">{t('In questo brano nessuna forma si ripete abbastanza.')}</span>}
      {families.map(fam => (
        <button
          key={fam.family}
          type="button"
          onClick={() => onGo(fam.sample)}
          className="flex flex-none items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-bold text-ink2 active:scale-95"
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: formaColor(fam.sample) }} />
          {familyLabel(fam.sample)}
          <span className="tabular-nums text-ink3">×{fam.count}</span>
        </button>
      ))}
    </div>
  );
}

/** La scheda di una forma toccata. */
/** `top`: la scheda sta in alto (per le forme della sinistra, che sono in basso) e non copre la forma toccata. */
export function FormeCard({ forma, top, onClose }: { forma: Forma; top: boolean; onClose: () => void }) {
  const color = formaColor(forma);
  return (
    <div className={`absolute inset-x-3 ${top ? 'top-2' : 'bottom-2'} z-30 mx-auto max-w-md rounded-2xl border border-line bg-surface/95 p-3 shadow-2xl backdrop-blur`} role="dialog" aria-label={formaTitle(forma)}>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 flex-none rounded-full" style={{ background: color }} />
        <p className="min-w-0 flex-1 truncate text-sm font-black">{formaTitle(forma)}</p>
        <button type="button" onClick={onClose} className="flex-none rounded-lg bg-surface2 px-2 py-1 text-xs font-bold text-ink2" aria-label={t('Chiudi')}>
          ✕
        </button>
      </div>
      {formaText(forma).map((p, i) => (
        <p key={i} className="mt-1.5 text-xs leading-relaxed text-ink2">{p}</p>
      ))}
    </div>
  );
}
