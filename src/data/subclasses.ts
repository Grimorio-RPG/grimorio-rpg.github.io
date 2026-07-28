// Traços de subclasse — D&D 5.5e (2024).
//
// Mesma forma dos traços de classe: dado, não código. A chave é o nome exato da
// subclasse como aparece em `CLASSES` (`rules.ts`), incluindo o nome em inglês
// entre parênteses — é o que a ficha guarda em `char.subclasse`.

import type { TracoClasse } from './features'

const T = (nivel: number, nome: string, resumo: string, efeito?: TracoClasse['efeito']): TracoClasse => ({
  nivel,
  nome,
  resumo,
  efeito,
})

/**
 * Manobras do Mestre de Batalha.
 *
 * Estão aqui, e não como texto solto, porque foram o exemplo do relato: são
 * escolhas que a ficha precisava oferecer e não oferecia — "pra minha subclasse
 * tive que fazer manualmente".
 */
export const MANOBRAS: { nome: string; resumo: string }[] = [
  { nome: 'Aparar', resumo: 'Reação: reduz o dano de um golpe corpo a corpo em você.' },
  { nome: 'Ataque Ameaçador', resumo: 'O alvo faz salvaguarda de Sabedoria ou fica Amedrontado.' },
  { nome: 'Ataque Amplo', resumo: 'Aplica dano a uma segunda criatura ao seu alcance.' },
  { nome: 'Ataque Avançado', resumo: 'Aumenta em 1,5 m o alcance do ataque corpo a corpo.' },
  { nome: 'Ataque de Manobra', resumo: 'Um aliado se move sem provocar ataque de oportunidade.' },
  { nome: 'Ataque Desarmante', resumo: 'O alvo faz salvaguarda de Força ou derruba o que segura.' },
  { nome: 'Ataque Empurrão', resumo: 'Empurra o alvo até 4,5 m para longe.' },
  { nome: 'Ataque Enganador', resumo: 'Ação bônus: vantagem no próximo ataque contra a criatura.' },
  { nome: 'Ataque Preciso', resumo: 'Soma o dado de superioridade à jogada de ataque.' },
  { nome: 'Ataque Provocador', resumo: 'O alvo tem desvantagem para atacar quem não seja você.' },
  { nome: 'Ataque Rasteira', resumo: 'O alvo faz salvaguarda de Força ou cai Caído.' },
  { nome: 'Avaliação Tática', resumo: 'Soma o dado a um teste de História, Intuição ou Investigação.' },
  { nome: 'Emboscada', resumo: 'Soma o dado à iniciativa ou a um teste de Furtividade.' },
  {
    nome: 'Golpe Comandado',
    resumo:
      'Abre mão de um dos seus ataques e gasta a ação bônus; um aliado usa a reação dele para atacar, somando o dado ao dano.',
  },
  { nome: 'Isca e Troca', resumo: 'Troca de lugar com um aliado adjacente e dá CA extra a um dos dois.' },
  { nome: 'Manobra de Agarrão', resumo: 'Soma o dado ao teste e tenta Agarrar o alvo.' },
  { nome: 'Passos Evasivos', resumo: 'Soma o dado à CA enquanto se move.' },
  { nome: 'Presença Imponente', resumo: 'Soma o dado a um teste de Intimidação, Atuação ou Persuasão.' },
  { nome: 'Resposta', resumo: 'Reação: ataca quem errou um golpe corpo a corpo em você.' },
  { nome: 'Reunir', resumo: 'Ação bônus: dá pontos de vida temporários a um aliado.' },
]

