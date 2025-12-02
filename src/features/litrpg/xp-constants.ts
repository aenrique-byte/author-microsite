import { MonsterRank } from './types';

// --- XP & CREDIT RULES ---
export const XP_BASE = 200; 
export const XP_MULTIPLIER = 1.15;
export const CREDIT_MULTIPLIER = 2.5;
export const MEM_CDR_DIMINISHING_FACTOR = 200; // The value of MEM at which you have 50% CDR
export const INT_DURATION_SCALING_FACTOR = 0.005; // 0.5% per INT point

export const MONSTER_RANK_MULTIPLIERS: Record<MonsterRank, number> = {
  'Trash': 0.01,
  'Regular': 0.03,
  'Champion': 0.08,
  'Boss': 0.15
};

export const getXpForLevelStep = (currentLevel: number): number => {
  if (currentLevel < 1) return 0;
  return Math.round(XP_BASE * Math.pow(XP_MULTIPLIER, currentLevel - 1));
};

export const getTotalXpRequired = (targetLevel: number): number => {
  if (targetLevel <= 1) return 0;
  let total = 0;
  for (let l = 1; l < targetLevel; l++) {
    total += getXpForLevelStep(l);
  }
  return total;
};

// --- LEVELING REWARDS ---

export interface LevelRewards {
  attributePoints: number;
  abilityPoints: number;
  unlocks: string[];
}

export const getLevelRewards = (level: number): LevelRewards => {
  let attr = 0;
  let abil = 0;
  const unlocks: string[] = [];

  // Attribute Points Logic
  if (level === 10) {
    attr = 5;
    unlocks.push("Advanced Class Selection");
  } else if (level === 16) {
    attr = 5;
    unlocks.push("Profession Class Selection");
  } else if (level === 32) {
    attr = 10;
    unlocks.push("Combat Class Upgrade");
  } else if (level >= 33) {
    attr = 4;
  } else if (level > 1) {
    // Levels 2-9, 11-15, 17-31
    attr = 2;
  }

  // Ability Points Logic
  // "Every other level I get an ability point except Level 2,4,6..." -> Odd levels > 1 get 1 point
  if (level > 1 && level % 2 !== 0) {
    abil += 1;
  }
  
  // Special Ability Point Boosts
  if (level === 10) abil += 4;
  if (level === 16) abil += 5;
  if (level === 32) abil += 5;

  return { attributePoints: attr, abilityPoints: abil, unlocks };
};

export const getCumulativePoints = (level: number): { attributePoints: number, abilityPoints: number } => {
  let totalAttr = 0;
  let totalAbil = 0;
  // Sum rewards from Level 2 up to current Level
  for (let l = 2; l <= level; l++) {
     const r = getLevelRewards(l);
     totalAttr += r.attributePoints;
     totalAbil += r.abilityPoints;
  }
  return { attributePoints: totalAttr, abilityPoints: totalAbil };
};

// --- COOLDOWN MATH ---

export const getCooldownReduction = (mem: number): number => {
  // Formula: MEM / (MEM + Constant). 
  // At MEM = Constant, CDR is 50%. This prevents hitting 100% CDR.
  return mem / (mem + MEM_CDR_DIMINISHING_FACTOR);
};

export const applyCooldownReduction = (baseCooldown: string, mem: number): string => {
  if (!baseCooldown || baseCooldown === 'Instant' || baseCooldown === 'Passive' || baseCooldown === 'Toggle') {
    return baseCooldown;
  }

  // Parse String (e.g., "10m", "30s", "1h")
  const regex = /^(\d+(\.\d+)?)\s*([smh])$/i;
  const match = baseCooldown.match(regex);

  if (!match) return baseCooldown;

  const val = parseFloat(match[1]);
  const unit = match[3].toLowerCase();

  let totalSeconds = 0;
  if (unit === 's') totalSeconds = val;
  if (unit === 'm') totalSeconds = val * 60;
  if (unit === 'h') totalSeconds = val * 3600;

  const reduction = getCooldownReduction(mem);
  const reducedSeconds = totalSeconds * (1 - reduction);

  // Re-format
  if (reducedSeconds < 60) {
    return `${reducedSeconds.toFixed(1)}s`;
  } else if (reducedSeconds < 3600) {
    const mins = reducedSeconds / 60;
    return `${mins.toFixed(1)}m`;
  } else {
    const hrs = reducedSeconds / 3600;
    return `${hrs.toFixed(1)}h`;
  }
};

// --- DURATION MATH ---

export const getDurationExtension = (int: number): number => {
    // Formula: 0.5% per point = 0.005 * INT
    return int * INT_DURATION_SCALING_FACTOR;
};

export const applyDurationExtension = (baseDuration: string, int: number): string => {
    if (!baseDuration || baseDuration === 'Instant' || baseDuration === 'Passive' || baseDuration === 'Toggle') {
        return baseDuration;
    }

    const regex = /^(\d+(\.\d+)?)\s*([smh])$/i;
    const match = baseDuration.match(regex);

    if (!match) return baseDuration;

    const val = parseFloat(match[1]);
    const unit = match[3].toLowerCase();

    // Determine multiplier (e.g. 1.125 for 25 INT)
    const multiplier = 1 + getDurationExtension(int);
    
    // Apply
    const extendedVal = val * multiplier;

    // Return with same unit, but formatted
    return `${extendedVal.toFixed(1)}${unit}`;
};
