// Progressão por nível: espaços de magia e marcos de cada classe.
//
// As tabelas vinham escritas à mão daqui. Agora vêm do SRD 5.2.1, extraídas do
// PDF por `scripts/srd/classes.mjs` — e a primeira coisa que a extração fez foi
// apontar um erro nosso: no 2024, Paladino e Patrulheiro conjuram desde o nível
// 1. A tabela à mão ainda seguia o 2014, onde a magia deles só começava no 2, e
// o app tirava dois espaços de todo meio-conjurador de nível 1 sem que nada
// reclamasse.

import type { SpellSlot } from '../types'
import { PROGRESSAO_SRD } from './srd/classes-srd'

const nivelValido = (n: number) => Math.max(1, Math.min(20, n))

/** Espaços de magia esperados para a classe naquele nível. */
export function espacosPorNivel(classe: string, nivel: number): SpellSlot[] {
  const linha = PROGRESSAO_SRD[classe]?.[nivelValido(nivel) - 1]
  const espacos = linha ? linha[2] : []
  return Array.from({ length: 9 }, (_, i) => ({ total: espacos[i] ?? 0, usados: 0 }))
}

/**
 * A classe conjura?
 *
 * Antes bastava estar na tabela do SRD, porque só as conjuradoras estavam lá. A
 * tabela passou a trazer TODAS as classes — é dela que saem as Fúrias, os
 * Pontos de Foco e o Retomar o Fôlego —, e "está na tabela" deixou de
 * significar "lança magia". Sem esta conta o bárbaro ganha uma linha de magia
 * com zero em tudo, e um aviso de "faltam magias" na ficha de quem nunca
 * conjurou nada.
 *
 * Sai dos números, e não de uma lista à mão: no nível 20 toda classe que
 * conjura tem espaço, truque ou magia preparada — quem não tem nenhum dos três
 * não conjura.
 */
export function temEspacos(classe: string): boolean {
  const tabela = PROGRESSAO_SRD[classe]
  if (!tabela?.length) return false
  const topo = tabela[tabela.length - 1]
  return topo[0] > 0 || topo[1] > 0 || topo[2].some((n) => n > 0)
}

/** O maior círculo que a classe alcança naquele nível. 0 = nenhum. */
export function maiorCirculo(classe: string, nivel: number): number {
  if (nivel < 1) return 0
  const espacos = PROGRESSAO_SRD[classe]?.[nivelValido(nivel) - 1]?.[2] ?? []
  let maior = 0
  espacos.forEach((qtd, i) => {
    if (qtd > 0) maior = i + 1
  })
  return maior
}

const NIVEIS_ASI = [4, 8, 12, 16, 19]

/** Marcos importantes ao chegar num nível (para o assistente destacar). */
export function marcosDoNivel(classe: string, nivel: number): string[] {
  const marcos: string[] = []
  if ([5, 9, 13, 17].includes(nivel)) {
    marcos.push('Seu bônus de proficiência aumenta — todos os testes treinados melhoram.')
  }
  if (nivel === 3) {
    marcos.push('Escolha sua subclasse: a especialização que define seu estilo.')
  }
  if (NIVEIS_ASI.includes(nivel)) {
    marcos.push('Aumento de Atributo ou Talento: +2 em um atributo, +1 em dois, ou um talento.')
  }
  if (nivel === 5 && ['Guerreiro', 'Bárbaro', 'Paladino', 'Patrulheiro', 'Monge'].includes(classe)) {
    marcos.push('Ataque Extra: você passa a atacar duas vezes com a ação Atacar.')
  }
  // Abrir um círculo novo é o marco de conjurador, e cada classe o alcança num
  // nível diferente. Perguntar à tabela acerta para todas; a lista de classes
  // que estava aqui só acertava para as completas.
  const circulo = maiorCirculo(classe, nivel)
  if (circulo > maiorCirculo(classe, nivel - 1)) {
    marcos.push(
      circulo === 3
        ? 'Magias de 3º círculo — é quando chegam efeitos como Bola de Fogo e Contramágica.'
        : `Magias de ${circulo}º círculo: espaços de um poder que você ainda não tinha.`,
    )
  }
  if (nivel === 11) {
    marcos.push('Nível 11: os poderes de classe dão um salto grande. Confira o livro da sua classe.')
  }
  if (nivel === 20) {
    marcos.push('Nível 20: a capacidade suprema da sua classe. Parabéns!')
  }
  return marcos
}

/** Dado de vida médio arredondado para cima (regra padrão de subir de nível). */
export function mediaDoDado(faces: number): number {
  return Math.floor(faces / 2) + 1
}

// ---------------------------------------------------------------------------
// Experiência
//
// Tabela padrão do PHB. Existe para a ficha poder mostrar o quanto falta para o
// próximo nível — progresso visível é o que transforma "somei 300 XP" em uma
// barra que anda.
// ---------------------------------------------------------------------------
const XP_POR_NIVEL = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
]

