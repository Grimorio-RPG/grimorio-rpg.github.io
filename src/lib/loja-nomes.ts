// Sortear a loja e quem está atrás do balcão.
//
// O DM digitava os dois campos em branco, e nome de loja é exatamente o tipo de
// coisa que trava a mesa: você quer improvisar uma parada de meia hora numa
// vila e gasta dois minutos pensando em como o ferreiro se chama.
//
// O nome e o vendedor saem JUNTOS, do mesmo tema. Sortear os dois separados dá
// "A Bigorna Torta, de Sylvara, elfa que vende ervas" — cada metade plausível e
// o conjunto sem sentido. O tema é escolhido uma vez e manda nos dois, e é isso
// que faz o resultado parecer escrito e não sorteado.
//
// O porte filtra os temas: casa arcana não é ferraria de vilarejo.

import type { PorteDeLoja } from './loja'

export interface Tema {
  id: string
  /** Onde este tema cabe. Vazio = em qualquer porte. */
  portes?: PorteDeLoja[]
  /**
   * Substantivos do lugar, cada um com o seu artigo.
   *
   * O artigo vem no dado, e não de uma regra de terminação: "Mão", "Chave" e
   * "Tenaz" são femininos que a terminação chama de masculinos, e "A Martelo
   * Torta" é o tipo de erro que faz a mesa rir do app em vez de com ele. Uma
   * regra com lista de exceções acerta hoje e erra no próximo substantivo que
   * alguém acrescentar.
   */
  coisas: [string, 'A' | 'O'][]
  /** Qualificadores: "Torta", "de Ferro". */
  adjetivos: string[]
  /**
   * O que se nota em quem atende.
   *
   * São locuções e orações, nunca substantivo de ofício. "Osric, antiquária
   * que sabe demais" e "Prudência, armeiro que já foi soldado" saíram do
   * gerador antes disto: o nome tem um gênero, o ofício tem outro, e casar os
   * dois exigiria etiquetar cada nome — o que é decidir o gênero de uma pessoa
   * para poder gerar uma frase.
   *
   * "de mãos queimadas" e "que só atende de manhã" cabem em qualquer um, e o
   * nome da loja já diz que ali é uma forja. O ofício era a parte redundante;
   * o traço é a parte que a mesa lembra.
   */
  tracos: string[]
}

/**
 * Os temas.
 *
 * Poucos e cheios, em vez de muitos e magros: um tema com quatro substantivos
 * repete rápido, e a mesa percebe o gerador na terceira cidade.
 */
export const TEMAS: Tema[] = [
  {
    id: 'forja',
    portes: ['vilarejo', 'cidade', 'metropole'],
    coisas: [['Bigorna', 'A'], ['Martelo', 'O'], ['Forja', 'A'], ['Brasa', 'A'], ['Fornalha', 'A'], ['Malho', 'O'], ['Tenaz', 'A'], ['Fole', 'O']],
    adjetivos: [
      'Torta', 'de Ferro', 'Fria', 'do Anão', 'Rachada', 'Vermelha',
      'que Não Apaga', 'de Três Golpes',
    ],
    tracos: [
      'de mãos queimadas',
      'de poucas palavras',
      'que fala demais',
      'que só atende de manhã',
      'que já serviu no exército',
    ],
  },
  {
    id: 'botica',
    portes: ['vilarejo', 'cidade', 'metropole'],
    coisas: [['Caldeirão', 'O'], ['Almofariz', 'O'], ['Raiz', 'A'], ['Erva', 'A'], ['Folha', 'A'], ['Frasco', 'O'], ['Alambique', 'O'], ['Semente', 'A']],
    adjetivos: [
      'Amarga', 'de Prata', 'do Pântano', 'que Cura', 'Verde', 'Seca',
      'da Meia-Noite', 'de Sete Voltas',
    ],
    tracos: [
      'de avental manchado',
      'que cheira a alecrim',
      'de olhos vermelhos',
      'que não cobra dos pobres',
      'que fala com as plantas',
    ],
  },
  {
    id: 'curiosidades',
    portes: ['cidade', 'metropole'],
    coisas: [['Baú', 'O'], ['Gaveta', 'A'], ['Prateleira', 'A'], ['Bugiganga', 'A'], ['Relíquia', 'A'], ['Achado', 'O'], ['Caixa', 'A'], ['Nó', 'O']],
    adjetivos: [
      'Sem Fundo', 'do Viajante', 'Empoeirada', 'de Longe', 'Esquecida',
      'que Range', 'da Última Chance', 'de Todo Mundo',
    ],
    tracos: [
      'que nunca diz de onde veio',
      'que sabe demais',
      'que odeia vender',
      'de sorriso rápido',
      'que troca mais do que vende',
    ],
  },
  {
    id: 'relicario',
    portes: ['metropole', 'arcana'],
    coisas: [['Relicário', 'O'], ['Ossuário', 'O'], ['Cripta', 'A'], ['Urna', 'A'], ['Mão', 'A'], ['Coroa', 'A'], ['Véu', 'O'], ['Chave', 'A']],
    adjetivos: [
      'do Santo', 'de Marfim', 'Selada', 'que Sangra', 'do Rei Morto',
      'Fria', 'de Duas Faces', 'que Ninguém Abre',
    ],
    tracos: [
      'que coleciona relíquias e dívidas',
      'sem lugar na ordem que o criou',
      'que só recebe à noite',
      'de luvas brancas',
      'que trata cada peça como se fosse gente',
    ],
  },
  {
    id: 'arcano',
    portes: ['metropole', 'arcana'],
    coisas: [['Sigilo', 'O'], ['Grimório', 'O'], ['Círculo', 'O'], ['Runa', 'A'], ['Olho', 'O'], ['Torre', 'A'], ['Vela', 'A'], ['Espelho', 'O']],
    adjetivos: [
      'Trincado', 'de Vidro', 'que Observa', 'Quieto', 'Torto', 'da Sexta Casa',
      'sem Nome', 'que Não Fecha',
    ],
    tracos: [
      'que se aposentou sem paciência',
      'que só aceita indicação',
      'de dedos manchados de tinta',
      'que cobra em favores',
      'que nunca se apresenta',
    ],
  },
]

