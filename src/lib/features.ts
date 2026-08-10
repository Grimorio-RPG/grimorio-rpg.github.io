// O que o personagem ganhou da classe, e o que isso faz nas contas da ficha.
//
// Antes disto a ficha não sabia nada sobre a classe de quem a preenchia: os
// traços eram um campo de texto livre, e os números que dependiam deles saíam
// errados em silêncio.

import type { AbilityKey, Character } from '../types'
import { TRACOS_DE_CLASSE, type EfeitoTraco, type TracoClasse } from '../data/features'
import { tracosDaSubclasse } from '../data/subclasses'
import { TRACO_ANTECEDENTE, tracosDaEspecie } from '../data/species'
import { bonusDeEquipamento, usaEscudo, vesteArmadura } from './equipamento'
import { classes, nivelPrincipal } from './multiclasse'

/** De onde um traço veio — a ficha agrupa por isso. */
export type Origem = 'classe' | 'subclasse' | 'especie' | 'antecedente'

export interface TracoComOrigem extends TracoClasse {
  origem: Origem
}

function ate(nivel: number, tracos: TracoClasse[], origem: Origem): TracoComOrigem[] {
  return tracos.filter((t) => t.nivel <= nivel).map((t) => ({ ...t, origem }))
}

/**
 * Tudo que o personagem já tem, de todas as fontes, até o nível atual.
 *
 * Espécie e antecedente entram pelo mesmo caminho da classe: os traços deles
 * também têm nível (o sopro do Draconato cresce em 5, 11 e 17), então a mesma
 * peneira serve para os quatro.
 */
export function tracosDoPersonagem(char: Character): TracoComOrigem[] {
  // Cada classe entrega os traços do NÍVEL DELA. Um Guerreiro 3 / Mago 2 lendo
  // "nível 5" ganharia os traços de guerreiro de 5 E os de mago de 5 — o erro
  // clássico do multiclasse, e ele erra sempre para cima.
  const daClasse = classes(char).flatMap((c) =>
    ate(c.nivel, TRACOS_DE_CLASSE[c.classe] ?? [], 'classe'),
  )
  // Espécie e antecedente são do PERSONAGEM, e por isso seguem o nível dele: o
  // sopro do Draconato cresce com a pessoa, não com uma das classes dela.
  return [
    ...daClasse,
    ...ate(nivelPrincipal(char), tracosDaSubclasse(char.subclasse), 'subclasse'),
    ...ate(char.nivel, tracosDaEspecie(char.especie), 'especie'),
    ...ate(char.nivel, TRACO_ANTECEDENTE(char.antecedente), 'antecedente'),
  ].sort((a, b) => a.nivel - b.nivel)
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
  if (vesteArmadura(char)) return null
  const escudo = usaEscudo(char)
  for (const e of efeitos(char, 'defesaSemArmadura')) {
    if (escudo && !e.permiteEscudo) continue
    return e.atributo
  }
  return null
}

/** Deslocamento extra por traço (só sem armadura). */
export function bonusDeslocamento(char: Character): number {
  if (vesteArmadura(char)) return 0
  return efeitos(char, 'movimentoSemArmadura').reduce((maior, e) => Math.max(maior, e.metros), 0)
}

/**
 * Deslocamento efetivo: base, traços e EQUIPAMENTO.
 *
 * O equipamento faltava, e faltava em silêncio. O efeito existia no tipo, o
 * acumulador somava, e ninguém lia o resultado — então Botas Aladas não mexiam
 * um centímetro no deslocamento da ficha. Pior: o resumo do conjunto na boneca
 * já mostrava a diferença de deslocamento ao trocar de item, e ela era zero
 * para sempre, porque a conta nunca chegava aqui.
 */
export function deslocamentoEfetivo(char: Character): number {
  // 1,5 m por nível de exaustão — os 5 pés do livro na medida que o app usa.
  const exausto = 1.5 * Math.max(0, Math.min(6, char.exaustao ?? 0))
  return Math.max(
    0,
    char.deslocamento + bonusDeslocamento(char) + bonusDeEquipamento(char).deslocamento - exausto,
  )
}

export interface EscolhaPendente {
  nivel: number
  nome: string
  oque: 'talento' | 'estiloDeLuta' | 'subclasse' | 'manobra'
  quantidade: number
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
    .map((t) => {
      const e = t.efeito as Extract<EfeitoTraco, { tipo: 'escolha' }>
      return { nivel: t.nivel, nome: t.nome, oque: e.oque, quantidade: e.quantidade }
    })
}

/**
 * O que este nível específico concede.
 *
 * Usado pelo modal de subida de nível, que antes só perguntava PV e subclasse —
 * e por isso deixava passar batido justamente os níveis com escolha.
 */
export function tracosGanhosNoNivel(char: Character, nivel: number): TracoComOrigem[] {
  return tracosDoPersonagem({ ...char, nivel }).filter((t) => t.nivel === nivel)
}

/** Quantas manobras o personagem já deveria conhecer. */
export function manobrasDevidas(char: Character): number {
  return escolhasDoNivel(char)
    .filter((e) => e.oque === 'manobra')
    .reduce((total, e) => total + e.quantidade, 0)
}

/**
 * Escolhas que ainda parecem não ter sido feitas.
 *
 * Aumento de Atributo fica de fora de propósito: não há como distinguir um
 * atributo subido de um digitado, e um alerta que não some é pior que nenhum.
 */
export function escolhasPendentes(char: Character): EscolhaPendente[] {
  const manobrasFeitas = char.manobras?.length ?? 0
  const devidas = manobrasDevidas(char)

  return escolhasDoNivel(char).filter((e) => {
    if (e.oque === 'subclasse') return !char.subclasse
    if (e.oque === 'estiloDeLuta') return !char.talentos.some((t) => ESTILOS.includes(t))
    // Uma linha só para as manobras, na maior: senão o nível 3 e o 7 apareceriam
    // como pendências separadas mesmo já tendo escolhido tudo.
    if (e.oque === 'manobra') {
      return manobrasFeitas < devidas && e.nivel === Math.max(
        ...escolhasDoNivel(char).filter((x) => x.oque === 'manobra').map((x) => x.nivel),
      )
    }
    return false
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
