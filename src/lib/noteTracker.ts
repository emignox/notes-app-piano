// ─────────────────────────────────────────────────────────────────────────────
// Il cervello dell'ascolto: da una sequenza di misure (volume, altezza,
// chiarezza) decide QUANDO una nota è stata davvero suonata.
//
// Sta qui fuori dal hook di React apposta: così la si può far girare su un
// suono registrato e misurare quante note riconosce, invece di regolare le
// soglie a orecchio.
//
// Il criterio è: una nota nuova viene accettata quando
//   · è cambiata l'altezza rispetto all'ultima confermata (legato), oppure
//   · c'è un ATTACCO, cioè un salto di energia (stessa nota ribattuta), oppure
//   · si arriva dal silenzio.
// Senza attacco né silenzio serve più stabilità, così le armoniche di una nota
// che sta ancora suonando non vengono lette come note nuove.
// ─────────────────────────────────────────────────────────────────────────────

/** Soglia di chiarezza: sotto, la lettura è rumore e si scarta. */
export const CLARITY_MIN = 0.72;
/** Sotto questa chiarezza si butta anche la storia raccolta finora. */
const CLARITY_JUNK = 0.45;
/** Pavimento assoluto di volume: sotto è silenzio anche in una stanza muta. */
const RMS_FLOOR = 0.003;
/**
 * Quanto il suono deve superare il rumore di fondo. Tenerlo alto (3,5) rendeva
 * sordi a chi suona piano o tiene la pianola a volume basso: è il volume del
 * segnale a dover decidere il meno possibile, il filtro vero è la chiarezza.
 */
const NOISE_MARGIN = 1.9;
/**
 * La soglia non sale mai sopra questo valore. Senza un tetto, in una stanza
 * rumorosa (o se la stima sbanda) il microfono diventa sordo alle note vere.
 */
const GATE_MAX = 0.02;
/** Letture concordi richieste con un attacco o dopo il silenzio (~50 ms). */
const FRAMES_WITH_ONSET = 3;
/** Letture concordi richieste su una nota che sta ancora suonando (~100 ms). */
const FRAMES_SUSTAINED = 6;
/** Tolleranza in semitoni per considerare due letture "la stessa nota". */
const SEMITONE_TOLERANCE = 0.6;
/** Blocco dopo una conferma: evita il doppio scatto sullo stesso attacco. */
const REARM_MS = 150;
/** Salto di energia che identifica un nuovo attacco. */
const ONSET_RATIO = 1.35;
/** Quanto in fretta l'inseguitore di picco "dimentica" l'energia. */
const ENV_DECAY = 0.86;
/** Riferimento per la barra del livello a schermo. */
const LEVEL_FULL = 0.06;

export interface FrameResult {
  /** Volume normalizzato 0–1 per l'indicatore a schermo. */
  level: number;
  /** Nota che si sta sentendo ora (MIDI), o null. */
  live: number | null;
  /** Nota accettata come risposta in questo frame, o null. */
  confirmed: number | null;
  /** Chiarezza della lettura corrente, per la spia a schermo. */
  clarity: number;
}

export function freqToMidi(freq: number): number {
  return 12 * Math.log2(freq / 440) + 69;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export class NoteTracker {
  private history: number[] = [];
  private lastConfirmed = -99;
  private env = 0;
  private noise = 0.01;
  private onset = false;
  private seenSilence = true;
  private blockedUntil = 0;

  reset() {
    this.history.length = 0;
    this.lastConfirmed = -99;
    this.env = 0;
    this.noise = 0.01;
    this.onset = false;
    this.seenSilence = true;
    this.blockedUntil = 0;
  }

  /** Sordo fino a `now + ms` (usato mentre suona l'app). */
  block(ms: number, now: number) {
    const until = now + ms;
    if (until > this.blockedUntil) this.blockedUntil = until;
    this.history.length = 0;
  }

  /** Come block, ma pretende anche un attacco nuovo per la prossima nota. */
  suppress(ms: number, now: number) {
    this.seenSilence = false;
    this.onset = false;
    this.block(ms, now);
  }

  feed(rms: number, pitchHz: number, clarity: number, now: number): FrameResult {
    const level = Math.min(1, rms / LEVEL_FULL);
    const pitched = clarity >= CLARITY_MIN && pitchHz > 50;

    // Il rumore di fondo si stima SOLO sui frame in cui non si sente una nota.
    // Aggiornarlo anche mentre il piano suona faceva inseguire alla soglia il
    // segnale stesso: misurato, da 0,011 a 0,044 in un secondo e mezzo, con le
    // note suonate piano che finivano sotto e sparivano.
    if (!pitched) {
      this.noise =
        rms < this.noise
          ? this.noise * 0.7 + rms * 0.3 // il silenzio si riconosce subito
          : this.noise * 0.99 + rms * 0.01; // una stanza più rumorosa, pian piano
    }
    const gate = Math.min(GATE_MAX, Math.max(RMS_FLOOR, this.noise * NOISE_MARGIN));

    // Inseguitore di picco: scende piano, così un vero attacco lo supera.
    const prevEnv = this.env;
    this.env = Math.max(rms, prevEnv * ENV_DECAY);
    if (rms > gate && rms > prevEnv * ONSET_RATIO) this.onset = true;

    if (rms < gate) {
      this.seenSilence = true;
      this.lastConfirmed = -99; // dal silenzio qualsiasi nota è "nuova"
      this.history.length = 0;
      return { level: 0, live: null, confirmed: null, clarity };
    }

    if (clarity < CLARITY_MIN || pitchHz <= 50) {
      // Rumore non intonato: si scarta senza buttare via la storia buona.
      if (clarity < CLARITY_JUNK) this.history.length = 0;
      return { level, live: null, confirmed: null, clarity };
    }

    this.history.push(freqToMidi(pitchHz));
    if (this.history.length > FRAMES_SUSTAINED) this.history.shift();

    const fresh = this.onset || this.seenSilence;
    const needed = fresh ? FRAMES_WITH_ONSET : FRAMES_SUSTAINED;
    if (this.history.length < needed) return { level, live: null, confirmed: null, clarity };

    const recent = this.history.slice(-needed);
    const med = median(recent);
    const inliers = recent.filter(v => Math.abs(v - med) <= SEMITONE_TOLERANCE).length;
    // Sulla finestra corta si pretende l'unanimità: i rilevatori di altezza
    // sbagliano l'ottava a raffica sul suono di un piano, e tollerare anche una
    // sola lettura fuori bastava a far confermare note mai suonate (misurato:
    // 13 conferme invece di 10). Sulla finestra lunga, che è il triplo dei
    // campioni, una fuori posto si può assorbire.
    const allowedOutliers = needed >= FRAMES_SUSTAINED ? 1 : 0;
    if (inliers < needed - allowedOutliers) return { level, live: null, confirmed: null, clarity };

    const midi = Math.round(med);
    if (midi < 21 || midi > 108) return { level, live: null, confirmed: null, clarity };

    const changed = midi !== this.lastConfirmed;
    if (now < this.blockedUntil || !(fresh || changed)) {
      return { level, live: midi, confirmed: null, clarity };
    }

    this.lastConfirmed = midi;
    this.onset = false;
    this.seenSilence = false;
    this.blockedUntil = now + REARM_MS;
    this.history.length = 0;
    return { level, live: midi, confirmed: midi, clarity };
  }
}
