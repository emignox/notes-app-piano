// ─────────────────────────────────────────────────────────────────────────────
// Pezzi a due mani.
//
// Come si studia un pezzo per davvero, e come funziona qui:
//  1. ASCOLTA (a tempo ridotto se serve);
//  2. una SEZIONE per volta — non si impara una pagina intera dall'inizio alla
//     fine, si imparano otto battute e poi le si attacca alle otto dopo;
//  3. MANO DESTRA sola, poi MANO SINISTRA sola — separate, sempre;
//  4. INSIEME, lentamente.
// Il selettore della mano e quello della sezione non sono extra: sono il metodo.
//
// Col piano vero e il microfono acceso, l'app sa quali note aspetta a ogni
// passo e le cerca nello spettro (`lib/chordMatcher`): gli accordi si suonano
// insieme, come sono scritti, anche col pedale e con la sinistra che risuona.
//
// Le note legate (legatura di VALORE) non vengono richieste una seconda volta:
// il suono continua, il dito resta giù, e il passo scorre da solo. Chiederle di
// nuovo insegnerebbe a ribattere, che è precisamente l'errore.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Eye, Hand as HandIcon, Play, Square, Volume2 } from 'lucide-react';
import type { Hand, NoteResult, Piece, PieceSection } from '../types';
import { pieces } from '../data/pieces';
import { italianOf, midiOf, parseNote, sameNote } from '../lib/notes';
import {
  buildPerformance,
  isFullyTied,
  pieceNotes,
  requiredNotes,
  splitMeasures,
  stepAdvice,
} from '../lib/score';
import { keyInfo } from '../lib/keys';
import { haptics } from '../lib/haptics';
import type { ProgressApi } from '../hooks/useProgress';
import type { AudioApi } from '../hooks/useAudio';
import type { ChordMatch, LiveNote } from '../hooks/usePitchDetection';
import { Bar, Btn, Card, Confetti, PageHeader, Panel, Segmented } from './ui';
import type { Notify } from './ui';
import { GrandStaff } from './GrandStaff';
import { PianoKeyboard } from './PianoKeyboard';

import type { SongSection } from './MelodyView';
import { Library } from './Library';
import { Leggio } from './leggio/Leggio';
import type { LibraryEntry } from '../data/library';

interface PieceViewProps {
  section: SongSection;
  onSection: (s: SongSection) => void;
  progress: ProgressApi;
  audio: AudioApi;
  mic: {
    isListening: boolean;
    confirmedNote: { note: LiveNote; id: number; onsetAt?: number } | null;
    liveNote: LiveNote | null;
    level: number;
    suppress: (ms?: number) => void;
    expect: (notes: number[] | null, token?: string) => void;
    chordMatch: ChordMatch | null;
  };
  notify: Notify;
  /** Dalle lezioni: il pezzo da aprire subito. */
  initialPieceId?: string;
  /** Il Leggio copre l'intestazione: il microfono si accende anche da lì. */
  onToggleMic?: () => void;
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

/** Il pezzo intero visto come una sezione: evita di avere due strade nel codice. */
const wholePiece = (piece: Piece): PieceSection => ({
  name: 'Tutto',
  from: 0,
  to: piece.steps.length,
  note: 'Il pezzo dall\'inizio alla fine, di seguito.',
});

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
  const parts = useMemo<PieceSection[]>(
    () => (piece.sections?.length ? [...piece.sections, wholePiece(piece)] : [wholePiece(piece)]),
    [piece],
  );
  const measures = useMemo(() => splitMeasures(piece), [piece]);

