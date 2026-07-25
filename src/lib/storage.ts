import type { Character } from '../types'
import { normalizeCharacter } from './character'
import { CHAVES, readRaw, writeJson } from './store'

const KEY = CHAVES.personagens

export function loadCharacters(): Character[] {
  try {
    const raw = readRaw(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeCharacter).sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function saveCharacters(chars: Character[]): void {
  writeJson(KEY, chars)
}

export function upsertCharacter(char: Character): Character[] {
  const chars = loadCharacters()
  const idx = chars.findIndex((c) => c.id === char.id)
  const updated = { ...char, updatedAt: Date.now() }
  if (idx >= 0) chars[idx] = updated
  else chars.push(updated)
  saveCharacters(chars)
  return chars
}

export function deleteCharacter(id: string): Character[] {
  const chars = loadCharacters().filter((c) => c.id !== id)
  saveCharacters(chars)
  return chars
}

// --- Exportar / Importar ---------------------------------------------------

export function exportCharacter(char: Character): void {
  const blob = new Blob([JSON.stringify(char, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const nome = (char.nome || 'ficha').replace(/[^\w\-]+/g, '_').toLowerCase()
  a.href = url
  a.download = `${nome}.grimorio.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseImportedCharacter(text: string): Character {
  const data = JSON.parse(text)
  // dá um novo id para evitar sobrescrever uma ficha existente ao importar
  return normalizeCharacter({ ...data, id: undefined })
}
