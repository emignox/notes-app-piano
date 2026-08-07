import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Play, Square } from 'lucide-react';
import { advancedChopin } from '../data/repertoire/chopinAdvanced';
import type { AdvancedPiece } from '../data/repertoire/chopinAdvanced';
import type { AudioApi } from '../hooks/useAudio';
import { Bar, Btn, Card, Panel, Pill } from './ui';

type HandMode = 'both' | 'right' | 'left';
const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const toneOf = (m: number) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

const SCORE_FILES: Record<string, string> = {
  'chopin-op10-12-original': '/scores/chopin-op10-12.musicxml',
  'chopin-op10-4-original': '/scores/chopin-op10-4.musicxml',
  'chopin-op66-original': '/scores/chopin-op66.musicxml',
};

type ScoreEngine = import('opensheetmusicdisplay').OpenSheetMusicDisplay;

function emphasizeCursor(scoreCursor: ScoreEngine['cursor'], color: string, offset: number, zIndex: number) {
  const element = scoreCursor.cursorElement;
  scoreCursor.wantedZIndex = String(zIndex);
  element.style.setProperty('z-index', String(zIndex), 'important');
  element.style.setProperty('min-width', '13px', 'important');
  element.style.setProperty('opacity', '.9', 'important');
  element.style.setProperty('background', color, 'important');
  element.style.setProperty('border', `3px solid ${color}`, 'important');
  element.style.setProperty('border-radius', '7px', 'important');
  element.style.setProperty('box-shadow', `0 0 0 2px #fff, 0 0 14px 5px ${color}`, 'important');
  element.style.setProperty('transform', `translateX(${offset}px)`, 'important');
}

