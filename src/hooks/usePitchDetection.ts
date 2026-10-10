// ─────────────────────────────────────────────────────────────────────────────
// Ascolto del piano vero (monofonico: una nota alla volta).
//
// Qui c'è solo il collegamento fra microfono, rilevatore di altezza e React.
// Le decisioni — quando una nota conta come suonata — stanno in
// `lib/noteTracker`, che si può far girare su una registrazione per misurare
// quante note riconosce davvero.
//
// Nei brani (Leggio, studio guidato) c'è un secondo ascolto, polifonico:
// chi suona dice quali note aspetta con `expect`, e `chordMatch` dice quali
// sono arrivate — anche tutte insieme, in un accordo, col pedale. Vedi
// `lib/chordMatcher`.
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
import { ChordMatcher } from '../lib/chordMatcher';
import { setMicSession } from '../lib/audioSession';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** L'indicatore a schermo si aggiorna al massimo così spesso (in ms). */
const UI_THROTTLE_MS = 90;
/** Finestra dello spettro per l'ascolto dei brani (~85 ms a 48 kHz). */
const SPECTRUM_FFT = 4096;
/** Una nuova attesa accetta anche gli attacchi appena prima (chi suona svelto). */
const EXPECT_LOOKBACK_MS = 250;

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
  /** Quando è stato premuto il tasto (Date.now): per il ritmo conta questo. */
  onsetAt: number;
}

/**
 * Le note attese arrivate finora per l'attesa `token` (numeri MIDI), con un
 * numero che cambia a ogni arrivo. È CUMULATIVO: se due aggiornamenti
 * arrivano insieme e lo schermo ne vede solo l'ultimo, non si perde niente.
 */
export interface ChordMatch {
  token: string;
  midis: number[];
  id: number;
}

interface Expectation {
  token: string;
  /** Il token come l'ha dato chi aspetta (senza le note): torna negli eventi. */
  user: string;
  notes: number[];
  since: number;
  got: Set<number>;
  /** Già "consumata" nel riconoscitore (le sue note non valgono per l'attesa dopo). */
  consumed?: boolean;
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
  const matcherRef = useRef<ChordMatcher | null>(null);
  const expectRef = useRef<Expectation | null>(null);
  const matchIdRef = useRef(0);
  const [chordMatch, setChordMatch] = useState<ChordMatch | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setMicSession(false);
    trackerRef.current.reset();
    matcherRef.current = null;
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

      // Lo spettro per i brani: finestra più lunga, per separare le note vicine.
      const specAnalyser = audioCtx.createAnalyser();
      specAnalyser.fftSize = SPECTRUM_FFT;
      specAnalyser.smoothingTimeConstant = 0;
      source.connect(specAnalyser);
      const spectrum = new Float32Array(specAnalyser.frequencyBinCount);
      const matcher = new ChordMatcher(audioCtx.sampleRate, SPECTRUM_FFT);
      matcherRef.current = matcher;
      matcher.block(400, Date.now());
      let matcherBroken = false;

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
        // I campioni grezzi servono a datare l'attacco dentro la finestra.
        const out = tracker.feed(rms, pitch, clarity, now, input, audioCtx.sampleRate);

        // Brani: le note attese sono arrivate? Qualunque cosa succeda qui,
        // l'ascolto di una nota alla volta deve continuare: un errore spegne
        // solo l'ascolto degli accordi.
        if (!matcherBroken) {
          try {
            specAnalyser.getFloatFrequencyData(spectrum);
            const attacks = matcher.feed(spectrum, now);
            // Solo in sviluppo: gli attacchi sentiti, per le prove automatiche.
            if (import.meta.env.DEV && attacks.length) {
              const w = window as unknown as { __attacks?: { midi: number; at: number }[] };
              (w.__attacks ??= []).push(...attacks.map(a => ({ midi: a.midi, at: a.at })));
            }
            const ex = expectRef.current;
            if (ex) {
              matcher.expect(ex.notes.filter(n => !ex.got.has(n)), ex.notes);
              const got = matcher.matched(ex.notes, ex.since).filter(n => !ex.got.has(n));
              if (got.length) {
                got.forEach(n => ex.got.add(n));
                if (ex.notes.every(n => ex.got.has(n))) { matcher.consume(ex.notes, now); ex.consumed = true; }
                setChordMatch({ token: ex.user, midis: [...ex.got], id: ++matchIdRef.current });
              }
            } else {
              matcher.expect([]);
            }
          } catch (err) {
            matcherBroken = true;
            console.error('Ascolto degli accordi disattivato:', err);
          }
        }

        if (out.confirmed !== null) {
          const id = ++confirmIdRef.current;
          setConfirmedNote({
            note: { ...midiToNote(out.confirmed), clarity: out.clarity },
            id,
            at: now,
            onsetAt: out.onset ?? now,
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
    matcherRef.current?.block(ms, Date.now());
  }, []);

  /**
   * L'app ha smesso di suonare prima del previsto (Pausa, Stop, cambio di
   * mano): si torna ad ascoltare dopo la coda dell'altoparlante, non quando
   * sarebbe finito il brano. Senza, dopo "Ascolta" e "Pausa" il microfono
   * restava sordo per minuti — con la barra del volume che si muoveva.
   */
  const release = useCallback((tailMs = 1200) => {
    const until = Date.now() + tailMs;
    trackerRef.current.release(until);
    matcherRef.current?.release(until);
  }, []);

  /**
   * L'app sta per suonare queste note dall'altoparlante (l'accompagnamento)
   * e si continua ad ascoltare: `delayMs` è fra quanto parte ognuna. Le note
   * e le loro armoniche, in quel momento, non sono di chi suona.
   */
  const external = useCallback((notes: { midi: number; delayMs: number }[]) => {
    const now = Date.now();
    matcherRef.current?.external(notes.map(n => ({ midi: n.midi, at: now + n.delayMs })));
  }, []);

  /**
   * Le note (MIDI) che il brano aspetta adesso; `token` cambia a ogni passo
   * (due passi di fila con lo stesso accordo sono due attese diverse).
   * `null` quando non si aspetta niente.
   */
  const expect = useCallback((notes: number[] | null, token = '') => {
    const prev = expectRef.current;
    if (!notes || notes.length === 0) {
      expectRef.current = null;
      return;
    }
    const key = `${token}|${notes.join(',')}`;
    if (prev?.token === key) return;
    // Il passo di prima è stato completato altrove (tasto sullo schermo, o
    // l'ascolto di una nota alla volta): i suoi attacchi non devono valere
    // per il passo nuovo, come se l'avesse preso il riconoscitore.
    if (prev && !prev.consumed && prev.got.size > 0) matcherRef.current?.consume(prev.notes, Date.now());
    expectRef.current = { token: key, user: token, notes, since: Date.now() - EXPECT_LOOKBACK_MS, got: new Set() };
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    },
    [],
  );

  return { isListening, permissionDenied, liveNote, confirmedNote, level, start, stop, suppress, release, external, expect, chordMatch };
}
