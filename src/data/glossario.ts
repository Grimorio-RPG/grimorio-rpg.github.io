// O glossário: as palavras que o app explica sozinho.
//
// A ideia veio dos jogos da Paradox, onde um termo dentro de uma explicação
// abre a explicação dele, e assim por diante. Aqui vale mais ainda: quem está
// aprendendo D&D esbarra em "sintonia" dentro da descrição de um item, e a
// resposta está a três telas de distância — ou não está em lugar nenhum.
//
// Cada verbete pode citar outros termos no próprio texto. É isso que faz o
// encadeamento acontecer sem ninguém precisar montar a árvore à mão.

import { CONDICOES } from './rules'

export interface Verbete {
  /** A palavra como aparece no texto. Sem acento no id, para casar sempre. */
  id: string
  termo: string
  /** Outras formas que devem abrir o mesmo verbete: plural, sinônimo. */
  variantes?: string[]
  texto: string
  /** De onde vem a regra, quando ajuda a pessoa a procurar no livro. */
  onde?: string
}

const V = (id: string, termo: string, texto: string, variantes?: string[], onde?: string): Verbete =>
  ({ id, termo, texto, variantes, onde })

/**
 * Os verbetes escritos à mão.
 *
 * São explicações próprias, não cópia do livro — a mesma regra que o resto do
 * app segue. O objetivo é a pessoa entender em uma frase, não ter a redação
 * oficial.
 */
const BASE: Verbete[] = [
  V(
    'sintonia',
    'sintonia',
    'Alguns itens mágicos só funcionam depois que você se **sintoniza** com eles: uma hora de foco, normalmente durante um **descanso curto**, segurando o item. Sem isso ele é um enfeite. Você mantém no máximo **três** itens sintonizados ao mesmo tempo — o quarto simplesmente não funciona.',
    ['sintoniza', 'sintonizar', 'sintonizado', 'sintonizados', 'sintonização', 'requer sintonia'],
    'DMG, itens mágicos',
  ),
  V(
    'descanso-curto',
    'descanso curto',
    'Uma pausa de pelo menos **1 hora** em que você não faz nada mais pesado que comer, ler ou cuidar de ferimentos. Serve para gastar **dados de vida** e recuperar poderes que recarregam em descanso curto.',
    ['descansos curtos'],
  ),
  V(
    'descanso-longo',
    'descanso longo',
    'Pelo menos **8 horas** de sono ou atividade leve. Devolve todos os pontos de vida, metade dos **dados de vida** gastos, os espaços de magia e quase todo poder que recarrega. Também tira **1 de exaustão**.',
    ['descansos longos'],
  ),
  V(
    'dados-de-vida',
    'dados de vida',
    'Um por nível, do tamanho da sua classe (d8 no Ladino, d10 no Guerreiro). Num **descanso curto** você gasta quantos quiser para curar: rola o dado e soma o modificador de Constituição. Voltam pela metade no **descanso longo**.',
    ['dado de vida'],
  ),
  V(
    'vantagem',
    'vantagem',
    'Role **dois d20** e use o maior. Vantagem não empilha: duas fontes de vantagem continuam sendo dois dados. Se você tem vantagem e **desvantagem** ao mesmo tempo, as duas se cancelam e você rola um dado só.',
  ),
  V(
    'desvantagem',
    'desvantagem',
    'Role **dois d20** e use o menor. Vale a mesma regra da **vantagem**: não empilha, e as duas juntas se cancelam.',
  ),
  V(
    'salvaguarda',
    'salvaguarda',
    'Uma rolagem para resistir a algo: veneno, uma magia, uma armadilha. Role 1d20 + o modificador do atributo pedido (+ **bônus de proficiência**, se você for proficiente naquela salvaguarda) e compare com a **CD**.',
    ['salvaguardas', 'teste de resistência', 'salvamento'],
  ),
  V(
    'cd',
    'CD',
    'Classe de Dificuldade: o número que a rolagem precisa **alcançar ou passar**. A CD das suas magias é 8 + **bônus de proficiência** + o modificador do seu atributo de conjuração.',
    ['classe de dificuldade'],
  ),
  V(
    'ca',
    'CA',
    'Classe de Armadura: o número que um ataque precisa alcançar para te acertar. Vem da armadura que você veste, mais Destreza (limitada em algumas armaduras), mais escudo e bônus de itens.',
    ['classe de armadura'],
  ),
  V(
    'bonus-de-proficiencia',
    'bônus de proficiência',
    'Um número que cresce com o nível: +2 do 1º ao 4º, +3 até o 8º, +4 até o 12º, e assim por diante. Você o soma no que é **proficiente** — armas que sabe usar, perícias treinadas, salvaguardas da sua classe.',
    ['proficiência', 'proficiente'],
  ),
  V(
    'concentracao',
    'concentração',
    'Algumas magias exigem que você mantenha o foco. Você só concentra em **uma** por vez, e perde a concentração se conjurar outra magia de concentração, ficar **incapacitado** ou falhar numa **salvaguarda** de Constituição ao tomar dano — a **CD** é 10 ou metade do dano, o que for maior.',
    ['concentrar', 'concentrando'],
  ),
  V(
    'resistencia',
    'resistência',
    'Você sofre **metade** do dano daquele tipo. Resistência não empilha: duas fontes continuam cortando pela metade uma vez só. A conta é feita depois de todos os outros modificadores.',
    ['resistente'],
  ),
  V(
    'vulnerabilidade',
    'vulnerabilidade',
    'O contrário da **resistência**: você sofre o **dobro** do dano daquele tipo.',
    ['vulnerável'],
  ),
  V(
    'imunidade',
    'imunidade',
    'Você não sofre nada daquele tipo de dano, ou não pode receber aquela condição.',
    ['imune'],
  ),
  V(
    'acao',
    'ação',
    'O que você faz de mais importante no seu turno: atacar, conjurar, correr, ajudar. Uma por turno, salvo poderes que dão outra.',
  ),
  V(
    'acao-bonus',
    'ação bônus',
    'Um segundo verbo no turno, mas só quando alguma coisa **te dá** uma: um poder, uma magia, uma arma leve na outra mão. Não existe "gastar a ação bônus" sem ter de onde.',
    ['ações bônus'],
  ),
  V(
    'reacao',
    'reação',
    'Uma resposta fora do seu turno, **uma por rodada**, quando o gatilho acontece — um ataque de oportunidade, um escudo conjurado no susto. Volta no início do seu turno.',
    ['reações'],
  ),
  V(
    'acao-lendaria',
    'ação lendária',
    'Criaturas lendárias agem **entre** os turnos dos outros. Elas têm um orçamento por rodada (normalmente 3) e gastam ao fim do turno de outra criatura. O orçamento volta no início do turno delas.',
    ['ações lendárias'],
  ),
  V(
    'acao-de-covil',
    'ação de covil',
    'Enquanto a luta acontece na guarida dela, a criatura ganha um efeito extra na **iniciativa 20**, perdendo empates. É o covil agindo, não a criatura.',
    ['ações de covil'],
  ),
  V(
    'iniciativa',
    'iniciativa',
    'A ordem dos turnos. No começo do combate cada um rola 1d20 + modificador de Destreza; quem tirar mais age primeiro, e a ordem se repete a cada **rodada**.',
  ),
  V(
    'rodada',
    'rodada',
    'Uma volta completa na **iniciativa**: todo mundo agiu uma vez. Equivale a mais ou menos 6 segundos de jogo.',
    ['rodadas'],
  ),
  V(
    'teste-de-morte',
    'teste de morte',
    'A 0 pontos de vida você cai inconsciente e, no seu turno, rola 1d20 sem modificador: 10 ou mais é sucesso, menos é falha. Três sucessos e você estabiliza; três falhas e morre. Tirar 20 natural te levanta com 1 ponto de vida.',
    ['testes de morte'],
  ),
  V(
    'exaustao',
    'exaustão',
    'Um contador de 1 a 6. Cada nível dá **−2** em rolagens de d20 e tira 3 m de deslocamento; no 6 você morre. Cai 1 por **descanso longo**.',
  ),
  V(
    'inspiracao-heroica',
    'inspiração heroica',
    'Uma ficha que o mestre te dá por interpretar bem. Gaste para **rerrolar** um d20 e ficar com o novo resultado. Você guarda uma por vez.',
    ['inspiração'],
  ),
  V(
    'nd',
    'ND',
    'Nível de Desafio: o quanto uma criatura pesa num encontro. Serve para estimar dificuldade e calcular o XP que ela vale.',
    ['nível de desafio'],
  ),
  V(
    'raridade',
    'raridade',
    'A faixa de poder de um item mágico: Comum, Incomum, Raro, Muito raro e Lendário. Quanto mais raro, mais caro e mais provável exigir **sintonia**.',
  ),
  V(
    'ataque-de-oportunidade',
    'ataque de oportunidade',
    'Quando alguém sai do seu alcance corpo a corpo andando, você pode gastar sua **reação** para dar um ataque nela.',
    ['ataques de oportunidade'],
  ),
  V(
    'critico',
    'crítico',
    'Um 20 natural no d20 de ataque acerta sempre e **dobra os dados** de dano — só os dados, não os modificadores.',
    ['acerto crítico'],
  ),
]

