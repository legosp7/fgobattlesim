const { useEffect, useMemo, useState } = React;

// We keep these as constants so they are easy to reuse and easy to change.
const MIN_LEVEL = 1;
const MAX_LEVEL = 120;

/**
 * Root React component.
 *
 * Teaching note:
 * In React, it is common to keep most page-wide state at the top and pass down
 * only the pieces that child components need.
 */
function App() {
  // The initial tab is derived from the URL path so /party can open directly.
  const initialTab = window.location.pathname.startsWith('/party') ? 'party' : 'servants';

  // useState gives a component memory between renders.
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servants, setServants] = useState([]);
  const [craftEssences, setCraftEssences] = useState([]);
  const [selectedServantId, setSelectedServantId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);
  const [servantDetail, setServantDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [partySlots, setPartySlots] = useState([{ className: '', servantId: '', craftEssenceId: '' }]);

  // Load shared dropdown data once when the app first mounts.
  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);

      // Promise.all lets both requests happen in parallel.
      const [servantsResponse, ceResponse] = await Promise.all([
        fetch('/api/servants'),
        fetch('/api/craft-essences')
      ]);

      if (!servantsResponse.ok || !ceResponse.ok) {
        throw new Error('Failed to load Atlas Academy data.');
      }

      const servantsJson = await servantsResponse.json();
      const ceJson = await ceResponse.json();
      setServants(servantsJson);
      setCraftEssences(ceJson);
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  // When the selected servant changes, load detailed data for that servant.
  useEffect(() => {
    if (!selectedServantId) {
      setServantDetail(null);
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
      } catch (err) {
        setError(err.message || 'Failed to load servant details.');
      } finally {
        setDetailLoading(false);
      }
    }

    loadServantDetail();
  }, [selectedServantId]);

  // Reset dependent UI state when switching to a different servant.
  useEffect(() => {
    setSelectedSkillIndex(0);
    setSelectedLevel(1);
  }, [selectedServantId]);

  // useMemo caches derived values so we do not recompute them unnecessarily.
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
    return (servantDetail?.noblePhantasms || []).map((np) => {
      const summary = summarizeFunctions(np.functions || []);
      return `${safeName(np.name)} (${np.card || 'Unknown card'}): ${summary}`;
    });
  }, [servantDetail]);

  function addPartySlot() {
    setPartySlots((current) => [...current, { className: '', servantId: '', craftEssenceId: '' }]);
  }

  /**
   * Updates one slot in the party builder.
   *
   * If the class changes, we intentionally reset servant selection because the
   * old servant may not belong to the new class.
   */
  function updatePartySlot(index, field, value) {
    setPartySlots((current) => current.map((slot, slotIndex) => {
      if (slotIndex !== index) return slot;

      if (field === 'className') {
        return { className: value, servantId: '', craftEssenceId: slot.craftEssenceId };
      }

      return { ...slot, [field]: value };
    }));
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

/**
 * Tab for viewing one servant in detail.
 */
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
            <div>
              <label>Class</label>
              <div>{props.servantDetail.className}</div>
            </div>
            <div>
              <label>Rarity</label>
              <div>{props.servantDetail.rarity}★</div>
            </div>
            <div>
              <label>Level</label>
              <select value={props.selectedLevel} onChange={(event) => props.setSelectedLevel(Number(event.target.value))}>
                {levelOptions.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
            <div>
              <label>ATK at selected level</label>
              <div>{props.displayedAtk}</div>
            </div>
            <div>
              <label>HP at selected level</label>
              <div>{props.displayedHp}</div>
            </div>
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
                <thead>
                  <tr>
                    <th>Level</th>
                    {props.selectedSkillTable.columns.map((column) => <th key={column}>{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {props.selectedSkillTable.rows.map((row) => (
                    <tr key={row.level}>
                      <td>{row.level}</td>
                      {props.selectedSkillTable.columns.map((column) => <td key={column}>{row.values[column] || '-'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">No level-based skill values were found for this skill.</p>}

          <h3>Noble Phantasms</h3>
          <ul>
            {props.noblePhantasmSummaries.map((summary) => <li key={summary}>{summary}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

/**
 * Tab for building a simple party.
 */
function PartyTab({ servants, craftEssences, partySlots, updatePartySlot, addPartySlot }) {
  const classOptions = [...new Set(servants.map((servant) => servant.className).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  return (
    <>
      <p className="muted">Choose a class, then a servant from that class, then a craft essence. Add more slots whenever you want.</p>

      {partySlots.map((slot, index) => {
        // Filtering on the client is okay here because we already downloaded the servant list.
        const availableServants = slot.className
          ? servants.filter((servant) => servant.className === slot.className)
          : [];

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
                    <option key={craftEssence.id} value={craftEssence.id}>
                      {craftEssence.name}{craftEssence.rarity ? ` (${craftEssence.rarity}★)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      })}

      <button className="primary" onClick={addPartySlot}>Add another servant to party</button>
    </>
  );
}

/**
 * Converts Atlas Academy's function arrays into a table where each row is a
 * skill level and each column is one parsed numeric effect.
 */
function buildSkillLevelRows(functions) {
  if (!functions?.length) return [];

  const levelCount = Math.max(...functions.map(inferLevelCount), 0);
  const rows = [];

  for (let levelIndex = 0; levelIndex < levelCount; levelIndex += 1) {
    const values = {};

    functions.forEach((func) => {
      const extracted = extractLevelValues(func, levelIndex);
      Object.entries(extracted).forEach(([key, value]) => {
        if (!values[key]) {
          values[key] = value;
        }
      });
    });

    rows.push({ level: levelIndex + 1, values });
  }

  return rows;
}

/**
 * Finds how many levels of data a function has.
 */
function inferLevelCount(func) {
  return [func.svals, func.svals2, func.svals3, func.svals4, func.svals5]
    .filter(Boolean)
    .reduce((max, current) => Math.max(max, current.length), 0);
}

/**
 * Extracts one function's values for one level.
 */
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
        if (!values[label]) {
          values[label] = formatValue(normalized, rawValue);
        }
      });
    });

  return values;
}

/**
 * Builds readable Noble Phantasm summaries from function blocks.
 */
function summarizeFunctions(functions) {
  if (!functions?.length) return 'No function values.';

  return functions.map((func) => {
    const summaryValues = extractLevelValues(func, 0);
    const entries = Object.entries(summaryValues);

    if (!entries.length) {
      return `${func.funcType || 'Effect'} (no numeric buff values found)`;
    }

    return `${func.funcType || 'Effect'} [${entries.map(([key, value]) => `${key}: ${value}`).join(', ')}]`;
  }).join(' | ');
}

/**
 * Heuristic filter: Atlas Academy exposes many keys, but for beginners we only
 * show the ones that are most likely to be meaningful in the UI.
 */
function isUsefulNumericKey(key) {
  return ['rate', 'value', 'up', 'damage', 'turn', 'count', 'chance', 'percent'].some((fragment) => key.includes(fragment));
}

/**
 * Turns names like "atkUp" into "Atk Up" for display.
 */
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

/**
 * Formats percentage-like values differently from raw numeric values.
 */
function formatValue(key, number) {
  const formatted = Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)));

  return key.includes('rate') || key.includes('chance') || key.endsWith('up') || key.includes('percent')
    ? `${formatted}%`
    : formatted;
}

/**
 * Computes HP/ATK at a selected level.
 *
 * Strategy choice:
 * 1. Prefer growth arrays because they are more accurate.
 * 2. Fall back to interpolation between base and max when arrays are missing.
 */
function resolveStatForLevel(level, growthValues, baseStat, maxStat, lvMax) {
  if (Array.isArray(growthValues) && growthValues.length > 0) {
    const index = Math.max(0, Math.min(level - 1, growthValues.length - 1));
    if (growthValues[index] != null) {
      return growthValues[index];
    }
  }

  const safeBase = baseStat ?? 0;
  const safeMax = maxStat ?? safeBase;
  const safeLvMax = Math.min(MAX_LEVEL, Math.max(1, lvMax ?? MAX_LEVEL));

  if (level <= 1) return safeBase;
  if (level >= safeLvMax) return safeMax;

  const progress = (level - 1) / Math.max(1, safeLvMax - 1);
  return Math.round(safeBase + ((safeMax - safeBase) * progress));
}

/**
 * Prevents blank/null names from leaking into the UI.
 */
function safeName(value) {
  return value && String(value).trim() ? value : 'Unknown';
}

// Finally, mount the React app into the root element in index.html.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
