// Verifica a loja: o dinheiro, o estoque e a troca.
//
// Dinheiro é onde o erro silencioso custa mais caro. Uma moeda perdida por
// arredondamento a cada compra não quebra nada, não aparece em log nenhum, e
// só é notada semanas depois, quando a bolsa não fecha e ninguém sabe desde
// quando. Por isso a conta inteira roda em cobre, e por isso todo teste aqui
// confere que o valor total antes e depois bate exatamente.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

// O `localStorage` que o Node não tem: `loja.ts` importa o armazenamento.
const guardado = new Map()
globalThis.localStorage = {
  getItem: (k) => (guardado.has(k) ? guardado.get(k) : null),
  setItem: (k, v) => guardado.set(k, String(v)),
  removeItem: (k) => guardado.delete(k),
}

const dir = mkdtempSync(join(tmpdir(), 'loja-'))
const ENTRADAS = ['src/lib/loja.ts', 'src/data/srd/index.ts', 'src/data/srd/itens-srd.ts']
execSync(
  `npx esbuild ${ENTRADAS.join(' ')} --bundle --splitting --outdir=${dir} --format=esm --log-level=error`,
)
// O esbuild espelha a estrutura de pastas quando as entradas vêm de lugares
// diferentes: `src/lib/loja.ts` sai em `lib/loja.js`.
const carregar = (n) => import(pathToFileURL(join(dir, `${n}.js`)).href)

const {
  EM_COBRE, emCobre, emOuro, distribuir, podePagar, pagar, receber,
  PORTES, porteInfo, gerarPrateleira, comprar, vender, valorDeVenda,
  lojaVazia, precoNaLoja, ehConsumivel,
} = await carregar('lib/loja')
const { comTraducao, PRECO_POR_RARIDADE } = await carregar('data/srd/index')
const { ITENS_SRD } = await carregar('data/srd/itens-srd')

const CATALOGO = comTraducao(ITENS_SRD)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const bolsa = (p = {}) => ({ pc: 0, pp: 0, pe: 0, po: 0, pl: 0, ...p })

const FICHA = {
  id: 'c1', nome: 'Thorn', nivel: 5, updatedAt: 0,
  atributos: { for: 16, des: 12, con: 14, int: 10, sab: 12, car: 8 },
  moedas: bolsa({ po: 500 }), equipamentos: [], inventario: [],
}

// ---------------------------------------------------------------------------
console.log('A conta do dinheiro')

checar('a tabela de conversão é a do livro',
  EM_COBRE.pc === 1 && EM_COBRE.pp === 10 && EM_COBRE.pe === 50 &&
  EM_COBRE.po === 100 && EM_COBRE.pl === 1000)

checar('bolsa vazia vale zero', emCobre(bolsa()) === 0)
checar('1 PO são 100 PC', emCobre(bolsa({ po: 1 })) === 100)
checar('mistura soma certo',
  emCobre(bolsa({ pl: 1, po: 2, pp: 3, pc: 4 })) === 1234,
  `deu ${emCobre(bolsa({ pl: 1, po: 2, pp: 3, pc: 4 }))}`)
checar('em ouro sai com centavos', emOuro(bolsa({ pp: 5 })) === 0.5)

// Distribuir e voltar tem de dar o mesmo número, sempre. É o teste que pega
// qualquer moeda perdida no arredondamento.
for (const cobre of [0, 1, 9, 10, 99, 100, 1234, 99999, 1000000]) {
  checar(`distribuir ${cobre} PC e somar de volta dá ${cobre}`,
    emCobre(distribuir(cobre)) === cobre,
    `deu ${emCobre(distribuir(cobre))}`)
}

checar('não sobra troco em electro', distribuir(1234).pe === 0)
checar('e o troco usa as moedas maiores primeiro',
  JSON.stringify(distribuir(1234)) === JSON.stringify(bolsa({ pl: 1, po: 2, pp: 3, pc: 4 })),
  JSON.stringify(distribuir(1234)))

// ---------------------------------------------------------------------------
console.log('Pagar')

checar('dá para pagar o que cabe', podePagar(bolsa({ po: 10 }), 10) === true)
checar('e não dá para pagar o que não cabe', podePagar(bolsa({ po: 9 }), 10) === false)
checar('exatamente o valor conta como pagável', podePagar(bolsa({ po: 10 }), 10) === true)

