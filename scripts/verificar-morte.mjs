// Verifica os testes de morte: quando se rola, o que cada resultado faz, e
// quando a conta zera.
//
// É o mesmo tipo de buraco da concentração, uma casa adiante: o app mostrava
// "0 PV" e parava. Ninguém rolava, ninguém contava os três sucessos, e o 20
// natural que levanta a pessoa com 1 PV dependia de alguém na mesa lembrar.
//
// O perigo aqui é o oposto do de somar errado: uma regra frouxa não quebra
// nada. Um personagem que nunca morre continua jogando, a mesa nem repara, e a
// luta inteira perde o peso.
//
// Os números vêm do SRD 5.2.1 ("Playing the Game", Damage and Healing) e estão
// escritos à mão aqui, um a um. Derivar da implementação seria testar que o
// código concorda consigo mesmo.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'morte-'))
execSync(
  `npx esbuild src/lib/morte.ts src/lib/battle.ts ` +
    `--bundle --splitting --outdir=${dir} --format=esm --log-level=error`,
)
const carregar = (n) => import(pathToFileURL(join(dir, `${n}.js`)).href)
const {
  aoRolar, aoSofrerDanoCaido, morteInstantanea, precisaRolar, aoCurar, zerado,
  CD_TESTE_DE_MORTE, aplicarDano, aplicarCura, receberTemporarios,
} = await carregar('morte')
const { foraDoCombate, proximoDaVez } = await carregar('battle')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const t = (sucessos, falhas) => ({ sucessos, falhas })
const NADA = t(0, 0)

// ---------------------------------------------------------------------------
console.log('A rolagem')

checar('a CD é 10', CD_TESTE_DE_MORTE === 10, String(CD_TESTE_DE_MORTE))
checar('exatamente 10 passa', aoRolar(NADA, 10, 'Elara').testes.sucessos === 1)
checar('9 falha', aoRolar(NADA, 9, 'Elara').testes.falhas === 1)
checar('19 passa', aoRolar(NADA, 19, 'Elara').testes.sucessos === 1)
checar('2 falha', aoRolar(NADA, 2, 'Elara').testes.falhas === 1)
// Não é teste de atributo: nada é somado. Se alguém acrescentar um modificador
// aqui, um personagem com CON alta passa a ser quase imortal caído.
checar('passar não cria falha', aoRolar(NADA, 15, 'Elara').testes.falhas === 0)
checar('falhar não cria sucesso', aoRolar(NADA, 5, 'Elara').testes.sucessos === 0)

// ---------------------------------------------------------------------------
console.log('O 1 e o 20 naturais')

const um = aoRolar(NADA, 1, 'Elara')
checar('1 natural vale DUAS falhas', um.testes.falhas === 2, `deu ${um.testes.falhas}`)
checar('e não mata sozinho de zero', um.morreu === false)
const umComUma = aoRolar(t(0, 1), 1, 'Elara')
checar('1 natural com uma falha já mata', umComUma.morreu === true)

const vinte = aoRolar(t(1, 2), 20, 'Elara')
checar('20 natural devolve 1 PV', vinte.pvAtual === 1)
checar('e zera a conta', vinte.testes.sucessos === 0 && vinte.testes.falhas === 0,
  JSON.stringify(vinte.testes))
checar('não é "estável": a pessoa está de pé', vinte.estavel === false)
checar('e não morreu', vinte.morreu === false)
// Tratar o 20 como sucesso comum deixaria a pessoa caída com duas falhas em vez
// de em pé — é o erro que a mesa mais comemora não cometer.
checar('20 não conta como sucesso comum', vinte.testes.sucessos !== 3)

// ---------------------------------------------------------------------------
console.log('Três de cada')

const terceiraFalha = aoRolar(t(2, 2), 3, 'Elara')
checar('a terceira falha mata', terceiraFalha.morreu === true)
checar('mesmo com dois sucessos no bolso', terceiraFalha.testes.falhas === 3)

const terceiroSucesso = aoRolar(t(2, 2), 17, 'Elara')
checar('o terceiro sucesso estabiliza', terceiroSucesso.estavel === true)
checar('sem matar', terceiroSucesso.morreu === false)
// Estabilizar ZERA a conta. Sem isso, quem estabiliza acorda depois carregando
// as falhas velhas para o tombo seguinte.
checar('e zera a conta', terceiroSucesso.testes.falhas === 0 && terceiroSucesso.testes.sucessos === 0,
  JSON.stringify(terceiroSucesso.testes))

