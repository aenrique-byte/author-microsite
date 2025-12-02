# LitRPG Agent Notes (SQL-First)

- Prefer MySQL-backed API data over legacy constant files. Use the helpers in `utils/api-litrpg.ts` (e.g., `listItems`, `listClasses`, `listAbilities`) instead of importing `*-constants.ts` datasets.
- When you need static metadata (like color maps), keep it small and UI-focused—never reintroduce large gameplay datasets as constants.
- Cache reads should go through the existing "getCached" helpers where available to avoid redundant network calls.
- If you add new LitRPG UI, wire it to the PHP endpoints under `api/litrpg/` and keep typings alongside the API utilities.

# LitRPG System Documentation for AI Agents

## Overview

The LitRPG system is a comprehensive tabletop RPG management tool integrated into the Author CMS. It provides character sheet management, monster databases, ability systems, loot catalogs, and quest tracking with AI-powered enhancements via Google Gemini.

### Technology Stack

- **Frontend:** React 18 + TypeScript
- **Backend:** PHP 8+ REST API
- **Database:** MySQL/MariaDB
- **AI Integration:** Google Gemini API
- **State Management:** React hooks and local state
- **UI Components:** Custom components with Tailwind CSS

### Core Features

1. **Character Management** - Create and manage player characters with classes, professions, stats
2. **Class System** - 4-tier progression system (Recruit → Specialist → Elite → Master)
3. **Profession System** - Non-combat specializations (Pilot, Medical Officer, Engineer, etc.)
4. **Ability Library** - Combat and professional abilities with 10-tier progression
5. **Bestiary** - Monster database with stats, abilities, and loot tables
6. **Loot Catalog** - Items, weapons, armor, consumables with tech levels
7. **Quest System** - Contracts with objectives, rewards, and difficulty levels
8. **Battle Simulator** - Combat simulation system
9. **Attribute Encyclopedia** - Reference for game mechanics

## Project Structure

```
src/features/litrpg/
├── pages/                          # Main page components
│   ├── LitrpgHome.tsx             # Dashboard/home page
│   ├── ClassesPage.tsx            # Class management interface
│   ├── AbilitiesPage.tsx          # Ability library interface
│   ├── BestiaryPage.tsx           # Monster manual interface
│   ├── LootPage.tsx               # Item catalog interface
│   ├── ContractsPage.tsx          # Quest/contract interface
│   └── AttributesPage.tsx         # Attribute reference
│
├── components/                     # Reusable UI components
│   ├── CharacterSheet.tsx         # Character creation/editing
│   ├── ClassAbilitiesManager.tsx  # Class-to-ability assignment
│   ├── ClassSelectionModal.tsx    # Class selection UI
│   ├── ClassEditorModal.tsx       # Class editing UI
│   ├── AbilityLibrary.tsx         # Ability browsing
│   ├── MonsterManual.tsx          # Monster browsing
│   ├── LootCatalog.tsx            # Item browsing
│   ├── QuestSystem.tsx            # Quest management
│   ├── BattleSimulator.tsx        # Combat simulation
│   ├── AttributeEncyclopedia.tsx  # Attribute reference
│   ├── EquipmentSection.tsx       # Character equipment
│   ├── LitrpgLayout.tsx           # Page layout wrapper
│   ├── LitrpgNav.tsx              # Navigation component
│   └── Drawer.tsx                 # Slide-out drawer UI
│
├── abilities/                      # Ability definitions by category
│   ├── perception-targeting.ts    # Perception/targeting abilities
│   ├── offense/                   # Offensive abilities
│   │   ├── melee.ts              # Melee combat abilities
│   │   └── ranged.ts             # Ranged combat abilities
│   ├── defense-mitigation.ts      # Defensive abilities
│   ├── movement-positioning.ts    # Movement abilities
│   ├── stealth-signature.ts       # Stealth abilities
│   ├── support-medical.ts         # Support/healing abilities
│   └── quantum-hacking.ts         # Tech/hacking abilities
│
├── utils/                          # Utility functions
│   └── api-litrpg.ts              # API client for all LitRPG endpoints
│
├── types.ts                        # TypeScript type definitions
├── constants.ts                    # General constants
├── class-constants.ts              # Class definitions
├── profession-constants.ts         # Profession definitions
├── ability-constants.ts            # Ability definitions
├── professional-abilities-constants.ts  # Professional ability definitions
├── tier-constants.ts               # Tier progression data
├── monster-constants.ts            # Monster definitions
├── loot-constants.ts               # Item/loot definitions
├── contracts-constants.ts          # Contract/quest definitions
├── xp-constants.ts                 # XP progression tables
├── LitrpgApp.tsx                   # App root component
├── LitrpgRoute.tsx                 # Route configuration
└── index.ts                        # Module exports
```

