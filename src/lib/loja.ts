// A loja: estoque do vendedor, preço e a conta do dinheiro.
//
// O catálogo do SRD estava pronto e não chegava a tela nenhuma. É aqui que ele
// vira jogo: o ferreiro do vilarejo tem o que um ferreiro de vilarejo teria, o
// preço sai da raridade, e comprar mexe nas moedas da ficha de verdade.
//
// O item comprado cai na mochila de EQUIPAMENTO, não na de texto. A mochila de
// texto foi o buraco que fez a espada da ficha importada ficar presa lá dentro
// sem caminho até a boneca — não vale a pena cavar o mesmo buraco de novo.

import type { Character, Equipamento, Moedas, RaridadeItem } from '../types'
import type { ItemDoSrd } from '../data/srd'
import { PRECO_POR_RARIDADE } from '../data/srd'
import { uid } from './character'
import { CHAVES, readJson, writeJson } from './store'

// ---------------------------------------------------------------------------
// Dinheiro
//
// Tudo em cobre por dentro. Contar em ouro com fração de centavo é como se
// perde uma moeda por arredondamento a cada compra, e ninguém repara até a
// bolsa não fechar.
// ---------------------------------------------------------------------------

/** Quanto vale cada moeda, em peças de cobre. */
export const EM_COBRE: Record<keyof Moedas, number> = {
  pc: 1,
  pp: 10,
  pe: 50,
  po: 100,
  pl: 1000,
}

/** O valor total da bolsa, em peças de cobre. */
export function emCobre(moedas: Moedas): number {
  return (Object.keys(EM_COBRE) as (keyof Moedas)[]).reduce(
    (total, chave) => total + (moedas[chave] || 0) * EM_COBRE[chave],
    0,
  )
}

/** O valor total da bolsa, em peças de ouro (com centavos). */
export function emOuro(moedas: Moedas): number {
  return emCobre(moedas) / 100
}

/**
 * Distribui um valor em cobre pelas moedas.
 *
 * Sem electro de propósito: ele existe no livro, quase nenhuma mesa usa, e
 * ninguém dá troco em electro. Quem tinha electro na bolsa gasta ele na compra
 * e recebe troco em moeda padrão — que é o que um vendedor faria.
 */
export function distribuir(cobre: number): Moedas {
  let resto = Math.max(0, Math.round(cobre))
  const pl = Math.floor(resto / 1000)
  resto -= pl * 1000
  const po = Math.floor(resto / 100)
  resto -= po * 100
  const pp = Math.floor(resto / 10)
  resto -= pp * 10
  return { pc: resto, pp, pe: 0, po, pl }
}

/** Dá para pagar este preço? */
export function podePagar(moedas: Moedas, precoEmPO: number): boolean {
  return emCobre(moedas) >= Math.round(precoEmPO * 100)
}

/**
 * A bolsa depois de pagar. Devolve `null` quando não dá — quem chama tem de
 * decidir o que dizer, e devolver a bolsa intacta esconderia a falha.
 */
export function pagar(moedas: Moedas, precoEmPO: number): Moedas | null {
  const custo = Math.round(precoEmPO * 100)
  const tem = emCobre(moedas)
  if (tem < custo) return null
  return distribuir(tem - custo)
}

/** A bolsa depois de receber. */
export function receber(moedas: Moedas, valorEmPO: number): Moedas {
  return distribuir(emCobre(moedas) + Math.round(valorEmPO * 100))
}

/**
 * Quanto o vendedor paga por um item usado.
 *
 * Metade do preço é a convenção da mesa desde sempre. O livro não fixa número
 * para item mágico — diz que vender é difícil e demorado —, então metade é uma
 * escolha nossa, e o DM pode mudar na loja.
 */
export const FRACAO_DE_VENDA = 0.5

// ---------------------------------------------------------------------------
// A loja
// ---------------------------------------------------------------------------

