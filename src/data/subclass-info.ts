// O que cada subclasse é, em português de mesa.
//
// A escolha de subclasse é a decisão mais pesada que um personagem toma: vem no
// nível 3 e vale o resto da campanha. O app oferecia um `<select>` com o nome e
// o nome em inglês entre parênteses, o que só ajuda quem já sabe.
//
// `bomSe` e `atencao` existem para quem nunca jogou conseguir escolher sem ler
// o livro — e `atencao` é honesto de propósito: subclasse tem custo, e esconder
// isso é o que faz alguém abandonar o personagem no nível 6.

export interface InfoSubclasse {
  /** O que ela é, numa frase. */
  resumo: string
  /** Para quem ela é. */
  bomSe: string
  /** O preço que ela cobra. */
  atencao: string
}

export const INFO_SUBCLASSES: Record<string, InfoSubclasse> = {
  // --- Bárbaro -------------------------------------------------------------
  'Caminho do Berserker (Path of the Berserker)': {
    resumo: 'Fúria pura: ataca mais vezes e revida em quem te machuca.',
    bomSe: 'Você quer bater forte sem gerenciar nada — a subclasse mais direta do jogo.',
    atencao: 'Quase não traz utilidade fora de combate.',
  },
  'Caminho do Coração Selvagem (Path of the Wild Heart)': {
    resumo: 'Fúria guiada por espíritos animais, com um bônus diferente a cada uso.',
    bomSe: 'Você gosta de escolher a ferramenta certa para cada luta e falar com bichos.',
    atencao: 'Exige decidir o espírito antes de saber o que vem — erra às vezes.',
  },
  'Caminho da Árvore do Mundo (Path of the World Tree)': {
    resumo: 'Fúria que protege o grupo: vida temporária para você e para os aliados.',
    bomSe: 'Você quer ser a linha de frente que também segura o time em pé.',
    atencao: 'Causa menos dano que o Berserker em troca da proteção.',
  },
  'Caminho do Zelote (Path of the Zealot)': {
    resumo: 'Fúria divina: dano extra sagrado e uma relação leve com a própria morte.',
    bomSe: 'Você quer avançar sem medo — voltar dos mortos é barato para você.',
    atencao: 'O dano extra é bom, mas o tema religioso pode não caber em toda campanha.',
  },

  // --- Bardo ---------------------------------------------------------------
  'Colégio da Dança (College of Dance)': {
    resumo: 'Bardo que luta dançando, ágil e difícil de acertar.',
    bomSe: 'Você quer um bardo que entra na briga sem virar alvo fácil.',
    atencao: 'Depende de Destreza além dos atributos normais do bardo.',
  },
  'Colégio do Glamour (College of Glamour)': {
    resumo: 'Encanta plateias e inimigos; move e protege o grupo com a voz.',
    bomSe: 'Você quer resolver cenas conversando e controlar quem se aproxima.',
    atencao: 'Fraco contra o que não pode ser encantado — mortos-vivos, constructos.',
  },
  'Colégio do Saber (College of Lore)': {
    resumo: 'O bardo clássico: muitas perícias, magias roubadas de outras classes.',
    bomSe: 'Você quer ser útil em toda situação e ter resposta para tudo.',
    atencao: 'Frágil em combate direto — atua de longe.',
  },
  'Colégio da Bravura (College of Valor)': {
    resumo: 'Bardo de armadura e arma, que inspira lutando junto.',
    bomSe: 'Você quer conjurar magia sem sair da linha de frente.',
    atencao: 'Não é tão bom lutando quanto um guerreiro nem conjurando quanto um mago.',
  },

  // --- Bruxo ---------------------------------------------------------------
  'Patrono Arquifada (Archfey Patron)': {
    resumo: 'Poder feérico: teletransporte curto, ilusão e encantamento.',
    bomSe: 'Você quer entrar e sair de perigo e mexer com a cabeça dos inimigos.',
    atencao: 'Patronos feéricos costumam cobrar favores estranhos — combine com o DM.',
  },
  'Patrono Celestial (Celestial Patron)': {
    resumo: 'Bruxo que cura: dano radiante e um poço de vida para o grupo.',
    bomSe: 'Você quer o único bruxo que segura o papel de curandeiro.',
    atencao: 'Cura menos que um clérigo — é apoio, não substituto.',
  },
  'Patrono Corruptor (Fiend Patron)': {
    resumo: 'Fogo e resistência: dano pesado e vida temporária a cada morte.',
    bomSe: 'Você quer o bruxo mais simples e mais destrutivo.',
    atencao: 'O patrono é um demônio, e isso tem consequências na história.',
  },
  'Patrono Grande Antigo (Great Old One Patron)': {
    resumo: 'Mente alienígena: telepatia, medo e efeitos psíquicos.',
    bomSe: 'Você quer um personagem perturbador, de horror cósmico.',
    atencao: 'Os efeitos são mais situacionais que os do Corruptor.',
  },

  // --- Clérigo -------------------------------------------------------------
  'Domínio da Vida (Life Domain)': {
    resumo: 'A melhor cura do jogo, e armadura pesada.',
    bomSe: 'É a sua primeira vez de clérigo — é o mais fácil e o mais seguro.',
    atencao: 'Causa pouco dano; seu papel é manter todo mundo de pé.',
  },
  'Domínio da Luz (Light Domain)': {
    resumo: 'Clérigo de dano: fogo, luz radiante e explosões em área.',
    bomSe: 'Você quer curar às vezes e explodir inimigos no resto do tempo.',
    atencao: 'Armadura mais leve — fique atrás da linha de frente.',
  },
  'Domínio da Trapaça (Trickery Domain)': {
    resumo: 'Clérigo furtivo: ilusões, cópias de si mesmo e ajuda para infiltrar.',
    bomSe: 'Você quer um clérigo que não parece um clérigo.',
    atencao: 'O mais fraco em combate aberto dos quatro.',
  },
  'Domínio da Guerra (War Domain)': {
    resumo: 'Clérigo de armadura pesada que ataca junto com o grupo.',
    bomSe: 'Você quer estar na frente batendo e curando quando precisa.',
    atencao: 'Menos magia de utilidade que os outros domínios.',
  },

  // --- Druida --------------------------------------------------------------
  'Círculo da Terra (Circle of the Land)': {
    resumo: 'Druida conjurador: magias extras conforme o terreno da campanha.',
    bomSe: 'Você quer usar magia, não virar bicho.',
    atencao: 'A Forma Selvagem fica fraca — não conte com ela para lutar.',
  },
  'Círculo da Lua (Circle of the Moon)': {
    resumo: 'Vira feras poderosas e luta com garras e dentes.',
    bomSe: 'Você quer se transformar em urso e segurar a linha de frente.',
    atencao: 'Rastrear as estatísticas da forma animal dá trabalho no começo.',
  },
  'Círculo do Mar (Circle of the Sea)': {
    resumo: 'Aura de tempestade constante ao seu redor, que fere quem se aproxima.',
    bomSe: 'Você quer dano contínuo sem gastar ação todo turno.',
    atencao: 'Menos versátil que o Círculo da Terra.',
  },
  'Círculo das Estrelas (Circle of the Stars)': {
    resumo: 'Assume formas de constelação: uma para dano, uma para cura, uma para resistir.',
    bomSe: 'Você quer trocar de papel no meio do combate.',
    atencao: 'Exige entender as três formas para valer a pena.',
  },

  // --- Feiticeiro ----------------------------------------------------------
  'Feitiçaria Aberrante (Aberrant Sorcery)': {
    resumo: 'Poder psiônico: telepatia e magias que ninguém ouve você conjurar.',
    bomSe: 'Você quer conjurar amarrado ou amordaçado, sem ninguém perceber.',
    atencao: 'A origem alienígena costuma trazer complicações na história.',
  },
  'Feitiçaria Mecânica (Clockwork Sorcery)': {
    resumo: 'Ordem e previsibilidade: anula vantagem alheia e estabiliza rolagens.',
    bomSe: 'Você quer proteger o grupo do azar em momentos decisivos.',
    atencao: 'Menos espetacular que as outras — o efeito é sutil.',
  },
  'Feitiçaria Dracônica (Draconic Sorcery)': {
    resumo: 'Sangue de dragão: mais vida, CA natural e dano elemental, com voo depois.',
    bomSe: 'É a sua primeira vez de feiticeiro — é a mais robusta e simples.',
    atencao: 'Menos truques do que as outras; ganha na resistência.',
  },
  'Feitiçaria Selvagem (Wild Magic Sorcery)': {
    resumo: 'Magia instável: efeitos aleatórios podem sair do controle.',
    bomSe: 'Você quer caos e histórias imprevisíveis na mesa.',
    atencao: 'Pode atrapalhar o próprio grupo. Combine com o DM antes.',
  },

  // --- Guerreiro -----------------------------------------------------------
  'Mestre de Batalha (Battle Master)': {
    resumo: 'Manobras táticas: derruba, desarma, empurra e comanda aliados.',
    bomSe: 'Você quer decidir coisas em combate além de "eu ataco".',
    atencao: 'Tem recursos para gerenciar — é o guerreiro mais trabalhoso.',
  },
  'Campeão (Champion)': {
    resumo: 'Crítico mais fácil e atletismo — puro e simples.',
    bomSe: 'É o seu primeiro personagem, ou você quer jogar sem gerenciar nada.',
    atencao: 'Poucas decisões: pode ficar repetitivo em campanhas longas.',
  },
  'Cavaleiro Arcano (Eldritch Knight)': {
    resumo: 'Guerreiro que conjura magia de mago junto com os ataques.',
    bomSe: 'Você quer lutar de armadura pesada e ainda lançar magias.',
    atencao: 'Usa Inteligência, um atributo que o guerreiro normalmente ignora.',
  },
  'Guerreiro Psiônico (Psi Warrior)': {
    resumo: 'Telecinese: empurra à distância, protege aliados e voa.',
    bomSe: 'Você quer magia sem magia, com tema mental.',
    atencao: 'Também depende de Inteligência.',
  },

  // --- Ladino --------------------------------------------------------------
  'Trapaceiro Arcano (Arcane Trickster)': {
    resumo: 'Ladino com magia de mago focada em ilusão e roubo à distância.',
    bomSe: 'Você quer furtar coisas sem chegar perto.',
    atencao: 'Depende de Inteligência além de Destreza.',
  },
  'Assassino (Assassin)': {
    resumo: 'Dano devastador contra quem ainda não agiu no combate.',
    bomSe: 'Você quer eliminar um alvo antes que ele reaja.',
    atencao: 'Se o grupo não gosta de emboscar, a subclasse rende pouco.',
  },
  'Lâmina da Alma (Soulknife)': {
    resumo: 'Cria lâminas mentais; teletransporta e conversa por telepatia.',
    bomSe: 'Você quer estar sempre armado, mesmo revistado e preso.',
    atencao: 'Dano um pouco menor que o do Assassino.',
  },
  'Ladrão (Thief)': {
    resumo: 'Mãos rápidas, escalada e uso de qualquer item mágico.',
    bomSe: 'É o seu primeiro ladino — é o mais versátil fora de combate.',
    atencao: 'Não aumenta o seu dano; melhora o que você faz entre as lutas.',
  },

  // --- Mago ----------------------------------------------------------------
  'Abjurador (Abjurer)': {
    resumo: 'Escudo arcano que absorve dano e se recarrega sozinho.',
    bomSe: 'Você quer o mago mais difícil de matar.',
    atencao: 'Causa menos dano que o Evocador.',
  },
  'Adivinho (Diviner)': {
    resumo: 'Guarda rolagens já feitas para substituir dados no futuro.',
    bomSe: 'Você quer transformar um acerto crítico inimigo num erro.',
    atencao: 'Exige planejamento; o poder não é óbvio à primeira vista.',
  },
  'Evocador (Evoker)': {
    resumo: 'Explosões que não machucam os seus aliados.',
    bomSe: 'É a sua primeira vez de mago — é o mais direto e satisfatório.',
    atencao: 'Menos utilidade fora de combate.',
  },
  'Ilusionista (Illusionist)': {
    resumo: 'Ilusões que enganam e chegam a ficar reais por um instante.',
    bomSe: 'Você gosta de resolver problemas de um jeito criativo.',
    atencao: 'Depende muito do DM aceitar as suas ideias.',
  },

  // --- Monge ---------------------------------------------------------------
  'Guerreiro da Mão Aberta (Warrior of the Open Hand)': {
    resumo: 'Artes marciais puras: empurra, derruba, atordoa e cura a si mesmo.',
    bomSe: 'É o seu primeiro monge — é o mais forte e o mais simples.',
    atencao: 'Sem truque de tema; é o monge clássico.',
  },
  'Guerreiro das Sombras (Warrior of Shadow)': {
    resumo: 'Escuridão e teletransporte entre sombras.',
    bomSe: 'Você quer um monge furtivo, de infiltração.',
    atencao: 'Rende pouco em campanha bem iluminada.',
  },
  'Guerreiro dos Elementos (Warrior of the Elements)': {
    resumo: 'Golpes elementais com alcance maior que o normal.',
    bomSe: 'Você quer um monge com cara de dobrador de elementos.',
    atencao: 'Gasta muito foco — acaba rápido.',
  },
  'Guerreiro da Misericórdia (Warrior of Mercy)': {
    resumo: 'Cura com um toque e envenena com o outro.',
    bomSe: 'Você quer ser o curandeiro de emergência sem deixar de bater.',
    atencao: 'Cura menos que clérigo; é remendo, não hospital.',
  },

  // --- Paladino ------------------------------------------------------------
  'Juramento da Devoção (Oath of Devotion)': {
    resumo: 'O paladino clássico: protege, purifica e brilha contra o mal.',
    bomSe: 'É a sua primeira vez — é o mais reto e o mais fácil de interpretar.',
    atencao: 'O juramento é rígido: mentir e trapacear saem caro.',
  },
  'Juramento da Glória (Oath of Glory)': {
    resumo: 'Herói atlético que acelera e fortalece o grupo inteiro.',
    bomSe: 'Você quer melhorar todo mundo ao seu redor.',
    atencao: 'Menos dano pessoal que o Vingança.',
  },
  'Juramento dos Anciões (Oath of the Ancients)': {
    resumo: 'Paladino da natureza; a aura reduz o dano mágico do grupo.',
    bomSe: 'Você quer o paladino mais resistente contra magia.',
    atencao: 'Demora a brilhar — a aura vem no nível 7.',
  },
  'Juramento da Vingança (Oath of Vengeance)': {
    resumo: 'Caça um alvo com vantagem até derrubá-lo.',
    bomSe: 'Você quer o paladino que mais causa dano.',
    atencao: 'Focar num alvo pode deixar o resto do combate de lado.',
  },

  // --- Patrulheiro ---------------------------------------------------------
  'Mestre das Feras (Beast Master)': {
    resumo: 'Um companheiro animal que luta com você e evolui junto.',
    bomSe: 'Você sempre quis ter um bicho de estimação de combate.',
    atencao: 'São duas fichas para controlar; o turno demora mais.',
  },
  'Andarilho Feérico (Fey Wanderer)': {
    resumo: 'Dano psíquico extra e muito carisma social.',
    bomSe: 'Você quer um patrulheiro que também resolve conversa.',
    atencao: 'Usa Sabedoria e Carisma — atributos espalhados.',
  },
  'Perseguidor Sombrio (Gloom Stalker)': {
    resumo: 'Invisível no escuro e devastador na primeira rodada.',
    bomSe: 'Você quer o patrulheiro mais forte em combate, e joga em masmorra.',
    atencao: 'Perde muito em campanha ao ar livre e de dia.',
  },
  'Caçador (Hunter)': {
    resumo: 'Bônus escolhidos contra hordas ou contra alvos grandes.',
    bomSe: 'É o seu primeiro patrulheiro — é o mais simples e consistente.',
    atencao: 'Sem tema forte; é o mais genérico dos quatro.',
  },
}

export function infoSubclasse(nome: string): InfoSubclasse | undefined {
  return INFO_SUBCLASSES[nome]
}
