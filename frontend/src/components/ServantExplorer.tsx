import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fgoApi } from '../api/fgoApi';
import { sortClassesInFgoOrder } from '../lib/fgoClassOrder';
import type { NoblePhantasm, ServantDetail, ServantFunction, ServantSummary } from '../types/fgo';

function inferLevelCount(func: ServantFunction): number {
  return [func.svals, func.svals2, func.svals3, func.svals4, func.svals5].reduce((max, current) => Math.max(max, current?.length ?? 0), 0);
}

function extractNumericValuesAtLevel(func: ServantFunction, levelIndex: number): Array<{ key: string; value: number }> {
  const groups = [func.svals, func.svals2, func.svals3, func.svals4, func.svals5];
  const entries: Array<{ key: string; value: number }> = [];

  groups.forEach((group) => {
    if (!group || levelIndex >= group.length) return;
    Object.entries(group[levelIndex]).forEach(([key, value]) => {
      if (typeof value === 'number') {
        entries.push({ key, value });
      }
    });
  });

  return entries;
}

function humanizeFunctionType(funcType: string): string {
  return funcType.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
}

function resolveCardType(card: string | number): string {
  const normalized = String(card).toUpperCase();
  if (normalized === '1' || normalized === 'ARTS') return 'Arts';
  if (normalized === '2' || normalized === 'BUSTER') return 'Buster';
  if (normalized === '3' || normalized === 'QUICK') return 'Quick';
  return `Unknown (${card})`;
}

type Props = {
  initialServantId?: number;
  showBackLink?: boolean;
};

/**
 * Tutorial component:
 * 1) choose class (FGO class order)
 * 2) choose servant from that class
 * 3) inspect skills and NP values by level/upgrade.
 */