function MusicScore({ piece, cursor, hand }: { piece: AdvancedPiece; cursor: number; hand: HandMode }) {
  const viewport = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null), engine = useRef<ScoreEngine | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(false);
  const onsets = useMemo(() => ({
    right: [...new Set(piece.events.filter(event => event[4]).map(event => event[1]))].sort((a,b)=>a-b),
    left: [...new Set(piece.events.filter(event => !event[4]).map(event => event[1]))].sort((a,b)=>a-b),
  }), [piece]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
        if (cancelled || !host.current) return;
        host.current.innerHTML = '';
        const osmd = new OpenSheetMusicDisplay(host.current, {
          autoResize: true, backend: 'svg', drawTitle: false, followCursor: false,
          drawingParameters: 'compacttight', disableCursor: false,
          cursorsOptions: [
            { type: 0, color: '#2563eb', alpha: 0.88, follow: false },
            { type: 0, color: '#9333ea', alpha: 0.88, follow: false },
          ],
        });
        await osmd.load(SCORE_FILES[piece.id]);
        if (cancelled) return;
        osmd.render();
        osmd.cursors.forEach((scoreCursor, index) => {
          scoreCursor.reset(); scoreCursor.show();
          // OSMD ripristina wantedZIndex a ogni update: impostare soltanto lo
          // style lasciava il cursore dietro la pagina bianca al primo next().
          emphasizeCursor(scoreCursor, index === 0 ? '#2563eb' : '#9333ea', index === 0 ? -8 : 8, 50 + index);
        });
        engine.current = osmd; setLoading(false);
      } catch { if (!cancelled) { setError(true); setLoading(false); } }
    })();
    return () => { cancelled = true; engine.current = null; };
  }, [piece]);
  useEffect(() => {
    const osmd = engine.current; if (!osmd) return;
    const latest = (values: number[]) => values.findLast(value => value <= cursor) ?? 0;
    const rightBeat = latest(onsets.right), leftBeat = latest(onsets.left);
    const moveToBeat = (scoreCursor: typeof osmd.cursor, beat: number) => {
      const currentBeat = scoreCursor.iterator.CurrentSourceTimestamp.RealValue * 4;
      if (currentBeat > beat) scoreCursor.reset();
      while (!scoreCursor.iterator.EndReached && scoreCursor.iterator.CurrentSourceTimestamp.RealValue * 4 < beat - .001) scoreCursor.next();
    };
    const [rightCursor, leftCursor] = osmd.cursors;
    if (rightCursor) {
      if (hand === 'left') rightCursor.hide(); else rightCursor.show(); moveToBeat(rightCursor, rightBeat);
      emphasizeCursor(rightCursor, '#2563eb', -8, 50);
    }
    if (leftCursor) {
      if (hand === 'right') leftCursor.hide(); else leftCursor.show(); moveToBeat(leftCursor, leftBeat);
      emphasizeCursor(leftCursor, '#9333ea', 8, 51);
    }
    // Il follow nativo di OSMD usa window.scrollTo e sul telefono porta via i
    // comandi. Qui si muove esclusivamente il riquadro bianco della partitura.
    const followed = hand === 'left' ? leftCursor : hand === 'right' ? rightCursor : leftBeat > rightBeat ? leftCursor : rightCursor;
    if (followed && viewport.current) {
      const box = viewport.current, marker = followed.cursorElement;
      requestAnimationFrame(() => {
        const outer = box.getBoundingClientRect(), inner = marker.getBoundingClientRect();
        if (inner.top < outer.top + 36 || inner.bottom > outer.bottom - 36) box.scrollTop += inner.top - outer.top - outer.height * .3;
        if (inner.left < outer.left + 24 || inner.right > outer.right - 24) box.scrollLeft += inner.left - outer.left - outer.width * .25;
      });
    }
  }, [cursor, hand, onsets]);
  return <div ref={viewport} className="relative max-h-[58dvh] w-full max-w-full overscroll-contain overflow-auto rounded-2xl border border-line bg-white p-1 shadow-inner sm:max-h-[68vh] sm:p-2" aria-label="Partitura completa su doppio pentagramma">
    {loading && <div className="grid min-h-56 place-items-center text-sm font-bold text-slate-600">Sto preparando la partitura…</div>}
    {error && <div className="grid min-h-56 place-items-center text-sm font-bold text-red-700">Impossibile caricare la partitura.</div>}
    <div ref={host} className="w-full min-w-[560px] sm:min-w-0 sm:[&>svg]:max-w-full" />
  </div>;
}

