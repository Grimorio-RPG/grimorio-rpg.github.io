// Verifica a conferência da ficha: o que ela aponta, e o que ela NÃO aponta.
//
// O app já sabia todas as contas — CA, espaços, cotas, proficiência, sintonia —
// e cada uma vivia na sua tela. Quem monta a ficha à mão, importa do D&D Beyond
// ou sobe cinco níveis de uma vez acaba com uma ficha inteira plausível e errada
// em dois lugares, e nenhum deles dá erro.
//
// Os dois jeitos de esta biblioteca falhar são simétricos e igualmente ruins:
//
// - CALAR sobre um erro de verdade, e aí ela não serve para nada.
// - GRITAR sobre uma ficha certa, e aí a pessoa aprende a não ler — e no dia do
//   erro de verdade ele está no meio de dez linhas amarelas que ninguém lê.
//
// Por isso metade das verificações abaixo é sobre a ficha CERTA ficar em
// silêncio.

import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'conf-'))
execSync(
  `npx esbuild src/lib/conferencia.ts --bundle --outdir=${dir} --format=esm --log-level=error`,
)
const { conferir, resumo, silenciados, silenciar, voltarAAvisar } = await import(
  pathToFileURL(join(dir, 'conferencia.js')).href
)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const espacos = (...totais) =>
  Array.from({ length: 9 }, (_, i) => ({ total: totais[i] ?? 0, usados: 0 }))

/**
 * Um guerreiro de nível 5 com tudo certo.
 *
 * Dado d10, CON +2: 10 + 4×1 a 5×10, mais 5×2 — a faixa vai de 24 a 60. PV 44 é
 * a média, que é o que a maioria das mesas usa.
 */
const certo = (extra = {}) => ({
  id: 'f1', nome: 'Garret', classe: 'Guerreiro', subclasse: 'Campeão (Champion)', nivel: 5,
  especie: 'Humano', antecedente: 'Soldado', xp: 6500,
  atributos: { for: 16, des: 14, con: 14, int: 10, sab: 12, car: 8 },
  salvaguardasProficientes: ['for', 'con'],
  periciasProficientes: ['atletismo', 'percepcao'],
  periciasExpertise: [],
  talentos: ['Defesa'], manobras: [],
  pvMax: 44, pvAtual: 44, pvTemporario: 0, dadosDeVida: '5d10', dadosDeVidaUsados: 0,
  classeArmaduraManual: null, equipamentos: [], magias: [], espacosMagia: espacos(),
  atributoConjuracao: null, condicoes: [], exaustao: 0, ataques: [],
  deslocamento: 9, iniciativaBonus: 0, inspiracaoHeroica: false,
  proficienciasEquipamentos: '', moedas: {}, inventario: [],
  testesMorte: { sucessos: 0, falhas: 0 },
  ...extra,
})

const acha = (char, id) => conferir(char).find((a) => a.id === id)
const tem = (char, id) => acha(char, id) != null

// ---------------------------------------------------------------------------
console.log('A ficha certa fica em silêncio')
//
// É a metade que ninguém testa, e é a que decide se alguém vai ler a lista.

const bom = certo()
const achadosDoBom = conferir(bom)
checar('o guerreiro de nível 5 não tem nenhum achado',
  achadosDoBom.length === 0,
  achadosDoBom.map((a) => `${a.gravidade}:${a.id}`).join(' | '))

