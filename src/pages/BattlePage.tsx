import { useState } from 'react'
import type { Battle, Combatant, Monster } from '../types'
import { useBattle } from '../hooks/useBattle'
import { useBestiary } from '../hooks/useBestiary'
import { useCampaign } from '../hooks/useCampaign'
import {
  batalhaVazia,
  combatenteDePersonagem,
  combatentesDeMonstro,
  ordenar,
  rolarIniciativa,
  statusPV,
} from '../lib/battle'

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
              Monte o encontro, controle iniciativa e vida. Mostre aos jogadores
              quais inimigos eles enfrentam.
            </p>
          </div>
        </div>
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
      </header>

      {modo === 'dm'
        ? <DmView battle={battle} update={update} ordenados={ordenados} />
        : <PlayerView battle={battle} ordenados={ordenados} />}
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
  function rolarInimigos() {
    update({
      combatentes: battle.combatentes.map((c) =>
        c.origem === 'inimigo' ? { ...c, iniciativa: rolarIniciativa(c.iniciativaMod) } : c,
      ),
    })
  }
  function iniciar() {
    update({ emAndamento: true, rodada: 1, turnoIndex: 0 })
  }
  function proximoTurno() {
    const n = ordenados.length
    if (n === 0) return
    const prox = battle.turnoIndex + 1
    if (prox >= n) update({ turnoIndex: 0, rodada: battle.rodada + 1 })
    else update({ turnoIndex: prox })
  }
  function encerrar() {
    update({ emAndamento: false })
  }
  function limpar() {
    if (confirm('Limpar toda a batalha? Os combatentes serão removidos.')) update(batalhaVazia())
  }

  return (
    <div className="space-y-5">
      <AddCombatentes battle={battle} update={update} />

      {battle.combatentes.length > 0 && (
        <>
          {/* Controles */}
          <div className="card flex flex-wrap items-center gap-3 p-4">
            <button className="btn-ghost" onClick={rolarInimigos}>🎲 Rolar iniciativa dos inimigos</button>
            {!battle.emAndamento ? (
              <button className="btn-primary" onClick={iniciar}>▶ Iniciar combate</button>
            ) : (
              <>
                <span className="chip">Rodada {battle.rodada}</span>
                <button className="btn-primary" onClick={proximoTurno}>Próximo turno →</button>
                <button className="btn-ghost" onClick={encerrar}>■ Encerrar</button>
              </>
            )}
            <button className="btn-ghost ml-auto text-parchment-200/50" onClick={limpar}>Limpar tudo</button>
          </div>

          {/* Lista de combatentes */}
          <div className="space-y-2">
            {ordenados.map((c) => (
              <CombatantRow
                key={c.id}
                c={c}
                atual={atual?.id === c.id}
                onPatch={(p) => patchC(c.id, p)}
                onRemove={() => removerC(c.id)}
              />
            ))}
          </div>
        </>
      )}
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
    <div className={`card flex flex-wrap items-center gap-3 p-3 ${atual ? 'ring-2 ring-dragon-500' : ''} ${c.pvAtual <= 0 ? 'opacity-50' : ''}`}>
      {atual && <span className="chip bg-dragon-500/30 text-parchment-50">▶ Turno</span>}

      {/* Iniciativa */}
      <div className="flex flex-col items-center">
        <span className="panel-title text-[10px]">Inic.</span>
        <input
          type="number"
          value={c.iniciativa ?? ''}
          placeholder="—"
          onChange={(e) => {
            const n = parseInt(e.target.value, 10)
            onPatch({ iniciativa: Number.isNaN(n) ? null : n })
          }}
          className="w-12 rounded-md border border-white/10 bg-ink-800 px-1 py-1 text-center text-sm outline-none focus:border-arcane-400"
        />
      </div>

      {/* Avatar + nome */}
      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-ink-900/60 text-sm">
        {c.imagemUrl ? <img src={c.imagemUrl} alt="" className="h-full w-full object-cover" /> : inimigo ? '🐾' : '🧙'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-parchment-50">{c.nome}</p>
        <p className="text-xs text-parchment-200/50">
          {inimigo ? 'Inimigo' : 'Aliado'} · CA {c.ca} · <span className={st.texto}>{st.label}</span>
        </p>
      </div>

      {/* PV */}
      <div className="flex items-center gap-1">
        <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => ajusta(-5)}>−5</button>
        <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => ajusta(-1)}>−1</button>
        <div className="w-16 text-center">
          <div className="text-sm tabular-nums text-parchment-100">{c.pvAtual}/{c.pvMax}</div>
          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-black/40">
            <div className={`h-full ${st.cor}`} style={{ width: `${st.pct}%` }} />
          </div>
        </div>
        <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => ajusta(1)}>+1</button>
        <button className="btn-ghost px-1.5 py-1 text-xs" onClick={() => ajusta(5)}>+5</button>
      </div>

      <button onClick={onRemove} className="px-1 text-parchment-200/40 hover:text-dragon-400" aria-label="Remover">✕</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
