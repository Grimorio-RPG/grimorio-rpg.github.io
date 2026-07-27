// Traços de classe que o app precisa *calcular* — D&D 5.5e (2024).
//
// Esta primeira leva cobre de propósito só o que mexe em número: foi um número
// errado (a CA saindo 16 onde o D&D Beyond dava 17) que mostrou que a ficha não
// sabia nada sobre a classe de quem a preenchia. Traço que é só texto de
// referência entra depois, e entra como dado, não como código.
//
// Distâncias em metros, como o resto do app (`deslocamento: 9`).

import type { AbilityKey } from '../types'

export type EfeitoTraco =
  /** Quantos ataques a ação de Ataque passa a permitir (total, não incremento). */
  | { tipo: 'ataquesExtras'; total: number }
  /** Base de CA que substitui o 10 + DES. */
  | { tipo: 'defesaSemArmadura'; atributo: AbilityKey; permiteEscudo: boolean }
  /** Deslocamento extra enquanto sem armadura. */
  | { tipo: 'movimentoSemArmadura'; metros: number }
  /** Dados de Ataque Furtivo (d6). */
  | { tipo: 'ataqueFurtivo'; dados: number }
  /** Nível em que a pessoa precisa escolher algo — é o que "não aparecia". */
  | { tipo: 'escolha'; oque: 'talento' | 'estiloDeLuta' | 'subclasse' | 'manobra'; quantidade: number }

export interface TracoClasse {
  nome: string
  nivel: number
  resumo: string
  efeito?: EfeitoTraco
}

const T = (nivel: number, nome: string, resumo: string, efeito?: EfeitoTraco): TracoClasse => ({
  nivel,
  nome,
  resumo,
  efeito,
})

/** Subclasse: no 2024 todas as classes escolhem no nível 3. */
const SUBCLASSE = T(3, 'Subclasse', 'Escolha a sua subclasse.', {
  tipo: 'escolha',
  oque: 'subclasse',
  quantidade: 1,
})

/**
 * Aumento de Atributo / talento.
 *
 * Todas as classes ganham em 4, 8, 12, 16 e 19. Guerreiro ganha dois extras
 * (6 e 14) e Ladino um (10) — é exatamente o tipo de nível que passava batido.
 */
function asi(niveis: number[]): TracoClasse[] {
  return niveis.map((n) =>
    T(n, 'Aumento de Atributo', 'Suba atributos ou pegue um talento.', {
      tipo: 'escolha',
      oque: 'talento',
      quantidade: 1,
    }),
  )
}

const ASI_PADRAO = [4, 8, 12, 16, 19]

const ATAQUE_EXTRA = (nivel: number, total = 2) =>
  T(nivel, 'Ataque Extra', `Ataca ${total} vezes ao usar a ação de Ataque.`, {
    tipo: 'ataquesExtras',
    total,
  })

/** Ataque Furtivo: 1d6 no nível 1 e mais 1d6 a cada dois níveis ímpares. */
const ATAQUE_FURTIVO: TracoClasse[] = Array.from({ length: 10 }, (_, i) => {
  const nivel = i * 2 + 1
  const dados = i + 1
  return T(nivel, 'Ataque Furtivo', `${dados}d6 de dano extra quando você tem vantagem ou um aliado ao lado.`, {
    tipo: 'ataqueFurtivo',
    dados,
  })
})

/** Movimento sem Armadura do Monge (10/15/20/25/30 pés → metros). */
const MOVIMENTO_MONGE: TracoClasse[] = [
  [2, 3],
  [6, 4.5],
  [10, 6],
  [14, 7.5],
  [18, 9],
].map(([nivel, metros]) =>
  T(nivel, 'Movimento sem Armadura', `+${metros} m de deslocamento sem armadura.`, {
    tipo: 'movimentoSemArmadura',
    metros,
  }),
)

