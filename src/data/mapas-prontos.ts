// Mapas de batalha que já vêm no app.
//
// Subir uma imagem antes de cada luta é atrito no pior momento: a mesa está
// esperando, e o encontro que ia durar dez minutos não merece uma busca por
// imagem. Para quem está começando é pior ainda — a tela vazia pede um arquivo
// que a pessoa não tem.
//
// São SVG escritos à mão e embutidos como data URL. Vetor, então escalam sem
// borrar em qualquer zoom; e sem buscar nada de fora, o que importa porque a
// versão publicada roda sob uma CSP que bloqueia host externo.
//
// De propósito são abstratos e discretos. O mapa é o fundo onde os tokens
// atuam — desenho detalhado demais briga com a grade e com as peças.

export interface MapaPronto {
  id: string
  nome: string
  icone: string
  /** Quadrados no lado maior, para a grade nascer alinhada. */
  colunas: number
  svg: string
}

/** Um SVG de 1200×800 — proporção 3:2, que cabe bem em tela e em celular. */
function moldura(interior: string, fundo: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<rect width="1200" height="800" fill="${fundo}"/>
${interior}
</svg>`
}

/** Data URL, com o SVG escapado para caber numa URL sem base64. */
function paraDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\n\s*/g, ' '))}`
}

const MASMORRA = moldura(
  `<defs>
    <pattern id="laje" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="#3a3733"/>
      <rect width="96" height="96" x="2" y="2" fill="#454039" rx="3"/>
      <rect width="42" height="42" x="6" y="6" fill="#4b463e" rx="2" opacity=".5"/>
      <rect width="42" height="42" x="52" y="52" fill="#403b34" rx="2" opacity=".5"/>
    </pattern>
  </defs>
  <rect x="60" y="60" width="1080" height="680" fill="url(#laje)"/>
  <rect x="60" y="60" width="1080" height="680" fill="none" stroke="#26231f" stroke-width="24"/>
  <rect x="60" y="60" width="1080" height="680" fill="none" stroke="#57504510" stroke-width="2"/>
  <circle cx="600" cy="400" r="150" fill="#2f2b26" opacity=".45"/>
  <circle cx="600" cy="400" r="96" fill="#585047" opacity=".25"/>`,
  '#1c1a17',
)

const FLORESTA = moldura(
  `<defs>
    <radialGradient id="copa" cx="40%" cy="35%">
      <stop offset="0%" stop-color="#3f7a44"/>
      <stop offset="100%" stop-color="#1f4426"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="#33532f"/>
  <ellipse cx="600" cy="410" rx="420" ry="270" fill="#48693c" opacity=".85"/>
  <ellipse cx="600" cy="410" rx="300" ry="180" fill="#55764a" opacity=".7"/>
  <path d="M0 620 Q300 560 600 610 T1200 580 L1200 800 L0 800 Z" fill="#2b4630" opacity=".7"/>
  <g opacity=".95">
    <circle cx="120" cy="130" r="72" fill="url(#copa)"/>
    <circle cx="290" cy="80" r="54" fill="url(#copa)"/>
    <circle cx="60" cy="330" r="60" fill="url(#copa)"/>
    <circle cx="1090" cy="150" r="80" fill="url(#copa)"/>
    <circle cx="960" cy="70" r="52" fill="url(#copa)"/>
    <circle cx="1140" cy="420" r="66" fill="url(#copa)"/>
    <circle cx="180" cy="700" r="64" fill="url(#copa)"/>
    <circle cx="1020" cy="720" r="70" fill="url(#copa)"/>
    <circle cx="520" cy="740" r="48" fill="url(#copa)"/>
  </g>
  <g fill="#6b6152" opacity=".5">
    <ellipse cx="430" cy="300" rx="34" ry="22"/>
    <ellipse cx="760" cy="520" rx="42" ry="26"/>
  </g>`,
  '#2a4429',
)

