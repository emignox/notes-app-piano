// Suono per il banco di prova del microfono: pianoforte VERO (i campioni
// Salamander che l'app stessa usa per suonare), stanza, rumore e microfono del
// telefono. Niente sinusoidi: un rilevatore tarato su un'onda pulita non dice
// nulla di come si comporterà con le armoniche e i battimenti di un piano.
//
// I campioni si scaricano la prima volta in `.cache/` e si decodificano con
// `afconvert` (macOS). La voce di disturbo si genera con `say`, sempre macOS:
// altrove quelle prove vengono saltate.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const SR = 48000;
const CACHE = new URL('./.cache/', import.meta.url).pathname;
const BASE_URL = 'https://tonejs.github.io/audio/salamander/';
const NAMES = { C: 0, Ds: 3, Fs: 6, A: 9 };

function readPcm16(file) {
  const buf = fs.readFileSync(file);
  let off = 12;
  while (off < buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'data') {
      const data = buf.subarray(off + 8, off + 8 + size);
      const pcm = new Float32Array(data.length / 2);
      for (let i = 0; i < pcm.length; i++) pcm[i] = data.readInt16LE(i * 2) / 32768;
      return pcm;
    }
    off += 8 + size;
  }
  throw new Error(`${file}: WAV senza dati`);
}

function decode(src, dst) {
  execFileSync('afconvert', ['-f', 'WAVE', '-d', `LEI16@${SR}`, '-c', '1', src, dst]);
}

/** Scarica e decodifica i campioni (una volta sola). */
export async function loadSamples() {
  fs.mkdirSync(CACHE, { recursive: true });
  const files = ['A0'];
  for (let o = 1; o <= 7; o++) for (const n of Object.keys(NAMES)) files.push(`${n}${o}`);
  files.push('C8');
  const samples = [];
  for (const name of files) {
    const wav = path.join(CACHE, `${name}.wav`);
    if (!fs.existsSync(wav)) {
      const mp3 = path.join(CACHE, `${name}.mp3`);
      const res = await fetch(`${BASE_URL}${name}.mp3`);
      if (!res.ok) throw new Error(`download ${name}: ${res.status}`);
      fs.writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
      decode(mp3, wav);
      fs.rmSync(mp3);
    }
    const m = /^([A-Z]s?)(\d)$/.exec(name);
    samples.push({ midi: (Number(m[2]) + 1) * 12 + NAMES[m[1]], pcm: readPcm16(wav) });
  }
  return samples.sort((a, b) => a.midi - b.midi);
}

/** Una frase detta da una persona nella stanza, oppure null se `say` non c'è. */
export function loadSpeech() {
  const wav = path.join(CACHE, 'voce.wav');
  try {
    if (!fs.existsSync(wav)) {
      const aiff = path.join(CACHE, 'voce.aiff');
      execFileSync('say', ['-v', 'Alice', '-o', aiff,
        "Allora, oggi proviamo la scala di do maggiore, poi facciamo un po' di lettura. Ricordati di tenere il polso morbido e di non guardare la tastiera. Va bene, adesso ascolta bene il primo esercizio e poi ripetilo con calma, senza fretta."]);
      decode(aiff, wav);
      fs.rmSync(aiff);
    }
    return readPcm16(wav);
  } catch {
    return null;
  }
}

export function noteToMidi(note) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(note);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
  return (Number(m[3]) + 1) * 12 + base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

/** Generatore pseudocasuale con seme: due esecuzioni danno gli stessi numeri. */
export function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** Come Tone.Sampler: campione più vicino, ricampionato; smorzatore al rilascio. */
function render(samples, midi, holdSec, vel, pedal) {
  let best = samples[0];
  for (const s of samples) if (Math.abs(s.midi - midi) < Math.abs(best.midi - midi)) best = s;
  const ratio = 2 ** ((midi - best.midi) / 12);
  const tail = pedal ? 3.5 : 0.25;
  const len = Math.min(Math.floor((holdSec + tail) * SR), Math.floor(best.pcm.length / ratio) - 2);
  const out = new Float32Array(len);
  const holdN = holdSec * SR;
  for (let i = 0; i < len; i++) {
    const x = i * ratio, j = x | 0, fr = x - j;
    let v = best.pcm[j] * (1 - fr) + best.pcm[j + 1] * fr;
    if (i > holdN) v *= Math.exp(-(i - holdN) / SR / (pedal ? 1.2 : 0.07));
    out[i] = v * vel;
  }
  // un taglio netto sarebbe un clic che nessun piano fa
  const fade = Math.min(len, Math.floor(0.05 * SR));
  for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
  return out;
}

