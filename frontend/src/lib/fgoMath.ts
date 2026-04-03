/**
 * Utility functions for displaying stats and labels.
 *
 * Tutorial note:
 * Putting these helpers in a pure utility module makes them easy to test.
 */
export function resolveStatForLevel(level: number, growthValues: number[] | null | undefined, base: number, max: number, lvMax: number): number {
  if (growthValues && growthValues.length > 0) {
    const index = Math.max(0, Math.min(level - 1, growthValues.length - 1));
    const fromGrowth = growthValues[index];
    if (typeof fromGrowth === 'number') return fromGrowth;
  }

  if (level <= 1) return base;
  if (level >= lvMax) return max;

  const progress = (level - 1) / Math.max(1, lvMax - 1);
  return Math.round(base + (max - base) * progress);
}

export function safeText(value: unknown, fallback = 'Unknown'): string {
  const str = String(value ?? '').trim();
  return str.length > 0 ? str : fallback;
}
