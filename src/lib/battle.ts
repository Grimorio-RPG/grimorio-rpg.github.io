import type { Battle, Combatant, Character, Monster, Token } from '../types'
import { abilityMod, armorClass } from './calc'
import { uid } from './character'
import { projetarRegistro } from './registro'
import { CHAVES, readRaw, writeJson } from './store'

const KEY = CHAVES.batalha

export function batalhaVazia(): Battle {
  return {
    updatedAt: Date.now(),
    nome: '',
    rodada: 1,
    turnoIndex: 0,
    emAndamento: false,
    combatentes: [],
  }
}

export function loadBattle(): Battle {
  try {
    const raw = readRaw(KEY)
    if (!raw) return batalhaVazia()
    const data = JSON.parse(raw)
    return {
      ...batalhaVazia(),
      ...data,
      combatentes: Array.isArray(data.combatentes) ? data.combatentes.map(normalizeCombatant) : [],
    }
  } catch {
    return batalhaVazia()
  }
}

/** Garante campos novos em combatentes salvos por versões antigas. */
function normalizeCombatant(c: Partial<Combatant>): Combatant {
  return {
    nomeOculto: false,
    condicoes: [],
    conhecimento: 'completo',
    iniciativa: null,
    iniciativaMod: 0,
    ...c,
  } as Combatant
}

/** Grava sem recarimbar — ver `persistirCampanha` para o porquê. */
export function persistirBatalha(b: Battle): Battle {
  writeJson(KEY, b)
  return b
}

export function saveBattle(b: Battle): Battle {
  const updated = { ...b, updatedAt: Date.now() }
  writeJson(KEY, updated)
  return updated
}

/**
 * Projeção pública da batalha — o que sai do aparelho do DM para o dos
 * jogadores.
 *
 * A visão dos jogadores já esconde estas informações na tela, mas isso não
 * bastaria: se os dados completos fossem enviados, bastaria abrir o inspetor do
 * navegador para ler o PV exato e o nome dos inimigos "ocultos". Então a
 * censura acontece ANTES de publicar.
 */
export function projetarBatalha(b: Battle): Battle {
  return {
    ...b,
    // O registro sai com os danos de inimigo sem número: somar as anotações
    // seria a porta dos fundos para descobrir quanto falta no chefe.
    registro: projetarRegistro(b.registro),
    // Quem está fora de cena some por inteiro, e não censurado: `nomeOculto`
    // mostra "???", que já revela que ALGO está ali. `oculto` é a emboscada que
    // ainda não saltou — ela não pode nem ocupar uma linha na iniciativa.
    combatentes: b.combatentes
      .filter((c) => !c.oculto)
      .map((c) => {
      if (c.origem !== 'inimigo') return c
      // PV vira porcentagem: a barra e o rótulo continuam certos, o número não.
      const pct = c.pvMax > 0 ? Math.round(Math.max(0, Math.min(1, c.pvAtual / c.pvMax)) * 100) : 0
      // Sem cair na imagem do DM — a mesma regra que o bestiário já segue e que
      // aqui faltava. Ela é referência privada, e muita gente cola ali o stat
      // block inteiro, com táticas e lore; entregá-la logo no combate é o pior
      // momento possível. Quem quiser compartilhar a arte preenche a foto do
      // grupo, que é o campo feito para isso.
      const img = c.imagemJogadorUrl
      return {
        ...c,
        nome: c.nomeOculto ? '???' : c.nome,
        imagemUrl: img,
        imagemJogadorUrl: img,
        ca: 0,
        iniciativaMod: 0,
        pvMax: 100,
        pvAtual: c.pvAtual > 0 ? Math.max(1, pct) : 0,
        // O contador lendário sai. Ele responderia "isto é um chefe" sobre uma
        // criatura que ainda está como "???" — o mesmo tipo de entrega que o
        // rank aparente existe para evitar.
        lendariasMax: undefined,
        lendariasRestantes: undefined,
        // O rank sai como o APARENTE, quando houver um — a mesma regra do
        // bestiário. É o que sustenta o plot twist: o grupo levanta a barra de
        // chefe para quem ele ACHA que é o chefe.
        categoria: c.categoriaAparente ?? c.categoria,
        categoriaAparente: undefined,
        // O nome da magia que o inimigo concentra é informação sua. Que ele
        // está concentrando, a mesa descobre olhando; o QUE ele conjurou, não.
        //
        // As rodadas restantes de condição ficam: a condição já aparece para o
        // grupo, e saber que o ogro fica atordoado por mais uma rodada é o tipo
        // de coisa que faz o jogador planejar em vez de perguntar.
        concentracao: undefined,
      }
    }),
  }
}

