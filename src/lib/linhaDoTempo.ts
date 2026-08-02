// A crônica da campanha, numa linha só.
//
// Metade disto já existia, espalhada: sessões numa aba, marcos do mapa noutra,
// chefes derrubados no bestiário, entradas de estrada na crônica de viagem.
// Junto, vira a resposta para "o que já aconteceu nesta campanha?" — a pergunta
// que abre toda sessão depois de duas semanas de intervalo.
//
// Nada é guardado: a linha é montada na hora a partir do que já está salvo.
// Uma cópia própria só criaria uma segunda verdade para sair de sincronia.

import type { Campaign, Monster, MapaMundo } from '../types'

export type TipoMarco = 'sessao' | 'chefe' | 'lugar' | 'estrada' | 'recado'

export interface Marco {
  id: string
  tipo: TipoMarco
  titulo: string
  detalhe: string
  /** Para ordenar. Quando não há data, usa a ordem em que foi cadastrado. */
  em: number
  /** O texto de data que o DM escreveu, quando houver. */
  quando: string
}

const ICONES: Record<TipoMarco, string> = {
  sessao: '📅',
  chefe: '💀',
  lugar: '🗺️',
  estrada: '🧭',
  recado: '📌',
}

export function iconeDoMarco(t: TipoMarco): string {
  return ICONES[t]
}

/**
 * Monta a linha do tempo.
 *
 * `soDoGrupo` corta o que é bastidor — a mesma linha serve para a sua tela e
 * para a do grupo, e a diferença entre elas não pode depender de você lembrar
 * de esconder alguma coisa.
 */
export function montarLinhaDoTempo(
  campanha: Campaign | null,
  bestiario: Monster[],
  mapas: MapaMundo[],
  { soDoGrupo = false }: { soDoGrupo?: boolean } = {},
): Marco[] {
  const marcos: Marco[] = []
  if (!campanha) return marcos

  // Sessões: a espinha da campanha. Sem data legível, a ordem de cadastro
  // resolve — quem escreve "Sessão 3" já disse a ordem.
  campanha.sessoes.forEach((s, i) => {
    marcos.push({
      id: `sessao:${s.id}`,
      tipo: 'sessao',
      titulo: s.titulo || `Sessão ${i + 1}`,
      detalhe: s.resumo,
      em: i,
      quando: s.data,
    })
  })

  // Chefes derrubados. Só os que valem marco: riscar um goblin não conta
  // história nenhuma, e é a mesma régra que o bestiário usa.
  for (const m of bestiario) {
    if (!m.derrotado) continue
    if (m.categoria !== 'miniboss' && m.categoria !== 'boss' && m.categoria !== 'bbeg') continue
    marcos.push({
      id: `chefe:${m.id}`,
      tipo: 'chefe',
      titulo: `${m.nome} foi derrubado`,
      detalhe: '',
      em: m.updatedAt,
      quando: '',
    })
  }

  // Lugares revelados no mundo.
  for (const mapa of mapas) {
    if (soDoGrupo && !mapa.revelado) continue
    for (const p of mapa.pontos) {
      if (!p.revelado) continue
      marcos.push({
        id: `lugar:${p.id}`,
        tipo: 'lugar',
        titulo: p.nome,
        detalhe: p.descricao,
        em: mapa.atualizadoEm,
        quando: '',
      })
    }
  }

  // A crônica da estrada. As entradas de bastidor ficam de fora da versão do
  // grupo — o campo existe justamente para isso.
  for (const e of campanha.viagem.cronica) {
    if (soDoGrupo && e.soDm) continue
    marcos.push({
      id: `estrada:${e.id}`,
      tipo: 'estrada',
      titulo: e.local || `Dia ${e.dia}`,
      detalhe: e.texto,
      em: e.criadoEm,
      quando: `Dia ${e.dia}`,
    })
  }

  // Recados publicados. Rascunho é prep e não entra.
  for (const a of campanha.atualizacoes) {
    if (!a.publicado) continue
    marcos.push({
      id: `recado:${a.id}`,
      tipo: 'recado',
      titulo: a.titulo,
      detalhe: a.texto,
      em: a.criadoEm,
      quando: '',
    })
  }

  // Mais recente primeiro: é o que a mesa quer reler antes de começar.
  return marcos.sort((a, b) => b.em - a.em)
}
