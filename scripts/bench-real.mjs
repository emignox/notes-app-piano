// Banco di prova sul pianoforte VERO: `npm run bench:vero`.
//
// La registrazione di prova dell'utente (ottobre 2026: iPad sul leggio di un
// pianoforte acustico, microfono senza filtri, 20 s fra note singole e
// accordi) ascoltata da `src/lib/chordMatcher.ts` col giro dell'app: per ogni
// colpo si aspettano le sue note da 0,25 s prima fino al colpo dopo (+0,1 s).
// È la sola prova che non viene da un pianoforte campionato: timbro, colpo
// del martelletto, stanza e livello sono quelli veri.
//
// La registrazione NON è nel repository (è dell'utente): va messa in
// scripts/mic-bench/.cache/ipad-utente.wav (WAV mono 16 bit, come la salva
// "Diagnosi microfono" nelle Opzioni). Senza, la prova si salta.
//
// I colpi veri vengono da una trascrizione fatta a mano sull'energia delle
// armoniche: tre "note" della prima trascrizione automatica (9,11 s, 9,88 s,
// 18,42 s) erano il rilascio dei tasti, e il riconoscitore fa bene a ignorarle.
//
// Uso: npm run bench:vero [-- --matcher=file.ts] [-- --p='{"SOLO_K":0}']

import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const FILE = new URL('./mic-bench/.cache/ipad-utente.wav', import.meta.url).pathname;
if (!fs.existsSync(FILE)) {
  console.log(`Manca la registrazione ${FILE}: prova saltata.`);
  process.exit(0);
}
const matcherArg = process.argv.find(a => a.startsWith('--matcher='))?.slice('--matcher='.length);
const pArg = process.argv.find(a => a.startsWith('--p='))?.slice(4);

const server = await createServer({
  configFile: false, logLevel: 'silent', appType: 'custom', server: { middlewareMode: true, hmr: false },
});
const { ChordMatcher, P } = await server.ssrLoadModule(matcherArg ? `/@fs${path.resolve(matcherArg)}` : '/src/lib/chordMatcher.ts');
await server.close();
if (pArg) Object.assign(P, JSON.parse(pArg));

// WAV mono a 16 bit
const raw = fs.readFileSync(FILE);
const sr = raw.readUInt32LE(24);
const data = raw.subarray(44);
const x = new Float32Array(data.length >> 1);
for (let i = 0; i < x.length; i++) x[i] = data.readInt16LE(i * 2) / 32768;

/** Lo spettro come AnalyserNode: finestra di Blackman, |X|/N in dB. */
const N = 4096;
const win = Float64Array.from({ length: N }, (_, i) => 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / N) + 0.08 * Math.cos((4 * Math.PI * i) / N));
const rev = new Uint32Array(N);
for (let i = 0; i < N; i++) { let r = 0; for (let k = 0; k < 12; k++) r |= ((i >> k) & 1) << (11 - k); rev[i] = r; }
const re = new Float64Array(N);
const im = new Float64Array(N);
function spectrum(end) {
  for (let i = 0; i < N; i++) { re[rev[i]] = x[end - N + i] * win[i]; im[rev[i]] = 0; }
  for (let s = 2; s <= N; s <<= 1) {
    const h = s >> 1, st = (-2 * Math.PI) / s;
    for (let a = 0; a < N; a += s) for (let j = 0; j < h; j++) {
      const c = Math.cos(st * j), sn = Math.sin(st * j), k = a + j, l = k + h;
      const tr = re[l] * c - im[l] * sn, ti = re[l] * sn + im[l] * c;
      re[l] = re[k] - tr; im[l] = im[k] - ti; re[k] += tr; im[k] += ti;
    }
  }
  const db = new Float32Array(N / 2);
  for (let k = 0; k < N / 2; k++) { const m = Math.hypot(re[k], im[k]) / N; db[k] = m > 0 ? 20 * Math.log10(m) : -200; }
  return db;
}

/** I colpi veri: [secondi, note MIDI]. */
const STEPS = [
  [1.97, [65]], [2.94, [62]], [3.65, [65]], [4.11, [57]], [4.48, [65]], [5.19, [62]], [5.90, [65]], [6.47, [55]], [6.99, [59]],
  [8.35, [60]], [9.27, [59]], [10.92, [48, 60]], [12.45, [48, 60, 64]], [13.89, [48, 64, 67]], [16.21, [43, 47]], [17.54, [43, 47, 62]], [18.93, [43, 50]],
];
const NAMES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
const nm = m => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

function walk(fps) {
  const m = new ChordMatcher(sr, N);
  const res = [];
  let k = 0;
  let since = 0;
  let found = new Set();
  for (let end = N; end < x.length && k < STEPS.length; end += Math.round(sr / fps)) {
    const t = end / sr;
    m.feed(spectrum(end), t * 1000);
    const [at, req] = STEPS[k];
    const deadline = k + 1 < STEPS.length ? STEPS[k + 1][0] + 0.1 : at + 1.2;
    if (t > deadline) { res.push({ req, done: null, got: [...found] }); k++; found = new Set(); since = t * 1000; continue; }
    if (t < at - 0.25) { m.expect([]); continue; }
    m.expect(req.filter(r => !found.has(r)), req);
    for (const n of m.matched(req, Math.max(since, (at - 0.25) * 1000))) found.add(n);
    if (req.every(r => found.has(r))) {
      res.push({ req, done: t - at, got: [...found] });
      m.consume(req, t * 1000);
      since = t * 1000;
      k++;
      found = new Set();
    }
  }
  while (res.length < STEPS.length) res.push({ req: STEPS[res.length][1], done: null, got: [] });
  return res;
}

for (const fps of [60, 30]) {
  const r = walk(fps);
  const ok = r.filter(s => s.done !== null);
  const lat = ok.map(s => s.done * 1000).sort((a, b) => a - b);
  console.log(`${fps} fps: presi ${ok.length}/${r.length} · latenza mediana ${Math.round(lat[lat.length >> 1] ?? 0)} ms`);
  console.log('  ' + r.map(s => `${s.req.map(nm).join('+')}${s.done !== null ? '✓' : s.got.length ? `(solo ${s.got.map(nm).join('+')})` : '✗'}`).join(' '));
}
