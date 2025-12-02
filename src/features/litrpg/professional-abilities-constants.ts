/**
 * Professional Abilities for LitRPG System
 * These abilities are specific to professions and provide utility/support functions
 */

export interface ProfessionalAbilityTier {
  level: number;
  cooldown?: string;
  duration?: string;
  effectDescription?: string;
}

export interface ProfessionalAbility {
  id: number;
  name: string;
  description: string;
  professionId: number; // Link to profession
  maxLevel: number;
  tiers: ProfessionalAbilityTier[];
}

// ====================================
// PILOT PROFESSION ABILITIES (ID: 1)
// ====================================

const TRAJECTORY_LOCK: ProfessionalAbility = {
  id: 1001,
  name: 'Trajectory Lock',
  description: 'Instantly calculate and lock in an ideal orbital trajectory, including slingshot maneuvers or fuel-efficient transfers, accounting for gravitational forces and potential hazards.',
  professionId: 1,
  maxLevel: 5,
  tiers: [
    {
      level: 1,
      cooldown: '120s',
      duration: 'Instant',
      effectDescription: 'Calculate optimal trajectory with 85% efficiency, 10% fuel savings'
    },
    {
      level: 2,
      cooldown: '100s',
      duration: 'Instant',
      effectDescription: 'Calculate optimal trajectory with 90% efficiency, 15% fuel savings'
    },
    {
      level: 3,
      cooldown: '80s',
      duration: 'Instant',
      effectDescription: 'Calculate optimal trajectory with 95% efficiency, 20% fuel savings'
    },
    {
      level: 4,
      cooldown: '60s',
      duration: 'Instant',
      effectDescription: 'Calculate optimal trajectory with 98% efficiency, 25% fuel savings, includes hazard warnings'
    },
    {
      level: 5,
      cooldown: '45s',
      duration: 'Instant',
      effectDescription: 'Calculate perfect trajectory with 100% efficiency, 30% fuel savings, hazard avoidance, multi-leg planning'
    }
  ]
};

const VECTOR_PRECISION: ProfessionalAbility = {
  id: 1002,
  name: 'Vector Precision',
  description: 'Gain heightened control of thrusters and maneuvering jets, allowing for ultra-precise adjustments during docking, station-keeping, or avoiding debris in zero-gravity environments.',
  professionId: 1,
  maxLevel: 5,
  tiers: [
    {
      level: 1,
      cooldown: '20min',
      duration: '5min',
      effectDescription: '+25% thruster precision, 90% successful docking probability'
    },
    {
      level: 2,
      cooldown: '18min',
      duration: '6min',
      effectDescription: '+35% thruster precision, 93% successful docking probability'
    },
    {
      level: 3,
      cooldown: '15min',
      duration: '7min',
      effectDescription: '+45% thruster precision, 95% successful docking probability, debris avoidance'
    },
    {
      level: 4,
      cooldown: '12min',
      duration: '8min',
      effectDescription: '+55% thruster precision, 97% successful docking probability, auto-debris tracking'
    },
    {
      level: 5,
      cooldown: '10min',
      duration: '10min',
      effectDescription: '+70% thruster precision, 99% successful docking probability, perfect station-keeping'
    }
  ]
};

const ADAPTIVE_FLIGHT_CONTROL: ProfessionalAbility = {
  id: 1003,
  name: 'Adaptive Flight Control',
  description: 'Seamlessly coordinate between space and atmospheric piloting, compensating for environmental transitions (e.g., wind drag or gravity shifts) without losing control or speed.',
  professionId: 1,
  maxLevel: 5,
  tiers: [
    {
      level: 1,
      cooldown: '30min',
      duration: '3min',
      effectDescription: 'Smooth space-to-atmosphere transition, -20% drag penalty'
    },
    {
      level: 2,
      cooldown: '25min',
      duration: '4min',
      effectDescription: 'Smooth space-to-atmosphere transition, -30% drag penalty, +10% speed retention'
    },
    {
      level: 3,
      cooldown: '20min',
      duration: '5min',
      effectDescription: 'Seamless environment transition, -40% drag penalty, +15% speed retention'
    },
    {
      level: 4,
      cooldown: '15min',
      duration: '6min',
      effectDescription: 'Seamless environment transition, -50% drag penalty, +25% speed retention, auto-compensation'
    },
    {
      level: 5,
      cooldown: '10min',
      duration: '8min',
      effectDescription: 'Perfect environment mastery, -60% drag penalty, +35% speed retention, zero turbulence'
    }
  ]
};

