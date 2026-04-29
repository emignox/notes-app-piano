import { useState, useCallback, useRef } from 'react';
import * as Tone from 'tone';

const BASE_URL = 'https://tonejs.github.io/audio/salamander/';

const SAMPLE_URLS: Record<string, string> = {
  A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
  A1: 'A1.mp3', C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
  A2: 'A2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
  A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
  A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
  A5: 'A5.mp3', C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
  A6: 'A6.mp3', C7: 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3',
  A7: 'A7.mp3', C8: 'C8.mp3',
};

export function useAudio() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const errorSynthRef = useRef<Tone.PolySynth | null>(null);
  // Ref so playNote never changes reference when isLoaded flips
  const isLoadedRef = useRef(false);

  const initialize = useCallback(async () => {
    if (samplerRef.current || isLoading) return;
    setIsLoading(true);
    await Tone.start();

    const sampler = new Tone.Sampler({
      urls: SAMPLE_URLS,
      baseUrl: BASE_URL,
      release: 1,
      onload: () => {
        isLoadedRef.current = true;
        setIsLoaded(true);
        setIsLoading(false);
      },
    }).toDestination();

    samplerRef.current = sampler;

    const errorSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination();
    errorSynth.volume.value = -10;
    errorSynthRef.current = errorSynth;
  }, [isLoading]);

  // Stable reference — reads isLoadedRef, not state
  const playNote = useCallback((toneNote: string, duration = 1.5) => {
    if (!samplerRef.current || !isLoadedRef.current) return;
    try {
      samplerRef.current.triggerAttackRelease(toneNote, duration);
    } catch { /* ignore */ }
  }, []);

  const playError = useCallback(() => {
    if (!errorSynthRef.current) return;
    try {
      const now = Tone.now();
      errorSynthRef.current.triggerAttackRelease(['C3', 'F#3'], '8n', now);
      errorSynthRef.current.triggerAttackRelease(['C3', 'F#3'], '8n', now + 0.15);
    } catch { /* ignore */ }
  }, []);

  return { isLoaded, isLoading, initialize, playNote, playError };
}
