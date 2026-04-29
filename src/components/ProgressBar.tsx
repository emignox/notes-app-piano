import { TOTAL_LEVELS } from '../data/curriculum';

interface ProgressBarProps {
  currentLevel: number;
  learnedNoteNames: string[];
}

export function ProgressBar({ currentLevel, learnedNoteNames }: ProgressBarProps) {
  const pct = Math.round(((currentLevel + 1) / TOTAL_LEVELS) * 100);

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-300">
          Livello {currentLevel + 1} / {TOTAL_LEVELS}
        </span>
        <span className="text-sm text-indigo-400 font-bold">{pct}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 mb-1">Note imparate:</div>
      <div className="flex flex-wrap gap-1">
        {learnedNoteNames.map((name, i) => (
          <span
            key={i}
            className="bg-indigo-900/70 border border-indigo-600 text-indigo-300 text-xs px-2 py-0.5 rounded-full font-medium"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
