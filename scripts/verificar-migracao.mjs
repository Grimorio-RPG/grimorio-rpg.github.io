// Verifica que dados salvos por uma versão ANTERIOR do app continuam abrindo.
//
// Os campos novos (registro de combate, prazo de condição, tipo de ação,
// tesouro, tabelas, rank do combatente) nasceram opcionais. Mas "declarei como
// opcional" e "conferi que abre" são coisas diferentes, e só a segunda vale
// alguma coisa — um `.map` num campo ausente derruba a tela inteira, e quem
// descobre é o DM no meio da sessão.
//
// O teste percorre o caminho de verdade: joga JSON no formato antigo no
// armazenamento e chama os mesmos `load*` que o app chama ao abrir.

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

// --- o navegador que o Node não tem ----------------------------------------
//
// `initStore` tenta o IndexedDB, não acha, e cai no localStorage — que é
// exatamente o caminho de emergência do app num navegador sem suporte. Basta
// fornecer o localStorage.
const guardado = new Map()
globalThis.localStorage = {
  getItem: (k) => (guardado.has(k) ? guardado.get(k) : null),
  setItem: (k, v) => guardado.set(k, String(v)),
  removeItem: (k) => guardado.delete(k),
}

// Tudo numa compilação só, com `--splitting`.
//
// Compilar cada módulo à parte daria a cada um a SUA cópia do armazenamento —
// o `initStore` encheria um cache e o `loadBattle` leria de outro, vazio. Com
// splitting o store vira um pedaço compartilhado, que é como o app roda de
// verdade.
const dir = mkdtempSync(join(tmpdir(), 'migr-'))
const ENTRADAS = ['store', 'battle', 'bestiary', 'campaign', 'registro', 'tesouro', 'linhaDoTempo']
execSync(
  `npx esbuild ${ENTRADAS.map((e) => `src/lib/${e}.ts`).join(' ')} ` +
    `--bundle --splitting --outdir=${dir} --format=esm --log-level=error`,
)
const importar = (nome) => import(pathToFileURL(join(dir, `${nome}.js`)).href)

const loja = await importar('store')
const { loadBattle, projetarBatalha, correrCondicoes, comLendariasDisponiveis, momentoDoCovil } =
  await importar('battle')
const { loadBestiary, projetarBestiario, tipoAcaoInfo } = await importar('bestiary')
const { loadCampaign, projetarCampanha } = await importar('campaign')
const { destaquesDoCombate, projetarRegistro, eventosDeVida } = await importar('registro')
const { sortearDoEncontro, temTesouro } = await importar('tesouro')
const { montarLinhaDoTempo } = await importar('linhaDoTempo')

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

