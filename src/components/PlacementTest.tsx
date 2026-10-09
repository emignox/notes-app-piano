// ─────────────────────────────────────────────────────────────────────────────
// Punto di partenza: si misura LEGGENDO, non chiedendo.
//
// La versione di prima faceva cinque domande di teoria (accordi, battute) e da
// lì decideva quante note da leggere sbloccare: con 5/5 se ne aprivano 18 senza
// averne mai letta una. Qui si leggono note vere, un gruppo alla volta — chiave
// di violino, chiave di basso, alterazioni — e ci si ferma al primo che non
// regge. Le risposte non vanno perse: entrano nel ripasso spaziato, così chi
// sa già una nota non riparte da zero e chi l'ha sbagliata la rivede presto.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';
import type { AnswerState, NoteEntry } from '../types';
import { curriculum, stages } from '../data/curriculum';
import { samePitchClass } from '../lib/notes';
import { haptics } from '../lib/haptics';
import { Btn, Card, Panel, Pill } from './ui';
import { Staff } from './Staff';
import { NoteNameButtons } from './NoteNameButtons';

export interface PlacementAnswer {
  noteId: string;
  correct: boolean;
  ms: number;
}

interface Group {
  stageId: string;
  title: string;
  /** Note da cui pescare: riferimenti e note "di mezzo", che sono le difficili. */
  pool: { note: string; clef: 'treble' | 'bass' }[];
  ask: number;
}

const GROUPS: Group[] = [
  {
    stageId: 'treble-core',
    title: 'Chiave di violino',
    pool: ['E4', 'G4', 'A4', 'C5', 'D5', 'F5', 'B4'].map(note => ({ note, clef: 'treble' as const })),
    ask: 5,
  },
  {
    stageId: 'bass-core',
    title: 'Chiave di basso',
    pool: ['G2', 'B2', 'D3', 'F3', 'A3', 'E3', 'C3'].map(note => ({ note, clef: 'bass' as const })),
    ask: 5,
  },
  {
    stageId: 'flats',
    title: 'Diesis e bemolle',
    pool: ['F#4', 'Bb4', 'C#4', 'Eb4', 'G#4'].map(note => ({ note, clef: 'treble' as const })),
    ask: 3,
  },
];

/** Un gruppo è "saputo" se quasi tutte giuste e senza contare a lungo. */
const PASS_RATIO = 0.8;
const PASS_MEDIAN_MS = 6000;

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function entryOf(note: string, clef: 'treble' | 'bass'): NoteEntry | undefined {
  return curriculum.find(n => n.englishName === note && n.clef === clef);
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[s.length >> 1] : 0;
};

/** Fino a dove si sblocca il percorso se i primi `passed` gruppi sono saputi. */
function unlockFor(passed: number): number {
  if (passed === 0) return 1;
  const stage = stages.find(s => s.id === GROUPS[passed - 1].stageId);
  return stage ? stage.to + 1 : 1;
}

