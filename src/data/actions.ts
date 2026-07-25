// Cheat sheet de ações — D&D 5.5e (regras de 2024).
// Ações gerais (que todo mundo pode usar) + ações típicas de cada classe.

export type TipoAcao = 'acao' | 'bonus' | 'reacao' | 'livre' | 'outro'

export interface AcaoInfo {
  nome: string
  tipo: TipoAcao
  resumo: string // explicação curta e direta, amigável a iniciantes
  nivel?: number // nível de classe em que costuma ser destravada
}

export const ROTULO_TIPO: Record<TipoAcao, { label: string; curto: string; cor: string }> = {
  acao: { label: 'Ação', curto: 'Ação', cor: 'text-dragon-400' },
  bonus: { label: 'Ação bônus', curto: 'Bônus', cor: 'text-amber-400' },
  reacao: { label: 'Reação', curto: 'Reação', cor: 'text-arcane-400' },
  livre: { label: 'Livre / no turno', curto: 'Livre', cor: 'text-emerald-400' },
  outro: { label: 'Outro', curto: 'Outro', cor: 'text-parchment-200/70' },
}

/** Ações que qualquer personagem pode usar no turno. */
export const ACOES_GERAIS: AcaoInfo[] = [
  { nome: 'Atacar', tipo: 'acao', resumo: 'Faça um ataque com arma ou desarmado. Alguns recursos permitem mais de um ataque por ação.' },
  { nome: 'Magia', tipo: 'acao', resumo: 'Conjure uma magia cujo tempo de conjuração seja 1 ação.' },
  { nome: 'Corrida', tipo: 'acao', resumo: 'Ganhe deslocamento extra igual ao seu deslocamento neste turno.' },
  { nome: 'Desengajar', tipo: 'acao', resumo: 'Seu movimento não provoca ataques de oportunidade neste turno.' },
  { nome: 'Esquiva', tipo: 'acao', resumo: 'Ataques contra você têm desvantagem e suas salvaguardas de Destreza têm vantagem, até seu próximo turno.' },
  { nome: 'Ajudar', tipo: 'acao', resumo: 'Dê vantagem a um aliado num teste, ou no próximo ataque dele contra um inimigo a até 1,5 m de você.' },
  { nome: 'Esconder-se', tipo: 'acao', resumo: 'Faça um teste de Furtividade (CD 15). Se passar, fica Invisível até ser notado, atacar ou conjurar.' },
  { nome: 'Procurar', tipo: 'acao', resumo: 'Busque algo ao redor: teste de Percepção, Intuição, Investigação, Medicina ou Sobrevivência.' },
  { nome: 'Estudar', tipo: 'acao', resumo: 'Recorde ou deduza informações: teste de Arcanismo, História, Investigação, Natureza ou Religião.' },
  { nome: 'Influenciar', tipo: 'acao', resumo: 'Convença, engane ou intimide alguém: Enganação, Intimidação, Atuação, Persuasão ou Adestrar Animais.' },
  { nome: 'Utilizar', tipo: 'acao', resumo: 'Use um objeto que exija uma ação (beber uma poção, puxar uma alavanca, acender uma tocha).' },
  { nome: 'Preparar', tipo: 'acao', resumo: 'Escolha um gatilho e uma resposta. Quando o gatilho ocorrer, você usa sua reação para agir.' },
  { nome: 'Agarrar', tipo: 'acao', resumo: 'Com um ataque desarmado: o alvo faz salvaguarda de Força ou Destreza (CD 8 + mod. FOR + prof.) ou fica Agarrado.' },
  { nome: 'Empurrar', tipo: 'acao', resumo: 'Com um ataque desarmado: o alvo faz salvaguarda ou é empurrado 1,5 m ou cai no chão.' },
  { nome: 'Interagir com um objeto', tipo: 'livre', resumo: 'Uma interação grátis por turno: sacar uma arma, abrir uma porta, pegar um item.' },
  { nome: 'Ataque de oportunidade', tipo: 'reacao', resumo: 'Quando um inimigo sai do seu alcance corpo a corpo, você pode atacá-lo com um ataque.' },
  { nome: 'Improvisar', tipo: 'outro', resumo: 'Tente qualquer coisa que faça sentido — o DM decide o teste e a dificuldade.' },
]

