// Verifica que o equipamento vestido MUDA a ficha.
//
// Os itens mágicos do app eram texto: "Anel de Proteção: +1 na CA e em todas as
// salvaguardas". Ninguém somava por você, e a conta acabava na cabeça da
// pessoa — foi assim que a CA do Thorn divergiu do D&D Beyond.
//
// O caso que mais importa aqui é o bônus CONDICIONAL: uma espada que dá +2
// contra goblinoides não pode entrar no total, senão a ficha mente em toda luta
// que não for contra goblinoide.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'equip-'))
const compilar = (entrada, saida) => {
  const alvo = join(dir, saida)
  execSync(`npx esbuild ${entrada} --bundle --outfile=${alvo} --format=esm --log-level=error`)
  return import(pathToFileURL(alvo).href)
}

const {
  bonusDeEquipamento, atributoComEquipamento, equipar, desequipar,
  excedeSintonia, porSlot, itensAtivos, descreveEfeito, LIMITE_SINTONIA, SLOTS, BONECA,
  alvoCasa, bonusContra, temBonusContra,
} = await compilar('src/lib/equipamento.ts', 'equipamento.js')
const { armorClass, armorClassDetalhe, saveBonus, skillBonus, atributoEfetivo } =
  await compilar('src/lib/calc.ts', 'calc.js')
const { normalizeCharacter } = await compilar('src/lib/character.ts', 'character.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const item = (nome, slot, efeitos, extra = {}) => ({
  id: nome, nome, slot, efeitos, equipado: true, ...extra,
})

const BASE = {
  id: 'c1', nome: 'Thorn', nivel: 5,
  atributos: { for: 16, des: 14, con: 14, int: 10, sab: 12, car: 8 },
  classeArmaduraManual: null, armaduraEquipada: '', escudoEquipado: false,
  talentos: [], salvaguardasProficientes: ['for'], periciasProficientes: ['atletismo'],
  periciasExpertise: [], pvMax: 40, pvAtual: 40, iniciativaBonus: 0,
  atributoConjuracao: null, equipamentos: [],
}
const com = (...itens) => ({ ...BASE, equipamentos: itens })

// ---------------------------------------------------------------------------
console.log('Classe de Armadura')

checar('sem nada: 10 + DES', armorClass(BASE) === 12, `deu ${armorClass(BASE)}`)

const cota = item('Cota de Malha', 'corpo', [{ tipo: 'caBase', valor: 16, maxDes: 0 }])
checar('armadura pesada zera a DES', armorClass(com(cota)) === 16, `deu ${armorClass(com(cota))}`)

const couro = item('Couro Batido', 'corpo', [{ tipo: 'caBase', valor: 12, maxDes: null }])
checar('armadura leve soma a DES toda', armorClass(com(couro)) === 14)

const anel = item('Anel de Proteção', 'anel1', [
  { tipo: 'ca', valor: 1 },
  { tipo: 'salvaguarda', valor: 1 },
], { sintonia: true, sintonizado: true })
checar('o anel soma na CA', armorClass(com(couro, anel)) === 15)
checar('e nas salvaguardas', saveBonus(com(anel), 'des') === 3, `deu ${saveBonus(com(anel), 'des')}`)
checar('inclusive nas que já têm proficiência',
  saveBonus(com(anel), 'for') === 3 + 3 + 1, `deu ${saveBonus(com(anel), 'for')}`)

// Duas armaduras não somam: vestir uma tira a outra, mas se o dado vier torto
// (importado, editado à mão) a maior vence em vez de somarem.
const duas = { ...BASE, equipamentos: [cota, couro] }
checar('duas bases não somam, vence a maior', armorClass(duas) === 16, `deu ${armorClass(duas)}`)

checar('a CA continua explicável', armorClassDetalhe(com(couro, anel)).includes('Couro Batido'))

