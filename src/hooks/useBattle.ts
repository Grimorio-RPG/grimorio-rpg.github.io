import { useCallback, useEffect, useState } from 'react'
import type { Battle } from '../types'
import { loadBattle, projetarBatalha, saveBattle } from '../lib/battle'
import { publicarComAtraso } from '../lib/sync/estado'
import { CHAVES_MESA } from '../lib/sync/config'
import { useMesa } from './useSync'

/** Hook central da batalha ativa (persistida no navegador). */
export function useBattle() {
  const [battle, setBattle] = useState<Battle | null>(null)
  const { mesa, souDm } = useMesa()

  useEffect(() => {
    setBattle(loadBattle())
  }, [])

  const update = useCallback((patch: Partial<Battle>) => {
    setBattle((prev) => {
      if (!prev) return prev
      return saveBattle({ ...prev, ...patch })
    })
  }, [])

  // Espelha o encontro para a mesa: cada jogador acompanha pelo próprio
  // celular. Daqui só sai a versão censurada — ver projetarBatalha.
  const mesaId = mesa && souDm ? mesa.id : null
  useEffect(() => {
    if (!mesaId || !battle) return
    publicarComAtraso(mesaId, CHAVES_MESA.batalhaPub, projetarBatalha(battle))
  }, [mesaId, battle])

  return { battle, update }
}
