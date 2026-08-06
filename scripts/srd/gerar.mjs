// Lê a seção "Magic Items A–Z" do SRD e gera o catálogo do app.
//
// O texto vem do PDF oficial (CC-BY-4.0), então a descrição é a de verdade —
// não um resumo meu de memória, que é onde os números saem errados.
import { readFileSync, writeFileSync } from 'node:fs'

import { raridadesDe, PRECO_POR_RARIDADE } from './raridade.mjs'

const bruto = readFileSync(process.argv[2], 'utf8')

// A seção começa em "Magic Items A–Z" e termina onde os monstros começam.
const inicio = bruto.indexOf('Magic Items A–Z')
const fimMarca = bruto.search(/===== PÁGINA \d+ =====\nMonsters\b/)
const secao = bruto.slice(inicio, fimMarca > 0 ? fimMarca : undefined)

// Tira marcas de página e junta as palavras quebradas por hífen no fim da linha.
const limpo = secao
  .replace(/\n===== PÁGINA \d+ =====\n/g, '\n')
  .replace(/([a-zA-Zçãéíóúâêô])-\n([a-z])/g, '$1$2')

const CATEGORIAS = [
  'Wondrous Item', 'Armor', 'Weapon', 'Potion', 'Ring', 'Rod', 'Scroll', 'Staff', 'Wand', 'Ammunition',
]
const reTipo = new RegExp(`^(${CATEGORIAS.join('|')})\\b(.*)$`, 'i')

const linhas = limpo.split('\n')
const itens = []
let atual = null

for (let i = 0; i < linhas.length; i++) {
  const l = linhas[i].trim()
  if (!l) continue

  const tipo = l.match(reTipo)
  // Um item começa quando uma linha de tipo/raridade aparece logo abaixo de
  // uma linha curta que parece nome próprio.
  if (tipo && atual === null) {
    const nome = (linhas[i - 1] || '').trim()
    const pareceNome = nome && nome.length < 60 && /^[A-Z]/.test(nome) && !reTipo.test(nome)
    if (pareceNome) {
      atual = { nome, linhaTipo: l, corpo: [] }
      continue
    }
  }
  if (tipo && atual) {
    // Outro item começou: fecha o anterior.
    const nome = (linhas[i - 1] || '').trim()
    const pareceNome = nome && nome.length < 60 && /^[A-Z]/.test(nome) && !reTipo.test(nome)
    if (pareceNome) {
      atual.corpo = atual.corpo.filter((x) => x.trim() !== nome)
      itens.push(atual)
      atual = { nome, linhaTipo: l, corpo: [] }
      continue
    }
  }
  if (atual) {
    // A raridade quebra para a linha seguinte quando o tipo é longo:
    //   "Armor (Any Medium or Heavy, Except Hide Armor)," / "Uncommon"
    // Sem juntar, 40 itens ficavam sem raridade — e raridade é o preço.
    const aindaNoCabecalho = atual.corpo.length === 0 && /,$/.test(atual.linhaTipo)
    if (aindaNoCabecalho) {
      atual.linhaTipo += ' ' + l
      continue
    }
    atual.corpo.push(l)
  }
}
if (atual) itens.push(atual)

// --- interpretação da linha de tipo ----------------------------------------
const RARIDADES = [
  ['Legendary', 'Lendário'],
  ['Very Rare', 'Muito raro'],
  ['Uncommon', 'Incomum'],
  // "Common" casa dentro de "Uncommon" — sem o corte, todo item Incomum saía
  // também como Comum, e o preço ia junto (400 PO virava 100).
  ['(?<!Un)Common', 'Comum'],
  ['Rare', 'Raro'],
]

function interpretar(linhaTipo) {
  const categoria = CATEGORIAS.find((c) => new RegExp(`^${c}`, 'i').test(linhaTipo)) ?? 'Wondrous Item'
  const raridades = raridadesDe(linhaTipo)
  const sintonia = /requires attunement/i.test(linhaTipo)
  const porQuem = linhaTipo.match(/requires attunement\s*\(([^)]+)\)/i)?.[1] ?? ''
  return { categoria, raridades, sintonia, porQuem }
}

const resultado = itens
  .filter((it) => it.corpo.join(' ').trim().length > 40)
  .map((it) => ({
    nome: it.nome,
    ...interpretar(it.linhaTipo),
    tipoOriginal: it.linhaTipo,
    precoPO: PRECO_POR_RARIDADE[interpretar(it.linhaTipo).raridades[0]] ?? null,
    texto: it.corpo.join(' ').replace(/\s+/g, ' ').trim(),
  }))

writeFileSync(process.argv[3], JSON.stringify(resultado, null, 1))
console.log('itens:', resultado.length)
console.log('sem raridade:', resultado.filter((r) => r.raridades.length === 0).length)
console.log('com sintonia:', resultado.filter((r) => r.sintonia).length)
console.log('\namostra:')
for (const r of resultado.slice(0, 3)) {
  console.log(` · ${r.nome} [${r.categoria} / ${r.raridades.join(' ou ') || '?'}${r.sintonia ? ' / sintonia' : ''}]`)
  console.log(`   ${r.texto.slice(0, 110)}…`)
}
