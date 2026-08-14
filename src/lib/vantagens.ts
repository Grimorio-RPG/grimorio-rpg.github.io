// O que você GANHA escolhendo isto.
//
// A criação de ficha mostrava uma frase de sabor por espécie e por classe —
// "graciosos e longevos", "mestre de armas e armaduras" — e pedia a escolha
// mais importante do personagem com base nisso. Quem já joga sabe o que está
// por trás; quem nunca jogou escolhe pelo nome que soa melhor, descobre na
// terceira sessão que queria outra coisa, e refazer uma ficha de nível 5 é o
// tipo de coisa que faz gente largar o jogo.
//
// A saída não é um manual dentro do app: é a vantagem OBJETIVA, numa linha, no
// instante da escolha. "Sortudo: rerrole todo 1 natural" decide mais do que
// três parágrafos sobre a cultura dos halflings.
//
// Nada aqui é escrito à mão duas vezes. Tudo sai do que o app já tem — traços
// de espécie e de classe, tabela de proficiências do SRD, dado de vida,
// salvaguardas —, então uma regra que mude num lugar muda aqui junto.

import { CLASSES } from '../data/rules'
import { TRACOS_DE_CLASSE } from '../data/features'
import { TRACOS_DE_ESPECIE } from '../data/species'
import { PROFICIENCIAS_SRD } from '../data/srd/proficiencias-srd'
import { emPalavras } from './proficiencias'

export interface Vantagem {
  icone: string
  /** O nome curto do que se ganha. */
  nome: string
  /** O que ele faz, em uma linha, sem jargão. */
  texto: string
}

/**
 * Um ícone por assunto, achado pelo texto do traço.
 *
 * A alternativa era um campo `icone` em cada traço — cem lugares para preencher
 * e esquecer. Aqui um traço sem palavra conhecida cai no genérico e continua
 * legível, que é o pior caso aceitável.
 */
const PISTAS: [RegExp, string][] = [
  [/vis(ã|a)o no escuro|enxerga/i, '👁️'],
  [/resist(ê|e)ncia|resiste/i, '🛡️'],
  [/vantagem/i, '🍀'],
  [/cura|pontos de vida|máximo de pontos/i, '❤️'],
  [/magia|truque|conjur/i, '✨'],
  [/sopro|dano/i, '🔥'],
  [/desloca|velocidade|move/i, '👟'],
  [/perícia|proficiência/i, '🎓'],
  [/furtiv|escond/i, '🥷'],
  [/descanso|medita/i, '🌙'],
  [/talento/i, '⭐'],
  [/salvaguarda/i, '💪'],
]

const iconeDe = (texto: string): string =>
  PISTAS.find(([re]) => re.test(texto))?.[1] ?? '•'

/**
 * O que a espécie dá logo de cara.
 *
 * Só o nível 1: o Draconato ganha coisa no 5 e no 11, e listar isso na hora de
 * escolher é responder uma pergunta que ninguém fez ainda. O que decide a
 * escolha é o que vale na primeira sessão.
 */
export function vantagensDaEspecie(nome: string): Vantagem[] {
  return (TRACOS_DE_ESPECIE[nome] ?? [])
    .filter((t) => t.nivel <= 1)
    .map((t) => ({ icone: iconeDe(`${t.nome} ${t.resumo}`), nome: t.nome, texto: t.resumo }))
}

/**
 * O dado de vida em palavras.
 *
 * "d10" não diz nada a quem nunca jogou. O que diz é onde aquele número fica
 * entre os outros: o d12 do bárbaro e o d6 do mago são a diferença entre
 * aguentar dois golpes e aguentar um.
 */
function vidaEmPalavras(dado: number): string {
  if (dado >= 12) return `d${dado} por nível — o mais resistente do jogo`
  if (dado >= 10) return `d${dado} por nível — dos mais resistentes`
  if (dado >= 8) return `d${dado} por nível — resistência média`
  return `d${dado} por nível — o mais frágil; fique longe da linha de frente`
}

const NOME_DO_ATRIBUTO: Record<string, string> = {
  for: 'Força', des: 'Destreza', con: 'Constituição',
  int: 'Inteligência', sab: 'Sabedoria', car: 'Carisma',
}

/**
 * O que a classe dá, na ordem em que um iniciante pergunta.
 *
 * Vida primeiro, porque é o que decide se o personagem sobrevive. Depois o que
 * ele empunha, depois se conjura, e só então os traços do nível 1 — que são o
 * "poder especial" e é onde todo mundo olha primeiro, mas não é o que mais
 * muda o jogo.
 */
export function vantagensDaClasse(nome: string): Vantagem[] {
  const info = CLASSES.find((c) => c.nome === nome)
  if (!info) return []

  const fora: Vantagem[] = [
    { icone: '❤️', nome: 'Pontos de vida', texto: vidaEmPalavras(info.dadoDeVida) },
  ]

  const prof = PROFICIENCIAS_SRD[nome]
  if (prof) {
    const palavras = emPalavras(prof)
    fora.push({
      icone: '⚔️',
      nome: 'Treino',
      texto: `${palavras.armas}; ${palavras.armaduras}.`,
    })
  }

  // A salvaguarda é o que salva de armadilha, magia e sopro de dragão. Duas por
  // classe, e nunca mudam — é a vantagem escondida que ninguém compara.
  fora.push({
    icone: '💪',
    nome: 'Salvaguardas treinadas',
    texto: `${info.salvaguardas.map((a) => NOME_DO_ATRIBUTO[a] ?? a).join(' e ')} — some o bônus de proficiência para resistir.`,
  })

  fora.push(
    info.conjuracao
      ? {
          icone: '✨',
          nome: 'Conjura magias',
          texto: `Usa ${NOME_DO_ATRIBUTO[info.conjuracao]} para acertar e para a dificuldade das suas magias.`,
        }
      : {
          icone: '🗡️',
          nome: 'Sem magia',
          texto: 'Resolve tudo com arma, manobra e traço de classe — mais simples de jogar.',
        },
  )

  for (const t of TRACOS_DE_CLASSE[nome] ?? []) {
    if (t.nivel > 1) continue
    fora.push({ icone: iconeDe(`${t.nome} ${t.resumo}`), nome: t.nome, texto: t.resumo })
  }

  return fora
}

/**
 * O que o antecedente dá.
 *
 * No 2024 ele deixou de ser enfeite: é dele que saem os aumentos de atributo e
 * um talento, e muita gente escolhe pelo nome achando que é só história.
 */
export function vantagensDoAntecedente(resumo: string): Vantagem[] {
  const fora: Vantagem[] = []
  const pericias = resumo.match(/Perícias?:\s*([^.]+)/i)
  if (pericias) {
    fora.push({ icone: '🎓', nome: 'Perícias', texto: `Proficiência em ${pericias[1].trim()}.` })
  }
  fora.push({
    icone: '💪',
    nome: 'Atributos',
    texto: '+3 distribuídos (ou +2 e +1) nos atributos que o antecedente permite.',
  })
  fora.push({
    icone: '⭐',
    nome: 'Talento de origem',
    texto: 'Um talento já no nível 1 — o antecedente é a única fonte dele.',
  })
  fora.push({
    icone: '🧰',
    nome: 'Ferramenta',
    texto: 'Proficiência com uma ferramenta ligada ao ofício.',
  })
  return fora
}
