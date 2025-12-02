// ============================================================
// ABILITIES INDEX
// Main entry point that combines all ability categories
// ============================================================

import { ExportedAbility } from './types';

// Import all category files
import { PERCEPTION_TARGETING_ABILITIES } from './perception-targeting';
import { MOVEMENT_POSITIONING_ABILITIES } from './movement-positioning';
import { STEALTH_SIGNATURE_ABILITIES } from './stealth-signature';
import { OFFENSE_ABILITIES } from './offense';
import { DEFENSE_MITIGATION_ABILITIES } from './defense-mitigation';
import { SUPPORT_MEDICAL_ABILITIES } from './support-medical';
import { QUANTUM_HACKING_ABILITIES } from './quantum-hacking';

// Re-export types
export type { ExportedAbility, AbilityTier } from './types';

// Re-export individual categories for direct access
export { PERCEPTION_TARGETING_ABILITIES } from './perception-targeting';
export { MOVEMENT_POSITIONING_ABILITIES } from './movement-positioning';
export { STEALTH_SIGNATURE_ABILITIES } from './stealth-signature';
export { OFFENSE_ABILITIES, MELEE_ABILITIES, RANGED_ABILITIES } from './offense';
export { DEFENSE_MITIGATION_ABILITIES } from './defense-mitigation';
export { SUPPORT_MEDICAL_ABILITIES } from './support-medical';
export { QUANTUM_HACKING_ABILITIES } from './quantum-hacking';

// Combine all abilities into a single master record
export const ALL_ABILITIES: Record<string, ExportedAbility> = {
  ...PERCEPTION_TARGETING_ABILITIES,
  ...MOVEMENT_POSITIONING_ABILITIES,
  ...STEALTH_SIGNATURE_ABILITIES,
  ...OFFENSE_ABILITIES,
  ...DEFENSE_MITIGATION_ABILITIES,
  ...SUPPORT_MEDICAL_ABILITIES,
  ...QUANTUM_HACKING_ABILITIES,
};

// Category names for UI grouping
export const ABILITY_CATEGORIES = {
  'perception-targeting': {
    name: 'Perception & Targeting',
    description: 'Predictive, scanning, awareness, threat mapping, precision',
    abilities: PERCEPTION_TARGETING_ABILITIES,
  },
  'movement-positioning': {
    name: 'Movement & Positioning',
    description: 'Mobility, micro-maneuvers, bracing, stability, repositioning',
    abilities: MOVEMENT_POSITIONING_ABILITIES,
  },
  'stealth-signature': {
    name: 'Stealth & Signature',
    description: 'Cloaking, noise suppression, thermal/optic concealment, infiltration',
    abilities: STEALTH_SIGNATURE_ABILITIES,
  },
  'offense': {
    name: 'Offense',
    description: 'Direct combat mechanics, accuracy, weapon handling, damage boosts',
    abilities: OFFENSE_ABILITIES,
  },
  'defense-mitigation': {
    name: 'Defense & Mitigation',
    description: 'Shields, dampening, armor, stabilization, stress reduction',
    abilities: DEFENSE_MITIGATION_ABILITIES,
  },
  'support-medical': {
    name: 'Support & Medical',
    description: 'Healing, scanning, emergency response, repairs, squad utility',
    abilities: SUPPORT_MEDICAL_ABILITIES,
  },
  'quantum-hacking': {
    name: 'Quantum & Hacking',
    description: 'Neural, hacking, prediction, code manipulation, advanced systems',
    abilities: QUANTUM_HACKING_ABILITIES,
  },
} as const;

// Helper function to get all abilities as an array
export function getAllAbilities(): ExportedAbility[] {
  return Object.values(ALL_ABILITIES);
}

// Helper function to get ability by slug
export function getAbilityBySlug(slug: string): ExportedAbility | undefined {
  return ALL_ABILITIES[slug];
}

// Helper function to get ability by ID
export function getAbilityById(id: number): ExportedAbility | undefined {
  return Object.values(ALL_ABILITIES).find(a => a.id === id);
}

// Helper function to get abilities by category
export function getAbilitiesByCategory(category: keyof typeof ABILITY_CATEGORIES): ExportedAbility[] {
  return Object.values(ABILITY_CATEGORIES[category].abilities);
}

// Helper function to count total abilities
export function getTotalAbilityCount(): number {
  return Object.keys(ALL_ABILITIES).length;
}

// Helper function to count abilities per category
export function getAbilityCountByCategory(): Record<string, number> {
  return {
    'perception-targeting': Object.keys(PERCEPTION_TARGETING_ABILITIES).length,
    'movement-positioning': Object.keys(MOVEMENT_POSITIONING_ABILITIES).length,
    'stealth-signature': Object.keys(STEALTH_SIGNATURE_ABILITIES).length,
    'offense': Object.keys(OFFENSE_ABILITIES).length,
    'defense-mitigation': Object.keys(DEFENSE_MITIGATION_ABILITIES).length,
    'support-medical': Object.keys(SUPPORT_MEDICAL_ABILITIES).length,
    'quantum-hacking': Object.keys(QUANTUM_HACKING_ABILITIES).length,
  };
}
