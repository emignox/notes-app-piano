// ─────────────────────────────────────────────────────────────────────────────
// Canzoncine: leggere note vere, in fila, con un senso musicale.
//
// Aggiunte rispetto a prima: tempo regolabile (rallentare per leggere è una
// tecnica, non un ripiego), metronomo, evidenziazione sincronizzata durante
// l'ascolto, punteggio migliore salvato e aiuto sull'INTERVALLO rispetto alla
// nota precedente — che è come si legge davvero una melodia.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Lightbulb, Lock, Play, Volume2 } from 'lucide-react';
import type { AnswerState, Melody, MelodyNote, NoteEntry, NoteResult } from '../types';
import { melodies } from '../data/melodies';
import { describePosition, intervalLabel, italianOf, motionLabel, parseNote, pitchClass, samePitchClass } from '../lib/notes';
import { haptics } from '../lib/haptics';
import type { ProgressApi } from '../hooks/useProgress';
import type { AudioApi } from '../hooks/useAudio';
import { Btn, Card, Panel, Pill, Segmented } from './ui';
import type { Notify } from './ui';
import { Staff } from './Staff';
import { NoteNameButtons } from './NoteNameButtons';
import { PianoKeyboard } from './PianoKeyboard';

export type SongSection = 'melodie' | 'pezzi';

interface MelodyViewProps {
  progress: ProgressApi;
  audio: AudioApi;
  mic: { suppress: (ms?: number) => void };
  notify: Notify;
  section: SongSection;
  onSection: (s: SongSection) => void;
}

function toEntry(mn: MelodyNote, i: number): NoteEntry {
  return {
    id: `${mn.toneNote}-${i}`,
    clef: mn.clef,
    pitch: mn.vexflowKey.toUpperCase(),
    displayName: italianOf(mn.toneNote),
    englishName: mn.toneNote,
    vexflowKey: mn.vexflowKey,
    accidental: mn.accidental,
    noteValue: mn.duration === 'w' ? 'whole' : mn.duration === 'h' ? 'half' : 'quarter',
    toneNote: mn.toneNote,
    stageId: 'melody',
  };
}

function stars(pct: number): string {
  if (pct >= 100) return '★★★';
  if (pct >= 80) return '★★☆';
  if (pct >= 55) return '★☆☆';
  return '';
}

// ── Elenco ──────────────────────────────────────────────────────────────────

function MelodyCard({
  melody,
  learned,
  best,
  onSelect,
}: {
  melody: Melody;
  learned: string[];
  best: number;
  onSelect: (m: Melody, force: boolean) => void;
}) {
  const missing = melody.requiredToneNotes.filter(t => !learned.includes(t));
  const open = missing.length === 0;

  const diffTone = melody.difficulty === 'facile' ? 'good' : melody.difficulty === 'medio' ? 'warn' : 'bad';

  return (
    <div className={`rounded-2xl border p-3 transition-all ${open ? 'border-line bg-surface' : 'border-line/60 bg-surface/60'}`}>
      <button type="button" onClick={() => onSelect(melody, !open)} className="flex w-full items-start gap-3 text-left">
        <span className="mt-0.5 flex-shrink-0 text-3xl">{melody.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-ink">{melody.title}</span>
            <Pill tone={diffTone}>{melody.difficulty}</Pill>
            {!open && <Lock className="h-3.5 w-3.5 text-ink3" />}
          </div>
          <p className="mt-0.5 text-xs text-ink2">{melody.composer} · {melody.notes.length} note</p>
          {best > 0 && (
            <p className="mt-1 text-xs font-bold text-amber-400">
              {stars(best)} <span className="text-ink3">record {best}%</span>
            </p>
          )}
          {!open && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <span className="text-[11px] text-ink3">ti servono:</span>
              {missing.slice(0, 6).map(t => (
                <span key={t} className="rounded bg-surface2 px-1.5 py-0.5 text-[11px] text-ink2">
                  {italianOf(t)}
                  {parseNote(t).octave}
                </span>
              ))}
              {missing.length > 6 && <span className="text-[11px] text-ink3">+{missing.length - 6}</span>}
            </div>
          )}
        </div>
      </button>
      {!open && (
        <button
          type="button"
          onClick={() => onSelect(melody, true)}
          className="mt-2 w-full rounded-lg border border-line py-1.5 text-xs font-semibold text-ink2"
        >
          Provala comunque
        </button>
      )}
    </div>
  );
}

// ── Esecuzione ──────────────────────────────────────────────────────────────

