/**
 * Small API helper layer for the front-end.
 *
 * Keeping fetch calls here makes component files easier to read.
 */
window.FgoApi = {
  async fetchServants() {
    const response = await fetch('/api/servants');
    if (!response.ok) throw new Error('Failed to load servants.');
    return response.json();
  },

  async fetchCraftEssences() {
    const response = await fetch('/api/craft-essences');
    if (!response.ok) throw new Error('Failed to load craft essences.');
    return response.json();
  },

  async fetchServantDetail(servantId) {
    const response = await fetch(`/api/servants/${servantId}`);
    if (!response.ok) throw new Error('Failed to load servant details.');
    return response.json();
  },

  async fetchCraftEssenceDetail(craftEssenceId) {
    const response = await fetch(`/api/craft-essences/${craftEssenceId}`);
    if (!response.ok) throw new Error('Failed to load craft essence details.');
    return response.json();
  },

  async fetchNoblePhantasmDetail(npId) {
    const response = await fetch(`/api/noble-phantasms/${npId}`);
    if (!response.ok) throw new Error('Failed to load noble phantasm details.');
    return response.json();
  },

  async fetchNoblePhantasmDetailsByIds(npIds) {
    const validIds = (npIds || []).filter((id) => id != null);
    if (validIds.length === 0) return [];

    const responses = await Promise.all(validIds.map((id) => fetch(`/api/noble-phantasms/${id}`)));
    const okResponses = responses.filter((response) => response.ok);
    return Promise.all(okResponses.map((response) => response.json()));
  }
};
