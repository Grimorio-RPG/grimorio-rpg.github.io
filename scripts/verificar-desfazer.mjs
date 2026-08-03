// Verifica o desfazer do combate.
//
// Errar o alvo ou o número acontece toda sessão. O que este teste protege é
// menos o "voltar" e mais duas decisões que sustentam ele: guardar só o que
// mudou (senão a sincronização carrega dez cópias das imagens a cada golpe) e
// nunca publicar a pilha (ela guarda o PV anterior exato de cada criatura).

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'desf-'))
const compilar = (entrada, saida) => {
  const alvo = join(dir, saida)
  execSync(`npx esbuild ${entrada} --bundle --outfile=${alvo} --format=esm --log-level=error`)
  return import(pathToFileURL(alvo).href)
}

const { alteracaoDe, empilhar, desfazerUltimo, proximoADesfazer, TETO_DESFAZER } =
  await compilar('src/lib/desfazer.ts', 'desfazer.js')
const { projetarBatalha } = await compilar('src/lib/battle.ts', 'battle.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const goblin = {
  id: 'g1', origem: 'inimigo', refId: 'm1', nome: 'Goblin 2',
  imagemUrl: 'FOTO-GRANDE-EM-BASE64', imagemJogadorUrl: '', conhecimento: 'completo',
  ca: 13, pvMax: 7, pvAtual: 7, iniciativa: 12, iniciativaMod: 2,
  nomeOculto: false, condicoes: [], x: 0.2, y: 0.3,
}
const heroi = {
  id: 'h1', origem: 'aliado', refId: 'c1', nome: 'Thorn',
  imagemUrl: '', imagemJogadorUrl: '', conhecimento: 'completo',
  ca: 17, pvMax: 30, pvAtual: 30, iniciativa: 15, iniciativaMod: 1,
  nomeOculto: false, condicoes: [],
}
const batalha = {
  updatedAt: 1, nome: 'x', rodada: 2, turnoIndex: 0, emAndamento: true,
  combatentes: [goblin, heroi],
}

// ---------------------------------------------------------------------------
console.log('O que entra num passo')

const dano = alteracaoDe(goblin, { pvAtual: 0 })
checar('guarda o valor ANTERIOR, não o novo', dano.campos.pvAtual === 7, JSON.stringify(dano))
checar('e a qual criatura pertence', dano.id === 'g1')

checar('mudança para o mesmo valor não vira passo', alteracaoDe(goblin, { pvAtual: 7 }) === null)

// Arrastar um token gera uma atualização por quadro do movimento. Se posição
// entrasse, dois segundos de arrasto enterrariam o golpe sob dezenas de passos.
checar('mover não vira passo', alteracaoDe(goblin, { x: 0.9, y: 0.1 }) === null)

const misto = alteracaoDe(goblin, { pvAtual: 3, x: 0.9, condicoes: ['Caído'] })
checar('num patch misto, só os campos que importam entram',
  misto.campos.pvAtual === 7 && Array.isArray(misto.campos.condicoes) && misto.campos.x === undefined,
  JSON.stringify(misto.campos))

// A razão de guardar só o delta: a imagem viaja no combatente.
const passoJson = JSON.stringify(empilhar(batalha, 'dano', [dano]))
checar('o passo não carrega a imagem junto',
  !passoJson.includes('FOTO-GRANDE-EM-BASE64'),
  passoJson.slice(0, 120))
checar('e é pequeno o bastante para sincronizar', passoJson.length < 400, `${passoJson.length} bytes`)

// ---------------------------------------------------------------------------
console.log('Voltar')

let b = { ...batalha, desfazer: empilhar(batalha, '4 de dano em Goblin 2', [alteracaoDe(goblin, { pvAtual: 3 })]) }
b = { ...b, combatentes: [{ ...goblin, pvAtual: 3 }, heroi] }

checar('o botão sabe o que vai desfazer',
  proximoADesfazer(b).descricao === '4 de dano em Goblin 2')

const voltou = desfazerUltimo(b)
checar('o PV volta ao que era', voltou.combatentes[0].pvAtual === 7)
checar('e o passo sai da pilha', voltou.desfazer.length === 0)
checar('quem não foi tocado fica como estava', voltou.combatentes[1].pvAtual === 30)

checar('sem nada para desfazer, devolve nulo', desfazerUltimo(batalha) === null)
checar('e o botão não aparece', proximoADesfazer(batalha) === null)

// Apagar a criatura errada era o único erro de combate sem volta.
const semGoblin = {
  ...batalha,
  combatentes: [heroi],
  desfazer: empilhar(batalha, 'Remoção de Goblin 2', [], [goblin]),
}
const devolvido = desfazerUltimo(semGoblin)
checar('a criatura removida volta', devolvido.combatentes.some((c) => c.id === 'g1'))
checar('e volta inteira', devolvido.combatentes.find((c) => c.id === 'g1').pvMax === 7)

// Desfazer duas vezes volta dois passos, na ordem certa.
let dois = { ...batalha }
dois = { ...dois, desfazer: empilhar(dois, 'primeiro', [alteracaoDe(goblin, { pvAtual: 5 })]) }
dois = { ...dois, combatentes: [{ ...goblin, pvAtual: 5 }, heroi] }
dois = { ...dois, desfazer: empilhar(dois, 'segundo', [alteracaoDe({ ...goblin, pvAtual: 5 }, { pvAtual: 1 })]) }
dois = { ...dois, combatentes: [{ ...goblin, pvAtual: 1 }, heroi] }

const um = desfazerUltimo(dois)
checar('o primeiro desfazer volta o último golpe', um.combatentes[0].pvAtual === 5)
const zero = desfazerUltimo({ ...dois, ...um })
checar('o segundo volta o anterior', zero.combatentes[0].pvAtual === 7)

// ---------------------------------------------------------------------------
console.log('Teto da pilha')

let cheia = { ...batalha }
for (let i = 0; i < TETO_DESFAZER + 8; i++) {
  cheia = { ...cheia, desfazer: empilhar(cheia, `passo ${i}`, [alteracaoDe(goblin, { pvAtual: i + 1 })]) }
}
checar('a pilha para de crescer', cheia.desfazer.length === TETO_DESFAZER, `${cheia.desfazer.length}`)
checar('e o que fica é o mais recente',
  proximoADesfazer(cheia).descricao === `passo ${TETO_DESFAZER + 7}`)

// ---------------------------------------------------------------------------
console.log('Censura')

// A pilha guarda o PV anterior EXATO. Publicá-la entregaria de bandeja o que a
// projeção esconde transformando vida em porcentagem — e ainda daria o
// histórico dos últimos dez golpes.
const publicada = projetarBatalha({
  ...batalha,
  combatentes: [{ ...goblin, pvAtual: 3 }, heroi],
  desfazer: empilhar(batalha, 'SEGREDO-PASSO', [alteracaoDe(goblin, { pvAtual: 3 })]),
})

checar('a pilha não é publicada', publicada.desfazer === undefined)
checar('nem em canto nenhum do JSON', !JSON.stringify(publicada).includes('SEGREDO-PASSO'))
// O 7 do PV cheio do goblin não pode escapar pela pilha: o grupo vê porcentagem.
checar('o PV anterior exato não vaza',
  !JSON.stringify(publicada.desfazer ?? null).includes('7'))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de desfazer falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de desfazer passaram`)
