// Itens do SRD que começam com B.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const B: Record<string, TraducaoDeItem> = {
  'Bag of Beans': {
    nome: 'Saco de Feijões',
    texto:
      'Este saco pesado de pano contém 3d4 feijões secos quando encontrado. Pesa 250 g não ' +
      'importa quantos feijões tenha, e vira item comum quando o último sai.\n\n' +
      'Se você despejar um ou mais feijões do saco, eles explodem numa Esfera de 3 m de raio ' +
      'centrada neles. Todos os feijões despejados se destroem na explosão, e cada criatura na ' +
      'Esfera, incluindo você, faz uma salvaguarda de Destreza CD 15 e sofre 5d4 de dano de força ' +
      'se falhar, ou metade se passar.\n\n' +
      'Se você tirar um feijão do saco, plantar na terra ou na areia e regar, ele some e produz um ' +
      'efeito 1 minuto depois, saindo do chão onde foi plantado. O Mestre escolhe o efeito na ' +
      'tabela do SRD ou sorteia.',
  },

  'Bag of Devouring': {
    nome: 'Saco Devorador',
    texto:
      'Este saco parece um Saco de Guardados, mas é a boca de uma criatura extradimensional ' +
      'gigantesca. Virar o saco pelo avesso fecha a boca. A criatura presa ao saco percebe tudo o ' +
      'que é colocado lá dentro.\n\n' +
      'Matéria animal ou vegetal colocada inteira no saco é devorada e perdida para sempre. Quando ' +
      'parte de uma criatura viva entra no saco — como ao enfiar a mão —, há 50% de chance de a ' +
      'criatura ser puxada para dentro. Quem está lá dentro pode usar uma ação para tentar escapar ' +
      'com um teste de Força (Atletismo) CD 20; outra criatura pode usar uma ação para puxá-la ' +
      'para fora com um teste de Força (Atletismo) CD 20, desde que não seja puxada para dentro ' +
      'antes. Toda criatura que começa o turno dentro do saco é devorada e seu corpo destruído.\n\n' +
      'Objetos inanimados podem ser guardados, até uns 30 litros. Mas uma vez por dia o saco ' +
      'engole o que está lá dentro e cospe em outro plano de existência — o Mestre decide quando e ' +
      'onde. Se o saco for furado ou rasgado, é destruído e tudo que estava dentro vai parar num ' +
      'lugar aleatório do Plano Astral.',
  },

  'Bag of Holding': {
    nome: 'Saco de Guardados',
    texto:
      'Este saco tem por dentro um espaço bem maior do que por fora — mais ou menos 60 cm de lado ' +
      'por 1,2 m de fundo. Aguenta até 225 kg, sem passar de 1.800 litros, e pesa 2,5 kg qualquer ' +
      'que seja o conteúdo. Tirar um item de dentro exige a ação Utilizar.\n\n' +
      'Se o saco for sobrecarregado, furado ou rasgado, é destruído e o conteúdo se espalha pelo ' +
      'Plano Astral. Virado pelo avesso, o conteúdo cai fora sem dano, mas o saco precisa ser ' +
      'endireitado antes de servir de novo. Guarda ar para 10 minutos de respiração divididos pelo ' +
      'número de criaturas lá dentro.\n\n' +
      'Colocar um Saco de Guardados dentro de um espaço extradimensional criado por uma Mochila ' +
      'Prática, um Buraco Portátil ou item parecido destrói os dois na hora e abre um portal para o ' +
      'Plano Astral, no ponto em que um foi posto dentro do outro. Toda criatura numa Esfera de 3 m ' +
      'de raio centrada no portal é sugada para um lugar aleatório do Plano Astral. O portal então ' +
      'se fecha; é de mão única e não reabre.',
  },

  'Bag of Tricks': {
    nome: 'Saco de Truques',
    texto:
      'Este saco de pano cinza, ferrugem ou bege parece vazio, mas enfiar a mão revela um ' +
      'objetinho peludo. Você pode usar a ação Magia para tirar o objeto e arremessá-lo a até 6 m. ' +
      'Ao cair, ele vira uma criatura — qual depende da cor do saco, sorteada na tabela do SRD.\n\n' +
      'A criatura some no amanhecer seguinte ou quando cai a 0 pontos de vida. É Amistosa com você ' +
      'e seus aliados e age logo depois de você na iniciativa. Você pode usar uma ação bônus para ' +
      'mandar como ela se move e o que faz no próximo turno, como atacar um inimigo; sem ordem, ela ' +
      'age conforme a própria natureza.\n\n' +
      'Depois de três objetos tirados, o saco só volta a funcionar no amanhecer seguinte.',
  },

  'Bead of Force': {
    nome: 'Esfera de Força',
    texto:
      'Esta bolinha preta tem cerca de 2 cm e pesa quase nada. Costumam ser achadas 1d4 + 4 ' +
      'juntas.\n\n' +
      'Você pode usar a ação Magia para arremessá-la a até 18 m. Ela explode numa Esfera de 3 m de ' +
      'raio ao bater e se destrói. Cada criatura na Esfera faz uma salvaguarda de Destreza CD 15 ou ' +
      'sofre 5d4 de dano de força.\n\n' +
      'Uma esfera de força transparente então fecha a área por 1 minuto. Quem falhou na ' +
      'salvaguarda e está inteiramente dentro fica preso; quem passou, ou está só parcialmente ' +
      'dentro, é empurrado para fora. Só ar respirável atravessa a parede — nenhum ataque ou efeito ' +
      'passa. Quem está preso pode usar a ação Utilizar para empurrar a parede e mover a esfera até ' +
      'metade do próprio deslocamento. A esfera pode ser carregada: a magia faz ela pesar 500 g, ' +
      'não importa o peso de quem está dentro.',
  },

  'Bead of Nourishment': {
    nome: 'Pérola do Sustento',
    texto:
      'Esta pérola gelatinosa e sem gosto se dissolve na língua e alimenta tanto quanto 1 dia de ' +
      'rações.',
  },

  'Belt of Dwarvenkind': {
    nome: 'Cinto Anão',
    texto:
      'Enquanto veste este cinto, você ganha:\n\n' +
      'Anão. Você sabe falar Anão.\n' +
      'Amigo dos Anões. Você tem vantagem em testes de Carisma (Persuasão) para lidar com anões e ' +
      'duergares.\n' +
      'Rijeza. Sua Constituição sobe 2, até o máximo de 20.\n\n' +
      'Além disso, enquanto sintonizado, você tem 50% de chance por dia, ao amanhecer, de criar ' +
      'uma barba cheia — ou uma barba mais espessa, se já tiver.\n\n' +
      'Se você não for anão nem duergar, ganha também:\n\n' +
      'Visão no Escuro. Você enxerga no escuro a 18 m.\n' +
      'Resiliência. Você tem Resistência a dano de veneno, e vantagem nas salvaguardas para evitar ' +
      'ou encerrar a condição Envenenado.',
  },

  'Belt of Giant Strength': {
    nome: 'Cinto de Força de Gigante',
    texto:
      'Enquanto veste este cinto, sua Força passa a ser a que ele concede. O tipo de gigante ' +
      'determina o valor: colina 21 (Raro), gelo ou pedra 23 (Muito raro), fogo 25 (Muito raro), ' +
      'nuvem 27 (Lendário), tempestade 29 (Lendário). Não faz efeito se a sua Força sem o cinto já ' +
      'for igual ou maior.',
  },

  'Berserker Axe': {
    nome: 'Machado Furioso',
    texto:
      'Você recebe +1 nas rolagens de ataque e de dano feitas com esta arma mágica. Além disso, ' +
      'enquanto sintonizado, seu máximo de pontos de vida sobe 1 por nível que você tiver.\n\n' +
      'Maldição. Esta arma é amaldiçoada, e sintonizar-se estende a maldição a você. Enquanto ' +
      'amaldiçoado, você não se separa dela e a mantém ao alcance o tempo todo, e tem desvantagem ' +
      'em ataques com qualquer outra arma.\n\n' +
      'Sempre que outra criatura causar dano a você com a arma em sua posse, faça uma salvaguarda ' +
      'de Sabedoria CD 15 ou entre em fúria cega. A fúria acaba quando você começa o turno sem ' +
      'nenhuma criatura a até 18 m que você possa ver ou ouvir. Enquanto estiver assim, você trata ' +
      'a criatura mais próxima que puder ver ou ouvir como inimiga (sorteie se houver empate). Em ' +
      'cada turno você tem de chegar o mais perto possível dela e usar a ação Atacar contra ela; se ' +
      'não conseguir chegar perto o bastante, seu turno acaba quando o movimento acabar. Se ela ' +
      'morrer ou sumir da sua vista e audição, a próxima mais perto vira o novo alvo.',
  },

  'Boots of Elvenkind': {
    nome: 'Botas Élficas',
    texto:
      'Enquanto você usa estas botas, seus passos não fazem barulho nenhum, seja qual for o piso. ' +
      'Você também tem vantagem em testes de Destreza (Furtividade).',
  },

  'Boots of Levitation': {
    nome: 'Botas da Levitação',
    texto: 'Enquanto você usa estas botas, pode conjurar Levitação em si mesmo.',
  },

  'Boots of Speed': {
    nome: 'Botas da Velocidade',
    texto:
      'Enquanto você usa estas botas, pode usar uma ação bônus para bater os calcanhares. Se ' +
      'fizer, as botas dobram seu deslocamento, e quem fizer um ataque de oportunidade contra você ' +
      'tem desvantagem na rolagem. Bater os calcanhares de novo encerra o efeito. Quando o uso ' +
      'somar 10 minutos, a magia para de funcionar para você até terminar um descanso longo.',
  },

  'Boots of Striding and Springing': {
    nome: 'Botas de Passolargo e Salto',
    texto:
      'Enquanto você usa estas botas, seu deslocamento passa a 9 m (a não ser que já seja maior), ' +
      'e não é reduzido por carregar peso acima da sua capacidade nem por vestir armadura pesada. ' +
      'Uma vez por turno, você pode saltar até 9 m gastando só 3 m de movimento.',
  },

  'Boots of the Winterlands': {
    nome: 'Botas das Terras Invernais',
    texto:
      'Estas botas de pele são justas e quentes. Enquanto as usa, você ganha:\n\n' +
      'Resistência ao Frio. Você tem Resistência a dano de frio e aguenta temperaturas de −18 °C ou ' +
      'menos sem proteção nenhuma.\n' +
      'Andarilho do Inverno. Você ignora terreno difícil feito de gelo ou neve.',
  },

  'Bowl of Commanding Water Elementals': {
    nome: 'Tigela de Comandar Elementais da Água',
    texto:
      'Com esta tigela cheia de água e você a até 1,5 m dela, você pode usar a ação Magia para ' +
      'invocar um Elemental da Água. Ele aparece num espaço desocupado o mais perto possível da ' +
      'tigela, entende seus idiomas, obedece às suas ordens e age logo depois de você na ' +
      'iniciativa. Some depois de 1 hora, quando morre, ou quando você o dispensa com uma ação ' +
      'bônus. A tigela só volta a funcionar assim no amanhecer seguinte.\n\n' +
      'A tigela tem uns 30 cm de diâmetro por metade disso de fundo, e leva cerca de 11 litros.',
  },

  'Bracers of Archery': {
    nome: 'Braçadeiras do Arqueiro',
    texto:
      'Enquanto veste estas braçadeiras, você tem proficiência com o arco longo e o arco curto, e ' +
      'recebe +2 nas rolagens de dano feitas com essas armas.',
  },

  'Bracers of Defense': {
    nome: 'Braçadeiras de Defesa',
    texto:
      'Enquanto veste estas braçadeiras, você recebe +2 na Classe de Armadura, desde que não esteja ' +
      'usando armadura nem escudo.',
  },

  'Brazier of Commanding Fire Elementals': {
    nome: 'Braseiro de Comandar Elementais do Fogo',
    texto:
      'Com você a até 1,5 m deste braseiro, pode usar a ação Magia para invocar um Elemental do ' +
      'Fogo. Ele aparece num espaço desocupado o mais perto possível do braseiro, entende seus ' +
      'idiomas, obedece às suas ordens e age logo depois de você na iniciativa. Some depois de 1 ' +
      'hora, quando morre, ou quando você o dispensa com uma ação bônus. O braseiro só volta a ' +
      'funcionar assim no amanhecer seguinte.',
  },

  'Brooch of Shielding': {
    nome: 'Broche do Escudo',
    texto:
      'Enquanto veste este broche, você tem Resistência a dano de força e Imunidade ao dano da ' +
      'magia Mísseis Mágicos.',
  },

  'Broom of Flying': {
    nome: 'Vassoura Voadora',
    texto:
      'Esta vassoura de madeira funciona como uma vassoura comum até você montar nela e usar a ' +
      'ação Magia para fazê-la pairar embaixo de você — aí dá para cavalgá-la pelo ar. Ela tem ' +
      'deslocamento de voo de 15 m e carrega até 180 kg, mas o voo cai para 9 m acima de 90 kg. ' +
      'Ela para de pairar quando você pousa ou desmonta.\n\n' +
      'Com a ação Magia, você pode mandar a vassoura viajar sozinha até um destino a até 1,5 km, ' +
      'desde que você nomeie o lugar e o conheça. Ela volta quando você usa a ação Magia e diz a ' +
      'palavra de comando, se ainda estiver a até 1,5 km de você.',
  },
}
