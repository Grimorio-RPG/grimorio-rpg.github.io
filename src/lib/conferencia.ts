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
import { espacosPorNivel, maiorCirculo, temEspacos, xpDoNivel } from '../data/progression'
import { oQueFalta, usaGrimorio } from './conjuracao'
import { escolhasPendentes } from './features'
import { custoDeArmadura, proficienteComArma } from './proficiencias'
import { armaBase, excedeSintonia, itensAtivos } from './equipamento'
import { SKILLS } from '../data/rules'

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
  const achados: Achado[] = [
    ...daClasse(char),
    ...deVida(char),
    ...deMagia(char),
    ...deEquipamento(char),
    ...dePericias(char),
  ]
  return achados.sort((a, b) => PESO[a.gravidade] - PESO[b.gravidade])
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

  // As salvaguardas treinadas são as DUAS da classe, e não são escolha. Uma
  // ficha importada de fora costuma trazer três, ou as do multiclasse.
  if (info) {
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
  const info = classInfo(char.classe)
  if (!info || char.nivel < 1) return fora

  // A faixa possível de PV máximo: o mínimo é rolar 1 em todos os dados depois
  // do primeiro, o máximo é rolar cheio. Fora dela não é sorte — é conta errada.
  const con = abilityMod(char.atributos.con)
  const minimo = info.dadoDeVida + (char.nivel - 1) * 1 + char.nivel * con
  const maximo = char.nivel * info.dadoDeVida + char.nivel * con

  if (char.pvMax < minimo || char.pvMax > maximo) {
    fora.push({
      id: 'pv-fora-da-faixa',
      gravidade: 'erro',
      titulo: 'PV máximo fora do possível',
      detalhe: `${char.classe} de nível ${char.nivel} com CON ${sinal(con)} vai de ${minimo} a ${maximo} PV. A ficha tem ${char.pvMax}.`,
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

  if (temEspacos(char.classe) && !char.atributoConjuracao) {
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
  const esperados = espacosPorNivel(char.classe, char.nivel)
  if (temEspacos(char.classe)) {
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
  const teto = maiorCirculo(char.classe, char.nivel)
  if (temEspacos(char.classe)) {
    const altas = char.magias.filter((m) => m.nivel > teto)
    if (altas.length > 0) {
      fora.push({
        id: 'magia-alta',
        gravidade: 'aviso',
        titulo: 'Magia acima do círculo que a classe alcança',
        detalhe: `${altas.map((m) => `${m.nome} (${m.nivel}º)`).join(', ')} — ${char.classe} de nível ${char.nivel} vai até o ${teto}º.`,
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
