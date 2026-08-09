// Verifica a economia de ações: o que se gasta no turno, e quando volta.
//
// O turno de D&D tem quatro recursos e o app não marcava nenhum. Quem tem
// muita opção passava o turno tentando lembrar se já usou o bônus, e a mesa
// resolvia na base do "acho que não usei" — que sempre resolve a favor de
// quem está perguntando.
//
// O erro perigoso aqui não é somar errado: é o recurso VOLTAR cedo demais.
// Uma reação que se recarrega sozinha não quebra nada, não dá erro, e faz o
// chefe reagir três vezes por rodada sem que ninguém desconfie.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'acoes-'))
execSync(
  `npx esbuild src/lib/acoes-turno.ts --bundle --outdir=${dir} --format=esm --log-level=error`,
)
const {
  RECURSOS, aoComecarOTurno, alternar, gastou, podeReagir, quemPodeReagir, zerarTodos,
} = await import(pathToFileURL(join(dir, 'acoes-turno.js')).href)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const cri = (id, extra = {}) => ({ id, nome: id, pvAtual: 10, ...extra })

// ---------------------------------------------------------------------------
console.log('Os três recursos')
//
// São TRÊS, e a ausência do quarto é decisão. O movimento já está desenhado na
// régua do tabuleiro e na miniatura que andou — um contador de metros seria a
// única coisa desta tela que a mesa teria de alimentar à mão para saber o que
// já está vendo.

checar('são exatamente três', RECURSOS.length === 3, RECURSOS.map((r) => r.chave).join(', '))
for (const chave of ['acao', 'bonus', 'reacao']) {
  checar(`${chave} está na lista`, RECURSOS.some((r) => r.chave === chave))
}
checar('movimento NÃO entra', !RECURSOS.some((r) => r.chave === 'movimento'))
checar('cada um tem nome e dica',
  RECURSOS.every((r) => r.nome.length > 2 && r.dica.length > 10))

// ---------------------------------------------------------------------------
console.log('Gastar e desmarcar')

const vazio = cri('a')
checar('nada nasce gasto', RECURSOS.every((r) => !gastou(vazio, r.chave)))

const comAcao = { ...vazio, ...alternar(vazio, 'acao') }
checar('gastar a ação marca a ação', gastou(comAcao, 'acao') === true)
checar('e não marca o bônus', gastou(comAcao, 'bonus') === false)
checar('nem a reação', gastou(comAcao, 'reacao') === false)

// Desmarcar existe porque a mesa erra: alguém clica, o DM diz "ainda não", e
// não pode ser preciso passar o turno inteiro para desfazer.
const desmarcada = { ...comAcao, ...alternar(comAcao, 'acao') }
checar('clicar de novo desmarca', gastou(desmarcada, 'acao') === false)

const tudo = ['acao', 'bonus', 'reacao'].reduce(
  (c, r) => ({ ...c, ...alternar(c, r) }), vazio)
checar('dá para gastar os três', RECURSOS.every((r) => gastou(tudo, r.chave)))

checar('gastar não mexe no combatente de entrada', vazio.gastos === undefined)

// ---------------------------------------------------------------------------
console.log('O turno começa e tudo volta')
//
// INCLUSIVE A REAÇÃO. A regra devolve a reação no início do SEU turno, não no
// fim — quem gastou no turno do inimigo passa o intervalo inteiro sem ela, e é
// isso que faz gastá-la ser uma decisão.

const recomeco = { ...tudo, ...aoComecarOTurno() }
checar('a ação volta', gastou(recomeco, 'acao') === false)
checar('o bônus volta', gastou(recomeco, 'bonus') === false)
checar('e a reação volta também', gastou(recomeco, 'reacao') === false)

// ---------------------------------------------------------------------------
console.log('Quem pode reagir')
//
// É a única das três gasta no turno DOS OUTROS, e por isso a única que some da
// vista bem na hora em que importa.

checar('quem não gastou pode', podeReagir(cri('a')) === true)
checar('quem gastou não pode', podeReagir(cri('a', { gastos: { reacao: true } })) === false)
// Quem está a 0 não reage: o monstro morreu, e o aliado está Inconsciente —
// e Inconsciente não tem reação.
checar('quem está a 0 não reage', podeReagir(cri('a', { pvAtual: 0 })) === false)
checar('nem com PV negativo', podeReagir(cri('a', { pvAtual: -5 })) === false)
checar('gastar a AÇÃO não tira a reação',
  podeReagir(cri('a', { gastos: { acao: true } })) === true)

const mesa = [
  cri('elara'),
  cri('goblin', { gastos: { reacao: true } }),
  cri('ogro'),
  cri('rato', { pvAtual: 0 }),
]
const podem = quemPodeReagir(mesa, 'elara')
checar('quem está agindo sai da lista', !podem.some((c) => c.id === 'elara'))
checar('quem já reagiu sai', !podem.some((c) => c.id === 'goblin'))
checar('quem caiu sai', !podem.some((c) => c.id === 'rato'))
checar('e sobra quem pode', podem.map((c) => c.id).join(',') === 'ogro',
  podem.map((c) => c.id).join(','))
checar('sem ninguém agindo, todos que podem entram',
  quemPodeReagir(mesa, null).length === 2)
checar('lista vazia não quebra', quemPodeReagir([], 'x').length === 0)

// ---------------------------------------------------------------------------
console.log('Zerar todo mundo')

const zerados = zerarTodos(mesa)
checar('o combate novo começa limpo',
  zerados.every((c) => !c.gastos || Object.keys(c.gastos).length === 0))
// O laço: um objeto novo a cada leitura faria o DM republicar, o aparelho do
// jogador acordar, o DM publicar de novo, e não parar mais. É a lição que a
// ponte da batalha já custou caro.
const jaLimpos = [cri('a'), cri('b')]
checar('sem nada para zerar, devolve a MESMA lista', zerarTodos(jaLimpos) === jaLimpos)
checar('com algo para zerar, devolve outra', zerarTodos(mesa) !== mesa)
checar('lista vazia devolve a mesma', zerarTodos(jaLimpos.slice(0, 0)).length === 0)

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de economia de ações falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de economia de ações passaram`)
