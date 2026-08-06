// Reconhece equipáveis no que veio da importação.
//
// O PDF do D&D Beyond entrega o inventário como linhas de texto em inglês:
// "Chain Mail", "Ring of Protection", "Longsword". Elas caíam na mochila de
// texto e paravam ali — quem importava a ficha tinha que recriar cada
// equipável à mão, item por item, com os efeitos.
//
// Aqui essas linhas viram equipamento de verdade, com os efeitos já traçados.
// O que não for reconhecido continua na mochila, intacto: inventar um efeito
// para "Corda de Cânhamo (15 m)" seria pior do que deixá-la como está.

import type { Equipamento, InventoryItem } from '../types'
import { doCatalogo } from '../data/itens-equipaveis'
import { uid } from './character'

/**
 * Inglês do D&D Beyond → o nome no nosso catálogo.
 *
 * Regex em vez de igualdade porque o PDF traz sujeira: quantidade colada,
 * qualificador entre parênteses, o "+1" em posições diferentes.
 */
const EQUIVALENTES: [RegExp, string][] = [
  // Armaduras
  [/\bpadded\b|acolchoada/i, 'Acolchoada'],
  [/\bstudded leather\b|couro batido/i, 'Couro Batido'],
  [/\bleather( armor)?\b|^couro$/i, 'Couro'],
  [/\bhide\b|peles/i, 'Peles'],
  [/\bchain shirt\b|camisão de malha/i, 'Camisão de Malha'],
  [/\bscale mail\b|gibão de peles/i, 'Gibão de Peles'],
  [/\bbreastplate\b|peitoral/i, 'Peitoral'],
  [/\bhalf plate\b|meia armadura/i, 'Meia Armadura'],
  [/\bring mail\b|cota de anéis/i, 'Cota de Anéis'],
  [/\bchain mail\b|cota de malha/i, 'Cota de Malha'],
  [/\bsplint\b|fragmentada/i, 'Fragmentada'],
  [/\bplate( armor)?\b|placas/i, 'Placas'],
  [/\bshield\b|escudo/i, 'Escudo'],

  // Mágicos comuns nos primeiros níveis
  [/ring of protection|anel de proteção/i, 'Anel de Proteção'],
  [/cloak of protection|manto de proteção/i, 'Manto de Proteção'],
  [/cloak of elvenkind|manto élfico/i, 'Manto Élfico'],
  [/boots of elvenkind|botas élficas/i, 'Botas Élficas'],
  [/boots of striding|passolargo/i, 'Botas de Passolargo e Salto'],
  [/belt of.*giant strength|cinto de força/i, 'Cinto de Força de Gigante da Colina'],
  [/amulet of health|amuleto de saúde/i, 'Amuleto de Saúde'],
  [/stone of good luck|luckstone|pedra da boa sorte/i, 'Pedra da Boa Sorte'],
  [/goggles of night|óculos da noite/i, 'Óculos da Noite'],
  [/helm of comprehending|elmo de compreensão/i, 'Elmo de Compreensão de Idiomas'],
  [/gloves of thievery|luvas de roubo/i, 'Luvas de Roubo'],
  [/bracers of defense|braçadeiras de defesa/i, 'Braçadeiras de Defesa'],
  [/flame tongue|espada flamejante/i, 'Espada Flamejante'],
  [/giant slayer|matadora de gigantes/i, 'Matadora de Gigantes'],
  [/dragon slayer|matadora de dragões/i, 'Matadora de Dragões'],

  // Armas comuns
  [/\blongsword\b|espada longa/i, 'Espada Longa'],
  [/\bshortsword\b|espada curta/i, 'Espada Curta'],
  [/\bgreatsword\b|espada grande/i, 'Espada Grande'],
  [/\bgreataxe\b|machado grande/i, 'Machado Grande'],
  [/\bhandaxe\b|machadinha/i, 'Machadinha'],
  [/\bbattleaxe\b|machado de batalha/i, 'Machado de Batalha'],
  [/\bwarhammer\b|martelo de guerra/i, 'Martelo de Guerra'],
  [/\bmace\b|maça/i, 'Maça'],
  [/\bquarterstaff\b|bordão/i, 'Bordão'],
  [/\bdagger\b|adaga/i, 'Adaga'],
  [/\brapier\b|florete/i, 'Florete'],
  [/\bscimitar\b|cimitarra/i, 'Cimitarra'],
  [/\bspear\b|lança/i, 'Lança'],
  [/\bglaive\b|glaive/i, 'Glaive'],
  [/\bhalberd\b|alabarda/i, 'Alabarda'],
  [/\blongbow\b|arco longo/i, 'Arco Longo'],
  [/\bshortbow\b|arco curto/i, 'Arco Curto'],
  [/light crossbow|besta leve/i, 'Besta Leve'],
  [/heavy crossbow|besta pesada/i, 'Besta Pesada'],
  [/hand crossbow|besta de mão/i, 'Besta de Mão'],
]

/** O nome no catálogo, se esta linha do inventário for algo equipável. */
export function nomeNoCatalogo(linha: string): string | null {
  // A ordem importa: "studded leather" tem de ser testada antes de "leather",
  // e a lista já está nessa ordem. `find` respeita isso.
  return EQUIVALENTES.find(([re]) => re.test(linha))?.[1] ?? null
}

/**
 * O sufixo mágico que o D&D Beyond cola no nome: "Longsword +1".
 *
 * Vira um bônus de verdade, senão a espada +1 importada seria uma espada
 * comum com um "+1" decorativo no nome.
 */
function bonusDoNome(linha: string): number {
  const m = linha.match(/\+\s*([123])\b/)
  return m ? Number(m[1]) : 0
}

export interface ResultadoDoReconhecimento {
  equipamentos: Equipamento[]
  /** O que sobrou, para continuar na mochila de texto. */
  inventario: InventoryItem[]
}

/**
 * Separa o inventário importado em equipáveis e o resto.
 *
 * Nada entra vestido. O PDF não diz de forma confiável o que a pessoa está
 * usando, e vestir por conta mudaria a CA dela sem aviso — melhor a mochila
 * cheia e um clique para vestir.
 */
export function reconhecerEquipaveis(
  inventario: InventoryItem[],
): ResultadoDoReconhecimento {
  const equipamentos: Equipamento[] = []
  const sobra: InventoryItem[] = []

  for (const item of inventario) {
    const nome = nomeNoCatalogo(item.nome)
    const base = nome ? doCatalogo(nome, uid()) : null
    if (!base) {
      sobra.push(item)
      continue
    }

    // O nome que a pessoa vê é o do PDF: ela reconhece "Longsword +1" como o
    // item dela, e "Espada Longa" genérica não.
    const equip: Equipamento = { ...base, nome: item.nome }

    const mais = bonusDoNome(item.nome)
    if (mais > 0) {
      const arma = base.slot === 'maoPrincipal' || base.slot === 'maoSecundaria'
      equip.efeitos = arma
        ? [...base.efeitos, { tipo: 'ataque', valor: mais }, { tipo: 'dano', valor: mais }]
        : [...base.efeitos, { tipo: 'ca', valor: mais }]
      equip.raridade = equip.raridade ?? 'Incomum'
    }

    // Duplicatas viram peças separadas: duas adagas são duas, e cada uma pode
    // ir para uma mão.
    const quantas = Math.max(1, Math.min(item.qtd || 1, 4))
    for (let i = 0; i < quantas; i++) {
      equipamentos.push(i === 0 ? equip : { ...equip, id: uid() })
    }
  }

  return { equipamentos, inventario: sobra }
}
