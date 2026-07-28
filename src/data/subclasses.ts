// Traços de subclasse — D&D 5.5e (2024).
//
// Mesma forma dos traços de classe: dado, não código. A chave é o nome exato da
// subclasse como aparece em `CLASSES` (`rules.ts`), incluindo o nome em inglês
// entre parênteses — é o que a ficha guarda em `char.subclasse`.

import type { TracoClasse } from './features'

const T = (nivel: number, nome: string, resumo: string, efeito?: TracoClasse['efeito']): TracoClasse => ({
  nivel,
  nome,
  resumo,
  efeito,
})

/**
 * Manobras do Mestre de Batalha.
 *
 * Estão aqui, e não como texto solto, porque foram o exemplo do relato: são
 * escolhas que a ficha precisava oferecer e não oferecia — "pra minha subclasse
 * tive que fazer manualmente".
 */
export const MANOBRAS: { nome: string; resumo: string }[] = [
  { nome: 'Aparar', resumo: 'Reação: reduz o dano de um golpe corpo a corpo em você.' },
  { nome: 'Ataque Ameaçador', resumo: 'O alvo faz salvaguarda de Sabedoria ou fica Amedrontado.' },
  { nome: 'Ataque Amplo', resumo: 'Aplica dano a uma segunda criatura ao seu alcance.' },
  { nome: 'Ataque Avançado', resumo: 'Aumenta em 1,5 m o alcance do ataque corpo a corpo.' },
  { nome: 'Ataque de Manobra', resumo: 'Um aliado se move sem provocar ataque de oportunidade.' },
  { nome: 'Ataque Desarmante', resumo: 'O alvo faz salvaguarda de Força ou derruba o que segura.' },
  { nome: 'Ataque Empurrão', resumo: 'Empurra o alvo até 4,5 m para longe.' },
  { nome: 'Ataque Enganador', resumo: 'Ação bônus: vantagem no próximo ataque contra a criatura.' },
  { nome: 'Ataque Preciso', resumo: 'Soma o dado de superioridade à jogada de ataque.' },
  { nome: 'Ataque Provocador', resumo: 'O alvo tem desvantagem para atacar quem não seja você.' },
  { nome: 'Ataque Rasteira', resumo: 'O alvo faz salvaguarda de Força ou cai Caído.' },
  { nome: 'Avaliação Tática', resumo: 'Soma o dado a um teste de História, Intuição ou Investigação.' },
  { nome: 'Emboscada', resumo: 'Soma o dado à iniciativa ou a um teste de Furtividade.' },
  {
    nome: 'Golpe Comandado',
    resumo:
      'Abre mão de um dos seus ataques e gasta a ação bônus; um aliado usa a reação dele para atacar, somando o dado ao dano.',
  },
  { nome: 'Isca e Troca', resumo: 'Troca de lugar com um aliado adjacente e dá CA extra a um dos dois.' },
  { nome: 'Manobra de Agarrão', resumo: 'Soma o dado ao teste e tenta Agarrar o alvo.' },
  { nome: 'Passos Evasivos', resumo: 'Soma o dado à CA enquanto se move.' },
  { nome: 'Presença Imponente', resumo: 'Soma o dado a um teste de Intimidação, Atuação ou Persuasão.' },
  { nome: 'Resposta', resumo: 'Reação: ataca quem errou um golpe corpo a corpo em você.' },
  { nome: 'Reunir', resumo: 'Ação bônus: dá pontos de vida temporários a um aliado.' },
]

