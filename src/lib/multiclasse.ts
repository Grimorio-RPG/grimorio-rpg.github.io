// Mais de uma classe na mesma ficha.
//
// A regra tem duas palavras que parecem a mesma e não são:
//
// - NÍVEL DE PERSONAGEM: a soma de tudo. É dele que saem o bônus de
//   proficiência, os dados de vida, os testes de morte e a XP.
// - NÍVEL DE CLASSE: quanto se tem em CADA classe. É dele que saem os traços,
//   os recursos, o dado de vida daquele nível e o que a classe deixa conjurar.
//
// Confundir os dois é o erro clássico do multiclasse, e ele erra sempre para
// cima: um Guerreiro 3 / Mago 2 lendo "nível 5" ganha os traços de Guerreiro 5
// E os de Mago 5, além de espaços de magia de um mago de nível 5.
//
// A ficha guarda `nivel` como o nível de PERSONAGEM — assim tudo o que já
// dependia dele continua certo sem uma linha de mudança — e `classesExtras`
// com as outras classes. O nível na classe principal é a diferença.
//
// SRD 5.2.1, "Multiclassing".

import type { AbilityKey, Character, SpellSlot } from '../types'
import { classInfo } from './calc'
import { PROGRESSAO_SRD } from '../data/srd/classes-srd'
import { temEspacos } from '../data/progression'
import type { ProficienciasDeClasse } from './proficiencias'
import { PROFICIENCIAS_SRD } from '../data/srd/proficiencias-srd'

export interface NivelDeClasse {
  classe: string
  nivel: number
}

/** Esta ficha tem mais de uma classe? */
export function ehMulticlasse(char: Character): boolean {
  return (char.classesExtras ?? []).some((c) => c.classe && c.nivel > 0)
}

/**
 * As classes da ficha, com o nível de cada uma. A principal vem primeiro.
 *
 * O nível da principal é o que sobra: `nivel` é o de personagem, e as extras
 * saem dele. Guardar os dois separados deixaria os dois desencontrados no dia
 * em que alguém editasse só um.
 */
export function classes(char: Character): NivelDeClasse[] {
  const extras = (char.classesExtras ?? []).filter((c) => c.classe && c.nivel > 0)
  const gastos = extras.reduce((t, c) => t + c.nivel, 0)
  const principal = char.nivel - gastos
  const lista: NivelDeClasse[] = []
  // Extras somando MAIS do que o personagem tem deixa a principal sem nível
  // nenhum. Ela sai da lista em vez de aparecer com um número impossível — a
  // tela de edição avisa, e aqui nada finge que existe meio guerreiro.
  if (char.classe && principal > 0) lista.push({ classe: char.classe, nivel: principal })
  return [...lista, ...extras]
}

/** Quantos níveis a ficha tem NESTA classe. Zero se não tiver a classe. */
export function nivelNaClasse(char: Character, classe: string): number {
  return classes(char).find((c) => c.classe === classe)?.nivel ?? 0
}

/** O nível na classe principal — o que os traços e recursos dela usam. */
export function nivelPrincipal(char: Character): number {
  return classes(char)[0]?.nivel ?? 0
}

// ---------------------------------------------------------------------------
// Magia
// ---------------------------------------------------------------------------

/**
 * Quanto cada classe conta para os espaços de magia.
 *
 * SRD 5.2.1: "add together your levels in the Bard, Cleric, Druid, Sorcerer,
 * and Wizard classes; add half your levels (round down) in the Paladin and
 * Ranger classes; add a third of your Fighter or Rogue levels (round down) if
 * you have the Eldritch Knight or Arcane Trickster subclass."
 *
 * O Bruxo fica de fora: a Magia de Pacto tem tabela própria e recarrega no
 * descanso curto. Somá-lo aqui daria ao bruxo/mago espaços que nenhuma das duas
 * classes concede.
 */
const FRACAO_DE_CONJURADOR: Record<string, number> = {
  Bardo: 1, Clérigo: 1, Druida: 1, Feiticeiro: 1, Mago: 1,
  Paladino: 2, Patrulheiro: 2,
}

/** O nível de conjurador combinado, para a tabela de espaços do multiclasse. */
export function nivelDeConjurador(char: Character): number {
  let total = 0
  for (const c of classes(char)) {
    const fracao = FRACAO_DE_CONJURADOR[c.classe]
    if (fracao) total += Math.floor(c.nivel / fracao)
  }
  return total
}

/**
 * Os espaços de magia de quem tem mais de uma classe conjuradora.
 *
 * A tabela é a do Mago: um Clérigo 3 / Mago 2 tem os espaços de um conjurador
 * de nível 5, e não os de um clérigo de 3 mais os de um mago de 2 — que dariam
 * espaços a menos e nenhum de 3º círculo.
 */
