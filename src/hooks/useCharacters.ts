import { useCallback, useEffect, useState } from 'react'
import type { Character } from '../types'
import {
  deleteCharacter as del,
  loadCharacters,
  upsertCharacter,
} from '../lib/storage'
import {
  agendarFichaNaConta,
  assinarFichasDaConta,
  removerFichaDaConta,
} from '../lib/sync/fichas'
import { assinarFichasDaMesa, listarFichasDaMesa } from '../lib/sync/personagens'
import { useMesa } from './useSync'
import { saveCharacters } from '../lib/storage'

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

  const { mesa } = useMesa()

  /**
   * O DM ajustou a minha ficha no combate.
   *
   * A ficha enviada para a mesa é a mesma que está aqui, e agora o DM pode
   * mexer no PV dela durante o encontro. Sem escutar isso, o jogador veria a
   * própria vida cheia enquanto o resto da mesa a via pela metade.
   *
   * Vence o `updatedAt` maior, então uma edição sua feita depois não é
   * atropelada pelo eco da alteração do DM.
   */
  useEffect(() => {
    if (!mesa) return
    const aplicar = () =>
      void listarFichasDaMesa(mesa.id).then((doGrupo) => {
        const locais = loadCharacters()
        let mudou = false
        const juntas = locais.map((local) => {
          const remota = doGrupo.find((f) => f.ficha.id === local.id)?.ficha
          if (!remota || (remota.updatedAt ?? 0) <= (local.updatedAt ?? 0)) return local
          mudou = true
          return remota
        })
        if (!mudou) return
        saveCharacters(juntas)
        setCharacters(juntas)
      })
    aplicar()
    return assinarFichasDaMesa(mesa.id, aplicar)
  }, [mesa?.id])

  const save = useCallback((char: Character) => {
    const lista = upsertCharacter(char)
    setCharacters(lista)
    // Sobe a versão já com o `updatedAt` novo, que é quem decide o desempate.
    // Com atraso: isto é chamado a cada tecla digitada na ficha, e sem juntar a
    // rajada escrever um parágrafo virava centenas de envios da ficha inteira.
    const salva = lista.find((c) => c.id === char.id)
    if (salva) agendarFichaNaConta(salva)
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
