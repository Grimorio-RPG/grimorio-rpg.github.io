// Lê a seção "Spell Descriptions" do SRD e gera o catálogo de magias do app.
//
// O texto vem do PDF oficial (CC-BY-4.0), então a descrição é a de verdade —
// não um resumo de memória, que é onde os números saem errados.
//
// A estrutura é regular e é ela que ancora tudo:
//
//   Acid Arrow                        ← nome
//   Level 2 Evocation (Wizard)        ← nível, escola e classes
//   Casting Time:Action
//   Range:90 feet
//   Components:V, S, M (…)
//   Duration:Instantaneous
//   <corpo>
//
// A linha do meio é o que se procura. Achar magia pelo NOME seria impossível:
// nome é só uma linha de texto como qualquer outra, e o PDF ainda tem tabelas
// dentro das descrições.

import { readFileSync, writeFileSync } from 'node:fs'

const bruto = readFileSync(process.argv[2], 'utf8')

const limpo = bruto
  // Marcas de página e o rodapé que o PDF cola no meio da frase.
  .replace(/\n===== PÁGINA \d+ =====\n/g, '\n')
  .replace(/^\s*\d+\s*System Reference Document 5\.2\.1\s*$/gm, '')
  // Palavra quebrada por hífen no fim da linha.
  .replace(/([a-zA-Zçãéíóúâêô])-\n([a-z])/g, '$1$2')

// A seção acaba onde o glossário de regras começa.
//
// Sem este corte, a última magia em ordem alfabética engole o capítulo inteiro
// que vem depois: "Zone of Truth" saía com 108 mil caracteres, o glossário do
// SRD inteiro grudado no fim. E é um defeito que não avisa — a magia continua
// lá, com o texto certo no começo.
const fimDaSecao = limpo.search(/^Rules Glossary$/m)
const linhas = (fimDaSecao > 0 ? limpo.slice(0, fimDaSecao) : limpo).split('\n')

/**
 * A linha que identifica uma magia.
 *
 * Duas formas: "Level 2 Evocation (Wizard)" e "Evocation Cantrip (Sorcerer,
 * Wizard)". A lista de classes entre parênteses é o que separa isto de uma
 * frase qualquer que comece com maiúscula.
 */
const RE_TIPO = /^(?:Level ([1-9]) )?([A-Z][a-z]+)(?: (Cantrip))? \(([^)]+)\)$/

const ESCOLAS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
]

const CLASSES = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard']

/**
 * O nome saiu com maiúscula no meio?
 *
 * O PDF escreve os nomes em versalete, e em dois casos a extração perde onde
 * era minúscula: "AcidSplASh" no lugar de "Acid Splash". São poucos, e uma
 * correção à mão é mais honesta do que uma regra que adivinha errado no resto.
 */
const CORRIGIDOS = {
  AcidSplASh: 'Acid Splash',
}

/**
 * Os rótulos dos quatro campos, como o PDF os escreve.
 *
 * "Component" no singular existe: o SRD usa o plural só quando há mais de um
 * tipo. Aceitar apenas "Components" deixava doze magias sem componente — entre
 * elas Power Word Kill, que tem só o verbal.
 */
const ROTULOS = [
  ['tempo', 'Casting Time'],
  ['alcance', 'Range'],
  ['componentes', 'Components'],
  ['componentes', 'Component'],
  ['duracao', 'Duration'],
]

/** Qual campo esta linha começa, se começar algum. */
function rotuloDe(l) {
  for (const [chave, rotulo] of ROTULOS) {
    if (l.startsWith(`${rotulo}:`)) return { chave, valor: l.slice(rotulo.length + 1).trim() }
  }
  return null
}

/**
 * A linha de tipo, já com a continuação quando ela quebra.
 *
 * A lista de classes passa da margem e cai na linha seguinte:
 *
 *   Level 1 Abjuration (Bard, Cleric, Druid, Paladin,
 *   Ranger)
 *
 * Exigir o parêntese fechado na mesma linha fazia sumir toda magia de lista
 * longa — Cure Wounds, Prestidigitation, Power Word Kill. E sumia em silêncio:
 * o texto delas ia parar dentro da magia anterior.
 */
