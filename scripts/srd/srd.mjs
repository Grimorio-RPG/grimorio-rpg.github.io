// Extrai texto do SRD por faixa de páginas.
//   node srd.mjs <primeira> <ultima> [arquivo]
//
// O SRD é em DUAS COLUNAS. Agrupar os pedaços só pela altura mistura as duas —
// a linha da esquerda emenda na da direita e o texto fica ilegível. Aqui a
// separação é por posição horizontal, e cada coluna é lida inteira antes da
// outra.
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

const PDF = 'C:/Users/gabri/OneDrive/Área de Trabalho/Grimorio - Projeto/SRD_CC_v5.2.1.pdf'
const doc = await pdfjs.getDocument({
  data: new Uint8Array(readFileSync(PDF)),
  useSystemFonts: true,
}).promise

const de = Number(process.argv[2] || 1)
const ate = Number(process.argv[3] || de)
const arquivo = process.argv[4] || null

function juntarColuna(pedacos) {
  const linhas = new Map()
  for (const it of pedacos) {
    if (!linhas.has(it.y)) linhas.set(it.y, [])
    linhas.get(it.y).push(it)
  }
  return [...linhas.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, ps]) =>
      ps
        .sort((a, b) => a.x - b.x)
        .map((p) => p.s)
        .join('')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .join('\n')
}

let saida = ''
for (let n = de; n <= Math.min(ate, doc.numPages); n++) {
  const pagina = await doc.getPage(n)
  const { items } = await pagina.getTextContent()
  const meio = pagina.view[2] / 2

  const esq = []
  const dir = []
  for (const it of items) {
    if (!it.str?.trim()) continue
    const p = { x: it.transform[4], y: Math.round(it.transform[5]), s: it.str }
    ;(p.x < meio ? esq : dir).push(p)
  }

  saida += `\n===== PÁGINA ${n} =====\n${[juntarColuna(esq), juntarColuna(dir)].filter(Boolean).join('\n')}\n`
}

if (arquivo) {
  writeFileSync(arquivo, saida)
  console.log('gravado em', arquivo, '—', saida.length, 'caracteres')
} else {
  console.log(saida)
}
