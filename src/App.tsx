import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import CharactersPage from './pages/CharactersPage'
import CharacterSheet from './pages/CharacterSheet'
import SpellsPage from './pages/SpellsPage'
import BestiaryPage from './pages/BestiaryPage'
import MapPage from './pages/MapPage'
import CampaignPage from './pages/CampaignPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/fichas" replace />} />
        <Route path="fichas" element={<CharactersPage />} />
        <Route path="fichas/:id" element={<CharacterSheet />} />
        <Route path="feiticos" element={<SpellsPage />} />
        <Route path="bestiario" element={<BestiaryPage />} />
        <Route path="mapa" element={<MapPage />} />
        <Route path="campanha" element={<CampaignPage />} />
        <Route path="*" element={<Navigate to="/fichas" replace />} />
      </Route>
    </Routes>
  )
}