## Database Schema

### Core Tables

#### 1. `litrpg_classes` - Combat Classes

**Purpose:** Define combat classes with progression tiers (1-4)

**Fields:**
- `id` (INT UNSIGNED, AUTO_INCREMENT, PRIMARY KEY) - Unique class ID
- `slug` (VARCHAR(100), UNIQUE, NOT NULL) - URL-friendly identifier
- `name` (VARCHAR(200), NOT NULL) - Display name (e.g., "Recruit", "Scout")
- `description` (TEXT) - Class description
- `tier` (INT UNSIGNED, NOT NULL, DEFAULT 1) - Numeric tier: 1, 2, 3, or 4
- `unlock_level` (INT UNSIGNED, NOT NULL, DEFAULT 1) - Character level required
- `prerequisite_class_id` (INT UNSIGNED, FOREIGN KEY) - Required class before this one
- `stat_bonuses` (JSON) - Stat bonuses: `{STR: 1, DEX: 2, ...}`
- `primary_attribute` (VARCHAR(10)) - Primary stat (STR, DEX, PER, MEM, INT, CHA)
- `secondary_attribute` (VARCHAR(10)) - Secondary stat
- `starting_item` (VARCHAR(255)) - Item given when class is first selected
- `ability_ids` (JSON ARRAY) - Array of ability IDs unlocked by this class
- `upgrade_ids` (JSON ARRAY) - Array of class IDs this can upgrade to
- `icon_image` (VARCHAR(255)) - Icon image URL/path
- `status` (ENUM: 'active', 'inactive', 'archived', DEFAULT 'active')
- `sort_order` (INT, DEFAULT 0) - Display order
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE)

**Indexes:**
- `idx_tier` on `tier`
- `idx_unlock_level` on `unlock_level`
- `idx_status` on `status`
- `idx_sort_order` on `sort_order`

**Relationships:**
- Self-referencing: `prerequisite_class_id` → `litrpg_classes.id`

---

#### 2. `litrpg_professions` - Non-Combat Professions

**Purpose:** Define non-combat professions (Pilot, Medical Officer, etc.)

