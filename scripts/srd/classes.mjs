// Extrai as tabelas de progressão das classes conjuradoras do SRD 5.2.1.
//
// O app já tinha os espaços de magia escritos à mão e corretos. O que faltava
// era o resto da tabela: quantos truques a classe conhece em cada nível, e
// quantas magias ela pode ter preparadas. Sem esses dois números, subir de
// nível não tem o que perguntar — e foi exatamente isso que o mago da mesa
// encontrou: nível 4, nenhuma magia, nenhuma pergunta.
//
// A LIÇÃO QUE CUSTOU: os rótulos do cabeçalho são alinhados à ESQUERDA e as
// células são centradas sob eles. "Cantrips" começa em x=288 e o número que
// pertence a ele fica em x=303 — quinze pontos de distância. Casar célula com
// cabeçalho por proximidade dá certo nas colunas de um dígito (onde rótulo e
// número quase coincidem) e erra em todas as outras, calado: a coluna vira
// zero e a tabela sai plausível. O jeito certo é tratar o x do cabeçalho como
// a BORDA ESQUERDA da coluna e jogar cada célula na última borda que ela
// ultrapassou.
//
// Uso (o pdfjs 4 é ferramenta, não dependência — veja o LEIA-ME):
//   npm i --no-save pdfjs-dist@4
//   node classes.mjs
//   npm i --no-save pdfjs-dist@^3.11.174

import { writeFileSync } from 'node:fs'

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
const PDF = 'C:/Users/gabri/OneDrive/Área de Trabalho/Grimorio - Projeto/SRD_CC_v5.2.1.pdf'

// Onde mora a tabela "<Classe> Features" de cada classe.
//
// `recursos` são as colunas de USOS que a tabela traz — Fúrias, Retomar o
// Fôlego, Canalizar Divindade. Elas estavam ali o tempo todo, e o app contava
// esses usos na cabeça da mesa. A chave é o ÚLTIMO pedaço do cabeçalho, que é
// o que a extração enxerga: "Second Wind" quebra em duas linhas e só "Wind"
// fica na linha das colunas.
const PAGINAS = {
  Bárbaro: {
    pagina: 28, titulo: 'Barbarian Features', semMagia: true,
    recursos: [{ coluna: 'Rages', nome: 'Fúria', recarga: 'longo' }],
  },
  Bardo: {
    pagina: 31, titulo: 'Bard Features',
    // Os usos da Inspiração são o modificador de Carisma, e não uma coluna: a
    // coluna traz o DADO. Fica de fora daqui e entra por atributo.
  },
  Clérigo: {
    pagina: 36, titulo: 'Cleric Features',
    recursos: [{ coluna: 'Divinity', nome: 'Canalizar Divindade', recarga: 'curto' }],
  },
  Druida: {
    pagina: 41, titulo: 'Druid Features',
    recursos: [{ coluna: 'Shape', nome: 'Forma Selvagem', recarga: 'curto' }],
  },
  Guerreiro: {
    pagina: 47, titulo: 'Fighter Features', semMagia: true,
    recursos: [{ coluna: 'Wind', nome: 'Retomar o Fôlego', recarga: 'curto' }],
  },
  Monge: {
    pagina: 50, titulo: 'Monk Features', semMagia: true,
    recursos: [{ coluna: 'Points', nome: 'Ponto de Foco', recarga: 'curto' }],
  },
  Paladino: {
    pagina: 53, titulo: 'Paladin Features',
    recursos: [{ coluna: 'Divinity', nome: 'Canalizar Divindade', recarga: 'curto' }],
  },
  Patrulheiro: { pagina: 58, titulo: 'Ranger Features' },
  Feiticeiro: {
    pagina: 65, titulo: 'Sorcerer Features',
    recursos: [{ coluna: 'Points', nome: 'Ponto de Feitiçaria', recarga: 'longo' }],
  },
  // O Bruxo tem Magia de Pacto: poucos espaços, todos do mesmo círculo. A
  // tabela dele traz "Spell Slots" e "Slot Level" no lugar das nove colunas.
  Bruxo: { pagina: 71, titulo: 'Warlock Features', pacto: true },
  Mago: { pagina: 77, titulo: 'Wizard Features' },
}

const doc = await pdfjs.getDocument({ url: PDF, useSystemFonts: true }).promise

