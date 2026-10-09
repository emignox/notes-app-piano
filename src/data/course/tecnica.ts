// ─────────────────────────────────────────────────────────────────────────────
// Modulo: tecnica e accompagnamento.
//
// La sezione Tecnica dello Studio fa ESEGUIRE scale, arpeggi e accordi; qui si
// spiega il perché: come stare seduti, perché i numeri delle dita contano,
// come si rendono indipendenti le mani, come si accompagna una melodia e quali
// disegni fa la sinistra nei pezzi veri.
// ─────────────────────────────────────────────────────────────────────────────

import type { Module } from '../lessons';
import { chordSeq } from './sound';

export const tecnicaModule: Module = {
  id: 'tecnica-base',
  title: 'Tecnica e accompagnamento',
  emoji: '✋',
  summary: 'Postura, diteggiatura, mani indipendenti, accompagnare una melodia, gli schemi della sinistra e le cadenze.',
  lessons: [
    {
      id: 'te-1-postura',
      title: 'Seduti al pianoforte',
      goal: 'Sedere, tenere la mano e usare il peso del braccio in modo da suonare senza tensione.',
      minutes: 6,
      blocks: [
        {
          kind: 'text',
          text: 'Il suono comincia prima delle dita. Seduti sulla metà anteriore della panca, piedi a terra (il destro vicino al pedale), all\'altezza del Do centrale. L\'altezza giusta è quella in cui gli avambracci stanno più o meno paralleli ai tasti; la distanza, quella in cui i gomiti stanno un po\' davanti al busto, liberi di muoversi.',
        },
        {
          kind: 'text',
          text: 'La mano ha una forma rotonda, come se tenesse una pallina: dita curve che toccano il tasto con il polpastrello, pollice appoggiato sul suo spigolo. Il polso non è né alto né basso: in linea con l\'avambraccio, morbido.',
        },
        {
          kind: 'key',
          text: 'Il peso viene dal braccio, non dalle dita che spingono. Le dita sono le gambe di un tavolo: reggono e trasmettono il peso, non lo creano.',
        },
        {
          kind: 'table',
          head: ['Dito', 'Numero'],
          rows: [
            ['pollice', '1'],
            ['indice', '2'],
            ['medio', '3'],
            ['anulare', '4'],
            ['mignolo', '5'],
          ],
        },
        {
          kind: 'text',
          text: 'I numeri sono gli stessi per le due mani: il pollice è 1 sia a destra sia a sinistra. Nella mano sinistra quindi il 5 sta in basso e l\'1 in alto, al contrario della destra.',
        },
        {
          kind: 'key',
          text: 'La tensione è il nemico della velocità e del suono. Ogni volta che un passaggio non viene, controlla spalle, gomito e polso prima delle dita: quasi sempre sono loro.',
        },
      ],
      exercises: [
        { kind: 'quiz', prompt: 'Il dito numero 1 è…', answers: ['il pollice', 'l\'indice', 'il mignolo', 'dipende dalla mano'] },
        { kind: 'quiz', prompt: 'Nella mano sinistra, il 5 è…', answers: ['il mignolo', 'il pollice', 'il medio', 'l\'anulare'] },
        {
          kind: 'quiz',
          prompt: 'L\'altezza giusta della panca è quella in cui…',
          answers: ['gli avambracci stanno più o meno paralleli ai tasti', 'i gomiti sono molto più bassi della tastiera', 'i polsi sono più alti delle spalle', 'i piedi non toccano terra'],
        },
        {
          kind: 'quiz',
          prompt: 'Da dove viene il peso che fa suonare il tasto?',
          answers: ['dal braccio, trasmesso dalle dita', 'dalle dita che spingono forte', 'dal polso che si abbassa', 'dal pedale'],
        },
      ],
    },
    {
      id: 'te-2-diteggiatura',
      title: 'Diteggiatura: perché i numeri contano',
      goal: 'Usare la diteggiatura della scala, il passaggio del pollice, e capire perché va rispettata.',
      prereq: 'Seduti al pianoforte; la scala maggiore.',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          text: 'I numeri sopra le note sono la diteggiatura. Non è un suggerimento di cortesia: lo stesso passaggio suonato sempre con le stesse dita diventa automatico; cambiarle ogni volta vuol dire reimpararlo ogni volta.',
        },
        {
          kind: 'key',
          text: 'Scala di Do, mano destra salendo: 1-2-3, il pollice passa sotto, 1-2-3-4-5. Mano sinistra salendo: 5-4-3-2-1, il 3 passa sopra il pollice, 3-2-1.',
        },
        { kind: 'keys', highlight: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], from: 'C4', to: 'C5', caption: 'Destra: Do(1) Re(2) Mi(3) — Fa(1) Sol(2) La(3) Si(4) Do(5)' },
        {
          kind: 'text',
          text: 'Il passaggio del pollice è il movimento chiave di tutta la tecnica: il pollice scivola sotto la mano verso il tasto successivo mentre il 3 tiene ancora il suo. Il gomito accompagna appena, il polso resta piatto: niente torsioni.',
        },
        {
          kind: 'table',
          head: ['Scala maggiore', 'Diteggiatura destra (salendo)'],
          rows: [
            ['Do, Sol, Re, La, Mi', '1 2 3 · 1 2 3 4 5'],
            ['Fa', '1 2 3 4 · 1 2 3 4 (il 4 sul Si♭)'],
            ['Si', '1 2 3 · 1 2 3 4 5'],
            ['con molti tasti neri', 'il pollice sui bianchi, il 3 e il 4 sui neri'],
          ],
        },
        {
          kind: 'text',
          text: 'Una regola che vale quasi sempre: il pollice non va su un tasto nero, se si può evitare. Chopin però amava rompere le regole quando la mano ne guadagnava, e scriveva molte diteggiature di suo pugno: nelle edizioni buone ci sono, e vanno seguite.',
        },
      ],
      exercises: [
        { kind: 'build-scale', root: 'C4', type: 'maggiore' },
        { kind: 'build-scale', root: 'G4', type: 'maggiore' },
        {
          kind: 'quiz',
          prompt: 'Scala di Do, destra salendo: dopo Do-Re-Mi con 1-2-3, il Fa lo suona…',
          answers: ['il pollice, che passa sotto', 'il 4', 'il 5', 'il 3 di nuovo'],
        },
        {
          kind: 'quiz',
          prompt: 'Scala di Do, sinistra salendo: dopo 5-4-3-2-1 (Do-Re-Mi-Fa-Sol), il La lo suona…',
          answers: ['il 3, che passa sopra il pollice', 'l\'1 di nuovo', 'il 5', 'il 2'],
        },
        {
          kind: 'quiz',
          prompt: 'Perché conviene suonare un passaggio sempre con le stesse dita?',
          answers: ['perché diventa automatico', 'perché suona più forte', 'perché è più lento', 'non conviene: meglio variare'],
        },
      ],
    },
    {
      id: 'te-3-mani',
      title: 'Mani indipendenti e voce che canta',
      goal: 'Far fare alle due mani (e alle dita della stessa mano) cose diverse: articolazione e volume.',
      prereq: 'Diteggiatura; il modulo Espressione aiuta.',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          text: 'Il cervello vorrebbe che le due mani facessero la stessa cosa. Suonare il piano è insegnargli il contrario: la destra lega mentre la sinistra stacca, la destra canta forte mentre la sinistra accompagna piano.',
        },
        {
          kind: 'key',
          text: 'Prima ogni mano da sola con la sua articolazione esatta, poi insieme, lentissimo, ascoltando una mano alla volta. Quando una mano "copia" l\'altra, rallenta ancora.',
        },
        {
          kind: 'text',
          text: 'Il passo successivo è dentro la stessa mano: in un accordo, la nota della melodia deve suonare più forte delle altre. Si fa dando più peso al dito che la suona (spesso il 4 o il 5) e lasciando le altre dita leggere. Si chiama "dare voce", ed è il segreto del suono di Chopin.',
        },
        { kind: 'listen', notes: ['C4', 'E4', 'G4', 'C5'], together: true, label: 'Accordo piatto: tutte le note uguali', vel: [0.6, 0.6, 0.6, 0.6], holds: [1.6, 1.6, 1.6, 1.6] },
        { kind: 'listen', notes: ['C4', 'E4', 'G4', 'C5'], together: true, label: 'Accordo con la voce in alto: la melodia emerge', vel: [0.3, 0.3, 0.3, 0.95], holds: [1.6, 1.6, 1.6, 1.6] },
        {
          kind: 'text',
          text: 'Esercizio: suona l\'accordo di Do maggiore quattro volte, facendo emergere ogni volta una nota diversa (prima il Do basso, poi il Mi, poi il Sol, poi il Do alto). È difficile all\'inizio: è proprio lì che si costruisce l\'indipendenza delle dita.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'In un accordo della destra, la melodia è la nota più alta. Come la fai emergere?',
          answers: ['più peso sul dito che la suona, le altre dita leggere', 'suonando l\'accordo più forte', 'con il pedale', 'suonandola prima delle altre'],
        },
        {
          kind: 'quiz',
          prompt: 'Le mani insieme non vanno: una copia l\'altra. Cosa fai?',
          answers: ['rallento ancora e ascolto una mano alla volta', 'accelero per prendere slancio', 'suono solo la destra per sempre', 'cambio diteggiatura'],
        },
        { kind: 'build-chord', root: 'C4', quality: 'maggiore' },
        { kind: 'build-chord', root: 'F3', quality: 'maggiore' },
      ],
    },
    {
      id: 'te-4-accompagnare',
      title: 'Accompagnare una melodia',
      goal: 'Scegliere fra I, IV e V l\'accordo giusto sotto ogni nota della melodia.',
      prereq: 'Gli accordi e i gradi della scala.',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          text: 'Per accompagnare una melodia semplice bastano tre accordi: I, IV e V. Insieme contengono tutte e sette le note della scala, quindi c\'è sempre almeno un accordo che "va bene" sotto la nota della melodia.',
        },
        {
          kind: 'table',
          head: ['In Do maggiore', 'Note'],
          rows: [
            ['I — Do', 'Do · Mi · Sol'],
            ['IV — Fa', 'Fa · La · Do'],
            ['V — Sol', 'Sol · Si · Re'],
          ],
        },
        {
          kind: 'key',
          text: 'La regola: sul tempo FORTE scegli l\'accordo che contiene la nota della melodia. Le note sui tempi deboli possono essere note di passaggio, e non serve cambiare accordo per ognuna.',
        },
        { kind: 'degrees', tonic: 'C', mode: 'maggiore' },
        {
          kind: 'text',
          text: 'Poi si decide come suonarlo: accordi tenuti (il più semplice), basso e accordo (il valzer, la marcia), arpeggio (il notturno). Le note sono le stesse; cambia il carattere. Quando un accordo non suona bene, prova il suo rivolto più vicino: la mano si sposta meno e il suono è più morbido.',
        },
        {
          kind: 'text',
          text: 'È lo stesso ragionamento, molto più raffinato, che c\'è sotto ogni pagina di Chopin: la sinistra disegna l\'armonia e la destra canta sopra. Saperlo riconoscere vuol dire leggere la sinistra a blocchi invece che nota per nota.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'In Do maggiore la melodia è su un La, sul tempo forte. Quale accordo fra I, IV e V lo contiene?',
          answers: ['IV (Fa-La-Do)', 'I (Do-Mi-Sol)', 'V (Sol-Si-Re)', 'nessuno'],
        },
        {
          kind: 'quiz',
          prompt: 'In Do maggiore la melodia è su un Si, sul tempo forte. Quale accordo?',
          answers: ['V (Sol-Si-Re)', 'I (Do-Mi-Sol)', 'IV (Fa-La-Do)', 'nessuno'],
        },
        {
          kind: 'quiz',
          prompt: 'In Do maggiore la melodia è su un Do. Quali accordi lo contengono?',
          answers: ['I e IV', 'solo V', 'solo IV', 'nessuno'],
          explain: 'Do sta in Do-Mi-Sol e in Fa-La-Do: si sceglie guardando dove va la frase (il IV allontana, il I chiude).',
        },
        { kind: 'degree', tonic: 'G', degree: 4 },
        { kind: 'degree', tonic: 'G', degree: 5 },
        { kind: 'degree', tonic: 'F', degree: 5 },
      ],
    },
    {
      id: 'te-5-sinistra',
      title: 'Gli schemi della mano sinistra',
      goal: 'Riconoscere e suonare i disegni ricorrenti della sinistra: albertino, valzer, arpeggio largo.',
      prereq: 'Accompagnare una melodia.',
      minutes: 10,
      piece: 'mozart-k545-i',
      blocks: [
        {
          kind: 'text',
          text: 'La sinistra ripete quasi sempre uno schema: lo stesso disegno, con le note dell\'accordo che cambia. Imparato il disegno come un gesto della mano, basta cambiare le note — ed è per questo che si legge a blocchi.',
        },
        {
          kind: 'listen',
          label: 'Basso albertino: basso, alto, medio, alto (Mozart, Sonata K. 545)',
          notes: ['C3', 'G3', 'E3', 'G3', 'C3', 'G3', 'E3', 'G3'],
          secs: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.4],
          vel: [0.55, 0.35, 0.35, 0.35, 0.5, 0.35, 0.35, 0.35],
        },
        {
          kind: 'listen',
          label: 'Valzer: basso sul primo tempo, accordo sul secondo e sul terzo',
          ...chordSeq([[['A2'], 0.45], [['C4', 'E4'], 0.45], [['C4', 'E4'], 0.45], [['E2'], 0.45], [['G#3', 'D4'], 0.45], [['G#3', 'D4'], 0.6]], [0.75, 0.35, 0.35, 0.75, 0.35, 0.35], 0.5),
        },
        {
          kind: 'listen',
          label: 'Arpeggio largo con il pedale: il basso del notturno',
          notes: ['C2', 'G2', 'E3', 'G3', 'C4', 'G3', 'E3', 'G2'],
          secs: [0.24, 0.24, 0.24, 0.24, 0.24, 0.24, 0.24, 0.5],
          holds: [2.2, 2, 1.8, 1.6, 1.4, 1.2, 1, 0.8],
          vel: [0.65, 0.4, 0.4, 0.4, 0.4, 0.38, 0.36, 0.34],
        },
        {
          kind: 'key',
          text: 'Nei salti del valzer gli occhi vanno sul tasto d\'ARRIVO prima che la mano parta, e la mano si muove "a molla": il basso corto, l\'accordo leggero. Il pedale prende il basso e lo tiene per tutta la battuta.',
        },
        {
          kind: 'text',
          text: 'Nei notturni la sinistra copre più di un\'ottava. La mano non si stira: si apre e si SPOSTA, aiutata dal polso e dal pedale che tiene unite le note. In Chopin la sinistra è un\'orchestra intera: basso, armonia e respiro.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Basso albertino sull\'accordo Do-Mi-Sol: in che ordine si suonano le note?',
          answers: ['Do-Sol-Mi-Sol', 'Do-Mi-Sol-Do', 'Sol-Mi-Do-Mi', 'Mi-Do-Sol-Do'],
          explain: 'Basso, alto, medio, alto: quattro note che fanno sentire l\'accordo intero senza suonarlo tutto insieme.',
        },
        {
          kind: 'quiz',
          prompt: 'Nel valzer, la sinistra suona il basso…',
          answers: ['sul primo tempo, poi l\'accordo sul secondo e sul terzo', 'su tutti e tre i tempi', 'solo sul terzo tempo', 'in levare'],
        },
        {
          kind: 'quiz',
          prompt: 'In un salto della sinistra, dove guardano gli occhi?',
          answers: ['sul tasto d\'arrivo, prima che la mano parta', 'sulla mano che parte', 'sullo spartito, sempre', 'da nessuna parte: si va a memoria'],
          explain: 'Con l\'esperienza il salto si fa senza guardare, ma all\'inizio lo sguardo anticipato è ciò che lo rende sicuro.',
        },
      ],
    },
    {
      id: 'te-6-cadenze',
      title: 'Le cadenze: come finisce una frase',
      goal: 'Riconoscere cadenza perfetta, plagale, sospesa e d\'inganno, e sapere dove la musica respira.',
      prereq: 'I gradi della scala e gli accordi.',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          text: 'Una frase musicale finisce come una frase parlata: con un punto, una virgola o un punto interrogativo. Le cadenze sono questi segni di punteggiatura, fatti di accordi.',
        },
        { kind: 'progression', id: 'cad-perfetta', tonic: 'C' },
        { kind: 'progression', id: 'cad-sospesa', tonic: 'C' },
        {
          kind: 'key',
          text: 'Domanda e risposta: una frase si ferma sospesa sul V (la domanda), la successiva chiude sul I (la risposta). È la struttura più comune della musica, e dice dove respirare.',
        },
        { kind: 'progression', id: 'cad-plagale', tonic: 'C' },
        { kind: 'progression', id: 'cad-inganno', tonic: 'C' },
        {
          kind: 'text',
          text: 'Chopin gioca con le attese: una cadenza d\'inganno rimanda la chiusura e la fa desiderare, un finale si allunga con una cadenza plagale che suona come un\'eco. Riconoscerle mentre suoni ti dice dove allargare il tempo e dove lasciar spegnere il suono.',
        },
      ],
      exercises: [
        {
          kind: 'quiz',
          prompt: 'Una frase che si ferma sul V è una cadenza…',
          answers: ['sospesa', 'perfetta', 'plagale', 'd\'inganno'],
        },
        {
          kind: 'quiz',
          prompt: 'V → vi (il dominante va sulla relativa minore) è una cadenza…',
          answers: ['d\'inganno', 'perfetta', 'plagale', 'sospesa'],
        },
        {
          kind: 'quiz',
          prompt: 'IV → I, la chiusura dell\'"Amen", è una cadenza…',
          answers: ['plagale', 'perfetta', 'sospesa', 'd\'inganno'],
        },
        {
          kind: 'quiz',
          prompt: 'Quale cadenza chiude davvero un pezzo?',
          answers: ['perfetta (V → I)', 'sospesa (… → V)', 'd\'inganno (V → vi)', 'nessuna'],
        },
        { kind: 'degree', tonic: 'C', degree: 5 },
        { kind: 'degree', tonic: 'G', degree: 1 },
      ],
    },
  ],
};
