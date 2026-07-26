import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Character } from '../types'
import { useConexao, useMesa } from '../hooks/useSync'
import { readJson, writeJson } from '../lib/store'
import { enviarFicha } from '../lib/sync/personagens'

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

// ---------------------------------------------------------------------------
// Compartilhar a ficha com a mesa
// ---------------------------------------------------------------------------

const CHAVE_COMPARTILHADAS = 'grimorio55e.fichasCompartilhadas.v1'

function idsCompartilhados(): string[] {
  const v = readJson<string[]>(CHAVE_COMPARTILHADAS, [])
  return Array.isArray(v) ? v : []
}

/**
 * Botão "enviar para a mesa" da ficha.
 *
 * Depois do primeiro envio a ficha passa a se manter atualizada sozinha: o DM
 * vê o PV e o nível mudarem no painel dele sem ninguém reenviar nada. Enquanto
 * a pessoa não clicar, nada sai do aparelho.
 */
export function BotaoEnviarParaMesa({ char }: { char: Character }) {
  const { mesa } = useMesa()
  const [compartilhada, setCompartilhada] = useState(() => idsCompartilhados().includes(char.id))
  const [estado, setEstado] = useState<'parado' | 'enviando' | 'ok' | 'erro'>('parado')
  const primeiraRenderizacao = useRef(true)

  // Reenvia sozinha quando a ficha muda (com folga, para não mandar a cada tecla)
  useEffect(() => {
    if (!mesa || !compartilhada) return
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }
    const t = setTimeout(() => void enviarFicha(mesa.id, char), 1200)
    return () => clearTimeout(t)
  }, [mesa, compartilhada, char])

  if (!mesa) return null

  async function enviar() {
    if (!mesa) return
    setEstado('enviando')
    const ok = await enviarFicha(mesa.id, char)
    setEstado(ok ? 'ok' : 'erro')
    if (ok && !compartilhada) {
      writeJson(CHAVE_COMPARTILHADAS, [...idsCompartilhados(), char.id])
      setCompartilhada(true)
    }
    setTimeout(() => setEstado('parado'), 2500)
  }

  const rotulo =
    estado === 'enviando'
      ? 'Enviando…'
      : estado === 'ok'
        ? 'Enviada ✓'
        : estado === 'erro'
          ? 'Falhou — tentar de novo'
          : compartilhada
            ? '☁️ Atualizando na mesa'
            : '☁️ Enviar para a mesa'

  return (
    <button
      className={`px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm ${compartilhada ? 'btn-ghost' : 'btn-primary'}`}
      onClick={enviar}
      title={
        compartilhada
          ? `O DM de "${mesa.nome}" vê esta ficha, e ela se atualiza sozinha.`
          : `Compartilha esta ficha com o DM de "${mesa.nome}".`
      }
    >
      {rotulo}
    </button>
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
