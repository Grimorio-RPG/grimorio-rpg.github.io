import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mundo } from '../types'
import { imagemParaPublicar, loadMundo, projetarMundo, saveMundo } from '../lib/mundo'
import { publicarComAtraso, publicarEstado } from '../lib/sync/estado'
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
      if (!mapa.revelado) continue
      // `atualizadoEm` entra na marca para uma troca de imagem republicar.
      const marca = `${mapa.id}:${mapa.atualizadoEm}`
      if (publicadas.current.has(marca)) continue
      const img = imagemParaPublicar(mapa.id)
      if (!img.dataUrl) continue
      publicadas.current.add(marca)
      void publicarEstado(mesaId, chaveImagemMapa(mapa.id, true), img)
    }
  }, [mesaId, mundo])

  // Trocar de mesa (ou sair) invalida o que já foi enviado.
  useEffect(() => {
    publicadas.current.clear()
  }, [mesaId])

  return { mundo, update }
}
