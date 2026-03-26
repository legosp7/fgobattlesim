import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fgoApi } from '../api/fgoApi';
import { resolveStatForLevel } from '../lib/fgoMath';
import type { NoblePhantasm, ServantDetail } from '../types/fgo';

/**
 * Detail page for one servant (route: /servants/:id).
 */
export function ServantDetailPage(): JSX.Element {
  const { id } = useParams();
  const servantId = Number(id);

  const [servant, setServant] = useState<ServantDetail | null>(null);
  const [noblePhantasms, setNoblePhantasms] = useState<NoblePhantasm[]>([]);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!Number.isFinite(servantId)) {
      setError('Invalid servant id.');
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setError('');

        const detail = await fgoApi.getServant(servantId);
        setServant(detail);

        const npResults = await Promise.all(
          (detail.noblePhantasms ?? []).map(async (np) => {
            try {
              return await fgoApi.getNoblePhantasm(np.id);
            } catch {
              return np;
            }
          }),
        );
        setNoblePhantasms(npResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load servant detail.');
      } finally {
        setLoading(false);
      }
    })();
  }, [servantId]);

  const displayedAtk = useMemo(() => {
    if (!servant) return 0;
    return resolveStatForLevel(level, servant.atkGrowth, servant.atkBase, servant.atkMax, servant.lvMax);
  }, [level, servant]);

  const displayedHp = useMemo(() => {
    if (!servant) return 0;
    return resolveStatForLevel(level, servant.hpGrowth, servant.hpBase, servant.hpMax, servant.lvMax);
  }, [level, servant]);

  if (loading) return <p>Loading servant detail...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!servant) return <p className="error">Servant not found.</p>;

  return (
    <div className="card">
      <Link to="/servants">← Back to servants</Link>
      <h2>{servant.name}</h2>
      <p>
        {servant.className} • {servant.rarity}★
      </p>

      <label htmlFor="level">Level</label>
      <input
        id="level"
        type="range"
        min={1}
        max={servant.lvMax}
        value={level}
        onChange={(event) => setLevel(Number(event.target.value))}
      />
      <p>
        Selected level: {level} | ATK: {displayedAtk} | HP: {displayedHp}
      </p>

      <h3>Skills</h3>
      <ul>
        {servant.skills.map((skill) => (
          <li key={`${skill.num}-${skill.name}`}>
            Skill {skill.num}: {skill.name}
          </li>
        ))}
      </ul>

      <h3>Noble Phantasms</h3>
      <ul>
        {noblePhantasms.map((np) => (
          <li key={np.id}>
            <strong>{np.name}</strong> ({np.card})
          </li>
        ))}
      </ul>
    </div>
  );
}
