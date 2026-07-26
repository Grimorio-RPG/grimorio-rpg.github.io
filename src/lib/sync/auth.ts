// Sessão do usuário na nuvem.
//
// Tudo aqui é opcional: se a nuvem não estiver configurada, ou se a pessoa não
// entrar numa conta, o app continua funcionando em modo local.

import { getSupabase } from './client'
import { nuvemConfigurada } from './config'

export interface Conta {
  id: string
  email: string
  nome: string
}

/** Estado da sessão, para a interface saber o que mostrar. */
export type EstadoSessao = 'desligado' | 'carregando' | 'deslogado' | 'logado'

let estado: EstadoSessao = nuvemConfigurada ? 'carregando' : 'desligado'
let conta: Conta | null = null
let iniciado = false

const ouvintes = new Set<() => void>()

function avisar() {
  for (const fn of ouvintes) fn()
}

export function getEstadoSessao(): EstadoSessao {
  return estado
}

export function getConta(): Conta | null {
  return conta
}

export function assinarSessao(fn: () => void): () => void {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

/**
 * Lê o nome do perfil. Se a linha ainda não existir (o gatilho do banco roda
 * logo depois do cadastro), cai no trecho antes do @ do e-mail.
 */
async function carregarPerfil(id: string, email: string): Promise<string> {
  const sb = await getSupabase()
  if (!sb) return email.split('@')[0]
  const { data } = await sb.from('profiles').select('nome').eq('id', id).maybeSingle()
  const nome = (data?.nome ?? '').trim()
  return nome || email.split('@')[0]
}

async function aplicarUsuario(user: { id: string; email?: string } | null) {
  if (!user) {
    conta = null
    estado = 'deslogado'
    avisar()
    return
  }
  const email = user.email ?? ''
  // Mostra a conta imediatamente; o nome do perfil chega logo em seguida.
  conta = { id: user.id, email, nome: email.split('@')[0] }
  estado = 'logado'
  avisar()

  const nome = await carregarPerfil(user.id, email)
  if (conta && conta.id === user.id && nome !== conta.nome) {
    conta = { ...conta, nome }
    avisar()
  }
}

/** Conecta ao Supabase e passa a acompanhar login/logout. Chamar uma vez. */
export async function initSessao(): Promise<void> {
  if (iniciado || !nuvemConfigurada) return
  iniciado = true

  const sb = await getSupabase()
  if (!sb) {
    estado = 'desligado'
    avisar()
    return
  }

  const { data } = await sb.auth.getSession()
  await aplicarUsuario(data.session?.user ?? null)

  sb.auth.onAuthStateChange((_evento, sessao) => {
    void aplicarUsuario(sessao?.user ?? null)
  })
}

/** Mensagens do Supabase são em inglês; traduzimos as mais comuns. */
function traduzirErro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja a caixa de entrada).'
  if (m.includes('user already registered')) return 'Já existe uma conta com este e-mail. Use "Entrar".'
  if (m.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('unable to validate email')) return 'E-mail inválido.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Espere um minuto e tente de novo.'
  if (m.includes('fetch') || m.includes('network')) {
    return 'Não consegui falar com o servidor. Verifique a internet — e se as chaves do Supabase estão certas.'
  }
  return msg
}

export interface Resultado {
  ok: boolean
  erro?: string
  aviso?: string
}

export async function entrar(email: string, senha: string): Promise<Resultado> {
  const sb = await getSupabase()
  if (!sb) return { ok: false, erro: 'A nuvem não está configurada neste app.' }
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: senha })
  if (error) return { ok: false, erro: traduzirErro(error.message) }
  return { ok: true }
}

export async function cadastrar(email: string, senha: string, nome: string): Promise<Resultado> {
  const sb = await getSupabase()
  if (!sb) return { ok: false, erro: 'A nuvem não está configurada neste app.' }
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password: senha,
    options: { data: { nome: nome.trim() } },
  })
  if (error) return { ok: false, erro: traduzirErro(error.message) }
  // Sem sessão = o projeto exige confirmação por e-mail.
  if (!data.session) {
    return { ok: true, aviso: 'Conta criada! Confirme o e-mail que enviamos e depois entre.' }
  }
  return { ok: true }
}

export async function sair(): Promise<void> {
  const sb = await getSupabase()
  await sb?.auth.signOut()
  conta = null
  estado = 'deslogado'
  avisar()
}

export async function renomearPerfil(nome: string): Promise<Resultado> {
  const sb = await getSupabase()
  if (!sb || !conta) return { ok: false, erro: 'Você não está conectado.' }
  const limpo = nome.trim()
  if (!limpo) return { ok: false, erro: 'O nome não pode ficar vazio.' }
  const { error } = await sb.from('profiles').update({ nome: limpo }).eq('id', conta.id)
  if (error) return { ok: false, erro: error.message }
  conta = { ...conta, nome: limpo }
  avisar()
  return { ok: true }
}
