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
  svals: FunctionValues[];
  svals2: FunctionValues[];
  svals3: FunctionValues[];
  svals4: FunctionValues[];
  svals5: FunctionValues[];
};

export type ServantSkill = {
  num: number;
  name: string;
  functions: ServantFunction[];
};

export type NoblePhantasm = {
  id: number;
  name: string;
  card: string;
  functions: ServantFunction[];
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
