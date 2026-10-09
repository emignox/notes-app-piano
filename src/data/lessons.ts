// ─────────────────────────────────────────────────────────────────────────────
// I contenuti dello Studio, scritti come DATI.
//
// Ogni lezione è una lista di blocchi (testo, pentagramma, tastiera, ascolto,
// tabella, ritmo) seguita da esercizi. Aggiungere una lezione significa
// aggiungere un oggetto qui: nessun componente nuovo da scrivere.
//
// Struttura del percorso: modulo → lezione → SPIEGO / MOSTRO / FACCIO SENTIRE /
// TI FACCIO PROVARE. L'ordine non è decorativo: capire prima e memorizzare poi
// costa molta meno fatica del contrario.
// ─────────────────────────────────────────────────────────────────────────────

import type { ChordQuality, ModeName, OtherScale, ScaleType } from '../lib/harmony';
import type { ValueId } from '../lib/rhythm';

// ── Blocchi ─────────────────────────────────────────────────────────────────

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'key'; text: string }               // il concetto da ricordare
  | { kind: 'staff'; notes: string[]; durations?: string[]; caption?: string }
  | { kind: 'chord'; root: string; quality: ChordQuality; inversion?: number; caption?: string }
  | { kind: 'keys'; highlight: string[]; from: string; to: string; caption?: string }
  /**
   * `secs` dà la durata nota per nota: serve quando è il ritmo il punto.
   * `vel` (0–1) e `holds` (secondi di tasto premuto) servono quando il punto è
   * COME si suona: piano e forte, staccato e legato, pedale.
   */
  | { kind: 'listen'; notes: string[]; together?: boolean; label: string; secs?: number[]; vel?: number[]; holds?: number[] }
  | { kind: 'table'; head: [string, string]; rows: [string, string][] }
  | { kind: 'values'; ids: ValueId[]; caption?: string }
  | { kind: 'meter'; id: string }
  | { kind: 'circle' }
  | { kind: 'degrees'; tonic: string; mode: 'maggiore' | 'minore'; sevenths?: boolean }
  | { kind: 'progression'; id: string; tonic: string };

// ── Esercizi ────────────────────────────────────────────────────────────────

export type Exercise =
  /** Ti do le note, dimmi che accordo è. */
  | { kind: 'name-chord'; root: string; quality: ChordQuality; inversion?: number }
  /** Ti do il nome, suonalo (tastiera o piano vero, arpeggiando). */
  | { kind: 'build-chord'; root: string; quality: ChordQuality }
  /** Ti do il nome, suona la scala in ordine. */
  | { kind: 'build-scale'; root: string; type: ScaleType }
  | { kind: 'build-mode'; root: string; mode: ModeName }
  | { kind: 'build-other'; root: string; scale: OtherScale }
  /** Senti un intervallo o un accordo: cos'era? */
  | { kind: 'ear-interval'; from: string; semitones: number[]; }
  | { kind: 'ear-chord'; root: string; options: ChordQuality[] }
  /** Quanto vale questa figura / che figura è. */
  | { kind: 'value-name'; id: ValueId }
  | { kind: 'value-beats'; id: ValueId; dots?: number }
  /** Quante alterazioni ha questa tonalità. */
  | { kind: 'key-signature'; tonic: string }
  /** Che grado è questo accordo nella tonalità. */
  | { kind: 'degree'; tonic: string; degree: number }
  /**
   * Domanda a scelta multipla scritta a mano: la PRIMA risposta è quella
   * giusta (vengono mescolate a schermo). `explain` si mostra dopo, giusta o
   * sbagliata che sia: è lì che la domanda insegna. `notes` disegna un esempio,
   * `listen` lo fa sentire (`together` = accordo).
   */
  | { kind: 'quiz'; prompt: string; answers: string[]; explain?: string; notes?: string[]; listen?: string[]; together?: boolean }
  /** Leggi la nota sul pentagramma. */
  | { kind: 'read-note'; note: string; clef: 'treble' | 'bass' }
  /** Due note sul pentagramma: che intervallo c'è (contando le righe e gli spazi). */
  | { kind: 'read-interval'; from: string; to: string; clef: 'treble' | 'bass' }
  /** Senti una scala: di che tipo è. */
  | { kind: 'ear-scale'; root: string; options: ScaleType[] };

export interface Lesson {
  id: string;
  title: string;
  /** Una riga: cosa saprai fare dopo. */
  goal: string;
  /** Che cosa serve sapere PRIMA: una frase, non un elenco di sigle. */
  prereq?: string;
  minutes: number;
  blocks: Block[];
  exercises: Exercise[];
  /** Il brano del repertorio a cui la lezione prepara: alla fine si apre. */
  piece?: string;
}

export interface Module {
  id: string;
  title: string;
  emoji: string;
  summary: string;
  lessons: Lesson[];
}

// ── Modulo 1: gli accordi ───────────────────────────────────────────────────

