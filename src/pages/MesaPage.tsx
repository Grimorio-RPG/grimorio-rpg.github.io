import { useEffect, useState } from 'react'
import { PageHeader } from '../components/layout-ui'
import { Field, SectionCard, TextField } from '../components/ui'
import { useConexao, useMesa, useSessao } from '../hooks/useSync'
import { cadastrar, entrar, renomearPerfil, sair } from '../lib/sync/auth'
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
        <FormLogin />
      ) : (
        <AreaLogada />
      )}
    </div>
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
// Entrar / criar conta
// ---------------------------------------------------------------------------
function FormLogin() {
  const [aba, setAba] = useState<'entrar' | 'cadastrar'>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setOcupado(true)
    const r = aba === 'entrar' ? await entrar(email, senha) : await cadastrar(email, senha, nome)
    setOcupado(false)
    if (!r.ok) setErro(r.erro ?? 'Não deu certo.')
    else if (r.aviso) {
      setAviso(r.aviso)
      setAba('entrar')
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {(['entrar', 'cadastrar'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setAba(v)
              setErro('')
            }}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition ${
              aba === v ? 'bg-dragon-500/25 text-parchment-50' : 'text-parchment-200/70 hover:text-parchment-50'
            }`}
          >
            {v === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      <form onSubmit={enviar} className="card space-y-3 p-4">
        {aba === 'cadastrar' && (
          <Field label="Como quer ser chamado" hint="É o nome que os colegas de mesa veem.">
            <TextField value={nome} onChange={setNome} placeholder="Gabriel" />
          </Field>
        )}
        <Field label="E-mail">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            className="stat-input"
          />
        </Field>
        <Field label="Senha" hint="Mínimo de 6 caracteres.">
          <input
            type="password"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••"
            className="stat-input"
          />
        </Field>

        {erro && <p className="rounded-lg bg-dragon-500/15 p-2 text-sm text-dragon-400">{erro}</p>}
        {aviso && <p className="rounded-lg bg-emerald-500/15 p-2 text-sm text-emerald-400">{aviso}</p>}

        <button type="submit" disabled={ocupado} className="btn-primary w-full disabled:opacity-50">
          {ocupado ? 'Aguarde…' : aba === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <p className="text-center text-xs text-parchment-200/60">
        A conta serve só para juntar o grupo. Sem ela, o app continua funcionando normalmente neste
        aparelho.
      </p>
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
  const [copiado, setCopiado] = useState(false)

  async function recarregarMembros() {
    setMembros(await listarMembros(mesa.id))
  }

  useEffect(() => {
    void recarregarMembros()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesa.id])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mesa.codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      // alguns navegadores bloqueiam; o código está visível na tela mesmo assim
    }
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

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="panel-title mb-1">Código de convite</p>
          <div className="flex items-center gap-3">
            <code className="font-display text-3xl tracking-[0.3em] text-dragon-400">{mesa.codigo}</code>
            <button type="button" className="btn-ghost" onClick={copiar}>
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="mt-2 text-xs text-parchment-200/60">
            Quem tem este código entra na mesa pela aba Mesa do próprio celular.
          </p>
        </div>
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
