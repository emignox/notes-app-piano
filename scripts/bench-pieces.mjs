// Banco di prova del microfono NEI BRANI: `npm run bench:pezzi` (macOS, come
// bench:mic: la prima volta scarica i campioni del pianoforte).
//
// Suona i pezzi dell'app con il pianoforte vero campionato — due mani, accordi
// (con le note sfasate di qualche millisecondo, come le suona una persona),
// pedale, stanza e microfono del telefono — e fa lo stesso giro del Leggio:
// a ogni passo aspetta le note di quel passo e guarda quando arrivano.
//
// Confronta gli ascolti:
//  · MONOFONICO: il rilevatore di una nota alla volta (`noteTracker`), con le
//    note dell'accordo raccolte una per volta, come faceva l'app;
//  · ACCORDI: `chordMatcher`, che cerca nello spettro le note attese;
//  · APP (solo col giro "app"): quello che fa davvero il Leggio, cioè
//    `chordMatcher` più il monofonico come riserva (nota giusta o all'ottava,
//    attaccata dopo l'inizio dell'attesa).
//
// Conta: passi riconosciuti, passi persi, passi accettati PRIMA di essere
// suonati (falsi), latenza.
//
// Le prove:
//  · taratura, convalida: i pezzi al livello "da studio" (microfono vicino,
//    suonato mf), col giro di sempre — i numeri si confrontano con i vecchi;
//  · livelli: le stesse esecuzioni attenuate di 0, −15, −25, −35 dB prima
//    dell'ascolto, col rumore di fondo che NON si abbassa (un iPad senza
//    guadagno automatico, il piano a qualche metro);
//  · piano: suonato p e pp (più debole e più scuro), e pp subito dopo un
//    accordo ff;
//  · veloci: scale e arpeggi in sedicesimi a 6, 8, 10 note al secondo (una e
//    due mani), note ribattute, trilli, basso albertino sotto una melodia;
//  · ipad: il timbro misurato sull'iPad vero (dal Re4 in su quasi solo la
//    fondamentale, vedi `darken`) al suo livello, anche più piano.
// Le prove nuove usano il giro "app" (vedi `walkApp`).
//
// Opzioni: -v elenca i passi falsi e gli sbagli accettati (LOST=1 anche i
// persi) con gli attacchi sentiti; --solo=taratura|convalida|livelli|piano|
// veloci|ipad|nuove|tutto (anche più d'una, separate da virgole; senza --solo:
// taratura e convalida, come prima); --passi=N; --giro=app usa il giro
// dell'app anche per taratura e convalida; --p='{"REL_MIN":0.2}' cambia le
// soglie di chordMatcher per provarle. Nella prova con NOTE SBAGLIATE il passo
// non deve essere accettato: se lo è, è un'accettazione falsa — la cosa
// peggiore, perché insegna che uno sbaglio va bene.

import path from 'node:path';
import { createServer } from 'vite';
import { PitchDetector } from 'pitchy';
import { SR, loadSamples, perform, reverb, noise, phoneMic, resample, noteToMidi, seeded, level } from './mic-bench/audio.mjs';

const verbose = process.argv.includes('-v');
const matcherArg = process.argv.find(a => a.startsWith('--matcher='))?.slice('--matcher='.length);
const passiArg = process.argv.find(a => a.startsWith('--passi='))?.slice(8);
const STEPS_PER_PIECE = Number(passiArg ?? 48);
const giroArg = process.argv.find(a => a.startsWith('--giro='))?.slice(7);

const server = await createServer({
  configFile: false, logLevel: 'silent', appType: 'custom', server: { middlewareMode: true, hmr: false },
});
const { pieces } = await server.ssrLoadModule('/src/data/pieces.ts');
const { requiredNotes, isTiedInto, notesOf } = await server.ssrLoadModule('/src/lib/score.ts');
const { NoteTracker } = await server.ssrLoadModule('/src/lib/noteTracker.ts');
const { ChordMatcher, P: PARAMS } = await server.ssrLoadModule(matcherArg ? `/@fs${path.resolve(matcherArg)}` : '/src/lib/chordMatcher.ts');
const pArg = process.argv.find(a => a.startsWith('--p='))?.slice(4);
if (pArg && PARAMS) Object.assign(PARAMS, JSON.parse(pArg));
const soloArg = process.argv.find(a => a.startsWith('--solo='))?.slice(7);
await server.close();

const SUITES = ['taratura', 'convalida', 'livelli', 'piano', 'veloci', 'ipad'];
const wanted = new Set((soloArg ?? 'taratura,convalida').split(',').flatMap(s =>
  s === 'tutto' ? SUITES : s === 'nuove' ? ['livelli', 'piano', 'veloci', 'ipad'] : [s]));
for (const s of wanted) if (!SUITES.includes(s)) throw new Error(`--solo: prova sconosciuta "${s}" (${SUITES.join(', ')}, nuove, tutto)`);

const samples = await loadSamples();
// Le prove di sempre usano questa sequenza (taratura e poi convalida, come
// prima): i loro numeri restano confrontabili. Le prove nuove ripartono
// ognuna da un seme suo, così si possono lanciare da sole.
let rand = seeded(20261010);

// ── Stanze ──────────────────────────────────────────────────────────────────
const room = x => noise(phoneMic(reverb(x, 0.18), 70), 0.0015, rand);
const bigRoom = x => noise(phoneMic(reverb(x, 0.35), 120), 0.002, rand);
const cheapMic = x => noise(phoneMic(reverb(x, 0.2), 180), 0.003, rand);
const noisy = x => noise(phoneMic(reverb(x, 0.25), 70), 0.012, rand);

