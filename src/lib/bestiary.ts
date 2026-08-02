import type { Abilities, KnowledgeLevel, Monster, TipoAcaoMonstro } from '../types'
import { uid } from './character'
import { CHAVES, readRaw, writeJson, writeRaw } from './store'

const KEY = CHAVES.bestiario
const SEED_FLAG = CHAVES.bestiarioSeed

/**
 * Quando a criatura usa cada coisa.
 *
 * O rótulo curto é o que cabe no seletor do editor; a explicação existe porque
 * lendária e covil são justamente as duas que a maior parte das mesas nunca
 * usou e não sabe o que fazem.
 */
export const TIPOS_ACAO: {
  valor: TipoAcaoMonstro
  rotulo: string
  icone: string
  explicacao: string
}[] = [
  { valor: 'acao', rotulo: 'Ação', icone: '⚔️', explicacao: 'No turno dela, a ação principal.' },
  { valor: 'bonus', rotulo: 'Bônus', icone: '⚡', explicacao: 'No turno dela, além da ação.' },
  {
    valor: 'reacao',
    rotulo: 'Reação',
    icone: '↩️',
    explicacao: 'Fora do turno dela, uma vez por rodada, quando o gatilho acontece.',
  },
  {
    valor: 'lendaria',
    rotulo: 'Lendária',
    icone: '👑',
    explicacao: 'Entre os turnos dela, gastando do orçamento da rodada.',
  },
  {
    valor: 'covil',
    rotulo: 'Covil',
    icone: '🕳️',
    explicacao: 'Na iniciativa 20, só enquanto a luta acontece no covil dela.',
  },
]

/** O rótulo de um tipo, com o padrão para fichas antigas, que não têm tipo. */
export function tipoAcaoInfo(tipo?: TipoAcaoMonstro) {
  return TIPOS_ACAO.find((t) => t.valor === (tipo ?? 'acao')) ?? TIPOS_ACAO[0]
}

export const NIVEIS_CONHECIMENTO: {
  valor: KnowledgeLevel
  label: string
  curto: string
  icone: string
  desc: string
}[] = [
  { valor: 'desconhecido', label: 'Desconhecido', curto: 'Oculto', icone: '🙈', desc: 'Os jogadores não veem esta criatura.' },
  { valor: 'encontrado', label: 'Encontrado', curto: 'Encontrado', icone: '👁', desc: 'Veem a foto, o nome, o tamanho e o tipo.' },
  { valor: 'parcial', label: 'Estudado (parcial)', curto: 'Parcial', icone: '📖', desc: 'Veem também ND, CA, PV, deslocamento e atributos.' },
  { valor: 'completo', label: 'Estudado (completo)', curto: 'Completo', icone: '✅', desc: 'Veem a ficha inteira (traços e ações). Táticas do DM continuam privadas.' },
]

export function nivelInfo(v: KnowledgeLevel) {
  return NIVEIS_CONHECIMENTO.find((n) => n.valor === v) ?? NIVEIS_CONHECIMENTO[0]
}

export const TAMANHOS = ['Miúdo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Colossal']
export const TIPOS = [
  'Aberração', 'Besta', 'Celestial', 'Constructo', 'Corruptor', 'Dragão',
  'Elemental', 'Fada', 'Gigante', 'Humanoide', 'Limo', 'Monstruosidade',
  'Morto-vivo', 'Planta',
]
export const NDS = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '10', '12', '15', '20']

const attrs = (f: number, d: number, c: number, i: number, s: number, ca: number): Abilities => ({
  for: f, des: d, con: c, int: i, sab: s, car: ca,
})

export function novoMonstro(): Monster {
  return {
    id: uid(),
    updatedAt: Date.now(),
    nome: '',
    imagemUrl: '',
    imagemJogadorUrl: '',
    tipo: '',
    tamanho: 'Médio',
    nd: '1',
    ca: 12,
    pvMax: 10,
    pvAtual: 10,
    deslocamento: '9 m',
    atributos: attrs(10, 10, 10, 10, 10, 10),
    tracos: '',
    acoes: [],
    taticas: '',
    conhecimento: 'desconhecido',
    categoria: 'comum',
    derrotado: false,
  }
}

