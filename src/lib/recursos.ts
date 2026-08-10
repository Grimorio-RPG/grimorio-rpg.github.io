// Os usos que a classe dá e a mesa conta de cabeça.
//
// A ficha listava os traços e parava aí. Quantas Fúrias o bárbaro ainda tem,
// se o guerreiro já queimou o Surto de Ação, quantos Pontos de Foco sobraram —
// tudo isso vivia na memória de quem estava jogando. E memória de mesa erra
// sempre para o mesmo lado: a favor de quem está perguntando.
//
// É a mesma família dos espaços de magia e dos dados de vida, que o descanso já
// recarregava. Faltava a terceira coisa que ele deveria recarregar.
//
// De ONDE vêm os números: a maioria é COLUNA da tabela da classe no SRD, e sai
// de `classes-srd.ts`, extraída do PDF. Os poucos que o livro escreve na coluna
// de traços em vez de numa coluna própria — "Action Surge (one use)" — estão
// aqui embaixo, à mão e identificados.

import type { AbilityKey, Character } from '../types'
import { PROGRESSAO_SRD } from '../data/srd/classes-srd'
import { abilityMod } from './calc'
import { classes } from './multiclasse'

export type Recarga = 'curto' | 'longo'

export interface Recurso {
  nome: string
  /** Quantos a classe dá neste nível. */
  total: number
  /** Quantos já foram gastos. */
  usados: number
  /** Qual descanso devolve. */
  recarga: Recarga
}

/**
 * Recursos que o livro NÃO põe em coluna própria.
 *
 * "Action Surge (one use)" e "(two uses)" aparecem escritos na coluna de
 * traços da tabela do Guerreiro, então a extração não os alcança. Estão aqui
 * com o nível em que mudam, e é a única parte desta biblioteca escrita à mão.
 */
const FORA_DA_COLUNA: Record<string, { nome: string; recarga: Recarga; porNivel: [number, number][] }[]> = {
  Guerreiro: [
    { nome: 'Surto de Ação', recarga: 'curto', porNivel: [[2, 1], [17, 2]] },
    { nome: 'Indomável', recarga: 'longo', porNivel: [[9, 1], [13, 2], [17, 3]] },
  ],
  Mago: [
    { nome: 'Recuperação Arcana', recarga: 'longo', porNivel: [[1, 1]] },
  ],
}

/**
 * Recursos cuja quantidade é um modificador de atributo.
 *
 * A tabela do Bardo traz o DADO da inspiração, não quantas ele dá — os usos
 * são o modificador de Carisma. Uma coluna não resolveria: o número muda quando
 * o atributo muda.
 */
const POR_ATRIBUTO: Record<string, { nome: string; atributo: AbilityKey; desde: number; recargaCurtaDesde?: number }[]> = {
  Bardo: [
    // Volta no descanso longo, e no CURTO a partir do 5º — a tabela do livro
    // muda a recarga no meio da progressão, e ignorar isso deixaria o bardo com
    // uma inspiração por dia inteiro a partir do nível em que ele deveria ter
    // uma por luta.
    { nome: 'Inspiração de Bardo', atributo: 'car', desde: 1, recargaCurtaDesde: 5 },
  ],
}

const naFaixa = (porNivel: [number, number][], nivel: number): number => {
  let valor = 0
  for (const [de, qtd] of porNivel) if (nivel >= de) valor = qtd
  return valor
}

/**
 * O que esta ficha tem, e quanto já gastou.
 *
 * Os usos saem do nível NA CLASSE, e não do nível de personagem: um Bárbaro 2 /
 * Guerreiro 3 tem duas Fúrias, e não as três de um bárbaro de nível 5. Contar
 * pelo nível de personagem erra sempre para cima, que é o lado em que ninguém
 * reclama.
 */
