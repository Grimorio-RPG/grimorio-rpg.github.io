// Escolher a área e ver quem ela pega.
//
// "A Bola de Fogo pega quem?" era resolvido com o dedo sobre o mapa e uma
// discussão — e a discussão sempre acontecia DEPOIS de alguém dizer onde ia
// jogar, quando ninguém mais consegue ser imparcial sobre se o ladino estava
// dentro ou fora. Numa mesa com miniaturas é pior: o cone não tem contorno
// nenhum, e sobra a mão do DM riscando o ar.
//
// O tamanho NÃO se arrasta: escolhe-se a magia (ou o número) e arrasta-se só a
// direção. Bola de Fogo tem 20 pés de raio, e deixar a mesa esticar o círculo
// no olho seria devolver a discussão que este painel veio encerrar.

import { useState } from 'react'
import { AREAS_SRD } from '../data/srd/areas-srd'
import { emMetros, type TipoDeGabarito } from '../lib/gabaritos'

/** A forma escolhida, sem onde ela foi colocada. */
export interface FormaDeArea {
  tipo: TipoDeGabarito
  quadrados: number
  largura?: number
}

const FORMAS: { tipo: TipoDeGabarito; rotulo: string; icone: string }[] = [
  { tipo: 'esfera', rotulo: 'Esfera', icone: '⭘' },
  { tipo: 'cone', rotulo: 'Cone', icone: '◺' },
  { tipo: 'linha', rotulo: 'Linha', icone: '▬' },
  { tipo: 'cubo', rotulo: 'Cubo', icone: '▢' },
]

export function SeletorDeGabarito({
  forma,
  setForma,
}: {
  forma: FormaDeArea
  setForma: (f: FormaDeArea) => void
}) {
  const [busca, setBusca] = useState('')

  const achadas = busca.trim()
    ? AREAS_SRD.filter((a) =>
        a.nome.toLowerCase().includes(busca.trim().toLowerCase()) ||
        a.original.toLowerCase().includes(busca.trim().toLowerCase()),
      ).slice(0, 6)
    : []

  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/60 p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {FORMAS.map((f) => (
          <button
            key={f.tipo}
            type="button"
            onClick={() => setForma({ ...forma, tipo: f.tipo })}
            className={`chip text-xs ${
              forma.tipo === f.tipo ? 'border-arcane-400/70 text-parchment-50' : 'text-parchment-200/60'
            }`}
          >
            {f.icone} {f.rotulo}
          </button>
        ))}

        <label className="ml-1 flex items-center gap-1 text-xs text-parchment-200/60">
          <input
            type="number"
            min={1}
            max={40}
            value={forma.quadrados}
            onChange={(e) =>
              setForma({ ...forma, quadrados: Math.max(1, Math.min(40, Number(e.target.value) || 1)) })
            }
            className="w-14 rounded-md border border-white/10 bg-ink-800 px-1.5 py-0.5 text-center text-parchment-50 outline-none focus:border-arcane-400"
          />
          {/* As duas unidades: quadrados para quem tem a grade na frente, metros
              para quem está lendo a magia. */}
          q · {emMetros(forma.quadrados)} m
        </label>

        {forma.tipo === 'linha' && (
          <label className="flex items-center gap-1 text-xs text-parchment-200/60">
            largura
            <input
              type="number"
              min={1}
              max={10}
              value={forma.largura ?? 1}
              onChange={(e) =>
                setForma({ ...forma, largura: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })
              }
              className="w-12 rounded-md border border-white/10 bg-ink-800 px-1.5 py-0.5 text-center text-parchment-50 outline-none focus:border-arcane-400"
            />
          </label>
        )}
      </div>

      {/* O caminho curto: escrever o nome da magia. Os números do livro estão
          todos aqui, e digitar "6" de cabeça é onde o erro entra. */}
      <div className="mt-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="…ou busque a magia: bola de fogo, cone de frio, relâmpago…"
          className="w-full rounded-md border border-white/10 bg-ink-800 px-2 py-1 text-xs outline-none focus:border-arcane-400"
        />
        {achadas.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {achadas.map((a) => (
              <li key={a.nome}>
                <button
                  type="button"
                  onClick={() => {
                    setForma({ tipo: a.tipo, quadrados: a.quadrados, largura: a.largura })
                    setBusca('')
                  }}
                  className="w-full rounded-md px-1.5 py-1 text-left text-xs text-parchment-100 hover:bg-white/5"
                >
                  <b>{a.nome}</b>{' '}
                  <span className="text-parchment-200/50">
                    {a.forma} de {a.quadrados} q · {emMetros(a.quadrados)} m
                    {a.largura ? `, ${a.largura} q de largura` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Alguém no tabuleiro, do jeito que o painel precisa mostrar. */
export interface NaArea {
  id: string
  nome: string
  origem: string
}

/**
 * Quem a área pega.
 *
 * O aliado vem primeiro e em vermelho. Não é enfeite: a pergunta que se faz
 * antes de soltar uma Bola de Fogo nunca é quantos goblins ela alcança — é se o
 * ladino está dentro. Enterrar essa linha no meio da lista seria responder a
 * pergunta errada.
 */
export function QuemAArea({ dentro }: { dentro: NaArea[] }) {
  const inimigos = dentro.filter((a) => a.origem === 'inimigo')
  const nossos = dentro.filter((a) => a.origem !== 'inimigo')

  if (dentro.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-ink-900/60 p-2.5 text-xs text-parchment-200/50">
        A área não pega ninguém. Arraste no mapa para mirar.
      </p>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/60 p-2.5">
      <p className="panel-title mb-1.5">
        Na área: {dentro.length} {dentro.length === 1 ? 'criatura' : 'criaturas'}
      </p>
      {nossos.length > 0 && (
        <p className="mb-1 text-xs text-dragon-300">
          ⚠ Fogo amigo: <b>{nossos.map((a) => a.nome).join(', ')}</b>
        </p>
      )}
      {inimigos.length > 0 && (
        <p className="text-xs text-parchment-100">
          <span className="text-parchment-200/50">Inimigos:</span>{' '}
          {inimigos.map((a) => a.nome).join(', ')}
        </p>
      )}
    </div>
  )
}
