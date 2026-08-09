// A tela de equipamento: o que a pessoa veste, e o que muda quando ela troca.
//
// O ponto não é listar itens — o inventário já lista. É **ver a diferença**:
// passar o olho num item guardado e a ficha dizer "isto te dá +1 de CA e −1 de
// Furtividade" antes de você vestir. Sem isso, trocar equipamento é apostar.

import { useMemo, useState } from 'react'
import { Original } from './layout-ui'
import type { AbilityKey, Character, EfeitoDeItem, Equipamento, SkillKey, SlotEquipamento } from '../types'
import {
  BONECA,
  equiparEm,
  nomeDoSlot,
  slotsPossiveis,
  LIMITE_SINTONIA,
  SLOTS,
  bonusDeEquipamento,
  CORES_RARIDADE,
  PRECO_POR_RARIDADE,
  coresDe,
  descreveEfeito,
  desequipar,
  equipar,
  novoEquipamento,
  porSlot,
} from '../lib/equipamento'
import { ITENS_EQUIPAVEIS, doCatalogo } from '../data/itens-equipaveis'
import { reconhecerEquipaveis } from '../lib/reconhecerEquipamento'
import { TextoComTermos } from './glossario-ui'
import { armorClass } from '../lib/calc'
import { defesaSemArmadura, deslocamentoEfetivo } from '../lib/features'
import { ABILITIES, SKILLS } from '../data/rules'
import { uid } from '../lib/character'
import { ocupaDuasMaos } from '../lib/equipamento'
import { diferencas, retratar } from '../lib/comparar'

