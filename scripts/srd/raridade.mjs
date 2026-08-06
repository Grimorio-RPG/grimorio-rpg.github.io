// Raridade sem regex.
//
// Duas armadilhas de substring: "common" está dentro de "uncommon", e "rare"
// dentro de "very rare". Com `\b` num template literal o JS entende backspace,
// não fronteira de palavra — e todo item saía sem raridade. Sem regex não há
// escape para errar.
export function raridadesDe(linhaTipo) {
  const l = linhaTipo.toLowerCase()
  const achadas = []

  if (l.includes('legendary')) achadas.push('Lendário')
  if (l.includes('very rare')) achadas.push('Muito raro')
  if (l.includes('uncommon')) achadas.push('Incomum')
  // "common" só conta depois de tirar os "uncommon" do caminho.
  if (l.split('uncommon').join('').includes('common')) achadas.push('Comum')
  // Mesma ideia para "rare" dentro de "very rare".
  if (l.split('very rare').join('').includes('rare')) achadas.push('Raro')

  return achadas
}

/** Preço em PO, pela tabela de raridade do SRD. */
export const PRECO_POR_RARIDADE = {
  'Comum': 100,
  'Incomum': 400,
  'Raro': 4000,
  'Muito raro': 40000,
  'Lendário': 200000,
}
