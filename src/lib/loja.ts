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
import { doCatalogo as equipavelDoCatalogo } from '../data/itens-equipaveis'
import { nomeNoCatalogo } from './reconhecerEquipamento'
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

/**
 * O que a loja É.
 *
 * O porte sozinho não bastava, e a mesa apontou: um vilarejo tem ferreiro,
 * feira e taverna, e os três têm estoques completamente diferentes. Porte diz
 * QUÃO BOM é o que aparece; tipo diz O QUÊ aparece. Sem o tipo, todo vendedor
 * de toda cidade vendia da mesma sacola.
 */
export type TipoDeLoja =
  | 'ferreiro' | 'botica' | 'feira' | 'curiosidades' | 'relicario' | 'arcana'

export interface TipoInfo {
  valor: TipoDeLoja
  nome: string
  descricao: string
  /** Categorias do SRD que ela vende. Lista vazia = vende de tudo. */
  categorias: ItemDoSrd['categoria'][]
}

export const TIPOS: TipoInfo[] = [
  {
    valor: 'ferreiro',
    nome: 'Ferreiro',
    descricao: 'Armas, armaduras e escudos. Nada que brilhe sem motivo.',
    categorias: ['Armor', 'Weapon'],
  },
  {
    valor: 'botica',
    nome: 'Botica',
    descricao: 'Frascos, óleos e o que se bebe antes de descer o buraco.',
    categorias: ['Potion'],
  },
  {
    valor: 'feira',
    nome: 'Feira',
    descricao: 'Um pouco de tudo, espalhado em pano no chão.',
    categorias: [],
  },
  {
    valor: 'curiosidades',
    nome: 'Curiosidades',
    descricao: 'Bugigangas com história. Metade da história é invenção.',
    categorias: ['Wondrous Item', 'Ring'],
  },
  {
    valor: 'relicario',
    nome: 'Relicário',
    descricao: 'Peças de igreja, de tumba e de guerra antiga.',
    categorias: ['Wondrous Item', 'Ring', 'Rod'],
  },
  {
    valor: 'arcana',
    nome: 'Casa arcana',
    descricao: 'Varinhas, cajados e pergaminhos. Não tem placa na porta.',
    categorias: ['Wand', 'Staff', 'Rod', 'Scroll'],
  },
]

export function tipoInfo(tipo: TipoDeLoja): TipoInfo {
  return TIPOS.find((t) => t.valor === tipo) ?? TIPOS[2]
}

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
    // O rótulo mudou porque "Casa arcana" passou a ser um TIPO de loja, e dois
    // campos com o mesmo nome significando coisas diferentes na mesma tela é
    // como se ensina alguém a escolher errado. O valor guardado continua o
    // mesmo: renomear a chave quebraria as lojas já salvas.
    nome: 'Mercado negro',
    descricao: 'Sem placa na porta. Você precisa ser apresentado — e paga por isso.',
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
  /** O que ela é: ferreiro, botica, feira… Decide O QUE aparece. */
  tipo: TipoDeLoja
  /** Multiplicador aplicado sobre o preço de tabela. */
  margem: number
  /** Quanto o vendedor paga, como fração do preço de tabela. */
  fracaoDeVenda: number
  prateleira: ItemNaPrateleira[]
  /**
   * O grupo já pode entrar?
   *
   * Existe porque montar a loja é trabalho do DM e acontece ANTES da cena: ele
   * sorteia o estoque, tira o que não faz sentido para aquela vila, põe a
   * espada que o ferreiro guardou para o grupo. Sem esta trava, o jogador vê a
   * prateleira sendo montada e mexida em tempo real, o que estraga a cena e
   * entrega a mão do DM.
   */
  liberada: boolean
  atualizadoEm: number
}

export function lojaVazia(): Loja {
  return {
    nome: '',
    porte: 'cidade',
    tipo: 'feira',
    vendedor: '',
    margem: 1,
    fracaoDeVenda: FRACAO_DE_VENDA,
    prateleira: [],
    liberada: false,
    atualizadoEm: Date.now(),
  }
}

