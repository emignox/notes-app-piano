// ─────────────────────────────────────────────────────────────────────────────
// Canzoncine: leggere note vere, in fila, con un senso musicale.
//
// Aggiunte rispetto a prima: tempo regolabile (rallentare per leggere è una
// tecnica, non un ripiego), metronomo, evidenziazione sincronizzata durante
// l'ascolto, punteggio migliore salvato e aiuto sull'INTERVALLO rispetto alla
// nota precedente — che è come si legge davvero una melodia.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, Lock, Play, Volume2 } from 'lucide-react';
import type { AnswerState, Melody, MelodyNote, NoteEntry, NoteResult } from '../types';
import { melodies } from '../data/melodies';
import { describePosition, intervalLabel, italianOf, motionLabel, parseNote, pitchClass, samePitchClass } from '../lib/notes';
import { haptics } from '../lib/haptics';
import type { ProgressApi } from '../hooks/useProgress';
import type { AudioApi } from '../hooks/useAudio';
import type { ConfirmedNote, LiveNote } from '../hooks/usePitchDetection';
import { Btn, Card, PageHeader, Panel, Section, Segmented } from './ui';
import { useScrollTop } from '../hooks/useScrollTop';
import type { Notify } from './ui';
import { Staff } from './Staff';
import { NoteNameButtons } from './NoteNameButtons';
import { PianoKeyboard } from './PianoKeyboard';

export type SongSection = 'melodie' | 'pezzi';

// Pausa dopo un errore rispondendo a schermo: il nome della nota resta scritto
// sul pentagramma, quindi basta il tempo di accorgersene, non di leggere.
const HOLD_WRONG = 430;

// Col microfono acceso si sta SUONANDO, e la musica ha il suo tempo: qualsiasi
// attesa fa perdere il filo. Quindi niente responso scritto e nessuna pausa —
// la nota diventa verde o rossa sul pentagramma e si tira dritto. Questi
// millisecondi servono solo a far vedere il colore prima di spostare il segno.
const FLOW_OK = 60;
const FLOW_WRONG = 90;

interface MelodyViewProps {
  progress: ProgressApi;
  audio: AudioApi;
  mic: {
    isListening: boolean;
    liveNote: LiveNote | null;
    level: number;
    confirmedNote: ConfirmedNote | null;
    suppress: (ms?: number) => void;
  };
  notify: Notify;
  section: SongSection;
  onSection: (s: SongSection) => void;
  /** Dal piano di oggi: la canzone da aprire subito. */
  initialMelodyId?: string;
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

