import { useCallback, useEffect, useRef, useState } from 'react'
import type { Monster } from '../types'
import { loadBestiary, projetarBestiario, religarSementes, saveBestiary } from '../lib/bestiary'
import { publicarComAtraso } from '../lib/sync/estado'
import { assinarDadoDoDm, empurrarListaDoDm, juntarPorData, puxarListaDoDm } from '../lib/sync/dmSync'
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
    void puxarListaDoDm(mesaId, CHAVES_MESA.bestiario, loadBestiary()).then((bruto) => {
      if (!vivo) return
      // A lista da nuvem pode trazer sementes com o id antigo e aleatório, de
      // antes do id estável. Religar aqui colapsa as duplicatas que já existem.
      const juntos = religarSementes(bruto)
      saveBestiary(juntos)
      setMonstros(juntos)
      carregando.current = false
    })
    return () => {
      vivo = false
      carregando.current = false
    }
  }, [mesaId])

  /**
   * Recebe as mudanças ao vivo.
   *
   * Faltava: quando estendi a sincronização para os outros domínios, o
   * bestiário ficou só com o puxão de abertura. Editar uma criatura no PC não
   * chegava ao celular já aberto, e as duas telas mostravam CA e PV diferentes
   * da mesma criatura.
   */
  useEffect(() => {
    if (!mesaId) return
    return assinarDadoDoDm<Monster[]>(mesaId, CHAVES_MESA.bestiario, (remoto) => {
      if (!Array.isArray(remoto)) return
      setMonstros((atual) => {
        const juntos = religarSementes(juntarPorData(atual, remoto))
        // Sem novidade é o eco da própria escrita: ignorar evita repintar a
        // lista a cada tecla digitada no editor.
        if (JSON.stringify(juntos) === JSON.stringify(atual)) return atual
        saveBestiary(juntos)
        return juntos
      })
    })
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
