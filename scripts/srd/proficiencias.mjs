// Lê do SRD com o que cada classe sabe lutar e o que sabe vestir.
//
// A ficha tinha um campo de texto livre chamado "Proficiências (armas,
// armaduras, ferramentas)". Ninguém preenchia, e quando preenchia não
// acontecia nada: o app somava o bônus de proficiência em TODA arma, e deixava
// o mago vestir armadura de placas sem um pio. Proficiência é a regra que
// decide se o número na ficha está certo, e ela morava num campo de anotação.
//
// A fonte é o quadro "Core <Classe> Traits" de cada página de classe, que traz
// "Weapon Proficiencies", "Armor Training" e "Tool Proficiencies" com uma
// redação regular nas doze classes.
//
// Uso:
//   npm i --no-save pdfjs-dist@4
//   node scripts/srd/srd.mjs 26 82 classes.txt
//   node scripts/srd/proficiencias.mjs classes.txt
//   npm i --no-save pdfjs-dist@^3.11.174
//
// SRD 5.2.1, Creative Commons Attribution 4.0.

import { readFileSync, writeFileSync } from 'node:fs'

const bruto = readFileSync(process.argv[2], 'utf8')

const CLASSES = {
  Barbarian: 'Bárbaro', Bard: 'Bardo', Cleric: 'Clérigo', Druid: 'Druida',
  Fighter: 'Guerreiro', Monk: 'Monge', Paladin: 'Paladino', Ranger: 'Patrulheiro',
  Rogue: 'Ladino', Sorcerer: 'Feiticeiro', Warlock: 'Bruxo', Wizard: 'Mago',
}

// Os rótulos do quadro. Servem para saber onde um bloco termina: o texto quebra
// em três linhas e não há pontuação nenhuma separando um campo do outro.
const ROTULOS = [
  'Primary Ability', 'Hit Point Die', 'Saving Throw', 'Skill Proficiencies',
  'Weapon Proficiencies', 'Tool Proficiencies', 'Armor Training',
  'Starting Equipment', 'Becoming a',
]

const linhas = bruto.split('\n')

/** O texto de um campo do quadro, já juntado e sem a hifenização do PDF. */
function campo(inicio, rotulo) {
  let i = inicio
  while (i < linhas.length && !linhas[i].startsWith(rotulo)) i++
  if (i >= linhas.length) return null
  let texto = linhas[i].slice(rotulo.length)
  for (let j = i + 1; j < linhas.length; j++) {
    const l = linhas[j]
    if (ROTULOS.some((r) => l.startsWith(r))) break
    if (!l.trim()) break
    texto += ' ' + l
  }
  // "Heavy ar-\nmor" vira "Heavy armor"; o resto vira espaço simples.
  return texto.replace(/(\w)-\s+(\w)/g, '$1$2').replace(/\s+/g, ' ').trim()
}

/**
 * As armas.
 *
 * Monge e Ladino são o caso que obriga a guardar mais do que dois sins: eles
 * têm "Martial weapons that have the Light property" e "…the Finesse or Light
 * property". Tratar isso como "marciais" daria ao ladino a espada grande, e
 * tratar como "só simples" tiraria dele o florete — que é a arma do ladino.
 */
function armasDe(texto) {
  const simples = /Simple weapons|Simple and Martial/.test(texto)
  const propriedades = []
  if (/Finesse/.test(texto)) propriedades.push('Acuidade')
  if (/that have the[^.]*\bLight\b/.test(texto)) propriedades.push('Leve')
  const marciais = /Martial/.test(texto) && propriedades.length === 0
  return { simples, marciais, propriedades }
}

/** As armaduras. "None" existe e é diferente de não ter linha nenhuma. */
function armadurasDe(texto) {
  if (!texto || /^None\b/.test(texto)) {
    return { leve: false, media: false, pesada: false, escudo: false }
  }
  return {
    leve: /\bLight\b/.test(texto),
    media: /\bMedium\b/.test(texto),
    pesada: /\bHeavy\b/.test(texto),
    escudo: /Shields?\b/.test(texto),
  }
}

const achadas = []
for (const [en, pt] of Object.entries(CLASSES)) {
  const marca = `Core ${en} Traits`
  const inicio = linhas.findIndex((l) => l.trim() === marca)
  if (inicio < 0) {
    console.error(`!! não achei "${marca}"`)
    continue
  }
  const armas = campo(inicio, 'Weapon Proficiencies')
  const armaduras = campo(inicio, 'Armor Training')
  const ferramentas = campo(inicio, 'Tool Proficiencies')
  if (!armas) {
    console.error(`!! ${pt} sem linha de armas`)
    continue
  }
  achadas.push({ pt, en, armas: armasDe(armas), armaduras: armadurasDe(armaduras), ferramentas, cru: { armas, armaduras } })
}

const escrever = (a) =>
  `{ simples: ${a.simples}, marciais: ${a.marciais}, propriedades: [${a.propriedades.map((p) => `'${p}'`).join(', ')}] }`
const escreverArm = (a) =>
  `{ leve: ${a.leve}, media: ${a.media}, pesada: ${a.pesada}, escudo: ${a.escudo} }`

const corpo = achadas
  .map(
    (c) =>
      `  ${JSON.stringify(c.pt)}: {\n` +
      `    armas: ${escrever(c.armas)},\n` +
      `    armaduras: ${escreverArm(c.armaduras)},\n` +
      (c.ferramentas ? `    ferramentas: ${JSON.stringify(c.ferramentas)},\n` : '') +
      `  },`,
  )
  .join('\n')

writeFileSync(
  'src/data/srd/proficiencias-srd.ts',
  `// GERADO por scripts/srd/proficiencias.mjs — não edite à mão.
//
// O que cada classe sabe lutar e vestir, do quadro "Core <Classe> Traits" do
// SRD. Antes isto era um campo de texto livre na ficha que ninguém lia — nem a
// pessoa nem o app.
//
// SRD 5.2.1, Creative Commons Attribution 4.0.

import type { ProficienciasDeClasse } from '../../lib/proficiencias'

export const PROFICIENCIAS_SRD: Record<string, ProficienciasDeClasse> = {
${corpo}
}
`,
)

console.log(`${achadas.length} classes:`)
for (const c of achadas) {
  const arm = Object.entries(c.armaduras).filter(([, v]) => v).map(([k]) => k).join('+') || 'nenhuma'
  const w = c.armas.marciais ? 'simples+marciais' : c.armas.propriedades.length
    ? `simples+marciais(${c.armas.propriedades.join('/')})`
    : 'simples'
  console.log(`  ${c.pt.padEnd(12)} ${w.padEnd(28)} ${arm}`)
}
