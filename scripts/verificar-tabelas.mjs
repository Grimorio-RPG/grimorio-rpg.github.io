// Verifica as tabelas sorteáveis do DM.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'tab-'))
const compilar = (entrada, saida) => {
  const alvo = join(dir, saida)
  execSync(`npx esbuild ${entrada} --bundle --outfile=${alvo} --format=esm --log-level=error`)
  return import(pathToFileURL(alvo).href)
}

const { sortear, sortearSemRepetir, tabelasDoContexto, tabelaUtil } =
  await compilar('src/lib/tabelas.ts', 'tabelas.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const tab = (nome, contexto, textos) => ({
  id: nome, nome, contexto,
  entradas: textos.map((t, i) =>
    typeof t === 'string' ? { id: `${i}`, texto: t } : { id: `${i}`, ...t },
  ),
})

// ---------------------------------------------------------------------------
console.log('Sorteio')

const rumores = tab('Rumores', '', ['A ponte caiu', 'O prefeito sumiu', 'Lobos na estrada'])
const saiu = new Set()
for (let i = 0; i < 200; i++) saiu.add(sortear(rumores))
checar('sorteia dentro da tabela',
  [...saiu].every((s) => rumores.entradas.some((e) => e.texto === s)),
  [...saiu].join(' | '))
checar('e alcança todas as entradas com o tempo', saiu.size === 3, `só ${saiu.size}`)

checar('tabela vazia devolve texto vazio', sortear(tab('X', '', [])) === '')
checar('entrada em branco é ignorada', sortear(tab('X', '', ['   ', 'Único'])) === 'Único')

// O peso existe para "nada acontece" ser comum sem seis linhas iguais.
const pesada = tab('Estrada', '', [
  { texto: 'Nada acontece', peso: 9 },
  { texto: 'Emboscada', peso: 1 },
])
let nadas = 0
for (let i = 0; i < 1000; i++) if (sortear(pesada) === 'Nada acontece') nadas++
checar('o peso pende para o lado certo', nadas > 820 && nadas < 960, `${nadas}/1000`)

// ---------------------------------------------------------------------------
console.log('Sem repetir')

// Três rumores seguidos iguais fazem a mesa achar que o botão está quebrado.
for (let i = 0; i < 50; i++) {
  const r = sortearSemRepetir(rumores, ['A ponte caiu'])
  if (r === 'A ponte caiu') {
    checar('não repete o que acabou de sair', false, 'repetiu')
    break
  }
}
checar('não repete o que acabou de sair', true)

// Quando tudo já saiu, repetir é a única saída honesta.
const todas = rumores.entradas.map((e) => e.texto)
checar('com tudo já visto, ainda devolve algo', todas.includes(sortearSemRepetir(rumores, todas)))
// Com uma entrada só, também.
const unica = tab('Uma', '', ['Sempre esta'])
checar('com uma entrada só, repete mesmo', sortearSemRepetir(unica, ['Sempre esta']) === 'Sempre esta')

// ---------------------------------------------------------------------------
console.log('Contexto')

const lista = [
  tab('Floresta', 'floresta', ['Lobos']),
  tab('Cidade', 'Cidade Baixa', ['Batedor de carteira']),
  tab('Geral', '', ['Chove']),
]

const naFloresta = tabelasDoContexto(lista, 'Floresta de Neverwinter')
checar('acha por parte do nome', naFloresta.some((t) => t.nome === 'Floresta'), naFloresta.map((t) => t.nome).join())
checar('tabela sem contexto vale em todo lugar', naFloresta.some((t) => t.nome === 'Geral'))
checar('e a de outro lugar não entra', !naFloresta.some((t) => t.nome === 'Cidade'))

// A comparação é frouxa de propósito: quem escreve com acento e maiúscula num
// lugar e sem no outro quer que os dois se encontrem.
checar('ignora acento e maiúscula',
  tabelasDoContexto([tab('T', 'Ruínas', ['x'])], 'ruinas antigas').length === 1)

checar('sem lugar informado, mostra todas', tabelasDoContexto(lista, '').length === 3)

// ---------------------------------------------------------------------------
console.log('Utilidade')
checar('tabela só com brancos não é útil', !tabelaUtil(tab('X', '', ['  ', ''])))
checar('com uma entrada preenchida, é', tabelaUtil(tab('X', '', ['', 'Algo'])))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de tabela falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de tabela passaram`)
