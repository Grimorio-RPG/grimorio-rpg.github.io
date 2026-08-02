// Tabelas sorteáveis: o baralho do DM.
//
// Encontros por região, nomes de NPC, rumores de taverna, complicações. É o
// material que todo DM tem num caderno e nunca tem na hora — e improvisar um
// nome no susto produz sempre o mesmo "Gareth".
//
// Tudo aqui é prep, e prep não sai na projeção: a tabela conta o que ainda vai
// acontecer.

import type { EntradaTabela, TabelaSorteavel } from '../types'
import { uid } from './character'

export function novaTabela(nome = ''): TabelaSorteavel {
  return { id: uid(), nome, contexto: '', entradas: [novaEntrada()] }
}

export function novaEntrada(texto = ''): EntradaTabela {
  return { id: uid(), texto }
}

/** Uma tabela sem entrada preenchida não sorteia nada. */
export function tabelaUtil(t: TabelaSorteavel): boolean {
  return t.entradas.some((e) => e.texto.trim())
}

/**
 * Sorteia uma entrada, respeitando o peso.
 *
 * O peso existe para "nada acontece" poder ser comum sem ocupar seis linhas
 * iguais na tabela. Ausente vale 1, que é o caso da maioria.
 */
export function sortear(t: TabelaSorteavel): string {
  const validas = t.entradas.filter((e) => e.texto.trim())
  if (validas.length === 0) return ''

  const total = validas.reduce((s, e) => s + Math.max(1, e.peso ?? 1), 0)
  let ponto = Math.random() * total
  for (const e of validas) {
    ponto -= Math.max(1, e.peso ?? 1)
    if (ponto < 0) return e.texto.trim()
  }
  return validas[validas.length - 1].texto.trim()
}

/**
 * Sorteia sem repetir o que acabou de sair.
 *
 * Um sorteio puro repete com frequência incômoda — três rumores seguidos
 * iguais fazem a mesa achar que o botão está quebrado. Com uma entrada só, ou
 * quando todas já saíram, repetir é a única saída honesta.
 */
export function sortearSemRepetir(t: TabelaSorteavel, recentes: string[]): string {
  const validas = t.entradas.filter((e) => e.texto.trim())
  if (validas.length <= 1) return sortear(t)

  const evitar = new Set(recentes)
  const livres = validas.filter((e) => !evitar.has(e.texto.trim()))
  if (livres.length === 0) return sortear(t)

  return sortear({ ...t, entradas: livres })
}

/**
 * As tabelas que valem para um lugar.
 *
 * O contexto é texto livre e a comparação é frouxa de propósito: quem escreve
 * "Floresta de Neverwinter" no ponto do mapa e "floresta" na tabela quer que as
 * duas se encontrem.
 */
export function tabelasDoContexto(tabelas: TabelaSorteavel[], lugar: string): TabelaSorteavel[] {
  const alvo = normalizar(lugar)
  if (!alvo) return tabelas
  return tabelas.filter((t) => {
    const ctx = normalizar(t.contexto)
    if (!ctx) return true // sem contexto = vale em qualquer lugar
    return alvo.includes(ctx) || ctx.includes(alvo)
  })
}

/** Minúsculas e sem acento, para a comparação não depender de digitação. */
function normalizar(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    // Os acentos, já separados pelo NFD. Por propriedade Unicode, e não por
    // uma faixa de caracteres literais: aquela faixa é invisível num editor e
    // some num copiar/colar desatento.
    .replace(/\p{Diacritic}/gu, '')
}