function MelodyChallenge({
  melody,
  progress,
  audio,
  mic,
  notify,
  onBack,
}: {
  melody: Melody;
  progress: ProgressApi;
  audio: AudioApi;
  mic: { suppress: (ms?: number) => void };
  notify: Notify;
  onBack: () => void;
}) {
  const { settings } = progress;
  const [idx, setIdx] = useState(0);
  const [state, setState] = useState<AnswerState>('idle');
  const [picked, setPicked] = useState<string | null>(null);
  const [results, setResults] = useState<NoteResult[]>(() => melody.notes.map(() => 'unanswered'));
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [bpm, setBpm] = useState(melody.bpm);
  const [hintOpen, setHintOpen] = useState(false);
  const [done, setDone] = useState(false);
  const savedRef = useRef(false);

  const entries = useMemo(() => melody.notes.map(toEntry), [melody]);
  const durations = useMemo(() => melody.notes.map(mn => mn.duration), [melody]);
  const current = entries[idx];

  const secondsFor = useCallback((beats: number) => (beats * 60) / bpm, [bpm]);

  const listen = useCallback(
    (fromIdx = 0) => {
      const slice = melody.notes.slice(fromIdx);
      const seq = slice.map(mn => ({ toneNote: mn.toneNote, durationSec: secondsFor(mn.beats) }));
      const totalSec = seq.reduce((s, x) => s + x.durationSec, 0);
      mic.suppress(Math.ceil((totalSec + 1) * 1000));
      if (settings.metronome) audio.startMetronome(bpm);
      audio.playSequence(
        seq,
        i => setPlayingIdx(fromIdx + i),
        () => { setPlayingIdx(null); audio.stopMetronome(); },
      );
    },
    [melody.notes, secondsFor, mic, audio, settings.metronome, bpm],
  );

  const finish = useCallback(
    (finalResults: NoteResult[]) => {
      if (savedRef.current) return;
      savedRef.current = true;
      const correct = finalResults.filter(r => r === 'correct').length;
      const pct = Math.round((correct / finalResults.length) * 100);
      const unlocked = progress.recordMelody(melody.id, pct);
      unlocked.forEach(a => notify(a.emoji, a.title, a.desc));
      if (pct === 100) audio.playSuccess();
      setDone(true);
    },
    [melody.id, progress, notify, audio],
  );

  const advance = useCallback(
    (updated: NoteResult[]) => {
      const next = idx + 1;
      if (next >= melody.notes.length) {
        finish(updated);
        return;
      }
      setIdx(next);
      setState('idle');
      setPicked(null);
      setHintOpen(false);
    },
    [idx, melody.notes.length, finish],
  );

  const submit = useCallback(
    (answer: string) => {
      if (state !== 'idle' || done) return;
      const correct = samePitchClass(answer, current.englishName);
      setPicked(answer);
      setState(correct ? 'correct' : 'wrong');
      const updated = [...results];
      updated[idx] = correct ? 'correct' : 'wrong';
      setResults(updated);

      if (correct) {
        haptics.correct();
        audio.playNote(current.toneNote, secondsFor(melody.notes[idx].beats));
        mic.suppress(1600);
        setTimeout(() => advance(updated), 620);
      } else {
        haptics.wrong();
        audio.playError();
        setHintOpen(true);
      }
    },
    [state, done, current, results, idx, audio, mic, secondsFor, melody.notes, advance],
  );

  const retry = useCallback(() => {
    savedRef.current = false;
    setIdx(0);
    setState('idle');
    setPicked(null);
    setResults(melody.notes.map(() => 'unanswered'));
    setDone(false);
    setHintOpen(false);
  }, [melody.notes]);

  const correctCount = results.filter(r => r === 'correct').length;

  if (done) {
    const pct = Math.round((correctCount / melody.notes.length) * 100);
    return (
      <Card className="flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">{pct === 100 ? '🏆' : pct >= 80 ? '🎹' : '💪'}</div>
        <h2 className="text-2xl font-black text-ink">
          {pct === 100 ? 'Perfetta!' : pct >= 80 ? 'Ottima esecuzione' : 'Ancora un giro'}
        </h2>
        <p className="text-sm text-ink2">{melody.title} · {melody.composer}</p>
        <p className="text-3xl font-black text-amber-400">{stars(pct) || '—'}</p>
        <p className="text-sm text-ink2">{correctCount}/{melody.notes.length} · {pct}%</p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Btn variant="soft" onClick={retry}>Riprova</Btn>
          <Btn variant="soft" onClick={() => listen(0)}>
            <Volume2 className="h-4 w-4" />
            Ascoltala
          </Btn>
          <Btn onClick={onBack}>Altre canzoni</Btn>
        </div>
      </Card>
    );
  }

  const prev = idx > 0 ? entries[idx - 1] : null;
  const oct = parseNote(current.englishName).octave;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="rounded-lg bg-surface2 p-2 text-ink2 active:scale-95">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{melody.emoji} {melody.title}</p>
          <p className="text-xs text-ink3">{melody.composer}</p>
        </div>
        <span className="text-xs tabular-nums text-ink3">{idx + 1}/{melody.notes.length}</span>
      </div>

      {/* Tempo + ascolto */}
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface2 px-3 py-2">
        <button
          type="button"
          onClick={() => listen(0)}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white active:scale-95"
        >
          <Play className="h-3.5 w-3.5" />
          Ascolta
        </button>
        <button
          type="button"
          onClick={() => listen(idx)}
          className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink2 active:scale-95"
        >
          da qui
        </button>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-[11px] tabular-nums text-ink3">{bpm}</span>
          <input
            type="range"
            min={50}
            max={140}
            step={2}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-full accent-[var(--c-brand)]"
            aria-label="Tempo"
          />
        </div>
      </div>

      <Staff
        entries={entries}
        activeIndex={playingIdx ?? idx}
        results={results}
        answerState={playingIdx === null ? state : 'idle'}
        durations={durations}
      />

      {state !== 'idle' && (
        <div
          className={`anim-pop rounded-xl border px-4 py-2.5 text-sm font-bold ${
            state === 'correct'
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/50 bg-red-500/10 text-red-400'
          }`}
        >
          {state === 'correct' ? (
            'Esatto!'
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span>Era {current.displayName} ({current.englishName})</span>
              <Btn variant="danger" className="px-3 py-1.5" onClick={() => advance(results)}>
                Continua
              </Btn>
            </div>
          )}
        </div>
      )}

      {hintOpen ? (
        <Panel className="flex items-start gap-2 px-3 py-2.5 text-xs leading-relaxed text-ink2">
          <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
          <div>
            {prev ? (
              <p>
                Rispetto alla nota precedente ({prev.displayName}) è un{' '}
                <span className="font-bold text-ink">
                  {motionLabel(prev.englishName, current.englishName) === 'stessa'
                    ? 'unisono: la stessa nota'
                    : motionLabel(prev.englishName, current.englishName) === 'grado'
                    ? 'grado congiunto — linea → spazio subito accanto'
                    : `salto: ${intervalLabel(prev.englishName, current.englishName)}`}
                </span>
              </p>
            ) : (
              <p>Prima nota: parti dal riferimento più vicino.</p>
            )}
            <p className="mt-1 text-ink3">{describePosition(current.englishName, current.clef)}</p>
          </div>
        </Panel>
      ) : (
        <button
          type="button"
          onClick={() => setHintOpen(true)}
          className="self-center text-xs font-semibold text-ink3 underline decoration-dotted underline-offset-4"
        >
          Aiutami con questa nota
        </button>
      )}

      {settings.readInput === 'names' ? (
        <Panel className="p-2.5">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[11px] text-ink3">che nota è?</p>
            <button
              type="button"
              onClick={() => progress.setSettings({ readInput: 'keys' })}
              className="text-[11px] font-semibold text-brand"
            >
              usa la tastiera
            </button>
          </div>
          <NoteNameButtons
            onSelect={submit}
            disabled={state !== 'idle'}
            style={settings.noteNames}
            showAccidentals={melody.notes.some(x => x.accidental)}
            correct={state !== 'idle' ? current.englishName : null}
            picked={picked}
          />
        </Panel>
      ) : (
        <Panel className="p-2">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <p className="text-[11px] text-ink3">tocca il tasto</p>
            <button
              type="button"
              onClick={() => progress.setSettings({ readInput: 'names' })}
              className="text-[11px] font-semibold text-brand"
            >
              usa i nomi
            </button>
          </div>
          <PianoKeyboard
            from={`C${oct}`}
            to={`B${oct}`}
            onPress={submit}
            correct={state !== 'idle' ? current.englishName : null}
            wrong={state === 'wrong' && picked && pitchClass(picked) !== pitchClass(current.englishName) ? picked : null}
            labels={settings.keyLabels}
            disabled={state !== 'idle'}
            compact
          />
        </Panel>
      )}
    </Card>
  );
}

