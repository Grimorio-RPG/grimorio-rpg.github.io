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
import { atributoComEquipamento, equiparEm } from './equipamento'

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
  return {
    ca: armorClass(char),
    atributos,
    percepcaoPassiva: passivePerception(char),
    deslocamento: deslocamentoEfetivo(char),
    pericias,
    salvaguardas,
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

/** Só o que melhora, para quando o espaço não cabe a lista inteira. */
export function resumoCurto(dif: Diferenca[], quantos = 3): string {
  if (dif.length === 0) return ''
  return dif.slice(0, quantos).map((d) => d.texto).join(' · ')
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
