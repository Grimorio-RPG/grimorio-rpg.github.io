import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import CharactersPage from './pages/CharactersPage'
import CharacterWizard from './pages/CharacterWizard'
import CharacterSheet from './pages/CharacterSheet'
import SpellsPage from './pages/SpellsPage'
import BestiaryPage from './pages/BestiaryPage'
import BattlePage from './pages/BattlePage'
import MapPage from './pages/MapPage'
import WorldPage from './pages/WorldPage'
import CampaignPage from './pages/CampaignPage'
import DataPage from './pages/DataPage'
import MesaPage from './pages/MesaPage'
import EntrarPage from './pages/EntrarPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/fichas" replace />} />
        <Route path="fichas" element={<CharactersPage />} />
        <Route path="fichas/novo" element={<CharacterWizard />} />
        <Route path="fichas/:id" element={<CharacterSheet />} />
        <Route path="feiticos" element={<SpellsPage />} />
        <Route path="bestiario" element={<BestiaryPage />} />
        <Route path="batalhas" element={<BattlePage />} />
        <Route path="mapa" element={<MapPage />} />
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
