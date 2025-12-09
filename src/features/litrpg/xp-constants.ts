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

  // Parse compound format: "5 min 45 sec" or single format: "10 min", "30 sec", "1 hr"
  // Also supports short format: "5m", "30s", "1h"
  let totalSeconds = 0;

  // Match all time components (e.g., "5 min", "45 sec", "1 hr")
  const timeRegex = /(\d+(?:\.\d+)?)\s*(hr|min|sec|h|m|s)/gi;
  const matches = Array.from(baseCooldown.matchAll(timeRegex));

  if (matches.length === 0) return baseCooldown;

  for (const match of matches) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === 'sec' || unit === 's') totalSeconds += val;
    else if (unit === 'min' || unit === 'm') totalSeconds += val * 60;
    else if (unit === 'hr' || unit === 'h') totalSeconds += val * 3600;
  }

  const reduction = getCooldownReduction(mem);
  const reducedSeconds = totalSeconds * (1 - reduction);

  // Re-format to human-readable
  if (reducedSeconds < 60) {
    return `${reducedSeconds.toFixed(1)} sec`;
  } else if (reducedSeconds < 3600) {
    const mins = Math.floor(reducedSeconds / 60);
    const secs = reducedSeconds % 60;
    if (secs < 1) {
      return `${mins} min`;
    }
    return `${mins} min ${secs.toFixed(0)} sec`;
  } else {
    const hrs = Math.floor(reducedSeconds / 3600);
    const remainingSeconds = reducedSeconds % 3600;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;

    let result = `${hrs} hr`;
    if (mins > 0) result += ` ${mins} min`;
    if (secs >= 1) result += ` ${secs.toFixed(0)} sec`;
    return result;
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

    // Parse compound format: "5 min 45 sec" or single format: "10 min", "30 sec", "1 hr"
    // Also supports short format: "5m", "30s", "1h"
    let totalSeconds = 0;

    // Match all time components
    const timeRegex = /(\d+(?:\.\d+)?)\s*(hr|min|sec|h|m|s)/gi;
    const matches = Array.from(baseDuration.matchAll(timeRegex));

    if (matches.length === 0) return baseDuration;

    for (const match of matches) {
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();

        if (unit === 'sec' || unit === 's') totalSeconds += val;
        else if (unit === 'min' || unit === 'm') totalSeconds += val * 60;
        else if (unit === 'hr' || unit === 'h') totalSeconds += val * 3600;
    }

    // Determine multiplier (e.g. 1.125 for 25 INT)
    const multiplier = 1 + getDurationExtension(int);

    // Apply extension
    const extendedSeconds = totalSeconds * multiplier;

    // Re-format to human-readable
    if (extendedSeconds < 60) {
        return `${extendedSeconds.toFixed(1)} sec`;
    } else if (extendedSeconds < 3600) {
        const mins = Math.floor(extendedSeconds / 60);
        const secs = extendedSeconds % 60;
        if (secs < 1) {
            return `${mins} min`;
        }
        return `${mins} min ${secs.toFixed(0)} sec`;
    } else {
        const hrs = Math.floor(extendedSeconds / 3600);
        const remainingSeconds = extendedSeconds % 3600;
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;

        let result = `${hrs} hr`;
        if (mins > 0) result += ` ${mins} min`;
        if (secs >= 1) result += ` ${secs.toFixed(0)} sec`;
        return result;
    }
};
