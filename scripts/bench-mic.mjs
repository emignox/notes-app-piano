// Banco di prova del microfono: `npm run bench:mic` (serve macOS per decodificare
// i campioni con afconvert; la prima volta li scarica, ~2 MB).
//
// Suona esecuzioni simulate con un pianoforte vero (note singole, melodie,
// ribattute, pedale, bassi col microfono del telefono, rumore, una voce che
// parla nella stanza) e le fa ascoltare a `src/lib/noteTracker.ts` ESATTAMENTE
// come nel browser: finestra di 2048 campioni, pitchy, un fotogramma ogni
// requestAnimationFrame (60 al secondo, 30 col risparmio energetico).
//
// Due gruppi di prove:
//  · TARATURA — quelle su cui sono state scelte le soglie;
//  · CONVALIDA — materiale diverso, mai usato per tarare: altre melodie,
//    arpeggi, 44,1 kHz, fotogrammi irregolari. Se migliora solo la taratura,
//    il cambiamento è sbagliato.
//
// Per confrontare con un'altra versione del rilevatore (per esempio quella
// dell'ultimo commit, estratta con `git show HEAD:src/lib/noteTracker.ts`):
//   npm run bench:mic -- --tracker=/percorso/noteTracker.ts
//
// Cosa conta, in ordine: note FALSE e DOPPIE (diventano errori mai commessi, e
// in una melodia fanno slittare tutto di un passo), poi le PERSE (bisogna
// risuonare), poi la latenza.

import path from 'node:path';
import { createServer } from 'vite';
import { PitchDetector } from 'pitchy';
import {
  SR, loadSamples, loadSpeech, perform, reverb, noise, phoneMic, mix, hum, knocks, resample, noteToMidi, seeded,
} from './mic-bench/audio.mjs';

const verbose = process.argv.includes('-v');
const trackerArg = process.argv.find(a => a.startsWith('--tracker='))?.slice('--tracker='.length);
const FFT = 2048;

const server = await createServer({
  configFile: false, logLevel: 'silent', appType: 'custom', server: { middlewareMode: true, hmr: false },
});
const { NoteTracker } = await server.ssrLoadModule(trackerArg ? `/@fs${path.resolve(trackerArg)}` : '/src/lib/noteTracker.ts');
await server.close();

const samples = await loadSamples();
const speech = loadSpeech();
const rand = seeded(20260804);
const play = (events, opts) => perform(samples, events, opts);

// ── Stanze ──────────────────────────────────────────────────────────────────
const room = x => noise(phoneMic(reverb(x, 0.18), 70), 0.0015, rand);
const bigRoom = x => noise(phoneMic(reverb(x, 0.35), 120), 0.002, rand);
const smallRoom = x => noise(phoneMic(reverb(x, 0.1), 60), 0.001, rand);
const noisy = x => noise(phoneMic(reverb(x, 0.25), 70), 0.012, rand);
const veryNoisy = x => noise(phoneMic(reverb(x, 0.3), 70), 0.03, rand);
const cheapMic = x => noise(phoneMic(reverb(x, 0.18), 180), 0.002, rand);

// ── Materiale ───────────────────────────────────────────────────────────────
const parse = s => s.split(' ').map(x => { const [n, b] = x.split(':'); return [n, Number(b ?? 1)]; });
const ODE = parse('E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2');
const FRA = parse('C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4 F4 G4:2 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 C4 G3 C4:2');
const STELLA = parse('C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2');
const BASSLINE = parse('C3 G2 A2 E2 F2 C3 F2 G2 C3:2 B2 A2 G2:2');
const SCALE = 'C4 D4 E4 F4 G4 A4 B4 C5 D5 E5 F5 G5 F5 E5 D5 C5 B4 A4 G4 F4 E4 D4 C4'.split(' ');
const CURRICULUM = 'C4 D4 E4 F4 G4 A4 B4 C5 D5 E5 F5 G5 G2 A2 B2 C3 D3 E3 F3 G3 A3 B3 F#4 C#4 G#4 D#4 A#4 Bb4 Eb4 Ab4 Db4 Gb4 F6 A5 B5 C6 F2 E2'.split(' ');
const ACCIDENTALS = 'F#4 Bb4 C#4 Eb4 G#4 Ab4 D#4 Db4 A#4 Gb4'.split(' ');