/**
 * O porte da loja decide o que ela tem.
 *
 * Existe para o ferreiro do vilarejo não vender Espada Vorpal. Sem isso, um
 * estoque sorteado do catálogo inteiro entrega item lendário na primeira aldeia
 * e transforma dinheiro em vitória.
 */
export type PorteDeLoja = 'vilarejo' | 'cidade' | 'metropole' | 'arcana'

export interface Porte {
  valor: PorteDeLoja
  nome: string
  descricao: string
  /** O que ela chega a ter. */
  raridades: RaridadeItem[]
  /** Quantos itens ficam na prateleira. */
  itens: number
  /** Multiplicador do preço: cidade pequena cobra mais caro por raridade. */
  margem: number
}

export const PORTES: Porte[] = [
  {
    valor: 'vilarejo',
    nome: 'Vilarejo',
    descricao: 'Um ferreiro e um boticário. Nada que valha uma viagem.',
    raridades: ['Comum'],
    itens: 4,
    margem: 1.2,
  },
  {
    valor: 'cidade',
    nome: 'Cidade',
    descricao: 'Mercado de verdade. Aparece coisa incomum de vez em quando.',
    raridades: ['Comum', 'Incomum'],
    itens: 8,
    margem: 1,
  },
  {
    valor: 'metropole',
    nome: 'Metrópole',
    descricao: 'Guildas, leilões e gente que sabe o que tem nas mãos.',
    raridades: ['Comum', 'Incomum', 'Raro'],
    itens: 12,
    margem: 1,
  },
  {
    valor: 'arcana',
    nome: 'Casa arcana',
    descricao: 'Não tem placa na porta. Você precisa ser apresentado.',
    raridades: ['Incomum', 'Raro', 'Muito raro', 'Lendário'],
    itens: 8,
    margem: 1.5,
  },
]

export function porteInfo(porte: PorteDeLoja): Porte {
  return PORTES.find((p) => p.valor === porte) ?? PORTES[1]
}

export interface ItemNaPrateleira {
  id: string
  /** O nome em inglês, que é a chave do catálogo. */
  chave: string
  nome: string
  raridade: RaridadeItem
  precoPO: number
  qtd: number
}

export interface Loja {
  nome: string
  porte: PorteDeLoja
  vendedor: string
  /** Multiplicador aplicado sobre o preço de tabela. */
  margem: number
  /** Quanto o vendedor paga, como fração do preço de tabela. */
  fracaoDeVenda: number
  prateleira: ItemNaPrateleira[]
  atualizadoEm: number
}

export function lojaVazia(): Loja {
  return {
    nome: '',
    porte: 'cidade',
    vendedor: '',
    margem: 1,
    fracaoDeVenda: FRACAO_DE_VENDA,
    prateleira: [],
    atualizadoEm: Date.now(),
  }
}

/**
 * O que se gasta e acaba vale menos que o que fica.
 *
 * O SRD dá preço só por raridade, e seguir isso ao pé da letra põe uma Poção da
 * Forma Gasosa a 4.000 PO — o mesmo que uma espada mágica que dura a campanha
 * inteira. Nenhuma mesa aceitaria. A metade é escolha nossa, não do livro.
 */
export const FRACAO_CONSUMIVEL = 0.5

const CONSUMIVEIS: ItemDoSrd['categoria'][] = ['Potion', 'Scroll', 'Ammunition']

export function ehConsumivel(categoria?: ItemDoSrd['categoria']): boolean {
  return !!categoria && CONSUMIVEIS.includes(categoria)
}

/** O preço de tabela de um item do SRD, já com a margem da loja. */
export function precoNaLoja(item: ItemDoSrd, margem: number): number | null {
  const base = item.precoPO ?? (item.raridades[0] ? PRECO_POR_RARIDADE[item.raridades[0]] : null)
  if (base == null) return null
  const desconto = ehConsumivel(item.categoria) ? FRACAO_CONSUMIVEL : 1
  return Math.round(base * margem * desconto)
}