// Um mago de nível 5 com a ficha inteira em ordem — inclusive os espaços da
// tabela e as cotas de magia, que é onde mais dá para errar por acidente.
const magoBom = certo({
  classe: 'Mago', subclasse: 'Evocador (Evoker)', nivel: 5,
  atributos: { for: 8, des: 14, con: 12, int: 18, sab: 12, car: 10 },
  salvaguardasProficientes: ['int', 'sab'],
  periciasProficientes: ['arcanismo', 'historia'],
  talentos: [],
  pvMax: 27, pvAtual: 27, dadosDeVida: '5d6',
  atributoConjuracao: 'int',
  espacosMagia: espacos(4, 3, 2),
  magias: [
    ...['Raio de Fogo', 'Respingo Ácido', 'Mãos Mágicas', 'Ilusão Menor'].map((n, i) => ({
      id: `t${i}`, nome: n, nivel: 0, preparada: false,
    })),
    ...Array.from({ length: 14 }, (_, i) => ({
      id: `m${i}`, nome: `Magia ${i}`, nivel: (i % 3) + 1, preparada: i < 9,
    })),
  ],
})
const achadosDoMago = conferir(magoBom)
checar('e o mago de nível 5 também não',
  achadosDoMago.length === 0,
  achadosDoMago.map((a) => `${a.gravidade}:${a.id} — ${a.detalhe}`).join(' | '))

// Sem XP nenhum não é incoerência: muita mesa joga por marcos.
checar('jogar por marcos, sem XP, não vira achado', !tem(certo({ xp: 0 }), 'xp-baixo'))

// ---------------------------------------------------------------------------
console.log('\nO que ela pega')

const CASOS = [
  ['pv-fora-da-faixa', 'PV impossível para a classe', certo({ pvMax: 200 }), 'erro'],
  ['pv-fora-da-faixa', 'PV baixo demais', certo({ pvMax: 10 }), 'erro'],
  ['pv-acima-do-maximo', 'PV atual acima do máximo', certo({ pvAtual: 60 }), 'erro'],
  ['dados-de-vida', 'dados de vida gastos demais', certo({ dadosDeVidaUsados: 9 }), 'erro'],
  ['salvaguardas', 'salvaguardas que não são da classe',
    certo({ salvaguardasProficientes: ['des', 'car'] }), 'aviso'],
  ['xp-baixo', 'XP abaixo do nível', certo({ xp: 100 }), 'aviso'],
  ['xp-sobrando', 'XP dando para subir', certo({ xp: 20000 }), 'dica'],
  ['expertise-sem-proficiencia', 'expertise sem proficiência',
    certo({ periciasExpertise: ['furtividade'] }), 'erro'],
  ['atributo-alto-for', 'atributo acima de 20',
    certo({ atributos: { ...certo().atributos, for: 22 } }), 'aviso'],
  ['atributo-impossivel-for', 'atributo fora da escala',
    certo({ atributos: { ...certo().atributos, for: 40 } }), 'erro'],
  ['sem-classe', 'ficha sem classe', certo({ classe: '' }), 'aviso'],
]
for (const [id, oque, char, gravidade] of CASOS) {
  const a = acha(char, id)
  checar(`pega ${oque}`, a != null, conferir(char).map((x) => x.id).join(', '))
  if (a) checar(`e trata como ${gravidade}`, a.gravidade === gravidade, a.gravidade)
}

// Cada achado precisa dizer o NÚMERO. Sem ele é só uma opinião, e ninguém
// conserta uma ficha a partir de "está estranho".
const comProblemas = certo({ pvMax: 200, xp: 100, periciasExpertise: ['furtividade'] })
checar('todo achado traz número no detalhe',
  conferir(comProblemas).every((a) => /\d/.test(a.detalhe)),
  conferir(comProblemas).filter((a) => !/\d/.test(a.detalhe)).map((a) => a.id).join(', '))
checar('e todos têm título', conferir(comProblemas).every((a) => a.titulo.length > 3))

// ---------------------------------------------------------------------------
console.log('\nAs contas de magia')