export const TRACOS_DE_SUBCLASSE: Record<string, TracoClasse[]> = {
  // --- Guerreiro -----------------------------------------------------------
  'Mestre de Batalha (Battle Master)': [
    T(3, 'Superioridade em Combate', 'Quatro dados de superioridade d8, recuperados em descanso curto.'),
    T(3, 'Manobras', 'Aprende 3 manobras.', { tipo: 'escolha', oque: 'manobra', quantidade: 3 }),
    T(3, 'Estudante da Guerra', 'Proficiência em uma ferramenta de artesão e uma perícia.'),
    T(7, 'Conheça o Inimigo', 'Aprende mais 2 manobras e ganha um dado de superioridade.', {
      tipo: 'escolha',
      oque: 'manobra',
      quantidade: 2,
    }),
    T(10, 'Superioridade Aprimorada', 'Os dados de superioridade viram d10. Mais 2 manobras.', {
      tipo: 'escolha',
      oque: 'manobra',
      quantidade: 2,
    }),
    T(15, 'Implacável', 'Sempre tem ao menos um dado de superioridade ao rolar iniciativa. Mais 2 manobras.', {
      tipo: 'escolha',
      oque: 'manobra',
      quantidade: 2,
    }),
    T(18, 'Superioridade Suprema', 'Os dados de superioridade viram d12.'),
  ],
  'Campeão (Champion)': [
    T(3, 'Crítico Aprimorado', 'Acerto crítico com 19 ou 20.'),
    T(3, 'Atleta Notável', 'Soma metade do PB a testes de Força, Destreza e Constituição.'),
    T(7, 'Estilo de Luta Adicional', 'Escolha um segundo estilo de luta.', {
      tipo: 'escolha',
      oque: 'estiloDeLuta',
      quantidade: 1,
    }),
    T(10, 'Guerreiro Heroico', 'Ganha Inspiração Heroica no começo de cada turno em que não a tenha.'),
    T(15, 'Crítico Superior', 'Acerto crítico com 18, 19 ou 20.'),
    T(18, 'Sobrevivente', 'Recupera vida no início de cada turno enquanto estiver ferido.'),
  ],
  'Cavaleiro Arcano (Eldritch Knight)': [
    T(3, 'Conjuração', 'Aprende magias de Mago, usando Inteligência.'),
    T(3, 'Vínculo de Guerra', 'Vincula-se a uma arma e a invoca à mão.'),
    T(7, 'Magia de Guerra', 'Conjura um truque e ataca com uma arma no mesmo turno.'),
    T(10, 'Golpe Místico', 'Quem você acerta tem desvantagem na próxima salvaguarda contra sua magia.'),
    T(15, 'Investida Arcana', 'Teleporta-se até 9 m ao usar Surto de Ação.'),
    T(18, 'Magia de Guerra Aprimorada', 'Conjura uma magia de nível 1 ou 2 e ataca no mesmo turno.'),
  ],
  'Guerreiro Psiônico (Psi Warrior)': [
    T(3, 'Poder Psiônico', 'Dados de energia psiônica para escudo, golpe e telecinese.'),
    T(7, 'Adepto Telecinético', 'Empurra com a mente e teleporta a si e a um aliado.'),
    T(10, 'Mente Guardada', 'Resistência a dano psíquico e sai de amedrontado ou enfeitiçado.'),
    T(15, 'Baluarte de Força', 'Dá cobertura mágica a você e aliados por perto.'),
    T(18, 'Mestre Telecinético', 'Mantém Mão Telecinética e ganha ataque extra com ela.'),
  ],

  // --- Bárbaro -------------------------------------------------------------
  'Caminho do Berserker (Path of the Berserker)': [
    T(3, 'Fúria Insana', 'Ataque bônus ao entrar em fúria.'),
    T(6, 'Presença Aterradora', 'Amedronta inimigos ao seu redor durante a fúria.'),
    T(10, 'Retaliação', 'Reação para atacar quem te machucou.'),
    T(14, 'Fúria Inabalável', 'A fúria continua mesmo quando você deveria cair.'),
  ],
  'Caminho do Coração Selvagem (Path of the Wild Heart)': [
    T(3, 'Falar com Feras', 'Comunica-se com animais e ganha benefícios de espírito animal.'),
    T(6, 'Aspecto da Natureza', 'Ganha um traço permanente de besta.'),
    T(10, 'Andarilho Espiritual', 'Conjura Comunhão com a Natureza como ritual.'),
    T(14, 'Ataque Ampliado', 'Os espíritos afetam mais aliados.'),
  ],
  'Caminho da Árvore do Mundo (Path of the World Tree)': [
    T(3, 'Vida da Árvore', 'Ganha vida temporária ao entrar em fúria.'),
    T(6, 'Ramos da Árvore', 'Puxa criaturas com raízes espectrais.'),
    T(10, 'Batalha da Árvore', 'Dá vida temporária a aliados.'),
    T(14, 'Salto entre Mundos', 'Teleporta a si e a aliados entre planos.'),
  ],
  'Caminho do Zelote (Path of the Zealot)': [
    T(3, 'Fúria Divina', 'Dano extra necrótico ou radiante durante a fúria.'),
    T(3, 'Guerreiro do Além', 'Ressuscitar você custa menos e não precisa de componente caro.'),
    T(6, 'Fervor Zeloso', 'Vantagem em iniciativa.'),
    T(10, 'Presença Zelota', 'Grito que impõe desvantagem a inimigos.'),
    T(14, 'Fúria do Além', 'Continua lutando por um turno mesmo com 0 pontos de vida.'),
  ],

  // --- Ladino --------------------------------------------------------------
  'Ladrão (Thief)': [
    T(3, 'Mãos Rápidas', 'Usa a Ação Ardilosa para manipular objetos e ferramentas.'),
    T(3, 'Trabalho em Altura', 'Escala mais rápido e salta mais longe.'),
    T(9, 'Supremo Furtivo', 'Vantagem em furtividade quando se move devagar.'),
    T(13, 'Usar Dispositivo Mágico', 'Usa itens mágicos de qualquer classe.'),
    T(17, 'Ladrão Reflexo', 'Um turno extra na primeira rodada de combate.'),
  ],
  'Assassino (Assassin)': [
    T(3, 'Assassinar', 'Vantagem contra quem ainda não agiu e dano extra na surpresa.'),
    T(3, 'Kit de Disfarces', 'Proficiência com kits de disfarce e envenenador.'),
    T(9, 'Infiltrador', 'Cria identidades falsas convincentes.'),
    T(13, 'Impostor', 'Imita fala e escrita de outra pessoa.'),
    T(17, 'Golpe Mortal', 'Dobra o dano contra alvos que não agiram.'),
  ],
  'Trapaceiro Arcano (Arcane Trickster)': [
    T(3, 'Conjuração', 'Aprende magias de Mago, usando Inteligência.'),
    T(3, 'Mão Ladina', 'Usa Mão Mágica de forma invisível para roubar e ativar coisas.'),
    T(9, 'Emboscada Mágica', 'Desvantagem nas salvaguardas contra suas magias quando escondido.'),
    T(13, 'Trapaceiro Versátil', 'Distrai um alvo com a Mão Mágica para ganhar vantagem.'),
    T(17, 'Ladrão de Feitiços', 'Rouba o conhecimento de uma magia de um conjurador.'),
  ],
  'Lâmina da Alma (Soulknife)': [
    T(3, 'Lâminas Psíquicas', 'Cria lâminas de energia mental para atacar.'),
    T(3, 'Poder Psiônico', 'Dados psiônicos para reforçar testes e teleporte.'),
    T(9, 'Véu Psíquico', 'Fica invisível por um tempo.'),
    T(13, 'Comunicação Rápida', 'Fala mente a mente a grande distância.'),
    T(17, 'Lâminas Rasgadoras', 'Dano extra e crítico mais fácil com as lâminas.'),
  ],

  'Colégio da Dança (College of Dance)': [
    T(3, 'Passos Ágeis', 'Sem armadura, sua CA melhora e o deslocamento aumenta.'),
    T(3, 'Arma Dançante', 'Ataca com Destreza ou Carisma usando a inspiração como dado de dano.'),
    T(6, 'Bailado Inspirador', 'A inspiração também move e protege quem a recebe.'),
    T(14, 'Ritmo Perene', 'Reduz dano de queda e desvia ataques com a dança.'),
  ],
  'Colégio do Glamour (College of Glamour)': [
    T(3, 'Manto de Inspiração', 'Vida temporária e movimento livre para vários aliados.'),
    T(3, 'Presença Encantadora', 'Encanta quem escuta a sua atuação.'),
    T(6, 'Deslumbrar', 'Amedronta ou enfeitiça criaturas próximas.'),
    T(14, 'Majestade Inquestionável', 'Quem tenta atacar você precisa passar numa salvaguarda.'),
  ],
  'Colégio do Saber (College of Lore)': [
    T(3, 'Proficiências Extras', 'Três perícias novas à sua escolha.'),
    T(3, 'Palavras Cortantes', 'Reação: gasta inspiração para estragar o ataque de um inimigo.'),
    T(6, 'Segredos Mágicos', 'Aprende magias de qualquer classe.'),
    T(14, 'Palavras Cortantes Aprimoradas', 'A reação também atrapalha salvaguardas.'),
  ],
  'Colégio da Bravura (College of Valor)': [
    T(3, 'Treinamento Marcial', 'Armas marciais, armadura média e escudo.'),
    T(3, 'Inspiração de Combate', 'A inspiração vira dano extra ou CA para o aliado.'),
    T(6, 'Ataque Extra', 'Ataca duas vezes ao usar a ação de Ataque.', { tipo: 'ataquesExtras', total: 2 }),
    T(14, 'Ataque Inspirador', 'Ao gastar inspiração, um aliado ataca de imediato.'),
  ],
  'Patrono Arquifada (Archfey Patron)': [
    T(3, 'Passos das Fadas', 'Teleporta-se curtas distâncias várias vezes por descanso.'),
    T(6, 'Ardil Feérico', 'O teleporte também deixa você invisível ou desloca outra criatura.'),
    T(10, 'Refúgio Feérico', 'Escapa de dano recuando para o reino das fadas.'),
    T(14, 'Passos Sombrios das Fadas', 'Teleporta com muito mais alcance e frequência.'),
  ],
  'Patrono Celestial (Celestial Patron)': [
    T(3, 'Luz Curativa', 'Poço de dados de cura para você e aliados.'),
    T(3, 'Truques Radiantes', 'Aprende Chama Sagrada e Luz.'),
    T(6, 'Alma Radiante', 'Soma o Carisma ao dano de fogo e radiante das suas magias.'),
    T(10, 'Resiliência Celestial', 'Vida temporária para o grupo a cada descanso.'),
    T(14, 'Golpe Purificador', 'Dano radiante extra que também cega o alvo.'),
  ],
  'Patrono Corruptor (Fiend Patron)': [
    T(3, 'Bênção Sombria', 'Vida temporária sempre que reduz uma criatura a 0.'),
    T(6, 'Sorte do Corruptor', 'Gasta um dado extra para salvar uma rolagem ruim.'),
    T(10, 'Resistência Infernal', 'Resistência a um tipo de dano à sua escolha.'),
    T(14, 'Desejo Sombrio', 'O patrono realiza um pedido perigoso.'),
  ],
  'Patrono Grande Antigo (Great Old One Patron)': [
    T(3, 'Mente Estilhaçada', 'Reação psíquica contra quem machuca você.'),
    T(3, 'Fala Telepática', 'Conversa mentalmente a distância.'),
    T(6, 'Sussurros Clarividentes', 'Lê pensamentos e arranca informação de mentes próximas.'),
    T(10, 'Escudo Etéreo', 'Resistência a dano psíquico e reflexo do dano recebido.'),
    T(14, 'Criar Servo', 'Domina permanentemente uma criatura enfraquecida.'),
  ],
  'Domínio da Vida (Life Domain)': [
    T(3, 'Discípulo da Vida', 'Toda cura sua recupera pontos de vida adicionais.'),
    T(3, 'Magias de Domínio', 'Bênção e Curar Ferimentos sempre preparadas.'),
    T(6, 'Curandeiro Abençoado', 'Curar alguém também cura você.'),
    T(17, 'Cura Suprema', 'Suas curas usam sempre o valor máximo dos dados.'),
  ],
  'Domínio da Luz (Light Domain)': [
    T(3, 'Chama Protetora', 'Reação que impõe desvantagem a um ataque contra você.'),
    T(3, 'Magias de Domínio', 'Luz e magias de fogo sempre preparadas.'),
    T(6, 'Chama Ardente', 'As suas explosões podem poupar aliados.'),
    T(17, 'Coroa de Luz', 'Aura que cega inimigos e impõe desvantagem.'),
  ],
  'Domínio da Trapaça (Trickery Domain)': [
    T(3, 'Bênção do Trapaceiro', 'Dá vantagem em furtividade a um aliado.'),
    T(3, 'Invocar Duplicata', 'Cria uma cópia ilusória de si mesmo.'),
    T(6, 'Duplicata Aprimorada', 'Cria mais de uma cópia por vez.'),
    T(17, 'Ilusão Improvisada', 'Conjura ilusões sem preparar.'),
  ],
  'Domínio da Guerra (War Domain)': [
    T(3, 'Sacerdote de Guerra', 'Ataque bônus com arma depois de atacar.'),
    T(3, 'Bênção Guiada', 'Canaliza Divindade para somar +10 a um ataque.'),
    T(6, 'Bênção do Deus da Guerra', 'Reação que soma bônus ao ataque de um aliado.'),
    T(17, 'Avatar da Batalha', 'Resistência a dano físico de armas não mágicas.'),
  ],
  'Círculo da Terra (Circle of the Land)': [
    T(3, 'Magias do Terreno', 'Magias extras conforme o bioma escolhido.'),
    T(3, 'Recuperação Natural', 'Recupera espaços de magia num descanso curto.'),
    T(6, 'Passo Natural', 'Terreno difícil natural não atrapalha você.'),
    T(10, 'Aura do Terreno', 'Área ao seu redor com efeito do bioma.'),
    T(14, 'Aura Aprimorada', 'A aura fica maior e mais forte.'),
  ],
  'Círculo da Lua (Circle of the Moon)': [
    T(3, 'Formas de Combate', 'Transforma-se em feras de combate mais fortes.'),
    T(3, 'Forma Selvagem Bônus', 'Transforma-se como ação bônus.'),
    T(6, 'Golpes Primordiais', 'Os ataques da forma contam como mágicos.'),
    T(10, 'Forma Elemental', 'Transforma-se em elemental.'),
    T(14, 'Poder Lunar', 'Cura a si mesmo e melhora a forma.'),
  ],
  'Círculo do Mar (Circle of the Sea)': [
    T(3, 'Fúria do Mar', 'Aura de tempestade que fere quem se aproxima.'),
    T(6, 'Vaga Ascendente', 'A aura também empurra e derruba.'),
    T(10, 'Presente do Mar', 'Nada e respira sob a água sem esforço.'),
    T(14, 'Ressaca', 'A aura fica maior e puxa criaturas para dentro.'),
  ],
  'Círculo das Estrelas (Circle of the Stars)': [
    T(3, 'Mapa Estelar', 'Um mapa mágico com magias de orientação.'),
    T(3, 'Forma Estelar', 'Assume constelação de Arqueiro, Cálice ou Dragão.'),
    T(6, 'Constelações Cósmicas', 'Cada forma ganha um efeito adicional.'),
    T(10, 'Vislumbre Estelar', 'Resistência a dano enquanto na forma.'),
    T(14, 'Presságio Fulgurante', 'Impõe vantagem ou desvantagem a quem estiver perto.'),
  ],
  'Feitiçaria Aberrante (Aberrant Sorcery)': [
    T(3, 'Mente Psiônica', 'Fala telepaticamente e conjura sem componentes.'),
    T(3, 'Magias Psiônicas', 'Magias mentais sempre conhecidas.'),
    T(6, 'Feitiçaria Psiônica', 'Gasta pontos de feitiçaria para conjurá-las sem espaço.'),
    T(14, 'Revelação no Caos', 'Efeito extra ao usar Metamagia.'),
    T(18, 'Ápice Aberrante', 'Resistência a dano psíquico e efeito mental ampliado.'),
  ],
  'Feitiçaria Mecânica (Clockwork Sorcery)': [
    T(3, 'Restaurar o Equilíbrio', 'Anula vantagem ou desvantagem alheia.'),
    T(3, 'Magias da Ordem', 'Magias de proteção e ordem sempre conhecidas.'),
    T(6, 'Cavalgada do Caos', 'Aura que estabiliza rolagens do grupo.'),
    T(14, 'Trancar a Engrenagem', 'Impede efeitos mágicos de alterar o alvo.'),
    T(18, 'Cadência Perfeita', 'Rolagens de dano das suas magias saem no valor máximo.'),
  ],
  'Feitiçaria Dracônica (Draconic Sorcery)': [
    T(3, 'Resiliência Dracônica', 'Mais pontos de vida e CA natural sem armadura.'),
    T(3, 'Magias Dracônicas', 'Magias elementais sempre conhecidas.'),
    T(6, 'Afinidade Elemental', 'Soma o Carisma ao dano do seu elemento.'),
    T(14, 'Asas de Dragão', 'Ganha voo permanente.'),
    T(18, 'Presença Dracônica', 'Aura que amedronta ou encanta ao redor.'),
  ],
  'Feitiçaria Selvagem (Wild Magic Sorcery)': [
    T(3, 'Surto de Magia Selvagem', 'Efeitos aleatórios podem disparar ao conjurar.'),
    T(3, 'Marés do Caos', 'Vantagem numa rolagem, ao custo de provocar um surto.'),
    T(6, 'Curvar a Sorte', 'Gasta pontos para alterar a rolagem de outra criatura.'),
    T(14, 'Caos Controlado', 'Rola duas vezes na tabela de surtos e escolhe.'),
    T(18, 'Surto Convocado', 'Provoca um surto de propósito, quando quiser.'),
  ],
  'Abjurador (Abjurer)': [
    T(3, 'Proteção Arcana', 'Escudo de energia que absorve dano e se recarrega.'),
    T(3, 'Savant da Abjuração', 'Copia magias de abjuração mais rápido e barato.'),
    T(6, 'Projetar Proteção', 'Estende o escudo a um aliado.'),
    T(10, 'Resistência à Magia', 'Vantagem em salvaguardas contra magia.'),
    T(14, 'Dissipação Aprimorada', 'Dissipar Magia atinge várias criaturas.'),
  ],
  'Adivinho (Diviner)': [
    T(3, 'Presságio', 'Guarda rolagens para substituir dados depois.'),
    T(3, 'Savant da Adivinhação', 'Copia magias de adivinhação mais rápido e barato.'),
    T(6, 'Adivinhação Ágil', 'Recupera espaço de magia ao conjurar adivinhação.'),
    T(10, 'Presságio Ampliado', 'Ganha um terceiro dado de presságio.'),
    T(14, 'Terceira Visão', 'Enxerga o invisível e o etéreo.'),
  ],
  'Evocador (Evoker)': [
    T(3, 'Evocação Potente', 'Dano mínimo garantido mesmo quando o alvo resiste.'),
    T(3, 'Savant da Evocação', 'Copia magias de evocação mais rápido e barato.'),
    T(6, 'Evocação Esculpida', 'Aliados escapam ilesos das suas áreas.'),
    T(10, 'Truque Potencializado', 'Truques causam metade do dano mesmo quando erram.'),
    T(14, 'Sobrecarga', 'Uma magia por descanso sai com dano máximo.'),
  ],
  'Ilusionista (Illusionist)': [
    T(3, 'Ilusão Improvisada', 'Conjura Ilusão Menor como ação bônus.'),
    T(3, 'Savant da Ilusão', 'Copia magias de ilusão mais rápido e barato.'),
    T(6, 'Ilusão Maleável', 'Muda a ilusão sem reconjurar.'),
    T(10, 'Eu Ilusório', 'Reação: uma ilusão recebe o ataque no seu lugar.'),
    T(14, 'Realidade Ilusória', 'Parte da ilusão vira real por um minuto.'),
  ],
  'Guerreiro da Mão Aberta (Warrior of the Open Hand)': [
    T(3, 'Técnica da Mão Aberta', 'Derruba, empurra ou nega reação ao acertar.'),
    T(6, 'Bem-Estar Corporal', 'Cura a si mesmo gastando foco.'),
    T(11, 'Tranquilidade', 'Aura de paz que dificulta ser atacado.'),
    T(17, 'Palma Trêmula', 'Golpe que pode reduzir o alvo a 0 pontos de vida.'),
  ],
  'Guerreiro das Sombras (Warrior of Shadow)': [
    T(3, 'Artes das Sombras', 'Cria escuridão e enxerga dentro dela.'),
    T(6, 'Passo das Sombras', 'Teleporta-se de uma sombra a outra com vantagem.'),
    T(11, 'Manto de Sombras', 'Fica invisível na penumbra.'),
    T(17, 'Manto Opaco', 'Invisibilidade e escuridão que seguem você.'),
  ],
  'Guerreiro dos Elementos (Warrior of the Elements)': [
    T(3, 'Sintonia Elemental', 'Golpes elementais com alcance ampliado.'),
    T(6, 'Explosão Elemental', 'Área de dano do seu elemento.'),
    T(11, 'Rajada Estendida', 'O alcance elemental cresce ainda mais.'),
    T(17, 'Epítome dos Elementos', 'Mantém a sintonia sem gastar foco.'),
  ],
  'Guerreiro da Misericórdia (Warrior of Mercy)': [
    T(3, 'Mão de Cura', 'Cura uma criatura gastando foco.'),
    T(3, 'Mão de Dano', 'Dano necrótico extra e envenena o alvo.'),
    T(6, 'Toque Físico', 'A cura também remove uma condição.'),
    T(11, 'Mãos Hábeis', 'Cura e fere na mesma ação.'),
    T(17, 'Mão de Misericórdia Suprema', 'Pode matar ou ressuscitar com um toque.'),
  ],
  'Juramento da Devoção (Oath of Devotion)': [
    T(3, 'Arma Sagrada', 'A arma brilha e soma o Carisma ao ataque.'),
    T(3, 'Magias de Juramento', 'Proteção contra o Mal e Santuário sempre preparadas.'),
    T(7, 'Aura de Devoção', 'Você e aliados perto ficam imunes a Enfeitiçado.'),
    T(15, 'Repreensão Inspiradora', 'Dano radiante que também cura aliados.'),
    T(20, 'Nimbo Sagrado', 'Aura de luz que fere inimigos por rodada.'),
  ],
  'Juramento da Glória (Oath of Glory)': [
    T(3, 'Atleta Divino', 'Melhora a corrida, o salto e o atletismo do grupo.'),
    T(3, 'Golpe Vitorioso', 'Dano extra e desvantagem ao alvo.'),
    T(7, 'Aura de Ímpeto', 'Aliados por perto ganham deslocamento.'),
    T(15, 'Glória Inigualável', 'Vida temporária ao começar o combate.'),
    T(20, 'Campeão Lendário', 'Vira uma lenda viva, com bônus permanentes.'),
  ],
  'Juramento dos Anciões (Oath of the Ancients)': [
    T(3, 'Ira da Natureza', 'Prende inimigos com raízes espectrais.'),
    T(3, 'Magias de Juramento', 'Magias da natureza sempre preparadas.'),
    T(7, 'Aura de Proteção Ancestral', 'Aliados perto sofrem metade do dano de magia.'),
    T(15, 'Sentinela Eterna', 'Envelhece muito devagar e resiste a encantamento.'),
    T(20, 'Campeão Ancestral', 'Regenera e desfaz magias ao redor.'),
  ],
  'Juramento da Vingança (Oath of Vengeance)': [
    T(3, 'Voto de Inimizade', 'Vantagem nos ataques contra um alvo escolhido.'),
    T(3, 'Magias de Juramento', 'Enfeitiçar Pessoa e Marca do Caçador sempre preparadas.'),
    T(7, 'Perseguidor Implacável', 'Impede o alvo de fugir de você.'),
    T(15, 'Alma Inabalável', 'Não pode ser Amedrontado nem Paralisado.'),
    T(20, 'Anjo Vingador', 'Ganha asas e aura de medo.'),
  ],
  'Mestre das Feras (Beast Master)': [
    T(3, 'Companheiro Primordial', 'Um animal que luta ao seu lado e sobe de nível com você.'),
    T(7, 'Vínculo Excepcional', 'O companheiro ataca melhor e resiste mais.'),
    T(11, 'Fúria Bestial', 'O companheiro ataca duas vezes.'),
    T(15, 'Compartilhar Magias', 'As suas magias de toque alcançam o companheiro.'),
  ],
  'Andarilho Feérico (Fey Wanderer)': [
    T(3, 'Dádiva Feérica', 'Dano psíquico extra e vantagem social.'),
    T(3, 'Magias Feéricas', 'Magias de encantamento sempre preparadas.'),
    T(7, 'Passo Ardiloso', 'Amedronta ou enfeitiça quem você acerta.'),
    T(11, 'Reencontro Feérico', 'Teleporta-se junto com aliados.'),
    T(15, 'Mistificação Feérica', 'Impõe confusão a criaturas próximas.'),
  ],
  'Perseguidor Sombrio (Gloom Stalker)': [
    T(3, 'Perito das Sombras', 'Visão no escuro melhor, e some no escuro.'),
    T(3, 'Golpe Sombrio', 'Iniciativa maior e um ataque extra na primeira rodada.'),
    T(7, 'Mente Nublada', 'Vantagem contra magia de adivinhação e encantamento.'),
    T(11, 'Presença Aterradora', 'Amedronta quem você acerta.'),
    T(15, 'Sombra Fugidia', 'Esconde-se como ação bônus, mesmo pouco encoberto.'),
  ],
  'Caçador (Hunter)': [
    T(3, 'Presa do Caçador', 'Bônus contra hordas ou contra alvos grandes.'),
    T(7, 'Táticas Defensivas', 'Defesa escolhida contra o tipo de ameaça que enfrenta.'),
    T(11, 'Múltiplos Ataques', 'Atinge mais alvos por turno.'),
    T(15, 'Superioridade do Caçador', 'Esquiva e resistência aprimoradas.'),
  ],
}

/** Traços de uma subclasse (lista vazia quando ainda não catalogada). */
export function tracosDaSubclasse(subclasse: string): TracoClasse[] {
  return TRACOS_DE_SUBCLASSE[subclasse] ?? []
}

/** A subclasse já está no catálogo? A ficha avisa quando não está. */
export function subclasseCatalogada(subclasse: string): boolean {
  return subclasse in TRACOS_DE_SUBCLASSE
}