const depois = pagar(bolsa({ po: 10 }), 4)
checar('pagar tira só o preço', emCobre(depois) === 600, `sobrou ${emCobre(depois)}`)
checar('sem dinheiro, pagar devolve nada', pagar(bolsa({ po: 1 }), 10) === null)

// Pagar em cobre um preço em ouro: é aqui que um app que conta em ouro perde
// moeda.
const trocado = pagar(bolsa({ pc: 1000 }), 2.5)
checar('cobre paga preço quebrado', emCobre(trocado) === 750, `sobrou ${emCobre(trocado)}`)

// O electro entra na conta mesmo sem voltar como troco.
checar('o electro conta como valor', podePagar(bolsa({ pe: 4 }), 2) === true)
const semElectro = pagar(bolsa({ pe: 4 }), 1)
checar('mas some depois de gasto', semElectro.pe === 0)
checar('sem sumir com o valor', emCobre(semElectro) === 100, `${emCobre(semElectro)}`)

checar('receber soma', emCobre(receber(bolsa({ po: 1 }), 2)) === 300)
checar('receber e pagar o mesmo valor volta ao começo',
  emCobre(pagar(receber(bolsa({ po: 7 }), 13), 13)) === 700)

// ---------------------------------------------------------------------------
console.log('O porte decide o estoque')
//
// Sem isso o ferreiro do vilarejo vende Espada Vorpal e o dinheiro vira
// vitória.

for (const porte of PORTES) {
  const prateleira = gerarPrateleira(CATALOGO, porte.valor, porte.margem)
  checar(`${porte.nome} enche a prateleira`,
    prateleira.length > 0 && prateleira.length <= porte.itens,
    `${prateleira.length} itens`)
  checar(`${porte.nome} só tem raridade que alcança`,
    prateleira.every((i) => porte.raridades.includes(i.raridade)),
    prateleira.filter((i) => !porte.raridades.includes(i.raridade)).map((i) => `${i.nome}: ${i.raridade}`).join(', '))
  checar(`${porte.nome} não repete item`,
    new Set(prateleira.map((i) => i.chave)).size === prateleira.length)
  checar(`${porte.nome} põe preço em tudo`,
    prateleira.every((i) => i.precoPO > 0))
}

const vilarejo = gerarPrateleira(CATALOGO, 'vilarejo', 1)
checar('o vilarejo NÃO tem item lendário',
  vilarejo.every((i) => i.raridade !== 'Lendário'),
  vilarejo.filter((i) => i.raridade === 'Lendário').map((i) => i.nome).join(', '))

// A margem é o que o DM mexe para a cidade pequena cobrar mais caro.
const caro = gerarPrateleira(CATALOGO, 'vilarejo', 2, () => 0.5)
const normal = gerarPrateleira(CATALOGO, 'vilarejo', 1, () => 0.5)
checar('a margem dobra o preço',
  caro[0].precoPO === normal[0].precoPO * 2,
  `${caro[0].precoPO} vs ${normal[0].precoPO}`)

// Item de várias raridades entra pela mais baixa que a loja alcança.
const naCidade = gerarPrateleira(CATALOGO, 'cidade', 1)
const variavel = naCidade.find((i) => {
  const doCat = CATALOGO.find((c) => c.nome === i.chave)
  return doCat && doCat.raridades.length > 1
})
if (variavel) {
  checar('item de várias raridades entra pela mais baixa que a loja alcança',
    variavel.raridade === 'Comum' || variavel.raridade === 'Incomum',
    `${variavel.nome}: ${variavel.raridade}`)
  checar('e o preço é o daquela raridade',
    variavel.precoPO === PRECO_POR_RARIDADE[variavel.raridade])
}

checar('o preço sai da tabela de raridade',
  precoNaLoja({ raridades: ['Raro'], precoPO: 4000 }, 1) === 4000)
checar('e a margem multiplica', precoNaLoja({ raridades: ['Raro'], precoPO: 4000 }, 1.5) === 6000)

