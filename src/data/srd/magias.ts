// O catálogo de magias como o app usa.
//
// Três coisas se juntam aqui, e a ordem importa:
//
// 1. O SRD, gerado do PDF: 339 magias com o texto oficial em inglês, os campos
//    já separados e — o que mais interessa ao combate — se exige concentração.
// 2. Os 69 resumos que já escrevemos: "o que ela faz na prática, sem jargão".
//    Eles VENCEM a tradução, porque não são tradução: são explicação, e para
//    quem está aprendendo valem mais do que a redação oficial.
// 3. A tradução, quando houver.
//
// O que uma magia do app mostra é, nessa ordem: o resumo nosso se existir, o
// texto traduzido se existir, e o oficial em inglês sempre — porque quando a
// mesa discutir o alcance ou a CD, é o original que decide.

import { SPELLS, type Spell } from '../spells'
import type { MagiaSrd } from './magias-srd'

export type { MagiaSrd } from './magias-srd'

/** As escolas, do inglês do SRD para o português da mesa. */
export const ESCOLAS: Record<string, string> = {
  Abjuration: 'Abjuração',
  Conjuration: 'Conjuração',
  Divination: 'Adivinhação',
  Enchantment: 'Encantamento',
  Evocation: 'Evocação',
  Illusion: 'Ilusão',
  Necromancy: 'Necromancia',
  Transmutation: 'Transmutação',
}

/** As classes conjuradoras, do inglês do SRD para o português do app. */
export const CLASSES: Record<string, string> = {
  Bard: 'Bardo',
  Cleric: 'Clérigo',
  Druid: 'Druida',
  Paladin: 'Paladino',
  Ranger: 'Patrulheiro',
  Sorcerer: 'Feiticeiro',
  Warlock: 'Bruxo',
  Wizard: 'Mago',
}

export interface MagiaDoCatalogo extends MagiaSrd {
  /** O nome em português, quando temos. */
  nomePt: string
  escolaPt: string
  classesPt: string[]
  /** A explicação sem jargão, quando existe. É o que a tela mostra primeiro. */
  emMiudos: string
  /** Temos explicação nossa para esta magia? */
  explicada: boolean
}

/**
 * Casa a magia do SRD com o resumo que já escrevemos.
 *
 * A ligação é pelo nome em português dos 69 resumos contra uma tabela de
 * equivalência — o SRD é em inglês e eles não. Um nome que não casa não quebra
 * nada: a magia aparece com o texto oficial, que é melhor do que não aparecer.
 */
const EQUIVALENTES: Record<string, string> = {
  'Acid Splash': 'Respingo Ácido',
  Aid: 'Auxílio',
  Bane: 'Perdição',
  Banishment: 'Banimento',
  Bless: 'Benção',
  Blight: 'Praga',
  'Burning Hands': 'Mãos Flamejantes',
  'Chain Lightning': 'Relâmpago em Cadeia',
  'Charm Person': 'Enfeitiçar Pessoa',
  'Chill Touch': 'Toque Gélido',
  'Circle of Death': 'Círculo da Morte',
  'Comprehend Languages': 'Compreender Idiomas',
  'Cone of Cold': 'Cone de Frio',
  'Conjure Animals': 'Invocar Besta',
  Counterspell: 'Contramágica',
  'Cure Wounds': 'Curar Ferimentos',
  Darkness: 'Escuridão',
  Darkvision: 'Visão no Escuro',
  Daylight: 'Luz do Dia',
  'Detect Magic': 'Detectar Magia',
  'Dimension Door': 'Porta Dimensional',
  Disintegrate: 'Desintegrar',
  'Dispel Magic': 'Dissipar Magia',
  'Dominate Monster': 'Dominar Monstro',
  'Dominate Person': 'Dominar Pessoa',
  Earthquake: 'Terremoto',
  'Eldritch Blast': 'Explosão Mística',
  'Faerie Fire': 'Fogo das Fadas',
  'Finger of Death': 'Dedo da Morte',
  'Fire Bolt': 'Raio de Fogo',
  'Fire Shield': 'Escudo de Fogo',
  'Fire Storm': 'Tempestade de Fogo',
  Fireball: 'Bola de Fogo',
  Fly: 'Voo',
  Grease: 'Graxa',
  Guidance: 'Orientação',
  Heal: 'Curar',
  'Healing Word': 'Palavra de Cura',
  'Hold Person': 'Imobilizar Pessoa',
  'Ice Storm': 'Tempestade de Gelo',
  Invisibility: 'Invisibilidade',
  'Lesser Restoration': 'Restauração Menor',
  Light: 'Luz',
  'Lightning Bolt': 'Relâmpago',
  'Mage Hand': 'Mãos Mágicas',
  'Magic Missile': 'Mísseis Mágicos',
  'Mass Cure Wounds': 'Curar Ferimentos em Massa',
  Message: 'Mensagem',
  'Meteor Swarm': 'Tempestade de Meteoros',
  'Misty Step': 'Passo Nebuloso',
  Polymorph: 'Metamorfose',
  'Power Word Stun': 'Palavra de Poder: Atordoar',
  Prestidigitation: 'Prestidigitação',
  'Protection from Energy': 'Proteção contra Energia',
  'Protection from Evil and Good': 'Proteção contra o Bem e o Mal',
  'Raise Dead': 'Reviver os Mortos',
  Revivify: 'Revivificar',
  'Sacred Flame': 'Chama Sagrada',
  'Scorching Ray': 'Raio Ardente',
  'See Invisibility': 'Ver o Invisível',
  Shatter: 'Despedaçar',
  Shield: 'Escudo',
  Sleep: 'Sono',
  'Spiritual Weapon': 'Arma Espiritual',
  Telekinesis: 'Telecinesia',
  Teleport: 'Teletransporte',
  Thaumaturgy: 'Taumaturgia',
  Thunderwave: 'Onda Trovejante',
  'Time Stop': 'Parar o Tempo',
  'True Resurrection': 'Ressurreição Verdadeira',
  'True Seeing': 'Visão Verdadeira',
  Web: 'Teia',
  Wish: 'Desejo',
}

const PORNOME = new Map<string, Spell>(SPELLS.map((s) => [s.nome, s]))

/** Junta o SRD com o que já escrevemos. */
export function comExplicacao(magias: MagiaSrd[]): MagiaDoCatalogo[] {
  return magias.map((m) => {
    const nomePt = EQUIVALENTES[m.nome] ?? ''
    const nosso = nomePt ? PORNOME.get(nomePt) : undefined
    return {
      ...m,
      nomePt: nomePt || m.nome,
      escolaPt: ESCOLAS[m.escola] ?? m.escola,
      classesPt: m.classes.map((c) => CLASSES[c] ?? c),
      emMiudos: nosso?.emMiudos ?? '',
      explicada: !!nosso?.emMiudos,
    }
  })
}

/**
 * Carrega o catálogo sob demanda.
 *
 * São mais de 300 KB de texto oficial. A aba Feitiços é a única que precisa
 * dele, e mesmo ela só precisa quando alguém abre.
 */
export async function carregarMagias(): Promise<MagiaDoCatalogo[]> {
  const { MAGIAS_SRD } = await import('./magias-srd')
  return comExplicacao(MAGIAS_SRD)
}