/** As condições viram verbetes sozinhas: a lista já existe e já está escrita. */
const DE_CONDICOES: Verbete[] = CONDICOES.map((c) => ({
  id: `condicao-${c.nome.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')}`,
  termo: c.nome.toLowerCase(),
  texto: c.desc,
}))

export const GLOSSARIO: Verbete[] = [...BASE, ...DE_CONDICOES]

/** Minúsculas e sem acento — a comparação não pode depender de digitação. */
function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

/** Índice por termo e por variante, montado uma vez. */
const PORTERMO = new Map<string, Verbete>()
for (const v of GLOSSARIO) {
  for (const forma of [v.termo, ...(v.variantes ?? [])]) {
    const chave = normalizar(forma)
    // O primeiro a registrar vence: `BASE` vem antes das condições, então um
    // termo de regra não é sequestrado por uma condição de mesmo nome.
    if (!PORTERMO.has(chave)) PORTERMO.set(chave, v)
  }
}

export function acharVerbete(termo: string): Verbete | null {
  return PORTERMO.get(normalizar(termo)) ?? null
}

export function verbetePorId(id: string): Verbete | null {
  return GLOSSARIO.find((v) => v.id === id) ?? null
}

/**
 * Todas as formas conhecidas, das mais longas para as mais curtas.
 *
 * A ordem é o que faz "ação bônus" ser reconhecida inteira em vez de virar
 * "ação" seguida de um "bônus" solto.
 */
export const FORMAS: string[] = [...PORTERMO.keys()].sort((a, b) => b.length - a.length)
