import fs from 'node:fs';

const SOURCES = [
  ['chopin-op10-12-original', 'Studio op. 10 n. 12 “Rivoluzionario”', 'scripts/sources/chopin-op10-12.mid', 'C', 76],
  ['chopin-op10-4-original', 'Studio op. 10 n. 4 “Torrent”', 'scripts/sources/chopin-op10-4.mid', 'C#', 88],
  ['chopin-op66-original', 'Fantaisie-Impromptu op. 66', 'scripts/sources/chopin-op66.mid', 'C#', 72],
];

function vlq(buf, state) {
  let value = 0;
  for (;;) {
    const b = buf[state.i++];
    value = (value << 7) | (b & 0x7f);
    if (!(b & 0x80)) return value;
  }
}

function parseMidi(path) {
  const b = fs.readFileSync(path);
  if (b.toString('ascii', 0, 4) !== 'MThd') throw new Error(`${path}: MIDI non valido`);
  const division = b.readUInt16BE(12);
  const tracks = b.readUInt16BE(10);
  let pos = 14;
  const notes = [];
  const tempos = [];
  const meters = [];
  const pedals = [];

  for (let track = 0; track < tracks; track++) {
    if (b.toString('ascii', pos, pos + 4) !== 'MTrk') throw new Error(`${path}: traccia ${track}`);
    const len = b.readUInt32BE(pos + 4);
    const end = pos + 8 + len;
    const st = { i: pos + 8 };
    let tick = 0;
    let running = 0;
    const active = new Map();
    while (st.i < end) {
      tick += vlq(b, st);
      let status = b[st.i];
      if (status & 0x80) { running = status; st.i++; } else status = running;
      if (status === 0xff) {
        const type = b[st.i++];
        const n = vlq(b, st);
        if (type === 0x51 && n === 3) tempos.push([tick, b.readUIntBE(st.i, 3)]);
        if (type === 0x58 && n >= 2) meters.push([tick, b[st.i], 2 ** b[st.i + 1]]);
        st.i += n;
        continue;
      }
      if (status === 0xf0 || status === 0xf7) { st.i += vlq(b, st); continue; }
      const kind = status & 0xf0;
      const channel = status & 0x0f;
      const d1 = b[st.i++];
      const d2 = kind === 0xc0 || kind === 0xd0 ? 0 : b[st.i++];
      if (kind === 0x90 && d2 > 0) {
        const key = `${channel}:${d1}`;
        const queue = active.get(key) ?? [];
        queue.push({ tick, velocity: d2 });
        active.set(key, queue);
      } else if (kind === 0x80 || (kind === 0x90 && d2 === 0)) {
        const key = `${channel}:${d1}`;
        const queue = active.get(key);
        const on = queue?.shift();
        if (on) notes.push({ midi: d1, at: on.tick / division, hold: Math.max(1 / 32, (tick - on.tick) / division), velocity: on.velocity / 127, track, channel, onTick: on.tick, offTick: tick });
      } else if (kind === 0xb0 && d1 === 64) {
        pedals.push({ tick, at: tick / division, down: d2 >= 64, track, channel });
      }
    }
    pos = end;
  }

  const noteTracks = [...new Set(notes.map(n => n.track))];
  notes.forEach(n => {
    if (noteTracks.length >= 2) n.hand = n.track === noteTracks[0] ? 'right' : 'left';
    else n.hand = n.midi >= 60 ? 'right' : 'left';
  });
  // Se il tasto viene rilasciato con il sustain abbassato, il suono continua
  // fino al prossimo CC64 "su" della stessa traccia/canale. Conserviamo così
  // la pedalizzazione dell'esecuzione sorgente anche nel sampler dell'app.
  notes.forEach(n => {
    const lane = pedals.filter(p => p.track === n.track && p.channel === n.channel);
    const state = lane.findLast(p => p.tick <= n.offTick);
    if (!state?.down) return;
    const release = lane.find(p => p.tick > n.offTick && !p.down);
    if (release) n.hold = Math.max(n.hold, (release.tick - n.onTick) / division);
  });
  notes.sort((a, b) => a.at - b.at || a.midi - b.midi);
  pedals.sort((a, b) => a.at - b.at);
  return { division, notes, tempos, meters, pedals, beats: Math.max(...notes.map(n => n.at + n.hold)) };
}

const compact = SOURCES.map(([id, title, path, tonic, bpm]) => {
  const midi = parseMidi(path);
  if (id === 'chopin-op10-12-original' && midi.pedals.length === 0) {
    // Questa sorgente MIDI non codifica CC64. Una pedalizzazione leggera per
    // battuta sostiene accordi e note lunghe, ma lascia asciutte le rapide
    // semicrome cromatiche (che con un sustain pieno diventerebbero confuse).
    for (let at = 0; at < midi.beats; at += 4) {
      const release = Math.min(midi.beats, at + 3.82);
      midi.pedals.push({ at, down: true }, { at: release, down: false });
      midi.notes.forEach(note => {
        const off = note.at + note.hold;
        if (note.at >= at && off < release && note.hold >= .5) note.hold = release - note.at;
      });
    }
  }
  const meter = midi.meters[0] ? `${midi.meters[0][1]}/${midi.meters[0][2]}` : '4/4';
  return { id, title, tonic, bpm, meter, beats: Math.ceil(midi.beats * 1000) / 1000, pedals: midi.pedals.map(p => [+p.at.toFixed(5), p.down ? 1 : 0]), events: midi.notes.map(n => [n.midi, +n.at.toFixed(5), +n.hold.toFixed(5), +n.velocity.toFixed(3), n.hand === 'right' ? 1 : 0]) };
});

const out = `// Generato da scripts/import-chopin-midi.mjs. Non modificare a mano.\n` +
  `export type AdvancedEvent = [midi:number, at:number, hold:number, velocity:number, right:0|1];\n` +
  `export type PedalEvent = [at:number, down:0|1];\n` +
  `export interface AdvancedPiece { id:string; title:string; tonic:string; bpm:number; meter:string; beats:number; pedals:PedalEvent[]; events:AdvancedEvent[]; }\n` +
  `export const advancedChopin: AdvancedPiece[] = ${JSON.stringify(compact)};\n`;
fs.writeFileSync('src/data/repertoire/chopinAdvanced.ts', out);
for (const p of compact) console.log(`${p.title}: ${p.events.length} note, ${p.pedals.length} eventi pedale, ${p.beats} battiti`);
