// ─────────────────────────────────────────────────────────────────────────────
// L'ascolto del microfono, fotogramma per fotogramma, senza React né Web Audio.
//
// Prima stava dentro `usePitchDetection`: il banco di prova ne rifaceva una
// copia, e una copia prima o poi diverge (lo ha fatto: il banco "consumava"
// sempre il passo preso, l'app no). Ora l'app e le prove usano QUESTO codice:
// il hook ci mette il microfono, il banco una registrazione.
//
// A ogni fotogramma riceve il volume, l'altezza letta da pitchy, i campioni
// grezzi e lo spettro, e restituisce:
//  · la nota confermata dal rilevatore di una nota alla volta (`NoteTracker`);
//  · le note attese arrivate (`ChordMatcher`), per l'attesa in corso.
// ─────────────────────────────────────────────────────────────────────────────

import { NoteTracker } from './noteTracker';
import { ChordMatcher } from './chordMatcher';
import type { Attack } from './chordMatcher';

/** Una nuova attesa accetta anche gli attacchi appena prima (chi suona svelto). */
export const EXPECT_LOOKBACK_MS = 250;

/**
 * Le note attese arrivate finora per l'attesa `token` (numeri MIDI), con un
 * numero che cambia a ogni arrivo. È CUMULATIVO: se due aggiornamenti
 * arrivano insieme e lo schermo ne vede solo l'ultimo, non si perde niente.
 */
export interface ChordMatch {
  token: string;
  midis: number[];
  id: number;
}

export interface Expectation {
  token: string;
  /** Il token come l'ha dato chi aspetta (senza le note): torna negli eventi. */
  user: string;
  notes: number[];
  since: number;
  got: Set<number>;
  /** Già "consumata" nel riconoscitore (le sue note non valgono per l'attesa dopo). */
  consumed?: boolean;
}

export interface ListenFrame {
  /** Volume 0–1 per l'indicatore. */
  level: number;
  /** La nota che si sente adesso (MIDI) e la chiarezza della lettura. */
  live: number | null;
  clarity: number;
  /**
   * Una nota confermata in questo fotogramma (MIDI), con l'istante
   * dell'attacco. `cloudy`: è arrivata dentro una nuvola di note estranee
   * (vedi `ChordMatcher.cloud`: una voce, l'altoparlante); `echo`: è l'eco del
   * passo appena preso (vedi `ChordMatcher.isEcho`). In entrambi i casi chi
   * segue un brano non deve contarla.
   */
  confirmed: { midi: number; onset: number; cloudy: boolean; echo: boolean } | null;
  /** Le note attese arrivate, se ne è arrivata almeno una nuova in questo fotogramma. */
  match: ChordMatch | null;
  /** Gli attacchi sentiti dal riconoscitore (per le prove). */
  attacks: Attack[];
}

export class MicListener {
  readonly tracker = new NoteTracker();
  readonly matcher: ChordMatcher;
  private expectation: Expectation | null = null;
  /** Le note dei passi subito dopo quello atteso (vedi `expect`). */
  private upcoming: number[] = [];
  private matchId = 0;
  /** L'ultima nota confermata dal rilevatore di una nota alla volta (per datare il colpo in `expect`). */
  private lastConfirmed: { midi: number; onset: number } | null = null;
  /** Un errore nel riconoscitore degli accordi lo spegne: resta l'ascolto di una nota alla volta. */
  private matcherBroken = false;

  readonly sampleRate: number;

  constructor(sampleRate: number, fftSize: number) {
    this.sampleRate = sampleRate;
    this.matcher = new ChordMatcher(sampleRate, fftSize);
  }

  /**
   * Prende l'attesa in corso da un altro ascolto (il microfono riaperto con
   * un'altra frequenza di campionamento) e ne continua la numerazione: chi
   * ascolta confronta i numeri degli arrivi.
   */
  adopt(other: MicListener) {
    this.expectation = other.expectation;
    this.matchId = other.matchId;
  }

  /** Il microfono si apre: fa un colpo, i primi 400 ms non contano. L'attesa resta. */
  start(now: number) {
    this.reset();
    // Un errore del riconoscitore degli accordi lo spegne fino al microfono
    // dopo (come prima, quando a ogni apertura nasceva un ascolto nuovo).
    this.matcherBroken = false;
    this.tracker.block(400, now);
    this.matcher.block(400, now);
  }

  /** Dimentica ciò che ha sentito (non l'attesa). */
  reset() {
    this.tracker.reset();
    this.matcher.reset();
  }

