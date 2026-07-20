import { useMemo, useRef, useState } from 'react'
import type { Monster, MonsterAction } from '../types'
import { useBestiary } from '../hooks/useBestiary'
import {
  NDS,
  TAMANHOS,
  TIPOS,
  imageToDataUrl,
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

export default function BestiaryPage() {
  const { monstros, salvar, remover } = useBestiary()
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<Monster | null>(null)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const arr = q
      ? monstros.filter((m) => `${m.nome} ${m.tipo}`.toLowerCase().includes(q))
      : monstros
    return [...arr].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [monstros, busca])

  function criar() {
    setEditando(novoMonstro())
  }

  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        <span className="text-3xl">🐲</span>
        <div>
          <h1 className="text-3xl text-parchment-50">Bestiário</h1>
          <p className="mt-1 max-w-2xl text-sm text-parchment-200/60">
            Cadastre inimigos com foto e estatísticas. Use o rastreador de PV
            durante o combate para controlar a vida de cada criatura.
          </p>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={criar}>＋ Novo monstro</button>
        <input
          className="stat-input max-w-xs"
          value={busca}
          placeholder="Buscar por nome ou tipo…"
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl">🐉</div>
          <h3 className="mt-3 text-xl text-parchment-50">
            {busca ? 'Nenhum monstro encontrado' : 'Bestiário vazio'}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-parchment-200/60">
            {busca ? 'Tente outra busca.' : 'Crie sua primeira criatura para começar a preencher a mesa de perigos.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((m) => (
            <MonsterCard
              key={m.id}
              m={m}
              onEdit={() => setEditando(m)}
              onDelete={() => {
                if (confirm(`Remover "${m.nome || 'monstro'}" do bestiário?`)) remover(m.id)
              }}
              onHp={(pvAtual) => salvar({ ...m, pvAtual })}
              onReveal={() => salvar({ ...m, revelado: !m.revelado })}
            />
          ))}
        </div>
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
function MonsterCard({
  m,
  onEdit,
  onDelete,
  onHp,
  onReveal,
}: {
  m: Monster
  onEdit: () => void
  onDelete: () => void
  onHp: (pv: number) => void
  onReveal: () => void
}) {
  const pct = m.pvMax > 0 ? Math.max(0, Math.min(100, (m.pvAtual / m.pvMax) * 100)) : 0
  const cor = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-dragon-500'
  const ajusta = (d: number) => onHp(Math.max(0, Math.min(m.pvMax, m.pvAtual + d)))

  return (
    <div className="card group relative overflow-hidden">
      <div className="relative h-36 w-full overflow-hidden bg-ink-900/60">
        {m.imagemUrl ? (
          <img src={m.imagemUrl} alt={m.nome} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl opacity-40">🐾</div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink-900 to-transparent p-3">
          <div>
            <p className="font-display text-lg leading-tight text-parchment-50 drop-shadow">{m.nome || 'Sem nome'}</p>
            <p className="text-xs text-parchment-100/80">{[m.tamanho, m.tipo].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <button
          onClick={onReveal}
          title={m.revelado ? 'Revelado ao grupo' : 'Oculto do grupo'}
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs backdrop-blur ${
            m.revelado ? 'bg-arcane-500/70 text-parchment-50' : 'bg-black/40 text-parchment-100/70'
          }`}
        >
          {m.revelado ? '👁 revelado' : '🙈 oculto'}
        </button>
      </div>

      <div className="p-4">
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="chip">ND {m.nd}</span>
          <span className="chip">CA {m.ca}</span>
          <span className="chip">Desl. {m.deslocamento}</span>
        </div>

        {/* Rastreador de PV */}
        <div className="rounded-lg border border-white/10 bg-ink-900/40 p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="panel-title">Pontos de Vida</span>
            <span className="tabular-nums text-parchment-100">{m.pvAtual} / {m.pvMax}</span>
          </div>
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-black/40">
            <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
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
  const fileRef = useRef<HTMLInputElement>(null)
  const [carregandoImg, setCarregandoImg] = useState(false)

  function set(patch: Partial<Monster>) {
    setM((prev) => ({ ...prev, ...patch }))
  }

  async function onFile(file: File) {
    setCarregandoImg(true)
    try {
      const dataUrl = await imageToDataUrl(file)
      set({ imagemUrl: dataUrl })
    } catch {
      alert('Não consegui processar essa imagem.')
    } finally {
      setCarregandoImg(false)
    }
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

        <div className="grid gap-5 md:grid-cols-[180px_1fr]">
          {/* Imagem */}
          <div>
            <div className="aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-ink-900/60">
              {m.imagemUrl ? (
                <img src={m.imagemUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-5xl opacity-30">🐾</div>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <button className="btn-ghost flex-1 py-1.5 text-xs" onClick={() => fileRef.current?.click()} disabled={carregandoImg}>
                {carregandoImg ? 'Processando…' : '📷 Enviar foto'}
              </button>
              {m.imagemUrl && (
                <button className="btn-ghost px-2 py-1.5 text-xs" onClick={() => set({ imagemUrl: '' })}>✕</button>
              )}
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
            <div className="mt-2">
              <Field label="ou cole uma URL">
                <TextField value={m.imagemUrl.startsWith('data:') ? '' : m.imagemUrl} onChange={(v) => set({ imagemUrl: v })} placeholder="https://…" />
              </Field>
            </div>
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
            <div className="grid grid-cols-4 gap-3">
              <Field label="ND" hint="Nível de Desafio: o quão perigoso é o monstro.">
                <SelectField value={m.nd} onChange={(v) => set({ nd: v })} options={NDS.map((n) => ({ value: n, label: n }))} />
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
            <Field label="Deslocamento">
              <TextField value={m.deslocamento} onChange={(v) => set({ deslocamento: v })} placeholder="9 m, voo 18 m" />
            </Field>
          </div>
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
          <Field label="Táticas do DM (só você vê)" hint="Como jogar essa criatura em combate: prioridades de alvo, quando fugir, combos.">
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
