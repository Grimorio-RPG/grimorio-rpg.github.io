// Importa uma ficha exportada em PDF pelo D&D Beyond.
// O PDF do D&D Beyond guarda os dados em campos de formulário (AcroForm) com
// nomes previsíveis — lemos esses campos e montamos um Character.

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
// Importa o código do worker como módulo e o registra em globalThis para que o
// pdf.js rode no MAIN THREAD (sem Web Worker, sem Blob, sem arquivo externo).
// Isso é essencial para funcionar sob CSPs restritivas (ex: a versão single-file
// hospedada), que bloqueiam workers criados via blob:.
import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs'
import type { AbilityKey, Attack, Character, InventoryItem, SkillKey, SpellRef } from '../types'
import { novaFicha, uid } from './character'
import { abilityMod } from './calc'

let workerIniciado = false
function garantirWorker() {
  if (workerIniciado) return
  // Ao expor o WorkerMessageHandler aqui, o pdf.js usa o "fake worker" no
  // main thread em vez de tentar criar um Web Worker.
  ;(globalThis as unknown as { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker
  workerIniciado = true
}

// --- tabelas de tradução (D&D Beyond em inglês -> nosso app em português) ----

const RACA_PT: [RegExp, string][] = [
  [/elf/i, 'Elfo'],
  [/dwarf|anã|anao/i, 'Anão'],
  [/human/i, 'Humano'],
  [/halfling/i, 'Halfling'],
  [/dragonborn/i, 'Draconato'],
  [/gnome/i, 'Gnomo'],
  [/orc/i, 'Meio-Orc / Orc'],
  [/tiefling/i, 'Tiefling'],
  [/aasimar/i, 'Aasimar'],
  [/goliath|golias/i, 'Golias'],
]

const CLASSE_PT: Record<string, string> = {
  barbarian: 'Bárbaro', bard: 'Bardo', cleric: 'Clérigo', druid: 'Druida',
  fighter: 'Guerreiro', monk: 'Monge', paladin: 'Paladino', ranger: 'Patrulheiro',
  rogue: 'Ladino', sorcerer: 'Feiticeiro', warlock: 'Bruxo', wizard: 'Mago',
}

const ANTECEDENTE_PT: Record<string, string> = {
  acolyte: 'Acólito', artisan: 'Artesão', charlatan: 'Charlatão', criminal: 'Criminoso',
  entertainer: 'Artista', farmer: 'Camponês', guard: 'Guarda', guide: 'Guia',
  hermit: 'Eremita', merchant: 'Mercador', noble: 'Nobre', sage: 'Sábio',
  sailor: 'Marujo', scribe: 'Escriba', soldier: 'Soldado', wayfarer: 'Andarilho',
}

const ALINHAMENTO_PT: Record<string, string> = {
  'lawful good': 'Leal e Bom', 'neutral good': 'Neutro e Bom', 'chaotic good': 'Caótico e Bom',
  'lawful neutral': 'Leal e Neutro', 'neutral': 'Neutro', 'true neutral': 'Neutro', 'chaotic neutral': 'Caótico e Neutro',
  'lawful evil': 'Leal e Mau', 'neutral evil': 'Neutro e Mau', 'chaotic evil': 'Caótico e Mau',
}

const ABREV_ATRIBUTO: Record<string, AbilityKey> = {
  STR: 'for', DEX: 'des', CON: 'con', INT: 'int', WIS: 'sab', CHA: 'car',
}

// nome do campo "<Perícia>Prof" no PDF -> nossa chave de perícia
const PERICIA_PROF: [string, SkillKey][] = [
  ['AcrobaticsProf', 'acrobacia'], ['AnimalProf', 'lidarComAnimais'], ['ArcanaProf', 'arcanismo'],
  ['AthleticsProf', 'atletismo'], ['DeceptionProf', 'blefar'], ['HistoryProf', 'historia'],
  ['InsightProf', 'intuicao'], ['IntimidationProf', 'intimidacao'], ['InvestigationProf', 'investigacao'],
  ['MedicineProf', 'medicina'], ['NatureProf', 'natureza'], ['PerceptionProf', 'percepcao'],
  ['PerformanceProf', 'atuacao'], ['PersuasionProf', 'persuasao'], ['ReligionProf', 'religiao'],
  ['SleightofHandProf', 'prestidigitacao'], ['StealthProf', 'furtividade'], ['SurvivalProf', 'sobrevivencia'],
]

const SALVA_PROF: [string, AbilityKey][] = [
  ['StrProf', 'for'], ['DexProf', 'des'], ['ConProf', 'con'],
  ['IntProf', 'int'], ['WisProf', 'sab'], ['ChaProf', 'car'],
]

// --- utilitários -------------------------------------------------------------

const norm = (s: string) => s.trim().replace(/\s+/g, ' ')

function numOf(s: string): number {
  const m = (s || '').match(/-?\d+/)
  return m ? parseInt(m[0], 10) : 0
}

function nivelDoCabecalho(txt: string): number | null {
  if (/cantrip|truque/i.test(txt)) return 0
  const m = txt.match(/(\d+)\s*(st|nd|rd|th|º|o)\b/i)
  return m ? parseInt(m[1], 10) : null
}

export interface ImportResumo {
  nome: string
  classe: string
  nivel: number
  especie: string
  antecedente: string
  pericias: number
  ataques: number
  magias: number
  itens: number
  origem: string
}

/** Lê o PDF e retorna a ficha montada + um resumo para pré-visualização. */
export async function importarFichaDdb(file: File): Promise<{ char: Character; resumo: ImportResumo }> {
  garantirWorker()
  const buf = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjsLib.getDocument({ data: buf }).promise

  const mapa = new Map<string, string>()
  interface Item { norm: string; valor: string; page: number; y: number }
  const itens: Item[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const anns = await page.getAnnotations()
    for (const a of anns as { fieldName?: string; fieldValue?: unknown; rect?: number[] }[]) {
      if (a.fieldName == null) continue
      const valor = a.fieldValue == null ? '' : String(a.fieldValue).trim()
      const n = norm(a.fieldName)
      if (valor !== '') mapa.set(n, valor)
      itens.push({ norm: n, valor, page: i, y: a.rect ? a.rect[1] : 0 })
    }
  }

  const get = (nome: string) => mapa.get(norm(nome)) ?? ''
  const temProf = (campo: string) => {
    const v = get(campo)
    return v !== '' && v !== 'Off' && v !== '0'
  }

  const ficha = novaFicha()

  // Identidade
  ficha.nome = get('CharacterName')
  ficha.jogador = get('PLAYER NAME')

  const raca = get('RACE')
  ficha.especie = RACA_PT.find(([re]) => re.test(raca))?.[1] ?? raca

  const bg = get('BACKGROUND')
  ficha.antecedente = ANTECEDENTE_PT[bg.toLowerCase()] ?? bg

  const alin = get('ALIGNMENT')
  ficha.alinhamento = ALINHAMENTO_PT[alin.toLowerCase()] ?? alin

  // Classe e nível (pode ser multiclasse: "Monk 5 / Cleric 1")
  const classLevel = get('CLASS LEVEL')
  const partes = classLevel.split('/').map((s) => s.trim()).filter(Boolean)
  const primeira = partes[0] ?? ''
  const mCl = primeira.match(/^(.+?)\s+(\d+)$/)
  const classeEn = (mCl ? mCl[1] : primeira).trim()
  ficha.classe = CLASSE_PT[classeEn.toLowerCase()] ?? classeEn
  const nivelTotal = (classLevel.match(/\d+/g) ?? ['1']).reduce((a, b) => a + parseInt(b, 10), 0)
  ficha.nivel = Math.max(1, Math.min(20, nivelTotal))

  // Atributos
  for (const [abrev, key] of Object.entries(ABREV_ATRIBUTO)) {
    const v = numOf(get(abrev))
    if (v > 0) ficha.atributos[key] = v
  }

  // Salvaguardas e perícias proficientes
  ficha.salvaguardasProficientes = SALVA_PROF.filter(([c]) => temProf(c)).map(([, k]) => k)
  ficha.periciasProficientes = PERICIA_PROF.filter(([c]) => temProf(c)).map(([, k]) => k)

  // Combate
  const ac = numOf(get('AC'))
  ficha.classeArmaduraManual = ac > 0 ? ac : null
  const dexMod = abilityMod(ficha.atributos.des)
  ficha.iniciativaBonus = numOf(get('Init')) - dexMod
  const feet = numOf(get('Speed'))
  if (feet > 0) ficha.deslocamento = Math.round((feet / 5) * 1.5 * 10) / 10
  const hp = numOf(get('MaxHP'))
  if (hp > 0) { ficha.pvMax = hp; ficha.pvAtual = hp }
  ficha.pvTemporario = numOf(get('TempHP'))
  const hitDice = get('Total')
  if (hitDice) ficha.dadosDeVida = hitDice
  ficha.inspiracaoHeroica = temProf('Inspiration')

  // Ataques (até 6)
  const ataques: Attack[] = []
  for (let i = 1; i <= 6; i++) {
    const nome = get(i === 1 ? 'Wpn Name' : `Wpn Name ${i}`)
    if (!nome) continue
    ataques.push({
      id: uid(),
      nome,
      bonus: get(`Wpn${i} AtkBonus`),
      dano: get(`Wpn${i} Damage`),
      notas: get(`Wpn Notes ${i}`),
    })
  }
  ficha.ataques = ataques

  // Moedas
  ficha.moedas = {
    pc: numOf(get('CP')), pp: numOf(get('SP')), pe: numOf(get('EP')),
    po: numOf(get('GP')), pl: numOf(get('PP')),
  }

  // Inventário
  const inv: InventoryItem[] = []
  for (let n = 0; n <= 60; n++) {
    const nome = get(`Eq Name${n}`)
    if (!nome || nome === 'Custom Item') continue
    const lb = parseFloat((get(`Eq Weight${n}`).match(/[\d.]+/) ?? ['0'])[0]) || 0
    inv.push({
      id: uid(),
      nome,
      qtd: numOf(get(`Eq Qty${n}`)) || 1,
      peso: Math.round(lb * 0.4536 * 100) / 100,
      notas: '',
    })
  }
  ficha.inventario = inv

  // Conjuração
  const abrevConj = get('spellCastingAbility0').toUpperCase()
  if (ABREV_ATRIBUTO[abrevConj]) ficha.atributoConjuracao = ABREV_ATRIBUTO[abrevConj]

  // Espaços de magia (a partir dos cabeçalhos de nível)
  for (let n = 0; n <= 12; n++) {
    const nivel = nivelDoCabecalho(get(`spellHeader${n}`))
    if (nivel && nivel >= 1 && nivel <= 9) {
      const total = numOf(get(`spellSlotHeader${n}`))
      if (total > 0) ficha.espacosMagia[nivel - 1] = { total, usados: 0 }
    }
  }

  // Magias — associa cada nome ao nível do cabeçalho acima dele (por posição)
  const relevantes = itens
    .filter((it) => /^spellName\d+$/.test(it.norm) || /^spellHeader\d+$/.test(it.norm))
    .sort((a, b) => (a.page - b.page) || (b.y - a.y))
  const magias: SpellRef[] = []
  let nivelAtual = 0
  for (const it of relevantes) {
    if (it.norm.startsWith('spellHeader')) {
      const nv = nivelDoCabecalho(it.valor)
      if (nv != null) nivelAtual = nv
    } else if (it.valor) {
      magias.push({
        id: uid(),
        nome: it.valor.replace(/\s*\[R\]\s*$/, '').trim(),
        nivel: nivelAtual,
        preparada: true,
      })
    }
  }
  // Remove duplicatas (a mesma magia aparece em seções diferentes do PDF),
  // mantendo o menor nível encontrado.
  const porNome = new Map<string, SpellRef>()
  for (const m of magias) {
    const chave = m.nome.toLowerCase()
    const existente = porNome.get(chave)
    if (!existente || m.nivel < existente.nivel) porNome.set(chave, m)
  }
  ficha.magias = [...porNome.values()]

  // Idiomas e proficiências
  const profLang = get('ProficienciesLang')
  if (profLang) {
    ficha.proficienciasEquipamentos = profLang
    const mLang = profLang.match(/LANGUAGES\s*={2,}\s*([\s\S]*?)(?:={2,}|$)/i)
    if (mLang) ficha.idiomas = mLang[1].replace(/\n/g, ' ').trim() || ficha.idiomas
  }

  // Características / traços
  const traits = [get('FeaturesTraits1'), get('FeaturesTraits2'), get('FeaturesTraits3')].filter(Boolean).join('\n\n')
  const senses = [get('AdditionalSenses'), get('Defenses'), get('SaveModifiers')].filter(Boolean)
  ficha.caracteristicas = [
    `Classe (D&D Beyond): ${classLevel}`,
    senses.length ? `Sentidos/Defesas: ${senses.join(' · ')}` : '',
    traits,
  ].filter(Boolean).join('\n\n')

  // Ações e história -> anotações
  const acoes = [get('Actions1'), get('Actions2')].filter(Boolean).join('\n\n')
  const historia = [get('CHARACTER BACKSTORY'), get('PERSONALITY TRAITS'), get('IDEALS'), get('BONDS'), get('FLAWS')].filter(Boolean).join('\n\n')
  ficha.anotacoes = [historia, acoes].filter(Boolean).join('\n\n')

  const resumo: ImportResumo = {
    nome: ficha.nome || '(sem nome)',
    classe: ficha.classe,
    nivel: ficha.nivel,
    especie: ficha.especie,
    antecedente: ficha.antecedente,
    pericias: ficha.periciasProficientes.length,
    ataques: ficha.ataques.length,
    magias: ficha.magias.length,
    itens: ficha.inventario.length,
    origem: classLevel,
  }

  return { char: ficha, resumo }
}
