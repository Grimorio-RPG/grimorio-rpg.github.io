import type { ReactNode } from 'react'

export default function ComingSoon({
  icon,
  titulo,
  descricao,
  planejado,
}: {
  icon: string
  titulo: string
  descricao: string
  planejado: ReactNode[]
}) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h1 className="text-3xl text-parchment-50">{titulo}</h1>
          <p className="mt-1 max-w-2xl text-sm text-parchment-200/60">{descricao}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-arcane-400/40 bg-arcane-500/10 px-3 py-1 text-xs font-semibold text-arcane-400">
          Em construção · próximas etapas
        </div>
        <ul className="space-y-3">
          {planejado.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-dragon-400" />
              <span className="text-sm leading-relaxed text-parchment-100">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-parchment-200/60">
          A ficha de personagem é o foco do MVP e já está funcional. Estas telas
          têm a navegação pronta e serão preenchidas nas próximas iterações — me
          diga por qual delas quer que eu comece.
        </p>
      </div>
    </div>
  )
}
