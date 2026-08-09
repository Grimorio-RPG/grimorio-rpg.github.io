// Verifica a estrada: os vinte níveis do personagem, montados de uma vez.
//
// Subir de nível era um modal — aparecia, dava o que tinha, e sumia. O
// personagem não tinha arco em lugar nenhum, e "vale a pena chegar ao 11" é
// metade do que segura uma campanha longa.
//
// Esta biblioteca não inventa regra: cada número aqui já era calculado por
// outro módulo. O que ela pode errar é JUNTAR — pôr o traço no nível errado,
// perder um degrau, ou mostrar o mesmo ganho duas vezes. E errar assim não dá
// erro nenhum: produz uma estrada plausível e mentirosa.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'estrada-'))
execSync(
  `npx esbuild src/lib/progressao.ts --bundle --outdir=${dir} --format=esm --log-level=error`,
)
const { estrada, resumo, ehMarco, mostraMagia, circuloEm } = await import(
  pathToFileURL(join(dir, 'progressao.js')).href
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
  especie: 'Humano', antecedente: 'Soldado', xp: 6500,
  atributos: { for: 16, des: 12, con: 14, int: 10, sab: 12, car: 8 },
  talentos: [], magias: [], espacosMagia: [], equipamentos: [],
  ...extra,
})

// ---------------------------------------------------------------------------
console.log('São sempre vinte degraus')
//
// Cortar no nível atual transformaria a tela num histórico — e o valor dela é o
// contrário: ver o Ataque Extra chegando no 5 e a classe saltando no 11.

const nivel3 = estrada(ficha({ nivel: 3 }))
checar('vinte degraus mesmo no nível 3', nivel3.length === 20, String(nivel3.length))
checar('em ordem', nivel3.every((d, i) => d.nivel === i + 1))
checar('os três primeiros estão alcançados',
  nivel3.slice(0, 3).every((d) => d.alcancado))
checar('e o quarto não', nivel3[3].alcancado === false)
checar('o atual é exatamente um', nivel3.filter((d) => d.atual).length === 1)
checar('e é o terceiro', nivel3[2].atual === true)

// ---------------------------------------------------------------------------
console.log('O bônus de proficiência só aparece onde MUDA')
//
// Repetido em vinte linhas seria ruído com cara de informação.

const g = estrada(ficha())
const mudam = g.filter((d) => d.novoBonus != null).map((d) => d.nivel)
checar('muda em 1, 5, 9, 13 e 17', mudam.join(',') === '1,5,9,13,17', mudam.join(','))
checar('e o valor está certo no 5', g[4].novoBonus === 3, String(g[4].novoBonus))
checar('e no 17', g[16].novoBonus === 6, String(g[16].novoBonus))
checar('no 2 não aparece', g[1].novoBonus === null)

// ---------------------------------------------------------------------------
console.log('Cada traço no seu nível')

const ataqueExtra = g.find((d) => d.tracos.some((t) => /Ataque Extra/i.test(t.nome)))
checar('o Ataque Extra do guerreiro está no 5', ataqueExtra?.nivel === 5, String(ataqueExtra?.nivel))
// Um traço repetido em dois degraus é o erro mais fácil de cometer e o mais
// difícil de ver: a estrada fica só um pouco generosa demais.
const nomes = g.flatMap((d) => d.tracos.map((t) => `${d.nivel}:${t.origem}:${t.nome}`))
checar('nenhum traço aparece duas vezes', new Set(nomes).size === nomes.length)
checar('o nível 1 dá alguma coisa', g[0].tracos.length > 0)
checar('e a escolha de subclasse está marcada',
  g.some((d) => d.temEscolha), 'nenhum nível pede escolha')

// "Pede escolha" e "a escolha está em aberto" são coisas diferentes, e a
// diferença é a que a tela precisa: o nível 3 SEMPRE pede uma subclasse, mas
// quem já escolheu a dele não pode continuar lendo "precisa escolher" para
// sempre. Um aviso que nunca some é um aviso que se aprende a ignorar — e aí o
// que está pendente de verdade some junto.
const semSubclasse = estrada(ficha({ nivel: 5, subclasse: '' }))
const comSubclasse = estrada(ficha({ nivel: 5, subclasse: 'Campeão (Champion)' }))
checar('o nível 3 sempre PEDE subclasse',
  semSubclasse[2].temEscolha === true && comSubclasse[2].temEscolha === true)
checar('quem não escolheu tem pendência', semSubclasse[2].escolhaPendente === true)
checar('quem já escolheu NÃO tem', comSubclasse[2].escolhaPendente === false)
// No futuro nada está pendente ainda: o nível 8 pede um Aumento de Atributo
// que ainda nem chegou.
checar('nível futuro nunca fica pendente',
  semSubclasse.filter((d) => !d.alcancado).every((d) => d.escolhaPendente === false))

// ---------------------------------------------------------------------------
console.log('A magia entra só para quem conjura')

const mago = estrada(ficha({ classe: 'Mago', nivel: 4 }))
const abre3 = mago.find((d) => d.circuloNovo === 3)
checar('o mago abre o 3º círculo no nível 5', abre3?.nivel === 5, String(abre3?.nivel))
checar('o 1º círculo abre no nível 1', mago[0].circuloNovo === 1)
checar('o mago aprende 2 magias por nível', mago[3].magiasNovas === 2, String(mago[3].magiasNovas))
checar('e ganha truque no 4', mago[3].truquesNovos === 1)
checar('mas não no 3', mago[2].truquesNovos === 0)

