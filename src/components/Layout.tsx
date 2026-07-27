import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { DiceTray } from './dice-ui'
import { FormLogin } from './login-ui'
import { Modal } from './layout-ui'
import { useSessao } from '../hooks/useSync'

const NAV = [
  { to: '/fichas', label: 'Fichas', icon: '📜', desc: 'Personagens' },
  { to: '/feiticos', label: 'Feitiços', icon: '✨', desc: 'Grimório' },
  { to: '/bestiario', label: 'Bestiário', icon: '🐲', desc: 'Inimigos' },
  { to: '/batalhas', label: 'Batalhas', icon: '⚔️', desc: 'Combate' },
  { to: '/mapa', label: 'Mapa', icon: '🗺️', desc: 'Mesa virtual' },
  { to: '/mundo', label: 'Mundo', icon: '🧭', desc: 'Mapas & lugares' },
  { to: '/campanha', label: 'Campanha', icon: '📖', desc: 'Resumo & DM' },
  { to: '/mesa', label: 'Mesa', icon: '🎲', desc: 'Jogar em grupo' },
  { to: '/dados', label: 'Dados', icon: '💾', desc: 'Backup' },
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
        <div className="mt-auto space-y-3">
          <BotaoConta />
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-parchment-200/70">
            <p className="font-semibold text-parchment-100">Backup</p>
            <p className="mt-1 leading-relaxed">
              O mundo, o bestiário e o mapa ficam neste aparelho. Exporte na aba{' '}
              <NavLink to="/dados" className="text-arcane-400 hover:underline">Dados</NavLink>{' '}
              ao fim de cada sessão.
            </p>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar (mobile / tablet retrato) */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-900/90 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <Brand small />
            <BotaoConta compacto />
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => (
              <NavItem key={item.to} {...item} compact />
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 pb-24 sm:px-4 sm:py-6 sm:pb-28 md:px-8 md:py-10 md:pb-28">
          <Outlet />
        </main>
        <DiceTray />
      </div>
    </div>
  )
}

/**
 * Conta, em qualquer tela.
 *
 * Antes o login existia só dentro da aba Mesa, o que escondia justamente a
 * coisa que guarda as fichas de quem joga — a pessoa criava a ficha sem conta e
 * a perdia ao trocar de aparelho.
 */
function BotaoConta({ compacto = false }: { compacto?: boolean }) {
  const { nuvemConfigurada, estado, conta } = useSessao()
  const [aberto, setAberto] = useState(false)

  if (!nuvemConfigurada || estado === 'carregando') return null

  if (conta) {
    return (
      <NavLink
        to="/mesa"
        className={
          compacto
            ? 'chip shrink-0 gap-1.5 text-xs'
            : 'flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs text-parchment-200/80 hover:border-arcane-400/40'
        }
        title={`Conectado como ${conta.email}`}
      >
        <span>🧙</span>
        <span className="truncate">{conta.nome}</span>
      </NavLink>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={compacto ? 'btn-primary shrink-0 px-3 py-1 text-xs' : 'btn-primary w-full text-sm'}
      >
        Entrar
      </button>
      {!compacto && (
        <p className="mt-2 text-xs leading-relaxed text-parchment-200/60">
          Entre para as suas fichas ficarem salvas na conta e abrirem em qualquer aparelho.
        </p>
      )}
      {aberto && (
        <Modal titulo="Sua conta" onClose={() => setAberto(false)}>
          <FormLogin compacto />
        </Modal>
      )}
    </>
  )
}

function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={`${import.meta.env.BASE_URL}dragon.svg`} alt="" className={small ? 'h-8 w-8' : 'h-10 w-10'} />
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
