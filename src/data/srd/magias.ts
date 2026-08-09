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
import { NOMES_PT } from './nomes-magias'
import { EM_MIUDOS } from './em-miudos'
import { perfilDe, type PerfilDeMagia } from '../../lib/magia-perfil'

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
  /**
   * O que ela faz, lido do texto oficial: dano ou suporte, quanto, contra qual
   * salvaguarda, se pega o grupo. É o que separa uma linha da outra na hora de
   * escolher — sem isso a lista é uma parede de nomes.
   */
  perfil: PerfilDeMagia
}

/**
 * Casa a magia do SRD com o resumo que já escrevemos.
 *
 * A ligação é pelo nome em português: o SRD é em inglês e os resumos não. A
 * tabela de nomes mora em `nomes-magias.ts` e cobre as 339. Um nome que não
 * casa com resumo nenhum não quebra nada — a magia aparece com o texto
 * oficial, que é melhor do que não aparecer.
 */

const PORNOME = new Map<string, Spell>(SPELLS.map((s) => [s.nome, s]))

/** Junta o SRD com o que já escrevemos. */
export function comExplicacao(magias: MagiaSrd[]): MagiaDoCatalogo[] {
  return magias.map((m) => {
    const nomePt = NOMES_PT[m.nome] ?? ''
    const nosso = nomePt ? PORNOME.get(nomePt) : undefined
    return {
      ...m,
      nomePt: nomePt || m.nome,
      escolaPt: ESCOLAS[m.escola] ?? m.escola,
      classesPt: m.classes.map((c) => CLASSES[c] ?? c),
      // As 68 escritas antes do SRD ganham do arquivo novo: elas já estavam na
      // mesa e o jogador já as leu. Trocar por outra redação seria mexer no que
      // funciona só porque agora existe um lugar mais organizado.
      emMiudos: nosso?.emMiudos || EM_MIUDOS[m.nome] || '',
      explicada: !!(nosso?.emMiudos || EM_MIUDOS[m.nome]),
      perfil: perfilDe(m),
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
