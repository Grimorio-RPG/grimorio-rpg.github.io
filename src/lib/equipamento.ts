// O que o equipamento faz com a ficha.
//
// Os itens mágicos do app eram texto: "Anel de Proteção: +1 na CA e em todas as
// salvaguardas". Bonito e inútil — ninguém somava por você, e a conta acabava
// na cabeça da pessoa. Foi exatamente assim que a CA do Thorn divergiu do
// D&D Beyond.
//
// Aqui os efeitos viram números. E os que NÃO valem sempre — "+2 contra
// goblinoides" — ficam separados de propósito: somá-los ao total mentiria em
// toda luta que não fosse contra goblinoide.

import type {
  AbilityKey,
  Character,
  EfeitoDeItem,
  Equipamento,
  SkillKey,
  RaridadeItem,
  SlotEquipamento,
} from '../types'
import { acharArma, acharArmadura, type Arma, type Armadura } from '../data/equipment'
import { uid } from './character'

/**
 * A cor de cada raridade.
 *
 * É a convenção que veio dos RPGs de saque — branco, verde, azul, roxo,
 * laranja — e que quase todo jogador já lê sem precisar de legenda. Serve para
 * bater o olho numa mochila cheia e ver o que importa.
 *
 * Comum fica sem cor de propósito: colorir tudo é o mesmo que não colorir
 * nada, e a maior parte do que se carrega é comum.
 */
export const CORES_RARIDADE: Record<RaridadeItem, { texto: string; anel: string; fundo: string }> = {
  'Comum': { texto: 'text-parchment-50', anel: 'border-white/15', fundo: 'bg-white/[0.03]' },
  'Incomum': { texto: 'text-emerald-300', anel: 'border-emerald-400/40', fundo: 'bg-emerald-500/[0.07]' },
  'Raro': { texto: 'text-sky-300', anel: 'border-sky-400/40', fundo: 'bg-sky-500/[0.07]' },
  'Muito raro': { texto: 'text-violet-300', anel: 'border-violet-400/45', fundo: 'bg-violet-500/[0.08]' },
  'Lendário': { texto: 'text-amber-300', anel: 'border-amber-400/50', fundo: 'bg-amber-500/[0.09]' },
}

/**
 * Quanto vale um item, por raridade.
 *
 * O SRD não dá preço item a item — dá esta tabela, e é o bastante para uma
 * loja. Armadura e arma valem isto MAIS o preço do item base: uma Armadura de
 * Placas +1 Rara vale 4.000 + 1.500.
 */
export const PRECO_POR_RARIDADE: Record<RaridadeItem, number> = {
  'Comum': 100,
  'Incomum': 400,
  'Raro': 4000,
  'Muito raro': 40000,
  'Lendário': 200000,
}

/** As cores de um item. Sem raridade vale como comum. */
export function coresDe(raridade?: RaridadeItem) {
  return CORES_RARIDADE[raridade ?? 'Comum']
}

/** Quantos itens de sintonia uma pessoa suporta. Regra de 5.5e. */
export const LIMITE_SINTONIA = 3

/** Os lugares do corpo, na ordem em que a boneca os desenha. */
export const SLOTS: { slot: SlotEquipamento; nome: string; icone: string }[] = [
  { slot: 'cabeca', nome: 'Cabeça', icone: '🪖' },
  { slot: 'pescoco', nome: 'Pescoço', icone: '📿' },
  { slot: 'capa', nome: 'Capa', icone: '🧣' },
  { slot: 'corpo', nome: 'Corpo', icone: '🥋' },
  { slot: 'maos', nome: 'Mãos', icone: '🧤' },
  { slot: 'cinto', nome: 'Cinto', icone: '🎗️' },
  { slot: 'pernas', nome: 'Pernas', icone: '👖' },
  { slot: 'pes', nome: 'Pés', icone: '🥾' },
  { slot: 'anel1', nome: 'Anel I', icone: '💍' },
  { slot: 'anel2', nome: 'Anel II', icone: '💍' },
  { slot: 'maoPrincipal', nome: 'Mão principal', icone: '⚔️' },
  { slot: 'maoSecundaria', nome: 'Mão secundária', icone: '🛡️' },
]