  return (
    <button
      type="button"
      onClick={() => onSelect(melody, !open)}
      className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors active:bg-surface2"
    >
      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-surface2 text-2xl ${open ? '' : 'opacity-60 grayscale'}`}>
        {melody.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] font-semibold tracking-tight ${open ? 'text-ink' : 'text-ink2'}`}>{melody.title}</span>
        <span className="mt-0.5 block truncate text-[13px] text-ink3">
          {melody.composer} · {melody.notes.length} note · {melody.difficulty}
        </span>
        {!open && (
          <span className="mt-0.5 block truncate text-[11px] text-ink3">
            ti servono: {missing.slice(0, 6).map(t => `${italianOf(t)}${parseNote(t).octave}`).join(' ')}
            {missing.length > 6 ? ` +${missing.length - 6}` : ''}
          </span>
        )}
      </span>
      {best > 0 ? (
        <span className="flex-shrink-0 text-right text-[11px] font-semibold text-amber-400">
          {stars(best)}
          <span className="block font-medium tabular-nums text-ink3">{best}%</span>
        </span>
      ) : !open ? (
        <Lock className="h-4 w-4 flex-shrink-0 text-ink3" />
      ) : null}
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink3/60" />
    </button>
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
  mic: {
    isListening: boolean;
    liveNote: LiveNote | null;
    level: number;
    confirmedNote: ConfirmedNote | null;
    suppress: (ms?: number) => void;
  };
  notify: Notify;
  onBack: () => void;
}) {
  useScrollTop(melody.id);
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
  const nextRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (nextRef.current) clearTimeout(nextRef.current); }, []);

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
      if (nextRef.current) clearTimeout(nextRef.current);
      nextRef.current = null;
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
        if (mic.isListening) {
          // La nota l'hai appena suonata tu: rifarla dall'altoparlante rientra
          // nel microfono e, con 1,6 s di sordità, si perdeva la nota dopo —
          // che in una melodia arriva subito.
          mic.suppress(250);
        } else {
          audio.playNote(current.toneNote, secondsFor(melody.notes[idx].beats));
          mic.suppress(1600);
        }
        nextRef.current = setTimeout(() => advance(updated), mic.isListening ? FLOW_OK : 180);
      } else if (mic.isListening) {
        // Suonando: la nota si colora di rosso e si va avanti. Nessun verso
        // d'errore dall'altoparlante, che oltre a interrompere rientrerebbe
        // nel microfono.
        haptics.wrong();
        nextRef.current = setTimeout(() => advance(updated), FLOW_WRONG);
      } else {
        haptics.wrong();
        audio.playError();
        mic.suppress(400); // il verso dell'errore non deve rientrare come nota
        setHintOpen(true);
        // Si prosegue da soli: toccando lo schermo non c'è un tempo musicale
        // da rispettare, e sapere qual era la nota vale più della fretta.
        nextRef.current = setTimeout(() => advance(updated), HOLD_WRONG);
      }
    },
    [state, done, current, results, idx, audio, mic, secondsFor, melody.notes, advance],
  );

  // Risposta suonata sul piano vero. Prima le canzoncine ricevevano solo la
  // funzione per silenziare il microfono, non le note che sentiva: si potevano
  // fare solo toccando lo schermo.
  const micBaseRef = useRef(mic.confirmedNote?.id ?? 0);
  useEffect(() => {
    if (!mic.isListening || !mic.confirmedNote || state !== 'idle' || done) return;
    if (mic.confirmedNote.id <= micBaseRef.current) return;
    micBaseRef.current = mic.confirmedNote.id;
    submit(`${mic.confirmedNote.note.name}${mic.confirmedNote.note.octave}`);
  }, [mic.confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {mic.isListening && state === 'idle' && !done && (
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

      {/* Nessun riquadro di responso: la nota diventa verde o rossa sul
          pentagramma e, se sbagliata, ci compare sotto il suo nome in piccolo.
          Un banner sposterebbe la pagina e ti farebbe aspettare proprio mentre
          stai suonando a tempo. */}

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

export function MelodyView({ progress, audio, mic, notify, section, onSection, initialMelodyId }: MelodyViewProps) {
  const [selected, setSelected] = useState<Melody | null>(
    () => melodies.find(m => m.id === initialMelodyId) ?? null,
  );
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

  const locked = melodies.filter(m => !open.includes(m));
  const row = (m: Melody) => (
    <MelodyCard
      key={m.id}
      melody={m}
      learned={learned}
      best={progress.data.melodyBest[m.id] ?? 0}
      onSelect={mel => setSelected(mel)}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Repertorio" title="Canzoni" subtitle="Melodie a una mano: leggi le note una dopo l'altra, al tuo tempo." />
      <Segmented
        value={section}
        onChange={onSection}
        options={[
          { value: 'pezzi', label: 'Brani' },
          { value: 'melodie', label: 'Melodie' },
        ]}
      />
      {open.length > 0 && (
        <Section label="Le puoi già leggere" action={<span className="text-xs tabular-nums text-ink3">{open.length}</span>}>
          <div className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">{open.map(row)}</div>
        </Section>
      )}
      {locked.length > 0 && (
        <Section label="Con le prossime note" action={<span className="text-xs tabular-nums text-ink3">{locked.length}</span>}>
          <div className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">{locked.map(row)}</div>
        </Section>
      )}
    </div>
  );
}
