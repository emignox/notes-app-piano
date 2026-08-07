// ─────────────────────────────────────────────────────────────────────────────
// Catalogo di tecnica: scale, arpeggi, accordi.
//
// Le DITEGGIATURE non sono un dettaglio: sono il vero contenuto di un esercizio
// di scale. Sono quelle standard, per una ottava in salita; in discesa si
// leggono al contrario. Il passaggio del pollice è indicato dove avviene.
//
// Ci sono tutte e dodici le maggiori e le minori più usate. Mancano di
// proposito alcune minori con molte alterazioni (Fa♯, Do♯, Sol♯, Si♭, Mi♭
// minore): la loro diteggiatura standard varia fra le edizioni e non voglio
// scriverne una a caso. Le loro NOTE ci sono comunque nel glossario.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScaleType, ChordQuality } from '../lib/harmony';

export interface ScaleExercise {
  id: string;
  root: string;
  type: ScaleType;
  /** Titolo già pronto: "Do maggiore". */
  title: string;
  level: 'base' | 'intermedio' | 'avanzato';
  /** Diteggiatura mano destra, una ottava in salita (8 note). */
  rh: number[];
  /** Diteggiatura mano sinistra, una ottava in salita (8 note). */
  lh: number[];
  /** Nota didattica specifica di questa tonalità. */
  note: string;
}

// Le maggiori "bianche" e Fa condividono la stessa mano destra tranne Fa, che
// evita il pollice sul Si♭.
const RH_STD = [1, 2, 3, 1, 2, 3, 4, 5];
const LH_STD = [5, 4, 3, 2, 1, 3, 2, 1];

