// Itens do SRD que começam com I, J e L.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const IL: Record<string, TraducaoDeItem> = {
  'Immovable Rod': {
    nome: 'Bastão Imóvel',
    texto:
      'Este bastão de ferro tem um botão numa ponta. Você pode usar a ação Utilizar para apertá-lo, ' +
      'o que trava o bastão no lugar por magia. Até você ou outra criatura usar a ação Utilizar para ' +
      'apertar de novo, ele não se move — nem que isso desafie a gravidade. Aguenta até 3.600 kg; ' +
      'mais que isso o desliga e ele cai. Uma criatura pode usar a ação Utilizar para fazer um teste ' +
      'de Força (Atletismo) CD 30 e empurrar o bastão travado até 3 m.',
  },

  'Instant Fortress': {
    nome: 'Fortaleza Instantânea',
    texto:
      'Com a ação Magia, você pode pôr esta estatueta de adamante de 2,5 cm no chão e, com uma ' +
      'palavra de comando, fazê-la crescer depressa numa torre quadrada de adamante. Repetir a ' +
      'palavra faz a torre voltar a ser estatueta, o que só funciona se ela estiver vazia. Cada ' +
      'criatura na área onde a torre aparece é empurrada para um espaço desocupado ao lado dela; ' +
      'objetos que ninguém esteja vestindo ou carregando também são empurrados para fora.\n\n' +
      'A torre tem 6 m de lado por 9 m de altura, com seteiras em todos os lados e ameias no topo. ' +
      'Por dentro se divide em dois andares ligados por escada de mão, escadaria ou rampa, à sua ' +
      'escolha, que termina num alçapão para o telhado. Ao ser criada, tem uma única porta no nível ' +
      'do chão, do lado voltado para você; ela só abre ao seu comando, dado com uma ação bônus, e é ' +
      'imune a Destrancar e magias parecidas. A magia impede a torre de ser tombada.\n\n' +
      'O telhado, a porta e as paredes têm CA 20 e 100 pontos de vida cada, Imunidade a dano ' +
      'contundente, perfurante e cortante — menos o de equipamento de cerco — e Resistência a todo o ' +
      'resto. Encolher a torre não conserta o dano; só a magia Desejo repara a torre, e cada ' +
      'conjuração devolve todos os pontos de vida dela.',
  },

  'Ioun Stone': {
    nome: 'Pedra Ioun',
    texto:
      'Do tamanho de uma bola de gude, as Pedras Ioun levam o nome de Ioun, um deus do conhecimento ' +
      'e da profecia venerado em alguns mundos. Existem muitos tipos, cada um com forma e cor ' +
      'próprias.\n\n' +
      'Quando você usa a ação Magia para jogar uma Pedra Ioun no ar, ela passa a orbitar sua cabeça ' +
      'a 30 ou 90 cm de distância, dando o benefício dela enquanto orbita. Você pode ter até três ' +
      'orbitando ao mesmo tempo, e cada uma conta como um objeto que você veste. A pedra em órbita ' +
      'evita contato com criaturas e objetos, ajustando o percurso para não bater e frustrando ' +
      'tentativas de atacá-la ou agarrá-la. Com a ação Utilizar, você pode pegar e guardar quantas ' +
      'quiser. Se a sintonia acabar enquanto uma orbita, ela cai como se você a tivesse deixado ' +
      'cair.\n\n' +
      'O tipo decide a raridade e o efeito:\n\n' +
      'Absorção (Muito raro). Elipsoide lilás-claro. Você pode usar uma reação para cancelar uma ' +
      'magia de 4º círculo ou menor conjurada por alguém que você veja. A magia cancelada não faz ' +
      'efeito, e o que foi gasto nela se perde. Depois de cancelar 20 círculos de magia, a pedra se ' +
      'queima, fica cinza e perde a magia.\n' +
      'Agilidade (Muito raro). Esfera vermelho-escura. Sua Destreza sobe 2, até o máximo de 20.\n' +
      'Atenção (Raro). Romboide azul-escuro. Você tem vantagem em rolagens de iniciativa e em testes ' +
      'de Sabedoria (Percepção).\n' +
      'Fortitude (Muito raro). Romboide rosa. Sua Constituição sobe 2, até o máximo de 20.\n' +
      'Absorção Maior (Lendário). Elipsoide marmorizado lilás e verde. Como a Absorção, mas cancela ' +
      'magias de até 8º círculo.\n' +
      'Intuição (Muito raro). Esfera azul incandescente. Sua Sabedoria sobe 2, até o máximo de 20.\n' +
      'Intelecto (Muito raro). Esfera marmorizada escarlate e azul. Sua Inteligência sobe 2, até o ' +
      'máximo de 20.\n' +
      'Liderança (Muito raro). Esfera marmorizada rosa e verde. Seu Carisma sobe 2, até o máximo de ' +
      '20.\n' +
      'Maestria (Lendário). Prisma verde-claro. Seu bônus de proficiência sobe 1.\n' +
      'Proteção (Raro). Prisma rosa-empoeirado. Você recebe +1 na Classe de Armadura.\n' +
      'Regeneração (Lendário). Fuso branco-perolado. Você recupera 15 pontos de vida ao fim de cada ' +
      'hora em que ela orbitar, desde que tenha ao menos 1 ponto de vida.\n' +
      'Reserva (Raro). Prisma roxo vibrante. Guarda magias conjuradas nela até você usá-las, até 4 ' +
      'círculos de cada vez; quando achada, tem 1d4 círculos guardados escolhidos pelo Mestre. ' +
      'Qualquer criatura pode conjurar uma magia de 1º a 4º círculo na pedra tocando-a durante a ' +
      'conjuração — a magia não faz efeito, só fica guardada; se não couber, ela se gasta à toa. ' +
      'Enquanto a pedra orbita, você pode conjurar qualquer magia guardada, usando o círculo, a CD, ' +
      'o bônus de ataque e o atributo de conjuração de quem a guardou, mas no mais como se você ' +
      'tivesse conjurado. A magia sai da pedra e libera o espaço.\n' +
      'Força (Muito raro). Romboide azul-claro. Sua Força sobe 2, até o máximo de 20.\n' +
      'Sustento (Raro). Fuso transparente. Você não precisa comer nem beber.',
  },

  'Iron Bands': {
    nome: 'Correias de Ferro',
    texto:
      'Esta esfera enferrujada tem uns 7,5 cm de diâmetro e pesa 500 g. Você pode usar a ação Magia ' +
      'para atirá-la numa criatura de tamanho Enorme ou menor que você veja a até 18 m. No ar, a ' +
      'esfera se abre num emaranhado de correias de metal. Faça uma rolagem de ataque à distância ' +
      'com bônus igual ao seu modificador de Destreza mais o bônus de proficiência. Se acertar, o ' +
      'alvo fica com a condição Contido até você usar uma ação bônus para dar a ordem que o solta. ' +
      'Soltar o alvo, ou errar o ataque, faz as correias se recolherem em esfera de novo.\n\n' +
      'Uma criatura que consiga tocar as correias, inclusive a que está presa, pode usar uma ação ' +
      'para fazer um teste de Força (Atletismo) CD 20 e arrebentá-las: se passar, o item é destruído ' +
      'e a criatura se solta; se falhar, todas as tentativas seguintes dela falham automaticamente ' +
      'por 24 horas. Depois de usadas, as correias só servem de novo no amanhecer seguinte.',
  },

  'Iron Flask': {
    nome: 'Frasco de Ferro',
    texto:
      'Segurando este frasco de ferro com rolha de latão, você pode usar a ação Magia para mirar uma ' +
      'criatura que veja a até 18 m. Se o frasco estiver vazio e o alvo for nativo de outro plano ' +
      'que não aquele em que você está, ele faz uma salvaguarda de Sabedoria CD 17 ou fica preso ' +
      'dentro. Quem já foi preso pelo frasco antes tem vantagem na salvaguarda. Preso, fica lá até ' +
      'ser solto, e o frasco só comporta uma criatura por vez. Quem está preso não envelhece nem ' +
      'precisa respirar, comer ou beber.\n\n' +
      'Você pode usar a ação Magia para tirar a rolha e soltar a criatura. Ela obedece às suas ' +
      'ordens por 1 hora, entendendo-as mesmo sem saber o idioma. Se você não der ordem nenhuma, ou ' +
      'der uma que provavelmente a leve à morte ou à prisão, ela se defende mas não faz mais nada. ' +
      'Terminada a hora, age conforme a própria natureza e tendência.\n\n' +
      'A magia Identificação revela se há uma criatura no frasco, mas o único jeito de saber qual é ' +
      'abrindo. Um Frasco de Ferro recém-achado pode já vir com uma criatura escolhida pelo Mestre.',
  },

  'Javelin of Lightning': {
    nome: 'Azagaia do Relâmpago',
    texto:
      'Cada vez que você acerta uma rolagem de ataque com esta arma mágica, pode fazer com que ela ' +
      'cause dano elétrico em vez de perfurante.\n\n' +
      'Relâmpago. Ao arremessar a arma num alvo a até 36 m de você, pode abrir mão da rolagem de ' +
      'ataque e transformá-la num relâmpago. Ele forma uma Linha de 1,5 m de largura entre você e o ' +
      'alvo. O alvo e cada outra criatura na Linha, menos você, fazem uma salvaguarda de Destreza ' +
      'CD 13 e sofrem 4d6 de dano elétrico se falharem, ou metade se passarem. Logo depois de causar ' +
      'o dano, a arma reaparece na sua mão. Esta propriedade só volta a funcionar no amanhecer ' +
      'seguinte.',
  },

  'Lantern of Revealing': {
    nome: 'Lanterna Reveladora',
    texto:
      'Acesa, esta lanterna com viseira queima por 6 horas com meio litro de óleo, lançando luz ' +
      'plena num raio de 9 m e luz fraca por mais 9 m. Criaturas e objetos invisíveis ficam ' +
      'visíveis enquanto estiverem na luz plena dela. Você pode usar a ação Utilizar para baixar a ' +
      'viseira, reduzindo a luz a luz fraca num raio de 1,5 m.',
  },

  'Luck Blade': {
    nome: 'Lâmina da Sorte',
    texto:
      'Você recebe +1 nas rolagens de ataque e de dano feitas com esta arma mágica. Com ela em sua ' +
      'posse, você também recebe +1 nas salvaguardas.\n\n' +
      'Sorte. Com a arma em sua posse, você pode recorrer à sorte dela (sem gastar ação) para ' +
      'rolar de novo um teste de d20 que falhou, desde que não esteja com a condição Incapacitado. ' +
      'Você tem de ficar com a segunda rolagem. Depois de usada, esta propriedade só volta no ' +
      'amanhecer seguinte.\n\n' +
      'Desejo. A arma tem 1d3 cargas. Segurando-a, você pode gastar 1 carga e conjurar Desejo com ' +
      'ela. Depois de usada, esta propriedade só volta no amanhecer seguinte. A arma perde esta ' +
      'propriedade quando fica sem cargas.',
  },
}
