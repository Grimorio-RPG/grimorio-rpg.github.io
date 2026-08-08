// Verifica que o glossário acha os termos certos, no lugar certo.
//
// É a parte que erra em silêncio. Um índice deslocado por um acento não quebra
// nada — só recorta o link uma letra fora do lugar, e ninguém repara olhando de
// passagem. O mesmo vale para o termo mais curto engolir o mais longo:
// "ação bônus" virando "ação" seguida de um "bônus" solto continua parecendo
// certo até você clicar.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'gloss-'))
const compilar = (entrada, saida) => {
  const alvo = join(dir, saida)
  execSync(`npx esbuild ${entrada} --bundle --outfile=${alvo} --format=esm --log-level=error`)
  return import(pathToFileURL(alvo).href)
}

const { fatiarTexto } = await compilar('src/lib/glossario.ts', 'lib.js')
const { GLOSSARIO, acharVerbete, verbetePorId, FORMAS } =
  await compilar('src/data/glossario.ts', 'dados.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

/** Os pedaços que viraram link, na ordem. */
const links = (texto, exceto) =>
  fatiarTexto(texto, exceto).filter((p) => p.verbete).map((p) => p.texto)

/** O texto remontado a partir dos pedaços. */
const remontar = (texto, exceto) => fatiarTexto(texto, exceto).map((p) => p.texto).join('')

// ---------------------------------------------------------------------------
console.log('Nada se perde no caminho')
//
// O primeiro dever de quem fatia um texto para renderizar é devolver o mesmo
// texto. Perder uma letra aqui é perder uma letra na ficha de alguém.

for (const v of GLOSSARIO) {
  const semMarcas = v.texto.replace(/\*\*/g, '')
  checar(`"${v.termo}" remonta igual`, remontar(v.texto, v.id) === semMarcas,
    `\n      esperado: ${semMarcas.slice(0, 70)}\n      obtido:   ${remontar(v.texto, v.id).slice(0, 70)}`)
}

// ---------------------------------------------------------------------------
console.log('Achar o termo')

checar('acha o termo simples', links('Você precisa de sintonia.').includes('sintonia'))
checar('acha a variante', links('Item já sintonizado.').includes('sintonizado'))
checar('não acha o que não é termo', links('Uma corda de cânhamo.').length === 0)

// O corte tem de cair exatamente em cima da palavra, e é aqui que um índice
// deslocado apareceria: o regex procura no texto sem acento e fatia o texto
// COM acento.
const comAcento = 'A ação bônus não é sintonia, é ação.'
checar('o link sai inteiro mesmo com acento antes',
  links(comAcento).includes('sintonia'), JSON.stringify(links(comAcento)))
checar('e nada de "intonia" recortado',
  !links(comAcento).some((t) => t !== t.trim() || t.length < 3), JSON.stringify(links(comAcento)))
checar('o texto com acentos remonta igual', remontar(comAcento) === comAcento)

// Acentos empilhados, cedilha, til: se algum deles mudasse de tamanho ao
// normalizar, o corte sairia torto daqui para frente.
const denso = 'A salvaguarda contra a exaustão: coração, ação, ãããç, sintonia no fim.'
checar('texto denso de acento remonta igual', remontar(denso) === denso,
  `
      obtido: ${remontar(denso)}`)
checar('e o último termo ainda é achado inteiro',
  links(denso).includes('sintonia'), JSON.stringify(links(denso)))

// Texto já decomposto — é como o macOS costuma entregar o que se copia dele.
// Aí o acento é um caractere separado, tirá-lo encolhe a string, e os índices
// da busca deixam de valer para o texto original. Melhor não marcar nada do que
// marcar torto: o que não pode acontecer é a descrição do item sair mutilada.
const decomposto = 'A sintonia exige ação e coração.'.normalize('NFD')
checar('texto decomposto não perde nada', remontar(decomposto) === decomposto,
  `
      obtido: ${JSON.stringify(remontar(decomposto))}`)
const fatiado = fatiarTexto(decomposto)
checar('e sai como um pedaço só de texto puro',
  fatiado.length === 1 && !fatiado[0].verbete,
  JSON.stringify(fatiado.map((p) => [p.texto, !!p.verbete])))
// Todo link marcado tem de ser, ele mesmo, um termo. É o que pega o corte
// torto: "sintoni" e "a sinton" passam despercebidos em qualquer outra
// checagem, mas não são termo nenhum.
checar('nenhum link recortado no meio da palavra',
  links(decomposto).every((t) => acharVerbete(t) !== null),
  JSON.stringify(links(decomposto)))

// ---------------------------------------------------------------------------
console.log('O mais longo vence o mais curto')

const acao = links('Use sua ação bônus agora.')
checar('"ação bônus" vem inteira', acao.includes('ação bônus'), JSON.stringify(acao))
checar('e não vira "ação" solta', !acao.includes('ação'), JSON.stringify(acao))
checar('a lista de formas está da maior para a menor',
  FORMAS.every((f, i) => i === 0 || FORMAS[i - 1].length >= f.length))

// ---------------------------------------------------------------------------
console.log('Palavra inteira')
//
// Sem fronteira de palavra, "cd" acharia o "cd" dentro de outra palavra e a
// pessoa clicaria no meio de um substantivo.

checar('não casa no meio de outra palavra',
  links('O escudo tem uma fivela.').length === 0,
  JSON.stringify(links('O escudo tem uma fivela.')))

// ---------------------------------------------------------------------------
console.log('Não se aponta para si mesmo')

const sintonia = verbetePorId('sintonia')
checar('o verbete existe', !!sintonia)
checar('a sintonia não vira link dentro da própria sintonia',
  !links(sintonia.texto, 'sintonia').some((t) => acharVerbete(t)?.id === 'sintonia'),
  JSON.stringify(links(sintonia.texto, 'sintonia')))
checar('mas continua virando link em outro lugar',
  links(sintonia.texto).some((t) => acharVerbete(t)?.id === 'sintonia'))

// ---------------------------------------------------------------------------
console.log('Negrito')

const forte = fatiarTexto('Ele exige **sintonia** sempre.')
checar('o **negrito** some do texto', !remontar('Ele exige **sintonia** sempre.').includes('*'))
checar('e o que estava em negrito fica marcado',
  forte.some((p) => p.forte && p.texto === 'sintonia'), JSON.stringify(forte))
checar('sem estragar o link', forte.some((p) => p.verbete?.id === 'sintonia'))

// ---------------------------------------------------------------------------
console.log('O encadeamento existe de verdade')
//
// Um glossário em que nenhum verbete cita outro é uma lista, não um
// encadeamento — e era esse o pedido.

const encadeados = GLOSSARIO.filter((v) => links(v.texto, v.id).length > 0)
checar('a maioria dos verbetes leva a outro',
  encadeados.length >= GLOSSARIO.length / 3,
  `${encadeados.length} de ${GLOSSARIO.length}`)

// As condições entraram sozinhas, da lista que já existia.
checar('as condições viraram verbete', !!verbetePorId('condicao-envenenado'))
checar('e o texto delas é o da regra', (verbetePorId('condicao-envenenado')?.texto ?? '').length > 20)

// ---------------------------------------------------------------------------
console.log('Texto vazio')

checar('texto vazio não quebra', fatiarTexto('').length === 0)
checar('nem indefinido', fatiarTexto(undefined).length === 0)

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de glossário falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de glossário passaram`)
