import { useEffect, useMemo, useState } from 'react';
import { fgoApi } from '../api/fgoApi';
import { sortClassesInFgoOrder } from '../lib/fgoClassOrder';
import { resolveStatForLevel } from '../lib/fgoMath';
import type {
  CraftEssenceDetail,
  CraftEssenceSummary,
  MysticCodeSummary,
  NoblePhantasm,
  ServantDetail,
  ServantFunction,
  ServantSkill,
  ServantSummary,
  SkillDetail,
} from '../types/fgo';

type PartySlot = {
  className: string;
  servantId: number | null;
  craftEssenceId: number | null;
  level: number;
  npLevel: number;
  skillLevels: number[];
  appendSkillLevels: number[];
  /**
   * For each command skill slot (1-3), store which upgrade version is selected.
   * 0 = base skill, 1 = first upgrade, 2 = second upgrade, etc.
   */
  skillUpgradeStages: number[];
  fou: boolean;
  goldenFou: boolean;
  npUpgrade1: boolean;
  npUpgrade2: boolean;
  showSkillDetails: boolean;
  showNpDetails: boolean;
  servantDetail: ServantDetail | null;
  selectedNp: NoblePhantasm | null;
  craftEssenceDetail: CraftEssenceDetail | null;
  skillDetailsById: Record<number, SkillDetail>;
};

type SavedParty = {
  id: string;
  name: string;
  mysticCodeId: number | null;
  slots: PartySlot[];
  updatedAt: string;
};

const NP_LEVEL_MULTIPLIERS: Record<number, number> = { 1: 300, 2: 400, 3: 450, 4: 475, 5: 500 };
const PARTY_STORAGE_KEY = 'fgo.saved.parties.v1';

function createEmptySlot(defaultClassName: string): PartySlot {
  return {
    className: defaultClassName,
    servantId: null,
    craftEssenceId: null,
    level: 1,
    npLevel: 1,
    skillLevels: [1, 1, 1],
    appendSkillLevels: [1, 1, 1],
    skillUpgradeStages: [0, 0, 0],
    fou: false,
    goldenFou: false,
    npUpgrade1: false,
    npUpgrade2: false,
    showSkillDetails: false,
    showNpDetails: false,
    servantDetail: null,
    selectedNp: null,
    craftEssenceDetail: null,
    skillDetailsById: {},
  };
}

type SkillSlotInfo = { slotNumber: number; variants: ServantSkill[] };

function buildSkillSlots(skills: ServantSkill[]): SkillSlotInfo[] {
  /**
   * Tutorial note:
   * Atlas can return multiple upgraded versions for the same skill number.
   * We group by "num" and keep all variants, so the UI can expose more than
   * one upgrade stage instead of a single true/false toggle.
   */
  const map = new Map<number, ServantSkill[]>();
  skills.forEach((skill) => {
    const slotNumber = Math.min(3, Math.max(1, skill.num || 1));
    const current = map.get(slotNumber) ?? [];
    current.push(skill);
    map.set(slotNumber, current);
  });
  return [1, 2, 3].map((slotNumber) => ({ slotNumber, variants: map.get(slotNumber) ?? [] }));
}

function inferLevelCount(func: ServantFunction): number {
  return [func.svals, func.svals2, func.svals3, func.svals4, func.svals5].reduce((max, current) => Math.max(max, current?.length ?? 0), 0);
}

function extractNumericValuesAtLevel(func: ServantFunction, levelIndex: number): Array<{ key: string; value: number }> {
  const groups = [func.svals, func.svals2, func.svals3, func.svals4, func.svals5];
  const entries: Array<{ key: string; value: number }> = [];
  groups.forEach((group) => {
    if (!group || levelIndex >= group.length) return;
    Object.entries(group[levelIndex]).forEach(([key, value]) => {
      if (typeof value === 'number') entries.push({ key, value });
    });
  });
  return entries;
}

function decorateUnmodifiedDetail(template: string, values: Array<{ key: string; value: number }>): string {
  const bracketMatches = template.match(/\[[^\]]+\]/g) ?? [];
  if (bracketMatches.length === 0 || values.length === 0) return template;
  let replacementIndex = 0;
  return template.replace(/\[[^\]]+\]/g, (token) => {
    const resolved = values[Math.min(replacementIndex, values.length - 1)]?.value;
    replacementIndex += 1;
    return resolved === undefined ? token : `${token} (${resolved})`;
  });
}

