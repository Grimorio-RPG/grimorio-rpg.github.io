// Verifica os dados de vida, um pote por tamanho.
//
// Com uma classe só isto é subtração e nunca precisou de módulo: cinco dados,
// gastou dois, sobram três. Com duas classes vira outra coisa — um Guerreiro 3
// / Mago 2 tem TRÊS d10 e DOIS d6, e a ficha guardava só "gastou dois", sem
// dizer de quê. Dava para rolar cinco d10.
//
// O erro é do tipo que não reclama: o número na tela continua batendo (cinco
// dados, cinco gastos) enquanto a cura sai maior do que a regra permite — e
// justo no descanso, que é quando a mesa está contando recurso.

import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'ddv-'))
execSync(
  `npx esbuild src/lib/dados-de-vida.ts src/lib/conferencia.ts --bundle --splitting --outbase=src --outdir=${dir} --format=esm --log-level=error`,
)
const carregar = (f) => import(pathToFileURL(join(dir, f)).href)
const D = await carregar('lib/dados-de-vida.js')
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
  id: 'f1', nome: 'Alguém', classe: 'Guerreiro', subclasse: 'Campeão (Champion)', nivel: 5,
  especie: 'Humano', antecedente: 'Soldado', xp: 6500,
  atributos: { for: 16, des: 14, con: 14, int: 14, sab: 12, car: 8 },
  salvaguardasProficientes: ['for', 'con'], periciasProficientes: [], periciasExpertise: [],
  talentos: ['Defesa'], equipamentos: [], magias: [], espacosMagia: espacos(),
  atributoConjuracao: null, classeArmaduraManual: null, condicoes: [], exaustao: 0,
  pvMax: 44, pvAtual: 44, dadosDeVida: '5d10', dadosDeVidaUsados: 0, ataques: [],
  deslocamento: 9, iniciativaBonus: 0, inspiracaoHeroica: false,
  proficienciasEquipamentos: '', moedas: {}, inventario: [],
  testesMorte: { sucessos: 0, falhas: 0 },
  ...extra,
})

/** Guerreiro 3 / Mago 2: três d10 e dois d6. */
const gm = (extra = {}) =>
  ficha({ classesExtras: [{ classe: 'Mago', nivel: 2 }], atributoConjuracao: 'int', ...extra })

const pote = (char, faces) => D.potes(char).find((p) => p.faces === faces)

// ---------------------------------------------------------------------------
console.log('Um pote por tamanho de dado')

const puros = D.potes(ficha())
checar('com uma classe só há um pote', puros.length === 1, String(puros.length))
checar('com o nível inteiro', puros[0].total === 5 && puros[0].faces === 10)

const dois = D.potes(gm())
checar('com duas classes, dois potes', dois.length === 2, JSON.stringify(dois))
checar('três d10 do guerreiro', pote(gm(), 10)?.total === 3)
checar('e dois d6 do mago', pote(gm(), 6)?.total === 2)
// O maior primeiro: é o que se gasta primeiro numa mesa.
checar('o maior vem primeiro', dois[0].faces === 10)
checar('o total bate com o nível de personagem', D.totalDeDados(gm()) === 5)
checar('em palavras, "3d10 + 2d6"', D.emPalavras(gm()) === '3d10 + 2d6', D.emPalavras(gm()))

// Duas classes com o MESMO dado viram um pote só: na hora de rolar, d10 é d10.
const guerreiroPaladino = ficha({ classesExtras: [{ classe: 'Paladino', nivel: 2 }] })
const juntos = D.potes(guerreiroPaladino)
checar('classes com o mesmo dado viram um pote', juntos.length === 1, JSON.stringify(juntos))
checar('com os níveis somados', juntos[0].total === 5)
checar('e as duas classes anotadas', juntos[0].classes.length === 2)

// ---------------------------------------------------------------------------
console.log('\nGastar respeita o limite DE CADA POTE')
//
// É o bug inteiro: cinco dados no total, e só três deles são d10.

