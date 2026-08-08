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

// ---------------------------------------------------------------------------
// Equipamento
//
// O que muda em relação ao inventário: um item de inventário é uma linha de
// texto com peso. Um equipamento é vestido num lugar do corpo e MUDA a ficha —
// a CA, o ataque, o dano, um atributo, uma perícia.
//
// Os efeitos são estruturados de propósito. "Anel de Proteção: +1 na CA e nas
// salvaguardas" escrito como frase é bonito e inútil: ninguém soma por você, e
// a pessoa acaba mantendo a conta na cabeça — que foi exatamente como a CA do
// Thorn divergiu do D&D Beyond.
// ---------------------------------------------------------------------------

/**
 * Onde o item é vestido.
 *
 * D&D não tem slots no livro, mas tem as regras que os produzem: não se usa
 * dois elmos, anéis são dois, e o DMG diz que vestir duas coisas iguais não
 * acumula. Slot é essa regra, escrita de um jeito que a tela entende.
 */
export type SlotEquipamento =
  | 'cabeca'
  | 'pescoco'
  | 'corpo'
  | 'capa'
  | 'maos'
  | 'anel1'
  | 'anel2'
  | 'cinto'
  | 'pes'
  | 'maoPrincipal'
  | 'maoSecundaria'

/**
 * O que um item faz, em forma que o app consegue somar.
 *
 * `contra` é o que sustenta a espada que dá "+2 contra goblinoides": o bônus
 * não entra no total, porque não vale sempre — ele aparece na hora de rolar
 * contra aquele tipo de criatura.
 */
export type EfeitoDeItem =
  /** Soma na Classe de Armadura. */
  | { tipo: 'ca'; valor: number }
  /** Substitui a base da CA — é o que uma armadura faz. */
  | { tipo: 'caBase'; valor: number; maxDes?: number | null }
  | { tipo: 'ataque'; valor: number; contra?: string }
  | { tipo: 'dano'; valor: number; contra?: string }
  /** Dano extra em dado, ex: "2d6" de fogo da Espada Flamejante. */
  | { tipo: 'danoExtra'; dado: string; descricao?: string; contra?: string }
  /** Soma no valor do atributo. */
  | { tipo: 'atributo'; atributo: AbilityKey; valor: number }
  /** Define o atributo, se for maior — Cinto de Força, Amuleto de Saúde. */
  | { tipo: 'atributoFixo'; atributo: AbilityKey; valor: number }
  /** Sem atributo, vale para todas as salvaguardas. */
  | { tipo: 'salvaguarda'; valor: number; atributo?: AbilityKey }
  | { tipo: 'pericia'; pericia: SkillKey; valor: number }
  | { tipo: 'vantagem'; em: string }
  | { tipo: 'resistencia'; a: string }
  | { tipo: 'deslocamento'; metros: number }
  /** Visão no escuro, percepção às cegas: texto, porque não entra em conta. */
  | { tipo: 'sentido'; texto: string }
  /** O que o item deixa VOCÊ fazer — vira botão na ficha. */
  | { tipo: 'acao'; nome: string; descricao: string; usos?: string }

export type RaridadeItem = 'Comum' | 'Incomum' | 'Raro' | 'Muito raro' | 'Lendário'