// Sucessos e falhas não precisam ser seguidos: passa, falha, passa, falha.
let acumulado = NADA
for (const d20 of [12, 4, 15, 6]) acumulado = aoRolar(acumulado, d20, 'Elara').testes
checar('a conta soma alternada', acumulado.sucessos === 2 && acumulado.falhas === 2,
  JSON.stringify(acumulado))
// E o quinto dado resolve. Rolar de novo depois disso não é problema deste
// módulo: quem decide se ainda se rola é `precisaRolar`.
const quinto = aoRolar(acumulado, 11, 'Elara')
checar('o quinto dado estabiliza', quinto.estavel === true)

// ---------------------------------------------------------------------------
console.log('Apanhar caído')
//
// É a regra que a mesa mais deixa passar: o inimigo continua batendo em quem
// caiu, e ninguém marca nada.

const levouPancada = aoSofrerDanoCaido(NADA, { dano: 5, pvMax: 30 }, 'Elara')
checar('dano caído é falha direta', levouPancada.testes.falhas === 1)
checar('sem rolar nada', levouPancada.testes.sucessos === 0)

const critico = aoSofrerDanoCaido(NADA, { dano: 8, pvMax: 30, critico: true }, 'Elara')
checar('crítico em quem está caído vale DUAS falhas', critico.testes.falhas === 2,
  `deu ${critico.testes.falhas}`)

const doisGolpes = aoSofrerDanoCaido(t(0, 2), { dano: 3, pvMax: 30 }, 'Elara')
checar('a terceira falha por pancada também mata', doisGolpes.morreu === true)

const enorme = aoSofrerDanoCaido(NADA, { dano: 30, pvMax: 30 }, 'Elara')
checar('dano igual ao PV máximo mata na hora', enorme.morreu === true)
checar('e diz por quê', /máximo/.test(enorme.texto), enorme.texto)
const quaseEnorme = aoSofrerDanoCaido(NADA, { dano: 29, pvMax: 30 }, 'Elara')
checar('um a menos NÃO mata', quaseEnorme.morreu === false)
checar('só marca a falha', quaseEnorme.testes.falhas === 1)

// ---------------------------------------------------------------------------
console.log('Dano massivo na descida')
//
// O que conta é a SOBRA depois de zerar, e não o golpe inteiro. Confundir os
// dois mata personagem que deveria estar caído — e é fácil confundir.

checar('30 de dano em quem tem 6 PV e máximo 12 mata',
  morteInstantanea(6, 30, 12) === true)
checar('18 em quem tem 6 e máximo 12 mata na conta exata',
  morteInstantanea(6, 18, 12) === true)
checar('17 não mata: a sobra é 11, e o máximo é 12',
  morteInstantanea(6, 17, 12) === false)
checar('golpe grande em quem tem MUITO PV não mata',
  morteInstantanea(40, 45, 40) === false)
checar('quem já estava a 0 não passa por aqui', morteInstantanea(0, 99, 10) === false)
checar('e sem PV máximo não há regra', morteInstantanea(5, 99, 0) === false)

// ---------------------------------------------------------------------------
console.log('Quem rola, e quando')

checar('aliado a 0 rola', precisaRolar({ origem: 'aliado', pvAtual: 0 }) === true)
checar('aliado de pé não rola', precisaRolar({ origem: 'aliado', pvAtual: 3 }) === false)
// Monstro morre no instante em que chega a 0 — está no SRD, e é por isso que o
// painel nunca aparece para o lado de lá do mapa.
checar('inimigo NUNCA rola', precisaRolar({ origem: 'inimigo', pvAtual: 0 }) === false)
checar('quem estabilizou parou de rolar',
  precisaRolar({ origem: 'aliado', pvAtual: 0, estavel: true }) === false)
checar('quem já morreu também',
  precisaRolar({ origem: 'aliado', pvAtual: 0, testesMorte: t(0, 3) }) === false)
checar('PV negativo ainda rola',
  precisaRolar({ origem: 'aliado', pvAtual: -4 }) === true)

// ---------------------------------------------------------------------------
console.log('Recuperar PV zera tudo')
//
// O detalhe que mais some. A pessoa é curada, cai de novo três rodadas depois,
// e a mesa continua contando as falhas antigas.

const curada = aoCurar()
checar('a cura zera os sucessos', curada.testesMorte.sucessos === 0)
checar('e as falhas', curada.testesMorte.falhas === 0)
checar('e desfaz a estabilidade', curada.estavel === false)
checar('zerado() começa em 0/0', zerado().sucessos === 0 && zerado().falhas === 0)

