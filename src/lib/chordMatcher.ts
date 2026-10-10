// ─────────────────────────────────────────────────────────────────────────────
// Ascolto dei brani: QUALI note sono state appena suonate, anche insieme.
//
// Il rilevatore di `noteTracker` cerca UNA altezza: va benissimo per leggere
// una nota alla volta, ma in un brano non c'è mai una nota sola — risuonano la
// precedente, la mano sinistra, il pedale, e negli accordi le note partono
// insieme. Lì un rilevatore monofonico sceglie a caso o non decide.
//
// Qui si fa come le app che "ascoltano" il pianoforte: si sa quali note il
// brano si aspetta, e si controlla nello spettro se sono appena partite.
//  1. Si guarda solo ciò che è CRESCIUTO: lo spettro di adesso meno il più alto
//     dei fotogrammi di poco fa, sbiancato (il colpo del martelletto alza
//     tutto lo spettro insieme). Una nota che risuona — pedale, nota tenuta —
//     si spegne piano e non cresce: non conta. Una nota ribattuta sì.
//  2. Di ciò che è cresciuto si tengono i PICCHI, con la frequenza
//     interpolata: il fianco del picco di un Sol non è un Fa♯.
//  3. Si cercano le note per armoniche (con l'inarmonicità del pianoforte):
//     si prende la nota che spiega di più, si toglie la sua parte stimandola
//     dalle armoniche vicine, e si ricomincia — finché la migliore non è di
//     nuovo una già trovata (allora resta solo il suo avanzo). Le note che il
//     brano aspetta hanno un piccolo vantaggio, e può bastare la loro sola
//     fondamentale: così l'iPad sente le note dal Re4 in su suonate
//     normalmente. Le altre servono solo a riconoscere uno sbaglio e devono
//     sembrare note vere (armoniche consecutive): il colpo del martelletto ne
//     fa apparire di finte, gravi, con le armoniche prese in prestito da
//     quelle suonate.
//  4. Ogni nota trovata è un ATTACCO, datato. Chi ascolta chiede: delle note
//     che aspetto, quali sono partite? Ogni attacco vale per una nota sola; le
//     prove deboli (un'armonica di un'altra nota, l'ottava, l'ottava
//     raddoppiata) valgono solo se nel colpo non c'è una nota estranea — una
//     nota sbagliata — e solo dopo un attimo, per darle il tempo di farsi
//     vedere.
//
// Misurato su `npm run bench:pezzi` (pezzi dell'app suonati con un pianoforte
// vero campionato, stanza e microfono del telefono), sui pezzi mai usati per
// tarare: passi riconosciuti dal 31% del rilevatore monofonico all'85%,
// accordi da 0 a ~77%, note sbagliate accettate 2 su 93, nessun passo preso
// prima di essere suonato. Poi sulla registrazione di prova dell'utente
// (iPad, pianoforte acustico, ottobre 2026: 17 colpi fra note e accordi) e
// sulla prova `ipad` del banco, che ne imita timbro e livello. Il
// riconoscitore con le soglie fisse prendeva 11 colpi su 17 e il 3% dei
// passi; con le soglie sul rumore ma ancora due armoniche forti 13 e il 52%;
// questo 17 e l'86%.
//
// Le soglie vengono dal banco di prova `npm run bench:pezzi`.
// ─────────────────────────────────────────────────────────────────────────────

const MIDI_LO = 28; // Mi1
const MIDI_HI = 100; // Mi7
/** Sopra questa frequenza lo spettro non serve (e il telefono la sente male). */
const MAX_HZ = 5200;
/** Armoniche considerate per nota (finché restano sotto MAX_HZ). */
const MAX_HARMONICS = 10;
/** Inarmonicità tipica delle corde del pianoforte. */
const INHARMONICITY = 0.00035;
/** Larghezza della banda attorno a ogni armonica, in centesimi. */
const BAND_CENTS = 35;

/** Per quanto si ricordano gli attacchi. */
const KEEP_MS = 2500;

/**
 * Le soglie, in un oggetto solo: il banco di prova le può variare
 * (`npm run bench:pezzi -- --p='{"REL_MIN":0.15}'`).
 */
