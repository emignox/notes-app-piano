// ─────────────────────────────────────────────────────────────────────────────
// Tipo di sessione audio (solo Safari/WebKit, iOS 17+).
//
// Serve a non farsi zittire dall'interruttore del silenzioso dell'iPhone: senza
// dichiarare nulla il Web Audio nasce "ambient" e il silenzioso lo spegne.
//
// ATTENZIONE alla scelta del tipo: "playback" dice al sistema che l'app SOLO
// riproduce, e con quella dichiarazione WebKit nega il microfono. Quando il
// microfono serve si deve dichiarare "play-and-record", che permette entrambe
// le cose e continua a ignorare il silenzioso.
//
// Lo stato sta qui, in un posto solo, perché i due hook (suono e microfono) non
// devono sovrascriversi a vicenda: chi riproduce non deve poter riportare la
// sessione a "playback" mentre il microfono è aperto.
// ─────────────────────────────────────────────────────────────────────────────

interface AudioSessionNavigator extends Navigator {
  audioSession?: { type: string };
}

let micOpen = false;

function apply() {
  try {
    const nav = navigator as AudioSessionNavigator;
    if (!nav.audioSession) return; // altrove non esiste: non serve
    nav.audioSession.type = micOpen ? 'play-and-record' : 'playback';
  } catch {
    /* tipo non supportato: si resta col comportamento di default */
  }
}

/** Da chiamare prima di riprodurre suono. Non tocca nulla se il mic è aperto. */
export function claimAudioSession() {
  apply();
}

/** Da chiamare quando il microfono si apre o si chiude. */
export function setMicSession(open: boolean) {
  micOpen = open;
  apply();
}
