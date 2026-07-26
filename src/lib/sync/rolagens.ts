// Rolagens compartilhadas: todo mundo da mesa vê os dados de todo mundo.
//
// O feed é otimista — a sua própria rolagem aparece na hora, sem esperar a ida
// e volta do servidor. Quando o eco do banco chega, a entrada é reconciliada
// pelo id da rolagem em vez de duplicar.

import type { RollResult } from '../dice'
import { getConta } from './auth'
import { getSupabase } from './client'
import { esquecerCanal, relatarStatusCanal } from './estado'
import { listarMembros } from './mesa'

export interface RolagemMesa {
  /** id da rolagem (o mesmo do RollResult) — serve de chave de deduplicação */
  id: string
  autorId: string
  autorNome: string
  minha: boolean
  roll: RollResult
}

const LIMITE = 50

let feed: RolagemMesa[] = []
let mesaAtual: string | null = null
const ouvintes = new Set<() => void>()
let cancelarCanal: (() => void) | null = null

function avisar() {
  for (const fn of ouvintes) fn()
}

export function getFeed(): RolagemMesa[] {
  return feed
}

export function assinarFeed(fn: () => void): () => void {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

/** Insere mantendo a ordem (mais recente primeiro) e sem repetir. */
function mesclar(item: RolagemMesa) {
  const i = feed.findIndex((x) => x.id === item.id)
  if (i >= 0) {
    // Já estava lá (provavelmente a versão otimista): mantém o que veio do banco.
    feed = feed.map((x, k) => (k === i ? { ...item, minha: x.minha || item.minha } : x))
  } else {
    feed = [item, ...feed]
      .sort((a, b) => b.roll.timestamp - a.roll.timestamp)
      .slice(0, LIMITE)
  }
  avisar()
}

// Nomes vêm da tabela de perfis, nunca do que o cliente escreveu na rolagem —
// senão bastaria adulterar o pedido para assinar um 20 natural com o nome de
// outra pessoa. O `autor_id` é garantido pelo banco (RLS).
const nomes = new Map<string, string>()

async function carregarNomes(mesaId: string) {
  for (const m of await listarMembros(mesaId)) nomes.set(m.userId, m.nome)
}

function daLinha(linha: { autor_id: string; dados: unknown }): RolagemMesa | null {
  const roll = linha.dados as RollResult | null
  if (!roll?.id) return null
  return {
    id: roll.id,
    autorId: linha.autor_id,
    autorNome: nomes.get(linha.autor_id) ?? 'Alguém',
    minha: linha.autor_id === getConta()?.id,
    roll,
  }
}

/**
 * Passa a acompanhar as rolagens de uma mesa. Chamar com `null` ao sair da
 * mesa (ou da conta) limpa o feed.
 */
export async function acompanharMesa(mesaId: string | null): Promise<void> {
  if (mesaId === mesaAtual) return
  mesaAtual = mesaId

  cancelarCanal?.()
  cancelarCanal = null
  feed = []
  avisar()

  if (!mesaId) return

  const sb = await getSupabase()
  if (!sb) return

  nomes.clear()
  await carregarNomes(mesaId)
  if (mesaAtual !== mesaId) return

  // Histórico recente, para quem chega no meio da sessão não ver tela vazia.
  const { data } = await sb
    .from('rolagens')
    .select('autor_id, dados')
    .eq('mesa_id', mesaId)
    .order('criado_em', { ascending: false })
    .limit(LIMITE)

  if (mesaAtual !== mesaId) return // trocou de mesa enquanto carregava
  feed = (data ?? []).flatMap((l) => daLinha(l as never) ?? [])
  avisar()

  const canal = sb
    .channel(`rolagens:${mesaId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'rolagens', filter: `mesa_id=eq.${mesaId}` },
      (payload) => {
        const linha = payload.new as { autor_id: string; dados: unknown }
        const item = daLinha(linha)
        if (!item) return
        mesclar(item)

        // Alguém que entrou depois de carregarmos a lista: busca o nome e
        // atualiza a linha já exibida.
        if (!nomes.has(linha.autor_id)) {
          void carregarNomes(mesaId).then(() => {
            const nome = nomes.get(linha.autor_id)
            if (!nome) return
            feed = feed.map((x) => (x.autorId === linha.autor_id ? { ...x, autorNome: nome } : x))
            avisar()
          })
        }
      },
    )
    // Este canal existe para todo mundo que está numa mesa, então é ele que diz
    // ao selo que o tempo real está de pé — inclusive para o DM, que não assina
    // estado nenhum.
    .subscribe((status) => relatarStatusCanal(`rolagens:${mesaId}`, status))

  cancelarCanal = () => {
    esquecerCanal(`rolagens:${mesaId}`)
    void sb.removeChannel(canal)
  }
}

export async function publicarRolagem(mesaId: string, roll: RollResult): Promise<void> {
  const conta = getConta()
  if (!conta) return

  // Otimista: aparece na hora para quem rolou, sem esperar a ida e volta.
  mesclar({
    id: roll.id,
    autorId: conta.id,
    autorNome: conta.nome,
    minha: true,
    roll,
  })

  const sb = await getSupabase()
  if (!sb) return
  await sb.from('rolagens').insert({ mesa_id: mesaId, autor_id: conta.id, dados: roll })
}

/** Esvazia o feed nesta tela (não apaga o histórico dos outros). */
export function limparFeedLocal(): void {
  feed = []
  avisar()
}
