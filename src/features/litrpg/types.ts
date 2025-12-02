export enum Attribute {
  STR = 'STR',
  PER = 'PER',
  DEX = 'DEX',
  MEM = 'MEM',
  INT = 'INT',
  CHA = 'CHA'
}

export enum ClassName {
  RECRUIT = 'Recruit',
  // Tier 2
  RANGER = 'Ranger',
  HUNTER = 'Hunter',
  BRAWLER = 'Brawler',
  SCOUT = 'Scout',
  DEFENDER = 'Defender',
  TECHNICIAN = 'Technician',
  MINUTEMAN = 'Minuteman',
  MARAUDER = 'Marauder',
  FIELD_MEDIC = 'Field Medic',
  // Tier 3
  ASSASSIN = 'Assassin',
  OPERATIVE = 'Operative',
  DEADEYE = 'Deadeye',
  BLADE_MASTER = 'Blade Master',
  COMBAT_MEDIC = 'Combat Medic',
  BIO_ENGINEER = 'Bio-Engineer',
  SUPPRESSOR = 'Suppressor',
  JUGGERNAUT = 'Juggernaut',
  CRUSHER = 'Crusher',
  COMBAT_ENGINEER = 'Combat Engineer',
  DEMOLITIONS_EXPERT = 'Demolitions Expert'
}

export type MonsterRank = 'Trash' | 'Regular' | 'Champion' | 'Boss';

export interface AbilityTier {
  level: number;
  effectDescription: string;
  duration?: string;
  cooldown?: string;
}

export interface Ability {
  id: string; // Unique ID for registry lookup
  name: string;
  description: string;
  maxLevel: number;
  tiers: AbilityTier[];
  evolutionId?: string; // ID of the ability this evolves into
}

export interface CharacterClass {
  name: ClassName;
  description: string;
  startingItem: string;
  abilities: Ability[]; // Template abilities
  primaryAttribute: Attribute;
  secondaryAttribute: Attribute;
  upgrades?: ClassName[]; // List of classes this class can upgrade into
}

export interface EquippedItems {
  armor?: number | null;
  weapon_primary?: number | null;
  weapon_secondary?: number | null;
  accessory_1?: number | null;
  accessory_2?: number | null;
  accessory_3?: number | null;
}

// Track when each class was held (for stat bonus calculation)
export interface ClassHistoryEntry {
  className: string;
  activatedAtLevel: number;
  deactivatedAtLevel?: number; // undefined if currently active
}

export interface Character {
  name: string;
  headerImageUrl?: string; // URL for the banner image
  level: number;
  xp: number;
  credits: number;
  className: ClassName;
  classHistory?: string[]; // Previous class names for ability retention (simple list)
  classHistoryWithLevels?: ClassHistoryEntry[]; // Full history with activation levels for stat bonuses
  highestTierAchieved?: number; // Track highest tier reached for bonus ability points
  classActivatedAtLevel?: number; // Level at which current class was selected (for stat bonus calculation)
  // Profession tracking (separate from combat class)
  professionName?: string; // Current profession name
  professionHistory?: string[]; // Previous professions for ability retention
  professionHistoryWithLevels?: ClassHistoryEntry[]; // Full profession history with levels for stat bonuses
  professionActivatedAtLevel?: number; // Level at which current profession was selected
  attributes: Record<Attribute, number>;
  abilities: Record<string, number>; // Ability Name -> Level
  inventory: string[];
  history: string[]; // Log of major events
  equippedItems?: EquippedItems; // Equipment from database
}

export interface Monster {
  id: string;
  name: string;
  description: string;
  level: number;
  rank: MonsterRank;
  xpReward: number;
  credits: number;
  stats: Record<Attribute, number>;
  abilities: string[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  rewards: string;
  steps: string[];
}

export interface SaveData {
  version: string;
  timestamp: number;
  character: Character;
  monsters?: Monster[];
  quests: Quest[];
}
