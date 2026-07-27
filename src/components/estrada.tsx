import { useMemo, useState } from 'react'
import type { Campaign, EntradaCronica } from '../types'
import { novaEntradaCronica, novoEventoEstrada } from '../lib/campaign'
import { rolarComModo } from './dice-ui'
import { EmptyState } from './layout-ui'
import { Field, NumberField, SectionCard, TextArea, TextField } from './ui'

type UpdateFn = (patch: Partial<Campaign>) => void

/**
 * A crônica da estrada.
 *
 * O trecho entre dois lugares é a parte mais pulada de uma sessão — "vocês
 * viajam quatro dias e chegam". Aqui ele vira registro: em que dia o grupo está,
 * onde está, e o que a estrada trouxe.
 *
 * A tabela de eventos é prep do DM e não existe nesta tela para um jogador; a
 * projeção pública já a remove antes de sair pela rede.
 */
export function EstradaTab({
  campaign,
  update,
  visaoJogador,
}: {
  campaign: Campaign
  update: UpdateFn
  visaoJogador: boolean
}) {
  const v = campaign.viagem
  const [texto, setTexto] = useState('')
  const [bastidor, setBastidor] = useState(false)

  const cronica = useMemo(
    () => [...v.cronica].sort((a, b) => b.dia - a.dia || b.criadoEm - a.criadoEm),
    [v.cronica],
  )

  function mudarViagem(patch: Partial<typeof v>) {
    update({ viagem: { ...v, ...patch } })
  }

  function registrar(entrada: EntradaCronica) {
    mudarViagem({ cronica: [...v.cronica, entrada] })
  }

  function anotar() {
    const t = texto.trim()
    if (!t) return
    registrar(novaEntradaCronica(v.dia, v.local, t, bastidor))
    setTexto('')
  }

  /**
   * Sorteia o que a estrada trouxe. O dado passa pelo mesmo caminho de qualquer
   * rolagem do app, então o resultado aparece na bandeja e — numa mesa — pisca
   * na tela do grupo. Se o DM estiver com a rolagem secreta ligada, não sai.
   */
  function rolarEvento() {
    const r = rolarComModo(1, v.facesDado, 0, `Estrada · dia ${v.dia}`)
    const achado = v.tabelaEventos.find((e) => e.face === r.total)
    const descricao = achado?.texto.trim()
    registrar(
      novaEntradaCronica(
        v.dia,
        v.local,
        descricao ? `🎲 ${r.total} — ${descricao}` : `🎲 ${r.total} — nada digno de nota.`,
        false,
      ),
    )
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="🧭 Onde o grupo está"
        hint={visaoJogador ? undefined : 'Conte os dias como a sua campanha contar.'}
      >
        {visaoJogador ? (
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-parchment-200/50">Dia</p>
              <p className="font-display text-2xl text-parchment-50">{v.dia}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-parchment-200/50">Local</p>
              <p className="text-parchment-50">{v.local || '—'}</p>
            </div>
            {v.destino && (
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-parchment-200/50">Rumo a</p>
                <p className="text-parchment-50">{v.destino}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Dia">
                <div className="flex gap-2">
                  <NumberField value={v.dia} min={0} onChange={(dia) => mudarViagem({ dia })} />
                  <button
                    type="button"
                    className="btn-ghost shrink-0"
                    title="Avançar um dia"
                    onClick={() => mudarViagem({ dia: v.dia + 1 })}
                  >
                    +1
                  </button>
                </div>
              </Field>
              <Field label="Local" className="sm:col-span-2">
                <TextField
                  value={v.local}
                  onChange={(local) => mudarViagem({ local })}
                  placeholder="Vau do Glassrun"
                />
              </Field>
              <Field label="Rumo a">
                <TextField
                  value={v.destino}
                  onChange={(destino) => mudarViagem({ destino })}
                  placeholder="O Portão"
                />
              </Field>
            </div>
            <p className="mt-3 text-xs text-parchment-200/60">
              Dia, local e destino aparecem para o grupo. As anotações de bastidor e a tabela de
              eventos, não.
            </p>
          </>
        )}
      </SectionCard>

      {!visaoJogador && (
        <SectionCard
          title="🎲 O que a estrada trouxe"
          hint={`Sorteia 1d${v.facesDado} e registra na crônica.`}
          action={
            <button type="button" className="btn-primary" onClick={rolarEvento}>
              Rolar 1d{v.facesDado}
            </button>
          }
        >
          <div className="mb-3 flex items-end gap-3">
            <Field label="Faces do dado" className="w-32">
              <NumberField
                value={v.facesDado}
                min={2}
                max={100}
                onChange={(facesDado) => mudarViagem({ facesDado })}
              />
            </Field>
            <button
              type="button"
              className="btn-ghost mb-1"
              onClick={() =>
                mudarViagem({
                  tabelaEventos: [...v.tabelaEventos, novoEventoEstrada(v.tabelaEventos.length + 1)],
                })
              }
            >
              ＋ Linha
            </button>
          </div>

          {v.tabelaEventos.length === 0 ? (
            <p className="text-sm text-parchment-200/60">
              Sem tabela, a rolagem ainda funciona — registra o número e um "nada digno de nota".
              Preencha as linhas para a estrada ter voz.
            </p>
          ) : (
            <div className="space-y-2">
              {v.tabelaEventos.map((e) => (
                <div key={e.id} className="flex items-center gap-2">
                  <NumberField
                    value={e.face}
                    min={1}
                    className="w-16 shrink-0 text-center"
                    onChange={(face) =>
                      mudarViagem({
                        tabelaEventos: v.tabelaEventos.map((x) => (x.id === e.id ? { ...x, face } : x)),
                      })
                    }
                  />
                  <TextField
                    value={e.texto}
                    onChange={(t) =>
                      mudarViagem({
                        tabelaEventos: v.tabelaEventos.map((x) =>
                          x.id === e.id ? { ...x, texto: t } : x,
                        ),
                      })
                    }
                    placeholder="Uma patrulha exige ver o Selo do Rei."
                  />
                  <button
                    type="button"
                    className="btn-ghost shrink-0"
                    title="Remover linha"
                    onClick={() =>
                      mudarViagem({ tabelaEventos: v.tabelaEventos.filter((x) => x.id !== e.id) })
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {!visaoJogador && (
        <SectionCard title="✍️ Registrar">
          <TextArea
            value={texto}
            onChange={setTexto}
            rows={2}
            placeholder="Nym vai à frente e demora mais do que devia."
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary" onClick={anotar} disabled={!texto.trim()}>
              Anotar no dia {v.dia}
            </button>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-parchment-200/70">
              <input
                type="checkbox"
                checked={bastidor}
                onChange={(e) => setBastidor(e.target.checked)}
              />
              🙈 Só eu vejo
            </label>
          </div>
        </SectionCard>
      )}

      <SectionCard title="📜 Crônica da estrada">
        {cronica.length === 0 ? (
          <EmptyState
            icon="🧭"
            titulo="A estrada ainda está em branco"
            texto={
              visaoJogador
                ? 'Assim que o seu DM registrar algo da viagem, aparece aqui.'
                : 'Role o dado da estrada ou anote à mão — o que acontecer fica registrado por dia.'
            }
          />
        ) : (
          <ol className="space-y-3">
            {cronica.map((e) => (
              <li
                key={e.id}
                className={`border-l-2 pl-3 ${
                  e.soDm ? 'border-amber-400/40' : 'border-arcane-400/40'
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-parchment-200/50">
                  Dia {e.dia}
                  {e.local && ` · ${e.local}`}
                  {e.soDm && ' · 🙈 só você vê'}
                </p>
                <p className="text-parchment-50">{e.texto}</p>
                {!visaoJogador && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-parchment-200/40 hover:text-dragon-400"
                    onClick={() => mudarViagem({ cronica: v.cronica.filter((x) => x.id !== e.id) })}
                  >
                    remover
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
    </div>
  )
}
