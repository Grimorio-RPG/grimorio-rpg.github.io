import { useEffect, useMemo, useRef, useState } from 'react'
import type { KnowledgeLevel, Monster, MonsterAction } from '../types'
import { useBestiary } from '../hooks/useBestiary'
import {
  CATEGORIAS_MONSTRO,
  NDS,
  NIVEIS_CONHECIMENTO,
  TAMANHOS,
  TIPOS,
  apenasPrimeirasFases,
  categoriaInfo,
  fasesDoChefe,
  imageToDataUrl,
  rotuloFase,
  nivelInfo,
  novoMonstro,
} from '../lib/bestiary'
import { uid } from '../lib/character'
import { lerStatBlock } from '../lib/statblock'
import { abilityMod, fmtMod } from '../lib/calc'
import { ABILITIES } from '../data/rules'
import {
  Field,
  NumberField,
  SelectField,
  TextArea,
  TextField,
} from '../components/ui'
import { EmptyState, PageHeader, Toolbar, ViewToggle } from '../components/layout-ui'
import { useEstadoMesa, useMesa } from '../hooks/useSync'
import { CHAVES_MESA } from '../lib/sync/config'
import { SelosDaMesa } from '../components/mesa-ui'
import {
  BarraDeFiltros,
  FILTROS_VAZIOS,
  filtrarMonstros,
  type FiltrosBestiario,
} from '../components/bestiario-filtros'

type Modo = 'dm' | 'jogadores'

export default function BestiaryPage() {
  const { mesa, souJogador } = useMesa()
  // Jogador da mesa vê o bestiário publicado pelo DM — sem alternador de visão.
  if (souJogador && mesa) return <BestiarioDoJogador mesaId={mesa.id} />
  return <BestiarioDoMestre />
}

/** Bestiário publicado pelo DM, só leitura. */
function BestiarioDoJogador({ mesaId }: { mesaId: string }) {
  const remoto = useEstadoMesa<Monster[]>(mesaId, CHAVES_MESA.bestiarioPub)
  const [filtros, setFiltros] = useState<FiltrosBestiario>(FILTROS_VAZIOS)
  const [ampliada, setAmpliada] = useState('')

  const lista = Array.isArray(remoto) ? remoto : []
  const filtrados = filtrarMonstros(lista, filtros)

  return (
    <div>
      <PageHeader
        icon="🐲"
        titulo="Bestiário"
        subtitulo="As criaturas que o grupo já encontrou ou estudou."
      />
      <SelosDaMesa />
      {remoto === undefined ? (
        <div className="card p-10 text-center text-sm text-parchment-200/60">Carregando…</div>
      ) : (
        <>
          <BarraDeFiltros
            lista={lista}
            filtros={filtros}
            onChange={setFiltros}
            mostrarConhecimento={false}
          />
          {filtrados.length === 0 ? (
            <EmptyState
              icon="🔍"
              titulo="Nada descoberto ainda"
              texto="Conforme vocês encontrarem criaturas, o DM as libera aqui."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((m) => (
                <PlayerMonsterCard key={m.id} m={m} setAmpliada={setAmpliada} />
              ))}
            </div>
          )}
        </>
      )}
      {ampliada && <Lightbox url={ampliada} onClose={() => setAmpliada('')} />}
    </div>
  )
}

