// I testi dell'area Studio che non stanno in `t('…')` letterali: il glossario,
// le voci scritte a mano di scale/arpeggi/accordi, le spiegazioni di armonia e
// ritmo, i livelli dell'orecchio… Sono costanti e dati in italiano: chi li
// mostra li traduce con t() (o localize), qui si dichiarano perché il controllo
// pretenda la voce nei dizionari en e fr.
import { glossario } from '../../data/glossario';
import {
  ARP_FILTERS,
  CHORD_FILTERS,
  SCALE_FILTERS,
  arpeggioExercises,
  chordExercises,
  scaleExercises,
} from '../../data/technique';
import { BASS_DEGREE, CHORDS, MODES, OTHER_EXPLAIN, PATTERN_EXPLAIN, SCALE_EXPLAIN } from '../../lib/harmony';
import { PROGRESSIONS, ROLES_MAJOR, ROLES_MINOR } from '../../lib/keys';
import { FRACTION, METERS, VALUES } from '../../lib/rhythm';
import { DURATION_NAMES, RHYTHM_LEVELS } from '../../lib/rhythmReading';
import {
  CHORD_TIP,
  EAR_DRILLS,
  GENERIC_INTERVALS,
  INTERVAL_LABEL,
  INTERVAL_NAMES,
  INTERVAL_SONG,
  SCALE_TIP,
} from '../../lib/earTraining';

export const STUDIO_FIELDS: string[] = [
  'word', 'aka', 'short', 'long', // glossario
  'note', 'usage', 'title', // voci di tecnica scritte a mano, livelli, brani
  'explain', 'color', 'role', // armonia
  'name', 'drawing', 'restDrawing', 'counting', 'accents', 'feel', 'where', 'why', 'focus', 'levels', // ritmo, orecchio, progressioni
  'label', // etichette e parole sciolte
];

/** I nomi che passano da t(variabile): tipi di accordo e di scala, modi, versi, livelli, filtri. */
const WORDS: string[] = [
  ...Object.keys(CHORDS),
  ...Object.keys(SCALE_EXPLAIN),
  ...Object.keys(PATTERN_EXPLAIN),
  ...Object.keys(OTHER_EXPLAIN),
  ...MODES.map(m => m.name),
  ...BASS_DEGREE,
  ...Object.values(FRACTION),
  ...Object.values(DURATION_NAMES),
  ...Object.values(INTERVAL_LABEL),
  ...Object.values(INTERVAL_SONG),
  ...Object.values(CHORD_TIP).filter((x): x is string => !!x),
  ...Object.values(SCALE_TIP),
  ...Object.values(INTERVAL_NAMES),
  ...GENERIC_INTERVALS,
  ...ROLES_MAJOR,
  ...ROLES_MINOR,
  ...SCALE_FILTERS.map(f => f.label),
  ...ARP_FILTERS.map(f => f.label),
  ...CHORD_FILTERS.map(f => f.label),
  'base',
  'intermedio',
  'avanzato',
];

export default {
  fields: STUDIO_FIELDS,
  data: [
    glossario,
    { note: scaleExercises.map(e => e.note) },
    { note: arpeggioExercises.map(e => e.note), title: arpeggioExercises.filter(e => e.quality !== 'maggiore' && e.quality !== 'minore').map(e => e.title) },
    { usage: chordExercises.map(e => e.usage) },
    { explain: [...Object.values(SCALE_EXPLAIN), ...Object.values(PATTERN_EXPLAIN), ...Object.values(OTHER_EXPLAIN), ...Object.values(CHORDS).map(c => c.explain)] },
    { color: MODES.map(m => m.color) },
    VALUES.map(v => ({ name: v.name, drawing: v.drawing, restDrawing: v.restDrawing, counting: v.counting })),
    METERS.map(m => ({ accents: m.accents, feel: m.feel, where: m.where })),
    PROGRESSIONS.map(p => ({ name: p.name, why: p.why, where: p.where })),
    RHYTHM_LEVELS.map(l => ({ title: l.title, focus: l.focus })),
    EAR_DRILLS.map(d => ({ title: d.title, why: d.why, levels: d.levels })),
    { label: WORDS },
  ],
};
