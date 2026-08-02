// Verifica as projeções públicas: o que o DM publica NÃO pode conter segredo.
//
// Rode com: npm run verificar
//
// É proposital que este teste seja bruto: além de checar campo a campo, ele
// procura as palavras secretas no JSON inteiro que sairia pela rede. Se alguém
// adicionar um campo novo à ficha de um monstro e esquecer de censurá-lo, o
// teste quebra.

import { readFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

// Compila os módulos de projeção, com as dependências junto.
//
// Antes daqui o teste FATIAVA o arquivo a partir de `export function projetar`
// e compilava só o pedaço, para não arrastar `store` e o DOM. Isso deixou de
// funcionar no dia em que uma projeção passou a chamar outro módulo: o corte
// jogava fora o import e a função quebrava só na hora de rodar.
//
// Empacotar resolve e vale mais: o que o teste exercita passa a ser o módulo de
// verdade, com as dependências que ele realmente usa, e não um recorte que
// poderia se comportar diferente do que vai para o ar.
const dir = mkdtempSync(join(tmpdir(), 'proj-'))
const MODULOS = ['battle', 'campaign', 'bestiary', 'mapscene', 'mundo']
for (const arquivo of MODULOS) {
  if (!readFileSync(`src/lib/${arquivo}.ts`, 'utf8').includes('export function projetar')) {
    throw new Error(`sem projeção em ${arquivo}.ts`)
  }
}
execSync(
  `npx esbuild ${MODULOS.map((f) => `src/lib/${f}.ts`).join(' ')} ` +
    `--bundle --outdir=${dir} --format=esm --log-level=error`,
)

// pathToFileURL: no Windows um caminho absoluto (`C:\…`) não é URL válida para
// o import dinâmico — o loader ESM o lê como protocolo `c:`.
const importar = (arquivo) => import(pathToFileURL(join(dir, arquivo)).href)

const { projetarBatalha } = await importar('battle.js')
const { projetarCampanha } = await importar('campaign.js')
const { projetarBestiario } = await importar('bestiary.js')
const { projetarCena } = await importar('mapscene.js')
const { projetarMundo } = await importar('mundo.js')

let falhas = 0
let testes = 0

function checar(nome, condicao) {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}`)
}

function semVazamento(nome, saida, proibidas) {
  const json = JSON.stringify(saida)
  for (const p of proibidas) {
    checar(`${nome}: "${p}" não pode aparecer no que sai pela rede`, !json.includes(p))
  }
}

// ---------------------------------------------------------------------------
console.log('\nBatalha')
const batalha = {
  updatedAt: 1, nome: 'Emboscada', rodada: 2, turnoIndex: 0, emAndamento: true,
  combatentes: [
    {
      id: 'i1', origem: 'inimigo', refId: 'm1',
      nome: 'SEGREDO-DRAGAO-ANCIAO', imagemUrl: 'FOTO-SECRETA-DO-DM',
      imagemJogadorUrl: 'foto-publica', conhecimento: 'encontrado',
      ca: 19, pvMax: 200, pvAtual: 133, iniciativa: 15, iniciativaMod: 7,
      nomeOculto: true, condicoes: ['Amedrontado'],
    },
    {
      id: 'a1', origem: 'aliado', refId: 'c1', nome: 'Arch Rios',
      imagemUrl: 'avatar', imagemJogadorUrl: '', conhecimento: 'completo',
      ca: 16, pvMax: 40, pvAtual: 22, iniciativa: 12, iniciativaMod: 2,
      nomeOculto: false, condicoes: [],
    },
  ],
}
const pb = projetarBatalha(batalha)
const inimigo = pb.combatentes[0]
const aliado = pb.combatentes[1]
checar('nome oculto vira ???', inimigo.nome === '???')
checar('CA do inimigo é zerada', inimigo.ca === 0)
checar('PV vira porcentagem (133/200 → 67/100)', inimigo.pvMax === 100 && inimigo.pvAtual === 67)
checar('inimigo vivo nunca chega a 0%', inimigo.pvAtual > 0)
checar('imagem do DM é trocada', inimigo.imagemUrl === 'foto-publica')
checar('condições continuam visíveis', inimigo.condicoes.includes('Amedrontado'))

// O caso que faltava: quando NÃO existe foto de jogador. A checagem acima só
// cobria o inimigo que já tinha uma, então o `||` que caía na foto do DM passava
// batido — e entregava ao grupo a referência privada, onde muita gente cola o
// stat block inteiro. O bestiário já tratava disso; a batalha, não.
const semFotoPublica = projetarBatalha({
  ...batalha,
  combatentes: [{ ...batalha.combatentes[0], nomeOculto: false, imagemJogadorUrl: '' }],
}).combatentes[0]
checar('sem foto de jogador, o combate não entrega a do DM', semFotoPublica.imagemUrl === '')
checar('sem foto de jogador, nem no campo espelhado', !semFotoPublica.imagemJogadorUrl)
semVazamento('batalha sem foto de jogador', semFotoPublica, ['FOTO-SECRETA-DO-DM'])

// A barra de chefe da tela do grupo se levanta pelo rank. Ele precisa sair
// como o APARENTE — é o que sustenta o plot twist de um vilão de fachada.
const chefeDisfarcado = projetarBatalha({
  ...batalha,
  combatentes: [
    { ...batalha.combatentes[0], categoria: 'bbeg', categoriaAparente: 'miniboss' },
  ],
}).combatentes[0]
checar('o rank que sai é o aparente', chefeDisfarcado.categoria === 'miniboss')
checar('o verdadeiro não vai junto', chefeDisfarcado.categoriaAparente === undefined)
checar('e não sobra em canto nenhum do JSON', !JSON.stringify(chefeDisfarcado).includes('bbeg'))

// Sem disfarce, o rank real é o que o grupo vê — senão nenhum chefe teria barra.
const semDisfarce = projetarBatalha({
  ...batalha,
  combatentes: [{ ...batalha.combatentes[0], categoria: 'boss' }],
}).combatentes[0]
checar('sem rank aparente, vale o verdadeiro', semDisfarce.categoria === 'boss')

// O contador lendário responderia "isto é um chefe" sobre uma criatura que o
// grupo ainda vê como "???" — a mesma entrega que o rank aparente evita.
const lendario = projetarBatalha({
  ...batalha,
  combatentes: [{ ...batalha.combatentes[0], lendariasMax: 3, lendariasRestantes: 2 }],
}).combatentes[0]
checar('o teto de ações lendárias não sai', lendario.lendariasMax === undefined)
checar('nem quantas restam', lendario.lendariasRestantes === undefined)

checar('aliado mantém PV real', aliado.pvAtual === 22 && aliado.pvMax === 40)
checar('aliado mantém o nome', aliado.nome === 'Arch Rios')
semVazamento('batalha', pb, ['SEGREDO-DRAGAO-ANCIAO', 'FOTO-SECRETA-DO-DM'])

// inimigo com 1 PV de 200 não pode aparecer como derrotado
const quase = projetarBatalha({
  ...batalha,
  combatentes: [{ ...batalha.combatentes[0], pvAtual: 1 }],
})
checar('inimigo com 1 PV continua "em pé"', quase.combatentes[0].pvAtual === 1)
const morto = projetarBatalha({
  ...batalha,
  combatentes: [{ ...batalha.combatentes[0], pvAtual: 0 }],
})
checar('inimigo derrotado vai como 0', morto.combatentes[0].pvAtual === 0)

// ---------------------------------------------------------------------------
console.log('Campanha')
const campanha = {
  updatedAt: 1, nome: 'Strahd', sinopse: 'sinopse pública', arcoAtual: 'arco',
  ondeParamos: 'resumo público',
  party: [{ id: 'c1', nome: 'FICHA-DO-GRUPO' }],
  npcs: [{ id: 'n1', nome: 'Ismark', papel: '', descricao: '', notasSecretas: 'SEGREDO-NPC' }],
  sessoes: [{ id: 's1', data: '01/01', titulo: 'A cripta', resumo: 'resumo' }],
  atualizacoes: [
    { id: 'a1', criadoEm: 1, titulo: 'Publicado', texto: 'visível', fixado: true, publicado: true },
    { id: 'a2', criadoEm: 2, titulo: 'RASCUNHO-SECRETO', texto: 'SEGREDO-RASCUNHO', fixado: false, publicado: false },
  ],
  codex: [
    { id: 'v1', tipo: 'local', nome: 'Barovia', imagemUrl: '', resumo: 'r', descricao: 'd',
      segredos: 'SEGREDO-CODEX-1', conhecimento: 'completo', etiquetas: [] },
    { id: 'v2', tipo: 'segredo', nome: 'SEGREDO-VERBETE-OCULTO', imagemUrl: '', resumo: 'r',
      descricao: 'd', segredos: 'SEGREDO-CODEX-2', conhecimento: 'desconhecido', etiquetas: [] },
    { id: 'v3', tipo: 'faccao', nome: 'Os Vistani', imagemUrl: '', resumo: 'ouviu falar',
      descricao: 'SEGREDO-DESCRICAO-NAO-ESTUDADA', segredos: '', conhecimento: 'encontrado', etiquetas: [] },
  ],
  handouts: [
    { id: 'h1', titulo: 'Carta', texto: 'revelada', imagemUrl: '', revelado: true },
    { id: 'h2', titulo: 'SEGREDO-HANDOUT', texto: 'não revelado', imagemUrl: '', revelado: false },
  ],
  reputacoes: [],
  // Prep inteira: encontros que ainda podem vir, reviravoltas guardadas.
  tabelas: [
    {
      id: 'tb1',
      nome: 'SEGREDO-TABELA-EMBOSCADAS',
      contexto: 'floresta',
      entradas: [{ id: 'e1', texto: 'SEGREDO-ENTRADA-TRAICAO' }],
    },
  ],
  viagem: {
    emCurso: true, dia: 12, local: 'Vau do Glassrun', destino: 'O Portão', facesDado: 6,
    // Prep do DM: é o que ainda vai acontecer. Nada disto pode sair.
    tabelaEventos: [
      { id: 'e1', face: 1, texto: 'SEGREDO-EVENTO-EMBOSCADA' },
      { id: 'e2', face: 6, texto: 'SEGREDO-EVENTO-CARAVANA' },
    ],
    cronica: [
      { id: 'k1', criadoEm: 1, dia: 10, local: 'Stonehall', texto: 'A estrada alagou.', soDm: false },
      { id: 'k2', criadoEm: 2, dia: 11, local: 'Ironridge', texto: 'SEGREDO-BASTIDOR-GUIA-MENTIU', soDm: true },
    ],
  },
}
const pc = projetarCampanha(campanha)
checar('party não é publicada', pc.party.length === 0)
checar('NPCs não são publicados', pc.npcs.length === 0)
checar('rascunho não é publicado', pc.atualizacoes.length === 1)
checar('recado publicado passa', pc.atualizacoes[0].titulo === 'Publicado')
checar('verbete desconhecido some', pc.codex.length === 2)
checar('segredos do codex são apagados', pc.codex.every((v) => v.segredos === ''))
checar('"ouviu falar" não leva a descrição', pc.codex.find((v) => v.id === 'v3').descricao === '')
checar('"completo" leva a descrição', pc.codex.find((v) => v.id === 'v1').descricao === 'd')
checar('handout não revelado some', pc.handouts.length === 1)
checar('sinopse e onde paramos continuam', pc.sinopse === 'sinopse pública' && pc.ondeParamos === 'resumo público')
checar('sessões continuam', pc.sessoes.length === 1)
checar('tabela de eventos da estrada não é publicada', pc.viagem.tabelaEventos.length === 0)
checar('as tabelas do DM não são publicadas', (pc.tabelas ?? []).length === 0)
checar('entrada de bastidor da crônica some', pc.viagem.cronica.length === 1)
checar('entrada normal da crônica passa', pc.viagem.cronica[0].texto === 'A estrada alagou.')
checar('dia e local da viagem continuam', pc.viagem.dia === 12 && pc.viagem.local === 'Vau do Glassrun')
semVazamento('campanha', pc, [
  'FICHA-DO-GRUPO', 'SEGREDO-NPC', 'RASCUNHO-SECRETO', 'SEGREDO-RASCUNHO',
  'SEGREDO-CODEX-1', 'SEGREDO-CODEX-2', 'SEGREDO-VERBETE-OCULTO',
  'SEGREDO-DESCRICAO-NAO-ESTUDADA', 'SEGREDO-HANDOUT',
  'SEGREDO-EVENTO-EMBOSCADA', 'SEGREDO-EVENTO-CARAVANA', 'SEGREDO-BASTIDOR-GUIA-MENTIU',
  'SEGREDO-TABELA-EMBOSCADAS', 'SEGREDO-ENTRADA-TRAICAO',
])

// ---------------------------------------------------------------------------
console.log('Bestiário')
const atributos = { for: 20, des: 14, con: 18, int: 10, sab: 12, car: 16 }
const bestiario = [
  { id: 'm0', updatedAt: 1, nome: 'SEGREDO-MONSTRO-OCULTO', imagemUrl: 'x', imagemJogadorUrl: '',
    tipo: 't', tamanho: 'Médio', nd: '5', ca: 15, pvMax: 90, pvAtual: 90, deslocamento: '9 m',
    atributos, tracos: 'SEGREDO-TRACOS-0', acoes: [], taticas: 'SEGREDO-TATICA-0',
    conhecimento: 'desconhecido' },
  { id: 'm1', updatedAt: 1, nome: 'Lobo', imagemUrl: 'FOTO-DM-LOBO', imagemJogadorUrl: 'foto-jogador',
    tipo: 'Besta', tamanho: 'Médio', nd: '1/4', ca: 13, pvMax: 11, pvAtual: 11, deslocamento: '12 m',
    atributos, tracos: 'SEGREDO-TRACOS-1', acoes: [{ id: 'x', nome: 'Mordida', descricao: 'SEGREDO-ACAO-1' }],
    taticas: 'SEGREDO-TATICA-1', conhecimento: 'encontrado' },
  { id: 'm2', updatedAt: 1, nome: 'Ogro', imagemUrl: 'foto', imagemJogadorUrl: '',
    tipo: 'Gigante', tamanho: 'Grande', nd: '2', ca: 11, pvMax: 59, pvAtual: 59, deslocamento: '12 m',
    atributos, tracos: 'traços visíveis', acoes: [{ id: 'y', nome: 'Clava', descricao: 'visível' }],
    taticas: 'SEGREDO-TATICA-2', conhecimento: 'completo' },
]
const pbst = projetarBestiario(bestiario)
checar('monstro desconhecido some', pbst.length === 2)
const lobo = pbst.find((m) => m.id === 'm1')
const ogro = pbst.find((m) => m.id === 'm2')
checar('só "encontrado": CA zerada', lobo.ca === 0)
checar('só "encontrado": PV zerado', lobo.pvMax === 0)
checar('só "encontrado": atributos zerados', Object.values(lobo.atributos).every((v) => v === 0))
checar('só "encontrado": sem ações', lobo.acoes.length === 0)
// Tesouro é prep do DM. Saber o que o chefe larga antes de derrubá-lo estraga
// o achado, e a lista conta o que ele planejou para depois.
const comTesouro = projetarBestiario([
  {
    ...bestiario[2],
    tesouro: {
      moedas: [{ moeda: 'po', dado: '4d10' }],
      itens: [{ id: 't1', nome: 'SEGREDO-ESPADA-SOLAR', chance: 50 }],
    },
  },
])[0]
checar('nem "estudado" revela o tesouro', comTesouro.tesouro === undefined)
semVazamento('bestiário com tesouro', comTesouro, ['SEGREDO-ESPADA-SOLAR', '4d10'])

// Um chefe que o grupo só cruzou no corredor não pode entregar que é chefe.
const soCruzado = projetarBestiario([{ ...bestiario[1], acoesLendarias: 3 }])[0]
checar('só "encontrado": o orçamento lendário não sai', soCruzado.acoesLendarias === undefined)
// Estudado por inteiro, aí sim: é o nível em que a ficha toda é liberada.
const estudado = projetarBestiario([{ ...bestiario[2], acoesLendarias: 3 }])[0]
checar('"estudado": o orçamento lendário aparece', estudado.acoesLendarias === 3)
checar('só "encontrado": mantém nome e foto de jogador', lobo.nome === 'Lobo' && lobo.imagemUrl === 'foto-jogador')
// Sem foto de jogador, o grupo NÃO herda a do DM: muita gente cola ali o stat
// block inteiro, e o fallback antigo o entregava ao virar "encontrado".
checar('sem foto de jogador, o grupo não recebe a do DM', ogro.imagemUrl === '')
checar('"completo": estatísticas passam', ogro.ca === 11 && ogro.pvMax === 59)
checar('táticas do DM nunca saem', pbst.every((m) => m.taticas === ''))

// Categoria e marco de derrota precisam chegar ao grupo: é o que risca o card.
const chefes = projetarBestiario([
  { ...bestiario[2], id: 'b1', nome: 'Rukha', categoria: 'miniboss', derrotado: true },
  { ...bestiario[0], id: 'b2', nome: 'SEGREDO-BOSS-FINAL', categoria: 'boss', derrotado: false },
])
checar('chefe derrotado leva a marca', chefes.find((m) => m.id === 'b1').derrotado === true)
checar('categoria chega ao grupo', chefes.find((m) => m.id === 'b1').categoria === 'miniboss')

// Plot twist: o grupo passa a campanha achando que o vilão é outro. O rank
// verdadeiro não pode sair, senão a revelação acontece no bestiário.
const disfarcado = projetarBestiario([
  { ...bestiario[2], id: 'd1', nome: 'Belak', categoria: 'bbeg', categoriaAparente: 'boss' },
  { ...bestiario[2], id: 'd2', nome: 'Eco', categoria: 'bbeg' },
])
checar('o grupo vê o rank aparente', disfarcado.find((m) => m.id === 'd1').categoria === 'boss')
checar('sem rank aparente, vê o verdadeiro', disfarcado.find((m) => m.id === 'd2').categoria === 'bbeg')
checar(
  'o rank verdadeiro não viaja junto',
  disfarcado.every((m) => m.categoriaAparente === undefined),
)
checar('chefe ainda desconhecido continua fora', !chefes.some((m) => m.id === 'b2'))
semVazamento('bestiário chefes', chefes, ['SEGREDO-BOSS-FINAL'])

// Fases de chefe: a forma seguinte só existe para o grupo depois da virada.
// Publicá-la antes entrega a surpresa que a mecânica inteira existe para criar.
const comFases = projetarBestiario([
  { ...bestiario[2], id: 'f1', nome: 'Belak', chefeId: 'g1', fase: 1, conhecimento: 'completo' },
  { ...bestiario[2], id: 'f2', nome: 'SEGREDO-FASE-2-ENXERTADO', chefeId: 'g1', fase: 2,
    conhecimento: 'desconhecido' },
])
checar('fase seguinte não revelada fica fora', comFases.length === 1)
checar('a fase em jogo passa', comFases[0].id === 'f1')
semVazamento('fases de chefe', comFases, ['SEGREDO-FASE-2-ENXERTADO'])
semVazamento('bestiário', pbst, [
  'SEGREDO-MONSTRO-OCULTO', 'SEGREDO-TRACOS-0', 'SEGREDO-TATICA-0', 'FOTO-DM-LOBO',
  'SEGREDO-TRACOS-1', 'SEGREDO-ACAO-1', 'SEGREDO-TATICA-1', 'SEGREDO-TATICA-2',
])

// ---------------------------------------------------------------------------
console.log('Mapa')
const cena = {
  updatedAt: 1, nome: 'Cripta', mapaUrl: 'mapa', celPx: 50, mostrarGrade: true,
  offsetX: 0, offsetY: 0, encaixarGrade: true, zoom: 1,
  tokens: [
    { id: 't1', nome: 'SEGREDO-EMBOSCADA', imagemUrl: 'x', imagemJogadorUrl: '', origem: 'inimigo',
      x: 0.5, y: 0.5, tamanho: 1, cor: '#000', oculto: true, conhecimento: 'desconhecido' },
    { id: 't2', nome: 'Goblin', imagemUrl: 'FOTO-DM-GOBLIN', imagemJogadorUrl: 'foto-jogador',
      origem: 'inimigo', x: 0.2, y: 0.2, tamanho: 1, cor: '#a00', oculto: false, conhecimento: 'encontrado' },
    { id: 't3', nome: 'Arch', imagemUrl: 'avatar', imagemJogadorUrl: '', origem: 'aliado',
      x: 0.1, y: 0.1, tamanho: 1, cor: '#0a0', oculto: false, conhecimento: 'completo' },
  ],
}
const pm = projetarCena(cena)
checar('token oculto some de verdade', pm.tokens.length === 2)
checar('inimigo visível usa a foto de jogador', pm.tokens.find((t) => t.id === 't2').imagemUrl === 'foto-jogador')
checar('aliado mantém o avatar', pm.tokens.find((t) => t.id === 't3').imagemUrl === 'avatar')
semVazamento('mapa', pm, ['SEGREDO-EMBOSCADA', 'FOTO-DM-GOBLIN'])

// O mesmo buraco da batalha: o token visível SEM foto de jogador caía na do DM.
// O 't1' já não tinha foto pública, mas era oculto — sumia antes de chegar na
// troca de imagem, então o caso nunca era exercitado.
const semFotoNoMapa = projetarCena({
  ...cena,
  tokens: [{ ...cena.tokens[0], id: 't4', nome: 'Lobo', oculto: false, imagemUrl: 'FOTO-DM-LOBO' }],
}).tokens[0]
checar('token sem foto de jogador não entrega a do DM', semFotoNoMapa.imagemUrl === '')
checar('token sem foto de jogador, nem no campo espelhado', !semFotoNoMapa.imagemJogadorUrl)
semVazamento('mapa sem foto de jogador', semFotoNoMapa, ['FOTO-DM-LOBO'])

// ---------------------------------------------------------------------------
console.log('Mundo')
const mundo = {
  mapaAtivoId: 'w2',
  mapas: [
    {
      id: 'w1', nome: 'As Planícies Partidas', escopo: 'regiao', revelado: true, atualizadoEm: 1,
      pontos: [
        { id: 'p1', nome: 'Stonehall', tipo: 'cidade', x: 0.2, y: 0.3, descricao: 'Muralhas altas.',
          notasSecretas: 'SEGREDO-NOTA-DO-DM', revelado: true },
        { id: 'p2', nome: 'SEGREDO-COVIL-NAO-DESCOBERTO', tipo: 'masmorra', x: 0.8, y: 0.7,
          descricao: 'SEGREDO-DESCRICAO-COVIL', notasSecretas: 'SEGREDO-NOTA-COVIL', revelado: false },
      ],
    },
    {
      id: 'w2', nome: 'SEGREDO-MAPA-DO-ATO-3', escopo: 'campanha', revelado: false, atualizadoEm: 1,
      pontos: [
        { id: 'p3', nome: 'SEGREDO-CIDADE-FINAL', tipo: 'cidade', x: 0.5, y: 0.5, descricao: 'd',
          notasSecretas: 'n', revelado: true },
      ],
    },
  ],
}
const pw = projetarMundo(mundo)
checar('mapa escondido não é publicado', pw.mapas.length === 1)
checar('ponto não revelado some', pw.mapas[0].pontos.length === 1)
checar('ponto revelado passa com a descrição', pw.mapas[0].pontos[0].descricao === 'Muralhas altas.')
checar('notas do DM são apagadas', pw.mapas[0].pontos.every((p) => p.notasSecretas === ''))
checar('mapa ativo escondido não vaza como atalho', pw.mapaAtivoId === '')
// Um ponto revelado dentro de um mapa escondido continua escondido: quem manda
// é o mapa. Sem isto, esconder o mapa do ato 3 não esconderia nada.
semVazamento('mundo', pw, [
  'SEGREDO-NOTA-DO-DM', 'SEGREDO-COVIL-NAO-DESCOBERTO', 'SEGREDO-DESCRICAO-COVIL',
  'SEGREDO-NOTA-COVIL', 'SEGREDO-MAPA-DO-ATO-3', 'SEGREDO-CIDADE-FINAL',
])

// ---------------------------------------------------------------------------
console.log(
  falhas === 0
    ? `\n✓ ${testes} verificações de projeção passaram\n`
    : `\n✗ ${falhas} de ${testes} verificações falharam\n`,
)
process.exit(falhas === 0 ? 0 : 1)
