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
  classeArmaduraManual: number | null // se null, calcula 10 + mod des
  iniciativaBonus: number
  deslocamento: number
  pvMax: number
  pvAtual: number
  pvTemporario: number
  dadosDeVida: string // ex: "3d10"
  ataques: Attack[]

  // Magias
  atributoConjuracao: AbilityKey | null
  magias: SpellRef[]

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

export interface Monster {
  id: string
  updatedAt: number
  nome: string
  imagemUrl: string // URL ou data URL de uma foto
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
  taticas: string // notas do DM (como usar em combate)
  revelado: boolean // se o grupo já viu (uso futuro na visão dos jogadores)
}
