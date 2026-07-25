import type { Campaign, Npc, SessionEntry } from '../types'
import { normalizeCharacter, uid } from './character'
import { CHAVES, readRaw, writeJson } from './store'

const KEY = CHAVES.campanha

export function campanhaVazia(): Campaign {
  return {
    updatedAt: Date.now(),
    nome: '',
    sinopse: '',
    arcoAtual: '',
    party: [],
    npcs: [],
    sessoes: [],
  }
}

export function loadCampaign(): Campaign {
  try {
    const raw = readRaw(KEY)
    if (!raw) return campanhaVazia()
    const data = JSON.parse(raw)
    return {
      ...campanhaVazia(),
      ...data,
      party: Array.isArray(data.party) ? data.party.map(normalizeCharacter) : [],
      npcs: Array.isArray(data.npcs) ? data.npcs : [],
      sessoes: Array.isArray(data.sessoes) ? data.sessoes : [],
    }
  } catch {
    return campanhaVazia()
  }
}

export function saveCampaign(c: Campaign): Campaign {
  const updated = { ...c, updatedAt: Date.now() }
  writeJson(KEY, updated)
  return updated
}

export function novoNpc(): Npc {
  return { id: uid(), nome: '', papel: '', descricao: '', notasSecretas: '' }
}

export function novaSessao(): SessionEntry {
  return { id: uid(), data: '', titulo: '', resumo: '' }
}
