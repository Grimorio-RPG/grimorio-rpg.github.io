// Lê um bloco de estatísticas colado e separa em campos.
//
// A alternativa era mandar a imagem para um modelo com visão, o que custa
// dinheiro por criatura e exige guardar uma chave de API. Texto colado resolve
// o mesmo problema de graça e sem depender de ninguém: quase toda fonte de
// stat block (PDF, site, documento) permite selecionar e copiar.
//
// Nada aqui adivinha: o que não for reconhecido fica em branco para você
// preencher. Um campo errado preenchido com confiança é pior que um vazio.

import type { Monster, MonsterAction, TipoAcaoMonstro } from '../types'
import { uid } from './character'

/** Rótulos aceitos em português e inglês — as fontes variam. */
const R = {
  ca: /\b(?:CA|AC|Classe de Armadura|Armor Class)\b[\s:]*(\d+)/i,
  pv: /\b(?:PV|HP|Pontos de Vida|Hit Points)\b[\s:]*(\d+)/i,
  nd: /\b(?:ND|CR|N[íi]vel de Desafio|Challenge)\b[\s:]*([\d/]+)/i,
  deslocamento: /\b(?:Deslocamento|Speed)\b[\s:]*([^\n]+)/i,
  pericias: /\b(?:Per[íi]cias|Skills)\b[\s:]*([^\n]+)/i,
  sentidos: /\b(?:Sentidos|Senses)\b[\s:]*([^\n]+)/i,
  idiomas: /\b(?:Idiomas|Languages)\b[\s:]*([^\n]+)/i,
}

const ATRIBUTOS = ['for', 'des', 'con', 'int', 'sab', 'car'] as const
const ROTULOS_ATRIBUTO: Record<(typeof ATRIBUTOS)[number], RegExp> = {
  for: /\b(?:FOR|STR)\b/i,
  des: /\b(?:DES|DEX)\b/i,
  con: /\b(?:CON)\b/i,
  int: /\b(?:INT)\b/i,
  sab: /\b(?:SAB|WIS)\b/i,
  car: /\b(?:CAR|CHA)\b/i,
}

const TAMANHOS_CONHECIDOS = ['Miúdo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Colossal']

function primeiro(texto: string, re: RegExp): string {
  return texto.match(re)?.[1]?.trim() ?? ''
}

/**
 * Atributos.
 *
 * Duas formas no mundo real: tudo inline ("FOR 14 (+2)") ou uma linha de
 * rótulos seguida de uma linha de valores, que é como um PDF em colunas costuma
 * ser copiado.
 */
function lerAtributos(texto: string): Partial<Record<(typeof ATRIBUTOS)[number], number>> {
  const achados: Partial<Record<(typeof ATRIBUTOS)[number], number>> = {}

  // Forma 1: rótulo seguido de número.
  for (const chave of ATRIBUTOS) {
    const fonte = ROTULOS_ATRIBUTO[chave].source
    const m = texto.match(new RegExp(`${fonte}[\\s:]*?(\\d{1,2})\\b`, 'i'))
    if (m) achados[chave] = Number(m[1])
  }
  if (Object.keys(achados).length >= 6) return achados

  // Forma 2: linha de rótulos, valores na linha seguinte.
  const linhas = texto.split('\n')
  const iRotulos = linhas.findIndex((l) =>
    ATRIBUTOS.every((k) => ROTULOS_ATRIBUTO[k].test(l)),
  )
  if (iRotulos >= 0) {
    for (let i = iRotulos + 1; i < Math.min(iRotulos + 4, linhas.length); i++) {
      // Pega só o valor, não o modificador entre parênteses.
      const numeros = [...linhas[i].matchAll(/(\d{1,2})\s*\([+-]?\d+\)/g)].map((m) => Number(m[1]))
      const soltos = numeros.length >= 6 ? numeros : linhas[i].match(/\b\d{1,2}\b/g)?.map(Number) ?? []
      if (soltos.length >= 6) {
        ATRIBUTOS.forEach((k, idx) => (achados[k] = soltos[idx]))
        break
      }
    }
  }
  return achados
}

