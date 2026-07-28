// Coerência do catálogo de classes, subclasses e escolhas.
//
// Nasceu de dois defeitos reais que passaram para a mesa:
//
//   1. o Guerreiro nível 1 recebia "Falta escolher: estilo de luta" e não havia
//      onde escolher — a escolha existia no dado e não na tela;
//   2. o número de manobras estava errado, e nada no código percebeu.
//
// O primeiro tipo é estrutural e este arquivo elimina: uma escolha sem seletor
// derruba o deploy. O segundo é factual — nenhum teste sabe o que está no livro,
// então aqui a defesa é garantir que cada informação exista, esteja no lugar e
// não se contradiga.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'catalogo-'))
const compilar = (entrada, nome) => {
  const saida = join(dir, nome)
  execSync(`npx esbuild ${entrada} --bundle --outfile=${saida} --format=esm --log-level=error`)
  return import(pathToFileURL(saida).href)
}

const { CLASSES } = await compilar('src/data/rules.ts', 'rules.js')
const { TRACOS_DE_CLASSE } = await compilar('src/data/features.ts', 'features.js')
const { TRACOS_DE_SUBCLASSE, MANOBRAS } = await compilar('src/data/subclasses.ts', 'subclasses.js')
const { INFO_SUBCLASSES } = await compilar('src/data/subclass-info.ts', 'subclass-info.js')
const { TRACOS_DE_ESPECIE } = await compilar('src/data/species.ts', 'species.js')
const { TALENTOS } = await compilar('src/data/feats.ts', 'feats.js')

let falhas = 0
let testes = 0
function checar(nome, ok) {
  testes++
  if (ok) return
  falhas++
  console.error(`  ✗ ${nome}`)
}

const nomesDeSubclasse = CLASSES.flatMap((c) => c.subclasses)

// ---------------------------------------------------------------------------
console.log('\nEscolhas têm onde ser feitas')

/**
 * Tipos de escolha que a interface sabe apresentar.
 *
 * Acrescentar um tipo aqui sem construir o seletor correspondente é o mesmo
 * defeito de novo — por isso a lista é explícita, e não derivada dos dados.
 */
const COM_SELETOR = new Set(['subclasse', 'estiloDeLuta', 'manobra', 'talento'])

const todosOsTracos = [
  ...Object.entries(TRACOS_DE_CLASSE).flatMap(([dono, ts]) => ts.map((t) => [dono, t])),
  ...Object.entries(TRACOS_DE_SUBCLASSE).flatMap(([dono, ts]) => ts.map((t) => [dono, t])),
  ...Object.entries(TRACOS_DE_ESPECIE).flatMap(([dono, ts]) => ts.map((t) => [dono, t])),
]

for (const [dono, t] of todosOsTracos) {
  if (t.efeito?.tipo !== 'escolha') continue
  checar(`${dono} · "${t.nome}" (nível ${t.nivel}): o app sabe apresentar "${t.efeito.oque}"`,
    COM_SELETOR.has(t.efeito.oque))
  checar(`${dono} · "${t.nome}": pede uma quantidade positiva`,
    Number.isInteger(t.efeito.quantidade) && t.efeito.quantidade > 0)
}

// Escolha de estilo de luta só faz sentido se houver estilos cadastrados.
const estilos = TALENTOS.filter((t) => t.categoria === 'Estilo de Luta')
checar('há estilos de luta no catálogo', estilos.length >= 8)
checar('há manobras no catálogo', MANOBRAS.length >= 15)

// ---------------------------------------------------------------------------
console.log('Toda subclasse está descrita')

for (const nome of nomesDeSubclasse) {
  const info = INFO_SUBCLASSES[nome]
  checar(`${nome}: tem descrição`, !!info)
  if (!info) continue
  checar(`${nome}: diz o que é`, info.resumo?.length > 20)
  checar(`${nome}: diz para quem serve`, info.bomSe?.length > 15)
  // O custo é o que evita a pessoa abandonar o personagem no nível 6.
  checar(`${nome}: diz o preço que cobra`, info.atencao?.length > 15)
}

// ---------------------------------------------------------------------------
console.log('Nomes batem entre os arquivos')

// Um nome com um acento diferente vira uma subclasse que não existe: o app não
// acha os traços e não avisa nada.
for (const chave of Object.keys(TRACOS_DE_SUBCLASSE)) {
  checar(`traços de "${chave}" pertencem a uma subclasse real`, nomesDeSubclasse.includes(chave))
}
// Toda subclasse precisa dos traços, não só da descrição: é neles que moram as
// escolhas. Sem isto, o Campeão nunca receberia o segundo estilo de luta.
for (const nome of nomesDeSubclasse) {
  checar(`${nome}: tem traços cadastrados`, (TRACOS_DE_SUBCLASSE[nome] ?? []).length > 0)
}
for (const chave of Object.keys(INFO_SUBCLASSES)) {
  checar(`descrição de "${chave}" pertence a uma subclasse real`, nomesDeSubclasse.includes(chave))
}

// ---------------------------------------------------------------------------
console.log('Toda classe tem progressão')

for (const c of CLASSES) {
  const tracos = TRACOS_DE_CLASSE[c.nome]
  checar(`${c.nome}: tem traços cadastrados`, Array.isArray(tracos) && tracos.length > 0)
  if (!tracos) continue

  checar(`${c.nome}: escolhe subclasse no nível 3`,
    tracos.some((t) => t.nivel === 3 && t.efeito?.oque === 'subclasse'))

  // Aumento de Atributo: 4, 8, 12, 16 e 19 valem para todas as classes.
  for (const nivel of [4, 8, 12, 16, 19]) {
    checar(`${c.nome}: tem Aumento de Atributo no ${nivel}`,
      tracos.some((t) => t.nivel === nivel && t.efeito?.oque === 'talento'))
  }

  checar(`${c.nome}: nenhum traço fora da faixa 1–20`,
    tracos.every((t) => t.nivel >= 1 && t.nivel <= 20))
  checar(`${c.nome}: todo traço tem nome e resumo`,
    tracos.every((t) => t.nome?.length > 2 && t.resumo?.length > 10))
}

for (const [nome, tracos] of Object.entries(TRACOS_DE_SUBCLASSE)) {
  checar(`${nome}: nenhum traço antes do nível 3`, tracos.every((t) => t.nivel >= 3))
  checar(`${nome}: nenhum traço acima do 20`, tracos.every((t) => t.nivel <= 20))
  checar(`${nome}: todo traço tem nome e resumo`,
    tracos.every((t) => t.nome?.length > 2 && t.resumo?.length > 10))
}

// ---------------------------------------------------------------------------
console.log('Espécies')

for (const [nome, tracos] of Object.entries(TRACOS_DE_ESPECIE)) {
  checar(`${nome}: tem ao menos um traço no nível 1`, tracos.some((t) => t.nivel === 1))
  checar(`${nome}: nenhum traço fora da faixa 1–20`,
    tracos.every((t) => t.nivel >= 1 && t.nivel <= 20))
}

console.log('')
if (falhas > 0) {
  console.error(`✗ ${falhas} de ${testes} verificações de catálogo falharam\n`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de catálogo passaram\n`)
