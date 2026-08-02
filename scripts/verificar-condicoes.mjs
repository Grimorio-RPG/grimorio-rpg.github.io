// Verifica prazo de condição e concentração.
//
// Condição era texto solto: sem quantas rodadas faltam, sem quem causou. E
// concentração existia só como propriedade de magia no catálogo, sumindo no
// combate — a mesa esquecia que o mago estava concentrado até alguém lembrar
// meia hora depois.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'cond-'))
const compilar = (entrada, saida) => {
  const alvo = join(dir, saida)
  execSync(`npx esbuild ${entrada} --bundle --outfile=${alvo} --format=esm --log-level=error`)
  return import(pathToFileURL(alvo).href)
}

const { correrCondicoes, projetarBatalha, combatenteDePersonagem } =
  await compilar('src/lib/battle.ts', 'battle.js')
const { cdDeConcentracao } = await compilar('src/lib/calc.ts', 'calc.js')
const { eventosDeVida } = await compilar('src/lib/registro.ts', 'registro.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const base = {
  id: 'h1', origem: 'aliado', refId: 'c1', nome: 'Thorn',
  imagemUrl: '', imagemJogadorUrl: '', conhecimento: 'completo',
  ca: 17, pvMax: 40, pvAtual: 40, iniciativa: 15, iniciativaMod: 0,
  nomeOculto: false, condicoes: [],
}

// ---------------------------------------------------------------------------
console.log('Prazo das condições')

const comPrazo = {
  ...base,
  condicoes: ['Atordoado', 'Envenenado', 'Agarrado'],
  // Agarrado sem contador: dura "até alguém tirar", que é o caso comum em 5.5e.
  rodadasDeCondicao: { Atordoado: 2, Envenenado: 1 },
}

const r1 = correrCondicoes([comPrazo], 'h1')
const dep1 = r1.combatentes[0]
checar('o contador cai uma rodada', dep1.rodadasDeCondicao.Atordoado === 1)
checar('a que chegou a zero sai da lista', !dep1.condicoes.includes('Envenenado'), dep1.condicoes.join())
checar('e é reportada como expirada',
  r1.expiradas.length === 1 && r1.expiradas[0].condicao === 'Envenenado',
  JSON.stringify(r1.expiradas))
checar('a sem contador não expira sozinha', dep1.condicoes.includes('Agarrado'))
checar('e continua sem contador', dep1.rodadasDeCondicao.Agarrado === undefined)

const r2 = correrCondicoes(r1.combatentes, 'h1')
checar('na rodada seguinte a última também acaba',
  !r2.combatentes[0].condicoes.includes('Atordoado'),
  r2.combatentes[0].condicoes.join())

// Só anda quem está começando o turno: o contador é do dono da condição.
const outro = { ...comPrazo, id: 'x9', nome: 'Outro' }
const r3 = correrCondicoes([comPrazo, outro], 'x9')
checar('o turno de um não mexe no prazo do outro',
  r3.combatentes[0].rodadasDeCondicao.Atordoado === 2,
  JSON.stringify(r3.combatentes[0].rodadasDeCondicao))

checar('quem não tem prazo nenhum passa ileso',
  correrCondicoes([base], 'h1').combatentes[0] === base)

// ---------------------------------------------------------------------------
console.log('Concentração')

checar('CD mínima é 10', cdDeConcentracao(4) === 10)
checar('CD mínima também com dano 20', cdDeConcentracao(20) === 10)
checar('acima de 20 de dano, vira metade', cdDeConcentracao(30) === 15)
checar('ímpar arredonda para baixo', cdDeConcentracao(45) === 22)

const mago = { ...base, nome: 'Elyra', concentracao: 'Enfeitiçar Pessoa' }
const comDano = eventosDeVida(mago, mago.pvAtual - 30)
const aviso = comDano.find((e) => e.tipo === 'concentracao')
checar('tomar dano concentrado pede o teste', !!aviso, JSON.stringify(comDano))
checar('com a CD já calculada', aviso?.texto.includes('CD 15'), aviso?.texto)
checar('e dizendo qual magia', aviso?.texto.includes('Enfeitiçar Pessoa'), aviso?.texto)

checar('cura não pede teste',
  !eventosDeVida({ ...mago, pvAtual: 10 }, 25).some((e) => e.tipo === 'concentracao'))
checar('quem não concentra não recebe aviso',
  !eventosDeVida(base, 10).some((e) => e.tipo === 'concentracao'))

// A ficha já sabia disto; a batalha ignorava.
const ficha = {
  id: 'c1', nome: 'Elyra', nivel: 5, atributos: { for: 8, des: 14, con: 12, int: 16, sab: 10, car: 10 },
  classeArmaduraManual: 13, armaduraEquipada: '', escudoEquipado: false, talentos: [],
  salvaguardasProficientes: [], periciasProficientes: [], periciasExpertise: [],
  pvMax: 30, pvAtual: 30, iniciativaBonus: 0, concentrando: 'Teia',
}
checar('o combatente herda a concentração da ficha',
  combatenteDePersonagem(ficha).concentracao === 'Teia',
  combatenteDePersonagem(ficha).concentracao)
checar('e fica sem nada quando a ficha não concentra',
  combatenteDePersonagem({ ...ficha, concentrando: undefined }).concentracao === undefined)

// ---------------------------------------------------------------------------
console.log('Censura')

const chefe = {
  ...base, id: 'i1', origem: 'inimigo', nome: 'Belak', pvMax: 100, pvAtual: 60,
  condicoes: ['Atordoado'], rodadasDeCondicao: { Atordoado: 2 },
  concentracao: 'SEGREDO-MAGIA-DO-CHEFE',
}
const publico = projetarBatalha({
  updatedAt: 1, nome: 'x', rodada: 1, turnoIndex: 0, emAndamento: true,
  combatentes: [chefe, mago],
})

const inimigoPublico = publico.combatentes[0]
checar('a magia que o inimigo concentra não sai', inimigoPublico.concentracao === undefined)
checar('nem em nenhum canto do JSON',
  !JSON.stringify(publico).includes('SEGREDO-MAGIA-DO-CHEFE'))

// Decisão consciente: a condição já aparece para o grupo, então o prazo dela
// também pode — é o que faz o jogador planejar o turno em vez de perguntar.
checar('o prazo da condição do inimigo continua visível',
  inimigoPublico.rodadasDeCondicao?.Atordoado === 2)

// O aliado é do próprio grupo: a concentração dele é informação dele.
checar('a concentração de um personagem continua',
  publico.combatentes[1].concentracao === 'Enfeitiçar Pessoa')

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de condição falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de condição passaram`)
