// Un accordo scritto come si scrive davvero: note incolonnate su un unico
// gambo. Il pentagramma "a sequenza" dell'app disegna una nota per volta, qui
// invece devono stare tutte insieme, che è il punto di un accordo.
//
// Il foglio si dimensiona sull'INCHIOSTRO, non a occhio: si calcola dove
// cadono la nota più grave e la più acuta (comprese le linee aggiuntive) e si
// ritaglia intorno. Con un'altezza fissa il disegno finiva schiacciato in
// basso, con un terzo del riquadro vuoto sopra: su telefono sembrava tagliato.

import { useEffect, useMemo, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { midiOf, parseNote, sortByPitch, staffSlot, vexKeyOf } from '../lib/notes';

const W = 260;
const INK = '#101828';

// Le stesse misure del pentagramma "focus", così i due disegni sono coerenti.
const MARGIN_V = 16;
const LINE_GAP = 5;        // mezza distanza fra le linee
const STAVE_TOP_PAD = 40;  // spazio che VexFlow riserva sopra la prima linea
const STAVE_LINES_H = 40;
const CLEF_OVERSHOOT = 16; // la chiave sporge sopra e sotto le linee

/** Sotto il Sol2 conviene la chiave di basso: molte meno linee aggiuntive. */
function clefFor(notes: string[]): 'treble' | 'bass' {
  const lowest = Math.min(...notes.map(midiOf));
  return lowest < 55 ? 'bass' : 'treble';
}

export function ChordStaff({ notes, color = INK }: { notes: string[]; color?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const sorted = useMemo(() => sortByPitch(notes), [notes]);
  const clef = useMemo(() => clefFor(sorted), [sorted]);

  // Quanto spazio serve davvero, sopra e sotto le cinque linee.
  const { height, staveY } = useMemo(() => {
    const bottomLine = STAVE_TOP_PAD + STAVE_LINES_H;
    const ys = sorted.map(n => bottomLine - staffSlot(n, clef) * LINE_GAP);
    const inkTop = Math.min(STAVE_TOP_PAD - CLEF_OVERSHOOT, Math.min(...ys) - 12);
    const inkBottom = Math.max(bottomLine + CLEF_OVERSHOOT, Math.max(...ys) + 12);
    return { height: inkBottom - inkTop + MARGIN_V * 2, staveY: MARGIN_V - inkTop };
  }, [sorted, clef]);

  useEffect(() => {
    const container = ref.current;
    if (!container || sorted.length === 0) return;
    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(W, height);
    const ctx = renderer.getContext();

    const stave = new Stave(8, staveY, W - 16);
    stave.addClef(clef);
    stave.setContext(ctx).draw();

    const chord = new StaveNote({ keys: sorted.map(vexKeyOf), duration: 'w', clef });
    sorted.forEach((n, i) => {
      // I codici di VexFlow sono gli stessi che usiamo noi: #, b, ##, bb.
      const { acc } = parseNote(n);
      if (acc) chord.addModifier(new Accidental(acc), i);
    });
    chord.setStyle({ fillStyle: color, strokeStyle: color });

    // L'accordo va nella metà destra, con aria a sinistra per le alterazioni:
    // appiccicato alla chiave i bemolli finivano sopra di essa.
    stave.setNoteStartX(Math.round(stave.getX() + stave.getWidth() * 0.52));
    const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT);
    voice.addTickables([chord]);
    new Formatter().joinVoices([voice]).format([voice], 40);
    voice.draw(ctx, stave);

    const svg = container.querySelector('svg');
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${W} ${height}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.style.width = '100%';
      svg.style.height = '100%';
    }
    return () => { container.innerHTML = ''; };
  }, [sorted, clef, height, staveY, color]);

  return (
    <div
      className="w-full overflow-hidden rounded-2xl border border-amber-300/40 shadow-inner"
      style={{
        aspectRatio: `${W} / ${height}`,
        background: 'linear-gradient(180deg, var(--c-paper) 0%, var(--c-paper2) 100%)',
      }}
    >
      <div ref={ref} className="h-full w-full" />
    </div>
  );
}