export const scaleExercises: ScaleExercise[] = [
  // ── Maggiori: tutte e dodici ──────────────────────────────────────────────
  // Il principio che le tiene insieme: il POLLICE non va mai su un tasto nero.
  // Da lì discende ogni diteggiatura qui sotto — non sono numeri da mandare a
  // memoria, sono la conseguenza di quella regola.
  {
    id: 'scala-do-maggiore', root: 'C4', type: 'maggiore', title: 'Do maggiore', level: 'base',
    rh: RH_STD, lh: LH_STD,
    note: 'Tutti tasti bianchi: qui si impara il gesto, non le note. Il pollice passa sotto dopo il Mi (destra), il terzo dito scavalca dopo il Sol (sinistra).',
  },
  {
    id: 'scala-sol-maggiore', root: 'G4', type: 'maggiore', title: 'Sol maggiore', level: 'base',
    rh: RH_STD, lh: LH_STD,
    note: 'Un diesis (Fa♯). Stessa mano del Do: cambia solo che il quarto dito della destra cade su un tasto nero.',
  },
  {
    id: 'scala-re-maggiore', root: 'D4', type: 'maggiore', title: 'Re maggiore', level: 'intermedio',
    rh: RH_STD, lh: LH_STD,
    note: 'Due diesis (Fa♯ e Do♯). Comincia a sentirsi il disegno bianco-nero sotto le dita.',
  },
  {
    id: 'scala-la-maggiore', root: 'A4', type: 'maggiore', title: 'La maggiore', level: 'intermedio',
    rh: RH_STD, lh: LH_STD,
    note: 'Tre diesis. Imparata questa diteggiatura, vale già per cinque tonalità: Do, Sol, Re, La, Mi.',
  },
  {
    id: 'scala-mi-maggiore', root: 'E4', type: 'maggiore', title: 'Mi maggiore', level: 'intermedio',
    rh: RH_STD, lh: LH_STD,
    note: 'Quattro diesis. Con tanti tasti neri la mano sta più avanti sui tasti: cambia la posizione, non la diteggiatura.',
  },
  {
    id: 'scala-si-maggiore', root: 'B3', type: 'maggiore', title: 'Si maggiore', level: 'avanzato',
    rh: RH_STD, lh: [4, 3, 2, 1, 4, 3, 2, 1],
    note: 'Cinque diesis. La destra è ancora quella standard, ma la SINISTRA cambia: parte dal 4 e fa 4-3-2-1 due volte, perché i pollici devono capitare su Mi e Si, gli unici due tasti bianchi comodi.',
  },
  {
    id: 'scala-fad-maggiore', root: 'F#4', type: 'maggiore', title: 'Fa♯ maggiore', level: 'avanzato',
    rh: [2, 3, 4, 1, 2, 3, 1, 2], lh: [4, 3, 2, 1, 3, 2, 1, 4],
    note: 'Sei diesis: cinque tasti neri su sette. Nessuna delle due mani parte dal pollice — i pollici si riservano al Si e al Mi♯ (che è il tasto del Fa).',
  },
  {
    id: 'scala-fa-maggiore', root: 'F4', type: 'maggiore', title: 'Fa maggiore', level: 'intermedio',
    rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: LH_STD,
    note: 'Un bemolle. L\'eccezione da ricordare: la destra fa 1-2-3-4 e poi ancora 1-2-3-4, perché il pollice non deve capitare sul Si♭. La sinistra resta standard.',
  },
  {
    id: 'scala-sib-maggiore', root: 'Bb3', type: 'maggiore', title: 'Si♭ maggiore', level: 'avanzato',
    rh: [4, 1, 2, 3, 1, 2, 3, 4], lh: [3, 2, 1, 4, 3, 2, 1, 3],
    note: 'Due bemolli. La destra parte dal QUARTO dito: i pollici devono cadere sul Do e sul Fa, che sono bianchi. È il primo caso in cui non si parte dal pollice — e il Si♭ in alto si prende con lo stesso 4, così la scala si può ripetere all\'infinito.',
  },
  {
    id: 'scala-mib-maggiore', root: 'Eb4', type: 'maggiore', title: 'Mi♭ maggiore', level: 'avanzato',
    rh: [3, 1, 2, 3, 4, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3],
    note: 'Tre bemolli. Entrambe le mani partono dal terzo dito: i tre tasti neri (Mi♭, La♭, Si♭) vanno presi con le dita lunghe.',
  },
  {
    id: 'scala-lab-maggiore', root: 'Ab3', type: 'maggiore', title: 'La♭ maggiore', level: 'avanzato',
    rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3],
    note: 'Quattro bemolli. I pollici della destra cadono su Do e Fa, gli unici due bianchi che restano fra i neri.',
  },
  {
    id: 'scala-reb-maggiore', root: 'Db4', type: 'maggiore', title: 'Re♭ maggiore', level: 'avanzato',
    rh: [2, 3, 1, 2, 3, 4, 1, 2], lh: [3, 2, 1, 4, 3, 2, 1, 3],
    note: 'Cinque bemolli. Sembra la più difficile e invece è comodissima: la mano si appoggia naturalmente sui neri e i pollici trovano Fa e Do.',
  },

  // ── Minori ────────────────────────────────────────────────────────────────
  // Naturale e armonica si suonano con la STESSA diteggiatura: cambia una nota
  // (la settima alzata), non la mano.
  {
    id: 'scala-la-minore', root: 'A4', type: 'minore naturale', title: 'La minore naturale', level: 'base',
    rh: RH_STD, lh: LH_STD,
    note: 'Le stesse note del Do maggiore ma partendo dal La: cambia il centro di gravità e con esso il carattere. È la relativa minore del Do.',
  },
  {
    id: 'scala-la-minore-armonica', root: 'A4', type: 'minore armonica', title: 'La minore armonica', level: 'intermedio',
    rh: RH_STD, lh: LH_STD,
    note: 'Come la naturale ma con Sol♯. Ascolta il salto fra Fa e Sol♯: tre semitoni, ed è quel buco a dare il colore.',
  },
  {
    id: 'scala-mi-minore', root: 'E4', type: 'minore naturale', title: 'Mi minore naturale', level: 'intermedio',
    rh: RH_STD, lh: LH_STD,
    note: 'Relativa minore di Sol: un solo Fa♯. Suonala subito dopo Sol maggiore per sentire il contrasto.',
  },
  {
    id: 'scala-mi-minore-armonica', root: 'E4', type: 'minore armonica', title: 'Mi minore armonica', level: 'intermedio',
    rh: RH_STD, lh: LH_STD,
    note: 'Con il Re♯: la sensibile che tira verso il Mi.',
  },
  {
    id: 'scala-re-minore', root: 'D4', type: 'minore naturale', title: 'Re minore naturale', level: 'intermedio',
    rh: RH_STD, lh: LH_STD,
    note: 'Un bemolle (Si♭), relativa minore di Fa maggiore. Attenzione: qui la destra usa la diteggiatura standard, NON quella del Fa.',
  },
  {
    id: 'scala-re-minore-armonica', root: 'D4', type: 'minore armonica', title: 'Re minore armonica', level: 'intermedio',
    rh: RH_STD, lh: LH_STD,
    note: 'Con il Do♯. È la tonalità di tantissima musica barocca.',
  },
  {
    id: 'scala-sol-minore', root: 'G4', type: 'minore naturale', title: 'Sol minore naturale', level: 'intermedio',
    rh: RH_STD, lh: LH_STD,
    note: 'Due bemolli (Si♭ e Mi♭). Relativa minore di Si♭ maggiore.',
  },
  {
    id: 'scala-do-minore', root: 'C4', type: 'minore naturale', title: 'Do minore naturale', level: 'intermedio',
    rh: RH_STD, lh: LH_STD,
    note: 'Tre bemolli. Stessa mano del Do maggiore: cambiano tre note, non le dita.',
  },
  {
    id: 'scala-do-minore-armonica', root: 'C4', type: 'minore armonica', title: 'Do minore armonica', level: 'avanzato',
    rh: RH_STD, lh: LH_STD,
    note: 'Con il Si naturale al posto del Si♭: il salto La♭ → Si è il suono più riconoscibile di questa scala.',
  },
  {
    id: 'scala-si-minore', root: 'B3', type: 'minore naturale', title: 'Si minore naturale', level: 'avanzato',
    rh: RH_STD, lh: [4, 3, 2, 1, 4, 3, 2, 1],
    note: 'Due diesis. Come il Si maggiore, la sinistra parte dal quarto dito.',
  },
  {
    id: 'scala-fa-minore', root: 'F4', type: 'minore naturale', title: 'Fa minore naturale', level: 'avanzato',
    rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: LH_STD,
    note: 'Quattro bemolli. La destra usa la diteggiatura del Fa maggiore, per lo stesso motivo: tenere il pollice lontano dai neri.',
  },
];

