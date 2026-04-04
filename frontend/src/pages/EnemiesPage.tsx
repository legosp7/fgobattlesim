import { useMemo, useState } from 'react';

type EnemyRow = {
  hp: number;
  classIndex: number;
  attribute: string;
  npGainMod: number;
};

type QuestNode = {
  id: string;
  name: string;
  enemies: EnemyRow[];
  updatedAt: string;
};

const QUEST_STORAGE_KEY = 'fgo.quest.nodes.v1';

// Saber = 0, Archer = 1, Lancer = 2, Rider = 3, Caster = 4, Assassin = 5, Berserker = 6
// Ruler = 7, Avenger = 8, Moon Cancer = 9, Alter Ego = 10, Foreigner = 11, Shielder = 12
// Pretender = 13, Beast = 14
const CLASS_OPTIONS = [
  'Saber',
  'Archer',
  'Lancer',
  'Rider',
  'Caster',
  'Assassin',
  'Berserker',
  'Ruler',
  'Avenger',
  'Moon Cancer',
  'Alter Ego',
  'Foreigner',
  'Shielder',
  'Pretender',
  'Beast',
];

const ATTRIBUTE_OPTIONS = ['Man', 'Sky', 'Earth', 'Star', 'Beast'];

const EnemyServerMod = [1, 1, 1, 1.1, 1.2, 0.9, 0.8, 1, 1, 1.2, 1, 1, 1, 1, 1];

function createEnemyRow(): EnemyRow {
  return { hp: 0, classIndex: 0, attribute: 'Man', npGainMod: EnemyServerMod[0] };
}

function createInitialEnemies(): EnemyRow[] {
  return Array.from({ length: 9 }, () => createEnemyRow());
}

function loadSavedNodes(): QuestNode[] {
  try {
    const raw = localStorage.getItem(QUEST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuestNode[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function persistSavedNodes(nodes: QuestNode[]): void {
  localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify(nodes));
}

export function EnemiesPage(): JSX.Element {
  const [questName, setQuestName] = useState('');
  const [enemies, setEnemies] = useState<EnemyRow[]>(createInitialEnemies);
  const [savedNodes, setSavedNodes] = useState<QuestNode[]>(loadSavedNodes);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const editingNode = useMemo(() => savedNodes.find((node) => node.id === editingNodeId) ?? null, [savedNodes, editingNodeId]);

  function updateEnemy(enemyIndex: number, patch: Partial<EnemyRow>): void {
    setEnemies((current) => current.map((enemy, index) => (index === enemyIndex ? { ...enemy, ...patch } : enemy)));
  }

  function onClassChange(enemyIndex: number, classIndex: number): void {
    updateEnemy(enemyIndex, { classIndex, npGainMod: EnemyServerMod[classIndex] ?? 1 });
  }

  function resetForm(): void {
    setQuestName('');
    setEnemies(createInitialEnemies());
    setEditingNodeId(null);
    setError('');
  }

  function onSaveQuest(): void {
    const trimmedName = questName.trim();
    if (!trimmedName) {
      setError('Please enter a quest name.');
      return;
    }

    const nowIso = new Date().toISOString();
    const copy = [...savedNodes];
    if (editingNodeId) {
      const index = copy.findIndex((node) => node.id === editingNodeId);
      if (index >= 0) {
        copy[index] = { ...copy[index], name: trimmedName, enemies, updatedAt: nowIso };
      }
    } else {
      copy.unshift({ id: crypto.randomUUID(), name: trimmedName, enemies, updatedAt: nowIso });
    }

    setSavedNodes(copy);
    persistSavedNodes(copy);
    resetForm();
  }

  function onEditQuest(node: QuestNode): void {
    setQuestName(node.name);
    setEnemies(node.enemies);
    setEditingNodeId(node.id);
    setError('');
  }

  function onDeleteQuest(nodeId: string): void {
    const copy = savedNodes.filter((node) => node.id !== nodeId);
    setSavedNodes(copy);
    persistSavedNodes(copy);
    if (editingNodeId === nodeId) resetForm();
  }

  return (
    <div className="card enemy-page">
      <h2>Enemy Node Builder</h2>
      <p className="muted">Enter all enemy stats and then click save. This page is offline and no longer queries the API.</p>
      {error && <p className="error">{error}</p>}

      {[0, 1, 2].map((waveIndex) => (
        <div className="slot" key={waveIndex}>
          <h3>Wave {waveIndex + 1}</h3>
          <div className="row-3">
            {[0, 1, 2].map((enemyInWave) => {
              const enemyIndex = waveIndex * 3 + enemyInWave;
              const enemy = enemies[enemyIndex];
              return (
                <div className="skill-card" key={enemyIndex}>
                  <label>Enemy {enemyIndex + 1} HP</label>
                  <input
                    type="number"
                    min={0}
                    value={enemy.hp}
                    onChange={(event) => updateEnemy(enemyIndex, { hp: Number(event.target.value) || 0 })}
                  />

                  <label>Class {enemyIndex + 1}</label>
                  <select value={enemy.classIndex} onChange={(event) => onClassChange(enemyIndex, Number(event.target.value))}>
                    {CLASS_OPTIONS.map((className, classIndex) => <option key={className} value={classIndex}>{className}</option>)}
                  </select>

                  <label>Attr. {enemyIndex + 1}</label>
                  <select value={enemy.attribute} onChange={(event) => updateEnemy(enemyIndex, { attribute: event.target.value })}>
                    {ATTRIBUTE_OPTIONS.map((attribute) => <option key={attribute} value={attribute}>{attribute}</option>)}
                  </select>

                  <label>NP Gain Mod {enemyIndex + 1}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={enemy.npGainMod}
                    onChange={(event) => updateEnemy(enemyIndex, { npGainMod: Number(event.target.value) || 0 })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="slot">
        <label>Quest Name</label>
        <input value={questName} onChange={(event) => setQuestName(event.target.value)} placeholder="Quest Name" />
        <div className="checkbox-row">
          <button type="button" className="btn" onClick={onSaveQuest}>{editingNode ? 'Update Quest' : 'Add Quest'}</button>
          <button type="button" className="btn btn-secondary" onClick={resetForm}>Clear</button>
        </div>
      </div>

      <div className="slot">
        <h3>Saved Quests</h3>
        {savedNodes.length === 0 && <p className="muted">No quests saved yet.</p>}
        {savedNodes.map((node) => (
          <div className="skill-card" key={node.id}>
            <strong>{node.name}</strong>
            <p className="muted">Updated: {new Date(node.updatedAt).toLocaleString()}</p>
            <div className="checkbox-row">
              <button type="button" className="btn btn-secondary" onClick={() => onEditQuest(node)}>Edit</button>
              <button type="button" className="btn btn-secondary" onClick={() => onDeleteQuest(node.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
