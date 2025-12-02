# LitRPG System - Phase 2 Implementation Plan

## Overview

Phase 2 migrates the LitRPG game system from static TypeScript constants to MySQL database with admin-only editing capabilities, following the same pattern as Storytime chapter editing.

---

## 1. MySQL Schema Design

### Core Tables

```sql
-- =====================================================
-- LITRPG GAME SYSTEM TABLES
-- =====================================================

-- Characters (playable/NPC characters managed via admin)
CREATE TABLE `litrpg_characters` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `level` INT NOT NULL DEFAULT 1,
  `xp_current` INT NOT NULL DEFAULT 0,
  `xp_to_level` INT NOT NULL DEFAULT 100,
  `class_id` INT(10) UNSIGNED DEFAULT NULL,
  `class_level` INT NOT NULL DEFAULT 1,
  -- Stats JSON: {"STR": 10, "PER": 10, "DEX": 10, "MEM": 10, "INT": 10, "CHA": 10}
  `stats` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`stats`)),
  -- Derived stats (computed from stats)
  `hp_max` INT NOT NULL DEFAULT 100,
  `hp_current` INT NOT NULL DEFAULT 100,
  `ep_max` INT NOT NULL DEFAULT 50,
  `ep_current` INT NOT NULL DEFAULT 50,
  `neural_heat` INT NOT NULL DEFAULT 0,
  `credits` INT NOT NULL DEFAULT 0,
  -- Equipment/Inventory stored as JSON arrays of item IDs
  `equipped_items` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`equipped_items`)),
  `inventory` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`inventory`)),
  -- Unlocked abilities stored as JSON array
  `unlocked_abilities` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`unlocked_abilities`)),
  `portrait_image` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('active','inactive','archived') NOT NULL DEFAULT 'active',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_characters_class` (`class_id`),
  KEY `idx_characters_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Classes (base and advanced classes with branching)
CREATE TABLE `litrpg_classes` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `tier` ENUM('base','advanced','elite','legendary') NOT NULL DEFAULT 'base',
  -- Level requirement to unlock this class (e.g., 66 for advanced)
  `unlock_level` INT NOT NULL DEFAULT 1,
  -- Prerequisite class (for branching paths)
  `prerequisite_class_id` INT(10) UNSIGNED DEFAULT NULL,
  -- Stat bonuses per level: {"STR": 2, "DEX": 1, ...}
  `stat_bonuses` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`stat_bonuses`)),
  `icon_image` VARCHAR(255) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_classes_tier` (`tier`),
  KEY `idx_classes_prereq` (`prerequisite_class_id`),
  KEY `idx_classes_unlock` (`unlock_level`),
  CONSTRAINT `fk_classes_prereq` FOREIGN KEY (`prerequisite_class_id`) 
    REFERENCES `litrpg_classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Abilities (MUST be created before litrpg_class_abilities due to FK reference)
CREATE TABLE `litrpg_abilities` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `max_level` INT NOT NULL DEFAULT 5,
  -- Evolution target (if this ability evolves into another)
  `evolution_ability_id` INT(10) UNSIGNED DEFAULT NULL,
  `evolution_level` INT DEFAULT NULL,
  `icon_image` VARCHAR(255) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_abilities_evolution` (`evolution_ability_id`),
  CONSTRAINT `fk_abilities_evolution` FOREIGN KEY (`evolution_ability_id`) 
    REFERENCES `litrpg_abilities` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Class Abilities (which abilities a class grants at which level)
