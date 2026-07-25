import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/fichas', label: 'Fichas', icon: '📜', desc: 'Personagens' },
  { to: '/feiticos', label: 'Feitiços', icon: '✨', desc: 'Grimório' },
  { to: '/bestiario', label: 'Bestiário', icon: '🐲', desc: 'Inimigos' },
  { to: '/batalhas', label: 'Batalhas', icon: '⚔️', desc: 'Combate' },
  { to: '/mapa', label: 'Mapa', icon: '🗺️', desc: 'Mesa virtual' },
  { to: '/campanha', label: 'Campanha', icon: '📖', desc: 'Resumo & DM' },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-ink-800/50 p-4 md:flex">
        <Brand />
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-parchment-200/70">
          <p className="font-semibold text-parchment-100">Dados salvos neste navegador</p>
          <p className="mt-1 leading-relaxed">
            Suas fichas ficam só neste dispositivo. Use <b>Exportar</b> para
            enviar ao seu DM ou fazer backup.
          </p>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar (mobile / tablet retrato) */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-900/90 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-3 py-2">
            <Brand small />
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => (
              <NavItem key={item.to} {...item} compact />
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/dragon.svg" alt="" className={small ? 'h-8 w-8' : 'h-10 w-10'} />
      <div className="leading-tight">
        <p className={`font-display font-bold text-parchment-50 ${small ? 'text-lg' : 'text-xl'}`}>
          Grimório
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-dragon-400">D&D 5.5e</p>
      </div>
    </div>
  )
}

function NavItem({
  to,
  label,
  icon,
  desc,
  compact = false,
}: {
  to: string
  label: string
  icon: string
  desc?: string
  compact?: boolean
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
          compact ? 'shrink-0 flex-col gap-0 px-2.5 py-1 text-[11px]' : '',
          isActive
            ? 'bg-dragon-500/20 text-parchment-50 ring-1 ring-dragon-500/40'
            : 'text-parchment-200/80 hover:bg-white/5 hover:text-parchment-50',
        ].join(' ')
      }
    >
      <span className={compact ? 'text-sm' : 'text-base'}>{icon}</span>
      <span className="flex flex-col leading-tight">
        <span className="font-semibold">{label}</span>
        {desc && !compact && <span className="text-[11px] text-parchment-200/50">{desc}</span>}
      </span>
    </NavLink>
  )
}
