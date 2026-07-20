import ComingSoon from './ComingSoon'

export default function BestiaryPage() {
  return (
    <ComingSoon
      icon="🐲"
      titulo="Bestiário"
      descricao="Fichas e fotos dos inimigos que o grupo vai enfrentar, com estatísticas visíveis para o DM."
      planejado={[
        'Cadastro de monstros com imagem, CA, PV, deslocamento e ações.',
        'Galeria com fotos dos inimigos para o DM revelar ao grupo na hora certa.',
        'Nível de desafio (ND) e dicas de tática para o DM.',
        'Rastreador de vida por inimigo, integrado ao combate no mapa.',
      ]}
    />
  )
}
