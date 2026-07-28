import { useEffect, useRef, useState } from 'react'
import type { MapaMundo, Mundo, PontoInteresse } from '../types'
import { useMundo } from '../hooks/useMundo'
import { useEstadoMesa, useMesa } from '../hooks/useSync'
import { CHAVES_MESA, chaveImagemMapa } from '../lib/sync/config'
import { lerEstado } from '../lib/sync/estado'
import { SelosDaMesa } from '../components/mesa-ui'
import {
  ESCOPOS,
  apagarImagem,
  lerImagem,
  mundoVazio,
  novoMapa,
  novoPonto,
  salvarImagem,
  tipoPontoInfo,
  TIPOS_PONTO,
} from '../lib/mundo'
import { imageToDataUrl } from '../lib/bestiary'
import { EmptyState, Modal } from '../components/layout-ui'
import { Field, SectionCard, SelectField, TextArea, TextField } from '../components/ui'

export default function WorldPage() {
  const { mesa, souJogador } = useMesa()
  if (souJogador && mesa) return <MundoDoJogador mesaId={mesa.id} />
  return <MundoDoMestre />
}

// ---------------------------------------------------------------------------
// Painel do DM
// ---------------------------------------------------------------------------
function MundoDoMestre() {
  const { mundo, update } = useMundo()
  const [marcando, setMarcando] = useState(false)
  const [editando, setEditando] = useState<PontoInteresse | null>(null)
  const [imagem, setImagem] = useState('')
  const [erro, setErro] = useState('')
  const arquivoRef = useRef<HTMLInputElement>(null)
  const { mesa, souDm } = useMesa()
  const mesaIdDm = mesa && souDm ? mesa.id : null

  const mapa = mundo?.mapas.find((m) => m.id === mundo.mapaAtivoId) ?? null

  // A imagem não vive no objeto do mundo — é lida à parte, por mapa. Se este
  // aparelho não a tem (o mapa foi criado noutro), busca a cópia da nuvem e
  // guarda aqui: sem isto o mapa sincronizava e aparecia vazio.
  useEffect(() => {
    if (!mapa) {
      setImagem('')
      return
    }
    const local = lerImagem(mapa.id)
    setImagem(local)
    if (local || !mesaIdDm) return
    let vivo = true
    void lerEstado(mesaIdDm, chaveImagemMapa(mapa.id)).then((r) => {
      const url = (r as { dataUrl?: string } | null)?.dataUrl
      if (!vivo || !url) return
      salvarImagem(mapa.id, url)
      setImagem(url)
    })
    return () => {
      vivo = false
    }
  }, [mapa?.id, mapa?.atualizadoEm, mesaIdDm])

  if (!mundo) return null

  function mudarMapa(patch: Partial<MapaMundo>) {
    if (!mapa) return
    update({
      mapas: mundo!.mapas.map((m) =>
        m.id === mapa.id ? { ...m, ...patch, atualizadoEm: Date.now() } : m,
      ),
    })
  }

  function criarMapa() {
    const m = novoMapa('Novo mapa')
    update({ mapas: [...mundo!.mapas, m], mapaAtivoId: m.id })
  }

  function removerMapa(id: string) {
    apagarImagem(id)
    const restantes = mundo!.mapas.filter((m) => m.id !== id)
    update({
      mapas: restantes,
      mapaAtivoId: mundo!.mapaAtivoId === id ? (restantes[0]?.id ?? '') : mundo!.mapaAtivoId,
    })
  }

  async function subirImagem(file: File) {
    if (!mapa) return
    setErro('')
    try {
      // 1600px: um mapa de região precisa ser legível. O padrão de 480 do
      // bestiário serve para retrato de token, não para ler nome de cidade.
      const dataUrl = await imageToDataUrl(file, 1600, 0.82)
      salvarImagem(mapa.id, dataUrl)
      setImagem(dataUrl)
      mudarMapa({}) // carimba atualizadoEm: é o sinal para republicar a imagem
    } catch {
      setErro('Não consegui ler essa imagem. Tente um PNG ou JPG.')
    }
  }

  return (
    <div>
      <header className="mb-4 flex items-center gap-3">
        <span className="text-3xl">🗺️</span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-parchment-50 sm:text-3xl">Mundo</h1>
          <p className="mt-1 text-xs text-parchment-200/60 sm:text-sm">
            Mapas de campanha, região e cidade — revelados conforme o grupo descobre.
          </p>
        </div>
      </header>

      <SelosDaMesa />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mundo.mapas.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => update({ mapaAtivoId: m.id })}
            className={`chip ${
              m.id === mundo.mapaAtivoId ? 'border-arcane-400/60 text-parchment-50' : ''
            }`}
          >
            {m.revelado ? '👁️' : '🙈'} {m.nome || 'Sem nome'}
          </button>
        ))}
        <button type="button" className="btn-ghost" onClick={criarMapa}>
          ＋ Novo mapa
        </button>
      </div>

      {!mapa ? (
        <EmptyState
          icon="🗺️"
          titulo="Nenhum mapa ainda"
          texto="Suba o mapa da sua campanha, marque os lugares e revele conforme o grupo chega neles."
          acao={
            <button type="button" className="btn-primary" onClick={criarMapa}>
              Criar o primeiro mapa
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          <SectionCard
            title="⚙️ Este mapa"
            action={
              <button
                type="button"
                className="btn-ghost"
                onClick={() => removerMapa(mapa.id)}
                title="Apagar este mapa"
              >
                Apagar
              </button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Nome">
                <TextField
                  value={mapa.nome}
                  onChange={(nome) => mudarMapa({ nome })}
                  placeholder="As Planícies Partidas"
                />
              </Field>
              <Field label="Escala">
                <SelectField
                  value={mapa.escopo}
                  onChange={(escopo) => mudarMapa({ escopo: escopo as MapaMundo['escopo'] })}
                  options={ESCOPOS.map((e) => ({ value: e.valor, label: e.label }))}
                />
              </Field>
              <Field label="Visível para o grupo">
                <button
                  type="button"
                  className={mapa.revelado ? 'btn-primary w-full' : 'btn-ghost w-full'}
                  onClick={() => mudarMapa({ revelado: !mapa.revelado })}
                >
                  {mapa.revelado ? '👁️ Revelado' : '🙈 Só você vê'}
                </button>
              </Field>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                ref={arquivoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void subirImagem(f)
                  e.target.value = ''
                }}
              />
              <button type="button" className="btn-ghost" onClick={() => arquivoRef.current?.click()}>
                {imagem ? '🖼️ Trocar imagem' : '🖼️ Subir imagem do mapa'}
              </button>
              {imagem && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setMarcando((v) => !v)}
                  title="Depois clique no mapa para marcar"
                >
                  {marcando ? '✓ Clique no mapa…' : '📍 Marcar ponto'}
                </button>
              )}
            </div>
            {erro && <p className="mt-2 text-sm text-dragon-400">{erro}</p>}
            <p className="mt-2 text-xs text-parchment-200/60">
              A imagem sobe uma vez e fica guardada. Revelar um ponto depois custa alguns bytes —
              o mapa não é reenviado.
            </p>
          </SectionCard>

          {imagem ? (
            <Tabuleiro
              imagem={imagem}
              pontos={mapa.pontos}
              marcando={marcando}
              onMarcar={(x, y) => {
                const p = novoPonto(x, y)
                mudarMapa({ pontos: [...mapa.pontos, p] })
                setMarcando(false)
                setEditando(p)
              }}
              onMover={(id, x, y) =>
                mudarMapa({ pontos: mapa.pontos.map((p) => (p.id === id ? { ...p, x, y } : p)) })
              }
              onAbrir={(p) => setEditando(p)}
            />
          ) : (
            <EmptyState
              icon="🖼️"
              titulo="Este mapa ainda não tem imagem"
              texto="Suba a imagem para poder marcar os lugares."
            />
          )}

          <SectionCard title={`📍 Lugares (${mapa.pontos.length})`}>
            {mapa.pontos.length === 0 ? (
              <p className="text-sm text-parchment-200/60">
                Nenhum ponto ainda. Use <b>Marcar ponto</b> e clique no mapa.
              </p>
            ) : (
              <ul className="space-y-1">
                {mapa.pontos.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex-1 truncate text-left text-parchment-50 hover:text-arcane-400"
                      onClick={() => setEditando(p)}
                    >
                      {tipoPontoInfo(p.tipo).icone} {p.nome || 'Sem nome'}
                    </button>
                    <button
                      type="button"
                      className="chip shrink-0"
                      onClick={() =>
                        mudarMapa({
                          pontos: mapa.pontos.map((x) =>
                            x.id === p.id ? { ...x, revelado: !x.revelado } : x,
                          ),
                        })
                      }
                    >
                      {p.revelado ? '👁️ revelado' : '🙈 oculto'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {editando && mapa && (
        <EditorDePonto
          ponto={editando}
          onFechar={() => setEditando(null)}
          onSalvar={(p) => {
            mudarMapa({ pontos: mapa.pontos.map((x) => (x.id === p.id ? p : x)) })
            setEditando(null)
          }}
          onRemover={(id) => {
            mudarMapa({ pontos: mapa.pontos.filter((x) => x.id !== id) })
            setEditando(null)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// O mapa em si
// ---------------------------------------------------------------------------
function Tabuleiro({
  imagem,
  pontos,
  marcando = false,
  onMarcar,
  onMover,
  onAbrir,
  soLeitura = false,
}: {
  imagem: string
  pontos: PontoInteresse[]
  marcando?: boolean
  onMarcar?: (x: number, y: number) => void
  onMover?: (id: string, x: number, y: number) => void
  onAbrir?: (p: PontoInteresse) => void
  soLeitura?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [arrastando, setArrastando] = useState<string | null>(null)

  // Mesma convenção do mapa tático: fração 0..1, então o ponto fica no lugar
  // certo do celular ao monitor.
  function fracDoEvento(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    }
  }

  return (
    <div className="card overflow-auto p-2">
      <div
        ref={ref}
        className={`relative mx-auto select-none ${marcando ? 'cursor-crosshair' : ''}`}
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          if (!marcando || !onMarcar) return
          const p = fracDoEvento(e)
          onMarcar(p.x, p.y)
        }}
        onPointerMove={(e) => {
          if (!arrastando || !onMover) return
          const p = fracDoEvento(e)
          onMover(arrastando, p.x, p.y)
        }}
        onPointerUp={() => setArrastando(null)}
        onPointerLeave={() => setArrastando(null)}
      >
        <img
          src={imagem}
          alt="Mapa"
          className="pointer-events-none block w-full rounded-lg"
          draggable={false}
        />
        {pontos.map((p) => (
          <button
            key={p.id}
            type="button"
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/25 bg-ink-900/85 px-2 py-1 text-xs text-parchment-50 shadow hover:border-arcane-400"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            onPointerDown={(e) => {
              if (soLeitura) return
              e.stopPropagation()
              setArrastando(p.id)
            }}
            onClick={(e) => {
              e.stopPropagation()
              onAbrir?.(p)
            }}
            title={p.nome}
          >
            {tipoPontoInfo(p.tipo).icone} {p.nome || '—'}
            {!soLeitura && !p.revelado && ' 🙈'}
          </button>
        ))}
      </div>
    </div>
  )
}

function EditorDePonto({
  ponto,
  onSalvar,
  onRemover,
  onFechar,
}: {
  ponto: PontoInteresse
  onSalvar: (p: PontoInteresse) => void
  onRemover: (id: string) => void
  onFechar: () => void
}) {
  const [p, setP] = useState(ponto)
  useEffect(() => setP(ponto), [ponto])

  return (
    <Modal titulo="Ponto de interesse" onClose={onFechar}>
      <div className="space-y-3">
        <Field label="Nome">
          <TextField value={p.nome} onChange={(nome) => setP({ ...p, nome })} placeholder="Stonehall Keep" />
        </Field>
        <Field label="Tipo">
          <SelectField
            value={p.tipo}
            onChange={(tipo) => setP({ ...p, tipo: tipo as PontoInteresse['tipo'] })}
            options={TIPOS_PONTO.map((t) => ({ value: t.valor, label: `${t.icone} ${t.label}` }))}
          />
        </Field>
        <Field label="Descrição" hint="É isto que o grupo lê quando o ponto está revelado.">
          <TextArea
            value={p.descricao}
            onChange={(descricao) => setP({ ...p, descricao })}
            rows={3}
            placeholder="Muralhas altas e um portão que não abre desde o inverno."
          />
        </Field>
        <Field label="Suas anotações" hint="🙈 Nunca sai daqui — nem quando o ponto é revelado.">
          <TextArea
            value={p.notasSecretas}
            onChange={(notasSecretas) => setP({ ...p, notasSecretas })}
            rows={2}
            placeholder="O capitão está sendo chantageado."
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-parchment-200/80">
          <input
            type="checkbox"
            checked={p.revelado}
            onChange={(e) => setP({ ...p, revelado: e.target.checked })}
          />
          👁️ O grupo já descobriu este lugar
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="button" className="btn-primary" onClick={() => onSalvar(p)}>
            Salvar
          </button>
          <button type="button" className="btn-ghost" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-ghost ml-auto text-dragon-400"
            onClick={() => onRemover(p.id)}
          >
            Remover ponto
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Visão de quem joga — só leitura, e só o que foi revelado
// ---------------------------------------------------------------------------
function MundoDoJogador({ mesaId }: { mesaId: string }) {
  const remoto = useEstadoMesa<Mundo>(mesaId, CHAVES_MESA.mundoPub)
  const mundo = remoto ? { ...mundoVazio(), ...remoto } : null
  const [aberto, setAberto] = useState<string>('')
  const [lendo, setLendo] = useState<PontoInteresse | null>(null)

  const mapa =
    mundo?.mapas.find((m) => m.id === (aberto || mundo.mapaAtivoId)) ?? mundo?.mapas[0] ?? null

  // A imagem vem de uma chave própria — por isso ela não pesa nas atualizações
  // de ponto, que chegam o tempo todo.
  const img = useEstadoMesa<{ dataUrl: string }>(
    mesaId,
    mapa ? chaveImagemMapa(mapa.id, true) : CHAVES_MESA.mundoPub,
  )

  return (
    <div>
      <header className="mb-4 flex items-center gap-3">
        <span className="text-3xl">🗺️</span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-parchment-50 sm:text-3xl">Mundo</h1>
          <p className="mt-1 text-xs text-parchment-200/60 sm:text-sm">
            O que o grupo já conhece do mundo.
          </p>
        </div>
      </header>

      <SelosDaMesa />

      {remoto === undefined ? (
        <div className="card p-10 text-center text-sm text-parchment-200/60">Carregando os mapas…</div>
      ) : !mapa ? (
        <EmptyState
          icon="🗺️"
          titulo="Nenhum mapa revelado ainda"
          texto="Assim que o seu DM abrir um mapa para o grupo, ele aparece aqui."
        />
      ) : (
        <div className="space-y-4">
          {mundo!.mapas.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {mundo!.mapas.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAberto(m.id)}
                  className={`chip ${m.id === mapa.id ? 'border-arcane-400/60 text-parchment-50' : ''}`}
                >
                  {m.nome || 'Sem nome'}
                </button>
              ))}
            </div>
          )}

          {img?.dataUrl ? (
            <Tabuleiro imagem={img.dataUrl} pontos={mapa.pontos} soLeitura onAbrir={(p) => setLendo(p)} />
          ) : (
            <div className="card p-10 text-center text-sm text-parchment-200/60">
              Carregando a imagem do mapa…
            </div>
          )}

          <SectionCard title="📍 Lugares conhecidos">
            {mapa.pontos.length === 0 ? (
              <p className="text-sm text-parchment-200/60">Nada marcado neste mapa ainda.</p>
            ) : (
              <ul className="space-y-1">
                {mapa.pontos.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="text-left text-parchment-50 hover:text-arcane-400"
                      onClick={() => setLendo(p)}
                    >
                      {tipoPontoInfo(p.tipo).icone} {p.nome || 'Sem nome'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {lendo && (
        <Modal titulo={`${tipoPontoInfo(lendo.tipo).icone} ${lendo.nome || 'Lugar'}`} onClose={() => setLendo(null)}>
          <p className="whitespace-pre-wrap text-parchment-100">
            {lendo.descricao || 'O grupo ainda não sabe muito sobre este lugar.'}
          </p>
        </Modal>
      )}
    </div>
  )
}