export const P = {
  /** Il riferimento "di poco fa": i fotogrammi fra REF_FAR e REF_NEAR ms prima. */
  REF_NEAR_MS: 55,
  REF_FAR_MS: 190,
  /** Quanto deve crescere un bin, rispetto a poco fa, per contare. */
  RISE_FACTOR: 1.25,
  /**
   * Sbiancamento: a ogni bin si toglie la media dei vicini (±WHITEN_BINS). Il
   * colpo del martelletto alza tutto lo spettro insieme e senza questo accende
   * note gravi inesistenti; le armoniche vere sono picchi e restano.
   */
  WHITEN_BINS: 6,
  WHITEN_K: 0.8,
  /** Note cercate in un fotogramma, al massimo (un accordo a due mani). */
  MAX_NOTES: 8,
  /** Una nota deve valere almeno questa frazione della più forte del fotogramma. */
  REL_MIN: 0.15,
  /**
   * E almeno questa frazione dell'attacco più forte "di poco fa": l'accordo
   * forte appena suonato che risuona non deve sembrare un attacco nuovo. Il
   * ricordo del più forte si spegne in LOUD_TAU_MS (a tempo, non a
   * fotogrammi: sull'iPad in risparmio energetico i fotogrammi sono la metà).
   */
  RECENT_MIN: 0.035,
  LOUD_TAU_MS: 400,
  /**
   * Il rumore di fondo, banda per banda: scende subito col silenzio, sale
   * piano (NF_UP_DB_S dB al secondo), mediato su ±NF_SPREAD bin. Le soglie
   * sono RAPPORTI su di lui, non volumi fissi: l'iPad senza controllo del
   * guadagno manda il pianoforte 20–30 dB più piano di un microfono "da
   * studio", con il rumore altrettanto più basso — e una soglia fissa
   * buttava proprio le note suonate normalmente.
   *  · NF_PEAK: un picco di ciò che è cresciuto deve superare il rumore di
   *    tanto, altrimenti è il rumore che fluttua;
   *  · NF_NOTE: una nota deve valere tanto più del rumore nelle sue bande.
   * ABS_FLOOR resta solo contro il silenzio digitale (microfono interrotto).
   */
  NF_PEAK: 2.5,
  NF_NOTE: 4,
  NF_UP_DB_S: 3,
  NF_SPREAD: 4,
  ABS_FLOOR: 1e-7,
  /**
   * Piattezza: un colpo (passi, una porta, il tonfo del pedale) fa crescere
   * tutte le frequenze insieme, una nota solo le sue armoniche. Misurata sul
   * banco: l'attacco del pianoforte ha piattezza 0,14–0,33, un colpo 0,67–0,86.
   * Sopra FLAT_MAX il fotogramma non conta (la voce invece non è piatta: per
   * lei serve altro). Sulle frequenze fra FLAT_LO_HZ e FLAT_HI_HZ.
   */
  FLAT_MAX: 0.5,
  FLAT_LO_HZ: 100,
  FLAT_HI_HZ: 4000,
  /** Una nota diventa attacco se si trova in PERSIST fotogrammi su PERSIST_OF. */
  PERSIST: 1,
  PERSIST_OF: 3,
  /** Due attacchi della stessa nota più vicini di così sono uno solo. */
  MERGE_MS: 140,
  /** Dopo un attacco usato, gli echi della stessa nota (ottave comprese) non contano per così tanto. */
  ECHO_MS: 220,
  /**
   * Le note che il brano aspetta: un piccolo vantaggio nella ricerca e una
   * soglia più bassa (una nota della sinistra suonata piano accanto a un
   * accordo forte della destra). Una nota sbagliata non ne approfitta: le sue
   * armoniche cadono fuori dalle bande di quella attesa.
   */
  EXPECTED_BOOST: 1.3,
  EXPECTED_REL_MIN: 0.07,
  /**
   * Appena preso un passo, per un attimo nessun attacco conta: sono ancora i
   * resti dell'accordo appena suonato (armoniche, battimenti), non il passo dopo.
   */
  GUARD_MS: 70,
  /** Un attacco così forte (rispetto al più forte) che non c'entra con le note attese è uno sbaglio. */
  STRAY_MIN: 0.6,
  /** Distanza massima (semitoni) perché un attacco più debole accanto a una nota attesa sia dispersione. */
  LEAK_SEMITONES: 2,
  /** Ottava raddoppiata accettata quando il resto dell'accordo è arrivato (1 sì, 0 no). */
  CHORD_DONE: 1,
  /** …solo in accordi di almeno tante note. */
  CHORD_DONE_MIN: 4,
  /** …e almeno tanto più debole della nota attesa vicina. */
  LEAK_RATIO: 1.6,
  /** Le indulgenze (ottava, ottava raddoppiata) valgono per attacchi vecchi almeno così. */
  SETTLE_MS: 60,
  /**
   * Note dell'accordo rimaste indietro: entro CHORD_WINDOW_MS da una nota
   * dell'accordo trovata, almeno VERIFY_MIN armoniche esclusive (fra le prime
   * VERIFY_HARMONICS) cresciute, con ampiezza media almeno VERIFY_REL della
   * nota trovata più forte.
   */
  CHORD_WINDOW_MS: 100,
  VERIFY_HARMONICS: 8,
  VERIFY_MIN: 2,
  VERIFY_REL: 0.2,
  /** Armoniche che devono crescere per una nota attesa ribattuta (vedi salience). */
  RESTRIKE_MIN: 3,
  /** Ottava raddoppiata: la nota sopra vale se la sua fondamentale ha almeno tanto in più (1 sì, 0 no). */
  DOUBLING: 1,
  DOUBLE_EXCESS: 1.6,
  /**
   * La sola fondamentale. Suonata normalmente su un pianoforte vero e
   * ascoltata dall'iPad, una nota dal Re4 in su arriva quasi solo come
   * fondamentale: la 2ª armonica 15–25 dB sotto (registrazione di prova
   * dell'utente, ottobre 2026). Chiedere due armoniche forti voleva dire
   * sentire solo chi suona forte. Per una nota ATTESA basta la fondamentale
   * (con peso SOLO_K), se è lei la più forte delle sue armoniche, sopra
   * SOLO_MIN_HZ, e:
   *  · cade entro SOLO_CENTS dalla nota esatta (il pianoforte dell'utente sta
   *    entro 6 cent; il fianco di un'altra nota o il rumore cadono dove capita);
   *  · è cresciuta almeno SOLO_RISE volte rispetto a poco fa (un colpo, non
   *    il battimento di una nota che si spegne);
   *  · entro due semitoni non c'è un picco SOLO_NEIGH volte il suo (la nota
   *    sbagliata accanto);
   *  · un'ottava, una dodicesima o due ottave sotto non c'è un picco SOLO_SUB
   *    volte il suo (sarebbe la sua armonica);
   *  · la stessa nota un'ottava o due sotto, se è nel passo, non è appena
   *    arrivata: lì decide il controllo dell'ottava raddoppiata.
   */
  SOLO_K: 0.8,
  SOLO_MIN_HZ: 150,
  SOLO_CENTS: 20,
  SOLO_RISE: 2,
  SOLO_NEIGH: 0.7,
  SOLO_SUB: 0.5,
  /**
   * Una nota attesa (fondamentale sopra i 200 Hz) accanto a un picco NEIGH
   * volte più forte, a un semitono o due: è il fianco della nota suonata
   * davvero, quella sbagliata — anche quando è ribattuta e non dà un attacco suo.
   */
  NEIGH: 2,
  /**
   * Preso un passo, le armoniche esatte delle sue note (ottava, dodicesima…)
   * che arrivano entro HARM_ECHO_MS dal colpo non valgono per il passo dopo:
   * sono il colpo appena usato che si fa vedere un attimo dopo (il Fa5 terza
   * armonica del Si♭3), non una nota nuova.
   */
  HARM_ECHO_MS: 150,
  /**
   * Le note che suona l'app (l'accompagnamento dell'altra mano, dal suo
   * altoparlante, a pochi centimetri dal microfono): la nota e le sue
   * armoniche esatte che partono da poco prima a EXTERNAL_MS dopo il suo
   * attacco non sono di chi suona. Abbondante: l'altoparlante dell'iPad
   * arriva con 50–150 ms di ritardo.
   */
  EXTERNAL_MS: 350,
};

