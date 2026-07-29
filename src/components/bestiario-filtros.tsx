import { useMemo } from 'react'
import type { KnowledgeLevel, Monster } from '../types'
import { CATEGORIAS_MONSTRO, NIVEIS_CONHECIMENTO, categoriaInfo } from '../lib/bestiary'
import { FilterChip } from './layout-ui'

export interface FiltrosBestiario {
  busca: string
  rank: NonNullable<Monster['categoria']> | 'todos'
  tipo: string
  conhecimento: KnowledgeLevel | 'todos'
  /** Esconde quem o grupo já derrubou — a lista de hoje raramente inclui mortos. */
  ocultarDerrotados: boolean
}

export const FILTROS_VAZIOS: FiltrosBestiario = {
  busca: '',
  rank: 'todos',
  tipo: 'todos',
  conhecimento: 'todos',
  ocultarDerrotados: false,
}

/**
 * Aplica os filtros. Separado da tela porque DM e jogador usam os mesmos —
 * quem tem trinta criaturas cadastradas precisa filtrar dos dois lados.
 */
export function filtrarMonstros(lista: Monster[], f: FiltrosBestiario): Monster[] {
  const q = f.busca.trim().toLowerCase()
  return lista
    .filter((m) => {
      if (f.rank !== 'todos' && (m.categoria ?? 'comum') !== f.rank) return false
      // O tipo vem como texto livre ("Humanoide (orc)"), então compara pelo
      // começo: escolher "Humanoide" precisa pegar todas as variações.
      if (f.tipo !== 'todos' && !m.tipo.toLowerCase().startsWith(f.tipo.toLowerCase())) return false
      if (f.conhecimento !== 'todos' && m.conhecimento !== f.conhecimento) return false
      if (f.ocultarDerrotados && m.derrotado) return false
      if (!q) return true
      return `${m.nome} ${m.tipo} ${m.nd}`.toLowerCase().includes(q)
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** Os tipos que existem de fato nesta lista — filtro vazio não ajuda ninguém. */
function tiposPresentes(lista: Monster[]): string[] {
  const base = new Set<string>()
  for (const m of lista) {
    // "Humanoide (orc)" → "Humanoide": agrupar por família é o que se procura.
    const raiz = m.tipo.split('(')[0].trim()
    if (raiz) base.add(raiz)
  }
  return [...base].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function BarraDeFiltros({
  lista,
  filtros,
  onChange,
  mostrarConhecimento = true,
}: {
  lista: Monster[]
  filtros: FiltrosBestiario
  onChange: (f: FiltrosBestiario) => void
  /** O jogador não escolhe nível de conhecimento — ele vê o que foi liberado. */
  mostrarConhecimento?: boolean
}) {
  const tipos = useMemo(() => tiposPresentes(lista), [lista])
  const set = (p: Partial<FiltrosBestiario>) => onChange({ ...filtros, ...p })

  const contarRank = (v: string) => lista.filter((m) => (m.categoria ?? 'comum') === v).length
  const ativo = filtros.rank !== 'todos' || filtros.tipo !== 'todos' ||
    filtros.conhecimento !== 'todos' || filtros.ocultarDerrotados || !!filtros.busca.trim()

  return (
    <div className="mb-6 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="stat-input w-full max-w-xs"
          value={filtros.busca}
          placeholder="Buscar por nome, tipo ou ND…"
          onChange={(e) => set({ busca: e.target.value })}
        />
        {tipos.length > 1 && (
          <select
            className="stat-input w-auto py-1.5 text-sm"
            value={filtros.tipo}
            onChange={(e) => set({ tipo: e.target.value })}
          >
            <option value="todos">Todos os tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-parchment-200/70">
          <input
            type="checkbox"
            checked={filtros.ocultarDerrotados}
            onChange={(e) => set({ ocultarDerrotados: e.target.checked })}
          />
          Esconder derrotados
        </label>
        {ativo && (
          <button
            type="button"
            className="ml-auto text-xs text-parchment-200/50 underline hover:text-parchment-100"
            onClick={() => onChange(FILTROS_VAZIOS)}
          >
            limpar filtros
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 panel-title">Rank</span>
        <FilterChip ativo={filtros.rank === 'todos'} onClick={() => set({ rank: 'todos' })}>
          Todos ({lista.length})
        </FilterChip>
        {CATEGORIAS_MONSTRO.map((c) => {
          const qtd = contarRank(c.valor)
          if (qtd === 0) return null
          return (
            <FilterChip key={c.valor} ativo={filtros.rank === c.valor} onClick={() => set({ rank: c.valor })}>
              {c.icone} {c.label} ({qtd})
            </FilterChip>
          )
        })}
      </div>

      {mostrarConhecimento && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 panel-title">Conhecimento</span>
          <FilterChip
            ativo={filtros.conhecimento === 'todos'}
            onClick={() => set({ conhecimento: 'todos' })}
          >
            Todos
          </FilterChip>
          {NIVEIS_CONHECIMENTO.map((n) => {
            const qtd = lista.filter((m) => m.conhecimento === n.valor).length
            if (qtd === 0) return null
            return (
              <FilterChip
                key={n.valor}
                ativo={filtros.conhecimento === n.valor}
                onClick={() => set({ conhecimento: n.valor })}
              >
                {n.icone} {n.curto} ({qtd})
              </FilterChip>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Rótulo do rank, para reuso fora daqui. */
export function rotuloRank(m: Monster) {
  const c = categoriaInfo(m.categoria)
  return `${c.icone} ${c.label}`
}
