// O que muda se eu usar isto.
//
// A boneca de equipamento já respondia essa pergunta: passar o olho num item
// guardado e a ficha dizer "+1 de CA, −1 de Furtividade" antes de vestir. Só
// que a conta morava DENTRO do componente, então a resposta só existia ali.
//
// Nos dois lugares onde a pergunta é mais cara ela não existia: na LOJA, onde
// se decide gastar quatro mil peças de ouro, e no SAQUE, onde o item cai na
// mochila e a comparação fica por conta de quem lembrar de abrir a boneca.
//
// A conta é a mesma dos três lados de propósito. Duas contas parecidas para a
// mesma pergunta é como se produz a resposta que discorda de si mesma — o
// mesmo item dizendo "+1 de CA" na loja e "+2" na ficha.

import type { AbilityKey, Character, Equipamento } from '../types'
import { ABILITIES, SKILLS } from '../data/rules'
import { armorClass, passivePerception, saveBonus, skillBonus } from './calc'
import { deslocamentoEfetivo } from './features'
import { armaduraVestida, atributoComEquipamento, equiparEm } from './equipamento'
import { custoDeArmadura } from './proficiencias'

/**
 * O retrato da ficha que interessa numa troca.
 *
 * Só o que muda de verdade ao vestir algo. Comparar a ficha inteira produziria
 * uma lista de diferenças em que ninguém acha o que importa.
 */
export interface Retrato {
  ca: number
  atributos: Record<AbilityKey, number>
  percepcaoPassiva: number
  deslocamento: number
  pericias: Record<string, number>
  salvaguardas: Record<string, number>
  /**
   * Desvantagem em Furtividade pela armadura.
   *
   * Não é número, e por isso quase ficou de fora: `diferencas` compara valores,
   * e vantagem/desvantagem não é um valor. Mas é O trade-off do 5e — a placa
   * dá +6 de CA e acaba com a furtividade do grupo —, e uma comparação que
   * mostra só o +6 é propaganda, não informação.
   */
  furtividadeRuim: boolean
  /** Força mínima da armadura: abaixo dela, a pessoa anda mais devagar. */
  forcaMinima: number
  /**
   * Está vestindo algo sem ter treino.
   *
   * Pertence aqui pelo mesmo motivo da Furtividade: a placa achada na masmorra
   * mostrava "+6 de CA" para o mago, e o resto — desvantagem em tudo que usa
   * Força ou Destreza, e nada de conjurar — ele descobriria na luta seguinte.
   */
  semTreino: boolean
}

export function retratar(char: Character): Retrato {
  const atributos = {} as Record<AbilityKey, number>
  const salvaguardas: Record<string, number> = {}
  for (const a of ABILITIES) {
    atributos[a.key] = atributoComEquipamento(char, a.key)
    salvaguardas[a.key] = saveBonus(char, a.key)
  }
  const pericias: Record<string, number> = {}
  for (const s of SKILLS) pericias[s.key] = skillBonus(char, s.key)
  const armadura = armaduraVestida(char)
  return {
    ca: armorClass(char),
    atributos,
    percepcaoPassiva: passivePerception(char),
    deslocamento: deslocamentoEfetivo(char),
    pericias,
    salvaguardas,
    furtividadeRuim: !!armadura?.furtividadeRuim,
    forcaMinima: armadura?.forcaMinima ?? 0,
    semTreino: custoDeArmadura(char) != null,
  }
}

export interface Diferenca {
  texto: string
  bom: boolean
}

