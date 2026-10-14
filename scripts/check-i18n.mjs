// Controllo delle traduzioni: `npm run check:i18n` (con --strict esce con errore se manca qualcosa).
//
// 1. Ogni `t('testo')` nel codice deve avere la voce in inglese e in francese;
//    i segnaposto {nome} devono essere gli stessi nelle tre lingue.
// 2. Ogni campo di testo dei dati (lezioni, brani, termini…) elencato in
//    `src/i18n/sources/*.ts` deve avere la voce nei due dizionari.
// 3. `t(variabile)` (non un testo scritto lì) si elenca: va guardato a mano,
//    perché il dizionario deve contenere ciò che la variabile può valere.

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createServer } from 'vite';

const strict = process.argv.includes('--strict');
const root = new URL('..', import.meta.url).pathname;
const SRC = path.join(root, 'src');

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (p !== path.join(SRC, 'i18n')) walk(p); } else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
})(SRC);

/** Le chiavi usate dal codice. */
const keys = new Map(); // testo → [file:riga]
const dynamic = [];
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && node.arguments.length >= 1) {
      const a = node.arguments[0];
      const where = `${path.relative(root, f)}:${sf.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
      if (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) {
        if (!keys.has(a.text)) keys.set(a.text, []);
        keys.get(a.text).push(where);
      } else dynamic.push(`${where}  ${a.getText(sf).slice(0, 60)}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const server = await createServer({ configFile: false, root, logLevel: 'silent', appType: 'custom', server: { middlewareMode: true, hmr: false } });
const dict = { en: {}, fr: {} };
for (const lang of ['en', 'fr']) {
  const dir = path.join(SRC, 'i18n', lang);
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.ts'))) {
    const m = await server.ssrLoadModule(`/src/i18n/${lang}/${f}`);
    for (const [k, v] of Object.entries(m.default)) {
      if (k in dict[lang]) console.log(`⚠ chiave doppia in ${lang}: ${k.slice(0, 60)}`);
      dict[lang][k] = v;
    }
  }
}

/** I testi dei dati. */
const dataKeys = new Map();
const sourcesDir = path.join(SRC, 'i18n', 'sources');
if (fs.existsSync(sourcesDir)) {
  for (const f of fs.readdirSync(sourcesDir).filter(x => x.endsWith('.ts'))) {
    const m = await server.ssrLoadModule(`/src/i18n/sources/${f}`);
    const { fields, data } = m.default;
    const set = new Set(fields);
    const walk = (v, key, where) => {
      if (typeof v === 'string') { if (key && set.has(key) && v.trim()) { if (!dataKeys.has(v)) dataKeys.set(v, where); } return; }
      if (Array.isArray(v)) { v.forEach(x => walk(x, key, where)); return; }
      if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k, where);
    };
    data.forEach(d => walk(d, undefined, f));
  }
}
await server.close();

const placeholders = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
let problems = 0;
const report = (title, list) => { if (list.length) { problems += list.length; console.log(`\n✗ ${title} (${list.length})`); list.slice(0, 40).forEach(x => console.log('   ' + x)); if (list.length > 40) console.log(`   … e altri ${list.length - 40}`); } };

for (const lang of ['en', 'fr']) {
  const missing = [];
  const mismatch = [];
  const same = [];
  for (const [k, where] of [...keys, ...[...dataKeys].map(([k, w]) => [k, [w]])]) {
    const v = dict[lang][k];
    if (v === undefined || v === '') { missing.push(`${JSON.stringify(k.slice(0, 70))}  ← ${where[0]}`); continue; }
    if (placeholders(v) !== placeholders(k)) mismatch.push(`${JSON.stringify(k.slice(0, 50))} → ${JSON.stringify(v.slice(0, 50))}`);
  }
  report(`${lang}: mancano ${missing.length} voci`, missing);
  report(`${lang}: segnaposto diversi`, mismatch);
  void same;
}
console.log(`\nChiavi nel codice: ${keys.size} · testi nei dati: ${dataKeys.size} · voci en: ${Object.keys(dict.en).length} · voci fr: ${Object.keys(dict.fr).length}`);
if (dynamic.length) console.log(`t() con argomento non letterale (da controllare a mano): ${dynamic.length}\n   ` + dynamic.slice(0, 15).join('\n   '));
const used = new Set([...keys.keys(), ...dataKeys.keys()]);
for (const lang of ['en', 'fr']) {
  const unused = Object.keys(dict[lang]).filter(k => !used.has(k));
  if (unused.length) console.log(`${lang}: ${unused.length} voci non usate da t() letterali né dai dati (ok se servono a t(variabile))`);
}
console.log(problems ? `\n${problems} problemi` : '\n✓ traduzioni complete');
if (strict && problems) process.exit(1);
