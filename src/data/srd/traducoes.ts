// A tradução dos itens do SRD, escrita à mão.
//
// Fica separada de `itens-srd.ts` porque aquele é gerado: regerar o catálogo
// não pode apagar o trabalho de tradução. A chave é o nome em inglês, que é o
// que não muda.
//
// O texto oficial continua ao lado, em inglês, e não some nunca. Em item mágico
// o detalhe é tudo — quantas cargas, se recarrega ao amanhecer, se a CD é 15 ou
// 17 — e quando a mesa discutir, é o original que decide.
//
// Os lotes são por letra inicial. Não é organização: é para cada tanda de
// tradução ser um arquivo novo em vez de uma reescrita do arquivo inteiro, que
// é onde se perde trabalho já feito.
//
// Como se traduz aqui:
//
// - Termo de regra segue o app, não o dicionário: salvaguarda, CD, ação Magia,
//   vantagem, Classe de Armadura, condição Incapacitado.
// - Distância em metros, porque o resto do app é em metros. Pés viram a
//   conversão de mesa (9 m para 30 pés), não a matemática exata.
// - Peso em quilos, pela mesma razão.
// - Segunda pessoa, como o livro: "você veste", não "o personagem veste".
// - Nome de magia em português quando o app já tem a magia.
// - Onde o SRD tem tabela, a extração não consegue trazer — a tradução diz
//   isso em vez de fingir que o item acaba ali.

export interface TraducaoDeItem {
  /** O nome em português. */
  nome: string
  /** A descrição em português. */
  texto: string
}

import { A } from './traducoes/a'
import { B } from './traducoes/b'
import { C } from './traducoes/c'
import { D } from './traducoes/d'
import { E } from './traducoes/e'
import { FG } from './traducoes/f-g'
import { H } from './traducoes/h'

export const TRADUCOES: Record<string, TraducaoDeItem> = {
  ...A,
  ...B,
  ...C,
  ...D,
  ...E,
  ...FG,
  ...H,
}
