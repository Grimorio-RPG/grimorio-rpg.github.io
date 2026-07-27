import type { Character } from '../types'
import {
  ataquesPorAcao,
  dadosDeAtaqueFurtivo,
  deslocamentoEfetivo,
  escolhasPendentes,
  tracosDoPersonagem,
} from '../lib/features'

const ROTULO_ESCOLHA: Record<string, string> = {
  subclasse: 'Escolha a sua subclasse',
  estiloDeLuta: 'Escolha um estilo de luta',
  talento: 'Suba atributos ou pegue um talento',
}

/**
 * O que a classe deu, por nível — e o que ainda falta escolher.
 *
 * Existe porque "tem escolhas em certos níveis que não apareceram": antes, os
 * traços eram um campo de texto livre e a pessoa só descobria o que tinha
 * direito lendo o livro por fora do app.
 */
export function TracosDeClasse({ char }: { char: Character }) {
  const tracos = tracosDoPersonagem(char)
  const pendentes = escolhasPendentes(char)
  const ataques = ataquesPorAcao(char)
  const furtivo = dadosDeAtaqueFurtivo(char)
  const deslocamento = deslocamentoEfetivo(char)

  if (tracos.length === 0) {
    return (
      <p className="text-sm text-parchment-200/60">
        Ainda não tenho os traços de <b>{char.classe || 'sua classe'}</b> cadastrados. Use o campo de
        características abaixo enquanto isso.
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

      {/* Os números que a classe muda, para bater com a ficha de outra ferramenta */}
      <div className="flex flex-wrap gap-2 text-xs">
        {ataques > 1 && <span className="chip">⚔️ {ataques} ataques por ação</span>}
        {furtivo > 0 && <span className="chip">🗡️ Ataque Furtivo {furtivo}d6</span>}
        {deslocamento !== char.deslocamento && (
          <span className="chip">👟 {deslocamento} m de deslocamento</span>
        )}
      </div>

      <ul className="space-y-2">
        {tracos.map((t) => (
          <li key={`${t.nivel}-${t.nome}`} className="flex gap-3">
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

      <p className="text-xs text-parchment-200/50">
        Traços de subclasse, espécie e antecedente ainda não entram nesta lista — anote-os no campo
        de características.
      </p>
    </div>
  )
}
