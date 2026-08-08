// Verifica as contas de magia: quantas a classe dá, e quantas a ficha tem.
//
// O defeito que originou isto não dava erro nenhum. O jogador fez um mago,
// subiu até o nível 4, e a ficha ficou impecável — CA, perícias, salvaguardas,
// espaços de magia — e vazia justamente onde um mago existe: nenhum truque,
// nenhuma magia no livro, nada preparado. O app nunca perguntou porque nunca
// soube que devia.
//
// Por isso as checagens aqui são quase todas sobre NÚMEROS ESPERADOS escritos
// à mão, conferidos contra a tabela do livro. Comparar a tabela com ela mesma
// não pegaria uma coluna lida da posição errada — e foi exatamente esse o erro
// que a extração cometeu na primeira tentativa, saindo plausível e toda zerada.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'conj-'))
execSync(
  `npx esbuild src/lib/conjuracao.ts src/data/progression.ts ` +
    `--bundle --splitting --outdir=${dir} --format=esm --log-level=error`,
)
const carregar = (n) => import(pathToFileURL(join(dir, `${n}.js`)).href)
const {
  quotaDoNivel, tamanhoDoGrimorio, usaGrimorio, listaFixa,
  contar, oQueFalta, ganhoDoNivel,
} = await carregar('lib/conjuracao')
const { espacosPorNivel, temEspacos, maiorCirculo } = await carregar('data/progression')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const ficha = (extra = {}) => ({
  id: 'f1', nome: 'Merlin', classe: 'Mago', nivel: 4,
  magias: [], espacosMagia: [], ...extra,
})
const magia = (nome, nivel, preparada = false) => ({ id: nome, nome, nivel, preparada })

// ---------------------------------------------------------------------------
console.log('A tabela do SRD')
//
// Números conferidos contra a tabela impressa, um a um. É o único jeito de a
// checagem valer alguma coisa: qualquer conta derivada da própria tabela
// passaria mesmo com a coluna errada.

const esperado = [
  ['Mago', 1, 3, 4], ['Mago', 4, 4, 7], ['Mago', 10, 5, 15], ['Mago', 20, 5, 25],
  ['Clérigo', 1, 3, 4], ['Clérigo', 20, 5, 22],
  ['Bardo', 1, 2, 4], ['Bardo', 20, 4, 22],
  ['Druida', 1, 2, 4], ['Druida', 20, 4, 22],
  ['Feiticeiro', 1, 4, 2], ['Feiticeiro', 20, 6, 22],
  ['Bruxo', 1, 2, 2], ['Bruxo', 20, 4, 15],
  // Meio-conjuradores não têm truque nenhum — é a diferença que mais some
  // quando se copia a linha de outra classe.
  ['Paladino', 1, 0, 2], ['Paladino', 20, 0, 15],
  ['Patrulheiro', 1, 0, 2], ['Patrulheiro', 20, 0, 15],
]
for (const [classe, nivel, truques, preparadas] of esperado) {
  const q = quotaDoNivel(classe, nivel)
  checar(`${classe} nv${nivel}: ${truques} truques`, q?.truques === truques, `deu ${q?.truques}`)
  checar(`${classe} nv${nivel}: ${preparadas} preparadas`, q?.preparadas === preparadas, `deu ${q?.preparadas}`)
}

checar('quem não conjura não tem quota', quotaDoNivel('Guerreiro', 5) === null)
checar('nem o Bárbaro', quotaDoNivel('Bárbaro', 20) === null)
checar('classe vazia também não', quotaDoNivel('', 1) === null)

// ---------------------------------------------------------------------------
console.log('Os espaços — e o erro de 2014 que a extração pegou')
//
// A tabela à mão dava ZERO espaços a Paladino e Patrulheiro de nível 1, como
// no 5e de 2014. No 2024 eles conjuram desde o começo, e o app estava tirando
// dois espaços de todo meio-conjurador recém-criado sem que nada reclamasse.

checar('Paladino nv1 tem 2 espaços de 1º', espacosPorNivel('Paladino', 1)[0].total === 2,
  `deu ${espacosPorNivel('Paladino', 1)[0].total}`)
checar('Patrulheiro nv1 também', espacosPorNivel('Patrulheiro', 1)[0].total === 2)
checar('e o Mago nv1 continua com 2', espacosPorNivel('Mago', 1)[0].total === 2)
checar('Mago nv20 tem 4 de 1º', espacosPorNivel('Mago', 20)[0].total === 4)
checar('e 1 de 9º', espacosPorNivel('Mago', 20)[8].total === 1)
checar('Guerreiro não tem espaço nenhum',
  espacosPorNivel('Guerreiro', 20).every((s) => s.total === 0))
