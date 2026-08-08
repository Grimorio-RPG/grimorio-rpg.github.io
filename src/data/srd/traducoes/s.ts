// Itens do SRD que começam com S.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const S: Record<string, TraducaoDeItem> = {
  'Scarab of Protection': {
    nome: 'Escaravelho de Proteção',
    texto:
      'Este medalhão em forma de besouro dá três benefícios enquanto estiver com você.\n\n' +
      'Defesa. Você recebe +1 na Classe de Armadura.\n\n' +
      'Preservação. O escaravelho tem 12 cargas. Se você falhar numa salvaguarda contra uma magia de ' +
      'Necromancia ou contra um efeito nocivo vindo de um morto-vivo, pode usar uma reação para ' +
      'gastar 1 carga e transformar a falha em sucesso. Ao gastar a última carga, ele vira pó e é ' +
      'destruído.\n\n' +
      'Resistência a Magia. Você tem vantagem nas salvaguardas contra magias.',
  },

  'Scimitar of Speed': {
    nome: 'Cimitarra da Velocidade',
    texto:
      'Você recebe +2 nas rolagens de ataque e de dano feitas com esta arma mágica. Além disso, pode ' +
      'fazer um ataque com ela como ação bônus em cada um dos seus turnos.',
  },

  'Sending Stones': {
    nome: 'Pedras de Mensagem',
    texto:
      'As Pedras de Mensagem vêm aos pares, cada uma entalhada para combinar com a outra, de modo ' +
      'que o par se reconheça de longe. Tocando uma delas, você pode conjurar Mensagem Longa com ' +
      'ela, e o alvo é quem estiver com a outra. Se ninguém estiver com a outra pedra, você fica ' +
      'sabendo disso assim que usa a sua, e a magia não é conjurada. Depois de uma conjuração por ' +
      'qualquer uma das duas, as pedras só servem de novo no amanhecer seguinte. Se uma do par for ' +
      'destruída, a outra deixa de ser mágica.',
  },

  'Sentinel Shield': {
    nome: 'Escudo Sentinela',
    texto:
      'Segurando este escudo, você tem vantagem em rolagens de iniciativa e em testes de Sabedoria ' +
      '(Percepção). O escudo é brasonado com o símbolo de um olho.',
  },

  'Shield, +1, +2, or +3': {
    nome: 'Escudo +1, +2 ou +3',
    texto:
      'Segurando este escudo, você recebe na Classe de Armadura um bônus determinado pela raridade ' +
      'dele, somado ao bônus normal do escudo.',
  },

  'Shield of Missile Attraction': {
    nome: 'Escudo da Atração de Projéteis',
    texto:
      'Segurando este escudo, você tem Resistência a dano de ataques feitos com armas à distância.\n\n' +
      'Maldição. Este escudo é amaldiçoado. Sintonizar-se amaldiçoa você até ser alvo de Remover ' +
      'Maldição ou magia parecida — largar o escudo não resolve. Sempre que um ataque com arma à ' +
      'distância mirar uma criatura a até 3 m de você, a maldição faz você virar o alvo no lugar ' +
      'dela.',
  },

  'Shield of the Cavalier': {
    nome: 'Escudo do Cavaleiro',
    texto:
      'Segurando este escudo, você recebe +2 na Classe de Armadura, somado ao bônus normal dele. Ele ' +
      'tem ainda estas propriedades, que você pode usar enquanto o segura.\n\n' +
      'Golpe de Escudo. Ao usar a ação Atacar, você pode fazer uma das rolagens de ataque com o ' +
      'escudo contra um alvo a até 1,5 m de você, somando seu bônus de proficiência e seu modificador ' +
      'de Força. Se acertar, o escudo causa dano de força igual a 2d6 + 2 mais o seu modificador de ' +
      'Força, e se o alvo for uma criatura você pode empurrá-la até 3 m para longe de você. Se ela ' +
      'for do seu tamanho ou menor, também pode derrubá-la, deixando-a com a condição Caído.\n\n' +
      'Campo Protetor. Como reação, quando você ou um aliado que você veja a até 1,5 m for alvo de ' +
      'um ataque ou fizer uma salvaguarda contra uma área de efeito, você pode usar o escudo para ' +
      'criar uma Emanação imóvel de 1,5 m a partir de você. Ao aparecer, criaturas ou objetos que ' +
      'não caibam inteiros dentro dela são empurrados para os espaços desocupados mais próximos, ' +
      'fora. O ataque ou a área que disparou a reação não faz efeito nenhum em quem está dentro. A ' +
      'Emanação dura enquanto você mantiver concentração, até 1 minuto. Nada entra nem sai dela: quem ' +
      'está dentro não pode ser ferido por ataques ou efeitos de fora, nem ferir nada que esteja do ' +
      'lado de fora. Depois de usada, esta propriedade só volta no amanhecer seguinte.',
  },

  'Slippers of Spider Climbing': {
    nome: 'Sapatilhas de Escalar Paredes',
    texto:
      'Enquanto você usa estes sapatos leves, pode subir, descer e andar por superfícies verticais e ' +
      'tetos com as mãos livres, e tem deslocamento de escalada igual ao seu deslocamento. As ' +
      'sapatilhas não funcionam em superfícies escorregadias, como as cobertas de gelo ou óleo.',
  },

  'Sovereign Glue': {
    nome: 'Cola Soberana',
    texto:
      'Esta substância viscosa e branca-leitosa cria uma colagem permanente entre dois objetos ' +
      'quaisquer. Precisa ser guardada num pote ou frasco untado por dentro com Óleo do ' +
      'Escorregadio. Quando achado, o recipiente tem 1d6 + 1 doses de 30 g, e cada dose cobre uma ' +
      'superfície de 30 cm de lado.\n\n' +
      'Aplicar uma dose exige a ação Utilizar, e a cola leva 1 minuto para pegar. Depois disso, a ' +
      'colagem só se desfaz com Solvente Universal, Óleo da Eterealidade ou a magia Desejo.',
  },

  'Spellguard Shield': {
    nome: 'Escudo Guarda-Magias',
    texto:
      'Segurando este escudo, você tem vantagem nas salvaguardas contra magias e outros efeitos ' +
      'mágicos, e as rolagens de ataque de magia contra você têm desvantagem.',
  },

  'Spell Scroll': {
    nome: 'Pergaminho de Magia',
    texto:
      'Um Pergaminho de Magia traz as palavras de uma magia só, escritas em cifra mística. Se a magia ' +
      'estiver na sua lista, você pode ler o pergaminho e conjurá-la sem componentes materiais; ' +
      'senão, o texto é ininteligível.\n\n' +
      'Conjurar lendo o pergaminho leva o tempo normal de conjuração da magia. Depois de conjurada, ' +
      'o pergaminho vira pó — mas se a conjuração for interrompida, ele não se perde.\n\n' +
      'Se a magia estiver na sua lista mas for de um círculo acima do que você normalmente conjura, ' +
      'faça um teste com o seu atributo de conjuração para saber se consegue: a CD é 10 mais o ' +
      'círculo da magia. Se falhar, a magia some do pergaminho sem mais efeito.\n\n' +
      'O círculo da magia determina a CD de salvaguarda, o bônus de ataque e a raridade do ' +
      'pergaminho — a tabela completa está no SRD, começando em truque (Comum, CD 13, +5).',
  },

  'Sphere of Annihilation': {
    nome: 'Esfera da Aniquilação',
    texto:
      'Esta esfera negra de 60 cm de diâmetro é um buraco no multiverso, pairando no espaço e ' +
      'estabilizada por um campo mágico ao redor. Ela aniquila toda matéria por onde passa e toda ' +
      'matéria que passa por ela. Artefatos são a exceção: a não ser que um artefato seja suscetível ' +
      'ao dano dela, ele atravessa ileso. Qualquer outra coisa que toque a esfera sem ser inteiramente ' +
      'engolida sofre 8d10 de dano de força.\n\n' +
      'Controlar a esfera. Ela fica parada até alguém assumir o controle. Estando a até 18 m dela, ' +
      'você pode usar a ação Magia para fazer um teste de Inteligência (Arcanismo) CD 25. Se passar, ' +
      'controla a esfera até o começo do seu próximo turno, e quem a controlava perde o controle. Se ' +
      'falhar, ela avança 3 m em linha reta na sua direção.\n\n' +
      'Controlando a esfera, você pode usar uma ação bônus para movê-la numa direção à sua escolha, ' +
      'até 1,5 m por ponto do seu modificador de Inteligência (mínimo 1,5 m). Toda criatura em cujo ' +
      'espaço a esfera entrar faz uma salvaguarda de Destreza CD 19 ou é tocada por ela, sofrendo ' +
      '8d10 de dano de força. Quem chegar a 0 pontos de vida por esse dano é aniquilado, deixando os ' +
      'pertences mas nenhum resto físico.\n\n' +
      'Interações. Se a esfera encostar num portal planar (como o da magia Portal) ou num espaço ' +
      'extradimensional (como o de um Buraco Portátil), o Mestre sorteia o que acontece na tabela do ' +
      'SRD.',
  },

  'Staff of Charming': {
    nome: 'Cajado do Encanto',
    texto:
      'Este cajado tem 10 cargas. Segurando-o, você pode usar qualquer uma das propriedades:\n\n' +
      'Conjurar. Gaste 1 carga para conjurar Enfeitiçar Pessoa, Comando ou Compreender Idiomas com o ' +
      'cajado, usando a sua CD de magia.\n\n' +
      'Refletir Encantamento. Se você passar numa salvaguarda contra uma magia de Encantamento que ' +
      'mire só você, pode usar uma reação e gastar 1 carga para devolvê-la a quem a conjurou, como se ' +
      'você a tivesse conjurado.\n\n' +
      'Resistir a Encantamento. Se você falhar numa salvaguarda contra uma magia de Encantamento que ' +
      'mire só você, pode transformar a falha em sucesso. Esta propriedade só volta no amanhecer ' +
      'seguinte.\n\n' +
      'Recuperar cargas. O cajado recupera 1d8 + 2 cargas gastas todo amanhecer. Se você gastar a ' +
      'última, role 1d20: num 1, ele vira pó e é destruído.',
  },

  'Staff of Fire': {
    nome: 'Cajado do Fogo',
    texto:
      'Você tem Resistência a dano de fogo enquanto segura este cajado.\n\n' +
      'Magias. O cajado tem 10 cargas. Segurando-o, você pode conjurar com ele, usando a sua CD de ' +
      'magia: Mãos Flamejantes (1 carga), Bola de Fogo (3) e Muralha de Fogo (4).\n\n' +
      'Recuperar cargas. Recupera 1d6 + 4 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ele vira cinzas e é destruído.',
  },

  'Staff of Frost': {
    nome: 'Cajado do Gelo',
    texto:
      'Você tem Resistência a dano de frio enquanto segura este cajado.\n\n' +
      'Magias. O cajado tem 10 cargas. Segurando-o, você pode conjurar com ele, usando a sua CD de ' +
      'magia: Nuvem de Névoa (1 carga), Tempestade de Granizo (4), Muralha de Gelo (4) e Cone de ' +
      'Frio (5).\n\n' +
      'Recuperar cargas. Recupera 1d6 + 4 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ele vira água e é destruído.',
  },

  'Staff of Healing': {
    nome: 'Cajado da Cura',
    texto:
      'Este cajado tem 10 cargas. Segurando-o, você pode conjurar com ele, usando o modificador do ' +
      'seu atributo de conjuração: Curar Ferimentos (1 carga por círculo da magia, até 4 para a de ' +
      '4º círculo), Restauração Menor (2) e Curar Ferimentos em Massa (5).\n\n' +
      'Recuperar cargas. Recupera 1d6 + 4 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ele some num clarão de luz, perdido para sempre.',
  },

  'Staff of Power': {
    nome: 'Cajado do Poder',
    texto:
      'Este cajado tem 20 cargas e pode ser empunhado como um bordão mágico que dá +2 nas rolagens ' +
      'de ataque e de dano feitas com ele. Segurando-o, você recebe +2 na Classe de Armadura, nas ' +
      'salvaguardas e nas rolagens de ataque de magia.\n\n' +
      'Magias. Segurando o cajado, você pode conjurar com ele, usando a sua CD de magia: Mísseis ' +
      'Mágicos e Raio do Enfraquecimento (1 carga), Levitação (2), Cone de Frio, Imobilizar Monstro, ' +
      'Muralha de Força, Bola de Fogo na versão de 5º círculo e Relâmpago na versão de 5º círculo ' +
      '(5), Globo de Invulnerabilidade (6).\n\n' +
      'Recuperar cargas. Recupera 2d8 + 4 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ele mantém o +2 nas rolagens de ataque e dano mas perde todas as outras ' +
      'propriedades; num 20, recupera 1d8 + 2 cargas.\n\n' +
      'Golpe Retributivo. Você pode usar a ação Magia para quebrar o cajado no joelho ou contra uma ' +
      'superfície sólida. Ele é destruído e libera a magia numa explosão que preenche uma Emanação de ' +
      '9 m a partir dele. Você tem 50% de chance de viajar na hora para um plano de existência ' +
      'aleatório, escapando da explosão. Se não escapar, sofre dano de força igual a 16 vezes o ' +
      'número de cargas que havia no cajado. Cada outra criatura na área faz uma salvaguarda de ' +
      'Destreza CD 17 e sofre dano de força igual a 4 vezes o número de cargas se falhar, ou metade ' +
      'se passar.',
  },

  'Staff of Striking': {
    nome: 'Cajado do Golpe',
    texto:
      'Este cajado pode ser empunhado como um bordão mágico que dá +3 nas rolagens de ataque e de ' +
      'dano feitas com ele, e tem 10 cargas. Quando você acerta um ataque corpo a corpo com ele, ' +
      'pode gastar até 3 cargas: para cada uma, o alvo sofre 1d6 de dano de força extra.\n\n' +
      'Recuperar cargas. Recupera 1d6 + 4 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ele vira um bordão comum.',
  },

  'Staff of Swarming Insects': {
    nome: 'Cajado do Enxame de Insetos',
    texto:
      'Este cajado tem 10 cargas.\n\n' +
      'Nuvem de Insetos. Segurando-o, você pode usar a ação Magia e gastar 1 carga para encher uma ' +
      'Emanação de 9 m a partir de você com um enxame de insetos voadores inofensivos. Eles ficam 10 ' +
      'minutos, deixando a área densamente obscurecida para todos menos você. Um vento forte (como o ' +
      'de Rajada de Vento) dispersa o enxame e encerra o efeito.\n\n' +
      'Magias. Segurando o cajado, você pode conjurar com ele, usando a sua CD de magia e o seu bônus ' +
      'de ataque mágico: Inseto Gigante (4 cargas) e Praga de Insetos (5).\n\n' +
      'Recuperar cargas. Recupera 1d6 + 4 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, um enxame de insetos devora e destrói o cajado, e depois se dispersa.',
  },

  'Staff of the Magi': {
    nome: 'Cajado dos Magos',
    texto:
      'Este cajado tem 50 cargas e pode ser empunhado como um bordão mágico que dá +2 nas rolagens ' +
      'de ataque e de dano feitas com ele. Segurando-o, você recebe +2 nas rolagens de ataque de ' +
      'magia.\n\n' +
      'Absorver Magia. Segurando o cajado, você tem vantagem nas salvaguardas contra magias. Além ' +
      'disso, pode usar uma reação quando outra criatura conjura uma magia que mira só em você: o ' +
      'cajado absorve a magia, cancelando o efeito e ganhando cargas iguais ao círculo dela. Mas se ' +
      'isso levar o total acima de 50 cargas, o cajado explode como no Golpe Retributivo.\n\n' +
      'Magias. Segurando o cajado, você pode conjurar com ele, usando a sua CD de magia: Fechadura ' +
      'Arcana, Detectar Magia, Aumentar/Reduzir, Luz, Mão Mágica e Proteção contra o Bem e o Mal (0 ' +
      'cargas); Esfera Flamejante, Invisibilidade, Destrancar e Teia (2); Dissipar Magia (3); ' +
      'Tempestade de Granizo e Muralha de Fogo (4); Passar por Paredes e Telecinesia (5); Conjurar ' +
      'Elemental, Deslocamento Planar, Bola de Fogo na versão de 7º círculo e Relâmpago na versão de ' +
      '7º círculo (7).\n\n' +
      'Recuperar cargas. Recupera 4d6 + 2 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 20, ele recupera 1d12 + 1 cargas.\n\n' +
      'Golpe Retributivo. Você pode usar a ação Magia para quebrar o cajado no joelho ou contra uma ' +
      'superfície sólida. Ele é destruído e libera a magia numa explosão que preenche uma Emanação de ' +
      '9 m a partir dele. Você tem 50% de chance de viajar na hora para um plano aleatório, escapando ' +
      'da explosão. Se não escapar, sofre dano de força igual a 16 vezes o número de cargas. Cada ' +
      'outra criatura na área faz uma salvaguarda de Destreza CD 17 e sofre dano de força igual a 6 ' +
      'vezes o número de cargas se falhar, ou metade se passar.',
  },

  'Staff of the Python': {
    nome: 'Cajado da Píton',
    texto:
      'Com a ação Magia, você pode arremessar este cajado num espaço desocupado a até 3 m de você, e ' +
      'ele vira uma serpente constritora gigante ali. A serpente fica sob seu controle e divide a sua ' +
      'iniciativa, agindo logo depois de você.\n\n' +
      'No seu turno, você pode comandá-la mentalmente, sem gastar ação, se ela estiver a até 18 m e ' +
      'você não estiver com a condição Incapacitado: você decide a ação e o movimento dela, ou dá uma ' +
      'ordem geral, como atacar seus inimigos ou guardar um lugar. Sem ordens, ela se defende.\n\n' +
      'Com uma ação bônus, você pode mandá-la voltar à forma de cajado no espaço em que estiver, e ' +
      'aí a propriedade só serve de novo em 1 hora. Se a serpente chegar a 0 pontos de vida, ela ' +
      'morre e volta a ser cajado — que então se estilhaça e é destruído. Se voltar a ser cajado ' +
      'antes de perder todos os pontos de vida, recupera todos.',
  },

  'Staff of the Woodlands': {
    nome: 'Cajado das Matas',
    texto:
      'Este cajado tem 6 cargas e pode ser empunhado como um bordão mágico que dá +2 nas rolagens de ' +
      'ataque e de dano feitas com ele. Segurando-o, você recebe +2 nas rolagens de ataque de magia.\n\n' +
      'Magias. Segurando o cajado, você pode conjurar com ele, usando a sua CD de magia: Amizade ' +
      'Animal e Falar com Animais (1 carga); Pele de Árvore, Localizar Animais ou Plantas e Passos ' +
      'sem Rastro (2); Falar com Plantas (3); Despertar (5); Muralha de Espinhos (6).\n\n' +
      'Forma de Árvore. Você pode usar a ação Magia para fincar uma ponta do cajado na terra num ' +
      'espaço desocupado e gastar 1 carga, transformando-o numa árvore viçosa de 18 m de altura, ' +
      'tronco de 1,5 m de diâmetro e copa de 6 m de raio. A árvore parece comum, mas emite uma aura ' +
      'fraca de Transmutação que Detectar Magia percebe. Tocando a árvore e usando a ação Magia, você ' +
      'devolve o cajado à forma normal — e quem estiver na árvore cai.\n\n' +
      'Recuperar cargas. Recupera 1d6 cargas gastas todo amanhecer. Se você gastar a última, role ' +
      '1d20: num 1, ele perde as propriedades e vira um bordão comum.',
  },

  'Staff of Thunder and Lightning': {
    nome: 'Cajado do Trovão e do Relâmpago',
    texto:
      'Este cajado pode ser empunhado como um bordão mágico que dá +2 nas rolagens de ataque e de ' +
      'dano feitas com ele. Tem ainda as propriedades abaixo; cada uma, depois de usada, só volta no ' +
      'amanhecer seguinte.\n\n' +
      'Relâmpago. Ao acertar um ataque corpo a corpo com o cajado, você pode fazer o alvo sofrer 2d6 ' +
      'de dano elétrico extra (sem gastar ação).\n\n' +
      'Trovão. Ao acertar um ataque corpo a corpo com o cajado, você pode fazê-lo soltar um estrondo ' +
      'ouvido a até 90 m (sem gastar ação). O alvo faz uma salvaguarda de Constituição CD 17 ou fica ' +
      'com a condição Atordoado até o fim do seu próximo turno.\n\n' +
      'Trovão e Relâmpago. Logo depois de acertar um ataque corpo a corpo com o cajado, você pode ' +
      'usar uma ação bônus para usar as duas propriedades acima ao mesmo tempo. Isso não gasta o uso ' +
      'diário delas, só o desta.\n\n' +
      'Descarga. Você pode usar a ação Magia para um raio saltar da ponta do cajado numa Linha de 1,5 ' +
      'm de largura por 36 m de comprimento. Cada criatura na Linha faz uma salvaguarda de Destreza ' +
      'CD 17 e sofre 9d6 de dano elétrico se falhar, ou metade se passar.\n\n' +
      'Estrondo. Você pode usar a ação Magia para o cajado produzir um trovão ouvido a até 180 m. ' +
      'Toda criatura numa Emanação de 18 m a partir de você faz uma salvaguarda de Constituição CD ' +
      '17: se falhar, sofre 2d6 de dano trovejante e fica com a condição Surdo por 1 minuto; se ' +
      'passar, sofre metade do dano e mais nada.',
  },

  'Staff of Withering': {
    nome: 'Cajado do Definhamento',
    texto:
      'Este cajado tem 3 cargas e recupera 1d3 gastas todo amanhecer. Pode ser empunhado como um ' +
      'bordão mágico: ao acertar, causa o dano de um bordão comum, e você pode gastar 1 carga para ' +
      'causar 2d10 de dano necrótico extra e obrigar o alvo a fazer uma salvaguarda de Constituição ' +
      'CD 15. Se falhar, ele fica por 1 hora com desvantagem em qualquer teste ou salvaguarda de ' +
      'Força ou Constituição.',
  },

  'Stone of Controlling Earth Elementals': {
    nome: 'Pedra de Controlar Elementais da Terra',
    texto:
      'Encostando esta pedra de 2,5 kg no chão, você pode usar a ação Magia para invocar um Elemental ' +
      'da Terra. Ele aparece num espaço desocupado à sua escolha a até 9 m de você, obedece às suas ' +
      'ordens e age logo depois de você na iniciativa. Some depois de 1 hora, quando morre, ou quando ' +
      'você o dispensa com uma ação bônus. A pedra só volta a funcionar assim no amanhecer seguinte.',
  },

  'Stone of Good Luck (Luckstone)': {
    nome: 'Pedra da Boa Sorte',
    texto:
      'Com esta ágata polida em sua posse, você recebe +1 em testes de atributo e em salvaguardas.',
  },

  'Sun Blade': {
    nome: 'Lâmina Solar',
    texto:
      'Este item parece ser só o punho de uma espada.\n\n' +
      'Lâmina de Luz. Segurando o punho, você pode usar uma ação bônus para uma lâmina de pura luz ' +
      'brotar dele, ou para fazê-la sumir. Com a lâmina, esta arma mágica funciona como uma espada ' +
      'longa com a propriedade Acuidade. Se você tem proficiência com espada longa ou curta, tem ' +
      'proficiência com a Lâmina Solar. Você recebe +2 nas rolagens de ataque e de dano feitas com ' +
      'ela, e o dano é radiante em vez de cortante. Ao acertar um morto-vivo, ele sofre 1d8 de dano ' +
      'radiante extra.\n\n' +
      'Luz do Sol. A lâmina luminosa emite luz plena num raio de 4,5 m e luz fraca por mais 4,5 m, e ' +
      'essa luz é luz do sol. Com a lâmina acesa, você pode usar a ação Magia para aumentar ou ' +
      'diminuir os dois raios em 1,5 m cada, até no máximo 9 m cada ou no mínimo 3 m cada.',
  },

  'Sword of Life Stealing': {
    nome: 'Espada do Roubo de Vida',
    texto:
      'Quando você ataca uma criatura com esta arma mágica e tira 20 no d20 do ataque, o alvo sofre ' +
      '15 de dano necrótico extra, se não for constructo nem morto-vivo, e você ganha pontos de vida ' +
      'temporários iguais a esse dano necrótico.',
  },

  'Sword of Sharpness': {
    nome: 'Espada do Afiamento',
    texto:
      'Quando você acerta um objeto com esta arma mágica, use o valor máximo dos dados de dano dela ' +
      'contra o alvo. Quando você ataca uma criatura com ela e tira 20 no d20 do ataque, o alvo sofre ' +
      '14 de dano cortante extra e ganha 1 nível de exaustão.',
  },

  'Sword of Wounding': {
    nome: 'Espada dos Ferimentos',
    texto:
      'Quando você acerta uma criatura com um ataque usando esta arma mágica, ela sofre 2d6 de dano ' +
      'necrótico extra e faz uma salvaguarda de Constituição CD 15 ou fica 1 hora sem conseguir ' +
      'recuperar pontos de vida. O alvo repete a salvaguarda no fim de cada turno dele, encerrando o ' +
      'efeito em si mesmo se passar.',
  },
}