// Le stesse stanze SENZA rumore: il rumore lo aggiunge il livello d'ingresso,
// dopo l'attenuazione (vedi `atLevel`).
const roomDry = x => phoneMic(reverb(x, 0.18), 70);
const bigRoomDry = x => phoneMic(reverb(x, 0.35), 120);
const cheapMicDry = x => phoneMic(reverb(x, 0.2), 180);

/**
 * Rumore di fondo: −60 dBFS di RMS, rosa. È il fruscio di una stanza quieta
 * più il preamplificatore del microfono a guadagno fisso; a 0 dB vale quanto
 * il rumore della stanza delle prove di sempre (~−61 dBFS).
 */
const FLOOR_DB = -60;
/** Condizione: le esecuzioni attenuate di `db` e il rumore di fondo dopo. */
const atLevel = (db, extra = {}) => ({ name: `${db === 0 ? '0' : `−${-db}`} dB`, post: x => level(x, db, FLOOR_DB, rand), ...extra });
/**
 * Come l'iPad vero (registrazione di prova dell'utente, ottobre 2026): il
 * microfono senza filtri manda il pianoforte circa 28 dB più piano del banco
 * e il rumore a −88 dBFS. Qui: attenuato di 28 dB, rumore rosa a −85 dBFS.
 */
const IPAD = { name: 'iPad vero (−28 dB, rumore −85)', post: x => level(x, -28, -85, rand) };
/** Lo stesso iPad, suonato più piano (−38 dB). */
const IPAD_SOFT = { name: 'iPad, più piano (−38 dB)', post: x => level(x, -38, -85, rand) };

// ── Dai pezzi alle esecuzioni ───────────────────────────────────────────────
/**
 * Un pezzo suonato da una persona: tempo di studio (60%), un po' irregolare,
 * le note dell'accordo sfasate fino a 25 ms, la destra un po' più forte.
 * `wrongEvery`: in un passo ogni tanto una nota della destra è sbagliata di
 * uno o due semitoni. `dyn`: moltiplica la forza dei tasti (p, pp); `lp`:
 * suono più scuro (Hz del passa-basso), come un tasto premuto piano.
 */
function performPiece(piece, { rate = 0.6, wrongEvery = 0, maxSteps = STEPS_PER_PIECE, dyn = 1, lp = 0, tilt = 0 } = {}) {
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
        const ev = {
          note: midiName(midi),
          t: t + rand() * 0.025,
          dur: Math.max(0.08, beats * spb * 0.92),
          vel: (hand === 'right' ? 0.62 : 0.48) * (0.85 + 0.3 * rand()) * dyn,
        };
        if (lp) ev.lp = lp;
        if (tilt) ev.tilt = tilt;
        events.push(ev);
      }
    }
    if (req.length) steps.push({ t, req: [...new Set(req.map(r => noteToMidi(r)))], wrong: wrongAt !== null });
    t += step.beats * spb * (0.94 + 0.12 * rand());
  }
  return { events, steps, pedal: piece.steps.some(s => s.ped) };
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiName(m) { return `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`; }

/**
 * Accordi a caso: tre o quattro note più un basso, un accordo al secondo.
 * `soft`: una nota dell'accordo suonata molto più piano (succede: il dito
 *   debole, la nota interna) — deve essere presa lo stesso;
 * `wrong`: una nota sbagliata di un semitono — l'accordo NON va accettato;
 * `missing`: una nota non suonata — l'accordo NON va accettato;
 * `dyn`, `lp`: come in `performPiece`.
 */
function chordDrill(count, { pedal = false, soft = false, wrong = 0, missing = 0, dyn = 1, lp = 0, tilt = 0 } = {}) {
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
      const vel = 0.5 * (0.85 + 0.3 * rand()) * (i === weak ? 0.4 : 1) * dyn;
      const ev = { note: midiName(played), t: t + rand() * 0.025, dur: 0.85, vel };
      if (lp) ev.lp = lp;
      if (tilt) ev.tilt = tilt;
      events.push(ev);
    });
    steps.push({ t, req: notes, wrong: bad >= 0 || gone >= 0 });
    t += 1.0 + 0.2 * rand();
  }
  return { events, steps, pedal };
}

// ── Dinamiche ───────────────────────────────────────────────────────────────
/**
 * Forza dei tasti rispetto al "mf" delle prove di sempre, e quanto si scurisce
 * il suono. I campioni sono di una sola dinamica: qui la si abbassa e si
 * tolgono un po' di armoniche alte. p ≈ −8 dB, pp ≈ −16 dB (un pianoforte vero
 * fra pp e ff ha 30–40 dB: qui stiamo ancora larghi).
 */
const DYN = { p: { dyn: 0.4, lp: 2500 }, pp: { dyn: 0.16, lp: 1500 } };

/**
 * Un accordo ff (tre note e un basso) e subito dopo una frase pp nella destra,
 * tre note al secondo: l'accordo ff alza "l'attacco più forte di recente" e le
 * note pp devono passare lo stesso. Si contano solo le note pp: gli accordi
 * sono già misurati altrove.
 */
