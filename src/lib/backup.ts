// Backup completo: exporta e restaura todos os dados do app em um arquivo.

import { CHAVES, TODAS_AS_CHAVES, flush, readRaw, removeRaw, writeRaw } from './store'

const FORMATO = 'grimorio55e-backup'
const VERSAO = 1

export interface Backup {
  formato: string
  versao: number
  criadoEm: string
  dados: Record<string, string>
}

/** Monta o objeto de backup com tudo que está salvo. */
export function montarBackup(): Backup {
  const dados: Record<string, string> = {}
  for (const chave of TODAS_AS_CHAVES) {
    const v = readRaw(chave)
    if (v != null) dados[chave] = v
  }
  return { formato: FORMATO, versao: VERSAO, criadoEm: new Date().toISOString(), dados }
}

/** Baixa o backup como arquivo .json. */
export function baixarBackup(): void {
  const blob = new Blob([JSON.stringify(montarBackup(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const data = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `grimorio-backup-${data}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface ResumoBackup {
  personagens: number
  criaturas: number
  npcs: number
  sessoes: number
  temCampanha: boolean
  temMapa: boolean
  temBatalha: boolean
  criadoEm: string
}

function contar(json: string | undefined): number {
  if (!json) return 0
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? v.length : 0
  } catch {
    return 0
  }
}

/** Valida o arquivo e resume o que ele contém, para confirmação antes de restaurar. */
export function lerBackup(texto: string): { backup: Backup; resumo: ResumoBackup } {
  const b = JSON.parse(texto) as Backup
  if (b?.formato !== FORMATO || typeof b.dados !== 'object' || b.dados == null) {
    throw new Error('formato inválido')
  }
  let npcs = 0
  let sessoes = 0
  try {
    const camp = b.dados[CHAVES.campanha] ? JSON.parse(b.dados[CHAVES.campanha]) : null
    npcs = Array.isArray(camp?.npcs) ? camp.npcs.length : 0
    sessoes = Array.isArray(camp?.sessoes) ? camp.sessoes.length : 0
  } catch {
    // resumo é informativo; segue com zeros
  }
  return {
    backup: b,
    resumo: {
      personagens: contar(b.dados[CHAVES.personagens]),
      criaturas: contar(b.dados[CHAVES.bestiario]),
      npcs,
      sessoes,
      temCampanha: !!b.dados[CHAVES.campanha],
      temMapa: !!b.dados[CHAVES.mapa],
      temBatalha: !!b.dados[CHAVES.batalha],
      criadoEm: b.criadoEm ?? '',
    },
  }
}

/**
 * Substitui todos os dados atuais pelos do backup.
 * Espera a gravação terminar, para ser seguro recarregar a página em seguida.
 */
export async function restaurarBackup(b: Backup): Promise<void> {
  for (const chave of TODAS_AS_CHAVES) {
    const v = b.dados[chave]
    if (v == null) removeRaw(chave)
    else writeRaw(chave, v)
  }
  await flush()
}

/** Apaga todos os dados do app. */
export async function apagarTudo(): Promise<void> {
  for (const chave of TODAS_AS_CHAVES) removeRaw(chave)
  await flush()
}
