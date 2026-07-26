import { useEffect, useState } from 'react'
import { assinarSessao, getConta, getEstadoSessao } from '../lib/sync/auth'
import { assinarMesa, carregandoMesa, getMesa } from '../lib/sync/mesa'
import { assinarConexao, assinarEstado, getConexao } from '../lib/sync/estado'
import { nuvemConfigurada } from '../lib/sync/config'
import { assinarFeed, getFeed } from '../lib/sync/rolagens'

/** Conta conectada (ou nada, em modo local). */
export function useSessao() {
  const [, forcar] = useState(0)
  useEffect(() => assinarSessao(() => forcar((n) => n + 1)), [])
  return {
    nuvemConfigurada,
    estado: getEstadoSessao(),
    conta: getConta(),
  }
}

/** Mesa atual e meu papel nela. */
export function useMesa() {
  const [, forcar] = useState(0)
  useEffect(() => assinarMesa(() => forcar((n) => n + 1)), [])
  const mesa = getMesa()
  return {
    mesa,
    carregando: carregandoMesa(),
    /** Sem mesa, o app é "só seu": você manda em tudo, como antes. */
    souDm: mesa === null || mesa.papel === 'dm',
    /** Estou vendo a mesa de outra pessoa? Então a tela é só leitura. */
    souJogador: mesa !== null && mesa.papel === 'jogador',
  }
}

/** Rolagens de todos os membros da mesa, ao vivo. */
export function useFeedDaMesa() {
  const [, forcar] = useState(0)
  useEffect(() => assinarFeed(() => forcar((n) => n + 1)), [])
  return getFeed()
}

/** Estado do tempo real (para o indicador de conexão). */
export function useConexao() {
  const [, forcar] = useState(0)
  useEffect(() => assinarConexao(() => forcar((n) => n + 1)), [])
  return getConexao()
}

/**
 * Acompanha uma chave compartilhada da mesa em tempo real.
 *
 * Devolve `undefined` enquanto carrega e `null` quando o DM ainda não publicou
 * nada — a interface precisa distinguir "esperando" de "não tem nada".
 */
export function useEstadoMesa<T>(mesaId: string | null, chave: string): T | null | undefined {
  const [valor, setValor] = useState<T | null | undefined>(undefined)

  useEffect(() => {
    if (!mesaId) {
      setValor(undefined)
      return
    }
    setValor(undefined)
    return assinarEstado(mesaId, chave, (dados) => setValor((dados as T) ?? null))
  }, [mesaId, chave])

  return valor
}
