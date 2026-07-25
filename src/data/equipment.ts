// Catálogo de equipamento: armas, armaduras e itens mágicos.
// Pesos em kg (aprox.), distâncias em metros — coerente com o resto do app.

export interface Arma {
  nome: string
  categoria: 'Simples' | 'Marcial'
  alcanceTipo: 'Corpo a corpo' | 'À distância'
  dano: string // ex: "1d8"
  tipoDano: string // cortante / perfurante / contundente
  propriedades: string[]
  peso: number
  alcance?: string
  versatil?: string // dano usando as duas mãos
}

const A = (
  nome: string,
  categoria: Arma['categoria'],
  alcanceTipo: Arma['alcanceTipo'],
  dano: string,
  tipoDano: string,
  propriedades: string[],
  peso: number,
  alcance?: string,
  versatil?: string,
): Arma => ({ nome, categoria, alcanceTipo, dano, tipoDano, propriedades, peso, alcance, versatil })

export const ARMAS: Arma[] = [
  // Simples — corpo a corpo
  A('Adaga', 'Simples', 'Corpo a corpo', '1d4', 'perfurante', ['Acuidade', 'Leve', 'Arremesso'], 0.5, '6/18 m'),
  A('Bordão', 'Simples', 'Corpo a corpo', '1d6', 'contundente', ['Versátil'], 2, undefined, '1d8'),
  A('Clava', 'Simples', 'Corpo a corpo', '1d4', 'contundente', ['Leve'], 1),
  A('Clava Grande', 'Simples', 'Corpo a corpo', '1d8', 'contundente', ['Duas mãos'], 5),
  A('Foice Curta', 'Simples', 'Corpo a corpo', '1d4', 'cortante', ['Leve'], 1),
  A('Lança', 'Simples', 'Corpo a corpo', '1d6', 'perfurante', ['Arremesso', 'Versátil'], 1.5, '6/18 m', '1d8'),
  A('Machadinha', 'Simples', 'Corpo a corpo', '1d6', 'cortante', ['Leve', 'Arremesso'], 1, '6/18 m'),
  A('Martelo Leve', 'Simples', 'Corpo a corpo', '1d4', 'contundente', ['Leve', 'Arremesso'], 1, '6/18 m'),
  // Simples — à distância
  A('Arco Curto', 'Simples', 'À distância', '1d6', 'perfurante', ['Munição', 'Duas mãos'], 1, '24/96 m'),
  A('Besta Leve', 'Simples', 'À distância', '1d8', 'perfurante', ['Munição', 'Recarga', 'Duas mãos'], 2.5, '24/96 m'),
  A('Dardo', 'Simples', 'À distância', '1d4', 'perfurante', ['Acuidade', 'Arremesso'], 0.1, '6/18 m'),
  A('Funda', 'Simples', 'À distância', '1d4', 'contundente', ['Munição'], 0, '9/36 m'),
  // Marciais — corpo a corpo
  A('Cimitarra', 'Marcial', 'Corpo a corpo', '1d6', 'cortante', ['Acuidade', 'Leve'], 1.5),
  A('Espada Curta', 'Marcial', 'Corpo a corpo', '1d6', 'perfurante', ['Acuidade', 'Leve'], 1),
  A('Espada Longa', 'Marcial', 'Corpo a corpo', '1d8', 'cortante', ['Versátil'], 1.5, undefined, '1d10'),
  A('Espada Grande', 'Marcial', 'Corpo a corpo', '2d6', 'cortante', ['Pesada', 'Duas mãos'], 3),
  A('Rapieira', 'Marcial', 'Corpo a corpo', '1d8', 'perfurante', ['Acuidade'], 1),
  A('Machado de Batalha', 'Marcial', 'Corpo a corpo', '1d8', 'cortante', ['Versátil'], 2, undefined, '1d10'),
  A('Machado Grande', 'Marcial', 'Corpo a corpo', '1d12', 'cortante', ['Pesada', 'Duas mãos'], 3.5),
  A('Martelo de Guerra', 'Marcial', 'Corpo a corpo', '1d8', 'contundente', ['Versátil'], 1, undefined, '1d10'),
  A('Maça Estrela', 'Marcial', 'Corpo a corpo', '1d8', 'perfurante', [], 2),
  A('Alabarda', 'Marcial', 'Corpo a corpo', '1d10', 'cortante', ['Pesada', 'Alcance', 'Duas mãos'], 3),
  A('Lança Longa', 'Marcial', 'Corpo a corpo', '1d10', 'perfurante', ['Pesada', 'Alcance', 'Duas mãos'], 3),
  A('Tridente', 'Marcial', 'Corpo a corpo', '1d8', 'perfurante', ['Arremesso', 'Versátil'], 2, '6/18 m', '1d10'),
  // Marciais — à distância
  A('Arco Longo', 'Marcial', 'À distância', '1d8', 'perfurante', ['Munição', 'Pesada', 'Duas mãos'], 1, '45/180 m'),
  A('Besta Pesada', 'Marcial', 'À distância', '1d10', 'perfurante', ['Munição', 'Pesada', 'Recarga', 'Duas mãos'], 9, '30/120 m'),
  A('Besta de Mão', 'Marcial', 'À distância', '1d6', 'perfurante', ['Munição', 'Leve', 'Recarga'], 1.5, '9/36 m'),
  // Desarmado
  A('Ataque Desarmado', 'Simples', 'Corpo a corpo', '1', 'contundente', [], 0),
]

