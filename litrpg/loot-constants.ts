
export const COMMON_LOOT = [
  "Scrap Metal",
  "Energy Cell",
  "Damaged Circuit",
  "Alien Chitin",
  "Biomass Sample",
  "Nutrient Paste",
  "Rusty Bolts",
  "Glass Shard",
  "Wire Spool",
  "Plastic Polymers"
];

export const UNCOMMON_LOOT = [
  "Intact Circuit Board",
  "Weapon Parts",
  "Medical Supplies",
  "Optical Lens",
  "Hydraulic Fluid",
  "Plasma Canister",
  "Refined Steel",
  "Crystal Shard",
  "Memory Module",
  "Servo Motor"
];

export const RARE_LOOT = [
  "Power Core",
  "Nano-fiber Mesh",
  "Encrypted Data Drive",
  "Void Essence",
  "Quantum Stabilizer",
  "High-Grade Alloy",
  "Targeting Logic Unit"
];

// Combined list for dropdowns
export const ALL_LOOT = [
  ...COMMON_LOOT,
  ...UNCOMMON_LOOT,
  ...RARE_LOOT
].sort();
