// Verifica o modo iniciante: o que cada escolha DÁ, no instante da escolha.
//
// A criação de ficha mostrava uma frase de sabor — "graciosos e longevos",
// "mestre de armas e armaduras" — e pedia a escolha mais importante do
// personagem com base nisso. Quem já joga sabe o que está por trás; quem nunca
// jogou escolhe pelo nome que soa melhor, descobre na terceira sessão que
// queria outra coisa, e refazer uma ficha de nível 5 é o tipo de coisa que faz
// gente largar o jogo.
//
// O jeito de errar aqui é o de sempre nas telas de ajuda: dizer algo plausível
// e vazio. "Ganha traços raciais" não ajuda ninguém. O teste cobra que a linha
// traga o EFEITO — e que ele venha do dado que o app já usa, para não virar uma
// segunda verdade que sai de sincronia com a regra.

import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'vant-'))
execSync(
  `npx esbuild src/lib/vantagens.ts --bundle --outdir=${dir} --format=esm --log-level=error`,
)
const { vantagensDaEspecie, vantagensDaClasse, vantagensDoAntecedente } = await import(
  pathToFileURL(join(dir, 'vantagens.js')).href
)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const texto = (lista) => lista.map((v) => `${v.nome}: ${v.texto}`).join(' | ')

// ---------------------------------------------------------------------------
console.log('A espécie diz o que dá')

const elfo = vantagensDaEspecie('Elfo')
console.log('  Elfo:', texto(elfo).slice(0, 200))
checar('o Elfo tem vantagens listadas', elfo.length >= 4, String(elfo.length))
checar('e a visão no escuro está lá com a distância',
  elfo.some((v) => /18 m/.test(v.texto)), texto(elfo))
checar('e o Transe diz as 4 horas',
  elfo.some((v) => /4 horas/.test(v.texto)))

const halfling = vantagensDaEspecie('Halfling')
// É o exemplo perfeito do que faz diferença: "Sortudo" não diz nada; "rerrole
// todo 1 natural" decide a escolha.
checar('o Sortudo do Halfling explica o efeito',
  halfling.some((v) => /1 natural/i.test(v.texto)), texto(halfling))

const anao = vantagensDaEspecie('Anão')
checar('o Anão traz a resistência a veneno',
  anao.some((v) => /veneno/i.test(v.texto)), texto(anao))
checar('e o PV extra por nível',
  anao.some((v) => /pontos de vida/i.test(v.texto)))

// Só o nível 1: o Draconato ganha coisa no 5 e no 11, e listar isso na escolha
// responde uma pergunta que ninguém fez ainda.
const draconato = vantagensDaEspecie('Draconato')
// O nível está no CAMPO do traço, não no texto: procurar "nível 5" na frase não
// pega nada. O que denuncia é o nome do degrau — "Sopro Ampliado" é do 5.
checar('o Draconato traz o Sopro do nível 1',
  draconato.some((v) => v.nome === 'Sopro'), texto(draconato))
checar('e NÃO traz o Sopro Ampliado, que é do 5',
  !draconato.some((v) => /Ampliado|Voo Dracônico/.test(v.nome)), texto(draconato))
checar('são exatamente os três do nível 1', draconato.length === 3, String(draconato.length))

// Todas as espécies do app precisam ter algo a dizer: uma lista vazia no meio
// de nove cheias parece defeito, e é onde a pessoa desconfia da tela inteira.
const ESPECIES = ['Humano', 'Elfo', 'Anão', 'Halfling', 'Draconato', 'Gnomo',
  'Meio-Orc / Orc', 'Tiefling', 'Aasimar', 'Golias']
for (const e of ESPECIES) {
  checar(`${e} tem pelo menos duas vantagens`, vantagensDaEspecie(e).length >= 2,
    String(vantagensDaEspecie(e).length))
}
checar('espécie que não existe devolve lista vazia',
  vantagensDaEspecie('Kender').length === 0)

// ---------------------------------------------------------------------------
console.log('\nA classe também')

const barbaro = vantagensDaClasse('Bárbaro')
console.log('  Bárbaro:', texto(barbaro).slice(0, 220))
// "d12" não diz nada a quem nunca jogou. O que diz é onde aquele número fica
// entre os outros.
checar('o dado de vida vem comparado',
  barbaro.some((v) => /d12/.test(v.texto) && /mais resistente/.test(v.texto)), texto(barbaro))
const mago = vantagensDaClasse('Mago')
checar('e o do mago avisa que ele é frágil',
  mago.some((v) => /d6/.test(v.texto) && /frágil/.test(v.texto)), texto(mago))

// O treino sai da tabela de proficiências do SRD — a mesma que decide o bônus
// do ataque. Uma segunda lista escrita à mão sairia de sincronia.
checar('o guerreiro diz que veste pesada',
  vantagensDaClasse('Guerreiro').some((v) => /pesada/.test(v.texto)),
  texto(vantagensDaClasse('Guerreiro')))
checar('e o mago diz que não veste armadura',
  mago.some((v) => /nenhuma armadura/.test(v.texto)), texto(mago))
