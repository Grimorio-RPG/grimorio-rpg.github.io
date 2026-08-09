// O que a pessoa sabe empunhar e vestir.
//
// A ficha tinha um campo de texto chamado "Proficiências (armas, armaduras,
// ferramentas)". Ninguém preenchia, e quando preenchia não acontecia nada: o
// app somava o bônus de proficiência em TODA arma que entrasse na mão, e
// deixava o mago vestir armadura de placas sem um pio.
//
// É o defeito de sempre deste app numa forma nova — dado exibido e nunca
// consumido. Só que aqui ele mente para o lado que mais importa: o número do
// ataque. Um bardo empunhando uma espada grande ganhava +3 que não é dele, e
// nada na tela dizia que aquele número estava errado.
//
// A tabela por classe vem do quadro "Core <Classe> Traits" do SRD, extraída do
// PDF por `scripts/srd/proficiencias.mjs`. O que o livro NÃO põe em tabela —
// talentos e o que o DM concedeu — entra por fora e está marcado.

import type { Character } from '../types'
import type { Arma, Armadura } from '../data/equipment'
import { PROFICIENCIAS_SRD } from '../data/srd/proficiencias-srd'
import { armaduraBase, itensAtivos, usaEscudo } from './equipamento'

export interface ProficienciaComArmas {
  simples: boolean
  marciais: boolean
  /**
   * Marciais só com estas propriedades.
   *
   * Monge e Ladino são o motivo de isto existir: eles têm "Martial weapons that
   * have the Light property" e "…the Finesse or Light property". Dizer que são
   * marciais daria a espada grande ao ladino; dizer que são só simples tiraria
   * dele o florete, que é a arma do ladino.
   */
  propriedades: string[]
}

export interface ProficienciaComArmaduras {
  leve: boolean
  media: boolean
  pesada: boolean
  escudo: boolean
}

export interface ProficienciasDeClasse {
  armas: ProficienciaComArmas
  armaduras: ProficienciaComArmaduras
  /** O texto do livro, como veio: são escolhas, não uma lista fechada. */
  ferramentas?: string
}

const NENHUMA: ProficienciasDeClasse = {
  armas: { simples: false, marciais: false, propriedades: [] },
  armaduras: { leve: false, media: false, pesada: false, escudo: false },
}

/** Tudo o que esta ficha é proficiente: a classe, mais o que o campo livre diz. */
export function proficienciasDe(char: Character): ProficienciasDeClasse {
  const base = PROFICIENCIAS_SRD[char.classe] ?? NENHUMA
  const armas = { ...base.armas, propriedades: [...base.armas.propriedades] }
  const armaduras = { ...base.armaduras }

  // O campo livre continua valendo, e é o único caminho para o que o SRD não
  // tabela: multiclasse, suplemento, talento fora do catálogo e o que o DM
  // concedeu. Um app que só conhece o SRD vira um app que discute com a mesa.
  const livre = (char.proficienciasEquipamentos ?? '').toLowerCase()
  if (/\bmarciais?\b|\bmarcial\b/.test(livre)) armas.marciais = true
  if (/\bsimples\b/.test(livre)) armas.simples = true
  if (/armadura pesada|pesadas?\b/.test(livre)) armaduras.pesada = true
  if (/armadura m[ée]dia|m[ée]dias?\b/.test(livre)) armaduras.media = true
  if (/armadura leve|leves?\b/.test(livre)) armaduras.leve = true
  if (/escudos?\b/.test(livre)) armaduras.escudo = true

  return { armas, armaduras, ferramentas: base.ferramentas }
}

/**
 * Esta pessoa é proficiente com esta arma?
 *
 * Marciais com propriedade vêm antes do "marciais" geral: um monge é proficiente
 * com a cimitarra (Leve) e não com a espada grande, e as duas são marciais.
 */
export function proficienteComArma(char: Character, arma: Arma): boolean {
  const { armas } = proficienciasDe(char)
  if (arma.categoria === 'Simples') return armas.simples
  if (armas.marciais) return true
  return armas.propriedades.some((p) => arma.propriedades.includes(p))
}

/** E com esta armadura (ou escudo)? */
export function proficienteComArmadura(char: Character, armadura: Armadura): boolean {
  const { armaduras } = proficienciasDe(char)
  if (armadura.categoria === 'Escudo') return armaduras.escudo
  if (armadura.categoria === 'Leve') return armaduras.leve
  if (armadura.categoria === 'Média') return armaduras.media
  return armaduras.pesada
}

/**
 * O preço de vestir o que não se sabe vestir.
 *
 * SRD 5.2.1, "Armor Training": "If you wear armor... and lack training with it,
 * you have Disadvantage on any D20 Test that involves Strength or Dexterity,
 * and you can't cast spells."
 *
 * É uma das penalidades mais duras do jogo e some sem deixar rastro: o mago de
 * armadura de placas ficava com CA 18 na ficha e nada avisava que ele tinha
 * acabado de perder a magia.
 */
export interface CustoDeArmadura {
  /** As peças vestidas sem treino, pelo nome que está na ficha. */
  pecas: string[]
  /** Desvantagem em qualquer teste de d20 de Força ou Destreza. */
  desvantagem: boolean
  /** E nada de conjurar. */
  semMagia: boolean
}

/** O que a pessoa está vestindo sem saber vestir. Nulo quando está tudo certo. */
export function custoDeArmadura(char: Character): CustoDeArmadura | null {
  const pecas = itensAtivos(char)
    .map((e) => ({ nome: e.nome, armadura: armaduraBase(e) }))
    .filter((v): v is { nome: string; armadura: Armadura } => v.armadura != null)
    .filter((v) => !proficienteComArmadura(char, v.armadura))
    .map((v) => v.nome)

  // O escudo entra por fora porque ele não é um item do catálogo de armaduras:
  // um Escudo +1 é "+3 de CA na mão", igual a uma braçadeira seria, e o app o
  // reconhece pelo nome. Mas o livro não separa escudo de armadura nesta regra
  // — empunhar um sem treino custa a mesma desvantagem e a mesma magia.
  if (usaEscudo(char) && !proficienciasDe(char).armaduras.escudo) pecas.push('Escudo')

  if (pecas.length === 0) return null
  return { pecas, desvantagem: true, semMagia: true }
}

/** Lista legível do que a classe treina, para a ficha mostrar em vez do campo vazio. */
export function emPalavras(p: ProficienciasDeClasse): { armas: string; armaduras: string } {
  const armas: string[] = []
  if (p.armas.simples) armas.push('armas simples')
  if (p.armas.marciais) armas.push('armas marciais')
  else if (p.armas.propriedades.length > 0) {
    armas.push(`armas marciais com ${p.armas.propriedades.join(' ou ').toLowerCase()}`)
  }

  const armaduras: string[] = []
  if (p.armaduras.leve) armaduras.push('leve')
  if (p.armaduras.media) armaduras.push('média')
  if (p.armaduras.pesada) armaduras.push('pesada')

  const partes: string[] = []
  if (armaduras.length > 0) partes.push(`armadura ${armaduras.join(', ')}`)
  if (p.armaduras.escudo) partes.push('escudo')

  return {
    armas: armas.length > 0 ? armas.join(' e ') : 'nenhuma arma',
    armaduras: partes.length > 0 ? partes.join(' e ') : 'nenhuma armadura',
  }
}
