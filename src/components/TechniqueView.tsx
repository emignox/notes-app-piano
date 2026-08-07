// ─────────────────────────────────────────────────────────────────────────────
// Tecnica: scale, arpeggi, accordi.
//
// Perché sta separato dal resto: leggere una nota isolata e SUONARE una figura
// sono due abilità diverse. Qui non si indovina il nome — si esegue, in ordine,
// con la diteggiatura giusta, e l'app segue il passo.
//
// Gli accordi con il microfono si controllano ARPEGGIANDOLI: il rilevatore di
// altezza sente una nota per volta, quindi le note premute insieme non le può
// distinguere. È un limite vero, e nell'app è detto invece che nascosto.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Hand as HandIcon, Play, RotateCcw, Volume2 } from 'lucide-react';
import type { NoteEntry, NoteResult } from '../types';
import type { ConfirmedNote, LiveNote } from '../hooks/usePitchDetection';
import type { AudioApi } from '../hooks/useAudio';
import type { ProgressApi } from '../hooks/useProgress';
import {
  CHORDS,
  PATTERN_EXPLAIN,
  SCALE_EXPLAIN,
  applyPattern,
  buildChord,
  buildScale,
  chordSymbol,
  invert,
  inversionsOf,
} from '../lib/harmony';
import type { ArpeggioPattern } from '../lib/harmony';
import { accidentalKind, fullLabel, italianOf, midiOf, parseNote, sameNote, samePitchClass, vexKeyOf } from '../lib/notes';
import { haptics } from '../lib/haptics';
import { arpeggioExercises, chordExercises, scaleExercises } from '../data/technique';
import type { ArpeggioExercise, ChordExercise, ScaleExercise } from '../data/technique';
import { Btn, Card, Panel, Pill, Segmented, SectionTitle } from './ui';
import { useScrollTop } from '../hooks/useScrollTop';
import type { Notify } from './ui';
import { Staff } from './Staff';
import { ChordStaff } from './ChordStaff';
import { PianoKeyboard } from './PianoKeyboard';
import { RichText } from './RichText';

export type TechniqueSection = 'scale' | 'arpeggi' | 'accordi';

interface MicApi {
  isListening: boolean;
  liveNote: LiveNote | null;
  level: number;
  confirmedNote: ConfirmedNote | null;
  suppress: (ms?: number) => void;
}

interface TechniqueViewProps {
  progress: ProgressApi;
  audio: AudioApi;
  mic: MicApi;
  notify: Notify;
}

const LEVEL_TONE = { base: 'good', intermedio: 'warn', avanzato: 'bad' } as const;

function toEntry(note: string, i: number): NoteEntry {
  const { acc } = parseNote(note);
  return {
    id: `${note}-${i}`,
    clef: midiOf(note) < 60 ? 'bass' : 'treble',
    pitch: note,
    displayName: italianOf(note),
    englishName: note,
    vexflowKey: vexKeyOf(note),
    accidental: accidentalKind(acc),
    noteValue: 'quarter',
    toneNote: note,
    stageId: 'technique',
  };
}

function rangeFor(notes: string[]): { from: string; to: string } {
  const octaves = notes.map(n => parseNote(n).octave);
  return { from: `C${Math.min(...octaves)}`, to: `B${Math.max(...octaves)}` };
}

// ── Esecuzione passo-passo (scale e arpeggi) ────────────────────────────────

