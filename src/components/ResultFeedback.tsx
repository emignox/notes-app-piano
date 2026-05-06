import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import type { NoteEntry, AnswerState } from '../types';

interface ResultFeedbackProps {
  answerState: AnswerState;
  correctNote: NoteEntry | null;
  onContinue?: () => void;
}

export function ResultFeedback({ answerState, correctNote, onContinue }: ResultFeedbackProps) {
  const isCorrect = answerState === 'correct';
  const visible = answerState !== 'idle';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-base border transition-all duration-150 ${
        visible
          ? isCorrect
            ? 'bg-green-900/60 border-green-500 text-green-300 opacity-100 translate-y-0'
            : 'bg-red-900/60 border-red-500 text-red-300 opacity-100 translate-y-0'
          : 'opacity-0 border-transparent pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      {isCorrect ? (
        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      )}
      <span className="flex-1">
        {isCorrect
          ? 'Corretto!'
          : correctNote
          ? `Era ${correctNote.displayName} (${correctNote.englishName})`
          : 'Sbagliato!'}
      </span>
      {!isCorrect && onContinue && (
        <button
          onClick={onContinue}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white rounded-lg text-sm font-bold transition-all flex-shrink-0"
        >
          Continua
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
