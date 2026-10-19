// ─────────────────────────────────────────────────────────────────────────────
// Ascolto del piano vero (monofonico: una nota alla volta).
//
// Qui c'è solo il collegamento fra microfono, rilevatore di altezza e React.
// Le decisioni — quando una nota conta come suonata — stanno in
// `lib/micListener` (con `lib/noteTracker` e `lib/chordMatcher`), lo stesso
// codice che il banco di prova fa girare su una registrazione per misurare
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
//    il tempo di calcolo che serve al rilevamento;
//  · l'ascolto gira a un ritmo FISSO (ANALYSIS_MS), non a quello dello
//    schermo: in risparmio energetico Safari disegna a 30 fotogrammi al
//    secondo, e un ascolto legato al disegno perdeva accordi (banco
//    `bench:semplice`: accordi della destra 6/8 a 60 al secondo, 3/8 a 30);
//    con lo schermo a 120 Hz, al contrario, raddoppiava il calcolo e
//    cambiava le soglie tarate a 60.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react';
import { PitchDetector } from 'pitchy';
import { MicListener } from '../lib/micListener';
import type { ChordMatch } from '../lib/micListener';
import { setMicSession } from '../lib/audioSession';

export type { ChordMatch } from '../lib/micListener';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** L'indicatore a schermo si aggiorna al massimo così spesso (in ms). */
const UI_THROTTLE_MS = 90;
/** Ogni quanto si ascolta (ms): 60 volte al secondo, qualunque sia lo schermo. */
const ANALYSIS_MS = 1000 / 60;
/** Finestra dello spettro per l'ascolto dei brani (~85 ms a 48 kHz). */
const SPECTRUM_FFT = 4096;

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
  /** Arrivata dentro una nuvola di note estranee (una voce, l'altoparlante): nei brani non conta. */
  cloudy?: boolean;
  /** È l'eco del passo appena preso: nei brani non conta. */
  echo?: boolean;
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
  /** Un'apertura del microfono in corso (vedi `start`). */
  const startingRef = useRef(false);
  /** Il ciclo dell'ascolto (un intervallo, non i fotogrammi dello schermo). */
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmIdRef = useRef(0);
  const lastPaintRef = useRef(0);
  /**
   * L'ascolto. Nasce col primo microfono (serve la frequenza di
   * campionamento) e resta: l'attesa delle note sopravvive se il microfono
   * si spegne e si riaccende.
   */
  const listenerRef = useRef<MicListener | null>(null);
  /** Le attese date prima che il microfono si apra (vedi `expect`). */
  const pendingExpectRef = useRef<{ notes: number[] | null; token: string; upcoming: number[] } | null>(null);
  const [chordMatch, setChordMatch] = useState<ChordMatch | null>(null);

  const stop = useCallback(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setMicSession(false);
    listenerRef.current?.reset();
    setIsListening(false);
    setLiveNote(null);
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    // Un doppio tocco mentre il permesso è in attesa apriva due microfoni (e
    // uno restava acceso anche dopo "spegni").
    if (isListening || startingRef.current) return;
    startingRef.current = true;
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

      // Lo spettro per i brani: finestra più lunga, per separare le note vicine.
      const specAnalyser = audioCtx.createAnalyser();
      specAnalyser.fftSize = SPECTRUM_FFT;
      specAnalyser.smoothingTimeConstant = 0;
      source.connect(specAnalyser);
      const spectrum = new Float32Array(specAnalyser.frequencyBinCount);
      // Un ascolto solo per tutta la vita dell'app: l'attesa in corso continua
      // anche se il microfono si spegne e si riaccende.
      const old = listenerRef.current;
      const listener = old && old.sampleRate === audioCtx.sampleRate ? old : new MicListener(audioCtx.sampleRate, SPECTRUM_FFT);
      if (old && listener !== old) listener.adopt(old);
      listenerRef.current = listener;
      // L'attesa data quando il microfono non era ancora mai stato aperto.
      const pending = pendingExpectRef.current;
      pendingExpectRef.current = null;
      if (pending) listener.expect(pending.notes, pending.token, Date.now(), pending.upcoming);
      listener.start(Date.now()); // il microfono che si apre fa un colpo

      setIsListening(true);
      setPermissionDenied(false);

      function tick() {
        analyser.getFloatTimeDomainData(input);

        let sumSq = 0;
        for (let i = 0; i < input.length; i++) sumSq += input[i] * input[i];
        const rms = Math.sqrt(sumSq / input.length);

        const [pitch, clarity] = detector.findPitch(input, audioCtx.sampleRate);
        const now = Date.now();
        specAnalyser.getFloatFrequencyData(spectrum);
        // I campioni grezzi servono a datare l'attacco dentro la finestra.
        const out = listener.feed(rms, pitch, clarity, input, audioCtx.sampleRate, spectrum, now);
        // Solo in sviluppo: cosa sente, per le prove automatiche (scripts/e2e).
        if (import.meta.env.DEV) {
          const w = window as unknown as { __attacks?: { midi: number; at: number }[]; __frames?: number[]; __mic?: { at: number; midi?: number; onset?: number; match?: string }[] };
          (w.__frames ??= []).push(now);
          if (out.attacks.length) (w.__attacks ??= []).push(...out.attacks.map(a => ({ midi: a.midi, at: a.at })));
          if (out.confirmed) (w.__mic ??= []).push({ at: now, midi: out.confirmed.midi, onset: out.confirmed.onset });
          if (out.match) (w.__mic ??= []).push({ at: now, match: `${out.match.token}:${out.match.midis.join('+')}` });
        }
        if (out.match) setChordMatch(out.match);

        if (out.confirmed !== null) {
          const id = ++confirmIdRef.current;
          setConfirmedNote({
            note: { ...midiToNote(out.confirmed.midi), clarity: out.clarity },
            id,
            at: now,
            onsetAt: out.confirmed.onset,
            cloudy: out.confirmed.cloudy,
            echo: out.confirmed.echo,
          });
        }

        if (now - lastPaintRef.current >= UI_THROTTLE_MS) {
          lastPaintRef.current = now;
          setLevel(out.level);
          setLiveNote(out.live === null ? null : { ...midiToNote(out.live), clarity: out.clarity });
        }

      }

      if (loopRef.current) clearInterval(loopRef.current);
      loopRef.current = setInterval(tick, ANALYSIS_MS);
    } catch {
      setMicSession(false); // niente registrazione: si torna a sola riproduzione
      setPermissionDenied(true);
    } finally {
      startingRef.current = false;
    }
  }, [isListening]);

  /**
   * Silenzia il rilevamento mentre suona l'app (altoparlante → microfono).
   * Chiude anche il varco: la nota successiva dovrà avere un attacco o un
   * silenzio, non basterà la coda che sta ancora risuonando.
   */
  const suppress = useCallback((ms = 1500) => {
    listenerRef.current?.suppress(ms, Date.now());
  }, []);

  /**
   * L'app ha smesso di suonare prima del previsto (Pausa, Stop, cambio di
   * mano): si torna ad ascoltare dopo la coda dell'altoparlante, non quando
   * sarebbe finito il brano. Senza, dopo "Ascolta" e "Pausa" il microfono
   * restava sordo per minuti — con la barra del volume che si muoveva.
   */
  const release = useCallback((tailMs = 1200) => {
    listenerRef.current?.release(Date.now() + tailMs);
  }, []);

  /**
   * L'app sta per suonare queste note dall'altoparlante (l'accompagnamento)
   * e si continua ad ascoltare: `delayMs` è fra quanto parte ognuna. Le note
   * e le loro armoniche, in quel momento, non sono di chi suona.
   */
  const external = useCallback((notes: { midi: number; delayMs: number }[]) => {
    const now = Date.now();
    listenerRef.current?.external(notes.map(n => ({ midi: n.midi, at: now + n.delayMs })));
  }, []);

  /**
   * Le note (MIDI) che il brano aspetta adesso; `token` cambia a ogni passo
   * (due passi di fila con lo stesso accordo sono due attese diverse).
   * `null` quando non si aspetta niente.
   */
  const expect = useCallback((notes: number[] | null, token = '', upcoming: number[] = []) => {
    const listener = listenerRef.current;
    if (listener) {
      pendingExpectRef.current = null;
      listener.expect(notes, token, Date.now(), upcoming);
    } else {
      // Il microfono non è ancora aperto: l'attesa parte con lui.
      pendingExpectRef.current = { notes, token, upcoming };
    }
  }, []);

  useEffect(
    () => () => {
      if (loopRef.current) clearInterval(loopRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    },
    [],
  );

  return { isListening, permissionDenied, liveNote, confirmedNote, level, start, stop, suppress, release, external, expect, chordMatch };
}