// O que se gasta e acaba não pode custar o mesmo que o que dura a campanha
// inteira. Uma Poção da Forma Gasosa a 4.000 PO nenhuma mesa aceitaria.
const pocao = { raridades: ['Raro'], precoPO: 4000, categoria: 'Potion' }
const espada = { raridades: ['Raro'], precoPO: 4000, categoria: 'Weapon' }
checar('consumível custa menos que item permanente da mesma raridade',
  precoNaLoja(pocao, 1) < precoNaLoja(espada, 1),
  `poção ${precoNaLoja(pocao, 1)} vs espada ${precoNaLoja(espada, 1)}`)
checar('e o desconto é metade', precoNaLoja(pocao, 1) === 2000)
checar('pergaminho também é consumível', ehConsumivel('Scroll') === true)
checar('munição também', ehConsumivel('Ammunition') === true)
checar('mas anel não', ehConsumivel('Ring') === false)

// A poção da prateleira sai mais barata que a espada da mesma raridade.
const comPocao = gerarPrateleira(CATALOGO, 'metropole', 1, () => 0.5)
for (const naPrateleira of comPocao) {
  const doCat = CATALOGO.find((c) => c.nome === naPrateleira.chave)
  if (!ehConsumivel(doCat?.categoria)) continue
  checar(`"${naPrateleira.nome}" está com preço de consumível`,
    naPrateleira.precoPO === PRECO_POR_RARIDADE[naPrateleira.raridade] / 2,
    `${naPrateleira.precoPO} para ${naPrateleira.raridade}`)
}

// ---------------------------------------------------------------------------
console.log('Comprar')

const LOJA = {
  ...lojaVazia(),
  prateleira: [
    { id: 'i1', chave: 'Ring of Protection', nome: 'Anel de Proteção', raridade: 'Raro', precoPO: 4000, qtd: 1 },
    { id: 'i2', chave: 'Potion of Healing', nome: 'Poção de Cura', raridade: 'Comum', precoPO: 100, qtd: 3 },
  ],
}

const rico = { ...FICHA, moedas: bolsa({ po: 5000 }) }
const compra = comprar(rico, LOJA, 'i1', CATALOGO)
checar('a compra dá certo', compra.ok === true, compra.motivo)
checar('o dinheiro sai da bolsa',
  emCobre(compra.char.moedas) === emCobre(rico.moedas) - 400000,
  `${emOuro(compra.char.moedas)} PO`)
checar('o item entra na mochila de EQUIPAMENTO', compra.char.equipamentos.length === 1)
checar('com o nome em português', compra.char.equipamentos[0]?.nome === 'Anel de Proteção')
checar('e a raridade', compra.char.equipamentos[0]?.raridade === 'Raro')
checar('e a descrição traduzida',
  (compra.char.equipamentos[0]?.descricao ?? '').includes('Classe de Armadura'),
  compra.char.equipamentos[0]?.descricao?.slice(0, 60))
// O nome oficial viaja COM o item. A mochila é olhada com a loja fechada, e o
// catálogo do SRD só desce quando alguém abre a loja — buscar na hora deixaria
// a referência vazia justamente onde ela serve, que é para achar no livro.
checar('o nome em inglês vem junto',
  compra.char.equipamentos[0]?.nomeOriginal === 'Ring of Protection',
  compra.char.equipamentos[0]?.nomeOriginal)
checar('sem entrar vestido', !compra.char.equipamentos[0]?.equipado)
checar('nem sintonizado sozinho', !compra.char.equipamentos[0]?.sintonizado)
checar('mas sabendo que exige sintonia', compra.char.equipamentos[0]?.sintonia === true)
checar('e some da prateleira', compra.loja.prateleira.length === 1)

// A ficha e a loja de entrada não podem mudar: metade dos erros de loja é o
// dinheiro sair e o item não entrar porque alguém mexeu num dos dois no meio.
checar('a ficha original não foi mexida', (rico.equipamentos ?? []).length === 0,
  `ficou com ${(rico.equipamentos ?? []).length}`)
checar('nem a bolsa dela', emCobre(rico.moedas) === 500000)
checar('nem a prateleira original', LOJA.prateleira.length === 2)

// Item com quantidade diminui em vez de sumir.
const dePocao = comprar(rico, LOJA, 'i2', CATALOGO)
checar('poção com quantidade só diminui',
  dePocao.loja.prateleira.find((i) => i.id === 'i2')?.qtd === 2)

