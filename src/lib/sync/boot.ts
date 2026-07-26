// Liga a nuvem quando o app abre.
//
// É seguro chamar sempre: sem as variáveis de ambiente nada acontece e o app
// segue em modo local.

import { assinarSessao, getConta, initSessao } from './auth'
import { nuvemConfigurada } from './config'
import { assinarMesa, escolherMesa, getMesa, recarregarMesa } from './mesa'
import { acompanharMesa } from './rolagens'

let ligado = false

export function iniciarNuvem() {
  if (ligado || !nuvemConfigurada) return
  ligado = true

  let ultimoId: string | null = null
  assinarSessao(() => {
    const id = getConta()?.id ?? null
    if (id === ultimoId) return
    ultimoId = id
    // Ao sair da conta a mesa some da tela; ao entrar, ela é recarregada.
    if (id) void recarregarMesa()
    else escolherMesa(null)
  })

  // O feed de rolagens segue a mesa escolhida.
  assinarMesa(() => {
    void acompanharMesa(getMesa()?.id ?? null)
  })

  void initSessao()
}
