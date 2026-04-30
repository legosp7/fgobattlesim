/**
 * Shared DTO TypeScript types mirrored from Spring API responses.
 * Keeping these in one place gives us autocomplete and compile-time safety.
 */
export type ServantSummary = {
  id: number;
  name: string;
  rarity: number;
  className: string;
};

export type FunctionValues = Record<string, number>;

export type ServantFunction = {
  funcType: string;
  buffs?: Array<{
    id?: number;
    name?: string;
    detail?: string;
    value?: number;
    maxRate?: number;
  }>;
  svals: FunctionValues[];
  svals2: FunctionValues[];
  svals3: FunctionValues[];
  svals4: FunctionValues[];
  svals5: FunctionValues[];
};

export type ServantSkill = {
  id?: number;
  num: number;
  name: string;
  detail?: string;
  coolDown?: number[];
  functions: ServantFunction[];
};

/**
 * Raw skill payload from Atlas `/nice/{region}/skill/{id}`.
 *
 * We only type the fields we actively render. Extra fields may still exist on
 * the payload and are intentionally ignored by the UI.
 */
export type SkillDetail = {
  id?: number;
  detail?: string;
  unmodifiedDetail?: string;
};

export type NoblePhantasm = {
  id: number;
  name: string;
  card: string;
  functions: ServantFunction[];
};

export type Trait = {
  id: number;
  name: string;
};

export type ServantDetail = {
  id: number;
  name: string;
  rarity: number;
  className: string;
  atkBase: number;
  hpBase: number;
  atkMax: number;
  hpMax: number;
  lvMax: number;
  atkGrowth: number[];
  hpGrowth: number[];
  skills: ServantSkill[];
  appendSkills: ServantSkill[];
  noblePhantasms: NoblePhantasm[];
};

export type CraftEssenceSummary = {
  id: number;
  name: string;
  rarity: number;
};

export type CraftEssenceSkill = {
  name: string;
  detail: string;
};

export type CraftEssenceDetail = {
  id: number;
  name: string;
  rarity: number;
  hpBase: number;
  atkBase: number;
  atkMax: number;
  hpMax: number;
  skills: CraftEssenceSkill[];
};

export type MysticCodeSummary = {
  id: number;
  name: string;
};

export type EnemySummary = {
  id: number;
  name: string;
  className: string;
};

export type EnemyDetail = {
  id: number;
  name: string;
  className: string;
  hpBase?: number;
  atkBase?: number;
  traits: Trait[];
};
