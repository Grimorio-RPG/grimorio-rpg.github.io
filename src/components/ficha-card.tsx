import type { Character } from '../types'
import { abilityMod, armorClass, fmtMod } from '../lib/calc'
import { classInfo } from '../lib/calc'

/**
 * Ícone e cor de cada condição.
 *
 * Painel de party de RPG mostra estado com símbolo, não com texto corrido: numa
 * mesa, quem está envenenado precisa saltar aos olhos no meio de seis cartões.
 */
const CONDICAO_VISUAL: Record<string, { icone: string; cor: string }> = {
  Agarrado: { icone: '🕸️', cor: 'bg-amber-500/20 text-amber-300 border-amber-400/40' },
  Amedrontado: { icone: '😱', cor: 'bg-violet-500/20 text-violet-300 border-violet-400/40' },
  Atordoado: { icone: '💫', cor: 'bg-amber-500/20 text-amber-300 border-amber-400/40' },
  Caído: { icone: '🔻', cor: 'bg-stone-500/20 text-stone-300 border-stone-400/40' },
  Cego: { icone: '🕶️', cor: 'bg-stone-500/20 text-stone-300 border-stone-400/40' },
  Enfeitiçado: { icone: '💗', cor: 'bg-pink-500/20 text-pink-300 border-pink-400/40' },
  Envenenado: { icone: '🧪', cor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' },
  Impedido: { icone: '🪢', cor: 'bg-amber-500/20 text-amber-300 border-amber-400/40' },
  Incapacitado: { icone: '🚫', cor: 'bg-dragon-500/20 text-dragon-300 border-dragon-400/40' },
  Invisível: { icone: '👻', cor: 'bg-sky-500/20 text-sky-300 border-sky-400/40' },
  Paralisado: { icone: '⚡', cor: 'bg-amber-500/20 text-amber-300 border-amber-400/40' },
  Petrificado: { icone: '🗿', cor: 'bg-stone-500/20 text-stone-300 border-stone-400/40' },
  Surdo: { icone: '🔇', cor: 'bg-stone-500/20 text-stone-300 border-stone-400/40' },
}

function condicaoVisual(nome: string) {
  return CONDICAO_VISUAL[nome] ?? { icone: '⚠️', cor: 'bg-white/10 text-parchment-200 border-white/20' }
}

/**
 * Barra de vida.
 *
 * O que falta aparece em vermelho no lugar de sumir: ver o quanto já se perdeu
 * é a informação, e uma barra que só encolhe esconde isso.
 */
export function BarraDeVida({
  atual,
  max,
  temporario = 0,
  compacta = false,
}: {
  atual: number
  max: number
  temporario?: number
  compacta?: boolean
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0
  const cor = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-dragon-500'
  const critico = pct <= 25 && atual > 0

  return (
    <div>
      <div
        className={`relative w-full overflow-hidden rounded-full bg-dragon-900/70 ring-1 ring-inset ring-black/40 ${
          compacta ? 'h-2' : 'h-3.5'
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${cor} ${critico ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%` }}
        />
        {!compacta && (
          <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
            {atual} / {max}
            {temporario > 0 && ` (+${temporario})`}
          </span>
        )}
      </div>
    </div>
  )
}

export function SelosDeCondicao({ condicoes }: { condicoes: string[] }) {
  if (condicoes.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {condicoes.map((c) => {
        const v = condicaoVisual(c)
        return (
          <span
            key={c}
            title={c}
            className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${v.cor}`}
          >
            {v.icone} {c}
          </span>
        )
      })}
    </div>
  )
}

/**
 * Cartão de personagem no estilo de painel de party.
 *
 * A referência é o retrato de grupo de um RPG de verdade: retrato emoldurado,
 * nível em selo, vida em barra e estado em símbolo. A versão anterior era uma
 * lista de números — correta e sem nenhuma leitura de relance.
 */
export function FichaCard({
  char,
  emJogo = false,
  autor,
  onOpen,
  onDelete,
}: {
  char: Character
  emJogo?: boolean
  /** Dono, quando a ficha é de outro jogador. */
  autor?: string
  onOpen: () => void
  onDelete?: () => void
}) {
  const info = classInfo(char.classe)
  const ca = armorClass(char)
  const pctVida = char.pvMax > 0 ? (char.pvAtual / char.pvMax) * 100 : 0
  const caido = char.pvAtual <= 0

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-b from-ink-800/80 to-ink-900/90 transition ${
        emJogo
          ? 'border-emerald-400/60 shadow-[0_0_24px_-6px_rgba(52,211,153,0.45)]'
          : 'border-white/10 hover:border-dragon-500/40'
      } ${caido ? 'grayscale' : ''}`}
    >
      {emJogo && (
        <div className="bg-emerald-500/90 px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-900">
          ⚔️ Em jogo nesta mesa
        </div>
      )}

      <button type="button" className="block w-full p-4 text-left" onClick={onOpen}>
        <div className="flex items-start gap-3">
          {/* Retrato emoldurado, com o nível no canto — como painel de party */}
          <div className="relative shrink-0">
            <div
              className={`grid h-16 w-16 place-items-center overflow-hidden rounded-lg text-2xl ring-2 ${
                emJogo ? 'ring-emerald-400/60' : 'ring-white/15'
              } bg-arcane-600/25`}
            >
              {char.avatarUrl ? (
                <img src={char.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>🧙</span>
              )}
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 grid h-6 min-w-6 place-items-center rounded-full border border-white/20 bg-ink-900 px-1 text-[11px] font-bold text-parchment-50">
              {char.nivel}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg leading-tight text-parchment-50">
              {char.nome || 'Sem nome'}
            </p>
            <p className="truncate text-xs text-parchment-200/60">
              {[char.especie, info ? info.nome : char.classe].filter(Boolean).join(' · ') ||
                'Personagem em branco'}
            </p>
            {autor && <p className="truncate text-[11px] text-arcane-400/80">por {autor}</p>}

            <div className="mt-2 flex items-center gap-2">
              {/* CA como escudo, e não como mais um número numa lista */}
              <span
                className="relative grid h-9 w-8 shrink-0 place-items-center text-xs font-bold text-parchment-50"
                title={`Classe de Armadura ${ca}`}
              >
                <svg viewBox="0 0 24 26" className="absolute inset-0 h-full w-full fill-white/10 stroke-white/25">
                  <path d="M12 1 22 5v9c0 6-4.5 9.5-10 11C6.5 23.5 2 20 2 14V5z" strokeWidth="1.5" />
                </svg>
                <span className="relative">{ca}</span>
              </span>
              <div className="min-w-0 flex-1">
                <BarraDeVida atual={char.pvAtual} max={char.pvMax} temporario={char.pvTemporario} />
              </div>
            </div>
          </div>
        </div>

        {(char.condicoes.length > 0 || char.exaustao > 0 || caido) && (
          <div className="mt-3">
            <SelosDeCondicao
              condicoes={[
                ...(caido ? ['Inconsciente'] : []),
                ...char.condicoes,
                ...(char.exaustao > 0 ? [`Exaustão ${char.exaustao}`] : []),
              ]}
            />
          </div>
        )}

        {pctVida <= 25 && !caido && char.pvMax > 0 && (
          <p className="mt-2 text-[11px] font-medium text-dragon-400">⚠️ Quase morrendo</p>
        )}
      </button>

      {onDelete && (
        <button
          type="button"
          className="absolute bottom-2 right-2 rounded-md px-2 py-1 text-xs text-parchment-200/30 opacity-0 transition hover:text-dragon-400 group-hover:opacity-100"
          onClick={onDelete}
          title="Apagar ficha"
        >
          🗑
        </button>
      )}
    </div>
  )
}

/** Linha de atributo com o modificador, para a ficha resumida. */
export function ResumoAtributos({ char }: { char: Character }) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {(['for', 'des', 'con', 'int', 'sab', 'car'] as const).map((k) => (
        <div key={k} className="rounded bg-white/5 px-1 py-1 text-center">
          <div className="text-[9px] uppercase text-parchment-200/50">{k}</div>
          <div className="text-xs font-semibold text-parchment-50">
            {fmtMod(abilityMod(char.atributos[k]))}
          </div>
        </div>
      ))}
    </div>
  )
}
