// A estrada do personagem: os vinte níveis, de uma vez.
//
// Subir de nível era um modal: aparecia, dava o que tinha para dar, e sumia. O
// personagem não tinha ARCO em lugar nenhum — não dava para ver o que já foi
// escolhido, nem o que vem no nível seguinte, nem por que vale a pena chegar ao
// 11. E "vale a pena chegar ao 11" é metade do que segura uma campanha longa.
//
// O que esta biblioteca faz é juntar o que já existe espalhado — traços,
// espaços de magia, marcos, o histórico das subidas — numa linha do primeiro ao
// vigésimo nível. Ela não inventa regra nenhuma: cada número aqui já era
// calculado por outro módulo, e o que faltava era alguém pedir os vinte de uma
// vez em vez de um por turno.

import type { Character } from '../types'
import { maiorCirculo, marcosDoNivel, temEspacos, xpDoNivel } from '../data/progression'
import { proficiencyBonus } from './calc'
import { escolhasPendentes, tracosGanhosNoNivel, type TracoComOrigem } from './features'
import { ganhoDoNivel, listaFixa, quotaDoNivel, usaGrimorio } from './conjuracao'

export interface DegrauDeNivel {
  nivel: number
  /** Já passou por aqui? */
  alcancado: boolean
  /** É o nível de agora? */
  atual: boolean
  /** XP acumulado que este nível exige. */
  xp: number
  /** O bônus de proficiência muda AQUI? */
  novoBonus: number | null
  /** Traços que este nível concede. */
  tracos: TracoComOrigem[]
  /** Marcos em texto que o catálogo de traços ainda não cobre. */
  marcos: string[]
  /** Abre um círculo de magia novo? 0 = não. */
  circuloNovo: number
  /** Truques novos neste nível. */
  truquesNovos: number
  /** Magias novas para aprender (grimório, ou lista de quem tem lista fixa). */
  magiasNovas: number
  /** Quantas passam a caber na cabeça — só informativo para quem prepara. */
  preparadasNovas: number
  /** Quanto de PV este nível deu, quando foi registrado na subida. */
  pvGanho: number | null
  /** O PV veio de dado rolado, e não da média? */
  pvRolado: boolean
  /** Este nível PEDE uma escolha que fica para sempre. */
  temEscolha: boolean
  /**
   * A escolha deste nível ainda está em aberto.
   *
   * Diferente de `temEscolha`, e a diferença é a que a tela precisa: o nível 3
   * SEMPRE pede uma subclasse, mas quem já escolheu a dele não pode continuar
   * lendo "precisa escolher" para sempre. Um aviso que nunca some é um aviso
   * que se aprende a ignorar — e aí o que estiver de verdade pendente some
   * junto.
   *
   * Só vale para nível já alcançado: no futuro nada está pendente ainda.
   */
  escolhaPendente: boolean
}

/**
 * A estrada inteira, do nível 1 ao 20.
 *
 * Sempre os vinte, mesmo para um personagem de nível 3. Cortar no nível atual
 * transformaria a tela num histórico — e o valor dela é justamente o contrário:
 * é ver que no 5 chega o Ataque Extra e no 11 a classe dá um salto.
 */
export function estrada(char: Character): DegrauDeNivel[] {
  const porNivel = new Map((char.historicoNiveis ?? []).map((g) => [g.nivel, g]))
  // O Aumento de Atributo não entra aqui de propósito, e a razão está em
  // `features.ts`: não há como distinguir um atributo subido de um digitado.
  const pendentes = new Set(escolhasPendentes(char).map((e) => `${e.nivel}:${e.nome}`))

  return Array.from({ length: 20 }, (_, i) => {
    const nivel = i + 1
    const tracos = tracosGanhosNoNivel(char, nivel)
    const ganho = ganhoDoNivel(char.classe, nivel - 1, nivel)
    const registro = porNivel.get(nivel)
    const fixa = listaFixa(char.classe)
    const livro = usaGrimorio(char.classe)

    return {
      nivel,
      alcancado: nivel <= char.nivel,
      atual: nivel === char.nivel,
      xp: xpDoNivel(nivel),
      // Só marca onde MUDA. O bônus repetido em vinte linhas seria ruído com
      // aparência de informação.
      novoBonus:
        nivel === 1 || proficiencyBonus(nivel) !== proficiencyBonus(nivel - 1)
          ? proficiencyBonus(nivel)
          : null,
      tracos,
      marcos: marcosDoNivel(char.classe, nivel).filter(
        (m) => !tracos.some((t) => m.includes(t.nome)),
      ),
      circuloNovo: ganho?.circuloNovo ?? 0,
      truquesNovos: ganho?.truques ?? 0,
      // O que se APRENDE de vez: o livro do Mago, ou a lista de quem só troca
      // ao subir. Quem prepara no descanso longo não aprende nada aqui — só
      // passa a caber mais, e isso é a linha de baixo.
      magiasNovas: livro ? (ganho?.grimorio ?? 0) : fixa ? (ganho?.preparadas ?? 0) : 0,
      preparadasNovas: livro || !fixa ? (ganho?.preparadas ?? 0) : 0,
      pvGanho: registro?.pvGanho ?? null,
      pvRolado: !!registro?.rolado,
      temEscolha: tracos.some((t) => t.efeito?.tipo === 'escolha'),
      escolhaPendente:
        nivel <= char.nivel && tracos.some((t) => pendentes.has(`${nivel}:${t.nome}`)),
    }
  })
}

export interface ResumoDaEstrada {
  /** Quantos níveis faltam para o 20. */
  faltam: number
  /** O próximo degrau, ou nada se já chegou ao fim. */
  proximo: DegrauDeNivel | null
  /** O próximo nível que muda alguma coisa grande. */
  proximoMarco: DegrauDeNivel | null
  /** PV somados pelos níveis registrados. */
  pvRegistrado: number
  /** Quantos níveis foram subidos DENTRO do app. */
  niveisRegistrados: number
}

/**
 * O que interessa saber de relance.
 *
 * "Próximo marco" não é o próximo nível: é o próximo que muda o jogo — traço
 * novo, círculo novo, bônus de proficiência. Num nível morto a resposta certa
 * para "o que vem?" é apontar para além dele.
 */
export function resumo(char: Character, degraus = estrada(char)): ResumoDaEstrada {
  const adiante = degraus.filter((d) => d.nivel > char.nivel)
  const registrados = degraus.filter((d) => d.pvGanho != null)
  return {
    faltam: Math.max(0, 20 - char.nivel),
    proximo: adiante[0] ?? null,
    proximoMarco: adiante.find((d) => ehMarco(d)) ?? null,
    pvRegistrado: registrados.reduce((t, d) => t + (d.pvGanho ?? 0), 0),
    niveisRegistrados: registrados.length,
  }
}

/** O nível muda alguma coisa que a mesa sente? */
export function ehMarco(d: DegrauDeNivel): boolean {
  return (
    d.tracos.length > 0 ||
    d.circuloNovo > 0 ||
    d.novoBonus != null ||
    d.marcos.length > 0
  )
}

/** A classe conjura? A estrada esconde as linhas de magia quando não. */
export function mostraMagia(char: Character): boolean {
  return temEspacos(char.classe) || quotaDoNivel(char.classe, char.nivel) != null
}

/** O maior círculo alcançado num nível — para a linha de magia da estrada. */
export function circuloEm(char: Character, nivel: number): number {
  return maiorCirculo(char.classe, nivel)
}
