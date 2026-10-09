// ─────────────────────────────────────────────────────────────────────────────
// Studio: il percorso teorico.
//
//   LEZIONE  →  ESERCIZI  →  fatto
//   capisci     provi        e torna nel ripasso
//
// L'ordine non è decorativo. Spiegare prima e far esercitare poi costa molta
// meno fatica del contrario, e gli esercizi qui non chiedono di ricordare a
// memoria: chiedono di APPLICARE la formula appena letta.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight, Music, RotateCcw, Volume2 } from 'lucide-react';
import type { Exercise, Lesson, Module } from '../data/lessons';
import { allLessons, modules } from '../data/lessons';
import type { AudioApi } from '../hooks/useAudio';
import type { ProgressApi } from '../hooks/useProgress';
import type { ConfirmedNote, LiveNote } from '../hooks/usePitchDetection';
import {
  CHORDS,
  MODES,
  OTHER_EXPLAIN,
  SCALE_EXPLAIN,
  buildChord,
  buildMode,
  buildOtherScale,
  buildScale,
  chordSymbol,
  invert,
} from '../lib/harmony';
import type { ChordQuality } from '../lib/harmony';
import { keyInfo, signatureText, diatonicChords } from '../lib/keys';
import { METERS, VALUES, valueById, dotted } from '../lib/rhythm';
import { diatonicOf, englishOf, isOnLine, italianOf, landmarkHint, midiOf, noteEntry, parseNote, samePitchClass } from '../lib/notes';
import { haptics } from '../lib/haptics';
import { Bar, Btn, Card, Panel, Pill, Segmented, SectionTitle } from './ui';
import { useScrollTop } from '../hooks/useScrollTop';
import type { Notify } from './ui';
import type { Intent, Navigate } from './Shell';
import { pieceById } from '../data/pieces';
import { BlockView } from './LessonBlocks';
import { ChordStaff } from './ChordStaff';
import { PianoKeyboard } from './PianoKeyboard';
import { NoteKeyboard } from './NoteKeyboard';
import { NoteNameButtons } from './NoteNameButtons';
import { Staff } from './Staff';
import { RichText } from './RichText';
import { glossario } from '../data/glossario';
import { useGlossario } from '../hooks/useGlossario';
import { TechniqueView } from './TechniqueView';
import { RhythmTrainer } from './RhythmTrainer';
import { EarTrainer } from './EarTrainer';

interface MicApi {
  isListening: boolean;
  liveNote: LiveNote | null;
  level: number;
  confirmedNote: ConfirmedNote | null;
  suppress: (ms?: number) => void;
}

interface StudyViewProps {
  progress: ProgressApi;
  audio: AudioApi;
  mic: MicApi;
  notify: Notify;
  /** Arrivando dal piano di oggi: la lezione, il ripasso o il ritmo da aprire. */
  intent?: Intent | null;
  onNavigate: Navigate;
}

type Section = 'lezioni' | 'tecnica' | 'ritmo' | 'orecchio' | 'glossario';

const XP_PER_LESSON = 40;

// ── Esercizi ────────────────────────────────────────────────────────────────

