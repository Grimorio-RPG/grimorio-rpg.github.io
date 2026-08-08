// Itens do SRD que começam com N e O.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const NO: Record<string, TraducaoDeItem> = {
  'Necklace of Adaptation': {
    nome: 'Colar da Adaptação',
    texto:
      'Vestindo este colar, você respira normalmente em qualquer ambiente e tem vantagem nas ' +
      'salvaguardas para evitar ou encerrar a condição Envenenado.',
  },

  'Necklace of Fireballs': {
    nome: 'Colar de Bolas de Fogo',
    texto:
      'Este colar tem 1d6 + 3 contas penduradas. Você pode usar a ação Magia para soltar uma conta ' +
      'e arremessá-la a até 18 m. Ao chegar ao fim do percurso, ela detona como uma Bola de Fogo de ' +
      '3º círculo (CD 15). Você pode arremessar várias contas, ou o colar inteiro, de uma vez: o ' +
      'dano da Bola de Fogo sobe 1d6 por conta além da primeira, até o máximo de 12d6.',
  },

  'Necklace of Prayer Beads': {
    nome: 'Colar de Contas de Oração',
    texto:
      'Este colar tem 1d4 + 2 contas mágicas de água-marinha, pérola negra ou topázio, além de ' +
      'várias contas comuns de pedras como âmbar, heliotrópio, citrino, coral, jade, pérola ou ' +
      'quartzo. Uma conta mágica retirada do colar perde a magia.\n\n' +
      'Existem seis tipos de conta mágica; o Mestre decide o tipo de cada uma ou sorteia na tabela ' +
      'do SRD, e um colar pode ter mais de uma do mesmo tipo. Para usar uma, você precisa estar com ' +
      'o colar. Cada conta guarda uma magia que você pode conjurar dela como ação bônus, usando a ' +
      'sua CD de magia quando houver salvaguarda. Depois de conjurada, aquela conta só serve de novo ' +
      'no amanhecer seguinte.',
  },

  'Nine Lives Stealer': {
    nome: 'Ladra de Nove Vidas',
    texto:
      'Você recebe +2 nas rolagens de ataque e de dano feitas com esta arma mágica.\n\n' +
      'Roubo de Vida. A arma tem 1d8 + 1 cargas. Quando você ataca com ela uma criatura que esteja ' +
      'com menos de 100 pontos de vida e tira 20 no d20 do ataque, ela faz uma salvaguarda de ' +
      'Constituição CD 15 ou morre na hora, com a espada arrancando a força vital do corpo. ' +
      'Constructos e mortos-vivos passam automaticamente. A arma gasta 1 carga quando mata assim. ' +
      'Sem cargas, ela perde esta propriedade.',
  },

  Oathbow: {
    nome: 'Arco do Juramento',
    texto:
      'Quando você encaixa uma flecha neste arco, ele sussurra em élfico: “Derrota veloz aos meus ' +
      'inimigos”. Ao usá-lo para um ataque à distância, você pode dizer ou sinalizar as palavras de ' +
      'comando: “Morte veloz a você, que me fez mal”.\n\n' +
      'O alvo do seu ataque vira seu inimigo jurado até morrer ou até o amanhecer 7 dias depois. ' +
      'Você só pode ter um inimigo jurado por vez; quando ele morre, você pode escolher outro depois ' +
      'do amanhecer seguinte.\n\n' +
      'Nas rolagens de ataque à distância com este arco contra o inimigo jurado, você tem vantagem, ' +
      'o alvo não se beneficia de cobertura leve nem de três quartos, e você não tem desvantagem por ' +
      'alcance longo. Se acertar, ele sofre 3d6 de dano perfurante extra.\n\n' +
      'Enquanto o inimigo jurado viver, você tem desvantagem em ataques com todas as outras armas.',
  },

  'Oil of Etherealness': {
    nome: 'Óleo da Eterealidade',
    texto:
      'Um frasco deste óleo cobre uma criatura de tamanho Médio ou menor, junto com o equipamento ' +
      'que ela veste e carrega (mais um frasco por categoria de tamanho acima de Médio). Passar o ' +
      'óleo leva 10 minutos. A criatura então ganha o efeito da magia Eterealidade por 1 hora. Este ' +
      'óleo cinza e turvo forma gotas do lado de fora do frasco, que evaporam rápido.',
  },

  'Oil of Sharpness': {
    nome: 'Óleo do Afiamento',
    texto:
      'Um frasco deste óleo cobre uma arma corpo a corpo ou vinte peças de munição — mas só afeta ' +
      'munição e armas corpo a corpo não mágicas que causem dano cortante ou perfurante. Passar o ' +
      'óleo leva 1 minuto; depois disso ele penetra por magia no que cobriu, transformando a arma ' +
      'numa Arma +3 ou a munição em Munição +3. Este óleo transparente e gelatinoso brilha com ' +
      'lascas prateadas finíssimas.',
  },

  'Oil of Slipperiness': {
    nome: 'Óleo do Escorregadio',
    texto:
      'Um frasco deste óleo cobre uma criatura de tamanho Médio ou menor, junto com o equipamento ' +
      'que ela veste e carrega (mais um frasco por categoria de tamanho acima de Médio). Passar o ' +
      'óleo leva 10 minutos, e a criatura ganha o efeito da magia Liberdade de Movimento por 8 ' +
      'horas.\n\n' +
      'Ou então o óleo pode ser derramado no chão com a ação Magia, cobrindo um quadrado de 3 m e ' +
      'reproduzindo o efeito da magia Graxa naquela área por 8 horas. Este unguento preto e ' +
      'pegajoso é grosso e pesado, mas escorre depressa quando derramado.',
  },
}
