(() => {
const { MAX_LEVEL } = window.FgoConstants;
const { safeName } = window.FgoUtils;

window.FgoComponents = window.FgoComponents || {};

window.FgoComponents.ServantsTab = function ServantsTab(props) {
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
          <ul>{props.noblePhantasmSummaries.map((summary) => <li key={summary}>{safeName(summary)}</li>)}</ul>
        </div>
      )}
    </>
  );
};
})();
