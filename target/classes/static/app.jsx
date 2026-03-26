import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

const MIN_LEVEL = 1;
const MAX_LEVEL = 120;
const NP_LEVEL_MODIFIERS = { 1: 100, 2: 133, 3: 166, 4: 200, 5: 233 };

export default function App() {
  const [servants, setServants] = useState([]);
  const [craftEssences, setCraftEssences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partySlots, setPartySlots] = useState([createEmptyPartySlot()]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError('');

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
      setError('');
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
      setError('');
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
        <Link className="nav-link" to="/servants">Servants</Link>
        <Link className="nav-link" to="/party">Party</Link>
        <Link className="nav-link" to="/results">Results</Link>
      </div>

      <h1>FGO Viewer</h1>
      <p className="muted">React front end + Spring Boot back end, powered by Atlas Academy.</p>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/servants" replace />} />
          <Route
            path="/servants"
            element={<ServantsPage servants={servants} fetchNoblePhantasmDetailsByIds={fetchNoblePhantasmDetailsByIds} setError={setError} />}
          />
          <Route
            path="/servants/:id"
            element={<ServantsPage servants={servants} fetchNoblePhantasmDetailsByIds={fetchNoblePhantasmDetailsByIds} setError={setError} />}
          />
          <Route
            path="/party"
            element={
              <PartyPage
                servants={servants}
                craftEssences={craftEssences}
                partySlots={partySlots}
                updatePartySlot={updatePartySlot}
                addPartySlot={addPartySlot}
              />
            }
          />
          <Route
            path="/results"
            element={<ResultsPage partySlots={partySlots} />}
          />
        </Routes>
      )}
    </div>
  );
}

