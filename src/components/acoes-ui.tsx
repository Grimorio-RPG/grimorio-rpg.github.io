import { useMemo, useState } from 'react'
import type { Character } from '../types'
import { ataquesPorAcao, dadosDeAtaqueFurtivo, tracosDoPersonagem } from '../lib/features'
import { MANOBRAS } from '../data/subclasses'
import { acharTalento } from '../data/feats'
import { rolarComModo } from './dice-ui'
import { Modal } from './layout-ui'
import { descreveRolagem } from '../lib/dice'

/**
 * O que o personagem pode fazer no turno, em um lugar só.
 *
 * A ficha listava ataques numa tabela e traços noutra seção, e nada disso
 * rolava dado. Na mesa, o jogador precisa de uma coisa: "é meu turno, o que eu
 * faço?" — com o que a habilidade faz à mão e o dado a um clique.
 */
interface AcaoDaFicha {
  id: string
  nome: string
  /** O que ela faz, em texto de mesa. */
  descricao: string
  categoria: 'ataque' | 'classe' | 'manobra' | 'talento'
  /** Notação rolável, quando houver — ex: "1d8+3". */
  rolagem?: string
  /** Bônus de ataque, quando houver — ex: "+5". */
  ataque?: string
}

/** Extrai o primeiro "XdY+Z" de um texto livre. */
function acharNotacao(texto: string): string | undefined {
  return texto.match(/\b\d+d\d+(\s*[+-]\s*\d+)?/i)?.[0]?.replace(/\s+/g, '')
}

function montarAcoes(char: Character): AcaoDaFicha[] {
  const lista: AcaoDaFicha[] = []

  for (const a of char.ataques) {
    lista.push({
      id: `atq:${a.id}`,
      nome: a.nome || 'Ataque',
      descricao: [a.dano, a.notas].filter(Boolean).join(' · '),
      categoria: 'ataque',
      rolagem: acharNotacao(a.dano),
      ataque: a.bonus,
    })
  }

  // Traços de classe e subclasse que são ação de verdade, não passiva de ficha.
  for (const t of tracosDoPersonagem(char)) {
    if (t.efeito?.tipo === 'escolha') continue
    lista.push({
      id: `traco:${t.origem}:${t.nivel}:${t.nome}`,
      nome: t.nome,
      descricao: t.resumo,
      categoria: 'classe',
      rolagem: acharNotacao(t.resumo),
    })
  }

  for (const nome of char.manobras ?? []) {
    const m = MANOBRAS.find((x) => x.nome === nome)
    if (!m) continue
    lista.push({ id: `man:${nome}`, nome: m.nome, descricao: m.resumo, categoria: 'manobra' })
  }

  for (const nome of char.talentos) {
    const t = acharTalento(nome)
    if (!t) continue
    lista.push({ id: `tal:${nome}`, nome: t.nome, descricao: t.resumo, categoria: 'talento' })
  }

  return lista
}

const CATEGORIAS: { valor: AcaoDaFicha['categoria']; label: string; icone: string }[] = [
  { valor: 'ataque', label: 'Ataques', icone: '⚔️' },
  { valor: 'classe', label: 'Classe & espécie', icone: '✨' },
  { valor: 'manobra', label: 'Manobras', icone: '🎯' },
  { valor: 'talento', label: 'Talentos', icone: '🏅' },
]

export function PainelDeAcoes({ char }: { char: Character }) {
  const acoes = useMemo(() => montarAcoes(char), [char])
  const [aberta, setAberta] = useState<AcaoDaFicha | null>(null)
  const [ultima, setUltima] = useState<string>('')

  const ataques = ataquesPorAcao(char)
  const furtivo = dadosDeAtaqueFurtivo(char)

  function rolar(notacao: string, rotulo: string) {
    const m = notacao.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
    if (!m) return
    const r = rolarComModo(Number(m[1]), Number(m[2]), Number(m[3] ?? 0), rotulo)
    setUltima(descreveRolagem(r))
  }

  /** Bônus de ataque vem como texto ("+5"): vira um d20 com esse modificador. */
  function rolarAtaque(bonus: string, rotulo: string) {
    const mod = parseInt(bonus.replace(/[^\d+-]/g, ''), 10)
    const r = rolarComModo(1, 20, Number.isFinite(mod) ? mod : 0, `${rotulo} (ataque)`)
    setUltima(descreveRolagem(r))
  }

  if (acoes.length === 0) {
    return (
      <p className="text-sm text-parchment-200/60">
        Nada por aqui ainda. Adicione ataques na ficha, ou preencha classe e nível para os traços
        aparecerem.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="chip">⚔️ {ataques} {ataques === 1 ? 'ataque' : 'ataques'} por ação</span>
        {furtivo > 0 && (
          <button
            type="button"
            className="chip hover:border-arcane-400/60"
            onClick={() => rolar(`${furtivo}d6`, 'Ataque Furtivo')}
          >
            🗡️ Ataque Furtivo {furtivo}d6 — rolar
          </button>
        )}
      </div>

      {ultima && (
        <p className="rounded-lg border border-arcane-400/30 bg-arcane-500/10 p-2 text-sm text-parchment-100">
          🎲 {ultima}
        </p>
      )}

      {CATEGORIAS.map((cat) => {
        const doGrupo = acoes.filter((a) => a.categoria === cat.valor)
        if (doGrupo.length === 0) return null
        return (
          <div key={cat.valor}>
            <h4 className="mb-2 panel-title">
              {cat.icone} {cat.label}
            </h4>
            <div className="space-y-1.5">
              {doGrupo.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setAberta(a)}
                    title="Ver o que faz"
                  >
                    <p className="text-sm font-medium text-parchment-50">{a.nome}</p>
                    <p className="truncate text-xs text-parchment-200/60">{a.descricao || '—'}</p>
                  </button>
                  {a.ataque && (
                    <button
                      type="button"
                      className="chip shrink-0 hover:border-emerald-400/60"
                      onClick={() => rolarAtaque(a.ataque!, a.nome)}
                    >
                      🎯 {a.ataque}
                    </button>
                  )}
                  {a.rolagem && (
                    <button
                      type="button"
                      className="chip shrink-0 hover:border-dragon-400/60"
                      onClick={() => rolar(a.rolagem!, a.nome)}
                    >
                      🎲 {a.rolagem}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {aberta && (
        <Modal titulo={aberta.nome} onClose={() => setAberta(null)}>
          <p className="whitespace-pre-wrap text-parchment-100">{aberta.descricao || 'Sem descrição.'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {aberta.ataque && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => rolarAtaque(aberta.ataque!, aberta.nome)}
              >
                🎯 Rolar ataque ({aberta.ataque})
              </button>
            )}
            {aberta.rolagem && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => rolar(aberta.rolagem!, aberta.nome)}
              >
                🎲 Rolar {aberta.rolagem}
              </button>
            )}
          </div>
          {ultima && <p className="mt-3 text-sm text-parchment-100">🎲 {ultima}</p>}
        </Modal>
      )}
    </div>
  )
}