const INSTINCTIVE_GLIDE_CORRECTION: ProfessionalAbility = {
  id: 1004,
  name: 'Instinctive Glide Correction',
  description: 'Override flight assist protocols during dangerous re-entry or landing conditions. Manually balance thrust vectors, pitch, and roll using learned atmospheric responses for smoother and safer maneuvering than any autopilot.',
  professionId: 1,
  maxLevel: 5,
  tiers: [
    {
      level: 1,
      cooldown: '45min',
      duration: '4min',
      effectDescription: 'Manual re-entry control, +20% landing safety, -15% heat buildup'
    },
    {
      level: 2,
      cooldown: '40min',
      duration: '5min',
      effectDescription: 'Enhanced manual control, +30% landing safety, -25% heat buildup, smoother descent'
    },
    {
      level: 3,
      cooldown: '35min',
      duration: '6min',
      effectDescription: 'Expert manual control, +40% landing safety, -35% heat buildup, precise landing zone'
    },
    {
      level: 4,
      cooldown: '30min',
      duration: '7min',
      effectDescription: 'Master-level control, +50% landing safety, -45% heat buildup, emergency conditions handling'
    },
    {
      level: 5,
      cooldown: '25min',
      duration: '8min',
      effectDescription: 'Perfect atmospheric mastery, +65% landing safety, -60% heat buildup, land anywhere safely'
    }
  ]
};

const ADAPTIVE_BURN_PROFILING: ProfessionalAbility = {
  id: 1005,
  name: 'Adaptive Burn Profiling',
  description: 'Override standard fuel-use parameters by manually adjusting mixture ratios and flow cycles to match real-time conditions. Results in exceptionally fuel-efficient burn phases, maximizing output with minimal consumption.',
  professionId: 1,
  maxLevel: 5,
  tiers: [
    {
      level: 1,
      cooldown: '30min',
      duration: '8min',
      effectDescription: '+15% fuel efficiency, optimal burn for current ship class'
    },
    {
      level: 2,
      cooldown: '25min',
      duration: '10min',
      effectDescription: '+22% fuel efficiency, gravity well compensation'
    },
    {
      level: 3,
      cooldown: '20min',
      duration: '12min',
      effectDescription: '+30% fuel efficiency, real-time orbital mechanics adjustment'
    },
    {
      level: 4,
      cooldown: '15min',
      duration: '14min',
      effectDescription: '+40% fuel efficiency, multi-stage burn optimization, +10% thrust output'
    },
    {
      level: 5,
      cooldown: '10min',
      duration: '15min',
      effectDescription: '+50% fuel efficiency, perfect mixture control, +20% thrust output, extended range'
    }
  ]
};

// ====================================
// STARSHIP COMMANDER PROFESSION ABILITIES (ID: 201)
// ====================================

const SYSTEMS_ANALYSIS_BURST: ProfessionalAbility = {
  id: 2001,
  name: 'Systems Analysis Burst',
  description: 'By focusing on system monitors and diagnostic tools, mentally process complex subsystem interactions in a fraction of normal time. Pinpoint interdependencies or cascading failures instantly.',
  professionId: 201,
  maxLevel: 5,
  tiers: [
    {
      level: 1,
      cooldown: '15min',
      duration: '20s',
      effectDescription: 'Heightened system understanding, isolate 1 subsystem issue 75% faster'
    },
    {
      level: 2,
      cooldown: '12min',
      duration: '25s',
      effectDescription: 'Heightened system understanding, isolate 2 subsystem issues 85% faster'
    },
    {
      level: 3,
      cooldown: '10min',
      duration: '30s',
      effectDescription: 'Advanced system understanding, isolate 3 subsystem issues 90% faster, detect cascading failures'
    },
    {
      level: 4,
      cooldown: '8min',
      duration: '35s',
      effectDescription: 'Expert system understanding, isolate 4 subsystem issues 95% faster, predict failure chains'
    },
    {
      level: 5,
      cooldown: '5min',
      duration: '45s',
      effectDescription: 'Master system understanding, isolate all subsystem issues instantly, full failure chain analysis'
    }
  ]
};

const OPERATIONAL_INSIGHT: ProfessionalAbility = {
  id: 2002,
  name: 'Operational Insight',
  description: 'Using monitors, diagnostic tools, and ship logs, rapidly piece together critical operational data. Instinctively identify key variables affecting performance and determine optimal solutions.',
  professionId: 201,
  maxLevel: 5,
  tiers: [
    {
      level: 1,
      cooldown: '20min',
      duration: '30s',
      effectDescription: '+50% data comprehension speed, analyze operational issues 2x faster'
    },
    {
      level: 2,
      cooldown: '18min',
      duration: '40s',
      effectDescription: '+75% data comprehension speed, analyze operational issues 2.5x faster'
    },
    {
      level: 3,
      cooldown: '15min',
      duration: '50s',
      effectDescription: '+100% data comprehension speed, analyze operational issues 3x faster, identify root causes'
    },
    {
      level: 4,
      cooldown: '12min',
      duration: '60s',
      effectDescription: '+125% data comprehension speed, analyze operational issues 3.5x faster, predict optimization paths'
    },
    {
      level: 5,
      cooldown: '10min',
      duration: '75s',
      effectDescription: '+150% data comprehension speed, analyze operational issues 4x faster, complete system optimization'
    }
  ]
};

