// Verifica a edição das regras: 5.0 ou 5.5, e o que a mesa aceita de fora.
//
// São DUAS perguntas, e tratá-las como uma só é o erro que este módulo evita:
//
// 1. Com que REGRA se calcula. Uma só por mesa — meia regra produz uma ficha
//    plausível e errada, que é o pior defeito que este app sabe produzir.
// 2. De onde pode vir o CONTEÚDO. "Jogo com as regras de 2024, mas deixo meu
//    jogador pegar uma subclasse de 2014" é mesa legítima, e é escolha do DM.
//
// O jeito de errar aqui é prometer o que não existe: hoje o app só tem o
// catálogo do SRD 5.2.1, e um seletor que oferece 2014 sem ter 2014 é pior do
// que seletor nenhum. Metade destas verificações é sobre isso.

import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'edic-'))
execSync(`npx esbuild src/lib/edicao.ts --bundle --outdir=${dir} --format=esm --log-level=error`)
const E = await import(pathToFileURL(join(dir, 'edicao.js')).href)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

// ---------------------------------------------------------------------------
console.log('O padrão é o que o app já é')

// 2024, porque todo o catálogo veio do SRD 5.2.1. Abrir em 2014 seria prometer
// uma coisa que não está lá.
checar('sem configurar, a mesa é 2024', E.REGRAS_PADRAO.edicao === '2024')
checar('e não aceita a outra edição', E.REGRAS_PADRAO.aceitaOutraEdicao === false)
checar('campanha antiga cai no padrão',
  JSON.stringify(E.regrasDe({})) === JSON.stringify(E.REGRAS_PADRAO), JSON.stringify(E.regrasDe({})))
checar('campanha nula também', E.regrasDe(null).edicao === '2024')
checar('campanha sem o campo também', E.regrasDe({ nome: 'X' }).edicao === '2024')

// Meio configurado: quem gravou só a edição não perde o resto.
checar('meio configurado completa com o padrão',
  E.regrasDe({ regras: { edicao: '2014' } }).aceitaOutraEdicao === false)
checar('e respeita o que foi gravado',
  E.regrasDe({ regras: { edicao: '2014' } }).edicao === '2014')

// ---------------------------------------------------------------------------
console.log('\nConteúdo sem marca é de 2024')

// Todo o catálogo de hoje veio do SRD 5.2.1. Marcar quatrocentas entradas com o
// que já é o padrão seriam quatrocentas chances de esquecer uma.
checar('item sem marca é 2024', E.edicaoDe({ nome: 'Bola de Fogo' }) === '2024')
checar('item indefinido também', E.edicaoDe(undefined) === '2024')
checar('e o marcado vale o que diz', E.edicaoDe({ edicao: '2014' }) === '2014')

// ---------------------------------------------------------------------------
console.log('\nAs duas chaves são independentes')
//
// É o pedido inteiro: "jogo com as regras de 2024, mas quero deixar meu jogador
// escolher uma subclasse de 2014".

const so2024 = { edicao: '2024', aceitaOutraEdicao: false }
const mista2024 = { edicao: '2024', aceitaOutraEdicao: true }
const so2014 = { edicao: '2014', aceitaOutraEdicao: false }
const mista2014 = { edicao: '2014', aceitaOutraEdicao: true }

const doNovo = { nome: 'Campeão', edicao: '2024' }
const doVelho = { nome: 'Mestre de Batalha (2014)', edicao: '2014' }
const semMarca = { nome: 'Ladrão' }

checar('mesa 2024 usa conteúdo de 2024', E.podeUsar(so2024, doNovo))
checar('e o sem marca, que é 2024', E.podeUsar(so2024, semMarca))
checar('mas NÃO o de 2014', !E.podeUsar(so2024, doVelho))
// A chave que o pedido criou.
checar('ligando a chave, a mesa 2024 passa a aceitar 2014', E.podeUsar(mista2024, doVelho))
checar('e continua aceitando o próprio', E.podeUsar(mista2024, doNovo))

checar('mesa 2014 usa conteúdo de 2014', E.podeUsar(so2014, doVelho))
checar('e NÃO o de 2024', !E.podeUsar(so2014, doNovo))
checar('nem o sem marca, que é 2024', !E.podeUsar(so2014, semMarca))
checar('com a chave, a mesa 2014 aceita os dois',
  E.podeUsar(mista2014, doNovo) && E.podeUsar(mista2014, doVelho))

// ---------------------------------------------------------------------------
console.log('\nA tela não promete o que não existe')

checar('o app tem conteúdo de 2024', E.temConteudo('2024') === true)
// Vira `true` no dia em que o catálogo do SRD 5.1 entrar. Enquanto for false, a
// tela precisa avisar — e a verificação abaixo cobra o aviso.
checar('e ainda NÃO tem o de 2014', E.temConteudo('2014') === false)

checar('as duas edições estão na lista', E.EDICOES.length === 2)
checar('cada uma diz o que muda',
  E.EDICOES.every((e) => e.detalhe.length > 20), JSON.stringify(E.EDICOES.map((e) => e.detalhe)))
// O detalhe precisa citar a diferença que a pessoa sente na ficha, e não uma
// frase de marketing.
checar('o 2024 fala do antecedente', /antecedente/i.test(E.EDICOES[0].detalhe))
checar('o 2014 fala da raça e das sub-raças',
  /ra[çc]a/i.test(E.EDICOES[1].detalhe) && /sub-ra[çc]a/i.test(E.EDICOES[1].detalhe))

checar('a marca curta muda com a edição',
  E.marcaDaEdicao('2024') === 'D&D 5.5e' && E.marcaDaEdicao('2014') === 'D&D 5e')
checar('e o nome longo também',
  /2024/.test(E.nomeDaEdicao('2024')) && /2014/.test(E.nomeDaEdicao('2014')))

// ---------------------------------------------------------------------------
console.log('\nLigado na tela')

const painel = readFileSync('src/components/edicao-ui.tsx', 'utf-8')
const campanha = readFileSync('src/pages/CampaignPage.tsx', 'utf-8')
const menu = readFileSync('src/components/Layout.tsx', 'utf-8')

checar('a campanha mostra o painel de regras',
  campanha.includes('<RegrasDaCampanha campaign={campaign} update={update} />'))
checar('o painel grava a edição', painel.includes("mudar({ edicao: e.valor })"))
checar('e a chave da outra edição', painel.includes('aceitaOutraEdicao: e.target.checked'))
// Um seletor que promete 2014 e entrega 2024 é pior do que seletor nenhum.
checar('e avisa quando a edição não tem conteúdo',
  painel.includes('temConteudo(e.valor)') && painel.includes('ainda não tem o conteúdo'))
// Afirmar "5.5e" numa campanha que declarou 2014 é o app se contradizendo no
// canto superior esquerdo de toda tela.
checar('a marca do app segue a edição escolhida',
  menu.includes('{marcaDaEdicao(edicao)}'))
checar('e lê a campanha sem carregar a campanha inteira',
  menu.includes('readRaw(CHAVES.campanha)'))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de edição falharam`)
  process.exit(1)
}
console.log(`\n✓ ${testes} verificações de edição passaram`)
