import type { Character } from '../types'

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
 * Garante que uma ficha carregada (possivelmente de versão antiga)
 * tenha todos os campos atuais, sem sobrescrever o que já existe.
 */
export function normalizeCharacter(raw: Partial<Character>): Character {
  return { ...novaFicha(), ...raw, id: raw.id ?? uid() } as Character
}