interface Choice {
  label: string;
  correct: boolean;
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const INTERVAL_NAMES: Record<number, string> = {
  1: 'seconda minore (1 semitono)',
  2: 'seconda maggiore (2)',
  3: 'terza minore (3)',
  4: 'terza maggiore (4)',
  5: 'quarta giusta (5)',
  6: 'tritono (6)',
  7: 'quinta giusta (7)',
  8: 'sesta minore (8)',
  9: 'sesta maggiore (9)',
  10: 'settima minore (10)',
  11: 'settima maggiore (11)',
  12: 'ottava (12)',
};

/** Nomi degli intervalli contati sul pentagramma (lettere, non semitoni). */
const GENERIC_INTERVALS = ['unisono', 'seconda', 'terza', 'quarta', 'quinta', 'sesta', 'settima', 'ottava'];

interface Question {
  prompt: string;
  choices: Choice[];
  play?: string[];
  together?: boolean;
  /** Note da mostrare sul pentagramma, con la loro chiave. */
  show?: { notes: string[]; clef: 'treble' | 'bass' };
  /** Spiegazione da leggere dopo la risposta. */
  explain?: string;
}

/** Domanda a risposta multipla, oppure null se l'esercizio è da suonare. */
function questionOf(ex: Exercise): Question | null {
  switch (ex.kind) {
    case 'quiz': {
      const notes = ex.notes ?? [];
      return {
        prompt: ex.prompt,
        choices: shuffle(ex.answers.map((label, i) => ({ label, correct: i === 0 }))),
        play: ex.listen,
        together: ex.together,
        show: notes.length ? { notes, clef: notes.every(n => midiOf(n) < 60) ? 'bass' : 'treble' } : undefined,
        explain: ex.explain,
      };
    }
    case 'read-interval': {
      const size = Math.abs(diatonicOf(ex.to) - diatonicOf(ex.from));
      const near = [size - 2, size - 1, size + 1, size + 2].filter(n => n >= 1 && n <= 7);
      return {
        prompt: 'Che intervallo c\'è fra le due note? Conta righe e spazi, non i tasti.',
        choices: shuffle([
          { label: GENERIC_INTERVALS[size], correct: true },
          ...shuffle(near).slice(0, 3).map(n => ({ label: GENERIC_INTERVALS[n], correct: false })),
        ]),
        play: [ex.from, ex.to],
        show: { notes: [ex.from, ex.to], clef: ex.clef },
        explain: size === 1
          ? 'Grado congiunto: da una linea allo spazio subito accanto (o viceversa).'
          : size % 2 === 0
            ? `Le due note stanno ${isOnLine(ex.from, ex.clef) ? 'entrambe su una linea' : 'entrambe in uno spazio'}: terze, quinte e settime si riconoscono così.`
            : `Una nota su una linea e l'altra in uno spazio: seconde, quarte, seste e ottave si riconoscono così.`,
      };
    }
    case 'ear-scale': {
      const right = ex.options[Math.floor(Math.random() * ex.options.length)];
      return {
        prompt: 'Che scala hai sentito?',
        play: buildScale(ex.root, right),
        choices: shuffle(ex.options.map(o => ({ label: o, correct: o === right }))),
        explain: SCALE_EXPLAIN[right],
      };
    }
    case 'name-chord': {
      const rootKey = `${parseNote(ex.root).letter}${parseNote(ex.root).acc}4`;
      const base = chordSymbol(rootKey, ex.quality);
      const chord = buildChord(rootKey, ex.quality);
      const inv = ex.inversion ?? 0;
      /** "C" in fondamentale, "C/E" quando al basso c'è un'altra nota. */
      const withBass = (i: number) => (i === 0 ? base : `${base}/${englishOf(invert(chord, i)[0])}`);

      // Se il pentagramma mostra un rivolto, la domanda è QUALE rivolto: le
      // risposte sbagliate devono essere le altre posizioni dello stesso
      // accordo, altrimenti si indovina guardando solo la qualità.
      if (inv > 0) {
        return {
          prompt: 'Che accordo è, e che nota ha al basso?',
          choices: shuffle([
            { label: withBass(inv), correct: true },
            ...chord.map((_, i) => i).filter(i => i !== inv).map(i => ({ label: withBass(i), correct: false })),
          ]),
        };
      }

      const others = shuffle((Object.keys(CHORDS) as ChordQuality[]).filter(q => q !== ex.quality))
        .slice(0, 3)
        .map(q => chordSymbol(rootKey, q));
      return {
        prompt: 'Che accordo è?',
        choices: shuffle([
          { label: base, correct: true },
          ...others.map(l => ({ label: l, correct: false })),
        ]),
      };
    }
    case 'ear-interval': {
      const right = ex.semitones[Math.floor(Math.random() * ex.semitones.length)];
      return {
        prompt: 'Che intervallo hai sentito?',
        play: [ex.from, transpose(ex.from, right)],
        choices: shuffle(
          ex.semitones.map(s => ({ label: INTERVAL_NAMES[s] ?? `${s} semitoni`, correct: s === right })),
        ),
      };
    }
    case 'ear-chord': {
      const right = ex.options[Math.floor(Math.random() * ex.options.length)];
      return {
        prompt: 'Che accordo hai sentito?',
        play: buildChord(ex.root, right),
        together: true,
        choices: shuffle(ex.options.map(q => ({ label: q, correct: q === right }))),
      };
    }
    case 'value-name': {
      const v = valueById(ex.id);
      return {
        // Solo la prima frase: il resto della descrizione è un commento
        // didattico ("è il battito…") che qui suonerebbe fuori posto.
        prompt: `Quale figura si disegna così: ${v.drawing.split('.')[0].toLowerCase()}?`,
        choices: shuffle(VALUES.map(x => ({ label: x.name, correct: x.id === v.id }))),
      };
    }
    case 'value-beats': {
      const v = valueById(ex.id);
      const beats = dotted(v.beats, ex.dots ?? 0);
      // Le durate non intere si dicono a parole: "un movimento e mezzo", non "1.5".
      const label = (n: number) => {
        if (n === 0.25) return 'un quarto di movimento';
        if (n === 0.5) return 'mezzo movimento';
        if (n === 0.75) return 'tre quarti di movimento';
        if (n === 1) return '1 movimento';
        if (n === 1.5) return '1 movimento e mezzo';
        return Number.isInteger(n) ? `${n} movimenti` : `${Math.floor(n)} movimenti e mezzo`;
      };
      return {
        prompt: `Quanto vale una ${v.name.toLowerCase()}${ex.dots ? ' puntata' : ''}?`,
        choices: shuffle(
          [beats, beats * 2, beats / 2, beats + 1]
            .filter((n, i, a) => a.indexOf(n) === i)
            .slice(0, 4)
            .map(n => ({ label: label(n), correct: n === beats })),
        ),
      };
    }
    case 'key-signature': {
      const info = keyInfo(ex.tonic);
      const right = signatureText(info);
      const wrong = ['C', 'G', 'D', 'A', 'F', 'Bb', 'Eb']
        .filter(t => t !== ex.tonic)
        .map(t => signatureText(keyInfo(t)))
        .filter(s => s !== right);
      return {
        prompt: `Che armatura ha ${italianOf(ex.tonic)} maggiore?`,
        choices: shuffle([
          { label: right, correct: true },
          ...shuffle(wrong).slice(0, 3).map(l => ({ label: l, correct: false })),
        ]),
      };
    }
    case 'degree': {
      const chords = diatonicChords(ex.tonic, 'maggiore');
      const right = chords[ex.degree - 1];
      // La risposta giusta si mette PRIMA e poi si mescola: pescando quattro
      // gradi a caso capitava di proporre una domanda senza risposta giusta.
      const wrong = shuffle(chords.filter(c => c.degree !== ex.degree))
        .slice(0, 3)
        .map(c => ({ label: chordSymbol(`${c.root}4`, c.quality), correct: false }));
      return {
        prompt: `In ${italianOf(ex.tonic)} maggiore, qual è il grado ${right.roman}?`,
        choices: shuffle([
          { label: chordSymbol(`${right.root}4`, right.quality), correct: true },
          ...wrong,
        ]),
      };
    }
    default:
      return null;
  }
}

function transpose(note: string, semitones: number): string {
  const { letter, acc, octave } = parseNote(note);
  const SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = (octave + 1) * 12 + SEMI[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0) + semitones;
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

/** Le note che un esercizio "da suonare" richiede, in ordine. */
function notesToPlay(ex: Exercise): string[] | null {
  switch (ex.kind) {
    case 'build-chord':
      return buildChord(ex.root, ex.quality);
    case 'build-scale':
      return buildScale(ex.root, ex.type);
    case 'build-mode':
      return buildMode(ex.root, ex.mode);
    case 'build-other':
      return buildOtherScale(ex.root, ex.scale);
    default:
      return null;
  }
}

function exerciseTitle(ex: Exercise): string {
  switch (ex.kind) {
    case 'build-chord':
      return `Suona ${chordSymbol(ex.root, ex.quality)} — ${italianOf(ex.root)} ${ex.quality}`;
    case 'build-scale':
      return `Suona la scala di ${italianOf(ex.root)} ${ex.type}`;
    case 'build-mode':
      return `Suona ${italianOf(ex.root)} ${ex.mode}`;
    case 'build-other':
      return `Suona la ${ex.scale} di ${italianOf(ex.root)}`;
    default:
      return 'Esercizio';
  }
}

function ExerciseCard({
  ex,
  audio,
  mic,
  onDone,
}: {
  ex: Exercise;
  audio: AudioApi;
  mic: MicApi;
  onDone: (correct: boolean) => void;
}) {
  const question = useMemo(() => questionOf(ex), [ex]);
  const sequence = useMemo(() => notesToPlay(ex), [ex]);
  const [picked, setPicked] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  // Errori sulla nota da trovare adesso: decidono quanto aiuto mostrare.
  const [stepMistakes, setStepMistakes] = useState(0);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const mistakesRef = useRef(0);
  const [helped, setHelped] = useState(false);
  const micBaseRef = useRef(mic.confirmedNote?.id ?? 0);

  const play = useCallback(() => {
    if (!question?.play) return;
    mic.suppress(2600);
    if (question.together) audio.playChord(question.play, 1.8);
    else audio.playSequence(question.play.map(n => ({ toneNote: n, durationSec: 0.6 })));
  }, [question, audio, mic]);

  /**
   * Una nota dell'esercizio da suonare. Prima si prova senza aiuti: costruire
   * l'accordo è l'esercizio. Dopo un errore compare il nome della nota, dopo
   * due anche il tasto. Un solo errore basta perché l'esercizio torni nel
   * ripasso: "alla fine ci sono arrivato" non è ancora saperlo.
   */
  const pressNote = useCallback(
    (n: string, fromMic: boolean) => {
      if (!sequence || step >= sequence.length) return;
      const target = sequence[step];
      if (samePitchClass(n, target)) {
        haptics.correct();
        if (!fromMic) audio.playNote(n, 0.7);
        const next = step + 1;
        setStep(next);
        setStepMistakes(0);
        setWrongKey(null);
        if (next >= sequence.length) setTimeout(() => onDone(mistakesRef.current === 0), 500);
      } else {
        haptics.wrong();
        mistakesRef.current += 1;
        setHelped(true);
        setStepMistakes(m => m + 1);
        setWrongKey(n);
      }
    },
    [sequence, step, audio, onDone],
  );

  // Col microfono acceso si suona sul piano vero, una nota alla volta.
  useEffect(() => {
    if (!sequence || !mic.isListening || !mic.confirmedNote) return;
    if (mic.confirmedNote.id <= micBaseRef.current) return;
    micBaseRef.current = mic.confirmedNote.id;
    pressNote(`${mic.confirmedNote.note.name}${mic.confirmedNote.note.octave}`, true);
  }, [mic.confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Esercizio da suonare ──
  if (sequence) {
    const target = sequence[step];
    const octaves = sequence.map(n => parseNote(n).octave);
    const done = step >= sequence.length;
    const found = sequence.slice(0, step);
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-ink">{exerciseTitle(ex)}</p>
        <Panel className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-ink3">
              {done ? 'completo' : `nota ${step + 1} di ${sequence.length}`}
            </p>
            <p className="text-xl font-black text-ink">
              {done
                ? helped ? 'fatto' : 'giusto al primo colpo!'
                : stepMistakes > 0 ? italianOf(target) : found.length ? `${found.map(f => italianOf(f)).join(' · ')} · ?` : '?'}
            </p>
            {!done && stepMistakes === 0 && (
              <p className="text-[11px] text-ink3">ricavala dalla formula: niente aiuti al primo tentativo</p>
            )}
            {wrongKey && !done && (
              <p className="text-[11px] text-red-400">{italianOf(wrongKey)} no — riprova</p>
            )}
          </div>
          <Btn
            variant="soft"
            className="px-3 py-2"
            title="Ascolta com'è (vale come aiuto)"
            onClick={() => {
              if (step < sequence.length) {
                mistakesRef.current += 1;
                setHelped(true);
              }
              mic.suppress(Math.ceil(sequence.length * 500 + 800));
              audio.playSequence(sequence.map(n => ({ toneNote: n, durationSec: 0.45 })));
            }}
          >
            <Volume2 className="h-4 w-4" />
          </Btn>
        </Panel>
        <Panel className="p-2">
          <PianoKeyboard
            from={`C${Math.min(...octaves)}`}
            to={`B${Math.max(...octaves)}`}
            onPress={n => pressNote(n, false)}
            hint={done ? found : stepMistakes >= 2 ? [...found, target] : found}
            wrong={wrongKey}
            labels="c"
            compact
          />
        </Panel>
        <p className="text-center text-xs text-ink3">
          {mic.isListening ? 'Suonale sul piano una alla volta, oppure tocca i tasti' : 'Tocca i tasti nell\'ordine'}
        </p>
      </div>
    );
  }

  // ── Leggi la nota ──
  if (ex.kind === 'read-note') {
    const entry = noteEntry(ex.note, ex.clef);
    const state = picked === null ? 'idle' : samePitchClass(picked, ex.note) ? 'correct' : 'wrong';
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-ink">Che nota è?</p>
        <Staff entries={[entry]} activeIndex={0} answerState={state} variant="focus" />
        <Panel className="p-2.5">
          <NoteNameButtons
            onSelect={n => {
              if (picked !== null) return;
              const ok = samePitchClass(n, ex.note);
              setPicked(n);
              if (ok) { haptics.correct(); audio.playNote(ex.note, 0.9); mic.suppress(1400); }
              else haptics.wrong();
              setTimeout(() => onDone(ok), ok ? 700 : 1400);
            }}
            disabled={picked !== null}
            showAccidentals={!!parseNote(ex.note).acc}
            correct={picked !== null ? ex.note : null}
            picked={picked}
          />
        </Panel>
        {state === 'wrong' && (
          <p className="text-center text-xs text-ink3">{landmarkHint(ex.note, ex.clef)}</p>
        )}
      </div>
    );
  }

  if (!question) return null;

  // ── Esercizio a risposta multipla ──
  const chosen = question.choices.find(c => c.label === picked);
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-ink">{question.prompt}</p>

      {question.show && (
        <Staff
          entries={question.show.notes.map((n, i) => noteEntry(n, question.show!.clef, i))}
          activeIndex={-1}
          variant="sequence"
        />
      )}

      {ex.kind === 'name-chord' && (
        <>
          <ChordStaff notes={invert(buildChord(ex.root, ex.quality), ex.inversion ?? 0)} />
          {/* Mostrare i tasti non svela la risposta — il nome va comunque
              ricavato — e allena a riconoscere l'accordo sotto le dita. */}
          <NoteKeyboard notes={invert(buildChord(ex.root, ex.quality), ex.inversion ?? 0)} />
        </>
      )}

      {question.play && (
        <Btn variant="soft" onClick={play} className="w-full justify-center">
          <Volume2 className="h-4 w-4" />
          {picked ? 'Riascolta' : 'Ascolta'}
        </Btn>
      )}

      <div className="grid gap-2">
        {question.choices.map(c => {
          const isPicked = picked === c.label;
          const reveal = picked !== null;
          const tone = !reveal
            ? 'border-line bg-surface text-ink'
            : c.correct
            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
            : isPicked
            ? 'border-red-500/60 bg-red-500/10 text-red-400'
            : 'border-line bg-surface text-ink3';
          return (
            <button
              key={c.label}
              type="button"
              disabled={reveal}
              onClick={() => {
                setPicked(c.label);
                if (c.correct) haptics.correct();
                else haptics.wrong();
                // Giusta e senza niente da leggere: si va avanti da soli.
                // Altrimenti si resta qui finché non si è capito.
                if (c.correct && !question.explain) setTimeout(() => onDone(true), 700);
              }}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${tone}`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {chosen && (!chosen.correct || question.explain) && (
        <>
          <Panel className="px-3 py-2.5 text-xs leading-relaxed text-ink2">
            {!chosen.correct && <p className="font-semibold text-ink">La risposta giusta è evidenziata in verde.</p>}
            {question.explain && <p className={chosen.correct ? '' : 'mt-1'}><RichText text={question.explain} /></p>}
          </Panel>
          <Btn full onClick={() => onDone(chosen.correct)}>
            Continua
            <ChevronRight className="h-4 w-4" />
          </Btn>
        </>
      )}
    </div>
  );
}

// ── Lettore di lezione ──────────────────────────────────────────────────────

function LessonPlayer({
  lesson,
  progress,
  audio,
  mic,
  notify,
  onBack,
  onNavigate,
}: {
  lesson: Lesson;
  progress: ProgressApi;
  audio: AudioApi;
  mic: MicApi;
  notify: Notify;
  onBack: () => void;
  onNavigate: Navigate;
}) {
  const [phase, setPhase] = useState<'lettura' | 'esercizi' | 'fine'>('lettura');
  useScrollTop(lesson.id);
  const [exIndex, setExIndex] = useState(0);
  const [right, setRight] = useState(0);

  const finish = useCallback(
    (correct: number) => {
      setPhase('fine');
      const unlocked = progress.completeLesson(lesson.id, XP_PER_LESSON);
      unlocked.forEach(a => notify(a.emoji, a.title, a.desc));
      if (correct === lesson.exercises.length) audio.playSuccess();
    },
    [lesson, progress, notify, audio],
  );

  const onExerciseDone = useCallback(
    (correct: boolean) => {
      progress.recordTheory(`${lesson.id}#${exIndex}`, correct);
      const nextRight = right + (correct ? 1 : 0);
      setRight(nextRight);
      const next = exIndex + 1;
      if (next >= lesson.exercises.length) finish(nextRight);
      else setExIndex(next);
    },
    [progress, lesson, exIndex, right, finish],
  );

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="rounded-lg bg-surface2 p-2 text-ink2 active:scale-95">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{lesson.title}</p>
          <p className="text-xs text-ink3">{lesson.goal}</p>
        </div>
      </div>

      {phase === 'lettura' && (
        <>
          {lesson.prereq && (
            <Panel className="px-3 py-2 text-xs leading-snug text-ink3">
              <span className="font-semibold text-ink2">Prima di questa lezione:</span> {lesson.prereq}
            </Panel>
          )}
          <div className="space-y-3">
            {lesson.blocks.map((b, i) => (
              <BlockView key={i} block={b} audio={audio} suppressMic={mic.suppress} />
            ))}
          </div>
          <Btn onClick={() => { setPhase('esercizi'); window.scrollTo({ top: 0 }); }} className="w-full justify-center">
            Ho capito, provo
            <ChevronRight className="h-4 w-4" />
          </Btn>
        </>
      )}

      {phase === 'esercizi' && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tabular-nums text-ink3">
              {exIndex + 1}/{lesson.exercises.length}
            </span>
            <Bar pct={exIndex / lesson.exercises.length} className="flex-1" />
          </div>
          <ExerciseCard
            key={exIndex}
            ex={lesson.exercises[exIndex]}
            audio={audio}
            mic={mic}
            onDone={onExerciseDone}
          />
        </>
      )}

      {phase === 'fine' && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="text-5xl">{right === lesson.exercises.length ? '🏆' : '📘'}</div>
          <p className="text-xl font-black text-ink">Lezione completata</p>
          <p className="text-sm text-ink2">
            {right}/{lesson.exercises.length} esercizi giusti · +{XP_PER_LESSON} XP
          </p>
          {right < lesson.exercises.length && (
            <p className="max-w-xs text-xs text-ink3">
              Quelli sbagliati torneranno nel ripasso di teoria, finché non ti vengono al primo colpo.
            </p>
          )}
          {lesson.piece && pieceById(lesson.piece) && (
            <Btn full onClick={() => onNavigate('melody', { pieceId: lesson.piece })}>
              <Music className="h-4 w-4" />
              Ora il brano: {pieceById(lesson.piece)?.title}
            </Btn>
          )}
          <Btn variant={lesson.piece ? 'soft' : 'primary'} onClick={onBack} className="px-6">
            Torna alle lezioni
          </Btn>
        </div>
      )}
    </Card>
  );
}

// ── Glossario ───────────────────────────────────────────────────────────────

// Le dodici toniche nella scrittura che si usa DAVVERO: Mi♭ e non Re♯, La♭ e
// non Sol♯. Sono anche le uniche dodici che hanno un'armatura sensata: Re♯
// maggiore esisterebbe, ma con nove alterazioni (e due doppi diesis).
const ALL_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

function Glossary({ audio, mic }: { audio: AudioApi; mic: MicApi }) {
  const [tab, setTab] = useState<'accordi' | 'scale' | 'ritmo' | 'termini'>('accordi');
  const gloss = useGlossario();
  const [root, setRoot] = useState('C');
  // Quello che stai guardando ora: la tastiera lo segue.
  const [shown, setShown] = useState<{ notes: string[]; label: string } | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'accordi' as const, label: 'Accordi' },
          { value: 'scale' as const, label: 'Scale' },
          { value: 'ritmo' as const, label: 'Ritmo' },
          { value: 'termini' as const, label: 'Termini' },
        ]}
      />

      {tab !== 'ritmo' && (
        <Card>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-ink3">nota di partenza</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_ROOTS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRoot(r)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
                  root === r ? 'bg-brand text-white' : 'bg-surface2 text-ink2'
                }`}
              >
                {italianOf(r)}
              </button>
            ))}
          </div>
        </Card>
      )}

      {shown && tab !== 'ritmo' && (
        <Card>
          <NoteKeyboard notes={shown.notes} caption={shown.label} onPress={n => { audio.playNote(n); mic.suppress(1400); }} />
        </Card>
      )}

      {tab === 'accordi' && (
        <Card>
          <SectionTitle hint="tocca per vederlo sulla tastiera e ascoltarlo">Tutti gli accordi su {italianOf(root)}</SectionTitle>
          <div className="mt-2 space-y-2">
            {(Object.keys(CHORDS) as ChordQuality[]).map(q => {
              const notes = buildChord(`${root}4`, q);
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setShown({ notes, label: `${chordSymbol(`${root}4`, q)} · ${notes.map(n => italianOf(n)).join(' · ')}` });
                    mic.suppress(2200);
                    audio.playChord(notes, 1.6);
                  }}
                  className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-3 text-left active:scale-[0.99]"
                >
                  <span className="w-20 flex-shrink-0 text-sm font-black text-ink">
                    {chordSymbol(`${root}4`, q)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-ink2">{q} · {CHORDS[q].formula}</span>
                    <span className="block text-xs text-ink3">{notes.map(n => italianOf(n)).join(' · ')}</span>
                  </span>
                  <Volume2 className="h-4 w-4 flex-shrink-0 text-ink3" />
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'scale' && (
        <>
          <Card>
            <SectionTitle>Tonalità di {italianOf(root)}</SectionTitle>
            <p className="mt-1 text-sm text-ink2">
              Maggiore: {signatureText(keyInfo(root))} · relativa minore {italianOf(keyInfo(root).relative)}
            </p>
          </Card>
          <Card>
            <SectionTitle hint="tocca per ascoltare">Scale su {italianOf(root)}</SectionTitle>
            <div className="mt-2 space-y-2">
              {(Object.keys(SCALE_EXPLAIN) as (keyof typeof SCALE_EXPLAIN)[]).map(type => {
                const notes = buildScale(`${root}4`, type);
                return (
                  <ScaleRow key={type} name={type} notes={notes} audio={audio} mic={mic} onShow={setShown} />
                );
              })}
              {(Object.keys(OTHER_EXPLAIN) as (keyof typeof OTHER_EXPLAIN)[]).map(s => (
                <ScaleRow key={s} name={s} notes={buildOtherScale(`${root}4`, s)} audio={audio} mic={mic} onShow={setShown} />
              ))}
              {MODES.map(m => (
                <ScaleRow key={m.name} name={m.name} notes={buildMode(`${root}4`, m.name)} audio={audio} mic={mic} onShow={setShown} />
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'termini' && (
        <Card>
          <SectionTitle hint="tocca una voce per la spiegazione — le stesse parole sono toccabili dentro le lezioni">
            Dizionario dei termini
          </SectionTitle>
          <div className="mt-2 flex flex-col gap-1.5">
            {[...glossario].sort((a, b) => a.word.localeCompare(b.word, 'it')).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => gloss?.open(t.id)}
                className="rounded-xl border border-line bg-surface p-3 text-left active:scale-[0.99]"
              >
                <span className="block text-sm font-bold text-ink">{t.word}</span>
                <span className="mt-0.5 block text-xs leading-snug text-ink2">{t.short}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {tab === 'ritmo' && (
        <>
          <Card>
            <SectionTitle>Figure e pause</SectionTitle>
            <div className="mt-2 space-y-2">
              {VALUES.map(v => (
                <div key={v.id} className="rounded-xl border border-line bg-surface p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-ink">{v.name}</span>
                    <span className="text-xs text-ink3">{v.beats} {v.beats === 1 ? 'movimento' : 'movimenti'}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink2">{v.drawing}</p>
                  <p className="text-xs text-ink3">Pausa: {v.restDrawing}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle>Metri</SectionTitle>
            <div className="mt-2 space-y-2">
              {METERS.map(m => (
                <div key={m.id} className="rounded-xl border border-line bg-surface p-3">
                  <span className="text-sm font-black text-ink">{m.id}</span>
                  <p className="mt-0.5 text-xs text-ink2">{m.feel}</p>
                  <p className="text-xs text-ink3">Accenti: {m.accents}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function ScaleRow({
  name,
  notes,
  audio,
  mic,
  onShow,
}: {
  name: string;
  notes: string[];
  audio: AudioApi;
  mic: MicApi;
  onShow: (s: { notes: string[]; label: string }) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onShow({ notes, label: name });
        mic.suppress(Math.ceil(notes.length * 400 + 900));
        audio.playSequence(notes.map(n => ({ toneNote: n, durationSec: 0.35 })));
      }}
      className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-3 text-left active:scale-[0.99]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{name}</span>
        <span className="block text-xs text-ink3">{notes.map(n => italianOf(n)).join(' · ')}</span>
      </span>
      <Volume2 className="h-4 w-4 flex-shrink-0 text-ink3" />
    </button>
  );
}

// ── Ripasso della teoria ────────────────────────────────────────────────────

/**
 * Gli esercizi sbagliati nelle lezioni tornano qui, mescolati fra lezioni
 * diverse (riconoscere QUALE regola serve è metà dell'esercizio). Chi sbaglia
 * di nuovo rivede l'esercizio a fine giro, prima di chiudere.
 */
function TheoryReview({
  ids,
  progress,
  audio,
  mic,
  onBack,
}: {
  ids: string[];
  progress: ProgressApi;
  audio: AudioApi;
  mic: MicApi;
  onBack: () => void;
}) {
  useScrollTop('ripasso-teoria');
  const [queue, setQueue] = useState(() =>
    shuffle(ids)
      .map(id => {
        const [lessonId, idx] = id.split('#');
        const lesson = allLessons.find(l => l.id === lessonId);
        const ex = lesson?.exercises[Number(idx)];
        return lesson && ex ? { id, lesson, ex, retry: false } : null;
      })
      .filter((x): x is { id: string; lesson: Lesson; ex: Exercise; retry: boolean } => x !== null),
  );
  const [pos, setPos] = useState(0);
  const [right, setRight] = useState(0);
  const firstRound = useMemo(() => queue.filter(q => !q.retry).length, [queue]);

  const onDone = useCallback(
    (correct: boolean) => {
      const item = queue[pos];
      if (!item) return;
      progress.recordTheory(item.id, correct);
      if (correct && !item.retry) setRight(r => r + 1);
      if (!correct && !item.retry) setQueue(q => [...q, { ...item, retry: true }]);
      setPos(p => p + 1);
    },
    [queue, pos, progress],
  );

  const item = queue[pos];
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="rounded-lg bg-surface2 p-2 text-ink2 active:scale-95">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">Ripasso di teoria</p>
          <p className="truncate text-xs text-ink3">
            {item ? `dalla lezione: ${item.lesson.title}${item.retry ? ' · di nuovo' : ''}` : 'finito'}
          </p>
        </div>
      </div>
      {item ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tabular-nums text-ink3">{pos + 1}/{queue.length}</span>
            <Bar pct={pos / queue.length} className="flex-1" />
          </div>
          <ExerciseCard key={pos} ex={item.ex} audio={audio} mic={mic} onDone={onDone} />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="text-5xl">{right === firstRound ? '🏆' : '🔁'}</div>
          <p className="text-xl font-black text-ink">{right}/{firstRound} giusti al primo colpo</p>
          <p className="max-w-xs text-sm text-ink2">
            Quelli giusti torneranno fra qualche giorno, sempre più distanti, finché non escono dal ripasso.
            Quelli sbagliati tornano domani.
          </p>
          <Btn onClick={onBack} className="px-6">Torna alle lezioni</Btn>
        </div>
      )}
    </Card>
  );
}

// ── Elenco moduli ───────────────────────────────────────────────────────────

function ModuleCard({
  mod,
  done,
  onOpen,
}: {
  mod: Module;
  done: string[];
  onOpen: (l: Lesson) => void;
}) {
  const completed = mod.lessons.filter(l => done.includes(l.id)).length;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="text-3xl">{mod.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{mod.title}</p>
          <p className="text-xs leading-snug text-ink2">{mod.summary}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Bar pct={completed / mod.lessons.length} className="flex-1" />
            <span className="text-[11px] tabular-nums text-ink3">
              {completed}/{mod.lessons.length}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {mod.lessons.map((l, i) => {
          const isDone = done.includes(l.id);
          // La prima non fatta è quella consigliata: il percorso ha un ordine e
          // conviene dirlo, invece di lasciare scegliere a caso.
          const isNext = !isDone && mod.lessons.slice(0, i).every(p => done.includes(p.id));
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onOpen(l)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left active:scale-[0.99] ${
                isNext ? 'border-brand bg-brand/10' : 'border-line bg-surface'
              }`}
            >
              <span
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  isDone ? 'bg-emerald-500 text-white' : 'bg-surface2 text-ink3'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-bold text-ink">{l.title}</span>
                  {isNext && <Pill tone="brand">da qui</Pill>}
                </span>
                <span className="block text-xs leading-snug text-ink3">{l.goal}</span>
                {l.prereq && !isDone && (
                  <span className="mt-0.5 block text-[11px] leading-snug text-ink3">
                    prima serve: {l.prereq}
                  </span>
                )}
              </span>
              <span className="flex-shrink-0 text-[11px] text-ink3">{l.minutes}′</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function StudyView({ progress, audio, mic, notify, intent, onNavigate }: StudyViewProps) {
  const [section, setSection] = useState<Section>(intent?.rhythm ? 'ritmo' : intent?.ear ? 'orecchio' : 'lezioni');
  const [lesson, setLesson] = useState<Lesson | null>(
    () => (intent?.lessonId ? allLessons.find(l => l.id === intent.lessonId) ?? null : null),
  );
  const [reviewIds, setReviewIds] = useState<string[] | null>(() => (intent?.review ? progress.theoryDue : null));

  const done = progress.data.lessonsDone;
  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  const due = progress.theoryDue;

  if (reviewIds && reviewIds.length > 0) {
    return (
      <TheoryReview
        ids={reviewIds}
        progress={progress}
        audio={audio}
        mic={mic}
        onBack={() => setReviewIds(null)}
      />
    );
  }

  if (lesson) {
    return (
      <LessonPlayer
        lesson={lesson}
        progress={progress}
        audio={audio}
        mic={mic}
        notify={notify}
        onBack={() => setLesson(null)}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        value={section}
        onChange={setSection}
        options={[
          { value: 'lezioni' as const, label: 'Lezioni' },
          { value: 'tecnica' as const, label: 'Tecnica' },
          { value: 'ritmo' as const, label: 'Ritmo' },
          { value: 'orecchio' as const, label: 'Orecchio' },
          { value: 'glossario' as const, label: 'Termini' },
        ]}
      />

      {section === 'lezioni' && (
        <>
          <Card>
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 flex-shrink-0 text-brand" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">Teoria, dal perché</p>
                <p className="text-xs text-ink2">
                  Ogni lezione spiega, mostra sul pentagramma e sulla tastiera, fa sentire il suono e poi ti fa provare.
                </p>
              </div>
              <Pill tone="brand">{done.length}/{totalLessons}</Pill>
            </div>
          </Card>
          {due.length > 0 && (
            <Card className="border-amber-500/40">
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 flex-shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">Ripasso: {due.length} {due.length === 1 ? 'esercizio' : 'esercizi'}</p>
                  <p className="text-xs text-ink2">Quelli sbagliati nelle lezioni tornano finché non li sai al primo colpo.</p>
                </div>
              </div>
              <Btn full className="mt-3" onClick={() => setReviewIds(due)}>Ripassa ora</Btn>
            </Card>
          )}
          {modules.map(m => (
            <ModuleCard key={m.id} mod={m} done={done} onOpen={setLesson} />
          ))}
        </>
      )}

      {section === 'tecnica' && (
        <TechniqueView progress={progress} audio={audio} mic={mic} notify={notify} />
      )}

      {section === 'ritmo' && <RhythmTrainer audio={audio} progress={progress} mic={mic} notify={notify} />}

      {section === 'orecchio' && <EarTrainer audio={audio} progress={progress} mic={mic} notify={notify} />}

      {section === 'glossario' && <Glossary audio={audio} mic={mic} />}
    </div>
  );
}
