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

/** O que uma subida de nível concedeu, para poder ser desfeita. */
export interface GanhoDeNivel {
  /** Nível alcançado nesta subida. */
  nivel: number
  pvGanho: number
  /** Rolado ou média — só para a interface explicar o que aconteceu. */
  rolado: boolean
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
  /** Manobras escolhidas (Mestre de Batalha). Opcional: fichas antigas não têm. */
  manobras?: string[]
  /**
   * O que cada subida de nível deu.
   *
   * Existe para descer de nível ser exato em vez de estimado: sem guardar o PV
   * ganho, a única reversão possível é pela média do dado, que erra sempre que
   * a pessoa rolou. Opcional — fichas anteriores a isto não têm histórico.
   */
  historicoNiveis?: GanhoDeNivel[]
  /**
   * Experiência acumulada. Opcional de propósito: muitas mesas jogam por marco
   * e nunca contam XP — quem não usa não vê barra nenhuma.
   */
  xp?: number
  /**
   * Magia em concentração, se houver.
   *
   * O 2024 depende disso e o app não rastreava: perder a concentração sem
   * perceber é o erro de regra mais comum de mesa.
   */
  concentrando?: string
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

/** Categorias de verbete do codex do mundo. */
export type LoreTipo = 'local' | 'faccao' | 'divindade' | 'evento' | 'item' | 'segredo'

/**
 * Verbete do codex. Segue o mesmo padrão do bestiário: o DM controla o quanto
 * o grupo já sabe, e a visão dos jogadores revela só até esse ponto.
 */
export interface LoreEntry {
  id: string
  tipo: LoreTipo
  nome: string
  imagemUrl: string
  resumo: string // o que o grupo sabe de imediato (nível "ouviu falar")
  descricao: string // detalhes revelados quando "conhece"
  segredos: string // sempre privado do DM
  conhecimento: KnowledgeLevel // desconhecido | encontrado(ouviu falar) | parcial | completo
  etiquetas: string[]
}

/** Item entregue aos jogadores: carta, mapa, ilustração. */
export interface Handout {
  id: string
  titulo: string
  texto: string
  imagemUrl: string
  revelado: boolean
}

/** Reputação do grupo com uma facção (-3 a +3). */
export interface Reputacao {
  loreId: string
  valor: number
}

/**
 * Recado do DM para o grupo — "o mercador sumiu da cidade", "próxima sessão
 * é quinta". Fica num mural em ordem cronológica.
 *
 * Enquanto `publicado` for falso, só o DM enxerga: dá para escrever com
 * antecedência e soltar na hora certa.
 */
export interface Atualizacao {
  id: string
  criadoEm: number
  titulo: string
  texto: string
  fixado: boolean
  publicado: boolean
}

// ---------------------------------------------------------------------------
// Mundo — mapas de campanha, região e cidade
//
// Diferente do mapa da aba Mapa, que é tático (grade, tokens de combate). Aqui
// é o mapa que fica na mesa: lugares com nome, revelados conforme o grupo
// descobre.
//
// A imagem NÃO mora aqui. Ela pesa ~500 KB e quase nunca muda, enquanto os
// pontos mudam toda hora — juntas, revelar um lugar reenviaria o mapa inteiro
// pela rede. Ver `ImagemMapa`.
// ---------------------------------------------------------------------------

export type TipoPonto = 'cidade' | 'ruina' | 'masmorra' | 'marco' | 'perigo' | 'acampamento'

export interface PontoInteresse {
  id: string
  nome: string
  tipo: TipoPonto
  /** Posição no mapa, fração 0..1 — mesma convenção do Token. */
  x: number
  y: number
  /** O que o grupo lê quando o ponto está revelado. */
  descricao: string
  /** Anotação do DM. A projeção pública apaga este campo. */
  notasSecretas: string
  /** Enquanto for falso, o ponto não existe para o grupo. */
  revelado: boolean
}

export interface MapaMundo {
  id: string
  nome: string
  escopo: 'campanha' | 'regiao' | 'cidade'
  pontos: PontoInteresse[]
  /** Mapa inteiro escondido: nem ele nem a imagem saem para o grupo. */
  revelado: boolean
  atualizadoEm: number
}

/**
 * A imagem de um mapa, guardada e publicada à parte — uma chave por mapa.
 * Sobe uma vez; depois disso só os pontos trafegam.
 */
export interface ImagemMapa {
  id: string
  dataUrl: string
}

export interface Mundo {
  mapas: MapaMundo[]
  /** Qual mapa está aberto na mesa. */
  mapaAtivoId: string
}

// ---------------------------------------------------------------------------
// Viagem — a crônica da estrada
//
// O trecho entre dois lugares é a parte mais pulada de uma sessão. Aqui ele vira
// registro: em que dia o grupo está, onde está, e o que a estrada trouxe.
// ---------------------------------------------------------------------------

/** Uma linha da tabela que o DM sorteia na estrada. */
export interface EventoEstrada {
  id: string
  /** Resultado do dado que traz este evento. */
  face: number
  texto: string
}

/** Uma entrada da crônica: o que aconteceu, em que dia, onde. */
export interface EntradaCronica {
  id: string
  criadoEm: number
  dia: number
  local: string
  texto: string
  /**
   * Anotação de bastidor. A projeção pública remove estas entradas, então elas
   * nunca chegam ao aparelho de um jogador.
   */
  soDm: boolean
}

export interface Viagem {
  emCurso: boolean
  /** Dia de marcha. Genérico de propósito: conte como a sua campanha contar. */
  dia: number
  /** Onde o grupo está agora. Texto livre. */
  local: string
  destino: string
  /** Quantas faces tem o dado da tabela (1d6 por padrão). */
  facesDado: number
  /**
   * O que *pode* acontecer na estrada. É prep do DM: sai inteira da projeção
   * pública, senão o grupo lê o roteiro antes de vivê-lo.
   */
  tabelaEventos: EventoEstrada[]
  cronica: EntradaCronica[]
}

export interface Campaign {
  updatedAt: number
  nome: string
  sinopse: string
  arcoAtual: string
  /** Resumo curto do fim da última sessão — a primeira coisa que o grupo lê. */
  ondeParamos: string
  party: Character[] // fichas importadas dos jogadores (snapshots)
  npcs: Npc[]
  sessoes: SessionEntry[]
  atualizacoes: Atualizacao[]
  codex: LoreEntry[]
  handouts: Handout[]
  reputacoes: Reputacao[]
  viagem: Viagem
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

/**
 * Peso da criatura na campanha.
 *
 * Serve para separar o lixo de encontro do que é marco: só Mini Boss e Boss
 * ganham o tratamento de "derrotado" na tela do grupo — riscar um goblin
 * qualquer não conta história nenhuma.
 */
export type CategoriaMonstro = 'comum' | 'elite' | 'miniboss' | 'boss' | 'bbeg'

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
  /** Peso na campanha. Opcional: fichas antigas viram 'comum'. */
  categoria?: CategoriaMonstro
  /** O grupo já derrubou. Risca o card — só vale para Mini Boss e Boss. */
  derrotado?: boolean
  /**
   * Criaturas que compartilham este id são a MESMA criatura em momentos
   * diferentes: fase 2, forma desperta, versão condicionada à lore.
   *
   * Cada fase continua uma ficha completa — arte, estatísticas e ações
   * próprias. Guardar como grupo, e não como campos dentro de uma ficha só,
   * é o que permite a transformação trocar tudo de uma vez.
   */
  chefeId?: string
  /** Ordem dentro do grupo. 1 é a forma em que o chefe entra em combate. */
  fase?: number
  /** Rótulo da fase, quando o número não basta ("Forma Desperta"). */
  nomeFase?: string
}