function BestiarioDoMestre() {
  const { monstros, salvar, remover } = useBestiary()
  const [modo, setModo] = useState<Modo>('dm')
  const [filtros, setFiltros] = useState<FiltrosBestiario>(FILTROS_VAZIOS)
  const [editando, setEditando] = useState<Monster | null>(null)
  const [ampliada, setAmpliada] = useState('')
  const [avisoFase, setAvisoFase] = useState('')
  // A criatura original só vira "fase 1" quando a fase nova for confirmada.
  const [baseParaCarimbar, setBaseParaCarimbar] = useState<Monster | null>(null)

  // As fases seguintes vivem dentro do cartão da primeira — a lista mostrava
  // três Belaks soltos e nenhuma relação entre eles.
  const filtrados = useMemo(
    () => apenasPrimeirasFases(filtrarMonstros(monstros, filtros)),
    [monstros, filtros],
  )

  const conhecidos = useMemo(
    () => filtrarMonstros(monstros.filter((m) => m.conhecimento !== 'desconhecido'), filtros),
    [monstros, filtros],
  )

  /**
   * Cria a próxima fase de um chefe.
   *
   * Parte de uma cópia porque a fase seguinte quase sempre herda tipo, tamanho
   * e boa parte das ações — reescrever tudo do zero seria pior. Nasce oculta:
   * a virada só funciona como surpresa.
   */
  function criarFase(base: Monster) {
    const grupo = base.chefeId ?? uid()
    const existentes = fasesDoChefe(monstros, grupo)
    const numero = existentes.length > 0 ? (existentes[existentes.length - 1].fase ?? 1) + 1 : 2

    const nova: Monster = {
      ...base,
      id: uid(),
      chefeId: grupo,
      fase: numero,
      nome: `${base.nome} — Fase ${numero}`,
      conhecimento: 'desconhecido',
      derrotado: false,
      updatedAt: Date.now(),
    }
    // Nada é gravado aqui. A fase só passa a existir quando você confirmar no
    // editor — antes, criá-la e fechar clicando fora já deixava a criatura
    // salva, e não havia como saber disso.
    //
    // O carimbo de fase 1 na criatura original fica pendente pelo mesmo motivo:
    // desistir não pode transformar um monstro comum em chefe em fases.
    setBaseParaCarimbar(base.chefeId ? null : { ...base, chefeId: grupo, fase: 1 })
    setAvisoFase(
      `Esta é uma cópia de "${base.nome}". Ajuste o que mudar na ${rotuloFase(nova)} e confirme lá embaixo — nada é salvo antes disso.`,
    )
    setEditando(nova)
  }

  /**
   * Apaga uma fase.
   *
   * Se sobrar só a forma inicial, ela deixa de ser um chefe em fases — carregar
   * um grupo de um membro só faria a tela mostrar abas para nada.
   */
  function apagarFase(f: Monster) {
    if (!confirm(`Apagar "${f.nome || rotuloFase(f)}"? Isso não pode ser desfeito.`)) return
    remover(f.id)
    const restantes = fasesDoChefe(monstros, f.chefeId).filter((x) => x.id !== f.id)
    if (restantes.length === 1) salvar({ ...restantes[0], chefeId: undefined, fase: undefined })
  }

  /**
   * Vincula uma criatura que já existe como fase seguinte de um chefe.
   *
   * Sem isto, quem já tinha as duas formas cadastradas — o caso comum, porque a
   * pessoa cria o chefe e a forma desperta antes de saber que o app relaciona
   * as duas — precisaria recadastrar uma delas do zero.
   *
   * Ela vira oculta ao ser vinculada: é fase seguinte, e fase seguinte é
   * surpresa. Se o grupo já a conhecia, o DM reverte na própria ficha.
   */
  function vincularFase(base: Monster, outroId: string) {
    const outro = monstros.find((x) => x.id === outroId)
    if (!outro) return
    const grupo = base.chefeId ?? uid()
    const existentes = fasesDoChefe(monstros, grupo)
    const numero = existentes.length > 0 ? (existentes[existentes.length - 1].fase ?? 1) + 1 : 2

    if (!base.chefeId) salvar({ ...base, chefeId: grupo, fase: 1 })
    salvar({ ...outro, chefeId: grupo, fase: numero, conhecimento: 'desconhecido' })
  }

  function duplicar(m: Monster) {
    salvar({ ...m, id: uid(), nome: `${m.nome} (cópia)`, updatedAt: Date.now() })
  }

  return (
    <div>
      <PageHeader
        icon="🐲"
        titulo="Bestiário"
        subtitulo="Cadastre inimigos com foto e estatísticas. Controle o que o grupo já descobriu sobre cada criatura."
        acoes={
          <ViewToggle
            valor={modo}
            onChange={setModo}
            opcoes={[
              { valor: 'dm', label: '🎲 Visão do DM', labelCurto: '🎲 DM' },
              { valor: 'jogadores', label: '👀 Prévia do grupo', labelCurto: '👀 Prévia' },
            ]}
          />
        }
      />

      <SelosDaMesa />

      {modo === 'dm' ? (
        <>
          <Toolbar>
            <button className="btn-primary" onClick={() => setEditando(novoMonstro())}>＋ Novo monstro</button>
          </Toolbar>

          <BarraDeFiltros lista={monstros} filtros={filtros} onChange={setFiltros} />

          {filtrados.length === 0 ? (
            <EmptyState
              icon="🐉"
              titulo={monstros.length === 0 ? 'Bestiário vazio' : 'Nenhuma criatura encontrada'}
              texto={monstros.length === 0 ? 'Crie sua primeira criatura para começar a preencher a mesa de perigos.' : 'Ajuste a busca ou os filtros.'}
              acao={monstros.length === 0 ? <button className="btn-primary" onClick={() => setEditando(novoMonstro())}>＋ Criar criatura</button> : undefined}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((m) => (
                <DmMonsterCard
                  key={m.id}
                  m={m}
                  onEdit={() => setEditando(m)}
                  onDuplicate={() => duplicar(m)}
                  onDelete={() => {
                    if (confirm(`Remover "${m.nome || 'monstro'}" do bestiário?`)) remover(m.id)
                  }}
                  onHp={(pvAtual) => salvar({ ...m, pvAtual })}
                  onNivel={(conhecimento) => salvar({ ...m, conhecimento })}
                  onCategoria={(categoria) => salvar({ ...m, categoria })}
                  onDerrotado={(derrotado) => salvar({ ...m, derrotado })}
                  setAmpliada={setAmpliada}
                  fases={fasesDoChefe(monstros, m.chefeId)}
                  onNovaFase={() => criarFase(m)}
                  onAbrirFase={(f) => setEditando(f)}
                  onApagarFase={(f) => apagarFase(f)}
                  candidatos={monstros.filter(
                    (x) => x.id !== m.id && !x.chefeId && categoriaInfo(x.categoria).marcavel,
                  )}
                  onVincularFase={(id) => vincularFase(m, id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <PlayerView monstros={conhecidos} filtros={filtros} setFiltros={setFiltros} todos={monstros} setAmpliada={setAmpliada} />
      )}

      {editando && (
        <MonsterEditor
          inicial={editando}
          aviso={avisoFase}
          onClose={() => {
            setEditando(null)
            setAvisoFase('')
            setBaseParaCarimbar(null)
          }}
          onSave={(m) => {
            if (baseParaCarimbar) salvar(baseParaCarimbar)
            salvar(m)
            setEditando(null)
            setAvisoFase('')
            setBaseParaCarimbar(null)
          }}
        />
      )}

      {ampliada && <Lightbox url={ampliada} onClose={() => setAmpliada('')} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card do DM
// ---------------------------------------------------------------------------
function DmMonsterCard({
  m,
  onEdit,
  onDuplicate,
  onDelete,
  onHp,
  onNivel,
  onCategoria,
  onDerrotado,
  setAmpliada,
  fases = [],
  onNovaFase,
  onAbrirFase,
  onApagarFase,
  candidatos = [],
  onVincularFase,
}: {
  m: Monster
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onHp: (pv: number) => void
  onNivel: (n: KnowledgeLevel) => void
  onCategoria: (c: NonNullable<Monster['categoria']>) => void
  onDerrotado: (v: boolean) => void
  setAmpliada: (url: string) => void
  /** Todas as formas deste chefe, quando ele tiver mais de uma. */
  fases?: Monster[]
  onNovaFase?: () => void
  onAbrirFase?: (f: Monster) => void
  onApagarFase?: (f: Monster) => void
  /** Criaturas que já existem e podem virar fase deste chefe. */
  candidatos?: Monster[]
  onVincularFase?: (id: string) => void
}) {
  const pct = m.pvMax > 0 ? Math.max(0, Math.min(100, (m.pvAtual / m.pvMax) * 100)) : 0
  const cor = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-dragon-500'
  const ajusta = (d: number) => onHp(Math.max(0, Math.min(m.pvMax, m.pvAtual + d)))
  const nivel = nivelInfo(m.conhecimento)
  // Qual fase o cartão mostra. Clicar numa aba troca a visualização — editar é
  // o botão de baixo, que abre a fase visível.
  const [faseVisivel, setFaseVisivel] = useState<string | null>(null)
  const exibido = fases.find((f) => f.id === faseVisivel) ?? m
  const cat = categoriaInfo(exibido.categoria)
  const ferido = exibido.pvAtual < exibido.pvMax

  return (
    <div className="card gv-fade group relative overflow-hidden transition hover:ring-1 hover:ring-dragon-500/40">
      <div className="relative h-48 w-full overflow-hidden bg-ink-900/60">
        {exibido.imagemUrl ? (
          // Um stat block inteiro colado como imagem é ilegível cortado em 144
          // px de altura. Clicar abre em tamanho real.
          <button
            type="button"
            className="block h-full w-full cursor-zoom-in"
            onClick={() => setAmpliada(exibido.imagemUrl)}
            title="Ver imagem inteira"
          >
            <img src={exibido.imagemUrl} alt={exibido.nome} className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105" />
          </button>
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl opacity-40">🐾</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-parchment-100 backdrop-blur" title={nivel.label}>
          {nivel.icone} {nivel.curto}
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-parchment-100 backdrop-blur">
          {cat.icone} {cat.label}
        </span>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink-900 via-ink-900/70 to-transparent p-3">
          <div>
            <p
              className={`font-display text-lg leading-tight text-parchment-50 drop-shadow ${
                m.derrotado ? 'line-through decoration-dragon-500 decoration-2' : ''
              }`}
            >
              {exibido.nome || 'Sem nome'}
            </p>
            <p className="text-xs text-parchment-100/80">{[exibido.tamanho, exibido.tipo].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="chip">ND {exibido.nd}</span>
          <span className="chip">CA {exibido.ca}</span>
          <span className="chip">Desl. {exibido.deslocamento}</span>
        </div>

        {/* Fases do chefe: as formas seguintes vivem aqui dentro. */}
        {(fases.length > 1 || cat.marcavel) && (
          <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="panel-title">Fases</span>
              {onNovaFase && (
                <button type="button" className="text-xs text-arcane-400 hover:underline" onClick={onNovaFase}>
                  ＋ nova fase
                </button>
              )}
            </div>

            {/* Vincular o que já existe: quem cadastrou as duas formas antes de
                saber que o app as relaciona não deve recadastrar nada. */}
            {candidatos.length > 0 && onVincularFase && (
              <select
                className="stat-input mb-1.5 w-full py-1 text-[11px]"
                value=""
                onChange={(e) => {
                  if (e.target.value) onVincularFase(e.target.value)
                  e.target.value = ''
                }}
              >
                <option value="">…ou use uma criatura que já existe</option>
                {candidatos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome || 'Sem nome'}</option>
                ))}
              </select>
            )}
            {fases.length > 1 ? (
              <>
                <div className="space-y-1">
                  {fases.map((f) => (
                    <div key={f.id} className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFaseVisivel(f.id)}
                        className={`min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left text-[11px] transition hover:bg-white/5 ${
                          f.id === exibido.id
                            ? 'bg-white/10 text-parchment-50'
                            : 'text-parchment-200/70'
                        }`}
                        title={`Ver ${f.nome}`}
                      >
                        {f.conhecimento === 'desconhecido' ? '🙈' : '👁'}{' '}
                        <b>{rotuloFase(f)}</b> — {f.nome || 'sem nome'}
                      </button>
                      {/* Uma fase criada por engano precisava poder sumir: a
                          primeira versão só sabia criar. */}
                      {(f.fase ?? 1) > 1 && (
                        <button
                          type="button"
                          className="shrink-0 px-1 text-xs text-parchment-200/30 hover:text-dragon-400"
                          title={`Apagar ${rotuloFase(f)}`}
                          onClick={() => onApagarFase?.(f)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-parchment-200/45">
                  Em combate, o chefe começa na Fase 1 e você avança as seguintes quando ele cai.
                </p>
              </>
            ) : (
              <p className="text-[11px] leading-relaxed text-parchment-200/50">
                Uma forma só. <b>＋ nova fase</b> cria uma cópia desta criatura para você editar —
                é nela que o chefe se transforma ao cair em combate.
              </p>
            )}
          </div>
        )}

        {/* Categoria e marco de derrota */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="panel-title shrink-0">Rank</span>
          {/* Sem `appearance-none`: a seta do select é o que diz que dá para
              clicar. Sem ela, o campo parecia um rótulo fixo e ninguém
              descobria que a categoria era editável. */}
          <select
            value={m.categoria ?? 'comum'}
            onChange={(e) => onCategoria(e.target.value as NonNullable<Monster['categoria']>)}
            className="stat-input flex-1 py-1.5 text-sm"
          >
            {CATEGORIAS_MONSTRO.map((c) => (
              <option key={c.valor} value={c.valor}>{c.icone} {c.label}</option>
            ))}
          </select>
          {cat.marcavel && (
            <button
              type="button"
              onClick={() => onDerrotado(!m.derrotado)}
              className={`chip shrink-0 ${m.derrotado ? 'border-dragon-500/60 text-dragon-400' : ''}`}
              title={m.derrotado ? 'Marcar como vivo de novo' : 'O grupo derrubou — risca para todos'}
            >
              {m.derrotado ? '☠️ Derrotado' : 'Marcar derrota'}
            </button>
          )}
        </div>

        {/* Nível de conhecimento do grupo */}
        <label className="mb-3 block">
          <span className="mb-1 flex items-center gap-1 panel-title">Conhecimento do grupo</span>
          <div className="flex items-center gap-2">
            <span className="text-base" title={nivel.label}>{nivel.icone}</span>
            <select
              value={m.conhecimento}
              onChange={(e) => onNivel(e.target.value as KnowledgeLevel)}
              className="stat-input flex-1 appearance-none py-1.5 text-sm"
            >
              {NIVEIS_CONHECIMENTO.map((n) => (
                <option key={n.valor} value={n.valor}>{n.label}</option>
              ))}
            </select>
          </div>
        </label>

        {/* Rastreador de PV */}
        <div className="rounded-lg border border-white/10 bg-ink-900/40 p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="panel-title">Pontos de Vida</span>
            <span className="flex items-center gap-2">
              {ferido && (
                <button className="text-[10px] text-arcane-400 hover:underline" onClick={() => onHp(m.pvMax)} title="Restaurar vida cheia">
                  restaurar
                </button>
              )}
              <span className="tabular-nums text-parchment-100">{m.pvAtual} / {m.pvMax}</span>
            </span>
          </div>
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-black/40">
            <div className={`hpbar ${cor}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-ghost flex-1 px-1 py-1 text-xs" onClick={() => ajusta(-5)}>−5</button>
            <button className="btn-ghost flex-1 px-1 py-1 text-xs" onClick={() => ajusta(-1)}>−1</button>
            <input
              type="number"
              value={m.pvAtual}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                onHp(Math.max(0, Math.min(m.pvMax, Number.isNaN(n) ? 0 : n)))
              }}
              className="w-12 shrink-0 rounded-md border border-white/10 bg-ink-800 px-1 py-1 text-center text-sm outline-none focus:border-arcane-400"
            />
            <button className="btn-ghost flex-1 px-1 py-1 text-xs" onClick={() => ajusta(1)}>+1</button>
            <button className="btn-ghost flex-1 px-1 py-1 text-xs" onClick={() => ajusta(5)}>+5</button>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            className="btn-ghost flex-1 py-1.5 text-xs"
            onClick={() => (exibido.id === m.id ? onEdit() : onAbrirFase?.(exibido))}
          >
            Editar / ver ficha{fases.length > 1 ? ` — ${rotuloFase(exibido)}` : ''}
          </button>
          <button className="btn-ghost px-2 py-1.5 text-xs text-parchment-200/50 hover:text-parchment-50" onClick={onDuplicate} title="Duplicar criatura" aria-label="Duplicar">⧉</button>
          <button
            className="btn-ghost px-2 py-1.5 text-xs text-parchment-200/50 hover:text-dragon-400"
            onClick={onDelete}
            aria-label="Remover"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Visão dos Jogadores
// ---------------------------------------------------------------------------
function PlayerView({
  monstros,
  filtros,
  setFiltros,
  todos,
  setAmpliada,
}: {
  monstros: Monster[]
  filtros: FiltrosBestiario
  setFiltros: (f: FiltrosBestiario) => void
  todos: Monster[]
  setAmpliada: (url: string) => void
}) {
  return (
    <>
      <div className="mb-4 rounded-lg border border-arcane-400/30 bg-arcane-500/10 p-3 text-sm text-parchment-100">
        👥 Esta é a tela que você mostra aos jogadores. Aparecem só as criaturas que
        o grupo já <b>encontrou</b> ou <b>estudou</b> — no nível de detalhe que você liberou.
      </div>
      <BarraDeFiltros
        lista={todos.filter((m) => m.conhecimento !== 'desconhecido')}
        filtros={filtros}
        onChange={setFiltros}
        mostrarConhecimento={false}
      />
      {monstros.length === 0 ? (
        <EmptyState
          icon="🔍"
          titulo="Nada revelado ainda"
          texto="Na Visão do DM, marque as criaturas como Encontrado ou Estudado para que apareçam aqui."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {monstros.map((m) => (
            <PlayerMonsterCard key={m.id} m={m} setAmpliada={setAmpliada} />
          ))}
        </div>
      )}
    </>
  )
}

function PlayerMonsterCard({ m, setAmpliada }: { m: Monster; setAmpliada?: (url: string) => void }) {
  const nivel = nivelInfo(m.conhecimento)
  const cat = categoriaInfo(m.categoria)
  const img = m.imagemJogadorUrl || m.imagemUrl
  const mostraStats = m.conhecimento === 'parcial' || m.conhecimento === 'completo'
  const mostraFicha = m.conhecimento === 'completo'

  return (
    <div className={`card overflow-hidden ${m.derrotado ? 'opacity-75' : ''}`}>
      <div className="relative h-52 w-full overflow-hidden bg-ink-900/60">
        {img ? (
          <button
            type="button"
            className="block h-full w-full cursor-zoom-in"
            onClick={() => setAmpliada?.(img)}
            title="Ver imagem inteira"
          >
            <img src={img} alt={m.nome} className={`h-full w-full object-cover object-top ${m.derrotado ? 'grayscale' : ''}`} />
          </button>
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl opacity-40">🐾</div>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-parchment-100 backdrop-blur">
          {nivel.icone} {nivel.curto}
        </span>
        {cat.marcavel && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs backdrop-blur ${
              m.categoria === 'bbeg'
                ? 'border border-dragon-400/60 bg-dragon-600/60 font-semibold text-parchment-50'
                : 'bg-black/50 text-parchment-100'
            }`}
          >
            {cat.icone} {cat.label}
          </span>
        )}
        {m.derrotado && (
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-dragon-600/85 py-1 text-center font-display text-lg tracking-wide text-parchment-50">
            Derrotado
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900 to-transparent p-3">
          <p className={`font-display text-lg leading-tight text-parchment-50 drop-shadow ${m.derrotado ? 'line-through decoration-2' : ''}`}>{m.nome || '???'}</p>
          <p className="text-xs text-parchment-100/80">{[m.tamanho, m.tipo].filter(Boolean).join(' · ')}</p>
        </div>
      </div>

      <div className="p-4 text-sm">
        {!mostraStats ? (
          <p className="text-parchment-200/60">
            O grupo viu esta criatura, mas ainda não a estudou. Investigue-a para
            revelar suas estatísticas.
          </p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="chip">ND {m.nd}</span>
              <span className="chip">CA {m.ca}</span>
              <span className="chip">PV {m.pvMax}</span>
              <span className="chip">Desl. {m.deslocamento}</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {ABILITIES.map((a) => (
                <div key={a.key} className="rounded-lg border border-white/10 bg-ink-900/40 py-1 text-center">
                  <div className="panel-title text-[10px]">{a.abrev}</div>
                  <div className="font-display text-sm text-parchment-50">{fmtMod(abilityMod(m.atributos[a.key]))}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {mostraFicha && (m.tracos || m.acoes.length > 0) && (
          <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
            {m.tracos && (
              <div>
                <h4 className="mb-1 panel-title">Traços</h4>
                <p className="whitespace-pre-wrap leading-relaxed text-parchment-100">{m.tracos}</p>
              </div>
            )}
            {m.acoes.length > 0 && (
              <div>
                <h4 className="mb-1 panel-title">Ações</h4>
                <ul className="space-y-1">
                  {m.acoes.map((a) => (
                    <li key={a.id}>
                      <span className="font-medium text-parchment-50">{a.nome || '—'}.</span>{' '}
                      <span className="text-parchment-200/80">{a.descricao}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------
function MonsterEditor({
  inicial,
  onClose,
  onSave,
  aviso = '',
}: {
  inicial: Monster
  onClose: () => void
  onSave: (m: Monster) => void
  aviso?: string
}) {
  const [m, setM] = useState<Monster>(inicial)
  const [mexeu, setMexeu] = useState(false)
  const [colando, setColando] = useState(false)
  const [texto, setTexto] = useState('')
  const [lido, setLido] = useState<string[]>([])

  function set(patch: Partial<Monster>) {
    setMexeu(true)
    setM((prev) => ({ ...prev, ...patch }))
  }

  /**
   * Fechar sem salvar.
   *
   * Clicar fora precisa descartar — salvar sozinho era o defeito anterior. Mas
   * descartar em silêncio troca um problema por outro, então quem já digitou
   * algo é avisado antes.
   */
  function fechar() {
    if (mexeu && !confirm('Descartar as alterações? Nada foi salvo ainda.')) return
    onClose()
  }

  function aplicarTextoColado() {
    const { campos, reconhecidos } = lerStatBlock(texto)
    // Mescla: campo não reconhecido preserva o que já estava preenchido.
    setM((prev) => ({ ...prev, ...campos }))
    setLido(reconhecidos)
    if (reconhecidos.length > 0) setColando(false)
  }

  function addAcao() {
    const nova: MonsterAction = { id: uid(), nome: '', descricao: '' }
    set({ acoes: [...m.acoes, nova] })
  }
  function patchAcao(id: string, p: Partial<MonsterAction>) {
    set({ acoes: m.acoes.map((a) => (a.id === id ? { ...a, ...p } : a)) })
  }
  function removeAcao(id: string) {
    set({ acoes: m.acoes.filter((a) => a.id !== id) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={fechar}>
      <div className="card my-8 w-full max-w-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl text-parchment-50">{inicial.nome ? 'Editar criatura' : 'Nova criatura'}</h2>
          <button className="btn-ghost" onClick={fechar}>Cancelar</button>
        </div>

        {aviso && (
          <p className="mb-4 rounded-lg border border-arcane-400/40 bg-arcane-500/10 p-2.5 text-sm text-parchment-100">
            ⚡ {aviso}
          </p>
        )}

        {/* Colar bloco de estatísticas */}
        <div className="mb-5">
          {!colando ? (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-ghost" onClick={() => setColando(true)}>
                📋 Colar bloco de estatísticas
              </button>
              {lido.length > 0 && (
                <span className="text-xs text-emerald-400">
                  Preenchi: {lido.join(', ')}. Confira antes de salvar.
                </span>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-xs text-parchment-200/70">
                Selecione o bloco no PDF ou site, copie e cole aqui. O que eu não reconhecer fica
                como está — não invento campo.
              </p>
              <PromptParaIa />
              <TextArea
                value={texto}
                onChange={setTexto}
                rows={8}
                placeholder={'Rukha, o Sábio da Raiz\nHumanoide Médio (orc), leal e mau\nCA 15\nPV 52…'}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={aplicarTextoColado} disabled={!texto.trim()}>
                  Preencher a ficha
                </button>
                <button type="button" className="btn-ghost" onClick={() => setColando(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          {/* Imagens */}
          <div className="grid grid-cols-2 gap-3">
            <ImageSlot
              titulo="Foto do DM"
              hint="🙈 Privada. Cabe o stat block inteiro — guardo em alta para dar para ler."
              url={m.imagemUrl}
              maxSize={1600}
              onChange={(url) => set({ imagemUrl: url })}
              acao={
                m.imagemUrl && m.imagemUrl !== m.imagemJogadorUrl ? (
                  <button
                    type="button"
                    className="btn-ghost w-full text-xs"
                    onClick={() => set({ imagemJogadorUrl: m.imagemUrl })}
                  >
                    ↳ Usar também para o grupo
                  </button>
                ) : undefined
              }
            />
            <ImageSlot
              titulo="Foto dos jogadores"
              hint="A única que sai para o grupo. Vazio = eles veem só a silhueta."
              url={m.imagemJogadorUrl}
              onChange={(url) => set({ imagemJogadorUrl: url })}
            />
          </div>

          {/* Campos principais */}
          <div className="space-y-3">
            <Field label="Nome">
              <TextField value={m.nome} onChange={(v) => set({ nome: v })} placeholder="Ex: Dragão Vermelho Jovem" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tamanho">
                <SelectField value={m.tamanho} onChange={(v) => set({ tamanho: v })} options={TAMANHOS.map((t) => ({ value: t, label: t }))} />
              </Field>
              <Field label="Tipo">
                <SelectField value={TIPOS.find((t) => m.tipo.startsWith(t)) ?? ''} onChange={(v) => set({ tipo: v })} options={TIPOS.map((t) => ({ value: t, label: t }))} />
              </Field>
            </div>
            <Field label="Conhecimento do grupo" hint="Define o que os jogadores veem na Visão dos Jogadores.">
              <SelectField
                value={m.conhecimento}
                onChange={(v) => set({ conhecimento: v as KnowledgeLevel })}
                options={NIVEIS_CONHECIMENTO.map((n) => ({ value: n.valor, label: `${n.icone} ${n.label}` }))}
                placeholder=""
              />
            </Field>
          </div>
        </div>

        {/* Estatísticas de combate */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="ND" hint="Nível de Desafio: o quão perigoso é o monstro.">
            <SelectField value={m.nd} onChange={(v) => set({ nd: v })} options={NDS.map((n) => ({ value: n, label: n }))} placeholder="" />
          </Field>
          <Field label="CA">
            <NumberField value={m.ca} onChange={(v) => set({ ca: v })} />
          </Field>
          <Field label="PV Máx.">
            <NumberField value={m.pvMax} onChange={(v) => set({ pvMax: v, pvAtual: Math.min(m.pvAtual, v) })} />
          </Field>
          <Field label="PV Atual">
            <NumberField value={m.pvAtual} onChange={(v) => set({ pvAtual: v })} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Deslocamento">
            <TextField value={m.deslocamento} onChange={(v) => set({ deslocamento: v })} placeholder="9 m, voo 18 m" />
          </Field>
        </div>

        {/* Atributos */}
        <div className="mt-5">
          <h3 className="mb-2 panel-title">Atributos</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ABILITIES.map((a) => (
              <div key={a.key} className="rounded-lg border border-white/10 bg-ink-900/40 p-2 text-center">
                <div className="panel-title">{a.abrev}</div>
                <div className="font-display text-base text-parchment-50">{fmtMod(abilityMod(m.atributos[a.key]))}</div>
                <input
                  type="number"
                  value={m.atributos[a.key]}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    set({ atributos: { ...m.atributos, [a.key]: Number.isNaN(n) ? 0 : n } })
                  }}
                  className="mt-1 w-12 rounded-md border border-white/10 bg-ink-800 px-1 py-0.5 text-center text-sm outline-none focus:border-arcane-400"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Traços */}
        <div className="mt-5">
          <Field label="Traços & habilidades passivas" hint="Resistências, imunidades, sentidos, habilidades especiais.">
            <TextArea value={m.tracos} onChange={(v) => set({ tracos: v })} rows={3} placeholder="Ex: Imune a fogo. Visão no escuro 18 m." />
          </Field>
        </div>

        {/* Ações */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="panel-title">Ações</h3>
            <button className="btn-ghost py-1 text-xs" onClick={addAcao}>＋ Adicionar ação</button>
          </div>
          {m.acoes.length === 0 ? (
            <p className="text-sm text-parchment-200/50">Nenhuma ação. Adicione ataques e habilidades usáveis em combate.</p>
          ) : (
            <div className="space-y-2">
              {m.acoes.map((a) => (
                <div key={a.id} className="flex gap-2">
                  <input className="stat-input w-40" value={a.nome} placeholder="Mordida" onChange={(e) => patchAcao(a.id, { nome: e.target.value })} />
                  <input className="stat-input flex-1" value={a.descricao} placeholder="+5 para acertar, 2d6+3 perfurante." onChange={(e) => patchAcao(a.id, { descricao: e.target.value })} />
                  <button onClick={() => removeAcao(a.id)} className="px-2 text-parchment-200/40 hover:text-dragon-400" aria-label="Remover ação">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Táticas do DM */}
        <div className="mt-5">
          <Field label="Táticas do DM (sempre privadas)" hint="Como jogar essa criatura em combate. Nunca aparece para os jogadores.">
            <TextArea value={m.taticas} onChange={(v) => set({ taticas: v })} rows={2} placeholder="Ex: foca nos conjuradores, usa sopro quando 3+ alvos estão agrupados." />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={fechar}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(m)}>Salvar criatura</button>
        </div>
      </div>
    </div>
  )
}

// Slot reutilizável de imagem (upload com redimensionamento ou URL)
function ImageSlot({
  titulo,
  hint,
  url,
  onChange,
  maxSize = 640,
  acao,
}: {
  titulo: string
  hint: string
  url: string
  onChange: (url: string) => void
  /** Retrato de card cabe em 640; stat block colado precisa ser legível. */
  maxSize?: number
  acao?: React.ReactNode
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [carregando, setCarregando] = useState(false)

  async function onFile(file: File) {
    setCarregando(true)
    try {
      onChange(await imageToDataUrl(file, maxSize, 0.78))
    } catch {
      alert('Não consegui processar essa imagem.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-1 panel-title">{titulo}</div>
      <div className="aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-ink-900/60">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl opacity-30">🐾</div>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <button className="btn-ghost flex-1 py-1.5 text-xs" onClick={() => fileRef.current?.click()} disabled={carregando}>
          {carregando ? 'Processando…' : '📷 Enviar'}
        </button>
        {url && <button className="btn-ghost px-2 py-1.5 text-xs" onClick={() => onChange('')}>✕</button>}
      </div>
      {acao && <div className="mt-1.5">{acao}</div>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
      <p className="mt-1 text-[11px] leading-snug text-parchment-200/40">{hint}</p>
      <input
        className="stat-input mt-1 py-1 text-xs"
        value={url.startsWith('data:') ? '' : url}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ou cole uma URL…"
      />
    </div>
  )
}


/**
 * Prompt pronto para pedir a ficha a uma IA no formato que o leitor entende.
 *
 * Fica guardado aqui, e não num documento à parte, porque ele precisa andar
 * junto com o leitor: se `statblock.ts` mudar o que reconhece, isto muda na
 * mesma alteração.
 */
const PROMPT_IA = `Escreva a ficha de um monstro de D&D 5.5e (regras de 2024) em TEXTO PURO, no formato exato abaixo. Sem markdown, sem negrito, sem tabelas, sem asteriscos.

Nome da Criatura
Humanoide Médio (orc), leal e mau
CA 15
PV 52
Deslocamento 9 m
FOR DES CON INT SAB CAR
14 (+2) 12 (+1) 14 (+2) 16 (+3) 15 (+2) 11 (+0)
Perícias: Arcana +5, Percepção +4
Sentidos: visão no escuro 18 m, percepção passiva 14
Idiomas: Comum, Orc
ND 4

CARACTERÍSTICAS
Nome do Traço. Descrição do traço em uma ou duas frases.
Outro Traço. Descrição.

AÇÕES
Nome da Ação. Ataque corpo a corpo com arma: +5 para atingir, alcance 1,5 m, um alvo. Dano: 7 (1d8 + 3) perfurante.
Outra Ação. Descrição completa.

REAÇÃO
Nome da Reação. Descrição.

Regras do formato, todas obrigatórias:
- A primeira linha é só o nome.
- A segunda linha tem o tamanho (Miúdo, Pequeno, Médio, Grande, Enorme ou Colossal) e o tipo.
- Os seis atributos vêm em duas linhas: os rótulos numa, os valores na outra, com o modificador entre parênteses.
- CARACTERÍSTICAS, AÇÕES e REAÇÃO são cabeçalhos sozinhos numa linha, em maiúsculas.
- Cada traço e cada ação começa com o nome seguido de ponto final, e depois a descrição.

Agora crie: [DESCREVA AQUI A CRIATURA QUE VOCÊ QUER]`

function PromptParaIa() {
  const [aberto, setAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(PROMPT_IA)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setAberto(true)
    }
  }

  return (
    <div className="mb-2 rounded-lg border border-arcane-400/25 bg-arcane-500/5 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-parchment-200/80">
          Não tem o bloco pronto? Peça a uma IA no formato certo.
        </span>
        <button type="button" className="btn-ghost py-1 text-xs" onClick={copiar}>
          {copiado ? '✓ Copiado' : '📋 Copiar prompt'}
        </button>
        <button
          type="button"
          className="text-xs text-parchment-200/50 underline hover:text-parchment-100"
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? 'esconder' : 'ver o prompt'}
        </button>
      </div>
      {aberto && (
        <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded bg-ink-900/60 p-2 text-[11px] leading-relaxed text-parchment-200/80">
          {PROMPT_IA}
        </pre>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Imagem em tamanho real
//
// Um stat block colado como imagem não se lê numa miniatura. Abre ocupando a
// tela, com zoom e arrasto — a lupa do navegador não serve porque o overlay é
// fixo e não rola junto.
// ---------------------------------------------------------------------------
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const arrasto = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(6, z + 0.25))
      if (e.key === '-') setZoom((z) => Math.max(0.5, z - 0.25))
      if (e.key === '0') {
        setZoom(1)
        setPos({ x: 0, y: 0 })
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onClose])

  function aoRolar(e: React.WheelEvent) {
    e.preventDefault()
    setZoom((z) => Math.max(0.5, Math.min(6, z - e.deltaY * 0.002)))
  }

  const encaixado = zoom === 1 && pos.x === 0 && pos.y === 0

  return (
    <div className="fixed inset-0 z-50 select-none overflow-hidden bg-black/90" onWheel={aoRolar}>
      <div
        className="grid h-full w-full place-items-center"
        style={{ cursor: zoom > 1 ? (arrasto.current ? 'grabbing' : 'grab') : 'zoom-in' }}
        onPointerDown={(e) => {
          if (zoom <= 1) return
          arrasto.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
        }}
        onPointerMove={(e) => {
          if (!arrasto.current) return
          setPos({ x: e.clientX - arrasto.current.x, y: e.clientY - arrasto.current.y })
        }}
        onPointerUp={() => (arrasto.current = null)}
        onPointerLeave={() => (arrasto.current = null)}
        // Clicar no fundo fecha; clicar na imagem sem zoom aproxima.
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <img
          src={url}
          alt=""
          draggable={false}
          onClick={() => zoom === 1 && setZoom(2)}
          className="max-h-[92vh] max-w-[95vw] rounded shadow-2xl transition-[transform] duration-75"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})` }}
        />
      </div>

      <div className="fixed inset-x-0 bottom-4 flex justify-center">
        <div className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1.5 text-sm text-parchment-50 backdrop-blur">
          <button type="button" className="px-2.5 py-0.5 hover:text-arcane-400" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} title="Diminuir (−)">−</button>
          <button
            type="button"
            className="min-w-[4.5rem] px-2 py-0.5 text-xs hover:text-arcane-400"
            onClick={() => {
              setZoom(1)
              setPos({ x: 0, y: 0 })
            }}
            title="Tamanho original (0)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" className="px-2.5 py-0.5 hover:text-arcane-400" onClick={() => setZoom((z) => Math.min(6, z + 0.25))} title="Aumentar (+)">+</button>
          <span className="mx-1 h-4 w-px bg-white/20" />
          <a href={url} target="_blank" rel="noreferrer" className="px-2 py-0.5 text-xs hover:text-arcane-400" title="Abrir em outra aba">
            ↗ Abrir
          </a>
          <button type="button" className="px-2 py-0.5 text-xs hover:text-dragon-400" onClick={onClose}>
            ✕ Fechar
          </button>
        </div>
      </div>

      {encaixado && (
        <p className="fixed inset-x-0 top-4 text-center text-xs text-parchment-200/50">
          Clique na imagem ou role para aproximar · arraste para mover · Esc fecha
        </p>
      )}
    </div>
  )
}
