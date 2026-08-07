// Controlla tutti i pezzi senza avviare l'app: `npm run check:pezzi`.
//
// I dati dei pezzi sono TypeScript, e in questo progetto non c'è un runner TS.
// Vite però c'è già, e sa caricare un modulo TS lato server: lo usiamo come
// interprete. Nessuna dipendenza in più solo per fare un controllo.

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

  const issues = checkAll(pieces);
  const errors = issues.filter(i => i.level === 'errore');
  const warnings = issues.filter(i => i.level === 'avviso');

  const steps = pieces.reduce((n, p) => n + p.steps.length, 0);
  console.log(`${pieces.length} pezzi, ${steps} passi in tutto.`);
  console.log(formatIssues(issues));
  console.log(`\n${errors.length} errori, ${warnings.length} avvisi.`);

  process.exitCode = errors.length > 0 ? 1 : 0;
} finally {
  await server.close();
}
