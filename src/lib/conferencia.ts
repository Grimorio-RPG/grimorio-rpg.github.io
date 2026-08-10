// A conferência da ficha: o que está estranho aqui.
//
// O app já sabia todas as contas — CA, espaços de magia, cotas, proficiência,
// sintonia — e cada uma vivia na sua tela. Quem monta uma ficha à mão, importa
// do D&D Beyond ou sobe cinco níveis de uma vez acaba com uma ficha inteira
// plausível e errada em dois lugares. Nenhum deles dá erro: a CA fica alta, os
// espaços ficam a menos, e a mesa só descobre na hora em que o número importa.
//
// Isto aqui é o lugar que junta. Não corrige nada e não impede nada: aponta,
// diz o número certo e explica o porquê. Ficha é da pessoa, e "está estranho"
// é diferente de "está proibido" — um item de campanha, uma regra caseira e um
// personagem de suplemento produzem achados que são falsos alarmes, e um app
// que os transformasse em bloqueio viraria um app que discute com a mesa.

import type { AbilityKey, Character } from '../types'
import { classInfo, armorClass, abilityMod, proficiencyBonus } from './calc'
import { espacosPorNivel, maiorCirculo, xpDoNivel } from '../data/progression'
import { oQueFalta, usaGrimorio } from './conjuracao'
import { escolhasPendentes } from './features'
import { custoDeArmadura, proficienteComArma } from './proficiencias'
import { armaBase, excedeSintonia, itensAtivos } from './equipamento'
import { SKILLS } from '../data/rules'
import {
  classesQueConjuram,
  ehMulticlasse,
  emPalavras,
  espacosDeMulticlasse,
  faixaDePv,
  requisitosFaltando,
} from './multiclasse'

/**
 * O quanto isto importa.
 *
 * - `erro`: a regra foi quebrada e o número na ficha está errado agora.
 * - `aviso`: falta uma escolha, ou algo está fora do comum e talvez esteja certo.
 * - `dica`: nada está errado; é só uma folga que a pessoa pode não ter notado.
 */
export type Gravidade = 'erro' | 'aviso' | 'dica'

export interface Achado {
  /** Chave estável — a tela usa para não repetir a mesma linha. */
  id: string
  gravidade: Gravidade
  titulo: string
  /** O porquê, com o número. Sem número, um achado é só uma opinião. */
  detalhe: string
  /**
   * Estava silenciado, e voltou porque o NÚMERO mudou.
   *
   * Quem disse que 120 PV está certo por causa de um item de campanha não disse
   * nada sobre 200. Sem esta volta, a primeira dispensa valeria para sempre e a
   * conferência ficaria cega justo onde alguém já tinha mexido.
   */
  voltou?: boolean
}

const PESO: Record<Gravidade, number> = { erro: 0, aviso: 1, dica: 2 }

/**
 * Tudo o que está estranho nesta ficha, do mais grave para o menos.
 *
 * A ordem é por gravidade e não por seção: quem abre a conferência quer saber
 * o que está QUEBRADO, e uma lista em ordem de tela enterra o erro de CA no
 * meio de três lembretes de escolha pendente.
 */
export function conferir(char: Character): Achado[] {
  return todos(char)
    .filter((a) => !estaSilenciado(char, a))
    .map((a) => (foiSilenciadoAntes(char, a) ? { ...a, voltou: true } : a))
    .sort((a, b) => PESO[a.gravidade] - PESO[b.gravidade])
}

/** Tudo o que a ficha produz, silenciado ou não. */
function todos(char: Character): Achado[] {
  return [
    ...daClasse(char),
    ...deVida(char),
    ...deMagia(char),
    ...deEquipamento(char),
    ...dePericias(char),
  ]
}

/**
 * Este achado foi dispensado, e continua sendo a MESMA afirmação?
 *
 * A comparação é com o texto inteiro, e não só com o id, porque é o texto que
 * carrega o número. Dispensar "a ficha tem 120 PV" não é dispensar "a ficha tem
 * 200 PV" — a segunda é outra coisa, e nunca foi conferida por ninguém.
 */
