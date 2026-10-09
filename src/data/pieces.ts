// ─────────────────────────────────────────────────────────────────────────────
// Il repertorio, in ordine di studio.
//
// L'ordine di questa lista È il percorso: si parte da esercizi che insegnano a
// tenere due righe sotto gli occhi e si arriva a pagine vere di Mozart e
// Chopin. Niente frammenti di otto note: ogni brano è una pagina che si può
// finire e poi suonare a qualcuno.
//
// I brani stanno in tre file per non avere un unico file da migliaia di righe;
// il controllo di correttezza (`npm run check:pezzi`) li verifica tutti
// insieme, ed è quello che tiene onesto l'ordine di difficoltà.
// ─────────────────────────────────────────────────────────────────────────────

import type { Piece } from '../types';
import { basi } from './repertoire/basi';
import { mozart } from './repertoire/mozart';
import { chopin } from './repertoire/chopin';
import { classici } from './repertoire/classici';

const RANK = { facile: 0, medio: 1, difficile: 2 } as const;

/** Dal più facile al più difficile, senza doversi ricordare di riordinare. */
export const pieces: Piece[] = [...basi, ...classici, ...mozart, ...chopin].sort(
  (a, b) => RANK[a.difficulty] - RANK[b.difficulty] || a.level - b.level,
);

export function pieceById(id: string): Piece | undefined {
  return pieces.find(p => p.id === id);
}

export { pieceNotes } from '../lib/score';
