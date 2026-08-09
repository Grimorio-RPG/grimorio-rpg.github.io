import { useState } from 'react'
import type { Character } from '../types'
import { conferir, resumo, TUDO_CERTO, type Achado, type Gravidade } from '../lib/conferencia'

const CARA: Record<Gravidade, { icone: string; cor: string; borda: string }> = {
  erro: { icone: '⛔', cor: 'text-dragon-300', borda: 'border-dragon-400/40 bg-dragon-500/10' },
  aviso: { icone: '⚠', cor: 'text-amber-300', borda: 'border-amber-400/40 bg-amber-500/10' },
  dica: { icone: '💡', cor: 'text-parchment-200/70', borda: 'border-white/10 bg-white/[0.03]' },
}

/**
 * A conferência da ficha.
 *
 * Vem RECOLHIDA e mostra só o placar. Uma lista de dez linhas amarelas aberta o
 * tempo todo vira decoração — a pessoa aprende a não ler, e no dia em que
 * aparecer um erro de verdade ele estará no meio das mesmas dez linhas.
 *
 * Não corrige nada. A ficha é da pessoa: um item de campanha, uma regra caseira
 * e um personagem de suplemento produzem achados que são falsos alarmes, e um
 * app que os transformasse em bloqueio viraria um app que discute com a mesa.
 */
export function Conferencia({ char }: { char: Character }) {
  const achados = conferir(char)
  const placar = resumo(achados)
  const [aberta, setAberta] = useState(placar.erro > 0)

  return (
    <section className="card p-5">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        className="flex w-full flex-wrap items-center gap-2 text-left"
      >
        <h3 className="panel-title">Conferência da ficha</h3>
        {achados.length === 0 ? (
          <span className="chip text-xs text-emerald-400">✓ tudo certo</span>
        ) : (
          <>
            {placar.erro > 0 && (
              <span className="chip text-xs text-dragon-300">⛔ {placar.erro}</span>
            )}
            {placar.aviso > 0 && (
              <span className="chip text-xs text-amber-300">⚠ {placar.aviso}</span>
            )}
            {placar.dica > 0 && (
              <span className="chip text-xs text-parchment-200/60">💡 {placar.dica}</span>
            )}
          </>
        )}
        <span className="ml-auto text-xs text-parchment-200/40">{aberta ? 'recolher' : 'abrir'}</span>
      </button>

      {aberta && (
        <div className="mt-3">
          {achados.length === 0 ? (
            <p className="text-sm text-parchment-200/60">
              {TUDO_CERTO} Os números batem com a classe, o nível e o que está vestido.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {achados.map((a) => (
                <LinhaDoAchado key={a.id} achado={a} />
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-parchment-200/40">
            A conferência aponta, e não corrige. Item de campanha, regra caseira e personagem de
            suplemento aparecem aqui sem estarem errados.
          </p>
        </div>
      )}
    </section>
  )
}

function LinhaDoAchado({ achado }: { achado: Achado }) {
  const cara = CARA[achado.gravidade]
  return (
    <li className={`rounded-lg border p-2 ${cara.borda}`}>
      <p className={`text-sm font-medium ${cara.cor}`}>
        {cara.icone} {achado.titulo}
      </p>
      {/* O número vem sempre junto: sem ele, um achado é só uma opinião. */}
      <p className="mt-0.5 text-xs text-parchment-200/70">{achado.detalhe}</p>
    </li>
  )
}

/**
 * O selo do grupo, para o DM.
 *
 * A ficha errada do jogador é problema do DM na hora em que o número entra na
 * mesa. Um selo na lista do grupo faz a pergunta chegar antes: "a CA do Thorn
 * está fixada à mão desde a sessão passada".
 */
export function SeloDeConferencia({ char }: { char: Character }) {
  const placar = resumo(conferir(char))
  if (placar.erro === 0 && placar.aviso === 0) return null
  return (
    <span
      className={`chip text-[10px] ${placar.erro > 0 ? 'text-dragon-300' : 'text-amber-300'}`}
      title={
        placar.erro > 0
          ? `${placar.erro} erro(s) e ${placar.aviso} aviso(s) na ficha`
          : `${placar.aviso} aviso(s) na ficha`
      }
    >
      {placar.erro > 0 ? `⛔ ${placar.erro}` : `⚠ ${placar.aviso}`}
    </span>
  )
}
