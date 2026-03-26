const { MAX_LEVEL, NP_LEVEL_MODIFIERS } = window.FgoConstants;

window.FgoUtils = {
  createEmptyPartySlot() {
    return {
      className: '',
      servantId: '',
      craftEssenceId: '',
      level: 1,
      npLevel: 1,
      npUpgradeCount: 0,
      fou: false,
      goldenFou: false,
      servantDetail: null,
      noblePhantasmDetails: [],
      craftEssenceDetail: null
    };
  },

  computeNpDamageModifier(npLevel, upgradeCount) {
    const baseModifier = NP_LEVEL_MODIFIERS[npLevel] ?? NP_LEVEL_MODIFIERS[1];
    return baseModifier + (Math.max(0, Math.min(2, upgradeCount)) * 10);
  },

  resolveCeStat(baseStat, maxStat) {
    if (maxStat != null && maxStat > 0) return maxStat;
    return baseStat ?? 0;
  },

  buildSkillLevelRows(functions) {
    if (!functions?.length) return [];
    const levelCount = Math.max(...functions.map(this.inferLevelCount), 0);
    const rows = [];

    for (let levelIndex = 0; levelIndex < levelCount; levelIndex += 1) {
      const values = {};
      functions.forEach((func) => {
        const extracted = this.extractLevelValues(func, levelIndex);
        Object.entries(extracted).forEach(([key, value]) => {
          if (!values[key]) values[key] = value;
        });
      });
      rows.push({ level: levelIndex + 1, values });
    }

    return rows;
  },

  inferLevelCount(func) {
    return [func.svals, func.svals2, func.svals3, func.svals4, func.svals5]
      .filter(Boolean)
      .reduce((max, current) => Math.max(max, current.length), 0);
  },

  extractLevelValues(func, levelIndex) {
    const values = {};
    [func.svals, func.svals2, func.svals3, func.svals4, func.svals5]
      .filter(Boolean)
      .forEach((group) => {
        if (levelIndex >= group.length) return;
        const sval = group[levelIndex];
        Object.entries(sval).forEach(([key, rawValue]) => {
          if (typeof rawValue !== 'number') return;
          const normalized = key.toLowerCase();
          if (!this.isUsefulNumericKey(normalized)) return;
          const label = `${this.humanize(func.funcType || 'Effect')} - ${this.humanize(key)}`;
          if (!values[label]) values[label] = this.formatValue(normalized, rawValue);
        });
      });
    return values;
  },

  summarizeFunctions(functions) {
    if (!functions?.length) return 'No function values.';

    return functions.map((func) => {
      const summaryValues = this.extractLevelValues(func, 0);
      const entries = Object.entries(summaryValues);
      if (!entries.length) return `${func.funcType || 'Effect'} (no numeric buff values found)`;
      return `${func.funcType || 'Effect'} [${entries.map(([key, value]) => `${key}: ${value}`).join(', ')}]`;
    }).join(' | ');
  },

  isUsefulNumericKey(key) {
    return ['rate', 'value', 'up', 'damage', 'turn', 'count', 'chance', 'percent'].some((fragment) => key.includes(fragment));
  },

  humanize(input) {
    return String(input)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  },

  formatValue(key, number) {
    const formatted = Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)));
    return key.includes('rate') || key.includes('chance') || key.endsWith('up') || key.includes('percent')
      ? `${formatted}%`
      : formatted;
  },

  resolveStatForLevel(level, growthValues, baseStat, maxStat, lvMax) {
    if (Array.isArray(growthValues) && growthValues.length > 0) {
      const index = Math.max(0, Math.min(level - 1, growthValues.length - 1));
      if (growthValues[index] != null) return growthValues[index];
    }

    const safeBase = baseStat ?? 0;
    const safeMax = maxStat ?? safeBase;
    const safeLvMax = Math.min(MAX_LEVEL, Math.max(1, lvMax ?? MAX_LEVEL));

    if (level <= 1) return safeBase;
    if (level >= safeLvMax) return safeMax;

    const progress = (level - 1) / Math.max(1, safeLvMax - 1);
    return Math.round(safeBase + ((safeMax - safeBase) * progress));
  },

  safeName(value) {
    return value && String(value).trim() ? value : 'Unknown';
  }
};