export const TRACOS_DE_SUBCLASSE: Record<string, TracoClasse[]> = {
  // --- Guerreiro -----------------------------------------------------------
  'Mestre de Batalha (Battle Master)': [
    T(3, 'Superioridade em Combate', 'Quatro dados de superioridade d8, recuperados em descanso curto.'),
    T(3, 'Manobras', 'Aprende 3 manobras.', { tipo: 'escolha', oque: 'manobra', quantidade: 3 }),
    T(3, 'Estudante da Guerra', 'Proficiência em uma ferramenta de artesão e uma perícia.'),
    T(7, 'Conheça o Inimigo', 'Aprende mais 2 manobras e ganha um dado de superioridade.', {
      tipo: 'escolha',
      oque: 'manobra',
      quantidade: 2,
    }),
    T(10, 'Superioridade Aprimorada', 'Os dados de superioridade viram d10. Mais 2 manobras.', {
      tipo: 'escolha',
      oque: 'manobra',
      quantidade: 2,
    }),
    T(15, 'Implacável', 'Sempre tem ao menos um dado de superioridade ao rolar iniciativa. Mais 2 manobras.', {
      tipo: 'escolha',
      oque: 'manobra',
      quantidade: 2,
    }),
    T(18, 'Superioridade Suprema', 'Os dados de superioridade viram d12.'),
  ],
  'Campeão (Champion)': [
    T(3, 'Crítico Aprimorado', 'Acerto crítico com 19 ou 20.'),
    T(3, 'Atleta Notável', 'Soma metade do PB a testes de Força, Destreza e Constituição.'),
    T(7, 'Estilo de Luta Adicional', 'Escolha um segundo estilo de luta.', {
      tipo: 'escolha',
      oque: 'estiloDeLuta',
      quantidade: 1,
    }),
    T(10, 'Guerreiro Heroico', 'Ganha Inspiração Heroica no começo de cada turno em que não a tenha.'),
    T(15, 'Crítico Superior', 'Acerto crítico com 18, 19 ou 20.'),
    T(18, 'Sobrevivente', 'Recupera vida no início de cada turno enquanto estiver ferido.'),
  ],
  'Cavaleiro Arcano (Eldritch Knight)': [
    T(3, 'Conjuração', 'Aprende magias de Mago, usando Inteligência.'),
    T(3, 'Vínculo de Guerra', 'Vincula-se a uma arma e a invoca à mão.'),
    T(7, 'Magia de Guerra', 'Conjura um truque e ataca com uma arma no mesmo turno.'),
    T(10, 'Golpe Místico', 'Quem você acerta tem desvantagem na próxima salvaguarda contra sua magia.'),
    T(15, 'Investida Arcana', 'Teleporta-se até 9 m ao usar Surto de Ação.'),
    T(18, 'Magia de Guerra Aprimorada', 'Conjura uma magia de nível 1 ou 2 e ataca no mesmo turno.'),
  ],
  'Guerreiro Psiônico (Psi Warrior)': [
    T(3, 'Poder Psiônico', 'Dados de energia psiônica para escudo, golpe e telecinese.'),
    T(7, 'Adepto Telecinético', 'Empurra com a mente e teleporta a si e a um aliado.'),
    T(10, 'Mente Guardada', 'Resistência a dano psíquico e sai de amedrontado ou enfeitiçado.'),
    T(15, 'Baluarte de Força', 'Dá cobertura mágica a você e aliados por perto.'),
    T(18, 'Mestre Telecinético', 'Mantém Mão Telecinética e ganha ataque extra com ela.'),
  ],

  // --- Bárbaro -------------------------------------------------------------
  'Caminho do Berserker (Path of the Berserker)': [
    T(3, 'Fúria Insana', 'Ataque bônus ao entrar em fúria.'),
    T(6, 'Presença Aterradora', 'Amedronta inimigos ao seu redor durante a fúria.'),
    T(10, 'Retaliação', 'Reação para atacar quem te machucou.'),
    T(14, 'Fúria Inabalável', 'A fúria continua mesmo quando você deveria cair.'),
  ],
  'Caminho do Coração Selvagem (Path of the Wild Heart)': [
    T(3, 'Falar com Feras', 'Comunica-se com animais e ganha benefícios de espírito animal.'),
    T(6, 'Aspecto da Natureza', 'Ganha um traço permanente de besta.'),
    T(10, 'Andarilho Espiritual', 'Conjura Comunhão com a Natureza como ritual.'),
    T(14, 'Ataque Ampliado', 'Os espíritos afetam mais aliados.'),
  ],
  'Caminho da Árvore do Mundo (Path of the World Tree)': [
    T(3, 'Vida da Árvore', 'Ganha vida temporária ao entrar em fúria.'),
    T(6, 'Ramos da Árvore', 'Puxa criaturas com raízes espectrais.'),
    T(10, 'Batalha da Árvore', 'Dá vida temporária a aliados.'),
    T(14, 'Salto entre Mundos', 'Teleporta a si e a aliados entre planos.'),
  ],
  'Caminho do Zelote (Path of the Zealot)': [
    T(3, 'Fúria Divina', 'Dano extra necrótico ou radiante durante a fúria.'),
    T(3, 'Guerreiro do Além', 'Ressuscitar você custa menos e não precisa de componente caro.'),
    T(6, 'Fervor Zeloso', 'Vantagem em iniciativa.'),
    T(10, 'Presença Zelota', 'Grito que impõe desvantagem a inimigos.'),
    T(14, 'Fúria do Além', 'Continua lutando por um turno mesmo com 0 pontos de vida.'),
  ],

  // --- Ladino --------------------------------------------------------------
  'Ladrão (Thief)': [
    T(3, 'Mãos Rápidas', 'Usa a Ação Ardilosa para manipular objetos e ferramentas.'),
    T(3, 'Trabalho em Altura', 'Escala mais rápido e salta mais longe.'),
    T(9, 'Supremo Furtivo', 'Vantagem em furtividade quando se move devagar.'),
    T(13, 'Usar Dispositivo Mágico', 'Usa itens mágicos de qualquer classe.'),
    T(17, 'Ladrão Reflexo', 'Um turno extra na primeira rodada de combate.'),
  ],
  'Assassino (Assassin)': [
    T(3, 'Assassinar', 'Vantagem contra quem ainda não agiu e dano extra na surpresa.'),
    T(3, 'Kit de Disfarces', 'Proficiência com kits de disfarce e envenenador.'),
    T(9, 'Infiltrador', 'Cria identidades falsas convincentes.'),
    T(13, 'Impostor', 'Imita fala e escrita de outra pessoa.'),
    T(17, 'Golpe Mortal', 'Dobra o dano contra alvos que não agiram.'),
  ],
  'Trapaceiro Arcano (Arcane Trickster)': [
    T(3, 'Conjuração', 'Aprende magias de Mago, usando Inteligência.'),
    T(3, 'Mão Ladina', 'Usa Mão Mágica de forma invisível para roubar e ativar coisas.'),
    T(9, 'Emboscada Mágica', 'Desvantagem nas salvaguardas contra suas magias quando escondido.'),
    T(13, 'Trapaceiro Versátil', 'Distrai um alvo com a Mão Mágica para ganhar vantagem.'),
    T(17, 'Ladrão de Feitiços', 'Rouba o conhecimento de uma magia de um conjurador.'),
  ],
  'Lâmina da Alma (Soulknife)': [
    T(3, 'Lâminas Psíquicas', 'Cria lâminas de energia mental para atacar.'),
    T(3, 'Poder Psiônico', 'Dados psiônicos para reforçar testes e teleporte.'),
    T(9, 'Véu Psíquico', 'Fica invisível por um tempo.'),
    T(13, 'Comunicação Rápida', 'Fala mente a mente a grande distância.'),
    T(17, 'Lâminas Rasgadoras', 'Dano extra e crítico mais fácil com as lâminas.'),
  ],
}

/** Traços de uma subclasse (lista vazia quando ainda não catalogada). */
export function tracosDaSubclasse(subclasse: string): TracoClasse[] {
  return TRACOS_DE_SUBCLASSE[subclasse] ?? []
}

/** A subclasse já está no catálogo? A ficha avisa quando não está. */
export function subclasseCatalogada(subclasse: string): boolean {
  return subclasse in TRACOS_DE_SUBCLASSE
}
