// Os três selos do turno: ação, bônus e reação.
//
// São pequenos de propósito. Não são um painel novo competindo com a vida e as
// condições — são três marcas na linha da criatura, que a pessoa clica ao usar
// e que voltam sozinhas quando o turno dela começa.
//
// O tamanho é a decisão de projeto inteira. Um contador grande transformaria
// cada turno numa lista de tarefas, e o app já perdeu essa briga uma vez: a
// mesa larga a ferramenta que pede mais do que devolve.

import type { Combatant } from '../types'
import { RECURSOS, alternar, gastou } from '../lib/acoes-turno'

export { quemPodeReagir, podeReagir } from '../lib/acoes-turno'

export function SelosDeAcao({
  c,
  onPatch,
  compacto,
}: {
  c: Combatant
  onPatch: (p: Partial<Combatant>) => void
  /** Na tela de mesa a linha já é densa: só os gastos aparecem. */
  compacto?: boolean
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {RECURSOS.map((r) => {
        const usado = gastou(c, r.chave)
        if (compacto && !usado) return null
        return (
          <button
            key={r.chave}
            type="button"
            onClick={() => onPatch(alternar(c, r.chave))}
            title={`${r.nome} — ${r.dica}`}
            className={`rounded-md border px-1.5 py-0.5 text-[11px] transition ${
              usado
                ? 'border-dragon-400/50 bg-dragon-500/15 text-dragon-300 line-through'
                : 'border-white/10 text-parchment-200/45 hover:border-emerald-400/40 hover:text-parchment-100'
            }`}
          >
            {r.icone} {r.nome}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Quem ainda pode reagir, no turno de quem está agindo.
 *
 * É a única das três que se gasta no turno DOS OUTROS, e por isso a única que
 * some da vista bem na hora em que importa. Esta linha responde "alguém reage
 * a isso?" no instante em que a pergunta é feita — antes, a resposta saía da
 * memória da mesa, e a memória da mesa sempre diz que sim.
 */
export function QuemReage({
  combatentes,
  idDaVez,
}: {
  combatentes: Combatant[]
  idDaVez: string | null
}) {
  const podem = combatentes.filter(
    (c) => c.id !== idDaVez && c.pvAtual > 0 && !c.gastos?.reacao,
  )
  const gastaram = combatentes.filter(
    (c) => c.id !== idDaVez && c.pvAtual > 0 && c.gastos?.reacao,
  )
  if (podem.length === 0 && gastaram.length === 0) return null

  return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs text-parchment-200/50">
      <span className="panel-title">↩️ Podem reagir</span>
      {podem.map((c) => (
        <span key={c.id} className="chip text-[11px] text-parchment-100">{c.nome}</span>
      ))}
      {podem.length === 0 && <span className="text-parchment-200/40">ninguém</span>}
      {gastaram.length > 0 && (
        <span className="text-[11px] text-parchment-200/30">
          · já reagiram: {gastaram.map((c) => c.nome).join(', ')}
        </span>
      )}
    </p>
  )
}
