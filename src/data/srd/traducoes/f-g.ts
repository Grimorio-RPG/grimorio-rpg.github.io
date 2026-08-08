// Itens do SRD que começam com F e G.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const FG: Record<string, TraducaoDeItem> = {
  'Feather Token': {
    nome: 'Ficha de Pena',
    texto:
      'Este objeto parece uma pena. Existem vários tipos, cada um com um efeito de uso único. O ' +
      'Mestre escolhe o tipo ou sorteia; o tipo determina a raridade.\n\n' +
      'Âncora (Incomum). Com a ação Magia, você encosta a ficha num barco ou navio. Pelas 24 horas ' +
      'seguintes, a embarcação não pode ser movida por meio nenhum. Encostar de novo encerra o ' +
      'efeito, e a ficha some.\n\n' +
      'Ave (Raro). Com a ação Magia, você joga a ficha 1,5 m para cima. Ela some e no lugar surge ' +
      'uma ave enorme e multicolorida, com as estatísticas de um roca, mas incapaz de atacar. Ela ' +
      'obedece a ordens simples e carrega até 225 kg voando à velocidade máxima (26 km/h, até 230 ' +
      'km por dia, com 1 hora de descanso a cada 3 de voo), ou 450 kg na metade dessa velocidade. ' +
      'A ave some depois de voar a distância máxima do dia ou se cair a 0 pontos de vida. Você pode ' +
      'dispensá-la com a ação Magia.\n\n' +
      'Leque (Incomum). Estando num barco ou navio, você pode usar a ação Magia para jogar a ficha ' +
      'até 3 m para cima. Ela some e vira um leque gigante que se abana sozinho, criando um vento ' +
      'forte. Esse vento enche as velas de um navio e aumenta a velocidade dele em 8 km/h por 8 ' +
      'horas. Você pode dispensá-lo com a ação Magia.\n\n' +
      'Barco-Cisne (Raro). Com a ação Magia, você encosta a ficha num corpo d’água de pelo menos 18 ' +
      'm de diâmetro. Ela some e vira um barco em forma de cisne, de 15 m de comprimento por 6 m de ' +
      'largura. O barco se move sozinho pela água a 10 km/h. A bordo, você pode usar a ação Magia ' +
      'para mandá-lo andar ou virar até 90 graus. Ele fica por 24 horas e some; você também pode ' +
      'dispensá-lo com a ação Magia.\n\n' +
      'Árvore (Incomum). Você precisa estar ao ar livre. Com a ação Magia, você encosta a ficha num ' +
      'espaço desocupado do chão. Ela some e no lugar cresce um carvalho comum de 18 m de altura, ' +
      'tronco de 1,5 m de diâmetro e copa de 6 m de raio.\n\n' +
      'Chicote (Raro). Com a ação Magia, você joga a ficha num ponto a até 3 m de você. Ela some e ' +
      'vira um chicote flutuante. Você pode então usar uma ação bônus para fazer um ataque de magia ' +
      'corpo a corpo contra uma criatura a até 3 m do chicote, com +9 de bônus; se acertar, causa ' +
      '1d6 + 5 de dano de força. Com uma ação bônus, você pode mandar o chicote voar até 6 m e ' +
      'repetir o ataque. Ele some depois de 1 hora, quando você o dispensa com a ação Magia, ou ' +
      'quando você morre ou fica com a condição Incapacitado.',
  },

  'Figurine of Wondrous Power': {
    nome: 'Estatueta do Poder Maravilhoso',
    texto:
      'É uma estatueta pequena o bastante para caber no bolso. Se você usar a ação Magia para ' +
      'jogá-la num ponto do chão a até 18 m de você, ela vira a criatura viva descrita abaixo. Se o ' +
      'espaço estiver ocupado por criaturas ou objetos, ou se não houver espaço suficiente, ela não ' +
      'se transforma.\n\n' +
      'A criatura é Amistosa com você e seus aliados, entende seus idiomas, obedece às suas ordens ' +
      'e age logo depois de você na iniciativa. Sem ordens, ela se defende e não faz mais nada. ' +
      'Existe pelo tempo próprio de cada estatueta e depois volta à forma de estatueta — ou antes, ' +
      'se cair a 0 pontos de vida, ou se você usar a ação Magia tocando nela. Depois de voltar, a ' +
      'propriedade só serve de novo depois do intervalo de cada uma.\n\n' +
      'Grifo de Bronze (Raro). Vira um grifo por até 6 horas. Depois de usada, só serve de novo em ' +
      '5 dias.\n\n' +
      'Mosca de Ébano (Raro). Vira uma mosca gigante por até 12 horas e serve de montaria. Depois ' +
      'de usada, só serve de novo em 2 dias.\n\n' +
      'Leões Dourados (Raro). Vêm sempre em par; dá para usar um ou os dois ao mesmo tempo. Cada um ' +
      'vira um leão por até 1 hora. Depois de usado, cada leão só serve de novo em 7 dias.\n\n' +
      'Cabras de Marfim (Raro). Vêm sempre em trio, cada uma diferente da outra. A Cabra do Terror ' +
      'vira uma cabra gigante por até 3 horas; ela não ataca, mas você pode arrancar os chifres dela ' +
      '(sem machucá-la) e usá-los como armas — um vira uma Lança de Cavalaria +1 e o outro uma ' +
      'Espada Longa +2, e ambos somem quando ela volta a ser estatueta. Montado nela, toda criatura ' +
      'Hostil que começar o turno numa Emanação de 9 m a partir da cabra faz uma salvaguarda de ' +
      'Sabedoria CD 15 ou fica com a condição Apavorado por 1 minuto, repetindo a salvaguarda no fim ' +
      'de cada turno dela. Depois de usada, só serve de novo em 15 dias. A Cabra da Viagem vira uma ' +
      'cabra Grande com as estatísticas de um cavalo de montaria; tem 24 cargas, e cada hora ou ' +
      'fração em forma de cabra gasta 1 — quando as cargas acabam, ela volta a ser estatueta e só ' +
      'serve de novo em 7 dias, quando recupera tudo. A Cabra da Provação vira uma cabra gigante ' +
      'por até 3 horas e só serve de novo em 30 dias.\n\n' +
      'Elefante de Mármore (Raro). Vira um elefante por até 24 horas. Depois de usada, só serve de ' +
      'novo em 7 dias.\n\n' +
      'Corcel de Obsidiana (Muito raro). Vira um pesadelo por até 24 horas; ele só luta para se ' +
      'defender. Depois de usado, só serve de novo em 5 dias. A cada uso há 10% de chance de ele ' +
      'ignorar suas ordens, inclusive a de voltar a ser estatueta — e se você montar nele enquanto ' +
      'estiver assim, os dois são levados na hora para um lugar aleatório do plano de Hades, onde ' +
      'ele volta à forma de estatueta.\n\n' +
      'Cão de Ônix (Raro). Vira um mastim por até 6 horas, com Inteligência 8, capaz de falar Comum ' +
      'e com percepção às cegas a 18 m. Depois de usado, só serve de novo em 7 dias.\n\n' +
      'Coruja de Serpentina (Raro). Vira uma coruja gigante por até 8 horas, que se comunica com ' +
      'você por telepatia a qualquer distância desde que estejam no mesmo plano. Depois de usada, ' +
      'só serve de novo em 2 dias.\n\n' +
      'Corvo de Prata (Incomum). Vira um corvo por até 12 horas. Depois de usado, só serve de novo ' +
      'em 2 dias. Em forma de corvo, permite que você conjure Mensageiro Animal nele.',
  },

  'Flame Tongue': {
    nome: 'Espada Flamejante',
    texto:
      'Segurando esta arma mágica, você pode usar uma ação bônus e uma palavra de comando para ' +
      'chamas engolfarem a parte que causa dano. As chamas lançam luz plena num raio de 12 m e luz ' +
      'fraca por mais 12 m. Em chamas, a arma causa 2d6 de dano de fogo extra ao acertar. O fogo ' +
      'dura até você usar outra ação bônus para repetir o comando, ou até largar, guardar ou ' +
      'embainhar a arma.',
  },

  'Folding Boat': {
    nome: 'Barco Dobrável',
    texto:
      'Este objeto parece uma caixa de madeira de 30 cm de comprimento por 15 de largura e 15 de ' +
      'fundo. Pesa 2 kg, boia, e pode ser aberta para guardar coisas. Tem três palavras de comando, ' +
      'cada uma exigindo a ação Magia:\n\n' +
      'Primeira palavra. A caixa se desdobra num bote a remo.\n' +
      'Segunda palavra. A caixa se desdobra numa chalupa.\n' +
      'Terceira palavra. O barco se dobra de volta em caixa, se não houver ninguém a bordo. O que ' +
      'não couber na caixa fica do lado de fora; o que couber entra.\n\n' +
      'Quando a caixa vira embarcação, o peso passa a ser o de uma embarcação normal daquele ' +
      'tamanho, e o que estava guardado continua a bordo. Se qualquer uma das embarcações cair a 0 ' +
      'pontos de vida, o Barco Dobrável é destruído.',
  },

  'Frost Brand': {
    nome: 'Lâmina do Gelo',
    texto:
      'Quando você acerta um ataque com esta arma mágica, o alvo sofre 1d6 de dano de frio extra. ' +
      'Além disso, enquanto você a segura, tem Resistência a dano de fogo. Em temperaturas ' +
      'congelantes, a arma lança luz plena num raio de 3 m e luz fraca por mais 3 m.\n\n' +
      'Ao sacar esta arma, você pode apagar todas as chamas não mágicas a até 9 m de você. Depois ' +
      'de usada, essa propriedade só volta em 1 hora.',
  },

  'Gauntlets of Ogre Power': {
    nome: 'Manoplas da Força do Ogro',
    texto:
      'Sua Força passa a 19 enquanto você veste estas manoplas. Não fazem efeito se a sua Força já ' +
      'for 19 ou mais sem elas.',
  },

  'Gem of Brightness': {
    nome: 'Gema do Fulgor',
    texto:
      'Este prisma tem 50 cargas. Segurando-o, você pode usar a ação Magia e uma de três palavras ' +
      'de comando:\n\n' +
      'Primeira palavra. A gema lança luz plena num raio de 9 m e luz fraca por mais 9 m. Não gasta ' +
      'carga, e dura até você usar uma ação bônus para repetir o comando ou até usar outra função ' +
      'da gema.\n' +
      'Segunda palavra. Gasta 1 carga e dispara um feixe brilhante contra uma criatura que você ' +
      'veja a até 18 m. Ela faz uma salvaguarda de Constituição CD 15 ou fica com a condição Cego ' +
      'por 1 minuto, repetindo a salvaguarda no fim de cada turno dela.\n' +
      'Terceira palavra. Gasta 5 cargas e faz a gema explodir em luz intensa num Cone de 9 m. Cada ' +
      'criatura no Cone faz a mesma salvaguarda do feixe.\n\n' +
      'Quando todas as cargas acabam, a gema vira uma joia comum que vale 50 PO.',
  },

  'Gem of Seeing': {
    nome: 'Gema da Visão',
    texto:
      'Esta gema tem 3 cargas. Com a ação Magia, você pode gastar 1 carga: pelos 10 minutos ' +
      'seguintes, você tem Visão Verdadeira a até 36 m quando olha através dela. A gema recupera ' +
      '1d3 cargas gastas todo amanhecer.',
  },

  'Giant Slayer': {
    nome: 'Matadora de Gigantes',
    texto:
      'Você recebe +1 nas rolagens de ataque e de dano feitas com esta arma mágica. Quando você ' +
      'acerta um gigante com ela, ele sofre 2d6 de dano extra do tipo da arma e faz uma salvaguarda ' +
      'de Força CD 15 ou fica com a condição Caído.',
  },

  'Glamoured Studded Leather': {
    nome: 'Couro Batido Encantado',
    texto:
      'Vestindo esta armadura, você recebe +1 na Classe de Armadura. Você também pode usar uma ação ' +
      'bônus para fazer a armadura tomar a aparência de roupas comuns ou de outro tipo de armadura. ' +
      'Você decide como fica — cor, corte, acessórios —, mas o volume e o peso continuam os mesmos. ' +
      'A aparência ilusória dura até você usar a propriedade de novo ou tirar a armadura.',
  },

  'Gloves of Missile Snaring': {
    nome: 'Luvas de Aparar Projéteis',
    texto:
      'Se você for acertado por um ataque de arma à distância ou de arremesso enquanto veste estas ' +
      'luvas, pode usar uma reação para reduzir o dano em 1d10 mais o seu modificador de Destreza, ' +
      'desde que tenha uma mão livre. Se reduzir o dano a 0, você pega a munição ou a arma, se ' +
      'couber nessa mão.',
  },

  'Gloves of Swimming and Climbing': {
    nome: 'Luvas de Nadar e Escalar',
    texto:
      'Vestindo estas luvas, você tem deslocamento de escalada e de natação iguais ao seu ' +
      'deslocamento, e recebe +5 em testes de Força (Atletismo) para escalar ou nadar.',
  },

  'Gloves of Thievery': {
    nome: 'Luvas de Roubo',
    texto:
      'Estas luvas não são percebidas enquanto vestidas. Usando-as, você recebe +5 em testes de ' +
      'Destreza (Prestidigitação).',
  },

  'Goggles of Night': {
    nome: 'Óculos da Noite',
    texto:
      'Vestindo estas lentes escuras, você tem visão no escuro a até 18 m. Se já tiver visão no ' +
      'escuro, os óculos aumentam o alcance dela em 18 m.',
  },
}
