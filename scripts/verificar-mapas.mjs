// Verifica os mapas que já vêm no app.
//
// Eles existem para tirar o atrito do pior momento: a mesa esperando enquanto o
// DM procura uma imagem. Se um deles vier quebrado, o resultado é uma tela
// vazia justo em quem está abrindo o app pela primeira vez.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'mapas-'))
const alvo = join(dir, 'mapas.js')
execSync(`npx esbuild src/data/mapas-prontos.ts --bundle --outfile=${alvo} --format=esm --log-level=error`)
const { MAPAS_PRONTOS, urlDoMapaPronto } = await import(pathToFileURL(alvo).href)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

console.log('Catálogo')
checar('há mapas para escolher', MAPAS_PRONTOS.length >= 5, `só ${MAPAS_PRONTOS.length}`)
checar('os ids são únicos', new Set(MAPAS_PRONTOS.map((m) => m.id)).size === MAPAS_PRONTOS.length)
checar('todos têm nome e ícone', MAPAS_PRONTOS.every((m) => m.nome && m.icone))

console.log('As imagens')
for (const m of MAPAS_PRONTOS) {
  const url = urlDoMapaPronto(m.id)

  checar(`${m.nome}: vira data URL de SVG`, url.startsWith('data:image/svg+xml'), url.slice(0, 40))

  const svg = decodeURIComponent(url.split(',')[1])

  // A CSP da versão publicada bloqueia host externo. Um `href` ou um
  // `url(...)` apontando para fora deixaria o mapa em branco só no ar, onde é
  // mais difícil de perceber.
  //
  // O `xmlns` fica de fora da conta: ele é a declaração de namespace do SVG,
  // não um endereço a buscar — a primeira versão desta checagem reprovou os
  // seis mapas por causa dele.
  const semNamespace = svg.replace(/xmlns(:\w+)?="[^"]*"/g, '')
  checar(
    `${m.nome}: não busca nada de fora`,
    !/(href|src)\s*=|url\(\s*['"]?https?:/i.test(semNamespace),
    semNamespace.slice(0, 80),
  )
  checar(`${m.nome}: o SVG abre e fecha`, svg.startsWith('<svg') && svg.trimEnd().endsWith('</svg>'))
  checar(`${m.nome}: declara o namespace`, svg.includes('xmlns="http://www.w3.org/2000/svg"'))
  checar(`${m.nome}: tem viewBox, para escalar sem borrar`, svg.includes('viewBox'))

  // Uma aspa dupla crua quebraria o atributo `src` em alguns navegadores; o
  // encode tem que ter cuidado disso.
  checar(`${m.nome}: sem aspa crua na URL`, !url.includes('"'))

  // Peso: são embutidos no bundle e viajam na sincronização da cena.
  checar(`${m.nome}: cabe sem pesar (< 8 KB)`, url.length < 8192, `${url.length} bytes`)
}

console.log('Id desconhecido')
checar('id inexistente devolve vazio, sem quebrar', urlDoMapaPronto('nao-existe') === '')

// Determinismo: a URL entra no estado da cena e vai pela rede. Se mudasse a
// cada chamada, a sincronização reenviaria o mapa sem nada ter mudado.
const duas = [urlDoMapaPronto('masmorra'), urlDoMapaPronto('masmorra')]
checar('a mesma escolha produz sempre a mesma URL', duas[0] === duas[1])

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de mapa falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de mapa passaram`)
