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
  nome: string
  dadoDeVida: number
  salvaguardas: AbilityKey[]
  conjuracao: AbilityKey | null
  subclasses: string[]
  resumo: string
}

export const CLASSES: ClassInfo[] = [
  { nome: 'Bárbaro', dadoDeVida: 12, salvaguardas: ['for', 'con'], conjuracao: null, subclasses: ['Caminho do Berserker', 'Caminho do Coração Selvagem', 'Caminho do Guardião Ancestral', 'Caminho do Andarilho'], resumo: 'Guerreiro feroz movido pela fúria. Muito resistente e forte no corpo a corpo.' },
  { nome: 'Bardo', dadoDeVida: 8, salvaguardas: ['des', 'car'], conjuracao: 'car', subclasses: ['Colégio da Dança', 'Colégio do Saber', 'Colégio da Bravura', 'Colégio do Glamour'], resumo: 'Artista mágico versátil, que inspira aliados e domina um pouco de tudo.' },
  { nome: 'Bruxo', dadoDeVida: 8, salvaguardas: ['sab', 'car'], conjuracao: 'car', subclasses: ['Patrono Arquifada', 'Patrono Corruptor', 'Patrono Celestial', 'Patrono Grande Antigo'], resumo: 'Conjura poder de um patrono sobrenatural. Poucos espaços de magia, mas recarregam rápido.' },
  { nome: 'Clérigo', dadoDeVida: 8, salvaguardas: ['sab', 'car'], conjuracao: 'sab', subclasses: ['Domínio da Vida', 'Domínio da Luz', 'Domínio da Confiança', 'Domínio da Guerra'], resumo: 'Canaliza poder divino: cura, protege e destrói inimigos em nome de sua divindade.' },
  { nome: 'Druida', dadoDeVida: 8, salvaguardas: ['int', 'sab'], conjuracao: 'sab', subclasses: ['Círculo da Terra', 'Círculo da Lua', 'Círculo do Mar', 'Círculo das Estrelas'], resumo: 'Guardião da natureza que conjura magias e se transforma em animais.' },
  { nome: 'Feiticeiro', dadoDeVida: 6, salvaguardas: ['con', 'car'], conjuracao: 'car', subclasses: ['Feitiçaria Aberrante', 'Feitiçaria Clockwork', 'Linhagem Dracônica', 'Alma Selvagem'], resumo: 'Magia inata que corre no sangue. Manipula magias com a Metamagia.' },
  { nome: 'Guerreiro', dadoDeVida: 10, salvaguardas: ['for', 'con'], conjuracao: null, subclasses: ['Campeão', 'Mestre de Batalha', 'Cavaleiro Élfico', 'Cavaleiro Arcano'], resumo: 'Mestre de armas e armaduras. Muitos ataques e enorme flexibilidade tática.' },
  { nome: 'Ladino', dadoDeVida: 8, salvaguardas: ['des', 'int'], conjuracao: null, subclasses: ['Ladrão', 'Assassino', 'Trapaceiro Arcano', 'Alma de Aço'], resumo: 'Especialista em furtividade e precisão. O Ataque Furtivo causa dano extra brutal.' },
  { nome: 'Mago', dadoDeVida: 6, salvaguardas: ['int', 'sab'], conjuracao: 'int', subclasses: ['Abjuração', 'Evocação', 'Ilusão', 'Adivinhação'], resumo: 'Estudioso da magia arcana, com o maior repertório de magias do jogo.' },
  { nome: 'Monge', dadoDeVida: 8, salvaguardas: ['for', 'des'], conjuracao: null, subclasses: ['Mão Aberta', 'Sombra', 'Elementos', 'Misericórdia'], resumo: 'Artista marcial que canaliza Ki para golpes rápidos e mobilidade sobre-humana.' },
  { nome: 'Paladino', dadoDeVida: 10, salvaguardas: ['sab', 'car'], conjuracao: 'car', subclasses: ['Juramento da Devoção', 'Juramento dos Anciões', 'Juramento da Vingança', 'Juramento da Glória'], resumo: 'Guerreiro sagrado preso a um juramento. Combina combate, cura e Destruição Divina.' },
  { nome: 'Patrulheiro', dadoDeVida: 10, salvaguardas: ['for', 'des'], conjuracao: 'sab', subclasses: ['Caçador', 'Andarilho Feérico', 'Mestre das Feras', 'Perseguidor Sombrio'], resumo: 'Caçador da natureza que mistura combate, rastreamento e um pouco de magia.' },
  { nome: 'Sacerdote', dadoDeVida: 8, salvaguardas: ['sab', 'car'], conjuracao: 'sab', subclasses: [], resumo: 'Variante regional de Clérigo — use Clérigo se estiver em dúvida.' },
]

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
  'Sacerdote': { quantidade: 2, opcoes: ['historia', 'intuicao', 'medicina', 'persuasao', 'religiao'] },
}
