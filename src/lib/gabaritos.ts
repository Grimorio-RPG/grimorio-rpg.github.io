// Gabaritos de área: o cone, a esfera, a linha e o cubo desenhados sobre a grade.
//
// A Bola de Fogo pega quem? A mesa resolvia isso com o dedo sobre o mapa e uma
// discussão — e a discussão sempre acontecia DEPOIS de alguém dizer onde ia
// jogar, quando ninguém mais consegue ser imparcial sobre se o ladino estava
// dentro ou fora. Numa mesa física com miniaturas é pior ainda: o cone não tem
// contorno nenhum, e sobra a mão do DM riscando o ar.
//
// A unidade daqui é o QUADRADO, e não o pixel nem o metro. Pixel muda com o
// zoom; metro obriga a dividir por 1,5 para voltar ao número inteiro que a
// grade já tem. Vinte pés do livro são quatro quadrados, e é assim que este
// módulo pensa do começo ao fim.
//
// A geometria vem do SRD 5.2.1, "Areas of Effect", e o detalhe que quase todo
// mundo erra está no cone — a explicação está em `contorno`.

export type TipoDeGabarito = 'cone' | 'esfera' | 'linha' | 'cubo'

/** Um ponto do tabuleiro, medido em quadrados a partir do canto da grade. */
export interface Ponto {
  x: number
  y: number
}

export interface Gabarito {
  tipo: TipoDeGabarito
  /**
   * De onde a área sai: o centro da esfera, a ponta do cone, o começo da linha,
   * o meio da face próxima do cubo.
   */
  origem: Ponto
  /** Para onde aponta. A esfera ignora. */
  mira: Ponto
  /** Raio da esfera, comprimento do cone e da linha, lado do cubo. */
  quadrados: number
  /** Largura da linha. Ausente = 1 quadrado, que é o padrão do livro. */
  largura?: number
}

/** Uma criatura no tabuleiro, do jeito que o gabarito precisa vê-la. */
export interface AlvoNoTabuleiro {
  id: string
  /** Centro, em quadrados. */
  x: number
  y: number
  /** Lado do espaço que ela ocupa, em quadrados. */
  tamanho: number
}

export const METROS_POR_QUADRADO = 1.5

/** Quantos metros são estes quadrados — para quem fala em metros na mesa. */
export function emMetros(quadrados: number): number {
  return Math.round(quadrados * METROS_POR_QUADRADO * 10) / 10
}

const LADOS_DO_CIRCULO = 48

/**
 * Para onde o gabarito aponta, como vetor de comprimento 1.
 *
 * Quando a mira cai em cima da origem não há direção nenhuma — e é o estado
 * normal no instante em que o dedo encosta, antes de arrastar. Sem uma direção
 * padrão o cone vira um ponto e some enquanto está sendo colocado, que é
 * exatamente quando ele precisa aparecer.
 */
function direcao(g: Gabarito): Ponto {
  const dx = g.mira.x - g.origem.x
  const dy = g.mira.y - g.origem.y
  const d = Math.hypot(dx, dy)
  if (d < 1e-9) return { x: 1, y: 0 }
  return { x: dx / d, y: dy / d }
}

/** O eixo mais próximo dos quatro da grade — o cubo não fica torto. */
function eixo(u: Ponto): Ponto {
  return Math.abs(u.x) >= Math.abs(u.y)
    ? { x: Math.sign(u.x) || 1, y: 0 }
    : { x: 0, y: Math.sign(u.y) }
}

/**
 * O contorno do gabarito, em quadrados. Serve para desenhar e para conferir.
 *
 * O CONE é onde quase toda ferramenta erra. O livro diz: "A Cone's width at any
 * point along its length is equal to that point's distance from the point of
 * origin", e o comprimento é medido no EIXO. Então a boca de um cone de 6
 * quadrados tem 6 quadrados de largura — e os cantos ficam a 6,7 da ponta, não
 * a 6. Desenhar dois raios de 6 girados de um ângulo qualquer dá uma boca de
 * 5,4: um cone estreito demais, que deixa de fora quem o livro pega.
 */
