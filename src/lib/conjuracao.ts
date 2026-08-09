// Quantas magias o personagem deveria ter, e quantas ele tem.
//
// O app sabia conjurar e sabia gastar espaço, mas nunca dizia quantas magias a
// pessoa podia carregar. Um mago de nível 4 subia quatro vezes sem ninguém
// perguntar nada, e chegava na mesa com a ficha vazia: truques nenhum, livro
// nenhum, nada preparado. A ficha ficava correta em tudo — CA, perícias,
// salvaguardas — e errada exatamente na coisa que faz um mago ser um mago.
//
// A regra do 2024 tem três números diferentes, e confundi-los é o erro comum:
//
// - TRUQUES: não gastam espaço e não se trocam. São os mesmos todo dia.
// - PREPARADAS: quantas magias de 1º círculo ou mais ficam disponíveis hoje.
//   Quase toda classe escolhe da lista da classe e troca no descanso longo.
// - GRIMÓRIO: só o Mago. Ele guarda muito mais do que consegue preparar, e é
//   dessa diferença que sai a decisão de todo dia — o livro tem dez magias, a
//   cabeça carrega sete.
//
// Os dois primeiros vêm da tabela do SRD. O terceiro é prosa da classe, e está
// citado abaixo.

import type { Character, SpellRef } from '../types'
import { PROGRESSAO_SRD } from '../data/srd/classes-srd'
import { maiorCirculo } from '../data/progression'

/**
 * Quantas magias cabem no grimório do Mago naquele nível.
 *
 * SRD 5.2.1, Wizard, Spellbook: "It starts with six level 1 Wizard spells of
 * your choice… Whenever you gain a Wizard level after 1, add two Wizard spells
 * of your choice to your spellbook."
 *
 * São as que a progressão garante. Copiar um pergaminho achado na masmorra é
 * outra coisa — soma por fora, e por isso o app avisa quando falta, mas nunca
 * quando sobra.
 */
export function tamanhoDoGrimorio(nivel: number): number {
  return 6 + 2 * (Math.max(1, Math.min(20, nivel)) - 1)
}

export interface Quota {
  /** Truques que a classe conhece neste nível. */
  truques: number
  /** Magias de 1º círculo ou mais que podem estar preparadas. */
  preparadas: number
  /** Magias no livro. 0 quando a classe não usa livro. */
  grimorio: number
  /** O maior círculo que o personagem já alcança. */
  maiorCirculo: number
}

/** A classe guarda magias num livro à parte do que prepara? */
export function usaGrimorio(classe: string): boolean {
  return classe === 'Mago'
}

/**
 * A lista de preparadas desta classe só muda ao SUBIR DE NÍVEL?
 *
 * A diferença decide onde o app pergunta. Bardo, Feiticeiro e Bruxo escolhem
 * uma lista que fica: "Whenever you gain a <classe> level, you can replace one
 * spell on your list" — então a pergunta é do assistente de nível. As outras
 * trocam no descanso longo, e a pergunta é da ficha, todo dia de jogo.
 *
 * Confundir os dois é o que faria o app cobrar de um clérigo, na subida de
 * nível, uma escolha que ele refaz de manhã de qualquer jeito.
 */
export function listaFixa(classe: string): boolean {
  return classe === 'Bardo' || classe === 'Feiticeiro' || classe === 'Bruxo'
}

/**
 * O que a classe deveria ter naquele nível — ou nada, se ela não conjura.
 *
 * O teto é preso em 20 e o piso NÃO: nível zero tem de sair daqui como nada, e
 * é o índice fora da tabela que garante isso. Prender o piso em 1 — que é o
 * reflexo — faria "quanto ganha quem ENTRA na classe agora" responder a
 * diferença entre o nível 1 e o nível 1, ou seja, nada, e quem multiclassasse
 * para Mago não receberia truque nenhum.
 */
export function quotaDoNivel(classe: string, nivel: number): Quota | null {
  const linha = PROGRESSAO_SRD[classe]?.[Math.min(20, nivel) - 1]
  if (!linha) return null
  return {
    truques: linha[0],
    preparadas: linha[1],
    grimorio: usaGrimorio(classe) ? tamanhoDoGrimorio(nivel) : 0,
    maiorCirculo: maiorCirculo(classe, nivel),
  }
}

/** O que a ficha tem hoje. */
export interface Contagem {
  truques: number
  preparadas: number
  /** Magias de 1º círculo ou mais anotadas, preparadas ou não. */
  anotadas: number
}

export function contar(magias: SpellRef[]): Contagem {
  const decirculo = magias.filter((m) => m.nivel > 0)
  return {
    truques: magias.filter((m) => m.nivel === 0).length,
    preparadas: decirculo.filter((m) => m.preparada).length,
    anotadas: decirculo.length,
  }
}

export interface Falta {
  quota: Quota
  tem: Contagem
  /** Truques que ainda faltam escolher. */
  truques: number
  /** Magias que ainda faltam no livro (só Mago). */
  grimorio: number
  /** Magias que ainda faltam preparar. */
  preparadas: number
  /** Preparadas ALÉM do limite — a ficha está por cima da regra. */
  excedeu: number
  /** Falta alguma coisa? */
  algo: boolean
}

