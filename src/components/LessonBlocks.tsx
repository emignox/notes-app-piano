// Come si disegna ogni tipo di blocco di una lezione. Aggiungere un tipo di
// contenuto significa aggiungere un caso qui e una riga nei dati: le lezioni
// restano testo, non componenti.

import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { Block } from '../data/lessons';
import type { AudioApi } from '../hooks/useAudio';
import { CHORDS, buildChord, chordSymbol, invert } from '../lib/harmony';
import { CIRCLE_FLAT, CIRCLE_SHARP, PROGRESSIONS, diatonicChords, keyInfo, realize } from '../lib/keys';
import { METERS, meterExplain, valueById } from '../lib/rhythm';
import { accidentalKind, italianOf, midiOf, parseNote, vexKeyOf } from '../lib/notes';
import type { NoteEntry } from '../types';
import { Panel } from './ui';
import { Staff } from './Staff';
import { ChordStaff } from './ChordStaff';
import { PianoKeyboard } from './PianoKeyboard';
import { NoteKeyboard } from './NoteKeyboard';
import { RichText } from './RichText';

/**
 * Una chiave sola per tutto l'esempio, scelta sulla nota più grave: se la
 * figura sta tutta sotto il Do centrale si legge in chiave di basso. Mescolare
 * le due chiavi dentro una scala la spezzerebbe in due pentagrammi.
 */
function clefForAll(notes: string[]): 'treble' | 'bass' {
  return notes.every(n => midiOf(n) < 60) ? 'bass' : 'treble';
}

function toEntry(note: string, i: number, clef: 'treble' | 'bass', duration?: string): NoteEntry {
  const { acc } = parseNote(note);
  return {
    id: `${note}-${i}`,
    clef,
    pitch: note,
    displayName: italianOf(note),
    englishName: note,
    vexflowKey: vexKeyOf(note),
    accidental: accidentalKind(acc),
    noteValue: duration === 'w' ? 'whole' : duration === 'h' ? 'half' : 'quarter',
    toneNote: note,
    stageId: 'lesson',
  };
}

function ListenButton({ label, onPlay }: { label: string; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="flex w-full items-center gap-3 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-left active:scale-[0.99]"
    >
      <Volume2 className="h-5 w-5 flex-shrink-0 text-brand" />
      <span className="text-sm font-semibold text-ink">{label}</span>
    </button>
  );
}

