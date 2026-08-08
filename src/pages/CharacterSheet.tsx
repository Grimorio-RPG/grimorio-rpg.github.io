import { useEffect, useMemo, useRef, useState } from 'react'
import { BotaoEnviarParaMesa } from '../components/mesa-ui'
import { TracosDeClasse } from '../components/tracos-ui'
import { useNavigate, useParams } from 'react-router-dom'
import type { AbilityKey, Attack, Character, InventoryItem, SkillKey, SpellRef } from '../types'
import {
  ABILITIES,
  ALINHAMENTOS,
  ANTECEDENTES,
  CLASSES,
  CONDICOES,
  ESPECIES,
  SKILLS,
} from '../data/rules'
import { SPELLS } from '../data/spells'
import { ARMAS, ITENS_MAGICOS, acharArma } from '../data/equipment'
import { armaduraVestida } from '../lib/equipamento'
import { TALENTOS } from '../data/feats'
import { ataqueDaArma } from '../lib/weapons'
import {
  abilityMod,
  armorClass,
  armorClassDetalhe,
  classInfo,
  fmtMod,
  initiative,
  passivePerception,
  proficiencyBonus,
  saveBonus,
  skillBonus,
  spellAttackBonus,
  spellSaveDC,
} from '../lib/calc'
import { loadCharacters } from '../lib/storage'
import { uid } from '../lib/character'
import { imageToDataUrl } from '../lib/bestiary'
import { EscolhaDeSubclasse } from '../components/subclasse-ui'
import { Modal } from '../components/layout-ui'
import { useCharacters } from '../hooks/useCharacters'
import CharacterSheetView from '../components/CharacterSheetView'
import {
  Field,
  InfoDot,
  NumberField,
  SectionCard,
  SelectField,
  TextArea,
  TextField,
} from '../components/ui'
import { exportCharacter } from '../lib/storage'

