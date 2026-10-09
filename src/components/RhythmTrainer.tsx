// ─────────────────────────────────────────────────────────────────────────────
// Ritmo, in due esercizi:
//
//  · LEGGI IL RITMO — una figura di due battute, il metronomo conta una
//    battuta a vuoto, e la si batte: sullo schermo, oppure suonando un tasto
//    qualsiasi del piano col microfono acceso. Ogni attacco è misurato in
//    millisecondi e colorato sulla figura. Tre figure pulite di fila e si sale
//    di livello: un elemento nuovo alla volta (pause, crome, punto…).
//  · BATTITO — tenere il tempo del metronomo per otto colpi: la base di tutto.
//
// I clic stanno sull'orologio audio, non su setInterval: misurare la
// puntualità con un metronomo che sgrana sarebbe ingiusto.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { Gauge, Play, RotateCcw, Shuffle, Volume2 } from 'lucide-react';
import type { AudioApi, TimelineEvent, TimelineHandle } from '../hooks/useAudio';
import type { ProgressApi } from '../hooks/useProgress';
import type { ConfirmedNote } from '../hooks/usePitchDetection';
import type { RhythmPattern, RhythmScore } from '../lib/rhythmReading';
import {
  MAX_RHYTHM_LEVEL,
  RHYTHM_LEVELS,
  generatePattern,
  lengthInBeats,
  levelInfo,
  onsetsOf,
  scoreTaps,
} from '../lib/rhythmReading';
import { haptics } from '../lib/haptics';
import { Bar, Btn, Card, Panel, Pill, Segmented } from './ui';
import type { Notify } from './ui';
import { RhythmStaff } from './RhythmStaff';

interface MicApi {
  isListening: boolean;
  confirmedNote: ConfirmedNote | null;
  suppress: (ms?: number) => void;
}

interface RhythmTrainerProps {
  audio: AudioApi;
  progress: ProgressApi;
  mic: MicApi;
  notify: Notify;
}

const COUNT_IN = 4;

type Phase = 'ready' | 'listening' | 'running' | 'result';

