/**
 * Canonical FGO class order for UI dropdowns.
 */
export const FGO_CLASS_ORDER = [
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
  'Pretender',
  'Shielder',
  'Beast',
] as const;

function normalizeClassName(value: string): string {
  return value.toLowerCase().replace(/[\s_]/g, '');
}

function classSortIndex(className: string): number {
  const index = FGO_CLASS_ORDER.findIndex((name) => normalizeClassName(name) === normalizeClassName(className));
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function sortClassesInFgoOrder(classes: string[]): string[] {
  return [...classes].sort((a, b) => {
    const diff = classSortIndex(a) - classSortIndex(b);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}