export function espacosDeMulticlasse(char: Character): SpellSlot[] {
  const nivel = nivelDeConjurador(char)
  if (nivel < 1) return vazios()
  const linha = PROGRESSAO_SRD['Mago']?.[Math.min(20, nivel) - 1]
  const espacos = linha?.[2] ?? []
  return Array.from({ length: 9 }, (_, i) => ({ total: espacos[i] ?? 0, usados: 0 }))
}

const vazios = (): SpellSlot[] => Array.from({ length: 9 }, () => ({ total: 0, usados: 0 }))

/** Quais classes desta ficha conjuram — a lista que a tela de magia precisa. */
export function classesQueConjuram(char: Character): NivelDeClasse[] {
  return classes(char).filter((c) => temEspacos(c.classe))
}

// ---------------------------------------------------------------------------
// Proficiências
// ---------------------------------------------------------------------------

/**
 * O que a classe NOVA dá quando se entra nela por multiclasse.
 *
 * É menos do que ela dá a quem começa nela: nada de salvaguardas, e as armas e
 * armaduras vêm cortadas. SRD 5.2.1, "Multiclassing: Proficiencies".
 *
 * Escrito à mão porque o livro põe isto numa tabela separada, e não no quadro
 * de cada classe — a extração que gerou `proficiencias-srd.ts` lê o quadro.
 */
const AO_ENTRAR: Record<string, Partial<ProficienciasDeClasse>> = {
  Bárbaro: {
    armas: { simples: false, marciais: true, propriedades: [] },
    armaduras: { leve: false, media: false, pesada: false, escudo: true },
  },
  Bardo: {
    armas: { simples: false, marciais: false, propriedades: [] },
    armaduras: { leve: true, media: false, pesada: false, escudo: false },
  },
  Bruxo: {
    armas: { simples: true, marciais: false, propriedades: [] },
    armaduras: { leve: true, media: false, pesada: false, escudo: false },
  },
  Clérigo: {
    armas: { simples: false, marciais: false, propriedades: [] },
    armaduras: { leve: true, media: true, pesada: false, escudo: true },
  },
  Druida: {
    armas: { simples: false, marciais: false, propriedades: [] },
    armaduras: { leve: true, media: false, pesada: false, escudo: true },
  },
  Feiticeiro: {
    armas: { simples: false, marciais: false, propriedades: [] },
    armaduras: { leve: false, media: false, pesada: false, escudo: false },
  },
  Guerreiro: {
    armas: { simples: true, marciais: true, propriedades: [] },
    armaduras: { leve: true, media: true, pesada: false, escudo: true },
  },
  Ladino: {
    armas: { simples: false, marciais: false, propriedades: ['Acuidade', 'Leve'] },
    armaduras: { leve: true, media: false, pesada: false, escudo: false },
  },
  Mago: {
    armas: { simples: false, marciais: false, propriedades: [] },
    armaduras: { leve: false, media: false, pesada: false, escudo: false },
  },
  Monge: {
    armas: { simples: true, marciais: false, propriedades: ['Leve'] },
    armaduras: { leve: false, media: false, pesada: false, escudo: false },
  },
  Paladino: {
    armas: { simples: true, marciais: true, propriedades: [] },
    armaduras: { leve: true, media: true, pesada: false, escudo: true },
  },
  Patrulheiro: {
    armas: { simples: true, marciais: true, propriedades: [] },
    armaduras: { leve: true, media: true, pesada: false, escudo: true },
  },
}

/**
 * O treino somado das classes da ficha.
 *
 * A PRIMEIRA classe dá tudo o que ela dá — é onde o personagem começou. As
 * outras dão só o que a tabela de multiclasse concede. Somar o quadro cheio das
 * duas daria armadura pesada a um paladino de um nível só.
 */
export function proficienciasSomadas(char: Character): ProficienciasDeClasse | null {
  const lista = classes(char)
  if (lista.length === 0) return null

  const primeira = PROFICIENCIAS_SRD[lista[0].classe]
  const total: ProficienciasDeClasse = {
    armas: primeira
      ? { ...primeira.armas, propriedades: [...primeira.armas.propriedades] }
      : { simples: false, marciais: false, propriedades: [] },
    armaduras: primeira
      ? { ...primeira.armaduras }
      : { leve: false, media: false, pesada: false, escudo: false },
    ferramentas: primeira?.ferramentas,
  }

  for (const c of lista.slice(1)) {
    const ganho = AO_ENTRAR[c.classe]
    if (!ganho) continue
    if (ganho.armas) {
      total.armas.simples ||= ganho.armas.simples
      total.armas.marciais ||= ganho.armas.marciais
      for (const p of ganho.armas.propriedades) {
        if (!total.armas.propriedades.includes(p)) total.armas.propriedades.push(p)
      }
    }
    if (ganho.armaduras) {
      total.armaduras.leve ||= ganho.armaduras.leve
      total.armaduras.media ||= ganho.armaduras.media
      total.armaduras.pesada ||= ganho.armaduras.pesada
      total.armaduras.escudo ||= ganho.armaduras.escudo
    }
  }

  // "Marciais com propriedade" só faz sentido enquanto não há marciais inteiras:
  // um monge/guerreiro tem todas, e a restrição do monge deixa de valer.
  if (total.armas.marciais) total.armas.propriedades = []

  return total
}

