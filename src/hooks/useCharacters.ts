import { useCallback, useEffect, useState } from 'react'
import type { Character } from '../types'
import {
  deleteCharacter as del,
  loadCharacters,
  upsertCharacter,
} from '../lib/storage'

/** Hook central para a lista de fichas persistida no navegador. */
export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([])

  useEffect(() => {
    setCharacters(loadCharacters())
  }, [])

  const save = useCallback((char: Character) => {
    setCharacters(upsertCharacter(char))
  }, [])

  const remove = useCallback((id: string) => {
    setCharacters(del(id))
  }, [])

  const refresh = useCallback(() => {
    setCharacters(loadCharacters())
  }, [])

  return { characters, save, remove, refresh }
}