// ── Arpeggi ─────────────────────────────────────────────────────────────────

export interface ArpeggioExercise {
  id: string;
  root: string;
  quality: ChordQuality;
  title: string;
  level: 'base' | 'intermedio' | 'avanzato';
  /** Diteggiatura in salita su una ottava (4 note: 1-3-5-8). */
  rh: number[];
  lh: number[];
  note: string;
}

const ARP_RH = [1, 2, 3, 5];
const ARP_LH = [5, 3, 2, 1];

export const arpeggioExercises: ArpeggioExercise[] = [
  {
    id: 'arp-do-maggiore',
    root: 'C4',
    quality: 'maggiore',
    title: 'Do maggiore',
    level: 'base',
    rh: ARP_RH,
    lh: ARP_LH,
    note: 'Do-Mi-Sol-Do. Le dita si aprono più che nella scala: il polso deve accompagnare, non restare fermo.',
  },
  {
    id: 'arp-la-minore',
    root: 'A4',
    quality: 'minore',
    title: 'La minore',
    level: 'base',
    rh: ARP_RH,
    lh: ARP_LH,
    note: 'La-Do-Mi-La. Stessa mano del Do maggiore: senti la differenza fra terza piccola e terza grande.',
  },
  {
    id: 'arp-sol-maggiore',
    root: 'G4',
    quality: 'maggiore',
    title: 'Sol maggiore',
    level: 'base',
    rh: ARP_RH,
    lh: ARP_LH,
    note: 'Sol-Si-Re-Sol. Tutto su tasti bianchi, ma con un\'apertura maggiore fra pollice e indice.',
  },
  {
    id: 'arp-fa-maggiore',
    root: 'F4',
    quality: 'maggiore',
    title: 'Fa maggiore',
    level: 'intermedio',
    rh: ARP_RH,
    lh: ARP_LH,
    note: 'Fa-La-Do-Fa. Prova a suonarlo anche partendo dal primo rivolto (La-Do-Fa): è così che lo si incontra nei pezzi veri.',
  },
  {
    id: 'arp-re-minore',
    root: 'D4',
    quality: 'minore',
    title: 'Re minore',
    level: 'intermedio',
    rh: ARP_RH,
    lh: ARP_LH,
    note: 'Re-Fa-La-Re. Il primo dei tre accordi del giro II-V-I in Do: Rem → Sol7 → Do.',
  },
  {
    id: 'arp-sol-settima',
    root: 'G4',
    quality: 'settima di dominante',
    title: 'Sol settima (G7)',
    level: 'avanzato',
    rh: [1, 2, 3, 4],
    lh: [5, 4, 3, 2],
    note: 'Sol-Si-Re-Fa: quattro note, quattro dita, niente passaggio del pollice. Ascolta come "tira" verso il Do.',
  },
];

