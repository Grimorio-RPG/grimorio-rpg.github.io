// Qual edição esta mesa joga — e o que ela aceita de fora dela.
//
// São DUAS perguntas, e tratá-las como uma só é o erro que este módulo evita:
//
// 1. Com que REGRA se calcula? Aumento de atributo vem da raça (2014) ou do
//    antecedente (2024)? Exaustão é seis degraus distintos ou −2 por nível?
//    Subclasse entra no 3 para todos ou varia entre 1, 2 e 3? Isso é uma só por
//    mesa: meia regra não existe, e uma ficha calculada metade em cada é
//    plausível e errada — o pior defeito que este app produz.
//
// 2. De onde pode vir o CONTEÚDO? "Jogo com as regras de 2024, mas quero deixar
//    meu jogador pegar uma subclasse de 2014" é uma mesa legítima e comum. Isso
//    é escolha do DM, e é independente da primeira.
//
// Hoje o app só tem conteúdo de 2024 — o catálogo inteiro vem do SRD 5.2.1. A
// segunda chave existe para o dia em que houver o outro, e a tela diz isso em
// vez de oferecer um interruptor que não faz nada.

export type Edicao = '2014' | '2024'

export const EDICOES: { valor: Edicao; nome: string; detalhe: string }[] = [
  {
    valor: '2024',
    nome: 'D&D 5.5e (2024)',
    detalhe: 'Antecedente dá os atributos, subclasse no nível 3, maestria de armas.',
  },
  {
    valor: '2014',
    nome: 'D&D 5e (2014)',
    detalhe: 'Raça dá os atributos, sub-raças, subclasse varia entre os níveis 1 e 3.',
  },
]

export interface RegrasDaMesa {
  /** Com que regra o app calcula. Uma só por mesa. */
  edicao: Edicao
  /**
   * Aceita conteúdo da outra edição?
   *
   * Vale para o que se ESCOLHE — subclasse, talento, espécie, magia —, e não
   * para a conta. Uma subclasse de 2014 numa mesa de 2024 continua sendo
   * calculada pelas regras de 2024, que é o que a mesa combinou.
   */
  aceitaOutraEdicao: boolean
}

/**
 * O padrão.
 *
 * 2024 porque é o que o app inteiro já é: todo o catálogo veio do SRD 5.2.1, e
 * abrir em 2014 seria prometer uma coisa que não está lá.
 */
export const REGRAS_PADRAO: RegrasDaMesa = { edicao: '2024', aceitaOutraEdicao: false }

/** As regras da mesa, com o padrão para campanha antiga que não tem o campo. */
export function regrasDe(campanha: { regras?: Partial<RegrasDaMesa> } | null | undefined): RegrasDaMesa {
  return { ...REGRAS_PADRAO, ...(campanha?.regras ?? {}) }
}

/** O nome da edição, para a tela. */
export function nomeDaEdicao(e: Edicao): string {
  return EDICOES.find((x) => x.valor === e)?.nome ?? e
}

/** A marca curta que aparece no cabeçalho. */
export function marcaDaEdicao(e: Edicao): string {
  return e === '2014' ? 'D&D 5e' : 'D&D 5.5e'
}

/**
 * De qual edição é este pedaço de conteúdo.
 *
 * Ausente significa 2024: todo o catálogo de hoje veio do SRD 5.2.1, e marcar
 * quatrocentas entradas com o que já é o padrão seria quatrocentas chances de
 * esquecer uma. Quando o conteúdo de 2014 entrar, ele vem marcado.
 */
export function edicaoDe(item: { edicao?: Edicao } | undefined): Edicao {
  return item?.edicao ?? '2024'
}

/**
 * Esta mesa pode usar este conteúdo?
 *
 * O da própria edição sempre pode. O da outra depende da chave — e é por isso
 * que ela existe separada da regra.
 */
export function podeUsar(regras: RegrasDaMesa, item: { edicao?: Edicao } | undefined): boolean {
  return edicaoDe(item) === regras.edicao || regras.aceitaOutraEdicao
}

/**
 * Há conteúdo desta edição no app?
 *
 * Enquanto a resposta for não, a tela precisa dizer — um seletor que promete
 * 2014 e entrega 2024 é pior do que seletor nenhum. Vira `true` no dia em que o
 * catálogo do SRD 5.1 entrar.
 */
export function temConteudo(e: Edicao): boolean {
  return e === '2024'
}
