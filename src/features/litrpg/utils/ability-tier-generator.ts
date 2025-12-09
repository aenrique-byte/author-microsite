/**
 * Utility functions for generating ability tiers with scaling formulas
 */

interface TierScalingConfig {
  baseDuration?: string; // e.g., "30 sec"
  baseCooldown?: string; // e.g., "2 min"
  baseEnergyCost?: number; // e.g., 50
  baseEffect?: string; // e.g., "Deals fire damage" (copied to all tiers)

  durationScaling?: number; // e.g., 0.3 for +30% per level (compounding)
  cooldownScaling?: number; // e.g., -0.1 for -10% per level (compounding, negative for reduction)
  energyCostScaling?: number; // e.g., 5 for +5 energy per level (linear)

  maxLevel: number;
}

/**
 * Parse a time string like "30 sec", "2 min", "1 hr" into total seconds
 */
function parseTimeToSeconds(timeStr: string): number {
  const timeRegex = /(\d+(?:\.\d+)?)\s*(hr|min|sec|h|m|s)/gi;
  const matches = Array.from(timeStr.matchAll(timeRegex));

  let totalSeconds = 0;
  for (const match of matches) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === 'sec' || unit === 's') totalSeconds += val;
    else if (unit === 'min' || unit === 'm') totalSeconds += val * 60;
    else if (unit === 'hr' || unit === 'h') totalSeconds += val * 3600;
  }

  return totalSeconds;
}

/**
 * Format seconds back to human-readable time string
 */
function formatSecondsToTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs} sec`;
  } else {
    const hrs = Math.floor(seconds / 3600);
    const remainingSeconds = seconds % 3600;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = Math.round(remainingSeconds % 60);

    let result = `${hrs} hr`;
    if (mins > 0) result += ` ${mins} min`;
    if (secs > 0) result += ` ${secs} sec`;
    return result;
  }
}

/**
 * Apply scaling to a time value with COMPOUNDING per level
 * @param baseTime - Base time string (e.g., "30 sec")
 * @param scaling - Scaling factor per level (e.g., 0.3 for +30%, -0.1 for -10%)
 * @param level - Current level (1-based)
 */
function scaleTime(baseTime: string, scaling: number, level: number): string {
  const baseSeconds = parseTimeToSeconds(baseTime);
  // Compounding formula: base * (1 + scaling)^(level - 1)
  // Level 1 = base, Level 2 = base * (1 + scaling), Level 3 = base * (1 + scaling)^2, etc.
  const scaledSeconds = baseSeconds * Math.pow(1 + scaling, level - 1);
  return formatSecondsToTime(Math.max(1, scaledSeconds)); // Min 1 second
}

/**
 * Generate all tiers for an ability based on scaling configuration
 */
export function generateAbilityTiers(config: TierScalingConfig): Array<{
  level: number;
  duration?: string;
  cooldown?: string;
  energyCost?: number;
  effectDescription?: string;
}> {
  const tiers = [];

  for (let level = 1; level <= config.maxLevel; level++) {
    const tier: {
      level: number;
      duration?: string;
      cooldown?: string;
      energyCost?: number;
      effectDescription?: string;
    } = {
      level,
    };

    // Duration scaling
    if (config.baseDuration && config.durationScaling !== undefined) {
      tier.duration = scaleTime(config.baseDuration, config.durationScaling, level);
    } else if (config.baseDuration) {
      tier.duration = config.baseDuration;
    }

    // Cooldown scaling
    if (config.baseCooldown && config.cooldownScaling !== undefined) {
      tier.cooldown = scaleTime(config.baseCooldown, config.cooldownScaling, level);
    } else if (config.baseCooldown) {
      tier.cooldown = config.baseCooldown;
    }

    // Energy cost scaling
    if (config.baseEnergyCost !== undefined && config.energyCostScaling !== undefined) {
      tier.energyCost = Math.round(config.baseEnergyCost + (config.energyCostScaling * (level - 1)));
    } else if (config.baseEnergyCost !== undefined) {
      tier.energyCost = config.baseEnergyCost;
    }

    // Effect description - just copy the base effect to all tiers
    if (config.baseEffect) {
      tier.effectDescription = config.baseEffect;
    }

    tiers.push(tier);
  }

  return tiers;
}

/**
 * Example usage:
 *
 * const tiers = generateAbilityTiers({
 *   baseDuration: "15 sec",
 *   baseCooldown: "5 min",
 *   baseEnergyCost: 50,
 *   baseEffect: "Deals fire damage",
 *   durationScaling: 0.3,      // +30% per level (compounding)
 *   cooldownScaling: -0.1,     // -10% per level (compounding)
 *   energyCostScaling: 5,      // +5 energy per level (linear)
 *   maxLevel: 5
 * });
 *
 * Result for level 1: duration="15 sec", cooldown="5 min", energyCost=50, effect="Deals fire damage"
 * Result for level 2: duration="20 sec", cooldown="4 min 30 sec", energyCost=55, effect="Deals fire damage"
 * Result for level 3: duration="25 sec", cooldown="4 min 3 sec", energyCost=60, effect="Deals fire damage"
 * Result for level 4: duration="33 sec", cooldown="3 min 39 sec", energyCost=65, effect="Deals fire damage"
 * Result for level 5: duration="43 sec", cooldown="3 min 17 sec", energyCost=70, effect="Deals fire damage"
 *
 * Note: Duration and cooldown use COMPOUNDING (exponential) scaling per level.
 * Energy cost uses LINEAR scaling (simple addition per level).
 * Effect description is copied from baseEffect to all tiers.
 */
