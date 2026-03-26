import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fgoApi } from '../api/fgoApi';
import type { ServantSummary } from '../types/fgo';

/**
 * Shows all servants as links to detail pages.
 */
export function ServantsPage(): JSX.Element {
  const [servants, setServants] = useState<ServantSummary[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setServants(await fgoApi.listServants());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load servants.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groupedByClass = useMemo(() => {
    return servants.reduce<Record<string, ServantSummary[]>>((acc, servant) => {
      const key = servant.className || 'Unknown';
      acc[key] ??= [];
      acc[key].push(servant);
      return acc;
    }, {});
  }, [servants]);

  if (loading) return <p>Loading servants...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <h2>Servants</h2>
      {Object.entries(groupedByClass)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([className, classServants]) => (
          <section key={className}>
            <h3>{className}</h3>
            <ul>
              {classServants.map((servant) => (
                <li key={servant.id}>
                  <Link to={`/servants/${servant.id}`}>{servant.name}</Link> ({servant.rarity}★)
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
