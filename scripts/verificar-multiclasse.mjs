// Verifica o multiclasse: duas palavras que parecem a mesma e não são.
//
// - NÍVEL DE PERSONAGEM: a soma de tudo. Dele saem o bônus de proficiência, os
//   dados de vida, os testes de morte e a XP.
// - NÍVEL DE CLASSE: quanto se tem em CADA classe. Dele saem os traços, os
//   recursos, o dado daquele nível e o que a classe deixa conjurar.
//
// Confundir os dois é o erro clássico, e ele erra sempre para cima: um
// Guerreiro 3 / Mago 2 lido como "nível 5" ganha os traços de guerreiro de 5 E
// os de mago de 5, mais os espaços de um mago de nível 5. Nada disso dá erro —
// produz uma ficha forte demais e plausível.
//
// Os números abaixo estão conferidos à mão contra o SRD, um a um.

import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'multi-'))
// `--outbase=src` fixa o caminho de saída: sem ele o esbuild usa a pasta comum
// das entradas, e trocar uma entrada de lugar mudaria onde o arquivo aparece.
execSync(
  `npx esbuild src/lib/multiclasse.ts src/lib/recursos.ts src/lib/features.ts src/lib/conjuracao.ts src/lib/proficiencias.ts src/lib/conferencia.ts --bundle --splitting --outbase=src --outdir=${dir} --format=esm --log-level=error`,
)
const carregar = (f) => import(pathToFileURL(join(dir, f)).href)
const M = await carregar('lib/multiclasse.js')
const { recursosDoPersonagem } = await carregar('lib/recursos.js')
const { tracosDoPersonagem } = await carregar('lib/features.js')
const { oQueFalta } = await carregar('lib/conjuracao.js')
const { proficienciasDe } = await carregar('lib/proficiencias.js')
const { conferir } = await carregar('lib/conferencia.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const espacos = (...t) => Array.from({ length: 9 }, (_, i) => ({ total: t[i] ?? 0, usados: 0 }))
const ficha = (extra = {}) => ({
  id: 'f1', nome: 'Alguém', classe: 'Guerreiro', subclasse: '', nivel: 5,
  especie: 'Humano', antecedente: 'Soldado', xp: 6500,
  atributos: { for: 16, des: 14, con: 14, int: 14, sab: 14, car: 14 },
  salvaguardasProficientes: ['for', 'con'], periciasProficientes: [], periciasExpertise: [],
  talentos: [], equipamentos: [], magias: [], espacosMagia: espacos(),
  atributoConjuracao: null, classeArmaduraManual: null, condicoes: [], exaustao: 0,
  pvMax: 44, pvAtual: 44, dadosDeVida: '5d10', dadosDeVidaUsados: 0, ataques: [],
  deslocamento: 9, iniciativaBonus: 0, inspiracaoHeroica: false,
  proficienciasEquipamentos: '', moedas: {}, inventario: [],
  testesMorte: { sucessos: 0, falhas: 0 },
  ...extra,
})

/** Guerreiro 3 / Mago 2 — nível de personagem 5. */
const gm = (extra = {}) =>
  ficha({ nivel: 5, classesExtras: [{ classe: 'Mago', nivel: 2 }], atributoConjuracao: 'int', ...extra })

// ---------------------------------------------------------------------------
console.log('As duas palavras')

checar('sem classes extras, nada é multiclasse', !M.ehMulticlasse(ficha()))
checar('a lista traz só a classe principal',
  JSON.stringify(M.classes(ficha())) === JSON.stringify([{ classe: 'Guerreiro', nivel: 5 }]),
  JSON.stringify(M.classes(ficha())))

checar('com uma extra, vira multiclasse', M.ehMulticlasse(gm()))
// O nível da principal é o que SOBRA do nível de personagem: guardar os dois
// separados deixaria os dois desencontrados no dia em que alguém editasse um.
checar('o nível da principal é o que sobra',
  JSON.stringify(M.classes(gm())) ===
    JSON.stringify([{ classe: 'Guerreiro', nivel: 3 }, { classe: 'Mago', nivel: 2 }]),
  JSON.stringify(M.classes(gm())))
checar('nivelNaClasse responde por classe',
  M.nivelNaClasse(gm(), 'Guerreiro') === 3 && M.nivelNaClasse(gm(), 'Mago') === 2)
checar('e devolve zero para classe que não tem', M.nivelNaClasse(gm(), 'Bardo') === 0)
checar('em palavras, é como a mesa fala',
  M.emPalavras(gm()) === 'Guerreiro 3 / Mago 2', M.emPalavras(gm()))

// Subir o nível de personagem engorda a principal sozinho — é ela que sobra.
checar('subir de nível engorda a classe principal',
  M.nivelNaClasse(gm({ nivel: 8 }), 'Guerreiro') === 6)
// Extras somando mais do que o personagem tem: a principal não pode ficar
// negativa, e some da lista em vez de virar um número impossível.
const estourado = ficha({ nivel: 2, classesExtras: [{ classe: 'Mago', nivel: 5 }] })
checar('extras além do nível não criam classe negativa',
  M.classes(estourado).every((c) => c.nivel > 0), JSON.stringify(M.classes(estourado)))

// ---------------------------------------------------------------------------
console.log('\nOs espaços de magia, que têm tabela própria')
//
// SRD: soma os níveis de Bardo, Clérigo, Druida, Feiticeiro e Mago; METADE dos
// de Paladino e Patrulheiro. Um Clérigo 3 / Mago 2 é um conjurador de 5 — e
// não um clérigo de 3 mais um mago de 2, que daria menos e nenhum 3º círculo.

const NIVEIS = [
  ['Guerreiro 3 / Mago 2', gm(), 2],
  ['Clérigo 3 / Mago 2', ficha({ classe: 'Clérigo', nivel: 5, classesExtras: [{ classe: 'Mago', nivel: 2 }] }), 5],
  ['Paladino 4 / Guerreiro 1', ficha({ classe: 'Paladino', nivel: 5, classesExtras: [{ classe: 'Guerreiro', nivel: 1 }] }), 2],
  ['Patrulheiro 5 / Ladino 1', ficha({ classe: 'Patrulheiro', nivel: 6, classesExtras: [{ classe: 'Ladino', nivel: 1 }] }), 2],
  ['Bardo 6 / Paladino 4', ficha({ classe: 'Bardo', nivel: 10, classesExtras: [{ classe: 'Paladino', nivel: 4 }] }), 8],
]
for (const [nome, char, esperado] of NIVEIS) {
  checar(`${nome}: conjurador de ${esperado}`,
    M.nivelDeConjurador(char) === esperado, String(M.nivelDeConjurador(char)))
}

// O Bruxo fica de fora: a Magia de Pacto tem tabela própria e recarrega no
// descanso curto. Somá-lo daria espaços que nenhuma das duas classes concede.
checar('o Bruxo não entra na conta',
  M.nivelDeConjurador(ficha({ classe: 'Mago', nivel: 5, classesExtras: [{ classe: 'Bruxo', nivel: 2 }] })) === 3,
  String(M.nivelDeConjurador(ficha({ classe: 'Mago', nivel: 5, classesExtras: [{ classe: 'Bruxo', nivel: 2 }] }))))

// Um conjurador de nível 5 tem 4/3/2 — a linha do mago de 5.
const clerigoMago = ficha({
  classe: 'Clérigo', nivel: 5, classesExtras: [{ classe: 'Mago', nivel: 2 }],
})
const slots = M.espacosDeMulticlasse(clerigoMago).map((s) => s.total)
checar('Clérigo 3 / Mago 2 tem 4/3/2',
  JSON.stringify(slots.slice(0, 3)) === JSON.stringify([4, 3, 2]), JSON.stringify(slots))
checar('e nada do 4º para cima', slots.slice(3).every((n) => n === 0))
// A metade arredonda para BAIXO: um paladino de 1 não conjura nada.
checar('meio nível de paladino não vira espaço',
  M.espacosDeMulticlasse(ficha({ classe: 'Paladino', nivel: 2, classesExtras: [{ classe: 'Guerreiro', nivel: 1 }] }))[0].total === 0)

checar('quem não conjura não ganha espaço',
  M.espacosDeMulticlasse(ficha({ classesExtras: [{ classe: 'Ladino', nivel: 2 }] }))[0].total === 0)

// ---------------------------------------------------------------------------
console.log('\nOs recursos vêm do nível NA CLASSE')

const barbaroGuerreiro = ficha({
  classe: 'Bárbaro', nivel: 5, classesExtras: [{ classe: 'Guerreiro', nivel: 3 }],
})
const acha = (char, nome) => recursosDoPersonagem(char).find((r) => r.nome === nome)
// Bárbaro 2: duas Fúrias. Um bárbaro de 5 teria três — é o erro para cima.
checar('Bárbaro 2 / Guerreiro 3 tem 2 Fúrias',
  acha(barbaroGuerreiro, 'Fúria')?.total === 2, String(acha(barbaroGuerreiro, 'Fúria')?.total))
checar('e o Retomar o Fôlego do guerreiro de 3',
  acha(barbaroGuerreiro, 'Retomar o Fôlego')?.total === 2)
checar('e o Surto de Ação, que começa no 2 de guerreiro',
  acha(barbaroGuerreiro, 'Surto de Ação')?.total === 1)
// Um bárbaro puro de 5 continua com 3: a mudança não pode vazar para quem não
// tem multiclasse.
checar('bárbaro puro de nível 5 continua com 3 Fúrias',
  acha(ficha({ classe: 'Bárbaro' }), 'Fúria')?.total === 3)

// Clérigo e Paladino dão o MESMO recurso. O livro manda somar os usos.
const clerigoPaladino = ficha({
  classe: 'Clérigo', nivel: 6, classesExtras: [{ classe: 'Paladino', nivel: 3 }],
})
const canalizar = recursosDoPersonagem(clerigoPaladino).filter((r) => r.nome === 'Canalizar Divindade')
checar('Canalizar Divindade aparece uma vez só', canalizar.length === 1, String(canalizar.length))
checar('com os usos somados', canalizar[0]?.total === 4, String(canalizar[0]?.total))

// ---------------------------------------------------------------------------
console.log('\nOs traços também')

const nomes = (char) => tracosDoPersonagem(char).map((t) => t.nome)
const doGm = nomes(gm())
// Ataque Extra é do Guerreiro 5. Um Guerreiro 3 não tem.
checar('Guerreiro 3 / Mago 2 NÃO tem Ataque Extra', !doGm.includes('Ataque Extra'),
  doGm.join(', '))
checar('mas tem o Surto de Ação, do guerreiro de 2', doGm.includes('Surto de Ação'))
checar('e a Recuperação Arcana, do mago de 1', doGm.includes('Recuperação Arcana'))
// Guerreiro puro de 5 continua com Ataque Extra.
checar('guerreiro puro de 5 continua com Ataque Extra',
  nomes(ficha()).includes('Ataque Extra'))

// ---------------------------------------------------------------------------
console.log('\nAs magias, pela classe que conjura')

// Lido como "Guerreiro 5", nem apareceria como conjurador — a classe principal
// não conjura, e o painel de magias sumiria da ficha do mago.
const falta = oQueFalta(gm())
checar('o painel de magia aparece', falta != null)
// Mago de nível 2 no SRD: 3 truques e 5 preparadas. Um mago de 5 teria 4 e 9.
checar('e usa a cota do mago de nível 2',
  falta?.quota.truques === 3 && falta?.quota.preparadas === 5,
  JSON.stringify(falta?.quota))
checar('o grimório também é o do mago de 2', falta?.quota.grimorio === 8,
  String(falta?.quota.grimorio))
checar('guerreiro puro não tem painel de magia', oQueFalta(ficha()) === null)

// ---------------------------------------------------------------------------
console.log('\nAs proficiências somam — mas a segunda classe dá menos')
//
// SRD: entrar numa classe por multiclasse não dá salvaguardas, e corta armas e
// armaduras. Somar o quadro cheio das duas daria armadura pesada a um paladino
// de um nível só.

const magoGuerreiro = ficha({
  classe: 'Mago', nivel: 3, classesExtras: [{ classe: 'Guerreiro', nivel: 1 }],
  atributoConjuracao: 'int',
})
const p = proficienciasDe(magoGuerreiro)
checar('o mago que pega guerreiro ganha marciais', p.armas.marciais === true)
checar('e armadura leve e média', p.armaduras.leve && p.armaduras.media)
checar('e escudo', p.armaduras.escudo === true)
// A PESADA fica de fora: o guerreiro só a dá a quem começa nele.
checar('mas NÃO ganha armadura pesada', p.armaduras.pesada === false)

const magoPaladino = ficha({
  classe: 'Mago', nivel: 3, classesExtras: [{ classe: 'Paladino', nivel: 1 }],
})
checar('o paladino de entrada também não dá pesada',
  proficienciasDe(magoPaladino).armaduras.pesada === false)

// Guerreiro puro continua com tudo.
checar('guerreiro puro continua com armadura pesada',
  proficienciasDe(ficha()).armaduras.pesada === true)

// Marciais inteiras apagam a restrição de propriedade do monge/ladino.
const monge = ficha({ classe: 'Monge', nivel: 3, classesExtras: [{ classe: 'Guerreiro', nivel: 1 }] })
checar('monge/guerreiro fica com marciais inteiras',
  proficienciasDe(monge).armas.marciais === true &&
    proficienciasDe(monge).armas.propriedades.length === 0,
  JSON.stringify(proficienciasDe(monge).armas))

// ---------------------------------------------------------------------------
console.log('\nO requisito de 13')

// É a única regra do multiclasse que PROÍBE alguma coisa, e mora numa nota de
// rodapé que ninguém lê duas vezes.
const fraco = ficha({
  classe: 'Guerreiro', nivel: 5, classesExtras: [{ classe: 'Mago', nivel: 2 }],
  atributos: { for: 16, des: 10, con: 14, int: 10, sab: 10, car: 10 },
})
const faltando = M.requisitosFaltando(fraco)
checar('INT 10 impede entrar em Mago', faltando.some((r) => r.classe === 'Mago'))
checar('e o Guerreiro passa, porque FOR 16 basta',
  !faltando.some((r) => r.classe === 'Guerreiro'), JSON.stringify(faltando))
// Guerreiro e Monge pedem UM dos dois; Paladino e Patrulheiro pedem OS DOIS.
const paladinoSemCar = ficha({
  classe: 'Paladino', nivel: 5, classesExtras: [{ classe: 'Guerreiro', nivel: 1 }],
  atributos: { for: 16, des: 10, con: 14, int: 10, sab: 10, car: 10 },
})
checar('o Paladino precisa de FOR E CAR',
  M.requisitosFaltando(paladinoSemCar).some((r) => r.classe === 'Paladino' && !r.bastaUm))
checar('o Guerreiro aceita FOR ou DES',
  M.requisitosFaltando(paladinoSemCar).find((r) => r.classe === 'Guerreiro') === undefined)
// Sem multiclasse, o requisito não existe: um mago de INT 10 é ruim, não ilegal.
checar('ficha de uma classe só nunca cai no requisito',
  M.requisitosFaltando(ficha({ atributos: { for: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 } })).length === 0)

// ---------------------------------------------------------------------------
console.log('\nA vida somada')

checar('os dados aparecem por classe', M.dadosDeVida(gm()) === '3d10 + 2d6', M.dadosDeVida(gm()))
checar('e com uma classe só, o de sempre', M.dadosDeVida(ficha()) === '5d10')

// Guerreiro 3 (10 + 2×1) + Mago 2 (2×1) = 14 no mínimo; 3×10 + 2×6 = 42 no
// máximo. Mais 5 × CON +2 = 10.
const faixa = M.faixaDePv(gm())
checar('a faixa de PV soma as duas classes',
  faixa?.minimo === 24 && faixa?.maximo === 52, JSON.stringify(faixa))
// Um guerreiro de 5 puro vai de 24 a 60 — a diferença é o dado menor do mago.
const puro = M.faixaDePv(ficha())
checar('e é mais apertada que a de um guerreiro puro', faixa.maximo < puro.maximo,
  `${faixa.maximo} vs ${puro.maximo}`)
checar('o guerreiro puro vai até 60', puro.maximo === 60, String(puro.maximo))

// ---------------------------------------------------------------------------
console.log('\nA conferência não acusa uma ficha multiclasse certa')
//
// É a metade que decide se alguém vai ler a lista: gritar sobre uma ficha certa
// ensina a pessoa a ignorar a conferência inteira.

const certoMulti = ficha({
  classe: 'Guerreiro', nivel: 5, classesExtras: [{ classe: 'Mago', nivel: 2 }],
  subclasse: 'Campeão (Champion)',
  atributos: { for: 16, des: 14, con: 14, int: 14, sab: 12, car: 8 },
  salvaguardasProficientes: ['for', 'con'],
  talentos: ['Defesa'],
  atributoConjuracao: 'int',
  pvMax: 38, dadosDeVida: '3d10 + 2d6',
  espacosMagia: espacos(3),
  magias: [
    ...['Raio de Fogo', 'Mãos Mágicas', 'Ilusão Menor'].map((n, i) => ({
      id: `t${i}`, nome: n, nivel: 0, preparada: false,
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `m${i}`, nome: `Magia ${i}`, nivel: 1, preparada: i < 5,
    })),
  ],
})
certoMulti.pvAtual = certoMulti.pvMax
const achados = conferir(certoMulti)
checar('a ficha multiclasse certa fica em silêncio', achados.length === 0,
  achados.map((a) => `${a.gravidade}:${a.id} — ${a.detalhe}`).join(' | '))

// E continua pegando o que está errado de verdade.
checar('mas ainda pega o PV impossível',
  conferir({ ...certoMulti, pvMax: 200 }).some((a) => a.id === 'pv-fora-da-faixa'))
// 56 PV é legal para um guerreiro de 5 (vai até 60) e ILEGAL para o
// Guerreiro 3 / Mago 2 (vai até 52). É o caso que separa conferir contra a
// faixa somada de conferir contra a da classe principal.
checar('e pega o PV que só seria legal sem o multiclasse',
  conferir({ ...certoMulti, pvMax: 56, pvAtual: 56 }).some((a) => a.id === 'pv-fora-da-faixa'),
  conferir({ ...certoMulti, pvMax: 56, pvAtual: 56 }).map((a) => a.id).join(', '))

// O multiclasse NÃO dá salvaguardas: quem começou como mago e pegou guerreiro
// treina INT e SAB, e a ficha diz "Guerreiro" porque é onde ele tem mais
// níveis. Cobrar as salvaguardas do guerreiro dele acusaria uma ficha certa.
const veioDoMago = {
  ...certoMulti,
  salvaguardasProficientes: ['int', 'sab'],
}
checar('as salvaguardas não são cobradas de quem multiclassa',
  !conferir(veioDoMago).some((a) => a.id === 'salvaguardas'),
  conferir(veioDoMago).map((a) => a.id).join(', '))
// Mas continuam sendo cobradas de quem tem uma classe só.
checar('e continuam sendo de quem tem uma classe só',
  conferir(ficha({ salvaguardasProficientes: ['int', 'sab'] })).some((a) => a.id === 'salvaguardas'))
checar('e o requisito de 13 que falta',
  conferir({ ...certoMulti, atributos: { ...certoMulti.atributos, int: 9 } })
    .some((a) => a.id === 'multiclasse-Mago'))

// ---------------------------------------------------------------------------
console.log('\nLigado na tela')

const editor = readFileSync('src/pages/CharacterSheet.tsx', 'utf-8')
const leitura = readFileSync('src/components/CharacterSheetView.tsx', 'utf-8')
const descanso = readFileSync('src/components/rest-levelup.tsx', 'utf-8')

checar('a ficha deixa somar outra classe', editor.includes('<OutrasClasses char={char} update={update} />'))
checar('e grava em classesExtras', editor.includes('update({ classesExtras:'))
checar('o cabeçalho mostra as duas', leitura.includes('ehMulticlasse(char) ? emPalavrasAsClasses(char)'))
// Com dados de tamanhos diferentes, "d10" no descanso é um número errado na
// tela — e quem descansa é quem escolhe qual gastar.
checar('o descanso mostra os dados por classe', descanso.includes('dadosDeVidaDasClasses(char)'))
checar('e deixa escolher qual rolar', descanso.includes('setFacesEscolhidas(d.faces)'))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de multiclasse falharam`)
  process.exit(1)
}
console.log(`\n✓ ${testes} verificações de multiclasse passaram`)
