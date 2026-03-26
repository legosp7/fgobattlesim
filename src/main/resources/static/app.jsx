const { useEffect, useMemo, useState } = React;

const MIN_LEVEL = 1;
const MAX_LEVEL = 120;
const NP_LEVEL_MODIFIERS = { 1: 100, 2: 133, 3: 166, 4: 200, 5: 233 };

function App() {
  const initialTab = window.location.pathname.startsWith('/party') ? 'party' : 'servants';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [servants, setServants] = useState([]);
  const [craftEssences, setCraftEssences] = useState([]);
  const [selectedServantId, setSelectedServantId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);
  const [servantDetail, setServantDetail] = useState(null);
  const [selectedServantNpDetails, setSelectedServantNpDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [partySlots, setPartySlots] = useState([createEmptyPartySlot()]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      const [servantsResponse, ceResponse] = await Promise.all([
        fetch('/api/servants'),
        fetch('/api/craft-essences')
      ]);

      if (!servantsResponse.ok || !ceResponse.ok) {
        throw new Error('Failed to load Atlas Academy data.');
      }

      setServants(await servantsResponse.json());
      setCraftEssences(await ceResponse.json());
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedServantId) {
      setServantDetail(null);
      setSelectedServantNpDetails([]);
      return;
    }

    async function loadServantDetail() {
      try {
        setDetailLoading(true);
        const response = await fetch(`/api/servants/${selectedServantId}`);
        if (!response.ok) {
          throw new Error('Failed to load servant details.');
        }
        const detail = await response.json();
        setServantDetail(detail);

        const npDetails = await fetchNoblePhantasmDetailsByIds((detail.noblePhantasms || []).map((np) => np.id));
        setSelectedServantNpDetails(npDetails);
      } catch (err) {
        setError(err.message || 'Failed to load servant details.');
      } finally {
        setDetailLoading(false);
      }
    }

    loadServantDetail();
  }, [selectedServantId]);

  useEffect(() => {
    setSelectedSkillIndex(0);
    setSelectedLevel(1);
  }, [selectedServantId]);

  const displayedAtk = useMemo(
    () => resolveStatForLevel(selectedLevel, servantDetail?.atkGrowth, servantDetail?.atkBase, servantDetail?.atkMax, servantDetail?.lvMax),
    [selectedLevel, servantDetail]
  );

  const displayedHp = useMemo(
    () => resolveStatForLevel(selectedLevel, servantDetail?.hpGrowth, servantDetail?.hpBase, servantDetail?.hpMax, servantDetail?.lvMax),
    [selectedLevel, servantDetail]
  );

  const skillOptions = useMemo(() => {
    if (!servantDetail?.skills) return [];
    return servantDetail.skills.map((skill, index) => ({
      index,
      label: `Skill ${skill.num ?? index + 1} - ${safeName(skill.name)}`
    }));
  }, [servantDetail]);

  const selectedSkillTable = useMemo(() => {
    if (!servantDetail?.skills?.length) {
      return { title: 'No skill selected', columns: [], rows: [] };
    }

    const boundedIndex = Math.min(selectedSkillIndex, servantDetail.skills.length - 1);
    const skill = servantDetail.skills[boundedIndex];
    const rows = buildSkillLevelRows(skill.functions || []);
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row.values)))];

    return {
      title: `Skill ${skill.num ?? boundedIndex + 1} - ${safeName(skill.name)}`,
      columns,
      rows
    };
  }, [selectedSkillIndex, servantDetail]);

  const noblePhantasmSummaries = useMemo(() => {
    const npSource = selectedServantNpDetails.length > 0 ? selectedServantNpDetails : (servantDetail?.noblePhantasms || []);
    return npSource.map((np) => {
      const summary = summarizeFunctions(np.functions || []);
      return `${safeName(np.name)} (${np.card || 'Unknown card'}): ${summary}`;
    });
  }, [servantDetail, selectedServantNpDetails]);

  function addPartySlot() {
    setPartySlots((current) => [...current, createEmptyPartySlot()]);
  }

  function updatePartySlot(index, field, value) {
    setPartySlots((current) => current.map((slot, slotIndex) => {
      if (slotIndex !== index) return slot;

      if (field === 'className') {
        return {
          ...slot,
          className: value,
          servantId: '',
          servantDetail: null,
          noblePhantasmDetails: [],
          level: 1,
          npLevel: 1,
          npUpgradeCount: 0,
          fou: false,
          goldenFou: false
        };
      }

      if (field === 'servantId') {
        return {
          ...slot,
          servantId: value,
          servantDetail: null,
          noblePhantasmDetails: [],
          level: 1,
          npLevel: 1,
          npUpgradeCount: 0,
          fou: false,
          goldenFou: false
        };
      }

      if (field === 'craftEssenceId') {
        return { ...slot, craftEssenceId: value, craftEssenceDetail: null };
      }

      return { ...slot, [field]: value };
    }));

    if (field === 'servantId') {
      loadPartyServantDetail(index, value);
    }
    if (field === 'craftEssenceId') {
      loadPartyCraftEssenceDetail(index, value);
    }
  }

  async function loadPartyServantDetail(slotIndex, servantId) {
    if (!servantId) return;

    try {
      const response = await fetch(`/api/servants/${servantId}`);
      if (!response.ok) {
        throw new Error('Failed to load party servant details.');
      }
      const detail = await response.json();
      const npDetails = await fetchNoblePhantasmDetailsByIds((detail.noblePhantasms || []).map((np) => np.id));

      setPartySlots((current) => current.map((slot, index) =>
        index === slotIndex ? { ...slot, servantDetail: detail, noblePhantasmDetails: npDetails } : slot
      ));
    } catch (err) {
      setError(err.message || 'Failed to load party servant details.');
    }
  }

  async function loadPartyCraftEssenceDetail(slotIndex, craftEssenceId) {
    if (!craftEssenceId) return;

    try {
      const response = await fetch(`/api/craft-essences/${craftEssenceId}`);
      if (!response.ok) {
        throw new Error('Failed to load craft essence details.');
      }
      const detail = await response.json();

      setPartySlots((current) => current.map((slot, index) =>
        index === slotIndex ? { ...slot, craftEssenceDetail: detail } : slot
      ));
    } catch (err) {
      setError(err.message || 'Failed to load craft essence details.');
    }
  }

  async function fetchNoblePhantasmDetailsByIds(npIds) {
    const validIds = (npIds || []).filter((id) => id != null);
    if (validIds.length === 0) return [];

    try {
      const responses = await Promise.all(validIds.map((id) => fetch(`/api/noble-phantasms/${id}`)));
      const okResponses = responses.filter((response) => response.ok);
      return Promise.all(okResponses.map((response) => response.json()));
    } catch (err) {
      return [];
    }
  }

  return (
    <div className="container">
      <div className="nav">
        <button className={activeTab === 'servants' ? 'active' : ''} onClick={() => setActiveTab('servants')}>Servants</button>
        <button className={activeTab === 'party' ? 'active' : ''} onClick={() => setActiveTab('party')}>Party</button>
      </div>

      <h1>FGO Viewer</h1>
      <p className="muted">React front end + Spring Boot back end, powered by Atlas Academy.</p>

      {error && <p className="error">{error}</p>}

      {loading ? <p>Loading...</p> : activeTab === 'servants' ? (
        <ServantsTab
          servants={servants}
          selectedServantId={selectedServantId}
          setSelectedServantId={setSelectedServantId}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          selectedSkillIndex={selectedSkillIndex}
          setSelectedSkillIndex={setSelectedSkillIndex}
          servantDetail={servantDetail}
          displayedAtk={displayedAtk}
          displayedHp={displayedHp}
          skillOptions={skillOptions}
          selectedSkillTable={selectedSkillTable}
          noblePhantasmSummaries={noblePhantasmSummaries}
          detailLoading={detailLoading}
        />
      ) : (
        <PartyTab
          servants={servants}
          craftEssences={craftEssences}
          partySlots={partySlots}
          updatePartySlot={updatePartySlot}
          addPartySlot={addPartySlot}
        />
      )}
    </div>
  );
}

