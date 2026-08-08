// Itens do SRD que começam com E.
//
// As regras de tradução estão em ../traducoes.ts, que junta os lotes.

import type { TraducaoDeItem } from '../traducoes'

export const E: Record<string, TraducaoDeItem> = {
  'Efficient Quiver': {
    nome: 'Aljava Eficiente',
    texto:
      'Cada um dos três compartimentos da aljava se liga a um espaço extradimensional, o que lhe ' +
      'permite guardar muita coisa sem nunca passar de 1 kg. O compartimento mais curto leva até 60 ' +
      'flechas, virotes ou objetos parecidos; o do meio, até 18 azagaias ou parecidos; o mais ' +
      'comprido, até 6 objetos longos, como arcos, bordões ou lanças. Você saca qualquer item de lá ' +
      'como se fosse de uma aljava ou bainha comum.',
  },

  'Efreeti Bottle': {
    nome: 'Garrafa do Efreeti',
    texto:
      'Quando você usa a ação Magia para tirar a rolha desta garrafa de latão pintada, sai dela uma ' +
      'nuvem de fumaça densa. No fim do seu turno, a fumaça some num clarão de fogo inofensivo e um ' +
      'efreeti aparece num espaço desocupado a até 9 m de você. Na primeira vez que a garrafa é ' +
      'aberta, o Mestre sorteia na tabela do SRD o que acontece.',
  },

  'Elemental Gem': {
    nome: 'Gema Elemental',
    texto:
      'Esta gema guarda uma fagulha de energia elemental. Quando você usa a ação Utilizar para ' +
      'quebrá-la, um elemental é invocado e a gema deixa de ser mágica. O elemental aparece num ' +
      'espaço desocupado o mais perto possível da gema quebrada, entende seus idiomas, obedece às ' +
      'suas ordens e age logo depois de você na iniciativa. Some depois de 1 hora, quando morre, ou ' +
      'quando você o dispensa com uma ação bônus.\n\n' +
      'O tipo de gema decide o elemental: safira azul, Elemental do Ar; esmeralda, Elemental da ' +
      'Água; corindo vermelho, Elemental do Fogo; diamante amarelo, Elemental da Terra.',
  },

  'Elixir of Health': {
    nome: 'Elixir da Saúde',
    texto:
      'Ao beber esta poção, você é curado de todas as doenças mágicas. Além disso, acabam em você ' +
      'as condições Cego, Surdo, Paralisado e Envenenado. O líquido é vermelho e claro, com ' +
      'bolhinhas de luz dentro.',
  },

  'Elven Chain': {
    nome: 'Cota de Malha Élfica',
    texto:
      'Você recebe +1 na Classe de Armadura enquanto veste esta armadura. Você conta como treinado ' +
      'nela mesmo sem ter treinamento em armadura média ou pesada.',
  },

  'Energy Bow': {
    nome: 'Arco de Energia',
    texto:
      'Você recebe +1 nas rolagens de ataque e de dano feitas com esta arma mágica, que não tem ' +
      'corda. Cada vez que você puxa o braço no gesto de atirar, uma flecha mágica de energia ' +
      'dourada aparece encaixada e pronta. A flecha causa dano de força em vez de perfurante e some ' +
      'depois de acertar ou errar; até sumir, emite luz plena num raio de 6 m e luz fraca por mais ' +
      '6 m.\n\n' +
      'Flecha da Contenção. Sempre que fizer um ataque à distância com esta arma contra uma ' +
      'criatura, você pode tentar contê-la em vez de causar dano. Se a flecha acertar, o alvo faz ' +
      'uma salvaguarda de Força CD 15 ou fica com a condição Contido por 1 minuto. Com uma ação, ' +
      'quem está contido assim pode fazer um teste de Força (Atletismo) CD 20 para se soltar.\n\n' +
      'Flecha do Transporte. Com a ação Magia, você pode atirar uma flecha de energia num alvo que ' +
      'veja a até 18 m. O alvo pode ser uma criatura disposta de tamanho Médio ou menor, ou um ' +
      'objeto que ninguém esteja vestindo ou carregando, desde que caiba num Cubo de 1,5 m. A ' +
      'flecha teleporta o alvo para um espaço desocupado que você veja a até 3 m de você.\n\n' +
      'Escada de Energia. Com a ação Magia, você pode disparar uma saraivada de flechas contra uma ' +
      'parede a até 18 m. Elas viram degraus luminosos fincados na parede, formando uma escada ' +
      'mágica de até 18 m. A escada dura 1 minuto e some.',
  },

  'Eversmoking Bottle': {
    nome: 'Garrafa Fumegante',
    texto:
      'Com a ação Magia, você pode abrir ou fechar esta garrafa. Aberta, sai dela uma fumaça densa ' +
      'que forma uma nuvem preenchendo uma Emanação de 18 m a partir da garrafa; dentro da fumaça a ' +
      'área fica densamente obscurecida. A cada minuto com a garrafa aberta, a Emanação cresce 3 m, ' +
      'até o máximo de 36 m. Fechar a garrafa deixa a nuvem parada, e ela se dissipa em 10 minutos. ' +
      'Um vento forte (como o da magia Rajada de Vento) dissipa a nuvem em 1 minuto.',
  },

  'Eyes of Charming': {
    nome: 'Olhos do Encanto',
    texto:
      'Estas lentes de cristal se encaixam sobre os olhos e têm 3 cargas. Usando-as, você pode ' +
      'gastar uma ou mais cargas para conjurar Enfeitiçar Pessoa (CD 13). Com 1 carga você conjura ' +
      'a versão de 1º círculo, e cada carga a mais sobe um círculo. As lentes recuperam todas as ' +
      'cargas gastas todo amanhecer.',
  },

  'Eyes of Minute Seeing': {
    nome: 'Olhos da Visão Minuciosa',
    texto:
      'Estas lentes de cristal se encaixam sobre os olhos. Usando-as, sua visão melhora muito até ' +
      '30 cm de distância: você tem visão no escuro nesse alcance e vantagem em testes de ' +
      'Inteligência (Investigação) para examinar algo tão perto.',
  },

  'Eyes of the Eagle': {
    nome: 'Olhos da Águia',
    texto:
      'Estas lentes de cristal se encaixam sobre os olhos. Usando-as, você tem vantagem em testes ' +
      'de Sabedoria (Percepção) que dependam da visão. Com boa visibilidade, você distingue ' +
      'detalhes de criaturas e objetos de até 60 cm mesmo a distâncias enormes.',
  },
}