function estaSilenciado(char: Character, a: Achado): boolean {
  return char.conferenciaIgnorada?.[a.id] === a.detalhe
}

/** Já foi dispensado alguma vez, mas o texto mudou desde então. */
function foiSilenciadoAntes(char: Character, a: Achado): boolean {
  const marca = char.conferenciaIgnorada?.[a.id]
  return marca != null && marca !== a.detalhe
}

/** O que está silenciado agora, para a tela poder mostrar e desfazer. */
export function silenciados(char: Character): Achado[] {
  return todos(char).filter((a) => estaSilenciado(char, a))
}

/** "Isto não é erro." Guarda o texto junto, para o aviso voltar se ele mudar. */
export function silenciar(char: Character, achado: Achado): Partial<Character> {
  return {
    conferenciaIgnorada: { ...(char.conferenciaIgnorada ?? {}), [achado.id]: achado.detalhe },
  }
}

/** Voltar a avisar sobre um achado dispensado. */
export function voltarAAvisar(char: Character, id: string): Partial<Character> {
  const atual = char.conferenciaIgnorada ?? {}
  if (!(id in atual)) return {}
  const novo = { ...atual }
  delete novo[id]
  return { conferenciaIgnorada: novo }
}

/** Quantos achados de cada peso — para o selo da tela. */
export function resumo(achados: Achado[]): Record<Gravidade, number> {
  const r: Record<Gravidade, number> = { erro: 0, aviso: 0, dica: 0 }
  for (const a of achados) r[a.gravidade]++
  return r
}

// ---------------------------------------------------------------------------

function daClasse(char: Character): Achado[] {
  const fora: Achado[] = []
  const info = classInfo(char.classe)

  if (!char.classe) {
    fora.push({
      id: 'sem-classe',
      gravidade: 'aviso',
      titulo: 'Sem classe',
      detalhe: 'Quase nada pode ser conferido sem ela: PV, espaços de magia e proficiências saem da classe.',
    })
    return fora
  }

  // Entrar numa classe por multiclasse exige 13 no atributo principal dela E no
  // da que já se tinha. É a única regra do multiclasse que PROÍBE alguma coisa,
  // e ela mora numa nota de rodapé que ninguém lê duas vezes.
  for (const r of requisitosFaltando(char)) {
    fora.push({
      id: `multiclasse-${r.classe}`,
      gravidade: 'erro',
      titulo: `Sem o mínimo para multiclassar em ${r.classe}`,
      detalhe: `Precisa de 13 em ${
        r.bastaUm ? r.pede.map((p) => p.atributo.toUpperCase()).join(' ou ') : r.pede.map((p) => p.atributo.toUpperCase()).join(' e ')
      }; a ficha tem ${r.pede.map((p) => `${p.atributo.toUpperCase()} ${p.tem}`).join(', ')}.`,
    })
  }

  // As salvaguardas treinadas são as DUAS da classe, e não são escolha. Uma
  // ficha importada de fora costuma trazer três, ou as do multiclasse.
  // Com mais de uma classe isto sai da conferência: o multiclasse NÃO dá
  // salvaguardas, então a lista certa continua sendo a da classe de origem — e
  // adivinhar qual foi ela seria chutar.
  if (info && !ehMulticlasse(char)) {
    const esperadas = [...info.salvaguardas].sort().join(',')
    const tem = [...char.salvaguardasProficientes].sort().join(',')
    if (esperadas !== tem) {
      fora.push({
        id: 'salvaguardas',
        gravidade: 'aviso',
        titulo: 'Salvaguardas treinadas não são as da classe',
        detalhe: `${char.classe} treina ${nomes(info.salvaguardas)}; a ficha tem ${
          char.salvaguardasProficientes.length > 0 ? nomes(char.salvaguardasProficientes) : 'nenhuma'
        }.`,
      })
    }
  }

  // Nível e XP: o app tem a tabela, e a ficha pode ter subido de nível sem
  // registrar a experiência (ou o contrário).
  const minimo = xpDoNivel(char.nivel)
  const proximo = char.nivel < 20 ? xpDoNivel(char.nivel + 1) : Infinity
  // Zero de XP não é incoerência: muita mesa joga por marcos e nunca preenche.
  const xp = char.xp ?? 0
  if (xp > 0 && xp < minimo) {
    fora.push({
      id: 'xp-baixo',
      gravidade: 'aviso',
      titulo: 'XP abaixo do nível',
      detalhe: `Nível ${char.nivel} pede ${minimo} XP e a ficha tem ${xp}.`,
    })
  } else if (xp >= proximo) {
    fora.push({
      id: 'xp-sobrando',
      gravidade: 'dica',
      titulo: 'Dá para subir de nível',
      detalhe: `${xp} XP alcança o nível ${char.nivel + 1}, que pede ${proximo}.`,
    })
  }

  for (const e of escolhasPendentes(char)) {
    fora.push({
      id: `escolha-${e.nivel}-${e.oque}`,
      gravidade: 'aviso',
      titulo: 'Falta escolher',
      detalhe: `${e.nome} — do nível ${e.nivel}.`,
    })
  }

  return fora
}

