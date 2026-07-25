import type { Attack, Character } from '../types'
import type { Arma } from '../data/equipment'
import { abilityMod, fmtMod, proficiencyBonus } from './calc'
import { uid } from './character'

/**
 * Qual atributo a arma usa: Força por padrão, Destreza para armas à distância,
 * e o melhor dos dois quando a arma tem Acuidade.
 */
export function atributoDaArma(char: Character, arma: Arma): 'for' | 'des' {
  const forMod = abilityMod(char.atributos.for)
  const desMod = abilityMod(char.atributos.des)
  if (arma.alcanceTipo === 'À distância') return 'des'
  if (arma.propriedades.includes('Acuidade')) return desMod > forMod ? 'des' : 'for'
  return 'for'
}

/**
 * Monta o ataque já calculado. Assume proficiência com a arma — o jogador pode
 * editar o bônus depois se não for proficiente.
 */
export function ataqueDaArma(char: Character, arma: Arma, duasMaos = false): Attack {
  const chave = atributoDaArma(char, arma)
  const mod = abilityMod(char.atributos[chave])
  const bonus = mod + proficiencyBonus(char.nivel)
  const dadoDano = duasMaos && arma.versatil ? arma.versatil : arma.dano
  const dano = `${dadoDano}${mod !== 0 ? fmtMod(mod) : ''} ${arma.tipoDano}`
  const notas = [
    arma.categoria,
    ...arma.propriedades,
    arma.alcance ? `Alcance ${arma.alcance}` : '',
    duasMaos && arma.versatil ? 'Duas mãos' : '',
  ].filter(Boolean).join(', ')

  return {
    id: uid(),
    nome: arma.nome,
    bonus: fmtMod(bonus),
    dano,
    notas,
  }
}
