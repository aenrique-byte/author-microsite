import { Attribute } from './types';

// UI-only descriptions for attributes. Gameplay data should come from the database.
export const ATTRIBUTE_DESCRIPTIONS: Record<Attribute, string> = {
  [Attribute.STR]: 'Melee damage, carrying capacity, physical endurance',
  [Attribute.PER]: 'Perception, awareness, detection, initiative',
  [Attribute.DEX]: 'Accuracy, piloting, dodge/evasion, stealth, precision',
  [Attribute.MEM]: 'Knowledge recall, skill proficiency, resist mental effects',
  [Attribute.INT]: 'Technical, Engineering, Scientific, invention',
  [Attribute.CHA]: 'Influence, leadership, negotiation, morale',
};
