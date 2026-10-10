// Banco di prova del microfono NEI BRANI: `npm run bench:pezzi` (macOS, come
// bench:mic: la prima volta scarica i campioni del pianoforte).
//
// Suona i pezzi dell'app con il pianoforte vero campionato — due mani, accordi
// (con le note sfasate di qualche millisecondo, come le suona una persona),
// pedale, stanza e microfono del telefono — e fa lo stesso giro del Leggio:
// a ogni passo aspetta le note di quel passo e guarda quando arrivano.
//
// Confronta due ascolti:
//  · MONOFONICO: il rilevatore di una nota alla volta (`noteTracker`), con le
//    note dell'accordo raccolte una per volta, come faceva l'app;
//  · ACCORDI: `chordMatcher`, che cerca nello spettro le note attese.
//
// Conta: passi riconosciuti, passi persi, passi accettati PRIMA di essere
// suonati (falsi), latenza.
//
// Opzioni: -v elenca i passi falsi e gli sbagli accettati (LOST=1 anche i
// persi) con gli attacchi sentiti; --solo=taratura|convalida; --passi=N;
// --p='{"REL_MIN":0.2}' cambia le soglie di chordMatcher per provarle. Nella prova con NOTE SBAGLIATE il passo non deve
// essere accettato: se lo è, è un'accettazione falsa — la cosa peggiore,
// perché insegna che uno sbaglio va bene.

import path from 'node:path';
import { createServer } from 'vite';
import { PitchDetector } from 'pitchy';
import { SR, loadSamples, perform, reverb, noise, phoneMic, resample, noteToMidi, seeded } from './mic-bench/audio.mjs';

const verbose = process.argv.includes('-v');
const matcherArg = process.argv.find(a => a.startsWith('--matcher='))?.slice('--matcher='.length);
const STEPS_PER_PIECE = Number(process.argv.find(a => a.startsWith('--passi='))?.slice(8) ?? 48);

const server = await createServer({
  configFile: false, logLevel: 'silent', appType: 'custom', server: { middlewareMode: true, hmr: false },
});
const { pieces } = await server.ssrLoadModule('/src/data/pieces.ts');
const { requiredNotes, isTiedInto, notesOf } = await server.ssrLoadModule('/src/lib/score.ts');
const { NoteTracker } = await server.ssrLoadModule('/src/lib/noteTracker.ts');
const { ChordMatcher, P: PARAMS } = await server.ssrLoadModule(matcherArg ? `/@fs${path.resolve(matcherArg)}` : '/src/lib/chordMatcher.ts');
const pArg = process.argv.find(a => a.startsWith('--p='))?.slice(4);
if (pArg && PARAMS) Object.assign(PARAMS, JSON.parse(pArg));
const only = process.argv.find(a => a.startsWith('--solo='))?.slice(7);
await server.close();

const samples = await loadSamples();
const rand = seeded(20261010);

// ── Stanze ──────────────────────────────────────────────────────────────────
const room = x => noise(phoneMic(reverb(x, 0.18), 70), 0.0015, rand);
const bigRoom = x => noise(phoneMic(reverb(x, 0.35), 120), 0.002, rand);
const cheapMic = x => noise(phoneMic(reverb(x, 0.2), 180), 0.003, rand);
const noisy = x => noise(phoneMic(reverb(x, 0.25), 70), 0.012, rand);

// ── Dai pezzi alle esecuzioni ───────────────────────────────────────────────
/**
 * Un pezzo suonato da una persona: tempo di studio (60%), un po' irregolare,
 * le note dell'accordo sfasate fino a 25 ms, la destra un po' più forte.
 * `wrongEvery`: in un passo ogni tanto una nota della destra è sbagliata di
 * uno o due semitoni.
 */