export const TRACOS_DE_CLASSE: Record<string, TracoClasse[]> = {
  Bárbaro: [
    T(1, 'Fúria', 'Entra em fúria para ganhar dano extra e resistência a dano físico.'),
    T(1, 'Defesa sem Armadura', 'Sem armadura, sua CA é 10 + DES + CON. O escudo continua valendo.', {
      tipo: 'defesaSemArmadura',
      atributo: 'con',
      permiteEscudo: true,
    }),
    SUBCLASSE,
    ATAQUE_EXTRA(5),
    T(5, 'Movimento Rápido', '+3 m de deslocamento sem armadura pesada.', {
      tipo: 'movimentoSemArmadura',
      metros: 3,
    }),
    ...asi(ASI_PADRAO),
  ],

  Bardo: [
    T(1, 'Inspiração de Bardo', 'Dá um dado de inspiração a um aliado para somar a um teste.'),
    T(2, 'Perito', 'Dobra a proficiência em duas perícias.'),
    SUBCLASSE,
    ...asi(ASI_PADRAO),
  ],

  Bruxo: [
    T(1, 'Invocações Místicas', 'Escolhe invocações que moldam o seu pacto.'),
    SUBCLASSE,
    ...asi(ASI_PADRAO),
  ],

  Clérigo: [
    T(1, 'Ordem Divina', 'Escolhe entre Protetor (armadura pesada) e Taumaturgo (mais truques).'),
    T(2, 'Canalizar Divindade', 'Gasta um uso para queimar mortos-vivos ou fortalecer uma ação.'),
    SUBCLASSE,
    ...asi(ASI_PADRAO),
  ],

  Druida: [
    T(2, 'Forma Selvagem', 'Transforma-se em uma besta que você já viu.'),
    SUBCLASSE,
    ...asi(ASI_PADRAO),
  ],

  Feiticeiro: [
    T(2, 'Metamagia', 'Gasta pontos de feitiçaria para dobrar suas magias.'),
    SUBCLASSE,
    ...asi(ASI_PADRAO),
  ],

  Guerreiro: [
    T(1, 'Estilo de Luta', 'Escolha um estilo de luta.', {
      tipo: 'escolha',
      oque: 'estiloDeLuta',
      quantidade: 1,
    }),
    T(1, 'Retomar o Fôlego', 'Recupera pontos de vida como ação bônus.'),
    T(2, 'Surto de Ação', 'Ganha uma ação extra no turno.'),
    SUBCLASSE,
    ATAQUE_EXTRA(5),
    T(9, 'Indomável', 'Repete uma salvaguarda que falhou.'),
    ATAQUE_EXTRA(11, 3),
    ATAQUE_EXTRA(20, 4),
    // O Guerreiro é a classe com mais escolhas — e por isso a que mais sofria
    // com o level-up que só perguntava PV e subclasse.
    ...asi([...ASI_PADRAO, 6, 14]),
  ],

  Ladino: [
    T(1, 'Perito', 'Dobra a proficiência em duas perícias.'),
    ...ATAQUE_FURTIVO,
    T(2, 'Ação Ardilosa', 'Corre, desengaja ou se esconde como ação bônus.'),
    SUBCLASSE,
    T(5, 'Esquiva Sobrenatural', 'Reduz pela metade o dano de um ataque, como reação.'),
    T(7, 'Evasão', 'Sai ileso de salvaguardas de Destreza bem-sucedidas.'),
    ...asi([...ASI_PADRAO, 10]),
  ],

  Mago: [
    T(1, 'Recuperação Arcana', 'Recupera espaços de magia num descanso curto.'),
    SUBCLASSE,
    ...asi(ASI_PADRAO),
  ],

  Monge: [
    T(1, 'Artes Marciais', 'Ataques desarmados usam Destreza e ganham um ataque bônus.'),
    T(1, 'Defesa sem Armadura', 'Sem armadura nem escudo, sua CA é 10 + DES + SAB.', {
      tipo: 'defesaSemArmadura',
      atributo: 'sab',
      permiteEscudo: false,
    }),
    T(2, 'Foco do Monge', 'Gasta pontos de foco em manobras especiais.'),
    ...MOVIMENTO_MONGE,
    SUBCLASSE,
    ATAQUE_EXTRA(5),
    T(5, 'Golpe Atordoante', 'Pode atordoar quem você acerta.'),
    T(7, 'Evasão', 'Sai ileso de salvaguardas de Destreza bem-sucedidas.'),
    ...asi(ASI_PADRAO),
  ],

  Paladino: [
    T(1, 'Imposição das Mãos', 'Poço de cura igual a 5 × seu nível.'),
    T(2, 'Estilo de Luta', 'Escolha um estilo de luta.', {
      tipo: 'escolha',
      oque: 'estiloDeLuta',
      quantidade: 1,
    }),
    T(2, 'Golpe Divino', 'Gasta espaço de magia para dano radiante extra.'),
    SUBCLASSE,
    ATAQUE_EXTRA(5),
    T(6, 'Aura de Proteção', 'Você e aliados por perto somam seu CAR nas salvaguardas.'),
    ...asi(ASI_PADRAO),
  ],

  Patrulheiro: [
    T(1, 'Inimigo Favorecido', 'Sempre tem Marca do Caçador preparada.'),
    T(2, 'Estilo de Luta', 'Escolha um estilo de luta.', {
      tipo: 'escolha',
      oque: 'estiloDeLuta',
      quantidade: 1,
    }),
    SUBCLASSE,
    ATAQUE_EXTRA(5),
    T(9, 'Perito', 'Dobra a proficiência em duas perícias.'),
    ...asi(ASI_PADRAO),
  ],
}
