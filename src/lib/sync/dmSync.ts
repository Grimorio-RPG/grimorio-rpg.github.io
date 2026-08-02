// Os dados do DM entre os aparelhos do próprio DM.
//
// Até aqui o app só publicava a projeção pública (`*_pub`) — a versão censurada
// que os jogadores leem. As chaves privadas existiam em `CHAVES_MESA` e nunca
// eram usadas, então o bestiário criado no PC não aparecia no celular do mesmo
// DM. Era a "limitação conhecida" da documentação.
//
// O banco já permitia isto desde sempre: a política `le estado permitido` deixa
// o DM ler qualquer chave da mesa dele, `_pub` ou não. Faltava o app usar.

import { assinarEstado, lerEstado, publicarComAtraso } from './estado'

/** Qualquer coisa com carimbo de tempo — é o que resolve o empate. */
interface ComData {
  id: string
  updatedAt: number
}

/**
 * Junta a lista local com a que veio da nuvem, item a item.
 *
 * Vence o `updatedAt` maior; o que existe só de um lado é mantido. Não dá para
 * simplesmente confiar na nuvem: quem editou offline no celular perderia o
 * trabalho ao abrir o PC.
 */
export function juntarPorData<T extends ComData>(locais: T[], remotos: T[]): T[] {
  const porId = new Map<string, T>()
  for (const item of locais) porId.set(item.id, item)
  for (const item of remotos) {
    const local = porId.get(item.id)
    if (!local || (item.updatedAt ?? 0) > (local.updatedAt ?? 0)) porId.set(item.id, item)
  }
  return [...porId.values()]
}

/**
 * Baixa a versão da nuvem de uma chave privada e junta com a local.
 *
 * Devolve a lista já unificada, ou a local quando não há mesa / nuvem.
 */
export async function puxarListaDoDm<T extends ComData>(
  mesaId: string | null,
  chave: string,
  locais: T[],
): Promise<T[]> {
  if (!mesaId) return locais
  const remoto = (await lerEstado(mesaId, chave)) as T[] | null
  if (!Array.isArray(remoto)) return locais
  return juntarPorData(locais, remoto)
}

/** Publica a versão privada, só para o DM. Com atraso: ele edita muito. */
export function empurrarListaDoDm<T>(mesaId: string | null, chave: string, lista: T[]): void {
  if (!mesaId) return
  publicarComAtraso(mesaId, chave, lista, 1200)
}

/**
 * Acompanha uma chave privada do DM ao vivo, entre os aparelhos dele.
 *
 * Puxar só ao abrir a tela resolve "mudei no PC e depois abri no celular", mas
 * não "os dois abertos ao mesmo tempo". `mesa_estado` já está na publicação de
 * tempo real, e o RLS deixa o DM ler as chaves privadas da mesa dele — então dá
 * para escutar a própria chave e receber a mudança na hora.
 *
 * O eco da própria escrita também chega; quem chama compara e ignora quando não
 * há novidade, senão a tela pisca a cada tecla digitada.
 *
 * O `null` é entregue, não engolido: numa mesa recém-criada a chave ainda não
 * existe, e quem espera a nuvem responder para só então publicar ficaria
 * esperando para sempre — nunca enviando o que tem.
 */
export function assinarDadoDoDm<T>(
  mesaId: string | null,
  chave: string,
  aoReceber: (dados: T | null) => void,
): () => void {
  if (!mesaId) return () => {}
  return assinarEstado(mesaId, chave, (dados) => aoReceber((dados ?? null) as T | null))
}

/** Publica um objeto (não lista) na chave privada. */
export function empurrarDadoDoDm<T>(mesaId: string | null, chave: string, dados: T): void {
  if (!mesaId) return
  publicarComAtraso(mesaId, chave, dados, 1200)
}
