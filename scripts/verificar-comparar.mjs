// Verifica a comparação: o que muda se eu usar isto.
//
// A boneca já respondia — passar o olho num item guardado e a ficha dizer "+1
// de CA, −1 de Furtividade". Só que a conta morava dentro do componente, então
// a resposta só existia ali. Nos dois lugares onde a pergunta é mais cara ela
// não existia: na LOJA, onde se decide gastar quatro mil peças de ouro, e no
// saque.
//
// A armadilha aqui é uma só, e é grande: comparar o item com o VAZIO em vez de
// com o que já está vestido. Uma armadura de +2 mostrando "+2 de CA" para quem
// já veste uma de +2 não dá erro nenhum — só faz a pessoa gastar o dinheiro do
// grupo por nada.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'comp-'))
execSync(
  `npx esbuild src/lib/comparar.ts --bundle --outdir=${dir} --format=esm --log-level=error`,
)
const { retratar, diferencas, seEquipasse, resumoCurto, melhorPara } = await import(
  pathToFileURL(join(dir, 'comparar.js')).href
)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const ficha = (extra = {}) => ({
  id: 'f1', nome: 'Thorn', classe: 'Guerreiro', subclasse: '', nivel: 5,
  especie: 'Humano', antecedente: '', alinhamento: '',
  atributos: { for: 16, des: 14, con: 14, int: 10, sab: 12, car: 8 },
  salvaguardasProficientes: [], periciasProficientes: [], periciasExpertise: [],
  classeArmaduraManual: null, armaduraEquipada: '', escudoEquipado: false,
  talentos: [], iniciativaBonus: 0, deslocamento: 9,
  equipamentos: [], inventario: [], magias: [], espacosMagia: [],
  condicoes: [], exaustao: 0,
  ...extra,
})

const item = (id, extra = {}) => ({
  id, nome: id, slot: 'corpo', efeitos: [], equipado: false, ...extra,
})

const CA = (n) => [{ tipo: 'ca', valor: n }]

// ---------------------------------------------------------------------------
console.log('O retrato pega o que muda numa troca')

const r = retratar(ficha())
checar('tem CA', typeof r.ca === 'number')
checar('tem atributos', typeof r.atributos.for === 'number')
checar('tem percepção passiva', typeof r.percepcaoPassiva === 'number')
checar('tem deslocamento', typeof r.deslocamento === 'number')
checar('tem perícias', Object.keys(r.pericias).length > 10)
checar('tem salvaguardas', Object.keys(r.salvaguardas).length === 6)

checar('retratos iguais não têm diferença',
  diferencas(retratar(ficha()), retratar(ficha())).length === 0)

// ---------------------------------------------------------------------------
console.log('A conta DESCONTA o que sai')
//
// É a armadilha inteira. Comparar com o vazio faria uma armadura de +2 anunciar
// "+2 de CA" para quem já veste uma de +2 — e a pessoa gastaria o dinheiro do
// grupo por nada, sem que nada desse erro.

const anel1 = item('anel1', { slot: 'anel1', efeitos: CA(1), equipado: true })
const anel2 = item('anel2', { slot: 'anel1', efeitos: CA(1) })
const anel3 = item('anel3', { slot: 'anel1', efeitos: CA(3) })

const semNada = ficha()
const comUm = ficha({ equipamentos: [anel1] })

const primeiro = seEquipasse(semNada, item('novo', { slot: 'anel1', efeitos: CA(1) }))
checar('no dedo vazio, o anel dá +1 de CA',
  primeiro.some((d) => d.texto === '+1 CA' && d.bom), JSON.stringify(primeiro))

// O mesmo anel, no mesmo dedo, sobre um igual: não muda nada.
const igual = seEquipasse(comUm, { ...anel2, slot: 'anel1' })
checar('trocar por um IGUAL não muda nada', igual.length === 0, JSON.stringify(igual))

const melhor = seEquipasse(comUm, { ...anel3, slot: 'anel1' })
checar('trocar por um melhor mostra só a DIFERENÇA',
  melhor.some((d) => d.texto === '+2 CA'), JSON.stringify(melhor))

const pior = seEquipasse(ficha({ equipamentos: [{ ...anel3, equipado: true }] }),
  { ...anel2, slot: 'anel1' })
checar('trocar por um pior mostra a perda',
  pior.some((d) => d.texto === '-2 CA' && d.bom === false), JSON.stringify(pior))

