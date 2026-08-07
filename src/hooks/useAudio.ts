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
import { claimAudioSession } from '../lib/audioSession';

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

function contextState(): string {
  try {
    return Tone.getContext().state;
  } catch {
    return 'closed';
  }
}

export interface SequenceNote {
  toneNote: string;
  durationSec: number;
}

export function useAudio(volume = 0.8) {
  const [status, setStatus] = useState<AudioStatus>('idle');
  /** Il contesto sta davvero suonando: se è falso l'app è muta e va detto. */
  const [running, setRunning] = useState(false);

  const samplerRef = useRef<Tone.Sampler | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const fxRef = useRef<Tone.PolySynth | null>(null);
  const clickRef = useRef<Tone.Synth | null>(null);
  const readyRef = useRef(false);
  const startedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Invalida in blocco una riproduzione, anche se Tone.start() è ancora async. */
  const playbackIdRef = useRef(0);
  const metronomeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const safe = Number.isFinite(volume) ? Math.min(1, Math.max(0.001, volume)) : 0.8;
    Tone.getDestination().volume.rampTo(Tone.gainToDb(safe), 0.1);
  }, [volume]);

  /** Sicuro da chiamare quante volte si vuole: inizializza una sola volta. */
  const initialize = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus('loading');

    claimAudioSession();
    try {
      await Tone.start();
    } catch {
      /* verrà ritentato al prossimo gesto */
    }
    setRunning(contextState() === 'running');

    // Ripiego sempre pronto: se i campioni tardano, il suono c'è comunque.
    const synth = new Tone.PolySynth({
      maxPolyphony: 64,
      voice: Tone.Synth,
      options: {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.008, decay: 0.9, sustain: 0.12, release: 1.1 },
      },
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

  /**
   * Riporta il contesto in funzione. Serve più spesso di quanto sembri: iOS
   * sospende l'audio quando l'app va in secondo piano e NON lo riattiva da solo
   * al ritorno — senza questo l'app resta muta finché non la si chiude.
   * Va chiamata da un gesto dell'utente, e da lì siamo sempre chiamati.
   */
  const resume = useCallback(async () => {
    claimAudioSession();
    if (!startedRef.current) {
      await initialize();
      return contextState() === 'running';
    }
    if (contextState() !== 'running') {
      try {
        await Tone.start();
      } catch {
        /* niente gesto valido: riproverà al prossimo tocco */
      }
    }
    const ok = contextState() === 'running';
    setRunning(ok);
    return ok;
  }, [initialize]);

  /** Suona subito se il contesto è vivo, altrimenti lo sveglia e poi suona. */
  const withAudio = useCallback(
    (fire: () => void) => {
      if (contextState() === 'running') {
        fire();
        return;
      }
      void resume().then(ok => {
        if (ok) fire();
      });
    },
    [resume],
  );

  const playNote = useCallback(
    (toneNote: string, duration = 1.6) => {
      withAudio(() => {
        const v = voice();
        if (!v) return;
        try {
          v.triggerAttackRelease(toneNote, duration);
        } catch {
          /* ignora note fuori range */
        }
      });
    },
    [voice, withAudio],
  );

  const playChord = useCallback(
    (notes: string[], duration = 1.4) => {
      withAudio(() => {
        const v = voice();
        if (!v) return;
        try {
          v.triggerAttackRelease(notes, duration);
        } catch {
          /* ignora */
        }
      });
    },
    [voice, withAudio],
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
      clearTimers();
      const playbackId = ++playbackIdRef.current;
      withAudio(() => {
        if (playbackId !== playbackIdRef.current) return;
        const v = voice();
        if (!v || notes.length === 0) return;
        const lead = 0.08;
        let offset = 0;

        notes.forEach((n, i) => {
          const at = (lead + offset) * 1000;
          timersRef.current.push(setTimeout(() => {
            if (playbackId !== playbackIdRef.current) return;
            try {
              v.triggerAttackRelease(n.toneNote, Math.max(0.12, n.durationSec * 0.92));
            } catch {
              /* ignora */
            }
            onNote?.(i);
          }, at));
          offset += n.durationSec;
        });

        if (onEnd) timersRef.current.push(setTimeout(() => {
          if (playbackId === playbackIdRef.current) onEnd();
        }, (lead + offset) * 1000 + 120));
      });
    },
    [voice, clearTimers, withAudio],
  );

  /** Come playSequence, ma ogni passo può contenere più note insieme (accordi). */
  const playChordSequence = useCallback(
    (
      steps: { notes: string[]; durationSec: number }[],
      onStep?: (index: number) => void,
      onEnd?: () => void,
    ) => {
      clearTimers();
      const playbackId = ++playbackIdRef.current;
      withAudio(() => {
        if (playbackId !== playbackIdRef.current) return;
        const v = voice();
        if (!v || steps.length === 0) return;
        const lead = 0.08;
        let offset = 0;

        steps.forEach((step, i) => {
          const at = (lead + offset) * 1000;
          timersRef.current.push(setTimeout(() => {
            if (playbackId !== playbackIdRef.current) return;
            if (step.notes.length > 0) {
              try {
                v.triggerAttackRelease(step.notes, Math.max(0.14, step.durationSec * 0.95));
              } catch {
                /* ignora */
              }
            }
            onStep?.(i);
          }, at));
          offset += step.durationSec;
        });

        if (onEnd) timersRef.current.push(setTimeout(() => {
          if (playbackId === playbackIdRef.current) onEnd();
        }, (lead + offset) * 1000 + 120));
      });
    },
    [voice, clearTimers, withAudio],
  );

  /**
   * Esegue una partitura già "interpretata": ogni evento sa quando parte,
   * quanto resta premuto e con che forza.
   *
   * È la differenza fra sentire le note e sentire il pezzo. `playChordSequence`
   * fa partire un blocco per volta, tutti uguali e tutti staccati; qui gli
   * eventi hanno tempi assoluti, quindi due note legate si sovrappongono
   * davvero, uno staccato stacca davvero, e un crescendo si sente crescere.
   */
  const playPerformance = useCallback(
    (
      events: { notes: string[]; at: number; hold: number; velocity: number; stepIndex: number }[],
      stepTimes: number[],
      onStep?: (index: number) => void,
      onEnd?: () => void,
    ) => {
      clearTimers();
      const playbackId = ++playbackIdRef.current;
      withAudio(() => {
        if (playbackId !== playbackIdRef.current) return;
        const v = voice();
        if (!v || events.length === 0) return;
        // Non creare migliaia di timeout: sui telefoni il rendering della
        // partitura può ritardare il thread JS e far partire blocchi di note
        // tutti insieme. Prepariamo invece 300 ms alla volta sull'orologio
        // Web Audio, che continua preciso anche durante scroll e layout.
        const ordered = [...events].sort((a, b) => a.at - b.at);
        const lead = 0.12, lookAhead = 0.3;
        const startedAt = performance.now() / 1000 + lead;
        const last = ordered.reduce((m, e) => Math.max(m, e.at + e.hold), 0);
        let eventIndex = 0, stepIndex = 0, finished = false;
        const schedule = () => {
          if (playbackId !== playbackIdRef.current || finished) return;
          const elapsed = performance.now() / 1000 - startedAt;
          const audioNow = Tone.now();
          while (eventIndex < ordered.length && ordered[eventIndex].at <= elapsed + lookAhead) {
            const e = ordered[eventIndex++];
            try {
              const when = audioNow + Math.max(0.015, e.at - elapsed);
              v.triggerAttackRelease(e.notes, Math.max(0.08, e.hold), when, e.velocity);
            } catch {
              /* una nota fuori range non deve fermare l'esecuzione */
            }
          }
          if (onStep) while (stepIndex < stepTimes.length && stepTimes[stepIndex] <= elapsed) onStep(stepIndex++);
          if (elapsed >= last + .15) {
            finished = true;
            clearInterval(scheduler);
            if (playbackId === playbackIdRef.current) onEnd?.();
          }
        };
        const scheduler = setInterval(schedule, 40);
        timersRef.current.push(scheduler);
        schedule();
      });
    },
    [voice, clearTimers, withAudio],
  );

  const stopSequence = useCallback(() => {
    playbackIdRef.current += 1;
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

  /**
   * Al ritorno da secondo piano il contesto è spesso sospeso: si prova a
   * riaccenderlo subito, così la prima nota che si tocca si sente già.
   */
  useEffect(() => {
    const wake = () => {
      if (!startedRef.current || document.visibilityState !== 'visible') return;
      if (contextState() === 'running') {
        setRunning(true);
        return;
      }
      void Tone.start()
        .then(() => setRunning(contextState() === 'running'))
        .catch(() => setRunning(false));
    };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    return () => {
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
    };
  }, []);

  /** Nota di prova: serve all'utente per sentire se il suono esce davvero. */
  const test = useCallback(async () => {
    const ok = await resume();
    if (ok) {
      const v = voice();
      try {
        v?.triggerAttackRelease('C5', 0.9);
      } catch {
        /* ignora */
      }
    }
    return ok;
  }, [resume, voice]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      if (metronomeRef.current !== null) clearInterval(metronomeRef.current);
    },
    [],
  );

  return {
    status,
    running,
    isReady: status === 'ready' || status === 'fallback',
    initialize,
    resume,
    test,
    playNote,
    playChord,
    playSuccess,
    playError,
    playSequence,
    playChordSequence,
    playPerformance,
    stopSequence,
    startMetronome,
    stopMetronome,
  };
}

export type AudioApi = ReturnType<typeof useAudio>;
