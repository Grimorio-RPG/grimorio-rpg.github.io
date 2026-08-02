import { useRef, useState } from 'react'
import type { Battle, Combatant, MapScene, Token } from '../types'
import { useMapScene } from '../hooks/useMapScene'
import { useCampaign } from '../hooks/useCampaign'
import { useBestiary } from '../hooks/useBestiary'
import { useBattle } from '../hooks/useBattle'
import { CORES_TOKEN, cenaVazia, tokenObjeto } from '../lib/mapscene'
import {
  combatenteDePersonagem,
  combatentesDeMonstro,
  moverCombatente,
  ordenar,
  tokenDeCombatente,
  tokensDaCena,
} from '../lib/battle'
import { Tabuleiro, type VidaNoTabuleiro } from '../components/tabuleiro'
import { imageToDataUrl } from '../lib/bestiary'
import { EmptyState, PageHeader, ViewToggle } from '../components/layout-ui'
import { useEstadoMesa, useMesa } from '../hooks/useSync'
import { CHAVES_MESA } from '../lib/sync/config'
import { SelosDaMesa } from '../components/mesa-ui'

type Modo = 'dm' | 'jogadores'
import type { Ferramenta } from '../components/tabuleiro'
type UpdateFn = (patch: Partial<MapScene>) => void

/** Batalha vazia para as contas de seleção, quando ainda não há uma. */
const vaziaParaSelecao: Battle = {
  updatedAt: 0, nome: '', rodada: 1, turnoIndex: 0, emAndamento: false, combatentes: [],
}

export default function MapPage() {
  const { mesa, souJogador } = useMesa()
  if (souJogador && mesa) return <MapaDoJogador mesaId={mesa.id} />
  return <MapaDoMestre />
}

/** O mapa como o DM o publicou: sem tokens ocultos e sem ferramentas. */
function MapaDoJogador({ mesaId }: { mesaId: string }) {
  const remota = useEstadoMesa<MapScene>(mesaId, CHAVES_MESA.mapaPub)
  // A batalha vem da mesa, e não do `useBattle()`: aquele lê a batalha DESTE
  // aparelho, que no celular de um jogador é a dele — vazia — e nunca a que o
  // DM está conduzindo.
  const batalhaRemota = useEstadoMesa<Battle>(mesaId, CHAVES_MESA.batalhaPub)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const scene: MapScene | null = remota ? { ...cenaVazia(), ...remota } : null

  return (
    <div>
      <PageHeader icon="🗺️" titulo="Mapa" subtitulo="A cena que o seu DM está mostrando." />
      <SelosDaMesa />
      {remota === undefined ? (
        <div className="card p-10 text-center text-sm text-parchment-200/60">Carregando o mapa…</div>
      ) : !scene?.mapaUrl ? (
        <EmptyState
          icon="🗺️"
          titulo="Nenhum mapa na mesa"
          texto="Quando o DM colocar uma cena no ar, ela aparece aqui."
        />
      ) : (
        <Board
          scene={scene}
          update={() => {}}
          battle={batalhaRemota ?? null}
          visaoJogador
          ferramenta="mover"
          selecionado={selecionado}
          setSelecionado={setSelecionado}
        />
      )}
    </div>
  )
}

