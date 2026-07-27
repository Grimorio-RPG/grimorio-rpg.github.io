import { useEffect, useState } from 'react'
import { PageHeader } from '../components/layout-ui'
import { Field, SectionCard, TextField } from '../components/ui'
import { useConexao, useMesa, useSessao } from '../hooks/useSync'
import { renomearPerfil, sair } from '../lib/sync/auth'
import { FormLogin } from '../components/login-ui'
import type { Situacao, Verificacao } from '../lib/sync/diagnostico'
import { rodarDiagnostico } from '../lib/sync/diagnostico'
import type { Membro, Mesa } from '../lib/sync/mesa'
import {
  criarMesa,
  entrarNaMesa,
  escolherMesa,
  listarMembros,
  listarMesas,
  recarregarMesa,
  removerMembro,
  sairDaMesa,
} from '../lib/sync/mesa'

export default function MesaPage() {
  const { nuvemConfigurada, estado, conta } = useSessao()

  return (
    <div>
      <PageHeader
        icon="🎲"
        titulo="Mesa"
        subtitulo="Jogue junto: o DM conduz e cada pessoa acompanha pelo próprio celular."
      />

      {!nuvemConfigurada ? (
        <NuvemDesligada />
      ) : estado === 'carregando' ? (
        <div className="card p-10 text-center text-sm text-parchment-200/60">Conectando…</div>
      ) : !conta ? (
        <div className="space-y-4">
          <FormLogin />
          <Diagnostico />
        </div>
      ) : (
        <AreaLogada />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Diagnóstico
// ---------------------------------------------------------------------------
const ICONE: Record<Situacao, string> = { ok: '✅', falhou: '❌', aviso: '⚠️', pulado: '⏭️' }

/**
 * Verifica a ligação com o Supabase passo a passo.
 *
 * Vale o espaço que ocupa: sem isto, um erro de configuração aparece como um
 * "permission denied" solto, tarde, sem dizer o que fazer.
 */
function Diagnostico() {
  const [resultados, setResultados] = useState<Verificacao[] | null>(null)
  const [rodando, setRodando] = useState(false)

  async function rodar() {
    setRodando(true)
    setResultados(await rodarDiagnostico())
    setRodando(false)
  }

  const falhou = resultados?.some((r) => r.situacao === 'falhou')

  return (
    <SectionCard
      title="🩺 Diagnóstico da conexão"
      action={
        <button type="button" className="btn-ghost text-xs" disabled={rodando} onClick={rodar}>
          {rodando ? 'Verificando…' : resultados ? 'Verificar de novo' : 'Verificar'}
        </button>
      }
    >
      {!resultados ? (
        <p className="text-sm text-parchment-200/70">
          Algo não está funcionando? Toque em <b>Verificar</b> — eu testo as chaves, o servidor, as
          tabelas e o tempo real, e digo exatamente o que falta.
        </p>
      ) : (
        <>
          <ul className="space-y-2.5">
            {resultados.map((r) => (
              <li key={r.nome} className="flex gap-2.5 text-sm">
                <span className="shrink-0">{ICONE[r.situacao]}</span>
                <div className="min-w-0">
                  <p className="font-medium text-parchment-50">{r.nome}</p>
                  <p className="break-words text-xs text-parchment-200/60">{r.detalhe}</p>
                  {r.comoResolver && (
                    <p className="mt-1 rounded-lg border border-arcane-400/25 bg-arcane-600/10 p-2 text-xs leading-relaxed text-parchment-100">
                      👉 {r.comoResolver}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {!falhou && (
            <p className="mt-4 rounded-lg bg-emerald-500/10 p-2.5 text-sm text-emerald-400">
              Tudo certo. Pode criar a conta e a mesa acima.
            </p>
          )}
        </>
      )}
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Nuvem não configurada — explica como ligar, sem assustar
// ---------------------------------------------------------------------------
function NuvemDesligada() {
  return (
    <div className="space-y-4">
      <SectionCard title="💾 Este app está em modo local">
        <p className="text-sm leading-relaxed text-parchment-200/80">
          Tudo funciona normalmente — fichas, bestiário, batalhas, mapa — só que os dados ficam
          guardados <b>neste aparelho</b>. Para jogar em grupo com todo mundo vendo a mesma coisa ao
          vivo, é preciso ligar a sincronização.
        </p>
      </SectionCard>

      <SectionCard title="☁️ Como ligar (grátis)">
        <ol className="ml-4 list-decimal space-y-2 text-sm leading-relaxed text-parchment-200/80">
          <li>
            Crie um projeto gratuito no <b>Supabase</b> (supabase.com) — o plano free basta para uma
            mesa de amigos.
          </li>
          <li>
            No painel, abra o <b>SQL Editor</b>, cole o arquivo <code className="text-arcane-400">supabase/schema.sql</code>{' '}
            deste projeto e clique em <b>Run</b>.
          </li>
          <li>
            Em <b>Project Settings → API</b>, copie a <b>Project URL</b> e a chave{' '}
            <b>anon public</b>. Nunca use a chave <i>service_role</i>.
          </li>
          <li>
            Copie <code className="text-arcane-400">.env.example</code> para{' '}
            <code className="text-arcane-400">.env</code>, cole as duas, e rode{' '}
            <code className="text-arcane-400">npm run dev</code> de novo.
          </li>
        </ol>
        <p className="mt-3 text-xs text-parchment-200/60">
          Se você publicou o app no GitHub Pages, guarde as mesmas duas chaves em{' '}
          <b>Settings → Secrets and variables → Actions</b> com os nomes{' '}
          <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.
        </p>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Logado
// ---------------------------------------------------------------------------
function AreaLogada() {
  const { conta } = useSessao()
  const { mesa, carregando } = useMesa()

  return (
    <div className="space-y-4">
      <CartaoConta />
      {carregando ? (
        <div className="card p-8 text-center text-sm text-parchment-200/60">Carregando suas mesas…</div>
      ) : mesa ? (
        <CartaoMesa mesa={mesa} meuId={conta?.id ?? ''} />
      ) : (
        <SemMesa />
      )}
      <TrocarMesa atualId={mesa?.id ?? null} />
    </div>
  )
}

function CartaoConta() {
  const { conta } = useSessao()
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(conta?.nome ?? '')

  useEffect(() => setNome(conta?.nome ?? ''), [conta?.nome])

  if (!conta) return null

  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-arcane-600/30 text-lg">
        🧙
      </div>
      <div className="min-w-0 flex-1">
        {editando ? (
          <div className="flex gap-2">
            <TextField value={nome} onChange={setNome} placeholder="Seu nome" />
            <button
              type="button"
              className="btn-primary shrink-0"
              onClick={async () => {
                await renomearPerfil(nome)
                setEditando(false)
              }}
            >
              Salvar
            </button>
          </div>
        ) : (
          <>
            <p className="truncate font-medium text-parchment-50">{conta.nome}</p>
            <p className="truncate text-xs text-parchment-200/60">{conta.email}</p>
          </>
        )}
      </div>
      {!editando && (
        <button type="button" className="btn-ghost" onClick={() => setEditando(true)}>
          Renomear
        </button>
      )}
      <button type="button" className="btn-ghost" onClick={() => void sair()}>
        Sair da conta
      </button>
    </div>
  )
}

function SemMesa() {
  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function criar() {
    setErro('')
    setOcupado(true)
    const r = await criarMesa(nome || 'Minha mesa')
    setOcupado(false)
    if (!r.ok) setErro(r.erro ?? 'Não deu certo.')
  }

  async function entrarCodigo() {
    setErro('')
    setOcupado(true)
    const r = await entrarNaMesa(codigo)
    setOcupado(false)
    if (!r.ok) setErro(r.erro ?? 'Não deu certo.')
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard title="🎲 Sou o DM">
        <p className="mb-3 text-sm text-parchment-200/70">
          Crie a mesa e passe o código para o grupo. Só você controla batalha, mapa e bestiário.
        </p>
        <Field label="Nome da mesa">
          <TextField value={nome} onChange={setNome} placeholder="A Maldição de Strahd" />
        </Field>
        <button type="button" disabled={ocupado} className="btn-primary mt-3 w-full disabled:opacity-50" onClick={criar}>
          Criar mesa
        </button>
      </SectionCard>

      <SectionCard title="🛡️ Sou jogador">
        <p className="mb-3 text-sm text-parchment-200/70">
          Digite o código de 6 letras que o seu DM passou.
        </p>
        <Field label="Código da mesa">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="stat-input text-center text-lg font-semibold tracking-[0.35em]"
          />
        </Field>
        <button
          type="button"
          disabled={ocupado}
          className="btn-primary mt-3 w-full disabled:opacity-50"
          onClick={entrarCodigo}
        >
          Entrar na mesa
        </button>
      </SectionCard>

      {erro && (
        <p className="rounded-lg bg-dragon-500/15 p-2 text-sm text-dragon-400 md:col-span-2">{erro}</p>
      )}
    </div>
  )
}

function CartaoMesa({ mesa, meuId }: { mesa: Mesa; meuId: string }) {
  const conexao = useConexao()
  const [membros, setMembros] = useState<Membro[]>([])
  const [copiado, setCopiado] = useState<'link' | 'codigo' | null>(null)

  // Monta o link a partir do endereço atual, então funciona em qualquer lugar
  // onde o app esteja publicado (GitHub Pages, Vercel, localhost…).
  const linkConvite = `${location.origin}${location.pathname}#/entrar/${mesa.codigo}`

  async function recarregarMembros() {
    setMembros(await listarMembros(mesa.id))
  }

  // A lista se atualiza sozinha enquanto esta tela estiver aberta.
  //
  // `mesa_membros` não está na publicação de tempo real do banco, então não há
  // evento para escutar — e sem isto o DM ficava olhando "(0)" depois de mandar
  // o convite, mesmo com alguém já dentro. Uma consulta a cada 8s custa pouco e
  // só acontece nesta tela.
  useEffect(() => {
    void recarregarMembros()
    const t = setInterval(() => void recarregarMembros(), 8000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesa.id])

  async function copiarTexto(texto: string, qual: 'link' | 'codigo') {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(qual)
      setTimeout(() => setCopiado(null), 1800)
    } catch {
      // alguns navegadores bloqueiam; o texto está visível na tela mesmo assim
    }
  }
  const copiarLink = () => copiarTexto(linkConvite, 'link')
  const copiarCodigo = () => copiarTexto(mesa.codigo, 'codigo')

  async function compartilhar() {
    const dados = {
      title: `Mesa: ${mesa.nome}`,
      text: `Entre na minha mesa de D&D "${mesa.nome}" no Grimório:`,
      url: linkConvite,
    }
    // No celular abre a folha nativa de compartilhamento; no desktop, copia.
    if (navigator.share) {
      try {
        await navigator.share(dados)
        return
      } catch {
        // usuário cancelou — cai no copiar
      }
    }
    await copiarLink()
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="panel-title">Mesa atual</p>
            <p className="font-display text-2xl text-parchment-50">{mesa.nome}</p>
            <p className="mt-1 text-xs text-parchment-200/60">
              {mesa.papel === 'dm' ? 'Você conduz esta mesa.' : 'Você joga nesta mesa.'}{' '}
              {conexao === 'conectado' ? 'Tempo real ativo.' : 'Conectando ao tempo real…'}
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost text-dragon-400"
            onClick={async () => {
              if (confirm('Sair desta mesa? Suas fichas continuam salvas neste aparelho.')) {
                await sairDaMesa()
              }
            }}
          >
            Sair da mesa
          </button>
        </div>

        {mesa.papel === 'dm' && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="panel-title mb-1">Convidar o grupo</p>
            <p className="mb-2 break-all rounded-lg bg-black/30 p-2 font-mono text-xs text-arcane-400">
              {linkConvite}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={copiarLink}>
                {copiado === 'link' ? 'Link copiado!' : '🔗 Copiar link'}
              </button>
              <button type="button" className="btn-ghost" onClick={compartilhar}>
                📤 Compartilhar
              </button>
            </div>
            <p className="mt-3 text-xs text-parchment-200/60">
              Mande no grupo do WhatsApp. Quem abrir cria a conta e cai direto na sua campanha — não
              precisa digitar nada.
            </p>

            <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3">
              <span className="text-xs text-parchment-200/50">Ou dite o código:</span>
              <code className="font-display text-2xl tracking-[0.3em] text-dragon-400">{mesa.codigo}</code>
              <button type="button" className="btn-ghost text-xs" onClick={copiarCodigo}>
                {copiado === 'codigo' ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}
      </div>

      <SectionCard title={`👥 No grupo (${membros.length})`}>
        <ul className="divide-y divide-white/5">
          {membros.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 py-2">
              <span className="text-lg">{m.papel === 'dm' ? '🎲' : '🛡️'}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-parchment-100">
                {m.nome}
                {m.userId === meuId && <span className="text-parchment-200/50"> (você)</span>}
              </span>
              <span className="chip text-[10px]">{m.papel === 'dm' ? 'DM' : 'Jogador'}</span>
              {mesa.papel === 'dm' && m.userId !== meuId && (
                <button
                  type="button"
                  className="btn-ghost text-xs text-dragon-400"
                  onClick={async () => {
                    if (confirm(`Remover ${m.nome} da mesa?`)) {
                      await removerMembro(mesa.id, m.userId)
                      await recarregarMembros()
                    }
                  }}
                >
                  Remover
                </button>
              )}
            </li>
          ))}
          {membros.length === 0 && (
            <li className="py-3 text-sm text-parchment-200/60">
              Ninguém entrou ainda. Passe o código acima para o grupo.
            </li>
          )}
        </ul>
        <button type="button" className="btn-ghost mt-2 text-xs" onClick={() => void recarregarMembros()}>
          Atualizar lista
        </button>
      </SectionCard>
    </div>
  )
}

/** Trocar entre mesas — útil para quem é DM de uma e jogador de outra. */
function TrocarMesa({ atualId }: { atualId: string | null }) {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    void listarMesas().then(setMesas)
  }, [atualId])

  const outras = mesas.filter((m) => m.id !== atualId)
  if (outras.length === 0 && !atualId) return null

  return (
    <SectionCard title="🔁 Outras mesas">
      {outras.length === 0 ? (
        <p className="text-sm text-parchment-200/60">Você só participa desta mesa.</p>
      ) : (
        <ul className="mb-3 space-y-2">
          {outras.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-sm text-parchment-100">{m.nome}</span>
              <span className="chip text-[10px]">{m.papel === 'dm' ? 'DM' : 'Jogador'}</span>
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => {
                  escolherMesa(m)
                  void recarregarMesa()
                }}
              >
                Usar esta
              </button>
            </li>
          ))}
        </ul>
      )}

      {atualId && (
        <div className="flex items-end gap-2">
          <Field label="Entrar em outra mesa" className="flex-1">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="stat-input tracking-[0.2em]"
            />
          </Field>
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              const r = await entrarNaMesa(codigo)
              setErro(r.ok ? '' : (r.erro ?? ''))
              if (r.ok) setCodigo('')
            }}
          >
            Entrar
          </button>
        </div>
      )}
      {erro && <p className="mt-2 text-sm text-dragon-400">{erro}</p>}
    </SectionCard>
  )
}
