import type { Campaign, Handout, LoreEntry, LoreTipo, Npc, SessionEntry } from '../types'
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
    codex: [],
    handouts: [],
    reputacoes: [],
  }
}

export const TIPOS_LORE: { valor: LoreTipo; label: string; icone: string }[] = [
  { valor: 'local', label: 'Local', icone: '🏰' },
  { valor: 'faccao', label: 'Facção', icone: '⚔️' },
  { valor: 'divindade', label: 'Divindade', icone: '✨' },
  { valor: 'evento', label: 'Evento', icone: '📜' },
  { valor: 'item', label: 'Item lendário', icone: '💎' },
  { valor: 'segredo', label: 'Segredo', icone: '🗝️' },
]

export function tipoLoreInfo(t: LoreTipo) {
  return TIPOS_LORE.find((x) => x.valor === t) ?? TIPOS_LORE[0]
}

export function novoVerbete(tipo: LoreTipo = 'local'): LoreEntry {
  return {
    id: uid(),
    tipo,
    nome: '',
    imagemUrl: '',
    resumo: '',
    descricao: '',
    segredos: '',
    conhecimento: 'desconhecido',
    etiquetas: [],
  }
}

export function novoHandout(): Handout {
  return { id: uid(), titulo: '', texto: '', imagemUrl: '', revelado: false }
}

/** Rótulos da reputação (-3 a +3). */
export const NIVEIS_REPUTACAO: Record<number, { label: string; cor: string }> = {
  [-3]: { label: 'Inimigo jurado', cor: 'text-dragon-400' },
  [-2]: { label: 'Hostil', cor: 'text-dragon-400' },
  [-1]: { label: 'Desconfiada', cor: 'text-amber-400' },
  0: { label: 'Neutra', cor: 'text-parchment-200/70' },
  1: { label: 'Cordial', cor: 'text-emerald-400' },
  2: { label: 'Amigável', cor: 'text-emerald-400' },
  3: { label: 'Aliada', cor: 'text-emerald-400' },
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
      codex: Array.isArray(data.codex) ? data.codex : [],
      handouts: Array.isArray(data.handouts) ? data.handouts : [],
      reputacoes: Array.isArray(data.reputacoes) ? data.reputacoes : [],
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
