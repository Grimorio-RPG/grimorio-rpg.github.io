import ComingSoon from './ComingSoon'

export default function MapPage() {
  return (
    <ComingSoon
      icon="🗺️"
      titulo="Mapa / Mesa Virtual"
      descricao="A mesa tática no estilo Owlbear: mapa, tokens dos personagens e inimigos, grade e medição."
      planejado={[
        'Upload de mapas e grade ajustável para posicionar personagens.',
        'Tokens arrastáveis para heróis e monstros, com barra de vida.',
        'Névoa de guerra: o DM revela áreas conforme o grupo explora.',
        'Medição de distância e alcance de magias diretamente no mapa.',
      ]}
    />
  )
}