// ---------------------------------------------------------------------------
console.log('Quem perde a vez, e quem vem depois')
//
// A tela de mesa anuncia "depois: Fulano" em letra grande, e o DM prepara a
// fala do monstro a partir daí. Se esse anúncio usar uma conta diferente da
// que passa o turno, ele aponta para um cadáver — e anunciar a criatura
// errada é pior do que não anunciar nada.

const vivo = (id, origem, pv = 10) => ({ id, nome: id, origem, pvAtual: pv, pvMax: 10 })

checar('inimigo a 0 perde a vez', foraDoCombate(vivo('g', 'inimigo', 0)) === true)
// O aliado a 0 MANTÉM a vez: é nela que ele rola o teste de morte. Pular seria
// tirar do jogo exatamente a rolagem mais tensa da mesa.
checar('aliado a 0 NÃO perde a vez', foraDoCombate(vivo('a', 'aliado', 0)) === false)
checar('e ninguém de pé perde', foraDoCombate(vivo('g', 'inimigo', 3)) === false)

const fila = [vivo('a1', 'aliado'), vivo('g1', 'inimigo', 0), vivo('g2', 'inimigo')]
checar('o próximo pula o inimigo morto', proximoDaVez(fila, 0)?.id === 'g2',
  proximoDaVez(fila, 0)?.id)
checar('e dá a volta na lista', proximoDaVez(fila, 2)?.id === 'a1')
checar('o aliado caído continua na fila',
  proximoDaVez([vivo('g', 'inimigo'), vivo('a', 'aliado', 0)], 0)?.id === 'a')
checar('lista vazia não tem próximo', proximoDaVez([], 0) === null)
// Todo mundo fora: devolver o primeiro seria inventar um turno que não existe.
checar('todos fora devolve nada',
  proximoDaVez([vivo('g1', 'inimigo', 0), vivo('g2', 'inimigo', 0)], 0) === null)

// ---------------------------------------------------------------------------
console.log('Vida temporária: o campo que ninguém consumia')
//
// Ele existia na ficha, aparecia no cartão do grupo, vinha preenchido da
// importação do D&D Beyond e era zerado no descanso longo. E NENHUM caminho de
// dano o consumia: o guerreiro com 10 temporários levava 7 e perdia 7 de vida
// de verdade, com o "+10 temp" intacto ao lado.

const comColchao = { pvAtual: 30, pvMax: 30, pvTemporario: 10 }

const levou7 = aplicarDano(comColchao, 7)
checar('o dano come o temporário primeiro', levou7.pvAtual === 30, String(levou7.pvAtual))
checar('e o colchão encolhe', levou7.pvTemporario === 3, String(levou7.pvTemporario))

const levou15 = aplicarDano(comColchao, 15)
checar('o que passa do colchão vai para a vida', levou15.pvAtual === 25, String(levou15.pvAtual))
checar('e o colchão zera', levou15.pvTemporario === 0)

checar('dano exato ao colchão não toca a vida', aplicarDano(comColchao, 10).pvAtual === 30)
checar('sem colchão, o dano é direto',
  aplicarDano({ pvAtual: 30, pvMax: 30 }, 7).pvAtual === 23)
// O piso NÃO é zero: o excedente é o que decide a morte instantânea.
checar('o PV pode ficar negativo, para a regra de dano massivo funcionar',
  aplicarDano({ pvAtual: 5, pvMax: 30 }, 40).pvAtual === -35)
checar('dano zero não mexe em nada', aplicarDano(comColchao, 0).pvTemporario === 10)

// A cura NÃO restaura o temporário. Somar ali seria o erro generoso de sempre.
const curado = aplicarCura({ pvAtual: 10, pvMax: 30, pvTemporario: 4 }, 8)
checar('a cura vai para a vida de verdade', curado.pvAtual === 18)
checar('e não mexe no colchão', curado.pvTemporario === 4)
checar('a cura respeita o máximo',
  aplicarCura({ pvAtual: 28, pvMax: 30 }, 10).pvAtual === 30)
// Quem está a -35 e recebe 8 de cura vai para 8, e não para -27.
checar('curar quem está negativo começa do zero',
  aplicarCura({ pvAtual: -35, pvMax: 30 }, 8).pvAtual === 8)

// Temporário NÃO se soma: escolhe-se o maior.
checar('recebe o maior', receberTemporarios(5, 12) === 12)
checar('e mantém o maior que já tinha', receberTemporarios(12, 5) === 12)
checar('sem nada antes, vale o novo', receberTemporarios(undefined, 7) === 7)
checar('e não soma os dois', receberTemporarios(5, 12) !== 17)

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de morte falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de morte passaram`)
