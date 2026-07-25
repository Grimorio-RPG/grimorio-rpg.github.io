import { useMemo, useRef, useState } from 'react'
import type { Campaign, Handout, KnowledgeLevel, LoreEntry, LoreTipo } from '../types'
import {
  NIVEIS_REPUTACAO,
  TIPOS_LORE,
  novoHandout,
  novoVerbete,
  tipoLoreInfo,
} from '../lib/campaign'
import { NIVEIS_CONHECIMENTO, imageToDataUrl, nivelInfo } from '../lib/bestiary'
import { EmptyState, FilterChip, Modal } from './layout-ui'
import { Field, TextArea, TextField } from './ui'

type UpdateFn = (patch: Partial<Campaign>) => void

// ---------------------------------------------------------------------------
// Codex — visão do DM
// ---------------------------------------------------------------------------
export function CodexTab({
  campaign,
  update,
  visaoJogador,
}: {
  campaign: Campaign
  update: UpdateFn
  visaoJogador: boolean
}) {
  const [filtro, setFiltro] = useState<LoreTipo | 'todos'>('todos')
  const [editando, setEditando] = useState<LoreEntry | null>(null)

  const lista = useMemo(() => {
    let arr = campaign.codex
    if (visaoJogador) arr = arr.filter((v) => v.conhecimento !== 'desconhecido')
    if (filtro !== 'todos') arr = arr.filter((v) => v.tipo === filtro)
    return [...arr].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [campaign.codex, filtro, visaoJogador])

  function salvar(v: LoreEntry) {
    const existe = campaign.codex.some((x) => x.id === v.id)
    update({ codex: existe ? campaign.codex.map((x) => (x.id === v.id ? v : x)) : [...campaign.codex, v] })
    setEditando(null)
  }
  function remover(id: string) {
    update({
      codex: campaign.codex.filter((x) => x.id !== id),
      reputacoes: campaign.reputacoes.filter((r) => r.loreId !== id),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {!visaoJogador && (
          <button className="btn-primary" onClick={() => setEditando(novoVerbete())}>＋ Novo verbete</button>
        )}
        <FilterChip ativo={filtro === 'todos'} onClick={() => setFiltro('todos')}>Tudo ({lista.length})</FilterChip>
        {TIPOS_LORE.map((t) => (
          <FilterChip key={t.valor} ativo={filtro === t.valor} onClick={() => setFiltro(t.valor)}>
            {t.icone} {t.label}
          </FilterChip>
        ))}
      </div>

      {visaoJogador && (
        <p className="rounded-lg border border-arcane-400/30 bg-arcane-500/10 p-3 text-sm text-parchment-100">
          📖 O que o grupo descobriu sobre o mundo até agora. Novos verbetes aparecem
          conforme vocês exploram e investigam.
        </p>
      )}

      {lista.length === 0 ? (
        <EmptyState
          icon="📖"
          titulo={visaoJogador ? 'Nada descoberto ainda' : 'Codex vazio'}
          texto={visaoJogador
            ? 'Explorem o mundo e conversem com NPCs para preencher estas páginas.'
            : 'Cadastre locais, facções, divindades e segredos. Você controla o quanto o grupo sabe de cada um.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((v) => (
            <VerbeteCard
              key={v.id}
              v={v}
              visaoJogador={visaoJogador}
              reputacao={campaign.reputacoes.find((r) => r.loreId === v.id)?.valor}
              onEdit={() => setEditando(v)}
              onDelete={() => { if (confirm(`Remover "${v.nome || 'verbete'}" do codex?`)) remover(v.id) }}
              onNivel={(conhecimento) => update({ codex: campaign.codex.map((x) => (x.id === v.id ? { ...x, conhecimento } : x)) })}
            />
          ))}
        </div>
      )}

      {editando && <VerbeteEditor inicial={editando} onClose={() => setEditando(null)} onSave={salvar} />}
    </div>
  )
}

function VerbeteCard({
  v,
  visaoJogador,
  reputacao,
  onEdit,
  onDelete,
  onNivel,
}: {
  v: LoreEntry
  visaoJogador: boolean
  reputacao?: number
  onEdit: () => void
  onDelete: () => void
  onNivel: (n: KnowledgeLevel) => void
}) {
  const tipo = tipoLoreInfo(v.tipo)
  const nivel = nivelInfo(v.conhecimento)
  const mostraDescricao = v.conhecimento === 'parcial' || v.conhecimento === 'completo'
  const mostraTudo = v.conhecimento === 'completo'
  const rep = reputacao != null ? NIVEIS_REPUTACAO[Math.max(-3, Math.min(3, reputacao))] : null

  return (
    <div className="card gv-fade overflow-hidden">
      {v.imagemUrl && (
        <div className="h-28 w-full overflow-hidden bg-ink-900/60">
          <img src={v.imagemUrl} alt={v.nome} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight text-parchment-50">{v.nome || 'Sem nome'}</p>
            <p className="text-xs text-parchment-200/50">{tipo.icone} {tipo.label}</p>
          </div>
          <span className="chip shrink-0 text-[10px]" title={nivel.label}>{nivel.icone}</span>
        </div>

        {rep && (
          <p className={`mt-1 text-xs font-semibold ${rep.cor}`}>Reputação: {rep.label}</p>
        )}

        {v.resumo && <p className="mt-2 text-sm leading-relaxed text-parchment-200/80">{v.resumo}</p>}

        {mostraDescricao && v.descricao && (
          <p className="mt-2 whitespace-pre-wrap border-t border-white/10 pt-2 text-sm leading-relaxed text-parchment-100">
            {v.descricao}
          </p>
        )}
        {!mostraDescricao && v.descricao && (
          <p className="mt-2 text-xs italic text-parchment-200/40">Há mais a descobrir sobre isto…</p>
        )}
        {mostraTudo && !visaoJogador && v.segredos && (
          <p className="mt-2 whitespace-pre-wrap rounded-lg border border-dragon-400/30 bg-dragon-500/10 p-2 text-xs text-parchment-100">
            🗝️ {v.segredos}
          </p>
        )}
        {!visaoJogador && !mostraTudo && v.segredos && (
          <p className="mt-2 whitespace-pre-wrap rounded-lg border border-dragon-400/30 bg-dragon-500/10 p-2 text-xs text-parchment-100">
            🗝️ (só DM) {v.segredos}
          </p>
        )}

        {!visaoJogador && (
          <>
            <select
              value={v.conhecimento}
              onChange={(e) => onNivel(e.target.value as KnowledgeLevel)}
              className="stat-input mt-3 py-1.5 text-xs"
            >
              {NIVEIS_CONHECIMENTO.map((n) => (
                <option key={n.valor} value={n.valor}>
                  {n.icone} {n.valor === 'encontrado' ? 'Ouviu falar' : n.valor === 'parcial' ? 'Conhece' : n.label}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-2">
              <button className="btn-ghost flex-1 py-1.5 text-xs" onClick={onEdit}>Editar</button>
              <button className="btn-ghost px-2 py-1.5 text-xs text-parchment-200/50 hover:text-dragon-400" onClick={onDelete}>🗑</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function VerbeteEditor({
  inicial,
  onClose,
  onSave,
}: {
  inicial: LoreEntry
  onClose: () => void
  onSave: (v: LoreEntry) => void
}) {
  const [v, setV] = useState(inicial)
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (p: Partial<LoreEntry>) => setV((prev) => ({ ...prev, ...p }))

  return (
    <Modal onClose={onClose} titulo={inicial.nome ? 'Editar verbete' : 'Novo verbete'}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <Field label="Nome">
            <TextField value={v.nome} onChange={(n) => set({ nome: n })} placeholder="Ex: Barovia, Ordem da Chama Prateada…" />
          </Field>
          <Field label="Tipo">
            <select className="stat-input" value={v.tipo} onChange={(e) => set({ tipo: e.target.value as LoreTipo })}>
              {TIPOS_LORE.map((t) => <option key={t.valor} value={t.valor}>{t.icone} {t.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Resumo" hint="O que o grupo sabe assim que ouve falar do assunto.">
          <TextArea value={v.resumo} onChange={(n) => set({ resumo: n })} rows={2} placeholder="Uma linha que situa o grupo…" />
        </Field>

        <Field label="Descrição" hint="Detalhes revelados quando o grupo passa a conhecer de verdade.">
          <TextArea value={v.descricao} onChange={(n) => set({ descricao: n })} rows={4} placeholder="História, geografia, membros importantes, costumes…" />
        </Field>

        <Field label="Segredos (sempre privado do DM)" hint="Nunca aparece na Visão dos Jogadores, nem no nível completo.">
          <TextArea value={v.segredos} onChange={(n) => set({ segredos: n })} rows={2} placeholder="A verdade por trás…" />
        </Field>

        <div className="flex flex-wrap items-end gap-3">
          <Field label="Conhecimento do grupo" className="flex-1">
            <select className="stat-input" value={v.conhecimento} onChange={(e) => set({ conhecimento: e.target.value as KnowledgeLevel })}>
              {NIVEIS_CONHECIMENTO.map((n) => (
                <option key={n.valor} value={n.valor}>
                  {n.icone} {n.valor === 'encontrado' ? 'Ouviu falar' : n.valor === 'parcial' ? 'Conhece' : n.label}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <button className="btn-ghost py-2 text-xs" onClick={() => fileRef.current?.click()}>📷 Imagem</button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) set({ imagemUrl: await imageToDataUrl(f, 640, 0.75) })
                e.target.value = ''
              }}
            />
          </div>
          {v.imagemUrl && (
            <img src={v.imagemUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(v)}>Salvar verbete</button>
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Handouts
// ---------------------------------------------------------------------------
export function HandoutsTab({
  campaign,
  update,
  visaoJogador,
}: {
  campaign: Campaign
  update: UpdateFn
  visaoJogador: boolean
}) {
  const lista = visaoJogador ? campaign.handouts.filter((h) => h.revelado) : campaign.handouts

  function patch(id: string, p: Partial<Handout>) {
    update({ handouts: campaign.handouts.map((h) => (h.id === id ? { ...h, ...p } : h)) })
  }

  if (lista.length === 0) {
    return (
      <div className="space-y-4">
        {!visaoJogador && (
          <button className="btn-primary" onClick={() => update({ handouts: [...campaign.handouts, novoHandout()] })}>
            ＋ Novo handout
          </button>
        )}
        <EmptyState
          icon="📜"
          titulo={visaoJogador ? 'Nenhum documento ainda' : 'Sem handouts'}
          texto={visaoJogador
            ? 'Cartas, mapas e pistas que o DM entregar ao grupo aparecem aqui.'
            : 'Crie cartas, mapas do tesouro e ilustrações para revelar na hora certa.'}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!visaoJogador && (
        <button className="btn-primary" onClick={() => update({ handouts: [...campaign.handouts, novoHandout()] })}>
          ＋ Novo handout
        </button>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {lista.map((h) => (
          <div key={h.id} className="card gv-fade overflow-hidden">
            {h.imagemUrl && (
              <img src={h.imagemUrl} alt={h.titulo} className="max-h-64 w-full object-cover" />
            )}
            <div className="p-4">
              {visaoJogador ? (
                <>
                  <h3 className="font-display text-lg text-parchment-50">{h.titulo || 'Documento'}</h3>
                  {h.texto && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-parchment-100">{h.texto}</p>}
                </>
              ) : (
                <HandoutEditor h={h} patch={(p) => patch(h.id, p)} onRemove={() => update({ handouts: campaign.handouts.filter((x) => x.id !== h.id) })} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HandoutEditor({
  h,
  patch,
  onRemove,
}: {
  h: Handout
  patch: (p: Partial<Handout>) => void
  onRemove: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <TextField value={h.titulo} onChange={(v) => patch({ titulo: v })} placeholder="Título do documento" />
        <button className="px-1 text-parchment-200/40 hover:text-dragon-400" onClick={onRemove} aria-label="Remover">✕</button>
      </div>
      <TextArea value={h.texto} onChange={(v) => patch({ texto: v })} rows={4} placeholder="Conteúdo da carta, pista ou descrição…" />
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-ghost py-1.5 text-xs" onClick={() => fileRef.current?.click()}>📷 Imagem</button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) patch({ imagemUrl: await imageToDataUrl(f, 900, 0.75) })
            e.target.value = ''
          }}
        />
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={h.revelado} onChange={(e) => patch({ revelado: e.target.checked })} className="h-4 w-4 accent-dragon-500" />
          <span className={h.revelado ? 'text-emerald-400' : 'text-parchment-200/60'}>
            {h.revelado ? '👁 Revelado' : '🙈 Oculto'}
          </span>
        </label>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reputação com facções
// ---------------------------------------------------------------------------
export function ReputacaoTab({
  campaign,
  update,
  visaoJogador,
}: {
  campaign: Campaign
  update: UpdateFn
  visaoJogador: boolean
}) {
  const faccoes = campaign.codex.filter(
    (v) => v.tipo === 'faccao' && (!visaoJogador || v.conhecimento !== 'desconhecido'),
  )

  function setRep(loreId: string, valor: number) {
    const existe = campaign.reputacoes.some((r) => r.loreId === loreId)
    update({
      reputacoes: existe
        ? campaign.reputacoes.map((r) => (r.loreId === loreId ? { ...r, valor } : r))
        : [...campaign.reputacoes, { loreId, valor }],
    })
  }

  if (faccoes.length === 0) {
    return (
      <EmptyState
        icon="⚔️"
        titulo="Nenhuma facção"
        texto={visaoJogador
          ? 'As organizações que vocês conhecerem aparecem aqui, com a fama do grupo entre elas.'
          : 'Cadastre verbetes do tipo "Facção" no Codex para acompanhar a reputação do grupo.'}
      />
    )
  }

  return (
    <div className="space-y-3">
      {faccoes.map((f) => {
        const valor = campaign.reputacoes.find((r) => r.loreId === f.id)?.valor ?? 0
        const nivel = NIVEIS_REPUTACAO[Math.max(-3, Math.min(3, valor))]
        const pct = ((valor + 3) / 6) * 100
        return (
          <div key={f.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-display text-lg text-parchment-50">{f.nome || 'Facção'}</p>
                {f.resumo && <p className="text-xs text-parchment-200/60">{f.resumo}</p>}
              </div>
              <span className={`text-sm font-semibold ${nivel.cor}`}>{nivel.label}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
              <div
                className={`hpbar ${valor < 0 ? 'bg-dragon-500' : valor > 0 ? 'bg-emerald-500' : 'bg-white/25'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {!visaoJogador && (
              <div className="mt-3 flex items-center gap-2">
                <button className="btn-ghost px-2 py-1 text-xs" disabled={valor <= -3} onClick={() => setRep(f.id, valor - 1)}>−</button>
                <span className="w-8 text-center text-sm tabular-nums text-parchment-100">{valor > 0 ? `+${valor}` : valor}</span>
                <button className="btn-ghost px-2 py-1 text-xs" disabled={valor >= 3} onClick={() => setRep(f.id, valor + 1)}>+</button>
                <span className="text-xs text-parchment-200/40">de −3 (inimigo) a +3 (aliada)</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
