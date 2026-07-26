import type { Atualizacao, Campaign, Handout, LoreEntry, LoreTipo, Npc, SessionEntry } from '../types'
import { normalizeCharacter, uid } from './character'
import { CHAVES, readRaw, writeJson } from './store'

const KEY = CHAVES.campanha

export function campanhaVazia(): Campaign {
  return {
    updatedAt: Date.now(),
    nome: '',
    sinopse: '',
    arcoAtual: '',
    ondeParamos: '',
    party: [],
    npcs: [],
    sessoes: [],
    atualizacoes: [],
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
      atualizacoes: Array.isArray(data.atualizacoes) ? data.atualizacoes : [],
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

export function novaAtualizacao(): Atualizacao {
  return { id: uid(), criadoEm: Date.now(), titulo: '', texto: '', fixado: false, publicado: false }
}

/** Fixadas primeiro, depois da mais recente para a mais antiga. */
export function ordenarAtualizacoes(list: Atualizacao[]): Atualizacao[] {
  return [...list].sort((a, b) => {
    if (a.fixado !== b.fixado) return a.fixado ? -1 : 1
    return b.criadoEm - a.criadoEm
  })
}

export function dataCurta(ms: number): string {
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Projeção pública da campanha — o que o DM publica para o grupo.
 *
 * Mesma ideia da batalha: a "Visão dos Jogadores" já esconde estas coisas na
 * tela, mas aqui a remoção acontece ANTES de sair do aparelho do DM, então não
 * adianta abrir o inspetor do navegador.
 */
export function projetarCampanha(c: Campaign): Campaign {
  return {
    ...c,
    // Fichas do grupo e NPCs (com as notas secretas) nunca saem daqui: o
    // jogador recebe as fichas pela tabela `personagens`, não por aqui.
    party: [],
    npcs: [],
    atualizacoes: c.atualizacoes.filter((a) => a.publicado),
    // Verbetes desconhecidos somem; os demais vão sem o campo de segredos.
    codex: c.codex
      .filter((v) => v.conhecimento !== 'desconhecido')
      .map((v) => ({
        ...v,
        segredos: '',
        // Quem só "ouviu falar" fica no resumo; a descrição vai a partir de
        // "conhece" — é o mesmo corte que a tela já fazia.
        descricao: v.conhecimento === 'desconhecido' || v.conhecimento === 'encontrado' ? '' : v.descricao,
      })),
    handouts: c.handouts.filter((h) => h.revelado),
  }
}
