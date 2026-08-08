// Itens do SRD que começam com P e Q.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const PQ: Record<string, TraducaoDeItem> = {
  'Pearl of Power': {
    nome: 'Pérola do Poder',
    texto:
      'Com esta pérola em sua posse, você pode usar a ação Magia para recuperar um espaço de magia ' +
      'gasto de 3º círculo ou menor. Depois de usada, ela só serve de novo no amanhecer seguinte.',
  },

  'Periapt of Health': {
    nome: 'Amuleto da Saúde',
    texto:
      'Vestindo este pingente, você pode usar a ação Magia para recuperar 2d4 + 2 pontos de vida. ' +
      'Depois de usada, esta propriedade só volta no amanhecer seguinte. Além disso, você tem ' +
      'vantagem nas salvaguardas para evitar ou encerrar a condição Envenenado enquanto o veste.',
  },

  'Periapt of Proof against Poison': {
    nome: 'Amuleto à Prova de Veneno',
    texto:
      'Esta corrente delicada de prata tem um pingente de gema negra em lapidação brilhante. ' +
      'Vestindo-a, você tem Imunidade à condição Envenenado e a dano de veneno.',
  },

  'Periapt of Wound Closure': {
    nome: 'Amuleto do Fechamento de Feridas',
    texto:
      'Vestindo este pingente, você ganha:\n\n' +
      'Preservação da Vida. Sempre que fizer uma salvaguarda contra morte, você pode trocar uma ' +
      'rolagem de 9 ou menos por 10, transformando a falha em sucesso.\n' +
      'Cura Natural Reforçada. Sempre que rolar um dado de vida para recuperar pontos de vida, ' +
      'dobre o que ele devolve.',
  },

  'Philter of Love': {
    nome: 'Filtro do Amor',
    texto:
      'Na próxima vez que você vir uma criatura nos 10 minutos seguintes a beber este filtro, você ' +
      'se apaixona por ela e fica com a condição Enfeitiçado por 1 hora. Este líquido rosado e ' +
      'efervescente tem uma bolha, fácil de não notar, em forma de coração.',
  },

  'Pipes of Haunting': {
    nome: 'Flautas Assombrosas',
    texto:
      'Estas flautas têm 3 cargas e recuperam 1d3 gastas todo amanhecer. Você pode usar a ação Magia ' +
      'para tocá-las e gastar 1 carga, criando uma melodia sinistra e cativante. Cada criatura à sua ' +
      'escolha a até 9 m de você faz uma salvaguarda de Sabedoria CD 15 ou fica com a condição ' +
      'Apavorado por 1 minuto, repetindo a salvaguarda no fim de cada turno dela. Quem passa fica ' +
      'imune ao efeito destas flautas por 24 horas.',
  },

  'Pipes of the Sewers': {
    nome: 'Flautas dos Esgotos',
    texto:
      'Com estas flautas em sua posse, ratos comuns e ratos gigantes ficam Indiferentes a você e não ' +
      'atacam a não ser que você os ameace ou machuque.\n\n' +
      'As flautas têm 3 cargas e recuperam 1d3 gastas todo amanhecer. Tocando-as com a ação Magia, ' +
      'você pode usar uma ação bônus para gastar de 1 a 3 cargas, chamando um enxame de ratos por ' +
      'carga gasta — desde que haja ratos suficientes a até 800 m de você, o que o Mestre decide. ' +
      'Sem ratos bastantes para formar um enxame, a carga se perde. Os enxames chamados vêm em ' +
      'direção à música pelo caminho mais curto, mas fora isso não ficam sob seu controle.\n\n' +
      'Sempre que um enxame de ratos que não esteja sob controle de outra criatura chegar a até 9 m ' +
      'de você enquanto você toca, ele faz uma salvaguarda de Sabedoria CD 15. Se passar, se comporta ' +
      'como de costume e não pode ser influenciado pela música por 24 horas. Se falhar, fica Amistoso ' +
      'com você e seus aliados enquanto você continuar tocando a cada rodada com a ação Magia. Um ' +
      'enxame Amistoso obedece às suas ordens; sem ordens, se defende e não faz mais nada. Se um ' +
      'enxame Amistoso começar o turno a mais de 9 m de você, seu controle acaba e ele não pode ser ' +
      'influenciado pela música por 24 horas.',
  },

  'Plate Armor of Etherealness': {
    nome: 'Armadura de Placas da Eterealidade',
    texto:
      'Vestindo esta armadura, você pode usar a ação Magia e uma palavra de comando para ganhar o ' +
      'efeito da magia Eterealidade. O efeito acaba na hora se você tirar a armadura ou usar a ação ' +
      'Magia para repetir a palavra. Esta propriedade só volta a funcionar no amanhecer seguinte.',
  },

  'Portable Hole': {
    nome: 'Buraco Portátil',
    texto:
      'Este pano preto e fino, macio como seda, fica dobrado do tamanho de um lenço e se desdobra ' +
      'num círculo de 1,8 m de diâmetro. Você pode usar a ação Magia para desdobrá-lo e encostá-lo ' +
      'numa superfície sólida, onde ele cria um buraco extradimensional de 3 m de profundidade.\n\n' +
      'O espaço cilíndrico do buraco fica em outro plano de existência, então ele não serve para ' +
      'abrir passagens. Quem estiver dentro de um buraco aberto pode sair escalando.\n\n' +
      'Você pode usar a ação Magia para fechá-lo, pegando as bordas do pano e dobrando: o buraco se ' +
      'fecha, e criaturas ou objetos que estiverem lá dentro continuam no espaço extradimensional. ' +
      'Não importa o que tenha dentro, o buraco não pesa praticamente nada.\n\n' +
      'Com o pano dobrado, quem está no espaço extradimensional pode usar uma ação para fazer um ' +
      'teste de Força (Atletismo) CD 10 e forçar a saída, aparecendo a até 1,5 m do Buraco Portátil. ' +
      'Fechado, ele guarda ar para 1 hora de respiração dividida pelo número de criaturas lá ' +
      'dentro.\n\n' +
      'Colocar um Buraco Portátil dentro de um espaço extradimensional criado por um Saco de ' +
      'Guardados, uma Mochila Prática ou item parecido destrói os dois na hora e abre um portal para ' +
      'o Plano Astral, no ponto em que um foi posto dentro do outro. Toda criatura a até 3 m do ' +
      'portal que não esteja atrás de cobertura total é sugada e depositada num lugar aleatório do ' +
      'Plano Astral. O portal então se fecha; é de mão única e não reabre.',
  },

  'Potion of Animal Friendship': {
    nome: 'Poção da Amizade Animal',
    texto:
      'Ao beber esta poção, você pode conjurar a versão de 3º círculo de Amizade Animal (CD 13). ' +
      'Agitar este líquido barrento faz aparecerem pedacinhos: uma escama de peixe, uma pena de ' +
      'beija-flor, uma garra de gato, um pelo de esquilo.',
  },

  'Potion of Clairvoyance': {
    nome: 'Poção da Clarividência',
    texto:
      'Ao beber esta poção, você ganha o efeito da magia Clarividência, sem precisar de ' +
      'concentração. Um globo ocular boia no líquido amarelado, mas some quando a poção é aberta.',
  },

  'Potion of Climbing': {
    nome: 'Poção da Escalada',
    texto:
      'Ao beber esta poção, você ganha deslocamento de escalada igual ao seu deslocamento por 1 ' +
      'hora. Nesse tempo, você tem vantagem em testes de Força (Atletismo) para escalar. A poção se ' +
      'separa em camadas marrom, prata e cinza, parecendo faixas de pedra; sacudir o frasco não ' +
      'mistura as cores.',
  },

  'Potion of Diminution': {
    nome: 'Poção da Diminuição',
    texto:
      'Ao beber esta poção, você ganha o efeito de encolher da magia Aumentar/Reduzir por 1d4 horas, ' +
      'sem precisar de concentração. O vermelho do líquido se contrai numa bolinha e volta a se ' +
      'espalhar pelo líquido transparente ao redor, sem parar; sacudir o frasco não interrompe isso.',
  },

  'Potion of Flying': {
    nome: 'Poção do Voo',
    texto:
      'Ao beber esta poção, você ganha deslocamento de voo igual ao seu deslocamento por 1 hora e ' +
      'consegue pairar. Se estiver no ar quando o efeito acabar, você cai, a não ser que tenha outro ' +
      'jeito de se manter no alto. O líquido transparente boia no alto do frasco, com impurezas ' +
      'brancas e turvas à deriva.',
  },

  'Potion of Gaseous Form': {
    nome: 'Poção da Forma Gasosa',
    texto:
      'Ao beber esta poção, você ganha o efeito da magia Forma Gasosa por 1 hora, sem precisar de ' +
      'concentração, ou até encerrá-lo com uma ação bônus. O frasco parece conter uma névoa que se ' +
      'mexe e escorre como água.',
  },

  'Potion of Giant Strength': {
    nome: 'Poção de Força de Gigante',
    texto:
      'Ao beber esta poção, sua Força muda por 1 hora. O tipo de gigante determina o valor: colina ' +
      '21 (Incomum), gelo ou pedra 23 (Raro), fogo 25 (Raro), nuvem 27 (Muito raro), tempestade 29 ' +
      '(Lendário). Não faz efeito se a sua Força já for igual ou maior. No líquido transparente boia ' +
      'uma lasca de luz parecida com a unha de um gigante.',
  },

  'Potion of Growth': {
    nome: 'Poção do Crescimento',
    texto:
      'Ao beber esta poção, você ganha o efeito de aumentar da magia Aumentar/Reduzir por 10 ' +
      'minutos, sem precisar de concentração. O vermelho do líquido se espalha de uma bolinha até ' +
      'colorir o líquido transparente ao redor e depois se contrai, sem parar; sacudir o frasco não ' +
      'interrompe isso.',
  },

  'Potions of Healing': {
    nome: 'Poções de Cura',
    texto:
      'Você recupera pontos de vida ao beber esta poção. Quantos depende da raridade dela, na tabela ' +
      'do SRD: Poção de Cura, 2d4 + 2 (Comum); Cura Maior, 4d4 + 4 (Incomum); Cura Superior, 8d4 + 8 ' +
      '(Raro); Cura Suprema, 10d4 + 20 (Muito raro). Seja qual for a potência, o líquido vermelho ' +
      'cintila quando agitado.',
  },

  'Potion of Heroism': {
    nome: 'Poção do Heroísmo',
    texto:
      'Ao beber esta poção, você ganha 10 pontos de vida temporários que duram 1 hora. Pelo mesmo ' +
      'tempo, você fica sob o efeito da magia Bênção, sem precisar de concentração. O líquido azul ' +
      'borbulha e solta vapor como se estivesse fervendo.',
  },

  'Potion of Invisibility': {
    nome: 'Poção da Invisibilidade',
    texto:
      'O frasco parece vazio, mas dá a sensação de conter líquido. Ao beber a poção, você fica com a ' +
      'condição Invisível por 1 hora. O efeito acaba antes se você fizer uma rolagem de ataque, ' +
      'causar dano ou conjurar uma magia.',
  },

  'Potion of Invulnerability': {
    nome: 'Poção da Invulnerabilidade',
    texto:
      'Por 1 minuto depois de beber esta poção, você tem Resistência a todo tipo de dano. O líquido ' +
      'xaroposo parece ferro derretido.',
  },

  'Potion of Longevity': {
    nome: 'Poção da Longevidade',
    texto:
      'Ao beber esta poção, sua idade física diminui 1d6 + 6 anos, até o mínimo de 13 anos. Cada vez ' +
      'que você bebe outra Poção da Longevidade depois desta, há uma chance cumulativa de 10% de o ' +
      'efeito se inverter e você envelhecer 1d6 + 6 anos. Boiando no líquido âmbar há um coração ' +
      'minúsculo que, contra toda razão, ainda bate — e some quando a poção é aberta.',
  },

  'Potion of Mind Reading': {
    nome: 'Poção da Leitura Mental',
    texto:
      'Ao beber esta poção, você ganha o efeito da magia Detectar Pensamentos (CD 13) por 10 ' +
      'minutos, sem precisar de concentração. O líquido roxo e denso tem uma nuvem oval cor-de-rosa ' +
      'boiando dentro.',
  },

  'Potion of Poison': {
    nome: 'Poção de Veneno',
    texto:
      'Esta beberagem parece, cheira e tem gosto de Poção de Cura ou de outra poção benéfica. Na ' +
      'verdade é veneno mascarado por ilusão, e a magia Identificação revela a natureza dela. Se ' +
      'você beber, sofre 4d6 de dano de veneno e faz uma salvaguarda de Constituição CD 13 ou fica ' +
      'com a condição Envenenado por 1 hora.',
  },

  'Potion of Resistance': {
    nome: 'Poção da Resistência',
    texto:
      'Ao beber esta poção, você tem Resistência a um tipo de dano por 1 hora. O Mestre escolhe o ' +
      'tipo ou sorteia na tabela do SRD.',
  },

  'Potion of Speed': {
    nome: 'Poção da Velocidade',
    texto:
      'Ao beber esta poção, você ganha o efeito da magia Pressa por 1 minuto, sem precisar de ' +
      'concentração e sem a onda de letargia que costuma vir quando o efeito acaba. O fluido amarelo ' +
      'é riscado de preto e roda sozinho.',
  },

  'Potion of Vitality': {
    nome: 'Poção do Vigor',
    texto:
      'Ao beber esta poção, ela tira todos os seus níveis de exaustão e encerra a condição ' +
      'Envenenado em você. Pelas 24 horas seguintes, você recupera o máximo de pontos de vida de ' +
      'cada dado de vida que gastar. O líquido carmesim pulsa com uma luz fraca em intervalos ' +
      'regulares, lembrando uma batida de coração.',
  },

  'Potion of Water Breathing': {
    nome: 'Poção da Respiração Aquática',
    texto:
      'Você respira debaixo d’água por 24 horas depois de beber esta poção. O fluido verde e turvo ' +
      'cheira a mar e tem uma bolha parecida com uma água-viva boiando dentro.',
  },

  'Quarterstaff of the Acrobat': {
    nome: 'Bordão do Acrobata',
    texto:
      'Você recebe +2 nas rolagens de ataque e de dano feitas com esta arma mágica.\n\n' +
      'Segurando-a, você pode fazê-la emitir luz fraca verde a até 3 m, com uma ação bônus ou logo ' +
      'depois de rolar iniciativa, e apagar a luz com uma ação bônus. Também pode usar uma ação ' +
      'bônus para mudar a forma dela: um bastão de 15 cm (fácil de guardar), uma vara de 3 m, ou de ' +
      'volta ao bordão — ela só se estica até onde o espaço ao redor permitir.\n\n' +
      'Auxílio Acrobático (só nas formas de bordão e vara de 3 m). Segurando a arma, você tem ' +
      'vantagem em testes de Destreza (Acrobacia).\n\n' +
      'Desvio de Ataque (só na forma de bordão). Quando você é acertado por um ataque segurando a ' +
      'arma, pode usar uma reação para girá-la ao seu redor e ganhar +5 na Classe de Armadura contra ' +
      'aquele ataque, o que pode fazê-lo errar. Só volta a funcionar depois de um descanso curto ou ' +
      'longo.\n\n' +
      'Arma à Distância (só na forma de bordão). A arma tem a propriedade Arremesso, com alcance ' +
      'normal de 9 m e longo de 36 m. Logo depois de um ataque à distância com ela, volta voando ' +
      'para a sua mão.',
  },
}
