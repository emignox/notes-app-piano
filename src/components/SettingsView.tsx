// Impostazioni. Le scelte didattiche importanti (suono prima della risposta,
// aiuti automatici, ottava obbligatoria) sono spiegate: sapere PERCHÉ un
// interruttore esiste fa parte dell'imparare.

import { useRef, useState } from 'react';
import { Download, Mic, MicOff, Moon, RotateCcw, Sun, Upload, Volume2 } from 'lucide-react';
import type { NameStyle } from '../lib/notes';
import { italianOf } from '../lib/notes';
import type { LiveNote } from '../hooks/usePitchDetection';
import type { Settings } from '../lib/storage';
import { exportState, importState } from '../lib/storage';
import type { ProgressApi } from '../hooks/useProgress';
import { Bar, Btn, Card, Panel, Pill, SectionTitle } from './ui';

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
  const strong = mic.level > 0.08;
  return (
    <Card>
      <SectionTitle>Microfono</SectionTitle>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs leading-relaxed text-ink3">
          Con il microfono rispondi suonando sul piano vero, in tutti gli esercizi. Funziona una nota alla volta:
          gli accordi si arpeggiano.
        </p>
        <Pill tone={mic.isListening ? (strong ? 'good' : 'warn') : 'neutral'}>
          {mic.isListening ? (strong ? 'segnale pronto' : 'suona una nota') : 'spento'}
        </Pill>
      </div>
      {mic.isListening && (
        <div className="mt-3 space-y-2">
          <Bar pct={Math.min(1, mic.level * 3.2)} color={strong ? 'bg-emerald-500' : 'bg-amber-500'} />
          <div className="flex items-center justify-between text-xs text-ink2">
            <span>
              {mic.liveNote ? `Sento: ${italianOf(mic.liveNote.name)}${mic.liveNote.octave}` : 'In ascolto…'}
            </span>
            <span className="tabular-nums">livello {Math.round(mic.level * 100)}%</span>
          </div>
          <p className="text-[11px] leading-relaxed text-ink3">
            Suona tre note a volume normale e controlla che il nome sia giusto. Se la barra resta bassa avvicina il
            telefono; se si muove anche nel silenzio, allontanalo dalla fonte di rumore.
          </p>
        </div>
      )}
      <Btn variant={mic.isListening ? 'soft' : 'primary'} full className="mt-3" onClick={onToggleMic}>
        {mic.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {mic.isListening ? 'Spegni il microfono' : 'Accendi e prova'}
      </Btn>
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
    setMessage('Progresso esportato.');
  };

  const doImport = (file: File) => {
    file
      .text()
      .then(text => {
        const parsed = importState(text);
        if (!parsed) {
          setMessage('File non valido.');
          return;
        }
        progress.replaceState(parsed);
        setMessage('Progresso importato.');
      })
      .catch(() => setMessage('Non è stato possibile leggere il file.'));
  };

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <SectionTitle>Studio</SectionTitle>
        <Row
          title="Suona la nota prima della risposta"
          desc="Consigliato spento: se senti la nota prima, alleni l'orecchio e non la lettura."
        >
          <Toggle on={settings.hintSoundBefore} onChange={v => set('hintSoundBefore', v)} />
        </Row>
        <Row title="Suona la nota dopo la risposta" desc="Collega il segno scritto al suono reale.">
          <Toggle on={settings.soundOnReveal} onChange={v => set('soundOnReveal', v)} />
        </Row>
        <Row title="Aiuto automatico" desc="Dopo 6 secondi compare il suggerimento sul riferimento.">
          <Toggle on={settings.autoHint} onChange={v => set('autoHint', v)} />
        </Row>
        <Row title="Cronometro" desc="La barra che scorre ricorda che conta anche la velocità.">
          <Toggle on={settings.showTimer} onChange={v => set('showTimer', v)} />
        </Row>
        <Row title="Domande per sessione" desc="Meglio sessioni brevi e frequenti che una lunga.">
          <NumberStepper value={settings.sessionLength} min={4} max={30} step={2} onChange={v => set('sessionLength', v)} />
        </Row>
        <Row title="Obiettivo giornaliero" desc="Risposte al giorno per tenere viva la serie.">
          <NumberStepper value={settings.dailyGoal} min={10} max={200} step={10} onChange={v => set('dailyGoal', v)} />
        </Row>
        <Row title="Ottava obbligatoria" desc="Nell'esercizio sulla tastiera pretende anche l'ottava esatta.">
          <Toggle on={settings.strictOctave} onChange={v => set('strictOctave', v)} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>Aspetto</SectionTitle>
        <Row title="Tema">
          <button
            type="button"
            onClick={() => set('theme', settings.theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface2 px-3 py-1.5 text-xs font-bold text-ink2"
          >
            {settings.theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {settings.theme === 'dark' ? 'Scuro' : 'Chiaro'}
          </button>
        </Row>
        <Row title="Nomi delle note">
          <Choice<NameStyle>
            value={settings.noteNames}
            onChange={v => set('noteNames', v)}
            options={[
              { value: 'it', label: 'Do Re Mi' },
              { value: 'en', label: 'C D E' },
              { value: 'both', label: 'Entrambi' },
            ]}
          />
        </Row>
        <Row title="Etichette sulla tastiera">
          <Choice
            value={settings.keyLabels}
            onChange={v => set('keyLabels', v)}
            options={[
              { value: 'all', label: 'Tutte' },
              { value: 'c', label: 'Solo Do' },
              { value: 'none', label: 'Nessuna' },
            ]}
          />
        </Row>
        <Row title="Come rispondere">
          <Choice
            value={settings.readInput}
            onChange={v => set('readInput', v)}
            options={[
              { value: 'names', label: 'Nomi' },
              { value: 'keys', label: 'Tastiera' },
            ]}
          />
        </Row>
        <Row title="Testo grande" desc="Aumenta testi e bersagli tattili senza ingrandire lo spartito.">
          <Toggle on={settings.largeText} onChange={v => set('largeText', v)} />
        </Row>
        <Row title="Contrasto alto" desc="Rende più nette superfici, linee e stati corretti o sbagliati.">
          <Toggle on={settings.highContrast} onChange={v => set('highContrast', v)} />
        </Row>
        <Row title="Riduci animazioni" desc="Evita movimenti non essenziali durante lo studio.">
          <Toggle on={settings.reducedMotion} onChange={v => set('reducedMotion', v)} />
        </Row>
      </Card>

      <MicCheck mic={mic} onToggleMic={onToggleMic} />

      <Card>
        <SectionTitle>Suono e vibrazione</SectionTitle>
        <Row title="Volume">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.volume * 100)}
            onChange={e => set('volume', Number(e.target.value) / 100)}
            className="w-32 accent-[var(--c-brand)]"
            aria-label="Volume"
          />
        </Row>
        <Row
          title="Prova il suono"
          desc="Non senti nulla sul telefono? Su iPhone controlla anche l'interruttore del silenzioso e il volume multimediale."
        >
          <Btn variant="soft" onClick={onTestSound} className="px-3 py-2">
            <Volume2 className="h-4 w-4" />
            Prova
          </Btn>
        </Row>
        <Row title="Metronomo nelle canzoni" desc="Batte il tempo mentre ascolti la melodia.">
          <Toggle on={settings.metronome} onChange={v => set('metronome', v)} />
        </Row>
        <Row title="Vibrazione" desc="Conferma tattile delle risposte sul telefono.">
          <Toggle on={settings.haptics} onChange={v => set('haptics', v)} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>Dati</SectionTitle>
        <div className="flex flex-wrap gap-2 pt-1">
          <Btn variant="soft" onClick={doExport}>
            <Download className="h-4 w-4" />
            Esporta
          </Btn>
          <Btn variant="soft" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Importa
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
              if (window.confirm('Azzerare tutto il progresso? Non si può tornare indietro.')) {
                progress.resetAll();
                setMessage('Progresso azzerato.');
              }
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Azzera
          </Btn>
        </div>
        {message && <p className="mt-2 text-xs text-ink2">{message}</p>}
      </Card>

      <Panel className="px-4 py-3 text-[11px] leading-relaxed text-ink3">
        Il progresso resta su questo dispositivo (nessun account, nessun server). Usa Esporta prima di
        cambiare telefono o cancellare i dati del browser.
      </Panel>
    </div>
  );
}
