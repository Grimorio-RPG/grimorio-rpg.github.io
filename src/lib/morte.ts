// Cair a zero: o que acontece, e quem decide.
//
// O app já sabia mostrar 0 PV. O que ele não fazia era o resto: ninguém rolava,
// ninguém contava os três sucessos, e o 20 natural que levanta a pessoa com 1
// PV dependia de alguém na mesa lembrar. Era o mesmo buraco da concentração,
// uma casa adiante — o app anunciava e parava.
//
// Aqui mora a regra pura, do SRD 5.2.1 ("Playing the Game", Damage and
// Healing). Ela tem quatro pedaços que a mesa mistura o tempo todo:
//
// - O TESTE é no começo do SEU turno, e não é de atributo nenhum. 10 ou mais
//   passa. Três sucessos estabilizam, três falhas matam, e eles não precisam
//   ser seguidos.
// - O 1 NATURAL vale duas falhas; o 20 NATURAL devolve 1 PV na hora.
// - DANO em quem está a 0 é uma falha direto — duas se for crítico —, e mata
//   na hora se for igual ou maior que o PV máximo.
// - A CONTA ZERA ao recuperar qualquer PV ou ao ficar Estável. Este é o
//   detalhe que mais some: a pessoa é curada, cai de novo três rodadas depois,
//   e a mesa continua contando as falhas antigas.

import type { TestesMorte } from '../types'

/** 10 ou mais passa. Não é teste de atributo: não entra modificador nenhum. */
export const CD_TESTE_DE_MORTE = 10

export function zerado(): TestesMorte {
  return { sucessos: 0, falhas: 0 }
}

export interface Desfecho {
  testes: TestesMorte
  /** Parou de rolar: três sucessos, ou primeiros socorros. */
  estavel: boolean
  /** Três falhas, ou dano massivo. */
  morreu: boolean
  /** Quando o 20 natural devolve a pessoa à luta. */
  pvAtual?: number
  /** A frase do registro — a mesma que a tela mostra. */
  texto: string
}

/**
 * O resultado de um teste de morte.
 *
 * Recebe o d20 CRU, sem soma nenhuma, porque é isso que a regra pede — e
 * porque numa mesa ao vivo quem rola é o jogador, na mão dele, e o que chega
 * ao app é o número dito em voz alta.
 */
export function aoRolar(antes: TestesMorte, d20: number, nome: string): Desfecho {
  // O 20 natural não é "um sucesso muito bom": ele devolve 1 PV, e recuperar
  // PV zera a conta. Tratar como sucesso comum seria deixar a pessoa caída com
  // duas falhas no lugar de em pé.
  if (d20 === 20) {
    return {
      testes: zerado(),
      estavel: false,
      morreu: false,
      pvAtual: 1,
      texto: `${nome} tirou 20 natural e voltou à luta com 1 PV`,
    }
  }

  const testes =
    d20 === 1
      ? { ...antes, falhas: antes.falhas + 2 }
      : d20 >= CD_TESTE_DE_MORTE
        ? { ...antes, sucessos: antes.sucessos + 1 }
        : { ...antes, falhas: antes.falhas + 1 }

  return desfecho(testes, nome, d20 === 1 ? ' (1 natural: duas falhas)' : '')
}

/**
 * Dano em quem já está a 0 PV.
 *
 * Não se rola nada: é falha direto. É a regra que a mesa mais deixa passar,
 * porque o inimigo continua batendo em quem caiu e ninguém marca nada.
 */
export function aoSofrerDanoCaido(
  antes: TestesMorte,
  { dano, pvMax, critico }: { dano: number; pvMax: number; critico?: boolean },
  nome: string,
): Desfecho {
  if (dano >= pvMax && pvMax > 0) {
    return {
      testes: { sucessos: 0, falhas: 3 },
      estavel: false,
      morreu: true,
      texto: `${nome} levou ${dano} de dano caído — mais que o PV máximo, morte na hora`,
    }
  }
  const falhas = antes.falhas + (critico ? 2 : 1)
  return desfecho({ ...antes, falhas }, nome, critico ? ' (crítico: duas falhas)' : ' (dano caído)')
}