function Runner({
  title,
  subtitle,
  notes,
  fingering,
  hand,
  onHand,
  teaching,
  audio,
  mic,
  onBack,
  extra,
}: {
  title: string;
  subtitle: string;
  notes: string[];
  /** Un dito per nota, oppure vuoto se non si mostra. */
  fingering: number[];
  hand: 'right' | 'left';
  onHand: (h: 'right' | 'left') => void;
  teaching: string;
  audio: AudioApi;
  mic: MicApi;
  onBack: () => void;
  extra?: React.ReactNode;
}) {
  useScrollTop(title);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<NoteResult[]>(() => notes.map(() => 'unanswered'));
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  const entries = useMemo(() => notes.map(toEntry), [notes]);
  const range = useMemo(() => rangeFor(notes), [notes]);
  const target = notes[idx];

  const press = useCallback(
    (played: string) => {
      if (done || !target) return;
      // Sulla tastiera a schermo si pretende l'ottava esatta; col microfono no,
      // perché l'ottava rilevata può ballare ed è la figura che conta.
      const ok = sameNote(played, target) || samePitchClass(played, target);
      if (!ok) {
        haptics.wrong();
        setWrongFlash(played);
        setTimeout(() => setWrongFlash(null), 400);
        return;
      }
      haptics.correct();
      setResults(prev => {
        const next = [...prev];
        next[idx] = 'correct';
        return next;
      });
      if (idx + 1 >= notes.length) setDone(true);
      else setIdx(idx + 1);
    },
    [done, target, idx, notes.length],
  );

  // Nota suonata sul piano vero.
  const micBaseRef = useRef(mic.confirmedNote?.id ?? 0);
  useEffect(() => {
    if (!mic.isListening || !mic.confirmedNote || done) return;
    if (mic.confirmedNote.id <= micBaseRef.current) return;
    micBaseRef.current = mic.confirmedNote.id;
    press(`${mic.confirmedNote.note.name}${mic.confirmedNote.note.octave}`);
  }, [mic.confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  const listen = useCallback(() => {
    const seq = notes.map(n => ({ toneNote: n, durationSec: 0.42 }));
    mic.suppress(Math.ceil((seq.length * 0.42 + 1) * 1000));
    audio.playSequence(seq, i => setPlayingIdx(i), () => setPlayingIdx(null));
  }, [notes, audio, mic]);

  const restart = useCallback(() => {
    setIdx(0);
    setResults(notes.map(() => 'unanswered'));
    setDone(false);
  }, [notes]);

  const finger = fingering[idx];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="rounded-lg bg-surface2 p-2 text-ink2 active:scale-95">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{title}</p>
          <p className="text-xs text-ink3">{subtitle}</p>
        </div>
        <span className="text-xs tabular-nums text-ink3">
          {Math.min(idx + 1, notes.length)}/{notes.length}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={hand}
          onChange={onHand}
          options={[
            { value: 'right' as const, label: 'Destra' },
            { value: 'left' as const, label: 'Sinistra' },
          ]}
        />
        <Btn variant="soft" onClick={listen} className="px-3 py-2">
          <Volume2 className="h-4 w-4" />
          Ascolta
        </Btn>
        <Btn variant="soft" onClick={restart} className="px-3 py-2">
          <RotateCcw className="h-4 w-4" />
        </Btn>
      </div>

      {extra}

      <Staff
        entries={entries}
        activeIndex={playingIdx ?? idx}
        results={results}
        answerState="idle"
        variant="sequence"
      />

      {!done && (
        <Panel className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-ink3">nota da suonare</p>
            <p className="text-xl font-black text-ink">{fullLabel(target ?? 'C4', 'both')}</p>
          </div>
          {finger ? (
            <div className="flex flex-col items-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-xl font-black text-white">
                {finger}
              </span>
              <span className="mt-0.5 text-[10px] text-ink3">dito</span>
            </div>
          ) : null}
        </Panel>
      )}

      {done && (
        <Panel className="flex items-center justify-between gap-3 border-emerald-500/50 bg-emerald-500/10 px-4 py-3">
          <p className="font-bold text-emerald-400">Figura completata 🎹</p>
          <Btn variant="soft" onClick={restart} className="px-3 py-2">
            Ancora
          </Btn>
        </Panel>
      )}

      {mic.isListening && !done && (
        <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand/10 px-4 py-2.5">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
          </span>
          <span className="text-sm text-ink2">Suonala sul piano…</span>
          <span className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-brand/20">
            <span
              className="h-full rounded-full bg-brand transition-[width] duration-75"
              style={{ width: `${Math.round(mic.level * 100)}%` }}
            />
          </span>
          {mic.liveNote && (
            <span className="rounded-lg bg-brand px-3 py-1 text-base font-bold text-white">
              {italianOf(mic.liveNote.name)}
              {mic.liveNote.octave}
            </span>
          )}
        </div>
      )}

      <Panel className="p-2">
        <p className="mb-1.5 px-1 text-[11px] text-ink3">
          {mic.isListening ? 'oppure tocca il tasto' : 'tocca il tasto'}
        </p>
        <PianoKeyboard
          from={range.from}
          to={range.to}
          onPress={press}
          // Tutta la figura resta accesa, la nota di turno di più: così si vede
          // dove si sta andando, non solo il passo successivo.
          hint={notes}
          active={target ?? null}
          wrong={wrongFlash}
          labels="c"
          compact
        />
      </Panel>

      <Panel className="space-y-1.5 px-3 py-2.5 text-xs leading-relaxed text-ink2">
        {teaching.split('\n\n').map((par, i) => (
          <p key={i}><RichText text={par} /></p>
        ))}
      </Panel>
    </Card>
  );
}

// ── Scale ───────────────────────────────────────────────────────────────────

function ScaleRunner({
  ex,
  audio,
  mic,
  onBack,
}: {
  ex: ScaleExercise;
  audio: AudioApi;
  mic: MicApi;
  onBack: () => void;
}) {
  const [hand, setHand] = useState<'right' | 'left'>('right');
  const [direction, setDirection] = useState<'salita' | 'discesa' | 'andata e ritorno'>('salita');

  // La sinistra suona un'ottava sotto: è lì che sta davvero, non sopra il Do centrale.
  const base = useMemo(() => {
    const root = hand === 'left' ? `${parseNote(ex.root).letter}${parseNote(ex.root).octave - 1}` : ex.root;
    const { acc } = parseNote(ex.root);
    return buildScale(`${parseNote(root).letter}${acc}${parseNote(root).octave}`, ex.type, 1);
  }, [ex, hand]);

  const notes = useMemo(() => {
    if (direction === 'discesa') return [...base].reverse();
    if (direction === 'andata e ritorno') return [...base, ...[...base].reverse().slice(1)];
    return base;
  }, [base, direction]);

  const fingering = useMemo(() => {
    const one = hand === 'right' ? ex.rh : ex.lh;
    if (direction === 'discesa') return [...one].reverse();
    if (direction === 'andata e ritorno') return [...one, ...[...one].reverse().slice(1)];
    return one;
  }, [ex, hand, direction]);

  return (
    <Runner
      key={`${ex.id}-${hand}-${direction}`}
      title={`Scala di ${ex.title}`}
      subtitle={`${notes.length} note · mano ${hand === 'right' ? 'destra' : 'sinistra'}`}
      notes={notes}
      fingering={fingering}
      hand={hand}
      onHand={setHand}
      teaching={`${ex.note}\n\n${SCALE_EXPLAIN[ex.type]}`}
      audio={audio}
      mic={mic}
      onBack={onBack}
      extra={
        <Segmented
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'salita' as const, label: 'Salita' },
            { value: 'discesa' as const, label: 'Discesa' },
            { value: 'andata e ritorno' as const, label: 'Su e giù' },
          ]}
        />
      }
    />
  );
}

