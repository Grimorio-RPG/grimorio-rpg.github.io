// Mantos, bastões e cordas do SRD — o resto do R, fora os anéis.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const R_OUTROS: Record<string, TraducaoDeItem> = {
  'Robe of Eyes': {
    nome: 'Manto dos Olhos',
    texto:
      'Este manto é enfeitado com padrões que parecem olhos. Vestindo-o, você ganha:\n\n' +
      'Visão Total. Vantagem em testes de Sabedoria (Percepção) que dependam da visão.\n' +
      'Sentidos Especiais. Visão no escuro e Visão Verdadeira, ambas a até 36 m.\n\n' +
      'Desvantagens. A magia Luz conjurada no manto, ou Luz do Dia conjurada a até 1,5 m dele, deixa ' +
      'você com a condição Cego por 1 minuto. No fim de cada turno seu, faça uma salvaguarda de ' +
      'Constituição (CD 11 para Luz, CD 15 para Luz do Dia) para encerrar a condição em si mesmo.',
  },

  'Robe of Scintillating Colors': {
    nome: 'Manto das Cores Cintilantes',
    texto:
      'Este manto tem 3 cargas e recupera 1d3 gastas todo amanhecer. Vestindo-o, você pode usar a ' +
      'ação Magia e gastar 1 carga para a peça exibir um padrão mutante de cores ofuscantes até o ' +
      'fim do seu próximo turno.\n\n' +
      'Nesse tempo, o manto lança luz plena num raio de 9 m e luz fraca por mais 9 m, e quem vê você ' +
      'tem desvantagem nos ataques contra você. Toda criatura na luz plena que puder ver você quando ' +
      'o poder é ativado faz uma salvaguarda de Sabedoria CD 15 ou fica com a condição Atordoado até ' +
      'o efeito acabar.',
  },

  'Robe of Stars': {
    nome: 'Manto das Estrelas',
    texto:
      'Este manto preto ou azul-escuro é bordado com estrelinhas brancas ou prateadas. Você recebe ' +
      '+1 nas salvaguardas enquanto o veste.\n\n' +
      'Seis estrelas, na parte de cima da frente, são bem maiores. Vestindo o manto, você pode usar ' +
      'a ação Magia para arrancar uma delas e gastá-la para conjurar a versão de 5º círculo de ' +
      'Mísseis Mágicos. Todo anoitecer, 1d6 estrelas arrancadas reaparecem no manto.\n\n' +
      'Vestindo o manto, você também pode usar a ação Magia para entrar no Plano Astral com tudo o ' +
      'que veste e carrega. Você fica lá até usar a ação Magia para voltar ao plano em que estava, ' +
      'reaparecendo no último espaço que ocupou — ou, se estiver ocupado, no espaço desocupado mais ' +
      'próximo.',
  },

  'Robe of the Archmagi': {
    nome: 'Manto do Arquimago',
    texto:
      'Esta peça elegante é feita de tecido finíssimo e enfeitada com runas. Vestindo-a, você ' +
      'ganha:\n\n' +
      'Armadura. Sem armadura, sua Classe de Armadura base é 15 mais o seu modificador de Destreza.\n' +
      'Resistência a Magia. Vantagem nas salvaguardas contra magias e outros efeitos mágicos.\n' +
      'Mago de Guerra. Sua CD de magia e seu bônus de ataque mágico sobem 2 cada.',
  },

  'Robe of Useful Items': {
    nome: 'Manto dos Itens Úteis',
    texto:
      'Este manto é coberto de remendos de pano de várias formas e cores. Vestindo-o, você pode usar ' +
      'a ação Magia para arrancar um remendo, que vira o objeto ou a criatura que representa. Quando ' +
      'o último remendo sai, o manto vira uma peça comum.\n\n' +
      'O manto tem dois remendos de cada um destes: lanterna coberta (cheia e acesa), adaga, espelho, ' +
      'vara, corda (enrolada) e saco. Além desses, tem outros 4d4 remendos, que o Mestre escolhe ou ' +
      'sorteia na tabela do SRD.',
  },

  'Rod of Absorption': {
    nome: 'Bastão da Absorção',
    texto:
      'Segurando este bastão, você pode usar uma reação para absorver uma magia que mire só em você ' +
      'e não crie área de efeito. O efeito da magia é cancelado, e a energia dela — não a magia em si ' +
      '— fica guardada no bastão, com o mesmo círculo que a magia tinha ao ser conjurada. A magia ' +
      'cancelada se dissipa sem efeito, e o que foi gasto nela se perde.\n\n' +
      'O bastão pode absorver e guardar até 50 círculos de energia ao longo da existência dele; ' +
      'chegando lá, não absorve mais. Se você for alvo de uma magia que ele não consiga guardar, ele ' +
      'não faz nada com ela. Ao se sintonizar, você fica sabendo quantos círculos ele já absorveu na ' +
      'vida e quantos estão guardados agora.\n\n' +
      'Se você for conjurador e estiver segurando o bastão, pode converter a energia guardada em ' +
      'espaços de magia para conjurar magias que tenha preparadas ou conheça. Só dá para criar ' +
      'espaços de círculo igual ou menor que os seus, até o 5º no máximo. Por exemplo, 3 círculos ' +
      'guardados viram um espaço de 3º círculo.\n\n' +
      'Um bastão recém-achado costuma ter 1d10 círculos guardados. Um que não consiga mais absorver ' +
      'e esteja sem energia deixa de ser mágico.',
  },

  'Rod of Alertness': {
    nome: 'Bastão do Alerta',
    texto:
      'Alerta. Segurando o bastão, você tem vantagem em testes de Sabedoria (Percepção) e em ' +
      'rolagens de iniciativa.\n\n' +
      'Magias. Segurando o bastão, você pode conjurar com ele: Detectar o Bem e o Mal, Detectar ' +
      'Magia, Detectar Veneno e Doença, e Ver o Invisível.\n\n' +
      'Aura Protetora. Com a ação Magia, você pode fincar a ponta do cabo no chão, e a cabeça do ' +
      'bastão lança luz plena num raio de 18 m e luz fraca por mais 18 m. Dentro da luz plena, você ' +
      'e seus aliados recebem +1 na Classe de Armadura e nas salvaguardas, e sentem onde está ' +
      'qualquer criatura invisível que também esteja na luz plena. A cabeça para de brilhar e o ' +
      'efeito acaba depois de 10 minutos, ou quando alguém usa a ação Magia para arrancar o bastão ' +
      'do chão. Depois de usada, esta propriedade só volta no amanhecer seguinte.',
  },

  'Rod of Lordly Might': {
    nome: 'Bastão do Poder Senhorial',
    texto:
      'Este bastão tem uma cabeça de flanges e funciona como uma maça mágica que dá +3 nas rolagens ' +
      'de ataque e de dano feitas com ela. Tem seis botões enfileirados ao longo do cabo, além de ' +
      'outras três propriedades.\n\n' +
      'Botões. Você pode apertar um botão com uma ação bônus; o efeito dura até você apertar outro ' +
      'ou apertar o mesmo de novo, o que devolve o bastão à forma normal.\n' +
      'Botão 1. Uma lâmina flamejante brota da ponta oposta à cabeça. As chamas lançam luz plena num ' +
      'raio de 12 m e luz fraca por mais 12 m, e a lâmina funciona como uma espada longa ou curta ' +
      'mágica, à sua escolha, que causa 2d6 de dano de fogo extra ao acertar.\n' +
      'Botão 2. A cabeça se dobra e saltam duas lâminas em meia-lua, transformando o bastão num ' +
      'machado de batalha mágico com +3 nas rolagens de ataque e de dano.\n' +
      'Botão 3. A cabeça se dobra, uma ponta de lança salta e o cabo estica para 1,8 m, ' +
      'transformando o bastão numa lança mágica com +3 nas rolagens de ataque e de dano.\n' +
      'Botão 4. O bastão vira uma vara de escalada de até 15 m (você diz o comprimento), com os ' +
      'botões ainda ao seu alcance. Em superfícies tão duras quanto granito, um espigão embaixo e ' +
      'três ganchos em cima fixam a vara, e barras horizontais de 7,5 cm se abrem dos lados a cada ' +
      '30 cm, formando uma escada. A vara aguenta até 1.800 kg; mais que isso, ou falta de fixação ' +
      'firme, devolve o bastão à forma normal.\n' +
      'Botão 5. O bastão vira um aríete de mão e dá a quem o usa +10 em testes de Força (Atletismo) ' +
      'para arrombar portas, barricadas e outras barreiras.\n' +
      'Botão 6. O bastão assume ou mantém a forma normal e aponta o norte magnético (não acontece ' +
      'nada onde não houver norte magnético). Ele também informa a profundidade aproximada em que ' +
      'você está abaixo do solo, ou a altura acima dele.\n\n' +
      'Drenar Vida. Quando você acerta uma criatura com um ataque corpo a corpo usando o bastão, ' +
      'pode obrigá-la a fazer uma salvaguarda de Constituição CD 17. Se falhar, ela sofre 4d6 de ' +
      'dano necrótico extra e você recupera pontos de vida iguais à metade desse dano. Depois de ' +
      'usada, esta propriedade só volta no amanhecer seguinte.\n\n' +
      'Paralisar. Quando você acerta uma criatura com um ataque corpo a corpo usando o bastão, pode ' +
      'obrigá-la a fazer uma salvaguarda de Constituição CD 17. Se falhar, fica com a condição ' +
      'Paralisado por 1 minuto, repetindo a salvaguarda no fim de cada turno dela. Depois de usada, ' +
      'esta propriedade só volta no amanhecer seguinte.\n\n' +
      'Aterrorizar. Segurando o bastão, você pode usar a ação Magia para obrigar cada criatura que ' +
      'veja a até 9 m a fazer uma salvaguarda de Sabedoria CD 17. Quem falha fica com a condição ' +
      'Apavorado por 1 minuto, repetindo a salvaguarda no fim de cada turno. Depois de usada, esta ' +
      'propriedade só volta no amanhecer seguinte.',
  },

  'Rod of Resurrection': {
    nome: 'Bastão da Ressurreição',
    texto:
      'O bastão tem 5 cargas. Segurando-o, você pode conjurar com ele Curar (gasta 1 carga) ou ' +
      'Ressurreição (gasta 5 cargas). Ele recupera 1 carga gasta todo amanhecer. Se você gastar a ' +
      'última carga, role 1d20: num 1, o bastão some num clarão inofensivo.',
  },

  'Rod of Rulership': {
    nome: 'Bastão do Governo',
    texto:
      'Você pode usar a ação Magia para apresentar o bastão e exigir obediência de cada criatura à ' +
      'sua escolha que veja a até 36 m. Cada alvo faz uma salvaguarda de Sabedoria CD 15 ou fica com ' +
      'a condição Enfeitiçado por 8 horas. Enfeitiçada assim, a criatura vê você como um líder de ' +
      'confiança. Se você ou seus aliados a machucarem, ou se ela receber uma ordem contrária à ' +
      'natureza dela, o encanto acaba. Depois de usada, esta propriedade só volta no amanhecer ' +
      'seguinte.',
  },

  'Rod of Security': {
    nome: 'Bastão da Segurança',
    texto:
      'Segurando este bastão, você pode usar a ação Magia para ativá-lo. Ele então transporta na ' +
      'hora você e até 199 outras criaturas dispostas que você veja para um semiplano. Você escolhe ' +
      'a forma dele: um jardim tranquilo, uma taverna alegre, um palácio imenso, uma ilha tropical, ' +
      'um parque de diversões fantástico, o que você imaginar.\n\n' +
      'Seja qual for, o semiplano tem água e comida bastantes para sustentar os visitantes, e o ' +
      'ambiente não pode machucá-los. Todo o resto com que se possa interagir só existe lá dentro: ' +
      'uma flor colhida no jardim some se for levada para fora.\n\n' +
      'A cada hora passada lá, o visitante recupera pontos de vida como se tivesse gasto um dado de ' +
      'vida. Ninguém envelhece lá, embora o tempo passe normalmente. Os visitantes podem ficar até ' +
      '200 dias divididos pelo número de criaturas presentes, arredondando para baixo. Quando o ' +
      'tempo acaba, ou quando você usa a ação Magia para encerrar, todos reaparecem onde estavam ' +
      'quando o bastão foi ativado, ou no espaço desocupado mais próximo.\n\n' +
      'Depois de usada, esta propriedade só volta em 10 dias.',
  },

  'Rope of Climbing': {
    nome: 'Corda de Escalada',
    texto:
      'Esta corda de 18 m aguenta até 1.350 kg. Segurando uma ponta, você pode usar a ação Magia ' +
      'para mandar a outra ponta ganhar vida e ir até um destino à sua escolha, dentro do ' +
      'comprimento dela. Essa ponta anda 3 m no turno em que você dá a ordem e mais 3 m no começo de ' +
      'cada turno seu, até chegar ou até você mandar parar.\n\n' +
      'Você também pode mandar a corda se amarrar firme num objeto ou se soltar, dar ou desfazer nós, ' +
      'ou se enrolar para ser carregada. Com nós, aparecem nós grandes a cada 30 cm: a corda encurta ' +
      'para 15 m e dá vantagem em testes para escalar por ela.\n\n' +
      'A corda tem CA 20, 20 pontos de vida e Imunidade a dano de veneno e psíquico. Recupera 1 ' +
      'ponto de vida a cada 5 minutos, desde que tenha ao menos 1. Se chegar a 0, é destruída.',
  },

  'Rope of Entanglement': {
    nome: 'Corda do Enredamento',
    texto:
      'Esta corda tem 9 m. Segurando uma ponta, você pode usar a ação Magia para mandar a outra ' +
      'disparar e enredar uma criatura que veja a até 6 m de você. O alvo faz uma salvaguarda de ' +
      'Destreza CD 15 ou fica com a condição Contido.\n\n' +
      'Você pode soltá-lo largando a sua ponta (a corda se enrola no espaço do alvo) ou usando uma ' +
      'ação bônus para repetir o comando (a corda se enrola na sua mão). Quem está contido pode usar ' +
      'uma ação para fazer um teste de Força (Atletismo) ou Destreza (Acrobacia) CD 15, à escolha ' +
      'dele, e se soltar. Se você ainda estiver segurando a corda quando o alvo escapar, pode usar ' +
      'uma reação para mandá-la se enrolar na sua mão; senão, ela se enrola no espaço do alvo.\n\n' +
      'A corda tem CA 20, 20 pontos de vida e Imunidade a dano de veneno e psíquico. Recupera 1 ' +
      'ponto de vida a cada 5 minutos, desde que tenha ao menos 1. Se chegar a 0, é destruída.',
  },
}