const shuffle = a => a.map(x => [x, rand()]).sort((p, q) => p[1] - q[1]).map(p => p[0]);
const pickN = (n, pool) => Array.from({ length: n }, () => pool[Math.floor(rand() * pool.length)]);

function line(notes, ioi, { legato = 0.9, vel = 0.6, jitter = 0 } = {}) {
  return notes.map((note, i) => ({ note, t: 0.6 + i * ioi, dur: ioi * legato, vel: vel * (1 + jitter * (rand() * 2 - 1)) }));
}
function tune(pairs, beat, { legato = 0.92, vel = 0.6, jitter = 0.15 } = {}) {
  let t = 0.6;
  return pairs.map(([note, b]) => {
    const e = { note, t, dur: b * beat * legato, vel: vel * (1 + jitter * (rand() * 2 - 1)) };
    t += b * beat;
    return e;
  });
}
function arpeggios() {
  const chords = [['C4', 'E4', 'G4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4']];
  return chords.flatMap((c, k) => c.map((note, i) => ({ note, t: 0.6 + k * 1.4 + i * 0.16, dur: 1.1 - i * 0.16, vel: 0.5 })));
}

const TUNING = [
  { id: 'note singole', ev: line(shuffle(CURRICULUM), 1.5, { legato: 0.5 }), env: room },
  { id: 'singole piano (pp)', ev: line(shuffle(CURRICULUM), 1.5, { legato: 0.5, vel: 0.1 }), env: room },
  { id: 'singole forte (ff)', ev: line(shuffle(CURRICULUM), 1.5, { legato: 0.5, vel: 1.4 }), env: room },
  { id: 'singole svelte', ev: line(shuffle(CURRICULUM), 0.7, { legato: 0.98, jitter: 0.3 }), env: room },
  { id: 'Inno 100 bpm', ev: tune(ODE, 0.6), env: room },
  { id: 'Inno 130 bpm', ev: tune(ODE, 60 / 130), env: room },
  { id: 'Inno col pedale', ev: tune(ODE, 0.6), env: room, pedal: true },
  { id: 'ribattute', ev: line(Array(12).fill('G4'), 0.4, { legato: 0.85, jitter: 0.3 }), env: room },
  { id: 'ribattute legate', ev: line(Array(10).fill('E4'), 0.5, { legato: 1 }), env: room },
  { id: 'scala in crome', ev: line(SCALE, 0.25, { legato: 1 }), env: room },
  { id: 'basso', ev: line('E2 F2 G2 A2 B2 C3 D3 E3 F3 G3 A3 B3 C4'.split(' '), 1.2, { legato: 0.7 }), env: room },
  { id: 'basso, mic economico', ev: line('E2 F2 G2 A2 B2 C3 D3 E3 F3 G3 A3 B3 C4'.split(' '), 1.2, { legato: 0.7 }), env: cheapMic },
  { id: 'salti', ev: line('C3 C4 C5 C4 G3 G4 G2 G3 E4 E5 A3 A4 F3 F4 D4 D5'.split(' '), 0.9), env: room },
  { id: 'stanza rumorosa', ev: tune(ODE, 0.6), env: noisy },
  { id: 'stanza molto rumorosa', ev: tune(ODE, 0.6), env: veryNoisy },
  { id: 'silenzio', ev: [], len: 15, env: x => noise(x, 0.0004, rand) },
  { id: 'ronzio elettrico', ev: [], len: 15, env: x => noise(mix(x, hum(x.length), 0.003), 0.0005, rand) },
  { id: 'colpi non intonati', ev: [], len: 15, env: x => noise(mix(x, knocks(x.length, 0.5, rand), 0.02), 0.0005, rand) },
  ...(speech ? [
    { id: 'voce nella stanza', ev: [], len: 15, env: x => room(mix(x, speech, 0.012, 0.3)) },
    { id: 'Inno + voce', ev: tune(ODE, 0.6), env: x => room(mix(x, speech, 0.005, 0.5)) },
  ] : []),
];

