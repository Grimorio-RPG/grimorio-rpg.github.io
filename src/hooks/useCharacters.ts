import { useCallback, useEffect, useState } from 'react'
import type { Character } from '../types'
import {
  deleteCharacter as del,
  loadCharacters,
  upsertCharacter,
} from '../lib/storage'
import {
  assinarFichasDaConta,
  removerFichaDaConta,
  salvarFichaNaConta,
} from '../lib/sync/fichas'

/**
 * Hook central para a lista de fichas.
 *
 * A lista continua morando no navegador — o app funciona inteiro offline e sem
 * conta. Quando há conta, cada mudança também sobe para ela, e o que a
 * sincronização trouxer de outro aparelho aparece aqui.
 */
export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([])

  useEffect(() => {
    setCharacters(loadCharacters())
    // A sincronização (disparada no login) reescreve o armazenamento local;
    // sem isto a tela continuaria mostrando a lista antiga.
    return assinarFichasDaConta(() => setCharacters(loadCharacters()))
  }, [])

  const save = useCallback((char: Character) => {
    const lista = upsertCharacter(char)
    setCharacters(lista)
    // Sobe a versão já com o `updatedAt` novo, que é quem decide o desempate.
    const salva = lista.find((c) => c.id === char.id)
    if (salva) void salvarFichaNaConta(salva)
  }, [])

  const remove = useCallback((id: string) => {
    setCharacters(del(id))
    void removerFichaDaConta(id)
  }, [])

  const refresh = useCallback(() => {
    setCharacters(loadCharacters())
  }, [])

  return { characters, save, remove, refresh }
}
