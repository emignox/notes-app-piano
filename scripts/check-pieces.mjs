// Controlla tutti i pezzi senza avviare l'app: `npm run check:pezzi`.
//
// I dati dei pezzi sono TypeScript, e in questo progetto non c'è un runner TS.
// Vite però c'è già, e sa caricare un modulo TS lato server: lo usiamo come
// interprete. Nessuna dipendenza in più solo per fare un controllo.

import fs from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  // Vite 8 tenta di inizializzare il canale WebSocket anche in middleware
  // mode. In CI/sandbox può essere vietato, ma non serve per ssrLoadModule:
  // teniamo muto il logger interno; le eccezioni di caricamento restano fatali.
  logLevel: 'silent',
  // Non serve un server HTTP: Vite viene usato soltanto per caricare i moduli
  // TypeScript.
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
});

try {
  const { pieces } = await server.ssrLoadModule('/src/data/pieces.ts');
  const { checkAll, formatIssues } = await server.ssrLoadModule('/src/lib/scoreCheck.ts');
  const { pieceToMusicXml } = await server.ssrLoadModule('/src/lib/pieceToMusicXml.ts');
  const { library } = await server.ssrLoadModule('/src/data/library.ts');

  const issues = checkAll(pieces);
  const errors = issues.filter(i => i.level === 'errore');
  const warnings = issues.filter(i => i.level === 'avviso');

  const steps = pieces.reduce((n, p) => n + p.steps.length, 0);
  console.log(`${pieces.length} pezzi, ${steps} passi in tutto.`);
  console.log(formatIssues(issues));
  console.log(`\n${errors.length} errori, ${warnings.length} avvisi.`);

  // Il Leggio legge i pezzi come MusicXML: in ogni battuta le due mani
  // devono durare uguale (altrimenti il rigo si sfasa).
  let xmlErrors = 0;
  const sum = part => [...part.matchAll(/<note>(?!<chord\/>)[\s\S]*?<duration>(\d+)<\/duration>/g)].reduce((t, x) => t + Number(x[1]), 0);
  for (const piece of pieces) {
    const xml = pieceToMusicXml(piece);
    [...xml.matchAll(/<measure [^>]*>([\s\S]*?)<\/measure>/g)].forEach((m, i) => {
      const [right, rest = ''] = m[1].split('<backup>');
      const back = Number(rest.match(/<duration>(\d+)/)?.[1] ?? 0);
      const left = rest.replace(/^<duration>\d+<\/duration><\/backup>/, '');
      if (sum(right) !== back || sum(left) !== back) {
        xmlErrors++;
        console.log(`  ${piece.id}, battuta ${i + 1}: destra ${sum(right)}, sinistra ${sum(left)}, attesa ${back}`);
      }
    });
  }
  // Le partiture complete della libreria devono esserci davvero.
  for (const entry of library) {
    if (entry.source.kind !== 'xml') continue;
    const file = new URL(`../public${entry.source.url}`, import.meta.url);
    if (!fs.existsSync(file) || !fs.readFileSync(file, 'utf8').includes('<score-partwise')) {
      xmlErrors++;
      console.log(`  ${entry.id}: manca la partitura ${entry.source.url}`);
    }
  }
  const complete = library.filter(e => e.source.kind === 'xml').length;
  console.log(`Leggio: ${library.length} brani (${complete} partiture complete): ${xmlErrors} errori.`);

  process.exitCode = errors.length > 0 || xmlErrors > 0 ? 1 : 0;
} finally {
  await server.close();
}