export function PainelDeEquipamento({
  char,
  onChange,
}: {
  char: Character
  onChange: (patch: Partial<Character>) => void
}) {
  const lista = char.equipamentos ?? []
  const vestidos = porSlot(char)
  const maoPrincipalDeDuasMaos =
    vestidos.maoPrincipal && ocupaDuasMaos(vestidos.maoPrincipal)
      ? vestidos.maoPrincipal
      : null
  const bonus = useMemo(() => bonusDeEquipamento(char), [char])
  const [editando, setEditando] = useState<Equipamento | null>(null)
  const [espiando, setEspiando] = useState<string | null>(null)

  const guardados = lista.filter((e) => !e.equipado)
  const excede = bonus.sintonizados - LIMITE_SINTONIA

  // O que dá para trazer do inventário de texto.
  //
  // O reconhecedor só rodava na importação, então quem importou a ficha ANTES
  // dele existir ficava com a espada e a armadura presas na mochila de texto —
  // e não havia caminho nenhum até aqui a não ser importar de novo.
  const aReconhecer = useMemo(
    () => reconhecerEquipaveis(char.inventario).equipamentos,
    [char.inventario],
  )

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

      {aReconhecer.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-arcane-400/40 bg-arcane-500/10 p-3 text-sm">
          <span className="min-w-0 flex-1 text-parchment-100">
            Achei <b>{aReconhecer.length}</b>{' '}
            {aReconhecer.length === 1 ? 'item equipável' : 'itens equipáveis'} no seu inventário —{' '}
            {aReconhecer.slice(0, 3).map((e) => e.nome).join(', ')}
            {aReconhecer.length > 3 ? ` e mais ${aReconhecer.length - 3}` : ''}.
          </span>
          <button
            className="btn-primary shrink-0 px-3 py-1 text-xs"
            onClick={() => {
              const { equipamentos, inventario } = reconhecerEquipaveis(char.inventario)
              onChange({ equipamentos: [...lista, ...equipamentos], inventario })
            }}
          >
            Trazer para cá
          </button>
        </div>
      )}

      {/* A boneca */}
      <Boneca
        vestidos={vestidos}
        maoPrincipalDeDuasMaos={maoPrincipalDeDuasMaos}
        onAbrir={setEditando}
      />

      {/* Um item de corpo que não define base de CA só soma por cima da defesa
          que a pessoa já tinha. Era o que a antiga "Armadura +1" fazia em
          silêncio: num Monge, a Defesa sem Armadura continuava valendo e a CA
          subia 1 em vez de virar a da armadura. */}
      <AvisoDeCorpoSemBase char={char} />

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
              const cor = coresDe(item.raridade)
              return (
                <li
                  key={item.id}
                  className={`rounded-lg border p-2 ${cor.anel} ${cor.fundo}`}
                  onMouseEnter={() => setEspiando(item.id)}
                  onMouseLeave={() => setEspiando(null)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg">{item.icone || '📦'}</span>
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setEditando(item)}
                    >
                      <span className={`block truncate text-sm font-medium ${cor.texto}`}>
                        {item.nome || 'Sem nome'}
                        <Original pt={item.nome} en={item.nomeOriginal} />
                        {(item.qtd ?? 1) > 1 && (
                          <span className="ml-1 text-parchment-200/50">×{item.qtd}</span>
                        )}
                      </span>
                      <span className="block truncate text-[11px] text-parchment-200/50">
                        {SLOTS.find((s) => s.slot === item.slot)?.nome}
                        {item.raridade ? ` · ${item.raridade.toLowerCase()}` : ''}
                        {item.sintonia ? ' · sintonia' : ''}
                      </span>
                    </button>
                    {/* Os lugares que vêm em par pedem escolha: uma arma de
                        uma mão cabe nas duas mãos, um anel cabe nos dois dedos.
                        Antes o app escolhia pela pessoa, e duas adagas ou dois
                        anéis eram impossíveis. Um botão por lugar. */}
                    <span className="flex shrink-0 gap-1">
                      {slotsPossiveis(item).map((slot) => (
                        <button
                          key={slot}
                          className="chip text-xs hover:border-emerald-400/60"
                          title={`Equipar em ${nomeDoSlot(slot).toLowerCase()}`}
                          onClick={() => setLista(equiparEm(lista, item.id, slot))}
                          onFocus={() => setEspiando(item.id)}
                          onBlur={() => setEspiando(null)}
                        >
                          {slotsPossiveis(item).length > 1 ? nomeDoSlot(slot) : 'Equipar'}
                        </button>
                      ))}
                    </span>
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
/**
 * A boneca: cada peça no lugar do corpo em que ela fica.
 *
 * A grade que existia antes era uma fileira de quadradinhos em ordem
 * arbitrária — dava para ver o que estava vestido, mas não dava para ler o
 * personagem. Num RPG a boneca é meia interface por si só: você bate o olho e
 * sabe que falta capa, que a mão secundária está livre, que só tem um anel.
 *
 * A silhueta atrás é o que faz as posições fazerem sentido. Sem ela, "Cinto à
 * direita do Corpo" é só mais um quadradinho num lugar esquisito.
 */
function Boneca({
  vestidos,
  maoPrincipalDeDuasMaos,
  onAbrir,
}: {
  vestidos: Partial<Record<SlotEquipamento, Equipamento>>
  maoPrincipalDeDuasMaos: Equipamento | null
  onAbrir: (item: Equipamento) => void
}) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <Silhueta />
      <div className="relative grid grid-cols-3 gap-1.5 sm:gap-2">
        {BONECA.flat().map((slot, i) => {
          if (!slot) return <div key={i} />
          const info = SLOTS.find((x) => x.slot === slot)!
          const item = vestidos[slot]
          const cor = coresDe(item?.raridade)
          // A mão vazia por causa de uma arma de duas mãos não é uma mão livre.
          // Sem dizer isso, equipar o escudo e ver o arco sumir parece defeito.
          const tomadaPelasDuasMaos =
            !item && slot === 'maoSecundaria' && !!maoPrincipalDeDuasMaos
          return (
            <button
              key={slot}
              type="button"
              onClick={() => item && onAbrir(item)}
              className={`min-h-[4.5rem] rounded-lg border p-1.5 text-center backdrop-blur-[1px] transition ${
                item
                  ? `${cor.anel} ${cor.fundo} hover:brightness-125`
                  : 'border-dashed border-white/15 bg-ink-900/30 text-parchment-200/35 hover:border-white/30'
              }`}
              title={
                item
                  ? `${item.nome} — toque para ver`
                  : tomadaPelasDuasMaos
                    ? `${maoPrincipalDeDuasMaos?.nome} ocupa as duas mãos`
                    : `${info.nome}: vazio`
              }
            >
              <span className="block text-xl leading-tight">{item?.icone || info.icone}</span>
              <span className="mt-0.5 block truncate text-[10px] uppercase tracking-wide text-parchment-200/45">
                {info.nome}
              </span>
              {item && (
                <span className={`block truncate text-[11px] font-medium leading-tight ${cor.texto}`}>
                  {item.nome}
                </span>
              )}
              {tomadaPelasDuasMaos && (
                <span className="block truncate text-[10px] text-parchment-200/40">ocupada</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * O corpo por trás dos slots.
 *
 * Fica atrás e não recebe clique nenhum: é enfeite que orienta a leitura, e um
 * enfeite que rouba o toque do slot seria pior do que não existir.
 */
function Silhueta() {
  return (
    <svg
      viewBox="0 0 100 160"
      aria-hidden
      className="pointer-events-none absolute inset-0 mx-auto h-full w-[38%] text-parchment-100/[0.13]"
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        {/* cabeça */}
        <circle cx="50" cy="18" r="13" />
        {/* pescoço e tronco */}
        <path d="M44 30h12v6l16 8c4 2 6 6 6 10v26c0 3-2 5-5 5h-4l-2-26-1 40H34l-1-40-2 26h-4c-3 0-5-2-5-5V54c0-4 2-8 6-10l16-8z" />
        {/* pernas */}
        <path d="M36 92h11l2 34-2 30h-9l-2-30z" />
        <path d="M53 92h11l2 34-2 30h-9l-2-30z" />
      </g>
    </svg>
  )
}

function AvisoDeCorpoSemBase({ char }: { char: Character }) {
  const corpo = (char.equipamentos ?? []).find((e) => e.equipado && e.slot === 'corpo')
  if (!corpo || corpo.efeitos.some((e) => e.tipo === 'caBase')) return null
  return (
    <p className="rounded-lg border border-amber-400/30 bg-amber-500/[0.07] p-2.5 text-xs text-amber-200/90">
      <b>{corpo.nome || 'O item de corpo'}</b> não define uma base de Classe de Armadura — ele só
      soma por cima do que você já tinha. Se for uma armadura de verdade, abra o item e acrescente
      o efeito <b>CA base</b>, ou troque pela versão do catálogo (Cota de Malha +1, Placas +2…).
    </p>
  )
}

/**
 * O que o conjunto está dando — de verdade.
 *
 * CA e deslocamento não são somas: são o número final MENOS o número que a
 * pessoa teria sem nada equipado. Somar os bônus dos itens mentia em dois
 * casos, e o pior era o Monge — a armadura dá CA e tira a Defesa sem Armadura,
 * então "+5 CA" podia ser, na conta real, um prejuízo. O mesmo vale para o
 * deslocamento, que o Monge também perde ao vestir armadura.
 *
 * O resto continua sendo soma, e está certo assim: bônus de ataque e de dano
 * não substituem nada, eles se acrescentam.
 */
function ResumoDoConjunto({ char }: { char: Character }) {
  const b = bonusDeEquipamento(char)

  // A mesma pessoa, sem nada equipado. É a régua contra a qual o ganho é medido.
  const semNada = useMemo(() => ({ ...char, equipamentos: [] }), [char])
  const deltaCa = armorClass(char) - armorClass(semNada)
  const deltaDeslocamento = deslocamentoEfetivo(char) - deslocamentoEfetivo(semNada)

  // Trocou a base da CA por causa de armadura? É o que explica um número menor
  // do que a soma dos itens sugere.
  const trocouADefesa = !!defesaSemArmadura(semNada) && !defesaSemArmadura(char)

  const temAlgo =
    deltaCa || b.ataque || b.dano || b.danoExtra.length || b.vantagens.length ||
    b.resistencias.length || deltaDeslocamento || b.sentidos.length || b.acoes.length ||
    b.condicionais.length

  if (!temAlgo) return null
  const sinal = (n: number) => (n >= 0 ? `+${n}` : `${n}`)
  const corDoDelta = (n: number) =>
    n > 0 ? 'text-emerald-300' : n < 0 ? 'text-dragon-300' : 'text-parchment-200/70'

  return (
    <div className="card space-y-2 p-3">
      <p className="panel-title">O que você ganha equipando isto</p>

      <div className="flex flex-wrap gap-1.5">
        {deltaCa !== 0 && (
          <span className={`chip text-xs ${corDoDelta(deltaCa)}`}>
            {sinal(deltaCa)} CA <span className="text-parchment-200/40">(CA {armorClass(char)})</span>
          </span>
        )}
        {b.ataque !== 0 && <span className="chip text-xs">{sinal(b.ataque)} ataque</span>}
        {b.dano !== 0 && <span className="chip text-xs">{sinal(b.dano)} dano</span>}
        {b.danoExtra.map((d) => (
          <span key={d.dado + d.descricao} className="chip text-xs text-dragon-300">
            +{d.dado} {d.descricao}
          </span>
        ))}
        {deltaDeslocamento !== 0 && (
          <span className={`chip text-xs ${corDoDelta(deltaDeslocamento)}`}>
            {sinal(deltaDeslocamento)} m
          </span>
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

      {/* A armadura num Monge (ou Bárbaro) não é só ganho: ela desliga a Defesa
          sem Armadura. Sem dizer isso, o número menor do que os itens prometem
          parece defeito do app. */}
      {trocouADefesa && (
        <p className="text-xs text-amber-200/90">
          A armadura substituiu a sua Defesa sem Armadura — o ganho já está com essa troca
          descontada.
        </p>
      )}

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
                {a.usos ? ` (${a.usos})` : ''} — <TextoComTermos texto={a.descricao} />
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
          <h3 className={`text-lg font-semibold ${coresDe(item.raridade).texto}`}>
            {item.nome || 'Item novo'}
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

        {/* A raridade não é enfeite: ela dá a cor e, na loja, o preço. */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-parchment-200/50">Raridade</span>
          {(['Comum', 'Incomum', 'Raro', 'Muito raro', 'Lendário'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => set({ raridade: item.raridade === r ? undefined : r })}
              className={`rounded-full border px-2 py-0.5 text-xs transition ${
                item.raridade === r
                  ? `${CORES_RARIDADE[r].anel} ${CORES_RARIDADE[r].fundo} ${CORES_RARIDADE[r].texto}`
                  : 'border-white/10 text-parchment-200/40 hover:border-white/25'
              }`}
            >
              {r}
            </button>
          ))}
          {item.raridade && (
            <span className="text-[11px] text-parchment-200/40">
              vale {PRECO_POR_RARIDADE[item.raridade].toLocaleString('pt-BR')} PO
            </span>
          )}
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

        {/* O que você escreveu, com as regras explicáveis já clicáveis. */}
        {item.descricao?.trim() && (
          <p className="mt-1.5 text-xs leading-relaxed text-parchment-200/70">
            <TextoComTermos texto={item.descricao} />
          </p>
        )}

        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <button className="btn-ghost text-xs text-dragon-300" onClick={onRemover}>
              Jogar fora
            </button>
            {inicial.equipado && (
              <button className="btn-ghost text-xs" onClick={onDesequipar}>
                Desequipar
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