export interface Equipamento {
  id: string
  nome: string
  slot: SlotEquipamento
  /** Emoji ou data URL. O visual do item na boneca. */
  icone?: string
  imagemUrl?: string
  raridade?: RaridadeItem
  /** Exige sintonia. O 5.5e limita a três por personagem. */
  sintonia?: boolean
  sintonizado?: boolean
  /** Vestido agora. Guardado sem estar vestido continua na mochila. */
  equipado?: boolean
  efeitos: EfeitoDeItem[]
  descricao?: string
  peso?: number
  /** Quantas peças. Ausente vale 1. A loja também vai precisar disto. */
  qtd?: number
  /**
   * Nome da arma do catálogo em que este item se baseia.
   *
   * É o que liga vestir a rolar: sem isto o item sabe que dá "+2 no ataque" mas
   * não sabe que é 1d8 cortante com Acuidade, então nunca conseguiria virar uma
   * linha de ataque — e a pessoa continuaria digitando o ataque à mão ao lado da
   * espada que ela acabou de vestir.
   */
  arma?: string
  /**
   * Nome da armadura do catálogo em que este item se baseia.
   *
   * O par de `arma`: é por ele que a ficha sabe avisar que a Cota de Malha dá
   * desvantagem em Furtividade e exige Força 13.
   */
  armadura?: string
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
  /**
   * O que a pessoa veste, e o que carrega mas não veste.
   *
   * Ausente em fichas antigas. Enquanto estiver ausente valem
   * `armaduraEquipada` e `escudoEquipado`, que continuam existindo para não
   * quebrar quem já preencheu a ficha.
   */
  equipamentos?: Equipamento[]

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

/**
 * Uma entrada de tabela sorteável.
 *
 * O peso existe para "nada acontece" poder ser comum sem ocupar seis linhas
 * iguais. Ausente vale 1.
 */
export interface EntradaTabela {
  id: string
  texto: string
  peso?: number
}

/**
 * Tabela do DM: encontros por região, nomes de NPC, rumores, complicações.
 *
 * É prep, e prep não sai na projeção — a tabela conta o que ainda vai
 * acontecer.
 */
export interface TabelaSorteavel {
  id: string
  nome: string
  /** Onde ela vale. Texto livre, casado de forma frouxa com o lugar. */
  contexto: string
  entradas: EntradaTabela[]
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
  /** Tabelas do DM. Ausente em campanhas antigas. */
  tabelas?: TabelaSorteavel[]
}

// ---------------------------------------------------------------------------
// Bestiário
// ---------------------------------------------------------------------------

/**
 * Quando a criatura pode usar aquilo.
 *
 * Sem esta separação um chefe do livro virava uma lista chapada de ações, e a
 * coisa que faz um chefe ser chefe — agir fora do próprio turno — sumia junto.
 */
export type TipoAcaoMonstro = 'acao' | 'bonus' | 'reacao' | 'lendaria' | 'covil'

/**
 * Moeda em notação de dado, para o tesouro variar entre encontros.
 *
 * Um número fixo faria o terceiro bando de goblins ter exatamente o mesmo
 * bolso do primeiro.
 */
export interface MoedaDeTesouro {
  moeda: keyof Moedas
  /** Notação: "2d6", "1d4+2". */
  dado: string
}

export interface ItemDeTesouro {
  id: string
  nome: string
  /** Chance de cair, de 1 a 100. Ausente = cai sempre. */
  chance?: number
}

/** O que uma criatura deixa para trás. */
export interface Tesouro {
  moedas: MoedaDeTesouro[]
  itens: ItemDeTesouro[]
}

export interface MonsterAction {
  id: string
  nome: string
  descricao: string // ex: "Cimitarra. +4 para acertar, 1d6+2 de dano cortante."
  /** Ausente em fichas antigas — vale como 'acao'. */
  tipo?: TipoAcaoMonstro
  /**
   * Quantas das ações lendárias esta consome. O padrão é 1; algumas custam 2
   * ou 3, e é justamente o custo que faz o chefe escolher.
   */
  custoLendaria?: number
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
  /**
   * Rodadas restantes de cada condição, pelo nome dela.
   *
   * Fica ao LADO de `condicoes`, e não dentro: aquela lista atravessa a rede
   * até a ficha do jogador (`ajustarFichaDaMesa`) e é lida pela ficha, pela
   * faixa do grupo e pelo cartão. Trocar a forma dela quebraria quem estivesse
   * com uma versão antiga do app em cache, no meio da sessão.
   *
   * Quem manda é `condicoes`. Uma chave sobrando aqui não faz mal — nada é
   * desenhado a partir deste mapa sozinho.
   */
  rodadasDeCondicao?: Record<string, number>
  /**
   * A magia que esta criatura está concentrando.
   *
   * Concentração existia só como propriedade de magia no catálogo e sumia no
   * combate: a mesa inteira esquecia que o mago estava concentrado até alguém
   * lembrar meia hora depois.
   */
  concentracao?: string
  /**
   * Ações lendárias ainda disponíveis nesta rodada.
   *
   * Recarrega no início do turno da criatura, que é como a regra funciona: as
   * lendárias são gastas ENTRE os turnos dela, no turno dos outros.
   */
  lendariasRestantes?: number
  /** Teto de ações lendárias por rodada, copiado do bestiário. */
  lendariasMax?: number
  /**
   * Peso da criatura, copiado do bestiário — é o que faz a tela do grupo
   * levantar a barra de chefe.
   *
   * Guarda o rank VERDADEIRO. A projeção troca pelo aparente antes de sair,
   * do mesmo jeito que o bestiário faz: é justamente isto que segura o plot
   * twist de um vilão que o grupo acha que é outra coisa.
   */
  categoria?: CategoriaMonstro
  /** O rank que o grupo deve enxergar, quando difere do real. Nunca sai. */
  categoriaAparente?: CategoriaMonstro

