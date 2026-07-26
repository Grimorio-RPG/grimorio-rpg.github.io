// Verifica as projeções públicas: o que o DM publica NÃO pode conter segredo.
//
// Rode com: npm run verificar
//
// É proposital que este teste seja bruto: além de checar campo a campo, ele
// procura as palavras secretas no JSON inteiro que sairia pela rede. Se alguém
// adicionar um campo novo à ficha de um monstro e esquecer de censurá-lo, o
// teste quebra.

import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

// Compila os módulos de projeção para JS puro (eles não dependem de React).
const dir = mkdtempSync(join(tmpdir(), 'proj-'))
for (const arquivo of ['battle', 'campaign', 'bestiary', 'mapscene']) {
  const src = readFileSync(`src/lib/${arquivo}.ts`, 'utf8')
  // Só nos interessam as funções puras de projeção; o resto importa store/DOM.
  const corte = src.indexOf('export function projetar')
  if (corte < 0) throw new Error(`sem projeção em ${arquivo}.ts`)
  const trecho = src.slice(corte)
  writeFileSync(join(dir, `${arquivo}.ts`), trecho)
}
execSync(
  `npx esbuild ${['battle', 'campaign', 'bestiary', 'mapscene']
    .map((f) => join(dir, `${f}.ts`))
    .join(' ')} --outdir=${dir} --format=esm --log-level=error`,
)

const { projetarBatalha } = await import(join(dir, 'battle.js'))
const { projetarCampanha } = await import(join(dir, 'campaign.js'))
const { projetarBestiario } = await import(join(dir, 'bestiary.js'))
const { projetarCena } = await import(join(dir, 'mapscene.js'))

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
semVazamento('campanha', pc, [
  'FICHA-DO-GRUPO', 'SEGREDO-NPC', 'RASCUNHO-SECRETO', 'SEGREDO-RASCUNHO',
  'SEGREDO-CODEX-1', 'SEGREDO-CODEX-2', 'SEGREDO-VERBETE-OCULTO',
  'SEGREDO-DESCRICAO-NAO-ESTUDADA', 'SEGREDO-HANDOUT',
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
checar('só "encontrado": mantém nome e foto de jogador', lobo.nome === 'Lobo' && lobo.imagemUrl === 'foto-jogador')
checar('"completo": estatísticas passam', ogro.ca === 11 && ogro.pvMax === 59)
checar('táticas do DM nunca saem', pbst.every((m) => m.taticas === ''))
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

// ---------------------------------------------------------------------------
console.log(
  falhas === 0
    ? `\n✓ ${testes} verificações de projeção passaram\n`
    : `\n✗ ${falhas} de ${testes} verificações falharam\n`,
)
process.exit(falhas === 0 ? 0 : 1)
