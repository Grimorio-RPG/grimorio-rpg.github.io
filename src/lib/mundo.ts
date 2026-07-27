// Mapas do mundo: campanha, região, cidade.
//
// O que este arquivo guarda é leve — nomes, coordenadas e o que já foi
// revelado. As imagens ficam numa chave por mapa (ver `lerImagem`), porque uma
// imagem pesa mil vezes mais que um ponto e quase nunca muda.

import type { ImagemMapa, MapaMundo, Mundo, PontoInteresse, TipoPonto } from '../types'
import { uid } from './character'
import { CHAVES, readRaw, removeRaw, writeJson } from './store'

const KEY = CHAVES.mundo
const KEY_IMG = CHAVES.mundoImagens

export const TIPOS_PONTO: { valor: TipoPonto; label: string; icone: string }[] = [
  { valor: 'cidade', label: 'Cidade', icone: '🏰' },
  { valor: 'ruina', label: 'Ruína', icone: '🏚️' },
  { valor: 'masmorra', label: 'Masmorra', icone: '🕳️' },
  { valor: 'marco', label: 'Marco', icone: '📍' },
  { valor: 'perigo', label: 'Perigo', icone: '☠️' },
  { valor: 'acampamento', label: 'Acampamento', icone: '⛺' },
]

export function tipoPontoInfo(t: TipoPonto) {
  return TIPOS_PONTO.find((x) => x.valor === t) ?? TIPOS_PONTO[3]
}

export const ESCOPOS: { valor: MapaMundo['escopo']; label: string }[] = [
  { valor: 'campanha', label: 'Campanha' },
  { valor: 'regiao', label: 'Região' },
  { valor: 'cidade', label: 'Cidade' },
]

export function mundoVazio(): Mundo {
  return { mapas: [], mapaAtivoId: '' }
}

export function novoMapa(nome = ''): MapaMundo {
  return {
    id: uid(),
    nome,
    escopo: 'regiao',
    pontos: [],
    revelado: false,
    atualizadoEm: Date.now(),
  }
}

/** Ponto novo já nasce escondido: revelar é uma decisão, não um descuido. */
export function novoPonto(x: number, y: number): PontoInteresse {
  return {
    id: uid(),
    nome: '',
    tipo: 'marco',
    x,
    y,
    descricao: '',
    notasSecretas: '',
    revelado: false,
  }
}

export function loadMundo(): Mundo {
  try {
    const raw = readRaw(KEY)
    if (!raw) return mundoVazio()
    const d = JSON.parse(raw)
    return {
      mapas: Array.isArray(d.mapas) ? d.mapas.map(normalizarMapa) : [],
      mapaAtivoId: typeof d.mapaAtivoId === 'string' ? d.mapaAtivoId : '',
    }
  } catch {
    return mundoVazio()
  }
}

function normalizarMapa(m: Partial<MapaMundo>): MapaMundo {
  return {
    ...novoMapa(),
    ...m,
    pontos: Array.isArray(m.pontos) ? m.pontos : [],
  }
}

export function saveMundo(m: Mundo): Mundo {
  writeJson(KEY, m)
  return m
}

// --- Imagens ----------------------------------------------------------------
// Guardadas num mapa id → dataUrl. Ficam fora do objeto principal para que
// salvar um ponto não reescreva megabytes.

function lerImagens(): Record<string, string> {
  try {
    const raw = readRaw(KEY_IMG)
    const d = raw ? JSON.parse(raw) : {}
    return d && typeof d === 'object' ? d : {}
  } catch {
    return {}
  }
}

export function lerImagem(id: string): string {
  return lerImagens()[id] ?? ''
}

export function salvarImagem(id: string, dataUrl: string): void {
  writeJson(KEY_IMG, { ...lerImagens(), [id]: dataUrl })
}

export function apagarImagem(id: string): void {
  const todas = lerImagens()
  delete todas[id]
  if (Object.keys(todas).length === 0) removeRaw(KEY_IMG)
  else writeJson(KEY_IMG, todas)
}

export function imagemParaPublicar(id: string): ImagemMapa {
  return { id, dataUrl: lerImagem(id) }
}

// ---------------------------------------------------------------------------
// Projeção pública
//
// O que sai para o grupo: só mapas revelados, só pontos revelados, e sem as
// anotações do DM. Um mapa escondido não vaza nem o nome.
// ---------------------------------------------------------------------------
export function projetarMundo(m: Mundo): Mundo {
  const mapas = m.mapas
    .filter((mapa) => mapa.revelado)
    .map((mapa) => ({
      ...mapa,
      pontos: mapa.pontos
        .filter((p) => p.revelado)
        .map((p) => ({ ...p, notasSecretas: '' })),
    }))
  return {
    mapas,
    // Se o mapa aberto ainda está escondido, o grupo não recebe atalho para ele.
    mapaAtivoId: mapas.some((x) => x.id === m.mapaAtivoId) ? m.mapaAtivoId : '',
  }
}
