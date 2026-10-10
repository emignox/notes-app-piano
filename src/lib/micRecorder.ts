// ─────────────────────────────────────────────────────────────────────────────
// Registrazione di prova del microfono, per la diagnosi.
//
// Stessi vincoli dell'ascolto (niente filtri per la voce), suono grezzo, un
// WAV da condividere. Serve a tarare il riconoscimento sul pianoforte e sul
// telefono veri invece che su un pianoforte campionato: quanto è forte il
// rumore di fondo, quanto arrivano forti le note suonate piano e forte, e
// quali impostazioni il sistema ha applicato davvero al microfono.
// ─────────────────────────────────────────────────────────────────────────────

import { setMicSession } from './audioSession';

export interface MicStats {
  sampleRate: number;
  /** Rumore di fondo (10° percentile del volume su finestre di 50 ms), in dBFS. */
  noiseDb: number;
  /** Il campione più forte, in dBFS. */
  peakDb: number;
  /** Il volume dei colpi trovati (finestre di 50 ms), in dBFS, dal più debole. */
  hitsDb: number[];
  /** Saturazione: il segnale ha toccato il massimo. */
  clipped: boolean;
  /** Le impostazioni che il sistema ha applicato davvero al microfono. */
  applied: string;
}

export interface MicRecording {
  blob: Blob;
  stats: MicStats;
}

const db = (v: number) => (v > 0 ? 20 * Math.log10(v) : -120);

/** Registra `seconds` secondi. `onLevel` riceve il tempo trascorso e il volume (0–1). */
export async function recordMic(
  seconds: number,
  onLevel?: (elapsed: number, level: number) => void,
  keepSessionOpen = false,
): Promise<MicRecording> {
  setMicSession(true);
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
      video: false,
    } as MediaStreamConstraints);
  } catch {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }
  const track = stream.getAudioTracks()[0];
  const s = (track?.getSettings?.() ?? {}) as MediaTrackSettings;
  const applied = `echoCancellation=${String(s.echoCancellation)} noiseSuppression=${String(s.noiseSuppression)} autoGainControl=${String(s.autoGainControl)} sampleRate=${String(s.sampleRate)} channelCount=${String(s.channelCount)}`;

  const ctx = new AudioContext();
  await ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  // ScriptProcessor: vecchio ma funziona ovunque, anche su Safari, senza file
  // separati. Non copia nulla in uscita: nessun ritorno nell'altoparlante.
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  let collected = 0;
  const total = Math.round(seconds * ctx.sampleRate);
  await new Promise<void>(resolve => {
    proc.onaudioprocess = e => {
      if (collected >= total) return;
      const data = new Float32Array(e.inputBuffer.getChannelData(0));
      chunks.push(data);
      collected += data.length;
      let sum = 0;
      for (const v of data) sum += v * v;
      onLevel?.(collected / ctx.sampleRate, Math.min(1, Math.sqrt(sum / data.length) / 0.06));
      if (collected >= total) resolve();
    };
    source.connect(proc);
    proc.connect(ctx.destination);
  });
  proc.disconnect();
  source.disconnect();
  stream.getTracks().forEach(t => t.stop());
  const sampleRate = ctx.sampleRate;
  await ctx.close();
  setMicSession(keepSessionOpen);

  const pcm = new Float32Array(collected);
  let off = 0;
  for (const c of chunks) { pcm.set(c, off); off += c.length; }
  return { blob: toWav(pcm, sampleRate), stats: analyse(pcm, sampleRate, applied) };
}

/** Rumore di fondo, picco e volume dei colpi (dove il volume sale di colpo). */
function analyse(pcm: Float32Array, sampleRate: number, applied: string): MicStats {
  const win = Math.round(sampleRate * 0.05);
  const levels: number[] = [];
  let peak = 0;
  for (let i = 0; i + win <= pcm.length; i += win) {
    let sum = 0;
    for (let j = i; j < i + win; j++) {
      const v = pcm[j];
      sum += v * v;
      if (Math.abs(v) > peak) peak = Math.abs(v);
    }
    levels.push(db(Math.sqrt(sum / win)));
  }
  const sorted = [...levels].sort((a, b) => a - b);
  const noiseDb = sorted[Math.floor(sorted.length * 0.1)] ?? -120;
  // Un colpo: il volume sale di almeno 8 dB rispetto al minimo dei 150 ms prima.
  const hits: number[] = [];
  for (let k = 3; k < levels.length; k++) {
    const before = Math.min(levels[k - 1], levels[k - 2], levels[k - 3]);
    if (levels[k] - before < 8) continue;
    // il colpo vale al suo massimo, e i 150 ms dopo sono lo stesso colpo
    let top = k;
    while (top + 1 < levels.length && levels[top + 1] > levels[top]) top++;
    hits.push(levels[top]);
    k = top + 3;
  }
  return {
    sampleRate,
    noiseDb: Math.round(noiseDb),
    peakDb: Math.round(db(peak)),
    hitsDb: hits.map(Math.round).sort((a, b) => a - b),
    clipped: peak >= 0.99,
    applied,
  };
}

/** WAV a 16 bit, mono. */
function toWav(pcm: Float32Array, sampleRate: number): Blob {
  const buf = new ArrayBuffer(44 + pcm.length * 2);
  const v = new DataView(buf);
  const text = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  text(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) v.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(pcm[i] * 32767))), true);
  return new Blob([buf], { type: 'audio/wav' });
}
