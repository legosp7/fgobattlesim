import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { PartyPage } from '../pages/PartyPage';
import { ServantDetailPage } from '../pages/ServantDetailPage';
import { ServantsPage } from '../pages/ServantsPage';
import { EnemiesPage } from '../pages/EnemiesPage';

export function AppRouter(): JSX.Element {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/servants" replace />} />
        <Route path="/servants" element={<ServantsPage />} />
        <Route path="/servants/:id" element={<ServantDetailPage />} />
        <Route path="/party" element={<PartyPage />} />
        <Route path="/enemies" element={<EnemiesPage />} />
      </Route>
    </Routes>
  );
}