function formatBuffPercent(rawValue: number): string {
  return `${(rawValue / 10).toString().replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')}%`;
}

function extractBuffPercentValues(func: ServantFunction, levelIndex: number): string[] {
  const groups = [func.svals, func.svals2, func.svals3, func.svals4, func.svals5];
  const formatted: string[] = [];
  groups.forEach((group) => {
    if (!group || levelIndex >= group.length) return;
    const row = group[levelIndex] as Record<string, unknown>;
    const buffs = Array.isArray(row.Buffs) ? row.Buffs : [];
    buffs.forEach((buff) => {
      if (buff && typeof buff === 'object' && typeof (buff as { Value?: unknown }).Value === 'number') {
        formatted.push(formatBuffPercent((buff as { Value: number }).Value));
      }
    });
  });
  return formatted;
}

function resolveCardType(card: string | number): string {
  const normalized = String(card).toUpperCase();
  if (normalized === '1' || normalized === 'ARTS') return 'Arts';
  if (normalized === '2' || normalized === 'BUSTER') return 'Buster';
  if (normalized === '3' || normalized === 'QUICK') return 'Quick';
  return `Unknown (${String(card)})`;
}

function loadSavedParties(): SavedParty[] {
  try {
    const raw = localStorage.getItem(PARTY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedParty[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSavedParties(parties: SavedParty[]): void {
  localStorage.setItem(PARTY_STORAGE_KEY, JSON.stringify(parties));
}

export function PartyPage(): JSX.Element {
  const [servants, setServants] = useState<ServantSummary[]>([]);
  const [craftEssences, setCraftEssences] = useState<CraftEssenceSummary[]>([]);
  const [mysticCodes, setMysticCodes] = useState<MysticCodeSummary[]>([]);
  const [selectedMysticCodeId, setSelectedMysticCodeId] = useState<number | null>(null);
  const [slots, setSlots] = useState<PartySlot[]>([]);
  const [partyName, setPartyName] = useState('');
  const [savedParties, setSavedParties] = useState<SavedParty[]>(loadSavedParties);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [servantData, ceData, mcData] = await Promise.all([
          fgoApi.listServants(),
          fgoApi.listCraftEssences(),
          fgoApi.listMysticCodes(),
        ]);
        setServants(servantData);
        setCraftEssences(ceData);
        setMysticCodes(mcData);
        const orderedClasses = sortClassesInFgoOrder([...new Set(servantData.map((servant) => servant.className))]);
        setSlots([createEmptySlot(orderedClasses[0] ?? '')]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load party data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const classOptions = useMemo(() => sortClassesInFgoOrder([...new Set(servants.map((servant) => servant.className))]), [servants]);

  function updateSlot(index: number, update: Partial<PartySlot>): void {
    setSlots((current) => current.map((slot, i) => (i === index ? { ...slot, ...update } : slot)));
  }

  async function loadServantDetail(index: number, servantId: number): Promise<void> {
    try {
      const detail = await fgoApi.getServant(servantId);
      const skillIds = [...new Set([...(detail.skills ?? []), ...(detail.appendSkills ?? [])].map((skill) => skill.id).filter((id): id is number => typeof id === 'number'))];
      const fetchedSkillDetails = await Promise.all(skillIds.map(async (id) => {
        try {
          return await fgoApi.getSkill(id);
        } catch {
          return null;
        }
      }));
      const skillDetailsById: Record<number, SkillDetail> = {};
      fetchedSkillDetails.forEach((payload, detailIndex) => {
        if (!payload) return;
        skillDetailsById[skillIds[detailIndex]] = payload;
      });
      const npDetails = await Promise.all((detail.noblePhantasms ?? []).map(async (np) => {
        try {
          return await fgoApi.getNoblePhantasm(np.id);
        } catch {
          return np;
        }
      }));
      updateSlot(index, {
        servantDetail: detail,
        selectedNp: npDetails[0] ?? null,
        npUpgrade1: false,
        npUpgrade2: false,
        skillUpgradeStages: [0, 0, 0],
        skillDetailsById,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servant detail.');
    }
  }

  async function loadCraftEssenceDetail(index: number, craftEssenceId: number): Promise<void> {
    try {
      updateSlot(index, { craftEssenceDetail: await fgoApi.getCraftEssence(craftEssenceId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load craft essence detail.');
    }
  }

  function onClassChange(index: number, className: string): void {
    updateSlot(index, { ...createEmptySlot(className) });
  }

  function onServantChange(index: number, servantId: number | null): void {
    updateSlot(index, {
      servantId,
      servantDetail: null,
      selectedNp: null,
      level: 1,
      npLevel: 1,
      skillLevels: [1, 1, 1],
      appendSkillLevels: [1, 1, 1],
      skillUpgradeStages: [0, 0, 0],
      fou: false,
      goldenFou: false,
      npUpgrade1: false,
      npUpgrade2: false,
      showSkillDetails: false,
      showNpDetails: false,
      skillDetailsById: {},
    });
    if (servantId) void loadServantDetail(index, servantId);
  }

  function onCraftEssenceChange(index: number, craftEssenceId: number | null): void {
    updateSlot(index, { craftEssenceId, craftEssenceDetail: null });
    if (craftEssenceId) void loadCraftEssenceDetail(index, craftEssenceId);
  }

  function addSlot(): void {
    setSlots((current) => [...current, createEmptySlot(classOptions[0] ?? '')]);
  }

  function resetPartyForm(): void {
    setPartyName('');
    setEditingPartyId(null);
  }

  function onSaveParty(): void {
    const trimmedName = partyName.trim();
    if (!trimmedName) {
      setError('Please enter a party name before saving.');
      return;
    }

    const next = [...savedParties];
    const nowIso = new Date().toISOString();
    if (editingPartyId) {
      const index = next.findIndex((party) => party.id === editingPartyId);
      if (index >= 0) {
        next[index] = { ...next[index], name: trimmedName, mysticCodeId: selectedMysticCodeId, slots, updatedAt: nowIso };
      }
    } else {
      next.unshift({ id: crypto.randomUUID(), name: trimmedName, mysticCodeId: selectedMysticCodeId, slots, updatedAt: nowIso });
    }
    setSavedParties(next);
    persistSavedParties(next);
    resetPartyForm();
    setError('');
  }

  function onEditParty(party: SavedParty): void {
    setPartyName(party.name);
    setSelectedMysticCodeId(party.mysticCodeId);
    setSlots(party.slots);
    setEditingPartyId(party.id);
    setError('');
  }

  function onDeleteParty(partyId: string): void {
    const next = savedParties.filter((party) => party.id !== partyId);
    setSavedParties(next);
    persistSavedParties(next);
    if (editingPartyId === partyId) resetPartyForm();
  }

  if (loading) return <p>Loading party data...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <h2>Party Builder</h2>
      <p className="muted">Build each servant with class-first selection, skill/NP detail expansion, append skill levels, CE info, and mystic code.</p>

      {slots.map((slot, index) => {
        const servantsInClass = servants.filter((servant) => servant.className === slot.className).sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
        const servantDetail = slot.servantDetail;
        const skillSlots = buildSkillSlots(servantDetail?.skills ?? []);
        const appendSkills = (servantDetail?.appendSkills ?? []).slice(0, 3);
        const npUpgradeAvailableCount = Math.max(0, (servantDetail?.noblePhantasms?.length ?? 1) - 1);

        const baseAtk = servantDetail ? resolveStatForLevel(slot.level, servantDetail.atkGrowth, servantDetail.atkBase, servantDetail.atkMax, servantDetail.lvMax) : 0;
        const baseHp = servantDetail ? resolveStatForLevel(slot.level, servantDetail.hpGrowth, servantDetail.hpBase, servantDetail.hpMax, servantDetail.lvMax) : 0;
        const fouAtkBonus = (slot.fou ? 1000 : 0) + (slot.goldenFou ? 1000 : 0);
        const finalAtk = baseAtk + fouAtkBonus;

        const ceAtk = slot.craftEssenceDetail?.atkMax ?? slot.craftEssenceDetail?.atkBase ?? 0;
        const ceHp = slot.craftEssenceDetail?.hpMax ?? slot.craftEssenceDetail?.hpBase ?? 0;

        const npMultiplier = (NP_LEVEL_MULTIPLIERS[slot.npLevel] ?? NP_LEVEL_MULTIPLIERS[1]) + (slot.npUpgrade1 ? 100 : 0) + (slot.npUpgrade2 ? 100 : 0);

        return (
          <div key={index} className="slot">
            <h3>Slot {index + 1}</h3>

            <div className="row-2">
              <div>
                <label>Class</label>
                <select value={slot.className} onChange={(event) => onClassChange(index, event.target.value)}>
                  {classOptions.map((className) => <option key={className} value={className}>{className}</option>)}
                </select>
              </div>

              <div>
                <label>Servant</label>
                <select value={slot.servantId ?? ''} onChange={(event) => onServantChange(index, event.target.value ? Number(event.target.value) : null)}>
                  <option value="">-- choose servant --</option>
                  {servantsInClass.map((servant) => <option key={servant.id} value={servant.id}>{servant.name} [{servant.id}]</option>)}
                </select>
              </div>
            </div>

            {servantDetail && (
              <>
                <div className="row-3">
                  <div>
                    <label>Level</label>
                    <select value={slot.level} onChange={(event) => updateSlot(index, { level: Number(event.target.value) })}>
                      {Array.from({ length: 120 }, (_, i) => i + 1).map((level) => <option key={level} value={level}>Lv {level}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>NP Level</label>
                    <select value={slot.npLevel} onChange={(event) => updateSlot(index, { npLevel: Number(event.target.value) })}>
                      {[1, 2, 3, 4, 5].map((npLevel) => <option key={npLevel} value={npLevel}>NP{npLevel}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>NP Damage Modifier</label>
                    <div className="input">{npMultiplier}%</div>
                  </div>
                </div>

                <div className="checkbox-row">
                  <label className="checkbox-item"><input className="checkbox" type="checkbox" checked={slot.fou} onChange={(event) => updateSlot(index, { fou: event.target.checked })} /> Fou (+1000 ATK)</label>
                  <label className="checkbox-item"><input className="checkbox" type="checkbox" checked={slot.goldenFou} onChange={(event) => updateSlot(index, { goldenFou: event.target.checked })} /> Golden Fou (+1000 ATK)</label>
                  <label className={`checkbox-item ${npUpgradeAvailableCount < 1 ? 'checkbox-disabled' : ''}`}><input className="checkbox" type="checkbox" checked={slot.npUpgrade1} disabled={npUpgradeAvailableCount < 1} onChange={(event) => updateSlot(index, { npUpgrade1: event.target.checked })} /> NP Upgrade</label>
                  <label className={`checkbox-item ${npUpgradeAvailableCount < 2 ? 'checkbox-disabled' : ''}`}><input className="checkbox" type="checkbox" checked={slot.npUpgrade2} disabled={npUpgradeAvailableCount < 2} onChange={(event) => updateSlot(index, { npUpgrade2: event.target.checked })} /> 2nd NP Upgrade</label>
                </div>

                <p><strong>Stats:</strong> ATK {finalAtk} / HP {baseHp} at Lv {slot.level}</p>

                <button type="button" className="btn btn-secondary" onClick={() => updateSlot(index, { showSkillDetails: !slot.showSkillDetails })}>
                  {slot.showSkillDetails ? 'Hide Skill Details' : 'Expand Skill Details'}
                </button>

                <div className="skill-row">
                  {skillSlots.map((skillSlot, skillIndex) => {
                    const variantCount = skillSlot.variants.length;
                    const selectedStage = Math.min(slot.skillUpgradeStages[skillIndex] ?? 0, Math.max(0, variantCount - 1));
                    const shownSkill = skillSlot.variants[selectedStage] ?? null;
                    if (!shownSkill) return <div className="skill-card" key={skillIndex}><strong>Skill {skillIndex + 1}</strong><p className="muted">No data</p></div>;

                    return (
                      <div className="skill-card" key={`${skillIndex}-${shownSkill.name}`}>
                        <strong>Skill {skillSlot.slotNumber}: {shownSkill.name}</strong>
                        <p className="muted">{shownSkill.detail ?? 'No description provided.'}</p>
                        <label>Level</label>
                        <select
                          value={slot.skillLevels[skillIndex] ?? 1}
                          onChange={(event) => {
                            const copy = [...slot.skillLevels];
                            copy[skillIndex] = Number(event.target.value);
                            updateSlot(index, { skillLevels: copy });
                          }}
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => <option key={level} value={level}>Lv {level}</option>)}
                        </select>
                        <label>Skill Upgrade Stage</label>
                        <select
                          value={selectedStage}
                          disabled={variantCount <= 1}
                          onChange={(event) => {
                            const copy = [...slot.skillUpgradeStages];
                            copy[skillIndex] = Number(event.target.value);
                            updateSlot(index, { skillUpgradeStages: copy });
                          }}
                        >
                          {skillSlot.variants.map((_, variantIndex) => (
                            <option key={`${skillIndex}-variant-${variantIndex}`} value={variantIndex}>
                              {variantIndex === 0 ? 'Base' : `Upgrade ${variantIndex}`}
                            </option>
                          ))}
                        </select>

                        {slot.showSkillDetails && (
                          <>
                            {(() => {
                              const resolvedValues = shownSkill.functions.flatMap((func) => extractNumericValuesAtLevel(func, (slot.skillLevels[skillIndex] ?? 1) - 1));
                              const apiSkill = shownSkill.id ? slot.skillDetailsById[shownSkill.id] : undefined;
                              const unmodified = apiSkill?.unmodifiedDetail ?? apiSkill?.detail ?? shownSkill.detail ?? 'No description provided.';
                              const decorated = decorateUnmodifiedDetail(unmodified, resolvedValues);
                              return (
                                <>
                                  <p><strong>Effect (unmodified detail):</strong> {decorated}</p>
                                  {resolvedValues.length > 0 && <p className="muted">Resolved values: {resolvedValues.map((entry) => `${entry.key}=${entry.value}`).join(', ')}</p>}
                                </>
                              );
                            })()}
                            <p>Cooldown (Lv {slot.skillLevels[skillIndex] ?? 1}): {(shownSkill.coolDown ?? [])[Math.max(0, (slot.skillLevels[skillIndex] ?? 1) - 1)] ?? 'N/A'}</p>
                            {shownSkill.functions.map((func, funcIndex) => {
                              const values = extractNumericValuesAtLevel(func, (slot.skillLevels[skillIndex] ?? 1) - 1);
                              const buffPercentages = extractBuffPercentValues(func, (slot.skillLevels[skillIndex] ?? 1) - 1);
                              return (
                                <div key={`${func.funcType}-${funcIndex}`}>
                                  <p><strong>{func.funcType}</strong></p>
                                  {buffPercentages.length > 0 && <p className="muted">Buff values: {buffPercentages.join(', ')}</p>}
                                  <ul>{values.length > 0 ? values.map((entry) => <li key={`${entry.key}-${entry.value}`}>{entry.key}: {entry.value}</li>) : <li>No numeric values at this level.</li>}</ul>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <h4>Append Skills</h4>
                <div className="skill-row">
                  {[0, 1, 2].map((appendIndex) => (
                    <div key={appendIndex} className="skill-card">
                      <strong>{appendSkills[appendIndex]?.name ?? `Append ${appendIndex + 1}`}</strong>
                      <label>Level</label>
                      <select
                        value={slot.appendSkillLevels[appendIndex] ?? 1}
                        onChange={(event) => {
                          const copy = [...slot.appendSkillLevels];
                          copy[appendIndex] = Number(event.target.value);
                          updateSlot(index, { appendSkillLevels: copy });
                        }}
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => <option key={level} value={level}>Lv {level}</option>)}
                      </select>
                      {appendSkills[appendIndex] && (() => {
                        const appendSkill = appendSkills[appendIndex];
                        const resolvedValues = (appendSkill.functions ?? []).flatMap((func) => extractNumericValuesAtLevel(func, (slot.appendSkillLevels[appendIndex] ?? 1) - 1));
                        const apiSkill = appendSkill.id ? slot.skillDetailsById[appendSkill.id] : undefined;
                        const unmodified = apiSkill?.unmodifiedDetail ?? apiSkill?.detail ?? appendSkill.detail ?? 'No description provided.';
                        return <p className="muted">{decorateUnmodifiedDetail(unmodified, resolvedValues)}</p>;
                      })()}
                    </div>
                  ))}
                </div>

                <button type="button" className="btn btn-secondary" onClick={() => updateSlot(index, { showNpDetails: !slot.showNpDetails })}>
                  {slot.showNpDetails ? 'Hide Noble Phantasm Details' : 'Expand Noble Phantasm Details'}
                </button>

                <p><strong>NP Card Type:</strong> {resolveCardType(slot.selectedNp?.card ?? '')}</p>
                {slot.showNpDetails && slot.selectedNp && (
                  <div className="slot">
                    <h4>{slot.selectedNp.name}</h4>
                    {slot.selectedNp.functions.map((func, funcIndex) => {
                      const npLevels = Math.max(1, inferLevelCount(func));
                      const clampedLevel = Math.min(slot.npLevel, npLevels);
                      const values = extractNumericValuesAtLevel(func, clampedLevel - 1);
                      return (
                        <div key={`${func.funcType}-${funcIndex}`}>
                          <p><strong>{func.funcType}</strong></p>
                          <ul>{values.length > 0 ? values.map((entry) => <li key={`${entry.key}-${entry.value}`}>{entry.key}: {entry.value}</li>) : <li>No numeric values at this NP level.</li>}</ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <label>Craft Essence</label>
            <select value={slot.craftEssenceId ?? ''} onChange={(event) => onCraftEssenceChange(index, event.target.value ? Number(event.target.value) : null)}>
              <option value="">-- choose craft essence --</option>
              {craftEssences.map((ce) => <option key={ce.id} value={ce.id}>{ce.name} ({ce.rarity}★)</option>)}
            </select>

            {slot.craftEssenceDetail && (
              <div className="ce-panel">
                <h4>Craft Essence Information</h4>
                <ul>
                  <li>Name: {slot.craftEssenceDetail.name}</li>
                  <li>ATK: {ceAtk}</li>
                  <li>HP: {ceHp}</li>
                </ul>
                <p><strong>Effects</strong></p>
                <ul>
                  {slot.craftEssenceDetail.skills.length > 0 ? slot.craftEssenceDetail.skills.map((skill) => <li key={`${skill.name}-${skill.detail}`}>{skill.name}: {skill.detail}</li>) : <li>No craft essence effects listed.</li>}
                </ul>
              </div>
            )}

            <p>Total with CE: <strong>ATK {finalAtk + ceAtk}</strong> / <strong>HP {baseHp + ceHp}</strong></p>
          </div>
        );
      })}

      <button type="button" className="btn" onClick={addSlot}>Add another servant to party</button>

      <div className="slot">
        <h3>Party Save</h3>
        <label>Party Name</label>
        <input value={partyName} onChange={(event) => setPartyName(event.target.value)} placeholder="Party Name" />
        <div className="checkbox-row">
          <button type="button" className="btn" onClick={onSaveParty}>{editingPartyId ? 'Update Party' : 'Save Party'}</button>
          <button type="button" className="btn btn-secondary" onClick={resetPartyForm}>Clear Name</button>
        </div>
      </div>

      <div className="slot">
        <h3>Mystic Code</h3>
        <label>Choose Mystic Code</label>
        <select value={selectedMysticCodeId ?? ''} onChange={(event) => setSelectedMysticCodeId(event.target.value ? Number(event.target.value) : null)}>
          <option value="">-- choose mystic code --</option>
          {mysticCodes.map((mc) => <option key={mc.id} value={mc.id}>{mc.name}</option>)}
        </select>
      </div>

      <div className="slot">
        <h3>Saved Parties</h3>
        {savedParties.length === 0 && <p className="muted">No saved parties yet.</p>}
        {savedParties.map((party) => (
          <div className="skill-card" key={party.id}>
            <strong>{party.name}</strong>
            <p className="muted">Updated: {new Date(party.updatedAt).toLocaleString()} • Slots: {party.slots.length}</p>
            <div className="checkbox-row">
              <button type="button" className="btn btn-secondary" onClick={() => onEditParty(party)}>Edit</button>
              <button type="button" className="btn btn-secondary" onClick={() => onDeleteParty(party.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
