import type { Character, Equipamento, SlotEquipamento } from '../types'
import { doCatalogo } from '../data/itens-equipaveis'

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/** Cria uma ficha em branco com valores padrão sensatos para iniciantes. */
export function novaFicha(): Character {
  return {
    id: uid(),
    updatedAt: Date.now(),
    nome: '',
    jogador: '',
    classe: '',
    subclasse: '',
    nivel: 1,
    especie: '',
    antecedente: '',
    alinhamento: '',
    avatarUrl: '',
    atributos: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
    salvaguardasProficientes: [],
    periciasProficientes: [],
    periciasExpertise: [],
    classeArmaduraManual: null,
    armaduraEquipada: '',
    escudoEquipado: false,
    talentos: [],
    iniciativaBonus: 0,
    deslocamento: 9,
    pvMax: 8,
    pvAtual: 8,
    pvTemporario: 0,
    dadosDeVida: '1d8',
    dadosDeVidaUsados: 0,
    ataques: [],
    atributoConjuracao: null,
    magias: [],
    espacosMagia: Array.from({ length: 9 }, () => ({ total: 0, usados: 0 })),
    testesMorte: { sucessos: 0, falhas: 0 },
    exaustao: 0,
    condicoes: [],
    moedas: { pc: 0, pp: 0, pe: 0, po: 0, pl: 0 },
    inventario: [],
    inspiracaoHeroica: false,
    idiomas: 'Comum',
    proficienciasEquipamentos: '',
    equipamento: '',
    caracteristicas: '',
    anotacoes: '',
  }
}

/**
 * Converte a armadura e o escudo antigos em equipamento de verdade.
 *
 * `armaduraEquipada` e `escudoEquipado` são de quando não existiam slots. Com o
 * painel de equipamento eles passaram a ser uma SEGUNDA verdade sobre a mesma
 * CA, e as duas se contradiziam: `bonusDeCa` somava os +2 da caixa de escudo E
 * os +2 do item de escudo vestido, dando +4; e `defesaSemArmadura` olhava só o
 * campo antigo, então um Monge de Cota de Malha no slot continuava ganhando
 * Defesa sem Armadura.
 *
 * A conversão acontece aqui porque aqui passa toda ficha que entra — do
 * armazenamento, do grupo salvo e da nuvem. O slot vence: quem preencheu os
 * dois está vestindo o item, e é ele que vale.
 */
function converterArmaduraAntiga(char: Character): Character {
  if (!char.armaduraEquipada && !char.escudoEquipado) return char

  const lista = char.equipamentos ?? []
  const ocupado = (slot: SlotEquipamento) => lista.some((e) => e.equipado && e.slot === slot)
  const novos: Equipamento[] = []

  if (char.armaduraEquipada && !ocupado('corpo')) {
    const item = doCatalogo(char.armaduraEquipada, uid())
    if (item) novos.push({ ...item, equipado: true })
  }
  if (char.escudoEquipado && !ocupado('maoSecundaria')) {
    const item = doCatalogo('Escudo', uid())
    if (item) novos.push({ ...item, equipado: true })
  }

  return {
    ...char,
    equipamentos: novos.length > 0 ? [...lista, ...novos] : lista,
    armaduraEquipada: '',
    escudoEquipado: false,
  }
}

/**
 * Garante que uma ficha carregada (possivelmente de versão antiga)
 * tenha todos os campos atuais, sem sobrescrever o que já existe.
 */
export function normalizeCharacter(raw: Partial<Character>): Character {
  const char = { ...novaFicha(), ...raw, id: raw.id ?? uid() } as Character
  return converterArmaduraAntiga(char)
}
