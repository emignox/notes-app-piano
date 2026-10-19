// Prova nell'app VERA (Chrome, microfono finto): `node scripts/e2e/leggio-mic.mjs [melodia|accordi] [gap]`
// Serve il server di sviluppo su http://localhost:5199 (npm run dev -- --port 5199).
//
// Si suona con calma (una nota o un accordo ogni `gap` secondi, pianoforte
// campionato, timbro e livello dell'iPad) e si guarda il Leggio: ogni volta
// che passa al passo dopo si segna l'ora. Se va avanti due volte per un solo
// colpo, è andato avanti DA SOLO; se resta fermo per più di un colpo, una nota
// è da RIPETERE. Il banco senza browser è `npm run bench:semplice`: questo
// controlla che l'app vera (React, il hook, il Leggio) faccia lo stesso.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { SR, loadSamples, perform, reverb, phoneMic, level, seeded, noteToMidi } from '../mic-bench/audio.mjs';

const args = process.argv.slice(2).filter(a => !a.startsWith('-'));
const kind = args[0] ?? 'melodia';
const GAP = Number(args[1] ?? (kind === 'accordi' ? 1.8 : 1.1));
const URL_APP = process.env.APP_URL ?? 'http://localhost:5199/';

const server = await createServer({ configFile: false, logLevel: 'silent', appType: 'custom', server: { middlewareMode: true, hmr: false } });
const { melodies } = await server.ssrLoadModule('/src/data/melodies.ts');
const { pieces } = await server.ssrLoadModule('/src/data/pieces.ts');
const { requiredNotes } = await server.ssrLoadModule('/src/lib/score.ts');
await server.close();

// ── Cosa si suona ───────────────────────────────────────────────────────────
let title;
let hits;
if (kind === 'accordi') {
  const piece = pieces.find(p => p.id === 'chopin-marcia-funebre');
  title = 'Marcia funebre (Sonata';
  hits = [];
  for (let i = 0; i < piece.steps.length && hits.length < 14; i++) {
    const req = requiredNotes(piece.steps, i, 'both');
    if (req.length) hits.push(req.map(n => n.replace('♯', '#')));
  }
} else {
  const m = melodies.find(x => /Brilla/i.test(x.title));
  title = m.title;
  hits = m.notes.slice(0, 16).map(n => [n.toneNote]);
}
const samples = await loadSamples();
const rand = seeded(11);
const LEAD = 3.0; // il microfono si apre: il primo colpo arriva dopo
const events = [];
/** Quando parte ogni colpo (s, dall'inizio della registrazione). */
const onsets = [];
let tNext = LEAD;
hits.forEach(notes => {
  const t = tNext;
  onsets.push(t);
  tNext += GAP * (0.92 + 0.16 * rand());
  for (const n of notes) events.push({ note: n, t: t + rand() * 0.02, dur: GAP * 0.85, vel: (noteToMidi(n) < 55 ? 0.45 : 0.55) * (0.9 + 0.2 * rand()), tilt: 1.2 });
});
let x = perform(samples, events, { pedal: kind === 'accordi', length: tNext + 2 });
x = level(phoneMic(reverb(x, 0.2), 70), -28, -85, rand);
const wav = path.join(os.tmpdir(), `leggio-mic-${kind}.wav`);
const pcm = Buffer.alloc(44 + x.length * 2);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + x.length * 2, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12);
pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34);
pcm.write('data', 36); pcm.writeUInt32LE(x.length * 2, 40);
let peak = 0; for (const v of x) peak = Math.max(peak, Math.abs(v));
// il livello resta quello dell'iPad: niente normalizzazione
for (let i = 0; i < x.length; i++) pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
fs.writeFileSync(wav, pcm);

// ── L'app ───────────────────────────────────────────────────────────────────
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${wav}%noloop`, '--autoplay-policy=no-user-gesture-required'],
});
const page = await (await browser.newContext({ viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true, permissions: ['microphone'] })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(URL_APP);
await page.evaluate(() => { localStorage.setItem('piano-trainer-v2', JSON.stringify({ version: 2, onboardingDone: true, unlockedCount: 40 })); localStorage.removeItem('piano-lang'); });
await page.reload();
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Canzoni', exact: true }).click();
await page.getByRole('button', { name: kind === 'accordi' ? 'Brani' : 'Melodie', exact: true }).click();
await page.locator('main button').filter({ hasText: title }).first().click();
await page.getByText('Preparo lo spartito').waitFor({ state: 'detached', timeout: 60000 });
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Accendi il microfono: suona/ }).click();
const t0 = Date.now();
const changes = [];
let last = null;
const total = tNext + 2.5;
while (Date.now() - t0 < total * 1000) {
  // Il passo del Leggio (lo espone solo in sviluppo) e cosa chiede.
  const s = await page.evaluate(() => {
    const l = window.__leggio;
    const chip = [...document.querySelectorAll('div')].find(d => /^(🎤 )?Suona/.test(d.textContent ?? '') && d.children.length === 0);
    const done = document.body.innerText.match(/(\d+)% giuste/);
    return `#${l?.mode === 'done' ? 'fine' : l?.waitingAt ?? '?'} ${chip?.textContent ?? (done ? `FINE ${done[0]}` : '-')}`;
  });
  if (s !== last) { changes.push({ s, at: (Date.now() - t0) / 1000 }); last = s; }
  await page.waitForTimeout(40);
}
const dbg = await page.evaluate(() => ({ attacks: window.__attacks ?? [], frames: window.__frames ?? [], mic: window.__mic ?? [] }));
await browser.close();
if (process.argv.includes('-v')) {
  const N = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const nn = m => `${N[m % 12]}${Math.floor(m / 12) - 1}`;
  const f = dbg.frames;
  const dts = f.slice(1).map((v, i) => v - f[i]).sort((a, b) => a - b);
  console.log(`fotogrammi: ${f.length} · intervallo mediano ${dts[Math.floor(dts.length / 2)]} ms · 90° ${dts[Math.floor(dts.length * 0.9)]} ms · massimo ${dts.at(-1)} ms`);
  console.log('attacchi:', dbg.attacks.map(a => `${nn(a.midi)}@${((a.at - t0) / 1000).toFixed(2)}`).join(' '));
  console.log('microfono:', dbg.mic.map(m => `${((m.at - t0) / 1000).toFixed(2)}:${m.match ? `match ${m.match.replace(/\d+/g, d => (Number(d) > 20 ? nn(Number(d)) : d))}` : `conf ${nn(m.midi)} (onset ${((m.onset - t0) / 1000).toFixed(2)})`}`).join('  '));
}

// ── Il giudizio ─────────────────────────────────────────────────────────────
// I passi presi: ogni cambio del "Suona" dopo il primo colpo.
const advances = changes.filter((c, i) => i > 0 && c.s.split(' ')[0] !== changes[i - 1].s.split(' ')[0]).slice(1).map(c => c.at);
const gaps = advances.slice(1).map((a, i) => a - advances[i]);
const tooFast = gaps.filter(g => g < GAP * 0.45).length;
const tooSlow = gaps.filter(g => g > GAP * 1.6).length;
console.log(changes.map(c => `${c.at.toFixed(1)}s ${c.s}`).join('\n'));
console.log(`\n${kind}: ${hits.length} colpi ogni ~${GAP}s → il Leggio è andato avanti ${advances.length} volte · avanti da solo (due passi in un colpo) ${tooFast} · fermo più di un colpo ${tooSlow}${errs.length ? ` · ERRORI ${errs.join(' | ')}` : ''}`);
