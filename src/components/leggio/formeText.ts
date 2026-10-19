// Testi, colori e posizioni delle forme del Leggio (la parte che non disegna
// niente: sta qui perché un file di componenti esporta solo componenti).

import { CHORDS, nameIn } from '../../lib/harmony';
import type { Forma, FormaKind } from '../../lib/forme';
import { t } from '../../i18n';

/** Altezza di una striscia, in px: il Leggio la toglie allo spazio dello spartito. */
export const STRIP_PX = 28;

const FAMILY_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#a855f7'];
const NEUTRAL = '#64748b';
export const formaColor = (f: Forma) => (f.family >= 0 ? FAMILY_COLORS[f.family % FAMILY_COLORS.length] : NEUTRAL);

const KIND_TEXT: Record<FormaKind, string> = {
  blocchi: 'accordo',
  arpeggio: 'arpeggio',
  alberti: 'Alberti',
  valzer: 'valzer',
  spezzato: 'accordo spezzato',
  scala: 'scala',
  ripetuta: 'nota ripetuta',
};

const isChordKind = (f: Forma) => f.kind !== 'scala' && f.kind !== 'ripetuta';

/** "Do", "Sol7", "Do♯m", "Fa/Do" (le sigle seguono la lingua e le note). */
export function chordName(f: Forma): string {
  if (!f.root || !f.quality) return '';
  return nameIn(f.root) + CHORDS[f.quality].symbol + (f.bass ? `/${nameIn(f.bass)}` : '');
}

const arrow = (f: Forma) => (f.dir === 'su' ? ' ↑' : f.dir === 'giu' ? ' ↓' : '');

/** Il testo corto della striscia. */
export function formaLabel(f: Forma, narrow: boolean): string {
  if (f.kind === 'scala') return t('scala') + arrow(f);
  if (f.kind === 'ripetuta') return `${nameIn(f.note ?? '')} ×${f.times ?? ''}`;
  // "accordo" è già nel nome (Do, Fa♯m7): si dice solo il modo, se non sono blocchi.
  if (f.kind === 'blocchi') return chordName(f);
  const kind = f.kind === 'arpeggio' ? t(KIND_TEXT.arpeggio) + arrow(f) : t(KIND_TEXT[f.kind]);
  return narrow ? chordName(f) : `${chordName(f)} · ${kind}`;
}

/** Il nome di una famiglia di forme, per la legenda: il modo, non le note. */
export function familyLabel(f: Forma): string {
  if (f.kind === 'scala') return t('scala') + arrow(f);
  if (f.kind === 'ripetuta') return t('nota ripetuta');
  const kind = f.kind === 'arpeggio' ? t(KIND_TEXT.arpeggio) + arrow(f) : t(KIND_TEXT[f.kind]);
  // Il gesto (Alberti, valzer, arpeggio) vale su qualunque accordo: si dice solo quello.
  if (f.kind === 'alberti' || f.kind === 'valzer' || f.kind === 'arpeggio') return kind;
  const inv = f.inversion === 1 ? t('1° rivolto') : f.inversion === 2 ? t('2° rivolto') : f.inversion === 3 ? t('3° rivolto') : '';
  return `${kind} · ${f.quality ? t(f.quality) : ''}${inv ? ` · ${inv}` : ''}`;
}

/** Il titolo della scheda: cos'è, con le sue note. */
export function formaTitle(f: Forma): string {
  if (isChordKind(f)) return `${chordName(f)} · ${f.quality ? t(f.quality) : ''}`;
  if (f.kind === 'scala') return f.chromatic ? t('Scala cromatica') + arrow(f) : t('Scala') + arrow(f);
  return t('Nota ripetuta: {note}', { note: nameIn(f.note ?? '') });
}

/** Le frasi della scheda: come si legge e perché conta. */
export function formaText(f: Forma): string[] {
  const out: string[] = [];
  const tones = (f.tones ?? []).map(n => nameIn(n)).join('–');
  switch (f.kind) {
    case 'blocchi':
      out.push(t("Le note dell'accordo suonate insieme: {tones}.", { tones }));
      break;
    case 'arpeggio':
      out.push(f.dir === 'giu'
        ? t("Le note dell'accordo ({tones}) una dopo l'altra, in discesa.", { tones })
        : t("Le note dell'accordo ({tones}) una dopo l'altra, in salita.", { tones }));
      break;
    case 'alberti':
      out.push(t("Basso alla Alberti: basso, nota alta, nota di mezzo, nota alta. È un solo accordo ({tones}) suonato sempre nello stesso modo: impara il giro una volta e lo ritrovi ovunque.", { tones }));
      break;
    case 'valzer':
      out.push(t("Un basso e poi l'accordo due volte: l'uno-due-tre del valzer. Le note sono sempre quelle dell'accordo ({tones}).", { tones }));
      break;
    case 'spezzato':
      out.push(t("Le note dell'accordo ({tones}) in ordine misto, o con una melodia sopra.", { tones }));
      break;
    case 'scala':
      out.push(f.chromatic
        ? t("Ogni nota a un semitono dalla precedente. Non leggerle una per una: guarda dove parte e dove arriva.")
        : t("Note vicine, una dopo l'altra, sempre nella stessa direzione. Non leggerle una per una: guarda dove parte e dove arriva."));
      break;
    case 'ripetuta':
      out.push(t("La stessa nota ripetuta {times} volte: tieni il polso morbido e guarda solo quando cambia.", { times: f.times ?? 0 }));
      break;
  }
  if (isChordKind(f) && f.bass) out.push(t("È un rivolto: la nota più grave è {bass}, non la fondamentale.", { bass: nameIn(f.bass) }));
  if (f.count > 1) out.push(t("Questa forma compare {n} volte nel brano.", { n: f.count }));
  return out;
}

interface BoxStep {
  notes: { staff: number; head: SVGGElement | null; svg: SVGGElement | null }[];
}

/** Dove stanno le forme sul rigo (px, rispetto a `origin`). */
export function formeBoxes(shapes: Forma[], steps: BoxStep[], origin: DOMRect): Map<number, { x: number; w: number }> {
  const out = new Map<number, { x: number; w: number }>();
  for (const f of shapes) {
    let left = Infinity;
    let right = -Infinity;
    for (const si of [f.from, f.to]) {
      for (const n of steps[si]?.notes ?? []) {
        if (n.staff !== f.staff) continue;
        const el = n.head ?? n.svg;
        if (!el) continue;
        const r = el.getBoundingClientRect();
        left = Math.min(left, r.left - origin.left);
        right = Math.max(right, r.right - origin.left);
      }
    }
    if (left < right) out.set(f.id, { x: left - 3, w: right - left + 6 });
  }
  return out;
}
