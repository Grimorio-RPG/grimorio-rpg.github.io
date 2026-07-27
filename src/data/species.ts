// Traços de espécie — D&D 5.5e (2024).
//
// Espécie não tem progressão como classe, mas vários traços ganham degraus por
// nível de personagem (o sopro do Draconato, a Marca Ancestral do Aasimar). O
// campo `nivel` é o nível do personagem, então a mesma peneira dos traços de
// classe funciona aqui sem código novo.

import type { TracoClasse } from './features'

const T = (nivel: number, nome: string, resumo: string): TracoClasse => ({ nivel, nome, resumo })

export const TRACOS_DE_ESPECIE: Record<string, TracoClasse[]> = {
  Humano: [
    T(1, 'Habilidoso', 'Proficiência em uma perícia à sua escolha.'),
    T(1, 'Talento de Origem', 'Um talento de origem extra no nível 1.'),
    T(1, 'Versátil', 'Ganha Inspiração Heroica ao terminar um descanso longo.'),
  ],
  Elfo: [
    T(1, 'Visão no Escuro', 'Enxerga a 18 m no escuro, em tons de cinza.'),
    T(1, 'Ancestral Feérico', 'Vantagem contra ficar Enfeitiçado; magia não te faz dormir.'),
    T(1, 'Transe', 'Descansa em 4 horas de meditação, não 8.'),
    T(1, 'Linhagem Élfica', 'Truque e magias conforme a linhagem escolhida.'),
    T(3, 'Magia da Linhagem', 'Ganha a magia de nível 1 da sua linhagem, uma vez por descanso longo.'),
    T(5, 'Magia da Linhagem', 'Ganha a segunda magia da sua linhagem.'),
  ],
  Anão: [
    T(1, 'Visão no Escuro', 'Enxerga a 36 m no escuro.'),
    T(1, 'Resiliência Anã', 'Resistência a dano de veneno e vantagem contra ser Envenenado.'),
    T(1, 'Robustez Anã', 'Seu máximo de pontos de vida aumenta em 1 por nível.'),
    T(1, 'Sentido de Pedra', 'Percebe vibrações pela pedra a 18 m.'),
  ],
  Halfling: [
    T(1, 'Sortudo', 'Rolou 1 natural em ataque, teste ou salvaguarda? Role de novo.'),
    T(1, 'Bravura', 'Vantagem contra ficar Amedrontado.'),
    T(1, 'Agilidade Halfling', 'Move-se pelo espaço de criaturas maiores que você.'),
    T(1, 'Furtividade Natural', 'Esconde-se atrás de criaturas maiores que você.'),
  ],
  Draconato: [
    T(1, 'Ancestral Dracônico', 'Escolhe um tipo de dragão, que define o seu dano.'),
    T(1, 'Sopro', 'Substitui um ataque por um sopro de 1d10 do seu tipo de dano.'),
    T(1, 'Resistência do Dragão', 'Resistência ao dano do seu ancestral.'),
    T(5, 'Sopro Ampliado', 'O sopro passa a causar 2d10.'),
    T(5, 'Voo Dracônico', 'Ganha asas por 10 minutos, uma vez por descanso longo.'),
    T(11, 'Sopro Ampliado', 'O sopro passa a causar 3d10.'),
    T(17, 'Sopro Ampliado', 'O sopro passa a causar 4d10.'),
  ],
  Gnomo: [
    T(1, 'Visão no Escuro', 'Enxerga a 18 m no escuro.'),
    T(1, 'Astúcia Gnômica', 'Vantagem em salvaguardas de Inteligência, Sabedoria e Carisma.'),
    T(1, 'Linhagem Gnômica', 'Truques e utilidades conforme a linhagem escolhida.'),
  ],
  'Meio-Orc / Orc': [
    T(1, 'Visão no Escuro', 'Enxerga a 36 m no escuro.'),
    T(1, 'Investida Implacável', 'Ganha vida temporária e desloca-se mais ao usar a ação de Corrida.'),
    T(1, 'Resistência Incansável', 'Ao chegar a 0 pontos de vida, volta com 1, uma vez por descanso longo.'),
  ],
  Tiefling: [
    T(1, 'Visão no Escuro', 'Enxerga a 18 m no escuro.'),
    T(1, 'Legado Infernal', 'Escolhe um legado, que define resistência e magias.'),
    T(1, 'Truque do Legado', 'Aprende um truque do seu legado.'),
    T(3, 'Magia do Legado', 'Ganha a magia de nível 1 do seu legado.'),
    T(5, 'Magia do Legado', 'Ganha a magia de nível 2 do seu legado.'),
  ],
  Aasimar: [
    T(1, 'Visão no Escuro', 'Enxerga a 18 m no escuro.'),
    T(1, 'Mãos Curandeiras', 'Cura d4 por nível com um toque, uma vez por descanso longo.'),
    T(1, 'Portador de Luz', 'Conhece o truque Luz.'),
    T(1, 'Resistência Celestial', 'Resistência a dano necrótico e radiante.'),
    T(3, 'Revelação Celestial', 'Transforma-se por 1 minuto, ganhando voo, medo ou dano extra.'),
  ],
  Golias: [
    T(1, 'Ancestral Gigante', 'Escolhe uma dádiva de gigante, usável pelo bônus de proficiência.'),
    T(1, 'Constituição Poderosa', 'Conta como uma categoria de tamanho acima para carregar e empurrar.'),
    T(1, 'Passos Largos', 'Deslocamento de 10,5 m.'),
  ],
}

export function tracosDaEspecie(especie: string): TracoClasse[] {
  return TRACOS_DE_ESPECIE[especie] ?? []
}

/**
 * Antecedentes (2024) dão aumento de atributo, duas perícias, uma ferramenta e
 * um talento de origem. O talento varia, então aqui fica o lembrete — quem
 * escolhe é a pessoa, no campo de talentos.
 */
export const TRACO_ANTECEDENTE = (antecedente: string): TracoClasse[] =>
  antecedente
    ? [
        T(
          1,
          `Antecedente: ${antecedente}`,
          'Dá +3 em atributos (ou +2/+1), duas perícias, uma ferramenta e um talento de origem.',
        ),
      ]
    : []
