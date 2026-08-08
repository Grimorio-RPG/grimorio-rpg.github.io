// Verifica a volta: o que o jogador mexe na própria ficha chega no combate.
//
// A ponte DM → ficha já existia. A volta não, e sem ela deixar o jogador agir
// seria PIOR do que não deixar: ele marcaria 12 de dano no celular e o DM
// continuaria vendo a barra cheia, com os dois certos de estarem olhando a
// verdade.
//
// O perigo aqui não é o dado errado — é o laço. O DM escreve na ficha, a
// assinatura acorda, a batalha se atualiza, o DM publica de novo, e assim para
// sempre. O que impede isso é `comEstadoDasFichas` devolver a MESMA batalha
// quando nada mudou, e é o que este arquivo mais insiste em conferir.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const guardado = new Map()
globalThis.localStorage = {
  getItem: (k) => (guardado.has(k) ? guardado.get(k) : null),
  setItem: (k, v) => guardado.set(k, String(v)),
  removeItem: (k) => guardado.delete(k),
}

const dir = mkdtempSync(join(tmpdir(), 'jogador-'))
execSync(
  `npx esbuild src/lib/battle.ts --bundle --outfile=${join(dir, 'battle.js')} ` +
    `--format=esm --log-level=error`,
)
const { comEstadoDasFichas, meusCombatentes, projetarBatalha, batalhaVazia } = await import(
  pathToFileURL(join(dir, 'battle.js')).href
)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const aliado = (id, refId, extra = {}) => ({
  id, refId, nome: `Herói ${id}`, origem: 'aliado',
  pvAtual: 30, pvMax: 30, ca: 15, iniciativa: 12, condicoes: [],
  x: 0, y: 0, ...extra,
})
const inimigo = (id, extra = {}) => ({
  id, refId: `m-${id}`, nome: 'Goblin', origem: 'inimigo',
  pvAtual: 7, pvMax: 7, ca: 13, iniciativa: 10, condicoes: [],
  x: 0, y: 0, ...extra,
})

const BATALHA = {
  ...batalhaVazia(),
  emAndamento: true,
  combatentes: [aliado('c1', 'ficha-1'), aliado('c2', 'ficha-2'), inimigo('g1')],
}

// ---------------------------------------------------------------------------
console.log('O que o jogador mexeu chega no combate')

const comDano = comEstadoDasFichas(BATALHA, [
  { id: 'ficha-1', pvAtual: 18, condicoes: [] },
])
checar('o PV da ficha vira o PV do combatente',
  comDano.combatentes.find((c) => c.id === 'c1')?.pvAtual === 18,
  `deu ${comDano.combatentes.find((c) => c.id === 'c1')?.pvAtual}`)
checar('e quem não mexeu fica como estava',
  comDano.combatentes.find((c) => c.id === 'c2')?.pvAtual === 30)

const comCondicao = comEstadoDasFichas(BATALHA, [
  { id: 'ficha-1', pvAtual: 30, condicoes: ['Envenenado'] },
])
checar('a condição também atravessa',
  comCondicao.combatentes.find((c) => c.id === 'c1')?.condicoes.includes('Envenenado'))

// Tirar a condição precisa atravessar tanto quanto pôr.
const comCondicaoTirada = comEstadoDasFichas(
  { ...BATALHA, combatentes: [aliado('c1', 'ficha-1', { condicoes: ['Envenenado'] })] },
  [{ id: 'ficha-1', pvAtual: 30, condicoes: [] }],
)
checar('e tirar a condição também',
  comCondicaoTirada.combatentes[0]?.condicoes.length === 0)

// ---------------------------------------------------------------------------
console.log('O que a ficha NÃO pode mexer')
//
// O resto do combatente é do DM. Iniciativa, posição no mapa e o que ele anotou
// não podem ser reescritos por quem abriu a própria ficha no celular.

const tentandoMais = comEstadoDasFichas(BATALHA, [
  { id: 'ficha-1', pvAtual: 18, condicoes: [], iniciativa: 99, x: 40, nome: 'Outro', pvMax: 999 },
])
const c1 = tentandoMais.combatentes.find((c) => c.id === 'c1')
checar('o combatente continua sendo ele mesmo', !!c1, 'a ficha trocou a identidade dele')
checar('a iniciativa continua do DM', c1?.iniciativa === 12)
checar('a posição no mapa também', c1?.x === 0)
checar('o nome também', c1?.nome === 'Herói c1')
checar('e o PV máximo também', c1?.pvMax === 30, `deu ${c1?.pvMax}`)

