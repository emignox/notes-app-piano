// Prove SEMPLICI del microfono: `npm run bench:semplice` (macOS: la prima
// volta scarica i campioni del pianoforte, come bench:mic).
//
// Il banco dei pezzi (`bench:pezzi`) suona i brani a tempo. Chi impara no:
// suona una nota, la tiene, cerca la successiva, la suona — e il Leggio la
// ASPETTA. Qui si prova proprio quello, con esercizi corti e dal nome chiaro
// ("una nota alla volta", "nota ripetuta", "silenzio mentre aspetti"…), sul
// pianoforte vero campionato con il timbro e il livello dell'iPad.
//
// Si usa lo STESSO codice dell'app: `MicListener` (il hook del microfono senza
// React) e la regola del Leggio per l'ascolto di una nota alla volta. Il
// Leggio è imitato com'è: gli arrivi del microfono li vede un fotogramma dopo
// (React), e la nuova attesa parte due fotogrammi dopo il passo preso.
//
// Per ogni nota (o accordo) dell'esercizio si conta:
//  · ✓ preso: dopo che l'hai suonato e prima della nota dopo;
//  · ↻ da ripetere: suonato, ma il Leggio è rimasto fermo;
//  · ⚠ avanzato da solo: preso PRIMA che tu lo suonassi (il difetto peggiore);
//  · ✗ sbaglio accettato: suonavi una nota sbagliata e il Leggio è andato avanti.
//
// Opzioni: --solo=nome,nome (parte del nome dell'esercizio); -v racconta ogni
// errore con gli attacchi sentiti; --fps=60,30; --livello=ipad,piano,studio;
// --p='{"SOLO_K":0}' cambia le soglie di chordMatcher.

import { createServer } from 'vite';
import { PitchDetector } from 'pitchy';
import { SR, loadSamples, loadSpeech, perform, reverb, noise, phoneMic, mix, knocks, level, seeded, noteToMidi } from './mic-bench/audio.mjs';

const verbose = process.argv.includes('-v');
const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const only = arg('solo')?.split(',').map(s => s.toLowerCase());
const FPS_LIST = (arg('fps') ?? '60,30').split(',').map(Number);
const LEVELS = (arg('livello') ?? 'ipad,piano').split(',');

const server = await createServer({ configFile: false, logLevel: 'silent', appType: 'custom', server: { middlewareMode: true, hmr: false } });
const { MicListener } = await server.ssrLoadModule('/src/lib/micListener.ts');
const { P } = await server.ssrLoadModule('/src/lib/chordMatcher.ts');
const follow_ = await server.ssrLoadModule('/src/lib/micFollow.ts');
const { monoAccepts } = follow_;
// (versioni vecchie del codice: la sola regola del "da quando")
const monoCounts = follow_.monoCounts ?? ((c, since) => c.onset >= since - follow_.MONO_ONSET_SLACK_MS);
await server.close();
const pArg = arg('p');
if (pArg) Object.assign(P, JSON.parse(pArg));

const samples = await loadSamples();
const speech = loadSpeech();

// ── Note ────────────────────────────────────────────────────────────────────
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const IT = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const nm = m => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
const it = m => `${IT[m % 12]}${Math.floor(m / 12) - 1}`;
const M = s => noteToMidi(s);

// ── Esercizi ────────────────────────────────────────────────────────────────
/**
 * Un esercizio è una lista di colpi. Ogni colpo: le note da suonare (`play`,
 * MIDI), quelle che il Leggio aspetta (`want`, di solito le stesse; vuoto =
 * nessun passo, solo suono), quando (`t`, s), quanto si tiene (`dur`), la
 * forza. `wrong`: il colpo è sbagliato (il Leggio NON deve andare avanti).
 * `extra`: rumori da aggiungere (vedi `noises`). `app`: note che suona l'app
 * dall'altoparlante (l'altra mano), con l'istante.
 */
function ex(id, hits, opts = {}) {
  return { id, hits, pedal: !!opts.pedal, extra: opts.extra ?? [], app: opts.app ?? null };
}

