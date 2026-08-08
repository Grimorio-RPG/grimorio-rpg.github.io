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
  mundo: 'mundo',
  mundoPub: 'mundo_pub',
} as const

export type ChaveMesa = (typeof CHAVES_MESA)[keyof typeof CHAVES_MESA]

/**
 * Chave da imagem de um mapa do mundo — uma por mapa, de propósito.
 *
 * A imagem sobe uma vez e fica; os pontos mudam a cada revelação. Numa chave só,
 * revelar um lugar reenviaria a imagem inteira pela rede. Continua terminando em
 * `_pub`, então a política de RLS já a reconhece como pública — nenhuma regra
 * nova no banco.
 */
export function chaveImagemMapa(id: string, publica = false): string {
  return `mundoimg_${id}${publica ? '_pub' : ''}`
}

/**
 * O id do mapa dentro de uma chave de imagem, ou `null` se não for uma.
 *
 * O par de `chaveImagemMapa`. Existe para a faxina saber de qual mapa é cada
 * linha — e mora aqui, ao lado de quem monta a chave, porque separar os dois
 * seria garantir que um dia um mude sem o outro.
 */
export function mapaDaChaveDeImagem(chave: string): string | null {
  const m = chave.match(/^mundoimg_(.+?)(_pub)?$/)
  return m ? m[1] : null
}

/**
 * As chaves de imagem que não pertencem a mapa nenhum.
 *
 * É o lixo que ficou de quando apagar um mapa não limpava atrás de si: linhas
 * com megabytes de base64 que nenhuma tela lê.
 */
export function chavesOrfas(chaves: string[], idsDeMapas: string[]): string[] {
  const vivos = new Set(idsDeMapas)
  return chaves.filter((c) => {
    const id = mapaDaChaveDeImagem(c)
    return id !== null && !vivos.has(id)
  })
}

/** É uma chave que os jogadores podem ler? */
export function ehChavePublica(chave: string): boolean {
  return chave.endsWith('_pub')
}
