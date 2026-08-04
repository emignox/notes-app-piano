// ─────────────────────────────────────────────────────────────────────────────
// Pezzi a due mani.
//
// Come si studia un pezzo per davvero, e come funziona qui:
//  1. ASCOLTA (a tempo ridotto se serve);
//  2. MANO DESTRA sola, 3. MANO SINISTRA sola — separate, sempre;
//  4. INSIEME, lentamente.
// Il selettore della mano non è un extra: è il metodo.
//
// Le note del passo si possono suonare in qualsiasi ordine: se hai un piano
// vero e il microfono acceso puoi arpeggiare l'accordo e vengono riconosciute
// una alla volta. È il modo di far funzionare gli accordi con un rilevatore
// che di per sé sente una nota sola.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Eye, Hand as HandIcon, Play, Volume2 } from 'lucide-react';
import type { Hand, NoteResult, Piece } from '../types';
import { pieces } from '../data/pieces';
import { italianOf, midiOf, parseNote, sameNote } from '../lib/notes';
import { haptics } from '../lib/haptics';
import type { ProgressApi } from '../hooks/useProgress';
import type { AudioApi } from '../hooks/useAudio';
import type { LiveNote } from '../hooks/usePitchDetection';
import { Bar, Btn, Card, Confetti, Panel, Pill, Segmented } from './ui';
import type { Notify } from './ui';
import { GrandStaff } from './GrandStaff';
import { PianoKeyboard } from './PianoKeyboard';

import type { SongSection } from './MelodyView';

interface PieceViewProps {
  section: SongSection;
  onSection: (s: SongSection) => void;
  progress: ProgressApi;
  audio: AudioApi;
  mic: {
    isListening: boolean;
    confirmedNote: { note: LiveNote; id: number } | null;
    suppress: (ms?: number) => void;
  };
  notify: Notify;
}

const HANDS: { id: Hand; label: string }[] = [
  { id: 'right', label: 'Destra' },
  { id: 'left', label: 'Sinistra' },
  { id: 'both', label: 'Insieme' },
];

/** Estensione di tastiera che copre le note indicate, a ottave intere. */
function rangeFor(notes: string[], fallback: string): { from: string; to: string } {
  if (notes.length === 0) {
    const oct = parseNote(fallback).octave;
    return { from: `C${oct}`, to: `B${oct}` };
  }
  const octaves = notes.map(n => parseNote(n).octave);
  return { from: `C${Math.min(...octaves)}`, to: `B${Math.max(...octaves)}` };
}