export function recursosDoPersonagem(char: Character): Recurso[] {
  const gastos = char.usosDeRecursos ?? {}
  const fora: Recurso[] = []

  for (const c of classes(char)) {
    const nivel = Math.max(1, Math.min(20, c.nivel))

    // 1. As colunas da tabela do SRD.
    const linha = PROGRESSAO_SRD[c.classe]?.[nivel - 1]
    for (const [nome, total] of Object.entries(linha?.[3] ?? {})) {
      if (total > 0) fora.push({ nome, total, usados: gastos[nome] ?? 0, recarga: recargaDe(nome) })
    }

    // 2. Os que o livro escreve na coluna de traços.
    for (const r of FORA_DA_COLUNA[c.classe] ?? []) {
      const total = naFaixa(r.porNivel, nivel)
      if (total > 0) fora.push({ nome: r.nome, total, usados: gastos[r.nome] ?? 0, recarga: r.recarga })
    }

    // 3. Os que valem um modificador de atributo.
    for (const r of POR_ATRIBUTO[c.classe] ?? []) {
      if (nivel < r.desde) continue
      // "Mínimo de uma vez": um bardo de Carisma 10 não fica sem inspiração.
      const total = Math.max(1, abilityMod(char.atributos[r.atributo]))
      fora.push({
        nome: r.nome,
        total,
        usados: gastos[r.nome] ?? 0,
        recarga: r.recargaCurtaDesde != null && nivel >= r.recargaCurtaDesde ? 'curto' : 'longo',
      })
    }
  }

  // Duas classes podem dar o MESMO recurso — Clérigo e Paladino têm Canalizar
  // Divindade. O livro manda somar os usos e recarregar tudo junto, então o
  // nome fica sendo um só e os totais se somam.
  const juntos = new Map<string, Recurso>()
  for (const r of fora) {
    const ja = juntos.get(r.nome)
    if (!ja) juntos.set(r.nome, r)
    else ja.total += r.total
  }
  return [...juntos.values()]
}

/**
 * Qual descanso devolve cada recurso de coluna.
 *
 * Mora aqui porque o PDF não diz: a tabela dá o NÚMERO, e a recarga está na
 * prosa da classe. Errar isto não quebra nada — só deixa o bárbaro com fúria
 * infinita ou o clérigo sem canalizar a tarde inteira.
 */
function recargaDe(nome: string): Recarga {
  const LONGOS = ['Fúria', 'Ponto de Feitiçaria']
  return LONGOS.includes(nome) ? 'longo' : 'curto'
}

/** Gasta um uso. Não passa do total: o app não empresta o que não existe. */
export function gastar(char: Character, nome: string): Partial<Character> {
  const atual = recursosDoPersonagem(char).find((r) => r.nome === nome)
  if (!atual || atual.usados >= atual.total) return {}
  return { usosDeRecursos: { ...(char.usosDeRecursos ?? {}), [nome]: atual.usados + 1 } }
}

/** Devolve um uso — a mesa erra, e desfazer não pode custar um descanso. */
export function devolver(char: Character, nome: string): Partial<Character> {
  const usados = char.usosDeRecursos?.[nome] ?? 0
  if (usados <= 0) return {}
  return { usosDeRecursos: { ...(char.usosDeRecursos ?? {}), [nome]: usados - 1 } }
}

/**
 * O descanso devolvendo o que é dele.
 *
 * O curto devolve só o que recarrega no curto; o longo devolve tudo — inclusive
 * o que já teria voltado no curto, porque um descanso longo contém um curto.
 */
export function aoDescansar(char: Character, tipo: Recarga): Partial<Character> {
  const devolvidos = { ...(char.usosDeRecursos ?? {}) }
  let mudou = false
  for (const r of recursosDoPersonagem(char)) {
    if (tipo === 'curto' && r.recarga !== 'curto') continue
    if ((devolvidos[r.nome] ?? 0) === 0) continue
    devolvidos[r.nome] = 0
    mudou = true
  }
  return mudou ? { usosDeRecursos: devolvidos } : {}
}

/** Quanto sobra de um recurso. */
export function restam(r: Recurso): number {
  return Math.max(0, r.total - r.usados)
}
