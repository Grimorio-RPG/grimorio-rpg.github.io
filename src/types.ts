// Modelo de dados da ficha de personagem — D&D 5.5e (regras de 2024)

export type AbilityKey = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car'

export interface Abilities {
  for: number
  des: number
  con: number
  int: number
  sab: number
  car: number
}

export type SkillKey =
  | 'acrobacia'
  | 'arcanismo'
  | 'atletismo'
  | 'atuacao'
  | 'blefar'
  | 'furtividade'
  | 'historia'
  | 'intimidacao'
  | 'intuicao'
  | 'investigacao'
  | 'lidarComAnimais'
  | 'medicina'
  | 'natureza'
  | 'percepcao'
  | 'persuasao'
  | 'prestidigitacao'
  | 'religiao'
  | 'sobrevivencia'

export interface Attack {
  id: string
  nome: string
  bonus: string // ex: "+5" — mantido como texto para flexibilidade
  dano: string // ex: "1d8+3 cortante"
  notas?: string
}

export interface SpellRef {
  id: string
  nome: string
  nivel: number // 0 = truque
  preparada: boolean
}

/** Espaços de magia de um nível (1 a 9). */
export interface SpellSlot {
  total: number
  usados: number
}

export interface InventoryItem {
  id: string
  nome: string
  qtd: number
  peso: number // por unidade, em kg (0 = ignorar)
  notas: string
}

/** Moedas: cobre, prata, electro, ouro, platina. */
export interface Moedas {
  pc: number
  pp: number
  pe: number
  po: number
  pl: number
}

export interface TestesMorte {
  sucessos: number // 0-3
  falhas: number // 0-3
}

export interface Character {
  id: string
  updatedAt: number

  // Identidade
  nome: string
  jogador: string
  classe: string
  subclasse: string
  nivel: number
  especie: string // "raça" na terminologia antiga
  antecedente: string
  alinhamento: string
  avatarUrl?: string

  // Atributos
  atributos: Abilities

  // Proficiências
  salvaguardasProficientes: AbilityKey[]
  periciasProficientes: SkillKey[]
  periciasExpertise: SkillKey[]

  // Combate
  classeArmaduraManual: number | null // se preenchido, sobrepõe o cálculo
  armaduraEquipada: string // nome da armadura do catálogo ('' = sem armadura)
  escudoEquipado: boolean
  talentos: string[] // nomes dos talentos escolhidos
  iniciativaBonus: number
  deslocamento: number
  pvMax: number
  pvAtual: number
  pvTemporario: number
  dadosDeVida: string // ex: "3d10"
  dadosDeVidaUsados: number // quantos já foram gastos em descansos curtos
  ataques: Attack[]

  // Magias
  atributoConjuracao: AbilityKey | null
  magias: SpellRef[]
  espacosMagia: SpellSlot[] // 9 posições: índice 0 = nível 1, ... índice 8 = nível 9

  // Estado / condições
  testesMorte: TestesMorte
  exaustao: number // 0-6 (regra 2024)
  condicoes: string[] // nomes das condições ativas

  // Inventário
  moedas: Moedas
  inventario: InventoryItem[]

  // Recursos & Diversos
  inspiracaoHeroica: boolean
  idiomas: string
  proficienciasEquipamentos: string
  equipamento: string
  caracteristicas: string // traços de classe/espécie/antecedente
  anotacoes: string
}

// ---------------------------------------------------------------------------
// Campanha / Painel do DM
// ---------------------------------------------------------------------------

export interface Npc {
  id: string
  nome: string
  papel: string // ex: "Taverneiro", "Vilão", "Aliado"
  descricao: string
  notasSecretas: string // visível só para o DM
}

export interface SessionEntry {
  id: string
  data: string // texto livre, ex: "20/07 — Sessão 3"
  titulo: string
  resumo: string
}

