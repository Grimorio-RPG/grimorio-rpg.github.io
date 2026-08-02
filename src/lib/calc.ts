import type { AbilityKey, Character, SkillKey } from '../types'
import { CLASSES, SKILLS } from '../data/rules'
import { ESCUDO_CA, acharArmadura } from '../data/equipment'
import { defesaSemArmadura } from './features'

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
  const des = abilityMod(char.atributos.des)
  const extra = abilityMod(char.atributos[atributo])
  return [
    {
      valor: 10 + des + extra,
      rotulo: `10 ${fmtMod(des)} (DES) ${fmtMod(extra)} (${atributo.toUpperCase()}, Defesa sem Armadura)`,
    },
  ]
}

/** Bônus que somam à CA, venham de onde vierem. */
function bonusDeCa(char: Character): ParteCa[] {
  const extras: ParteCa[] = []
  // Estilo de luta Defesa: +1 só enquanto se usa armadura.
  if (char.armaduraEquipada && char.talentos.includes('Defesa')) {
    extras.push({ valor: 1, rotulo: '+1 (Defesa)' })
  }
  if (char.escudoEquipado) {
    extras.push({ valor: ESCUDO_CA, rotulo: `+${ESCUDO_CA} (escudo)` })
  }
  return extras
}

function composicaoCa(char: Character): { base: ParteCa; extras: ParteCa[] } {
  const modDes = abilityMod(char.atributos.des)
  const armadura = char.armaduraEquipada ? acharArmadura(char.armaduraEquipada) : undefined

  let base: ParteCa
  if (!armadura) {
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

  return { base, extras: bonusDeCa(char) }
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