/** Cria N combatentes inimigos a partir de um monstro do bestiário. */
export function combatentesDeMonstro(m: Monster, qtd: number, jaNaCena = 0): Combatant[] {
  const mod = abilityMod(m.atributos.des)
  return Array.from({ length: Math.max(1, qtd) }, (_, i) => ({
    ...posicaoDeEntrada(jaNaCena + i, 'inimigo'),
    tamanho: quadradosDoTamanho(m.tamanho),
    id: uid(),
    origem: 'inimigo' as const,
    refId: m.id,
    nome: qtd > 1 ? `${m.nome || 'Inimigo'} ${i + 1}` : m.nome || 'Inimigo',
    imagemUrl: m.imagemUrl,
    imagemJogadorUrl: m.imagemJogadorUrl,
    conhecimento: m.conhecimento,
    ca: m.ca,
    pvMax: m.pvMax,
    pvAtual: m.pvMax,
    iniciativa: null,
    iniciativaMod: mod,
    nomeOculto: false,
    condicoes: [],
    ...(m.categoria ? { categoria: m.categoria } : {}),
    ...(m.categoriaAparente ? { categoriaAparente: m.categoriaAparente } : {}),
    ...(m.acoesLendarias
      ? { lendariasMax: m.acoesLendarias, lendariasRestantes: m.acoesLendarias }
      : {}),
  }))
}

// ---------------------------------------------------------------------------
// O combatente no mapa
//
// A criatura é uma só. Estas funções existem para o tabuleiro poder desenhar
// combatentes sem saber o que é uma batalha, e para o combatente poder ser
// arrastado sem virar um segundo cadastro.
// ---------------------------------------------------------------------------

/** Cores por origem, para o anel do token dizer de que lado a criatura está. */
const COR_PADRAO = { aliado: '#34d399', inimigo: '#f87171' } as const

/**
 * Onde a próxima criatura entra.
 *
 * Espalha numa diagonal leve: entrar quatro goblins empilhados no mesmo ponto
 * obrigaria a arrastar os quatro antes de conseguir clicar em qualquer um.
 */
export function posicaoDeEntrada(quantosJa: number, origem: 'aliado' | 'inimigo') {
  const coluna = quantosJa % 6
  const linha = Math.floor(quantosJa / 6) % 4
  // Os dois lados entram em cantos opostos, como numa mesa de verdade.
  const base = origem === 'aliado' ? 0.08 : 0.62
  return { x: base + coluna * 0.05, y: 0.12 + linha * 0.09 }
}

/** Tamanho em quadrados, lido do tamanho escrito na ficha da criatura. */
export function quadradosDoTamanho(tamanho: string): number {
  if (/colossal/i.test(tamanho)) return 4
  if (/enorme/i.test(tamanho)) return 3
  if (/grande/i.test(tamanho)) return 2
  return 1
}

/**
 * Desenha o combatente como token.
 *
 * O id é o MESMO do combatente — é isto que faz arrastar no mapa e tirar PV na
 * lista mexerem na mesma criatura.
 */