export default function CharacterSheet() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { save } = useCharacters()
  const [char, setChar] = useState<Character | null>(null)
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    const found = loadCharacters().find((c) => c.id === id)
    setChar(found ?? null)
  }, [id])

  // Atualiza um campo e persiste automaticamente.
  function update(patch: Partial<Character>) {
    setChar((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      save(next)
      return next
    })
  }

  if (!char) {
    return (
      <div className="card p-10 text-center">
        <p className="text-parchment-200/70">Ficha não encontrada.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/fichas')}>
          Voltar para as fichas
        </button>
      </div>
    )
  }

  const info = classInfo(char.classe)

  return (
    <div className="space-y-6">
      <TopBar
        char={char}
        editando={editando}
        onToggleEdit={() => setEditando((v) => !v)}
        onBack={() => navigate('/fichas')}
        onExport={() => exportCharacter(char)}
      />

      {!editando ? (
        <CharacterSheetView char={char} update={update} />
      ) : (
        <>
          <IdentitySection char={char} update={update} />

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-6">
              <AbilitiesSection char={char} update={update} />
              <SavesSection char={char} update={update} />
            </div>
            <div className="space-y-6">
              <CombatSection char={char} update={update} />
              <SkillsSection char={char} update={update} />
            </div>
          </div>

          <EquipSection char={char} update={update} />

          <FeatsSection char={char} update={update} />

          <ConditionsSection char={char} update={update} />

          <AttacksSection char={char} update={update} />
          <SpellsSection char={char} update={update} info={info} />

          <InventorySection char={char} update={update} />

          <SectionCard
            title={`Traços de ${char.classe || 'classe'}`}
            hint="O que a sua classe já deu por nível, e o que ainda falta escolher."
          >
            <TracosDeClasse char={char} update={update} />
          </SectionCard>

          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard title="Características & Traços" hint="Espécie, antecedente e subclasse — o que ainda não entra na lista acima.">
              <TextArea value={char.caracteristicas} onChange={(v) => update({ caracteristicas: v })} rows={6} placeholder="Liste aqui os traços que seu personagem ganhou…" />
            </SectionCard>
            <SectionCard title="Anotações de equipamento">
              <TextArea value={char.equipamento} onChange={(v) => update({ equipamento: v })} rows={6} placeholder="Armadura equipada, sintonização, observações…" />
            </SectionCard>
            <SectionCard title="Idiomas & Proficiências">
              <Field label="Idiomas">
                <TextField value={char.idiomas} onChange={(v) => update({ idiomas: v })} placeholder="Comum, Élfico…" />
              </Field>
              <div className="mt-3">
                <Field label="Proficiências (armas, armaduras, ferramentas)">
                  <TextArea value={char.proficienciasEquipamentos} onChange={(v) => update({ proficienciasEquipamentos: v })} rows={3} />
                </Field>
              </div>
            </SectionCard>
            <SectionCard title="Anotações">
              <TextArea value={char.anotacoes} onChange={(v) => update({ anotacoes: v })} rows={6} placeholder="História, objetivos, contatos, segredos…" />
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
function TopBar({ char, editando, onToggleEdit, onBack, onExport }: { char: Character; editando: boolean; onToggleEdit: () => void; onBack: () => void; onExport: () => void }) {
  /**
   * PDF pela impressão do navegador.
   *
   * Sai com texto real — selecionável e pesquisável — e sem uma biblioteca de
   * PDF no pacote, que redesenharia a ficha à mão e viveria desatualizada em
   * relação à tela. Sair da edição antes: campos de formulário imprimem pior
   * que o texto da visão de leitura.
   */
  function imprimir() {
    if (editando) onToggleEdit()
    setTimeout(() => window.print(), 120)
  }

  return (
    <div className="nao-imprimir flex flex-wrap items-center justify-between gap-2 sm:gap-3">
      <button className="btn-ghost px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm" onClick={onBack}>
        ← Fichas
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-primary px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm" onClick={onToggleEdit}>
          {editando ? '✓ Concluir edição' : '✏️ Editar ficha'}
        </button>
        <span className="chip hidden sm:inline-flex">{editando ? 'Salvo automaticamente ✓' : 'Somente leitura'}</span>
        <BotaoEnviarParaMesa char={char} />
        <button
          className="btn-ghost px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
          onClick={imprimir}
          title="Abre a impressão do navegador — escolha 'Salvar como PDF'"
        >
          🖨️ <span className="sm:hidden">PDF</span><span className="hidden sm:inline">Imprimir / PDF</span>
        </button>
        <button className="btn-ghost px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm" onClick={onExport}>
          ⬇ <span className="sm:hidden">.json</span><span className="hidden sm:inline">Exportar (.json)</span>
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function IdentitySection({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  const info = classInfo(char.classe)
  const [comparando, setComparando] = useState(false)
  const esp = ESPECIES.find((e) => e.nome === char.especie)
  const ant = ANTECEDENTES.find((a) => a.nome === char.antecedente)
  return (
    <section className="card p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-arcane-600/30 text-3xl ring-2 ring-white/10">
            {char.avatarUrl ? <img src={char.avatarUrl} alt="" className="h-full w-full object-cover" /> : '🧙'}
          </div>
          <div className="md:hidden">
            <input
              className="stat-input"
              placeholder="Nome do personagem"
              value={char.nome}
              onChange={(e) => update({ nome: e.target.value })}
            />
          </div>
        </div>

        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nome do personagem" className="hidden md:block">
            <TextField value={char.nome} onChange={(v) => update({ nome: v })} placeholder="Ex: Aragorn" />
          </Field>
          <Field label="Jogador">
            <TextField value={char.jogador} onChange={(v) => update({ jogador: v })} placeholder="Seu nome" />
          </Field>
          <Field label="Espécie" hint={esp?.resumo ?? 'Sua ascendência (raça). Define traços como visão no escuro, deslocamento e resistências.'}>
            <SelectField
              value={char.especie}
              onChange={(v) => update({ especie: v })}
              options={ESPECIES.map((e) => ({ value: e.nome, label: e.nome }))}
            />
          </Field>
          <Field label="Classe" hint={info?.resumo ?? 'O que seu personagem faz de melhor. Define pontos de vida, magias e habilidades.'}>
            <SelectField
              value={char.classe}
              onChange={(v) => {
                const ci = CLASSES.find((c) => c.nome === v)
                update({
                  classe: v,
                  subclasse: '',
                  atributoConjuracao: ci?.conjuracao ?? null,
                  salvaguardasProficientes: ci?.salvaguardas ?? char.salvaguardasProficientes,
                })
              }}
              options={CLASSES.map((c) => ({ value: c.nome, label: `${c.nome} (${c.nomeEn})` }))}
            />
          </Field>
          <Field label="Subclasse" hint="Uma especialização dentro da classe, escolhida no nível 3.">
            <div className="flex gap-2">
              <SelectField
                value={char.subclasse}
                onChange={(v) => update({ subclasse: v })}
                options={(info?.subclasses ?? []).map((s) => ({ value: s, label: s }))}
                placeholder={info ? 'Selecione…' : 'Escolha a classe antes'}
              />
              {info && (
                <button
                  type="button"
                  className="btn-ghost shrink-0 px-3 text-xs"
                  onClick={() => setComparando(true)}
                  title="Ver o que cada subclasse faz"
                >
                  Comparar
                </button>
              )}
            </div>
          </Field>
          <Field label="Nível" hint="De 1 a 20. Sobe conforme a campanha avança e melhora quase tudo na ficha.">
            <NumberField value={char.nivel} min={1} max={20} onChange={(v) => update({ nivel: Math.max(1, Math.min(20, v)) })} />
          </Field>
          <Field label="Antecedente" hint={ant?.resumo ?? 'O passado do personagem. Nas regras de 2024, concede perícias, um talento e aumentos de atributo.'}>
            <SelectField
              value={char.antecedente}
              onChange={(v) => update({ antecedente: v })}
              options={ANTECEDENTES.map((a) => ({ value: a.nome, label: a.nome }))}
            />
          </Field>
          <Field label="Alinhamento" hint="A bússola moral do personagem. Opcional, mas ajuda na interpretação.">
            <SelectField
              value={char.alinhamento}
              onChange={(v) => update({ alinhamento: v })}
              options={ALINHAMENTOS.map((a) => ({ value: a, label: a }))}
            />
          </Field>
          <Field
            label="Imagem do personagem (opcional)"
            hint="Envie um arquivo do seu aparelho ou cole o link de uma imagem."
          >
            <AvatarUpload url={char.avatarUrl ?? ''} onChange={(v) => update({ avatarUrl: v })} />
          </Field>
        </div>
      </div>

      {comparando && (
        <Modal titulo={`Subclasses de ${char.classe}`} onClose={() => setComparando(false)} largura="max-w-2xl">
          <EscolhaDeSubclasse
            classe={char.classe}
            valor={char.subclasse}
            nivel={char.nivel}
            onEscolher={(v) => {
              update({ subclasse: v })
              setComparando(false)
            }}
          />
        </Modal>
      )}
    </section>
  )
}

/**
 * Imagem do personagem: arquivo do aparelho ou link.
 *
 * Antes só aceitava URL, o que na prática exigia hospedar a imagem em algum
 * lugar antes — barreira à toa para quem só quer usar uma foto do próprio
 * celular. 512 px basta: ela aparece como avatar redondo, não como pôster.
 */
function AvatarUpload({ url, onChange }: { url: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(file: File) {
    setErro('')
    setCarregando(true)
    try {
      onChange(await imageToDataUrl(file, 512, 0.8))
    } catch {
      setErro('Não consegui ler essa imagem. Tente um PNG ou JPG.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-ink-900/60">
          {url ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-xl opacity-40">🧙</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost py-1.5 text-xs"
            onClick={() => fileRef.current?.click()}
            disabled={carregando}
          >
            {carregando ? 'Processando…' : '📷 Enviar imagem'}
          </button>
          {url && (
            <button type="button" className="btn-ghost py-1.5 text-xs" onClick={() => onChange('')}>
              ✕ Remover
            </button>
          )}
        </div>
      </div>

      <div className="mt-2">
        <TextField value={url.startsWith('data:') ? '' : url} onChange={onChange} placeholder="…ou cole https://…" />
      </div>
      {url.startsWith('data:') && (
        <p className="mt-1 text-xs text-parchment-200/50">
          Imagem enviada do aparelho — vai junto com a ficha para a conta e para a mesa.
        </p>
      )}
      {erro && <p className="mt-1 text-xs text-dragon-400">{erro}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void enviar(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
function AbilitiesSection({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  return (
    <SectionCard title="Atributos" hint="As 6 características base. O modificador (número com sinal) é o que você soma nas rolagens.">
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-2">
        {ABILITIES.map((a) => {
          const score = char.atributos[a.key]
          const mod = abilityMod(score)
          return (
            <div key={a.key} className="rounded-xl border border-white/10 bg-ink-900/40 p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="panel-title">{a.abrev}</span>
                <InfoDot>{a.desc}</InfoDot>
              </div>
              <div className="mt-1 font-display text-2xl text-parchment-50">{fmtMod(mod)}</div>
              <input
                type="number"
                value={score}
                min={1}
                max={30}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  update({ atributos: { ...char.atributos, [a.key]: Number.isNaN(n) ? 0 : n } })
                }}
                className="mt-1 w-14 rounded-md border border-white/10 bg-ink-800 px-1 py-1 text-center text-sm outline-none focus:border-arcane-400"
              />
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
function SavesSection({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  function toggle(key: AbilityKey) {
    const has = char.salvaguardasProficientes.includes(key)
    update({
      salvaguardasProficientes: has
        ? char.salvaguardasProficientes.filter((k) => k !== key)
        : [...char.salvaguardasProficientes, key],
    })
  }
  return (
    <SectionCard title="Salvaguardas" hint="Testes de resistência: role quando algo te ameaça (veneno, medo, fogo). Marque as que sua classe é proficiente.">
      <ul className="space-y-1.5">
        {ABILITIES.map((a) => {
          const prof = char.salvaguardasProficientes.includes(a.key)
          return (
            <li key={a.key} className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-white/5">
              <button
                onClick={() => toggle(a.key)}
                aria-label={`Proficiência em salvaguarda de ${a.nome}`}
                className={`h-4 w-4 shrink-0 rounded-full border transition ${prof ? 'border-dragon-400 bg-dragon-500' : 'border-white/30'}`}
              />
              <span className="w-14 font-mono text-sm tabular-nums text-parchment-100">{fmtMod(saveBonus(char, a.key))}</span>
              <span className="text-sm text-parchment-200/80">{a.nome}</span>
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
function CombatSection({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  const usarCAauto = char.classeArmaduraManual == null
  return (
    <SectionCard title="Combate" hint="Os números que você mais usa numa luta.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Classe de Armadura" hint="Calculada pela armadura equipada + Destreza + escudo. Você pode digitar um valor para sobrepor.">
          <div className="flex items-center gap-1">
            <NumberField
              value={armorClass(char)}
              onChange={(v) => update({ classeArmaduraManual: v })}
              className="w-16"
            />
            {!usarCAauto && (
              <button
                className="text-[10px] text-arcane-400 hover:underline"
                onClick={() => update({ classeArmaduraManual: null })}
                title="Voltar a calcular automaticamente"
              >
                auto
              </button>
            )}
          </div>
        </Stat>
        <Stat label="Iniciativa" hint="Decide a ordem no combate. Igual ao seu mod de Destreza.">
          <div className="font-display text-2xl text-parchment-50">{fmtMod(initiative(char))}</div>
        </Stat>
        <Stat label="Deslocamento" hint="Metros que você anda no seu turno. Padrão: 9 m.">
          <NumberField value={char.deslocamento} onChange={(v) => update({ deslocamento: v })} className="w-16" />
        </Stat>
        <Stat label="Bônus de Prof." hint="Some quando você é proficiente. Cresce com o nível.">
          <div className="font-display text-2xl text-parchment-50">+{proficiencyBonus(char.nivel)}</div>
        </Stat>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="PV Máximo">
          <NumberField value={char.pvMax} onChange={(v) => update({ pvMax: v })} />
        </Stat>
        <Stat label="PV Atual" hint="Sua vida agora. Chega a 0 e você cai.">
          <NumberField value={char.pvAtual} onChange={(v) => update({ pvAtual: v })} />
        </Stat>
        <Stat label="PV Temporário" hint="Escudo extra de vida que some ao descansar. Não se soma ao máximo.">
          <NumberField value={char.pvTemporario} onChange={(v) => update({ pvTemporario: v })} />
        </Stat>
        <Stat label="Dados de Vida" hint="Use em descansos curtos para recuperar PV. Ex: 3d10.">
          <TextField value={char.dadosDeVida} onChange={(v) => update({ dadosDeVida: v })} className="text-center" />
        </Stat>
      </div>

      {/* Concentração e XP: dois recursos que a mesa perde de vista. */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field
          label="Concentrando em"
          hint="A magia que você mantém agora. Levar dano pede salvaguarda de Constituição."
        >
          <div className="flex gap-2">
            <TextField
              value={char.concentrando ?? ''}
              onChange={(v) => update({ concentrando: v })}
              placeholder="Nenhuma"
            />
            {char.concentrando && (
              <button
                type="button"
                className="btn-ghost shrink-0 px-3 text-xs"
                onClick={() => update({ concentrando: '' })}
                title="Perdeu ou encerrou a concentração"
              >
                Encerrar
              </button>
            )}
          </div>
        </Field>
        <Field label="Experiência (XP)" hint="Deixe em branco se a sua mesa joga por marco.">
          <NumberField
            value={char.xp ?? 0}
            min={0}
            onChange={(v) => update({ xp: Math.max(0, v) })}
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={char.inspiracaoHeroica}
            onChange={(e) => update({ inspiracaoHeroica: e.target.checked })}
            className="h-4 w-4 accent-dragon-500"
          />
          <span className="flex items-center gap-1 text-parchment-100">
            Inspiração Heroica
            <InfoDot>Um recurso que deixa você rolar de novo um d20. O DM concede por boas jogadas.</InfoDot>
          </span>
        </label>
        <span className="flex items-center gap-1.5 text-sm text-parchment-200/80">
          Percepção Passiva
          <InfoDot>O quanto você nota sem procurar ativamente. 10 + seu bônus de Percepção.</InfoDot>
          <b className="text-parchment-50">{passivePerception(char)}</b>
        </span>
      </div>

      {/* Testes de morte, exaustão e descanso */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
          <div className="mb-2 flex items-center gap-1 panel-title">
            Testes de morte
            <InfoDot>Quando você cai a 0 PV, role um d20 no seu turno: 10+ é sucesso, menos é falha. 3 sucessos = estável; 3 falhas = morte.</InfoDot>
          </div>
          <div className="space-y-1.5">
            <Pips label="Sucessos" cor="bg-emerald-500" total={3} valor={char.testesMorte.sucessos} onChange={(v) => update({ testesMorte: { ...char.testesMorte, sucessos: v } })} />
            <Pips label="Falhas" cor="bg-dragon-500" total={3} valor={char.testesMorte.falhas} onChange={(v) => update({ testesMorte: { ...char.testesMorte, falhas: v } })} />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
          <div className="mb-2 flex items-center gap-1 panel-title">
            Exaustão
            <InfoDot>Regra 2024: cada nível dá −2 cumulativo em testes de d20 e −1,5 m de deslocamento. Nível 6 = morte. Um descanso longo remove 1 nível.</InfoDot>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button className="btn-ghost px-2 py-1 text-xs" disabled={char.exaustao <= 0} onClick={() => update({ exaustao: Math.max(0, char.exaustao - 1) })}>−</button>
            <span className="font-display text-2xl text-parchment-50">{char.exaustao}</span>
            <button className="btn-ghost px-2 py-1 text-xs" disabled={char.exaustao >= 6} onClick={() => update({ exaustao: Math.min(6, char.exaustao + 1) })}>+</button>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-2 rounded-xl border border-white/10 bg-ink-900/40 p-3">
          <p className="panel-title">Dados de vida gastos</p>
          <NumberField
            value={char.dadosDeVidaUsados ?? 0}
            onChange={(v) => update({ dadosDeVidaUsados: Math.max(0, Math.min(char.nivel, v)) })}
          />
          <p className="text-center text-[11px] leading-snug text-parchment-200/50">
            Os descansos ficam na visualização da ficha.
          </p>
        </div>
      </div>
    </SectionCard>
  )
}

/** Fileira de marcadores clicáveis (para testes de morte). */
function Pips({ label, cor, total, valor, onChange }: { label: string; cor: string; total: number; valor: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-xs text-parchment-200/70">{label}</span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const cheio = i < valor
          return (
            <button
              key={i}
              aria-label={`${label} ${i + 1}`}
              onClick={() => onChange(cheio && i + 1 === valor ? i : i + 1)}
              className={`h-4 w-4 rounded-full border transition ${cheio ? `${cor} border-transparent` : 'border-white/30'}`}
            />
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3 text-center">
      <div className="mb-1 flex items-center justify-center gap-1">
        <span className="panel-title">{label}</span>
        {hint && <InfoDot>{hint}</InfoDot>}
      </div>
      <div className="flex justify-center">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function SkillsSection({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  function toggleProf(key: SkillKey) {
    const has = char.periciasProficientes.includes(key)
    update({
      periciasProficientes: has
        ? char.periciasProficientes.filter((k) => k !== key)
        : [...char.periciasProficientes, key],
      // ao remover proficiência, remove expertise também
      periciasExpertise: has ? char.periciasExpertise.filter((k) => k !== key) : char.periciasExpertise,
    })
  }
  function toggleExp(key: SkillKey) {
    if (!char.periciasProficientes.includes(key)) return
    const has = char.periciasExpertise.includes(key)
    update({
      periciasExpertise: has
        ? char.periciasExpertise.filter((k) => k !== key)
        : [...char.periciasExpertise, key],
    })
  }
  const sorted = [...SKILLS].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  return (
    <SectionCard title="Perícias" hint="Talentos específicos. Marque o círculo p/ proficiência; o quadrado p/ expertise (dobra o bônus).">
      <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {sorted.map((s) => {
          const prof = char.periciasProficientes.includes(s.key)
          const exp = char.periciasExpertise.includes(s.key)
          const atr = ABILITIES.find((a) => a.key === s.atributo)!
          return (
            <li key={s.key} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-white/5">
              <button
                onClick={() => toggleProf(s.key)}
                aria-label={`Proficiência em ${s.nome}`}
                className={`h-4 w-4 shrink-0 rounded-full border transition ${prof ? 'border-dragon-400 bg-dragon-500' : 'border-white/30'}`}
              />
              <button
                onClick={() => toggleExp(s.key)}
                aria-label={`Expertise em ${s.nome}`}
                title={prof ? 'Expertise (dobra o bônus)' : 'Precisa ser proficiente primeiro'}
                className={`h-3 w-3 shrink-0 rounded-sm border transition ${exp ? 'border-arcane-400 bg-arcane-500' : 'border-white/20'} ${!prof ? 'opacity-40' : ''}`}
              />
              <span className="w-9 font-mono text-sm tabular-nums text-parchment-100">{fmtMod(skillBonus(char, s.key))}</span>
              <span className="text-sm text-parchment-200/80">{s.nome}</span>
              <span className="ml-auto text-[10px] uppercase text-parchment-200/40">{atr.abrev}</span>
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
function AttacksSection({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  function add() {
    const novo: Attack = { id: uid(), nome: '', bonus: '', dano: '', notas: '' }
    update({ ataques: [...char.ataques, novo] })
  }
  function patch(id: string, p: Partial<Attack>) {
    update({ ataques: char.ataques.map((a) => (a.id === id ? { ...a, ...p } : a)) })
  }
  function remove(id: string) {
    update({ ataques: char.ataques.filter((a) => a.id !== id) })
  }
  return (
    <SectionCard
      title="Ataques & Ações"
      hint="Escolha uma arma do catálogo e o bônus e o dano são calculados sozinhos (Força ou Destreza + proficiência)."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="stat-input w-auto py-1 text-xs"
            value=""
            onChange={(e) => {
              const arma = acharArma(e.target.value)
              if (arma) update({ ataques: [...char.ataques, ataqueDaArma(char, arma)] })
              e.target.value = ''
            }}
          >
            <option value="">＋ Arma do catálogo…</option>
            {ARMAS.map((a) => (
              <option key={a.nome} value={a.nome}>
                {a.nome} ({a.dano} {a.tipoDano})
              </option>
            ))}
          </select>
          <button className="btn-ghost py-1 text-xs" onClick={add}>+ Em branco</button>
        </div>
      }
    >
      {char.ataques.length === 0 ? (
        <p className="py-4 text-center text-sm text-parchment-200/50">
          Nenhum ataque ainda. Adicione sua arma principal para começar.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left panel-title">
                <th className="pb-2 pr-3 font-semibold">Nome</th>
                <th className="pb-2 pr-3 font-semibold">Bônus</th>
                <th className="pb-2 pr-3 font-semibold">Dano / Tipo</th>
                <th className="pb-2 pr-3 font-semibold">Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {char.ataques.map((a) => (
                <tr key={a.id}>
                  <td className="py-1 pr-2"><input className="stat-input" value={a.nome} placeholder="Espada longa" onChange={(e) => patch(a.id, { nome: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input className="stat-input w-20 text-center" value={a.bonus} placeholder="+5" onChange={(e) => patch(a.id, { bonus: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input className="stat-input" value={a.dano} placeholder="1d8+3 cortante" onChange={(e) => patch(a.id, { dano: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input className="stat-input" value={a.notas ?? ''} placeholder="Versátil, alcance…" onChange={(e) => patch(a.id, { notas: e.target.value })} /></td>
                  <td className="py-1"><button onClick={() => remove(a.id)} className="px-2 text-parchment-200/40 hover:text-dragon-400" aria-label="Remover">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
function SpellsSection({
  char,
  update,
  info,
}: {
  char: Character
  update: (p: Partial<Character>) => void
  info: ReturnType<typeof classInfo>
}) {
  const [busca, setBusca] = useState('')
  const dc = spellSaveDC(char)
  const atk = spellAttackBonus(char)

  const sugestoes = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return []
    const jaTem = new Set(char.magias.map((m) => m.nome.toLowerCase()))
    return SPELLS
      .filter((s) => s.nome.toLowerCase().includes(q) && !jaTem.has(s.nome.toLowerCase()))
      // magias da própria classe aparecem primeiro
      .sort((a, b) => {
        const aTem = a.classes.includes(char.classe) ? 0 : 1
        const bTem = b.classes.includes(char.classe) ? 0 : 1
        return aTem - bTem || a.nivel - b.nivel
      })
      .slice(0, 8)
  }, [busca, char.magias, char.classe])

  function addMagia(nome: string, nivel: number) {
    if (!nome.trim()) return
    const nova: SpellRef = { id: uid(), nome: nome.trim(), nivel, preparada: false }
    update({ magias: [...char.magias, nova] })
    setBusca('')
  }
  function patch(id: string, p: Partial<SpellRef>) {
    update({ magias: char.magias.map((m) => (m.id === id ? { ...m, ...p } : m)) })
  }
  function remove(id: string) {
    update({ magias: char.magias.filter((m) => m.id !== id) })
  }

  const porNivel = useMemo(() => {
    const groups = new Map<number, SpellRef[]>()
    for (const m of char.magias) {
      const arr = groups.get(m.nivel) ?? []
      arr.push(m)
      groups.set(m.nivel, arr)
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0])
  }, [char.magias])

  const conjura = info?.conjuracao != null || char.atributoConjuracao != null

  return (
    <SectionCard
      title="Magias"
      hint="Truques (nível 0) e feitiços que você conhece. A CD é a dificuldade para os inimigos resistirem."
    >
      {conjura ? (
        <div className="mb-4 flex flex-wrap gap-3">
          <span className="chip">Atributo de conjuração: <b className="ml-1">{ABILITIES.find((a) => a.key === char.atributoConjuracao)?.abrev ?? '—'}</b></span>
          <span className="chip">CD de magia: <b className="ml-1">{dc ?? '—'}</b></span>
          <span className="chip">Ataque de magia: <b className="ml-1">{atk != null ? fmtMod(atk) : '—'}</b></span>
        </div>
      ) : (
        <p className="mb-4 text-sm text-parchment-200/50">
          Esta classe normalmente não conjura magias — mas você pode adicionar magias mesmo assim (ex: de talentos).
        </p>
      )}

      <SpellSlots char={char} update={update} />

      {/* Busca / adicionar */}
      <div className="relative mb-4">
        <input
          className="stat-input"
          value={busca}
          placeholder="Buscar feitiço no catálogo ou digitar um nome…"
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && busca.trim()) addMagia(busca, sugestoes[0]?.nivel ?? 0)
          }}
        />
        {sugestoes.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-ink-900 shadow-xl">
            {sugestoes.map((s) => (
              <li key={s.id}>
                <button
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white/5"
                  onClick={() => addMagia(s.nome, s.nivel)}
                >
                  <span className="flex items-center gap-2 text-parchment-100">
                    {s.nome}
                    {s.classes.includes(char.classe) && (
                      <span className="rounded-full bg-arcane-500/25 px-1.5 py-0.5 text-[10px] text-arcane-400">{char.classe}</span>
                    )}
                  </span>
                  <span className="text-xs text-parchment-200/50">{s.nivel === 0 ? 'Truque' : `Nível ${s.nivel}`}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {char.magias.length === 0 ? (
        <p className="py-2 text-center text-sm text-parchment-200/50">
          Nenhuma magia ainda. Busque acima (tente “bola de fogo”) ou consulte a aba Feitiços.
        </p>
      ) : (
        <div className="space-y-4">
          {porNivel.map(([nivel, magias]) => (
            <div key={nivel}>
              <h3 className="mb-1.5 panel-title">{nivel === 0 ? 'Truques' : `Nível ${nivel}`}</h3>
              <ul className="space-y-1">
                {magias.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={m.preparada}
                      onChange={(e) => patch(m.id, { preparada: e.target.checked })}
                      title="Preparada"
                      className="h-4 w-4 accent-arcane-500"
                    />
                    <span className="flex-1 text-sm text-parchment-100">{m.nome}</span>
                    <select
                      value={m.nivel}
                      onChange={(e) => patch(m.id, { nivel: parseInt(e.target.value, 10) })}
                      className="rounded-md border border-white/10 bg-ink-800 px-1.5 py-0.5 text-xs"
                    >
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i} value={i}>{i === 0 ? 'Truque' : `Nv ${i}`}</option>
                      ))}
                    </select>
                    <button onClick={() => remove(m.id)} className="px-1 text-parchment-200/40 hover:text-dragon-400" aria-label="Remover">✕</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
function SpellSlots({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  function setSlot(nivel: number, patch: Partial<{ total: number; usados: number }>) {
    const espacos = char.espacosMagia.map((s, i) => (i === nivel - 1 ? { ...s, ...patch } : s))
    update({ espacosMagia: espacos })
  }
  const algum = char.espacosMagia.some((s) => s.total > 0)
  return (
    <div className="mb-4 rounded-lg border border-white/10 bg-ink-900/40 p-3">
      <div className="mb-2 flex items-center gap-1 panel-title">
        Espaços de magia
        <InfoDot>Recursos que você gasta para conjurar magias de 1º nível ou mais. Defina o total de cada nível e clique nos marcadores conforme usa. O descanso longo recarrega tudo.</InfoDot>
      </div>
      {!algum && <p className="mb-2 text-xs text-parchment-200/50">Defina o total de espaços por nível (deixe 0 nos que você não tem).</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {char.espacosMagia.map((slot, i) => {
          const nivel = i + 1
          return (
            <div key={nivel} className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
              <span className="w-14 shrink-0 text-xs text-parchment-200/70">Nível {nivel}</span>
              <input
                type="number"
                min={0}
                max={9}
                value={slot.total}
                onChange={(e) => {
                  const total = Math.max(0, parseInt(e.target.value, 10) || 0)
                  setSlot(nivel, { total, usados: Math.min(slot.usados, total) })
                }}
                title="Total"
                className="w-12 shrink-0 rounded border border-white/10 bg-ink-800 px-1 py-0.5 text-center text-xs outline-none focus:border-arcane-400"
              />
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: slot.total }, (_, j) => {
                  const usado = j < slot.usados
                  return (
                    <button
                      key={j}
                      aria-label={`Espaço ${j + 1} nível ${nivel}`}
                      title={usado ? 'Gasto' : 'Disponível'}
                      onClick={() => setSlot(nivel, { usados: usado && j + 1 === slot.usados ? j : j + 1 })}
                      className={`h-3.5 w-3.5 rounded-sm border transition ${usado ? 'border-transparent bg-arcane-500' : 'border-white/30'}`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
/**
 * Armadura e escudo saíram daqui.
 *
 * Eram dois campos próprios — uma lista de armaduras e uma caixa de escudo —
 * que descreviam a mesma coisa que os itens vestidos. Duas verdades sobre a
 * mesma CA: marcar a caixa E vestir o escudo somava +2 duas vezes, e um Monge
 * de Cota de Malha no slot continuava recebendo Defesa sem Armadura, porque o
 * traço olhava só o campo antigo.
 *
 * Agora se veste na boneca, no modo de leitura. O que sobra aqui é o que esta
 * tela sabe fazer melhor: mostrar a conta e deixar sobrescrever.
 */
function EquipSection({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  const armadura = armaduraVestida(char)
  const usandoManual = char.classeArmaduraManual != null
  return (
    <SectionCard
      title="Classe de Armadura"
      hint="A armadura e o escudo são vestidos no painel de Equipamento, fechando a ficha. Aqui você confere a conta."
    >
      <p className="text-sm text-parchment-100">
        CA atual: <b className="text-lg text-parchment-50">{armorClass(char)}</b>
      </p>
      <p className="mt-1 text-xs text-parchment-200/50">{armorClassDetalhe(char)}</p>

      {armadura && (armadura.furtividadeRuim || armadura.forcaMinima) && (
        <p className="mt-3 text-xs text-amber-400">
          ⚠ {armadura.furtividadeRuim && 'Desvantagem em testes de Furtividade. '}
          {armadura.forcaMinima && `Exige Força ${armadura.forcaMinima} (senão seu deslocamento cai 3 m).`}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Field label="Sobrescrever">
          <input
            type="number"
            className="input w-24"
            value={char.classeArmaduraManual ?? ''}
            placeholder="auto"
            onChange={(e) =>
              update({ classeArmaduraManual: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        </Field>
        {usandoManual && (
          <button
            className="text-left text-[11px] text-arcane-400 hover:underline"
            onClick={() => update({ classeArmaduraManual: null })}
          >
            Voltar a calcular automaticamente
          </button>
        )}
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
function FeatsSection({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  const [aberto, setAberto] = useState(false)
  const escolhidos = TALENTOS.filter((t) => char.talentos.includes(t.nome))
  const disponiveis = TALENTOS.filter((t) => !char.talentos.includes(t.nome))

  return (
    <SectionCard
      title="Talentos"
      hint="Nas regras de 2024 você ganha um talento de origem no nível 1 (pelo antecedente) e escolhe outros nos níveis 4, 8, 12, 16 e 19."
      action={<button className="btn-ghost py-1 text-xs" onClick={() => setAberto((v) => !v)}>{aberto ? 'Fechar' : '+ Adicionar'}</button>}
    >
      {escolhidos.length === 0 ? (
        <p className="text-sm text-parchment-200/50">Nenhum talento ainda.</p>
      ) : (
        <ul className="space-y-2">
          {escolhidos.map((t) => (
            <li key={t.nome} className="flex items-start gap-2 rounded-lg border border-white/10 bg-ink-900/40 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-parchment-50">
                  {t.nome} <span className="chip ml-1 text-[10px]">{t.categoria}</span>
                </p>
                <p className="mt-0.5 text-xs text-parchment-200/70">{t.resumo}</p>
              </div>
              <button
                className="px-1 text-parchment-200/40 hover:text-dragon-400"
                onClick={() => update({ talentos: char.talentos.filter((n) => n !== t.nome) })}
                aria-label="Remover talento"
              >✕</button>
            </li>
          ))}
        </ul>
      )}

      {aberto && (
        <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto border-t border-white/10 pt-3">
          {disponiveis.map((t) => (
            <button
              key={t.nome}
              onClick={() => update({ talentos: [...char.talentos, t.nome] })}
              className="block w-full rounded-lg border border-white/10 p-2.5 text-left transition hover:border-dragon-400/50 hover:bg-white/5"
            >
              <p className="text-sm text-parchment-50">
                {t.nome} <span className="chip ml-1 text-[10px]">{t.categoria}</span>
                {t.requisito && <span className="ml-1 text-[10px] text-amber-400">{t.requisito}</span>}
              </p>
              <p className="mt-0.5 text-xs text-parchment-200/60">{t.resumo}</p>
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
function ConditionsSection({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  function toggle(nome: string) {
    const tem = char.condicoes.includes(nome)
    update({ condicoes: tem ? char.condicoes.filter((c) => c !== nome) : [...char.condicoes, nome] })
  }
  return (
    <SectionCard title="Condições" hint="Estados que afetam o personagem em jogo. Clique para ativar; passe o mouse para ver o efeito.">
      <div className="flex flex-wrap gap-2">
        {CONDICOES.map((c) => {
          const ativa = char.condicoes.includes(c.nome)
          return (
            <button
              key={c.nome}
              onClick={() => toggle(c.nome)}
              title={c.desc}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                ativa ? 'border-dragon-400 bg-dragon-500/20 text-parchment-50' : 'border-white/10 text-parchment-200/70 hover:bg-white/5'
              }`}
            >
              {ativa ? '● ' : ''}{c.nome}
            </button>
          )
        })}
      </div>
      {char.condicoes.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-sm">
          {CONDICOES.filter((c) => char.condicoes.includes(c.nome)).map((c) => (
            <li key={c.nome} className="leading-relaxed">
              <b className="text-dragon-400">{c.nome}.</b>{' '}
              <span className="text-parchment-200/80">{c.desc}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
const MOEDAS: { key: keyof Character['moedas']; nome: string; cor: string }[] = [
  { key: 'pc', nome: 'PC', cor: 'text-amber-700' },
  { key: 'pp', nome: 'PP', cor: 'text-slate-300' },
  { key: 'pe', nome: 'PE', cor: 'text-cyan-300' },
  { key: 'po', nome: 'PO', cor: 'text-amber-400' },
  { key: 'pl', nome: 'PL', cor: 'text-sky-200' },
]

function InventorySection({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  function addItem() {
    const novo: InventoryItem = { id: uid(), nome: '', qtd: 1, peso: 0, notas: '' }
    update({ inventario: [...char.inventario, novo] })
  }
  function patch(id: string, p: Partial<InventoryItem>) {
    update({ inventario: char.inventario.map((it) => (it.id === id ? { ...it, ...p } : it)) })
  }
  function remove(id: string) {
    update({ inventario: char.inventario.filter((it) => it.id !== id) })
  }
  const pesoTotal = char.inventario.reduce((acc, it) => acc + (it.peso || 0) * (it.qtd || 0), 0)

  return (
    <SectionCard
      title="Inventário & Moedas"
      hint="Itens que você carrega e seu dinheiro. PC=cobre, PP=prata, PE=electro, PO=ouro, PL=platina."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="stat-input w-auto py-1 text-xs"
            value=""
            onChange={(e) => {
              const it = ITENS_MAGICOS.find((x) => x.nome === e.target.value)
              if (it) {
                update({
                  inventario: [...char.inventario, {
                    id: uid(),
                    nome: it.nome,
                    qtd: 1,
                    peso: 0,
                    notas: `${it.raridade}${it.sintonia ? ' · requer sintonia' : ''} — ${it.resumo}`,
                  }],
                })
              }
              e.target.value = ''
            }}
          >
            <option value="">＋ Item mágico…</option>
            {ITENS_MAGICOS.map((it) => (
              <option key={it.nome} value={it.nome}>{it.nome} ({it.raridade})</option>
            ))}
          </select>
          <button className="btn-ghost py-1 text-xs" onClick={addItem}>+ Item</button>
        </div>
      }
    >
      {/* Moedas */}
      <div className="mb-4 flex flex-wrap gap-2">
        {MOEDAS.map((m) => (
          <label key={m.key} className="flex items-center gap-2 rounded-lg border border-white/10 bg-ink-900/40 px-3 py-2">
            <span className={`font-display text-sm font-bold ${m.cor}`}>{m.nome}</span>
            <input
              type="number"
              min={0}
              value={char.moedas[m.key]}
              onChange={(e) => update({ moedas: { ...char.moedas, [m.key]: Math.max(0, parseInt(e.target.value, 10) || 0) } })}
              className="w-16 rounded border border-white/10 bg-ink-800 px-1 py-1 text-center text-sm outline-none focus:border-arcane-400"
            />
          </label>
        ))}
      </div>

      {/* Itens */}
      {char.inventario.length === 0 ? (
        <p className="py-2 text-center text-sm text-parchment-200/50">Nenhum item. Clique em “+ Item” para adicionar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left panel-title">
                <th className="pb-2 pr-3 font-semibold">Item</th>
                <th className="pb-2 pr-3 font-semibold">Qtd</th>
                <th className="pb-2 pr-3 font-semibold">Peso (kg)</th>
                <th className="pb-2 pr-3 font-semibold">Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {char.inventario.map((it) => (
                <tr key={it.id}>
                  <td className="py-1 pr-2"><input className="stat-input" value={it.nome} placeholder="Poção de cura" onChange={(e) => patch(it.id, { nome: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input type="number" min={0} className="stat-input w-16 text-center" value={it.qtd} onChange={(e) => patch(it.id, { qtd: Math.max(0, parseInt(e.target.value, 10) || 0) })} /></td>
                  <td className="py-1 pr-2"><input type="number" min={0} step={0.1} className="stat-input w-20 text-center" value={it.peso} onChange={(e) => patch(it.id, { peso: Math.max(0, parseFloat(e.target.value) || 0) })} /></td>
                  <td className="py-1 pr-2"><input className="stat-input" value={it.notas} placeholder="Sintonização, efeito…" onChange={(e) => patch(it.id, { notas: e.target.value })} /></td>
                  <td className="py-1"><button onClick={() => remove(it.id)} className="px-2 text-parchment-200/40 hover:text-dragon-400" aria-label="Remover">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {pesoTotal > 0 && <p className="mt-2 text-right text-xs text-parchment-200/50">Peso total: <b className="text-parchment-100">{pesoTotal.toFixed(1)} kg</b></p>}
        </div>
      )}
    </SectionCard>
  )
}