const magoSemEspacos = { ...magoBom, espacosMagia: espacos(4, 2) }
const e = acha(magoSemEspacos, 'espacos')
checar('pega espaços diferentes da tabela', e != null)
checar('e diz qual círculo e quanto deveria', /2º: 2 em vez de 3/.test(e?.detalhe ?? ''), e?.detalhe)
checar('o guerreiro não ganha achado de espaço', !tem(bom, 'espacos'))
// O Cavaleiro Arcano conjura, e o app não modela magia de subclasse. Cobrar a
// tabela do Guerreiro dele acusaria de errada uma ficha certa — e é assim que a
// conferência vira decoração que ninguém lê.
const cavaleiroArcano = certo({
  subclasse: 'Cavaleiro Arcano (Eldritch Knight)',
  atributoConjuracao: 'int',
  espacosMagia: espacos(4, 2),
})
checar('nem o Cavaleiro Arcano, que tem espaços de subclasse',
  !tem(cavaleiroArcano, 'espacos'),
  conferir(cavaleiroArcano).map((a) => a.id).join(', '))

checar('pega espaço gasto além do que existe',
  tem({ ...magoBom, espacosMagia: [{ total: 4, usados: 9 }, ...espacos().slice(1)] },
    'espacos-usados-0'))

checar('pega conjurador sem atributo de conjuração',
  tem({ ...magoBom, atributoConjuracao: null }, 'sem-atributo-conjuracao'))
checar('e não cobra isso de quem não conjura', !tem(bom, 'sem-atributo-conjuracao'))

const comMagiaAlta = {
  ...magoBom,
  magias: [...magoBom.magias, { id: 'x', nome: 'Desejo', nivel: 9, preparada: false }],
}
const alta = acha(comMagiaAlta, 'magia-alta')
checar('pega magia acima do círculo da classe', alta != null)
checar('e diz até onde a classe vai', /vai até o 3º/.test(alta?.detalhe ?? ''), alta?.detalhe)

const preparandoDemais = {
  ...magoBom,
  magias: magoBom.magias.map((m) => (m.nivel > 0 ? { ...m, preparada: true } : m)),
}
checar('pega preparadas acima da cota', tem(preparandoDemais, 'preparadas-demais'))

// ---------------------------------------------------------------------------
console.log('\nAs contas de equipamento')

const item = (extra) => ({
  id: 'e' + Math.random().toString(36).slice(2, 7), nome: 'Item', slot: 'corpo',
  equipado: true, efeitos: [], sintonia: false, sintonizado: false, ...extra,
})

// A CA sobrescrita é saída legítima — e é também onde um número velho fica
// preso depois de trocar de armadura.
const caTravada = certo({ classeArmaduraManual: 20 })
const ca = acha(caTravada, 'ca-manual')
checar('pega a CA fixada que não bate com o equipamento', ca != null)
checar('e mostra os dois números', /20/.test(ca?.detalhe ?? '') && /\d/.test(ca?.detalhe ?? ''), ca?.detalhe)
// Fixar no MESMO valor da conta não é divergência: é só travar o que já valia.
const modDes = 2
checar('mas não reclama quando o número bate',
  !tem(certo({ classeArmaduraManual: 10 + modDes }), 'ca-manual'))

const magoDePlacas = {
  ...magoBom,
  equipamentos: [item({
    nome: 'Placas', armadura: 'Placas',
    efeitos: [{ tipo: 'caBase', valor: 18, maxDes: 0 }],
  })],
}
checar('pega armadura sem treino', tem(magoDePlacas, 'armadura-sem-treino'))
checar('e o guerreiro de placas passa',
  !tem({ ...bom, equipamentos: magoDePlacas.equipamentos }, 'armadura-sem-treino'))

const quatroSintonias = {
  ...bom,
  equipamentos: ['anelD', 'anelE', 'pescoco', 'capa'].map((slot, i) =>
    item({ id: 's' + i, nome: 'Relíquia ' + i, slot, sintonia: true, sintonizado: true })),
}
const sint = acha(quatroSintonias, 'sintonia')
checar('pega sintonia além do limite', sint != null)
checar('e diz quantas sobram', /1 a mais/.test(sint?.detalhe ?? ''), sint?.detalhe)
checar('três sintonias passam',
  !tem({ ...bom, equipamentos: quatroSintonias.equipamentos.slice(0, 3) }, 'sintonia'))