/**
 * Monta a prateleira a partir do catálogo do SRD.
 *
 * O sorteio é embaralhamento e não escolha aleatória repetida: sortear com
 * repetição encheria a loja de três Poções de Cura e nenhuma armadura, e o
 * jogador olharia a mesma prateleira duas vezes.
 */
export function gerarPrateleira(
  catalogo: ItemDoSrd[],
  porte: PorteDeLoja,
  margem: number,
  aleatorio: () => number = Math.random,
): ItemNaPrateleira[] {
  const info = porteInfo(porte)
  const cabem = catalogo.filter(
    (i) => i.raridades.length > 0 && i.raridades.some((r) => info.raridades.includes(r)),
  )

  // Fisher-Yates: embaralha e pega os primeiros.
  const baralho = [...cabem]
  for (let i = baralho.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[baralho[i], baralho[j]] = [baralho[j], baralho[i]]
  }

  return baralho.slice(0, info.itens).flatMap((item) => {
    // A raridade que vale é a mais baixa que a loja alcança: uma Arma +1/+2/+3
    // numa cidade é a +1, não a +3.
    const raridade =
      info.raridades.find((r) => item.raridades.includes(r)) ?? item.raridades[0]
    const preco = precoNaLoja({ ...item, precoPO: PRECO_POR_RARIDADE[raridade] }, margem)
    if (preco == null) return []
    return [{
      id: uid(),
      chave: item.nome,
      nome: item.nomePt,
      raridade,
      precoPO: preco,
      // Poção e munição vêm em quantidade; o resto é peça única.
      qtd: item.categoria === 'Potion' || item.categoria === 'Ammunition' ? 1 + Math.floor(aleatorio() * 3) : 1,
    }]
  })
}

// ---------------------------------------------------------------------------
// Comprar e vender
// ---------------------------------------------------------------------------

export interface ResultadoDaCompra {
  ok: boolean
  /** O que dizer quando não deu. */
  motivo?: string
  char: Character
  loja: Loja
}

/**
 * Compra um item da prateleira.
 *
 * Devolve a ficha e a loja NOVAS, sem mexer nas antigas: metade dos erros de
 * loja em app é a moeda saindo e o item não entrando, ou o contrário, porque
 * alguém alterou um dos dois no meio do caminho.
 */
export function comprar(
  char: Character,
  loja: Loja,
  itemId: string,
  catalogo: ItemDoSrd[],
): ResultadoDaCompra {
  const naPrateleira = loja.prateleira.find((i) => i.id === itemId)
  if (!naPrateleira) return { ok: false, motivo: 'Esse item não está mais à venda.', char, loja }

  const bolsa = pagar(char.moedas, naPrateleira.precoPO)
  if (!bolsa) {
    return { ok: false, motivo: 'Dinheiro insuficiente.', char, loja }
  }

  const doCatalogo = catalogo.find((i) => i.nome === naPrateleira.chave)
  const novo = equipamentoDoSrd(naPrateleira, doCatalogo)

  return {
    ok: true,
    char: {
      ...char,
      moedas: bolsa,
      equipamentos: [...(char.equipamentos ?? []), novo],
      updatedAt: Date.now(),
    },
    loja: {
      ...loja,
      prateleira:
        naPrateleira.qtd > 1
          ? loja.prateleira.map((i) => (i.id === itemId ? { ...i, qtd: i.qtd - 1 } : i))
          : loja.prateleira.filter((i) => i.id !== itemId),
      atualizadoEm: Date.now(),
    },
  }
}

/**
 * Vende um equipamento da ficha.
 *
 * O item some da mochila e o dinheiro entra. Não volta para a prateleira: o
 * vendedor comprou para revender depois, e devolver ao estoque na hora abriria
 * o laço de vender e recomprar de graça.
 */