let char = gm()
char = { ...char, ...D.gastar(char, 10, 2) }
checar('gastou dois d10', pote(char, 10)?.gastos === 2)
checar('e os d6 continuam intactos', pote(char, 6)?.gastos === 0)
checar('sobra um d10', D.disponiveis(char, 10) === 1)
checar('e o total sobrando é 3', D.totalDisponivel(char) === 3, String(D.totalDisponivel(char)))

char = { ...char, ...D.gastar(char, 10, 5) }
checar('não dá para gastar d10 além dos três', pote(char, 10)?.gastos === 3,
  String(pote(char, 10)?.gastos))
checar('e o d6 continua disponível', D.disponiveis(char, 6) === 2)
checar('mesmo com os d10 acabados', D.disponiveis(char, 10) === 0)
checar('o que sobra se escreve certo', D.sobrandoEmPalavras(char) === '2d6',
  D.sobrandoEmPalavras(char))

// O total continua sendo escrito, porque é ele que o resto do app lê.
checar('o total gasto acompanha', char.dadosDeVidaUsados === 3, String(char.dadosDeVidaUsados))

char = { ...char, ...D.gastar(char, 6, 2) }
checar('gastando tudo, não sobra nada', D.totalDisponivel(char) === 0)
checar('e o total gasto é 5', char.dadosDeVidaUsados === 5)
checar('gastar de um pote vazio não faz nada',
  Object.keys(D.gastar(char, 10, 1)).length === 0)
checar('gastar de um dado que a ficha não tem não faz nada',
  Object.keys(D.gastar(gm(), 12, 1)).length === 0)
checar('gastar zero não faz nada', Object.keys(D.gastar(gm(), 10, 0)).length === 0)

// Devolver, para desfazer um clique errado.
const devolvido = { ...char, ...D.devolver(char, 6, 1) }
checar('devolver traz um d6 de volta', D.disponiveis(devolvido, 6) === 1)
// Devolver mais do que se gastou não cria dado do nada.
const umGasto = { ...gm(), ...D.gastar(gm(), 10, 1) }
const demais = { ...umGasto, ...D.devolver(umGasto, 10, 9) }
checar('devolver demais não vira negativo', pote(demais, 10)?.gastos === 0,
  String(pote(demais, 10)?.gastos))
checar('e não inventa dado além do que a classe dá', D.disponiveis(demais, 10) === 3,
  String(D.disponiveis(demais, 10)))
checar('e o total gasto acompanha', demais.dadosDeVidaUsados === 0,
  String(demais.dadosDeVidaUsados))
checar('devolver de quem não gastou nada não faz nada',
  Object.keys(D.devolver(gm(), 10, 1)).length === 0)

// ---------------------------------------------------------------------------
console.log('\nFicha antiga: só o total, sem a divisão')
//
// Nenhuma ficha existente tem a divisão, e todas elas têm uma classe só — onde
// não há ambiguidade nenhuma. O palpite só importa se alguém multiclassar depois.

const antiga = ficha({ dadosDeVidaUsados: 2, dadosDeVidaGastos: undefined })
checar('com uma classe, o gasto antigo vale', pote(antiga, 10)?.gastos === 2)
checar('e sobram três', D.totalDisponivel(antiga) === 3)

const antigaMulti = gm({ dadosDeVidaUsados: 2, dadosDeVidaGastos: undefined })
// O palpite cai no MAIOR: é onde ele provavelmente estava, e é o que não dá
// dado bom de graça a ninguém.
checar('multiclassando depois, o gasto antigo cai no dado maior',
  pote(antigaMulti, 10)?.gastos === 2 && pote(antigaMulti, 6)?.gastos === 0)
checar('e o total sobrando continua certo', D.totalDisponivel(antigaMulti) === 3)

// Gasto antigo maior que o pote maior transborda para o próximo.
const antigaCheia = gm({ dadosDeVidaUsados: 4, dadosDeVidaGastos: undefined })
checar('o gasto que não cabe no maior transborda',
  pote(antigaCheia, 10)?.gastos === 3 && pote(antigaCheia, 6)?.gastos === 1)

// ---------------------------------------------------------------------------
console.log('\nO descanso longo devolve metade, do maior para o menor')

const seco = (() => {
  let c = gm()
  c = { ...c, ...D.gastar(c, 10, 3) }
  c = { ...c, ...D.gastar(c, 6, 2) }
  return c
})()
checar('a ficha está sem dados', D.totalDisponivel(seco) === 0)

