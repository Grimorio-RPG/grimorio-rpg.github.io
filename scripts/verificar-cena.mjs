// Verifica a criatura como uma coisa só: combatente e token de mapa.
//
// Eram dois objetos separados, cada um com o seu id, os dois criados a partir
// do mesmo monstro do bestiário. O DM cadastrava o goblin na batalha e depois
// cadastrava o token do goblin no mapa — e o token nem tinha PV, então tirar
// vida numa tela não mudava nada na outra.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'cena-'))
const alvo = join(dir, 'battle.js')
execSync(`npx esbuild src/lib/battle.ts --bundle --outfile=${alvo} --format=esm --log-level=error`)
const {
  combatentesDeMonstro, combatenteDePersonagem, tokenDeCombatente, tokensDaCena,
  moverCombatente, posicaoDeEntrada, quadradosDoTamanho, projetarBatalha, ordenar,
} = await import(pathToFileURL(alvo).href)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const goblin = {
  id: 'm1', updatedAt: 1, nome: 'Goblin', imagemUrl: 'dm', imagemJogadorUrl: 'pub',
  tipo: 'Humanoide', tamanho: 'Pequeno', nd: '1/4', ca: 13, pvMax: 7, pvAtual: 7,
  deslocamento: '9 m', atributos: { for: 8, des: 14, con: 10, int: 10, sab: 8, car: 8 },
  tracos: '', acoes: [], taticas: '', conhecimento: 'completo',
}
const ogro = { ...goblin, id: 'm2', nome: 'Ogro', tamanho: 'Grande' }
const ficha = {
  id: 'c1', nome: 'Thorn', nivel: 3, atributos: { for: 16, des: 12, con: 14, int: 8, sab: 10, car: 10 },
  classeArmaduraManual: 17, armaduraEquipada: '', escudoEquipado: false, talentos: [],
  salvaguardasProficientes: [], periciasProficientes: [], periciasExpertise: [],
  pvMax: 30, pvAtual: 30, iniciativaBonus: 0,
}

// ---------------------------------------------------------------------------
console.log('Entrar na cena')

const tres = combatentesDeMonstro(goblin, 3)
checar('quem entra na batalha já tem lugar no mapa',
  tres.every((c) => typeof c.x === 'number' && typeof c.y === 'number'),
  JSON.stringify(tres.map((c) => [c.x, c.y])))

// Empilhar quatro no mesmo ponto obrigaria a arrastar os quatro para clicar
// em qualquer um.
const pontos = new Set(tres.map((c) => `${c.x},${c.y}`))
checar('e não entram empilhados', pontos.size === 3, [...pontos].join(' | '))

const heroi = combatenteDePersonagem(ficha)
checar('o personagem também entra posicionado', typeof heroi.x === 'number')
checar('e em canto oposto ao dos inimigos', heroi.x < tres[0].x, `${heroi.x} vs ${tres[0].x}`)

// O tamanho vem da ficha da criatura: um ogro ocupa mais quadrado.
checar('Pequeno ocupa 1 quadrado', combatentesDeMonstro(goblin, 1)[0].tamanho === 1)
checar('Grande ocupa 2', combatentesDeMonstro(ogro, 1)[0].tamanho === 2)
checar('Colossal ocupa 4', quadradosDoTamanho('Colossal') === 4)
checar('tamanho desconhecido vale 1', quadradosDoTamanho('') === 1)

// `jaNaCena` evita que o segundo grupo caia por cima do primeiro.
const segundoGrupo = combatentesDeMonstro(goblin, 2, 3)
checar('o segundo grupo não cai sobre o primeiro',
  !tres.some((a) => segundoGrupo.some((b) => a.x === b.x && a.y === b.y)))

// ---------------------------------------------------------------------------
console.log('A criatura é uma só')

const c = tres[0]
const token = tokenDeCombatente(c)
// É o mesmo id que faz arrastar no mapa e tirar PV na lista mexerem na mesma
// criatura. Se os ids divergirem, voltamos a ter dois cadastros.
checar('o token tem o id do combatente', token.id === c.id)
checar('e o nome', token.nome === c.nome)
checar('e o tamanho', token.tamanho === c.tamanho)
checar('inimigo nasce com anel vermelho', token.cor === '#f87171')
checar('aliado nasce com anel verde', tokenDeCombatente(heroi).cor === '#34d399')

const semLugar = { ...c, x: undefined, y: undefined, tamanho: undefined, cor: undefined }
const tokenSemLugar = tokenDeCombatente(semLugar)
checar('combatente antigo, sem lugar, cai no centro',
  tokenSemLugar.x === 0.5 && tokenSemLugar.y === 0.5)
checar('e com tamanho 1', tokenSemLugar.tamanho === 1)

const movido = moverCombatente([c, heroi], c.id, 0.3, 0.7)
checar('mover mexe em quem foi movido', movido[0].x === 0.3 && movido[0].y === 0.7)
checar('e não mexe no resto', movido[1].x === heroi.x)
checar('mover um id que não existe não quebra',
  moverCombatente([c], 'nada', 0.1, 0.1)[0].x === c.x)

// Portas, baús e marcações continuam na cena: não entram na iniciativa.
const barril = {
  id: 'o1', nome: 'Barril', imagemUrl: '', imagemJogadorUrl: '', origem: 'objeto',
  x: 0.9, y: 0.9, tamanho: 1, cor: '#888', oculto: false, conhecimento: 'completo',
}
const batalha = {
  updatedAt: 1, nome: 'x', rodada: 1, turnoIndex: 0, emAndamento: true,
  combatentes: [c, heroi],
}
const naCena = tokensDaCena(batalha, [barril])
checar('a cena mostra criaturas e objetos juntos', naCena.length === 3)
checar('e o objeto continua sendo objeto',
  naCena.find((t) => t.id === 'o1')?.origem === 'objeto')

// Um token de criatura sobrando de uma cena antiga não pode virar um segundo
// cadastro da mesma criatura.
const tokenVelhoDeCriatura = { ...barril, id: 'velho', origem: 'inimigo', nome: 'Goblin' }
checar('token antigo de criatura não é redesenhado pela cena',
  tokensDaCena(batalha, [barril, tokenVelhoDeCriatura]).length === 3)

// ---------------------------------------------------------------------------
console.log('O que fica fora de cena')

// `nomeOculto` mostra "???" — já revela que ALGO está ali. `oculto` é a
// emboscada que ainda não saltou: não pode nem ocupar uma linha na iniciativa.
const emboscada = { ...c, id: 'amb', nome: 'SEGREDO-ASSASSINO', oculto: true }
const publicada = projetarBatalha({ ...batalha, combatentes: [c, heroi, emboscada] })

checar('o oculto some da lista publicada', publicada.combatentes.length === 2)
checar('e o nome dele não vaza', !JSON.stringify(publicada).includes('SEGREDO-ASSASSINO'))
checar('quem está em cena continua', publicada.combatentes.some((x) => x.id === heroi.id))

// A posição PRECISA sair: é ela que desenha o token na tela do jogador.
checar('a posição de quem está em cena vai junto',
  typeof publicada.combatentes[0].x === 'number')

// E o oculto não pode nem entrar na contagem de turnos que o grupo vê.
checar('o oculto não ocupa lugar na ordem',
  ordenar(publicada.combatentes).length === 2)

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de cena falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de cena passaram`)
