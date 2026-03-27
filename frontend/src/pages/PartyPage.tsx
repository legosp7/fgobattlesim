import { useEffect, useMemo, useState } from 'react';
import { fgoApi } from '../api/fgoApi';
import { sortClassesInFgoOrder } from '../lib/fgoClassOrder';
import { resolveStatForLevel } from '../lib/fgoMath';
import type { CraftEssenceDetail, CraftEssenceSummary, ServantDetail, ServantSummary } from '../types/fgo';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import type { ServantSkill } from '../types/fgo';

/**
 * Tutorial party builder using reusable shadcn-style UI components.
 */
type PartySlot = {
  className: string;
  servantId: number | null;
  craftEssenceId: number | null;
  level: number;
  npLevel: number;
  skillLevels: number[];
  skillUpgrades: boolean[];
  fou: boolean;
  goldenFou: boolean;
  npUpgrade1: boolean;
  npUpgrade2: boolean;
  servantDetail: ServantDetail | null;
  craftEssenceDetail: CraftEssenceDetail | null;
};

const NP_LEVEL_MULTIPLIERS: Record<number, number> = {
  1: 300,
  2: 400,
  3: 450,
  4: 475,
  5: 500,
};

function createEmptySlot(defaultClassName: string): PartySlot {
  return {
    className: defaultClassName,
    servantId: null,
    craftEssenceId: null,
    level: 1,
    npLevel: 1,
    skillLevels: [],
    skillUpgrades: [],
    fou: false,
    goldenFou: false,
    npUpgrade1: false,
    npUpgrade2: false,
    servantDetail: null,
    craftEssenceDetail: null,
  };
}

function skillUpgradeAvailable(skillName: string): boolean {
  return skillName.includes('+') || skillName.includes('＋') || skillName.toLowerCase().includes('upgrade');
}

type SkillSlotInfo = {
  slotNumber: number;
  base: ServantSkill | null;
  upgraded: ServantSkill | null;
};

function buildSkillSlots(skills: ServantSkill[]): SkillSlotInfo[] {
  const map = new Map<number, SkillSlotInfo>();

  skills.forEach((skill) => {
    // FGO active skills are slots 1,2,3. We clamp to keep UI consistent.
    const slotNumber = Math.min(3, Math.max(1, skill.num || 1));
    const current = map.get(slotNumber) ?? { slotNumber, base: null, upgraded: null };
    const looksUpgraded = skillUpgradeAvailable(skill.name);

    if (looksUpgraded) current.upgraded = skill;
    else current.base = skill;

    map.set(slotNumber, current);
  });

  return [1, 2, 3].map((slotNumber) => {
    const item = map.get(slotNumber) ?? { slotNumber, base: null, upgraded: null };
    if (!item.base && item.upgraded) item.base = item.upgraded;
    return item;
  });
}

