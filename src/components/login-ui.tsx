import { useState } from 'react'
import { cadastrar, entrar, entrarComGoogle } from '../lib/sync/auth'
import { Field, TextField } from './ui'

/**
 * Entrar / criar conta.
 *
 * Mora aqui, e não numa página, porque a conta não é assunto de uma tela só: o
 * convite (`#/entrar/CODIGO`), a aba Mesa e o botão do canto usam este mesmo
 * formulário.
 */
export function FormLogin({ compacto = false }: { compacto?: boolean }) {
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

  async function comGoogle() {
    setErro('')
    setAviso('')
    setOcupado(true)
    const r = await entrarComGoogle()
    setOcupado(false)
    // Se deu certo, o navegador já saiu para o Google — nada mais a fazer aqui.
    if (!r.ok) setErro(r.erro ?? 'Não deu certo.')
  }

  return (
    <div className={compacto ? 'space-y-4' : 'mx-auto max-w-md space-y-4'}>
      <button
        type="button"
        disabled={ocupado}
        onClick={comGoogle}
        className="btn-ghost flex w-full items-center justify-center gap-2 disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
        Entrar com Google
      </button>

      <div className="flex items-center gap-3 text-xs text-parchment-200/50">
        <div className="h-px flex-1 bg-white/10" />
        ou
        <div className="h-px flex-1 bg-white/10" />
      </div>

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

      <form onSubmit={enviar} className={compacto ? 'space-y-3' : 'card space-y-3 p-4'}>
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
        A conta guarda as suas fichas e serve para juntar o grupo. Sem ela, o app continua
        funcionando neste aparelho.
      </p>
    </div>
  )
}
