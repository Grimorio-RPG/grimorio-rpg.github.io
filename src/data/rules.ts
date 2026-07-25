import type { AbilityKey, SkillKey } from '../types'

// ---------------------------------------------------------------------------
// Atributos
// ---------------------------------------------------------------------------
export const ABILITIES: { key: AbilityKey; nome: string; abrev: string; desc: string }[] = [
  { key: 'for', nome: 'Força', abrev: 'FOR', desc: 'Poder físico, atletismo e capacidade de carga.' },
  { key: 'des', nome: 'Destreza', abrev: 'DES', desc: 'Agilidade, reflexos, equilíbrio e pontaria.' },
  { key: 'con', nome: 'Constituição', abrev: 'CON', desc: 'Vigor, saúde e resistência física.' },
  { key: 'int', nome: 'Inteligência', abrev: 'INT', desc: 'Raciocínio, memória e conhecimento.' },
  { key: 'sab', nome: 'Sabedoria', abrev: 'SAB', desc: 'Percepção, intuição e força de vontade.' },
  { key: 'car', nome: 'Carisma', abrev: 'CAR', desc: 'Presença, persuasão e força de personalidade.' },
]

// ---------------------------------------------------------------------------
// Perícias (cada uma ligada a um atributo)
// ---------------------------------------------------------------------------
export const SKILLS: { key: SkillKey; nome: string; atributo: AbilityKey }[] = [
  { key: 'acrobacia', nome: 'Acrobacia', atributo: 'des' },
  { key: 'arcanismo', nome: 'Arcanismo', atributo: 'int' },
  { key: 'atletismo', nome: 'Atletismo', atributo: 'for' },
  { key: 'atuacao', nome: 'Atuação', atributo: 'car' },
  { key: 'blefar', nome: 'Enganação', atributo: 'car' },
  { key: 'furtividade', nome: 'Furtividade', atributo: 'des' },
  { key: 'historia', nome: 'História', atributo: 'int' },
  { key: 'intimidacao', nome: 'Intimidação', atributo: 'car' },
  { key: 'intuicao', nome: 'Intuição', atributo: 'sab' },
  { key: 'investigacao', nome: 'Investigação', atributo: 'int' },
  { key: 'lidarComAnimais', nome: 'Adestrar Animais', atributo: 'sab' },
  { key: 'medicina', nome: 'Medicina', atributo: 'sab' },
  { key: 'natureza', nome: 'Natureza', atributo: 'int' },
  { key: 'percepcao', nome: 'Percepção', atributo: 'sab' },
  { key: 'persuasao', nome: 'Persuasão', atributo: 'car' },
  { key: 'prestidigitacao', nome: 'Prestidigitação', atributo: 'des' },
  { key: 'religiao', nome: 'Religião', atributo: 'int' },
  { key: 'sobrevivencia', nome: 'Sobrevivência', atributo: 'sab' },
]

// ---------------------------------------------------------------------------
// Classes (2024) — dado de vida, salvaguardas e atributo de conjuração
// ---------------------------------------------------------------------------
export interface ClassInfo {
  nome: string // nome em português — é a chave usada internamente
  nomeEn: string // nome oficial em inglês, exibido entre parênteses
  dadoDeVida: number
  salvaguardas: AbilityKey[]
  conjuracao: AbilityKey | null
  /** Subclasses já no formato "Português (English)". */
  subclasses: string[]
  resumo: string
}

