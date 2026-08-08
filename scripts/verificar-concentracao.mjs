// Verifica a concentração: quando ela cai, e contra quanto se testa.
//
// É o erro de regra mais comum de mesa. O mago segura uma magia, leva uma
// flechada no meio da rodada, ninguém lembra do teste — e a Teia continua de pé
// por mais três turnos porque nenhuma parte do jogo apontou para ela.
//
// O perigo aqui não é errar a conta: é a regra ser generosa demais sem que
// ninguém repare. Uma concentração que nunca cai não quebra nada, não dá erro,
// e deixa o jogo mais fácil em silêncio.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'conc-'))
execSync(
  `npx esbuild src/lib/concentracao.ts --bundle --outfile=${join(dir, 'c.js')} ` +
    `--format=esm --log-level=error`,
)
const {
  aoMudar, cdDeConcentracao, condicaoDerruba, passouNoTeste, semConcentracao,
  CONDICOES_QUE_DERRUBAM,
} = await import(pathToFileURL(join(dir, 'c.js')).href)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const mago = (extra = {}) => ({
  id: 'm1', refId: 'f1', nome: 'Elara', origem: 'aliado',
  pvAtual: 30, pvMax: 30, ca: 12, iniciativa: 14, condicoes: [],
  concentracao: 'Teia', x: 0, y: 0, ...extra,
})

// ---------------------------------------------------------------------------
console.log('A CD é 10 ou metade do dano')

checar('dano pequeno dá CD 10', cdDeConcentracao(4) === 10, `deu ${cdDeConcentracao(4)}`)
checar('exatamente 20 de dano dá CD 10', cdDeConcentracao(20) === 10, `deu ${cdDeConcentracao(20)}`)
checar('22 de dano dá CD 11', cdDeConcentracao(22) === 11, `deu ${cdDeConcentracao(22)}`)
checar('a metade arredonda para baixo', cdDeConcentracao(23) === 11, `deu ${cdDeConcentracao(23)}`)
checar('dano enorme sobe a CD', cdDeConcentracao(60) === 30, `deu ${cdDeConcentracao(60)}`)

// ---------------------------------------------------------------------------
console.log('Quando se testa')

const levouDano = aoMudar(mago(), { pvAtual: 18 })
checar('dano pede teste', !!levouDano.teste)
checar('com a CD do dano', levouDano.teste?.cd === 10, `deu ${levouDano.teste?.cd}`)
checar('e o dano junto, para a tela dizer', levouDano.teste?.dano === 12)
checar('sem derrubar sozinho', levouDano.caiu === false)

const golpeForte = aoMudar(mago({ pvAtual: 60, pvMax: 60 }), { pvAtual: 30 })
checar('golpe de 30 dá CD 15', golpeForte.teste?.cd === 15, `deu ${golpeForte.teste?.cd}`)

checar('cura não pede teste', aoMudar(mago({ pvAtual: 10 }), { pvAtual: 20 }).teste === null)
checar('nem mudança que não é de vida',
  aoMudar(mago(), { iniciativa: 20 }).teste === null)
checar('quem não concentra não testa',
  aoMudar(mago({ concentracao: '' }), { pvAtual: 1 }).teste === null)
checar('e não cai', aoMudar(mago({ concentracao: '' }), { pvAtual: 0 }).caiu === false)

// ---------------------------------------------------------------------------
console.log('Quando cai sem teste')
//
// Cair a 0 e ficar Incapacitado derrubam a magia direto. Pedir uma rolagem aí
// seria pedir à mesa um dado cujo resultado não muda nada.

const morreu = aoMudar(mago(), { pvAtual: 0 })
checar('cair a 0 derruba', morreu.caiu === true)
checar('e NÃO pede teste', morreu.teste === null)
checar('dizendo por quê', /0 pontos de vida/.test(morreu.motivo), morreu.motivo)

const dano_e_zero = aoMudar(mago({ pvAtual: 5 }), { pvAtual: -3 })
checar('PV negativo também derruba', dano_e_zero.caiu === true)
checar('e sem teste, mesmo tendo sofrido dano', dano_e_zero.teste === null)

// A lista é nomeada, e não percorrida a partir dela mesma. Percorrer a lista
// exportada testa menos coisas quando alguém tira uma condição dela — o teste
// continua verde e a regra fica mais frouxa. Foi assim que uma sabotagem que
// removia "Petrificado" passou.
const DERRUBAM = ['Incapacitado', 'Inconsciente', 'Atordoado', 'Paralisado', 'Petrificado']
for (const c of DERRUBAM) {
  checar(`${c} está na lista`, CONDICOES_QUE_DERRUBAM.includes(c))
  const r = aoMudar(mago(), { condicoes: [c] })
  checar(`${c} derruba`, r.caiu === true)
  checar(`e ${c} não pede teste`, r.teste === null)
}
checar('a lista não tem nada além dessas cinco',
  CONDICOES_QUE_DERRUBAM.length === DERRUBAM.length,
  CONDICOES_QUE_DERRUBAM.join(', '))

checar('condição que não incapacita não derruba',
  aoMudar(mago(), { condicoes: ['Envenenado'] }).caiu === false)
checar('nem Caído', aoMudar(mago(), { condicoes: ['Caído'] }).caiu === false)

// Quem JÁ estava incapacitado e leva dano não "cai de novo" — testa como todo
// mundo. Sem isto, marcar a condição uma segunda vez derrubaria a magia que a
// pessoa nem deveria estar segurando.
const jaIncapacitado = aoMudar(
  mago({ condicoes: ['Incapacitado'] }),
  { condicoes: ['Incapacitado', 'Envenenado'] },
)
checar('condição que já estava lá não derruba de novo', jaIncapacitado.caiu === false)

checar('condicaoDerruba acha a culpada',
  condicaoDerruba(['Envenenado', 'Paralisado']) === 'Paralisado')
checar('e devolve nada quando não há', condicaoDerruba(['Envenenado']) === null)

// ---------------------------------------------------------------------------
console.log('O teste')

checar('passa quando alcança a CD', passouNoTeste(8, 2, 10) === true)
checar('passa quando ultrapassa', passouNoTeste(15, 3, 10) === true)
checar('falha quando fica abaixo', passouNoTeste(6, 2, 10) === false)
checar('o bônus negativo conta', passouNoTeste(11, -2, 10) === false)
checar('sem bônus também funciona', passouNoTeste(10, 0, 10) === true)

// ---------------------------------------------------------------------------
console.log('Soltar a magia')

checar('semConcentracao limpa o campo', semConcentracao().concentracao === '')

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de concentração falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de concentração passaram`)
