// Itens do SRD que começam com A.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const A: Record<string, TraducaoDeItem> = {
  'Adamantine Armor': {
    nome: 'Armadura de Adamante',
    texto:
      'Esta armadura é reforçada com adamante, uma das substâncias mais duras que existem. ' +
      'Enquanto você a veste, qualquer Acerto Crítico contra você vira um acerto normal.',
  },

  'Ammunition, +1, +2, or +3': {
    nome: 'Munição +1, +2 ou +3',
    texto:
      'Você recebe um bônus nas rolagens de ataque e de dano feitas com esta munição mágica. ' +
      'O bônus é o da raridade dela. Assim que acerta um alvo, a munição deixa de ser mágica. ' +
      'Costuma ser encontrada ou vendida em lotes de dez ou vinte. Dez unidades valem o mesmo ' +
      'que uma poção da mesma raridade.',
  },

  'Ammunition of Slaying': {
    nome: 'Munição Matadora',
    texto:
      'Esta munição mágica foi feita para matar criaturas de um tipo específico, que o Mestre ' +
      'escolhe ou sorteia. Quando uma criatura desse tipo sofre dano da munição, ela faz uma ' +
      'salvaguarda de Constituição CD 17 e sofre 6d10 de dano de força extra se falhar, ou ' +
      'metade disso se passar. Depois de causar o dano extra, a munição deixa de ser mágica.',
  },

  'Amulet of Health': {
    nome: 'Amuleto da Saúde',
    texto:
      'Sua Constituição passa a 19 enquanto você veste este amuleto. Não faz efeito se a sua ' +
      'Constituição já for 19 ou mais sem ele.',
  },

  'Amulet of Proof against Detection and Location': {
    nome: 'Amuleto à Prova de Detecção e Localização',
    texto:
      'Enquanto veste este amuleto, você não pode ser alvo de magias de Adivinhação nem ser ' +
      'percebido por sensores mágicos de vidência, a não ser que você permita.',
  },

  'Amulet of the Planes': {
    nome: 'Amuleto dos Planos',
    texto:
      'Enquanto veste este amuleto, você pode usar a ação Magia para nomear um lugar que ' +
      'conheça em outro plano de existência. Faça então um teste de Inteligência (Arcanismo) ' +
      'CD 15. Se passar, você conjura Deslocamento Planar. Se falhar, você e cada criatura e ' +
      'objeto a até 4,5 m de você vão parar num destino aleatório, sorteado na tabela do SRD.',
  },

  'Animated Shield': {
    nome: 'Escudo Animado',
    texto:
      'Enquanto segura este escudo, você pode usar uma ação bônus para animá-lo. Ele salta no ' +
      'ar e flutua no seu espaço protegendo você como se estivesse empunhado, deixando suas ' +
      'mãos livres. Fica animado por 1 minuto, até você usar outra ação bônus para encerrar, ' +
      'ou até você morrer ou ficar com a condição Incapacitado — aí ele cai no chão, ou na sua ' +
      'mão se houver uma livre.',
  },

  'Apparatus of the Crab': {
    nome: 'Engenho do Caranguejo',
    texto:
      'À primeira vista é um barril de ferro lacrado de 225 kg. O barril tem um trinco ' +
      'escondido, que um teste de Inteligência (Investigação) CD 20 encontra. Soltar o trinco ' +
      'destrava uma escotilha por onde duas criaturas Médias ou menores entram rastejando. Dez ' +
      'alavancas ficam enfileiradas no fundo, cada uma em posição neutra, podendo subir ou ' +
      'descer. Com certas alavancas, o engenho se transforma numa lagosta gigante.\n\n' +
      'O Engenho do Caranguejo é um objeto Grande: CA 20; PV 200; deslocamento 9 m e natação ' +
      '9 m (ou 0 m nos dois se as pernas não estiverem estendidas); Imunidade a dano de veneno ' +
      'e psíquico. Como veículo, precisa de um piloto.\n\n' +
      'Com a escotilha fechada, o compartimento é estanque ao ar e à água, e guarda ar para 10 ' +
      'horas de respiração divididas pelo número de criaturas lá dentro. O engenho boia, e ' +
      'também desce a até 270 m de profundidade — abaixo disso sofre 2d6 de dano contundente ' +
      'por minuto por causa da pressão.\n\n' +
      'Quem está dentro pode usar a ação Utilizar para mover até duas alavancas. Depois de cada ' +
      'uso, a alavanca volta à posição neutra. O que cada uma faz está na tabela do SRD.',
  },

  'Armor, +1, +2, or +3': {
    nome: 'Armadura +1, +2 ou +3',
    texto:
      'Você recebe um bônus na Classe de Armadura enquanto veste esta armadura. O bônus é o da ' +
      'raridade dela.',
  },

  'Armor of Invulnerability': {
    nome: 'Armadura da Invulnerabilidade',
    texto:
      'Você tem Resistência a dano contundente, perfurante e cortante enquanto veste esta ' +
      'armadura.\n\n' +
      'Casco de Metal. Você pode usar a ação Magia para ganhar Imunidade a dano contundente, ' +
      'perfurante e cortante por 10 minutos, ou até tirar a armadura. Depois de usada, esta ' +
      'propriedade só volta a funcionar no amanhecer seguinte.',
  },
  'Armor of Resistance': {
    nome: 'Armadura da Resistência',
    texto:
      'Você tem Resistência a um tipo de dano enquanto veste esta armadura. O Mestre escolhe o ' +
      'tipo ou sorteia na tabela do SRD (ácido, frio, fogo, força, elétrico, necrótico, veneno, ' +
      'psíquico, radiante ou trovejante).',
  },

  'Armor of Vulnerability': {
    nome: 'Armadura da Vulnerabilidade',
    texto:
      'Enquanto veste esta armadura, você tem Resistência a um destes tipos de dano: contundente, ' +
      'perfurante ou cortante. O Mestre escolhe o tipo ou sorteia.\n\n' +
      'Maldição. Esta armadura é amaldiçoada, e isso só se revela quando a magia Identificação é ' +
      'lançada sobre ela ou quando você se sintoniza. Sintonizar-se amaldiçoa você até ser alvo de ' +
      'Remover Maldição ou magia parecida — tirar a armadura não resolve. Enquanto amaldiçoado, ' +
      'você tem Vulnerabilidade aos outros dois tipos de dano dos três (não àquele a que ela dá ' +
      'Resistência).',
  },

  'Arrow-Catching Shield': {
    nome: 'Escudo Apara-Flechas',
    texto:
      'Você recebe +2 na Classe de Armadura contra ataques à distância enquanto empunha este ' +
      'escudo, somado ao bônus normal dele. Sempre que alguém fizer um ataque à distância contra ' +
      'um alvo a até 1,5 m de você, você pode usar uma reação para virar o alvo do ataque no lugar ' +
      'dele.',
  },
}