const VALIDATION = [
  { id: 'Fra Martino', ev: tune(FRA, 0.55), env: smallRoom },
  { id: 'Fra Martino svelto', ev: tune(FRA, 0.38, { legato: 0.97 }), env: smallRoom },
  { id: 'Stellina staccata', ev: tune(STELLA, 0.5, { legato: 0.45, jitter: 0.25 }), env: bigRoom },
  { id: 'Stellina col pedale', ev: tune(STELLA, 0.5, { jitter: 0.25 }), env: bigRoom, pedal: true },
  { id: 'linea di basso', ev: tune(BASSLINE, 0.6, { vel: 0.7 }), env: bigRoom },
  { id: 'alterazioni', ev: line(pickN(24, ACCIDENTALS), 0.9, { legato: 0.6, jitter: 0.25 }), env: smallRoom },
  { id: 'note a caso', ev: line(pickN(40, CURRICULUM), 1.1, { legato: 0.6, jitter: 0.6 }), env: smallRoom },
  { id: 'note a caso svelte', ev: line(pickN(40, CURRICULUM), 0.6, { legato: 0.95, jitter: 0.5 }), env: bigRoom },
  { id: 'accordi arpeggiati', ev: arpeggios(), env: smallRoom, pedal: true },
  ...(speech ? [{ id: 'Stellina + voce', ev: tune(STELLA, 0.6), env: x => smallRoom(mix(x, speech, 0.006, 0.2)) }] : []),
];

// ── Ascolto, come nel browser ───────────────────────────────────────────────
function listen(buf, { sr = SR, fps = 60, jitter = 0 } = {}) {
  const tracker = new NoteTracker();
  const detector = PitchDetector.forFloat32Array(FFT);
  const input = new Float32Array(FFT);
  const out = [];
  for (let end = FFT; end < buf.length;) {
    const e = Math.floor(end);
    input.set(buf.subarray(e - FFT, e));
    let sum = 0;
    for (const v of input) sum += v * v;
    const [pitch, clarity] = detector.findPitch(input, sr);
    const r = tracker.feed(Math.sqrt(sum / FFT), pitch, clarity, (e / sr) * 1000, input, sr);
    if (r.confirmed !== null) out.push({ t: e / sr, midi: r.confirmed, onset: r.onset === null ? null : r.onset / 1000 });
    let dt = 1 / fps;
    if (jitter) {
      dt *= 1 + jitter * (rand() * 2 - 1);
      if (rand() < 0.03) dt += 0.05; // ogni tanto il telefono si blocca: disegno, notifiche
    }
    end += dt * sr;
  }
  return out;
}

/**
 * Ogni conferma va alla nota appena suonata (o a una dell'accordo arpeggiato
 * in corso). Se quella nota era già stata presa è una DOPPIA; se l'altezza non
 * c'entra è FALSA. Le note senza conferma sono PERSE.
 */