function performPiece(piece, { rate = 0.6, wrongEvery = 0, maxSteps = STEPS_PER_PIECE } = {}) {
  const spb = 60 / (piece.bpm * rate);
  const events = [];
  const steps = [];
  let t = 0.8;
  const n = Math.min(piece.steps.length, maxSteps);
  for (let i = 0; i < n; i++) {
    const step = piece.steps[i];
    const req = requiredNotes(piece.steps, i, 'both');
    let wrongAt = null;
    if (wrongEvery && req.length && rand() < wrongEvery) {
      const right = notesOf(step, 'right').filter(x => req.includes(x));
      if (right.length) wrongAt = right[Math.floor(rand() * right.length)];
    }
    for (const hand of ['right', 'left']) {
      if (isTiedInto(piece.steps, i, hand)) continue;
      for (const note of notesOf(step, hand)) {
        // durata: il passo, più i passi in cui la nota è legata
        let beats = step.beats;
        for (let j = i + 1; j < piece.steps.length && isTiedInto(piece.steps, j, hand) && notesOf(piece.steps[j], hand).includes(note); j++) beats += piece.steps[j].beats;
        let midi = noteToMidi(note.replace('♯', '#'));
        if (note === wrongAt) {
          const shift = [-2, -1, 1, 2][Math.floor(rand() * 4)];
          midi += shift;
          // non deve diventare un'altra nota del passo
          if (req.some(r => noteToMidi(r) === midi)) midi += shift > 0 ? 1 : -1;
        }
        events.push({
          note: midiName(midi),
          t: t + rand() * 0.025,
          dur: Math.max(0.08, beats * spb * 0.92),
          vel: (hand === 'right' ? 0.62 : 0.48) * (0.85 + 0.3 * rand()),
        });
      }
    }
    if (req.length) steps.push({ t, req: [...new Set(req.map(r => noteToMidi(r)))], wrong: wrongAt !== null });
    t += step.beats * spb * (0.94 + 0.12 * rand());
  }
  return { events, steps, pedal: piece.steps.some(s => s.ped) };
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiName(m) { return `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`; }

/** Accordi a caso: tre o quattro note più un basso, un accordo al secondo. */
/**
 * Accordi a caso: tre o quattro note più un basso, un accordo al secondo.
 * `soft`: una nota dell'accordo suonata molto più piano (succede: il dito
 *   debole, la nota interna) — deve essere presa lo stesso;
 * `wrong`: una nota sbagliata di un semitono — l'accordo NON va accettato;
 * `missing`: una nota non suonata — l'accordo NON va accettato.
 */
function chordDrill(count, { pedal = false, soft = false, wrong = 0, missing = 0 } = {}) {
  const events = [];
  const steps = [];
  let t = 0.8;
  for (let k = 0; k < count; k++) {
    const root = 55 + Math.floor(rand() * 14);
    const shape = [[0, 4, 7], [0, 3, 7], [0, 4, 7, 12], [0, 3, 8], [0, 5, 9], [0, 4, 10]][Math.floor(rand() * 6)];
    const notes = shape.map(d => root + d);
    if (rand() < 0.6) notes.push(root - 12 - (rand() < 0.5 ? 0 : 5));
    const weak = soft ? Math.floor(rand() * notes.length) : -1;
    const bad = rand() < wrong ? Math.floor(rand() * notes.length) : -1;
    const gone = bad < 0 && rand() < missing ? Math.floor(rand() * notes.length) : -1;
    notes.forEach((m, i) => {
      if (i === gone) return;
      let played = m;
      if (i === bad) {
        played = m + (rand() < 0.5 ? -1 : 1);
        if (notes.includes(played)) played += played > m ? 1 : -1;
      }
      const vel = 0.5 * (0.85 + 0.3 * rand()) * (i === weak ? 0.4 : 1);
      events.push({ note: midiName(played), t: t + rand() * 0.025, dur: 0.85, vel });
    });
    steps.push({ t, req: notes, wrong: bad >= 0 || gone >= 0 });
    t += 1.0 + 0.2 * rand();
  }
  return { events, steps, pedal };
}

// ── Lo spettro, come AnalyserNode (finestra di Blackman, |X|/N, in dB) ──────
const FFT = 4096;
function makeFft(N) {
  const rev = new Uint32Array(N);
  const bitsN = Math.log2(N);
  for (let i = 0; i < N; i++) { let r = 0; for (let b = 0; b < bitsN; b++) r |= ((i >> b) & 1) << (bitsN - 1 - b); rev[i] = r; }
  const win = new Float64Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / N) + 0.08 * Math.cos((4 * Math.PI * i) / N);
  const re = new Float64Array(N), im = new Float64Array(N);
  const db = new Float32Array(N / 2);
  return frame => {
    for (let i = 0; i < N; i++) { re[rev[i]] = frame[i] * win[i]; im[rev[i]] = 0; }
    for (let size = 2; size <= N; size <<= 1) {
      const half = size >> 1, step = (-2 * Math.PI) / size;
      for (let s = 0; s < N; s += size) {
        for (let j = 0; j < half; j++) {
          const a = step * j, c = Math.cos(a), sn = Math.sin(a);
          const k = s + j, l = k + half;
          const tr = re[l] * c - im[l] * sn, ti = re[l] * sn + im[l] * c;
          re[l] = re[k] - tr; im[l] = im[k] - ti; re[k] += tr; im[k] += ti;
        }
      }
    }
    for (let k = 0; k < N / 2; k++) {
      const m = Math.hypot(re[k], im[k]) / N;
      db[k] = m > 0 ? 20 * Math.log10(m) : -200;
    }
    return db;
  };
}
const spectrum = makeFft(FFT);

