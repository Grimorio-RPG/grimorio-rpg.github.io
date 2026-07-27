// O que o personagem ganhou da classe, e o que isso faz nas contas da ficha.
//
// Antes disto a ficha não sabia nada sobre a classe de quem a preenchia: os
// traços eram um campo de texto livre, e os números que dependiam deles saíam
// errados em silêncio.

import type { AbilityKey, Character } from '../types'
import { TRACOS_DE_CLASSE, type EfeitoTraco, type TracoClasse } from '../data/features'

/** Traços que o personagem já tem, do nível 1 até o atual. */
export function tracosDoPersonagem(char: Character): TracoClasse[] {
  const todos = TRACOS_DE_CLASSE[char.classe] ?? []
  return todos.filter((t) => t.nivel <= char.nivel).sort((a, b) => a.nivel - b.nivel)
}

function efeitos<T extends EfeitoTraco['tipo']>(
  char: Character,
  tipo: T,
): Extract<EfeitoTraco, { tipo: T }>[] {
  return tracosDoPersonagem(char)
    .map((t) => t.efeito)
    .filter((e): e is Extract<EfeitoTraco, { tipo: T }> => e?.tipo === tipo)
}

/**
 * Quantos ataques a ação de Ataque permite.
 *
 * Os traços trazem o total, não um incremento, então vale o maior: o Guerreiro
 * de nível 11 tem "3", não 2 + 3.
 */
export function ataquesPorAcao(char: Character): number {
  return efeitos(char, 'ataquesExtras').reduce((maior, e) => Math.max(maior, e.total), 1)
}

/** Dados de Ataque Furtivo (0 para quem não tem). */
export function dadosDeAtaqueFurtivo(char: Character): number {
  return efeitos(char, 'ataqueFurtivo').reduce((maior, e) => Math.max(maior, e.dados), 0)
}

/**
 * Base de CA vinda de traço, se ela se aplicar agora.
 *
 * Devolve nada quando há armadura, ou quando há escudo e o traço não o permite
 * — a diferença entre o Bárbaro (mantém) e o Monge (perde).
 */
export function defesaSemArmadura(char: Character): AbilityKey | null {
  if (char.armaduraEquipada) return null
  for (const e of efeitos(char, 'defesaSemArmadura')) {
    if (char.escudoEquipado && !e.permiteEscudo) continue
    return e.atributo
  }
  return null
}

/** Deslocamento extra por traço (só sem armadura). */
export function bonusDeslocamento(char: Character): number {
  if (char.armaduraEquipada) return 0
  return efeitos(char, 'movimentoSemArmadura').reduce((maior, e) => Math.max(maior, e.metros), 0)
}

/** Deslocamento efetivo, já com os traços. */
export function deslocamentoEfetivo(char: Character): number {
  return char.deslocamento + bonusDeslocamento(char)
}

export interface EscolhaPendente {
  nivel: number
  nome: string
  oque: 'talento' | 'estiloDeLuta' | 'subclasse'
}

/**
 * Escolhas que o nível atual já concede.
 *
 * É a resposta para "tem escolhas em certos níveis que não apareceram": a ficha
 * passa a saber que elas existem, em vez de deixar a pessoa descobrir sozinha
 * lendo o livro.
 */
export function escolhasDoNivel(char: Character): EscolhaPendente[] {
  return tracosDoPersonagem(char)
    .filter((t) => t.efeito?.tipo === 'escolha')
    .map((t) => ({
      nivel: t.nivel,
      nome: t.nome,
      oque: (t.efeito as Extract<EfeitoTraco, { tipo: 'escolha' }>).oque,
    }))
}

/** Escolhas que ainda parecem não ter sido feitas. */
export function escolhasPendentes(char: Character): EscolhaPendente[] {
  return escolhasDoNivel(char).filter((e) => {
    if (e.oque === 'subclasse') return !char.subclasse
    if (e.oque === 'estiloDeLuta') return !char.talentos.some((t) => ESTILOS.includes(t))
    return false // talento/ASI: não dá para saber se a pessoa subiu atributo
  })
}

/** Nomes dos estilos de luta, para reconhecer se um já foi escolhido. */
const ESTILOS = [
  'Arquearia',
  'Combate Cego',
  'Combate com Arma Grande',
  'Combate com Duas Armas',
  'Combate Desarmado',
  'Defesa',
  'Duelismo',
  'Interceptação',
  'Proteção',
  'Lançamento de Armas',
]