/** Due bande si considerano sovrapposte se distano meno di così (rapporto di frequenza). */
const SHARE_K = 2 ** (40 / 1200);

/** Distanze in semitoni fra una nota e le sue armoniche 2–6. */
const HARMONIC_STEPS = [12, 19, 24, 28, 31];

/** Una banda attorno a un'armonica, in bin frazionari. */
interface Band { lo: number; hi: number; w: number }

/** I picchi di ciò che è cresciuto: posizione (bin, interpolata) e ampiezza. */
interface Peaks { pos: Float32Array; amp: Float32Array; count: number }

export interface Attack {
  midi: number;
  at: number;
  strength: number;
  /**
   * Prova indiretta: la nota è all'ottava (o due) di un'altra appena
   * suonata, e sulla sua fondamentale c'è più energia di quanta ne darebbe
   * l'altra da sola. Vale solo come ottava raddoppiata.
   */
  doubled?: boolean;
  /**
   * Prova "d'accordo": la nota non è uscita dalla ricerca libera, ma l'accordo
   * atteso è appena stato colpito e le sue armoniche esclusive sono cresciute
   * quanto quelle delle compagne. Vale solo se nel colpo non c'è una nota estranea.
   */
  verified?: boolean;
}

export class ChordMatcher {
  private readonly bins: number;
  /** Hz per bin. */
  private readonly hz: number;
  private readonly bands: Band[][] = [];
  /** Somma dei pesi delle bande di ogni nota: per confrontare acuti e gravi alla pari. */
  private readonly weight: number[] = [];
  /** Il fotogramma in esame: i picchi prima di togliere le note trovate, lo spettro, il riferimento. */
  private framePeaks: Peaks | null = null;
  private frameMag: Float32Array | null = null;
  private frameRef: Float32Array | null = null;
  /** Le note già trovate in questo fotogramma. */
  private taken = new Set<number>();
  /** Le armoniche dei colpi già usati (vedi HARM_ECHO_MS). */
  private harmEcho: { midi: number; from: number; until: number }[] = [];
  /** Le note suonate dall'app, con l'istante dell'attacco (vedi EXTERNAL_MS). */
  private externals: { midi: number; at: number }[] = [];
  private frames: { at: number; mag: Float32Array }[] = [];
  private attacks: Attack[] = [];
  private loudest = 0;
  private loudestAt = 0;
  /** Il rumore di fondo per bin (vedi NF_*), e quando è stato aggiornato. */
  private floor: Float32Array | null = null;
  private floorAt = 0;
  /** Il rumore "visto" da ogni nota: media pesata del rumore nelle sue bande. */
  private noteFloor = new Float32Array(MIDI_HI + 1);
  private blockedUntil = 0;
  /** Le note trovate negli ultimi fotogrammi (per la persistenza). */
  private recentFrames: { at: number; notes: Map<number, number> }[] = [];
  /** Fino a quando ignorare ogni classe di altezza (attacchi già usati). */
  private echoUntil = new Float64Array(12);
  /** Le note che il brano aspetta adesso. */
  private expected = new Set<number>();
  /** Tutte le note del passo, anche quelle già arrivate. */
  private stepNotes = new Set<number>();
  /** L'istante dell'ultimo fotogramma. */
  private now = 0;
  /** Prima di questo istante nessun attacco conta (vedi GUARD_MS). */
  private quietUntil = 0;

  constructor(sampleRate: number, fftSize: number) {
    const hz = sampleRate / fftSize;
    this.hz = hz;
    this.bins = Math.min(fftSize / 2, Math.ceil(MAX_HZ / hz) + 2);
    const k = 2 ** (BAND_CENTS / 1200);
    for (let m = 0; m <= MIDI_HI; m++) {
      const list: Band[] = [];
      if (m >= MIDI_LO) {
        const f0 = 440 * 2 ** ((m - 69) / 12);
        for (let h = 1; h <= MAX_HARMONICS; h++) {
          const f = h * f0 * Math.sqrt(1 + INHARMONICITY * h * h);
          if (f * k > MAX_HZ) break;
          list.push({ lo: f / k / hz, hi: (f * k) / hz, w: 1 / Math.sqrt(h) });
        }
      }
      this.bands.push(list);
      this.weight.push(list.reduce((a, b) => a + b.w, 0) || 1);
    }
  }

