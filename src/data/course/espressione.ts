// ─────────────────────────────────────────────────────────────────────────────
// Modulo: espressione e segni.
//
// Le note dicono COSA suonare; tutto il resto della pagina dice COME. In
// Chopin il "come" è quasi tutto: un notturno suonato a note giuste ma senza
// pedale, senza piano e senza rubato non è un notturno. Gli esempi si
// ascoltano con forza e durata del tasto vere (`vel`, `holds`), perché la
// differenza fra staccato e legato si capisce sentendola.
// ─────────────────────────────────────────────────────────────────────────────

import type { Module } from '../lessons';

const PHRASE = ['E4', 'F4', 'G4', 'C5', 'B4', 'A4', 'G4'];

export const espressioneModule: Module = {
  id: 'espressione',
  title: 'Espressione e segni',
  emoji: '🎭',
  summary: 'Dinamiche, articolazione, pedale, tempo, ritornelli e abbellimenti: tutto quello che sta sulla pagina oltre alle note, e che fa la musica.',
  lessons: [
    {
      id: 'es-1-dinamiche',
      title: 'Dinamiche: dal pianissimo al fortissimo',
      goal: 'Leggere e suonare pp, p, mf, f e le forcelle, e sapere che sono relative.',
      minutes: 7,
      blocks: [
        {
          kind: 'text',
          text: 'Le dinamiche dicono quanto forte suonare. Si scrivono con abbreviazioni italiane — in tutto il mondo — sotto il rigo della destra o fra i due righi.',
        },
        {
          kind: 'table',
          head: ['Segno', 'Significato'],
          rows: [
            ['pp', 'pianissimo'],
            ['p', 'piano'],
            ['mp', 'mezzopiano'],
            ['mf', 'mezzoforte'],
            ['f', 'forte'],
            ['ff', 'fortissimo'],
            ['sf / sfz', 'sforzato: un accento improvviso su una nota sola'],
            ['fp', 'forte e subito piano'],
          ],
        },
        { kind: 'listen', notes: PHRASE, label: 'La stessa frase, piano', vel: PHRASE.map(() => 0.28), secs: PHRASE.map(() => 0.45) },
        { kind: 'listen', notes: PHRASE, label: '…e forte', vel: PHRASE.map(() => 0.95), secs: PHRASE.map(() => 0.45) },
        {
          kind: 'text',
          text: 'Le forcelle sono dinamiche che si muovono: quella che si apre (<) è un crescendo, quella che si chiude (>) un diminuendo. Si scrivono anche a parole: cresc. e dim. (o decresc.).',
        },
        {
          kind: 'listen',
          notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          label: 'Crescendo: la forcella che si apre',
          vel: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85, 1],
          secs: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.8],
        },
        {
          kind: 'key',
          text: 'Le dinamiche sono RELATIVE: il forte di un notturno non è il forte di una marcia. Contano le differenze — una frase che cresce, un piano subito dopo un forte — più del volume assoluto.',
        },
        {
          kind: 'text',
          text: 'Sul pianoforte il volume nasce solo dalla velocità con cui il tasto scende: non c\'è altro modo. Per il piano si scende vicino al tasto, con poco peso; per il forte il peso viene dal braccio, non dalle dita rigide. In Chopin il p è il colore di base e il ff non è mai duro: "cantare" vuol dire suonare la melodia appena più forte dell\'accompagnamento.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'mf vuol dire…',
          answers: ['mezzoforte', 'molto forte', 'meno forte', 'mano forte'],
        },
        {
          kind: 'quiz',
          prompt: 'Quale di questi è il più piano?',
          answers: ['pp', 'p', 'mp', 'mf'],
        },
        {
          kind: 'quiz',
          prompt: 'Una forcella che si apre (<) indica…',
          answers: ['crescendo', 'diminuendo', 'un accento', 'un ritardando'],
          explain: 'La forcella si allarga come il suono: dal piano verso il forte.',
        },
        {
          kind: 'quiz',
          prompt: 'Da cosa dipende, sul pianoforte, quanto forte suona una nota?',
          answers: ['dalla velocità con cui scende il tasto', 'da quanto a lungo lo tieni premuto', 'da quanto premi dopo che ha suonato', 'dal pedale'],
          explain: 'Dopo l\'attacco il martelletto si è già staccato dalla corda: premere di più non cambia niente, se non la tensione della mano.',
        },
        {
          kind: 'quiz',
          prompt: '"fp" sotto una nota vuol dire…',
          answers: ['attacco forte e subito piano', 'forte e poi pausa', 'fortissimo con pedale', 'fino al piano'],
        },
      ],
    },
    {
      id: 'es-2-articolazione',
      title: 'Articolazione: legato, staccato, accenti',
      goal: 'Riconoscere i segni di attacco e saperli suonare: legato, staccato, tenuto, accento.',
      prereq: 'Le dinamiche.',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          text: 'L\'articolazione dice come si attacca e come si lascia ogni nota. È la differenza fra parlare scandendo le sillabe e parlare a voce distesa.',
        },
        {
          kind: 'table',
          head: ['Segno', 'Come si suona'],
          rows: [
            ['arco sopra/sotto le note (legatura di frase)', 'legato: ogni nota si lega alla successiva, senza buchi'],
            ['punto sopra/sotto', 'staccato: nota breve, staccata dalla successiva'],
            ['cuneo ▾', 'staccatissimo: ancora più breve e secco'],
            ['trattino –', 'tenuto: tutta la durata, con un po\' di peso'],
            ['> (accento)', 'quella nota più forte delle vicine'],
            ['^ (marcato)', 'accento ancora più deciso'],
          ],
        },
        {
          kind: 'listen',
          notes: PHRASE,
          label: 'Legato: le note si toccano',
          secs: PHRASE.map(() => 0.42),
          holds: PHRASE.map(() => 0.48),
          vel: PHRASE.map(() => 0.6),
        },
        {
          kind: 'listen',
          notes: PHRASE,
          label: 'Staccato: le note si staccano',
          secs: PHRASE.map(() => 0.42),
          holds: PHRASE.map(() => 0.1),
          vel: PHRASE.map(() => 0.6),
        },
        {
          kind: 'key',
          text: 'Il legato sul pianoforte si fa con le dita: il dito che lascia il tasto lo lascia nell\'istante esatto in cui il successivo abbassa il suo. Né prima (buco), né molto dopo (le note si impastano).',
        },
        {
          kind: 'text',
          text: 'Attenzione a due archi che si somigliano. La legatura di FRASE abbraccia note diverse: dice "legato" e disegna il respiro della frase. La legatura di VALORE unisce due note uguali: la seconda NON si ribatte, il suono continua. Nei pezzi a due mani l\'app non ti chiede la nota legata di valore, proprio per questo.',
        },
        {
          kind: 'listen',
          notes: ['C5', 'G4', 'A4', 'E4'],
          label: 'Accenti sulla prima di ogni coppia',
          vel: [0.95, 0.45, 0.95, 0.45],
          secs: [0.45, 0.45, 0.45, 0.6],
        },
        {
          kind: 'text',
          text: 'In Chopin il legato è la regola, e le frasi sono lunghe: l\'arco può durare quattro o otto battute. Alla fine di un arco si "respira": l\'ultima nota si alleggerisce e si stacca appena, come un cantante che prende fiato.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Un punto sopra una nota indica…',
          answers: ['staccato', 'legato', 'accento', 'nota puntata'],
          explain: 'Attenzione: il punto SOPRA o SOTTO la testa è staccato; il punto ACCANTO, a destra, allunga la durata della metà.',
        },
        {
          kind: 'quiz',
          prompt: 'Due note uguali unite da un arco: cosa fai con la seconda?',
          answers: ['non la ribatto: il suono continua', 'la ribatto più piano', 'la ribatto staccata', 'la salto'],
          explain: 'È una legatura di valore: somma le durate. Se le note fossero diverse sarebbe una legatura di frase.',
        },
        {
          kind: 'quiz',
          prompt: 'Come si suona legato sul pianoforte?',
          answers: ['un dito lascia il tasto mentre il successivo abbassa il suo', 'con il pedale sempre giù', 'premendo più forte', 'tenendo giù tutte le note'],
        },
        {
          kind: 'quiz',
          prompt: 'Il trattino (–) sopra una nota vuol dire…',
          answers: ['tenuto: tutta la durata, con un po\' di peso', 'staccato', 'silenzio', 'ripetila'],
        },
      ],
    },
    {
      id: 'es-3-pedale',
      title: 'Il pedale di risonanza',
      goal: 'Capire cosa fa il pedale e come si cambia con l\'armonia (pedale sincopato).',
      prereq: 'Legato e staccato.',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          text: 'Il pedale di destra (di risonanza, o "forte") alza tutti gli smorzatori: le corde suonano finché il pedale resta giù, anche dopo aver lasciato i tasti, e risuonano insieme alle altre. È il "respiro" del pianoforte romantico.',
        },
        {
          kind: 'text',
          text: 'Si scrive "Ped." dove si abbassa e un asterisco (✳) dove si alza; nelle edizioni moderne anche con una linea orizzontale sotto il rigo, con una tacca dove si cambia.',
        },
        {
          kind: 'listen',
          notes: ['C3', 'G3', 'E4', 'F3', 'C4', 'A4'],
          label: 'Senza cambiare il pedale: Do e Fa si impastano',
          secs: [0.35, 0.35, 0.9, 0.35, 0.35, 1.2],
          holds: [2.4, 2.1, 1.8, 1.4, 1.1, 1.2],
          vel: [0.6, 0.5, 0.6, 0.6, 0.5, 0.6],
        },
        {
          kind: 'listen',
          notes: ['C3', 'G3', 'E4', 'F3', 'C4', 'A4'],
          label: 'Cambiandolo col basso nuovo: l\'armonia resta pulita',
          secs: [0.35, 0.35, 0.9, 0.35, 0.35, 1.2],
          holds: [1.6, 1.25, 0.9, 1.9, 1.55, 1.2],
          vel: [0.6, 0.5, 0.6, 0.6, 0.5, 0.6],
        },
        {
          kind: 'key',
          text: 'Pedale sincopato (o "legato"): il pedale si alza NELL\'ISTANTE in cui suoni l\'accordo nuovo e si riabbassa subito DOPO. Prima la mano, poi il piede: così l\'armonia vecchia sparisce e la nuova resta legata, senza buchi.',
        },
        {
          kind: 'text',
          text: 'Si impara a vuoto, lentamente: suona un Do, abbassa il pedale; suona un Fa e nello stesso istante alza il pedale, poi riabbassalo. Ascolta: il Do deve sparire, il Fa deve restare. È un movimento "a molla" del piede, con il tallone fermo a terra.',
        },
        {
          kind: 'key',
          text: 'La regola d\'oro: cambia il pedale quando cambia l\'armonia, e decidi con l\'orecchio, non con il piede. Se il suono si impasta, il pedale va cambiato.',
        },
        {
          kind: 'text',
          text: 'In Chopin il pedale è quasi sempre presente: nel valzer si abbassa sul basso e si cambia a ogni battuta, nel notturno tiene vivi gli arpeggi larghi della sinistra. Ma Chopin lo segnava con precisione, e le pause senza pedale contano quanto quelle col pedale.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Cosa fa il pedale di destra?',
          answers: ['alza gli smorzatori: le corde continuano a suonare', 'rende il suono più forte', 'rende il suono più piano', 'allunga i tasti'],
          explain: 'Per questo si chiama anche "forte" in modo improprio: non aumenta il volume, aumenta la risonanza.',
        },
        {
          kind: 'quiz',
          prompt: 'Nel pedale sincopato, quando si rialza il pedale?',
          answers: ['nell\'istante in cui suoni l\'accordo nuovo', 'prima di suonare l\'accordo nuovo', 'a metà della battuta', 'mai'],
          explain: 'Prima la mano, poi il piede: il pedale si riabbassa subito dopo, ed è l\'accordo nuovo a restare legato.',
        },
        {
          kind: 'quiz',
          prompt: 'Quando va cambiato il pedale?',
          answers: ['quando cambia l\'armonia', 'a ogni nota', 'a ogni battuta, sempre', 'solo alla fine del pezzo'],
        },
        {
          kind: 'quiz',
          prompt: 'Sotto il basso di un valzer trovi "Ped." e alla fine della battuta "✳". Vuol dire…',
          answers: ['abbassa il pedale col basso, alzalo alla fine della battuta', 'suona più forte il basso', 'ripeti la battuta', 'suona il basso staccato'],
        },
      ],
    },
    {
      id: 'es-4-tempo',
      title: 'Tempo, carattere e rubato',
      goal: 'Leggere le indicazioni di andamento e di carattere, e capire il rubato di Chopin.',
      prereq: 'Le dinamiche.',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          text: 'In testa al pezzo c\'è l\'andamento: quanto veloce va la musica. Sono parole italiane, e prima di indicare una velocità indicano un carattere: "Allegro" vuol dire allegro.',
        },
        {
          kind: 'table',
          head: ['Indicazione', 'Più o meno'],
          rows: [
            ['Largo · Lento', 'molto lento (40-60): la Marcia funebre, il Preludio n. 20'],
            ['Adagio', 'lento e disteso (60-70)'],
            ['Andante', 'al passo (75-100): il Notturno op. 9 n. 2'],
            ['Andantino', 'un po\' più mosso dell\'Andante: il Preludio n. 7'],
            ['Moderato', 'né lento né veloce (100-115)'],
            ['Allegretto', 'vivace ma non troppo'],
            ['Allegro', 'veloce e brillante (120-160)'],
            ['Presto', 'velocissimo: lo Studio "Torrent" op. 10 n. 4'],
          ],
        },
        {
          kind: 'table',
          head: ['Cambiamenti', 'Significato'],
          rows: [
            ['rit. / rall.', 'rallentare'],
            ['accel.', 'accelerare'],
            ['a tempo', 'tornare al tempo di prima'],
            ['corona (archetto con un punto)', 'tenere la nota più del suo valore, a piacere'],
            ['rubato', 'tempo flessibile: si prende e si restituisce'],
          ],
        },
        {
          kind: 'text',
          text: 'Poi ci sono le parole di carattere, scritte sopra o fra i righi: dolce, cantabile, espressivo, legatissimo, leggiero, sotto voce (a mezza voce), agitato, con fuoco, appassionato. Non sono decorazioni: cambiano il tocco, il pedale, il respiro della frase.',
        },
        {
          kind: 'key',
          text: 'Il rubato di Chopin: la mano sinistra tiene il tempo come un direttore d\'orchestra, la destra si prende libertà — indugia su una nota, accelera in una fioritura — e torna in tempo con la sinistra. Il tempo "rubato" in un punto si restituisce poco dopo.',
        },
        {
          kind: 'listen',
          notes: PHRASE,
          label: 'Frase a tempo rigido',
          secs: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
          vel: [0.5, 0.55, 0.6, 0.75, 0.6, 0.55, 0.45],
        },
        {
          kind: 'listen',
          notes: PHRASE,
          label: 'La stessa frase con un po\' di rubato',
          secs: [0.46, 0.48, 0.56, 0.72, 0.5, 0.44, 1.1],
          vel: [0.5, 0.55, 0.62, 0.78, 0.6, 0.52, 0.42],
        },
        {
          kind: 'text',
          text: 'Il rubato si impara DOPO aver suonato a tempo con sicurezza: se non sai dov\'è il battito, non puoi allontanartene e tornarci. Nello studio usa il metronomo; nel suonare, lascia respirare la frase dove sale verso la nota più alta.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Qual è il più lento?',
          answers: ['Largo', 'Andante', 'Allegretto', 'Moderato'],
        },
        {
          kind: 'quiz',
          prompt: '"a tempo" dopo un "rit." vuol dire…',
          answers: ['torna al tempo di prima', 'continua a rallentare', 'accelera', 'fermati'],
        },
        {
          kind: 'quiz',
          prompt: 'Nel rubato di Chopin, quale mano tiene il tempo?',
          answers: ['la sinistra', 'la destra', 'nessuna', 'quella che suona la melodia'],
          explain: 'Così raccontavano i suoi allievi: la sinistra è il direttore d\'orchestra, la destra il cantante.',
        },
        {
          kind: 'quiz',
          prompt: '"sotto voce" vuol dire…',
          answers: ['a mezza voce, piano e raccolto', 'sotto la melodia', 'con la mano sinistra', 'molto forte'],
        },
        {
          kind: 'quiz',
          prompt: 'Una corona (un archetto con un punto) sopra una nota…',
          answers: ['la tiene più a lungo del suo valore', 'la fa più forte', 'la toglie', 'la fa staccata'],
        },
      ],
    },
    {
      id: 'es-5-ritornelli',
      title: 'Ritornelli e salti',
      goal: 'Seguire l\'ordine in cui si suona un pezzo: ritornelli, volte, Da Capo, Dal Segno, Coda.',
      minutes: 6,
      blocks: [
        {
          kind: 'text',
          text: 'Un pezzo non sempre si legge dall\'inizio alla fine. Ci sono segni che dicono di ripetere o di saltare: servono a non riscrivere parti identiche.',
        },
        {
          kind: 'table',
          head: ['Segno', 'Cosa fare'],
          rows: [
            ['‖: … :‖ (ritornello)', 'ripeti la parte fra i due segni (se manca il primo, dall\'inizio)'],
            ['1. e 2. (volte)', 'la prima volta suoni la casella 1, alla ripetizione salti alla 2'],
            ['D.C. (Da Capo)', 'torna all\'inizio'],
            ['D.S. (Dal Segno) §', 'torna al segno §'],
            ['al Fine', '…e fermati dove c\'è scritto Fine'],
            ['al Coda ⊕', '…e al segno ⊕ salta alla Coda'],
          ],
        },
        {
          kind: 'key',
          text: 'Prima di suonare un pezzo nuovo, trova i ritornelli e i salti e disegna mentalmente il percorso. Un ritornello dimenticato è l\'errore più comune di chi legge un valzer o un minuetto.',
        },
        {
          kind: 'text',
          text: 'Nei minuetti e nei valzer i ritornelli sono quasi la regola: ogni sezione di otto o sedici battute si suona due volte. Nella ripetizione si può variare qualcosa — una dinamica, un respiro — ed è un ottimo esercizio di espressione.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Le sezioni sono A ‖: B :‖ C. In che ordine si suonano?',
          answers: ['A B B C', 'A B C', 'A B C B', 'A A B C'],
        },
        {
          kind: 'quiz',
          prompt: '"D.C. al Fine" vuol dire…',
          answers: ['torna all\'inizio e fermati dove c\'è scritto Fine', 'suona fino alla fine e ricomincia', 'salta alla Coda', 'ripeti l\'ultima battuta'],
        },
        {
          kind: 'quiz',
          prompt: 'Con le caselle 1. e 2. alla fine di un ritornello, la seconda volta…',
          answers: ['salti la casella 1 e suoni la 2', 'suoni tutte e due', 'suoni solo la 1', 'ti fermi'],
        },
        {
          kind: 'quiz',
          prompt: '"D.S. al Coda" vuol dire…',
          answers: ['torna al segno, e al simbolo della coda salta alla Coda', 'torna all\'inizio', 'suona la Coda due volte', 'fermati al segno'],
        },
      ],
    },
    {
      id: 'es-6-abbellimenti',
      title: 'Abbellimenti e fioriture',
      goal: 'Riconoscere acciaccatura, appoggiatura, trillo, gruppetto, arpeggiato, e le fioriture di Chopin.',
      prereq: 'Tempo e carattere.',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          text: 'Gli abbellimenti sono note ornamentali scritte in piccolo o con un simbolo. Non cambiano l\'armonia: decorano la melodia, come la voce di un cantante d\'opera — ed è proprio il belcanto italiano che Chopin aveva in mente.',
        },
        {
          kind: 'table',
          head: ['Abbellimento', 'Come si suona'],
          rows: [
            ['acciaccatura (notina barrata)', 'velocissima, quasi insieme alla nota vera'],
            ['appoggiatura (notina senza barra)', 'prende tempo alla nota vera, spesso metà'],
            ['mordente', 'nota, nota vicina, nota: un rapido "tremolio"'],
            ['trillo (tr)', 'alternanza rapida con la nota sopra'],
            ['gruppetto (∾)', 'nota sopra, nota, nota sotto, nota: gira attorno'],
            ['arpeggiato (linea ondulata)', 'l\'accordo si sgrana dal basso verso l\'alto'],
          ],
        },
        { kind: 'listen', notes: ['C#5', 'D5'], label: 'Acciaccatura: una notina velocissima prima del Re', secs: [0.07, 0.9], holds: [0.07, 0.9] },
        { kind: 'listen', notes: ['E5', 'D5', 'E5', 'D5', 'E5', 'D5', 'E5', 'D5', 'C#5', 'D5'], label: 'Trillo sul Re, chiuso con una piccola risoluzione', secs: [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.1, 0.8] },
        { kind: 'listen', notes: ['E5', 'D5', 'C#5', 'D5'], label: 'Gruppetto: gira attorno alla nota', secs: [0.12, 0.12, 0.12, 0.8] },
        { kind: 'listen', notes: ['C3', 'G3', 'E4', 'G4', 'C5'], label: 'Arpeggiato: l\'accordo si sgrana dal basso', secs: [0.06, 0.06, 0.06, 0.06, 1.4], holds: [1.6, 1.55, 1.5, 1.45, 1.4] },
        {
          kind: 'key',
          text: 'Le fioriture di Chopin — cascate di note piccole, a volte venti in un battito — non vanno "contate": si distribuiscono dentro il tempo della sinistra, che resta regolare. Prima si studiano lente e a gruppi, poi si lasciano scorrere cantando.',
        },
        {
          kind: 'text',
          text: 'Come si studiano gli abbellimenti: prima la melodia SENZA, per sentire la linea; poi con l\'abbellimento lento e regolare; infine alla velocità giusta, leggero, senza accenti. L\'abbellimento è un sussurro intorno alla nota, mai più importante di lei.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Una notina barrata prima di una nota è…',
          answers: ['un\'acciaccatura: velocissima', 'un\'appoggiatura: lunga', 'un trillo', 'una nota da non suonare'],
        },
        {
          kind: 'quiz',
          prompt: '"tr" sopra una nota vuol dire…',
          answers: ['trillo: alternala rapidamente con la nota sopra', 'tremolo con il pedale', 'tre volte', 'tenuto e ritardando'],
        },
        {
          kind: 'quiz',
          prompt: 'Una linea ondulata verticale prima di un accordo…',
          answers: ['arpeggiato: sgrana l\'accordo dal basso verso l\'alto', 'trillo su tutte le note', 'suona l\'accordo due volte', 'suona l\'accordo staccato'],
        },
        {
          kind: 'quiz',
          prompt: 'In una fioritura di Chopin, chi tiene il tempo?',
          answers: ['la mano sinistra, regolare', 'la destra, contando ogni notina', 'nessuno: si rallenta', 'il pedale'],
        },
        {
          kind: 'quiz',
          prompt: 'Come si comincia a studiare una melodia con molti abbellimenti?',
          answers: ['prima senza abbellimenti, per sentire la linea', 'subito a tempo con tutti gli abbellimenti', 'solo gli abbellimenti', 'con la sinistra sola'],
        },
      ],
    },
  ],
};