// ── Contenitore ─────────────────────────────────────────────────────────────

export function MelodyView({ progress, audio, mic, notify, section, onSection }: MelodyViewProps) {
  const [selected, setSelected] = useState<Melody | null>(null);
  const learned = useMemo(() => progress.unlockedNotes.map(n => n.toneNote), [progress.unlockedNotes]);

  if (selected) {
    return (
      <MelodyChallenge
        key={selected.id}
        melody={selected}
        progress={progress}
        audio={audio}
        mic={mic}
        notify={notify}
        onBack={() => setSelected(null)}
      />
    );
  }

  const open = melodies.filter(m => m.requiredToneNotes.every(t => learned.includes(t)));

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        value={section}
        onChange={onSection}
        options={[
          { value: 'melodie', label: 'Melodie' },
          { value: 'pezzi', label: 'Due mani' },
        ]}
      />
      <Card>
        <h2 className="text-xl font-black text-ink">Canzoncine</h2>
        <p className="mt-0.5 text-sm text-ink2">
          {open.length} di {melodies.length} disponibili · leggi le note una dopo l'altra, al tuo tempo
        </p>
      </Card>
      <div className="flex flex-col gap-2.5">
        {melodies.map(m => (
          <MelodyCard
            key={m.id}
            melody={m}
            learned={learned}
            best={progress.data.melodyBest[m.id] ?? 0}
            onSelect={mel => setSelected(mel)}
          />
        ))}
      </div>
    </div>
  );
}