  // --- Onde a criatura está no mapa ---------------------------------------
  //
  // O combatente e o token do mapa eram objetos separados, cada um com o seu
  // id, os dois criados a partir do mesmo monstro. Você cadastrava o goblin na
  // batalha e depois cadastrava o token do goblin no mapa — e o token nem tinha
  // PV, então tirar vida numa tela não mudava nada na outra.
  //
  // Agora é a mesma criatura. Ausente = ainda não foi colocada no mapa.
  /** Posição, fração 0..1 — a mesma convenção do Token. */
  x?: number
  y?: number
  /** Em quadrados da grade. 1 = Médio. */
  tamanho?: number
  /** Cor do anel do token. */
  cor?: string
  /**
   * Fora de cena para o grupo.
   *
   * Diferente de `nomeOculto`, que mostra "???" mas revela que ALGO está ali.
   * Isto some da tela dos jogadores por inteiro — é a emboscada que ainda não
   * saltou.
   */
  oculto?: boolean
  /**
   * Inspiração heroica — só para combatentes que são fichas.
   *
   * Existe aqui, e não só na ficha, porque o DM concede da tela dele durante o
   * combate: é o momento em que ela é ganha. O valor volta para a ficha do
   * dono pelo mesmo caminho que o PV.
   */
  inspiracaoHeroica?: boolean
}

/**
 * O que aconteceu no combate, na ordem em que aconteceu.
 *
 * A batalha guardava só o retrato do agora — quem está vivo, de quem é a vez.
 * Quando alguém perguntava "quanto de dano foi aquilo?", a resposta não existia
 * em lugar nenhum.
 */
export type TipoEventoCombate =
  | 'dano'
  | 'cura'
  | 'condicao'
  | 'caiu'
  | 'morreu'
  | 'levantou'
  | 'rodada'
  | 'fase'
  | 'lendaria'
  | 'concentracao'
  | 'entrou'
  | 'nota'

export interface EventoCombate {
  id: string
  em: number // carimbo de tempo
  rodada: number
  tipo: TipoEventoCombate
  /** Quem sofreu ou fez. Guardamos o nome porque o combatente pode sair da lista. */
  alvo?: string
  /** Quanto, para dano e cura. */
  valor?: number
  /** A frase pronta. É o que a tela mostra. */
  texto: string
  /**
   * O evento fala de um inimigo?
   *
   * A projeção usa isto para censurar números que entregariam o PV exato de um
   * monstro — o grupo vê a porcentagem, e o log não pode ser a porta dos fundos.
   */
  deInimigo?: boolean
}

/** Um passo desfazível. A forma mora em `lib/desfazer.ts`. */
export interface PassoDesfazivel {
  id: string
  em: number
  descricao: string
  alteracoes: { id: string; campos: Partial<Combatant> }[]
  removidos?: Combatant[]
}

export interface Battle {
  updatedAt: number
  nome: string
  rodada: number
  turnoIndex: number // posição do turno atual na ordem de iniciativa
  emAndamento: boolean
  combatentes: Combatant[]
  /** Ausente em batalhas antigas. Mais recente por último. */
  registro?: EventoCombate[]
  /**
   * Os últimos ajustes, para poderem ser desfeitos.
   *
   * Guarda só o que mudou, e não a lista inteira: cada combatente carrega a
   * imagem embutida, e dez cópias multiplicariam por dez o que sincroniza.
   *
   * Fica dentro da batalha porque o desfazer precisa sincronizar — o mesmo DM
   * abre o app no PC e no celular, e um desfazer que valesse só num deles
   * deixaria os dois com vidas diferentes.
   *
   * NUNCA sai na projeção: guarda o PV anterior exato de cada criatura.
   */
  desfazer?: PassoDesfazivel[]
}

// ---------------------------------------------------------------------------
// Mapa / Mesa Virtual (VTT)
// ---------------------------------------------------------------------------

export interface Token {
  id: string
  nome: string
  imagemUrl: string // imagem vista pelo DM
  imagemJogadorUrl: string // a ÚNICA que sai para o grupo; vazia = silhueta
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
  imagemJogadorUrl: string // a ÚNICA que sai para o grupo; vazia = silhueta
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
  /** O que cai quando ela morre. Ausente = nada, que é o caso da maioria. */
  tesouro?: Tesouro
  /**
   * Quantas ações lendárias por rodada. 0 ou ausente = a criatura não tem.
   *
   * Fica no monstro e não na ação porque o orçamento é da criatura: três ações
   * lendárias listadas não significam três usos.
   */
  acoesLendarias?: number
  taticas: string // notas do DM (como usar em combate) — sempre privadas
  conhecimento: KnowledgeLevel // o que o grupo já sabe sobre a criatura
  /** Peso na campanha. Opcional: fichas antigas viram 'comum'. */
  categoria?: CategoriaMonstro
  /**
   * O rank que o GRUPO enxerga, quando ele deve diferir do real.
   *
   * Existe para o plot twist: o grupo passa a campanha achando que o vilão é
   * outro. Sem isto, o rank respondia duas perguntas com um valor só — o que a
   * criatura é, e o que o grupo pensa que ela é.
   *
   * Vazio significa "mostre o verdadeiro", que é o caso normal.
   */
  categoriaAparente?: CategoriaMonstro
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
