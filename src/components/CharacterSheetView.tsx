import { useMemo, useState } from 'react'
import { PainelDeAcoes } from './acoes-ui'
import type { Character } from '../types'
import { PainelDeEquipamento } from './equipamento-ui'
import { bonusDeEquipamento } from '../lib/equipamento'
import { ABILITIES, CONDICOES, SKILLS, rotuloClasse } from '../data/rules'
import { ACOES_GERAIS, ROTULO_TIPO, acoesDaClasse, type AcaoInfo } from '../data/actions'
import { spellsDaClasse } from '../data/spells'
import { acharTalento } from '../data/feats'
import { RollButton, RollTextButton, rolarComModo } from './dice-ui'
import { LevelUpModal, RestPanel } from './rest-levelup'
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
export default function CharacterSheetView({
  char,
  update,
}: {
  char: Character
  update: (patch: Partial<Character>) => void
}) {
  const [subindoNivel, setSubindoNivel] = useState(false)
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
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl text-parchment-50">{char.nome || 'Sem nome'}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {char.especie && <span className="chip">{char.especie}</span>}
              {char.classe && <span className="chip">{rotuloClasse(char.classe)}{char.subclasse ? ` · ${char.subclasse}` : ''}</span>}
              <span className="chip">Nível {char.nivel}</span>
              {char.antecedente && <span className="chip">{char.antecedente}</span>}
              {char.alinhamento && <span className="chip">{char.alinhamento}</span>}
              {char.jogador && <span className="chip">Jogador: {char.jogador}</span>}
            </div>
          </div>
          {char.nivel < 20 && (
            <button className="btn-primary shrink-0 px-3 py-1.5 text-xs sm:text-sm" onClick={() => setSubindoNivel(true)}>
              ⬆ Subir de nível
            </button>
          )}
        </div>
      </section>

      {/* Combate — números principais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Big
          label="Classe de Armadura"
          valor={armorClass(char)}
          sub={[char.armaduraEquipada, char.escudoEquipado ? 'escudo' : ''].filter(Boolean).join(' + ') || undefined}
        />
        <Big
          label="Iniciativa"
          valor={fmtMod(initiative(char))}
          onRoll={() => rolarComModo(1, 20, initiative(char), 'Iniciativa')}
        />
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
                <button
                  key={a.key}
                  onClick={() => rolarComModo(1, 20, abilityMod(char.atributos[a.key]), `Teste de ${a.nome}`)}
                  title={`Rolar teste de ${a.nome}`}
                  className="rounded-xl border border-white/10 bg-ink-900/40 p-3 text-center transition hover:border-arcane-400/50 hover:bg-arcane-500/10 active:scale-95"
                >
                  <div className="panel-title">{a.abrev}</div>
                  <div className="font-display text-2xl text-parchment-50">{fmtMod(abilityMod(char.atributos[a.key]))}</div>
                  <div className="text-xs text-parchment-200/50">{char.atributos[a.key]}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Salvaguardas */}
          <section className="card p-5">
            <h3 className="mb-3 panel-title">Salvaguardas</h3>
            <ul className="space-y-1.5">
              {ABILITIES.map((a) => (
                <Linha
                  key={a.key}
                  prof={char.salvaguardasProficientes.includes(a.key)}
                  valor={saveBonus(char, a.key)}
                  nome={a.nome}
                  onRoll={() => rolarComModo(1, 20, saveBonus(char, a.key), `Salvaguarda de ${a.nome}`)}
                />
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
                  <li key={s.key}>
                    <RollButton
                      bonus={skillBonus(char, s.key)}
                      rotulo={s.nome}
                      className="flex w-full items-center gap-2 py-0.5 text-left"
                    >
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${exp ? 'bg-arcane-500' : prof ? 'bg-dragon-500' : 'border border-white/25'}`} />
                      <span className="w-9 font-mono text-sm tabular-nums text-parchment-100">{fmtMod(skillBonus(char, s.key))}</span>
                      <span className={`text-sm ${prof || exp ? 'text-parchment-50' : 'text-parchment-200/70'}`}>{s.nome}</span>
                      <span className="ml-auto text-[10px] uppercase text-parchment-200/40">{atr.abrev}</span>
                    </RollButton>
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

      {/* O turno da pessoa: tudo o que dá para fazer, com o dado a um clique */}
      <section className="card p-5">
        <h3 className="mb-3 panel-title">O que você pode fazer</h3>
        <PainelDeAcoes char={char} />
      </section>

      {/* Ataques */}
      {char.ataques.length > 0 && (
        <section className="card p-5">
          <h3 className="mb-3 panel-title">Ataques & Ações</h3>

          {/* O que o equipamento soma, dito antes da tabela. O bônus que vale
              sempre já entra nos números; o condicional não pode entrar, então
              fica aqui, com o alvo, para a pessoa somar sabendo por quê.
              Na aba Batalha, escolher o alvo faz o app somar sozinho. */}
          <BonusDoEquipamentoNosAtaques char={char} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left panel-title"><th className="pb-2 pr-3">Nome</th><th className="pb-2 pr-3">Bônus</th><th className="pb-2 pr-3">Dano</th><th className="pb-2">Notas</th></tr></thead>
              <tbody>
                {char.ataques.map((a) => {
                  const bonusNum = parseInt((a.bonus || '').replace(/[^\d+-]/g, ''), 10)
                  return (
                    <tr key={a.id} className="border-t border-white/5">
                      <td className="py-1.5 pr-3 font-medium text-parchment-50">{a.nome || '—'}</td>
                      <td className="py-1.5 pr-3 tabular-nums text-parchment-100">
                        {Number.isNaN(bonusNum) ? a.bonus : (
                          <RollButton bonus={bonusNum} rotulo={`${a.nome || 'Ataque'} (acerto)`} className="font-semibold text-arcane-400">
                            {a.bonus} 🎲
                          </RollButton>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 text-parchment-100">
                        <RollTextButton texto={a.dano} rotulo={`${a.nome || 'Ataque'} (dano)`} className="text-parchment-100">
                          {a.dano}
                        </RollTextButton>
                      </td>
                      <td className="py-1.5 text-xs text-parchment-200/60">{a.notas}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Talentos */}
      {char.talentos.length > 0 && (
        <section className="card p-5">
          <h3 className="mb-3 panel-title">Talentos</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {char.talentos.map((nome) => {
              const t = acharTalento(nome)
              return (
                <li key={nome} className="rounded-lg border border-white/10 bg-ink-900/40 p-2.5">
                  <p className="text-sm font-medium text-parchment-50">{nome}</p>
                  {t && <p className="mt-0.5 text-xs text-parchment-200/70">{t.resumo}</p>}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Descanso */}
      <RestPanel char={char} update={update} />

      {/* Cheat sheet de ações */}
      <AcoesCheatSheet char={char} />

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

      {/* Feitiços disponíveis para a classe */}
      <FeiticosDaClasse classe={char.classe} />

      {/* Equipamento fica na visão de LEITURA, e não na de edição: é a coisa
          que mais se troca DURANTE o jogo. Escondê-lo atrás de "Editar ficha"
          faria a pessoa entrar em modo de edição no meio da luta para trocar
          de arma. */}
      <section className="card p-5">
        <h3 className="mb-1 panel-title">Equipamento</h3>
        <p className="mb-3 text-xs text-parchment-200/50">
          O que você veste muda a ficha. Passe o olho num item guardado para ver a diferença
          antes de vestir.
        </p>
        <PainelDeEquipamento char={char} onChange={update} />
      </section>


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

      {subindoNivel && (
        <LevelUpModal char={char} update={update} onClose={() => setSubindoNivel(false)} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cheat sheet de ações: gerais + da classe do personagem
// ---------------------------------------------------------------------------
function AcoesCheatSheet({ char }: { char: Character }) {
  const [aba, setAba] = useState<'classe' | 'gerais'>(char.classe ? 'classe' : 'gerais')
  const daClasse = useMemo(() => acoesDaClasse(char.classe), [char.classe])
  const doNivel = daClasse.filter((a) => (a.nivel ?? 1) <= char.nivel)
  const futuras = daClasse.filter((a) => (a.nivel ?? 1) > char.nivel)

  return (
    <section className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="panel-title">O que posso fazer no meu turno?</h3>
        <div className="inline-flex rounded-lg border border-white/10 bg-ink-900/60 p-1 text-xs">
          {daClasse.length > 0 && (
            <button
              onClick={() => setAba('classe')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${aba === 'classe' ? 'bg-dragon-500 text-parchment-50' : 'text-parchment-200/70 hover:text-parchment-50'}`}
            >
              {char.classe}
            </button>
          )}
          <button
            onClick={() => setAba('gerais')}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${aba === 'gerais' ? 'bg-dragon-500 text-parchment-50' : 'text-parchment-200/70 hover:text-parchment-50'}`}
          >
            Ações gerais
          </button>
        </div>
      </div>

      {aba === 'gerais' ? (
        <ListaAcoes acoes={ACOES_GERAIS} />
      ) : daClasse.length === 0 ? (
        <p className="text-sm text-parchment-200/50">Escolha uma classe na ficha para ver as ações específicas dela.</p>
      ) : (
        <>
          <ListaAcoes acoes={doNivel} />
          {futuras.length > 0 && (
            <details className="mt-3 border-t border-white/5 pt-3">
              <summary className="cursor-pointer text-xs text-parchment-200/50 hover:text-parchment-100">
                Ainda por destravar ({futuras.length})
              </summary>
              <div className="mt-2 opacity-60">
                <ListaAcoes acoes={futuras} mostrarNivel />
              </div>
            </details>
          )}
        </>
      )}
    </section>
  )
}

function ListaAcoes({ acoes, mostrarNivel = false }: { acoes: AcaoInfo[]; mostrarNivel?: boolean }) {
  if (acoes.length === 0) return <p className="text-sm text-parchment-200/50">Nada por aqui ainda.</p>
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {acoes.map((a) => {
        const t = ROTULO_TIPO[a.tipo]
        return (
          <li key={a.nome} className="rounded-lg border border-white/10 bg-ink-900/40 p-2.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-parchment-50">{a.nome}</span>
              <span className={`rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${t.cor}`}>
                {t.curto}
              </span>
              {mostrarNivel && a.nivel && (
                <span className="ml-auto text-[10px] text-parchment-200/40">nível {a.nivel}</span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-parchment-200/70">{a.resumo}</p>
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Feitiços que a classe do personagem pode conjurar
// ---------------------------------------------------------------------------
function FeiticosDaClasse({ classe }: { classe: string }) {
  const [aberto, setAberto] = useState(false)
  const lista = useMemo(() => spellsDaClasse(classe), [classe])
  if (lista.length === 0) return null

  const porNivel = [...new Set(lista.map((s) => s.nivel))].sort((a, b) => a - b)

  return (
    <section className="card p-5">
      <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setAberto((v) => !v)}>
        <div>
          <h3 className="panel-title">Feitiços de {rotuloClasse(classe)}</h3>
          <p className="mt-0.5 text-xs text-parchment-200/50">
            {lista.length} feitiços do catálogo disponíveis para a sua classe
          </p>
        </div>
        <span className="text-parchment-200/40">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="mt-4 space-y-3">
          {porNivel.map((nivel) => (
            <div key={nivel}>
              <h4 className="mb-1 panel-title">{nivel === 0 ? 'Truques' : `Nível ${nivel}`}</h4>
              <ul className="space-y-1">
                {lista.filter((s) => s.nivel === nivel).map((s) => (
                  <li key={s.id} className="text-sm">
                    <span className="font-medium text-parchment-50">{s.nome}</span>
                    {s.concentracao && <span className="ml-1 text-[10px] text-arcane-400" title="Concentração">C</span>}
                    {s.ritual && <span className="ml-1 text-[10px] text-emerald-400" title="Ritual">R</span>}
                    <span className="text-parchment-200/60"> — {s.emMiudos}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="border-t border-white/5 pt-2 text-xs text-parchment-200/40">
            Veja a aba Feitiços para os detalhes completos (alcance, duração, componentes).
          </p>
        </div>
      )}
    </section>
  )
}

function Big({
  label,
  valor,
  sub,
  onRoll,
}: {
  label: string
  valor: string | number
  sub?: string
  onRoll?: () => void
}) {
  const conteudo = (
    <>
      <div className="panel-title">{label}</div>
      <div className="font-display text-2xl text-parchment-50">{valor}</div>
      {sub && <div className="text-[10px] text-parchment-200/50">{sub}</div>}
    </>
  )
  if (onRoll) {
    return (
      <button
        onClick={onRoll}
        title={`Rolar ${label}`}
        className="rounded-xl border border-white/10 bg-ink-800/70 p-3 text-center transition hover:border-arcane-400/50 hover:bg-arcane-500/10 active:scale-95"
      >
        {conteudo}
      </button>
    )
  }
  return <div className="rounded-xl border border-white/10 bg-ink-800/70 p-3 text-center">{conteudo}</div>
}

function Linha({
  prof,
  valor,
  nome,
  onRoll,
}: {
  prof: boolean
  valor: number
  nome: string
  onRoll?: () => void
}) {
  return (
    <li>
      <button
        onClick={onRoll}
        title={`Rolar ${nome}`}
        className="flex w-full items-center gap-3 rounded-md px-1 py-0.5 text-left transition hover:bg-arcane-500/20"
      >
        <span className={`h-3 w-3 shrink-0 rounded-full ${prof ? 'bg-dragon-500' : 'border border-white/25'}`} />
        <span className="w-12 font-mono text-sm tabular-nums text-parchment-100">{fmtMod(valor)}</span>
        <span className={`text-sm ${prof ? 'text-parchment-50' : 'text-parchment-200/70'}`}>{nome}</span>
      </button>
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

/**
 * O que o equipamento acrescenta aos ataques.
 *
 * O bônus que vale sempre a pessoa pode somar de uma vez; o condicional
 * depende de quem está na frente, e por isso vem com o alvo escrito. Quem
 * rola pela aba Batalha não precisa disto — lá o app escolhe o alvo e soma.
 */
function BonusDoEquipamentoNosAtaques({ char }: { char: Character }) {
  const b = bonusDeEquipamento(char)
  const temGeral = b.ataque !== 0 || b.dano !== 0 || b.danoExtra.length > 0
  if (!temGeral && b.condicionais.length === 0) return null
  const sinal = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

  return (
    <div className="mb-3 space-y-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
      {temGeral && (
        <p className="text-xs text-parchment-200/75">
          <b className="text-parchment-50">Do equipamento, sempre:</b>{' '}
          {[
            b.ataque ? `${sinal(b.ataque)} no ataque` : '',
            b.dano ? `${sinal(b.dano)} no dano` : '',
            ...b.danoExtra.map((d) => `+${d.dado} ${d.descricao}`),
          ].filter(Boolean).join(' · ')}
        </p>
      )}
      {b.condicionais.map((c) => (
        <p key={c.contra} className="text-xs text-amber-200/90">
          <b>Contra {c.contra}:</b>{' '}
          {[
            c.ataque ? `${sinal(c.ataque)} no ataque` : '',
            c.dano ? `${sinal(c.dano)} no dano` : '',
            ...c.danoExtra.map((d) => `+${d}`),
          ].filter(Boolean).join(' · ')}
          <span className="text-parchment-200/40"> — {c.fontes.join(', ')}</span>
        </p>
      ))}
    </div>
  )
}
