import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initI18n } from './i18n'

// La lingua scelta si carica prima di disegnare: così non si vede l'italiano
// per un attimo. Se il caricamento fallisce l'app parte comunque in italiano.
void initI18n().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

// Offline + installazione sul telefono.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* niente offline, l'app funziona comunque */
    })
  })
}