export interface Campaign {
  updatedAt: number
  nome: string
  sinopse: string
  arcoAtual: string
  party: Character[] // fichas importadas dos jogadores (snapshots)
  npcs: Npc[]
  sessoes: SessionEntry[]
}

// ---------------------------------------------------------------------------
// Bestiário
// ---------------------------------------------------------------------------

export interface MonsterAction {
  id: string
  nome: string
  descricao: string // ex: "Cimitarra. +4 para acertar, 1d6+2 de dano cortante."
}

/**
 * O quanto o grupo conhece uma criatura — controla o que aparece na
 * Visão dos Jogadores.
 * - desconhecido: jogadores não veem a criatura.
 * - encontrado: veem foto, nome, tamanho e tipo.
 * - parcial: + ND, CA, PV, deslocamento e atributos.
 * - completo: a ficha inteira (traços e ações). Táticas do DM continuam privadas.
 */
export type KnowledgeLevel = 'desconhecido' | 'encontrado' | 'parcial' | 'completo'

// ---------------------------------------------------------------------------
// Batalhas (rastreador de combate)
// ---------------------------------------------------------------------------

export interface Combatant {
  id: string
  origem: 'inimigo' | 'aliado'
  refId: string // id do monstro/personagem de origem (agrupa duplicatas)
  nome: string
  imagemUrl: string // imagem do DM
  imagemJogadorUrl: string // imagem que os jogadores veem
  conhecimento: KnowledgeLevel // p/ inimigos: herdado do bestiário
  ca: number
  pvMax: number
  pvAtual: number
  iniciativa: number | null
  iniciativaMod: number // modificador para rolar iniciativa
  nomeOculto: boolean // se true, os jogadores veem "???" no lugar do nome (imagem continua)
  condicoes: string[] // condições ativas neste combate
}

export interface Battle {
  updatedAt: number
  nome: string
  rodada: number
  turnoIndex: number // posição do turno atual na ordem de iniciativa
  emAndamento: boolean
  combatentes: Combatant[]
}

// ---------------------------------------------------------------------------
// Mapa / Mesa Virtual (VTT)
// ---------------------------------------------------------------------------

export interface Token {
  id: string
  nome: string
  imagemUrl: string // imagem vista pelo DM
  imagemJogadorUrl: string // imagem vista pelos jogadores (fallback: imagemUrl)
  origem: 'aliado' | 'inimigo' | 'objeto'
  x: number // posição no mapa, fração 0..1
  y: number // posição no mapa, fração 0..1
  tamanho: number // em quadrados da grade (1 = médio)
  cor: string // cor do anel do token
  oculto: boolean // escondido dos jogadores
  conhecimento: KnowledgeLevel // p/ inimigos: herda do bestiário
}

export interface MapScene {
  updatedAt: number
  nome: string
  mapaUrl: string // data URL da imagem do mapa
  celPx: number // tamanho do quadrado da grade, em px de tela
  mostrarGrade: boolean
  offsetX: number // deslocamento da grade em px
  offsetY: number
  encaixarGrade: boolean // tokens "grudam" no centro dos quadrados
  zoom: number // escala de exibição do mapa (1 = 100%)
  tokens: Token[]
}

export interface Monster {
  id: string
  updatedAt: number
  nome: string
  imagemUrl: string // foto de referência do DM (URL ou data URL)
  imagemJogadorUrl: string // foto que os jogadores veem (fallback: imagemUrl)
  tipo: string // ex: "Humanoide (goblinoide)"
  tamanho: string // Miúdo, Pequeno, Médio, Grande, Enorme, Colossal
  nd: string // Nível de Desafio, ex: "1/4"
  ca: number
  pvMax: number
  pvAtual: number
  deslocamento: string // ex: "9 m, voo 18 m"
  atributos: Abilities
  tracos: string // habilidades passivas (texto livre)
  acoes: MonsterAction[]
  taticas: string // notas do DM (como usar em combate) — sempre privadas
  conhecimento: KnowledgeLevel // o que o grupo já sabe sobre a criatura
}