/** As diferenças entre dois retratos, já em texto pronto. */
export function diferencas(antes: Retrato, depois: Retrato): Diferenca[] {
  const fora: Diferenca[] = []
  const sinal = (n: number) => (n > 0 ? `+${n}` : `${n}`)

  if (depois.ca !== antes.ca) {
    fora.push({ texto: `${sinal(depois.ca - antes.ca)} CA`, bom: depois.ca > antes.ca })
  }
  // O atributo é mostrado como transição, e não como delta: "+5 FOR" leria
  // como cinco a mais nas rolagens, quando 16 → 21 muda o modificador só em 2.
  for (const a of ABILITIES) {
    const de = antes.atributos[a.key]
    const para = depois.atributos[a.key]
    if (de !== para) {
      fora.push({ texto: `${a.abrev} ${de} → ${para}`, bom: para > de })
    }
  }

  // E o que muda por tabela é listado, porque é onde a diferença aparece na
  // hora de rolar.
  for (const a of ABILITIES) {
    const d = depois.salvaguardas[a.key] - antes.salvaguardas[a.key]
    if (d !== 0) fora.push({ texto: `${sinal(d)} salv. ${a.abrev}`, bom: d > 0 })
  }
  for (const s of SKILLS) {
    const d = depois.pericias[s.key] - antes.pericias[s.key]
    if (d !== 0) fora.push({ texto: `${sinal(d)} ${s.nome}`, bom: d > 0 })
  }

  if (depois.percepcaoPassiva !== antes.percepcaoPassiva) {
    const d = depois.percepcaoPassiva - antes.percepcaoPassiva
    fora.push({ texto: `${sinal(d)} percep. passiva`, bom: d > 0 })
  }
  if (depois.deslocamento !== antes.deslocamento) {
    const d = depois.deslocamento - antes.deslocamento
    fora.push({ texto: `${sinal(d)} m de deslocamento`, bom: d > 0 })
  }

  // O que não é número. Sem estas duas linhas, a armadura de placa aparecia na
  // loja como "+6 CA" e mais nada — e o ladino do grupo descobria o resto na
  // primeira vez que tentasse se esconder.
  if (depois.furtividadeRuim !== antes.furtividadeRuim) {
    fora.push({
      texto: depois.furtividadeRuim
        ? 'desvantagem em Furtividade'
        : 'sai a desvantagem em Furtividade',
      bom: !depois.furtividadeRuim,
    })
  }
  if (depois.forcaMinima !== antes.forcaMinima && depois.forcaMinima > 0) {
    fora.push({ texto: `exige FOR ${depois.forcaMinima}`, bom: false })
  }
  // A pior das três, e a que menos aparece: a CA sobe, a ficha fica plausível,
  // e a pessoa só descobre na hora de conjurar.
  if (depois.semTreino !== antes.semTreino) {
    fora.push({
      texto: depois.semTreino
        ? 'sem treino: desvantagem em FOR/DES e não conjura'
        : 'volta a poder conjurar',
      bom: !depois.semTreino,
    })
  }
  return fora
}

/**
 * O que mudaria se este item fosse vestido AGORA.
 *
 * O item entra na lista e é equipado no lugar dele — o que significa que a
 * conta já desconta o que sai. É essa a pergunta de verdade: não "quanto este
 * item dá", e sim "quanto ele dá A MAIS do que o que eu já uso". Uma armadura
 * de +2 não vale nada para quem já veste uma de +2.
 */
export function seEquipasse(char: Character, item: Equipamento): Diferenca[] {
  const lista = char.equipamentos ?? []
  // Item que exige sintonia entra SINTONIZADO na simulação.
  //
  // Sem isto a prévia respondia outra pergunta: "e se eu vestisse isto e não
  // sintonizasse?". Um Anel de Proteção comprado por cima de outro igual
  // aparecia como −1 de CA — verdade literal, e inútil: ninguém compra um anel
  // de sintonia para não sintonizar. O aviso de passar do limite de três já
  // existe na boneca, e é lá que ele pertence.
  const simulado = item.sintonia ? { ...item, sintonizado: true } : item
  // Item de fora da ficha (da loja, do saque) entra sem mexer no original.
  const com = lista.some((e) => e.id === item.id)
    ? lista.map((e) => (e.id === item.id ? simulado : e))
    : [...lista, simulado]
  const simulada: Character = { ...char, equipamentos: equiparEm(com, item.id, item.slot) }
  return diferencas(retratar(char), retratar(simulada))
}

