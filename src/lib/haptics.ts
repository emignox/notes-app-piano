// Feedback tattile: su mobile chiude il ciclo azione→risposta più in fretta
// di qualsiasi animazione. Silenziosamente ignorato dove non supportato.

let enabled = true;

export function setHaptics(on: boolean) {
  enabled = on;
}

function buzz(pattern: number | number[]) {
  if (!enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* non supportato */
  }
}

export const haptics = {
  tap: () => buzz(8),
  correct: () => buzz(18),
  wrong: () => buzz([26, 60, 26]),
  levelUp: () => buzz([14, 50, 14, 50, 40]),
  tick: () => buzz(5),
};