/** Roda algo que deveria funcionar e reporta a explosão em vez de morrer. */
function semExplodir(nome, fn) {
  testes++
  try {
    fn()
  } catch (e) {
    falhas++
    console.error(`  ✗ ${nome} explodiu: ${e.message}`)
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Os dados como a versão ANTERIOR os gravava. Nada de `registro`, `tipo`,
// `tesouro`, `rodadasDeCondicao`, `categoria` no combatente ou `tabelas`.
// ---------------------------------------------------------------------------

const BATALHA_ANTIGA = {
  updatedAt: 1, nome: 'Emboscada', rodada: 3, turnoIndex: 1, emAndamento: true,
  combatentes: [
    {
      id: 'i1', origem: 'inimigo', refId: 'm1', nome: 'Goblin',
      imagemUrl: '', imagemJogadorUrl: '', conhecimento: 'encontrado',
      ca: 13, pvMax: 7, pvAtual: 4, iniciativa: 12, iniciativaMod: 2,
      nomeOculto: false, condicoes: ['Caído'],
    },
    {
      id: 'a1', origem: 'aliado', refId: 'c1', nome: 'Thorn',
      imagemUrl: '', imagemJogadorUrl: '', conhecimento: 'completo',
      ca: 17, pvMax: 30, pvAtual: 21, iniciativa: 15, iniciativaMod: 1,
      nomeOculto: false, condicoes: [],
    },
  ],
}

const BESTIARIO_ANTIGO = [
  {
    id: 'm1', updatedAt: 1, nome: 'Goblin', imagemUrl: '', imagemJogadorUrl: '',
    tipo: 'Humanoide', tamanho: 'Pequeno', nd: '1/4', ca: 13, pvMax: 7, pvAtual: 7,
    deslocamento: '9 m', atributos: { for: 8, des: 14, con: 10, int: 10, sab: 8, car: 8 },
    tracos: 'Fuga Ágil.', taticas: 'ataca em bando',
    // Ação sem `tipo`: é assim que TODA ação cadastrada até hoje está gravada.
    acoes: [{ id: 'a1', nome: 'Cimitarra', descricao: '+4 para acertar, 1d6+2 cortante.' }],
    conhecimento: 'completo',
  },
]

const CAMPANHA_ANTIGA = {
  updatedAt: 1, nome: 'A Mina Perdida', sinopse: 's', arcoAtual: 'a', ondeParamos: 'o',
  party: [], npcs: [], sessoes: [{ id: 's1', data: '01/07', titulo: 'Começo', resumo: 'r' }],
  atualizacoes: [], codex: [], handouts: [], reputacoes: [],
  viagem: {
    emCurso: false, dia: 1, local: '', destino: '', facesDado: 6,
    tabelaEventos: [], cronica: [],
  },
}

const CHAVES = loja.CHAVES
guardado.set(CHAVES.batalha, JSON.stringify(BATALHA_ANTIGA))
guardado.set(CHAVES.bestiario, JSON.stringify(BESTIARIO_ANTIGO))
guardado.set(CHAVES.bestiarioSeed, '1')
guardado.set(CHAVES.campanha, JSON.stringify(CAMPANHA_ANTIGA))

await loja.initStore()

// ---------------------------------------------------------------------------
console.log('Abrir o que já estava salvo')

let batalha
if (semExplodir('loadBattle com batalha antiga', () => { batalha = loadBattle() })) {
  checar('a batalha volta inteira', batalha.combatentes.length === 2)
  checar('a rodada é preservada', batalha.rodada === 3)
  checar('as condições antigas continuam', batalha.combatentes[0].condicoes.includes('Caído'))
  // Os campos novos ficam ausentes, e é o certo: inventar um orçamento lendário
  // para um goblin seria pior do que não ter nenhum.
  checar('sem registro, e sem inventar um', batalha.registro === undefined)
  checar('sem orçamento lendário inventado', batalha.combatentes[0].lendariasMax === undefined)
  checar('sem prazo de condição inventado', batalha.combatentes[0].rodadasDeCondicao === undefined)
}

let bestiario
if (semExplodir('loadBestiary com bestiário antigo', () => { bestiario = loadBestiary() })) {
  checar('a criatura volta', bestiario.length === 1 && bestiario[0].nome === 'Goblin')
  checar('a ação sem tipo continua lá', bestiario[0].acoes.length === 1)
  checar('e vale como ação comum', tipoAcaoInfo(bestiario[0].acoes[0].tipo).valor === 'acao')
  checar('sem tesouro inventado', !temTesouro(bestiario[0].tesouro))
}

let campanha
if (semExplodir('loadCampaign com campanha antiga', () => { campanha = loadCampaign() })) {
  checar('a campanha volta', campanha.nome === 'A Mina Perdida')
  checar('as sessões continuam', campanha.sessoes.length === 1)
  checar('sem tabelas inventadas', (campanha.tabelas ?? []).length === 0)
}

// ---------------------------------------------------------------------------
console.log('Usar o que abriu')
//
// Abrir sem quebrar não basta: é no primeiro clique que o `.map` num campo
// ausente derruba a tela.

// O alvo é o goblin ('i1'), que TEM condição e não tem mapa de prazos. Este
// teste apontava para o aliado, que não tem condição nenhuma — o laço perigoso
// nunca rodava, e tirar a guarda de `rodadasDeCondicao` passava batido.
semExplodir('virar o turno de quem tem condição sem prazo', () => {
  const r = correrCondicoes(batalha.combatentes, 'i1')
  checar('sem prazo, nada expira', r.expiradas.length === 0, JSON.stringify(r.expiradas))
  checar('e a condição fica onde estava', r.combatentes[0].condicoes.includes('Caído'))
})

semExplodir('virar o turno de quem não tem condição nenhuma', () => {
  const r = correrCondicoes(batalha.combatentes, 'a1')
  checar('nada acontece', r.expiradas.length === 0)
})

semExplodir('procurar lendárias numa batalha antiga', () => {
  checar('ninguém tem lendária para usar', comLendariasDisponiveis(batalha).length === 0)
})

semExplodir('checar a hora do covil numa batalha antiga', () => {
  // Iniciativas 15 e 12: o primeiro turno já abre a faixa abaixo de 20.
  checar('a conta do covil funciona sem dados novos', typeof momentoDoCovil(batalha) === 'boolean')
})

semExplodir('publicar uma batalha antiga para o grupo', () => {
  const p = projetarBatalha(batalha)
  checar('o PV do inimigo vira porcentagem', p.combatentes[0].pvMax === 100)
  checar('o registro ausente vira lista vazia', Array.isArray(p.registro) && p.registro.length === 0)
})

semExplodir('destaques de um combate sem registro', () => {
  const d = destaquesDoCombate(batalha)
  checar('ainda sai a duração', d.some((x) => x.includes('rodada')), d.join(' | '))
})

semExplodir('censurar um registro ausente', () => {
  checar('projetarRegistro aguenta indefinido', projetarRegistro(undefined).length === 0)
})

semExplodir('bater em quem não concentra', () => {
  const e = eventosDeVida(batalha.combatentes[1], 10)
  checar('gera dano', e.some((x) => x.tipo === 'dano'))
  checar('e nenhum aviso de concentração', !e.some((x) => x.tipo === 'concentracao'))
})

semExplodir('sortear tesouro de criaturas que não têm', () => {
  const s = sortearDoEncontro(bestiario)
  checar('não inventa moeda', s.moedas.po === 0 && s.itens.length === 0)
})

semExplodir('publicar um bestiário antigo', () => {
  const p = projetarBestiario(bestiario)
  checar('a criatura estudada sai', p.length === 1)
  checar('sem tesouro no que sai', p[0].tesouro === undefined)
})

semExplodir('publicar uma campanha antiga', () => {
  const p = projetarCampanha(campanha)
  checar('as tabelas saem vazias', (p.tabelas ?? []).length === 0)
})

semExplodir('montar a linha do tempo de uma campanha antiga', () => {
  const l = montarLinhaDoTempo(campanha, bestiario, [])
  checar('a sessão vira marco', l.some((m) => m.titulo === 'Começo'))
})

// ---------------------------------------------------------------------------
console.log('A promessa de compatibilidade')
//
// `condicoes` continua sendo `string[]`. Foi por isso que o prazo foi parar
// num campo ao lado, em vez de dentro: essa lista atravessa a rede até a ficha
// do jogador, e mudar a forma dela quebraria quem estivesse com uma versão
// antiga do app em cache — no meio da sessão.

const comPrazo = {
  ...batalha.combatentes[1],
  condicoes: ['Envenenado'],
  rodadasDeCondicao: { Envenenado: 2 },
}
checar('condicoes continua uma lista de texto',
  Array.isArray(comPrazo.condicoes) && comPrazo.condicoes.every((c) => typeof c === 'string'))

const publicado = projetarBatalha({ ...batalha, combatentes: [comPrazo] })
checar('e assim também sai pela rede',
  publicado.combatentes[0].condicoes.every((c) => typeof c === 'string'),
  JSON.stringify(publicado.combatentes[0].condicoes))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de migração falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de migração passaram`)
