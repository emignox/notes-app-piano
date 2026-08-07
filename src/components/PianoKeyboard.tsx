// ─────────────────────────────────────────────────────────────────────────────
// Tastiera. Risponde su pointerdown (sul telefono si sente immediata) e i Do
// sono marcati: è così che si impara a orientarsi su un piano vero, contando
// dai Do e non dal bordo della tastiera.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IT_NAMES, midiOf, parseNote } from '../lib/notes';

interface PianoKeyboardProps {
  from: string;
  to: string;
  onPress: (toneNote: string) => void;
  /** Tasto giusto: cerchiato di verde dopo la risposta. */
  correct?: string | null;
  /** Tasto premuto per sbaglio. */
  wrong?: string | null;
  /** Suggerimenti (es. la nota da trovare quando si usa l'aiuto). */
  hint?: string[];
  /**
   * La nota di TURNO dentro una figura: si accende più forte dei suggerimenti,
   * così si vede insieme l'accordo o la scala intera e dove si è arrivati.
   */
  active?: string | null;
  labels?: 'all' | 'c' | 'none';
  disabled?: boolean;
  compact?: boolean;
}

interface KeyDef {
  note: string;
  isBlack: boolean;
  letter: string;
  octave: number;
  /**
   * Posizione in unità di tasto bianco. Per un bianco è il suo indice; per un
   * nero è il confine fra i due bianchi su cui sta a cavallo (Do♯ = 1, cioè il
   * bordo fra Do e Re). Mi/Fa e Si/Do non hanno nero: i gruppi da 2 e da 3
   * vengono da sé.
   */
  slot: number;
}

const WHITE_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_AFTER: Record<string, string> = { C: 'C#', D: 'D#', F: 'F#', G: 'G#', A: 'A#' };

function buildKeys(startOctave: number, endOctave: number): KeyDef[] {
  const keys: KeyDef[] = [];
  let slot = 0;
  for (let oct = startOctave; oct <= endOctave; oct++) {
    for (const letter of WHITE_ORDER) {
      keys.push({ note: `${letter}${oct}`, isBlack: false, letter, octave: oct, slot });
      slot++;
      // slot ora è il bordo destro del bianco appena inserito: lì va il nero.
      const black = BLACK_AFTER[letter];
      if (black) keys.push({ note: `${black}${oct}`, isBlack: true, letter: black, octave: oct, slot });
    }
  }
  return keys;
}

// Sotto questa scala i tasti diventano intoccabili: meglio far scorrere.
const MIN_SCALE = 0.6;

