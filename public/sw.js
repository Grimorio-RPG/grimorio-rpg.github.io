// Service worker do Grimório 5.5e.
//
// Duas estratégias, escolhidas pelo tipo de arquivo — e a razão de existirem
// duas é uma só: antes, tudo era servido do cache primeiro, então a atualização
// só aparecia no SEGUNDO refresh. Você avisava o grupo "recarrega aí", a pessoa
// recarregava, via a versão velha e concluía que estava quebrado.
//
//   - `index.html` e navegações → REDE PRIMEIRO. É o arquivo que aponta para os
//     bundles novos; buscá-lo da rede faz a atualização valer no primeiro
//     refresh. Cai no cache quando não há internet, então o app continua
//     abrindo offline.
//
//   - `assets/*` com hash no nome → CACHE PRIMEIRO, sem pensar duas vezes. O
//     nome muda a cada build, então um arquivo em cache nunca fica
//     desatualizado: se o conteúdo mudou, o nome mudou.
//
// Os dados do usuário ficam no IndexedDB, nunca aqui.

const CACHE = 'grimorio-v2'
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

/** Arquivo com hash no nome (ex: index-BOHKqvMT.js) nunca muda de conteúdo. */
function ehImutavel(url) {
  return /\/assets\/.+-[A-Za-z0-9_-]{8,}\.(js|css|woff2?)$/.test(url)
}

function guardar(req, resp) {
  if (resp && resp.status === 200 && resp.type === 'basic') {
    const copia = resp.clone()
    caches.open(CACHE).then((c) => c.put(req, copia))
  }
  return resp
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return

  // Cache primeiro: o hash no nome garante que não há versão mais nova.
  if (ehImutavel(req.url)) {
    e.respondWith(
      caches.match(req).then((cacheado) => cacheado || fetch(req).then((r) => guardar(req, r))),
    )
    return
  }

  // Rede primeiro para o resto — é o que faz a atualização chegar de primeira.
  e.respondWith(
    fetch(req)
      .then((r) => guardar(req, r))
      .catch(() =>
        caches.match(req).then((cacheado) => {
          if (cacheado) return cacheado
          // Rota de página única sem cache próprio: entrega o index.
          if (req.mode === 'navigate') return caches.match('./index.html')
          return Response.error()
        }),
      ),
  )
})
