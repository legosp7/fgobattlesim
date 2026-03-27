import { useEffect, useMemo, useState } from 'react';
import { fgoApi } from '../api/fgoApi';
import { sortClassesInFgoOrder } from '../lib/fgoClassOrder';
import { resolveStatForLevel } from '../lib/fgoMath';
import type { CraftEssenceDetail, CraftEssenceSummary, ServantDetail, ServantSummary } from '../types/fgo';

/**
 * Tutorial party builder:
 * - class dropdown -> servant dropdown
 * - level + NP level + per-skill levels
 * - servant stats and craft essence details
 */
type PartySlot = {
  className: string;
  servantId: number | null;
  craftEssenceId: number | null;
  level: number;
  npLevel: number;
  skillLevels: number[];
  servantDetail: ServantDetail | null;
  craftEssenceDetail: CraftEssenceDetail | null;
};

function createEmptySlot(defaultClassName: string): PartySlot {
  return {
    className: defaultClassName,
    servantId: null,
    craftEssenceId: null,
    level: 1,
    npLevel: 1,
    skillLevels: [],
    servantDetail: null,
    craftEssenceDetail: null,
  };
}

export function PartyPage(): JSX.Element {
  const [servants, setServants] = useState<ServantSummary[]>([]);
  const [craftEssences, setCraftEssences] = useState<CraftEssenceSummary[]>([]);
  const [slots, setSlots] = useState<PartySlot[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [servantData, ceData] = await Promise.all([fgoApi.listServants(), fgoApi.listCraftEssences()]);
        setServants(servantData);
        setCraftEssences(ceData);

        const orderedClasses = sortClassesInFgoOrder([...new Set(servantData.map((servant) => servant.className))]);
        const defaultClass = orderedClasses[0] ?? '';
        setSlots([createEmptySlot(defaultClass)]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load party data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const classOptions = useMemo(() => sortClassesInFgoOrder([...new Set(servants.map((servant) => servant.className))]), [servants]);

  async function loadServantDetail(index: number, servantId: number): Promise<void> {
    try {
      const detail = await fgoApi.getServant(servantId);
      setSlots((current) =>
        current.map((slot, i) =>
          i === index
            ? {
                ...slot,
                servantDetail: detail,
                level: Math.min(slot.level, detail.lvMax),
                skillLevels: detail.skills.map(() => 1),
              }
            : slot,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servant detail.');
    }
  }

  async function loadCraftEssenceDetail(index: number, craftEssenceId: number): Promise<void> {
    try {
      const detail = await fgoApi.getCraftEssence(craftEssenceId);
      setSlots((current) => current.map((slot, i) => (i === index ? { ...slot, craftEssenceDetail: detail } : slot)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load craft essence detail.');
    }
  }

  function updateSlot(index: number, update: Partial<PartySlot>): void {
    setSlots((current) => current.map((slot, i) => (i === index ? { ...slot, ...update } : slot)));
  }

  function onClassChange(index: number, className: string): void {
    updateSlot(index, {
      className,
      servantId: null,
      servantDetail: null,
      level: 1,
      npLevel: 1,
      skillLevels: [],
    });
  }

  function onServantChange(index: number, servantId: number | null): void {
    updateSlot(index, {
      servantId,
      servantDetail: null,
      level: 1,
      npLevel: 1,
      skillLevels: [],
    });

    if (servantId) {
      void loadServantDetail(index, servantId);
    }
  }

  function onCraftEssenceChange(index: number, craftEssenceId: number | null): void {
    updateSlot(index, {
      craftEssenceId,
      craftEssenceDetail: null,
    });

    if (craftEssenceId) {
      void loadCraftEssenceDetail(index, craftEssenceId);
    }
  }

  function updateSkillLevel(index: number, skillIndex: number, level: number): void {
    setSlots((current) =>
      current.map((slot, i) => {
        if (i !== index) return slot;
        const nextSkillLevels = [...slot.skillLevels];
        nextSkillLevels[skillIndex] = level;
        return { ...slot, skillLevels: nextSkillLevels };
      }),
    );
  }

  function addSlot(): void {
    setSlots((current) => [...current, createEmptySlot(classOptions[0] ?? '')]);
  }

  if (loading) return <p>Loading party data...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <h2>Party Builder</h2>
      <p className="muted">
        For each slot: choose class first, then servant from that class, then configure levels and inspect stats.
      </p>

      {slots.map((slot, index) => {
        const servantsInClass = servants
          .filter((servant) => servant.className === slot.className)
          .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));

        const servantDetail = slot.servantDetail;

        const servantAtk = servantDetail
          ? resolveStatForLevel(slot.level, servantDetail.atkGrowth, servantDetail.atkBase, servantDetail.atkMax, servantDetail.lvMax)
          : 0;
        const servantHp = servantDetail
          ? resolveStatForLevel(slot.level, servantDetail.hpGrowth, servantDetail.hpBase, servantDetail.hpMax, servantDetail.lvMax)
          : 0;

        const ceAtk = slot.craftEssenceDetail?.atkMax ?? slot.craftEssenceDetail?.atkBase ?? 0;
        const ceHp = slot.craftEssenceDetail?.hpMax ?? slot.craftEssenceDetail?.hpBase ?? 0;

        return (
          <div key={index} className="slot">
            <h3>Slot {index + 1}</h3>

            <label>Class</label>
            <select value={slot.className} onChange={(event) => onClassChange(index, event.target.value)}>
              {classOptions.map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>

            <label>Servant</label>
            <select
              value={slot.servantId ?? ''}
              onChange={(event) => onServantChange(index, event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">-- choose servant --</option>
              {servantsInClass.map((servant) => (
                <option key={servant.id} value={servant.id}>
                  {servant.name} ({servant.rarity}★)
                </option>
              ))}
            </select>

            {servantDetail && (
              <>
                <div className="grid">
                  <div>
                    <label>Servant Level</label>
                    <select
                      value={slot.level}
                      onChange={(event) => updateSlot(index, { level: Number(event.target.value) })}
                    >
                      {Array.from({ length: servantDetail.lvMax }, (_, i) => i + 1).map((level) => (
                        <option key={level} value={level}>Lv {level}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>NP Level</label>
                    <select
                      value={slot.npLevel}
                      onChange={(event) => updateSlot(index, { npLevel: Number(event.target.value) })}
                    >
                      {[1, 2, 3, 4, 5].map((npLevel) => (
                        <option key={npLevel} value={npLevel}>NP{npLevel}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <h4>Skill Levels</h4>
                {servantDetail.skills.map((skill, skillIndex) => (
                  <div key={`${skill.num}-${skill.name}`}>
                    <label>Skill {skill.num}: {skill.name}</label>
                    <select
                      value={slot.skillLevels[skillIndex] ?? 1}
                      onChange={(event) => updateSkillLevel(index, skillIndex, Number(event.target.value))}
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                        <option key={level} value={level}>Lv {level}</option>
                      ))}
                    </select>
                  </div>
                ))}

                <h4>Servant Stats</h4>
                <ul>
                  <li>Class: {servantDetail.className}</li>
                  <li>ATK at Lv {slot.level}: {servantAtk}</li>
                  <li>HP at Lv {slot.level}: {servantHp}</li>
                  <li>NP Level: {slot.npLevel}</li>
                </ul>
              </>
            )}

            <label>Craft Essence</label>
            <select
              value={slot.craftEssenceId ?? ''}
              onChange={(event) => onCraftEssenceChange(index, event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">-- choose craft essence --</option>
              {craftEssences.map((ce) => (
                <option key={ce.id} value={ce.id}>
                  {ce.name} ({ce.rarity}★)
                </option>
              ))}
            </select>

            {slot.craftEssenceDetail && (
              <>
                <h4>Craft Essence Information</h4>
                <ul>
                  <li>Name: {slot.craftEssenceDetail.name}</li>
                  <li>ATK: {ceAtk}</li>
                  <li>HP: {ceHp}</li>
                </ul>
                <p><strong>Effects:</strong></p>
                <ul>
                  {slot.craftEssenceDetail.skills.length > 0 ? (
                    slot.craftEssenceDetail.skills.map((skill) => (
                      <li key={`${skill.name}-${skill.detail}`}>
                        {skill.name}: {skill.detail}
                      </li>
                    ))
                  ) : (
                    <li>No craft essence effects listed.</li>
                  )}
                </ul>
              </>
            )}

            <p>
              Total with CE: <strong>ATK {servantAtk + ceAtk}</strong> / <strong>HP {servantHp + ceHp}</strong>
            </p>
          </div>
        );
      })}

      <button type="button" onClick={addSlot}>
        Add Slot
      </button>
    </div>
  );
}
