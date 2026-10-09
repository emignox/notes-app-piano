// ─────────────────────────────────────────────────────────────────────────────
// Il cervello dell'ascolto: da una sequenza di misure (volume, altezza,
// chiarezza, campioni grezzi) decide QUANDO una nota è stata davvero suonata.
//
// Sta qui fuori dal hook di React apposta: così la si fa girare su esecuzioni
// registrate e si misura quante note riconosce (`npm run bench:mic`), invece
// di regolare le soglie a orecchio.
//
// Il principio: OGNI ATTACCO VALE UNA NOTA SOLA.
//   · L'attacco si data al millisecondo guardando l'energia DENTRO la finestra
//     (blocchi da 5 ms), non fra un fotogramma e l'altro. La finestra è lunga
//     43 ms ma si aggiorna ogni 17: confrontando i fotogrammi, l'attacco di una
//     nota "saliva" per tre letture e veniva contato due volte — e la seconda
//     conferma finiva sulla domanda dopo, come errore mai commesso.
//   · Dopo un attacco netto la nota si conferma in fretta (~45 ms di letture).
//   · Senza attacco (legato, nota più piano di quella che suona ancora) serve
//     più pazienza, e l'altezza deve cambiare davvero, non per un'armonica: una
//     nota che si spegne salta spesso all'ottava sopra, e non è un tasto nuovo.
//   · La voce che parla ha un'altezza che scivola; il piano no. Le letture
//     devono restare ferme entro pochi centesimi.
//
// Misurato sul banco di prova (pianoforte vero campionato, stanza, rumore,
// microfono del telefono, 30 e 60 fotogrammi al secondo): le note doppie sono
// passate da 53 a 0, quelle perse da 21 a 4 su 816, e le note "inventate"
// mentre qualcuno parla nella stanza da 91 a 16.
// ─────────────────────────────────────────────────────────────────────────────

/** Soglia di chiarezza: sotto, la lettura è rumore e si scarta. */
const CLARITY_MIN = 0.72;
/** Sotto questa chiarezza si butta anche la storia raccolta finora. */
const CLARITY_JUNK = 0.45;
/**
 * Pavimento assoluto di volume. Era 0,003 e si perdevano le note suonate
 * piano nel registro acuto: ora che una nota vuole un attacco e un'altezza
 * ferma, silenzio, ronzio e colpi non passano comunque (verificato).
 */
const RMS_FLOOR = 0.0015;
/** Quanto il suono deve superare il rumore di fondo. */
const NOISE_MARGIN = 1.9;
/** La soglia non sale mai sopra questo valore, neanche in una stanza rumorosa. */
const GATE_MAX = 0.02;
/** Tolleranza in semitoni per considerare due letture "la stessa nota". */
const SEMITONE_TOLERANCE = 0.6;
/** Riferimento per la barra del livello a schermo. */
const LEVEL_FULL = 0.06;

// ── Attacchi ────────────────────────────────────────────────────────────────
/** Blocchi da 256 campioni (~5 ms): la risoluzione con cui si data un attacco. */
const BLOCK = 256;
/**
 * Ogni blocco si media col precedente (~11 ms): un blocco più corto del periodo
 * di una nota grave oscilla con la forma d'onda e simula attacchi inesistenti.
 */
const SMOOTH = 2;
/** Distanza in blocchi fra il punto giudicato e il riferimento: ~16 ms di salita. */
const LAG = 3;
/** Salto di energia che fa un attacco. */
const BLOCK_RATIO = 2.5;
/**
 * Un attacco vero RESTA: l'energia dopo il salto si mantiene. Un picco di
 * battimento (pedale, corde che interferiscono) dura un blocco e ricade.
 */
const POST_BLOCKS = 2;
const POST_KEEP = 0.8;
/** Attacco "lento" fra fotogrammi: risalita dalla valle dopo il picco. */
const VALLEY_RATIO = 1.6;
const STRONG_VALLEY = 2.5;
const FALL_FROM = 0.85;
/** Due attacchi più vicini di così sono lo stesso attacco visto due volte. */
const MERGE_MS = 70;