**Fields:**
- `id` (INT UNSIGNED, AUTO_INCREMENT, PRIMARY KEY)
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- `name` (VARCHAR(200), NOT NULL) - Display name
- `description` (TEXT)
- `tier` (VARCHAR(20), NOT NULL, DEFAULT 'tier-1') - 'tier-1' or 'tier-2'
- `unlock_level` (INT UNSIGNED, NOT NULL, DEFAULT 16) - Character level required
- `prerequisite_profession_id` (INT UNSIGNED, FOREIGN KEY) - Required profession
- `stat_bonuses` (JSON) - Stat bonuses: `{INT: 1, CHA: 1, ...}`
- `ability_ids` (JSON ARRAY) - Array of professional ability IDs
- `icon_image` (VARCHAR(255))
- `status` (ENUM: 'active', 'inactive', 'archived', DEFAULT 'active')
- `sort_order` (INT, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_tier` on `tier`
- `idx_unlock_level` on `unlock_level`
- `idx_status` on `status`
- `idx_sort_order` on `sort_order`

**Relationships:**
- Self-referencing: `prerequisite_profession_id` → `litrpg_professions.id`

---

#### 3. `litrpg_abilities` - Combat Abilities

**Purpose:** Define combat abilities with evolution chains

**Fields:**
- `id` (INT UNSIGNED, AUTO_INCREMENT, PRIMARY KEY)
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- `name` (VARCHAR(200), NOT NULL) - Ability name
- `description` (TEXT)
- `max_level` (INT UNSIGNED, NOT NULL, DEFAULT 10) - Maximum ability level
- `evolution_ability_id` (INT UNSIGNED, FOREIGN KEY) - Ability this evolves into
- `evolution_level` (INT UNSIGNED) - Level required for evolution
- `category` (VARCHAR(50)) - Category: 'perception-targeting', 'offense', 'defense', 'movement-positioning', 'stealth-signature', 'support-medical', 'quantum-hacking'
- `icon_image` (VARCHAR(255))
- `status` (ENUM: 'active', 'inactive', 'archived', DEFAULT 'active')
- `sort_order` (INT, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_category` on `category`
- `idx_status` on `status`
- `idx_sort_order` on `sort_order`

**Relationships:**
- Self-referencing: `evolution_ability_id` → `litrpg_abilities.id`

---

#### 4. `litrpg_ability_tiers` - Combat Ability Progression

**Purpose:** Define tier-by-tier progression for combat abilities (levels 1-10)

**Fields:**
- `id` (INT UNSIGNED, AUTO_INCREMENT, PRIMARY KEY)
- `ability_id` (INT UNSIGNED, FOREIGN KEY, NOT NULL) - Parent ability
- `tier_level` (INT UNSIGNED, NOT NULL) - Tier 1-10
- `duration` (VARCHAR(50)) - Effect duration (e.g., "6 sec", "15 sec")
- `cooldown` (VARCHAR(50)) - Cooldown time (e.g., "2 min", "30 sec")
- `energy_cost` (INT UNSIGNED) - Energy points required
- `effect_description` (TEXT) - Description of effects at this tier
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- UNIQUE constraint on (`ability_id`, `tier_level`)
- `idx_tier_level` on `tier_level`

**Relationships:**
- `ability_id` → `litrpg_abilities.id` (CASCADE DELETE)

---

#### 5. `litrpg_professional_abilities` - Professional Abilities

**Purpose:** Define profession-specific abilities (piloting, medical, etc.)

**Fields:**
- `id` (INT UNSIGNED, AUTO_INCREMENT, PRIMARY KEY)
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- `name` (VARCHAR(200), NOT NULL)
- `description` (TEXT)
- `max_level` (INT UNSIGNED, NOT NULL, DEFAULT 10)
- `category` (VARCHAR(50)) - Category: 'piloting', 'medical', 'engineering', etc.
- `icon_image` (VARCHAR(255))
- `status` (ENUM: 'active', 'inactive', 'archived', DEFAULT 'active')
- `sort_order` (INT, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_category` on `category`
- `idx_status` on `status`
- `idx_sort_order` on `sort_order`

---

#### 6. `litrpg_professional_ability_tiers` - Professional Ability Progression

**Purpose:** Define tier-by-tier progression for professional abilities

**Fields:**
- `id` (INT UNSIGNED, AUTO_INCREMENT, PRIMARY KEY)
- `ability_id` (INT UNSIGNED, FOREIGN KEY, NOT NULL)
- `tier_level` (INT UNSIGNED, NOT NULL) - Tier 1-10
- `duration` (VARCHAR(50))
- `cooldown` (VARCHAR(50))
- `energy_cost` (INT UNSIGNED)
- `effect_description` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- UNIQUE constraint on (`ability_id`, `tier_level`)
- `idx_tier_level` on `tier_level`

**Relationships:**
- `ability_id` → `litrpg_professional_abilities.id` (CASCADE DELETE)

---

#### 7. `litrpg_items` - Items and Loot

**Purpose:** All items including weapons, armor, materials, consumables

**Fields:**
- `id` (INT UNSIGNED, AUTO_INCREMENT, PRIMARY KEY)
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- `name` (VARCHAR(200), NOT NULL)
- `description` (TEXT)
- `tech_level` (VARCHAR(10)) - Tech level: 'TL8', 'TL9', 'TL10'
- `category` (VARCHAR(50)) - Category: 'Weapon', 'Armor', 'Tool', 'Material', 'Consumable', 'Medical'
- `rarity` (VARCHAR(20), DEFAULT 'common') - Rarity: 'common', 'uncommon', 'rare', 'legendary'
- `base_value` (INT UNSIGNED, DEFAULT 0) - Base credit value
- `stats` (JSON) - Item stats/bonuses
- `requirements` (JSON) - Level/class requirements
- `icon_image` (VARCHAR(255))
- `status` (ENUM: 'active', 'inactive', 'archived', DEFAULT 'active')
- `sort_order` (INT, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_category` on `category`
- `idx_tech_level` on `tech_level`
- `idx_rarity` on `rarity`
- `idx_status` on `status`
- `idx_sort_order` on `sort_order`

---

#### 8. `litrpg_monsters` - Monsters and Enemies

**Purpose:** Monster database with stats, abilities, and loot

**Fields:**
- `id` (INT UNSIGNED, AUTO_INCREMENT, PRIMARY KEY)
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- `name` (VARCHAR(200), NOT NULL)
- `description` (TEXT)
- `level` (INT UNSIGNED, NOT NULL, DEFAULT 1)
- `rank` (ENUM: 'Trash', 'Regular', 'Champion', 'Boss', DEFAULT 'Regular')
- `hp` (INT UNSIGNED) - Hit points
- `xp_reward` (INT UNSIGNED, NOT NULL, DEFAULT 0) - Experience reward
- `credits` (INT UNSIGNED, NOT NULL, DEFAULT 0) - Credit reward
- `stats` (JSON) - Monster stats: `{STR: 1, PER: 1, ...}`
- `abilities` (JSON ARRAY) - Array of ability names
- `loot_table` (JSON ARRAY) - Array of `{item: "name", rate: 0.5}`
- `icon_image` (VARCHAR(255))
- `status` (ENUM: 'active', 'inactive', 'archived', DEFAULT 'active')
- `sort_order` (INT, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_level` on `level`
- `idx_rank` on `rank`
- `idx_status` on `status`
- `idx_sort_order` on `sort_order`

---

#### 9. `litrpg_contracts` - Quests and Missions

**Purpose:** Quest/contract system with objectives and rewards

**Fields:**
- `id` (INT UNSIGNED, AUTO_INCREMENT, PRIMARY KEY)
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- `title` (VARCHAR(200), NOT NULL)
- `description` (TEXT)
- `contract_type` (VARCHAR(50)) - Type: 'bounty', 'extraction', 'escort', 'patrol', 'investigation'
- `difficulty` (VARCHAR(20), DEFAULT 'routine') - Difficulty: 'routine', 'hazardous', 'critical', 'suicide'
- `level_requirement` (INT UNSIGNED, NOT NULL, DEFAULT 1)
- `time_limit` (VARCHAR(50)) - Time limit (e.g., "4 hours", "2 days")
- `objectives` (JSON ARRAY) - Array of `{description, target, current}`
- `rewards` (JSON) - Rewards: `{xp: 500, credits: 250, items: [...]}`
- `icon_image` (VARCHAR(255))
- `status` (ENUM: 'active', 'inactive', 'archived', DEFAULT 'active')
- `sort_order` (INT, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_difficulty` on `difficulty`
- `idx_level_requirement` on `level_requirement`
- `idx_contract_type` on `contract_type`
- `idx_status` on `status`
- `idx_sort_order` on `sort_order`

---

#### 10. `litrpg_characters` - Player Characters

**Purpose:** Player character sheets with full stat tracking

**Fields:**
- `id` (INT UNSIGNED, AUTO_INCREMENT, PRIMARY KEY)
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- `name` (VARCHAR(200), NOT NULL)
- `description` (TEXT)
- `level` (INT UNSIGNED, NOT NULL, DEFAULT 1)
- `xp_current` (INT UNSIGNED, NOT NULL, DEFAULT 0)
- `xp_to_level` (INT UNSIGNED, NOT NULL, DEFAULT 100)

**Class System:**
- `class_id` (INT UNSIGNED, FOREIGN KEY) - Current combat class
- `class_activated_at_level` (INT UNSIGNED, DEFAULT 1) - Level when current class was activated
- `class_history` (JSON ARRAY) - Array of previous class names
- `class_history_with_levels` (JSON ARRAY) - `[{className, activatedAtLevel, deactivatedAtLevel}]`
- `highest_tier_achieved` (INT UNSIGNED, DEFAULT 1) - Highest tier reached

**Profession System:**
- `profession_id` (INT UNSIGNED, FOREIGN KEY) - Current profession
- `profession_activated_at_level` (INT UNSIGNED) - Level when profession was activated
- `profession_history` (JSON ARRAY) - Array of previous profession names
- `profession_history_with_levels` (JSON ARRAY) - `[{professionName, activatedAtLevel, deactivatedAtLevel}]`

**Attributes & Combat Stats:**
- `stats` (JSON) - Character stats: `{STR, DEX, PER, MEM, INT, CHA}`
- `hp_max` (INT UNSIGNED, NOT NULL, DEFAULT 100) - Maximum hit points
- `hp_current` (INT UNSIGNED, NOT NULL, DEFAULT 100) - Current hit points
- `ep_max` (INT UNSIGNED, NOT NULL, DEFAULT 50) - Maximum energy points
- `ep_current` (INT UNSIGNED, NOT NULL, DEFAULT 50) - Current energy points

**Economy:**
- `credits` (INT UNSIGNED, NOT NULL, DEFAULT 0) - Currency

**Equipment & Inventory:**
- `equipped_items` (JSON) - Equipment slots: `{armor, weapon_primary, weapon_secondary, accessory_1, accessory_2, accessory_3}`
- `inventory` (JSON ARRAY) - Array of item IDs

**Abilities:**
- `unlocked_abilities` (JSON) - `{"ability_id": level}` - Both combat and professional

**History:**
- `history` (JSON ARRAY) - Character event log

**Media:**
- `portrait_image` (VARCHAR(255)) - Character portrait
- `header_image_url` (VARCHAR(255)) - Header/banner image

**Meta:**
- `status` (ENUM: 'active', 'inactive', 'archived', DEFAULT 'active')
- `sort_order` (INT, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_status` on `status`
- `idx_level` on `level`
- `idx_sort_order` on `sort_order`

**Relationships:**
- `class_id` → `litrpg_classes.id`
- `profession_id` → `litrpg_professions.id`

---

## API Endpoints

All LitRPG endpoints are under `/api/litrpg/`

### Classes API

**Base Path:** `/api/litrpg/classes/`

- `GET list.php` - List all classes
- `GET get.php?id={id}` - Get single class
- `POST create.php` - Create new class
- `POST update.php` - Update existing class
- `POST delete.php` - Delete class

### Abilities API

**Base Path:** `/api/litrpg/abilities/`

- `GET list.php` - List all combat abilities
- `GET get.php?id={id}` - Get single ability
- `POST create.php` - Create new ability
- `POST update.php` - Update existing ability
- `POST delete.php` - Delete ability
- `GET tiers.php?ability_id={id}` - Get ability tier progression
- `POST tiers-update.php` - Update ability tiers

### Professional Abilities API

**Base Path:** `/api/litrpg/abilities/`

- `GET professional-list.php` - List all professional abilities
- `GET professional-get.php?id={id}` - Get single professional ability
- `POST professional-create.php` - Create new professional ability
- `POST professional-update.php` - Update professional ability
- `POST professional-delete.php` - Delete professional ability
- `GET professional-tiers.php?ability_id={id}` - Get professional ability tiers
- `POST professional-tiers-update.php` - Update professional ability tiers

### Professions API

**Base Path:** `/api/litrpg/professions/`

- `GET list.php` - List all professions
- `GET get.php?id={id}` - Get single profession
- `POST create.php` - Create new profession
- `POST update.php` - Update existing profession
- `POST delete.php` - Delete profession

### Items API

**Base Path:** `/api/litrpg/items/`

- `GET list.php` - List all items
- `GET get.php?id={id}` - Get single item
- `POST create.php` - Create new item
- `POST update.php` - Update existing item
- `POST delete.php` - Delete item

### Monsters API

**Base Path:** `/api/litrpg/monsters/`

- `GET list.php` - List all monsters
- `GET get.php?id={id}` - Get single monster
- `POST create.php` - Create new monster
- `POST update.php` - Update existing monster
- `POST delete.php` - Delete monster

### Contracts API

**Base Path:** `/api/litrpg/contracts/`

- `GET list.php` - List all contracts
- `GET get.php?id={id}` - Get single contract
- `POST create.php` - Create new contract
- `POST update.php` - Update existing contract
- `POST delete.php` - Delete contract

### Characters API

**Base Path:** `/api/litrpg/characters/`

- `GET list.php` - List all characters
- `GET get.php?id={id}` - Get single character
- `POST create.php` - Create new character
- `POST update.php` - Update character (stats, equipment, abilities, etc.)
- `POST delete.php` - Delete character

### Utility Endpoints

- `POST /api/litrpg/export-to-constants.php` - Export database data to TypeScript constants

---

## TypeScript Types

### Core Interfaces (from `types.ts`)

```typescript
// Game Attributes
export type Attribute = 'STR' | 'DEX' | 'PER' | 'MEM' | 'INT' | 'CHA';

// Character Stats
export interface CharacterStats {
  STR: number;
  DEX: number;
  PER: number;
  MEM: number;
  INT: number;
  CHA: number;
}

// Class Definition
export interface LitrpgClass {
  id: number;
  slug: string;
  name: string;
  description: string;
  tier: number; // 1-4
  unlock_level: number;
  prerequisite_class_id?: number;
  stat_bonuses: Partial<CharacterStats>;
  primary_attribute: Attribute;
  secondary_attribute: Attribute;
  starting_item?: string;
  ability_ids: number[];
  upgrade_ids: number[];
  icon_image?: string;
  status: 'active' | 'inactive' | 'archived';
}

// Profession Definition
export interface LitrpgProfession {
  id: number;
  slug: string;
  name: string;
  description: string;
  tier: 'tier-1' | 'tier-2';
  unlock_level: number;
  prerequisite_profession_id?: number;
  stat_bonuses: Partial<CharacterStats>;
  ability_ids: number[];
  icon_image?: string;
  status: 'active' | 'inactive' | 'archived';
}

// Ability Tier
export interface AbilityTier {
  tier_level: number; // 1-10
  duration?: string;
  cooldown?: string;
  energy_cost?: number;
  effect_description: string;
}

// Ability Definition
export interface LitrpgAbility {
  id: number;
  slug: string;
  name: string;
  description: string;
  max_level: number;
  evolution_ability_id?: number;
  evolution_level?: number;
  category: string;
  tiers?: AbilityTier[];
  icon_image?: string;
  status: 'active' | 'inactive' | 'archived';
}

// Item Definition
export interface LitrpgItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  tech_level?: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  base_value: number;
  stats?: any;
  requirements?: any;
  icon_image?: string;
  status: 'active' | 'inactive' | 'archived';
}

// Monster Definition
export interface LitrpgMonster {
  id: number;
  slug: string;
  name: string;
  description: string;
  level: number;
  rank: 'Trash' | 'Regular' | 'Champion' | 'Boss';
  hp: number;
  xp_reward: number;
  credits: number;
  stats: Partial<CharacterStats>;
  abilities: string[];
  loot_table: Array<{item: string; rate: number}>;
  icon_image?: string;
  status: 'active' | 'inactive' | 'archived';
}

// Contract/Quest Definition
export interface LitrpgContract {
  id: number;
  slug: string;
  title: string;
  description: string;
  contract_type: string;
  difficulty: 'routine' | 'hazardous' | 'critical' | 'suicide';
  level_requirement: number;
  time_limit?: string;
  objectives: Array<{description: string; target?: number; current?: number}>;
  rewards: {xp?: number; credits?: number; items?: string[]};
  icon_image?: string;
  status: 'active' | 'inactive' | 'archived';
}

// Character Definition
export interface LitrpgCharacter {
  id: number;
  slug: string;
  name: string;
  description?: string;
  level: number;
  xp_current: number;
  xp_to_level: number;
  class_id?: number;
  class_activated_at_level?: number;
  class_history?: string[];
  class_history_with_levels?: Array<{
    className: string;
    activatedAtLevel: number;
    deactivatedAtLevel?: number;
  }>;
  highest_tier_achieved: number;
  profession_id?: number;
  profession_activated_at_level?: number;
  profession_history?: string[];
  profession_history_with_levels?: Array<{
    professionName: string;
    activatedAtLevel: number;
    deactivatedAtLevel?: number;
  }>;
  stats: CharacterStats;
  hp_max: number;
  hp_current: number;
  ep_max: number;
  ep_current: number;
  credits: number;
  equipped_items?: {
    armor?: number;
    weapon_primary?: number;
    weapon_secondary?: number;
    accessory_1?: number;
    accessory_2?: number;
    accessory_3?: number;
  };
  inventory?: number[];
  unlocked_abilities?: {[abilityId: number]: number}; // ability_id: level
  history?: any[];
  portrait_image?: string;
  header_image_url?: string;
  status: 'active' | 'inactive' | 'archived';
}
```

---

## Game Mechanics

### Attribute System

Six core attributes affect all gameplay:

- **STR (Strength)** - Physical power, melee damage, carrying capacity
- **DEX (Dexterity)** - Agility, ranged accuracy, dodge chance
- **PER (Perception)** - Awareness, detection, targeting
- **MEM (Memory)** - Information retention, skill learning
- **INT (Intelligence)** - Problem solving, tech skills, energy pool
- **CHA (Charisma)** - Leadership, persuasion, companion bonuses

### Class System (4 Tiers)

**Tier 1 - Foundation Classes:**
- Recruit - Basic combat training
- Unlock Level: 1

**Tier 2 - Specialist Classes:**
- Scout - Reconnaissance specialist
- Hunter - Tracker and ranged expert
- Juggernaut - Frontline tank
- Technician - Tech specialist
- Unlock Level: 6

**Tier 3 - Elite Classes:**
- Infiltrator - Advanced stealth operations
- Ranger - Elite tracker and survivalist
- Titan - Heavy weapons specialist
- Engineer - Advanced tech expert
- Unlock Level: 11

**Tier 4 - Master Classes:**
- Shadow - Master of stealth and assassination
- Pathfinder - Master survivalist
- Colossus - Ultimate tank
- Architect - Tech mastery
- Unlock Level: 16

### Profession System (2 Tiers)

**Tier 1 Professions (Unlock Level 16):**
- Pilot - Spacecraft operation
- Medical Officer - Field medicine
- Communications Officer - Tech & comms
- Quartermaster - Supply management

**Tier 2 Professions (Unlock Level 21):**
- Advanced versions with enhanced capabilities

### Ability System

**Categories:**
- **Perception & Targeting** - Detection, aiming, analysis
- **Offense** - Damage dealing (melee/ranged)
- **Defense & Mitigation** - Armor, shields, resistance
- **Movement & Positioning** - Mobility, positioning
- **Stealth & Signature** - Concealment, evasion
- **Support & Medical** - Healing, buffs
- **Quantum & Hacking** - Tech abilities

**Progression:**
- Each ability has 10 tiers