export function BlockView({ block, audio, suppressMic }: { block: Block; audio: AudioApi; suppressMic: (ms?: number) => void }) {
  switch (block.kind) {
    case 'text':
      return <p className="text-sm leading-relaxed text-ink2"><RichText text={block.text} /></p>;

    case 'key':
      return (
        <div className="rounded-xl border-l-4 border-brand bg-brand/10 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand">da ricordare</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-ink"><RichText text={block.text} /></p>
        </div>
      );

    case 'staff':
      return (
        <figure className="space-y-1.5">
          <button
            type="button"
            onClick={() => {
              suppressMic(Math.ceil(block.notes.length * 450 + 900));
              audio.playSequence(block.notes.map(n => ({ toneNote: n, durationSec: 0.42 })));
            }}
            className="relative block w-full active:scale-[0.99]"
            aria-label={`Ascolta ${block.caption ?? 'l\'esempio'}`}
          >
          <Staff
            entries={block.notes.map((n, i) => toEntry(n, i, clefForAll(block.notes), block.durations?.[i]))}
            activeIndex={-1}
            durations={block.durations}
            variant="sequence"
          />
            <span className="absolute right-2 top-2 rounded-lg border border-slate-300/70 bg-white/80 p-1.5 text-slate-600 shadow-sm">
              <Volume2 className="h-3.5 w-3.5" />
            </span>
          </button>
          {block.caption && <figcaption className="text-center text-xs text-ink3">{block.caption}</figcaption>}
          <NoteKeyboard
            notes={block.notes}
            onPress={n => { audio.playNote(n); suppressMic(1500); }}
            caption={block.notes.map(n => italianOf(n)).join(' · ')}
          />
        </figure>
      );

    case 'chord': {
      const notes = invert(buildChord(block.root, block.quality), block.inversion ?? 0);
      // Il disegno è anche il pulsante: ogni accordo mostrato si può sentire.
      // Con l'ascolto affidato a blocchi separati capitava di illustrarne
      // quattro e farne sentire solo due.
      return (
        <figure className="space-y-1.5">
          <button
            type="button"
            onClick={() => { suppressMic(2500); audio.playChord(notes, 1.8); }}
            className="relative block w-full active:scale-[0.99]"
            aria-label={`Ascolta ${block.caption ?? chordSymbol(block.root, block.quality)}`}
          >
            <ChordStaff notes={notes} />
            <span className="absolute right-2 top-2 rounded-lg border border-slate-300/70 bg-white/80 p-1.5 text-slate-600 shadow-sm">
              <Volume2 className="h-3.5 w-3.5" />
            </span>
          </button>
          <figcaption className="text-center text-xs text-ink3">
            {block.caption ?? `${chordSymbol(block.root, block.quality)} — ${notes.map(n => italianOf(n)).join(' ')}`}
          </figcaption>
          <NoteKeyboard
            notes={notes}
            onPress={n => { audio.playNote(n); suppressMic(1500); }}
            caption={`i tasti da premere: ${notes.map(n => italianOf(n)).join(' · ')}`}
          />
        </figure>
      );
    }

    case 'keys':
      return (
        <figure className="space-y-1.5">
          <Panel className="p-2">
            <PianoKeyboard
              from={block.from}
              to={block.to}
              onPress={n => { audio.playNote(n); suppressMic(1500); }}
              hint={block.highlight}
              labels="c"
              compact
            />
          </Panel>
          {block.caption && <figcaption className="text-center text-xs text-ink3">{block.caption}</figcaption>}
        </figure>
      );

    case 'listen':
      return (
        <div className="space-y-1.5">
        <ListenButton
          label={block.label}
          onPlay={() => {
            suppressMic(2500);
            if (block.vel || block.holds) {
              // Quando il punto è COME si suona (piano/forte, staccato/legato,
              // pedale) servono forza e durata del tasto nota per nota: è
              // l'esecuzione "interpretata" che usano anche i pezzi.
              const secs = block.notes.map((_, i) => block.secs?.[i] ?? 0.5);
              let at = 0;
              const events = block.notes.map((n, i) => {
                const e = {
                  notes: [n],
                  at: block.together ? 0 : at,
                  hold: block.holds?.[i] ?? secs[i] * 0.9,
                  velocity: block.vel?.[i] ?? 0.7,
                  stepIndex: i,
                };
                at += secs[i];
                return e;
              });
              suppressMic(Math.ceil((at + 2) * 1000));
              audio.playPerformance(events, events.map(e => e.at));
            } else if (block.together) audio.playChord(block.notes, 1.8);
            // `secs` serve quando è il RITMO il contenuto dell'ascolto (due
            // crome contro una terzina): senza, tutte le note durerebbero
            // uguale e l'esempio non dimostrerebbe niente.
            else
              audio.playSequence(
                block.notes.map((n, i) => ({ toneNote: n, durationSec: block.secs?.[i] ?? 0.5 })),
              );
          }}
        />
        <NoteKeyboard notes={block.notes} onPress={n => { audio.playNote(n); suppressMic(1500); }} />
        </div>
      );

    case 'table':
      return (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface2 text-xs uppercase tracking-wide text-ink3">
                <th className="px-3 py-2 font-semibold">{block.head[0]}</th>
                <th className="px-3 py-2 font-semibold">{block.head[1]}</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map(([a, b], i) => (
                <tr key={i} className="border-t border-line/60">
                  <td className="whitespace-nowrap px-3 py-2 font-bold text-ink">{a}</td>
                  <td className="px-3 py-2 leading-snug text-ink2"><RichText text={b} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'values':
      return (
        <div className="space-y-2">
          {block.ids.map(id => {
            const v = valueById(id);
            return (
              <div key={id} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface2 text-lg font-black text-brand">
                  {v.beats}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">
                    {v.name} <span className="font-normal text-ink3">({v.english})</span>
                  </p>
                  <p className="text-xs leading-snug text-ink2">{v.drawing}</p>
                  <p className="mt-0.5 text-xs text-ink3">Pausa: {v.restDrawing}</p>
                  <p className="mt-0.5 text-xs text-ink3">Si conta: {v.counting}</p>
                </div>
              </div>
            );
          })}
          {block.caption && <p className="text-center text-xs text-ink3">{block.caption}</p>}
        </div>
      );

    case 'meter': {
      const m = METERS.find(x => x.id === block.id);
      if (!m) return null;
      return (
        <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
          <span className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-surface2 leading-none">
            <span className="text-lg font-black text-ink">{m.id.split('/')[0]}</span>
            <span className="text-lg font-black text-ink">{m.id.split('/')[1]}</span>
          </span>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-bold text-ink">{m.feel}</p>
            <p className="text-xs text-ink2">{meterExplain(m)}</p>
            <p className="text-xs text-ink3">Accenti: {m.accents}</p>
            <p className="text-xs text-ink3">{m.where}</p>
          </div>
        </div>
      );
    }

    case 'circle':
      return (
        <div className="space-y-2">
          <div className="rounded-xl border border-line bg-surface p-3">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink3">↻ diesis (quinte in su)</p>
            <div className="flex flex-wrap gap-1.5">
              {CIRCLE_SHARP.map(t => {
                const info = keyInfo(t);
                return (
                  <span key={t} className="rounded-lg bg-surface2 px-2 py-1 text-xs">
                    <span className="font-bold text-ink">{italianOf(t)}</span>
                    <span className="text-ink3"> · {info.accidentals}♯</span>
                  </span>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-3">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink3">↺ bemolli (quarte in su)</p>
            <div className="flex flex-wrap gap-1.5">
              {CIRCLE_FLAT.map(t => {
                const info = keyInfo(t);
                return (
                  <span key={t} className="rounded-lg bg-surface2 px-2 py-1 text-xs">
                    <span className="font-bold text-ink">{italianOf(t)}</span>
                    <span className="text-ink3"> · {Math.abs(info.accidentals)}♭</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      );

    case 'degrees':
      return <DegreesBlock block={block} audio={audio} suppressMic={suppressMic} />;

    case 'progression':
      return <ProgressionBlock block={block} audio={audio} suppressMic={suppressMic} />;
  }
}

function DegreesBlock({
  block,
  audio,
  suppressMic,
}: {
  block: Extract<Block, { kind: 'degrees' }>;
  audio: AudioApi;
  suppressMic: (ms?: number) => void;
}) {
  const chords = diatonicChords(block.tonic, block.mode, block.sevenths ?? false);
  const [shown, setShown] = useState(0);
  return (
    <div className="space-y-1.5">
      <div className="overflow-hidden rounded-xl border border-line">
        {chords.map((c, i) => (
          <button
            key={c.degree}
            type="button"
            onClick={() => { setShown(i); suppressMic(2200); audio.playChord(c.notes, 1.4); }}
            className={`flex w-full items-center gap-3 border-b border-line/60 px-3 py-2 text-left last:border-0 ${
              i === shown ? 'bg-brand/10' : 'active:bg-surface2'
            }`}
          >
            <span className="w-12 flex-shrink-0 text-sm font-black text-brand">{c.roman}</span>
            <span className="w-14 flex-shrink-0 text-sm font-bold text-ink">
              {chordSymbol(`${c.root}4`, c.quality)}
            </span>
            {/* Il ruolo va a capo invece di essere tagliato: è la parte che
                spiega il grado, troncarla lascia una frase a metà. */}
            <span className="min-w-0 flex-1 text-xs leading-snug text-ink3">{c.role}</span>
            <Volume2 className="h-3.5 w-3.5 flex-shrink-0 text-ink3" />
          </button>
        ))}
      </div>
      <NoteKeyboard
        notes={chords[shown].notes}
        onPress={n => { audio.playNote(n); suppressMic(1500); }}
        caption={`${chords[shown].roman} · ${chords[shown].notes.map(n => italianOf(n)).join(' · ')}`}
      />
    </div>
  );
}

function ProgressionBlock({
  block,
  audio,
  suppressMic,
}: {
  block: Extract<Block, { kind: 'progression' }>;
  audio: AudioApi;
  suppressMic: (ms?: number) => void;
}) {
  const prog = PROGRESSIONS.find(p => p.id === block.id);
  const [shown, setShown] = useState(0);
  if (!prog) return null;
  const chords = realize(prog, block.tonic);
  return (
        <div className="space-y-2 rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{prog.name}</p>
              <p className="text-xs font-semibold text-brand">{prog.roman}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                suppressMic(Math.ceil((chords.length * 1.1 + 1) * 1000));
                audio.playChordSequence(chords.map(c => ({ notes: c.notes, durationSec: 1.1 })));
              }}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white active:scale-95"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Ascolta
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chords.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setShown(i); suppressMic(2000); audio.playChord(c.notes, 1.3); }}
                className={`rounded-lg px-2 py-1 text-xs font-bold ${
                  i === shown ? 'bg-brand text-white' : 'bg-surface2 text-ink'
                }`}
              >
                {chordSymbol(`${c.root}4`, c.quality)}
              </button>
            ))}
          </div>
          <NoteKeyboard
            notes={chords[shown].notes}
            onPress={n => { audio.playNote(n); suppressMic(1500); }}
            caption={`${chords[shown].roman} · ${chords[shown].notes.map(n => italianOf(n)).join(' · ')}`}
          />
          <p className="text-xs leading-relaxed text-ink2">{prog.why}</p>
          <p className="text-xs text-ink3">{prog.where}</p>
        </div>
  );
}

/** Riquadro di riferimento per un accordo: usato dal glossario. */
export function ChordRef({ root, quality }: { root: string; quality: import('../lib/harmony').ChordQuality }) {
  const notes = buildChord(`${root}4`, quality);
  const spec = CHORDS[quality];
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-black text-ink">{chordSymbol(`${root}4`, quality)}</span>
        <span className="text-xs text-ink3">{spec.formula}</span>
      </div>
      <p className="mt-0.5 text-xs text-ink2">{notes.map(n => italianOf(n)).join(' · ')}</p>
    </div>
  );
}

