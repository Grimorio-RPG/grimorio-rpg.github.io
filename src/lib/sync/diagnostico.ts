// Diagnóstico da conexão com o Supabase.
//
// Existe por um motivo prático: quando algo dá errado na configuração, o erro
// aparece tarde e sem pista ("permission denied", "Failed to fetch"). Aqui cada
// verificação diz o que falhou E como consertar.

import { getSupabase } from './client'
import { SUPABASE_ANON_KEY, SUPABASE_URL, nuvemConfigurada } from './config'
import { getConta } from './auth'

export type Situacao = 'ok' | 'falhou' | 'aviso' | 'pulado'

export interface Verificacao {
  nome: string
  situacao: Situacao
  detalhe: string
  comoResolver?: string
}

const TEMPO_LIMITE = 8000

// Aceita PromiseLike porque as consultas do supabase-js são "thenable", não
// promessas de verdade.
function comLimite<T>(p: PromiseLike<T>, ms = TEMPO_LIMITE): Promise<T | 'tempo-esgotado'> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<'tempo-esgotado'>((r) => setTimeout(() => r('tempo-esgotado'), ms)),
  ])
}

async function chaves(): Promise<Verificacao> {
  if (!nuvemConfigurada) {
    return {
      nome: 'Chaves do projeto',
      situacao: 'falhou',
      detalhe: 'As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não chegaram ao app.',
      comoResolver:
        'Copie .env.example para .env, preencha as duas e reinicie o npm run dev — o Vite só lê o .env ao iniciar.',
    }
  }
  // http só é aceito na sua própria máquina (quem usa o Supabase CLI aponta
  // para http://localhost:54321). Em qualquer outro lugar, exigimos https.
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(SUPABASE_URL)
  if (!SUPABASE_URL.startsWith('https://') && !local) {
    return {
      nome: 'Chaves do projeto',
      situacao: 'falhou',
      detalhe: `A URL não parece certa: "${SUPABASE_URL}".`,
      comoResolver: 'Use a Project URL completa, como https://seuprojeto.supabase.co',
    }
  }
  // A service_role é um JWT com "role":"service_role" no corpo. Se ela aparecer
  // aqui, está exposta no código do site — vale interromper tudo e avisar.
  try {
    const corpo = JSON.parse(atob(SUPABASE_ANON_KEY.split('.')[1] ?? ''))
    if (corpo?.role === 'service_role') {
      return {
        nome: 'Chaves do projeto',
        situacao: 'falhou',
        detalhe: '⚠️ A chave configurada é a service_role, que ignora todas as regras de acesso.',
        comoResolver:
          'Troque agora pela chave anon public (Project Settings → API) e gere novas chaves no Supabase, porque a service_role foi para o código do site.',
      }
    }
  } catch {
    // Chaves mais novas do Supabase não são JWT; não dá para inspecionar, tudo bem.
  }
  return {
    nome: 'Chaves do projeto',
    situacao: 'ok',
    detalhe: SUPABASE_URL,
  }
}

async function servidor(): Promise<Verificacao> {
  const r = await comLimite(
    fetch(`${SUPABASE_URL}/rest/v1/`, { headers: { apikey: SUPABASE_ANON_KEY } })
      .then((res) => ({ status: res.status }))
      .catch((e: Error) => ({ erro: e.message })),
  )

  if (r === 'tempo-esgotado') {
    return {
      nome: 'Conexão com o servidor',
      situacao: 'falhou',
      detalhe: 'O servidor não respondeu em 8 segundos.',
      comoResolver:
        'No plano gratuito o projeto hiberna após alguns dias parado e a primeira chamada demora. Tente de novo. Se insistir, confira se o projeto está "Healthy" no painel.',
    }
  }
  if ('erro' in r) {
    return {
      nome: 'Conexão com o servidor',
      situacao: 'falhou',
      detalhe: r.erro,
      comoResolver: 'Confira a URL do projeto e a sua internet.',
    }
  }
  if (r.status === 401 || r.status === 403) {
    return {
      nome: 'Conexão com o servidor',
      situacao: 'falhou',
      detalhe: `O servidor recusou a chave (HTTP ${r.status}).`,
      comoResolver: 'Copie de novo a chave anon public em Project Settings → API.',
    }
  }
  return { nome: 'Conexão com o servidor', situacao: 'ok', detalhe: `Respondeu (HTTP ${r.status}).` }
}