function score(events, confirmed) {
  const ev = events.map(e => ({ ...e, midi: noteToMidi(e.note), hit: false })).sort((a, b) => a.t - b.t);
  const r = { n: ev.length, ok: 0, octave: 0, wrong: 0, dup: 0, missed: 0, lat: [], att: [], issues: [] };
  for (const c of confirmed) {
    const started = ev.filter(e => e.t <= c.t + 0.01);
    const latest = started[started.length - 1];
    if (!latest) { r.wrong++; r.issues.push(`falsa ${c.midi}@${c.t.toFixed(2)}`); continue; }
    const open = started.filter(e => !e.hit && e.t >= latest.t - 0.35);
    const exact = open.filter(e => e.midi === c.midi).pop();
    const sameClass = open.filter(e => (e.midi - c.midi) % 12 === 0).pop();
    const target = exact ?? sameClass;
    if (target) {
      target.hit = true;
      r.lat.push(c.t - target.t);
      // quanto dista l'attacco stimato da quello vero (conta per il ritmo);
      // i campioni Salamander cominciano con ~13 ms di silenzio
      if (c.onset !== null) r.att.push(Math.abs(c.onset - (target.t + 0.013)));
      if (target === exact) r.ok++;
      else { r.octave++; r.issues.push(`ottava ${target.note}→${c.midi}`); }
    } else if (started.some(e => e.hit && e.midi === c.midi && c.t - e.t < 1.5)) {
      r.dup++; r.issues.push(`doppia ${c.midi}@${c.t.toFixed(2)}`);
    } else {
      r.wrong++; r.issues.push(`falsa ${c.midi}@${c.t.toFixed(2)}`);
    }
  }
  for (const e of ev.filter(x => !x.hit)) { r.missed++; r.issues.push(`persa ${e.note}@${e.t.toFixed(2)}`); }
  return r;
}

function runSuite(title, scenarios, conditions) {
  console.log(`\n${title}`);
  const tot = { n: 0, ok: 0, octave: 0, wrong: 0, dup: 0, missed: 0, lat: [], att: [] };
  const rows = [];
  for (const sc of scenarios) {
    const base = sc.env(play(sc.ev, { pedal: sc.pedal, length: sc.len ?? 0 }));
    const acc = { n: 0, ok: 0, octave: 0, wrong: 0, dup: 0, missed: 0, lat: [] };
    for (const cond of conditions) {
      const r = score(sc.ev, listen(resample(base, cond.sr ?? SR), cond));
      for (const k of ['n', 'ok', 'octave', 'wrong', 'dup', 'missed']) { acc[k] += r[k]; tot[k] += r[k]; }
      acc.lat.push(...r.lat); tot.lat.push(...r.lat); tot.att.push(...r.att);
      if (verbose && r.issues.length) console.log(`  ${sc.id} [${cond.name}]: ${r.issues.slice(0, 8).join(' · ')}`);
    }
    acc.lat.sort((a, b) => a - b);
    rows.push({
      prova: sc.id, note: acc.n, giuste: acc.ok, ottava: acc.octave, false: acc.wrong, doppie: acc.dup, perse: acc.missed,
      'latenza ms': acc.lat.length ? Math.round(acc.lat[acc.lat.length >> 1] * 1000) : '–',
    });
  }
  console.table(rows);
  tot.lat.sort((a, b) => a - b);
  tot.att.sort((a, b) => a - b);
  const att = q => Math.round((tot.att[Math.floor(q * (tot.att.length - 1))] ?? 0) * 1000);
  const pct = n => `${((100 * n) / Math.max(1, tot.n)).toFixed(1)}%`;
  console.log(`  ${tot.n} note (${conditions.map(c => c.name).join(', ')}) · giuste ${pct(tot.ok)} · false ${tot.wrong} · doppie ${tot.dup} · perse ${tot.missed} (${pct(tot.missed)}) · latenza mediana ${Math.round((tot.lat[tot.lat.length >> 1] ?? 0) * 1000)} ms`);
  if (tot.att.length) console.log(`  attacco datato su ${tot.att.length} note: errore mediano ${att(0.5)} ms, 90° percentile ${att(0.9)} ms`);
  return tot;
}

if (!speech) console.log('(`say` non disponibile: salto le prove con la voce)');
runSuite('TARATURA', TUNING, [{ name: '60 fps' }, { name: '30 fps', fps: 30 }]);
runSuite('CONVALIDA', VALIDATION, [{ name: '48 kHz' }, { name: '44,1 kHz', sr: 44100 }, { name: '30 fps', fps: 30 }, { name: 'irregolare', fps: 50, jitter: 0.4 }]);
