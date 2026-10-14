// Impostazioni. Le scelte didattiche importanti (suono prima della risposta,
// aiuti automatici, ottava obbligatoria) sono spiegate: sapere PERCHÉ un
// interruttore esiste fa parte dell'imparare.

import { useRef, useState } from 'react';
import { Download, Mic, MicOff, Moon, RotateCcw, Share2, Sun, Upload, Volume2 } from 'lucide-react';
import type { NameStyle } from '../lib/notes';
import { italianOf } from '../lib/notes';
import type { LiveNote } from '../hooks/usePitchDetection';
import type { Settings } from '../lib/storage';
import { exportState, importState } from '../lib/storage';
import type { ProgressApi } from '../hooks/useProgress';
import { Bar, Btn, Card, PageHeader, Panel, Pill, SectionTitle } from './ui';
import { LANGS, setLang, t, useLang } from '../i18n';
import { IMAGE_CREDITS } from '../data/images';
import type { MicRecording, MicStats } from '../lib/micRecorder';
import { recordMic } from '../lib/micRecorder';

interface SettingsViewProps {
  progress: ProgressApi;
  onTestSound: () => void;
  mic: { isListening: boolean; level: number; liveNote: LiveNote | null };
  onToggleMic: () => void;
}

/**
 * Prova del microfono. Stava nella schermata di avvio, dove occupava spazio
 * ogni giorno per una cosa che serve una volta: qui si controlla quando serve.
 */
