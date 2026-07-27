// Verifica a leitura de bloco de estatísticas colado.
//
// O caso de teste é o Rukha, o mini boss real que motivou a funcionalidade,
// escrito como ele sai de um copiar/colar: colunas viram linhas, o modificador
// vem entre parênteses ao lado do valor, e as seções são cabeçalhos soltos.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'statblock-'))
const saida = join(dir, 'statblock.js')
execSync(`npx esbuild src/lib/statblock.ts --bundle --outfile=${saida} --format=esm --log-level=error`)
const { lerStatBlock } = await import(pathToFileURL(saida).href)

let falhas = 0
let testes = 0
function checar(nome, obtido, esperado) {
  testes++
  if (obtido === esperado) return
  falhas++
  console.error(`  ✗ ${nome}\n      esperado: ${esperado}\n      obtido:   ${obtido}`)
}

const RUKHA = `Rukha, o Sábio da Raiz
Humanoide Médio (orc), leal e mau

CA 15
(armadura de couro reforçada)
PV 52
(8d8 + 16)
Deslocamento
9 m
FOR     DES     CON     INT     SAB     CAR
14 (+2) 12 (+1) 14 (+2) 16 (+3) 15 (+2) 11 (+0)

Perícias: Arcana +5, Investigação +5, Medicina +4, Natureza +5, Percepção +4, Intuição +4
Sentidos: visão no escuro 18 m, percepção passiva 14
Idiomas: Comum, Orc, Goblin
ND 4 (1.100 XP)

CARACTERÍSTICAS
Mente Analítica. Rukha tem vantagem em testes de Inteligência (Investigação) e Sabedoria (Medicina).
Comando Clínico. Como ação bônus, Rukha escolhe um aliado a até 9 m que possa ouvi-lo.

AÇÕES
Lança-Cajado. Ataque corpo a corpo ou à distância com arma: +5 para atingir, alcance 1,5 m ou 6/18 m, um alvo. Dano: 7 (1d8 + 3) perfurante.
Frasco de Ácido. Ataque à distância com arma: +5 para atingir, alcance 6/18 m, um alvo. Dano: 10 (3d6) ácido.
Gás Entorpecente (Recarga 5–6). Rukha arremessa um frasco que explode numa nuvem de 3 m de raio.
Ativar Correntes. Rukha aciona um mecanismo próximo.

REAÇÃO
Diagnóstico Cruel. Quando uma criatura que Rukha possa ver a até 9 m sofre dano, ele pode identificar a lesão.
`

console.log('\nLeitura de stat block')
const { campos, reconhecidos } = lerStatBlock(RUKHA)

checar('nome', campos.nome, 'Rukha, o Sábio da Raiz')
checar('tamanho', campos.tamanho, 'Médio')
checar('tipo', campos.tipo, 'Humanoide (orc)')
checar('CA', campos.ca, 15)
checar('PV máximo', campos.pvMax, 52)
checar('PV atual acompanha o máximo', campos.pvAtual, 52)
checar('ND', campos.nd, '4')
checar('deslocamento', campos.deslocamento, '9 m')

// Atributos em duas linhas: o valor é 14, não o modificador +2.
checar('FOR', campos.atributos.for, 14)
checar('DES', campos.atributos.des, 12)
checar('CON', campos.atributos.con, 14)
checar('INT', campos.atributos.int, 16)
checar('SAB', campos.atributos.sab, 15)
checar('CAR', campos.atributos.car, 11)

// Ações: só as de baixo do cabeçalho AÇÕES, sem invadir a REAÇÃO.
checar('quantidade de ações', campos.acoes.length, 4)
checar('primeira ação', campos.acoes[0].nome, 'Lança-Cajado')
checar('ação com parênteses no nome', campos.acoes[2].nome, 'Gás Entorpecente (Recarga 5–6)')
checar(
  'a reação não virou ação',
  campos.acoes.some((a) => a.nome.includes('Diagnóstico')),
  false,
)
checar(
  'característica não virou ação',
  campos.acoes.some((a) => a.nome.includes('Mente Analítica')),
  false,
)
checar(
  'descrição da ação vem junto',
  campos.acoes[1].descricao.includes('3d6'),
  true,
)

// Perícias e idiomas não têm campo próprio: entram nos traços em vez de sumir.
checar('traços trazem as características', campos.tracos.includes('Mente Analítica'), true)
checar('traços trazem as perícias', campos.tracos.includes('Arcana +5'), true)
checar('traços trazem os idiomas', campos.tracos.includes('Comum, Orc, Goblin'), true)

// O que não foi reconhecido não pode ser inventado.
const vazio = lerStatBlock('Só um nome solto')
checar('sem CA no texto, não inventa CA', vazio.campos.ca, undefined)
checar('sem atributos, não inventa atributos', vazio.campos.atributos, undefined)
checar('nome ainda é lido', vazio.campos.nome, 'Só um nome solto')

checar('a tela sabe o que foi preenchido', reconhecidos.includes('atributos'), true)

console.log('')
if (falhas > 0) {
  console.error(`✗ ${falhas} de ${testes} verificações de leitura falharam\n`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de leitura passaram\n`)
