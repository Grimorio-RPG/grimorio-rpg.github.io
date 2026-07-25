import { useMemo, useState } from 'react'
import type { Character } from '../types'
import { CLASSES } from '../data/rules'
import { espacosPorNivel, marcosDoNivel, mediaDoDado, temEspacos } from '../data/progression'
import { abilityMod, classInfo, proficiencyBonus } from '../lib/calc'
import { rolar } from '../lib/dice'
import { addRoll } from '../lib/rollLog'
import { Modal } from './layout-ui'

type Update = (patch: Partial<Character>) => void

/** Faces do dado de vida da classe (cai para o texto da ficha se preciso). */
function facesDoDado(char: Character): number {
  const info = classInfo(char.classe)
  if (info) return info.dadoDeVida
  const m = char.dadosDeVida.match(/d(\d+)/i)
  return m ? parseInt(m[1], 10) : 8
}

// ---------------------------------------------------------------------------
// Painel de descanso
// ---------------------------------------------------------------------------
export function RestPanel({ char, update }: { char: Character; update: Update }) {
  const faces = facesDoDado(char)
  const total = char.nivel
  const disponiveis = Math.max(0, total - (char.dadosDeVidaUsados ?? 0))
  const conMod = abilityMod(char.atributos.con)
  const [qtd, setQtd] = useState(1)
  const [ultimo, setUltimo] = useState<string | null>(null)

  const podeDescansar = disponiveis > 0 && char.pvAtual < char.pvMax

  function descansoCurto() {
    const usar = Math.min(qtd, disponiveis)
    if (usar <= 0) return
    const r = rolar(usar, faces, conMod * usar, `Descanso curto (${usar}d${faces})`)
    addRoll(r)
    const curado = Math.max(usar, r.total) // nunca menos de 1 PV por dado
    const novo = Math.min(char.pvMax, char.pvAtual + curado)
    update({
      pvAtual: novo,
      dadosDeVidaUsados: (char.dadosDeVidaUsados ?? 0) + usar,
    })
    setUltimo(`Recuperou ${novo - char.pvAtual} PV (${r.dados.join(' + ')} + ${conMod * usar}).`)
  }

  function descansoLongo() {
    if (!confirm('Descanso longo: restaura PV, zera espaços de magia e testes de morte, devolve metade dos dados de vida e reduz 1 nível de exaustão. Continuar?')) return
    const recupera = Math.max(1, Math.floor(total / 2))
    update({
      pvAtual: char.pvMax,
      pvTemporario: 0,
      testesMorte: { sucessos: 0, falhas: 0 },
      exaustao: Math.max(0, char.exaustao - 1),
      espacosMagia: char.espacosMagia.map((s) => ({ ...s, usados: 0 })),
      dadosDeVidaUsados: Math.max(0, (char.dadosDeVidaUsados ?? 0) - recupera),
    })
    setUltimo('Descanso longo concluído: vida cheia e recursos recarregados.')
  }

  return (
    <section className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="panel-title">Descanso</h3>
        <span className="text-xs text-parchment-200/60">
          Dados de vida: <b className="text-parchment-100">{disponiveis}/{total}</b> d{faces}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Curto */}
        <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
          <p className="text-sm font-medium text-parchment-50">☕ Descanso curto</p>
          <p className="mt-0.5 text-xs text-parchment-200/60">
            1 hora. Gaste dados de vida para curar: cada dado rola d{faces} + {conMod >= 0 ? `+${conMod}` : conMod} (CON).
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={Math.max(1, disponiveis)}
              value={qtd}
              onChange={(e) => setQtd(Math.max(1, Math.min(disponiveis || 1, parseInt(e.target.value, 10) || 1)))}
              className="w-16 rounded-md border border-white/10 bg-ink-800 px-2 py-1 text-center text-sm outline-none focus:border-arcane-400"
            />
            <button className="btn-primary flex-1 py-1.5 text-xs" disabled={!podeDescansar} onClick={descansoCurto}>
              🎲 Gastar dado(s)
            </button>
          </div>
          {disponiveis === 0 && <p className="mt-2 text-xs text-dragon-400">Sem dados de vida — só um descanso longo devolve.</p>}
        </div>

        {/* Longo */}
        <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
          <p className="text-sm font-medium text-parchment-50">🌙 Descanso longo</p>
          <p className="mt-0.5 text-xs text-parchment-200/60">
            8 horas. Vida cheia, espaços de magia e testes de morte zerados, metade dos dados de vida de volta e −1 exaustão.
          </p>
          <button className="btn-ghost mt-2 w-full py-1.5 text-xs" onClick={descansoLongo}>Fazer descanso longo</button>
        </div>
      </div>

      {ultimo && <p className="mt-3 text-xs text-emerald-400">{ultimo}</p>}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Assistente de subida de nível
// ---------------------------------------------------------------------------
export function LevelUpModal({
  char,
  update,
  onClose,
}: {
  char: Character
  update: Update
  onClose: () => void
}) {
  const novoNivel = Math.min(20, char.nivel + 1)
  const faces = facesDoDado(char)
  const conMod = abilityMod(char.atributos.con)
  const media = mediaDoDado(faces)

  const [metodo, setMetodo] = useState<'media' | 'rolar'>('media')
  const [rolado, setRolado] = useState<number | null>(null)
  const [subclasse, setSubclasse] = useState(char.subclasse)

  const info = classInfo(char.classe)
  const precisaSubclasse = novoNivel === 3 && !char.subclasse
  const marcos = useMemo(() => marcosDoNivel(char.classe, novoNivel), [char.classe, novoNivel])

  const ganhoBase = metodo === 'media' ? media : (rolado ?? 0)
  const ganhoPv = ganhoBase > 0 ? Math.max(1, ganhoBase + conMod) : 0

  const espacosNovos = useMemo(() => espacosPorNivel(char.classe, novoNivel), [char.classe, novoNivel])
  const espacosAntigos = useMemo(() => espacosPorNivel(char.classe, char.nivel), [char.classe, char.nivel])
  const mudouEspacos = temEspacos(char.classe) &&
    espacosNovos.some((s, i) => s.total !== espacosAntigos[i].total)

  function rolarPv() {
    const r = rolar(1, faces, 0, `PV do nível ${novoNivel}`)
    addRoll(r)
    setRolado(r.total)
  }

  function confirmar() {
    if (ganhoPv <= 0) return
    // preserva os espaços já gastos, sem passar do novo total
    const espacos = espacosNovos.map((s, i) => ({
      total: s.total,
      usados: Math.min(char.espacosMagia[i]?.usados ?? 0, s.total),
    }))
    update({
      nivel: novoNivel,
      pvMax: char.pvMax + ganhoPv,
      pvAtual: char.pvAtual + ganhoPv,
      dadosDeVida: `${novoNivel}d${faces}`,
      subclasse: subclasse || char.subclasse,
      espacosMagia: temEspacos(char.classe) ? espacos : char.espacosMagia,
    })
    onClose()
  }

  return (
    <Modal onClose={onClose} titulo={`Subir para o nível ${novoNivel}`} largura="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-parchment-200/70">
          <b className="text-parchment-50">{char.nome || 'Seu personagem'}</b> — {char.classe || 'sem classe'}{' '}
          nível {char.nivel} → <b className="text-parchment-50">{novoNivel}</b>
        </p>

        {/* Pontos de vida */}
        <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
          <h4 className="mb-2 panel-title">Pontos de vida</h4>
          <div className="mb-2 flex gap-1 rounded-lg border border-white/10 bg-ink-900/60 p-1 text-xs">
            <button
              onClick={() => setMetodo('media')}
              className={`flex-1 rounded-md px-2 py-1.5 font-semibold transition ${metodo === 'media' ? 'bg-dragon-500 text-parchment-50' : 'text-parchment-200/70'}`}
            >
              Média ({media})
            </button>
            <button
              onClick={() => setMetodo('rolar')}
              className={`flex-1 rounded-md px-2 py-1.5 font-semibold transition ${metodo === 'rolar' ? 'bg-dragon-500 text-parchment-50' : 'text-parchment-200/70'}`}
            >
              Rolar d{faces}
            </button>
          </div>
          {metodo === 'rolar' && (
            <button className="btn-ghost mb-2 w-full py-1.5 text-xs" onClick={rolarPv}>
              🎲 {rolado == null ? `Rolar d${faces}` : `Rolou ${rolado} — rolar de novo`}
            </button>
          )}
          <p className="text-sm text-parchment-100">
            Ganho: <b className="text-emerald-400">+{ganhoPv} PV</b>{' '}
            <span className="text-xs text-parchment-200/50">
              ({ganhoBase || '?'} do dado {conMod >= 0 ? '+' : ''}{conMod} de CON)
            </span>
          </p>
          <p className="text-xs text-parchment-200/50">
            Novo máximo: {char.pvMax} → <b className="text-parchment-100">{char.pvMax + ganhoPv}</b>
          </p>
        </div>

        {/* Subclasse */}
        {precisaSubclasse && (
          <div className="rounded-xl border border-arcane-400/40 bg-arcane-500/10 p-3">
            <h4 className="mb-2 panel-title">Escolha sua subclasse</h4>
            <select className="stat-input py-1.5 text-sm" value={subclasse} onChange={(e) => setSubclasse(e.target.value)}>
              <option value="">Selecione…</option>
              {(info?.subclasses ?? CLASSES.find((c) => c.nome === char.classe)?.subclasses ?? []).map((sb) => (
                <option key={sb} value={sb}>{sb}</option>
              ))}
            </select>
          </div>
        )}

        {/* Espaços de magia */}
        {mudouEspacos && (
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
            <h4 className="mb-2 panel-title">Espaços de magia</h4>
            <div className="flex flex-wrap gap-1.5">
              {espacosNovos.map((s, i) => {
                const antes = espacosAntigos[i].total
                if (s.total === 0 && antes === 0) return null
                const novo = s.total > antes
                return (
                  <span key={i} className={`chip ${novo ? 'border-emerald-400/50 text-emerald-400' : ''}`}>
                    Nv {i + 1}: {antes} → {s.total}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Marcos */}
        {marcos.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
            <h4 className="mb-2 panel-title">O que muda neste nível</h4>
            <ul className="space-y-1.5">
              {marcos.map((m) => (
                <li key={m} className="flex gap-2 text-sm text-parchment-100">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-dragon-400" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-parchment-200/50">
          Bônus de proficiência: +{proficiencyBonus(char.nivel)} → <b className="text-parchment-100">+{proficiencyBonus(novoNivel)}</b>.
          Novas magias e habilidades da classe você adiciona depois, editando a ficha.
        </p>

        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary"
            disabled={ganhoPv <= 0 || (precisaSubclasse && !subclasse)}
            onClick={confirmar}
          >
            ✓ Subir para o nível {novoNivel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
