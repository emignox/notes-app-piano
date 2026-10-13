// ─────────────────────────────────────────────────────────────────────────────
// Catalogo di tecnica: scale, arpeggi, accordi.
//
// Le DITEGGIATURE non sono un dettaglio: sono il vero contenuto di un esercizio
// di scale. Sono quelle standard, per una ottava in salita; in discesa si
// leggono al contrario. Il passaggio del pollice è indicato dove avviene.
//
// Ci sono tutte: le 12 maggiori, le 12 minori naturali, armoniche e
// melodiche, gli arpeggi maggiori e minori in tutte le tonalità, e gli
// accordi (9 tipi) su tutte e 12 le note. Le diteggiature delle minori con
// molte alterazioni variano un po' fra le edizioni: qui ci sono quelle di
// pianoscales.org, che sulle maggiori coincidono con le nostre (e con lo
// standard ABRSM) in 11 tonalità su 12, confrontate con la tabella di Music
// Magix. Gli arpeggi seguono la tabella dell'Università di Miami (prof.
// Escadon), concorde con quella di R. Kelley sui casi difficili.
// Le voci scritte a mano hanno un testo loro; le altre lo ricavano dai dati
// (alterazioni, pollici, gradi), così non possono contraddirli.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScaleType, ChordQuality } from '../lib/harmony';
import { buildChord, buildScale } from '../lib/harmony';
import { italianOf, midiOf, parseNote } from '../lib/notes';

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
  /**
   * Solo minore melodica: in discesa le note sono quelle della naturale, e
   * così la diteggiatura (scritta in salita, come le altre).
   */
  rhDown?: number[];
  lhDown?: number[];
  /** Nota didattica specifica di questa tonalità. */
  note: string;
}

// Le maggiori "bianche" e Fa condividono la stessa mano destra tranne Fa, che
// evita il pollice sul Si♭.
const RH_STD = [1, 2, 3, 1, 2, 3, 4, 5];
const LH_STD = [5, 4, 3, 2, 1, 3, 2, 1];

