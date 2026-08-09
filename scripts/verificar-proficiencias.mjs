// Verifica o que a pessoa sabe empunhar e vestir — e o que isso muda na conta.
//
// A ficha tinha um campo de texto chamado "Proficiências (armas, armaduras,
// ferramentas)". Ninguém preenchia, e quando preenchia não acontecia nada: o
// app somava o bônus de proficiência em TODA arma que entrasse na mão, e
// deixava o mago vestir armadura de placas sem um pio.
//
// É o defeito de sempre — dado exibido e nunca consumido — numa forma que
// mente no número que mais importa. O bardo com espada grande ganhava um +3 que
// não é dele, e a ficha inteira continuava parecendo certa.
//
// Errar aqui é silencioso dos dois lados: dar proficiência a mais infla todo
// ataque do jogo, e tirar de menos tira o florete do ladino. Por isso as doze
// classes estão conferidas uma a uma contra o quadro do SRD.

import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'prof-'))
execSync(
  `npx esbuild src/lib/proficiencias.ts src/lib/weapons.ts src/data/equipment.ts --bundle --splitting --outdir=${dir} --format=esm --log-level=error`,
)
// O esbuild espelha as pastas quando as entradas vêm de diretórios diferentes:
// a base comum é `src`, então a saída é `lib/…` e `data/…`.
const carregar = (f) => import(pathToFileURL(join(dir, f)).href)
const { proficienciasDe, proficienteComArma, proficienteComArmadura, custoDeArmadura, emPalavras } =
  await carregar('lib/proficiencias.js')
const { ataqueDaArma } = await carregar('lib/weapons.js')
const { acharArma, acharArmadura } = await carregar('data/equipment.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const ficha = (extra = {}) => ({
  id: 'f1', nome: 'Alguém', classe: 'Mago', subclasse: '', nivel: 5,
  atributos: { for: 16, des: 14, con: 12, int: 16, sab: 10, car: 10 },
  talentos: [], equipamentos: [], exaustao: 0, proficienciasEquipamentos: '',
  ...extra,
})

// ---------------------------------------------------------------------------
console.log('O quadro do SRD, classe a classe')

// [classe, simples, marciais, propriedades, leve, media, pesada, escudo]
const QUADRO = [
  ['Bárbaro', true, true, [], true, true, false, true],
  ['Bardo', true, false, [], true, false, false, false],
  ['Bruxo', true, false, [], true, false, false, false],
  ['Clérigo', true, false, [], true, true, false, true],
  ['Druida', true, false, [], true, false, false, true],
  ['Feiticeiro', true, false, [], false, false, false, false],
  ['Guerreiro', true, true, [], true, true, true, true],
  ['Ladino', true, false, ['Acuidade', 'Leve'], true, false, false, false],
  ['Mago', true, false, [], false, false, false, false],
  ['Monge', true, false, ['Leve'], false, false, false, false],
  ['Paladino', true, true, [], true, true, true, true],
  ['Patrulheiro', true, true, [], true, true, false, true],
]
for (const [classe, simples, marciais, props, leve, media, pesada, escudo] of QUADRO) {
  const p = proficienciasDe(ficha({ classe }))
  checar(`${classe}: armas`,
    p.armas.simples === simples && p.armas.marciais === marciais &&
      JSON.stringify(p.armas.propriedades) === JSON.stringify(props),
    JSON.stringify(p.armas))
  checar(`${classe}: armaduras`,
    p.armaduras.leve === leve && p.armaduras.media === media &&
      p.armaduras.pesada === pesada && p.armaduras.escudo === escudo,
    JSON.stringify(p.armaduras))
}

// ---------------------------------------------------------------------------
console.log('\nQuem pode empunhar o quê')

const arma = (n) => acharArma(n)
const CASOS = [
  ['Mago', 'Adaga', true],          // simples
  ['Mago', 'Espada Longa', false],  // marcial
  ['Guerreiro', 'Espada Longa', true],
  ['Guerreiro', 'Adaga', true],
  // Ladino e Monge são o caso que obriga a guardar mais do que dois sins.
  ['Ladino', 'Rapieira', true],     // marcial COM Acuidade — é a arma do ladino
  ['Ladino', 'Espada Curta', true], // marcial com Acuidade e Leve
  ['Ladino', 'Espada Grande', false], // marcial e nem uma coisa nem outra
  ['Monge', 'Cimitarra', true],     // marcial COM Leve
  ['Monge', 'Rapieira', false],     // tem Acuidade, mas não é Leve
  ['Monge', 'Espada Grande', false],
  ['Feiticeiro', 'Besta Leve', true],
  ['Bardo', 'Machado Grande', false],
]
for (const [classe, nome, esperado] of CASOS) {
  checar(`${classe} ${esperado ? 'usa' : 'NÃO usa'} ${nome}`,
    proficienteComArma(ficha({ classe }), arma(nome)) === esperado)
}

