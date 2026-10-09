// ─────────────────────────────────────────────────────────────────────────────
// Orecchio: sei allenamenti brevi, dieci domande per volta.
//
// Due cose li distinguono da un quiz:
//  · dopo un errore si possono sentire LA TUA risposta e QUELLA GIUSTA una
//    accanto all'altra: l'orecchio impara dalle differenze, non dai voti;
//  · il livello si regola da solo (8 giuste su 10 per salire), così si lavora
//    sempre sul confine di quello che si sa distinguere.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, RotateCcw, Volume2 } from 'lucide-react';
import type { AudioApi, TimelineEvent } from '../hooks/useAudio';
import type { ProgressApi } from '../hooks/useProgress';
import type { ConfirmedNote } from '../hooks/usePitchDetection';
import type { EarDrillId, EarQuestion, Sound } from '../lib/earTraining';
import { EAR_DRILLS, EAR_START, drillById, makeQuestion, soundLength } from '../lib/earTraining';
import { italianOf, parseNote, samePitchClass } from '../lib/notes';
import { haptics } from '../lib/haptics';
import { Bar, Btn, Card, Panel, Pill } from './ui';
import type { Notify } from './ui';
import { PianoKeyboard } from './PianoKeyboard';
import { RhythmStaff } from './RhythmStaff';

interface MicApi {
  isListening: boolean;
  confirmedNote: ConfirmedNote | null;
  suppress: (ms?: number) => void;
}

interface EarTrainerProps {
  progress: ProgressApi;
  audio: AudioApi;
  mic: MicApi;
  notify: Notify;
}

const SESSION = 10;
const RHYTHM_BPM = 80;

/** Fa sentire un suono dell'allenamento. */
function useSound(audio: AudioApi, mic: MicApi) {
  return useCallback(
    (sound: Sound) => {
      mic.suppress(Math.ceil(soundLength(sound, RHYTHM_BPM) * 1000));
      if (sound.kind === 'together') {
        audio.playChord(sound.notes, 1.8);
      } else if (sound.kind === 'melodic') {
        audio.playSequence(sound.notes.map(n => ({ toneNote: n, durationSec: sound.secs ?? 0.6 })));
      } else {
        // Una battuta di clic per sentire il tempo, poi la figura su un Sol.
        const beat = 60 / RHYTHM_BPM;
        const events: TimelineEvent[] = [];
        for (let b = 0; b < 8; b++) events.push({ at: b * beat, kind: b % 4 === 0 ? 'accent' : 'click' });
        let t = 4;
        for (const bar of sound.pattern) for (const item of bar) {
          if (!item.rest) events.push({ at: t * beat, kind: 'note', note: 'G4', dur: Math.max(0.1, item.beats * beat * 0.8) });
          t += item.beats;
        }
        audio.playTimeline(events);
      }
    },
    [audio, mic],
  );
}

// ── Una domanda ─────────────────────────────────────────────────────────────

