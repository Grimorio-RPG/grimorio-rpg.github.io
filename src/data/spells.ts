// Catálogo de feitiços icônicos com explicações amigáveis a iniciantes.
// Não é a lista completa do jogo — é um ponto de partida curado.

export interface Spell {
  id: string
  nome: string
  nivel: number // 0 = truque
  escola: string
  tempo: string
  alcance: string
  duracao: string
  concentracao: boolean
  ritual: boolean
  classes: string[]
  descricao: string // explicação simples, em português
  emMiudos: string // "o que isso faz na prática", bem direto
}

export const SPELLS: Spell[] = [
  {
    id: 'luz',
    nome: 'Luz',
    nivel: 0,
    escola: 'Evocação',
    tempo: '1 ação',
    alcance: 'Toque',
    duracao: '1 hora',
    concentracao: false,
    ritual: false,
    classes: ['Bardo', 'Clérigo', 'Feiticeiro', 'Mago'],
    descricao: 'Um objeto que você tocar passa a emitir luz brilhante num raio de 6 metros, e penumbra por mais 6 metros.',
    emMiudos: 'Uma lanterna mágica de graça. Ótimo para explorar masmorras escuras.',
  },
  {
    id: 'raio-de-fogo',
    nome: 'Raio de Fogo',
    nivel: 0,
    escola: 'Evocação',
    tempo: '1 ação',
    alcance: '36 metros',
    duracao: 'Instantânea',
    concentracao: false,
    ritual: false,
    classes: ['Feiticeiro', 'Mago', 'Bruxo'],
    descricao: 'Você lança um jato de chamas em uma criatura ou objeto. Faça um ataque de magia à distância; se acertar, causa 1d10 de dano de fogo.',
    emMiudos: 'Seu ataque básico de conjurador. O dano aumenta conforme você sobe de nível.',
  },
  {
    id: 'misseis-magicos',
    nome: 'Mísseis Mágicos',
    nivel: 1,
    escola: 'Evocação',
    tempo: '1 ação',
    alcance: '36 metros',
    duracao: 'Instantânea',
    concentracao: false,
    ritual: false,
    classes: ['Feiticeiro', 'Mago'],
    descricao: 'Você cria três dardos de energia mágica. Cada um atinge um alvo à sua escolha e causa 1d4+1 de dano de força automaticamente — sem rolar ataque.',
    emMiudos: 'Nunca erra. Dano garantido, ótimo para finalizar inimigos com pouca vida.',
  },
  {
    id: 'curar-ferimentos',
    nome: 'Curar Ferimentos',
    nivel: 1,
    escola: 'Abjuração',
    tempo: '1 ação',
    alcance: 'Toque',
    duracao: 'Instantânea',
    concentracao: false,
    ritual: false,
    classes: ['Bardo', 'Clérigo', 'Druida', 'Paladino', 'Patrulheiro'],
    descricao: 'Uma criatura que você tocar recupera pontos de vida iguais a 2d8 + seu modificador de conjuração.',
    emMiudos: 'A cura clássica. Levante aliados feridos no meio da batalha.',
  },
  {
    id: 'escudo',
    nome: 'Escudo',
    nivel: 1,
    escola: 'Abjuração',
    tempo: '1 reação',
    alcance: 'Pessoal',
    duracao: '1 rodada',
    concentracao: false,
    ritual: false,
    classes: ['Feiticeiro', 'Mago', 'Bruxo'],
    descricao: 'Uma barreira invisível surge e protege você. Até o começo do seu próximo turno, você ganha +5 de CA, inclusive contra o ataque que disparou a magia.',
    emMiudos: 'Reação defensiva. Pode transformar um acerto inimigo em erro na hora.',
  },
  {
    id: 'enfeiticar-pessoa',
    nome: 'Enfeitiçar Pessoa',
    nivel: 1,
    escola: 'Encantamento',
    tempo: '1 ação',
    alcance: '9 metros',
    duracao: '1 hora',
    concentracao: false,
    ritual: false,
    classes: ['Bardo', 'Bruxo', 'Druida', 'Feiticeiro', 'Mago'],
    descricao: 'Uma criatura humanoide deve passar em uma salvaguarda de Sabedoria ou ficará enfeitiçada por você, tratando-o como um amigo.',
    emMiudos: 'Faz um inimigo (ou guarda) ficar do seu lado por um tempo. Ótimo fora de combate.',
  },
  {
    id: 'bola-de-fogo',
    nome: 'Bola de Fogo',
    nivel: 3,
    escola: 'Evocação',
    tempo: '1 ação',
    alcance: '45 metros',
    duracao: 'Instantânea',
    concentracao: false,
    ritual: false,
    classes: ['Feiticeiro', 'Mago'],
    descricao: 'Uma explosão de fogo surge num ponto à sua escolha. Cada criatura numa esfera de 6 metros de raio faz uma salvaguarda de Destreza, sofrendo 8d6 de dano de fogo (metade se passar).',
    emMiudos: 'A magia de área mais famosa do jogo. Devasta grupos de inimigos — cuidado com aliados por perto!',
  },
  {
    id: 'contramagia',
    nome: 'Contramágica',
    nivel: 3,
    escola: 'Abjuração',
    tempo: '1 reação',
    alcance: '18 metros',
    duracao: 'Instantânea',
    concentracao: false,
    ritual: false,
    classes: ['Feiticeiro', 'Mago', 'Bruxo'],
    descricao: 'Você interrompe uma criatura no processo de conjurar uma magia, cancelando-a (automaticamente até 3º nível; com teste para magias mais fortes).',
    emMiudos: '"Não hoje." Cancela a magia de um inimigo antes que ela aconteça.',
  },
  {
    id: 'voo',
    nome: 'Voo',
    nivel: 3,
    escola: 'Transmutação',
    tempo: '1 ação',
    alcance: 'Toque',
    duracao: '10 minutos',
    concentracao: true,
    ritual: false,
    classes: ['Bruxo', 'Feiticeiro', 'Mago'],
    descricao: 'Você toca uma criatura, que ganha deslocamento de voo de 18 metros pela duração.',
    emMiudos: 'Voar resolve muitos problemas: fugir, alcançar lugares altos, escapar de inimigos terrestres.',
  },
  {
    id: 'reviver-mortos',
    nome: 'Reviver os Mortos',
    nivel: 5,
    escola: 'Necromancia',
    tempo: '1 hora',
    alcance: 'Toque',
    duracao: 'Instantânea',
    concentracao: false,
    ritual: false,
    classes: ['Clérigo', 'Paladino'],
    descricao: 'Você traz de volta à vida uma criatura que morreu há no máximo 10 dias, desde que a alma esteja disposta e livre.',
    emMiudos: 'A segunda chance. Devolve um personagem morto ao grupo (com um custo de material caro).',
  },
]

export const ESCOLAS = ['Abjuração', 'Adivinhação', 'Conjuração', 'Encantamento', 'Evocação', 'Ilusão', 'Necromancia', 'Transmutação']
