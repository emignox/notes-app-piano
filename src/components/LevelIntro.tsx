import { Volume2, Play } from 'lucide-react';
import type { NoteEntry } from '../types';
import { Staff } from './Staff';

interface LevelIntroProps {
  note: NoteEntry;
  levelNumber: number;
  onListen: () => void;
  onStart: () => void;
}

const CLEF_LABELS: Record<string, string> = {
  treble: 'Chiave di Violino',
  bass: 'Chiave di Basso',
};

export function LevelIntro({ note, levelNumber, onListen, onStart }: LevelIntroProps) {
  return (
    <div className="flex flex-col items-center gap-6 max-w-xl mx-auto p-6">
      <div className="text-center">
        <div className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-1">
          Livello {levelNumber + 1}
        </div>
        <h2 className="text-3xl font-bold text-white mb-1">
          Nuova nota: <span className="text-yellow-400">{note.displayName}</span>
        </h2>
        <p className="text-gray-400 text-base">{note.englishName} &mdash; {CLEF_LABELS[note.clef]}</p>
      </div>

      {/* Staff preview */}
      <div className="w-full">
        <Staff notes={[note]} currentIndex={0} results={['unanswered']} currentAnswerState="idle" />
      </div>

      {/* Description */}
      <div className="bg-gray-800/80 border border-gray-700 rounded-xl px-5 py-3 text-center">
        <p className="text-gray-300 text-sm leading-relaxed">{note.description}</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={onListen}
          className="flex items-center gap-2 px-6 py-3 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white rounded-xl font-semibold transition-all shadow-md"
        >
          <Volume2 className="w-5 h-5" />
          Ascolta
        </button>
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
        >
          <Play className="w-5 h-5" />
          Inizia Quiz
        </button>
      </div>
    </div>
  );
}
