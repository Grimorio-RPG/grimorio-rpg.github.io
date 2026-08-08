// Conjurar durante o combate.
//
// O campo de concentração era um texto livre: o DM digitava o nome da magia, e
// o app não sabia nem se aquela magia exigia concentração. Com as 339 do SRD
// carregadas, escolher da lista faz o app saber — e saber é o que permite
// marcar a concentração sozinho, gastar o espaço certo e acender o token no
// mapa.
//
// O que esta tela NÃO faz: aplicar o dano da magia. Isso continua sendo o botão
// de dano no alvo, porque metade das magias não causa dano e a outra metade
// pede uma salvaguarda antes — inventar um número aqui seria pior do que não
// ter número nenhum.

import { useEffect, useMemo, useState } from 'react'
import { carregarMagias, type MagiaDoCatalogo } from '../data/srd/magias'
import { Modal } from './layout-ui'
import { GlossarioProvider, TextoComTermos } from './glossario-ui'

export interface Conjuracao {
  magia: MagiaDoCatalogo
  /** Em que círculo foi conjurada — pode ser acima do próprio. */
  nivel: number
}

export function SeletorDeMagia({
  nomeDoConjurador,
  onFechar,
  onConjurar,
}: {
  nomeDoConjurador: string
  onFechar: () => void
  onConjurar: (c: Conjuracao) => void
}) {
  const [magias, setMagias] = useState<MagiaDoCatalogo[] | null>(null)
  const [busca, setBusca] = useState('')
  const [escolhida, setEscolhida] = useState<MagiaDoCatalogo | null>(null)
  const [nivel, setNivel] = useState(0)

  useEffect(() => {
    let vivo = true
    void carregarMagias().then((m) => {
      if (vivo) setMagias(m)
    })
    return () => {
      vivo = false
    }
  }, [])

  const achadas = useMemo(() => {
    if (!magias) return []
    const q = busca.trim().toLowerCase()
    if (!q) return magias.filter((m) => m.explicada).slice(0, 40)
    return magias
      .filter((m) => m.nomePt.toLowerCase().includes(q) || m.nome.toLowerCase().includes(q))
      .slice(0, 40)
  }, [magias, busca])

  function escolher(m: MagiaDoCatalogo) {
    setEscolhida(m)
    setNivel(m.nivel)
  }

  return (
    <Modal titulo={`✨ ${nomeDoConjurador} conjura`} onClose={onFechar}>
      <GlossarioProvider>
        {!escolhida ? (
          <>
            <input
              autoFocus
              className="stat-input w-full"
              value={busca}
              placeholder="Buscar magia…"
              onChange={(e) => setBusca(e.target.value)}
            />
            {!magias ? (
              <p className="mt-4 text-sm text-parchment-200/50">Abrindo o grimório…</p>
            ) : (
              <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
                {achadas.map((m) => (
                  <li key={m.nome}>
                    <button
                      className="w-full rounded-lg border border-white/10 bg-ink-900/40 p-2 text-left hover:border-arcane-400/50"
                      onClick={() => escolher(m)}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <b className="text-sm text-parchment-50">{m.nomePt}</b>
                        {m.concentracao && (
                          <span className="chip text-[10px] text-amber-300" title="Exige concentração">
                            C
                          </span>
                        )}
                        <span className="text-[11px] text-parchment-200/50">
                          {m.nivel === 0 ? 'truque' : `${m.nivel}º círculo`} · {m.escolaPt}
                        </span>
                      </span>
                      {m.emMiudos && (
                        <span className="mt-0.5 block text-xs text-parchment-200/60">{m.emMiudos}</span>
                      )}
                    </button>
                  </li>
                ))}
                {achadas.length === 0 && (
                  <li className="p-2 text-sm text-parchment-200/50">Nada com esse nome.</li>
                )}
              </ul>
            )}
            {!busca && magias && (
              <p className="mt-2 text-[11px] text-parchment-200/40">
                Mostrando as que já têm explicação nossa. Busque pelo nome para chegar às {magias.length}.
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-2">
              <h4 className="font-display text-lg text-parchment-50">{escolhida.nomePt}</h4>
              <span className="text-xs text-parchment-200/50">
                {escolhida.nivel === 0 ? 'truque' : `${escolhida.nivel}º círculo`} · {escolhida.escolaPt}
              </span>
              {escolhida.concentracao && (
                <span className="chip text-[10px] text-amber-300">exige concentração</span>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <Campo r="Tempo" v={escolhida.tempo} />
              <Campo r="Alcance" v={escolhida.alcance} />
              <Campo r="Duração" v={escolhida.duracao} />
              <Campo r="Componentes" v={escolhida.componentes} />
            </div>

            <p className="mt-3 max-h-40 overflow-y-auto text-sm leading-relaxed text-parchment-100">
              {escolhida.emMiudos ? (
                <>
                  <span className="text-arcane-400">💡 {escolhida.emMiudos}</span>
                  <br />
                  <br />
                </>
              ) : null}
              <TextoComTermos texto={escolhida.texto} />
            </p>

            {/* Conjurar acima do próprio círculo é regra e é comum. Sem escolher
                o círculo, o app gastaria sempre o menor — e a Bola de Fogo de 5º
                sairia como a de 3º na ficha. */}
            {escolhida.nivel > 0 && (
              <label className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-parchment-200/70">Gastar espaço de</span>
                <select
                  className="stat-input w-auto"
                  value={nivel}
                  onChange={(e) => setNivel(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9]
                    .filter((n) => n >= escolhida.nivel)
                    .map((n) => (
                      <option key={n} value={n}>{n}º círculo</option>
                    ))}
                </select>
              </label>
            )}

            <div className="mt-4 flex flex-wrap justify-between gap-2">
              <button className="btn-ghost" onClick={() => setEscolhida(null)}>
                ← Outra magia
              </button>
              <button
                className="btn-primary"
                onClick={() => onConjurar({ magia: escolhida, nivel })}
              >
                ✨ Conjurar
              </button>
            </div>
          </>
        )}
      </GlossarioProvider>
    </Modal>
  )
}

function Campo({ r, v }: { r: string; v: string }) {
  return (
    <div>
      <p className="panel-title">{r}</p>
      <p className="mt-0.5 text-parchment-100">{v}</p>
    </div>
  )
}
