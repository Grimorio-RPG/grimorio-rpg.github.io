// Verifica os gabaritos de área: o cone, a esfera, a linha e o cubo.
//
// "A Bola de Fogo pega quem?" era resolvido com o dedo sobre o mapa e uma
// discussão — que sempre acontecia DEPOIS de alguém dizer onde ia jogar, quando
// ninguém mais consegue ser imparcial sobre se o ladino estava dentro ou fora.
//
// Errar aqui não dá erro nenhum: desenha um cone plausível e devolve uma lista
// de alvos plausível. Só que a lista está errada, e quem confiou nela perdeu
// um personagem. Por isso os números abaixo estão conferidos à mão, um a um.
//
// A geometria vem do SRD 5.2.1, "Areas of Effect".

import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'gab-'))
execSync(
  `npx esbuild src/lib/gabaritos.ts src/data/srd/areas-srd.ts --bundle --splitting --outdir=${dir} --format=esm --log-level=error`,
)
const carregar = (f) => import(pathToFileURL(join(dir, f)).href)
const { contorno, pega, apanhados, rotulo, emMetros, METROS_POR_QUADRADO } =
  await carregar('lib/gabaritos.js')
const { AREAS_SRD } = await carregar('data/srd/areas-srd.js')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}
const perto = (a, b, folga = 0.001) => Math.abs(a - b) < folga
const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y)

const alvo = (id, x, y, tamanho = 1) => ({ id, x, y, tamanho })
const cone = (q, mira = { x: 1, y: 0 }, origem = { x: 0, y: 0 }) =>
  ({ tipo: 'cone', origem, mira, quadrados: q })
const esfera = (q, origem) => ({ tipo: 'esfera', origem, mira: origem, quadrados: q })
const linha = (q, largura, origem = { x: 0, y: 5 }, mira = { x: 1, y: 5 }) =>
  ({ tipo: 'linha', origem, mira, quadrados: q, largura })
const cubo = (q, mira, origem = { x: 5, y: 5 }) => ({ tipo: 'cubo', origem, mira, quadrados: q })

// ---------------------------------------------------------------------------
console.log('O cone, que é onde quase toda ferramenta erra')
//
// SRD: "A Cone's width at any point along its length is equal to that point's
// distance from the point of origin", e o comprimento é medido no EIXO. A boca
// de um cone de 6 quadrados tem 6 de largura, e os cantos ficam a 6,7 da ponta.
// Desenhar dois raios de 6 girados de um ângulo qualquer dá uma boca de 5,4 —
// um cone estreito demais, que deixa de fora quem o livro pega.

const c = contorno(cone(6))
checar('o cone é um triângulo', c.length === 3, String(c.length))
checar('com a ponta na origem', c[0].x === 0 && c[0].y === 0)
checar('a boca tem a largura do comprimento', perto(dist(c[1], c[2]), 6), String(dist(c[1], c[2])))
checar('e os cantos ficam a 6,708 da ponta',
  perto(dist(c[0], c[1]), Math.hypot(6, 3)), String(dist(c[0], c[1])))
checar('o eixo alcança exatamente o comprimento',
  perto((c[1].x + c[2].x) / 2, 6), String((c[1].x + c[2].x) / 2))

// Um cone de 30 pés (6 quadrados) apontado para a direita, a partir de (0,0).
checar('pega quem está no eixo', pega(cone(6), alvo('a', 4, 0)))
checar('pega quem está na borda da boca', pega(cone(6), alvo('b', 5.5, 2.9)))
checar('não pega quem está atrás', !pega(cone(6), alvo('c', -2, 0)))
checar('nem quem passou da boca', !pega(cone(6), alvo('d', 6.6, 0)))
checar('nem quem está longe do lado', !pega(cone(6), alvo('e', 3, 4)))

// Diagonal: a mesa aponta o cone para qualquer lado, e não só para os eixos.
const diagonal = cone(6, { x: 1, y: 1 })
checar('o cone na diagonal pega quem está na diagonal', pega(diagonal, alvo('f', 4, 4)))
checar('e não pega quem ficou para trás', !pega(diagonal, alvo('g', -1, -1)))
checar('nem quem está do outro lado', !pega(diagonal, alvo('h', 4, -4)))

