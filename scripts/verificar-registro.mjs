// Verifica o registro de combate — e, principalmente, o que ele NÃO conta.
//
// O PV exato de um inimigo é censurado na projeção da batalha: o grupo vê
// porcentagem. Um registro sem censura seria a porta dos fundos — bastaria
// somar os danos anotados para saber quanto falta no chefe.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'registro-'))
const compilar = (entrada, saida) => {
  const alvo = join(dir, saida)
  execSync(`npx esbuild ${entrada} --bundle --outfile=${alvo} --format=esm --log-level=error`)
  return import(pathToFileURL(alvo).href)
}

const { registrar, eventosDeVida, eventosDeCondicao, projetarRegistro, destaquesDoCombate } =
  await compilar('src/lib/registro.ts', 'registro.js')
const { projetarBatalha } = await compilar('src/lib/battle.ts', 'battle.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const inimigo = {
  id: 'i1', origem: 'inimigo', refId: 'm1', nome: 'Belak',
  imagemUrl: '', imagemJogadorUrl: '', conhecimento: 'encontrado',
  ca: 16, pvMax: 200, pvAtual: 200, iniciativa: 12, iniciativaMod: 0,
  nomeOculto: false, condicoes: [],
}
const heroi = {
  id: 'h1', origem: 'aliado', refId: 'c1', nome: 'Thorn',
  imagemUrl: '', imagemJogadorUrl: '', conhecimento: 'completo',
  ca: 17, pvMax: 40, pvAtual: 40, iniciativa: 15, iniciativaMod: 0,
  nomeOculto: false, condicoes: [],
}
const vazia = { updatedAt: 1, nome: 'x', rodada: 3, turnoIndex: 0, emAndamento: true, combatentes: [] }

// ---------------------------------------------------------------------------
console.log('Eventos')

const dano = eventosDeVida(inimigo, 160)
checar('perder PV vira dano', dano[0].tipo === 'dano' && dano[0].valor === 40, JSON.stringify(dano[0]))
checar('e diz de quem foi', dano[0].alvo === 'Belak')
checar('e sabe que é inimigo', dano[0].deInimigo === true)

const cura = eventosDeVida({ ...heroi, pvAtual: 10 }, 25)
checar('ganhar PV vira cura', cura[0].tipo === 'cura' && cura[0].valor === 15)
checar('cura de aliado não é marcada como inimigo', !cura[0].deInimigo)

checar('PV parado não gera evento', eventosDeVida(inimigo, 200).length === 0)

// A queda merece linha própria: é o que a mesa lembra.
const morte = eventosDeVida({ ...inimigo, pvAtual: 5 }, 0)
checar('inimigo a 0 PV é derrubado', morte.some((e) => e.tipo === 'morreu'), JSON.stringify(morte))

// A diferença é regra: personagem a 0 PV rola teste de morte, monstro morre.
const queda = eventosDeVida({ ...heroi, pvAtual: 3 }, 0)
checar('personagem a 0 PV cai, não morre', queda.some((e) => e.tipo === 'caiu'))
checar('e o texto lembra do teste de morte',
  queda.find((e) => e.tipo === 'caiu').texto.includes('morte'))

const levantou = eventosDeVida({ ...heroi, pvAtual: 0 }, 8)
checar('voltar do 0 vira "de pé"', levantou.some((e) => e.tipo === 'levantou'))

const cond = eventosDeCondicao({ ...heroi, condicoes: ['Envenenado'] }, ['Envenenado', 'Agarrado'])
checar('condição nova é registrada', cond.length === 1 && cond[0].texto.includes('agarrado'), JSON.stringify(cond))
const saiu = eventosDeCondicao({ ...heroi, condicoes: ['Agarrado'] }, [])
checar('condição removida também', saiu.length === 1 && saiu[0].texto.includes('não está mais'))

// ---------------------------------------------------------------------------
console.log('Teto do registro')

let b = { ...vazia }
for (let i = 0; i < 260; i++) b = { ...b, registro: registrar(b, { tipo: 'nota', texto: `n${i}` }) }
checar('o registro para de crescer', b.registro.length === 200, `ficou com ${b.registro.length}`)
checar('e o que fica é o mais recente', b.registro[b.registro.length - 1].texto === 'n259')

// ---------------------------------------------------------------------------
console.log('Censura')

const comNumeros = [
  { id: 'a', em: 1, rodada: 1, tipo: 'dano', alvo: 'Belak', valor: 40, deInimigo: true,
    texto: 'Belak sofreu 40 de dano' },
  { id: 'b', em: 2, rodada: 1, tipo: 'cura', alvo: 'Belak', valor: 25, deInimigo: true,
    texto: 'Belak recuperou 25 PV' },
  { id: 'c', em: 3, rodada: 1, tipo: 'dano', alvo: 'Thorn', valor: 12,
    texto: 'Thorn sofreu 12 de dano' },
  { id: 'd', em: 4, rodada: 1, tipo: 'morreu', alvo: 'Belak', deInimigo: true,
    texto: 'Belak foi derrubado' },
]
const publico = projetarRegistro(comNumeros)

checar('o número do dano no inimigo some', publico[0].valor === undefined)
checar('e some do texto também', !/40/.test(publico[0].texto), publico[0].texto)
checar('mas o grupo ainda sabe que acertou', publico[0].texto.includes('Belak'))
checar('a cura do inimigo também perde o número', !/25/.test(publico[1].texto), publico[1].texto)