/**
 * O que o grupo enxerga.
 *
 * Nada até o DM liberar — e "nada" é `null`, não uma loja vazia: uma loja de
 * prateleira vazia diz "o vendedor não tem nada", que é uma informação, e
 * errada. Antes de liberar, para o jogador esta loja não existe.
 */
export function projetarLoja(loja: Loja | null): Loja | null {
  if (!loja || !loja.liberada) return null
  return loja
}

/**
 * Oito itens do SRD não têm raridade fixa.
 *
 * São os que o livro marca como "Rarity Varies" — e não são itens obscuros:
 * são a Poção de Cura, o Pergaminho de Magia, a Pedra Ioun, a Estatueta do
 * Poder Maravilhoso. Justamente os que uma loja mais teria.
 *
 * A primeira versão disto devolvia a loja INTACTA quando o item não tinha
 * raridade, enquanto a tela dizia "entrou na prateleira". O jogador pôs uma
 * Poção de Cura e ela não apareceu — e o app afirmou que tinha aparecido.
 */
export function raridadeIndefinida(item: ItemDoSrd): boolean {
  return item.raridades.length === 0
}

/**
 * Põe um item do catálogo na prateleira, com o preço desta loja.
 *
 * Devolve `null` quando não sabe a raridade e ninguém informou uma. Nulo e não
 * "a loja como estava": quem chama tem de conseguir distinguir "não deu" de
 * "deu e nada mudou", senão volta a mentir na tela.
 */
export function adicionarNaPrateleira(
  loja: Loja,
  item: ItemDoSrd,
  aleatorio: () => number = Math.random,
  raridadeEscolhida?: RaridadeItem,
): Loja | null {
  // A raridade que vale é a mais baixa que o item tem: uma Arma +1/+2/+3
  // colocada à mão entra como a +1, igual ao que o sorteio faz.
  const raridade = raridadeEscolhida ?? item.raridades[0]
  if (!raridade) return null
  const novo: ItemNaPrateleira = {
    id: uid(),
    chave: item.nome,
    nome: item.nomePt,
    raridade,
    precoPO: precoDaPrateleira(
      { chave: item.nome, raridade, consumivel: ehConsumivel(item.categoria) },
      loja.margem,
      aleatorio,
    ),
    qtd: 1,
  }
  return { ...loja, prateleira: [...loja.prateleira, novo], atualizadoEm: Date.now() }
}

export function removerDaPrateleira(loja: Loja, itemId: string): Loja {
  return {
    ...loja,
    prateleira: loja.prateleira.filter((i) => i.id !== itemId),
    atualizadoEm: Date.now(),
  }
}