export function PartyPage(): JSX.Element {
  const [servants, setServants] = useState<ServantSummary[]>([]);
  const [craftEssences, setCraftEssences] = useState<CraftEssenceSummary[]>([]);
  const [slots, setSlots] = useState<PartySlot[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const isDevMode = import.meta.env.DEV;

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [servantData, ceData] = await Promise.all([fgoApi.listServants(), fgoApi.listCraftEssences()]);
        setServants(servantData);
        setCraftEssences(ceData);

        const orderedClasses = sortClassesInFgoOrder([...new Set(servantData.map((servant) => servant.className))]);
        setSlots([createEmptySlot(orderedClasses[0] ?? '')]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load party data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const classOptions = useMemo(
    () => sortClassesInFgoOrder([...new Set(servants.map((servant) => servant.className))]),
    [servants],
  );

  useEffect(() => {
    if (!isDevMode || !debugMode) return;
    console.log('[PartyPage debug]', JSON.stringify({ slots, servantCount: servants.length, craftEssenceCount: craftEssences.length }, null, 2));
  }, [isDevMode, debugMode, slots, servants.length, craftEssences.length]);

  function updateSlot(index: number, update: Partial<PartySlot>): void {
    setSlots((current) => current.map((slot, i) => (i === index ? { ...slot, ...update } : slot)));
  }

  async function loadServantDetail(index: number, servantId: number): Promise<void> {
    try {
      const detail = await fgoApi.getServant(servantId);
      setSlots((current) =>
        current.map((slot, i) =>
          i === index
            ? {
                ...slot,
                servantDetail: detail,
                level: Math.min(slot.level, 120),
                skillLevels: [1, 1, 1],
                skillUpgrades: [false, false, false],
                npUpgrade1: false,
                npUpgrade2: false,
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

  function onClassChange(index: number, className: string): void {
    updateSlot(index, {
      className,
      servantId: null,
      servantDetail: null,
      level: 1,
      npLevel: 1,
      skillLevels: [],
      skillUpgrades: [],
      fou: false,
      goldenFou: false,
      npUpgrade1: false,
      npUpgrade2: false,
    });
  }

  function onServantChange(index: number, servantId: number | null): void {
    updateSlot(index, {
      servantId,
      servantDetail: null,
      level: 1,
      npLevel: 1,
      skillLevels: [],
      skillUpgrades: [],
      fou: false,
      goldenFou: false,
      npUpgrade1: false,
      npUpgrade2: false,
    });

    if (servantId) void loadServantDetail(index, servantId);
  }

  function onCraftEssenceChange(index: number, craftEssenceId: number | null): void {
    updateSlot(index, { craftEssenceId, craftEssenceDetail: null });
    if (craftEssenceId) void loadCraftEssenceDetail(index, craftEssenceId);
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

  function updateSkillUpgrade(index: number, skillIndex: number, enabled: boolean): void {
    setSlots((current) =>
      current.map((slot, i) => {
        if (i !== index) return slot;
        const nextSkillUpgrades = [...slot.skillUpgrades];
        nextSkillUpgrades[skillIndex] = enabled;
        return { ...slot, skillUpgrades: nextSkillUpgrades };
      }),
    );
  }

  function addSlot(): void {
    setSlots((current) => [...current, createEmptySlot(classOptions[0] ?? '')]);
  }

  if (loading) return <p>Loading party data...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <Card className="card-elevated">
      <CardContent>
        <h2>Party Builder</h2>
        <p className="muted">Class → Servant → levels + upgrades + CE. Built as a tutorial-style stat sandbox.</p>
        {isDevMode && (
          <Label className="checkbox-item">
            <Checkbox checked={debugMode} onChange={(event) => setDebugMode(event.target.checked)} />
            Debug mode (log pretty JSON to console)
          </Label>
        )}

        {slots.map((slot, index) => {
          const servantsInClass = servants
            .filter((servant) => servant.className === slot.className)
            .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));

          const servantDetail = slot.servantDetail;
          const npUpgradeAvailableCount = Math.max(0, (servantDetail?.noblePhantasms?.length ?? 1) - 1);
          const npUpgrade1Available = npUpgradeAvailableCount >= 1;
          const npUpgrade2Available = npUpgradeAvailableCount >= 2;
          const skillSlots = buildSkillSlots(servantDetail?.skills ?? []);

          const baseAtk = servantDetail
            ? resolveStatForLevel(slot.level, servantDetail.atkGrowth, servantDetail.atkBase, servantDetail.atkMax, servantDetail.lvMax)
            : 0;
          const fouAtkBonus = (slot.fou ? 1000 : 0) + (slot.goldenFou ? 1000 : 0);
          const finalAtk = baseAtk + fouAtkBonus;

          const baseHp = servantDetail
            ? resolveStatForLevel(slot.level, servantDetail.hpGrowth, servantDetail.hpBase, servantDetail.hpMax, servantDetail.lvMax)
            : 0;

          const ceAtk = slot.craftEssenceDetail?.atkMax ?? slot.craftEssenceDetail?.atkBase ?? 0;
          const ceHp = slot.craftEssenceDetail?.hpMax ?? slot.craftEssenceDetail?.hpBase ?? 0;

          const npMultiplier =
            (NP_LEVEL_MULTIPLIERS[slot.npLevel] ?? NP_LEVEL_MULTIPLIERS[1]) +
            (slot.npUpgrade1 ? 100 : 0) +
            (slot.npUpgrade2 ? 100 : 0);

          return (
            <div key={index} className="slot slot-panel">
              <h3>Slot {index + 1}</h3>

              <div className="row-2">
                <div>
                  <Label>Class</Label>
                  <Select value={slot.className} onChange={(event) => onClassChange(index, event.target.value)}>
                    {classOptions.map((className) => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Servant</Label>
                  <Select
                    value={slot.servantId ?? ''}
                    onChange={(event) => onServantChange(index, event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">-- choose servant --</option>
                    {servantsInClass.map((servant) => (
                      <option key={servant.id} value={servant.id}>
                        {servant.name} [{servant.id}]
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {servantDetail && (
                <>
                  <div className="row-3">
                    <div>
                      <Label>Servant ATK</Label>
                      <input className="input" value={finalAtk} readOnly />
                    </div>
                    <div>
                      <Label>Level</Label>
                      <Select value={slot.level} onChange={(event) => updateSlot(index, { level: Number(event.target.value) })}>
                        {Array.from({ length: 120 }, (_, i) => i + 1).map((level) => (
                          <option key={level} value={level}>Lv {level}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label>NP Multiplier</Label>
                      <div className="input input-inline">
                        <span>{npMultiplier}</span>
                        <span>%</span>
                      </div>
                    </div>
                  </div>

                  <div className="checkbox-row">
                    <Label className="checkbox-item"><Checkbox checked={slot.fou} onChange={(event) => updateSlot(index, { fou: event.target.checked })} />Fou</Label>
                    <Label className="checkbox-item"><Checkbox checked={slot.goldenFou} onChange={(event) => updateSlot(index, { goldenFou: event.target.checked })} />Golden Fou</Label>
                    <Label className={`checkbox-item ${!npUpgrade1Available ? 'checkbox-disabled' : ''}`}><Checkbox checked={slot.npUpgrade1} disabled={!npUpgrade1Available} onChange={(event) => updateSlot(index, { npUpgrade1: event.target.checked })} />NP Upgrade</Label>
                    <Label className={`checkbox-item ${!npUpgrade2Available ? 'checkbox-disabled' : ''}`}><Checkbox checked={slot.npUpgrade2} disabled={!npUpgrade2Available} onChange={(event) => updateSlot(index, { npUpgrade2: event.target.checked })} />2nd NP Upgrade</Label>
                  </div>

                  <div className="skill-row">
                    {skillSlots.map((skillSlot, skillIndex) => {
                      const baseSkill = skillSlot.base;
                      const upgradedSkill = skillSlot.upgraded;
                      const canUpgrade = Boolean(baseSkill && upgradedSkill && upgradedSkill.name !== baseSkill.name);
                      const shownSkill = slot.skillUpgrades[skillIndex] && canUpgrade ? upgradedSkill : baseSkill;

                      if (!shownSkill) {
                        return (
                          <div key={`empty-skill-${skillSlot.slotNumber}`} className="skill-card">
                            <div className="skill-title">Skill {skillSlot.slotNumber}</div>
                            <div className="muted">No skill data</div>
                          </div>
                        );
                      }

                      // Only render exactly 3 skill cards (slots 1-3), each with base/upgraded toggle if available.
                      return (
                        <div key={`${skillSlot.slotNumber}-${shownSkill.name}`} className="skill-card">
                          <div className="skill-title">Skill {skillSlot.slotNumber}</div>
                          <div className="muted">{shownSkill.name}</div>
                          <Select
                            value={slot.skillLevels[skillIndex] ?? 1}
                            onChange={(event) => updateSkillLevel(index, skillIndex, Number(event.target.value))}
                          >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                              <option key={level} value={level}>Lv {level}</option>
                            ))}
                          </Select>
                          <Label className={`checkbox-item ${!canUpgrade ? 'checkbox-disabled' : ''}`}>
                            <Checkbox
                              checked={slot.skillUpgrades[skillIndex] ?? false}
                              disabled={!canUpgrade}
                              onChange={(event) => updateSkillUpgrade(index, skillIndex, event.target.checked)}
                            />
                            Upgraded
                          </Label>
                        </div>
                      );
                    })}
                  </div>

                  <ul>
                    <li>Servant HP at Lv {slot.level}: {baseHp}</li>
                    <li>Servant ATK at Lv {slot.level} (with Fou): {finalAtk}</li>
                    <li>Selected NP Level: NP{slot.npLevel}</li>
                  </ul>
                </>
              )}

              <div>
                <Label>NP Level</Label>
                <Select value={slot.npLevel} onChange={(event) => updateSlot(index, { npLevel: Number(event.target.value) })}>
                  {[1, 2, 3, 4, 5].map((npLevel) => (
                    <option key={npLevel} value={npLevel}>NP{npLevel}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Craft Essence</Label>
                <Select
                  value={slot.craftEssenceId ?? ''}
                  onChange={(event) => onCraftEssenceChange(index, event.target.value ? Number(event.target.value) : null)}
                >
                  <option value="">-- choose craft essence --</option>
                  {craftEssences.map((ce) => (
                    <option key={ce.id} value={ce.id}>
                      {ce.name} ({ce.rarity}★)
                    </option>
                  ))}
                </Select>
              </div>

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
                </div>
              )}

              <p>
                Total with CE: <strong>ATK {finalAtk + ceAtk}</strong> / <strong>HP {baseHp + ceHp}</strong>
              </p>
            </div>
          );
        })}

        <Button type="button" onClick={addSlot}>Add Slot</Button>
      </CardContent>
    </Card>
  );
}