function ffThenPp(cycles) {
  const events = [];
  const steps = [];
  let t = 0.8;
  for (let c = 0; c < cycles; c++) {
    const root = 48 + Math.floor(rand() * 8);
    const chord = [root, root + 4, root + 7, root - 12];
    for (const m of chord) events.push({ note: midiName(m), t: t + rand() * 0.02, dur: 0.9, vel: 0.95 * (0.9 + 0.2 * rand()) });
    steps.push({ t, req: chord, wrong: false, ignore: true });
    let m = 67 + Math.floor(rand() * 6);
    let u = t + 0.95;
    for (let i = 0; i < 4; i++) {
      events.push({ note: midiName(m), t: u, dur: 0.3, vel: 0.62 * DYN.pp.dyn * (0.85 + 0.3 * rand()), lp: DYN.pp.lp });
      steps.push({ t: u, req: [m], wrong: false });
      m += [-2, -1, 1, 2][Math.floor(rand() * 4)];
      u += 0.33 * (0.95 + 0.1 * rand());
    }
    t = u + 0.4;
  }
  return { events, steps, pedal: false };
}

// ── Passaggi veloci ─────────────────────────────────────────────────────────
/**
 * Una sequenza di passi a `rate` note al secondo. Ogni passo è una lista di
 * note `{ midi, len, vel }` (`len` in passi: una melodia tenuta sopra un
 * accompagnamento). Le note sono legate (si sovrappongono appena), con un
 * po' di irregolarità nel tempo (±8 ms) e nella forza. `wrong`: ogni tanto la
 * prima nota del passo è sbagliata di un semitono (il passo non va preso).
 */
function sequence(stepNotes, rate, { wrong = 0, dyn = 1, tilt = 0 } = {}) {
  const ioi = 1 / rate;
  const events = [];
  const steps = [];
  let t = 0.8;
  for (const notes of stepNotes) {
    const req = notes.map(n => n.midi);
    const bad = wrong && rand() < wrong ? 0 : -1;
    notes.forEach((n, i) => {
      let played = n.midi;
      if (i === bad) {
        played += rand() < 0.5 ? -1 : 1;
        if (req.includes(played)) played += played > n.midi ? 1 : -1;
      }
      events.push({
        note: midiName(played),
        t: t + (rand() - 0.5) * 0.016,
        dur: (n.len ?? 1) * ioi * 1.08,
        vel: (n.vel ?? 0.5) * (0.85 + 0.3 * rand()) * dyn,
        ...(tilt ? { tilt } : {}),
      });
    });
    steps.push({ t, req, wrong: bad >= 0 });
    t += ioi * (0.97 + 0.06 * rand());
  }
  return { events, steps, pedal: false };
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
/** Scala maggiore di Do su `octaves` ottave, su e giù, ripetuta fino a `count` note. */
function scaleNotes(from, octaves, count) {
  const up = [];
  for (let o = 0; o < octaves; o++) for (const d of MAJOR) up.push(from + 12 * o + d);
  up.push(from + 12 * octaves);
  const loop = [...up, ...up.slice(1, -1).reverse()];
  return Array.from({ length: count }, (_, i) => loop[i % loop.length]);
}
/** Arpeggi spezzati su Do, La min, Fa, Sol7 (due ottave su e giù per accordo). */
function arpeggioNotes(from, count) {
  const chords = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2, 5]];
  const out = [];
  for (let c = 0; out.length < count; c = (c + 1) % chords.length) {
    const ch = chords[c];
    const up = [];
    for (let o = 0; o < 2; o++) for (const d of ch) up.push(from + 12 * o + d);
    up.push(from + 24 + ch[0]);
    out.push(...up, ...up.slice(1, -1).reverse());
  }
  return out.slice(0, count);
}

const one = (midis, vel = 0.5) => midis.map(m => [{ midi: m, vel }]);
/** Due mani: la sinistra `gap` semitoni sotto, un po' più piano. */
const two = (midis, gap) => midis.map(m => [{ midi: m, vel: 0.52 }, { midi: m - gap, vel: 0.44 }]);

/** Note ribattute: ogni nota della melodia quattro volte. */
function repeatedNotes(count) {
  const mel = [67, 69, 71, 72, 74, 72, 71, 69, 67, 64, 65, 67];
  return Array.from({ length: count }, (_, i) => [{ midi: mel[Math.floor(i / 4) % mel.length], vel: 0.5 }]);
}

/** Trillo fra `a` e `b`. */
const trill = (a, b, count) => Array.from({ length: count }, (_, i) => [{ midi: i % 2 ? b : a, vel: 0.5 }]);

/**
 * Basso albertino (Do-Sol-Mi-Sol in sedicesimi, più piano) con la melodia
 * della destra a ogni quarto, tenuta: come la Sonata K. 545.
 */
function alberti(count) {
  const bass = [[48, 55, 52, 55], [47, 55, 50, 55], [48, 55, 52, 55], [48, 53, 45, 53], [47, 55, 50, 53]];
  const mel = [72, 76, 79, 77, 76, 74, 72, 71, 72, 74, 76, 72, 74, 71, 67, 72];
  return Array.from({ length: count }, (_, i) => {
    const notes = [{ midi: bass[Math.floor(i / 4) % bass.length][i % 4], vel: 0.38 }];
    if (i % 4 === 0) notes.unshift({ midi: mel[(i / 4) % mel.length], len: 4, vel: 0.6 });
    return notes;
  });
}

// ── Lo spettro, come AnalyserNode (finestra di Blackman, |X|/N, in dB) ──────
const FFT = 4096;
/**
 * Bin dello spettro tenuti per fotogramma: chordMatcher guarda solo sotto i
 * 5,2 kHz (~450 bin a 48 kHz); 1024 bastano anche con un'altra soglia.
 */