// ── Accordi da studiare ─────────────────────────────────────────────────────

export interface ChordExercise {
  id: string;
  root: string;
  quality: ChordQuality;
  title: string;
  level: 'base' | 'intermedio' | 'avanzato';
  /** Dove lo incontri: aggancia la teoria a qualcosa di reale. */
  usage: string;
}

export const chordExercises: ChordExercise[] = [
  { id: 'ch-do', root: 'C4', quality: 'maggiore', title: 'Do maggiore', level: 'base',
    usage: 'Il primo accordo di tutti. Do-Mi-Sol: pollice, medio, mignolo.' },
  { id: 'ch-sol', root: 'G3', quality: 'maggiore', title: 'Sol maggiore', level: 'base',
    usage: 'Con Do e Fa forma il giro che regge metà delle canzoni pop.' },
  { id: 'ch-fa', root: 'F3', quality: 'maggiore', title: 'Fa maggiore', level: 'base',
    usage: 'Il terzo del giro Do-Fa-Sol. Provalo in secondo rivolto (Do-Fa-La): la mano si sposta molto meno.' },
  { id: 'ch-lam', root: 'A3', quality: 'minore', title: 'La minore', level: 'base',
    usage: 'La relativa minore del Do: aggiunta al giro Do-Fa-Sol dà il celebre I-V-vi-IV.' },
  { id: 'ch-rem', root: 'D4', quality: 'minore', title: 'Re minore', level: 'intermedio',
    usage: 'Il "II grado" in Do: apre il giro più usato del jazz, Rem-Sol7-Do.' },
  { id: 'ch-mim', root: 'E4', quality: 'minore', title: 'Mi minore', level: 'intermedio',
    usage: 'Due sole note diverse dal Do maggiore: si passa dall\'uno all\'altro quasi senza muovere la mano.' },
  { id: 'ch-sol7', root: 'G3', quality: 'settima di dominante', title: 'Sol settima', level: 'intermedio',
    usage: 'Il ponte verso il Do. Suonalo e fermati: senti che chiede di andare da qualche parte.' },
  { id: 'ch-domaj7', root: 'C4', quality: 'settima maggiore', title: 'Do settima maggiore', level: 'avanzato',
    usage: 'Do-Mi-Sol-Si. Il Si a un semitono dal Do dà quel suono morbido da bossa nova.' },
  { id: 'ch-rem7', root: 'D4', quality: 'settima minore', title: 'Re settima minore', level: 'avanzato',
    usage: 'Rem7-Sol7-Domaj7 è il II-V-I: imparalo e hai in mano lo scheletro del jazz.' },
  { id: 'ch-sidim', root: 'B3', quality: 'diminuito', title: 'Si diminuito', level: 'avanzato',
    usage: 'Instabile per costruzione: si usa di passaggio, per scivolare da un accordo all\'altro.' },
];
