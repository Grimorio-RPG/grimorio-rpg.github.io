// A aba Feitiços.
//
// Ela mostrava 69 magias escritas à mão. Um guerreiro abria o app e encontrava
// 258 itens do SRD traduzidos; um mago encontrava um resumo. Agora são as 339
// do SRD, com os campos separados e — o que interessa ao combate — a marca de
// concentração, que é a regra que a mesa mais esquece.
//
// A explicação sem jargão que já tínhamos continua vencendo o texto oficial na
// hora de mostrar. Ela não é tradução: é o que a magia faz na prática, e para
// quem está aprendendo vale mais do que a redação do livro. O oficial fica
// atrás, sempre disponível, porque quando a mesa discutir o alcance ou a CD é
// ele que decide.

import { useEffect, useMemo, useState } from 'react'
import {
  CLASSES,
  carregarMagias,
  type MagiaDoCatalogo,
} from '../data/srd/magias'
import { ATRIBUICAO_SRD } from '../data/srd'
import { EmptyState, FilterChip, PageHeader, Toolbar } from '../components/layout-ui'
import { GlossarioProvider, TextoComTermos } from '../components/glossario-ui'

const CLASSES_PT = Object.values(CLASSES).sort((a, b) => a.localeCompare(b, 'pt-BR'))

export default function SpellsPage() {
  const [magias, setMagias] = useState<MagiaDoCatalogo[] | null>(null)
  const [busca, setBusca] = useState('')
  const [nivel, setNivel] = useState<number | 'todos'>('todos')
  const [classe, setClasse] = useState<string>('todas')
  const [soExplicadas, setSoExplicadas] = useState(false)
  const [aberta, setAberta] = useState<string | null>(null)

  // O catálogo passa de 300 KB de texto oficial: só desce quando alguém abre
  // esta aba, e não no carregamento do app.
  useEffect(() => {
    let vivo = true
    void carregarMagias().then((m) => {
      if (vivo) setMagias(m)
    })
    return () => {
      vivo = false
    }
  }, [])

  const filtradas = useMemo(() => {
    if (!magias) return []
    const q = busca.trim().toLowerCase()
    return magias
      .filter((m) => {
        if (nivel !== 'todos' && m.nivel !== nivel) return false
        if (classe !== 'todas' && !m.classesPt.includes(classe)) return false
        if (soExplicadas && !m.explicada) return false
        if (!q) return true
        return (
          m.nomePt.toLowerCase().includes(q) ||
          m.nome.toLowerCase().includes(q) ||
          m.escolaPt.toLowerCase().includes(q) ||
          m.emMiudos.toLowerCase().includes(q) ||
          m.texto.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.nivel - b.nivel || a.nomePt.localeCompare(b.nomePt, 'pt-BR'))
  }, [magias, busca, nivel, classe, soExplicadas])

  const explicadas = magias?.filter((m) => m.explicada).length ?? 0

  return (
    <GlossarioProvider>
      <div>
        <PageHeader
          icon="✨"
          titulo="Feitiços"
          subtitulo="O catálogo do SRD inteiro. Onde temos, a explicação vem sem jargão — o que a magia faz na prática. O texto oficial fica logo abaixo."
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
            {CLASSES_PT.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex flex-wrap items-center gap-1">
            <FilterChip ativo={nivel === 'todos'} onClick={() => setNivel('todos')}>Todos</FilterChip>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <FilterChip key={n} ativo={nivel === n} onClick={() => setNivel(n)}>
                {n === 0 ? 'Truques' : `Nv ${n}`}
              </FilterChip>
            ))}
          </div>
          {/* Quem está aprendendo quer as explicadas; quem procura uma regra
              específica quer o catálogo inteiro. */}
          <FilterChip ativo={soExplicadas} onClick={() => setSoExplicadas((v) => !v)}>
            💡 só as explicadas ({explicadas})
          </FilterChip>
        </Toolbar>

        {!magias ? (
          <div className="card p-10 text-center text-sm text-parchment-200/60">
            Abrindo o grimório…
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-parchment-200/50">
              {filtradas.length} de {magias.length} feitiços
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              {filtradas.map((m) => (
                <CartaDeMagia
                  key={m.nome}
                  magia={m}
                  aberta={aberta === m.nome}
                  onToggle={() => setAberta(aberta === m.nome ? null : m.nome)}
                />
              ))}
            </div>

            {filtradas.length === 0 && (
              <EmptyState
                icon="🔍"
                titulo="Nenhum feitiço encontrado"
                texto="Ajuste a busca, a classe ou o nível."
              />
            )}

            <p className="mt-6 text-center text-[11px] leading-relaxed text-parchment-200/35">
              {ATRIBUICAO_SRD}
            </p>
          </>
        )}
      </div>
    </GlossarioProvider>
  )
}

function CartaDeMagia({
  magia,
  aberta,
  onToggle,
}: {
  magia: MagiaDoCatalogo
  aberta: boolean
  onToggle: () => void
}) {
  return (
    <div className="card overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-start justify-between gap-3 p-4 text-left">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-parchment-50">{magia.nomePt}</h3>
            {magia.concentracao && (
              <span className="chip text-amber-300" title="Exige concentração">C</span>
            )}
            {magia.ritual && (
              <span className="chip text-arcane-300" title="Pode ser conjurada como ritual">R</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-parchment-200/60">
            {magia.nivel === 0 ? 'Truque' : `${magia.nivel}º círculo`} · {magia.escolaPt} ·{' '}
            {magia.classesPt.join(', ')}
          </p>
          {magia.emMiudos ? (
            <p className="mt-2 text-sm text-arcane-400">💡 {magia.emMiudos}</p>
          ) : (
            <p className="mt-2 line-clamp-2 text-sm text-parchment-200/60">{magia.texto}</p>
          )}
        </div>
        <span className="mt-1 shrink-0 text-parchment-200/40">{aberta ? '▲' : '▼'}</span>
      </button>

      {aberta && (
        <div className="border-t border-white/10 bg-ink-900/40 p-4 text-sm">
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Meta label="Tempo" valor={magia.tempo} />
            <Meta label="Alcance" valor={magia.alcance} />
            <Meta label="Duração" valor={magia.duracao} />
            <Meta label="Componentes" valor={magia.componentes} />
          </div>

          <p className="leading-relaxed text-parchment-100">
            <TextoComTermos texto={magia.texto} />
          </p>

          {/* O nome em inglês é o que se digita numa busca ou se confere no
              livro. Fica pequeno, mas fica. */}
          {magia.nomePt !== magia.nome && (
            <p className="mt-3 text-[11px] text-parchment-200/35">No original: {magia.nome}</p>
          )}
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