function ServantsPage({ servants, fetchNoblePhantasmDetailsByIds, setError }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [selectedServantId, setSelectedServantId] = useState(id || '');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);
  const [servantDetail, setServantDetail] = useState(null);
  const [selectedServantNpDetails, setSelectedServantNpDetails] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setSelectedServantId(id || '');
  }, [id]);

  useEffect(() => {
    setSelectedSkillIndex(0);
    setSelectedLevel(1);
  }, [selectedServantId]);

  useEffect(() => {
    if (!selectedServantId) {
      setServantDetail(null);
      setSelectedServantNpDetails([]);
      return;
    }

    async function loadServantDetail() {
      try {
        setDetailLoading(true);
        setError('');

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
  }, [selectedServantId, fetchNoblePhantasmDetailsByIds, setError]);

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
      label: `Skill ${skill.num ?? index + 1}: ${safeName(skill.name)}`
    }));
  }, [servantDetail]);

  const selectedSkillTable = useMemo(() => {
    const skill = servantDetail?.skills?.[selectedSkillIndex];
    return buildSkillTable(skill);
  }, [servantDetail, selectedSkillIndex]);

  const noblePhantasmSummaries = useMemo(
    () => buildNoblePhantasmSummaries(selectedServantNpDetails),
    [selectedServantNpDetails]
  );

  const levelOptions = Array.from({ length: MAX_LEVEL }, (_, index) => index + 1);

  function handleServantChange(event) {
    const nextId = event.target.value;
    setSelectedServantId(nextId);
    navigate(nextId ? `/servants/${nextId}` : '/servants');
  }

  return (
    <>
      <div className="card">
        <label>Choose a servant</label>
        <select value={selectedServantId} onChange={handleServantChange}>
          <option value="">-- Select servant --</option>
          {servants.map((servant) => (
            <option key={servant.id} value={servant.id}>
              {servant.name} ({servant.className})
            </option>
          ))}
        </select>
      </div>

      {detailLoading && <p>Loading servant details...</p>}

      {servantDetail && (
        <div className="card">
          <h2>{servantDetail.name}</h2>

          <div className="grid">
            <div><label>Class</label><div>{servantDetail.className}</div></div>
            <div><label>Rarity</label><div>{servantDetail.rarity}★</div></div>
            <div>
              <label>Level</label>
              <select value={selectedLevel} onChange={(event) => setSelectedLevel(Number(event.target.value))}>
                {levelOptions.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div><label>ATK at selected level</label><div>{displayedAtk}</div></div>
            <div><label>HP at selected level</label><div>{displayedHp}</div></div>
          </div>

          <h3>Skill level table</h3>
          {skillOptions.length > 0 && (
            <div>
              <label>Choose a skill</label>
              <select value={selectedSkillIndex} onChange={(event) => setSelectedSkillIndex(Number(event.target.value))}>
                {skillOptions.map((option) => (
                  <option key={option.index} value={option.index}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

          {selectedSkillTable.rows.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Level</th>
                    {selectedSkillTable.columns.map((column) => <th key={column}>{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {selectedSkillTable.rows.map((row) => (
                    <tr key={row.level}>
                      <td>{row.level}</td>
                      {selectedSkillTable.columns.map((column) => (
                        <td key={column}>{row.values[column] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No level-based skill values were found for this skill.</p>
          )}

          <h3>Noble Phantasms (Atlas Academy NP API)</h3>
          <ul>
            {noblePhantasmSummaries.map((summary) => <li key={summary}>{summary}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function PartyPage({ servants, craftEssences, partySlots, updatePartySlot, addPartySlot }) {
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

        return (
          <div className="card" key={index}>
            <h2>Party Slot {index + 1}</h2>

            <div className="grid">
              <div>
                <label>Class</label>
                <select value={slot.className} onChange={(event) => updatePartySlot(index, 'className', event.target.value)}>
                  <option value="">-- Select class --</option>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Servant</label>
                <select value={slot.servantId} onChange={(event) => updatePartySlot(index, 'servantId', event.target.value)} disabled={!slot.className}>
                  <option value="">-- Select servant --</option>
                  {availableServants.map((servant) => (
                    <option key={servant.id} value={servant.id}>{servant.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Craft Essence</label>
                <select value={slot.craftEssenceId} onChange={(event) => updatePartySlot(index, 'craftEssenceId', event.target.value)}>
                  <option value="">-- Select CE --</option>
                  {craftEssences.map((ce) => (
                    <option key={ce.id} value={ce.id}>{ce.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Level</label>
                <select value={slot.level} onChange={(event) => updatePartySlot(index, 'level', Number(event.target.value))}>
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>NP Level</label>
                <select value={slot.npLevel} onChange={(event) => updatePartySlot(index, 'npLevel', Number(event.target.value))}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>NP Upgrade Count</label>
                <select value={slot.npUpgradeCount} onChange={(event) => updatePartySlot(index, 'npUpgradeCount', Number(event.target.value))}>
                  {[0, 1, 2].map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid">
              <label>
                <input type="checkbox" checked={slot.fou} onChange={(event) => updatePartySlot(index, 'fou', event.target.checked)} />
                Fou
              </label>
              <label>
                <input type="checkbox" checked={slot.goldenFou} onChange={(event) => updatePartySlot(index, 'goldenFou', event.target.checked)} />
                Golden Fou
              </label>
            </div>

            <div className="grid">
              <div><label>Servant ATK</label><div>{servantAtk}</div></div>
              <div><label>Servant HP</label><div>{servantHp}</div></div>
              <div><label>Total ATK with Fou</label><div>{totalAtkWithFou}</div></div>
              <div><label>Total HP with Fou</label><div>{totalHpWithFou}</div></div>
              <div><label>CE ATK</label><div>{ceAtk}</div></div>
              <div><label>CE HP</label><div>{ceHp}</div></div>
              <div><label>NP Card</label><div>{npCardType}</div></div>
              <div><label>NP Modifier</label><div>{npModifier}%</div></div>
            </div>

            {slot.servantDetail && (
              <>
                <h3>{slot.servantDetail.name}</h3>
                <p className="muted">{slot.servantDetail.className} • {slot.servantDetail.rarity}★</p>
              </>
            )}

            {slot.craftEssenceDetail && (
              <>
                <h3>{slot.craftEssenceDetail.name}</h3>
                <p className="muted">{slot.craftEssenceDetail.rarity}★ Craft Essence</p>
              </>
            )}
          </div>
        );
      })}

      <button onClick={addPartySlot}>Add Party Slot</button>
    </>
  );
}

function ResultsPage({ partySlots }) {
  const filledSlots = partySlots.filter((slot) => slot.servantId);

  return (
    <div className="card">
      <h2>Results</h2>
      {filledSlots.length === 0 ? (
        <p className="muted">No party members selected yet. Go to Party first.</p>
      ) : (
        <ul>
          {filledSlots.map((slot, index) => (
            <li key={index}>
              {safeName(slot.servantDetail?.name)} | Lv {slot.level} | NP{slot.npLevel} | CE: {safeName(slot.craftEssenceDetail?.name)}
            </li>
          ))}
        </ul>
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

function resolveStatForLevel(level, growth, base, max, lvMax) {
  if (!level || level < MIN_LEVEL) return base ?? 0;

  if (Array.isArray(growth) && growth.length > 0) {
    const index = Math.max(0, Math.min(growth.length - 1, level - 1));
    const value = growth[index];
    if (value != null) return value;
  }

  if (base == null || max == null || !lvMax || lvMax <= 1) return 0;
  if (level <= 1) return base;
  if (level >= lvMax) return max;

  const ratio = (level - 1) / (lvMax - 1);
  return Math.round(base + (max - base) * ratio);
}

function resolveCeStat(base, max) {
  if (base == null && max == null) return 0;
  if (max != null) return max;
  return base ?? 0;
}

function computeNpDamageModifier(npLevel, npUpgradeCount) {
  const levelModifier = NP_LEVEL_MODIFIERS[npLevel] ?? 100;
  const upgradeModifier = 100 + (npUpgradeCount * 20);
  return Math.round((levelModifier * upgradeModifier) / 100);
}

function buildSkillTable(skill) {
  if (!skill?.functions?.length) return { columns: [], rows: [] };

  const rowsByLevel = new Map();
  const columns = new Set();

  for (const fn of skill.functions) {
    const fieldName = safeName(fn.funcType || fn.popupText || fn.text || 'Effect');
    const values = Array.isArray(fn.svals) ? fn.svals : [];

    values.forEach((value, index) => {
      const level = index + 1;
      columns.add(fieldName);

      if (!rowsByLevel.has(level)) {
        rowsByLevel.set(level, { level, values: {} });
      }

      rowsByLevel.get(level).values[fieldName] = summarizeSval(value);
    });
  }

  return {
    columns: [...columns],
    rows: [...rowsByLevel.values()].sort((a, b) => a.level - b.level)
  };
}

function buildNoblePhantasmSummaries(npDetails) {
  return (npDetails || []).map((np) => {
    const effectCount = Array.isArray(np.functions) ? np.functions.length : 0;
    return `${safeName(np.name)} (${safeName(np.card)}) - ${effectCount} effect block${effectCount === 1 ? '' : 's'}`;
  });
}

function summarizeSval(sval) {
  if (!sval || typeof sval !== 'object') return '-';

  const interestingKeys = [
    'Value',
    'Rate',
    'Turn',
    'Count',
    'Correction',
    'Atk',
    'Hp',
    'StarRate',
    'CriticalRate'
  ];

  const parts = [];

  for (const key of interestingKeys) {
    if (sval[key] != null) {
      parts.push(`${key}: ${sval[key]}`);
    }
  }

  return parts.length > 0 ? parts.join(', ') : '-';
}

function safeName(value) {
  return value == null || value === '' ? '-' : String(value);
}