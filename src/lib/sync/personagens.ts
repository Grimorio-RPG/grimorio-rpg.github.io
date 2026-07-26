// Fichas do grupo na nuvem.
//
// Regra de acesso (definida no RLS, não aqui): cada jogador escreve só a
// própria ficha; todos os membros da mesa leem as fichas da mesa. Na prática é
// isto que faz o DM enxergar as fichas do grupo sem que ninguém possa alterar a
// ficha alheia.

import type { Character } from '../../types'
import { normalizeCharacter } from '../character'
import { getConta } from './auth'
import { getSupabase } from './client'

export interface FichaDaMesa {
  /** id da linha no banco (não é o id local da ficha) */
  linhaId: string
  donoId: string
  donoNome: string
  atualizadoEm: string
  ficha: Character
}

/**
 * Envia (ou atualiza) uma ficha na mesa.
 *
 * O id local da ficha é a chave de deduplicação: reenviar a mesma ficha
 * atualiza a linha em vez de criar outra.
 */
export async function enviarFicha(mesaId: string, ficha: Character): Promise<boolean> {
  const sb = await getSupabase()
  const conta = getConta()
  if (!sb || !conta) return false

  const { data: existente } = await sb
    .from('personagens')
    .select('id')
    .eq('mesa_id', mesaId)
    .eq('dono_id', conta.id)
    .eq('dados->>id', ficha.id)
    .maybeSingle()

  if (existente?.id) {
    const { error } = await sb
      .from('personagens')
      .update({ dados: ficha, atualizado_em: new Date().toISOString() })
      .eq('id', existente.id)
    return !error
  }

  const { error } = await sb
    .from('personagens')
    .insert({ mesa_id: mesaId, dono_id: conta.id, dados: ficha })
  return !error
}

export async function removerFicha(linhaId: string): Promise<boolean> {
  const sb = await getSupabase()
  if (!sb) return false
  const { error } = await sb.from('personagens').delete().eq('id', linhaId)
  return !error
}

function umDe<T>(v: unknown): T | null {
  if (Array.isArray(v)) return (v[0] as T) ?? null
  return (v as T) ?? null
}

export async function listarFichasDaMesa(mesaId: string): Promise<FichaDaMesa[]> {
  const sb = await getSupabase()
  if (!sb) return []
  const { data } = await sb
    .from('personagens')
    .select('id, dono_id, atualizado_em, dados, profiles:dono_id(nome)')
    .eq('mesa_id', mesaId)
    .order('atualizado_em', { ascending: false })

  return (data ?? []).flatMap((linha) => {
    const perfil = umDe<{ nome: string }>((linha as { profiles?: unknown }).profiles)
    const dados = linha.dados as Partial<Character> | null
    if (!dados) return []
    return [
      {
        linhaId: linha.id as string,
        donoId: linha.dono_id as string,
        donoNome: perfil?.nome || 'Jogador',
        atualizadoEm: linha.atualizado_em as string,
        ficha: normalizeCharacter(dados),
      },
    ]
  })
}

/** Avisa quando qualquer ficha da mesa muda (o DM vê o grupo ao vivo). */
export function assinarFichasDaMesa(mesaId: string, aoMudar: () => void): () => void {
  let canal: { unsubscribe: () => void } | null = null
  let vivo = true

  void (async () => {
    const sb = await getSupabase()
    if (!sb || !vivo) return
    const c = sb
      .channel(`personagens:${mesaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personagens', filter: `mesa_id=eq.${mesaId}` },
        () => aoMudar(),
      )
      .subscribe()
    if (!vivo) void sb.removeChannel(c)
    else canal = c as unknown as { unsubscribe: () => void }
  })()

  return () => {
    vivo = false
    void (async () => {
      const sb = await getSupabase()
      if (sb && canal) await sb.removeChannel(canal as never)
    })()
  }
}