/**
 * Onde cada slot fica na boneca: quatro linhas de três colunas.
 *
 * Mora aqui, e não na tela, para o teste conferir que todo slot do modelo tem
 * um lugar no corpo. Um slot criado e esquecido no desenho não dá erro nenhum —
 * ele simplesmente não aparece, e a peça vestida some da vista.
 */
export const BONECA: SlotEquipamento[][] = [
  ['capa', 'cabeca', 'pescoco'],
  ['maos', 'corpo', 'cinto'],
  ['maoPrincipal', 'pernas', 'maoSecundaria'],
  ['anel1', 'pes', 'anel2'],
]

export function nomeDoSlot(slot: SlotEquipamento): string {
  return SLOTS.find((s) => s.slot === slot)?.nome ?? slot
}

export function novoEquipamento(slot: SlotEquipamento = 'corpo'): Equipamento {
  return { id: uid(), nome: '', slot, efeitos: [], equipado: false }
}

/**
 * Um bônus que só vale contra certo tipo de criatura.
 *
 * Fica de fora do total porque somá-lo mentiria: a espada que dá +2 contra
 * goblinoides não dá +2 contra um dragão. A tela mostra na hora de rolar.
 */
export interface BonusCondicional {
  contra: string
  ataque: number
  dano: number
  danoExtra: string[]
  fontes: string[]
}

export interface BonusDeEquipamento {
  ca: number
  /** A base que a armadura vestida impõe, quando houver. */
  caBase: { valor: number; maxDes: number | null; fonte: string } | null
  ataque: number
  dano: number
  danoExtra: { dado: string; descricao: string }[]
  atributos: Partial<Record<AbilityKey, number>>
  atributosFixos: Partial<Record<AbilityKey, number>>
  salvaguardaGeral: number
  salvaguardas: Partial<Record<AbilityKey, number>>
  pericias: Partial<Record<SkillKey, number>>
  vantagens: string[]
  resistencias: string[]
  deslocamento: number
  sentidos: string[]
  acoes: { nome: string; descricao: string; usos?: string; fonte: string }[]
  condicionais: BonusCondicional[]
  /** Quantos itens sintonizados estão vestidos. */
  sintonizados: number
}

function vazio(): BonusDeEquipamento {
  return {
    ca: 0,
    caBase: null,
    ataque: 0,
    dano: 0,
    danoExtra: [],
    atributos: {},
    atributosFixos: {},
    salvaguardaGeral: 0,
    salvaguardas: {},
    pericias: {},
    vantagens: [],
    resistencias: [],
    deslocamento: 0,
    sentidos: [],
    acoes: [],
    condicionais: [],
    sintonizados: 0,
  }
}

// ---------------------------------------------------------------------------
// Uma só verdade
//
// Antes havia duas: `armaduraEquipada`/`escudoEquipado` (os campos antigos, de
// quando não existia slot) e os itens vestidos. Cada conta escolhia uma —
// `bonusDeCa` somava os +2 do campo antigo E os +2 do item de escudo, então
// marcar a caixa e vestir o escudo dava +4; e `defesaSemArmadura` olhava só o
// campo antigo, então um Monge de Cota de Malha no slot continuava ganhando
// Defesa sem Armadura.
//
// A conversão dos campos antigos acontece em `normalizeCharacter`, por onde
// passa toda ficha que entra — do armazenamento, do grupo salvo e da nuvem.
// Daqui para baixo só existem itens.
// ---------------------------------------------------------------------------

/** Os itens que estão de fato valendo: vestidos, e sintonizados se exigirem. */
export function itensAtivos(char: Character): Equipamento[] {
  return (char.equipamentos ?? []).filter((e) => e.equipado && (!e.sintonia || e.sintonizado))
}

/** Veste armadura? */
export function vesteArmadura(char: Character): boolean {
  return itensAtivos(char).some((e) => e.efeitos.some((f) => f.tipo === 'caBase'))
}