function Challenge({ piece, audio, back }: { piece: AdvancedPiece; audio: AudioApi; back: () => void }) {
  const [hand,setHand]=useState<HandMode>('both'), [bpm,setBpm]=useState(Math.round(piece.bpm*.6));
  const [section,setSection]=useState<number|null>(0), [playing,setPlaying]=useState(false), [cursor,setCursor]=useState(0);
  const timer=useRef<ReturnType<typeof setInterval>|null>(null), started=useRef(0), chunk=32;
  const from=section===null?0:section*chunk, to=section===null?piece.beats:Math.min(piece.beats,from+chunk), count=Math.ceil(piece.beats/chunk), stopSequence=audio.stopSequence;
  const pedalDown = playing && (piece.pedals.findLast(event => event[0] <= cursor)?.[1] === 1);
  const stop=useCallback(()=>{stopSequence();if(timer.current)clearInterval(timer.current);timer.current=null;setPlaying(false);},[stopSequence]);
  useEffect(()=>stop,[stop]);
  const play=()=>{stop();const sec=60/bpm;const events=piece.events.filter(e=>e[1]>=from&&e[1]<to&&(hand==='both'||(hand==='right')===!!e[4])).map(e=>({notes:[toneOf(e[0])],at:(e[1]-from)*sec,hold:Math.max(.04,e[2]*sec),velocity:e[3],stepIndex:0}));if(!events.length)return;started.current=performance.now();setCursor(from);setPlaying(true);audio.playPerformance(events,[],undefined,()=>{setPlaying(false);setCursor(to);if(timer.current)clearInterval(timer.current);});timer.current=setInterval(()=>setCursor(Math.min(to,from+(performance.now()-started.current)/1000/sec)),40);};
  return <div className="flex flex-col gap-3"><Card><div className="flex items-center gap-3"><button type="button" onClick={back} className="rounded-xl bg-surface2 p-2"><ChevronLeft className="h-4 w-4"/></button><div className="min-w-0 flex-1"><p className="font-black text-ink">🎼 {piece.title}</p><p className="text-xs text-ink3">Originale integrale · {piece.events.length} note · sustain</p></div>{pedalDown&&<Pill tone="good">Pedale ↓</Pill>}<Pill tone="warn">virtuosistico</Pill></div></Card>
  <Card className="sticky top-2 z-[100] space-y-3 shadow-xl"><div className="flex gap-1">{(['right','left','both'] as const).map(h=><button key={h} type="button" onClick={()=>{stop();setHand(h)}} className={`flex-1 rounded-xl border py-2 text-xs font-bold ${hand===h?'border-brand bg-brand/15 text-brand':'border-line bg-surface2 text-ink2'}`}>{h==='right'?'Destra':h==='left'?'Sinistra':'Insieme'}</button>)}</div><div className="flex items-center gap-2"><Btn onClick={playing?stop:play}>{playing?<Square className="h-4 w-4"/>:<Play className="h-4 w-4"/>}{playing?'Ferma':'Ascolta'}</Btn><b className="min-w-16 text-right text-xs tabular-nums">{bpm} BPM</b><input aria-label="Velocità in BPM" type="range" min={30} max={240} value={bpm} onChange={e=>setBpm(+e.target.value)} className="min-w-0 flex-1 accent-[var(--c-brand)]"/></div><div className="flex justify-between text-[10px] text-ink3"><span>30</span><span>tempo indicativo: {piece.bpm}</span><span>240</span></div><Bar pct={(cursor-from)/Math.max(1,to-from)}/></Card>
  <MusicScore piece={piece} cursor={cursor} hand={hand}/><div className="thin-scroll flex gap-1 overflow-x-auto"><button type="button" onClick={()=>{stop();setSection(null);setCursor(0)}} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${section===null?'border-brand bg-brand/15 text-brand':'border-line bg-surface text-ink2'}`}>▶ Brano intero</button>{Array.from({length:count},(_,i)=><button key={i} type="button" onClick={()=>{stop();setSection(i);setCursor(i*chunk)}} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${section===i?'border-brand bg-brand/15 text-brand':'border-line bg-surface text-ink2'}`}>Batt. {i*8+1}–{Math.min(Math.ceil(piece.beats/4),i*8+8)}</button>)}</div><Panel className="px-4 py-3 text-xs text-ink2"><span className="font-bold text-blue-600">Blu: violino/destra</span> · <span className="font-bold text-purple-600">viola: basso/sinistra</span>. I due indicatori evidenziano direttamente le note e avanzano indipendentemente.</Panel></div>;
}

export function AdvancedChopinView({audio}:{audio:AudioApi}){const[selected,setSelected]=useState<AdvancedPiece|null>(null);if(selected)return <Challenge piece={selected} audio={audio} back={()=>setSelected(null)}/>;return <Card><p className="text-xs font-black uppercase tracking-widest text-brand">Chopin · originali integrali</p><h2 className="mt-1 text-xl font-black">Tre sfide autentiche</h2><p className="mb-3 text-xs text-ink2">Tutte le note e le durate delle fonti MIDI, senza semplificazioni.</p><div className="space-y-2">{advancedChopin.map(p=><button key={p.id} type="button" onClick={()=>setSelected(p)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface2 p-3 text-left"><span className="text-2xl">🎼</span><div className="min-w-0 flex-1"><p className="font-bold">{p.title}</p><p className="text-xs text-ink3">{p.events.length} note · {Math.ceil(p.beats/4)} battute</p></div><Pill tone="warn">originale</Pill></button>)}</div></Card>}