/**
 * As seções que um bloco de estatísticas pode ter, e o que cada uma vira.
 *
 * A ordem importa: "AÇÕES LENDÁRIAS" precisa ser testada antes de "AÇÕES",
 * senão o cabeçalho mais específico é engolido pelo mais geral.
 */
const SECOES: { tipo: TipoAcaoMonstro | 'lore'; re: RegExp }[] = [
  { tipo: 'lendaria', re: /^[ \t]*(?:A[ÇC][ÕO]ES\s+LEND[ÁA]RIAS|LEND[ÁA]RIAS|LEGENDARY\s+ACTIONS?)[ \t]*:?[ \t]*$/im },
  { tipo: 'covil', re: /^[ \t]*(?:A[ÇC][ÕO]ES\s+DE\s+COVIL|A[ÇC][ÕO]ES\s+DE\s+TOCA|LAIR\s+ACTIONS?)[ \t]*:?[ \t]*$/im },
  { tipo: 'bonus', re: /^[ \t]*(?:A[ÇC][ÕO]ES\s+B[ÔO]NUS|A[ÇC][ÃA]O\s+B[ÔO]NUS|BONUS\s+ACTIONS?)[ \t]*:?[ \t]*$/im },
  { tipo: 'reacao', re: /^[ \t]*(?:REA[ÇC][ÕO]ES|REA[ÇC][ÃA]O|REACTIONS?)[ \t]*:?[ \t]*$/im },
  { tipo: 'acao', re: /^[ \t]*(?:A[ÇC][ÕO]ES|ACTIONS)[ \t]*:?[ \t]*$/im },
  { tipo: 'lore', re: /^[ \t]*(?:LORE|DESCRI[ÇC][ÃA]O|DESCRIPTION)[ \t]*:?[ \t]*$/im },
]

/** "Custa 2 Ações" / "Costs 2 Actions" no nome da entrada lendária. */
const CUSTO_LENDARIA = /\(\s*custa\s+(\d+)\s+a[çc][õo]es?\s*\)|\(\s*costs?\s+(\d+)\s+actions?\s*\)/i

/**
 * Quantas ações lendárias por rodada, lidas do parágrafo de abertura da seção.
 *
 * "O dragão pode realizar 3 ações lendárias..." — é ali que o orçamento mora,
 * nunca no número de entradas listadas.
 */
function lerOrcamentoLendarias(preambulo: string): number {
  const m = preambulo.match(/(\d+)\s+a[çc][õo]es\s+lend[áa]rias|(\d+)\s+legendary\s+actions?/i)
  const n = Number(m?.[1] ?? m?.[2] ?? 0)
  return n > 0 && n <= 10 ? n : 0
}

/**
 * Frases de abertura destas seções, que explicam a regra e não são uma ação.
 *
 * Precisam ser reconhecidas pelo que dizem, não pelo tamanho. Elas têm a mesma
 * forma "Maiúscula … ponto" das entradas de verdade, e antes só escapavam de
 * virar uma ação falsa por passarem de 60 caracteres — uma abertura curta
 * ("O dragão tem 3 ações lendárias.") entrava na lista como se fosse um golpe.
 */
const PREAMBULOS = [
  /a[çc][õo]es\s+lend[áa]rias|legendary\s+action/i,
  /iniciativa\s+20|initiative\s+count\s+20|a[çc][ãa]o\s+de\s+covil|lair\s+action/i,
]

/** Separa a explicação inicial das entradas de verdade. */
function tirarPreambulo(trecho: string): { preambulo: string; resto: string } {
  const linhas = trecho.split('\n')
  let i = 0
  while (i < linhas.length) {
    const linha = linhas[i].trim()
    if (linha && !PREAMBULOS.some((re) => re.test(linha))) break
    i++
  }
  return { preambulo: linhas.slice(0, i).join('\n'), resto: linhas.slice(i).join('\n') }
}

