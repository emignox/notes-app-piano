// Una figura ritmica sul pentagramma: solo durate, tutte sulla linea di mezzo.
// Le crome sono unite a gruppi di un movimento, come si stampano davvero: è
// proprio il colpo d'occhio sul gruppo che si allena. Dopo l'esecuzione ogni
// nota prende il colore del suo esito.

import { useEffect, useRef } from 'react';
import { Beam, Dot, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import type { HitGrade, RhythmPattern } from '../lib/rhythmReading';

const INK = '#101828';
const COLORS: Record<HitGrade, string> = { ok: '#15803d', quasi: '#ca8a04', fuori: '#dc2626', persa: '#dc2626' };
const ACTIVE = '#4f46e5';

const NAMES: Record<string, string> = {
  w: 'semibreve', hd: 'minima puntata', h: 'minima', qd: 'semiminima puntata', q: 'semiminima', '8': 'croma', '16': 'semicroma',
};

/** La figura a parole, per chi usa un lettore di schermo. */
function describe(pattern: RhythmPattern): string {
  return pattern
    .map((bar, i) => `Battuta ${i + 1}: ${bar.map(it => (it.rest ? `pausa di ${NAMES[it.dur]}` : NAMES[it.dur])).join(', ')}`)
    .join('. ');
}

const BAR_W = 170;
const FIRST_EXTRA = 34;
const HEIGHT = 108;

export function RhythmStaff({
  pattern,
  grades,
  active = null,
}: {
  pattern: RhythmPattern;
  /** Esito per attacco (in ordine), dopo l'esecuzione. */
  grades?: HitGrade[] | null;
  /** Attacco che sta suonando ora, durante l'ascolto. */
  active?: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const width = pattern.length * BAR_W + FIRST_EXTRA + 8;

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = '';
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, HEIGHT);
    const ctx = renderer.getContext();

    let onset = 0;
    let x = 4;
    pattern.forEach((bar, b) => {
      const w = BAR_W + (b === 0 ? FIRST_EXTRA : 0);
      const stave = new Stave(x, 4, w);
      if (b === 0) stave.addTimeSignature('4/4');
      if (b === pattern.length - 1) stave.setEndBarType(3); // doppia stanghetta finale
      stave.setContext(ctx).draw();

      const notes = bar.map(item => {
        const base = item.dur.replace('d', '');
        const dotted = item.dur.endsWith('d');
        const sn = new StaveNote({ keys: ['b/4'], duration: `${base}${dotted ? 'd' : ''}${item.rest ? 'r' : ''}` });
        if (dotted) Dot.buildAndAttach([sn], { all: true });
        let color = INK;
        if (!item.rest) {
          if (grades?.[onset]) color = COLORS[grades[onset]];
          else if (active === onset) color = ACTIVE;
          onset++;
        }
        sn.setStyle({ fillStyle: color, strokeStyle: color });
        return sn;
      });

      const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT);
      voice.addTickables(notes);
      let beams: Beam[] = [];
      try {
        // le pause interrompono le travature: si passano tutte, il raggruppamento
        // per movimento resta giusto
        beams = Beam.generateBeams(notes);
      } catch {
        /* senza travature si legge comunque */
      }
      new Formatter().joinVoices([voice]).formatToStave([voice], stave);
      voice.draw(ctx, stave);
      beams.forEach(beam => {
        // la travatura prende il colore delle sue note, se lo condividono
        const colors = new Set(beam.getNotes().map(nt => nt.getStyle()?.fillStyle ?? INK));
        const c = colors.size === 1 ? [...colors][0] : INK;
        beam.setStyle({ fillStyle: c, strokeStyle: c });
        beam.setContext(ctx).draw();
      });
      x += w;
    });

    const svg = container.querySelector('svg');
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.style.width = '100%';
      svg.style.height = '100%';
    }
    return () => { container.innerHTML = ''; };
  }, [pattern, grades, active, width]);

  return (
    <div
      className="w-full overflow-hidden rounded-2xl border border-amber-300/40 shadow-inner"
      style={{ aspectRatio: `${width} / ${HEIGHT}`, background: 'linear-gradient(180deg, var(--c-paper) 0%, var(--c-paper2) 100%)' }}
    >
      <div ref={ref} className="h-full w-full" role="img" aria-label={describe(pattern)} />
    </div>
  );
}
