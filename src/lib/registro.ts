// O registro do combate: o que aconteceu, na ordem em que aconteceu.
//
// A batalha guardava só o retrato do agora. "Quanto de dano foi aquilo?" não
// tinha resposta em lugar nenhum, e desfazer um golpe errado era o conserto
// mais caro da mesa — dependia de alguém lembrar o número.
//
// O registro também é matéria-prima: os destaques da tela de vitória e o resumo
// da sessão saem daqui, em vez de serem digitados à mão.

import type { Battle, Combatant, EventoCombate, TipoEventoCombate } from '../types'
import { cdDeConcentracao } from './calc'
import { uid } from './character'

/** Quantos eventos guardamos. Um combate longo não pode virar um arquivo. */
const TETO = 200

interface Novo {
  tipo: TipoEventoCombate
  texto: string
  alvo?: string
  valor?: number
  deInimigo?: boolean
}

/** Acrescenta um evento, cortando o começo quando passa do teto. */
export function registrar(b: Battle, novo: Novo): EventoCombate[] {
  const evento: EventoCombate = {
    id: uid(),
    em: Date.now(),
    rodada: b.rodada,
    ...novo,
  }
  const lista = [...(b.registro ?? []), evento]
  return lista.length > TETO ? lista.slice(lista.length - TETO) : lista
}

/**
 * Traduz uma mudança de PV no que ela significa.
 *
 * Um número solto ("-8") não conta nada seis turnos depois. O que a mesa
 * pergunta é quem bateu em quem, quanto, e se derrubou.
 */
export function eventosDeVida(
  antes: Combatant,
  pvNovo: number,
  /** O colchão DEPOIS do golpe. Ausente = não mudou. */
  tempNovo?: number,
): Novo[] {
  const delta = pvNovo - antes.pvAtual
  // Quanto o colchão comeu. Vida temporária que sobe é bênção recebida, não
  // dano — só o que ENCOLHEU conta como golpe absorvido.
  const tempAntes = antes.pvTemporario ?? 0
  const absorvido = tempNovo == null ? 0 : Math.max(0, tempAntes - tempNovo)

  if (delta === 0 && absorvido === 0) return []

  /**
   * O DANO SOFRIDO, que não é o mesmo que o PV perdido.
   *
   * É a diferença que a vida temporária cria, e ela muda a CD: um mago com 10
   * temporários que leva 30 perde 20 de vida, mas SOFREU 30 — e a salvaguarda
   * de concentração é contra metade de 30, não de 20. Usar o PV perdido daria
   * CD 10 no lugar de CD 15, e a magia ficaria mais fácil de segurar
   * exatamente para quem estava protegido.
   */
  const dano = delta < 0 ? -delta + absorvido : absorvido

  if (dano > 0 && antes.concentracao) {
    const cd = cdDeConcentracao(dano)
    return [
      ...eventosDeVidaBase(antes, pvNovo, delta, absorvido),
      {
        tipo: 'concentracao' as const,
        alvo: antes.nome,
        deInimigo: antes.origem === 'inimigo',
        texto: `${antes.nome}: salvaguarda de CON CD ${cd} para manter ${antes.concentracao}`,
      },
    ]
  }

  return eventosDeVidaBase(antes, pvNovo, delta, absorvido)
}

function eventosDeVidaBase(
  antes: Combatant,
  pvNovo: number,
  delta: number,
  absorvido = 0,
): Novo[] {
  const deInimigo = antes.origem === 'inimigo'

  // O golpe que o colchão comeu inteiro não mexe no PV — e sem esta linha ele
  // não deixava rastro nenhum. Dez golpes de 1 numa Vida Falsa sumiam do
  // registro, e a luta ficava com um buraco onde aconteceu coisa.
  if (delta === 0) {
    return [{
      tipo: 'dano' as const,
      alvo: antes.nome,
      valor: absorvido,
      deInimigo,
      texto: `${antes.nome} sofreu ${absorvido} — absorvido pela vida temporária`,
    }]
  }

  const eventos: Novo[] = [
    delta < 0
      ? {
          tipo: 'dano' as const,
          alvo: antes.nome,
          valor: -delta + absorvido,
          deInimigo,
          texto: `${antes.nome} sofreu ${-delta + absorvido} de dano${
            absorvido > 0 ? ` (${absorvido} na vida temporária)` : ''
          }`,
        }
      : {
          tipo: 'cura' as const,
          alvo: antes.nome,
          valor: delta,
          deInimigo,
          texto: `${antes.nome} recuperou ${delta} PV`,
        },
  ]

  // A queda é o que a mesa lembra, então merece linha própria.
  if (antes.pvAtual > 0 && pvNovo <= 0) {
    eventos.push(
      deInimigo
        ? { tipo: 'morreu', alvo: antes.nome, deInimigo, texto: `${antes.nome} foi derrubado` }
        : { tipo: 'caiu', alvo: antes.nome, texto: `${antes.nome} caiu — testes de morte` },
    )
  }
  if (antes.pvAtual <= 0 && pvNovo > 0) {
    eventos.push({ tipo: 'levantou', alvo: antes.nome, deInimigo, texto: `${antes.nome} está de pé` })
  }

  return eventos
}