/** Quebra "Nome. Descrição" repetido em entradas. */
function lerEntradas(trecho: string, tipo: TipoAcaoMonstro): MonsterAction[] {
  const acoes: MonsterAction[] = []
  // "Nome." no começo de uma linha, seguido do resto até a próxima entrada.
  const re = /^[ \t]*([A-ZÀ-Ú][^.\n]{1,60})\.\s*([\s\S]*?)(?=^[ \t]*[A-ZÀ-Ú][^.\n]{1,60}\.|$)/gm
  for (const m of trecho.matchAll(re)) {
    let nome = m[1].trim()
    const descricao = m[2].replace(/\s+/g, ' ').trim()
    if (!descricao) continue

    const custo = nome.match(CUSTO_LENDARIA)
    const custoLendaria = custo ? Number(custo[1] ?? custo[2]) : undefined
    if (custo) nome = nome.replace(CUSTO_LENDARIA, '').trim()

    acoes.push({ id: uid(), nome, descricao, tipo, ...(custoLendaria ? { custoLendaria } : {}) })
  }
  return acoes
}

/**
 * Ações de todas as seções, cada uma marcada com o que é.
 *
 * Antes daqui só a seção "AÇÕES" era lida, e o leitor PARAVA ao encontrar
 * "LENDÁRIAS" — quem colava um chefe do livro perdia exatamente o que fazia
 * dele um chefe. Reações e ações bônus sumiam pelo mesmo motivo.
 */
function lerAcoes(texto: string): { acoes: MonsterAction[]; lendarias: number } {
  // Onde cada seção começa. Uma seção termina onde a próxima começa, então
  // precisamos das posições de todas antes de fatiar qualquer uma.
  const marcos = SECOES.flatMap(({ tipo, re }) => {
    const achado = texto.match(re)
    return achado?.index == null ? [] : [{ tipo, inicio: achado.index, cabecalho: achado[0] }]
  }).sort((a, b) => a.inicio - b.inicio)

  const acoes: MonsterAction[] = []
  let lendarias = 0

  for (let i = 0; i < marcos.length; i++) {
    const { tipo, inicio, cabecalho } = marcos[i]
    const fim = i + 1 < marcos.length ? marcos[i + 1].inicio : texto.length
    let trecho = texto.slice(inicio + cabecalho.length, fim)

    if (tipo === 'lore') continue

    // Lendárias e de covil abrem explicando a regra; essa frase não é uma ação.
    if (tipo === 'lendaria' || tipo === 'covil') {
      const { preambulo, resto } = tirarPreambulo(trecho)
      if (tipo === 'lendaria') lendarias = lerOrcamentoLendarias(preambulo)
      trecho = resto
    }

    acoes.push(...lerEntradas(trecho, tipo))
  }

  return { acoes, lendarias }
}

/** Traços: o que vem antes das ações, depois da linha de atributos. */
function lerTracos(texto: string): string {
  const cab = texto.search(/^\s*(?:CARACTER[ÍI]STICAS|TRA[ÇC]OS|TRAITS|FEATURES)\s*$/im)
  if (cab < 0) return ''
  let trecho = texto.slice(cab).replace(/^[^\n]*\n/, '')
  const fim = trecho.search(/^\s*(?:A[ÇC][ÕO]ES|ACTIONS)\s*$/im)
  if (fim >= 0) trecho = trecho.slice(0, fim)
  return trecho.trim()
}

/** Primeira linha não vazia vira o nome. */
function lerNome(texto: string): string {
  const linha = texto.split('\n').map((l) => l.trim()).find(Boolean) ?? ''
  return linha.replace(/\s+/g, ' ').slice(0, 80)
}

/** "Humanoide Médio (orc), leal e mau" → tamanho Médio, tipo Humanoide (orc). */
function lerTipoETamanho(texto: string): { tamanho: string; tipo: string } {
  const linhas = texto.split('\n').map((l) => l.trim()).filter(Boolean)
  for (const linha of linhas.slice(0, 6)) {
    const tamanho = TAMANHOS_CONHECIDOS.find((t) => new RegExp(`\\b${t}\\b`, 'i').test(linha))
    if (!tamanho) continue
    const tipo = linha
      .replace(new RegExp(`\\b${tamanho}\\b`, 'i'), '')
      .split(',')[0]
      .replace(/\s+/g, ' ')
      .trim()
    return { tamanho, tipo }
  }
  return { tamanho: '', tipo: '' }
}

