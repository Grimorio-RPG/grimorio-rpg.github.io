// O que a magia FAZ, lido do texto oficial.
//
// A lista de escolha era uma parede de linhas iguais: nome, círculo, escola. Um
// mago de nível 4 abre o grimório, vê sessenta linhas com a mesma cara e escolhe
// pelo nome que soa melhor — que é o mesmo que escolher no chute. Faltava o que
// separa uma magia da outra na hora de decidir: isto machuca ou ajuda? quanto
// de dano? pega um ou pega o grupo? contra qual salvaguarda?
//
// Nada disso é digitado à mão. Está tudo escrito no texto do SRD, na mesma
// frase de sempre — "takes 8d6 Fire damage", "makes a Dexterity saving throw",
// "the Charmed condition", "20-foot-radius Sphere" —, e trezentas e trinta e
// nove magias digitadas à mão seriam trezentas e trinta e nove chances de errar
// em silêncio.
//
// O perfil é UM rótulo, e não uma lista. Serve para filtrar, e filtro que
// devolve tudo em toda categoria não filtra nada.
//
// SRD 5.2.1, Creative Commons Attribution 4.0.

export type Papel = 'dano' | 'cura' | 'controle' | 'defesa' | 'utilidade'

export interface PerfilDeMagia {
  papel: Papel
  /** O tipo de dano em português, quando ela causa dano. */
  dano?: string
  /** Os dados do dano — "8d6". É o número que decide entre duas magias. */
  dados?: string
  /** A salvaguarda, abreviada como na ficha. */
  salvaguarda?: string
  /** Pede rolagem de ataque em vez de salvaguarda. */
  ataque: boolean
  /** Pega mais de um alvo: cone, esfera, linha, cubo, emanação. */
  area: boolean
}

/** Os tipos de dano do livro, em português. */
const DANOS: Record<string, string> = {
  Acid: 'Ácido',
  Bludgeoning: 'Concussão',
  Cold: 'Frio',
  Fire: 'Fogo',
  Force: 'Força',
  Lightning: 'Elétrico',
  Necrotic: 'Necrótico',
  Piercing: 'Perfurante',
  Poison: 'Veneno',
  Psychic: 'Psíquico',
  Radiant: 'Radiante',
  Slashing: 'Cortante',
  Thunder: 'Trovejante',
}

const SALVAGUARDAS: Record<string, string> = {
  Strength: 'FOR',
  Dexterity: 'DES',
  Constitution: 'CON',
  Intelligence: 'INT',
  Wisdom: 'SAB',
  Charisma: 'CAR',
}

/**
 * As condições que fazem uma magia ser de CONTROLE.
 *
 * O livro sempre escreve "the X condition" quando aplica uma de verdade, e é
 * essa frase que se procura aqui — não a palavra solta. "Frightened" aparece na
 * prosa de meia dúzia de magias que não amedrontam ninguém.
 */
const CONDICOES = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated',
  'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained',
  'Stunned', 'Unconscious',
]
// Invisível fica de fora: é a única condição que se dá a um AMIGO. Contada como
// controle, a Invisibilidade aparecia no filtro ao lado de Imobilizar Pessoa.

/**
 * O dado de dano, colado no "damage".
 *
 * Sem a colagem, "2d10 Bludgeoning damage and 4d6 Cold damage" e qualquer frase
 * com um dado antes de um tipo de dano casavam atravessado — o dado de uma
 * oração com o tipo da seguinte. O tipo é OPCIONAL porque o Orbe Cromático
 * escreve só "takes 3d8 damage": quem escolhe o tipo é quem conjura, e o número
 * continua sendo o que interessa.
 */
const reDano = new RegExp(
  `(\\d+d\\d+(?:\\s*\\+\\s*\\d+)?)\\s+(?:(${Object.keys(DANOS).join('|')})\\s+)?damage`,
)
const reSalvaguarda = new RegExp(`\\b(${Object.keys(SALVAGUARDAS).join('|')}) saving throw`)
const reCura =/\bregains?\b[^.]{0,60}Hit Points|Hit Points equal to/
const reDefesa = /Temporary Hit Points|\bResistance to\b|bonus to (?:its |your |the )?(?:AC|Armor Class)\b|(?:AC|Armor Class) (?:becomes|equals)|(?:an |has an )Armor Class of|the Invisible condition|Advantage on (?:all )?saving throws/
const reControle = new RegExp(
  `\\bthe (${CONDICOES.join('|')}) condition|\\bSpeed (?:becomes|is) 0\\b|Difficult Terrain`,
)
const reArea = /\b(Sphere|Cone|Cube|Cylinder|Emanation)\b|\d+-foot[^.]{0,30}\bLine\b|\bLine of\b/

