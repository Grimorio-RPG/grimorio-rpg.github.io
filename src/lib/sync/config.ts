// Configuração da sincronização em nuvem.
//
// O app funciona 100% sem isto: se as variáveis não existirem, ele opera em
// "modo local" (IndexedDB), exatamente como antes. A nuvem é um extra opcional.

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

/** A nuvem está configurada neste build? */
export const nuvemConfigurada = url.length > 0 && anonKey.length > 0

export const SUPABASE_URL = url
export const SUPABASE_ANON_KEY = anonKey

/**
 * Chaves de estado compartilhado de uma mesa.
 *
 * Convenção importante: chaves terminadas em `_pub` são a **projeção pública**
 * — a versão já censurada que os jogadores podem ler. As demais são privadas
 * do DM. Quem garante isso são as políticas do banco (RLS), não o app.
 */
export const CHAVES_MESA = {
  campanha: 'campanha',
  campanhaPub: 'campanha_pub',
  bestiario: 'bestiario',
  bestiarioPub: 'bestiario_pub',
  batalha: 'batalha',
  batalhaPub: 'batalha_pub',
  mapa: 'mapa',
  mapaPub: 'mapa_pub',
} as const

export type ChaveMesa = (typeof CHAVES_MESA)[keyof typeof CHAVES_MESA]

/** É uma chave que os jogadores podem ler? */
export function ehChavePublica(chave: string): boolean {
  return chave.endsWith('_pub')
}
