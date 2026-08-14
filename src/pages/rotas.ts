// Onde mora cada tela, num lugar só.
//
// Duas coisas precisam da mesma lista: o roteador, para montar a tela, e o
// menu, para buscá-la antes do clique. Separar aqui evita as duas listas
// saírem de sincronia — e é o `import()` idêntico que faz o navegador
// reaproveitar o arquivo em vez de baixá-lo de novo.

/** Os `import()` crus. O menu adianta por aqui, sem efeito colateral nenhum. */
const IMPORTAR = {
  '/conta': () => import('./ContaPage'),
  '/fichas/novo': () => import('./CharacterWizard'),
  '/feiticos': () => import('./SpellsPage'),
  '/bestiario': () => import('./BestiaryPage'),
  '/batalhas': () => import('./BattlePage'),
  '/mundo': () => import('./WorldPage'),
  '/campanha': () => import('./CampaignPage'),
  '/mesa': () => import('./MesaPage'),
  '/dados': () => import('./DataPage'),
} as const

const MARCA_RECARGA = 'grimorio:recarregou-por-versao'

/**
 * Envolve um `import()` de tela para sobreviver a uma publicação no meio da
 * sessão.
 *
 * O nome de cada arquivo carrega um hash, e publicar uma versão nova apaga os
 * antigos. Quem estivesse com o app aberto pediria, ao trocar de aba, um
 * arquivo que não existe mais — tela em branco bem na hora do combate.
 * Recarregar busca o `index.html` novo, que aponta para os nomes certos.
 *
 * A marca na sessão impede o laço: se voltar quebrado depois da recarga, o erro
 * sobe de verdade em vez de recarregar para sempre. Ela sai no primeiro
 * carregamento que dá certo, para a proteção valer de novo na próxima vez.
 */
export function comRecargaSeSumiu<T>(carregar: () => Promise<T>): () => Promise<T> {
  return () =>
    carregar().then(
      (modulo) => {
        sessionStorage.removeItem(MARCA_RECARGA)
        return modulo
      },
      (erro) => {
        if (sessionStorage.getItem(MARCA_RECARGA)) throw erro
        sessionStorage.setItem(MARCA_RECARGA, '1')
        location.reload()
        // A recarga não é instantânea; esta promessa nunca resolve, e é o que
        // segura a tela de carregamento no lugar até a página trocar.
        return new Promise<T>(() => {})
      },
    )
}

/** O que o roteador usa: já com a recuperação de versão. */
export const CARREGADORES = Object.fromEntries(
  Object.entries(IMPORTAR).map(([caminho, fn]) => [caminho, comRecargaSeSumiu(fn)]),
) as { [K in keyof typeof IMPORTAR]: ReturnType<typeof comRecargaSeSumiu<Awaited<ReturnType<(typeof IMPORTAR)[K]>>>> }

/**
 * Busca a tela antes do clique.
 *
 * Passar o dedo por cima do menu (ou encostar nele, no celular) já basta: o
 * arquivo chega enquanto a pessoa decide, e a troca de aba fica instantânea.
 * Sem isto, dividir o pacote teria trocado uma espera longa na abertura por
 * várias esperas curtas no meio da sessão.
 *
 * Usa o `import()` cru de propósito: adiantar é um palpite, e um palpite não
 * pode recarregar a página debaixo de quem só passou o mouse. Se falhar aqui,
 * o clique de verdade passa pelo caminho que sabe se recuperar.
 */
export function precarregarRota(caminho: string): void {
  const carregar = IMPORTAR[caminho as keyof typeof IMPORTAR]
  if (carregar) void carregar().catch(() => {})
}