const CAVERNA = moldura(
  `<rect width="1200" height="800" fill="#17161a"/>
  <path d="M150 120 Q420 40 700 110 Q980 70 1080 180 Q1160 340 1090 520 Q1040 700 800 720
           Q560 760 340 700 Q140 640 110 440 Q90 240 150 120 Z" fill="#3b3742"/>
  <path d="M200 170 Q450 100 690 165 Q930 130 1020 230 Q1090 370 1030 510
           Q980 660 790 675 Q570 705 380 655 Q210 600 185 430 Q170 260 200 170 Z"
        fill="#4a4552"/>
  <g fill="#2b2833" opacity=".8">
    <ellipse cx="380" cy="290" rx="46" ry="30"/>
    <ellipse cx="820" cy="250" rx="38" ry="26"/>
    <ellipse cx="620" cy="560" rx="54" ry="32"/>
    <ellipse cx="950" cy="470" rx="34" ry="24"/>
  </g>
  <ellipse cx="600" cy="400" rx="180" ry="120" fill="#5b5566" opacity=".35"/>`,
  '#0f0e12',
)

const TAVERNA = moldura(
  `<defs>
    <pattern id="tabua" width="1200" height="64" patternUnits="userSpaceOnUse">
      <rect width="1200" height="64" fill="#6b4a2f"/>
      <rect width="1200" height="60" y="2" fill="#7a5637"/>
      <rect width="1200" height="2" y="60" fill="#5a3d26"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#tabua)"/>
  <rect x="40" y="40" width="1120" height="720" fill="none" stroke="#4a3120" stroke-width="26"/>
  <g fill="#5d3f28" opacity=".9">
    <rect x="120" y="150" width="180" height="110" rx="10"/>
    <rect x="900" y="150" width="180" height="110" rx="10"/>
    <rect x="120" y="540" width="180" height="110" rx="10"/>
    <rect x="900" y="540" width="180" height="110" rx="10"/>
    <rect x="470" y="330" width="260" height="140" rx="12"/>
  </g>
  <rect x="40" y="40" width="1120" height="90" fill="#4a3120"/>
  <rect x="60" y="60" width="1080" height="50" fill="#8a6340" opacity=".6"/>`,
  '#3a2617',
)

const ESTRADA = moldura(
  `<rect width="1200" height="800" fill="#4d6b3f"/>
  <ellipse cx="200" cy="120" rx="260" ry="150" fill="#456139" opacity=".8"/>
  <ellipse cx="1000" cy="680" rx="300" ry="170" fill="#456139" opacity=".8"/>
  <path d="M-20 300 Q300 250 600 400 Q900 550 1220 500 L1220 620 Q900 670 600 520
           Q300 370 -20 420 Z" fill="#93805e"/>
  <path d="M-20 350 Q300 300 600 450 Q900 600 1220 550" fill="none"
        stroke="#a89570" stroke-width="8" opacity=".6"/>
  <g fill="#6b6152" opacity=".55">
    <ellipse cx="330" cy="180" rx="26" ry="18"/>
    <ellipse cx="880" cy="230" rx="32" ry="20"/>
    <ellipse cx="240" cy="640" rx="30" ry="20"/>
  </g>`,
  '#3f5836',
)

const VAZIO = moldura(
  `<rect width="1200" height="800" fill="#26242a"/>
  <rect x="30" y="30" width="1140" height="740" fill="#2e2c33" rx="8"/>`,
  '#1b1a1e',
)

/**
 * Os mapas oferecidos na tela vazia.
 *
 * Poucos e genéricos: a graça é sair do "preciso achar uma imagem" em dez
 * segundos, não escolher entre trinta variações de caverna.
 */
export const MAPAS_PRONTOS: MapaPronto[] = [
  { id: 'masmorra', nome: 'Masmorra', icone: '🏰', colunas: 12, svg: MASMORRA },
  { id: 'caverna', nome: 'Caverna', icone: '🕳️', colunas: 12, svg: CAVERNA },
  { id: 'floresta', nome: 'Floresta', icone: '🌲', colunas: 12, svg: FLORESTA },
  { id: 'estrada', nome: 'Estrada', icone: '🛣️', colunas: 12, svg: ESTRADA },
  { id: 'taverna', nome: 'Taverna', icone: '🍺', colunas: 12, svg: TAVERNA },
  { id: 'vazio', nome: 'Só a grade', icone: '⬜', colunas: 12, svg: VAZIO },
]

/** A imagem de um mapa pronto, no formato que a cena guarda. */
export function urlDoMapaPronto(id: string): string {
  const m = MAPAS_PRONTOS.find((x) => x.id === id)
  return m ? paraDataUrl(m.svg) : ''
}
