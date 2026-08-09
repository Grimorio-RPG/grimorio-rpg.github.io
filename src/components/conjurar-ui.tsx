// Conjurar durante o combate.
//
// O campo de concentração era um texto livre: o DM digitava o nome da magia, e
// o app não sabia nem se aquela magia exigia concentração. Com as 339 do SRD
// carregadas, escolher da lista faz o app saber — e saber é o que permite
// marcar a concentração sozinho, gastar o espaço certo e acender o token no
// mapa.
//
// Depois que a ficha passou a saber o que está no grimório e o que está
// preparado, abrir as 339 para um mago com sete preparadas virou o problema
// anterior ao contrário: catálogo demais no momento em que a pessoa precisa de
// sete linhas. Então, quando o combatente tem ficha, a lista é a DELE — truques
// e preparadas primeiro, o que está guardado no livro logo abaixo (visível,
// porque esquecer que ela existe é pior do que não poder usá-la), e o catálogo
// inteiro a um clique para o monstro, o pergaminho e o improviso do DM.
//
// O que esta tela NÃO faz: aplicar o dano da magia. Isso continua sendo o botão
// de dano no alvo, porque metade das magias não causa dano e a outra metade
// pede uma salvaguarda antes — inventar um número aqui seria pior do que não
// ter número nenhum.

import { useEffect, useMemo, useState } from 'react'
import { carregarMagias, type MagiaDoCatalogo } from '../data/srd/magias'
import type { Character, SpellRef } from '../types'
import {
  cabeEm,
  espacosLivres,
  magiasParaConjurar,
  menorCirculoLivre,
} from '../lib/conjuracao'
import { Modal, Original } from './layout-ui'
import { GlossarioProvider, TextoComTermos } from './glossario-ui'

export interface Conjuracao {
  magia: MagiaDoCatalogo
  /** Em que círculo foi conjurada. 0 = não gastou espaço nenhum. */
  nivel: number
}

/** Uma linha da lista: o que a ficha diz, casado com o que o catálogo sabe. */
interface Disponivel {
  ref: SpellRef
  /** Nulo quando a ficha tem um nome que o catálogo não conhece. */
  magia: MagiaDoCatalogo | null
}

/**
 * Uma magia que a ficha tem e o catálogo não conhece.
 *
 * Acontece com magia de suplemento, magia caseira e nome digitado à mão. Ela
 * continua conjurável — recusar seria o app mandando na mesa —, mas o aviso vai
 * junto: sem a ficha da magia, o app não tem como saber se ela exige
 * concentração, e lembrar disso é metade do motivo de esta tela existir.
 */
function improvisada(ref: SpellRef): MagiaDoCatalogo {
  return {
    nome: ref.nome, nomePt: ref.nome, nivel: ref.nivel,
    escola: '', escolaPt: '—', classes: [], classesPt: [],
    tempo: '—', alcance: '—', duracao: '—', componentes: '—',
    texto: '', emMiudos: '', explicada: false,
    concentracao: false, ritual: false,
  }
}

const chave = (s: string) => s.trim().toLowerCase()

