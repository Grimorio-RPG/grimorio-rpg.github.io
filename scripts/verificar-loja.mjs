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
const ENTRADAS = [
  'src/lib/loja.ts', 'src/lib/loja-nomes.ts',
  'src/data/srd/index.ts', 'src/data/srd/itens-srd.ts',
]
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
  semente, valorDeMercado, precoDaPrateleira, arredondarPreco, PECHINCHA,
  projetarLoja, adicionarNaPrateleira, removerDaPrateleira, precoManual,
  TIPOS, tipoInfo, raridadeIndefinida,
  comEstoqueDosJogadores,
} = await carregar('lib/loja')
const { sortearLoja, TEMAS } = await carregar('lib/loja-nomes')
const { comTraducao, PRECO_POR_RARIDADE } = await carregar('data/srd/index')
const { ITENS_SRD } = await carregar('data/srd/itens-srd')

const CATALOGO = comTraducao(ITENS_SRD)

/** Gerador deterministico: o mesmo numero de partida da a mesma loja. */
function semeado(n) {
  let x = n * 2654435761 + 1
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648
    return x / 2147483648
  }
}

/** Como `checar`, mas so fala quando falha: para uso dentro de laco. */
function checarSilencioso(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  x ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

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
// O preço deixou de ser múltiplo exato da tabela — ele passa pelo valor do
// item e por um arredondamento que fala em voz alta. O que a margem tem de
// garantir é a PROPORÇÃO, não a igualdade ao centavo.
const comMargemDobrada = gerarPrateleira(CATALOGO, 'vilarejo', 2, () => 0.5)
const comMargemNormal = gerarPrateleira(CATALOGO, 'vilarejo', 1, () => 0.5)
checar('a margem quase dobra o preço',
  comMargemDobrada[0].precoPO >= comMargemNormal[0].precoPO * 1.8 &&
  comMargemDobrada[0].precoPO <= comMargemNormal[0].precoPO * 2.2,
  `${comMargemDobrada[0].precoPO} vs ${comMargemNormal[0].precoPO}`)

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
  // Já não é o número da tabela: é a âncora dela, esticada pelo valor do item
  // e pela pechincha do dia. O que não pode é sair de outra raridade.
  const ancora = PRECO_POR_RARIDADE[variavel.raridade]
  checar('e o preço orbita a âncora daquela raridade',
    variavel.precoPO >= ancora * 0.25 && variavel.precoPO <= ancora * 1.8,
    `${variavel.nome}: ${variavel.precoPO} para âncora ${ancora}`)
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
  // O consumível vale METADE, e o valor do item continua esticando em cima
  // disso — o que a checagem cobra é que ele fique claramente abaixo do preço
  // cheio da raridade, não que bata um número exato que não existe mais.
  const cheio = PRECO_POR_RARIDADE[naPrateleira.raridade]
  checar(`"${naPrateleira.nome}" está com preço de consumível`,
    naPrateleira.precoPO < cheio * 0.75 && naPrateleira.precoPO > cheio * 0.2,
    `${naPrateleira.precoPO} para ${naPrateleira.raridade} (cheio ${cheio})`)
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

// ---------------------------------------------------------------------------
console.log('O preco deixar de ser sempre o mesmo')
//
// O SRD da UM numero por raridade, e oito itens incomuns saiam todos a 400 PO.
// A loja virava tabela: sem item caro, sem pechincha, sem motivo para perguntar
// o preco na cidade seguinte.

// O valor de mercado e HASH, nao sorteio. Se variar entre sessoes, o grupo
// nunca aprende que o Manto de Protecao e caro — e aprender preco e metade da
// graca de ter uma loja.
checar('a semente e estavel', semente('Cloak of Protection') === semente('Cloak of Protection'))
checar('e diferente por item', semente('Cloak of Protection') !== semente('Ring of Protection'))
checar('sempre entre 0 e 1',
  ['a', 'Bag of Holding', '', 'Oculos'].every((x) => semente(x) >= 0 && semente(x) < 1))

const valores = ITENS_SRD.slice(0, 60).map((i) => valorDeMercado(i.nome))
checar('o valor de mercado fica na faixa',
  valores.every((v) => v >= 0.7 && v <= 1.4),
  `${Math.min(...valores).toFixed(2)}-${Math.max(...valores).toFixed(2)}`)
// Uma faixa que na pratica nao espalha seria pior do que nao ter faixa: daria
// trabalho e continuaria com tudo custando quase igual.
checar('e ela espalha de verdade',
  Math.max(...valores) - Math.min(...valores) > 0.5,
  `espalhou ${(Math.max(...valores) - Math.min(...valores)).toFixed(2)}`)

// Preco redondo: ninguem pede "417 pecas de ouro".
checar('arredonda o barato de 5 em 5', arredondarPreco(43) === 45, String(arredondarPreco(43)))
checar('o medio de 25 em 25', arredondarPreco(417) === 425, String(arredondarPreco(417)))
checar('o caro de 100 em 100', arredondarPreco(4183) === 4200, String(arredondarPreco(4183)))
checar('o absurdo de 500 em 500', arredondarPreco(41830) === 42000, String(arredondarPreco(41830)))
checar('e nunca devolve zero para item que custa algo', arredondarPreco(1) === 5)
checar('zero continua zero', arredondarPreco(0) === 0)

// A pechincha e a metade sorteada.
const pechinchaBoa = precoDaPrateleira({ chave: 'Cloak of Protection', raridade: 'Incomum' }, 1, () => 0)
const pechinchaRuim = precoDaPrateleira({ chave: 'Cloak of Protection', raridade: 'Incomum' }, 1, () => 1)
checar('a pechincha baixa o preco', pechinchaBoa < pechinchaRuim, `${pechinchaBoa} vs ${pechinchaRuim}`)
checar('e o espalhamento e o combinado',
  Math.abs(pechinchaRuim / pechinchaBoa - (1 + PECHINCHA) / (1 - PECHINCHA)) < 0.25,
  `${pechinchaBoa} -> ${pechinchaRuim}`)
checar('o meio-termo fica perto da ancora do item',
  Math.abs(precoDaPrateleira({ chave: 'Cloak of Protection', raridade: 'Incomum' }, 1, () => 0.5) -
    400 * valorDeMercado('Cloak of Protection')) < 60)

// Sem isto, oito itens incomuns na mesma prateleira voltam a custar igual.
const precos = ITENS_SRD.slice(0, 40).map((i) =>
  precoDaPrateleira({ chave: i.nome, raridade: 'Incomum' }, 1, () => 0.5))
checar('itens da MESMA raridade tem precos diferentes',
  new Set(precos).size > 6, `${new Set(precos).size} precos distintos em 40`)

checar('consumivel custa metade',
  precoDaPrateleira({ chave: 'Potion of Healing', raridade: 'Comum', consumivel: true }, 1, () => 0.5) <
  precoDaPrateleira({ chave: 'Potion of Healing', raridade: 'Comum' }, 1, () => 0.5))
checar('e a margem do porte pesa',
  precoDaPrateleira({ chave: 'Cloak of Protection', raridade: 'Incomum' }, 1.5, () => 0.5) >
  precoDaPrateleira({ chave: 'Cloak of Protection', raridade: 'Incomum' }, 1, () => 0.5))

// A prateleira sorteada tem de herdar tudo isso.
const variada = gerarPrateleira(CATALOGO, 'cidade', 1, semeado(7))
checar('a prateleira sorteada nao sai toda com o mesmo preco',
  new Set(variada.map((i) => i.precoPO)).size > 3,
  variada.map((i) => i.precoPO).join(', '))
checar('e nenhum preco sai quebrado',
  variada.every((i) => i.precoPO % 5 === 0), variada.map((i) => i.precoPO).join(', '))

// ---------------------------------------------------------------------------
console.log('Sortear a loja e o vendedor')

const fechada = { ...lojaVazia(), nome: 'A Bigorna Torta', prateleira: [
  { id: 'p1', chave: 'Ring of Protection', nome: 'Anel de Protecao', raridade: 'Raro', precoPO: 4000, qtd: 1 },
] }
const manto = CATALOGO.find((i) => i.nome === 'Cloak of Protection')

const sorteada = sortearLoja('ferreiro', semeado(3))
checar('sai um nome', sorteada.nome.length > 4, sorteada.nome)
checar('e um vendedor com nome e traco', /,/.test(sorteada.vendedor), sorteada.vendedor)

// O tema É o tipo da loja. Antes o tema saía do PORTE, e uma botica de
// metrópole podia se chamar "O Grimório que Observa" — o nome contava uma
// segunda história sobre o mesmo balcão.
for (const tipo of TIPOS) {
  const tem = TEMAS.find((t) => t.id === tipo.valor)
  checar(`${tipo.nome} tem tema de nome`, !!tem, tipo.valor)
}
for (let i = 0; i < 40; i++) {
  for (const tipo of ['ferreiro', 'botica', 'feira', 'arcana']) {
    const x = sortearLoja(tipo, semeado(i))
    const tema = TEMAS.find((t) => t.id === tipo)
    checarSilencioso(`${tipo} sorteia do proprio tema`, x.tema === tipo, x.tema)
    const coisa = x.nome.split(' ')[1]
    checarSilencioso(`o nome vem do tema ${x.tema}`,
      tema.coisas.some(([c]) => c === coisa), x.nome)
    const [, artigoCerto] = tema.coisas.find(([c]) => c === coisa) ?? []
    checarSilencioso(`o artigo de "${coisa}" esta certo`,
      x.nome.startsWith(`${artigoCerto} `), x.nome)
    // "A Runa Quieto" saiu do gerador antes de a concordancia andar nos dois
    // sentidos. Um nome torto e pior do que campo em branco.
    const adjetivo = x.nome.split(' ').slice(2).join(' ')
    checarSilencioso(`"${x.nome}" concorda`,
      /\s/.test(adjetivo) || !/[oa]$/.test(adjetivo) ||
        adjetivo.endsWith(artigoCerto === 'A' ? 'a' : 'o'),
      x.nome)
    // O traco nao pode ter genero: o nome tem um, e casar os dois exigiria
    // etiquetar cada nome — decidir o genero de uma pessoa para gerar frase.
    const traco = x.vendedor.split(', ')[1]
    checarSilencioso(`"${traco}" nao tem genero`,
      /^(de |que |da |do |em |sem )/.test(traco), traco)
  }
}

// ---------------------------------------------------------------------------
console.log('O tipo decide O QUE aparece')
//
// Porte diz quao bom; tipo diz o que. Sem o tipo, o ferreiro, a feira e a
// botica do mesmo vilarejo vendiam da mesma sacola.

for (const tipo of TIPOS) {
  const prat = gerarPrateleira(CATALOGO, 'metropole', 1, semeado(5), tipo.valor)
  if (tipo.categorias.length === 0) {
    checar(`${tipo.nome} vende de tudo`, prat.length > 0)
    continue
  }
  const fora = prat.filter((i) => {
    const doCat = CATALOGO.find((c) => c.nome === i.chave)
    return doCat && !tipo.categorias.includes(doCat.categoria)
  })
  checar(`${tipo.nome} so vende o que e dele`, fora.length === 0,
    fora.map((i) => i.nome).join(', '))
  checar(`${tipo.nome} tem estoque`, prat.length > 0)
}

const soArmas = gerarPrateleira(CATALOGO, 'metropole', 1, semeado(9), 'ferreiro')
const soPocoes = gerarPrateleira(CATALOGO, 'metropole', 1, semeado(9), 'botica')
checar('o ferreiro e a botica nao vendem a mesma coisa',
  soArmas.every((a) => !soPocoes.some((b) => b.chave === a.chave)))

// ---------------------------------------------------------------------------
console.log('Os oito itens de raridade que varia')
//
// Sao a Pocao de Cura, o Pergaminho de Magia, a Pedra Ioun, a Estatueta do
// Poder Maravilhoso — os que uma loja mais teria. A primeira versao devolvia a
// loja INTACTA para eles enquanto a tela dizia "entrou na prateleira".

const pocaoDeCura = CATALOGO.find((i) => i.nome === 'Potions of Healing')
checar('a Pocao de Cura existe no catalogo', !!pocaoDeCura)
checar('e o app sabe que a raridade dela varia', raridadeIndefinida(pocaoDeCura) === true)
checar('poe sem raridade devolve NADA, e nao a loja intacta',
  adicionarNaPrateleira(fechada, pocaoDeCura, () => 0.5) === null)
const comPocaoDeCura = adicionarNaPrateleira(fechada, pocaoDeCura, () => 0.5, 'Comum')
checar('com a raridade escolhida, entra', comPocaoDeCura?.prateleira.length === 2)
checar('com a raridade que o DM disse', comPocaoDeCura?.prateleira[1].raridade === 'Comum')
checar('e com preco de consumivel',
  (comPocaoDeCura?.prateleira[1].precoPO ?? 0) < 100,
  String(comPocaoDeCura?.prateleira[1].precoPO))

// Item de raridade normal continua entrando sem perguntar nada.
checar('item com raridade nao pede escolha',
  adicionarNaPrateleira(fechada, manto, () => 0.5) !== null)

// ---------------------------------------------------------------------------
console.log('O DM monta antes de liberar')

// Loja nao liberada nao e loja vazia: prateleira vazia diria "o vendedor nao
// tem nada", que e informacao, e errada.
checar('antes de liberar, o grupo nao ve loja nenhuma', projetarLoja(fechada) === null)
checar('depois de liberar, ve', projetarLoja({ ...fechada, liberada: true })?.nome === 'A Bigorna Torta')
checar('e sem loja nao quebra', projetarLoja(null) === null)
checar('loja nasce fechada', lojaVazia().liberada === false)

const comMais = adicionarNaPrateleira(fechada, manto, () => 0.5)
checar('o DM poe item a mao', comMais.prateleira.length === 2)
checar('com o nome em portugues', comMais.prateleira[1].nome === manto.nomePt)
checar('e a chave em ingles', comMais.prateleira[1].chave === 'Cloak of Protection')
checar('com preco calculado', comMais.prateleira[1].precoPO > 0)
checar('sem mexer na loja de entrada', fechada.prateleira.length === 1)

const semNada = removerDaPrateleira(comMais, comMais.prateleira[1].id)
checar('e tira o que nao quer', semNada.prateleira.length === 1)
checar('tirando o certo', semNada.prateleira[0].id === 'p1')
checar('id que nao existe nao apaga nada',
  removerDaPrateleira(comMais, 'nao-existe').prateleira.length === 2)

// O DM sempre pode dar o preco que quiser: e a mesa dele.
const remarcada = precoManual(fechada, 'p1', 250)
checar('o DM remarca o preco', remarcada.prateleira[0].precoPO === 250)
checar('e nao aceita preco negativo', precoManual(fechada, 'p1', -50).prateleira[0].precoPO === 0)

// ---------------------------------------------------------------------------
console.log('O jogador compra do aparelho dele')
//
// No banco, quem escreve estado da mesa e so o DM. O jogador paga da propria
// bolsa e o item entra na propria mochila — tudo dentro do que ele pode
// escrever. Tirar o item da prateleira e o DM que faz, lendo as fichas.

const lojaLiberada = { ...fechada, liberada: true }
const compradorRico = { ...FICHA, moedas: bolsa({ po: 9000 }) }
const compraDoJogador = comprar(compradorRico, lojaLiberada, 'p1', CATALOGO)
checar('a compra do jogador da certo', compraDoJogador.ok === true, compraDoJogador.motivo)
checar('e fica anotada na ficha dele',
  compraDoJogador.char.comprasNaLoja?.includes('p1') === true,
  JSON.stringify(compraDoJogador.char.comprasNaLoja))

const acertada = comEstoqueDosJogadores(lojaLiberada, [compraDoJogador.char])
checar('a prateleira do DM se acerta sozinha', acertada.prateleira.length === 0)

// O laco: se isto devolver objeto novo quando nada mudou, o DM publica, o
// aparelho do jogador acorda, o DM publica de novo, e nao para mais.
checar('sem compras, devolve a MESMA loja',
  comEstoqueDosJogadores(lojaLiberada, [FICHA]) === lojaLiberada)
checar('compra velha nao mexe em nada',
  comEstoqueDosJogadores(lojaLiberada, [{ comprasNaLoja: ['id-de-outra-sessao'] }]) === lojaLiberada)
checar('ficha sem lista nenhuma nao quebra',
  comEstoqueDosJogadores(lojaLiberada, [{}]) === lojaLiberada)

// A lista nao pode virar historico: a ficha atravessa a rede a cada PV.
let acumulando = { ...FICHA, comprasNaLoja: [] }
for (let i = 0; i < 45; i++) {
  const r = comprar(
    { ...acumulando, moedas: bolsa({ po: 9000 }) }, lojaLiberada, 'p1', CATALOGO)
  if (r.ok) acumulando = { ...acumulando, comprasNaLoja: [...r.char.comprasNaLoja, `x${i}`] }
}
checar('a lista de compras nao cresce sem fim',
  (acumulando.comprasNaLoja?.length ?? 0) <= 31,
  `ficou com ${acumulando.comprasNaLoja?.length}`)

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de loja falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de loja passaram`)
