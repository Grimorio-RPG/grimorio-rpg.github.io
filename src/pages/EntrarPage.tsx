import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout-ui'
import { SectionCard } from '../components/ui'
import { useSessao } from '../hooks/useSync'
import { entrarNaMesa, getMesa } from '../lib/sync/mesa'
import { guardarConvitePendente } from '../lib/sync/convite'
import { FormLogin } from '../components/login-ui'

/**
 * Tela do convite: `#/entrar/ABC123`.
 *
 * É o link que o DM manda no grupo do WhatsApp. Quem já tem conta entra na
 * mesa direto; quem não tem cria a conta aqui e a entrada acontece em seguida,
 * sem precisar digitar o código.
 */
export default function EntrarPage() {
  const { codigo = '' } = useParams()
  const { nuvemConfigurada, estado, conta } = useSessao()
  const navigate = useNavigate()

  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [pronto, setPronto] = useState(false)

  // Entrar com o Google manda a pessoa para fora do app, e o retorno não traz a
  // rota de hash de volta. Guardar o código aqui é o que faz o convite
  // sobreviver a essa ida e volta.
  useEffect(() => {
    if (codigo && !conta) guardarConvitePendente(codigo)
  }, [codigo, conta])

  useEffect(() => {
    if (!conta || !codigo || entrando || pronto) return
    setEntrando(true)
    void entrarNaMesa(codigo).then((r) => {
      setEntrando(false)
      if (r.ok) {
        setPronto(true)
        // Leva direto para a campanha: é o que o convidado quer ver.
        setTimeout(() => navigate('/campanha'), 1200)
      } else {
        setErro(r.erro ?? 'Não consegui entrar nesta mesa.')
      }
    })
  }, [conta, codigo, entrando, pronto, navigate])

  const jaEstava = pronto && getMesa()?.codigo === codigo.toUpperCase()

  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        icon="✉️"
        titulo="Convite para uma mesa"
        subtitulo={`Você foi convidado com o código ${codigo.toUpperCase()}.`}
      />

      {!nuvemConfigurada ? (
        <SectionCard title="☁️ Este app está em modo local">
          <p className="text-sm leading-relaxed text-parchment-200/80">
            Esta cópia do Grimório não está ligada a um servidor, então não dá para entrar em mesas
            por aqui. Peça ao seu DM o endereço do app <b>dele</b> — o convite funciona lá.
          </p>
        </SectionCard>
      ) : estado === 'carregando' ? (
        <div className="card p-10 text-center text-sm text-parchment-200/60">Conectando…</div>
      ) : !conta ? (
        <div className="space-y-4">
          <p className="rounded-lg border border-arcane-400/30 bg-arcane-600/10 p-3 text-sm text-parchment-200/80">
            Crie uma conta (ou entre na sua) e você cai direto na mesa.
          </p>
          <FormLogin />
        </div>
      ) : erro ? (
        <SectionCard title="Não deu certo">
          <p className="text-sm text-dragon-400">{erro}</p>
          <button className="btn-ghost mt-3" onClick={() => navigate('/mesa')}>
            Ir para a aba Mesa
          </button>
        </SectionCard>
      ) : (
        <div className="card p-10 text-center">
          <div className="text-4xl">{jaEstava ? '🎉' : '⏳'}</div>
          <p className="mt-3 text-parchment-50">
            {jaEstava ? 'Você entrou na mesa!' : 'Entrando na mesa…'}
          </p>
          {jaEstava && <p className="mt-1 text-sm text-parchment-200/60">Levando você para a campanha…</p>}
        </div>
      )}
    </div>
  )
}
