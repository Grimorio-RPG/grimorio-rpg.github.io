import { useCallback, useEffect, useState } from 'react'
import type { MapScene } from '../types'
import { loadScene, saveScene } from '../lib/mapscene'

/** Hook central da cena de mapa (persistida no navegador). */
export function useMapScene() {
  const [scene, setScene] = useState<MapScene | null>(null)
  const [semEspaco, setSemEspaco] = useState(false)

  useEffect(() => {
    setScene(loadScene())
  }, [])

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
