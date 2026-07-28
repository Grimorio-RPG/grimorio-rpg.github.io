import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mundo } from '../types'
import { imagemParaPublicar, loadMundo, projetarMundo, saveMundo } from '../lib/mundo'
import { publicarComAtraso, publicarEstado } from '../lib/sync/estado'
import { assinarDadoDoDm, empurrarDadoDoDm } from '../lib/sync/dmSync'
import { CHAVES_MESA, chaveImagemMapa } from '../lib/sync/config'
import { useMesa } from './useSync'

/**
 * Mapas do mundo (persistidos no navegador do DM).
 *
 * Publica em dois ritmos diferentes, e essa é a razão de o hook existir:
 *
 * - **os pontos** saem a cada mexida, com atraso — são poucos bytes;
 * - **as imagens** saem só quando mudam ou quando o mapa é revelado, porque
 *   pesam centenas de KB e reenviá-las a cada ponto revelado torraria a
 *   conexão do grupo à toa.
 */
export function useMundo() {
  const [mundo, setMundo] = useState<Mundo | null>(null)
  const { mesa, souDm } = useMesa()

  useEffect(() => {
    setMundo(loadMundo())
  }, [])

  const update = useCallback((patch: Partial<Mundo>) => {
    setMundo((prev) => (prev ? saveMundo({ ...prev, ...patch }) : prev))
  }, [])

  const mesaId = mesa && souDm ? mesa.id : null

  /**
   * A sua versão, entre os seus aparelhos.
   *
   * Faltava exatamente isto: o app publicava só `mundo_pub`, a projeção que o
   * grupo lê, então o mapa criado no PC não existia no celular do mesmo DM.
   * Aqui a versão completa vai para a chave privada e volta ao vivo.
   *
   * A junção é por mapa e por `atualizadoEm`: o aparelho que editou por último
   * vence, mas um mapa que só existe de um lado nunca é descartado.
   */
  useEffect(() => {
    if (!mesaId) return
    return assinarDadoDoDm<Mundo>(mesaId, CHAVES_MESA.mundo, (remoto) => {
      if (!remoto?.mapas) return
      setMundo((atual) => {
        const base = atual ?? loadMundo()
        const porId = new Map(base.mapas.map((m) => [m.id, m]))
        let mudou = false
        for (const m of remoto.mapas) {
          const local = porId.get(m.id)
          if (!local || (m.atualizadoEm ?? 0) > (local.atualizadoEm ?? 0)) {
            porId.set(m.id, m)
            mudou = true
          }
        }
        // Sem novidade é o eco da própria escrita: ignorar evita a tela piscar.
        if (!mudou) return atual
        const juntos: Mundo = {
          mapas: [...porId.values()],
          mapaAtivoId: base.mapaAtivoId || remoto.mapaAtivoId,
        }
        return saveMundo(juntos)
      })
    })
  }, [mesaId])

  useEffect(() => {
    if (!mesaId || !mundo) return
    empurrarDadoDoDm(mesaId, CHAVES_MESA.mundo, mundo)
  }, [mesaId, mundo])

  // Projeção leve: nomes, coordenadas e o que já foi revelado.
  useEffect(() => {
    if (!mesaId || !mundo) return
    publicarComAtraso(mesaId, CHAVES_MESA.mundoPub, projetarMundo(mundo), 900)
  }, [mesaId, mundo])

  // Imagens: só as dos mapas revelados, e só uma vez cada.
  const publicadas = useRef(new Set<string>())
  useEffect(() => {
    if (!mesaId || !mundo) return
    for (const mapa of mundo.mapas) {
      // `atualizadoEm` entra na marca para uma troca de imagem republicar.
      const marca = `${mapa.id}:${mapa.atualizadoEm}:${mapa.revelado}`
      if (publicadas.current.has(marca)) continue
      const img = imagemParaPublicar(mapa.id)
      if (!img.dataUrl) continue
      publicadas.current.add(marca)
      // Na chave privada sempre: os seus outros aparelhos precisam da imagem
      // mesmo de um mapa ainda escondido do grupo — era por isso que o mapa
      // sincronizava e aparecia sem imagem nenhuma.
      void publicarEstado(mesaId, chaveImagemMapa(mapa.id), img)
      if (mapa.revelado) void publicarEstado(mesaId, chaveImagemMapa(mapa.id, true), img)
    }
  }, [mesaId, mundo])

  // Trocar de mesa (ou sair) invalida o que já foi enviado.
  useEffect(() => {
    publicadas.current.clear()
  }, [mesaId])

  return { mundo, update }
}
