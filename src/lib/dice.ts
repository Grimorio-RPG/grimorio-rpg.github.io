// Motor de rolagem de dados.

export type ModoRolagem = 'normal' | 'vantagem' | 'desvantagem'

export interface RollResult {
  id: string
  rotulo: string // ex: "Furtividade", "Espada longa (dano)"
  notacao: string // ex: "1d20+8"
  dados: number[] // valores dos dados que contaram
  descartados: number[] // dados descartados (vantagem/desvantagem)
  modificador: number
  total: number
  modo: ModoRolagem
  d20: boolean // se é uma rolagem de teste (d20), habilita crítico
  critico: boolean // 20 natural
  falhaCritica: boolean // 1 natural
  timestamp: number
}

function d(faces: number): number {
  return Math.floor(Math.random() * faces) + 1
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3)
}

export interface Notacao {
  qtd: number
  faces: number
  modificador: number
}

/**
 * Interpreta notação de dados: "1d20+5", "2d6", "d8-1", "3d6 + 2".
 * Retorna null se não for uma notação válida.
 */
export function parseNotacao(texto: string): Notacao | null {
  const limpo = texto.replace(/\s+/g, '').toLowerCase()
  const m = limpo.match(/^(\d*)d(\d+)([+-]\d+)?$/)
  if (!m) return null
  const qtd = m[1] === '' ? 1 : parseInt(m[1], 10)
  const faces = parseInt(m[2], 10)
  const modificador = m[3] ? parseInt(m[3], 10) : 0
  if (qtd < 1 || qtd > 100 || faces < 2 || faces > 1000) return null
  return { qtd, faces, modificador }
}

/** Formata um modificador com sinal (0 vira string vazia). */
function sufixoMod(mod: number): string {
  if (mod === 0) return ''
  return mod > 0 ? `+${mod}` : `${mod}`
}

/**
 * Rola dados. Para d20 com vantagem/desvantagem, rola dois e mantém o
 * maior/menor (apenas quando é um único d20).
 */
export function rolar(
  qtd: number,
  faces: number,
  modificador: number,
  rotulo: string,
  modo: ModoRolagem = 'normal',
): RollResult {
  const ehTesteD20 = faces === 20 && qtd === 1
  const usaModo = ehTesteD20 && modo !== 'normal'

  let dados: number[] = []
  let descartados: number[] = []

  if (usaModo) {
    const a = d(20)
    const b = d(20)
    const manter = modo === 'vantagem' ? Math.max(a, b) : Math.min(a, b)
    const descartar = modo === 'vantagem' ? Math.min(a, b) : Math.max(a, b)
    dados = [manter]
    descartados = [descartar]
  } else {
    dados = Array.from({ length: qtd }, () => d(faces))
  }

  const soma = dados.reduce((acc, v) => acc + v, 0)
  const natural = ehTesteD20 ? dados[0] : 0

  return {
    id: uid(),
    rotulo,
    notacao: `${qtd}d${faces}${sufixoMod(modificador)}`,
    dados,
    descartados,
    modificador,
    total: soma + modificador,
    modo: usaModo ? modo : 'normal',
    d20: ehTesteD20,
    critico: ehTesteD20 && natural === 20,
    falhaCritica: ehTesteD20 && natural === 1,
    timestamp: Date.now(),
  }
}

/** Atalho: rola um teste de d20 com um bônus. */
export function rolarTeste(bonus: number, rotulo: string, modo: ModoRolagem = 'normal'): RollResult {
  return rolar(1, 20, bonus, rotulo, modo)
}

/**
 * Rola a partir de uma notação em texto (ex: "1d8+3 cortante").
 * Ignora o que vier depois da notação (tipo de dano).
 */
export function rolarTexto(texto: string, rotulo: string, modo: ModoRolagem = 'normal'): RollResult | null {
  const primeira = texto.trim().match(/\d*d\d+\s*(?:[+-]\s*\d+)?/i)
  if (!primeira) return null
  const n = parseNotacao(primeira[0])
  if (!n) return null
  return rolar(n.qtd, n.faces, n.modificador, rotulo, modo)
}

/** Descrição curta do resultado, para o histórico. */
export function descreveRolagem(r: RollResult): string {
  const partes = [r.dados.join(' + ')]
  if (r.modificador) partes.push(sufixoMod(r.modificador))
  return partes.join(' ')
}
