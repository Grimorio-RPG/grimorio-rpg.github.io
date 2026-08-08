// O catálogo do SRD como o app usa: português na frente, inglês oficial atrás.
//
// Existe para a loja: quando o vendedor tiver estoque, ele já sai daqui, com o
// preço certo por raridade. Enquanto a loja não existe, é este módulo que
// segura o dado — e é pesado (mais de 200 KB de texto oficial), então ninguém
// deve importá-lo direto numa tela. Use `carregarItensSrd()`, que só baixa o
// pedaço quando alguém abre a loja.

import type { RaridadeItem } from '../../types'
import type { ItemSrd } from './itens-srd'
import { TRADUCOES } from './traducoes'

export type { ItemSrd } from './itens-srd'

export interface ItemDoSrd extends ItemSrd {
  /** O nome em português, ou o inglês enquanto não houver tradução. */
  nomePt: string
  /** A descrição em português, ou a inglesa enquanto não houver tradução. */
  textoPt: string
  /** Já foi traduzido? A tela mostra o que falta em vez de fingir. */
  traduzido: boolean
}

/**
 * Junta o gerado com a tradução.
 *
 * Sem tradução o item aparece igual, em inglês — melhor um item legível em
 * inglês do que um buraco no catálogo do vendedor.
 */
export function comTraducao(itens: ItemSrd[]): ItemDoSrd[] {
  return itens.map((item) => {
    const pt = TRADUCOES[item.nome]
    return {
      ...item,
      nomePt: pt?.nome ?? item.nome,
      textoPt: pt?.texto ?? item.texto,
      traduzido: !!pt,
    }
  })
}

/**
 * Carrega o catálogo sob demanda.
 *
 * O texto oficial dos 252 itens passa de 200 KB. Importar isso na entrada do
 * app faria todo mundo baixar o estoque da loja para abrir uma ficha.
 */
export async function carregarItensSrd(): Promise<ItemDoSrd[]> {
  const { ITENS_SRD } = await import('./itens-srd')
  return comTraducao(ITENS_SRD)
}

/**
 * Quanto vale, por raridade.
 *
 * O SRD não dá preço item a item — dá esta tabela, e é o bastante para uma
 * loja. Armadura e arma valem isto MAIS o preço do item base.
 */
export const PRECO_POR_RARIDADE: Record<RaridadeItem, number> = {
  'Comum': 100,
  'Incomum': 400,
  'Raro': 4000,
  'Muito raro': 40000,
  'Lendário': 200000,
}

/**
 * A atribuição que a licença exige.
 *
 * O SRD 5.2.1 é Creative Commons Attribution 4.0: o texto pode ser usado, mas a
 * atribuição tem de aparecer para quem lê. Está exportada daqui para não haver
 * duas versões dela no app.
 */
export const ATRIBUICAO_SRD =
  'Este produto inclui material do System Reference Document 5.2.1 ' +
  '(“SRD 5.2.1”), © Wizards of the Coast LLC, disponível sob a licença ' +
  'Creative Commons Attribution 4.0 International.'

export const LICENCA_SRD_URL = 'https://creativecommons.org/licenses/by/4.0/legalcode'
