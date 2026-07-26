// Mesa: o grupo que joga junto. Uma mesa tem um DM e vários jogadores.
//
// A mesa escolhida fica guardada neste dispositivo, então ao reabrir o app a
// pessoa continua na mesma mesa sem precisar digitar o código de novo.

import { readJson, writeJson } from '../store'
import { getSupabase } from './client'
import { getConta } from './auth'

const CHAVE_MESA_ATUAL = 'grimorio55e.mesa.v1'

export interface Mesa {
  id: string
  nome: string
  codigo: string
  papel: 'dm' | 'jogador'
}

export interface Membro {
  userId: string
  nome: string
  papel: 'dm' | 'jogador'
}

let mesa: Mesa | null = null
let carregando = false

const ouvintes = new Set<() => void>()

function avisar() {
  for (const fn of ouvintes) fn()
}

export function getMesa(): Mesa | null {
  return mesa
}

export function carregandoMesa(): boolean {
  return carregando
}

export function assinarMesa(fn: () => void): () => void {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

/** Sou o DM da mesa atual? Sem mesa, o app se comporta como se você fosse. */
export function souDm(): boolean {
  return mesa === null || mesa.papel === 'dm'
}

function guardarEscolha(id: string | null) {
  writeJson(CHAVE_MESA_ATUAL, id)
}

/**
 * O supabase-js tipa relações embutidas como lista, mas uma relação "para um"
 * chega como objeto. Esta função aceita as duas formas.
 */
function umDe<T>(v: unknown): T | null {
  if (Array.isArray(v)) return (v[0] as T) ?? null
  return (v as T) ?? null
}

/** Código curto de convite, fácil de ditar em voz alta (sem 0/O, 1/I). */
function gerarCodigo(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += alfabeto[Math.floor(Math.random() * alfabeto.length)]
  return s
}

/**
 * Recarrega a mesa escolhida a partir do banco. Chamado no login e sempre que
 * a pessoa entra/cria/sai de uma mesa.
 */
export async function recarregarMesa(): Promise<void> {
  const conta = getConta()
  const sb = await getSupabase()
  if (!sb || !conta) {
    mesa = null
    avisar()
    return
  }

  const escolhida = readJson<string | null>(CHAVE_MESA_ATUAL, null)
  carregando = true
  avisar()

  // Busca as mesas em que sou membro; fica na escolhida, ou na primeira.
  const { data } = await sb
    .from('mesa_membros')
    .select('papel, mesa_id, mesas(id, nome, codigo)')
    .eq('user_id', conta.id)

  const lista: Mesa[] = (data ?? []).flatMap((linha) => {
    const m = umDe<{ id: string; nome: string; codigo: string }>(linha.mesas)
    if (!m) return []
    return [{ id: m.id, nome: m.nome, codigo: m.codigo, papel: linha.papel as 'dm' | 'jogador' }]
  })

  mesa = lista.find((m) => m.id === escolhida) ?? lista[0] ?? null
  if (mesa) guardarEscolha(mesa.id)
  carregando = false
  avisar()
}

/** Todas as mesas de que participo (para trocar entre elas). */
export async function listarMesas(): Promise<Mesa[]> {
  const conta = getConta()
  const sb = await getSupabase()
  if (!sb || !conta) return []
  const { data } = await sb
    .from('mesa_membros')
    .select('papel, mesas(id, nome, codigo)')
    .eq('user_id', conta.id)
  return (data ?? []).flatMap((linha) => {
    const m = umDe<{ id: string; nome: string; codigo: string }>(linha.mesas)
    if (!m) return []
    return [{ id: m.id, nome: m.nome, codigo: m.codigo, papel: linha.papel as 'dm' | 'jogador' }]
  })
}

export function escolherMesa(m: Mesa | null) {
  mesa = m
  guardarEscolha(m?.id ?? null)
  avisar()
}

export interface ResultadoMesa {
  ok: boolean
  erro?: string
  mesa?: Mesa
}

export async function criarMesa(nome: string): Promise<ResultadoMesa> {
  const sb = await getSupabase()
  if (!sb) return { ok: false, erro: 'A nuvem não está configurada neste app.' }

  // Colisão de código é rara, mas é barato tentar de novo.
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = gerarCodigo()
    const { data, error } = await sb.rpc('criar_mesa', { p_nome: nome, p_codigo: codigo })
    if (!error && data) {
      const linha = (Array.isArray(data) ? data[0] : data) as { id: string; nome: string; codigo: string }
      const nova: Mesa = { id: linha.id, nome: linha.nome, codigo: linha.codigo, papel: 'dm' }
      escolherMesa(nova)
      return { ok: true, mesa: nova }
    }
    const msg = error?.message ?? ''
    if (!msg.includes('duplicate key') && !msg.includes('mesas_codigo_key')) {
      if (msg.includes('criar_mesa')) {
        return { ok: false, erro: 'O banco ainda não tem a função criar_mesa. Rode supabase/schema.sql de novo no SQL Editor.' }
      }
      return { ok: false, erro: msg || 'Não consegui criar a mesa.' }
    }
  }
  return { ok: false, erro: 'Não consegui gerar um código livre. Tente novamente.' }
}

