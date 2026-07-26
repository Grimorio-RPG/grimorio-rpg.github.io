import type { Battle, Combatant, Character, Monster } from '../types'
import { abilityMod } from './calc'
import { uid } from './character'
import { CHAVES, readRaw, writeJson } from './store'

const KEY = CHAVES.batalha

export function batalhaVazia(): Battle {
  return {
    updatedAt: Date.now(),
    nome: '',
    rodada: 1,
    turnoIndex: 0,
    emAndamento: false,
    combatentes: [],
  }
}

export function loadBattle(): Battle {
  try {
    const raw = readRaw(KEY)
    if (!raw) return batalhaVazia()
    const data = JSON.parse(raw)
    return {
      ...batalhaVazia(),
      ...data,
      combatentes: Array.isArray(data.combatentes) ? data.combatentes.map(normalizeCombatant) : [],
    }
  } catch {
    return batalhaVazia()
  }
}

/** Garante campos novos em combatentes salvos por versões antigas. */
function normalizeCombatant(c: Partial<Combatant>): Combatant {
  return {
    nomeOculto: false,
    condicoes: [],
    conhecimento: 'completo',
    iniciativa: null,
    iniciativaMod: 0,
    ...c,
  } as Combatant
}

export function saveBattle(b: Battle): Battle {
  const updated = { ...b, updatedAt: Date.now() }
  writeJson(KEY, updated)
  return updated
}

/**
 * Projeção pública da batalha — o que sai do aparelho do DM para o dos
 * jogadores.
 *
 * A visão dos jogadores já esconde estas informações na tela, mas isso não
 * bastaria: se os dados completos fossem enviados, bastaria abrir o inspetor do
 * navegador para ler o PV exato e o nome dos inimigos "ocultos". Então a
 * censura acontece ANTES de publicar.
 */
export function projetarBatalha(b: Battle): Battle {
  return {
    ...b,
    combatentes: b.combatentes.map((c) => {
      if (c.origem !== 'inimigo') return c
      // PV vira porcentagem: a barra e o rótulo continuam certos, o número não.
      const pct = c.pvMax > 0 ? Math.round(Math.max(0, Math.min(1, c.pvAtual / c.pvMax)) * 100) : 0
      const img = c.imagemJogadorUrl || c.imagemUrl
      return {
        ...c,
        nome: c.nomeOculto ? '???' : c.nome,
        imagemUrl: img,
        imagemJogadorUrl: img,
        ca: 0,
        iniciativaMod: 0,
        pvMax: 100,
        pvAtual: c.pvAtual > 0 ? Math.max(1, pct) : 0,
      }
    }),
  }
}

/** Cria N combatentes inimigos a partir de um monstro do bestiário. */
export function combatentesDeMonstro(m: Monster, qtd: number): Combatant[] {
  const mod = abilityMod(m.atributos.des)
  return Array.from({ length: Math.max(1, qtd) }, (_, i) => ({
    id: uid(),
    origem: 'inimigo' as const,
    refId: m.id,
    nome: qtd > 1 ? `${m.nome || 'Inimigo'} ${i + 1}` : m.nome || 'Inimigo',
    imagemUrl: m.imagemUrl,
    imagemJogadorUrl: m.imagemJogadorUrl,
    conhecimento: m.conhecimento,
    ca: m.ca,
    pvMax: m.pvMax,
    pvAtual: m.pvMax,
    iniciativa: null,
    iniciativaMod: mod,
    nomeOculto: false,
    condicoes: [],
  }))
}

/** Cria um combatente aliado a partir de uma ficha de personagem. */
export function combatenteDePersonagem(c: Character): Combatant {
  const mod = abilityMod(c.atributos.des) + (c.iniciativaBonus || 0)
  const ca = c.classeArmaduraManual ?? 10 + abilityMod(c.atributos.des)
  return {
    id: uid(),
    origem: 'aliado',
    refId: c.id,
    nome: c.nome || 'Aventureiro',
    imagemUrl: c.avatarUrl || '',
    imagemJogadorUrl: c.avatarUrl || '',
    conhecimento: 'completo',
    ca,
    pvMax: c.pvMax,
    pvAtual: c.pvAtual,
    iniciativa: null,
    iniciativaMod: mod,
    nomeOculto: false,
    condicoes: [],
  }
}

export function rolarIniciativa(mod: number): number {
  return Math.floor(Math.random() * 20) + 1 + mod
}

/** Ordena por iniciativa (desc); quem não rolou vai para o fim. */
export function ordenar(cs: Combatant[]): Combatant[] {
  return [...cs].sort((a, b) => {
    if (a.iniciativa == null && b.iniciativa == null) return 0
    if (a.iniciativa == null) return 1
    if (b.iniciativa == null) return -1
    return b.iniciativa - a.iniciativa
  })
}

export interface StatusPV {
  label: string
  cor: string // classe de fundo tailwind
  texto: string // classe de texto tailwind
  pct: number
}

/** Estado qualitativo de vida — usado na visão dos jogadores (sem números). */
export function statusPV(pvAtual: number, pvMax: number): StatusPV {
  const pct = pvMax > 0 ? Math.max(0, Math.min(100, (pvAtual / pvMax) * 100)) : 0
  if (pvAtual <= 0) return { label: 'Derrotado', cor: 'bg-white/20', texto: 'text-parchment-200/50', pct }
  if (pct > 50) return { label: 'Saudável', cor: 'bg-emerald-500', texto: 'text-emerald-400', pct }
  if (pct > 25) return { label: 'Ferido', cor: 'bg-amber-500', texto: 'text-amber-400', pct }
  return { label: 'Quase morrendo', cor: 'bg-dragon-500', texto: 'text-dragon-400', pct }
}