// ---------------------------------------------------------------------------
console.log('\nA esfera, e o gigante pego pela beirada')

const bola = esfera(4, { x: 10, y: 10 })
checar('pega quem está dentro', pega(bola, alvo('a', 12, 10)))
checar('pega quem encosta na borda', pega(bola, alvo('b', 14, 10)))
checar('não pega quem está fora', !pega(bola, alvo('c', 14.6, 10)))

// O critério do livro é a área TOCAR o espaço da criatura, e não o centro do
// token. Um gigante ocupa nove quadrados: usar o centro tiraria da Bola de Fogo
// metade dos monstros grandes, que são atingidos com folga pela beirada.
const gigante = alvo('gigante', 15.4, 10, 3)
checar('o gigante é pego pela beirada', pega(bola, gigante))
checar('mesmo com o centro dele fora do raio', dist({ x: 10, y: 10 }, gigante) > 4,
  String(dist({ x: 10, y: 10 }, gigante)))
checar('mas não quando nem a beirada alcança', !pega(bola, alvo('gigante2', 16, 10, 3)))

// ---------------------------------------------------------------------------
console.log('\nA linha, e a largura que muda quem sobra')

const relampago = linha(20, 1)
checar('pega quem está na linha', pega(relampago, alvo('a', 10, 5)))
checar('pega quem encosta na borda', pega(relampago, alvo('b', 10, 5.9)))
checar('não pega quem está ao lado', !pega(relampago, alvo('c', 10, 6.2)))
checar('pega até o fim', pega(relampago, alvo('d', 20.4, 5)))
checar('e não além dele', !pega(relampago, alvo('e', 20.6, 5)))
checar('nem antes do começo', !pega(relampago, alvo('f', -0.6, 5)))

// A Rajada de Vento tem 10 pés de largura, e é a diferença entre pegar e não.
const rajada = linha(12, 2)
checar('a linha larga pega quem a estreita não pegava', pega(rajada, alvo('g', 8, 6.2)))
checar('e ainda assim tem limite', !pega(rajada, alvo('h', 8, 7.2)))

const contornoLinha = contorno(relampago)
checar('a linha é um retângulo', contornoLinha.length === 4)
checar('com o comprimento certo',
  perto(dist(contornoLinha[0], contornoLinha[1]), 20), String(dist(contornoLinha[0], contornoLinha[1])))
checar('e a largura certa',
  perto(dist(contornoLinha[0], contornoLinha[3]), 1), String(dist(contornoLinha[0], contornoLinha[3])))

// ---------------------------------------------------------------------------
console.log('\nO cubo, que cresce da face e fica preso à grade')
//
// O livro põe a origem numa FACE do cubo, não no centro, e o cubo cresce dali
// para onde se aponta. Ele fica preso aos eixos porque é assim que se coloca
// numa mesa de verdade — um quadrado torto sobre a grade não se conta com o
// dedo.

const paraDireita = cubo(4, { x: 9, y: 5 })
checar('o cubo tem quatro cantos', contorno(paraDireita).length === 4)
checar('pega quem está dentro', pega(paraDireita, alvo('a', 7, 6)))
checar('pega no canto', pega(paraDireita, alvo('b', 8.5, 6.5)))
checar('não pega além do lado', !pega(paraDireita, alvo('c', 9.6, 5)))
checar('nem atrás da face de origem', !pega(paraDireita, alvo('d', 4.4, 5)))

const paraBaixo = cubo(4, { x: 5, y: 9 })
checar('apontado para baixo, o cubo desce', pega(paraBaixo, alvo('e', 5, 8.5)))
checar('e não vai mais para a direita', !pega(paraBaixo, alvo('f', 8, 5)))

// Mira quase na horizontal cai no eixo horizontal: a grade não tem diagonal.
const quaseHorizontal = cubo(4, { x: 9, y: 5.4 })
checar('a mira torta cai no eixo mais próximo',
  JSON.stringify(contorno(quaseHorizontal)) === JSON.stringify(contorno(paraDireita)))

// ---------------------------------------------------------------------------
console.log('\nOs casos que aparecem enquanto o dedo está no mapa')