/**
 * Nomes próprios.
 *
 * De propósito sem sobrenome e sem apelido de fantasia: o vendedor é uma pessoa
 * que o grupo vai chamar pelo nome, e "Durnan" cola mais rápido do que
 * "Durnan Barbaferro, o Terceiro".
 */
const NOMES = [
  'Durnan', 'Sylvara', 'Brannok', 'Ilda', 'Toren', 'Mireya', 'Garrik', 'Nessa',
  'Halvard', 'Corvina', 'Elrik', 'Tamsin', 'Ovid', 'Belna', 'Ruprecht', 'Ysolde',
  'Fendrel', 'Marga', 'Osric', 'Prudência', 'Valko', 'Zenna', 'Bardo', 'Cleto',
]

/**
 * Concorda o adjetivo com o gênero da coisa, nos dois sentidos.
 *
 * A primeira versão só sabia ir de feminino para masculino, porque as listas
 * começaram todas femininas. Bastou um tema com adjetivos masculinos para sair
 * "A Runa Quieto" — e o gerador de nome existe justamente para o DM não ter
 * que pensar, então um nome torto é pior do que campo em branco.
 *
 * Só a palavra ÚNICA terminada em -o ou -a flexiona. "de Ferro", "que Observa"
 * e "da Sexta Casa" não têm gênero, e mexer nelas produziria monstruosidade.
 */
function concordar(adjetivo: string, artigo: 'A' | 'O'): string {
  if (/\s/.test(adjetivo)) return adjetivo
  return adjetivo.replace(/[oa]$/, artigo === 'A' ? 'a' : 'o')
}

const pegar = <T,>(lista: T[], aleatorio: () => number): T =>
  lista[Math.floor(aleatorio() * lista.length)] ?? lista[0]

export interface NomeSorteado {
  nome: string
  vendedor: string
  tema: string
}

/**
 * Sorteia a loja e o vendedor, do mesmo tema.
 *
 * Recebe o gerador de propósito: com um `aleatorio` fixo o resultado é o mesmo,
 * e é isso que permite testar que o sorteio combina em vez de testar que ele
 * roda.
 */
export function sortearLoja(
  porte: PorteDeLoja,
  aleatorio: () => number = Math.random,
): NomeSorteado {
  const cabem = TEMAS.filter((t) => !t.portes || t.portes.includes(porte))
  const tema = pegar(cabem.length ? cabem : TEMAS, aleatorio)

  const [coisa, artigo] = pegar(tema.coisas, aleatorio)
  const adjetivo = concordar(pegar(tema.adjetivos, aleatorio), artigo)

  return {
    nome: `${artigo} ${coisa} ${adjetivo}`,
    vendedor: `${pegar(NOMES, aleatorio)}, ${pegar(tema.tracos, aleatorio)}`,
    tema: tema.id,
  }
}
