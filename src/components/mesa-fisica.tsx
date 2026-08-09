// A tela de mesa: quando o mapa está EM CIMA DA MESA.
//
// O app foi feito para dois usos ao mesmo tempo, e só um deles tinha tela
// própria. Quem joga tudo dentro do app tem o tabuleiro, os tokens e o mapa
// compartilhado. Quem senta na mesa com miniatura e grade impressa não precisa
// de nada disso — o campo de batalha está na frente de todo mundo, e o que
// falta é o contrário: os NÚMEROS, todos de uma vez, legíveis de braço
// esticado, sem clicar.
//
// O que muda de verdade:
//
// - Nada é rolado aqui. Os dados são de verdade, e estão na mão dos jogadores.
//   O que a tela mostra é o bônus e a fórmula do dano, para o DM ler em voz
//   alta ou rolar no dado dele.
// - Os ataques do inimigo aparecem na linha dele. Abrir o bestiário no meio do
//   turno é o que faz a luta parar.
// - As passivas do grupo ficam à vista, porque a alternativa é perguntar — e
//   perguntar "qual é a sua percepção passiva?" entrega que tem algo escondido.
// - Uma coluna, fonte grande, pouco enfeite. A tela é consultada de relance,
//   entre uma frase e outra.

import { useMemo, useState } from 'react'
import type { Battle, Combatant, Monster } from '../types'
import { CONDICOES } from '../data/rules'
import { loadBestiary } from '../lib/bestiary'
import { loadCharacters } from '../lib/storage'
import { armorClass, passiveSkill } from '../lib/calc'
import { precisaRolar } from '../lib/morte'
import { proximoDaVez } from '../lib/battle'

const ROTULO_ACAO: Record<string, string> = {
  acao: 'ação',
  bonus: 'bônus',
  reacao: 'reação',
  lendaria: 'lendária',
  covil: 'covil',
}

/** As três passivas que o DM consulta sem perguntar nada à mesa. */
const PASSIVAS = [
  { key: 'percepcao', rotulo: 'Perc' },
  { key: 'investigacao', rotulo: 'Inv' },
  { key: 'intuicao', rotulo: 'Intu' },
] as const

export function PainelDeMesa({
  battle,
  ordenados,
  atual,
  onPatch,
  onProximo,
}: {
  battle: Battle
  ordenados: Combatant[]
  atual: Combatant | null
  onPatch: (id: string, p: Partial<Combatant>, rotulo?: string) => void
  onProximo: () => void
}) {
  // Bestiário e fichas entram uma vez. São a fonte do que NÃO está no
  // combatente: o ataque do monstro e as passivas do personagem.
  const bestiario = useMemo(() => {
    const m = new Map<string, Monster>()
    for (const x of loadBestiary()) m.set(x.id, x)
    return m
  }, [])
  const fichas = useMemo(() => {
    const m = new Map<string, ReturnType<typeof loadCharacters>[number]>()
    for (const f of loadCharacters()) m.set(f.id, f)
    return m
  }, [])

  const proximo = proximoDaVez(ordenados, battle.turnoIndex)

  if (ordenados.length === 0) {
    return (
      <div className="card p-10 text-center text-sm text-parchment-200/60">
        Nenhuma criatura no encontro. Monte o encontro abaixo — aqui em cima fica a mesa.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* De quem é a vez. Grande porque é a única coisa que se olha de longe,
          no meio de uma frase — e grudada no topo porque o DM rola a lista
          para consultar um monstro e não pode perder o fio do turno. */}
      <div className="card z-10 flex flex-wrap items-center justify-between gap-3 border-dragon-400/30 p-4 backdrop-blur md:sticky md:top-16">
        <div className="min-w-0">
          <p className="panel-title">Rodada {battle.rodada}</p>
          <p className="font-display text-3xl text-parchment-50 sm:text-4xl">
            {atual ? atual.nome : 'Combate parado'}
          </p>
          {proximo && atual && (
            <p className="mt-0.5 text-sm text-parchment-200/50">depois: {proximo.nome}</p>
          )}
        </div>
        {atual && (
          <button className="btn-primary px-6 py-3 text-base" onClick={onProximo}>
            Próximo turno →
          </button>
        )}
      </div>

      {ordenados.map((c) => (
        <LinhaDeMesa
          key={c.id}
          c={c}
          daVez={atual?.id === c.id}
          monstro={c.origem === 'inimigo' ? bestiario.get(c.refId) : undefined}
          ficha={c.origem === 'aliado' ? fichas.get(c.refId) : undefined}
          onPatch={(p, rotulo) => onPatch(c.id, p, rotulo)}
        />
      ))}
    </div>
  )
}

