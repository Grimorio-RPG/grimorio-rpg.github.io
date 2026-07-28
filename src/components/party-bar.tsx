import { useEffect, useRef, useState } from 'react'
import type { Combatant } from '../types'
import { SelosDeCondicao } from './ficha-card'

/**
 * Mostra o dano (ou a cura) subindo sobre o retrato.
 *
 * Numa mesa, o PV muda enquanto todo mundo olha para outra coisa. O número que
 * sobe e some diz o que aconteceu sem exigir que alguém estivesse observando o
 * contador no instante certo.
 */
function useVariacaoDePv(pvAtual: number) {
  const anterior = useRef(pvAtual)
  const [flash, setFlash] = useState<{ id: number; delta: number } | null>(null)

  useEffect(() => {
    const delta = pvAtual - anterior.current
    anterior.current = pvAtual
    if (delta === 0) return
    const id = Date.now()
    setFlash({ id, delta })
    const t = setTimeout(() => setFlash((f) => (f?.id === id ? null : f)), 1200)
    return () => clearTimeout(t)
  }, [pvAtual])

  return flash
}

function RetratoDeCombatente({ c, ativo }: { c: Combatant; ativo: boolean }) {
  const flash = useVariacaoDePv(c.pvAtual)
  const pct = c.pvMax > 0 ? Math.max(0, Math.min(100, (c.pvAtual / c.pvMax) * 100)) : 0
  const cor = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-dragon-500'
  const caido = c.pvAtual <= 0

  return (
    <div
      className={`relative w-24 shrink-0 rounded-lg border p-1.5 transition ${
        ativo ? 'border-amber-400/60 bg-amber-500/10' : 'border-white/10 bg-ink-900/60'
      } ${flash && flash.delta < 0 ? 'gv-tremer' : ''}`}
      title={`${c.nome} — ${c.pvAtual}/${c.pvMax} PV`}
    >
      {ativo && (
        <span className="gv-seta pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-sm text-amber-400 drop-shadow">
          ▼
        </span>
      )}
      <div
        className={`relative mx-auto h-14 w-14 overflow-hidden rounded-md bg-arcane-600/25 ${
          caido ? 'gv-caido' : ''
        } ${ativo ? 'gv-turno-halo' : ''}`}
      >
        {c.imagemUrl ? (
          <img src={c.imagemUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xl">
            {c.origem === 'inimigo' ? '👹' : '🧙'}
          </div>
        )}
      </div>

      {flash && (
        <span
          className={`gv-dano absolute left-1/2 top-6 z-10 text-lg font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] ${
            flash.delta < 0 ? 'text-dragon-400' : 'text-emerald-400'
          }`}
        >
          {flash.delta > 0 ? `+${flash.delta}` : flash.delta}
        </span>
      )}

      <p className="mt-1 truncate text-center text-[11px] leading-tight text-parchment-100">
        {c.nome}
      </p>

      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-dragon-900/70 ring-1 ring-inset ring-black/40">
        <div
          className={`h-full rounded-full transition-all duration-500 ${cor} ${
            pct <= 25 && pct > 0 ? 'animate-pulse' : ''
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {c.condicoes.length > 0 && (
        <div className="mt-1 flex justify-center">
          <SelosDeCondicao condicoes={c.condicoes.slice(0, 2)} />
        </div>
      )}
    </div>
  )
}

/**
 * Faixa do grupo no topo da batalha.
 *
 * Empresta o padrão dos RPGs eletrônicos: todos os retratos e todas as vidas
 * numa linha só, sempre visível. Sem ela, saber como o grupo está exigia rolar
 * a página no meio do turno de alguém.
 */
export function PartyBar({
  combatentes,
  atualId,
}: {
  combatentes: Combatant[]
  atualId?: string
}) {
  const aliados = combatentes.filter((c) => c.origem === 'aliado')
  const inimigos = combatentes.filter((c) => c.origem === 'inimigo')
  if (combatentes.length === 0) return null

  return (
    <div className="nao-imprimir sticky top-0 z-20 -mx-3 mb-4 border-b border-white/10 bg-ink-900/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4">
      <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {aliados.length > 0 && (
          <div className="flex gap-1.5">
            {aliados.map((c) => (
              <RetratoDeCombatente key={c.id} c={c} ativo={c.id === atualId} />
            ))}
          </div>
        )}
        {aliados.length > 0 && inimigos.length > 0 && (
          <div className="my-1 w-px shrink-0 bg-white/10" />
        )}
        {inimigos.length > 0 && (
          <div className="flex gap-1.5">
            {inimigos.map((c) => (
              <RetratoDeCombatente key={c.id} c={c} ativo={c.id === atualId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
