// ─────────────────────────────────────────────────────────────────────────────
// La carta dell'esercizio. Due direzioni:
//
//  read → vedi la nota sul pentagramma, dici come si chiama
//  find → leggi il nome, lo trovi sulla tastiera
//
// Scelte didattiche:
//  · il suono NON anticipa la risposta (altrimenti si allena l'orecchio, non la
//    lettura): si sente dopo, quando serve a legare segno e suono;
//  · l'aiuto compare da solo dopo qualche secondo e spiega il PERCHÉ (nota di
//    riferimento, posizione, gruppo di tasti neri), non solo la risposta;
//  · l'errore non si salta: mostra dov'era la nota e chiede una conferma.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronRight, Lightbulb, Volume2, XCircle, Zap } from 'lucide-react';
import type { AnswerState, Direction, NoteEntry } from '../types';
import type { LiveNote } from '../hooks/usePitchDetection';
import type { Settings } from '../lib/storage';
import { speedOf } from '../lib/srs';
import {
  describePosition,
  fullLabel,
  italianOf,
  keyboardHint,
  label as noteLabel,
  landmarkHint,
  parseNote,
  pitchClass,
  samePitchClass,
} from '../lib/notes';
import { haptics } from '../lib/haptics';
import { Btn, Panel, Pill } from './ui';
import { Staff } from './Staff';
import { NoteNameButtons } from './NoteNameButtons';
import { PianoKeyboard } from './PianoKeyboard';

export interface PracticeCardProps {
  note: NoteEntry;
  dir: Direction;
  isNew: boolean;
  index: number;
  total: number;
  streak: number;
  settings: Settings;
  keyFrom: string;
  keyTo: string;
  showAccidentals: boolean;
  micActive: boolean;
  liveNote: LiveNote | null;
  confirmedNote: { note: LiveNote; id: number } | null;
  onResult: (correct: boolean, ms: number, usedHint: boolean) => void;
  onToggleInput: () => void;
  playNote: (toneNote: string, duration?: number) => void;
  playError: () => void;
  suppressMic: (ms?: number) => void;
}

const SPEED_PILLS = {
  fast: { text: 'Fulmine', tone: 'good' as const, icon: true },
  ok: { text: 'Bene', tone: 'brand' as const, icon: false },
  slow: { text: 'Ci hai pensato', tone: 'warn' as const, icon: false },
};

