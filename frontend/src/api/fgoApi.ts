import type {
  CraftEssenceDetail,
  CraftEssenceSummary,
  EnemyDetail,
  EnemySummary,
  MysticCodeSummary,
  NoblePhantasm,
  SkillDetail,
  ServantDetail,
  ServantSummary,
} from '../types/fgo';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`);
  return response.json() as Promise<T>;
}

export const fgoApi = {
  listServants: () => getJson<ServantSummary[]>('/api/servants'),
  getServant: (id: number) => getJson<ServantDetail>(`/api/servants/${id}`),
  listCraftEssences: () => getJson<CraftEssenceSummary[]>('/api/craft-essences'),
  getCraftEssence: (id: number) => getJson<CraftEssenceDetail>(`/api/craft-essences/${id}`),
  listMysticCodes: () => getJson<MysticCodeSummary[]>('/api/mystic-codes'),
  listEnemies: () => getJson<EnemySummary[]>('/api/enemies'),
  getEnemy: (id: number) => getJson<EnemyDetail>(`/api/enemies/${id}`),
  getNoblePhantasm: (id: number) => getJson<NoblePhantasm>(`/api/noble-phantasms/${id}`),
  getSkill: (id: number) => getJson<SkillDetail>(`/api/skills/${id}`),
};