// ---------------------------------------------------------------------------
// Requisitos e vida
// ---------------------------------------------------------------------------

/**
 * O atributo mínimo para entrar (ou sair) de cada classe.
 *
 * SRD 5.2.1, "Multiclassing: Prerequisites": 13 no atributo principal da classe
 * que se deixa E da que se pega. Sem isso o personagem simplesmente não pode
 * multiclassar — é a única regra do multiclasse que PROÍBE alguma coisa.
 */
export const MINIMO_PARA_MULTICLASSE = 13

const ATRIBUTO_PRINCIPAL: Record<string, AbilityKey[]> = {
  Bárbaro: ['for'], Bardo: ['car'], Bruxo: ['car'], Clérigo: ['sab'], Druida: ['sab'],
  Feiticeiro: ['car'], Guerreiro: ['for', 'des'], Ladino: ['des'], Mago: ['int'],
  Monge: ['des', 'sab'], Paladino: ['for', 'car'], Patrulheiro: ['des', 'sab'],
}

export interface RequisitoFaltando {
  classe: string
  /** Os atributos que a classe pede, e o que a ficha tem. */
  pede: { atributo: AbilityKey; tem: number }[]
  /** O Guerreiro aceita FOR OU DES; o Paladino exige FOR E CAR. */
  bastaUm: boolean
}

/**
 * Quais classes desta ficha estão sem o atributo mínimo.
 *
 * Guerreiro e Monge pedem UM dos dois; Paladino e Patrulheiro pedem OS DOIS. É
 * a diferença entre um multiclasse legal e um que a mesa não permitiria, e ela
 * está numa nota de rodapé que ninguém lê duas vezes.
 */
export function requisitosFaltando(char: Character): RequisitoFaltando[] {
  const lista = classes(char)
  if (lista.length < 2) return []

  const fora: RequisitoFaltando[] = []
  for (const c of lista) {
    const pedidos = ATRIBUTO_PRINCIPAL[c.classe]
    if (!pedidos) continue
    // Guerreiro, Monge, Paladino e Patrulheiro têm dois atributos listados, e o
    // livro separa quem pede um de quem pede os dois.
    const bastaUm = c.classe === 'Guerreiro' || c.classe === 'Monge'
    const valores = pedidos.map((a) => ({ atributo: a, tem: char.atributos[a] }))
    const atende = bastaUm
      ? valores.some((v) => v.tem >= MINIMO_PARA_MULTICLASSE)
      : valores.every((v) => v.tem >= MINIMO_PARA_MULTICLASSE)
    if (!atende) fora.push({ classe: c.classe, pede: valores, bastaUm })
  }
  return fora
}

/** Os dados de vida, um grupo por classe: "3d10 + 2d6". */
export function dadosDeVida(char: Character): string {
  const partes = classes(char)
    .map((c) => {
      const info = classInfo(c.classe)
      return info ? `${c.nivel}d${info.dadoDeVida}` : ''
    })
    .filter(Boolean)
  return partes.join(' + ')
}

/**
 * A faixa de PV possível, somando as classes.
 *
 * O primeiro nível do personagem vem cheio; todo o resto vai de 1 ao dado. Sem
 * separar por classe, um Guerreiro 3 / Mago 2 era conferido contra a faixa de
 * um guerreiro de 5 e aparecia como erro sem estar errado.
 */
export function faixaDePv(char: Character): { minimo: number; maximo: number } | null {
  const lista = classes(char)
  if (lista.length === 0) return null

  const con = Math.floor((char.atributos.con - 10) / 2)
  let minimo = 0
  let maximo = 0
  let primeiro = true
  for (const c of lista) {
    const info = classInfo(c.classe)
    if (!info) return null
    // O nível 1 do PERSONAGEM é o único cheio, e ele é da primeira classe.
    const cheios = primeiro ? 1 : 0
    minimo += cheios * info.dadoDeVida + (c.nivel - cheios) * 1
    maximo += c.nivel * info.dadoDeVida
    primeiro = false
  }
  return { minimo: minimo + char.nivel * con, maximo: maximo + char.nivel * con }
}

/** "Guerreiro 3 / Mago 2" — como a mesa fala. */
export function emPalavras(char: Character): string {
  return classes(char)
    .map((c) => `${c.classe} ${c.nivel}`)
    .join(' / ')
}