export const CATEGORIAS_MONSTRO: {
  valor: NonNullable<Monster['categoria']>
  label: string
  icone: string
  /** Só os pesos-pesados aparecem como marco derrubado para o grupo. */
  marcavel: boolean
}[] = [
  { valor: 'comum', label: 'Comum', icone: '🐾', marcavel: false },
  { valor: 'elite', label: 'Elite', icone: '⭐', marcavel: false },
  { valor: 'miniboss', label: 'Mini Boss', icone: '💀', marcavel: true },
  { valor: 'boss', label: 'Boss', icone: '👑', marcavel: true },
  // BBEG é por campanha, não por arco: existe um só, e é isso que lhe dá peso.
  { valor: 'bbeg', label: 'BBEG', icone: '☠️👑', marcavel: true },
]

export function categoriaInfo(c: Monster['categoria']) {
  return CATEGORIAS_MONSTRO.find((x) => x.valor === (c ?? 'comum')) ?? CATEGORIAS_MONSTRO[0]
}

/** Riscar só faz sentido em criatura que o grupo persegue por sessões. */
export function podeMarcarDerrota(m: Monster): boolean {
  return categoriaInfo(m.categoria).marcavel
}

/** Completa campos ausentes e migra dados antigos (ex: revelado -> conhecimento). */
function normalizeMonster(raw: Partial<Monster> & { revelado?: boolean }): Monster {
  const conhecimento: KnowledgeLevel =
    raw.conhecimento ?? (raw.revelado ? 'completo' : 'desconhecido')
  return { ...novoMonstro(), ...raw, id: raw.id ?? uid(), conhecimento }
}

/**
 * Id fixo para as criaturas de exemplo.
 *
 * Com `uid()` cada aparelho semeava os mesmos três monstros com ids diferentes,
 * e a sincronização entre os aparelhos do DM — que junta por id — via seis
 * criaturas distintas. O id estável faz a junção reconhecê-las como a mesma.
 */
const idSemente = (nome: string) => `semente:${nome.toLowerCase()}`

function seed(): Monster[] {
  const base = () => ({
    id: '',
    updatedAt: Date.now(),
    imagemUrl: '',
    imagemJogadorUrl: '',
    conhecimento: 'desconhecido' as KnowledgeLevel,
  })
  return [
    {
      ...base(),
      nome: 'Goblin',
      tipo: 'Humanoide (goblinoide)',
      tamanho: 'Pequeno',
      nd: '1/4',
      ca: 15,
      pvMax: 7,
      pvAtual: 7,
      deslocamento: '9 m',
      atributos: attrs(8, 14, 10, 10, 8, 8),
      tracos: 'Fuga Ágil. Pode Desengajar ou Esconder-se como ação bônus em cada turno.',
      acoes: [
        { id: uid(), nome: 'Cimitarra', descricao: '+4 para acertar, 1d6+2 de dano cortante.' },
        { id: uid(), nome: 'Arco Curto', descricao: '+4 para acertar, alcance 24/96 m, 1d6+2 perfurante.' },
      ],
      taticas: 'Ataca em bando, foge para reposicionar e usa o terreno. Covarde se sozinho.',
    },
    {
      ...base(),
      nome: 'Lobo',
      tipo: 'Besta',
      tamanho: 'Médio',
      nd: '1/4',
      ca: 13,
      pvMax: 11,
      pvAtual: 11,
      deslocamento: '12 m',
      atributos: attrs(12, 15, 12, 3, 12, 6),
      tracos: 'Táticas de Matilha. Vantagem no ataque se um aliado estiver a até 1,5 m do alvo. Faro aguçado.',
      acoes: [
        { id: uid(), nome: 'Mordida', descricao: '+4 para acertar, 2d4+2 perfurante. Alvo Médio ou menor faz salvaguarda de Força (CD 11) ou cai no chão.' },
      ],
      taticas: 'Cerca a presa com a matilha para ganhar vantagem e derrubar alvos isolados.',
    },
    {
      ...base(),
      nome: 'Esqueleto',
      tipo: 'Morto-vivo',
      tamanho: 'Médio',
      nd: '1/4',
      ca: 13,
      pvMax: 13,
      pvAtual: 13,
      deslocamento: '9 m',
      atributos: attrs(10, 14, 15, 6, 8, 5),
      tracos: 'Vulnerável a dano concussivo. Imune a veneno e à condição envenenado. Não precisa respirar, comer nem dormir.',
      acoes: [
        { id: uid(), nome: 'Espada Curta', descricao: '+4 para acertar, 1d6+2 perfurante.' },
        { id: uid(), nome: 'Arco Curto', descricao: '+4 para acertar, alcance 24/96 m, 1d6+2 perfurante.' },
      ],
      taticas: 'Obedece ordens simples sem medo nem autopreservação. Avança em linha reta.',
    },
  ].map((m) => ({ ...m, id: idSemente(m.nome) }))
}

