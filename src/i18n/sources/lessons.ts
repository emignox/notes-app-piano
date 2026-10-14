// I testi delle lezioni (moduli, lezioni, blocchi, esercizi): i campi che
// l'utente legge. Gli identificatori (id, kind, notes, root, quality, tonic…)
// non ci sono. `rows` e `head` sono le tabelle (liste di testi), `answers` le
// scelte dei quiz.
import { modules } from '../../data/lessons';

export const LESSON_FIELDS: string[] = [
  'title',
  'summary',
  'goal',
  'prereq',
  'text',
  'caption',
  'label',
  'head',
  'rows',
  'prompt',
  'answers',
  'explain',
];

export default { fields: LESSON_FIELDS, data: [modules] };
