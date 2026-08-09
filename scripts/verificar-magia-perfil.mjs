// Verifica o que a lista de magias diz sobre cada magia.
//
// A escolha era uma parede de linhas iguais: nome, círculo, escola. Quem está
// escolhendo pergunta outra coisa — isto machuca ou ajuda? quanto? pega o
// grupo? contra qual salvaguarda? Tudo isso já estava escrito no texto oficial,
// e ninguém ia lê-lo dali.
//
// O perigo aqui não é quebrar: é classificar errado com toda a confiança. Uma
// magia de prender rotulada como magia de dano não dá erro nenhum — ela só
// aparece no filtro errado, e a pessoa que filtrou por "controle" nunca fica
// sabendo que a Teia existia.
//
// Por isso as magias abaixo estão conferidas UMA A UMA contra o livro, e não
// derivadas da mesma regra que o código usa.

import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'perfil-'))
execSync(
  `npx esbuild src/data/srd/magias.ts --bundle --outfile=${join(dir, 'cat.mjs')} --format=esm --log-level=error`,
)
const { carregarMagias } = await import(pathToFileURL(join(dir, 'cat.mjs')).href)
const magias = await carregarMagias()
const acha = (nome) => magias.find((m) => m.nome === nome)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

// ---------------------------------------------------------------------------
console.log('O papel de cada magia, conferido no livro')

const PAPEIS = {
  dano: ['Fireball', 'Fire Bolt', 'Lightning Bolt', 'Vampiric Touch', 'Magic Missile',
    'Spirit Guardians', 'Ice Storm', 'Thunderwave', 'Guiding Bolt', 'Hunter’s Mark'],
  cura: ['Cure Wounds', 'Healing Word', 'Mass Cure Wounds'],
  controle: ['Hold Person', 'Sleep', 'Charm Person', 'Grease', 'Web'],
  defesa: ['Shield', 'Mage Armor', 'False Life', 'Barkskin', 'Invisibility'],
  utilidade: ['Detect Magic', 'Misty Step', 'Fly', 'Counterspell', 'Bless'],
}
for (const [papel, nomes] of Object.entries(PAPEIS)) {
  for (const n of nomes) {
    const m = acha(n)
    checar(`${n} é ${papel}`, m?.perfil.papel === papel, `deu ${m?.perfil.papel}`)
  }
}

// As três armadilhas que custaram a achar. Cada uma dá uma lista plausível e
// mentirosa, que é o pior jeito de errar.
console.log('\nAs armadilhas')

// A Teia diz "Terreno Difícil" e "Contido" no começo, e só no fim conta que a
// teia pega fogo por 2d4. A regra "tem dado de dano? é dano" transformava a
// magia de prender mais usada do jogo numa magia de dano de 2d4.
const teia = acha('Web')
checar('a Teia não vira magia de dano por causa do fogo no fim', teia?.perfil.papel === 'controle')
checar('e nem mostra o dado dela', teia?.perfil.dados === undefined, String(teia?.perfil.dados))

// Invisível é a única condição que se dá a um AMIGO. Contada como controle, a
// Invisibilidade aparecia no filtro ao lado de Imobilizar Pessoa.
checar('Invisibilidade não é controle', acha('Invisibility')?.perfil.papel !== 'controle')

// "2d10 Bludgeoning damage and 4d6 Cold damage": com folga entre o dado e o
// tipo, o dado de uma oração casava com o tipo da seguinte.
const granizo = acha('Ice Storm')
checar('a Tempestade de Granizo é 2d10', granizo?.perfil.dados === '2d10', String(granizo?.perfil.dados))
checar('e o tipo é o do PRIMEIRO dado', granizo?.perfil.dano === 'Concussão', String(granizo?.perfil.dano))

// O Orbe Cromático escreve só "takes 3d8 damage" — quem escolhe o tipo é quem
// conjura. Exigir o tipo apagava o número, que é o que interessa.
const orbe = acha('Chromatic Orb')
checar('o Orbe Cromático mostra o dado sem tipo', orbe?.perfil.dados === '3d8', String(orbe?.perfil.dados))
checar('e não inventa um tipo', orbe?.perfil.dano === undefined, String(orbe?.perfil.dano))

// ---------------------------------------------------------------------------
console.log('\nOs números que decidem entre duas magias')

const DADOS = [
  ['Fireball', '8d6', 'Fogo', 'DES', false, true],
  ['Fire Bolt', '1d10', 'Fogo', undefined, true, false],
  ['Magic Missile', '1d4+1', 'Força', undefined, false, false],
  ['Thunderwave', '2d8', 'Trovejante', 'CON', false, true],
  ['Guiding Bolt', '4d6', 'Radiante', undefined, true, false],
  ['Lightning Bolt', '8d6', 'Elétrico', 'DES', false, true],
]
for (const [nome, dados, dano, salv, ataque, area] of DADOS) {
  const p = acha(nome)?.perfil
  checar(`${nome}: ${dados} de ${dano}`, p?.dados === dados && p?.dano === dano,
    `deu ${p?.dados} de ${p?.dano}`)
  checar(`${nome}: salvaguarda ${salv ?? 'nenhuma'}`, p?.salvaguarda === salv, String(p?.salvaguarda))
  checar(`${nome}: ${ataque ? 'pede ataque' : 'não pede ataque'}`, p?.ataque === ataque)
  checar(`${nome}: ${area ? 'pega o grupo' : 'pega um só'}`, p?.area === area)
}

