import { useEffect, useState } from 'react';
import { fgoApi } from '../api/fgoApi';
import type { EnemyDetail, EnemySummary } from '../types/fgo';

/**
 * Tutorial encounter planner:
 * - starts with wave 1
 * - user can add more waves
 * - each wave can choose enemy + level
 * - each wave card is collapsible to save screen space
 */
type WaveState = {
  enemyId: number | null;
  level: number;
  enemyDetail: EnemyDetail | null;
};

export function EnemiesPage(): JSX.Element {
  const [enemies, setEnemies] = useState<EnemySummary[]>([]);
  const [waves, setWaves] = useState<WaveState[]>([{ enemyId: null, level: 1, enemyDetail: null }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setEnemies(await fgoApi.listEnemies());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load enemies.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateWave(index: number, update: Partial<WaveState>): void {
    setWaves((current) => current.map((wave, i) => (i === index ? { ...wave, ...update } : wave)));
  }

  async function onEnemyChange(index: number, enemyId: number | null): Promise<void> {
    updateWave(index, { enemyId, enemyDetail: null });
    if (!enemyId) return;

    try {
      const detail = await fgoApi.getEnemy(enemyId);
      updateWave(index, { enemyDetail: detail });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enemy detail.');
    }
  }

  function addWave(): void {
    setWaves((current) => [...current, { enemyId: null, level: 1, enemyDetail: null }]);
  }

  if (loading) return <p>Loading enemies...</p>;

  return (
    <div className="card">
      <h2>Enemy Waves</h2>
      <p className="muted">Create wave-by-wave encounter plans and collapse cards to keep your workspace clean.</p>
      {error && <p className="error">{error}</p>}

      {waves.map((wave, index) => (
        <details key={index} className="slot" open={index === 0}>
          <summary>Wave {index + 1}</summary>
          <label>Enemy</label>
          <select value={wave.enemyId ?? ''} onChange={(event) => void onEnemyChange(index, event.target.value ? Number(event.target.value) : null)}>
            <option value="">-- choose enemy --</option>
            {enemies.map((enemy) => (
              <option key={enemy.id} value={enemy.id}>{enemy.name} [{enemy.className}]</option>
            ))}
          </select>

          <label>Level</label>
          <select value={wave.level} onChange={(event) => updateWave(index, { level: Number(event.target.value) })}>
            {Array.from({ length: 120 }, (_, i) => i + 1).map((level) => (
              <option key={level} value={level}>Lv {level}</option>
            ))}
          </select>

          {wave.enemyDetail && (
            <div>
              <p><strong>{wave.enemyDetail.name}</strong> • {wave.enemyDetail.className} • Lv {wave.level}</p>
              <p>ATK: {wave.enemyDetail.atkBase ?? 'N/A'} / HP: {wave.enemyDetail.hpBase ?? 'N/A'}</p>
              <p><strong>Traits</strong></p>
              <ul>
                {(wave.enemyDetail.traits ?? []).length > 0
                  ? (wave.enemyDetail.traits ?? []).map((trait) => <li key={`${trait.id}-${trait.name}`}>{trait.name}</li>)
                  : <li>No trait data found.</li>}
              </ul>
            </div>
          )}
        </details>
      ))}

      <button type="button" className="btn" onClick={addWave}>Add Wave</button>
    </div>
  );
}
