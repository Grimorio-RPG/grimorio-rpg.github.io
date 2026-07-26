import { Link } from 'react-router-dom'
import { useConexao, useMesa } from '../hooks/useSync'

/**
 * Faixa discreta que aparece no topo das telas compartilhadas, dizendo em que
 * mesa você está e se o tempo real está de pé. Some completamente quando a
 * pessoa joga sozinha — quem não usa a nuvem não vê nada disso.
 */
export function SelosDaMesa() {
  const { mesa, souDm } = useMesa()
  const conexao = useConexao()

  if (!mesa) return null

  const status =
    conexao === 'conectado'
      ? { cor: 'bg-emerald-400', texto: 'ao vivo' }
      : conexao === 'conectando'
        ? { cor: 'bg-amber-400 animate-pulse', texto: 'conectando…' }
        : conexao === 'erro'
          ? { cor: 'bg-dragon-500', texto: 'sem conexão' }
          : { cor: 'bg-white/30', texto: 'offline' }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
      <Link
        to="/mesa"
        className="chip hover:border-arcane-400/50 hover:text-parchment-50"
        title="Gerenciar a mesa"
      >
        🎲 {mesa.nome}
      </Link>
      <span className="chip">{souDm ? 'Você é o DM' : 'Você é jogador'}</span>
      <span className="chip gap-1.5">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${status.cor}`} />
        {status.texto}
      </span>
    </div>
  )
}

/** Aviso de tela somente-leitura para jogadores. */
export function AvisoSoLeitura({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border border-arcane-400/30 bg-arcane-600/10 p-3 text-sm text-parchment-200/80">
      {children}
    </div>
  )
}