-- NOTE: This must come AFTER litrpg_classes AND litrpg_abilities
CREATE TABLE `litrpg_class_abilities` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` INT(10) UNSIGNED NOT NULL,
  `ability_id` INT(10) UNSIGNED NOT NULL,
  `unlock_class_level` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_ability` (`class_id`, `ability_id`),
  KEY `idx_class_abilities_class` (`class_id`),
  KEY `idx_class_abilities_ability` (`ability_id`),
  CONSTRAINT `fk_class_abilities_class` FOREIGN KEY (`class_id`) 
    REFERENCES `litrpg_classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_class_abilities_ability` FOREIGN KEY (`ability_id`) 
    REFERENCES `litrpg_abilities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ability Tiers (stats per level)
CREATE TABLE `litrpg_ability_tiers` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ability_id` INT(10) UNSIGNED NOT NULL,
  `tier_level` INT NOT NULL,
  `duration` VARCHAR(50) DEFAULT NULL,
  `cooldown` VARCHAR(50) DEFAULT NULL,
  `energy_cost` INT DEFAULT NULL,
  `effect_description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ability_tier` (`ability_id`, `tier_level`),
  KEY `idx_ability_tiers_ability` (`ability_id`),
  CONSTRAINT `fk_ability_tiers_ability` FOREIGN KEY (`ability_id`) 
    REFERENCES `litrpg_abilities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Monsters (Bestiary)
CREATE TABLE `litrpg_monsters` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `level` INT NOT NULL DEFAULT 1,
  `rank` ENUM('Trash','Regular','Champion','Boss') NOT NULL DEFAULT 'Regular',
  -- Stats JSON: {"STR": 10, "PER": 10, ...}
  `stats` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`stats`)),
  `hp` INT NOT NULL DEFAULT 100,
  -- Abilities as JSON array of ability IDs or names
  `abilities` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`abilities`)),
  -- Loot table as JSON array: [{item_id, drop_rate}, ...]
  `loot_table` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`loot_table`)),
  `xp_reward` INT NOT NULL DEFAULT 0,
  `credits` INT NOT NULL DEFAULT 0,
  `portrait_image` VARCHAR(255) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_monsters_rank` (`rank`),
  KEY `idx_monsters_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Loot Items
CREATE TABLE `litrpg_items` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `tech_level` ENUM('TL8','TL9','TL10') NOT NULL DEFAULT 'TL8',
  `category` ENUM('Tool','Weapon','Component','Material','Consumable','Armor','Medical') NOT NULL,
  -- Item stats/effects as JSON
  `stats_bonus` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`stats_bonus`)),
  `value` INT NOT NULL DEFAULT 0,
  `icon_image` VARCHAR(255) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_items_tech_level` (`tech_level`),
  KEY `idx_items_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contracts (Quests)
CREATE TABLE `litrpg_contracts` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `contract_type` ENUM('bounty','extraction','escort','patrol','investigation') NOT NULL DEFAULT 'bounty',
  `difficulty` ENUM('routine','hazardous','critical','suicide') NOT NULL DEFAULT 'routine',
  `level_requirement` INT NOT NULL DEFAULT 1,
  -- Objectives as JSON array: [{type, description, target, current}, ...]
  `objectives` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`objectives`)),
  -- Rewards as JSON: {xp, credits, items: [], reputation: {}}
  `rewards` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`rewards`)),
  `time_limit` VARCHAR(100) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_contracts_type` (`contract_type`),
  KEY `idx_contracts_difficulty` (`difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 2. API Endpoints

Following existing API pattern from `/api/chapters/`:

```
api/litrpg/
├── characters/
│   ├── list.php          # GET - List all characters (public)
│   ├── get.php           # GET - Get single character by slug
│   ├── create.php        # POST - Admin only
│   ├── update.php        # POST - Admin only
│   └── delete.php        # POST - Admin only
├── classes/
│   ├── list.php
│   ├── get.php
│   ├── create.php
│   ├── update.php
│   └── delete.php
├── abilities/
│   ├── list.php
│   ├── get.php
│   ├── create.php
│   ├── update.php
│   └── delete.php
├── monsters/
│   ├── list.php
│   ├── get.php
│   ├── create.php
│   ├── update.php
│   └── delete.php
├── items/
│   ├── list.php
│   ├── get.php
│   ├── create.php
│   ├── update.php
│   └── delete.php
└── contracts/
    ├── list.php
    ├── get.php
    ├── create.php
    ├── update.php
    └── delete.php
```

### Authentication Pattern (from storytime)
```php
// All write operations require admin session
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}
```

---

## 3. Character Equipment Section

A new **Equipment Panel** will be added to the CharacterSheet, positioned **below Attributes but above Class Progression**.

### Equipment Slots
```tsx
interface EquipmentSlots {
  armor: number | null;      // litrpg_items.id (category: 'Armor')
  weapon_primary: number | null;   // litrpg_items.id (category: 'Weapon')
  weapon_secondary: number | null; // litrpg_items.id (category: 'Weapon')
  accessory_1: number | null;      // litrpg_items.id (any category)
  accessory_2: number | null;      // litrpg_items.id (any category)
  accessory_3: number | null;      // litrpg_items.id (any category)
}
```

### UI Layout
```
╔══════════════════════════════════════════════════════════╗
║  ⚔️ EQUIPMENT                                             ║
╠══════════════════════════════════════════════════════════╣
║  ARMOR           │ [Dropdown: Select from Armor items]   ║
║  PRIMARY WEAPON  │ [Dropdown: Select from Weapon items]  ║
║  SECONDARY       │ [Dropdown: Select from Weapon items]  ║
║  ────────────────┼────────────────────────────────────── ║
║  ACCESSORIES                                             ║
║  Slot 1          │ [Dropdown: Any item]                  ║
║  Slot 2          │ [Dropdown: Any item]                  ║
║  Slot 3          │ [Dropdown: Any item]                  ║
╚══════════════════════════════════════════════════════════╝
```

### Database Integration
- Dropdowns populated from `litrpg_items` table
- Armor dropdown: `WHERE category = 'Armor'`
- Weapon dropdowns: `WHERE category = 'Weapon'`
- Accessory dropdowns: All items (any category)
- Selected item IDs stored in `litrpg_characters.equipped_items` JSON

### Admin Features
- Admin can select equipment from dropdowns
- Save button persists to database
- Shows item stats when equipped (derived from litrpg_items.stats_bonus)

---

## 4. Frontend Architecture

### Character Sidebar (LitrpgHome / LitrpgApp)

```tsx
// LitrpgApp sidebar enhancement
interface CharacterListItem {
  id: number;
  slug: string;
  name: string;
  level: number;
  className: string;
}