async function tabelas(): Promise<Verificacao> {
  const sb = await getSupabase()
  if (!sb) return { nome: 'Tabelas do esquema', situacao: 'pulado', detalhe: 'Sem cliente.' }

  const r = await comLimite(sb.from('mesas').select('id').limit(1))
  if (r === 'tempo-esgotado') {
    return { nome: 'Tabelas do esquema', situacao: 'falhou', detalhe: 'O banco não respondeu a tempo.' }
  }

  const erro = r.error
  if (!erro) {
    return {
      nome: 'Tabelas do esquema',
      situacao: 'ok',
      detalhe: 'As tabelas existem e estão acessíveis.',
    }
  }

  // 42P01 = relação não existe; PGRST205 = PostgREST não achou a tabela
  if (erro.code === '42P01' || erro.code === 'PGRST205' || /does not exist|schema cache/i.test(erro.message)) {
    return {
      nome: 'Tabelas do esquema',
      situacao: 'falhou',
      detalhe: 'As tabelas ainda não existem neste projeto.',
      comoResolver: 'Cole supabase/schema.sql inteiro no SQL Editor do Supabase e clique em Run.',
    }
  }
  if (erro.code === '42501' || /permission denied/i.test(erro.message)) {
    return {
      nome: 'Tabelas do esquema',
      situacao: 'falhou',
      detalhe: 'As tabelas existem, mas a API não tem permissão de acesso a elas.',
      comoResolver:
        'Rode supabase/schema.sql de novo — a versão atual concede as permissões. (É idempotente, pode rodar quantas vezes quiser.)',
    }
  }
  return { nome: 'Tabelas do esquema', situacao: 'falhou', detalhe: `${erro.code ?? ''} ${erro.message}`.trim() }
}

async function funcoes(): Promise<Verificacao> {
  const sb = await getSupabase()
  if (!sb) return { nome: 'Funções da mesa', situacao: 'pulado', detalhe: 'Sem cliente.' }
  if (!getConta()) {
    return {
      nome: 'Funções da mesa',
      situacao: 'pulado',
      detalhe: 'Só dá para testar depois de entrar numa conta.',
    }
  }

  // Um código propositalmente inválido: se a função existir, ela reclama do
  // código — o que já prova que está instalada. Nada é criado.
  const r = await comLimite(sb.rpc('entrar_na_mesa', { p_codigo: '@@@DIAGNOSTICO@@@' }))
  if (r === 'tempo-esgotado') {
    return { nome: 'Funções da mesa', situacao: 'falhou', detalhe: 'O banco não respondeu a tempo.' }
  }

  const msg = r.error?.message ?? ''
  if (/inválido|invalido/i.test(msg)) {
    return { nome: 'Funções da mesa', situacao: 'ok', detalhe: 'entrar_na_mesa e criar_mesa instaladas.' }
  }
  if (r.error?.code === 'PGRST202' || /could not find the function/i.test(msg)) {
    return {
      nome: 'Funções da mesa',
      situacao: 'falhou',
      detalhe: 'A função entrar_na_mesa não existe neste projeto.',
      comoResolver: 'Cole supabase/schema.sql inteiro no SQL Editor e clique em Run.',
    }
  }
  if (!r.error) {
    // Não deveria acontecer: um código inválido tem de dar erro.
    return {
      nome: 'Funções da mesa',
      situacao: 'aviso',
      detalhe: 'A função respondeu, mas aceitou um código inválido.',
      comoResolver: 'Rode supabase/schema.sql de novo para reinstalar a versão correta.',
    }
  }
  return { nome: 'Funções da mesa', situacao: 'falhou', detalhe: msg }
}

async function tempoReal(): Promise<Verificacao> {
  const sb = await getSupabase()
  if (!sb) return { nome: 'Tempo real', situacao: 'pulado', detalhe: 'Sem cliente.' }

  const resultado = await new Promise<string>((resolve) => {
    const canal = sb.channel(`diagnostico-${Date.now()}`)
    const encerrar = (v: string) => {
      void sb.removeChannel(canal)
      resolve(v)
    }
    const t = setTimeout(() => encerrar('tempo-esgotado'), TEMPO_LIMITE)
    canal.subscribe((status) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(t)
        encerrar(status)
      }
    })
  })

  if (resultado === 'SUBSCRIBED') {
    return { nome: 'Tempo real', situacao: 'ok', detalhe: 'O canal conectou — as telas vão atualizar sozinhas.' }
  }
  return {
    nome: 'Tempo real',
    situacao: 'falhou',
    detalhe: `O canal não conectou (${resultado}).`,
    comoResolver:
      'Sem tempo real o app continua funcionando, só não atualiza sozinho — é preciso recarregar a página. Verifique se o Realtime está ligado no projeto e se a sua rede não bloqueia WebSocket.',
  }
}

/** Roda tudo em ordem. Cada etapa devolve o que falhou e como resolver. */
export async function rodarDiagnostico(): Promise<Verificacao[]> {
  const resultados: Verificacao[] = []

  const v1 = await chaves()
  resultados.push(v1)
  if (v1.situacao === 'falhou') return resultados

  const v2 = await servidor()
  resultados.push(v2)
  if (v2.situacao === 'falhou') return resultados

  resultados.push(await tabelas())
  resultados.push(await funcoes())
  resultados.push(await tempoReal())
  return resultados
}
