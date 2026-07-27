// Convite pendente — o código da mesa que sobrevive a uma ida ao Google.
//
// O link de convite é uma rota de hash (`#/entrar/ABC123`), e o retorno do
// OAuth não preserva o `#`: quem clicava no convite e entrava com o Google
// voltava logado, porém na página inicial, sem nunca ter entrado na mesa.
//
// Guardar o código antes de sair resolve sem depender do formato da URL de
// retorno. `sessionStorage` porque o convite morre com a aba — se a pessoa
// desistir, ele não fica assombrando o próximo login.

const CHAVE = 'grimorio55e.convitePendente'

export function guardarConvitePendente(codigo: string): void {
  try {
    sessionStorage.setItem(CHAVE, codigo.trim().toUpperCase())
  } catch {
    // Navegador em modo restrito: sem convite guardado, a pessoa ainda pode
    // digitar o código na aba Mesa.
  }
}

export function consumirConvitePendente(): string {
  try {
    const v = sessionStorage.getItem(CHAVE) ?? ''
    if (v) sessionStorage.removeItem(CHAVE)
    return v
  } catch {
    return ''
  }
}