function desfecho(testes: TestesMorte, nome: string, sufixo: string): Desfecho {
  if (testes.falhas >= 3) {
    return { testes, estavel: false, morreu: true, texto: `${nome} morreu${sufixo}` }
  }
  if (testes.sucessos >= 3) {
    // Ficar Estável zera a conta. Sem isso, a pessoa estabilizada acorda mais
    // tarde carregando as falhas antigas para o próximo tombo.
    return {
      testes: zerado(),
      estavel: true,
      morreu: false,
      texto: `${nome} estabilizou — para de rolar, mas continua Inconsciente`,
    }
  }
  return {
    testes,
    estavel: false,
    morreu: false,
    texto: `${nome}: ${testes.sucessos} sucesso(s), ${testes.falhas} falha(s)${sufixo}`,
  }
}

/**
 * Dano massivo: morre na descida, sem chegar a rolar.
 *
 * "When damage reduces a character to 0 Hit Points and damage remains, the
 * character dies if the remainder equals or exceeds their Hit Point maximum."
 * O que conta é a SOBRA depois de zerar, e não o golpe inteiro — confundir os
 * dois mata personagem que deveria estar caído.
 */
export function morteInstantanea(pvAntes: number, dano: number, pvMax: number): boolean {
  if (pvMax <= 0) return false
  const sobra = dano - Math.max(0, pvAntes)
  return pvAntes > 0 && dano >= pvAntes && sobra >= pvMax
}

/** Precisa rolar teste de morte agora? */
export function precisaRolar(c: {
  origem?: string
  pvAtual: number
  testesMorte?: TestesMorte
  estavel?: boolean
}): boolean {
  // Monstro morre no instante em que chega a 0 — está no SRD, e é por isso que
  // o painel nunca aparece para o lado de lá do mapa.
  if (c.origem === 'inimigo') return false
  if (c.pvAtual > 0 || c.estavel) return false
  return (c.testesMorte?.falhas ?? 0) < 3
}

/** Voltou a ter PV: a conta zera e a estabilidade deixa de importar. */
export function aoCurar(): { testesMorte: TestesMorte; estavel: boolean } {
  return { testesMorte: zerado(), estavel: false }
}

// ---------------------------------------------------------------------------
// Pontos de vida temporários
//
// O campo existia na ficha, aparecia no cartão do grupo, vinha preenchido da
// importação do D&D Beyond e era zerado no descanso longo. E NENHUM caminho de
// dano o consumia: o guerreiro com 10 de vida temporária levava 7 e perdia 7
// de vida de verdade, com o "+10 temp" intacto ao lado.
//
// SRD 5.2.1: "If you have Temporary Hit Points and take damage, those points
// are lost first, and any leftover damage carries over to your Hit Points."
// ---------------------------------------------------------------------------

export interface EstadoDeVida {
  pvAtual: number
  pvTemporario?: number
}

/**
 * O dano comendo a vida temporária primeiro.
 *
 * O piso do PV NÃO é zero: quem cai abaixo dele precisa do excedente para a
 * regra de dano massivo saber se a pessoa morreu na hora. Quem chama é que
 * decide onde parar.
 */
export function aplicarDano(alvo: EstadoDeVida, dano: number): EstadoDeVida {
  if (dano <= 0) return { pvAtual: alvo.pvAtual, pvTemporario: alvo.pvTemporario }
  const temp = Math.max(0, alvo.pvTemporario ?? 0)
  const comido = Math.min(temp, dano)
  return {
    pvAtual: alvo.pvAtual - (dano - comido),
    pvTemporario: temp - comido,
  }
}

/**
 * A cura NÃO restaura vida temporária.
 *
 * "Temporary Hit Points can't be added to your Hit Points, healing can't
 * restore them." Curar quem tem 10 temporários devolve vida de verdade, e o
 * colchão continua o que era.
 */
export function aplicarCura(alvo: EstadoDeVida & { pvMax: number }, cura: number): EstadoDeVida {
  if (cura <= 0) return { pvAtual: alvo.pvAtual, pvTemporario: alvo.pvTemporario }
  return {
    pvAtual: Math.min(alvo.pvMax, Math.max(0, alvo.pvAtual) + cura),
    pvTemporario: alvo.pvTemporario,
  }
}

/**
 * Vida temporária NÃO se soma: escolhe-se a maior.
 *
 * "Temporary Hit Points can't be added together. If you have Temporary Hit
 * Points and receive more of them, you decide whether to keep the ones you
 * have or to gain the new ones." Somar seria o erro generoso de sempre — não
 * quebra nada e deixa o jogo mais fácil em silêncio.
 */
export function receberTemporarios(atual: number | undefined, novos: number): number {
  return Math.max(Math.max(0, atual ?? 0), Math.max(0, novos))
}
