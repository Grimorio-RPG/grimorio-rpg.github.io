import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { DiceTray } from './dice-ui'
import { FormLogin } from './login-ui'
import { Modal } from './layout-ui'
import { useSessao } from '../hooks/useSync'
import { precarregarRota } from '../pages/rotas'
import { CHAVES, readRaw } from '../lib/store'
import { assinarCampanha } from '../lib/campaign'
import { marcaDaEdicao, regrasDe, REGRAS_PADRAO, type Edicao } from '../lib/edicao'

const NAV = [
  // A conta vem primeiro: "entrar" e "jogar em grupo" são perguntas
  // diferentes, e a primeira vem antes. Escondê-la dentro da Mesa fazia quem só
  // queria guardar a ficha na nuvem passar por convite, código e papel de DM.
  { to: '/conta', label: 'Conta', icon: '🧙', desc: 'Login e perfil' },
  { to: '/fichas', label: 'Fichas', icon: '📜', desc: 'Personagens' },
  { to: '/feiticos', label: 'Feitiços', icon: '✨', desc: 'Grimório' },
  { to: '/bestiario', label: 'Bestiário', icon: '🐲', desc: 'Inimigos' },
  // Uma aba só. O mapa é onde a luta acontece, e tê-lo separado do combate
  // obrigava a trocar de tela a cada golpe — a preparação da cena virou um
  // bloco recolhido dentro da própria batalha.
  { to: '/batalhas', label: 'Batalha', icon: '⚔️', desc: 'Mapa e combate' },
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
          {/* As telas chegam em arquivos separados; o menu acima continua no
              lugar enquanto a de dentro carrega. */}
          <Suspense fallback={<Carregando />}>
            <Outlet />
          </Suspense>
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
        to="/conta"
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
  // A marca segue a edição que a mesa escolheu. Afirmar "5.5e" numa campanha
  // que declarou 2014 é o app contradizendo a própria configuração no canto
  // superior esquerdo de toda tela.
  const edicao = useEdicaoDaCampanha()
  return (
    <div className="flex items-center gap-2.5">
      <img src={`${import.meta.env.BASE_URL}dragon.svg`} alt="" className={small ? 'h-8 w-8' : 'h-10 w-10'} />
      <div className="leading-tight">
        <p className={`font-display font-bold text-parchment-50 ${small ? 'text-lg' : 'text-xl'}`}>
          Grimório
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-dragon-400">
          {marcaDaEdicao(edicao)}
        </p>
      </div>
    </div>
  )
}

/**
 * A edição da campanha, lida direto do armazenamento.
 *
 * Sem o hook de campanha inteiro: o menu aparece em toda tela, e carregar a
 * campanha completa — party, códex, sessões — para escrever quatro letras seria
 * pagar caro por um rótulo.
 */
function useEdicaoDaCampanha(): Edicao {
  const [edicao, setEdicao] = useState<Edicao>(REGRAS_PADRAO.edicao)
  useEffect(() => {
    const ler = () => {
      try {
        const bruto = readRaw(CHAVES.campanha)
        if (bruto) setEdicao(regrasDe(JSON.parse(bruto)).edicao)
      } catch {
        // Campanha ilegível: fica no padrão, que é o que o app inteiro é.
      }
    }
    ler()
    // Sem assinar, o DM trocava a edição e o menu só mudava no reload seguinte.
    return assinarCampanha(ler)
  }, [])
  return edicao
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
  // Buscar a tela no passar do mouse (ou no encostar do dedo) tira a espera do
  // caminho: o arquivo chega enquanto a pessoa decide se vai clicar.
  const adiantar = () => precarregarRota(to)

  return (
    <NavLink
      to={to}
      onMouseEnter={adiantar}
      onFocus={adiantar}
      onTouchStart={adiantar}
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

/**
 * O que aparece enquanto a tela pedida está chegando.
 *
 * Some quase sempre antes de ser vista: os arquivos são pequenos e o service
 * worker guarda cada um depois da primeira visita.
 */
function Carregando() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-parchment-200/50">
        <span className="gv-carregando text-3xl" aria-hidden="true">
          🎲
        </span>
        <span className="text-sm">Rolando iniciativa…</span>
      </div>
    </div>
  )
}
