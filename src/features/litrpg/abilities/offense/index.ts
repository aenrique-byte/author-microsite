// ============================================================
// OFFENSE ABILITIES INDEX
// Combines all offensive ability categories
// ============================================================

import { ExportedAbility } from '../types';
import { MELEE_ABILITIES } from './melee';
import { RANGED_ABILITIES } from './ranged';

// Combine all offense abilities
export const OFFENSE_ABILITIES: Record<string, ExportedAbility> = {
  ...MELEE_ABILITIES,
  ...RANGED_ABILITIES,
};

// Re-export sub-categories
export { MELEE_ABILITIES } from './melee';
export { RANGED_ABILITIES } from './ranged';
