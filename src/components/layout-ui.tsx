import type { ReactNode } from 'react'

/** Cabeçalho padrão das páginas: ícone, título, subtítulo e ações à direita. */
export function PageHeader({
  icon,
  titulo,
  subtitulo,
  acoes,
}: {
  icon: string
  titulo: string
  subtitulo: string
  acoes?: ReactNode
}) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-6 sm:gap-4">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-xl sm:h-11 sm:w-11 sm:text-2xl">
          {icon}
        </span>
        <div>
          <h1 className="text-xl leading-tight text-parchment-50 sm:text-3xl">{titulo}</h1>
          <p className="mt-1 max-w-xl text-xs text-parchment-200/60 sm:text-sm">{subtitulo}</p>
        </div>
      </div>
      {acoes}
    </header>
  )
}

/**
 * Alternância Visão do DM ↔ Visão dos Jogadores, usada em várias abas.
 * `labelCurto` é exibido em telas pequenas para o controle não quebrar linha.
 */
export function ViewToggle<T extends string>({
  valor,
  onChange,
  opcoes,
}: {
  valor: T
  onChange: (v: T) => void
  opcoes: { valor: T; label: string; labelCurto?: string }[]
}) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-ink-900/60 p-1 text-xs sm:text-sm">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          onClick={() => onChange(o.valor)}
          className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 font-semibold transition sm:px-3 ${
            valor === o.valor
              ? 'bg-dragon-500 text-parchment-50 shadow'
              : 'text-parchment-200/70 hover:text-parchment-50'
          }`}
        >
          {o.labelCurto ? (
            <>
              <span className="sm:hidden">{o.labelCurto}</span>
              <span className="hidden sm:inline">{o.label}</span>
            </>
          ) : (
            o.label
          )}
        </button>
      ))}
    </div>
  )
}

/** Estado vazio padrão. */
export function EmptyState({
  icon,
  titulo,
  texto,
  acao,
}: {
  icon: string
  titulo: string
  texto: string
  acao?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-4 p-10 text-center sm:p-12">
      <div className="text-5xl opacity-80">{icon}</div>
      <div>
        <h3 className="text-xl text-parchment-50">{titulo}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-parchment-200/60">{texto}</p>
      </div>
      {acao}
    </div>
  )
}

/** Modal padrão (fecha ao clicar fora ou no botão). */
export function Modal({
  children,
  onClose,
  largura = 'max-w-2xl',
  titulo,
  rodape,
}: {
  children: ReactNode
  onClose: () => void
  largura?: string
  titulo?: string
  rodape?: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div className={`card gv-fade my-6 w-full ${largura} p-5 sm:p-6`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo ? <h2 className="text-xl text-parchment-50">{titulo}</h2> : <span />}
          <button className="btn-ghost px-3 py-1.5 text-sm" onClick={onClose}>Fechar ✕</button>
        </div>
        {children}
        {rodape && <div className="mt-6 flex flex-wrap justify-end gap-2">{rodape}</div>}
      </div>
    </div>
  )
}

/**
 * O nome oficial em inglês, pequeno, entre parênteses.
 *
 * Traduzir tudo cria um problema que só aparece na mesa: a pessoa lê "Orbe
 * Cromático" aqui e "Chromatic Orb" no livro, na planilha do grupo, no fórum e
 * em qualquer busca. O original precisa estar por perto — mas não pode
 * competir com o nome que se lê em voz alta, daí pequeno e apagado.
 *
 * Some sozinho quando os dois nomes são iguais: "Clone (Clone)" não informa
 * nada e só suja a linha.
 */
export function Original({ pt, en }: { pt: string; en?: string }) {
  if (!en || en === pt) return null
  // `font-body` de propósito: os títulos usam Cinzel, que só tem maiúsculas, e
  // "Sacred Flame" sairia "SACRED FLAME". Esta é a palavra que a pessoa vai
  // digitar numa busca ou procurar no índice do livro — ela tem de aparecer
  // com a grafia exata, não com a do enfeite.
  return (
    <span className="ml-1.5 font-body text-[11px] font-normal tracking-normal text-parchment-200/35">
      ({en})
    </span>
  )
}

/** Barra de ferramentas: agrupa busca, filtros e botões. */
export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="card mb-6 flex flex-wrap items-center gap-2 p-3">{children}</div>
}

/** Chip de filtro selecionável. */
export function FilterChip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        ativo
          ? 'bg-arcane-500 text-parchment-50'
          : 'border border-white/10 text-parchment-200/70 hover:bg-white/5 hover:text-parchment-50'
      }`}
    >
      {children}
    </button>
  )
}