const longo = D.aoDescansarLongo(seco)
const depois = { ...seco, ...longo.patch }
// Nível 5: metade é 2.
checar('o longo devolve metade', longo.devolvidos === 2, String(longo.devolvidos))
// Do maior para o menor: os dois que voltam são d10.
checar('e devolve os d10 primeiro', D.disponiveis(depois, 10) === 2,
  String(D.disponiveis(depois, 10)))
checar('os d6 continuam gastos', D.disponiveis(depois, 6) === 0)
checar('descansar sem ter gastado não muda nada',
  D.aoDescansarLongo(gm()).devolvidos === 0 &&
    Object.keys(D.aoDescansarLongo(gm()).patch).length === 0)

// Metade de um nível 1 é meio dado — a regra dá no mínimo um.
const nivel1 = ficha({ nivel: 1, pvMax: 12, pvAtual: 12, talentos: [], subclasse: '' })
const gasto1 = { ...nivel1, ...D.gastar(nivel1, 10, 1) }
checar('no nível 1, o longo devolve o único dado',
  D.aoDescansarLongo(gasto1).devolvidos === 1)

// ---------------------------------------------------------------------------
console.log('\nA conferência pega o gasto impossível por tamanho')

// Cinco gastos no total é legal para um nível 5 — mas quatro d10 não são,
// porque o guerreiro de 3 só tem três.
const mentiroso = gm({
  dadosDeVidaUsados: 5,
  dadosDeVidaGastos: { '10': 4, '6': 1 },
})
const achado = conferir(mentiroso).find((a) => a.id === 'dados-de-vida-d10')
checar('quatro d10 num guerreiro de 3 vira achado', achado != null,
  conferir(mentiroso).map((a) => a.id).join(', '))
checar('e o total de 5 não vira', !conferir(mentiroso).some((a) => a.id === 'dados-de-vida'))
checar('o achado diz de onde vem o limite', /Guerreiro/.test(achado?.detalhe ?? ''), achado?.detalhe)
checar('três d10 e dois d6 não viram achado',
  !conferir(gm({ dadosDeVidaUsados: 5, dadosDeVidaGastos: { '10': 3, '6': 2 } }))
    .some((a) => a.id.startsWith('dados-de-vida')))

// E o registro estragado se cura no próximo gasto: ler o pote com o teto do
// próprio pote faz o número impossível não sobreviver à primeira escrita.
const curado = { ...mentiroso, ...D.gastar(mentiroso, 6, 1) }
checar('o registro impossível se conserta ao gravar de novo',
  curado.dadosDeVidaGastos['10'] === 3, JSON.stringify(curado.dadosDeVidaGastos))
checar('e o total volta a bater com a soma',
  curado.dadosDeVidaUsados === 5, String(curado.dadosDeVidaUsados))

// ---------------------------------------------------------------------------
console.log('\nLigado na tela')

const descanso = readFileSync('src/components/rest-levelup.tsx', 'utf-8')
checar('o descanso usa os potes', descanso.includes('potesDeDados(char)'))
// O que dá para gastar é DESTE dado, e não o total: com os d10 acabados, o
// botão não pode continuar rolando d10 porque ainda há d6 na ficha.
checar('e limita pelo dado escolhido', descanso.includes('disponiveisDoDado(char, faces)'))
checar('gastar passa pelo lib', descanso.includes('gastarDados(char, faces, usar)'))
checar('o longo devolve pelos potes', descanso.includes('descansarLongoNosDados(char)'))
checar('o botão do dado sem sobra fica travado', descanso.includes('disabled={sobram === 0}'))
// "Sem dados de vida" com d6 na ficha seria o app mentindo sobre o próprio limite.
checar('e o aviso separa "este acabou" de "acabaram todos"',
  descanso.includes('Os d${faces} acabaram'))
checar('a conferência confere por tamanho',
  readFileSync('src/lib/conferencia.ts', 'utf-8').includes('for (const p of potesDeDados(char))'))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de dados de vida falharam`)
  process.exit(1)
}
console.log(`\n✓ ${testes} verificações de dados de vida passaram`)