checar('e a lista sempre tem 9 posições', espacosPorNivel('Guerreiro', 1).length === 9)

// Magia de Pacto: poucos espaços, todos do mesmo círculo.
const bruxo11 = espacosPorNivel('Bruxo', 11)
checar('Bruxo nv11 tem 3 espaços', bruxo11[4].total === 3, bruxo11.map((s) => s.total).join(','))
checar('todos de 5º círculo', bruxo11.filter((s) => s.total > 0).length === 1)

checar('temEspacos vale para o Mago', temEspacos('Mago') === true)
checar('e não para o Ladino', temEspacos('Ladino') === false)

checar('maiorCirculo do Mago nv1 é 1', maiorCirculo('Mago', 1) === 1)
checar('do Mago nv5 é 3', maiorCirculo('Mago', 5) === 3)
checar('do Paladino nv5 é 2', maiorCirculo('Paladino', 5) === 2)
checar('do Bruxo nv9 é 5', maiorCirculo('Bruxo', 9) === 5)
checar('de quem não conjura é 0', maiorCirculo('Guerreiro', 20) === 0)
checar('e nível 0 é 0', maiorCirculo('Mago', 0) === 0)

// ---------------------------------------------------------------------------
console.log('O grimório')

checar('começa com seis', tamanhoDoGrimorio(1) === 6, `deu ${tamanhoDoGrimorio(1)}`)
checar('duas a cada nível: 8 no 2', tamanhoDoGrimorio(2) === 8)
checar('12 no nível 4', tamanhoDoGrimorio(4) === 12)
checar('44 no nível 20', tamanhoDoGrimorio(20) === 44)
checar('só o Mago usa livro', usaGrimorio('Mago') === true)
checar('o Clérigo não', usaGrimorio('Clérigo') === false)
checar('a quota do Mago traz o livro', quotaDoNivel('Mago', 4).grimorio === 12)
checar('a do Clérigo não traz', quotaDoNivel('Clérigo', 4).grimorio === 0)

// ---------------------------------------------------------------------------
console.log('Quem escolhe quando')
//
// Bardo, Feiticeiro e Bruxo trocam a lista AO SUBIR DE NÍVEL — é escolha do
// assistente. Os outros trocam no descanso longo, e cobrar isso na subida
// seria pedir uma decisão que a pessoa refaz de manhã.

for (const c of ['Bardo', 'Feiticeiro', 'Bruxo']) {
  checar(`${c} tem lista fixa`, listaFixa(c) === true)
}
for (const c of ['Clérigo', 'Druida', 'Mago', 'Paladino', 'Patrulheiro']) {
  checar(`${c} troca no descanso`, listaFixa(c) === false)
}

// ---------------------------------------------------------------------------
console.log('Contar o que a ficha tem')

const cont = contar([
  magia('Luz', 0), magia('Mão Mágica', 0),
  magia('Mísseis Mágicos', 1, true), magia('Escudo', 1, true), magia('Sono', 1),
])
checar('conta os truques', cont.truques === 2, `deu ${cont.truques}`)
checar('conta as preparadas', cont.preparadas === 2, `deu ${cont.preparadas}`)
checar('conta as anotadas de círculo', cont.anotadas === 3, `deu ${cont.anotadas}`)
checar('truque não entra em anotadas', contar([magia('Luz', 0)]).anotadas === 0)
// Um truque marcado como preparado não pode inflar a conta: truque não se
// prepara, e contá-lo faria a ficha parecer completa sem estar.
checar('truque marcado não conta como preparada',
  contar([magia('Luz', 0, true)]).preparadas === 0)

// ---------------------------------------------------------------------------
console.log('O caso que originou isto: mago nível 4, ficha vazia')

const merlin = oQueFalta(ficha())
checar('faltam os 4 truques', merlin.truques === 4, `deu ${merlin.truques}`)
checar('faltam as 12 do grimório', merlin.grimorio === 12, `deu ${merlin.grimorio}`)
checar('faltam as 7 preparadas', merlin.preparadas === 7, `deu ${merlin.preparadas}`)
checar('e o app sabe que falta algo', merlin.algo === true)
checar('sem nada excedendo', merlin.excedeu === 0)
checar('até o 2º círculo', merlin.quota.maiorCirculo === 2, `deu ${merlin.quota.maiorCirculo}`)

const guerreiro = oQueFalta(ficha({ classe: 'Guerreiro' }))
checar('quem não conjura não deve nada', guerreiro === null)

