// Verifica os usos de classe: quantos a ficha tem, e quando eles voltam.
//
// A ficha listava os traços e parava aí. Quantas Fúrias o bárbaro ainda tem, se
// o guerreiro já queimou o Surto de Ação, quantos Pontos de Foco sobraram —
// tudo vivia na memória de quem estava jogando. E memória de mesa erra sempre
// para o mesmo lado: a favor de quem está perguntando.
//
// O perigo aqui é o de sempre nesta família: um recurso que volta cedo demais
// não dá erro. O bárbaro entra em fúria seis vezes na mesma luta e ninguém
// desconfia.
//
// Os números vêm da tabela do SRD, extraída do PDF — e estão conferidos à mão
// aqui embaixo, um a um. Derivar da mesma tabela que o código lê seria testar
// que ele concorda consigo mesmo.

import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'rec-'))
execSync(
  `npx esbuild src/lib/recursos.ts --bundle --outdir=${dir} --format=esm --log-level=error`,
)
const { recursosDoPersonagem, gastar, devolver, aoDescansar, restam } = await import(
  pathToFileURL(join(dir, 'recursos.js')).href
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
  id: 'f1', nome: 'Thorn', classe: 'Bárbaro', subclasse: '', nivel: 5,
  atributos: { for: 16, des: 14, con: 14, int: 10, sab: 12, car: 8 },
  ...extra,
})
const acha = (char, nome) => recursosDoPersonagem(char).find((r) => r.nome === nome)

// ---------------------------------------------------------------------------
console.log('Os números vêm da tabela do livro')

const ESPERADO = [
  ['Bárbaro', 1, 'Fúria', 2], ['Bárbaro', 5, 'Fúria', 3],
  ['Bárbaro', 10, 'Fúria', 4], ['Bárbaro', 20, 'Fúria', 6],
  ['Guerreiro', 1, 'Retomar o Fôlego', 2], ['Guerreiro', 10, 'Retomar o Fôlego', 4],
  ['Clérigo', 2, 'Canalizar Divindade', 2], ['Clérigo', 20, 'Canalizar Divindade', 4],
  ['Monge', 5, 'Ponto de Foco', 5], ['Monge', 20, 'Ponto de Foco', 20],
  ['Feiticeiro', 10, 'Ponto de Feitiçaria', 10],
  ['Druida', 2, 'Forma Selvagem', 2], ['Druida', 20, 'Forma Selvagem', 4],
]
for (const [classe, nivel, nome, total] of ESPERADO) {
  const r = acha(ficha({ classe, nivel }), nome)
  checar(`${classe} nv${nivel}: ${total} de ${nome}`, r?.total === total, `deu ${r?.total}`)
}

// Antes do nível em que a classe ganha, o recurso NÃO EXISTE — e não é zero
// numa lista: é ausência. Uma barra "0/0" na ficha diria que ele acabou.
checar('o clérigo de nível 1 não tem Canalizar',
  !acha(ficha({ classe: 'Clérigo', nivel: 1 }), 'Canalizar Divindade'))
checar('o guerreiro de nível 1 não tem Surto de Ação',
  !acha(ficha({ classe: 'Guerreiro', nivel: 1 }), 'Surto de Ação'))
checar('mas o de nível 2 tem',
  acha(ficha({ classe: 'Guerreiro', nivel: 2 }), 'Surto de Ação')?.total === 1)
checar('e o de 17 tem dois',
  acha(ficha({ classe: 'Guerreiro', nivel: 17 }), 'Surto de Ação')?.total === 2)
checar('o Indomável começa no 9',
  acha(ficha({ classe: 'Guerreiro', nivel: 9 }), 'Indomável')?.total === 1)
checar('e chega a três no 17',
  acha(ficha({ classe: 'Guerreiro', nivel: 17 }), 'Indomável')?.total === 3)
checar('o mago tem uma Recuperação Arcana',
  acha(ficha({ classe: 'Mago', nivel: 1 }), 'Recuperação Arcana')?.total === 1)
checar('quem não tem classe não tem recurso',
  recursosDoPersonagem(ficha({ classe: '' })).length === 0)

// A Inspiração é o modificador de Carisma, e não uma coluna: a coluna traz o
// DADO. Uma coluna não resolveria — o número muda quando o atributo muda.
const bardo = (car, nivel = 3) => ficha({
  classe: 'Bardo', nivel,
  atributos: { for: 8, des: 12, con: 12, int: 10, sab: 10, car },
})
checar('a inspiração do bardo é o mod de Carisma',
  acha(bardo(18), 'Inspiração de Bardo')?.total === 4,
  `deu ${acha(bardo(18), 'Inspiração de Bardo')?.total}`)
checar('e sobe com o atributo', acha(bardo(20), 'Inspiração de Bardo')?.total === 5)
// "Mínimo de uma vez": um bardo de Carisma 10 não fica sem inspiração.
checar('nunca menos de uma', acha(bardo(10), 'Inspiração de Bardo')?.total === 1)
checar('nem com Carisma baixo', acha(bardo(6), 'Inspiração de Bardo')?.total === 1)
// A recarga muda no meio da progressão: longo até o 4, curto do 5 em diante.
checar('a inspiração volta no longo até o 4',
  acha(bardo(16, 4), 'Inspiração de Bardo')?.recarga === 'longo')
checar('e no curto a partir do 5',
  acha(bardo(16, 5), 'Inspiração de Bardo')?.recarga === 'curto')

