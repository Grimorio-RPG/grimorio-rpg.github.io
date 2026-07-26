import { useCallback, useEffect, useState } from 'react'
import type { Campaign } from '../types'
import { loadCampaign, projetarCampanha, saveCampaign } from '../lib/campaign'
import { publicarComAtraso } from '../lib/sync/estado'
import { CHAVES_MESA } from '../lib/sync/config'
import { useMesa } from './useSync'

/** Hook central da campanha (persistida no navegador do DM). */
export function useCampaign() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const { mesa, souDm } = useMesa()

  useEffect(() => {
    setCampaign(loadCampaign())
  }, [])

  const update = useCallback((patch: Partial<Campaign>) => {
    setCampaign((prev) => {
      if (!prev) return prev
      return saveCampaign({ ...prev, ...patch })
    })
  }, [])

  // Publica para a mesa a versão já sem NPCs, segredos e rascunhos.
  const mesaId = mesa && souDm ? mesa.id : null
  useEffect(() => {
    if (!mesaId || !campaign) return
    publicarComAtraso(mesaId, CHAVES_MESA.campanhaPub, projetarCampanha(campaign), 900)
  }, [mesaId, campaign])

  return { campaign, update }
}