function linhaDeTipo(i) {
  const l = linhas[i].trim()
  if (!/^(?:Level [1-9] )?[A-Z][a-z]+(?: Cantrip)? \(/.test(l)) return null
  if (l.endsWith(')')) return l
  const proxima = (linhas[i + 1] ?? '').trim()
  return proxima.endsWith(')') ? `${l} ${proxima}` : null
}

const magias = []
for (let i = 1; i < linhas.length; i++) {
  const junta = linhaDeTipo(i)
  const tipo = junta?.match(RE_TIPO)
  if (!tipo) continue
  // Quando o tipo ocupou duas linhas, os campos começam uma linha adiante.
  const depoisDoTipo = junta === linhas[i].trim() ? i + 1 : i + 2

  const [, nivelTexto, escola, cantrip, classesTexto] = tipo
  // Escola e classes têm de ser as de verdade: sem isso, uma linha de tabela
  // como "Size (Fragile, Resilient)" entraria como magia.
  if (!ESCOLAS.includes(escola)) continue
  const classes = classesTexto.split(',').map((c) => c.trim())
  if (!classes.every((c) => CLASSES.includes(c))) continue

  const cru = linhas[i - 1].trim()
  const nome = CORRIGIDOS[cru] ?? cru
  if (!nome || nome.length > 45) continue

  // Os quatro campos vêm logo abaixo, mas duas coisas atrapalham: o rodapé de
  // página se mete no meio deles, e o valor pode passar da margem e continuar
  // na linha seguinte — "Bonus Action, which you take immediately after hitting
  // a target with a Melee weapon or an / Unarmed Strike". Por isso a leitura é
  // por rótulo, e o que vem depois de um rótulo pertence a ele até o próximo.
  const bloco = { tempo: '', alcance: '', componentes: '', duracao: '' }
  let atual = null
  let j = depoisDoTipo
  for (; j < linhas.length && j < depoisDoTipo + 14; j++) {
    const l = linhas[j].trim()
    if (!l) continue
    const achado = rotuloDe(l)
    if (achado) {
      atual = achado.chave
      bloco[atual] = achado.valor
      if (atual === 'duracao') {
        j++
        break
      }
    } else if (atual) {
      // Continuação do campo anterior.
      bloco[atual] = `${bloco[atual]} ${l}`.trim()
    }
  }
  if (!bloco.duracao) continue

  magias.push({
    nome,
    nivel: cantrip ? 0 : Number(nivelTexto),
    escola,
    classes,
    ...bloco,
    // "Casting Time: 1 minute or Ritual" é como o SRD marca o ritual.
    ritual: /\bRitual\b/i.test(bloco.tempo),
    concentracao: /^Concentration/i.test(bloco.duracao),
    // Onde o corpo começa, e onde o NOME desta magia está. O segundo é o que
    // fecha o corpo da anterior: fechar no começo do corpo seguinte deixaria o
    // nome, o tipo e os quatro campos da próxima grudados no texto da atual.
    inicio: j,
    nomeEm: i - 1,
  })
}

// O corpo de cada magia vai até o NOME da próxima.
for (let k = 0; k < magias.length; k++) {
  const fim = k + 1 < magias.length ? magias[k + 1].nomeEm : linhas.length
  magias[k].texto = linhas
    .slice(magias[k].inicio, fim)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  delete magias[k].inicio
  delete magias[k].nomeEm
}

/**
 * Nenhuma magia do SRD chega perto de 8 mil caracteres.
 *
 * A guarda existe porque engolir o capítulo seguinte não dá erro nenhum: a
 * magia sai com o texto certo no começo e o resto do livro colado atrás.
 * Quebrar alto aqui é melhor do que descobrir isso lendo.
 */
const inchadas = magias.filter((m) => m.texto.length > 8000)
if (inchadas.length > 0) {
  console.error('\n✗ magia com texto longo demais — provavelmente engoliu o que vem depois:')
  for (const m of inchadas) console.error(`  ${m.nome}: ${m.texto.length} caracteres`)
  process.exit(1)
}

writeFileSync(process.argv[3], JSON.stringify(magias, null, 1))

console.log('magias:', magias.length)
console.log('truques:', magias.filter((m) => m.nivel === 0).length)
console.log('rituais:', magias.filter((m) => m.ritual).length)
console.log('com concentração:', magias.filter((m) => m.concentracao).length)
console.log('sem texto:', magias.filter((m) => !m.texto).length)
console.log('\namostra:')
for (const m of magias.slice(0, 3)) {
  console.log(` · ${m.nome} — ${m.nivel === 0 ? 'truque' : `nível ${m.nivel}`} de ${m.escola}`)
  console.log(`   ${m.classes.join(', ')} | ${m.tempo} | ${m.alcance} | ${m.duracao}`)
  console.log(`   ${m.texto.slice(0, 110)}…`)
}

// --- o arquivo que o app importa -------------------------------------------
const ts = [
  '// Magias do SRD 5.2.1 — GERADO, não edite à mão.',
  '//',
  '// Fonte: System Reference Document 5.2.1, © Wizards of the Coast LLC,',
  '// disponível sob Creative Commons Attribution 4.0 International.',
  '// Regerar: veja scripts/srd/LEIA-ME.md',
  '//',
  '// O texto em inglês é o oficial e fica preservado ao lado da tradução: em',
  '// magia o detalhe é tudo — o alcance, a salvaguarda, se é concentração — e é',
  '// onde uma tradução livre erra.',
  '',
  'export interface MagiaSrd {',
  '  /** O nome oficial, em inglês. É a chave da tradução. */',
  '  nome: string',
  '  /** 0 é truque. */',
  '  nivel: number',
  '  escola: string',
  '  classes: string[]',
  '  tempo: string',
  '  alcance: string',
  '  componentes: string',
  '  duracao: string',
  '  /** Pode ser conjurada como ritual. */',
  '  ritual: boolean',
  '  /** Exige concentração — a regra que a mesa mais esquece. */',
  '  concentracao: boolean',
  '  /** O texto oficial, em inglês. */',
  '  texto: string',
  '}',
  '',
  'export const MAGIAS_SRD: MagiaSrd[] = [',
  ...magias.map((m) => {
    const campos = [
      `nome: ${JSON.stringify(m.nome)}`,
      `nivel: ${m.nivel}`,
      `escola: ${JSON.stringify(m.escola)}`,
      `classes: ${JSON.stringify(m.classes)}`,
      `tempo: ${JSON.stringify(m.tempo)}`,
      `alcance: ${JSON.stringify(m.alcance)}`,
      `componentes: ${JSON.stringify(m.componentes)}`,
      `duracao: ${JSON.stringify(m.duracao)}`,
      `ritual: ${m.ritual}`,
      `concentracao: ${m.concentracao}`,
      `texto: ${JSON.stringify(m.texto)}`,
    ]
    return `  { ${campos.join(', ')} },`
  }),
  ']',
  '',
].join('\n')

writeFileSync('../../src/data/srd/magias-srd.ts', ts)
console.log('gerado src/data/srd/magias-srd.ts')
