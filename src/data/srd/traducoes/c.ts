// Itens do SRD que começam com C.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const C: Record<string, TraducaoDeItem> = {
  'Candle of Invocation': {
    nome: 'Vela da Invocação',
    texto:
      'A magia desta vela desperta quando ela é acesa, o que exige a ação Magia. Depois de queimar ' +
      'por 4 horas, ela se acaba. Você pode apagá-la antes para usar depois: desconte o tempo ' +
      'queimado em blocos de 1 minuto.\n\n' +
      'Acesa, a vela lança luz fraca num raio de 9 m. Dentro dessa luz, você tem vantagem em testes ' +
      'de d20. Além disso, um clérigo ou druida dentro da luz pode conjurar magias de 1º círculo ' +
      'que tenha preparadas sem gastar espaço de magia.\n\n' +
      'Ou então, ao acender a vela pela primeira vez, você pode conjurar Portal com ela — o que ' +
      'destrói a vela. O portal criado leva a um Plano Exterior escolhido pelo Mestre ou sorteado ' +
      'na tabela do SRD.',
  },

  'Cape of the Mountebank': {
    nome: 'Capa do Charlatão',
    texto:
      'Esta capa cheira levemente a enxofre. Vestindo-a, você pode usar a ação Magia para conjurar ' +
      'Porta Dimensional. Esta propriedade só volta a funcionar no amanhecer seguinte. Ao se ' +
      'teleportar com a magia, você deixa para trás uma nuvem de fumaça: o espaço de onde você saiu ' +
      'fica levemente obscurecido até o fim do seu próximo turno.',
  },

  'Carpet of Flying': {
    nome: 'Tapete Voador',
    texto:
      'Você pode fazer este tapete pairar e voar usando a ação Magia e dizendo a palavra de ' +
      'comando. Ele obedece às suas indicações se você estiver a até 9 m dele.\n\n' +
      'Existem quatro tamanhos de tapete; o Mestre escolhe ou sorteia na tabela do SRD. Um tapete ' +
      'carrega até o dobro do peso indicado, mas o voo cai pela metade acima da capacidade normal.',
  },

  'Censer of Controlling Air Elementals': {
    nome: 'Turíbulo de Controlar Elementais do Ar',
    texto:
      'Balançando este turíbulo devagar, você pode usar a ação Magia para invocar um Elemental do ' +
      'Ar. Ele aparece num espaço desocupado o mais perto possível do turíbulo, entende seus ' +
      'idiomas, obedece às suas ordens e age logo depois de você na iniciativa. Some depois de 1 ' +
      'hora, quando morre, ou quando você o dispensa com uma ação bônus. O turíbulo só volta a ' +
      'funcionar assim no amanhecer seguinte.',
  },

  'Chime of Opening': {
    nome: 'Sino da Abertura',
    texto:
      'Este tubo de metal oco tem uns 30 cm e pesa 500 g. Com a ação Magia, você pode tocá-lo para ' +
      'conjurar Destrancar. O som de batida costumeiro da magia é substituído pelo toque claro do ' +
      'sino, ouvido a até 90 m. O sino serve para 10 usos; na décima vez ele racha e não vale mais ' +
      'nada.',
  },

  'Circlet of Blasting': {
    nome: 'Tiara Fulminante',
    texto:
      'Vestindo esta tiara, você pode conjurar Raio Ardente com ela (+5 para acertar). A tiara só ' +
      'volta a conjurar essa magia no amanhecer seguinte.',
  },

  'Cloak of Arachnida': {
    nome: 'Manto Aracnídeo',
    texto:
      'Esta peça fina é de seda preta entretecida com fios prateados discretos. Vestindo-a, você ' +
      'ganha:\n\n' +
      'Resistência a Veneno. Você tem Resistência a dano de veneno.\n' +
      'Escalar Paredes. Você tem deslocamento de escalada igual ao seu deslocamento e pode subir, ' +
      'descer e andar por superfícies verticais e tetos com as mãos livres.\n' +
      'Passo de Teia. Você não fica preso em teia nenhuma e atravessa teias como se fossem terreno ' +
      'difícil.\n' +
      'Teia. Você pode conjurar Teia (CD 13). A teia criada cobre o dobro da área normal. Depois de ' +
      'usada, esta propriedade só volta no amanhecer seguinte.',
  },

  'Cloak of Displacement': {
    nome: 'Manto do Deslocamento',
    texto:
      'Enquanto você veste este manto, ele projeta uma ilusão que faz você parecer estar num ponto ' +
      'perto de onde realmente está, dando desvantagem a quem ataca você. Se você sofrer dano, a ' +
      'propriedade para de funcionar até o começo do seu próximo turno. Ela também fica suspensa ' +
      'enquanto seu deslocamento for 0.',
  },

  'Cloak of Elvenkind': {
    nome: 'Manto Élfico',
    texto:
      'Enquanto você veste este manto, os testes de Sabedoria (Percepção) para perceber você têm ' +
      'desvantagem, e você tem vantagem em testes de Destreza (Furtividade).',
  },

  'Cloak of Invisibility': {
    nome: 'Manto da Invisibilidade',
    texto:
      'Este manto tem 3 cargas e recupera 1d3 gastas todo amanhecer. Vestindo-o, você pode usar a ' +
      'ação Magia para puxar o capuz sobre a cabeça e gastar 1 carga, ganhando a condição Invisível ' +
      'por 1 hora. O efeito acaba antes se você baixar o capuz (sem gastar ação) ou tirar o manto.',
  },

  'Cloak of Protection': {
    nome: 'Manto de Proteção',
    texto:
      'Você recebe +1 na Classe de Armadura e nas salvaguardas enquanto veste este manto.',
  },

  'Cloak of the Bat': {
    nome: 'Manto do Morcego',
    texto:
      'Vestindo este manto, você tem vantagem em testes de Destreza (Furtividade). Em área de luz ' +
      'fraca ou escuridão, você pode segurar as pontas do manto e ganhar deslocamento de voo de 12 ' +
      'm. Se soltar as pontas enquanto voa assim, ou se deixar a luz fraca ou a escuridão, você ' +
      'perde o voo.\n\n' +
      'Vestindo o manto em luz fraca ou escuridão, você também pode conjurar Metamorfose em si ' +
      'mesmo para virar um morcego. Nessa forma você mantém sua Inteligência, Sabedoria e Carisma. ' +
      'O manto só volta a fazer isso no amanhecer seguinte.',
  },

  'Cloak of the Manta Ray': {
    nome: 'Manto da Arraia',
    texto:
      'Vestindo este manto, você respira debaixo d’água e tem deslocamento de natação de 18 m.',
  },

  'Crystal Ball': {
    nome: 'Bola de Cristal',
    texto: 'Tocando este orbe de cristal, você pode conjurar Vidência com ele (CD 17).',
  },

  'Crystal Ball of Mind Reading': {
    nome: 'Bola de Cristal da Leitura Mental',
    texto:
      'Tocando este orbe de cristal, você pode conjurar Vidência com ele (CD 17). Além disso, pode ' +
      'conjurar Detectar Pensamentos (CD 17) mirando criaturas que você veja a até 9 m do sensor da ' +
      'magia. Você não precisa se concentrar nesse Detectar Pensamentos para mantê-lo, mas ele ' +
      'acaba quando a Vidência acabar.',
  },

  'Crystal Ball of Telepathy': {
    nome: 'Bola de Cristal da Telepatia',
    texto:
      'Tocando este orbe de cristal, você pode conjurar Vidência com ele (CD 17). Além disso, pode ' +
      'se comunicar por telepatia com criaturas que você veja a até 9 m do sensor da magia, e ' +
      'conjurar Sugestão (CD 17) através do sensor em uma delas. Você não precisa se concentrar ' +
      'nessa Sugestão para mantê-la, mas ela acaba quando a Vidência acabar. Você só pode conjurar ' +
      'Sugestão assim de novo no amanhecer seguinte.',
  },

  'Crystal Ball of True Seeing': {
    nome: 'Bola de Cristal da Visão Verdadeira',
    texto:
      'Tocando este orbe de cristal, você pode conjurar Vidência com ele (CD 17). Além disso, você ' +
      'tem Visão Verdadeira a 36 m a partir do sensor da magia.',
  },

  'Cube of Force': {
    nome: 'Cubo de Força',
    texto:
      'Este cubo tem uns 2,5 cm de lado e uma marca diferente em cada face. Você pode apertar uma ' +
      'face, gastar as cargas que ela pede e conjurar a magia associada (CD 17): Armadura Arcana e ' +
      'Escudo custam 1 carga; Cabana Minúscula, 3; Santuário Privado e Esfera Resiliente, 4; Muralha ' +
      'de Força, 5.\n\n' +
      'O cubo começa com 10 cargas e recupera 1d6 gastas todo amanhecer.',
  },

  'Cubic Gate': {
    nome: 'Cubo Portal',
    texto:
      'Este cubo tem uns 7,5 cm de lado e emana energia mágica palpável. Cada uma das seis faces é ' +
      'ligada a um plano de existência diferente, sendo um deles o Plano Material; os outros o ' +
      'Mestre decide. O cubo tem 3 cargas e recupera 1d3 gastas todo amanhecer.\n\n' +
      'Com a ação Magia, você pode gastar 1 carga para conjurar uma destas magias:\n\n' +
      'Portal. Apertando uma face uma vez, você conjura Portal, abrindo passagem para o plano ' +
      'daquela face.\n' +
      'Deslocamento Planar. Apertando a mesma face duas vezes, você conjura Deslocamento Planar, ' +
      'levando os alvos ao plano daquela face.',
  },
}
