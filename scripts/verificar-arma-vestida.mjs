// Verifica que vestir uma arma MUDA como se bate.
//
// O painel de equipamento sabia que a espada dá "+2 no ataque contra
// goblinoides"; o painel de Ataques sabia rolar. Os dois não se falavam: vestir
// a espada não mudava nada na hora de bater, e a pessoa continuava digitando o
// ataque à mão com os bônus do item somados de cabeça — a mesma conta na cabeça
// que o equipamento em números veio resolver.
//
// Junto disso, a segunda verdade sobre a CA. `armaduraEquipada` e
// `escudoEquipado` descreviam a mesma coisa que os itens vestidos, e as duas se
// contradiziam.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

// Uma compilação só, com `--splitting`: compilar cada módulo à parte daria a
// cada um a SUA cópia dos outros, e `equipar` de uma cópia não conversaria com
// `ataquesDeArmas` da outra.
const dir = mkdtempSync(join(tmpdir(), 'arma-'))
const ENTRADAS = [
  'lib/weapons', 'lib/equipamento', 'lib/calc', 'lib/character', 'lib/features',
  'data/itens-equipaveis',
]
execSync(
  `npx esbuild ${ENTRADAS.map((e) => `src/${e}.ts`).join(' ')} ` +
    `--bundle --splitting --outdir=${dir} --format=esm --log-level=error`,
)
// Com entradas de pastas diferentes o esbuild espelha a estrutura:
// `src/lib/weapons.ts` sai em `lib/weapons.js`.
const carregar = (n) => import(pathToFileURL(join(dir, `${n}.js`)).href)

const { ataquesDeArmas } = await carregar('lib/weapons')
const {
  equipar, equiparEm, ocupaDuasMaos, itensAtivos, usaEscudo, vesteArmadura,
  bonusForaDasArmas, ehDeUmaMao, ehLeve, duasArmasLeves, slotsPossiveis,
} = await carregar('lib/equipamento')
const { armorClass } = await carregar('lib/calc')
const { normalizeCharacter } = await carregar('lib/character')
const { defesaSemArmadura } = await carregar('lib/features')
const { doCatalogo, ITENS_EQUIPAVEIS } = await carregar('data/itens-equipaveis')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const BASE = {
  id: 'c1', nome: 'Thorn', nivel: 5, classe: 'Guerreiro',
  atributos: { for: 16, des: 14, con: 14, int: 10, sab: 12, car: 8 },
  classeArmaduraManual: null, armaduraEquipada: '', escudoEquipado: false,
  talentos: [], salvaguardasProficientes: [], periciasProficientes: [],
  periciasExpertise: [], ataques: [], atributoConjuracao: null, equipamentos: [],
}
const com = (...itens) => ({ ...BASE, equipamentos: itens })

const arma = (nome, base, extra = {}) => ({
  id: nome, nome, slot: 'maoPrincipal', arma: base, efeitos: [], equipado: true, ...extra,
})

// ---------------------------------------------------------------------------
console.log('A arma vestida vira ataque')

const espada = arma('Espada Longa', 'Espada Longa')
const [a1] = ataquesDeArmas(com(espada))
checar('vestir a espada produz um ataque', !!a1)
// FOR 16 = +3, proficiência nível 5 = +3.
checar('com o acerto calculado', a1?.bonus === '+6', `deu ${a1?.bonus}`)
checar('e o dano com o modificador dentro', a1?.dano?.startsWith('1d10+3'), `deu ${a1?.dano}`)

checar('sem nada vestido não há ataque nenhum', ataquesDeArmas(BASE).length === 0)

// Tirar a arma tem de tirar o ataque — é o motivo de ele ser derivado e não
// guardado: guardado, sobraria na ficha o ataque de uma arma que ninguém tem.
checar('tirar a arma tira o ataque',
  ataquesDeArmas(com({ ...espada, equipado: false })).length === 0)

// ---------------------------------------------------------------------------
console.log('O bônus do item entra na conta')

