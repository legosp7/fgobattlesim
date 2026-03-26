import { useEffect, useMemo, useState } from 'react';
import { fgoApi } from '../api/fgoApi';
import type { CraftEssenceSummary, ServantSummary } from '../types/fgo';

/**
 * Simple party builder route (/party).
 */
type PartySlot = {
  servantId: number | null;
  craftEssenceId: number | null;
};

export function PartyPage(): JSX.Element {
  const [servants, setServants] = useState<ServantSummary[]>([]);
  const [craftEssences, setCraftEssences] = useState<CraftEssenceSummary[]>([]);
  const [slots, setSlots] = useState<PartySlot[]>([{ servantId: null, craftEssenceId: null }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [servantData, ceData] = await Promise.all([fgoApi.listServants(), fgoApi.listCraftEssences()]);
        setServants(servantData);
        setCraftEssences(ceData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load party data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const servantById = useMemo(() => new Map(servants.map((servant) => [servant.id, servant])), [servants]);
  const ceById = useMemo(() => new Map(craftEssences.map((ce) => [ce.id, ce])), [craftEssences]);

  function updateSlot(index: number, update: Partial<PartySlot>): void {
    setSlots((current) => current.map((slot, i) => (i === index ? { ...slot, ...update } : slot)));
  }

  function addSlot(): void {
    setSlots((current) => [...current, { servantId: null, craftEssenceId: null }]);
  }

  if (loading) return <p>Loading party data...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <h2>Party Builder</h2>
      <p className="muted">Choose a servant and craft essence for each slot.</p>

      {slots.map((slot, index) => (
        <div key={index} className="slot">
          <h3>Slot {index + 1}</h3>

          <label>Servant</label>
          <select
            value={slot.servantId ?? ''}
            onChange={(event) => updateSlot(index, { servantId: event.target.value ? Number(event.target.value) : null })}
          >
            <option value="">-- choose servant --</option>
            {servants.map((servant) => (
              <option key={servant.id} value={servant.id}>
                {servant.name} ({servant.className})
              </option>
            ))}
          </select>

          <label>Craft Essence</label>
          <select
            value={slot.craftEssenceId ?? ''}
            onChange={(event) => updateSlot(index, { craftEssenceId: event.target.value ? Number(event.target.value) : null })}
          >
            <option value="">-- choose craft essence --</option>
            {craftEssences.map((ce) => (
              <option key={ce.id} value={ce.id}>
                {ce.name}
              </option>
            ))}
          </select>

          <p>
            Selected: <strong>{slot.servantId ? servantById.get(slot.servantId)?.name : 'No servant'}</strong> +{' '}
            <strong>{slot.craftEssenceId ? ceById.get(slot.craftEssenceId)?.name : 'No craft essence'}</strong>
          </p>
        </div>
      ))}

      <button type="button" onClick={addSlot}>
        Add Slot
      </button>
    </div>
  );
}
