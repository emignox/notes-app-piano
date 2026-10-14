// ─────────────────────────────────────────────────────────────────────────────
// Diagnosi degli errori di lettura.
//
// "Sbagliato, era Sol" non insegna niente. Quasi tutti gli errori di lettura
// hanno una causa precisa, e ogni causa ha un rimedio diverso:
//
//  · CHIAVE      — hai letto la posizione con gli occhi dell'altra chiave
//                  (il Sol in prima linea di basso letto come il Mi di violino);
//  · GRADINO     — linea scambiata con lo spazio accanto;
//  · SALTO       — due gradi: hai contato una linea in più o in meno;
//  · ALTERAZIONE — la lettera era giusta, il ♯/♭ no (o non c'era);
//  · OTTAVA      — nota giusta, tasto nell'ottava sbagliata.
//
// Le funzioni sono pure: servono alla carta (avviso quando la nota torna), al
// riepilogo e ai progressi (gli errori che fai più spesso).
// ─────────────────────────────────────────────────────────────────────────────

import type { Clef, Direction, NoteEntry } from '../types';
import { LETTERS, diatonicOf, diatonicIndex, isOnLine, landmarkHint, nameInText, parseNote, staffSlot } from './notes';
import { t } from '../i18n';

export type MistakeKind = 'chiave' | 'gradino' | 'salto' | 'alterazione' | 'ottava' | 'altro';

export interface Mistake {
  kind: MistakeKind;
  /** Una frase: che cosa è successo e come evitarlo. */
  text: string;
}

/** Prima linea dell'ALTRA chiave: è lì che finisce chi legge con gli occhi sbagliati. */
const OTHER_BOTTOM: Record<Clef, number> = {
  treble: diatonicIndex('G', 2),
  bass: diatonicIndex('E', 4),
};

/** La lettera che si leggerebbe nella stessa posizione con l'altra chiave. */
export function otherClefLetter(note: string, clef: Clef): string {
  const d = OTHER_BOTTOM[clef] + staffSlot(note, clef);
  return LETTERS[((d % 7) + 7) % 7];
}

/** Distanza in gradi fra due lettere, la più corta: −3…+3. */
function letterSteps(from: string, to: string): number {
  const a = LETTERS.indexOf(from as (typeof LETTERS)[number]);
  const b = LETTERS.indexOf(to as (typeof LETTERS)[number]);
  let d = (b - a + 7) % 7;
  if (d > 3) d -= 7;
  return d;
}

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const accWord = (acc: string) => (acc === '#' ? t('diesis ♯') : acc === 'b' ? t('bemolle ♭') : '');

/**
 * Perché la risposta `given` (un nome come "Mi", "F#", oppure un tasto "E4")
 * non è la nota della carta. null se in realtà è giusta.
 */
export function diagnose(note: NoteEntry, given: string, dir: Direction): Mistake | null {
  const right = parseNote(note.englishName);
  const got = parseNote(given);
  const name = nameInText(note.englishName);
  const hasOctave = /\d/.test(given);

  if (got.letter === right.letter && got.acc === right.acc) {
    if (hasOctave && dir === 'find' && got.octave !== right.octave) {
      const where = got.octave < right.octave ? t('più in alto') : t('più in basso');
      return {
        kind: 'ottava',
        text: `${t('Nota giusta, ottava sbagliata: questo {name} sta un\'ottava {where}.', { name, where })} ${t('Il Do centrale è il punto di partenza.')}`,
      };
    }
    return null;
  }

  if (got.letter === right.letter) {
    const text = right.acc && !got.acc
      ? t('C\'era un {acc}: è {name}, il tasto nero subito {side} di {letter}.', {
          acc: accWord(right.acc),
          name,
          side: right.acc === '#' ? t('a destra') : t('a sinistra'),
          letter: nameInText(right.letter),
        })
      : !right.acc
        ? t('Nessuna alterazione davanti: è {name} naturale, un tasto bianco.', { name })
        : t('{a}, non {b}: il diesis alza, il bemolle abbassa.', { a: accWord(right.acc), b: accWord(got.acc) });
    return { kind: 'alterazione', text };
  }

  // Leggere il basso con gli occhi del violino sposta tutto di una terza. Il
  // contrario (violino letto come basso) non capita a chi impara: lì una terza
  // di differenza è solo un conteggio sbagliato.
  if (dir === 'read' && note.clef === 'bass' && otherClefLetter(note.englishName, note.clef) === got.letter) {
    return {
      kind: 'chiave',
      text: t('L\'hai letta come in chiave di violino. Qui la chiave è di basso: {anchor}, e da lì questa è {name}.', {
        anchor: t('i due punti della chiave di basso abbracciano la 4ª linea, il Fa'),
        name,
      }),
    };
  }

  const steps = letterSteps(right.letter, got.letter);
  if (Math.abs(steps) === 1) {
    if (dir === 'find') {
      return {
        kind: 'gradino',
        text: `${t('Il tasto accanto: {name} è un gradino {side}.', { name, side: steps > 0 ? t('più a sinistra') : t('più a destra') })} ${t('Guarda i gruppi di tasti neri invece di contare.')}`,
      };
    }
    const where = isOnLine(note.englishName, note.clef) ? t('SU una linea (la linea la taglia a metà)') : t('IN uno spazio (fra due linee)');
    return {
      kind: 'gradino',
      text: `${t('Un gradino {dir} del vero: la nota sta {where}.', { dir: steps > 0 ? t('più in alto') : t('più in basso'), where })} ${cap(landmarkHint(note.englishName, note.clef))}.`,
    };
  }

  if (Math.abs(steps) === 2 && dir === 'read') {
    return {
      kind: 'salto',
      text: `${t('Due gradi di distanza: hai contato una linea {err}.', { err: steps > 0 ? t('di troppo') : t('in meno') })} ${t('Non contare dal bordo: {hint}.', { hint: landmarkHint(note.englishName, note.clef) })}`,
    };
  }

  return {
    kind: 'altro',
    text: dir === 'read'
      ? t('Era {name}: {hint}.', { name, hint: landmarkHint(note.englishName, note.clef) })
      : t('Era {name}: cercalo partendo dai gruppi di tasti neri.', { name }),
  };
}