function LinhaDeMesa({
  c,
  daVez,
  monstro,
  ficha,
  onPatch,
}: {
  c: Combatant
  daVez: boolean
  monstro?: Monster
  ficha?: ReturnType<typeof loadCharacters>[number]
  onPatch: (p: Partial<Combatant>, rotulo?: string) => void
}) {
  const [valor, setValor] = useState('')
  const caido = c.origem === 'aliado' && c.pvAtual <= 0
  const morto = c.origem === 'inimigo' ? c.pvAtual <= 0 : (c.testesMorte?.falhas ?? 0) >= 3

  function aplicar(sinal: 1 | -1) {
    const n = parseInt(valor, 10)
    if (!Number.isFinite(n) || n <= 0) return
    // O teto é o PV máximo; o piso NÃO é zero para aliado, porque o dano que
    // passa do zero é o que decide a morte instantânea e a falha extra.
    const bruto = c.pvAtual + sinal * n
    const pv = sinal > 0 ? Math.min(c.pvMax, bruto) : bruto
    onPatch({ pvAtual: pv }, `${sinal > 0 ? 'Cura' : 'Dano'} em ${c.nome}`)
    setValor('')
  }

  const pct = c.pvMax > 0 ? Math.max(0, Math.min(1, c.pvAtual / c.pvMax)) : 0

  return (
    <div
      className={`card p-3 transition ${
        daVez ? 'border-dragon-400/70 bg-dragon-500/[0.06]' : ''
      } ${morto ? 'opacity-45' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Iniciativa */}
        <div className="w-12 shrink-0 text-center">
          <p className="font-display text-2xl leading-none text-parchment-50">
            {c.iniciativa ?? '—'}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-parchment-200/40">inic</p>
        </div>

        {/* Nome e CA */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-medium text-parchment-50">
            {c.nome}
            {c.origem === 'inimigo' && <span className="ml-2 text-xs text-dragon-400/70">inimigo</span>}
          </p>
          <p className="text-xs text-parchment-200/55">
            CA <b className="text-parchment-100">{ficha ? armorClass(ficha) : c.ca}</b>
            {ficha &&
              PASSIVAS.map((p) => (
                <span key={p.key}>
                  {' · '}
                  {p.rotulo} <b className="text-parchment-100">{passiveSkill(ficha, p.key)}</b>
                </span>
              ))}
          </p>
        </div>

        {/* Vida: número grande, porque é o que muda toda rodada */}
        <div className="w-32 shrink-0">
          <p className="text-right font-display text-2xl leading-none text-parchment-50">
            {c.pvAtual}
            <span className="text-sm text-parchment-200/40">/{c.pvMax}</span>
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full ${pct > 0.5 ? 'bg-emerald-500' : pct > 0.25 ? 'bg-amber-500' : 'bg-dragon-500'}`}
              style={{ width: `${pct * 100}%` }}
            />
          </div>
        </div>

        {/* Dano e cura: um campo e dois botões. Na mesa, o DM digita o número
            que o jogador acabou de somar em voz alta. */}
        <div className="flex shrink-0 items-center gap-1">
          <input
            type="number"
            min={1}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && aplicar(-1)}
            placeholder="0"
            className="w-16 rounded-md border border-white/10 bg-ink-900/70 px-1 py-1.5 text-center text-base outline-none focus:border-dragon-400"
          />
          <button
            className="rounded-md border border-dragon-400/40 px-2.5 py-1.5 text-sm text-dragon-300 hover:bg-dragon-500/15"
            onClick={() => aplicar(-1)}
            title="Tirar vida"
          >
            −
          </button>
          <button
            className="rounded-md border border-emerald-400/40 px-2.5 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/15"
            onClick={() => aplicar(1)}
            title="Curar"
          >
            +
          </button>
        </div>
      </div>

      {/* Condições, concentração e o estado de quem caiu — tudo em uma linha.
          Ela aparece SEMPRE, mesmo vazia, porque nela mora o "+ condição": numa
          mesa com miniatura, "agora ele está Caído" acontece a cada dois
          turnos, e ir até a visão do DM para marcar isso é perder o turno. */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {c.condicoes.map((cond) => (
            <button
              key={cond}
              className="chip border-amber-400/40 text-amber-300 hover:border-dragon-400/60"
              title="Clique para tirar"
              onClick={() =>
                onPatch({ condicoes: c.condicoes.filter((x) => x !== cond) }, `Tirar ${cond}`)
              }
            >
              {cond}
              {c.rodadasDeCondicao?.[cond] ? ` ${c.rodadasDeCondicao[cond]}r` : ''} ✕
            </button>
          ))}
          {c.concentracao && (
            <span className="chip border-arcane-400/40 text-arcane-300">🧿 {c.concentracao}</span>
          )}
          {caido && (
            <span className={`chip ${morto ? 'text-dragon-300' : 'text-parchment-200/60'}`}>
              {morto
                ? '💀 morreu'
                : c.estavel
                  ? '🩹 estável'
                  : `💀 ${c.testesMorte?.sucessos ?? 0}✓ ${c.testesMorte?.falhas ?? 0}✗`}
            </span>
          )}
          {precisaRolar(c) && (
            <span className="chip border-dragon-400/50 text-dragon-300">rola no turno dela</span>
          )}

          <select
            className="ml-auto rounded-md border border-white/10 bg-ink-900/70 px-1.5 py-1 text-xs text-parchment-200/60 outline-none focus:border-dragon-400"
            value=""
            onChange={(e) => {
              const nova = e.target.value
              if (nova && !c.condicoes.includes(nova)) {
                onPatch({ condicoes: [...c.condicoes, nova] }, `${nova} em ${c.nome}`)
              }
            }}
          >
            <option value="">+ condição</option>
            {CONDICOES.filter((x) => !c.condicoes.includes(x.nome)).map((x) => (
              <option key={x.nome} value={x.nome}>{x.nome}</option>
            ))}
          </select>
        </div>

      {/* Os ataques do inimigo, na linha dele. Abrir o bestiário no meio do
          turno é o que faz a luta parar — e é o motivo número um de o DM
          largar o app e voltar para a folha impressa. */}
      {monstro && monstro.acoes.length > 0 && !morto && (
        <ul className="mt-2 space-y-0.5 border-t border-white/5 pt-2 text-xs text-parchment-200/70">
          {monstro.acoes.map((a) => (
            <li key={a.id}>
              {/* Bônus, reação e lendária vêm marcadas. Filtrá-las fora seria
                  esconder do DM justamente o que ele esquece de usar — a
                  reação do monstro é o que mais morre no esquecimento. */}
              {(a.tipo ?? 'acao') !== 'acao' && (
                <span className="mr-1 rounded bg-white/10 px-1 py-px text-[10px] uppercase tracking-wide text-parchment-200/60">
                  {ROTULO_ACAO[a.tipo ?? 'acao']}
                </span>
              )}
              <b className="text-parchment-100">{a.nome}.</b> {a.descricao}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