// Os campos antigos não chegam mais até aqui: viram item na entrada da ficha.
// Continuam funcionando para quem já preencheu — só que por conversão, e não
// por uma segunda conta que podia discordar da primeira.
checar('o campo antigo vira item e a CA sai igual',
  armorClass(normalizeCharacter({ ...BASE, armaduraEquipada: 'Cota de Malha' })) === 16)
// E o que a pessoa VESTE vence o campo antigo.
checar('o slot vence o campo antigo',
  armorClass(normalizeCharacter({ ...BASE, armaduraEquipada: 'Cota de Malha', equipamentos: [couro] })) === 14)
// Sem passar pela entrada, o campo antigo é só um campo — é o que garante que
// existe UMA fonte, e não duas concordando por acaso.
checar('e sozinho, sem converter, não mexe na CA',
  armorClass({ ...BASE, armaduraEquipada: 'Cota de Malha' }) === 12)

// ---------------------------------------------------------------------------
console.log('Atributos')

const cinto = item('Cinto de Força de Gigante', 'cinto', [
  { tipo: 'atributoFixo', atributo: 'for', valor: 21 },
], { sintonia: true, sintonizado: true })
checar('o cinto DEFINE a Força', atributoComEquipamento(com(cinto), 'for') === 21)

const bracadeira = item('Braçadeira', 'maos', [{ tipo: 'atributo', atributo: 'for', valor: 2 }])
// Fixar e somar não se misturam: 21 continua sendo 21, não 23.
checar('somar não empilha sobre o fixado',
  atributoComEquipamento(com(cinto, bracadeira), 'for') === 21,
  `deu ${atributoComEquipamento(com(cinto, bracadeira), 'for')}`)
checar('mas sem o cinto, a soma vale',
  atributoComEquipamento(com(bracadeira), 'for') === 18)

// O que depende do atributo precisa mudar junto — foi por isso que a conta
// virou uma função só.
checar('a perícia acompanha o atributo',
  skillBonus(com(cinto), 'atletismo') === 5 + 3, `deu ${skillBonus(com(cinto), 'atletismo')}`)
checar('e a salvaguarda também',
  saveBonus(com(cinto), 'for') === 5 + 3, `deu ${saveBonus(com(cinto), 'for')}`)
checar('atributoEfetivo e atributoComEquipamento concordam',
  atributoEfetivo(com(cinto), 'for') === atributoComEquipamento(com(cinto), 'for'))

// ---------------------------------------------------------------------------
console.log('O bônus que não vale sempre')
//
// A espada do exemplo: +2 para acertar e +2 de dano CONTRA goblinoides.

const espada = item('Espada Matadora de Goblins', 'maoPrincipal', [
  { tipo: 'ataque', valor: 2, contra: 'goblinoide' },
  { tipo: 'dano', valor: 2, contra: 'goblinoide' },
])
const b = bonusDeEquipamento(com(espada))

checar('não entra no ataque geral', b.ataque === 0, `entrou ${b.ataque}`)
checar('nem no dano geral', b.dano === 0, `entrou ${b.dano}`)
checar('e fica guardado como condicional', b.condicionais.length === 1)
checar('com o alvo certo', b.condicionais[0].contra === 'goblinoide')
checar('e os dois bônus juntos',
  b.condicionais[0].ataque === 2 && b.condicionais[0].dano === 2,
  JSON.stringify(b.condicionais[0]))
checar('dizendo de qual item veio',
  b.condicionais[0].fontes.includes('Espada Matadora de Goblins'))

// Uma espada +1 comum entra no total; a condicional continua à parte.
const maisUm = item('Espada +1', 'maoSecundaria', [
  { tipo: 'ataque', valor: 1 },
  { tipo: 'dano', valor: 1 },
])
const b2 = bonusDeEquipamento(com(espada, maisUm))
checar('o bônus incondicional entra no total', b2.ataque === 1 && b2.dano === 1)
checar('e o condicional continua separado', b2.condicionais[0].ataque === 2)

