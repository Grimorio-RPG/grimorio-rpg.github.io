import type { Abilities, Monster } from '../types'
import { uid } from './character'

const KEY = 'grimorio55e.bestiary.v1'
const SEED_FLAG = 'grimorio55e.bestiary.seeded.v1'

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
    revelado: false,
  }
}

function seed(): Monster[] {
  const base = () => ({ id: uid(), updatedAt: Date.now(), imagemUrl: '', revelado: false })
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
  ]
}

export function loadBestiary(): Monster[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
    // primeira visita: semeia exemplos editáveis
    if (!localStorage.getItem(SEED_FLAG)) {
      const seeded = seed()
      localStorage.setItem(KEY, JSON.stringify(seeded))
      localStorage.setItem(SEED_FLAG, '1')
      return seeded
    }
    return []
  } catch {
    return []
  }
}

export function saveBestiary(list: Monster[]): void {
  localStorage.setItem(KEY, JSON.stringify(list))
}

/**
 * Converte um arquivo de imagem em data URL redimensionada, para caber com folga
 * no localStorage (limite ~5 MB). Mantém proporção, lado maior = maxSize.
 */
export function imageToDataUrl(file: File, maxSize = 480, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('img'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('ctx'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
