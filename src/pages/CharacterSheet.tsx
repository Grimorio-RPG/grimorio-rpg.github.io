import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AbilityKey, Attack, Character, SkillKey, SpellRef } from '../types'
import {
  ABILITIES,
  ALINHAMENTOS,
  ANTECEDENTES,
  CLASSES,
  ESPECIES,
  SKILLS,
} from '../data/rules'
import { SPELLS } from '../data/spells'
import {
  abilityMod,
  armorClass,
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
import { useCharacters } from '../hooks/useCharacters'
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
      <TopBar onBack={() => navigate('/fichas')} onExport={() => exportCharacter(char)} />

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

      <AttacksSection char={char} update={update} />
      <SpellsSection char={char} update={update} info={info} />

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard title="Características & Traços" hint="Habilidades da sua classe, espécie e antecedente. Ex: Fúria, Visão no Escuro, Segunda História.">
          <TextArea value={char.caracteristicas} onChange={(v) => update({ caracteristicas: v })} rows={6} placeholder="Liste aqui os traços que seu personagem ganhou…" />
        </SectionCard>
        <SectionCard title="Equipamento & Itens">
          <TextArea value={char.equipamento} onChange={(v) => update({ equipamento: v })} rows={6} placeholder="Armas, armaduras, poções, moedas…" />
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
    </div>
  )
}

// ---------------------------------------------------------------------------
function TopBar({ onBack, onExport }: { onBack: () => void; onExport: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button className="btn-ghost" onClick={onBack}>
        ← Fichas
      </button>
      <div className="flex items-center gap-2">
        <span className="chip">Salvo automaticamente ✓</span>
        <button className="btn-ghost" onClick={onExport}>
          ⬇ Exportar / enviar ao DM
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function IdentitySection({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  const info = classInfo(char.classe)
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
              options={CLASSES.map((c) => ({ value: c.nome, label: c.nome }))}
            />
          </Field>
          <Field label="Subclasse" hint="Uma especialização dentro da classe, geralmente escolhida no nível 3.">
            <SelectField
              value={char.subclasse}
              onChange={(v) => update({ subclasse: v })}
              options={(info?.subclasses ?? []).map((s) => ({ value: s, label: s }))}
              placeholder={info ? 'Selecione…' : 'Escolha a classe antes'}
            />
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
          <Field label="URL do avatar (opcional)" hint="Cole o link de uma imagem para ilustrar seu personagem.">
            <TextField value={char.avatarUrl ?? ''} onChange={(v) => update({ avatarUrl: v })} placeholder="https://…" />
          </Field>
        </div>
      </div>
    </section>
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
        <Stat label="Classe de Armadura" hint="Quão difícil é te acertar. Sem armadura = 10 + mod DES.">
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
    </SectionCard>
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
      hint="Suas armas e ações de combate. Bônus é quanto você soma ao d20 para acertar."
      action={<button className="btn-ghost" onClick={add}>+ Adicionar</button>}
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
    return SPELLS.filter(
      (s) => s.nome.toLowerCase().includes(q) && !jaTem.has(s.nome.toLowerCase()),
    ).slice(0, 6)
  }, [busca, char.magias])

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
                  <span className="text-parchment-100">{s.nome}</span>
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