// No instante em que o dedo encosta, mira e origem são o mesmo ponto. Sem uma
// direção padrão o cone vira um ponto e some — justo quando precisa aparecer.
const parado = { tipo: 'cone', origem: { x: 3, y: 3 }, mira: { x: 3, y: 3 }, quadrados: 6 }
const cParado = contorno(parado)
checar('o cone sem direção continua desenhável', cParado.length === 3)
checar('e tem área de verdade', perto(dist(cParado[1], cParado[2]), 6))
checar('e pega alguém', pega(parado, alvo('a', 6, 3)))

checar('gabarito de tamanho zero não pega ninguém', !pega(cone(0), alvo('a', 1, 0)))
checar('e a lista dele sai vazia', apanhados(cone(0), [alvo('a', 1, 0)]).length === 0)
// O caso que o zero realmente cria: uma esfera de raio zero em cima de alguém.
// A distância dá zero, zero não é maior que zero, e a área "pega" quem está
// embaixo dela — de um gabarito que não existe.
checar('nem quem está exatamente em cima da origem',
  !pega(esfera(0, { x: 5, y: 5 }), alvo('b', 5, 5)))

// ---------------------------------------------------------------------------
console.log('\nA pergunta de verdade: quem a magia pega')

// Uma Bola de Fogo no meio de dois goblins, com o ladino do grupo a cinco
// quadrados. É a conta que a mesa faz de cabeça e erra a favor de quem está
// perguntando.
const mesa = [
  alvo('goblin1', 8, 10),
  alvo('goblin2', 12, 10),
  alvo('ogro', 10, 12, 2),
  alvo('ladino', 15.5, 10),
  alvo('mago', 10, 20),
]
const pegos = apanhados(esfera(4, { x: 10, y: 10 }), mesa).map((a) => a.id)
checar('a bola pega os dois goblins e o ogro',
  JSON.stringify(pegos) === JSON.stringify(['goblin1', 'goblin2', 'ogro']), pegos.join(', '))
checar('o ladino escapa por pouco', !pegos.includes('ladino'))
checar('e o mago nem chega perto', !pegos.includes('mago'))
checar('a lista devolve os próprios alvos',
  apanhados(esfera(4, { x: 10, y: 10 }), mesa)[0] === mesa[0])

// ---------------------------------------------------------------------------
console.log('\nAs duas unidades da mesa')
//
// Quadrados para quem está com a grade na frente, metros para quem está lendo a
// magia. O app existe para as duas mesas ao mesmo tempo.

checar('um quadrado são 1,5 m', METROS_POR_QUADRADO === 1.5)
checar('quatro quadrados são 6 m', emMetros(4) === 6)
checar('três quadrados são 4,5 m', emMetros(3) === 4.5)
checar('e vinte são 30 m', emMetros(20) === 30)
checar('a esfera se descreve nas duas',
  rotulo(esfera(4, { x: 0, y: 0 })) === 'Esfera de 4 q · 6 m',
  rotulo(esfera(4, { x: 0, y: 0 })))
checar('a linha ainda diz a largura',
  rotulo(linha(20, 1)) === 'Linha de 20 q · 30 m, 1 q de largura', rotulo(linha(20, 1)))
checar('e o cone se descreve', rotulo(cone(6)) === 'Cone de 6 q · 9 m', rotulo(cone(6)))

// ---------------------------------------------------------------------------
console.log('\nAs áreas das magias, lidas do SRD')

const acha = (n) => AREAS_SRD.find((a) => a.nome === n)
const DO_LIVRO = [
  ['Bola de Fogo', 'esfera', 4, undefined],       // 20-foot radius
  ['Cone de Frio', 'cone', 12, undefined],        // 60-foot Cone
  ['Mãos Flamejantes', 'cone', 3, undefined],     // 15-foot Cone
  ['Relâmpago', 'linha', 20, 1],                  // 100 ft long, 5 ft wide
  ['Rajada de Vento', 'linha', 12, 2],            // 60 ft long, 10 ft wide
  ['Raio Solar', 'linha', 12, 1],                 // 5 ft wide, 60 ft long
  ['Onda Trovejante', 'cubo', 3, undefined],      // 15-foot Cube
  ['Círculo da Morte', 'esfera', 12, undefined],  // 60-foot radius
  ['Golpe Flamejante', 'esfera', 2, undefined],   // cilindro de 10 ft de raio
]
for (const [nome, tipo, quadrados, largura] of DO_LIVRO) {
  const a = acha(nome)
  checar(`${nome}: ${tipo} de ${quadrados} q`,
    a?.tipo === tipo && a?.quadrados === quadrados && a?.largura === largura,
    a ? `${a.tipo} de ${a.quadrados} q, largura ${a.largura}` : '(não achei)')
}