export function PianoKeyboard({
  from,
  to,
  onPress,
  correct = null,
  wrong = null,
  hint = [],
  active = null,
  labels = 'c',
  disabled = false,
  compact = false,
}: PianoKeyboardProps) {
  const whiteW = compact ? 36 : 42;
  const whiteH = compact ? 118 : 142;
  const blackW = Math.round(whiteW * 0.6);
  const blackH = Math.round(whiteH * 0.62);

  const startOctave = parseNote(from).octave;
  const endOctave = parseNote(to).octave;

  const keys = useMemo(() => buildKeys(startOctave, endOctave), [startOctave, endOctave]);
  const whiteKeys = keys.filter(k => !k.isBlack);
  const blackKeys = keys.filter(k => k.isBlack);
  const naturalWidth = whiteKeys.length * whiteW;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const fit = el.clientWidth / naturalWidth;
      setScale(Math.min(1, Math.max(MIN_SCALE, fit)));
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, [naturalWidth]);

  // Confronto per ALTEZZA, non per lettera+ottava: Do♭5 e Si4 sono lo stesso
  // tasto, ma il numero d'ottava scritto è diverso. Con la sola classe di
  // altezza più l'ottava, la scala di Sol♭ maggiore (…Si♭ Do♭…) e le settime
  // diminuite non illuminavano il tasto giusto.
  const sameKey = useCallback((a: string | null, b: string) => a != null && midiOf(a) === midiOf(b), []);

  const press = useCallback(
    (note: string) => (e: React.PointerEvent) => {
      e.preventDefault();
      if (disabled) return;
      onPress(note);
    },
    [disabled, onPress],
  );

  const scaledH = Math.round((whiteH + 6) * scale);
  const scaledW = naturalWidth * scale;

  return (
    <div ref={wrapRef} className="thin-scroll w-full overflow-x-auto" style={{ height: scaledH }}>
      <div
        className="relative"
        style={{ transformOrigin: 'top left', transform: `scale(${scale})`, width: naturalWidth, height: whiteH + 6, minWidth: scaledW }}
      >
        {whiteKeys.map((key, i) => {
          const isCorrect = sameKey(correct, key.note);
          const isWrong = sameKey(wrong, key.note);
          const isActive = sameKey(active, key.note);
          const isHint = hint.some(h => sameKey(h, key.note));
          const isC = key.letter === 'C';
          const bg = isCorrect ? '#16a34a' : isWrong ? '#dc2626' : isActive ? '#4f46e5' : isHint ? '#c7d2fe' : '#fffdf7';
          const light = !isCorrect && !isWrong && !isActive;
          return (
            <button
              key={key.note}
              data-note={key.note}
              aria-label={key.note}
              onPointerDown={press(key.note)}
              onContextMenu={e => e.preventDefault()}
              className="absolute rounded-b-lg border border-gray-300/80 transition-[filter,background-color] duration-100 active:brightness-90"
              style={{
                left: i * whiteW,
                top: 0,
                width: whiteW - 1,
                height: whiteH,
                backgroundColor: bg,
                boxShadow: isCorrect
                  ? '0 0 0 3px #16a34a, inset 0 -5px 7px rgba(0,0,0,0.12)'
                  : isActive
                  ? '0 0 0 3px #4f46e5, inset 0 -5px 7px rgba(0,0,0,0.12)'
                  : 'inset 0 -5px 7px rgba(0,0,0,0.10)',
                zIndex: 1,
              }}
            >
              {isC && (
                <span
                  className="absolute left-0 right-0 text-center font-bold"
                  style={{ bottom: 20, color: light ? '#94a3b8' : '#ffffff', fontSize: 8 }}
                >
                  {key.octave}
                </span>
              )}
              {(labels === 'all' || (labels === 'c' && isC)) && (
                <span
                  className="absolute left-0 right-0 text-center font-semibold"
                  style={{ bottom: 5, color: light ? (isC ? '#475569' : '#9ca3af') : '#ffffff', fontSize: 10 }}
                >
                  {IT_NAMES[key.letter]}
                </span>
              )}
            </button>
          );
        })}

        {blackKeys.map(key => {
          const isCorrect = sameKey(correct, key.note);
          const isWrong = sameKey(wrong, key.note);
          const isActive = sameKey(active, key.note);
          const isHint = hint.some(h => sameKey(h, key.note));
          const bg = isCorrect ? '#16a34a' : isWrong ? '#dc2626' : isActive ? '#818cf8' : isHint ? '#4f46e5' : '#161b2e';
          return (
            <button
              key={key.note}
              data-note={key.note}
              aria-label={key.note}
              onPointerDown={press(key.note)}
              onContextMenu={e => e.preventDefault()}
              className="absolute rounded-b-md transition-[filter,background-color] duration-100 active:brightness-125"
              style={{
                left: key.slot * whiteW - blackW / 2,
                top: 0,
                width: blackW,
                height: blackH,
                backgroundColor: bg,
                boxShadow: isCorrect
                  ? '0 0 0 3px #16a34a, 2px 4px 8px rgba(0,0,0,0.5)'
                  : isActive
                  ? '0 0 0 3px #818cf8, 2px 4px 8px rgba(0,0,0,0.5)'
                  : '2px 4px 8px rgba(0,0,0,0.45)',
                zIndex: 2,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
