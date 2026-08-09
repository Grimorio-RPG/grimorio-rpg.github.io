// Concentração: quando ela cai, e quem decide.
//
// É o erro de regra mais comum de mesa. O mago segura uma magia, leva uma
// flechada no meio da rodada, ninguém lembra do teste — e a Teia continua de pé
// por mais três turnos porque nenhuma parte do jogo apontou para ela.
//
// O app já tinha as duas pontas separadas: o registro anunciava o teste com a CD
// calculada, e o catálogo do SRD sabe quais das 339 magias exigem concentração.
// Faltava o meio: alguém rolar, e alguma coisa acontecer quando falha.
//
// O que mora aqui é a regra pura — quando testar, contra quanto, e o que
// derruba sem teste nenhum. A tela só pergunta e obedece.

import type { Combatant } from '../types'

/**
 * A CD do teste: 10, ou metade do dano, o que for maior.
 *
 * Ela mora em `calc.ts` desde antes disto e continua lá — quem já a importava
 * não precisa mudar. Reexportada aqui para quem chega pelo assunto e não pela
 * biblioteca.
 */
export { cdDeConcentracao } from './calc'
import { cdDeConcentracao } from './calc'

/**
 * As condições que derrubam a concentração sem teste.
 *
 * Incapacitado é a raiz: quem não pode agir não pode concentrar. As outras
 * quatro dizem "Incapacitado" na própria descrição, e listá-las aqui é mais
 * honesto do que interpretar texto de condição em tempo de execução.
 */
export const CONDICOES_QUE_DERRUBAM = [
  'Incapacitado',
  'Inconsciente',
  'Atordoado',
  'Paralisado',
  'Petrificado',
]

export function condicaoDerruba(condicoes: string[]): string | null {
  return condicoes.find((c) => CONDICOES_QUE_DERRUBAM.includes(c)) ?? null
}

/** O que fazer com a concentração depois de uma mudança no combatente. */
export interface Consequencia {
  /** A concentração caiu sozinha — sem teste, sem escolha. */
  caiu: boolean
  /** Por quê, para o registro e para a tela dizerem a mesma coisa. */
  motivo: string
  /** Precisa de um teste de Constituição, e contra quanto. */
  teste: { cd: number; dano: number } | null
}

const NADA: Consequencia = { caiu: false, motivo: '', teste: null }

/**
 * O que acontece com a concentração quando o combatente muda.
 *
 * Recebe o ANTES e o depois porque a decisão depende da diferença: só dano
 * pede teste, e cair a 0 é outra coisa — a magia acaba, não se testa.
 *
 * A ordem importa. Cair a 0 e sofrer dano acontecem juntos o tempo todo, e
 * pedir um teste para quem já está caído seria pedir à mesa que role um dado
 * cujo resultado não muda nada.
 */
export function aoMudar(antes: Combatant, depois: Partial<Combatant>): Consequencia {
  if (!antes.concentracao) return NADA

  const pvNovo = depois.pvAtual ?? antes.pvAtual
  if (pvNovo <= 0) {
    return { caiu: true, motivo: 'caiu a 0 pontos de vida', teste: null }
  }

  const condicoes = depois.condicoes ?? antes.condicoes
  const condicao = condicaoDerruba(condicoes)
  if (condicao && !condicaoDerruba(antes.condicoes)) {
    return { caiu: true, motivo: `ficou ${condicao}`, teste: null }
  }

  /**
   * O DANO SOFRIDO, que não é o mesmo que o PV perdido.
   *
   * A vida temporária cria a diferença: um mago com 10 temporários que leva 30
   * perde 20 de vida, mas SOFREU 30 — e a salvaguarda é contra metade de 30.
   * Contar só o PV perdido daria CD 10 no lugar de CD 15, e a magia ficaria
   * mais fácil de segurar justamente para quem estava protegido.
   *
   * Colchão que SOBE é bênção recebida, não golpe: só o que encolheu conta.
   */
  const tempAntes = antes.pvTemporario ?? 0
  const tempDepois = depois.pvTemporario ?? tempAntes
  const absorvido = Math.max(0, tempAntes - tempDepois)
  const dano = antes.pvAtual - pvNovo + absorvido
  if (dano > 0) {
    return { caiu: false, motivo: '', teste: { cd: cdDeConcentracao(dano), dano } }
  }

  return NADA
}

/** Passou no teste? */
export function passouNoTeste(rolagem: number, bonusCon: number, cd: number): boolean {
  return rolagem + bonusCon >= cd
}

/**
 * O combatente sem a magia que estava segurando.
 *
 * Uma função em vez de `{ concentracao: '' }` espalhado pela tela: assim há um
 * lugar só para mudar quando a concentração deixar de ser um campo de texto.
 */
export function semConcentracao(): Partial<Combatant> {
  return { concentracao: '' }
}
