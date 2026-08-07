import { useEffect, useRef, useState } from 'react';
import { Gauge, Play, RotateCcw } from 'lucide-react';
import type { AudioApi } from '../hooks/useAudio';
import type { ProgressApi } from '../hooks/useProgress';
import { Bar, Btn, Card, Panel, Pill } from './ui';

export function RhythmTrainer({ audio, progress }: { audio: AudioApi; progress: ProgressApi }) {
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
      progress.recordStudyMinutes(1);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-fuchsia-500/20 via-brand/10 to-transparent p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-brand">Laboratorio ritmo</p><h2 className="mt-1 text-2xl font-black text-ink">Senti il battito, non inseguirlo.</h2></div>
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
