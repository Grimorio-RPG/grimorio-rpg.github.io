// Itens do SRD que começam com T, U, V e W.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const TW: Record<string, TraducaoDeItem> = {
  'Talisman of Pure Good': {
    nome: 'Talismã do Bem Puro',
    texto:
      'Este talismã é um símbolo poderoso da bondade. Um corruptor ou um morto-vivo que o toque sofre ' +
      '8d6 de dano radiante, e sofre de novo cada vez que terminar o turno segurando ou carregando ' +
      'o talismã.\n\n' +
      'Símbolo Sagrado. Você pode usar o talismã como símbolo sagrado, e recebe +2 nas rolagens de ' +
      'ataque de magia enquanto o veste ou segura.\n\n' +
      'Repreensão Pura. O talismã tem 7 cargas. Vestindo-o ou segurando-o, você pode usar a ação ' +
      'Magia e gastar 1 carga para mirar uma criatura que veja no chão a até 36 m. Uma fenda ' +
      'flamejante se abre embaixo dela, e ela faz uma salvaguarda de Destreza CD 20 — com ' +
      'desvantagem, se for corruptor ou morto-vivo. Se falhar, cai na fenda e é destruída, sem ' +
      'deixar restos; se passar, não cai mas sofre 4d6 de dano psíquico pelo susto. De um jeito ou ' +
      'de outro, a fenda se fecha sem deixar sinal. Quando você gasta a última carga, o talismã se ' +
      'desfaz em partículas de luz dourada e é destruído.',
  },

  'Talisman of the Sphere': {
    nome: 'Talismã da Esfera',
    texto:
      'Segurando ou vestindo este talismã, você tem vantagem em qualquer teste de Inteligência ' +
      '(Arcanismo) para controlar uma Esfera da Aniquilação. Além disso, quando você começa o turno ' +
      'no controle de uma, pode usar a ação Magia para movê-la 3 m mais 3 m por ponto do seu ' +
      'modificador de Inteligência. Esse movimento não precisa ser em linha reta.',
  },

  'Talisman of Ultimate Evil': {
    nome: 'Talismã do Mal Supremo',
    texto:
      'Este item simboliza o mal impenitente. Uma criatura que não seja corruptor nem morto-vivo e ' +
      'toque o talismã sofre 8d6 de dano necrótico, e sofre de novo cada vez que terminar o turno ' +
      'segurando ou carregando o talismã.\n\n' +
      'Símbolo Sagrado. Você pode usar o talismã como símbolo sagrado, e recebe +2 nas rolagens de ' +
      'ataque de magia enquanto o veste ou segura.\n\n' +
      'Fim Supremo. O talismã tem 6 cargas. Vestindo-o ou segurando-o, você pode usar a ação Magia e ' +
      'gastar 1 carga para mirar uma criatura que veja no chão a até 36 m. Uma fenda flamejante se ' +
      'abre embaixo dela, e ela faz uma salvaguarda de Destreza CD 20 — com desvantagem, se for ' +
      'celestial. Se falhar, cai na fenda e é destruída, sem deixar restos; se passar, não cai mas ' +
      'sofre 4d6 de dano psíquico. De um jeito ou de outro, a fenda se fecha sem deixar sinal. ' +
      'Quando você gasta a última carga, o talismã se dissolve numa gosma fedorenta e é destruído.',
  },

  'Thunderous Greatclub': {
    nome: 'Clava Grande Trovejante',
    texto:
      'Enquanto sintonizado com esta arma mágica, sua Força passa a 20, a não ser que já seja igual ' +
      'ou maior. A arma causa 1d8 de dano trovejante extra em qualquer criatura que acerte, e 3d8 em ' +
      'objetos que ninguém esteja vestindo ou carregando.\n\n' +
      'Estrondo. Com a ação Magia, você pode bater a arma numa superfície dura para criar um trovão ' +
      'ouvido a até 90 m, além de um Cone de 9 m de energia trovejante. Cada criatura no Cone faz ' +
      'uma salvaguarda de Força CD 15 ou fica com a condição Caído. Objetos não mágicos no Cone que ' +
      'ninguém esteja vestindo ou carregando sofrem 3d8 de dano trovejante.\n\n' +
      'Terremoto. Com a ação Magia, você pode bater a arma no chão para criar um abalo sísmico num ' +
      'círculo de 15 m de raio centrado no ponto de impacto. Estruturas em contato com o chão nessa ' +
      'área sofrem 50 de dano contundente, e cada criatura no chão faz uma salvaguarda de Destreza ' +
      'CD 20 ou fica com a condição Caído — quem estiver concentrando faz também uma salvaguarda de ' +
      'Constituição CD 20 ou perde a concentração. Você também pode abrir uma fenda de 9 m de ' +
      'profundidade por 3 m de largura em qualquer lugar da área: quem estiver onde ela se abre faz ' +
      'uma salvaguarda de Destreza CD 20, caindo dentro se falhar ou se movendo com a borda se ' +
      'passar, e qualquer estrutura ali desaba na fenda. Depois de usada, esta propriedade só volta ' +
      'no amanhecer seguinte.',
  },

  'Tome of Clear Thought': {
    nome: 'Tomo do Pensamento Claro',
    texto:
      'Este livro traz exercícios de memória e lógica, e suas palavras estão carregadas de magia. Se ' +
      'você passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo e praticando o que ele ' +
      'ensina, sua Inteligência sobe 2, até o máximo de 30. O livro então perde a magia, e a recupera ' +
      'em um século.',
  },

  'Tome of Leadership and Influence': {
    nome: 'Tomo da Liderança e da Influência',
    texto:
      'Este livro traz orientações para influenciar e encantar os outros, e suas palavras estão ' +
      'carregadas de magia. Se você passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo ' +
      'e praticando o que ele ensina, seu Carisma sobe 2, até o máximo de 30. O livro então perde a ' +
      'magia, e a recupera em um século.',
  },

  'Tome of Understanding': {
    nome: 'Tomo do Entendimento',
    texto:
      'Este livro traz exercícios de intuição e percepção, e suas palavras estão carregadas de magia. ' +
      'Se você passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo e praticando o que ' +
      'ele ensina, sua Sabedoria sobe 2, até o máximo de 30. O livro então perde a magia, e a ' +
      'recupera em um século.',
  },

  'Trident of Fish Command': {
    nome: 'Tridente do Comando dos Peixes',
    texto:
      'Esta arma mágica tem 3 cargas e recupera 1d3 gastas todo amanhecer. Carregando-a, você pode ' +
      'gastar 1 carga para conjurar Dominar Fera (CD 15) com ela numa fera que tenha deslocamento de ' +
      'natação.',
  },

  'Universal Solvent': {
    nome: 'Solvente Universal',
    texto:
      'Este tubo guarda um líquido leitoso com cheiro forte de álcool. Quando achado, tem 1d6 + 1 ' +
      'doses de 30 g. Você pode usar a ação Utilizar para derramar uma ou mais doses numa superfície ' +
      'ao seu alcance. Cada dose dissolve na hora até 900 cm² do adesivo que tocar, inclusive Cola ' +
      'Soberana.',
  },

  'Vicious Weapon': {
    nome: 'Arma Cruel',
    texto:
      'Esta arma mágica causa 2d6 de dano extra em qualquer criatura que acerte. O dano extra é do ' +
      'mesmo tipo do dano normal da arma.',
  },

  'Vorpal Sword': {
    nome: 'Espada Vorpal',
    texto:
      'Você recebe +3 nas rolagens de ataque e de dano feitas com esta arma mágica. Além disso, ela ' +
      'ignora Resistência a dano cortante.\n\n' +
      'Quando você ataca com ela uma criatura que tenha ao menos uma cabeça e tira 20 no d20 do ' +
      'ataque, você decepa uma das cabeças dela. A criatura morre se não conseguir viver sem a ' +
      'cabeça perdida.\n\n' +
      'A criatura é imune a esse efeito se tiver Imunidade a dano cortante, se não tiver ou não ' +
      'precisar de cabeça, ou se o Mestre decidir que ela é grande demais para ter a cabeça decepada ' +
      'por esta arma — nesses casos, ela sofre 30 de dano cortante extra. Se tiver Resistência ' +
      'Lendária, pode gastar um uso diário desse traço para não perder a cabeça e sofrer o dano extra ' +
      'no lugar.',
  },

  'Wand of Binding': {
    nome: 'Varinha do Aprisionamento',
    texto:
      'Esta varinha tem 7 cargas. Segurando-a, você pode conjurar com ela (CD 17): Imobilizar Pessoa ' +
      '(2 cargas) ou Imobilizar Monstro (5).\n\n' +
      'Recuperar cargas. Recupera 1d6 + 1 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ela vira cinzas e é destruída.',
  },

  'Wand of Enemy Detection': {
    nome: 'Varinha de Detectar Inimigos',
    texto:
      'Esta varinha tem 7 cargas. Segurando-a, você pode usar a ação Magia e gastar 1 carga: por 1 ' +
      'minuto, você sabe a direção da criatura Hostil mais próxima a até 18 m, mas não a distância. ' +
      'Ela percebe criaturas Hostis invisíveis, etéreas, disfarçadas ou escondidas, além das que ' +
      'estão à vista. O efeito acaba se você largar a varinha.\n\n' +
      'Recuperar cargas. Recupera 1d6 + 1 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ela vira cinzas e é destruída.',
  },

  'Wand of Fear': {
    nome: 'Varinha do Medo',
    texto:
      'Esta varinha tem 7 cargas. Segurando-a, você pode conjurar com ela (CD 15): Comando, só com as ' +
      'ordens “fuja” ou “rasteje” (1 carga), ou Medo num Cone de 18 m (3).\n\n' +
      'Recuperar cargas. Recupera 1d6 + 1 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ela vira cinzas e é destruída.',
  },

  'Wand of Fireballs': {
    nome: 'Varinha de Bolas de Fogo',
    texto:
      'Esta varinha tem 7 cargas. Segurando-a, você pode gastar no máximo 3 cargas para conjurar Bola ' +
      'de Fogo (CD 15) com ela. Com 1 carga você conjura a versão de 3º círculo, e cada carga a mais ' +
      'sobe um círculo.\n\n' +
      'Recuperar cargas. Recupera 1d6 + 1 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ela vira cinzas e é destruída.',
  },

  'Wand of Lightning Bolts': {
    nome: 'Varinha de Relâmpagos',
    texto:
      'Esta varinha tem 7 cargas. Segurando-a, você pode gastar no máximo 3 cargas para conjurar ' +
      'Relâmpago (CD 15) com ela. Com 1 carga você conjura a versão de 3º círculo, e cada carga a ' +
      'mais sobe um círculo.\n\n' +
      'Recuperar cargas. Recupera 1d6 + 1 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ela vira cinzas e é destruída.',
  },

  'Wand of Magic Detection': {
    nome: 'Varinha de Detectar Magia',
    texto:
      'Esta varinha tem 3 cargas. Segurando-a, você pode gastar 1 carga para conjurar Detectar Magia ' +
      'com ela. Recupera 1d3 cargas gastas todo amanhecer.',
  },

  'Wand of Magic Missiles': {
    nome: 'Varinha de Mísseis Mágicos',
    texto:
      'Esta varinha tem 7 cargas. Segurando-a, você pode gastar no máximo 3 cargas para conjurar ' +
      'Mísseis Mágicos com ela. Com 1 carga você conjura a versão de 1º círculo, e cada carga a mais ' +
      'sobe um círculo.\n\n' +
      'Recuperar cargas. Recupera 1d6 + 1 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ela vira cinzas e é destruída.',
  },

  'Wand of Paralysis': {
    nome: 'Varinha da Paralisia',
    texto:
      'Esta varinha tem 7 cargas. Segurando-a, você pode usar a ação Magia e gastar 1 carga para um ' +
      'raio azul fino sair da ponta em direção a uma criatura que você veja a até 18 m. Ela faz uma ' +
      'salvaguarda de Constituição CD 15 ou fica com a condição Paralisado por 1 minuto, repetindo a ' +
      'salvaguarda no fim de cada turno dela.\n\n' +
      'Recuperar cargas. Recupera 1d6 + 1 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ela vira cinzas e é destruída.',
  },

  'Wand of Polymorph': {
    nome: 'Varinha da Metamorfose',
    texto:
      'Esta varinha tem 7 cargas. Segurando-a, você pode gastar 1 carga para conjurar Metamorfose ' +
      '(CD 15) com ela.\n\n' +
      'Recuperar cargas. Recupera 1d6 + 1 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ela vira cinzas e é destruída.',
  },

  'Wand of Secrets': {
    nome: 'Varinha dos Segredos',
    texto:
      'Esta varinha tem 3 cargas e recupera 1d3 gastas todo amanhecer. Segurando-a, você pode usar a ' +
      'ação Magia e gastar 1 carga: se houver uma porta secreta ou armadilha a até 18 m de você, a ' +
      'varinha pulsa e aponta para a mais próxima.',
  },

  'Wand of the War Mage, +1, +2, or +3': {
    nome: 'Varinha do Mago de Guerra +1, +2 ou +3',
    texto:
      'Segurando esta varinha, você recebe nas rolagens de ataque de magia um bônus determinado pela ' +
      'raridade dela. Além disso, você ignora cobertura leve ao fazer uma rolagem de ataque de magia.',
  },

  'Wand of Web': {
    nome: 'Varinha da Teia',
    texto:
      'Esta varinha tem 7 cargas. Segurando-a, você pode gastar 1 carga para conjurar Teia (CD 13) ' +
      'com ela.\n\n' +
      'Recuperar cargas. Recupera 1d6 + 1 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ela vira cinzas e é destruída.',
  },

  'Wand of Wonder': {
    nome: 'Varinha das Maravilhas',
    texto:
      'Esta varinha tem 7 cargas. Segurando-a, você pode usar a ação Magia e gastar 1 carga ' +
      'escolhendo um ponto a até 36 m de você. Aquele lugar vira a origem de uma magia ou efeito ' +
      'mágico sorteado na tabela do SRD. Magias conjuradas pela varinha têm CD 15, e uma magia cujo ' +
      'alcance máximo normal seja menor que 36 m passa a ter 36 m quando sai dela. Se um efeito ' +
      'puder atingir vários alvos, o Mestre sorteia quais.\n\n' +
      'Recuperar cargas. Recupera 1d6 + 1 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ela vira pó e é destruída.',
  },

  'Weapon, +1, +2, or +3': {
    nome: 'Arma +1, +2 ou +3',
    texto:
      'Você recebe um bônus nas rolagens de ataque e de dano feitas com esta arma mágica. O bônus é o ' +
      'da raridade dela.',
  },

  'Weapon of Warning': {
    nome: 'Arma do Aviso',
    texto:
      'Enquanto esta arma estiver ao seu alcance e você estiver sintonizado com ela, você e seus ' +
      'aliados a até 9 m ganham:\n\n' +
      'Alarme. A arma acorda por magia quem estiver dormindo naturalmente quando o combate começa. ' +
      'Isso não acorda quem dorme por magia.\n' +
      'Prontidão Sobrenatural. Todos têm vantagem nas rolagens de iniciativa.',
  },

  'Well of Many Worlds': {
    nome: 'Poço dos Muitos Mundos',
    texto:
      'Este pano preto e fino, macio como seda, fica dobrado do tamanho de um lenço e se desdobra num ' +
      'círculo de 1,8 m de diâmetro. Você pode usar a ação Magia para desdobrá-lo e pô-lo numa ' +
      'superfície sólida, onde ele forma um portal circular de mão dupla, de 1,8 m de diâmetro, para ' +
      'outro mundo ou plano de existência. A cada vez que abre um portal, o Mestre decide para onde ' +
      'ele leva.\n\n' +
      'O portal fica aberto até alguém a até 1,5 m dele usar a ação Magia para fechá-lo, pegando as ' +
      'bordas do pano e dobrando. Depois de abrir um portal, o poço só abre outro em 1d8 horas.',
  },

  'Wind Fan': {
    nome: 'Leque do Vento',
    texto:
      'Segurando este leque, você pode conjurar Rajada de Vento (CD 13) com ele. A cada uso seguinte ' +
      'antes do amanhecer, há uma chance cumulativa de 20% de ele não funcionar — e se falhar, se ' +
      'rasga em tiras inúteis e não mágicas.',
  },

  'Winged Boots': {
    nome: 'Botas Aladas',
    texto:
      'Estas botas têm 4 cargas e recuperam 1d4 gastas todo amanhecer. Usando-as, você pode usar a ' +
      'ação Magia e gastar 1 carga para ganhar deslocamento de voo de 9 m por 1 hora. Se estiver ' +
      'voando quando o tempo acabar, você desce 9 m por rodada até pousar.',
  },

  'Wings of Flying': {
    nome: 'Asas do Voo',
    texto:
      'Vestindo este manto, você pode usar a ação Magia para transformá-lo num par de asas nas suas ' +
      'costas. As asas duram 1 hora, ou até você encerrar o efeito antes com outra ação Magia, e dão ' +
      'deslocamento de voo de 18 m. Se você estiver no alto quando elas sumirem, você cai. Depois que ' +
      'somem, você só pode usá-las de novo em 1d12 horas.',
  },
}