const magoComEspada = {
  ...magoBom,
  equipamentos: [item({ nome: 'Espada Grande', slot: 'maoPrincipal', arma: 'Espada Grande' })],
}
checar('pega arma sem proficiência', tem(magoComEspada, 'arma-sem-treino'))
checar('e o guerreiro com a mesma espada passa',
  !tem({ ...bom, equipamentos: magoComEspada.equipamentos }, 'arma-sem-treino'))

// ---------------------------------------------------------------------------
console.log('\nA ordem e o placar')
//
// Quem abre a conferência quer saber o que está QUEBRADO. Uma lista em ordem de
// tela enterra o erro de CA no meio de três lembretes de escolha pendente.

const bagunca = certo({
  pvMax: 200, xp: 20000, periciasExpertise: ['furtividade'],
  salvaguardasProficientes: ['des'],
})
const lista = conferir(bagunca)
const pesos = { erro: 0, aviso: 1, dica: 2 }
checar('os erros vêm primeiro',
  lista.every((a, i) => i === 0 || pesos[lista[i - 1].gravidade] <= pesos[a.gravidade]),
  lista.map((a) => a.gravidade).join(' '))
checar('e a dica vem por último', lista[lista.length - 1].gravidade === 'dica')

const placar = resumo(lista)
checar('o placar conta os erros', placar.erro >= 2, JSON.stringify(placar))
checar('e soma o total', placar.erro + placar.aviso + placar.dica === lista.length)
checar('o placar de uma ficha certa é zerado',
  JSON.stringify(resumo(conferir(bom))) === JSON.stringify({ erro: 0, aviso: 0, dica: 0 }))

// Id repetido faria a tela perder linhas: React descarta a segunda.
checar('nenhum achado repete id', new Set(lista.map((a) => a.id)).size === lista.length,
  lista.map((a) => a.id).join(', '))

// ---------------------------------------------------------------------------
console.log('\n"Isto não é erro"')
//
// Uma conferência que não se cala vira decoração: a pessoa aprende a ignorar a
// lista inteira, e no dia do erro de verdade ele está no meio das mesmas linhas.
// Mas uma dispensa eterna é pior — silencia justamente o lugar onde alguém já
// mexeu. Por isso a marca guarda o TEXTO, e o aviso volta quando o número muda.

const comPvEstranho = certo({ pvMax: 200 })
const oAchado = acha(comPvEstranho, 'pv-fora-da-faixa')
checar('o achado existe antes de dispensar', oAchado != null)

const dispensado = { ...comPvEstranho, ...silenciar(comPvEstranho, oAchado) }
checar('depois de dispensar, some da lista', !tem(dispensado, 'pv-fora-da-faixa'))
checar('e não conta no placar', resumo(conferir(dispensado)).erro === 0,
  JSON.stringify(resumo(conferir(dispensado))))

// Some da lista, mas não do app: uma dispensa invisível é uma conferência cega
// que ninguém pode auditar.
const calados = silenciados(dispensado)
checar('mas continua listado como dispensado', calados.length === 1)
checar('com o título de sempre', calados[0]?.titulo === oAchado.titulo)

// O caso que decide o desenho: quem disse que 200 PV está certo por causa de um
// item de campanha não disse nada sobre 300.
const outroNumero = { ...dispensado, pvMax: 300 }
const voltou = acha(outroNumero, 'pv-fora-da-faixa')
checar('mudando o número, o aviso volta', voltou != null)
checar('e a linha avisa que voltou', voltou?.voltou === true)
checar('e ele não aparece mais como dispensado',
  silenciados(outroNumero).length === 0)
// Voltando ao número dispensado, o silêncio volta com ele — a marca continua lá.
checar('voltando ao número de antes, cala de novo',
  !tem({ ...outroNumero, pvMax: 200 }, 'pv-fora-da-faixa'))

