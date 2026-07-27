import { useCallback, useEffect, useRef, useState } from 'react'
import type { Monster } from '../types'
import { loadBestiary, projetarBestiario, saveBestiary } from '../lib/bestiary'
import { publicarComAtraso } from '../lib/sync/estado'
import { empurrarListaDoDm, puxarListaDoDm } from '../lib/sync/dmSync'
import { CHAVES_MESA } from '../lib/sync/config'
import { useMesa } from './useSync'

/**
 * Hook central do bestiário.
 *
 * Publica em duas chaves, e a diferença entre elas é o ponto:
 *
 * - `bestiario_pub` é a projeção censurada que o **grupo** lê;
 * - `bestiario` é a versão completa, que só o **DM** consegue ler (quem garante
 *   é o RLS) e existe para o bestiário acompanhar o DM entre os aparelhos dele.
 *
 * A segunda faltava: quem cadastrava um chefe no PC não o achava no celular.
 */
export function useBestiary() {
  const [monstros, setMonstros] = useState<Monster[]>([])
  const { mesa, souDm } = useMesa()
  const mesaId = mesa && souDm ? mesa.id : null

  // Evita devolver à nuvem, na hora, o que acabou de vir dela.
  const carregando = useRef(false)

  useEffect(() => {
    setMonstros(loadBestiary())
  }, [])

  // Ao entrar na mesa (ou abrir noutro aparelho), junta o que está na nuvem.
  useEffect(() => {
    if (!mesaId) return
    let vivo = true
    carregando.current = true
    void puxarListaDoDm(mesaId, CHAVES_MESA.bestiario, loadBestiary()).then((juntos) => {
      if (!vivo) return
      saveBestiary(juntos)
      setMonstros(juntos)
      carregando.current = false
    })
    return () => {
      vivo = false
      carregando.current = false
    }
  }, [mesaId])

  useEffect(() => {
    if (!mesaId || carregando.current) return
    // O grupo recebe a versão censurada…
    publicarComAtraso(mesaId, CHAVES_MESA.bestiarioPub, projetarBestiario(monstros), 900)
    // …e você recebe a sua, completa, nos seus outros aparelhos.
    empurrarListaDoDm(mesaId, CHAVES_MESA.bestiario, monstros)
  }, [mesaId, monstros])

  const persist = useCallback((list: Monster[]) => {
    saveBestiary(list)
    setMonstros(list)
  }, [])

  const salvar = useCallback((m: Monster) => {
    setMonstros((prev) => {
      const atualizado = { ...m, updatedAt: Date.now() }
      const idx = prev.findIndex((x) => x.id === m.id)
      const list = idx >= 0 ? prev.map((x) => (x.id === m.id ? atualizado : x)) : [...prev, atualizado]
      saveBestiary(list)
      return list
    })
  }, [])

  const remover = useCallback((id: string) => {
    setMonstros((prev) => {
      const list = prev.filter((m) => m.id !== id)
      saveBestiary(list)
      return list
    })
  }, [])

  return { monstros, salvar, remover, persist }
}