const chordModule: Module = {
  id: 'accordi',
  title: 'Accordi',
  emoji: '🎹',
  summary: 'Si costruiscono impilando gli intervalli sulle note della scala: prima le fondamenta, poi questo modulo.',
  lessons: [
    {
      id: 'acc-2-triadi',
      title: 'Le quattro triadi',
      goal: 'Costruire maggiore, minore, diminuita e aumentata da qualsiasi nota, senza memorizzarle.',
      prereq: 'Gli intervalli: terza maggiore, terza minore, quinta giusta.',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          text: 'Un accordo di tre note si chiama triade. Si costruisce prendendo una nota, saltandone una, prendendo la successiva, saltandone un\'altra e prendendo la terza: 1 – 3 – 5. Sul pentagramma vengono tutte e tre su righe o tutte e tre negli spazi — un piccolo pupazzo di neve.',
        },
        {
          kind: 'text',
          text: 'Do maggiore per esempio: prendi Do, salta il Re, prendi Mi, salta il Fa, prendi Sol. Do-Mi-Sol. Le distanze che ne escono sono una terza maggiore (Do→Mi, 4 semitoni) e sopra una terza minore (Mi→Sol, 3 semitoni).',
        },
        {
          kind: 'key',
          text: 'Cambia solo QUALI terze impili, e ottieni tutti e quattro i tipi di triade. Non sono quattro cose da imparare: è una cosa sola con quattro combinazioni.',
        },
        {
          kind: 'table',
          head: ['Triade', 'Come si costruisce'],
          rows: [
            ['Maggiore', 'terza maggiore + terza minore (4 poi 3 semitoni) — luminosa'],
            ['Minore', 'terza minore + terza maggiore (3 poi 4) — in ombra'],
            ['Diminuita', 'terza minore + terza minore (3 e 3) — instabile, stretta'],
            ['Aumentata', 'terza maggiore + terza maggiore (4 e 4) — sospesa, larga'],
          ],
        },
        {
          kind: 'key',
          text: 'Maggiore e minore hanno gli stessi due mattoni montati in ordine diverso: è UNA nota sola a cambiare, la terza. Ed è quella nota a decidere il carattere dell\'accordo.',
        },
        { kind: 'chord', root: 'C4', quality: 'maggiore', caption: 'Do maggiore — C · Do Mi Sol' },
        { kind: 'chord', root: 'C4', quality: 'minore', caption: 'Do minore — Cm · Do Mi♭ Sol (solo la terza è cambiata)' },
        {
          kind: 'text',
          text: 'Prova a suonarli uno dopo l\'altro tenendo Do e Sol fermi e muovendo solo il dito di mezzo: è tutta lì la differenza fra allegro e malinconico.',
        },
        { kind: 'chord', root: 'C4', quality: 'diminuito', caption: 'Do diminuito — Cdim · anche la quinta si abbassa' },
        { kind: 'chord', root: 'C4', quality: 'aumentato', caption: 'Do aumentato — Caug · la quinta si alza' },
        {
          kind: 'text',
          text: 'Diminuita e aumentata sono fatte di due terze UGUALI (3+3 e 4+4): nessuna nota emerge come fondamentale, e per questo suonano "senza casa" e si usano di passaggio. L\'aumentata è addirittura perfettamente simmetrica — divide l\'ottava in tre parti da 4 semitoni.',
        },
        {
          kind: 'text',
          text: 'Ora la parte che conta davvero: la formula vale da QUALSIASI nota. Su Sol: Sol, salta il La, Si, salta il Do, Re → Sol-Si-Re, e le distanze tornano 4+3, quindi è maggiore. Su La: La-Do-Mi, distanze 3+4, quindi minore.',
        },
        { kind: 'chord', root: 'G3', quality: 'maggiore', caption: 'Sol maggiore — G · Sol Si Re' },
        { kind: 'chord', root: 'A3', quality: 'minore', caption: 'La minore — Am · La Do Mi' },
      ],
      exercises: [
        { kind: 'build-chord', root: 'C4', quality: 'maggiore' },
        { kind: 'build-chord', root: 'A3', quality: 'minore' },
        { kind: 'build-chord', root: 'G3', quality: 'maggiore' },
        { kind: 'build-chord', root: 'E4', quality: 'minore' },
        { kind: 'build-chord', root: 'B3', quality: 'diminuito' },
        { kind: 'name-chord', root: 'G3', quality: 'maggiore' },
        { kind: 'name-chord', root: 'D4', quality: 'minore' },
        { kind: 'name-chord', root: 'F3', quality: 'maggiore' },
        { kind: 'ear-chord', root: 'C4', options: ['maggiore', 'minore'] },
        { kind: 'ear-chord', root: 'F4', options: ['maggiore', 'minore', 'diminuito'] },
        { kind: 'ear-chord', root: 'G3', options: ['maggiore', 'minore', 'aumentato'] },
      ],
    },
    {
      id: 'acc-3-nomi',
      title: 'Come si scrivono: la sigla',
      goal: 'Leggere Cmaj7, Dm7, G7, Bm7♭5 senza esitare.',
      prereq: 'Le quattro triadi.',
      minutes: 5,
      blocks: [
        {
          kind: 'text',
          text: 'Sopra gli spartiti trovi sigle come C, Dm, G7. Si leggono in due pezzi: la LETTERA dice la fondamentale (A=La, B=Si, C=Do, D=Re, E=Mi, F=Fa, G=Sol), il resto dice il tipo.',
        },
        {
          kind: 'table',
          head: ['Sigla', 'Vuol dire'],
          rows: [
            ['C', 'Do maggiore (niente dopo la lettera = maggiore)'],
            ['Cm', 'Do minore'],
            ['C7', 'Do settima di dominante'],
            ['Cmaj7', 'Do settima maggiore (a volte C△ o CM7)'],
            ['Cm7', 'Do settima minore'],
            ['Cdim / C°', 'Do diminuito'],
            ['Cm7♭5 / CØ', 'Do semidiminuito'],
            ['Cdim7 / C°7', 'Do settima diminuita'],
            ['Caug / C+', 'Do aumentato'],
            ['C/E', 'Do maggiore con il MI al basso (primo rivolto)'],
          ],
        },
        {
          kind: 'key',
          text: 'La "m" minuscola è minore. La "maj" riguarda solo la SETTIMA, non la triade: Cmaj7 è un Do maggiore con settima maggiore, mentre C7 è un Do maggiore con settima minore. È la confusione più comune.',
        },
        { kind: 'listen', notes: ['C4', 'E4', 'G4', 'Bb4'], together: true, label: 'C7 — settima minore' },
        { kind: 'listen', notes: ['C4', 'E4', 'G4', 'B4'], together: true, label: 'Cmaj7 — settima maggiore' },
        {
          kind: 'text',
          text: 'La barra merita una riga a parte. In C/E il primo nome è l\'ACCORDO, quello dopo la barra è la nota che va al BASSO: suoni un Do maggiore ma con il Mi come nota più grave. Non è un accordo diverso, è lo stesso in un rivolto.',
        },
        { kind: 'chord', root: 'C4', quality: 'maggiore', inversion: 1, caption: 'C/E — Do maggiore col Mi al basso' },
        {
          kind: 'text',
          text: 'Una lettera da tenere d\'occhio: in questa notazione B è il SI e non il si bemolle. Il si bemolle si scrive B♭ o Bb. È l\'errore più comune di chi arriva dal solfeggio italiano.',
        },
        {
          kind: 'text',
          text: 'Infine i numeri aggiunti che incontrerai spesso: Csus4 sostituisce la terza con la quarta (Do-Fa-Sol, sospeso, vuole risolvere), C6 aggiunge la sesta (Do-Mi-Sol-La, morbido), C9 aggiunge la nona sopra la settima. La logica è sempre la stessa: la sigla dice quali gradi impilare sulla fondamentale.',
        },
        { kind: 'listen', notes: ['C4', 'F4', 'G4'], together: true, label: 'Csus4 — la terza è sostituita dalla quarta' },
        { kind: 'listen', notes: ['C4', 'E4', 'G4'], together: true, label: '…e la risoluzione sul Do maggiore' },
      ],
      exercises: [
        { kind: 'name-chord', root: 'G3', quality: 'settima di dominante' },
        { kind: 'name-chord', root: 'C4', quality: 'settima maggiore' },
        { kind: 'name-chord', root: 'D4', quality: 'settima minore' },
        { kind: 'name-chord', root: 'A3', quality: 'minore' },
        { kind: 'name-chord', root: 'F3', quality: 'maggiore' },
        { kind: 'name-chord', root: 'B3', quality: 'diminuito' },
      ],
    },
    {
      id: 'acc-4-settime',
      title: 'Le settime',
      goal: 'Capire perché una nota in più cambia la funzione dell\'accordo.',
      prereq: 'Le triadi e la sigla.',
      minutes: 7,
      blocks: [
        {
          kind: 'text',
          text: 'Aggiungi una quarta nota impilando un\'altra terza sopra la quinta: nasce l\'accordo di settima. Non è un abbellimento — decide dove l\'accordo vuole andare.',
        },
        {
          kind: 'table',
          head: ['Accordo', 'Formula'],
          rows: [
            ['maj7', '1 · 3 · 5 · 7 — maggiore + settima maggiore: riposo morbido'],
            ['7 (dominante)', '1 · 3 · 5 · ♭7 — maggiore + settima minore: TENSIONE'],
            ['m7', '1 · ♭3 · 5 · ♭7 — minore + settima minore: pacato'],
            ['m7♭5', '1 · ♭3 · ♭5 · ♭7 — semidiminuito: instabile, prepara'],
            ['dim7', '1 · ♭3 · ♭5 · ♭♭7 — tutto simmetrico: va ovunque'],
          ],
        },
        {
          kind: 'key',
          text: 'Nell\'accordo di dominante (G7) fra la terza e la settima c\'è un tritono: tre toni esatti, l\'intervallo più instabile che esista. È lui a chiedere la risoluzione.',
        },
        { kind: 'listen', notes: ['B3', 'F4'], together: true, label: 'Il tritono dentro il G7 (Si + Fa)' },
        { kind: 'listen', notes: ['G3', 'B3', 'D4', 'F4'], together: true, label: 'G7 — senti la tensione' },
        { kind: 'listen', notes: ['C4', 'E4', 'G4'], together: true, label: '…e la risoluzione su Do' },
        { kind: 'chord', root: 'G3', quality: 'settima di dominante', caption: 'G7 — settima di dominante' },
        { kind: 'chord', root: 'C4', quality: 'settima maggiore', caption: 'Cmaj7 — settima maggiore' },
        { kind: 'chord', root: 'D4', quality: 'settima minore', caption: 'Dm7 — settima minore' },
        {
          kind: 'text',
          text: 'Restano due accordi che si incontrano spesso e che spaventano solo per il nome. Il SEMIDIMINUITO (m7♭5) è una triade diminuita con la settima minore: "semi" perché la settima non è diminuita a sua volta. La SETTIMA DIMINUITA (dim7) invece abbassa anche quella, e diventa tre terze minori impilate — tutte le distanze uguali.',
        },
        { kind: 'chord', root: 'B3', quality: 'semidiminuito', caption: 'Bm7♭5 — semidiminuito: il II grado del minore' },
        { kind: 'chord', root: 'B3', quality: 'settima diminuita', caption: 'Bdim7 — settima diminuita: perfettamente simmetrico' },
        {
          kind: 'key',
          text: 'Semidiminuito = diminuito + settima MINORE (m7♭5). Settima diminuita = diminuito + settima DIMINUITA (dim7), cioè tre terze minori una sull\'altra.',
        },
      ],
      exercises: [
        { kind: 'build-chord', root: 'G3', quality: 'settima di dominante' },
        { kind: 'build-chord', root: 'D4', quality: 'settima minore' },
        { kind: 'build-chord', root: 'C4', quality: 'settima maggiore' },
        { kind: 'build-chord', root: 'A3', quality: 'settima minore' },
        { kind: 'ear-chord', root: 'C4', options: ['settima maggiore', 'settima di dominante'] },
        { kind: 'ear-chord', root: 'D4', options: ['settima minore', 'settima di dominante'] },
        { kind: 'name-chord', root: 'B3', quality: 'semidiminuito' },
        { kind: 'name-chord', root: 'B3', quality: 'settima diminuita' },
        { kind: 'name-chord', root: 'E4', quality: 'settima minore' },
      ],
    },
    {
      id: 'acc-5-rivolti',
      title: 'I rivolti',
      goal: 'Suonare lo stesso accordo in più posizioni e scegliere quella che fa muovere meno la mano.',
      prereq: 'Triadi e settime.',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          text: 'Un rivolto è lo stesso accordo con una nota diversa al basso. Si prende la nota più grave e la si porta sopra le altre: le note sono identiche, cambia solo l\'ordine — e quindi cambia quale si sente in fondo.',
        },
        { kind: 'chord', root: 'C4', quality: 'maggiore', inversion: 0, caption: 'Fondamentale (root position) — Do Mi Sol' },
        { kind: 'chord', root: 'C4', quality: 'maggiore', inversion: 1, caption: 'Primo rivolto (1st inversion) — Mi Sol Do' },
        { kind: 'chord', root: 'C4', quality: 'maggiore', inversion: 2, caption: 'Secondo rivolto (2nd inversion) — Sol Do Mi' },
        {
          kind: 'text',
          text: 'Quante posizioni ci sono? Tante quante le note: una triade ne ha 3 (fondamentale, primo, secondo rivolto), un accordo di settima ne ha 4. Dopo l\'ultima si torna alla fondamentale, un\'ottava sopra.',
        },
        {
          kind: 'key',
          text: 'I rivolti non servono a fare colore: servono a non far saltare la mano. È questa la ragione pratica per cui esistono, e il motivo per cui li usi in ogni canzone.',
        },
        {
          kind: 'text',
          text: 'Guarda il caso concreto. Devi suonare Do e poi Fa. In posizione fondamentale sono Do-Mi-Sol e Fa-La-Do: la mano deve saltare di sotto e riposizionarsi tutta.',
        },
        { kind: 'listen', notes: ['C4', 'E4', 'G4'], together: true, label: 'Do fondamentale' },
        { kind: 'listen', notes: ['F4', 'A4', 'C5'], together: true, label: 'Fa fondamentale: la mano è dovuta saltare' },
        {
          kind: 'text',
          text: 'Ora prendi il Fa in SECONDO rivolto: Do-Fa-La. Il Do resta esattamente dov\'era, il Mi si sposta di un semitono al Fa, il Sol sale di un tono al La. Nessun salto: tre dita che si muovono appena.',
        },
        { kind: 'listen', notes: ['C4', 'F4', 'A4'], together: true, label: 'Fa in secondo rivolto: la mano è rimasta ferma' },
        {
          kind: 'key',
          text: 'La regola pratica: fra un accordo e il successivo, scegli il rivolto che tiene ferme più note possibile. Si chiama condotta delle voci, ed è ciò che distingue un accompagnamento che scorre da uno che sobbalza.',
        },
        {
          kind: 'text',
          text: 'Sulla sigla il rivolto si scrive con la barra: C/E vuol dire "accordo di Do con il Mi al basso", F/C è "Fa con il Do al basso". Il nome prima della barra è l\'accordo, quello dopo è la nota più grave.',
        },
        { kind: 'chord', root: 'G3', quality: 'settima di dominante', inversion: 1, caption: 'G7 in primo rivolto — Si Re Fa Sol (G7/B)' },
      ],
      exercises: [
        { kind: 'name-chord', root: 'C4', quality: 'maggiore', inversion: 1 },
        { kind: 'name-chord', root: 'F3', quality: 'maggiore', inversion: 2 },
        { kind: 'name-chord', root: 'G3', quality: 'maggiore', inversion: 1 },
        { kind: 'name-chord', root: 'A3', quality: 'minore', inversion: 1 },
        { kind: 'name-chord', root: 'D4', quality: 'minore', inversion: 2 },
        { kind: 'name-chord', root: 'G3', quality: 'settima di dominante', inversion: 1 },
        { kind: 'build-chord', root: 'F3', quality: 'maggiore' },
        { kind: 'build-chord', root: 'C4', quality: 'maggiore' },
      ],
    },
    {
      id: 'acc-6-progressioni',
      title: 'Progressioni: come si concatenano',
      goal: 'Capire I-IV-V, II-V-I e il giro di blues, e saperli trasportare in qualsiasi tonalità.',
      prereq: 'Gli accordi, e la scala maggiore con i suoi gradi.',
      minutes: 12,
      blocks: [
        {
          kind: 'text',
          text: 'Su ogni grado di una scala si costruisce un accordo usando SOLO le note di quella scala. Prendi il grado, salta una nota, prendi la successiva, salta, prendi: la stessa regola 1-3-5 di prima, ma restando dentro la scala.',
        },
        {
          kind: 'text',
          text: 'Il risultato è che le qualità escono sempre nello stesso ordine, in qualsiasi tonalità. In Do: Do maggiore, Re minore, Mi minore, Fa maggiore, Sol maggiore, La minore, Si diminuito. In Sol sarebbero Sol, Lam, Sim, Do, Re, Mim, Fa♯dim — nomi diversi, stesso schema.',
        },
        { kind: 'degrees', tonic: 'C', mode: 'maggiore' },
        {
          kind: 'key',
          text: 'In maggiore: I, IV e V sono maggiori; ii, iii e vi minori; il vii° diminuito. Siccome vale sempre, gli accordi si indicano con i NUMERI ROMANI invece che coi nomi: maiuscolo = maggiore, minuscolo = minore.',
        },
        {
          kind: 'text',
          text: 'È questo che rende utili i numeri: "I-IV-V" descrive una canzone in qualsiasi tonalità. Impari il giro una volta e lo trasporti dove vuoi, anche mentre stai suonando.',
        },
        { kind: 'progression', id: 'i-iv-v', tonic: 'C' },
        {
          kind: 'text',
          text: 'Perché proprio I, IV e V? Perché fra tutti e tre contengono le sette note della scala: qualsiasi melodia in tonalità si può accompagnare con questi tre accordi. E hanno tre funzioni chiare: il I è casa, il IV se ne allontana, il V crea l\'attesa e chiede di tornare.',
        },
        { kind: 'progression', id: 'i-v-vi-iv', tonic: 'C' },
        { kind: 'progression', id: 'ii-v-i', tonic: 'C' },
        {
          kind: 'key',
          text: 'Nel II-V-I ogni accordo scende di una quinta verso il successivo (Re → Sol → Do). È il movimento più forte che esista in armonia, ed è il motivo per cui questa cellula regge quasi tutto il jazz.',
        },
        { kind: 'progression', id: 'blues', tonic: 'C' },
        {
          kind: 'text',
          text: 'Adesso lo stesso giro base in un\'altra tonalità: gli accordi cambiano nome, i numeri romani no. Confronta con il primo esempio e vedrai che è lo stesso identico schema.',
        },
        { kind: 'progression', id: 'i-iv-v', tonic: 'G' },
        { kind: 'degrees', tonic: 'G', mode: 'maggiore' },
        {
          kind: 'text',
          text: 'Per trasportare basta sapere qual è la scala della nuova tonalità e contarne i gradi. In Sol: I = Sol, IV = Do, V = Re. Ecco perché le lezioni sulle scale venivano prima di questa.',
        },
      ],
      exercises: [
        { kind: 'degree', tonic: 'C', degree: 5 },
        { kind: 'degree', tonic: 'C', degree: 2 },
        { kind: 'degree', tonic: 'C', degree: 6 },
        { kind: 'degree', tonic: 'G', degree: 4 },
        { kind: 'degree', tonic: 'G', degree: 5 },
        { kind: 'degree', tonic: 'F', degree: 1 },
        { kind: 'build-chord', root: 'G3', quality: 'settima di dominante' },
        { kind: 'build-chord', root: 'D4', quality: 'settima minore' },
      ],
    },
  ],
};

