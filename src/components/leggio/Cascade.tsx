// La cascata: le note scendono verso la tastiera e la toccano nell'istante in
// cui vanno suonate. Lunghezza = durata, colore = mano, nome scritto dentro.
// È la vista più immediata per chi comincia; lo spartito resta accanto,
// perché l'obiettivo è leggere.

import { useEffect, useRef } from 'react';
import { HAND_COLOR, keyLayout, midiName } from './keys';

export interface FallingNote {
  midi: number;
  /** Inizio e durata, in movimenti. */
  start: number;
  dur: number;
  staff: number;
  /** Il nome come è scritto in partitura. */
  name?: string;
}

interface Props {
  notes: FallingNote[];
  from: number;
  to: number;
  /** Il "presente", in movimenti: lo legge a ogni fotogramma. */
  nowBeat: () => number;
  /** Quanti movimenti stanno nell'altezza della cascata. */
  windowBeats: number;
  /** Righe orizzontali delle battute. */
  barBeats: number[];
  /** Mani spente (si disegnano in grigio). */
  dimStaff?: number | null;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function Cascade({ notes, from, to, nowBeat, windowBeats, barBeats, dimStaff = null }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Tutto ciò che il disegno legge sta in un ref: il ciclo di animazione non
  // si riavvia a ogni render.
  const live = useRef({ notes, from, to, nowBeat, windowBeats, barBeats, dimStaff });
  useEffect(() => { live.current = { notes, from, to, nowBeat, windowBeats, barBeats, dimStaff }; });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0;
    const draw = () => {
      const { notes: ns, from: lo, to: hi, nowBeat: now, windowBeats: win, barBeats: bars, dimStaff: dim } = live.current;
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const layout = keyLayout(lo, hi);
      const t = now();
      const y = (beat: number) => H - ((beat - t) / win) * H;

      // Guide verticali sui Do e righe delle battute.
      ctx.fillStyle = 'rgba(148,163,184,0.10)';
      for (const [m, k] of layout) if (m % 12 === 0) ctx.fillRect(k.x * W, 0, 1, H);
      ctx.fillStyle = 'rgba(148,163,184,0.22)';
      for (const b of bars) {
        const yy = y(b);
        if (yy >= 0 && yy <= H) ctx.fillRect(0, yy, W, 1);
      }

      for (const n of ns) {
        if (n.start > t + win || n.start + n.dur < t - 0.05) continue;
        const k = layout.get(n.midi);
        if (!k) continue;
        const top = y(n.start + n.dur);
        const bottom = y(n.start);
        const x = k.x * W + 1.5;
        const w = k.w * W - 3;
        const h = Math.max(6, bottom - top - 2);
        const color = dim === n.staff ? '#64748b' : HAND_COLOR[n.staff] ?? HAND_COLOR[0];
        const playing = n.start <= t && t < n.start + n.dur;
        ctx.globalAlpha = dim === n.staff ? 0.45 : 1;
        if (playing) { ctx.shadowColor = color; ctx.shadowBlur = 14; }
        ctx.fillStyle = color;
        roundRect(ctx, x, top, w, h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (k.black) {
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        if (h > 18 && w > 13) {
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.font = `700 ${Math.min(13, Math.max(9, w * 0.42))}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(n.name ?? midiName(n.midi), x + w / 2, bottom - 7);
        }
        ctx.globalAlpha = 1;
      }

      // La linea del presente: dove le note toccano la tastiera.
      ctx.fillStyle = 'rgba(99,102,241,0.9)';
      ctx.fillRect(0, H - 2, W, 2);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="block h-full w-full" />;
}
