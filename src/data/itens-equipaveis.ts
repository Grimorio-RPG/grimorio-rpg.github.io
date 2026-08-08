// Itens prontos, com o que fazem já traçado em números.
//
// O catálogo antigo (`ITENS_MAGICOS`) descreve os itens em frases: "Anel de
// Proteção: +1 na CA e em todas as salvaguardas". Ele continua existindo como
// referência de leitura. Aqui é outra coisa — o mesmo item escrito de um jeito
// que a ficha soma sozinha.
//
// Não é o catálogo inteiro do livro, e não deve ser: é o conjunto que aparece
// numa mesa de verdade nos primeiros dez níveis, mais as armaduras e armas
// comuns. O resto a pessoa cria, e criar é rápido.

import type { Equipamento, RaridadeItem, SlotEquipamento, EfeitoDeItem } from '../types'
import { ARMADURAS, ARMAS } from './equipment'

export interface ItemDeCatalogo {
  nome: string
  slot: SlotEquipamento
  icone: string
  raridade?: RaridadeItem
  sintonia?: boolean
  efeitos: EfeitoDeItem[]
  descricao?: string
  peso?: number
  /** A arma do catálogo comum em que se baseia — o que faz virar ataque. */
  arma?: string
  /** A armadura do catálogo comum em que se baseia. */
  armadura?: string
}

/** Armaduras do catálogo comum, já como equipamento de corpo. */
const DE_ARMADURA: ItemDeCatalogo[] = ARMADURAS.map((a) => ({
  nome: a.nome,
  slot: 'corpo' as const,
  armadura: a.nome,
  icone: a.categoria === 'Pesada' ? '🛡️' : a.categoria === 'Média' ? '🥋' : '🎽',
  peso: a.peso,
  efeitos: [{ tipo: 'caBase', valor: a.ca, maxDes: a.maxDes }],
  descricao: `Armadura ${a.categoria.toLowerCase()}.`,
}))

/** Armas do catálogo comum, na mão principal. */
const DE_ARMA: ItemDeCatalogo[] = ARMAS.map((a) => ({
  nome: a.nome,
  slot: 'maoPrincipal' as const,
  arma: a.nome,
  icone: /arco|besta|funda/i.test(a.nome) ? '🏹' : /machado/i.test(a.nome) ? '🪓' : '⚔️',
  peso: a.peso,
  efeitos: [],
  // `propriedades` é lista; sem o join sairia "Leve,Acuidade" grudado.
  descricao: [`${a.dano} ${a.tipoDano}.`, a.propriedades.join(', ')].filter(Boolean).join(' '),
}))

/**
 * Os mágicos, traçados.
 *
 * Cada um aqui é uma decisão de leitura da regra. Quando o efeito não cabe em
 * número — "cria uma ilusão da sua posição" — ele vira `vantagem` ou fica na
 * descrição, em vez de virar um bônus inventado.
 */