// ── Il giro del Leggio ──────────────────────────────────────────────────────
/**
 * Fotogramma per fotogramma: si aspetta il passo k; quando tutte le sue note
 * sono arrivate si passa al successivo. Se il passo dopo comincia e questo
 * non è arrivato, è perso.
 */
function walk(buf, sr, fps, steps, detector) {
  const out = steps.map(() => ({ done: null }));
  let k = 0;
  let since = (steps[0]?.t ?? 0) - 0.3;
  let found = new Set();
  for (let end = FFT; end < buf.length && k < steps.length; end += Math.round(sr / fps)) {
    const T = end / sr;
    detector.feed(buf, end, T);
    const deadline = k + 1 < steps.length ? steps[k + 1].t - 0.03 : steps[k].t + 1.2;
    if (T > deadline) { since = T; found = new Set(); k++; continue; }
    if (T < steps[k].t - 0.25) continue;
    detector.expect?.(steps[k].req.filter(r => !found.has(r)));
    for (const m of detector.notes(steps[k].req, since)) found.add(m);
    if (steps[k].req.every(r => found.has(r))) {
      out[k].done = T;
      detector.consume?.(steps[k].req, T);
      since = T;
      found = new Set();
      k++;
    }
  }
  return out;
}

/** Ascolto attuale: una nota alla volta, l'ottava perdonata (come PieceView). */
function monophonic(sr) {
  const tracker = new NoteTracker();
  const det = PitchDetector.forFloat32Array(2048);
  const input = new Float32Array(2048);
  const conf = [];
  return {
    feed(buf, end, T) {
      input.set(buf.subarray(end - 2048, end));
      let sum = 0;
      for (const v of input) sum += v * v;
      const [pitch, clarity] = det.findPitch(input, sr);
      const r = tracker.feed(Math.sqrt(sum / 2048), pitch, clarity, T * 1000, input, sr);
      if (r.confirmed !== null) conf.push({ midi: r.confirmed, at: T });
    },
    notes(req, since) {
      const recent = conf.filter(c => c.at > since);
      return req.filter(r => recent.some(c => (c.midi - r) % 12 === 0));
    },
  };
}

function chords(sr) {
  const matcher = new ChordMatcher(sr, FFT);
  const log = [];
  return {
    matcher,
    log,
    feed(buf, end, T) { log.push(...matcher.feed(spectrum(buf.subarray(end - FFT, end)), T * 1000)); },
    notes(req, since) { return matcher.matched(req, since * 1000 + 1, process.env.OCTAVE !== '0'); },
    consume(req, T) { matcher.consume(req, T * 1000); },
    expect(req) { matcher.expect(req); },
  };
}

function score(steps, res) {
  const r = { passi: 0, presi: 0, persi: 0, falsi: 0, sbagliati: 0, accettatiSbagliati: 0, lat: [] };
  steps.forEach((s, i) => {
    const d = res[i].done;
    if (s.wrong) {
      r.sbagliati++;
      if (d !== null) r.accettatiSbagliati++;
      return;
    }
    r.passi++;
    if (d === null) r.persi++;
    else if (d < s.t - 0.02) r.falsi++;
    else { r.presi++; r.lat.push(d - s.t); }
  });
  return r;
}