function deVida(char: Character): Achado[] {
  const fora: Achado[] = []
  if (!classInfo(char.classe) || char.nivel < 1) return fora

  // A faixa possível de PV máximo: o mínimo é rolar 1 em todos os dados depois
  // do primeiro, o máximo é rolar cheio. Fora dela não é sorte — é conta errada.
  // Com mais de uma classe cada uma entra com o dado dela, senão um Guerreiro 3
  // / Mago 2 seria conferido contra a faixa de um guerreiro de 5.
  const con = abilityMod(char.atributos.con)
  const faixa = faixaDePv(char)
  if (faixa && (char.pvMax < faixa.minimo || char.pvMax > faixa.maximo)) {
    fora.push({
      id: 'pv-fora-da-faixa',
      gravidade: 'erro',
      titulo: 'PV máximo fora do possível',
      detalhe: `${emPalavras(char)} com CON ${sinal(con)} vai de ${faixa.minimo} a ${faixa.maximo} PV. A ficha tem ${char.pvMax}.`,
    })
  }

  if (char.pvAtual > char.pvMax) {
    fora.push({
      id: 'pv-acima-do-maximo',
      gravidade: 'erro',
      titulo: 'PV atual acima do máximo',
      detalhe: `${char.pvAtual} de ${char.pvMax}. Vida temporária tem campo próprio e não entra aqui.`,
    })
  }

  const dados = char.dadosDeVidaUsados ?? 0
  if (dados > char.nivel) {
    fora.push({
      id: 'dados-de-vida',
      gravidade: 'erro',
      titulo: 'Dados de vida gastos além do que existe',
      detalhe: `${dados} gastos de ${char.nivel} que a ficha tem.`,
    })
  }

  return fora
}

