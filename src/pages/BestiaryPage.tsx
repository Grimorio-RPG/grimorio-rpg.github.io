import { useMemo, useRef, useState } from 'react'
import type { KnowledgeLevel, Monster, MonsterAction } from '../types'
import { useBestiary } from '../hooks/useBestiary'
import {
  NDS,
  NIVEIS_CONHECIMENTO,
  TAMANHOS,
  TIPOS,
  imageToDataUrl,
  nivelInfo,
  novoMonstro,
} from '../lib/bestiary'
import { uid } from '../lib/character'
import { abilityMod, fmtMod } from '../lib/calc'
import { ABILITIES } from '../data/rules'
import {
  Field,
  NumberField,
  SelectField,
  TextArea,
  TextField,
} from '../components/ui'
import { EmptyState, FilterChip, PageHeader, Toolbar, ViewToggle } from '../components/layout-ui'

type Modo = 'dm' | 'jogadores'
type FiltroNivel = KnowledgeLevel | 'todos'

export default function BestiaryPage() {
  const { monstros, salvar, remover } = useBestiary()
  const [modo, setModo] = useState<Modo>('dm')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroNivel>('todos')
  const [editando, setEditando] = useState<Monster | null>(null)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const arr = monstros.filter((m) => {
      if (filtro !== 'todos' && m.conhecimento !== filtro) return false
      if (!q) return true
      return `${m.nome} ${m.tipo}`.toLowerCase().includes(q)
    })
    return [...arr].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [monstros, busca, filtro])

  const conhecidos = useMemo(
    () => monstros
      .filter((m) => m.conhecimento !== 'desconhecido')
      .filter((m) => !busca.trim() || `${m.nome} ${m.tipo}`.toLowerCase().includes(busca.trim().toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [monstros, busca],
  )

  function duplicar(m: Monster) {
    salvar({ ...m, id: uid(), nome: `${m.nome} (cópia)`, updatedAt: Date.now() })
  }

  return (
    <div>
      <PageHeader
        icon="🐲"
        titulo="Bestiário"
        subtitulo="Cadastre inimigos com foto e estatísticas. Controle o que o grupo já descobriu sobre cada criatura."
        acoes={
          <ViewToggle
            valor={modo}
            onChange={setModo}
            opcoes={[
              { valor: 'dm', label: '🎲 Visão do DM' },
              { valor: 'jogadores', label: '👥 Visão dos Jogadores' },
            ]}
          />
        }
      />

      {modo === 'dm' ? (
        <>
          <Toolbar>
            <button className="btn-primary" onClick={() => setEditando(novoMonstro())}>＋ Novo monstro</button>
            <input
              className="stat-input w-full max-w-xs"
              value={busca}
              placeholder="Buscar por nome ou tipo…"
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-1">
              <FilterChip ativo={filtro === 'todos'} onClick={() => setFiltro('todos')}>
                Todas ({monstros.length})
              </FilterChip>
              {NIVEIS_CONHECIMENTO.map((n) => {
                const qtd = monstros.filter((m) => m.conhecimento === n.valor).length
                return (
                  <FilterChip key={n.valor} ativo={filtro === n.valor} onClick={() => setFiltro(n.valor)}>
                    {n.icone} {n.curto} ({qtd})
                  </FilterChip>
                )
              })}
            </div>
          </Toolbar>

          {filtrados.length === 0 ? (
            <EmptyState
              icon="🐉"
              titulo={monstros.length === 0 ? 'Bestiário vazio' : 'Nenhuma criatura encontrada'}
              texto={monstros.length === 0 ? 'Crie sua primeira criatura para começar a preencher a mesa de perigos.' : 'Ajuste a busca ou os filtros.'}
              acao={monstros.length === 0 ? <button className="btn-primary" onClick={() => setEditando(novoMonstro())}>＋ Criar criatura</button> : undefined}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((m) => (
                <DmMonsterCard
                  key={m.id}
                  m={m}
                  onEdit={() => setEditando(m)}
                  onDuplicate={() => duplicar(m)}
                  onDelete={() => {
                    if (confirm(`Remover "${m.nome || 'monstro'}" do bestiário?`)) remover(m.id)
                  }}
                  onHp={(pvAtual) => salvar({ ...m, pvAtual })}
                  onNivel={(conhecimento) => salvar({ ...m, conhecimento })}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <PlayerView monstros={conhecidos} busca={busca} setBusca={setBusca} />
      )}

      {editando && (
        <MonsterEditor
          inicial={editando}
          onClose={() => setEditando(null)}
          onSave={(m) => {
            salvar(m)
            setEditando(null)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card do DM
// ---------------------------------------------------------------------------
function DmMonsterCard({
  m,
  onEdit,
  onDuplicate,
  onDelete,
  onHp,
  onNivel,
}: {
  m: Monster
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onHp: (pv: number) => void
  onNivel: (n: KnowledgeLevel) => void
}) {
  const pct = m.pvMax > 0 ? Math.max(0, Math.min(100, (m.pvAtual / m.pvMax) * 100)) : 0
  const cor = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-dragon-500'
  const ajusta = (d: number) => onHp(Math.max(0, Math.min(m.pvMax, m.pvAtual + d)))
  const nivel = nivelInfo(m.conhecimento)
  const ferido = m.pvAtual < m.pvMax

  return (
    <div className="card gv-fade group relative overflow-hidden transition hover:ring-1 hover:ring-dragon-500/40">
      <div className="relative h-36 w-full overflow-hidden bg-ink-900/60">
        {m.imagemUrl ? (
          <img src={m.imagemUrl} alt={m.nome} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl opacity-40">🐾</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-parchment-100 backdrop-blur" title={nivel.label}>
          {nivel.icone} {nivel.curto}
        </span>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink-900 via-ink-900/70 to-transparent p-3">
          <div>
            <p className="font-display text-lg leading-tight text-parchment-50 drop-shadow">{m.nome || 'Sem nome'}</p>
            <p className="text-xs text-parchment-100/80">{[m.tamanho, m.tipo].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="chip">ND {m.nd}</span>
          <span className="chip">CA {m.ca}</span>
          <span className="chip">Desl. {m.deslocamento}</span>
        </div>

        {/* Nível de conhecimento do grupo */}
        <label className="mb-3 block">
          <span className="mb-1 flex items-center gap-1 panel-title">Conhecimento do grupo</span>
          <div className="flex items-center gap-2">
            <span className="text-base" title={nivel.label}>{nivel.icone}</span>
            <select
              value={m.conhecimento}
              onChange={(e) => onNivel(e.target.value as KnowledgeLevel)}
              className="stat-input flex-1 appearance-none py-1.5 text-sm"
            >
              {NIVEIS_CONHECIMENTO.map((n) => (
                <option key={n.valor} value={n.valor}>{n.label}</option>
              ))}
            </select>
          </div>
        </label>

        {/* Rastreador de PV */}
        <div className="rounded-lg border border-white/10 bg-ink-900/40 p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="panel-title">Pontos de Vida</span>
            <span className="flex items-center gap-2">
              {ferido && (
                <button className="text-[10px] text-arcane-400 hover:underline" onClick={() => onHp(m.pvMax)} title="Restaurar vida cheia">
                  restaurar
                </button>
              )}
              <span className="tabular-nums text-parchment-100">{m.pvAtual} / {m.pvMax}</span>
            </span>
          </div>
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-black/40">
            <div className={`hpbar ${cor}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-ghost flex-1 px-1 py-1 text-xs" onClick={() => ajusta(-5)}>−5</button>
            <button className="btn-ghost flex-1 px-1 py-1 text-xs" onClick={() => ajusta(-1)}>−1</button>
            <input
              type="number"
              value={m.pvAtual}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                onHp(Math.max(0, Math.min(m.pvMax, Number.isNaN(n) ? 0 : n)))
              }}
              className="w-12 shrink-0 rounded-md border border-white/10 bg-ink-800 px-1 py-1 text-center text-sm outline-none focus:border-arcane-400"
            />
            <button className="btn-ghost flex-1 px-1 py-1 text-xs" onClick={() => ajusta(1)}>+1</button>
            <button className="btn-ghost flex-1 px-1 py-1 text-xs" onClick={() => ajusta(5)}>+5</button>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="btn-ghost flex-1 py-1.5 text-xs" onClick={onEdit}>Editar / ver ficha</button>
          <button className="btn-ghost px-2 py-1.5 text-xs text-parchment-200/50 hover:text-parchment-50" onClick={onDuplicate} title="Duplicar criatura" aria-label="Duplicar">⧉</button>
          <button
            className="btn-ghost px-2 py-1.5 text-xs text-parchment-200/50 hover:text-dragon-400"
            onClick={onDelete}
            aria-label="Remover"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Visão dos Jogadores
// ---------------------------------------------------------------------------
function PlayerView({
  monstros,
  busca,
  setBusca,
}: {
  monstros: Monster[]
  busca: string
  setBusca: (v: string) => void
}) {
  return (
    <>
      <div className="mb-4 rounded-lg border border-arcane-400/30 bg-arcane-500/10 p-3 text-sm text-parchment-100">
        👥 Esta é a tela que você mostra aos jogadores. Aparecem só as criaturas que
        o grupo já <b>encontrou</b> ou <b>estudou</b> — no nível de detalhe que você liberou.
      </div>
      <div className="mb-6">
        <input
          className="stat-input max-w-xs"
          value={busca}
          placeholder="Buscar…"
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      {monstros.length === 0 ? (
        <EmptyState
          icon="🔍"
          titulo="Nada revelado ainda"
          texto="Na Visão do DM, marque as criaturas como Encontrado ou Estudado para que apareçam aqui."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {monstros.map((m) => (
            <PlayerMonsterCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </>
  )
}

function PlayerMonsterCard({ m }: { m: Monster }) {
  const nivel = nivelInfo(m.conhecimento)
  const img = m.imagemJogadorUrl || m.imagemUrl
  const mostraStats = m.conhecimento === 'parcial' || m.conhecimento === 'completo'
  const mostraFicha = m.conhecimento === 'completo'

  return (
    <div className="card overflow-hidden">
      <div className="relative h-40 w-full overflow-hidden bg-ink-900/60">
        {img ? (
          <img src={img} alt={m.nome} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl opacity-40">🐾</div>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-parchment-100 backdrop-blur">
          {nivel.icone} {nivel.curto}
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900 to-transparent p-3">
          <p className="font-display text-lg leading-tight text-parchment-50 drop-shadow">{m.nome || '???'}</p>
          <p className="text-xs text-parchment-100/80">{[m.tamanho, m.tipo].filter(Boolean).join(' · ')}</p>
        </div>
      </div>

      <div className="p-4 text-sm">
        {!mostraStats ? (
          <p className="text-parchment-200/60">
            O grupo viu esta criatura, mas ainda não a estudou. Investigue-a para
            revelar suas estatísticas.
          </p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="chip">ND {m.nd}</span>
              <span className="chip">CA {m.ca}</span>
              <span className="chip">PV {m.pvMax}</span>
              <span className="chip">Desl. {m.deslocamento}</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {ABILITIES.map((a) => (
                <div key={a.key} className="rounded-lg border border-white/10 bg-ink-900/40 py-1 text-center">
                  <div className="panel-title text-[10px]">{a.abrev}</div>
                  <div className="font-display text-sm text-parchment-50">{fmtMod(abilityMod(m.atributos[a.key]))}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {mostraFicha && (m.tracos || m.acoes.length > 0) && (
          <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
            {m.tracos && (
              <div>
                <h4 className="mb-1 panel-title">Traços</h4>
                <p className="whitespace-pre-wrap leading-relaxed text-parchment-100">{m.tracos}</p>
              </div>
            )}
            {m.acoes.length > 0 && (
              <div>
                <h4 className="mb-1 panel-title">Ações</h4>
                <ul className="space-y-1">
                  {m.acoes.map((a) => (
                    <li key={a.id}>
                      <span className="font-medium text-parchment-50">{a.nome || '—'}.</span>{' '}
                      <span className="text-parchment-200/80">{a.descricao}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------
function MonsterEditor({
  inicial,
  onClose,
  onSave,
}: {
  inicial: Monster
  onClose: () => void
  onSave: (m: Monster) => void
}) {
  const [m, setM] = useState<Monster>(inicial)

  function set(patch: Partial<Monster>) {
    setM((prev) => ({ ...prev, ...patch }))
  }

  function addAcao() {
    const nova: MonsterAction = { id: uid(), nome: '', descricao: '' }
    set({ acoes: [...m.acoes, nova] })
  }
  function patchAcao(id: string, p: Partial<MonsterAction>) {
    set({ acoes: m.acoes.map((a) => (a.id === id ? { ...a, ...p } : a)) })
  }
  function removeAcao(id: string) {
    set({ acoes: m.acoes.filter((a) => a.id !== id) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card my-8 w-full max-w-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl text-parchment-50">{inicial.nome ? 'Editar criatura' : 'Nova criatura'}</h2>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        </div>

        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          {/* Imagens */}
          <div className="grid grid-cols-2 gap-3">
            <ImageSlot
              titulo="Foto do DM"
              hint="Sua referência completa."
              url={m.imagemUrl}
              onChange={(url) => set({ imagemUrl: url })}
            />
            <ImageSlot
              titulo="Foto dos jogadores"
              hint="O que o grupo vê ao encontrar. Vazio = usa a foto do DM."
              url={m.imagemJogadorUrl}
              onChange={(url) => set({ imagemJogadorUrl: url })}
            />
          </div>

          {/* Campos principais */}
          <div className="space-y-3">
            <Field label="Nome">
              <TextField value={m.nome} onChange={(v) => set({ nome: v })} placeholder="Ex: Dragão Vermelho Jovem" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tamanho">
                <SelectField value={m.tamanho} onChange={(v) => set({ tamanho: v })} options={TAMANHOS.map((t) => ({ value: t, label: t }))} />
              </Field>
              <Field label="Tipo">
                <SelectField value={TIPOS.find((t) => m.tipo.startsWith(t)) ?? ''} onChange={(v) => set({ tipo: v })} options={TIPOS.map((t) => ({ value: t, label: t }))} />
              </Field>
            </div>
            <Field label="Conhecimento do grupo" hint="Define o que os jogadores veem na Visão dos Jogadores.">
              <SelectField
                value={m.conhecimento}
                onChange={(v) => set({ conhecimento: v as KnowledgeLevel })}
                options={NIVEIS_CONHECIMENTO.map((n) => ({ value: n.valor, label: `${n.icone} ${n.label}` }))}
                placeholder=""
              />
            </Field>
          </div>
        </div>

        {/* Estatísticas de combate */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="ND" hint="Nível de Desafio: o quão perigoso é o monstro.">
            <SelectField value={m.nd} onChange={(v) => set({ nd: v })} options={NDS.map((n) => ({ value: n, label: n }))} placeholder="" />
          </Field>
          <Field label="CA">
            <NumberField value={m.ca} onChange={(v) => set({ ca: v })} />
          </Field>
          <Field label="PV Máx.">
            <NumberField value={m.pvMax} onChange={(v) => set({ pvMax: v, pvAtual: Math.min(m.pvAtual, v) })} />
          </Field>
          <Field label="PV Atual">
            <NumberField value={m.pvAtual} onChange={(v) => set({ pvAtual: v })} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Deslocamento">
            <TextField value={m.deslocamento} onChange={(v) => set({ deslocamento: v })} placeholder="9 m, voo 18 m" />
          </Field>
        </div>

        {/* Atributos */}
        <div className="mt-5">
          <h3 className="mb-2 panel-title">Atributos</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ABILITIES.map((a) => (
              <div key={a.key} className="rounded-lg border border-white/10 bg-ink-900/40 p-2 text-center">
                <div className="panel-title">{a.abrev}</div>
                <div className="font-display text-base text-parchment-50">{fmtMod(abilityMod(m.atributos[a.key]))}</div>
                <input
                  type="number"
                  value={m.atributos[a.key]}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    set({ atributos: { ...m.atributos, [a.key]: Number.isNaN(n) ? 0 : n } })
                  }}
                  className="mt-1 w-12 rounded-md border border-white/10 bg-ink-800 px-1 py-0.5 text-center text-sm outline-none focus:border-arcane-400"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Traços */}
        <div className="mt-5">
          <Field label="Traços & habilidades passivas" hint="Resistências, imunidades, sentidos, habilidades especiais.">
            <TextArea value={m.tracos} onChange={(v) => set({ tracos: v })} rows={3} placeholder="Ex: Imune a fogo. Visão no escuro 18 m." />
          </Field>
        </div>

        {/* Ações */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="panel-title">Ações</h3>
            <button className="btn-ghost py-1 text-xs" onClick={addAcao}>＋ Adicionar ação</button>
          </div>
          {m.acoes.length === 0 ? (
            <p className="text-sm text-parchment-200/50">Nenhuma ação. Adicione ataques e habilidades usáveis em combate.</p>
          ) : (
            <div className="space-y-2">
              {m.acoes.map((a) => (
                <div key={a.id} className="flex gap-2">
                  <input className="stat-input w-40" value={a.nome} placeholder="Mordida" onChange={(e) => patchAcao(a.id, { nome: e.target.value })} />
                  <input className="stat-input flex-1" value={a.descricao} placeholder="+5 para acertar, 2d6+3 perfurante." onChange={(e) => patchAcao(a.id, { descricao: e.target.value })} />
                  <button onClick={() => removeAcao(a.id)} className="px-2 text-parchment-200/40 hover:text-dragon-400" aria-label="Remover ação">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Táticas do DM */}
        <div className="mt-5">
          <Field label="Táticas do DM (sempre privadas)" hint="Como jogar essa criatura em combate. Nunca aparece para os jogadores.">
            <TextArea value={m.taticas} onChange={(v) => set({ taticas: v })} rows={2} placeholder="Ex: foca nos conjuradores, usa sopro quando 3+ alvos estão agrupados." />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(m)}>Salvar criatura</button>
        </div>
      </div>
    </div>
  )
}

// Slot reutilizável de imagem (upload com redimensionamento ou URL)
function ImageSlot({
  titulo,
  hint,
  url,
  onChange,
}: {
  titulo: string
  hint: string
  url: string
  onChange: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [carregando, setCarregando] = useState(false)

  async function onFile(file: File) {
    setCarregando(true)
    try {
      onChange(await imageToDataUrl(file))
    } catch {
      alert('Não consegui processar essa imagem.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-1 panel-title">{titulo}</div>
      <div className="aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-ink-900/60">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl opacity-30">🐾</div>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <button className="btn-ghost flex-1 py-1.5 text-xs" onClick={() => fileRef.current?.click()} disabled={carregando}>
          {carregando ? 'Processando…' : '📷 Enviar'}
        </button>
        {url && <button className="btn-ghost px-2 py-1.5 text-xs" onClick={() => onChange('')}>✕</button>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
      <p className="mt-1 text-[11px] leading-snug text-parchment-200/40">{hint}</p>
      <input
        className="stat-input mt-1 py-1 text-xs"
        value={url.startsWith('data:') ? '' : url}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ou cole uma URL…"
      />
    </div>
  )
}

