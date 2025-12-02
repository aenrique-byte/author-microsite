// ============================================================
// PROFESSION SYSTEM
// Non-combat specializations unlocked at level 16 (T1) and 42 (T2)
// ============================================================

export interface ExportedProfession {
  id: number;
  slug: string;
  name: string;
  description: string;
  tier: string;
  unlockLevel: number;
  prerequisiteProfessionId?: number;
  statBonuses?: Record<string, number>;
  abilityIds: number[];
}

export const DB_PROFESSIONS: Record<string, ExportedProfession> = {
  // ============================================================
  // TIER 1 PROFESSIONS (Level 16)
  // ============================================================
  
  'pilot': {
    id: 101,
    slug: 'pilot',
    name: 'Pilot',
    description: 'Skilled spacecraft operator specializing in flight control, vehicle maneuvering, and atmospheric/space navigation. Masters basic piloting techniques across various ship classes.',
    tier: 'tier-1',
    unlockLevel: 16,
    statBonuses: {
      DEX: 1,
    },
    abilityIds: [1001, 1002, 1003, 1004, 1005], // Trajectory Lock, Vector Precision, Adaptive Flight Control, Instinctive Glide Correction, Adaptive Burn Profiling
  },
  
  'operations-specialist': {
    id: 102,
    slug: 'operations-specialist',
    name: 'Operations Specialist',
    description: 'Coordinates crew activities, manages resource allocation, and oversees logistical operations. Ensures smooth day-to-day ship functions and mission support.',
    tier: 'tier-1',
    unlockLevel: 16,
    statBonuses: {
      INT: 1,
    },
    abilityIds: [],
  },
  
  'field-researcher': {
    id: 103,
    slug: 'field-researcher',
    name: 'Field Researcher',
    description: 'Scientific specialist focused on data collection, analysis, and research protocols. Conducts experiments and gathers empirical evidence across various disciplines.',
    tier: 'tier-1',
    unlockLevel: 16,
    statBonuses: {
      INT: 1,
    },
    abilityIds: [],
  },
  
  'medical-officer': {
    id: 104,
    slug: 'medical-officer',
    name: 'Medical Officer',
    description: 'Ship\'s primary healthcare provider, responsible for crew health, medical diagnostics, treatment protocols, and maintaining medical readiness.',
    tier: 'tier-1',
    unlockLevel: 16,
    statBonuses: {
      INT: 1,
    },
    abilityIds: [],
  },
  
  'systems-technician': {
    id: 105,
    slug: 'systems-technician',
    name: 'Systems Technician',
    description: 'Technical specialist handling system maintenance, repairs, and troubleshooting. Keeps ship systems operational and performs routine technical diagnostics.',
    tier: 'tier-1',
    unlockLevel: 16,
    statBonuses: {
      INT: 1,
    },
    abilityIds: [],
  },
  
  'astrogator': {
    id: 106,
    slug: 'astrogator',
    name: 'Astrogator',
    description: 'Navigation specialist skilled in stellar cartography, route calculation, and spatial positioning. Plots efficient courses through known and unknown space.',
    tier: 'tier-1',
    unlockLevel: 16,
    statBonuses: {
      INT: 1,
    },
    abilityIds: [],
  },
  
  'mechanic': {
    id: 107,
    slug: 'mechanic',
    name: 'Mechanic',
    description: 'Hands-on maintenance expert specializing in equipment repair, vehicle servicing, and mechanical systems. Ensures physical components remain operational.',
    tier: 'tier-1',
    unlockLevel: 16,
    statBonuses: {
      INT: 1,
    },
    abilityIds: [],
  },
  
  // ============================================================
  // TIER 2 PROFESSIONS (Level 42)
  // ============================================================
  
  'starship-commander': {
    id: 201,
    slug: 'starship-commander',
    name: 'Starship Commander',
    description: 'Elite fleet coordinator and tactical flight commander. Masters advanced piloting techniques, fleet formations, and high-stakes combat maneuvering at the helm.',
    tier: 'tier-2',
    unlockLevel: 42,
    prerequisiteProfessionId: 101,
    statBonuses: {
      DEX: 1,
      PER: 1,
    },
    abilityIds: [2001, 2002, 2003, 2004], // Systems Analysis Burst, Operational Insight, Pathfinder's Intuition, Combat Drift
  },
  
  'operations-executive': {
    id: 202,
    slug: 'operations-executive',
    name: 'Operations Executive',
    description: 'Executive Officer equivalent - strategic operations commander overseeing all ship functions. Masters crew coordination, resource optimization, and mission-critical decision making.',
    tier: 'tier-2',
    unlockLevel: 42,
    prerequisiteProfessionId: 102,
    statBonuses: {
      INT: 1,
      CHA: 1,
    },
    abilityIds: [],
  },
  
  'unified-theorist': {
    id: 203,
    slug: 'unified-theorist',
    name: 'Unified Theorist',
    description: 'Cross-disciplinary scientific master capable of groundbreaking theoretical work. Synthesizes knowledge across multiple fields to achieve revolutionary breakthroughs.',
    tier: 'tier-2',
    unlockLevel: 42,
    prerequisiteProfessionId: 103,
    statBonuses: {
      INT: 2,
    },
    abilityIds: [],
  },
  
  'clinical-strategist': {
    id: 204,
    slug: 'clinical-strategist',
    name: 'Clinical Strategist',
    description: 'Medical command specialist who develops healthcare strategies, optimizes treatment protocols, and coordinates preventive care across entire crews or populations.',
    tier: 'tier-2',
    unlockLevel: 42,
    prerequisiteProfessionId: 104,
    statBonuses: {
      INT: 1,
      WIS: 1,
    },
    abilityIds: [],
  },
  
  'integrated-engineer': {
    id: 205,
    slug: 'integrated-engineer',
    name: 'Integrated Engineer',
    description: 'Multi-system integration specialist who solves complex engineering challenges. Innovates solutions that bridge multiple ship systems for enhanced performance.',
    tier: 'tier-2',
    unlockLevel: 42,
    prerequisiteProfessionId: 105,
    statBonuses: {
      INT: 1,
      WIS: 1,
    },
    abilityIds: [],
  },
  
  'spatial-analyst': {
    id: 206,
    slug: 'spatial-analyst',
    name: 'Spatial Analyst',
    description: 'Advanced navigation theorist specializing in spatial anomalies, FTL calculations, and cutting-edge astrogation. Charts courses through the most challenging spatial phenomena.',
    tier: 'tier-2',
    unlockLevel: 42,
    prerequisiteProfessionId: 106,
    statBonuses: {
      INT: 1,
      PER: 1,
    },
    abilityIds: [],
  },
  
  'tactical-systems-engineer': {
    id: 207,
    slug: 'tactical-systems-engineer',
    name: 'Tactical Systems Engineer',
    description: 'Combat systems optimization specialist who enhances weapon systems, shields, and tactical equipment. Engineers solutions that provide battlefield advantages.',
    tier: 'tier-2',
    unlockLevel: 42,
    prerequisiteProfessionId: 107,
    statBonuses: {
      INT: 1,
      DEX: 1,
    },
    abilityIds: [],
  },
};

// Lookup by numeric ID
export const PROFESSIONS_BY_ID: Record<number, ExportedProfession> = Object.fromEntries(
  Object.values(DB_PROFESSIONS).map(p => [p.id, p])
);

// Get all professions as array
export const getAllProfessions = (): ExportedProfession[] => Object.values(DB_PROFESSIONS);

// Get profession by slug
export const getProfessionBySlug = (slug: string): ExportedProfession | undefined => DB_PROFESSIONS[slug];

// Get profession by ID
export const getProfessionById = (id: number): ExportedProfession | undefined => PROFESSIONS_BY_ID[id];

// Get professions by tier
export const getProfessionsByTier = (tier: string): ExportedProfession[] => 
  Object.values(DB_PROFESSIONS).filter(p => p.tier === tier);
