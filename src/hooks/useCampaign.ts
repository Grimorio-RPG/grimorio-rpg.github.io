import { useCallback, useEffect, useState } from 'react'
import type { Campaign } from '../types'
import { loadCampaign, saveCampaign } from '../lib/campaign'

/** Hook central da campanha (persistida no navegador do DM). */
export function useCampaign() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)

  useEffect(() => {
    setCampaign(loadCampaign())
  }, [])

  const update = useCallback((patch: Partial<Campaign>) => {
    setCampaign((prev) => {
      if (!prev) return prev
      return saveCampaign({ ...prev, ...patch })
    })
  }, [])

  return { campaign, update }
}
