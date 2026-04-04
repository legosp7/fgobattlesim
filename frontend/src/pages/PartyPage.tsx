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
} from '../types/fgo';

type PartySlot = {
  className: string;
  servantId: number | null;
  craftEssenceId: number | null;
  level: number;
  npLevel: number;
  skillLevels: number[];
  appendSkillLevels: number[];
  skillUpgrades: boolean[];
  fou: boolean;
  goldenFou: boolean;
  npUpgrade1: boolean;
  npUpgrade2: boolean;
  showSkillDetails: boolean;
  showNpDetails: boolean;
  servantDetail: ServantDetail | null;
  selectedNp: NoblePhantasm | null;
  craftEssenceDetail: CraftEssenceDetail | null;
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
    skillUpgrades: [false, false, false],
    fou: false,
    goldenFou: false,
    npUpgrade1: false,
    npUpgrade2: false,
    showSkillDetails: false,
    showNpDetails: false,
    servantDetail: null,
    selectedNp: null,
    craftEssenceDetail: null,
  };
}

type SkillSlotInfo = { slotNumber: number; base: ServantSkill | null; upgraded: ServantSkill | null };

function buildSkillSlots(skills: ServantSkill[]): SkillSlotInfo[] {
  const map = new Map<number, SkillSlotInfo>();
  skills.forEach((skill) => {
    const slotNumber = Math.min(3, Math.max(1, skill.num || 1));
    const current = map.get(slotNumber) ?? { slotNumber, base: null, upgraded: null };
    if (!current.base) current.base = skill;
    else if (!current.upgraded) current.upgraded = skill;
    map.set(slotNumber, current);
  });
  return [1, 2, 3].map((slotNumber) => map.get(slotNumber) ?? { slotNumber, base: null, upgraded: null });
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
        skillUpgrades: [false, false, false],
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
      skillUpgrades: [false, false, false],
      fou: false,
      goldenFou: false,
      npUpgrade1: false,
      npUpgrade2: false,
      showSkillDetails: false,
      showNpDetails: false,
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
                    const canUpgrade = Boolean(skillSlot.base && skillSlot.upgraded);
                    const shownSkill = slot.skillUpgrades[skillIndex] && canUpgrade ? skillSlot.upgraded : skillSlot.base;
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
                        <label className={`checkbox-item ${!canUpgrade ? 'checkbox-disabled' : ''}`}>
                          <input
                            className="checkbox"
                            type="checkbox"
                            checked={slot.skillUpgrades[skillIndex] ?? false}
                            disabled={!canUpgrade}
                            onChange={(event) => {
                              const copy = [...slot.skillUpgrades];
                              copy[skillIndex] = event.target.checked;
                              updateSlot(index, { skillUpgrades: copy });
                            }}
                          /> Upgraded
                        </label>

                        {slot.showSkillDetails && (
                          <>
                            <p>Cooldown: {(shownSkill.coolDown ?? []).join(' / ') || 'N/A'}</p>
                            {shownSkill.functions.map((func, funcIndex) => {
                              const values = extractNumericValuesAtLevel(func, (slot.skillLevels[skillIndex] ?? 1) - 1);
                              return (
                                <div key={`${func.funcType}-${funcIndex}`}>
                                  <p><strong>{func.funcType}</strong></p>
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
