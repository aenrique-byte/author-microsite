// Tech Levels
export type TechLevel = 'TL8' | 'TL9' | 'TL10';

// Item Categories
export type ItemCategory = 'Tool' | 'Weapon' | 'Component' | 'Material' | 'Consumable' | 'Armor' | 'Medical';

export interface LootItem {
  name: string;
  techLevel: TechLevel;
  category: ItemCategory;
  description?: string;
}

// All Loot Items with Tech Levels and Categories (2 per category per tier)
export const LOOT_DATABASE: LootItem[] = [
  // ==================== TL8 (Basic Tech) ====================
  
  // TL8 - Materials
  { name: "Scrap Metal", techLevel: "TL8", category: "Material", description: "Salvaged metal fragments suitable for basic repairs and crafting." },
  { name: "Wire Spool", techLevel: "TL8", category: "Material" },
  
  // TL8 - Components  
  { name: "Damaged Circuit", techLevel: "TL8", category: "Component" },
  { name: "Energy Cell", techLevel: "TL8", category: "Component" },
  
  // TL8 - Consumables
  { name: "Nutrient Paste", techLevel: "TL8", category: "Consumable" },
  { name: "Stim Shot", techLevel: "TL8", category: "Consumable" },
  
  // TL8 - Medical
  { name: "Basic Medkit", techLevel: "TL8", category: "Medical" },
  { name: "Bandage Roll", techLevel: "TL8", category: "Medical" },
  
  // TL8 - Tools
  { name: "Multi-Tool", techLevel: "TL8", category: "Tool" },
  { name: "Flashlight", techLevel: "TL8", category: "Tool" },
  
  // TL8 - Weapons
  { name: "Combat Knife", techLevel: "TL8", category: "Weapon" },
  { name: "Stun Baton", techLevel: "TL8", category: "Weapon" },
  
  // TL8 - Armor
  { name: "Padded Vest", techLevel: "TL8", category: "Armor" },
  { name: "Salvage Helmet", techLevel: "TL8", category: "Armor" },
  
  // ==================== TL9 (Advanced Tech) ====================
  
  // TL9 - Materials
  { name: "Refined Steel", techLevel: "TL9", category: "Material" },
  { name: "Crystal Shard", techLevel: "TL9", category: "Material" },
  
  // TL9 - Components
  { name: "Intact Circuit Board", techLevel: "TL9", category: "Component" },
  { name: "Servo Motor", techLevel: "TL9", category: "Component" },
  
  // TL9 - Consumables
  { name: "Combat Stim", techLevel: "TL9", category: "Consumable" },
  { name: "Neural Stabilizer", techLevel: "TL9", category: "Consumable" },
  
  // TL9 - Medical
  { name: "Medical Supplies", techLevel: "TL9", category: "Medical" },
  { name: "Trauma Gel", techLevel: "TL9", category: "Medical" },
  
  // TL9 - Tools
  { name: "Hacking Module", techLevel: "TL9", category: "Tool" },
  { name: "Repair Drone", techLevel: "TL9", category: "Tool" },
  
  // TL9 - Weapons
  { name: "Energy Blade", techLevel: "TL9", category: "Weapon", description: "A plasma-edged melee weapon capable of cutting through standard armor plating." },
  { name: "Tactical Rifle", techLevel: "TL9", category: "Weapon" },
  
  // TL9 - Armor
  { name: "Tactical Vest", techLevel: "TL9", category: "Armor" },
  { name: "Combat Helmet", techLevel: "TL9", category: "Armor" },
  
  // ==================== TL10 (Elite Tech) ====================
  
  // TL10 - Materials
  { name: "Nano-fiber Mesh", techLevel: "TL10", category: "Material" },
  { name: "Void Essence", techLevel: "TL10", category: "Material" },
  
  // TL10 - Components
  { name: "Power Core", techLevel: "TL10", category: "Component", description: "High-output miniaturized fusion reactor. Powers starship-grade equipment." },
  { name: "Quantum Stabilizer", techLevel: "TL10", category: "Component", description: "Reality-anchoring device used in FTL drives and dimensional tech." },
  
  // TL10 - Consumables
  { name: "Nano-Repair Swarm", techLevel: "TL10", category: "Consumable" },
  { name: "Berserker Serum", techLevel: "TL10", category: "Consumable" },
  
  // TL10 - Medical
  { name: "Regeneration Vial", techLevel: "TL10", category: "Medical" },
  { name: "Neural Reconstruction Kit", techLevel: "TL10", category: "Medical" },
  
  // TL10 - Tools
  { name: "AI Core Fragment", techLevel: "TL10", category: "Tool" },
  { name: "Quantum Scanner", techLevel: "TL10", category: "Tool" },
  
  // TL10 - Weapons
  { name: "Plasma Rifle Core", techLevel: "TL10", category: "Weapon" },
  { name: "Void Blade", techLevel: "TL10", category: "Weapon" },
  
  // TL10 - Armor
  { name: "Powered Exo-Plate", techLevel: "TL10", category: "Armor" },
  { name: "Kinetic Barrier Module", techLevel: "TL10", category: "Armor" },
];

// Helper functions to filter loot
export const getLootByTechLevel = (tl: TechLevel): LootItem[] => 
  LOOT_DATABASE.filter(item => item.techLevel === tl);

export const getLootByCategory = (category: ItemCategory): LootItem[] =>
  LOOT_DATABASE.filter(item => item.category === category);

export const getLootByBoth = (tl: TechLevel, category: ItemCategory): LootItem[] =>
  LOOT_DATABASE.filter(item => item.techLevel === tl && item.category === category);

// Get all names (for dropdowns/compatibility)
export const ALL_LOOT = LOOT_DATABASE.map(item => item.name).sort();

// Legacy exports for backwards compatibility
export const COMMON_LOOT = getLootByTechLevel('TL8').map(i => i.name);
export const UNCOMMON_LOOT = getLootByTechLevel('TL9').map(i => i.name);
export const RARE_LOOT = getLootByTechLevel('TL10').map(i => i.name);

// Category colors for UI
export const CATEGORY_COLORS: Record<ItemCategory, string> = {
  Tool: 'text-amber-400 border-amber-500/30 bg-amber-900/10',
  Weapon: 'text-red-400 border-red-500/30 bg-red-900/10',
  Component: 'text-cyan-400 border-cyan-500/30 bg-cyan-900/10',
  Material: 'text-slate-300 border-slate-500/30 bg-slate-800/30',
  Consumable: 'text-green-400 border-green-500/30 bg-green-900/10',
  Armor: 'text-blue-400 border-blue-500/30 bg-blue-900/10',
  Medical: 'text-pink-400 border-pink-500/30 bg-pink-900/10',
};

// Tech Level colors for UI
export const TECH_LEVEL_COLORS: Record<TechLevel, string> = {
  TL8: 'text-slate-400 border-slate-600 bg-slate-800',
  TL9: 'text-blue-400 border-blue-600 bg-blue-900/20',
  TL10: 'text-purple-400 border-purple-600 bg-purple-900/20',
};
