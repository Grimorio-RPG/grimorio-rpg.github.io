import type { AbilityKey, Character, SkillKey } from '../types'
import { CLASSES, SKILLS } from '../data/rules'
import { ESCUDO_CA, acharArmadura } from '../data/equipment'
import { defesaSemArmadura } from './features'
import { bonusDeEquipamento } from './equipamento'

/** Modificador de atributo: floor((valor - 10) / 2). */
export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2)
}

/**
 * O atributo da pessoa já com o que ela veste.
 *
 * Existe porque um Cinto de Força muda TUDO que depende de Força — CA sem
 * armadura, ataque, Atletismo, carga. Espalhar essa soma por cada conta seria
 * garantir que uma delas ficasse para trás.
 */
export function atributoEfetivo(char: Character, chave: AbilityKey): number {
  const bonus = bonusDeEquipamento(char)
  const somado = char.atributos[chave] + (bonus.atributos[chave] ?? 0)
  return Math.max(somado, bonus.atributosFixos[chave] ?? 0)
}

/** Modificador do atributo já com o equipamento. */
export function modEfetivo(char: Character, chave: AbilityKey): number {
  return abilityMod(atributoEfetivo(char, chave))
}

/** Formata um modificador com sinal, ex: 3 -> "+3", -1 -> "-1". */
export function fmtMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

/** Bônus de proficiência por nível (regra padrão 5e/5.5e). */
export function proficiencyBonus(nivel: number): number {
  return Math.floor((Math.max(1, Math.min(20, nivel)) - 1) / 4) + 2
}

/** Bônus de uma salvaguarda, considerando proficiência. */
export function saveBonus(char: Character, key: AbilityKey): number {
  const base = modEfetivo(char, key)
  const prof = char.salvaguardasProficientes.includes(key) ? proficiencyBonus(char.nivel) : 0
  const item = bonusDeEquipamento(char)
  return base + prof + item.salvaguardaGeral + (item.salvaguardas[key] ?? 0)
}

/** Bônus de uma perícia, considerando proficiência e expertise. */
export function skillBonus(char: Character, key: SkillKey): number {
  const skill = SKILLS.find((s) => s.key === key)!
  const base = modEfetivo(char, skill.atributo)
  const pb = proficiencyBonus(char.nivel)
  let prof = 0
  if (char.periciasExpertise.includes(key)) prof = pb * 2
  else if (char.periciasProficientes.includes(key)) prof = pb
  return base + prof + (bonusDeEquipamento(char).pericias[key] ?? 0)
}

/**
 * As partes que compõem a CA.
 *
 * Existe separado do total porque a ficha precisa *explicar* o número — quando
 * ele diverge do D&D Beyond, a pessoa tem que conseguir ver de onde veio cada
 * ponto em vez de sobrescrever tudo no campo manual.
 */
interface ParteCa {
  valor: number
  rotulo: string
}

/**
 * Bases alternativas de CA vindas de traço de classe.
 *
 * São bases, não bônus: substituem o 10 + DES, e por isso concorrem com a
 * armadura em vez de somar. Vale a maior — que é como a regra funciona quando
 * alguém tem mais de uma opção.
 */
function basesDeTraco(char: Character): ParteCa[] {
  // Quem sabe se o traço vale agora é o catálogo de classes: ele conhece a
  // diferença entre o Bárbaro (mantém com escudo) e o Monge (perde).
  const atributo = defesaSemArmadura(char)
  if (!atributo) return []
  const des = modEfetivo(char, 'des')
  const extra = modEfetivo(char, atributo)
  return [
    {
      valor: 10 + des + extra,
      rotulo: `10 ${fmtMod(des)} (DES) ${fmtMod(extra)} (${atributo.toUpperCase()}, Defesa sem Armadura)`,
    },
  ]
}

/** Bônus que somam à CA, venham de onde vierem. */
function bonusDeCa(char: Character, vesteArmadura: boolean): ParteCa[] {
  const extras: ParteCa[] = []
  // Estilo de luta Defesa: +1 só enquanto se usa armadura.
  if (vesteArmadura && char.talentos.includes('Defesa')) {
    extras.push({ valor: 1, rotulo: '+1 (Defesa)' })
  }
  if (char.escudoEquipado) {
    extras.push({ valor: ESCUDO_CA, rotulo: `+${ESCUDO_CA} (escudo)` })
  }
  // Anel de Proteção, Manto de Proteção, armadura +1: somam por cima de tudo.
  const item = bonusDeEquipamento(char)
  if (item.ca !== 0) {
    extras.push({ valor: item.ca, rotulo: `${fmtMod(item.ca)} (equipamento)` })
  }
  return extras
}