// O PV do próprio grupo é deles: censurar seria esconder do jogador a vida
// dele mesmo.
checar('o dano no personagem mantém o número', publico[2].valor === 12 && /12/.test(publico[2].texto))

// Derrubar é fato visível na mesa; esconder não protegeria nada.
checar('a queda do inimigo continua sendo contada', publico[3].texto === 'Belak foi derrubado')

// Somar o log não pode revelar o PV do chefe.
const soma = publico
  .filter((e) => e.deInimigo && e.tipo === 'dano')
  .reduce((t, e) => t + (e.valor ?? 0), 0)
checar('somar os danos anotados não dá o PV perdido', soma === 0, `somou ${soma}`)

// E a projeção da batalha precisa aplicar isso de verdade — não adianta a
// função existir se `projetarBatalha` esquecer de chamá-la.
const projetada = projetarBatalha({ ...vazia, combatentes: [inimigo, heroi], registro: comNumeros })
const json = JSON.stringify(projetada)
checar('a batalha publicada não carrega o dano exato do inimigo', !json.includes('sofreu 40'), json.slice(0, 200))
checar('nem o valor solto', !projetada.registro.some((e) => e.deInimigo && e.valor != null))

// ---------------------------------------------------------------------------
console.log('Destaques')

const combate = {
  ...vazia,
  rodada: 4,
  registro: [
    { id: '1', em: 1, rodada: 1, tipo: 'dano', alvo: 'Belak', valor: 12, deInimigo: true, texto: 'x' },
    { id: '2', em: 2, rodada: 2, tipo: 'dano', alvo: 'Belak', valor: 47, deInimigo: true, texto: 'x' },
    { id: '3', em: 3, rodada: 2, tipo: 'caiu', alvo: 'Thorn', texto: 'x' },
    { id: '4', em: 4, rodada: 3, tipo: 'morreu', alvo: 'Belak', deInimigo: true, texto: 'x' },
    { id: '5', em: 5, rodada: 3, tipo: 'fase', alvo: 'Belak Desperto', texto: 'Belak se transformou' },
  ],
}
const d = destaquesDoCombate(combate).join(' | ')
checar('o maior golpe é o maior, não o último', d.includes('47'), d)
checar('quem caiu aparece', d.includes('Thorn'), d)
checar('a virada de fase aparece', d.includes('transformou'), d)
checar('a duração aparece', d.includes('4 rodadas'), d)

checar('combate sem registro ainda produz a duração',
  destaquesDoCombate({ ...vazia, rodada: 1 }).some((x) => x.includes('1 rodada')))

// ---------------------------------------------------------------------------
console.log('Vida temporária no registro')
//
// O golpe que o colchão come inteiro não mexe no PV. Sem tratamento, ele não
// deixava rastro nenhum: dez golpes de 1 numa Vida Falsa sumiam do registro, e
// a luta ficava com um buraco onde aconteceu coisa.

const comColchao = { ...heroi, nome: 'Elara', pvAtual: 30, pvMax: 30, pvTemporario: 10 }

const soColchao = eventosDeVida(comColchao, 30, 3)
checar('golpe absorvido gera linha', soColchao.length === 1, JSON.stringify(soColchao))
checar('e diz que foi a vida temporária',
  /absorvido pela vida temporária/.test(soColchao[0].texto), soColchao[0]?.texto)
checar('com o valor certo', soColchao[0].valor === 7, String(soColchao[0]?.valor))

const meioAMeio = eventosDeVida(comColchao, 25, 0)
checar('golpe que passa do colchão soma os dois',
  meioAMeio[0].valor === 15, String(meioAMeio[0]?.valor))
checar('e o texto separa o que o colchão comeu',
  /15 de dano \(10 na vida temporária\)/.test(meioAMeio[0].texto), meioAMeio[0]?.texto)

checar('sem colchão, nada muda no texto',
  /sofreu 40 de dano$/.test(eventosDeVida(inimigo, 160)[0].texto),
  eventosDeVida(inimigo, 160)[0]?.texto)
checar('sem dano nenhum, nenhuma linha',
  eventosDeVida(comColchao, 30, 10).length === 0)
// Colchão que SOBE é bênção recebida, não golpe absorvido.
checar('ganhar vida temporária não vira dano',
  eventosDeVida(comColchao, 30, 20).length === 0)

// A CD DA CONCENTRAÇÃO SAI DO DANO SOFRIDO, e não do PV perdido. Um mago com
// 10 temporários que leva 30 perde 20 de vida, mas SOFREU 30 — e a salvaguarda
// é contra metade de 30. Usar o PV perdido daria CD 10 no lugar de CD 15, e a
// magia ficaria mais fácil de segurar exatamente para quem estava protegido.
const magoProtegido = { ...comColchao, concentracao: 'Teia' }
const comTeste = eventosDeVida(magoProtegido, 10, 0)
const linhaCd = comTeste.find((e) => e.tipo === 'concentracao')
checar('o golpe pede o teste de concentração', !!linhaCd)
checar('e a CD sai do dano SOFRIDO, não do PV perdido',
  /CD 15/.test(linhaCd?.texto ?? ''), linhaCd?.texto)

// E o golpe totalmente absorvido também pede o teste: a pessoa sofreu dano.
const soAbsorvido = eventosDeVida(magoProtegido, 30, 0)
checar('golpe absorvido inteiro ainda pede o teste',
  soAbsorvido.some((e) => e.tipo === 'concentracao'),
  JSON.stringify(soAbsorvido.map((e) => e.tipo)))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de registro falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de registro passaram`)