/**
 * Usa escudo?
 *
 * Pelo nome, porque escudo não tem efeito próprio que o distinga: um Escudo +1
 * é só "+3 de CA na mão secundária", igual a uma braçadeira seria.
 */
export function usaEscudo(char: Character): boolean {
  return itensAtivos(char).some((e) => e.slot === 'maoSecundaria' && /escudo/i.test(e.nome))
}

/** A arma do catálogo em que o item se baseia, se houver. */
export function armaBase(item: Equipamento): Arma | undefined {
  return item.arma ? acharArma(item.arma) : undefined
}

/** A armadura do catálogo em que o item se baseia, se houver. */
export function armaduraBase(item: Equipamento): Armadura | undefined {
  return item.armadura ? acharArmadura(item.armadura) : undefined
}

/** A armadura que a pessoa está vestindo, para os avisos de Furtividade e Força. */
export function armaduraVestida(char: Character): Armadura | undefined {
  for (const e of itensAtivos(char)) {
    const a = armaduraBase(e)
    if (a) return a
  }
  return undefined
}

/**
 * O item precisa das duas mãos?
 *
 * Sem isto dava para vestir arco longo E escudo, que é um personagem com três
 * mãos. A propriedade já estava no catálogo de armas e ninguém a lia.
 */
export function ocupaDuasMaos(item: Equipamento): boolean {
  return armaBase(item)?.propriedades.includes('Duas mãos') ?? false
}

function acharCondicional(acc: BonusDeEquipamento, contra: string): BonusCondicional {
  const chave = contra.trim().toLowerCase()
  let alvo = acc.condicionais.find((c) => c.contra.toLowerCase() === chave)
  if (!alvo) {
    alvo = { contra: contra.trim(), ataque: 0, dano: 0, danoExtra: [], fontes: [] }
    acc.condicionais.push(alvo)
  }
  return alvo
}

function aplicar(acc: BonusDeEquipamento, efeito: EfeitoDeItem, fonte: string): void {
  switch (efeito.tipo) {
    case 'ca':
      acc.ca += efeito.valor
      break

    case 'caBase':
      // Bases competem em vez de somar — vestir duas armaduras não é somar
      // duas. Vence a maior, que é como a regra resolve quando há escolha.
      if (!acc.caBase || efeito.valor > acc.caBase.valor) {
        acc.caBase = { valor: efeito.valor, maxDes: efeito.maxDes ?? null, fonte }
      }
      break

    case 'ataque':
      if (efeito.contra) {
        const c = acharCondicional(acc, efeito.contra)
        c.ataque += efeito.valor
        if (!c.fontes.includes(fonte)) c.fontes.push(fonte)
      } else acc.ataque += efeito.valor
      break

    case 'dano':
      if (efeito.contra) {
        const c = acharCondicional(acc, efeito.contra)
        c.dano += efeito.valor
        if (!c.fontes.includes(fonte)) c.fontes.push(fonte)
      } else acc.dano += efeito.valor
      break

    case 'danoExtra':
      if (efeito.contra) {
        const c = acharCondicional(acc, efeito.contra)
        c.danoExtra.push(efeito.dado)
        if (!c.fontes.includes(fonte)) c.fontes.push(fonte)
      } else acc.danoExtra.push({ dado: efeito.dado, descricao: efeito.descricao ?? fonte })
      break

    case 'atributo':
      acc.atributos[efeito.atributo] = (acc.atributos[efeito.atributo] ?? 0) + efeito.valor
      break

    case 'atributoFixo':
      // Dois itens que fixam o mesmo atributo não somam: vale o maior.
      acc.atributosFixos[efeito.atributo] = Math.max(
        acc.atributosFixos[efeito.atributo] ?? 0,
        efeito.valor,
      )
      break

    case 'salvaguarda':
      if (efeito.atributo) {
        acc.salvaguardas[efeito.atributo] = (acc.salvaguardas[efeito.atributo] ?? 0) + efeito.valor
      } else acc.salvaguardaGeral += efeito.valor
      break

    case 'pericia':
      acc.pericias[efeito.pericia] = (acc.pericias[efeito.pericia] ?? 0) + efeito.valor
      break

    case 'vantagem':
      if (!acc.vantagens.includes(efeito.em)) acc.vantagens.push(efeito.em)
      break

    case 'resistencia':
      if (!acc.resistencias.includes(efeito.a)) acc.resistencias.push(efeito.a)
      break

    case 'deslocamento':
      acc.deslocamento += efeito.metros
      break

    case 'sentido':
      if (!acc.sentidos.includes(efeito.texto)) acc.sentidos.push(efeito.texto)
      break

    case 'acao':
      acc.acoes.push({ ...efeito, fonte })
      break
  }
}

