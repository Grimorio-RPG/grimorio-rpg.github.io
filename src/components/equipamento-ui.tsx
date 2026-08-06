// A tela de equipamento: o que a pessoa veste, e o que muda quando ela troca.
//
// O ponto não é listar itens — o inventário já lista. É **ver a diferença**:
// passar o olho num item guardado e a ficha dizer "isto te dá +1 de CA e −1 de
// Furtividade" antes de você vestir. Sem isso, trocar equipamento é apostar.

import { useMemo, useState } from 'react'
import type { AbilityKey, Character, EfeitoDeItem, Equipamento, SkillKey, SlotEquipamento } from '../types'
import {
  LIMITE_SINTONIA,
  SLOTS,
  bonusDeEquipamento,
  descreveEfeito,
  desequipar,
  equipar,
  novoEquipamento,
  porSlot,
} from '../lib/equipamento'
import { ITENS_EQUIPAVEIS, doCatalogo } from '../data/itens-equipaveis'
import { armorClass, passivePerception, saveBonus, skillBonus } from '../lib/calc'
import { ABILITIES, SKILLS } from '../data/rules'
import { uid } from '../lib/character'
import { atributoComEquipamento } from '../lib/equipamento'

/**
 * O retrato da ficha que interessa numa troca.
 *
 * Só o que muda de verdade ao vestir algo. Comparar a ficha inteira produziria
 * uma lista de diferenças em que ninguém acha o que importa.
 */
interface Retrato {
  ca: number
  atributos: Record<AbilityKey, number>
  percepcaoPassiva: number
  pericias: Record<string, number>
  salvaguardas: Record<string, number>
}

function retratar(char: Character): Retrato {
  const atributos = {} as Record<AbilityKey, number>
  const salvaguardas: Record<string, number> = {}
  for (const a of ABILITIES) {
    atributos[a.key] = atributoComEquipamento(char, a.key)
    salvaguardas[a.key] = saveBonus(char, a.key)
  }
  const pericias: Record<string, number> = {}
  for (const s of SKILLS) pericias[s.key] = skillBonus(char, s.key)
  return {
    ca: armorClass(char),
    atributos,
    percepcaoPassiva: passivePerception(char),
    pericias,
    salvaguardas,
  }
}

/** As diferenças entre dois retratos, já em texto pronto. */
function diferencas(antes: Retrato, depois: Retrato): { texto: string; bom: boolean }[] {
  const fora: { texto: string; bom: boolean }[] = []
  const sinal = (n: number) => (n > 0 ? `+${n}` : `${n}`)

  if (depois.ca !== antes.ca) {
    fora.push({ texto: `${sinal(depois.ca - antes.ca)} CA`, bom: depois.ca > antes.ca })
  }
  // O atributo é mostrado como transição, e não como delta: "+5 FOR" leria
  // como cinco a mais nas rolagens, quando 16 → 21 muda o modificador só em 2.
  for (const a of ABILITIES) {
    const de = antes.atributos[a.key]
    const para = depois.atributos[a.key]
    if (de !== para) {
      fora.push({ texto: `${a.abrev} ${de} → ${para}`, bom: para > de })
    }
  }

  // E o que muda por tabela é listado, porque é onde a diferença aparece na
  // hora de rolar.
  for (const a of ABILITIES) {
    const d = depois.salvaguardas[a.key] - antes.salvaguardas[a.key]
    if (d !== 0) fora.push({ texto: `${sinal(d)} salv. ${a.abrev}`, bom: d > 0 })
  }
  for (const s of SKILLS) {
    const d = depois.pericias[s.key] - antes.pericias[s.key]
    if (d !== 0) fora.push({ texto: `${sinal(d)} ${s.nome}`, bom: d > 0 })
  }

  if (depois.percepcaoPassiva !== antes.percepcaoPassiva) {
    const d = depois.percepcaoPassiva - antes.percepcaoPassiva
    fora.push({ texto: `${sinal(d)} percep. passiva`, bom: d > 0 })
  }
  return fora
}