function composicaoCa(char: Character): { base: ParteCa; extras: ParteCa[] } {
  const modDes = modEfetivo(char, 'des')
  const item = bonusDeEquipamento(char)

  // A armadura vestida no slot vence o campo antigo: se a pessoa preencheu os
  // dois, o que ela está VESTINDO é o que vale.
  const armadura = char.armaduraEquipada ? acharArmadura(char.armaduraEquipada) : undefined
  const doSlot = item.caBase

  let base: ParteCa
  if (doSlot) {
    const limite = doSlot.maxDes
    const desAplicado = limite == null ? modDes : Math.min(modDes, limite)
    base = {
      valor: doSlot.valor + desAplicado,
      rotulo: `${doSlot.valor} (${doSlot.fonte})${
        desAplicado !== 0 || limite !== 0
          ? ` ${fmtMod(desAplicado)} (DES${limite != null && modDes > limite ? `, máx ${limite}` : ''})`
          : ''
      }`,
    }
  } else if (!armadura) {
    base = { valor: 10 + modDes, rotulo: `10 ${fmtMod(modDes)} (DES)` }
  } else {
    const limite = armadura.maxDes
    const desAplicado = limite == null ? modDes : Math.min(modDes, limite)
    const parteDes =
      desAplicado !== 0 || limite !== 0
        ? ` ${fmtMod(desAplicado)} (DES${limite != null && modDes > limite ? `, máx ${limite}` : ''})`
        : ''
    base = { valor: armadura.ca + desAplicado, rotulo: `${armadura.ca} (${armadura.nome})${parteDes}` }
  }

  for (const alternativa of basesDeTraco(char)) {
    if (alternativa.valor > base.valor) base = alternativa
  }

  return { base, extras: bonusDeCa(char, !!doSlot || !!armadura) }
}

/**
 * Classe de Armadura efetiva.
 *
 * Prioriza o valor manual; senão soma a melhor base disponível (armadura ou
 * traço de classe) com os bônus de escudo e estilo de luta.
 */
export function armorClass(char: Character): number {
  if (char.classeArmaduraManual != null) return char.classeArmaduraManual
  const { base, extras } = composicaoCa(char)
  return extras.reduce((total, e) => total + e.valor, base.valor)
}

/** Explica como a CA foi calculada (para mostrar na ficha). */
export function armorClassDetalhe(char: Character): string {
  if (char.classeArmaduraManual != null) return 'valor definido manualmente'
  const { base, extras } = composicaoCa(char)
  return [base.rotulo, ...extras.map((e) => e.rotulo)].join(' ')
}

/** Bônus de iniciativa: mod DES + bônus manual. */
export function initiative(char: Character): number {
  return modEfetivo(char, 'des') + char.iniciativaBonus
}

/** CD de magia: 8 + PB + mod do atributo de conjuração. */
export function spellSaveDC(char: Character): number | null {
  if (!char.atributoConjuracao) return null
  return 8 + proficiencyBonus(char.nivel) + modEfetivo(char, char.atributoConjuracao)
}

/** Bônus de ataque com magia: PB + mod do atributo de conjuração. */
export function spellAttackBonus(char: Character): number | null {
  if (!char.atributoConjuracao) return null
  return proficiencyBonus(char.nivel) + modEfetivo(char, char.atributoConjuracao)
}

/** Valor passivo de uma perícia: 10 + bônus da perícia. */
export function passiveSkill(char: Character, key: SkillKey): number {
  return 10 + skillBonus(char, key)
}

/** Percepção passiva: 10 + bônus de Percepção. */
export function passivePerception(char: Character): number {
  return passiveSkill(char, 'percepcao')
}

/** Retorna a ClassInfo correspondente à classe do personagem (se houver). */
export function classInfo(nome: string) {
  return CLASSES.find((c) => c.nome === nome) ?? null
}

/**
 * A CD para manter a concentração ao sofrer dano: 10, ou metade do dano —
 * o que for maior.
 *
 * Mora aqui, com as outras contas de regra, e não junto do registro de
 * combate: o registro precisa da conta, a batalha precisa do registro para
 * censurar, e a conta no meio fechava um ciclo entre os dois módulos.
 */
export function cdDeConcentracao(dano: number): number {
  return Math.max(10, Math.floor(dano / 2))
}
