// A estrada: os vinte níveis do personagem, de uma vez.
//
// Subir de nível era um modal — aparecia, dava o que tinha, e sumia. O
// personagem não tinha arco em lugar nenhum: nem o que já foi escolhido, nem o
// que vem, nem por que vale a pena chegar ao 11. E "vale a pena chegar ao 11" é
// metade do que segura uma campanha longa.
//
// A tela mostra sempre os VINTE, e não só até o nível atual. Cortar no nível
// de hoje faria disto um histórico, e o valor está no contrário: em ver o
// Ataque Extra chegando no 5 e a classe dando um salto no 11.

import { useMemo, useState } from 'react'
import type { Character } from '../types'
import { rotuloClasse } from '../data/rules'
import { progressoDeXp } from '../data/progression'
import { circuloEm, ehMarco, estrada, mostraMagia, resumo } from '../lib/progressao'

const ORIGEM: Record<string, string> = {
  classe: 'classe',
  subclasse: 'subclasse',
  especie: 'espécie',
  antecedente: 'antecedente',
}

export function Estrada({ char }: { char: Character }) {
  const degraus = useMemo(() => estrada(char), [char])
  const visao = useMemo(() => resumo(char, degraus), [char, degraus])
  const xp = progressoDeXp(char.xp ?? 0, char.nivel)
  const comMagia = mostraMagia(char)
  // Vinte cartões de uma vez é muito para um personagem de nível 3, que só
  // quer saber do 4 e do 5. Quem quiser o mapa inteiro pede.
  const [tudo, setTudo] = useState(false)

  const visiveis = tudo
    ? degraus
    : degraus.filter((d) => d.nivel <= char.nivel + 3 || ehMarco(d))

  return (
    <section className="card p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="panel-title">A estrada</h3>
        <span className="text-xs text-parchment-200/50">
          {char.classe ? rotuloClasse(char.classe) : 'sem classe'} · nível {char.nivel}
          {visao.faltam > 0 && ` · faltam ${visao.faltam} para o 20`}
        </span>
      </div>

      {/* O que vem a seguir, em uma frase. É a pergunta que se faz de verdade,
          e a resposta certa nem sempre é o próximo nível: num nível morto ela é
          apontar para além dele. */}
      {visao.proximoMarco && (
        <p className="mb-3 rounded-lg border border-arcane-400/30 bg-arcane-500/[0.07] p-2.5 text-sm text-parchment-100">
          <b className="text-arcane-300">Nível {visao.proximoMarco.nivel}</b>{' '}
          {visao.proximoMarco.tracos.length > 0
            ? visao.proximoMarco.tracos.map((t) => t.nome).join(', ')
            : visao.proximoMarco.circuloNovo > 0
              ? `magias de ${visao.proximoMarco.circuloNovo}º círculo`
              : `bônus de proficiência +${visao.proximoMarco.novoBonus}`}
          {visao.proximoMarco.nivel > char.nivel + 1 && (
            <span className="text-parchment-200/50">
              {' '}— daqui a {visao.proximoMarco.nivel - char.nivel} níveis
            </span>
          )}
        </p>
      )}

      {char.nivel < 20 && (
        <div className="mb-4">
          <div className="mb-1 flex items-baseline justify-between text-xs text-parchment-200/60">
            <span>
              {(char.xp ?? 0).toLocaleString('pt-BR')} XP
            </span>
            <span>faltam {xp.faltam.toLocaleString('pt-BR')} para o nível {char.nivel + 1}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full ${xp.podeSubir ? 'bg-emerald-500' : 'bg-arcane-500'}`}
              style={{ width: `${Math.min(100, xp.pct)}%` }}
            />
          </div>
        </div>
      )}

      <ol className="space-y-1.5">
        {visiveis.map((d) => (
          <li
            key={d.nivel}
            className={`flex gap-3 rounded-lg border p-2.5 transition ${
              d.atual
                ? 'border-dragon-400/60 bg-dragon-500/[0.08]'
                : d.alcancado
                  ? 'border-white/10 bg-white/[0.02]'
                  : 'border-white/5'
            }`}
          >
            <div className="w-9 shrink-0 text-center">
              <p
                className={`font-display text-xl leading-none ${
                  d.alcancado ? 'text-parchment-50' : 'text-parchment-200/35'
                }`}
              >
                {d.nivel}
              </p>
              {d.novoBonus != null && (
                <p className="mt-0.5 text-[10px] text-emerald-400/80" title="Bônus de proficiência">
                  +{d.novoBonus}
                </p>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {d.tracos.length === 0 && d.marcos.length === 0 && d.circuloNovo === 0 &&
              d.truquesNovos === 0 && d.magiasNovas === 0 ? (
                <p className="text-xs text-parchment-200/35">
                  Nada novo de classe. Só PV e o que a subclasse der.
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {d.tracos.map((t) => (
                    <li key={`${t.origem}-${t.nome}`} className="text-sm">
                      <b className={d.alcancado ? 'text-parchment-50' : 'text-parchment-200/70'}>
                        {t.nome}
                      </b>
                      <span className="ml-1.5 text-[11px] text-parchment-200/40">
                        {ORIGEM[t.origem] ?? t.origem}
                      </span>
                      {/* Âmbar só quando está MESMO pendente. O nível 3 sempre
                          pede uma subclasse, e quem já escolheu a dele não pode
                          continuar lendo "precisa escolher" para sempre — um
                          aviso que nunca some é um aviso que se ignora, e aí o
                          que está pendente de verdade some junto. */}
                      {t.efeito?.tipo === 'escolha' && (
                        d.escolhaPendente ? (
                          <span className="ml-1.5 text-[11px] text-amber-300">precisa escolher</span>
                        ) : !d.alcancado ? (
                          <span className="ml-1.5 text-[11px] text-parchment-200/35">vai pedir uma escolha</span>
                        ) : null
                      )}
                      <span className="block text-xs text-parchment-200/55">{t.resumo}</span>
                    </li>
                  ))}
                  {d.marcos.map((m) => (
                    <li key={m} className="text-xs text-parchment-200/55">{m}</li>
                  ))}
                </ul>
              )}

              {comMagia && (d.circuloNovo > 0 || d.truquesNovos > 0 || d.magiasNovas > 0) && (
                <p className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                  {d.circuloNovo > 0 && (
                    <span className="chip border-arcane-400/40 text-arcane-300">
                      abre o {d.circuloNovo}º círculo
                    </span>
                  )}
                  {d.truquesNovos > 0 && (
                    <span className="chip text-parchment-200/60">
                      +{d.truquesNovos} truque{d.truquesNovos > 1 ? 's' : ''}
                    </span>
                  )}
                  {d.magiasNovas > 0 && (
                    <span className="chip text-parchment-200/60">
                      +{d.magiasNovas} magia{d.magiasNovas > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* O que ESTE personagem tirou aqui. É o que separa a estrada de
                uma tabela de classe: o 7 do seu bárbaro deu 9 PV, rolados. */}
            <div className="w-24 shrink-0 text-right text-[11px]">
              {d.pvGanho != null ? (
                <span className="text-emerald-400/80">
                  +{d.pvGanho} PV
                  <span className="ml-1 text-parchment-200/35">{d.pvRolado ? 'rolado' : 'média'}</span>
                </span>
              ) : d.alcancado ? (
                <span className="text-parchment-200/25" title="Subida anterior ao registro do app">
                  sem registro
                </span>
              ) : (
                <span className="text-parchment-200/20">{d.xp.toLocaleString('pt-BR')} XP</span>
              )}
            </div>
          </li>
        ))}
      </ol>

      {!tudo && visiveis.length < degraus.length && (
        <button className="btn-ghost mt-3 w-full py-1.5 text-xs" onClick={() => setTudo(true)}>
          Ver os vinte níveis ({degraus.length - visiveis.length} escondidos por não mudarem nada)
        </button>
      )}

      {visao.niveisRegistrados > 0 && (
        <p className="mt-3 text-[11px] text-parchment-200/40">
          {visao.pvRegistrado} PV somados em {visao.niveisRegistrados} subida(s) feitas aqui
          {comMagia && ` · hoje até o ${circuloEm(char, char.nivel)}º círculo`}
        </p>
      )}
    </section>
  )
}