function run(title, scenarios, conditions) {
  console.log(`\n${title}`);
  const rows = [];
  const tot = { mono: null, acc: null };
  for (const sc of scenarios) {
    const base = sc.env(perform(samples, sc.perf.events, { pedal: sc.perf.pedal }));
    const row = { prova: sc.id, passi: 0 };
    for (const [key, make] of [['mono', monophonic], ['acc', chords]]) {
      const agg = { passi: 0, presi: 0, persi: 0, falsi: 0, sbagliati: 0, accettatiSbagliati: 0, lat: [] };
      for (const cond of conditions) {
        const sr = cond.sr ?? SR;
        const buf = resample(base, sr);
        const det = make(sr);
        const res = walk(buf, sr, cond.fps ?? 60, sc.perf.steps, det);
        const r = score(sc.perf.steps, res);
        if (verbose && key === 'acc' && det.log) {
          sc.perf.steps.forEach((st, i) => {
            const d = res[i].done;
            const bad = st.wrong ? d !== null : (d !== null && d < st.t - 0.02) || (process.env.LOST && d === null);
            if (!bad) return;
            const att = det.log.filter(a => a.at / 1000 > st.t - 0.5 && a.at / 1000 < st.t + 0.3).map(a => `${midiName(a.midi)}@${(a.at / 1000 - st.t).toFixed(2)}`);
            const played = sc.perf.events.filter(e => Math.abs(e.t - st.t) < 0.03).map(e => e.note);
            console.log(`  ${sc.id} [${cond.name}] ${st.wrong ? 'SBAGLIO ACCETTATO' : d === null ? 'PERSO' : 'FALSO'} #${i} attese ${st.req.map(midiName).join('+')} suonate ${played.join('+')} a ${d === null ? '-' : (d - st.t).toFixed(2)}s · attacchi ${att.join(' ')}`);
          });
        }
        for (const k of Object.keys(agg)) if (k !== 'lat') agg[k] += r[k];
        agg.lat.push(...r.lat);
        if (verbose && key === 'acc') {
          const lost = sc.perf.steps.map((s, i) => (!s.wrong && res[i].done === null ? `${i}:${s.req.map(midiName).join('+')}` : null)).filter(Boolean);
          if (lost.length) console.log(`  ${sc.id} [${cond.name}] persi: ${lost.slice(0, 10).join(' ')}`);
        }
      }
      tot[key] = tot[key] ?? { passi: 0, presi: 0, persi: 0, falsi: 0, sbagliati: 0, accettatiSbagliati: 0, lat: [] };
      for (const k of Object.keys(agg)) if (k !== 'lat') tot[key][k] += agg[k];
      tot[key].lat.push(...agg.lat);
      row.passi = agg.passi;
      const pct = agg.passi ? Math.round((100 * agg.presi) / agg.passi) : 0;
      row[key === 'mono' ? 'monofonico' : 'accordi'] = `${pct}%${agg.falsi ? ` (${agg.falsi} falsi)` : ''}${agg.sbagliati ? ` · sbagli accettati ${agg.accettatiSbagliati}/${agg.sbagliati}` : ''}`;
    }
    rows.push(row);
  }
  console.table(rows);
  for (const [key, label] of [['mono', 'monofonico'], ['acc', 'accordi  ']]) {
    const t = tot[key];
    t.lat.sort((a, b) => a - b);
    const med = Math.round((t.lat[t.lat.length >> 1] ?? 0) * 1000);
    console.log(`  ${label}: presi ${t.presi}/${t.passi} (${((100 * t.presi) / Math.max(1, t.passi)).toFixed(1)}%) · persi ${t.persi} · falsi ${t.falsi} · sbagli accettati ${t.accettatiSbagliati}/${t.sbagliati} · latenza mediana ${med} ms`);
  }
}

const byId = id => pieces.find(p => p.id === id);
const pick = ids => ids.map(byId).filter(Boolean);

// TARATURA: metà dei pezzi; CONVALIDA: l'altra metà, mai usata per le soglie.
const tuning = pieces.filter((_, i) => i % 2 === 0);
const validation = pieces.filter((_, i) => i % 2 === 1);
const envs = [room, bigRoom, cheapMic];

if (only !== 'convalida') run('TARATURA (pezzi pari)', [
  ...tuning.map((p, i) => ({ id: p.title.slice(0, 28), perf: performPiece(p), env: envs[i % envs.length] })),
  { id: 'accordi', perf: chordDrill(24), env: room },
  { id: 'accordi col pedale', perf: chordDrill(24, { pedal: true }), env: bigRoom },
  { id: 'accordi, una nota piano', perf: chordDrill(30, { soft: true }), env: room },
  { id: 'accordi · SBAGLI e MANCANTI', perf: chordDrill(40, { wrong: 0.3, missing: 0.3 }), env: room },
  ...pick(['beethoven-per-elisa', 'chopin-valzer-la-minore', 'brahms-ninna-nanna', 'chopin-marcia-funebre', 'mozart-k265-ah-vous-dirai']).map((p, i) => ({ id: `${p.title.slice(0, 18)} · SBAGLI`, perf: performPiece(p, { wrongEvery: 0.3 }), env: envs[i % envs.length] })),
], [{ name: '60 fps' }, { name: '30 fps', fps: 30 }]);

if (only !== 'taratura') run('CONVALIDA (pezzi dispari, mai usati per tarare)', [
  ...validation.map((p, i) => ({ id: p.title.slice(0, 28), perf: performPiece(p), env: envs[(i + 1) % envs.length] })),
  { id: 'accordi, stanza rumorosa', perf: chordDrill(20), env: noisy },
  { id: 'accordi, una nota piano', perf: chordDrill(30, { soft: true }), env: bigRoom },
  { id: 'accordi piano · SBAGLI e MANCANTI', perf: chordDrill(40, { soft: true, wrong: 0.3, missing: 0.3 }), env: cheapMic },
  ...validation.slice(0, 3).map(p => ({ id: `${p.title.slice(0, 18)} · SBAGLI`, perf: performPiece(p, { wrongEvery: 0.25 }), env: bigRoom })),
], [{ name: '48 kHz' }, { name: '44,1 kHz', sr: 44100 }, { name: '30 fps', fps: 30 }]);
