# Attribute System Documentation

## Overview

The LitRPG system tracks character attributes through a sophisticated banking and point allocation system that separates manually-allocated points from class/profession bonuses.

## Key Concepts

### 1. Base Stats vs Current Attributes

- **`baseStats`**: The "locked in" baseline attributes loaded from the database. These represent all previously banked points including:
  - Starting attribute values (default: 3 for each attribute)
  - Previously allocated manual points that have been saved/banked
  - Previously banked class/profession bonuses

- **`attributes`**: The current working values displayed in the UI. These include:
  - Base stats
  - Newly allocated points (not yet saved)
  - Current class/profession bonuses (calculated dynamically)

### 2. Unspent Attribute Points Pool

**Database Field**: `unspent_attribute_points` (integer, default: 0)

This pool represents attribute points earned from leveling that haven't been spent yet. The pool persists across sessions and survives the "banking" process.

**Sources of Points**:
- Level-up rewards: Points earned through `getCumulativePoints(level).attributePoints`
- Tier upgrade bonuses: 5 ability points per tier (tracked separately)

### 3. The Banking Process

When you press "Save to Database", the system performs a **banking operation**:

#### Before Save (Frontend State)
```
attributes: { STR: 10, PER: 8, ... }  // Current working values
baseStats: { STR: 8, PER: 6, ... }    // What was loaded from DB
classHistoryWithLevels: [...]         // Tracks class changes
unspentAttributePoints: 0             // What was in DB
```

#### During Save Calculation
```typescript
// 1. Calculate accumulated bonuses from class/profession history
accumulatedBonuses = sum of (bonusPerLevel * levelsHeld) for all historical classes

// 2. Calculate "banked" stats (base + bonuses)
bankedStats = {
  STR: attributes.STR + accumulatedBonuses.STR,
  PER: attributes.PER + accumulatedBonuses.PER,
  ...
}

// 3. Calculate points spent from pool
pointsSpentFromPool = sum of (attributes[attr] - baseStats[attr]) for all attributes

// 4. Calculate new unspent points
cumulativeFromLeveling = getCumulativePoints(level).attributePoints
newUnspentPoints = unspentAttributePoints + cumulativeFromLeveling - pointsSpentFromPool

// 5. Save to database
{
  base_stats: bankedStats,           // New baseline with bonuses consolidated
  stats: bankedStats,                // Display/combat values
  unspent_attribute_points: newUnspentPoints,  // Remaining pool
  class_activated_at_level: currentLevel,      // Reset activation
  class_history_with_levels: []      // Clear history (bonuses now banked)
}
```

#### After Save (New Frontend State)
```
attributes: { STR: 12, PER: 10, ... }  // Banked values
baseStats: { STR: 12, PER: 10, ... }   // Same as attributes (new baseline)
classHistoryWithLevels: []             // Cleared
unspentAttributePoints: newUnspentPoints  // Updated pool
```

## Files & Locations

### Core Files

1. **[src/features/litrpg/types.ts](src/features/litrpg/types.ts)**
   - `Character` interface definition (lines 77-100)
   - `unspentAttributePoints: number` (line 87)
   - `baseStats?: Record<Attribute, number>` (line 88)

2. **[src/features/litrpg/LitrpgApp.tsx](src/features/litrpg/LitrpgApp.tsx)**
   - `handleSaveToDatabase()` (lines 248-455): Banking logic
   - Point calculation (lines 338-348): Unspent point calculation
   - Character loading from DB (lines 150-246): Converts DB format to frontend format

3. **[src/features/litrpg/components/CharacterSheet.tsx](src/features/litrpg/components/CharacterSheet.tsx)**
   - `calculateUsedAttributePoints()` (line 548): Calculates spent points in UI
   - `availableAttributePoints` (line 559): Display calculation for UI
   - `handleAttributeChange()` (line 598): Attribute increment/decrement handler
   - `getPendingAttributeInvestment()` (line 543): Per-attribute spending calculation