/** Il nome con cui registrare una confusione: lettera e alterazione, senza ottava. */
export function confusionName(given: string): string {
  const { letter, acc } = parseNote(given);
  return `${letter}${acc}`;
}

export const KIND_LABEL: Record<MistakeKind, string> = {
  chiave: 'chiave scambiata',
  gradino: 'linea/spazio accanto',
  salto: 'una linea di troppo',
  alterazione: 'alterazione',
  ottava: 'ottava',
  altro: 'altro',
};

/** Il consiglio per un tipo di errore che ricorre: uno, quello che serve. */
export const KIND_ADVICE: Record<MistakeKind, string> = {
  chiave: 'Prima di leggere guarda la chiave: in basso aggancia il Fa (4ª linea), in violino il Sol (2ª linea).',
  gradino: 'Guarda se la nota è attraversata da una linea o sta fra due: è la metà del lavoro.',
  salto: 'Non contare le linee dal bordo: parti dalla nota di riferimento più vicina.',
  alterazione: 'Leggi il segno PRIMA della nota: ♯ tasto nero a destra, ♭ a sinistra.',
  ottava: 'Ritrova prima il Do centrale, poi sali o scendi.',
  altro: 'Rallenta un attimo: velocità e precisione arrivano insieme, ma la precisione prima.',
};

export interface Confusion {
  note: NoteEntry;
  given: string;
  count: number;
  mistake: Mistake;
}

/** Le confusioni più frequenti fra le note sbloccate, già diagnosticate. */
export function topConfusions(
  unlocked: NoteEntry[],
  confusions: Record<string, Record<string, number>>,
  limit = 5,
): Confusion[] {
  const out: Confusion[] = [];
  for (const note of unlocked) {
    for (const [given, count] of Object.entries(confusions[note.id] ?? {})) {
      const mistake = diagnose(note, given, 'read');
      if (mistake && count >= 2) out.push({ note, given, count, mistake });
    }
  }
  return out.sort((a, b) => b.count - a.count).slice(0, limit);
}

/**
 * La nota con cui una nota viene confusa, se è fra quelle sbloccate: stessa
 * chiave, lettera data, la più vicina d'altezza. Allenarle INSIEME (una dopo
 * l'altra, mescolate) è come si impara a distinguerle.
 */
export function confusionPartner(note: NoteEntry, given: string, unlocked: NoteEntry[]): NoteEntry | undefined {
  const { letter, acc } = parseNote(given);
  const target = diatonicOf(note.englishName);
  return unlocked
    .filter(n => n.id !== note.id && n.clef === note.clef)
    .filter(n => { const p = parseNote(n.englishName); return p.letter === letter && p.acc === acc; })
    .sort((a, b) => Math.abs(diatonicOf(a.englishName) - target) - Math.abs(diatonicOf(b.englishName) - target))[0];
}
