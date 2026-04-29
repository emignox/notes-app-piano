import { useCallback, useEffect, useRef, useState } from 'react';

interface PianoKeyboardProps {
  onKeyPress: (toneNote: string) => void;
  correctNote: string | null;
  pressedNote: string | null;
  showAnswer: boolean;
  startOctave: number;
  endOctave: number;
}

interface KeyDef {
  note: string;
  isBlack: boolean;
  label: string;
  whiteIndex: number;
}

const NOTE_NAMES: Record<string, string> = {
  C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si',
};

function buildKeys(startOctave: number, endOctave: number): KeyDef[] {
  const keys: KeyDef[] = [];
  const whiteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackAfter: Record<string, string> = { C: 'C#', D: 'D#', F: 'F#', G: 'G#', A: 'A#' };
  let whiteIndex = 0;
  for (let oct = startOctave; oct <= endOctave; oct++) {
    for (const name of whiteOrder) {
      keys.push({ note: `${name}${oct}`, isBlack: false, label: NOTE_NAMES[name], whiteIndex });
      whiteIndex++;
      if (blackAfter[name]) {
        keys.push({ note: `${blackAfter[name]}${oct}`, isBlack: true, label: '', whiteIndex: whiteIndex - 0.5 });
      }
    }
  }
  return keys;
}

function normalizeToneNote(note: string): string {
  const enharmonic: Record<string, string> = {
    Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B',
  };
  for (const [flat, sharp] of Object.entries(enharmonic)) {
    if (note.startsWith(flat)) return `${sharp}${note.slice(flat.length)}`;
  }
  return note;
}

const WHITE_KEY_W = 36;
const WHITE_KEY_H = 130;
const BLACK_KEY_W = 22;
const BLACK_KEY_H = 82;

export function PianoKeyboard({ onKeyPress, correctNote, pressedNote, showAnswer, startOctave, endOctave }: PianoKeyboardProps) {
  const keys = buildKeys(startOctave, endOctave);
  const whiteKeys = keys.filter(k => !k.isBlack);
  const blackKeys = keys.filter(k => k.isBlack);
  const naturalWidth = whiteKeys.length * WHITE_KEY_W;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setScale(Math.min(1, el.clientWidth / naturalWidth));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [naturalWidth]);

  const normalizedCorrect = correctNote ? normalizeToneNote(correctNote) : null;
  const normalizedPressed = pressedNote ? normalizeToneNote(pressedNote) : null;

  const getKeyColor = useCallback((keyNote: string) => {
    const normalized = normalizeToneNote(keyNote);
    const isBlack = keyNote.includes('#');
    if (showAnswer && normalizedCorrect && normalized === normalizedCorrect) return '#16a34a';
    if (showAnswer && normalizedPressed && normalized === normalizedPressed && normalizedPressed !== normalizedCorrect) return '#dc2626';
    return isBlack ? '#1a1a2e' : '#fffef7';
  }, [showAnswer, normalizedCorrect, normalizedPressed]);

  const isCorrectKey = (keyNote: string) =>
    showAnswer && normalizeToneNote(keyNote) === normalizedCorrect;

  const scaledH = Math.round((WHITE_KEY_H + 4) * scale);

  return (
    <div ref={wrapRef} className="w-full" style={{ height: scaledH }}>
      <div style={{ transformOrigin: 'top left', transform: `scale(${scale})`, width: naturalWidth, height: WHITE_KEY_H + 4 }}>
        {/* White keys */}
        {whiteKeys.map((key, i) => {
          const bg = getKeyColor(key.note);
          const correct = isCorrectKey(key.note);
          return (
            <button
              key={key.note}
              onClick={() => onKeyPress(key.note)}
              className="absolute border border-gray-300 rounded-b-md transition-colors duration-150 active:brightness-75 focus:outline-none"
              style={{
                left: i * WHITE_KEY_W,
                top: 0,
                width: WHITE_KEY_W - 1,
                height: WHITE_KEY_H,
                backgroundColor: bg,
                boxShadow: correct
                  ? '0 0 0 3px #16a34a, inset 0 -4px 6px rgba(0,0,0,0.15)'
                  : 'inset 0 -4px 6px rgba(0,0,0,0.1)',
                zIndex: 1,
              }}
            >
              <span
                className="absolute bottom-1.5 left-0 right-0 text-center font-medium"
                style={{ color: bg === '#fffef7' ? '#9ca3af' : '#fff', fontSize: 9 }}
              >
                {key.label}
              </span>
            </button>
          );
        })}

        {/* Black keys */}
        {blackKeys.map(key => {
          const bg = getKeyColor(key.note);
          const correct = isCorrectKey(key.note);
          return (
            <button
              key={key.note}
              onClick={() => onKeyPress(key.note)}
              className="absolute rounded-b-md transition-colors duration-150 active:brightness-75 focus:outline-none"
              style={{
                left: key.whiteIndex * WHITE_KEY_W - BLACK_KEY_W / 2,
                top: 0,
                width: BLACK_KEY_W,
                height: BLACK_KEY_H,
                backgroundColor: bg,
                boxShadow: correct
                  ? '0 0 0 3px #16a34a, 2px 4px 8px rgba(0,0,0,0.5)'
                  : '2px 4px 8px rgba(0,0,0,0.5)',
                zIndex: 2,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