export function ServantExplorer({ initialServantId, showBackLink = false }: Props): JSX.Element {
  const [servants, setServants] = useState<ServantSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedServantId, setSelectedServantId] = useState<number | null>(initialServantId ?? null);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState(1);
  const [selectedNpId, setSelectedNpId] = useState<number | null>(null);
  const [selectedNpLevel, setSelectedNpLevel] = useState(1);
  const [servantDetail, setServantDetail] = useState<ServantDetail | null>(null);
  const [noblePhantasms, setNoblePhantasms] = useState<NoblePhantasm[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const data = await fgoApi.listServants();
        setServants(data);

        if (data.length === 0) return;

        // Initial defaults: class order first, then first servant in class.
        const classes = sortClassesInFgoOrder([...new Set(data.map((servant) => servant.className))]);

        const defaultClass = initialServantId
          ? data.find((servant) => servant.id === initialServantId)?.className ?? classes[0]
          : classes[0];
        setSelectedClass(defaultClass);

        if (!initialServantId) {
          const defaultServant = data.find((servant) => servant.className === defaultClass);
          if (defaultServant) setSelectedServantId(defaultServant.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load servants.');
      } finally {
        setLoading(false);
      }
    })();
  }, [initialServantId]);

  const classOptions = useMemo(() => {
    return sortClassesInFgoOrder([...new Set(servants.map((servant) => servant.className))]);
  }, [servants]);

  const servantsInClass = useMemo(() => {
    return servants
      .filter((servant) => servant.className === selectedClass)
      .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  }, [servants, selectedClass]);

  useEffect(() => {
    if (servantsInClass.length === 0) {
      setSelectedServantId(null);
      return;
    }

    // When class changes, keep servant if still valid; otherwise default to first in class.
    const exists = servantsInClass.some((servant) => servant.id === selectedServantId);
    if (!exists) {
      setSelectedServantId(servantsInClass[0].id);
    }
  }, [servantsInClass, selectedServantId]);

  useEffect(() => {
    if (!selectedServantId) return;

    void (async () => {
      try {
        setDetailLoading(true);
        setError('');

        const detail = await fgoApi.getServant(selectedServantId);
        setServantDetail(detail);

        const npDetails = await Promise.all(
          (detail.noblePhantasms ?? []).map(async (np) => {
            try {
              return await fgoApi.getNoblePhantasm(np.id);
            } catch {
              return np;
            }
          }),
        );

        setNoblePhantasms(npDetails);
        setSelectedNpId(npDetails[0]?.id ?? null);
        setSelectedSkillIndex(0);
        setSelectedSkillLevel(1);
        setSelectedNpLevel(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load servant detail.');
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [selectedServantId]);

  const selectedSkill = servantDetail?.skills?.[selectedSkillIndex] ?? null;
  const selectedSkillLevelCount = selectedSkill ? Math.max(1, ...selectedSkill.functions.map(inferLevelCount)) : 1;
  const selectedNp = noblePhantasms.find((np) => np.id === selectedNpId) ?? noblePhantasms[0] ?? null;
  const selectedNpLevelCount = selectedNp ? Math.max(1, ...selectedNp.functions.map(inferLevelCount)) : 1;

  useEffect(() => {
    if (selectedSkillLevel > selectedSkillLevelCount) {
      setSelectedSkillLevel(selectedSkillLevelCount);
    }
  }, [selectedSkillLevel, selectedSkillLevelCount]);

  useEffect(() => {
    if (selectedNpLevel > selectedNpLevelCount) {
      setSelectedNpLevel(selectedNpLevelCount);
    }
  }, [selectedNpLevel, selectedNpLevelCount]);

  if (loading) return <p>Loading servants...</p>;

  return (
    <div className="card">
      {showBackLink && <p><Link to="/servants">← Back to servant selector</Link></p>}
      <h2>Servant Explorer</h2>
      <p className="muted">
        Step 1: choose class in FGO order. Step 2: choose servant from that class. Step 3: inspect skill + NP values by level.
      </p>

      {error && <p className="error">{error}</p>}

      <label>Class</label>
      <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
        {classOptions.map((className) => (
          <option key={className} value={className}>{className}</option>
        ))}
      </select>

      <label>Servant</label>
      <select
        value={selectedServantId ?? ''}
        onChange={(event) => setSelectedServantId(event.target.value ? Number(event.target.value) : null)}
      >
        {servantsInClass.map((servant) => (
          <option key={servant.id} value={servant.id}>
            {servant.name} ({servant.rarity}★)
          </option>
        ))}
      </select>

      {selectedServantId && (
        <p>
          Direct link for this servant: <Link to={`/servants/${selectedServantId}`}>/servants/{selectedServantId}</Link>
        </p>
      )}

      {detailLoading && <p>Loading servant detail...</p>}

      {servantDetail && (
        <>
          <h3>{servantDetail.name}</h3>
          <p>
            {servantDetail.className} • {servantDetail.rarity}★
          </p>

          <h3>Skill Inspector</h3>
          <label>Skill</label>
          <select value={selectedSkillIndex} onChange={(event) => setSelectedSkillIndex(Number(event.target.value))}>
            {servantDetail.skills.map((skill, index) => (
              <option key={`${skill.num}-${skill.name}`} value={index}>
                Skill {skill.num}: {skill.name}
              </option>
            ))}
          </select>

          <label>Skill Level</label>
          <select value={selectedSkillLevel} onChange={(event) => setSelectedSkillLevel(Number(event.target.value))}>
            {Array.from({ length: selectedSkillLevelCount }, (_, i) => i + 1).map((level) => (
              <option key={level} value={level}>Lv {level}</option>
            ))}
          </select>

          {selectedSkill && (
            <div>
              {selectedSkill.functions.map((func, index) => {
                const values = extractNumericValuesAtLevel(func, selectedSkillLevel - 1);
                return (
                  <div key={`${func.funcType}-${index}`} className="slot">
                    <p>
                      <strong>Effect {index + 1}:</strong> {humanizeFunctionType(func.funcType)}
                    </p>
                    <ul>
                      {values.length > 0 ? (
                        values.map((entry) => (
                          <li key={`${func.funcType}-${entry.key}`}>
                            {entry.key}: {entry.value}
                          </li>
                        ))
                      ) : (
                        <li>No numeric values found for this level.</li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          <h3>Noble Phantasm Inspector</h3>
          <label>NP Upgrade/Version</label>
          <select value={selectedNp?.id ?? ''} onChange={(event) => setSelectedNpId(Number(event.target.value))}>
            {noblePhantasms.map((np, index) => (
              <option key={np.id} value={np.id}>
                {np.name} {index > 0 ? `(Upgrade ${index})` : '(Base)'}
              </option>
            ))}
          </select>

          <label>NP Level</label>
          <select value={selectedNpLevel} onChange={(event) => setSelectedNpLevel(Number(event.target.value))}>
            {Array.from({ length: selectedNpLevelCount }, (_, i) => i + 1).map((level) => (
              <option key={level} value={level}>Lv {level}</option>
            ))}
          </select>

          {selectedNp && (
            <div>
              <p>
                <strong>Card Type:</strong> {resolveCardType(selectedNp.card)} (raw value: {String(selectedNp.card)})
              </p>
              {selectedNp.functions.map((func, index) => {
                const values = extractNumericValuesAtLevel(func, selectedNpLevel - 1);
                return (
                  <div key={`${func.funcType}-${index}`} className="slot">
                    <p>
                      <strong>NP Effect {index + 1}:</strong> {humanizeFunctionType(func.funcType)}
                    </p>
                    <ul>
                      {values.length > 0 ? (
                        values.map((entry) => (
                          <li key={`${func.funcType}-${entry.key}`}>
                            {entry.key}: {entry.value}
                          </li>
                        ))
                      ) : (
                        <li>No numeric values found for this level.</li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
