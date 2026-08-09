// A preparação da cena, dentro da tela de batalha.
//
// Isto morava numa aba separada, "Mapa", e essa separação nunca fez sentido: o
// mapa é onde a luta acontece, e ter os dois em abas diferentes obrigava a
// trocar de tela a cada golpe. Agora é uma coisa só, e o que aqui existe é o
// que é PREPARO — subir a imagem, acertar a grade, pôr marcadores —, recolhido
// para não competir com o combate.

import { useRef, useState } from 'react'
import type { Battle, MapScene, Token } from '../types'
import { CORES_TOKEN, cenaVazia, tokenObjeto } from '../lib/mapscene'
import { tokensDaCena } from '../lib/battle'
import { imageToDataUrl } from '../lib/bestiary'
import { MAPAS_PRONTOS, urlDoMapaPronto } from '../data/mapas-prontos'
import type { Ferramenta } from './tabuleiro'

type UpdateCena = (patch: Partial<MapScene>) => void

/**
 * A tela vazia, com os mapas que já vêm no app.
 *
 * Subir uma imagem antes de cada luta é atrito no pior momento: a mesa está
 * esperando. E para quem abre o app pela primeira vez é pior — a tela pedia um
 * arquivo que a pessoa não tem.
 */
export function SemCena({ update }: { update: UpdateCena }) {
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
    <div className="card p-5 text-center">
      <p className="text-3xl">🗺️</p>
      <h3 className="mt-1 text-lg text-parchment-50">Escolha o campo de batalha</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-parchment-200/60">
        Comece com um destes e troque depois, ou suba a imagem da sua masmorra.
      </p>

      <div className="mx-auto mt-4 grid max-w-2xl grid-cols-3 gap-2 sm:grid-cols-6">
        {MAPAS_PRONTOS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => update({ mapaUrl: urlDoMapaPronto(m.id) })}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-2 transition hover:border-arcane-400/60 hover:bg-white/[0.07]"
          >
            <span className="block text-xl">{m.icone}</span>
            <span className="mt-0.5 block text-[11px] text-parchment-200/70">{m.nome}</span>
          </button>
        ))}
      </div>

      <button
        className="btn-ghost mt-4 text-sm"
        onClick={() => ref.current?.click()}
        disabled={carregando}
      >
        {carregando ? 'Processando…' : '📷 Ou suba a sua imagem'}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

/**
 * Os ajustes da cena. Recolhido, porque é preparo e não combate.
 *
 * Ferramenta de mover/medir fica fora daqui, no cabeçalho do mapa: essas duas
 * são usadas durante a luta.
 */
