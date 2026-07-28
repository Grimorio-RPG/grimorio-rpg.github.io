import { CLASSES } from '../data/rules'
import { infoSubclasse } from '../data/subclass-info'
import { tracosDaSubclasse } from '../data/subclasses'

/**
 * Escolha de subclasse em cartões, com o que cada uma faz.
 *
 * Era um `<select>` com "Mestre de Batalha (Battle Master)" — informação zero
 * para quem nunca jogou. E é a decisão mais pesada do personagem: vem no nível
 * 3 e vale a campanha inteira.
 *
 * O campo `atencao` é o que mais importa aqui. Toda subclasse cobra um preço, e
 * esconder isso é o que faz alguém abandonar o personagem no nível 6.
 */
export function EscolhaDeSubclasse({
  classe,
  valor,
  onEscolher,
  nivel = 3,
}: {
  classe: string
  valor: string
  onEscolher: (subclasse: string) => void
  nivel?: number
}) {
  const opcoes = CLASSES.find((c) => c.nome === classe)?.subclasses ?? []

  if (opcoes.length === 0) {
    return <p className="text-sm text-parchment-200/60">Escolha uma classe primeiro.</p>
  }

  return (
    <div className="space-y-2">
      {opcoes.map((nome) => {
        const info = infoSubclasse(nome)
        const escolhida = valor === nome
        // "Mestre de Batalha (Battle Master)" → nome e original separados.
        const [, pt = nome, en = ''] = nome.match(/^(.*?)\s*\((.*)\)\s*$/) ?? []
        const tracos = tracosDaSubclasse(nome).filter((t) => t.nivel <= nivel)

        return (
          <button
            key={nome}
            type="button"
            onClick={() => onEscolher(nome)}
            className={`w-full rounded-xl border p-3 text-left transition ${
              escolhida
                ? 'border-arcane-400/70 bg-arcane-500/10'
                : 'border-white/10 bg-white/[0.03] hover:border-arcane-400/40'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-lg text-parchment-50">{pt}</span>
              {escolhida && <span className="text-xs text-arcane-400">✓ escolhida</span>}
            </div>
            {en && <p className="text-[11px] uppercase tracking-wide text-parchment-200/35">{en}</p>}

            {info ? (
              <>
                <p className="mt-1.5 text-sm text-parchment-100">{info.resumo}</p>
                <p className="mt-1.5 text-xs text-emerald-400/90">
                  <b>Boa se:</b> {info.bomSe}
                </p>
                <p className="mt-0.5 text-xs text-amber-400/80">
                  <b>Atenção:</b> {info.atencao}
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-sm text-parchment-200/60">
                Ainda não descrevi esta subclasse — consulte o livro antes de escolher.
              </p>
            )}

            {tracos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tracos.map((t) => (
                  <span key={`${t.nivel}-${t.nome}`} className="chip text-[11px]">
                    {t.nivel}· {t.nome}
                  </span>
                ))}
              </div>
            )}
          </button>
        )
      })}
      <p className="pt-1 text-xs text-parchment-200/50">
        A subclasse é permanente. Se estiver em dúvida, as marcadas como boas para a primeira vez
        são as mais fáceis de jogar.
      </p>
    </div>
  )
}
