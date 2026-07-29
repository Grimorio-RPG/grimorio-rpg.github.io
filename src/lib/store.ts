// Camada de armazenamento do app.
//
// Antes usávamos localStorage direto, que tem limite de ~5 MB — mapas e fotos
// de criaturas estouravam esse teto. Agora os dados vivem no IndexedDB, que é
// muito maior, mas mantemos uma API SÍNCRONA: no boot carregamos tudo para um
// cache em memória e as escritas são persistidas em segundo plano.
//
// Se o IndexedDB não estiver disponível, caímos de volta no localStorage.

const DB_NOME = 'grimorio55e'
const DB_VERSAO = 1
const LOJA = 'kv'

/** Chaves de todos os dados do app (usadas também no backup). */
export const CHAVES = {
  personagens: 'grimorio55e.characters.v1',
  campanha: 'grimorio55e.campaign.v1',
  bestiario: 'grimorio55e.bestiary.v1',
  bestiarioSeed: 'grimorio55e.bestiary.seeded.v1',
  batalha: 'grimorio55e.battle.v1',
  mapa: 'grimorio55e.mapscene.v1',
  mundo: 'grimorio55e.mundo.v1',
  // As imagens dos mapas ficam à parte: salvar um ponto não pode reescrever
  // megabytes de imagem.
  mundoImagens: 'grimorio55e.mundo.imagens.v1',
  rolagens: 'grimorio55e.rolls.v1',
  // Quais fichas foram enviadas à mesa. A verdade fica na nuvem; isto é cache
  // para a tela responder antes da rede — mas entra no backup, senão um export
  // restaurado voltaria sem saber o que já estava compartilhado.
  fichasCompartilhadas: 'grimorio55e.fichasCompartilhadas.v1',
} as const

export const TODAS_AS_CHAVES: string[] = Object.values(CHAVES)

const cache = new Map<string, string>()
let db: IDBDatabase | null = null
let usandoFallback = false

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOME, DB_VERSAO)
    req.onupgradeneeded = () => {
      const d = req.result
      if (!d.objectStoreNames.contains(LOJA)) d.createObjectStore(LOJA)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function lerTudo(d: IDBDatabase): Promise<[string, string][]> {
  return new Promise((resolve, reject) => {
    const tx = d.transaction(LOJA, 'readonly')
    const loja = tx.objectStore(LOJA)
    const chaves = loja.getAllKeys()
    const valores = loja.getAll()
    tx.oncomplete = () => {
      const ks = (chaves.result ?? []) as IDBValidKey[]
      const vs = (valores.result ?? []) as unknown[]
      const pares: [string, string][] = []
      ks.forEach((k, i) => {
        const v = vs[i]
        if (typeof k === 'string' && typeof v === 'string') pares.push([k, v])
      })
      resolve(pares)
    }
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Prepara o armazenamento: abre o banco, carrega o cache e migra dados que
 * ainda estejam no localStorage. Deve ser chamado antes de renderizar o app.
 */
export async function initStore(): Promise<void> {
  try {
    db = await abrirDb()
    for (const [k, v] of await lerTudo(db)) cache.set(k, v)

    // Migração: o que existe no localStorage e ainda não está no banco.
    // Depois de copiar, removemos a versão antiga — senão um dado apagado no
    // IndexedDB voltaria a ser importado no próximo boot.
    for (const chave of TODAS_AS_CHAVES) {
      const antigo = localStorage.getItem(chave)
      if (antigo == null) continue
      if (!cache.has(chave)) {
        cache.set(chave, antigo)
        gravar(chave, antigo)
      }
      try {
        localStorage.removeItem(chave)
      } catch {
        // ignora
      }
    }
    await flush()
  } catch {
    usandoFallback = true
    for (const chave of TODAS_AS_CHAVES) {
      const v = localStorage.getItem(chave)
      if (v != null) cache.set(chave, v)
    }
  }
}

// Gravações são assíncronas; guardamos as pendentes para poder aguardá-las
// antes de ações destrutivas (restaurar backup, recarregar a página).
const pendentes = new Set<Promise<void>>()

function transacao(acao: (loja: IDBObjectStore) => void): Promise<void> {
  if (!db) return Promise.resolve()
  const p = new Promise<void>((resolve) => {
    try {
      const tx = db!.transaction(LOJA, 'readwrite')
      acao(tx.objectStore(LOJA))
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      // o cache em memória segue válido nesta sessão
      resolve()
    }
  })
  pendentes.add(p)
  void p.then(() => pendentes.delete(p))
  return p
}

function gravar(chave: string, valor: string) {
  void transacao((loja) => loja.put(valor, chave))
}

function apagar(chave: string) {
  void transacao((loja) => loja.delete(chave))
}

/** Espera todas as gravações pendentes terminarem. */
export async function flush(): Promise<void> {
  while (pendentes.size > 0) {
    await Promise.all([...pendentes])
  }
}

/** Lê um valor bruto (string) do armazenamento. */
export function readRaw(chave: string): string | null {
  return cache.get(chave) ?? null
}

/**
 * Escreve um valor bruto. Retorna false apenas no modo de emergência
 * (localStorage) quando o dado não couber.
 */
export function writeRaw(chave: string, valor: string): boolean {
  cache.set(chave, valor)
  if (usandoFallback || !db) {
    try {
      localStorage.setItem(chave, valor)
      return true
    } catch {
      return false
    }
  }
  gravar(chave, valor)
  return true
}

export function removeRaw(chave: string): void {
  cache.delete(chave)
  // limpa também eventual resquício no localStorage, para não reaparecer
  try {
    localStorage.removeItem(chave)
  } catch {
    // ignora
  }
  if (usandoFallback || !db) return
  apagar(chave)
}

/** Lê e desserializa JSON, devolvendo o padrão em caso de erro. */
export function readJson<T>(chave: string, padrao: T): T {
  const raw = readRaw(chave)
  if (raw == null) return padrao
  try {
    const v = JSON.parse(raw)
    return (v ?? padrao) as T
  } catch {
    return padrao
  }
}

/** Serializa e grava JSON. */
export function writeJson(chave: string, valor: unknown): boolean {
  try {
    return writeRaw(chave, JSON.stringify(valor))
  } catch {
    return false
  }
}

/** Espaço usado/disponível, quando o navegador informa. */
export async function usoDeArmazenamento(): Promise<{ usadoMB: number; totalMB: number } | null> {
  try {
    const est = await navigator.storage?.estimate?.()
    if (!est || est.usage == null) return null
    return {
      usadoMB: Math.round(((est.usage ?? 0) / 1048576) * 10) / 10,
      totalMB: Math.round(((est.quota ?? 0) / 1048576) * 10) / 10,
    }
  } catch {
    return null
  }
}
