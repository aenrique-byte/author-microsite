import { Attribute } from './types';

// Re-export everything from modules
export * from './xp-constants';
export * from './ability-constants';
export * from './class-constants';
export * from './monster-constants';
export * from './loot-constants';

// --- SHARED UI CONSTANTS ---
export const ATTRIBUTE_DESCRIPTIONS: Record<Attribute, string> = {
  [Attribute.STR]: 'Melee damage, carrying capacity, physical endurance',
  [Attribute.PER]: 'Perception, awareness, detection, initiative',
  [Attribute.DEX]: 'Accuracy, piloting, dodge/evasion, stealth, precision',
  [Attribute.MEM]: 'Knowledge recall, skill proficiency, resist mental effects',
  [Attribute.INT]: 'Technical, Engineering, Scientific, invention',
  [Attribute.CHA]: 'Influence, leadership, negotiation, morale',
};