/** Le scale con un testo scritto a mano; le altre minori si generano più sotto. */
const writtenScales: ScaleExercise[] = [
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
// La sinistra prende la terza col 4 quando dalla fondamentale c'è un salto
// "largo" sui bianchi (Do, Fa, Sol maggiore, le minori bianche), col 3 in Re,
// La, Mi, Si maggiore, dove la terza è un tasto nero più vicino.
const ARP_LH = [5, 4, 2, 1];

const writtenArpeggios: ArpeggioExercise[] = [
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
  /** Uno dei dieci accordi "da studiare per primi", scritti a mano. */
  starter?: boolean;
}

const writtenChords: ChordExercise[] = [
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

// ── Il catalogo completo ────────────────────────────────────────────────────
// Le voci scritte a mano restano come sono; per le tonalità mancanti la voce
// si costruisce dalle tabelle qui sotto, e il testo dai dati.

type Level = 'base' | 'intermedio' | 'avanzato';
interface Hands { rh: number[]; lh: number[] }
const hands = (rh: string, lh: string): Hands => ({ rh: [...rh].map(Number), lh: [...lh].map(Number) });

const pcOf = (note: string) => ((midiOf(note) % 12) + 12) % 12;

/** Le dodici tonalità sul circolo delle quinte, con la fondamentale all'ottava giusta. */
const MAJOR_ROOTS = ['C4', 'G4', 'D4', 'A4', 'E4', 'B3', 'F#4', 'Db4', 'Ab3', 'Eb4', 'Bb3', 'F4'];
const MINOR_ROOTS = ['A4', 'E4', 'B3', 'F#4', 'C#4', 'G#3', 'Eb4', 'Bb3', 'F4', 'C4', 'G4', 'D4'];

/** "Do♯" → "dod", "Si♭" → "sib": come negli id scritti a mano. */
function slug(note: string): string {
  const { acc } = parseNote(note);
  const base = italianOf(`${parseNote(note).letter}`).toLowerCase();
  return base + (acc === '#' ? 'd' : acc === 'b' ? 'b' : '');
}

const STD = hands('12312345', '54321321');
/**
 * Minori, una ottava in salita: [naturale, armonica, melodica in salita]. In
 * discesa la melodica torna naturale, note e dita. Da pianoscales.org; la
 * melodica come l'armonica, tranne Fa♯ e Do♯, dove la sesta alzata diventa
 * un tasto nero e il pollice si sposta (Music Magix).
 */
const MINOR_FINGERING: Record<string, [Hands, Hands, Hands]> = {
  A4: [STD, STD, STD],
  E4: [STD, STD, STD],
  D4: [STD, STD, STD],
  G4: [STD, STD, STD],
  C4: [STD, STD, STD],
  B3: [hands('12312345', '43214321'), hands('12312345', '43214321'), hands('12312345', '43214321')],
  F4: [hands('12341234', '54321321'), hands('12341234', '54321321'), hands('12341234', '54321321')],
  'F#4': [hands('23123123', '43213214'), hands('23123123', '43213214'), hands('23123412', '43213214')],
  'C#4': [hands('34123123', '32143213'), hands('34123123', '32143213'), hands('23123412', '32143213')],
  'G#3': [hands('34123123', '32132143'), hands('23123123', '32143213'), hands('23123123', '32143213')],
  Eb4: [hands('31234123', '21432132'), hands('31234123', '21432132'), hands('31234123', '21432132')],
  Bb3: [hands('21231234', '21321432'), hands('21231234', '21321432'), hands('21231234', '21321432')],
};

const MINOR_TYPES: ScaleType[] = ['minore naturale', 'minore armonica', 'minore melodica'];

/** Le alterazioni in chiave, dette a parole: "4 diesis", "1 bemolle". */
function signature(notes: string[]): string {
  const sharps = notes.slice(0, 7).filter(n => parseNote(n).acc === '#').length;
  const flats = notes.slice(0, 7).filter(n => parseNote(n).acc === 'b').length;
  if (sharps) return `${sharps} diesis`;
  if (flats) return `${flats} ${flats === 1 ? 'bemolle' : 'bemolli'}`;
  return 'nessuna alterazione';
}

/**
 * "pollici su Mi e La" dalla diteggiatura: dove cade il dito 1. Nelle scale
 * l'ultima nota (l'ottava) non conta: lì la mano si ferma; negli arpeggi sì,
 * è il passaggio all'ottava sopra.
 */
function thumbs(notes: string[], fingers: number[], last: boolean): string {
  const at = notes.filter((_, i) => fingers[i] === 1 && (last || i < notes.length - 1)).map(n => italianOf(n));
  const unique = [...new Set(at)];
  if (unique.length === 0) return 'senza pollice';
  return unique.length === 1 ? `pollice su ${unique[0]}` : `pollici su ${unique.join(' e ')}`;
}

function handLine(label: string, notes: string[], fingers: number[], last = false): string {
  const start = fingers[0] === 1 || fingers[0] === 5 ? '' : `si parte col ${fingers[0]}, `;
  return `${label}: ${start}${thumbs(notes, fingers, last)} (${fingers.join('-')}).`;
}

function minorScale(root: string, type: ScaleType): ScaleExercise {
  const [natural, harmonic, melodic] = MINOR_FINGERING[root];
  const h = type === 'minore naturale' ? natural : type === 'minore armonica' ? harmonic : melodic;
  const up = buildScale(root, type);
  const nat = buildScale(root, 'minore naturale');
  const name = italianOf(root);
  const kind = type.replace('minore ', '');
  const accidentals = nat.filter(n => parseNote(n).acc !== '').length;
  const altered =
    type === 'minore armonica' ? ` Armonica: la settima alzata, ${italianOf(up[6])}.`
    : type === 'minore melodica' ? ` Melodica: in salita sesta e settima alzate (${italianOf(up[5])}, ${italianOf(up[6])}), in discesa si torna alla naturale.`
    : '';
  const level: Level = type === 'minore melodica' ? (accidentals <= 1 ? 'intermedio' : 'avanzato') : accidentals <= 2 ? 'intermedio' : 'avanzato';
  return {
    id: `scala-${slug(root)}-minore${type === 'minore naturale' ? '' : `-${kind}`}`,
    root,
    type,
    title: `${name} minore ${kind}`,
    level,
    rh: h.rh,
    lh: h.lh,
    ...(type === 'minore melodica' ? { rhDown: natural.rh, lhDown: natural.lh } : {}),
    note: `${signature(nat)} in chiave: relativa minore di ${italianOf(nat[2])} maggiore.${altered} ${handLine('Destra', up, h.rh)} ${handLine('Sinistra', up, h.lh)}`,
  };
}

/** Tutte le scale: le maggiori, poi le minori naturali, armoniche, melodiche. */
export const scaleExercises: ScaleExercise[] = [
  ...MAJOR_ROOTS.map(r => writtenScales.find(s => s.type === 'maggiore' && pcOf(s.root) === pcOf(r))).filter((s): s is ScaleExercise => !!s),
  ...MINOR_TYPES.flatMap(type => MINOR_ROOTS.map(r => {
    const written = writtenScales.find(s => s.type === type && pcOf(s.root) === pcOf(r));
    // Anche le melodiche scritte a mano (se ce ne fossero) scendono come la naturale.
    return written ?? minorScale(r, type);
  })),
];

/**
 * Arpeggi, una ottava in salita (fondamentale, terza, quinta, ottava). Dalla
 * tabella dell'Università di Miami: il pollice sui tasti bianchi; le tonalità
 * tutte nere (Fa♯ maggiore, Mi♭ minore) lo mettono sul nero come il Do.
 */
const ARP_FINGERING: Record<'maggiore' | 'minore', Record<string, Hands>> = {
  maggiore: {
    C4: hands('1235', '5421'), G4: hands('1235', '5421'), F4: hands('1235', '5421'),
    D4: hands('1235', '5321'), A4: hands('1235', '5321'), E4: hands('1235', '5321'), B3: hands('1235', '5321'),
    'F#4': hands('1235', '5421'),
    Db4: hands('4124', '2142'), Ab3: hands('4124', '2142'), Eb4: hands('4124', '2142'),
    Bb3: hands('2124', '3213'),
  },
  minore: {
    A4: hands('1235', '5421'), E4: hands('1235', '5421'), B3: hands('1235', '5421'), D4: hands('1235', '5421'),
    C4: hands('1235', '5421'), G4: hands('1235', '5421'), F4: hands('1235', '5421'),
    'F#4': hands('4124', '2142'), 'C#4': hands('4124', '2142'), 'G#3': hands('4124', '2142'),
    Eb4: hands('1235', '5421'),
    Bb3: hands('2312', '3213'),
  },
};

function arpeggio(root: string, quality: 'maggiore' | 'minore'): ArpeggioExercise {
  const h = ARP_FINGERING[quality][root];
  const chord = buildChord(root, quality);
  const notes = [...chord, chord[0]];
  const black = chord.filter(n => parseNote(n).acc !== '').length;
  const level: Level = black === 0 ? 'base' : parseNote(root).acc === '' ? 'intermedio' : 'avanzato';
  const hint =
    black === 3 ? ' Tutti tasti neri: qui il pollice va sul nero, non c\'è alternativa.'
    : parseNote(root).acc !== '' ? ' Si parte da un tasto nero con un dito lungo: il pollice tiene il tasto bianco.'
    : '';
  return {
    id: `arp-${slug(root)}-${quality}`,
    root,
    quality,
    title: `${italianOf(root)} ${quality}`,
    level,
    rh: h.rh,
    lh: h.lh,
    note: `${notes.map(n => italianOf(n)).join('-')}.${hint} ${handLine('Destra', notes, h.rh, true)} ${handLine('Sinistra', notes, h.lh, true)}`,
  };
}

/** Tutti gli arpeggi: maggiori e minori sul circolo delle quinte, poi la settima. */
export const arpeggioExercises: ArpeggioExercise[] = [
  ...(['maggiore', 'minore'] as const).flatMap(q => (q === 'maggiore' ? MAJOR_ROOTS : MINOR_ROOTS).map(r =>
    writtenArpeggios.find(a => a.quality === q && pcOf(a.root) === pcOf(r)) ?? arpeggio(r, q))),
  ...writtenArpeggios.filter(a => a.quality !== 'maggiore' && a.quality !== 'minore'),
];

// ── Accordi su tutte e dodici le note ──────────────────────────────────────

/** I tipi di accordo, nell'ordine in cui si imparano, e come si chiamano nel titolo. */
export const CHORD_QUALITIES: { quality: ChordQuality; label: string; level: Level }[] = [
  { quality: 'maggiore', label: 'maggiore', level: 'base' },
  { quality: 'minore', label: 'minore', level: 'base' },
  { quality: 'settima di dominante', label: 'settima', level: 'intermedio' },
  { quality: 'settima maggiore', label: 'settima maggiore', level: 'intermedio' },
  { quality: 'settima minore', label: 'settima minore', level: 'intermedio' },
  { quality: 'diminuito', label: 'diminuito', level: 'intermedio' },
  { quality: 'aumentato', label: 'aumentato', level: 'intermedio' },
  { quality: 'semidiminuito', label: 'semidiminuito', level: 'avanzato' },
  { quality: 'settima diminuita', label: 'settima diminuita', level: 'avanzato' },
];

/** Le fondamentali, scritte come si incontrano: bemolli per i maggiori, diesis per minori e diminuiti. */
const FLAT_ROOTS = ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G3', 'Ab3', 'A3', 'Bb3', 'B3'];
const SHARP_ROOTS = ['C4', 'C#4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G3', 'G#3', 'A3', 'Bb3', 'B3'];
const DIM_ROOTS = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G3', 'G#3', 'A3', 'A#3', 'B3'];
const ROOTS_FOR: Record<ChordQuality, string[]> = {
  maggiore: FLAT_ROOTS, aumentato: FLAT_ROOTS, 'settima di dominante': FLAT_ROOTS, 'settima maggiore': FLAT_ROOTS,
  minore: SHARP_ROOTS, 'settima minore': SHARP_ROOTS,
  diminuito: DIM_ROOTS, semidiminuito: DIM_ROOTS, 'settima diminuita': DIM_ROOTS,
};

/** Le tonalità per nome, a partire dalla classe di altezza. */
const MAJOR_KEY = ['Do', 'Re♭', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const MINOR_KEY = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'Si♭', 'Si'];
const maj = (pc: number) => `${MAJOR_KEY[((pc % 12) + 12) % 12]} maggiore`;
const min = (pc: number) => `${MINOR_KEY[((pc % 12) + 12) % 12]} minore`;

/** Dove si incontra l'accordo: i gradi che occupa nelle tonalità, ricavati dagli intervalli. */
function usageOf(root: string, quality: ChordQuality): string {
  const r = pcOf(root);
  switch (quality) {
    case 'maggiore':
      return `È la tonica di ${maj(r)}, la sottodominante (IV) di ${maj(r - 5)} e la dominante (V) di ${maj(r + 5)} e di ${min(r + 5)}.`;
    case 'minore':
      return `È la tonica di ${min(r)}; in maggiore è il II grado di ${maj(r - 2)}, il III di ${maj(r - 4)} e il VI di ${maj(r + 3)}, la sua relativa.`;
    case 'settima di dominante':
      return `È il V7 di ${maj(r + 5)} e di ${min(r + 5)}: suonalo e fermati, chiede di risolvere sulla tonica.`;
    case 'settima maggiore':
      return `È il I grado di ${maj(r)} e il IV di ${maj(r - 5)} con la settima: il suono morbido del jazz e della bossa nova.`;
    case 'settima minore':
      return `È il II grado di ${maj(r - 2)}: con il V7 e il I forma il II-V-I. È anche il III di ${maj(r - 4)} e il VI di ${maj(r + 3)}.`;
    case 'diminuito':
      return `È il VII grado di ${maj(r + 1)} e di ${min(r + 1)} (armonica): instabile, tira verso la tonica a un semitono sopra.`;
    case 'aumentato':
      return `È il III grado di ${min(r - 3)} armonica. Divide l'ottava in tre terze maggiori uguali: suona sospeso, di passaggio.`;
    case 'semidiminuito':
      return `È il VII grado di ${maj(r + 1)} e il II di ${min(r - 2)}: apre il II-V-I in minore.`;
    case 'settima diminuita':
      return `È il VII grado di ${min(r + 1)} armonica. Quattro terze minori uguali: lo stesso accordo, rivoltato, porta a quattro tonalità diverse.`;
  }
}

/** Tutti gli accordi: 9 tipi su 12 note. I dieci scritti a mano tengono il loro testo. */
export const chordExercises: ChordExercise[] = CHORD_QUALITIES.flatMap(({ quality, label, level }) =>
  ROOTS_FOR[quality].map(root => {
    const written = writtenChords.find(c => c.quality === quality && pcOf(c.root) === pcOf(root));
    if (written) return { ...written, starter: true };
    return {
      id: `ch-${slug(root)}-${quality.replace(/ /g, '-')}`,
      root,
      quality,
      title: `${italianOf(root)} ${label}`,
      level,
      usage: `${buildChord(root, quality).map(n => italianOf(n)).join('-')}. ${usageOf(root, quality)}`,
    };
  }),
);