  const [hand, setHand] = useState<Hand>('right');
  // Si comincia dalla prima sezione, non dal pezzo intero: è il consiglio che
  // daremmo a voce, quindi è anche il valore predefinito.
  const [partIdx, setPartIdx] = useState(0);
  const [loopBars, setLoopBars] = useState<0 | 1 | 2 | 4>(0);
  const [loopMeasure, setLoopMeasure] = useState(0);
  const basePart = parts[Math.min(partIdx, parts.length - 1)];
  const availableMeasures = useMemo(
    () => measures.filter(m => (m.indices[0] ?? -1) >= basePart.from && (m.indices[0] ?? -1) < basePart.to),
    [measures, basePart],
  );
  const part = useMemo<PieceSection>(() => {
    if (loopBars === 0 || availableMeasures.length === 0) return basePart;
    const startPos = Math.min(loopMeasure, availableMeasures.length - 1);
    const chosen = availableMeasures.slice(startPos, startPos + loopBars);
    const first = chosen[0];
    const last = chosen[chosen.length - 1];
    const from = first?.indices[0] ?? basePart.from;
    const to = (last?.indices[last.indices.length - 1] ?? from) + 1;
    return {
      name: `Batt. ${first?.number ?? 1}${chosen.length > 1 ? `–${last?.number ?? first?.number}` : ''}`,
      from,
      to,
      note: `Loop mirato di ${chosen.length} ${chosen.length === 1 ? 'battuta' : 'battute'}. Ripetilo pulito due volte prima di accelerare.`,
    };
  }, [loopBars, loopMeasure, availableMeasures, basePart]);