export const CLASSES: ClassInfo[] = [
  { nome: 'Bárbaro', nomeEn: 'Barbarian', dadoDeVida: 12, salvaguardas: ['for', 'con'], conjuracao: null, subclasses: ['Caminho do Berserker (Path of the Berserker)', 'Caminho do Coração Selvagem (Path of the Wild Heart)', 'Caminho da Árvore do Mundo (Path of the World Tree)', 'Caminho do Zelote (Path of the Zealot)'], resumo: 'Guerreiro feroz movido pela fúria. Muito resistente e forte no corpo a corpo.' },
  { nome: 'Bardo', nomeEn: 'Bard', dadoDeVida: 8, salvaguardas: ['des', 'car'], conjuracao: 'car', subclasses: ['Colégio da Dança (College of Dance)', 'Colégio do Glamour (College of Glamour)', 'Colégio do Saber (College of Lore)', 'Colégio da Bravura (College of Valor)'], resumo: 'Artista mágico versátil, que inspira aliados e domina um pouco de tudo.' },
  { nome: 'Bruxo', nomeEn: 'Warlock', dadoDeVida: 8, salvaguardas: ['sab', 'car'], conjuracao: 'car', subclasses: ['Patrono Arquifada (Archfey Patron)', 'Patrono Celestial (Celestial Patron)', 'Patrono Corruptor (Fiend Patron)', 'Patrono Grande Antigo (Great Old One Patron)'], resumo: 'Conjura poder de um patrono sobrenatural. Poucos espaços de magia, mas recarregam rápido.' },
  { nome: 'Clérigo', nomeEn: 'Cleric', dadoDeVida: 8, salvaguardas: ['sab', 'car'], conjuracao: 'sab', subclasses: ['Domínio da Vida (Life Domain)', 'Domínio da Luz (Light Domain)', 'Domínio da Trapaça (Trickery Domain)', 'Domínio da Guerra (War Domain)'], resumo: 'Canaliza poder divino: cura, protege e destrói inimigos em nome de sua divindade.' },
  { nome: 'Druida', nomeEn: 'Druid', dadoDeVida: 8, salvaguardas: ['int', 'sab'], conjuracao: 'sab', subclasses: ['Círculo da Terra (Circle of the Land)', 'Círculo da Lua (Circle of the Moon)', 'Círculo do Mar (Circle of the Sea)', 'Círculo das Estrelas (Circle of the Stars)'], resumo: 'Guardião da natureza que conjura magias e se transforma em animais.' },
  { nome: 'Feiticeiro', nomeEn: 'Sorcerer', dadoDeVida: 6, salvaguardas: ['con', 'car'], conjuracao: 'car', subclasses: ['Feitiçaria Aberrante (Aberrant Sorcery)', 'Feitiçaria Mecânica (Clockwork Sorcery)', 'Feitiçaria Dracônica (Draconic Sorcery)', 'Feitiçaria Selvagem (Wild Magic Sorcery)'], resumo: 'Magia inata que corre no sangue. Manipula magias com a Metamagia.' },
  { nome: 'Guerreiro', nomeEn: 'Fighter', dadoDeVida: 10, salvaguardas: ['for', 'con'], conjuracao: null, subclasses: ['Mestre de Batalha (Battle Master)', 'Campeão (Champion)', 'Cavaleiro Arcano (Eldritch Knight)', 'Guerreiro Psiônico (Psi Warrior)'], resumo: 'Mestre de armas e armaduras. Muitos ataques e enorme flexibilidade tática.' },
  { nome: 'Ladino', nomeEn: 'Rogue', dadoDeVida: 8, salvaguardas: ['des', 'int'], conjuracao: null, subclasses: ['Trapaceiro Arcano (Arcane Trickster)', 'Assassino (Assassin)', 'Lâmina da Alma (Soulknife)', 'Ladrão (Thief)'], resumo: 'Especialista em furtividade e precisão. O Ataque Furtivo causa dano extra brutal.' },
  { nome: 'Mago', nomeEn: 'Wizard', dadoDeVida: 6, salvaguardas: ['int', 'sab'], conjuracao: 'int', subclasses: ['Abjurador (Abjurer)', 'Adivinho (Diviner)', 'Evocador (Evoker)', 'Ilusionista (Illusionist)'], resumo: 'Estudioso da magia arcana, com o maior repertório de magias do jogo.' },
  { nome: 'Monge', nomeEn: 'Monk', dadoDeVida: 8, salvaguardas: ['for', 'des'], conjuracao: null, subclasses: ['Guerreiro da Mão Aberta (Warrior of the Open Hand)', 'Guerreiro das Sombras (Warrior of Shadow)', 'Guerreiro dos Elementos (Warrior of the Elements)', 'Guerreiro da Misericórdia (Warrior of Mercy)'], resumo: 'Artista marcial que canaliza Ki para golpes rápidos e mobilidade sobre-humana.' },
  { nome: 'Paladino', nomeEn: 'Paladin', dadoDeVida: 10, salvaguardas: ['sab', 'car'], conjuracao: 'car', subclasses: ['Juramento da Devoção (Oath of Devotion)', 'Juramento da Glória (Oath of Glory)', 'Juramento dos Anciões (Oath of the Ancients)', 'Juramento da Vingança (Oath of Vengeance)'], resumo: 'Guerreiro sagrado preso a um juramento. Combina combate, cura e Destruição Divina.' },
  { nome: 'Patrulheiro', nomeEn: 'Ranger', dadoDeVida: 10, salvaguardas: ['for', 'des'], conjuracao: 'sab', subclasses: ['Mestre das Feras (Beast Master)', 'Andarilho Feérico (Fey Wanderer)', 'Perseguidor Sombrio (Gloom Stalker)', 'Caçador (Hunter)'], resumo: 'Caçador da natureza que mistura combate, rastreamento e um pouco de magia.' },
]

