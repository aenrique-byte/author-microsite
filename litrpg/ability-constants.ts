import { Ability, AbilityTier } from './types';

// --- ABILITY REGISTRY ---
export const ABILITY_REGISTRY: Record<string, Ability> = {};

// Helper to register simple abilities inline
export const register = (ability: Ability): Ability => {
  ABILITY_REGISTRY[ability.id] = ability;
  return ability;
};

// --- ABILITY HELPERS ---
export const generateLinearTiers = (maxLevel: number, baseVal: number, step: number, unit: string, type: 'Damage' | 'Heal' | 'Effect'): AbilityTier[] => {
  const tiers: AbilityTier[] = [];
  for (let i = 1; i <= maxLevel; i++) {
    const val = baseVal + (step * (i - 1));
    tiers.push({
      level: i,
      effectDescription: `${type}: ${val}${unit}`,
      cooldown: '30s',
      duration: 'Instant'
    });
  }
  return tiers;
};

// --- SPECIAL ABILITY DEFINITIONS ---

// 1. Ghost Protocol (Evolution of Scout Ability)
export const ABILITY_GHOST_PROTOCOL: Ability = register({
  id: 'ghost_protocol',
  name: 'Ghost Protocol',
  description: 'Complete visual and thermal invisibility. Attacks do not break stealth for the first 3 seconds.',
  maxLevel: 5,
  tiers: [
    { level: 1, effectDescription: 'Attacks do not break stealth.', duration: '20s', cooldown: '10m' },
    { level: 2, effectDescription: 'Attacks do not break stealth.', duration: '30s', cooldown: '10m' },
    { level: 3, effectDescription: 'Attacks do not break stealth.', duration: '40s', cooldown: '10m' },
    { level: 4, effectDescription: 'Attacks do not break stealth.', duration: '50s', cooldown: '10m' },
    { level: 5, effectDescription: 'Permanent Stealth until attack.', duration: 'Toggle', cooldown: '5m' },
  ]
});

// 2. Light Armor Familiarity (Scout Base)
export const ABILITY_LIGHT_ARMOR: Ability = register({
  id: 'light_armor_familiarity',
  name: 'Light Armor Familiarity',
  description: 'Allows the user to activate Active Camouflage when wearing the Scout Suit.',
  maxLevel: 10,
  evolutionId: 'ghost_protocol',
  tiers: [
    { level: 1, effectDescription: 'Active Camouflage enabled.', duration: '10s', cooldown: '10m' },
    { level: 2, effectDescription: 'Camouflage stabilization.', duration: '15s', cooldown: '10m' },
    { level: 3, effectDescription: 'Movement blur reduction.', duration: '20s', cooldown: '10m' },
    { level: 4, effectDescription: 'Thermal masking.', duration: '25s', cooldown: '10m' },
    { level: 5, effectDescription: 'Sound dampening.', duration: '30s', cooldown: '10m' },
    { level: 6, effectDescription: 'Advanced distortion.', duration: '35s', cooldown: '15m' },
    { level: 7, effectDescription: 'Running does not break shimmer.', duration: '40s', cooldown: '15m' },
    { level: 8, effectDescription: 'Silhouette erasure.', duration: '45s', cooldown: '15m' },
    { level: 9, effectDescription: 'Light bending mastery.', duration: '50s', cooldown: '15m' },
    { level: 10, effectDescription: 'Maximized Active Camouflage.', duration: '55s', cooldown: '15m' },
  ]
});