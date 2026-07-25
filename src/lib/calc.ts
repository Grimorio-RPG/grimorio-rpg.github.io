import type { AbilityKey, Character, SkillKey } from '../types'
import { CLASSES, SKILLS } from '../data/rules'
import { ESCUDO_CA, acharArmadura } from '../data/equipment'

/** Modificador de atributo: floor((valor - 10) / 2). */
export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2)
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
  const base = abilityMod(char.atributos[key])
  const prof = char.salvaguardasProficientes.includes(key) ? proficiencyBonus(char.nivel) : 0
  return base + prof
}

/** Bônus de uma perícia, considerando proficiência e expertise. */
export function skillBonus(char: Character, key: SkillKey): number {
  const skill = SKILLS.find((s) => s.key === key)!
  const base = abilityMod(char.atributos[skill.atributo])
  const pb = proficiencyBonus(char.nivel)
  let prof = 0
  if (char.periciasExpertise.includes(key)) prof = pb * 2
  else if (char.periciasProficientes.includes(key)) prof = pb
  return base + prof
}

/**
 * Classe de Armadura efetiva. Prioriza o valor manual; senão calcula a partir
 * da armadura equipada (respeitando o limite de Destreza) e do escudo.
 */
export function armorClass(char: Character): number {
  if (char.classeArmaduraManual != null) return char.classeArmaduraManual
  const modDes = abilityMod(char.atributos.des)
  const armadura = char.armaduraEquipada ? acharArmadura(char.armaduraEquipada) : undefined
  let base: number
  if (!armadura) {
    base = 10 + modDes
  } else {
    const limite = armadura.maxDes
    const desAplicado = limite == null ? modDes : Math.min(modDes, limite)
    base = armadura.ca + desAplicado
  }
  return base + (char.escudoEquipado ? ESCUDO_CA : 0)
}

/** Explica como a CA foi calculada (para mostrar na ficha). */
export function armorClassDetalhe(char: Character): string {
  if (char.classeArmaduraManual != null) return 'valor definido manualmente'
  const modDes = abilityMod(char.atributos.des)
  const armadura = char.armaduraEquipada ? acharArmadura(char.armaduraEquipada) : undefined
  const partes: string[] = []
  if (!armadura) {
    partes.push(`10 ${fmtMod(modDes)} (DES)`)
  } else {
    const limite = armadura.maxDes
    const desAplicado = limite == null ? modDes : Math.min(modDes, limite)
    partes.push(`${armadura.ca} (${armadura.nome})`)
    if (desAplicado !== 0 || limite !== 0) partes.push(`${fmtMod(desAplicado)} (DES${limite != null && modDes > limite ? `, máx ${limite}` : ''})`)
  }
  if (char.escudoEquipado) partes.push(`+${ESCUDO_CA} (escudo)`)
  return partes.join(' ')
}

/** Bônus de iniciativa: mod DES + bônus manual. */
export function initiative(char: Character): number {
  return abilityMod(char.atributos.des) + char.iniciativaBonus
}

/** CD de magia: 8 + PB + mod do atributo de conjuração. */
export function spellSaveDC(char: Character): number | null {
  if (!char.atributoConjuracao) return null
  return 8 + proficiencyBonus(char.nivel) + abilityMod(char.atributos[char.atributoConjuracao])
}

/** Bônus de ataque com magia: PB + mod do atributo de conjuração. */
export function spellAttackBonus(char: Character): number | null {
  if (!char.atributoConjuracao) return null
  return proficiencyBonus(char.nivel) + abilityMod(char.atributos[char.atributoConjuracao])
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
