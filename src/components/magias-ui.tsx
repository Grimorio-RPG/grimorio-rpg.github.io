// Escolher magias — o mesmo painel na subida de nível e na ficha.
//
// A lista vem do SRD e já sai filtrada pela classe e pelo maior círculo que o
// personagem alcança. Isso não é enfeite: um mago de nível 4 tem 339 magias no
// catálogo, 60 delas na lista dele, e só as de 1º e 2º círculo servem. Mostrar
// as 339 é o mesmo que não mostrar nenhuma.

import { useEffect, useMemo, useState } from 'react'
import { carregarMagias, type MagiaDoCatalogo } from '../data/srd/magias'
import { Original } from './layout-ui'

/** O catálogo desce uma vez por sessão e fica; a tela não precisa saber disso. */
export function useCatalogoDeMagias(): MagiaDoCatalogo[] | null {
  const [magias, setMagias] = useState<MagiaDoCatalogo[] | null>(null)
  useEffect(() => {
    let vivo = true
    void carregarMagias().then((m) => {
      if (vivo) setMagias(m)
    })
    return () => {
      vivo = false
    }
  }, [])
  return magias
}

export function EscolherMagias({
  classe,
  circulo,
  maiorCirculo,
  jaTem,
  faltam,
  onEscolher,
  altura = 'max-h-64',
}: {
  classe: string
  /** 0 = só truques. Qualquer outro = magias de 1º ao maior círculo. */
  circulo: 0 | 1
  maiorCirculo: number
  /** Nomes que já estão na ficha, em minúsculas. */
  jaTem: Set<string>
  /** Quantas ainda faltam — só para mostrar. */
  faltam: number
  onEscolher: (m: MagiaDoCatalogo) => void
  altura?: string
}) {
  const magias = useCatalogoDeMagias()
  const [busca, setBusca] = useState('')
  const [todasAsClasses, setTodasAsClasses] = useState(false)

  const lista = useMemo(() => {
    if (!magias) return []
    const q = busca.trim().toLowerCase()
    return magias
      .filter((m) => {
        if (circulo === 0 ? m.nivel !== 0 : m.nivel < 1 || m.nivel > maiorCirculo) return false
        if (!todasAsClasses && !m.classesPt.includes(classe)) return false
        if (!q) return true
        return m.nomePt.toLowerCase().includes(q) || m.nome.toLowerCase().includes(q)
      })
      .sort((a, b) => a.nivel - b.nivel || a.nomePt.localeCompare(b.nomePt, 'pt-BR'))
  }, [magias, busca, circulo, maiorCirculo, classe, todasAsClasses])

  if (!magias) {
    return <p className="py-3 text-sm text-parchment-200/50">Abrindo o grimório…</p>
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          className="stat-input w-auto flex-1"
          value={busca}
          placeholder={circulo === 0 ? 'Buscar truque…' : 'Buscar magia…'}
          onChange={(e) => setBusca(e.target.value)}
        />
        {faltam > 0 && (
          <span className="chip border-amber-400/50 text-amber-300">faltam {faltam}</span>
        )}
      </div>

      <ul className={`space-y-1 overflow-y-auto ${altura}`}>
        {lista.map((m) => {
          const tem = jaTem.has(m.nomePt.toLowerCase())
          return (
            <li key={m.nome}>
              <button
                type="button"
                disabled={tem}
                onClick={() => onEscolher(m)}
                className={`w-full rounded-lg border p-2 text-left transition ${
                  tem
                    ? 'cursor-default border-white/5 bg-white/[0.02] opacity-45'
                    : 'border-white/10 bg-ink-900/40 hover:border-arcane-400/50'
                }`}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <b className="text-sm text-parchment-50">
                    {m.nomePt}
                    <Original pt={m.nomePt} en={m.nome} />
                  </b>
                  {m.concentracao && (
                    <span className="chip text-[10px] text-amber-300" title="Exige concentração">C</span>
                  )}
                  {m.ritual && (
                    <span className="chip text-[10px] text-arcane-300" title="Pode ser ritual">R</span>
                  )}
                  <span className="text-[11px] text-parchment-200/50">
                    {m.nivel === 0 ? 'truque' : `${m.nivel}º`} · {m.escolaPt}
                  </span>
                  {tem && <span className="text-[11px] text-emerald-400/70">já tem</span>}
                </span>
                {m.emMiudos && (
                  <span className="mt-0.5 block text-xs text-parchment-200/60">{m.emMiudos}</span>
                )}
              </button>
            </li>
          )
        })}
        {lista.length === 0 && (
          <li className="p-2 text-sm text-parchment-200/50">
            Nada com esse nome na lista de {classe}.
          </li>
        )}
      </ul>

      {/* O escape. A lista da classe é o caminho certo em 99% das vezes, mas
          talento, subclasse e pergaminho achado põem magias de fora na ficha —
          e um app que só sabe o caminho certo vira um app que impede. */}
      <label className="mt-2 flex items-center gap-1.5 text-[11px] text-parchment-200/50">
        <input
          type="checkbox"
          checked={todasAsClasses}
          onChange={(e) => setTodasAsClasses(e.target.checked)}
          className="h-3 w-3 accent-arcane-500"
        />
        Mostrar magias de fora da lista de {classe} (talento, subclasse, pergaminho)
      </label>
    </div>
  )
}
