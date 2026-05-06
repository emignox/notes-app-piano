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

export function usePitchDetection() {
  const [isListening, setIsListening] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [liveNote, setLiveNote] = useState<LiveNote | null>(null);
  const [confirmedNote, setConfirmedNote] = useState<{ note: LiveNote; id: number } | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const confirmIdRef = useRef(0);

  // Stability state
  const lastNoteKeyRef = useRef<string>('');
  const stableFramesRef = useRef(0);
  const cooldownRef = useRef(false);
  // Single timer ref — suppress() clears this before setting a new one,
  // so it always wins over any shorter internal cooldown.
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const STABILITY_FRAMES = 7;    // ~116ms at 60fps — more stable, fewer false triggers
  const COOLDOWN_MS = 1400;      // internal cooldown after confirming a note
  const CLARITY_THRESHOLD = 0.93;

  const clearCooldownTimer = useCallback(() => {
    if (cooldownTimerRef.current !== null) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    clearCooldownTimer();
    setIsListening(false);
    setLiveNote(null);
    lastNoteKeyRef.current = '';
    stableFramesRef.current = 0;
    cooldownRef.current = false;
  }, [clearCooldownTimer]);

  const start = useCallback(async () => {
    if (isListening) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
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

      // Grace period on mic start — ignore first 300ms to avoid startup noise
      cooldownRef.current = true;
      clearCooldownTimer();
      cooldownTimerRef.current = setTimeout(() => {
        cooldownRef.current = false;
        cooldownTimerRef.current = null;
      }, 300);

      setIsListening(true);
      setPermissionDenied(false);

      function tick() {
        analyser.getFloatTimeDomainData(input);
        const [pitch, clarity] = detector.findPitch(input, audioCtx.sampleRate);

        if (clarity >= CLARITY_THRESHOLD && pitch > 50) {
          const note = freqToNote(pitch);
          if (note) {
            const key = `${note.name}${note.octave}`;
            setLiveNote({ ...note, clarity });

            if (key === lastNoteKeyRef.current) {
              stableFramesRef.current++;
            } else {
              lastNoteKeyRef.current = key;
              stableFramesRef.current = 1;
            }

            if (stableFramesRef.current >= STABILITY_FRAMES && !cooldownRef.current) {
              // Confirm the note and start cooldown — clear any previous timer first
              clearCooldownTimer();
              cooldownRef.current = true;
              stableFramesRef.current = 0;
              lastNoteKeyRef.current = '';
              cooldownTimerRef.current = setTimeout(() => {
                cooldownRef.current = false;
                cooldownTimerRef.current = null;
              }, COOLDOWN_MS);
              const id = ++confirmIdRef.current;
              setConfirmedNote({ note: { ...note, clarity }, id });
            }
          }
        } else if (clarity < 0.5) {
          setLiveNote(null);
          stableFramesRef.current = 0;
          lastNoteKeyRef.current = '';
        }

        rafRef.current = requestAnimationFrame(tick);
      }

      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setPermissionDenied(true);
    }
  }, [isListening, clearCooldownTimer]);

  // Suppress always wins — clears any existing timer before starting its own
  const suppress = useCallback((ms = 2000) => {
    clearCooldownTimer();
    cooldownRef.current = true;
    stableFramesRef.current = 0;
    lastNoteKeyRef.current = '';
    cooldownTimerRef.current = setTimeout(() => {
      cooldownRef.current = false;
      cooldownTimerRef.current = null;
    }, ms);
  }, [clearCooldownTimer]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    clearCooldownTimer();
  }, [clearCooldownTimer]);

  return { isListening, permissionDenied, liveNote, confirmedNote, start, stop, suppress };
}
