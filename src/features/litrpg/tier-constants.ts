/**
 * Class Tier Configuration
 * Uses numeric tiers (1-6) to allow flexible class evolution paths
 * Any tier class can have prerequisites to any other tier class
 * 
 * NOTE: Level thresholds for class unlocks come from the database (unlock_level field)
 */

export type ClassTier = 'tier-1' | 'tier-2' | 'tier-3' | 'tier-4' | 'tier-5' | 'tier-6';

// Get tier number from tier string
export function getTierNumber(tier: ClassTier | string): number {
  return parseInt(String(tier).replace('tier-', ''));
}

// Compare tiers (returns positive if a > b, negative if a < b, 0 if equal)
export function compareTiers(tierA: ClassTier | string, tierB: ClassTier | string): number {
  return getTierNumber(tierA) - getTierNumber(tierB);
}

// Order that tiers should be displayed (lowest to highest)
export const TIER_ORDER: ClassTier[] = [
  'tier-1',
  'tier-2', 
  'tier-3',
  'tier-4',
  'tier-5',
  'tier-6'
];

// Human-readable names for display
export const TIER_NAMES: Record<ClassTier, string> = {
  'tier-1': 'Tier 1',
  'tier-2': 'Tier 2',
  'tier-3': 'Tier 3',
  'tier-4': 'Tier 4',
  'tier-5': 'Tier 5',
  'tier-6': 'Tier 6'
};

// Color schemes for each tier
export const TIER_COLORS: Record<ClassTier, string> = {
  'tier-1': 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  'tier-2': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  'tier-3': 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  'tier-4': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  'tier-5': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  'tier-6': 'text-red-400 bg-red-500/10 border-red-500/30'
};

// Text colors for headers
export const TIER_TEXT_COLORS: Record<ClassTier, string> = {
  'tier-1': 'text-slate-400',
  'tier-2': 'text-blue-400',
  'tier-3': 'text-purple-400',
  'tier-4': 'text-yellow-400',
  'tier-5': 'text-orange-400',
  'tier-6': 'text-red-400'
};

// Border colors for cards
export const TIER_BORDER_COLORS: Record<ClassTier, string> = {
  'tier-1': 'border-slate-700',
  'tier-2': 'border-blue-900/50',
  'tier-3': 'border-purple-900/50',
  'tier-4': 'border-yellow-900/50',
  'tier-5': 'border-orange-900/50',
  'tier-6': 'border-red-900/50'
};

// Helper to get tier string from number
export function getTierString(tierNum: number): ClassTier {
  return `tier-${tierNum}` as ClassTier;
}

// Helper to get tier color by number
export function getTierColorByNumber(tierNum: number): string {
  return TIER_COLORS[getTierString(tierNum)] || TIER_COLORS['tier-1'];
}

// Helper to get tier name by number
export function getTierNameByNumber(tierNum: number): string {
  return TIER_NAMES[getTierString(tierNum)] || `Tier ${tierNum}`;
}