/** Os pedaços da página agrupados em linhas, cada um com seu x. */
async function linhasDaPagina(n) {
  const page = await doc.getPage(n)
  const { items } = await page.getTextContent()
  const porY = new Map()
  for (const i of items) {
    if (!i.str.trim()) continue
    const y = Math.round(i.transform[5])
    const chave = [...porY.keys()].find((k) => Math.abs(k - y) <= 2) ?? y
    const arr = porY.get(chave) ?? []
    arr.push({ x: i.transform[4], s: i.str.trim() })
    porY.set(chave, arr)
  }
  return [...porY.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([y, itens]) => ({ y, itens: itens.sort((a, b) => a.x - b.x) }))
}

const texto = (l) => l.itens.map((i) => i.s).join(' ').replace(/\s+/g, ' ').trim()

/** Um número de célula. O travessão do SRD quer dizer zero. */
function numero(s) {
  if (s == null || s === '—' || s === '-') return 0
  const n = parseInt(s, 10)
  if (!Number.isFinite(n)) throw new Error(`célula não numérica: ${JSON.stringify(s)}`)
  return n
}

function extrair(nomePt, { pagina, pacto, semMagia, recursos = [] }, linhas) {
  // O cabeçalho das colunas: a linha que começa em "Level" e traz "Class
  // Features". É ela que define onde cada coluna começa.
  const iCab = linhas.findIndex(
    (l) => /^Level\b/.test(texto(l)) && /Class Features/.test(texto(l)),
  )
  if (iCab < 0) throw new Error(`${nomePt}: cabeçalho não achado na p.${pagina}`)
  const colunas = linhas[iCab].itens

  const onde = (rotulo) => {
    const i = colunas.findIndex((c) => c.s === rotulo)
    if (i < 0) throw new Error(`${nomePt}: coluna "${rotulo}" não existe na p.${pagina}`)
    return i
  }
  // "Prepared Spells" quebra em duas linhas: só "Spells" está no cabeçalho.
  const cTruques = colunas.some((c) => c.s === 'Cantrips') ? onde('Cantrips') : null
  // Classe sem magia não tem coluna de preparadas — e cobrar uma faria a
  // extração morrer no Bárbaro em vez de dizer que ele não conjura.
  const cPreparadas = semMagia ? null : onde('Spells')
  const cRecursos = recursos.map((r) => ({ ...r, coluna: onde(r.coluna) }))
  // Nove colunas numeradas nos conjuradores comuns; o Bruxo tem duas próprias.
  const cEspacos = pacto || semMagia
    ? null
    : colunas.map((c, i) => (/^[1-9]$/.test(c.s) ? i : -1)).filter((i) => i >= 0)
  const cQtdPacto = pacto ? onde('Slots') : null
  // "Level" aparece duas vezes: a primeira é a coluna do nível da classe, a
  // última é o círculo dos espaços de pacto.
  const cNivelPacto = pacto ? colunas.map((c) => c.s).lastIndexOf('Level') : null

  if (semMagia) {
    // Sem magia não há espaço para conferir; o que vale é o recurso.
  } else if (cEspacos && cEspacos.length !== 9 && cEspacos.length !== 5) {
    throw new Error(`${nomePt}: ${cEspacos.length} colunas de espaço, esperava 5 ou 9`)
  }

  const porNivel = new Map()
  for (const l of linhas.slice(iCab + 1)) {
    if (!/^(\d{1,2}) \+\d\b/.test(texto(l))) continue
    const nivel = parseInt(l.itens[0].s, 10)
    if (!(nivel >= 1 && nivel <= 20) || porNivel.has(nivel)) continue

    // Cada pedaço cai na última coluna cuja borda esquerda ele ultrapassou. Os
    // 4 pontos de folga existem porque o texto de "Class Features" às vezes
    // começa um fio à esquerda do próprio rótulo.
    const celulas = colunas.map(() => null)
    for (const item of l.itens) {
      let c = -1
      for (let i = 0; i < colunas.length; i++) if (item.x >= colunas[i].x - 4) c = i
      if (c >= 0 && celulas[c] == null) celulas[c] = item.s
    }

    const espacos = Array.from({ length: 9 }, () => 0)
    if (semMagia) {
      // Bárbaro, Guerreiro e Ladino não conjuram: a tabela deles não tem
      // coluna de espaço nenhuma, e é isso que os zeros dizem.
    } else if (cEspacos) {
      cEspacos.forEach((c, i) => {
        espacos[i] = numero(celulas[c])
      })
    } else {
      const qtd = numero(celulas[cQtdPacto])
      const circulo = numero(celulas[cNivelPacto])
      if (circulo >= 1 && circulo <= 9) espacos[circulo - 1] = qtd
    }

    porNivel.set(nivel, {
      truques: cTruques == null ? 0 : numero(celulas[cTruques]),
      preparadas: cPreparadas == null ? 0 : numero(celulas[cPreparadas]),
      espacos,
      recursos: Object.fromEntries(cRecursos.map((r) => [r.nome, numero(celulas[r.coluna])])),
    })
  }

  const faltando = []
  for (let n = 1; n <= 20; n++) if (!porNivel.has(n)) faltando.push(n)
  if (faltando.length) {
    throw new Error(`${nomePt}: faltaram os níveis ${faltando.join(', ')} na p.${pagina}`)
  }

  const tabela = Array.from({ length: 20 }, (_, i) => porNivel.get(i + 1))

  // Uma tabela de progressão nunca anda para trás. É a checagem que pega a
  // coluna lida na posição errada — sem ela, "preparadas" podia sair de uma
  // coluna vizinha e ninguém notaria.
  for (let i = 1; i < 20; i++) {
    if (tabela[i].truques < tabela[i - 1].truques) {
      throw new Error(`${nomePt}: truques caem do nível ${i} para o ${i + 1}`)
    }
    if (tabela[i].preparadas < tabela[i - 1].preparadas) {
      throw new Error(`${nomePt}: preparadas caem do nível ${i} para o ${i + 1}`)
    }
  }
  if (!semMagia && tabela[0].preparadas < 1) {
    throw new Error(`${nomePt}: nível 1 sem magias preparadas`)
  }
  // Recurso também não anda para trás, e um que nasce zerado no nível em que a
  // classe já o tem é coluna lida da posição errada.
  for (const r of recursos) {
    for (let i = 1; i < 20; i++) {
      if (tabela[i].recursos[r.nome] < tabela[i - 1].recursos[r.nome]) {
        throw new Error(`${nomePt}: ${r.nome} cai do nível ${i} para o ${i + 1}`)
      }
    }
    if (tabela[19].recursos[r.nome] < 1) {
      throw new Error(`${nomePt}: ${r.nome} nunca sai do zero`)
    }
  }

  return tabela
}