// Fora do grimório, anotar é preparar: cobrar as duas contas separadas seria
// inventar um livro que a classe não tem.
const clerigo = oQueFalta(ficha({
  classe: 'Clérigo', nivel: 1,
  magias: [magia('Luz', 0), magia('Mão Mágica', 0), magia('Chama Sagrada', 0),
    magia('Curar Ferimentos', 1, true), magia('Benção', 1, true),
    magia('Escudo da Fé', 1, true), magia('Perdição', 1, true)],
}))
checar('clérigo nv1 completo não deve truque', clerigo.truques === 0)
checar('nem preparadas', clerigo.preparadas === 0, `deu ${clerigo.preparadas}`)
checar('nem grimório, que ele não tem', clerigo.grimorio === 0)
checar('e nada falta', clerigo.algo === false)

// O mago com o livro cheio e a cabeça vazia é um estado LEGAL — e comum de
// manhã. Não pode aparecer como erro.
const livroCheio = oQueFalta(ficha({
  nivel: 1,
  magias: Array.from({ length: 6 }, (_, i) => magia(`Magia ${i}`, 1)),
}))
checar('livro cheio não deve magia', livroCheio.grimorio === 0, `deu ${livroCheio.grimorio}`)
checar('mas ainda falta preparar', livroCheio.preparadas === 4, `deu ${livroCheio.preparadas}`)
checar('e faltam os truques', livroCheio.truques === 3)

// Preparar além do limite é o erro que a mesa comete sem perceber.
const demais = oQueFalta(ficha({
  nivel: 1,
  magias: Array.from({ length: 6 }, (_, i) => magia(`Magia ${i}`, 1, true)),
}))
checar('seis preparadas com limite 4 excedem em 2', demais.excedeu === 2, `deu ${demais.excedeu}`)
checar('e nada falta preparar', demais.preparadas === 0)
checar('mas o app avisa', demais.algo === true)

// Copiar pergaminho enche o livro além da tabela, e isso é regra. Nunca pode
// virar aviso de erro.
const pergaminhos = oQueFalta(ficha({
  nivel: 1,
  magias: Array.from({ length: 20 }, (_, i) => magia(`Magia ${i}`, 1)),
}))
checar('livro além da tabela não acusa nada', pergaminhos.grimorio === 0)

// ---------------------------------------------------------------------------
console.log('O que cada nível traz')

const m34 = ganhoDoNivel('Mago', 3, 4)
checar('mago 3→4 ganha 1 truque', m34.truques === 1, `deu ${m34.truques}`)
checar('e 2 no grimório', m34.grimorio === 2, `deu ${m34.grimorio}`)
checar('e 1 preparada a mais', m34.preparadas === 1)
checar('sem abrir círculo novo', m34.circuloNovo === 0)
checar('e pede escolha', m34.algo === true)

const m45 = ganhoDoNivel('Mago', 4, 5)
checar('mago 4→5 abre o 3º círculo', m45.circuloNovo === 3, `deu ${m45.circuloNovo}`)
checar('sem truque novo', m45.truques === 0)
checar('mas com 2 preparadas a mais', m45.preparadas === 2)

const m12 = ganhoDoNivel('Mago', 1, 2)
checar('mago 1→2 não ganha truque', m12.truques === 0)
checar('mas ganha 2 no livro', m12.grimorio === 2)

const c12 = ganhoDoNivel('Clérigo', 1, 2)
checar('clérigo 1→2 não mexe no livro', c12.grimorio === 0)
checar('e ganha 1 preparada', c12.preparadas === 1)

const g = ganhoDoNivel('Guerreiro', 4, 5)
checar('quem não conjura não ganha magia', g === null)

// Descer de nível não pode virar "ganho negativo". O par 10→9 é de propósito:
// é o único trecho da tabela do Mago onde o truque REALMENTE cai (5 para 4), e
// qualquer outro par deixaria a checagem passar por sorte.
const descendo = ganhoDoNivel('Mago', 10, 9)
checar('descer não dá truque negativo', descendo.truques === 0, `deu ${descendo.truques}`)
checar('nem grimório negativo', descendo.grimorio === 0, `deu ${descendo.grimorio}`)
checar('nem preparadas negativas', descendo.preparadas === 0, `deu ${descendo.preparadas}`)
checar('e não pede escolha nenhuma', descendo.algo === false)

// Multiclasse entrando agora numa classe conjuradora: ganha a quota inteira.
const virouMago = ganhoDoNivel('Mago', 0, 1)
checar('quem vira conjurador ganha os 3 truques', virouMago.truques === 3)
checar('e as 6 do livro', virouMago.grimorio === 6)

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de conjuração falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de conjuração passaram`)