/** Soma um conjunto de itens. */
export function bonusDeItens(itens: Equipamento[]): BonusDeEquipamento {
  const acc = vazio()
  for (const item of itens) {
    if (item.sintonia) acc.sintonizados++
    for (const efeito of item.efeitos) aplicar(acc, efeito, item.nome || 'item')
  }
  return acc
}

/** Soma tudo o que a pessoa está vestindo. */
export function bonusDeEquipamento(char: Character): BonusDeEquipamento {
  return bonusDeItens(itensAtivos(char))
}

/**
 * O que soma NESTA arma.
 *
 * Não é o total do personagem: uma espada +1 na mão principal não pode
 * emprestar o +1 para o machado da outra mão. Vale o que a própria arma tem,
 * mais o que vem de itens que não são armas — um Anel de Proteção vale para as
 * duas, e "Arma +1" genérico existe justamente para ser o encantamento de
 * qualquer uma.
 */
export function bonusParaArma(char: Character, item: Equipamento): BonusDeEquipamento {
  return bonusDeItens([item, ...naoArmas(char, item.id)])
}

/**
 * O que vale para um ataque que NÃO vem de uma arma vestida.
 *
 * Golpe desarmado, ataque de magia, o que a pessoa digitou à mão: o Anel de
 * Proteção conta, a espada não. Dizer que o +1 da espada vale para o golpe
 * desarmado é a mesma mentira que o condicional somado ao total.
 */
export function bonusForaDasArmas(char: Character): BonusDeEquipamento {
  return bonusDeItens(naoArmas(char))
}

function naoArmas(char: Character, exceto?: string): Equipamento[] {
  return itensAtivos(char).filter((e) => !e.arma && e.id !== exceto)
}

/**
 * O valor do atributo já com o equipamento.
 *
 * Somar e fixar não se misturam: o Cinto de Força de Gigante DEFINE a Força, e
 * um item que soma +2 em cima disso não é como a regra funciona. Vence o maior
 * entre o fixado e o somado.
 */
export function atributoComEquipamento(char: Character, chave: AbilityKey): number {
  const bonus = bonusDeEquipamento(char)
  const somado = char.atributos[chave] + (bonus.atributos[chave] ?? 0)
  const fixo = bonus.atributosFixos[chave] ?? 0
  return Math.max(somado, fixo)
}

/** A ficha como se os atributos já viessem com o equipamento. */
export function comAtributosDoEquipamento(char: Character): Character {
  const bonus = bonusDeEquipamento(char)
  const temAlgo =
    Object.keys(bonus.atributos).length > 0 || Object.keys(bonus.atributosFixos).length > 0
  if (!temAlgo) return char

  const atributos = { ...char.atributos }
  for (const chave of Object.keys(atributos) as AbilityKey[]) {
    atributos[chave] = atributoComEquipamento(char, chave)
  }
  return { ...char, atributos }
}

/**
 * Quantos itens de sintonia passam do limite.
 *
 * A regra existe e a mesa esquece: três é o teto, e o quarto simplesmente não
 * funciona. Melhor a ficha avisar do que descobrir no meio da luta.
 */
export function excedeSintonia(char: Character): number {
  return Math.max(0, bonusDeEquipamento(char).sintonizados - LIMITE_SINTONIA)
}

/**
 * Equipa um item, tirando o que ocupava o mesmo lugar.
 *
 * É o que faz a troca ser um clique: vestir o elmo novo tira o velho sozinho,
 * em vez de deixar dois elmos somando CA.
 */
