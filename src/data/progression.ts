// Progressão por nível: espaços de magia e marcos de cada classe.

import type { SpellSlot } from '../types'

type Linha = number[] // espaços dos níveis 1..9

const VAZIO: Linha = [0, 0, 0, 0, 0, 0, 0, 0, 0]

// Conjuradores completos: Bardo, Clérigo, Druida, Feiticeiro, Mago
const COMPLETO: Linha[] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // 20
]

// Meio conjuradores: Paladino e Patrulheiro
const MEIO: Linha[] = [
  VAZIO, // 1
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 3
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 5
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 7
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 8
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 9
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 10
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 11
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 12
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 13
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 14
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 15
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 16
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 17
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 18
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 19
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 20
]

// Bruxo (Magia de Pacto): poucos espaços, todos do mesmo nível, recarregam
// em descanso curto. [quantidade, nível do espaço]
const PACTO: [number, number][] = [
  [1, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5],
  [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 5],
]

const COMPLETOS = ['Bardo', 'Clérigo', 'Druida', 'Feiticeiro', 'Mago']
const MEIOS = ['Paladino', 'Patrulheiro']

/** Espaços de magia esperados para a classe naquele nível. */
export function espacosPorNivel(classe: string, nivel: number): SpellSlot[] {
  const n = Math.max(1, Math.min(20, nivel))
  const vazio = (): SpellSlot[] => Array.from({ length: 9 }, () => ({ total: 0, usados: 0 }))

  if (classe === 'Bruxo') {
    const [qtd, nv] = PACTO[n - 1]
    const out = vazio()
    out[nv - 1] = { total: qtd, usados: 0 }
    return out
  }
  const tabela = COMPLETOS.includes(classe) ? COMPLETO : MEIOS.includes(classe) ? MEIO : null
  if (!tabela) return vazio()
  return tabela[n - 1].map((total) => ({ total, usados: 0 }))
}

/** A classe conjura magias com espaços? */
export function temEspacos(classe: string): boolean {
  return classe === 'Bruxo' || COMPLETOS.includes(classe) || MEIOS.includes(classe)
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
  if (nivel === 5 && temEspacos(classe) && classe !== 'Bruxo' && MEIOS.includes(classe) === false) {
    marcos.push('Magias de 3º nível — é quando chegam efeitos como Bola de Fogo e Contramágica.')
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
