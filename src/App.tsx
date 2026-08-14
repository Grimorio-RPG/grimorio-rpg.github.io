import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import CharactersPage from './pages/CharactersPage'
import { CARREGADORES, comRecargaSeSumiu } from './pages/rotas'

// Cada tela vira um arquivo à parte, buscado só quando alguém abre aquela aba.
//
// Antes tudo vinha num pacote só: quem clicava no link no celular para olhar a
// própria ficha baixava junto o bestiário, o mapa tático, o editor de mundo e a
// tela de batalha — telas que, sendo jogador, nunca vai abrir. Num 4G de mesa de
// jogo isso é a diferença entre abrir na hora e encarar a tela vazia.
//
// A lista de fichas fica de fora: é a porta de entrada, e adiar a porta de
// entrada só troca um download por dois.
//
// Os `import()` vêm de `rotas.ts`, os mesmos que o menu usa para adiantar a
// tela no passar do mouse — precisam ser a mesma expressão para o navegador
// reaproveitar o arquivo em vez de buscá-lo outra vez.
const ContaPage = lazy(CARREGADORES['/conta'])
const CharacterWizard = lazy(CARREGADORES['/fichas/novo'])
const SpellsPage = lazy(CARREGADORES['/feiticos'])
const BestiaryPage = lazy(CARREGADORES['/bestiario'])
const BattlePage = lazy(CARREGADORES['/batalhas'])
const WorldPage = lazy(CARREGADORES['/mundo'])
const CampaignPage = lazy(CARREGADORES['/campanha'])
const MesaPage = lazy(CARREGADORES['/mesa'])
const DataPage = lazy(CARREGADORES['/dados'])

// Estas duas não estão no menu: abrem por link, não por aba.
const CharacterSheet = lazy(comRecargaSeSumiu(() => import('./pages/CharacterSheet')))
const EntrarPage = lazy(comRecargaSeSumiu(() => import('./pages/EntrarPage')))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/fichas" replace />} />
        <Route path="conta" element={<ContaPage />} />
        <Route path="fichas" element={<CharactersPage />} />
        <Route path="fichas/novo" element={<CharacterWizard />} />
        <Route path="fichas/:id" element={<CharacterSheet />} />
        <Route path="feiticos" element={<SpellsPage />} />
        <Route path="bestiario" element={<BestiaryPage />} />
        <Route path="batalhas" element={<BattlePage />} />
        {/* A aba Mapa virou parte da Batalha. O endereço continua valendo:
            quem salvou o link ou fixou o atalho no celular cai no lugar certo. */}
        <Route path="mapa" element={<Navigate to="/batalhas" replace />} />
        <Route path="mundo" element={<WorldPage />} />
        <Route path="campanha" element={<CampaignPage />} />
        <Route path="mesa" element={<MesaPage />} />
        <Route path="entrar/:codigo" element={<EntrarPage />} />
        <Route path="dados" element={<DataPage />} />
        <Route path="*" element={<Navigate to="/fichas" replace />} />
      </Route>
    </Routes>
  )
}
