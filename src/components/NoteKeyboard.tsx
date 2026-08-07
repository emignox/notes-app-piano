// La tastiera che accompagna un esempio: accende i tasti della figura mostrata
// sul pentagramma.
//
// Serve perché leggere una nota e trovarla sotto le dita sono due cose diverse,
// e la seconda è quella che serve davanti al pianoforte. Ogni esempio dello
// Studio — accordo, scala, arpeggio, grado, progressione — passa di qui, così
// l'aspetto e il comportamento sono gli stessi ovunque.

import { useMemo } from 'react';
import { midiOf, parseNote } from '../lib/notes';
import { PianoKeyboard } from './PianoKeyboard';

/**
 * L'estensione da disegnare: ottave intere che contengono tutte le note.
 * Sotto le due ottave la tastiera resta comunque leggibile e si evita che una
 * sola nota faccia comparire un mezzo pianoforte.
 */
function rangeFor(notes: string[]): { from: string; to: string } {
  if (notes.length === 0) return { from: 'C4', to: 'B4' };
  const octaves = notes.map(n => parseNote(n).octave);
  // Le note scritte con doppie alterazioni possono "sforare" l'ottava scritta
  // (Si♯3 suona come Do4): si controlla anche l'altezza reale.
  const lowest = Math.min(...notes.map(midiOf));
  const highest = Math.max(...notes.map(midiOf));
  const from = Math.min(Math.min(...octaves), Math.floor(lowest / 12) - 1);
  const to = Math.max(Math.max(...octaves), Math.floor(highest / 12) - 1);
  return { from: `C${from}`, to: `B${to}` };
}

interface NoteKeyboardProps {
  /** Le note della figura: si accendono tutte. */
  notes: string[];
  /** Quella di turno, accesa più forte. */
  active?: string | null;
  /** Toccando un tasto: di solito lo si fa suonare. */
  onPress?: (note: string) => void;
  caption?: string;
}

export function NoteKeyboard({ notes, active = null, onPress, caption }: NoteKeyboardProps) {
  const { from, to } = useMemo(() => rangeFor(notes), [notes]);
  return (
    <div className="space-y-1">
      <div className="rounded-xl border border-line bg-surface2/60 p-2">
        <PianoKeyboard
          from={from}
          to={to}
          onPress={onPress ?? (() => {})}
          hint={notes}
          active={active}
          labels="c"
          disabled={!onPress}
          compact
        />
      </div>
      {caption && <p className="text-center text-[11px] text-ink3">{caption}</p>}
    </div>
  );
}
