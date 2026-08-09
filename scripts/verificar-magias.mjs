// Verifica o catálogo de magias e a ponte com as explicações que já tínhamos.
//
// A extração do PDF erra em silêncio: uma magia cujo bloco não é reconhecido
// não some com estardalhaço — o texto dela vai parar dentro da magia anterior,
// que continua na tela com o começo certo. Foi assim que Cure Wounds,
// Prestidigitation e Power Word Kill sumiram sem que nada quebrasse.
//
// E a tabela de equivalência tem o mesmo perigo da tabela de importação de
// equipamento: uma chave escrita errado não dá erro, a explicação só nunca
// aparece.

import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'magias-'))
execSync(
  `npx esbuild src/data/srd/magias.ts src/data/srd/magias-srd.ts src/data/spells.ts ` +
    `--bundle --splitting --outdir=${dir} --format=esm --log-level=error`,
)
const carregar = (n) => import(pathToFileURL(join(dir, `${n}.js`)).href)
const { comExplicacao, ESCOLAS, CLASSES } = await carregar('srd/magias')
const { MAGIAS_SRD } = await carregar('srd/magias-srd')
const { SPELLS } = await carregar('spells')

const CAT = comExplicacao(MAGIAS_SRD)

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

checar('tem magia de sobra', MAGIAS_SRD.length > 300, `são ${MAGIAS_SRD.length}`)
const nomes = MAGIAS_SRD.map((m) => m.nome)
checar('sem nomes repetidos', new Set(nomes).size === nomes.length,
  nomes.filter((n, i) => nomes.indexOf(n) !== i).join(', '))
checar('toda magia tem texto', MAGIAS_SRD.every((m) => m.texto.length > 20))
checar('e os quatro campos',
  MAGIAS_SRD.every((m) => m.tempo && m.alcance && m.componentes && m.duracao))

// As que sumiram na primeira extração, por causa da lista de classes que quebra
// em duas linhas. São o canário: se voltarem a sumir, o defeito voltou.
for (const n of ['Cure Wounds', 'Prestidigitation', 'Power Word Kill', 'Fireball', 'Wish'])
  checar(`"${n}" está no catálogo`, nomes.includes(n))