4. **[src/features/litrpg/xp-constants.ts](src/features/litrpg/xp-constants.ts)**
   - `getCumulativePoints(level)` (line 75): Returns total points earned from leveling

### Backend Files

5. **[api/litrpg/characters/update.php](api/litrpg/characters/update.php)**
   - Character update endpoint
   - `unspent_attribute_points` in allowed fields (line 31)
   - JSON field handling for `base_stats`, `stats` (lines 34-38)

6. **[api/migrations/add-unspent-attribute-points.sql](api/migrations/add-unspent-attribute-points.sql)**
   - Database schema for `unspent_attribute_points` column

### API Layer

7. **[src/features/litrpg/utils/api-litrpg.ts](src/features/litrpg/utils/api-litrpg.ts)**
   - `LitrpgCharacter` interface (lines 34-67)
   - `updateCharacter()` function (lines 293-314)
   - `unspent_attribute_points?: number` (line 55)
   - `base_stats?: Record<string, number>` (line 54)

## UI Display Logic

### Available Points Calculation (CharacterSheet)

```typescript
// Line 548-554: Calculate how many points user has spent in UI
const calculateUsedAttributePoints = () => {
  return (Object.keys(character.attributes) as Attribute[]).reduce((total, attr) => {
    const spent = getPendingAttributeInvestment(attr);  // current - base
    return total + spent;
  }, 0);
};

// Line 557-559: Calculate available points to display
const cumulative = getCumulativePoints(character.level);
const usedAttributePoints = calculateUsedAttributePoints();
const availableAttributePoints = Math.max(0, cumulative.attributePoints - usedAttributePoints);
```

**Key Insight**: The UI shows "available" as `(cumulative from level) - (current - base)`. This works because:
- After save: `current === base`, so `usedAttributePoints = 0`
- User spends points: `current > base`, so `usedAttributePoints` increases
- `availableAttributePoints` decreases accordingly

### Visual Indicators

- **Pink +X values**: "Unbanked" points allocated but not saved (line 1287)
- **Purple +X values**: Current class bonuses (line 1312-1316)
- **Blue +X values**: Current profession bonuses (line 1318-1322)
- **Points badge**: Shows remaining available points (line 1285)

## Common Patterns

### Loading Character from Database

```typescript
// LitrpgApp.tsx lines 222-236
attributes: {
  [Attribute.STR]: baseStats.STR || 3,  // Load from base_stats column
  ...
},
baseStats: {
  [Attribute.STR]: baseStats.STR || 3,  // Same values initially
  ...
},
unspentAttributePoints: dbChar.unspent_attribute_points ?? 0
```

### Allocating Points (CharacterSheet)

```typescript
// Line 598-607
const handleAttributeChange = (attr: Attribute, delta: number) => {
  const currentVal = character.attributes[attr];
  const minVal = getMinAttributeValue(attr);  // baseStats value
  if (delta > 0 && availableAttributePoints <= 0) return;  // Can't spend if no points
  if (delta < 0 && currentVal <= minVal) return;  // Can't go below base
  updateCharacter({
    ...character,
    attributes: { ...character.attributes, [attr]: currentVal + delta }
  });
};
```

## Troubleshooting

### Issue: Points Keep Respawning After Save

**Symptom**: After saving, you get more attribute points to allocate.

**Cause**: `unspentAttributePoints` wasn't being decremented when points were spent.

**Fix**: In `handleSaveToDatabase()`, calculate:
```typescript
pointsSpentFromPool = sum of (current - base)
newUnspentPoints = oldUnspent + cumulativeFromLevel - pointsSpentFromPool
```

### Issue: Points Display Incorrectly

**Check**:
1. Does `baseStats` match what's in the database `base_stats` column?
2. Is `unspentAttributePoints` loaded correctly from DB?
3. Are class/profession bonuses calculated in `CharacterSheet`?

### Issue: Saving Loses Attribute Progress

**Check**:
1. Is `bankedStats` calculation including `character.attributes`?
2. Is `base_stats` being saved to the database?
3. Is the local state updated with `bankedCharacter` after save?

## Database Schema

