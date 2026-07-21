import { useMemo, useState } from 'react'
import type { Battle, Combatant, Monster } from '../types'
import { useBattle } from '../hooks/useBattle'
import { useBestiary } from '../hooks/useBestiary'
import {
  batalhaVazia,
  combatenteDePersonagem,
  combatentesDeMonstro,
  ordenar,
  rolarIniciativa,
  statusPV,
} from '../lib/battle'
import { loadCharacters } from '../lib/storage'
import { CONDICOES } from '../data/rules'

type Modo = 'dm' | 'jogadores'
type UpdateFn = (patch: Partial<Battle>) => void

export default function BattlePage() {
  const { battle, update } = useBattle()
  const [modo, setModo] = useState<Modo>('dm')

  if (!battle) return null
  const ordenados = ordenar(battle.combatentes)

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚔️</span>
          <div>
            <h1 className="text-3xl text-parchment-50">Batalhas</h1>
            <p className="mt-1 max-w-xl text-sm text-parchment-200/60">
              Monte o encontro, controle iniciativa e vida. Os jogadores veem quem enfrentam.
            </p>
          </div>
        </div>
        <ViewToggle modo={modo} setModo={setModo} />
      </header>

      {modo === 'dm'
        ? <DmView battle={battle} update={update} ordenados={ordenados} />
        : <PlayerView battle={battle} ordenados={ordenados} />}
    </div>
  )
}

