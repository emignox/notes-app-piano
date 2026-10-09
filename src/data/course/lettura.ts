// ─────────────────────────────────────────────────────────────────────────────
// Modulo: leggere lo spartito.
//
// La sessione di lettura allena il riconoscimento della singola nota; qui si
// spiega il resto di quello che c'è su una pagina vera: le due chiavi e il loro
// "sfasamento", le distanze, le linee aggiuntive, l'armatura, il doppio
// pentagramma e come si legge un pezzo nuovo. È il modulo che serve per aprire
// una pagina di Chopin senza perdersi.
// ─────────────────────────────────────────────────────────────────────────────

import type { Module } from '../lessons';

export const letturaModule: Module = {
  id: 'lettura',
  title: 'Leggere lo spartito',
  emoji: '👀',
  summary: 'Chiavi, distanze, linee aggiuntive, armatura, due righi insieme e prima vista: tutto quello che c\'è su una pagina oltre alla singola nota.',
  lessons: [
    {
      id: 'le-1-chiavi',
      title: 'Il pentagramma e le due chiavi',
      goal: 'Trovare il Do centrale in tutte e due le chiavi e leggere ogni nota a partire da un riferimento.',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          text: 'Il pentagramma ha cinque linee e quattro spazi, contati dal basso. Ogni posizione corrisponde a un tasto bianco: salendo di un gradino — da una linea allo spazio subito sopra — si passa al tasto bianco successivo.',
        },
        {
          kind: 'key',
          text: 'Linea, spazio, linea, spazio: un gradino sul rigo è un tasto bianco sulla tastiera. Diesis e bemolli arrivano dopo, come ritocchi.',
        },
        {
          kind: 'text',
          text: 'La chiave dice quale nota sta su UNA linea precisa; tutte le altre si ricavano da lì. La chiave di violino (o di Sol) si avvolge sulla 2ª linea: quella linea è il Sol sopra il Do centrale. La chiave di basso (o di Fa) ha due punti che abbracciano la 4ª linea: quella linea è il Fa sotto il Do centrale.',
        },
        { kind: 'staff', notes: ['G4'], caption: 'Sol — la 2ª linea, dove si avvolge la chiave di violino' },
        { kind: 'staff', notes: ['F3'], caption: 'Fa — la 4ª linea, fra i due punti della chiave di basso' },
        {
          kind: 'text',
          text: 'Il Do centrale sta esattamente fra le due chiavi. In violino è sulla prima linea aggiuntiva SOTTO il rigo, in basso sulla prima linea aggiuntiva SOPRA. È lo stesso tasto, al centro della tastiera: il ponte fra le due mani.',
        },
        { kind: 'staff', notes: ['C4', 'D4', 'E4'], caption: 'Do centrale, Re, Mi: dalla linea aggiuntiva al primo rigo' },
        {
          kind: 'table',
          head: ['Riferimento', 'Dove sta'],
          rows: [
            ['Violino · Sol', '2ª linea: la chiave ci si avvolge'],
            ['Violino · Do', '3° spazio, il centro del rigo'],
            ['Violino · Fa', '5ª linea, la più alta'],
            ['Basso · Fa', '4ª linea, fra i due punti della chiave'],
            ['Basso · Do', '2° spazio'],
            ['Basso · Sol', '1ª linea, la più bassa'],
            ['Tutte e due · Do centrale', 'la linea aggiuntiva fra i due righi'],
          ],
        },
        {
          kind: 'key',
          text: 'Non si contano le linee dal fondo: si parte dal riferimento più vicino e si conta un gradino o due. È così che leggono i pianisti, ed è ciò che la sessione di lettura allena ogni giorno.',
        },
        {
          kind: 'text',
          text: 'Le due chiavi sono sfasate. La stessa posizione, in chiave di basso, ha un nome due lettere più avanti: la 1ª linea è Mi in violino e Sol in basso, il 1° spazio è Fa in violino e La in basso. Chi ha imparato prima il violino legge il basso sbagliando di una terza — è l\'errore che la diagnosi dell\'app chiama "chiave scambiata".',
        },
        { kind: 'staff', notes: ['G2', 'A2', 'B2'], caption: 'In basso: Sol (1ª linea), La (1° spazio), Si (2ª linea)' },
      ],
      exercises: [
        { kind: 'read-note', note: 'G4', clef: 'treble' },
        { kind: 'read-note', note: 'F3', clef: 'bass' },
        { kind: 'read-note', note: 'C5', clef: 'treble' },
        { kind: 'read-note', note: 'C3', clef: 'bass' },
        { kind: 'read-note', note: 'E4', clef: 'treble' },
        { kind: 'read-note', note: 'A2', clef: 'bass' },
        { kind: 'read-note', note: 'D5', clef: 'treble' },
        { kind: 'read-note', note: 'B2', clef: 'bass' },
        {
          kind: 'quiz',
          prompt: 'In chiave di basso, che nota sta sulla 4ª linea?',
          answers: ['Fa', 'Sol', 'Re', 'La'],
          explain: 'I due punti della chiave di basso abbracciano proprio quella linea: è il Fa sotto il Do centrale.',
        },
        {
          kind: 'quiz',
          prompt: 'La 1ª linea è Mi in chiave di violino. In chiave di basso è…',
          answers: ['Sol', 'Mi', 'Do', 'Fa'],
          explain: 'In basso ogni posizione si chiama due lettere più avanti: Mi → Sol. Da qui nasce l\'errore della chiave scambiata.',
        },
      ],
    },
    {
      id: 'le-2-intervalli',
      title: 'Leggere per distanze',
      goal: 'Leggere una melodia guardando quanto sale o scende, non nota per nota.',
      prereq: 'Le due chiavi e i loro riferimenti.',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          text: 'Chi legge bene non dà un nome a ogni nota: guarda quanto la melodia SALE o SCENDE rispetto alla nota prima. È più veloce, ed è come pensano le dita: un gradino, un salto di terza, una quinta.',
        },
        {
          kind: 'key',
          text: 'Da una linea allo spazio accanto è una seconda (grado congiunto). Da una linea alla linea successiva è una terza. Le distanze dispari (terza, quinta, settima) restano linea-linea o spazio-spazio; quelle pari (seconda, quarta, sesta, ottava) passano da linea a spazio.',
        },
        { kind: 'staff', notes: ['E4', 'F4', 'G4', 'A4'], caption: 'Seconde: linea, spazio, linea, spazio — la melodia cammina' },
        { kind: 'staff', notes: ['E4', 'G4', 'B4', 'D5'], caption: 'Terze: da linea a linea, saltando uno spazio' },
        { kind: 'staff', notes: ['C4', 'G4', 'C5'], caption: 'Quinta (Do-Sol) e quarta (Sol-Do)' },
        { kind: 'staff', notes: ['C4', 'C5'], caption: 'Ottava: la stessa nota più in alto — una linea diventa uno spazio' },
        {
          kind: 'table',
          head: ['Distanza', 'Come la vedi sul rigo'],
          rows: [
            ['seconda', 'linea → spazio accanto'],
            ['terza', 'linea → linea vicina (o spazio → spazio)'],
            ['quarta', 'linea → spazio, saltando una linea e uno spazio'],
            ['quinta', 'linea → linea, saltandone una'],
            ['sesta', 'linea → spazio, più lontano'],
            ['ottava', 'linea ↔ spazio, la stessa lettera sette gradi sopra'],
          ],
        },
        { kind: 'listen', notes: ['C4', 'D4', 'E4', 'F4', 'G4'], label: 'Gradi congiunti: la melodia che cammina' },
        { kind: 'listen', notes: ['C4', 'E4', 'G4', 'C5'], label: 'Salti: l\'arpeggio che salta' },
        {
          kind: 'text',
          text: 'In Chopin la destra canta quasi sempre per gradi e piccoli salti, mentre la sinistra salta: nel valzer da un basso grave a un accordo una decima più su. Riconoscere un salto a colpo d\'occhio è ciò che permette alla mano di partire in tempo, prima ancora di sapere il nome della nota d\'arrivo.',
        },
      ],
      exercises: [
        { kind: 'read-interval', from: 'E4', to: 'F4', clef: 'treble' },
        { kind: 'read-interval', from: 'E4', to: 'G4', clef: 'treble' },
        { kind: 'read-interval', from: 'G4', to: 'D5', clef: 'treble' },
        { kind: 'read-interval', from: 'C4', to: 'C5', clef: 'treble' },
        { kind: 'read-interval', from: 'F4', to: 'B4', clef: 'treble' },
        { kind: 'read-interval', from: 'G2', to: 'B2', clef: 'bass' },
        { kind: 'read-interval', from: 'A2', to: 'F3', clef: 'bass' },
        { kind: 'read-interval', from: 'D4', to: 'C5', clef: 'treble' },
      ],
    },
    {
      id: 'le-3-aggiuntive',
      title: 'Linee aggiuntive e ottave',
      goal: 'Leggere le note sopra e sotto il rigo senza contare tutte le lineette, e capire l\'8va.',
      prereq: 'Leggere per distanze.',
      minutes: 7,
      blocks: [
        {
          kind: 'text',
          text: 'Quando una nota esce dal pentagramma si aggiungono piccole linee solo per lei: le linee aggiuntive (o tagli addizionali). Funzionano come quelle del rigo: l\'alternanza linea-spazio continua uguale.',
        },
        {
          kind: 'key',
          text: 'Riferimenti fuori dal rigo: in violino La è la 1ª linea aggiuntiva sopra e Do la 2ª; in basso Mi è la 1ª linea aggiuntiva sotto e Do la 2ª. I Do stanno a due linee aggiuntive di distanza dal rigo, sopra il violino e sotto il basso.',
        },
        { kind: 'staff', notes: ['G5', 'A5', 'B5', 'C6'], caption: 'Sopra il violino: Sol, La (1ª aggiuntiva), Si, Do (2ª aggiuntiva)' },
        { kind: 'staff', notes: ['G2', 'F2', 'E2'], caption: 'Sotto il basso: Sol (1ª linea), Fa, Mi (1ª aggiuntiva)' },
        {
          kind: 'text',
          text: 'Fra i due righi le linee aggiuntive fanno da ponte. La sinistra sale sopra il Do centrale scrivendo in chiave di basso con linee aggiuntive sopra (Re, Mi, Fa…); la destra scende sotto con linee aggiuntive sotto il violino (Si, La…). Sono le stesse note scritte in due modi: nel Notturno op. 9 n. 2 gli accordi della sinistra vivono proprio lì.',
        },
        { kind: 'staff', notes: ['C4', 'B3', 'A3'], caption: 'Sotto il violino: Do centrale, Si, La (2ª aggiuntiva)' },
        {
          kind: 'key',
          text: 'Quando una mano cambia chiave a metà pagina non è un capriccio: l\'editore lo fa per togliere linee aggiuntive. Guarda sempre la chiave all\'inizio di OGNI rigo.',
        },
        {
          kind: 'text',
          text: 'L\'ottava alta: una linea tratteggiata con "8va" sopra le note vuol dire "suonale un\'ottava sopra di come sono scritte". Evita cinque o sei linee aggiuntive. "8vb" (o "8va bassa") sotto le note vuol dire un\'ottava sotto. Chopin la usa spesso per le fioriture acute della destra.',
        },
      ],
      exercises: [
        { kind: 'read-note', note: 'A5', clef: 'treble' },
        { kind: 'read-note', note: 'C6', clef: 'treble' },
        { kind: 'read-note', note: 'E2', clef: 'bass' },
        { kind: 'read-note', note: 'B5', clef: 'treble' },
        { kind: 'read-note', note: 'C4', clef: 'treble' },
        { kind: 'read-note', note: 'F2', clef: 'bass' },
        {
          kind: 'quiz',
          prompt: 'Una nota sulla 2ª linea aggiuntiva SOPRA il rigo di violino è…',
          answers: ['Do', 'La', 'Si', 'Re'],
          explain: 'La 1ª linea aggiuntiva sopra è La, lo spazio sopra è Si, la 2ª linea è Do: un\'ottava sopra il Do del 3° spazio.',
        },
        {
          kind: 'quiz',
          prompt: '"8va" con una linea tratteggiata sopra un passaggio vuol dire…',
          answers: ['suonarlo un\'ottava più in alto di come è scritto', 'suonarlo otto volte', 'suonarlo più forte', 'suonarlo con la mano sinistra'],
          explain: 'Serve a evitare troppe linee aggiuntive. Finisce dove finisce la linea tratteggiata (spesso con la parola "loco").',
        },
      ],
    },
    {
      id: 'le-4-armatura',
      title: 'Alterazioni e armatura',
      goal: 'Riconoscere la tonalità dall\'armatura e sapere fin dove vale un\'alterazione.',
      prereq: 'Le scale maggiori (modulo Fondamenta) aiutano, ma non sono indispensabili.',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          text: '♯ (diesis) alza di un semitono, ♭ (bemolle) abbassa di un semitono, ♮ (bequadro) annulla l\'alterazione e riporta al tasto bianco. Scritta davanti a una nota, un\'alterazione vale per quella nota — nella stessa ottava — fino alla fine della battuta. La stanghetta la cancella.',
        },
        {
          kind: 'key',
          text: 'Alterazione nel testo: vale fino alla stanghetta. Alterazione in chiave (l\'armatura): vale per tutto il brano, in tutte le ottave, finché non cambia armatura.',
        },
        {
          kind: 'text',
          text: 'L\'armatura sta subito dopo la chiave, all\'inizio di ogni rigo, e dice la tonalità. Diesis e bemolli compaiono sempre nello stesso ordine: vale la pena impararlo come una filastrocca.',
        },
        {
          kind: 'table',
          head: ['Ordine', 'Note'],
          rows: [
            ['dei diesis', 'Fa · Do · Sol · Re · La · Mi · Si'],
            ['dei bemolli', 'Si · Mi · La · Re · Sol · Do · Fa (lo stesso, al contrario)'],
          ],
        },
        {
          kind: 'key',
          text: 'Trucchi per la tonalità maggiore. Con i diesis: un semitono SOPRA l\'ultimo diesis (Fa♯ → Sol maggiore; Fa♯ Do♯ → Re maggiore). Con i bemolli: è il PENULTIMO bemolle (Si♭ Mi♭ La♭ → Mi♭ maggiore). Un bemolle solo: Fa maggiore.',
        },
        {
          kind: 'text',
          text: 'Ogni armatura vale per due tonalità: una maggiore e la sua relativa minore, tre semitoni sotto. Tre bemolli sono Mi♭ maggiore — il Notturno op. 9 n. 2 — oppure Do minore — il Preludio n. 20. Si capisce quale guardando la prima e l\'ultima battuta: in minore compare quasi sempre il settimo grado alzato (in Do minore, il Si♮).',
        },
        { kind: 'circle' },
        {
          kind: 'text',
          text: 'Chopin scriveva volentieri in tonalità "nere": Mi♭ maggiore, Re♭ maggiore, Si♭ minore (cinque bemolli: la Marcia funebre), Do♯ minore (quattro diesis: la Fantaisie-Impromptu). Più tasti neri non vuol dire più difficile per la mano — i neri sono più alti e la mano ci si appoggia comoda — ma serve tenere l\'armatura sempre in mente mentre si legge.',
        },
      ],
      exercises: [
        { kind: 'key-signature', tonic: 'G' },
        { kind: 'key-signature', tonic: 'F' },
        { kind: 'key-signature', tonic: 'D' },
        { kind: 'key-signature', tonic: 'Eb' },
        {
          kind: 'quiz',
          prompt: 'Tre bemolli in chiave (Si♭, Mi♭, La♭): quale tonalità maggiore?',
          answers: ['Mi♭ maggiore', 'Si♭ maggiore', 'La♭ maggiore', 'Fa maggiore'],
          explain: 'Il penultimo bemolle è Mi♭. La relativa minore è Do minore.',
        },
        {
          kind: 'quiz',
          prompt: 'Quattro diesis in chiave: tonalità maggiore e relativa minore?',
          answers: ['Mi maggiore / Do♯ minore', 'La maggiore / Fa♯ minore', 'Si maggiore / Sol♯ minore', 'Re maggiore / Si minore'],
          explain: 'L\'ultimo diesis è Re♯: un semitono sopra c\'è Mi. Tre semitoni sotto Mi c\'è Do♯: la tonalità della Fantaisie-Impromptu.',
        },
        {
          kind: 'quiz',
          prompt: 'In una battuta trovi un Fa♯, e due note dopo un altro Fa senza segni, nella stessa ottava. Che nota suoni?',
          answers: ['Fa♯: l\'alterazione vale fino alla stanghetta', 'Fa naturale', 'Fa♭', 'dipende dalla mano'],
          explain: 'Per annullarla prima della stanghetta servirebbe un bequadro ♮.',
        },
      ],
    },
    {
      id: 'le-5-due-righi',
      title: 'Due righi, due mani',
      goal: 'Leggere il doppio pentagramma in colonne e sapere come si uniscono le mani.',
      prereq: 'Le due chiavi.',
      minutes: 7,
      blocks: [
        {
          kind: 'text',
          text: 'Il pianoforte si scrive su due righi uniti da una graffa: sopra, di solito in chiave di violino, la mano destra; sotto, in chiave di basso, la sinistra. Insieme formano un sistema, e le stanghette attraversano tutti e due i righi perché la battuta è una sola.',
        },
        {
          kind: 'key',
          text: 'Quello che è allineato in VERTICALE si suona insieme; quello che viene dopo in orizzontale, dopo. Leggere a due mani è leggere a colonne.',
        },
        { kind: 'listen', notes: ['C3', 'E4'], together: true, label: 'Due note allineate: si suonano insieme' },
        {
          kind: 'text',
          text: 'Sopra non è sempre la destra. A volte la sinistra passa sopra o la destra scende sotto: le indicazioni m.d. (mano destra) e m.s. (mano sinistra) lo dicono esplicitamente, e a volte il rigo inferiore cambia chiave e passa al violino.',
        },
        {
          kind: 'text',
          text: 'Come si studia: la destra da sola finché è fluida, la sinistra da sola, poi insieme — lentamente, più di quanto sembri necessario. Unire le mani è un\'abilità a sé: il cervello deve imparare la coordinazione, non le note.',
        },
        {
          kind: 'key',
          text: 'Mani separate, poi insieme a metà velocità. Ogni volta che unisci le mani, dimezza il tempo: è l\'unica regola che funziona sempre.',
        },
        {
          kind: 'text',
          text: 'Un trucco per leggere in colonna: guarda prima la sinistra. Le armonie cambiano più lentamente e spesso la sinistra ripete lo stesso schema per molte battute (il basso del valzer, l\'arpeggio del notturno). Riconosciuto lo schema, gli occhi sono liberi per la melodia.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Nel doppio pentagramma, due note allineate in verticale…',
          answers: ['si suonano insieme', 'si suonano una dopo l\'altra', 'sono la stessa nota', 'vanno suonate con la stessa mano'],
        },
        {
          kind: 'quiz',
          prompt: '"m.s." scritto sopra alcune note del rigo superiore vuol dire…',
          answers: ['suonale con la mano sinistra', 'mezzo staccato', 'mano sopra', 'mezzo suono'],
          explain: 'm.s. = mano sinistra, m.d. = mano destra. In inglese: L.H. e R.H.',
        },
        {
          kind: 'quiz',
          prompt: 'La prima volta che unisci le mani, il tempo…',
          answers: ['va dimezzato rispetto a quello a mani separate', 'resta uguale', 'va aumentato per prendere slancio', 'non conta'],
        },
        { kind: 'read-note', note: 'C3', clef: 'bass' },
        { kind: 'read-note', note: 'E4', clef: 'treble' },
        { kind: 'read-note', note: 'D3', clef: 'bass' },
        { kind: 'read-note', note: 'B4', clef: 'treble' },
      ],
    },
    {
      id: 'le-6-prima-vista',
      title: 'Leggere a prima vista',
      goal: 'Un metodo per suonare un pezzo nuovo senza fermarsi.',
      prereq: 'Le lezioni precedenti di questo modulo.',
      minutes: 6,
      blocks: [
        {
          kind: 'text',
          text: 'Prima vista vuol dire suonare un pezzo mai visto, a tempo, senza fermarsi. Non serve a suonarlo perfetto: serve a capirlo in fretta, e allena la lettura più di qualunque altro esercizio.',
        },
        {
          kind: 'key',
          text: 'Prima di suonare, trenta secondi di ricognizione: armatura, tempo, chiavi, il punto più difficile. Poi un tempo LENTO che riesci a mantenere fino alla fine.',
        },
        {
          kind: 'table',
          head: ['Guarda', 'Perché'],
          rows: [
            ['armatura', 'quali tasti neri ti aspettano per tutto il pezzo'],
            ['tempo (3/4, 4/4, 6/8…)', 'come contare'],
            ['prima e ultima battuta', 'di solito dicono la tonalità'],
            ['ritornelli e ripetizioni', 'cosa tornerà uguale'],
            ['il passaggio più fitto', 'il tempo giusto è quello che regge lì'],
          ],
        },
        {
          kind: 'key',
          text: 'La regola d\'oro: non fermarti e non tornare indietro. Se sbagli una nota, la prossima arriva comunque a tempo. Meglio una nota sbagliata a tempo che una giusta in ritardo.',
        },
        {
          kind: 'text',
          text: 'Leggi in avanti: mentre suoni una battuta, gli occhi sono già sulla successiva. Lo Sprint dell\'app allena proprio la velocità di riconoscimento che lo rende possibile.',
        },
        {
          kind: 'text',
          text: 'Riconosci i blocchi invece delle note: una scala che sale, un arpeggio, un accordo in posizione fondamentale, un basso albertino. Le dita conoscono già quei disegni (vedi il modulo Tecnica): leggere "arpeggio di Do" è molto più veloce che leggere quattro note.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'A prima vista sbagli una nota. Cosa fai?',
          answers: ['vado avanti a tempo', 'torno indietro e la correggo', 'mi fermo e ricomincio', 'rallento fino a ritrovarla'],
          explain: 'La continuità è l\'obiettivo: correggere si fa nello studio, non a prima vista.',
        },
        {
          kind: 'quiz',
          prompt: 'Come scegli il tempo per leggere un pezzo nuovo?',
          answers: ['quello che regge nel passaggio più difficile', 'quello scritto in testa al pezzo', 'il più veloce possibile', 'cambiandolo a ogni battuta'],
        },
        {
          kind: 'quiz',
          prompt: 'Mentre suoni una battuta, dove devono essere gli occhi?',
          answers: ['già sulla battuta successiva', 'sulle mani', 'sulla nota che stai suonando', 'sull\'inizio del rigo'],
        },
        {
          kind: 'quiz',
          prompt: 'Cosa guardi PRIMA di cominciare a leggere?',
          answers: ['armatura, tempo e chiavi', 'solo la prima nota', 'il titolo', 'niente: si comincia subito'],
        },
      ],
    },
  ],
};