export function vender(char: Character, loja: Loja, equipamentoId: string): ResultadoDaCompra {
  const item = (char.equipamentos ?? []).find((e) => e.id === equipamentoId)
  if (!item) return { ok: false, motivo: 'Item não encontrado.', char, loja }
  if (item.equipado) {
    return { ok: false, motivo: 'Tire o item antes de vender.', char, loja }
  }

  const valor = Math.round(valorDeVenda(item, loja))
  return {
    ok: true,
    char: {
      ...char,
      moedas: receber(char.moedas, valor),
      equipamentos: (char.equipamentos ?? []).filter((e) => e.id !== equipamentoId),
      updatedAt: Date.now(),
    },
    loja,
  }
}


/**
 * Quanto a loja paga por este equipamento.
 *
 * O preço guardado no item vence a tabela de raridade: uma poção Rara e uma
 * espada Rara têm a mesma raridade e não valem a mesma coisa, e sem isto uma
 * poção comprada por 2.000 seria revendida por 2.000. Itens que nunca passaram
 * por uma loja — os criados à mão, os importados — caem na tabela, que é o
 * melhor palpite que existe para eles.
 */
export function valorDeVenda(item: Equipamento, loja: Loja): number {
  const base =
    item.precoPO ??
    (item.raridade ? PRECO_POR_RARIDADE[item.raridade] : PRECO_POR_RARIDADE.Comum)
  const porPeca = base * loja.fracaoDeVenda
  return porPeca * Math.max(1, item.qtd ?? 1)
}

/**
 * O item da prateleira virando equipamento de verdade.
 *
 * Sem efeitos traçados quando o catálogo do SRD não os tem: o texto do item
 * está lá, em português, e inventar um bônus a partir dele daria um número
 * errado com cara de certo. Quem quiser somar edita o item — o editor existe.
 */
function equipamentoDoSrd(
  naPrateleira: ItemNaPrateleira,
  doCatalogo: ItemDoSrd | undefined,
): Equipamento {
  return {
    id: uid(),
    nome: naPrateleira.nome,
    // O original vai junto: quem comprou "Manto Élfico" vai procurar por "Elven
    // Cloak" no livro, e a mochila é olhada com a loja fechada.
    nomeOriginal: doCatalogo && doCatalogo.nome !== naPrateleira.nome ? doCatalogo.nome : undefined,
    slot: slotDaCategoria(doCatalogo?.categoria),
    icone: iconeDaCategoria(doCatalogo?.categoria),
    raridade: naPrateleira.raridade,
    // Quanto custou, para a revenda não inventar outro valor.
    precoPO: naPrateleira.precoPO,
    sintonia: doCatalogo?.sintonia,
    sintonizado: false,
    equipado: false,
    efeitos: [],
    descricao: doCatalogo?.textoPt,
  }
}

function slotDaCategoria(categoria?: ItemDoSrd['categoria']): Equipamento['slot'] {
  switch (categoria) {
    case 'Armor':
      return 'corpo'
    case 'Weapon':
    case 'Ammunition':
    case 'Staff':
    case 'Rod':
    case 'Wand':
      return 'maoPrincipal'
    case 'Ring':
      return 'anel1'
    default:
      return 'pescoco'
  }
}

function iconeDaCategoria(categoria?: ItemDoSrd['categoria']): string {
  switch (categoria) {
    case 'Armor':
      return '🛡️'
    case 'Weapon':
      return '⚔️'
    case 'Ammunition':
      return '🏹'
    case 'Potion':
      return '🧪'
    case 'Ring':
      return '💍'
    case 'Rod':
    case 'Staff':
      return '🪄'
    case 'Wand':
      return '✨'
    case 'Scroll':
      return '📜'
    default:
      return '💠'
  }
}

// ---------------------------------------------------------------------------
// Onde a loja fica guardada
// ---------------------------------------------------------------------------

export function loadLoja(): Loja {
  const bruto = readJson<Partial<Loja>>(CHAVES.loja, {})
  return { ...lojaVazia(), ...bruto }
}

export function saveLoja(loja: Loja): void {
  writeJson(CHAVES.loja, loja)
}