// O cilindro visto de cima é um círculo, e a emanação também. O rótulo guarda a
// palavra do livro porque é ela que a mesa vai procurar.
checar('o cilindro vira esfera mas se chama cilindro', acha('Golpe Flamejante')?.forma === 'Cilindro')
checar('e a Bola de Fogo se chama esfera', acha('Bola de Fogo')?.forma === 'Esfera')

const TIPOS = ['cone', 'esfera', 'linha', 'cubo']
checar('toda área tem um tipo desenhável', AREAS_SRD.every((a) => TIPOS.includes(a.tipo)))
checar('e nenhuma tem tamanho zero', AREAS_SRD.every((a) => a.quadrados >= 1))
checar('nenhuma magia repetida',
  new Set(AREAS_SRD.map((a) => a.nome)).size === AREAS_SRD.length)
checar('todas com nome em português',
  AREAS_SRD.every((a) => a.nome !== a.original),
  AREAS_SRD.filter((a) => a.nome === a.original).map((a) => a.original).join(', '))
checar('a lista vale a pena', AREAS_SRD.length >= 60, String(AREAS_SRD.length))
// Só a linha tem largura: dar largura a um cone seria desenhar outra coisa.
checar('largura só na linha',
  AREAS_SRD.every((a) => a.largura === undefined || a.tipo === 'linha'))

// ---------------------------------------------------------------------------
console.log('\nLigado na tela')

const tabuleiro = readFileSync('src/components/tabuleiro.tsx', 'utf-8')
const gabaritoUi = readFileSync('src/components/gabarito-ui.tsx', 'utf-8')
const batalha = readFileSync('src/pages/BattlePage.tsx', 'utf-8')

checar('o tabuleiro desenha o contorno', tabuleiro.includes('contorno(gabarito)'))
checar('e marca quem a área pega', tabuleiro.includes('apanhados('))
checar('a ferramenta de área existe', tabuleiro.includes("'area'"))
// O gabarito é do DM. Mostrar o desenho no aparelho do jogador entregaria de
// graça onde a Bola de Fogo vai cair, antes de ela cair — e é o mesmo tipo de
// vazamento que a projeção da cena já cuida em todo o resto.
checar('o desenho para na visão de jogador',
  tabuleiro.includes('if (visaoJogador || !forma || !area) return null'))
checar('e o painel também', batalha.includes("{!visaoJogador && ferramenta === 'area' && ("))
checar('a batalha só liga o gabarito com a ferramenta escolhida',
  batalha.includes("forma={ferramenta === 'area' ? forma : undefined}"))
// O tabuleiro calcula e o painel mostra: quem tem as coordenadas em quadrados é
// o tabuleiro, e duplicar a conta lá fora seria duas verdades sobre a mesma
// pergunta.
checar('o tabuleiro entrega a lista', batalha.includes('onDentroDaArea={setNaArea}'))
checar('e o painel a recebe', batalha.includes('<QuemAArea dentro={naArea} />'))
// A pergunta antes de soltar uma Bola de Fogo nunca é quantos goblins ela pega
// — é se o ladino está dentro.
checar('o painel separa aliado de inimigo', gabaritoUi.includes("origem === 'inimigo'"))
checar('e grita o fogo amigo', gabaritoUi.includes('Fogo amigo'))
// Os números do livro estão todos na tabela extraída; digitar "6" de cabeça é
// exatamente onde o erro entra.
checar('as magias do SRD alimentam o seletor',
  gabaritoUi.includes("import { AREAS_SRD } from '../data/srd/areas-srd'"))
checar('e escolher uma troca a forma inteira',
  gabaritoUi.includes('setForma({ tipo: a.tipo, quadrados: a.quadrados, largura: a.largura })'))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de gabarito falharam`)
  process.exit(1)
}
console.log(`\n✓ ${testes} verificações de gabarito passaram`)
