// Escolher magias — o mesmo painel na subida de nível e na ficha.
//
// A lista vem do SRD e já sai filtrada pela classe e pelo maior círculo que o
// personagem alcança. Isso não é enfeite: um mago de nível 4 tem 339 magias no
// catálogo, 60 delas na lista dele, e só as de 1º e 2º círculo servem. Mostrar
// as 339 é o mesmo que não mostrar nenhuma.
//
// Mas sessenta linhas iguais também não são uma escolha. Elas traziam nome,
// círculo e escola — três coisas que não respondem à única pergunta de quem
// está escolhendo: esta magia machuca ou ajuda? quanto? pega o grupo? A busca
// por nome só serve para quem JÁ SABE o nome, e quem já sabe o nome não estava
// escolhendo. Por isso os filtros de papel, escola e círculo, e por isso cada
// linha ganhou a cor e o símbolo da escola: para virar algo que se reconhece de
// relance em vez de um parágrafo para ler.

import { useEffect, useMemo, useState } from 'react'
import { carregarMagias, type MagiaDoCatalogo } from '../data/srd/magias'
import {
  DANO_ICONE,
  ESCOLA_COR,
  ESCOLA_ICONE,
  PAPEIS,
  type Papel,
} from '../lib/magia-perfil'
import { Original } from './layout-ui'

/** O catálogo desce uma vez por sessão e fica; a tela não precisa saber disso. */
export function useCatalogoDeMagias(): MagiaDoCatalogo[] | null {
  const [magias, setMagias] = useState<MagiaDoCatalogo[] | null>(null)
  useEffect(() => {
    let vivo = true
    void carregarMagias().then((m) => {
      if (vivo) setMagias(m)
    })
    return () => {
      vivo = false
    }
  }, [])
  return magias
}

