import { useCallback, useEffect, useState } from 'react'
import type { Battle } from '../types'
import { loadBattle, saveBattle } from '../lib/battle'

/** Hook central da batalha ativa (persistida no navegador). */
export function useBattle() {
  const [battle, setBattle] = useState<Battle | null>(null)

  useEffect(() => {
    setBattle(loadBattle())
  }, [])

  const update = useCallback((patch: Partial<Battle>) => {
    setBattle((prev) => {
      if (!prev) return prev
      return saveBattle({ ...prev, ...patch })
    })
  }, [])

  return { battle, update }
}