// Desfazer.
const revertido = { ...dispensado, ...voltarAAvisar(dispensado, 'pv-fora-da-faixa') }
checar('"voltar a avisar" traz o achado de volta', tem(revertido, 'pv-fora-da-faixa'))
checar('e sem a marca de "voltou"', acha(revertido, 'pv-fora-da-faixa')?.voltou !== true)
checar('desfazer o que não estava dispensado não muda nada',
  Object.keys(voltarAAvisar(certo(), 'pv-fora-da-faixa')).length === 0)

// Dispensar um achado não cala os outros.
const doisProblemas = certo({ pvMax: 200, periciasExpertise: ['furtividade'] })
const soUm = {
  ...doisProblemas,
  ...silenciar(doisProblemas, acha(doisProblemas, 'pv-fora-da-faixa')),
}
checar('dispensar um não cala o outro', tem(soUm, 'expertise-sem-proficiencia'))
checar('e o placar acompanha', resumo(conferir(soUm)).erro === 1,
  JSON.stringify(resumo(conferir(soUm))))

// E dispensar o segundo não pode ressuscitar o primeiro: a marca é uma lista, e
// sobrescrevê-la inteira devolveria um aviso que a pessoa já resolveu.
const osDois = { ...soUm, ...silenciar(soUm, acha(soUm, 'expertise-sem-proficiencia')) }
checar('dispensar o segundo não traz o primeiro de volta',
  !tem(osDois, 'pv-fora-da-faixa'), conferir(osDois).map((a) => a.id).join(', '))
checar('e os dois ficam listados como dispensados', silenciados(osDois).length === 2,
  String(silenciados(osDois).length))

// Dispensar não mexe na ficha de entrada.
checar('silenciar não mexe na ficha original', comPvEstranho.conferenciaIgnorada === undefined)

// ---------------------------------------------------------------------------
console.log('\nLigado na tela')

const painel = readFileSync('src/components/conferencia-ui.tsx', 'utf-8')
const leitura = readFileSync('src/components/CharacterSheetView.tsx', 'utf-8')
const card = readFileSync('src/components/ficha-card.tsx', 'utf-8')

checar('a ficha mostra a conferência',
  leitura.includes('<Conferencia char={char} update={update} />'))
checar('o painel chama a biblioteca', painel.includes('conferir(char)'))
checar('e mostra o detalhe de cada achado', painel.includes('{achado.detalhe}'))
// Aberta o tempo todo viraria decoração: a pessoa aprende a não ler, e o erro
// de verdade fica no meio das dez linhas amarelas.
checar('vem recolhida quando não há erro',
  painel.includes('useState(placar.erro > 0)'))
checar('e diz claramente quando está tudo certo', painel.includes('TUDO_CERTO'))
// A ficha errada do jogador é problema do DM na hora em que o número entra na
// mesa. O selo faz a pergunta chegar antes.
checar('a lista de fichas ganha o selo', card.includes('<SeloDeConferencia char={char} />'))
// A ficha é da pessoa: item de campanha e regra caseira aparecem aqui sem
// estarem errados, e transformar isso em bloqueio seria discutir com a mesa.
checar('o painel diz que aponta e não corrige', painel.includes('aponta, e não corrige'))
// Sem o botão, a única saída para um falso alarme seria conviver com ele — e é
// assim que a lista inteira deixa de ser lida.
// Procurar só pelo texto não vale: o parágrafo do rodapé explica o botão e
// contém as mesmas palavras. O que precisa existir é o BOTÃO.
checar('cada linha traz o botão "não é erro"',
  painel.includes('title="Marcar como certo e parar de avisar'))
checar('e ele grava pelo lib', painel.includes('silenciar(char, a)'))
checar('o que foi dispensado continua visível', painel.includes('silenciados(char)'))
checar('e dá para desfazer', painel.includes('voltarAAvisar(char, a.id)'))
checar('a volta por mudança de número é explicada', painel.includes('achado.voltou'))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de conferência falharam`)
  process.exit(1)
}
console.log(`\n✓ ${testes} verificações de conferência passaram`)