console.log('\nE vestir o quê')
const ARMADURAS = [
  ['Mago', 'Placas', false],
  ['Mago', 'Couro', false],
  ['Guerreiro', 'Placas', true],
  ['Clérigo', 'Camisão de Malha', true], // média
  ['Clérigo', 'Placas', false],          // pesada, não
  ['Druida', 'Couro', true],
  ['Druida', 'Peitoral', false],         // o druida de 2024 não veste média
  ['Ladino', 'Couro Batido', true],
  ['Ladino', 'Peles', false],
]
for (const [classe, nome, esperado] of ARMADURAS) {
  checar(`${classe} ${esperado ? 'veste' : 'NÃO veste'} ${nome}`,
    proficienteComArmadura(ficha({ classe }), acharArmadura(nome)) === esperado)
}

// ---------------------------------------------------------------------------
console.log('\nO campo livre continua valendo')
//
// É o único caminho para o que o SRD não tabela: multiclasse, suplemento,
// talento de fora e o que o DM concedeu. Um app que só conhece o SRD vira um
// app que discute com a mesa.

const magoArmado = ficha({ proficienciasEquipamentos: 'armas marciais, armadura pesada' })
checar('escrever "armas marciais" destrava a espada longa',
  proficienteComArma(magoArmado, arma('Espada Longa')))
checar('e "armadura pesada" destrava as placas',
  proficienteComArmadura(magoArmado, acharArmadura('Placas')))
checar('sem escrever nada, nada muda',
  !proficienteComArma(ficha(), arma('Espada Longa')))

// ---------------------------------------------------------------------------
console.log('\nO número do ataque — que era onde a mentira aparecia')

const bonusDe = (char, nome) => parseInt(ataqueDaArma(char, arma(nome)).bonus, 10)
// Nível 5: proficiência +3, Força 16 = +3.
const guerreiro = ficha({ classe: 'Guerreiro', nivel: 5 })
checar('guerreiro com espada longa: +3 de FOR e +3 de proficiência',
  bonusDe(guerreiro, 'Espada Longa') === 6, String(bonusDe(guerreiro, 'Espada Longa')))

const bardo = ficha({ classe: 'Bardo', nivel: 5 })
checar('bardo com espada grande: só o +3 de FOR',
  bonusDe(bardo, 'Espada Grande') === 3, String(bonusDe(bardo, 'Espada Grande')))
checar('e com a adaga, que ele sabe usar, o +3 volta',
  bonusDe(bardo, 'Maça') === 6, String(bonusDe(bardo, 'Maça')))
checar('a nota diz por quê',
  ataqueDaArma(bardo, arma('Espada Grande')).notas.includes('sem proficiência'))
checar('e não diz quando ele é proficiente',
  !ataqueDaArma(bardo, arma('Maça')).notas.includes('sem proficiência'))

// A proficiência sobe com o nível, e o ataque sem ela não pode subir junto.
const bardo17 = ficha({ classe: 'Bardo', nivel: 17 })
checar('no 17 a proficiência é +6 para o que ele sabe usar',
  bonusDe(bardo17, 'Maça') === 9, String(bonusDe(bardo17, 'Maça')))
checar('e continua +3 para o que ele não sabe',
  bonusDe(bardo17, 'Espada Grande') === 3, String(bonusDe(bardo17, 'Espada Grande')))

// ---------------------------------------------------------------------------
console.log('\nO preço de vestir o que não se sabe vestir')
//
// SRD 5.2.1, "Armor Training": desvantagem em todo teste de d20 de Força ou
// Destreza, e não dá para conjurar. Some sem deixar rastro: a CA sobe, a ficha
// fica plausível, e a magia acabou sem ninguém notar.

const vestindo = (classe, nomeDaArmadura) =>
  ficha({
    classe,
    equipamentos: [{
      id: 'e1', nome: nomeDaArmadura, slot: 'corpo', equipado: true,
      armadura: nomeDaArmadura, efeitos: [], precisaSintonia: false, sintonizado: false,
    }],
  })

const comEscudo = (classe) =>
  ficha({
    classe,
    equipamentos: [{
      id: 'e2', nome: 'Escudo', slot: 'maoSecundaria', equipado: true,
      efeitos: [], precisaSintonia: false, sintonizado: false,
    }],
  })