  const [idx, setIdx] = useState(part.from);
  const [found, setFound] = useState<string[]>([]);
  const [results, setResults] = useState<NoteResult[]>(() => piece.steps.map(() => 'unanswered'));
  const [mistakes, setMistakes] = useState(0);
  const [bpm, setBpm] = useState(piece.bpm);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playingWhole, setPlayingWhole] = useState(false);
  /** La mano che si sta ascoltando: si accendono le sue note, anche se si studia l'altra. */
  const [playingHand, setPlayingHand] = useState<Hand>('both');
  const [showKeys, setShowKeys] = useState(false);
  const [fingering, setFingering] = useState(true);
  const [done, setDone] = useState(false);
  const [smartLoop, setSmartLoop] = useState(true);
  const [suggestedBpm, setSuggestedBpm] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  // Il tasto sbagliato va evidenziato SOLO sulla tastiera su cui è stato premuto:
  // le due estensioni si sovrappongono e altrimenti si accendono entrambe.
  const [wrong, setWrong] = useState<{ note: string; hand: 'right' | 'left' } | null>(null);

  const stepErrorRef = useRef(false);
  const micBaseRef = useRef(mic.chordMatch?.id ?? 0);
  const savedRef = useRef(false);

  const rightRange = useMemo(() => rangeFor(pieceNotes(piece, 'right'), 'C4'), [piece]);
  const leftRange = useMemo(() => rangeFor(pieceNotes(piece, 'left'), 'C3'), [piece]);
  const tonality = useMemo(() => keyInfo(piece.key.tonic, piece.key.mode), [piece]);

  const step = piece.steps[idx];

  /** Cosa deve suonare l'utente ORA: le note legate non si ribattono. */
  const required = useMemo(() => requiredNotes(piece.steps, idx, hand), [piece.steps, idx, hand]);
  const missing = required.filter(n => !found.some(f => sameNote(f, n)));
  const advice = useMemo(() => stepAdvice(piece.steps, idx, hand), [piece.steps, idx, hand]);

  const total = part.to - part.from;
  const doneCount = Math.max(0, idx - part.from);
  const stopSequence = audio.stopSequence;

  const stopListening = useCallback(() => {
    stopSequence();
    setPlaying(false);
    setPlayingIdx(null);
  }, [stopSequence]);

  /**
   * L'ascolto usa l'esecuzione interpretata: legature, staccati, dinamiche e
   * corone si sentono. È il modello da imitare, quindi deve suonare come
   * musica, non come un metronomo con le note sopra.
   */
  const listen = useCallback(
    (which: Hand, whole = false) => {
      // `whole`: dall'inizio alla fine del brano, a prescindere dalla sezione
      // che si sta studiando. Ascoltare il pezzo intero è come lo si impara a
      // desiderare, prima ancora di studiarlo a pezzi.
      const from = whole ? 0 : part.from;
      const to = whole ? piece.steps.length : part.to;
      const perf = buildPerformance(piece, which, bpm);
      const t0 = perf.stepTimes[from] ?? 0;
      const events = perf.events
        .filter(e => e.stepIndex >= from && e.stepIndex < to)
        .map(e => ({ ...e, at: e.at - t0 }));
      const times = perf.stepTimes.slice(from, to).map(t => t - t0);
      if (events.length === 0) return;

      const length = Math.max(...events.map(e => e.at + e.hold));
      mic.suppress(Math.ceil((length + 1.2) * 1000));
      setPlaying(true);
      setPlayingWhole(whole);
      setPlayingHand(which);
      audio.playPerformance(
        events,
        times,
        i => setPlayingIdx(from + i),
        () => { setPlayingIdx(null); setPlaying(false); setPlayingWhole(false); },
      );
    },
    [piece, bpm, part.from, part.to, audio, mic],
  );

  const finish = useCallback(
    (finalResults: NoteResult[]) => {
      if (savedRef.current) return;
      savedRef.current = true;
      const slice = finalResults.slice(part.from, part.to);
      const ok = slice.filter(r => r === 'correct').length;
      const pct = Math.round((ok / Math.max(1, slice.length)) * 100);
      // Il record vale per mano E per sezione: finire otto battute con la
      // sinistra è un traguardo suo, e va contato come tale.
      const whole = part.to - part.from === piece.steps.length;
      const key = whole ? `piece:${piece.id}:${hand}` : `piece:${piece.id}:${hand}:${part.name}`;
      const unlocked = progress.recordMelody(key, pct);
      if (smartLoop) {
        const loopKey = `${piece.id}:${part.name}:${hand}`;
        const next = progress.recordPieceLoop(loopKey, pct === 100, bpm);
        setSuggestedBpm(next);
      }
      unlocked.forEach(a => notify(a.emoji, a.title, a.desc));
      if (pct === 100) audio.playSuccess();
      setDone(true);
    },
    [piece.id, piece.steps.length, hand, part, progress, notify, audio, smartLoop, bpm],
  );

  const goToStep = useCallback(
    (next: number, updated: NoteResult[]) => {
      if (next >= part.to) {
        finish(updated);
        return;
      }
      setIdx(next);
      setFound([]);
      setWrong(null);
      setFeedback(null);
      setShowKeys(false);
      stepErrorRef.current = false;
    },
    [part.to, finish],
  );

  const completeStep = useCallback(() => {
    const updated = [...results];
    updated[idx] = stepErrorRef.current ? 'wrong' : 'correct';
    setResults(updated);
    haptics.correct();
    setTimeout(() => goToStep(idx + 1, updated), 200);
  }, [results, idx, goToStep]);

  /**
   * Passo che non chiede niente a questa mano: una pausa, oppure una nota
   * legata al passo precedente. Scorre da solo, ma dopo un attimo di attesa
   * proporzionato alla sua durata — così il valore si vede passare invece di
   * sparire, che è metà del motivo per cui esiste il ritmo scritto.
   */
  useEffect(() => {
    if (done || !step || required.length > 0) return;
    const wait = Math.min(900, Math.max(320, (step.beats * 60_000) / bpm));
    const t = setTimeout(() => {
      const updated = [...results];
      updated[idx] = 'correct';
      setResults(updated);
      goToStep(idx + 1, updated);
    }, wait);
    return () => clearTimeout(t);
  }, [idx, required.length, done, step, results, goToStep, bpm]);

  const press = useCallback(
    (toneNote: string, source: 'right' | 'left') => {
      if (done || !step) return;
      const target = missing.find(n => sameNote(n, toneNote));

      if (!target) {
        stepErrorRef.current = true;
        setMistakes(m => m + 1);
        haptics.wrong();
        // Il tasto sbagliato diventa rosso: è tutto il responso che serve
        // mentre si suona.
        setWrong({ note: toneNote, hand: source });
        const expected = missing[0];
        if (expected) {
          const delta = midiOf(toneNote) - midiOf(expected);
          const distance = Math.abs(delta);
          const relation = distance === 0 ? 'nell’ottava sbagliata' : `${distance} ${distance === 1 ? 'semitono' : 'semitoni'} ${delta > 0 ? 'sopra' : 'sotto'}`;
          setFeedback(`Hai suonato ${italianOf(toneNote)}; serve ${italianOf(expected)} (${relation}).`);
        }
        // Il verso d'errore aiuta, e non deve rientrare nel microfono.
        audio.playError();
        mic.suppress(700);
        setTimeout(() => setWrong(null), 450);
        return;
      }

      audio.playNote(toneNote, 0.9);
      mic.suppress(900);
      const nextFound = [...found, target];
      setFound(nextFound);
      setFeedback(null);
      haptics.tap();
      if (nextFound.length >= required.length) completeStep();
    },
    [done, step, missing, found, required.length, completeStep, audio, mic],
  );

  // Microfono: l'app dice quali note aspetta, e il microfono le cerca tutte
  // insieme. Dal microfono non arrivano errori: una nota "sentita male" non
  // deve diventare uno sbaglio mai fatto.
  // Mentre questa mano ha una pausa o una nota legata, i passi scorrono da
  // soli; il microfono intanto aspetta già il prossimo passo in cui suoni: chi
  // suona a tempo non deve aspettare che le pause finiscano di scorrere.
  const waitIdx = useMemo(() => {
    for (let j = idx; j < part.to; j++) if (requiredNotes(piece.steps, j, hand).length > 0) return j;
    return -1;
  }, [idx, part.to, piece.steps, hand]);
  const waitRequired = useMemo(() => (waitIdx < 0 ? [] : requiredNotes(piece.steps, waitIdx, hand)), [waitIdx, piece.steps, hand]);

  const expect = mic.expect;
  useEffect(() => {
    expect(mic.isListening && !done && waitIdx >= 0 ? waitRequired.map(midiOf) : null, `${waitIdx}-${hand}`);
  }, [expect, mic.isListening, done, waitIdx, waitRequired, hand]);
  useEffect(() => () => expect(null), [expect]);

  /** Note arrivate per un passo più avanti (dopo pause o legature): si va lì e si contano. */
  const pendingRef = useRef<{ at: number; midis: number[] } | null>(null);

  const acceptFromMic = useCallback(
    (midis: number[]) => {
      if (done || !step || midis.length === 0) return;
      if (waitIdx > idx) {
        if (!waitRequired.some(n => midis.includes(midiOf(n)))) return;
        const updated = [...results];
        for (let j = idx; j < waitIdx; j++) updated[j] = 'correct';
        setResults(updated);
        pendingRef.current = { at: waitIdx, midis };
        goToStep(waitIdx, updated);
        return;
      }
      const targets = missing.filter(n => midis.includes(midiOf(n)));
      if (targets.length === 0) return;
      const nextFound = [...found, ...targets];
      setFound(nextFound);
      setFeedback(null);
      haptics.tap();
      if (nextFound.length >= required.length) completeStep();
    },
    [done, step, waitIdx, idx, waitRequired, results, goToStep, missing, found, required.length, completeStep],
  );

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending || pending.at !== idx) return;
    pendingRef.current = null;
    acceptFromMic(pending.midis);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const m = mic.chordMatch;
    if (!mic.isListening || !m || m.id <= micBaseRef.current) return;
    micBaseRef.current = m.id;
    acceptFromMic(m.midis);
  }, [mic.chordMatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // E l'ascolto di una nota alla volta, insieme: se una delle due la sente,
  // la nota giusta vale (l'ottava si perdona). Le altre non contano.
  const monoBaseRef = useRef(mic.confirmedNote?.id ?? 0);
  // La conferma in ritardo della nota di prima non vale per il passo dopo.
  const stepSinceRef = useRef(0);
  useEffect(() => { stepSinceRef.current = Date.now(); }, [idx, hand]);
  useEffect(() => {
    const c = mic.confirmedNote;
    if (!mic.isListening || !c || c.id <= monoBaseRef.current) return;
    monoBaseRef.current = c.id;
    if ((c.onsetAt ?? Date.now()) < stepSinceRef.current - 30) return;
    const heard = midiOf(`${c.note.name}${c.note.octave}`);
    const pool = waitIdx > idx ? waitRequired : missing;
    acceptFromMic(pool.filter(n => (midiOf(n) - heard) % 12 === 0).slice(0, 1).map(midiOf));
  }, [mic.confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Riparte dall'inizio della sezione corrente. */
  const reset = useCallback(
    (at: number) => {
      stopListening();
      savedRef.current = false;
      setIdx(at);
      setFound([]);
      setResults(piece.steps.map(() => 'unanswered'));
      setMistakes(0);
      setDone(false);
      setShowKeys(false);
      setFeedback(null);
      setSuggestedBpm(null);
      stepErrorRef.current = false;
    },
    [piece.steps, stopListening],
  );

  const switchHand = useCallback((h: Hand) => { setHand(h); reset(part.from); }, [reset, part.from]);
  const switchPart = useCallback(
    (i: number) => { setLoopBars(0); setLoopMeasure(0); setPartIdx(i); reset(parts[i].from); },
    [reset, parts],
  );

  const switchLoop = useCallback(
    (bars: 0 | 1 | 2 | 4, measurePos = loopMeasure) => {
      setLoopBars(bars);
      setLoopMeasure(measurePos);
      if (bars === 0) reset(basePart.from);
      else reset(availableMeasures[Math.min(measurePos, availableMeasures.length - 1)]?.indices[0] ?? basePart.from);
    },
    [loopMeasure, reset, basePart.from, availableMeasures],
  );

  useEffect(() => stopListening, [stopListening]);

  if (done) {
    const slice = results.slice(part.from, part.to);
    const ok = slice.filter(r => r === 'correct').length;
    const pct = Math.round((ok / Math.max(1, slice.length)) * 100);
    const handLabel = hand === 'right' ? 'mano destra' : hand === 'left' ? 'mano sinistra' : 'due mani';
    const nextPart = partIdx + 1 < parts.length - 1 ? parts[partIdx + 1] : null;
    return (
      <>
        {pct === 100 && <Confetti />}
        <Card className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">{pct === 100 ? '🏆' : pct >= 80 ? '🎹' : '💪'}</div>
          <h2 className="text-2xl font-black text-ink">
            {pct === 100 ? 'Suonato!' : 'Fine'}
          </h2>
          <p className="text-sm text-ink2">
            {piece.title} · {part.name} · {handLabel}
          </p>
          <p className="text-sm text-ink2">
            {pct}% · {mistakes} {mistakes === 1 ? 'errore' : 'errori'}
          </p>
          {smartLoop && suggestedBpm !== null && (
            <Panel className="w-full px-4 py-3 text-sm text-ink2">
              {suggestedBpm > bpm
                ? `Due esecuzioni pulite: il prossimo giro sale con calma a ${suggestedBpm} BPM.`
                : pct === 100
                ? `Ottimo primo giro a ${bpm} BPM. Ripetilo ancora una volta prima di accelerare.`
                : `Resta a ${bpm} BPM: prima rendiamo stabile il passaggio, poi acceleriamo.`}
            </Panel>
          )}
          {hand !== 'both' ? (
            <Panel className="w-full px-4 py-3 text-xs leading-relaxed text-ink2">
              Prossimo passo: {hand === 'right' ? 'la stessa parte con la mano sinistra' : 'le due mani insieme'},
              sempre su questa sezione. È così che si impara un pezzo — mai tutto in una volta.
            </Panel>
          ) : nextPart ? (
            <Panel className="w-full px-4 py-3 text-xs leading-relaxed text-ink2">
              Questa sezione la sai. Passa a <b>{nextPart.name}</b>, e quando anche quella regge,
              provale attaccate scegliendo «Tutto».
            </Panel>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2.5">
            <Btn variant="soft" onClick={() => { if (suggestedBpm) setBpm(suggestedBpm); reset(part.from); }}>
              {suggestedBpm && suggestedBpm > bpm ? `Ripeti a ${suggestedBpm} BPM` : 'Riprova il loop'}
            </Btn>
            {hand !== 'both' && (
              <Btn onClick={() => switchHand(hand === 'right' ? 'left' : 'both')}>
                {hand === 'right' ? 'Mano sinistra' : 'Insieme'}
              </Btn>
            )}
            {hand === 'both' && nextPart && (
              <Btn onClick={() => switchPart(partIdx + 1)}>{nextPart.name}</Btn>
            )}
            <Btn variant="soft" onClick={onBack}>Altri pezzi</Btn>
          </div>
        </Card>
      </>
    );
  }

  const hintKeys = showKeys ? missing : [];
  const tied = isFullyTied(piece.steps, idx, hand);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="rounded-lg bg-surface2 p-2 text-ink2 active:scale-95">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{piece.emoji} {piece.title}</p>
          <p className="text-xs text-ink3">
            {piece.composer} · {tonality.label} · {piece.meter}
          </p>
        </div>
        <span className="text-xs tabular-nums text-ink3">{doneCount + 1}/{total}</span>
      </div>

      {/* Selettore della sezione: un pezzo lungo si studia a pezzi */}
      {parts.length > 1 && (
        <div className="thin-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {parts.map((sec, i) => (
            <button
              key={sec.name}
              type="button"
              onClick={() => switchPart(i)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                i === partIdx ? 'border-brand bg-brand/15 text-brand' : 'border-line bg-surface2 text-ink2'
              }`}
            >
              {sec.name}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface2 p-2.5">
        <div className="flex items-center gap-1.5">
          <span className="mr-auto text-[11px] font-black uppercase tracking-wide text-ink3">Loop battute</span>
          {([0, 1, 2, 4] as const).map(n => (
            <button key={n} type="button" onClick={() => switchLoop(n)} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${loopBars === n ? 'bg-brand text-white' : 'bg-surface text-ink2'}`}>
              {n === 0 ? 'Sezione' : n}
            </button>
          ))}
        </div>
        {loopBars > 0 && availableMeasures.length > 1 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-ink3">inizio</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, availableMeasures.length - loopBars)}
              value={Math.min(loopMeasure, Math.max(0, availableMeasures.length - loopBars))}
              onChange={e => switchLoop(loopBars, Number(e.target.value))}
              className="w-full accent-[var(--c-brand)]"
              aria-label="Battuta iniziale del loop"
            />
            <span className="min-w-12 text-right text-[10px] font-bold text-ink2">{part.name}</span>
          </div>
        )}
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

      {part.note && <p className="px-1 text-[11px] leading-snug text-ink3">{part.note}</p>}

      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface2 px-3 py-2">
        <button
          type="button"
          onClick={() => (playing ? stopListening() : listen(hand))}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white active:scale-95"
        >
          {playing ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {playing ? 'Ferma' : 'Ascolta'}
        </button>
        {hand !== 'both' && !playing && (
          <button
            type="button"
            onClick={() => listen('both')}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink2 active:scale-95"
            aria-label="Ascolta tutte e due le mani"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        )}
        {!playing && part.to - part.from < piece.steps.length && (
          <button
            type="button"
            onClick={() => listen('both', true)}
            className="whitespace-nowrap rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink2 active:scale-95"
          >
            tutto il brano
          </button>
        )}
        <div className="flex flex-1 items-center gap-2">
          <span className="text-[11px] tabular-nums text-ink3">{bpm}</span>
          <input
            type="range"
            min={30}
            max={Math.max(140, piece.bpm + 20)}
            step={2}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-full accent-[var(--c-brand)]"
            aria-label="Tempo"
          />
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={smartLoop}
        onClick={() => setSmartLoop(v => !v)}
        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${smartLoop ? 'border-brand/40 bg-brand/10' : 'border-line bg-surface2'}`}
      >
        <span><b className="text-ink">Loop intelligente</b><span className="ml-1 text-ink3">2 giri puliti → +4 BPM</span></span>
        <span className={`h-2.5 w-2.5 rounded-full ${smartLoop ? 'bg-brand' : 'bg-ink3'}`} />
      </button>

      <GrandStaff
        piece={piece}
        activeIndex={playingIdx ?? idx}
        results={results}
        found={found}
        hand={playing ? playingHand : hand}
        fingering={fingering}
        range={playingWhole ? { from: 0, to: piece.steps.length } : { from: part.from, to: part.to }}
        listening={playingIdx !== null}
      />

      <Bar pct={doneCount / Math.max(1, total)} />

      {/* Cosa chiede questo passo, e come va suonato */}
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <p className="text-xs text-ink2">
            {tied
              ? 'Nota legata: tieni premuto, non ribattere'
              : required.length === 0
              ? 'Questa mano tace: pausa'
              : required.length === 1
              ? 'Una nota'
              : `${found.length}/${required.length} note dell'accordo`}
          </p>
          {advice && <p className="mt-0.5 text-[11px] leading-snug text-brand">{advice}</p>}
          {feedback && <p className="mt-1 text-xs font-semibold leading-snug text-red-400">{feedback}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setFingering(v => !v)}
            className="text-[11px] font-semibold text-ink3"
          >
            {fingering ? 'dita ✓' : 'dita'}
          </button>
          <button
            type="button"
            onClick={() => setShowKeys(v => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-ink3"
          >
            <Eye className="h-3.5 w-3.5" />
            {showKeys ? 'nascondi' : 'mostrami'}
          </button>
        </div>
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

      <p className="text-center text-[11px] text-ink3">
        {measures.length} battute in tutto
        {mic.isListening && ' · 🎤 microfono attivo: suona gli accordi insieme, come sono scritti'}
      </p>
    </Card>
  );
}

export function PieceView({ progress, audio, mic, notify, section, onSection, initialPieceId, onToggleMic }: PieceViewProps) {
  const [selected, setSelected] = useState<Piece | null>(() => pieces.find(p => p.id === initialPieceId) ?? null);
  const [open, setOpen] = useState<LibraryEntry | null>(null);

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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Repertorio" title="Canzoni" subtitle="Da Fra Martino a Chopin: ogni brano si apre nel Leggio." />
      <Segmented
        value={section}
        onChange={onSection}
        options={[
          { value: 'pezzi', label: 'Brani' },
          { value: 'melodie', label: 'Melodie' },
        ]}
      />

      <Library progress={progress} onOpen={setOpen} onGuided={setSelected} />

      {open && (
        <Leggio
          key={open.id}
          entry={open}
          audio={audio}
          mic={mic}
          progress={progress}
          onToggleMic={onToggleMic}
          onClose={() => setOpen(null)}
          onGuided={open.source.kind === 'piece' ? () => { const p = open.source.kind === 'piece' ? open.source.piece : null; setOpen(null); setSelected(p); } : undefined}
        />
      )}
    </div>
  );
}
