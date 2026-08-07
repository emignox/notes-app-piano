// ─────────────────────────────────────────────────────────────────────────────
// Il dizionario dei termini musicali.
//
// Serve a togliere il non detto: in una spiegazione capita di usare "sensibile"
// o "condotta delle voci" dando per scontato che si sappiano. Qui ogni parola
// difficile ha la sua definizione, e nei testi delle lezioni diventa toccabile.
//
// `aka` elenca le forme in cui la parola compare davvero nei testi (plurali,
// sinonimi, sigle): è quello che permette di riconoscerla mentre si legge.
// `see` collega i termini fra loro, così si può girare da uno all'altro.
// ─────────────────────────────────────────────────────────────────────────────

export interface Term {
  id: string;
  /** Come si intitola la voce. */
  word: string;
  /** Altre forme da riconoscere nel testo (plurali, sinonimi, abbreviazioni). */
  aka?: string[];
  /** Una riga: la definizione minima. */
  short: string;
  /** La spiegazione vera, con il perché. */
  long: string;
  /** Termini collegati. */
  see?: string[];
  /** Un esempio da ascoltare. */
  demo?: { notes: string[]; together?: boolean; label: string };
}

export const glossario: Term[] = [
  // ── Distanze ──────────────────────────────────────────────────────────────
  {
    id: 'semitono',
    word: 'semitono',
    aka: ['semitoni'],
    short: 'La distanza più piccola della musica occidentale: il tasto immediatamente accanto.',
    long: 'Da un tasto al successivo, contando anche i neri, c\'è sempre un semitono. Sul pianoforte due tasti bianchi sono a un semitono solo dove non c\'è un nero in mezzo: fra Mi e Fa, e fra Si e Do. Tutte le altre distanze si misurano contando semitoni.',
    see: ['tono', 'intervallo'],
    demo: { notes: ['C4', 'C#4'], label: 'Do → Do♯: un semitono' },
  },
  {
    id: 'tono',
    word: 'tono',
    aka: ['toni'],
    short: 'Due semitoni.',
    long: 'Un tono equivale a due semitoni: sul pianoforte significa saltare un tasto. Da Do a Re c\'è un tono (in mezzo c\'è il Do♯); da Mi a Fa invece c\'è solo un semitono, perché non c\'è nulla in mezzo.',
    see: ['semitono', 'intervallo'],
    demo: { notes: ['C4', 'D4'], label: 'Do → Re: un tono' },
  },
  {
    id: 'intervallo',
    word: 'intervallo',
    aka: ['intervalli'],
    short: 'La distanza fra due note.',
    long: 'Si indica con due informazioni: un numero, che conta le lettere da una nota all\'altra (Do-Re-Mi = terza), e una qualifica — maggiore, minore, giusta, diminuita, aumentata — che dice la misura esatta in semitoni. Due intervalli possono avere lo stesso numero e misure diverse: la terza Do-Mi vale 4 semitoni, la terza Re-Fa ne vale 3.',
    see: ['semitono', 'terza', 'quinta', 'tritono'],
  },
  {
    id: 'ottava',
    word: 'ottava',
    aka: ['ottave'],
    short: 'Dodici semitoni: la stessa nota, più acuta o più grave.',
    long: 'Due note a un\'ottava di distanza hanno lo stesso nome e suonano "uguali", una più alta. È l\'intervallo più consonante che esista: le frequenze stanno in rapporto esatto 2:1. Sulla tastiera è la distanza da un Do al Do successivo, otto tasti bianchi più in là.',
    see: ['intervallo'],
    demo: { notes: ['C4', 'C5'], label: 'Do → Do: un\'ottava' },
  },
  {
    id: 'tritono',
    word: 'tritono',
    aka: ['tritoni', 'quinta diminuita', 'quarta aumentata'],
    short: 'Sei semitoni, cioè tre toni: l\'intervallo più instabile.',
    long: 'Divide l\'ottava esattamente a metà e non appartiene a nessuna consonanza semplice: per secoli è stato evitato al punto da essere chiamato "diabolus in musica". È il motore dell\'accordo di settima di dominante, dove sta fra la terza e la settima, ed è lui a creare la tensione che chiede di risolvere.',
    see: ['intervallo', 'settima di dominante'],
    demo: { notes: ['B3', 'F4'], together: true, label: 'Si + Fa: il tritono' },
  },
  {
    id: 'terza',
    word: 'terza',
    aka: ['terze', 'terza maggiore', 'terza minore'],
    short: 'L\'intervallo di tre lettere: 4 semitoni se maggiore, 3 se minore.',
    long: 'È l\'intervallo che decide il carattere di un accordo. La terza maggiore (Do-Mi, 4 semitoni) suona aperta; la minore (Do-Mi♭, 3 semitoni) suona raccolta. Gli accordi si costruiscono impilando terze una sull\'altra.',
    see: ['intervallo', 'triade'],
  },
  {
    id: 'quinta',
    word: 'quinta',
    aka: ['quinte', 'quinta giusta'],
    short: 'Sette semitoni: l\'intervallo che dà stabilità.',
    long: 'Dopo l\'ottava è l\'intervallo più consonante, e per questo compare in quasi tutti gli accordi senza cambiarne il carattere. Il circolo delle quinte è costruito proprio su questo intervallo: salendo di quinta in quinta si toccano tutte e dodici le tonalità.',
    see: ['intervallo', 'circolo delle quinte', 'triade'],
  },

  // ── Scale e tonalità ──────────────────────────────────────────────────────
  {
    id: 'scala',
    word: 'scala',
    aka: ['scale'],
    short: 'Una successione ordinata di note dentro un\'ottava, definita dalle sue distanze.',
    long: 'Una scala non è un elenco di note da memorizzare ma una sequenza di distanze: rispettandola si può partire da qualunque nota e ottenere la stessa scala, più acuta o più grave. Le note della scala si chiamano gradi e ognuno ha una funzione.',
    see: ['grado', 'tonica', 'tonalità'],
  },
  {
    id: 'grado',
    word: 'grado',
    aka: ['gradi'],
    short: 'La posizione di una nota dentro la scala, contata dalla tonica.',
    long: 'Il primo grado è la tonica, il quinto la dominante, e così via. Si indicano con numeri romani (I, ii, V…) perché in questo modo una formula vale in tutte le tonalità: I-IV-V descrive lo stesso giro sia in Do sia in Sol.',
    see: ['tonica', 'dominante', 'numeri romani'],
  },
  {
    id: 'tonica',
    word: 'tonica',
    short: 'Il primo grado: la nota di riposo, quella che dà il nome alla tonalità.',
    long: 'È il centro di gravità di un brano: la nota su cui tutto tende a tornare e su cui una melodia suona "finita". Se canticchi una canzone e ti fermi a caso, la nota che senti mancare è quasi sempre la tonica.',
    see: ['grado', 'dominante', 'tonalità'],
  },
  {
    id: 'dominante',
    word: 'dominante',
    short: 'Il quinto grado: la nota (e l\'accordo) che crea l\'attesa del ritorno alla tonica.',
    long: 'Dopo la tonica è il grado più importante. L\'accordo costruito sul quinto grado, soprattutto con la settima aggiunta, contiene un tritono e chiede con forza di risolvere sulla tonica: è il meccanismo su cui poggia quasi tutta la musica tonale.',
    see: ['tonica', 'grado', 'settima di dominante', 'cadenza'],
  },
  {
    id: 'sensibile',
    word: 'sensibile',
    short: 'Il settimo grado quando sta un semitono sotto la tonica.',
    long: 'Essendo vicinissima alla tonica, "tira" verso di essa con forza: è la nota che fa sentire l\'arrivo a casa. Nella scala minore naturale il settimo grado sta un tono sotto e quindi non è una sensibile — ed è esattamente il motivo per cui esiste la minore armonica, che lo alza di un semitono.',
    see: ['tonica', 'minore armonica', 'grado'],
    demo: { notes: ['B4', 'C5'], label: 'Si → Do: la sensibile che risolve' },
  },
  {
    id: 'sottodominante',
    word: 'sottodominante',
    short: 'Il quarto grado: si allontana dalla tonica senza creare tensione.',
    long: 'Insieme a tonica e dominante forma il terzetto di accordi (I, IV, V) con cui si armonizza qualsiasi melodia in tonalità. Rispetto alla dominante, che tira verso casa, la sottodominante apre e allarga.',
    see: ['dominante', 'tonica', 'grado'],
  },
  {
    id: 'mediante',
    word: 'mediante',
    short: 'Il terzo grado, a metà strada fra tonica e dominante.',
    long: 'È la nota che dice se la tonalità è maggiore o minore, perché è la terza dell\'accordo di tonica. Da sola come accordo si usa poco: è più un colore di passaggio.',
    see: ['grado', 'terza'],
  },
  {
    id: 'tonalità',
    word: 'tonalità',
    aka: ['tonalità maggiore', 'tonalità minore'],
    short: 'L\'insieme formato da una tonica e dalla scala che le gira attorno.',
    long: 'Dire "siamo in Sol maggiore" significa che il centro è il Sol e che si useranno le note della scala di Sol maggiore, con il Fa♯ in armatura. La tonalità stabilisce quali note suonano "di casa" e quali suonano estranee.',
    see: ['tonica', 'armatura', 'scala'],
  },
  {
    id: 'armatura',
    word: 'armatura',
    aka: ['armatura di chiave', 'alterazioni in chiave'],
    short: 'I diesis o bemolle scritti all\'inizio del pentagramma, validi per tutto il brano.',
    long: 'Invece di ripetere l\'alterazione ogni volta, la si dichiara una volta sola dopo la chiave. I diesis compaiono sempre nell\'ordine Fa Do Sol Re La Mi Si, i bemolli nell\'ordine inverso: quindi il loro numero identifica la tonalità senza ambiguità.',
    see: ['tonalità', 'circolo delle quinte', 'alterazione'],
  },
  {
    id: 'alterazione',
    word: 'alterazione',
    aka: ['alterazioni', 'diesis', 'bemolle', 'bequadro'],
    short: 'Un segno che alza o abbassa una nota di un semitono.',
    long: 'Il diesis (♯) alza di un semitono, il bemolle (♭) abbassa, il bequadro (♮) annulla e riporta la nota naturale. Esistono anche il doppio diesis (♯♯) e il doppio bemolle (♭♭), che spostano di due semitoni: servono quando la scrittura corretta lo richiede, per esempio nella settima dell\'accordo diminuito.',
    see: ['armatura', 'enarmonia', 'semitono'],
  },
  {
    id: 'enarmonia',
    word: 'enarmonia',
    aka: ['enarmonico', 'enarmoniche', 'enarmonica'],
    short: 'Stesso suono, scrittura diversa: Do♯ e Re♭ sono lo stesso tasto.',
    long: 'La scelta fra le due scritture non è arbitraria: dipende dalla tonalità e dalla funzione della nota. In Fa maggiore la quarta nota si scrive Si♭ e non La♯, perché una scala deve usare ogni lettera una volta sola. Anche intere tonalità possono essere enarmoniche: Fa♯ maggiore e Sol♭ maggiore suonano identiche.',
    see: ['alterazione', 'circolo delle quinte'],
  },
  {
    id: 'circolo delle quinte',
    word: 'circolo delle quinte',
    aka: ['circolo'],
    short: 'Lo schema che ordina le dodici tonalità per numero di alterazioni.',
    long: 'Salendo di una quinta si aggiunge un diesis, scendendo di una quinta (cioè salendo di una quarta) si aggiunge un bemolle. Do non ha alterazioni, Sol ne ha una, Re due… e dall\'altra parte Fa ha un bemolle, Si♭ due. Serve per sapere a colpo d\'occhio l\'armatura di qualsiasi tonalità e per capire quali tonalità sono "vicine" fra loro.',
    see: ['armatura', 'quinta', 'tonalità'],
  },
  {
    id: 'relativa',
    word: 'relativa',
    aka: ['relativa minore', 'relativa maggiore'],
    short: 'La tonalità che condivide la stessa armatura ma ha un\'altra tonica.',
    long: 'Do maggiore e La minore hanno le stesse sette note e la stessa armatura: cambia solo quale nota fa da centro. La relativa minore sta una terza minore sotto la tonica maggiore. Da non confondere con la parallela, che ha la stessa tonica ma note diverse.',
    see: ['parallela', 'tonalità', 'armatura'],
  },
  {
    id: 'parallela',
    word: 'parallela',
    aka: ['parallelo'],
    short: 'La tonalità con la stessa tonica ma modo opposto: Do maggiore e Do minore.',
    long: 'A differenza della relativa, qui la tonica resta la stessa e cambiano le note: passando da Do maggiore a Do minore si abbassano terza, sesta e settima. È il modo più diretto per sentire la differenza fra maggiore e minore, perché il punto di riferimento non si sposta.',
    see: ['relativa', 'tonalità'],
  },
  {
    id: 'modo',
    word: 'modo',
    aka: ['modi', 'modale'],
    short: 'La stessa scala suonata a partire da un grado diverso, con un altro centro.',
    long: 'Suonando i tasti bianchi da Re a Re si ottengono le note del Do maggiore ma con il Re come centro: è il modo dorico. I sette modi (ionico, dorico, frigio, lidio, misolidio, eolio, locrio) si descrivono meglio come scala maggiore o minore con una nota cambiata: il dorico è un minore con la sesta maggiore, il lidio un maggiore con la quarta alzata.',
    see: ['scala', 'grado'],
  },
  {
    id: 'minore armonica',
    word: 'minore armonica',
    short: 'La scala minore con il settimo grado alzato, per avere una vera sensibile.',
    long: 'Nella minore naturale la settima sta un tono sotto la tonica e la chiusura suona debole. Alzandola di un semitono si ottiene una sensibile e l\'accordo di dominante diventa maggiore, capace di risolvere. Il prezzo è un salto di tre semitoni fra sesto e settimo grado, che dà a questa scala il suo colore inconfondibile.',
    see: ['sensibile', 'minore melodica', 'dominante'],
  },
  {
    id: 'minore melodica',
    word: 'minore melodica',
    short: 'La minore con sesta e settima alzate in salita, naturale in discesa.',
    long: 'Nasce per risolvere il salto scomodo della minore armonica: alzando anche la sesta la linea torna scorrevole da cantare. In discesa, dove la spinta della sensibile non serve più, si torna alla minore naturale. È una scala nata dal canto, non dalla teoria.',
    see: ['minore armonica', 'sensibile'],
  },
  {
    id: 'pentatonica',
    word: 'pentatonica',
    aka: ['pentatoniche'],
    short: 'Una scala di cinque note, senza i gradi che creano attrito.',
    long: 'La pentatonica maggiore è la scala maggiore senza quarto e settimo grado: restano cinque note che stanno bene su quasi tutto, ed è per questo la prima scala per improvvisare. I cinque tasti neri del pianoforte formano già una pentatonica.',
    see: ['scala', 'blue note'],
  },
  {
    id: 'blue note',
    word: 'blue note',
    aka: ['blues'],
    short: 'La quinta abbassata aggiunta alla pentatonica minore.',
    long: 'Non appartiene alla tonalità, e proprio per questo dà il carattere del blues. Funziona di passaggio, scivolandoci sopra fra la quarta e la quinta: fermarcisi la fa suonare semplicemente stonata.',
    see: ['pentatonica'],
  },
  {
    id: 'cromatica',
    word: 'cromatica',
    aka: ['cromatico', 'scala cromatica'],
    short: 'La scala che usa tutti e dodici i semitoni.',
    long: 'Non ha tonalità né centro, perché tutte le distanze sono uguali. Non si usa per costruire melodie ma per collegare due note di passaggio, e come esercizio di indipendenza delle dita.',
    see: ['semitono', 'scala'],
  },
  {
    id: 'trasporto',
    word: 'trasporto',
    aka: ['trasportare', 'trasposizione'],
    short: 'Spostare un brano in un\'altra tonalità mantenendo tutti i rapporti.',
    long: 'Le distanze fra le note restano identiche, cambia solo il punto di partenza: una melodia trasportata è riconoscibile come la stessa, solo più acuta o più grave. Ragionare in numeri romani rende il trasporto immediato, perché I-IV-V resta I-IV-V in qualsiasi tonalità.',
    see: ['numeri romani', 'tonalità'],
  },

  // ── Accordi ───────────────────────────────────────────────────────────────
  {
    id: 'accordo',
    word: 'accordo',
    aka: ['accordi'],
    short: 'Più note suonate insieme, costruite impilando terze.',
    long: 'Si parte da una fondamentale e si aggiungono note a distanza di terza: tre note fanno una triade, quattro un accordo di settima. La sigla scritta sopra il pentagramma dice quali gradi impilare.',
    see: ['triade', 'fondamentale', 'sigla'],
  },
  {
    id: 'triade',
    word: 'triade',
    aka: ['triadi'],
    short: 'Un accordo di tre note: fondamentale, terza e quinta.',
    long: 'Cambiando il tipo di terze si ottengono i quattro tipi: maggiore (4+3 semitoni), minore (3+4), diminuita (3+3), aumentata (4+4). Sul pentagramma le tre note stanno tutte su righe o tutte negli spazi.',
    see: ['accordo', 'terza', 'quinta'],
  },
  {
    id: 'fondamentale',
    word: 'fondamentale',
    short: 'La nota che dà il nome all\'accordo e da cui si contano le altre.',
    long: 'In un accordo di Do maggiore la fondamentale è il Do. Non deve per forza essere la nota più grave: quando al basso c\'è un\'altra nota dell\'accordo si parla di rivolto, ma la fondamentale resta quella.',
    see: ['accordo', 'rivolto'],
  },
  {
    id: 'rivolto',
    word: 'rivolto',
    aka: ['rivolti', 'inversion', 'inversione'],
    short: 'Lo stesso accordo con una nota diversa al basso.',
    long: 'Si prende la nota più grave e la si porta sopra le altre: le note sono le stesse, cambia l\'ordine. Una triade ha tre posizioni (fondamentale, primo e secondo rivolto), un accordo di settima quattro. Servono soprattutto a far muovere meno la mano nel passaggio da un accordo all\'altro.',
    see: ['fondamentale', 'condotta delle voci', 'sigla'],
  },
  {
    id: 'settima di dominante',
    word: 'settima di dominante',
    aka: ['accordo di dominante', 'settima'],
    short: 'Accordo maggiore con la settima minore: crea tensione e vuole risolvere.',
    long: 'Si costruisce sul quinto grado (in Do è Sol-Si-Re-Fa). Fra la terza e la settima si forma un tritono, l\'intervallo più instabile: è lui a chiedere la risoluzione sulla tonica. È il motore dell\'armonia tonale.',
    see: ['dominante', 'tritono', 'cadenza'],
  },
  {
    id: 'semidiminuito',
    word: 'semidiminuito',
    aka: ['m7♭5', 'm7b5'],
    short: 'Triade diminuita con la settima minore: si scrive m7♭5 o ø.',
    long: '"Semi" perché la settima è minore e non a sua volta diminuita. È il secondo grado delle tonalità minori e apre il II-V-I minore, il giro più comune del jazz in tonalità minore.',
    see: ['accordo', 'settima diminuita'],
  },
  {
    id: 'settima diminuita',
    word: 'settima diminuita',
    aka: ['dim7'],
    short: 'Tre terze minori impilate: l\'accordo perfettamente simmetrico.',
    long: 'Divide l\'ottava in quattro parti uguali, quindi ogni sua nota può fare da fondamentale: ne esistono solo tre diversi in tutta la musica. Proprio per questo può portare quasi ovunque e si usa come accordo di passaggio.',
    see: ['semidiminuito', 'accordo'],
  },
  {
    id: 'sigla',
    word: 'sigla',
    aka: ['sigle', 'siglatura'],
    short: 'La notazione con le lettere: C, Dm, G7, Cmaj7.',
    long: 'La lettera indica la fondamentale (A=La, B=Si, C=Do, D=Re, E=Mi, F=Fa, G=Sol), quello che segue indica il tipo di accordo. La barra indica il basso: C/E è un Do maggiore con il Mi al basso. Attenzione: B è il Si, il si bemolle si scrive B♭.',
    see: ['accordo', 'rivolto'],
  },
  {
    id: 'arpeggio',
    word: 'arpeggio',
    aka: ['arpeggi', 'arpeggiare', 'arpeggiato', 'arpeggiando'],
    short: 'Le note di un accordo suonate una dopo l\'altra invece che insieme.',
    long: 'Stesso materiale di un accordo, distribuito nel tempo. È il modo più comune di accompagnare al pianoforte, e allena la mano a conoscere l\'accordo nota per nota.',
    see: ['accordo'],
  },
  {
    id: 'progressione',
    word: 'progressione',
    aka: ['progressioni', 'giro armonico', 'giro'],
    short: 'Una successione di accordi che si ripete e regge un brano.',
    long: 'Si indica con i numeri romani dei gradi, così vale in ogni tonalità: I-IV-V, II-V-I, il giro di blues. Le progressioni funzionano perché alternano accordi che allontanano dalla tonica e accordi che ci riportano.',
    see: ['numeri romani', 'cadenza', 'grado'],
  },
  {
    id: 'numeri romani',
    word: 'numeri romani',
    aka: ['numero romano', 'gradi in numeri romani'],
    short: 'Il modo di indicare gli accordi per grado invece che per nome.',
    long: 'Maiuscolo per gli accordi maggiori (I, IV, V), minuscolo per i minori (ii, iii, vi), con ° per i diminuiti. Il vantaggio è che la stessa formula descrive il giro in tutte le tonalità: I-IV-V in Do è Do-Fa-Sol, in Sol è Sol-Do-Re.',
    see: ['grado', 'progressione', 'trasporto'],
  },
  {
    id: 'cadenza',
    word: 'cadenza',
    aka: ['cadenze', 'risoluzione', 'risolvere'],
    short: 'La formula di accordi che chiude una frase musicale.',
    long: 'La più forte è V-I, dalla dominante alla tonica: la tensione del tritono si scioglie e si sente l\'arrivo. Esistono anche chiusure sospese (finire sul V) e la cadenza d\'inganno, che invece del I va sul VI e lascia la frase aperta.',
    see: ['dominante', 'tonica', 'progressione'],
  },
  {
    id: 'condotta delle voci',
    word: 'condotta delle voci',
    aka: ['voice leading'],
    short: 'Muovere ogni voce il meno possibile passando da un accordo all\'altro.',
    long: 'Se fra due accordi ci sono note in comune conviene tenerle ferme e spostare le altre di poco: l\'accompagnamento scorre invece di sobbalzare, e la mano fatica molto meno. È la ragione pratica per cui esistono i rivolti.',
    see: ['rivolto', 'accordo'],
  },
  {
    id: 'diatonico',
    word: 'diatonico',
    aka: ['diatonica', 'diatoniche'],
    short: 'Che usa solo le note della scala, senza alterazioni estranee.',
    long: 'Gli accordi diatonici di una tonalità sono i sette che si costruiscono sui gradi della sua scala usando solo le note di quella scala. Il contrario è cromatico: una nota o un accordo che viene da fuori.',
    see: ['scala', 'grado', 'cromatica'],
  },

  // ── Lettura e ritmo ───────────────────────────────────────────────────────
  {
    id: 'pentagramma',
    word: 'pentagramma',
    aka: ['pentagrammi', 'rigo'],
    short: 'Le cinque linee su cui si scrive la musica.',
    long: 'La posizione della nota sulle linee e negli spazi indica l\'altezza; la sua forma indica la durata. Quale altezza corrisponda a quale posizione lo stabilisce la chiave scritta all\'inizio.',
    see: ['chiave', 'linea aggiuntiva'],
  },
  {
    id: 'chiave',
    word: 'chiave',
    aka: ['chiave di violino', 'chiave di basso', 'chiavi'],
    short: 'Il segno che stabilisce quale nota corrisponde a quale linea.',
    long: 'La chiave di violino (o di Sol) si usa per i suoni acuti, di solito la mano destra: il suo ricciolo abbraccia la seconda linea, che è il Sol. La chiave di basso (o di Fa) si usa per i gravi, di solito la mano sinistra: i suoi due punti circondano la quarta linea, che è il Fa.',
    see: ['pentagramma'],
  },
  {
    id: 'linea aggiuntiva',
    word: 'linea aggiuntiva',
    aka: ['linee aggiuntive', 'tagli addizionali'],
    short: 'Trattini corti che prolungano il pentagramma per le note fuori dalle cinque linee.',
    long: 'Il Do centrale in chiave di violino sta su una linea aggiuntiva sotto il pentagramma. Servono a scrivere note troppo acute o troppo gravi senza cambiare chiave, ma oltre due o tre diventano difficili da leggere.',
    see: ['pentagramma', 'chiave'],
  },
  {
    id: 'battuta',
    word: 'battuta',
    aka: ['battute', 'misura', 'stanghetta'],
    short: 'Il segmento di musica fra due stanghette verticali.',
    long: 'Tutte le battute di un brano durano lo stesso numero di movimenti, stabilito dal metro. Servono a dare un riferimento regolare: la musica si percepisce a gruppi, e il primo movimento di ogni battuta è naturalmente accentato.',
    see: ['metro', 'movimento'],
  },
  {
    id: 'metro',
    word: 'metro',
    aka: ['tempo semplice', 'indicazione di tempo', 'metri'],
    short: 'I due numeri a inizio brano: quante unità per battuta e quale figura è l\'unità.',
    long: 'In 3/4 ci stanno tre semiminime per battuta; in 6/8 sei crome. Il numero sotto non è un denominatore da calcolare: è il nome di una figura scritto come numero (4 = semiminima, 8 = croma). Il metro determina anche dove cadono gli accenti.',
    see: ['battuta', 'movimento'],
  },
  {
    id: 'movimento',
    word: 'movimento',
    aka: ['movimenti', 'battito', 'battiti'],
    short: 'L\'unità di tempo che si conta e che il piede batte.',
    long: 'Nei metri con il 4 sotto un movimento è una semiminima. Quanto dura in secondi lo decide il tempo, misurato in BPM: le durate scritte non cambiano, cambia solo la velocità con cui scorrono.',
    see: ['metro', 'bpm'],
  },
  {
    id: 'bpm',
    word: 'BPM',
    aka: ['battiti al minuto', 'metronomo'],
    short: 'Battiti al minuto: quanto va veloce il brano.',
    long: 'A 60 BPM un movimento dura un secondo esatto; a 120 mezzo secondo. Cambiare i BPM non cambia le figure scritte: una semiminima resta un movimento. Studiare lentamente e alzare i BPM poco alla volta è il modo più efficace di imparare un pezzo.',
    see: ['movimento', 'metro'],
  },
  {
    id: 'punto di valore',
    word: 'punto di valore',
    aka: ['puntata', 'puntato', 'punto'],
    short: 'Il punto dopo una nota ne aumenta la durata della metà.',
    long: 'Una minima vale 2 movimenti, puntata ne vale 3. Una semiminima puntata vale un movimento e mezzo. Un secondo punto aggiunge la metà del primo. Serve per ottenere durate che dimezzando non si otterrebbero.',
    see: ['movimento', 'legatura di valore'],
  },
  {
    id: 'legatura di valore',
    word: 'legatura di valore',
    aka: ['legatura', 'legature'],
    short: 'Archetto che unisce due note della stessa altezza: si suonano come una sola.',
    long: 'Le durate si sommano e la nota si tiene per tutto il tempo. Serve soprattutto quando una durata deve attraversare la stanghetta di battuta, dove non si potrebbe scrivere con una figura sola. Da non confondere con la legatura di portamento, che unisce note diverse e significa "suona legato".',
    see: ['punto di valore', 'battuta'],
  },
  {
    id: 'terzina',
    word: 'terzina',
    aka: ['terzine'],
    short: 'Tre note nel tempo di due, segnate con un 3.',
    long: 'Divide un movimento in tre parti uguali invece che in due: tre crome in terzina occupano un movimento intero. Si conta dicendo tre sillabe uguali dentro un battito solo, invece del solito "uno-e".',
    see: ['movimento'],
  },
  {
    id: 'sincope',
    word: 'sincope',
    aka: ['sincopato', 'sincopi'],
    short: 'Un accento spostato su un tempo debole.',
    long: 'Invece di cadere sul movimento forte, il suono comincia fra un movimento e l\'altro e prosegue oltre: si crea una spinta in avanti, ed è alla base del ritmo di gran parte della musica moderna.',
    see: ['movimento', 'battuta'],
  },

  // ── Pratica strumentale ───────────────────────────────────────────────────
  {
    id: 'diteggiatura',
    word: 'diteggiatura',
    aka: ['diteggiature'],
    short: 'Quale dito usare per ogni nota. Le dita si numerano da 1 (pollice) a 5 (mignolo).',
    long: 'Non è un dettaglio: in una scala è il vero contenuto dell\'esercizio. Una buona diteggiatura evita di dover spostare la mano di scatto e mette il pollice sempre su tasti comodi — di norma mai su un tasto nero.',
    see: ['passaggio del pollice'],
  },
  {
    id: 'passaggio del pollice',
    word: 'passaggio del pollice',
    aka: ['pollice sotto', 'passaggio'],
    short: 'Far scivolare il pollice sotto la mano per continuare la scala senza interruzioni.',
    long: 'È il movimento che permette di suonare più di cinque note di seguito. Va preparato in anticipo, ruotando leggermente il polso mentre le altre dita suonano: se lo si fa all\'ultimo momento si sente un buco nel suono.',
    see: ['diteggiatura'],
  },
  {
    id: 'legato',
    word: 'legato',
    short: 'Suonare le note senza stacchi, una attaccata all\'altra.',
    long: 'Ogni tasto si lascia solo nell\'istante in cui si preme il successivo, così il suono non si interrompe mai. Sul pentagramma si indica con un archetto fra note di altezza diversa (legatura di portamento).',
    see: ['legatura di valore'],
  },
];

const byId = new Map(glossario.map(t => [t.id, t]));
export const termById = (id: string): Term | undefined => byId.get(id);

/**
 * Tutte le forme riconoscibili, dalla più lunga alla più corta: cercando prima
 * "settima di dominante" si evita di agganciare solo "settima".
 */
export const termForms: { form: string; id: string }[] = glossario
  .flatMap(t => [t.word, ...(t.aka ?? [])].map(form => ({ form, id: t.id })))
  .sort((a, b) => b.form.length - a.form.length);