const maisUm = arma('Espada Longa +1', 'Espada Longa', {
  efeitos: [{ tipo: 'ataque', valor: 1 }, { tipo: 'dano', valor: 1 }],
})
const [b1] = ataquesDeArmas(com(maisUm))
checar('o +1 sobe o acerto', b1?.bonus === '+7', `deu ${b1?.bonus}`)
// "1d10+3 cortante +1" o rolador não entende: o +1 tem de entrar no número.
checar('e entra DENTRO da expressão de dano', b1?.dano?.startsWith('1d10+4'), `deu ${b1?.dano}`)
checar('sem virar sufixo solto', !/\+1\s*$/.test(b1?.dano ?? ''), `deu ${b1?.dano}`)

// Um item que não é arma vale para todas elas.
const anel = {
  id: 'anel', nome: 'Anel Bruto', slot: 'anel1', equipado: true,
  efeitos: [{ tipo: 'ataque', valor: 1 }],
}
const [c1] = ataquesDeArmas(com(espada, anel))
checar('bônus de item que não é arma vale para a arma', c1?.bonus === '+7', `deu ${c1?.bonus}`)

// ...mas o encantamento de UMA arma não empresta para a outra.
const machado = { ...arma('Machadinha', 'Machadinha'), id: 'ma', slot: 'maoSecundaria' }
const dois = ataquesDeArmas(com(maisUm, machado))
const oMachado = dois.find((a) => a.nome === 'Machadinha')
checar('duas armas, dois ataques', dois.length === 2, `deu ${dois.length}`)
checar('o +1 de uma não vai para a outra', oMachado?.bonus === '+6', `deu ${oMachado?.bonus}`)

// O ataque escrito à mão — golpe desarmado, ataque de magia — não recebe o
// bônus da espada. Dizer que recebe é a mesma mentira que somar o condicional.
const foraDaEspada = bonusForaDasArmas(com(maisUm, anel))
checar('o +1 da espada não vale para o golpe desarmado', foraDaEspada.ataque === 1,
  `deu ${foraDaEspada.ataque}`)
checar('mas o do anel vale', bonusForaDasArmas(com(anel)).ataque === 1)
checar('e sem itens fora das armas, não sobra nada',
  bonusForaDasArmas(com(maisUm)).ataque === 0)

// ---------------------------------------------------------------------------
console.log('O condicional continua fora do total')

const matadora = arma('Espada Matadora de Goblins', 'Espada Longa', {
  efeitos: [
    { tipo: 'ataque', valor: 2, contra: 'goblinoide' },
    { tipo: 'dano', valor: 2, contra: 'goblinoide' },
  ],
})
const [d1] = ataquesDeArmas(com(matadora))
checar('o condicional NÃO entra no acerto', d1?.bonus === '+6', `deu ${d1?.bonus}`)
checar('nem no dano', d1?.dano?.startsWith('1d10+3'), `deu ${d1?.dano}`)
checar('mas vem escrito junto do ataque', d1?.condicionais?.[0]?.contra === 'goblinoide')
checar('com o quanto', d1?.condicionais?.[0]?.ataque === 2 && d1?.condicionais?.[0]?.dano === 2)

// ---------------------------------------------------------------------------
console.log('Versátil')
//
// A Espada Longa sozinha faz 1d10; com escudo na outra mão faz 1d8. É a regra,
// e é o tipo de detalhe que ninguém lembra de ajustar no meio da luta.

const escudo = {
  id: 'esc', nome: 'Escudo', slot: 'maoSecundaria', equipado: true,
  efeitos: [{ tipo: 'ca', valor: 2 }],
}
const [e1] = ataquesDeArmas(com(espada, escudo))
checar('com escudo, a versátil cai para 1d8', e1?.dano?.startsWith('1d8+3'), `deu ${e1?.dano}`)

// ---------------------------------------------------------------------------
console.log('Duas mãos')

const arco = arma('Arco Longo', 'Arco Longo')
checar('o arco longo ocupa as duas mãos', ocupaDuasMaos(arco) === true)
checar('a espada longa não', ocupaDuasMaos(espada) === false)