checar('o guerreiro não abre círculo nenhum', g.every((d) => d.circuloNovo === 0))
checar('nem aprende magia', g.every((d) => d.magiasNovas === 0))
checar('e a tela sabe esconder a linha de magia dele',
  mostraMagia(ficha()) === false)
checar('mas mostra para o mago', mostraMagia(ficha({ classe: 'Mago' })) === true)

// Bardo tem lista fixa: o que ele ganha por nível é a LISTA, não um livro.
const bardo = estrada(ficha({ classe: 'Bardo', nivel: 4 }))
checar('o bardo aprende magia ao subir', bardo[1].magiasNovas > 0, String(bardo[1].magiasNovas))
// Clérigo prepara no descanso longo: ele não aprende nada ao subir, só passa a
// caber mais. Cobrar escolha dele na subida seria pedir o que ele refaz de manhã.
const clerigo = estrada(ficha({ classe: 'Clérigo', nivel: 4 }))
checar('o clérigo NÃO aprende magia ao subir',
  clerigo.every((d) => d.magiasNovas === 0),
  clerigo.filter((d) => d.magiasNovas > 0).map((d) => d.nivel).join(','))
checar('mas passa a caber mais', clerigo[1].preparadasNovas > 0)

checar('circuloEm acompanha o nível', circuloEm(ficha({ classe: 'Mago' }), 5) === 3)
checar('e é zero para quem não conjura', circuloEm(ficha(), 20) === 0)

// ---------------------------------------------------------------------------
console.log('O que ESTE personagem tirou')
//
// É o que separa a estrada de uma tabela de classe impressa: o nível 7 do seu
// bárbaro deu 9 PV, rolados.

const comHistorico = estrada(ficha({
  nivel: 3,
  historicoNiveis: [
    { nivel: 2, pvGanho: 7, rolado: false },
    { nivel: 3, pvGanho: 9, rolado: true },
  ],
}))
checar('o PV do nível 2 aparece', comHistorico[1].pvGanho === 7)
checar('o do 3 também', comHistorico[2].pvGanho === 9)
checar('e diz que o 3 foi rolado', comHistorico[2].pvRolado === true)
checar('e que o 2 foi média', comHistorico[1].pvRolado === false)
// Nível alcançado sem registro é o normal de quem já jogava antes disto. Não
// pode virar zero: zero seria um PV ganho de zero, que é outra coisa.
checar('nível alcançado sem registro fica sem número', comHistorico[0].pvGanho === null)
checar('e nível futuro também', comHistorico[9].pvGanho === null)

// ---------------------------------------------------------------------------
console.log('O que vem a seguir')

const r = resumo(ficha({ nivel: 5 }))
checar('faltam 15 para o 20', r.faltam === 15, String(r.faltam))
checar('o próximo é o 6', r.proximo?.nivel === 6)
// "Próximo marco" não é "próximo nível". O ladino de nível 5 tem o 6 morto —
// nada de traço, nada de bônus novo — e a resposta certa para "o que vem?" é
// apontar para o 7, não para o degrau vazio da frente. Um guerreiro serviria
// para o teste passar por sorte: o 6 dele muda alguma coisa.
const ladino5 = resumo(ficha({ classe: 'Ladino', nivel: 5 }))
checar('o próximo do ladino 5 é o 6', ladino5.proximo?.nivel === 6)
checar('mas o 6 dele não muda nada', ehMarco(ladino5.proximo) === false)
checar('então o próximo marco PULA o 6', ladino5.proximoMarco?.nivel === 7,
  String(ladino5.proximoMarco?.nivel))
checar('e o marco muda algo de verdade', ehMarco(ladino5.proximoMarco))
checar('o próximo marco é sempre para a frente', (r.proximoMarco?.nivel ?? 0) > 5)

const noVinte = resumo(ficha({ nivel: 20 }))
checar('no 20 não falta nada', noVinte.faltam === 0)
checar('e não há próximo', noVinte.proximo === null)
checar('nem próximo marco', noVinte.proximoMarco === null)

const somado = resumo(ficha({
  nivel: 3,
  historicoNiveis: [
    { nivel: 2, pvGanho: 7, rolado: false },
    { nivel: 3, pvGanho: 9, rolado: true },
  ],
}))
checar('soma o PV registrado', somado.pvRegistrado === 16, String(somado.pvRegistrado))
checar('e conta as subidas feitas aqui', somado.niveisRegistrados === 2)
checar('sem histórico, soma zero', resumo(ficha()).pvRegistrado === 0)

// ---------------------------------------------------------------------------
console.log('Nível morto não é marco')

const mortos = estrada(ficha({ classe: 'Ladino' })).filter((d) => !ehMarco(d))
checar('existe nível que não muda nada', mortos.length > 0)
checar('e ele não tem traço', mortos.every((d) => d.tracos.length === 0))
checar('nem bônus novo', mortos.every((d) => d.novoBonus === null))

// ---------------------------------------------------------------------------
console.log('Ficha esquisita não quebra a estrada')

checar('sem classe, ainda dá vinte degraus', estrada(ficha({ classe: '' })).length === 20)
checar('sem histórico nenhum, ninguém tem PV', estrada(ficha({ historicoNiveis: undefined })).every((d) => d.pvGanho === null))
checar('nível 1 tem estrada', estrada(ficha({ nivel: 1 })).length === 20)
checar('nível 20 tem estrada', estrada(ficha({ nivel: 20 })).filter((d) => d.alcancado).length === 20)

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de progressão falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de progressão passaram`)
