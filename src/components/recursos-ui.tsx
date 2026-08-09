import type { Character } from '../types'
import { devolver, gastar, recursosDoPersonagem, restam, type Recurso } from '../lib/recursos'

/**
 * Os usos de classe, em bolinhas.
 *
 * A ficha listava "Fúria" e parava aí — quantas ainda tinham não estava em
 * lugar nenhum, então vivia na cabeça de quem estava jogando. E memória de mesa
 * erra sempre para o mesmo lado: a favor de quem está perguntando.
 *
 * Bolinha cheia é uso que sobra, vazia é uso queimado. Clicar numa cheia gasta;
 * clicar numa vazia devolve — porque a mesa erra, e desfazer não pode custar um
 * descanso inteiro.
 */
export function PainelDeRecursos({
  char,
  update,
}: {
  char: Character
  /** Sem isto o painel só mostra — é como o DM vê a ficha de outra pessoa. */
  update?: (patch: Partial<Character>) => void
}) {
  const recursos = recursosDoPersonagem(char)
  if (recursos.length === 0) return null

  return (
    <section className="card p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="panel-title">Usos de classe</h3>
        {update && (
          <span className="text-xs text-parchment-200/50">
            Clique para gastar · clique de novo para devolver
          </span>
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {recursos.map((r) => (
          <li key={r.nome} className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-sm font-medium text-parchment-50">{r.nome}</p>
              <span className={`text-xs ${restam(r) === 0 ? 'text-dragon-400' : 'text-parchment-200/60'}`}>
                {restam(r)}/{r.total}
              </span>
            </div>
            <Bolinhas
              recurso={r}
              onGastar={update && (() => update(gastar(char, r.nome)))}
              onDevolver={update && (() => update(devolver(char, r.nome)))}
            />
            <p className="mt-1.5 text-xs text-parchment-200/50">
              Volta no descanso {r.recarga === 'curto' ? 'curto' : 'longo'}.
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Os mesmos usos numa linha só, para quem está olhando a ficha de fora.
 *
 * O DM abre a ficha do grupo para saber se ainda dá para apertar — e "o bárbaro
 * tem fúria?" é a pergunta que decide se a próxima luta é dura ou cruel.
 */
export function RecursosEmChips({ char }: { char: Character }) {
  const recursos = recursosDoPersonagem(char)
  if (recursos.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {recursos.map((r) => (
        <span key={r.nome} className={`chip ${restam(r) === 0 ? 'text-parchment-200/40' : ''}`}>
          {r.nome}{' '}
          <b className={restam(r) === 0 ? 'text-dragon-400' : 'text-parchment-50'}>
            {restam(r)}/{r.total}
          </b>
        </span>
      ))}
    </div>
  )
}

/**
 * A fileira de bolinhas.
 *
 * Vinte Pontos de Foco no nível 20 são vinte bolinhas, e é por isso que elas
 * quebram linha em vez de encolher — vinte pontinhos ilegíveis não contam nada
 * a quem precisa saber quantos sobraram.
 */
function Bolinhas({
  recurso,
  onGastar,
  onDevolver,
}: {
  recurso: Recurso
  onGastar?: () => void
  onDevolver?: () => void
}) {
  const sobram = restam(recurso)
  const editavel = Boolean(onGastar && onDevolver)

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {Array.from({ length: recurso.total }, (_, i) => {
        const cheia = i < sobram
        const classe = cheia
          ? 'border-arcane-400/70 bg-arcane-400/80'
          : 'border-white/15 bg-transparent'
        if (!editavel) {
          return <span key={i} className={`h-4 w-4 rounded-full border ${classe}`} />
        }
        return (
          <button
            key={i}
            type="button"
            onClick={cheia ? onGastar : onDevolver}
            title={cheia ? `Gastar 1 de ${recurso.nome}` : `Devolver 1 de ${recurso.nome}`}
            aria-label={cheia ? `Gastar 1 de ${recurso.nome}` : `Devolver 1 de ${recurso.nome}`}
            className={`h-4 w-4 rounded-full border transition hover:scale-110 ${classe}`}
          />
        )
      })}
    </div>
  )
}
