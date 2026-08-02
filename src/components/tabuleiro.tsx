// O tabuleiro: mapa, grade, tokens e régua.
//
// Vivia dentro da tela de Mapa e só sabia desenhar os tokens da cena. Agora ele
// desenha uma lista de tokens que vem de fora, e avisa quem move para onde —
// assim a mesma peça serve para a cena e para o combate, sem saber a diferença.
//
// O que ele ganhou junto: barra de vida no token e destaque de quem é a vez.
// Era o que faltava para o mapa deixar de ser um quadro e virar a tela onde a
// luta acontece.

import { useMemo, useRef, useState } from 'react'
import type { MapScene, Token } from '../types'
import { encaixar } from '../lib/mapscene'

export type Ferramenta = 'mover' | 'medir'

/** Vida de um token, quando ele for uma criatura em combate. */
export interface VidaNoTabuleiro {
  atual: number
  max: number
  /** Já caiu. O token fica apagado e ganha um traço. */
  fora: boolean
}

export function Tabuleiro({
  scene,
  tokens,
  onMover,
  visaoJogador,
  ferramenta,
  selecionado,
  setSelecionado,
  vidas = {},
  atualId,
  alturaCheia = false,
}: {
  scene: MapScene
  tokens: Token[]
  onMover: (id: string, x: number, y: number) => void
  visaoJogador: boolean
  ferramenta: Ferramenta
  selecionado: string | null
  setSelecionado: (id: string | null) => void
  /** Vida por id de token. Ausente = não desenha barra. */
  vidas?: Record<string, VidaNoTabuleiro>
  /** Quem está no turno, para o anel pulsante. */
  atualId?: string
  /** Ocupa a tela toda, para a versão em que o mapa É a tela. */
  alturaCheia?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [medida, setMedida] = useState<{ ax: number; ay: number; bx: number; by: number } | null>(null)
  const [medindo, setMedindo] = useState(false)

  const visiveis = visaoJogador ? tokens.filter((t) => !t.oculto) : tokens

  function fracDoEvento(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    }
  }

  function onPointerDownBoard(e: React.PointerEvent) {
    if (visaoJogador) return
    if (ferramenta === 'medir') {
      const p = fracDoEvento(e)
      setMedida({ ax: p.x, ay: p.y, bx: p.x, by: p.y })
      setMedindo(true)
    } else {
      setSelecionado(null)
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (arrastando) {
      let p = fracDoEvento(e)
      if (scene.encaixarGrade && ref.current) {
        const r = ref.current.getBoundingClientRect()
        p = encaixar(p.x, p.y, r.width, r.height, scene.celPx, scene.offsetX, scene.offsetY)
      }
      onMover(arrastando, p.x, p.y)
    } else if (medindo && medida) {
      const p = fracDoEvento(e)
      setMedida({ ...medida, bx: p.x, by: p.y })
    }
  }

  function onPointerUp() {
    setArrastando(null)
    setMedindo(false)
  }

  // Distância da régua, em quadrados e em metros.
  const distancia = useMemo(() => {
    if (!medida || !ref.current) return null
    const r = ref.current.getBoundingClientRect()
    const dx = ((medida.bx - medida.ax) * r.width) / scene.celPx
    const dy = ((medida.by - medida.ay) * r.height) / scene.celPx
    const cells = Math.sqrt(dx * dx + dy * dy)
    return { cells: Math.round(cells * 10) / 10, metros: Math.round(cells * 1.5 * 10) / 10 }
  }, [medida, scene.celPx])

  return (
    <div className={`card overflow-auto p-2 ${alturaCheia ? 'h-full' : ''}`}>
      <div
        ref={ref}
        className={`relative mx-auto select-none ${
          ferramenta === 'medir' && !visaoJogador ? 'cursor-crosshair' : ''
        }`}
        style={{ width: `${(scene.zoom ?? 1) * 100}%`, touchAction: 'none' }}
        onPointerDown={onPointerDownBoard}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <img
          src={scene.mapaUrl}
          alt="Mapa"
          className="pointer-events-none block w-full rounded-lg"
          draggable={false}
        />

        {scene.mostrarGrade && (
          <div
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.18) 1px, transparent 1px)',
              backgroundSize: `${scene.celPx}px ${scene.celPx}px`,
              backgroundPosition: `${scene.offsetX}px ${scene.offsetY}px`,
            }}
          />
        )}

        {visiveis.map((t) => (
          <TokenView
            key={t.id}
            t={t}
            celPx={scene.celPx}
            visaoJogador={visaoJogador}
            selecionado={selecionado === t.id}
            vida={vidas[t.id]}
            daVez={atualId === t.id}
            onPointerDown={(e) => {
              if (visaoJogador || ferramenta !== 'mover') return
              e.stopPropagation()
              setSelecionado(t.id)
              setArrastando(t.id)
            }}
          />
        ))}

        {medida && distancia && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <line
              x1={`${medida.ax * 100}%`}
              y1={`${medida.ay * 100}%`}
              x2={`${medida.bx * 100}%`}
              y2={`${medida.by * 100}%`}
              stroke="#c8514b"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <circle cx={`${medida.bx * 100}%`} cy={`${medida.by * 100}%`} r={4} fill="#c8514b" />
            <foreignObject x={`${medida.bx * 100}%`} y={`${medida.by * 100}%`} width="120" height="34">
              <div className="mt-1 inline-block rounded bg-ink-900/90 px-2 py-0.5 text-xs text-parchment-50">
                {distancia.cells} q · {distancia.metros} m
              </div>
            </foreignObject>
          </svg>
        )}
      </div>
    </div>
  )
}

