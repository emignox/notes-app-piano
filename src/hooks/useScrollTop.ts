import { useEffect } from 'react';

/**
 * Riporta in cima quando si entra in una schermata nuova.
 * Su telefono, toccando una voce in fondo a un elenco la vista che si apriva
 * ereditava lo scorrimento e partiva già a metà: titolo e comandi restavano
 * sopra il bordo dello schermo.
 */
export function useScrollTop(key: unknown) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [key]);
}
