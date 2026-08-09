import type { Attack, Character, Equipamento } from '../types'
import type { Arma } from '../data/equipment'
import { fmtMod, modEfetivo, penalidadeDeExaustao, proficiencyBonus } from './calc'
import { uid } from './character'
import {
  type BonusCondicional,
  ESTILO_DUAS_ARMAS,
  armaBase,
  bonusParaArma,
  duasArmasLeves,
  itensAtivos,
  ocupaDuasMaos,
} from './equipamento'

/**
 * Qual atributo a arma usa: Força por padrão, Destreza para armas à distância,
 * e o melhor dos dois quando a arma tem Acuidade.
 */
export function atributoDaArma(char: Character, arma: Arma): 'for' | 'des' {
  const forMod = modEfetivo(char, 'for')
  const desMod = modEfetivo(char, 'des')
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
  const mod = modEfetivo(char, chave)
  // A exaustão entra no ATAQUE e não no dano: o livro reduz o teste de d20, e
  // dano não é teste de d20. Descontar dos dois puniria duas vezes.
  const bonus = mod + proficiencyBonus(char.nivel) + penalidadeDeExaustao(char)
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

// ---------------------------------------------------------------------------
// A arma vestida virando ataque
//
// O painel de equipamento sabia que a espada dá "+2 no ataque contra
// goblinoides" e o painel de Ataques sabia rolar — e os dois não se falavam.
// Vestir a espada não mudava nada na hora de bater: a pessoa continuava
// digitando o ataque à mão, com os bônus do item somados de cabeça. Era a
// mesma conta na cabeça que o equipamento em números veio resolver.
//
// Os ataques são DERIVADOS, não guardados. Guardar precisaria de um caminho de
// volta para cada mudança — tirar a espada, editar o efeito, desfazer a
// sintonia — e algum deles ficaria para trás, deixando na ficha um ataque de
// uma arma que a pessoa não carrega mais.
// ---------------------------------------------------------------------------

export interface AtaqueDeArma extends Attack {
  /** De qual item vestido este ataque saiu. */
  itemId: string
  /** O que só vale contra certos alvos, para a tela mostrar sem somar. */
  condicionais: BonusCondicional[]
  /**
   * O ataque extra de duas armas, quando esta é a arma da mão secundária.
   *
   * Fica separado do ataque normal porque o dano é outro: no 2024, o ataque
   * extra sai SEM o modificador de atributo, a não ser que a pessoa tenha o
   * estilo Combate com Duas Armas.
   */
  ataqueExtra?: { dano: string; comEstilo: boolean }
}

/**
 * Os ataques das armas que a pessoa está de fato empunhando.
 *
 * Uma arma versátil rolada com as duas mãos quando a outra mão está livre — é a
 * regra, e é o tipo de detalhe que ninguém lembra de ajustar: a Espada Longa
 * sozinha faz 1d10, com escudo faz 1d8.
 */
export function ataquesDeArmas(char: Character): AtaqueDeArma[] {
  const ativos = itensAtivos(char)
  const armas = ativos.filter((e) => armaBase(e))
  const maosOcupadas = ativos.filter(
    (e) => e.slot === 'maoPrincipal' || e.slot === 'maoSecundaria',
  ).length

  // O ataque extra do 2024: com arma Leve nas duas mãos, a ação Atacar rende um
  // ataque a mais com a outra arma Leve. Não precisa de talento nem de estilo —
  // o estilo só acrescenta o modificador ao dano.
  const comExtra = duasArmasLeves(char)
  const temEstilo = char.talentos.includes(ESTILO_DUAS_ARMAS)

  return armas.map((item) => {
    const arma = armaBase(item)!
    // Uma mão livre: a versátil rende o dado maior. Uma arma de duas mãos já
    // usa as duas, então nunca há mão livre para contar duas vezes.
    const duasMaos = ocupaDuasMaos(item) || maosOcupadas === 1
    const ataque = ataqueDoItem(char, item, arma, duasMaos)
    if (!comExtra || item.slot !== 'maoSecundaria') return ataque
    return {
      ...ataque,
      ataqueExtra: {
        dano: temEstilo ? ataque.dano : semModificador(ataque.dano),
        comEstilo: temEstilo,
      },
    }
  })
}

/**
 * O dano sem o modificador de atributo.
 *
 * "1d6+3 perfurante" vira "1d6 perfurante". É o ataque extra de duas armas sem
 * o estilo: mostrar o dano cheio ali seria dar de graça o que o estilo custa
 * uma escolha de nível.
 */
function semModificador(dano: string): string {
  return dano.replace(/^(\d+d\d+)[+-]\d+/, '$1')
}

function ataqueDoItem(
  char: Character,
  item: Equipamento,
  arma: Arma,
  duasMaos: boolean,
): AtaqueDeArma {
  const base = ataqueDaArma(char, arma, duasMaos)
  const bonus = bonusParaArma(char, item)

  const acerto = (parseInt(base.bonus, 10) || 0) + bonus.ataque
  const extras = bonus.danoExtra.map((d) => `+${d.dado}${d.descricao ? ` ${d.descricao}` : ''}`)
  const dano = [somarNoDano(base.dano, bonus.dano), ...extras].join(' ')

  return {
    ...base,
    // O id acompanha o item: a linha de ataque é o item, não uma cópia dele.
    id: `arma-${item.id}`,
    itemId: item.id,
    nome: item.nome || arma.nome,
    bonus: fmtMod(acerto),
    dano,
    notas: base.notas,
    condicionais: bonus.condicionais,
  }
}

/**
 * Soma o bônus do item dentro da expressão de dano.
 *
 * "1d8+3 cortante" com +1 do item tem de virar "1d8+4 cortante", e não
 * "1d8+3 cortante +1" — a segunda forma o rolador de dados não entende, e o
 * dano rolado sairia menor do que o da ficha.
 */
function somarNoDano(dano: string, mais: number): string {
  if (mais === 0) return dano
  const m = dano.match(/^(\d+d\d+)([+-]\d+)?(.*)$/)
  if (!m) return `${dano} ${fmtMod(mais)}`
  const atual = m[2] ? Number(m[2]) : 0
  const total = atual + mais
  return `${m[1]}${total !== 0 ? fmtMod(total) : ''}${m[3]}`
}
