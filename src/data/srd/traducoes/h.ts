// Itens do SRD que começam com H.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const H: Record<string, TraducaoDeItem> = {
  'Hammer of Thunderbolts': {
    nome: 'Martelo dos Trovões',
    texto:
      'Você recebe +1 nas rolagens de ataque e de dano feitas com esta arma mágica. Ela tem 5 ' +
      'cargas.\n\n' +
      'Você pode gastar 1 carga e fazer um ataque à distância com ela, arremessando-a como se ' +
      'tivesse a propriedade Arremesso, com alcance normal de 6 m e longo de 18 m. Se acertar, a ' +
      'arma solta um trovão ouvido a até 90 m: o alvo e toda criatura a até 9 m dele, fora você, ' +
      'fazem uma salvaguarda de Constituição CD 17 ou ficam com a condição Atordoado até o fim do ' +
      'seu próximo turno. Logo depois de acertar ou errar, a arma volta voando para a sua mão. Ela ' +
      'recupera 1d4 + 1 cargas gastas todo amanhecer.\n\n' +
      'Ruína dos Gigantes. Enquanto sintonizado com a arma e vestindo um Cinto de Força de Gigante ' +
      'ou Manoplas da Força do Ogro com que também esteja sintonizado, você ganha:\n\n' +
      'Ruína dos Gigantes. Quando você tirar 20 no d20 de um ataque com esta arma contra um ' +
      'gigante, ele faz uma salvaguarda de Constituição CD 17 ou morre.\n' +
      'Vigor dos Gigantes. O valor de Força concedido pelo seu cinto ou pelas suas manoplas sobe 4, ' +
      'até o máximo de 30.',
  },

  'Handy Haversack': {
    nome: 'Mochila Prática',
    texto:
      'Esta mochila tem um bolso central e dois laterais, cada um deles um espaço extradimensional. ' +
      'Cada bolso lateral leva até 90 kg, sem passar de 700 litros; o central leva até 225 kg, sem ' +
      'passar de 1.800 litros. A mochila pesa sempre 2,5 kg, qualquer que seja o conteúdo.\n\n' +
      'Tirar um item exige a ação Utilizar ou uma ação bônus, à sua escolha. Quando você enfia a ' +
      'mão atrás de um item específico, ele está sempre por cima, por magia.\n\n' +
      'Se qualquer bolso for sobrecarregado, furado ou rasgado, a mochila se rompe e é destruída — ' +
      'e o conteúdo se perde para sempre, embora um artefato sempre reapareça em algum lugar. ' +
      'Virada pelo avesso, o conteúdo cai fora sem dano, mas a mochila precisa ser endireitada ' +
      'antes de servir de novo. Cada bolso guarda ar para 10 minutos de respiração divididos pelo ' +
      'número de criaturas lá dentro.\n\n' +
      'Colocar a mochila dentro de um espaço extradimensional criado por um Saco de Guardados, um ' +
      'Buraco Portátil ou item parecido destrói os dois na hora e abre um portal para o Plano ' +
      'Astral, no ponto em que um foi posto dentro do outro. Toda criatura a até 3 m do portal que ' +
      'não esteja atrás de cobertura total é sugada e depositada num lugar aleatório do Plano ' +
      'Astral. O portal então se fecha; é de mão única e não reabre.',
  },

  'Hat of Disguise': {
    nome: 'Chapéu do Disfarce',
    texto:
      'Vestindo este chapéu, você pode conjurar Disfarçar-se. A magia acaba se o chapéu for tirado.',
  },

  'Hat of Many Spells': {
    nome: 'Chapéu das Muitas Magias',
    texto:
      'Este chapéu pontudo tem duas propriedades.\n\n' +
      'Foco de Conjuração. Segurando o chapéu, você pode usá-lo como foco de conjuração para suas ' +
      'magias de mago. Toda magia conjurada com ele ganha um componente somático especial: você ' +
      'precisa enfiar a mão no chapéu e “puxar” a magia de lá.\n\n' +
      'Magia Desconhecida. Segurando o chapéu, você pode tentar conjurar uma magia de 1º círculo ou ' +
      'mais que não conheça. Ela precisa estar na lista de mago, ser de um círculo que você consiga ' +
      'conjurar, e não ter componentes materiais que custem mais de 1.000 PO. Escolhida a magia, ' +
      'gaste um espaço do círculo dela e faça um teste de Inteligência (Arcanismo) com CD 10 mais o ' +
      'círculo da magia. Se passar, você conjura a magia no tempo normal dela e não pode usar esta ' +
      'propriedade de novo até terminar um descanso curto ou longo. Se falhar, a magia não sai e ' +
      'acontece um efeito aleatório, sorteado na tabela do SRD.\n\n' +
      'Qualquer magia conjurada com o chapéu usa a sua CD de magia e o seu bônus de ataque mágico.',
  },

  'Headband of Intellect': {
    nome: 'Bandana do Intelecto',
    texto:
      'Sua Inteligência passa a 19 enquanto você veste esta bandana. Não faz efeito se a sua ' +
      'Inteligência já for 19 ou mais sem ela.',
  },

  'Helm of Brilliance': {
    nome: 'Elmo do Fulgor',
    texto:
      'Este elmo é cravejado de 1d10 diamantes, 2d10 rubis, 3d10 opalas de fogo e 4d10 opalas. ' +
      'Qualquer gema arrancada vira pó. Quando todas forem tiradas ou destruídas, o elmo perde a ' +
      'magia. Vestindo-o, você ganha:\n\n' +
      'Luz de Diamante. Com pelo menos um diamante, o elmo emite uma Emanação de 9 m. Quando há ao ' +
      'menos um morto-vivo nessa área, a Emanação se enche de luz fraca, e todo morto-vivo que ' +
      'começa o turno lá sofre 1d6 de dano radiante.\n\n' +
      'Chamas de Opala de Fogo. Com pelo menos uma opala de fogo, você pode usar a ação Magia para ' +
      'fazer uma arma que esteja segurando pegar fogo. As chamas lançam luz plena num raio de 3 m e ' +
      'luz fraca por mais 3 m, e não machucam você nem a arma. Ao acertar com a arma em chamas, o ' +
      'alvo sofre 1d6 de dano de fogo extra. As chamas duram até você usar uma ação bônus para ' +
      'apagá-las ou até largar ou guardar a arma.\n\n' +
      'Resistência de Rubi. Com pelo menos um rubi, você tem Resistência a dano de fogo.\n\n' +
      'Magias. Você pode conjurar uma destas magias (CD 18) gastando uma gema do tipo indicado como ' +
      'componente: Luz do Dia (opala), Bola de Fogo (opala de fogo), Spray Prismático (diamante) ou ' +
      'Muralha de Fogo (rubi). A gema é destruída e some do elmo.\n\n' +
      'Ao sofrer dano de fogo. Role 1d20 se você estiver com o elmo e sofrer dano de fogo por falhar ' +
      'numa salvaguarda contra magia. Num 1, o elmo dispara feixes de luz das gemas que restam e ' +
      'então é destruído: cada criatura numa Emanação de 18 m a partir de você faz uma salvaguarda ' +
      'de Destreza CD 17 ou é atingida por um feixe, sofrendo dano radiante igual ao número de gemas ' +
      'que havia no elmo.',
  },

  'Helm of Comprehending Languages': {
    nome: 'Elmo de Compreensão de Idiomas',
    texto: 'Vestindo este elmo, você pode conjurar Compreender Idiomas com ele.',
  },

  'Helm of Telepathy': {
    nome: 'Elmo da Telepatia',
    texto:
      'Vestindo este elmo, você tem telepatia a até 9 m e pode conjurar Detectar Pensamentos ou ' +
      'Sugestão (CD 13) com ele. Depois que uma dessas magias é conjurada pelo elmo, ela só pode ' +
      'ser conjurada de novo por ele no amanhecer seguinte.',
  },

  'Helm of Teleportation': {
    nome: 'Elmo do Teleporte',
    texto:
      'Este elmo tem 3 cargas. Vestindo-o, você pode gastar 1 carga para conjurar Teleporte com ' +
      'ele. O elmo recupera 1d3 cargas gastas todo amanhecer.',
  },

  'Holy Avenger': {
    nome: 'Vingadora Sagrada',
    texto:
      'Você recebe +3 nas rolagens de ataque e de dano feitas com esta arma mágica. Quando você ' +
      'acerta um corruptor ou um morto-vivo com ela, a criatura sofre 2d10 de dano radiante extra.\n\n' +
      'Com a arma desembainhada em mãos, ela cria uma Emanação de 3 m a partir de você. Você e toda ' +
      'criatura Amistosa dentro dela têm vantagem nas salvaguardas contra magias e outros efeitos ' +
      'mágicos. Se você tiver 17 níveis ou mais de paladino, a Emanação sobe para 9 m.',
  },

  'Horn of Blasting': {
    nome: 'Trompa Destroçadora',
    texto:
      'Você pode usar a ação Magia para soprar a trompa, que solta um estrondo num Cone de 9 m, ' +
      'ouvido a até 180 m. Cada criatura no Cone faz uma salvaguarda de Constituição CD 15: se ' +
      'falhar, sofre 5d8 de dano trovejante e fica com a condição Surdo por 1 minuto; se passar, ' +
      'sofre metade do dano e mais nada. Objetos de vidro ou cristal no Cone que ninguém esteja ' +
      'vestindo ou carregando sofrem 10d8 de dano trovejante.\n\n' +
      'Cada uso da magia da trompa tem 20% de chance de fazê-la explodir. A explosão causa 10d6 de ' +
      'dano de força em quem soprou e destrói a trompa.',
  },

  'Horn of Valhalla': {
    nome: 'Trompa de Valhalla',
    texto:
      'Você pode usar a ação Magia para soprar esta trompa. Em resposta, espíritos guerreiros do ' +
      'plano de Ysgard aparecem em espaços desocupados a até 18 m de você. Cada espírito usa o bloco ' +
      'do bárbaro selvagem e volta a Ysgard depois de 1 hora ou quando cai a 0 pontos de vida. Eles ' +
      'parecem guerreiros vivos e têm Imunidade às condições Enfeitiçado e Apavorado. Depois de ' +
      'usada, a trompa só serve de novo em 7 dias.\n\n' +
      'Conhecem-se quatro tipos, cada um de um metal: prata e latão (Raro), bronze (Muito raro) e ' +
      'ferro (Lendário). O tipo decide quantos espíritos vêm e o que se exige de quem sopra — o ' +
      'Mestre escolhe ou sorteia na tabela do SRD. Se você soprar sem cumprir a exigência, os ' +
      'espíritos atacam você; cumprindo, ficam Amistosos com você e seus aliados e seguem suas ' +
      'ordens.',
  },

  'Horseshoes of a Zephyr': {
    nome: 'Ferraduras do Zéfiro',
    texto:
      'Estas ferraduras vêm em jogo de quatro. Com a ação Magia, você encosta uma no casco de um ' +
      'cavalo ou criatura parecida e ela se prende sozinha; tirar também exige a ação Magia.\n\n' +
      'Com as quatro presas na mesma criatura, ela se move normalmente flutuando 10 cm acima do ' +
      'chão. Isso permite atravessar ou parar sobre superfícies instáveis ou não sólidas, como água ' +
      'ou lava. A criatura não deixa rastros e ignora terreno difícil. Além disso, viaja até 12 ' +
      'horas por dia sem ganhar níveis de exaustão pela jornada longa.',
  },

  'Horseshoes of Speed': {
    nome: 'Ferraduras da Velocidade',
    texto:
      'Estas ferraduras vêm em jogo de quatro. Com a ação Magia, você encosta uma no casco de um ' +
      'cavalo ou criatura parecida e ela se prende sozinha; tirar também exige a ação Magia. Com as ' +
      'quatro presas na mesma criatura, o deslocamento dela aumenta em 9 m.',
  },
}
