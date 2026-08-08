// Verifica o catálogo do SRD e as traduções.
//
// O catálogo é gerado a partir de um PDF de duas colunas, e o modo de ele errar
// é sempre silencioso: um item engolido pelo texto do anterior, um rodapé de
// página no meio da frase, uma tabela embaralhada virando item mágico. Nada
// disso quebra o app — só entrega ao vendedor da loja um estoque com lixo
// dentro, e ninguém repara até alguém ler.
//
// E a tradução tem o mesmo perigo que a tabela de importação tinha: uma chave
// escrita errado não dá erro nenhum, o item só continua em inglês para sempre.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'srd-'))
const compilar = (entrada, saida) => {
  const alvo = join(dir, saida)
  execSync(`npx esbuild ${entrada} --bundle --outfile=${alvo} --format=esm --log-level=error`)
  return import(pathToFileURL(alvo).href)
}

const { ITENS_SRD } = await compilar('src/data/srd/itens-srd.ts', 'itens.js')
const { TRADUCOES } = await compilar('src/data/srd/traducoes.ts', 'trad.js')
const { comTraducao, PRECO_POR_RARIDADE, ATRIBUICAO_SRD } =
  await compilar('src/data/srd/index.ts', 'idx.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

// ---------------------------------------------------------------------------
console.log('O catálogo chegou inteiro')

checar('tem itens de sobra', ITENS_SRD.length > 200, `são ${ITENS_SRD.length}`)

const nomes = ITENS_SRD.map((i) => i.nome)
checar('sem nomes repetidos',
  new Set(nomes).size === nomes.length,
  nomes.filter((n, i) => nomes.indexOf(n) !== i).join(', '))

for (const i of ITENS_SRD) {
  if (!i.nome || !i.texto) {
    checar(`"${i.nome}" tem nome e texto`, false)
  }
}
checar('todo item tem nome e texto', ITENS_SRD.every((i) => i.nome && i.texto))

// ---------------------------------------------------------------------------
console.log('Nada do PDF vazou para dentro do texto')

// Um item engolindo o próximo: o cabeçalho do seguinte aparece no meio do
// texto. Foi o que aconteceu com a munição inteira dentro da Adamantine Armor.
const RE_CABECALHO =
  /(Wondrous Item|Armor|Weapon|Potion|Ring|Rod|Scroll|Staff|Wand|Ammunition),?\s*(\([^)]*\),?)?\s*(Common|Uncommon|Rare|Very Rare|Legendary)\b/i
const engoliu = ITENS_SRD.filter((i) => RE_CABECALHO.test(i.texto))
checar('nenhum item engoliu o próximo', engoliu.length === 0,
  engoliu.map((i) => i.nome).join(', '))

const comRodape = ITENS_SRD.filter((i) => /System Reference Document/i.test(i.texto))
checar('nenhum rodapé de página no texto', comRodape.length === 0,
  comRodape.map((i) => i.nome).join(', '))

// A tabela embaralhada: "1d100Aberrations51–60Fey". Ilegível em qualquer idioma.
const comTabela = ITENS_SRD.filter((i) => /\b\d+d\d+[A-Z]/.test(i.texto))
checar('nenhuma tabela embaralhada sobrou', comTabela.length === 0,
  comTabela.map((i) => i.nome).join(', '))

// E o "Attunement)" solto, de quando o cabeçalho quebrava dentro do parêntese.
const comSobra = ITENS_SRD.filter((i) => /^(Attunement\)|Rare |Very Rare)/.test(i.texto))
checar('nenhum resto de cabeçalho no começo', comSobra.length === 0,
  comSobra.map((i) => i.nome).join(', '))

// Nome que na verdade é linha de tabela ou frase solta.
const nomeRuim = ITENS_SRD.filter(
  (i) => i.nome.length > 60 || /\d[A-Za-z]|[A-Za-z]\d|\./.test(i.nome),
)
checar('nenhum nome é linha de tabela', nomeRuim.length === 0,
  nomeRuim.map((i) => i.nome).join(' | '))

// ---------------------------------------------------------------------------
console.log('Raridade e preço')

const VALIDAS = ['Comum', 'Incomum', 'Raro', 'Muito raro', 'Lendário']
const raridadeInvalida = ITENS_SRD.filter((i) => i.raridades.some((r) => !VALIDAS.includes(r)))
checar('toda raridade é uma das cinco', raridadeInvalida.length === 0,
  raridadeInvalida.map((i) => `${i.nome}: ${i.raridades}`).join(' | '))

