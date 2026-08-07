import { createContext, useContext } from 'react';

export interface GlossarioApi {
  open: (id: string) => void;
}

/** Il contesto sta qui e non nel componente: così il file dei componenti
 *  esporta solo componenti e il ricaricamento a caldo continua a funzionare. */
export const GlossarioCtx = createContext<GlossarioApi | null>(null);

/** Per aprire una voce del glossario da un pulsante qualsiasi. */
export function useGlossario(): GlossarioApi | null {
  return useContext(GlossarioCtx);
}
