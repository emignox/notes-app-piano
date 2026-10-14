// Testi dell'interfaccia che stanno in costanti (non in t('…') letterali): il
// controllo `npm run check:i18n` pretende la voce in inglese e in francese.
import { MNEMONICS, stages } from '../../data/curriculum';
import { IMAGE_CREDITS } from '../../data/images';
import { KIND_ADVICE, KIND_LABEL } from '../../lib/diagnosis';
import { INTERVAL_NAMES, KEY_HINTS, LANDMARKS, STEP_WORDS } from '../../lib/notes';
import { TIER_LABELS } from '../../lib/srs';

const REFS = [...new Set(LANDMARKS.map(l => l.short))];

export default {
  fields: ['txt'],
  data: [
    // Frasi costruite da landmarkHint() con t(variabile).
    { txt: LANDMARKS.map(l => l.label) },
    { txt: REFS.flatMap(ref => ['sopra', 'sotto'].map(dir => `${dir} il ${ref}`)) },
    { txt: STEP_WORDS.filter(w => w !== '') },
    { txt: INTERVAL_NAMES },
    { txt: Object.values(KEY_HINTS) },
    // Trucchi mnemonici e nomi dei gruppi di note.
    { txt: Object.values(MNEMONICS) },
    { txt: stages.map(s => s.title) },
    // Diagnosi degli errori e livelli di padronanza.
    { txt: Object.values(KIND_LABEL) },
    { txt: Object.values(KIND_ADVICE) },
    { txt: [...TIER_LABELS] },
    // Titoli dei gruppi del test di piazzamento (PlacementTest).
    { txt: ['Chiave di violino', 'Chiave di basso', 'Diesis e bemolle'] },
    // Crediti delle immagini (Opzioni).
    { txt: IMAGE_CREDITS.flatMap(c => [c.what, c.author, c.license]) },
  ],
};
