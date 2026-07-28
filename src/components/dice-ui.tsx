import { useEffect, useState, type ReactNode } from 'react'
import {
  descreveRolagem,
  parseNotacao,
  rolar,
  type ModoRolagem,
  type RollResult,
} from '../lib/dice'
import {
  addRoll,
  clearRolls,
  consumirModo,
  getManterModo,
  getModo,
  getSecreto,
  setManterModo,
  setModo,
  setSecreto,
} from '../lib/rollLog'
import { useRolls } from '../hooks/useRolls'
import { useFeedDaMesa, useMesa } from '../hooks/useSync'
import { getMesa } from '../lib/sync/mesa'
import { limparFeedLocal, publicarRolagem } from '../lib/sync/rolagens'

/** Executa uma rolagem já respeitando o modo (vantagem/desvantagem) armado. */
export function rolarComModo(qtd: number, faces: number, mod: number, rotulo: string): RollResult {
  const m = faces === 20 && qtd === 1 ? consumirModo() : 'normal'
  const bruto = rolar(qtd, faces, mod, rotulo, m)

  // Numa mesa, o dado é de todo mundo — a não ser que o DM esteja rolando
  // escondido atrás da tela.
  const mesa = getMesa()
  const secreta = !!mesa && getSecreto()
  const r = addRoll(secreta ? { ...bruto, secreta: true } : bruto)
  if (mesa && !secreta) void publicarRolagem(mesa.id, r)

  return r
}

/** Botão inline: mostra o bônus e rola ao clicar. */
export function RollButton({
  bonus,
  rotulo,
  children,
  className = '',
  title,
}: {
  bonus: number
  rotulo: string
  children?: ReactNode
  className?: string
  title?: string
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        rolarComModo(1, 20, bonus, rotulo)
      }}
      title={title ?? `Rolar ${rotulo}`}
      className={`rounded-md px-1 transition hover:bg-arcane-500/25 hover:text-parchment-50 active:scale-95 ${className}`}
    >
      {children}
    </button>
  )
}

/** Botão que rola uma notação em texto, ex: "1d8+3 cortante". */
export function RollTextButton({
  texto,
  rotulo,
  children,
  className = '',
}: {
  texto: string
  rotulo: string
  children?: ReactNode
  className?: string
}) {
  const primeira = texto.trim().match(/\d*d\d+\s*(?:[+-]\s*\d+)?/i)
  const n = primeira ? parseNotacao(primeira[0]) : null
  if (!n) return <span className={className}>{children}</span>
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        rolarComModo(n.qtd, n.faces, n.modificador, rotulo)
      }}
      title={`Rolar ${rotulo}`}
      className={`rounded-md px-1 transition hover:bg-arcane-500/25 hover:text-parchment-50 active:scale-95 ${className}`}
    >
      {children}
    </button>
  )
}

const DADOS_RAPIDOS = [4, 6, 8, 10, 12, 20, 100]

