import { useCallback, useEffect, useState } from 'react'
import type { Campaign } from '../types'
import { loadCampaign, persistirCampanha, projetarCampanha, saveCampaign } from '../lib/campaign'
import { publicarComAtraso } from '../lib/sync/estado'
import { assinarDadoDoDm, empurrarDadoDoDm } from '../lib/sync/dmSync'
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

  const mesaId = mesa && souDm ? mesa.id : null

  /**
   * A campanha completa, entre os aparelhos do próprio DM.
   *
   * Só a projeção pública era publicada, então NPCs, segredos e a crônica da
   * estrada ficavam presos no navegador onde foram escritos. Aqui a versão
   * inteira vai para a chave privada — que o RLS só entrega ao DM — e volta ao
   * vivo. Vence o `updatedAt` maior; o eco da própria escrita é ignorado.
   */
  useEffect(() => {
    if (!mesaId) return
    return assinarDadoDoDm<Campaign>(mesaId, CHAVES_MESA.campanha, (remota) => {
      setCampaign((atual) => {
        if (!remota?.updatedAt) return atual
        if (atual && (atual.updatedAt ?? 0) >= remota.updatedAt) return atual
        return persistirCampanha(remota)
      })
    })
  }, [mesaId])

  useEffect(() => {
    if (!mesaId || !campaign) return
    empurrarDadoDoDm(mesaId, CHAVES_MESA.campanha, campaign)
  }, [mesaId, campaign])

  // Publica para a mesa a versão já sem NPCs, segredos e rascunhos.
  useEffect(() => {
    if (!mesaId || !campaign) return
    publicarComAtraso(mesaId, CHAVES_MESA.campanhaPub, projetarCampanha(campaign), 900)
  }, [mesaId, campaign])

  return { campaign, update }
}
