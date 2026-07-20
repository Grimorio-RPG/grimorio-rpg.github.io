import ComingSoon from './ComingSoon'

export default function CampaignPage() {
  return (
    <ComingSoon
      icon="📖"
      titulo="Campanha & Painel do DM"
      descricao="O centro de comando da mesa: resumo da história, NPCs, e a visão do DM sobre as fichas do grupo."
      planejado={[
        'Resumo da campanha e diário de sessões para todos acompanharem.',
        'Painel do DM com todas as fichas do grupo lado a lado.',
        'Cadastro de NPCs e locais importantes com anotações.',
        'Linha do tempo dos acontecimentos e ganchos de história.',
      ]}
    />
  )
}
