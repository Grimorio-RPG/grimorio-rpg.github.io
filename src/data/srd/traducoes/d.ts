// Itens do SRD que começam com D.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const D: Record<string, TraducaoDeItem> = {
  'Dagger of Venom': {
    nome: 'Adaga do Veneno',
    texto:
      'Você recebe +1 nas rolagens de ataque e de dano feitas com esta arma mágica. Você pode usar ' +
      'uma ação bônus para cobrir a lâmina de veneno por magia. O veneno dura 1 minuto ou até um ' +
      'ataque com esta arma acertar alguém. A criatura atingida faz uma salvaguarda de Constituição ' +
      'CD 15 ou sofre 2d10 de dano de veneno e fica com a condição Envenenado por 1 minuto. A arma ' +
      'só volta a fazer isso no amanhecer seguinte.',
  },

  'Dancing Sword': {
    nome: 'Espada Dançante',
    texto:
      'Você pode usar uma ação bônus para jogar esta arma mágica no ar. Ela passa a pairar, voa até ' +
      '9 m e ataca uma criatura à sua escolha a até 1,5 m dela. A arma usa a sua rolagem de ataque ' +
      'e soma o seu modificador de atributo ao dano.\n\n' +
      'Enquanto ela paira, você pode usar uma ação bônus para fazê-la voar até 9 m até outro ponto ' +
      'a até 9 m de você; na mesma ação bônus, pode mandá-la atacar uma criatura a até 1,5 m dela.\n\n' +
      'Depois do quarto ataque, a arma volta voando e tenta pousar na sua mão. Se você não tiver ' +
      'mão livre, ela cai no chão no seu espaço; se não houver caminho livre até você, ela chega o ' +
      'mais perto que consegue e cai. Ela também para de pairar se você a segurar ou se ficar a ' +
      'mais de 9 m dela.',
  },

  'Decanter of Endless Water': {
    nome: 'Garrafa de Água Infinita',
    texto:
      'Esta garrafa com rolha chacoalha como se tivesse água dentro, e pesa 1 kg. Você pode usar a ' +
      'ação Magia para tirar a rolha e dizer uma de três palavras de comando; então sai da garrafa ' +
      'água doce ou salgada, à sua escolha. A água para de sair no começo do seu próximo turno.\n\n' +
      'Esguicho. Saem cerca de 4 litros.\n' +
      'Fonte. Saem cerca de 19 litros.\n' +
      'Gêiser. Saem cerca de 114 litros num jato em Linha de 9 m de comprimento por 30 cm de ' +
      'largura. Se estiver segurando a garrafa, você pode mirar o jato numa direção (sem gastar ' +
      'ação). Uma criatura à sua escolha na Linha faz uma salvaguarda de Força CD 13 ou sofre 1d4 ' +
      'de dano contundente e fica com a condição Caído. Em vez de uma criatura, você pode mirar um ' +
      'objeto na Linha que ninguém esteja vestindo ou carregando e que pese até 90 kg — o jato ' +
      'derruba o objeto.',
  },

  'Deck of Illusions': {
    nome: 'Baralho de Ilusões',
    texto:
      'Esta caixa contém um baralho. Completo, ele tem 34 cartas: 32 com criaturas específicas e ' +
      'duas espelhadas. Um baralho achado como tesouro normalmente está com 1d20 − 1 cartas ' +
      'faltando. A magia só funciona se as cartas forem tiradas ao acaso.\n\n' +
      'Você pode usar a ação Magia para tirar uma carta ao acaso e jogá-la no chão num ponto a até ' +
      '9 m de você. Uma ilusão de criatura, sorteada na tabela do SRD, se forma sobre a carta e ' +
      'fica até ser dissipada. A criatura ilusória parece e se comporta como uma de verdade, só que ' +
      'não causa dano nenhum.\n\n' +
      'Estando a até 36 m dela e podendo vê-la, você pode usar a ação Magia para movê-la para ' +
      'qualquer ponto a até 9 m da carta. Qualquer contato físico revela a farsa, porque os objetos ' +
      'a atravessam; quem usar a ação Estudar para examiná-la a identifica como ilusão com um teste ' +
      'de Inteligência (Investigação) CD 15.\n\n' +
      'A ilusão dura até a carta ser movida ou até ser dissipada (com Dissipar Magia ou efeito ' +
      'parecido). Quando acaba, a imagem some da carta e aquela carta não serve mais.',
  },

  Defender: {
    nome: 'Defensora',
    texto:
      'Você recebe +3 nas rolagens de ataque e de dano feitas com esta arma mágica. Na primeira vez ' +
      'que atacar com ela em cada turno, você pode transferir parte ou todo o bônus da arma para a ' +
      'sua Classe de Armadura. Por exemplo, você pode baixar o bônus de ataque e dano para +1 e ' +
      'ganhar +2 na Classe de Armadura. Os bônus ajustados valem até o começo do seu próximo turno, ' +
      'e você precisa estar segurando a arma para ter o bônus de CA.',
  },

  'Demon Armor': {
    nome: 'Armadura Demoníaca',
    texto:
      'Vestindo esta armadura, você recebe +1 na Classe de Armadura e passa a saber Abissal. Além ' +
      'disso, as manoplas com garras fazem seus ataques desarmados causarem 1d8 de dano cortante em ' +
      'vez do contundente de sempre, e você recebe +1 nas rolagens de ataque e de dano deles.\n\n' +
      'Maldição. Depois de vestida, esta armadura amaldiçoada não sai a não ser que você seja alvo ' +
      'de Remover Maldição ou magia parecida. Enquanto a veste, você tem desvantagem em ataques ' +
      'contra demônios e nas salvaguardas contra as magias e habilidades especiais deles.',
  },

  'Dimensional Shackles': {
    nome: 'Algemas Dimensionais',
    texto:
      'Você pode usar a ação Utilizar para pôr estas algemas numa criatura com a condição ' +
      'Incapacitado. Elas se ajustam de tamanho Pequeno a Grande.\n\n' +
      'As algemas impedem quem está preso de usar qualquer movimento extradimensional, incluindo ' +
      'teleporte e viagem a outro plano — mas não impedem de atravessar um portal ' +
      'interdimensional. Você e quem você indicar na hora de usá-las podem tirá-las com a ação ' +
      'Utilizar. Uma vez a cada 30 dias, quem está preso pode fazer um teste de Força (Atletismo) ' +
      'CD 30; se passar, se solta e destrói as algemas.',
  },

  'Dragon Orb': {
    nome: 'Orbe do Dragão',
    texto:
      'O orbe é um globo de cristal gravado de uns 25 cm de diâmetro. Ao ser usado, cresce para uns ' +
      '50 cm e uma névoa gira lá dentro.\n\n' +
      'Sintonizado, você pode usar a ação Magia para olhar dentro dele e fazer uma salvaguarda de ' +
      'Carisma CD 15. Se passar, você controla o orbe enquanto ficar sintonizado. Se falhar, o orbe ' +
      'impõe a condição Enfeitiçado enquanto durar a sintonia — e, enfeitiçado, você não consegue ' +
      'encerrar a sintonia por vontade própria, e o orbe conjura Sugestão em você à vontade (CD 18) ' +
      'para empurrá-lo aos fins malignos que ele deseja. A essência dracônica lá dentro pode querer ' +
      'muita coisa: aniquilar uma sociedade, se libertar do orbe, espalhar sofrimento, promover o ' +
      'culto a Tiamat, ou o que o Mestre decidir.\n\n' +
      'Magias. O orbe tem 7 cargas e recupera 1d4 + 3 gastas todo amanhecer. Controlando o orbe, ' +
      'você pode conjurar: Detectar Magia (0 cargas), Luz do Dia (1), Proteção contra a Morte (2), ' +
      'Vidência CD 18 (3) e Curar Ferimentos na versão de 9º círculo (4).\n\n' +
      'Chamar Dragões. Controlando o orbe, você pode usar a ação Magia para ele emitir um chamado ' +
      'telepático em todas as direções por 64 km. Dragões cromáticos ao alcance se sentem obrigados ' +
      'a vir até o orbe pelo caminho mais direto assim que possível; divindades dracônicas como ' +
      'Tiamat não são afetadas. Os dragões atraídos podem ficar Hostis com você por terem sido ' +
      'forçados. Depois de usada, esta propriedade só volta em 1 hora.\n\n' +
      'Destruir um orbe. Um Orbe do Dragão tem CA 20 e é destruído se sofrer dano de uma arma +3 ou ' +
      'da magia Desintegrar. Mais nada o machuca.',
  },

  'Dragon Scale Mail': {
    nome: 'Cota de Escamas de Dragão',
    texto:
      'Feita das escamas de um tipo de dragão. Às vezes os próprios dragões juntam as escamas que ' +
      'trocam e as dão de presente; outras vezes caçadores preservam com cuidado o couro de um ' +
      'dragão morto. De um jeito ou de outro, é uma armadura muito valorizada.\n\n' +
      'Vestindo-a, você recebe +1 na Classe de Armadura, tem vantagem nas salvaguardas contra as ' +
      'armas de sopro de dragões, e tem Resistência a um tipo de dano conforme o dragão que deu as ' +
      'escamas: preto e cobre, ácido; azul e bronze, elétrico; latão, ouro e vermelho, fogo; prata ' +
      'e branco, frio; verde, veneno.\n\n' +
      'Você também pode usar a ação Magia para aguçar os sentidos e descobrir a distância e a ' +
      'direção do dragão mais próximo, a até 48 km, que seja do mesmo tipo da armadura. Essa ação ' +
      'só volta a funcionar no amanhecer seguinte.',
  },

  'Dragon Slayer': {
    nome: 'Matadora de Dragões',
    texto:
      'Você recebe +1 nas rolagens de ataque e de dano feitas com esta arma mágica. A arma causa ' +
      '3d6 de dano extra, do tipo dela, se o alvo for um dragão.',
  },

  'Dust of Disappearance': {
    nome: 'Pó do Desaparecimento',
    texto:
      'Este pó parece areia fina, e dá para um uso só. Quando você usa a ação Utilizar para jogá-lo ' +
      'no ar, você e cada criatura e objeto numa Emanação de 3 m a partir de você ganham a condição ' +
      'Invisível por 2d4 minutos. A duração é a mesma para todos, e o pó se consome quando a magia ' +
      'faz efeito. Assim que uma criatura afetada faz uma rolagem de ataque, causa dano ou conjura ' +
      'uma magia, a invisibilidade acaba para ela.',
  },

  'Dust of Dryness': {
    nome: 'Pó da Secura',
    texto:
      'Este pacotinho tem 1d6 + 4 pitadas de pó. Com a ação Utilizar, você pode espalhar uma pitada ' +
      'sobre água, transformando até um Cubo de 4,5 m de água numa pelota do tamanho de uma bola de ' +
      'gude, que boia ou fica perto de onde o pó foi jogado. A pelota não pesa praticamente nada. ' +
      'Alguém pode usar a ação Utilizar para espatifá-la numa superfície dura, o que a quebra e ' +
      'devolve a água absorvida — e acaba com a magia dela.\n\n' +
      'Com a ação Utilizar, você também pode jogar uma pitada num elemental a até 1,5 m de você que ' +
      'seja feito principalmente de água (como um Elemental da Água). Ele faz uma salvaguarda de ' +
      'Constituição CD 13 e sofre 10d6 de dano necrótico se falhar, ou metade se passar.',
  },

  'Dust of Sneezing and Choking': {
    nome: 'Pó do Espirro e do Sufoco',
    texto:
      'Achado num potinho, este pó parece Pó do Desaparecimento, e a magia Identificação também diz ' +
      'que é. Dá para um uso só.\n\n' +
      'Com a ação Utilizar, você joga o pó no ar e obriga você e toda criatura numa Emanação de 9 m ' +
      'a partir de você a fazer uma salvaguarda de Constituição CD 15. Constructos, elementais, ' +
      'gosmas, plantas e mortos-vivos passam automaticamente. Quem falha começa a espirrar sem ' +
      'parar: fica com a condição Incapacitado e sufocando. A criatura repete a salvaguarda no fim ' +
      'de cada turno dela, encerrando o efeito em si mesma se passar. O efeito também acaba em quem ' +
      'for alvo de Restauração Menor.',
  },

  'Dwarven Plate': {
    nome: 'Armadura de Placas Anã',
    texto:
      'Vestindo esta armadura, você recebe +2 na Classe de Armadura. Além disso, se algum efeito ' +
      'mover você contra a sua vontade pelo chão, você pode usar uma reação para reduzir a ' +
      'distância em até 3 m.',
  },

  'Dwarven Thrower': {
    nome: 'Arremessador Anão',
    texto:
      'Você recebe +3 nas rolagens de ataque e de dano feitas com esta arma mágica. Ela tem a ' +
      'propriedade Arremesso, com alcance normal de 6 m e longo de 18 m. Quando você acerta um ' +
      'ataque à distância com ela, causa 1d8 de dano de força extra — ou 2d8 se o alvo for um ' +
      'gigante. Logo depois de acertar ou errar, a arma volta voando para a sua mão.',
  },
}