// ── Modulo 2: le scale ──────────────────────────────────────────────────────

const scaleModule: Module = {
  id: 'scale',
  title: 'Fondamenta: intervalli e scale',
  emoji: '🪜',
  summary: 'Da qui si comincia: distanze fra le note, scale maggiori e minori, tonalità e modi. Tutto il resto poggia su questo.',
  lessons: [
    {
      id: 'sc-0-intervalli',
      title: 'Gli intervalli: la misura di tutto',
      goal: 'Misurare la distanza fra due note in semitoni: da qui nascono le scale e gli accordi.',
      minutes: 7,
      blocks: [
        {
          kind: 'text',
          text: 'Un accordo non si impara a memoria: si costruisce. E si costruisce impilando INTERVALLI, cioè distanze fra due note. La distanza si misura in semitoni, e un semitono è il tasto immediatamente accanto — nero o bianco che sia.',
        },
        {
          kind: 'key',
          text: 'Terza maggiore = 4 semitoni. Terza minore = 3 semitoni. Quinta giusta = 7 semitoni. Con queste tre misure si costruisce qualsiasi accordo.',
        },
        { kind: 'listen', notes: ['C4', 'E4'], label: 'Terza maggiore (Do → Mi): 4 semitoni' },
        { kind: 'listen', notes: ['C4', 'Eb4'], label: 'Terza minore (Do → Mi♭): 3 semitoni' },
        { kind: 'listen', notes: ['C4', 'G4'], label: 'Quinta giusta (Do → Sol): 7 semitoni' },
        {
          kind: 'text',
          text: 'Il NOME dell\'intervallo conta le lettere da una nota all\'altra (Do-Re-Mi sono tre lettere, quindi "terza"), mentre maggiore/minore/giusta dice la misura esatta in semitoni. Due terze possono avere lo stesso nome e misure diverse: è proprio quella differenza a distinguere un accordo maggiore da uno minore.',
        },
        {
          kind: 'table',
          head: ['Intervallo', 'Semitoni'],
          rows: [
            ['seconda minore', '1 — il tasto immediatamente accanto'],
            ['seconda maggiore', '2 — un tono'],
            ['terza minore', '3'],
            ['terza maggiore', '4'],
            ['quarta giusta', '5'],
            ['tritono', '6 — l\'intervallo instabile per eccellenza'],
            ['quinta giusta', '7'],
            ['sesta maggiore', '9'],
            ['settima minore', '10'],
            ['settima maggiore', '11'],
            ['ottava', '12 — la stessa nota, più acuta'],
          ],
        },
        {
          kind: 'keys',
          highlight: ['C4', 'E4', 'G4'],
          from: 'C4',
          to: 'B4',
          caption: 'Do → Mi sono 4 semitoni (conta i tasti: Do♯, Re, Re♯, Mi). Mi → Sol sono 3.',
        },
        {
          kind: 'text',
          text: 'Conta sempre i SEMITONI, non i tasti bianchi: da Mi a Sol sembrano "tre note" ma sono 3 semitoni, mentre da Do a Mi sembrano anch\'esse tre note e invece sono 4 semitoni. È qui che si sbaglia all\'inizio.',
        },
      ],
      exercises: [
        { kind: 'ear-interval', from: 'C4', semitones: [3, 4] },
        { kind: 'ear-interval', from: 'F4', semitones: [3, 4, 7] },
        { kind: 'ear-interval', from: 'G3', semitones: [4, 7, 12] },
        { kind: 'ear-interval', from: 'D4', semitones: [1, 2, 5] },
        { kind: 'ear-interval', from: 'A3', semitones: [3, 4, 6, 7] },
      ],
    },
    {
      id: 'sc-1-maggiore',
      title: 'La scala maggiore',
      goal: 'Costruire una scala maggiore da qualsiasi nota con una sola formula, e sapere come si chiamano i suoi gradi.',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          text: 'Una scala non è un elenco di note da imparare a memoria: è una sequenza di DISTANZE. Se rispetti quelle distanze puoi partire da qualsiasi tasto e ottenere sempre lo stesso "sapore" di scala maggiore, solo più acuta o più grave.',
        },
        {
          kind: 'key',
          text: 'Tono, tono, semitono, tono, tono, tono, semitono. I due semitoni cadono fra il 3° e il 4° grado e fra il 7° e l\'8°: tutto il resto sono toni.',
        },
        {
          kind: 'text',
          text: 'Un semitono è il tasto immediatamente accanto, senza saltarne nessuno (contando anche i neri). Un tono sono due semitoni. Partiamo dal Do e applichiamo la formula un passo alla volta: Do +tono→ Re +tono→ Mi +SEMItono→ Fa +tono→ Sol +tono→ La +tono→ Si +SEMItono→ Do.',
        },
        {
          kind: 'keys',
          highlight: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          from: 'C4',
          to: 'B5',
          caption: 'Guarda dove NON c\'è un tasto nero in mezzo: fra Mi e Fa, e fra Si e Do. Sono esattamente i due semitoni della formula.',
        },
        { kind: 'staff', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], caption: 'Do maggiore: tutti tasti bianchi' },
        {
          kind: 'text',
          text: 'Ecco perché il Do maggiore è tutto bianco: il pianoforte è costruito con i tasti neri disposti in modo che, partendo dal Do, la formula venga da sé. Partendo da qualsiasi altra nota servirà almeno un tasto nero per rispettarla.',
        },
        {
          kind: 'text',
          text: 'Proviamo dal Sol. Sol +tono→ La +tono→ Si +semitono→ Do +tono→ Re +tono→ Mi… e ora servirebbe un tono prima dell\'ultima nota: da Mi il tono porta a Fa♯, non a Fa. Se usassimo il Fa naturale avremmo un semitono al posto sbagliato e la scala suonerebbe storta.',
        },
        { kind: 'staff', notes: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'], caption: 'Sol maggiore: un diesis, il Fa♯' },
        { kind: 'staff', notes: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'], caption: 'Fa maggiore: un bemolle, il Si♭' },
        {
          kind: 'key',
          text: 'Le alterazioni in armatura non sono un capriccio: sono l\'unico modo di mantenere il disegno TTSTTTS partendo da una nota diversa dal Do.',
        },
        {
          kind: 'text',
          text: 'Ogni grado della scala ha un nome, e non è pedanteria: quei nomi dicono la FUNZIONE della nota, e li ritroverai identici quando costruirai gli accordi.',
        },
        {
          kind: 'table',
          head: ['Grado', 'Nome e funzione'],
          rows: [
            ['1°', 'tonica — la casa, la nota che dà il nome alla scala'],
            ['2°', 'sopratonica — sta appena sopra la tonica'],
            ['3°', 'mediante — sta a metà fra tonica e dominante: è lei a dire se la scala è maggiore o minore'],
            ['4°', 'sottodominante — il polo opposto alla dominante'],
            ['5°', 'dominante — la nota più importante dopo la tonica: crea l\'attesa del ritorno'],
            ['6°', 'sopradominante — sta appena sopra la dominante'],
            ['7°', 'sensibile — a un semitono dalla tonica: "tira" verso casa con forza'],
          ],
        },
        { kind: 'listen', notes: ['C4', 'B4', 'C5'], label: 'Senti la sensibile: il Si non vuole restare fermo, chiede il Do' },
      ],
      exercises: [
        { kind: 'build-scale', root: 'C4', type: 'maggiore' },
        { kind: 'build-scale', root: 'G4', type: 'maggiore' },
        { kind: 'build-scale', root: 'F4', type: 'maggiore' },
        { kind: 'build-scale', root: 'D4', type: 'maggiore' },
        { kind: 'key-signature', tonic: 'G' },
        { kind: 'key-signature', tonic: 'F' },
      ],
    },
    {
      id: 'sc-2-minori',
      title: 'Le tre minori',
      goal: 'Distinguere minore naturale, armonica e melodica, e sapere perché ne esistono tre.',
      prereq: 'La scala maggiore e la sua formula.',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          text: 'Prima di tutto una distinzione che confonde parecchi. Ci sono DUE modi di mettere in relazione una maggiore e una minore, e sono cose diverse.',
        },
        {
          kind: 'table',
          head: ['Relazione', 'Che cosa vuol dire'],
          rows: [
            ['Relativa', 'Stesse note, tonica diversa. Do maggiore e La minore hanno le stesse sette note e la stessa armatura: cambia da dove parti. La relativa minore sta una terza minore SOTTO.'],
            ['Parallela', 'Stessa tonica, note diverse. Do maggiore e Do minore partono entrambe dal Do, ma la minore ha 3ª, 6ª e 7ª abbassate.'],
          ],
        },
        { kind: 'listen', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], label: 'Do maggiore' },
        { kind: 'listen', notes: ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'], label: 'La minore: le STESSE note, ma parte dal La (relativa)' },
        { kind: 'listen', notes: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'], label: 'Do minore: stessa tonica, tre note abbassate (parallela)' },
        {
          kind: 'key',
          text: 'La scala minore naturale è la maggiore con 3ª, 6ª e 7ª abbassate di un semitono. La terza abbassata è quella che si sente di più: è lei a dare il carattere.',
        },
        { kind: 'staff', notes: ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'], caption: 'La minore naturale' },
        {
          kind: 'text',
          text: 'La naturale però ha un difetto pratico. La sua settima (Sol) sta un TONO sotto la tonica, non un semitono: non è una sensibile, non "tira" verso casa. Di conseguenza l\'accordo di dominante viene minore e la chiusura suona debole.',
        },
        { kind: 'listen', notes: ['A3', 'G4', 'A4'], label: 'Naturale: dal Sol al La c\'è un tono, la chiusura è molle' },
        { kind: 'listen', notes: ['A3', 'G#4', 'A4'], label: 'Con il Sol♯: un semitono, e senti che tira' },
        {
          kind: 'key',
          text: 'La minore ARMONICA nasce esattamente per questo: si alza la 7ª di un semitono per avere una vera sensibile. È una scelta armonica, da cui il nome.',
        },
        { kind: 'staff', notes: ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G#4', 'A4'], caption: 'La minore armonica: Sol♯ al posto del Sol' },
        {
          kind: 'text',
          text: 'Ma l\'armonica crea un problema nuovo: fra il 6° e il 7° grado (Fa → Sol♯) restano TRE semitoni, un salto largo e scomodo da cantare. È quel buco a darle il colore un po\' orientale che senti.',
        },
        {
          kind: 'key',
          text: 'La minore MELODICA chiude quel buco alzando anche la 6ª. In salita quindi ha 6ª e 7ª alzate; in discesa, dove la sensibile non serve più, si torna alla naturale.',
        },
        { kind: 'staff', notes: ['A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G#4', 'A4'], caption: 'La minore melodica in salita: Fa♯ e Sol♯' },
        { kind: 'listen', notes: ['A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3'], label: 'Melodica in discesa: torna naturale' },
        {
          kind: 'text',
          text: 'Riassumendo: la naturale è la scala "di base", l\'armonica serve per gli accordi, la melodica per le linee di canto. Non sono tre scale da imparare separatamente — sono una scala con due ritocchi, e ogni ritocco ha un motivo.',
        },
      ],
      exercises: [
        { kind: 'build-scale', root: 'A3', type: 'minore naturale' },
        { kind: 'build-scale', root: 'A3', type: 'minore armonica' },
        { kind: 'build-scale', root: 'A3', type: 'minore melodica' },
        { kind: 'build-scale', root: 'E4', type: 'minore naturale' },
        { kind: 'build-scale', root: 'D4', type: 'minore armonica' },
        { kind: 'build-scale', root: 'C4', type: 'minore naturale' },
        { kind: 'build-scale', root: 'G3', type: 'minore armonica' },
        { kind: 'ear-chord', root: 'A3', options: ['maggiore', 'minore'] },
      ],
    },
    {
      id: 'sc-3-circolo',
      title: 'Il circolo delle quinte',
      goal: 'Ricavare l\'armatura di qualsiasi tonalità in pochi secondi, senza contare i toni ogni volta.',
      prereq: 'La scala maggiore: perché servono le alterazioni.',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          text: 'Hai visto che il Do maggiore non ha alterazioni, il Sol ne ha una, il Fa ne ha una di segno opposto. Non è un caso: c\'è un ordine preciso, e una volta capito non dovrai più contare nulla.',
        },
        {
          kind: 'key',
          text: 'Sali di una QUINTA e aggiungi un diesis. Scendi di una quinta (cioè sali di una quarta) e aggiungi un bemolle.',
        },
        {
          kind: 'text',
          text: 'Do (0) → quinta sopra è Sol (1 diesis) → quinta sopra è Re (2) → La (3) → Mi (4) → Si (5). Nell\'altro senso: Do → quarta sopra è Fa (1 bemolle) → Si♭ (2) → Mi♭ (3) → La♭ (4) → Re♭ (5).',
        },
        { kind: 'circle' },
        {
          kind: 'key',
          text: 'I diesis compaiono SEMPRE in quest\'ordine: Fa Do Sol Re La Mi Si. I bemolli nell\'ordine esattamente inverso: Si Mi La Re Sol Do Fa.',
        },
        {
          kind: 'text',
          text: 'Quindi una tonalità con 3 diesis avrà per forza Fa♯, Do♯ e Sol♯ — i primi tre della fila, mai altri. Una con 2 bemolli avrà Si♭ e Mi♭. Non serve sapere quale tonalità sia: l\'ordine è fisso.',
        },
        {
          kind: 'table',
          head: ['Tonalità', 'Armatura'],
          rows: [
            ['Do maggiore', 'niente'],
            ['Sol maggiore', '1♯ — Fa♯'],
            ['Re maggiore', '2♯ — Fa♯ Do♯'],
            ['La maggiore', '3♯ — Fa♯ Do♯ Sol♯'],
            ['Mi maggiore', '4♯ — Fa♯ Do♯ Sol♯ Re♯'],
            ['Si maggiore', '5♯ — + La♯'],
            ['Fa maggiore', '1♭ — Si♭'],
            ['Si♭ maggiore', '2♭ — Si♭ Mi♭'],
            ['Mi♭ maggiore', '3♭ — Si♭ Mi♭ La♭'],
            ['La♭ maggiore', '4♭ — Si♭ Mi♭ La♭ Re♭'],
            ['Re♭ maggiore', '5♭ — + Sol♭'],
          ],
        },
        {
          kind: 'key',
          text: 'Due scorciatoie per leggere l\'armatura al volo. Con i DIESIS: l\'ultimo diesis è la sensibile, quindi la tonica è un semitono sopra (ultimo diesis Sol♯ → tonalità La). Con i BEMOLLI: il penultimo bemolle È la tonica (bemolli Si♭ Mi♭ La♭ → tonalità Mi♭).',
        },
        {
          kind: 'text',
          text: 'E per i casi limite: un solo bemolle è sempre Fa maggiore (non c\'è un penultimo), e nessuna alterazione è Do maggiore. Sono le due da tenere a mente a parte.',
        },
        {
          kind: 'text',
          text: 'Ogni posizione del circolo ospita DUE tonalità: una maggiore e la sua relativa minore, che condividono la stessa armatura. La relativa minore sta una terza minore sotto la tonica maggiore: Do→La, Sol→Mi, Re→Si, Fa→Re.',
        },
        {
          kind: 'text',
          text: 'In fondo al circolo le due strade si incontrano: Fa♯ maggiore (6 diesis) e Sol♭ maggiore (6 bemolli) sono lo stesso identico suono, scritto in due modi. Si chiamano tonalità enarmoniche, e si sceglie quella che rende lo spartito più leggibile.',
        },
      ],
      exercises: [
        { kind: 'key-signature', tonic: 'D' },
        { kind: 'key-signature', tonic: 'A' },
        { kind: 'key-signature', tonic: 'E' },
        { kind: 'key-signature', tonic: 'Bb' },
        { kind: 'key-signature', tonic: 'Eb' },
        { kind: 'key-signature', tonic: 'Ab' },
        { kind: 'build-scale', root: 'D4', type: 'maggiore' },
        { kind: 'build-scale', root: 'Bb3', type: 'maggiore' },
      ],
    },
    {
      id: 'sc-4-modi',
      title: 'I modi',
      goal: 'Capire i sette modi come una sola scala vista da sette punti di partenza — e saperli descrivere con UNA differenza ciascuno.',
      prereq: 'La scala maggiore.',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          text: 'Suona tutti i tasti bianchi da Re a Re. Sono le note del Do maggiore, ma il centro è cambiato: adesso la nota di riposo è il Re, e il colore è tutto diverso. Questo è il modo dorico.',
        },
        {
          kind: 'key',
          text: 'Un modo è la stessa scala suonata a partire da un grado diverso. Sette gradi, sette modi. Cambia dove cade la "casa", e con essa dove cadono i semitoni rispetto alla tonica.',
        },
        { kind: 'listen', notes: ['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'], label: 'Re dorico — tasti bianchi da Re' },
        { kind: 'listen', notes: ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'], label: 'Mi frigio — tasti bianchi da Mi' },
        { kind: 'listen', notes: ['F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'], label: 'Fa lidio — tasti bianchi da Fa' },
        { kind: 'listen', notes: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'], label: 'Sol misolidio — tasti bianchi da Sol' },
        {
          kind: 'text',
          text: 'Pensarli così però serve poco quando suoni: nessuno improvvisa dicendosi "sono in Do maggiore ma parto dal Re". Molto più utile è il modo PARALLELO: prendi la scala maggiore o minore sulla STESSA tonica e cambia una nota.',
        },
        {
          kind: 'table',
          head: ['Modo', 'Rispetto a maggiore/minore sulla stessa nota'],
          rows: [
            ['Ionico', 'è la scala maggiore, senza modifiche'],
            ['Dorico', 'minore con la 6ª MAGGIORE — minore ma non triste, elegante'],
            ['Frigio', 'minore con la 2ª ABBASSATA — quel semitono iniziale dà il colore spagnolo'],
            ['Lidio', 'maggiore con la 4ª ALZATA — sospeso, luminoso, "da colonna sonora"'],
            ['Misolidio', 'maggiore con la 7ª ABBASSATA — il modo del blues e del rock'],
            ['Eolio', 'è la minore naturale, senza modifiche'],
            ['Locrio', 'minore con 2ª e 5ª abbassate — instabile, quasi inutilizzabile come centro'],
          ],
        },
        {
          kind: 'key',
          text: 'Ogni modo ha UNA nota caratteristica: quella che lo distingue dalla scala maggiore o minore corrispondente. Se la eviti, il modo sparisce e resti in maggiore o minore.',
        },
        { kind: 'listen', notes: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4', 'C5'], label: 'Do dorico: senti il La naturale, la 6ª maggiore' },
        { kind: 'listen', notes: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5'], label: 'Do lidio: senti il Fa♯, la 4ª alzata' },
        { kind: 'listen', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5'], label: 'Do misolidio: senti il Si♭, la 7ª abbassata' },
      ],
      exercises: [
        { kind: 'build-mode', root: 'D4', mode: 'dorico' },
        { kind: 'build-mode', root: 'G4', mode: 'misolidio' },
        { kind: 'build-mode', root: 'E4', mode: 'frigio' },
        { kind: 'build-mode', root: 'F4', mode: 'lidio' },
        { kind: 'build-mode', root: 'C4', mode: 'dorico' },
        { kind: 'build-mode', root: 'C4', mode: 'lidio' },
        { kind: 'build-mode', root: 'A3', mode: 'eolio' },
      ],
    },
    {
      id: 'sc-5-pentatoniche',
      title: 'Pentatoniche, blues, cromatica',
      goal: 'Avere in mano le scale che servono davvero per improvvisare, e capire perché funzionano.',
      prereq: 'Scala maggiore e minore.',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          text: 'Nella scala maggiore ci sono due note "delicate": il 4° grado, che sfrega contro la terza dell\'accordo di tonica, e il 7°, che è a un semitono dalla tonica e chiede subito di risolvere. Togli quelle due e restano cinque note che non litigano con niente.',
        },
        {
          kind: 'key',
          text: 'Pentatonica maggiore = scala maggiore senza il 4° e il 7° grado. Restano 1, 2, 3, 5, 6. È il motivo per cui è la prima scala che si impara per improvvisare: è quasi impossibile suonare una nota "sbagliata".',
        },
        { kind: 'staff', notes: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'], caption: 'Pentatonica maggiore di Do' },
        {
          kind: 'text',
          text: 'La pentatonica minore si ricava allo stesso modo dalla minore naturale, togliendo 2ª e 6ª: restano 1, ♭3, 4, 5, ♭7. E come per le scale intere, ogni pentatonica maggiore ha la sua relativa minore che usa le stesse cinque note.',
        },
        { kind: 'staff', notes: ['A3', 'C4', 'D4', 'E4', 'G4', 'A4'], caption: 'Pentatonica minore di La: le stesse note di quella di Do maggiore' },
        {
          kind: 'key',
          text: 'I cinque tasti NERI del pianoforte sono già una pentatonica (Fa♯ maggiore, o Re♯ minore). Suonali a caso, anche a occhi chiusi: quello che esce ha senso. È il modo più veloce per sentire cosa fa questa scala.',
        },
        {
          kind: 'keys',
          highlight: ['F#4', 'G#4', 'A#4', 'C#5', 'D#5'],
          from: 'C4',
          to: 'B5',
          caption: 'I tasti neri: una pentatonica già pronta sotto le dita',
        },
        {
          kind: 'text',
          text: 'La scala blues è la pentatonica minore più una nota in mezzo: la ♭5, detta "blue note". Non appartiene alla tonalità, e proprio per questo dà quel carattere. Va usata di passaggio, scivolandoci sopra, non per fermarcisi.',
        },
        { kind: 'staff', notes: ['C4', 'Eb4', 'F4', 'Gb4', 'G4', 'Bb4', 'C5'], caption: 'Scala blues di Do: la Sol♭ è la blue note' },
        { kind: 'listen', notes: ['C4', 'Eb4', 'F4', 'Gb4', 'G4', 'Bb4', 'C5'], label: 'Ascolta la blue note fra Fa e Sol' },
        {
          kind: 'text',
          text: 'La cromatica infine usa tutti e dodici i semitoni: non ha tonalità né centro, e proprio per questo non si usa per costruire melodie ma per collegare due note di passaggio — e come esercizio di indipendenza delle dita.',
        },
      ],
      exercises: [
        { kind: 'build-other', root: 'C4', scale: 'pentatonica maggiore' },
        { kind: 'build-other', root: 'A3', scale: 'pentatonica minore' },
        { kind: 'build-other', root: 'G4', scale: 'pentatonica maggiore' },
        { kind: 'build-other', root: 'C4', scale: 'blues' },
        { kind: 'build-other', root: 'E4', scale: 'pentatonica minore' },
        { kind: 'build-other', root: 'F4', scale: 'pentatonica maggiore' },
        { kind: 'build-other', root: 'A3', scale: 'blues' },
      ],
    },
  ],
};

