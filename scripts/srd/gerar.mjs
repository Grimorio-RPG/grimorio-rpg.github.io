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

const RARIDADE_QUALQUER = /\b(Common|Uncommon|Rare|Very Rare|Legendary)\b/i

/**
 * Esta linha é o cabeçalho de tipo de um item?
 *
 * Começar com uma categoria não basta: "Ammunition, +1, +2, or +3" é o NOME de
 * um item e começa com "Ammunition". Confundir os dois fazia a munição inteira
 * ser engolida pelo texto da Adamantine Armor — e um texto emendado traduzido
 * é pior do que texto nenhum.
 *
 * O cabeçalho de verdade sempre traz um parêntese com o que ele serve, ou a
 * raridade, ou termina em vírgula porque a raridade quebrou para a linha
 * seguinte.
 */
function ehTipo(l) {
  if (!reTipo.test(l)) return false
  return l.includes('(') || RARIDADE_QUALQUER.test(l) || /,$/.test(l)
}

const CONECTIVOS = new Set([
  'of', 'the', 'and', 'or', 'a', 'an', 'in', 'on', 'to', 'from',
  // Sem estes o nome era rejeitado e o item sumia dentro do anterior:
  // "Amulet of Proof against Detection and Location".
  'against', 'with', 'upon', 'over', 'under', 'by', 'for', 'into', 'at', 'as',
])

/**
 * Esta linha é o nome de um item?
 *
 * O texto corrido também tem linhas que começam com maiúscula, e uma delas
 * caindo logo antes de um cabeçalho virava item: "This concoction looks,
 * smells, and tastes like a" chegou a ser um item mágico.
 *
 * Nome de item do SRD é Título Assim: toda palavra em maiúscula, tirando os
 * conectivos. Uma palavra minúscula qualquer denuncia que é frase.
 */
function ehNome(l) {
  if (!l || l.length > 60 || !/^[A-Z]/.test(l)) return false
  if (/[.:;]$/.test(l)) return false
  // Linha de tabela colada não é nome: "PotionStr.Rarity Potion of Giant
  // Strength(hill)21Uncommon" passava por Título Assim e virava item mágico.
  // Parêntese sozinho não denuncia nada — "Stone of Good Luck (Luckstone)" é
  // nome de verdade. O que denuncia é dígito colado em letra.
  if (/\d[A-Za-z]|[A-Za-z]\d/.test(l) || l.includes('.')) return false
  if (ehTipo(l)) return false
  return l.split(/\s+/).every((palavra) => {
    const limpa = palavra.replace(/[^A-Za-z]/g, '')
    if (!limpa) return true
    return /^[A-Z]/.test(limpa) || CONECTIVOS.has(limpa.toLowerCase())
  })
}

const linhas = limpo.split('\n')
const itens = []
let atual = null

