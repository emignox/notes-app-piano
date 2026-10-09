// Un piccolo aiuto per gli esempi da ascoltare delle lezioni: una successione
// di accordi (anche di una nota sola) con durata, forza e tasto tenuto.
// Le note di un accordo partono insieme: tutte tranne l'ultima hanno durata
// zero, ed è l'ultima a far avanzare il tempo.

export function chordSeq(
  seq: [string[], number][],
  vel: number | number[] = 0.6,
  legato = 0.95,
): { notes: string[]; secs: number[]; holds: number[]; vel: number[] } {
  const notes: string[] = [];
  const secs: number[] = [];
  const holds: number[] = [];
  const vels: number[] = [];
  seq.forEach(([chord, dur], k) => {
    chord.forEach((n, i) => {
      notes.push(n);
      secs.push(i === chord.length - 1 ? dur : 0);
      holds.push(dur * legato);
      vels.push(Array.isArray(vel) ? vel[k] ?? 0.6 : vel);
    });
  });
  return { notes, secs, holds, vel: vels };
}