const MAGICOS: ItemDeCatalogo[] = [
  {
    nome: 'Anel de Proteção',
    slot: 'anel1',
    icone: '💍',
    raridade: 'Raro',
    sintonia: true,
    efeitos: [
      { tipo: 'ca', valor: 1 },
      { tipo: 'salvaguarda', valor: 1 },
    ],
  },
  {
    nome: 'Manto de Proteção',
    slot: 'capa',
    icone: '🧣',
    raridade: 'Incomum',
    sintonia: true,
    efeitos: [
      { tipo: 'ca', valor: 1 },
      { tipo: 'salvaguarda', valor: 1 },
    ],
  },
  {
    nome: 'Manto Élfico',
    slot: 'capa',
    icone: '🧥',
    raridade: 'Incomum',
    sintonia: true,
    efeitos: [{ tipo: 'vantagem', em: 'Furtividade' }],
    descricao: 'Quem tenta te ver tem desvantagem em Percepção.',
  },
  {
    nome: 'Botas Élficas',
    slot: 'pes',
    icone: '👢',
    raridade: 'Incomum',
    sintonia: true,
    efeitos: [{ tipo: 'vantagem', em: 'mover-se em silêncio' }],
  },
  {
    nome: 'Botas de Passolargo e Salto',
    slot: 'pes',
    icone: '👢',
    raridade: 'Incomum',
    sintonia: true,
    efeitos: [{ tipo: 'deslocamento', metros: 9 }],
    descricao: 'O deslocamento vira 9 m acima do normal, e o salto triplica.',
  },
  {
    nome: 'Cinto de Força de Gigante da Colina',
    slot: 'cinto',
    icone: '🎗️',
    raridade: 'Raro',
    sintonia: true,
    efeitos: [{ tipo: 'atributoFixo', atributo: 'for', valor: 21 }],
  },
  {
    nome: 'Amuleto de Saúde',
    slot: 'pescoco',
    icone: '📿',
    raridade: 'Raro',
    sintonia: true,
    efeitos: [{ tipo: 'atributoFixo', atributo: 'con', valor: 19 }],
  },
  {
    nome: 'Pedra da Boa Sorte',
    slot: 'pescoco',
    icone: '🪨',
    raridade: 'Incomum',
    sintonia: true,
    efeitos: [
      { tipo: 'salvaguarda', valor: 1 },
      { tipo: 'pericia', pericia: 'percepcao', valor: 1 },
    ],
    descricao: '+1 em testes de perícia e salvaguardas (aqui só a Percepção está somada; some as outras se usar).',
  },
  {
    nome: 'Óculos da Noite',
    slot: 'cabeca',
    icone: '🥽',
    raridade: 'Incomum',
    efeitos: [{ tipo: 'sentido', texto: 'Visão no escuro 18 m' }],
  },
  {
    nome: 'Elmo de Compreensão de Idiomas',
    slot: 'cabeca',
    icone: '🪖',
    raridade: 'Incomum',
    efeitos: [
      { tipo: 'acao', nome: 'Compreender Idiomas', descricao: 'Conjura Compreender Idiomas.', usos: 'à vontade' },
    ],
  },
  {
    nome: 'Luvas de Roubo',
    slot: 'maos',
    icone: '🧤',
    raridade: 'Incomum',
    sintonia: true,
    efeitos: [{ tipo: 'pericia', pericia: 'prestidigitacao', valor: 5 }],
  },
  {
    nome: 'Braçadeiras de Defesa',
    slot: 'maos',
    icone: '🥊',
    raridade: 'Raro',
    sintonia: true,
    efeitos: [{ tipo: 'ca', valor: 2 }],
    descricao: 'Só funciona sem armadura e sem escudo.',
  },
  {
    nome: 'Arma +1',
    slot: 'maoPrincipal',
    icone: '⚔️',
    raridade: 'Incomum',
    efeitos: [
      { tipo: 'ataque', valor: 1 },
      { tipo: 'dano', valor: 1 },
    ],
  },
  {
    nome: 'Arma +2',
    slot: 'maoPrincipal',
    icone: '⚔️',
    raridade: 'Raro',
    efeitos: [
      { tipo: 'ataque', valor: 2 },
      { tipo: 'dano', valor: 2 },
    ],
  },
  {
    nome: 'Espada Flamejante',
    slot: 'maoPrincipal',
    icone: '🔥',
    arma: 'Espada Longa',
    raridade: 'Raro',
    sintonia: true,
    efeitos: [{ tipo: 'danoExtra', dado: '2d6', descricao: 'de fogo' }],
  },
  {
    nome: 'Matadora de Gigantes',
    slot: 'maoPrincipal',
    icone: '🗡️',
    arma: 'Espada Grande',
    raridade: 'Raro',
    efeitos: [
      { tipo: 'ataque', valor: 1 },
      { tipo: 'dano', valor: 1 },
      { tipo: 'danoExtra', dado: '2d6', contra: 'gigante' },
    ],
    descricao: 'O gigante atingido faz salvaguarda de FOR CD 15 ou cai caído.',
  },
  {
    nome: 'Matadora de Dragões',
    slot: 'maoPrincipal',
    icone: '🐲',
    arma: 'Espada Longa',
    raridade: 'Raro',
    efeitos: [
      { tipo: 'ataque', valor: 1 },
      { tipo: 'dano', valor: 1 },
      { tipo: 'danoExtra', dado: '3d6', contra: 'dragão' },
    ],
  },
  {
    nome: 'Escudo +1',
    slot: 'maoSecundaria',
    icone: '🛡️',
    raridade: 'Incomum',
    efeitos: [{ tipo: 'ca', valor: 3 }],
    descricao: 'Os 2 do escudo comum mais 1 do encantamento.',
  },
  {
    nome: 'Escudo',
    slot: 'maoSecundaria',
    icone: '🛡️',
    peso: 3,
    efeitos: [{ tipo: 'ca', valor: 2 }],
  },
]

/**
 * As armaduras encantadas, uma entrada por armadura e por grau.
 *
 * Existiam como uma "Armadura +1" solta, um +1 flutuante sem base de CA — e era
 * uma armadilha silenciosa. Quem a equipava não estava vestindo armadura
 * nenhuma: a CA subia 1 e mais nada. Num Monge o estrago era maior, porque a
 * Defesa sem Armadura continuava valendo, e o número saía do jeito que ninguém
 * conseguiria explicar.
 *
 * Agora cada uma tem a base da armadura de verdade E o encantamento, que é o
 * que o SRD diz: "Armor, +1, +2, or +3 — Armor (Any Light, Medium, or Heavy)".
 */
const GRAUS: { mais: number; raridade: RaridadeItem }[] = [
  { mais: 1, raridade: 'Raro' },
  { mais: 2, raridade: 'Muito raro' },
  { mais: 3, raridade: 'Lendário' },
]

const DE_ARMADURA_MAGICA: ItemDeCatalogo[] = ARMADURAS.flatMap((a) =>
  GRAUS.map(({ mais, raridade }) => ({
    nome: `${a.nome} +${mais}`,
    slot: 'corpo' as const,
    icone: '✨',
    armadura: a.nome,
    raridade,
    peso: a.peso,
    efeitos: [
      { tipo: 'caBase' as const, valor: a.ca, maxDes: a.maxDes },
      { tipo: 'ca' as const, valor: mais },
    ],
    descricao: `Armadura ${a.categoria.toLowerCase()} encantada. CA ${a.ca + mais}.`,
  })),
)

export const ITENS_EQUIPAVEIS: ItemDeCatalogo[] = [
  ...MAGICOS,
  ...DE_ARMADURA,
  ...DE_ARMADURA_MAGICA,
  ...DE_ARMA,
]

/** Cria uma cópia editável do item do catálogo, para a mochila da pessoa. */
export function doCatalogo(nome: string, id: string): Equipamento | null {
  const c = ITENS_EQUIPAVEIS.find((i) => i.nome === nome)
  if (!c) return null
  return {
    id,
    nome: c.nome,
    slot: c.slot,
    icone: c.icone,
    raridade: c.raridade,
    arma: c.arma,
    armadura: c.armadura,
    sintonia: c.sintonia,
    sintonizado: false,
    equipado: false,
    // Cópia profunda: editar o item da pessoa não pode mexer no catálogo.
    efeitos: JSON.parse(JSON.stringify(c.efeitos)),
    descricao: c.descricao,
    peso: c.peso,
  }
}
