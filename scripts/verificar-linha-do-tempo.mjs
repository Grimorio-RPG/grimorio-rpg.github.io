// Verifica a linha do tempo da campanha.
//
// Ela junta o que já existia espalhado — sessões, chefes derrubados, lugares
// revelados, crônica de estrada, recados. Nada é guardado: a linha é montada na
// hora, senão haveria uma segunda verdade para sair de sincronia.
//
// O que importa aqui é o corte: a MESMA função serve para a tela do DM e para a
// do grupo, e a diferença entre elas não pode depender de alguém lembrar de
// esconder alguma coisa.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'linha-'))
const alvo = join(dir, 'linha.js')
execSync(`npx esbuild src/lib/linhaDoTempo.ts --bundle --outfile=${alvo} --format=esm --log-level=error`)
const { montarLinhaDoTempo } = await import(pathToFileURL(alvo).href)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const campanha = {
  updatedAt: 1, nome: 'C', sinopse: '', arcoAtual: '', ondeParamos: '',
  party: [], npcs: [], codex: [], handouts: [], reputacoes: [],
  sessoes: [
    { id: 's1', data: '01/07', titulo: 'A cripta', resumo: 'desceram' },
    { id: 's2', data: '08/07', titulo: 'O pântano', resumo: 'atolaram' },
  ],
  atualizacoes: [
    { id: 'a1', criadoEm: 500, titulo: 'Próxima quinta', texto: 'às 20h', fixado: false, publicado: true },
    { id: 'a2', criadoEm: 600, titulo: 'SEGREDO-RASCUNHO', texto: 'x', fixado: false, publicado: false },
  ],
  viagem: {
    emCurso: true, dia: 4, local: 'Estrada', destino: '', facesDado: 6, tabelaEventos: [],
    cronica: [
      { id: 'k1', criadoEm: 300, dia: 3, local: 'Vau', texto: 'A ponte caiu', soDm: false },
      { id: 'k2', criadoEm: 400, dia: 4, local: 'Mata', texto: 'SEGREDO-O-GUIA-MENTIU', soDm: true },
    ],
  },
}

const bestiario = [
  { id: 'm1', updatedAt: 900, nome: 'Belak', derrotado: true, categoria: 'boss' },
  { id: 'm2', updatedAt: 800, nome: 'Goblin', derrotado: true, categoria: 'comum' },
  { id: 'm3', updatedAt: 700, nome: 'Vampiro', derrotado: false, categoria: 'bbeg' },
]

const mapas = [
  {
    id: 'w1', nome: 'Região', escopo: 'regiao', revelado: true, atualizadoEm: 200,
    pontos: [
      { id: 'p1', nome: 'Vilarejo', tipo: 'cidade', x: 0, y: 0, descricao: 'd', notasSecretas: '', revelado: true },
      { id: 'p2', nome: 'SEGREDO-COVIL-OCULTO', tipo: 'masmorra', x: 0, y: 0, descricao: '', notasSecretas: '', revelado: false },
    ],
  },
  {
    id: 'w2', nome: 'SEGREDO-MAPA-ESCONDIDO', escopo: 'regiao', revelado: false, atualizadoEm: 100,
    pontos: [
      { id: 'p3', nome: 'SEGREDO-PONTO-DO-MAPA-OCULTO', tipo: 'ruina', x: 0, y: 0, descricao: '', notasSecretas: '', revelado: true },
    ],
  },
]

// ---------------------------------------------------------------------------
console.log('Montagem')

const doDm = montarLinhaDoTempo(campanha, bestiario, mapas)
const tipos = (l) => l.map((m) => m.tipo)

checar('as sessões entram', tipos(doDm).filter((t) => t === 'sessao').length === 2)
checar('a crônica de estrada entra', tipos(doDm).filter((t) => t === 'estrada').length === 2)
checar('o recado publicado entra', doDm.some((m) => m.titulo === 'Próxima quinta'))
checar('o rascunho não entra', !doDm.some((m) => m.titulo.includes('RASCUNHO')))

// Riscar um goblin não conta história nenhuma — a mesma régua do bestiário.
checar('chefe derrubado vira marco', doDm.some((m) => m.titulo.includes('Belak')))
checar('inimigo comum derrubado não vira', !doDm.some((m) => m.titulo.includes('Goblin')))
checar('chefe ainda vivo não vira', !doDm.some((m) => m.titulo.includes('Vampiro')))

checar('lugar revelado entra', doDm.some((m) => m.titulo === 'Vilarejo'))
checar('lugar não revelado fica de fora', !doDm.some((m) => m.titulo.includes('COVIL-OCULTO')))

// Mais recente primeiro: é o que a mesa relê antes de começar.
const ordenado = doDm.every((m, i) => i === 0 || doDm[i - 1].em >= m.em)
checar('vem do mais recente para o mais antigo', ordenado, doDm.map((m) => m.em).join(' '))

checar('sem campanha, linha vazia', montarLinhaDoTempo(null, bestiario, mapas).length === 0)

// ---------------------------------------------------------------------------
console.log('O corte do grupo')

const doGrupo = montarLinhaDoTempo(campanha, bestiario, mapas, { soDoGrupo: true })
const json = JSON.stringify(doGrupo)

checar('bastidor da crônica não aparece', !json.includes('SEGREDO-O-GUIA-MENTIU'))
checar('mapa inteiro escondido não vaza ponto', !json.includes('SEGREDO-PONTO-DO-MAPA-OCULTO'))
checar('nem o nome do mapa escondido', !json.includes('SEGREDO-MAPA-ESCONDIDO'))
checar('rascunho continua de fora', !json.includes('SEGREDO-RASCUNHO'))

// O que é do grupo continua: cortar demais deixaria a tela vazia.
checar('a sessão continua para o grupo', doGrupo.some((m) => m.titulo === 'A cripta'))
checar('a entrada normal da estrada continua', doGrupo.some((m) => m.detalhe === 'A ponte caiu'))
checar('o lugar revelado continua', doGrupo.some((m) => m.titulo === 'Vilarejo'))

// Um mapa escondido com ponto "revelado" dentro é o caso que engana: o ponto
// está marcado como revelado, mas o mapa inteiro não existe para o grupo.
const soMapaOculto = montarLinhaDoTempo(campanha, [], [mapas[1]], { soDoGrupo: true })
checar('ponto revelado dentro de mapa oculto não escapa',
  !soMapaOculto.some((m) => m.tipo === 'lugar'),
  JSON.stringify(soMapaOculto))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de linha do tempo falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de linha do tempo passaram`)
