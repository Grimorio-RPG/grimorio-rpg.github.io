// Verifica os cálculos de regra da ficha.
//
// Rode com: npm run verificar-regras
//
// Nasceu de um relato real: a CA da ficha saía 16 onde o D&D Beyond dava 17,
// porque o estilo de luta Defesa não entrava na conta. Um número errado aqui é
// pior que uma tela feia — a pessoa joga a sessão inteira com a defesa errada.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'regras-'))
const saida = join(dir, 'calc.js')
// --bundle: calc.ts puxa os catálogos de regras e equipamento, que são dados
// puros — nada de DOM, então roda no Node sem adaptação.
execSync(`npx esbuild src/lib/calc.ts --bundle --outfile=${saida} --format=esm --log-level=error`)

const { armorClass, armorClassDetalhe } = await import(pathToFileURL(saida).href)

let falhas = 0
let testes = 0

function checar(nome, obtido, esperado) {
  testes++
  if (obtido === esperado) return
  falhas++
  console.error(`  ✗ ${nome}\n      esperado: ${esperado}\n      obtido:   ${obtido}`)
}

/** Ficha mínima: só o que a CA consulta. */
function ficha(p = {}) {
  return {
    classe: '',
    atributos: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
    classeArmaduraManual: null,
    armaduraEquipada: '',
    escudoEquipado: false,
    talentos: [],
    ...p,
  }
}

console.log('\nClasse de Armadura')

// --- O caso que gerou tudo isto -------------------------------------------
// Guerreiro de Cota de Malha (16, sem DES) com o estilo Defesa: 17, não 16.
const guerreiro = ficha({
  classe: 'Guerreiro',
  atributos: { for: 16, des: 12, con: 14, int: 10, sab: 10, car: 10 },
  armaduraEquipada: 'Cota de Malha',
  talentos: ['Defesa'],
})
checar('Cota de Malha + Defesa', armorClass(guerreiro), 17)
checar('Cota de Malha sem Defesa', armorClass({ ...guerreiro, talentos: [] }), 16)
checar(
  'a ficha explica de onde veio o +1',
  armorClassDetalhe(guerreiro).includes('(Defesa)'),
  true,
)

// Defesa não vale sem armadura — é a condição da regra.
checar(
  'Defesa não conta sem armadura',
  armorClass(ficha({ classe: 'Guerreiro', atributos: { for: 10, des: 14, con: 10, int: 10, sab: 10, car: 10 }, talentos: ['Defesa'] })),
  12,
)

// --- Armadura + destreza ---------------------------------------------------
checar(
  'armadura média limita a DES em +2',
  armorClass(ficha({ armaduraEquipada: 'Peitoral', atributos: { for: 10, des: 18, con: 10, int: 10, sab: 10, car: 10 } })),
  16, // 14 + 2 (e não 14 + 4)
)
checar(
  'armadura pesada ignora a DES',
  armorClass(ficha({ armaduraEquipada: 'Placas', atributos: { for: 10, des: 18, con: 10, int: 10, sab: 10, car: 10 } })),
  18,
)
checar('escudo soma 2', armorClass(ficha({ armaduraEquipada: 'Placas', escudoEquipado: true })), 20)

// --- Defesa sem Armadura ---------------------------------------------------
const barbaro = ficha({
  classe: 'Bárbaro',
  atributos: { for: 16, des: 14, con: 16, int: 10, sab: 10, car: 10 },
})
checar('Bárbaro sem armadura: 10 + DES + CON', armorClass(barbaro), 15)
checar('Bárbaro mantém a Defesa sem Armadura com escudo', armorClass({ ...barbaro, escudoEquipado: true }), 17)
checar(
  'Bárbaro de armadura usa a armadura',
  armorClass({ ...barbaro, armaduraEquipada: 'Cota de Malha' }),
  16,
)

const monge = ficha({
  classe: 'Monge',
  atributos: { for: 10, des: 16, con: 12, int: 10, sab: 16, car: 10 },
})
checar('Monge sem armadura: 10 + DES + SAB', armorClass(monge), 16)
// O Monge, diferente do Bárbaro, perde o traço ao usar escudo: 10 + DES + 2.
checar('Monge perde a Defesa sem Armadura com escudo', armorClass({ ...monge, escudoEquipado: true }), 15)

// --- Valor manual ----------------------------------------------------------
checar(
  'valor manual vence tudo',
  armorClass({ ...guerreiro, classeArmaduraManual: 21 }),
  21,
)

console.log('')
if (falhas > 0) {
  console.error(`✗ ${falhas} de ${testes} verificações de regra falharam\n`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de regra passaram\n`)