// Todo círculo tem magia. Um vazio quer dizer que um bloco inteiro se perdeu.
for (const nivel of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  checar(`o ${nivel === 0 ? 'truque' : `${nivel}º círculo`} tem magias`,
    MAGIAS_SRD.some((m) => m.nivel === nivel))

// ---------------------------------------------------------------------------
console.log('Nada do PDF vazou para dentro do texto')

const RE_CABECALHO =
  /(Level [1-9] )?(Abjuration|Conjuration|Divination|Enchantment|Evocation|Illusion|Necromancy|Transmutation)( Cantrip)? \((Bard|Cleric|Druid|Paladin|Ranger|Sorcerer|Warlock|Wizard)/
const engoliu = MAGIAS_SRD.filter((m) => RE_CABECALHO.test(m.texto))
checar('nenhuma magia engoliu a próxima', engoliu.length === 0,
  engoliu.map((m) => m.nome).join(', '))

checar('nenhum rodapé de página no texto',
  !MAGIAS_SRD.some((m) => /System Reference Document/i.test(m.texto)))

// Engolir o capítulo seguinte não dá erro: a magia sai certa no começo e com o
// resto do livro colado atrás. "Zone of Truth" chegou a 108 mil caracteres.
const inchadas = MAGIAS_SRD.filter((m) => m.texto.length > 8000)
checar('nenhuma magia engoliu o capítulo seguinte', inchadas.length === 0,
  inchadas.map((m) => `${m.nome}: ${m.texto.length}`).join(', '))

const nomeRuim = MAGIAS_SRD.filter((m) => !/^[A-Z]/.test(m.nome) || /[a-z][A-Z]/.test(m.nome))
checar('nenhum nome saiu em versalete quebrado', nomeRuim.length === 0,
  nomeRuim.map((m) => m.nome).join(', '))

// ---------------------------------------------------------------------------
console.log('Concentração e ritual')
//
// Concentração é a regra que a mesa mais esquece, e é o que o combate vai
// precisar. Se ela sair errada aqui, sai errada lá.

const bencao = MAGIAS_SRD.find((m) => m.nome === 'Bless')
checar('Bless exige concentração', bencao?.concentracao === true, bencao?.duracao)
const missil = MAGIAS_SRD.find((m) => m.nome === 'Magic Missile')
checar('Magic Missile não exige', missil?.concentracao === false, missil?.duracao)
checar('toda magia de concentração diz isso na duração',
  MAGIAS_SRD.filter((m) => m.concentracao).every((m) => /concentration/i.test(m.duracao)))
checar('e há bastante delas', MAGIAS_SRD.filter((m) => m.concentracao).length > 100)

const alarme = MAGIAS_SRD.find((m) => m.nome === 'Alarm')
checar('Alarm é ritual', alarme?.ritual === true, alarme?.tempo)
checar('Fireball não é', MAGIAS_SRD.find((m) => m.nome === 'Fireball')?.ritual === false)
checar('todo ritual diz isso no tempo de conjuração',
  MAGIAS_SRD.filter((m) => m.ritual).every((m) => /ritual/i.test(m.tempo)))

// ---------------------------------------------------------------------------
console.log('A ponte com as explicações que já tínhamos')

const bloco = readFileSync('src/data/srd/nomes-magias.ts', 'utf8')
const chaves = [...bloco.matchAll(/^\s+'((?:[^'\\]|\\.)+)':\s*'/gm)].map((m) => m[1].replace(/\\'/g, "'"))
checar('a tabela tem as 339 chaves', chaves.length === 339, `achei ${chaves.length}`)

const noSrd = new Set(nomes)
const mortas = chaves.filter((k) => !noSrd.has(k))
checar('toda chave aponta para uma magia que existe', mortas.length === 0, mortas.join(', '))

// A tabela serve a duas coisas: dar o nome em português e, quando o nome bate
// com um dos 69 resumos, trazer a explicação junto. Um destino sem resumo NÃO é
// defeito — "Escuridão" é melhor do que "Darkness" mesmo sem explicação.
// A primeira versão deste teste exigia resumo para todo destino e reprovava
// cinco traduções perfeitamente boas.
const nossos = new Set(SPELLS.map((s) => s.nome))
const destinos = [...bloco.matchAll(/:\s*'([^']+)'/g)].map((m) => m[1])
checar('os destinos que têm resumo trazem a explicação',
  CAT.filter((m) => nossos.has(m.nomePt)).every((m) => m.explicada),
  CAT.filter((m) => nossos.has(m.nomePt) && !m.explicada).map((m) => m.nomePt).join(', '))
checar('e todo destino é um nome em português de verdade',
  destinos.every((d) => /[a-záéíóúâêôãõç]/.test(d)),
  destinos.filter((d) => !/[a-záéíóúâêôãõç]/.test(d)).join(', '))

// ---------------------------------------------------------------------------
console.log('A junção')

checar('a junção não perde magia', CAT.length === MAGIAS_SRD.length)
const bola = CAT.find((m) => m.nome === 'Fireball')
checar('a explicada vem em português', bola?.nomePt === 'Bola de Fogo')
checar('com a escola traduzida', bola?.escolaPt === 'Evocação')
checar('e as classes também', bola?.classesPt.includes('Mago'))
checar('com a explicação sem jargão', !!bola?.emMiudos && bola.explicada === true)
checar('e o texto oficial continua lá', bola?.texto.includes('bright streak'))

// A explicação do arquivo novo não pode passar por cima das 68 que já estavam
// na mesa: trocar a redação que o jogador já leu seria mexer no que funciona.
const orbe = CAT.find((m) => m.nome === 'Chromatic Orb')
checar('a magia sem resumo antigo ganha a explicação nova',
  orbe?.explicada === true && /escolhe o tipo de dano/i.test(orbe?.emMiudos ?? ''),
  orbe?.emMiudos)
checar('e o texto oficial dela continua lá', (orbe?.texto.length ?? 0) > 20)

// ---------------------------------------------------------------------------
console.log('Os nomes')
//
// O jogador fez um mago, abriu o catálogo — a única coisa que um mago faz — e
// leu "Chromatic Orb", "Dancing Lights", "Mending". As 69 escritas à mão
// estavam em português e as outras 270 não.

const semNomePt = CAT.filter((m) => m.nomePt === m.nome)
checar('só Clone e Tsunami ficam iguais nas duas línguas',
  semNomePt.length === 2 && semNomePt.every((m) => ['Clone', 'Tsunami'].includes(m.nome)),
  semNomePt.map((m) => m.nome).join(', '))

// Nome repetido faria a explicação de uma magia vazar para outra: é pelo nome
// em português que o catálogo se liga aos nossos resumos.
const contagem = new Map()
for (const m of CAT) contagem.set(m.nomePt, (contagem.get(m.nomePt) ?? 0) + 1)
const repetidos = [...contagem].filter(([, n]) => n > 1).map(([n]) => n)
checar('nenhum nome em português se repete', repetidos.length === 0, repetidos.join(', '))

// Uma amostra conferida à mão. Comparar a tabela com ela mesma passaria mesmo
// com a tabela inteira trocada.
for (const [ingles, portugues] of [
  ['Chromatic Orb', 'Orbe Cromático'],
  ['Dancing Lights', 'Luzes Dançantes'],
  ['Mending', 'Consertar'],
  ['Mage Armor', 'Armadura Arcana'],
  ['Spare the Dying', 'Estabilizar'],
  ['Hunter’s Mark', 'Marca do Caçador'],
  ['Zone of Truth', 'Zona da Verdade'],
  ['Fireball', 'Bola de Fogo'],
]) {
  const m = CAT.find((x) => x.nome === ingles)
  checar(`${ingles} → ${portugues}`, m?.nomePt === portugues, `deu ${m?.nomePt}`)
}

// ---------------------------------------------------------------------------
console.log('As explicações')
//
// Antes eram 68 de 339, e o jogador topou com isso na hora em que mais
// importava: escolhendo as magias do mago dele, com o texto oficial em inglês
// no lugar da explicação. Agora a cobrança é sobre TODAS — uma magia que entrar
// no catálogo sem a sua explicação reprova aqui.

const semDica = CAT.filter((m) => !m.emMiudos)
checar('as 339 têm explicação em português', semDica.length === 0,
  semDica.slice(0, 6).map((m) => m.nome).join(', '))
checar('e a marca de explicada acompanha', CAT.every((m) => m.explicada))
checar('as 68 antigas continuam sendo as 68 antigas',
  CAT.filter((m) => nossos.has(m.nomePt)).length >= SPELLS.length - 2,
  `${CAT.filter((m) => nossos.has(m.nomePt)).length} para ${SPELLS.length} escritas`)

// Uma explicação não pode ser o texto oficial recortado: ela existe justamente
// por NÃO ser a redação do livro.
const emIngles = CAT.filter((m) => m.texto.slice(0, 40).includes(m.emMiudos.slice(0, 25)))
checar('nenhuma explicação é o texto oficial recortado', emIngles.length === 0,
  emIngles.slice(0, 4).map((m) => m.nome).join(', '))
const curtas = CAT.filter((m) => m.emMiudos.length < 25)
checar('nenhuma explicação é curta demais para dizer algo', curtas.length === 0,
  curtas.map((m) => `${m.nome}: ${m.emMiudos}`).join(' | '))

// Escolas e classes precisam cobrir tudo o que o SRD usa, senão a tela mostra
// inglês no meio do português.
const escolasUsadas = [...new Set(MAGIAS_SRD.map((m) => m.escola))]
checar('toda escola tem tradução', escolasUsadas.every((e) => ESCOLAS[e]),
  escolasUsadas.filter((e) => !ESCOLAS[e]).join(', '))
const classesUsadas = [...new Set(MAGIAS_SRD.flatMap((m) => m.classes))]
checar('toda classe tem tradução', classesUsadas.every((c) => CLASSES[c]),
  classesUsadas.filter((c) => !CLASSES[c]).join(', '))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de magia falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de magia passaram`)
