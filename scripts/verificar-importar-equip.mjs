// Verifica que o inventário importado do D&D Beyond vira equipamento.
//
// O PDF entrega linhas de texto em inglês. Elas caíam na mochila e paravam ali:
// quem importava a ficha tinha que recriar cada equipável à mão, item por item,
// com os efeitos. O sistema de equipamento existia e o caminho de entrada mais
// usado não alimentava ele.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'imp-'))
const compilar = (entrada, saida) => {
  const alvo = join(dir, saida)
  execSync(`npx esbuild ${entrada} --bundle --outfile=${alvo} --format=esm --log-level=error`)
  return import(pathToFileURL(alvo).href)
}

const { reconhecerEquipaveis, nomeNoCatalogo, DESTINOS } =
  await compilar('src/lib/reconhecerEquipamento.ts', 'rec.js')
const { ITENS_EQUIPAVEIS } = await compilar('src/data/itens-equipaveis.ts', 'cat.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const linha = (nome, qtd = 1) => ({ id: nome, nome, qtd, peso: 0, notas: '' })

// ---------------------------------------------------------------------------
console.log('A tabela aponta para itens que existem')
//
// Um destino escrito errado não quebra nada: o item some em silêncio e a pessoa
// acha que a arma dela não é equipável. Foi o que aconteceu com "Florete", que
// no catálogo se chama "Rapieira" — e só apareceu quando uma ficha de verdade
// foi importada.

const nomesDoCatalogo = new Set(ITENS_EQUIPAVEIS.map((i) => i.nome))
for (const destino of DESTINOS) {
  checar(`"${destino}" existe no catálogo`, nomesDoCatalogo.has(destino))
}

// ---------------------------------------------------------------------------
console.log('Reconhecer o nome')

checar('armadura em inglês', nomeNoCatalogo('Chain Mail') === 'Cota de Malha')
checar('arma em inglês', nomeNoCatalogo('Longsword') === 'Espada Longa')
checar('mágico em inglês', nomeNoCatalogo('Ring of Protection') === 'Anel de Proteção')
checar('em português também', nomeNoCatalogo('Cota de Malha') === 'Cota de Malha')

// A ordem da lista é o que decide: "studded leather" contém "leather".
checar('o mais específico vence o mais geral',
  nomeNoCatalogo('Studded Leather') === 'Couro Batido',
  `deu ${nomeNoCatalogo('Studded Leather')}`)
checar('e o geral continua achando o dele',
  nomeNoCatalogo('Leather Armor') === 'Couro')

// O PDF traz sujeira junto do nome.
checar('sufixo mágico não atrapalha', nomeNoCatalogo('Longsword +1') === 'Espada Longa')
checar('qualificador entre parênteses não atrapalha',
  nomeNoCatalogo('Shield (Wooden)') === 'Escudo')

checar('o que não é equipável não é reconhecido', nomeNoCatalogo('Hempen Rope (50 ft)') === null)
checar('nem uma poção', nomeNoCatalogo('Potion of Healing') === null)

// ---------------------------------------------------------------------------
console.log('Separar a mochila')

const inv = [
  linha('Chain Mail'),
  linha('Shield'),
  linha('Longsword +1'),
  linha('Hempen Rope (50 ft)'),
  linha('Rations (1 day)', 10),
  linha('Ring of Protection'),
]
const { equipamentos, inventario } = reconhecerEquipaveis(inv)

checar('os equipáveis saem da mochila', equipamentos.length === 4, `saíram ${equipamentos.length}`)
checar('e o resto continua nela', inventario.length === 2, `ficaram ${inventario.length}`)
checar('a corda ficou', inventario.some((i) => i.nome.includes('Rope')))
checar('as rações também', inventario.some((i) => i.nome.includes('Rations')))

// O nome que a pessoa vê é o do PDF: ela reconhece "Longsword +1" como o item
// dela, e "Espada Longa" genérica não.
const espada = equipamentos.find((e) => e.nome === 'Longsword +1')
checar('o nome importado é preservado', !!espada)
checar('mas o slot vem do catálogo', espada?.slot === 'maoPrincipal')

// O "+1" precisa virar bônus, senão é enfeite no nome.
const ataque = espada?.efeitos.find((e) => e.tipo === 'ataque')
const dano = espada?.efeitos.find((e) => e.tipo === 'dano')
checar('o +1 vira bônus de ataque', ataque?.valor === 1, JSON.stringify(espada?.efeitos))
checar('e de dano', dano?.valor === 1)

// Sem a arma base, o item importado nunca vira linha de ataque: a pessoa
// veste a espada e o painel de Ataques continua vazio.
checar('o item importado sabe qual arma é', espada?.arma === 'Espada Longa', `veio ${espada?.arma}`)
checar('e a armadura, qual armadura', cotaBase()?.armadura === 'Cota de Malha')

// Numa armadura, o +1 é CA e não ataque.
const { equipamentos: comArmadura } = reconhecerEquipaveis([linha('Plate Armor +1')])
const ca = comArmadura[0]?.efeitos.filter((e) => e.tipo === 'ca')
checar('numa armadura o +1 vira CA', ca?.some((e) => e.valor === 1), JSON.stringify(comArmadura[0]?.efeitos))
checar('e não vira ataque', !comArmadura[0]?.efeitos.some((e) => e.tipo === 'ataque'))

// A armadura importada precisa trazer a base, senão a CA não sai do lugar.
function cotaBase() {
  return equipamentos.find((e) => e.nome === 'Chain Mail')
}
const cota = cotaBase()
checar('a armadura traz a base de CA',
  cota?.efeitos.some((e) => e.tipo === 'caBase' && e.valor === 16),
  JSON.stringify(cota?.efeitos))

// O anel traz sintonia, que é a regra que a mesa mais esquece.
const anel = equipamentos.find((e) => e.nome === 'Ring of Protection')
checar('o mágico vem marcado como sintonia', anel?.sintonia === true)
checar('e não vem sintonizado sozinho', !anel?.sintonizado)

// ---------------------------------------------------------------------------
console.log('Nada entra vestido')
//
// O PDF não diz de forma confiável o que a pessoa está usando, e vestir por
// conta mudaria a CA dela sem aviso.

checar('nenhum item chega equipado', equipamentos.every((e) => !e.equipado))

// ---------------------------------------------------------------------------
console.log('Quantidade')

// Uma entrada por linha, com a quantidade junto. Dez dardos viravam dez linhas
// iguais e entulhavam a mochila — pior do que o caso que aquilo resolvia.
const { equipamentos: duas } = reconhecerEquipaveis([linha('Dagger', 2)])
checar('duas adagas viram UMA entrada', duas.length === 1, `viraram ${duas.length}`)
checar('com a quantidade junto', duas[0].qtd === 2)

const { equipamentos: dardos } = reconhecerEquipaveis([linha('Dart', 10)])
checar('dez dardos também', dardos.length === 1 && dardos[0].qtd === 10)

const { equipamentos: uma } = reconhecerEquipaveis([linha('Dagger')])
checar('uma peça não carrega quantidade', uma[0].qtd === undefined)

// ---------------------------------------------------------------------------
console.log('Sem nada')

const vazio = reconhecerEquipaveis([])
checar('inventário vazio não quebra', vazio.equipamentos.length === 0 && vazio.inventario.length === 0)
const sóTexto = reconhecerEquipaveis([linha('Hempen Rope')])
checar('inventário sem equipável devolve tudo', sóTexto.inventario.length === 1)

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de importação falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de importação passaram`)
