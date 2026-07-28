// Subir e descer de nível, de forma reversível.
//
// Descer só é exato se a subida tiver sido registrada. Sem isso, a única
// reversão possível é pela média do dado de vida — que erra sempre que a pessoa
// rolou, e erra em silêncio. Aqui a subida guarda o que deu, e a descida devolve
// exatamente aquilo.
//
// Lógica pura, fora do componente, para poder ser verificada por teste.

import type { Character, GanhoDeNivel } from '../types'

/** Média arredondada para cima de um dado — a regra padrão de PV por nível. */
export function mediaDoDadoDeVida(faces: number): number {
  return Math.floor(faces / 2) + 1
}

export function registrarGanho(
  historico: GanhoDeNivel[] | undefined,
  ganho: GanhoDeNivel,
): GanhoDeNivel[] {
  // Substitui o registro do mesmo nível, se a pessoa subiu, desceu e subiu de
  // novo — senão o histórico acumularia entradas mortas.
  const limpo = (historico ?? []).filter((g) => g.nivel !== ganho.nivel)
  return [...limpo, ganho].sort((a, b) => a.nivel - b.nivel)
}

export interface ReversaoDeNivel {
  /** PV a devolver. */
  pvGanho: number
  /** Veio do histórico (exato) ou da média (estimado)? */
  exata: boolean
  /** Sobra do histórico depois de remover o nível revertido. */
  historico: GanhoDeNivel[]
}

/**
 * O que desfazer ao descer do nível atual.
 *
 * Quando não há registro — fichas criadas antes disto, ou nível digitado à mão —
 * cai na média e avisa que é estimativa, em vez de fingir precisão.
 */
export function reverterNivel(char: Character, facesDoDado: number, modCon: number): ReversaoDeNivel {
  const historico = char.historicoNiveis ?? []
  const registro = historico.find((g) => g.nivel === char.nivel)

  if (registro) {
    return {
      pvGanho: registro.pvGanho,
      exata: true,
      historico: historico.filter((g) => g.nivel !== char.nivel),
    }
  }

  return {
    pvGanho: Math.max(1, mediaDoDadoDeVida(facesDoDado) + modCon),
    exata: false,
    historico,
  }
}
