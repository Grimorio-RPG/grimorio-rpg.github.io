import { useCallback, useEffect, useState } from 'react'
import type { MapScene } from '../types'
import { loadScene, persistirCena, projetarCena, saveScene } from '../lib/mapscene'
import { assinarDadoDoDm, empurrarDadoDoDm } from '../lib/sync/dmSync'
import { publicarComAtraso } from '../lib/sync/estado'
import { CHAVES_MESA } from '../lib/sync/config'
import { useMesa } from './useSync'

/** Hook central da cena de mapa (persistida no navegador). */
export function useMapScene() {
  const [scene, setScene] = useState<MapScene | null>(null)
  const [semEspaco, setSemEspaco] = useState(false)
  const { mesa, souDm } = useMesa()

  useEffect(() => {
    setScene(loadScene())
  }, [])

  const mesaId = mesa && souDm ? mesa.id : null

  // A cena completa entre os aparelhos do DM, com os tokens ocultos que a
  // projeção pública remove.
  useEffect(() => {
    if (!mesaId) return
    return assinarDadoDoDm<MapScene>(mesaId, CHAVES_MESA.mapa, (remota) => {
      setScene((atual) => {
        if (!remota?.updatedAt) return atual
        if (atual && (atual.updatedAt ?? 0) >= remota.updatedAt) return atual
        return persistirCena(remota)
      })
    })
  }, [mesaId])

  useEffect(() => {
    if (!mesaId || !scene) return
    empurrarDadoDoDm(mesaId, CHAVES_MESA.mapa, scene)
  }, [mesaId, scene])

  // O mapa é pesado (imagem em data URL); publicamos com mais folga.
  useEffect(() => {
    if (!mesaId || !scene) return
    publicarComAtraso(mesaId, CHAVES_MESA.mapaPub, projetarCena(scene), 1200)
  }, [mesaId, scene])

  const update = useCallback((patch: Partial<MapScene>) => {
    setScene((prev) => {
      if (!prev) return prev
      const r = saveScene({ ...prev, ...patch })
      setSemEspaco(!r.ok)
      return r.scene
    })
  }, [])

  return { scene, update, semEspaco }
}
