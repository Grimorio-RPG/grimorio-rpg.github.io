import { useCallback, useEffect, useState } from 'react'
import type { Battle } from '../types'
import { loadBattle, persistirBatalha, projetarBatalha, saveBattle } from '../lib/battle'
import { assinarDadoDoDm, empurrarDadoDoDm } from '../lib/sync/dmSync'
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

  const mesaId = mesa && souDm ? mesa.id : null

  // A batalha inteira entre os aparelhos do DM: começar o encontro no PC e
  // continuar no celular durante a sessão é justamente o caso de uso.
  useEffect(() => {
    if (!mesaId) return
    return assinarDadoDoDm<Battle>(mesaId, CHAVES_MESA.batalha, (remota) => {
      setBattle((atual) => {
        if (!remota?.updatedAt) return atual
        if (atual && (atual.updatedAt ?? 0) >= remota.updatedAt) return atual
        return persistirBatalha(remota)
      })
    })
  }, [mesaId])

  useEffect(() => {
    if (!mesaId || !battle) return
    empurrarDadoDoDm(mesaId, CHAVES_MESA.batalha, battle)
  }, [mesaId, battle])

  // Espelha o encontro para a mesa: cada jogador acompanha pelo próprio
  // celular. Daqui só sai a versão censurada — ver projetarBatalha.
  useEffect(() => {
    if (!mesaId || !battle) return
    publicarComAtraso(mesaId, CHAVES_MESA.batalhaPub, projetarBatalha(battle))
  }, [mesaId, battle])

  return { battle, update }
}