// ── Arpeggi ─────────────────────────────────────────────────────────────────

function ArpeggioRunner({
  ex,
  audio,
  mic,
  onBack,
}: {
  ex: ArpeggioExercise;
  audio: AudioApi;
  mic: MicApi;
  onBack: () => void;
}) {
  const [hand, setHand] = useState<'right' | 'left'>('right');
  const [pattern, setPattern] = useState<ArpeggioPattern>('salita');

  const ascending = useMemo(() => {
    const p = parseNote(ex.root);
    const root = hand === 'left' ? `${p.letter}${p.acc}${p.octave - 1}` : ex.root;
    const chord = buildChord(root, ex.quality);
    const top = `${parseNote(chord[0]).letter}${parseNote(chord[0]).acc}${parseNote(chord[0]).octave + 1}`;
    return ex.quality === 'settima di dominante' ? chord : [...chord, top];
  }, [ex, hand]);

  const notes = useMemo(() => applyPattern(ascending, pattern), [ascending, pattern]);

  const fingering = useMemo(() => {
    const one = hand === 'right' ? ex.rh : ex.lh;
    // Le diteggiature sono date per la salita: negli altri versi si segue la
    // stessa mappa nota→dito invece di inventare numeri.
    const map = new Map(ascending.map((n, i) => [n, one[i]]));
    return notes.map(n => map.get(n) ?? 0);
  }, [ex, hand, ascending, notes]);

  return (
    <Runner
      key={`${ex.id}-${hand}-${pattern}`}
      title={`Arpeggio di ${ex.title}`}
      subtitle={`${notes.length} note · ${pattern}`}
      notes={notes}
      fingering={fingering}
      hand={hand}
      onHand={setHand}
      teaching={`${ex.note}\n\n${PATTERN_EXPLAIN[pattern]}`}
      audio={audio}
      mic={mic}
      onBack={onBack}
      extra={
        <Segmented
          value={pattern}
          onChange={setPattern}
          options={[
            { value: 'salita' as const, label: 'Salita' },
            { value: 'discesa' as const, label: 'Discesa' },
            { value: 'andata e ritorno' as const, label: 'Su e giù' },
            { value: 'alternato' as const, label: 'Alternato' },
          ]}
        />
      }
    />
  );
}

