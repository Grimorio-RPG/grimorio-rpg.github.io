// O tabuleiro: mapa, grade, tokens e régua.
//
// Vivia dentro da tela de Mapa e só sabia desenhar os tokens da cena. Agora ele
// desenha uma lista de tokens que vem de fora, e avisa quem move para onde —
// assim a mesma peça serve para a cena e para o combate, sem saber a diferença.
//
// O que ele ganhou junto: barra de vida no token e destaque de quem é a vez.
// Era o que faltava para o mapa deixar de ser um quadro e virar a tela onde a
// luta acontece.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { MapScene, Token } from '../types'
import { encaixar } from '../lib/mapscene'
import { conjurandoAgora } from '../lib/battle'

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
  alturaMax = '58vh',
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
  /**
   * Teto de altura do quadro, em vh. O mapa rola por dentro em vez de empurrar
   * o resto da tela para baixo — foi o que aconteceu quando ele entrou na
   * batalha: passar de turno virou rolar a página inteira.
   */
  alturaMax?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [arrastando, setArrastando] = useState<string | null>(null)

  // O brilho de conjuração vence pelo relógio, e não por um evento. Este
  // tique existe só para ele apagar sozinho — e só roda enquanto há alguém
  // conjurando, para o mapa parado não redesenhar à toa.
  const [agora, setAgora] = useState(() => Date.now())
  const alguemConjurando = tokens.some((t) => conjurandoAgora(t, agora))
  useEffect(() => {
    if (!alguemConjurando) return
    const id = setInterval(() => setAgora(Date.now()), 500)
    return () => clearInterval(id)
  }, [alguemConjurando])
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
    <div className="card overflow-auto p-2" style={{ maxHeight: alturaMax }}>
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
            agora={agora}
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
  agora,
  onPointerDown,
}: {
  t: Token
  celPx: number
  visaoJogador: boolean
  selecionado: boolean
  vida?: VidaNoTabuleiro
  daVez?: boolean
  /** A hora do último tique, para o brilho de conjuração saber quando parar. */
  agora: number
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
      } ${t.concentrando ? 'gv-token-concentra' : ''} ${
        conjurandoAgora(t, agora) ? 'gv-token-conjura' : ''
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

      {/* Concentrando: o halo já diz de longe, e o selo diz o quê de perto.
          Saber isso só na lista lateral é saber tarde demais — quando alguém já
          mirou no mago sem perceber o que ia derrubar. */}
      {t.concentrando && !vida?.fora && (
        <span
          className="pointer-events-none absolute -top-1 -right-1 grid place-items-center rounded-full bg-arcane-500/90 text-[9px] leading-none"
          style={{ width: Math.max(12, size * 0.32), height: Math.max(12, size * 0.32) }}
          title={`Concentrando em ${t.concentrando}`}
        >
          🧿
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


/**
 * A fila de iniciativa flutuando sobre o mapa.
 *
 * Fica presa no rodapé do tabuleiro em vez de empurrar o mapa para cima: o mapa
 * é a tela, e a fila é o que se consulta sem tirar os olhos dele. É como Roll20
 * e Foundry resolvem, e vale mais ainda quando a tela está projetada.
 *
 * Recolhível porque uma luta de oito criaturas ocupa espaço demais no celular
 * — e porque quem está só olhando o mapa fora de combate não precisa dela.
 */
export function FaixaDeIniciativa({
  ordenados,
  atualId,
  rodada,
  onAnterior,
  onProximo,
  onSelecionar,
}: {
  ordenados: { id: string; nome: string; pvAtual: number; pvMax: number; origem: string }[]
  atualId?: string
  rodada: number
  onAnterior?: () => void
  onProximo?: () => void
  onSelecionar?: (id: string) => void
}) {
  const [aberta, setAberta] = useState(true)
  if (ordenados.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-xl border border-white/15 bg-ink-900/85 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2 px-2.5 py-1.5">
          <span className="shrink-0 rounded-lg bg-dragon-500/20 px-2 py-0.5 text-xs font-semibold text-parchment-50">
            R{rodada}
          </span>

          {onAnterior && (
            <button
              type="button"
              onClick={onAnterior}
              className="shrink-0 px-1.5 text-parchment-200/50 hover:text-parchment-50"
              aria-label="Turno anterior"
            >
              ←
            </button>
          )}

          <button
            type="button"
            onClick={() => setAberta((v) => !v)}
            className="min-w-0 flex-1 truncate text-left text-sm text-parchment-100"
            title={aberta ? 'Recolher a fila' : 'Abrir a fila'}
          >
            {aberta ? (
              <span className="text-parchment-200/50">Iniciativa</span>
            ) : (
              <>
                <span className="text-parchment-200/50">Vez de </span>
                <b className="text-dragon-300">
                  {ordenados.find((c) => c.id === atualId)?.nome ?? '—'}
                </b>
              </>
            )}
          </button>

          {onProximo && (
            <button type="button" onClick={onProximo} className="btn-primary shrink-0 px-2.5 py-1 text-xs">
              Próximo →
            </button>
          )}
        </div>

        {aberta && (
          <ol className="flex gap-1.5 overflow-x-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ordenados.map((c) => {
              const caido = c.pvAtual <= 0
              const pct = c.pvMax > 0 ? Math.max(0, Math.min(1, c.pvAtual / c.pvMax)) * 100 : 0
              return (
                <li key={c.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelecionar?.(c.id)}
                    className={`w-24 rounded-lg border px-1.5 py-1 text-left transition ${
                      atualId === c.id
                        ? 'border-amber-400/70 bg-amber-500/15'
                        : 'border-white/10 hover:border-white/25'
                    } ${caido ? 'opacity-40' : ''}`}
                  >
                    <span
                      className={`block truncate text-[11px] ${
                        c.origem === 'inimigo' ? 'text-dragon-300' : 'text-emerald-300'
                      }`}
                    >
                      {c.nome}
                    </span>
                    <span className="mt-0.5 block h-1 overflow-hidden rounded-full bg-black/50">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: pct > 50 ? '#34d399' : pct > 25 ? '#fbbf24' : '#f87171',
                        }}
                      />
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
