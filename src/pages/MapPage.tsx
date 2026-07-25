import { useMemo, useRef, useState } from 'react'
import type { MapScene, Token } from '../types'
import { useMapScene } from '../hooks/useMapScene'
import { useCampaign } from '../hooks/useCampaign'
import { useBestiary } from '../hooks/useBestiary'
import { useBattle } from '../hooks/useBattle'
import {
  CORES_TOKEN,
  cenaVazia,
  encaixar,
  tokenDeMonstro,
  tokenDePersonagem,
  tokenObjeto,
} from '../lib/mapscene'
import { imageToDataUrl } from '../lib/bestiary'
import { EmptyState, PageHeader, ViewToggle } from '../components/layout-ui'

type Modo = 'dm' | 'jogadores'
type Ferramenta = 'mover' | 'medir'
type UpdateFn = (patch: Partial<MapScene>) => void

export default function MapPage() {
  const { scene, update, semEspaco } = useMapScene()
  const [modo, setModo] = useState<Modo>('dm')
  const [ferramenta, setFerramenta] = useState<Ferramenta>('mover')
  const [selecionado, setSelecionado] = useState<string | null>(null)

  if (!scene) return null
  const visaoJogador = modo === 'jogadores'

  return (
    <div>
      <PageHeader
        icon="🗺️"
        titulo="Mapa / Mesa Virtual"
        subtitulo="Suba um mapa, posicione tokens do grupo e dos inimigos e mostre a cena aos jogadores."
        acoes={
          <ViewToggle
            valor={modo}
            onChange={(v) => { setModo(v); setSelecionado(null) }}
            opcoes={[
              { valor: 'dm', label: '🎲 Visão do DM', labelCurto: '🎲 DM' },
              { valor: 'jogadores', label: '👥 Visão dos Jogadores', labelCurto: '👥 Jogadores' },
            ]}
          />
        }
      />

      {semEspaco && (
        <div className="mb-4 rounded-lg border border-dragon-400/40 bg-dragon-500/15 p-3 text-sm text-parchment-100">
          ⚠️ O mapa é grande demais para o armazenamento local do navegador. Use uma imagem menor (o app já reduz, mas mapas muito grandes podem não caber).
        </div>
      )}

      {!scene.mapaUrl && !visaoJogador ? (
        <SemMapa update={update} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
          <Board
            scene={scene}
            update={update}
            visaoJogador={visaoJogador}
            ferramenta={ferramenta}
            selecionado={selecionado}
            setSelecionado={setSelecionado}
          />
          {!visaoJogador && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Ferramentas scene={scene} update={update} ferramenta={ferramenta} setFerramenta={setFerramenta} />
              {selecionado && scene.tokens.some((t) => t.id === selecionado) ? (
                <TokenControles
                  token={scene.tokens.find((t) => t.id === selecionado)!}
                  update={update}
                  scene={scene}
                  onDeselect={() => setSelecionado(null)}
                />
              ) : (
                <AdicionarTokens scene={scene} update={update} />
              )}
              <ListaTokens scene={scene} update={update} selecionado={selecionado} onSelecionar={setSelecionado} />
            </div>
          )}
        </div>
      )}
      {visaoJogador && !scene.mapaUrl && (
        <EmptyState icon="🗺️" titulo="Sem mapa" texto="O DM ainda não preparou um mapa para esta cena." />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
function SemMapa({ update }: { update: UpdateFn }) {
  const ref = useRef<HTMLInputElement>(null)
  const [carregando, setCarregando] = useState(false)
  async function onFile(f: File) {
    setCarregando(true)
    try {
      update({ mapaUrl: await imageToDataUrl(f, 1600, 0.72) })
    } catch {
      alert('Não consegui processar essa imagem.')
    } finally {
      setCarregando(false)
    }
  }
  return (
    <div className="card flex flex-col items-center gap-4 p-12 text-center">
      <div className="text-5xl">🗺️</div>
      <div>
        <h3 className="text-xl text-parchment-50">Comece subindo um mapa</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-parchment-200/60">
          Uma imagem da masmorra, cidade ou campo de batalha. Depois é só arrastar os tokens.
        </p>
      </div>
      <button className="btn-primary" onClick={() => ref.current?.click()} disabled={carregando}>
        {carregando ? 'Processando…' : '📷 Enviar imagem do mapa'}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
function Board({
  scene,
  update,
  visaoJogador,
  ferramenta,
  selecionado,
  setSelecionado,
}: {
  scene: MapScene
  update: UpdateFn
  visaoJogador: boolean
  ferramenta: Ferramenta
  selecionado: string | null
  setSelecionado: (id: string | null) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [medida, setMedida] = useState<{ ax: number; ay: number; bx: number; by: number } | null>(null)
  const [medindo, setMedindo] = useState(false)

  const tokensVisiveis = visaoJogador ? scene.tokens.filter((t) => !t.oculto) : scene.tokens

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
      update({ tokens: scene.tokens.map((t) => (t.id === arrastando ? { ...t, x: p.x, y: p.y } : t)) })
    } else if (medindo && medida) {
      const p = fracDoEvento(e)
      setMedida({ ...medida, bx: p.x, by: p.y })
    }
  }
  function onPointerUp() {
    setArrastando(null)
    setMedindo(false)
  }

  // distância da régua em quadrados e metros
  const distancia = useMemo(() => {
    if (!medida || !ref.current) return null
    const r = ref.current.getBoundingClientRect()
    const dx = ((medida.bx - medida.ax) * r.width) / scene.celPx
    const dy = ((medida.by - medida.ay) * r.height) / scene.celPx
    const cells = Math.sqrt(dx * dx + dy * dy)
    return { cells: Math.round(cells * 10) / 10, metros: Math.round(cells * 1.5 * 10) / 10 }
  }, [medida, scene.celPx])

  return (
    <div className="card overflow-auto p-2">
      <div
        ref={ref}
        className={`relative mx-auto select-none ${ferramenta === 'medir' && !visaoJogador ? 'cursor-crosshair' : ''}`}
        style={{ width: `${(scene.zoom ?? 1) * 100}%`, touchAction: 'none' }}
        onPointerDown={onPointerDownBoard}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <img src={scene.mapaUrl} alt="Mapa" className="pointer-events-none block w-full rounded-lg" draggable={false} />

        {/* Grade */}
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

        {/* Tokens */}
        {tokensVisiveis.map((t) => (
          <TokenView
            key={t.id}
            t={t}
            celPx={scene.celPx}
            visaoJogador={visaoJogador}
            selecionado={selecionado === t.id}
            onPointerDown={(e) => {
              if (visaoJogador || ferramenta !== 'mover') return
              e.stopPropagation()
              setSelecionado(t.id)
              setArrastando(t.id)
            }}
          />
        ))}

        {/* Régua */}
        {medida && distancia && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <line x1={`${medida.ax * 100}%`} y1={`${medida.ay * 100}%`} x2={`${medida.bx * 100}%`} y2={`${medida.by * 100}%`} stroke="#c8514b" strokeWidth={2} strokeDasharray="6 4" />
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
  onPointerDown,
}: {
  t: Token
  celPx: number
  visaoJogador: boolean
  selecionado: boolean
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const oculto = visaoJogador && t.origem === 'inimigo' && t.conhecimento === 'desconhecido'
  const nome = oculto ? '?' : t.nome
  const img = oculto ? '' : (visaoJogador ? (t.imagemJogadorUrl || t.imagemUrl) : t.imagemUrl)
  const size = t.tamanho * celPx
  const inicial = (t.nome || '?').charAt(0).toUpperCase()

  return (
    <div
      onPointerDown={onPointerDown}
      title={nome}
      className={`absolute grid place-items-center rounded-full text-parchment-50 shadow-lg ${visaoJogador ? '' : 'cursor-grab active:cursor-grabbing'} ${t.oculto && !visaoJogador ? 'opacity-50' : ''}`}
      style={{
        left: `${t.x * 100}%`,
        top: `${t.y * 100}%`,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        background: img ? undefined : t.cor,
        boxShadow: `0 0 0 3px ${t.cor}, 0 2px 6px rgba(0,0,0,.5)`,
        outline: selecionado ? '2px solid #fff' : undefined,
        outlineOffset: 2,
      }}
    >
      {img ? (
        <img src={img} alt="" className="h-full w-full rounded-full object-cover" draggable={false} />
      ) : (
        <span className="font-display" style={{ fontSize: Math.max(10, size * 0.4) }}>{oculto ? '?' : inicial}</span>
      )}
      {!oculto && (
        <span className="pointer-events-none absolute -bottom-4 whitespace-nowrap rounded bg-ink-900/80 px-1 text-[10px] text-parchment-100">
          {nome}
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
function Ferramentas({
  scene,
  update,
  ferramenta,
  setFerramenta,
}: {
  scene: MapScene
  update: UpdateFn
  ferramenta: Ferramenta
  setFerramenta: (f: Ferramenta) => void
}) {
  const mapRef = useRef<HTMLInputElement>(null)
  async function trocarMapa(f: File) {
    try {
      update({ mapaUrl: await imageToDataUrl(f, 1600, 0.72) })
    } catch {
      alert('Não consegui processar essa imagem.')
    }
  }
  return (
    <section className="card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-parchment-200/70">Ferramentas</h2>
      <div className="mb-3 flex gap-1 rounded-lg border border-white/10 bg-ink-900/50 p-1 text-sm">
        {([['mover', '✋ Mover'], ['medir', '📏 Medir']] as const).map(([v, label]) => (
          <button key={v} onClick={() => setFerramenta(v)} className={`flex-1 rounded-md px-2 py-1.5 font-semibold transition ${ferramenta === v ? 'bg-arcane-500 text-parchment-50' : 'text-parchment-200/70 hover:text-parchment-50'}`}>{label}</button>
        ))}
      </div>

      <label className="mb-2 flex cursor-pointer items-center justify-between text-sm">
        <span className="text-parchment-100">Mostrar grade</span>
        <input type="checkbox" checked={scene.mostrarGrade} onChange={(e) => update({ mostrarGrade: e.target.checked })} className="h-4 w-4 accent-dragon-500" />
      </label>

      <label className="mb-3 flex cursor-pointer items-center justify-between text-sm">
        <span className="text-parchment-100" title="Tokens grudam no centro dos quadrados">Encaixar na grade</span>
        <input type="checkbox" checked={scene.encaixarGrade} onChange={(e) => update({ encaixarGrade: e.target.checked })} className="h-4 w-4 accent-dragon-500" />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-parchment-200/70">Tamanho do quadrado: {scene.celPx}px</span>
        <input type="range" min={24} max={100} value={scene.celPx} onChange={(e) => update({ celPx: parseInt(e.target.value, 10) })} className="w-full accent-dragon-500" />
      </label>

      <label className="mt-3 block text-sm">
        <span className="mb-1 block text-parchment-200/70">Zoom: {Math.round((scene.zoom ?? 1) * 100)}%</span>
        <input type="range" min={50} max={250} step={10} value={(scene.zoom ?? 1) * 100} onChange={(e) => update({ zoom: parseInt(e.target.value, 10) / 100 })} className="w-full accent-arcane-500" />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <label className="block">
          <span className="mb-1 block text-parchment-200/60">Ajuste X</span>
          <input type="range" min={0} max={scene.celPx} value={scene.offsetX} onChange={(e) => update({ offsetX: parseInt(e.target.value, 10) })} className="w-full accent-arcane-500" />
        </label>
        <label className="block">
          <span className="mb-1 block text-parchment-200/60">Ajuste Y</span>
          <input type="range" min={0} max={scene.celPx} value={scene.offsetY} onChange={(e) => update({ offsetY: parseInt(e.target.value, 10) })} className="w-full accent-arcane-500" />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn-ghost flex-1 py-1.5 text-xs" onClick={() => mapRef.current?.click()}>🖼️ Trocar mapa</button>
        <button className="btn-ghost py-1.5 text-xs text-parchment-200/50" onClick={() => { if (confirm('Limpar o mapa e todos os tokens?')) update(cenaVazia()) }}>Limpar</button>
      </div>
      <input ref={mapRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) trocarMapa(f); e.target.value = '' }} />
    </section>
  )
}

// ---------------------------------------------------------------------------
function AdicionarTokens({ scene, update }: { scene: MapScene; update: UpdateFn }) {
  const { campaign } = useCampaign()
  const { monstros } = useBestiary()
  const { battle } = useBattle()
  let corIdx = scene.tokens.length

  function add(token: Token) {
    update({ tokens: [...scene.tokens, token] })
  }
  const cor = () => CORES_TOKEN[corIdx++ % CORES_TOKEN.length]

  function importarEncontro() {
    if (!battle) return
    const novos = battle.combatentes.map((c) => {
      const t = c.origem === 'inimigo'
        ? { origem: 'inimigo' as const, conhecimento: c.conhecimento }
        : { origem: 'aliado' as const, conhecimento: 'completo' as const }
      const pos = { x: 0.15 + (corIdx % 6) * 0.06, y: 0.15 + (Math.floor(corIdx / 6) % 5) * 0.09 }
      corIdx++
      return {
        id: Math.random().toString(36).slice(2, 10),
        nome: c.nome, imagemUrl: c.imagemUrl, imagemJogadorUrl: c.imagemJogadorUrl,
        x: pos.x, y: pos.y, tamanho: 1, cor: cor(), oculto: false, ...t,
      } as Token
    })
    if (novos.length) update({ tokens: [...scene.tokens, ...novos] })
  }

  const party = campaign?.party ?? []
  const temEncontro = (battle?.combatentes.length ?? 0) > 0

  return (
    <section className="card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-parchment-200/70">Adicionar tokens</h2>

      {temEncontro && (
        <button className="btn-primary mb-3 w-full text-sm" onClick={importarEncontro}>⚔️ Importar encontro atual</button>
      )}

      <p className="mb-1 text-xs text-parchment-200/60">Grupo</p>
      {party.length === 0 ? (
        <p className="mb-3 text-xs text-parchment-200/40">Importe fichas no Painel do DM.</p>
      ) : (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {party.map((p) => (
            <button key={p.id} className="chip hover:border-emerald-400/60" onClick={() => add(tokenDePersonagem(p, cor()))}>＋ {p.nome || 'Aliado'}</button>
          ))}
        </div>
      )}

      <p className="mb-1 text-xs text-parchment-200/60">Inimigos (Bestiário)</p>
      {monstros.length === 0 ? (
        <p className="mb-3 text-xs text-parchment-200/40">Cadastre criaturas no Bestiário.</p>
      ) : (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {monstros.map((m) => (
            <button key={m.id} className="chip hover:border-dragon-400/60" onClick={() => add(tokenDeMonstro(m, cor()))}>＋ {m.nome || 'Inimigo'}</button>
          ))}
        </div>
      )}

      <button className="btn-ghost w-full py-1.5 text-xs" onClick={() => { const n = prompt('Nome do marcador (ex: Porta, Baú, Armadilha):'); if (n) add(tokenObjeto(n, cor())) }}>＋ Marcador / objeto</button>
    </section>
  )
}

// ---------------------------------------------------------------------------
function ListaTokens({
  scene,
  update,
  selecionado,
  onSelecionar,
}: {
  scene: MapScene
  update: UpdateFn
  selecionado: string | null
  onSelecionar: (id: string) => void
}) {
  if (scene.tokens.length === 0) return null
  const icone = { aliado: '🛡️', inimigo: '🐾', objeto: '📍' } as const
  return (
    <section className="card p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-parchment-200/70">
        Tokens ({scene.tokens.length})
      </h2>
      <ul className="max-h-56 space-y-1 overflow-y-auto">
        {scene.tokens.map((t) => (
          <li key={t.id}>
            <div className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition ${selecionado === t.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onSelecionar(t.id)}>
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: t.cor }} />
                <span className={`truncate ${t.oculto ? 'text-parchment-200/40' : 'text-parchment-100'}`}>
                  {icone[t.origem]} {t.nome || 'Sem nome'}
                </span>
              </button>
              <button
                className="shrink-0 text-xs text-parchment-200/40 hover:text-parchment-100"
                title={t.oculto ? 'Oculto dos jogadores' : 'Visível aos jogadores'}
                onClick={() => update({ tokens: scene.tokens.map((x) => (x.id === t.id ? { ...x, oculto: !x.oculto } : x)) })}
              >
                {t.oculto ? '🙈' : '👁'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------------
function TokenControles({
  token,
  update,
  scene,
  onDeselect,
}: {
  token: Token
  update: UpdateFn
  scene: MapScene
  onDeselect: () => void
}) {
  function patch(p: Partial<Token>) {
    update({ tokens: scene.tokens.map((t) => (t.id === token.id ? { ...t, ...p } : t)) })
  }
  function remover() {
    update({ tokens: scene.tokens.filter((t) => t.id !== token.id) })
    onDeselect()
  }
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-parchment-200/70">Token</h2>
        <button className="text-xs text-parchment-200/50 hover:text-parchment-100" onClick={onDeselect}>fechar</button>
      </div>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-parchment-200/70">Nome</span>
        <input className="stat-input py-1.5" value={token.nome} onChange={(e) => patch({ nome: e.target.value })} />
      </label>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-parchment-200/70">Tamanho: {token.tamanho} quadrado(s)</span>
        <input type="range" min={1} max={4} value={token.tamanho} onChange={(e) => patch({ tamanho: parseInt(e.target.value, 10) })} className="w-full accent-dragon-500" />
      </label>

      <div className="mb-3">
        <span className="mb-1 block text-sm text-parchment-200/70">Cor</span>
        <div className="flex flex-wrap gap-1.5">
          {CORES_TOKEN.map((c) => (
            <button key={c} onClick={() => patch({ cor: c })} className={`h-6 w-6 rounded-full ${token.cor === c ? 'ring-2 ring-white' : ''}`} style={{ background: c }} />
          ))}
        </div>
      </div>

      <label className="mb-3 flex cursor-pointer items-center justify-between text-sm">
        <span className="flex items-center gap-1 text-parchment-100">Oculto dos jogadores</span>
        <input type="checkbox" checked={token.oculto} onChange={(e) => patch({ oculto: e.target.checked })} className="h-4 w-4 accent-dragon-500" />
      </label>

      <button className="btn-ghost w-full py-1.5 text-xs text-parchment-200/60 hover:text-dragon-400" onClick={remover}>🗑 Remover token</button>
    </section>
  )
}