// Vestir o arco tem de largar o escudo: um personagem não tem três mãos.
const comEscudo = [{ ...escudo, equipado: true }, { ...arco, equipado: false }]
const depois = equipar(comEscudo, 'Arco Longo')
checar('vestir o arco guarda o escudo',
  depois.find((e) => e.id === 'esc')?.equipado === false)
checar('e o arco fica vestido', depois.find((e) => e.id === 'Arco Longo')?.equipado === true)

// E o contrário: pegar o escudo tem de largar o arco.
const comArco = [{ ...arco, equipado: true }, { ...escudo, equipado: false }]
const volta = equipar(comArco, 'esc')
checar('vestir o escudo guarda o arco',
  volta.find((e) => e.id === 'Arco Longo')?.equipado === false)

// A troca normal continua funcionando.
const duasEspadas = [
  { ...espada, equipado: true },
  { ...espada, id: 'outra', nome: 'Cimitarra', arma: 'Cimitarra', equipado: false },
]
const trocado = equipar(duasEspadas, 'outra')
checar('trocar na mesma mão guarda a anterior',
  trocado.find((e) => e.id === 'Espada Longa')?.equipado === false)

// ---------------------------------------------------------------------------
console.log('As duas mãos')
//
// As regras não exigem NADA para segurar uma arma na mão secundária: qualquer
// um empunha duas adagas. O que exige é o ataque EXTRA, que pede a propriedade
// Leve nas duas armas. O app escolhia a mão pela pessoa, e duas adagas eram
// impossíveis.

const adaga = arma('Adaga', 'Adaga')
checar('a adaga é de uma mão', ehDeUmaMao(adaga) === true)
checar('o arco longo não', ehDeUmaMao(arco) === false)
checar('o escudo também não', ehDeUmaMao(escudo) === false)
checar('a adaga cabe nas duas mãos',
  slotsPossiveis(adaga).length === 2, JSON.stringify(slotsPossiveis(adaga)))
checar('o arco só na principal',
  JSON.stringify(slotsPossiveis(arco)) === JSON.stringify(['maoPrincipal']))

const duas = [
  { ...adaga, id: 'a1', equipado: false },
  { ...adaga, id: 'a2', nome: 'Adaga curva', equipado: false },
]
const comDuas = equiparEm(equiparEm(duas, 'a1', 'maoPrincipal'), 'a2', 'maoSecundaria')
checar('dá para empunhar duas adagas',
  comDuas.filter((e) => e.equipado).length === 2,
  JSON.stringify(comDuas.map((e) => [e.id, e.slot, e.equipado])))
checar('cada uma na sua mão',
  comDuas.find((e) => e.id === 'a1').slot === 'maoPrincipal' &&
  comDuas.find((e) => e.id === 'a2').slot === 'maoSecundaria')

// Pedir um lugar que a peça não aceita não pode pôr o elmo na mão.
const elmo = { id: 'h', nome: 'Elmo', slot: 'cabeca', efeitos: [], equipado: false }
checar('lugar impossível não muda nada',
  equiparEm([elmo], 'h', 'maoPrincipal')[0].equipado !== true)

const ataquesComDuas = ataquesDeArmas({ ...BASE, equipamentos: comDuas })
checar('as duas armas rendem dois ataques', ataquesComDuas.length === 2)

// ---------------------------------------------------------------------------
console.log('O ataque extra de duas armas')

const espadaCurta = { ...arma('Espada Curta', 'Espada Curta'), id: 'ec', slot: 'maoSecundaria' }
const comLeves = { ...BASE, equipamentos: [{ ...adaga, id: 'a1' }, espadaCurta] }
checar('a adaga é Leve', ehLeve(adaga) === true)
checar('a espada longa não é', ehLeve(espada) === false)
checar('duas Leves dão o ataque extra', duasArmasLeves(comLeves) === true)

