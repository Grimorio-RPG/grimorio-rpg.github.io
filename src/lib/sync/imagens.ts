// Imagens no Storage do Supabase.
//
// Antes daqui uma imagem de mapa viajava como data URL dentro de uma linha JSON
// da tabela de estado: 1,5 MB de mapa viram ~2 MB de base64, sobem inteiros a
// cada republicação, descem inteiros para cada jogador — e moram no mesmo lugar
// que os pontos do mapa, que mudam toda vez que o DM revela um lugar.
//
// Aqui a imagem vira arquivo. O que trafega no banco passa a ser o caminho
// dela, que tem algumas dezenas de bytes.
//
// O balde é privado de propósito (ver supabase/storage.sql): um mapa que o DM
// não revelou é segredo dele, e "link difícil de adivinhar" não é fronteira de
// segurança. Para mostrar, o app pede uma URL assinada de curta duração.

import { getSupabase } from './client'

const BALDE = 'imagens'

/** Quanto tempo a URL assinada vale. Uma hora cobre a sessão inteira. */
const VALIDADE_SEGUNDOS = 60 * 60

/**
 * O caminho de um arquivo.
 *
 * A primeira pasta é SEMPRE a mesa: é por ela que as políticas do banco decidem
 * quem lê e quem escreve. Mudar esta forma sem mudar `storage.sql` junto tranca
 * todo mundo do lado de fora.
 */
export function caminhoDaImagem(mesaId: string, pasta: string, id: string, ext = 'webp'): string {
  return `${mesaId}/${pasta}/${id}.${ext}`
}

/** É um caminho do Storage, e não uma imagem embutida? */
export function ehCaminhoDeStorage(valor: string): boolean {
  return !!valor && !valor.startsWith('data:') && !valor.startsWith('http')
}

/** A extensão e o tipo MIME que um data URL declara. */
export function tipoDoDataUrl(dataUrl: string): { mime: string; ext: string } {
  const m = dataUrl.match(/^data:(image\/([a-z+]+));base64,/i)
  if (!m) return { mime: 'image/webp', ext: 'webp' }
  const mime = m[1].toLowerCase()
  const ext = m[2].toLowerCase() === 'jpeg' ? 'jpg' : m[2].toLowerCase()
  return { mime, ext }
}

/** Converte um data URL em bytes, que é o que o Storage aceita. */
export function bytesDoDataUrl(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const bruto = atob(base64)
  const bytes = new Uint8Array(bruto.length)
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i)
  return bytes
}

/**
 * Envia a imagem e devolve o caminho dela.
 *
 * Devolve `null` quando não deu — sem nuvem configurada, sem sessão, ou porque
 * o `storage.sql` ainda não foi rodado. Quem chama continua com o data URL que
 * já tinha: o app não pode parar de funcionar por causa de uma etapa de
 * instalação que ninguém fez ainda.
 */
export async function enviarImagem(
  mesaId: string,
  pasta: string,
  id: string,
  dataUrl: string,
): Promise<string | null> {
  const sb = await getSupabase()
  if (!sb || !dataUrl.startsWith('data:')) return null

  const { mime, ext } = tipoDoDataUrl(dataUrl)
  const caminho = caminhoDaImagem(mesaId, pasta, id, ext)

  const { error } = await sb.storage.from(BALDE).upload(caminho, bytesDoDataUrl(dataUrl), {
    contentType: mime,
    // Trocar o mapa reescreve o mesmo caminho em vez de deixar lixo para trás.
    upsert: true,
  })
  if (error) {
    console.warn('[grimório] não consegui enviar a imagem:', error.message)
    return null
  }
  return caminho
}

// ---------------------------------------------------------------------------
// Ler
//
// A URL assinada expira, então ela é guardada com a hora de vencimento. Sem o
// cache, cada render pediria uma nova ao servidor — e um mapa na tela redesenha
// muitas vezes por segundo enquanto alguém arrasta um token.
// ---------------------------------------------------------------------------

const cache = new Map<string, { url: string; venceEm: number }>()

/** Uma folga para a URL não vencer no meio de um carregamento. */
const FOLGA_MS = 60 * 1000

export async function urlDaImagem(caminho: string): Promise<string | null> {
  if (!ehCaminhoDeStorage(caminho)) return caminho || null

  const guardada = cache.get(caminho)
  if (guardada && guardada.venceEm - FOLGA_MS > Date.now()) return guardada.url

  const sb = await getSupabase()
  if (!sb) return null

  const { data, error } = await sb.storage
    .from(BALDE)
    .createSignedUrl(caminho, VALIDADE_SEGUNDOS)
  if (error || !data?.signedUrl) {
    if (error) console.warn('[grimório] não consegui abrir a imagem:', error.message)
    return null
  }

  cache.set(caminho, { url: data.signedUrl, venceEm: Date.now() + VALIDADE_SEGUNDOS * 1000 })
  return data.signedUrl
}

/** Esquece o que está guardado — ao trocar de mesa ou sair da conta. */
export function limparCacheDeImagens(): void {
  cache.clear()
}

export async function apagarImagem(caminho: string): Promise<void> {
  if (!ehCaminhoDeStorage(caminho)) return
  const sb = await getSupabase()
  if (!sb) return
  cache.delete(caminho)
  const { error } = await sb.storage.from(BALDE).remove([caminho])
  if (error) console.warn('[grimório] não consegui apagar a imagem:', error.message)
}
