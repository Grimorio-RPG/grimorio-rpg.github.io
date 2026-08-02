// Verifica que a divisão do app em arquivos por tela continua coerente.
//
// Dividir o pacote espalhou a mesma informação por três lugares: o menu
// (`Layout.tsx`), a tabela do roteador (`App.tsx`) e a lista de `import()`
// (`rotas.ts`). Um caminho escrito diferente em qualquer um deles não quebra a
// compilação nem aparece na tela — só faz o adiantamento parar de acontecer, em
// silêncio, e a aba volta a demorar para abrir. É o tipo de erro que a gente só
// descobre no meio da sessão.

import { readFileSync } from 'node:fs'

let falhas = 0
let testes = 0

function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const rotas = readFileSync('src/pages/rotas.ts', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const layout = readFileSync('src/components/Layout.tsx', 'utf8')

// --- os caminhos declarados em cada lugar ----------------------------------

const doMenu = [...layout.matchAll(/\{\s*to:\s*'([^']+)'/g)].map((m) => m[1])
const dosImports = [...rotas.matchAll(/^\s*'([^']+)':\s*\(\)\s*=>\s*import\('\.\/([A-Za-z]+)'\)/gm)].map(
  (m) => ({ caminho: m[1], pagina: m[2] }),
)
const doRoteador = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1])

checar('o menu tem abas', doMenu.length >= 8, `achei ${doMenu.length}`)
checar('rotas.ts tem telas', dosImports.length >= 8, `achei ${dosImports.length}`)

// --- toda aba do menu precisa ser adiantável -------------------------------
//
// Esta é a que pega o erro de digitação: uma aba com caminho que não existe em
// `IMPORTAR` some do adiantamento sem avisar ninguém.

// A porta de entrada é a exceção combinada: vem no primeiro arquivo, então não
// há o que adiantar.
const SEMPRE_JUNTO = new Set(['/fichas'])

const caminhosImportaveis = new Set(dosImports.map((d) => d.caminho))
for (const to of doMenu) {
  if (SEMPRE_JUNTO.has(to)) continue
  checar(
    `a aba ${to} é adiantada antes do clique`,
    caminhosImportaveis.has(to),
    `não há import() para ${to} em rotas.ts`,
  )
}

// --- todo import precisa virar uma rota de verdade -------------------------

for (const { caminho } of dosImports) {
  const semBarra = caminho.replace(/^\//, '')
  checar(
    `${caminho} está no roteador`,
    doRoteador.includes(semBarra),
    `rotas.ts adianta ${caminho}, mas App.tsx não tem <Route path="${semBarra}">`,
  )
}

// --- toda tela adiada tem de existir como arquivo --------------------------

for (const { pagina } of dosImports) {
  let existe = true
  try {
    readFileSync(`src/pages/${pagina}.tsx`, 'utf8')
  } catch {
    existe = false
  }
  checar(`a tela ${pagina} existe`, existe, `src/pages/${pagina}.tsx não foi encontrado`)
}

// --- o roteador não pode ter esquecido nenhuma tela lá dentro ---------------

const lazysNoApp = [...app.matchAll(/lazy\(/g)].length
checar(
  'o roteador carrega as telas sob demanda',
  lazysNoApp >= dosImports.length,
  `rotas.ts declara ${dosImports.length} telas, App.tsx só usa lazy() ${lazysNoApp} vezes`,
)

// --- a porta de entrada não pode ser adiada --------------------------------
//
// Adiar a primeira tela troca um download por dois: o navegador busca o app,
// descobre que precisa de outro arquivo e volta para a rede antes de desenhar
// qualquer coisa.

checar(
  'a lista de fichas vem no primeiro arquivo',
  /^import CharactersPage from '\.\/pages\/CharactersPage'$/m.test(app),
  'CharactersPage deveria ser importada direto, não por lazy()',
)
checar(
  'a lista de fichas não é adiada',
  !caminhosImportaveis.has('/fichas'),
  '/fichas não deveria estar em rotas.ts',
)

// --- a recuperação de versão precisa continuar de pé ------------------------
//
// Sem ela, publicar durante a sessão deixa a tela em branco para quem estava
// com o app aberto: o arquivo pedido já não existe no servidor.

checar(
  'existe recuperação para arquivo que sumiu numa publicação',
  /location\.reload\(\)/.test(rotas),
  'rotas.ts deveria recarregar quando o import() falha',
)
checar(
  'a recuperação não entra em laço',
  /sessionStorage\.getItem\(MARCA_RECARGA\)/.test(rotas) &&
    /sessionStorage\.removeItem\(MARCA_RECARGA\)/.test(rotas),
  'a marca de recarga precisa ser lida antes e limpa depois de um carregamento bom',
)
checar(
  'adiantar no menu não recarrega a página',
  /export function precarregarRota[\s\S]*?IMPORTAR\[/.test(rotas),
  'precarregarRota deve usar os import() crus, não os que recarregam',
)

// --- o service worker precisa reconhecer os arquivos novos -----------------
//
// Os pedaços por tela têm hash no nome como o resto; se o padrão do service
// worker não casar com eles, cada troca de aba volta para a rede.

const sw = readFileSync('public/sw.js', 'utf8')
const padrao = sw.match(/return (\/.+\/)\.test\(url\)/)
checar('o service worker tem regra de arquivo imutável', !!padrao)
if (padrao) {
  const regex = new RegExp(padrao[1].slice(1, padrao[1].lastIndexOf('/')))
  for (const nome of [
    '/assets/BestiaryPage-Gau_xkpm.js',
    '/assets/CharacterSheet-CgLmUAEY.js',
    '/assets/index-lGPEEYoU.js',
  ]) {
    checar(`o service worker guarda ${nome}`, regex.test(nome))
  }
}

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de rota falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de rota passaram`)
