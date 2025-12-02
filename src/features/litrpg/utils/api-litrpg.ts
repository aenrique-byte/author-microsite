/**
 * LitRPG API Utilities
 * Frontend functions to interact with the LitRPG backend API backed by MySQL
 */

import { API_BASE } from '../../../lib/apiBase';

// Basic cache containers to avoid refetching static reference data
let classesCache: LitrpgClass[] | null = null;
let abilitiesCache: LitrpgAbility[] | null = null;
let professionsCache: LitrpgProfession[] | null = null;
let monstersCache: LitrpgMonster[] | null = null;
let itemsCache: LitrpgItem[] | null = null;

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

export interface LitrpgContract {
  id: number;
  slug: string;
  title: string;
  description?: string;
  contract_type?: string;
  difficulty?: string;
  level_requirement: number;
  time_limit?: string;
  objectives?: Array<{ description: string; target: number; current?: number | null }>;
  rewards?: Record<string, unknown>;
  icon_image?: string;
  status?: string;
  sort_order?: number;
}

export interface LitrpgAbilityTier {
  level: number;
  duration?: string;
  cooldown?: string;
  energyCost?: number;
  effectDescription?: string;
}

export interface LitrpgAbility {
  id: number;
  slug: string;
  name: string;
  description?: string;
  maxLevel: number;
  evolutionId?: number;
  evolutionLevel?: number;
  category?: string;
  icon_image?: string;
  tiers: LitrpgAbilityTier[];
}

export interface LitrpgClass {
  id: number;
  slug: string;
  name: string;
  description?: string;
  tier: string; // formatted as `tier-#` for UI compatibility
  unlock_level: number;
  prerequisite_class_id?: number;
  stat_bonuses?: Record<string, number>;
  primary_attribute?: string;
  secondary_attribute?: string;
  starting_item?: string;
  ability_ids?: number[];
  upgrade_ids?: number[];
  icon_image?: string;
  status?: string;
}

export interface LitrpgProfession {
  id: number;
  slug: string;
  name: string;
  description?: string;
  tier: string;
  unlock_level: number;
  prerequisite_profession_id?: number;
  stat_bonuses?: Record<string, number>;
  ability_ids?: number[];
  icon_image?: string;
  status?: string;
}

export interface LitrpgMonster {
  id: number;
  slug: string;
  name: string;
  description?: string;
  level: number;
  rank: string;
  hp?: number;
  xp_reward: number;
  credits: number;
  stats?: Record<string, number>;
  abilities?: string[];
  loot_table?: Array<{ item: string; rate: number }>;
  icon_image?: string;
  status?: string;
}

export interface LitrpgItem {
  id: number;
  slug: string;
  name: string;
  description?: string;
  tech_level?: string;
  category?: string;
  rarity?: string;
  base_value?: number;
  stats?: Record<string, number>;
  requirements?: Record<string, unknown>;
  icon_image?: string;
  status?: string;
}

export interface NewAbilityInput {
  slug: string;
  name: string;
  description?: string;
  maxLevel: number;
  category?: string;
  evolutionId?: number;
  evolutionLevel?: number;
  tierPreview?: {
    level: number;
    duration?: string;
    cooldown?: string;
    energyCost?: number;
    effectDescription?: string;
  };
}

export interface NewClassInput {
  slug: string;
  name: string;
  description?: string;
  tier: number;
  unlock_level: number;
  primary_attribute?: string;
  secondary_attribute?: string;
  ability_ids?: number[];
}

export interface NewMonsterInput {
  slug: string;
  name: string;
  description?: string;
  level: number;
  rank: string;
  xp_reward: number;
  credits: number;
  hp?: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
}

async function postJson<T>(url: string, body: unknown, method: 'POST' | 'PUT' | 'DELETE' = 'POST'): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    } catch (err) {
      throw new Error(text || `HTTP ${response.status}`);
    }
  }

  return text ? JSON.parse(text) : ({} as T);
}

// =====================================================
// CHARACTER API (Full CRUD)
// =====================================================

export async function listCharacters(): Promise<{ success: boolean; characters: LitrpgCharacter[]; error?: string }> {
  try {
    return await fetchJson(`${API_BASE}/litrpg/characters/list.php`);
  } catch (error) {
    return { success: false, characters: [], error: String(error) };
  }
}