/** Uma condição que acabou sozinha, ao virar o turno. */
export function eventoDeExpiracao(alvo: string, condicao: string, deInimigo: boolean): Novo {
  return {
    tipo: 'condicao',
    alvo,
    deInimigo,
    texto: `${alvo} não está mais ${condicao.toLowerCase()} (acabou o prazo)`,
  }
}

/** As condições que entraram e as que saíram, entre dois estados. */
export function eventosDeCondicao(antes: Combatant, depois: string[]): Novo[] {
  const tinha = new Set(antes.condicoes)
  const tem = new Set(depois)
  const ganhou = depois.filter((c) => !tinha.has(c))
  const perdeu = antes.condicoes.filter((c) => !tem.has(c))

  return [
    ...ganhou.map((c) => ({
      tipo: 'condicao' as const,
      alvo: antes.nome,
      deInimigo: antes.origem === 'inimigo',
      texto: `${antes.nome} está ${c.toLowerCase()}`,
    })),
    ...perdeu.map((c) => ({
      tipo: 'condicao' as const,
      alvo: antes.nome,
      deInimigo: antes.origem === 'inimigo',
      texto: `${antes.nome} não está mais ${c.toLowerCase()}`,
    })),
  ]
}

/**
 * A versão do registro que vai para os jogadores.
 *
 * O PV exato de um inimigo é censurado na projeção da batalha — o grupo vê
 * porcentagem. Sem este corte o registro seria a porta dos fundos: bastaria
 * somar os danos anotados para saber quanto falta no chefe.
 */
export function projetarRegistro(registro: EventoCombate[] = []): EventoCombate[] {
  return registro.map((e) => {
    if (!e.deInimigo || (e.tipo !== 'dano' && e.tipo !== 'cura')) return e
    const verbo = e.tipo === 'dano' ? 'sofreu dano' : 'foi curado'
    return { ...e, valor: undefined, texto: `${e.alvo ?? 'O inimigo'} ${verbo}` }
  })
}

/**
 * Os momentos que valem contar depois da luta.
 *
 * É o que a tela de vitória usa: o golpe que doeu, quem chegou perto de morrer,
 * quem derrubou o chefe.
 */
export function destaquesDoCombate(b: Battle): string[] {
  const registro = b.registro ?? []
  const destaques: string[] = []

  const maiorDano = registro
    .filter((e) => e.tipo === 'dano' && (e.valor ?? 0) > 0)
    .sort((a, z) => (z.valor ?? 0) - (a.valor ?? 0))[0]
  if (maiorDano) {
    destaques.push(`Maior golpe: ${maiorDano.valor} de dano em ${maiorDano.alvo}`)
  }

  const quedas = registro.filter((e) => e.tipo === 'caiu')
  if (quedas.length > 0) {
    const nomes = [...new Set(quedas.map((e) => e.alvo))].join(', ')
    destaques.push(`Chegou perto: ${nomes} caiu durante a luta`)
  }

  const derrubados = registro.filter((e) => e.tipo === 'morreu')
  if (derrubados.length > 0) {
    destaques.push(`Inimigos derrubados: ${derrubados.length}`)
  }

  const viradas = registro.filter((e) => e.tipo === 'fase')
  for (const v of viradas) destaques.push(v.texto)

  destaques.push(`Duração: ${b.rodada} ${b.rodada === 1 ? 'rodada' : 'rodadas'}`)
  return destaques
}