```sql
CREATE TABLE litrpg_characters (
  -- ... other fields
  stats JSON,                              -- Display stats (with all bonuses)
  base_stats JSON,                         -- Locked-in baseline (banked)
  unspent_attribute_points INT(11) DEFAULT 0,  -- Unallocated pool
  class_activated_at_level INT,            -- When current class was activated
  class_history_with_levels JSON,          -- Previous class changes
  -- ... other fields
);
```

**Example Data**:
```json
{
  "stats": {"STR": 12, "PER": 10, "DEX": 8, ...},
  "base_stats": {"STR": 12, "PER": 10, "DEX": 8, ...},
  "unspent_attribute_points": 5,
  "class_activated_at_level": 10,
  "class_history_with_levels": []
}
```

## Flow Diagram

```
┌─────────────────┐
│  Load from DB   │
│  base_stats: 8  │
│  unspent: 0     │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   Frontend UI   │
│  attributes: 8  │
│  baseStats: 8   │
│  available: 10  │ ← getCumulativePoints(level)
└────────┬────────┘
         │
         │ User spends 3 points
         v
┌─────────────────┐
│  Frontend UI    │
│  attributes: 11 │ ← increased by 3
│  baseStats: 8   │ ← unchanged
│  available: 7   │ ← decremented by 3
└────────┬────────┘
         │
         │ Press "Save to Database"
         v
┌─────────────────┐
│  Calculate      │
│  spent: 3       │ ← (11 - 8)
│  newUnspent:    │
│    0 + 10 - 3   │
│    = 7          │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   Save to DB    │
│  base_stats: 11 │ ← banked
│  unspent: 7     │ ← saved
└────────┬────────┘
         │
         │ Reload
         v
┌─────────────────┐
│  Frontend UI    │
│  attributes: 11 │
│  baseStats: 11  │
│  available: 7   │ ← correct!
└─────────────────┘
```

## Recent Changes

### 2024 Fix: Unspent Points Calculation

**Issue**: Points were respawning after save/reload because the UI was using `getCumulativePoints(level)` instead of the actual `unspentAttributePoints` from the database.

**Root Cause**:
1. The UI calculated available points as: `getCumulativePoints(level) - usedPoints`
2. This ignored the `unspentAttributePoints` field from the database
3. After saving, `baseStats` would update but the UI would recalculate based on level, giving points back

**Files Changed**:

1. **[src/features/litrpg/components/CharacterSheet.tsx](src/features/litrpg/components/CharacterSheet.tsx#L560-L564)**:
   - Changed available points calculation to use `character.unspentAttributePoints` from DB
   - Falls back to cumulative calculation for backward compatibility

2. **[src/features/litrpg/LitrpgApp.tsx](src/features/litrpg/LitrpgApp.tsx#L206-L216)**:
   - Added initialization logic for `unspentAttributePoints` when loading from DB
   - Calculates correct unspent value for existing characters that don't have it set

3. **[src/features/litrpg/LitrpgApp.tsx](src/features/litrpg/LitrpgApp.tsx#L339-L349)**:
   - Fixed save logic to correctly decrement unspent points when banking

**Logic Added**:

```typescript
// CharacterSheet.tsx - Use unspent points from DB (no fallback math)
const availableAttributePoints = Math.max(0, character.unspentAttributePoints - usedAttributePoints);

// LitrpgApp.tsx - Load unspent points directly from DB (no calculation)
unspentAttributePoints: dbChar.unspent_attribute_points ?? 0

// LitrpgApp.tsx - Decrement unspent points on save
const pointsSpentFromPool = sum of (currentAttributes - baseStats);
const newUnspentPoints = Math.max(0, character.unspentAttributePoints - pointsSpentFromPool);
```

**Key Insights**:
- The `unspentAttributePoints` field in the database is the **single source of truth**
- No math or assumptions about starting values (characters can start with any attribute configuration)
- The system is pure: `unspent pool - points allocated in UI = available to spend`
- If the DB doesn't have `unspent_attribute_points` set, it defaults to 0 (no free points)