// Raridade é preço: um item sem ela vai para a loja de graça.
//
// Os que sobram são os de "Rarity Varies" — Cinto de Força de Gigante, Poção de
// Força de Gigante, Pergaminho de Magia: a raridade depende da variante e está
// dentro de uma tabela. Precisam de leitura à mão, e o teto existe para essa
// lista não crescer sem alguém reparar.
const semRaridade = ITENS_SRD.filter((i) => i.raridades.length === 0)
checar('quase todos têm raridade', semRaridade.length <= 10,
  `${semRaridade.length} sem: ${semRaridade.map((i) => i.nome).join(', ')}`)
checar('sem raridade também é sem preço',
  semRaridade.every((i) => i.precoPO === null))

const precoErrado = ITENS_SRD.filter(
  (i) => i.raridades.length > 0 && i.precoPO !== PRECO_POR_RARIDADE[i.raridades[0]],
)
checar('o preço bate com a tabela de raridade', precoErrado.length === 0,
  precoErrado.slice(0, 3).map((i) => `${i.nome}: ${i.precoPO}`).join(' | '))

// "Uncommon" contém "common": o item Incomum saía também como Comum e o preço
// caía de 400 para 100.
const incomum = ITENS_SRD.find((i) => i.tipoOriginal.includes('Uncommon'))
checar('Incomum não vira Comum de tabela',
  incomum && !incomum.raridades.includes('Comum'),
  `${incomum?.nome}: ${incomum?.raridades}`)

// ---------------------------------------------------------------------------
console.log('Sintonia')

const dizSintonia = ITENS_SRD.filter((i) => /Requires Attunement/i.test(i.tipoOriginal))
checar('quem pede sintonia está marcado',
  dizSintonia.every((i) => i.sintonia),
  dizSintonia.filter((i) => !i.sintonia).map((i) => i.nome).join(', '))
checar('e quem não pede, não está',
  ITENS_SRD.filter((i) => i.sintonia).every((i) => /Requires Attunement/i.test(i.tipoOriginal)))
checar('há bastante item de sintonia', dizSintonia.length > 50, `${dizSintonia.length}`)

// ---------------------------------------------------------------------------
console.log('Tradução')
//
// Uma chave escrita errado não dá erro: o item só fica em inglês para sempre.
// Foi exatamente assim que "Florete" sumiu da importação.

const doCatalogo = new Set(nomes)
for (const chave of Object.keys(TRADUCOES)) {
  checar(`"${chave}" existe no catálogo`, doCatalogo.has(chave))
}

for (const [chave, t] of Object.entries(TRADUCOES)) {
  checar(`"${chave}" tem nome em português`, !!t.nome && t.nome !== chave)
  checar(`"${chave}" tem texto`, !!t.texto && t.texto.length > 20)
  // Tradução que ficou em inglês por descuido.
  checar(`"${chave}" está mesmo em português`,
    !/\b(you|the|and|while|damage)\b/i.test(t.texto),
    t.texto.slice(0, 60))
}

const juntos = comTraducao(ITENS_SRD)
checar('a junção não perde item', juntos.length === ITENS_SRD.length)

const traduzido = juntos.find((i) => i.nome === 'Adamantine Armor')
checar('o traduzido vem em português', traduzido?.nomePt === 'Armadura de Adamante')
checar('e marcado como traduzido', traduzido?.traduzido === true)
checar('mas o inglês oficial continua lá',
  traduzido?.texto.includes('adamantine'), traduzido?.texto?.slice(0, 40))

const semTraducao = juntos.find((i) => !TRADUCOES[i.nome])
checar('o que falta traduzir cai no inglês', semTraducao?.nomePt === semTraducao?.nome)
checar('e é marcado como não traduzido', semTraducao?.traduzido === false)

const feitos = juntos.filter((i) => i.traduzido).length
console.log(`  · ${feitos} de ${juntos.length} traduzidos`)

// ---------------------------------------------------------------------------
console.log('Licença')
//
// O SRD é CC-BY-4.0: usar o texto é permitido, atribuir é obrigatório.

checar('a atribuição nomeia a Wizards', /Wizards of the Coast/.test(ATRIBUICAO_SRD))
checar('e a licença', /Creative Commons Attribution 4\.0/.test(ATRIBUICAO_SRD))
checar('e a versão do SRD', /5\.2\.1/.test(ATRIBUICAO_SRD))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações do SRD falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações do SRD passaram`)