// O RESTO DO EQUIPAMENTO TEM DE CONTINUAR VESTIDO na simulação. Com só o anel
// nos casos acima, uma simulação que jogasse fora tudo o que já está no corpo
// daria exatamente os mesmos números — e foi assim que a sabotagem mais
// importante deste arquivo passou batido na primeira tentativa.
const armadura = item('cota', {
  slot: 'corpo', equipado: true,
  efeitos: [{ tipo: 'caBase', valor: 16, maxDes: 2 }],
})
const vestido = ficha({ equipamentos: [armadura, anel1] })
const trocaDeAnel = seEquipasse(vestido, { ...anel3, slot: 'anel1' })
checar('trocar o anel de quem usa armadura mostra só +2 de CA',
  trocaDeAnel.length === 1 && trocaDeAnel[0].texto === '+2 CA',
  JSON.stringify(trocaDeAnel))
// E o mesmo anel, num personagem sem armadura, também dá +2: a diferença é do
// ANEL. Se a armadura sumisse da simulação, este par de números discordaria.
const semArmadura = seEquipasse(ficha({ equipamentos: [anel1] }), { ...anel3, slot: 'anel1' })
checar('e a mesma troca sem armadura dá o mesmo +2',
  semArmadura.length === 1 && semArmadura[0].texto === '+2 CA',
  JSON.stringify(semArmadura))

// Item de sintonia entra SINTONIZADO na simulação. Sem isto a prévia responde
// outra pergunta — "e se eu vestisse e não sintonizasse?" —, e um Anel de
// Proteção comprado por cima de outro igual aparecia como −1 de CA. Verdade
// literal, e inútil: ninguém compra anel de sintonia para não sintonizar.
const deSintonia = item('novo-anel', {
  slot: 'anel1', sintonia: true, sintonizado: false, efeitos: CA(1),
})
const usandoOutro = ficha({
  equipamentos: [{ ...anel1, sintonia: true, sintonizado: true }],
})
checar('trocar por um IGUAL de sintonia não muda nada',
  seEquipasse(usandoOutro, deSintonia).length === 0,
  JSON.stringify(seEquipasse(usandoOutro, deSintonia)))
checar('e no dedo vazio ele dá o bônus cheio',
  seEquipasse(semNada, deSintonia).some((d) => d.texto === '+1 CA'),
  JSON.stringify(seEquipasse(semNada, deSintonia)))

// ---------------------------------------------------------------------------
console.log('A ficha de entrada nunca é mexida')
//
// A comparação roda a cada tecla numa lista da loja. Se ela sujar a ficha, o
// jogador fica com um anel fantasma equipado por ter passado o olho nele.

const original = ficha({ equipamentos: [anel1] })
const antes = JSON.stringify(original)
seEquipasse(original, anel3)
checar('a ficha não muda', JSON.stringify(original) === antes)
checar('nem a lista de equipamentos', original.equipamentos.length === 1)
checar('e o item de fora não entra na ficha',
  !original.equipamentos.some((e) => e.id === 'anel3'))

// ---------------------------------------------------------------------------
console.log('O texto que a tela mostra')

const comSinal = seEquipasse(semNada, item('x', { slot: 'anel1', efeitos: CA(2) }))
checar('o positivo vem com +', comSinal[0].texto.startsWith('+'), comSinal[0].texto)
checar('e marcado como bom', comSinal[0].bom === true)

// O atributo aparece como TRANSIÇÃO, e não como delta: "+5 FOR" leria como
// cinco a mais nas rolagens, quando 16 → 21 muda o modificador só em 2.
const cinto = seEquipasse(semNada, item('cinto', {
  slot: 'cinto', efeitos: [{ tipo: 'atributoFixo', atributo: 'for', valor: 21 }],
}))
checar('o atributo vem como transição',
  cinto.some((d) => /FOR 16 → 21/.test(d.texto)), JSON.stringify(cinto))
checar('e não como "+5 FOR"', !cinto.some((d) => d.texto === '+5 FOR'))

// Um item que muda VÁRIAS coisas tem de listar todas. Cortar na primeira não
// dá erro nenhum: a pessoa só nunca fica sabendo que a armadura pesada que
// ganhou +2 de CA custou a Furtividade dela.
const varias = seEquipasse(semNada, item('capa', {
  slot: 'capa',
  efeitos: [
    { tipo: 'ca', valor: 1 },
    { tipo: 'pericia', pericia: 'furtividade', valor: -2 },
    { tipo: 'deslocamento', metros: 3 },
  ],
}))
checar('item que muda três coisas mostra as três', varias.length === 3,
  JSON.stringify(varias))
