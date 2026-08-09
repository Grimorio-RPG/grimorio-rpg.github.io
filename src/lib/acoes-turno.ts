// A economia de ações: o que já foi gasto neste turno.
//
// O turno de D&D tem quatro recursos, e o app não marcava nenhum. Quem tem
// muita opção — um monge, um ladino, um chefe com reação — passa o turno
// tentando lembrar se já usou o bônus, e a mesa resolve na base do "acho que
// não usei".
//
// AQUI SÓ ENTRAM TRÊS, e a ausência do quarto é decisão, não esquecimento:
//
// - AÇÃO, BÔNUS e REAÇÃO são invisíveis. Não há nada na mesa que mostre que já
//   foram gastos, então o app é o único lugar onde poderiam existir.
// - MOVIMENTO fica de fora. Ele já está desenhado: no app, na régua do
//   tabuleiro; na mesa física, na miniatura que andou. Um contador de metros
//   seria a única coisa desta tela que a mesa teria de alimentar à mão para
//   saber o que já está vendo.
//
// A REAÇÃO é a que mais se perde, e por um motivo estrutural: ela é gasta no
// turno DOS OUTROS. Quando chega a vez da criatura, ninguém lembra do Ataque
// de Oportunidade que ela fez três turnos atrás — e é por isso que existe
// `quemPodeReagir`, que responde a pergunta no momento em que ela é feita.

import type { Combatant, Gastos } from '../types'

export type { Gastos } from '../types'

export type Recurso = keyof Gastos

export const RECURSOS: { chave: Recurso; nome: string; icone: string; dica: string }[] = [
  { chave: 'acao', nome: 'Ação', icone: '⚔️', dica: 'Atacar, Conjurar, Correr, Ajudar…' },
  { chave: 'bonus', nome: 'Bônus', icone: '⚡', dica: 'Só quando algum traço ou magia der uma' },
  { chave: 'reacao', nome: 'Reação', icone: '↩️', dica: 'Gasta no turno dos OUTROS. Volta no início do seu' },
]

/**
 * O turno começou: tudo volta.
 *
 * Inclusive a reação, e é assim mesmo — a regra diz que ela volta no início do
 * seu turno, não no fim. Quem gastou a reação no turno do inimigo passa o
 * intervalo inteiro sem ela, que é justamente o que faz gastá-la ser uma
 * decisão.
 */
export function aoComecarOTurno(): Partial<Combatant> {
  return { gastos: {} }
}

/** Marca ou desmarca um recurso. Desmarcar existe porque a mesa erra. */
export function alternar(c: { gastos?: Gastos }, qual: Recurso): Partial<Combatant> {
  const gastos = { ...(c.gastos ?? {}) }
  if (gastos[qual]) delete gastos[qual]
  else gastos[qual] = true
  return { gastos }
}

export function gastou(c: { gastos?: Gastos }, qual: Recurso): boolean {
  return !!c.gastos?.[qual]
}

/** Ainda pode reagir? */
export function podeReagir(c: { gastos?: Gastos; pvAtual: number }): boolean {
  // Quem está a 0 não reage. Vale para o monstro, que morreu, e para o aliado,
  // que está Inconsciente — e Inconsciente não tem reação.
  return c.pvAtual > 0 && !c.gastos?.reacao
}

/**
 * Quem ainda tem reação, fora quem está agindo agora.
 *
 * É a lista que responde "alguém reage a isso?" no instante em que o DM
 * pergunta. Sem ela, a resposta sai da memória da mesa — e a memória da mesa
 * sempre diz que sim.
 */
export function quemPodeReagir<T extends { id: string; gastos?: Gastos; pvAtual: number }>(
  combatentes: T[],
  idDaVez: string | null,
): T[] {
  return combatentes.filter((c) => c.id !== idDaVez && podeReagir(c))
}

/** Zera a economia de todo mundo — começo e fim de combate. */
export function zerarTodos<T extends { gastos?: Gastos }>(combatentes: T[]): T[] {
  if (combatentes.every((c) => !c.gastos || Object.keys(c.gastos).length === 0)) {
    // Devolver a MESMA lista quando não há nada para zerar: um objeto novo a
    // cada leitura faria o DM republicar, o aparelho do jogador acordar, e o
    // laço não parar mais. É a lição que a ponte da batalha já custou caro.
    return combatentes
  }
  return combatentes.map((c) => ({ ...c, gastos: {} }))
}