const SPEC_KEEP = 1024;
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

/**
 * Una registrazione, analizzata una volta sola: per ogni fotogramma l'istante,
 * lo spettro (i primi SPEC_KEEP bin) e le note confermate dal rilevatore
 * monofonico (che non dipende da cosa si aspetta). I vari ascolti e i vari
 * giri ripartono da qui senza rifare i conti.
 */
function analyse(buf, sr, fps) {
  const hop = Math.round(sr / fps);
  const times = [];
  const spec = [];
  const conf = [];
  const tracker = new NoteTracker();
  const det = PitchDetector.forFloat32Array(2048);
  const input = new Float32Array(2048);
  for (let end = FFT; end < buf.length; end += hop) {
    const T = end / sr;
    times.push(T);
    spec.push(spectrum(buf.subarray(end - FFT, end)).slice(0, SPEC_KEEP));
    input.set(buf.subarray(end - 2048, end));
    let sum = 0;
    for (const v of input) sum += v * v;
    const [pitch, clarity] = det.findPitch(input, sr);
    const r = tracker.feed(Math.sqrt(sum / 2048), pitch, clarity, T * 1000, input, sr);
    if (r.confirmed !== null) conf.push({ midi: r.confirmed, at: T, onset: r.onset === null ? T : r.onset / 1000, frame: times.length - 1 });
  }
  return { sr, fps, times, spec, conf };
}

// ── Il giro del Leggio ──────────────────────────────────────────────────────
/**
 * Il giro di sempre. Fotogramma per fotogramma: si aspetta il passo k; quando
 * tutte le sue note sono arrivate si passa al successivo. Se il passo dopo
 * comincia e questo non è arrivato, è perso.
 */