for (let i = 0; i < linhas.length; i++) {
  const l = linhas[i].trim()
  if (!l) continue

  // Um item começa quando um cabeçalho de tipo aparece logo abaixo de uma
  // linha que é nome de item.
  if (ehTipo(l)) {
    const uma = (linhas[i - 1] || '').trim()
    const duas = `${(linhas[i - 2] || '').trim()} ${uma}`.trim()
    // O nome também quebra em duas linhas quando é longo:
    // "Amulet of Proof against Detection" / "and Location". Olhando só a linha
    // de cima, o item sumia dentro do texto do anterior.
    const partes = ehNome(uma) ? [uma] : ehNome(duas) ? [(linhas[i - 2] || '').trim(), uma] : null
    if (partes) {
      const nome = partes.join(' ')
      if (atual) {
        atual.corpo = atual.corpo.filter((x) => !partes.includes(x.trim()))
        itens.push(atual)
      }
      atual = { nome, linhaTipo: l, corpo: [] }
      continue
    }
  }
  if (atual) {
    // A raridade quebra para a linha seguinte quando o tipo é longo:
    //   "Armor (Any Medium or Heavy, Except Hide Armor)," / "Uncommon"
    // Sem juntar, 40 itens ficavam sem raridade — e raridade é o preço.
    // Duas formas de o cabeçalho continuar na linha seguinte: terminando em
    // vírgula, ou com um parêntese aberto sem fechar — "Legendary (Requires"
    // e, na linha de baixo, "Attunement)".
    const parenteseAberto =
      (atual.linhaTipo.match(/\(/g) || []).length >
      (atual.linhaTipo.match(/\)/g) || []).length
    const aindaNoCabecalho =
      atual.corpo.length === 0 &&
      // "…, Rare (+1), Very" / "Rare (+2), or Legendary (+3)": a quebra cai no
      // meio do nome da raridade, sem vírgula e sem parêntese aberto.
      (/,$/.test(atual.linhaTipo) || parenteseAberto || /\b(Very|or)$/.test(atual.linhaTipo))
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

/**
 * As tabelas do SRD não sobrevivem à extração.
 *
 * São duas colunas dentro de duas colunas: o texto sai como
 * "1d100Creature Type1d100Creature Type 01-10Aberrations51-60Fey", e às vezes
 * a coluna "Down" de uma tabela reaparece no meio do item seguinte. Não dá para
 * consertar isso lendo o PDF, e traduzir esse amontoado seria transformar lixo
 * em lixo bilíngue.
 *
 * Melhor cortar e dizer que cortou: quem precisar da tabela vai ao SRD, e a
 * descrição continua correta até onde vai.
 */
function cortarTabela(texto) {
  // Duas caras de tabela. A primeira: "1d100Aberrations" — o dado colado numa
  // palavra com maiúscula, que não acontece em texto corrido.
  const porDado = texto.match(/\b\d+d\d+[A-Z]/)

  // A segunda: uma coluna numerada, "1Legs extend… 2Forward window… 3Side…".
  // Um número colado numa palavra pode acontecer por acidente; três ou mais
  // seguidos são tabela.
  const numerados = [...texto.matchAll(/\s\d{1,2}[A-Z][a-z]/g)]
  const porColuna = numerados.length >= 3 ? numerados[0] : null

  const corte = [porDado, porColuna]
    .filter(Boolean)
    .reduce((menor, m) => (menor === null || m.index < menor ? m.index : menor), null)

  if (corte === null) return { texto, tabelaOmitida: false }
  return { texto: texto.slice(0, corte).trim(), tabelaOmitida: true }
}

/** O rodapé de página que o PDF cola no meio da frase. */
function tirarRodape(texto) {
  return texto.replace(/\s*\d+\s*System Reference Document 5\.2\.1\s*/g, ' ')
}

const resultado = itens
  .filter((it) => it.corpo.join(' ').trim().length > 40)
  .map((it) => ({
    nome: it.nome,
    ...interpretar(it.linhaTipo),
    tipoOriginal: it.linhaTipo,
    precoPO: PRECO_POR_RARIDADE[interpretar(it.linhaTipo).raridades[0]] ?? null,
    ...cortarTabela(tirarRodape(it.corpo.join(' ')).replace(/\s+/g, ' ').trim()),
  }))

writeFileSync(process.argv[3], JSON.stringify(resultado, null, 1))
console.log('itens:', resultado.length)
console.log('sem raridade:', resultado.filter((r) => r.raridades.length === 0).length)
console.log('com sintonia:', resultado.filter((r) => r.sintonia).length)
console.log('com tabela cortada:', resultado.filter((r) => r.tabelaOmitida).length)
console.log('\namostra:')
for (const r of resultado.slice(0, 3)) {
  console.log(` · ${r.nome} [${r.categoria} / ${r.raridades.join(' ou ') || '?'}${r.sintonia ? ' / sintonia' : ''}]`)
  console.log(`   ${r.texto.slice(0, 110)}…`)
}

// --- o arquivo que o app importa -------------------------------------------
//
// Sai como TypeScript e não JSON porque o app não busca nada em tempo de
// execução: é dado, e dado versionado se lê no diff.
const ts = [
  '// Itens mágicos do SRD 5.2.1 — GERADO, não edite à mão.',
  '//',
  '// Fonte: System Reference Document 5.2.1, © Wizards of the Coast LLC,',
  '// disponível sob Creative Commons Attribution 4.0 International.',
  '// Regerar: veja scripts/srd/LEIA-ME.md',
  '//',
  '// O texto em inglês é o oficial e fica preservado ao lado da tradução: em',
  '// item mágico o detalhe é tudo — quantas cargas, se recarrega ao amanhecer,',
  '// se a CD é 15 ou 17 — e é onde uma tradução livre erra.',
  '',
  "import type { RaridadeItem } from '../../types'",
  '',
  'export interface ItemSrd {',
  '  /** O nome oficial, em inglês. É a chave da tradução. */',
  '  nome: string',
  "  categoria: 'Wondrous Item' | 'Armor' | 'Weapon' | 'Potion' | 'Ring' | 'Rod' | 'Scroll' | 'Staff' | 'Wand' | 'Ammunition'",
  '  /** Mais de uma quando o item tem variantes +1/+2/+3. */',
  '  raridades: RaridadeItem[]',
  '  sintonia: boolean',
  '  /** Quem pode sintonizar, quando o SRD restringe. */',
  '  porQuem: string',
  '  /** A linha de cabeçalho original, para conferência. */',
  '  tipoOriginal: string',
  '  precoPO: number | null',
  '  /** O texto oficial, em inglês. */',
  '  texto: string',
  '  /** O verbete tinha uma tabela que a extração não consegue preservar. */',
  '  tabelaOmitida?: boolean',
  '}',
  '',
  'export const ITENS_SRD: ItemSrd[] = [',
  ...resultado.map((r) => {
    const campos = [
      `nome: ${JSON.stringify(r.nome)}`,
      `categoria: ${JSON.stringify(r.categoria)}`,
      `raridades: ${JSON.stringify(r.raridades)}`,
      `sintonia: ${r.sintonia}`,
      `porQuem: ${JSON.stringify(r.porQuem)}`,
      `tipoOriginal: ${JSON.stringify(r.tipoOriginal)}`,
      `precoPO: ${r.precoPO ?? 'null'}`,
      `texto: ${JSON.stringify(r.texto)}`,
      ...(r.tabelaOmitida ? ['tabelaOmitida: true'] : []),
    ]
    return `  { ${campos.join(', ')} },`
  }),
  ']',
  '',
].join('\n')

writeFileSync('../../src/data/srd/itens-srd.ts', ts)
console.log('gerado src/data/srd/itens-srd.ts')