function PieceChallenge({
  piece,
  progress,
  audio,
  mic,
  notify,
  onBack,
}: {
  piece: Piece;
  progress: ProgressApi;
  audio: AudioApi;
  mic: PieceViewProps['mic'];
  notify: Notify;
  onBack: () => void;
}) {
  const [hand, setHand] = useState<Hand>('right');
  const [idx, setIdx] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [results, setResults] = useState<NoteResult[]>(() => piece.steps.map(() => 'unanswered'));
  const [mistakes, setMistakes] = useState(0);
  const [bpm, setBpm] = useState(piece.bpm);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [showKeys, setShowKeys] = useState(false);
  const [done, setDone] = useState(false);
  // Il tasto sbagliato va evidenziato SOLO sulla tastiera su cui è stato premuto:
  // le due estensioni si sovrappongono e altrimenti si accendono entrambe.
  const [wrong, setWrong] = useState<{ note: string; hand: 'right' | 'left' } | null>(null);

  const stepErrorRef = useRef(false);
  const micBaseRef = useRef(mic.confirmedNote?.id ?? 0);
  const savedRef = useRef(false);

  const trebleNotes = useMemo(() => [...new Set(piece.steps.flatMap(s => s.treble))], [piece]);
  const bassNotes = useMemo(() => [...new Set(piece.steps.flatMap(s => s.bass))], [piece]);
  const rightRange = useMemo(() => rangeFor(trebleNotes, 'C4'), [trebleNotes]);
  const leftRange = useMemo(() => rangeFor(bassNotes, 'C3'), [bassNotes]);

  const step = piece.steps[idx];

  /** Cosa deve suonare l'utente in questo passo, secondo la mano scelta. */
  const required = useMemo(() => {
    if (!step) return [];
    if (hand === 'right') return step.treble;
    if (hand === 'left') return step.bass;
    return [...step.treble, ...step.bass];
  }, [step, hand]);

  const missing = required.filter(n => !found.some(f => sameNote(f, n)));

  const secondsFor = useCallback((beats: number) => (beats * 60) / bpm, [bpm]);

  const listen = useCallback(
    (which: Hand) => {
      const seq = piece.steps.map(s => ({
        notes:
          which === 'right' ? s.treble : which === 'left' ? s.bass : [...s.treble, ...s.bass],
        durationSec: secondsFor(s.beats),
      }));
      const total = seq.reduce((sum, x) => sum + x.durationSec, 0);
      mic.suppress(Math.ceil((total + 1) * 1000));
      audio.playChordSequence(seq, i => setPlayingIdx(i), () => setPlayingIdx(null));
    },
    [piece.steps, secondsFor, audio, mic],
  );

  const finish = useCallback(
    (finalResults: NoteResult[]) => {
      if (savedRef.current) return;
      savedRef.current = true;
      const ok = finalResults.filter(r => r === 'correct').length;
      const pct = Math.round((ok / finalResults.length) * 100);
      // Il record viene salvato per mano: studiare una mano è un traguardo suo.
      const unlocked = progress.recordMelody(`piece:${piece.id}:${hand}`, pct);
      unlocked.forEach(a => notify(a.emoji, a.title, a.desc));
      if (pct === 100) audio.playSuccess();
      setDone(true);
    },
    [piece.id, hand, progress, notify, audio],
  );

  const goToStep = useCallback(
    (next: number, updated: NoteResult[]) => {
      if (next >= piece.steps.length) {
        finish(updated);
        return;
      }
      setIdx(next);
      setFound([]);
      setWrong(null);
      setShowKeys(false);
      stepErrorRef.current = false;
    },
    [piece.steps.length, finish],
  );

  const completeStep = useCallback(() => {
    const updated = [...results];
    updated[idx] = stepErrorRef.current ? 'wrong' : 'correct';
    setResults(updated);
    haptics.correct();
    setTimeout(() => goToStep(idx + 1, updated), 220);
  }, [results, idx, goToStep]);

  // Passo in cui la mano scelta non suona (pausa): si scorre da sé.
  useEffect(() => {
    if (done || !step || required.length > 0) return;
    const t = setTimeout(() => {
      const updated = [...results];
      updated[idx] = 'correct';
      setResults(updated);
      goToStep(idx + 1, updated);
    }, 420);
    return () => clearTimeout(t);
  }, [idx, required.length, done, step, results, goToStep]);

  const press = useCallback(
    (toneNote: string, source: 'right' | 'left' | 'mic') => {
      if (done || !step) return;
      const fromMic = source === 'mic';
      // Dal microfono l'ottava può sfuggire: basta la nota giusta.
      const target = fromMic
        ? missing.find(n => midiOf(n) % 12 === midiOf(toneNote) % 12)
        : missing.find(n => sameNote(n, toneNote));

      if (!target) {
        stepErrorRef.current = true;
        setMistakes(m => m + 1);
        if (!fromMic) setWrong({ note: toneNote, hand: source });
        haptics.wrong();
        audio.playError();
        mic.suppress(700);
        setTimeout(() => setWrong(null), 450);
        return;
      }

      if (!fromMic) {
        audio.playNote(toneNote, 0.9);
        mic.suppress(900);
      }
      const nextFound = [...found, target];
      setFound(nextFound);
      haptics.tap();
      if (nextFound.length >= required.length) completeStep();
    },
    [done, step, missing, found, required.length, completeStep, audio, mic],
  );

  // Microfono: una nota per volta, anche arpeggiando l'accordo.
  useEffect(() => {
    if (!mic.isListening || !mic.confirmedNote) return;
    if (mic.confirmedNote.id <= micBaseRef.current) return;
    micBaseRef.current = mic.confirmedNote.id;
    press(`${mic.confirmedNote.note.name}${mic.confirmedNote.note.octave}`, 'mic');
  }, [mic.confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = useCallback(() => {
    savedRef.current = false;
    setIdx(0);
    setFound([]);
    setResults(piece.steps.map(() => 'unanswered'));
    setMistakes(0);
    setDone(false);
    setShowKeys(false);
    stepErrorRef.current = false;
  }, [piece.steps]);

  const switchHand = useCallback(
    (h: Hand) => {
      setHand(h);
      savedRef.current = false;
      setIdx(0);
      setFound([]);
      setResults(piece.steps.map(() => 'unanswered'));
      setMistakes(0);
      setDone(false);
      stepErrorRef.current = false;
    },
    [piece.steps],
  );

  if (done) {
    const ok = results.filter(r => r === 'correct').length;
    const pct = Math.round((ok / results.length) * 100);
    const handLabel = hand === 'right' ? 'mano destra' : hand === 'left' ? 'mano sinistra' : 'due mani';
    return (
      <>
        {pct === 100 && <Confetti />}
        <Card className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">{pct === 100 ? '🏆' : pct >= 80 ? '🎹' : '💪'}</div>
          <h2 className="text-2xl font-black text-ink">
            {pct === 100 ? 'Pezzo suonato!' : 'Fine del pezzo'}
          </h2>
          <p className="text-sm text-ink2">
            {piece.title} · {handLabel}
          </p>
          <p className="text-sm text-ink2">
            {pct}% · {mistakes} {mistakes === 1 ? 'errore' : 'errori'}
          </p>
          {hand !== 'both' && (
            <Panel className="w-full px-4 py-3 text-xs leading-relaxed text-ink2">
              Prossimo passo: {hand === 'right' ? 'prova la mano sinistra' : 'prova la mano destra'}, poi
              le due insieme. È così che si impara un pezzo — mai tutto in una volta.
            </Panel>
          )}
          <div className="flex flex-wrap justify-center gap-2.5">
            <Btn variant="soft" onClick={restart}>Riprova</Btn>
            {hand !== 'both' && (
              <Btn onClick={() => switchHand(hand === 'right' ? 'left' : 'both')}>
                {hand === 'right' ? 'Mano sinistra' : 'Insieme'}
              </Btn>
            )}
            <Btn variant="soft" onClick={onBack}>Altri pezzi</Btn>
          </div>
        </Card>
      </>
    );
  }

  const hintKeys = showKeys ? missing : [];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="rounded-lg bg-surface2 p-2 text-ink2 active:scale-95">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{piece.emoji} {piece.title}</p>
          <p className="text-xs text-ink3">{piece.composer}</p>
        </div>
        <span className="text-xs tabular-nums text-ink3">{idx + 1}/{piece.steps.length}</span>
      </div>

      {/* Selettore della mano: il cuore del metodo */}
      <div className="flex gap-1.5">
        {HANDS.map(h => (
          <button
            key={h.id}
            type="button"
            onClick={() => switchHand(h.id)}
            className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${
              hand === h.id ? 'border-brand bg-brand/15 text-brand' : 'border-line bg-surface2 text-ink2'
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface2 px-3 py-2">
        <button
          type="button"
          onClick={() => listen(hand)}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white active:scale-95"
        >
          <Play className="h-3.5 w-3.5" />
          Ascolta
        </button>
        {hand !== 'both' && (
          <button
            type="button"
            onClick={() => listen('both')}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink2 active:scale-95"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="flex flex-1 items-center gap-2">
          <span className="text-[11px] tabular-nums text-ink3">{bpm}</span>
          <input
            type="range"
            min={40}
            max={130}
            step={2}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-full accent-[var(--c-brand)]"
            aria-label="Tempo"
          />
        </div>
      </div>

      <GrandStaff
        steps={piece.steps}
        activeIndex={playingIdx ?? idx}
        results={results}
        found={found}
        hand={hand}
      />

      <Bar pct={idx / piece.steps.length} />

      {/* Quante note restano in questo passo, senza dire quali */}
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-xs text-ink2">
          {required.length === 0
            ? 'Questa mano tace: pausa'
            : required.length === 1
            ? 'Una nota'
            : `${found.length}/${required.length} note dell'accordo`}
        </p>
        <button
          type="button"
          onClick={() => setShowKeys(v => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-ink3"
        >
          <Eye className="h-3.5 w-3.5" />
          {showKeys ? 'nascondi' : 'mostrami'}
        </button>
      </div>

      {/* Tastiere: una per mano, ognuna alla sua ottava, tasti grandi */}
      {hand !== 'left' && (
        <Panel className="p-2">
          <p className="mb-1 flex items-center gap-1 px-1 text-[11px] text-ink3">
            <HandIcon className="h-3 w-3" /> mano destra
          </p>
          <PianoKeyboard
            from={rightRange.from}
            to={rightRange.to}
            onPress={n => press(n, 'right')}
            hint={hintKeys.filter(n => step.treble.some(t => sameNote(t, n)))}
            wrong={wrong?.hand === 'right' ? wrong.note : null}
            labels={progress.settings.keyLabels}
            compact
          />
        </Panel>
      )}
      {hand !== 'right' && (
        <Panel className="p-2">
          <p className="mb-1 flex items-center gap-1 px-1 text-[11px] text-ink3">
            <HandIcon className="h-3 w-3 -scale-x-100" /> mano sinistra
          </p>
          <PianoKeyboard
            from={leftRange.from}
            to={leftRange.to}
            onPress={n => press(n, 'left')}
            hint={hintKeys.filter(n => step.bass.some(b => sameNote(b, n)))}
            wrong={wrong?.hand === 'left' ? wrong.note : null}
            labels={progress.settings.keyLabels}
            compact
          />
        </Panel>
      )}

      {mic.isListening && (
        <p className="text-center text-[11px] text-ink3">
          🎤 Microfono attivo: suona sul piano. Per gli accordi puoi arpeggiare, le note vengono
          riconosciute una per una.
        </p>
      )}
    </Card>
  );
}

export function PieceView({ progress, audio, mic, notify, section, onSection }: PieceViewProps) {
  const [selected, setSelected] = useState<Piece | null>(null);

  if (selected) {
    return (
      <PieceChallenge
        key={selected.id}
        piece={selected}
        progress={progress}
        audio={audio}
        mic={mic}
        notify={notify}
        onBack={() => setSelected(null)}
      />
    );
  }

  const bestOf = (p: Piece) =>
    Math.max(
      progress.data.melodyBest[`piece:${p.id}:right`] ?? 0,
      progress.data.melodyBest[`piece:${p.id}:left`] ?? 0,
      progress.data.melodyBest[`piece:${p.id}:both`] ?? 0,
    );

  return (
    <div className="flex flex-col gap-2.5">
      <Segmented
        value={section}
        onChange={onSection}
        options={[
          { value: 'melodie', label: 'Melodie' },
          { value: 'pezzi', label: 'Due mani' },
        ]}
      />
      <Panel className="px-4 py-3 text-xs leading-relaxed text-ink2">
        Doppio pentagramma: sopra la mano destra, sotto la sinistra. Studia <b>una mano per volta</b> e
        solo dopo le unisci — con il tempo abbassato quanto ti serve.
      </Panel>

      {pieces.map(p => {
        const best = bestOf(p);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p)}
            className="rounded-2xl border border-line bg-surface p-3 text-left transition-all active:scale-[0.99]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-3xl">{p.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-ink">{p.title}</span>
                  <Pill tone={p.difficulty === 'facile' ? 'good' : p.difficulty === 'medio' ? 'warn' : 'bad'}>
                    {p.difficulty}
                  </Pill>
                  {best > 0 && <Pill tone="brand">record {best}%</Pill>}
                </div>
                <p className="mt-0.5 text-xs text-ink3">
                  {p.composer} · {p.steps.length} passi · {p.bpm} bpm
                </p>
                <p className="mt-1 text-xs leading-snug text-ink2">{p.hint}</p>
                <p className="mt-1.5 text-[11px] text-ink3">
                  sinistra: {[...new Set(p.steps.flatMap(s => s.bass))].slice(0, 5).map(n => italianOf(n)).join(' ')}
                  {[...new Set(p.steps.flatMap(s => s.bass))].length > 5 ? '…' : ''}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
