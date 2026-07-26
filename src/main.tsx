import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { initStore } from './lib/store'
import { iniciarNuvem } from './lib/sync/boot'
import './index.css'

// O armazenamento (IndexedDB) é carregado antes de renderizar, para que as
// telas possam ler os dados de forma síncrona.
initStore().finally(() => {
  // Sem as chaves do Supabase isto não faz nada e o app roda em modo local.
  iniciarNuvem()

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  )

  // Service worker: permite instalar o app e usá-lo offline.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    const registrar = () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
        // sem service worker o app segue funcionando normalmente
      })
    }
    // initStore é assíncrono: o evento "load" pode já ter passado aqui.
    if (document.readyState === 'complete') registrar()
    else window.addEventListener('load', registrar, { once: true })
  }
})
