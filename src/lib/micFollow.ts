// Le regole con cui il Leggio usa ciò che arriva dal microfono. Stanno qui,
// fuori dal componente, perché il banco di prova (`npm run bench:semplice`)
// le usi uguali.

/**
 * La conferma della nota dal rilevatore di una nota alla volta vale per
 * l'attesa in corso solo se la nota è stata ATTACCATA dopo l'inizio
 * dell'attesa (meno questo margine): la conferma in ritardo della nota di
 * prima non deve valere per il passo dopo.
 */
export const MONO_ONSET_SLACK_MS = 30;

/**
 * La nota confermata conta per l'attesa iniziata a `waitSince`? Solo se è
 * stata attaccata dopo (vedi MONO_ONSET_SLACK_MS), non è arrivata dentro una
 * nuvola di note estranee (una voce, l'altoparlante: vedi ChordMatcher.cloud)
 * e non è l'eco del passo appena preso (ChordMatcher.isEcho).
 */
export function monoCounts(c: { onset: number; cloudy?: boolean; echo?: boolean }, waitSince: number): boolean {
  return !c.cloudy && !c.echo && c.onset >= waitSince - MONO_ONSET_SLACK_MS;
}

/**
 * Quale nota attesa conferma una nota sentita dal rilevatore di una nota alla
 * volta: se stessa, oppure la sua ottava (il rilevatore a volte salta
 * all'ottava; nel dubbio una sola).
 */
export function monoAccepts(need: number[], heard: number): number[] {
  return need.includes(heard) ? [heard] : need.filter(m => Math.abs(m - heard) === 12).slice(0, 1);
}
