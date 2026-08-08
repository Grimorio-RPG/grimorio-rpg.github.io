// Itens do SRD que começam com M.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const M: Record<string, TraducaoDeItem> = {
  'Mace of Disruption': {
    nome: 'Maça da Ruptura',
    texto:
      'Quando você acerta um corruptor ou um morto-vivo com esta arma mágica, ele sofre 2d6 de dano ' +
      'radiante extra. Se, depois desse dano, ele estiver com 25 pontos de vida ou menos, faz uma ' +
      'salvaguarda de Sabedoria CD 15 ou é destruído; se passar, fica com a condição Apavorado até ' +
      'o fim do seu próximo turno.\n\n' +
      'Luz. Enquanto você segura esta arma, ela lança luz plena num raio de 6 m e luz fraca por mais ' +
      '6 m.',
  },

  'Mace of Smiting': {
    nome: 'Maça do Esmagamento',
    texto:
      'Você recebe +1 nas rolagens de ataque e de dano feitas com esta arma mágica, e +3 quando ' +
      'ataca um constructo. Quando você tira 20 numa rolagem de ataque com ela, o alvo sofre 7 de ' +
      'dano contundente extra, ou 14 se for um constructo. Se um constructo ficar com 25 pontos de ' +
      'vida ou menos depois desse dano, é destruído.',
  },

  'Mace of Terror': {
    nome: 'Maça do Terror',
    texto:
      'Esta arma mágica tem 3 cargas e recupera 1d3 gastas todo amanhecer. Segurando-a, você pode ' +
      'usar a ação Magia e gastar 1 carga para soltar uma onda de terror. Cada criatura à sua ' +
      'escolha a até 9 m de você faz uma salvaguarda de Sabedoria CD 15 ou fica com a condição ' +
      'Apavorado por 1 minuto.\n\n' +
      'Apavorada assim, a criatura gasta os turnos tentando se afastar o máximo possível de você e ' +
      'não pode fazer ataques de oportunidade. Como ação, só pode usar Corrida ou tentar escapar de ' +
      'algo que a impeça de se mover; se não tiver para onde ir, pode usar a ação Esquiva. Ela ' +
      'repete a salvaguarda no fim de cada turno, encerrando o efeito em si mesma se passar.',
  },

  'Mantle of Spell Resistance': {
    nome: 'Manto da Resistência a Magia',
    texto: 'Você tem vantagem nas salvaguardas contra magias enquanto veste este manto.',
  },

  'Manual of Bodily Health': {
    nome: 'Manual da Saúde do Corpo',
    texto:
      'Este livro traz conselhos de saúde e nutrição, e suas palavras estão carregadas de magia. Se ' +
      'você passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo e praticando o que ele ' +
      'ensina, sua Constituição sobe 2, até o máximo de 30. O manual então perde a magia, e a ' +
      'recupera em um século.',
  },

  'Manual of Gainful Exercise': {
    nome: 'Manual do Exercício Proveitoso',
    texto:
      'Este livro descreve exercícios físicos, e suas palavras estão carregadas de magia. Se você ' +
      'passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo e praticando o que ele ' +
      'ensina, sua Força sobe 2, até o máximo de 30. O manual então perde a magia, e a recupera em ' +
      'um século.',
  },

  'Manual of Golems': {
    nome: 'Manual dos Golens',
    texto:
      'Este tomo traz as informações e os encantamentos necessários para fazer um tipo específico ' +
      'de golem — o Mestre escolhe o tipo ou sorteia na tabela do SRD.\n\n' +
      'Para decifrar e usar o manual, você precisa ser um conjurador com pelo menos dois espaços de ' +
      'magia de 5º círculo. Quem não pode usá-lo e tenta ler sofre 6d6 de dano psíquico.\n\n' +
      'Para criar o golem, você precisa passar o tempo indicado na tabela trabalhando sem ' +
      'interrupção com o manual à mão, descansando no máximo 8 horas por dia, e pagar o custo ' +
      'indicado em materiais. Terminada a criação, o livro se consome em chamas arcanas. O golem ' +
      'ganha vida quando as cinzas do manual são espalhadas sobre ele, fica sob o seu controle, e ' +
      'entende e obedece às suas ordens.',
  },

  'Manual of Quickness of Action': {
    nome: 'Manual da Presteza',
    texto:
      'Este livro traz exercícios de coordenação e equilíbrio, e suas palavras estão carregadas de ' +
      'magia. Se você passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo e praticando ' +
      'o que ele ensina, sua Destreza sobe 2, até o máximo de 30. O manual então perde a magia, e a ' +
      'recupera em um século.',
  },

  'Marvelous Pigments': {
    nome: 'Pigmentos Maravilhosos',
    texto:
      'Esta caixa fina de madeira tem 1d4 potes de pigmento e um pincel (500 g no total). Com o ' +
      'pincel e gastando 1 pote, você pode pintar quantos objetos tridimensionais e elementos de ' +
      'terreno quiser — paredes, portas, árvores, flores, armas, teias, fossos —, desde que tudo ' +
      'caiba num Cubo de 6 m.\n\n' +
      'O trabalho leva 10 minutos, não importa quantos elementos você crie, e exige concentração e ' +
      'que você fique dentro do Cubo. Se a concentração for quebrada ou você sair antes de terminar, ' +
      'tudo o que foi pintado some e o pote se perde.\n\n' +
      'Terminado o trabalho, tudo o que foi pintado vira real: pintar uma porta numa parede cria uma ' +
      'porta de verdade, que abre para o que houver do outro lado; pintar um fosso cria um fosso, ' +
      'cuja profundidade inteira tem de caber no Cubo de 6 m.\n\n' +
      'Nada criado por um pote pode valer mais de 25 PO, e o total criado por um pote não pode ' +
      'passar de 500 PO. Se você pintar coisas de mais valor (uma pilha de ouro, por exemplo), elas ' +
      'parecem autênticas, mas de perto se revelam feitas de massa, biscoito ou outro material sem ' +
      'valor. Se pintar uma forma de energia, como fogo ou raio, ela se dissipa assim que a pintura ' +
      'termina, sem causar dano.',
  },

  'Medallion of Thoughts': {
    nome: 'Medalhão dos Pensamentos',
    texto:
      'O medalhão tem 5 cargas. Vestindo-o, você pode gastar 1 carga para conjurar Detectar ' +
      'Pensamentos (CD 13) com ele. Recupera 1d4 cargas gastas todo amanhecer.',
  },

  'Mirror of Life Trapping': {
    nome: 'Espelho da Prisão de Vidas',
    texto:
      'Este espelho de 1,2 m de altura por 60 cm de largura mostra imagens tênues de criaturas ' +
      'quando visto de esguelha. Pesa 22 kg e tem CA 11, 10 pontos de vida, Imunidade a dano de ' +
      'veneno e psíquico e Vulnerabilidade a dano contundente. Estilhaça-se e é destruído ao chegar ' +
      'a 0 pontos de vida.\n\n' +
      'Com o espelho pendurado numa superfície vertical e você a até 1,5 m dele, pode usar a ação ' +
      'Magia e uma palavra de comando para ativá-lo; fica ativo até você repetir o comando com outra ' +
      'ação Magia.\n\n' +
      'Qualquer criatura que não seja você e veja o próprio reflexo no espelho ativado estando a até ' +
      '9 m dele faz uma salvaguarda de Carisma CD 15 ou fica presa, com tudo o que veste e carrega, ' +
      'numa das doze celas extradimensionais dele. Quem conhece a natureza do espelho faz a ' +
      'salvaguarda com vantagem, e constructos passam automaticamente.\n\n' +
      'Cada cela é uma extensão infinita cheia de névoa densa que limita a visão a 3 m. Quem está ' +
      'preso não envelhece nem precisa comer, beber ou dormir, e só escapa com magia de viagem ' +
      'planar — fora isso, fica lá até ser solto. Se o espelho prender alguém com as doze celas ' +
      'ocupadas, ele solta um prisioneiro ao acaso para abrir vaga; o liberto aparece num espaço ' +
      'desocupado à vista do espelho, mas de costas para ele. Se o espelho for estilhaçado, todos ' +
      'são libertados em espaços desocupados por perto.\n\n' +
      'A até 1,5 m do espelho, você pode usar a ação Magia para nomear uma criatura presa ou chamar ' +
      'uma cela pelo número: ela aparece como imagem na superfície e vocês podem conversar. Do mesmo ' +
      'jeito, com uma segunda palavra de comando, você pode soltar uma criatura, que aparece com os ' +
      'pertences no espaço desocupado mais perto do espelho, de costas para ele.\n\n' +
      'Colocar o espelho dentro de um espaço extradimensional criado por um Saco de Guardados, um ' +
      'Buraco Portátil ou item parecido destrói os dois na hora e abre um portal para o Plano ' +
      'Astral, no ponto em que um foi posto dentro do outro. Toda criatura a até 3 m do portal que ' +
      'não esteja atrás de cobertura total é sugada para um lugar aleatório do Plano Astral. O ' +
      'portal então se fecha; é de mão única e não reabre.',
  },

  'Mithral Armor': {
    nome: 'Armadura de Mithral',
    texto:
      'Mithral é um metal leve e flexível, e a armadura feita dele pode ser usada por baixo de ' +
      'roupas comuns. Se a armadura normalmente dá desvantagem em testes de Destreza (Furtividade) ' +
      'ou exige um valor mínimo de Força, a versão de mithral não exige.',
  },

  'Mysterious Deck': {
    nome: 'Baralho Misterioso',
    texto:
      'Normalmente achado numa caixa ou bolsa, este baralho tem cartas de marfim ou pergaminho. A ' +
      'maioria dos baralhos (75%) tem treze cartas; alguns têm vinte e duas.\n\n' +
      'Antes de tirar, você tem de declarar quantas cartas pretende tirar, e então tirá-las ao ' +
      'acaso. Cartas tiradas além desse número não fazem efeito. Fora isso, assim que você tira uma ' +
      'carta a magia dela age. Cada carta tem de ser tirada no máximo 1 hora depois da anterior; se ' +
      'você não tirar o número declarado, as que faltam voam do baralho sozinhas e agem todas de ' +
      'uma vez. A carta tirada some — e, a não ser que seja o Louco ou o Bobo, reaparece no baralho, ' +
      'então dá para tirar a mesma carta duas vezes.\n\n' +
      'Equilíbrio. Você pode subir 2 num atributo, até o máximo de 22, desde que baixe 2 em outro. ' +
      'Não dá para baixar um atributo que já esteja em 5 ou menos. Você também pode escolher não ' +
      'mexer em nada, e aí a carta não faz efeito.\n' +
      'Cometa. No próximo combate contra criaturas Hostis, você pode escolher uma delas como seu ' +
      'inimigo ao rolar iniciativa. Se você mesmo o reduzir a 0 pontos de vida nesse combate, terá ' +
      'vantagem nas salvaguardas contra morte por 1 ano. Se outra pessoa o derrubar, ou se você não ' +
      'escolher inimigo, a carta não faz efeito.\n' +
      'Masmorra. Você some e fica sepultado em animação suspensa numa esfera extradimensional. Tudo ' +
      'o que você veste e carrega some junto, menos artefatos, que ficam no espaço que você ocupava. ' +
      'Você continua preso até ser encontrado e tirado de lá. Nenhuma magia de adivinhação localiza ' +
      'você, mas Desejo revela onde fica a prisão. Você não tira mais cartas.\n' +
      'Euríale. O rosto de medusa da carta amaldiçoa você: enquanto durar, você sofre −2 nas ' +
      'salvaguardas. Só um deus ou a magia da carta Destinos acaba com isso.\n' +
      'Destinos. A trama da realidade se desfia e se refaz, deixando você evitar ou apagar um ' +
      'acontecimento como se nunca tivesse ocorrido. Você pode usar a magia da carta na hora em que ' +
      'a tira ou a qualquer momento antes de morrer.\n' +
      'Chamas. Um diabo poderoso vira seu inimigo. Ele busca sua ruína e o atormenta, saboreando seu ' +
      'sofrimento antes de tentar matá-lo. A inimizade dura até um dos dois morrer.\n' +
      'Louco. Você tem desvantagem em testes de d20 pelas 72 horas seguintes. Tire outra carta; essa ' +
      'não conta entre as declaradas.\n' +
      'Gema. Vinte e cinco joias de 2.000 PO cada, ou cinquenta gemas de 1.000 PO cada, aparecem aos ' +
      'seus pés.\n' +
      'Bobo. Você tem vantagem em testes de d20 pelas 72 horas seguintes, ou pode tirar duas cartas ' +
      'a mais além das declaradas.\n' +
      'Chave. Uma arma mágica Rara ou mais rara com a qual você seja proficiente aparece com você. O ' +
      'Mestre escolhe qual.\n' +
      'Cavaleiro. Você ganha o serviço de um cavaleiro, que aparece por magia num espaço desocupado ' +
      'à sua escolha a até 9 m de você. Ele tem a mesma tendência que você e o serve com lealdade ' +
      'até a morte, acreditando que o destino uniu vocês dois.\n' +
      'Lua. Você ganha a capacidade de conjurar Desejo 1d3 vezes.\n' +
      'Enigma. Baixe permanentemente 1d4 + 1 na sua Inteligência ou Sabedoria (mínimo 1). Você pode ' +
      'tirar uma carta a mais além das declaradas.\n' +
      'Trapaceiro. Um NPC escolhido pelo Mestre fica Hostil com você. Você não sabe quem é até que ' +
      'ele ou outra pessoa revele. Nada menos que Desejo ou intervenção divina acaba com essa ' +
      'hostilidade.\n' +
      'Ruína. Toda forma de riqueza que você carrega ou possui, fora itens mágicos, se perde. Bens ' +
      'móveis somem; negócios, prédios e terras se perdem do jeito que menos altere a realidade. ' +
      'Qualquer documento que prove que aquilo era seu também some.\n' +
      'Sábio. A qualquer momento dentro de um ano depois de tirar a carta, você pode fazer uma ' +
      'pergunta em meditação e receber mentalmente uma resposta verdadeira.\n' +
      'Caveira. Um Avatar da Morte aparece no espaço desocupado mais perto de você e ataca só você, ' +
      'na forma de um esqueleto fantasmagórico de manto negro esfarrapado e foice espectral. Ele ' +
      'some quando cai a 0 pontos de vida ou quando você morre. Se um aliado seu causar dano ao ' +
      'avatar, esse aliado invoca outro Avatar da Morte, que aparece perto dele e ataca só ele. Cada ' +
      'um só pode invocar um avatar por causa desta carta. Quem é morto por um avatar não pode ser ' +
      'trazido de volta à vida.\n' +
      'Estrela. Suba 2 num atributo, até o máximo de 24.\n' +
      'Sol. Um item mágico escolhido pelo Mestre aparece com você. Além disso, você ganha 10 pontos ' +
      'de vida temporários todo amanhecer, até morrer.\n' +
      'Garras. Todo item mágico que você veste ou carrega se desintegra. Artefatos em sua posse ' +
      'somem em vez de se desintegrar.\n' +
      'Trono. Você ganha proficiência e especialização em História, Intuição, Intimidação ou ' +
      'Persuasão, à sua escolha. Além disso, passa a ser dono legítimo de uma pequena fortaleza em ' +
      'algum lugar do mundo — que no momento está ocupada por um ou mais monstros, e precisa ser ' +
      'limpa antes de você poder reivindicá-la.\n' +
      'Vazio. Sua alma é arrancada do corpo e guardada num objeto, num lugar escolhido pelo Mestre e ' +
      'guardado por um ou mais seres poderosos. Enquanto isso, seu corpo fica inerte, para de ' +
      'envelhecer e não precisa de comida, ar ou água. Desejo não devolve sua alma, mas revela onde ' +
      'está o objeto que a guarda. Você não tira mais cartas.',
  },
}