// ---------------------------------------------------------------------------
console.log('\nO catálogo inteiro')

checar('todas as 339 magias têm perfil', magias.every((m) => m.perfil?.papel != null),
  String(magias.filter((m) => m.perfil?.papel == null).length) + ' sem')
const VALIDOS = ['dano', 'cura', 'controle', 'defesa', 'utilidade']
checar('e nenhum papel inventado', magias.every((m) => VALIDOS.includes(m.perfil.papel)))

// Filtro que devolve tudo em toda categoria não filtra nada — e filtro que
// devolve vazio numa delas é um botão que só decepciona.
const porPapel = {}
for (const m of magias) porPapel[m.perfil.papel] = (porPapel[m.perfil.papel] ?? 0) + 1
for (const p of VALIDOS) {
  checar(`o filtro "${p}" tem magias`, (porPapel[p] ?? 0) >= 5, `só ${porPapel[p] ?? 0}`)
}
checar('e nenhum papel engole o catálogo',
  Math.max(...Object.values(porPapel)) < magias.length * 0.6,
  JSON.stringify(porPapel))

checar('o dado sempre tem forma de dado',
  magias.every((m) => !m.perfil.dados || /^\d+d\d+(\+\d+)?$/.test(m.perfil.dados)),
  magias.filter((m) => m.perfil.dados && !/^\d+d\d+(\+\d+)?$/.test(m.perfil.dados)).map((m) => m.perfil.dados).join(' '))
checar('e só aparece em magia de dano',
  magias.every((m) => !m.perfil.dados || m.perfil.papel === 'dano'))
checar('tipo de dano nunca sem dado',
  magias.every((m) => !m.perfil.dano || m.perfil.dados))
const SALVAS = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR']
checar('a salvaguarda é uma das seis',
  magias.every((m) => !m.perfil.salvaguarda || SALVAS.includes(m.perfil.salvaguarda)))

// ---------------------------------------------------------------------------
console.log('\nA cara de cada linha')
//
// Não existe arte de magia neste app. O que dá para fazer com honestidade é o
// que um livro faz: cor e símbolo por escola. Uma escola sem símbolo vira uma
// linha sem nada, no meio de linhas com algo — pior do que nenhuma ter.

const perfilTs = readFileSync('src/lib/magia-perfil.ts', 'utf-8')
const escolas = [...new Set(magias.map((m) => m.escolaPt))]
checar('as oito escolas do livro estão no catálogo', escolas.length === 8, escolas.join(', '))
for (const e of escolas) {
  checar(`${e} tem símbolo`, new RegExp(`${e}: '.+'`).test(perfilTs))
  checar(`${e} tem cor`, new RegExp(`${e}: '#[0-9a-f]{6}'`).test(perfilTs))
}
const danos = [...new Set(magias.map((m) => m.perfil.dano).filter(Boolean))]
for (const d of danos) checar(`dano ${d} tem símbolo`, new RegExp(`${d}: '.+'`).test(perfilTs))

// ---------------------------------------------------------------------------
console.log('\nLigado na tela')
//
// O defeito que mais apareceu neste app é dado calculado e nunca consumido.

const painel = readFileSync('src/components/magias-ui.tsx', 'utf-8')
const ficha = readFileSync('src/pages/CharacterSheet.tsx', 'utf-8')

checar('a lista filtra por papel', painel.includes('m.perfil.papel !== papel'))
checar('a lista filtra por escola', painel.includes('m.escolaPt !== escola'))
checar('a lista filtra por círculo', painel.includes('m.nivel !== nivel'))
checar('a linha mostra o dado', painel.includes('{p.dados}'))
checar('a linha mostra a salvaguarda', painel.includes('{p.salvaguarda}'))
checar('a linha ganha a cor da escola', painel.includes('borderLeftColor'))
// Contador que só muda de cor não segura ninguém: era fácil demais passar da
// cota, porque o vermelho chegava DEPOIS de a magia já estar anotada.
checar('a lista trava quando a cota enche', painel.includes('const travada = tem || cheio'))
checar('a ficha calcula as três cotas', ficha.includes('const cheio = falta'))
checar('e passa a trava para a lista', ficha.includes('cheio={!alemDoLimite &&'))
checar('adicionar respeita a trava', ficha.includes('if (!alemDoLimite && (nivel === 0 ? cheio.truques : cheio.aprender)) return'))
checar('preparar respeita a trava', ficha.includes('disabled={!m.preparada && !alemDoLimite && cheio.preparar}'))
// Um app que só sabe o caminho certo vira um app que impede: magia de domínio,
// de talento e de pergaminho passam da cota por regra.
checar('e existe saída explícita', ficha.includes('ir além do limite'))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de perfil de magia falharam`)
  process.exit(1)
}
console.log(`\n✓ ${testes} verificações de perfil de magia passaram`)
