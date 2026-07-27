// Lê um bloco de estatísticas colado e separa em campos.
//
// A alternativa era mandar a imagem para um modelo com visão, o que custa
// dinheiro por criatura e exige guardar uma chave de API. Texto colado resolve
// o mesmo problema de graça e sem depender de ninguém: quase toda fonte de
// stat block (PDF, site, documento) permite selecionar e copiar.
//
// Nada aqui adivinha: o que não for reconhecido fica em branco para você
// preencher. Um campo errado preenchido com confiança é pior que um vazio.

import type { Monster, MonsterAction } from '../types'
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
 * Ações: entradas no formato "Nome. Descrição".
 *
 * Só olha depois do cabeçalho de ações — antes dele vêm traços, que também
 * usam "Nome. Descrição" e virariam ações falsas.
 */
function lerAcoes(texto: string): MonsterAction[] {
  const inicio = texto.search(/^\s*(?:A[ÇC][ÕO]ES|ACTIONS)\s*$/im)
  if (inicio < 0) return []
  let trecho = texto.slice(inicio).replace(/^[^\n]*\n/, '')

  // Para no próximo cabeçalho de seção.
  const fim = trecho.search(/^\s*(?:REA[ÇC][ÃA]O|REACTIONS?|A[ÇC][ÃA]O B[ÔO]NUS|BONUS ACTIONS?|LENDÁRIAS|LEGENDARY|LORE)\s*$/im)
  if (fim >= 0) trecho = trecho.slice(0, fim)

  const acoes: MonsterAction[] = []
  // "Nome." no começo de uma linha, seguido do resto até a próxima entrada.
  const re = /^[ \t]*([A-ZÀ-Ú][^.\n]{1,60})\.\s*([\s\S]*?)(?=^[ \t]*[A-ZÀ-Ú][^.\n]{1,60}\.|$)/gm
  for (const m of trecho.matchAll(re)) {
    const nome = m[1].trim()
    const descricao = m[2].replace(/\s+/g, ' ').trim()
    if (!descricao) continue
    acoes.push({ id: uid(), nome, descricao })
  }
  return acoes
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

  const acoes = lerAcoes(texto)
  if (acoes.length > 0) {
    campos.acoes = acoes
    anota(`${acoes.length} ${acoes.length === 1 ? 'ação' : 'ações'}`)
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