/** Rótulo de exibição da classe: "Mago (Wizard)". */
export function rotuloClasse(nome: string): string {
  const c = CLASSES.find((x) => x.nome === nome)
  return c ? `${c.nome} (${c.nomeEn})` : nome
}

// Espécies (2024)
export const ESPECIES: { nome: string; resumo: string }[] = [
  { nome: 'Humano', resumo: 'Versáteis e ambiciosos. Ganham uma perícia e um talento extra logo no nível 1.' },
  { nome: 'Elfo', resumo: 'Graciosos e longevos, com visão no escuro e resistência a encantamento.' },
  { nome: 'Anão', resumo: 'Resistentes e teimosos, com visão no escuro e resistência a veneno.' },
  { nome: 'Halfling', resumo: 'Pequenos e sortudos. Podem rerrolar 1 natural em testes.' },
  { nome: 'Draconato', resumo: 'Descendentes de dragões, com sopro elemental e resistência a dano.' },
  { nome: 'Gnomo', resumo: 'Curiosos e engenhosos, com vantagem em salvaguardas mentais.' },
  { nome: 'Meio-Orc / Orc', resumo: 'Fortes e determinados, resistem a cair inconscientes em combate.' },
  { nome: 'Tiefling', resumo: 'Marcados por herança infernal, com resistência e magias inatas.' },
  { nome: 'Aasimar', resumo: 'Tocados pelos céus, com cura e uma revelação radiante.' },
  { nome: 'Golias', resumo: 'Gigantescos e poderosos, herdam dádivas de ancestrais gigantes.' },
]

// Antecedentes (2024) — cada um dá aumento de atributo, perícias e um talento
export const ANTECEDENTES: { nome: string; resumo: string }[] = [
  { nome: 'Acólito', resumo: 'Serviu em um templo. Perícias: Intuição e Religião.' },
  { nome: 'Artesão', resumo: 'Dominou um ofício. Perícias: Investigação e Persuasão.' },
  { nome: 'Charlatão', resumo: 'Vive de trapaças. Perícias: Enganação e Prestidigitação.' },
  { nome: 'Criminoso', resumo: 'Passado no submundo. Perícias: Furtividade e Prestidigitação.' },
  { nome: 'Artista', resumo: 'Vive de plateias. Perícias: Acrobacia e Atuação.' },
  { nome: 'Camponês', resumo: 'Cresceu no campo. Perícias: Adestrar Animais e Natureza.' },
  { nome: 'Guarda', resumo: 'Protegeu um lugar. Perícias: Atletismo e Percepção.' },
  { nome: 'Guia', resumo: 'Conhece a selva. Perícias: Furtividade e Sobrevivência.' },
  { nome: 'Eremita', resumo: 'Viveu isolado. Perícias: Medicina e Religião.' },
  { nome: 'Mercador', resumo: 'Comerciante viajante. Perícias: Adestrar Animais e Persuasão.' },
  { nome: 'Nobre', resumo: 'Nascido em berço de ouro. Perícias: História e Persuasão.' },
  { nome: 'Sábio', resumo: 'Rato de biblioteca. Perícias: Arcanismo e História.' },
  { nome: 'Marujo', resumo: 'Viveu no mar. Perícias: Acrobacia e Percepção.' },
  { nome: 'Escriba', resumo: 'Trabalhou com textos. Perícias: Investigação e Percepção.' },
  { nome: 'Soldado', resumo: 'Serviu em um exército. Perícias: Atletismo e Intimidação.' },
  { nome: 'Andarilho', resumo: 'Sobreviveu nas ruas. Perícias: Intuição e Prestidigitação.' },
]

export const ALINHAMENTOS = [
  'Leal e Bom', 'Neutro e Bom', 'Caótico e Bom',
  'Leal e Neutro', 'Neutro', 'Caótico e Neutro',
  'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau',
]

// Compra de pontos / arranjo padrão
export const ARRANJO_PADRAO = [15, 14, 13, 12, 10, 8]