function TokenView({
  t,
  celPx,
  visaoJogador,
  selecionado,
  vida,
  daVez,
  onPointerDown,
}: {
  t: Token
  celPx: number
  visaoJogador: boolean
  selecionado: boolean
  vida?: VidaNoTabuleiro
  daVez?: boolean
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const anonimo = visaoJogador && t.origem === 'inimigo' && t.conhecimento === 'desconhecido'
  const nome = anonimo ? '?' : t.nome
  const img = anonimo ? '' : visaoJogador ? t.imagemJogadorUrl || t.imagemUrl : t.imagemUrl
  const size = t.tamanho * celPx
  const inicial = (t.nome || '?').charAt(0).toUpperCase()

  const pct = vida && vida.max > 0 ? Math.max(0, Math.min(1, vida.atual / vida.max)) * 100 : null

  return (
    <div
      onPointerDown={onPointerDown}
      title={nome}
      className={`absolute grid place-items-center rounded-full text-parchment-50 shadow-lg ${
        visaoJogador ? '' : 'cursor-grab active:cursor-grabbing'
      } ${t.oculto && !visaoJogador ? 'opacity-50' : ''} ${vida?.fora ? 'opacity-45 grayscale' : ''} ${
        daVez ? 'gv-token-vez' : ''
      }`}
      style={{
        left: `${t.x * 100}%`,
        top: `${t.y * 100}%`,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        background: img ? undefined : t.cor,
        boxShadow: `0 0 0 3px ${daVez ? '#fbbf24' : t.cor}, 0 2px 6px rgba(0,0,0,.5)`,
        outline: selecionado ? '2px solid #fff' : undefined,
        outlineOffset: 2,
      }}
    >
      {img ? (
        <img src={img} alt="" className="h-full w-full rounded-full object-cover" draggable={false} />
      ) : (
        <span className="font-display" style={{ fontSize: Math.max(10, size * 0.4) }}>
          {anonimo ? '?' : inicial}
        </span>
      )}

      {/* Caído: um traço por cima diz mais rápido do que a barra vazia. */}
      {vida?.fora && (
        <span className="pointer-events-none absolute text-2xl" aria-hidden="true">
          ✕
        </span>
      )}

      {/* A vida no próprio token. Era ela que faltava para o mapa deixar de ser
          um quadro: sem PV, o DM tinha que olhar a outra tela para saber quem
          estava perto de cair. */}
      {pct !== null && !vida?.fora && (
        <span
          className="pointer-events-none absolute -bottom-1 h-1 overflow-hidden rounded-full bg-black/60"
          style={{ width: size * 0.8 }}
        >
          <span
            className="block h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              background: pct > 50 ? '#34d399' : pct > 25 ? '#fbbf24' : '#f87171',
            }}
          />
        </span>
      )}

      {!anonimo && (
        <span className="pointer-events-none absolute -bottom-5 whitespace-nowrap rounded bg-ink-900/80 px-1 text-[10px] text-parchment-100">
          {nome}
        </span>
      )}
    </div>
  )
}