  reset() {
    this.frames = [];
    this.attacks = [];
    this.loudest = 0;
    this.loudestAt = 0;
    this.floor = null;
    this.floorAt = 0;
    this.blockedUntil = 0;
    this.recentFrames = [];
    this.echoUntil.fill(0);
    this.quietUntil = 0;
    this.harmEcho = [];
    this.externals = [];
  }

  /**
   * Le note che il brano aspetta adesso (vuoto: ascolto senza attese) e
   * tutte quelle del passo, anche già arrivate.
   */
  expect(notes: number[], step: number[] = notes) {
    this.expected = new Set(notes);
    this.stepNotes = new Set(step);
  }

  /** Ignora tutto fino a `now + ms` (suona l'app). */
  block(ms: number, now: number) {
    this.blockedUntil = Math.max(this.blockedUntil, now + ms);
  }

  /** L'app ha smesso di suonare: la sordità finisce a `until` (vedi NoteTracker.release). */
  release(until: number) {
    if (until < this.blockedUntil) this.blockedUntil = until;
  }

  /**
   * L'app sta per suonare queste note (`at`: l'istante dell'attacco, nello
   * stesso tempo di `feed`), mentre si continua ad ascoltare: vedi EXTERNAL_MS.
   */
  external(notes: { midi: number; at: number }[]) {
    const now = Math.max(this.now, ...notes.map(n => n.at));
    this.externals = this.externals.filter(e => now - e.at < KEEP_MS);
    this.externals.push(...notes);
  }

  /** Una nota `midi` che parte a `at` può essere dell'altoparlante? */
  private fromApp(midi: number, at: number): boolean {
    return this.externals.some(e => at >= e.at - 30 && at <= e.at + P.EXTERNAL_MS && (midi === e.midi || HARMONIC_STEPS.includes(midi - e.midi)));
  }

  /**
   * Un fotogramma: lo spettro in dB come lo dà `AnalyserNode.getFloatFrequencyData`.
   * Restituisce gli attacchi trovati in questo fotogramma.
   */
  feed(db: Float32Array, now: number): Attack[] {
    const n = this.bins;
    const mag = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const v = db[i];
      mag[i] = v > -150 ? 10 ** (v / 20) : 0;
    }

    // Il silenzio digitale (il microfono che si apre, un'interruzione) non è
    // il rumore della stanza: da lì non si impara il rumore e non si ascolta.
    // Imparato da lì, il rumore restava a zero e ogni fruscio era una nota.
    // Il fotogramma resta però come riferimento: la nota che parte dopo il
    // silenzio cresce rispetto a lui.
    let top = 0;
    for (let i = 0; i < n; i++) if (mag[i] > top) top = mag[i];
    const silent = top < P.ABS_FLOOR;

    // Il rumore di fondo: scende subito quando il bin è più basso, sale piano.
    if (!silent) {
      const dt = this.floor ? Math.max(0, Math.min(200, now - this.floorAt)) / 1000 : 0;
      this.floorAt = now;
      if (!this.floor) this.floor = Float32Array.from(mag, v => Math.max(v, P.ABS_FLOOR));
      const up = 10 ** ((P.NF_UP_DB_S * dt) / 20);
      for (let i = 0; i < n; i++) {
        const f = this.floor[i];
        this.floor[i] = mag[i] < f ? 0.7 * f + 0.3 * mag[i] : Math.max(f, P.ABS_FLOOR) * up;
      }
    }
    const floor = this.floor;
    const fl = new Float32Array(n).fill(P.ABS_FLOOR);
    if (floor) {
      const W = P.NF_SPREAD;
      let acc = 0;
      let lo = 0;
      let hi = -1;
      for (let i = 0; i < n; i++) {
        while (hi < Math.min(n - 1, i + W)) acc += floor[++hi];
        while (lo < i - W) acc -= floor[lo++];
        fl[i] = Math.max(P.ABS_FLOOR, acc / (hi - lo + 1));
      }
    }
    for (let m = MIDI_LO; m <= MIDI_HI; m++) {
      let sum = 0;
      for (const b of this.bands[m]) sum += b.w * fl[Math.min(n - 1, Math.round((b.lo + b.hi) / 2))];
      this.noteFloor[m] = sum / this.weight[m];
    }

    // Il riferimento: per ogni bin, il valore più alto di poco fa.
    const ref = new Float32Array(n);
    let refs = 0;
    for (const f of this.frames) {
      const age = now - f.at;
      if (age < P.REF_NEAR_MS || age > P.REF_FAR_MS) continue;
      refs++;
      for (let i = 0; i < n; i++) if (f.mag[i] > ref[i]) ref[i] = f.mag[i];
    }
    this.frames.push({ at: now, mag });
    while (this.frames.length && now - this.frames[0].at > P.REF_FAR_MS + 20) this.frames.shift();
    this.attacks = this.attacks.filter(a => now - a.at < KEEP_MS);
    this.loudest *= Math.exp(-Math.max(0, now - this.loudestAt) / P.LOUD_TAU_MS);
    this.loudestAt = now;
    if (refs === 0 || now < this.blockedUntil || silent || !floor) return [];