/** Muda o preço de um item à mão — o DM sempre pode dar o preço que quiser. */
export function precoManual(loja: Loja, itemId: string, precoPO: number): Loja {
  return {
    ...loja,
    prateleira: loja.prateleira.map((i) =>
      i.id === itemId ? { ...i, precoPO: Math.max(0, Math.round(precoPO)) } : i,
    ),
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

// ---------------------------------------------------------------------------
// O preço deixar de ser sempre o mesmo
//
// O SRD dá UM número por raridade: Incomum, 400 PO. Seguir isso à risca produz
// o que a mesa reclamou — oito itens incomuns na prateleira, todos a 400 PO, e
// a loja vira uma tabela em vez de um lugar. O jogador não decide nada: não há
// item caro, não há pechincha, não há motivo para perguntar o preço na cidade
// seguinte.
//
// A variação abaixo é NOSSA, não do livro, e tem duas metades de propósito
// diferentes:
//
// - VALOR DE MERCADO: quanto aquele item vale acima ou abaixo da âncora da
//   raridade. É ESTÁVEL — sai do nome do item, não do sorteio. Um Manto de
//   Proteção é caro em toda cidade, e é isso que deixa o grupo APRENDER preço.
//   Sortear também esta metade daria um item a 300 numa vila e a 900 na vila
//   seguinte sem explicação nenhuma: isso é aleatoriedade, não economia.
// - PECHINCHA: o quanto ESTA loja está pedindo hoje. Essa sim é sorteada, e
//   fica gravada na prateleira — é o que faz valer a pena perguntar em dois
//   lugares antes de comprar.
// ---------------------------------------------------------------------------

/** Espalhamento do valor de mercado: de 70% a 140% da âncora da raridade. */
const VALOR_MIN = 0.7
const VALOR_MAX = 1.4

/** O quanto a loja pode pedir a mais ou a menos: ±20%. */
export const PECHINCHA = 0.2

/**
 * Um número estável de 0 a 1 tirado do texto.
 *
 * É hash, não sorteio: o mesmo nome dá sempre o mesmo número, em qualquer
 * aparelho e em qualquer sessão. É o que faz o preço ser característica do
 * item, e não do dia.
 */
export function semente(texto: string): number {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

/**
 * Quanto este item vale, em relação à âncora da raridade dele.
 *
 * A chave é o nome em INGLÊS porque é o que não muda: traduzir um item depois
 * não pode mexer no preço dele numa campanha em andamento.
 */
export function valorDeMercado(chaveEmIngles: string): number {
  return VALOR_MIN + semente(chaveEmIngles) * (VALOR_MAX - VALOR_MIN)
}

/**
 * O preço que ESTA loja pede por este item, hoje.
 *
 * Ordem: âncora da raridade → metade se for consumível → quanto o item vale →
 * a margem do porte → a pechincha do dia.
 */
export function precoDaPrateleira(
  item: { chave: string; raridade: RaridadeItem; consumivel?: boolean },
  margem: number,
  aleatorio: () => number = Math.random,
): number {
  const ancora = PRECO_POR_RARIDADE[item.raridade]
  const consumivel = item.consumivel ? FRACAO_CONSUMIVEL : 1
  const pechincha = 1 - PECHINCHA + aleatorio() * PECHINCHA * 2
  return arredondarPreco(ancora * consumivel * valorDeMercado(item.chave) * margem * pechincha)
}

/**
 * Arredonda para um número que dá para falar em voz alta.
 *
 * Preço de mesa é redondo: 25, 350, 4.500. Um item a 4.183 PO faz o jogador
 * conferir a conta em vez de decidir se compra. O passo cresce com o preço —
 * de 5 em 5 no que é barato, de 500 em 500 no que custa uma masmorra.
 */
export function arredondarPreco(valor: number): number {
  if (valor <= 0) return 0
  const passo = valor < 100 ? 5 : valor < 1000 ? 25 : valor < 10000 ? 100 : 500
  return Math.max(passo, Math.round(valor / passo) * passo)
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
  tipo: TipoDeLoja = 'feira',
): ItemNaPrateleira[] {
  const info = porteInfo(porte)
  const doTipo = tipoInfo(tipo).categorias
  const cabem = catalogo.filter(
    (i) =>
      i.raridades.length > 0 &&
      i.raridades.some((r) => info.raridades.includes(r)) &&
      // Lista vazia é a feira: ela vende de tudo, e é o único jeito honesto de
      // dizer "sem filtro" sem repetir as nove categorias.
      (doTipo.length === 0 || doTipo.includes(i.categoria)),
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
    if (!raridade) return []
    return [{
      id: uid(),
      chave: item.nome,
      nome: item.nomePt,
      raridade,
      precoPO: precoDaPrateleira(
        { chave: item.nome, raridade, consumivel: ehConsumivel(item.categoria) },
        margem,
        aleatorio,
      ),
      // Poção e munição vêm em quantidade; o resto é peça única.
      qtd: item.categoria === 'Potion' || item.categoria === 'Ammunition' ? 1 + Math.floor(aleatorio() * 3) : 1,
    }]
  })
}

// ---------------------------------------------------------------------------
// Comprar e vender
// ---------------------------------------------------------------------------

/**
 * Quantas compras a ficha lembra.
 *
 * A lista existe para a prateleira se acertar, e não para virar histórico. Ids
 * de uma prateleira sorteada há três sessões não casam com nada — só ocupam
 * espaço numa ficha que atravessa a rede a cada mudança de PV.
 */
const TETO_DE_COMPRAS = 30

/**
 * A prateleira do DM depois do que os jogadores levaram.
 *
 * O jogador compra do aparelho dele: paga da própria bolsa e o item entra na
 * própria mochila — tudo dentro do que o banco deixa ele escrever. O que ele
 * NÃO consegue é tirar o item da prateleira, que é estado do DM. Então a
 * prateleira se acerta lendo as fichas, do mesmo jeito que o combate lê os PV.
 *
 * Devolve a MESMA loja quando nada mudou. Sem isso, cada leitura produziria um
 * objeto novo, o DM publicaria de novo, o aparelho do jogador acordaria, e o
 * laço não pararia mais — é exatamente o erro que a ponte da batalha já custou
 * caro para descobrir.
 */
export function comEstoqueDosJogadores(
  loja: Loja,
  fichas: { comprasNaLoja?: string[] }[],
): Loja {
  const levados = new Set(fichas.flatMap((f) => f.comprasNaLoja ?? []))
  if (levados.size === 0) return loja
  const sobrou = loja.prateleira.filter((i) => !levados.has(i.id))
  if (sobrou.length === loja.prateleira.length) return loja
  return { ...loja, prateleira: sobrou, atualizadoEm: Date.now() }
}

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
      // A compra fica anotada na FICHA porque é ela que o jogador consegue
      // escrever: no banco, quem edita o estado da mesa é só o DM. É por esta
      // lista que a prateleira do DM descobre o que já foi levado.
      comprasNaLoja: [...(char.comprasNaLoja ?? []), naPrateleira.id].slice(-TETO_DE_COMPRAS),
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
/**
 * O item da prateleira virando equipamento de verdade.
 *
 * Os EFEITOS vêm do catálogo de equipáveis, que os tem estruturados — "+1 na
 * Classe de Armadura" como número, e não como frase. Sem isso, o Anel de
 * Proteção comprado por 4.000 PO entrava na mochila inerte: a boneca não somava
 * nada, e a loja não tinha como dizer o que ele mudaria. O texto do SRD estava
 * lá o tempo todo, bonito e sem efeito nenhum.
 *
 * A ponte é pelo nome em INGLÊS, porque é o que os dois catálogos têm em comum
 * e o que não muda quando alguém melhora uma tradução.
 *
 * O que o catálogo de equipáveis não conhece continua entrando sem efeito — e
 * é o certo. Inventar um efeito a partir do texto oficial seria adivinhar, e
 * adivinhar em item mágico erra em silêncio.
 */
export function equipamentoDoSrd(
  naPrateleira: ItemNaPrateleira,
  doCatalogo: ItemDoSrd | undefined,
): Equipamento {
  // A família "+1, +2 ou +3" fica DE FORA da ponte. O SRD junta os três graus
  // numa entrada só, e o catálogo de equipáveis tem o item base — casar os dois
  // daria a um Escudo +2 comprado por 4.000 PO os efeitos de um escudo comum.
  // Errar para menos continua sendo errar, e em silêncio.
  const variavel = /\+\s*1,/.test(naPrateleira.chave)
  const equivalente = variavel ? null : nomeNoCatalogo(naPrateleira.chave)
  const comEfeitos = equivalente ? equipavelDoCatalogo(equivalente, uid()) : null

  return {
    id: uid(),
    ...(comEfeitos ?? {}),
    nome: naPrateleira.nome,
    // O original vai junto: quem comprou "Manto Élfico" vai procurar por "Elven
    // Cloak" no livro, e a mochila é olhada com a loja fechada.
    nomeOriginal: doCatalogo && doCatalogo.nome !== naPrateleira.nome ? doCatalogo.nome : undefined,
    slot: comEfeitos?.slot ?? slotDaCategoria(doCatalogo?.categoria),
    icone: comEfeitos?.icone ?? iconeDaCategoria(doCatalogo?.categoria),
    raridade: naPrateleira.raridade,
    // Quanto custou, para a revenda não inventar outro valor.
    precoPO: naPrateleira.precoPO,
    sintonia: doCatalogo?.sintonia ?? comEfeitos?.sintonia,
    sintonizado: false,
    equipado: false,
    efeitos: comEfeitos?.efeitos ?? [],
    // O texto do SRD vence o do catálogo: é o oficial, e é mais completo.
    descricao: doCatalogo?.textoPt ?? comEfeitos?.descricao,
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