const magoDePlacas = custoDeArmadura(vestindo('Mago', 'Placas'))
checar('o mago de placas é avisado', magoDePlacas != null)
checar('e o aviso diz qual peça', magoDePlacas?.pecas.includes('Placas'))
checar('com desvantagem', magoDePlacas?.desvantagem === true)
checar('e sem conjurar', magoDePlacas?.semMagia === true)
checar('o guerreiro de placas não é avisado',
  custoDeArmadura(vestindo('Guerreiro', 'Placas')) === null)
checar('nem o mago sem armadura nenhuma', custoDeArmadura(ficha()) === null)
checar('e escrever no campo livre resolve',
  custoDeArmadura({ ...vestindo('Mago', 'Placas'), proficienciasEquipamentos: 'armadura pesada' }) === null)

// O escudo entra por fora: ele não é item do catálogo de armaduras, e o app o
// reconhece pelo nome. Mas o livro cobra por ele igual.
checar('o mago de escudo também é avisado', custoDeArmadura(comEscudo('Mago'))?.pecas.includes('Escudo'))
checar('o clérigo de escudo não é', custoDeArmadura(comEscudo('Clérigo')) === null)
checar('nem o bárbaro', custoDeArmadura(comEscudo('Bárbaro')) === null)
checar('mas o monge sim', custoDeArmadura(comEscudo('Monge'))?.pecas.includes('Escudo'))

// O catálogo de armaduras ainda não tem um escudo comum — o app o reconhece
// pelo nome do item. A função pública cobre a categoria mesmo assim, e é aqui
// que isso fica conferido: no dia em que um escudo entrar no catálogo, ele não
// pode cair no ramo da armadura pesada.
const escudoDoCatalogo = { nome: 'Escudo', categoria: 'Escudo', ca: 2, maxDes: null, peso: 3 }
checar('a categoria Escudo é do escudo, não da pesada',
  proficienteComArmadura(ficha({ classe: 'Clérigo' }), escudoDoCatalogo) === true &&
    proficienteComArmadura(ficha({ classe: 'Mago' }), escudoDoCatalogo) === false)

// ---------------------------------------------------------------------------
console.log('\nEm palavras, para a ficha mostrar')

const doMonge = emPalavras(proficienciasDe(ficha({ classe: 'Monge' })))
checar('o monge lê "marciais com leve"', /marciais com leve/.test(doMonge.armas), doMonge.armas)
checar('e "nenhuma armadura"', doMonge.armaduras === 'nenhuma armadura', doMonge.armaduras)
const doGuerreiro = emPalavras(proficienciasDe(ficha({ classe: 'Guerreiro' })))
checar('o guerreiro lê a lista inteira',
  /leve, m[ée]dia, pesada/.test(doGuerreiro.armaduras) && /escudo/.test(doGuerreiro.armaduras),
  doGuerreiro.armaduras)

// ---------------------------------------------------------------------------
console.log('\nLigado na tela')

const armas = readFileSync('src/lib/weapons.ts', 'utf-8')
const fichaTsx = readFileSync('src/pages/CharacterSheet.tsx', 'utf-8')
const leitura = readFileSync('src/components/CharacterSheetView.tsx', 'utf-8')
const comparar = readFileSync('src/lib/comparar.ts', 'utf-8')

checar('o ataque só soma proficiência se houver',
  armas.includes('proficiente ? proficiencyBonus(char.nivel) : 0'))
checar('a ficha mostra o treino da classe', fichaTsx.includes('<TreinoDaClasse char={char} />'))
checar('a ficha avisa da armadura sem treino', fichaTsx.includes('custoDeArmadura(char)'))
// Checar só "o nome da variável aparece" não vale: `{false && custoDaArmadura}`
// continuaria passando. O que precisa estar lá é o aviso escrito, e a condição
// que faz a seção aparecer quando não há mais nada de estado para mostrar.
checar('a leitura também avisa', /custoDaArmadura && \(\s*<p/.test(leitura))
checar('e o aviso está escrito', leitura.includes('Sem treino para'))
checar('a seção de Estado abre por causa dele', leitura.includes('|| custoDaArmadura != null'))
// A placa achada na masmorra mostrava "+6 de CA" para o mago, e o resto ele
// descobriria na luta seguinte.
checar('a comparação conta o que o item custa', comparar.includes('semTreino: custoDeArmadura(char) != null'))
checar('e escreve o que acontece', comparar.includes('desvantagem em FOR/DES e não conjura'))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de proficiência falharam`)
  process.exit(1)
}
console.log(`\n✓ ${testes} verificações de proficiência passaram`)
