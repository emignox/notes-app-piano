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

  const lastNoteKeyRef = useRef<string>('');
  const stableFramesRef = useRef(0);
  const cooldownRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track absolute timestamp of when cooldown expires — suppress only extends, never shortens
  const cooldownUntilRef = useRef<number>(0);

  const STABILITY_FRAMES = 10;    // ~167ms at 60fps — must hold note cleanly
  const COOLDOWN_MS = 2000;       // internal cooldown after confirming
  const CLARITY_THRESHOLD = 0.95; // high: only strong, clear piano tones pass
  const MIN_RMS = 0.015;          // volume floor — filters out quiet residuals and room noise

  // Set cooldown only if it extends the current expiry. Always safe to call.
  const setCooldown = useCallback((ms: number) => {
    const until = Date.now() + ms;
    if (until <= cooldownUntilRef.current) return; // already covered by a longer suppress
    if (cooldownTimerRef.current !== null) clearTimeout(cooldownTimerRef.current);
    cooldownRef.current = true;
    stableFramesRef.current = 0;
    lastNoteKeyRef.current = '';
    cooldownUntilRef.current = until;
    cooldownTimerRef.current = setTimeout(() => {
      cooldownRef.current = false;
      cooldownTimerRef.current = null;
      cooldownUntilRef.current = 0;
    }, ms);
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    if (cooldownTimerRef.current !== null) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = null;
    cooldownUntilRef.current = 0;
    setIsListening(false);
    setLiveNote(null);
    lastNoteKeyRef.current = '';
    stableFramesRef.current = 0;
    cooldownRef.current = false;
  }, []);

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

      setIsListening(true);
      setPermissionDenied(false);

      // Startup grace period
      setCooldown(500);

      function tick() {
        analyser.getFloatTimeDomainData(input);

        // RMS volume check — ignore quiet sounds (residuals, room noise, decayed notes)
        let sumSq = 0;
        for (let i = 0; i < input.length; i++) sumSq += input[i] * input[i];
        const rms = Math.sqrt(sumSq / input.length);

        if (rms < MIN_RMS) {
          setLiveNote(null);
          stableFramesRef.current = 0;
          lastNoteKeyRef.current = '';
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

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
              setCooldown(COOLDOWN_MS);
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
  }, [isListening, setCooldown]);

  // suppress() always extends — never shortens an existing cooldown
  const suppress = useCallback((ms = 3000) => {
    setCooldown(ms);
  }, [setCooldown]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    if (cooldownTimerRef.current !== null) clearTimeout(cooldownTimerRef.current);
  }, []);

  return { isListening, permissionDenied, liveNote, confirmedNote, start, stop, suppress };
}