// Inimigo não vem de ficha nenhuma — nem por acidente de id igual.
const comInimigo = comEstadoDasFichas(BATALHA, [{ id: 'm-g1', pvAtual: 1, condicoes: [] }])
checar('inimigo não é tocado', comInimigo.combatentes.find((c) => c.id === 'g1')?.pvAtual === 7)
checar('e nada mudou, então é a mesma batalha', comInimigo === BATALHA)

// ---------------------------------------------------------------------------
console.log('O laço')
//
// O DM escreve na ficha, a assinatura acorda, isto roda. Se devolvesse um
// objeto novo mesmo sem diferença, a batalha seria salva e publicada de novo, e
// a assinatura acordaria outra vez — para sempre.

const iguais = [
  { id: 'ficha-1', pvAtual: 30, condicoes: [] },
  { id: 'ficha-2', pvAtual: 30, condicoes: [] },
]
checar('sem diferença, devolve a MESMA batalha',
  comEstadoDasFichas(BATALHA, iguais) === BATALHA)
checar('sem fichas, também', comEstadoDasFichas(BATALHA, []) === BATALHA)
checar('ficha que não está no combate não muda nada',
  comEstadoDasFichas(BATALHA, [{ id: 'ficha-9', pvAtual: 1, condicoes: [] }]) === BATALHA)

// E aplicar duas vezes o mesmo estado tem de estabilizar na primeira.
const passo1 = comEstadoDasFichas(BATALHA, [{ id: 'ficha-1', pvAtual: 18, condicoes: ['Caído'] }])
const passo2 = comEstadoDasFichas(passo1, [{ id: 'ficha-1', pvAtual: 18, condicoes: ['Caído'] }])
checar('aplicar de novo o mesmo estado estabiliza', passo2 === passo1)

// A ordem das condições não pode contar como diferença.
//
// O teste é a IDENTIDADE do objeto, e não a contagem: contar duas condições
// daria certo mesmo com a batalha recriada a cada chamada — que é justamente o
// laço que este arquivo existe para impedir. Foi assim que a primeira versão
// desta checagem passou por uma sabotagem que deveria ter pegado.
const comAsDuas = {
  ...BATALHA,
  combatentes: [aliado('c1', 'ficha-1', { condicoes: ['Caído', 'Envenenado'] })],
}
const trocado = comEstadoDasFichas(comAsDuas, [
  { id: 'ficha-1', pvAtual: 30, condicoes: ['Envenenado', 'Caído'] },
])
checar('a ordem das condições não conta como mudança', trocado === comAsDuas)

// ---------------------------------------------------------------------------
console.log('Quais combatentes são meus')

const meus = meusCombatentes(BATALHA, ['ficha-1'])
checar('acha o meu', meus.length === 1 && meus[0].id === 'c1')
checar('e não o do colega', !meus.some((c) => c.id === 'c2'))
checar('sem ficha nenhuma, nada é meu', meusCombatentes(BATALHA, []).length === 0)
checar('inimigo nunca é meu',
  meusCombatentes(BATALHA, ['m-g1']).length === 0)
// Duas fichas na mesma mesa: cada um vê a sua.
checar('duas fichas minhas, dois combatentes',
  meusCombatentes(BATALHA, ['ficha-1', 'ficha-2']).length === 2)

// ---------------------------------------------------------------------------
console.log('A projeção continua guardando o segredo')
//
// O jogador só consegue agir porque o combatente dele atravessa com `refId`. O
// que não pode é o inimigo atravessar com o PV real junto.

const publicada = projetarBatalha(BATALHA)
checar('o aliado mantém o refId, senão o jogador não se acha',
  publicada.combatentes.find((c) => c.id === 'c1')?.refId === 'ficha-1')
checar('e o PV do inimigo continua censurado',
  publicada.combatentes.find((c) => c.id === 'g1')?.pvAtual !== 7,
  `veio ${publicada.combatentes.find((c) => c.id === 'g1')?.pvAtual}`)

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações do jogador agindo falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações do jogador agindo passaram`)
