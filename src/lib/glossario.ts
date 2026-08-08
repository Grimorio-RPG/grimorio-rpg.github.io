// Achar os termos do glossário dentro de um texto qualquer.
//
// Fica separado da tela porque é a parte que erra em silêncio: um índice
// deslocado por causa de um acento não quebra nada, só recorta o link uma letra
// fora do lugar — e ninguém repara olhando de passagem.

import { FORMAS, acharVerbete, type Verbete } from '../data/glossario'

function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * A expressão que acha qualquer termo conhecido.
 *
 * `FORMAS` já vem da mais longa para a mais curta, e a alternância do regex
 * respeita essa ordem — é o que faz "ação bônus" ser reconhecida inteira em vez
 * de virar "ação" seguida de um "bônus" solto.
 *
 * Montada uma vez: recriar a cada texto renderizado custaria caro numa ficha
 * com dezenas de descrições.
 */
const RE_TERMOS = new RegExp(`\\b(${FORMAS.map(escapar).join('|')})\\b`, 'g')

/**
 * O texto sem acento e em minúsculas, para procurar os termos.
 *
 * O que importa é o comprimento: os índices que o regex acha aqui vão fatiar o
 * texto ORIGINAL, então um caractere a mais ou a menos recorta o link fora do
 * lugar. Decompor e tirar os diacríticos devolve "ã" a um "a" só, então o
 * alinhamento se mantém — mas isso é uma propriedade do alfabeto latino, não
 * uma garantia da função. Quem confere de verdade é a checagem abaixo, e o
 * teste que remonta cada verbete e exige o texto igual ao que entrou.
 */
function paraBusca(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export interface Pedaco {
  texto: string
  /** Presente quando este pedaço é um termo que abre um verbete. */
  verbete?: Verbete
  forte?: boolean
}

/**
 * Quebra o texto em pedaços: texto puro, **negrito** e termos do glossário.
 *
 * `exceto` é o id do verbete que está sendo lido agora — clicar em "sintonia"
 * dentro da explicação da sintonia não leva a lugar nenhum.
 */
export function fatiarTexto(texto: string, exceto?: string): Pedaco[] {
  const fora: Pedaco[] = []

  // Primeiro o **negrito**, porque os asteriscos não podem sobrar no meio de um
  // termo — "**sintonia**" tem de virar um link em negrito, não o texto literal.
  for (const parte of (texto ?? '').split(/(\*\*[^*]+\*\*)/g)) {
    if (!parte) continue
    const forte = parte.startsWith('**') && parte.endsWith('**')
    const cru = forte ? parte.slice(2, -2) : parte
    for (const p of comTermos(cru, exceto)) fora.push({ ...p, forte: forte || p.forte })
  }

  return fora
}

function comTermos(texto: string, exceto?: string): Pedaco[] {
  const fora: Pedaco[] = []
  const busca = paraBusca(texto)

  // Se o alinhamento se perdeu, é melhor não marcar nada do que marcar errado:
  // um texto colado de outro lugar pode trazer um caractere que encolhe ou
  // cresce ao normalizar, e daí em diante todo link sairia deslocado.
  if (busca.length !== texto.length) return [{ texto }]

  let fim = 0

  RE_TERMOS.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = RE_TERMOS.exec(busca)) !== null) {
    const verbete = acharVerbete(m[1])
    if (!verbete || verbete.id === exceto) continue

    if (m.index > fim) fora.push({ texto: texto.slice(fim, m.index) })
    fora.push({ texto: texto.slice(m.index, m.index + m[1].length), verbete })
    fim = m.index + m[1].length
  }

  if (fim < texto.length) fora.push({ texto: texto.slice(fim) })
  return fora
}