function createEmptyPartySlot() {
  return {
    className: '',
    servantId: '',
    craftEssenceId: '',
    level: 1,
    npLevel: 1,
    npUpgradeCount: 0,
    fou: false,
    goldenFou: false,
    servantDetail: null,
    noblePhantasmDetails: [],
    craftEssenceDetail: null
  };
}

function ServantsTab(props) {
  const levelOptions = Array.from({ length: MAX_LEVEL }, (_, index) => index + 1);

  return (
    <>
      <div className="card">
        <label>Choose a servant</label>
        <select value={props.selectedServantId} onChange={(event) => props.setSelectedServantId(event.target.value)}>
          <option value="">-- Select servant --</option>
          {props.servants.map((servant) => (
            <option key={servant.id} value={servant.id}>{servant.name} ({servant.className})</option>
          ))}
        </select>
      </div>

      {props.detailLoading && <p>Loading servant details...</p>}

      {props.servantDetail && (
        <div className="card">
          <h2>{props.servantDetail.name}</h2>

          <div className="grid">
            <div><label>Class</label><div>{props.servantDetail.className}</div></div>
            <div><label>Rarity</label><div>{props.servantDetail.rarity}★</div></div>
            <div>
              <label>Level</label>
              <select value={props.selectedLevel} onChange={(event) => props.setSelectedLevel(Number(event.target.value))}>
                {levelOptions.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
            <div><label>ATK at selected level</label><div>{props.displayedAtk}</div></div>
            <div><label>HP at selected level</label><div>{props.displayedHp}</div></div>
          </div>

          <h3>Skill level table</h3>
          {props.skillOptions.length > 0 && (
            <div>
              <label>Choose a skill</label>
              <select value={props.selectedSkillIndex} onChange={(event) => props.setSelectedSkillIndex(Number(event.target.value))}>
                {props.skillOptions.map((option) => <option key={option.index} value={option.index}>{option.label}</option>)}
              </select>
            </div>
          )}

          {props.selectedSkillTable.rows.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Level</th>{props.selectedSkillTable.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                <tbody>
                {props.selectedSkillTable.rows.map((row) => (
                  <tr key={row.level}><td>{row.level}</td>{props.selectedSkillTable.columns.map((column) => <td key={column}>{row.values[column] || '-'}</td>)}</tr>
                ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">No level-based skill values were found for this skill.</p>}

          <h3>Noble Phantasms (Atlas Academy NP API)</h3>
          <ul>{props.noblePhantasmSummaries.map((summary) => <li key={summary}>{summary}</li>)}</ul>
        </div>
      )}
    </>
  );
}

function PartyTab({ servants, craftEssences, partySlots, updatePartySlot, addPartySlot }) {
  const classOptions = [...new Set(servants.map((servant) => servant.className).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const levelOptions = Array.from({ length: MAX_LEVEL }, (_, index) => index + 1);

  return (
    <>
      <p className="muted">Choose class → servant → CE, then customize level/NP/Fou settings for each party member.</p>

      {partySlots.map((slot, index) => {
        const availableServants = slot.className ? servants.filter((servant) => servant.className === slot.className) : [];

        const servantAtk = resolveStatForLevel(slot.level, slot.servantDetail?.atkGrowth, slot.servantDetail?.atkBase, slot.servantDetail?.atkMax, slot.servantDetail?.lvMax);
        const servantHp = resolveStatForLevel(slot.level, slot.servantDetail?.hpGrowth, slot.servantDetail?.hpBase, slot.servantDetail?.hpMax, slot.servantDetail?.lvMax);

        const fouBonus = (slot.fou ? 1000 : 0) + (slot.goldenFou ? 1000 : 0);
        const totalAtkWithFou = servantAtk + fouBonus;
        const totalHpWithFou = servantHp + fouBonus;

        const npModifier = computeNpDamageModifier(slot.npLevel, slot.npUpgradeCount);
        const npCardType = safeName(slot.noblePhantasmDetails?.[0]?.card || slot.servantDetail?.noblePhantasms?.[0]?.card);

        const ceAtk = resolveCeStat(slot.craftEssenceDetail?.atkBase, slot.craftEssenceDetail?.atkMax);
        const ceHp = resolveCeStat(slot.craftEssenceDetail?.hpBase, slot.craftEssenceDetail?.hpMax);
        const ceEffects = (slot.craftEssenceDetail?.skills || []).map((skill) => `${safeName(skill.name)}: ${safeName(skill.detail)}`);

        return (
          <div className="card" key={index}>
            <h2>Party Slot {index + 1}</h2>

            <div className="grid">
              <div>
                <label>Class</label>
                <select value={slot.className} onChange={(event) => updatePartySlot(index, 'className', event.target.value)}>
                  <option value="">-- Select class --</option>
                  {classOptions.map((classOption) => <option key={classOption} value={classOption}>{classOption}</option>)}
                </select>
              </div>
              <div>
                <label>Servant</label>
                <select value={slot.servantId} onChange={(event) => updatePartySlot(index, 'servantId', event.target.value)}>
                  <option value="">-- Select servant --</option>
                  {availableServants.map((servant) => <option key={servant.id} value={servant.id}>{servant.name}</option>)}
                </select>
              </div>
              <div>
                <label>Craft Essence</label>
                <select value={slot.craftEssenceId} onChange={(event) => updatePartySlot(index, 'craftEssenceId', event.target.value)}>
                  <option value="">-- Select craft essence --</option>
                  {craftEssences.map((craftEssence) => (
                    <option key={craftEssence.id} value={craftEssence.id}>{craftEssence.name}{craftEssence.rarity ? ` (${craftEssence.rarity}★)` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {slot.servantDetail && (
              <>
                <h3>Servant Stats & NP Settings (NP data from NP API)</h3>
                <div className="grid">
                  <div>
                    <label>Servant Level</label>
                    <select value={slot.level} onChange={(event) => updatePartySlot(index, 'level', Number(event.target.value))}>
                      {levelOptions.map((level) => <option key={level} value={level}>{level}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>NP Level</label>
                    <select value={slot.npLevel} onChange={(event) => updatePartySlot(index, 'npLevel', Number(event.target.value))}>
                      {[1, 2, 3, 4, 5].map((npLevel) => <option key={npLevel} value={npLevel}>{npLevel}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>NP Upgrades Applied</label>
                    <select value={slot.npUpgradeCount} onChange={(event) => updatePartySlot(index, 'npUpgradeCount', Number(event.target.value))}>
                      <option value={0}>0</option><option value={1}>1</option><option value={2}>2</option>
                    </select>
                  </div>
                </div>

                <div className="grid" style={{ marginTop: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <input type="checkbox" checked={slot.fou} onChange={(event) => updatePartySlot(index, 'fou', event.target.checked)} />
                    Fou'd (+1000 ATK/HP)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <input type="checkbox" checked={slot.goldenFou} onChange={(event) => updatePartySlot(index, 'goldenFou', event.target.checked)} />
                    Golden Fou'd (+1000 additional ATK/HP)
                  </label>
                </div>

                <div className="grid" style={{ marginTop: '0.8rem' }}>
                  <div><strong>Class:</strong> {safeName(slot.servantDetail.className)}</div>
                  <div><strong>ATK (with Fou):</strong> {totalAtkWithFou}</div>
                  <div><strong>HP (with Fou):</strong> {totalHpWithFou}</div>
                  <div><strong>NP Card Type:</strong> {npCardType}</div>
                  <div><strong>NP Damage Modifier:</strong> {npModifier}%</div>
                </div>
              </>
            )}

            {slot.craftEssenceDetail && (
              <>
                <h3>Craft Essence Stats & Effects</h3>
                <div className="grid">
                  <div><strong>CE Name:</strong> {safeName(slot.craftEssenceDetail.name)}</div>
                  <div><strong>CE ATK:</strong> {ceAtk}</div>
                  <div><strong>CE HP:</strong> {ceHp}</div>
                </div>
                <ul>
                  {ceEffects.length > 0 ? ceEffects.map((effect) => <li key={effect}>{effect}</li>) : <li>No CE effects available.</li>}
                </ul>
              </>
            )}
          </div>
        );
      })}

      <button className="primary" onClick={addPartySlot}>Add another servant to party</button>
    </>
  );
}

function computeNpDamageModifier(npLevel, upgradeCount) {
  const baseModifier = NP_LEVEL_MODIFIERS[npLevel] ?? NP_LEVEL_MODIFIERS[1];
  return baseModifier + (Math.max(0, Math.min(2, upgradeCount)) * 10);
}

function resolveCeStat(baseStat, maxStat) {
  if (maxStat != null && maxStat > 0) return maxStat;
  return baseStat ?? 0;
}

function buildSkillLevelRows(functions) {
  if (!functions?.length) return [];
  const levelCount = Math.max(...functions.map(inferLevelCount), 0);
  const rows = [];

  for (let levelIndex = 0; levelIndex < levelCount; levelIndex += 1) {
    const values = {};
    functions.forEach((func) => {
      const extracted = extractLevelValues(func, levelIndex);
      Object.entries(extracted).forEach(([key, value]) => {
        if (!values[key]) values[key] = value;
      });
    });
    rows.push({ level: levelIndex + 1, values });
  }
  return rows;
}

function inferLevelCount(func) {
  return [func.svals, func.svals2, func.svals3, func.svals4, func.svals5]
    .filter(Boolean)
    .reduce((max, current) => Math.max(max, current.length), 0);
}

function extractLevelValues(func, levelIndex) {
  const values = {};
  [func.svals, func.svals2, func.svals3, func.svals4, func.svals5]
    .filter(Boolean)
    .forEach((group) => {
      if (levelIndex >= group.length) return;
      const sval = group[levelIndex];
      Object.entries(sval).forEach(([key, rawValue]) => {
        if (typeof rawValue !== 'number') return;
        const normalized = key.toLowerCase();
        if (!isUsefulNumericKey(normalized)) return;
        const label = `${humanize(func.funcType || 'Effect')} - ${humanize(key)}`;
        if (!values[label]) values[label] = formatValue(normalized, rawValue);
      });
    });
  return values;
}

function summarizeFunctions(functions) {
  if (!functions?.length) return 'No function values.';

  return functions.map((func) => {
    const summaryValues = extractLevelValues(func, 0);
    const entries = Object.entries(summaryValues);
    if (!entries.length) return `${func.funcType || 'Effect'} (no numeric buff values found)`;
    return `${func.funcType || 'Effect'} [${entries.map(([key, value]) => `${key}: ${value}`).join(', ')}]`;
  }).join(' | ');
}

function isUsefulNumericKey(key) {
  return ['rate', 'value', 'up', 'damage', 'turn', 'count', 'chance', 'percent'].some((fragment) => key.includes(fragment));
}

function humanize(input) {
  return String(input)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatValue(key, number) {
  const formatted = Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)));
  return key.includes('rate') || key.includes('chance') || key.endsWith('up') || key.includes('percent')
    ? `${formatted}%`
    : formatted;
}

function resolveStatForLevel(level, growthValues, baseStat, maxStat, lvMax) {
  if (Array.isArray(growthValues) && growthValues.length > 0) {
    const index = Math.max(0, Math.min(level - 1, growthValues.length - 1));
    if (growthValues[index] != null) return growthValues[index];
  }

  const safeBase = baseStat ?? 0;
  const safeMax = maxStat ?? safeBase;
  const safeLvMax = Math.min(MAX_LEVEL, Math.max(1, lvMax ?? MAX_LEVEL));

  if (level <= 1) return safeBase;
  if (level >= safeLvMax) return safeMax;

  const progress = (level - 1) / Math.max(1, safeLvMax - 1);
  return Math.round(safeBase + ((safeMax - safeBase) * progress));
}

function safeName(value) {
  return value && String(value).trim() ? value : 'Unknown';
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
