// Talentos (feats) — D&D 5.5e (2024).
// Seleção dos mais usados, com explicações curtas.

export interface Talento {
  nome: string
  categoria: 'Origem' | 'Geral' | 'Estilo de Luta'
  requisito?: string
  resumo: string
}

const T = (nome: string, categoria: Talento['categoria'], resumo: string, requisito?: string): Talento =>
  ({ nome, categoria, resumo, requisito })

export const TALENTOS: Talento[] = [
  // --- Talentos de origem (nível 1, vêm do antecedente) --------------------
  T('Alerta', 'Origem', 'Some seu bônus de proficiência à iniciativa e pode trocar de lugar na ordem com um aliado.'),
  T('Artesão', 'Origem', 'Proficiência com ferramentas, desconto em compras e capacidade de fabricar itens rápido.'),
  T('Curandeiro', 'Origem', 'Usa kit de medicina para estabilizar e curar aliados sem gastar magia.'),
  T('Iniciado em Magia', 'Origem', 'Aprende dois truques e uma magia de 1º nível de uma classe à sua escolha.'),
  T('Lutador de Taverna', 'Origem', 'Ataques desarmados causam 1d4, você empurra ou agarra de graça ao acertar.'),
  T('Músico', 'Origem', 'Toca instrumentos e inspira aliados antes de uma jornada, dando dados de bônus.'),
  T('Robusto', 'Origem', 'Seus pontos de vida máximos aumentam em 2 por nível de personagem.'),
  T('Sortudo', 'Origem', 'Ganha pontos de sorte para transformar falhas em acertos algumas vezes por dia.'),
  T('Talentoso', 'Origem', 'Ganha proficiência em três perícias ou ferramentas à sua escolha.'),
  T('Combatente Selvagem', 'Origem', 'Uma vez por turno, rerrola os dados de dano de uma arma e usa o melhor resultado.'),

  // --- Talentos gerais (nível 4+) ------------------------------------------
  T('Aumento de Atributo', 'Geral', '+2 em um atributo, ou +1 em dois atributos diferentes (máximo 20).'),
  T('Atacante Poderoso', 'Geral', 'Com armas pesadas, troca precisão por muito dano extra.', 'Força 13+'),
  T('Atirador de Elite', 'Geral', 'Ignora cobertura, atira de perto sem desvantagem e troca precisão por dano.', 'Destreza 13+'),
  T('Mestre em Escudos', 'Geral', 'Usa o escudo para empurrar e ganha vantagem em salvaguardas de Destreza.', 'Força 13+'),
  T('Sentinela', 'Geral', 'Quem você acerta com ataque de oportunidade tem o deslocamento zerado.'),
  T('Combatente com Duas Armas', 'Geral', '+1 de CA empunhando duas armas e mais liberdade para sacá-las.'),
  T('Conjurador de Guerra', 'Geral', 'Vantagem para manter concentração e conjura magias como ataque de oportunidade.', 'Conjurar magias'),
  T('Perito em Perícia', 'Geral', 'Ganha uma proficiência nova e expertise (bônus dobrado) em uma perícia.'),
  T('Observador', 'Geral', 'Suas percepções passivas melhoram muito e você lê lábios.'),
  T('Resistente', 'Geral', 'Ganha proficiência em uma salvaguarda à sua escolha.'),
  T('Duro na Queda', 'Geral', 'Recupera mais vida com dados de vida e é difícil de derrubar.'),
  T('Mestre de Armas Longas', 'Geral', 'Ataques extras com o cabo da arma e reação contra quem se aproxima.'),
  T('Duelista Defensivo', 'Geral', 'Com uma arma de acuidade, aumenta sua CA como reação para evitar um acerto.', 'Destreza 13+'),
  T('Tocado pelas Fadas', 'Geral', '+1 em um atributo mental e aprende Passo Nebuloso e uma magia de encantamento.'),
  T('Tocado pelas Sombras', 'Geral', '+1 em um atributo mental e aprende Invisibilidade e uma magia de ilusão.'),
  T('Assassino de Magos', 'Geral', 'Atrapalha conjuradores: desvantagem para eles manterem concentração.'),
  T('Chef', 'Geral', 'Cozinha refeições que dão pontos de vida temporários ao grupo.'),
  T('Líder Inspirador', 'Geral', 'Discurso de 10 minutos dá pontos de vida temporários a todo o grupo.', 'Carisma 13+'),
  T('Adepto Elemental', 'Geral', 'Suas magias de um elemento ignoram resistência e causam mais dano.', 'Conjurar magias'),
  T('Conjurador Ritual', 'Geral', 'Aprende e conjura magias com a marca de ritual sem gastar espaços.'),
]

export const CATEGORIAS_TALENTO: Talento['categoria'][] = ['Origem', 'Geral', 'Estilo de Luta']

export function acharTalento(nome: string): Talento | undefined {
  return TALENTOS.find((t) => t.nome === nome)
}