/**
 * O que falta escolher.
 *
 * Existe porque a ficha do mago da mesa já estava no nível 4 quando isto foi
 * escrito. Consertar só a subida de nível deixaria essa ficha vazia para
 * sempre — quem já subiu não sobe de novo. Aqui a conta é sobre o estado, e
 * não sobre o evento: se falta, aparece, tendo subido de nível hoje ou não.
 */
export function oQueFalta(char: Character): Falta | null {
  const quota = quotaDoNivel(char.classe, char.nivel)
  if (!quota) return null
  const tem = contar(char.magias)

  const preparadas = Math.max(0, quota.preparadas - tem.preparadas)
  const falta: Falta = {
    quota,
    tem,
    truques: Math.max(0, quota.truques - tem.truques),
    // Fora do grimório, o que está anotado É o que está preparado: não há um
    // livro por trás de onde tirar. Cobrar as duas contas separadas ali seria
    // inventar uma regra que a classe não tem.
    grimorio: quota.grimorio ? Math.max(0, quota.grimorio - tem.anotadas) : 0,
    preparadas,
    excedeu: Math.max(0, tem.preparadas - quota.preparadas),
    algo: false,
  }
  falta.algo = falta.truques > 0 || falta.grimorio > 0 || falta.preparadas > 0 || falta.excedeu > 0
  return falta
}

/**
 * O que mudou de um nível para o outro.
 *
 * É o que a subida de nível pergunta. Repara que "preparadas" cresce sem que
 * nada seja aprendido: o Mago já tinha a magia no livro, e só agora consegue
 * carregá-la. Por isso o assistente pede coisas diferentes conforme a classe.
 */
export interface Ganho {
  truques: number
  grimorio: number
  preparadas: number
  /** O nível abriu um círculo novo? 0 = não. */
  circuloNovo: number
  algo: boolean
}

// ---------------------------------------------------------------------------
// Na hora de conjurar
//
// Estas quatro funções decidem o que aparece no ✨ do combate. Moram aqui, e
// não dentro do componente, porque são regra — e regra dentro de JSX é regra
// que nenhum teste alcança.
// ---------------------------------------------------------------------------

/** Quantos espaços sobraram em cada círculo, do 1º ao 9º. */
export function espacosLivres(char: Pick<Character, 'espacosMagia'>): number[] {
  return (char.espacosMagia ?? []).map((s) => Math.max(0, s.total - s.usados))
}

/**
 * Existe espaço livre que sirva para uma magia deste círculo?
 *
 * "Que sirva" inclui os círculos ACIMA: quem não tem mais espaço de 1º pode
 * conjurar Mísseis Mágicos gastando um de 3º. É a regra, e é o que faz a
 * diferença entre "acabou" e "acabou o barato".
 */
export function cabeEm(livres: number[], circulo: number): boolean {
  return livres.some((n, i) => i + 1 >= circulo && n > 0)
}

/**
 * O menor círculo com espaço livre que serve para a magia. 0 = nenhum.
 *
 * O padrão da tela sai daqui. Começar pelo círculo próprio da magia seria o
 * reflexo, e empurraria para gastar o espaço grande à toa — o erro clássico é
 * queimar o de 5º numa magia que sairia igual com o de 1º.
 */
export function menorCirculoLivre(livres: number[], circulo: number): number {
  const i = livres.findIndex((n, idx) => idx + 1 >= circulo && n > 0)
  return i < 0 ? 0 : i + 1
}

/** As magias da ficha, separadas pelo que a regra permite fazer com elas hoje. */
export interface ParaConjurar {
  /** Sempre disponíveis, sem gastar nada. */
  truques: SpellRef[]
  /** Preparadas hoje: são as que saem. */
  preparadas: SpellRef[]
  /** Estão no livro, mas não foram preparadas. Não saem — e precisam aparecer. */
  guardadas: SpellRef[]
}

export function magiasParaConjurar(char: Pick<Character, 'magias'>): ParaConjurar {
  const lista = char.magias ?? []
  return {
    truques: lista.filter((m) => m.nivel === 0),
    preparadas: lista.filter((m) => m.nivel > 0 && m.preparada),
    guardadas: lista.filter((m) => m.nivel > 0 && !m.preparada),
  }
}

export function ganhoDoNivel(classe: string, de: number, para: number): Ganho | null {
  const antes = quotaDoNivel(classe, de)
  const depois = quotaDoNivel(classe, para)
  if (!depois) return null

  // Sem quota antes é quem acabou de virar conjurador: ganha a quota inteira.
  const base = antes ?? { truques: 0, preparadas: 0, grimorio: 0, maiorCirculo: 0 }
  const ganho: Ganho = {
    truques: Math.max(0, depois.truques - base.truques),
    grimorio: Math.max(0, depois.grimorio - base.grimorio),
    preparadas: Math.max(0, depois.preparadas - base.preparadas),
    circuloNovo: depois.maiorCirculo > base.maiorCirculo ? depois.maiorCirculo : 0,
    algo: false,
  }
  ganho.algo = ganho.truques > 0 || ganho.grimorio > 0 || ganho.preparadas > 0
  return ganho
}
