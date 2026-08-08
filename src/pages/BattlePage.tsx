import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  Battle,
  Character,
  Combatant,
  EventoCombate,
  MapScene,
  Monster,
  MonsterAction,
} from '../types'
import { useBattle } from '../hooks/useBattle'
import { useBestiary } from '../hooks/useBestiary'
import { loadBestiary, proximaFase, rotuloFase, tipoAcaoInfo } from '../lib/bestiary'
import {
  batalhaVazia,
  combatenteDePersonagem,
  comEstadoDasFichas,
  meusCombatentes,
  combatentesDeMonstro,
  comLendariasDisponiveis,
  correrCondicoes,
  gastarLendarias,
  momentoDoCovil,
  moverCombatente,
  ordenar,
  recarregarLendarias,
  rolarIniciativa,
  statusPV,
  tokensDaCena,
} from '../lib/battle'
import { PartyBar } from '../components/party-bar'
import { bonusContra, bonusDeEquipamento, temBonusContra } from '../lib/equipamento'
import { alteracaoDe, desfazerUltimo, empilhar, proximoADesfazer } from '../lib/desfazer'
import {
  FaixaDeIniciativa,
  Tabuleiro,
  type Ferramenta,
  type VidaNoTabuleiro,
} from '../components/tabuleiro'
import { useMapScene } from '../hooks/useMapScene'
import {
  CoisasNaCena,
  FerramentasDoMapa,
  PainelDaCena,
  SemCena,
} from '../components/cena-ui'
import { cenaVazia } from '../lib/mapscene'
import type { Saque } from '../lib/tesouro'
import {
  MOEDAS,
  descreveMoedas,
  dividirMoedas,
  saqueTemAlgo,
  sortearDoEncontro,
} from '../lib/tesouro'
import { descreveRolagem } from '../lib/dice'
import {
  destaquesDoCombate,
  eventoDeExpiracao,
  eventosDeCondicao,
  eventosDeVida,
  registrar,
} from '../lib/registro'
import { xpDoNd, progressoDeXp, avaliarEncontro, CORES_DIFICULDADE } from '../data/progression'
import { useCharacters } from '../hooks/useCharacters'
import { loadCharacters, upsertCharacter } from '../lib/storage'
import type { FichaDaMesa } from '../lib/sync/personagens'
import { ajustarFichaDaMesa, assinarFichasDaMesa, listarFichasDaMesa } from '../lib/sync/personagens'
import { CONDICOES } from '../data/rules'
import { Modal, PageHeader, ViewToggle } from '../components/layout-ui'
import { rolarComModo } from '../components/dice-ui'
import { useEstadoMesa, useMesa } from '../hooks/useSync'
import { CHAVES_MESA } from '../lib/sync/config'
import { SelosDaMesa } from '../components/mesa-ui'

type Modo = 'dm' | 'jogadores'
type UpdateFn = (patch: Partial<Battle>) => void

export default function BattlePage() {
  const { mesa, souJogador } = useMesa()

  // Jogador numa mesa vê o encontro do DM ao vivo; o resto do app continua
  // igual para quem joga sozinho ou é o DM.
  if (souJogador && mesa) return <BatalhaDaMesa mesaId={mesa.id} />
  return <BatalhaLocal />
}

function BatalhaLocal() {
  const { battle, update } = useBattle()
  const [modo, setModo] = useState<Modo>('dm')

  if (!battle) return null
  const ordenados = ordenar(battle.combatentes)

  return (
    <div>
      <PageHeader
        icon="⚔️"
        titulo="Batalhas"
        subtitulo="Monte o encontro, controle iniciativa e vida. Os jogadores veem quem enfrentam."
        acoes={
          <ViewToggle
            valor={modo}
            onChange={setModo}
            opcoes={[
              { valor: 'dm', label: '🎲 Visão do DM', labelCurto: '🎲 DM' },
              { valor: 'jogadores', label: '👥 Visão dos Jogadores', labelCurto: '👥 Jogadores' },
            ]}
          />
        }
      />
      <SelosDaMesa />

      {modo === 'dm'
        ? <DmView battle={battle} update={update} ordenados={ordenados} />
        : <PlayerView battle={battle} ordenados={ordenados} />}
    </div>
  )
}

