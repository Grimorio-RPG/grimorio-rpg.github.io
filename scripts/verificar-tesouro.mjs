// Verifica o sorteio do tesouro.
//
// Não existia nada disto: o DM distribuía moeda por fora, de cabeça, e o
// momento em que a mesa mais presta atenção — o fim do combate — terminava
// numa linha de XP.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'tesouro-'))
const compilar = (entrada, saida) => {
  const alvo = join(dir, saida)
  execSync(`npx esbuild ${entrada} --bundle --outfile=${alvo} --format=esm --log-level=error`)
  return import(pathToFileURL(alvo).href)
}

const {
  sortearTesouro, sortearDoEncontro, dividirMoedas, descreveMoedas,
  saqueTemAlgo, temTesouro, saqueVazio,
} = await compilar('src/lib/tesouro.ts', 'tesouro.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

// ---------------------------------------------------------------------------
console.log('Sorteio')

// 2d6 dá entre 2 e 12. Cem tentativas: qualquer valor fora disso é bug, e é
// muito improvável não ver variação nenhuma se o dado estiver rolando mesmo.
const vistos = new Set()
for (let i = 0; i < 100; i++) {
  const s = sortearTesouro({ moedas: [{ moeda: 'po', dado: '2d6' }], itens: [] })
  vistos.add(s.moedas.po)
  if (s.moedas.po < 2 || s.moedas.po > 12) {
    checar('2d6 fica entre 2 e 12', false, `saiu ${s.moedas.po}`)
    break
  }
}
checar('2d6 fica entre 2 e 12', [...vistos].every((v) => v >= 2 && v <= 12))
checar('e varia entre encontros', vistos.size > 1, `só saiu ${[...vistos].join()}`)

// Muita gente escreve o valor direto.
const fixo = sortearTesouro({ moedas: [{ moeda: 'pp', dado: '15' }], itens: [] })
checar('número solto também vale', fixo.moedas.pp === 15, `saiu ${fixo.moedas.pp}`)

const lixo = sortearTesouro({ moedas: [{ moeda: 'po', dado: 'abc' }], itens: [] })
checar('texto sem sentido não vira moeda', lixo.moedas.po === 0)

// Item sem chance cai sempre; com chance, é sorteado por conta própria.
const certo = sortearTesouro({ moedas: [], itens: [{ id: 'a', nome: 'Corda' }] })
checar('item sem chance cai sempre', certo.itens.length === 1)

const nunca = sortearTesouro({ moedas: [], itens: [{ id: 'a', nome: 'Nunca', chance: 0 }] })
checar('chance 0 nunca cai', nunca.itens.length === 0)

let caiu = 0
for (let i = 0; i < 400; i++) {
  if (sortearTesouro({ moedas: [], itens: [{ id: 'a', nome: 'X', chance: 50 }] }).itens.length) caiu++
}
checar('chance 50% cai perto da metade', caiu > 120 && caiu < 280, `caiu ${caiu}/400`)

checar('item sem nome é ignorado',
  sortearTesouro({ moedas: [], itens: [{ id: 'a', nome: '   ' }] }).itens.length === 0)

// ---------------------------------------------------------------------------
console.log('Encontro inteiro')

// Seis goblins são seis bolsos, não um multiplicado — cada um rola o seu.
const goblin = { id: 'g', tesouro: { moedas: [{ moeda: 'pp', dado: '3' }], itens: [] } }
const seis = sortearDoEncontro(Array.from({ length: 6 }, () => goblin))
checar('cada criatura rola o próprio tesouro', seis.moedas.pp === 18, `deu ${seis.moedas.pp}`)

checar('criatura sem tesouro não atrapalha',
  sortearDoEncontro([{ id: 'x' }, goblin]).moedas.pp === 3)
checar('encontro sem nada não dá nada', !saqueTemAlgo(sortearDoEncontro([{ id: 'x' }])))

// ---------------------------------------------------------------------------
console.log('Quando a tela de recompensa aparece')
//
// A regra que a tela usa, escrita aqui porque ela já falhou: encerrar sem
// nenhuma ficha na batalha jogava o tesouro fora em silêncio. E rodar o combate
// sem os PCs na lista é o caso comum — as fichas estão no celular deles.

/** Espelha a condição de `encerrar()` em BattlePage. */
const mostraRecompensa = (xpTotal, saque) => !(xpTotal <= 0 && !saqueTemAlgo(saque))

const comSaque = sortearDoEncontro([goblin])
checar('só saque, sem XP: mostra', mostraRecompensa(0, comSaque))
checar('só XP, sem saque: mostra', mostraRecompensa(1800, saqueVazio()))
checar('XP e saque: mostra', mostraRecompensa(1800, comSaque))
checar('nem XP nem saque: não mostra', !mostraRecompensa(0, saqueVazio()))

// ---------------------------------------------------------------------------
console.log('Divisão')

const { cada, sobra } = dividirMoedas({ pc: 0, pp: 0, pe: 0, po: 10, pl: 0 }, 4)
checar('divide o que dá', cada.po === 2)
// A sobra fica visível em vez de sumir: numa mesa de verdade alguém pega a
// moeda que resta, e uma peça evaporando faz o jogador desconfiar da conta.
checar('e o resto não evapora', sobra.po === 2)
checar('a conta fecha', cada.po * 4 + sobra.po === 10)

const sozinho = dividirMoedas({ pc: 0, pp: 0, pe: 0, po: 7, pl: 0 }, 1)
checar('com uma pessoa, leva tudo', sozinho.cada.po === 7 && sozinho.sobra.po === 0)

const ninguem = dividirMoedas({ pc: 0, pp: 0, pe: 0, po: 7, pl: 0 }, 0)
checar('sem ninguém, nada é dividido', ninguem.cada.po === 0 && ninguem.sobra.po === 7)

// ---------------------------------------------------------------------------
console.log('Texto')

const desc = descreveMoedas({ pc: 5, pp: 0, pe: 0, po: 12, pl: 1 })
checar('só mostra o que caiu', !desc.includes('PP') && !desc.includes('PE'), desc)
checar('do mais valioso para o menos', desc.indexOf('PL') < desc.indexOf('PO'), desc)
checar('vazio quando não caiu nada', descreveMoedas({ pc: 0, pp: 0, pe: 0, po: 0, pl: 0 }) === '')

checar('tesouro sem conteúdo não conta como tesouro',
  !temTesouro({ moedas: [{ moeda: 'po', dado: '  ' }], itens: [{ id: 'a', nome: '' }] }))
checar('mas com uma moeda, conta',
  temTesouro({ moedas: [{ moeda: 'po', dado: '1d6' }], itens: [] }))
checar('e sem tesouro nenhum, não', !temTesouro(undefined))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de tesouro falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de tesouro passaram`)
