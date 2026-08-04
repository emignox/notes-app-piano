import { useState } from 'react';
import type { NameStyle } from '../lib/notes';
import { IT_NAMES, parseNote } from '../lib/notes';

interface NoteNameButtonsProps {
  onSelect: (noteName: string) => void;
  disabled?: boolean;
  style?: NameStyle;
  /** Mostra i tasti ♭ ♮ ♯ (solo quando fra le note studiate ci sono alterazioni). */
  showAccidentals?: boolean;
  /** Risposta esatta: dopo il responso il tasto giusto si illumina. */
  correct?: string | null;
  /** Ciò che ha scelto l'utente: se sbagliato diventa rosso. */
  picked?: string | null;
}

type AccidentalMode = 'none' | 'sharp' | 'flat';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export function NoteNameButtons({
  onSelect,
  disabled = false,
  style = 'it',
  showAccidentals = false,
  correct = null,
  picked = null,
}: NoteNameButtonsProps) {
  // Si azzera dopo ogni scelta: l'alterazione vale per una risposta sola.
  const [mode, setMode] = useState<AccidentalMode>('none');

  const handle = (letter: string) => {
    const suffix = mode === 'sharp' ? '#' : mode === 'flat' ? 'b' : '';
    onSelect(`${letter}${suffix}`);
    setMode('none');
  };

  const correctLetter = correct ? parseNote(correct).letter : null;
  const pickedLetter = picked ? parseNote(picked).letter : null;
  const revealing = correct !== null;

  const suffix = mode === 'sharp' ? '♯' : mode === 'flat' ? '♭' : '';

  return (
    <div className="flex flex-col gap-2.5">
      {showAccidentals && (
        <div className="flex justify-center gap-2">
          {([
            ['flat', '♭', 'bg-sky-600'],
            ['none', '♮', 'bg-slate-500'],
            ['sharp', '♯', 'bg-orange-600'],
          ] as const).map(([m, symbol, activeBg]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(prev => (prev === m ? 'none' : m))}
              disabled={disabled}
              className={`h-11 w-14 rounded-xl text-xl font-bold transition-all disabled:opacity-40 ${
                mode === m
                  ? `${activeBg} scale-105 text-white shadow-md`
                  : 'bg-surface2 text-ink2 border border-line'
              }`}
            >
              {symbol}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {LETTERS.map(letter => {
          const isCorrect = revealing && correctLetter === letter;
          const isWrongPick = revealing && pickedLetter === letter && correctLetter !== letter;
          const tone = isCorrect
            ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
            : isWrongPick
            ? 'bg-red-600 text-white'
            : 'bg-brand text-white';
          return (
            <button
              key={letter}
              type="button"
              onClick={() => handle(letter)}
              disabled={disabled}
              className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl px-1 py-2.5 font-bold shadow-md transition-all active:scale-95 disabled:opacity-45 ${tone}`}
            >
              <span className="text-base leading-none">
                {style === 'en' ? letter : IT_NAMES[letter]}
                {suffix && <span className="ml-0.5 text-xs text-amber-200">{suffix}</span>}
              </span>
              {style === 'both' && <span className="mt-0.5 text-[10px] opacity-70">{letter}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
