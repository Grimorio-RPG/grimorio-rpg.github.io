// Os dados de vida, um pote por tamanho.
//
// Com uma classe só isto é uma conta de subtração e nunca precisou de módulo:
// cinco dados, gastou dois, sobram três. Com duas classes vira outra coisa —
// um Guerreiro 3 / Mago 2 tem TRÊS d10 e DOIS d6, e a ficha guardava só
// "gastou dois", sem dizer de quê. Dava para rolar cinco d10.
//
// O erro é do tipo que não reclama: o número na tela continua batendo (cinco
// dados, cinco gastos) enquanto a cura sai maior do que a regra permite, e
// justamente no descanso, que é quando a mesa está contando recurso.
//
// O pote é por TAMANHO DE DADO, e não por classe: um Guerreiro 3 / Paladino 2
// tem cinco d10, e separar em "três do guerreiro e dois do paladino" seria uma
// distinção que a regra não faz — na hora de rolar, d10 é d10.

import type { Character } from '../types'
import { classInfo } from './calc'
import { classes } from './multiclasse'

export interface PoteDeDados {
  /** O tamanho do dado: 6, 8, 10, 12. */
  faces: number
  /** Quais classes contribuem — só para a tela explicar de onde veio. */
  classes: string[]
  total: number
  gastos: number
}

const chave = (faces: number) => String(faces)

/**
 * Os potes da ficha, do dado maior para o menor.
 *
 * Maior primeiro porque é o que se gasta primeiro numa mesa: quem para uma hora
 * para curar quer o dado que cura mais.
 */
export function potes(char: Character): PoteDeDados[] {
  const porFaces = new Map<number, PoteDeDados>()
  for (const c of classes(char)) {
    const info = classInfo(c.classe)
    if (!info) continue
    const ja = porFaces.get(info.dadoDeVida)
    if (ja) {
      ja.total += c.nivel
      ja.classes.push(c.classe)
    } else {
      porFaces.set(info.dadoDeVida, {
        faces: info.dadoDeVida,
        classes: [c.classe],
        total: c.nivel,
        gastos: 0,
      })
    }
  }

  const lista = [...porFaces.values()].sort((a, b) => b.faces - a.faces)
  const registro = char.dadosDeVidaGastos

  if (registro) {
    for (const p of lista) p.gastos = Math.min(p.total, registro[chave(p.faces)] ?? 0)
    return lista
  }

  // Ficha antiga, ou de uma classe só: existe o total gasto e não a divisão.
  // Com um pote só não há ambiguidade nenhuma; com mais de um, o gasto antigo
  // cai no maior — é onde ele provavelmente estava, e é o palpite que NÃO dá
  // dado de graça a ninguém.
  let restante = char.dadosDeVidaUsados ?? 0
  for (const p of lista) {
    p.gastos = Math.min(p.total, restante)
    restante -= p.gastos
  }
  return lista
}

/** Quantos dados deste tamanho ainda dá para gastar. */
export function disponiveis(char: Character, faces: number): number {
  const p = potes(char).find((x) => x.faces === faces)
  return p ? Math.max(0, p.total - p.gastos) : 0
}

/** Quantos dados sobram no total, de todos os tamanhos. */
export function totalDisponivel(char: Character): number {
  return potes(char).reduce((t, p) => t + Math.max(0, p.total - p.gastos), 0)
}

/** Quantos dados a ficha tem ao todo — o nível de personagem, por definição. */
export function totalDeDados(char: Character): number {
  return potes(char).reduce((t, p) => t + p.total, 0)
}

const registroDe = (lista: PoteDeDados[]): Record<string, number> => {
  const r: Record<string, number> = {}
  for (const p of lista) r[chave(p.faces)] = p.gastos
  return r
}

const somar = (lista: PoteDeDados[]) => lista.reduce((t, p) => t + p.gastos, 0)

/**
 * Gasta dados de um tamanho. Nunca passa do que existe naquele pote.
 *
 * `dadosDeVidaUsados` continua sendo escrito com a soma: é ele que o resto do
 * app lê há tempos, e deixar os dois desencontrados criaria duas verdades sobre
 * a mesma coisa.
 */
export function gastar(char: Character, faces: number, quantos: number): Partial<Character> {
  const lista = potes(char)
  const alvo = lista.find((p) => p.faces === faces)
  if (!alvo || quantos <= 0) return {}
  const podeGastar = Math.min(quantos, alvo.total - alvo.gastos)
  if (podeGastar <= 0) return {}
  alvo.gastos += podeGastar
  return { dadosDeVidaGastos: registroDe(lista), dadosDeVidaUsados: somar(lista) }
}

/** Devolve dados de um tamanho — para desfazer um gasto errado. */
export function devolver(char: Character, faces: number, quantos: number): Partial<Character> {
  const lista = potes(char)
  const alvo = lista.find((p) => p.faces === faces)
  if (!alvo || quantos <= 0 || alvo.gastos === 0) return {}
  alvo.gastos = Math.max(0, alvo.gastos - quantos)
  return { dadosDeVidaGastos: registroDe(lista), dadosDeVidaUsados: somar(lista) }
}

/**
 * O descanso longo devolvendo metade dos dados.
 *
 * A regra dá a METADE do total, e quem escolhe quais é a pessoa. O app devolve
 * do MAIOR para o menor: é o que a mesa faria, e errar para o lado do jogador
 * num número que ele poderia escolher não tira nada de ninguém.
 */
export function aoDescansarLongo(char: Character): {
  patch: Partial<Character>
  devolvidos: number
} {
  const lista = potes(char)
  const recupera = Math.max(1, Math.floor(totalDeDados(char) / 2))
  let restante = recupera
  let devolvidos = 0
  for (const p of lista) {
    if (restante <= 0) break
    const volta = Math.min(p.gastos, restante)
    p.gastos -= volta
    restante -= volta
    devolvidos += volta
  }
  if (devolvidos === 0) return { patch: {}, devolvidos: 0 }
  return {
    patch: { dadosDeVidaGastos: registroDe(lista), dadosDeVidaUsados: somar(lista) },
    devolvidos,
  }
}

/** "3d10 + 2d6" — o que a ficha tem, escrito. */
export function emPalavras(char: Character): string {
  return potes(char)
    .map((p) => `${p.total}d${p.faces}`)
    .join(' + ')
}

/** "2d10 + 2d6" — o que ainda dá para rolar. */
export function sobrandoEmPalavras(char: Character): string {
  const sobrando = potes(char).filter((p) => p.total - p.gastos > 0)
  if (sobrando.length === 0) return 'nenhum'
  return sobrando.map((p) => `${p.total - p.gastos}d${p.faces}`).join(' + ')
}