function QuestionCard({
  q,
  audio,
  mic,
  onDone,
}: {
  q: EarQuestion;
  audio: AudioApi;
  mic: MicApi;
  onDone: (correct: boolean) => void;
}) {
  const play = useSound(audio, mic);
  const [picked, setPicked] = useState<number | null>(null);
  // Dettato melodico: quante note già trovate e quanti sbagli.
  const [found, setFound] = useState(1);
  const [misses, setMisses] = useState(0);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const micBase = useRef(mic.confirmedNote?.id ?? 0);

  // La domanda si sente subito: non si deve cercare il pulsante.
  useEffect(() => {
    const t = setTimeout(() => play(q.sound), 350);
    return () => clearTimeout(t);
  }, [q, play]);

  const answer = q.answer;
  const melodyDone = !!answer && (found >= answer.length || misses >= 3);

  const pressKey = useCallback(
    (n: string) => {
      if (!answer || melodyDone) return;
      const target = answer[found];
      if (samePitchClass(n, target)) {
        haptics.correct();
        setWrongKey(null);
        const next = found + 1;
        setFound(next);
        if (next >= answer.length) setTimeout(() => onDone(misses === 0), 900);
      } else {
        haptics.wrong();
        setWrongKey(n);
        const m = misses + 1;
        setMisses(m);
        if (m >= 3) play(q.sound);
      }
    },
    [answer, melodyDone, found, misses, onDone, play, q.sound],
  );

  useEffect(() => {
    if (!answer || !mic.isListening || !mic.confirmedNote) return;
    if (mic.confirmedNote.id <= micBase.current) return;
    micBase.current = mic.confirmedNote.id;
    pressKey(`${mic.confirmedNote.note.name}${mic.confirmedNote.note.octave}`);
  }, [mic.confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  const chosen = picked !== null ? q.choices[picked] : null;
  const right = q.choices.find(c => c.correct);

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-ink">{q.prompt}</p>
      <Btn variant="soft" full onClick={() => play(q.sound)}>
        <Volume2 className="h-4 w-4" />
        {picked !== null || melodyDone ? 'Riascolta' : 'Ascolta di nuovo'}
      </Btn>

      {/* Dettato melodico */}
      {answer && (
        <>
          <div className="flex flex-wrap justify-center gap-1.5">
            {answer.map((n, i) => (
              <span
                key={i}
                className={`min-w-11 rounded-lg border px-2 py-1.5 text-center text-sm font-bold ${
                  i < found
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                    : melodyDone
                      ? 'border-red-500/50 bg-red-500/10 text-red-400'
                      : 'border-line bg-surface2 text-ink3'
                }`}
              >
                {i < found || melodyDone ? italianOf(n) : '?'}
              </span>
            ))}
          </div>
          <Panel className="p-2">
            <PianoKeyboard
              from={`C${Math.min(...answer.map(n => parseNote(n).octave))}`}
              to={`B${Math.max(...answer.map(n => parseNote(n).octave))}`}
              onPress={n => { audio.playNote(n, 0.6); mic.suppress(900); pressKey(n); }}
              hint={answer.slice(0, Math.min(found, answer.length))}
              wrong={wrongKey}
              labels="c"
              compact
            />
          </Panel>
          {wrongKey && !melodyDone && (
            <p className="text-center text-xs text-red-400">{italianOf(wrongKey)} no: canticchia la frase e riprova</p>
          )}
          {melodyDone && found < answer.length && (
            <Btn full onClick={() => onDone(false)}>
              Continua
              <ChevronRight className="h-4 w-4" />
            </Btn>
          )}
        </>
      )}

      {/* Scelta multipla (con le figure, per il dettato ritmico) */}
      {!answer && (
        <div className={q.choices[0]?.pattern ? 'grid gap-2' : 'grid grid-cols-2 gap-2'}>
          {q.choices.map((c, i) => {
            const reveal = picked !== null;
            const tone = !reveal
              ? 'border-line bg-surface text-ink'
              : c.correct
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                : i === picked
                  ? 'border-red-500/60 bg-red-500/10 text-red-400'
                  : 'border-line bg-surface text-ink3';
            return (
              <button
                key={i}
                type="button"
                disabled={reveal}
                onClick={() => {
                  setPicked(i);
                  if (c.correct) {
                    haptics.correct();
                    setTimeout(() => onDone(true), 900);
                  } else haptics.wrong();
                }}
                className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-colors ${tone}`}
              >
                {c.pattern ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-center font-black">{c.label}</span>
                    <span className="min-w-0 flex-1"><RhythmStaff pattern={[c.pattern[0]]} /></span>
                  </span>
                ) : (
                  c.label
                )}
              </button>
            );
          })}
        </div>
      )}

      {chosen && !chosen.correct && (
        <>
          <Panel className="space-y-2 px-3 py-2.5">
            <p className="text-xs font-semibold text-ink">Confrontale: è la differenza che si impara.</p>
            <div className="grid grid-cols-2 gap-2">
              {chosen.sound && (
                <Btn variant="soft" className="px-2 py-2 text-xs" onClick={() => play(chosen.sound!)}>
                  <Play className="h-3.5 w-3.5" /> la tua
                </Btn>
              )}
              {right?.sound && (
                <Btn variant="soft" className="px-2 py-2 text-xs" onClick={() => play(right.sound!)}>
                  <Play className="h-3.5 w-3.5" /> la giusta
                </Btn>
              )}
            </div>
            {q.tip && <p className="text-xs leading-relaxed text-ink2">{q.tip}</p>}
          </Panel>
          <Btn full onClick={() => onDone(false)}>
            Continua
            <ChevronRight className="h-4 w-4" />
          </Btn>
        </>
      )}
      {chosen?.correct && q.tip && <p className="text-center text-xs text-ink3">{q.tip}</p>}
    </div>
  );
}

// ── Una sessione ────────────────────────────────────────────────────────────

function Session({
  drill,
  progress,
  audio,
  mic,
  notify,
  onBack,
}: EarTrainerProps & { drill: EarDrillId; onBack: () => void }) {
  const info = drillById(drill);
  const level = (progress.data.ear[drill] ?? EAR_START).level;
  const [n, setN] = useState(0);
  const [right, setRight] = useState(0);
  const [question, setQuestion] = useState<EarQuestion>(() => makeQuestion(drill, level));

  const onDone = useCallback(
    (correct: boolean) => {
      const out = progress.recordEar(drill, correct, info.levels.length);
      if (out.changed > 0) notify('👂', `${info.title}: livello ${out.level}`, info.levels[out.level - 1]);
      if (out.changed < 0) notify('↩️', `${info.title}: un passo indietro`, 'Si consolida, poi si risale.');
      if (correct) setRight(r => r + 1);
      setN(x => x + 1);
      setQuestion(makeQuestion(drill, out.level));
    },
    [progress, drill, info, notify],
  );

  const done = n >= SESSION;
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="rounded-lg bg-surface2 p-2 text-ink2 active:scale-95">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{info.emoji} {info.title}</p>
          <p className="truncate text-xs text-ink3">livello {level} · {info.levels[level - 1]}</p>
        </div>
        {!done && <span className="text-xs tabular-nums text-ink3">{n + 1}/{SESSION}</span>}
      </div>
      {!done ? (
        <>
          <Bar pct={n / SESSION} />
          <QuestionCard key={n} q={question} audio={audio} mic={mic} onDone={onDone} />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-3 text-center">
          <div className="text-5xl">{right >= 8 ? '🎧' : right >= 5 ? '👂' : '🌱'}</div>
          <p className="text-xl font-black text-ink">{right}/{SESSION}</p>
          <p className="max-w-xs text-sm text-ink2">
            {right >= 8
              ? 'Orecchio sicuro a questo livello. Pochi minuti al giorno valgono più di un\'ora una volta.'
              : 'Normale: l\'orecchio impara più lentamente delle dita. Torna domani, anche solo per dieci domande.'}
          </p>
          <div className="flex gap-2">
            <Btn variant="soft" onClick={onBack}>Altri esercizi</Btn>
            <Btn onClick={() => { setN(0); setRight(0); setQuestion(makeQuestion(drill, (progress.data.ear[drill] ?? EAR_START).level)); }}>
              <RotateCcw className="h-4 w-4" />
              Ancora
            </Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Elenco ──────────────────────────────────────────────────────────────────

export function EarTrainer(props: EarTrainerProps) {
  const [drill, setDrill] = useState<EarDrillId | null>(null);
  const ear = props.progress.data.ear;
  const totals = useMemo(() => Object.values(ear).reduce((s, p) => s + p.total, 0), [ear]);

  if (drill) return <Session {...props} drill={drill} onBack={() => setDrill(null)} />;

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">Orecchio</p>
        <h2 className="mt-1 text-xl font-black text-ink">Sentire prima di suonare</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink2">
          Chopin si suona cantando: sentire dove va una frase, se un accordo chiede di risolvere, quanto dura una
          nota. Dieci domande al giorno bastano; il livello si regola da solo.
        </p>
        {totals > 0 && <p className="mt-2 text-xs text-ink3">{totals} risposte date finora</p>}
      </Card>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EAR_DRILLS.map(d => {
          const p = ear[d.id] ?? EAR_START;
          const acc = p.total ? Math.round((p.correct / p.total) * 100) : null;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setDrill(d.id)}
              className="rounded-2xl border border-line bg-surface p-3 text-left transition-all active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{d.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-ink">{d.title}</span>
                    <Pill tone="brand">liv. {p.level}/{d.levels.length}</Pill>
                    {acc !== null && <Pill tone={acc >= 80 ? 'good' : 'neutral'}>{acc}%</Pill>}
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-ink2">{d.why}</p>
                  <p className="mt-0.5 text-[11px] text-ink3">ora: {d.levels[p.level - 1]}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
