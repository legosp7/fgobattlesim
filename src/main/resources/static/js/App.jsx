const { useEffect, useMemo, useState } = React;
const { Routes, Route, NavLink, Navigate } = ReactRouterDOM;

const { createEmptyPartySlot, resolveStatForLevel, buildSkillLevelRows, summarizeFunctions, safeName } = window.FgoUtils;
const { ServantsTab, PartyTab } = window.FgoComponents;
const Api = window.FgoApi;

window.FgoApp = function FgoApp() {
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
    (async () => {
      try {
        setLoading(true);
        const [servantsData, craftEssenceData] = await Promise.all([Api.fetchServants(), Api.fetchCraftEssences()]);
        setServants(servantsData);
        setCraftEssences(craftEssenceData);
      } catch (err) {
        setError(err.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedServantId) {
      setServantDetail(null);
      setSelectedServantNpDetails([]);
      return;
    }

    (async () => {
      try {
        setDetailLoading(true);
        const detail = await Api.fetchServantDetail(selectedServantId);
        setServantDetail(detail);
        setSelectedServantNpDetails(await Api.fetchNoblePhantasmDetailsByIds((detail.noblePhantasms || []).map((np) => np.id)));
      } catch (err) {
        setError(err.message || 'Failed to load servant details.');
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [selectedServantId]);

  useEffect(() => {
    setSelectedSkillIndex(0);
    setSelectedLevel(1);
  }, [selectedServantId]);

  const displayedAtk = useMemo(() => resolveStatForLevel(selectedLevel, servantDetail?.atkGrowth, servantDetail?.atkBase, servantDetail?.atkMax, servantDetail?.lvMax), [selectedLevel, servantDetail]);
  const displayedHp = useMemo(() => resolveStatForLevel(selectedLevel, servantDetail?.hpGrowth, servantDetail?.hpBase, servantDetail?.hpMax, servantDetail?.lvMax), [selectedLevel, servantDetail]);

  const skillOptions = useMemo(() => {
    if (!servantDetail?.skills) return [];
    return servantDetail.skills.map((skill, index) => ({ index, label: `Skill ${skill.num ?? index + 1} - ${safeName(skill.name)}` }));
  }, [servantDetail]);

  const selectedSkillTable = useMemo(() => {
    if (!servantDetail?.skills?.length) return { title: 'No skill selected', columns: [], rows: [] };
    const boundedIndex = Math.min(selectedSkillIndex, servantDetail.skills.length - 1);
    const skill = servantDetail.skills[boundedIndex];
    const rows = buildSkillLevelRows(skill.functions || []);
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row.values)))];
    return { title: `Skill ${skill.num ?? boundedIndex + 1} - ${safeName(skill.name)}`, columns, rows };
  }, [selectedSkillIndex, servantDetail]);

  const noblePhantasmSummaries = useMemo(() => {
    const npSource = selectedServantNpDetails.length > 0 ? selectedServantNpDetails : (servantDetail?.noblePhantasms || []);
    return npSource.map((np) => `${safeName(np.name)} (${np.card || 'Unknown card'}): ${summarizeFunctions(np.functions || [])}`);
  }, [servantDetail, selectedServantNpDetails]);

  function addPartySlot() {
    setPartySlots((current) => [...current, createEmptyPartySlot()]);
  }

  async function loadPartyServantDetail(slotIndex, servantId) {
    if (!servantId) return;
    try {
      const detail = await Api.fetchServantDetail(servantId);
      const npDetails = await Api.fetchNoblePhantasmDetailsByIds((detail.noblePhantasms || []).map((np) => np.id));
      setPartySlots((current) => current.map((slot, index) => index === slotIndex ? { ...slot, servantDetail: detail, noblePhantasmDetails: npDetails } : slot));
    } catch (err) {
      setError(err.message || 'Failed to load party servant details.');
    }
  }

  async function loadPartyCraftEssenceDetail(slotIndex, craftEssenceId) {
    if (!craftEssenceId) return;
    try {
      const detail = await Api.fetchCraftEssenceDetail(craftEssenceId);
      setPartySlots((current) => current.map((slot, index) => index === slotIndex ? { ...slot, craftEssenceDetail: detail } : slot));
    } catch (err) {
      setError(err.message || 'Failed to load craft essence details.');
    }
  }

  function updatePartySlot(index, field, value) {
    setPartySlots((current) => current.map((slot, slotIndex) => {
      if (slotIndex !== index) return slot;
      if (field === 'className') {
        return { ...slot, className: value, servantId: '', servantDetail: null, noblePhantasmDetails: [], level: 1, npLevel: 1, npUpgradeCount: 0, fou: false, goldenFou: false };
      }
      if (field === 'servantId') {
        return { ...slot, servantId: value, servantDetail: null, noblePhantasmDetails: [], level: 1, npLevel: 1, npUpgradeCount: 0, fou: false, goldenFou: false };
      }
      if (field === 'craftEssenceId') {
        return { ...slot, craftEssenceId: value, craftEssenceDetail: null };
      }
      return { ...slot, [field]: value };
    }));

    if (field === 'servantId') loadPartyServantDetail(index, value);
    if (field === 'craftEssenceId') loadPartyCraftEssenceDetail(index, value);
  }

  return (
    <div className="container">
      <div className="nav">
        <NavLink to="/servants" className={({ isActive }) => isActive ? 'active' : ''}><button className={window.location.pathname.includes('/servants') ? 'active' : ''}>Servants</button></NavLink>
        <NavLink to="/party" className={({ isActive }) => isActive ? 'active' : ''}><button className={window.location.pathname.includes('/party') ? 'active' : ''}>Party</button></NavLink>
      </div>

      <h1>FGO Viewer</h1>
      <p className="muted">React front end + Spring Boot back end, powered by Atlas Academy.</p>
      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && (
        <Routes>
          <Route path="/" element={<Navigate to="/servants" replace />} />
          <Route path="/servants" element={<ServantsTab
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
          />} />
          <Route path="/party" element={<PartyTab
            servants={servants}
            craftEssences={craftEssences}
            partySlots={partySlots}
            updatePartySlot={updatePartySlot}
            addPartySlot={addPartySlot}
          />} />
        </Routes>
      )}
    </div>
  );
};
