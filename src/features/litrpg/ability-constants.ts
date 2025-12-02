// ============================================================
// ABILITY CONSTANTS - Backwards Compatibility Re-export
// ============================================================
// This file re-exports from the new abilities/ folder structure
// for backwards compatibility with existing imports.
// 
// NEW IMPORTS SHOULD USE:
// import { ... } from '@/features/litrpg/abilities';
// ============================================================

// Re-export everything from the abilities module
export {
  // Main ability collections
  ALL_ABILITIES,
  ABILITY_CATEGORIES,
  
  // Category-specific exports
  PERCEPTION_TARGETING_ABILITIES,
  MOVEMENT_POSITIONING_ABILITIES,
  STEALTH_SIGNATURE_ABILITIES,
  OFFENSE_ABILITIES,
  MELEE_ABILITIES,
  RANGED_ABILITIES,
  DEFENSE_MITIGATION_ABILITIES,
  SUPPORT_MEDICAL_ABILITIES,
  QUANTUM_HACKING_ABILITIES,
  
  // Helper functions
  getAbilityById,
  getAbilityBySlug,
  getAllAbilities,
  getAbilitiesByCategory,
  getTotalAbilityCount,
  getAbilityCountByCategory,
} from './abilities';

// Re-export types
export type {
  ExportedAbility,
  AbilityTier,
} from './abilities';
