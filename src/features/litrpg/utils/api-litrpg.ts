/**
 * LitRPG API Utilities
 * Frontend functions to interact with the LitRPG backend API
 * 
 * NOTE: Only Characters have full CRUD. Other entities (classes, abilities, 
 * monsters, items, contracts) are managed via constants files.
 */

import { API_BASE } from '../../../lib/apiBase';
import { getAllAbilities, ExportedAbility } from '../abilities';
import { getAllClasses, ExportedClass } from '../class-constants';

// Cache TTL for future use
// const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// =====================================================
// TYPES
// =====================================================

export interface EquippedItems {
  armor?: number | null;
  weapon_primary?: number | null;
  weapon_secondary?: number | null;
  accessory_1?: number | null;
  accessory_2?: number | null;
  accessory_3?: number | null;
}

export interface LitrpgCharacter {
  id: number;
  slug: string;
  name: string;
  description?: string;
  level: number;
  xp_current: number;
  xp_to_level: number;
  class_id?: number;
  class_level: number;
  class_name?: string;
  class_slug?: string;
  stats?: Record<string, number>;
  hp_max: number;
  hp_current: number;
  ep_max: number;
  ep_current: number;
  neural_heat: number;
  credits: number;
  equipped_items?: EquippedItems;
  inventory?: number[];
  unlocked_abilities?: number[] | Record<string, number>;
  portrait_image?: string;
  status: string;
}

// =====================================================
// CHARACTER API (Full CRUD)
// =====================================================

export async function listCharacters(): Promise<{ success: boolean; characters: LitrpgCharacter[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/litrpg/characters/list.php`, {
      credentials: 'same-origin'
    });
    return await response.json();
  } catch (error) {
    return { success: false, characters: [], error: String(error) };
  }
}

export async function getCharacter(slugOrId: string | number): Promise<{ success: boolean; character?: LitrpgCharacter; error?: string }> {
  try {
    const param = typeof slugOrId === 'number' ? `id=${slugOrId}` : `slug=${encodeURIComponent(slugOrId)}`;
    const response = await fetch(`${API_BASE}/litrpg/characters/get.php?${param}`, {
      credentials: 'same-origin'
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function createCharacter(data: Omit<LitrpgCharacter, 'id'>): Promise<{ success: boolean; character?: LitrpgCharacter; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/litrpg/characters/create.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const text = await response.text();
      try {
        const errorData = JSON.parse(text);
        return { success: false, error: errorData.error || `HTTP ${response.status}` };
      } catch {
        return { success: false, error: text || `HTTP ${response.status}` };
      }
    }
    return await response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateCharacter(characterData: Partial<LitrpgCharacter> & { id: number }): Promise<{ success: boolean; character?: LitrpgCharacter; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/litrpg/characters/update.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(characterData),
    });
    if (!response.ok) {
      const text = await response.text();
      try {
        const errorData = JSON.parse(text);
        return { success: false, error: errorData.error || `HTTP ${response.status}` };
      } catch {
        return { success: false, error: text || `HTTP ${response.status}` };
      }
    }
    return await response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteCharacter(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/litrpg/characters/delete.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      const text = await response.text();
      try {
        const errorData = JSON.parse(text);
        return { success: false, error: errorData.error || `HTTP ${response.status}` };
      } catch {
        return { success: false, error: text || `HTTP ${response.status}` };
      }
    }
    return await response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// =====================================================
// READ-ONLY LIST APIs (for reference/lookup from DB)
// These may be deprecated in favor of constants files
// =====================================================

export interface LitrpgClass {
  id: number;
  slug: string;
  name: string;
  description?: string;
  tier: string;
  unlock_level: number;
  prerequisite_class_id?: number;
  stat_bonuses?: Record<string, number>;
  primary_attribute?: string;
  secondary_attribute?: string;
  icon_image?: string;
  abilities?: Array<{ id: number; name: string; unlock_class_level: number }>;
}

export interface LitrpgAbilityTier {
  id: number;
  ability_id: number;
  tier_level: number;
  duration?: string;
  cooldown?: string;
  energy_cost?: number;
  effect_description?: string;
}

export interface LitrpgAbility {
  id: number;
  slug: string;
  name: string;
  description?: string;
  max_level: number;
  evolution_ability_id?: number;
  evolution_level?: number;
  icon_image?: string;
  tiers: LitrpgAbilityTier[];
}

// classesCache removed - now served from constants

// Get all abilities for mapping (cached at module level)
const allAbilitiesMap: Map<number, ExportedAbility> = new Map();
function ensureAbilitiesMap() {
  if (allAbilitiesMap.size === 0) {
    getAllAbilities().forEach(a => allAbilitiesMap.set(a.id, a));
  }
}

// Convert constants format to LitrpgClass format
function convertExportedToLitrpgClass(cls: ExportedClass): LitrpgClass {
  ensureAbilitiesMap();
  
  // Map abilityIds to full ability objects
  const abilities = cls.abilityIds
    .map(id => {
      const ability = allAbilitiesMap.get(id);
      if (ability) {
        return { id: ability.id, name: ability.name, unlock_class_level: 1 };
      }
      return null;
    })
    .filter((a): a is { id: number; name: string; unlock_class_level: number } => a !== null);
  
  return {
    id: cls.id,
    slug: cls.slug,
    name: cls.name,
    description: cls.description,
    tier: `tier-${cls.tier}`,  // Format as 'tier-1', 'tier-2', etc.
    unlock_level: cls.unlockLevel,
    prerequisite_class_id: cls.prerequisiteClassId,
    stat_bonuses: cls.statBonuses,
    primary_attribute: cls.primaryAttribute,
    secondary_attribute: cls.secondaryAttribute,
    abilities: abilities.length > 0 ? abilities : undefined,
  };
}

export async function listClasses(): Promise<{ success: boolean; classes: LitrpgClass[]; error?: string }> {
  // Return classes from constants instead of API
  const classes = getAllClasses().map(convertExportedToLitrpgClass);
  return { success: true, classes };
}

export async function getCachedClasses(): Promise<LitrpgClass[]> {
  // Return classes directly from constants (no caching needed)
  return getAllClasses().map(convertExportedToLitrpgClass);
}

// Convert constants format to LitrpgAbility format
function convertExportedToLitrpgAbility(ability: ExportedAbility): LitrpgAbility {
  return {
    id: ability.id,
    slug: ability.slug,
    name: ability.name,
    description: ability.description,
    max_level: ability.maxLevel,
    evolution_ability_id: ability.evolutionId,
    tiers: ability.tiers.map((tier, index) => ({
      id: index + 1,
      ability_id: ability.id,
      tier_level: tier.level,
      duration: tier.duration,
      cooldown: tier.cooldown,
      energy_cost: tier.energyCost,
      effect_description: tier.effectDescription,
    })),
  };
}

export async function listAbilities(): Promise<{ success: boolean; abilities: LitrpgAbility[]; error?: string }> {
  // Return abilities from constants instead of API
  const abilities = getAllAbilities().map(convertExportedToLitrpgAbility);
  return { success: true, abilities };
}

export async function getCachedAbilities(): Promise<LitrpgAbility[]> {
  // Return abilities directly from constants (no caching needed)
  return getAllAbilities().map(convertExportedToLitrpgAbility);
}

// Clear caches (no-op since we use constants now)
export function clearAllCaches(): void {
  // No caches to clear - data comes from constants
}