const PATHFINDERS_INTUITION: ProfessionalAbility = {
  id: 2003,
  name: "Pathfinder's Intuition",
  description: 'Rapidly analyze navigational data from maps, scanners, and tools to identify safest and most efficient routes. Highlights safe paths, fuel-efficient trajectories, and emergency escape vectors.',
  professionId: 201,
  maxLevel: 5,
  tiers: [
    {
      level: 1,
      cooldown: '10min',
      duration: '15s',
      effectDescription: 'Analyze 1 route option, identify basic hazards and safe paths'
    },
    {
      level: 2,
      cooldown: '8min',
      duration: '20s',
      effectDescription: 'Analyze 2 route options, identify hazards + fuel-efficient paths'
    },
    {
      level: 3,
      cooldown: '6min',
      duration: '25s',
      effectDescription: 'Analyze 3 route options, identify hazards + time/fuel optimization + hidden shortcuts'
    },
    {
      level: 4,
      cooldown: '5min',
      duration: '30s',
      effectDescription: 'Analyze 4 route options, all previous + tactical positioning + emergency vectors'
    },
    {
      level: 5,
      cooldown: '3min',
      duration: '40s',
      effectDescription: 'Analyze unlimited route options, perfect path optimization, all hidden routes revealed'
    }
  ]
};

const COMBAT_DRIFT: ProfessionalAbility = {
  id: 2004,
  name: 'Combat Drift',
  description: 'Intuitively predict and react to inertia, gravity, and thrust dynamics. Execute precision combat maneuvers or evasive actions with minimal error for tactical positional advantage.',
  professionId: 201,
  maxLevel: 5,
  tiers: [
    {
      level: 1,
      cooldown: '10min',
      duration: '10s',
      effectDescription: '+30% evasion accuracy, basic combat maneuvers'
    },
    {
      level: 2,
      cooldown: '8min',
      duration: '12s',
      effectDescription: '+45% evasion accuracy, advanced combat maneuvers, predict 1 enemy vector'
    },
    {
      level: 3,
      cooldown: '6min',
      duration: '15s',
      effectDescription: '+60% evasion accuracy, expert combat maneuvers, predict 2 enemy vectors'
    },
    {
      level: 4,
      cooldown: '5min',
      duration: '18s',
      effectDescription: '+75% evasion accuracy, master combat maneuvers, predict 3 enemy vectors, gain positioning advantage'
    },
    {
      level: 5,
      cooldown: '4min',
      duration: '20s',
      effectDescription: '+90% evasion accuracy, perfect combat maneuvers, predict all enemy vectors, perfect positioning'
    }
  ]
};

// ====================================
// PROFESSION ABILITY COLLECTIONS
// ====================================

export const PILOT_ABILITIES: ProfessionalAbility[] = [
  TRAJECTORY_LOCK,
  VECTOR_PRECISION,
  ADAPTIVE_FLIGHT_CONTROL,
  INSTINCTIVE_GLIDE_CORRECTION,
  ADAPTIVE_BURN_PROFILING
];

export const STARSHIP_COMMANDER_ABILITIES: ProfessionalAbility[] = [
  SYSTEMS_ANALYSIS_BURST,
  OPERATIONAL_INSIGHT,
  PATHFINDERS_INTUITION,
  COMBAT_DRIFT
];

// Master list of all professional abilities
export const ALL_PROFESSIONAL_ABILITIES: ProfessionalAbility[] = [
  ...PILOT_ABILITIES,
  ...STARSHIP_COMMANDER_ABILITIES
  // Add other profession abilities here as they're created
];

/**
 * Get all professional abilities
 */
export function getAllProfessionalAbilities(): ProfessionalAbility[] {
  return ALL_PROFESSIONAL_ABILITIES;
}

/**
 * Get professional abilities for a specific profession
 */
export function getProfessionalAbilitiesByProfessionId(professionId: number): ProfessionalAbility[] {
  return ALL_PROFESSIONAL_ABILITIES.filter(ability => ability.professionId === professionId);
}

/**
 * Get a professional ability by ID
 */
export function getProfessionalAbilityById(id: number): ProfessionalAbility | undefined {
  return ALL_PROFESSIONAL_ABILITIES.find(ability => ability.id === id);
}

/**
 * Get a professional ability by name
 */
export function getProfessionalAbilityByName(name: string): ProfessionalAbility | undefined {
  return ALL_PROFESSIONAL_ABILITIES.find(ability => ability.name === name);
}
