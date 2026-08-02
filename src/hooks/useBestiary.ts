import { useCallback, useEffect, useState } from 'react'
import type { Monster } from '../types'
import { loadBestiary, projetarBestiario, religarSementes, saveBestiary } from '../lib/bestiary'
import { publicarComAtraso } from '../lib/sync/estado'
import { assinarDadoDoDm, empurrarListaDoDm, juntarPorData } from '../lib/sync/dmSync'
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

  // A nuvem já respondeu para esta mesa? Antes disso não publicamos: o
  // aparelho que abre com uma lista curta apagaria da nuvem o que só existe no
  // outro. É estado, e não ref, de propósito — quando vira `true` o efeito de
  // publicação precisa rodar de novo para enviar o que só existe aqui.
  const [nuvemChegou, setNuvemChegou] = useState(false)

  useEffect(() => {
    setMonstros(loadBestiary())
  }, [])

  useEffect(() => {
    setNuvemChegou(false)
  }, [mesaId])

  /**
   * Recebe as mudanças ao vivo — e também a leitura de abertura.
   *
   * Faltava: quando estendi a sincronização para os outros domínios, o
   * bestiário ficou só com o puxão de abertura. Editar uma criatura no PC não
   * chegava ao celular já aberto, e as duas telas mostravam CA e PV diferentes
   * da mesma criatura.
   *
   * O puxão separado que existia aqui saiu: `assinarEstado` já lê a chave ao
   * assinar, então eram dois downloads do bestiário inteiro — com as imagens —
   * toda vez que a tela montava.
   */
  useEffect(() => {
    if (!mesaId) return
    return assinarDadoDoDm<Monster[]>(mesaId, CHAVES_MESA.bestiario, (remoto) => {
      setNuvemChegou(true)
      if (!Array.isArray(remoto)) return
      setMonstros((atual) => {
        // A lista da nuvem pode trazer sementes com o id antigo e aleatório, de
        // antes do id estável. Religar aqui colapsa as duplicatas que já existem.
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
    if (!mesaId || !nuvemChegou) return
    // O grupo recebe a versão censurada…
    publicarComAtraso(mesaId, CHAVES_MESA.bestiarioPub, projetarBestiario(monstros), 900)
    // …e você recebe a sua, completa, nos seus outros aparelhos.
    empurrarListaDoDm(mesaId, CHAVES_MESA.bestiario, monstros)
  }, [mesaId, monstros, nuvemChegou])

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