export function tokenDeCombatente(c: Combatant): Token {
  return {
    id: c.id,
    nome: c.nome,
    imagemUrl: c.imagemUrl,
    imagemJogadorUrl: c.imagemJogadorUrl,
    origem: c.origem,
    x: c.x ?? 0.5,
    y: c.y ?? 0.5,
    tamanho: c.tamanho ?? 1,
    cor: c.cor ?? COR_PADRAO[c.origem],
    oculto: !!c.oculto,
    conhecimento: c.conhecimento,
  }
}

/**
 * Os tokens da cena: as criaturas do combate mais os objetos do cenário.
 *
 * Portas, baús e marcações continuam vivendo na cena — não entram na
 * iniciativa, e obrigar cada barril a virar combatente seria absurdo.
 */
export function tokensDaCena(b: Battle, objetos: Token[]): Token[] {
  return [...b.combatentes.map(tokenDeCombatente), ...objetos.filter((t) => t.origem === 'objeto')]
}

/** Move uma criatura. Ignora quem não está na batalha — deve ser um objeto. */
export function moverCombatente(cs: Combatant[], id: string, x: number, y: number): Combatant[] {
  return cs.map((c) => (c.id === id ? { ...c, x, y } : c))
}

/**
 * Recarrega as ações lendárias de quem vai começar o turno.
 *
 * A regra é essa: o orçamento volta no início do turno da criatura, porque as
 * lendárias são gastas ENTRE os turnos dela — no turno dos outros.
 */
export function recarregarLendarias(combatentes: Combatant[], id: string): Combatant[] {
  return combatentes.map((c) =>
    c.id === id && c.lendariasMax ? { ...c, lendariasRestantes: c.lendariasMax } : c,
  )
}

/** Gasta ações lendárias de um combatente, sem deixar ficar negativo. */
export function gastarLendarias(combatentes: Combatant[], id: string, custo: number): Combatant[] {
  return combatentes.map((c) =>
    c.id === id
      ? { ...c, lendariasRestantes: Math.max(0, (c.lendariasRestantes ?? 0) - custo) }
      : c,
  )
}

/**
 * Faz as condições de quem começa o turno andarem uma rodada.
 *
 * O contador cai no início do turno da criatura, que é onde a maior parte das
 * durações de 5.5e termina ("até o fim do seu próximo turno" é o caso comum, e
 * fica um turno inteiro de folga).
 *
 * Devolve também o que expirou, para o registro poder contar.
 */
export function correrCondicoes(
  combatentes: Combatant[],
  id: string,
): { combatentes: Combatant[]; expiradas: { alvo: string; condicao: string; deInimigo: boolean }[] } {
  const expiradas: { alvo: string; condicao: string; deInimigo: boolean }[] = []

  const novos = combatentes.map((c) => {
    if (c.id !== id || !c.rodadasDeCondicao) return c

    const restantes: Record<string, number> = {}
    const nomes: string[] = []

    for (const nome of c.condicoes) {
      const quantas = c.rodadasDeCondicao[nome]
      // Sem contador é "até alguém tirar": não expira sozinha.
      if (quantas == null) {
        nomes.push(nome)
        continue
      }
      if (quantas <= 1) {
        expiradas.push({ alvo: c.nome, condicao: nome, deInimigo: c.origem === 'inimigo' })
        continue
      }
      restantes[nome] = quantas - 1
      nomes.push(nome)
    }

    return { ...c, condicoes: nomes, rodadasDeCondicao: restantes }
  })

  return { combatentes: novos, expiradas }
}

/**
 * É agora a hora das ações de covil?
 *
 * A regra marca "iniciativa 20, perdendo empates": elas acontecem depois de
 * todo mundo que tirou 20 ou mais, e antes do primeiro que tirou menos. Então
 * o momento é o turno de quem abre a faixa abaixo de 20.
 *
 * Sem esta conta o DM precisaria lembrar sozinho, todo turno, de uma coisa que
 * a mesa inteira esquece — o motivo de ações de covil quase nunca serem usadas.
 */
