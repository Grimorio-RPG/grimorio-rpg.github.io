import type { Character } from '../types'
import { ABILITIES, SKILLS } from '../data/rules'
import {
  abilityMod,
  armorClass,
  fmtMod,
  initiative,
  passivePerception,
  proficiencyBonus,
  saveBonus,
  skillBonus,
  spellAttackBonus,
  spellSaveDC,
} from '../lib/calc'
import { recursosDoPersonagem } from '../lib/recursos'
import { RecursosEmChips } from './recursos-ui'

/** Exibição somente-leitura de uma ficha — usada no Painel do DM. */
export default function CharacterReadonly({ char }: { char: Character }) {
  const dc = spellSaveDC(char)
  const atk = spellAttackBonus(char)
  const skillsProf = SKILLS.filter(
    (s) => char.periciasProficientes.includes(s.key) || char.periciasExpertise.includes(s.key),
  ).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  return (
    <div className="space-y-4 text-sm">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-arcane-600/30 text-lg">
          {char.avatarUrl ? <img src={char.avatarUrl} alt="" className="h-full w-full object-cover" /> : '🧙'}
        </div>
        <div>
          <p className="font-display text-lg text-parchment-50">{char.nome || 'Sem nome'}</p>
          <p className="text-xs text-parchment-200/60">
            {[char.especie, char.classe && `${char.classe}${char.subclasse ? ` (${char.subclasse})` : ''}`, `Nível ${char.nivel}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>

      {/* Combate */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Mini label="CA" valor={armorClass(char)} />
        <Mini label="PV" valor={`${char.pvAtual}/${char.pvMax}`} />
        <Mini label="Inic." valor={fmtMod(initiative(char))} />
        <Mini label="Desl." valor={`${char.deslocamento}m`} />
        <Mini label="Prof." valor={`+${proficiencyBonus(char.nivel)}`} />
        <Mini label="Perc.Pass." valor={passivePerception(char)} />
      </div>

      {/* Usos de classe — a pergunta é se ainda dá para apertar o grupo */}
      {recursosDoPersonagem(char).length > 0 && (
        <Bloco titulo="Usos de classe">
          <RecursosEmChips char={char} />
        </Bloco>
      )}

      {/* Atributos */}
      <Bloco titulo="Atributos">
        <div className="grid grid-cols-6 gap-2">
          {ABILITIES.map((a) => (
            <div key={a.key} className="rounded-lg border border-white/10 bg-ink-900/40 py-1.5 text-center">
              <div className="panel-title">{a.abrev}</div>
              <div className="font-display text-base text-parchment-50">{fmtMod(abilityMod(char.atributos[a.key]))}</div>
              <div className="text-[10px] text-parchment-200/50">{char.atributos[a.key]}</div>
            </div>
          ))}
        </div>
      </Bloco>

      {/* Salvaguardas */}
      <Bloco titulo="Salvaguardas">
        <div className="flex flex-wrap gap-1.5">
          {ABILITIES.map((a) => {
            const prof = char.salvaguardasProficientes.includes(a.key)
            return (
              <span key={a.key} className={`chip ${prof ? 'border-dragon-400/50 text-parchment-50' : 'text-parchment-200/60'}`}>
                {a.abrev} {fmtMod(saveBonus(char, a.key))}
                {prof && ' ●'}
              </span>
            )
          })}
        </div>
      </Bloco>

      {/* Perícias proficientes */}
      {skillsProf.length > 0 && (
        <Bloco titulo="Perícias treinadas">
          <div className="flex flex-wrap gap-1.5">
            {skillsProf.map((s) => (
              <span key={s.key} className="chip">
                {s.nome} {fmtMod(skillBonus(char, s.key))}
                {char.periciasExpertise.includes(s.key) && ' ⓔ'}
              </span>
            ))}
          </div>
        </Bloco>
      )}

      {/* Ataques */}
      {char.ataques.length > 0 && (
        <Bloco titulo="Ataques & Ações">
          <ul className="space-y-1">
            {char.ataques.map((at) => (
              <li key={at.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium text-parchment-50">{at.nome || '—'}</span>
                {at.bonus && <span className="text-parchment-200/70">{at.bonus} p/ acertar</span>}
                {at.dano && <span className="text-parchment-200/70">· {at.dano}</span>}
                {at.notas && <span className="text-xs text-parchment-200/50">({at.notas})</span>}
              </li>
            ))}
          </ul>
        </Bloco>
      )}

      {/* Magias */}
      {char.magias.length > 0 && (
        <Bloco titulo="Magias">
          {(dc != null || atk != null) && (
            <div className="mb-2 flex gap-1.5">
              {dc != null && <span className="chip">CD {dc}</span>}
              {atk != null && <span className="chip">Ataque {fmtMod(atk)}</span>}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {[...char.magias]
              .sort((a, b) => a.nivel - b.nivel)
              .map((m) => (
                <span key={m.id} className={`chip ${m.preparada ? 'border-arcane-400/50' : ''}`}>
                  {m.nome} <span className="text-parchment-200/40">{m.nivel === 0 ? 'T' : m.nivel}</span>
                </span>
              ))}
          </div>
        </Bloco>
      )}

      {/* Texto livre */}
      {char.caracteristicas && <TextoBloco titulo="Características & Traços" texto={char.caracteristicas} />}
      {char.equipamento && <TextoBloco titulo="Equipamento" texto={char.equipamento} />}
      {char.anotacoes && <TextoBloco titulo="Anotações" texto={char.anotacoes} />}
    </div>
  )
}

function Mini({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-ink-900/40 py-1.5 text-center">
      <div className="panel-title">{label}</div>
      <div className="font-display text-base text-parchment-50">{valor}</div>
    </div>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1.5 panel-title">{titulo}</h4>
      {children}
    </div>
  )
}

function TextoBloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <h4 className="mb-1 panel-title">{titulo}</h4>
      <p className="whitespace-pre-wrap leading-relaxed text-parchment-100">{texto}</p>
    </div>
  )
}
