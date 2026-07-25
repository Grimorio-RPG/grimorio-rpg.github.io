import { useSyncExternalStore } from 'react'
import { getRolls, subscribeRolls } from '../lib/rollLog'

/** Histórico de rolagens, sempre em sincronia entre as telas. */
export function useRolls() {
  return useSyncExternalStore(subscribeRolls, getRolls, getRolls)
}