function MapaDoMestre() {
  const { scene, update, semEspaco } = useMapScene()
  const { battle, update: updateBatalha } = useBattle()
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
              { valor: 'jogadores', label: '👀 Prévia do grupo', labelCurto: '👀 Prévia' },
            ]}
          />
        }
      />

      <SelosDaMesa />

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
            battle={battle}
            onMoverCombatente={(id, x, y) =>
              updateBatalha({ combatentes: moverCombatente(battle?.combatentes ?? [], id, x, y) })
            }
            visaoJogador={visaoJogador}
            ferramenta={ferramenta}
            selecionado={selecionado}
            setSelecionado={setSelecionado}
          />
          {!visaoJogador && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Ferramentas scene={scene} update={update} ferramenta={ferramenta} setFerramenta={setFerramenta} />
              {selecionado && tokensDaCena(battle ?? vaziaParaSelecao, scene.tokens).some((t) => t.id === selecionado) ? (
                <TokenControles
                  token={tokensDaCena(battle ?? vaziaParaSelecao, scene.tokens).find((t) => t.id === selecionado)!}
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
/**
 * O tabuleiro desta tela.
 *
 * Board e TokenView moravam aqui e sabiam desenhar só os tokens da cena. Foram
 * para `components/tabuleiro.tsx` porque a tela de batalha precisa do mesmo
 * desenho — duas cópias divergiriam no primeiro ajuste.
 *
 * A lista mostrada junta as criaturas do combate com os objetos do cenário: é
 * a mesma cena, vista da outra porta.
 */
function Board({
  scene,
  update,
  battle,
  onMoverCombatente,
  visaoJogador,
  ferramenta,
  selecionado,
  setSelecionado,
}: {
  scene: MapScene
  update: UpdateFn
  /** A batalha em cena. Local para o DM; a projetada para quem joga. */
  battle: Battle | null
  onMoverCombatente?: (id: string, x: number, y: number) => void
  visaoJogador: boolean
  ferramenta: Ferramenta
  selecionado: string | null
  setSelecionado: (id: string | null) => void
}) {
  const vazia: Battle = {
    updatedAt: 0, nome: '', rodada: 1, turnoIndex: 0, emAndamento: false, combatentes: [],
  }
  const emCena = battle ?? vazia
  const tokens = tokensDaCena(emCena, scene.tokens)
  const daVez = emCena.emAndamento ? ordenar(emCena.combatentes)[emCena.turnoIndex]?.id : undefined

  const vidas: Record<string, VidaNoTabuleiro> = {}
  for (const c of emCena.combatentes) {
    vidas[c.id] = { atual: c.pvAtual, max: c.pvMax, fora: c.pvAtual <= 0 }
  }

  function mover(id: string, x: number, y: number) {
    if (emCena.combatentes.some((c) => c.id === id)) {
      onMoverCombatente?.(id, x, y)
      return
    }
    update({ tokens: scene.tokens.map((t) => (t.id === id ? { ...t, x, y } : t)) })
  }

  return (
    <Tabuleiro
      scene={scene}
      tokens={tokens}
      onMover={mover}
      visaoJogador={visaoJogador}
      ferramenta={ferramenta}
      selecionado={selecionado}
      setSelecionado={setSelecionado}
      vidas={vidas}
      atualId={daVez}
    />
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
/**
 * Colocar coisas na cena.
 *
 * Criatura vai para a BATALHA, não para a cena. Antes havia um botão
 * "Importar encontro atual" que copiava os combatentes para cá como tokens
 * novos — era exatamente o cadastro em dobro que fazia o PV de uma tela não
 * chegar na outra. Agora quem entra no combate já aparece aqui.
 *
 * Porta, baú e marcação continuam na cena: não entram na iniciativa.
 */
function AdicionarTokens({ scene, update }: { scene: MapScene; update: UpdateFn }) {
  const { campaign } = useCampaign()
  const { monstros } = useBestiary()
  const { battle, update: updateBatalha } = useBattle()

  let corIdx = scene.tokens.length
  const cor = () => CORES_TOKEN[corIdx++ % CORES_TOKEN.length]

  const combatentes = battle?.combatentes ?? []

  function porNaCena(novos: Combatant[]) {
    updateBatalha({ combatentes: [...combatentes, ...novos] })
  }

  const party = campaign?.party ?? []

  return (
    <section className="card p-4">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-parchment-200/70">
        Colocar na cena
      </h2>
      <p className="mb-3 text-xs text-parchment-200/50">
        Criaturas entram no combate e aparecem no mapa. Marcadores ficam só aqui.
      </p>

      <p className="mb-1 text-xs text-parchment-200/60">Grupo</p>
      {party.length === 0 ? (
        <p className="mb-3 text-xs text-parchment-200/40">Importe fichas no Painel do DM.</p>
      ) : (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {party.map((p) => (
            <button
              key={p.id}
              className="chip hover:border-emerald-400/60"
              onClick={() => porNaCena([combatenteDePersonagem(p, combatentes.length)])}
            >
              ＋ {p.nome || 'Aliado'}
            </button>
          ))}
        </div>
      )}

      <p className="mb-1 text-xs text-parchment-200/60">Inimigos (Bestiário)</p>
      {monstros.length === 0 ? (
        <p className="mb-3 text-xs text-parchment-200/40">Cadastre criaturas no Bestiário.</p>
      ) : (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {monstros.map((m) => (
            <button
              key={m.id}
              className="chip hover:border-dragon-400/60"
              onClick={() => porNaCena(combatentesDeMonstro(m, 1, combatentes.length))}
            >
              ＋ {m.nome || 'Inimigo'}
            </button>
          ))}
        </div>
      )}

      <button
        className="btn-ghost w-full py-1.5 text-xs"
        onClick={() => {
          const n = prompt('Nome do marcador (ex: Porta, Baú, Armadilha):')
          if (n) update({ tokens: [...scene.tokens, tokenObjeto(n, cor())] })
        }}
      >
        ＋ Marcador / objeto
      </button>
    </section>
  )
}
// ---------------------------------------------------------------------------
/**
 * Tudo que está na cena, num lugar só.
 *
 * Lista criaturas do combate e objetos do cenário juntos, porque é assim que
 * eles aparecem no mapa. O botão de olho esconde do grupo — e sabe em qual
 * dos dois lugares gravar.
 */
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
  const { battle, update: updateBatalha } = useBattle()
  const combatentes = battle?.combatentes ?? []
  const objetos = scene.tokens.filter((t) => t.origem === 'objeto')

  const tudo = [
    ...combatentes.map((c) => ({ token: tokenDeCombatente(c), naBatalha: true })),
    ...objetos.map((t) => ({ token: t, naBatalha: false })),
  ]
  if (tudo.length === 0) return null

  const icone = { aliado: '\ud83d\udee1\ufe0f', inimigo: '\ud83d\udc3e', objeto: '\ud83d\udccd' } as const

  function alternarOculto(id: string, naBatalha: boolean, oculto: boolean) {
    if (naBatalha) {
      updateBatalha({
        combatentes: combatentes.map((c) => (c.id === id ? { ...c, oculto: !oculto } : c)),
      })
      return
    }
    update({ tokens: scene.tokens.map((t) => (t.id === id ? { ...t, oculto: !oculto } : t)) })
  }

  return (
    <section className="card p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-parchment-200/70">
        Na cena ({tudo.length})
      </h2>
      <ul className="max-h-56 space-y-1 overflow-y-auto">
        {tudo.map(({ token: t, naBatalha }) => (
          <li key={t.id}>
            <div
              className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition ${
                selecionado === t.id ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => onSelecionar(t.id)}
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: t.cor }} />
                <span className={`truncate ${t.oculto ? 'text-parchment-200/40' : 'text-parchment-100'}`}>
                  {icone[t.origem]} {t.nome || 'Sem nome'}
                </span>
              </button>
              <button
                className="shrink-0 text-xs text-parchment-200/40 hover:text-parchment-100"
                title={t.oculto ? 'Fora de cena para o grupo' : 'Visível ao grupo'}
                onClick={() => alternarOculto(t.id, naBatalha, t.oculto)}
              >
                {t.oculto ? '🙈' : '👁'}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-parchment-200/40">
        Criaturas moram no combate; marcadores, na cena. O PV e o turno vêm da batalha.
      </p>
    </section>
  )
}

// ---------------------------------------------------------------------------
/**
 * Ajustes do que está selecionado.
 *
 * Grava na batalha quando for criatura e na cena quando for marcador — quem
 * usa não precisa saber a diferença.
 */
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
  const { battle, update: updateBatalha } = useBattle()
  const combatentes = battle?.combatentes ?? []
  const naBatalha = combatentes.some((c) => c.id === token.id)

  function patch(p: Partial<Token>) {
    if (naBatalha) {
      // Só o que existe nos dois lados. `origem` do token inclui 'objeto',
      // que um combatente nunca é — copiar tudo cegamente misturaria os dois
      // modelos.
      const { nome, tamanho, cor, oculto } = p
      updateBatalha({
        combatentes: combatentes.map((c) =>
          c.id === token.id
            ? {
                ...c,
                ...(nome !== undefined ? { nome } : {}),
                ...(tamanho !== undefined ? { tamanho } : {}),
                ...(cor !== undefined ? { cor } : {}),
                ...(oculto !== undefined ? { oculto } : {}),
              }
            : c,
        ),
      })
      return
    }
    update({ tokens: scene.tokens.map((t) => (t.id === token.id ? { ...t, ...p } : t)) })
  }

  function remover() {
    if (naBatalha) {
      if (!confirm(`Tirar "${token.nome}" do combate?`)) return
      updateBatalha({ combatentes: combatentes.filter((c) => c.id !== token.id) })
    } else {
      update({ tokens: scene.tokens.filter((t) => t.id !== token.id) })
    }
    onDeselect()
  }

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-parchment-200/70">
          {naBatalha ? 'Criatura' : 'Marcador'}
        </h2>
        <button className="text-xs text-parchment-200/50 hover:text-parchment-100" onClick={onDeselect}>
          fechar
        </button>
      </div>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-parchment-200/70">Nome</span>
        <input className="stat-input py-1.5" value={token.nome} onChange={(e) => patch({ nome: e.target.value })} />
      </label>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-parchment-200/70">Tamanho: {token.tamanho} quadrado(s)</span>
        <input
          type="range"
          min={1}
          max={4}
          value={token.tamanho}
          onChange={(e) => patch({ tamanho: parseInt(e.target.value, 10) })}
          className="w-full accent-dragon-500"
        />
      </label>

      <div className="mb-3">
        <span className="mb-1 block text-sm text-parchment-200/70">Cor</span>
        <div className="flex flex-wrap gap-1.5">
          {CORES_TOKEN.map((c) => (
            <button
              key={c}
              onClick={() => patch({ cor: c })}
              className="h-6 w-6 rounded-full ring-2 ring-white/10 transition hover:ring-white/40"
              style={{ background: c, outline: token.cor === c ? '2px solid #fff' : undefined, outlineOffset: 2 }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
      </div>

      <label className="mb-3 flex items-center gap-2 text-sm text-parchment-200/80">
        <input
          type="checkbox"
          checked={token.oculto}
          onChange={(e) => patch({ oculto: e.target.checked })}
          className="accent-dragon-500"
        />
        Fora de cena para o grupo
      </label>

      {naBatalha && (
        <p className="mb-3 text-[11px] leading-relaxed text-parchment-200/40">
          PV, condições e iniciativa ficam na aba Batalhas — é a mesma criatura.
        </p>
      )}

      <button className="btn-ghost w-full py-1.5 text-xs text-dragon-300" onClick={remover}>
        {naBatalha ? 'Tirar do combate' : 'Remover marcador'}
      </button>
    </section>
  )
}