// Dois itens contra o mesmo tipo somam entre si.
const arco = item('Arco Caçador', 'maoSecundaria', [
  { tipo: 'dano', valor: 1, contra: 'Goblinoide' },
])
const b3 = bonusDeEquipamento(com(espada, arco))
checar('mesmo alvo escrito diferente vira um só',
  b3.condicionais.length === 1 && b3.condicionais[0].dano === 3,
  JSON.stringify(b3.condicionais))

// Dano extra em dado — a Espada Flamejante.
const flamejante = item('Espada Flamejante', 'maoPrincipal', [
  { tipo: 'danoExtra', dado: '2d6', descricao: 'de fogo' },
], { sintonia: true, sintonizado: true })
checar('dano em dado entra separado do plano',
  bonusDeEquipamento(com(flamejante)).danoExtra[0].dado === '2d6')

// ---------------------------------------------------------------------------
console.log('Casar o alvo')
//
// O item diz uma palavra; a criatura vem com a linha inteira do bloco de
// estatísticas. Exigir igualdade faria o bônus nunca disparar — o mesmo que
// não existir.

checar('palavra do item dentro do tipo da criatura',
  alvoCasa('goblinoide', 'Humanoide Pequeno (goblinoide), neutro e mau'))
checar('ignora maiúscula', alvoCasa('Goblinoide', 'humanoide (goblinoide)'))
checar('ignora acento', alvoCasa('dragao', 'Dragão Grande, caótico e mau'))
checar('e no sentido contrário também', alvoCasa('Dragão vermelho', 'dragão'))
checar('plural do item acha o singular da criatura',
  alvoCasa('goblinoides', 'Humanoide (goblinoide)'))

checar('tipo diferente não casa', !alvoCasa('goblinoide', 'Morto-vivo Médio'))
checar('vazio não casa com nada', !alvoCasa('', 'Humanoide'))
checar('nem o contrário', !alvoCasa('goblinoide', ''))
// Duas letras não podem virar coringa: "or" não pode casar com "Morto-vivo".
checar('pedaço curto demais não vira coringa', !alvoCasa('ors', 'Morto-vivo'))

// ---------------------------------------------------------------------------
console.log('O bônus chegando no alvo')

const goblin = 'Humanoide Pequeno (goblinoide), neutro e mau'
const contraGoblin = bonusContra(com(espada), goblin)
checar('a espada soma contra goblinoide',
  contraGoblin.ataque === 2 && contraGoblin.dano === 2, JSON.stringify(contraGoblin))
checar('e diz de onde veio', contraGoblin.fontes.includes('Espada Matadora de Goblins'))
checar('temBonusContra reconhece', temBonusContra(contraGoblin))

const contraOutro = bonusContra(com(espada), 'Morto-vivo Médio')
checar('não soma contra outro tipo', contraOutro.ataque === 0 && contraOutro.dano === 0)
checar('e temBonusContra diz que não há', !temBonusContra(contraOutro))

// Dois itens contra o mesmo tipo somam ao bater.
const dois = bonusContra(com(espada, arco), goblin)
checar('dois itens contra o mesmo tipo somam', dois.dano === 3, `deu ${dois.dano}`)

// Dano em dado condicional — a Matadora de Gigantes.
const matadora = item('Matadora de Gigantes', 'maoPrincipal', [
  { tipo: 'ataque', valor: 1 },
  { tipo: 'danoExtra', dado: '2d6', contra: 'gigante' },
])
const contraGigante = bonusContra(com(matadora), 'Gigante Enorme (gigante da colina)')
checar('o dado extra condicional aparece', contraGigante.danoExtra[0] === '2d6')
checar('o +1 comum não entra no condicional', contraGigante.ataque === 0)
checar('mas continua no total geral', bonusDeEquipamento(com(matadora)).ataque === 1)

// Sem equipamento nenhum, nada quebra.
checar('ficha sem equipamento devolve zeros',
  !temBonusContra(bonusContra({ ...BASE, equipamentos: undefined }, goblin)))