    // Ciò che è cresciuto, sbiancato.
    const raw = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const d = mag[i] - ref[i] * P.RISE_FACTOR;
      raw[i] = d > 0 ? d : 0;
    }
    // Un colpo, non una nota: la crescita è piatta (media geometrica vicina
    // all'aritmetica) invece che fatta di picchi.
    {
      const lo = Math.max(1, Math.round(P.FLAT_LO_HZ / this.hz));
      const hi = Math.min(n, Math.round(P.FLAT_HI_HZ / this.hz));
      let logSum = 0;
      let sum = 0;
      let count = 0;
      for (let i = lo; i < hi; i++) {
        if (raw[i] <= 0) continue;
        logSum += Math.log(raw[i]);
        sum += raw[i];
        count++;
      }
      if (count > 20 && Math.exp(logSum / count) / (sum / count) > P.FLAT_MAX) return [];
    }
    const rise = new Float32Array(n);
    let acc = 0;
    for (let i = 0; i < Math.min(n, P.WHITEN_BINS * 2 + 1); i++) acc += raw[i];
    for (let i = 0; i < n; i++) {
      const lo = i - P.WHITEN_BINS - 1;
      const hi = i + P.WHITEN_BINS;
      if (i > P.WHITEN_BINS && hi < n) acc += raw[hi] - raw[lo];
      const width = Math.min(n - 1, i + P.WHITEN_BINS) - Math.max(0, i - P.WHITEN_BINS) + 1;
      const d = raw[i] - P.WHITEN_K * (acc / width);
      rise[i] = d > 0 ? d : 0;
    }

    // Solo i picchi veri, con la posizione interpolata: il fianco del picco
    // di un Sol non deve contare come un Fa♯ (a 4096 punti un semitono, in
    // basso, sta dentro un solo lobo della finestra).
    const peaks: Peaks = { pos: new Float32Array(n), amp: new Float32Array(n), count: 0 };
    for (let i = 1; i < n - 1; i++) {
      const b = rise[i];
      if (b <= 0 || b < rise[i - 1] || b <= rise[i + 1]) continue;
      // un picco che non supera il rumore di fondo è il rumore che fluttua
      if (b < P.NF_PEAK * fl[i]) continue;
      const a = rise[i - 1];
      const c = rise[i + 1];
      const den = a - 2 * b + c;
      const d = den < 0 ? (0.5 * (a - c)) / den : 0;
      peaks.pos[peaks.count] = i + d;
      peaks.amp[peaks.count] = b - 0.25 * (a - c) * d;
      peaks.count++;
    }

    this.now = now;
    const before = peaks.amp.slice(0, peaks.count);
    this.framePeaks = { pos: peaks.pos, amp: before, count: peaks.count };
    this.frameMag = mag;
    this.frameRef = ref;
    const found: Attack[] = [];
    let first = 0;
    const taken = new Set<number>();
    this.taken = taken;
    const skip = new Set<number>();
    for (let iter = 0; iter < P.MAX_NOTES; iter++) {
      let best = -1;
      let bestS = 0;
      let bestScore = 0;
      for (let m = MIDI_LO; m <= MIDI_HI; m++) {
        if (skip.has(m)) continue;
        // La forza è l'ampiezza media delle armoniche: un Do3 ne ha dieci sotto
        // i 5 kHz, un Re5 sei, e sommarle farebbe sembrare deboli tutti gli acuti.
        const s = this.salience(m, peaks) / this.weight[m];
        const score = this.expected.has(m) ? s * P.EXPECTED_BOOST : s;
        if (score > bestScore) { bestScore = score; bestS = s; best = m; }
      }
      if (best < 0) break;
      // La migliore è di nuovo una nota già trovata: ciò che resta è il suo
      // avanzo (togliendola non va via tutta), non una nota nuova. Scavare
      // oltre trova note fantasma: misurato, raddoppia gli sbagli accettati.
      if (taken.has(best)) break;
      if (this.expected.has(best) && this.besideStronger(best)) {
        skip.add(best);
        iter--;
        continue;
      }
      if (iter === 0) first = bestS;
      const rel = this.expected.has(best) ? P.EXPECTED_REL_MIN : P.REL_MIN;
      if (bestS < P.NF_NOTE * this.noteFloor[best] || bestS < rel * first || bestS < P.RECENT_MIN * this.loudest) break;
      this.cancel(best, peaks);
      taken.add(best);
      found.push({ midi: best, at: now, strength: bestS });
    }

    // Ottave raddoppiate: per ogni nota attesa non trovata che sta un'ottava
    // (o due) sopra una nota trovata, si guarda la sua fondamentale. La nota
    // sotto ci mette la sua 2ª (o 4ª) armonica, che si stima dalle armoniche
    // vicine; se c'è molto di più, anche la nota sopra è stata suonata.
    const doubled: Attack[] = [];
    for (const e of this.expected) {
      if (found.some(f => f.midi === e)) continue;
      for (const y of found) {
        const h = e - y.midi === 12 ? 2 : e - y.midi === 24 ? 4 : 0;
        if (!h) continue;
        const yb = this.bands[y.midi];
        const amp = (k: number) => {
          const j = yb[k - 1] ? this.bandPeak(yb[k - 1], { pos: peaks.pos, amp: before as Float32Array, count: peaks.count }) : -1;
          return j < 0 ? 0 : before[j];
        };
        const observed = amp(h);
        const neighbours = [amp(h - 1), amp(h + 1)].filter(v => v > 0);
        const predicted = neighbours.length ? neighbours.reduce((a, v) => a + v, 0) / neighbours.length : 0;
        if (observed > 0 && observed >= P.DOUBLE_EXCESS * predicted) {
          doubled.push({ midi: e, at: now, strength: y.strength * 0.5, doubled: true });
          break;
        }
      }
    }

    // Le note dell'accordo rimaste indietro (la più debole, una interna
    // coperta dalle armoniche delle altre). Solo se l'accordo atteso è appena
    // partito: una sua nota trovata adesso o negli ultimi CHORD_WINDOW_MS.
    const chordMates = [
      ...found.filter(f => this.expected.has(f.midi)),
      ...this.attacks.filter(a => !a.doubled && !a.verified && this.expected.has(a.midi) && now - a.at <= P.CHORD_WINDOW_MS),
    ];
    if (chordMates.length > 0) {
      const ref = Math.max(...chordMates.map(a => a.strength));
      const playing = new Set([...this.expected, ...found.map(f => f.midi)]);
      const view = { pos: peaks.pos, amp: before as Float32Array, count: peaks.count };
      for (const e of this.expected) {
        if (found.some(f => f.midi === e) || this.attacks.some(a => a.midi === e && now - a.at < P.MERGE_MS)) continue;
        const evidence = this.uniqueEvidence(e, playing, view);
        if (evidence && evidence.count >= P.VERIFY_MIN && evidence.level >= P.VERIFY_REL * ref) {
          found.push({ midi: e, at: now, strength: evidence.level, verified: true });
        }
      }
    }

    // Persistenza: la nota deve esserci in almeno P.PERSIST degli ultimi
    // P.PERSIST_OF fotogrammi. L'attacco si data alla prima volta che compare.
    this.recentFrames.push({ at: now, notes: new Map(found.map(a => [a.midi, a.strength])) });
    while (this.recentFrames.length > P.PERSIST_OF) this.recentFrames.shift();
    const fresh: Attack[] = [];
    for (const a of found) {
      const seen = this.recentFrames.filter(f => f.notes.has(a.midi));
      if (seen.length < P.PERSIST) continue;
      if (a.strength > this.loudest) this.loudest = a.strength;
      const prev = this.attacks.find(p => p.midi === a.midi && now - p.at < P.MERGE_MS);
      if (prev) { prev.strength = Math.max(prev.strength, a.strength); continue; }
      const attack: Attack = { midi: a.midi, at: seen[0].at, strength: Math.max(...seen.map(f => f.notes.get(a.midi) ?? 0)), verified: a.verified };
      this.attacks.push(attack);
      fresh.push(attack);
    }
    for (const d of doubled) {
      if (this.attacks.some(p => p.midi === d.midi && now - p.at < P.MERGE_MS)) continue;
      this.attacks.push(d);
    }
    return fresh;
  }

  /**
   * Le armoniche "sue" della nota `e`: quelle (fra le prime VERIFY_HARMONICS)
   * che nessun'altra nota in gioco ha vicino. Restituisce quante sono
   * cresciute e la loro ampiezza media pesata, confrontabile con la forza
   * delle note trovate. Nel grave la fondamentale non si separa dal semitono
   * accanto: si parte dalla seconda armonica.
   */
  private uniqueEvidence(e: number, playing: Set<number>, peaks: Peaks): { count: number; level: number } | null {
    const bands = this.bands[e].slice(0, P.VERIFY_HARMONICS);
    let sum = 0;
    let wsum = 0;
    let count = 0;
    let max = 0;
    const amps: number[] = [];
    bands.forEach((b, h) => {
      if (h === 0 && e < 48) return;
      const shared = [...playing].some(o => o !== e && this.bands[o].some(ob => ob.lo <= b.hi * SHARE_K && ob.hi * SHARE_K >= b.lo));
      if (shared) return;
      const j = this.bandPeak(b, peaks);
      const p = j < 0 ? 0 : peaks.amp[j];
      amps.push(p);
      if (p > max) max = p;
      sum += b.w * p;
      wsum += b.w;
    });
    if (wsum === 0 || max === 0) return null;
    for (const p of amps) if (p >= 0.25 * max) count++;
    return { count, level: sum / wsum };
  }

  /** Entro due semitoni dalla fondamentale di `m` (sopra i 200 Hz) c'è un picco NEIGH volte il suo? */
  private besideStronger(m: number): boolean {
    const fp = this.framePeaks;
    const f0 = 440 * 2 ** ((m - 69) / 12);
    if (!fp || P.NEIGH <= 0 || f0 < 200) return false;
    const jm = this.bandPeak(this.bands[m][0], fp);
    if (jm < 0) return false;
    const own = fp.amp[jm];
    for (let j = 0; j < fp.count; j++) {
      const fj = fp.pos[j] * this.hz;
      const c = Math.abs(1200 * Math.log2(fj / f0));
      if (c <= 50 || c >= 240 || fp.amp[j] < P.NEIGH * own) continue;
      // Il vicino è un'altra nota del passo (un accordo con la seconda,
      // suonata più forte): non è uno sbaglio.
      if (this.stepNotes.has(Math.round(69 + 12 * Math.log2(fj / 440)))) continue;
      return true;
    }
    return false;
  }

  /** La sola fondamentale della nota attesa `m` è una prova (vedi SOLO_*)? */
  private soloFundamental(m: number): boolean {
    const fp = this.framePeaks;
    const mag = this.frameMag;
    const ref = this.frameRef;
    if (!fp || !mag || !ref) return false;
    const f0 = 440 * 2 ** ((m - 69) / 12);
    if (f0 < P.SOLO_MIN_HZ || this.fromApp(m, this.now)) return false;
    const jm = this.bandPeak(this.bands[m][0], fp);
    if (jm < 0) return false;
    const at = fp.pos[jm] * this.hz;
    const own = fp.amp[jm];
    if (Math.abs(1200 * Math.log2(at / f0)) > P.SOLO_CENTS) return false;
    const bin = Math.round(fp.pos[jm]);
    if (mag[bin] < P.SOLO_RISE * ref[bin]) return false;
    for (let j = 0; j < fp.count; j++) {
      if (j === jm) continue;
      const c = Math.abs(1200 * Math.log2((fp.pos[j] * this.hz) / at));
      if (c <= 200 && fp.amp[j] >= P.SOLO_NEIGH * own) return false;
    }
    for (const d of [12, 19, 24]) {
      if (m - d < MIDI_LO) continue;
      const j = this.bandPeak(this.bands[m - d][0], fp);
      if (j >= 0 && fp.amp[j] >= P.SOLO_SUB * own) return false;
    }
    for (const d of [12, 24]) {
      const o = m - d;
      if (this.stepNotes.has(o) && (this.taken.has(o) || this.attacks.some(a => a.midi === o && this.now - a.at <= P.CHORD_WINDOW_MS))) return false;
    }
    return true;
  }

  /** Il picco più alto dentro una banda, o -1. I picchi sono in ordine di posizione. */
  private bandPeak(b: Band, peaks: Peaks): number {
    let lo = 0;
    let hi = peaks.count;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (peaks.pos[mid] < b.lo) lo = mid + 1;
      else hi = mid;
    }
    let best = -1;
    for (let j = lo; j < peaks.count && peaks.pos[j] <= b.hi; j++) {
      if (peaks.amp[j] > 0 && (best < 0 || peaks.amp[j] > peaks.amp[best])) best = j;
    }
    return best;
  }

  /**
   * Quanto la nota `m` spiega di ciò che è cresciuto: armoniche pesate.
   * Servono almeno due armoniche presenti, una delle quali fra le prime tre:
   * un picco isolato è rumore o l'armonica di un'altra nota.
   */
  private salience(m: number, peaks: Peaks): number {
    const bands = this.bands[m];
    if (bands.length === 0) return 0;
    let s = 0;
    let peakMax = 0;
    const amps: number[] = [];
    for (const b of bands) {
      const j = this.bandPeak(b, peaks);
      const p = j < 0 ? 0 : peaks.amp[j];
      amps.push(p);
      if (p > peakMax) peakMax = p;
      s += b.w * p;
    }
    if (peakMax === 0) return 0;
    let present = 0;
    let low = false;
    /** Le armoniche presenti, contate da 1. */
    const hs: number[] = [];
    amps.forEach((p, h) => {
      if (p > 0.18 * peakMax) {
        present++;
        hs.push(h + 1);
        if (h < 3) low = true;
      }
    });
    // Una sottoarmonica fantasma: le armoniche presenti sono tutte multiple di
    // k, cioè sono quelle della nota k volte più acuta (un Fa1 con la 3ª, la
    // 6ª e la 9ª armonica è un Do3).
    if (hs.length >= 2 && [2, 3, 4, 5].some(k => hs.every(h => h % k === 0))) return 0;
    const expected = this.expected.has(m);
    // Una nota non attesa serve solo a riconoscere uno sbaglio, e deve
    // sembrare una nota vera: due armoniche consecutive fra le prime quattro.
    // Le note fantasma del colpo del martelletto (un Si2 con la 1ª e la 4ª, un
    // Sol♯2 con la 3ª e la 5ª) hanno armoniche sparse, prese in prestito dalle
    // note suonate, e rubavano il posto a quelle vere.
    if (!expected && bands.length >= 2 && ![1, 2, 3].some(h => hs.includes(h) && hs.includes(h + 1))) return 0;
    // Una nota con una banda sola (in cima alla tastiera) è un picco solo:
    // non attesa, è un fruscio — e la sua ottava sotto la prendeva per buona.
    if (!expected && bands.length < 2) return 0;
    const needed = bands.length >= 2 ? 2 : 1;
    if (present >= needed && low) return s;
    if (!expected) return 0;
    // Una nota attesa ribattuta mentre risuona ancora (pedale): le armoniche
    // basse c'erano già e crescono poco, quelle alte sì. Basta che ne
    // crescano almeno RESTRIKE_MIN.
    if (present >= P.RESTRIKE_MIN) return s;
    // Suonata normalmente, dall'iPad: la sola fondamentale (vedi SOLO_*).
    if (present === 1 && amps[0] === peakMax && this.soloFundamental(m)) return s * P.SOLO_K;
    return 0;
  }

  /**
   * Toglie la nota trovata: da ogni suo picco si sottrae l'ampiezza stimata
   * dalle armoniche VICINE (le armoniche di una corda calano con regolarità;
   * se qui c'è anche un'altra nota — la quinta sopra coincide con la terza
   * armonica — il di più resta).
   */
  private cancel(m: number, peaks: Peaks) {
    const bands = this.bands[m];
    const idx = bands.map(b => this.bandPeak(b, peaks));
    const amps = idx.map(j => (j < 0 ? 0 : peaks.amp[j]));
    idx.forEach((j, h) => {
      if (j < 0) return;
      const near = [amps[h - 1], amps[h + 1]].filter((v): v is number => v !== undefined);
      const smooth = near.length ? near.reduce((a, v) => a + v, 0) / near.length : amps[h];
      peaks.amp[j] = Math.max(0, peaks.amp[j] - Math.min(amps[h], smooth * 1.3));
    });
  }

  /** Gli attacchi da `since` in poi (per chi arriva un attimo dopo). */
  since(since: number): Attack[] {
    return this.attacks.filter(a => a.at >= since);
  }

  /**
   * Delle note attese, quali sono partite da `since`. Ogni attacco vale per
   * una nota sola: prima quelle esatte, poi (se `octave`) l'ottava sopra o
   * sotto, ma solo con un attacco forte quanto la metà del più forte — un
   * attacco debole all'ottava è quasi sempre un'armonica.
   */
  matched(expected: number[], since: number, octave = true): number[] {
    const pc = (m: number) => ((m % 12) + 12) % 12;
    const echo = (a: Attack) => this.harmEcho.some(h => h.midi === a.midi && a.at >= h.from && a.at < h.until);
    const all = this.since(Math.max(since, this.quietUntil)).filter(a => a.at >= this.echoUntil[pc(a.midi)] && !echo(a) && !this.fromApp(a.midi, a.at));
    const recent = all.filter(a => !a.doubled);
    // Un attacco che è un'armonica di un altro attacco dello stesso colpo
    // (l'ottava, la quinta sopra l'ottava, la doppia ottava…) non è una prova.
    const isHarmonic = (a: Attack) =>
      recent.some(y => y !== a && HARMONIC_STEPS.includes(a.midi - y.midi) && Math.abs(y.at - a.at) < 80 && y.strength >= a.strength * 0.5);
    const classes = new Set(expected.map(pc));
    const strongest = Math.max(0, ...recent.map(a => a.strength));
    // Un attacco forte che non è nessuna delle note attese (né un'armonica):
    // è stata suonata una nota sbagliata. Allora niente indulgenze.
    // …ma non lo è la "dispersione": un attacco più debole a un semitono o
    // due da una nota attesa che c'è davvero (negli accordi fitti lo spettro
    // si allarga). Se la nota attesa vicina invece manca, è uno sbaglio vero.
    const near = (a: Attack, b: Attack) => Math.abs(a.midi - b.midi) <= P.LEAK_SEMITONES && Math.abs(a.at - b.at) < 80;
    const isLeak = (a: Attack) =>
      recent.some(y => y !== a && !y.verified && expected.includes(y.midi) && near(a, y) && y.strength >= P.LEAK_RATIO * a.strength);
    // E il contrario: una nota attesa accanto a un attacco estraneo più forte
    // è probabilmente lo spettro della nota sbagliata, non la nota giusta.
    const shadowed = (x: Attack) =>
      recent.some(z => z !== x && !expected.includes(z.midi) && near(x, z) && z.strength > x.strength && !isHarmonic(z));
    const stray = recent.some(a => !classes.has(pc(a.midi)) && a.strength >= P.STRAY_MIN * strongest && !isHarmonic(a) && !isLeak(a));

    // Le prove deboli (un attacco che potrebbe essere un'armonica, l'ottava,
    // l'ottava raddoppiata) aspettano un attimo: se nello stesso colpo arriva
    // una nota sbagliata, deve fare in tempo a farsi vedere.
    const settled = all.filter(a => this.now - a.at >= P.SETTLE_MS);
    const used = new Set<Attack>();
    const out: number[] = [];
    for (const e of expected) {
      const a = recent.find(x => x.midi === e && !x.doubled && !used.has(x) && !shadowed(x) && ((!isHarmonic(x) && !x.verified) || (!stray && settled.includes(x))));
      if (a) { used.add(a); out.push(e); }
    }
    if (stray) return out;

    if (octave) {
      for (const e of expected) {
        if (out.includes(e)) continue;
        const a = settled.find(x => !x.doubled && !used.has(x) && Math.abs(x.midi - e) === 12 && !expected.includes(x.midi) && x.strength >= 0.5 * strongest);
        if (a) { used.add(a); out.push(e); }
      }
    }
    // Ottave raddoppiate (Sol2+Sol3, la melodia all'ottava): la nota sopra ha
    // le armoniche tutte dentro quella sotto, e il microfono non le separa.
    // Se una delle due c'è, vale anche l'altra.
    for (const e of P.DOUBLING ? expected : []) {
      if (out.includes(e)) continue;
      const sibling = expected.find(x => x !== e && (x - e) % 12 === 0 && Math.abs(x - e) <= 24 && out.includes(x));
      if (sibling === undefined) continue;
      // Sopra: serve la prova dell'energia in più — oppure, in un accordo
      // (almeno tre note) di cui tutte le altre note sono arrivate, si accetta
      // lo stesso: suonata piano, l'ottava sopra non si distingue. Sotto: la
      // nota più grave ha armoniche sue (dispari); se non si è vista, non c'è.
      if (e <= sibling) continue;
      const rest = expected.filter(x => x !== e && !(x > e - 25 && x < e && (e - x) % 12 === 0));
      const chordDone = P.CHORD_DONE > 0 && expected.length >= P.CHORD_DONE_MIN && rest.every(x => out.includes(x)) && settled.some(a => a.midi === sibling || Math.abs(a.midi - sibling) === 12);
      if (chordDone || settled.some(a => a.midi === e && a.doubled)) out.push(e);
    }
    return out;
  }

  /**
   * Le note di un passo sono state prese: i loro echi (la stessa nota vista
   * ancora un attimo dopo, o all'ottava) non devono valere per il passo dopo.
   */
  consume(midis: number[], now: number) {
    // Il colpo è l'attacco più recente di una delle sue note: le armoniche
    // esatte delle note prese, nate attorno a lui, sono resti suoi.
    let strikeAt = -Infinity;
    for (const a of this.attacks) if (midis.includes(a.midi) && now - a.at <= 400 && a.at > strikeAt) strikeAt = a.at;
    if (P.HARM_ECHO_MS > 0 && strikeAt > -Infinity) {
      this.harmEcho = this.harmEcho.filter(h => now - h.until < KEEP_MS);
      for (const m of midis) for (const d of HARMONIC_STEPS) this.harmEcho.push({ midi: m + d, from: strikeAt - 30, until: strikeAt + P.HARM_ECHO_MS });
    }
    this.quietUntil = Math.max(this.quietUntil, now + P.GUARD_MS);
    for (const m of midis) {
      const pc = ((m % 12) + 12) % 12;
      this.echoUntil[pc] = Math.max(this.echoUntil[pc], now + P.ECHO_MS);
    }
  }
}
