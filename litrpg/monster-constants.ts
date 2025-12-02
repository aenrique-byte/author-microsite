import { Monster, MonsterRank } from './types';
import { getXpForLevelStep, MONSTER_RANK_MULTIPLIERS, CREDIT_MULTIPLIER } from './xp-constants';

export const calculateMonsterXp = (level: number, rank: MonsterRank): number => {
    if (level < 2) return 0; 
    const base = getXpForLevelStep(level - 1); 
    return Math.round(base * MONSTER_RANK_MULTIPLIERS[rank]);
};

export const calculateMonsterCredits = (xp: number): number => {
    return Math.round(xp * CREDIT_MULTIPLIER);
};

export const INITIAL_MONSTERS: Monster[] = [
  {
    id: 'm1',
    name: 'Skitterbug',
    level: 2,
    rank: 'Trash',
    xpReward: 2,
    credits: 5,
    description: 'Small six-legged creatures with a chitinous exterior.',
    stats: { STR: 1, PER: 3, DEX: 4, MEM: 1, INT: 1, CHA: 1 },
    abilities: ['Quick Dash']
  },
  {
    id: 'm2',
    name: 'Scrap Bot',
    level: 3,
    rank: 'Regular',
    xpReward: 6,
    credits: 15,
    description: 'A malfunctioning maintenance droid scavenging for parts.',
    stats: { STR: 3, PER: 2, DEX: 1, MEM: 1, INT: 1, CHA: 1 },
    abilities: ['Crush', 'Self-Destruct']
  }
];