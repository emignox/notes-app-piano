// I testi dei dati dell'area "Canzoni" che il controllo deve verificare:
// brani dell'app, libreria, melodie, nomi dei compositori e le etichette
// che stanno in costanti (livelli, dinamiche, articolazioni, sezioni…).
import { pieces } from '../../data/pieces';
import { COMPOSER_STYLE, LEVEL_LABEL, library } from '../../data/library';
import { melodies } from '../../data/melodies';
import { ARTICULATION_LABEL, DYNAMIC_LABEL } from '../../lib/score';

/** Testi che nel codice stanno in costanti e si traducono dove si mostrano. */
const labels = {
  label: [
    ...Object.values(LEVEL_LABEL),
    ...Object.values(DYNAMIC_LABEL),
    ...Object.values(ARTICULATION_LABEL),
    // difficoltà delle melodie (MelodyView)
    'facile{ctx}',
    'medio{ctx}',
    'difficile{ctx}',
    // mani e sezioni di PieceView
    'Destra',
    'Sinistra',
    'Tutto',
    'Il pezzo dall\'inizio alla fine, di seguito.',
    // viste del Leggio
    'Spartito',
    'Tutti e due',
    'Cascata',
  ],
};

export default {
  fields: ['title', 'subtitle', 'composer', 'about', 'focus', 'tempoText', 'name', 'note', 'text', 'credit', 'short', 'label'],
  data: [pieces, library, melodies, COMPOSER_STYLE, labels],
};
