import type { CraftEssenceDetail, CraftEssenceSummary, NoblePhantasm, ServantDetail, ServantSummary } from '../types/fgo';

/**
 * Small API client wrapping fetch.
 *
 * Tutorial note:
 * Having one API module keeps page components focused on UI behavior.
 */
async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json() as Promise<T>;
}

export const fgoApi = {
  listServants: () => getJson<ServantSummary[]>('/api/servants'),
  getServant: (id: number) => getJson<ServantDetail>(`/api/servants/${id}`),
  listCraftEssences: () => getJson<CraftEssenceSummary[]>('/api/craft-essences'),
  getCraftEssence: (id: number) => getJson<CraftEssenceDetail>(`/api/craft-essences/${id}`),
  getNoblePhantasm: (id: number) => getJson<NoblePhantasm>(`/api/noble-phantasms/${id}`),
  getSkill: (id: number) => getJson<unknown>(`/api/skills/${id}`),
};