/** Campos que definem o conteúdo — ignora id, carimbo e estado de mesa. */
function assinatura(m: Monster): string {
  return JSON.stringify([
    m.nome, m.tipo, m.tamanho, m.nd, m.ca, m.pvMax, m.deslocamento,
    m.atributos, m.tracos, m.taticas,
    m.acoes.map((a) => [a.nome, a.descricao]),
  ])
}

/**
 * Devolve as sementes intocadas ao id estável.
 *
 * Quem já usava o app tem as três criaturas de exemplo com ids aleatórios, e
 * possivelmente duplicadas pela sincronização. Só remapeia o que bate campo a
 * campo com a semente original: se o DM mexeu em qualquer coisa, a criatura é
 * dele e fica como está.
 */
export function religarSementes(lista: Monster[]): Monster[] {
  const porAssinatura = new Map(seed().map((s) => [assinatura(s), s.id]))
  const porId = new Map<string, Monster>()
  const porConteudo = new Map<string, string>() // assinatura -> id mantido

  for (const m of lista) {
    const assin = assinatura(m)
    const idSem = porAssinatura.get(assin)
    const item = idSem ? { ...m, id: idSem } : m

    // Duas criaturas com exatamente o mesmo conteúdo são a mesma criatura,
    // venham de semente ou não: só a primeira versão desta limpeza colapsava
    // sementes, e por isso as cópias que já tinham sido tocadas sobreviviam.
    // Nada se perde — os campos comparados são todos iguais; fica a mais
    // recente.
    const jaVisto = porConteudo.get(assin)
    if (jaVisto) {
      const anterior = porId.get(jaVisto)
      if (anterior && (m.updatedAt ?? 0) > (anterior.updatedAt ?? 0)) {
        porId.set(jaVisto, { ...item, id: jaVisto })
      }
      continue
    }

    const existente = porId.get(item.id)
    if (existente) {
      if ((item.updatedAt ?? 0) > (existente.updatedAt ?? 0)) porId.set(item.id, item)
      continue
    }

    porId.set(item.id, item)
    porConteudo.set(assin, item.id)
  }

  return [...porId.values()]
}

export function loadBestiary(): Monster[] {
  try {
    const raw = readRaw(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const limpo = religarSementes(parsed.map(normalizeMonster))
        // Gravar de volta: a versão anterior limpava só na memória, então a
        // duplicata continuava no disco e voltava na sincronização seguinte.
        if (limpo.length !== parsed.length) writeJson(KEY, limpo)
        return limpo
      }
    }
    // primeira visita: semeia exemplos editáveis
    if (!readRaw(SEED_FLAG)) {
      const seeded = seed()
      writeJson(KEY, seeded)
      writeRaw(SEED_FLAG, '1')
      return seeded
    }
    return []
  } catch {
    return []
  }
}

export function saveBestiary(list: Monster[]): void {
  writeJson(KEY, list)
}

/**
 * O navegador sabe gravar WebP?
 *
 * Vale perguntar porque `toDataURL` não reclama de um formato que não conhece:
 * devolve PNG calado, que para uma foto sai MAIOR que o JPEG que queríamos
 * evitar. A resposta é a mesma a sessão toda, então perguntamos uma vez.
 */
let sabeWebp: boolean | null = null

function suportaWebp(): boolean {
  if (sabeWebp === null) {
    const teste = document.createElement('canvas')
    teste.width = 1
    teste.height = 1
    sabeWebp = teste.toDataURL('image/webp').startsWith('data:image/webp')
  }
  return sabeWebp
}

/** Desenha num canvas do tamanho pedido, mantendo a proporção. */
function desenharReduzido(fonte: CanvasImageSource, largura: number, altura: number, maxSize: number) {
  const escala = Math.min(1, maxSize / Math.max(largura, altura))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(largura * escala)
  canvas.height = Math.round(altura * escala)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('ctx')
  ctx.drawImage(fonte, 0, 0, canvas.width, canvas.height)
  return canvas
}

/**
 * Converte um arquivo de imagem em data URL redimensionada, para caber com folga
 * no localStorage (limite ~5 MB). Mantém proporção, lado maior = maxSize.
 *
 * Sai em WebP onde dá, com JPEG de reserva. Não é detalhe de formato: estas
 * imagens viajam embutidas no JSON que sincroniza entre os aparelhos, e o
 * mesmo retrato em WebP pesa perto de um terço menos com a mesma qualidade —
 * menos dado no 4G da mesa, e mais folga antes de esbarrar no limite de espaço.
 */
