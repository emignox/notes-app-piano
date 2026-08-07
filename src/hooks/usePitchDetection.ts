// ─────────────────────────────────────────────────────────────────────────────
// Ascolto del piano vero (monofonico: una nota alla volta).
//
// Qui c'è solo il collegamento fra microfono, rilevatore di altezza e React.
// Le decisioni — quando una nota conta come suonata — stanno in
// `lib/noteTracker`, che si può far girare su una registrazione per misurare
// quante note riconosce davvero.
//
// Due accortezze che contano più di ogni soglia:
//  · il microfono si apre DISATTIVANDO cancellazione d'eco, riduzione del
//    rumore e guadagno automatico: sono fatti per la voce e falsano l'altezza;
//  · lo stato React si aggiorna al massimo ~11 volte al secondo. Aggiornarlo a
//    ogni frame ridisegnava tutta la carta 60 volte al secondo e rubava proprio
//    il tempo di calcolo che serve al rilevamento.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react';
import { PitchDetector } from 'pitchy';
import { NoteTracker } from '../lib/noteTracker';
import { setMicSession } from '../lib/audioSession';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** L'indicatore a schermo si aggiorna al massimo così spesso (in ms). */
const UI_THROTTLE_MS = 90;

function midiToNote(midi: number): { name: string; octave: number } {
  return { name: NOTE_NAMES[midi % 12], octave: Math.floor(midi / 12) - 1 };
}

export interface LiveNote {
  name: string;
  octave: number;
  clarity: number;
}

export interface ConfirmedNote {
  note: LiveNote;
  id: number;
  /** Quando è stata confermata: distingue una nota appena suonata da una vecchia. */
  at: number;
}

export function usePitchDetection() {
  const [isListening, setIsListening] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [liveNote, setLiveNote] = useState<LiveNote | null>(null);
  const [confirmedNote, setConfirmedNote] = useState<ConfirmedNote | null>(null);
  /** Volume in ingresso 0–1: serve a far vedere che il microfono sente davvero. */
  const [level, setLevel] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const confirmIdRef = useRef(0);
  const trackerRef = useRef(new NoteTracker());
  const lastPaintRef = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setMicSession(false);
    trackerRef.current.reset();
    setIsListening(false);
    setLiveNote(null);
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    if (isListening) return;
    // Prima di chiedere il microfono la sessione deve permettere di registrare,
    // altrimenti WebKit rifiuta la richiesta e sembra un permesso negato.
    setMicSession(true);
    setPermissionDenied(false);
    try {
      // Senza i filtri per la voce l'altezza è molto più stabile.
      const raw = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
        video: false,
      } as MediaStreamConstraints;

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(raw);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      const input = new Float32Array(detector.inputLength);
      const tracker = trackerRef.current;

      tracker.reset();
      setIsListening(true);
      setPermissionDenied(false);
      tracker.block(400, Date.now()); // il microfono che si apre fa un colpo

      function tick() {
        analyser.getFloatTimeDomainData(input);

        let sumSq = 0;
        for (let i = 0; i < input.length; i++) sumSq += input[i] * input[i];
        const rms = Math.sqrt(sumSq / input.length);

        const [pitch, clarity] = detector.findPitch(input, audioCtx.sampleRate);
        const now = Date.now();
        const out = tracker.feed(rms, pitch, clarity, now);

        if (out.confirmed !== null) {
          const id = ++confirmIdRef.current;
          setConfirmedNote({
            note: { ...midiToNote(out.confirmed), clarity: out.clarity },
            id,
            at: now,
          });
        }

        if (now - lastPaintRef.current >= UI_THROTTLE_MS) {
          lastPaintRef.current = now;
          setLevel(out.level);
          setLiveNote(out.live === null ? null : { ...midiToNote(out.live), clarity: out.clarity });
        }

        rafRef.current = requestAnimationFrame(tick);
      }

      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setMicSession(false); // niente registrazione: si torna a sola riproduzione
      setPermissionDenied(true);
    }
  }, [isListening]);

  /**
   * Silenzia il rilevamento mentre suona l'app (altoparlante → microfono).
   * Chiude anche il varco: la nota successiva dovrà avere un attacco o un
   * silenzio, non basterà la coda che sta ancora risuonando.
   */
  const suppress = useCallback((ms = 1500) => {
    trackerRef.current.suppress(ms, Date.now());
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    },
    [],
  );

  return { isListening, permissionDenied, liveNote, confirmedNote, level, start, stop, suppress };
}