export interface ResultadoLeitura {
  campos: Partial<Monster>
  /** Nomes dos campos reconhecidos, para a tela dizer o que preencheu. */
  reconhecidos: string[]
}

/**
 * Lê o bloco e devolve só o que reconheceu.
 *
 * Campos não encontrados ficam de fora do objeto — quem chama mescla sobre o
 * monstro atual, então um campo ausente preserva o que já estava lá.
 */
export function lerStatBlock(texto: string): ResultadoLeitura {
  const campos: Partial<Monster> = {}
  const reconhecidos: string[] = []
  const anota = (rotulo: string) => reconhecidos.push(rotulo)

  const nome = lerNome(texto)
  if (nome) {
    campos.nome = nome
    anota('nome')
  }

  const { tamanho, tipo } = lerTipoETamanho(texto)
  if (tamanho) {
    campos.tamanho = tamanho
    anota('tamanho')
  }
  if (tipo) {
    campos.tipo = tipo
    anota('tipo')
  }

  const ca = primeiro(texto, R.ca)
  if (ca) {
    campos.ca = Number(ca)
    anota('CA')
  }

  const pv = primeiro(texto, R.pv)
  if (pv) {
    campos.pvMax = Number(pv)
    campos.pvAtual = Number(pv)
    anota('PV')
  }

  const nd = primeiro(texto, R.nd)
  if (nd) {
    campos.nd = nd
    anota('ND')
  }

  const deslocamento = primeiro(texto, R.deslocamento)
  if (deslocamento) {
    campos.deslocamento = deslocamento
    anota('deslocamento')
  }

  const atributos = lerAtributos(texto)
  if (Object.keys(atributos).length >= 6) {
    campos.atributos = {
      for: atributos.for ?? 10,
      des: atributos.des ?? 10,
      con: atributos.con ?? 10,
      int: atributos.int ?? 10,
      sab: atributos.sab ?? 10,
      car: atributos.car ?? 10,
    }
    anota('atributos')
  }

  const { acoes, lendarias } = lerAcoes(texto)
  if (acoes.length > 0) {
    campos.acoes = acoes
    anota(`${acoes.length} ${acoes.length === 1 ? 'ação' : 'ações'}`)
    // Vale a pena dizer separado: é o que antes se perdia calado.
    const porTipo = (t: TipoAcaoMonstro) => acoes.filter((a) => a.tipo === t).length
    if (porTipo('lendaria') > 0) anota(`${porTipo('lendaria')} lendárias`)
    if (porTipo('covil') > 0) anota(`${porTipo('covil')} de covil`)
    if (porTipo('reacao') > 0) anota(`${porTipo('reacao')} reações`)
    if (porTipo('bonus') > 0) anota(`${porTipo('bonus')} ações bônus`)
  }
  if (lendarias > 0) {
    campos.acoesLendarias = lendarias
    anota(`${lendarias} usos lendários/rodada`)
  }

  // Perícias, sentidos e idiomas não têm campo próprio no monstro: juntam-se
  // aos traços, que é texto livre, em vez de se perderem.
  const extras = [
    primeiro(texto, R.pericias) && `Perícias: ${primeiro(texto, R.pericias)}`,
    primeiro(texto, R.sentidos) && `Sentidos: ${primeiro(texto, R.sentidos)}`,
    primeiro(texto, R.idiomas) && `Idiomas: ${primeiro(texto, R.idiomas)}`,
  ].filter(Boolean)

  const tracos = [lerTracos(texto), ...extras].filter(Boolean).join('\n\n')
  if (tracos) {
    campos.tracos = tracos
    anota('traços')
  }

  return { campos, reconhecidos }
}