export function PainelDeEquipamento({
  char,
  onChange,
}: {
  char: Character
  onChange: (patch: Partial<Character>) => void
}) {
  const lista = char.equipamentos ?? []
  const vestidos = porSlot(char)
  const bonus = useMemo(() => bonusDeEquipamento(char), [char])
  const [editando, setEditando] = useState<Equipamento | null>(null)
  const [espiando, setEspiando] = useState<string | null>(null)

  const guardados = lista.filter((e) => !e.equipado)
  const excede = bonus.sintonizados - LIMITE_SINTONIA

  function setLista(nova: Equipamento[]) {
    onChange({ equipamentos: nova })
  }

  /** O que aconteceria se este item fosse vestido agora. */
  const previa = (item: Equipamento) => {
    const simulada = { ...char, equipamentos: equipar([...lista], item.id) }
    return diferencas(retratar(char), retratar(simulada))
  }

  return (
    <div className="space-y-4">
      {excede > 0 && (
        <div className="rounded-lg border border-dragon-400/50 bg-dragon-500/15 p-3 text-sm text-parchment-100">
          ⚠️ {bonus.sintonizados} itens sintonizados, e o limite é {LIMITE_SINTONIA}.{' '}
          {excede === 1 ? 'Um deles' : `${excede} deles`} não está funcionando — a regra não diz
          qual, então escolha e desfaça a sintonia.
        </div>
      )}

      {/* Os lugares do corpo */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {SLOTS.map(({ slot, nome, icone }) => {
          const item = vestidos[slot]
          return (
            <button
              key={slot}
              type="button"
              onClick={() => item && setEditando(item)}
              className={`rounded-lg border p-2 text-center transition ${
                item
                  ? 'border-arcane-400/50 bg-arcane-500/10 hover:border-arcane-400'
                  : 'border-dashed border-white/15 text-parchment-200/35 hover:border-white/30'
              }`}
              title={item ? `${item.nome} — toque para ver` : `${nome}: vazio`}
            >
              <span className="block text-2xl">{item?.icone || icone}</span>
              <span className="mt-0.5 block truncate text-[11px] text-parchment-200/60">{nome}</span>
              {item && (
                <span className="mt-0.5 block truncate text-xs font-medium text-parchment-50">
                  {item.nome}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* O que o conjunto está dando */}
      <ResumoDoConjunto char={char} />

      {/* Mochila */}
      <div className="card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="panel-title">Na mochila ({guardados.length})</p>
          <div className="flex gap-2">
            <SeletorDoCatalogo
              onEscolher={(nome) => {
                const novo = doCatalogo(nome, uid())
                if (novo) setLista([...lista, novo])
              }}
            />
            <button
              className="btn-ghost py-0.5 text-xs"
              onClick={() => setEditando(novoEquipamento())}
            >
              ＋ criar item
            </button>
          </div>
        </div>

        {guardados.length === 0 ? (
          <p className="text-xs text-parchment-200/40">
            Nada guardado. Pegue um do catálogo ou crie o seu.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {guardados.map((item) => {
              const mudancas = espiando === item.id ? previa(item) : null
              return (
                <li
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-2"
                  onMouseEnter={() => setEspiando(item.id)}
                  onMouseLeave={() => setEspiando(null)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg">{item.icone || '📦'}</span>
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setEditando(item)}
                    >
                      <span className="block truncate text-sm text-parchment-50">
                        {item.nome || 'Sem nome'}
                      </span>
                      <span className="block truncate text-[11px] text-parchment-200/50">
                        {SLOTS.find((s) => s.slot === item.slot)?.nome}
                        {item.sintonia ? ' · sintonia' : ''}
                      </span>
                    </button>
                    <button
                      className="chip shrink-0 text-xs hover:border-emerald-400/60"
                      onClick={() => setLista(equipar(lista, item.id))}
                      onFocus={() => setEspiando(item.id)}
                      onBlur={() => setEspiando(null)}
                    >
                      Vestir
                    </button>
                  </div>

                  {/* A diferença, antes de vestir. É o ponto da tela. */}
                  {mudancas && mudancas.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {mudancas.map((m) => (
                        <span
                          key={m.texto}
                          className={`rounded px-1.5 py-0.5 text-[11px] ${
                            m.bom
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-dragon-500/15 text-dragon-300'
                          }`}
                        >
                          {m.texto}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {editando && (
        <EditorDeItem
          inicial={editando}
          onFechar={() => setEditando(null)}
          onSalvar={(item) => {
            const existe = lista.some((e) => e.id === item.id)
            setLista(existe ? lista.map((e) => (e.id === item.id ? item : e)) : [...lista, item])
            setEditando(null)
          }}
          onRemover={() => {
            setLista(lista.filter((e) => e.id !== editando.id))
            setEditando(null)
          }}
          onDesequipar={() => {
            setLista(desequipar(lista, editando.id))
            setEditando(null)
          }}
        />
      )}
    </div>
  )
}

/** O que o conjunto vestido está dando, somado. */
function ResumoDoConjunto({ char }: { char: Character }) {
  const b = bonusDeEquipamento(char)
  const temAlgo =
    b.ca || b.ataque || b.dano || b.danoExtra.length || b.vantagens.length ||
    b.resistencias.length || b.deslocamento || b.sentidos.length || b.acoes.length ||
    b.condicionais.length

  if (!temAlgo) return null
  const sinal = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

  return (
    <div className="card space-y-2 p-3">
      <p className="panel-title">O que você ganha vestindo isto</p>

      <div className="flex flex-wrap gap-1.5">
        {b.ca !== 0 && <span className="chip text-xs">{sinal(b.ca)} CA</span>}
        {b.ataque !== 0 && <span className="chip text-xs">{sinal(b.ataque)} ataque</span>}
        {b.dano !== 0 && <span className="chip text-xs">{sinal(b.dano)} dano</span>}
        {b.danoExtra.map((d) => (
          <span key={d.dado + d.descricao} className="chip text-xs text-dragon-300">
            +{d.dado} {d.descricao}
          </span>
        ))}
        {b.deslocamento !== 0 && (
          <span className="chip text-xs">{sinal(b.deslocamento)} m</span>
        )}
        {b.resistencias.map((r) => (
          <span key={r} className="chip text-xs text-arcane-300">resistência a {r}</span>
        ))}
        {b.vantagens.map((v) => (
          <span key={v} className="chip text-xs text-emerald-300">vantagem em {v}</span>
        ))}
        {b.sentidos.map((s) => (
          <span key={s} className="chip text-xs">{s}</span>
        ))}
      </div>

      {/* Os que só valem contra alguém. Ficam separados porque é isso que eles
          são: não entram no total, e mostrá-los somados seria mentira. */}
      {b.condicionais.length > 0 && (
        <div className="rounded-lg border border-amber-400/25 bg-amber-500/5 p-2">
          <p className="mb-1 text-[11px] uppercase tracking-wider text-amber-300/70">
            Só contra alvos específicos
          </p>
          <ul className="space-y-0.5">
            {b.condicionais.map((c) => (
              <li key={c.contra} className="text-xs text-parchment-200/80">
                <b className="text-amber-200">contra {c.contra}:</b>{' '}
                {[
                  c.ataque ? `${sinal(c.ataque)} no ataque` : '',
                  c.dano ? `${sinal(c.dano)} no dano` : '',
                  ...c.danoExtra.map((d) => `+${d} de dano`),
                ]
                  .filter(Boolean)
                  .join(' · ')}
                <span className="text-parchment-200/40"> — {c.fontes.join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {b.acoes.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wider text-parchment-200/50">
            O que dá para usar
          </p>
          <ul className="space-y-0.5">
            {b.acoes.map((a) => (
              <li key={a.nome} className="text-xs text-parchment-200/80">
                <b className="text-parchment-50">{a.nome}</b>
                {a.usos ? ` (${a.usos})` : ''} — {a.descricao}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Pegar um item pronto. */
function SeletorDoCatalogo({ onEscolher }: { onEscolher: (nome: string) => void }) {
  return (
    <select
      value=""
      onChange={(e) => {
        if (e.target.value) onEscolher(e.target.value)
        e.target.value = ''
      }}
      className="rounded-lg border border-white/10 bg-ink-900/70 px-2 py-1 text-xs text-parchment-200/70 outline-none"
    >
      <option value="">＋ do catálogo</option>
      {ITENS_EQUIPAVEIS.map((i) => (
        <option key={i.nome} value={i.nome}>
          {i.icone} {i.nome}
        </option>
      ))}
    </select>
  )
}

export default PainelDeEquipamento

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

const TIPOS_DE_EFEITO: { tipo: EfeitoDeItem['tipo']; rotulo: string }[] = [
  { tipo: 'ca', rotulo: 'Soma na CA' },
  { tipo: 'caBase', rotulo: 'É uma armadura (base de CA)' },
  { tipo: 'ataque', rotulo: 'Soma no ataque' },
  { tipo: 'dano', rotulo: 'Soma no dano' },
  { tipo: 'danoExtra', rotulo: 'Dano extra em dado' },
  { tipo: 'atributo', rotulo: 'Soma num atributo' },
  { tipo: 'atributoFixo', rotulo: 'Define um atributo' },
  { tipo: 'salvaguarda', rotulo: 'Soma em salvaguardas' },
  { tipo: 'pericia', rotulo: 'Soma numa perícia' },
  { tipo: 'vantagem', rotulo: 'Dá vantagem' },
  { tipo: 'resistencia', rotulo: 'Dá resistência' },
  { tipo: 'deslocamento', rotulo: 'Muda o deslocamento' },
  { tipo: 'sentido', rotulo: 'Dá um sentido' },
  { tipo: 'acao', rotulo: 'Permite uma ação' },
]

function efeitoPadrao(tipo: EfeitoDeItem['tipo']): EfeitoDeItem {
  switch (tipo) {
    case 'ca': return { tipo: 'ca', valor: 1 }
    case 'caBase': return { tipo: 'caBase', valor: 12, maxDes: null }
    case 'ataque': return { tipo: 'ataque', valor: 1 }
    case 'dano': return { tipo: 'dano', valor: 1 }
    case 'danoExtra': return { tipo: 'danoExtra', dado: '1d6' }
    case 'atributo': return { tipo: 'atributo', atributo: 'for', valor: 1 }
    case 'atributoFixo': return { tipo: 'atributoFixo', atributo: 'for', valor: 19 }
    case 'salvaguarda': return { tipo: 'salvaguarda', valor: 1 }
    case 'pericia': return { tipo: 'pericia', pericia: 'percepcao', valor: 1 }
    case 'vantagem': return { tipo: 'vantagem', em: '' }
    case 'resistencia': return { tipo: 'resistencia', a: 'fogo' }
    case 'deslocamento': return { tipo: 'deslocamento', metros: 3 }
    case 'sentido': return { tipo: 'sentido', texto: 'Visão no escuro 18 m' }
    case 'acao': return { tipo: 'acao', nome: '', descricao: '' }
  }
}

/**
 * Onde a espada "+2 contra goblinoides" é escrita.
 *
 * Cada efeito é uma linha de formulário em vez de texto livre. Texto livre
 * seria mais rápido de digitar e o app não entenderia nada — que é o estado de
 * onde estamos saindo.
 */
function EditorDeItem({
  inicial,
  onSalvar,
  onFechar,
  onRemover,
  onDesequipar,
}: {
  inicial: Equipamento
  onSalvar: (e: Equipamento) => void
  onFechar: () => void
  onRemover: () => void
  onDesequipar: () => void
}) {
  const [item, setItem] = useState<Equipamento>(inicial)
  const set = (p: Partial<Equipamento>) => setItem((x) => ({ ...x, ...p }))

  const patchEfeito = (i: number, novo: EfeitoDeItem) =>
    set({ efeitos: item.efeitos.map((e, j) => (j === i ? novo : e)) })

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onFechar}
    >
      <div className="card my-8 w-full max-w-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg text-parchment-50">
            {inicial.nome || 'Item novo'}
          </h3>
          <button className="text-sm text-parchment-200/50 hover:text-parchment-100" onClick={onFechar}>
            fechar ✕
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_150px_90px]">
          <input
            className="stat-input"
            value={item.nome}
            onChange={(e) => set({ nome: e.target.value })}
            placeholder="Espada Matadora de Goblins"
          />
          <select
            className="stat-input"
            value={item.slot}
            onChange={(e) => set({ slot: e.target.value as SlotEquipamento })}
          >
            {SLOTS.map((s) => (
              <option key={s.slot} value={s.slot}>{s.nome}</option>
            ))}
          </select>
          <input
            className="stat-input text-center"
            value={item.icone ?? ''}
            onChange={(e) => set({ icone: e.target.value })}
            placeholder="⚔️"
            title="Um emoji para o item aparecer na boneca"
          />
        </div>

        <label className="mt-2 flex items-center gap-2 text-sm text-parchment-200/80">
          <input
            type="checkbox"
            checked={!!item.sintonia}
            onChange={(e) => set({ sintonia: e.target.checked })}
            className="accent-dragon-500"
          />
          Exige sintonia
          {item.sintonia && (
            <label className="ml-3 flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={!!item.sintonizado}
                onChange={(e) => set({ sintonizado: e.target.checked })}
                className="accent-emerald-500"
              />
              já sintonizado
            </label>
          )}
        </label>

        {/* Efeitos */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="panel-title">O que ele faz</p>
            <select
              value=""
              onChange={(e) => {
                if (!e.target.value) return
                set({ efeitos: [...item.efeitos, efeitoPadrao(e.target.value as EfeitoDeItem['tipo'])] })
                e.target.value = ''
              }}
              className="rounded-lg border border-white/10 bg-ink-900/70 px-2 py-1 text-xs text-parchment-200/70 outline-none"
            >
              <option value="">＋ efeito</option>
              {TIPOS_DE_EFEITO.map((t) => (
                <option key={t.tipo} value={t.tipo}>{t.rotulo}</option>
              ))}
            </select>
          </div>

          {item.efeitos.length === 0 ? (
            <p className="text-xs text-parchment-200/40">
              Nenhum efeito. Sem eles o item é só um nome na mochila — a ficha não muda.
            </p>
          ) : (
            <div className="space-y-2">
              {item.efeitos.map((ef, i) => (
                <LinhaDeEfeito
                  key={i}
                  efeito={ef}
                  onChange={(novo) => patchEfeito(i, novo)}
                  onRemover={() => set({ efeitos: item.efeitos.filter((_, j) => j !== i) })}
                />
              ))}
            </div>
          )}
        </div>

        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-parchment-200/70">Descrição</span>
          <textarea
            className="stat-input w-full"
            rows={2}
            value={item.descricao ?? ''}
            onChange={(e) => set({ descricao: e.target.value })}
            placeholder="O que não cabe em número: o gigante atingido faz salvaguarda ou cai."
          />
        </label>

        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <button className="btn-ghost text-xs text-dragon-300" onClick={onRemover}>
              Jogar fora
            </button>
            {inicial.equipado && (
              <button className="btn-ghost text-xs" onClick={onDesequipar}>
                Tirar
              </button>
            )}
          </div>
          <button className="btn-primary" onClick={() => onSalvar(item)}>
            Salvar item
          </button>
        </div>
      </div>
    </div>
  )
}

/** Uma linha de efeito, com os campos que aquele tipo pede. */
function LinhaDeEfeito({
  efeito,
  onChange,
  onRemover,
}: {
  efeito: EfeitoDeItem
  onChange: (e: EfeitoDeItem) => void
  onRemover: () => void
}) {
  const num = (v: string) => {
    const n = parseInt(v, 10)
    return Number.isFinite(n) ? n : 0
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
      <span className="min-w-0 flex-1 text-xs text-parchment-200/70">
        {descreveEfeito(efeito)}
      </span>

      {'valor' in efeito && (
        <input
          type="number"
          className="stat-input w-16"
          value={efeito.valor}
          onChange={(e) => onChange({ ...efeito, valor: num(e.target.value) } as EfeitoDeItem)}
        />
      )}
      {efeito.tipo === 'deslocamento' && (
        <input
          type="number"
          className="stat-input w-16"
          value={efeito.metros}
          onChange={(e) => onChange({ ...efeito, metros: num(e.target.value) })}
        />
      )}
      {efeito.tipo === 'danoExtra' && (
        <input
          className="stat-input w-20"
          value={efeito.dado}
          onChange={(e) => onChange({ ...efeito, dado: e.target.value })}
          placeholder="2d6"
        />
      )}
      {(efeito.tipo === 'atributo' || efeito.tipo === 'atributoFixo') && (
        <select
          className="stat-input w-20"
          value={efeito.atributo}
          onChange={(e) => onChange({ ...efeito, atributo: e.target.value as AbilityKey })}
        >
          {ABILITIES.map((a) => (
            <option key={a.key} value={a.key}>{a.abrev}</option>
          ))}
        </select>
      )}
      {efeito.tipo === 'salvaguarda' && (
        <select
          className="stat-input w-24"
          value={efeito.atributo ?? ''}
          onChange={(e) =>
            onChange({ ...efeito, atributo: (e.target.value || undefined) as AbilityKey | undefined })
          }
        >
          <option value="">todas</option>
          {ABILITIES.map((a) => (
            <option key={a.key} value={a.key}>{a.abrev}</option>
          ))}
        </select>
      )}
      {efeito.tipo === 'pericia' && (
        <select
          className="stat-input w-32"
          value={efeito.pericia}
          onChange={(e) => onChange({ ...efeito, pericia: e.target.value as SkillKey })}
        >
          {SKILLS.map((s) => (
            <option key={s.key} value={s.key}>{s.nome}</option>
          ))}
        </select>
      )}
      {efeito.tipo === 'vantagem' && (
        <input
          className="stat-input w-40"
          value={efeito.em}
          onChange={(e) => onChange({ ...efeito, em: e.target.value })}
          placeholder="Furtividade"
        />
      )}
      {efeito.tipo === 'resistencia' && (
        <input
          className="stat-input w-28"
          value={efeito.a}
          onChange={(e) => onChange({ ...efeito, a: e.target.value })}
          placeholder="fogo"
        />
      )}
      {efeito.tipo === 'sentido' && (
        <input
          className="stat-input min-w-0 flex-1"
          value={efeito.texto}
          onChange={(e) => onChange({ ...efeito, texto: e.target.value })}
        />
      )}
      {efeito.tipo === 'acao' && (
        <>
          <input
            className="stat-input w-32"
            value={efeito.nome}
            onChange={(e) => onChange({ ...efeito, nome: e.target.value })}
            placeholder="Nome"
          />
          <input
            className="stat-input min-w-0 flex-1"
            value={efeito.descricao}
            onChange={(e) => onChange({ ...efeito, descricao: e.target.value })}
            placeholder="O que acontece"
          />
        </>
      )}

      {/* O "contra o quê" — é isto que faz a espada valer só contra goblinoides. */}
      {(efeito.tipo === 'ataque' || efeito.tipo === 'dano' || efeito.tipo === 'danoExtra') && (
        <input
          className="stat-input w-32"
          value={efeito.contra ?? ''}
          onChange={(e) => onChange({ ...efeito, contra: e.target.value || undefined })}
          placeholder="só contra…"
          title="Vazio = vale sempre. Preenchido, só conta contra esse tipo de criatura."
        />
      )}

      <button
        onClick={onRemover}
        className="px-1 text-parchment-200/40 hover:text-dragon-400"
        aria-label="Remover efeito"
      >
        ✕
      </button>
    </div>
  )
}