checar('o ladino diz das marciais com acuidade',
  vantagensDaClasse('Ladino').some((v) => /acuidade/i.test(v.texto)),
  texto(vantagensDaClasse('Ladino')))

// A salvaguarda é o que salva de armadilha, magia e sopro de dragão — a
// vantagem escondida que ninguém compara.
checar('as salvaguardas aparecem por extenso',
  barbaro.some((v) => /Força e Constituição/.test(v.texto)), texto(barbaro))

// A linha das salvaguardas do mago também diz "Inteligência" — a checagem
// precisa olhar a ENTRADA de conjuração, senão passa pelo motivo errado.
const conjura = mago.find((v) => v.nome === 'Conjura magias')
checar('quem conjura diz com qual atributo',
  /Inteligência/.test(conjura?.texto ?? ''), conjura?.texto)
checar('e quem não conjura diz isso também',
  vantagensDaClasse('Guerreiro').some((v) => /Sem magia|arma, manobra/.test(v.texto)))

// As quatro linhas de base (vida, treino, salvaguarda, magia) já somam quatro:
// sem cobrar um traço pelo nome, sumir com todos eles passaria batido.
checar('os traços de nível 1 da classe entram',
  barbaro.some((v) => v.nome === 'Fúria'), texto(barbaro))
checar('e o do ladino também',
  vantagensDaClasse('Ladino').some((v) => /Ataque Furtivo/i.test(v.nome)),
  texto(vantagensDaClasse('Ladino')))

for (const c of ['Bárbaro', 'Bardo', 'Bruxo', 'Clérigo', 'Druida', 'Feiticeiro',
  'Guerreiro', 'Ladino', 'Mago', 'Monge', 'Paladino', 'Patrulheiro']) {
  checar(`${c} tem pelo menos quatro vantagens`, vantagensDaClasse(c).length >= 4,
    String(vantagensDaClasse(c).length))
}
checar('classe que não existe devolve lista vazia',
  vantagensDaClasse('Artífice').length === 0)

// ---------------------------------------------------------------------------
console.log('\nE o antecedente, que deixou de ser enfeite no 2024')

const acolito = vantagensDoAntecedente('Serviu em um templo. Perícias: Intuição e Religião.')
console.log('  Acólito:', texto(acolito).slice(0, 200))
checar('as perícias saem do resumo',
  acolito.some((v) => /Intuição e Religião/.test(v.texto)), texto(acolito))
checar('o talento de origem aparece com esse nome',
  acolito.some((v) => /talento/i.test(v.nome)), texto(acolito))
checar('e os aumentos de atributo também',
  acolito.some((v) => /\+3|\+2/.test(v.texto)))
checar('resumo sem perícias ainda rende as outras linhas',
  vantagensDoAntecedente('Um passado qualquer.').length >= 3)

// ---------------------------------------------------------------------------
console.log('\nNenhuma linha vazia ou plausível-e-oca')

const tudo = [
  ...ESPECIES.flatMap(vantagensDaEspecie),
  ...['Bárbaro', 'Mago', 'Ladino', 'Clérigo'].flatMap(vantagensDaClasse),
]
checar('toda vantagem tem nome', tudo.every((v) => v.nome.length > 2))
checar('e um texto que explica', tudo.every((v) => v.texto.length > 12),
  tudo.filter((v) => v.texto.length <= 12).map((v) => v.nome).join(', '))
checar('e um ícone', tudo.every((v) => v.icone.length > 0))
// Um ícone genérico em tudo seria o mesmo que nenhum ícone.
const genericos = tudo.filter((v) => v.icone === '•').length
checar('a maioria tem ícone próprio', genericos < tudo.length / 2,
  `${genericos} de ${tudo.length} genéricos`)

// ---------------------------------------------------------------------------
console.log('\nLigado na tela')

const wizard = readFileSync('src/pages/CharacterWizard.tsx', 'utf-8')
checar('o assistente tem o seletor de modo', wizard.includes('<SeletorDeModo'))
checar('a espécie mostra as vantagens', wizard.includes('vantagens={vantagensDaEspecie}'))
checar('a classe também', wizard.includes('vantagens={detalhado ? vantagensDaClasse(c.nome) : undefined}'))
checar('e o antecedente', wizard.includes('vantagensDoAntecedente(resumo)'))
checar('o cartão desenha a lista', wizard.includes('{v.icone}') && wizard.includes('{v.texto}'))
// Quem já sabe desliga uma vez e nunca mais vê; quem não sabe não precisa
// descobrir que o modo existe.
checar('o padrão é o modo iniciante',
  wizard.includes("localStorage.getItem(CHAVE_MODO) !== 'nao'"))
checar('e a escolha sobrevive à ficha', wizard.includes('localStorage.setItem(CHAVE_MODO'))
checar('sem armazenamento, ainda funciona', /catch \{[\s\S]{0,60}return true/.test(wizard))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de vantagens falharam`)
  process.exit(1)
}
console.log(`\n✓ ${testes} verificações de vantagens passaram`)
