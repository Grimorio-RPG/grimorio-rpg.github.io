// Estado compartilhado da mesa: como o que está na tela do DM chega aos
// celulares dos jogadores.
//
// Fluxo: o DM salva algo → publicamos a *projeção pública* (já sem os segredos)
// numa chave `_pub` → o Postgres avisa em tempo real → o app dos jogadores
// recebe e redesenha. Os jogadores nunca escrevem essas chaves, e as políticas
// de RLS impedem que leiam as chaves privadas do DM.

import type { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabase } from './client'

type Ouvinte = (dados: unknown) => void

interface Assinatura {
  canal: RealtimeChannel
  porChave: Map<string, Set<Ouvinte>>
}

const canais = new Map<string, Assinatura>()

/** Estado da conexão em tempo real, para mostrar um indicador na interface. */
export type EstadoConexao = 'offline' | 'conectando' | 'conectado' | 'erro'

let conexao: EstadoConexao = 'offline'
const ouvintesConexao = new Set<() => void>()

export function getConexao(): EstadoConexao {
  return conexao
}

export function assinarConexao(fn: () => void): () => void {
  ouvintesConexao.add(fn)
  return () => ouvintesConexao.delete(fn)
}

function setConexao(v: EstadoConexao) {
  if (conexao === v) return
  conexao = v
  for (const fn of ouvintesConexao) fn()
}

async function garantirCanal(mesaId: string): Promise<Assinatura | null> {
  const existente = canais.get(mesaId)
  if (existente) return existente

  const sb = await getSupabase()
  if (!sb) return null

  const porChave = new Map<string, Set<Ouvinte>>()
  setConexao('conectando')

  const canal = sb
    .channel(`mesa:${mesaId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'mesa_estado', filter: `mesa_id=eq.${mesaId}` },
      (payload) => {
        const linha = (payload.new ?? payload.old) as { chave?: string } | null
        if (!linha?.chave) return
        const chave = linha.chave
        const alvo = porChave.get(chave)
        if (!alvo || alvo.size === 0) return

        if (payload.eventType === 'DELETE') {
          for (const fn of alvo) fn(null)
          return
        }

        // Não usamos `payload.new.dados`: o Realtime tem limite de tamanho por
        // mensagem, e um mapa com a imagem embutida passa fácil desse limite —
        // chegaria truncado. O evento serve só como aviso; o valor vem do banco.
        void lerEstado(mesaId, chave).then((dados) => {
          for (const fn of alvo) fn(dados)
        })
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') setConexao('conectado')
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConexao('erro')
      else if (status === 'CLOSED') setConexao('offline')
    })

  const assinatura: Assinatura = { canal, porChave }
  canais.set(mesaId, assinatura)
  return assinatura
}

async function fecharSeVazio(mesaId: string) {
  const a = canais.get(mesaId)
  if (!a) return
  let total = 0
  for (const s of a.porChave.values()) total += s.size
  if (total > 0) return
  canais.delete(mesaId)
  const sb = await getSupabase()
  await sb?.removeChannel(a.canal)
  if (canais.size === 0) setConexao('offline')
}

/**
 * Escuta uma chave da mesa. Já faz a leitura inicial, então quem assina recebe
 * o valor atual mesmo que nada mude depois.
 */
export function assinarEstado(mesaId: string, chave: string, fn: Ouvinte): () => void {
  let vivo = true

  void (async () => {
    const a = await garantirCanal(mesaId)
    if (!a || !vivo) return
    const set = a.porChave.get(chave) ?? new Set<Ouvinte>()
    set.add(fn)
    a.porChave.set(chave, set)

    const atual = await lerEstado(mesaId, chave)
    if (vivo) fn(atual)
  })()

  return () => {
    vivo = false
    const a = canais.get(mesaId)
    a?.porChave.get(chave)?.delete(fn)
    void fecharSeVazio(mesaId)
  }
}

export async function lerEstado(mesaId: string, chave: string): Promise<unknown | null> {
  const sb = await getSupabase()
  if (!sb) return null
  const { data } = await sb
    .from('mesa_estado')
    .select('dados')
    .eq('mesa_id', mesaId)
    .eq('chave', chave)
    .maybeSingle()
  return data?.dados ?? null
}

/**
 * Publica uma chave. Só o DM consegue (o RLS recusa os demais), então uma falha
 * aqui não é motivo para atrapalhar o jogo: o app segue funcionando local.
 */
export async function publicarEstado(mesaId: string, chave: string, dados: unknown): Promise<boolean> {
  const sb = await getSupabase()
  if (!sb) return false
  const { error } = await sb
    .from('mesa_estado')
    .upsert(
      { mesa_id: mesaId, chave, dados, atualizado_em: new Date().toISOString() },
      { onConflict: 'mesa_id,chave' },
    )
  return !error
}

// ---------------------------------------------------------------------------
// Publicação com atraso
//
// O DM mexe muito (arrastar token, tirar PV de um em um). Sem isso mandaríamos
// uma escrita por tecla digitada.
// ---------------------------------------------------------------------------
const timers = new Map<string, ReturnType<typeof setTimeout>>()
const pendentes = new Map<string, unknown>()

export function publicarComAtraso(mesaId: string, chave: string, dados: unknown, ms = 500) {
  const id = `${mesaId}:${chave}`
  pendentes.set(id, dados)
  const antigo = timers.get(id)
  if (antigo) clearTimeout(antigo)
  timers.set(
    id,
    setTimeout(() => {
      timers.delete(id)
      const valor = pendentes.get(id)
      pendentes.delete(id)
      void publicarEstado(mesaId, chave, valor)
    }, ms),
  )
}