export async function entrarNaMesa(codigo: string): Promise<ResultadoMesa> {
  const sb = await getSupabase()
  if (!sb) return { ok: false, erro: 'A nuvem não está configurada neste app.' }
  const limpo = codigo.trim().toUpperCase()
  if (!limpo) return { ok: false, erro: 'Digite o código da mesa.' }

  const { data: mesaId, error } = await sb.rpc('entrar_na_mesa', { p_codigo: limpo })
  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('inválido') || msg.includes('invalid')) return { ok: false, erro: 'Código de mesa inválido.' }
    return { ok: false, erro: msg || 'Não consegui entrar na mesa.' }
  }

  const { data: linha } = await sb.from('mesas').select('id, nome, codigo').eq('id', mesaId).maybeSingle()
  if (!linha) return { ok: false, erro: 'Entrei na mesa, mas não consegui carregá-la. Recarregue a página.' }

  // Quem entra pelo código pode ser o próprio DM voltando noutro aparelho.
  const { data: meu } = await sb
    .from('mesa_membros')
    .select('papel')
    .eq('mesa_id', linha.id)
    .eq('user_id', getConta()?.id ?? '')
    .maybeSingle()

  const nova: Mesa = {
    id: linha.id,
    nome: linha.nome,
    codigo: linha.codigo,
    papel: (meu?.papel as 'dm' | 'jogador') ?? 'jogador',
  }
  escolherMesa(nova)
  return { ok: true, mesa: nova }
}

export async function sairDaMesa(): Promise<void> {
  const sb = await getSupabase()
  const conta = getConta()
  if (sb && conta && mesa) {
    await sb.from('mesa_membros').delete().eq('mesa_id', mesa.id).eq('user_id', conta.id)
  }
  escolherMesa(null)
  await recarregarMesa()
}

export async function listarMembros(mesaId: string): Promise<Membro[]> {
  const sb = await getSupabase()
  if (!sb) return []
  const { data } = await sb
    .from('mesa_membros')
    .select('user_id, papel, profiles(nome)')
    .eq('mesa_id', mesaId)
  return (data ?? []).map((linha) => {
    const p = umDe<{ nome: string }>(linha.profiles)
    return {
      userId: linha.user_id as string,
      nome: p?.nome || 'Jogador',
      papel: linha.papel as 'dm' | 'jogador',
    }
  })
}

/** O DM pode remover alguém da mesa. */
export async function removerMembro(mesaId: string, userId: string): Promise<void> {
  const sb = await getSupabase()
  await sb?.from('mesa_membros').delete().eq('mesa_id', mesaId).eq('user_id', userId)
}