const pobre = { ...FICHA, moedas: bolsa({ po: 10 }) }
const semGrana = comprar(pobre, LOJA, 'i1', CATALOGO)
checar('sem dinheiro a compra falha', semGrana.ok === false)
checar('e diz por quê', /insuficiente/i.test(semGrana.motivo ?? ''))
checar('sem tirar dinheiro', emCobre(semGrana.char.moedas) === 1000)
checar('nem entregar o item', (semGrana.char.equipamentos ?? []).length === 0)

const naoExiste = comprar(rico, LOJA, 'nao-existe', CATALOGO)
checar('comprar o que não está na prateleira falha', naoExiste.ok === false)

// ---------------------------------------------------------------------------
console.log('Vender')

const comItem = {
  ...FICHA,
  moedas: bolsa({ po: 10 }),
  equipamentos: [
    { id: 'e1', nome: 'Anel de Proteção', slot: 'anel1', raridade: 'Raro', efeitos: [], equipado: false },
    { id: 'e2', nome: 'Cota de Malha', slot: 'corpo', efeitos: [], equipado: true },
  ],
}

const venda = vender(comItem, LOJA, 'e1')
checar('a venda dá certo', venda.ok === true, venda.motivo)
checar('o item sai da mochila', (venda.char.equipamentos ?? []).length === 1)
// Raro custa 4.000 e a loja paga metade.
checar('e o dinheiro entra pela metade da tabela',
  emOuro(venda.char.moedas) === 2010, `${emOuro(venda.char.moedas)} PO`)
checar('o valor de venda é metade da tabela',
  valorDeVenda(comItem.equipamentos[0], LOJA) === 2000)

// Uma poção comprada por 2.000 não pode ser revendida por 2.000: o preço pago
// fica guardado no item e vence a tabela de raridade.
const pocaoComprada = { id: 'p', nome: 'Poção', slot: 'pescoco', raridade: 'Raro', precoPO: 2000, efeitos: [] }
checar('a revenda usa o preço que o item guardou',
  valorDeVenda(pocaoComprada, LOJA) === 1000,
  `${valorDeVenda(pocaoComprada, LOJA)}`)
checar('e sem preço guardado cai na tabela',
  valorDeVenda({ ...pocaoComprada, precoPO: undefined }, LOJA) === 2000)

const compradaNaLoja = comprar(rico, LOJA, 'i1', CATALOGO)
checar('o item comprado guarda quanto custou',
  compradaNaLoja.char.equipamentos[0]?.precoPO === 4000)

// Vender o que está vestido tiraria a armadura da pessoa sem ela reparar.
const vestido = vender(comItem, LOJA, 'e2')
checar('não dá para vender o que está vestido', vestido.ok === false)
checar('e diz para tirar antes', /tire/i.test(vestido.motivo ?? ''))

// Quantidade conta: dez dardos valem dez.
const dezDardos = {
  ...comItem,
  equipamentos: [{ id: 'd', nome: 'Dardo', slot: 'maoPrincipal', efeitos: [], equipado: false, qtd: 10 }],
}
checar('a quantidade multiplica o valor de venda',
  valorDeVenda(dezDardos.equipamentos[0], LOJA) === 500,
  `${valorDeVenda(dezDardos.equipamentos[0], LOJA)}`)

// Comprar e vender na sequência não pode criar dinheiro do nada.
const ida = comprar(rico, LOJA, 'i1', CATALOGO)
const volta = vender(ida.char, ida.loja, ida.char.equipamentos[0]?.id ?? 'x')
checar('comprar e revender custa a diferença, não dá lucro',
  emCobre(volta.char.moedas) < emCobre(rico.moedas),
  `${emOuro(rico.moedas)} → ${emOuro(volta.char.moedas)}`)
checar('e a diferença é exatamente a margem do vendedor',
  emOuro(rico.moedas) - emOuro(volta.char.moedas) === 2000,
  `${emOuro(rico.moedas) - emOuro(volta.char.moedas)}`)

// ---------------------------------------------------------------------------
console.log('Sem nada')

checar('porte desconhecido cai num padrão', !!porteInfo('inventado'))
checar('catálogo vazio não quebra', gerarPrateleira([], 'cidade', 1).length === 0)
const semEquip = vender({ ...FICHA, equipamentos: [] }, LOJA, 'x')
checar('vender item inexistente falha sem quebrar', semEquip.ok === false)

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de loja falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de loja passaram`)
