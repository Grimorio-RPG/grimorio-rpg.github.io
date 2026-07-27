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
const saidaFeatures = join(dir, 'features.js')
// --bundle: estes módulos puxam os catálogos de regras, que são dados puros —
// nada de DOM, então rodam no Node sem adaptação.
execSync(`npx esbuild src/lib/calc.ts --bundle --outfile=${saida} --format=esm --log-level=error`)
execSync(
  `npx esbuild src/lib/features.ts --bundle --outfile=${saidaFeatures} --format=esm --log-level=error`,
)

const { armorClass, armorClassDetalhe } = await import(pathToFileURL(saida).href)
const {
  ataquesPorAcao,
  dadosDeAtaqueFurtivo,
  deslocamentoEfetivo,
  escolhasDoNivel,
  escolhasPendentes,
  manobrasDevidas,
  tracosDoPersonagem,
  tracosGanhosNoNivel,
} = await import(pathToFileURL(saidaFeatures).href)

let falhas = 0
let testes = 0

function checar(nome, obtido, esperado) {
  testes++
  if (obtido === esperado) return
  falhas++
  console.error(`  ✗ ${nome}\n      esperado: ${esperado}\n      obtido:   ${obtido}`)
}

function ficha(p = {}) {
  return {
    classe: '',
    subclasse: '',
    especie: '',
    antecedente: '',
    nivel: 1,
    deslocamento: 9,
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

// ---------------------------------------------------------------------------
console.log('\nTraços de classe')

// Ataque Extra: os traços trazem o total, então não podem se somar.
checar('Guerreiro 1 ataca uma vez', ataquesPorAcao(ficha({ classe: 'Guerreiro', nivel: 1 })), 1)
checar('Guerreiro 5 ataca duas vezes', ataquesPorAcao(ficha({ classe: 'Guerreiro', nivel: 5 })), 2)
checar('Guerreiro 11 ataca três (não cinco)', ataquesPorAcao(ficha({ classe: 'Guerreiro', nivel: 11 })), 3)
checar('Guerreiro 20 ataca quatro', ataquesPorAcao(ficha({ classe: 'Guerreiro', nivel: 20 })), 4)
checar('Mago 11 continua com um ataque', ataquesPorAcao(ficha({ classe: 'Mago', nivel: 11 })), 1)

// Ataque Furtivo: 1d6 no 1, +1d6 a cada dois níveis.
checar('Ladino 1: 1d6', dadosDeAtaqueFurtivo(ficha({ classe: 'Ladino', nivel: 1 })), 1)
checar('Ladino 5: 3d6', dadosDeAtaqueFurtivo(ficha({ classe: 'Ladino', nivel: 5 })), 3)
checar('Ladino 20: 10d6', dadosDeAtaqueFurtivo(ficha({ classe: 'Ladino', nivel: 20 })), 10)
checar('quem não é Ladino não tem', dadosDeAtaqueFurtivo(ficha({ classe: 'Guerreiro', nivel: 20 })), 0)

// Movimento sem Armadura
const monge10 = ficha({ classe: 'Monge', nivel: 10 })
checar('Monge 10 anda 15 m', deslocamentoEfetivo(monge10), 15)
checar('Monge de armadura perde o bônus', deslocamentoEfetivo({ ...monge10, armaduraEquipada: 'Couro' }), 9)
checar('Bárbaro 5 anda 12 m', deslocamentoEfetivo(ficha({ classe: 'Bárbaro', nivel: 5 })), 12)

// Escolhas por nível — o "não apareceu pra ele"
const escolhasGuerreiro = escolhasDoNivel(ficha({ classe: 'Guerreiro', nivel: 6 }))
checar(
  'Guerreiro 6 tem estilo de luta na lista',
  escolhasGuerreiro.some((e) => e.oque === 'estiloDeLuta'),
  true,
)
checar(
  'Guerreiro 6 já teve ASI no 4 e no 6',
  escolhasGuerreiro.filter((e) => e.oque === 'talento').length,
  2,
)
checar(
  'Mago 6 teve só um ASI',
  escolhasDoNivel(ficha({ classe: 'Mago', nivel: 6 })).filter((e) => e.oque === 'talento').length,
  1,
)
checar(
  'subclasse aparece no nível 3',
  escolhasDoNivel(ficha({ classe: 'Ladino', nivel: 3 })).some((e) => e.oque === 'subclasse'),
  true,
)
checar(
  'nível 2 ainda não pede subclasse',
  escolhasDoNivel(ficha({ classe: 'Ladino', nivel: 2 })).some((e) => e.oque === 'subclasse'),
  false,
)

// Nenhum traço pode vazar de um nível que a pessoa ainda não alcançou.
checar(
  'nada acima do nível atual',
  tracosDoPersonagem(ficha({ classe: 'Guerreiro', nivel: 4 })).every((t) => t.nivel <= 4),
  true,
)

// ---------------------------------------------------------------------------
console.log('\nSubclasse, espécie e escolhas')

const mestreDeBatalha = ficha({
  classe: 'Guerreiro',
  subclasse: 'Mestre de Batalha (Battle Master)',
  nivel: 3,
})

// O caso literal do relato: "pra minha subclasse tive que fazer manualmente".
checar(
  'Mestre de Batalha 3 tem as Manobras na lista',
  tracosDoPersonagem(mestreDeBatalha).some((t) => t.nome === 'Manobras'),
  true,
)
checar('Mestre de Batalha 3 deve 4 manobras', manobrasDevidas(mestreDeBatalha), 4)
checar('Mestre de Batalha 7 deve 6', manobrasDevidas({ ...mestreDeBatalha, nivel: 7 }), 6)
checar('Mestre de Batalha 15 deve 10', manobrasDevidas({ ...mestreDeBatalha, nivel: 15 }), 10)
checar('Campeão não deve manobra nenhuma', manobrasDevidas({ ...mestreDeBatalha, subclasse: 'Campeão (Champion)' }), 0)

// Sem manobras escolhidas, a ficha cobra; com as quatro, para de cobrar.
checar(
  'cobra as manobras que faltam',
  escolhasPendentes(mestreDeBatalha).some((e) => e.oque === 'manobra'),
  true,
)
checar(
  'para de cobrar quando estão completas',
  escolhasPendentes({ ...mestreDeBatalha, manobras: ['Aparar', 'Resposta', 'Ataque Rasteira', 'Ataque Preciso'] })
    .some((e) => e.oque === 'manobra'),
  false,
)

// Traço de subclasse não pode aparecer para quem não a escolheu.
checar(
  'sem subclasse, nenhum traço de subclasse',
  tracosDoPersonagem(ficha({ classe: 'Guerreiro', nivel: 10 })).some((t) => t.origem === 'subclasse'),
  false,
)
checar(
  'subclasse não catalogada não quebra a ficha',
  tracosDoPersonagem({ ...mestreDeBatalha, subclasse: 'Inventada (Made Up)' }).length > 0,
  true,
)

// Espécie entra pelo mesmo caminho e respeita o nível.
const draconato = ficha({ classe: 'Guerreiro', especie: 'Draconato', nivel: 1 })
checar(
  'Draconato 1 tem sopro',
  tracosDoPersonagem(draconato).some((t) => t.nome === 'Sopro'),
  true,
)
checar(
  'Draconato 1 ainda não tem Voo Dracônico',
  tracosDoPersonagem(draconato).some((t) => t.nome === 'Voo Dracônico'),
  false,
)
checar(
  'Draconato 5 já tem Voo Dracônico',
  tracosDoPersonagem({ ...draconato, nivel: 5 }).some((t) => t.nome === 'Voo Dracônico'),
  true,
)
checar(
  'origem do traço é marcada',
  tracosDoPersonagem(draconato).find((t) => t.nome === 'Sopro').origem,
  'especie',
)

// O que o modal de level-up mostra: só o nível alvo, nada antes nem depois.
const ganhos = tracosGanhosNoNivel(mestreDeBatalha, 3)
checar('level-up mostra só o nível alvo', ganhos.every((t) => t.nivel === 3), true)
checar(
  'level-up marca a escolha de manobras',
  ganhos.some((t) => t.efeito?.tipo === 'escolha' && t.efeito.oque === 'manobra'),
  true,
)

console.log('')
if (falhas > 0) {
  console.error(`✗ ${falhas} de ${testes} verificações de regra falharam\n`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de regra passaram\n`)