export function momentoDoCovil(b: Battle): boolean {
  if (!b.emAndamento) return false
  const ordem = ordenar(b.combatentes)
  const atual = ordem[b.turnoIndex]
  if (!atual || (atual.iniciativa ?? 0) >= 20) return false
  const anterior = ordem[b.turnoIndex - 1]
  // Primeiro da ordem já vale: ninguém tirou 20 ou mais nesta rodada.
  return !anterior || (anterior.iniciativa ?? 0) >= 20
}

/**
 * Quem ainda pode agir fora do próprio turno.
 *
 * Serve para a tela oferecer as lendárias durante o turno dos jogadores, que é
 * exatamente quando elas acontecem — e o motivo de o painel do inimigo da vez,
 * sozinho, não dar conta delas.
 */
export function comLendariasDisponiveis(b: Battle): Combatant[] {
  const daVez = ordenar(b.combatentes)[b.turnoIndex]
  return b.combatentes.filter(
    (c) =>
      c.origem === 'inimigo' &&
      c.pvAtual > 0 &&
      (c.lendariasRestantes ?? 0) > 0 &&
      c.id !== daVez?.id,
  )
}

/** Cria um combatente aliado a partir de uma ficha de personagem. */
export function combatenteDePersonagem(c: Character, jaNaCena = 0): Combatant {
  const mod = abilityMod(c.atributos.des) + (c.iniciativaBonus || 0)
  // `armorClass` e não uma conta à mão: a versão anterior fazia
  // `10 + DES`, ignorando armadura, escudo, estilo de luta Defesa e Defesa sem
  // Armadura — o combatente entrava na batalha com uma CA que não era a da
  // ficha. Cálculo de regra tem um dono só.
  const ca = armorClass(c)
  return {
    ...posicaoDeEntrada(jaNaCena, 'aliado'),
    id: uid(),
    origem: 'aliado',
    refId: c.id,
    nome: c.nome || 'Aventureiro',
    imagemUrl: c.avatarUrl || '',
    imagemJogadorUrl: c.avatarUrl || '',
    conhecimento: 'completo',
    ca,
    pvMax: c.pvMax,
    pvAtual: c.pvAtual,
    iniciativa: null,
    iniciativaMod: mod,
    nomeOculto: false,
    condicoes: [],
    // A ficha já sabia disto (`concentrando`) e a batalha ignorava — o mago
    // entrava em combate e a concentração sumia da tela do DM.
    ...(c.concentrando ? { concentracao: c.concentrando } : {}),
    inspiracaoHeroica: !!c.inspiracaoHeroica,
  }
}

export function rolarIniciativa(mod: number): number {
  return Math.floor(Math.random() * 20) + 1 + mod
}

/** Ordena por iniciativa (desc); quem não rolou vai para o fim. */
export function ordenar(cs: Combatant[]): Combatant[] {
  return [...cs].sort((a, b) => {
    if (a.iniciativa == null && b.iniciativa == null) return 0
    if (a.iniciativa == null) return 1
    if (b.iniciativa == null) return -1
    return b.iniciativa - a.iniciativa
  })
}

export interface StatusPV {
  label: string
  cor: string // classe de fundo tailwind
  texto: string // classe de texto tailwind
  pct: number
}

/** Estado qualitativo de vida — usado na visão dos jogadores (sem números). */
export function statusPV(pvAtual: number, pvMax: number): StatusPV {
  const pct = pvMax > 0 ? Math.max(0, Math.min(100, (pvAtual / pvMax) * 100)) : 0
  if (pvAtual <= 0) return { label: 'Derrotado', cor: 'bg-white/20', texto: 'text-parchment-200/50', pct }
  if (pct > 50) return { label: 'Saudável', cor: 'bg-emerald-500', texto: 'text-emerald-400', pct }
  if (pct > 25) return { label: 'Ferido', cor: 'bg-amber-500', texto: 'text-amber-400', pct }
  return { label: 'Quase morrendo', cor: 'bg-dragon-500', texto: 'text-dragon-400', pct }
}
