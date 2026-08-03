// Desfazer o último ajuste do combate.
//
// Errar o alvo ou o número acontece toda sessão: você vai tirar 8 do Goblin 3 e
// digita no Goblin 2, ou digita 38 no lugar de 8. Hoje o conserto exige lembrar
// quanto a criatura tinha antes — não é conserto, é reconstrução de memória.
//
// **Guardamos o que mudou, não o estado inteiro.** Dez cópias da lista de
// combatentes pareciam mais simples, mas cada combatente carrega a imagem
// embutida: dez cópias multiplicariam por dez o que sincroniza, a cada golpe.
// Um passo aqui tem meia dúzia de números e cabe em qualquer rede.
//
// E fica dentro da batalha, que é o que sincroniza: o mesmo DM abre o app no PC
// e no celular, e um desfazer que valesse só num deles deixaria os dois com
// vidas diferentes — exatamente o problema que a sincronização existe para
// evitar.

import type { Battle, Combatant } from '../types'
import { uid } from './character'

/** Quantos passos guardamos. */
export const TETO_DESFAZER = 10

/** O valor ANTERIOR dos campos que mudaram num combatente. */
export interface AlteracaoDeCombatente {
  id: string
  campos: Partial<Combatant>
}

export interface PassoDesfazivel {
  id: string
  em: number
  /** O que o botão diz antes de você clicar. */
  descricao: string
  alteracoes: AlteracaoDeCombatente[]
  /** Combatentes que foram removidos, para poderem voltar inteiros. */
  removidos?: Combatant[]
}

/**
 * Campos que entram no desfazer.
 *
 * Posição fica de fora de propósito: arrastar um token gera uma atualização por
 * quadro do movimento, e em dois segundos de arrasto o histórico inteiro seria
 * de "mover", enterrando o golpe que você quer desfazer.
 */
const CAMPOS: (keyof Combatant)[] = [
  'pvAtual',
  'condicoes',
  'rodadasDeCondicao',
  'concentracao',
  'inspiracaoHeroica',
  'nomeOculto',
  'iniciativa',
  'nome',
  'lendariasRestantes',
  'ca',
  'pvMax',
  'refId',
  'imagemUrl',
  'imagemJogadorUrl',
  'categoria',
]

/**
 * O estado anterior dos campos que este patch vai mexer.
 *
 * Devolve `null` quando nada que interesse muda — mover um token não merece
 * ocupar um passo.
 */
export function alteracaoDe(
  antes: Combatant,
  patch: Partial<Combatant>,
): AlteracaoDeCombatente | null {
  const campos: Partial<Combatant> = {}
  let mudou = false

  for (const campo of CAMPOS) {
    if (!(campo in patch)) continue
    const novo = patch[campo]
    const velho = antes[campo]
    if (JSON.stringify(novo) === JSON.stringify(velho)) continue
    ;(campos as Record<string, unknown>)[campo] = velho
    mudou = true
  }

  return mudou ? { id: antes.id, campos } : null
}

/** Acrescenta um passo, jogando fora o mais antigo quando passa do teto. */
export function empilhar(
  b: Battle,
  descricao: string,
  alteracoes: AlteracaoDeCombatente[],
  removidos?: Combatant[],
): PassoDesfazivel[] {
  if (alteracoes.length === 0 && !removidos?.length) return b.desfazer ?? []
  const passo: PassoDesfazivel = {
    id: uid(),
    em: Date.now(),
    descricao,
    alteracoes,
    ...(removidos?.length ? { removidos } : {}),
  }
  const pilha = [...(b.desfazer ?? []), passo]
  return pilha.length > TETO_DESFAZER ? pilha.slice(pilha.length - TETO_DESFAZER) : pilha
}

/** O passo que o botão vai desfazer, se houver. */
export function proximoADesfazer(b: Battle): PassoDesfazivel | null {
  const pilha = b.desfazer ?? []
  return pilha.length > 0 ? pilha[pilha.length - 1] : null
}

/**
 * Volta um passo.
 *
 * Devolve o pedaço da batalha a ser gravado. Quem chama decide o que fazer com
 * ele — assim o desfazer não precisa saber nada sobre gravar nem sincronizar.
 */
export function desfazerUltimo(b: Battle): Partial<Battle> | null {
  const passo = proximoADesfazer(b)
  if (!passo) return null

  const porId = new Map(passo.alteracoes.map((a) => [a.id, a.campos]))

  const combatentes = b.combatentes.map((c) => {
    const campos = porId.get(c.id)
    return campos ? { ...c, ...campos } : c
  })

  // Quem foi removido volta para o lugar. Sem isto, apagar a criatura errada
  // seria o único erro de combate sem volta.
  const devolvidos = (passo.removidos ?? []).filter((r) => !combatentes.some((c) => c.id === r.id))

  return {
    combatentes: [...combatentes, ...devolvidos],
    desfazer: (b.desfazer ?? []).slice(0, -1),
  }
}

/**
 * A versão que sai para os jogadores: nenhuma.
 *
 * A pilha guarda o PV ANTERIOR de cada criatura, em número exato. Publicá-la
 * seria entregar de bandeja o que a projeção esconde transformando vida em
 * porcentagem — e pior, o histórico dos últimos dez golpes.
 */
export function projetarDesfazer(): undefined {
  return undefined
}