// Condições (2024) com explicações curtas para iniciantes.
export const CONDICOES: { nome: string; desc: string }[] = [
  { nome: 'Agarrado', desc: 'Seu deslocamento é 0. Não pode se beneficiar de bônus ao deslocamento.' },
  { nome: 'Amedrontado', desc: 'Desvantagem em testes e ataques enquanto vê a fonte do medo. Não pode se aproximar dela.' },
  { nome: 'Atordoado', desc: 'Incapacitado, não se move e fala com dificuldade. Ataques contra você têm vantagem.' },
  { nome: 'Caído', desc: 'Só pode engatinhar. Desvantagem em ataques. Ataques corpo a corpo contra você têm vantagem; à distância, desvantagem.' },
  { nome: 'Cego', desc: 'Não enxerga e falha em testes que dependem de visão. Seus ataques têm desvantagem; contra você, vantagem.' },
  { nome: 'Enfeitiçado', desc: 'Não pode atacar quem o enfeitiçou. Essa criatura tem vantagem em interações sociais com você.' },
  { nome: 'Envenenado', desc: 'Desvantagem em ataques e testes de atributo.' },
  { nome: 'Impedido', desc: 'Deslocamento 0. Desvantagem em ataques e em salvaguardas de Destreza. Ataques contra você têm vantagem.' },
  { nome: 'Incapacitado', desc: 'Não pode realizar ações, ações bônus nem reações.' },
  { nome: 'Inconsciente', desc: 'Incapacitado, caído e sem consciência. Ataques corpo a corpo contra você são acertos críticos.' },
  { nome: 'Invisível', desc: 'Impossível de ver sem ajuda especial. Seus ataques têm vantagem; contra você, desvantagem.' },
  { nome: 'Paralisado', desc: 'Incapacitado, não se move nem fala. Falha em salvaguardas de FOR e DES. Ataques de perto são críticos.' },
  { nome: 'Petrificado', desc: 'Transformado em pedra. Incapacitado, resistente a dano, imune a veneno e doenças.' },
  { nome: 'Surdo', desc: 'Não ouve e falha em testes que dependem de audição.' },
]

// Perícias concedidas por cada classe (quantidade a escolher + opções).
// Usado pelo assistente de criação para guiar a escolha.
const TODAS_PERICIAS = SKILLS.map((s) => s.key)

export const PERICIAS_POR_CLASSE: Record<string, { quantidade: number; opcoes: SkillKey[] }> = {
  'Bárbaro': { quantidade: 2, opcoes: ['lidarComAnimais', 'atletismo', 'intimidacao', 'natureza', 'percepcao', 'sobrevivencia'] },
  'Bardo': { quantidade: 3, opcoes: TODAS_PERICIAS },
  'Bruxo': { quantidade: 2, opcoes: ['arcanismo', 'blefar', 'historia', 'intimidacao', 'investigacao', 'natureza', 'religiao'] },
  'Clérigo': { quantidade: 2, opcoes: ['historia', 'intuicao', 'medicina', 'persuasao', 'religiao'] },
  'Druida': { quantidade: 2, opcoes: ['arcanismo', 'lidarComAnimais', 'intuicao', 'medicina', 'natureza', 'percepcao', 'religiao', 'sobrevivencia'] },
  'Feiticeiro': { quantidade: 2, opcoes: ['arcanismo', 'blefar', 'intuicao', 'intimidacao', 'persuasao', 'religiao'] },
  'Guerreiro': { quantidade: 2, opcoes: ['acrobacia', 'lidarComAnimais', 'atletismo', 'historia', 'intuicao', 'intimidacao', 'percepcao', 'sobrevivencia'] },
  'Ladino': { quantidade: 4, opcoes: ['acrobacia', 'atletismo', 'blefar', 'intuicao', 'intimidacao', 'investigacao', 'percepcao', 'atuacao', 'persuasao', 'prestidigitacao', 'furtividade'] },
  'Mago': { quantidade: 2, opcoes: ['arcanismo', 'historia', 'intuicao', 'investigacao', 'medicina', 'natureza', 'religiao'] },
  'Monge': { quantidade: 2, opcoes: ['acrobacia', 'atletismo', 'historia', 'intuicao', 'religiao', 'furtividade'] },
  'Paladino': { quantidade: 2, opcoes: ['atletismo', 'intuicao', 'intimidacao', 'medicina', 'persuasao', 'religiao'] },
  'Patrulheiro': { quantidade: 3, opcoes: ['lidarComAnimais', 'atletismo', 'intuicao', 'investigacao', 'natureza', 'percepcao', 'furtividade', 'sobrevivencia'] },
}