function MicCheck({ mic, onToggleMic }: Pick<SettingsViewProps, 'mic' | 'onToggleMic'>) {
  const strong = mic.level > 0.3;
  return (
    <Card>
      <SectionTitle>{t('Microfono')}</SectionTitle>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs leading-relaxed text-ink3">
          {t('Con il microfono rispondi suonando sul piano vero, in tutti gli esercizi. Nelle letture una nota alla volta; nei brani anche gli accordi, suonati insieme.')}
        </p>
        <Pill tone={mic.isListening ? (strong ? 'good' : 'warn') : 'neutral'}>
          {mic.isListening ? (strong ? t('segnale pronto') : t('suona una nota')) : t('spento')}
        </Pill>
      </div>
      {mic.isListening && (
        <div className="mt-3 space-y-2">
          <Bar pct={Math.min(1, mic.level)} color={strong ? 'bg-emerald-500' : 'bg-amber-500'} />
          <div className="flex items-center justify-between text-xs text-ink2">
            <span>
              {mic.liveNote ? t('Sento: {note}', { note: `${italianOf(mic.liveNote.name)}${mic.liveNote.octave}` }) : t('In ascolto…')}
            </span>
            <span className="tabular-nums">{t('livello {n}%', { n: Math.round(mic.level * 100) })}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-ink3">
            {t('Suona tre note a volume normale e controlla che il nome sia giusto. Se la barra resta bassa avvicina il telefono; se si muove anche nel silenzio, allontanalo dalla fonte di rumore.')}
          </p>
        </div>
      )}
      <Btn variant={mic.isListening ? 'soft' : 'primary'} full className="mt-3" onClick={onToggleMic}>
        {mic.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {mic.isListening ? t('Spegni il microfono') : t('Accendi e prova')}
      </Btn>
    </Card>
  );
}

/**
 * Registrazione di prova: 20 secondi di suono grezzo dal microfono, con i
 * livelli misurati subito e un WAV da mandare (AirDrop, File) per tarare il
 * riconoscimento sul pianoforte vero.
 */
function MicDiagnosis({ micOn }: { micOn: boolean }) {
  const [state, setState] = useState<'idle' | 'recording' | 'done' | 'error'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [rec, setRec] = useState<MicRecording | null>(null);
  const SECONDS = 20;

  const start = async () => {
    setState('recording');
    setRec(null);
    try {
      const r = await recordMic(SECONDS, (sec, lv) => { setElapsed(sec); setLevel(lv); }, micOn);
      setRec(r);
      setState('done');
    } catch {
      setState('error');
    }
  };

  const summary = (st: MicStats) =>
    t('Rumore di fondo {noise} dB · colpi da {from} a {to} dB ({n}) · picco {peak} dB{clip} · {rate} Hz · {applied}', {
      noise: st.noiseDb,
      from: st.hitsDb[0] ?? '–',
      to: st.hitsDb[st.hitsDb.length - 1] ?? '–',
      n: st.hitsDb.length,
      peak: st.peakDb,
      clip: st.clipped ? ` ${t('(saturato)')}` : '',
      rate: st.sampleRate,
      applied: st.applied,
    });

  const share = async () => {
    if (!rec) return;
    const name = `prova-microfono-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.wav`;
    const file = new File([rec.blob], name, { type: 'audio/wav' });
    const text = summary(rec.stats);
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t('Prova del microfono'), text });
        return;
      }
    } catch {
      /* condivisione annullata: si scarica */
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };

  return (
    <Card>
      <SectionTitle hint={t('per tarare il riconoscimento sul tuo pianoforte')}>{t('Registra una prova')}</SectionTitle>
      <p className="px-1 text-xs leading-relaxed text-ink3">
        {t('Premi Registra, resta in silenzio 3 secondi, poi suona: cinque note piano, cinque note forti, tre accordi e una scala veloce. Dura {s} secondi. Poi manda il file: dentro c\'è solo il suono, e resta sul tuo dispositivo finché non lo condividi tu.', { s: SECONDS })}
      </p>
      {state === 'recording' && (
        <div className="mt-3 space-y-1.5">
          <Bar pct={elapsed / SECONDS} />
          <div className="flex items-center justify-between text-xs text-ink2">
            <span>{elapsed < 3 ? t('Silenzio…') : t('Suona!')}</span>
            <span className="tabular-nums">{t('{s} s · livello {n}%', { s: Math.max(0, Math.ceil(SECONDS - elapsed)), n: Math.round(level * 100) })}</span>
          </div>
        </div>
      )}
      {state === 'done' && rec && (
        <p className="mt-3 rounded-xl bg-surface2 px-3 py-2 text-[12px] leading-relaxed text-ink2">{summary(rec.stats)}</p>
      )}
      {state === 'error' && <p className="mt-3 text-xs text-red-400">{t('Non riesco ad aprire il microfono: controlla il permesso.')}</p>}
      <div className="mt-3 flex gap-2">
        <Btn variant={state === 'done' ? 'soft' : 'primary'} full onClick={start} disabled={state === 'recording'}>
          <Mic className="h-4 w-4" /> {state === 'done' ? t('Registra di nuovo') : t('Registra')}
        </Btn>
        {state === 'done' && rec && (
          <Btn full onClick={share}>
            <Share2 className="h-4 w-4" /> {t('Manda il file')}
          </Btn>
        )}
      </div>
    </Card>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {desc && <p className="mt-0.5 text-[11px] leading-snug text-ink3">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 rounded-full transition-colors ${on ? 'bg-brand' : 'bg-surface2 border border-line'}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`}
      />
    </button>
  );
}

function Choice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-line">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${
            value === o.value ? 'bg-brand text-white' : 'bg-surface2 text-ink2'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NumberStepper({
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        className="h-8 w-8 rounded-lg border border-line bg-surface2 text-lg font-bold text-ink2"
      >
        −
      </button>
      <span className="w-14 text-center text-sm font-bold tabular-nums text-ink">
        {value}
        {suffix}
      </span>
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        className="h-8 w-8 rounded-lg border border-line bg-surface2 text-lg font-bold text-ink2"
      >
        +
      </button>
    </div>
  );
}

export function SettingsView({ progress, onTestSound, mic, onToggleMic }: SettingsViewProps) {
  const { settings, setSettings } = progress;
  const lang = useLang();
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings({ [key]: value });

  const doExport = () => {
    const blob = new Blob([exportState(progress.data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piano-trainer-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(t('Progresso esportato.'));
  };

  const doImport = (file: File) => {
    file
      .text()
      .then(text => {
        const parsed = importState(text);
        if (!parsed) {
          setMessage(t('File non valido.'));
          return;
        }
        progress.replaceState(parsed);
        setMessage(t('Progresso importato.'));
      })
      .catch(() => setMessage(t('Non è stato possibile leggere il file.')));
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('Opzioni')} />
      <Card>
        {/* Il titolo è nelle tre lingue: chi non legge l'italiano deve trovarlo. */}
        <SectionTitle>Lingua · Language · Langue</SectionTitle>
        <div className="mt-2 flex gap-2">
          {LANGS.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => void setLang(l.id)}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                lang === l.id ? 'border-brand bg-brand/15 text-ink' : 'border-line text-ink2'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle>{t('Studio')}</SectionTitle>
        <Row
          title={t('Suona la nota prima della risposta')}
          desc={t('Consigliato spento: se senti la nota prima, alleni l\'orecchio e non la lettura.')}
        >
          <Toggle on={settings.hintSoundBefore} onChange={v => set('hintSoundBefore', v)} />
        </Row>
        <Row title={t('Suona la nota dopo la risposta')} desc={t('Collega il segno scritto al suono reale.')}>
          <Toggle on={settings.soundOnReveal} onChange={v => set('soundOnReveal', v)} />
        </Row>
        <Row title={t('Aiuto automatico')} desc={t('Dopo 6 secondi compare il suggerimento sul riferimento.')}>
          <Toggle on={settings.autoHint} onChange={v => set('autoHint', v)} />
        </Row>
        <Row title={t('Cronometro')} desc={t('La barra che scorre ricorda che conta anche la velocità.')}>
          <Toggle on={settings.showTimer} onChange={v => set('showTimer', v)} />
        </Row>
        <Row title={t('Domande per sessione')} desc={t('Meglio sessioni brevi e frequenti che una lunga.')}>
          <NumberStepper value={settings.sessionLength} min={4} max={30} step={2} onChange={v => set('sessionLength', v)} />
        </Row>
        <Row title={t('Obiettivo giornaliero')} desc={t('Risposte al giorno per tenere viva la serie.')}>
          <NumberStepper value={settings.dailyGoal} min={10} max={200} step={10} onChange={v => set('dailyGoal', v)} />
        </Row>
        <Row title={t('Ottava obbligatoria')} desc={t('Nell\'esercizio sulla tastiera pretende anche l\'ottava esatta.')}>
          <Toggle on={settings.strictOctave} onChange={v => set('strictOctave', v)} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>{t('Aspetto')}</SectionTitle>
        <Row title={t('Tema')}>
          <button
            type="button"
            onClick={() => set('theme', settings.theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface2 px-3 py-1.5 text-xs font-bold text-ink2"
          >
            {settings.theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {settings.theme === 'dark' ? t('Scuro') : t('Chiaro')}
          </button>
        </Row>
        <Row title={t('Nomi delle note')}>
          <Choice<NameStyle>
            value={settings.noteNames}
            onChange={v => set('noteNames', v)}
            options={[
              { value: 'it', label: 'Do Re Mi' },
              { value: 'en', label: 'C D E' },
              { value: 'both', label: t('Entrambi') },
            ]}
          />
        </Row>
        <Row title={t('Etichette sulla tastiera')}>
          <Choice
            value={settings.keyLabels}
            onChange={v => set('keyLabels', v)}
            options={[
              { value: 'all', label: t('Tutte') },
              { value: 'c', label: t('Solo Do') },
              { value: 'none', label: t('Nessuna') },
            ]}
          />
        </Row>
        <Row title={t('Come rispondere')}>
          <Choice
            value={settings.readInput}
            onChange={v => set('readInput', v)}
            options={[
              { value: 'names', label: t('Nomi') },
              { value: 'keys', label: t('Tastiera') },
            ]}
          />
        </Row>
        <Row title={t('Testo grande')} desc={t('Aumenta testi e bersagli tattili senza ingrandire lo spartito.')}>
          <Toggle on={settings.largeText} onChange={v => set('largeText', v)} />
        </Row>
        <Row title={t('Contrasto alto')} desc={t('Rende più nette superfici, linee e stati corretti o sbagliati.')}>
          <Toggle on={settings.highContrast} onChange={v => set('highContrast', v)} />
        </Row>
        <Row title={t('Riduci animazioni')} desc={t('Evita movimenti non essenziali durante lo studio.')}>
          <Toggle on={settings.reducedMotion} onChange={v => set('reducedMotion', v)} />
        </Row>
      </Card>

      <MicCheck mic={mic} onToggleMic={onToggleMic} />
      <MicDiagnosis micOn={mic.isListening} />

      <Card>
        <SectionTitle>{t('Suono e vibrazione')}</SectionTitle>
        <Row
          title={t('Volume {n}%', { n: Math.round(settings.volume * 100) })}
          desc={settings.volume < 0.35 ? t('Basso: è il volume dell\'app, si somma a quello del telefono.') : undefined}
        >
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.volume * 100)}
            onChange={e => set('volume', Number(e.target.value) / 100)}
            className="w-32 accent-[var(--c-brand)]"
            aria-label={t('Volume')}
          />
        </Row>
        <Row
          title={t('Prova il suono')}
          desc={t('Non senti nulla sul telefono? Su iPhone controlla anche l\'interruttore del silenzioso e il volume multimediale.')}
        >
          <Btn variant="soft" onClick={onTestSound} className="px-3 py-2">
            <Volume2 className="h-4 w-4" />
            {t('Prova')}
          </Btn>
        </Row>
        <Row title={t('Metronomo nelle canzoni')} desc={t('Batte il tempo mentre ascolti la melodia.')}>
          <Toggle on={settings.metronome} onChange={v => set('metronome', v)} />
        </Row>
        <Row title={t('Vibrazione')} desc={t('Conferma tattile delle risposte sul telefono.')}>
          <Toggle on={settings.haptics} onChange={v => set('haptics', v)} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>{t('Dati')}</SectionTitle>
        <div className="flex flex-wrap gap-2 pt-1">
          <Btn variant="soft" onClick={doExport}>
            <Download className="h-4 w-4" />
            {t('Esporta')}
          </Btn>
          <Btn variant="soft" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            {t('Importa')}
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) doImport(file);
              e.target.value = '';
            }}
          />
          <Btn
            variant="danger"
            onClick={() => {
              if (window.confirm(t('Azzerare tutto il progresso? Non si può tornare indietro.'))) {
                progress.resetAll();
                setMessage(t('Progresso azzerato.'));
              }
            }}
          >
            <RotateCcw className="h-4 w-4" />
            {t('Azzera')}
          </Btn>
        </div>
        {message && <p className="mt-2 text-xs text-ink2">{message}</p>}
      </Card>

      <Panel className="px-4 py-3 text-[11px] leading-relaxed text-ink3">
        {t('Il progresso resta su questo dispositivo (nessun account, nessun server). Usa Esporta prima di cambiare telefono o cancellare i dati del browser.')}
      </Panel>

      <Card>
        <SectionTitle>{t('Crediti')}</SectionTitle>
        <div className="space-y-2 px-1 text-[12px] leading-relaxed text-ink3">
          <p>
            {t('Partiture complete di Bach, Beethoven, Mozart, Schubert, Schumann e Chopin (op. 10 n. 3, Marcia funebre): dataset ASAP, Foscarin et al., licenza CC BY-NC-SA 4.0.')}
          </p>
          <p>{t('Suono del pianoforte: Salamander Grand Piano.')}</p>
          {IMAGE_CREDITS.length > 0 && (
            <div>
              <p>{t('Immagini (Wikimedia Commons, pubblico dominio o CC0):')}</p>
              <ul className="mt-1 space-y-0.5">
                {IMAGE_CREDITS.map(c => (
                  <li key={c.url}>
                    <a href={c.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:text-ink2">
                      {t(c.what)}
                    </a>{' '}
                    — {t(c.author)} · {t(c.license)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