// ── Modulo 3: il ritmo ──────────────────────────────────────────────────────

const rhythmModule: Module = {
  id: 'ritmo',
  title: 'Ritmo e lettura del tempo',
  emoji: '🥁',
  summary: 'Figure, pause, punto, legature, terzine, metro e battute.',
  lessons: [
    {
      id: 'ri-1-figure',
      title: 'Le figure e quanto durano',
      goal: 'Leggere la durata di una nota guardandone la forma, e contarla ad alta voce.',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          text: 'Il pentagramma dice DUE cose insieme. L\'altezza — quanto è acuta la nota — sta nella sua POSIZIONE. La durata — quanto va tenuta — sta nella sua FORMA: testa vuota o piena, con o senza gambo, con o senza codette.',
        },
        {
          kind: 'key',
          text: 'Ogni figura vale la metà della precedente. Non c\'è una tabella da imparare: sapendo da dove si parte, si ricostruisce tutta.',
        },
        { kind: 'values', ids: ['semibreve', 'minima', 'semiminima', 'croma', 'semicroma'], caption: 'Dalla più lunga alla più breve: ogni riga è metà di quella sopra' },
        { kind: 'staff', notes: ['C4', 'C4', 'C4', 'C4'], durations: ['w', 'h', 'q', '8'], caption: 'La stessa nota con quattro durate diverse' },
        {
          kind: 'key',
          text: 'La semiminima è il riferimento: è il BATTITO, quello che batte il piede. Una semibreve dura quattro battiti, una minima due, una croma mezzo.',
        },
        {
          kind: 'text',
          text: 'Contare ad alta voce non è da principianti: è il modo in cui i musicisti imparano davvero il ritmo. Con le semiminime si conta "uno, due, tre, quattro". Con le crome si aggiunge una "e" in mezzo: "uno e, due e, tre e, quattro e".',
        },
        { kind: 'listen', notes: ['C4', 'C4', 'C4', 'C4'], secs: [1, 1, 1, 1], label: 'Quattro semiminime: uno, due, tre, quattro' },
        { kind: 'listen', notes: ['C4', 'C4'], secs: [2, 2], label: 'Due minime: durano il doppio' },
        { kind: 'listen', notes: ['C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4'], secs: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], label: 'Otto crome: uno e, due e, tre e, quattro e' },
        {
          kind: 'text',
          text: 'Nota bene: la durata NON dipende dalla velocità del brano. Una semiminima dura sempre un battito — è quanto dura il battito a cambiare, e lo decide il tempo (i BPM).',
        },
      ],
      exercises: [
        { kind: 'value-name', id: 'semiminima' },
        { kind: 'value-name', id: 'croma' },
        { kind: 'value-name', id: 'semibreve' },
        { kind: 'value-beats', id: 'minima' },
        { kind: 'value-beats', id: 'semibreve' },
        { kind: 'value-beats', id: 'croma' },
      ],
    },
    {
      id: 'ri-2-pause',
      title: 'Le pause',
      goal: 'Riconoscere i silenzi e contarli come si contano le note.',
      prereq: 'Le figure e la loro durata.',
      minutes: 6,
      blocks: [
        {
          kind: 'text',
          text: 'A ogni figura corrisponde una pausa della stessa identica durata. Il silenzio in musica non è assenza di musica: è tempo che scorre, e va contato con la stessa precisione delle note.',
        },
        {
          kind: 'key',
          text: 'Una pausa di semiminima dura un movimento, esattamente come una semiminima suonata. Se smetti di contare durante il silenzio, rientri fuori tempo.',
        },
        {
          kind: 'table',
          head: ['Pausa', 'Come si riconosce'],
          rows: [
            ['Semibreve (4 mov.)', 'rettangolino APPESO sotto la quarta linea'],
            ['Minima (2 mov.)', 'rettangolino APPOGGIATO sopra la terza linea'],
            ['Semiminima (1 mov.)', 'il segno a zigzag, come una "z" allungata'],
            ['Croma (½ mov.)', 'un\'asta obliqua con UNA bandierina'],
            ['Semicroma (¼ mov.)', 'un\'asta obliqua con DUE bandierine'],
          ],
        },
        {
          kind: 'key',
          text: 'Semibreve e minima sono l\'unica coppia che si confonde davvero, perché sono lo stesso rettangolino. "La semibreve PENDE, la minima SIEDE": una sta sotto la linea, l\'altra sopra.',
        },
        {
          kind: 'text',
          text: 'Le codette delle pause seguono la stessa logica delle note: una bandierina per la croma, due per la semicroma, esattamente come una codetta e due codette sulle note corrispondenti. Nulla di nuovo da imparare.',
        },
        {
          kind: 'text',
          text: 'Una nota sola: la pausa di semibreve si usa anche per indicare una battuta INTERA di silenzio, qualunque sia il metro. In un 3/4 una battuta vuota si scrive con la pausa di semibreve anche se la battuta dura tre movimenti, non quattro.',
        },
        { kind: 'listen', notes: ['C4', 'C4'], secs: [1, 1], label: 'Due note di seguito' },
        { kind: 'listen', notes: ['C4', 'C4'], secs: [1, 2], label: 'Con una pausa in mezzo: continua a contare anche nel silenzio' },
      ],
      exercises: [
        { kind: 'value-beats', id: 'semiminima' },
        { kind: 'value-beats', id: 'croma' },
        { kind: 'value-beats', id: 'minima' },
        { kind: 'value-name', id: 'semicroma' },
      ],
    },
    {
      id: 'ri-3-punto',
      title: 'Punto, legature e terzine',
      goal: 'Leggere le durate che non si ottengono dimezzando: puntate, legate e in terzina.',
      prereq: 'Figure e pause.',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          text: 'Dimezzando si ottengono 4, 2, 1, ½, ¼ movimenti. Ma una nota da 3 movimenti? O una che attraversa la stanghetta di battuta? Servono tre strumenti in più.',
        },
        {
          kind: 'key',
          text: 'Il PUNTO dopo una nota aggiunge la METÀ del suo valore. Minima puntata = 2 + 1 = 3 movimenti. Semiminima puntata = 1 + ½ = un movimento e mezzo.',
        },
        {
          kind: 'text',
          text: 'Un secondo punto aggiunge la metà del primo: minima con due punti = 2 + 1 + ½ = 3 e mezzo. Si vede raramente, ma la regola è la stessa e si applica in fila.',
        },
        { kind: 'listen', notes: ['C4', 'E4'], secs: [1.5, 0.5], label: 'Semiminima puntata + croma: il ritmo "lungo-corto" (tà-ta)' },
        {
          kind: 'text',
          text: 'La LEGATURA DI VALORE è un archetto che unisce due note della stessa altezza: si suona una volta sola, tenendola per la somma delle due durate. Serve quando una durata deve attraversare la stanghetta di battuta, dove non si potrebbe scrivere una figura sola.',
        },
        {
          kind: 'key',
          text: 'Attenzione a non confonderla con la legatura di PORTAMENTO, che ha lo stesso aspetto ma unisce note DIVERSE e significa "suona legato, senza staccare". Il modo per distinguerle: guarda se le due note hanno la stessa altezza.',
        },
        {
          kind: 'text',
          text: 'La TERZINA è un gruppo di tre note nel tempo di due: si scrive con un 3 sopra il gruppo. Tre crome in terzina occupano un movimento intero invece di uno e mezzo — quindi ciascuna dura un terzo di movimento.',
        },
        { kind: 'listen', notes: ['C4', 'D4', 'C4', 'D4'], secs: [0.5, 0.5, 0.5, 0.5], label: 'Prima: due crome per movimento (divisione binaria)' },
        { kind: 'listen', notes: ['C4', 'D4', 'E4', 'C4', 'D4', 'E4'], secs: [0.333, 0.333, 0.333, 0.333, 0.333, 0.333], label: 'Poi: tre note nello stesso tempo (terzina)' },
        {
          kind: 'text',
          text: 'Il trucco per contarle: le crome normali si dicono "uno-e, due-e", la terzina si dice "u-no-tre, du-e-tre" — tre sillabe uguali dentro un battito solo.',
        },
      ],
      exercises: [
        { kind: 'value-beats', id: 'minima', dots: 1 },
        { kind: 'value-beats', id: 'semiminima', dots: 1 },
        { kind: 'value-beats', id: 'semibreve', dots: 1 },
        { kind: 'value-beats', id: 'croma', dots: 1 },
      ],
    },
    {
      id: 'ri-4-metro',
      title: 'Tempo, battute e metro',
      goal: 'Capire cosa dicono i due numeri all\'inizio del brano e sentire dove cade l\'accento.',
      prereq: 'Le durate delle figure.',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          text: 'Le stanghette verticali dividono il pentagramma in BATTUTE, tutte della stessa durata. Non è una divisione grafica: serve a dare un punto di riferimento regolare, perché la musica si sente a gruppi, non come una fila indistinta di note.',
        },
        {
          kind: 'key',
          text: 'I due numeri all\'inizio dicono quanto dura una battuta. Il numero SOPRA dice quante unità ci stanno; quello SOTTO dice quale figura è l\'unità: 4 = semiminima, 8 = croma, 2 = minima.',
        },
        {
          kind: 'text',
          text: 'Quindi 3/4 vuol dire "tre semiminime per battuta", 6/8 vuol dire "sei crome per battuta". Il numero sotto non è un denominatore da calcolare: è il nome di una figura, scritto come numero.',
        },
        { kind: 'meter', id: '4/4' },
        { kind: 'meter', id: '3/4' },
        { kind: 'meter', id: '2/4' },
        { kind: 'meter', id: '6/8' },
        {
          kind: 'text',
          text: 'La cosa che conta più dei numeri è l\'ACCENTO: il primo movimento di ogni battuta è naturalmente più pesante. È quello a farti sentire dove ricomincia il ciclo, anche senza guardare lo spartito.',
        },
        { kind: 'listen', notes: ['C5', 'C4', 'C4', 'C4'], secs: [1, 1, 1, 1], label: '4/4: senti il primo movimento più forte (uno, due, tre, quattro)' },
        { kind: 'listen', notes: ['C5', 'C4', 'C4'], secs: [1, 1, 1], label: '3/4, il valzer: uno, due, tre' },
        { kind: 'listen', notes: ['C5', 'C4'], secs: [1, 1], label: '2/4, la marcia: uno, due' },
        {
          kind: 'key',
          text: 'Il 6/8 non si conta in sei: si contano DUE tempi, ciascuno diviso in tre. È questa divisione ternaria a farlo dondolare invece che marciare.',
        },
        { kind: 'listen', notes: ['C5', 'C4', 'C4', 'G4', 'C4', 'C4'], secs: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4], label: '6/8: UNO-due-tre, DUE-due-tre — senti il dondolio' },
        {
          kind: 'text',
          text: 'Ultimo pezzo: il TEMPO (i BPM, battiti al minuto) dice quanto va veloce il battito, ma non cambia le durate scritte. Una semiminima resta un movimento sia a 60 che a 140 BPM: cambia solo quanto dura un movimento.',
        },
      ],
      exercises: [
        { kind: 'value-beats', id: 'semibreve' },
        { kind: 'value-beats', id: 'minima', dots: 1 },
        { kind: 'value-name', id: 'minima' },
        { kind: 'value-name', id: 'semiminima' },
      ],
    },
  ],
};

// L'ordine è il percorso: prima si misura (intervalli), poi si organizzano le
// note (scale e tonalità), poi si impilano (accordi), infine si distribuiscono
// nel tempo (ritmo). Gli accordi DOPO le scale, perché "grado", "terza" e
// "settima" sono definiti rispetto a una scala.
export const modules: Module[] = [scaleModule, chordModule, rhythmModule];

export const allLessons: Lesson[] = modules.flatMap(m => m.lessons);

export function lessonById(id: string): Lesson | undefined {
  return allLessons.find(l => l.id === id);
}

export function moduleOf(lessonId: string): Module | undefined {
  return modules.find(m => m.lessons.some(l => l.id === lessonId));
}