export async function imageToDataUrl(file: File, maxSize = 480, quality = 0.82): Promise<string> {
  const tipo = suportaWebp() ? 'image/webp' : 'image/jpeg'

  // Caminho curto: decodifica o arquivo direto, sem passar por uma base64
  // gigante no meio. Numa foto de celular de 12 MP essa string intermediária
  // sozinha passa de 15 MB.
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      try {
        return desenharReduzido(bitmap, bitmap.width, bitmap.height, maxSize).toDataURL(tipo, quality)
      } finally {
        bitmap.close()
      }
    } catch {
      // Formato que o `createImageBitmap` não decodifica (alguns HEIC, SVG);
      // o caminho abaixo dá conta.
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('img'))
      img.onload = () => {
        try {
          resolve(desenharReduzido(img, img.width, img.height, maxSize).toDataURL(tipo, quality))
        } catch {
          reject(new Error('ctx'))
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Projeção pública do bestiário — o que o DM publica para o grupo.
 *
 * A "Visão dos Jogadores" já mostrava só o permitido; aqui o corte acontece
 * antes de os dados saírem do aparelho do DM, então nem o inspetor do
 * navegador revela a ficha de um monstro ainda não estudado.
 */
export function projetarBestiario(list: Monster[]): Monster[] {
  return list
    .filter((m) => m.conhecimento !== 'desconhecido')
    .map((m) => {
      // Sem cair na imagem do DM. Ela é referência privada, e muita gente cola
      // ali o stat block inteiro — com táticas e lore. Antes havia um fallback
      // `imagemJogadorUrl || imagemUrl`, que entregava essa folha ao grupo no
      // instante em que a criatura virasse "encontrada". Quem quer compartilhar
      // a arte usa o botão de copiar para a foto do grupo, explicitamente.
      const img = m.imagemJogadorUrl
      const base = {
        ...m,
        imagemUrl: img,
        imagemJogadorUrl: img,
        taticas: '',
        // O tesouro é prep, e prep não sai. Saber que o chefe larga uma espada
        // +1 antes de derrubá-lo estraga o achado — e a lista de itens também
        // conta o que o DM planejou para depois.
        tesouro: undefined,
        // O grupo vê o rank aparente quando houver um. O verdadeiro nunca sai:
        // é ele que entregaria o plot twist antes da hora.
        categoria: m.categoriaAparente ?? m.categoria,
        categoriaAparente: undefined,
      }
      // Só "encontrou": tem a foto e o nome, mais nada.
      if (m.conhecimento === 'encontrado') {
        return {
          ...base,
          ca: 0,
          pvMax: 0,
          pvAtual: 0,
          deslocamento: '',
          tracos: '',
          acoes: [],
          // O orçamento lendário entregaria "é um chefe" de uma criatura que o
          // grupo só cruzou no corredor.
          acoesLendarias: undefined,
          atributos: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
        }
      }
      return base
    })
}

// ---------------------------------------------------------------------------
// Chefes com fases
//
// Um chefe que vira outra coisa a 0 PV é o clímax de um combate, e fazer isso
// à mão — apagar um monstro e adicionar outro na frente do grupo — estraga o
// efeito. Aqui as fases são criaturas completas que sabem umas das outras.
// ---------------------------------------------------------------------------

/** As fases de um chefe, em ordem. Lista vazia quando não é um chefe em fases. */
export function fasesDoChefe(lista: Monster[], chefeId: string | undefined): Monster[] {
  if (!chefeId) return []
  return lista
    .filter((m) => m.chefeId === chefeId)
    .sort((a, b) => (a.fase ?? 1) - (b.fase ?? 1))
}

/** A fase seguinte, se existir. É o que a batalha oferece ao chegar a 0 PV. */
export function proximaFase(lista: Monster[], atual: Monster): Monster | null {
  const fases = fasesDoChefe(lista, atual.chefeId)
  const i = fases.findIndex((m) => m.id === atual.id)
  return i >= 0 && i < fases.length - 1 ? fases[i + 1] : null
}

/**
 * Só as criaturas que abrem a lista.
 *
 * Fases seguintes não aparecem soltas no bestiário: elas vivem dentro do
 * cartão da primeira, senão a lista mostra três Belaks e nenhuma relação
 * entre eles.
 */
export function apenasPrimeirasFases(lista: Monster[]): Monster[] {
  return lista.filter((m) => !m.chefeId || (m.fase ?? 1) <= 1)
}

/** Rótulo curto de uma fase, para abas e selos. */
export function rotuloFase(m: Monster): string {
  if (m.nomeFase) return m.nomeFase
  const n = m.fase ?? 1
  return `Fase ${n}`
}
