// ============================================================
// SHARED ABILITY TYPES
// ============================================================

export interface AbilityTier {
  level: number;
  duration?: string;
  cooldown?: string;
  energyCost?: number;
  effectDescription?: string;
}

export interface ExportedAbility {
  id: number;
  slug: string;
  name: string;
  description: string;
  maxLevel: number;
  evolutionId?: number;
  tiers: AbilityTier[];
}

// Legacy types for backwards compatibility
export interface Ability {
  id: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
  tiers: AbilityTier[];
}
