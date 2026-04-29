import { CheckCircle, XCircle } from 'lucide-react';
import type { NoteEntry, AnswerState } from '../types';

interface ResultFeedbackProps {
  answerState: AnswerState;
  correctNote: NoteEntry | null;
}

export function ResultFeedback({ answerState, correctNote }: ResultFeedbackProps) {
  if (answerState === 'idle') return null;

  const isCorrect = answerState === 'correct';

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-lg transition-all ${
        isCorrect
          ? 'bg-green-900/60 border border-green-500 text-green-300'
          : 'bg-red-900/60 border border-red-500 text-red-300'
      }`}
    >
      {isCorrect ? (
        <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
      )}
      <span>
        {isCorrect
          ? 'Corretto!'
          : correctNote
          ? `Sbagliato! Era ${correctNote.displayName} (${correctNote.englishName})`
          : 'Sbagliato!'}
      </span>
    </div>
  );
}
