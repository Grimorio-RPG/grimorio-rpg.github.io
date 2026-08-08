// Os anéis do SRD.
//
// Ficam num arquivo só porque são 22 e o R inteiro passaria de mil linhas.
// As regras de tradução estão em ../traducoes.ts.

import type { TraducaoDeItem } from '../traducoes'

export const R_ANEIS: Record<string, TraducaoDeItem> = {
  'Ring of Animal Influence': {
    nome: 'Anel da Influência Animal',
    texto:
      'Este anel tem 3 cargas e recupera 1d3 gastas todo amanhecer. Vestindo-o, você pode gastar 1 ' +
      'carga para conjurar uma destas magias (CD 13): Amizade Animal, Falar com Animais, ou Medo ' +
      '(que só afeta feras).',
  },

  'Ring of Djinni Summoning': {
    nome: 'Anel de Invocar Djinni',
    texto:
      'Vestindo este anel, você pode usar a ação Magia para invocar um djinni específico do Plano ' +
      'Elemental do Ar. Ele aparece num espaço desocupado à sua escolha a até 36 m de você e fica ' +
      'enquanto você mantiver concentração, até no máximo 1 hora, ou até cair a 0 pontos de vida.\n\n' +
      'Invocado, o djinni fica Amistoso com você e seus aliados e obedece às suas ordens; sem ordens, ' +
      'ele se defende de quem o atacar mas não faz mais nada. Depois de ir embora, só pode ser ' +
      'invocado de novo em 24 horas, e o anel perde a magia se ele morrer.\n\n' +
      'Estes anéis costumam ser feitos pelos próprios djinns que invocam, e dados a mortais como ' +
      'presente de amizade ou prova de estima.',
  },

  'Ring of Elemental Command': {
    nome: 'Anel do Comando Elemental',
    texto:
      'Cada Anel do Comando Elemental é ligado a um dos quatro Planos Elementais; o Mestre escolhe ' +
      'ou sorteia qual.\n\n' +
      'Ruína dos Elementais. Vestindo o anel, você tem vantagem em ataques contra elementais, e eles ' +
      'têm desvantagem em ataques contra você.\n\n' +
      'Compulsão Elemental. Vestindo o anel, você pode usar a ação Magia para tentar dominar um ' +
      'elemental que veja a até 18 m. Ele faz uma salvaguarda de Sabedoria CD 18; se falhar, fica ' +
      'com a condição Enfeitiçado até o começo do seu próximo turno, e você decide o que ele faz com ' +
      'o movimento e a ação do turno seguinte dele.\n\n' +
      'Foco Elemental. Vestindo o anel, você ganha o que corresponde ao plano dele:\n' +
      'Ar. Você sabe Áurico, tem Resistência a dano elétrico e ganha deslocamento de voo igual ao ' +
      'seu deslocamento, podendo pairar.\n' +
      'Terra. Você sabe Térreo e tem Resistência a dano de ácido. Terreno de entulho, pedra ou terra ' +
      'não é terreno difícil para você, e você atravessa terra ou rocha sólida como se fossem ' +
      'terreno difícil, sem perturbar a matéria por onde passa — mas se terminar o turno dentro da ' +
      'rocha, é expulso para o espaço desocupado mais próximo que você ocupou.\n' +
      'Fogo. Você sabe Ígneo e tem Imunidade a dano de fogo.\n' +
      'Água. Você sabe Aquano, ganha deslocamento de natação de 18 m e respira debaixo d’água.\n\n' +
      'Conjuração. O anel tem 5 cargas e recupera 1d4 + 1 gastas todo amanhecer. Vestindo-o, você ' +
      'pode conjurar magias dele (CD 18), conforme o plano: Ar — Queda Suave (0 cargas), Muralha de ' +
      'Vento (1), Rajada de Vento (2), Relâmpago em Cadeia (3); Terra — Moldar Pedra (2), Pele de ' +
      'Pedra (3), Muralha de Pedra (3), Terremoto (5); Fogo — Mãos Flamejantes (1), Bola de Fogo (2), ' +
      'Muralha de Fogo (3), Tempestade de Fogo (4); Água — Criar ou Destruir Água (1), Tempestade de ' +
      'Granizo (2), Caminhar sobre as Águas (2), Muralha de Gelo (3), Tsunami (5).',
  },

  'Ring of Evasion': {
    nome: 'Anel da Evasão',
    texto:
      'Este anel tem 3 cargas e recupera 1d3 gastas todo amanhecer. Quando você falha numa ' +
      'salvaguarda de Destreza vestindo o anel, pode usar uma reação para gastar 1 carga e passar na ' +
      'salvaguarda.',
  },

  'Ring of Feather Falling': {
    nome: 'Anel da Queda Suave',
    texto:
      'Quando você cai vestindo este anel, desce 18 m por rodada e não sofre dano nenhum da queda.',
  },

  'Ring of Free Action': {
    nome: 'Anel da Ação Livre',
    texto:
      'Vestindo este anel, terreno difícil não custa movimento extra. Além disso, magia nenhuma ' +
      'consegue reduzir seus deslocamentos nem deixar você com a condição Paralisado ou Contido.',
  },

  'Ring of Invisibility': {
    nome: 'Anel da Invisibilidade',
    texto:
      'Vestindo este anel, você pode usar a ação Magia para ganhar a condição Invisível. Você fica ' +
      'assim até tirar o anel ou usar uma ação bônus para voltar a ser visível.',
  },

  'Ring of Jumping': {
    nome: 'Anel do Salto',
    texto:
      'Vestindo este anel, você pode conjurar Salto com ele, mas só pode mirar em si mesmo.',
  },

  'Ring of Mind Shielding': {
    nome: 'Anel do Escudo Mental',
    texto:
      'Vestindo este anel, você fica imune a magias que permitam a outros ler seus pensamentos, ' +
      'saber se você está mentindo, conhecer sua tendência ou seu tipo de criatura. Ninguém se ' +
      'comunica com você por telepatia sem que você deixe.\n\n' +
      'Você pode usar a ação Magia para o anel ficar imperceptível, até usar outra ação Magia para ' +
      'torná-lo perceptível, até tirá-lo, ou até morrer.\n\n' +
      'Se você morrer vestindo o anel, sua alma entra nele, a não ser que já haja uma alma lá. Você ' +
      'pode ficar no anel ou partir para o além. Enquanto sua alma estiver lá, você se comunica por ' +
      'telepatia com quem estiver vestindo o anel — e quem o veste não pode impedir isso.',
  },

  'Ring of Protection': {
    nome: 'Anel de Proteção',
    texto: 'Você recebe +1 na Classe de Armadura e nas salvaguardas enquanto veste este anel.',
  },

  'Ring of Regeneration': {
    nome: 'Anel da Regeneração',
    texto:
      'Vestindo este anel, você recupera 1d6 pontos de vida a cada 10 minutos, desde que tenha ao ' +
      'menos 1 ponto de vida. Se você perder uma parte do corpo, o anel faz o que falta crescer de ' +
      'novo e voltar a funcionar por inteiro depois de 1d6 + 1 dias, desde que você fique com ao ' +
      'menos 1 ponto de vida esse tempo todo.',
  },

  'Ring of Resistance': {
    nome: 'Anel da Resistência',
    texto:
      'Você tem Resistência a um tipo de dano enquanto veste este anel. A gema dele indica qual — o ' +
      'Mestre escolhe ou sorteia na tabela do SRD.',
  },

  'Ring of Shooting Stars': {
    nome: 'Anel das Estrelas Cadentes',
    texto:
      'Você pode conjurar Luzes Dançantes ou Luz com este anel. Ele tem 6 cargas e recupera 1d6 ' +
      'gastas todo amanhecer.\n\n' +
      'Fogo Feérico. Gaste 1 carga para conjurar Fogo Feérico com o anel.\n\n' +
      'Esferas de Relâmpago. Gaste 2 cargas com a ação Magia para criar até quatro esferas de raio ' +
      'de 90 cm de diâmetro. Cada uma aparece num espaço desocupado que você veja a até 36 m, e elas ' +
      'duram enquanto você mantiver concentração, até 1 minuto. Cada esfera lança luz fraca num raio ' +
      'de 9 m. Com uma ação bônus, você pode mover cada esfera até 9 m, sem passar de 36 m de você. ' +
      'Na primeira vez que uma esfera chegar a até 1,5 m de uma criatura que não seja você e não ' +
      'esteja atrás de cobertura total, ela descarrega o raio nessa criatura e some. A criatura faz ' +
      'uma salvaguarda de Destreza CD 15 e, se falhar, sofre dano elétrico conforme quantas esferas ' +
      'você criou: 4d12 com uma, 5d4 com duas, 2d6 com três, 2d4 com quatro. Se passar, sofre ' +
      'metade.\n\n' +
      'Estrelas Cadentes. Gaste de 1 a 3 cargas com a ação Magia. Para cada carga gasta, você dispara ' +
      'um ponto de luz do anel contra um ponto que veja a até 18 m. Cada criatura num Cubo de 4,5 m ' +
      'a partir desse ponto é coberta de faíscas e faz uma salvaguarda de Destreza CD 15, sofrendo ' +
      '5d4 de dano radiante se falhar, ou metade se passar.',
  },

  'Ring of Spell Storing': {
    nome: 'Anel de Guardar Magias',
    texto:
      'Este anel guarda magias conjuradas nele até quem está sintonizado usá-las, até 5 círculos de ' +
      'cada vez. Quando achado, tem 1d6 − 1 círculos guardados, escolhidos pelo Mestre.\n\n' +
      'Qualquer criatura pode conjurar uma magia de 1º a 5º círculo no anel tocando-o durante a ' +
      'conjuração — a magia não faz efeito, só fica guardada; se não couber, se gasta à toa. O ' +
      'círculo do espaço usado decide quanto lugar ela ocupa.\n\n' +
      'Vestindo o anel, você pode conjurar qualquer magia guardada, usando o círculo, a CD, o bônus ' +
      'de ataque e o atributo de conjuração de quem a guardou, mas no mais como se você tivesse ' +
      'conjurado. A magia sai do anel e libera o espaço.',
  },

  'Ring of Spell Turning': {
    nome: 'Anel do Retorno de Magias',
    texto:
      'Vestindo este anel, você tem vantagem nas salvaguardas contra magias. Se passar na salvaguarda ' +
      'de uma magia de 7º círculo ou menor, ela não faz efeito nenhum em você. E se essa magia mirava ' +
      'só você e não criava área de efeito, você pode usar uma reação para devolvê-la a quem a ' +
      'conjurou, que então faz uma salvaguarda contra a própria magia usando a CD dele.',
  },

  'Ring of Swimming': {
    nome: 'Anel da Natação',
    texto: 'Você tem deslocamento de natação de 12 m enquanto veste este anel.',
  },

  'Ring of Telekinesis': {
    nome: 'Anel da Telecinesia',
    texto: 'Vestindo este anel, você pode conjurar Telecinesia com ele.',
  },

  'Ring of the Ram': {
    nome: 'Anel do Aríete',
    texto:
      'Este anel tem 3 cargas e recupera 1d3 gastas todo amanhecer. Vestindo-o, você pode usar a ' +
      'ação Magia e gastar de 1 a 3 cargas para fazer um ataque de magia à distância contra uma ' +
      'criatura que veja a até 18 m. O anel cria uma cabeça espectral de carneiro e ataca com +7. Se ' +
      'acertar, para cada carga gasta o alvo sofre 2d10 de dano de força e é empurrado 1,5 m para ' +
      'longe de você.\n\n' +
      'Ou então você pode gastar de 1 a 3 cargas com a ação Magia para tentar quebrar um objeto não ' +
      'mágico que veja a até 18 m e que ninguém esteja vestindo ou carregando. O anel faz um teste ' +
      'de Força com +5 por carga gasta.',
  },

  'Ring of Three Wishes': {
    nome: 'Anel dos Três Desejos',
    texto:
      'Vestindo este anel, você pode gastar 1 das 3 cargas dele para conjurar Desejo. O anel deixa ' +
      'de ser mágico quando a última carga é usada.',
  },

  'Ring of Warmth': {
    nome: 'Anel do Calor',
    texto:
      'Se você sofrer dano de frio vestindo este anel, ele reduz o dano em 2d8. Além disso, você e ' +
      'tudo o que veste e carrega não são prejudicados por temperaturas de −18 °C ou menos.',
  },

  'Ring of Water Walking': {
    nome: 'Anel de Caminhar sobre as Águas',
    texto:
      'Vestindo este anel, você conjura Caminhar sobre as Águas com ele, mirando só em si mesmo.',
  },

  'Ring of X-ray Vision': {
    nome: 'Anel da Visão de Raios X',
    texto:
      'Vestindo este anel, você pode usar a ação Magia para ganhar visão de raios X a até 9 m por 1 ' +
      'minuto. Para você, objetos sólidos nesse raio ficam transparentes e deixam a luz passar. A ' +
      'visão atravessa 30 cm de pedra, 2,5 cm de metal comum, ou até 90 cm de madeira ou terra; ' +
      'materiais mais grossos, ou uma folha fina de chumbo, bloqueiam.\n\n' +
      'Sempre que você usar o anel de novo antes de terminar um descanso longo, faça uma salvaguarda ' +
      'de Constituição CD 15 ou ganhe 1 nível de exaustão.',
  },
}