export interface Resumo {
  /** O que cabe na linha — com TODAS as perdas dentro. */
  mostrar: Diferenca[]
  /** Quantos GANHOS ficaram de fora. Perda nunca fica. */
  ocultos: number
}

/**
 * O que mostrar quando o espaço não cabe a lista inteira.
 *
 * A regra é assimétrica de propósito: GANHO pode ser cortado, PERDA nunca.
 *
 * Cortar pelos primeiros parecia inofensivo e era o contrário. A ordem da lista
 * é CA, atributo, salvaguarda, perícia, deslocamento — e perda quase sempre é
 * perícia ou deslocamento, ou seja, o fim da fila. Uma armadura pesada que dava
 * +5 de CA, +1 em seis salvaguardas, −5 de Furtividade e −3 m de deslocamento
 * aparecia na loja como quatro linhas verdes, sem uma palavra sobre as duas
 * perdas. O app virava anúncio.
 *
 * Errar para menos é seguro: quem vê ganho a menos compra do mesmo jeito e
 * descobre o resto na ficha. Quem vê perda a menos compra o que não devia.
 */
export function resumir(dif: Diferenca[], limite = 4): Resumo {
  const perdas = dif.filter((d) => !d.bom)
  const ganhos = dif.filter((d) => d.bom)
  // A perda entra inteira; o que sobra de espaço é dos ganhos. Com muitas
  // perdas o limite estoura — e é o certo: elas são a informação que decide.
  const cabem = Math.max(0, limite - perdas.length)
  const mostrados = ganhos.slice(0, cabem)
  return {
    // Na ordem original, para a linha continuar legível: CA primeiro, e não a
    // perda primeiro só por ser perda.
    mostrar: dif.filter((d) => !d.bom || mostrados.includes(d)),
    ocultos: ganhos.length - mostrados.length,
  }
}

/** O mesmo, em uma linha de texto. */
export function resumoCurto(dif: Diferenca[], limite = 3): string {
  const { mostrar, ocultos } = resumir(dif, limite)
  if (mostrar.length === 0) return ''
  const texto = mostrar.map((d) => d.texto).join(' · ')
  return ocultos > 0 ? `${texto} · +${ocultos}` : texto
}

/** Para quem o item rende mais, e quanto. */
export interface MelhorAlvo {
  ficha: Character
  diferencas: Diferenca[]
}

/**
 * Quem deveria ficar com isto.
 *
 * É a pergunta que a mesa faz em voz alta assim que o saque aparece, e a que
 * mais atrasa a sessão: cada um abre a própria ficha, faz a conta de cabeça, e
 * quinze minutos depois o item vai para quem falou mais alto.
 *
 * A ordenação é pela CA e depois pela quantidade de ganhos — não por um "peso"
 * inventado. Somar salvaguarda com perícia e deslocamento numa nota única
 * exigiria decidir que uma vale duas da outra, e essa decisão é da mesa, não do
 * app. Aqui a lista sai ordenada e visível: quem escolhe continua sendo gente.
 */
export function melhorPara(item: Equipamento, fichas: Character[]): MelhorAlvo[] {
  return fichas
    .map((ficha) => ({ ficha, diferencas: seEquipasse(ficha, item) }))
    .filter((x) => x.diferencas.some((d) => d.bom))
    .sort((a, b) => ganhoDeCa(b.diferencas) - ganhoDeCa(a.diferencas) ||
      b.diferencas.length - a.diferencas.length)
}

function ganhoDeCa(dif: Diferenca[]): number {
  const ca = dif.find((d) => d.texto.endsWith(' CA'))
  return ca ? Number(ca.texto.replace(' CA', '')) : 0
}
