// GERADO por scripts/srd/areas.mjs — não edite à mão.
//
// A área de efeito de cada magia do SRD que tem uma, em QUADRADOS de grade.
// Vinte pés são quatro quadrados: o número já nasce inteiro, e a tela nunca
// precisa dividir por 1,5 para saber quantas casas pintar.
//
// SRD 5.2.1, Creative Commons Attribution 4.0.

import type { TipoDeGabarito } from '../../lib/gabaritos'

export interface AreaDeMagia {
  /** O nome em português — é por ele que a mesa procura. */
  nome: string
  /** O nome oficial em inglês, para conferir no livro. */
  original: string
  /** O que desenhar no tabuleiro. */
  tipo: TipoDeGabarito
  /** A palavra do livro: Cilindro e Emanação viram círculo visto de cima. */
  forma: string
  /** Raio da esfera, comprimento do cone e da linha, lado do cubo. */
  quadrados: number
  /** Largura da linha. Ausente = 1 quadrado, que é o padrão do livro. */
  largura?: number
}

export const AREAS_SRD: AreaDeMagia[] = [
  { nome: "Acalmar Emoções", original: "Calm Emotions", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Alarme", original: "Alarm", tipo: 'cubo', forma: 'Cubo', quadrados: 4 },
  { nome: "Aura de Vida", original: "Aura of Life", tipo: 'esfera', forma: 'Emanação', quadrados: 6 },
  { nome: "Aura Sagrada", original: "Holy Aura", tipo: 'esfera', forma: 'Emanação', quadrados: 6 },
  { nome: "Banquete dos Heróis", original: "Heroes’ Feast", tipo: 'cubo', forma: 'Cubo', quadrados: 2 },
  { nome: "Bola de Fogo", original: "Fireball", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Bola de Fogo Retardada", original: "Delayed Blast Fireball", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Cabana Minúscula", original: "Tiny Hut", tipo: 'esfera', forma: 'Emanação', quadrados: 2 },
  { nome: "Campo Antimagia", original: "Antimagic Field", tipo: 'esfera', forma: 'Emanação', quadrados: 2 },
  { nome: "Casca Antivida", original: "Antilife Shell", tipo: 'esfera', forma: 'Emanação', quadrados: 2 },
  { nome: "Círculo da Morte", original: "Circle of Death", tipo: 'esfera', forma: 'Esfera', quadrados: 12 },
  { nome: "Círculo Mágico", original: "Magic Circle", tipo: 'esfera', forma: 'Cilindro', quadrados: 2 },
  { nome: "Cone de Frio", original: "Cone of Cold", tipo: 'cone', forma: 'Cone', quadrados: 12 },
  { nome: "Confusão", original: "Confusion", tipo: 'esfera', forma: 'Esfera', quadrados: 2 },
  { nome: "Convocar Dragão", original: "Summon Dragon", tipo: 'cone', forma: 'Cone', quadrados: 6 },
  { nome: "Crescer Espinhos", original: "Spike Growth", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Crescimento Vegetal", original: "Plant Growth", tipo: 'esfera', forma: 'Esfera', quadrados: 20 },
  { nome: "Criação", original: "Creation", tipo: 'cubo', forma: 'Cubo', quadrados: 1 },
  { nome: "Criar ou Destruir Água", original: "Create or Destroy Water", tipo: 'cubo', forma: 'Cubo', quadrados: 6 },
  { nome: "Curar Ferimentos em Massa", original: "Mass Cure Wounds", tipo: 'esfera', forma: 'Esfera', quadrados: 6 },
  { nome: "Desintegrar", original: "Disintegrate", tipo: 'cubo', forma: 'Cubo', quadrados: 2 },
  { nome: "Despedaçar", original: "Shatter", tipo: 'esfera', forma: 'Esfera', quadrados: 2 },
  { nome: "Druidismo", original: "Druidcraft", tipo: 'cubo', forma: 'Cubo', quadrados: 1 },
  { nome: "Elementalismo", original: "Elementalism", tipo: 'cubo', forma: 'Cubo', quadrados: 1 },
  { nome: "Enredar", original: "Entangle", tipo: 'cubo', forma: 'Quadrado', quadrados: 4 },
  { nome: "Escuridão", original: "Darkness", tipo: 'esfera', forma: 'Esfera', quadrados: 3 },
  { nome: "Esfera Congelante", original: "Freezing Sphere", tipo: 'esfera', forma: 'Esfera', quadrados: 12 },
  { nome: "Esfera Vitriólica", original: "Vitriolic Sphere", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Estranheza", original: "Weird", tipo: 'esfera', forma: 'Esfera', quadrados: 6 },
  { nome: "Explosão Solar", original: "Sunburst", tipo: 'esfera', forma: 'Esfera', quadrados: 12 },
  { nome: "Fabricar", original: "Fabricate", tipo: 'cubo', forma: 'Cubo', quadrados: 2 },
  { nome: "Falar com Plantas", original: "Speak with Plants", tipo: 'esfera', forma: 'Emanação', quadrados: 6 },
  { nome: "Fogo das Fadas", original: "Faerie Fire", tipo: 'cubo', forma: 'Cubo', quadrados: 4 },
  { nome: "Força Fantasmagórica", original: "Phantasmal Force", tipo: 'cubo', forma: 'Cubo', quadrados: 2 },
  { nome: "Glifo de Proteção", original: "Glyph of Warding", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Golpe Flamejante", original: "Flame Strike", tipo: 'esfera', forma: 'Cilindro', quadrados: 2 },
  { nome: "Guardas e Proteções", original: "Guards and Wards", tipo: 'cubo', forma: 'Quadrado', quadrados: 10 },
  { nome: "Guardiões Espirituais", original: "Spirit Guardians", tipo: 'esfera', forma: 'Emanação', quadrados: 3 },
  { nome: "Ilusão Menor", original: "Minor Illusion", tipo: 'cubo', forma: 'Cubo', quadrados: 1 },
  { nome: "Ilusão Programada", original: "Programmed Illusion", tipo: 'cubo', forma: 'Cubo', quadrados: 6 },
  { nome: "Imagem Maior", original: "Major Image", tipo: 'cubo', forma: 'Cubo', quadrados: 4 },
  { nome: "Imagem Silenciosa", original: "Silent Image", tipo: 'cubo', forma: 'Cubo', quadrados: 3 },
  { nome: "Invocar Celestial", original: "Conjure Celestial", tipo: 'esfera', forma: 'Cilindro', quadrados: 2 },
  { nome: "Invocar Elementais Menores", original: "Conjure Minor Elementals", tipo: 'esfera', forma: 'Emanação', quadrados: 3 },
  { nome: "Invocar Seres da Floresta", original: "Conjure Woodland Beings", tipo: 'esfera', forma: 'Emanação', quadrados: 2 },
  { nome: "Jato de Cores", original: "Color Spray", tipo: 'cone', forma: 'Cone', quadrados: 3 },
  { nome: "Jato Prismático", original: "Prismatic Spray", tipo: 'cone', forma: 'Cone', quadrados: 12 },
  { nome: "Lentidão", original: "Slow", tipo: 'cubo', forma: 'Cubo', quadrados: 8 },
  { nome: "Luz do Dia", original: "Daylight", tipo: 'esfera', forma: 'Esfera', quadrados: 12 },
  { nome: "Mansão Magnífica", original: "Magnificent Mansion", tipo: 'cubo', forma: 'Cubo', quadrados: 2 },
  { nome: "Mãos Flamejantes", original: "Burning Hands", tipo: 'cone', forma: 'Cone', quadrados: 3 },
  { nome: "Medo", original: "Fear", tipo: 'cone', forma: 'Cone', quadrados: 6 },
  { nome: "Mover Terra", original: "Move Earth", tipo: 'cubo', forma: 'Quadrado', quadrados: 8 },
  { nome: "Muralha de Gelo", original: "Wall of Ice", tipo: 'cubo', forma: 'Quadrado', quadrados: 2 },
  { nome: "Nuvem de Névoa", original: "Fog Cloud", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Nuvem Fétida", original: "Stinking Cloud", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Nuvem Incendiária", original: "Incendiary Cloud", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Nuvem Mortal", original: "Cloudkill", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Onda Trovejante", original: "Thunderwave", tipo: 'cubo', forma: 'Cubo', quadrados: 3 },
  { nome: "Padrão Hipnótico", original: "Hypnotic Pattern", tipo: 'cubo', forma: 'Cubo', quadrados: 6 },
  { nome: "Passos sem Rastro", original: "Pass without Trace", tipo: 'esfera', forma: 'Emanação', quadrados: 6 },
  { nome: "Praga de Insetos", original: "Insect Plague", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Purificar Comida e Bebida", original: "Purify Food and Drink", tipo: 'esfera', forma: 'Esfera', quadrados: 1 },
  { nome: "Raio Lunar", original: "Moonbeam", tipo: 'esfera', forma: 'Cilindro', quadrados: 1 },
  { nome: "Raio Solar", original: "Sunbeam", tipo: 'linha', forma: 'Linha', quadrados: 12, largura: 1 },
  { nome: "Rajada de Vento", original: "Gust of Wind", tipo: 'linha', forma: 'Linha', quadrados: 12, largura: 2 },
  { nome: "Relâmpago", original: "Lightning Bolt", tipo: 'linha', forma: 'Linha', quadrados: 20, largura: 1 },
  { nome: "Respingo Ácido", original: "Acid Splash", tipo: 'esfera', forma: 'Esfera', quadrados: 1 },
  { nome: "Silêncio", original: "Silence", tipo: 'esfera', forma: 'Esfera', quadrados: 4 },
  { nome: "Símbolo", original: "Symbol", tipo: 'esfera', forma: 'Esfera', quadrados: 12 },
  { nome: "Sono", original: "Sleep", tipo: 'esfera', forma: 'Esfera', quadrados: 1 },
  { nome: "Sopro de Dragão", original: "Dragon’s Breath", tipo: 'cone', forma: 'Cone', quadrados: 3 },
  { nome: "Teia", original: "Web", tipo: 'cubo', forma: 'Cubo', quadrados: 4 },
  { nome: "Tempestade de Fogo", original: "Fire Storm", tipo: 'cubo', forma: 'Cubo', quadrados: 2 },
  { nome: "Tempestade de Gelo", original: "Ice Storm", tipo: 'esfera', forma: 'Cilindro', quadrados: 4 },
  { nome: "Tempestade de Granizo", original: "Sleet Storm", tipo: 'esfera', forma: 'Cilindro', quadrados: 4 },
  { nome: "Tempestade de Meteoros", original: "Meteor Swarm", tipo: 'esfera', forma: 'Esfera', quadrados: 8 },
  { nome: "Tentáculos Negros", original: "Black Tentacles", tipo: 'cubo', forma: 'Quadrado', quadrados: 4 },
  { nome: "Terreno Alucinatório", original: "Hallucinatory Terrain", tipo: 'cubo', forma: 'Cubo', quadrados: 30 },
  { nome: "Zona da Verdade", original: "Zone of Truth", tipo: 'esfera', forma: 'Esfera', quadrados: 3 },
]