// ── Accordi ─────────────────────────────────────────────────────────────────

function ChordStudy({
  ex,
  audio,
  mic,
  onBack,
}: {
  ex: ChordExercise;
  audio: AudioApi;
  mic: MicApi;
  onBack: () => void;
}) {
  useScrollTop(ex.id);
  const [inversion, setInversion] = useState(0);
  // Le note premute valgono per la posizione in cui sono state premute: se si
  // cambia rivolto ripartono da zero, senza bisogno di azzerarle in un effetto.
  const [pressed, setPressed] = useState<{ inversion: number; notes: string[] }>({
    inversion: 0,
    notes: [],
  });
  const hit = pressed.inversion === inversion ? pressed.notes : [];
  const setHit = (notes: string[]) => setPressed({ inversion, notes });

  const spec = CHORDS[ex.quality];
  const rootPosition = useMemo(() => buildChord(ex.root, ex.quality), [ex]);
  const notes = useMemo(() => invert(rootPosition, inversion), [rootPosition, inversion]);
  const inversions = useMemo(() => inversionsOf(ex.quality), [ex]);
  const info = inversions[inversion];
  const range = useMemo(() => rangeFor(notes), [notes]);

  const missing = notes.filter(n => !hit.some(h => samePitchClass(h, n)));
  const complete = missing.length === 0;

  const press = useCallback(
    (played: string) => {
      if (notes.some(n => samePitchClass(n, played))) {
        setPressed(prev => {
          const current = prev.inversion === inversion ? prev.notes : [];
          if (current.some(h => samePitchClass(h, played))) return { inversion, notes: current };
          return { inversion, notes: [...current, played] };
        });
        haptics.correct();
      } else {
        haptics.wrong();
      }
    },
    [notes, inversion],
  );

  const micBaseRef = useRef(mic.confirmedNote?.id ?? 0);
  useEffect(() => {
    if (!mic.isListening || !mic.confirmedNote) return;
    if (mic.confirmedNote.id <= micBaseRef.current) return;
    micBaseRef.current = mic.confirmedNote.id;
    press(`${mic.confirmedNote.note.name}${mic.confirmedNote.note.octave}`);
  }, [mic.confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  const listenTogether = useCallback(() => {
    mic.suppress(2200);
    audio.playChord(notes, 1.8);
  }, [notes, audio, mic]);

  const listenArpeggio = useCallback(() => {
    mic.suppress(Math.ceil((notes.length * 0.4 + 1) * 1000));
    audio.playSequence(notes.map(n => ({ toneNote: n, durationSec: 0.4 })));
  }, [notes, audio, mic]);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="rounded-lg bg-surface2 p-2 text-ink2 active:scale-95">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">
            {ex.title} <span className="text-ink3">· {chordSymbol(ex.root, ex.quality)}</span>
          </p>
          <p className="text-xs text-ink3">{ex.quality} · {spec.formula}</p>
        </div>
      </div>

      {/* Le posizioni: è la domanda "standard, reverse, middle" */}
      <div>
        <p className="mb-1.5 text-[11px] uppercase tracking-wider text-ink3">posizione</p>
        <Segmented
          value={String(inversion)}
          onChange={v => setInversion(Number(v))}
          options={inversions.map(i => ({
            value: String(i.index),
            label: i.index === 0 ? 'Fondam.' : `${i.index}° riv.`,
          }))}
        />
      </div>

      <ChordStaff notes={notes} />

      <Panel className="space-y-1.5 px-4 py-3 text-sm leading-relaxed">
        <p className="font-bold text-ink">
          {info.name} <span className="font-normal text-ink3">({info.english})</span>
        </p>
        <p className="text-ink2"><RichText text={info.explain} /></p>
        <p className="text-ink2">
          Note dal basso: <span className="font-bold text-ink">{notes.map(n => italianOf(n)).join(' – ')}</span>
        </p>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Btn variant="soft" onClick={listenTogether} className="px-3 py-2">
          <Volume2 className="h-4 w-4" />
          Insieme
        </Btn>
        <Btn variant="soft" onClick={listenArpeggio} className="px-3 py-2">
          <Play className="h-4 w-4" />
          Arpeggiato
        </Btn>
      </div>

      <Panel className="p-2">
        <div className="mb-1.5 flex items-center justify-between px-1">
          <p className="text-[11px] text-ink3">
            {complete ? 'accordo completo ✓' : `premi le note: ne mancano ${missing.length}`}
          </p>
          {hit.length > 0 && (
            <button type="button" onClick={() => setHit([])} className="text-[11px] font-semibold text-brand">
              azzera
            </button>
          )}
        </div>
        <PianoKeyboard
          from={range.from}
          to={range.to}
          onPress={press}
          hint={notes}
          labels="c"
          compact
        />
      </Panel>

      {mic.isListening && (
        <Panel className="px-3 py-2.5 text-xs leading-relaxed text-ink2">
          🎤 Col microfono l'accordo va <span className="font-bold text-ink">arpeggiato</span>, una nota
          per volta: il rilevatore sente una sola altezza alla volta e note premute insieme non sa
          separarle. Non è un difetto dell'app, è come funziona il riconoscimento dal suono.
        </Panel>
      )}

      <Panel className="space-y-1.5 px-3 py-2.5 text-xs leading-relaxed text-ink2">
        <p><RichText text={spec.explain} /></p>
        <p className="text-ink3"><RichText text={ex.usage} /></p>
      </Panel>
    </Card>
  );
}

// ── Elenco ──────────────────────────────────────────────────────────────────

function Row({
  title,
  desc,
  level,
  onClick,
}: {
  title: string;
  desc: string;
  level: 'base' | 'intermedio' | 'avanzato';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-ink">{title}</span>
          <Pill tone={LEVEL_TONE[level]}>{level}</Pill>
        </div>
        <p className="mt-0.5 text-xs leading-snug text-ink2">{desc}</p>
      </div>
      <HandIcon className="h-4 w-4 flex-shrink-0 text-ink3" />
    </button>
  );
}

export function TechniqueView({ audio, mic }: TechniqueViewProps) {
  const [section, setSection] = useState<TechniqueSection>('scale');
  const [scale, setScale] = useState<ScaleExercise | null>(null);
  const [arp, setArp] = useState<ArpeggioExercise | null>(null);
  const [chord, setChord] = useState<ChordExercise | null>(null);

  if (scale) return <ScaleRunner ex={scale} audio={audio} mic={mic} onBack={() => setScale(null)} />;
  if (arp) return <ArpeggioRunner ex={arp} audio={audio} mic={mic} onBack={() => setArp(null)} />;
  if (chord) return <ChordStudy ex={chord} audio={audio} mic={mic} onBack={() => setChord(null)} />;

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        value={section}
        onChange={setSection}
        options={[
          { value: 'scale' as const, label: 'Scale' },
          { value: 'arpeggi' as const, label: 'Arpeggi' },
          { value: 'accordi' as const, label: 'Accordi' },
        ]}
      />

      {section === 'scale' && (
        <Card>
          <SectionTitle hint="Con la diteggiatura standard: è quella il contenuto dell'esercizio">
            Scale
          </SectionTitle>
          <div className="mt-2 flex flex-col gap-2">
            {scaleExercises.map(ex => (
              <Row
                key={ex.id}
                title={ex.title}
                desc={ex.note}
                level={ex.level}
                onClick={() => setScale(ex)}
              />
            ))}
          </div>
        </Card>
      )}

      {section === 'arpeggi' && (
        <Card>
          <SectionTitle hint="Salita, discesa, su e giù, alternato">Arpeggi</SectionTitle>
          <div className="mt-2 flex flex-col gap-2">
            {arpeggioExercises.map(ex => (
              <Row
                key={ex.id}
                title={ex.title}
                desc={ex.note}
                level={ex.level}
                onClick={() => setArp(ex)}
              />
            ))}
          </div>
        </Card>
      )}

      {section === 'accordi' && (
        <Card>
          <SectionTitle hint="Fondamentale e rivolti, spiegati">Accordi</SectionTitle>
          <div className="mt-2 flex flex-col gap-2">
            {chordExercises.map(ex => (
              <Row
                key={ex.id}
                title={`${ex.title} · ${chordSymbol(ex.root, ex.quality)}`}
                desc={ex.usage}
                level={ex.level}
                onClick={() => setChord(ex)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