const semLeve = { ...BASE, equipamentos: [espada, { ...espadaCurta }] }
checar('com arma não Leve na principal, não dá', duasArmasLeves(semLeve) === false)
checar('e com uma mão só, também não',
  duasArmasLeves({ ...BASE, equipamentos: [{ ...adaga, id: 'a1' }] }) === false)

const [, secundaria] = ataquesDeArmas(comLeves)
checar('o ataque extra aparece na arma secundária', !!secundaria?.ataqueExtra)
checar('e não na principal', !ataquesDeArmas(comLeves)[0].ataqueExtra)
// FOR 16 = +3. Sem o estilo, o dano extra sai sem o modificador.
checar('sem o estilo, sai sem o modificador no dano',
  secundaria?.ataqueExtra?.dano?.startsWith('1d6 '),
  `deu ${secundaria?.ataqueExtra?.dano}`)
checar('e o ataque normal dela continua com o modificador',
  secundaria?.dano?.startsWith('1d6+3'), `deu ${secundaria?.dano}`)

const comEstilo = { ...comLeves, talentos: ['Combate com Duas Armas'] }
const [, comEstiloSec] = ataquesDeArmas(comEstilo)
checar('com o estilo, o modificador entra',
  comEstiloSec?.ataqueExtra?.dano?.startsWith('1d6+3'),
  `deu ${comEstiloSec?.ataqueExtra?.dano}`)
checar('e a tela sabe disso', comEstiloSec?.ataqueExtra?.comEstilo === true)

// ---------------------------------------------------------------------------
console.log('Uma só verdade para a CA')
//
// Os campos antigos viravam uma SEGUNDA fonte: marcar a caixa de escudo E
// vestir o escudo somava +2 duas vezes.

const antiga = normalizeCharacter({ ...BASE, armaduraEquipada: 'Cota de Malha', escudoEquipado: true })
checar('a armadura antiga vira item vestido',
  antiga.equipamentos.some((e) => e.nome === 'Cota de Malha' && e.equipado))
checar('o escudo antigo também',
  antiga.equipamentos.some((e) => e.nome === 'Escudo' && e.equipado))
checar('e os campos antigos ficam vazios',
  antiga.armaduraEquipada === '' && antiga.escudoEquipado === false)
// Cota de Malha 16 (DES não conta) + escudo 2.
checar('a CA sai certa depois de converter', armorClass(antiga) === 18, `deu ${armorClass(antiga)}`)

// O caso do +4: campo antigo marcado E item vestido.
const duplicado = normalizeCharacter({
  ...BASE, escudoEquipado: true,
  equipamentos: [{ ...escudo }],
})
checar('escudo vestido não é somado duas vezes',
  armorClass(duplicado) === 14, `deu ${armorClass(duplicado)}`)
checar('e a caixa antiga não sobrevive à conversão', duplicado.escudoEquipado === false)

checar('vesteArmadura enxerga o item', vesteArmadura(com({
  id: 'c', nome: 'Cota de Malha', slot: 'corpo', equipado: true,
  efeitos: [{ tipo: 'caBase', valor: 16, maxDes: 0 }],
})) === true)
checar('usaEscudo enxerga o item', usaEscudo(com(escudo)) === true)
checar('e não confunde arma com escudo', usaEscudo(com(machado)) === false)

// ---------------------------------------------------------------------------
console.log('Traço de classe olha o que está vestido')
//
// Antes `defesaSemArmadura` lia só o campo antigo: um Monge de Cota de Malha
// no slot continuava ganhando Defesa sem Armadura.

const monge = { ...BASE, classe: 'Monge' }
checar('o Monge desarmado tem Defesa sem Armadura', defesaSemArmadura(monge) === 'sab')

const mongeBlindado = {
  ...monge,
  equipamentos: [{
    id: 'c', nome: 'Cota de Malha', slot: 'corpo', equipado: true,
    efeitos: [{ tipo: 'caBase', valor: 16, maxDes: 0 }],
  }],
}
checar('de armadura no slot, perde', defesaSemArmadura(mongeBlindado) === null)

