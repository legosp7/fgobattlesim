import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ServantExplorer } from '../components/ServantExplorer';

/**
 * Route wrapper so `/servants/:id` deep links directly into the same explorer UI.
 */
export function ServantDetailPage(): JSX.Element {
  const { id } = useParams();
  const initialServantId = useMemo(() => Number(id), [id]);

  if (!Number.isFinite(initialServantId)) {
    return <p className="error">Invalid servant id.</p>;
  }

  return <ServantExplorer initialServantId={initialServantId} showBackLink />;
}