export interface Armadura {
  nome: string
  categoria: 'Leve' | 'Média' | 'Pesada' | 'Escudo'
  ca: number
  /** Limite do bônus de Destreza: null = sem limite, 0 = não soma. */
  maxDes: number | null
  forcaMinima?: number
  furtividadeRuim?: boolean
  peso: number
}

const Ar = (
  nome: string,
  categoria: Armadura['categoria'],
  ca: number,
  maxDes: number | null,
  peso: number,
  forcaMinima?: number,
  furtividadeRuim?: boolean,
): Armadura => ({ nome, categoria, ca, maxDes, peso, forcaMinima, furtividadeRuim })

export const ARMADURAS: Armadura[] = [
  Ar('Acolchoada', 'Leve', 11, null, 4, undefined, true),
  Ar('Couro', 'Leve', 11, null, 5),
  Ar('Couro Batido', 'Leve', 12, null, 6),
  Ar('Peles', 'Média', 12, 2, 6),
  Ar('Camisão de Malha', 'Média', 13, 2, 10),
  Ar('Gibão de Peles', 'Média', 14, 2, 20, undefined, true),
  Ar('Peitoral', 'Média', 14, 2, 10),
  Ar('Meia Armadura', 'Média', 15, 2, 20, undefined, true),
  Ar('Cota de Anéis', 'Pesada', 14, 0, 20, undefined, true),
  Ar('Cota de Malha', 'Pesada', 16, 0, 27, 13, true),
  Ar('Fragmentada', 'Pesada', 17, 0, 30, 15, true),
  Ar('Placas', 'Pesada', 18, 0, 32, 15, true),
]

export const ESCUDO_CA = 2

export interface ItemMagico {
  nome: string
  raridade: 'Comum' | 'Incomum' | 'Raro' | 'Muito raro' | 'Lendário'
  sintonia: boolean
  resumo: string
}

const I = (nome: string, raridade: ItemMagico['raridade'], sintonia: boolean, resumo: string): ItemMagico =>
  ({ nome, raridade, sintonia, resumo })

export const ITENS_MAGICOS: ItemMagico[] = [
  I('Poção de Cura', 'Comum', false, 'Recupera 2d4+2 pontos de vida ao beber (ação bônus).'),
  I('Poção de Cura Maior', 'Incomum', false, 'Recupera 4d4+4 pontos de vida.'),
  I('Arma +1', 'Incomum', false, '+1 nos ataques e no dano com esta arma.'),
  I('Armadura +1', 'Raro', false, '+1 na sua Classe de Armadura.'),
  I('Escudo +1', 'Incomum', false, '+1 de CA além do bônus normal do escudo.'),
  I('Manto Élfico', 'Incomum', true, 'Vantagem em Furtividade; outros têm desvantagem para te perceber.'),
  I('Botas Élficas', 'Incomum', true, 'Seu movimento é silencioso: vantagem para se mover sem ser ouvido.'),
  I('Bolsa de Contenção', 'Incomum', false, 'Guarda até 250 kg num espaço extradimensional; pesa sempre 7 kg.'),
  I('Anel de Proteção', 'Raro', true, '+1 na CA e em todas as salvaguardas.'),
  I('Cinto de Força de Gigante', 'Raro', true, 'Sua Força passa a um valor fixo alto (varia com o tipo de gigante).'),
  I('Amuleto de Saúde', 'Raro', true, 'Sua Constituição passa a 19.'),
  I('Varinha de Mísseis Mágicos', 'Incomum', false, '7 cargas: gaste 1 ou mais para lançar Mísseis Mágicos.'),
  I('Cajado de Chamas', 'Raro', true, 'Resistência a fogo e cargas para conjurar magias de fogo.'),
  I('Espada Flamejante', 'Raro', true, 'Acende em chamas: +2d6 de dano de fogo nos acertos.'),
  I('Pedra Ioun', 'Muito raro', true, 'Orbita sua cabeça e concede um benefício conforme o tipo.'),
  I('Capa de Deslocamento', 'Raro', true, 'Cria uma ilusão de posição: ataques contra você têm desvantagem.'),
  I('Corda de Escalada', 'Incomum', false, '18 m de corda que obedece comandos: amarra, solta e se move sozinha.'),
  I('Lanterna de Revelação', 'Incomum', false, 'Revela criaturas e objetos invisíveis dentro da luz.'),
  I('Pergaminho de Magia', 'Comum', false, 'Conjura a magia escrita uma vez; depois o pergaminho vira pó.'),
  I('Tomo de Entendimento', 'Muito raro', false, 'Ler por 48 h aumenta sua Sabedoria em 2 (e o máximo dela).'),
]

/** Busca rápida por nome. */
export function acharArma(nome: string): Arma | undefined {
  return ARMAS.find((a) => a.nome === nome)
}

export function acharArmadura(nome: string): Armadura | undefined {
  return ARMADURAS.find((a) => a.nome === nome)
}
