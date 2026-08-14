import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AbilityKey, Character, SkillKey } from '../types'
import {
  ABILITIES,
  ALINHAMENTOS,
  ANTECEDENTES,
  ARRANJO_PADRAO,
  CLASSES,
  ESPECIES,
  PERICIAS_POR_CLASSE,
  SKILLS,
} from '../data/rules'
import { espacosPorNivel } from '../data/progression'
import { abilityMod, classInfo, fmtMod } from '../lib/calc'
import { novaFicha } from '../lib/character'
import { useCharacters } from '../hooks/useCharacters'
import { InfoDot } from '../components/ui'
import {
  vantagensDaClasse,
  vantagensDaEspecie,
  vantagensDoAntecedente,
  type Vantagem,
} from '../lib/vantagens'

type Metodo = 'arranjo' | 'compra' | 'manual'

// Custo em pontos para "compra de pontos" (27 pontos, valores 8–15).
const CUSTO_COMPRA: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
const TOTAL_COMPRA = 27

interface WizardState {
  nome: string
  jogador: string
  especie: string
  classe: string
  antecedente: string
  alinhamento: string
  metodo: Metodo
  // valores base por atributo (antes dos aumentos do antecedente)
  base: Record<AbilityKey, number>
  // aumentos do antecedente (regra 2024): +2 e +1
  asiMais2: AbilityKey | ''
  asiMais1: AbilityKey | ''
  pericias: SkillKey[]
}

const PASSOS = ['Identidade', 'Espécie', 'Classe', 'Antecedente', 'Atributos', 'Perícias', 'Revisão']

