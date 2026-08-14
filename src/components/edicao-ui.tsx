import type { Campaign } from '../types'
import { SectionCard } from './ui'
import {
  EDICOES,
  nomeDaEdicao,
  regrasDe,
  temConteudo,
  type Edicao,
} from '../lib/edicao'

/**
 * Qual edição esta mesa joga.
 *
 * Duas chaves, e a separação é o ponto inteiro: a REGRA é uma só por mesa —
 * meia regra produz ficha plausível e errada, que é o pior defeito deste app —,
 * e o CONTEÚDO é escolha do DM. "Jogo com as regras de 2024 e deixo meu jogador
 * pegar uma subclasse de 2014" é mesa legítima e comum.
 */
export function RegrasDaCampanha({
  campaign,
  update,
}: {
  campaign: Campaign
  update: (p: Partial<Campaign>) => void
}) {
  const regras = regrasDe(campaign)
  const mudar = (p: Partial<typeof regras>) => update({ regras: { ...regras, ...p } })

  return (
    <SectionCard title="📖 Edição das regras">
      <p className="text-sm text-parchment-200/70">
        Com que livro esta mesa calcula. Vale para a ficha inteira: atributo que vem da raça ou do
        antecedente, exaustão, nível da subclasse.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {EDICOES.map((e) => {
          const ativa = regras.edicao === e.valor
          const vazia = !temConteudo(e.valor)
          return (
            <button
              key={e.valor}
              type="button"
              onClick={() => mudar({ edicao: e.valor })}
              className={`rounded-xl border p-3 text-left transition ${
                ativa
                  ? 'border-dragon-400 bg-dragon-500/15'
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              <p className="font-display text-parchment-50">
                {ativa ? '✓ ' : ''}
                {e.nome}
              </p>
              <p className="mt-0.5 text-xs text-parchment-200/70">{e.detalhe}</p>
              {/* Um seletor que promete 2014 e entrega 2024 é pior do que
                  seletor nenhum. Enquanto o catálogo do SRD 5.1 não entrar, a
                  tela diz isso na cara. */}
              {vazia && (
                <p className="mt-1.5 text-[11px] text-amber-300">
                  ⚠ O app ainda não tem o conteúdo desta edição — espécies, classes e magias
                  continuam vindo do SRD 5.2.1.
                </p>
              )}
            </button>
          )
        })}
      </div>

      <label className="mt-3 flex items-start gap-2 text-sm text-parchment-200/80">
        <input
          type="checkbox"
          checked={regras.aceitaOutraEdicao}
          onChange={(e) => mudar({ aceitaOutraEdicao: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-arcane-500"
        />
        <span>
          Aceitar conteúdo da outra edição
          <span className="block text-xs text-parchment-200/55">
            Subclasse, talento, espécie e magia do outro livro entram na lista de escolha. A conta
            continua sendo a de {nomeDaEdicao(regras.edicao)} — é a regra que a mesa combinou.
          </span>
        </span>
      </label>
    </SectionCard>
  )
}

/** O selo da edição de uma ficha, quando ela não é a da mesa. */
export function SeloDeEdicao({ edicao, daMesa }: { edicao: Edicao; daMesa: Edicao }) {
  if (edicao === daMesa) return null
  return (
    <span className="chip text-[10px] text-amber-300" title={`Ficha de ${nomeDaEdicao(edicao)}`}>
      {edicao === '2014' ? '5e' : '5.5e'}
    </span>
  )
}