// When admin is logged in:
// - Show list of characters in sidebar
// - Clicking character loads their data into CharacterSheet
// - "Save Changes" button appears (only for admin)
// - Changes POST to /api/litrpg/characters/update.php
```

### Admin Detection (from AuthContext)
```tsx
const { isAdmin } = useAuth();

// Show save button only for admin
{isAdmin && (
  <button onClick={handleSaveCharacter}>
    Save Changes
  </button>
)}
```

### Data Flow
```
1. User visits /litrpg
2. Fetch characters list from API
3. Sidebar shows character names
4. Click character → load full character data
5. Edit in CharacterSheet component
6. If admin: Save button calls API
7. If not admin: Read-only viewing
```

---

## 5. Class Branching System

### Example Class Tree
```
Level 1:  RECRUIT (base class)
              ↓
Level 66: → SOLDIER (combat focus)
          → ENGINEER (tech focus)
          → MEDIC (support focus)
              ↓
Level 132:→ COMMANDO (from Soldier)
          → SPECIALIST (from Soldier)
          → HACKER (from Engineer)
          → MECHANIC (from Engineer)
          → SURGEON (from Medic)
          → PSI-OPS (from Medic)
```

### Class Selection UI
```tsx
// When character reaches unlock_level:
// Show modal with available class branches

interface ClassOption {
  id: number;
  name: string;
  description: string;
  stat_bonuses: Record<Attribute, number>;
  abilities: Ability[];
  prerequisite_met: boolean;
}