/** Bandeja de dados flutuante: dados rápidos, modo e histórico. */
export function DiceTray() {
  const rolls = useRolls()
  const feed = useFeedDaMesa()
  const { mesa, souDm } = useMesa()
  const [aberto, setAberto] = useState(false)
  const [notacao, setNotacao] = useState('')
  const [flash, setFlash] = useState<{ roll: RollResult; autor?: string } | null>(null)
  const modo = getModo()
  const manter = getManterModo()
  const secreto = getSecreto()
  const ultima = rolls[0]
  const secretas = rolls.filter((r) => r.secreta)

  // mostra o resultado mais recente por alguns segundos
  useEffect(() => {
    if (!ultima) return
    setFlash({ roll: ultima })
    const t = setTimeout(() => setFlash(null), 4000)
    return () => clearTimeout(t)
  }, [ultima?.id])

  // …e também quando um colega de mesa rola: é o que dá a sensação de estarem
  // todos à mesma mesa, cada um no seu celular.
  const ultimaDoGrupo = feed.find((f) => !f.minha)
  useEffect(() => {
    if (!ultimaDoGrupo) return
    setFlash({ roll: ultimaDoGrupo.roll, autor: ultimaDoGrupo.autorNome })
    const t = setTimeout(() => setFlash(null), 4000)
    return () => clearTimeout(t)
  }, [ultimaDoGrupo?.id])

  function rolarNotacao() {
    const n = parseNotacao(notacao)
    if (!n) return
    rolarComModo(n.qtd, n.faces, n.modificador, notacao.trim())
    setNotacao('')
  }

  return (
    <>
      {/* Resultado flutuante */}
      {flash && !aberto && (
        <button
          onClick={() => setAberto(true)}
          className="nao-imprimir gv-fade fixed bottom-20 right-4 z-40 max-w-[80vw] rounded-xl border border-white/10 bg-ink-800/95 px-3 py-2 text-left shadow-xl backdrop-blur sm:bottom-24 sm:right-6"
        >
          {flash.autor && (
            <p className="mb-0.5 text-[10px] uppercase tracking-wide text-parchment-200/45">
              {flash.autor} rolou
            </p>
          )}
          <ResultadoLinha r={flash.roll} compacto />
        </button>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Rolar dados"
        className="nao-imprimir fixed bottom-4 right-4 z-40 grid h-14 w-14 place-items-center rounded-full text-2xl shadow-xl transition active:scale-95 sm:bottom-6 sm:right-6"
        style={{
          backgroundImage: 'linear-gradient(180deg, #b23c35, #8f2a24)',
          boxShadow: '0 1px 0 rgba(255,255,255,.15) inset, 0 8px 22px -8px rgba(163,49,43,.9)',
        }}
      >
        🎲
      </button>

      {/* Painel */}
      {aberto && (
        <div className="nao-imprimir fixed inset-0 z-40" onClick={() => setAberto(false)}>
          <div
            className="gv-fade absolute bottom-20 right-2 max-h-[75vh] w-[min(22rem,92vw)] overflow-hidden rounded-2xl border border-white/10 bg-ink-800/95 shadow-2xl backdrop-blur sm:bottom-24 sm:right-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <h2 className="font-display text-lg text-parchment-50">Dados</h2>
              <button className="text-sm text-parchment-200/50 hover:text-parchment-100" onClick={() => setAberto(false)}>fechar ✕</button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto p-4">
              {/* Modo */}
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="panel-title">Modo do próximo d20</span>
                  <label className="flex cursor-pointer items-center gap-1 text-[11px] text-parchment-200/60">
                    <input type="checkbox" checked={manter} onChange={(e) => setManterModo(e.target.checked)} className="h-3 w-3 accent-arcane-500" />
                    manter
                  </label>
                </div>
                <div className="flex gap-1">
                  {([['normal', 'Normal'], ['vantagem', 'Vantagem'], ['desvantagem', 'Desvantagem']] as [ModoRolagem, string][]).map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => setModo(v)}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                        modo === v ? 'bg-arcane-500 text-parchment-50' : 'border border-white/10 text-parchment-200/70 hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Atrás da tela do mestre */}
              {mesa && souDm && (
                <label
                  className={`mb-3 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                    secreto
                      ? 'border-dragon-400/50 bg-dragon-500/15 text-parchment-50'
                      : 'border-white/10 text-parchment-200/70 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={secreto}
                    onChange={(e) => setSecreto(e.target.checked)}
                    className="h-3.5 w-3.5 accent-dragon-500"
                  />
                  <span className="flex-1">
                    🙈 <b>Rolagem secreta</b>
                    <span className="block text-[11px] text-parchment-200/50">
                      {secreto ? 'O grupo não vê estes dados.' : 'Suas rolagens aparecem para o grupo.'}
                    </span>
                  </span>
                </label>
              )}

              {/* Dados rápidos */}
              <div className="mb-3">
                <span className="mb-1 block panel-title">Dados rápidos</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {DADOS_RAPIDOS.map((f) => (
                    <button
                      key={f}
                      onClick={() => rolarComModo(1, f, 0, `d${f}`)}
                      className="btn-ghost px-2 py-1.5 text-xs"
                    >
                      d{f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notação livre */}
              <div className="mb-4">
                <span className="mb-1 block panel-title">Rolagem personalizada</span>
                <div className="flex gap-1.5">
                  <input
                    className="stat-input py-1.5 text-sm"
                    value={notacao}
                    placeholder="ex: 2d6+3"
                    onChange={(e) => setNotacao(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') rolarNotacao() }}
                  />
                  <button className="btn-primary px-3 py-1.5 text-xs" disabled={!parseNotacao(notacao)} onClick={rolarNotacao}>Rolar</button>
                </div>
              </div>

              {/* Histórico — da mesa, quando há mesa; só seu, quando não há */}
              {mesa ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="panel-title">Dados da mesa</span>
                    {feed.length > 0 && (
                      <button
                        className="text-[11px] text-parchment-200/50 hover:text-dragon-400"
                        onClick={limparFeedLocal}
                        title="Some com o feed só na sua tela"
                      >
                        limpar aqui
                      </button>
                    )}
                  </div>
                  {feed.length === 0 ? (
                    <p className="mt-2 text-xs text-parchment-200/50">
                      Ninguém rolou nada ainda. Toque nos bônus da sua ficha para rolar direto de lá — o
                      grupo inteiro vê o resultado.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {feed.map((item) => (
                        <li
                          key={item.id}
                          className={`rounded-lg border px-2.5 py-1.5 ${
                            item.minha
                              ? 'border-arcane-400/40 bg-arcane-600/10'
                              : 'border-white/10 bg-ink-900/40'
                          }`}
                        >
                          <p className="mb-0.5 text-[10px] uppercase tracking-wide text-parchment-200/45">
                            {item.minha ? 'você' : item.autorNome}
                          </p>
                          <ResultadoLinha r={item.roll} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {secretas.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[11px] text-parchment-200/45 hover:text-parchment-100">
                        🙈 {secretas.length} rolagem(ns) secreta(s) — só você vê
                      </summary>
                      <ul className="mt-2 space-y-1.5">
                        {secretas.map((r) => (
                          <li key={r.id} className="rounded-lg border border-dragon-400/25 bg-dragon-500/5 px-2.5 py-1.5">
                            <ResultadoLinha r={r} />
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="panel-title">Histórico</span>
                    {rolls.length > 0 && (
                      <button className="text-[11px] text-parchment-200/50 hover:text-dragon-400" onClick={clearRolls}>limpar</button>
                    )}
                  </div>
                  {rolls.length === 0 ? (
                    <p className="mt-2 text-xs text-parchment-200/50">
                      Nenhuma rolagem ainda. Toque nos bônus da sua ficha (perícias, salvaguardas, ataques) para rolar direto de lá.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {rolls.map((r) => (
                        <li key={r.id} className="rounded-lg border border-white/10 bg-ink-900/40 px-2.5 py-1.5">
                          <ResultadoLinha r={r} />
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ResultadoLinha({ r, compacto = false }: { r: RollResult; compacto?: boolean }) {
  const cor = r.critico ? 'text-emerald-400' : r.falhaCritica ? 'text-dragon-400' : 'text-parchment-50'
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-parchment-100">
          {r.rotulo}
          {r.modo !== 'normal' && (
            <span className={`ml-1 ${r.modo === 'vantagem' ? 'text-emerald-400' : 'text-dragon-400'}`}>
              ({r.modo === 'vantagem' ? 'vant.' : 'desv.'})
            </span>
          )}
        </p>
        {!compacto && (
          <p className="truncate text-[11px] text-parchment-200/50">
            {r.notacao} · {descreveRolagem(r)}
            {r.descartados.length > 0 && <span className="line-through opacity-60"> ({r.descartados.join(', ')})</span>}
          </p>
        )}
      </div>
      <div className="text-right">
        <span className={`font-display text-xl tabular-nums ${cor}`}>{r.total}</span>
        {r.critico && <span className="ml-1 text-[10px] font-bold text-emerald-400">CRIT!</span>}
        {r.falhaCritica && <span className="ml-1 text-[10px] font-bold text-dragon-400">FALHA</span>}
      </div>
    </div>
  )
}