/** events: [{ note, t, dur, vel }] → registrazione mono. */
export function perform(samples, events, { pedal = false, length = 0 } = {}) {
  const end = Math.max(length, ...events.map(e => e.t + e.dur + 1.5));
  const buf = new Float32Array(Math.ceil(end * SR));
  for (const e of events) {
    const r = render(samples, noteToMidi(e.note), e.dur, e.vel ?? 0.6, pedal);
    const o = Math.floor(e.t * SR);
    for (let i = 0; i < r.length && o + i < buf.length; i++) buf[o + i] += r[i];
  }
  return buf;
}

// ── Stanza e microfono ──────────────────────────────────────────────────────

/** Riverbero di Schroeder: una stanza di casa. */
export function reverb(x, wet) {
  const combs = [1557, 1617, 1491, 1422].map(d => ({ buf: new Float32Array(Math.round(d * SR / 44100)), i: 0 }));
  const aps = [225, 556].map(d => ({ buf: new Float32Array(Math.round(d * SR / 44100)), i: 0 }));
  const out = new Float32Array(x.length);
  for (let n = 0; n < x.length; n++) {
    let s = 0;
    for (const c of combs) { const y = c.buf[c.i]; c.buf[c.i] = x[n] + y * 0.78; c.i = (c.i + 1) % c.buf.length; s += y; }
    s /= 4;
    for (const a of aps) { const bo = a.buf[a.i]; const v = s + bo * 0.5; a.buf[a.i] = v; s = bo - v * 0.5; a.i = (a.i + 1) % a.buf.length; }
    out[n] = x[n] * (1 - wet) + s * wet;
  }
  return out;
}

/** Rumore rosa (ventola, traffico lontano) a un dato livello. */
export function noise(x, rms, rand) {
  let b0 = 0, b1 = 0, b2 = 0;
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const w = rand() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
    out[i] = x[i] + (b0 + b1 + b2 + w * 0.1848) * 0.363 * rms;
  }
  return out;
}

/** Microfono del telefono: passa-alto a due poli (taglia i bassi). */
export function phoneMic(x, hpHz) {
  const rc = 1 / (2 * Math.PI * hpHz), a = rc / (rc + 1 / SR);
  const out = new Float32Array(x.length);
  let y1 = 0, x1 = 0, y2 = 0, x2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v1 = a * (y1 + x[i] - x1); x1 = x[i]; y1 = v1;
    const v2 = a * (y2 + v1 - x2); x2 = v1; y2 = v2;
    out[i] = v2;
  }
  return out;
}

/** Somma `y`, portato a un certo volume, a `x` da `at` secondi in poi. */
export function mix(x, y, rms, at = 0) {
  let s = 0, n = 0;
  for (const v of y) if (Math.abs(v) > 1e-4) { s += v * v; n++; }
  const g = rms / Math.sqrt(s / Math.max(1, n));
  const out = Float32Array.from(x);
  const o = Math.floor(at * SR);
  for (let i = 0; i < y.length && o + i < out.length; i++) out[o + i] += y[i] * g;
  return out;
}

/** Ronzio di rete: 50 Hz e armoniche (frigorifero, alimentatore). */
export function hum(len) {
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] = Math.sin(2 * Math.PI * 50 * t) + 0.6 * Math.sin(2 * Math.PI * 100 * t) + 0.4 * Math.sin(2 * Math.PI * 150 * t);
  }
  return out;
}

/** Colpi non intonati: passi, un metronomo meccanico, una porta. */
export function knocks(len, every, rand) {
  const out = new Float32Array(len);
  for (let c = 0.3; c * SR < len; c += every) {
    const o = Math.floor(c * SR);
    for (let i = 0; i < 400 && o + i < len; i++) out[o + i] += Math.exp(-i / 60) * (rand() * 2 - 1);
  }
  return out;
}

/** Ricampiona (per provare i telefoni a 44,1 kHz). */
export function resample(buf, sr) {
  if (sr === SR) return buf;
  const r = SR / sr;
  const out = new Float32Array(Math.floor(buf.length / r));
  for (let i = 0; i < out.length; i++) { const x = i * r, j = x | 0, f = x - j; out[i] = buf[j] * (1 - f) + (buf[j + 1] ?? 0) * f; }
  return out;
}