export async function getCharacter(slugOrId: string | number): Promise<{ success: boolean; character?: LitrpgCharacter; error?: string }> {
  try {
    const param = typeof slugOrId === 'number' ? `id=${slugOrId}` : `slug=${encodeURIComponent(slugOrId)}`;
    return await fetchJson(`${API_BASE}/litrpg/characters/get.php?${param}`);
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
// CONTRACTS/QUESTS API
// =====================================================

export async function listContracts(params?: {
  difficulty?: string;
  contract_type?: string;
  level_requirement?: number;
}): Promise<{ success: boolean; contracts: LitrpgContract[]; error?: string }> {
  try {
    const query = new URLSearchParams();
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    if (params?.contract_type) query.set('contract_type', params.contract_type);
    if (params?.level_requirement) query.set('level_requirement', String(params.level_requirement));

    const response = await fetch(
      `${API_BASE}/litrpg/contracts/list.php${query.toString() ? `?${query.toString()}` : ''}`,
      { credentials: 'same-origin' }
    );
    return await response.json();
  } catch (error) {
    return { success: false, contracts: [], error: String(error) };
  }
}

export async function createContract(
  data: Omit<LitrpgContract, 'id'>
): Promise<{ success: boolean; contract?: LitrpgContract; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/litrpg/contracts/create.php`, {
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

export async function updateContract(
  data: Partial<LitrpgContract> & { id: number }
): Promise<{ success: boolean; contract?: LitrpgContract; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/litrpg/contracts/update.php`, {
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

export async function deleteContract(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/litrpg/contracts/delete.php`, {
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
// READ-ONLY LIST APIs (reference data from MySQL)
// =====================================================

function normalizeTier(tier: string | number): string {
  if (typeof tier === 'string' && tier.startsWith('tier-')) return tier.toLowerCase();
  const numericTier = typeof tier === 'number' ? tier : parseInt(String(tier).replace(/[^0-9]/g, ''), 10) || 1;
  return `tier-${numericTier}`;
}

export async function listClasses(): Promise<{ success: boolean; classes: LitrpgClass[]; error?: string }> {
  try {
    const data = await fetchJson<{ success: boolean; classes: any[]; error?: string }>(`${API_BASE}/litrpg/classes/list.php`);
    if (!data.success) return { success: false, classes: [], error: data.error };

    const classes = data.classes.map((cls) => ({
      ...cls,
      tier: normalizeTier(cls.tier),
      stat_bonuses: cls.stat_bonuses || {},
      ability_ids: cls.ability_ids || [],
      upgrade_ids: cls.upgrade_ids || [],
    })) as LitrpgClass[];

    classesCache = classes;
    return { success: true, classes };
  } catch (error) {
    return { success: false, classes: [], error: String(error) };
  }
}

export async function getCachedClasses(): Promise<LitrpgClass[]> {
  if (classesCache) return classesCache;
  const result = await listClasses();
  return result.success ? result.classes : [];
}

export async function createClass(payload: NewClassInput): Promise<{ success: boolean; class?: LitrpgClass; error?: string }> {
  try {
    const result = await postJson<{ success: boolean; class?: any; error?: string }>(`${API_BASE}/litrpg/classes/create.php`, {
      slug: payload.slug,
      name: payload.name,
      description: payload.description,
      tier: payload.tier,
      unlock_level: payload.unlock_level,
      primary_attribute: payload.primary_attribute,
      secondary_attribute: payload.secondary_attribute,
      ability_ids: payload.ability_ids || [],
    });

    if (!result.success || !result.class) return { success: false, error: result.error || 'Failed to create class' };

    classesCache = null;
    const cls: LitrpgClass = {
      ...result.class,
      tier: normalizeTier(result.class.tier),
      stat_bonuses: result.class.stat_bonuses || {},
      ability_ids: result.class.ability_ids || [],
      upgrade_ids: result.class.upgrade_ids || [],
    };

    return { success: true, class: cls };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateClassAbilities(classId: number, abilityIds: number[]): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await postJson<{ success: boolean; error?: string }>(`${API_BASE}/litrpg/classes/update.php`, {
      id: classId,
      ability_ids: abilityIds,
    });

    if (!result.success) return { success: false, error: result.error || 'Failed to update abilities' };
    classesCache = null;
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function listProfessions(): Promise<{ success: boolean; professions: LitrpgProfession[]; error?: string }> {
  try {
    const data = await fetchJson<{ success: boolean; professions: any[]; error?: string }>(`${API_BASE}/litrpg/professions/list.php`);
    if (!data.success) return { success: false, professions: [], error: data.error };

    const professions = data.professions.map((prof) => ({
      ...prof,
      tier: normalizeTier(prof.tier),
      stat_bonuses: prof.stat_bonuses || {},
      ability_ids: prof.ability_ids || [],
    })) as LitrpgProfession[];

    professionsCache = professions;
    return { success: true, professions };
  } catch (error) {
    return { success: false, professions: [], error: String(error) };
  }
}

export async function getCachedProfessions(): Promise<LitrpgProfession[]> {
  if (professionsCache) return professionsCache;
  const result = await listProfessions();
  return result.success ? result.professions : [];
}

export async function listAbilities(): Promise<{ success: boolean; abilities: LitrpgAbility[]; error?: string }> {
  try {
    const data = await fetchJson<{ success: boolean; abilities: any[]; error?: string }>(`${API_BASE}/litrpg/abilities/list.php`);
    if (!data.success) return { success: false, abilities: [], error: data.error };

    const abilities = data.abilities.map((ability) => ({
      id: ability.id,
      slug: ability.slug,
      name: ability.name,
      description: ability.description,
      maxLevel: ability.max_level,
      evolutionId: ability.evolution_ability_id || undefined,
      evolutionLevel: ability.evolution_level || undefined,
      category: ability.category || undefined,
      icon_image: ability.icon_image,
      tiers: (ability.tiers || []).map((tier: any) => ({
        level: tier.tier_level,
        duration: tier.duration || undefined,
        cooldown: tier.cooldown || undefined,
        energyCost: tier.energy_cost || undefined,
        effectDescription: tier.effect_description || undefined,
      })),
    })) as LitrpgAbility[];

    abilitiesCache = abilities;
    return { success: true, abilities };
  } catch (error) {
    return { success: false, abilities: [], error: String(error) };
  }
}

export async function getCachedAbilities(): Promise<LitrpgAbility[]> {
  if (abilitiesCache) return abilitiesCache;
  const result = await listAbilities();
  return result.success ? result.abilities : [];
}

export async function createAbility(payload: NewAbilityInput): Promise<{ success: boolean; ability?: LitrpgAbility; error?: string }> {
  try {
    const result = await postJson<{ success: boolean; ability?: any; error?: string }>(`${API_BASE}/litrpg/abilities/create.php`, {
      slug: payload.slug,
      name: payload.name,
      description: payload.description,
      max_level: payload.maxLevel,
      category: payload.category,
      evolution_ability_id: payload.evolutionId,
      evolution_level: payload.evolutionLevel,
      tiers: payload.tierPreview
        ? [
            {
              tier_level: payload.tierPreview.level,
              duration: payload.tierPreview.duration,
              cooldown: payload.tierPreview.cooldown,
              energy_cost: payload.tierPreview.energyCost,
              effect_description: payload.tierPreview.effectDescription,
            },
          ]
        : [],
    });

    if (!result.success || !result.ability) return { success: false, error: result.error || 'Failed to create ability' };

    abilitiesCache = null;
    const normalized: LitrpgAbility = {
      id: result.ability.id,
      slug: result.ability.slug,
      name: result.ability.name,
      description: result.ability.description,
      maxLevel: result.ability.max_level,
      evolutionId: result.ability.evolution_ability_id || undefined,
      evolutionLevel: result.ability.evolution_level || undefined,
      category: result.ability.category,
      icon_image: result.ability.icon_image,
      tiers: (result.ability.tiers || []).map((tier: any) => ({
        level: tier.tier_level,
        duration: tier.duration || undefined,
        cooldown: tier.cooldown || undefined,
        energyCost: tier.energy_cost || undefined,
        effectDescription: tier.effect_description || undefined,
      })),
    };

    return { success: true, ability: normalized };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function listMonsters(): Promise<{ success: boolean; monsters: LitrpgMonster[]; error?: string }> {
  try {
    const data = await fetchJson<{ success: boolean; monsters: any[]; error?: string }>(`${API_BASE}/litrpg/monsters/list.php`);
    if (!data.success) return { success: false, monsters: [], error: data.error };

    const monsters = data.monsters.map((monster) => ({
      ...monster,
      stats: monster.stats || {},
      abilities: monster.abilities || [],
      loot_table: monster.loot_table || [],
    })) as LitrpgMonster[];

    monstersCache = monsters;
    return { success: true, monsters };
  } catch (error) {
    return { success: false, monsters: [], error: String(error) };
  }
}

export async function getCachedMonsters(): Promise<LitrpgMonster[]> {
  if (monstersCache) return monstersCache;
  const result = await listMonsters();
  return result.success ? result.monsters : [];
}

export async function createMonster(payload: NewMonsterInput): Promise<{ success: boolean; monster?: LitrpgMonster; error?: string }> {
  try {
    const result = await postJson<{ success: boolean; monster?: any; error?: string }>(`${API_BASE}/litrpg/monsters/create.php`, {
      ...payload,
    });

    if (!result.success || !result.monster) return { success: false, error: result.error || 'Failed to create monster' };

    monstersCache = null;
    const monster: LitrpgMonster = {
      ...result.monster,
      stats: result.monster.stats || {},
      abilities: result.monster.abilities || [],
      loot_table: result.monster.loot_table || [],
    };

    return { success: true, monster };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function listItems(): Promise<{ success: boolean; items: LitrpgItem[]; error?: string }> {
  try {
    const data = await fetchJson<{ success: boolean; items: any[]; error?: string }>(`${API_BASE}/litrpg/items/list.php`);
    if (!data.success) return { success: false, items: [], error: data.error };

    const items = data.items.map((item) => ({
      ...item,
      stats: item.stats || {},
      requirements: item.requirements || {},
    })) as LitrpgItem[];

    itemsCache = items;
    return { success: true, items };
  } catch (error) {
    return { success: false, items: [], error: String(error) };
  }
}

export async function getCachedItems(): Promise<LitrpgItem[]> {
  if (itemsCache) return itemsCache;
  const result = await listItems();
  return result.success ? result.items : [];
}

export function clearAllCaches(): void {
  classesCache = null;
  abilitiesCache = null;
  professionsCache = null;
  monstersCache = null;
  itemsCache = null;
}