function walk(an, steps, detector) {
  const out = steps.map(() => ({ done: null }));
  let k = 0;
  let since = (steps[0]?.t ?? 0) - 0.3;
  let found = new Set();
  for (let i = 0; i < an.times.length && k < steps.length; i++) {
    const T = an.times[i];
    detector.feed(i, T);
    const deadline = k + 1 < steps.length ? steps[k + 1].t - 0.03 : steps[k].t + 1.2;
    if (T > deadline) { since = T; found = new Set(); k++; continue; }
    if (T < steps[k].t - 0.25) continue;
    detector.expect?.(steps[k].req.filter(r => !found.has(r)), steps[k].req);
    for (const m of detector.notes(steps[k].req, since, since)) found.add(m);
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

/** La nuova attesa accetta gli attacchi fino a tanto prima (come EXPECT_LOOKBACK_MS). */
const LOOKBACK = 0.25;
/** Un passo vale anche se arriva in ritardo, entro tanto dall'attacco del passo dopo. */
const LATE = 0.25;
/** Fotogrammi fra il passo preso e la nuova attesa: React ridisegna, poi l'effetto chiama `expect`. */
const APP_FRAMES = 2;
/** Dopo un passo perso, la nuova attesa si considera partita tanto prima dell'attacco del passo. */
const RESYNC = 0.05;

/**
 * Il giro come lo fa l'app (`usePitchDetection` + Leggio):
 *  · l'attesa del passo k parte quando il passo k−1 è stato preso (dopo
 *    APP_FRAMES fotogrammi), non quando il passo k sta per essere suonato:
 *    chi va piano ha la nota attesa già pronta, come nell'app;
 *  · la nuova attesa guarda indietro di LOOKBACK (chi suona svelto); la
 *    guardia e gli echi di chordMatcher restano quelli suoi;
 *  · chi suona va avanti col suo tempo anche se l'app è rimasta indietro: il
 *    passo vale se preso entro l'attacco del passo dopo + LATE (preso dopo
 *    l'attacco del passo dopo: "in ritardo"). Oltre, è perso.
 *
 * Dopo un passo perso l'app resterebbe ferma lì finché non risuoni la nota,
 * e tutto il resto del passaggio andrebbe perso con lui. Il banco invece
 * misura ogni passo: torna indietro (lo stato dell'ascolto è stato salvato) al
 * momento in cui l'attesa del passo dopo sarebbe partita se il perso fosse
 * stato preso in tempo — RESYNC prima del suo attacco — e riascolta da lì.
 */
function walkApp(an, steps, detector) {
  const out = steps.map(() => ({ done: null }));
  let k = 0;
  let setAt = an.times[0] ?? 0;
  let since = setAt - LOOKBACK;
  let found = new Set();
  let pause = 0;
  /** Lo stato salvato per riprendere dal passo k+1 se k va perso. */
  let snap = null;
  for (let i = 0; i < an.times.length && k < steps.length; i++) {
    const T = an.times[i];
    if (!snap && pause === 0 && k + 1 < steps.length && T >= steps[k + 1].t - RESYNC) {
      snap = { i, k: k + 1, setAt: Math.max(setAt, T), state: detector.save() };
    }
    detector.feed(i, T);
    const deadline = k + 1 < steps.length ? steps[k + 1].t + LATE : steps[k].t + 1.2;
    if (T > deadline) {
      if (!snap) break; // l'ultimo passo
      detector.restore(snap.state);
      i = snap.i - 1;
      k = snap.k;
      setAt = snap.setAt;
      since = setAt - LOOKBACK;
      found = new Set();
      pause = 0;
      snap = null;
      continue;
    }
    if (pause > 0) {
      // Il passo è preso, la nuova attesa non c'è ancora: il hook non aspetta niente.
      pause--;
      detector.expect?.([]);
      if (pause === 0) { setAt = T; since = T - LOOKBACK; }
      continue;
    }
    detector.expect?.(steps[k].req.filter(r => !found.has(r)), steps[k].req);
    for (const m of detector.notes(steps[k].req, since, setAt)) found.add(m);
    if (steps[k].req.every(r => found.has(r))) {
      out[k].done = T;
      detector.consume?.(steps[k].req, T);
      found = new Set();
      pause = APP_FRAMES;
      snap = null;
      k++;
    }
  }
  return out;
}

/**
 * Copia dello stato di un oggetto (per tornare indietro nel giro): i campi
 * semplici, le liste (con gli oggetti dentro copiati: un attacco cambia forza
 * dopo), gli array tipizzati, gli insiemi e le mappe. Le tabelle fisse (le
 * bande) restano condivise: non cambiano.
 */
function cloneState(obj) {
  const out = {};
  for (const [key, v] of Object.entries(obj)) {
    if (Array.isArray(v)) out[key] = v.map(x => (x && typeof x === 'object' && !Array.isArray(x) && !ArrayBuffer.isView(x) && !(x instanceof Map) && !(x instanceof Set) ? { ...x } : x));
    else if (ArrayBuffer.isView(v)) out[key] = v.slice();
    else if (v instanceof Set) out[key] = new Set(v);
    else if (v instanceof Map) out[key] = new Map(v);
    else out[key] = v;
  }
  return out;
}

/**
 * Monofonico. Col giro di sempre come lo usava l'app: una nota alla volta,
 * confermata dopo l'inizio dell'attesa, l'ottava perdonata (come PieceView).
 * Col giro dell'app, la stessa regola della riserva del Leggio (sotto).
 */
function monophonic(an, giro) {
  let upTo = -1;
  return {
    feed(i) { upTo = i; },
    save: () => upTo,
    restore(u) { upTo = u; },
    notes(req, since, waitSince) {
      if (giro === 'app') return leggioMono(an, upTo, req, waitSince);
      const recent = an.conf.filter(c => c.frame <= upTo && c.at > since);
      return req.filter(r => recent.some(c => (c.midi - r) % 12 === 0));
    },
  };
}

/**
 * La riserva monofonica del Leggio: una nota confermata vale se è attaccata
 * dopo l'inizio dell'attesa (−30 ms), ed è una nota del passo o la sua ottava.
 */
function leggioMono(an, upTo, req, waitSince) {
  const out = new Set();
  for (const c of an.conf) {
    if (c.frame > upTo || c.onset < waitSince - 0.03) continue;
    if (req.includes(c.midi)) out.add(c.midi);
    else { const o = req.find(m => Math.abs(m - c.midi) === 12); if (o !== undefined) out.add(o); }
  }
  return [...out];
}

function chords(an, { fallback = false } = {}) {
  const matcher = new ChordMatcher(an.sr, FFT);
  const log = [];
  let upTo = -1;
  return {
    matcher,
    log,
    feed(i, T) { upTo = i; log.push(...matcher.feed(an.spec[i], T * 1000)); },
    save: () => ({ m: cloneState(matcher), log: log.length, upTo }),
    restore(s) { Object.assign(matcher, cloneState(s.m)); log.length = s.log; upTo = s.upTo; },
    notes(req, since, waitSince) {
      const got = matcher.matched(req, since * 1000 + 1, process.env.OCTAVE !== '0');
      return fallback ? [...new Set([...got, ...leggioMono(an, upTo, req, waitSince)])] : got;
    },
    consume(req, T) { matcher.consume(req, T * 1000); },
    expect(req, step) { matcher.expect(req, step); },
  };
}

const LISTENERS = {
  mono: { label: 'monofonico', make: (an, giro) => monophonic(an, giro) },
  acc: { label: 'accordi', make: an => chords(an) },
  app: { label: 'app (accordi + mono)', make: an => chords(an, { fallback: true }) },
};

const emptyScore = () => ({ passi: 0, presi: 0, persi: 0, falsi: 0, tardi: 0, sbagliati: 0, accettatiSbagliati: 0, sbagliDopo: 0, lat: [] });

function score(steps, res) {
  const r = emptyScore();
  steps.forEach((s, i) => {
    if (s.ignore) return;
    const d = res[i].done;
    if (s.wrong) {
      r.sbagliati++;
      // Preso dopo l'attacco del passo seguente (solo col giro dell'app): non
      // è lo sbaglio a essere accettato, è il passo dopo che contiene la
      // nota mancante — l'app va avanti come se l'avessi corretto. Si conta a parte.
      if (d !== null && i + 1 < steps.length && d > steps[i + 1].t + 0.03) r.sbagliDopo++;
      else if (d !== null) r.accettatiSbagliati++;
      return;
    }
    r.passi++;
    if (d === null) r.persi++;
    else if (d < s.t - 0.02) r.falsi++;
    else {
      r.presi++;
      r.lat.push(d - s.t);
      if (i + 1 < steps.length && d > steps[i + 1].t) r.tardi++;
    }
  });
  return r;
}

function addScore(into, r) {
  for (const k of Object.keys(into)) if (k !== 'lat') into[k] += r[k];
  into.lat.push(...r.lat);
}

const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
function quantile(xs, q) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
}
const ms = v => Math.round(v * 1000);

/** Una riga di riepilogo. */
function summary(label, t) {
  const med = ms(quantile(t.lat, 0.5));
  const p90 = ms(quantile(t.lat, 0.9));
  console.log(`  ${label.padEnd(22)}: presi ${t.presi}/${t.passi} (${((100 * t.presi) / Math.max(1, t.passi)).toFixed(1)}%) · persi ${t.persi} · falsi ${t.falsi}${t.tardi ? ` · in ritardo ${t.tardi}` : ''} · sbagli accettati ${t.accettatiSbagliati}/${t.sbagliati}${t.sbagliDopo ? ` (+${t.sbagliDopo} completati dal passo dopo)` : ''} · latenza mediana ${med} ms (90°: ${p90} ms)`);
}

/** Il livello vero dell'ingresso: picco, finestre forti (95° percentile di 50 ms), fondo (10°). */
function levels(buf, sr) {
  const n = Math.round(0.05 * sr);
  const w = [];
  let peak = 0;
  for (let o = 0; o + n <= buf.length; o += n) {
    let s = 0;
    for (let i = o; i < o + n; i++) { s += buf[i] * buf[i]; if (Math.abs(buf[i]) > peak) peak = Math.abs(buf[i]); }
    w.push(Math.sqrt(s / n));
  }
  const db = v => (20 * Math.log10(Math.max(v, 1e-9))).toFixed(0);
  return `picco ${db(peak)} dBFS · finestre forti ${db(quantile(w, 0.95))} dBFS · fondo ${db(quantile(w, 0.1))} dBFS`;
}

/**
 * Una prova: ogni esecuzione in ogni condizione, con ogni ascolto.
 * `giro`: 'vecchio' (walk) o 'app' (walkApp). `byCondition`: la tabella ha una
 * colonna per condizione (le prove nuove), invece di sommare le condizioni.
 */
function run(title, scenarios, conditions, { giro = 'vecchio', byCondition = false } = {}) {
  const t0 = Date.now();
  const walker = giro === 'app' ? walkApp : walk;
  const keys = giro === 'app' ? ['mono', 'acc', 'app'] : ['mono', 'acc'];
  console.log(`\n${title}${giro === 'app' ? ' — giro dell\'app' : ''}`);
  const rows = [];
  const tot = Object.fromEntries(keys.map(k => [k, emptyScore()]));
  const perCond = conditions.map(() => Object.fromEntries(keys.map(k => [k, emptyScore()])));
  const levelNotes = conditions.map(() => null);
  for (const sc of scenarios) {
    const base = sc.env(perform(samples, sc.perf.events, { pedal: sc.perf.pedal }));
    const row = { prova: sc.id, passi: 0 };
    const agg = Object.fromEntries(keys.map(k => [k, emptyScore()]));
    conditions.forEach((cond, ci) => {
      const sr = cond.sr ?? SR;
      const buf = resample(cond.post ? cond.post(base) : base, sr);
      if (levelNotes[ci] === null) levelNotes[ci] = levels(buf, sr);
      const an = analyse(buf, sr, cond.fps ?? 60);
      const cells = [];
      for (const key of keys) {
        const det = LISTENERS[key].make(an, giro);
        const res = walker(an, sc.perf.steps, det);
        const r = score(sc.perf.steps, res);
        if (verbose && key === 'acc' && det.log) {
          sc.perf.steps.forEach((st, i) => {
            if (st.ignore) return;
            const d = res[i].done;
            const bad = st.wrong ? d !== null : (d !== null && d < st.t - 0.02) || (process.env.LOST && d === null);
            if (!bad) return;
            const att = det.log.filter(a => a.at / 1000 > st.t - 0.5 && a.at / 1000 < st.t + 0.3).map(a => `${midiName(a.midi)}@${(a.at / 1000 - st.t).toFixed(2)}`);
            const played = sc.perf.events.filter(e => Math.abs(e.t - st.t) < 0.03).map(e => e.note);
            console.log(`  ${sc.id} [${cond.name}] ${st.wrong ? 'SBAGLIO ACCETTATO' : d === null ? 'PERSO' : 'FALSO'} #${i} attese ${st.req.map(midiName).join('+')} suonate ${played.join('+')} a ${d === null ? '-' : (d - st.t).toFixed(2)}s · attacchi ${att.join(' ')}`);
          });
          const lost = sc.perf.steps.map((s, i) => (!s.ignore && !s.wrong && res[i].done === null ? `${i}:${s.req.map(midiName).join('+')}` : null)).filter(Boolean);
          if (lost.length) console.log(`  ${sc.id} [${cond.name}] persi: ${lost.slice(0, 10).join(' ')}`);
        }
        addScore(agg[key], r);
        addScore(tot[key], r);
        addScore(perCond[ci][key], r);
        row.passi = r.passi;
        cells.push(`${pct(r.presi, r.passi)}${r.falsi ? `(${r.falsi}f)` : ''}${r.sbagliati ? ` s${r.accettatiSbagliati}/${r.sbagliati}${r.sbagliDopo ? `+${r.sbagliDopo}` : ''}` : ''}`);
      }
      if (byCondition) row[cond.name] = cells.join(' | ');
    });
    if (!byCondition) {
      for (const key of keys) {
        const a = agg[key];
        row.passi = a.passi;
        row[LISTENERS[key].label] = `${pct(a.presi, a.passi)}%${a.falsi ? ` (${a.falsi} falsi)` : ''}${a.sbagliati ? ` · sbagli accettati ${a.accettatiSbagliati}/${a.sbagliati}${a.sbagliDopo ? ` (+${a.sbagliDopo})` : ''}` : ''}`;
      }
    }
    rows.push(row);
  }
  if (byCondition) console.log(`  (in ogni casella: % presi ${keys.map(k => LISTENERS[k].label).join(' | ')}; (nf) = passi falsi; sX/Y = sbagli accettati, +Z = completati dal passo dopo)`);
  console.table(rows);
  for (const key of keys) summary(LISTENERS[key].label, tot[key]);
  if (conditions.length > 1) {
    conditions.forEach((cond, ci) => {
      console.log(` ${cond.name} — ingresso (prima prova): ${levelNotes[ci]}`);
      for (const key of keys) summary(`  ${LISTENERS[key].label}`, perCond[ci][key]);
    });
  }
  console.log(`  (${Math.round((Date.now() - t0) / 1000)} s)`);
}

const byId = id => pieces.find(p => p.id === id);
const pick = ids => ids.map(byId).filter(Boolean);

// TARATURA: metà dei pezzi; CONVALIDA: l'altra metà, mai usata per le soglie.
const tuning = pieces.filter((_, i) => i % 2 === 0);
const validation = pieces.filter((_, i) => i % 2 === 1);
const envs = [room, bigRoom, cheapMic];
const dryEnvs = [roomDry, bigRoomDry, cheapMicDry];
const oldGiro = giroArg === 'app' ? 'app' : 'vecchio';

if (wanted.has('taratura')) run('TARATURA (pezzi pari)', [
  ...tuning.map((p, i) => ({ id: p.title.slice(0, 28), perf: performPiece(p), env: envs[i % envs.length] })),
  { id: 'accordi', perf: chordDrill(24), env: room },
  { id: 'accordi col pedale', perf: chordDrill(24, { pedal: true }), env: bigRoom },
  { id: 'accordi, una nota piano', perf: chordDrill(30, { soft: true }), env: room },
  { id: 'accordi · SBAGLI e MANCANTI', perf: chordDrill(40, { wrong: 0.3, missing: 0.3 }), env: room },
  ...pick(['beethoven-per-elisa', 'chopin-valzer-la-minore', 'brahms-ninna-nanna', 'chopin-marcia-funebre', 'mozart-k265-ah-vous-dirai']).map((p, i) => ({ id: `${p.title.slice(0, 18)} · SBAGLI`, perf: performPiece(p, { wrongEvery: 0.3 }), env: envs[i % envs.length] })),
], [{ name: '60 fps' }, { name: '30 fps', fps: 30 }], { giro: oldGiro });

if (wanted.has('convalida')) run('CONVALIDA (pezzi dispari, mai usati per tarare)', [
  ...validation.map((p, i) => ({ id: p.title.slice(0, 28), perf: performPiece(p), env: envs[(i + 1) % envs.length] })),
  { id: 'accordi, stanza rumorosa', perf: chordDrill(20), env: noisy },
  { id: 'accordi, una nota piano', perf: chordDrill(30, { soft: true }), env: bigRoom },
  { id: 'accordi piano · SBAGLI e MANCANTI', perf: chordDrill(40, { soft: true, wrong: 0.3, missing: 0.3 }), env: cheapMic },
  ...validation.slice(0, 3).map(p => ({ id: `${p.title.slice(0, 18)} · SBAGLI`, perf: performPiece(p, { wrongEvery: 0.25 }), env: bigRoom })),
], [{ name: '48 kHz' }, { name: '44,1 kHz', sr: 44100 }, { name: '30 fps', fps: 30 }], { giro: oldGiro });

// LIVELLI: le stesse esecuzioni sempre più piano all'ingresso. Meno passi per
// pezzo (sono quattro condizioni), metà pezzi di taratura e metà di convalida.
if (wanted.has('livelli')) {
  rand = seeded(20261011);
  const n = Number(passiArg ?? 24);
  const ps = [
    ...pick(['beethoven-per-elisa', 'chopin-valzer-la-minore', 'brahms-ninna-nanna', 'mozart-k265-ah-vous-dirai']),
    ...validation.slice(0, 4),
  ];
  run('LIVELLI (ingresso attenuato, rumore di fondo −60 dBFS)', [
    ...ps.map((p, i) => ({ id: p.title.slice(0, 24), perf: performPiece(p, { maxSteps: n }), env: dryEnvs[i % dryEnvs.length] })),
    { id: 'accordi', perf: chordDrill(16), env: roomDry },
    { id: 'accordi · SBAGLI e MANCANTI', perf: chordDrill(24, { wrong: 0.3, missing: 0.3 }), env: roomDry },
    { id: 'Per Elisa · SBAGLI', perf: performPiece(byId('beethoven-per-elisa'), { maxSteps: n * 2, wrongEvery: 0.3 }), env: bigRoomDry },
    { id: 'scala 8 n/s', perf: sequence(one(scaleNotes(60, 2, 32)), 8), env: roomDry },
    { id: 'arpeggi 2 mani 8 n/s', perf: sequence(two(arpeggioNotes(60, 32), 24), 8), env: roomDry },
  ], [atLevel(0), atLevel(-15), atLevel(-25), atLevel(-35), IPAD], { giro: 'app', byCondition: true });
}

// PIANO: suonato p e pp, a livello pieno e a −15 dB (piano lontano).
if (wanted.has('piano')) {
  rand = seeded(20261012);
  const n = Number(passiArg ?? 32);
  const ps = [...pick(['beethoven-per-elisa', 'brahms-ninna-nanna', 'chopin-valzer-la-minore']), ...validation.slice(0, 2)];
  run('PIANO (dinamiche p e pp)', [
    ...ps.map((p, i) => ({ id: `${p.title.slice(0, 18)} · p`, perf: performPiece(p, { maxSteps: n, ...DYN.p }), env: dryEnvs[i % dryEnvs.length] })),
    ...ps.map((p, i) => ({ id: `${p.title.slice(0, 18)} · pp`, perf: performPiece(p, { maxSteps: n, ...DYN.pp }), env: dryEnvs[(i + 1) % dryEnvs.length] })),
    { id: 'accordi · p', perf: chordDrill(16, DYN.p), env: roomDry },
    { id: 'accordi · pp', perf: chordDrill(16, DYN.pp), env: roomDry },
    { id: 'pp subito dopo ff', perf: ffThenPp(10), env: roomDry },
    { id: 'Per Elisa · pp · SBAGLI', perf: performPiece(byId('beethoven-per-elisa'), { maxSteps: n * 2, wrongEvery: 0.3, ...DYN.pp }), env: bigRoomDry },
    { id: 'accordi pp · SBAGLI e MANCANTI', perf: chordDrill(24, { wrong: 0.3, missing: 0.3, ...DYN.pp }), env: roomDry },
  ], [atLevel(0), atLevel(-15), IPAD], { giro: 'app', byCondition: true });
}

// VELOCI: sedicesimi a 6, 8, 10 note al secondo.
if (wanted.has('veloci')) {
  rand = seeded(20261013);
  const N = 40;
  const sc = [];
  for (const r of [6, 8, 10]) sc.push({ id: `scala 1 mano ${r} n/s`, perf: sequence(one(scaleNotes(60, 2, N)), r), env: roomDry });
  for (const r of [6, 8, 10]) sc.push({ id: `scala 2 mani (ottava) ${r} n/s`, perf: sequence(two(scaleNotes(60, 2, N), 12), r), env: roomDry });
  for (const r of [6, 8, 10]) sc.push({ id: `arpeggi 1 mano ${r} n/s`, perf: sequence(one(arpeggioNotes(60, N)), r), env: bigRoomDry });
  for (const r of [6, 8, 10]) sc.push({ id: `arpeggi 2 mani ${r} n/s`, perf: sequence(two(arpeggioNotes(60, N), 24), r), env: bigRoomDry });
  sc.push({ id: 'note ribattute 4× 6 n/s', perf: sequence(repeatedNotes(N), 6), env: roomDry });
  sc.push({ id: 'trillo Do5-Re5 8 n/s', perf: sequence(trill(72, 74, N), 8), env: roomDry });
  sc.push({ id: 'trillo Do5-Re5 10 n/s', perf: sequence(trill(72, 74, N), 10), env: roomDry });
  sc.push({ id: 'trillo Mi4-Fa4 8 n/s', perf: sequence(trill(64, 65, N), 8), env: cheapMicDry });
  sc.push({ id: 'albertino + melodia 6 n/s', perf: sequence(alberti(N), 6), env: roomDry });
  sc.push({ id: 'albertino + melodia 8 n/s', perf: sequence(alberti(N), 8), env: roomDry });
  sc.push({ id: 'scala 8 n/s · SBAGLI', perf: sequence(one(scaleNotes(60, 2, N)), 8, { wrong: 0.25 }), env: roomDry });
  run('VELOCI (sedicesimi)', sc, [atLevel(0), atLevel(-25), IPAD], { giro: 'app', byCondition: true });
}

// IPAD: il timbro dell'iPad vero (vedi `darken`: dal Re4 in su quasi solo la
// fondamentale) al suo livello. Qui un riconoscitore che vuole due armoniche
// forti per ogni nota sente solo chi suona forte.
if (wanted.has('ipad')) {
  rand = seeded(20261014);
  const n = Number(passiArg ?? 24);
  const T = { tilt: 1.2 };
  const ps = [
    ...pick(['beethoven-per-elisa', 'chopin-valzer-la-minore', 'brahms-ninna-nanna', 'mozart-k265-ah-vous-dirai']),
    ...validation.slice(0, 4),
  ];
  run("IPAD (timbro e livello dell'iPad vero)", [
    ...ps.map((p, i) => ({ id: p.title.slice(0, 24), perf: performPiece(p, { maxSteps: n, ...T }), env: dryEnvs[i % dryEnvs.length] })),
    { id: 'accordi', perf: chordDrill(16, T), env: roomDry },
    { id: 'accordi, una nota piano', perf: chordDrill(16, { soft: true, ...T }), env: bigRoomDry },
    { id: 'accordi · SBAGLI e MANCANTI', perf: chordDrill(24, { wrong: 0.3, missing: 0.3, ...T }), env: roomDry },
    { id: 'Per Elisa · SBAGLI', perf: performPiece(byId('beethoven-per-elisa'), { maxSteps: n * 2, wrongEvery: 0.3, ...T }), env: bigRoomDry },
    { id: 'Valzer · SBAGLI', perf: performPiece(byId('chopin-valzer-la-minore'), { maxSteps: n * 2, wrongEvery: 0.3, ...T }), env: roomDry },
    { id: 'scala 6 n/s', perf: sequence(one(scaleNotes(60, 2, 32)), 6, T), env: roomDry },
    { id: 'scala 8 n/s · SBAGLI', perf: sequence(one(scaleNotes(60, 2, 32)), 8, { wrong: 0.25, ...T }), env: roomDry },
    { id: 'note ribattute 4× 4 n/s', perf: sequence(repeatedNotes(32), 4, T), env: roomDry },
  ], [IPAD, IPAD_SOFT], { giro: 'app', byCondition: true });
}
