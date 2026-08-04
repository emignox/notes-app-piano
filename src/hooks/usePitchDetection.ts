// ─────────────────────────────────────────────────────────────────────────────
// Ascolto del piano vero (monofonico: una nota alla volta).
//
// Il problema della versione precedente era la fluidità: per accettare una nota
// serviva PRIMA il silenzio, più un blocco di 1,2 s. Suonando normalmente le
// note venivano perse e bisognava aspettare fra una e l'altra.
//
// Ora una nota nuova viene accettata quando si verifica una di queste cose:
//   · è cambiata l'altezza rispetto all'ultima confermata (legato: immediato);
//   · c'è un ATTACCO, cioè un salto di energia (stessa nota ribattuta);
//   · è passato dal silenzio (come prima).
// Il blocco scende a ~150 ms, quel tanto che basta per non contare due volte lo
// stesso attacco. Senza un attacco o un silenzio serve più stabilità, così le
// armoniche di una nota che sta ancora suonando non vengono lette come note.
//
// Inoltre il microfono viene aperto DISATTIVANDO cancellazione d'eco, riduzione
// del rumore e guadagno automatico: sono pensati per la voce e falsano l'altezza.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react';
import { PitchDetector } from 'pitchy';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function freqToNote(freq: number): { name: string; octave: number } | null {
  if (!freq || freq < 27.5 || freq > 4200) return null;
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  if (midi < 21 || midi > 108) return null;
  return { name: NOTE_NAMES[midi % 12], octave: Math.floor(midi / 12) - 1 };
}

export interface LiveNote {
  name: string;
  octave: number;
  clarity: number;
}

const CLARITY_THRESHOLD = 0.9;
const MIN_RMS = 0.012;
/** Stabilità richiesta con un attacco o dopo il silenzio: ~50 ms. */
const FRAMES_WITH_ONSET = 3;
/** Stabilità richiesta senza attacco (nota che sta ancora suonando): ~115 ms. */
const FRAMES_SUSTAINED = 7;
/** Blocco minimo dopo una conferma: evita il doppio scatto sullo stesso attacco. */
const REARM_MS = 150;
/** Salto di energia che identifica un nuovo attacco. */
const ONSET_RATIO = 1.5;
/** Decadimento dell'inseguitore di picco: quanto in fretta "dimentica" l'energia. */
const ENV_DECAY = 0.86;

export function usePitchDetection() {
  const [isListening, setIsListening] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [liveNote, setLiveNote] = useState<LiveNote | null>(null);
  const [confirmedNote, setConfirmedNote] = useState<{ note: LiveNote; id: number } | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const confirmIdRef = useRef(0);

  const candidateRef = useRef<string>('');
  const stableFramesRef = useRef(0);
  const lastConfirmedRef = useRef<string>('');
  const envRef = useRef(0);
  const onsetRef = useRef(false);
  const seenSilenceRef = useRef(true);
  // Timestamp fino al quale non si conferma nulla (suoni dell'app + riarmo).
  const blockedUntilRef = useRef(0);

  const block = useCallback((ms: number) => {
    const until = Date.now() + ms;
    if (until > blockedUntilRef.current) blockedUntilRef.current = until;
    stableFramesRef.current = 0;
    candidateRef.current = '';
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setIsListening(false);
    setLiveNote(null);
    candidateRef.current = '';
    stableFramesRef.current = 0;
    lastConfirmedRef.current = '';
    envRef.current = 0;
    onsetRef.current = false;
    seenSilenceRef.current = true;
    blockedUntilRef.current = 0;
  }, []);

  const start = useCallback(async () => {
    if (isListening) return;
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

      setIsListening(true);
      setPermissionDenied(false);
      block(400); // il microfono che si apre fa un colpo

      function tick() {
        analyser.getFloatTimeDomainData(input);

        let sumSq = 0;
        for (let i = 0; i < input.length; i++) sumSq += input[i] * input[i];
        const rms = Math.sqrt(sumSq / input.length);

        // Inseguitore di picco: scende piano, così un vero attacco lo supera.
        const prevEnv = envRef.current;
        envRef.current = Math.max(rms, prevEnv * ENV_DECAY);
        if (rms > MIN_RMS && rms > prevEnv * ONSET_RATIO) onsetRef.current = true;

        if (rms < MIN_RMS) {
          seenSilenceRef.current = true;
          lastConfirmedRef.current = ''; // dal silenzio qualsiasi nota è "nuova"
          candidateRef.current = '';
          stableFramesRef.current = 0;
          setLiveNote(null);
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const [pitch, clarity] = detector.findPitch(input, audioCtx.sampleRate);

        if (clarity >= CLARITY_THRESHOLD && pitch > 50) {
          const note = freqToNote(pitch);
          if (note) {
            const key = `${note.name}${note.octave}`;
            setLiveNote({ ...note, clarity });

            if (key === candidateRef.current) stableFramesRef.current++;
            else {
              candidateRef.current = key;
              stableFramesRef.current = 1;
            }

            const fresh = onsetRef.current || seenSilenceRef.current;
            const changed = key !== lastConfirmedRef.current;
            const needed = fresh ? FRAMES_WITH_ONSET : FRAMES_SUSTAINED;
            const unblocked = Date.now() >= blockedUntilRef.current;

            if (stableFramesRef.current >= needed && unblocked && (fresh || changed)) {
              lastConfirmedRef.current = key;
              onsetRef.current = false;
              seenSilenceRef.current = false;
              blockedUntilRef.current = Date.now() + REARM_MS;
              stableFramesRef.current = 0;
              const id = ++confirmIdRef.current;
              setConfirmedNote({ note: { ...note, clarity }, id });
            }
          }
        } else if (clarity < 0.5) {
          setLiveNote(null);
          stableFramesRef.current = 0;
          candidateRef.current = '';
        }

        rafRef.current = requestAnimationFrame(tick);
      }

      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setPermissionDenied(true);
    }
  }, [isListening, block]);

  /**
   * Silenzia il rilevamento mentre suona l'app (altoparlante → microfono).
   * Chiude anche il varco: la nota successiva dovrà avere un attacco o un
   * silenzio, non basterà la coda che sta ancora risuonando.
   */
  const suppress = useCallback(
    (ms = 1500) => {
      seenSilenceRef.current = false;
      onsetRef.current = false;
      block(ms);
    },
    [block],
  );

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    },
    [],
  );

  return { isListening, permissionDenied, liveNote, confirmedNote, start, stop, suppress };
}
