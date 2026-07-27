// Liga a nuvem quando o app abre.
//
// É seguro chamar sempre: sem as variáveis de ambiente nada acontece e o app
// segue em modo local.

import { assinarSessao, getConta, initSessao } from './auth'
import { nuvemConfigurada } from './config'
import { consumirConvitePendente } from './convite'
import { assinarMesa, entrarNaMesa, escolherMesa, getMesa, recarregarMesa } from './mesa'
import { acompanharMesa } from './rolagens'
import { sincronizarFichasDaConta } from './fichas'

let ligado = false

/**
 * Quem clicou num convite e entrou pelo Google volta do OAuth na página
 * inicial — o retorno não preserva a rota de hash. O código ficou guardado
 * antes da saída; aqui ele é usado.
 */
async function resolverConvitePendente() {
  const codigo = consumirConvitePendente()
  if (!codigo) return
  const r = await entrarNaMesa(codigo)
  // Leva para a campanha, que é o que a pessoa clicou para ver. Mexer no hash
  // direto evita arrastar o router para dentro desta camada.
  if (r.ok) location.hash = '#/campanha'
}

export function iniciarNuvem() {
  if (ligado || !nuvemConfigurada) return
  ligado = true

  let ultimoId: string | null = null
  assinarSessao(() => {
    const id = getConta()?.id ?? null
    if (id === ultimoId) return
    ultimoId = id
    // Ao sair da conta a mesa some da tela; ao entrar, ela é recarregada.
    if (id) {
      void recarregarMesa()
      void resolverConvitePendente()
      // As fichas são da pessoa, não do aparelho: ao entrar, o que estiver na
      // conta desce e o que estiver só aqui sobe.
      void sincronizarFichasDaConta()
    } else {
      escolherMesa(null)
    }
  })

  // O feed de rolagens segue a mesa escolhida.
  assinarMesa(() => {
    void acompanharMesa(getMesa()?.id ?? null)
  })

  void initSessao()
}
