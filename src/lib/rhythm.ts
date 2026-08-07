// ─────────────────────────────────────────────────────────────────────────────
// Durate, pause, metro.
//
// La regola che tiene insieme tutto: ogni figura vale la METÀ della precedente.
// Non c'è nulla da memorizzare a tabella, basta sapere da dove si parte.
// I valori sono in "movimenti" (battiti da semiminima), che è come si contano.
// ─────────────────────────────────────────────────────────────────────────────

export type ValueId = 'semibreve' | 'minima' | 'semiminima' | 'croma' | 'semicroma';

export interface NoteValue {
  id: ValueId;
  name: string;
  english: string;
  /** Durata in movimenti (semiminima = 1). */
  beats: number;
  /** Codice VexFlow della nota e della pausa corrispondente. */
  vex: string;
  vexRest: string;
  /** Come si disegna, a parole. */
  drawing: string;
  restDrawing: string;
  /** Come si conta ad alta voce in 4/4. */
  counting: string;
}

export const VALUES: NoteValue[] = [
  {
    id: 'semibreve',
    name: 'Semibreve',
    english: 'whole note',
    beats: 4,
    vex: 'w',
    vexRest: 'wr',
    drawing: 'Testa vuota, senza gambo.',
    restDrawing: 'Rettangolino appeso SOTTO la quarta linea.',
    counting: 'uno – due – tre – quattro (una nota sola che dura tutta la battuta)',
  },
  {
    id: 'minima',
    name: 'Minima',
    english: 'half note',
    beats: 2,
    vex: 'h',
    vexRest: 'hr',
    drawing: 'Testa vuota con il gambo.',
    restDrawing: 'Rettangolino appoggiato SOPRA la terza linea.',
    counting: 'uno – due, tre – quattro',
  },
  {
    id: 'semiminima',
    name: 'Semiminima',
    english: 'quarter note',
    beats: 1,
    vex: 'q',
    vexRest: 'qr',
    drawing: 'Testa piena con il gambo. È il battito: quello che batte il piede.',
    restDrawing: 'Il segno a zigzag, come una "z" allungata.',
    counting: 'uno, due, tre, quattro',
  },
  {
    id: 'croma',
    name: 'Croma',
    english: 'eighth note',
    beats: 0.5,
    vex: '8',
    vexRest: '8r',
    drawing: 'Testa piena, gambo e UNA codetta. Due crome vicine si uniscono con una travatura.',
    restDrawing: 'Una bandierina sola su un\'asta obliqua.',
    counting: 'uno e, due e, tre e, quattro e',
  },
  {
    id: 'semicroma',
    name: 'Semicroma',
    english: 'sixteenth note',
    beats: 0.25,
    vex: '16',
    vexRest: '16r',
    drawing: 'Come la croma ma con DUE codette (o due travature).',
    restDrawing: 'Due bandierine sull\'asta.',
    counting: 'uno e fa e, due e fa e…',
  },
];

export const valueById = (id: ValueId): NoteValue => VALUES.find(v => v.id === id) ?? VALUES[2];

/** Il punto aggiunge METÀ del valore: una minima puntata vale 2 + 1 = 3. */
export function dotted(beats: number, dots = 1): number {
  let total = beats;
  let add = beats;
  for (let i = 0; i < dots; i++) {
    add /= 2;
    total += add;
  }
  return total;
}

/** Una terzina: tre note nel tempo di due. */
export function tripletBeats(beats: number): number {
  return (beats * 2) / 3;
}

// ── Metro ───────────────────────────────────────────────────────────────────

export interface Meter {
  id: string;
  label: string;
  /** Movimenti per battuta (in semiminime). */
  beatsPerBar: number;
  /** Accenti: forte, debole… per far sentire la differenza. */
  accents: string;
  feel: string;
  where: string;
}

export const METERS: Meter[] = [
  {
    id: '2/4',
    label: '2/4',
    beatsPerBar: 2,
    accents: 'FORTE debole',
    feel: 'Passo di marcia: due tempi, uno accentato e uno no.',
    where: 'Marce, polke, tanta musica popolare.',
  },
  {
    id: '3/4',
    label: '3/4',
    beatsPerBar: 3,
    accents: 'FORTE debole debole',
    feel: 'Il valzer. Il primo tempo pesa, gli altri due scorrono.',
    where: 'Valzer, minuetti, ballate.',
  },
  {
    id: '4/4',
    label: '4/4',
    beatsPerBar: 4,
    accents: 'FORTE debole medio debole',
    feel: 'Il metro più comune di tutti, tanto che si scrive anche con una C.',
    where: 'Pop, rock, jazz: se non c\'è scritto niente, è quasi sempre 4/4.',
  },
  {
    id: '6/8',
    label: '6/8',
    beatsPerBar: 3,
    accents: 'FORTE debole debole medio debole debole',
    feel:
      'Sei crome raggruppate a tre a tre: si contano DUE tempi, ma ciascuno diviso in tre. Ecco perché "dondola" invece di marciare.',
    where: 'Barcarole, ninne nanne, tanto folk irlandese, molte ballate.',
  },
];

/**
 * Che cosa dicono i due numeri: sopra quante figure per battuta, sotto QUALE
 * figura vale un movimento (4 = semiminima, 8 = croma).
 */
export function meterExplain(meter: Meter): string {
  const [top, bottom] = meter.id.split('/');
  const unit = bottom === '4' ? 'una semiminima' : bottom === '8' ? 'una croma' : 'una minima';
  return `Il ${top} sopra dice quante ne stanno in una battuta; il ${bottom} sotto dice che l'unità è ${unit}.`;
}

/** Somma di una serie di figure, per verificare che una battuta torni. */
export function totalBeats(items: { beats: number; dots?: number }[]): number {
  return items.reduce((sum, it) => sum + dotted(it.beats, it.dots ?? 0), 0);
}