function deMagia(char: Character): Achado[] {
  const fora: Achado[] = []

  if (classesQueConjuram(char).length > 0 && !char.atributoConjuracao) {
    fora.push({
      id: 'sem-atributo-conjuracao',
      gravidade: 'erro',
      titulo: 'Sem atributo de conjuração',
      detalhe: `${char.classe} conjura, e sem esse campo a CD e o ataque de magia não têm como sair.`,
    })
  }

  // Os espaços que a tabela do SRD dá naquele nível. Uma ficha montada à mão —
  // ou subida de nível fora do app — fica com espaços a menos, e é o tipo de
  // coisa que só aparece na quarta luta do dia.
  //
  // Com mais de uma classe conjuradora a tabela é OUTRA: um Clérigo 3 / Mago 2
  // tem os espaços de um conjurador de nível 5, e não os de um clérigo de 3.
  const conjuradoras = classesQueConjuram(char)
  const esperados = ehMulticlasse(char)
    ? espacosDeMulticlasse(char)
    : espacosPorNivel(char.classe, char.nivel)
  if (conjuradoras.length > 0) {
    const errados: string[] = []
    for (let i = 0; i < 9; i++) {
      const tem = char.espacosMagia[i]?.total ?? 0
      if (tem !== esperados[i].total) errados.push(`${i + 1}º: ${tem} em vez de ${esperados[i].total}`)
    }
    if (errados.length > 0) {
      fora.push({
        id: 'espacos',
        gravidade: 'erro',
        titulo: 'Espaços de magia diferentes da tabela',
        detalhe: `${errados.join(' · ')}.`,
      })
    }
  }

  for (const [i, s] of char.espacosMagia.entries()) {
    if (s.usados > s.total) {
      fora.push({
        id: `espacos-usados-${i}`,
        gravidade: 'erro',
        titulo: `Espaços de ${i + 1}º gastos além do que existe`,
        detalhe: `${s.usados} usados de ${s.total}.`,
      })
    }
  }

  // Magia de círculo que a classe ainda não alcança.
  // O maior círculo é o do melhor caminho: com duas classes conjuradoras, quem
  // manda são os espaços combinados, e não a classe isolada.
  const teto = ehMulticlasse(char)
    ? espacosDeMulticlasse(char).reduce((maior, s, i) => (s.total > 0 ? i + 1 : maior), 0)
    : maiorCirculo(char.classe, char.nivel)
  if (conjuradoras.length > 0) {
    const altas = char.magias.filter((m) => m.nivel > teto)
    if (altas.length > 0) {
      fora.push({
        id: 'magia-alta',
        gravidade: 'aviso',
        titulo: 'Magia acima do círculo que a classe alcança',
        detalhe: `${altas.map((m) => `${m.nome} (${m.nivel}º)`).join(', ')} — ${emPalavras(char)} vai até o ${teto}º.`,
      })
    }
  }

  const falta = oQueFalta(char)
  if (falta) {
    if (falta.excedeu > 0) {
      fora.push({
        id: 'preparadas-demais',
        gravidade: 'erro',
        titulo: 'Magias preparadas acima da cota',
        detalhe: `${falta.tem.preparadas} preparadas para uma cota de ${falta.quota.preparadas}.`,
      })
    }
    if (falta.tem.truques > falta.quota.truques) {
      fora.push({
        id: 'truques-demais',
        gravidade: 'aviso',
        titulo: 'Truques acima da cota',
        detalhe: `${falta.tem.truques} de ${falta.quota.truques}. Pode vir de talento ou subclasse.`,
      })
    }
    if (usaGrimorio(char.classe) && falta.tem.anotadas > falta.quota.grimorio) {
      fora.push({
        id: 'grimorio-demais',
        gravidade: 'dica',
        titulo: 'Grimório acima do que a progressão dá',
        detalhe: `${falta.tem.anotadas} de ${falta.quota.grimorio} — normal se copiou pergaminhos.`,
      })
    }
    if (falta.algo && falta.excedeu === 0) {
      fora.push({
        id: 'falta-magia',
        gravidade: 'aviso',
        titulo: 'Faltam magias para escolher',
        detalhe: [
          falta.truques > 0 && `${falta.truques} truque(s)`,
          falta.grimorio > 0 && `${falta.grimorio} para o grimório`,
          falta.preparadas > 0 && `${falta.preparadas} para preparar`,
        ].filter(Boolean).join(' · ') + '.',
      })
    }
  }

  return fora
}