// ── Conferma ────────────────────────────────────────────────────────────────
/** Dopo un attacco netto: letture e tempo minimo prima di confermare. */
const ONSET_FRAMES = 2;
const ONSET_SPAN_MS = 45;
/** Senza attacco (legato): più letture, più tempo. */
const SUSTAIN_FRAMES = 4;
const SUSTAIN_SPAN_MS = 90;
/** Escursione massima delle letture in semitoni: il piano è fermo, la voce scivola. */
const SPREAD_ONSET = 0.12;
const SPREAD_SUSTAIN = 0.15;
/** Un martelletto fa salire il volume almeno di tanto rispetto a prima. */
const RISE_MIN = 2.5;
/**
 * La stessa nota ribattuta deve arrivare a un volume paragonabile a quello di
 * prima (che intanto si spegne). Le corde di una nota acuta battono fra loro e
 * il suono, mentre muore, risale da solo di due o tre volte: un'eco, non un tasto.
 */
const REPEAT_PEAK = 0.3;
const REPEAT_TAU_MS = 800;
/** Distanze in semitoni che sono armoniche della nota che suona: ottave, dodicesima… */
const HARMONIC = new Set([12, 19, 24, 28, 31, 36, -12, -19, -24]);

export interface FrameResult {
  /** Volume normalizzato 0–1 per l'indicatore a schermo. */
  level: number;
  /** Nota che si sta sentendo ora (MIDI), o null. */
  live: number | null;
  /** Nota accettata come risposta in questo frame, o null. */
  confirmed: number | null;
  /**
   * Quando è stata ATTACCATA la nota confermata (stesso orologio di `now`), se
   * c'era un attacco netto. La conferma arriva ~50 ms dopo: per giudicare il
   * ritmo conta l'attacco, non la conferma.
   */
  onset: number | null;
  /** Chiarezza della lettura corrente, per la spia a schermo. */
  clarity: number;
}

/** Cosa può confermare il tracker adesso. */
type Armed = 'strong' | 'weak' | 'none';

interface Reading {
  midi: number;
  t: number;
}

