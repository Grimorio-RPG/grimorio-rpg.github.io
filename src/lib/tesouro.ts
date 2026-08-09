// O que fica no chão depois da luta.
//
// Antes disto o app não tinha o conceito: o DM distribuía moeda por fora, de
// cabeça, e o momento em que a mesa mais presta atenção — o fim do combate —
// terminava numa linha de XP.
//
// O sorteio é em notação de dado, e não em número fixo, para o terceiro bando
// de goblins não ter exatamente o mesmo bolso do primeiro.

import type { ItemDeTesouro, Moedas, Monster, Tesouro } from '../types'
import { parseNotacao } from './dice'
import { uid } from './character'

/** Os nomes das moedas, do menor para o maior valor. */
export const MOEDAS: { chave: keyof Moedas; sigla: string; nome: string }[] = [
  { chave: 'pc', sigla: 'PC', nome: 'peças de cobre' },
  { chave: 'pp', sigla: 'PP', nome: 'peças de prata' },
  { chave: 'pe', sigla: 'PE', nome: 'peças de electro' },
  { chave: 'po', sigla: 'PO', nome: 'peças de ouro' },
  { chave: 'pl', sigla: 'PL', nome: 'peças de platina' },
]

export const MOEDAS_ZERADAS: Moedas = { pc: 0, pp: 0, pe: 0, po: 0, pl: 0 }

export function tesouroVazio(): Tesouro {
  return { moedas: [], itens: [] }
}

export function novoItemDeTesouro(): ItemDeTesouro {
  return { id: uid(), nome: '', chance: undefined }
}

/** Um tesouro que não dá nada não precisa aparecer em lugar nenhum. */
export function temTesouro(t?: Tesouro): boolean {
  if (!t) return false
  return t.moedas.some((m) => m.dado.trim()) || t.itens.some((i) => i.nome.trim())
}

function rolarDado(notacao: string): number {
  const n = parseNotacao(notacao)
  if (!n) {
    // Aceita também um número solto ("15 po"), que é como muita gente escreve.
    const fixo = Number(notacao.trim())
    return Number.isFinite(fixo) && fixo > 0 ? Math.floor(fixo) : 0
  }
  let total = n.modificador
  for (let i = 0; i < n.qtd; i++) total += Math.floor(Math.random() * n.faces) + 1
  return Math.max(0, total)
}

export interface Saque {
  moedas: Moedas
  itens: string[]
}

export function saqueVazio(): Saque {
  return { moedas: { ...MOEDAS_ZERADAS }, itens: [] }
}

/**
 * Sorteia o tesouro de uma criatura.
 *
 * Cada item com `chance` é testado por conta própria: é isso que faz a espada
 * do capitão goblin ser um achado, e não uma certeza.
 */
export function sortearTesouro(t?: Tesouro): Saque {
  const saque = saqueVazio()
  if (!t) return saque

  for (const m of t.moedas) {
    if (!m.dado.trim()) continue
    // Moeda que não existe é ignorada, e RECLAMA.
    //
    // Sem esta guarda, `saque.moedas[undefined] += ...` criava uma chave lixo
    // com NaN dentro e o dinheiro sumia sem uma palavra — a tela dizia "nenhuma
    // moeda" para um tesouro que tinha 2d6 PO escritos nele. O editor de
    // tesouro usa uma lista fechada e não produz isso; um backup editado à mão
    // ou vindo de uma versão futura, sim.
    if (!(m.moeda in saque.moedas)) {
      console.warn('[grimório] tesouro com moeda desconhecida, ignorada:', m)
      continue
    }
    saque.moedas[m.moeda] += rolarDado(m.dado)
  }
  for (const item of t.itens) {
    if (!item.nome.trim()) continue
    const chance = item.chance ?? 100
    if (chance >= 100 || Math.random() * 100 < chance) saque.itens.push(item.nome.trim())
  }
  return saque
}

/**
 * O saque do encontro inteiro.
 *
 * Cada criatura derrubada rola o próprio tesouro — seis goblins são seis
 * bolsos, não um multiplicado.
 */
export function sortearDoEncontro(derrotados: Monster[]): Saque {
  const total = saqueVazio()
  for (const m of derrotados) {
    const parte = sortearTesouro(m.tesouro)
    for (const { chave } of MOEDAS) total.moedas[chave] += parte.moedas[chave]
    total.itens.push(...parte.itens)
  }
  return total
}

/** "12 PO · 3 PP" — só as moedas que caíram. */
export function descreveMoedas(moedas: Moedas): string {
  return MOEDAS.filter(({ chave }) => moedas[chave] > 0)
    .reverse()
    .map(({ chave, sigla }) => `${moedas[chave]} ${sigla}`)
    .join(' · ')
}

/** O saque deu alguma coisa? */
export function saqueTemAlgo(s: Saque): boolean {
  return s.itens.length > 0 || MOEDAS.some(({ chave }) => s.moedas[chave] > 0)
}

/**
 * Divide as moedas entre os personagens.
 *
 * O resto da divisão fica com o primeiro, em vez de sumir: numa mesa de verdade
 * alguém pega a moeda que sobra, e uma peça de cobre evaporando é o tipo de
 * coisa que faz o jogador desconfiar da conta toda.
 */
export function dividirMoedas(moedas: Moedas, entre: number): { cada: Moedas; sobra: Moedas } {
  const cada = { ...MOEDAS_ZERADAS }
  const sobra = { ...MOEDAS_ZERADAS }
  if (entre <= 0) return { cada, sobra: { ...moedas } }

  for (const { chave } of MOEDAS) {
    cada[chave] = Math.floor(moedas[chave] / entre)
    sobra[chave] = moedas[chave] % entre
  }
  return { cada, sobra }
}
