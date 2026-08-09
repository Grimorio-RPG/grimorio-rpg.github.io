// Lê a área de efeito de cada magia do SRD e gera a lista de gabaritos.
//
// A fonte não é o PDF: é `src/data/srd/magias-srd.ts`, que já saiu dele. O
// texto oficial escreve a área na própria frase — "each creature in a
// 20-foot-radius Sphere", "a 15-foot Cone", "a 100-foot-long, 5-foot-wide
// Line" —, então o número que o mapa precisa já está no repositório. Digitá-lo
// à mão para trezentas magias seria trezentas chances de errar em silêncio.
//
// A unidade que sai daqui é o QUADRADO, e não o metro: o gabarito é desenhado
// sobre uma grade, e 20 pés são 4 quadrados exatos. Guardar 6 m e voltar para
// quadrados na tela seria dividir por 1,5 o tempo todo para chegar ao inteiro
// que já existia aqui.
//
// Uso: node scripts/srd/areas.mjs
//
// SRD 5.2.1, Creative Commons Attribution 4.0.

import { readFileSync, writeFileSync } from 'node:fs'

const magias = readFileSync('src/data/srd/magias-srd.ts', 'utf8')
const nomes = readFileSync('src/data/srd/nomes-magias.ts', 'utf8')

/** Os nomes em português, lidos do arquivo que a tela já usa. */
const NOMES_PT = {}
for (const m of nomes.matchAll(/^\s*'([^']+)':\s*'([^']+)',/gm)) NOMES_PT[m[1]] = m[2]

/**
 * As formas do livro, e o que cada uma vira no tabuleiro.
 *
 * O CILINDRO e a EMANAÇÃO não ganham geometria própria: vistos de cima, um
 * cilindro é um círculo e uma emanação é um círculo em volta de quem conjura.
 * O rótulo guarda a palavra do livro, porque é ela que a mesa vai procurar.
 */
const FORMAS = {
  Sphere: { tipo: 'esfera', forma: 'Esfera' },
  Cylinder: { tipo: 'esfera', forma: 'Cilindro' },
  Emanation: { tipo: 'esfera', forma: 'Emanação' },
  Cone: { tipo: 'cone', forma: 'Cone' },
  Line: { tipo: 'linha', forma: 'Linha' },
  Cube: { tipo: 'cubo', forma: 'Cubo' },
  square: { tipo: 'cubo', forma: 'Quadrado' },
}

/**
 * Os jeitos de escrever a mesma coisa.
 *
 * A ordem importa: "20-foot-radius, 40-foot-high Cylinder" tem de casar com o
 * padrão do raio ANTES do padrão simples, senão o gabarito sai com 40 de raio —
 * a altura do cilindro, que visto de cima não é nada.
 */
const PADROES = [
  // "100-foot-long, 5-foot-wide Line" e "5-foot-wide, 60-foot-long Line"
  { re: /(\d+)-foot-long,?\s*(\d+)-foot-wide (Line)/gi, tamanho: 1, largura: 2, forma: 3 },
  { re: /(\d+)-foot-wide,?\s*(\d+)-foot-long (Line)/gi, tamanho: 2, largura: 1, forma: 3 },
  // "A Line of strong wind 60 feet long and 10 feet wide"
  { re: /(Line)[^.]{0,60}?(\d+) feet long and (\d+) feet wide/gi, tamanho: 2, largura: 3, forma: 1 },
  // "20-foot-radius, 40-foot-high Cylinder" — a altura não conta de cima
  { re: /(\d+)-foot-radius,?\s*\d+-foot[- ]?(?:high|tall) (Cylinder)/gi, tamanho: 1, forma: 2 },
  // "20-foot-radius Sphere", "10-foot-radius Cylinder"
  { re: /(\d+)-foot-radius,?\s*(Sphere|Cylinder|Emanation)/gi, tamanho: 1, forma: 2 },
  // "5-foot-diameter sphere" — o raio é a metade
  { re: /(\d+)-foot-diameter (sphere)/gi, tamanho: 1, forma: 2, metade: true },
  // "15-foot Cone", "20-foot Cube", "30-foot Emanation", "20-foot square"
  { re: /(\d+)-foot[- ](Cone|Cube|Emanation|square)/gi, tamanho: 1, forma: 2 },
]

const PES_POR_QUADRADO = 5

/** A primeira área que o texto descreve — a que a magia É. */
function areaDe(texto) {
  let melhor = null
  for (const p of PADROES) {
    p.re.lastIndex = 0
    let m
    while ((m = p.re.exec(texto))) {
      if (melhor && m.index >= melhor.onde) continue
      const chave = m[p.forma]
      const forma = FORMAS[chave] ?? FORMAS[chave[0].toUpperCase() + chave.slice(1)]
      if (!forma) continue
      const pes = Number(m[p.tamanho]) / (p.metade ? 2 : 1)
      melhor = {
        onde: m.index,
        tipo: forma.tipo,
        forma: forma.forma,
        quadrados: pes / PES_POR_QUADRADO,
        largura: p.largura ? Number(m[p.largura]) / PES_POR_QUADRADO : undefined,
      }
    }
  }
  return melhor
}

const achadas = []
for (const linha of magias.matchAll(/\{ nome: "([^"]+)".*?texto: "((?:[^"\\]|\\.)*)"/g)) {
  const [, nome, texto] = linha
  const a = areaDe(texto)
  if (!a) continue
  // Meio quadrado não existe na grade, e um gabarito de 0,5 não se desenha nem
  // se conta. A única fonte deles é a esfera de diâmetro, que é um objeto.
  if (a.quadrados < 1) continue
  achadas.push({ nome, nomePt: NOMES_PT[nome] ?? nome, ...a })
}

achadas.sort((a, b) => a.nomePt.localeCompare(b.nomePt, 'pt-BR'))

const linhas = achadas.map((a) => {
  const largura = a.largura ? `, largura: ${a.largura}` : ''
  return `  { nome: ${JSON.stringify(a.nomePt)}, original: ${JSON.stringify(a.nome)}, tipo: '${a.tipo}', forma: '${a.forma}', quadrados: ${a.quadrados}${largura} },`
})

const saida = `// GERADO por scripts/srd/areas.mjs — não edite à mão.
//
// A área de efeito de cada magia do SRD que tem uma, em QUADRADOS de grade.
// Vinte pés são quatro quadrados: o número já nasce inteiro, e a tela nunca
// precisa dividir por 1,5 para saber quantas casas pintar.
//
// SRD 5.2.1, Creative Commons Attribution 4.0.

import type { TipoDeGabarito } from '../../lib/gabaritos'

export interface AreaDeMagia {
  /** O nome em português — é por ele que a mesa procura. */
  nome: string
  /** O nome oficial em inglês, para conferir no livro. */
  original: string
  /** O que desenhar no tabuleiro. */
  tipo: TipoDeGabarito
  /** A palavra do livro: Cilindro e Emanação viram círculo visto de cima. */
  forma: string
  /** Raio da esfera, comprimento do cone e da linha, lado do cubo. */
  quadrados: number
  /** Largura da linha. Ausente = 1 quadrado, que é o padrão do livro. */
  largura?: number
}

export const AREAS_SRD: AreaDeMagia[] = [
${linhas.join('\n')}
]
`

writeFileSync('src/data/srd/areas-srd.ts', saida)

const porTipo = {}
for (const a of achadas) porTipo[a.forma] = (porTipo[a.forma] ?? 0) + 1
console.log(`${achadas.length} magias com área:`)
for (const [f, n] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) console.log(`  ${n} ${f}`)