function RhythmReading({ audio, progress, mic, notify }: RhythmTrainerProps) {
  const reached = progress.data.rhythm.level;
  const [level, setLevel] = useState(reached);
  const [pattern, setPattern] = useState<RhythmPattern>(() => generatePattern(reached));
  const [bpm, setBpm] = useState(() => levelInfo(reached).bpm);
  const [clicks, setClicks] = useState(true);
  const [phase, setPhase] = useState<Phase>('ready');
  const [beat, setBeat] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [result, setResult] = useState<RhythmScore | null>(null);

  const handleRef = useRef<TimelineHandle | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tapsRef = useRef<number[]>([]);
  const runRef = useRef<{ zero: number; beatMs: number; expected: number[] } | null>(null);
  const micBaseRef = useRef(mic.confirmedNote?.id ?? 0);

  const info = levelInfo(level);
  const onsets = onsetsOf(pattern);
  const beats = lengthInBeats(pattern);
  // Col microfono i clic durante la figura rientrerebbero come note: si conta
  // solo la battuta d'attacco, poi si suona nel silenzio.
  const useClicks = clicks && !mic.isListening;

  const stopAll = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    runRef.current = null;
    setBeat(null);
    setActive(null);
  }, []);

  useEffect(() => stopAll, [stopAll]);

  const newPattern = useCallback((lvl = level) => {
    stopAll();
    setPattern(generatePattern(lvl));
    setResult(null);
    setPhase('ready');
  }, [level, stopAll]);

  const chooseLevel = (lvl: number) => {
    setLevel(lvl);
    setBpm(levelInfo(lvl).bpm);
    newPattern(lvl);
  };

  /** Ascolta come suona: note sugli attacchi, clic sui movimenti. */
  const listen = useCallback(async () => {
    stopAll();
    await audio.initialize();
    const beatSec = 60 / bpm;
    const events: TimelineEvent[] = [];
    for (let b = 0; b < beats; b++) events.push({ at: b * beatSec, kind: b % 4 === 0 ? 'accent' : 'click' });
    let t = 0;
    for (const bar of pattern) for (const item of bar) {
      if (!item.rest) events.push({ at: t * beatSec, kind: 'note', note: 'G4', dur: Math.max(0.12, item.beats * beatSec * 0.85) });
      t += item.beats;
    }
    mic.suppress(Math.ceil((beats * beatSec + 1.2) * 1000));
    setPhase('listening');
    const handle = audio.playTimeline(events, () => { stopAll(); setPhase(result ? 'result' : 'ready'); });
    handleRef.current = handle;
    tickRef.current = setInterval(() => {
      const elapsedBeats = (Date.now() - handle.zero) / (beatSec * 1000);
      let idx: number | null = null;
      onsets.forEach((o, i) => { if (elapsedBeats >= o - 0.02) idx = i; });
      setActive(idx);
    }, 25);
  }, [audio, bpm, beats, pattern, onsets, mic, stopAll, result]);

  const finish = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    const earliest = run.zero + (COUNT_IN - 0.5) * run.beatMs;
    const taps = tapsRef.current.filter(t => t >= earliest);
    const score = scoreTaps(run.expected, taps);
    stopAll();
    setResult(score);
    setPhase('result');
    const levelUp = progress.recordRhythm(score.clean, MAX_RHYTHM_LEVEL);
    if (score.clean) {
      haptics.correct();
      audio.playSuccess();
    }
    if (levelUp) {
      notify('🥁', `Ritmo: livello ${levelUp}`, levelInfo(levelUp).title);
      setLevel(levelUp);
      setBpm(levelInfo(levelUp).bpm);
    }
  }, [progress, audio, notify, stopAll]);

  const start = useCallback(async () => {
    stopAll();
    await audio.initialize();
    const beatMs = 60_000 / bpm;
    const events: TimelineEvent[] = [];
    for (let b = 0; b < COUNT_IN; b++) events.push({ at: (b * beatMs) / 1000, kind: b === 0 ? 'accent' : 'click' });
    if (useClicks) {
      for (let b = 0; b < beats; b++) events.push({ at: ((COUNT_IN + b) * beatMs) / 1000, kind: b % 4 === 0 ? 'accent' : 'click' });
    }
    tapsRef.current = [];
    setResult(null);
    const handle = audio.playTimeline(events);
    handleRef.current = handle;
    const run = {
      zero: handle.zero,
      beatMs,
      expected: onsets.map(o => handle.zero + (COUNT_IN + o) * beatMs),
    };
    runRef.current = run;
    micBaseRef.current = mic.confirmedNote?.id ?? 0;
    // il microfono non deve sentire i clic dell'attacco
    if (mic.isListening) mic.suppress(Math.max(0, run.zero - Date.now()) + (COUNT_IN - 0.25) * beatMs);
    setPhase('running');
    const end = run.zero + (COUNT_IN + beats) * beatMs + 450;
    tickRef.current = setInterval(() => {
      const now = Date.now();
      if (now >= end) { finish(); return; }
      setBeat(Math.floor((now - run.zero) / beatMs));
    }, 20);
  }, [audio, bpm, useClicks, beats, onsets, mic, stopAll, finish]);

  const tap = useCallback(() => {
    if (phase !== 'running') return;
    tapsRef.current.push(Date.now());
    haptics.tap();
  }, [phase]);

  // Il tasto del piano vale come colpo: conta l'istante dell'ATTACCO, non
  // quello in cui la nota viene riconosciuta (che arriva ~50 ms dopo).
  useEffect(() => {
    if (phase !== 'running' || !mic.isListening || !mic.confirmedNote) return;
    if (mic.confirmedNote.id <= micBaseRef.current) return;
    micBaseRef.current = mic.confirmedNote.id;
    tapsRef.current.push(mic.confirmedNote.onsetAt);
  }, [mic.confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  // Da computer si batte anche con la barra spaziatrice.
  useEffect(() => {
    if (phase !== 'running') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) { e.preventDefault(); tap(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, tap]);

  // Prima del primo clic (il suono parte con un piccolo anticipo) non si mostra
  // né un numero né "tocca": solo l'attesa.
  const countIn = beat === null || beat < 0 ? '·' : beat < COUNT_IN ? COUNT_IN - beat : null;
  const hits = result ? result.grades.filter(g => g === 'ok').length : 0;
  const close = result ? result.grades.filter(g => g === 'quasi').length : 0;
  const tendency = result
    ? Math.abs(result.bias) < 25
      ? 'tempo centrato'
      : result.bias < 0
        ? `tendi ad anticipare (${Math.round(-result.bias)} ms)`
        : `tendi a ritardare (${Math.round(result.bias)} ms)`
    : '';
  const missed = result ? result.grades.filter(g => g === 'persa').length : 0;

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">Leggi il ritmo · livello {level}</p>
            <p className="mt-1 text-base font-black text-ink">{info.title}</p>
            <p className="mt-0.5 text-xs leading-snug text-ink2">{info.focus}</p>
          </div>
          <Pill className="flex-shrink-0 whitespace-nowrap" tone={progress.data.rhythm.clean > 0 && level === reached ? 'good' : 'neutral'}>
            {level === reached && reached < MAX_RHYTHM_LEVEL ? `${progress.data.rhythm.clean}/3 pulite` : `max ${reached}`}
          </Pill>
        </div>
        <div className="mt-3 flex gap-1 overflow-x-auto thin-scroll">
          {RHYTHM_LEVELS.map(l => (
            <button
              key={l.level}
              type="button"
              disabled={l.level > reached || phase === 'running'}
              onClick={() => chooseLevel(l.level)}
              className={`min-w-9 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-35 ${
                level === l.level ? 'bg-brand text-white' : 'bg-surface2 text-ink2'
              }`}
            >
              {l.level}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <RhythmStaff
          pattern={pattern}
          grades={phase === 'result' ? result?.grades ?? null : null}
          active={phase === 'listening' ? active : null}
        />

        <div className="flex items-center gap-3">
          <span className="w-20 flex-shrink-0 whitespace-nowrap text-sm font-black tabular-nums text-ink">{bpm} bpm</span>
          <input
            aria-label="Velocità"
            type="range"
            min={40}
            max={130}
            step={2}
            value={bpm}
            disabled={phase === 'running' || phase === 'listening'}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-full accent-[var(--c-brand)]"
          />
        </div>

        {phase === 'running' ? (
          <button
            type="button"
            onPointerDown={tap}
            className="anim-glow flex aspect-[5/2] w-full flex-col items-center justify-center rounded-3xl border-2 border-brand bg-brand/20 text-brand active:scale-[0.98]"
          >
            <span className="text-4xl font-black tabular-nums">{countIn ?? 'TOCCA'}</span>
            <span className="mt-1 text-xs font-semibold">
              {countIn !== null ? 'ascolta il tempo…' : mic.isListening ? 'oppure suona un tasto' : 'batti ogni nota'}
            </span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="soft" onClick={listen} disabled={phase === 'listening'}>
              <Volume2 className="h-4 w-4" />
              Ascolta
            </Btn>
            <Btn onClick={start} disabled={phase === 'listening'}>
              {phase === 'result' ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {phase === 'result' ? 'Riprova' : 'Via'}
            </Btn>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-ink3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={clicks}
              disabled={mic.isListening}
              onChange={e => setClicks(e.target.checked)}
              className="accent-[var(--c-brand)]"
            />
            metronomo durante la figura
          </label>
          <button
            type="button"
            onClick={() => newPattern()}
            disabled={phase === 'running'}
            className="flex items-center gap-1 font-semibold text-brand disabled:opacity-40"
          >
            <Shuffle className="h-3.5 w-3.5" />
            nuova figura
          </button>
        </div>
      </Card>

      {result && phase === 'result' && (
        <Panel className="space-y-1.5 p-4">
          <div className="flex items-center justify-between">
            <p className="font-black text-ink">
              {result.clean ? 'A tempo! ✓' : `${hits}/${result.grades.length} a tempo${close ? ` · ${close} quasi` : ''}`}
            </p>
            <Pill tone={result.clean ? 'good' : 'warn'}>± {Math.round(result.meanAbs)} ms</Pill>
          </div>
          <p className="text-sm text-ink2">
            {tendency}
            {missed > 0 && ` · ${missed} ${missed === 1 ? 'nota persa' : 'note perse'}`}
            {result.extra > 0 && ` · ${result.extra} ${result.extra === 1 ? 'colpo in più' : 'colpi in più'}`}.
          </p>
          <p className="text-xs leading-relaxed text-ink3">
            {result.clean
              ? 'Ancora due figure così e il livello sale. Prova a non guardare il pulsante: guarda la figura.'
              : result.extra > 0
                ? 'Hai battuto anche dove c\'è una pausa o una nota lunga: conta i movimenti a voce, senza battere.'
                : Math.abs(result.bias) >= 60
                  ? 'Lo scarto è sempre dalla stessa parte: ascolta il clic e batti INSIEME, non dopo.'
                  : 'Ascoltala una volta, poi rifalla un po\' più lenta: la velocità arriva dopo la precisione.'}
          </p>
          <p className="text-[11px] text-ink3">Verde: a tempo · giallo: quasi · rosso: fuori tempo o persa.</p>
        </Panel>
      )}
    </div>
  );
}

/** Tenere il battito: otto colpi col metronomo, precisione e tendenza. */
function PulseTrainer({ audio, progress }: RhythmTrainerProps) {
  const stopMetronome = audio.stopMetronome;
  const [bpm, setBpm] = useState(72);
  const [running, setRunning] = useState(false);
  const [taps, setTaps] = useState<number[]>([]);
  const [result, setResult] = useState<{ avg: number; tendency: string; score: number } | null>(null);
  const startedAt = useRef(0);

  useEffect(() => () => stopMetronome(), [stopMetronome]);

  const start = async () => {
    await audio.initialize();
    setTaps([]);
    setResult(null);
    setRunning(true);
    startedAt.current = performance.now();
    audio.startMetronome(bpm);
  };

  const tap = () => {
    if (!running) return;
    const period = 60_000 / bpm;
    const elapsed = performance.now() - startedAt.current;
    const nearest = Math.round(elapsed / period) * period;
    const deviation = elapsed - nearest;
    const next = [...taps, deviation];
    setTaps(next);
    if (next.length >= 8) {
      stopMetronome();
      setRunning(false);
      const avg = Math.round(next.reduce((sum, n) => sum + Math.abs(n), 0) / next.length);
      const signed = next.reduce((sum, n) => sum + n, 0) / next.length;
      const score = Math.max(0, Math.round(100 - avg / 1.5));
      const tendency = Math.abs(signed) < 18 ? 'tempo equilibrato' : signed < 0 ? 'tendi ad anticipare' : 'tendi a ritardare';
      setResult({ avg, tendency, score });
      progress.recordTheory(`rhythm:${bpm}`, avg <= 90);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-fuchsia-500/20 via-brand/10 to-transparent p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-brand">Battito</p><h2 className="mt-1 text-2xl font-black text-ink">Senti il battito, non inseguirlo.</h2></div>
            <Gauge className="h-7 w-7 text-brand" />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink2">Avvia il metronomo e tocca il grande pulsante per otto battiti. Misuriamo precisione e tendenza.</p>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <span className="w-16 text-sm font-black tabular-nums text-ink">{bpm} BPM</span>
            <input aria-label="Velocità ritmo" type="range" min={40} max={140} step={4} value={bpm} disabled={running} onChange={e => setBpm(Number(e.target.value))} className="w-full accent-[var(--c-brand)]" />
          </div>
          {!running ? (
            <Btn full onClick={start}>{result ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}{result ? 'Riprova' : 'Avvia il metronomo'}</Btn>
          ) : (
            <button type="button" onPointerDown={tap} className="anim-glow flex aspect-[3/1] w-full items-center justify-center rounded-3xl border-2 border-brand bg-brand/20 text-xl font-black text-brand active:scale-[0.98]">TOCCA · {taps.length}/8</button>
          )}
          <Bar pct={taps.length / 8} />
        </div>
      </Card>
      {result && (
        <Panel className="p-4">
          <div className="flex items-center justify-between"><p className="font-black text-ink">Precisione {result.score}%</p><Pill tone={result.avg <= 90 ? 'good' : 'warn'}>± {result.avg} ms</Pill></div>
          <p className="mt-2 text-sm text-ink2">{result.tendency}. {result.avg <= 60 ? 'Ottimo controllo.' : result.avg <= 110 ? 'Buona base: prova ancora allo stesso tempo.' : 'Rallenta di 8 BPM e cerca di respirare sul battito.'}</p>
        </Panel>
      )}
    </div>
  );
}

export function RhythmTrainer(props: RhythmTrainerProps) {
  const [mode, setMode] = useState<'lettura' | 'battito'>('lettura');
  return (
    <div className="flex flex-col gap-3">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'lettura' as const, label: 'Leggi il ritmo' },
          { value: 'battito' as const, label: 'Battito' },
        ]}
      />
      {mode === 'lettura' ? <RhythmReading {...props} /> : <PulseTrainer {...props} />}
    </div>
  );
}