export function PlacementTest({ onComplete }: { onComplete: (unlockedCount: number, answers: PlacementAnswer[]) => void }) {
  const [phase, setPhase] = useState<'ask' | 'test' | 'result'>('ask');
  const [groupIdx, setGroupIdx] = useState(0);
  const [pos, setPos] = useState(0);
  const [state, setState] = useState<AnswerState>('idle');
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [passed, setPassed] = useState(0);
  const askedAt = useRef(0);

  const questions = useMemo(
    () => GROUPS.map(g => shuffle(g.pool).slice(0, g.ask).map(p => entryOf(p.note, p.clef)).filter((n): n is NoteEntry => !!n)),
    [],
  );
  const group = GROUPS[groupIdx];
  const current = questions[groupIdx]?.[pos];

  const startTest = () => {
    setPhase('test');
    askedAt.current = performance.now();
  };

  const answer = useCallback(
    (given: string | null) => {
      if (!current || state !== 'idle') return;
      const ms = performance.now() - askedAt.current;
      const correct = given !== null && samePitchClass(given, current.englishName);
      if (correct) haptics.correct(); else haptics.wrong();
      setState(correct ? 'correct' : 'wrong');
      setPicked(given);
      const all = [...answers, { noteId: current.id, correct, ms }];
      setAnswers(all);

      setTimeout(() => {
        setState('idle');
        setPicked(null);
        askedAt.current = performance.now();
        if (pos + 1 < questions[groupIdx].length) {
          setPos(pos + 1);
          return;
        }
        // Fine del gruppo: si prosegue solo se regge.
        const ids = new Set(questions[groupIdx].map(n => n.id));
        const mine = all.filter(a => ids.has(a.noteId));
        const ok = mine.filter(a => a.correct).length / mine.length >= PASS_RATIO;
        const fluent = median(mine.filter(a => a.correct).map(a => a.ms)) <= PASS_MEDIAN_MS;
        if (ok && fluent) {
          setPassed(groupIdx + 1);
          if (groupIdx + 1 < GROUPS.length) {
            setGroupIdx(groupIdx + 1);
            setPos(0);
            return;
          }
        }
        setPhase('result');
      }, correct ? 350 : 900);
    },
    [current, state, answers, pos, questions, groupIdx],
  );

  if (phase === 'ask') {
    return (
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-brand/25 via-brand/10 to-transparent p-5">
          <Pill tone="brand"><GraduationCap className="h-3.5 w-3.5" /> punto di partenza</Pill>
          <h2 className="mt-4 text-xl font-black leading-tight text-ink">Sai già leggere le note sul pentagramma?</h2>
          <p className="mt-2 text-sm text-ink2">
            Se sì, leggine qualcuna: in un minuto capiamo da dove partire, senza farti ripetere quello che sai.
          </p>
        </div>
        <div className="space-y-2 p-4">
          <Btn full onClick={startTest}>
            Un po' sì, mettimi alla prova
            <ArrowRight className="h-4 w-4" />
          </Btn>
          <Btn full variant="soft" onClick={() => onComplete(1, [])}>
            No, parto da zero
          </Btn>
        </div>
      </Card>
    );
  }

  if (phase === 'result') {
    const unlocked = unlockFor(passed);
    const right = answers.filter(a => a.correct).length;
    const message =
      passed === 0
        ? 'Partiamo dalle fondamenta: una nota alla volta, dalla chiave di violino. Le note che hai già letto bene torneranno solo al momento giusto.'
        : passed === GROUPS.length
          ? 'Leggi già entrambe le chiavi e le alterazioni. Si riparte dalle linee aggiuntive: il ripasso terrà vive le altre.'
          : `${GROUPS.slice(0, passed).map(g => g.title).join(' e ')}: ok. Si riparte da ${GROUPS[passed].title.toLowerCase()}.`;
    return (
      <Card className="anim-up flex flex-col gap-4 text-center">
        <div className="text-5xl">{passed === 0 ? '🌱' : passed === GROUPS.length ? '🎓' : '🎼'}</div>
        <div>
          <h2 className="text-xl font-black text-ink">Il tuo punto di partenza</h2>
          <p className="mt-1 text-sm text-ink2">{right}/{answers.length} note lette giuste</p>
        </div>
        <Panel className="px-4 py-3 text-left text-sm leading-relaxed text-ink2">{message}</Panel>
        <Btn full onClick={() => onComplete(unlocked, answers)}>
          Inizia a studiare
          <ArrowRight className="h-4 w-4" />
        </Btn>
      </Card>
    );
  }

  if (!current) return null;
  const done = questions.slice(0, groupIdx).reduce((n, q) => n + q.length, 0) + pos;
  const total = questions.reduce((n, q) => n + q.length, 0);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Pill tone="brand">{group.title}</Pill>
        <span className="text-xs font-bold tabular-nums text-ink3">{done + 1}/{total}</span>
      </div>
      <Staff entries={[current]} activeIndex={0} answerState={state} variant="focus" />
      <Panel className="p-2.5">
        <p className="mb-2 px-1 text-[11px] text-ink3">che nota è?</p>
        <NoteNameButtons
          onSelect={answer}
          disabled={state !== 'idle'}
          showAccidentals={group.stageId === 'flats'}
          correct={state !== 'idle' ? current.englishName : null}
          picked={picked}
        />
      </Panel>
      <button
        type="button"
        onClick={() => answer(null)}
        disabled={state !== 'idle'}
        className="self-center text-xs font-semibold text-ink3 underline decoration-dotted underline-offset-4"
      >
        Non lo so
      </button>
    </Card>
  );
}
