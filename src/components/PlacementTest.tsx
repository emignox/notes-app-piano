import { useState } from 'react';
import { ArrowRight, Check, GraduationCap } from 'lucide-react';
import { Btn, Card, Pill } from './ui';

const QUESTIONS = [
  { q: 'Quale nota si trova sulla prima linea della chiave di violino?', answers: ['Mi', 'Sol', 'Do'], correct: 0 },
  { q: 'Quante semiminime entrano in una battuta di 4/4?', answers: ['2', '3', '4'], correct: 2 },
  { q: 'Da Do a Sol che intervallo c’è?', answers: ['Terza', 'Quarta', 'Quinta'], correct: 2 },
  { q: 'Quale alterazione ha Sol maggiore?', answers: ['Fa♯', 'Si♭', 'Do♯'], correct: 0 },
  { q: 'Quali note formano l’accordo di Do maggiore?', answers: ['Do–Mi–Sol', 'Do–Fa–La', 'Do–Mi♭–Sol'], correct: 0 },
] as const;

export function PlacementTest({ onComplete }: { onComplete: (score: number) => void }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const current = QUESTIONS[index];

  const next = () => {
    const finalScore = score + (picked === current.correct ? 1 : 0);
    if (index === QUESTIONS.length - 1) onComplete(finalScore);
    else {
      setScore(finalScore);
      setIndex(i => i + 1);
      setPicked(null);
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-gradient-to-br from-brand/25 via-brand/10 to-transparent p-5">
        <div className="mb-4 flex items-center justify-between">
          <Pill tone="brand"><GraduationCap className="h-3.5 w-3.5" /> punto di partenza</Pill>
          <span className="text-xs font-bold tabular-nums text-ink3">{index + 1}/{QUESTIONS.length}</span>
        </div>
        <h2 className="text-xl font-black leading-tight text-ink">{current.q}</h2>
        <p className="mt-2 text-xs text-ink2">Non è un esame: serve solo a non farti ripetere cose che sai già.</p>
      </div>
      <div className="space-y-2 p-4">
        {current.answers.map((answer, i) => (
          <button
            key={answer}
            type="button"
            onClick={() => setPicked(i)}
            className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-bold transition-all ${
              picked === i ? 'border-brand bg-brand/15 text-brand' : 'border-line bg-surface2 text-ink'
            }`}
          >
            {answer}
            {picked === i && <Check className="h-4 w-4" />}
          </button>
        ))}
        <Btn full disabled={picked === null} onClick={next} className="mt-3">
          {index === QUESTIONS.length - 1 ? 'Scopri il tuo percorso' : 'Continua'}
          <ArrowRight className="h-4 w-4" />
        </Btn>
      </div>
    </Card>
  );
}