const mongeComEscudo = { ...monge, equipamentos: [escudo] }
checar('de escudo no slot, também perde', defesaSemArmadura(mongeComEscudo) === null)

// ---------------------------------------------------------------------------
console.log('Armadura encantada é armadura')
//
// Existia uma "Armadura +1" solta no catálogo: um +1 flutuante, sem base de CA.
// Quem a equipava não estava vestindo armadura nenhuma — a CA subia 1 e mais
// nada. Num Monge o estrago era maior, porque a Defesa sem Armadura continuava
// valendo e o número saía do jeito que ninguém conseguiria explicar.

const semBase = ITENS_EQUIPAVEIS.filter(
  (i) => i.slot === 'corpo' && !i.efeitos.some((e) => e.tipo === 'caBase'),
)
checar('nenhum item de corpo é só um bônus solto', semBase.length === 0,
  semBase.map((i) => i.nome).join(', '))

const cotaMais1 = doCatalogo('Cota de Malha +1', 'x')
checar('a armadura encantada existe no catálogo', !!cotaMais1)
checar('e traz a base da armadura de verdade',
  cotaMais1?.efeitos.some((e) => e.tipo === 'caBase' && e.valor === 16),
  JSON.stringify(cotaMais1?.efeitos))
checar('além do encantamento',
  cotaMais1?.efeitos.some((e) => e.tipo === 'ca' && e.valor === 1))
checar('e sabe qual armadura é', cotaMais1?.armadura === 'Cota de Malha')

// O Monge: Defesa sem Armadura 10 + DES + SAB. Com DES 14 e SAB 14, dá 14.
const monge14 = {
  ...BASE, classe: 'Monge',
  atributos: { for: 12, des: 14, con: 14, int: 10, sab: 14, car: 8 },
  equipamentos: [],
}
checar('o Monge desarmado usa a Defesa sem Armadura',
  armorClass(monge14) === 14, `deu ${armorClass(monge14)}`)

// De Cota de Malha +1: 16 de base (a DES não conta) + 1 do encantamento = 17.
// Antes o número era 15 — a Defesa sem Armadura mais o +1 solto.
const mongeDeCota = { ...monge14, equipamentos: [{ ...cotaMais1, equipado: true }] }
checar('de armadura encantada, a base da armadura vence',
  armorClass(mongeDeCota) === 17, `deu ${armorClass(mongeDeCota)}`)
checar('e a Defesa sem Armadura para de valer',
  defesaSemArmadura(mongeDeCota) === null)
checar('a CA subiu 3, não 1',
  armorClass(mongeDeCota) - armorClass(monge14) === 3,
  `subiu ${armorClass(mongeDeCota) - armorClass(monge14)}`)

// Todo grau existe para toda armadura, e a conta bate em todas.
for (const grau of [1, 2, 3]) {
  const item = doCatalogo(`Placas +${grau}`, 'y')
  checar(`Placas +${grau} existe`, !!item)
  if (!item) continue
  const comEla = { ...BASE, atributos: { ...BASE.atributos, des: 10 }, equipamentos: [{ ...item, equipado: true }] }
  checar(`e dá CA ${18 + grau}`, armorClass(comEla) === 18 + grau, `deu ${armorClass(comEla)}`)
}

// ---------------------------------------------------------------------------
console.log('Sintonia')

const sintonizavel = arma('Espada Flamejante', 'Espada Longa', {
  sintonia: true, sintonizado: false,
  efeitos: [{ tipo: 'danoExtra', dado: '2d6', descricao: 'de fogo' }],
})
checar('vestida sem sintonizar não conta como ativa',
  itensAtivos(com(sintonizavel)).length === 0)
checar('e não produz ataque', ataquesDeArmas(com(sintonizavel)).length === 0)
const [f1] = ataquesDeArmas(com({ ...sintonizavel, sintonizado: true }))
checar('sintonizada, o dano extra aparece', f1?.dano?.includes('2d6'), `deu ${f1?.dano}`)

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de arma vestida falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de arma vestida passaram`)