  /**
   * Un fotogramma. `pitch` e `clarity` vengono da pitchy sulla finestra
   * `input`; `spectrum` è lo spettro in dB (AnalyserNode). `now` in ms.
   */
  feed(rms: number, pitch: number, clarity: number, input: Float32Array, sampleRate: number, spectrum: Float32Array | null, now: number): ListenFrame {
    const out = this.tracker.feed(rms, pitch, clarity, now, input, sampleRate);
    let match: ChordMatch | null = null;
    let attacks: Attack[] = [];
    // Qualunque cosa succeda qui, l'ascolto di una nota alla volta deve
    // continuare: un errore spegne solo l'ascolto degli accordi.
    if (spectrum && !this.matcherBroken) {
      try {
        attacks = this.matcher.feed(spectrum, now);
        const ex = this.expectation;
        if (ex) {
          this.matcher.expect(ex.notes.filter(n => !ex.got.has(n)), ex.notes, this.upcoming);
          const got = this.matcher.matched(ex.notes, ex.since).filter(n => !ex.got.has(n));
          if (got.length) {
            got.forEach(n => ex.got.add(n));
            if (ex.notes.every(n => ex.got.has(n))) { this.matcher.consume(ex.notes, now); ex.consumed = true; }
            match = { token: ex.user, midis: [...ex.got], id: ++this.matchId };
          }
        } else {
          this.matcher.expect([]);
        }
      } catch (err) {
        this.matcherBroken = true;
        console.error('Ascolto degli accordi disattivato:', err);
      }
    }
    return {
      level: out.level,
      live: out.live,
      clarity: out.clarity,
      confirmed: out.confirmed === null ? null : this.confirm(out.confirmed, out.onset ?? now),
      match,
      attacks,
    };
  }

  /** La nota confermata, con i segni per chi segue un brano (nuvola, eco). */
  private confirm(midi: number, onset: number): NonNullable<ListenFrame['confirmed']> {
    this.lastConfirmed = { midi, onset };
    // Le note del passo atteso non sono estranee (un accordo a due mani di
    // cui il riconoscitore ha perso una nota: le altre stavano lì attorno).
    const pc = (m: number) => ((m % 12) + 12) % 12;
    const allowed = new Set((this.expectation?.notes ?? []).map(pc));
    return {
      midi,
      onset,
      cloudy: !this.matcherBroken && this.matcher.cloud(midi, onset, undefined, allowed),
      echo: !this.matcherBroken && this.matcher.isEcho(midi, onset),
    };
  }

  /**
   * Silenzia il rilevamento mentre suona l'app (altoparlante → microfono).
   * Chiude anche il varco: la nota successiva dovrà avere un attacco o un
   * silenzio, non basterà la coda che sta ancora risuonando.
   */
  suppress(ms: number, now: number) {
    this.tracker.suppress(ms, now);
    this.matcher.block(ms, now);
  }

  /** L'app ha smesso di suonare prima del previsto: si torna ad ascoltare a `until`. */
  release(until: number) {
    this.tracker.release(until);
    this.matcher.release(until);
  }

  /** L'app sta per suonare queste note (`at`: l'istante dell'attacco). */
  external(notes: { midi: number; at: number }[]) {
    this.matcher.external(notes);
  }

  /**
   * Le note (MIDI) che il brano aspetta adesso; `token` cambia a ogni passo
   * (due passi di fila con lo stesso accordo sono due attese diverse).
   * `null` quando non si aspetta niente. `upcoming`: le note dei passi subito
   * dopo — sono musica, non rumore (vedi ChordMatcher.playedRecently).
   */
  expect(notes: number[] | null, token: string, now: number, upcoming: number[] = []) {
    this.upcoming = upcoming;
    const prev = this.expectation;
    if (!notes || notes.length === 0) {
      this.expectation = null;
      return;
    }
    const key = `${token}|${notes.join(',')}`;
    if (prev?.token === key) return;
    // Il passo di prima è stato completato altrove (tasto sullo schermo, o
    // l'ascolto di una nota alla volta): i suoi attacchi non devono valere
    // per il passo nuovo, come se l'avesse preso il riconoscitore. Anche se
    // il riconoscitore non ne aveva visto nessuna nota: col solo rilevatore
    // di una nota alla volta l'eco della nota suonata faceva andare avanti
    // il passo dopo, se chiedeva la stessa nota.
    if (prev && !prev.consumed) {
      // Gli echi si contano dal colpo: se l'ha confermato il rilevatore di una
      // nota alla volta, dal suo attacco (il riconoscitore cerca anche i suoi).
      const c = this.lastConfirmed;
      const mine = c && now - c.onset < 1000 && prev.notes.some(n => n === c.midi || Math.abs(n - c.midi) === 12);
      this.matcher.consume(prev.notes, now, { strikeAt: mine ? c.onset : undefined });
    }
    this.expectation = { token: key, user: token, notes, since: now - EXPECT_LOOKBACK_MS, got: new Set() };
  }
}
