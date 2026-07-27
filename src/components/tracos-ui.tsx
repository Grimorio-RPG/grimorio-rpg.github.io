import type { Character } from '../types'
import {
  ataquesPorAcao,
  dadosDeAtaqueFurtivo,
  deslocamentoEfetivo,
  escolhasPendentes,
  manobrasDevidas,
  tracosDoPersonagem,
  type Origem,
} from '../lib/features'
import { MANOBRAS, subclasseCatalogada } from '../data/subclasses'

const ROTULO_ESCOLHA: Record<string, string> = {
  subclasse: 'Escolha a sua subclasse',
  estiloDeLuta: 'Escolha um estilo de luta',
  talento: 'Suba atributos ou pegue um talento',
  manobra: 'Escolha as suas manobras',
}

const ROTULO_ORIGEM: Record<Origem, string> = {
  classe: 'Classe',
  subclasse: 'Subclasse',
  especie: 'Espécie',
  antecedente: 'Antecedente',
}

/**
 * O que o personagem ganhou, por origem e nível — e o que ainda falta escolher.
 *
 * Existe porque "tem escolhas em certos níveis que não apareceram": antes, tudo
 * isto era um campo de texto livre e a pessoa só descobria o que tinha direito
 * lendo o livro por fora do app.
 */
export function TracosDeClasse({
  char,
  update,
}: {
  char: Character
  update?: (patch: Partial<Character>) => void
}) {
  const tracos = tracosDoPersonagem(char)
  const pendentes = escolhasPendentes(char)
  const ataques = ataquesPorAcao(char)
  const furtivo = dadosDeAtaqueFurtivo(char)
  const deslocamento = deslocamentoEfetivo(char)
  const devidas = manobrasDevidas(char)

  const porOrigem = (['classe', 'subclasse', 'especie', 'antecedente'] as Origem[])
    .map((o) => ({ origem: o, itens: tracos.filter((t) => t.origem === o) }))
    .filter((g) => g.itens.length > 0)

  if (tracos.length === 0) {
    return (
      <p className="text-sm text-parchment-200/60">
        Preencha classe, nível e espécie que os traços aparecem aqui.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {pendentes.length > 0 && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-3">
          <p className="text-sm font-semibold text-amber-300">Falta escolher</p>
          <ul className="mt-1 space-y-0.5 text-sm text-parchment-100">
            {pendentes.map((e) => (
              <li key={`${e.nivel}-${e.nome}`}>
                • {ROTULO_ESCOLHA[e.oque] ?? e.nome}{' '}
                <span className="text-parchment-200/50">(nível {e.nivel})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Os números que os traços mudam, para bater com outra ferramenta */}
      <div className="flex flex-wrap gap-2 text-xs">
        {ataques > 1 && <span className="chip">⚔️ {ataques} ataques por ação</span>}
        {furtivo > 0 && <span className="chip">🗡️ Ataque Furtivo {furtivo}d6</span>}
        {deslocamento !== char.deslocamento && (
          <span className="chip">👟 {deslocamento} m de deslocamento</span>
        )}
      </div>

      {devidas > 0 && update && <SeletorDeManobras char={char} update={update} devidas={devidas} />}

      {porOrigem.map((g) => (
        <div key={g.origem}>
          <h4 className="mb-2 panel-title">{ROTULO_ORIGEM[g.origem]}</h4>
          <ul className="space-y-2">
            {g.itens.map((t) => (
              <li key={`${g.origem}-${t.nivel}-${t.nome}`} className="flex gap-3">
                <span className="mt-0.5 shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-xs text-parchment-200/60">
                  {t.nivel}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-parchment-50">{t.nome}</p>
                  <p className="text-xs leading-relaxed text-parchment-200/70">{t.resumo}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {char.subclasse && !subclasseCatalogada(char.subclasse) && (
        <p className="text-xs text-parchment-200/50">
          Os traços de <b>{char.subclasse}</b> ainda não estão catalogados — anote-os no campo de
          características.
        </p>
      )}
    </div>
  )
}

/**
 * Manobras do Mestre de Batalha.
 *
 * O exemplo literal do relato: "pra minha subclasse tive que fazer manualmente
 * — os golpes".
 */
function SeletorDeManobras({
  char,
  update,
  devidas,
}: {
  char: Character
  update: (patch: Partial<Character>) => void
  devidas: number
}) {
  const escolhidas = char.manobras ?? []
  const cheio = escolhidas.length >= devidas

  function alternar(nome: string) {
    const tem = escolhidas.includes(nome)
    if (!tem && cheio) return
    update({ manobras: tem ? escolhidas.filter((m) => m !== nome) : [...escolhidas, nome] })
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="panel-title">Manobras</h4>
        <span className={`text-xs ${cheio ? 'text-parchment-200/50' : 'text-amber-300'}`}>
          {escolhidas.length} de {devidas}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {MANOBRAS.map((m) => {
          const ativa = escolhidas.includes(m.nome)
          return (
            <button
              key={m.nome}
              type="button"
              title={m.resumo}
              onClick={() => alternar(m.nome)}
              disabled={!ativa && cheio}
              className={`chip text-xs transition ${
                ativa
                  ? 'border-arcane-400/60 text-parchment-50'
                  : cheio
                    ? 'opacity-40'
                    : 'hover:border-arcane-400/40'
              }`}
            >
              {ativa ? '✓ ' : ''}
              {m.nome}
            </button>
          )
        })}
      </div>
      {escolhidas.length > 0 && (
        <ul className="mt-3 space-y-1">
          {escolhidas.map((nome) => {
            const m = MANOBRAS.find((x) => x.nome === nome)
            if (!m) return null
            return (
              <li key={nome} className="text-xs text-parchment-200/70">
                <b className="text-parchment-100">{m.nome}</b> — {m.resumo}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