export function PracticeCard({
  note,
  dir,
  isNew,
  index,
  total,
  streak,
  settings,
  keyFrom,
  keyTo,
  showAccidentals,
  micActive,
  liveNote,
  confirmedNote,
  onResult,
  onToggleInput,
  playNote,
  playError,
  suppressMic,
}: PracticeCardProps) {
  const [state, setState] = useState<AnswerState>('idle');
  const [picked, setPicked] = useState<string | null>(null);
  const [hintOpen, setHintOpen] = useState(isNew);
  const [usedHint, setUsedHint] = useState(isNew);
  const [tookMs, setTookMs] = useState(0);

  // Il cronometro parte a montaggio avvenuto, non durante il render.
  const startRef = useRef(0);
  useEffect(() => { startRef.current = performance.now(); }, []);
  // Qualsiasi rilevazione del microfono più vecchia di questo id appartiene alla
  // carta precedente: va ignorata.
  const micBaselineRef = useRef(confirmedNote?.id ?? 0);
  const stateRef = useRef<AnswerState>('idle');

  const useKeyboard = dir === 'find' || settings.readInput === 'keys';

  // Aiuto automatico: impalcatura che compare solo se ci si blocca.
  useEffect(() => {
    if (!settings.autoHint || hintOpen) return;
    const t = setTimeout(() => setHintOpen(true), 6000);
    return () => clearTimeout(t);
  }, [settings.autoHint, hintOpen]);

  // Suono guida prima della risposta: disattivato di default, resta un'opzione.
  useEffect(() => {
    if (!settings.hintSoundBefore || dir === 'find') return;
    const t = setTimeout(() => {
      playNote(note.toneNote);
      suppressMic(2200);
    }, 350);
    return () => clearTimeout(t);
  }, [settings.hintSoundBefore, dir, note.toneNote, playNote, suppressMic]);

  const submit = useCallback(
    (answer: string, checkOctave: boolean) => {
      if (stateRef.current !== 'idle') return;
      const ms = performance.now() - startRef.current;

      const samePc = samePitchClass(answer, note.englishName);
      const sameOctave = parseNote(answer).octave === parseNote(note.englishName).octave;
      const correct = samePc && (!checkOctave || !settings.strictOctave || sameOctave);

      stateRef.current = correct ? 'correct' : 'wrong';
      setState(correct ? 'correct' : 'wrong');
      setPicked(answer);
      setTookMs(ms);
      setHintOpen(true);

      // Col microfono acceso la nota l'ha già suonata l'utente: rifarla
      // dall'altoparlante rallenta e rischia solo di rientrare nel microfono.
      const revealSound = settings.soundOnReveal && !micActive;

      if (correct) {
        haptics.correct();
        if (revealSound) {
          playNote(note.toneNote);
          suppressMic(1800);
        }
        setTimeout(() => onResult(true, ms, usedHint), micActive ? 320 : 620);
      } else {
        haptics.wrong();
        playError();
        suppressMic(micActive ? 900 : 2400);
        if (revealSound) setTimeout(() => playNote(note.toneNote), 420);
      }
    },
    [note.englishName, note.toneNote, settings.strictOctave, settings.soundOnReveal, micActive, playNote, playError, suppressMic, onResult, usedHint],
  );

  // Risposta dal microfono: vale in entrambe le direzioni (suoni la nota sul
  // piano vero, che è l'esercizio più utile di tutti).
  useEffect(() => {
    if (!micActive || !confirmedNote || stateRef.current !== 'idle') return;
    if (confirmedNote.id <= micBaselineRef.current) return;
    submit(`${confirmedNote.note.name}${confirmedNote.note.octave}`, true);
  }, [confirmedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  const revealCorrect = state !== 'idle' ? note.englishName : null;
  const speed = state === 'correct' ? SPEED_PILLS[speedOf(tookMs)] : null;
  const nameStyle = settings.noteNames;

  return (
    <div className="flex flex-col gap-3">
      {/* Riga di stato: avanzamento, serie, cronometro discreto */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tabular-nums text-ink3">
          {index + 1}/{total}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
          {state === 'idle' && settings.showTimer ? (
            <div className="anim-timer h-full rounded-full bg-brand/60" />
          ) : (
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${((index + (state === 'idle' ? 0 : 1)) / total) * 100}%` }}
            />
          )}
        </div>
        {streak >= 3 && <span className="text-xs font-bold text-orange-400">🔥{streak}</span>}
      </div>

      {/* La domanda */}
      {dir === 'read' ? (
        <div className="relative">
          <Staff entries={[note]} activeIndex={0} answerState={state} variant="focus" />
          <button
            type="button"
            onClick={() => { playNote(note.toneNote); suppressMic(1800); }}
            className="absolute right-2 top-2 rounded-xl border border-slate-300/60 bg-white/80 p-2 text-slate-600 shadow-sm active:scale-95"
            title="Ascolta com'è questa nota"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          {isNew && (
            <span className="absolute left-2 top-2">
              <Pill tone="brand">✨ nuova</Pill>
            </span>
          )}
        </div>
      ) : (
        <Panel className="flex flex-col items-center gap-1 px-4 py-5">
          <span className="text-xs font-semibold uppercase tracking-widest text-ink3">
            Trova sulla tastiera
          </span>
          <span className="text-4xl font-black text-ink">
            {noteLabel(note.englishName, nameStyle === 'en' ? 'en' : 'it')}
            {settings.strictOctave && (
              <span className="ml-1 align-super text-xl text-brand">{parseNote(note.englishName).octave}</span>
            )}
          </span>
          {nameStyle !== 'en' && (
            <span className="text-xs text-ink3">{note.englishName}</span>
          )}
        </Panel>
      )}

      {/* Microfono attivo */}
      {micActive && state === 'idle' && (
        <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand/10 px-4 py-2.5">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
          </span>
          <span className="flex-1 text-sm text-ink2">Suonala sul piano…</span>
          {liveNote && (
            <span className="rounded-lg bg-brand px-3 py-1 text-base font-bold text-white">
              {italianOf(liveNote.name)}
              {liveNote.octave}
            </span>
          )}
        </div>
      )}

      {/* Responso */}
      {state !== 'idle' && (
        <div
          className={`anim-pop flex items-center gap-3 rounded-xl border px-4 py-3 ${
            state === 'correct'
              ? 'border-emerald-500/50 bg-emerald-500/10'
              : 'border-red-500/50 bg-red-500/10 anim-shake'
          }`}
        >
          {state === 'correct' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
          )}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold ${state === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
              {state === 'correct' ? 'Esatto!' : `Era ${fullLabel(note.englishName, 'both')}`}
            </p>
            {state === 'correct' && speed && (
              <p className="mt-0.5 text-xs text-ink3">
                {(tookMs / 1000).toFixed(1)}s · {speed.text}
              </p>
            )}
          </div>
          {state === 'correct' && speed?.icon && <Zap className="h-4 w-4 text-amber-400" />}
          {state === 'wrong' && (
            <Btn variant="danger" onClick={() => onResult(false, tookMs, usedHint)} className="flex-shrink-0 px-3 py-2">
              Continua
              <ChevronRight className="h-4 w-4" />
            </Btn>
          )}
        </div>
      )}

      {/* Aiuto: spiega il ragionamento, non solo la risposta */}
      {hintOpen ? (
        <Panel className="px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
            <div className="min-w-0 space-y-1 text-xs leading-relaxed text-ink2">
              {dir === 'read' ? (
                <>
                  <p>{landmarkHint(note.englishName, note.clef)}</p>
                  <p className="text-ink3">{describePosition(note.englishName, note.clef)}</p>
                </>
              ) : (
                <p>{keyboardHint(note.englishName)}</p>
              )}
              {note.mnemonic && <p className="text-ink3">{note.mnemonic}</p>}
            </div>
          </div>
        </Panel>
      ) : (
        <button
          type="button"
          onClick={() => { setHintOpen(true); setUsedHint(true); haptics.tap(); }}
          className="self-center text-xs font-semibold text-ink3 underline decoration-dotted underline-offset-4"
        >
          Non me la ricordo, aiutami
        </button>
      )}

      {/* Risposta */}
      {useKeyboard ? (
        <Panel className="p-2">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <p className="text-[11px] text-ink3">tocca il tasto</p>
            {dir === 'read' && (
              <button type="button" onClick={onToggleInput} className="text-[11px] font-semibold text-brand">
                usa i nomi
              </button>
            )}
          </div>
          <PianoKeyboard
            from={keyFrom}
            to={keyTo}
            onPress={n => submit(n, true)}
            correct={revealCorrect}
            wrong={state === 'wrong' && picked && pitchClass(picked) !== pitchClass(note.englishName) ? picked : null}
            labels={settings.keyLabels}
            disabled={state !== 'idle'}
            compact
          />
        </Panel>
      ) : (
        <Panel className="p-2.5">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[11px] text-ink3">che nota è?</p>
            <button type="button" onClick={onToggleInput} className="text-[11px] font-semibold text-brand">
              usa la tastiera
            </button>
          </div>
          <NoteNameButtons
            onSelect={n => submit(n, false)}
            disabled={state !== 'idle'}
            style={nameStyle}
            showAccidentals={showAccidentals}
            correct={revealCorrect}
            picked={picked}
          />
        </Panel>
      )}

      {/* Dopo l'errore in modalità "trova": mostra anche dov'era scritta */}
      {state !== 'idle' && dir === 'find' && (
        <Staff entries={[note]} activeIndex={0} answerState={state} variant="focus" />
      )}
    </div>
  );
}