/** Una melodia lenta: una nota ogni `gap` s (±jitter), tenuta `hold`·gap. */
function melody(notes, { gap = 1.6, hold = 0.9, vel = 0.55, jitter = 0.25, start = 1.0, rand } = {}) {
  let t = start;
  return notes.map(n => {
    const midis = Array.isArray(n) ? n.map(M) : [M(n)];
    const h = { play: midis, want: midis, t, dur: Math.max(0.15, gap * hold), vel };
    t += gap * (1 + (rand() - 0.5) * jitter);
    return h;
  });
}

/** `--seme=N`: un altro caso (tempi, forze) per non tarare sugli stessi esempi. */
const SEED = Number(arg('seme') ?? 20261019);
const rnd = seeded(SEED);
const UP = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const SCALE = [...UP, ...UP.slice(0, -1).reverse()];
const INNO = ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4'];
const FRA = ['C4', 'D4', 'E4', 'C4', 'C4', 'D4', 'E4', 'C4', 'E4', 'F4', 'G4', 'E4', 'F4', 'G4'];
const BRILLA = ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'];
const ELISA = ['E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4'];

const EXERCISES = [
  ex('una nota alla volta, tenuta', melody(SCALE, { rand: rnd })),
  ex('una nota alla volta, staccata', melody(SCALE, { hold: 0.25, rand: rnd })),
  ex('nota ripetuta (Inno alla gioia)', melody(INNO, { gap: 1.2, rand: rnd })),
  ex('nota ripetuta, più svelta', melody(INNO, { gap: 0.6, rand: rnd })),
  ex('nota ripetuta a 4 al secondo', melody(['E4', 'E4', 'E4', 'E4', 'G4', 'G4', 'G4', 'G4', 'C4', 'C4', 'C5', 'C5', 'E4', 'E5', 'E4', 'E4'], { gap: 0.27, hold: 0.8, jitter: 0.1, rand: rnd })),
  ex('Fra Martino lento', melody(FRA, { gap: 1.1, rand: rnd })),
  ex('Brilla brilla lento', melody(BRILLA, { gap: 1.1, rand: rnd })),
  ex('Per Elisa lento', melody(ELISA, { gap: 0.9, rand: rnd })),
  // La nota dopo è un'armonica di quella che suona ancora: non deve bastare.
  ex('tenuta col pedale, poi ottava e quinta', melody(['C4', 'C5', 'G3', 'G4', 'D4', 'A4', 'C4', 'C4', 'E4', 'E5', 'A3', 'E4'], { gap: 2.4, hold: 1, rand: rnd }), { pedal: true }),
  ex('note gravi (sinistra)', melody(['C3', 'G2', 'A2', 'E2', 'F2', 'C2', 'G2', 'C3'], { gap: 1.6, vel: 0.5, rand: rnd })),
  ex('note acute', melody(['C6', 'B5', 'A5', 'G5', 'E6', 'D6', 'C6'], { gap: 1.4, vel: 0.5, rand: rnd })),
  ex('accordi lenti a due mani', melody([['C3', 'C4', 'E4', 'G4'], ['F2', 'C4', 'F4', 'A4'], ['G2', 'B3', 'D4', 'G4'], ['C3', 'C4', 'E4', 'G4'], ['A2', 'C4', 'E4', 'A4'], ['D3', 'D4', 'F4', 'A4'], ['G2', 'B3', 'D4', 'F4'], ['C3', 'E4', 'G4', 'C5']], { gap: 2.0, vel: 0.5, rand: rnd })),
  ex('accordi col pedale', melody([['C3', 'E4', 'G4'], ['G2', 'D4', 'G4'], ['A2', 'C4', 'E4'], ['F2', 'C4', 'F4'], ['C3', 'E4', 'G4'], ['G2', 'B3', 'D4']], { gap: 1.8, hold: 1, vel: 0.5, rand: rnd }), { pedal: true }),
  ex('melodia e basso insieme', melody([['C3', 'E4'], ['G4'], ['G2', 'F4'], ['D4'], ['C3', 'E4'], ['C4'], ['F2', 'A4'], ['F4'], ['G2', 'G4'], ['B3'], ['C3', 'C4']], { gap: 1.0, rand: rnd })),
  ex('suonato piano (p)', melody(SCALE, { vel: 0.22, rand: rnd }).map(h => ({ ...h, lp: 2500 }))),
  ex('accordi della destra', melody([['C4', 'E4', 'G4'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5'], ['E4', 'G4', 'C5'], ['A4', 'C5', 'E5'], ['D4', 'F4', 'A4'], ['G4', 'B4', 'D5', 'F5'], ['C4', 'E4', 'G4']], { gap: 1.8, vel: 0.5, rand: rnd })),
  ex('due mani all\'ottava', melody(UP.map(n => [n, nm(M(n) - 12)]), { gap: 1.4, vel: 0.5, rand: rnd })),
  ex('basso e accordo (valzer lento)', melody([['A2'], ['C4', 'E4'], ['C4', 'E4'], ['E2'], ['B3', 'E4'], ['B3', 'E4'], ['A2'], ['C4', 'E4', 'A4'], ['C4', 'E4', 'A4'], ['D3'], ['D4', 'F4', 'A4'], ['D4', 'F4', 'A4']], { gap: 0.9, rand: rnd })),
  silenceAndNoise(),
  wrongThenRight(),
  wrongChords(),
  oneHandWithApp(),
  oneHandWithAppChords(),
];

/** Note suonate, poi lunghe attese piene di rumori: il Leggio non deve muoversi. */
function silenceAndNoise() {
  const hits = [];
  const extra = [];
  let t = 1.0;
  const seq = ['C4', 'D4', 'E4', 'C5', 'G4', 'A3'];
  seq.forEach((n, i) => {
    hits.push({ play: [M(n)], want: [M(n)], t, dur: 0.6, vel: 0.55 });
    const kinds = ['knock', 'voice', 'thump', 'release', 'rustle', 'voice'];
    extra.push({ kind: kinds[i], t: t + 1.2 });
    t += 4.0;
  });
  return ex('silenzio e rumori mentre aspetti', hits, { extra });
}

/** Una nota sbagliata (vicina), poi quella giusta: la sbagliata non deve valere. */
function wrongThenRight() {
  const hits = [];
  let t = 1.0;
  const seq = [['E4', 'F4'], ['G4', 'A4'], ['C4', 'B3'], ['D4', 'E4'], ['A4', 'G4'], ['F4', 'F#4']];
  for (const [right, wrong] of seq) {
    hits.push({ play: [M(wrong)], want: [M(right)], t, dur: 0.7, vel: 0.55, wrong: true });
    t += 1.5;
    hits.push({ play: [M(right)], want: [M(right)], t, dur: 0.7, vel: 0.55 });
    t += 1.5;
  }
  return ex('nota sbagliata, poi quella giusta', hits);
}

/**
 * Accordi con una nota sbagliata (un semitono) o mancante, poi l'accordo
 * giusto: quello sbagliato o incompleto NON deve far andare avanti.
 */
function wrongChords() {
  const chords = [['C3', 'E4', 'G4'], ['F3', 'A4', 'C5'], ['G2', 'B3', 'D4', 'G4'], ['A2', 'C4', 'E4'], ['D3', 'F4', 'A4'], ['C3', 'C4', 'E4', 'G4']];
  const hits = [];
  let t = 1.0;
  chords.forEach((c, i) => {
    const want = c.map(M);
    const play = [...want];
    if (i % 2 === 0) play[1 + (i % (play.length - 1))] += i % 4 === 0 ? 1 : -1; // una nota sbagliata
    else play.splice(1 + (i % (play.length - 1)), 1); // una nota mancante
    hits.push({ play, want, t, dur: 1.2, vel: 0.5, wrong: true });
    t += 1.8;
    hits.push({ play: want, want, t, dur: 1.2, vel: 0.5 });
    t += 1.8;
  });
  return ex('accordo sbagliato o incompleto, poi giusto', hits);
}

/**
 * La destra in crome, l'app suona accordi della sinistra (quattro note) appena
 * prendi la nota: il suono dell'altoparlante arriva proprio quando suoni la
 * nota dopo.
 */
function oneHandWithAppChords() {
  const mel = ['G4', 'B4', 'D5', 'F5', 'E5', 'C5', 'G4', 'E4', 'F4', 'A4', 'C5', 'A4', 'G4', 'B4', 'D5', 'G4'];
  const chords = [['G2', 'B2', 'D3', 'F3'], null, ['C3', 'E3', 'G3', 'C4'], null, ['F2', 'A2', 'C3', 'F3'], null, ['G2', 'B2', 'D3', 'F3'], null];
  const hits = melody(mel, { gap: 0.36, hold: 0.9, jitter: 0.1, rand: rnd });
  const app = [];
  hits.forEach((_, i) => { const c = chords[i % chords.length]; if (c) for (const n of c) app.push({ step: i, midi: M(n), dur: 0.6 }); });
  return ex('una mano, l\'app suona accordi', hits, { app });
}

/** La destra suona, l'app suona la sinistra dall'altoparlante appena prendi la nota. */
function oneHandWithApp() {
  const mel = ['E4', 'G4', 'C5', 'G4', 'F4', 'A4', 'C5', 'A4', 'D4', 'G4', 'B4', 'G4', 'C5'];
  const bass = ['C3', 'C3', 'C3', 'C3', 'F2', 'F2', 'F2', 'F2', 'G2', 'G2', 'G2', 'G2', 'C3'];
  const hits = melody(mel, { gap: 0.9, rand: rnd });
  // l'app suona il basso del passo appena lo prende (vedi `render`)
  const app = hits.map((_, i) => ({ step: i, midi: M(bass[i]), dur: 0.8 }));
  return ex('una mano, l\'app suona l\'altra', hits, { app });
}

// ── Il suono ────────────────────────────────────────────────────────────────
/** Un rumore: colpo, voce, tonfo del pedale, rilascio dei tasti, fruscio. */
function noiseAt(kind, len, rand) {
  const out = new Float32Array(len);
  if (kind === 'knock') return knocks(len, 10, rand);
  if (kind === 'thump') {
    // il pedale che sale: tonfo grave, 40–80 Hz
    for (let i = 0; i < Math.min(len, 0.25 * SR); i++) out[i] = Math.exp(-i / (0.04 * SR)) * Math.sin((2 * Math.PI * 55 * i) / SR) * (0.8 + 0.4 * rand());
    return out;
  }
  if (kind === 'release') {
    // tasti che risalgono e smorzatori: tre clic secchi
    for (const at of [0, 0.12, 0.27]) {
      const o = Math.floor(at * SR);
      for (let i = 0; i < 300 && o + i < len; i++) out[o + i] += Math.exp(-i / 40) * (rand() * 2 - 1);
    }
    return out;
  }
  if (kind === 'rustle') {
    for (let i = 0; i < Math.min(len, 0.6 * SR); i++) out[i] = (rand() * 2 - 1) * Math.sin((Math.PI * i) / (0.6 * SR));
    return out;
  }
  if (kind === 'voice' && speech) {
    out.set(speech.subarray(0, Math.min(len, speech.length, 2.2 * SR)));
    return out;
  }
  return out;
}

/** L'altoparlante dell'iPad: niente bassi, un po' di distorsione. */
function speaker(x) {
  const y = phoneMic(x, 300);
  for (let i = 0; i < y.length; i++) y[i] = Math.tanh(y[i] * 2.2) / 2.2;
  return y;
}

const CONDITIONS = {
  ipad: { name: 'iPad', db: -28 },
  piano: { name: 'iPad, piano lontano', db: -38 },
  studio: { name: 'microfono buono', db: 0 },
};

/**
 * Il suono di un esercizio. `appAt`: per ogni passo, quando il Leggio l'ha
 * preso (s) — da lì l'app suona l'altra mano: Tone parte 120 ms dopo, e
 * l'altoparlante dell'iPad ne aggiunge una quarantina.
 */
const SPEAKER_DELAY = 0.16;
function render(e, cond, rand, appAt = []) {
  const events = [];
  for (const h of e.hits) for (const m of h.play) events.push({ note: nm(m), t: h.t + rand() * 0.02, dur: h.dur, vel: h.vel * (0.9 + 0.2 * rand()), tilt: 1.2, ...(h.lp ? { lp: h.lp } : {}) });
  const end = Math.max(...e.hits.map(h => h.t + h.dur)) + 2.0;
  let x = perform(samples, events, { pedal: e.pedal, length: end });
  x = phoneMic(reverb(x, 0.2), 70);
  for (const n of e.extra) x = mix(x, noiseAt(n.kind, Math.floor(2.5 * SR), rand), n.kind === 'voice' ? 0.02 : 0.03, n.t);
  const app = (e.app ?? []).filter(n => appAt[n.step] != null);
  if (app.length) {
    const a = perform(samples, app.map(n => ({ note: nm(n.midi), t: appAt[n.step] + SPEAKER_DELAY, dur: n.dur, vel: 0.42 })), { length: x.length / SR });
    const sp = speaker(a);
    for (let i = 0; i < x.length && i < sp.length; i++) x[i] += sp[i] * 0.7;
  }
  return level(x, cond.db, -85, rand);
}

// ── Analisi fotogramma per fotogramma, come AnalyserNode ───────────────────
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

/** Il giro del Leggio, col codice dell'app. */
function follow(e, buf, fps) {
  const listener = new MicListener(SR, FFT);
  const det = PitchDetector.forFloat32Array(2048);
  const input = new Float32Array(2048);
  const hop = Math.round(SR / fps);
  const steps = e.hits.filter(h => h.want.length);
  const done = steps.map(() => null);
  /** Da dove è arrivato il passo: riconoscitore degli accordi o nota singola. */
  const via = steps.map(() => null);
  const log = [];
  /**
   * Come React: il passo che il Leggio mostra (`k`), il suo "da quando" e la
   * sua attesa cambiano INSIEME, nel disegno dopo il passo preso (APP_LAG
   * fotogrammi). Gli arrivi del microfono li vedono gli effetti del Leggio un
   * fotogramma dopo, con lo stato di quel disegno: dopo un passo preso e prima
   * del disegno nuovo valgono ancora per il passo vecchio, già completo (al
   * più l'app lo ricompleta: nessun passo avanti in più).
   */
  let k = 0;
  let token = '';
  let waitSince = 0;
  let found = new Set();
  let complete = false;
  /** Il prossimo passo da mostrare, e da quale fotogramma. */
  let next = 0;
  let nextAt = 0;
  /** Gli arrivi del microfono li vede il Leggio al fotogramma dopo. */
  let inbox = [];
  const APP_LAG = 2;
  let frame = 0;
  listener.start(0);

  const accept = (midis, T, source) => {
    if (complete || k >= steps.length) return;
    const st = steps[k];
    const fresh = midis.filter(m => st.want.includes(m) && !found.has(m));
    if (!fresh.length) return;
    fresh.forEach(m => found.add(m));
    if (st.want.every(m => found.has(m))) {
      done[k] = T;
      via[k] = source;
      // come `accompany` nel Leggio: l'altra mano parte adesso
      const other = (e.app ?? []).filter(n => n.step === k);
      if (other.length) listener.external(other.map(n => ({ midi: n.midi, at: T * 1000 })));
      complete = true;
      next = k + 1;
      nextAt = frame + APP_LAG;
    }
  };

  for (let end = FFT; end < buf.length; end += hop, frame++) {
    const T = end / SR;
    const now = T * 1000;
    // Chi suona va avanti col suo tempo: se il passo k non è stato preso a
    // metà strada fra il suo colpo e quello dopo, è da ripetere — il banco
    // passa oltre come se l'avessi ripetuto (toccando il tasto sullo
    // schermo). A metà strada e non all'ultimo istante: chi ripete lo fa con
    // calma, e il passo nuovo non deve nascere 50 ms prima del colpo.
    const giveUp = k < steps.length - 1 ? Math.min(steps[k + 1].t - 0.05, Math.max((steps[k].t + steps[k + 1].t) / 2, steps[k].t + 0.35)) : Infinity;
    if (!complete && T > giveUp) {
      complete = true;
      next = k + 1;
      nextAt = frame;
    }
    if (complete && frame >= nextAt) {
      k = next;
      complete = false;
      found = new Set();
      if (k >= steps.length) break;
    }
    if (token !== `${k}`) {
      token = `${k}`;
      waitSince = now;
      listener.expect(steps[k].want, token, now, [...(steps[k + 1]?.want ?? []), ...(steps[k + 2]?.want ?? [])]);
    }
    input.set(buf.subarray(end - 2048, end));
    let sum = 0;
    for (const v of input) sum += v * v;
    const [pitch, clarity] = det.findPitch(input, SR);
    const out = listener.feed(Math.sqrt(sum / 2048), pitch, clarity, input, SR, spectrum(buf.subarray(end - FFT, end)), now);
    for (const a of out.attacks) log.push(a);
    // gli arrivi del fotogramma prima
    for (const ev of inbox) {
      if (ev.match && ev.match.token === token) accept(ev.match.midis, T, 'accordi');
      if (ev.confirmed && monoCounts(ev.confirmed, waitSince)) accept(monoAccepts(steps[k]?.want ?? [], ev.confirmed.midi), T, `nota ${it(ev.confirmed.midi)} attaccata a ${(ev.confirmed.onset / 1000).toFixed(2)}`);
    }
    inbox = [];
    if (out.match || out.confirmed) inbox.push({ match: out.match, confirmed: out.confirmed });
  }
  return { steps, done, via, log };
}

/** Il giudizio su ogni passo. */
function judge(steps, done) {
  const r = { passi: 0, presi: 0, ripetere: 0, dasoli: 0, sbagli: 0, sbagliAccettati: 0, lat: [], detail: [] };
  steps.forEach((s, i) => {
    const d = done[i];
    const next = steps[i + 1]?.t ?? Infinity;
    if (s.wrong) {
      r.sbagli++;
      // la nota giusta arriva subito dopo: vale solo se presa prima di lei
      if (d !== null && d < next - 0.02) { r.sbagliAccettati++; r.detail.push({ i, what: 'sbaglio accettato', d }); }
      return;
    }
    r.passi++;
    if (d !== null && d < s.t - 0.02) { r.dasoli++; r.detail.push({ i, what: 'avanzato da solo', d }); }
    else if (d === null || d > next + 0.05) { r.ripetere++; r.detail.push({ i, what: 'da ripetere', d }); }
    else { r.presi++; r.lat.push(d - s.t); }
  });
  return r;
}

/**
 * `--nuvole`: per ogni colpo di pianoforte (e per ogni rumore) quante classi
 * di altezza DIVERSE da quelle attese compaiono negli attacchi entro ±100 ms.
 * Serve a tarare il controllo della "nuvola" (voce, altoparlante).
 */
const clouds = { piano: [], rumore: [] };
function cloudStats(e, steps, log) {
  const pc = m => ((m % 12) + 12) % 12;
  /** Le classi estranee attorno a un attacco, forti almeno il 30% di lui (come CLOUD_REL). */
  const around = (x, allowed) => new Set(log.filter(a => Math.abs(a.at - x.at) <= 100 && pc(a.midi) !== pc(x.midi) && !allowed.has(pc(a.midi)) && a.strength >= 0.3 * x.strength).map(a => pc(a.midi))).size;
  for (const s of steps) {
    if (s.wrong) continue;
    const allowed = new Set(s.want.map(pc));
    for (const w of s.want) {
      const x = log.filter(a => a.midi === w && a.at / 1000 >= s.t - 0.02 && a.at / 1000 <= s.t + 0.2)[0];
      if (x) clouds.piano.push(around(x, allowed));
    }
  }
  for (const n of e.extra) for (const x of log.filter(a => a.at / 1000 >= n.t && a.at / 1000 <= n.t + 2.2)) clouds.rumore.push(around(x, new Set()));
}
const med = xs => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0);
const rows = [];
const tot = { passi: 0, presi: 0, ripetere: 0, dasoli: 0, sbagli: 0, sbagliAccettati: 0, lat: [] };
const t0 = Date.now();
for (const e of EXERCISES) {
  if (only && !only.some(o => e.id.toLowerCase().includes(o))) continue;
  const row = { esercizio: e.id };
  for (const lv of LEVELS) {
    const cond = CONDITIONS[lv];
    for (const fps of FPS_LIST) {
      // Con l'altra mano dell'app servono due passate: la prima dice quando
      // il Leggio prende i passi, la seconda ci mette il suono dell'app.
      let buf = render(e, cond, seeded(7 + e.id.length));
      let res = follow(e, buf, fps);
      if (e.app) {
        buf = render(e, cond, seeded(7 + e.id.length), res.done);
        res = follow(e, buf, fps);
      }
      const { steps, done, via, log } = res;
      if (process.argv.includes('--nuvole')) cloudStats(e, steps, log);
      const r = judge(steps, done);
      for (const k of Object.keys(tot)) if (k !== 'lat') tot[k] += r[k]; else tot.lat.push(...r.lat);
      row[`${cond.name} ${fps}fps`] = `${r.presi}/${r.passi}${r.ripetere ? ` ↻${r.ripetere}` : ''}${r.dasoli ? ` ⚠${r.dasoli}` : ''}${r.sbagli ? ` ✗${r.sbagliAccettati}/${r.sbagli}` : ''}`;
      if (verbose) for (const d of r.detail) {
        const s = steps[d.i];
        const att = log.filter(a => a.at / 1000 > s.t - 0.6 && a.at / 1000 < s.t + 1.2).map(a => `${it(a.midi)}@${(a.at / 1000 - s.t).toFixed(2)}${process.env.FORZA ? `(${(a.strength * 1e6).toFixed(1)})` : ""}`);
        const prev = steps[d.i - 1];
        const attPrev = d.what === "avanzato da solo" && d.d !== null ? log.filter(a => a.at / 1000 > d.d - 0.6 && a.at / 1000 <= d.d + 0.02).map(a => `${it(a.midi)}@${(a.at / 1000).toFixed(2)}${process.env.FORZA ? `(${(a.strength * 1e6).toFixed(1)})` : ""}`) : [];
        console.log(`  ${e.id} [${cond.name} ${fps}] ${d.what} #${d.i} ${s.want.map(it).join('+')} (suonate ${s.play.map(it).join('+')}, colpo a ${s.t.toFixed(2)}) preso a ${d.d === null ? '—' : d.d.toFixed(2)} da ${via[d.i] ?? '—'}${prev ? ` · passo prima ${prev.want.map(it).join('+')} colpo ${prev.t.toFixed(2)} preso ${done[d.i - 1]?.toFixed(2) ?? '—'} da ${via[d.i - 1] ?? '—'}` : ''}${attPrev.length ? ` · attacchi prima della presa ${attPrev.join(' ')}` : ` · attacchi ${att.join(' ')}`}`);
      }
    }
  }
  rows.push(row);
}

if (process.argv.includes('--nuvole')) {
  for (const [k, v] of Object.entries(clouds)) {
    const h = {};
    for (const x of v) h[x] = (h[x] ?? 0) + 1;
    console.log(`nuvole ${k}: ${v.length} finestre · classi estranee → quante volte: ${JSON.stringify(h)}`);
  }
}
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows, tot: { ...tot, lat: undefined, ritardoMediano: Math.round(med(tot.lat) * 1000) } }));
  process.exit(0);
}
console.log('\nPROVE SEMPLICI — il Leggio aspetta, tu suoni con calma');
console.log('(in ogni casella: presi al primo colpo / passi · ↻ da ripetere · ⚠ avanzati da soli · ✗ sbagli accettati / sbagli)');
console.table(rows);
const pc = (a, b) => (b ? ((100 * a) / b).toFixed(1) : '0');
console.log(`Totale: presi ${tot.presi}/${tot.passi} (${pc(tot.presi, tot.passi)}%) · da ripetere ${tot.ripetere} · avanzati da soli ${tot.dasoli} · sbagli accettati ${tot.sbagliAccettati}/${tot.sbagli} · ritardo mediano ${Math.round(med(tot.lat) * 1000)} ms · (${Math.round((Date.now() - t0) / 1000)} s)`);