export function contorno(g: Gabarito): Ponto[] {
  const { origem: o } = g
  const L = Math.max(0, g.quadrados)
  const u = direcao(g)
  const n = { x: -u.y, y: u.x }

  if (g.tipo === 'esfera') {
    return Array.from({ length: LADOS_DO_CIRCULO }, (_, i) => {
      const a = (i / LADOS_DO_CIRCULO) * Math.PI * 2
      return { x: o.x + Math.cos(a) * L, y: o.y + Math.sin(a) * L }
    })
  }

  if (g.tipo === 'cone') {
    const meia = L / 2
    return [
      { x: o.x, y: o.y },
      { x: o.x + u.x * L + n.x * meia, y: o.y + u.y * L + n.y * meia },
      { x: o.x + u.x * L - n.x * meia, y: o.y + u.y * L - n.y * meia },
    ]
  }

  if (g.tipo === 'linha') {
    const meia = Math.max(0, g.largura ?? 1) / 2
    return [
      { x: o.x + n.x * meia, y: o.y + n.y * meia },
      { x: o.x + u.x * L + n.x * meia, y: o.y + u.y * L + n.y * meia },
      { x: o.x + u.x * L - n.x * meia, y: o.y + u.y * L - n.y * meia },
      { x: o.x - n.x * meia, y: o.y - n.y * meia },
    ]
  }

  // Cubo: o livro põe a origem numa FACE, não no centro, e o cubo cresce dali
  // para onde se aponta. Fica preso aos eixos da grade porque é assim que ele é
  // colocado numa mesa de verdade — um quadrado torto sobre a grade não se
  // conta com o dedo.
  const e = eixo(u)
  const p = { x: -e.y, y: e.x }
  const meia = L / 2
  return [
    { x: o.x + p.x * meia, y: o.y + p.y * meia },
    { x: o.x + e.x * L + p.x * meia, y: o.y + e.y * L + p.y * meia },
    { x: o.x + e.x * L - p.x * meia, y: o.y + e.y * L - p.y * meia },
    { x: o.x - p.x * meia, y: o.y - p.y * meia },
  ]
}

/** O espaço que a criatura ocupa: um quadrado, como no livro. */
function espacoDe(a: AlvoNoTabuleiro): Ponto[] {
  const meia = Math.max(1, a.tamanho) / 2
  return [
    { x: a.x - meia, y: a.y - meia },
    { x: a.x + meia, y: a.y - meia },
    { x: a.x + meia, y: a.y + meia },
    { x: a.x - meia, y: a.y + meia },
  ]
}

/** Distância de um ponto ao quadrado da criatura. Zero se estiver dentro. */
function distanciaAoEspaco(p: Ponto, a: AlvoNoTabuleiro): number {
  const meia = Math.max(1, a.tamanho) / 2
  const dx = Math.max(Math.abs(p.x - a.x) - meia, 0)
  const dy = Math.max(Math.abs(p.y - a.y) - meia, 0)
  return Math.hypot(dx, dy)
}

/** Dois convexos se encostam? Eixo separador — se existe um, não se tocam. */
function encostam(a: Ponto[], b: Ponto[]): boolean {
  for (const poli of [a, b]) {
    for (let i = 0; i < poli.length; i++) {
      const p = poli[i]
      const q = poli[(i + 1) % poli.length]
      const ex = -(q.y - p.y)
      const ey = q.x - p.x
      let aMin = Infinity, aMax = -Infinity, bMin = Infinity, bMax = -Infinity
      for (const v of a) {
        const d = v.x * ex + v.y * ey
        if (d < aMin) aMin = d
        if (d > aMax) aMax = d
      }
      for (const v of b) {
        const d = v.x * ex + v.y * ey
        if (d < bMin) bMin = d
        if (d > bMax) bMax = d
      }
      if (aMax < bMin || bMax < aMin) return false
    }
  }
  return true
}

/**
 * A área pega esta criatura?
 *
 * O critério é o do livro: pega se a área TOCA o espaço dela. Não é o centro do
 * token — usar o centro tiraria da Bola de Fogo metade dos gigantes, que
 * ocupam quatro quadrados e são atingidos com folga por uma explosão que só
 * alcança a beirada.
 *
 * A esfera sai do polígono e vai por distância: o círculo desenhado tem 48
 * lados, e um polígono é sempre um pouquinho menor do que o círculo que ele
 * imita. Quem estivesse exatamente no limite ficaria de fora por um erro de
 * desenho — e "exatamente no limite" é o único caso que alguém discute.
 */
export function pega(g: Gabarito, alvo: AlvoNoTabuleiro): boolean {
  if (g.quadrados <= 0) return false
  if (g.tipo === 'esfera') return distanciaAoEspaco(g.origem, alvo) <= g.quadrados
  return encostam(contorno(g), espacoDe(alvo))
}

/** Quem a área pega, na ordem em que veio. */
export function apanhados<T extends AlvoNoTabuleiro>(g: Gabarito, alvos: T[]): T[] {
  return alvos.filter((a) => pega(g, a))
}

const NOME_DA_FORMA: Record<TipoDeGabarito, string> = {
  cone: 'Cone',
  esfera: 'Esfera',
  linha: 'Linha',
  cubo: 'Cubo',
}

/**
 * O gabarito em palavras — e nas duas unidades.
 *
 * Quadrados para quem está com a grade na frente, metros para quem está lendo a
 * magia. O app existe para as duas mesas ao mesmo tempo, e traduzir de cabeça
 * entre uma e outra é justamente a conta que ele deveria poupar.
 */
export function rotulo(g: Gabarito): string {
  const tam = `${g.quadrados} q · ${emMetros(g.quadrados)} m`
  if (g.tipo === 'linha') {
    const l = g.largura ?? 1
    return `Linha de ${tam}, ${l} q de largura`
  }
  return `${NOME_DA_FORMA[g.tipo]} de ${tam}`
}