export function EscolherMagias({
  classe,
  circulo,
  maiorCirculo,
  jaTem,
  faltam,
  cheio,
  aviso,
  onEscolher,
  altura = 'max-h-64',
}: {
  classe: string
  /** 0 = só truques. Qualquer outro = magias de 1º ao maior círculo. */
  circulo: 0 | 1
  maiorCirculo: number
  /** Nomes que já estão na ficha, em minúsculas. */
  jaTem: Set<string>
  /** Quantas ainda faltam — só para mostrar. */
  faltam: number
  /** A cota acabou: escolher mais passa do que a classe permite. */
  cheio?: boolean
  /** O porquê, escrito para quem está olhando. */
  aviso?: string
  onEscolher: (m: MagiaDoCatalogo) => void
  altura?: string
}) {
  const magias = useCatalogoDeMagias()
  const [busca, setBusca] = useState('')
  const [todasAsClasses, setTodasAsClasses] = useState(false)
  const [papel, setPapel] = useState<Papel | null>(null)
  const [escola, setEscola] = useState<string | null>(null)
  const [nivel, setNivel] = useState<number | null>(null)

  /** As magias da classe, antes dos filtros de escolha — a base dos contadores. */
  const doPersonagem = useMemo(() => {
    if (!magias) return []
    return magias.filter((m) => {
      if (circulo === 0 ? m.nivel !== 0 : m.nivel < 1 || m.nivel > maiorCirculo) return false
      return todasAsClasses || m.classesPt.includes(classe)
    })
  }, [magias, circulo, maiorCirculo, classe, todasAsClasses])

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return doPersonagem
      .filter((m) => {
        if (papel && m.perfil.papel !== papel) return false
        if (escola && m.escolaPt !== escola) return false
        if (nivel != null && m.nivel !== nivel) return false
        if (!q) return true
        return m.nomePt.toLowerCase().includes(q) || m.nome.toLowerCase().includes(q)
      })
      .sort((a, b) => a.nivel - b.nivel || a.nomePt.localeCompare(b.nomePt, 'pt-BR'))
  }, [doPersonagem, busca, papel, escola, nivel])

  // Escolas que ESTA lista tem. Oferecer as oito quando o patrulheiro só alcança
  // três seria oferecer cinco botões que devolvem lista vazia.
  const escolas = useMemo(
    () => [...new Set(doPersonagem.map((m) => m.escolaPt))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [doPersonagem],
  )
  const niveis = useMemo(
    () => [...new Set(doPersonagem.map((m) => m.nivel))].sort((a, b) => a - b),
    [doPersonagem],
  )
  const contarPapel = (p: Papel) => doPersonagem.filter((m) => m.perfil.papel === p).length

  if (!magias) {
    return <p className="py-3 text-sm text-parchment-200/50">Abrindo o grimório…</p>
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          className="stat-input w-auto flex-1"
          value={busca}
          placeholder={circulo === 0 ? 'Buscar truque…' : 'Buscar magia…'}
          onChange={(e) => setBusca(e.target.value)}
        />
        {faltam > 0 && (
          <span className="chip border-amber-400/50 text-amber-300">faltam {faltam}</span>
        )}
      </div>

      {/* A cota acabou. O aviso vem ANTES da lista, e a lista fica travada: era
          fácil demais passar do limite sem perceber, porque o contador só ficava
          vermelho depois do estrago. */}
      {cheio && (
        <p className="mb-2 rounded-lg border border-dragon-400/40 bg-dragon-500/10 p-2 text-xs text-dragon-300">
          {aviso ?? 'A cota desta classe já está cheia.'} Apague uma magia antes de pegar outra — ou
          marque <b>ir além do limite</b> logo acima, se esta vier de talento, subclasse ou
          pergaminho.
        </p>
      )}

      {/* Filtros. O papel primeiro porque é a pergunta que se faz primeiro:
          quero machucar ou quero ajudar. */}
      <div className="mb-2 space-y-1.5">
        <div className="flex flex-wrap gap-1">
          <Filtro ativo={papel === null} onClick={() => setPapel(null)}>
            Tudo ({doPersonagem.length})
          </Filtro>
          {PAPEIS.map((p) => {
            const n = contarPapel(p.papel)
            if (n === 0) return null
            return (
              <Filtro key={p.papel} ativo={papel === p.papel} onClick={() => setPapel(papel === p.papel ? null : p.papel)}>
                {p.icone} {p.rotulo} ({n})
              </Filtro>
            )
          })}
        </div>

        {niveis.length > 1 && (
          <div className="flex flex-wrap gap-1">
            <Filtro ativo={nivel === null} onClick={() => setNivel(null)}>
              Todo círculo
            </Filtro>
            {niveis.map((n) => (
              <Filtro key={n} ativo={nivel === n} onClick={() => setNivel(nivel === n ? null : n)}>
                {n === 0 ? 'Truque' : `${n}º`}
              </Filtro>
            ))}
          </div>
        )}

        {escolas.length > 1 && (
          <div className="flex flex-wrap gap-1">
            <Filtro ativo={escola === null} onClick={() => setEscola(null)}>
              Toda escola
            </Filtro>
            {escolas.map((e) => (
              <Filtro
                key={e}
                ativo={escola === e}
                onClick={() => setEscola(escola === e ? null : e)}
                cor={ESCOLA_COR[e]}
              >
                {ESCOLA_ICONE[e]} {e}
              </Filtro>
            ))}
          </div>
        )}
      </div>

      <ul className={`space-y-1 overflow-y-auto ${altura}`}>
        {lista.map((m) => {
          const tem = jaTem.has(m.nomePt.toLowerCase())
          const travada = tem || cheio
          const cor = ESCOLA_COR[m.escolaPt] ?? '#6b7280'
          const p = m.perfil
          return (
            <li key={m.nome}>
              <button
                type="button"
                disabled={travada}
                onClick={() => onEscolher(m)}
                style={{ borderLeftColor: travada ? undefined : cor, borderLeftWidth: 3 }}
                className={`w-full rounded-lg border p-2 text-left transition ${
                  travada
                    ? 'cursor-default border-white/5 bg-white/[0.02] opacity-45'
                    : 'border-white/10 bg-ink-900/40 hover:border-arcane-400/50'
                }`}
              >
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span title={m.escolaPt}>{ESCOLA_ICONE[m.escolaPt] ?? '✨'}</span>
                  <b className="text-sm text-parchment-50">
                    {m.nomePt}
                    <Original pt={m.nomePt} en={m.nome} />
                  </b>

                  {/* Os números que decidem entre duas magias parecidas. Estavam
                      no texto oficial o tempo todo, e ninguém ia lê-lo aqui. */}
                  {p.dados && (
                    <span className="chip text-[10px] text-dragon-300" title={`Dano ${p.dano}`}>
                      {DANO_ICONE[p.dano ?? ''] ?? '💥'} {p.dados}
                    </span>
                  )}
                  {p.salvaguarda && (
                    <span className="chip text-[10px] text-parchment-200/70" title="Salvaguarda do alvo">
                      salv. {p.salvaguarda}
                    </span>
                  )}
                  {p.ataque && (
                    <span className="chip text-[10px] text-parchment-200/70" title="Pede rolagem de ataque">
                      ataque
                    </span>
                  )}
                  {p.area && (
                    <span className="chip text-[10px] text-amber-300/80" title="Pega mais de um alvo">
                      área
                    </span>
                  )}
                  {m.concentracao && (
                    <span className="chip text-[10px] text-amber-300" title="Exige concentração">C</span>
                  )}
                  {m.ritual && (
                    <span className="chip text-[10px] text-arcane-300" title="Pode ser ritual">R</span>
                  )}

                  <span className="text-[11px] text-parchment-200/50">
                    {m.nivel === 0 ? 'truque' : `${m.nivel}º`} · {m.escolaPt}
                  </span>
                  {tem && <span className="text-[11px] text-emerald-400/70">já tem</span>}
                </span>
                {m.emMiudos && (
                  <span className="mt-0.5 block text-xs text-parchment-200/60">{m.emMiudos}</span>
                )}
              </button>
            </li>
          )
        })}
        {lista.length === 0 && (
          <li className="p-2 text-sm text-parchment-200/50">
            Nenhuma magia com esses filtros na lista de {classe}.
          </li>
        )}
      </ul>

      {/* O escape. A lista da classe é o caminho certo em 99% das vezes, mas
          talento, subclasse e pergaminho achado põem magias de fora na ficha —
          e um app que só sabe o caminho certo vira um app que impede. */}
      <label className="mt-2 flex items-center gap-1.5 text-[11px] text-parchment-200/50">
        <input
          type="checkbox"
          checked={todasAsClasses}
          onChange={(e) => setTodasAsClasses(e.target.checked)}
          className="h-3 w-3 accent-arcane-500"
        />
        Mostrar magias de fora da lista de {classe} (talento, subclasse, pergaminho)
      </label>
    </div>
  )
}

/** Um botão de filtro. A cor da escola vira a borda quando está ligado. */
function Filtro({
  ativo,
  onClick,
  cor,
  children,
}: {
  ativo: boolean
  onClick: () => void
  cor?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={ativo && cor ? { borderColor: cor, color: cor } : undefined}
      className={`chip text-[11px] transition ${
        ativo ? 'border-arcane-400/70 text-parchment-50' : 'text-parchment-200/60 hover:border-white/25'
      }`}
    >
      {children}
    </button>
  )
}