function deEquipamento(char: Character): Achado[] {
  const fora: Achado[] = []

  // A CA sobrescrita é uma saída legítima — e é também onde um número velho
  // fica preso. Depois de trocar de armadura, a ficha continua mostrando o da
  // armadura antiga sem nada indicar que ele parou de acompanhar.
  if (char.classeArmaduraManual != null) {
    const calculada = armorClass({ ...char, classeArmaduraManual: null })
    if (calculada !== char.classeArmaduraManual) {
      fora.push({
        id: 'ca-manual',
        gravidade: 'aviso',
        titulo: 'CA fixada à mão diverge da conta',
        detalhe: `A ficha mostra ${char.classeArmaduraManual}; o equipamento vestido dá ${calculada}.`,
      })
    }
  }

  const custo = custoDeArmadura(char)
  if (custo) {
    fora.push({
      id: 'armadura-sem-treino',
      gravidade: 'erro',
      titulo: 'Vestindo sem treino',
      detalhe: `${custo.pecas.join(' e ')}: desvantagem em todo teste de d20 de Força ou Destreza, e não conjura.`,
    })
  }

  const sobrando = excedeSintonia(char)
  if (sobrando > 0) {
    fora.push({
      id: 'sintonia',
      gravidade: 'erro',
      titulo: 'Itens sintonizados além do limite',
      detalhe: `${sobrando} a mais do que os 3 que a regra permite — o excedente simplesmente não funciona.`,
    })
  }

  // Arma na mão que a pessoa não sabe usar. Não é ilegal, mas o número do
  // ataque muda — e é justo o número que ninguém confere na hora.
  const semTreino = itensAtivos(char)
    .map((e) => ({ nome: e.nome, arma: armaBase(e) }))
    .filter((v) => v.arma && !proficienteComArma(char, v.arma))
  if (semTreino.length > 0) {
    fora.push({
      id: 'arma-sem-treino',
      gravidade: 'aviso',
      titulo: 'Arma empunhada sem proficiência',
      detalhe: `${semTreino.map((v) => v.nome).join(', ')} — o ataque sai sem os ${sinal(proficiencyBonus(char.nivel))} de proficiência.`,
    })
  }

  return fora
}

function dePericias(char: Character): Achado[] {
  const fora: Achado[] = []

  // Expertise dobra a proficiência, e por isso EXIGE proficiência. Sem ela o
  // app dobra zero e a perícia aparece com o bônus de quem não treinou nada.
  const orfas = char.periciasExpertise.filter((k) => !char.periciasProficientes.includes(k))
  if (orfas.length > 0) {
    fora.push({
      id: 'expertise-sem-proficiencia',
      gravidade: 'erro',
      titulo: 'Expertise sem proficiência',
      detalhe: `${orfas.map(nomeDaPericia).join(', ')} — expertise dobra o bônus de proficiência, e sem ele não há o que dobrar: sai +0 em vez de ${sinal(2 * proficiencyBonus(char.nivel))}.`,
    })
  }

  // Atributo acima de 20 é possível com item, e por isso é aviso e não erro.
  for (const [chave, valor] of Object.entries(char.atributos) as [AbilityKey, number][]) {
    if (valor > 20) {
      fora.push({
        id: `atributo-alto-${chave}`,
        gravidade: 'aviso',
        titulo: `${chave.toUpperCase()} acima de 20`,
        detalhe: `${valor}. O teto normal é 20 — só item ou traço passa disso.`,
      })
    }
    if (valor < 1 || valor > 30) {
      fora.push({
        id: `atributo-impossivel-${chave}`,
        gravidade: 'erro',
        titulo: `${chave.toUpperCase()} fora do possível`,
        detalhe: `${valor}. Atributo vai de 1 a 30.`,
      })
    }
  }

  return fora
}

// ---------------------------------------------------------------------------

const sinal = (n: number) => (n >= 0 ? `+${n}` : String(n))
const nomes = (chaves: AbilityKey[]) => chaves.map((k) => k.toUpperCase()).join(' e ')
const nomeDaPericia = (chave: string) => SKILLS.find((s) => s.key === chave)?.nome ?? chave

/**
 * Uma frase para quando não há nada.
 *
 * "Nenhum problema" precisa aparecer com a mesma clareza que os problemas: uma
 * conferência que fica muda quando está tudo certo não dá para distinguir de
 * uma conferência que não rodou.
 */
export const TUDO_CERTO = 'Nada estranho nesta ficha.'