export function xpDoNivel(nivel: number): number {
  return XP_POR_NIVEL[Math.max(1, Math.min(20, nivel)) - 1]
}

export interface ProgressoDeXp {
  /** Quanto já andou dentro do nível atual. */
  atual: number
  /** Quanto o nível inteiro vale. */
  total: number
  pct: number
  faltam: number
  /** O XP já dá para subir de nível? */
  podeSubir: boolean
}

export function progressoDeXp(xp: number, nivel: number): ProgressoDeXp {
  if (nivel >= 20) {
    return { atual: 0, total: 0, pct: 100, faltam: 0, podeSubir: false }
  }
  const base = xpDoNivel(nivel)
  const proximo = xpDoNivel(nivel + 1)
  const total = proximo - base
  const atual = Math.max(0, Math.min(total, xp - base))
  return {
    atual,
    total,
    pct: total > 0 ? (atual / total) * 100 : 0,
    faltam: Math.max(0, proximo - xp),
    podeSubir: xp >= proximo,
  }
}

/**
 * XP que cada Nível de Desafio vale — tabela do PHB.
 *
 * Chave em texto porque ND usa frações ("1/4"), como aparece na ficha do
 * monstro.
 */
const XP_POR_ND: Record<string, number> = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
  '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
  '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
  '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
  '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
  '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000,
  '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
}

export function xpDoNd(nd: string): number {
  return XP_POR_ND[String(nd).trim()] ?? 0
}

// ---------------------------------------------------------------------------
// Dificuldade do encontro — modelo de 2024
//
// O 5e de 2014 somava o XP dos monstros e aplicava um multiplicador conforme a
// quantidade deles. O 2024 abandonou esse multiplicador: agora existe um
// ORÇAMENTO de XP por personagem, por nível, em três faixas; soma-se o XP dos
// monstros sem multiplicar e compara-se com o orçamento do grupo.
//
// Vale para MEDIR a dificuldade antes da luta. A recompensa continua sendo a
// soma crua dividida pelo grupo — confundir os dois é o erro que faz um grupo
// subir de nível rápido demais.
//
// ⚠️ Esta tabela veio do meu conhecimento do DMG 2024, não de conferência com o
// livro. Se um número estiver errado, é aqui que se corrige — uma linha.
// ---------------------------------------------------------------------------

/** Orçamento por personagem: [baixa, moderada, alta] — índice 0 = nível 1. */
const ORCAMENTO_XP: [number, number, number][] = [
  [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500],
  [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100],
  [1300, 2000, 2600], [1600, 2300, 3100], [1900, 2900, 4100], [2200, 3700, 4700],
  [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800], [3800, 6100, 9800],
  [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000],
]

export type Dificuldade = 'trivial' | 'baixa' | 'moderada' | 'alta' | 'mortal'

export interface AvaliacaoDeEncontro {
  /** Soma crua do XP dos inimigos — sem multiplicador, como manda o 2024. */
  xpInimigos: number
  /** Orçamento do grupo em cada faixa. */
  orcamento: { baixa: number; moderada: number; alta: number }
  dificuldade: Dificuldade
}

/**
 * Avalia um encontro contra o orçamento do grupo.
 *
 * `niveis` são os níveis dos personagens que vão lutar — grupo de níveis
 * diferentes soma o orçamento de cada um, e não uma média.
 */
export function avaliarEncontro(xpInimigos: number, niveis: number[]): AvaliacaoDeEncontro {
  const somar = (faixa: 0 | 1 | 2) =>
    niveis.reduce((t, n) => t + ORCAMENTO_XP[Math.max(1, Math.min(20, n)) - 1][faixa], 0)

  const orcamento = { baixa: somar(0), moderada: somar(1), alta: somar(2) }

  let dificuldade: Dificuldade = 'trivial'
  if (xpInimigos > orcamento.alta) dificuldade = 'mortal'
  else if (xpInimigos > orcamento.moderada) dificuldade = 'alta'
  else if (xpInimigos > orcamento.baixa) dificuldade = 'moderada'
  else if (xpInimigos > 0) dificuldade = 'baixa'

  return { xpInimigos, orcamento, dificuldade }
}

export const CORES_DIFICULDADE: Record<Dificuldade, { label: string; cor: string; icone: string }> = {
  trivial: { label: 'Trivial', cor: 'text-parchment-200/50', icone: '·' },
  baixa: { label: 'Baixa', cor: 'text-emerald-400', icone: '🟢' },
  moderada: { label: 'Moderada', cor: 'text-amber-400', icone: '🟡' },
  alta: { label: 'Alta', cor: 'text-orange-400', icone: '🟠' },
  mortal: { label: 'Mortal', cor: 'text-dragon-400', icone: '🔴' },
}