export function SeletorDeMagia({
  nomeDoConjurador,
  ficha,
  onFechar,
  onConjurar,
}: {
  nomeDoConjurador: string
  /** A ficha do combatente, quando ela está neste aparelho. */
  ficha?: Character | null
  onFechar: () => void
  onConjurar: (c: Conjuracao) => void
}) {
  const [magias, setMagias] = useState<MagiaDoCatalogo[] | null>(null)
  const [busca, setBusca] = useState('')
  const [escolhida, setEscolhida] = useState<MagiaDoCatalogo | null>(null)
  const [nivel, setNivel] = useState(0)
  const [tudo, setTudo] = useState(false)

  useEffect(() => {
    let vivo = true
    void carregarMagias().then((m) => {
      if (vivo) setMagias(m)
    })
    return () => {
      vivo = false
    }
  }, [])

  const porNome = useMemo(() => {
    const m = new Map<string, MagiaDoCatalogo>()
    for (const x of magias ?? []) m.set(chave(x.nomePt), x)
    return m
  }, [magias])

  /** O que a ficha traz, em três grupos que a regra trata de formas diferentes. */
  const daFicha = useMemo(() => {
    const casar = (r: SpellRef): Disponivel => ({
      ref: r,
      magia: porNome.get(chave(r.nome)) ?? null,
    })
    const g = magiasParaConjurar({ magias: ficha?.magias ?? [] })
    return {
      truques: g.truques.map(casar),
      preparadas: g.preparadas.map(casar),
      guardadas: g.guardadas.map(casar),
    }
  }, [ficha, porNome])

  const temFicha =
    daFicha.truques.length + daFicha.preparadas.length + daFicha.guardadas.length > 0
  const modoFicha = temFicha && !tudo

  const achadas = useMemo(() => {
    if (!magias) return []
    const q = busca.trim().toLowerCase()
    // Sem busca, as de círculo baixo primeiro: é o que mais se conjura, e
    // quem procura a magia de 9º já sabe o nome dela.
    if (!q) return [...magias].sort((a, b) => a.nivel - b.nivel).slice(0, 40)
    return magias
      .filter((m) => m.nomePt.toLowerCase().includes(q) || m.nome.toLowerCase().includes(q))
      .slice(0, 40)
  }, [magias, busca])

  /** Os espaços livres da ficha, por círculo. Vazio quando não há ficha. */
  const livres = useMemo(() => espacosLivres({ espacosMagia: ficha?.espacosMagia ?? [] }), [ficha])

  function escolher(m: MagiaDoCatalogo) {
    setEscolhida(m)
    // Começa no MENOR círculo que ainda tem espaço. Gastar o de 5º numa Mísseis
    // Mágicos é o erro clássico, e um seletor que já vem no círculo próprio da
    // magia — mesmo esgotado — empurra para ele.
    setNivel(m.nivel === 0 ? 0 : menorCirculoLivre(livres, m.nivel) || m.nivel)
  }

  const semEspaco =
    !!escolhida && escolhida.nivel > 0 && !!ficha && !cabeEm(livres, escolhida.nivel)

  return (
    <Modal titulo={`✨ ${nomeDoConjurador} conjura`} onClose={onFechar}>
      <GlossarioProvider>
        {!escolhida ? (
          !magias ? (
            <p className="mt-4 text-sm text-parchment-200/50">Abrindo o grimório…</p>
          ) : modoFicha ? (
            <>
              {/* O que ainda dá para gastar, antes de escolher. Sem isto a
                  pessoa clica na magia para descobrir que não tem espaço —
                  e decidir o turno é justamente escolher entre o que sobrou. */}
              {livres.some((n, i) => n > 0 || (ficha?.espacosMagia?.[i]?.total ?? 0) > 0) && (
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="panel-title">Espaços</span>
                  {(ficha?.espacosMagia ?? []).map((s, i) =>
                    s.total === 0 ? null : (
                      <span
                        key={i}
                        className={`chip text-[11px] ${livres[i] === 0 ? 'text-parchment-200/35' : 'text-emerald-400'}`}
                        title={`${livres[i]} de ${s.total} livres no ${i + 1}º círculo`}
                      >
                        {i + 1}º <b className="ml-0.5">{livres[i]}/{s.total}</b>
                      </span>
                    ),
                  )}
                </div>
              )}

              <GrupoDaFicha
                titulo="Truques"
                vazio="Nenhum truque na ficha."
                itens={daFicha.truques}
                onEscolher={escolher}
              />
              <GrupoDaFicha
                titulo="Preparadas"
                vazio="Nada preparado — quem escolhe isso é o descanso longo, na ficha."
                itens={daFicha.preparadas}
                livres={livres}
                onEscolher={escolher}
              />
              <GrupoDaFicha
                titulo="No grimório, não preparadas"
                nota="Não saem hoje. Ficam à vista para você não esquecer que existem."
                itens={daFicha.guardadas}
                bloqueadas
                onEscolher={escolher}
              />
              <button
                className="btn-ghost mt-3 w-full py-1.5 text-xs"
                onClick={() => setTudo(true)}
              >
                Procurar no catálogo inteiro →
              </button>
            </>
          ) : (
            <>
              <input
                autoFocus
                className="stat-input w-full"
                value={busca}
                placeholder="Buscar magia…"
                onChange={(e) => setBusca(e.target.value)}
              />
              <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
                {achadas.map((m) => (
                  <li key={m.nome}>
                    <button
                      className="w-full rounded-lg border border-white/10 bg-ink-900/40 p-2 text-left hover:border-arcane-400/50"
                      onClick={() => escolher(m)}
                    >
                      <Linha m={m} />
                    </button>
                  </li>
                ))}
                {achadas.length === 0 && (
                  <li className="p-2 text-sm text-parchment-200/50">Nada com esse nome.</li>
                )}
              </ul>
              {temFicha && (
                <button
                  className="btn-ghost mt-3 w-full py-1.5 text-xs"
                  onClick={() => setTudo(false)}
                >
                  ← Voltar para as magias de {nomeDoConjurador}
                </button>
              )}
            </>
          )
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-2">
              <h4 className="font-display text-lg text-parchment-50">
                {escolhida.nomePt}
                <Original pt={escolhida.nomePt} en={escolhida.nome} />
              </h4>
              <span className="text-xs text-parchment-200/50">
                {escolhida.nivel === 0 ? 'truque' : `${escolhida.nivel}º círculo`} · {escolhida.escolaPt}
              </span>
              {escolhida.concentracao && (
                <span className="chip text-[10px] text-amber-300">exige concentração</span>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <Campo r="Tempo" v={escolhida.tempo} />
              <Campo r="Alcance" v={escolhida.alcance} />
              <Campo r="Duração" v={escolhida.duracao} />
              <Campo r="Componentes" v={escolhida.componentes} />
            </div>

            {escolhida.texto ? (
              <p className="mt-3 max-h-40 overflow-y-auto text-sm leading-relaxed text-parchment-100">
                {escolhida.emMiudos ? (
                  <>
                    <span className="text-arcane-400">💡 {escolhida.emMiudos}</span>
                    <br />
                    <br />
                  </>
                ) : null}
                <TextoComTermos texto={escolhida.texto} />
              </p>
            ) : (
              <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-200/90">
                Esta magia está na ficha mas não no catálogo do SRD. Conjura normalmente — só que o
                app não tem como saber se ela exige concentração. Se exigir, marque à mão.
              </p>
            )}

            {/* Conjurar acima do próprio círculo é regra e é comum. Sem escolher
                o círculo, o app gastaria sempre o menor — e a Bola de Fogo de 5º
                sairia como a de 3º na ficha. */}
            {escolhida.nivel > 0 && !semEspaco && (
              <label className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-parchment-200/70">Gastar espaço de</span>
                <select
                  className="stat-input w-auto"
                  value={nivel}
                  onChange={(e) => setNivel(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9]
                    .filter((n) => n >= escolhida.nivel)
                    .map((n) => (
                      <option key={n} value={n} disabled={!!ficha && !livres[n - 1]}>
                        {n}º círculo{ficha ? ` — ${livres[n - 1] ?? 0} livre(s)` : ''}
                      </option>
                    ))}
                </select>
              </label>
            )}

            {semEspaco && (
              <p className="mt-3 rounded-lg border border-dragon-400/30 bg-dragon-500/10 p-2 text-xs text-dragon-300">
                Nenhum espaço livre serve para esta magia. Dá para conjurar assim mesmo — traço de
                classe, pergaminho, decisão do DM —, e aí nada é descontado da ficha.
              </p>
            )}

            <div className="mt-4 flex flex-wrap justify-between gap-2">
              <button className="btn-ghost" onClick={() => setEscolhida(null)}>
                ← Outra magia
              </button>
              <button
                className="btn-primary"
                onClick={() => onConjurar({ magia: escolhida, nivel: semEspaco ? 0 : nivel })}
              >
                {semEspaco ? '✨ Conjurar sem gastar espaço' : '✨ Conjurar'}
              </button>
            </div>
          </>
        )}
      </GlossarioProvider>
    </Modal>
  )
}

function GrupoDaFicha({
  titulo,
  nota,
  vazio,
  itens,
  livres,
  bloqueadas,
  onEscolher,
}: {
  titulo: string
  nota?: string
  vazio?: string
  itens: Disponivel[]
  livres?: number[]
  bloqueadas?: boolean
  onEscolher: (m: MagiaDoCatalogo) => void
}) {
  if (itens.length === 0 && !vazio) return null
  return (
    <div className="mt-3 first:mt-0">
      <p className="panel-title">{titulo}</p>
      {nota && <p className="mb-1 text-[11px] text-parchment-200/50">{nota}</p>}
      {itens.length === 0 ? (
        <p className="py-1 text-xs text-parchment-200/45">{vazio}</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {itens.map(({ ref, magia }) => {
            // Sem espaço no círculo dela nem em nenhum acima, a magia não sai.
            // Continua clicável de propósito: a tela seguinte explica por quê e
            // oferece a saída, o que é melhor do que um botão morto.
            const semEspaco =
              !bloqueadas && !!livres && ref.nivel > 0 && !cabeEm(livres, ref.nivel)
            const apagada = bloqueadas || semEspaco
            return (
              <li key={ref.id}>
                <button
                  className={`w-full rounded-lg border p-2 text-left transition ${
                    apagada
                      ? 'border-white/5 bg-white/[0.02] opacity-50 hover:opacity-80'
                      : 'border-white/10 bg-ink-900/40 hover:border-arcane-400/50'
                  }`}
                  onClick={() => onEscolher(magia ?? improvisada(ref))}
                >
                  {magia ? (
                    <Linha
                      m={magia}
                      aviso={bloqueadas ? 'não preparada' : semEspaco ? 'sem espaço' : ''}
                    />
                  ) : (
                    <span className="flex flex-wrap items-center gap-2">
                      <b className="text-sm text-parchment-50">{ref.nome}</b>
                      <span className="text-[11px] text-parchment-200/50">
                        {ref.nivel === 0 ? 'truque' : `${ref.nivel}º círculo`} · fora do catálogo
                      </span>
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Linha({ m, aviso }: { m: MagiaDoCatalogo; aviso?: string }) {
  return (
    <>
      <span className="flex flex-wrap items-center gap-2">
        <b className="text-sm text-parchment-50">
          {m.nomePt}
          <Original pt={m.nomePt} en={m.nome} />
        </b>
        {m.concentracao && (
          <span className="chip text-[10px] text-amber-300" title="Exige concentração">C</span>
        )}
        <span className="text-[11px] text-parchment-200/50">
          {m.nivel === 0 ? 'truque' : `${m.nivel}º círculo`} · {m.escolaPt}
        </span>
        {aviso && <span className="text-[11px] text-dragon-400/80">{aviso}</span>}
      </span>
      {m.emMiudos && (
        <span className="mt-0.5 block text-xs text-parchment-200/60">{m.emMiudos}</span>
      )}
    </>
  )
}

function Campo({ r, v }: { r: string; v: string }) {
  return (
    <div>
      <p className="panel-title">{r}</p>
      <p className="mt-0.5 text-parchment-100">{v}</p>
    </div>
  )
}