function ViewToggle({ modo, setModo }: { modo: Modo; setModo: (m: Modo) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-ink-900/50 p-1 text-sm">
      {([['dm', '🎲 Visão do DM'], ['jogadores', '👥 Visão dos Jogadores']] as const).map(([v, label]) => (
        <button
          key={v}
          onClick={() => setModo(v)}
          className={`rounded-md px-3 py-1.5 font-semibold transition ${modo === v ? 'bg-dragon-500 text-parchment-50' : 'text-parchment-200/70 hover:text-parchment-50'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Visão do DM
// ---------------------------------------------------------------------------
function DmView({ battle, update, ordenados }: { battle: Battle; update: UpdateFn; ordenados: Combatant[] }) {
  const atual = battle.emAndamento ? ordenados[battle.turnoIndex] : null

  function patchC(id: string, p: Partial<Combatant>) {
    update({ combatentes: battle.combatentes.map((c) => (c.id === id ? { ...c, ...p } : c)) })
  }
  function removerC(id: string) {
    update({ combatentes: battle.combatentes.filter((c) => c.id !== id) })
  }
  function rolarTodos(quem: 'todos' | 'inimigo' | 'aliado') {
    update({
      combatentes: battle.combatentes.map((c) =>
        quem === 'todos' || c.origem === quem ? { ...c, iniciativa: rolarIniciativa(c.iniciativaMod) } : c,
      ),
    })
  }
  function iniciar() { update({ emAndamento: true, rodada: 1, turnoIndex: 0 }) }
  function proximoTurno() {
    const n = ordenados.length
    if (n === 0) return
    const prox = battle.turnoIndex + 1
    if (prox >= n) update({ turnoIndex: 0, rodada: battle.rodada + 1 })
    else update({ turnoIndex: prox })
  }
  function turnoAnterior() {
    if (battle.turnoIndex === 0) {
      if (battle.rodada > 1) update({ turnoIndex: ordenados.length - 1, rodada: battle.rodada - 1 })
    } else update({ turnoIndex: battle.turnoIndex - 1 })
  }
  function limpar() {
    if (confirm('Limpar toda a batalha? Os combatentes serão removidos.')) update(batalhaVazia())
  }

  const inimigos = ordenados.filter((c) => c.origem === 'inimigo')
  const aliados = ordenados.filter((c) => c.origem === 'aliado')

  return (
    <div className="space-y-5">
      <AddCombatentes battle={battle} update={update} />

      {battle.combatentes.length > 0 && (
        <>
          {/* Controles */}
          <div className="card flex flex-wrap items-center gap-2 p-4">
            <button className="btn-ghost" onClick={() => rolarTodos('todos')}>🎲 Rolar iniciativa de todos</button>
            <button className="btn-ghost" onClick={() => rolarTodos('inimigo')}>🎲 Só inimigos</button>
            <div className="mx-1 h-6 w-px bg-white/10" />
            {!battle.emAndamento ? (
              <button className="btn-primary" onClick={iniciar}>▶ Iniciar combate</button>
            ) : (
              <>
                <button className="btn-ghost" onClick={turnoAnterior} aria-label="Turno anterior">←</button>
                <span className="rounded-lg bg-dragon-500/15 px-3 py-1.5 text-sm font-semibold text-parchment-50">Rodada {battle.rodada}</span>
                <button className="btn-primary" onClick={proximoTurno}>Próximo turno →</button>
                <button className="btn-ghost" onClick={() => update({ emAndamento: false })}>■ Encerrar</button>
              </>
            )}
            <button className="btn-ghost ml-auto text-parchment-200/50" onClick={limpar}>Limpar tudo</button>
          </div>

          {/* Lista */}
          <div className="space-y-4">
            {aliados.length > 0 && <Grupo titulo="Grupo" cor="text-emerald-400">{aliados.map((c) => <CombatantRow key={c.id} c={c} atual={atual?.id === c.id} onPatch={(p) => patchC(c.id, p)} onRemove={() => removerC(c.id)} />)}</Grupo>}
            {inimigos.length > 0 && <Grupo titulo="Inimigos" cor="text-dragon-400">{inimigos.map((c) => <CombatantRow key={c.id} c={c} atual={atual?.id === c.id} onPatch={(p) => patchC(c.id, p)} onRemove={() => removerC(c.id)} />)}</Grupo>}
          </div>
        </>
      )}
    </div>
  )
}

function Grupo({ titulo, cor, children }: { titulo: string; cor: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className={`mb-2 text-sm font-semibold uppercase tracking-widest ${cor}`}>{titulo}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function CombatantRow({
  c,
  atual,
  onPatch,
  onRemove,
}: {
  c: Combatant
  atual: boolean
  onPatch: (p: Partial<Combatant>) => void
  onRemove: () => void
}) {
  const st = statusPV(c.pvAtual, c.pvMax)
  const ajusta = (d: number) => onPatch({ pvAtual: Math.max(0, Math.min(c.pvMax, c.pvAtual + d)) })
  const inimigo = c.origem === 'inimigo'

  return (
    <div className={`card gv-fade p-3 transition ${atual ? 'ring-2 ring-dragon-500' : ''} ${c.pvAtual <= 0 ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Iniciativa */}
        <div className="flex shrink-0 flex-col items-center">
          <span className="panel-title text-[10px]">Inic.</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={c.iniciativa ?? ''}
              placeholder="—"
              onChange={(e) => { const n = parseInt(e.target.value, 10); onPatch({ iniciativa: Number.isNaN(n) ? null : n }) }}
              className="w-11 rounded-md border border-white/10 bg-ink-900/70 px-1 py-1 text-center text-sm outline-none focus:border-arcane-400"
            />
            <button className="rounded-md border border-white/10 px-1.5 py-1 text-xs hover:bg-white/5" title="Rolar iniciativa" onClick={() => onPatch({ iniciativa: rolarIniciativa(c.iniciativaMod) })}>🎲</button>
          </div>
        </div>

        {/* Avatar + nome */}
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-ink-900/60 text-sm ring-2" style={{ '--tw-ring-color': inimigo ? 'rgba(163,49,43,.5)' : 'rgba(47,143,91,.5)' } as React.CSSProperties}>
          {c.imagemUrl ? <img src={c.imagemUrl} alt="" className="h-full w-full object-cover" /> : inimigo ? '🐾' : '🧙'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input value={c.nome} onChange={(e) => onPatch({ nome: e.target.value })} className="min-w-0 flex-1 bg-transparent font-medium text-parchment-50 outline-none focus:underline" />
            {inimigo && (
              <button
                onClick={() => onPatch({ nomeOculto: !c.nomeOculto })}
                title={c.nomeOculto ? 'Nome oculto dos jogadores' : 'Nome visível aos jogadores'}
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${c.nomeOculto ? 'bg-dragon-500/25 text-dragon-400' : 'text-parchment-200/40 hover:text-parchment-100'}`}
              >
                {c.nomeOculto ? '🙈 nome oculto' : '👁 nome visível'}
              </button>
            )}
          </div>
          <p className="text-xs text-parchment-200/50">CA {c.ca} · <span className={st.texto}>{st.label}</span></p>
        </div>

        {/* PV */}
        <div className="flex items-center gap-1">
          <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => ajusta(-5)}>−5</button>
          <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => ajusta(-1)}>−1</button>
          <div className="w-16 text-center">
            <input type="number" value={c.pvAtual} onChange={(e) => { const n = parseInt(e.target.value, 10); onPatch({ pvAtual: Math.max(0, Math.min(c.pvMax, Number.isNaN(n) ? 0 : n)) }) }} className="w-16 rounded-md border border-white/10 bg-ink-900/70 px-1 py-0.5 text-center text-sm outline-none focus:border-arcane-400" />
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-black/40"><div className={`hpbar ${st.cor}`} style={{ width: `${st.pct}%` }} /></div>
            <div className="text-[10px] text-parchment-200/40">/ {c.pvMax}</div>
          </div>
          <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => ajusta(1)}>+1</button>
          <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => ajusta(5)}>+5</button>
        </div>

        <button onClick={onRemove} className="shrink-0 px-1 text-parchment-200/40 hover:text-dragon-400" aria-label="Remover">✕</button>
      </div>

      <CondicoesEditor condicoes={c.condicoes} onChange={(cond) => onPatch({ condicoes: cond })} />
    </div>
  )
}

function CondicoesEditor({ condicoes, onChange }: { condicoes: string[]; onChange: (c: string[]) => void }) {
  const disponiveis = CONDICOES.filter((c) => !condicoes.includes(c.nome))
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-2">
      {condicoes.map((nome) => (
        <button key={nome} onClick={() => onChange(condicoes.filter((x) => x !== nome))} title="Remover condição" className="chip border-dragon-400/40 bg-dragon-500/15 text-parchment-100 hover:bg-dragon-500/25">
          {nome} ✕
        </button>
      ))}
      <select
        value=""
        onChange={(e) => { if (e.target.value) onChange([...condicoes, e.target.value]) }}
        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-parchment-200/60 outline-none"
      >
        <option value="">＋ condição</option>
        {disponiveis.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
function AddCombatentes({ battle, update }: { battle: Battle; update: UpdateFn }) {
  const { monstros } = useBestiary()
  const [monstroId, setMonstroId] = useState('')
  const [qtd, setQtd] = useState(1)
  const fichas = useMemo(() => loadCharacters(), [])

  const naBatalha = new Set(battle.combatentes.map((c) => c.refId))

  function addMonstro() {
    const m = monstros.find((x) => x.id === monstroId)
    if (!m) return
    update({ combatentes: [...battle.combatentes, ...combatentesDeMonstro(m as Monster, qtd)] })
  }

  return (
    <div className="card p-4">
      <h2 className="mb-3 text-lg text-parchment-100">Montar encontro</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Aliados (fichas) */}
        <div>
          <p className="mb-2 panel-title">Grupo (suas fichas)</p>
          {fichas.length === 0 ? (
            <p className="text-sm text-parchment-200/50">Crie personagens na aba Fichas para adicioná-los como aliados.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {fichas.map((c) => (
                <button key={c.id} className={`chip hover:border-emerald-400/60 ${naBatalha.has(c.id) ? 'opacity-40' : ''}`} onClick={() => update({ combatentes: [...battle.combatentes, combatenteDePersonagem(c)] })}>
                  ＋ {c.nome || 'Aventureiro'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Inimigos */}
        <div>
          <p className="mb-2 panel-title">Inimigos (Bestiário)</p>
          {monstros.length === 0 ? (
            <p className="text-sm text-parchment-200/50">Cadastre criaturas no Bestiário para adicioná-las aqui.</p>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <select className="stat-input flex-1" value={monstroId} onChange={(e) => setMonstroId(e.target.value)}>
                <option value="">Escolha uma criatura…</option>
                {monstros.map((m) => <option key={m.id} value={m.id}>{m.nome || 'Sem nome'} (ND {m.nd})</option>)}
              </select>
              <input type="number" min={1} max={20} value={qtd} onChange={(e) => setQtd(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-16 rounded-lg border border-white/10 bg-ink-900/60 px-2 py-2 text-center text-sm outline-none focus:border-arcane-400" title="Quantidade" />
              <button className="btn-primary" disabled={!monstroId} onClick={addMonstro}>＋ Add</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Visão dos Jogadores
// ---------------------------------------------------------------------------
function PlayerView({ battle, ordenados }: { battle: Battle; ordenados: Combatant[] }) {
  const inimigos = ordenados.filter((c) => c.origem === 'inimigo')
  const aliados = ordenados.filter((c) => c.origem === 'aliado')
  const atual = battle.emAndamento ? ordenados[battle.turnoIndex] : null
  const vivos = inimigos.filter((c) => c.pvAtual > 0).length

  if (battle.combatentes.length === 0) {
    return <div className="card p-10 text-center text-sm text-parchment-200/60">Nenhuma batalha em andamento. Na Visão do DM, monte um encontro para os jogadores verem os inimigos aqui.</div>
  }

  return (
    <div className="space-y-5">
      {/* Turno */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-dragon-500/15 px-3 py-1.5 text-sm font-semibold text-parchment-50">Rodada {battle.rodada}</span>
          {atual ? <span className="text-sm text-parchment-100">Turno de <b className="text-dragon-400">{nomePublico(atual)}</b></span> : <span className="text-sm text-parchment-200/60">Aguardando início do combate…</span>}
        </div>
        <span className="text-sm text-parchment-200/70">Inimigos em pé: <b className="text-parchment-50">{vivos}</b></span>
      </div>

      {/* Ordem de iniciativa */}
      {battle.emAndamento && (
        <div className="card p-4">
          <p className="mb-2 panel-title">Ordem de iniciativa</p>
          <ol className="flex flex-wrap gap-2">
            {ordenados.map((c) => (
              <li key={c.id} className={`chip ${atual?.id === c.id ? 'border-dragon-400 bg-dragon-500/25 text-parchment-50' : ''} ${c.pvAtual <= 0 ? 'opacity-40 line-through' : ''}`}>
                {c.iniciativa != null && <span className="text-parchment-200/50">{c.iniciativa}</span>} {nomePublico(c)}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Inimigos */}
      <div>
        <h2 className="mb-3 text-lg text-parchment-100">Inimigos ({inimigos.length})</h2>
        {inimigos.length === 0 ? (
          <p className="text-sm text-parchment-200/50">Nenhum inimigo no encontro.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inimigos.map((c) => <EnemyCard key={c.id} c={c} destaque={atual?.id === c.id} />)}
          </div>
        )}
      </div>

      {/* Grupo */}
      {aliados.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg text-parchment-100">Seu grupo ({aliados.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aliados.map((c) => <AllyCard key={c.id} c={c} destaque={atual?.id === c.id} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function EnemyCard({ c, destaque }: { c: Combatant; destaque: boolean }) {
  const nome = c.nomeOculto ? '???' : c.nome
  const img = c.imagemJogadorUrl || c.imagemUrl
  const st = statusPV(c.pvAtual, c.pvMax)
  const morto = c.pvAtual <= 0
  return (
    <div className={`card gv-fade overflow-hidden ${destaque ? 'ring-2 ring-dragon-500' : ''} ${morto ? 'opacity-50' : ''}`}>
      <div className="relative h-32 w-full overflow-hidden bg-ink-900/60">
        {img ? <img src={img} alt={nome} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-4xl opacity-40">🐾</div>}
        {morto && <div className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-semibold text-parchment-100">Derrotado</div>}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink-900 to-transparent p-2">
          <span className="font-display text-parchment-50 drop-shadow">{nome}</span>
          <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${st.texto} bg-black/40`}>{st.label}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="h-2 overflow-hidden rounded-full bg-black/40"><div className={`hpbar ${st.cor}`} style={{ width: `${st.pct}%` }} /></div>
        {c.condicoes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {c.condicoes.map((n) => <span key={n} className="chip border-dragon-400/40 bg-dragon-500/15 text-[10px]">{n}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}

function AllyCard({ c, destaque }: { c: Combatant; destaque: boolean }) {
  const st = statusPV(c.pvAtual, c.pvMax)
  return (
    <div className={`card gv-fade flex items-center gap-3 p-3 ${destaque ? 'ring-2 ring-emerald-500' : ''} ${c.pvAtual <= 0 ? 'opacity-50' : ''}`}>
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-arcane-600/30 ring-2 ring-emerald-500/40">
        {c.imagemUrl ? <img src={c.imagemUrl} alt="" className="h-full w-full object-cover" /> : '🧙'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-parchment-50">{c.nome}</p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40"><div className={`hpbar ${st.cor}`} style={{ width: `${st.pct}%` }} /></div>
        {c.condicoes.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {c.condicoes.map((n) => <span key={n} className="chip border-amber-400/40 bg-amber-500/15 text-[10px]">{n}</span>)}
          </div>
        )}
      </div>
      <span className="shrink-0 text-sm tabular-nums text-parchment-100">{c.pvAtual}/{c.pvMax}</span>
    </div>
  )
}

// Nome mostrado aos jogadores (o DM pode ocultar o nome de um inimigo)
function nomePublico(c: Combatant): string {
  if (c.origem === 'inimigo' && c.nomeOculto) return '???'
  return c.nome
}