function AddCombatentes({ battle, update }: { battle: Battle; update: UpdateFn }) {
  const { monstros } = useBestiary()
  const { campaign } = useCampaign()
  const [monstroId, setMonstroId] = useState('')
  const [qtd, setQtd] = useState(1)

  const party = campaign?.party ?? []
  const naBatalha = new Set(battle.combatentes.map((c) => c.refId))

  function addMonstro() {
    const m = monstros.find((x) => x.id === monstroId)
    if (!m) return
    update({ combatentes: [...battle.combatentes, ...combatentesDeMonstro(m as Monster, qtd)] })
  }
  function addAliado(id: string) {
    const c = party.find((p) => p.id === id)
    if (!c) return
    update({ combatentes: [...battle.combatentes, combatenteDePersonagem(c)] })
  }

  return (
    <div className="card p-4">
      <h2 className="mb-3 text-lg text-parchment-100">Montar encontro</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Inimigos */}
        <div>
          <p className="mb-2 panel-title">Inimigos (do Bestiário)</p>
          {monstros.length === 0 ? (
            <p className="text-sm text-parchment-200/50">Cadastre criaturas no Bestiário para adicioná-las aqui.</p>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <select className="stat-input flex-1" value={monstroId} onChange={(e) => setMonstroId(e.target.value)}>
                <option value="">Escolha uma criatura…</option>
                {monstros.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome || 'Sem nome'} (ND {m.nd})</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={20}
                value={qtd}
                onChange={(e) => setQtd(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 rounded-lg border border-white/10 bg-ink-900/60 px-2 py-2 text-center text-sm outline-none focus:border-arcane-400"
                title="Quantidade"
              />
              <button className="btn-primary" disabled={!monstroId} onClick={addMonstro}>＋ Add</button>
            </div>
          )}
        </div>

        {/* Aliados */}
        <div>
          <p className="mb-2 panel-title">Aliados (do grupo da Campanha)</p>
          {party.length === 0 ? (
            <p className="text-sm text-parchment-200/50">Importe fichas no Painel do DM (Campanha) para adicionar o grupo.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {party.map((p) => (
                <button
                  key={p.id}
                  className={`chip hover:border-emerald-400/60 ${naBatalha.has(p.id) ? 'opacity-40' : ''}`}
                  onClick={() => addAliado(p.id)}
                >
                  ＋ {p.nome || 'Aventureiro'}
                </button>
              ))}
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
    return (
      <div className="card p-10 text-center text-sm text-parchment-200/60">
        Nenhuma batalha em andamento. Na Visão do DM, monte um encontro para que
        os jogadores vejam os inimigos aqui.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Faixa de turno */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="chip">Rodada {battle.rodada}</span>
          {atual ? (
            <span className="text-sm text-parchment-100">
              Turno de <b className="text-dragon-400">{nomePublico(atual)}</b>
            </span>
          ) : (
            <span className="text-sm text-parchment-200/60">Aguardando início do combate…</span>
          )}
        </div>
        <span className="text-sm text-parchment-200/70">
          Inimigos em pé: <b className="text-parchment-50">{vivos}</b>
        </span>
      </div>

      {/* Ordem de iniciativa */}
      {battle.emAndamento && (
        <div className="card p-4">
          <p className="mb-2 panel-title">Ordem de iniciativa</p>
          <ol className="flex flex-wrap gap-2">
            {ordenados.map((c) => (
              <li
                key={c.id}
                className={`chip ${atual?.id === c.id ? 'border-dragon-400 bg-dragon-500/20 text-parchment-50' : ''} ${c.pvAtual <= 0 ? 'opacity-40 line-through' : ''}`}
              >
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
            {inimigos.map((c) => <EnemyCard key={c.id} c={c} />)}
          </div>
        )}
      </div>

      {/* Aliados */}
      {aliados.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg text-parchment-100">Seu grupo ({aliados.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aliados.map((c) => {
              const st = statusPV(c.pvAtual, c.pvMax)
              return (
                <div key={c.id} className="card flex items-center gap-3 p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-arcane-600/30">
                    {c.imagemUrl ? <img src={c.imagemUrl} alt="" className="h-full w-full object-cover" /> : '🧙'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-parchment-50">{c.nome}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40">
                      <div className={`h-full ${st.cor}`} style={{ width: `${st.pct}%` }} />
                    </div>
                  </div>
                  <span className="text-sm tabular-nums text-parchment-100">{c.pvAtual}/{c.pvMax}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function EnemyCard({ c }: { c: Combatant }) {
  const oculto = c.conhecimento === 'desconhecido'
  const nome = oculto ? 'Criatura misteriosa' : c.nome
  const img = oculto ? '' : (c.imagemJogadorUrl || c.imagemUrl)
  const st = statusPV(c.pvAtual, c.pvMax)
  const mostraStats = c.conhecimento === 'parcial' || c.conhecimento === 'completo'

  return (
    <div className={`card overflow-hidden ${c.pvAtual <= 0 ? 'opacity-50' : ''}`}>
      <div className="relative h-28 w-full overflow-hidden bg-ink-900/60">
        {img ? (
          <img src={img} alt={nome} className={`h-full w-full object-cover ${oculto ? 'blur-md' : ''}`} />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl opacity-40">{oculto ? '❓' : '🐾'}</div>
        )}
        {c.pvAtual <= 0 && (
          <div className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-semibold text-parchment-100">Derrotado</div>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-parchment-50">{nome}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-xs font-semibold ${st.texto}`}>{st.label}</span>
          {mostraStats && <span className="chip">CA {c.ca}</span>}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40">
          <div className={`h-full ${st.cor}`} style={{ width: `${st.pct}%` }} />
        </div>
      </div>
    </div>
  )
}

// Nome mostrado aos jogadores (esconde nome de inimigos desconhecidos)
function nomePublico(c: Combatant): string {
  if (c.origem === 'inimigo' && c.conhecimento === 'desconhecido') return 'Criatura misteriosa'
  return c.nome
}
