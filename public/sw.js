// Service worker do Grimório 5.5e.
// Estratégia: "stale-while-revalidate" para os arquivos do app — abre offline e
// atualiza em segundo plano. Os dados do usuário ficam no IndexedDB, não aqui.

const CACHE = 'grimorio-v1'
const ESSENCIAIS = ['./', './index.html', './manifest.webmanifest', './dragon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ESSENCIAIS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return

  e.respondWith(
    caches.match(req).then((cacheado) => {
      const rede = fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copia = resp.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
          }
          return resp
        })
        .catch(() => cacheado)

      // navegações sem cache caem no index (app de página única)
      if (cacheado) return cacheado
      return rede.catch(() => caches.match('./index.html'))
    }),
  )
})
