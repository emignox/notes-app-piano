// ─────────────────────────────────────────────────────────────────────────────
// Il controllo dei pezzi.
//
// Uno spartito scritto a mano nel codice sbaglia in silenzio: una battuta con
// un movimento di troppo non si vede finché non la si suona, e a quel punto
// l'utente pensa di aver sbagliato lui. Questi controlli trovano gli errori
// che una persona non vede rileggendo:
//
//  · battute che non tornano (la causa numero uno);
//  · legature di valore fra note diverse — che non sono legature;
//  · accordi che una mano umana non può prendere;
//  · note fuori dalla tastiera o fuori dalla chiave in cui sono scritte.
//
// Gira con `npm run check:pezzi`, e da solo in sviluppo.
// ─────────────────────────────────────────────────────────────────────────────

import type { Piece, PieceStep } from '../types';
import { midiOf } from './notes';
import { DURATION_BEATS, marksOf, meterInfo, notesOf, splitMeasures } from './score';
import type { SingleHand } from './score';

export interface Issue {
  piece: string;
  level: 'errore' | 'avviso';
  where: string;
  message: string;
}

/** Estremi della tastiera vera: 88 tasti, da La0 a Do8. */
const LOWEST = midiOf('A0');
const HIGHEST = midiOf('C8');

/** Oltre l'ottava una mano sola non arriva (e per una mano piccola nemmeno). */
const MAX_SPAN = 12;
const MAX_FINGERS = 5;