export function freqToMidi(freq: number): number {
  return 12 * Math.log2(freq / 440) + 69;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const nothing = (level: number, clarity: number, live: number | null = null): FrameResult =>
  ({ level, live, confirmed: null, onset: null, clarity });

export class NoteTracker {
  private history: Reading[] = [];
  private lastConfirmed = -99;
  private noise = 0.01;
  private armed: Armed = 'strong';
  private blockedUntil = 0;

  private lastOnsetAt = -1e9;
  private phase: 'rise' | 'fall' = 'fall';
  private peak = 0;
  private valley = 1;
  private recentRms: number[] = [];
  /** Volume subito prima dell'ultimo attacco, e massimo raggiunto dopo. */
  private onsetPre = 1;
  private onsetPeak = 0;
  /** Massimo della nota che suona e di quella prima (per le ribattute). */
  private notePeak = 0;
  private prevPeak = 0;
  private prevPeakAt = 0;

  reset() {
    this.history = [];
    this.lastConfirmed = -99;
    this.noise = 0.01;
    this.armed = 'strong';
    this.blockedUntil = 0;
    this.lastOnsetAt = -1e9;
    this.phase = 'fall';
    this.peak = 0;
    this.valley = 1;
    this.recentRms = [];
    this.onsetPre = 1;
    this.onsetPeak = 0;
    this.notePeak = 0;
    this.prevPeak = 0;
    this.prevPeakAt = 0;
  }

  /** Sordo fino a `now + ms` (usato mentre suona l'app). */
  block(ms: number, now: number) {
    const until = now + ms;
    if (until > this.blockedUntil) this.blockedUntil = until;
    this.history = [];
  }

  /** Come block, ma pretende anche un attacco nuovo per la prossima nota. */
  suppress(ms: number, now: number) {
    this.armed = 'none';
    this.block(ms, now);
  }

  /** Istante (ms) di un attacco dentro la finestra, oppure null. */
  private blockOnset(frame: Float32Array, sampleRate: number, now: number, gate: number): number | null {
    const n = Math.floor(frame.length / BLOCK);
    const energy = new Array<number>(n);
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let i = j * BLOCK; i < (j + 1) * BLOCK; i++) sum += frame[i] * frame[i];
      energy[j] = sum / BLOCK + 1e-12;
    }
    const smooth = new Array<number>(n).fill(0);
    for (let j = SMOOTH - 1; j < n; j++) {
      let sum = 0;
      for (let k = j - SMOOTH + 1; k <= j; k++) sum += energy[k];
      smooth[j] = sum / SMOOTH;
    }
    const floor = gate * gate;
    // L'ultimo tratto della finestra non si giudica: mancano i blocchi che
    // dicono se l'energia resta. Quell'attacco lo vedrà il fotogramma dopo.
    for (let j = SMOOTH - 1 + LAG; j < n - POST_BLOCKS; j++) {
      let ref = 0;
      for (let k = Math.max(SMOOTH - 1, j - LAG - 1); k <= j - LAG; k++) ref = Math.max(ref, smooth[k]);
      if (smooth[j] <= floor || smooth[j] / ref <= BLOCK_RATIO) continue;
      let after = Infinity;
      for (let k = j + 1; k <= j + POST_BLOCKS; k++) after = Math.min(after, smooth[k]);
      if (after / ref > BLOCK_RATIO * POST_KEEP) return now - (((n - 1 - j) * BLOCK) / sampleRate) * 1000;
    }
    return null;
  }

  /** Registra un attacco; false se è lo stesso già visto. */
  private markOnset(at: number, strong: boolean): boolean {
    if (at - this.lastOnsetAt < MERGE_MS) {
      if (strong && this.armed === 'weak') this.armed = 'strong';
      return false;
    }
    this.lastOnsetAt = at;
    this.armed = strong ? 'strong' : 'weak';
    this.phase = 'rise';
    this.peak = 0;
    this.prevPeak = this.notePeak;
    this.prevPeakAt = at;
    this.notePeak = 0;
    this.onsetPre = Math.max(1e-4, Math.min(...this.recentRms));
    this.onsetPeak = 0;
    return true;
  }

  /**
   * Un fotogramma. `frame` sono i campioni grezzi su cui è stata misurata
   * l'altezza: servono a datare gli attacchi. Senza, si usa solo il volume.
   */
  feed(
    rms: number,
    pitchHz: number,
    clarity: number,
    now: number,
    frame?: Float32Array,
    sampleRate = 48000,
  ): FrameResult {
    const level = Math.min(1, rms / LEVEL_FULL);
    const pitched = clarity >= CLARITY_MIN && pitchHz > 50;

    // Il rumore di fondo si stima SOLO sui frame in cui non si sente una nota:
    // aggiornarlo mentre il piano suona faceva inseguire alla soglia il segnale.
    if (!pitched) {
      this.noise =
        rms < this.noise
          ? this.noise * 0.7 + rms * 0.3 // il silenzio si riconosce subito
          : this.noise * 0.99 + rms * 0.01; // una stanza più rumorosa, pian piano
    }
    const gate = Math.min(GATE_MAX, Math.max(RMS_FLOOR, this.noise * NOISE_MARGIN));

    // Il volume recente si tiene anche nel silenzio: è da lì che parte un attacco.
    this.recentRms.push(rms);
    if (this.recentRms.length > 4) this.recentRms.shift();

    if (rms < gate) {
      // Dal silenzio una nota DIVERSA è nuova; la stessa nota vuole un attacco
      // vero: una coda che balla intorno alla soglia non è un tasto premuto.
      if (this.armed !== 'strong') this.armed = 'weak';
      this.history = [];
      this.phase = 'fall';
      this.valley = rms;
      return nothing(0, clarity);
    }

    this.onsetPeak = Math.max(this.onsetPeak, rms);
    this.notePeak = Math.max(this.notePeak, rms);
    if (this.phase === 'rise') {
      this.peak = Math.max(this.peak, rms);
      if (rms < this.peak * FALL_FROM) {
        this.phase = 'fall';
        this.valley = rms;
      }
    } else {
      this.valley = Math.min(this.valley, rms);
    }

    let onsetAt = frame ? this.blockOnset(frame, sampleRate, now, gate) : null;
    let strong = onsetAt !== null;
    if (onsetAt === null && this.phase === 'fall' && rms > this.valley * VALLEY_RATIO) {
      onsetAt = now;
      strong = rms > this.valley * STRONG_VALLEY;
    }
    if (onsetAt !== null && this.markOnset(onsetAt, strong)) {
      // Le letture prese prima dell'attacco appartengono alla nota di prima.
      const from = onsetAt;
      this.history = this.history.filter(r => r.t >= from);
    }

    if (!pitched) {
      // Rumore non intonato: si scarta senza buttare via la storia buona.
      if (clarity < CLARITY_JUNK) this.history = [];
      return nothing(level, clarity);
    }

    this.history.push({ midi: freqToMidi(pitchHz), t: now });
    if (this.history.length > 8) this.history.shift();

    // Strada veloce solo dopo un attacco netto: un tasto parte sempre così,
    // anche dal silenzio. Il resto deve dimostrare di essere una nota ferma.
    const fast = this.armed === 'strong' && this.onsetPeak / this.onsetPre >= RISE_MIN;
    const needFrames = fast ? ONSET_FRAMES : SUSTAIN_FRAMES;
    const needMs = fast ? ONSET_SPAN_MS : SUSTAIN_SPAN_MS;

    // Le letture più recenti che coprono almeno il tempo richiesto.
    let k = this.history.length - 1;
    while (k > 0 && (this.history.length - k < needFrames || now - this.history[k].t < needMs)) k--;
    if (this.history.length - k < needFrames || now - this.history[k].t < needMs) return nothing(level, clarity);
    const recent = this.history.slice(k).map(r => r.midi);

    const med = median(recent);
    // Sulla finestra corta si pretende l'unanimità: i rilevatori sbagliano
    // l'ottava a raffica sul suono di un piano. Su quella lunga una lettura
    // fuori posto ogni quattro si può assorbire.
    const inliers = recent.filter(v => Math.abs(v - med) <= SEMITONE_TOLERANCE);
    const allowed = fast ? 0 : Math.floor(recent.length / 4);
    if (inliers.length < recent.length - allowed) return nothing(level, clarity);
    const spread = Math.max(...inliers) - Math.min(...inliers);
    if (spread > (fast ? SPREAD_ONSET : SPREAD_SUSTAIN)) return nothing(level, clarity);

    const midi = Math.round(med);
    if (midi < 21 || midi > 108) return nothing(level, clarity);

    const step = midi - this.lastConfirmed;
    const echo = this.prevPeak * Math.exp(-(now - this.prevPeakAt) / REPEAT_TAU_MS);
    const repeatOk = step !== 0 || this.onsetPeak >= echo * REPEAT_PEAK;
    const accepted = (this.armed === 'strong' && repeatOk) || (step !== 0 && !HARMONIC.has(step));
    if (now < this.blockedUntil || !accepted) return nothing(level, clarity, midi);

    const onset = this.armed === 'strong' && now - this.lastOnsetAt < 400 ? this.lastOnsetAt : null;
    this.lastConfirmed = midi;
    this.armed = 'none';
    this.history = [];
    return { level, live: midi, confirmed: midi, onset, clarity };
  }
}