/** Visão de quem joga: espelho, só leitura, do que está na tela do DM. */
function BatalhaDaMesa({ mesaId }: { mesaId: string }) {
  const remota = useEstadoMesa<Battle>(mesaId, CHAVES_MESA.batalhaPub)

  const cenaPublicada = useEstadoMesa<MapScene>(mesaId, CHAVES_MESA.mapaPub)

  const battle: Battle | null =
    remota && Array.isArray(remota.combatentes) ? { ...batalhaVazia(), ...remota } : null

  return (
    <div>
      <PageHeader
        icon="⚔️"
        titulo="Batalhas"
        subtitulo="O encontro que o seu DM está conduzindo, ao vivo."
      />
      <SelosDaMesa />

      {remota === undefined ? (
        <div className="card p-10 text-center text-sm text-parchment-200/60">Carregando o encontro…</div>
      ) : !battle || battle.combatentes.length === 0 ? (
        <div className="card p-10 text-center text-sm text-parchment-200/60">
          Nenhuma batalha em andamento. Assim que o DM montar o encontro, ele aparece aqui sozinho.
        </div>
      ) : (
        <PlayerView
          battle={battle}
          ordenados={ordenar(battle.combatentes)}
          cenaRemota={cenaPublicada ? { ...cenaVazia(), ...cenaPublicada } : null}
          mesaId={mesaId}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Visão do DM
// ---------------------------------------------------------------------------
function DmView({ battle, update, ordenados }: { battle: Battle; update: UpdateFn; ordenados: Combatant[] }) {
  const atual = battle.emAndamento ? ordenados[battle.turnoIndex] : null
  const { mesa: mesaDoDm, souDm: ehDm } = useMesa()
  const mesaId = ehDm && mesaDoDm ? mesaDoDm.id : null

  /**
   * A volta: o que o jogador mexeu na ficha dele chega no combate.
   *
   * Sem isto, deixar o jogador agir seria pior do que não deixar — ele marcaria
   * 12 de dano no celular e o DM continuaria vendo a barra cheia, com os dois
   * certos de estarem olhando a verdade.
   *
   * `comEstadoDasFichas` devolve a MESMA batalha quando nada mudou, e é isso
   * que impede o laço: o DM escreve na ficha, a assinatura acorda, nada
   * diverge, e para.
   */
  // A batalha do momento, sem entrar nas dependências do efeito: pô-la ali
  // faria a assinatura cair e subir a cada golpe do combate.
  const batalhaAgora = useRef(battle)
  batalhaAgora.current = battle

  useEffect(() => {
    if (!mesaId) return
    let vivo = true
    const puxar = () => {
      void listarFichasDaMesa(mesaId).then((fichas) => {
        if (!vivo) return
        const antes = batalhaAgora.current
        const depois = comEstadoDasFichas(
          antes,
          fichas.map((f) => ({
            id: f.ficha.id,
            pvAtual: f.ficha.pvAtual,
            condicoes: f.ficha.condicoes,
          })),
        )
        if (depois !== antes) update({ combatentes: depois.combatentes })
      })
    }
    puxar()
    const parar = assinarFichasDaMesa(mesaId, puxar)
    return () => {
      vivo = false
      parar()
    }
  }, [mesaId, update])

  /**
   * Altera um combatente — e, quando ele é uma ficha sua, a ficha junto.
   *
   * A batalha guardava uma cópia do personagem: tirar PV aqui não chegava na
   * aba Fichas, e a pessoa acabava a sessão com duas verdades diferentes sobre
   * a própria vida. Agora o PV volta para a ficha de origem.
   *
   * Só vale para as SUAS fichas. A do Guilherme é dele: quem escreve é o dono,
   * e o banco recusaria de qualquer forma (`dono_id = auth.uid()`).
   */
  function patchC(id: string, p: Partial<Combatant>, rotulo?: string) {
    const alvo = battle.combatentes.find((c) => c.id === id)

    // O registro nasce aqui porque é aqui que a mudança acontece de verdade —
    // por botão de dano, por campo de PV ou por condição marcada.
    let registro = battle.registro
    if (alvo && battle.emAndamento) {
      const novos = [
        ...(p.pvAtual != null ? eventosDeVida(alvo, p.pvAtual) : []),
        ...(p.condicoes != null ? eventosDeCondicao(alvo, p.condicoes) : []),
      ]
      for (const n of novos) registro = registrar({ ...battle, registro }, n)
    }

    // O passo de desfazer guarda só o valor ANTERIOR dos campos que mudaram.
    // Arrastar um token não entra: a posição fica fora da lista de campos, e
    // sem isso dois segundos de arrasto enterrariam o golpe que se quer
    // desfazer sob dezenas de passos de "mover".
    const alteracao = alvo ? alteracaoDe(alvo, p) : null
    const desfazer = alteracao
      ? empilhar(battle, rotulo ?? `Ajuste em ${alvo?.nome ?? 'combatente'}`, [alteracao])
      : battle.desfazer

    update({
      combatentes: battle.combatentes.map((c) => (c.id === id ? { ...c, ...p } : c)),
      ...(registro !== battle.registro ? { registro } : {}),
      ...(desfazer !== battle.desfazer ? { desfazer } : {}),
    })

    if (alvo?.origem !== 'aliado' || !alvo.refId) return
    if (p.pvAtual == null && p.condicoes == null && p.inspiracaoHeroica == null) return

    const ficha = loadCharacters().find((f) => f.id === alvo.refId)
    if (ficha) {
      // Ficha deste aparelho: grava direto.
      salvarFicha({
        ...ficha,
        ...(p.pvAtual != null ? { pvAtual: p.pvAtual } : {}),
        ...(p.condicoes != null ? { condicoes: p.condicoes } : {}),
        ...(p.inspiracaoHeroica != null ? { inspiracaoHeroica: p.inspiracaoHeroica } : {}),
      })
      return
    }

    // Ficha de um jogador: o DM ajusta pelo banco, e o aparelho dele recebe.
    if (souDm && mesa) {
      void ajustarFichaDaMesa(mesa.id, alvo.refId, {
        ...(p.pvAtual != null ? { pvAtual: p.pvAtual } : {}),
        ...(p.condicoes != null ? { condicoes: p.condicoes } : {}),
        ...(p.inspiracaoHeroica != null ? { inspiracaoHeroica: p.inspiracaoHeroica } : {}),
      })
    }
  }
  function removerC(id: string) {
    // Apagar a criatura errada era o único erro de combate sem volta: a ficha
    // saía da lista e não havia de onde recuperá-la.
    const alvo = battle.combatentes.find((c) => c.id === id)
    update({
      combatentes: battle.combatentes.filter((c) => c.id !== id),
      ...(alvo
        ? { desfazer: empilhar(battle, `Remoção de ${alvo.nome}`, [], [alvo]) }
        : {}),
    })
  }

  /** Volta um passo. Sincroniza como o resto — ver `lib/desfazer.ts`. */
  function desfazer() {
    const patch = desfazerUltimo(battle)
    if (patch) update(patch)
  }
  function rolarTodos(quem: 'todos' | 'inimigo' | 'aliado') {
    update({
      combatentes: battle.combatentes.map((c) =>
        quem === 'todos' || c.origem === quem ? { ...c, iniciativa: rolarIniciativa(c.iniciativaMod) } : c,
      ),
    })
  }
  function iniciar() { update({ emAndamento: true, rodada: 1, turnoIndex: 0 }) }
  /**
   * Inimigo caído não tem turno; personagem caído tem.
   *
   * A diferença é regra, não conveniência: um monstro a 0 PV está morto e sai
   * da ordem, enquanto um personagem a 0 PV rola teste de morte no turno dele —
   * pular seria tirar do jogador o momento mais tenso que ele tem.
   */
  function pulaTurno(c: Combatant) {
    return c.origem === 'inimigo' && c.pvAtual <= 0
  }

  /**
   * Faz o chefe virar a próxima fase, no lugar.
   *
   * Trocar a criatura à mão — apagar uma e adicionar outra — perde a posição na
   * iniciativa e estraga o efeito na frente do grupo. Aqui o combatente é o
   * mesmo: mantém o id, a ordem e as condições; troca arte, PV e ficha de
   * origem.
   *
   * A fase seguinte só é revelada ao grupo agora. Ela ficava oculta no
   * bestiário justamente para a virada ser surpresa.
   */
  function virarFase(c: Combatant) {
    const atual = monstros.find((m) => m.id === c.refId)
    if (!atual) return
    const seguinte = proximaFase(monstros, atual)
    if (!seguinte) return

    salvarMonstro({ ...seguinte, conhecimento: 'encontrado' })
    update({
      combatentes: battle.combatentes.map((x) =>
        x.id === c.id
          ? {
              ...x,
              refId: seguinte.id,
              nome: seguinte.nome,
              imagemUrl: seguinte.imagemJogadorUrl || '',
              imagemJogadorUrl: seguinte.imagemJogadorUrl || '',
              ca: seguinte.ca,
              pvMax: seguinte.pvMax,
              pvAtual: seguinte.pvMax,
              conhecimento: 'encontrado',
              nomeOculto: false,
              // O orçamento lendário é da forma nova, e vem cheio.
              ...(seguinte.acoesLendarias
                ? { lendariasMax: seguinte.acoesLendarias, lendariasRestantes: seguinte.acoesLendarias }
                : { lendariasMax: undefined, lendariasRestantes: undefined }),
            }
          : x,
      ),
      registro: registrar(battle, {
        tipo: 'fase',
        alvo: seguinte.nome,
        texto: `${c.nome} se transformou em ${seguinte.nome}`,
      }),
    })
    setTransformando({ nome: seguinte.nome, rotulo: rotuloFase(seguinte) })
  }

  function proximoTurno() {
    const n = ordenados.length
    if (n === 0) return

    let i = battle.turnoIndex
    let rodada = battle.rodada
    // Anda no máximo uma volta: se todos estiverem fora, para em vez de girar
    // para sempre.
    for (let passos = 0; passos < n; passos++) {
      i += 1
      if (i >= n) {
        i = 0
        rodada += 1
      }
      if (!pulaTurno(ordenados[i])) break
    }
    // O orçamento lendário volta no início do turno da criatura — é entre os
    // turnos dela que ele é gasto.
    // As condições de quem vai começar andam uma rodada, e o que acabou é
    // contado — senão o contador zeraria em silêncio e ninguém saberia.
    const { combatentes, expiradas } = correrCondicoes(
      recarregarLendarias(battle.combatentes, ordenados[i]?.id ?? ''),
      ordenados[i]?.id ?? '',
    )

    let registro = battle.registro
    const base = { ...battle, rodada, registro }
    if (rodada !== battle.rodada) {
      registro = registrar(base, { tipo: 'rodada', texto: `— Rodada ${rodada} —` })
    }
    for (const e of expiradas) {
      registro = registrar(
        { ...base, registro },
        eventoDeExpiracao(e.alvo, e.condicao, e.deInimigo),
      )
    }

    update({ turnoIndex: i, rodada, combatentes, ...(registro !== battle.registro ? { registro } : {}) })
  }
  /**
   * Encerra o encontro e paga o XP.
   *
   * O XP vem dos inimigos derrotados, pelo ND de cada um, dividido pelo tamanho
   * do grupo — como manda a regra. Só as SUAS fichas recebem: a do jogador é
   * dele, e somar XP na ficha alheia sem ele ver seria pior que não somar.
   *
   * Nada é aplicado antes de você confirmar na tela: o DM decide se aquele
   * encontro valeu recompensa.
   */
  function encerrar() {
    const derrotados = battle.combatentes.filter((c) => c.origem === 'inimigo' && c.pvAtual <= 0)
    const aliados = battle.combatentes.filter((c) => c.origem === 'aliado')

    const xpTotal = derrotados.reduce((soma, c) => {
      const m = monstros.find((x) => x.id === c.refId)
      return soma + (m ? xpDoNd(m.nd) : 0)
    }, 0)

    const saqueDoEncontro = sortearDoEncontro(
      derrotados.flatMap((c) => monstros.find((m) => m.id === c.refId) ?? []),
    )

    // Sem XP e sem saque não há tela de recompensa para mostrar.
    //
    // A falta de aliados NÃO cancela mais a tela. Ela cancelava, e isso jogava
    // o tesouro fora em silêncio no caso mais comum que existe: o DM conduz o
    // combate com as fichas do grupo no celular deles, sem pôr ninguém na
    // lista. Encerrava, e o saque do chefe simplesmente não acontecia.
    if (xpTotal <= 0 && !saqueTemAlgo(saqueDoEncontro)) {
      update({ emAndamento: false })
      return
    }
    setRecompensa({
      xpTotal,
      porPersonagem: aliados.length > 0 ? Math.floor(xpTotal / aliados.length) : 0,
      derrotados: derrotados.length,
      aliados,
      destaques: destaquesDoCombate(battle),
      // O saque é sorteado UMA vez, aqui, e guardado no estado. Sortear na
      // hora de desenhar faria a lista mudar a cada repintura, na frente
      // do grupo.
      saque: saqueDoEncontro,
    })
  }

  function pagarRecompensa() {
    if (!recompensa) return
    const locais = loadCharacters()
    for (const a of recompensa.aliados) {
      const ficha = locais.find((f) => f.id === a.refId)
      if (!ficha) continue
      salvarFicha({ ...ficha, xp: (ficha.xp ?? 0) + recompensa.porPersonagem })
    }
    setRecompensa(null)
    update({ emAndamento: false })
  }

  function turnoAnterior() {
    if (battle.turnoIndex === 0) {
      if (battle.rodada > 1) update({ turnoIndex: ordenados.length - 1, rodada: battle.rodada - 1 })
    } else update({ turnoIndex: battle.turnoIndex - 1 })
  }
  function limpar() {
    if (confirm('Limpar toda a batalha? Os combatentes serão removidos.')) update(batalhaVazia())
  }

  const inimigos = ordenados.filter((c) => c.origem === 'inimigo')
  const aliados = ordenados.filter((c) => c.origem === 'aliado')
  const { mesa, souDm } = useMesa()
  const { save: salvarFicha } = useCharacters()
  const { monstros, salvar: salvarMonstro } = useBestiary()
  const [transformando, setTransformando] = useState<{ nome: string; rotulo: string } | null>(null)
  const [mapaVisivel, setMapaVisivel] = useMapaVisivel()
  const [recompensa, setRecompensa] = useState<{
    xpTotal: number
    porPersonagem: number
    derrotados: number
    aliados: Combatant[]
    destaques: string[]
    saque: Saque
  } | null>(null)

  return (
    <div className="space-y-5">
      {recompensa && (
        <Modal titulo="⚔️ Encontro vencido" onClose={() => setRecompensa(null)}>
          <p className="text-sm text-parchment-200/80">
            {recompensa.derrotados} {recompensa.derrotados === 1 ? 'inimigo derrotado' : 'inimigos derrotados'} ·{' '}
            <b className="text-amber-300">{recompensa.xpTotal.toLocaleString('pt-BR')} XP</b> no total
          </p>

          {/* Os destaques saem do registro do combate. Sem ele não havia de
              onde tirar "o golpe que doeu" nem "quem chegou perto de morrer" —
              a informação passava e não ficava em lugar nenhum. */}
          {recompensa.destaques.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              {recompensa.destaques.map((d) => (
                <li key={d} className="text-xs text-parchment-200/75">
                  · {d}
                </li>
              ))}
            </ul>
          )}

          {saqueTemAlgo(recompensa.saque) && (
            <SaqueDoEncontro saque={recompensa.saque} quantos={recompensa.aliados.length} />
          )}

          {recompensa.aliados.length === 0 && recompensa.xpTotal > 0 && (
            <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-xs text-parchment-200/70">
              Nenhuma ficha estava no encontro, então não há a quem somar o XP aqui. Divida os{' '}
              <b className="text-amber-300">{recompensa.xpTotal.toLocaleString('pt-BR')}</b> pelo
              grupo e anote nas fichas.
            </p>
          )}

          <div className="mt-4 space-y-2">
            {recompensa.aliados.map((a) => {
              const ficha = loadCharacters().find((f) => f.id === a.refId)
              if (!ficha) {
                return (
                  <p key={a.id} className="text-xs text-parchment-200/50">
                    {a.nome} — ficha de outro jogador, o XP fica com ele.
                  </p>
                )
              }
              const antes = ficha.xp ?? 0
              const depois = antes + recompensa.porPersonagem
              const p = progressoDeXp(depois, ficha.nivel)
              return (
                <div key={a.id} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-parchment-50">{ficha.nome || a.nome}</span>
                    <span className="text-sm text-amber-300">
                      +{recompensa.porPersonagem.toLocaleString('pt-BR')} XP
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        p.podeSubir ? 'bg-amber-400' : 'bg-arcane-400'
                      }`}
                      style={{ width: `${p.podeSubir ? 100 : p.pct}%` }}
                    />
                  </div>
                  {p.podeSubir ? (
                    <p className="mt-1 text-xs font-semibold text-amber-300">
                      ✨ Subiu de nível! Abra a ficha para escolher o que ganha.
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-parchment-200/50">
                      faltam {p.faltam.toLocaleString('pt-BR')} para o nível {ficha.nivel + 1}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Sem fichas no encontro não há a quem somar XP: oferecer o botão
              seria prometer uma ação que não acontece. */}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              className={recompensa.aliados.length > 0 ? 'btn-ghost' : 'btn-primary'}
              onClick={() => { setRecompensa(null); update({ emAndamento: false }) }}
            >
              {recompensa.aliados.length > 0 ? 'Encerrar sem XP' : 'Encerrar'}
            </button>
            {recompensa.aliados.length > 0 && (
              <button className="btn-primary" onClick={pagarRecompensa}>
                ✓ Distribuir o XP
              </button>
            )}
          </div>
        </Modal>
      )}

      {transformando && (
        <div
          className="pointer-events-none fixed inset-0 z-50 grid place-items-center"
          onAnimationEnd={() => setTransformando(null)}
        >
          <div className="gv-clarao absolute inset-0 bg-dragon-500/25" />
          <div className="gv-transformar text-center">
            <p className="font-display text-2xl text-dragon-300 drop-shadow sm:text-3xl">
              {transformando.rotulo}
            </p>
            <p className="font-display text-4xl text-parchment-50 drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] sm:text-6xl">
              {transformando.nome}
            </p>
          </div>
        </div>
      )}

      {/* Os controles vieram para cima do mapa. São o que mais se usa, e
          ficavam depois de tudo — passar de turno exigia rolar a tela inteira. */}
      {battle.combatentes.length > 0 && (
        <div className="card z-20 flex flex-wrap items-center gap-2 p-3 backdrop-blur md:sticky md:top-0">
          {!battle.emAndamento ? (
            <>
              <button className="btn-primary" onClick={iniciar}>▶ Iniciar combate</button>
              <button className="btn-ghost text-sm" onClick={() => rolarTodos('todos')}>
                🎲 Iniciativa de todos
              </button>
              <button className="btn-ghost text-sm" onClick={() => rolarTodos('inimigo')}>
                🎲 Só inimigos
              </button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={turnoAnterior} aria-label="Turno anterior">←</button>
              <span className="rounded-lg bg-dragon-500/15 px-3 py-1.5 text-sm font-semibold text-parchment-50">
                Rodada {battle.rodada}
              </span>
              <button className="btn-primary" onClick={proximoTurno}>Próximo turno →</button>
              {atual && (
                <span className="hidden text-sm text-parchment-200/70 sm:inline">
                  vez de <b className="text-dragon-300">{atual.nome}</b>
                </span>
              )}
              <button className="btn-ghost text-sm" onClick={encerrar}>■ Encerrar</button>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <BotaoDesfazer passo={proximoADesfazer(battle)} onDesfazer={desfazer} />
            <BotaoDoMapa visivel={mapaVisivel} onAlternar={() => setMapaVisivel(!mapaVisivel)} />
            <button className="btn-ghost text-xs text-parchment-200/40" onClick={limpar}>
              Limpar
            </button>
          </div>
        </div>
      )}

      <PartyBar combatentes={ordenados} atualId={atual?.id} />

      {/* Duas colunas no monitor: o mapa fica parado à esquerda enquanto a
          coluna da direita rola. No celular tudo empilha, e aí vale mais ainda
          poder desligar o mapa. */}
      <div className={mapaVisivel ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]' : 'space-y-4'}>
        {mapaVisivel && (
          <div className="lg:sticky lg:top-20 lg:self-start">
            <CenaDaBatalha
              battle={battle}
              update={update}
              ordenados={ordenados}
              atualId={atual?.id}
              visaoJogador={false}
              onAnterior={battle.emAndamento ? turnoAnterior : undefined}
              onProximo={battle.emAndamento ? proximoTurno : undefined}
            />
          </div>
        )}

        <div className="min-w-0 space-y-4">
          {atual?.origem === 'inimigo' && (
            <TurnoDoInimigo
              combatente={atual}
              monstro={monstros.find((m) => m.id === atual.refId)}
            />
          )}

          {atual?.origem === 'aliado' && (
            <TurnoDoPersonagem
              combatente={atual}
              alvos={battle.combatentes.filter((c) => c.origem === 'inimigo' && c.pvAtual > 0)}
              monstros={monstros}
            />
          )}

          {momentoDoCovil(battle) && (
            <AcoesDeCovil
              chefes={battle.combatentes.filter((c) => c.origem === 'inimigo' && c.pvAtual > 0)}
              monstros={monstros}
            />
          )}

          {battle.emAndamento && (
            <AcoesLendarias
              chefes={comLendariasDisponiveis(battle)}
              monstros={monstros}
              aoGastar={(id, custo, nomeDaAcao) =>
                update({
                  combatentes: gastarLendarias(battle.combatentes, id, custo),
                  registro: registrar(battle, {
                    tipo: 'lendaria',
                    alvo: battle.combatentes.find((c) => c.id === id)?.nome,
                    deInimigo: true,
                    texto: `${battle.combatentes.find((c) => c.id === id)?.nome ?? 'O chefe'} usou ${nomeDaAcao}`,
                  }),
                })
              }
            />
          )}

          {/* Lista */}
          <div className="space-y-4">
            {aliados.length > 0 && <Grupo titulo="Grupo" cor="text-emerald-400">{aliados.map((c) => <CombatantRow
                  key={c.id}
                  c={c}
                  atual={atual?.id === c.id}
                  onPatch={(p, rotulo) => patchC(c.id, p, rotulo)}
                  onRemove={() => removerC(c.id)}
                  temProximaFase={
                    c.origem === 'inimigo' &&
                    c.pvAtual <= 0 &&
                    !!proximaFase(monstros, monstros.find((m) => m.id === c.refId) ?? ({} as Monster))
                  }
                  onVirarFase={() => virarFase(c)}
                />)}</Grupo>}
            {inimigos.length > 0 && <Grupo titulo="Inimigos" cor="text-dragon-400">{inimigos.map((c) => <CombatantRow
                  key={c.id}
                  c={c}
                  atual={atual?.id === c.id}
                  onPatch={(p, rotulo) => patchC(c.id, p, rotulo)}
                  onRemove={() => removerC(c.id)}
                  temProximaFase={
                    c.origem === 'inimigo' &&
                    c.pvAtual <= 0 &&
                    !!proximaFase(monstros, monstros.find((m) => m.id === c.refId) ?? ({} as Monster))
                  }
                  onVirarFase={() => virarFase(c)}
                />)}</Grupo>}
          </div>

          {battle.emAndamento && <RegistroDeCombate registro={battle.registro ?? []} />}

          <AddCombatentes battle={battle} update={update} mesaId={souDm && mesa ? mesa.id : null} />

          <MedidorDeDificuldade combatentes={battle.combatentes} monstros={monstros} />
        </div>
      </div>
    </div>
  )
}

/**
 * Liga e desliga o mapa.
 *
 * Nem toda mesa joga com mapa na tela: quem tem miniatura e tabuleiro de
 * verdade só quer o rastreador de combate, e o mapa ali empurra tudo para
 * baixo. A escolha fica no aparelho — é sobre a SUA tela, não sobre a cena
 * que o grupo recebe.
 */
function BotaoDoMapa({ visivel, onAlternar }: { visivel: boolean; onAlternar: () => void }) {
  return (
    <button
      type="button"
      onClick={onAlternar}
      className={`chip text-xs ${visivel ? 'border-arcane-400/60 text-parchment-50' : 'text-parchment-200/50'}`}
      title={visivel ? 'Esconder o mapa desta tela' : 'Mostrar o mapa'}
    >
      🗺️ {visivel ? 'Mapa' : 'Mapa off'}
    </button>
  )
}

function Grupo({ titulo, cor, children }: { titulo: string; cor: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className={`mb-2 text-sm font-semibold uppercase tracking-widest ${cor}`}>{titulo}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function CombatantRow({
  c,
  atual,
  onPatch,
  onRemove,
  temProximaFase = false,
  onVirarFase,
}: {
  c: Combatant
  atual: boolean
  onPatch: (p: Partial<Combatant>, rotulo?: string) => void
  onRemove: () => void
  /** O chefe caiu, mas ainda tem forma seguinte. */
  temProximaFase?: boolean
  onVirarFase?: () => void
}) {
  const st = statusPV(c.pvAtual, c.pvMax)
  const ajusta = (d: number) => onPatch({ pvAtual: Math.max(0, Math.min(c.pvMax, c.pvAtual + d)) })
  const inimigo = c.origem === 'inimigo'
  const caido = c.pvAtual <= 0

  return (
    <div
      className={`card gv-fade relative p-3 transition ${
        atual ? 'border-l-4 border-l-amber-400 ring-1 ring-amber-400/50' : ''
      } ${caido ? 'gv-caido' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Iniciativa */}
        <div className="flex shrink-0 flex-col items-center">
          <span className="panel-title text-[10px]">Inic.</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={c.iniciativa ?? ''}
              placeholder="—"
              onChange={(e) => { const n = parseInt(e.target.value, 10); onPatch({ iniciativa: Number.isNaN(n) ? null : n }) }}
              className="w-11 rounded-md border border-white/10 bg-ink-900/70 px-1 py-1 text-center text-sm outline-none focus:border-arcane-400"
            />
            <button
              className="rounded-md border border-white/10 px-1.5 py-1 text-xs hover:bg-white/5"
              title="Rolar iniciativa"
              onClick={() => onPatch({ iniciativa: rolarComModo(1, 20, c.iniciativaMod, `Iniciativa — ${c.nome}`).total })}
            >🎲</button>
          </div>
        </div>

        {/* Avatar + nome */}
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-ink-900/60 text-sm ring-2" style={{ '--tw-ring-color': inimigo ? 'rgba(163,49,43,.5)' : 'rgba(47,143,91,.5)' } as React.CSSProperties}>
          {c.imagemUrl ? <img src={c.imagemUrl} alt="" className="h-full w-full object-cover" /> : inimigo ? '🐾' : '🧙'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input value={c.nome} onChange={(e) => onPatch({ nome: e.target.value })} className="min-w-0 flex-1 bg-transparent font-medium text-parchment-50 outline-none focus:underline" />
            {inimigo && (
              <button
                onClick={() => onPatch({ nomeOculto: !c.nomeOculto })}
                title={c.nomeOculto ? 'Nome oculto dos jogadores' : 'Nome visível aos jogadores'}
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${c.nomeOculto ? 'bg-dragon-500/25 text-dragon-400' : 'text-parchment-200/40 hover:text-parchment-100'}`}
              >
                {c.nomeOculto ? '🙈 nome oculto' : '👁 nome visível'}
              </button>
            )}
          </div>
          <p className="text-xs text-parchment-200/50">CA {c.ca} · <span className={st.texto}>{st.label}</span></p>
        </div>

        <button onClick={onRemove} className="order-2 shrink-0 px-1 text-parchment-200/40 hover:text-dragon-400 sm:order-none" aria-label="Remover">✕</button>

        {/* PV — ocupa a linha toda no celular */}
        <div className="order-3 flex w-full items-center justify-center gap-1 sm:order-none sm:w-auto">
          {/* Digitar o número e teclar Enter. Antes eram só −5/−1/+1/+5: tirar
              13 de vida exigia cinco cliques, e o campo de PV pedia a conta de
              cabeça. Quem está na mesa tem o dano do dado, não a vida que sobra. */}
          <PainelDeDano c={c} onPatch={onPatch} />
          <button className="btn-ghost px-2 py-1 text-xs" onClick={() => ajusta(-1)}>−1</button>
          <div className="w-16 text-center">
            <input type="number" value={c.pvAtual} onChange={(e) => { const n = parseInt(e.target.value, 10); onPatch({ pvAtual: Math.max(0, Math.min(c.pvMax, Number.isNaN(n) ? 0 : n)) }) }} className="w-16 rounded-md border border-white/10 bg-ink-900/70 px-1 py-0.5 text-center text-sm outline-none focus:border-arcane-400" />
            {/* O que falta aparece em vermelho por baixo: ver o quanto já se
                perdeu é a informação que importa numa fila de iniciativa. */}
            <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-dragon-900/70 ring-1 ring-inset ring-black/40">
              <div className={`hpbar ${st.cor} ${st.pct <= 25 && st.pct > 0 ? 'animate-pulse' : ''}`} style={{ width: `${st.pct}%` }} />
            </div>
            <div className="text-[10px] text-parchment-200/40">/ {c.pvMax}</div>
          </div>
          <button className="btn-ghost px-2 py-1 text-xs" onClick={() => ajusta(1)}>+1</button>
        </div>
      </div>

      {/* O chefe caiu, mas não acabou: a virada é uma decisão do DM, tomada na
          hora em que o grupo comemora cedo demais. */}
      {temProximaFase && (
        <button
          type="button"
          className="btn-primary mt-2 w-full py-1.5 text-xs"
          onClick={onVirarFase}
        >
          ⚡ Não acabou — avançar para a próxima fase
        </button>
      )}

      {c.origem === 'aliado' && (
        <button
          type="button"
          onClick={() => onPatch({ inspiracaoHeroica: !c.inspiracaoHeroica })}
          title="Inspiração heroica: gasta para rolar de novo com vantagem"
          className={`mt-2 w-full rounded-lg border py-1 text-xs transition ${
            c.inspiracaoHeroica
              ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
              : 'border-white/10 text-parchment-200/40 hover:border-amber-400/40 hover:text-amber-200/70'
          }`}
        >
          {c.inspiracaoHeroica ? '✨ Com inspiração heroica' : '✨ Conceder inspiração'}
        </button>
      )}

      <CondicoesEditor
        c={c}
        onChange={(cond, rodadas) => onPatch({ condicoes: cond, rodadasDeCondicao: rodadas })}
        onConcentracao={(magia) => onPatch({ concentracao: magia })}
      />
    </div>
  )
}

/**
 * Condições ativas, com prazo e concentração.
 *
 * O prazo é opcional de propósito. Boa parte das condições de 5.5e dura "até
 * alguém tirar" — obrigar um número faria o DM inventar um.
 */
function CondicoesEditor({
  c,
  onChange,
  onConcentracao,
}: {
  c: Combatant
  onChange: (condicoes: string[], rodadas: Record<string, number>) => void
  onConcentracao: (magia: string) => void
}) {
  const [editando, setEditando] = useState('')
  const rodadas = c.rodadasDeCondicao ?? {}
  const disponiveis = CONDICOES.filter((x) => !c.condicoes.includes(x.nome))

  function remover(nome: string) {
    const { [nome]: _fora, ...resto } = rodadas
    onChange(
      c.condicoes.filter((x) => x !== nome),
      resto,
    )
  }

  function definirPrazo(nome: string, valor: string) {
    const n = Number(valor)
    if (!valor || !Number.isFinite(n) || n <= 0) {
      const { [nome]: _fora, ...resto } = rodadas
      onChange(c.condicoes, resto)
      return
    }
    onChange(c.condicoes, { ...rodadas, [nome]: Math.min(99, Math.round(n)) })
  }

  return (
    <div className="mt-2 space-y-1.5 border-t border-white/5 pt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {c.condicoes.map((nome) => (
          <span
            key={nome}
            className="chip border-dragon-400/40 bg-dragon-500/15 text-parchment-100"
          >
            <button
              type="button"
              onClick={() => setEditando(editando === nome ? '' : nome)}
              title="Definir por quantas rodadas"
              className="hover:text-dragon-300"
            >
              {nome}
              {rodadas[nome] ? (
                <b className="ml-1 text-amber-300">{rodadas[nome]}</b>
              ) : null}
            </button>
            {editando === nome && (
              <input
                type="number"
                min={0}
                max={99}
                autoFocus
                value={rodadas[nome] ?? ''}
                placeholder="—"
                onChange={(e) => definirPrazo(nome, e.target.value)}
                onBlur={() => setEditando('')}
                className="ml-1 w-10 rounded border border-white/20 bg-ink-900/80 px-1 text-center text-xs text-parchment-50 outline-none"
                title="Rodadas restantes. Vazio = até alguém tirar."
              />
            )}
            <button
              type="button"
              onClick={() => remover(nome)}
              title="Remover condição"
              className="ml-1 text-parchment-200/50 hover:text-dragon-300"
            >
              ✕
            </button>
          </span>
        ))}
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) onChange([...c.condicoes, e.target.value], rodadas)
          }}
          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-parchment-200/60 outline-none"
        >
          <option value="">＋ condição</option>
          {disponiveis.map((x) => (
            <option key={x.nome} value={x.nome}>
              {x.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Concentração some da mesa toda hora: ninguém lembra que o mago está
          segurando uma magia até meia hora depois. Ao tomar dano, o registro
          avisa o teste com a CD já calculada. */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-parchment-200/40">🧿</span>
        <input
          value={c.concentracao ?? ''}
          onChange={(e) => onConcentracao(e.target.value)}
          placeholder="concentrando em…"
          className={`min-w-0 flex-1 rounded-full border px-2 py-0.5 text-xs outline-none ${
            c.concentracao
              ? 'border-arcane-400/50 bg-arcane-500/15 text-parchment-100'
              : 'border-white/10 bg-white/5 text-parchment-200/60'
          }`}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function AddCombatentes({ battle, update, mesaId }: { battle: Battle; update: UpdateFn; mesaId: string | null }) {
  const { monstros } = useBestiary()
  const [monstroId, setMonstroId] = useState('')
  const [qtd, setQtd] = useState(1)
  // As fichas locais são as do DM; as da mesa são as que o grupo enviou. Sem as
  // segundas, o DM não conseguia pôr o personagem de ninguém na batalha.
  const locais = useMemo(() => loadCharacters(), [])
  const [doGrupo, setDoGrupo] = useState<FichaDaMesa[]>([])

  useEffect(() => {
    if (!mesaId) return
    const recarregar = () => void listarFichasDaMesa(mesaId).then(setDoGrupo)
    recarregar()
    return assinarFichasDaMesa(mesaId, recarregar)
  }, [mesaId])

  // Uma ficha que o dono enviou vence a cópia local: é a versão viva dele.
  const fichas = useMemo(() => {
    const porId = new Map(locais.map((c) => [c.id, { ficha: c, dono: '' }]))
    for (const f of doGrupo) porId.set(f.ficha.id, { ficha: f.ficha, dono: f.donoNome })
    return [...porId.values()]
  }, [locais, doGrupo])

  const naBatalha = new Set(battle.combatentes.map((c) => c.refId))

  function addMonstro() {
    const m = monstros.find((x) => x.id === monstroId)
    if (!m) return
    update({ combatentes: [...battle.combatentes, ...combatentesDeMonstro(m as Monster, qtd)] })
  }

  return (
    <div className="card p-4">
      <h2 className="mb-3 text-lg text-parchment-100">Montar encontro</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Aliados (fichas) */}
        <div>
          <p className="mb-2 panel-title">
            Grupo
            {doGrupo.length > 0 && (
              <span className="ml-2 font-normal normal-case text-parchment-200/50">
                — as fichas completas ficam em Campanha → Grupo
              </span>
            )}
          </p>
          {fichas.length === 0 ? (
            <p className="text-sm text-parchment-200/50">
              Crie personagens na aba Fichas, ou peça ao grupo para tocar em <b>☁️ Enviar para a
              mesa</b> na ficha deles.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {fichas.map(({ ficha: c, dono }) => (
                <button key={c.id} className={`chip hover:border-emerald-400/60 ${naBatalha.has(c.id) ? 'opacity-40' : ''}`} onClick={() => update({ combatentes: [...battle.combatentes, combatenteDePersonagem(c)] })} title={dono ? `Ficha de ${dono}` : 'Ficha deste aparelho'}>
                  ＋ {c.nome || 'Aventureiro'}{dono ? ` · ${dono}` : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Inimigos */}
        <div>
          <p className="mb-2 panel-title">Inimigos (Bestiário)</p>
          {monstros.length === 0 ? (
            <p className="text-sm text-parchment-200/50">Cadastre criaturas no Bestiário para adicioná-las aqui.</p>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <select className="stat-input flex-1" value={monstroId} onChange={(e) => setMonstroId(e.target.value)}>
                <option value="">Escolha uma criatura…</option>
                {monstros.map((m) => <option key={m.id} value={m.id}>{m.nome || 'Sem nome'} (ND {m.nd})</option>)}
              </select>
              <input type="number" min={1} max={20} value={qtd} onChange={(e) => setQtd(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-16 rounded-lg border border-white/10 bg-ink-900/60 px-2 py-2 text-center text-sm outline-none focus:border-arcane-400" title="Quantidade" />
              <button className="btn-primary" disabled={!monstroId} onClick={addMonstro}>＋ Add</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * O painel do jogador sobre o próprio personagem.
 *
 * A tela do jogador mostrava o combate e não deixava fazer nada: quem anotava o
 * dano dele, marcava a condição dele e rolava o ataque dele era o DM, com a mesa
 * inteira esperando. Aqui ele age.
 *
 * O que ele mexe é só a ficha DELE, e por isso a conta de "quais são minhas" é
 * local: as fichas que existem neste aparelho. O banco recusaria o resto de
 * qualquer forma — `dono_id = auth.uid()` —, mas pedir e levar não é melhor do
 * que não pedir.
 */
function MeuTurno({
  battle,
  atualId,
  alvos,
  mesaId,
}: {
  battle: Battle
  atualId?: string
  alvos: Combatant[]
  mesaId: string
}) {
  const [fichas, setFichas] = useState<Character[]>(() => loadCharacters())
  const [monstros, setMonstros] = useState<Monster[]>([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    setMonstros(loadBestiary())
  }, [])

  const meus = useMemo(
    () => meusCombatentes(battle, fichas.map((f) => f.id)),
    [battle, fichas],
  )
  if (meus.length === 0) return null

  /**
   * Muda o personagem: na ficha local e na cópia da mesa, nessa ordem.
   *
   * A local primeiro porque é a que a pessoa vê agora; a da mesa é o que faz o
   * DM enxergar. Se a rede falhar, ela fica sabendo — a ficha dela já mudou e
   * seria pior deixar as duas verdades divergirem em silêncio.
   */
  async function mudar(refId: string, estado: { pvAtual?: number; condicoes?: string[] }) {
    const local = fichas.find((f) => f.id === refId)
    if (local) setFichas(upsertCharacter({ ...local, ...estado, updatedAt: Date.now() }))
    const ok = await ajustarFichaDaMesa(mesaId, refId, estado)
    setErro(ok ? '' : 'Mudei aqui, mas não consegui avisar a mesa. Confira a conexão.')
  }

  return (
    <div className="space-y-3">
      {meus.map((c) => {
        const minhaVez = c.id === atualId
        const ficha = fichas.find((f) => f.id === c.refId)
        return (
          <section
            key={c.id}
            className={`card p-4 ${minhaVez ? 'border-dragon-400/60 ring-1 ring-dragon-400/30' : ''}`}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="panel-title">{c.nome}</h3>
                {minhaVez && (
                  <span className="rounded-full bg-dragon-500/20 px-2 py-0.5 text-[11px] font-semibold text-dragon-300">
                    é a sua vez
                  </span>
                )}
              </div>
              <span className="text-sm tabular-nums text-parchment-100">
                {c.pvAtual}/{c.pvMax} PV
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <PainelDeDano
                c={c}
                onPatch={(patch) => {
                  if (patch.pvAtual != null) void mudar(c.refId, { pvAtual: patch.pvAtual })
                }}
              />
              <MinhasCondicoes
                condicoes={c.condicoes}
                onMudar={(condicoes) => void mudar(c.refId, { condicoes })}
              />
            </div>

            {erro && <p className="mt-2 text-xs text-amber-300">{erro}</p>}

            {/* Os ataques dele, com alvo — o mesmo painel que o DM usa, porque a
                conta do bônus condicional é a mesma. Ele mesmo busca a ficha
                viva pelo `refId`. */}
            {ficha && (
              <div className="mt-3">
                <TurnoDoPersonagem combatente={c} alvos={alvos} monstros={monstros} />
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

/** As condições do próprio personagem, para marcar e desmarcar. */
function MinhasCondicoes({
  condicoes,
  onMudar,
}: {
  condicoes: string[]
  onMudar: (c: string[]) => void
}) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {condicoes.map((nome) => (
        <button
          key={nome}
          className="chip text-xs text-dragon-300 hover:border-dragon-400/60"
          title="Tirar esta condição"
          onClick={() => onMudar(condicoes.filter((x) => x !== nome))}
        >
          {nome} ✕
        </button>
      ))}
      <button className="btn-ghost py-0.5 text-xs" onClick={() => setAberto((v) => !v)}>
        {aberto ? 'Fechar' : '+ condição'}
      </button>
      {aberto && (
        <div className="flex w-full flex-wrap gap-1 pt-1">
          {CONDICOES.filter((x) => !condicoes.includes(x.nome)).map((x) => (
            <button
              key={x.nome}
              className="chip text-xs"
              title={x.desc}
              onClick={() => {
                onMudar([...condicoes, x.nome])
                setAberto(false)
              }}
            >
              {x.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Visão dos Jogadores
// ---------------------------------------------------------------------------
function PlayerView({
  battle,
  ordenados,
  cenaRemota,
  mesaId,
}: {
  battle: Battle
  ordenados: Combatant[]
  /** Presente só quando quem olha é um jogador de uma mesa. */
  cenaRemota?: MapScene | null
  /** Presente só para jogador de mesa: é por onde ele escreve na própria ficha. */
  mesaId?: string
}) {
  const inimigos = ordenados.filter((c) => c.origem === 'inimigo')
  const aliados = ordenados.filter((c) => c.origem === 'aliado')
  const atual = battle.emAndamento ? ordenados[battle.turnoIndex] : null
  const vivos = inimigos.filter((c) => c.pvAtual > 0).length

  if (battle.combatentes.length === 0) {
    return <div className="card p-10 text-center text-sm text-parchment-200/60">Nenhuma batalha em andamento. Na Visão do DM, monte um encontro para os jogadores verem os inimigos aqui.</div>
  }

  return (
    <div className="space-y-5">
      {/* O chefe da vez, em destaque. Vem antes de tudo porque é a resposta
          para "contra o que estamos lutando". */}
      <BarraDeChefe inimigos={inimigos} />

      {/* Quem mais precisa da faixa é o jogador: ele acompanha pelo celular e
          não tem o painel do DM para consultar. */}
      <PartyBar combatentes={ordenados} atualId={atual?.id} />

      {/* O que o jogador pode FAZER. Até aqui a tela dele era um telão: dava
          para ver o combate e mais nada, e o DM virava digitador de quatro
          pessoas. */}
      {mesaId && (
        <MeuTurno battle={battle} atualId={atual?.id} alvos={inimigos} mesaId={mesaId} />
      )}

      <CenaDaBatalha
        battle={battle}
        ordenados={ordenados}
        atualId={atual?.id}
        visaoJogador
        cenaRemota={cenaRemota}
      />

      {/* Turno. Com mapa na tela, a faixa flutuante já traz rodada e vez — aqui
          fica só a contagem de inimigos em pé. */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-dragon-500/15 px-3 py-1.5 text-sm font-semibold text-parchment-50">Rodada {battle.rodada}</span>
          {atual ? <span className="text-sm text-parchment-100">Turno de <b className="text-dragon-400">{nomePublico(atual)}</b></span> : <span className="text-sm text-parchment-200/60">Aguardando início do combate…</span>}
        </div>
        <span className="text-sm text-parchment-200/70">Inimigos em pé: <b className="text-parchment-50">{vivos}</b></span>
      </div>

      {/* Ordem de iniciativa — só quando NÃO há mapa. Com mapa, a faixa
          flutuante sobre ele já diz a mesma coisa, e repetir era só mais uma
          coisa para rolar. */}
      {battle.emAndamento && !cenaRemota?.mapaUrl && (
        <div className="card p-4">
          <p className="mb-2 panel-title">Ordem de iniciativa</p>
          <ol className="flex flex-wrap gap-2">
            {ordenados.map((c) => (
              <li key={c.id} className={`chip ${atual?.id === c.id ? 'border-dragon-400 bg-dragon-500/25 text-parchment-50' : ''} ${c.pvAtual <= 0 ? 'opacity-40 line-through' : ''}`}>
                {c.iniciativa != null && <span className="text-parchment-200/50">{c.iniciativa}</span>} {nomePublico(c)}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* O mesmo registro do DM, já sem os números que entregariam o PV exato
          de um inimigo — a censura acontece antes de sair pela rede. */}
      {battle.emAndamento && <RegistroDeCombate registro={battle.registro ?? []} />}

      {/* Inimigos */}
      <div>
        <h2 className="mb-3 text-lg text-parchment-100">Inimigos ({inimigos.length})</h2>
        {inimigos.length === 0 ? (
          <p className="text-sm text-parchment-200/50">Nenhum inimigo no encontro.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inimigos.map((c) => <EnemyCard key={c.id} c={c} destaque={atual?.id === c.id} />)}
          </div>
        )}
      </div>

      {/* Grupo */}
      {aliados.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg text-parchment-100">Seu grupo ({aliados.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aliados.map((c) => <AllyCard key={c.id} c={c} destaque={atual?.id === c.id} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function EnemyCard({ c, destaque }: { c: Combatant; destaque: boolean }) {
  const nome = c.nomeOculto ? '???' : c.nome
  const img = c.imagemJogadorUrl || c.imagemUrl
  const st = statusPV(c.pvAtual, c.pvMax)
  const morto = c.pvAtual <= 0
  return (
    <div className={`card gv-fade overflow-hidden ${destaque ? 'ring-2 ring-dragon-500' : ''} ${morto ? 'opacity-50' : ''}`}>
      <div className="relative h-32 w-full overflow-hidden bg-ink-900/60">
        {img ? <img src={img} alt={nome} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-4xl opacity-40">🐾</div>}
        {morto && <div className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-semibold text-parchment-100">Derrotado</div>}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink-900 to-transparent p-2">
          <span className="font-display text-parchment-50 drop-shadow">{nome}</span>
          <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${st.texto} bg-black/40`}>{st.label}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="h-2 overflow-hidden rounded-full bg-black/40"><div className={`hpbar ${st.cor}`} style={{ width: `${st.pct}%` }} /></div>
        {c.condicoes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {c.condicoes.map((n) => <span key={n} className="chip border-dragon-400/40 bg-dragon-500/15 text-[10px]">{n}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}

function AllyCard({ c, destaque }: { c: Combatant; destaque: boolean }) {
  const st = statusPV(c.pvAtual, c.pvMax)
  return (
    <div className={`card gv-fade flex items-center gap-3 p-3 ${destaque ? 'ring-2 ring-emerald-500' : ''} ${c.pvAtual <= 0 ? 'opacity-50' : ''}`}>
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-arcane-600/30 ring-2 ring-emerald-500/40">
        {c.imagemUrl ? <img src={c.imagemUrl} alt="" className="h-full w-full object-cover" /> : '🧙'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-parchment-50">{c.nome}</p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40"><div className={`hpbar ${st.cor}`} style={{ width: `${st.pct}%` }} /></div>
        {c.condicoes.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {c.condicoes.map((n) => <span key={n} className="chip border-amber-400/40 bg-amber-500/15 text-[10px]">{n}</span>)}
          </div>
        )}
      </div>
      <span className="shrink-0 text-sm tabular-nums text-parchment-100">{c.pvAtual}/{c.pvMax}</span>
    </div>
  )
}

// Nome mostrado aos jogadores (o DM pode ocultar o nome de um inimigo)
function nomePublico(c: Combatant): string {
  if (c.origem === 'inimigo' && c.nomeOculto) return '???'
  return c.nome
}

/**
 * Dificuldade do encontro, medida enquanto ele é montado.
 *
 * Serve para o DM saber antes da luta se aquilo é passeio ou matança — e é a
 * pergunta que ele mais faz montando encontro. Usa o modelo de 2024: soma crua
 * do XP dos inimigos contra o orçamento do grupo, sem o multiplicador que o 5e
 * de 2014 aplicava.
 */
function MedidorDeDificuldade({
  combatentes,
  monstros,
}: {
  combatentes: Combatant[]
  monstros: Monster[]
}) {
  const inimigos = combatentes.filter((c) => c.origem === 'inimigo')
  const aliados = combatentes.filter((c) => c.origem === 'aliado')
  if (inimigos.length === 0 || aliados.length === 0) return null

  const xpInimigos = inimigos.reduce((soma, c) => {
    const m = monstros.find((x) => x.id === c.refId)
    return soma + (m ? xpDoNd(m.nd) : 0)
  }, 0)

  // O nível de cada aliado vem da ficha; sem ela, assume 1 para não inflar o
  // orçamento e fazer o encontro parecer mais fácil do que é.
  const fichas = loadCharacters()
  const niveis = aliados.map((a) => fichas.find((f) => f.id === a.refId)?.nivel ?? 1)

  const av = avaliarEncontro(xpInimigos, niveis)
  const info = CORES_DIFICULDADE[av.dificuldade]

  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-2">
        <span className="panel-title">Dificuldade</span>
        <span className={`text-sm font-semibold ${info.cor}`}>
          {info.icone} {info.label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-parchment-200/60">
        <span>
          Inimigos: <b className="text-parchment-100">{xpInimigos.toLocaleString('pt-BR')} XP</b>
        </span>
        <span className="hidden sm:inline">·</span>
        <span>
          Orçamento do grupo ({aliados.length}):{' '}
          <span className="text-emerald-400">{av.orcamento.baixa.toLocaleString('pt-BR')}</span> /{' '}
          <span className="text-amber-400">{av.orcamento.moderada.toLocaleString('pt-BR')}</span> /{' '}
          <span className="text-orange-400">{av.orcamento.alta.toLocaleString('pt-BR')}</span>
        </span>
      </div>
    </div>
  )
}

/**
 * O que o inimigo da vez pode fazer.
 *
 * No turno de um monstro o DM precisava sair da batalha, abrir o bestiário,
 * achar a criatura e ler a ficha — com a mesa esperando. Aqui as ações vêm
 * junto, e o dado rola de onde está.
 */
function TurnoDoInimigo({ combatente, monstro }: { combatente: Combatant; monstro?: Monster }) {
  const [ultima, setUltima] = useState('')

  if (!monstro) {
    return (
      <div className="card border-l-4 border-l-dragon-500 p-3 text-sm text-parchment-200/60">
        Turno de <b className="text-parchment-100">{combatente.nome}</b> — a ficha desta criatura não
        está mais no bestiário.
      </div>
    )
  }

  // No próprio turno a criatura usa ação, bônus e reação. As lendárias NÃO
  // entram aqui de propósito: elas acontecem ENTRE os turnos dela, e por isso
  // ganham painel próprio, visível durante a vez dos outros.
  const doTurno = monstro.acoes.filter(
    (a) => (a.tipo ?? 'acao') !== 'lendaria' && a.tipo !== 'covil',
  )

  return (
    <div className="card border-l-4 border-l-dragon-500 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="panel-title">Turno de</span>
        <b className="text-parchment-50">{combatente.nome}</b>
        <span className="chip text-xs">CA {monstro.ca}</span>
        <span className="chip text-xs">
          PV {combatente.pvAtual}/{combatente.pvMax}
        </span>
        {monstro.deslocamento && <span className="chip text-xs">{monstro.deslocamento}</span>}
        {combatente.lendariasMax ? (
          <span className="chip border-amber-400/40 text-xs text-amber-200">
            👑 {combatente.lendariasRestantes ?? 0}/{combatente.lendariasMax} lendárias
          </span>
        ) : null}
      </div>

      {ultima && (
        <p className="mb-2 rounded-lg border border-dragon-400/30 bg-dragon-500/10 p-2 text-sm text-parchment-100">
          🎲 {ultima}
        </p>
      )}

      {doTurno.length > 0 ? (
        <div className="space-y-1.5">
          {doTurno.map((a) => (
            <LinhaDeAcao key={a.id} acao={a} nomeDaCriatura={monstro.nome} aoRolar={setUltima} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-parchment-200/50">
          Esta criatura não tem ações cadastradas. Adicione-as no bestiário para rolá-las daqui.
        </p>
      )}

      {monstro.taticas && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-parchment-200/60">
            🙈 Suas táticas
          </summary>
          <p className="mt-1 whitespace-pre-wrap text-xs text-parchment-200/70">{monstro.taticas}</p>
        </details>
      )}
    </div>
  )
}

/** Extrai a primeira notação de dado de um texto livre ("2d6+3 cortante"). */
function notacaoDeDado(texto: string) {
  return texto.match(/(\d+)d(\d+)(\s*[+-]\s*\d+)?/i)
}

/** Bônus de acerto, quando a descrição traz "+5 para acertar". */
function bonusDeAcerto(texto: string) {
  return texto.match(/([+-]\d+)\s*para\s*(?:acertar|atingir)/i)?.[1]
}

/**
 * Uma ação da criatura, com os dados que dá para rolar dali.
 *
 * Os botões saem da descrição em texto: o "+5 para acertar" vira um d20 e a
 * notação de dano vira o outro. Ação escrita sem dado nenhum aparece só como
 * texto — melhor do que não aparecer.
 */
function LinhaDeAcao({
  acao,
  nomeDaCriatura,
  aoRolar,
  aoUsar,
}: {
  acao: MonsterAction
  nomeDaCriatura: string
  aoRolar: (texto: string) => void
  /** Quando existe, um botão de gastar aparece — é o caso das lendárias. */
  aoUsar?: () => void
}) {
  const bonus = bonusDeAcerto(acao.descricao)
  const dano = notacaoDeDado(acao.descricao)?.[0]
  const info = tipoAcaoInfo(acao.tipo)

  function rolarDano() {
    const m = notacaoDeDado(acao.descricao)
    if (!m) return
    const mod = m[3] ? parseInt(m[3].replace(/\s+/g, ''), 10) : 0
    aoRolar(
      descreveRolagem(
        rolarComModo(Number(m[1]), Number(m[2]), mod, `${nomeDaCriatura} · ${acao.nome}`),
      ),
    )
  }

  function rolarAtaque() {
    aoRolar(
      descreveRolagem(
        rolarComModo(
          1,
          20,
          parseInt(bonus ?? '0', 10) || 0,
          `${nomeDaCriatura} · ${acao.nome} (ataque)`,
        ),
      ),
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-parchment-50">
          {/* O ícone só aparece quando não é uma ação comum: marcar toda linha
              com espada seria ruído. */}
          {acao.tipo && acao.tipo !== 'acao' && (
            <span title={info.explicacao} aria-label={info.rotulo}>
              {info.icone}
            </span>
          )}
          {acao.nome}
          {acao.custoLendaria && acao.custoLendaria > 1 && (
            <span className="text-xs font-normal text-amber-300/80">
              custa {acao.custoLendaria}
            </span>
          )}
        </p>
        <p className="text-xs leading-relaxed text-parchment-200/70">{acao.descricao}</p>
      </div>
      {bonus && (
        <button
          type="button"
          className="chip shrink-0 hover:border-emerald-400/60"
          onClick={rolarAtaque}
        >
          🎯 {bonus}
        </button>
      )}
      {dano && (
        <button
          type="button"
          className="chip shrink-0 hover:border-dragon-400/60"
          onClick={rolarDano}
        >
          🎲 {dano}
        </button>
      )}
      {aoUsar && (
        <button
          type="button"
          className="chip shrink-0 border-amber-400/40 text-amber-200 hover:border-amber-300"
          onClick={aoUsar}
        >
          Gastar
        </button>
      )}
    </div>
  )
}

/**
 * As ações lendárias dos chefes, durante o turno dos OUTROS.
 *
 * É onde elas acontecem: a regra diz que a criatura as gasta entre os próprios
 * turnos. Um painel que só aparecesse na vez dela mostraria as lendárias
 * exatamente no único momento em que não podem ser usadas — e foi por isso que
 * o painel do inimigo da vez, sozinho, não bastava.
 */
function AcoesLendarias({
  chefes,
  monstros,
  aoGastar,
}: {
  chefes: Combatant[]
  monstros: Monster[]
  aoGastar: (id: string, custo: number, nomeDaAcao: string) => void
}) {
  const [ultima, setUltima] = useState('')
  if (chefes.length === 0) return null

  return (
    <div className="card border-l-4 border-l-amber-400/70 p-3">
      <p className="panel-title mb-2">👑 Ações lendárias disponíveis</p>

      {ultima && (
        <p className="mb-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-sm text-parchment-100">
          🎲 {ultima}
        </p>
      )}

      <div className="space-y-3">
        {chefes.map((c) => {
          const monstro = monstros.find((m) => m.id === c.refId)
          const lendarias = (monstro?.acoes ?? []).filter((a) => a.tipo === 'lendaria')
          const restam = c.lendariasRestantes ?? 0
          if (lendarias.length === 0) return null

          return (
            <div key={c.id}>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <b className="text-sm text-parchment-50">{c.nome}</b>
                <span className="chip border-amber-400/40 text-xs text-amber-200">
                  {restam}/{c.lendariasMax} nesta rodada
                </span>
              </div>
              <div className="space-y-1.5">
                {lendarias.map((a) => {
                  const custo = a.custoLendaria ?? 1
                  const podeUsar = custo <= restam
                  return (
                    <div key={a.id} className={podeUsar ? '' : 'opacity-40'}>
                      <LinhaDeAcao
                        acao={a}
                        nomeDaCriatura={c.nome}
                        aoRolar={setUltima}
                        aoUsar={podeUsar ? () => aoGastar(c.id, custo, a.nome) : undefined}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * O aviso de ação de covil, no turno em que ela acontece.
 *
 * Aparece uma vez por rodada, quando a ordem cruza a iniciativa 20. Ficar
 * visível o combate inteiro seria ruído; ficar escondido devolveria o problema
 * que ela tem na mesa de verdade — todo mundo esquece que existe.
 */
function AcoesDeCovil({ chefes, monstros }: { chefes: Combatant[]; monstros: Monster[] }) {
  const [ultima, setUltima] = useState('')

  const comCovil = chefes.flatMap((c) => {
    const monstro = monstros.find((m) => m.id === c.refId)
    const acoes = (monstro?.acoes ?? []).filter((a) => a.tipo === 'covil')
    return acoes.length > 0 ? [{ combatente: c, acoes }] : []
  })
  if (comCovil.length === 0) return null

  return (
    <div className="card border-l-4 border-l-violet-400/70 p-3">
      <p className="panel-title mb-2">🕺 Iniciativa 20 — ação de covil</p>

      {ultima && (
        <p className="mb-2 rounded-lg border border-violet-400/30 bg-violet-500/10 p-2 text-sm text-parchment-100">
          🎲 {ultima}
        </p>
      )}

      <div className="space-y-3">
        {comCovil.map(({ combatente, acoes }) => (
          <div key={combatente.id}>
            <b className="mb-1.5 block text-sm text-parchment-50">{combatente.nome}</b>
            <div className="space-y-1.5">
              {acoes.map((a) => (
                <LinhaDeAcao
                  key={a.id}
                  acao={a}
                  nomeDaCriatura={combatente.nome}
                  aoRolar={setUltima}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Cor e ícone de cada tipo de evento, para o olho achar o que procura. */
const ESTILO_EVENTO: Record<string, { icone: string; classe: string }> = {
  dano: { icone: '💥', classe: 'text-dragon-300' },
  cura: { icone: '💚', classe: 'text-emerald-300' },
  condicao: { icone: '🌀', classe: 'text-violet-300' },
  caiu: { icone: '💀', classe: 'text-amber-300' },
  morreu: { icone: '☠️', classe: 'text-parchment-200/70' },
  levantou: { icone: '✨', classe: 'text-emerald-300' },
  fase: { icone: '🌋', classe: 'text-amber-200' },
  lendaria: { icone: '👑', classe: 'text-amber-200' },
  entrou: { icone: '➕', classe: 'text-parchment-200/60' },
  nota: { icone: '✏️', classe: 'text-parchment-200/70' },
}

/**
 * O que aconteceu no combate, do mais recente para o mais antigo.
 *
 * Recente em cima de propósito: a pergunta que a mesa faz é sobre o que acabou
 * de acontecer, e obrigar a rolar até o fim para achar isso seria trocar o
 * problema de lugar.
 */
function RegistroDeCombate({ registro }: { registro: EventoCombate[] }) {
  const [aberto, setAberto] = useState(false)
  if (registro.length === 0) return null

  const recentes = [...registro].reverse()
  const mostrados = aberto ? recentes : recentes.slice(0, 6)

  return (
    <div className="card p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="panel-title">📜 O que aconteceu</p>
        {recentes.length > 6 && (
          <button
            type="button"
            className="btn-ghost py-0.5 text-xs"
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? 'Mostrar menos' : `Ver tudo (${recentes.length})`}
          </button>
        )}
      </div>

      <ol className={aberto ? 'max-h-80 space-y-1 overflow-y-auto pr-1' : 'space-y-1'}>
        {mostrados.map((e) => {
          if (e.tipo === 'rodada') {
            return (
              <li
                key={e.id}
                className="flex items-center gap-2 py-1 text-[11px] uppercase tracking-wider text-parchment-200/40"
              >
                <span className="h-px flex-1 bg-white/10" />
                {e.texto}
                <span className="h-px flex-1 bg-white/10" />
              </li>
            )
          }
          const estilo = ESTILO_EVENTO[e.tipo] ?? ESTILO_EVENTO.nota
          return (
            <li key={e.id} className="flex items-start gap-2 text-sm">
              <span className="shrink-0 tabular-nums text-[11px] text-parchment-200/35">
                R{e.rodada}
              </span>
              <span aria-hidden="true">{estilo.icone}</span>
              <span className={estilo.classe}>{e.texto}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}


/**
 * O que caiu, e quanto cabe a cada um.
 *
 * Começa virado: é o momento em que a mesa mais presta atenção, e revelar de
 * uma vez desperdiça a única pausa dramática que o fim de combate tem.
 */
function SaqueDoEncontro({ saque, quantos }: { saque: Saque; quantos: number }) {
  const [revelado, setRevelado] = useState(false)
  const { cada, sobra } = dividirMoedas(saque.moedas, quantos)
  const temSobra = MOEDAS.some(({ chave }) => sobra[chave] > 0)

  if (!revelado) {
    return (
      <button
        type="button"
        onClick={() => setRevelado(true)}
        className="mt-3 w-full rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 text-center transition hover:bg-amber-500/20"
      >
        <p className="text-2xl">🧳</p>
        <p className="mt-1 text-sm font-semibold text-amber-200">Revelar o saque</p>
      </button>
    )
  }

  return (
    <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
      <p className="panel-title mb-2">💰 Saque</p>

      {descreveMoedas(saque.moedas) ? (
        <>
          <p className="text-sm text-parchment-50">{descreveMoedas(saque.moedas)}</p>
          {quantos > 1 && (
            <p className="mt-0.5 text-xs text-parchment-200/60">
              {descreveMoedas(cada)} para cada um
              {temSobra && ` · sobra ${descreveMoedas(sobra)}`}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-parchment-200/50">Nenhuma moeda.</p>
      )}

      {saque.itens.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {saque.itens.map((item, i) => (
            <li key={`${item}-${i}`} className="text-sm text-amber-200">
              ✦ {item}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[11px] text-parchment-200/40">
        Anote nas fichas — o app não mexe no inventário de ninguém sozinho.
      </p>
    </div>
  )
}


/**
 * A barra do chefe, na tela do grupo.
 *
 * Só aparece para Boss e BBEG — e para o rank que o grupo ENXERGA, que pode
 * não ser o verdadeiro. É assim que o vilão de fachada ganha barra de chefe e o
 * verdadeiro passa despercebido até a hora.
 *
 * O número de fases nunca chega aqui: o combatente não carrega essa informação,
 * e é de propósito. Uma barra segmentada entregaria "ainda tem mais duas
 * formas" antes da primeira virada.
 */
function BarraDeChefe({ inimigos }: { inimigos: Combatant[] }) {
  const chefe = inimigos.find(
    (c) => (c.categoria === 'boss' || c.categoria === 'bbeg') && c.pvAtual > 0,
  )
  if (!chefe) return null

  const pct = chefe.pvMax > 0 ? Math.max(0, Math.min(100, (chefe.pvAtual / chefe.pvMax) * 100)) : 0
  const bbeg = chefe.categoria === 'bbeg'
  const img = chefe.imagemJogadorUrl || chefe.imagemUrl

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-3 ${
        bbeg
          ? 'border-dragon-400/60 bg-gradient-to-r from-dragon-900/60 via-ink-900/80 to-dragon-900/60'
          : 'border-amber-400/40 bg-gradient-to-r from-amber-900/30 via-ink-900/80 to-amber-900/30'
      }`}
    >
      <div className="flex items-center gap-3">
        {img && (
          <img
            src={img}
            alt=""
            className={`h-12 w-12 shrink-0 rounded-full object-cover ring-2 ${
              bbeg ? 'ring-dragon-400/70' : 'ring-amber-400/60'
            }`}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.25em] text-parchment-200/50">
            {bbeg ? 'Ameaça final' : 'Chefe'}
          </p>
          <p className="truncate font-display text-lg text-parchment-50">{chefe.nome}</p>
        </div>
      </div>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/50">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${
            bbeg ? 'bg-dragon-500' : 'bg-amber-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* O número exato nunca aparece: a projeção já manda porcentagem, e
          escrever "60/100" daria a impressão de ser o PV de verdade. */}
      <p className="mt-1 text-right text-[11px] text-parchment-200/50">
        {Math.round(pct)}%
      </p>
    </div>
  )
}


/**
 * O mapa da luta, dentro da tela de batalha.
 *
 * Ter o mapa numa aba e o combate noutra obrigava a trocar de tela a cada
 * golpe — e as duas nem falavam entre si, porque a criatura estava cadastrada
 * duas vezes. Agora é a mesma criatura: arrastar aqui e tirar PV na lista
 * mexem no mesmo lugar, e o token mostra a vida e de quem é a vez.
 *
 * Some quando não há mapa carregado. Nem toda luta acontece sobre um mapa, e
 * um retângulo vazio no meio da tela só empurraria o resto para baixo.
 */
function CenaDaBatalha({
  battle,
  update,
  ordenados,
  atualId,
  visaoJogador,
  onAnterior,
  onProximo,
  cenaRemota,
}: {
  battle: Battle
  update?: UpdateFn
  ordenados: Combatant[]
  atualId?: string
  visaoJogador: boolean
  onAnterior?: () => void
  onProximo?: () => void
  /** A cena publicada pelo DM. Só para quem joga — ver abaixo. */
  cenaRemota?: MapScene | null
}) {
  const local = useMapScene()
  const [ferramenta, setFerramenta] = useState<Ferramenta>('mover')
  const [selecionado, setSelecionado] = useState<string | null>(null)

  // No aparelho de um jogador a cena vem da mesa. `useMapScene` lê a cena DESTE
  // aparelho, que para ele é a dele — vazia — e nunca a que o DM montou.
  const talvezCena = cenaRemota !== undefined ? cenaRemota : local.scene
  const updateCena = local.update

  if (!talvezCena) return null

  // Sem mapa, o DM escolhe um dos prontos em vez de encarar tela vazia.
  if (!talvezCena.mapaUrl) {
    return visaoJogador ? null : <SemCena update={updateCena} />
  }

  // Depois das duas saídas acima a cena existe. O nome próprio serve para as
  // funções internas herdarem essa certeza.
  const scene = talvezCena

  const tokens = tokensDaCena(battle, scene.tokens)

  // A vida vai para o token. Sem isto o DM precisava olhar a lista para saber
  // quem estava perto de cair, que era metade do problema de ter duas telas.
  const vidas: Record<string, VidaNoTabuleiro> = {}
  for (const c of battle.combatentes) {
    vidas[c.id] = { atual: c.pvAtual, max: c.pvMax, fora: c.pvAtual <= 0 }
  }

  /** Move a criatura, ou o objeto de cenário — cada um mora num lugar. */
  function mover(id: string, x: number, y: number) {
    if (battle.combatentes.some((c) => c.id === id)) {
      update?.({ combatentes: moverCombatente(battle.combatentes, id, x, y) })
      return
    }
    updateCena({ tokens: scene.tokens.map((t) => (t.id === id ? { ...t, x, y } : t)) })
  }

  return (
    <div className="space-y-2">
      {!visaoJogador && <FerramentasDoMapa ferramenta={ferramenta} setFerramenta={setFerramenta} />}

      {/* A faixa flutua sobre o tabuleiro em vez de empurrá-lo para cima: o
          mapa é a tela, e a fila é o que se consulta sem tirar os olhos dele. */}
      <div className="relative">
        <Tabuleiro
          scene={scene}
          tokens={tokens}
          onMover={mover}
          visaoJogador={visaoJogador}
          ferramenta={visaoJogador ? 'mover' : ferramenta}
          selecionado={selecionado}
          setSelecionado={setSelecionado}
          vidas={vidas}
          atualId={atualId}
        />
        {battle.emAndamento && (
          <FaixaDeIniciativa
            ordenados={ordenados}
            atualId={atualId}
            rodada={battle.rodada}
            onAnterior={onAnterior}
            onProximo={onProximo}
            onSelecionar={setSelecionado}
          />
        )}
      </div>

      {!visaoJogador && update && (
        <>
          <CoisasNaCena
            scene={scene}
            update={updateCena}
            battle={battle}
            updateBatalha={update}
            selecionado={selecionado}
            setSelecionado={setSelecionado}
          />
          <PainelDaCena scene={scene} update={updateCena} />
        </>
      )}
    </div>
  )
}

/**
 * Se o mapa aparece nesta tela.
 *
 * Nem toda mesa joga com mapa: quem tem miniatura e tabuleiro de verdade só
 * quer o rastreador de combate, e o mapa ali empurra tudo para baixo.
 *
 * Fica no aparelho, e não na cena. É sobre a SUA tela — esconder o mapa aqui
 * não pode apagar a cena que o grupo está vendo no celular deles.
 */
const CHAVE_MAPA_VISIVEL = 'grimorio55e.ui.mapaVisivel'

function useMapaVisivel(): [boolean, (v: boolean) => void] {
  const [visivel, setVisivel] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_MAPA_VISIVEL) !== 'nao'
    } catch {
      return true
    }
  })

  function definir(v: boolean) {
    setVisivel(v)
    try {
      localStorage.setItem(CHAVE_MAPA_VISIVEL, v ? 'sim' : 'nao')
    } catch {
      // Navegador sem armazenamento: a escolha vale só nesta visita.
    }
  }

  return [visivel, definir]
}


/**
 * Volta o último ajuste.
 *
 * Diz o que vai desfazer antes de ser clicado: um botão de desfazer sem rótulo
 * só troca a dúvida de lugar — "será que isso apaga o dano ou a condição?".
 */
function BotaoDesfazer({
  passo,
  onDesfazer,
}: {
  passo: { descricao: string } | null
  onDesfazer: () => void
}) {
  if (!passo) return null
  return (
    <button
      type="button"
      onClick={onDesfazer}
      className="chip text-xs hover:border-amber-400/60"
      title={`Desfazer: ${passo.descricao}`}
    >
      ↶ <span className="hidden max-w-[16ch] truncate sm:inline">{passo.descricao}</span>
      <span className="sm:hidden">Desfazer</span>
    </button>
  )
}

/**
 * Aplicar dano e cura.
 *
 * Antes eram só os botões −5 / −1 / +1 / +5: tirar 13 de vida exigia cinco
 * cliques, e o campo de PV pedia a conta feita de cabeça. O dano de 5.5e sai de
 * um dado — quem está na mesa tem o número, não a vida restante.
 *
 * Enter aplica dano, que é o caso comum.
 */
function PainelDeDano({
  c,
  onPatch,
}: {
  c: Combatant
  onPatch: (p: Partial<Combatant>, rotulo?: string) => void
}) {
  const [valor, setValor] = useState('')

  function aplicar(sinal: 1 | -1) {
    const n = Math.abs(parseInt(valor, 10))
    if (!Number.isFinite(n) || n === 0) return
    const alvo = Math.max(0, Math.min(c.pvMax, c.pvAtual + sinal * n))
    onPatch(
      { pvAtual: alvo },
      sinal < 0 ? `${n} de dano em ${c.nome}` : `${n} de cura em ${c.nome}`,
    )
    setValor('')
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            aplicar(e.shiftKey ? 1 : -1)
          }
        }}
        placeholder="—"
        title="Digite o dano e tecle Enter. Shift+Enter cura."
        className="w-12 rounded-md border border-white/10 bg-ink-900/70 px-1 py-1 text-center text-sm outline-none focus:border-dragon-400"
      />
      <button
        type="button"
        className="rounded-md border border-dragon-400/40 px-1.5 py-1 text-xs text-dragon-300 hover:bg-dragon-500/15"
        onClick={() => aplicar(-1)}
        title="Aplicar como dano"
      >
        💥
      </button>
      <button
        type="button"
        className="rounded-md border border-emerald-400/40 px-1.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/15"
        onClick={() => aplicar(1)}
        title="Aplicar como cura"
      >
        💚
      </button>
    </div>
  )
}


/**
 * O turno de um personagem: os ataques dele e contra quem.
 *
 * Existe por causa do bônus condicional. A espada que dá "+2 contra
 * goblinoides" aparecia na ficha e parava ali — na hora de bater, a pessoa
 * somava de cabeça e lembrava (ou não). Aqui o app tem os dois lados: o item
 * diz "goblinoide", o bestiu00e1rio diz "Humanoide (goblinoide)". Escolher o alvo
 * junta os dois.
 */
function TurnoDoPersonagem({
  combatente,
  alvos,
  monstros,
}: {
  combatente: Combatant
  alvos: Combatant[]
  monstros: Monster[]
}) {
  const [ultima, setUltima] = useState('')
  const [alvoId, setAlvoId] = useState<string>('')

  // A ficha viva, e não a cópia que entrou no combate: o equipamento pode ter
  // mudado depois que a criatura entrou na iniciativa.
  const ficha = useMemo(
    () => loadCharacters().find((f) => f.id === combatente.refId),
    [combatente.refId],
  )
  if (!ficha) return null

  const alvo = alvos.find((a) => a.id === alvoId)
  const tipoDoAlvo = alvo ? (monstros.find((m) => m.id === alvo.refId)?.tipo ?? '') : ''
  const extra = bonusContra(ficha, tipoDoAlvo)
  const geral = bonusDeEquipamento(ficha)
  const vale = temBonusContra(extra)

  function rolarAtaque(nome: string, bonusTexto: string) {
    const base = parseInt((bonusTexto || '').replace(/[^\d+-]/g, ''), 10) || 0
    const total = base + geral.ataque + extra.ataque
    setUltima(
      descreveRolagem(
        rolarComModo(1, 20, total, `${ficha!.nome} · ${nome}${alvo ? ` → ${alvo.nome}` : ''}`),
      ),
    )
  }

  function rolarDano(nome: string, danoTexto: string) {
    const m = notacaoDeDado(danoTexto)
    if (!m) return
    const mod = (m[3] ? parseInt(m[3].replace(/\s+/g, ''), 10) : 0) + geral.dano + extra.dano
    const r = rolarComModo(Number(m[1]), Number(m[2]), mod, `${ficha!.nome} · ${nome} (dano)`)
    let texto = descreveRolagem(r)

    // Os dados extras rolam junto e são somados no relato — separar em duas
    // rolagens obrigaria a pessoa a somar na mão, que é o que queremos tirar.
    const dados = [...geral.danoExtra.map((d) => d.dado), ...extra.danoExtra]
    for (const d of dados) {
      const n = notacaoDeDado(d)
      if (!n) continue
      const e = rolarComModo(Number(n[1]), Number(n[2]), 0, `${ficha!.nome} · ${nome} (extra ${d})`)
      texto += ` + ${e.total} (${d})`
    }
    setUltima(texto)
  }

  return (
    <div className="card border-l-4 border-l-emerald-400/70 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="panel-title">Turno de</span>
        <b className="text-parchment-50">{combatente.nome}</b>
        <span className="chip text-xs">CA {combatente.ca}</span>
        <span className="chip text-xs">
          PV {combatente.pvAtual}/{combatente.pvMax}
        </span>
      </div>

      {/* Escolher o alvo é o que destrava o condicional. Sem alvo, o app
          soma só o que vale sempre. */}
      {alvos.length > 0 && (
        <label className="mb-2 flex flex-wrap items-center gap-2 text-xs text-parchment-200/70">
          Atacando
          <select
            className="stat-input w-auto py-1 text-xs"
            value={alvoId}
            onChange={(e) => setAlvoId(e.target.value)}
          >
            <option value="">— escolha o alvo —</option>
            {alvos.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
          {vale && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-200">
              {[
                extra.ataque ? `+${extra.ataque} no ataque` : '',
                extra.dano ? `+${extra.dano} no dano` : '',
                ...extra.danoExtra.map((d) => `+${d}`),
              ].filter(Boolean).join(' · ')} — {extra.fontes.join(', ')}
            </span>
          )}
        </label>
      )}

      {ultima && (
        <p className="mb-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2 text-sm text-parchment-100">
          🎲 {ultima}
        </p>
      )}

      {ficha.ataques.length === 0 ? (
        <p className="text-sm text-parchment-200/50">
          Esta ficha não tem ataques cadastrados.
        </p>
      ) : (
        <div className="space-y-1.5">
          {ficha.ataques.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2"
            >
              <span className="min-w-0 flex-1 text-sm text-parchment-50">{a.nome || 'Ataque'}</span>
              {a.bonus && (
                <button
                  type="button"
                  className="chip shrink-0 hover:border-emerald-400/60"
                  onClick={() => rolarAtaque(a.nome || 'Ataque', a.bonus)}
                >
                  🎯 {a.bonus}
                  {geral.ataque + extra.ataque !== 0 && (
                    <b className="text-amber-300">
                      {geral.ataque + extra.ataque > 0 ? '+' : ''}
                      {geral.ataque + extra.ataque}
                    </b>
                  )}
                </button>
              )}
              {a.dano && (
                <button
                  type="button"
                  className="chip shrink-0 hover:border-dragon-400/60"
                  onClick={() => rolarDano(a.nome || 'Ataque', a.dano)}
                >
                  🎲 {a.dano}
                  {geral.dano + extra.dano !== 0 && (
                    <b className="text-amber-300">
                      {geral.dano + extra.dano > 0 ? '+' : ''}
                      {geral.dano + extra.dano}
                    </b>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
