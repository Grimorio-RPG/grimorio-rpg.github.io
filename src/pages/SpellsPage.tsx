import { useMemo, useState } from 'react'
import { CLASSES_CONJURADORAS, SPELLS, type Spell } from '../data/spells'
import { rotuloClasse } from '../data/rules'
import { EmptyState, FilterChip, PageHeader, Toolbar } from '../components/layout-ui'

export default function SpellsPage() {
  const [busca, setBusca] = useState('')
  const [nivel, setNivel] = useState<number | 'todos'>('todos')
  const [classe, setClasse] = useState<string>('todas')
  const [aberta, setAberta] = useState<string | null>(null)

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return SPELLS.filter((s) => {
      if (nivel !== 'todos' && s.nivel !== nivel) return false
      if (classe !== 'todas' && !s.classes.includes(classe)) return false
      if (!q) return true
      return (
        s.nome.toLowerCase().includes(q) ||
        s.escola.toLowerCase().includes(q) ||
        s.emMiudos.toLowerCase().includes(q)
      )
    }).sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [busca, nivel, classe])

  const niveis = [...new Set(SPELLS.map((s) => s.nivel))].sort((a, b) => a - b)

  return (
    <div>
      <PageHeader
        icon="✨"
        titulo="Feitiços"
        subtitulo="Explicações diretas de cada magia — o que ela faz na prática, sem jargão. Filtre pela sua classe para ver só o que você pode conjurar."
      />

      <Toolbar>
        <input
          className="stat-input w-full max-w-xs"
          value={busca}
          placeholder="Buscar por nome, escola ou efeito…"
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          className="stat-input w-auto"
          value={classe}
          onChange={(e) => setClasse(e.target.value)}
          title="Filtrar por classe"
        >
          <option value="todas">Todas as classes</option>
          {CLASSES_CONJURADORAS.map((c) => (
            <option key={c} value={c}>{rotuloClasse(c)}</option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-1">
          <FilterChip ativo={nivel === 'todos'} onClick={() => setNivel('todos')}>Todos</FilterChip>
          {niveis.map((n) => (
            <FilterChip key={n} ativo={nivel === n} onClick={() => setNivel(n)}>
              {n === 0 ? 'Truques' : `Nv ${n}`}
            </FilterChip>
          ))}
        </div>
      </Toolbar>

      <p className="mb-3 text-xs text-parchment-200/50">
        {filtradas.length} feitiço(s){classe !== 'todas' ? ` de ${rotuloClasse(classe)}` : ''}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {filtradas.map((s) => (
          <SpellCard key={s.id} spell={s} aberta={aberta === s.id} onToggle={() => setAberta(aberta === s.id ? null : s.id)} />
        ))}
      </div>
      {filtradas.length === 0 && (
        <EmptyState icon="🔍" titulo="Nenhum feitiço encontrado" texto="Ajuste a busca, a classe ou o nível." />
      )}
    </div>
  )
}

function SpellCard({ spell, aberta, onToggle }: { spell: Spell; aberta: boolean; onToggle: () => void }) {
  return (
    <div className="card overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-start justify-between gap-3 p-4 text-left">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg text-parchment-50">{spell.nome}</h3>
            {spell.concentracao && <span className="chip" title="Requer concentração">C</span>}
            {spell.ritual && <span className="chip" title="Pode ser lançada como ritual">R</span>}
          </div>
          <p className="mt-0.5 text-xs text-parchment-200/60">
            {spell.nivel === 0 ? 'Truque' : `${spell.nivel}º nível`} · {spell.escola}
          </p>
          <p className="mt-2 text-sm text-arcane-400">💡 {spell.emMiudos}</p>
        </div>
        <span className="mt-1 text-parchment-200/40">{aberta ? '▲' : '▼'}</span>
      </button>
      {aberta && (
        <div className="border-t border-white/10 bg-ink-900/40 p-4 text-sm">
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Meta label="Tempo" valor={spell.tempo} />
            <Meta label="Alcance" valor={spell.alcance} />
            <Meta label="Duração" valor={spell.duracao} />
            <Meta label="Classes" valor={spell.classes.join(', ')} />
          </div>
          <p className="leading-relaxed text-parchment-100">{spell.descricao}</p>
        </div>
      )}
    </div>
  )
}

function Meta({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="panel-title">{label}</p>
      <p className="mt-0.5 text-parchment-100">{valor}</p>
    </div>
  )
}
