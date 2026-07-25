import type { ModoRolagem, RollResult } from './dice'
import { CHAVES, readRaw, writeJson } from './store'

// Histórico de rolagens compartilhado entre todas as telas.
// Store minimalista com pub/sub, para o painel de dados e os botões espalhados
// pelo app ficarem sempre em sincronia.

const KEY = CHAVES.rolagens
const LIMITE = 40

let cache: RollResult[] | null = null
const listeners = new Set<() => void>()

function ler(): RollResult[] {
  if (cache) return cache
  try {
    const raw = readRaw(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    cache = Array.isArray(parsed) ? parsed : []
  } catch {
    cache = []
  }
  return cache
}

function escrever(lista: RollResult[]) {
  cache = lista
  try {
    writeJson(KEY, lista)
  } catch {
    // histórico é descartável — se não couber, seguimos só em memória
  }
  listeners.forEach((fn) => fn())
}

export function getRolls(): RollResult[] {
  return ler()
}

export function addRoll(r: RollResult): RollResult {
  escrever([r, ...ler()].slice(0, LIMITE))
  return r
}

export function clearRolls(): void {
  escrever([])
}

export function subscribeRolls(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

// --- Modo de rolagem (vantagem / desvantagem) -------------------------------
// Fica "armado" até ser usado, para o jogador escolher antes de clicar no teste.

let modo: ModoRolagem = 'normal'
let manterModo = false

export function getModo(): ModoRolagem {
  return modo
}

export function setModo(m: ModoRolagem): void {
  modo = m
  listeners.forEach((fn) => fn())
}

export function getManterModo(): boolean {
  return manterModo
}

export function setManterModo(v: boolean): void {
  manterModo = v
  listeners.forEach((fn) => fn())
}

/** Consome o modo atual; volta a normal se não estiver travado. */
export function consumirModo(): ModoRolagem {
  const atual = modo
  if (!manterModo && modo !== 'normal') {
    modo = 'normal'
    listeners.forEach((fn) => fn())
  }
  return atual
}
