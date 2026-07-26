import { useCallback, useEffect, useState } from 'react'
import type { MapScene } from '../types'
import { loadScene, projetarCena, saveScene } from '../lib/mapscene'
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

  // O mapa é pesado (imagem em data URL); publicamos com mais folga.
  const mesaId = mesa && souDm ? mesa.id : null
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