const saida = {}
for (const [nomePt, onde] of Object.entries(PAGINAS)) {
  const linhas = await linhasDaPagina(onde.pagina)
  if (!linhas.some((l) => texto(l).includes(onde.titulo))) {
    throw new Error(`${nomePt}: "${onde.titulo}" não está na p.${onde.pagina}`)
  }
  saida[nomePt] = extrair(nomePt, onde, linhas)
  const t = saida[nomePt]
  console.log(
    `${nomePt.padEnd(12)} truques ${t[0].truques}→${t[19].truques}  ` +
      `preparadas ${t[0].preparadas}→${t[19].preparadas}  ` +
      `espaços nv1 ${t[0].espacos.join('/')}`,
  )
}

// Uma linha por nível, e não JSON indentado: a tabela inteira cabe numa tela e
// dá para conferir contra o livro com o dedo.
const linhaTs = (n) => {
  const recursos = Object.keys(n.recursos ?? {}).length
    ? `, ${JSON.stringify(n.recursos)}`
    : ''
  return `    [${String(n.truques)}, ${String(n.preparadas).padStart(2)}, ` +
    `[${n.espacos.join(', ')}]${recursos}],`
}

const corpo = Object.entries(saida)
  .map(([classe, niveis]) => `  ${JSON.stringify(classe)}: [\n${niveis.map(linhaTs).join('\n')}\n  ],`)
  .join('\n')

const ts = `// GERADO por scripts/srd/classes.mjs — não edite à mão.
//
// As tabelas de progressão de conjuração do SRD 5.2.1, por classe e por nível.
// Cada linha é um nível, do 1 ao 20: [truques, preparadas, espaços do 1º ao 9º].
//
// SRD 5.2.1, Creative Commons Attribution 4.0.

/**
 * [truques, preparadas, espaços do 1º ao 9º, usos de recurso por nome]
 *
 * O quarto item só existe nas classes que têm coluna de uso na tabela — Fúria,
 * Retomar o Fôlego, Canalizar Divindade, Forma Selvagem, Pontos de Foco e de
 * Feitiçaria. Ele estava no livro o tempo todo, e o app deixava essa conta na
 * cabeça da mesa.
 */
export type LinhaDeConjuracao = [number, number, number[], Record<string, number>?]

export const PROGRESSAO_SRD: Record<string, LinhaDeConjuracao[]> = {
${corpo}
}
`

writeFileSync('../../src/data/srd/classes-srd.ts', ts.replace(/\n/g, '\r\n'))
console.log('\n✓ src/data/srd/classes-srd.ts')
