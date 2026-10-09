// ─────────────────────────────────────────────────────────────────────────────
// La libreria dei brani: tutto quello che si apre nel Leggio.
//
// Due provenienze, un solo lettore:
//  · i pezzi scritti per l'app (passi a due mani, con sezioni, diteggiatura e
//    studio guidato): diventano MusicXML al volo;
//  · partiture complete in MusicXML (public/scores): i capolavori interi, da
//    ascoltare, seguire e studiare a pezzi nel Leggio.
//
// Le partiture complete scaricate dal dataset ASAP sono distribuite con
// licenza CC BY-NC-SA 4.0: l'attribuzione compare nel Leggio.
// ─────────────────────────────────────────────────────────────────────────────

import type { Piece } from '../types';
import { pieces } from './pieces';

export type Level = 1 | 2 | 3 | 4 | 5;

export interface LibraryEntry {
  id: string;
  title: string;
  /** Sottotitolo: opera, movimento. */
  subtitle?: string;
  composer: string;
  level: Level;
  /** Tempo vero, in semiminime al minuto. */
  bpm: number;
  /** Da che frazione del tempo vero conviene partire a studiarlo. */
  startRate: number;
  about: string;
  focus?: string[];
  /** Pezzo dell'app (ha anche lo studio guidato) oppure partitura completa. */
  source: { kind: 'piece'; piece: Piece } | { kind: 'xml'; url: string };
  credit?: string;
}

const ASAP = 'Partitura: ASAP dataset (Foscarin et al.), CC BY-NC-SA 4.0';

/** Colore della copertina: ogni compositore ha il suo. */
export const COMPOSER_STYLE: Record<string, { from: string; to: string; emoji: string; short: string }> = {
  'J. S. Bach': { from: '#92400e', to: '#d97706', emoji: '🎻', short: 'Bach' },
  'W. A. Mozart': { from: '#0f766e', to: '#14b8a6', emoji: '🎭', short: 'Mozart' },
  'L. van Beethoven': { from: '#991b1b', to: '#ef4444', emoji: '🔥', short: 'Beethoven' },
  'F. Schubert': { from: '#166534', to: '#22c55e', emoji: '🌿', short: 'Schubert' },
  'R. Schumann': { from: '#a16207', to: '#eab308', emoji: '🌙', short: 'Schumann' },
  'F. Chopin': { from: '#3730a3', to: '#818cf8', emoji: '🎹', short: 'Chopin' },
  'J. Brahms': { from: '#334155', to: '#64748b', emoji: '🌾', short: 'Brahms' },
  Tradizionale: { from: '#be185d', to: '#f472b6', emoji: '🎶', short: 'Tradizionale' },
  Esercizio: { from: '#0369a1', to: '#38bdf8', emoji: '🌱', short: 'Esercizio' },
};

export function composerStyle(composer: string) {
  return COMPOSER_STYLE[composer] ?? { from: '#475569', to: '#94a3b8', emoji: '🎼', short: composer };
}

/** I nomi dei compositori dei pezzi dell'app, uniformati a quelli della libreria. */
function normalizeComposer(c: string): string {
  if (/bach/i.test(c)) return 'J. S. Bach';
  if (/mozart/i.test(c)) return 'W. A. Mozart';
  if (/beethoven/i.test(c)) return 'L. van Beethoven';
  if (/chopin/i.test(c)) return 'F. Chopin';
  if (/brahms/i.test(c)) return 'J. Brahms';
  if (/tradiz/i.test(c)) return 'Tradizionale';
  if (/esercizio/i.test(c)) return 'Esercizio';
  return c;
}

const PIECE_LEVEL = (p: Piece): Level => (p.difficulty === 'facile' ? (p.level <= 3 ? 1 : 2) : p.difficulty === 'medio' ? 3 : 4);

const fromPieces: LibraryEntry[] = pieces.map(p => ({
  id: p.id,
  title: p.title,
  composer: normalizeComposer(p.composer),
  level: PIECE_LEVEL(p),
  bpm: p.bpm,
  startRate: p.difficulty === 'facile' ? 0.85 : 0.65,
  about: p.about ?? p.hint,
  focus: p.focus,
  source: { kind: 'piece', piece: p },
}));