// ---------------------------------------------------------------------------
console.log('Gastar e devolver')

const barbaro = ficha({ nivel: 5 })
const umaFuria = { ...barbaro, ...gastar(barbaro, 'Fúria') }
checar('gastar marca um uso', acha(umaFuria, 'Fúria')?.usados === 1)
checar('e sobram duas', restam(acha(umaFuria, 'Fúria')) === 2)

let seco = barbaro
for (let i = 0; i < 10; i++) seco = { ...seco, ...gastar(seco, 'Fúria') }
// O app não empresta o que não existe.
checar('não passa do total', acha(seco, 'Fúria')?.usados === 3,
  String(acha(seco, 'Fúria')?.usados))
checar('e não sobra nada', restam(acha(seco, 'Fúria')) === 0)

// Devolver existe porque a mesa erra, e desfazer não pode custar um descanso.
const devolvida = { ...umaFuria, ...devolver(umaFuria, 'Fúria') }
checar('devolver desfaz o uso', acha(devolvida, 'Fúria')?.usados === 0)
checar('e não vira negativo',
  acha({ ...devolvida, ...devolver(devolvida, 'Fúria') }, 'Fúria')?.usados === 0)
checar('gastar recurso que a classe não tem não faz nada',
  Object.keys(gastar(barbaro, 'Metamagia')).length === 0)
checar('gastar não mexe na ficha de entrada', barbaro.usosDeRecursos === undefined)

// ---------------------------------------------------------------------------
console.log('O descanso devolve o que é dele')
//
// É a metade que erra em silêncio: um recurso que volta cedo demais não quebra
// nada, e o bárbaro entra em fúria seis vezes na mesma luta.

const guerreiro = ficha({ classe: 'Guerreiro', nivel: 9 })
const cansado = {
  ...guerreiro,
  usosDeRecursos: { 'Retomar o Fôlego': 2, 'Surto de Ação': 1, 'Indomável': 1 },
}

const curto = { ...cansado, ...aoDescansar(cansado, 'curto') }
checar('o curto devolve o Retomar o Fôlego', acha(curto, 'Retomar o Fôlego')?.usados === 0)
checar('e o Surto de Ação', acha(curto, 'Surto de Ação')?.usados === 0)
// O Indomável é de descanso longo: devolvê-lo no curto daria ao guerreiro uma
// salvaguarda repetida por luta, e é o tipo de generosidade que ninguém nota.
checar('mas NÃO devolve o Indomável', acha(curto, 'Indomável')?.usados === 1)

const longo = { ...cansado, ...aoDescansar(cansado, 'longo') }
checar('o longo devolve tudo',
  ['Retomar o Fôlego', 'Surto de Ação', 'Indomável'].every((n) => acha(longo, n)?.usados === 0))

const barbaroCansado = { ...barbaro, usosDeRecursos: { 'Fúria': 3 } }
checar('a Fúria NÃO volta no curto',
  acha({ ...barbaroCansado, ...aoDescansar(barbaroCansado, 'curto') }, 'Fúria')?.usados === 3)
checar('mas volta no longo',
  acha({ ...barbaroCansado, ...aoDescansar(barbaroCansado, 'longo') }, 'Fúria')?.usados === 0)

// Devolver a MESMA ficha quando não há nada a devolver: um objeto novo a cada
// descanso faria a ficha gravar e sincronizar por nada.
checar('descansar sem ter gastado não muda nada',
  Object.keys(aoDescansar(barbaro, 'longo')).length === 0)

// O total vem do NÍVEL, e só o gasto é guardado — então subir de nível aumenta
// o disponível sozinho, sem migração nenhuma.
const subiu = { ...barbaroCansado, nivel: 10 }
checar('subir de nível aumenta o total', acha(subiu, 'Fúria')?.total === 4)
checar('e o que sobra acompanha', restam(acha(subiu, 'Fúria')) === 1)

// ---------------------------------------------------------------------------
console.log('Ligado na ficha')
//
// O defeito que mais apareceu neste app é dado modelado, exibido e nunca
// consumido: a biblioteca calcula certo e ninguém chama. Aqui o descanso é
// justamente quem chama — sem isto o painel mostra bolinhas que nunca voltam.

const ler = (p) => readFileSync(p, 'utf-8')
const painel = ler('src/components/recursos-ui.tsx')
const descanso = ler('src/components/rest-levelup.tsx')
const telaDaFicha = ler('src/components/CharacterSheetView.tsx')
const doDm = ler('src/components/CharacterReadonly.tsx')

checar('o painel gasta pelo lib', painel.includes('gastar(char, r.nome)'))
checar('e devolve pelo lib', painel.includes('devolver(char, r.nome)'))
checar('a ficha mostra o painel', telaDaFicha.includes('<PainelDeRecursos char={char} update={update} />'))
checar('o DM vê os usos da ficha alheia', doDm.includes('<RecursosEmChips char={char} />'))
checar('o descanso curto recarrega', descanso.includes("recarregar('curto')"))
checar('o descanso longo recarrega', descanso.includes("recarregar('longo')"))
// Quem está de vida cheia e sem dado nenhum ainda precisa da hora: é ela que
// devolve o Surto de Ação. Sem este botão, o único jeito de recarregar seria
// tomar dano primeiro.
checar('dá para descansar sem gastar dado', descanso.includes('function soDescansar()'))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de recursos falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de recursos passaram`)