export default function CharacterWizard() {
  const navigate = useNavigate()
  const { save } = useCharacters()
  const [passo, setPasso] = useState(0)
  // O modo fica guardado: quem é novo continua novo na próxima ficha, e quem
  // já conhece as classes não quer a explicação de novo toda vez.
  const [detalhado, setDetalhado] = useState(() => lerModo())
  useEffect(() => guardarModo(detalhado), [detalhado])
  const [s, setS] = useState<WizardState>({
    nome: '',
    jogador: '',
    especie: '',
    classe: '',
    antecedente: '',
    alinhamento: '',
    metodo: 'arranjo',
    base: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
    asiMais2: '',
    asiMais1: '',
    pericias: [],
  })

  function set(patch: Partial<WizardState>) {
    setS((prev) => ({ ...prev, ...patch }))
  }

  const finais = useMemo(() => calcFinais(s), [s])
  const info = classInfo(s.classe)

  // Validação por passo (habilita "Próximo")
  const podeAvancar = useMemo(() => {
    switch (passo) {
      case 0: return s.nome.trim().length > 0
      case 1: return !!s.especie
      case 2: return !!s.classe
      case 3: return !!s.antecedente
      case 4: return atributosValidos(s)
      case 5: return periciasCompletas(s)
      default: return true
    }
  }, [passo, s])

  function criar() {
    const ficha = montarFicha(s, finais)
    save(ficha)
    navigate(`/fichas/${ficha.id}`)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-parchment-50">Assistente de criação</h1>
          <p className="mt-1 text-sm text-parchment-200/60">Vamos montar seu personagem passo a passo — sem pressa.</p>
        </div>
        <div className="flex items-center gap-2">
          <SeletorDeModo detalhado={detalhado} onTrocar={setDetalhado} />
          <button className="btn-ghost" onClick={() => navigate('/fichas')}>Sair</button>
        </div>
      </header>

      <Steps passo={passo} onGoto={(i) => i < passo && setPasso(i)} />

      <div className="card mt-4 p-6">
        {passo === 0 && <PassoIdentidade s={s} set={set} />}
        {passo === 1 && <PassoEscolha titulo="Escolha sua espécie" hint="Sua ascendência define traços como visão no escuro, deslocamento e resistências." itens={ESPECIES} valor={s.especie} detalhado={detalhado} vantagens={vantagensDaEspecie} onEscolher={(v) => set({ especie: v })} />}
        {passo === 2 && <PassoClasse s={s} set={set} detalhado={detalhado} />}
        {passo === 3 && <PassoEscolha titulo="Escolha seu antecedente" hint="O passado do personagem. Nas regras de 2024, concede perícias e aumentos de atributo." itens={ANTECEDENTES} valor={s.antecedente} detalhado={detalhado} vantagens={(_, resumo) => vantagensDoAntecedente(resumo)} onEscolher={(v) => set({ antecedente: v })} />}
        {passo === 4 && <PassoAtributos s={s} set={set} finais={finais} />}
        {passo === 5 && <PassoPericias s={s} set={set} />}
        {passo === 6 && <PassoRevisao s={s} finais={finais} info={info} />}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          className="btn-ghost"
          onClick={() => (passo === 0 ? navigate('/fichas') : setPasso(passo - 1))}
        >
          ← {passo === 0 ? 'Cancelar' : 'Voltar'}
        </button>
        {passo < PASSOS.length - 1 ? (
          <button className="btn-primary" disabled={!podeAvancar} onClick={() => setPasso(passo + 1)}>
            Próximo →
          </button>
        ) : (
          <button className="btn-primary" onClick={criar}>
            ✓ Criar ficha
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function Steps({ passo, onGoto }: { passo: number; onGoto: (i: number) => void }) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {PASSOS.map((nome, i) => {
        const estado = i < passo ? 'feito' : i === passo ? 'atual' : 'futuro'
        return (
          <li key={nome}>
            <button
              onClick={() => onGoto(i)}
              disabled={i >= passo}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                estado === 'atual'
                  ? 'bg-dragon-500 text-parchment-50'
                  : estado === 'feito'
                  ? 'bg-white/10 text-parchment-100 hover:bg-white/15'
                  : 'text-parchment-200/40'
              }`}
            >
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${estado === 'feito' ? 'bg-emerald-500 text-ink-900' : 'bg-white/10'}`}>
                {estado === 'feito' ? '✓' : i + 1}
              </span>
              {nome}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

// ---------------------------------------------------------------------------
function PassoIdentidade({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  return (
    <div>
      <TituloPasso titulo="Quem é o seu herói?" hint="Você pode mudar tudo isso depois, na ficha." />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block panel-title">Nome do personagem</span>
          <input className="stat-input" value={s.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Ex: Aragorn" autoFocus />
        </label>
        <label className="block">
          <span className="mb-1 block panel-title">Seu nome (jogador)</span>
          <input className="stat-input" value={s.jogador} onChange={(e) => set({ jogador: e.target.value })} placeholder="Opcional" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 flex items-center gap-1 panel-title">Alinhamento <InfoDot>A bússola moral do personagem. Totalmente opcional.</InfoDot></span>
          <select className="stat-input appearance-none" value={s.alinhamento} onChange={(e) => set({ alinhamento: e.target.value })}>
            <option value="">Escolher depois</option>
            {ALINHAMENTOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      </div>
    </div>
  )
}

// Passo genérico de escolha em cartões (espécie / antecedente)
function PassoEscolha({
  titulo,
  hint,
  itens,
  valor,
  detalhado,
  vantagens,
  onEscolher,
}: {
  titulo: string
  hint: string
  itens: { nome: string; resumo: string }[]
  valor: string
  detalhado: boolean
  /** O que se ganha escolhendo isto. Só aparece no modo iniciante. */
  vantagens: (nome: string, resumo: string) => Vantagem[]
  onEscolher: (v: string) => void
}) {
  return (
    <div>
      <TituloPasso titulo={titulo} hint={hint} />
      <div className={`mt-4 grid gap-3 ${detalhado ? '' : 'sm:grid-cols-2'}`}>
        {itens.map((it) => (
          <CartaoEscolha
            key={it.nome}
            nome={it.nome}
            resumo={it.resumo}
            ativo={valor === it.nome}
            vantagens={detalhado ? vantagens(it.nome, it.resumo) : undefined}
            onClick={() => onEscolher(it.nome)}
          />
        ))}
      </div>
    </div>
  )
}

function PassoClasse({
  s,
  set,
  detalhado,
}: {
  s: WizardState
  set: (p: Partial<WizardState>) => void
  detalhado: boolean
}) {
  return (
    <div>
      <TituloPasso titulo="Escolha sua classe" hint="O que seu personagem faz de melhor. Define pontos de vida, perícias, salvaguardas e magias." />
      <div className={`mt-4 grid gap-3 ${detalhado ? '' : 'sm:grid-cols-2'}`}>
        {CLASSES.map((c) => (
          <CartaoEscolha
            key={c.nome}
            nome={`${c.nome} (${c.nomeEn})`}
            resumo={c.resumo}
            ativo={s.classe === c.nome}
            vantagens={detalhado ? vantagensDaClasse(c.nome) : undefined}
            badges={[`Dado de vida d${c.dadoDeVida}`, c.conjuracao ? 'Conjura magias' : 'Marcial']}
            onClick={() => {
              // trocar de classe reseta as perícias de classe escolhidas
              set({ classe: c.nome, pericias: [] })
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function PassoAtributos({
  s,
  set,
  finais,
}: {
  s: WizardState
  set: (p: Partial<WizardState>) => void
  finais: Record<AbilityKey, number>
}) {
  return (
    <div>
      <TituloPasso titulo="Distribua seus atributos" hint="Os 6 valores base do personagem. O modificador (com sinal) é o que importa nas rolagens." />

      {/* Método */}
      <div className="mt-4 inline-flex flex-wrap gap-1 rounded-lg border border-white/10 bg-ink-900/50 p-1 text-xs">
        {([['arranjo', 'Arranjo padrão'], ['compra', 'Compra de pontos'], ['manual', 'Manual']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => set({ metodo: v, base: v === 'compra' ? { for: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 } : s.base })}
            className={`rounded-md px-3 py-1.5 font-semibold transition ${s.metodo === v ? 'bg-dragon-500 text-parchment-50' : 'text-parchment-200/70 hover:text-parchment-50'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-parchment-200/60">
        {s.metodo === 'arranjo' && 'Você tem os valores 15, 14, 13, 12, 10 e 8. Atribua cada um a um atributo — recomendado para iniciantes.'}
        {s.metodo === 'compra' && 'Você tem 27 pontos. Valores de 8 a 15; os mais altos custam mais caro.'}
        {s.metodo === 'manual' && 'Digite os valores diretamente (ex: se você rolou os dados na mesa).'}
      </p>

      {s.metodo === 'compra' && <ContadorPontos base={s.base} />}

      {/* Aumentos do antecedente */}
      <div className="mt-4 rounded-lg border border-white/10 bg-ink-900/40 p-3">
        <p className="flex items-center gap-1 text-sm font-semibold text-parchment-100">
          Aumentos do antecedente <InfoDot>Regra de 2024: seu antecedente concede +2 em um atributo e +1 em outro. Escolha onde aplicar (geralmente nos atributos-chave da sua classe).</InfoDot>
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-parchment-200/70">+2 em</span>
            <select className="stat-input py-1 text-sm" value={s.asiMais2} onChange={(e) => set({ asiMais2: e.target.value as AbilityKey })}>
              <option value="">—</option>
              {ABILITIES.map((a) => <option key={a.key} value={a.key} disabled={s.asiMais1 === a.key}>{a.nome}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-parchment-200/70">+1 em</span>
            <select className="stat-input py-1 text-sm" value={s.asiMais1} onChange={(e) => set({ asiMais1: e.target.value as AbilityKey })}>
              <option value="">—</option>
              {ABILITIES.map((a) => <option key={a.key} value={a.key} disabled={s.asiMais2 === a.key}>{a.nome}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Grade de atributos */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ABILITIES.map((a) => (
          <LinhaAtributo key={a.key} s={s} set={set} atributo={a} final={finais[a.key]} />
        ))}
      </div>
      {!atributosValidos(s) && (
        <p className="mt-3 text-xs text-dragon-400">
          {s.metodo === 'arranjo' && 'Atribua cada valor do arranjo exatamente uma vez.'}
          {s.metodo === 'compra' && 'Você excedeu os 27 pontos. Reduza algum atributo.'}
        </p>
      )}
    </div>
  )
}

function ContadorPontos({ base }: { base: Record<AbilityKey, number> }) {
  const usados = ABILITIES.reduce((acc, a) => acc + (CUSTO_COMPRA[base[a.key]] ?? 99), 0)
  const restam = TOTAL_COMPRA - usados
  return (
    <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-ink-900/40 px-3 py-1.5 text-sm">
      <span className="panel-title">Pontos restantes</span>
      <b className={restam < 0 ? 'text-dragon-400' : 'text-parchment-50'}>{restam}</b>
      <span className="text-parchment-200/40">/ {TOTAL_COMPRA}</span>
    </div>
  )
}

function LinhaAtributo({
  s,
  set,
  atributo,
  final,
}: {
  s: WizardState
  set: (p: Partial<WizardState>) => void
  atributo: { key: AbilityKey; nome: string; abrev: string }
  final: number
}) {
  const val = s.base[atributo.key]

  function setBase(v: number) {
    set({ base: { ...s.base, [atributo.key]: v } })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="panel-title">{atributo.nome}</span>
        <span className="text-xs text-parchment-200/50">{atributo.abrev}</span>
      </div>

      {s.metodo === 'arranjo' && (
        <select className="stat-input py-1.5" value={val} onChange={(e) => setBase(parseInt(e.target.value, 10))}>
          <option value={0}>—</option>
          {opcoesArranjo(s, atributo.key).map((v, i) => (
            <option key={i} value={v}>{v}</option>
          ))}
        </select>
      )}

      {s.metodo === 'compra' && (
        <div className="flex items-center justify-between gap-2">
          <button className="btn-ghost px-2 py-1 text-xs" disabled={val <= 8} onClick={() => setBase(val - 1)}>−</button>
          <span className="font-display text-xl text-parchment-50">{val}</span>
          <button className="btn-ghost px-2 py-1 text-xs" disabled={val >= 15} onClick={() => setBase(val + 1)}>+</button>
        </div>
      )}

      {s.metodo === 'manual' && (
        <input type="number" className="stat-input py-1.5 text-center" value={val} min={1} max={30} onChange={(e) => setBase(parseInt(e.target.value, 10) || 0)} />
      )}

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-parchment-200/50">Final: <b className="text-parchment-100">{final}</b></span>
        <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-parchment-100">{fmtMod(abilityMod(final))}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function PassoPericias({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const regra = PERICIAS_POR_CLASSE[s.classe]
  const restam = regra ? regra.quantidade - s.pericias.length : 0

  function toggle(key: SkillKey) {
    const tem = s.pericias.includes(key)
    if (tem) set({ pericias: s.pericias.filter((k) => k !== key) })
    else if (!regra || s.pericias.length < regra.quantidade) set({ pericias: [...s.pericias, key] })
  }

  const disponiveis = regra ? SKILLS.filter((sk) => regra.opcoes.includes(sk.key)) : SKILLS

  return (
    <div>
      <TituloPasso
        titulo="Escolha suas perícias"
        hint="Perícias são talentos treinados. Você soma seu bônus de proficiência nos testes delas."
      />
      {regra ? (
        <p className="mt-3 text-sm text-parchment-200/70">
          Como <b>{s.classe}</b>, escolha <b>{regra.quantidade}</b> perícia(s).{' '}
          <span className={restam === 0 ? 'text-emerald-400' : 'text-dragon-400'}>
            {restam > 0 ? `Faltam ${restam}.` : 'Tudo certo!'}
          </span>
          <br />
          <span className="text-xs text-parchment-200/50">Seu antecedente também concede perícias — some-as depois na ficha, se quiser.</span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-parchment-200/70">Marque as perícias em que seu personagem é proficiente.</p>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {disponiveis.map((sk) => {
          const marcada = s.pericias.includes(sk.key)
          const bloqueada = !marcada && regra != null && s.pericias.length >= regra.quantidade
          const atr = ABILITIES.find((a) => a.key === sk.atributo)!
          return (
            <button
              key={sk.key}
              onClick={() => toggle(sk.key)}
              disabled={bloqueada}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                marcada
                  ? 'border-dragon-400/60 bg-dragon-500/15 text-parchment-50'
                  : bloqueada
                  ? 'border-white/5 text-parchment-200/30'
                  : 'border-white/10 text-parchment-200/80 hover:bg-white/5'
              }`}
            >
              <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px] ${marcada ? 'border-dragon-400 bg-dragon-500' : 'border-white/30'}`}>
                {marcada && '✓'}
              </span>
              <span className="flex-1">{sk.nome}</span>
              <span className="text-[10px] uppercase text-parchment-200/40">{atr.abrev}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function PassoRevisao({
  s,
  finais,
  info,
}: {
  s: WizardState
  finais: Record<AbilityKey, number>
  info: ReturnType<typeof classInfo>
}) {
  const conMod = abilityMod(finais.con)
  const dado = info?.dadoDeVida ?? 8
  const pv = Math.max(1, dado + conMod)
  return (
    <div>
      <TituloPasso titulo="Confira seu personagem" hint="Se algo estiver estranho, volte e ajuste. Você também pode editar tudo na ficha depois." />
      <div className="mt-4 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-arcane-600/30 text-2xl">🧙</div>
        <div>
          <p className="font-display text-2xl text-parchment-50">{s.nome || 'Sem nome'}</p>
          <p className="text-sm text-parchment-200/60">{[s.especie, s.classe, 'Nível 1'].filter(Boolean).join(' · ')}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {ABILITIES.map((a) => (
          <div key={a.key} className="rounded-xl border border-white/10 bg-ink-900/40 p-2 text-center">
            <div className="panel-title">{a.abrev}</div>
            <div className="font-display text-lg text-parchment-50">{fmtMod(abilityMod(finais[a.key]))}</div>
            <div className="text-[10px] text-parchment-200/50">{finais[a.key]}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="chip">PV inicial {pv}</span>
        <span className="chip">CA {10 + abilityMod(finais.des)}</span>
        <span className="chip">Iniciativa {fmtMod(abilityMod(finais.des))}</span>
        <span className="chip">Dado de vida 1d{dado}</span>
        {info?.conjuracao && <span className="chip">Conjura por {ABILITIES.find((a) => a.key === info.conjuracao)?.abrev}</span>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ResumoBloco titulo="Antecedente" texto={s.antecedente || '—'} />
        <ResumoBloco titulo="Salvaguardas" texto={(info?.salvaguardas ?? []).map((k) => ABILITIES.find((a) => a.key === k)?.nome).join(', ') || '—'} />
        <ResumoBloco titulo="Perícias escolhidas" texto={s.pericias.map((k) => SKILLS.find((sk) => sk.key === k)?.nome).join(', ') || '—'} />
        <ResumoBloco titulo="Alinhamento" texto={s.alinhamento || '—'} />
      </div>
    </div>
  )
}

function ResumoBloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-ink-900/40 p-3">
      <p className="panel-title">{titulo}</p>
      <p className="mt-1 text-sm text-parchment-100">{texto}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componentes compartilhados
// ---------------------------------------------------------------------------
function TituloPasso({ titulo, hint }: { titulo: string; hint: string }) {
  return (
    <div>
      <h2 className="text-xl text-parchment-50">{titulo}</h2>
      <p className="mt-1 text-sm text-parchment-200/60">{hint}</p>
    </div>
  )
}

function CartaoEscolha({
  nome,
  resumo,
  ativo,
  badges,
  vantagens,
  onClick,
}: {
  nome: string
  resumo: string
  ativo: boolean
  badges?: string[]
  /** No modo iniciante: o que se ganha, linha a linha. */
  vantagens?: Vantagem[]
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        ativo ? 'border-dragon-400 bg-dragon-500/15 ring-1 ring-dragon-400/40' : 'border-white/10 hover:border-white/25 hover:bg-white/5'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-lg text-parchment-50">{nome}</span>
        {ativo && <span className="text-dragon-400">✓</span>}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-parchment-200/70">{resumo}</p>
      {badges && !vantagens && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {badges.map((b) => <span key={b} className="chip">{b}</span>)}
        </div>
      )}

      {/* A vantagem OBJETIVA, no instante da escolha. "Sortudo: rerrole todo 1
          natural" decide mais do que três parágrafos sobre a cultura dos
          halflings. */}
      {vantagens && vantagens.length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {vantagens.map((v) => (
            <li key={v.nome} className="flex gap-2 text-xs leading-relaxed">
              <span className="shrink-0">{v.icone}</span>
              <span className="text-parchment-200/80">
                <b className="text-parchment-100">{v.nome}:</b> {v.texto}
              </span>
            </li>
          ))}
        </ul>
      )}
    </button>
  )
}

/**
 * Iniciante ou padrão.
 *
 * Duas telas para a mesma escolha: a de quem nunca jogou, que precisa saber o
 * que ganha, e a de quem já sabe e só quer achar o nome. Uma só serviria mal
 * aos dois — a curta esconde a decisão, e a longa vira um manual que quem já
 * joga tem de rolar toda vez.
 */
function SeletorDeModo({
  detalhado,
  onTrocar,
}: {
  detalhado: boolean
  onTrocar: (v: boolean) => void
}) {
  return (
    <div className="inline-flex shrink-0 gap-1 rounded-lg border border-white/10 bg-ink-900/50 p-1 text-xs">
      {([
        [true, '🔰 Iniciante', 'Mostra o que cada escolha dá'],
        [false, 'Padrão', 'Só o nome e a descrição curta'],
      ] as const).map(([v, label, dica]) => (
        <button
          key={label}
          type="button"
          title={dica}
          onClick={() => onTrocar(v)}
          className={`rounded-md px-2.5 py-1 font-semibold transition ${
            detalhado === v ? 'bg-dragon-500 text-parchment-50' : 'text-parchment-200/70 hover:text-parchment-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// O modo escolhido sobrevive à ficha: quem é novo continua novo na próxima.
const CHAVE_MODO = 'grimorio55e.wizard.iniciante'

function lerModo(): boolean {
  try {
    // Sem nada guardado, o padrão é o modo iniciante: quem já sabe desliga uma
    // vez e nunca mais vê, e quem não sabe não precisa descobrir que existe.
    return localStorage.getItem(CHAVE_MODO) !== 'nao'
  } catch {
    return true
  }
}

function guardarModo(detalhado: boolean) {
  try {
    localStorage.setItem(CHAVE_MODO, detalhado ? 'sim' : 'nao')
  } catch {
    // Navegador sem armazenamento: o modo vale só nesta ficha, e tudo bem.
  }
}

// ---------------------------------------------------------------------------
// Lógica
// ---------------------------------------------------------------------------
function calcFinais(s: WizardState): Record<AbilityKey, number> {
  const out = { ...s.base }
  if (s.asiMais2) out[s.asiMais2] += 2
  if (s.asiMais1) out[s.asiMais1] += 1
  return out
}

// valores do arranjo ainda disponíveis, + o valor atual deste atributo
function opcoesArranjo(s: WizardState, key: AbilityKey): number[] {
  const usados = ABILITIES.filter((a) => a.key !== key).map((a) => s.base[a.key])
  const pool = [...ARRANJO_PADRAO]
  for (const u of usados) {
    const idx = pool.indexOf(u)
    if (idx >= 0) pool.splice(idx, 1)
  }
  const atual = s.base[key]
  if (atual && ARRANJO_PADRAO.includes(atual) && !pool.includes(atual)) pool.push(atual)
  return [...new Set(pool)].sort((a, b) => b - a)
}

function atributosValidos(s: WizardState): boolean {
  if (s.metodo === 'arranjo') {
    const vals = ABILITIES.map((a) => s.base[a.key]).filter((v) => v > 0)
    if (vals.length < 6) return false
    const alvo = [...ARRANJO_PADRAO].sort().join(',')
    return [...vals].sort().join(',') === alvo
  }
  if (s.metodo === 'compra') {
    const usados = ABILITIES.reduce((acc, a) => acc + (CUSTO_COMPRA[s.base[a.key]] ?? 99), 0)
    return usados <= TOTAL_COMPRA
  }
  return ABILITIES.every((a) => s.base[a.key] >= 1)
}

function periciasCompletas(s: WizardState): boolean {
  const regra = PERICIAS_POR_CLASSE[s.classe]
  if (!regra) return true
  return s.pericias.length === regra.quantidade
}

function montarFicha(s: WizardState, finais: Record<AbilityKey, number>): Character {
  const info = classInfo(s.classe)
  const dado = info?.dadoDeVida ?? 8
  const conMod = abilityMod(finais.con)
  const pv = Math.max(1, dado + conMod)
  const ficha = novaFicha()
  return {
    ...ficha,
    nome: s.nome.trim(),
    jogador: s.jogador.trim(),
    especie: s.especie,
    classe: s.classe,
    antecedente: s.antecedente,
    alinhamento: s.alinhamento,
    nivel: 1,
    atributos: finais,
    salvaguardasProficientes: info?.salvaguardas ?? [],
    periciasProficientes: s.pericias,
    atributoConjuracao: info?.conjuracao ?? null,
    espacosMagia: espacosPorNivel(s.classe, 1),
    pvMax: pv,
    pvAtual: pv,
    dadosDeVida: `1d${dado}`,
    deslocamento: 9,
  }
}
