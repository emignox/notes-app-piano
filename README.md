# Piano Trainer

App personale (PWA, solo front-end) per imparare a leggere e suonare il pianoforte, pensata per il telefono appoggiato sul leggio. Interfaccia in italiano.

## Come insegna

- **Lettura delle note** con ripetizione spaziata (SM-2 adattato: il voto lo dà il tempo di risposta), interleaving e note di riferimento. Una nota nuova arriva solo quando la precedente è automatica.
- **Diagnosi degli errori**: non solo "sbagliato", ma perché (chiave scambiata, linea/spazio, una linea di troppo, alterazione, ottava). Quando la nota sbagliata torna, l'avviso ricorda l'errore; le coppie che confondi si allenano insieme.
- **Piano di oggi** calcolato dallo stato: ripasso scaduto, nota nuova se sei pronto, teoria (errori da riprendere o prossima lezione), una canzone che sai già leggere.
- **Teoria** a lezioni (spiego, mostro, faccio sentire, ti faccio provare); gli esercizi sbagliati tornano a scatole di Leitner finché non riescono al primo colpo.
- **Ritmo**: lettura ritmica a livelli (figure, pause, crome, punto, controtempo, semicrome), battuta a tempo sullo schermo o con un tasto del piano, misurata in millisecondi sull'orologio audio.
- **Canzoni e pezzi a due mani**, per sezioni e mani separate.
- **Microfono**: rispondi suonando sul piano vero, ovunque. Monofonico (gli accordi si arpeggiano).

## Comandi

```sh
npm install
npm run dev          # sviluppo
npm run build        # controllo dei tipi + build di produzione
npm run lint
npm run check:pezzi  # verifica i dati dei pezzi a due mani
npm run bench:mic    # banco di prova del microfono (macOS)
```

## Banco di prova del microfono

`npm run bench:mic` fa ascoltare al rilevatore (`src/lib/noteTracker.ts`) esecuzioni simulate con un pianoforte vero (i campioni Salamander che l'app usa per suonare): note singole, melodie, ribattute, pedale, bassi con un microfono economico, stanze rumorose, una voce che parla, 30 e 60 fotogrammi al secondo, 44,1 kHz. Conta note giuste, **false**, **doppie** e **perse**, la latenza e la precisione con cui viene datato l'attacco.

Ci sono due gruppi: *taratura* (su cui sono state scelte le soglie) e *convalida* (materiale mai usato per tarare). Per confrontare due versioni del rilevatore:

```sh
git show HEAD:src/lib/noteTracker.ts > /tmp/vecchio.ts
npm run bench:mic -- --tracker=/tmp/vecchio.ts
```

La prima volta scarica i campioni (~2 MB) in `scripts/mic-bench/.cache/` e li decodifica con `afconvert`; la voce di disturbo è generata con `say`.

## Dati

Tutto il progresso sta in `localStorage` (chiave `piano-trainer-v2`): nessun account, nessun server. Da *Opzioni → Dati* si esporta e si importa per cambiare telefono.