/**
 * Ações características de cada classe (as mais usadas em combate).
 * `nivel` indica quando o recurso costuma aparecer.
 */
export const ACOES_POR_CLASSE: Record<string, AcaoInfo[]> = {
  'Bárbaro': [
    { nome: 'Fúria', tipo: 'bonus', nivel: 1, resumo: 'Ganha dano extra em ataques de Força, resistência a dano contundente/cortante/perfurante e vantagem em testes de Força.' },
    { nome: 'Ataque Descuidado', tipo: 'livre', nivel: 2, resumo: 'No primeiro ataque do turno, ganhe vantagem — mas ataques contra você também têm vantagem até seu próximo turno.' },
    { nome: 'Sentido de Perigo', tipo: 'outro', nivel: 2, resumo: 'Vantagem em salvaguardas de Destreza contra efeitos que você consegue ver.' },
    { nome: 'Ataque Extra', tipo: 'livre', nivel: 5, resumo: 'Ataque duas vezes ao usar a ação Atacar.' },
  ],
  'Bardo': [
    { nome: 'Inspiração de Bardo', tipo: 'bonus', nivel: 1, resumo: 'Dê um dado a um aliado; ele soma ao teste, ataque ou salvaguarda que escolher.' },
    { nome: 'Refazer-se', tipo: 'outro', nivel: 2, resumo: 'Recupere usos de Inspiração de Bardo num descanso curto.' },
    { nome: 'Inspiração Marcial', tipo: 'outro', nivel: 3, resumo: 'Conforme a subclasse, use a inspiração para efeitos extras (Bravura, Dança, Saber…).' },
  ],
  'Bruxo': [
    { nome: 'Explosão Mística', tipo: 'acao', nivel: 1, resumo: 'Seu truque assinatura: ataque de magia à distância com dano de força (melhora muito com invocações).' },
    { nome: 'Invocações Místicas', tipo: 'outro', nivel: 1, resumo: 'Poderes permanentes que personalizam seu bruxo (ex: Lâmina Agonizante, Visão do Diabo).' },
    { nome: 'Recuperação de Pacto', tipo: 'outro', nivel: 1, resumo: 'Seus espaços de magia voltam num descanso curto — use-os sem medo.' },
  ],
  'Clérigo': [
    { nome: 'Canalizar Divindade', tipo: 'acao', nivel: 2, resumo: 'Poder divino recarregável: Expulsar Mortos-Vivos ou o efeito do seu domínio.' },
    { nome: 'Expulsar Mortos-Vivos', tipo: 'acao', nivel: 2, resumo: 'Mortos-vivos a até 9 m fazem salvaguarda de Sabedoria ou fogem por 1 minuto.' },
    { nome: 'Intervenção Divina', tipo: 'acao', nivel: 10, resumo: 'Peça ajuda direta à sua divindade para um efeito poderoso.' },
  ],
  'Druida': [
    { nome: 'Forma Selvagem', tipo: 'bonus', nivel: 2, resumo: 'Transforme-se em uma besta que você conheça, mantendo mente e alguns traços.' },
    { nome: 'Conjuração Primal', tipo: 'outro', nivel: 1, resumo: 'Prepare magias de druida diariamente; algumas podem ser lançadas como ritual.' },
  ],
  'Feiticeiro': [
    { nome: 'Metamagia', tipo: 'outro', nivel: 2, resumo: 'Modifique magias gastando Pontos de Feitiçaria (acelerar, duplicar, ampliar, sutil…).' },
    { nome: 'Pontos de Feitiçaria', tipo: 'bonus', nivel: 2, resumo: 'Converta pontos em espaços de magia (ou o contrário) durante a aventura.' },
    { nome: 'Feitiçaria Inata', tipo: 'outro', nivel: 1, resumo: 'Sua magia vem do sangue: não precisa de livro nem preparar tudo do zero.' },
  ],
  'Guerreiro': [
    { nome: 'Retomar o Fôlego', tipo: 'bonus', nivel: 1, resumo: 'Recupere pontos de vida rapidamente no meio da luta.' },
    { nome: 'Surto de Ação', tipo: 'livre', nivel: 2, resumo: 'Ganhe uma ação extra neste turno. Recarrega em descanso curto ou longo.' },
    { nome: 'Ataque Extra', tipo: 'livre', nivel: 5, resumo: 'Ataque duas vezes ao usar a ação Atacar (mais vezes em níveis altos).' },
    { nome: 'Estilo de Luta', tipo: 'outro', nivel: 1, resumo: 'Bônus permanente conforme seu jeito de lutar (arco, duas armas, defesa…).' },
  ],
  'Ladino': [
    { nome: 'Ataque Furtivo', tipo: 'livre', nivel: 1, resumo: 'Uma vez por turno, cause dano extra se tiver vantagem ou se um aliado estiver perto do alvo.' },
    { nome: 'Ação Ardilosa', tipo: 'bonus', nivel: 2, resumo: 'Use Corrida, Desengajar ou Esconder-se como ação bônus.' },
    { nome: 'Esquiva Sobrenatural', tipo: 'reacao', nivel: 5, resumo: 'Reduza pela metade o dano de um ataque que você consegue ver.' },
    { nome: 'Evasão', tipo: 'outro', nivel: 7, resumo: 'Em efeitos de área com salvaguarda de Destreza, sofra metade do dano — ou nenhum se passar.' },
  ],
  'Mago': [
    { nome: 'Recuperação Arcana', tipo: 'outro', nivel: 1, resumo: 'Recupere parte dos espaços de magia num descanso curto, uma vez por dia.' },
    { nome: 'Conjuração Ritual', tipo: 'outro', nivel: 1, resumo: 'Lance magias com a marca "ritual" sem gastar espaço (leva 10 min a mais).' },
    { nome: 'Livro de Magias', tipo: 'outro', nivel: 1, resumo: 'Aprenda novas magias copiando pergaminhos e grimórios que encontrar.' },
  ],
  'Monge': [
    { nome: 'Rajada de Golpes', tipo: 'bonus', nivel: 1, resumo: 'Gaste 1 ponto de Foco para fazer dois ataques desarmados extras.' },
    { nome: 'Defesa Paciente', tipo: 'bonus', nivel: 2, resumo: 'Gaste 1 ponto de Foco para usar Esquiva como ação bônus.' },
    { nome: 'Passo do Vento', tipo: 'bonus', nivel: 2, resumo: 'Gaste 1 ponto de Foco para Correr ou Desengajar como ação bônus (e pular mais longe).' },
    { nome: 'Golpe Atordoante', tipo: 'livre', nivel: 5, resumo: 'Ao acertar, gaste 1 Foco: o alvo faz salvaguarda de Constituição ou fica Atordoado.' },
    { nome: 'Aparar Projéteis', tipo: 'reacao', nivel: 3, resumo: 'Reduza o dano de um ataque à distância — e possivelmente devolva o projétil.' },
  ],
  'Paladino': [
    { nome: 'Imposição das Mãos', tipo: 'bonus', nivel: 1, resumo: 'Cure com o toque usando sua reserva de cura; também remove doença ou veneno.' },
    { nome: 'Destruição Divina', tipo: 'livre', nivel: 2, resumo: 'Ao acertar um ataque, gaste um espaço de magia para causar muito dano radiante extra.' },
    { nome: 'Canalizar Divindade', tipo: 'acao', nivel: 3, resumo: 'Poder do seu juramento (varia conforme a subclasse).' },
    { nome: 'Aura de Proteção', tipo: 'outro', nivel: 6, resumo: 'Você e aliados próximos somam seu mod. de Carisma nas salvaguardas.' },
  ],
  'Patrulheiro': [
    { nome: 'Marca do Caçador', tipo: 'bonus', nivel: 1, resumo: 'Marque um alvo: cause dano extra nele e tenha vantagem para rastreá-lo.' },
    { nome: 'Explorador Hábil', tipo: 'outro', nivel: 1, resumo: 'Especialidade em perícias e vantagens ao viajar e explorar.' },
    { nome: 'Ataque Extra', tipo: 'livre', nivel: 5, resumo: 'Ataque duas vezes ao usar a ação Atacar.' },
  ],
}

/** Retorna as ações da classe informada (vazio se não houver). */
export function acoesDaClasse(classe: string): AcaoInfo[] {
  return ACOES_POR_CLASSE[classe] ?? []
}
