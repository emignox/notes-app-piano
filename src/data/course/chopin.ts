// ─────────────────────────────────────────────────────────────────────────────
// Modulo: verso Chopin.
//
// Una lezione per ogni pezzo di Chopin del repertorio, nell'ordine in cui
// conviene affrontarli. Ognuna spiega CHE COSA insegna quel pezzo (la mazurka,
// il corale, il valzer, il notturno, la marcia), fa sentire il suo disegno
// con le note vere delle prime battute, e alla fine apre il brano.
// ─────────────────────────────────────────────────────────────────────────────

import type { Module } from '../lessons';
import { chordSeq } from './sound';

export const chopinModule: Module = {
  id: 'verso-chopin',
  title: 'Verso Chopin',
  emoji: '🌙',
  summary: 'Che cosa insegna ogni pezzo di Chopin del repertorio, in che ordine affrontarli e come studiarli. Ogni lezione finisce aprendo il brano.',
  lessons: [
    {
      id: 'ch-1-come',
      title: 'Come si suona Chopin',
      goal: 'Conoscere i cinque ingredienti del suono di Chopin e il percorso dei pezzi nell\'app.',
      prereq: 'Lettura del doppio pentagramma; il modulo Espressione aiuta molto.',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          text: 'Fryderyk Chopin (1810–1849) ha scritto quasi solo per pianoforte, e il pianoforte per lui era una voce. Il suo modello era il belcanto dell\'opera italiana: melodie lunghe, legate, respirate come da un cantante.',
        },
        {
          kind: 'table',
          head: ['Ingrediente', 'Che cosa vuol dire alla tastiera'],
          rows: [
            ['cantabile', 'la melodia emerge sopra l\'accompagnamento, legata, mai battuta'],
            ['legato', 'frasi lunghe, le dita che si passano il suono'],
            ['pedale', 'quasi sempre presente, cambiato con l\'armonia'],
            ['rubato', 'la destra respira, la sinistra tiene il tempo'],
            ['suono morbido', 'peso del braccio, mai dita rigide; anche il forte è rotondo'],
          ],
        },
        {
          kind: 'key',
          text: 'Prima le note giuste e a tempo, lentamente; POI il colore. Il rubato e le sfumature si costruiscono sopra una base sicura, non al posto di essa.',
        },
        {
          kind: 'table',
          head: ['Pezzo, in ordine', 'Che cosa insegna'],
          rows: [
            ['Preludio op. 28 n. 7', 'la mazurka: ritmo puntato, accordi sotto la melodia'],
            ['Preludio op. 28 n. 20', 'il corale: accordi pieni, tre dinamiche sulle stesse note'],
            ['Valzer in la minore B. 150', 'la sinistra a salti, la destra che canta'],
            ['Notturno op. 9 n. 2', 'il cantabile, il 12/8, le fioriture'],
            ['Marcia funebre', 'cinque bemolli, il peso, il Trio legato'],
            ['Studi e Fantaisie-Impromptu', 'velocità e resistenza: per ora da ascoltare sulla partitura completa'],
          ],
        },
        {
          kind: 'text',
          text: 'Una seduta di studio che funziona: 5 minuti di lettura (la sessione di oggi), 10 di tecnica nella tonalità del pezzo (scala e arpeggio), 20 sul pezzo — una sezione, mani separate, poi insieme lentamente — e alla fine ascoltare il brano intero per ricordarsi dove si va.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Qual era il modello di Chopin per la melodia?',
          answers: ['il canto dell\'opera italiana', 'il violino', 'l\'organo da chiesa', 'la marcia militare'],
        },
        {
          kind: 'quiz',
          prompt: 'Quando si comincia a lavorare sul rubato?',
          answers: ['dopo aver suonato il passo a tempo con sicurezza', 'dal primo giorno', 'solo nei pezzi veloci', 'mai: in Chopin non si usa'],
        },
        {
          kind: 'quiz',
          prompt: 'Quale pezzo conviene affrontare per primo?',
          answers: ['il Preludio n. 7', 'la Fantaisie-Impromptu', 'lo Studio Rivoluzionario', 'il Notturno op. 9 n. 2'],
          explain: 'Sedici battute, tempo moderato, una sola idea ritmica: tutto quello che serve per cominciare.',
        },
      ],
    },
    {
      id: 'ch-2-mazurka',
      title: 'La mazurka: Preludio n. 7',
      goal: 'Suonare il ritmo puntato della mazurka e far cantare la nota alta degli accordi.',
      prereq: 'Come si suona Chopin; il punto (modulo Ritmo).',
      minutes: 8,
      piece: 'chopin-op28-7',
      blocks: [
        {
          kind: 'text',
          text: 'Il Preludio n. 7 è una mazurka in miniatura: 3/4, La maggiore, Andantino, sedici battute. Otto piccole frasi di due battute, tutte con lo stesso ritmo, come otto versi di una poesia.',
        },
        {
          kind: 'listen',
          label: 'L\'inizio: levare, ritmo puntato, accordo lungo',
          ...chordSeq([[['E4'], 0.9], [['E2', 'C#5'], 0.68], [['D5'], 0.23], [['E3', 'B3', 'D4', 'G#4', 'B4'], 1.8]], [0.5, 0.55, 0.5, 0.45], 0.97),
        },
        {
          kind: 'key',
          text: 'Il ritmo della mazurka: croma col punto, semicroma, poi una nota lunga. Il punto NON si accorcia: la semicroma è piccola e arriva tardi, quasi appoggiata sull\'accordo.',
        },
        {
          kind: 'text',
          text: 'Gli accordi della destra hanno la melodia in alto: è quella nota che deve cantare, con più peso sul 4 o sul 5, mentre le altre dita restano leggere (vedi "Mani indipendenti"). La sinistra suona un basso grave e poi un accordo: il pedale li tiene insieme e si cambia con l\'armonia.',
        },
        {
          kind: 'text',
          text: 'Nelle battute 11–12 l\'armonia si allarga in un grande accordo pieno: è il punto più alto del pezzo. Ci si arriva crescendo, senza indurire, e si torna giù piano. Le ultime due battute rallentano appena.',
        },
        {
          kind: 'key',
          text: 'Come studiarlo: la destra sola, solo gli accordi (senza ritmo), finché le posizioni sono sicure; poi col ritmo puntato; poi la sinistra; poi insieme, una frase di due battute alla volta.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Quanti diesis ha La maggiore?',
          answers: ['tre: Fa♯, Do♯, Sol♯', 'due: Fa♯, Do♯', 'quattro', 'nessuno'],
        },
        {
          kind: 'quiz',
          prompt: 'Nel ritmo puntato croma-col-punto e semicroma, la semicroma…',
          answers: ['è breve e arriva tardi, vicino alla nota dopo', 'dura quanto la croma', 'si suona prima del tempo', 'si salta'],
        },
        {
          kind: 'quiz',
          prompt: 'In un accordo della destra con la melodia in alto, quale nota suona più forte?',
          answers: ['quella in alto, la melodia', 'quella in basso', 'tutte uguali', 'quella in mezzo'],
        },
        { kind: 'value-beats', id: 'croma', dots: 1 },
        { kind: 'build-chord', root: 'A3', quality: 'maggiore' },
        { kind: 'build-chord', root: 'E3', quality: 'settima di dominante' },
      ],
    },
    {
      id: 'ch-3-corale',
      title: 'Il corale: Preludio n. 20',
      goal: 'Suonare accordi pieni tutti insieme e cambiare colore fra ff, p e pp.',
      prereq: 'La mazurka; le dinamiche.',
      minutes: 8,
      piece: 'chopin-op28-20',
      blocks: [
        {
          kind: 'text',
          text: 'Il Preludio n. 20, in do minore, Largo, è fatto solo di accordi: tredici battute che sembrano un coro in chiesa. Qui non si impara la velocità, si impara il SUONO: le stesse armonie tornano tre volte, forte, piano e pianissimo.',
        },
        {
          kind: 'listen',
          label: 'La prima battuta, fortissimo',
          ...chordSeq([[['C2', 'C3', 'C4', 'Eb4', 'G4'], 1.2], [['F2', 'F3', 'C4', 'Eb4', 'Ab4'], 1.2], [['G2', 'G3', 'B3', 'Eb4', 'G4'], 0.9], [['D4', 'F4'], 0.3], [['C2', 'G2', 'C3', 'C4', 'Eb4'], 1.8]], 0.92, 0.98),
        },
        {
          kind: 'listen',
          label: 'La stessa battuta, piano: cambia solo il peso',
          ...chordSeq([[['C2', 'C3', 'C4', 'Eb4', 'G4'], 1.2], [['F2', 'F3', 'C4', 'Eb4', 'Ab4'], 1.2], [['G2', 'G3', 'B3', 'Eb4', 'G4'], 0.9], [['D4', 'F4'], 0.3], [['C2', 'G2', 'C3', 'C4', 'Eb4'], 1.8]], 0.38, 0.98),
        },
        {
          kind: 'key',
          text: 'Tutte le note di un accordo partono INSIEME: la mano prepara la forma sopra i tasti e scende con il braccio, come un\'unica cosa. Un accordo "sgranato" senza volerlo è il difetto da ascoltare.',
        },
        {
          kind: 'text',
          text: 'Il fortissimo nasce dal peso del braccio che cade morbido, non dalle dita che spingono; il pianissimo da una mano vicina ai tasti, che scende lenta. Ascolta la nota più alta di ogni accordo: è una melodia, e deve restare la voce che si sente di più.',
        },
        {
          kind: 'text',
          text: 'Il terzo movimento di ogni battuta ha lo stesso ritmo puntato: va suonato uguale ogni volta, senza affrettare la semicroma. Il pedale si cambia a ogni accordo — prima la mano, poi il piede — e l\'ultimo accordo, con la corona, si lascia spegnere.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Do minore ha in chiave…',
          answers: ['tre bemolli', 'tre diesis', 'nessuna alterazione', 'un bemolle'],
          explain: 'È la relativa di Mi♭ maggiore. Il Si♮ che compare negli accordi è il settimo grado alzato della minore armonica.',
        },
        {
          kind: 'quiz',
          prompt: 'Come si suona il fortissimo di un accordo pieno?',
          answers: ['col peso del braccio che cade morbido', 'con le dita rigide che spingono', 'battendo dall\'alto', 'col pedale abbassato più forte'],
        },
        { kind: 'ear-chord', root: 'C4', options: ['maggiore', 'minore'] },
        { kind: 'name-chord', root: 'C4', quality: 'minore' },
        { kind: 'name-chord', root: 'G3', quality: 'maggiore' },
      ],
    },
    {
      id: 'ch-4-valzer',
      title: 'Il valzer: in la minore',
      goal: 'Tenere ferma la sinistra del valzer mentre la destra canta legata.',
      prereq: 'Gli schemi della mano sinistra.',
      minutes: 9,
      piece: 'chopin-valzer-la-minore',
      blocks: [
        {
          kind: 'text',
          text: 'Il Valzer in la minore (pubblicato solo nel 1955) è il Chopin che si studia per primo: una melodia malinconica sopra il classico accompagnamento di valzer. Tre sezioni: il tema, una parte centrale più acuta, il ritorno del tema.',
        },
        {
          kind: 'listen',
          label: 'La sinistra: basso sul primo tempo, accordo sul secondo e sul terzo',
          ...chordSeq([[['A2'], 0.45], [['A3', 'C4', 'E4'], 0.45], [['A3', 'C4', 'E4'], 0.45], [['E2'], 0.45], [['G#3', 'B3', 'D4'], 0.45], [['G#3', 'B3', 'D4'], 0.6]], [0.7, 0.32, 0.3, 0.7, 0.32, 0.3], 0.55),
        },
        {
          kind: 'key',
          text: 'Il valzer ha UN tempo forte: il primo. Il basso è pieno e corto, i due accordi leggeri come un respiro. Se i tre tempi pesano uguale, diventa una marcia a tre.',
        },
        {
          kind: 'text',
          text: 'La sinistra va studiata da sola finché non va a memoria: è un salto continuo fra basso e accordo, e la mano deve trovarlo senza guardare. Gli occhi anticipano il tasto d\'arrivo, il pedale prende il basso e lo tiene per tutta la battuta.',
        },
        {
          kind: 'text',
          text: 'Sopra, la destra è legata e cantabile: quando la sinistra stacca e la destra lega, le mani fanno due cose diverse — è l\'esercizio vero di questo pezzo. Nella sezione centrale la melodia sale a scala ed è più forte: forte, ma senza indurire il suono.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Nel valzer, quale tempo pesa di più?',
          answers: ['il primo', 'il secondo', 'il terzo', 'tutti uguali'],
        },
        {
          kind: 'quiz',
          prompt: 'La minore, relativa di Do maggiore, ha in chiave…',
          answers: ['nessuna alterazione', 'un diesis', 'un bemolle', 'tre diesis'],
          explain: 'Il Sol♯ che vedrai spesso è il settimo grado alzato: compare nell\'accordo di Mi (il V).',
        },
        { kind: 'build-chord', root: 'A3', quality: 'minore' },
        { kind: 'build-chord', root: 'E3', quality: 'maggiore' },
        { kind: 'ear-chord', root: 'A3', options: ['minore', 'maggiore'] },
      ],
    },
    {
      id: 'ch-5-notturno',
      title: 'Il notturno: op. 9 n. 2',
      goal: 'Sentire il 12/8 in quattro, far dondolare la sinistra e far cantare la destra con le fioriture.',
      prereq: 'Il valzer; terzine e tempi composti (modulo Ritmo); abbellimenti.',
      minutes: 10,
      piece: 'chopin-notturno-op9-2',
      blocks: [
        {
          kind: 'text',
          text: 'Il Notturno op. 9 n. 2, in Mi♭ maggiore (tre bemolli), è il pezzo di Chopin che tutti riconoscono dopo due battute. Il tempo è 12/8: dodici crome per battuta, ma raggruppate in QUATTRO movimenti da tre.',
        },
        {
          kind: 'listen',
          label: 'Il levare, il salto di sesta e la sinistra che dondola',
          ...chordSeq([[['Bb4'], 0.45], [['Eb2', 'G5'], 0.45], [['G3', 'Eb4'], 0.45], [['Bb3', 'Eb4', 'G4'], 0.45], [['Eb2', 'F5'], 0.45], [['Ab3', 'D4'], 0.45], [['Bb3', 'D4', 'Ab4'], 0.7]], [0.55, 0.7, 0.32, 0.32, 0.65, 0.32, 0.32], 1.6),
        },
        {
          kind: 'key',
          text: 'Si conta in quattro, non in dodici: "UNO-e-a, DUE-e-a…". La sinistra fa basso e due accordi a ogni movimento, sempre uguale, come una barca che dondola.',
        },
        {
          kind: 'text',
          text: 'La destra canta note lunghe sopra quel dondolio. Ogni volta che il tema ritorna, Chopin lo decora con fioriture sempre più ricche: gruppi di note piccole da far scorrere DENTRO il movimento, leggere, mentre la sinistra continua regolare. È il rubato nella sua forma più pura.',
        },
        {
          kind: 'text',
          text: 'La sinistra copre più di un\'ottava a ogni movimento: la mano si sposta (non si stira) e il pedale, cambiato a ogni basso, tiene unito l\'arpeggio. Deve essere molto più piano della destra: è il letto su cui sta la melodia.',
        },
        {
          kind: 'key',
          text: 'Come studiarlo: la sinistra da sola per giorni, finché il dondolio è automatico e piano. Poi la destra senza fioriture. Poi insieme. Le fioriture per ultime, prima lente e a gruppi, poi leggere.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Il 12/8 si sente in…',
          answers: ['quattro movimenti da tre crome', 'dodici movimenti', 'tre movimenti da quattro', 'due movimenti da sei'],
        },
        {
          kind: 'quiz',
          prompt: 'Mi♭ maggiore ha in chiave…',
          answers: ['Si♭, Mi♭, La♭', 'Si♭, Mi♭', 'Fa♯, Do♯, Sol♯', 'Si♭, Mi♭, La♭, Re♭'],
        },
        {
          kind: 'quiz',
          prompt: 'Durante una fioritura della destra, la sinistra…',
          answers: ['continua regolare, a tempo', 'si ferma ad aspettare', 'accelera insieme', 'suona più forte'],
        },
        { kind: 'read-interval', from: 'Bb4', to: 'G5', clef: 'treble' },
        { kind: 'build-chord', root: 'Eb4', quality: 'maggiore' },
        { kind: 'build-chord', root: 'Bb3', quality: 'settima di dominante' },
      ],
    },
    {
      id: 'ch-6-marcia',
      title: 'La Marcia funebre',
      goal: 'Reggere un ritmo puntato lento senza affrettarlo e passare dalla marcia al Trio cantabile.',
      prereq: 'Il corale; leggere cinque bemolli in chiave.',
      minutes: 9,
      piece: 'chopin-marcia-funebre',
      blocks: [
        {
          kind: 'text',
          text: 'Terzo movimento della Sonata op. 35: la marcia funebre più conosciuta al mondo. Si♭ minore, cinque bemolli in chiave: Si♭, Mi♭, La♭, Re♭, Sol♭. Due pezzi in uno — la marcia, tutta su un Si♭ ribattuto, e il Trio in Re♭ maggiore, legato e cantabile.',
        },
        {
          kind: 'listen',
          label: 'La sinistra: due accordi alternati, come rintocchi',
          ...chordSeq([[['Bb2', 'F3', 'Bb3'], 1.2], [['Db3', 'Gb3', 'Bb3'], 0.9], [['Bb3'], 0.3], [['Bb2', 'F3', 'Bb3'], 1.2], [['Db3', 'Gb3', 'Bb3'], 1.2]], [0.5, 0.42, 0.4, 0.5, 0.42], 0.95),
        },
        {
          kind: 'key',
          text: 'Il ritmo puntato lento è la cosa più difficile da tenere: la tentazione è affrettare la semicroma. Conta in crome ("uno-e-due-e") e lascia la semicroma attaccata alla nota dopo.',
        },
        {
          kind: 'text',
          text: 'Il suono della marcia è pesante ma non duro: il braccio cade sugli accordi della sinistra, la destra ribatte il Si♭ con il peso di chi cammina lento. Le dinamiche vanno dal pianissimo al fortissimo e ritorno: un corteo che si avvicina e si allontana.',
        },
        {
          kind: 'text',
          text: 'Il Trio è un ricordo che si affaccia in mezzo al corteo: Re♭ maggiore, una melodia che canta e salta sopra una sinistra semplice, basso e accordo. È la parte più facile del pezzo — e la più bella. Il tempo resta lo stesso della marcia: cambia il colore, non la velocità.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Si♭ minore ha in chiave…',
          answers: ['cinque bemolli', 'due bemolli', 'cinque diesis', 'tre bemolli'],
          explain: 'Si♭, Mi♭, La♭, Re♭, Sol♭: è la relativa di Re♭ maggiore, la tonalità del Trio.',
        },
        {
          kind: 'quiz',
          prompt: 'Nel ritmo puntato lento, l\'errore più comune è…',
          answers: ['affrettare la semicroma', 'tenerla troppo', 'suonarla forte', 'dimenticare il pedale'],
        },
        { kind: 'key-signature', tonic: 'Db' },
        { kind: 'build-chord', root: 'Bb3', quality: 'minore' },
        { kind: 'build-chord', root: 'Gb3', quality: 'maggiore' },
      ],
    },
    {
      id: 'ch-7-studi',
      title: 'Prepararsi agli Studi',
      goal: 'Sapere cosa allenano lo Studio Rivoluzionario, il Torrent e la Fantaisie-Impromptu, e come prepararli.',
      prereq: 'I pezzi precedenti di questo modulo.',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          text: 'Gli Studi di Chopin sono pezzi da concerto costruiti su UN problema tecnico ciascuno. Nell\'app ci sono gli originali integrali (Canzoni → Brani, nel Leggio): si ascoltano a qualsiasi velocità, una mano alla volta, seguendo le note che si accendono sul rigo e sulla tastiera.',
        },
        {
          kind: 'table',
          head: ['Pezzo', 'Che cosa allena'],
          rows: [
            ['Studio op. 10 n. 12 "Rivoluzionario"', 'la sinistra: scale e arpeggi velocissimi in do minore, sotto gli accordi della destra'],
            ['Studio op. 10 n. 4 "Torrent"', 'il moto perpetuo di semicrome che passa fra le due mani, in do♯ minore'],
            ['Fantaisie-Impromptu op. 66', 'arpeggi della sinistra e scale della destra, poi un episodio cantabile; nell\'originale 4 note contro 3'],
          ],
        },
        {
          kind: 'key',
          text: 'Lo studio lento non è una fase da superare: è il modo. Tempo dimezzato, mani separate, gruppi di quattro note con una piccola sosta fra un gruppo e l\'altro, poi gruppi sempre più lunghi.',
        },
        {
          kind: 'text',
          text: 'Tre trucchi classici per i passaggi veloci. Ritmi alterati: suona le semicrome come lunga-corta, poi corta-lunga, per rendere sicura ogni nota. Accordi: suona insieme le note che stanno sotto la mano, per imparare le posizioni. Punti d\'arrivo: suona il gruppo e FERMATI sulla prima nota del gruppo dopo, con la mano già pronta.',
        },
        {
          kind: 'text',
          text: 'La tecnica che serve si costruisce nella sezione Tecnica dello Studio: scale e arpeggi in do minore e do♯ minore, a mani separate e poi insieme. Quando i pezzi precedenti di questo modulo sono sicuri, apri il Rivoluzionario: ascolta la sinistra da sola, rallentata, seguendola sulla partitura, poi provala una battuta alla volta.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Lo Studio "Rivoluzionario" allena soprattutto…',
          answers: ['la mano sinistra', 'la mano destra', 'il pedale', 'la lettura a prima vista'],
        },
        {
          kind: 'quiz',
          prompt: 'Studiando un passaggio veloce con "ritmi alterati", suoni le note…',
          answers: ['lunga-corta, poi corta-lunga', 'tutte più forti', 'al contrario, dall\'ultima', 'solo quelle sui tempi'],
        },
        {
          kind: 'quiz',
          prompt: 'Quando si passa alla velocità vera?',
          answers: ['quando lento e a mani unite è sicuro, aumentando poco per volta', 'dal primo giorno', 'quando ci si è stancati del lento', 'mai: si suona sempre lento'],
        },
        { kind: 'build-scale', root: 'C4', type: 'minore armonica' },
        { kind: 'build-scale', root: 'C#4', type: 'minore armonica' },
      ],
    },
  ],
};