const NOTE_RE = /^[A-G](##|bb|[#b])?-?\d$/;

function checkNote(
  issues: Issue[],
  piece: Piece,
  where: string,
  note: string,
  hand: SingleHand,
): void {
  if (!NOTE_RE.test(note)) {
    issues.push({ piece: piece.id, level: 'errore', where, message: `nota illeggibile: "${note}"` });
    return;
  }
  const midi = midiOf(note);
  if (midi < LOWEST || midi > HIGHEST) {
    issues.push({ piece: piece.id, level: 'errore', where, message: `${note} è fuori dalla tastiera` });
  }
  // Le due chiavi hanno un campo naturale: se lo si sfora sistematicamente,
  // il pezzo è scritto sulla mano sbagliata.
  if (hand === 'right' && midi < midiOf('F2')) {
    issues.push({ piece: piece.id, level: 'avviso', where, message: `${note} è molto grave per la destra` });
  }
  if (hand === 'left' && midi > midiOf('G5')) {
    issues.push({ piece: piece.id, level: 'avviso', where, message: `${note} è molto acuto per la sinistra` });
  }
}

function checkChord(issues: Issue[], piece: Piece, where: string, notes: string[]): void {
  if (notes.length === 0) return;
  if (notes.length > MAX_FINGERS) {
    issues.push({
      piece: piece.id,
      level: 'errore',
      where,
      message: `${notes.length} note in una mano sola: le dita sono ${MAX_FINGERS}`,
    });
  }
  const midis = notes.map(midiOf);
  const span = Math.max(...midis) - Math.min(...midis);
  if (span > MAX_SPAN) {
    issues.push({
      piece: piece.id,
      level: 'errore',
      where,
      message: `apertura di ${span} semitoni (${notes.join(' ')}): oltre l'ottava non ci si arriva`,
    });
  }
  const seen = new Set<number>();
  for (const m of midis) {
    if (seen.has(m)) {
      issues.push({ piece: piece.id, level: 'avviso', where, message: `nota doppia nell'accordo (${notes.join(' ')})` });
      break;
    }
    seen.add(m);
  }
}

function checkTies(issues: Issue[], piece: Piece, hand: SingleHand): void {
  const steps = piece.steps;
  steps.forEach((step, i) => {
    if (!marksOf(step, hand)?.tie) return;
    const here = notesOf(step, hand);
    const next = steps[i + 1];
    const label = hand === 'right' ? 'destra' : 'sinistra';
    if (here.length === 0) {
      issues.push({ piece: piece.id, level: 'errore', where: `passo ${i + 1}`, message: `legatura di valore su una pausa (${label})` });
      return;
    }
    if (!next) {
      issues.push({ piece: piece.id, level: 'errore', where: `passo ${i + 1}`, message: `legatura di valore sull'ultimo passo (${label})` });
      return;
    }
    const there = notesOf(next, hand);
    const shared = here.filter(a => there.some(b => midiOf(a) === midiOf(b)));
    if (shared.length === 0) {
      issues.push({
        piece: piece.id,
        level: 'errore',
        where: `passo ${i + 1}`,
        message: `legatura di valore fra note diverse (${label}): ${here.join(' ')} → ${there.join(' ')}. Per legare note diverse serve la legatura di frase (leg), non tie`,
      });
    }
  });
}

function checkMeasures(issues: Issue[], piece: Piece): void {
  const { barBeats, num, den } = meterInfo(piece.meter);
  if (!Number.isFinite(num) || !Number.isFinite(den) || num <= 0 || den <= 0) {
    issues.push({ piece: piece.id, level: 'errore', where: 'metro', message: `metro non valido: "${piece.meter}"` });
    return;
  }

  const measures = splitMeasures(piece);
  measures.forEach((m, i) => {
    const expected = m.pickup ? (piece.pickup ?? barBeats) : barBeats;
    const isLast = i === measures.length - 1;
    const diff = m.beats - expected;
    if (Math.abs(diff) < 1e-6) return;
    if (isLast && diff < 0) {
      issues.push({
        piece: piece.id,
        level: 'avviso',
        where: `battuta ${m.number}`,
        message: `ultima battuta incompleta: ${m.beats} movimenti invece di ${expected}`,
      });
      return;
    }
    issues.push({
      piece: piece.id,
      level: 'errore',
      where: `battuta ${m.number} (passi ${m.indices[0] + 1}–${m.indices[m.indices.length - 1] + 1})`,
      message: `${m.beats} movimenti invece di ${expected}: la battuta non torna`,
    });
  });

  // Il levare deve essere più corto di una battuta, altrimenti non è un levare.
  if (piece.pickup !== undefined && (piece.pickup <= 0 || piece.pickup >= barBeats)) {
    issues.push({
      piece: piece.id,
      level: 'errore',
      where: 'levare',
      message: `il levare vale ${piece.pickup} movimenti: deve stare fra 0 e ${barBeats}`,
    });
  }
}

function checkDuration(issues: Issue[], piece: Piece, step: PieceStep, i: number): void {
  const expected = DURATION_BEATS[step.duration];
  if (expected === undefined) {
    issues.push({ piece: piece.id, level: 'errore', where: `passo ${i + 1}`, message: `figura sconosciuta: "${step.duration}"` });
    return;
  }
  if (Math.abs(step.beats - expected) > 1e-6) {
    issues.push({
      piece: piece.id,
      level: 'errore',
      where: `passo ${i + 1}`,
      message: `${step.duration} vale ${expected} movimenti ma ne dichiara ${step.beats}`,
    });
  }
}

function checkSections(issues: Issue[], piece: Piece): void {
  if (!piece.sections?.length) return;
  const n = piece.steps.length;
  let prevEnd = 0;
  piece.sections.forEach(sec => {
    if (sec.from < 0 || sec.to > n || sec.from >= sec.to) {
      issues.push({ piece: piece.id, level: 'errore', where: `sezione "${sec.name}"`, message: `intervallo non valido ${sec.from}–${sec.to} (il pezzo ha ${n} passi)` });
      return;
    }
    if (sec.from !== prevEnd) {
      issues.push({ piece: piece.id, level: 'avviso', where: `sezione "${sec.name}"`, message: `inizia al passo ${sec.from} ma la precedente finiva al ${prevEnd}` });
    }
    prevEnd = sec.to;
  });
  if (prevEnd !== n) {
    issues.push({ piece: piece.id, level: 'avviso', where: 'sezioni', message: `coprono ${prevEnd} passi su ${n}` });
  }
}

/** Un pezzo dove una mano non suona mai non è un pezzo a due mani. */
function checkTwoHands(issues: Issue[], piece: Piece): void {
  const right = piece.steps.some(st => st.treble.length > 0);
  const left = piece.steps.some(st => st.bass.length > 0);
  if (!right) issues.push({ piece: piece.id, level: 'errore', where: 'pezzo', message: 'la mano destra non suona mai' });
  if (!left) issues.push({ piece: piece.id, level: 'errore', where: 'pezzo', message: 'la mano sinistra non suona mai' });
}

export function checkPiece(piece: Piece): Issue[] {
  const issues: Issue[] = [];

  if (piece.steps.length === 0) {
    issues.push({ piece: piece.id, level: 'errore', where: 'pezzo', message: 'nessun passo' });
    return issues;
  }

  checkMeasures(issues, piece);
  checkTwoHands(issues, piece);
  checkSections(issues, piece);

  piece.steps.forEach((step, i) => {
    const where = `passo ${i + 1}`;
    checkDuration(issues, piece, step, i);
    step.treble.forEach(n => checkNote(issues, piece, where, n, 'right'));
    step.bass.forEach(n => checkNote(issues, piece, where, n, 'left'));
    checkChord(issues, piece, where, step.treble);
    checkChord(issues, piece, where, step.bass);

    // Una legatura di frase su una mano che tace non significa niente.
    (['right', 'left'] as SingleHand[]).forEach(h => {
      const marks = marksOf(step, h);
      if (marks?.leg && notesOf(step, h).length === 0) {
        issues.push({ piece: piece.id, level: 'avviso', where, message: `legato su una pausa (${h === 'right' ? 'destra' : 'sinistra'})` });
      }
      const fin = marks?.fin;
      if (Array.isArray(fin) && fin.length !== notesOf(step, h).length) {
        issues.push({ piece: piece.id, level: 'avviso', where, message: `diteggiatura con ${fin.length} cifre per ${notesOf(step, h).length} note` });
      }
    });

    // Le mani non devono scavalcarsi per sbaglio: qui non è mai voluto.
    if (step.treble.length > 0 && step.bass.length > 0) {
      const lowRight = Math.min(...step.treble.map(midiOf));
      const highLeft = Math.max(...step.bass.map(midiOf));
      if (highLeft > lowRight) {
        issues.push({
          piece: piece.id,
          level: 'avviso',
          where,
          message: `le mani si scavalcano: sinistra ${step.bass.join(' ')} sopra destra ${step.treble.join(' ')}`,
        });
      }
    }
  });

  checkTies(issues, piece, 'right');
  checkTies(issues, piece, 'left');

  // Le forcelle chiuse senza essere mai aperte sono un refuso.
  let open = false;
  piece.steps.forEach((step, i) => {
    if (step.hair === 'cresc' || step.hair === 'dim') open = true;
    else if (step.hair === 'end') {
      if (!open) issues.push({ piece: piece.id, level: 'avviso', where: `passo ${i + 1}`, message: 'forcella chiusa senza essere aperta' });
      open = false;
    }
  });

  // L'armatura dev'essere una tonalità vera.
  if (!/^[A-G](#|b)?$/.test(piece.key.tonic)) {
    issues.push({ piece: piece.id, level: 'errore', where: 'armatura', message: `tonica non valida: "${piece.key.tonic}"` });
  }

  return issues;
}

export function checkAll(pieces: Piece[]): Issue[] {
  const issues: Issue[] = [];
  const ids = new Set<string>();

  pieces.forEach(piece => {
    if (ids.has(piece.id)) {
      issues.push({ piece: piece.id, level: 'errore', where: 'pezzo', message: 'id duplicato' });
    }
    ids.add(piece.id);
    issues.push(...checkPiece(piece));
  });

  // L'ordine della lista È il percorso di studio, e viene calcolato da
  // difficoltà + livello. Quindi non ha senso controllare che sia crescente
  // (lo è per costruzione): ha senso controllare che due pezzi non si
  // contendano lo stesso posto, perché in quel caso a decidere chi viene prima
  // è il caso.
  const slots = new Map<string, string>();
  pieces.forEach(piece => {
    const slot = `${piece.difficulty} ${piece.level}`;
    const taken = slots.get(slot);
    if (taken) {
      issues.push({
        piece: piece.id,
        level: 'avviso',
        where: 'ordine',
        message: `occupa lo stesso posto di "${taken}" (${slot}): l'ordine fra i due è arbitrario`,
      });
    } else {
      slots.set(slot, piece.id);
    }
  });

  return issues;
}

/** Riepilogo leggibile, usato dallo script e dall'avviso in sviluppo. */
export function formatIssues(issues: Issue[]): string {
  if (issues.length === 0) return 'Tutti i pezzi sono in regola.';
  const byPiece = new Map<string, Issue[]>();
  issues.forEach(it => {
    const arr = byPiece.get(it.piece) ?? [];
    arr.push(it);
    byPiece.set(it.piece, arr);
  });
  const lines: string[] = [];
  byPiece.forEach((list, id) => {
    lines.push(`\n  ${id}`);
    list.forEach(it => lines.push(`    ${it.level === 'errore' ? '✗' : '·'} ${it.where}: ${it.message}`));
  });
  return lines.join('\n');
}