export function PainelDaCena({
  scene,
  update,
}: {
  scene: MapScene
  update: UpdateCena
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
    <details className="card p-3">
      <summary className="cursor-pointer text-sm font-semibold text-parchment-100">
        ⚙️ Cena — mapa, grade e marcadores
      </summary>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="panel-title mb-2">Grade</p>

          <label className="mb-2 flex cursor-pointer items-center justify-between text-sm">
            <span className="text-parchment-100">Mostrar</span>
            <input
              type="checkbox"
              checked={scene.mostrarGrade}
              onChange={(e) => update({ mostrarGrade: e.target.checked })}
              className="h-4 w-4 accent-dragon-500"
            />
          </label>

          <label className="mb-3 flex cursor-pointer items-center justify-between text-sm">
            <span className="text-parchment-100" title="Tokens grudam no centro dos quadrados">
              Encaixar
            </span>
            <input
              type="checkbox"
              checked={scene.encaixarGrade}
              onChange={(e) => update({ encaixarGrade: e.target.checked })}
              className="h-4 w-4 accent-dragon-500"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-parchment-200/70">Quadrado: {scene.celPx}px</span>
            <input
              type="range"
              min={24}
              max={100}
              value={scene.celPx}
              onChange={(e) => update({ celPx: parseInt(e.target.value, 10) })}
              className="w-full accent-dragon-500"
            />
          </label>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <label className="block">
              <span className="mb-1 block text-parchment-200/60">Ajuste X</span>
              <input
                type="range"
                min={0}
                max={scene.celPx}
                value={scene.offsetX}
                onChange={(e) => update({ offsetX: parseInt(e.target.value, 10) })}
                className="w-full accent-arcane-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-parchment-200/60">Ajuste Y</span>
              <input
                type="range"
                min={0}
                max={scene.celPx}
                value={scene.offsetY}
                onChange={(e) => update({ offsetY: parseInt(e.target.value, 10) })}
                className="w-full accent-arcane-500"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="panel-title mb-2">Mapa</p>

          <label className="mb-3 block text-sm">
            <span className="mb-1 block text-parchment-200/70">
              Zoom: {Math.round((scene.zoom ?? 1) * 100)}%
            </span>
            <input
              type="range"
              min={50}
              max={250}
              step={10}
              value={(scene.zoom ?? 1) * 100}
              onChange={(e) => update({ zoom: parseInt(e.target.value, 10) / 100 })}
              className="w-full accent-arcane-500"
            />
          </label>

          <div className="mb-2 flex flex-wrap gap-1.5">
            {MAPAS_PRONTOS.map((m) => (
              <button
                key={m.id}
                type="button"
                className="chip text-xs hover:border-arcane-400/60"
                onClick={() => update({ mapaUrl: urlDoMapaPronto(m.id) })}
                title={m.nome}
              >
                {m.icone}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button className="btn-ghost flex-1 py-1.5 text-xs" onClick={() => mapRef.current?.click()}>
              🖼️ Subir imagem
            </button>
            <button
              className="btn-ghost py-1.5 text-xs text-parchment-200/50"
              onClick={() => {
                if (confirm('Limpar o mapa e os marcadores? As criaturas do combate ficam.')) {
                  update(cenaVazia())
                }
              }}
            >
              Limpar
            </button>
          </div>
          <input
            ref={mapRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) trocarMapa(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>
    </details>
  )
}

/**
 * O que está na cena, e o ajuste do que estiver selecionado.
 *
 * Lista criaturas do combate e marcadores do cenário juntos, porque é assim
 * que aparecem no mapa — e cada botão sabe em qual dos dois lugares gravar.
 */
export function CoisasNaCena({
  scene,
  update,
  battle,
  updateBatalha,
  selecionado,
  setSelecionado,
}: {
  scene: MapScene
  update: UpdateCena
  battle: Battle
  updateBatalha: (patch: Partial<Battle>) => void
  selecionado: string | null
  setSelecionado: (id: string | null) => void
}) {
  const combatentes = battle.combatentes
  const objetos = scene.tokens.filter((t) => t.origem === 'objeto')
  const tudo = tokensDaCena(battle, scene.tokens)
  const alvo = tudo.find((t) => t.id === selecionado)
  const icone = { aliado: '🛡️', inimigo: '🐾', objeto: '📍' } as const

  const naBatalha = (id: string) => combatentes.some((c) => c.id === id)

  function patch(id: string, p: Partial<Token>) {
    if (naBatalha(id)) {
      // Só o que existe nos dois lados: `origem` do token inclui 'objeto', que
      // um combatente nunca é — copiar tudo misturaria os dois modelos.
      const { nome, tamanho, cor, oculto } = p
      updateBatalha({
        combatentes: combatentes.map((c) =>
          c.id === id
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
    update({ tokens: scene.tokens.map((t) => (t.id === id ? { ...t, ...p } : t)) })
  }

  function remover(id: string) {
    if (naBatalha(id)) {
      updateBatalha({ combatentes: combatentes.filter((c) => c.id !== id) })
    } else {
      update({ tokens: scene.tokens.filter((t) => t.id !== id) })
    }
    setSelecionado(null)
  }

  return (
    <div className="card p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="panel-title">Na cena ({tudo.length})</p>
        <button
          className="btn-ghost py-0.5 text-xs"
          onClick={() => {
            const n = prompt('Nome do marcador (ex: Porta, Baú, Armadilha):')
            if (n) {
              update({
                tokens: [...scene.tokens, tokenObjeto(n, CORES_TOKEN[objetos.length % CORES_TOKEN.length])],
              })
            }
          }}
        >
          ＋ marcador
        </button>
      </div>

      {tudo.length === 0 ? (
        <p className="text-xs text-parchment-200/40">
          Ponha criaturas no combate ou um marcador aqui.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {tudo.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelecionado(selecionado === t.id ? null : t.id)}
                className={`chip text-xs ${selecionado === t.id ? 'border-arcane-400/70' : ''} ${
                  t.oculto ? 'opacity-45' : ''
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: t.cor }} />
                {icone[t.origem]} {t.nome || 'Sem nome'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {alvo && (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-parchment-200/50">
              {naBatalha(alvo.id) ? 'Criatura' : 'Marcador'}
            </span>
            <button
              className="text-xs text-parchment-200/50 hover:text-parchment-100"
              onClick={() => setSelecionado(null)}
            >
              fechar
            </button>
          </div>

          <input
            className="stat-input mb-2 py-1.5"
            value={alvo.nome}
            onChange={(e) => patch(alvo.id, { nome: e.target.value })}
          />

          <label className="mb-2 block text-xs">
            <span className="mb-1 block text-parchment-200/70">
              Tamanho: {alvo.tamanho} quadrado(s)
            </span>
            <input
              type="range"
              min={1}
              max={4}
              value={alvo.tamanho}
              onChange={(e) => patch(alvo.id, { tamanho: parseInt(e.target.value, 10) })}
              className="w-full accent-dragon-500"
            />
          </label>

          <div className="mb-2 flex flex-wrap gap-1.5">
            {CORES_TOKEN.map((c) => (
              <button
                key={c}
                onClick={() => patch(alvo.id, { cor: c })}
                className="h-5 w-5 rounded-full ring-2 ring-white/10 transition hover:ring-white/40"
                style={{
                  background: c,
                  outline: alvo.cor === c ? '2px solid #fff' : undefined,
                  outlineOffset: 2,
                }}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>

          <label className="mb-2 flex items-center gap-2 text-xs text-parchment-200/80">
            <input
              type="checkbox"
              checked={alvo.oculto}
              onChange={(e) => patch(alvo.id, { oculto: e.target.checked })}
              className="accent-dragon-500"
            />
            Fora de cena para o grupo
          </label>

          <button
            className="btn-ghost w-full py-1 text-xs text-dragon-300"
            onClick={() => remover(alvo.id)}
          >
            {naBatalha(alvo.id) ? 'Tirar do combate' : 'Remover marcador'}
          </button>
        </div>
      )}
    </div>
  )
}

/** Só para o seletor de mover/medir viver junto do mapa. */
export function FerramentasDoMapa({
  ferramenta,
  setFerramenta,
}: {
  ferramenta: Ferramenta
  setFerramenta: (f: Ferramenta) => void
}) {
  return (
    <div className="flex gap-1.5">
      {([
        ['mover', '✋ Mover'],
        ['medir', '📏 Medir'],
        // "A Bola de Fogo pega quem?" era o dedo sobre o mapa e uma discussão.
        ['area', '🔥 Área'],
      ] as const).map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => setFerramenta(v)}
          className={`chip text-xs ${ferramenta === v ? 'border-arcane-400/70 text-parchment-50' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
