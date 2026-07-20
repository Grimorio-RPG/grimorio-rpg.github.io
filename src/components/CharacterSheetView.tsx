import type { Character } from '../types'
import { ABILITIES, CONDICOES, SKILLS } from '../data/rules'
import {
  abilityMod,
  armorClass,
  classInfo,
  fmtMod,
  initiative,
  passivePerception,
  passiveSkill,
  proficiencyBonus,
  saveBonus,
  skillBonus,
  spellAttackBonus,
  spellSaveDC,
} from '../lib/calc'

const MOEDAS: { key: keyof Character['moedas']; nome: string }[] = [
  { key: 'pc', nome: 'PC' }, { key: 'pp', nome: 'PP' }, { key: 'pe', nome: 'PE' },
  { key: 'po', nome: 'PO' }, { key: 'pl', nome: 'PL' },
]

/** Visualização somente-leitura da ficha completa (modo de consulta). */
export default function CharacterSheetView({ char }: { char: Character }) {
  const info = classInfo(char.classe)
  const dc = spellSaveDC(char)
  const atk = spellAttackBonus(char)
  const temMoedas = MOEDAS.some((m) => char.moedas[m.key] > 0)
  const temEstado = char.condicoes.length > 0 || char.exaustao > 0 || char.testesMorte.sucessos > 0 || char.testesMorte.falhas > 0
  const espacos = char.espacosMagia.map((s, i) => ({ nivel: i + 1, ...s })).filter((s) => s.total > 0)
  const magiasPorNivel = [...new Set(char.magias.map((m) => m.nivel))].sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <section className="card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-arcane-600/30 text-3xl ring-2 ring-white/10">
            {char.avatarUrl ? <img src={char.avatarUrl} alt="" className="h-full w-full object-cover" /> : '🧙'}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-2xl text-parchment-50">{char.nome || 'Sem nome'}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {char.especie && <span className="chip">{char.especie}</span>}
              {char.classe && <span className="chip">{char.classe}{char.subclasse ? ` · ${char.subclasse}` : ''}</span>}
              <span className="chip">Nível {char.nivel}</span>
              {char.antecedente && <span className="chip">{char.antecedente}</span>}
              {char.alinhamento && <span className="chip">{char.alinhamento}</span>}
              {char.jogador && <span className="chip">Jogador: {char.jogador}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Combate — números principais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Big label="Classe de Armadura" valor={armorClass(char)} />
        <Big label="Iniciativa" valor={fmtMod(initiative(char))} />
        <Big label="Deslocamento" valor={`${char.deslocamento} m`} />
        <Big label="Pontos de Vida" valor={`${char.pvAtual}/${char.pvMax}`} sub={char.pvTemporario > 0 ? `+${char.pvTemporario} temp` : undefined} />
        <Big label="Prof." valor={`+${proficiencyBonus(char.nivel)}`} />
        <Big label="Percep. Passiva" valor={passivePerception(char)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-6">
          {/* Atributos */}
          <section className="card p-5">
            <h3 className="mb-3 panel-title">Atributos</h3>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-2">
              {ABILITIES.map((a) => (
                <div key={a.key} className="rounded-xl border border-white/10 bg-ink-900/40 p-3 text-center">
                  <div className="panel-title">{a.abrev}</div>
                  <div className="font-display text-2xl text-parchment-50">{fmtMod(abilityMod(char.atributos[a.key]))}</div>
                  <div className="text-xs text-parchment-200/50">{char.atributos[a.key]}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Salvaguardas */}
          <section className="card p-5">
            <h3 className="mb-3 panel-title">Salvaguardas</h3>
            <ul className="space-y-1.5">
              {ABILITIES.map((a) => (
                <Linha key={a.key} prof={char.salvaguardasProficientes.includes(a.key)} valor={saveBonus(char, a.key)} nome={a.nome} />
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          {/* Perícias */}
          <section className="card p-5">
            <h3 className="mb-3 panel-title">Perícias</h3>
            <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {[...SKILLS].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((s) => {
                const prof = char.periciasProficientes.includes(s.key)
                const exp = char.periciasExpertise.includes(s.key)
                const atr = ABILITIES.find((a) => a.key === s.atributo)!
                return (
                  <li key={s.key} className="flex items-center gap-2 py-0.5">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${exp ? 'bg-arcane-500' : prof ? 'bg-dragon-500' : 'border border-white/25'}`} />
                    <span className="w-9 font-mono text-sm tabular-nums text-parchment-100">{fmtMod(skillBonus(char, s.key))}</span>
                    <span className={`text-sm ${prof || exp ? 'text-parchment-50' : 'text-parchment-200/70'}`}>{s.nome}</span>
                    <span className="ml-auto text-[10px] uppercase text-parchment-200/40">{atr.abrev}</span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 flex gap-4 border-t border-white/5 pt-2 text-xs text-parchment-200/60">
              <span>Investigação passiva <b className="text-parchment-100">{passiveSkill(char, 'investigacao')}</b></span>
              <span>Intuição passiva <b className="text-parchment-100">{passiveSkill(char, 'intuicao')}</b></span>
            </div>
          </section>
        </div>
      </div>

      {/* Estado (só se houver algo) */}
      {temEstado && (
        <section className="card p-5">
          <h3 className="mb-3 panel-title">Estado</h3>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {(char.testesMorte.sucessos > 0 || char.testesMorte.falhas > 0) && (
              <span>Testes de morte: <b className="text-emerald-400">{char.testesMorte.sucessos}✓</b> <b className="text-dragon-400">{char.testesMorte.falhas}✗</b></span>
            )}
            {char.exaustao > 0 && <span>Exaustão: <b className="text-parchment-50">nível {char.exaustao}</b></span>}
          </div>
          {char.condicoes.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {CONDICOES.filter((c) => char.condicoes.includes(c.nome)).map((c) => (
                <li key={c.nome}><b className="text-dragon-400">{c.nome}.</b> <span className="text-parchment-200/80">{c.desc}</span></li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Ataques */}
      {char.ataques.length > 0 && (
        <section className="card p-5">
          <h3 className="mb-3 panel-title">Ataques & Ações</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left panel-title"><th className="pb-2 pr-3">Nome</th><th className="pb-2 pr-3">Bônus</th><th className="pb-2 pr-3">Dano</th><th className="pb-2">Notas</th></tr></thead>
              <tbody>
                {char.ataques.map((a) => (
                  <tr key={a.id} className="border-t border-white/5">
                    <td className="py-1.5 pr-3 font-medium text-parchment-50">{a.nome || '—'}</td>
                    <td className="py-1.5 pr-3 tabular-nums text-parchment-100">{a.bonus}</td>
                    <td className="py-1.5 pr-3 text-parchment-100">{a.dano}</td>
                    <td className="py-1.5 text-xs text-parchment-200/60">{a.notas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Magias */}
      {(char.magias.length > 0 || espacos.length > 0 || char.atributoConjuracao) && (
        <section className="card p-5">
          <h3 className="mb-3 panel-title">Magias</h3>
          <div className="mb-3 flex flex-wrap gap-2 text-sm">
            {char.atributoConjuracao && <span className="chip">Conjuração: {ABILITIES.find((a) => a.key === char.atributoConjuracao)?.abrev}</span>}
            {dc != null && <span className="chip">CD {dc}</span>}
            {atk != null && <span className="chip">Ataque {fmtMod(atk)}</span>}
          </div>
          {espacos.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-3">
              {espacos.map((s) => (
                <div key={s.nivel} className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs">
                  <span className="text-parchment-200/70">Nível {s.nivel}</span>
                  <span className="flex gap-0.5">
                    {Array.from({ length: s.total }, (_, i) => (
                      <span key={i} className={`h-2.5 w-2.5 rounded-sm ${i < s.usados ? 'bg-arcane-500' : 'border border-white/30'}`} />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          )}
          {magiasPorNivel.map((nivel) => (
            <div key={nivel} className="mt-2">
              <h4 className="panel-title">{nivel === 0 ? 'Truques' : `Nível ${nivel}`}</h4>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {char.magias.filter((m) => m.nivel === nivel).map((m) => (
                  <span key={m.id} className={`chip ${m.preparada ? 'border-arcane-400/50' : ''}`}>{m.nome}</span>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Textos e inventário */}
      <div className="grid gap-6 md:grid-cols-2">
        {char.caracteristicas && <Texto titulo="Características & Traços" texto={char.caracteristicas} />}
        {(char.inventario.length > 0 || temMoedas) && (
          <section className="card p-5">
            <h3 className="mb-3 panel-title">Inventário & Moedas</h3>
            {temMoedas && (
              <div className="mb-3 flex flex-wrap gap-2 text-sm">
                {MOEDAS.filter((m) => char.moedas[m.key] > 0).map((m) => (
                  <span key={m.key} className="chip">{char.moedas[m.key]} {m.nome}</span>
                ))}
              </div>
            )}
            {char.inventario.length > 0 && (
              <ul className="space-y-1 text-sm">
                {char.inventario.map((it) => (
                  <li key={it.id} className="flex justify-between gap-2">
                    <span className="text-parchment-100">{it.qtd > 1 ? `${it.qtd}× ` : ''}{it.nome}</span>
                    {it.notas && <span className="text-xs text-parchment-200/50">{it.notas}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {(char.idiomas || char.proficienciasEquipamentos) && (
          <section className="card p-5">
            <h3 className="mb-2 panel-title">Idiomas & Proficiências</h3>
            {char.idiomas && <p className="text-sm text-parchment-100"><span className="text-parchment-200/60">Idiomas:</span> {char.idiomas}</p>}
            {char.proficienciasEquipamentos && <p className="mt-1 whitespace-pre-wrap text-sm text-parchment-200/80">{char.proficienciasEquipamentos}</p>}
          </section>
        )}
        {char.equipamento && <Texto titulo="Anotações de equipamento" texto={char.equipamento} />}
        {char.anotacoes && <Texto titulo="Anotações" texto={char.anotacoes} />}
      </div>

      {info && (
        <p className="text-center text-xs text-parchment-200/40">{info.resumo}</p>
      )}
    </div>
  )
}

function Big({ label, valor, sub }: { label: string; valor: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/70 p-3 text-center">
      <div className="panel-title">{label}</div>
      <div className="font-display text-2xl text-parchment-50">{valor}</div>
      {sub && <div className="text-[10px] text-parchment-200/50">{sub}</div>}
    </div>
  )
}

function Linha({ prof, valor, nome }: { prof: boolean; valor: number; nome: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`h-3 w-3 shrink-0 rounded-full ${prof ? 'bg-dragon-500' : 'border border-white/25'}`} />
      <span className="w-12 font-mono text-sm tabular-nums text-parchment-100">{fmtMod(valor)}</span>
      <span className={`text-sm ${prof ? 'text-parchment-50' : 'text-parchment-200/70'}`}>{nome}</span>
    </li>
  )
}

function Texto({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <section className="card p-5">
      <h3 className="mb-2 panel-title">{titulo}</h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-parchment-100">{texto}</p>
    </section>
  )
}
