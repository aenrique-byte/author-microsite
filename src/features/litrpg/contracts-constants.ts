// ============================================================
// CONTRACTS/QUESTS CONSTANTS
// Static quest data - manually updated
// ============================================================

export type ContractDifficulty = 'routine' | 'hazardous' | 'critical' | 'suicide';
export type ContractType = 'bounty' | 'extraction' | 'escort' | 'patrol' | 'investigation';

export interface ContractObjective {
  description: string;
  target: number;
  current: number;
}

export interface ContractRewards {
  xp?: number;
  credits?: number;
  items?: string[];
}

export interface Contract {
  id: string;
  title: string;
  description: string;
  contract_type: ContractType;
  difficulty: ContractDifficulty;
  level_requirement: number;
  time_limit?: string;
  objectives?: ContractObjective[];
  rewards?: ContractRewards;
}

export const CONTRACTS_DATABASE: Contract[] = [
  // ==================== ROUTINE ====================
  {
    id: 'routine-1',
    title: 'Perimeter Sweep',
    description: 'Patrol the outer perimeter of Sector 7 and report any anomalies. Standard security protocol.',
    contract_type: 'patrol',
    difficulty: 'routine',
    level_requirement: 1,
    objectives: [
      { description: 'Complete patrol route', target: 1, current: 0 },
      { description: 'Report any anomalies', target: 1, current: 0 },
    ],
    rewards: {
      xp: 500,
      credits: 250,
    },
  },
  {
    id: 'routine-2',
    title: 'Supply Escort',
    description: 'Accompany a supply convoy to the forward operating base. Minimal threat expected.',
    contract_type: 'escort',
    difficulty: 'routine',
    level_requirement: 3,
    time_limit: '4 hours',
    objectives: [
      { description: 'Escort convoy safely', target: 1, current: 0 },
    ],
    rewards: {
      xp: 750,
      credits: 400,
    },
  },

  // ==================== HAZARDOUS ====================
  {
    id: 'hazardous-1',
    title: 'Data Recovery',
    description: 'Extract data cores from a compromised facility. Hostile presence confirmed.',
    contract_type: 'extraction',
    difficulty: 'hazardous',
    level_requirement: 10,
    time_limit: '2 hours',
    objectives: [
      { description: 'Locate data cores', target: 3, current: 0 },
      { description: 'Extract safely', target: 1, current: 0 },
    ],
    rewards: {
      xp: 2500,
      credits: 1500,
      items: ['Encrypted Data Chip'],
    },
  },
  {
    id: 'hazardous-2',
    title: 'Rogue Hunter',
    description: 'Track and eliminate a rogue operative who defected with sensitive intel.',
    contract_type: 'bounty',
    difficulty: 'hazardous',
    level_requirement: 15,
    objectives: [
      { description: 'Track target location', target: 1, current: 0 },
      { description: 'Eliminate target', target: 1, current: 0 },
      { description: 'Recover intel package', target: 1, current: 0 },
    ],
    rewards: {
      xp: 4000,
      credits: 3000,
    },
  },

  // ==================== CRITICAL ====================
  {
    id: 'critical-1',
    title: 'High Value Target',
    description: 'Eliminate a known syndicate leader operating from an orbital station. Extreme caution required.',
    contract_type: 'bounty',
    difficulty: 'critical',
    level_requirement: 32,
    objectives: [
      { description: 'Infiltrate station', target: 1, current: 0 },
      { description: 'Locate target', target: 1, current: 0 },
      { description: 'Eliminate target', target: 1, current: 0 },
      { description: 'Exfiltrate safely', target: 1, current: 0 },
    ],
    rewards: {
      xp: 15000,
      credits: 10000,
      items: ['Syndicate Keycard', 'Advanced Combat Stim x3'],
    },
  },
  {
    id: 'critical-2',
    title: 'Anomaly Investigation',
    description: 'Investigate strange readings from an abandoned research facility. Last team went silent.',
    contract_type: 'investigation',
    difficulty: 'critical',
    level_requirement: 40,
    objectives: [
      { description: 'Investigate anomaly source', target: 1, current: 0 },
      { description: 'Collect samples', target: 5, current: 0 },
      { description: 'Report findings', target: 1, current: 0 },
    ],
    rewards: {
      xp: 20000,
      credits: 8000,
      items: ['Anomalous Sample', 'Research Notes'],
    },
  },

  // ==================== SUICIDE ====================
  {
    id: 'suicide-1',
    title: 'The Nexus Core',
    description: 'Infiltrate the enemy\'s central command and destroy their primary AI core. No backup available.',
    contract_type: 'extraction',
    difficulty: 'suicide',
    level_requirement: 66,
    time_limit: '30 minutes',
    objectives: [
      { description: 'Breach central command', target: 1, current: 0 },
      { description: 'Locate AI core', target: 1, current: 0 },
      { description: 'Plant charges', target: 4, current: 0 },
      { description: 'Destroy core and escape', target: 1, current: 0 },
    ],
    rewards: {
      xp: 100000,
      credits: 50000,
      items: ['AI Fragment', 'Legendary Weapon Schematic'],
    },
  },
];

// Helper functions
export const getAllContracts = (): Contract[] => CONTRACTS_DATABASE;

export const getContractsByDifficulty = (difficulty: ContractDifficulty): Contract[] =>
  CONTRACTS_DATABASE.filter(c => c.difficulty === difficulty);

export const getContractsByType = (type: ContractType): Contract[] =>
  CONTRACTS_DATABASE.filter(c => c.contract_type === type);

export const getContractById = (id: string): Contract | undefined =>
  CONTRACTS_DATABASE.find(c => c.id === id);
