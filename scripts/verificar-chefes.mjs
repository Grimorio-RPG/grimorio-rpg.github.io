// Verifica o que faz um chefe ser chefe: agir fora do próprio turno.
//
// Antes disto o app não tinha o conceito. O leitor de bloco de estatísticas
// PARAVA ao encontrar "LENDÁRIAS", e reações e ações bônus sumiam pelo mesmo
// motivo — quem colava um dragão do livro recebia três ataques e perdia o resto.
//
// O caso de teste é um dragão vermelho adulto escrito como sai de um
// copiar/colar, com todas as seções.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'chefes-'))
const compilar = (entrada, saida) => {
  const alvo = join(dir, saida)
  execSync(`npx esbuild ${entrada} --bundle --outfile=${alvo} --format=esm --log-level=error`)
  return import(pathToFileURL(alvo).href)
}

const { lerStatBlock } = await compilar('src/lib/statblock.ts', 'statblock.js')
const { momentoDoCovil, recarregarLendarias, gastarLendarias, comLendariasDisponiveis } =
  await compilar('src/lib/battle.ts', 'battle.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

// ---------------------------------------------------------------------------
console.log('Leitura das seções')

const DRAGAO = `Dragão Vermelho Adulto
Dragão Grande, caótico e mau

CA 19
PV 256
Deslocamento 12 m, voo 24 m
FOR     DES     CON     INT     SAB     CAR
27 (+8) 10 (+0) 25 (+7) 16 (+3) 13 (+1) 21 (+5)
ND 17

CARACTERÍSTICAS
Resistência Lendária. Se falhar numa salvaguarda, pode escolher passar.

AÇÕES
Ataque Múltiplo. Faz três ataques: um de Mordida e dois de Garra.
Mordida. +14 para acertar, 2d10+8 de dano perfurante.

AÇÕES BÔNUS
Investida Flamejante. Move-se até metade do deslocamento.

REAÇÃO
Cauda Reflexa. Quando um inimigo o acerta, faz um ataque de Cauda.

AÇÕES LENDÁRIAS
O dragão pode realizar 3 ações lendárias, escolhendo entre as opções abaixo.
Ataque de Cauda. O dragão faz um ataque de Cauda.
Presença Aterrorizante (Custa 2 Ações). Cada inimigo a 36 m faz uma salvaguarda.

AÇÕES DE COVIL
Na iniciativa 20, o dragão usa uma ação de covil.
Fenda Vulcânica. Uma fenda se abre; criaturas sobre ela caem.
`

const { campos } = lerStatBlock(DRAGAO)
const acoes = campos.acoes ?? []
const doTipo = (t) => acoes.filter((a) => a.tipo === t)

checar('a seção AÇÕES vira ações', doTipo('acao').length === 2, `achei ${doTipo('acao').length}`)
checar('AÇÕES BÔNUS não some', doTipo('bonus').length === 1)
checar('REAÇÃO não some', doTipo('reacao').length === 1)
checar('AÇÕES LENDÁRIAS não somem', doTipo('lendaria').length === 2)
checar('AÇÕES DE COVIL não somem', doTipo('covil').length === 1)

checar('o orçamento lendário vem do preâmbulo, não da contagem de entradas',
  campos.acoesLendarias === 3,
  `esperava 3, veio ${campos.acoesLendarias} (há só 2 entradas listadas)`)

const cara = doTipo('lendaria').find((a) => a.nome.startsWith('Presença'))
checar('o custo entre parênteses é lido', cara?.custoLendaria === 2, `veio ${cara?.custoLendaria}`)
checar('e sai do nome', cara ? !/custa/i.test(cara.nome) : false, `nome: ${cara?.nome}`)

const barata = doTipo('lendaria').find((a) => a.nome === 'Ataque de Cauda')
checar('sem parênteses, o custo fica implícito em 1', barata?.custoLendaria === undefined)

// O preâmbulo é uma frase de regra, não um golpe. Ele tem a mesma forma
// "Maiúscula … ponto" das entradas de verdade.
const nomes = acoes.map((a) => a.nome).join(' | ')
checar('o preâmbulo lendário não vira ação', !/pode realizar/i.test(nomes), nomes)
checar('o preâmbulo de covil não vira ação', !/^Na iniciativa/im.test(nomes), nomes)

// Abertura CURTA: antes escapava só por passar de 60 caracteres.
const { campos: curto } = lerStatBlock(`Belak
AÇÕES LENDÁRIAS
Belak tem 2 ações lendárias.
Raiz Agarradora. Uma criatura faz uma salvaguarda de FOR.
`)
checar('abertura curta também é reconhecida como preâmbulo',
  curto.acoesLendarias === 2 && (curto.acoes ?? []).length === 1,
  `orçamento ${curto.acoesLendarias}, ${(curto.acoes ?? []).length} ações`)

// ---------------------------------------------------------------------------
console.log('Orçamento lendário em combate')

const chefe = {
  id: 'x1', origem: 'inimigo', refId: 'm1', nome: 'Dragão',
  imagemUrl: '', imagemJogadorUrl: '', conhecimento: 'encontrado',
  ca: 19, pvMax: 256, pvAtual: 256, iniciativa: 14, iniciativaMod: 0,
  nomeOculto: false, condicoes: [], lendariasMax: 3, lendariasRestantes: 3,
}
const heroi = {
  id: 'h1', origem: 'aliado', refId: 'c1', nome: 'Thorn',
  imagemUrl: '', imagemJogadorUrl: '', conhecimento: 'completo',
  ca: 17, pvMax: 40, pvAtual: 40, iniciativa: 18, iniciativaMod: 0,
  nomeOculto: false, condicoes: [],
}

const gasto2 = gastarLendarias([chefe], 'x1', 2)
checar('gastar desconta do orçamento', gasto2[0].lendariasRestantes === 1)
checar('gastar não passa de zero', gastarLendarias(gasto2, 'x1', 5)[0].lendariasRestantes === 0)

const recarregado = recarregarLendarias(gasto2, 'x1')
checar('o turno da criatura devolve o orçamento cheio', recarregado[0].lendariasRestantes === 3)
checar('quem não tem lendárias não ganha nenhuma',
  recarregarLendarias([heroi], 'h1')[0].lendariasRestantes === undefined)

// As lendárias são gastas ENTRE os turnos dela: no turno dela, não se oferece.
const noTurnoDoHeroi = { emAndamento: true, turnoIndex: 0, rodada: 1, combatentes: [chefe, heroi] }
checar('no turno do herói, o chefe pode agir',
  comLendariasDisponiveis(noTurnoDoHeroi).length === 1)

const noTurnoDoChefe = { ...noTurnoDoHeroi, turnoIndex: 1 }
checar('no turno do próprio chefe, não se oferece lendária',
  comLendariasDisponiveis(noTurnoDoChefe).length === 0)

checar('sem orçamento restante, não se oferece',
  comLendariasDisponiveis({ ...noTurnoDoHeroi, combatentes: [{ ...chefe, lendariasRestantes: 0 }, heroi] }).length === 0)

checar('chefe morto não age',
  comLendariasDisponiveis({ ...noTurnoDoHeroi, combatentes: [{ ...chefe, pvAtual: 0 }, heroi] }).length === 0)

// ---------------------------------------------------------------------------
console.log('Iniciativa 20 (ações de covil)')

// A regra é "iniciativa 20, perdendo empates": depois de quem tirou 20 ou mais,
// antes do primeiro que tirou menos.
const rapido = { ...heroi, id: 'r1', nome: 'Ágil', iniciativa: 22 }
const exato = { ...heroi, id: 'e1', nome: 'Exato', iniciativa: 20 }
const lento = { ...heroi, id: 'l1', nome: 'Lento', iniciativa: 8 }

const cena = (turnoIndex, combatentes) => ({ emAndamento: true, rodada: 1, turnoIndex, combatentes })

// ordem: Ágil(22), Exato(20), Dragão(14), Lento(8)
const quatro = [rapido, exato, chefe, lento]
checar('não é no turno de quem tirou mais de 20', !momentoDoCovil(cena(0, quatro)))
checar('nem no turno de quem tirou exatamente 20', !momentoDoCovil(cena(1, quatro)))
checar('é no primeiro turno abaixo de 20', momentoDoCovil(cena(2, quatro)))
checar('e não se repete no turno seguinte', !momentoDoCovil(cena(3, quatro)))

// Ninguém tirou 20+: o primeiro da ordem já é o momento.
const soLentos = [chefe, lento]
checar('sem ninguém acima de 20, vale o primeiro da ordem', momentoDoCovil(cena(0, soLentos)))

checar('fora de combate, nunca', !momentoDoCovil({ ...cena(2, quatro), emAndamento: false }))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de chefe falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de chefe passaram`)