const xml = (file: string) => ({ kind: 'xml' as const, url: `/scores/${file}.musicxml` });

const complete: LibraryEntry[] = [
  {
    id: 'bach-bwv846-preludio',
    title: 'Preludio in Do maggiore',
    subtitle: 'Il clavicembalo ben temperato I, BWV 846',
    composer: 'J. S. Bach',
    level: 3,
    bpm: 66,
    startRate: 0.6,
    about: 'Trentacinque battute, un solo disegno: ogni accordo sgranato in arpeggio, due volte. È il brano perfetto per imparare a leggere le armonie a blocchi e a tenere un suono uguale.',
    focus: ['leggere l\'accordo della battuta prima delle note', 'sedicesimi tutti uguali, senza accenti', 'la nota del basso tenuta con la mano sinistra'],
    source: xml('bach-bwv846-preludio'),
    credit: ASAP,
  },
  {
    id: 'beethoven-patetica-adagio',
    title: 'Sonata "Patetica" — Adagio cantabile',
    subtitle: 'Sonata op. 13, II movimento',
    composer: 'L. van Beethoven',
    level: 3,
    bpm: 32,
    startRate: 0.8,
    about: 'Una delle melodie più belle di Beethoven, cantata dal mignolo della destra sopra un accompagnamento sommesso nella stessa mano. Lezione di "dare voce".',
    focus: ['la melodia in alto più forte delle note interne', 'il legato del canto con il pedale', 'ascoltare la sinistra senza coprire'],
    source: xml('beethoven-patetica-adagio'),
    credit: ASAP,
  },
  {
    id: 'schubert-momento-musicale-3',
    title: 'Momento musicale n. 3',
    subtitle: 'op. 94 (D 780), in fa minore',
    composer: 'F. Schubert',
    level: 3,
    bpm: 96,
    startRate: 0.6,
    about: 'Una danza "all\'ungherese" breve e precisa: la sinistra salta come un passo di danza, la destra ripete un motivo che si colora a ogni ripetizione.',
    focus: ['la sinistra staccata e regolare', 'gli accenti della danza', 'le sfumature nelle ripetizioni'],
    source: xml('schubert-momento-musicale-3'),
    credit: ASAP,
  },
  {
    id: 'mozart-k331-rondo-alla-turca',
    title: 'Rondò alla turca',
    subtitle: 'Sonata K. 331, III movimento',
    composer: 'W. A. Mozart',
    level: 4,
    bpm: 120,
    startRate: 0.5,
    about: 'Il pezzo di Mozart che tutti conoscono: sedicesimi brillanti, ottave e accordi spezzati che imitano la banda dei giannizzeri.',
    focus: ['gruppi di quattro sedicesimi leggeri', 'gli accordi arpeggiati della banda', 'tempo stabile: è un rondò, il tema torna sempre uguale'],
    source: xml('mozart-k331-rondo-alla-turca'),
    credit: ASAP,
  },
  {
    id: 'schubert-improvviso-op90-3',
    title: 'Improvviso n. 3 in sol bemolle',
    subtitle: 'op. 90 (D 899)',
    composer: 'F. Schubert',
    level: 4,
    bpm: 110,
    startRate: 0.55,
    about: 'Una melodia lunghissima sopra un mormorio continuo di terzine: tutto nella stessa mano destra. Sei bemolli in chiave, e il suono più morbido che esista.',
    focus: ['melodia col 4 e 5, terzine leggere con le altre dita', 'sei bemolli: leggere l\'armatura', 'il pedale che cambia con il basso'],
    source: xml('schubert-improvviso-op90-3'),
    credit: ASAP,
  },
  {
    id: 'chopin-op10-3-tristesse',
    title: 'Studio op. 10 n. 3 "Tristesse"',
    subtitle: 'in mi maggiore',
    composer: 'F. Chopin',
    level: 4,
    bpm: 50,
    startRate: 0.7,
    about: 'Chopin diceva di non aver mai scritto una melodia più bella. Il canto sta sopra un accompagnamento nella stessa mano: è uno studio di suono, non di velocità (la parte centrale sì, è difficile).',
    focus: ['il canto legato con le dita più deboli', 'accompagnamento interno pianissimo', 'il rubato del tema'],
    source: xml('chopin-op10-3-tristesse'),
    credit: ASAP,
  },
  {
    id: 'chopin-marcia-funebre-completa',
    title: 'Marcia funebre (completa)',
    subtitle: 'Sonata op. 35, III movimento',
    composer: 'F. Chopin',
    level: 4,
    bpm: 55,
    startRate: 0.8,
    about: 'La versione integrale della marcia che nell\'app trovi anche semplificata: marcia, Trio in re bemolle, ripresa. Quando la versione di studio è sicura, si passa a questa.',
    focus: ['il peso degli accordi della sinistra', 'il puntato mai affrettato', 'il Trio cantabile'],
    source: xml('chopin-marcia-funebre-completa'),
    credit: ASAP,
  },
  {
    id: 'schumann-arabeske',
    title: 'Arabeske',
    subtitle: 'op. 18, in do maggiore',
    composer: 'R. Schumann',
    level: 4,
    bpm: 126,
    startRate: 0.5,
    about: 'Un ricamo leggero e affettuoso ("Leicht und zart"): la melodia si nasconde dentro gli arpeggi e va fatta emergere. Due episodi minori e una coda sognante.',
    focus: ['leggerezza degli arpeggi', 'la melodia nascosta', 'i cambi di carattere fra le sezioni'],
    source: xml('schumann-arabeske'),
    credit: ASAP,
  },
  {
    id: 'chopin-op10-12-original',
    title: 'Studio op. 10 n. 12 "Rivoluzionario"',
    subtitle: 'in do minore',
    composer: 'F. Chopin',
    level: 5,
    bpm: 160,
    startRate: 0.35,
    about: 'La sinistra in tempesta sotto gli accordi della destra. Da ascoltare e seguire, e da studiare a una mano, lentissimo, battuta per battuta.',
    source: xml('chopin-op10-12'),
  },
  {
    id: 'chopin-op10-4-original',
    title: 'Studio op. 10 n. 4 "Torrent"',
    subtitle: 'in do diesis minore',
    composer: 'F. Chopin',
    level: 5,
    bpm: 176,
    startRate: 0.35,
    about: 'Un moto perpetuo di sedicesimi che passa da una mano all\'altra. Lo si studia a gruppi di quattro note, a tempo dimezzato.',
    source: xml('chopin-op10-4'),
  },
  {
    id: 'chopin-op66-original',
    title: 'Fantaisie-Impromptu',
    subtitle: 'op. 66, in do diesis minore',
    composer: 'F. Chopin',
    level: 5,
    bpm: 168,
    startRate: 0.35,
    about: 'Arpeggi della sinistra contro sedicesimi della destra (quattro contro tre), poi un episodio cantabile famosissimo. Da seguire a tempo lento, mano per mano.',
    source: xml('chopin-op66'),
  },
];

/** Tutta la libreria, dal più facile al più difficile. */
export const library: LibraryEntry[] = [...fromPieces, ...complete].sort((a, b) => a.level - b.level);

/** Il brano del giorno: cambia ogni giorno, fra le partiture complete non virtuosistiche. */
export function featuredToday(): LibraryEntry {
  const pool = library.filter(e => e.source.kind === 'xml' && e.level <= 4);
  const day = Math.floor(Date.now() / 86_400_000);
  return pool[day % pool.length] ?? library[0];
}

export function libraryEntry(id: string): LibraryEntry | undefined {
  return library.find(e => e.id === id);
}

export const LEVEL_LABEL: Record<Level, string> = {
  1: 'Primi passi',
  2: 'Facile',
  3: 'Intermedio',
  4: 'Avanzato',
  5: 'Virtuoso',
};
