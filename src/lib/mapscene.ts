import type { Character, MapScene, Monster, Token } from '../types'
import { uid } from './character'

const KEY = 'grimorio55e.mapscene.v1'

export const CORES_TOKEN = ['#a3312b', '#6a5aa8', '#2f8f5b', '#c99a2e', '#2e7fc9', '#b14a8f', '#5a5a5a']

export function cenaVazia(): MapScene {
  return {
    updatedAt: Date.now(),
    nome: '',
    mapaUrl: '',
    celPx: 48,
    mostrarGrade: true,
    offsetX: 0,
    offsetY: 0,
    encaixarGrade: true,
    zoom: 1,
    tokens: [],
  }
}

/**
 * Ajusta uma posição (fração 0..1) para o centro do quadrado mais próximo.
 * `larguraPx`/`alturaPx` são as dimensões atuais do tabuleiro na tela.
 */
export function encaixar(
  x: number,
  y: number,
  larguraPx: number,
  alturaPx: number,
  celPx: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  if (celPx <= 0 || larguraPx <= 0 || alturaPx <= 0) return { x, y }
  const px = x * larguraPx
  const py = y * alturaPx
  const cx = Math.floor((px - offsetX) / celPx) * celPx + offsetX + celPx / 2
  const cy = Math.floor((py - offsetY) / celPx) * celPx + offsetY + celPx / 2
  return {
    x: Math.max(0, Math.min(1, cx / larguraPx)),
    y: Math.max(0, Math.min(1, cy / alturaPx)),
  }
}

export function loadScene(): MapScene {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return cenaVazia()
    const data = JSON.parse(raw)
    return { ...cenaVazia(), ...data, tokens: Array.isArray(data.tokens) ? data.tokens : [] }
  } catch {
    return cenaVazia()
  }
}

/** Salva a cena. Mapas grandes podem estourar o localStorage — devolve false nesse caso. */
export function saveScene(c: MapScene): { ok: boolean; scene: MapScene } {
  const updated = { ...c, updatedAt: Date.now() }
  try {
    localStorage.setItem(KEY, JSON.stringify(updated))
    return { ok: true, scene: updated }
  } catch {
    return { ok: false, scene: updated }
  }
}

let contador = 0
function proximaPos(): { x: number; y: number } {
  // espalha os tokens numa leve diagonal para não sobreporem
  const n = contador++
  return { x: 0.1 + (n % 6) * 0.06, y: 0.1 + (Math.floor(n / 6) % 6) * 0.08 }
}

export function tokenDePersonagem(c: Character, cor: string): Token {
  const p = proximaPos()
  return {
    id: uid(), nome: c.nome || 'Aventureiro', imagemUrl: c.avatarUrl || '', imagemJogadorUrl: c.avatarUrl || '',
    origem: 'aliado', x: p.x, y: p.y, tamanho: 1, cor, oculto: false, conhecimento: 'completo',
  }
}

export function tokenDeMonstro(m: Monster, cor: string): Token {
  const p = proximaPos()
  const tam = /grande/i.test(m.tamanho) ? 2 : /enorme/i.test(m.tamanho) ? 3 : /colossal/i.test(m.tamanho) ? 4 : 1
  return {
    id: uid(), nome: m.nome || 'Inimigo', imagemUrl: m.imagemUrl, imagemJogadorUrl: m.imagemJogadorUrl,
    origem: 'inimigo', x: p.x, y: p.y, tamanho: tam, cor, oculto: false, conhecimento: m.conhecimento,
  }
}

export function tokenObjeto(nome: string, cor: string): Token {
  const p = proximaPos()
  return {
    id: uid(), nome, imagemUrl: '', imagemJogadorUrl: '', origem: 'objeto',
    x: p.x, y: p.y, tamanho: 1, cor, oculto: false, conhecimento: 'completo',
  }
}
