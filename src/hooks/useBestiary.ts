import { useCallback, useEffect, useState } from 'react'
import type { Monster } from '../types'
import { loadBestiary, projetarBestiario, saveBestiary } from '../lib/bestiary'
import { publicarComAtraso } from '../lib/sync/estado'
import { CHAVES_MESA } from '../lib/sync/config'
import { useMesa } from './useSync'

/** Hook central do bestiário (persistido no navegador do DM). */
export function useBestiary() {
  const [monstros, setMonstros] = useState<Monster[]>([])
  const { mesa, souDm } = useMesa()

  useEffect(() => {
    setMonstros(loadBestiary())
  }, [])

  // Espelha para a mesa só o que o grupo já descobriu.
  const mesaId = mesa && souDm ? mesa.id : null
  useEffect(() => {
    if (!mesaId) return
    publicarComAtraso(mesaId, CHAVES_MESA.bestiarioPub, projetarBestiario(monstros), 900)
  }, [mesaId, monstros])

  const persist = useCallback((list: Monster[]) => {
    saveBestiary(list)
    setMonstros(list)
  }, [])

  const salvar = useCallback(
    (m: Monster) => {
      setMonstros((prev) => {
        const atualizado = { ...m, updatedAt: Date.now() }
        const idx = prev.findIndex((x) => x.id === m.id)
        const list = idx >= 0 ? prev.map((x) => (x.id === m.id ? atualizado : x)) : [...prev, atualizado]
        saveBestiary(list)
        return list
      })
    },
    [],
  )

  const remover = useCallback((id: string) => {
    setMonstros((prev) => {
      const list = prev.filter((m) => m.id !== id)
      saveBestiary(list)
      return list
    })
  }, [])

  return { monstros, salvar, remover, persist }
}
