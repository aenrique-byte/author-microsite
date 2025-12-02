// ============================================================
// DATABASE EXPORTED CLASSES
// Generated from MySQL - paste exported classes below
// ============================================================

export interface ExportedClass {
  id: number;
  slug: string;
  name: string;
  description: string;
  tier: number;
  unlockLevel: number;
  prerequisiteClassId?: number;
  statBonuses?: Record<string, number>;
  primaryAttribute?: string;
  secondaryAttribute?: string;
  startingItem?: string;
  abilityIds: number[];
  upgradeIds?: number[];
}

export const DB_CLASSES: Record<string, ExportedClass> = {
  'recruit': {
    id: 1,
    slug: 'recruit',
    name: 'Recruit',
    description: 'Starter class that serves as an introductory class for newly integrated individuals, guiding them into the system and paving the way for potential specialization through upgrades at level 10.',
    tier: 1,
    unlockLevel: 1,
    // Basic combat training - ranged and melee fundamentals
    abilityIds: [311], // Basic Ranged Shot
  },
  'scout': {
    id: 9,
    slug: 'scout',
    name: 'Scout',
    description: 'A stealth-oriented class specializing in infiltration, using both ranged and melee weapons to eliminate targets.',
    tier: 2,
    unlockLevel: 10,
    prerequisiteClassId: 1,
    statBonuses: {
      PER: 1,
    },
    primaryAttribute: 'PER',
    // Stealth and movement abilities
    abilityIds: [
      201, // Active Camouflage
      203, // Thermal Dampening
      101, // Dash Burst
      18,  // Proximity Threat Map
    ],
  },
  'hunter': {
    id: 12,
    slug: 'hunter',
    name: 'Hunter',
    description: 'Long-range engagement specialist with mobility and tracking overlays.',
    tier: 2,
    unlockLevel: 10,
    prerequisiteClassId: 1,
    statBonuses: {
      DEX: 1,
    },
    primaryAttribute: 'DEX',
    // Tracking and ranged precision abilities
    abilityIds: [
      40,  // Tracking Vector Overlay
      39,  // Predator Mark
      312, // Precision Shot
      43,  // Perfect Line Shot
    ],
  },
  'operative': {
    id: 10,
    slug: 'operative',
    name: 'Operative',
    description: 'Expert in reconnaissance and gathering intelligence, utilizing stealth and agility.',
    tier: 3,
    unlockLevel: 32,
    prerequisiteClassId: 9,
    statBonuses: {
      PER: 1,
      INT: 1,
    },
    primaryAttribute: 'PER',
    secondaryAttribute: 'INT',
    // Advanced perception and hacking abilities
    abilityIds: [
      20,  // Tactical Analysis Protocol
      601, // System Breach Protocol
      205, // Acoustic Dampening
      35,  // Peripheral Target Acquisition
    ],
  },
  'infiltrator': {
    id: 11,
    slug: 'infiltrator',
    name: 'Infiltrator',
    description: 'Master of silent infiltration, capable of bypassing security systems, guards, and traps. Experts in stealth, subterfuge, and close combat takedowns.',
    tier: 4,
    unlockLevel: 66,
    prerequisiteClassId: 10,
    statBonuses: {
      PER: 2,
      MEM: 1,
    },
    primaryAttribute: 'PER',
    secondaryAttribute: 'MEM',
    // Elite stealth and prediction abilities
    abilityIds: [
      21,  // Combat Predictive Analysis
      207, // Motion Trail Eraser
      602, // Data Ghost Override
      304, // Assassination Strike
    ],
  },
};

// Lookup by numeric ID
export const CLASSES_BY_ID: Record<number, ExportedClass> = Object.fromEntries(
  Object.values(DB_CLASSES).map(c => [c.id, c])
);

// Get all classes as array
export const getAllClasses = (): ExportedClass[] => Object.values(DB_CLASSES);

// Get class by slug
export const getClassBySlug = (slug: string): ExportedClass | undefined => DB_CLASSES[slug];

// Get class by ID
export const getClassById = (id: number): ExportedClass | undefined => CLASSES_BY_ID[id];
