import { useState } from 'react';

interface NoteNameButtonsProps {
  onSelect: (noteName: string) => void;
  disabled?: boolean;
}

type AccidentalMode = 'none' | 'sharp' | 'flat';

const NOTE_BUTTONS = [
  { it: 'Do', en: 'C' },
  { it: 'Re', en: 'D' },
  { it: 'Mi', en: 'E' },
  { it: 'Fa', en: 'F' },
  { it: 'Sol', en: 'G' },
  { it: 'La', en: 'A' },
  { it: 'Si', en: 'B' },
];

export function NoteNameButtons({ onSelect, disabled = false }: NoteNameButtonsProps) {
  const [accidentalMode, setAccidentalMode] = useState<AccidentalMode>('none');

  const handleNoteClick = (en: string) => {
    let noteName = en;
    if (accidentalMode === 'sharp') noteName += '#';
    else if (accidentalMode === 'flat') noteName += 'b';
    onSelect(noteName);
    setAccidentalMode('none'); // auto-reset after selection
  };

  const toggleAcc = (mode: AccidentalMode) =>
    setAccidentalMode(prev => (prev === mode ? 'none' : mode));

  return (
    <div className="flex flex-col gap-2.5">
      {/* Accidental toggles */}
      <div className="flex gap-2 justify-center">
        {([['flat', '♭', 'bg-blue-600', 'text-blue-100'], ['none', '♮', 'bg-slate-600', 'text-slate-200'], ['sharp', '♯', 'bg-orange-600', 'text-orange-100']] as const).map(([mode, symbol, activeBg]) => (
          <button
            key={mode}
            onClick={() => toggleAcc(mode)}
            disabled={disabled}
            className={`w-11 h-10 rounded-lg font-bold text-xl transition-all shadow-sm disabled:opacity-40 ${
              accidentalMode === mode
                ? `${activeBg} text-white scale-105 shadow-md`
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {symbol}
          </button>
        ))}
      </div>

      {/* Note name buttons — 4 cols on mobile, 7 on wider */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {NOTE_BUTTONS.map(({ it, en }) => {
          const suffix = accidentalMode === 'sharp' ? '♯' : accidentalMode === 'flat' ? '♭' : '';
          return (
            <button
              key={en}
              onClick={() => handleNoteClick(en)}
              disabled={disabled}
              className="py-3 px-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 active:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md disabled:opacity-40"
            >
              {it}
              {suffix && <span className="text-yellow-300 text-xs ml-0.5">{suffix}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