// ---------------------------------------------------------------------------
console.log('Vestir e tirar')

const guardado = { ...anel, id: 'a2', nome: 'Anel de Fogo', equipado: false }
const lista = [anel, { ...guardado, slot: 'anel1' }]

// Vestir o segundo anel no mesmo dedo tira o primeiro — senão dois anéis
// somariam CA para sempre.
const trocado = equipar(lista, 'a2')
checar('vestir tira o que ocupava o lugar',
  trocado.find((e) => e.id === 'a2').equipado && !trocado.find((e) => e.id === 'Anel de Proteção').equipado)

checar('tirar não mexe no resto',
  desequipar(lista, 'a2').find((e) => e.id === 'Anel de Proteção').equipado)

checar('o mapa por slot mostra o que está vestido',
  porSlot(com(couro, anel)).corpo?.nome === 'Couro Batido')

// Guardado na mochila não conta.
checar('item não equipado não vale',
  bonusDeEquipamento(com({ ...anel, equipado: false })).ca === 0)

// Sintonia não feita não vale — é o erro de regra que a mesa mais deixa passar.
checar('item de sintonia sem sintonizar não vale',
  bonusDeEquipamento(com({ ...anel, sintonizado: false })).ca === 0)
checar('e nem aparece entre os ativos',
  itensAtivos(com({ ...anel, sintonizado: false })).length === 0)

// ---------------------------------------------------------------------------
console.log('Limite de sintonia')

const tres = [1, 2, 3].map((n) => ({ ...anel, id: `s${n}`, nome: `Item ${n}`, slot: `anel${n}` }))
checar('três sintonizados cabem', excedeSintonia(com(...tres)) === 0)
const quatro = [...tres, { ...anel, id: 's4', nome: 'Item 4', slot: 'cinto' }]
checar('o quarto excede', excedeSintonia(com(...quatro)) === 1)
checar('o limite é o da regra', LIMITE_SINTONIA === 3)

// ---------------------------------------------------------------------------
console.log('A boneca')
//
// Um slot criado no modelo e esquecido no desenho não dá erro nenhum: ele
// simplesmente não aparece na boneca, e a peça equipada some da vista. É a
// mesma família de defeito silencioso do "Florete" que não existia no catálogo.

const noDesenho = BONECA.flat()
for (const { slot, nome } of SLOTS) {
  checar(`"${nome}" tem lugar no corpo`, noDesenho.includes(slot))
}
checar('e a boneca não desenha slot que não existe',
  noDesenho.every((s) => SLOTS.some((x) => x.slot === s)),
  noDesenho.filter((s) => !SLOTS.some((x) => x.slot === s)).join(', '))
checar('nenhum slot aparece duas vezes',
  new Set(noDesenho).size === noDesenho.length)
checar('são três colunas em toda linha', BONECA.every((linha) => linha.length === 3))

// A coluna do meio é o eixo do corpo: cabeça em cima, pés embaixo.
const meio = BONECA.map((linha) => linha[1])
checar('a cabeça é a primeira do eixo', meio[0] === 'cabeca')
checar('e os pés a última', meio[meio.length - 1] === 'pes')
checar('as mãos ficam nas laterais',
  BONECA.some((l) => l[0] === 'maoPrincipal' && l[2] === 'maoSecundaria'))
checar('e os anéis também', BONECA.some((l) => l[0] === 'anel1' && l[2] === 'anel2'))

// ---------------------------------------------------------------------------
console.log('Texto dos efeitos')

checar('CA', descreveEfeito({ tipo: 'ca', valor: 1 }) === '+1 de CA')
checar('condicional diz contra o quê',
  descreveEfeito({ tipo: 'dano', valor: 2, contra: 'goblinoide' }) === '+2 no dano contra goblinoide')
checar('atributo fixo é dito como definição, não soma',
  descreveEfeito({ tipo: 'atributoFixo', atributo: 'for', valor: 21 }).includes('passa a 21'))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de equipamento falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de equipamento passaram`)
