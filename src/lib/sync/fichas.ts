// Fichas guardadas na conta.
//
// Antes disto uma ficha vivia só no IndexedDB do navegador onde foi criada:
// trocar de aparelho, limpar o navegador ou entrar pelo celular deixava a
// pessoa com a lista vazia, mesmo logada. Agora a ficha é da conta.
//
// Não confundir com `personagens.ts`, que trata de compartilhar uma ficha *com
// a mesa* (uma decisão do jogador, com o DM lendo). Aqui é o contrário: cópia
// privada, automática, que só o dono enxerga — o RLS garante isso pelo
// `dono_id`, e estas linhas têm `mesa_id` nulo justamente para não entrarem na
// leitura da mesa.

import type { Character } from '../../types'
import { normalizeCharacter } from '../character'
import { loadCharacters, saveCharacters } from '../storage'
import { getConta } from './auth'
import { getSupabase } from './client'

interface LinhaFicha {
  id: string
  dados: Character
}

async function listarDaConta(): Promise<LinhaFicha[]> {
  const sb = await getSupabase()
  const conta = getConta()
  if (!sb || !conta) return []
  const { data, error } = await sb
    .from('personagens')
    .select('id, dados')
    .eq('dono_id', conta.id)
    .is('mesa_id', null)
  if (error) return []
  return (data ?? []).flatMap((l) => {
    const d = l.dados as Partial<Character> | null
    if (!d?.id) return []
    return [{ id: l.id as string, dados: normalizeCharacter(d) }]
  })
}

// Qual linha da tabela guarda cada ficha. A resposta não muda enquanto a ficha
// existir, e perguntar toda vez dobrava o número de requisições.
const linhaDaFicha = new Map<string, string>()

/** Sobe uma ficha para a conta. O id local é a chave de deduplicação. */
export async function salvarFichaNaConta(ficha: Character): Promise<boolean> {
  const sb = await getSupabase()
  const conta = getConta()
  if (!sb || !conta) return false

  let linha = linhaDaFicha.get(ficha.id)
  if (!linha) {
    const { data: existente } = await sb
      .from('personagens')
      .select('id')
      .eq('dono_id', conta.id)
      .is('mesa_id', null)
      .eq('dados->>id', ficha.id)
      .maybeSingle()
    linha = existente?.id as string | undefined
    if (linha) linhaDaFicha.set(ficha.id, linha)
  }

  if (linha) {
    const { error } = await sb
      .from('personagens')
      .update({ dados: ficha, atualizado_em: new Date().toISOString() })
      .eq('id', linha)
    if (error) {
      // A linha pode ter sido apagada noutro aparelho; esquecer o atalho faz a
      // próxima tentativa procurar de novo — ou criar.
      linhaDaFicha.delete(ficha.id)
      return false
    }
    return true
  }

  const { data, error } = await sb
    .from('personagens')
    .insert({ mesa_id: null, dono_id: conta.id, dados: ficha })
    .select('id')
    .maybeSingle()
  if (error) return false
  if (data?.id) linhaDaFicha.set(ficha.id, data.id as string)
  return true
}

// ---------------------------------------------------------------------------
// Envio com atraso
//
// A ficha era enviada a cada tecla digitada. Escrever um parágrafo de história
// virava centenas de requisições, cada uma carregando a ficha inteira — com o
// retrato em base64 junto. No 4G da mesa isso é caro e lento à toa.
//
// O atraso junta a rajada num envio só. Nada se perde no caminho: o que vale
// mora no aparelho, e o que ficar para trás sobe na próxima sincronização, que
// compara `updatedAt`.
// ---------------------------------------------------------------------------
const timers = new Map<string, ReturnType<typeof setTimeout>>()
const pendentes = new Map<string, Character>()

function enviarPendente(fichaId: string) {
  timers.delete(fichaId)
  const ficha = pendentes.get(fichaId)
  pendentes.delete(fichaId)
  if (ficha) void salvarFichaNaConta(ficha)
}

/** Agenda o envio da ficha, juntando as mudanças seguidas num envio só. */
export function agendarFichaNaConta(ficha: Character, ms = 1500): void {
  pendentes.set(ficha.id, ficha)
  const antigo = timers.get(ficha.id)
  if (antigo) clearTimeout(antigo)
  timers.set(
    ficha.id,
    setTimeout(() => enviarPendente(ficha.id), ms),
  )
}

/** Manda agora o que estiver esperando — ao fechar a aba, por exemplo. */
export function enviarFichasPendentes(): void {
  for (const id of [...timers.keys()]) {
    clearTimeout(timers.get(id)!)
    enviarPendente(id)
  }
}

if (typeof document !== 'undefined') {
  // `pagehide` é o único que dispara de forma confiável no Safari do iPhone,
  // e `visibilitychange` pega o trocar de aba no meio da digitação.
  addEventListener('pagehide', enviarFichasPendentes)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') enviarFichasPendentes()
  })
}

/**
 * Apaga a ficha da conta.
 *
 * Sem isto, apagar uma ficha aqui e sincronizar depois a traria de volta do
 * servidor — e ela pareceria imortal.
 */
export async function removerFichaDaConta(fichaId: string): Promise<boolean> {
  const sb = await getSupabase()
  const conta = getConta()
  if (!sb || !conta) return false
  const { error } = await sb
    .from('personagens')
    .delete()
    .eq('dono_id', conta.id)
    .is('mesa_id', null)
    .eq('dados->>id', fichaId)
  return !error
}

const ouvintes = new Set<() => void>()

/** Avisa a interface quando a sincronização mexeu na lista local. */
export function assinarFichasDaConta(fn: () => void): () => void {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

/**
 * Junta o que está na conta com o que está neste aparelho.
 *
 * Regra: para a mesma ficha, vence a de `updatedAt` maior. O que existe só de
 * um lado é copiado para o outro — ninguém perde ficha por ter criado offline.
 */
export async function sincronizarFichasDaConta(): Promise<void> {
  const sb = await getSupabase()
  const conta = getConta()
  if (!sb || !conta) return

  const locais = loadCharacters()
  const remotas = await listarDaConta()
  const porId = new Map<string, Character>()

  for (const c of locais) porId.set(c.id, c)
  for (const { dados } of remotas) {
    const local = porId.get(dados.id)
    if (!local || (dados.updatedAt ?? 0) > (local.updatedAt ?? 0)) porId.set(dados.id, dados)
  }

  const juntas = [...porId.values()].sort((a, b) => b.updatedAt - a.updatedAt)
  saveCharacters(juntas)
  for (const fn of ouvintes) fn()

  // Sobe o que falta ou está velho no servidor. Sequencial de propósito: são
  // poucas fichas e não vale abrir uma rajada de escritas.
  const remotaPorId = new Map(remotas.map((r) => [r.dados.id, r.dados]))
  for (const ficha of juntas) {
    const remota = remotaPorId.get(ficha.id)
    if (!remota || (ficha.updatedAt ?? 0) > (remota.updatedAt ?? 0)) {
      await salvarFichaNaConta(ficha)
    }
  }
}
