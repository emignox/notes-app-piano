// Presentazione di una nota nuova.
// Prima si CAPISCE (dove sta, a quale riferimento è agganciata, dov'è sul
// piano, come suona) e solo dopo si viene interrogati: presentare un esempio
// completo prima del test riduce di molto gli errori iniziali.

import { Play, Volume2 } from 'lucide-react';
import type { NoteEntry } from '../types';
import { describePosition, keyboardHint, landmarkHint } from '../lib/notes';
import { stageOf } from '../data/curriculum';
import { Btn, Card, Panel, Pill } from './ui';
import { Staff } from './Staff';
import { PianoKeyboard } from './PianoKeyboard';

interface NoteIntroProps {
  note: NoteEntry;
  level: number;
  total: number;
  keyFrom: string;
  keyTo: string;
  onListen: () => void;
  onStart: () => void;
}

export function NoteIntro({ note, level, total, keyFrom, keyTo, onListen, onStart }: NoteIntroProps) {
  const stage = stageOf(level);

  return (
    <Card className="anim-up flex flex-col items-center gap-4">
      <div className="text-center">
        <Pill tone="brand" className="mb-2">
          {stage.emoji} {stage.title} · nota {level + 1} di {total}
        </Pill>
        <h2 className="text-2xl font-black text-ink">
          Nuova nota: <span className="text-brand">{note.displayName}</span>
        </h2>
        <p className="mt-0.5 text-sm text-ink2">
          {note.englishName} · {note.clef === 'treble' ? 'chiave di violino' : 'chiave di basso'}
          {note.landmark && ' · nota di riferimento ⭐'}
        </p>
      </div>

      <Staff entries={[note]} activeIndex={0} variant="focus" />

      <Panel className="w-full space-y-2 px-4 py-3 text-sm leading-relaxed">
        <p className="font-semibold text-ink">📍 {landmarkHint(note.englishName, note.clef)}</p>
        <p className="text-ink2">Si scrive sulla {describePosition(note.englishName, note.clef)}.</p>
        <p className="text-ink2">🎹 Sul piano è {keyboardHint(note.englishName)}.</p>
        {note.mnemonic && <p className="text-ink3">💡 {note.mnemonic}</p>}
      </Panel>

      <div className="w-full">
        <p className="mb-1.5 text-center text-[11px] uppercase tracking-wider text-ink3">dove si trova</p>
        <PianoKeyboard
          from={keyFrom}
          to={keyTo}
          onPress={onListen}
          hint={[note.toneNote]}
          labels="c"
          compact
        />
      </div>

      <div className="flex w-full flex-wrap justify-center gap-3">
        <Btn variant="soft" onClick={onListen}>
          <Volume2 className="h-4 w-4" />
          Ascolta
        </Btn>
        <Btn onClick={onStart} className="px-7">
          <Play className="h-4 w-4" />
          Inizia
        </Btn>
      </div>
    </Card>
  );
}
