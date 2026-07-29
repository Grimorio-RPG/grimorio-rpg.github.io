import { useMemo } from 'react'
import { useRolls } from '../hooks/useRolls'
import { useFeedDaMesa } from '../hooks/useSync'
import type { RollResult } from '../lib/dice'

/**
 * Resumo da sessão, no espírito da tela de fim de run de um roguelite.
 *
 * O que uma mesa lembra depois é anedota: "aquele 20 do Guilherme", "a rodada
 * em que ninguém acertou". Esses momentos já passam pelo app — toda rolagem
 * entra no histórico e, numa mesa, no feed do grupo. Faltava alguém somar.
 *
 * Nada de novo é gravado: isto lê o que já existe. Se o histórico for limpo, o
 * resumo zera junto, e isso é honesto — ele não é registro, é retrato do que
 * ainda está à mão.
 */
interface Estatisticas {
  total: number
  criticos: number
  falhas: number
  maiorD20: RollResult | null
  maiorDano: RollResult | null
  porAutor: { nome: string; total: number; criticos: number }[]
}

function juntar(minhas: RollResult[], doGrupo: { autorNome: string; roll: RollResult }[], meuNome: string) {
  const todas = [
    ...minhas.map((r) => ({ autor: meuNome, roll: r })),
    ...doGrupo.map((f) => ({ autor: f.autorNome, roll: f.roll })),
  ]
  // O feed traz de volta a própria rolagem; o id da rolagem remove a repetição.
  const vistos = new Set<string>()
  return todas.filter((t) => {
    if (vistos.has(t.roll.id)) return false
    vistos.add(t.roll.id)
    return true
  })
}

function calcular(itens: { autor: string; roll: RollResult }[]): Estatisticas {
  const porAutor = new Map<string, { nome: string; total: number; criticos: number }>()
  let criticos = 0
  let falhas = 0
  let maiorD20: RollResult | null = null
  let maiorDano: RollResult | null = null

  for (const { autor, roll } of itens) {
    const a = porAutor.get(autor) ?? { nome: autor, total: 0, criticos: 0 }
    a.total += 1
    if (roll.critico) {
      a.criticos += 1
      criticos += 1
    }
    porAutor.set(autor, a)
    if (roll.falhaCritica) falhas += 1

    if (roll.d20) {
      if (!maiorD20 || roll.total > maiorD20.total) maiorD20 = roll
    } else if (!maiorDano || roll.total > maiorDano.total) {
      maiorDano = roll
    }
  }

  return {
    total: itens.length,
    criticos,
    falhas,
    maiorD20,
    maiorDano,
    porAutor: [...porAutor.values()].sort((x, y) => y.total - x.total),
  }
}

function Numero({ valor, rotulo, cor = 'text-parchment-50' }: { valor: string | number; rotulo: string; cor?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
      <p className={`font-display text-2xl leading-none ${cor}`}>{valor}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-parchment-200/50">{rotulo}</p>
    </div>
  )
}

export function ResumoDaSessao({ meuNome = 'Você' }: { meuNome?: string }) {
  const minhas = useRolls()
  const doGrupo = useFeedDaMesa()

  const st = useMemo(
    () => calcular(juntar(minhas, doGrupo, meuNome)),
    [minhas, doGrupo, meuNome],
  )

  if (st.total === 0) {
    return (
      <p className="text-sm text-parchment-200/60">
        Nada rolado ainda. Conforme a mesa joga, os números aparecem aqui.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Numero valor={st.total} rotulo="rolagens" />
        <Numero valor={st.criticos} rotulo="críticos" cor="text-amber-300" />
        <Numero valor={st.falhas} rotulo="falhas críticas" cor="text-dragon-400" />
        <Numero valor={st.maiorD20?.total ?? '—'} rotulo="maior d20" cor="text-emerald-400" />
      </div>

      {(st.maiorD20 || st.maiorDano) && (
        <div className="space-y-1.5 text-sm">
          {st.maiorD20 && (
            <p className="text-parchment-200/80">
              🎯 Melhor teste: <b className="text-parchment-50">{st.maiorD20.total}</b> em{' '}
              {st.maiorD20.rotulo}
            </p>
          )}
          {st.maiorDano && (
            <p className="text-parchment-200/80">
              💥 Maior dano: <b className="text-parchment-50">{st.maiorDano.total}</b> em{' '}
              {st.maiorDano.rotulo}
            </p>
          )}
        </div>
      )}

      {st.porAutor.length > 1 && (
        <div>
          <h4 className="mb-2 panel-title">Quem rolou</h4>
          <ul className="space-y-1">
            {st.porAutor.map((a) => (
              <li key={a.nome} className="flex items-center justify-between text-sm">
                <span className="text-parchment-100">{a.nome}</span>
                <span className="text-xs text-parchment-200/60">
                  {a.total} {a.total === 1 ? 'rolagem' : 'rolagens'}
                  {a.criticos > 0 && <span className="ml-2 text-amber-300">{a.criticos} crítico(s)</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-parchment-200/45">
        Conta o que está no histórico agora — limpar a bandeja zera estes números.
      </p>
    </div>
  )
}
