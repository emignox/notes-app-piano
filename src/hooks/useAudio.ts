// ─────────────────────────────────────────────────────────────────────────────
// Suono: pianoforte campionato con ripiego su sintesi.
//
// · si inizializza al primo tocco dell'utente (nessun pulsante "Audio" da
//   ricordarsi di premere);
// · se i campioni non si caricano (offline, rete lenta) si passa a un synth:
//   l'app resta usabile anche senza rete;
// · include metronomo e riproduzione di sequenze con callback per la grafica.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

const BASE_URL = 'https://tonejs.github.io/audio/salamander/';

// Sottoinsieme dei campioni: copre E2–F6 (tutto il curriculum) con metà dei
// download rispetto al set completo, quindi parte molto più in fretta.
const SAMPLE_URLS: Record<string, string> = {
  A1: 'A1.mp3', C2: 'C2.mp3', 'F#2': 'Fs2.mp3',
  A2: 'A2.mp3', C3: 'C3.mp3', 'F#3': 'Fs3.mp3',
  A3: 'A3.mp3', C4: 'C4.mp3', 'F#4': 'Fs4.mp3',
  A4: 'A4.mp3', C5: 'C5.mp3', 'F#5': 'Fs5.mp3',
  A5: 'A5.mp3', C6: 'C6.mp3', 'F#6': 'Fs6.mp3',
};

const LOAD_TIMEOUT_MS = 9000;

export type AudioStatus = 'idle' | 'loading' | 'ready' | 'fallback';

export interface SequenceNote {
  toneNote: string;
  durationSec: number;
}