checar('inclusive a perda', varias.some((d) => d.bom === false && /Furtividade/.test(d.texto)))
checar('e o deslocamento', varias.some((d) => /deslocamento/.test(d.texto)))

checar('resumo curto junta com ponto', resumoCurto(comSinal).includes('CA'))
checar('resumo de nada é vazio', resumoCurto([]) === '')
checar('e ele corta no limite', resumoCurto(
  [{ texto: 'a', bom: true }, { texto: 'b', bom: true }, { texto: 'c', bom: true },
   { texto: 'd', bom: true }], 2) === 'a · b')

// ---------------------------------------------------------------------------
console.log('Ficha esquisita não quebra')

checar('ficha sem equipamentos', seEquipasse(ficha({ equipamentos: undefined }), anel1).length >= 0)
checar('item sem efeito nenhum não muda nada',
  seEquipasse(semNada, item('vazio', { slot: 'pescoco' })).length === 0)

// ---------------------------------------------------------------------------
console.log('Quem deveria ficar com isto')
//
// É a pergunta que mais atrasa a sessão depois de uma luta: cada um abre a
// própria ficha, faz a conta de cabeça, e quinze minutos depois o item vai
// para quem falou mais alto.

const semArmaduraNenhuma = ficha({ id: 'a', nome: 'Elara', equipamentos: [] })
const jaDeCota = ficha({
  id: 'b', nome: 'Thorn',
  equipamentos: [item('cota', {
    slot: 'corpo', equipado: true,
    efeitos: [{ tipo: 'caBase', valor: 18, maxDes: 0 }],
  })],
})
const cotaNova = item('achada', {
  slot: 'corpo', efeitos: [{ tipo: 'caBase', valor: 16, maxDes: 2 }],
})

const alvos = melhorPara(cotaNova, [jaDeCota, semArmaduraNenhuma])
checar('quem ganha mais vem primeiro', alvos[0]?.ficha.nome === 'Elara',
  alvos.map((a) => a.ficha.nome).join(', '))
// Quem já usa algo melhor não entra na lista. Sugerir a armadura de 16 para
// quem veste a de 18 é o conselho que o app existe para não dar.
checar('quem já tem melhor fica de fora',
  !alvos.some((a) => a.ficha.nome === 'Thorn'),
  alvos.map((a) => a.ficha.nome).join(', '))
checar('e vem com a diferença junto',
  alvos[0]?.diferencas.some((d) => /CA/.test(d.texto)))

checar('sem ficha nenhuma, lista vazia', melhorPara(cotaNova, []).length === 0)
checar('item sem efeito não serve a ninguém',
  melhorPara(item('nada', { slot: 'pescoco' }), [semArmaduraNenhuma, jaDeCota]).length === 0)

// A ORDEM É PELA CA. Com um candidato só, qualquer ordenação passa — foi assim
// que a sabotagem que zera o critério escapou na primeira tentativa. Precisa de
// dois que ganhem, com CAs diferentes, e entrando na ordem ERRADA para que só a
// ordenação possa consertar.
const deCouro = ficha({
  id: 'c', nome: 'Nyx',
  equipamentos: [item('couro', {
    slot: 'corpo', equipado: true,
    efeitos: [{ tipo: 'caBase', valor: 14, maxDes: 2 }],
  })],
})
const pesada = item('cota-pesada', {
  slot: 'corpo', efeitos: [{ tipo: 'caBase', valor: 18, maxDes: 0 }],
})
// Nyx ganha pouco (14 → 18 com teto de Destreza); Elara, que está sem nada,
// ganha muito. Entram com Nyx primeiro de propósito.
const ordenados = melhorPara(pesada, [deCouro, semArmaduraNenhuma])
checar('os dois ganham alguma coisa', ordenados.length === 2,
  ordenados.map((a) => a.ficha.nome).join(', '))
checar('e quem ganha MAIS CA vem primeiro',
  ordenados[0]?.ficha.nome === 'Elara',
  ordenados.map((a) => `${a.ficha.nome}(${a.diferencas[0]?.texto})`).join(', '))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de comparação falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de comparação passaram`)