/**
 * O papel da magia, em uma palavra.
 *
 * Ganha o efeito que aparece PRIMEIRO no texto — porque o livro descreve o que
 * a magia é antes de descrever o que ela também faz. Foi a única regra que
 * acertou os casos difíceis sem uma lista de exceções:
 *
 * - Teia diz "Terreno Difícil" e "Contido" no começo, e só no fim conta que a
 *   teia pega fogo por 2d4. Uma regra "tem dado de dano? é dano" transformava a
 *   magia de prender mais usada do jogo numa magia de dano de 2d4.
 * - Toque Vampírico cura quem conjura, mas o dano vem antes — e ninguém memoriza
 *   Toque Vampírico para curar.
 * - Guardiões Espirituais causa dano e reduz deslocamento, nessa ordem.
 *
 * Empate vai para a ordem desta lista, que é a ordem em que a mesa pergunta.
 */
function papelDe(texto: string): Papel {
  const ondeEsta = (re: RegExp) => {
    const m = re.exec(texto)
    return m ? m.index : Infinity
  }
  const candidatos: [Papel, number][] = [
    ['dano', ondeEsta(reDano)],
    ['cura', ondeEsta(reCura)],
    ['controle', ondeEsta(reControle)],
    ['defesa', ondeEsta(reDefesa)],
  ]
  let melhor: [Papel, number] = ['utilidade', Infinity]
  for (const c of candidatos) if (c[1] < melhor[1]) melhor = c
  return melhor[0]
}

/** Lê o texto oficial e devolve o que a mesa precisa para escolher. */
export function perfilDe(magia: { texto: string }): PerfilDeMagia {
  const t = magia.texto
  const d = reDano.exec(t)
  const s = reSalvaguarda.exec(t)
  const papel = papelDe(t)
  // O número só sai quando o dano é o que a magia FAZ. A Teia pega fogo por
  // 2d4, e uma etiqueta "🔥 2d4" na linha dela devolveria exatamente a
  // confusão que a ordem do texto acabou de desfazer.
  const causa = papel === 'dano' ? d : null
  return {
    papel,
    dano: causa?.[2] ? DANOS[causa[2]] : undefined,
    dados: causa ? causa[1].replace(/\s+/g, '') : undefined,
    salvaguarda: s ? SALVAGUARDAS[s[1]] : undefined,
    ataque: /(?:ranged|melee) spell attack/i.test(t),
    area: reArea.test(t),
  }
}

// ---------------------------------------------------------------------------
// A parte visual: o que dá cara a cada linha da lista.
//
// Não existe arte de magia neste app, e inventar uma para trezentas e trinta e
// nove seria pior do que não ter. O que dá para fazer com honestidade é o que
// um livro de regras faz: cor e símbolo por escola, para a linha parar de ser
// texto e virar algo que se reconhece de relance.
// ---------------------------------------------------------------------------

export const ESCOLA_ICONE: Record<string, string> = {
  Abjuração: '🛡️',
  Adivinhação: '🔮',
  Conjuração: '🌀',
  Encantamento: '💗',
  Evocação: '💥',
  Ilusão: '🎭',
  Necromancia: '💀',
  Transmutação: '⚗️',
}

export const ESCOLA_COR: Record<string, string> = {
  Abjuração: '#60a5fa',
  Adivinhação: '#22d3ee',
  Conjuração: '#34d399',
  Encantamento: '#f472b6',
  Evocação: '#fb923c',
  Ilusão: '#a78bfa',
  Necromancia: '#94a3b8',
  Transmutação: '#facc15',
}

export const DANO_ICONE: Record<string, string> = {
  Ácido: '🧪',
  Concussão: '🔨',
  Cortante: '⚔️',
  Elétrico: '⚡',
  Fogo: '🔥',
  Força: '✴️',
  Frio: '❄️',
  Necrótico: '🌑',
  Perfurante: '🏹',
  Psíquico: '🧠',
  Radiante: '☀️',
  Trovejante: '🔊',
  Veneno: '☠️',
}

export const PAPEIS: { papel: Papel; rotulo: string; icone: string }[] = [
  { papel: 'dano', rotulo: 'Dano', icone: '⚔️' },
  { papel: 'cura', rotulo: 'Cura', icone: '💚' },
  { papel: 'controle', rotulo: 'Controle', icone: '🕸️' },
  { papel: 'defesa', rotulo: 'Defesa', icone: '🛡️' },
  { papel: 'utilidade', rotulo: 'Utilidade', icone: '🧰' },
]

export const PAPEL_ROTULO: Record<Papel, string> = {
  dano: 'Dano',
  cura: 'Cura',
  controle: 'Controle',
  defesa: 'Defesa',
  utilidade: 'Utilidade',
}