// Admin can select class upgrade for character
// Character level gates which classes are available
```

---

## 6. Implementation Phases

### Phase 2.1: Database Setup
- [ ] Add new tables to unified-schema.sql
- [ ] Create migration script
- [ ] Seed initial data from constants files

### Phase 2.2: API Layer
- [x] Create api/litrpg/ directory structure
- [x] Implement CRUD endpoints for items (list, create)
- [x] Implement CRUD endpoints for characters (list, get, create, update)
- [x] Implement CRUD endpoints for monsters (list, create)
- [x] Implement CRUD endpoints for classes (list, create)
- [x] Implement CRUD endpoints for abilities (list, create with tiers)
- [x] Implement CRUD endpoints for contracts (list, create)
- [x] Add authentication guards
- [ ] Test with Postman/cURL

### Phase 2.3: Frontend Integration
- [x] Create api-litrpg.ts utility (like api-story.ts)
- [x] Add character sidebar to LitrpgApp
- [x] Connect CharacterSheet to API data
- [x] **Add Equipment Section to CharacterSheet**
  - [x] Add below Attributes, above Class Progression
  - [x] Armor dropdown (filtered by category='Armor')
  - [x] Weapon dropdowns (filtered by category='Weapon')
  - [x] Accessory dropdowns (all items)
  - [x] Display equipped item stats
- [x] Add save functionality for admin
- [x] Update AbilitiesPage to fetch from API
- [x] Update BestiaryPage to fetch from API
- [x] Update LootPage to fetch from API
- [x] Update ContractsPage to fetch from API

### Phase 2.4: Class System
- [ ] Implement class selection modal
- [ ] Add class branching logic
- [ ] Level-up triggers class unlock check
- [ ] Admin can assign classes manually

### Phase 2.5: Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Cache invalidation
- [ ] Optimistic updates
- [ ] Form validation

---

## 7. File Changes Summary

### New Files
```
api/litrpg/
├── bootstrap-litrpg.php
├── characters/list.php
├── characters/get.php
├── characters/create.php
├── characters/update.php
├── characters/delete.php
├── classes/...
├── abilities/...
├── monsters/...
├── items/...
└── contracts/...

src/features/litrpg/
├── utils/
│   └── api-litrpg.ts
├── contexts/
│   └── CharacterContext.tsx
├── components/
│   ├── CharacterSidebar.tsx
│   ├── CharacterEditModal.tsx
│   └── ClassSelectionModal.tsx
```

### Modified Files
```
unified-schema.sql           # Add litrpg tables
src/features/litrpg/LitrpgApp.tsx    # Add sidebar
src/features/litrpg/pages/LitrpgHome.tsx
src/features/litrpg/components/CharacterSheet.tsx
src/features/litrpg/pages/AbilitiesPage.tsx
src/features/litrpg/pages/BestiaryPage.tsx
src/features/litrpg/pages/LootPage.tsx
src/features/litrpg/pages/ContractsPage.tsx
```

---

## 8. Data Migration Strategy

### Initial Seed
Convert existing constants to SQL INSERT statements:
```sql
-- From ABILITY_REGISTRY
INSERT INTO litrpg_abilities (slug, name, description, max_level) VALUES
('neural-boost', 'Neural Boost', 'Temporarily enhances neural...', 5);

-- From INITIAL_MONSTERS  
INSERT INTO litrpg_monsters (slug, name, rank, level, stats, ...) VALUES
('patrol-drone', 'Patrol Drone', 'Trash', 5, '{"STR":8,"PER":6,...}', ...);
```

### Backwards Compatibility
Keep constants files for fallback during transition:
```tsx
// api-litrpg.ts
export async function getAbilities() {
  try {
    const response = await fetch(`${API_BASE}/litrpg/abilities/list.php`);
    return await response.json();
  } catch {
    // Fallback to constants during migration
    return Object.values(ABILITY_REGISTRY);
  }
}
```

---

## 9. Security Considerations

- All write operations require authenticated admin session
- Input validation on all API endpoints
- Rate limiting on create/update operations
- SQL injection prevention via prepared statements
- XSS prevention via output encoding
- CORS configuration for API endpoints

---

## 10. Future Considerations (Phase 3+)

- Real-time multiplayer character updates (WebSocket)
- Character history/changelog
- Bulk import/export functionality
- Character templates
- Public character profiles with sharing
- Character progression analytics
