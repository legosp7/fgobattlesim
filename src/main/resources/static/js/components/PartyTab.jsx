const { MAX_LEVEL } = window.FgoConstants;
const { resolveStatForLevel, computeNpDamageModifier, resolveCeStat, safeName } = window.FgoUtils;

window.FgoComponents = window.FgoComponents || {};

window.FgoComponents.PartyTab = function PartyTab({ servants, craftEssences, partySlots, updatePartySlot, addPartySlot }) {
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
                <ul>{ceEffects.length > 0 ? ceEffects.map((effect) => <li key={effect}>{effect}</li>) : <li>No CE effects available.</li>}</ul>
              </>
            )}
          </div>
        );
      })}

      <button className="primary" onClick={addPartySlot}>Add another servant to party</button>
    </>
  );
};
