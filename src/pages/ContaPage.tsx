// A conta: quem é você aqui dentro.
//
// Isto morava dentro da aba Mesa, e um leitor de fora achou contraintuitivo com
// razão: "entrar na sua conta" e "jogar em grupo" são duas perguntas
// diferentes, e a primeira vem antes. Quem abre o app pela primeira vez e quer
// só guardar a ficha na nuvem não tem por que passar por uma tela que fala de
// mesa, código de convite e papel de DM.
//
// A tela é curta de propósito. Identidade e nada mais: as mesas continuam na
// aba Mesa, porque lá elas vêm com membros, convite e o estado do jogo.

import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FormLogin } from '../components/login-ui'
import { SectionCard, TextField } from '../components/ui'
import { useMesa, useSessao } from '../hooks/useSync'
import { renomearPerfil, sair } from '../lib/sync/auth'

export default function ContaPage() {
  const { nuvemConfigurada, estado, conta } = useSessao()

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl text-parchment-50">Conta</h1>
        <p className="mt-1 text-sm text-parchment-200/70">
          Entre para as suas fichas ficarem salvas na conta e abrirem em qualquer aparelho.
        </p>
      </header>

      {!nuvemConfigurada ? (
        <SectionCard title="Sem nuvem neste app">
          <p className="text-sm text-parchment-200/70">
            Este app está rodando sem servidor: tudo fica neste aparelho, e não há conta para
            entrar. Exporte o backup na aba{' '}
            <NavLink to="/dados" className="text-arcane-400 hover:underline">
              Dados
            </NavLink>{' '}
            ao fim de cada sessão.
          </p>
        </SectionCard>
      ) : estado === 'carregando' ? (
        <div className="card p-8 text-center text-sm text-parchment-200/60">Carregando…</div>
      ) : conta ? (
        <>
          <Perfil />
          <ParaOndeIr />
        </>
      ) : (
        <SectionCard title="Entrar">
          <FormLogin />
        </SectionCard>
      )}
    </div>
  )
}

function Perfil() {
  const { conta } = useSessao()
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(conta?.nome ?? '')

  useEffect(() => setNome(conta?.nome ?? ''), [conta?.nome])
  if (!conta) return null

  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-arcane-600/30 text-xl">
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
            <p className="truncate font-display text-lg text-parchment-50">{conta.nome}</p>
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

/**
 * O que fazer depois de entrar.
 *
 * Uma tela de conta que termina em nada devolve a pessoa ao menu para adivinhar
 * o próximo passo. Aqui ela diz em que mesa você está — que é a única coisa da
 * mesa que a conta precisa saber — e aponta para o resto.
 */
function ParaOndeIr() {
  const { mesa, carregando } = useMesa()

  return (
    <SectionCard title="Onde você está jogando">
      {carregando ? (
        <p className="text-sm text-parchment-200/60">Carregando suas mesas…</p>
      ) : mesa ? (
        <p className="text-sm text-parchment-100">
          Mesa atual: <b>{mesa.nome}</b>{' '}
          <span className="chip ml-1 text-[10px]">{mesa.papel === 'dm' ? 'DM' : 'Jogador'}</span>
        </p>
      ) : (
        <p className="text-sm text-parchment-200/70">
          Você ainda não está em nenhuma mesa.
        </p>
      )}
      <NavLink to="/mesa" className="btn-ghost mt-3 inline-block text-sm">
        🎲 Ir para as mesas
      </NavLink>
    </SectionCard>
  )
}
