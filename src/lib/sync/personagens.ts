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

/**
 * Fichas que o grupo compartilhou.
 *
 * Em duas consultas pelo mesmo motivo de `listarMembros`: o *embed*
 * `profiles:dono_id(nome)` exige uma chave estrangeira que não existe —
 * `personagens.dono_id` referencia `auth.users`, não `public.profiles`. A
 * consulta falhava e o painel do DM ficava vazio mesmo com fichas enviadas.
 */
export async function listarFichasDaMesa(mesaId: string): Promise<FichaDaMesa[]> {
  const sb = await getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('personagens')
    .select('id, dono_id, atualizado_em, dados')
    .eq('mesa_id', mesaId)
    .order('atualizado_em', { ascending: false })

  if (error || !data?.length) {
    if (error) console.warn('[grimório] não consegui listar as fichas da mesa:', error.message)
    return []
  }

  const ids = [...new Set(data.map((l) => l.dono_id as string))]
  const { data: perfis } = await sb.from('profiles').select('id, nome').in('id', ids)
  const nomes = new Map((perfis ?? []).map((p) => [p.id as string, (p.nome as string) || '']))

  return data.flatMap((linha) => {
    const dados = linha.dados as Partial<Character> | null
    if (!dados) return []
    return [
      {
        linhaId: linha.id as string,
        donoId: linha.dono_id as string,
        donoNome: nomes.get(linha.dono_id as string) || 'Jogador',
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

/**
 * O DM ajusta o estado de combate de uma ficha do grupo.
 *
 * Escreve apenas PV e condições, mesclando sobre o que já está lá — o DM não
 * reescreve a ficha de ninguém. O resto (atributos, magias, história) continua
 * sendo do jogador, mesmo agora que a política do banco permitiria mais.
 *
 * Ler-mesclar-gravar tem uma corrida conhecida: se o dono salvar entre a leitura
 * e a escrita, aquela alteração se perde. Aceitável aqui porque a janela é de
 * milissegundos e o campo em disputa é o PV, que o DM está justamente ajustando
 * na frente de todo mundo.
 */
export async function ajustarFichaDaMesa(
  mesaId: string,
  fichaId: string,
  estado: { pvAtual?: number; condicoes?: string[] },
): Promise<boolean> {
  const sb = await getSupabase()
  if (!sb) return false

  const { data, error } = await sb
    .from('personagens')
    .select('id, dados')
    .eq('mesa_id', mesaId)
    .eq('dados->>id', fichaId)
    .maybeSingle()

  if (error || !data?.id) return false

  const dados = { ...(data.dados as Character), ...estado, updatedAt: Date.now() }
  const { error: erroUpdate } = await sb
    .from('personagens')
    .update({ dados, atualizado_em: new Date().toISOString() })
    .eq('id', data.id)

  if (erroUpdate) {
    console.warn('[grimório] não consegui ajustar a ficha da mesa:', erroUpdate.message)
    return false
  }
  return true
}