const MAOS: SlotEquipamento[] = ['maoPrincipal', 'maoSecundaria']

/**
 * É uma arma de uma mão?
 *
 * O que decide se a peça pode ir para qualquer das duas mãos. Uma adaga vai,
 * um arco longo não — e não é por falta de talento: as regras não exigem nada
 * para segurar uma arma na mão secundária. O que exige é o ataque EXTRA, que
 * pede a propriedade Leve nas duas armas.
 */
export function ehDeUmaMao(item: Equipamento): boolean {
  return !!armaBase(item) && !ocupaDuasMaos(item)
}

/** Os lugares em que esta peça pode ser equipada. */
export function slotsPossiveis(item: Equipamento): SlotEquipamento[] {
  return ehDeUmaMao(item) ? [...MAOS] : [item.slot]
}

/**
 * Equipa a peça no lugar pedido, tirando o que conflita.
 *
 * O lugar é um argumento, e não o `slot` do item, porque uma arma de uma mão
 * cabe nas duas — e o app antes escolhia por ela. Quem quisesse duas adagas
 * simplesmente não conseguia.
 */
export function equiparEm(
  lista: Equipamento[],
  id: string,
  slot: SlotEquipamento,
): Equipamento[] {
  const alvo = lista.find((e) => e.id === id)
  if (!alvo) return lista
  // Pedir um lugar que a peça não aceita não faz nada: melhor não mexer do que
  // pôr o elmo na mão.
  if (!slotsPossiveis(alvo).includes(slot)) return lista

  const duasMaos = ocupaDuasMaos(alvo)

  return lista.map((e) => {
    if (e.id === id) return { ...e, slot, equipado: true }
    if (!e.equipado) return e
    if (e.slot === slot) return { ...e, equipado: false }
    // Uma arma de duas mãos esvazia a outra mão; e ocupar uma das mãos guarda
    // a arma de duas mãos que estava lá.
    if (duasMaos && MAOS.includes(e.slot)) return { ...e, equipado: false }
    if (MAOS.includes(slot) && MAOS.includes(e.slot) && ocupaDuasMaos(e)) {
      return { ...e, equipado: false }
    }
    return e
  })
}

/** Equipa no lugar natural da peça. */
export function equipar(lista: Equipamento[], id: string): Equipamento[] {
  const alvo = lista.find((e) => e.id === id)
  return alvo ? equiparEm(lista, id, alvo.slot) : lista
}

/**
 * As duas mãos com arma Leve?
 *
 * É a condição do ataque extra do 2024: ao usar a ação Atacar com uma arma
 * Leve, você faz um ataque a mais com OUTRA arma Leve. Não precisa de talento
 * nem de estilo — o estilo Combate com Duas Armas só acrescenta o modificador
 * de atributo ao dano desse ataque extra.
 */
export function duasArmasLeves(char: Character): boolean {
  const mapa = porSlot(char)
  const principal = mapa.maoPrincipal
  const secundaria = mapa.maoSecundaria
  if (!principal || !secundaria) return false
  return ehLeve(principal) && ehLeve(secundaria)
}

export function ehLeve(item: Equipamento): boolean {
  return armaBase(item)?.propriedades.includes('Leve') ?? false
}

/** O estilo que acrescenta o modificador ao dano do ataque extra. */
export const ESTILO_DUAS_ARMAS = 'Combate com Duas Armas'

export function desequipar(lista: Equipamento[], id: string): Equipamento[] {
  return lista.map((e) => (e.id === id ? { ...e, equipado: false } : e))
}

/** O que está vestido em cada lugar do corpo. */
export function porSlot(char: Character): Partial<Record<SlotEquipamento, Equipamento>> {
  const mapa: Partial<Record<SlotEquipamento, Equipamento>> = {}
  for (const e of char.equipamentos ?? []) if (e.equipado) mapa[e.slot] = e
  return mapa
}