export function useAudio(volume = 0.8) {
  const [status, setStatus] = useState<AudioStatus>('idle');

  const samplerRef = useRef<Tone.Sampler | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const fxRef = useRef<Tone.PolySynth | null>(null);
  const clickRef = useRef<Tone.Synth | null>(null);
  const readyRef = useRef(false);
  const startedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const metronomeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Tone.getDestination().volume.rampTo(Tone.gainToDb(Math.max(0.001, volume)), 0.1);
  }, [volume]);

  /** Sicuro da chiamare quante volte si vuole: inizializza una sola volta. */
  const initialize = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus('loading');

    try {
      await Tone.start();
    } catch {
      /* verrà ritentato al prossimo gesto */
    }

    // Ripiego sempre pronto: se i campioni tardano, il suono c'è comunque.
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.008, decay: 0.9, sustain: 0.12, release: 1.1 },
    }).toDestination();
    synth.volume.value = -8;
    synthRef.current = synth;

    const fx = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination();
    fx.volume.value = -16;
    fxRef.current = fx;

    const click = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
    }).toDestination();
    click.volume.value = -14;
    clickRef.current = click;

    let settled = false;
    const settle = (next: AudioStatus) => {
      if (settled) return;
      settled = true;
      setStatus(next);
    };

    const timeout = setTimeout(() => settle('fallback'), LOAD_TIMEOUT_MS);

    try {
      const sampler = new Tone.Sampler({
        urls: SAMPLE_URLS,
        baseUrl: BASE_URL,
        release: 1.2,
        onload: () => {
          clearTimeout(timeout);
          readyRef.current = true;
          settle('ready');
        },
        onerror: () => {
          clearTimeout(timeout);
          settle('fallback');
        },
      }).toDestination();
      samplerRef.current = sampler;
    } catch {
      clearTimeout(timeout);
      settle('fallback');
    }
  }, []);

  const voice = useCallback(() => {
    if (samplerRef.current && readyRef.current) return samplerRef.current;
    return synthRef.current;
  }, []);

  const playNote = useCallback(
    (toneNote: string, duration = 1.6) => {
      const v = voice();
      if (!v) return;
      try {
        v.triggerAttackRelease(toneNote, duration);
      } catch {
        /* ignora note fuori range */
      }
    },
    [voice],
  );

  const playChord = useCallback(
    (notes: string[], duration = 1.4) => {
      const v = voice();
      if (!v) return;
      try {
        v.triggerAttackRelease(notes, duration);
      } catch {
        /* ignora */
      }
    },
    [voice],
  );

  /** Arpeggio breve e brillante: premia senza interrompere il ritmo di studio. */
  const playSuccess = useCallback(() => {
    const v = voice();
    if (!v) return;
    try {
      const now = Tone.now();
      v.triggerAttackRelease('C6', 0.16, now, 0.5);
      v.triggerAttackRelease('G6', 0.22, now + 0.075, 0.45);
    } catch {
      /* ignora */
    }
  }, [voice]);

  const playError = useCallback(() => {
    const fx = fxRef.current;
    if (!fx) return;
    try {
      const now = Tone.now();
      fx.triggerAttackRelease(['C3', 'F#3'], '16n', now);
      fx.triggerAttackRelease(['B2', 'F3'], '16n', now + 0.13);
    } catch {
      /* ignora */
    }
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  /**
   * Riproduce una sequenza. `onNote` viene chiamato in sincrono con l'audio per
   * far illuminare la nota corrente sul pentagramma.
   */
  const playSequence = useCallback(
    (notes: SequenceNote[], onNote?: (index: number) => void, onEnd?: () => void) => {
      const v = voice();
      clearTimers();
      if (!v || notes.length === 0) return;
      const lead = 0.15;
      let offset = 0;
      const start = Tone.now() + lead;

      notes.forEach((n, i) => {
        try {
          v.triggerAttackRelease(n.toneNote, Math.max(0.12, n.durationSec * 0.92), start + offset);
        } catch {
          /* ignora */
        }
        if (onNote) {
          const at = (lead + offset) * 1000;
          timersRef.current.push(setTimeout(() => onNote(i), at));
        }
        offset += n.durationSec;
      });

      if (onEnd) timersRef.current.push(setTimeout(onEnd, (lead + offset) * 1000 + 120));
    },
    [voice, clearTimers],
  );

  /** Come playSequence, ma ogni passo può contenere più note insieme (accordi). */
  const playChordSequence = useCallback(
    (
      steps: { notes: string[]; durationSec: number }[],
      onStep?: (index: number) => void,
      onEnd?: () => void,
    ) => {
      const v = voice();
      clearTimers();
      if (!v || steps.length === 0) return;
      const lead = 0.15;
      let offset = 0;
      const start = Tone.now() + lead;

      steps.forEach((step, i) => {
        if (step.notes.length > 0) {
          try {
            v.triggerAttackRelease(step.notes, Math.max(0.14, step.durationSec * 0.95), start + offset);
          } catch {
            /* ignora */
          }
        }
        if (onStep) timersRef.current.push(setTimeout(() => onStep(i), (lead + offset) * 1000));
        offset += step.durationSec;
      });

      if (onEnd) timersRef.current.push(setTimeout(onEnd, (lead + offset) * 1000 + 120));
    },
    [voice, clearTimers],
  );

  const stopSequence = useCallback(() => {
    clearTimers();
    try {
      samplerRef.current?.releaseAll();
      synthRef.current?.releaseAll();
    } catch {
      /* ignora */
    }
  }, [clearTimers]);

  const stopMetronome = useCallback(() => {
    if (metronomeRef.current !== null) clearInterval(metronomeRef.current);
    metronomeRef.current = null;
  }, []);

  const startMetronome = useCallback(
    (bpm: number) => {
      stopMetronome();
      const period = 60_000 / Math.max(30, Math.min(240, bpm));
      let beat = 0;
      const tick = () => {
        try {
          clickRef.current?.triggerAttackRelease(beat % 4 === 0 ? 'C6' : 'C5', 0.03);
        } catch {
          /* ignora */
        }
        beat++;
      };
      tick();
      metronomeRef.current = setInterval(tick, period);
    },
    [stopMetronome],
  );

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      if (metronomeRef.current !== null) clearInterval(metronomeRef.current);
    },
    [],
  );

  return {
    status,
    isReady: status === 'ready' || status === 'fallback',
    initialize,
    playNote,
    playChord,
    playSuccess,
    playError,
    playSequence,
    playChordSequence,
    stopSequence,
    startMetronome,
    stopMetronome,
  };
}

export type AudioApi = ReturnType<typeof useAudio>;
