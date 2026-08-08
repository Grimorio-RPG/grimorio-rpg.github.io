// O glossário na tela: a palavra dentro da explicação abre a explicação dela.
//
// A ideia veio dos jogos da Paradox — você lê "sintonia" na descrição de um
// item, clica, e a janela da sintonia abre por cima; dentro dela "descanso
// curto" também é clicável, e você desce até entender, voltando pelo mesmo
// caminho. Sem isso a resposta está a três telas de distância, ou não está em
// lugar nenhum.
//
// O `GLOSSARIO` existia desde antes deste arquivo e não era importado por
// ninguém: trinta verbetes escritos e mortos no disco.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Verbete } from '../data/glossario'
import { fatiarTexto } from '../lib/glossario'

// ---------------------------------------------------------------------------
// A pilha de verbetes abertos
// ---------------------------------------------------------------------------

interface Contexto {
  abrir: (verbete: Verbete) => void
}

const Ctx = createContext<Contexto | null>(null)

/**
 * Envolve uma área da tela para que os termos dentro dela virem links.
 *
 * Sem o provedor os textos continuam aparecendo — só que sem os links. É de
 * propósito: uma tela que esqueceu de envolver mostra o texto normal em vez de
 * quebrar.
 */
export function GlossarioProvider({ children }: { children: ReactNode }) {
  const [pilha, setPilha] = useState<Verbete[]>([])

  const abrir = useCallback((v: Verbete) => {
    setPilha((atual) => {
      // Reabrir o que já está aberto volta para ele em vez de empilhar de novo:
      // sem isso, ir e voltar entre dois termos cria uma trilha infinita.
      const jaEsta = atual.findIndex((x) => x.id === v.id)
      if (jaEsta >= 0) return atual.slice(0, jaEsta + 1)
      return [...atual, v]
    })
  }, [])

  const valor = useMemo(() => ({ abrir }), [abrir])

  return (
    <Ctx.Provider value={valor}>
      {children}
      {pilha.length > 0 && (
        <PainelDoVerbete
          pilha={pilha}
          onVoltar={() => setPilha((a) => a.slice(0, -1))}
          onFechar={() => setPilha([])}
        />
      )}
    </Ctx.Provider>
  )
}

function PainelDoVerbete({
  pilha,
  onVoltar,
  onFechar,
}: {
  pilha: Verbete[]
  onVoltar: () => void
  onFechar: () => void
}) {
  const atual = pilha[pilha.length - 1]

  // z-[60]: o verbete abre POR CIMA do editor de item, que já é z-50. É o ponto
  // do encadeamento — a explicação não substitui o que você estava lendo, ela
  // empilha em cima, e fechar devolve você exatamente onde estava.
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onFechar}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* A trilha: por onde a pessoa passou até aqui. É o que impede a
            sensação de estar perdida três termos abaixo. */}
        {pilha.length > 1 && (
          <p className="mb-2 truncate text-[11px] text-parchment-200/40">
            {pilha.slice(0, -1).map((v) => v.termo).join(' › ')} ›
          </p>
        )}

        <div className="mb-3 flex items-start justify-between gap-3">
          <h4 className="text-lg font-semibold capitalize text-parchment-50">{atual.termo}</h4>
          <div className="flex shrink-0 gap-1">
            {pilha.length > 1 && (
              <button className="btn-ghost py-1 text-xs" onClick={onVoltar}>
                ← Voltar
              </button>
            )}
            <button className="btn-ghost py-1 text-xs" onClick={onFechar}>
              Fechar
            </button>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-parchment-100">
          <TextoComTermos texto={atual.texto} exceto={atual.id} />
        </p>

        {atual.onde && (
          <p className="mt-3 text-[11px] text-parchment-200/40">{atual.onde}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Texto com os termos do glossário clicáveis.
 *
 * Use no lugar de `{texto}` em qualquer descrição de regra. Fora de um
 * `GlossarioProvider` devolve o texto normal, sem links.
 */
export function TextoComTermos({ texto, exceto }: { texto: string; exceto?: string }) {
  const ctx = useContext(Ctx)
  const partes = useMemo(() => fatiarTexto(texto, exceto), [texto, exceto])

  return (
    <>
      {partes.map((p, i) =>
        p.verbete && ctx ? (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              ctx.abrir(p.verbete!)
            }}
            className={`border-b border-dotted border-arcane-400/50 text-arcane-300 transition hover:border-arcane-300 hover:text-arcane-200 ${
              p.forte ? 'font-semibold' : ''
            }`}
            title={`O que é ${p.verbete.termo}?`}
          >
            {p.texto}
          </button>
        ) : (
          <span key={i} className={p.forte ? 'font-semibold text-parchment-50' : undefined}>
            {p.texto}
          </span>
        ),
      )}
    </>
  )
}