/** Uma linha curta descrevendo o efeito, para a tela não precisar saber a forma. */
export function descreveEfeito(e: EfeitoDeItem): string {
  const sinal = (n: number) => (n >= 0 ? `+${n}` : `${n}`)
  const contra = (c?: string) => (c ? ` contra ${c}` : '')
  switch (e.tipo) {
    case 'ca':
      return `${sinal(e.valor)} de CA`
    case 'caBase':
      return `CA base ${e.valor}${e.maxDes != null ? ` (DES até ${e.maxDes})` : ''}`
    case 'ataque':
      return `${sinal(e.valor)} no ataque${contra(e.contra)}`
    case 'dano':
      return `${sinal(e.valor)} no dano${contra(e.contra)}`
    case 'danoExtra':
      return `+${e.dado} de dano${e.descricao ? ` ${e.descricao}` : ''}${contra(e.contra)}`
    case 'atributo':
      return `${sinal(e.valor)} de ${e.atributo.toUpperCase()}`
    case 'atributoFixo':
      return `${e.atributo.toUpperCase()} passa a ${e.valor}`
    case 'salvaguarda':
      return `${sinal(e.valor)} nas salvaguardas${e.atributo ? ` de ${e.atributo.toUpperCase()}` : ''}`
    case 'pericia':
      return `${sinal(e.valor)} em ${e.pericia}`
    case 'vantagem':
      return `Vantagem em ${e.em}`
    case 'resistencia':
      return `Resistência a ${e.a}`
    case 'deslocamento':
      return `${sinal(e.metros)} m de deslocamento`
    case 'sentido':
      return e.texto
    case 'acao':
      return `Ação: ${e.nome}`
  }
}

// ---------------------------------------------------------------------------
// O bônus que só vale contra alguém
//
// A espada dá "+2 contra goblinoides". Na ficha isso fica separado do total,
// porque somar mentiria. Mas na hora de bater num goblin de verdade o app tem
// a informação dos dois lados — o item diz "goblinoide", o bestiário diz
// "Humanoide (goblinoide)" — e pode juntar sozinho.
// ---------------------------------------------------------------------------

/** Minúsculas e sem acento, para "Dragão" casar com "dragao". */
function normalizar(texto: string): string {
  return texto.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

/**
 * O tipo do alvo casa com o alvo do item?
 *
 * A comparação é frouxa nos dois sentidos de propósito. O item costuma dizer
 * uma palavra ("goblinoide") e a criatura vem com a linha inteira do bloco
 * ("Humanoide Pequeno (goblinoide), neutro e mau") — exigir igualdade faria o
 * bônus nunca disparar, que é o mesmo que não existir.
 */
export function alvoCasa(alvoDoItem: string, tipoDaCriatura: string): boolean {
  const item = normalizar(alvoDoItem)
  const alvo = normalizar(tipoDaCriatura)
  if (!item || !alvo) return false
  if (alvo.includes(item) || item.includes(alvo)) return true

  // Plural simples: o item escrito "goblinoides" tem de achar "goblinoide".
  const semPlural = item.replace(/e?s$/, '')
  return semPlural.length > 2 && alvo.includes(semPlural)
}

/** O que soma ao bater NESTA criatura. */
export interface BonusContraAlvo {
  ataque: number
  dano: number
  danoExtra: string[]
  fontes: string[]
}

/**
 * Junta os condicionais que valem contra um alvo.
 *
 * Devolve zeros quando nada casa — quem chama não precisa saber se havia
 * condicional nenhum ou se nenhum se aplicava.
 */
export function bonusContra(char: Character, tipoDaCriatura: string): BonusContraAlvo {
  const fora: BonusContraAlvo = { ataque: 0, dano: 0, danoExtra: [], fontes: [] }
  for (const c of bonusDeEquipamento(char).condicionais) {
    if (!alvoCasa(c.contra, tipoDaCriatura)) continue
    fora.ataque += c.ataque
    fora.dano += c.dano
    fora.danoExtra.push(...c.danoExtra)
    for (const f of c.fontes) if (!fora.fontes.includes(f)) fora.fontes.push(f)
  }
  return fora
}

/** Tem alguma coisa para somar? */
export function temBonusContra(b: BonusContraAlvo): boolean {
  return b.ataque !== 0 || b.dano !== 0 || b.danoExtra.length > 0
}
