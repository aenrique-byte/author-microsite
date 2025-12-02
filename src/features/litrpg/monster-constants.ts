import { getXpForLevelStep, MONSTER_RANK_MULTIPLIERS, CREDIT_MULTIPLIER } from './xp-constants';

export type MonsterRank = 'Trash' | 'Regular' | 'Champion' | 'Boss';

export const calculateMonsterXp = (level: number, rank: MonsterRank): number => {
    if (level < 2) return 0; 
    const base = getXpForLevelStep(level - 1); 
    return Math.round(base * MONSTER_RANK_MULTIPLIERS[rank]);
};

export const calculateMonsterCredits = (xp: number): number => {
    return Math.round(xp * CREDIT_MULTIPLIER);
};

// ============================================================
// DATABASE EXPORTED MONSTERS
// Generated from MySQL - paste exported monsters below
// ============================================================

export interface ExportedMonster {
  id: string;
  slug: string;
  name: string;
  description: string;
  level: number;
  rank: MonsterRank;
  hp?: number;
  stats?: Record<string, number>;
  abilities?: string[];
  lootTable?: Array<{ item: string; rate: number }>;
  xpReward: number;
  credits: number;
}

export const DB_MONSTERS: Record<string, ExportedMonster> = {
  'skitterbug': {
    id: 'm1',
    slug: 'skitterbug',
    name: 'Skitterbug',
    level: 2,
    rank: 'Trash',
    xpReward: 2,
    credits: 5,
    description: 'Small six-legged creatures with a chitinous exterior.',
    stats: { STR: 1, PER: 3, DEX: 4, MEM: 1, INT: 1, CHA: 1 },
    abilities: ['Quick Dash']
  },
  'bladewing-skitterbug': {
    id: 'm2',
    slug: 'bladewing-skitterbug',
    name: 'Bladewing Skitterbug',
    level: 2,
    rank: 'Regular',
    xpReward: 6,
    credits: 15,
    description: 'Larger with sharp, blade-like extensions on its limbs.',
    stats: { STR: 2, PER: 3, DEX: 5, MEM: 1, INT: 1, CHA: 1 },
    abilities: ['Quick Dash', 'Blade Slice']
  },
  'radroach': {
    id: 'm3',
    slug: 'radroach',
    name: 'Radroach',
    level: 2,
    rank: 'Trash',
    xpReward: 2,
    credits: 5,
    description: 'Large, mutated cockroaches about the size of a human hand.',
    stats: { STR: 1, PER: 2, DEX: 3, MEM: 1, INT: 1, CHA: 1 },
    abilities: ['Rapid Reproduction']
  },
  'alpha-radroach': {
    id: 'm4',
    slug: 'alpha-radroach',
    name: 'Alpha Radroach',
    level: 2,
    rank: 'Regular',
    xpReward: 6,
    credits: 15,
    description: 'Slightly larger with a toughened exoskeleton.',
    stats: { STR: 2, PER: 2, DEX: 3, MEM: 1, INT: 1, CHA: 1 },
    abilities: ['Rapid Reproduction', 'Foul Odor']
  },

  // --- Level 3 ---
  'mossback-doe': {
    id: 'm5',
    slug: 'mossback-doe',
    name: 'Mossback Doe',
    level: 3,
    rank: 'Trash',
    xpReward: 2,
    credits: 6,
    description: 'Deer-sized herbivore with mossy camouflage.',
    stats: { STR: 2, PER: 4, DEX: 4, MEM: 2, INT: 1, CHA: 2 },
    abilities: ['Forest Camouflage']
  },
  'thornback-stag': {
    id: 'm6',
    slug: 'thornback-stag',
    name: 'Thornback Stag',
    level: 3,
    rank: 'Regular',
    xpReward: 7,
    credits: 17,
    description: 'Larger with thorn-covered moss on its back and antlers.',
    stats: { STR: 4, PER: 4, DEX: 3, MEM: 2, INT: 1, CHA: 2 },
    abilities: ['Forest Camouflage', 'Thorn Defense']
  },
  'glow-moth': {
    id: 'm7',
    slug: 'glow-moth',
    name: 'Glow Moth',
    level: 3,
    rank: 'Trash',
    xpReward: 2,
    credits: 6,
    description: 'Luminescent moths emitting a soft blue glow.',
    stats: { STR: 1, PER: 5, DEX: 4, MEM: 1, INT: 1, CHA: 3 },
    abilities: ['Calming Pheromone']
  },
  'radiant-moth': {
    id: 'm8',
    slug: 'radiant-moth',
    name: 'Radiant Moth',
    level: 3,
    rank: 'Regular',
    xpReward: 7,
    credits: 17,
    description: 'Brighter glow with an enhanced calming effect.',
    stats: { STR: 1, PER: 6, DEX: 5, MEM: 1, INT: 1, CHA: 4 },
    abilities: ['Calming Pheromone', 'Disorienting Glow']
  },

  // --- Level 4 ---
  'carbon-hound': {
    id: 'm9',
    slug: 'carbon-hound',
    name: 'Carbon Hound',
    level: 4,
    rank: 'Trash',
    xpReward: 3,
    credits: 7,
    description: 'Mutated canine-like creature with a sleek, black, carbon-fiber-like exoskeleton.',
    stats: { STR: 3, PER: 5, DEX: 5, MEM: 2, INT: 2, CHA: 1 },
    abilities: ['Enhanced Night Vision', 'Pack Tactics']
  },
  'shadow-hound': {
    id: 'm10',
    slug: 'shadow-hound',
    name: 'Shadow Hound',
    level: 4,
    rank: 'Regular',
    xpReward: 8,
    credits: 20,
    description: 'Near-invisibility in darkness, enhanced stealth.',
    stats: { STR: 4, PER: 6, DEX: 6, MEM: 3, INT: 2, CHA: 1 },
    abilities: ['Enhanced Night Vision', 'Pack Tactics', 'Shadow Stealth']
  },
  'mire-crawler': {
    id: 'm11',
    slug: 'mire-crawler',
    name: 'Mire Crawler',
    level: 4,
    rank: 'Trash',
    xpReward: 3,
    credits: 7,
    description: 'Mutated leeches with bioluminescent patches.',
    stats: { STR: 3, PER: 2, DEX: 2, MEM: 1, INT: 1, CHA: 1 },
    abilities: ['Barbed Sucker Latch', 'Regeneration']
  },
  'blood-crawler': {
    id: 'm12',
    slug: 'blood-crawler',
    name: 'Blood Crawler',
    level: 4,
    rank: 'Regular',
    xpReward: 8,
    credits: 20,
    description: 'Larger and more aggressive, with a venomous bite.',
    stats: { STR: 4, PER: 3, DEX: 3, MEM: 1, INT: 1, CHA: 1 },
    abilities: ['Barbed Sucker Latch', 'Regeneration', 'Paralytic Venom']
  },

  // --- Level 5 ---
  'treeclimber-sloth': {
    id: 'm13',
    slug: 'treeclimber-sloth',
    name: 'Treeclimber Sloth',
    level: 5,
    rank: 'Trash',
    xpReward: 3,
    credits: 8,
    description: 'Large sloth-like creature with gripping limbs for climbing trees.',
    stats: { STR: 5, PER: 2, DEX: 2, MEM: 2, INT: 1, CHA: 2 },
    abilities: ['Strong Grip', 'Bark Blend']
  },
  'barkhide-sloth': {
    id: 'm14',
    slug: 'barkhide-sloth',
    name: 'Barkhide Sloth',
    level: 5,
    rank: 'Regular',
    xpReward: 9,
    credits: 23,
    description: 'Larger with bark-like skin that offers better camouflage and protection.',
    stats: { STR: 6, PER: 3, DEX: 2, MEM: 2, INT: 1, CHA: 2 },
    abilities: ['Strong Grip', 'Bark Blend', 'Harden Skin']
  },
  'scrap-rat': {
    id: 'm15',
    slug: 'scrap-rat',
    name: 'Scrap Rat',
    level: 5,
    rank: 'Trash',
    xpReward: 3,
    credits: 8,
    description: 'Mutated rats with metallic fur and sharp, steel-like teeth.',
    stats: { STR: 2, PER: 4, DEX: 6, MEM: 2, INT: 2, CHA: 1 },
    abilities: ['Metal Gnaw', 'Reflexes']
  },
  'ironclaw-rat': {
    id: 'm16',
    slug: 'ironclaw-rat',
    name: 'Ironclaw Rat',
    level: 5,
    rank: 'Regular',
    xpReward: 9,
    credits: 23,
    description: 'Larger, with reinforced teeth and claws that can cut through tougher materials.',
    stats: { STR: 3, PER: 5, DEX: 6, MEM: 2, INT: 2, CHA: 1 },
    abilities: ['Metal Gnaw', 'Reflexes', 'Rending Claw']
  },
  'waste-hound': {
    id: 'm17',
    slug: 'waste-hound',
    name: 'Waste Hound',
    level: 5,
    rank: 'Regular',
    xpReward: 9,
    credits: 23,
    description: 'Mutated canines with patchy fur, glowing eyes, and elongated fangs.',
    stats: { STR: 4, PER: 6, DEX: 5, MEM: 2, INT: 2, CHA: 1 },
    abilities: ['Acute Smell', 'Tracking']
  },
  'alpha-waste-hound': {
    id: 'm18',
    slug: 'alpha-waste-hound',
    name: 'Alpha Waste Hound',
    level: 5,
    rank: 'Champion',
    xpReward: 24,
    credits: 61,
    description: 'Larger, with reinforced jaws and a powerful howl that can stun prey.',
    stats: { STR: 6, PER: 7, DEX: 6, MEM: 3, INT: 3, CHA: 2 },
    abilities: ['Acute Smell', 'Tracking', 'Stun Howl']
  },

  // --- Level 6 ---
  'pebblehide-tortoise': {
    id: 'm19',
    slug: 'pebblehide-tortoise',
    name: 'Pebblehide Tortoise',
    level: 6,
    rank: 'Trash',
    xpReward: 3,
    credits: 9,
    description: 'Mountain tortoise with a rock-hard shell.',
    stats: { STR: 5, PER: 2, DEX: 1, MEM: 2, INT: 1, CHA: 1 },
    abilities: ['Shell Retraction']
  },
  'boulderback-tortoise': {
    id: 'm20',
    slug: 'boulderback-tortoise',
    name: 'Boulderback Tortoise',
    level: 6,
    rank: 'Regular',
    xpReward: 10,
    credits: 26,
    description: 'Larger with a shell that mimics larger rocks and boulders.',
    stats: { STR: 7, PER: 2, DEX: 1, MEM: 2, INT: 1, CHA: 1 },
    abilities: ['Shell Retraction', 'Camouflage']
  },
  'ironclaw-ursus': {
    id: 'm21',
    slug: 'ironclaw-ursus',
    name: 'Ironclaw Ursus',
    level: 6,
    rank: 'Regular',
    xpReward: 10,
    credits: 26,
    description: 'Gargantuan bear with chitinous plating resembling metal armor.',
    stats: { STR: 8, PER: 3, DEX: 3, MEM: 2, INT: 2, CHA: 1 },
    abilities: ['Ironclaw Swipe', 'Roaring Challenge', 'Charging Tackle']
  },
  'titanclaw-ursus': {
    id: 'm22',
    slug: 'titanclaw-ursus',
    name: 'Titanclaw Ursus',
    level: 6,
    rank: 'Champion',
    xpReward: 28,
    credits: 70,
    description: 'Even larger, with thicker armor and claws resembling steel blades.',
    stats: { STR: 12, PER: 4, DEX: 4, MEM: 3, INT: 2, CHA: 2 },
    abilities: ['Ironclaw Swipe', 'Roaring Challenge', 'Shockwave Roar']
  },
  'stoneback-grazer': {
    id: 'm23',
    slug: 'stoneback-grazer',
    name: 'Stoneback Grazer',
    level: 6,
    rank: 'Regular',
    xpReward: 10,
    credits: 26,
    description: 'Rhino-sized herbivore with a rocky exterior.',
    stats: { STR: 7, PER: 3, DEX: 2, MEM: 2, INT: 1, CHA: 1 },
    abilities: ['Rock Hard Hide']
  },
  'graniteback-grazer': {
    id: 'm24',
    slug: 'graniteback-grazer',
    name: 'Graniteback Grazer',
    level: 6,
    rank: 'Champion',
    xpReward: 28,
    credits: 70,
    description: 'Enormous with a granite-like exterior providing superior protection.',
    stats: { STR: 11, PER: 3, DEX: 2, MEM: 2, INT: 1, CHA: 1 },
    abilities: ['Granite Hide', 'Impenetrable Defense']
  },
  'frost-hawk': {
    id: 'm25',
    slug: 'frost-hawk',
    name: 'Frost Hawk',
    level: 6,
    rank: 'Regular',
    xpReward: 10,
    credits: 26,
    description: 'Large, mutated hawks with icy blue feathers and sharp, crystalline talons.',
    stats: { STR: 3, PER: 6, DEX: 7, MEM: 2, INT: 2, CHA: 1 },
    abilities: ['Chilling Screech']
  },
  'glacier-hawk': {
    id: 'm26',
    slug: 'glacier-hawk',
    name: 'Glacier Hawk',
    level: 6,
    rank: 'Champion',
    xpReward: 28,
    credits: 70,
    description: 'Larger, with the ability to create ice shards during attacks.',
    stats: { STR: 4, PER: 7, DEX: 8, MEM: 3, INT: 2, CHA: 2 },
    abilities: ['Chilling Screech', 'Ice Shard Volley']
  },

  // --- Level 7 ---
  'whisper-owl': {
    id: 'm27',
    slug: 'whisper-owl',
    name: 'Whisper Owl',
    level: 7,
    rank: 'Regular',
    xpReward: 12,
    credits: 30,
    description: 'Owl with silent flight and sharp talons.',
    stats: { STR: 3, PER: 7, DEX: 6, MEM: 3, INT: 3, CHA: 2 },
    abilities: ['Silent Flight', 'Night Vision']
  },
  'specter-owl': {
    id: 'm28',
    slug: 'specter-owl',
    name: 'Specter Owl',
    level: 7,
    rank: 'Champion',
    xpReward: 32,
    credits: 80,
    description: 'Larger with ghostly white feathers that blend with the moonlight.',
    stats: { STR: 4, PER: 9, DEX: 7, MEM: 4, INT: 4, CHA: 3 },
    abilities: ['Silent Flight', 'Night Vision', 'Disorienting Screech']
  },
  'bramblesnake': {
    id: 'm29',
    slug: 'bramblesnake',
    name: 'Bramblesnake',
    level: 7,
    rank: 'Regular',
    xpReward: 12,
    credits: 30,
    description: 'Mutated snakes with thick, bark-like scales.',
    stats: { STR: 5, PER: 4, DEX: 5, MEM: 2, INT: 1, CHA: 1 },
    abilities: ['Camouflage', 'Constriction']
  },
  'thorn-serpent': {
    id: 'm30',
    slug: 'thorn-serpent',
    name: 'Thorn Serpent',
    level: 7,
    rank: 'Champion',
    xpReward: 32,
    credits: 80,
    description: 'Larger, with poison-tipped spines along its body.',
    stats: { STR: 7, PER: 5, DEX: 6, MEM: 2, INT: 2, CHA: 1 },
    abilities: ['Camouflage', 'Constriction', 'Poison Spines']
  },

  // --- Level 8 ---
  'mountain-leapcat': {
    id: 'm31',
    slug: 'mountain-leapcat',
    name: 'Mountain Leapcat',
    level: 8,
    rank: 'Trash',
    xpReward: 5,
    credits: 12,
    description: 'Feline predator adept at leaping between rocks and cliffs.',
    stats: { STR: 4, PER: 5, DEX: 7, MEM: 2, INT: 2, CHA: 2 },
    abilities: ['Powerful Leap', 'Climb']
  },
  'storm-leapcat': {
    id: 'm32',
    slug: 'storm-leapcat',
    name: 'Storm Leapcat',
    level: 8,
    rank: 'Trash',
    xpReward: 5,
    credits: 12,
    description: 'Larger with darker fur and powerful limbs. Lightning-fast leaps.',
    stats: { STR: 5, PER: 6, DEX: 8, MEM: 2, INT: 2, CHA: 2 },
    abilities: ['Powerful Leap', 'Climb', 'Reflex Boost']
  },
  'ironback-boar': {
    id: 'm33',
    slug: 'ironback-boar',
    name: 'Ironback Boar',
    level: 8,
    rank: 'Trash',
    xpReward: 5,
    credits: 12,
    description: 'Mutated wild boars with metallic, armor-like skin.',
    stats: { STR: 6, PER: 3, DEX: 4, MEM: 2, INT: 1, CHA: 1 },
    abilities: ['Charge Attack', 'Bulletproof Hide']
  },
  'steel-tusk': {
    id: 'm34',
    slug: 'steel-tusk',
    name: 'Steel Tusk',
    level: 8,
    rank: 'Trash',
    xpReward: 5,
    credits: 12,
    description: 'Larger and more heavily armored, with a powerful ram attack.',
    stats: { STR: 8, PER: 3, DEX: 4, MEM: 2, INT: 1, CHA: 1 },
    abilities: ['Charge Attack', 'Bulletproof Hide', 'Vehicle Ram']
  },
  'clawstride-raptor': {
    id: 'm35',
    slug: 'clawstride-raptor',
    name: 'Clawstride Raptor',
    level: 8,
    rank: 'Trash',
    xpReward: 5,
    credits: 12,
    description: 'Large flightless bird with powerful hind legs. Can be trained as a mount.',
    stats: { STR: 5, PER: 6, DEX: 7, MEM: 3, INT: 2, CHA: 2 },
    abilities: ['Sprint Burst', 'Talonslash', 'Keen Senses']
  },
  'alpha-clawstride': {
    id: 'm36',
    slug: 'alpha-clawstride',
    name: 'Alpha Clawstride',
    level: 8,
    rank: 'Trash',
    xpReward: 5,
    credits: 12,
    description: 'Larger pack leader with extended sprint duration.',
    stats: { STR: 7, PER: 7, DEX: 8, MEM: 3, INT: 3, CHA: 3 },
    abilities: ['Enhanced Sprint Burst', 'Talonslash', 'Keen Senses']
  },

  // --- Level 9 ---
  'plague-bat': {
    id: 'm37',
    slug: 'plague-bat',
    name: 'Plague Bat',
    level: 9,
    rank: 'Trash',
    xpReward: 5,
    credits: 13,
    description: 'Mutated bats with sickly green fur and venomous fangs.',
    stats: { STR: 2, PER: 6, DEX: 6, MEM: 1, INT: 1, CHA: 1 },
    abilities: ['Disease Vector', 'Echolocation']
  },
  'toxic-bat': {
    id: 'm38',
    slug: 'toxic-bat',
    name: 'Toxic Bat',
    level: 9,
    rank: 'Trash',
    xpReward: 5,
    credits: 13,
    description: 'Larger, with a more potent venom that causes severe illness.',
    stats: { STR: 3, PER: 6, DEX: 7, MEM: 1, INT: 1, CHA: 1 },
    abilities: ['Toxic Venom', 'Echolocation']
  },
  'fernwing-pony': {
    id: 'm39',
    slug: 'fernwing-pony',
    name: 'Fernwing Pony',
    level: 9,
    rank: 'Trash',
    xpReward: 5,
    credits: 13,
    description: 'Horse-sized herbivore with fern-like wings. Can run then glide short distances.',
    stats: { STR: 4, PER: 4, DEX: 5, MEM: 2, INT: 2, CHA: 3 },
    abilities: ['Glide']
  },
  'glade-pegasus': {
    id: 'm40',
    slug: 'glade-pegasus',
    name: 'Glade Pegasus',
    level: 9,
    rank: 'Trash',
    xpReward: 5,
    credits: 13,
    description: 'Slightly larger with robust wings, capable of longer glides.',
    stats: { STR: 5, PER: 5, DEX: 6, MEM: 3, INT: 2, CHA: 4 },
    abilities: ['Extended Glide', 'Speed Burst']
  },

  // --- Level 10 ---
  'razorwing-falcon': {
    id: 'm41',
    slug: 'razorwing-falcon',
    name: 'Razorwing Falcon',
    level: 10,
    rank: 'Trash',
    xpReward: 6,
    credits: 15,
    description: 'Bird of prey with metallic feathers.',
    stats: { STR: 3, PER: 7, DEX: 8, MEM: 2, INT: 2, CHA: 1 },
    abilities: ['Dive Bomb', 'Slashing Wings']
  },
  'steelwing-falcon': {
    id: 'm42',
    slug: 'steelwing-falcon',
    name: 'Steelwing Falcon',
    level: 10,
    rank: 'Trash',
    xpReward: 6,
    credits: 15,
    description: 'Slightly larger with sharper, metallic feathers. Can unleash a flurry of slashing attacks.',
    stats: { STR: 4, PER: 8, DEX: 9, MEM: 2, INT: 2, CHA: 1 },
    abilities: ['Dive Bomb', 'Slashing Flurry']
  },
  'razor-elk': {
    id: 'm43',
    slug: 'razor-elk',
    name: 'Razor Elk',
    level: 10,
    rank: 'Trash',
    xpReward: 6,
    credits: 15,
    description: 'Mutated elk with razor-sharp antlers and tough, leathery hides.',
    stats: { STR: 6, PER: 4, DEX: 4, MEM: 2, INT: 2, CHA: 2 },
    abilities: ['Antler Charge', 'Tough Hide']
  },
  'blade-elk': {
    id: 'm44',
    slug: 'blade-elk',
    name: 'Blade Elk',
    level: 10,
    rank: 'Trash',
    xpReward: 6,
    credits: 15,
    description: 'Larger, with reinforced antlers capable of slicing through metal.',
    stats: { STR: 7, PER: 5, DEX: 5, MEM: 2, INT: 2, CHA: 2 },
    abilities: ['Metal Slicing Antlers', 'Tough Hide']
  },

  // --- Level 11 - 19 ---
  'shadow-lynx': {
    id: 'm45',
    slug: 'shadow-lynx',
    name: 'Shadow Lynx',
    level: 11,
    rank: 'Trash',
    xpReward: 7,
    credits: 18,
    description: 'Stealthy nocturnal predator, with a black, velvet-like fur.',
    stats: { STR: 4, PER: 7, DEX: 8, MEM: 3, INT: 3, CHA: 2 },
    abilities: ['Shadow Invisibility']
  },
  'phantom-lynx': {
    id: 'm46',
    slug: 'phantom-lynx',
    name: 'Phantom Lynx',
    level: 11,
    rank: 'Trash',
    xpReward: 7,
    credits: 18,
    description: 'Larger with a ghostly aura. Complete invisibility in darkness.',
    stats: { STR: 5, PER: 8, DEX: 9, MEM: 3, INT: 3, CHA: 2 },
    abilities: ['Total Invisibility', 'Phasing']
  },
  'mountain-ramblehorn': {
    id: 'm47',
    slug: 'mountain-ramblehorn',
    name: 'Mountain Ramblehorn',
    level: 12,
    rank: 'Trash',
    xpReward: 8,
    credits: 20,
    description: 'Large ram with spiraled, durable horns.',
    stats: { STR: 7, PER: 4, DEX: 4, MEM: 2, INT: 2, CHA: 2 },
    abilities: ['Headbutt']
  },
  'ironhorn-ramblehorn': {
    id: 'm48',
    slug: 'ironhorn-ramblehorn',
    name: 'Ironhorn Ramblehorn',
    level: 12,
    rank: 'Trash',
    xpReward: 8,
    credits: 20,
    description: 'Larger with metallic horns. Devastating charge attack.',
    stats: { STR: 9, PER: 4, DEX: 4, MEM: 2, INT: 2, CHA: 2 },
    abilities: ['Iron Charge']
  },
  'forest-serpent': {
    id: 'm49',
    slug: 'forest-serpent',
    name: 'Forest Serpent',
    level: 14,
    rank: 'Trash',
    xpReward: 11,
    credits: 27,
    description: 'Large, tree-dwelling snake with camouflaged scales.',
    stats: { STR: 7, PER: 5, DEX: 6, MEM: 2, INT: 2, CHA: 1 },
    abilities: ['Constriction', 'Venomous Bite']
  },
  'emerald-serpent': {
    id: 'm50',
    slug: 'emerald-serpent',
    name: 'Emerald Serpent',
    level: 14,
    rank: 'Trash',
    xpReward: 11,
    credits: 27,
    description: 'Slightly larger with emerald-green scales. Hypnotic gaze.',
    stats: { STR: 8, PER: 6, DEX: 7, MEM: 3, INT: 3, CHA: 4 },
    abilities: ['Constriction', 'Paralyzing Venom', 'Hypnotic Gaze']
  },
  'sky-drifter': {
    id: 'm51',
    slug: 'sky-drifter',
    name: 'Sky Drifter',
    level: 16,
    rank: 'Trash',
    xpReward: 14,
    credits: 35,
    description: 'Large, airborne creature resembling a manta ray; floats effortlessly.',
    stats: { STR: 6, PER: 6, DEX: 5, MEM: 2, INT: 2, CHA: 2 },
    abilities: ['Swoop Attack']
  },
  'tempest-drifter': {
    id: 'm52',
    slug: 'tempest-drifter',
    name: 'Tempest Drifter',
    level: 16,
    rank: 'Trash',
    xpReward: 14,
    credits: 35,
    description: 'Larger with storm cloud-like patterns. Can generate static electricity.',
    stats: { STR: 7, PER: 7, DEX: 6, MEM: 3, INT: 3, CHA: 2 },
    abilities: ['Swoop Attack', 'Lightning Bolt']
  },
  'earthbound-kraken': {
    id: 'm53',
    slug: 'earthbound-kraken',
    name: 'Earthbound Kraken',
    level: 18,
    rank: 'Trash',
    xpReward: 19,
    credits: 47,
    description: 'Tentacled creature which lurks in forest depths and mountain caves.',
    stats: { STR: 12, PER: 5, DEX: 3, MEM: 3, INT: 3, CHA: 1 },
    abilities: ['Tentacle Ambush']
  },
  'titanic-kraken': {
    id: 'm54',
    slug: 'titanic-kraken',
    name: 'Titanic Kraken',
    level: 18,
    rank: 'Trash',
    xpReward: 19,
    credits: 47,
    description: 'Much larger with rock-like skin. Can cause minor earthquakes.',
    stats: { STR: 15, PER: 5, DEX: 3, MEM: 3, INT: 3, CHA: 1 },
    abilities: ['Tentacle Ambush', 'Quake Slam', 'Regeneration']
  },

  // --- Level 20 - 32 ---
  'moonlit-harpy': {
    id: 'm55',
    slug: 'moonlit-harpy',
    name: 'Moonlit Harpy',
    level: 20,
    rank: 'Trash',
    xpReward: 25,
    credits: 62,
    description: 'Humanoid with avian features, preys under the cover of night.',
    stats: { STR: 8, PER: 8, DEX: 9, MEM: 4, INT: 4, CHA: 3 },
    abilities: ['Sonic Scream', 'Night Vision']
  },
  'lunar-harpy': {
    id: 'm56',
    slug: 'lunar-harpy',
    name: 'Lunar Harpy',
    level: 20,
    rank: 'Trash',
    xpReward: 25,
    credits: 62,
    description: 'Silver feathers reflect light. Emits a blinding flash.',
    stats: { STR: 9, PER: 9, DEX: 10, MEM: 4, INT: 4, CHA: 5 },
    abilities: ['Sonic Scream', 'Blinding Flash']
  },
  'stonehide-basilisk': {
    id: 'm57',
    slug: 'stonehide-basilisk',
    name: 'Stonehide Basilisk',
    level: 22,
    rank: 'Trash',
    xpReward: 33,
    credits: 82,
    description: 'Massive lizard with stony scales, can petrify prey with its gaze.',
    stats: { STR: 14, PER: 5, DEX: 4, MEM: 3, INT: 2, CHA: 1 },
    abilities: ['Petrifying Gaze']
  },
  'granite-basilisk': {
    id: 'm58',
    slug: 'granite-basilisk',
    name: 'Granite Basilisk',
    level: 22,
    rank: 'Trash',
    xpReward: 33,
    credits: 82,
    description: 'Larger with granite-like scales. Petrifying gaze works faster.',
    stats: { STR: 16, PER: 6, DEX: 4, MEM: 3, INT: 2, CHA: 2 },
    abilities: ['Enhanced Petrifying Gaze', 'Granite Armor']
  },
  'timberwolf-alpha': {
    id: 'm59',
    slug: 'timberwolf-alpha',
    name: 'Timberwolf Alpha',
    level: 24,
    rank: 'Trash',
    xpReward: 43,
    credits: 108,
    description: 'Exceptionally large and intelligent wolf, leader of its pack.',
    stats: { STR: 12, PER: 10, DEX: 10, MEM: 5, INT: 5, CHA: 5 },
    abilities: ['Pack Coordination', 'Enhanced Senses']
  },
  'elder-timberwolf': {
    id: 'm60',
    slug: 'elder-timberwolf',
    name: 'Elder Timberwolf',
    level: 24,
    rank: 'Trash',
    xpReward: 43,
    credits: 108,
    description: 'Silver-tipped fur and piercing eyes. Superior pack coordination.',
    stats: { STR: 14, PER: 11, DEX: 11, MEM: 6, INT: 6, CHA: 6 },
    abilities: ['Pack Coordination', 'Rallying Howl']
  },
  'thunderhoof-behemoth': {
    id: 'm61',
    slug: 'thunderhoof-behemoth',
    name: 'Thunderhoof Behemoth',
    level: 26,
    rank: 'Trash',
    xpReward: 57,
    credits: 143,
    description: 'Gigantic herbivore, four-legged with a thunderous stomp.',
    stats: { STR: 20, PER: 6, DEX: 4, MEM: 4, INT: 3, CHA: 2 },
    abilities: ['Thunder Stomp']
  },
  'stormhoof-behemoth': {
    id: 'm62',
    slug: 'stormhoof-behemoth',
    name: 'Stormhoof Behemoth',
    level: 26,
    rank: 'Trash',
    xpReward: 57,
    credits: 143,
    description: 'Storm-like patterns on skin. Can create thunderous shockwaves.',
    stats: { STR: 22, PER: 6, DEX: 4, MEM: 4, INT: 3, CHA: 2 },
    abilities: ['Thunder Stomp', 'Shockwave']
  },
  'nighthawk-gryphon': {
    id: 'm63',
    slug: 'nighthawk-gryphon',
    name: 'Nighthawk Gryphon',
    level: 28,
    rank: 'Trash',
    xpReward: 76,
    credits: 189,
    description: 'Fusion of a large cat and a hawk; hunts during the night.',
    stats: { STR: 15, PER: 12, DEX: 14, MEM: 5, INT: 5, CHA: 4 },
    abilities: ['Silent Flight', 'Rending Claws']
  },
  'spectral-gryphon': {
    id: 'm64',
    slug: 'spectral-gryphon',
    name: 'Spectral Gryphon',
    level: 28,
    rank: 'Trash',
    xpReward: 76,
    credits: 189,
    description: 'Ethereal, glowing feathers. Can phase through objects.',
    stats: { STR: 16, PER: 13, DEX: 15, MEM: 6, INT: 6, CHA: 5 },
    abilities: ['Silent Flight', 'Phasing', 'Fear Screech']
  },
  'whispering-wraith': {
    id: 'm65',
    slug: 'whispering-wraith',
    name: 'Whispering Wraith',
    level: 30,
    rank: 'Trash',
    xpReward: 100,
    credits: 250,
    description: 'Ghostly, almost ethereal mammalian predator; rarely seen, often heard.',
    stats: { STR: 10, PER: 15, DEX: 18, MEM: 8, INT: 8, CHA: 7 },
    abilities: ['Invisibility', 'Fear Whisper']
  },
  'silent-wraith': {
    id: 'm66',
    slug: 'silent-wraith',
    name: 'Silent Wraith',
    level: 30,
    rank: 'Trash',
    xpReward: 100,
    credits: 250,
    description: 'More ghostly and translucent. Complete invisibility.',
    stats: { STR: 12, PER: 16, DEX: 20, MEM: 9, INT: 9, CHA: 8 },
    abilities: ['Total Invisibility', 'Paralyzing Fear']
  },
  'siegebringer-titan': {
    id: 'm67',
    slug: 'siegebringer-titan',
    name: 'Siegebringer Titan',
    level: 32,
    rank: 'Trash',
    xpReward: 132,
    credits: 331,
    description: 'Colossal beast that attacks towns. Armor-like hide.',
    stats: { STR: 30, PER: 8, DEX: 5, MEM: 6, INT: 5, CHA: 6 },
    abilities: ['Rallying Roar', 'Siege Armor']
  },
  'fortress-titan': {
    id: 'm68',
    slug: 'fortress-titan',
    name: 'Fortress Titan',
    level: 32,
    rank: 'Trash',
    xpReward: 132,
    credits: 331,
    description: 'Fortress-like armor plating. Can summon creatures and cause minor earthquakes.',
    stats: { STR: 35, PER: 8, DEX: 5, MEM: 7, INT: 6, CHA: 7 },
    abilities: ['Rallying Roar', 'Earthquake', 'Summon Minions']
  },

  // --- Mars / High Level Exotics (33 - 42) ---
  'dustdevil-skimmer': {
    id: 'm69',
    slug: 'dustdevil-skimmer',
    name: 'Dustdevil Skimmer',
    level: 33,
    rank: 'Trash',
    xpReward: 152,
    credits: 381,
    description: 'Winged creatures that glide on the thin atmosphere, using Mars\' dust storms to lift themselves.',
    stats: { STR: 10, PER: 12, DEX: 18, MEM: 4, INT: 3, CHA: 2 },
    abilities: ['Wind Glide', 'Dust Camouflage']
  },
  'crimson-crawler': {
    id: 'm70',
    slug: 'crimson-crawler',
    name: 'Crimson Crawler',
    level: 34,
    rank: 'Trash',
    xpReward: 175,
    credits: 438,
    description: 'Large centipede-like creatures that burrow into Mars\' regolith. Their red exoskeletons blend seamlessly with the Martian soil.',
    stats: { STR: 18, PER: 8, DEX: 12, MEM: 4, INT: 2, CHA: 1 },
    abilities: ['Burrow', 'Pincer Grip']
  },
  'martian-ridgeback': {
    id: 'm71',
    slug: 'martian-ridgeback',
    name: 'Martian Ridgeback',
    level: 35,
    rank: 'Trash',
    xpReward: 201,
    credits: 503,
    description: 'Quadrupeds with a dorsal ridge that harvests solar energy. They hunt in packs across the plains.',
    stats: { STR: 20, PER: 14, DEX: 15, MEM: 6, INT: 5, CHA: 4 },
    abilities: ['Solar Charge', 'Pack Howl']
  },
  'hematite-hopper': {
    id: 'm72',
    slug: 'hematite-hopper',
    name: 'Hematite Hopper',
    level: 36,
    rank: 'Trash',
    xpReward: 232,
    credits: 579,
    description: 'Massive, cricket-like creatures that use their powerful legs to hop across the vast Martian dunes.',
    stats: { STR: 22, PER: 10, DEX: 20, MEM: 4, INT: 2, CHA: 1 },
    abilities: ['High Jump', 'Kick']
  },
  'polar-ice-drifter': {
    id: 'm73',
    slug: 'polar-ice-drifter',
    name: 'Polar Ice Drifter',
    level: 37,
    rank: 'Trash',
    xpReward: 266,
    credits: 666,
    description: 'Jellyfish-like creatures that float above the polar ice caps, feeding on microscopic airborne organisms.',
    stats: { STR: 15, PER: 15, DEX: 10, MEM: 5, INT: 3, CHA: 2 },
    abilities: ['Freezing Touch', 'Levitate']
  },
  'valles-marineris-serpent': {
    id: 'm74',
    slug: 'valles-marineris-serpent',
    name: 'Valles Marineris Serpent',
    level: 38,
    rank: 'Trash',
    xpReward: 306,
    credits: 766,
    description: 'Gigantic serpents that dwell in the deep canyons of Valles Marineris, ambushing anything that ventures too close.',
    stats: { STR: 35, PER: 12, DEX: 14, MEM: 6, INT: 4, CHA: 3 },
    abilities: ['Canyon Ambush', 'Constrict']
  },
  'olympus-scavenger': {
    id: 'm75',
    slug: 'olympus-scavenger',
    name: 'Olympus Scavenger',
    level: 39,
    rank: 'Trash',
    xpReward: 352,
    credits: 881,
    description: 'Vulture-like flyers that circle the heights of Olympus Mons, scavenging remnants left by other creatures.',
    stats: { STR: 18, PER: 18, DEX: 22, MEM: 7, INT: 5, CHA: 2 },
    abilities: ['Swoop', 'Rending Beak']
  },
  'ironclad-behemoth': {
    id: 'm76',
    slug: 'ironclad-behemoth',
    name: 'Ironclad Behemoth',
    level: 40,
    rank: 'Champion',
    xpReward: 3241,
    credits: 8102,
    description: 'Massive creatures resembling rhinos, with a metallic exoskeleton. They graze on metal-rich rocks.',
    stats: { STR: 50, PER: 10, DEX: 8, MEM: 6, INT: 4, CHA: 2 },
    abilities: ['Metal Skin', 'Trample']
  },
  'solar-sail-kraken': {
    id: 'm77',
    slug: 'solar-sail-kraken',
    name: 'Solar Sail Kraken',
    level: 41,
    rank: 'Champion',
    xpReward: 3727,
    credits: 9317,
    description: 'Giant, octopus-like creatures that spread thin membranes to catch solar rays, propelling them through the thin atmosphere.',
    stats: { STR: 45, PER: 15, DEX: 15, MEM: 8, INT: 6, CHA: 4 },
    abilities: ['Solar Ray', 'Tentacle Crush']
  },
  'meteorite-mantis': {
    id: 'm78',
    slug: 'meteorite-mantis',
    name: 'Meteorite Mantis',
    level: 42,
    rank: 'Champion',
    xpReward: 4286,
    credits: 10715,
    description: 'Insectoids with razor-sharp claws, they ambush prey from beneath the surface, using meteorite impacts as cover.',
    stats: { STR: 48, PER: 18, DEX: 25, MEM: 8, INT: 5, CHA: 2 },
    abilities: ['Seismic Sense', 'Razor Claws', 'Ambush']
  },

  // --- Vexillari Swarm (Level 64-78) ---
  'vexillari-swarmer': {
    id: 'm79',
    slug: 'vexillari-swarmer',
    name: 'Vexillari Swarmer',
    level: 64,
    rank: 'Trash',
    xpReward: 9277,
    credits: 23191,
    description: 'Smaller (4-5 ft) units with lightweight exoskeletons and blade-like forelimbs.',
    stats: { STR: 40, PER: 30, DEX: 50, MEM: 10, INT: 15, CHA: 5 },
    abilities: ['Swarm Tactics', 'Pheromone Assault']
  },
  'vexillari-ravager': {
    id: 'm80',
    slug: 'vexillari-ravager',
    name: 'Vexillari Ravager',
    level: 64,
    rank: 'Regular',
    xpReward: 23191,
    credits: 57978,
    description: 'Large (8 ft) and heavily armored with bladed forearms and reinforced mandibles. Wields a plasma-cutting claw.',
    stats: { STR: 60, PER: 35, DEX: 45, MEM: 15, INT: 15, CHA: 5 },
    abilities: ['Rage State', 'Shockwave Leap']
  },
  'vexillari-drone': {
    id: 'm81',
    slug: 'vexillari-drone',
    name: 'Vexillari Drone',
    level: 64,
    rank: 'Regular',
    xpReward: 23191,
    credits: 57978,
    description: 'Small (3-4 ft) units with compact bodies, multi-spectrum optics, and low-profile energy weapons.',
    stats: { STR: 30, PER: 60, DEX: 55, MEM: 20, INT: 20, CHA: 5 },
    abilities: ['Multi-Spectrum Scanners', 'Energy Disruptor']
  },
  'vexillari-burrower': {
    id: 'm82',
    slug: 'vexillari-burrower',
    name: 'Vexillari Burrower',
    level: 66,
    rank: 'Trash',
    xpReward: 12268,
    credits: 30671,
    description: 'Massive (10 ft) centipede-like insectoid with serrated digging claws.',
    stats: { STR: 65, PER: 40, DEX: 40, MEM: 15, INT: 18, CHA: 5 },
    abilities: ['Tectonic Disruption', 'Ambush Attack']
  },
  'vexillari-stalker': {
    id: 'm83',
    slug: 'vexillari-stalker',
    name: 'Vexillari Stalker',
    level: 66,
    rank: 'Regular',
    xpReward: 30671,
    credits: 76676,
    description: 'Slender (6-7 ft) with camouflaged carapaces. Uses energy sniper rifles and retractable melee spikes.',
    stats: { STR: 45, PER: 70, DEX: 65, MEM: 25, INT: 25, CHA: 5 },
    abilities: ['Adaptive Camouflage', 'Energy Lance']
  },
  'nullmaw': {
    id: 'm84',
    slug: 'nullmaw',
    name: 'Nullmaw',
    level: 66,
    rank: 'Champion',
    xpReward: 92012,
    credits: 230029,
    description: 'Vacuum-adapted predator. Metabolizes ambient radiation and energy fields. Can withstand zero atmosphere.',
    stats: { STR: 90, PER: 50, DEX: 50, MEM: 30, INT: 30, CHA: 10 },
    abilities: ['Radiation Absorption', 'Energy Void']
  },
  'vexillari-flyer': {
    id: 'm85',
    slug: 'vexillari-flyer',
    name: 'Vexillari Flyer',
    level: 67,
    rank: 'Regular',
    xpReward: 35271,
    credits: 88178,
    description: 'Winged units with lightweight frames, energy projectiles and razor-tipped wings.',
    stats: { STR: 45, PER: 60, DEX: 80, MEM: 20, INT: 20, CHA: 5 },
    abilities: ['Aerial Supremacy', 'Sonic Screech']
  },
  'vexillari-titan': {
    id: 'm86',
    slug: 'vexillari-titan',
    name: 'Vexillari Titan',
    level: 70,
    rank: 'Regular',
    xpReward: 53643,
    credits: 134108,
    description: 'Towering (12 ft) tank-like units with massive carapaces. Uses heavy plasma cannons.',
    stats: { STR: 100, PER: 40, DEX: 30, MEM: 25, INT: 20, CHA: 10 },
    abilities: ['Impenetrable Shield', 'Plasma Barrage']
  },
  'vexillari-transport': {
    id: 'm87',
    slug: 'vexillari-transport',
    name: 'Vexillari Transport',
    level: 70,
    rank: 'Regular',
    xpReward: 53643,
    credits: 134108,
    description: 'Quadrupedal (20 ft long) units. Functions as troop transport and mobile energy turret platform.',
    stats: { STR: 110, PER: 35, DEX: 25, MEM: 20, INT: 15, CHA: 5 },
    abilities: ['Troop Deployment', 'Energy Barrier']
  },
  'vexillari-hive-warden': {
    id: 'm88',
    slug: 'vexillari-hive-warden',
    name: 'Vexillari Hive Warden',
    level: 70,
    rank: 'Regular',
    xpReward: 53643,
    credits: 134108,
    description: 'Massive (12 ft) heavily armored leader unit with reinforced energy shields.',
    stats: { STR: 95, PER: 50, DEX: 40, MEM: 40, INT: 45, CHA: 30 },
    abilities: ['Hive Command', 'Energy Pulse']
  },

  // --- Vexillari Airforce (Expanded) ---
  'vexillari-skyflayer': {
    id: 'm89',
    slug: 'vexillari-skyflayer',
    name: 'Vexillari Skyflayer',
    level: 64,
    rank: 'Regular',
    xpReward: 23191,
    credits: 57978,
    description: 'Razor-winged assault flier with sonic shriek abilities, designed for harassment and bleed tactics.',
    stats: { STR: 45, PER: 55, DEX: 75, MEM: 15, INT: 15, CHA: 5 },
    abilities: ['Sonic Shriek', 'Bleed Dive']
  },
  'vexillari-sporecaster': {
    id: 'm90',
    slug: 'vexillari-sporecaster',
    name: 'Vexillari Sporecaster',
    level: 66,
    rank: 'Regular',
    xpReward: 30671,
    credits: 76676,
    description: 'Bloated insect that disperses corrosive spores mid-air to dissuade tailing aircraft or infantry.',
    stats: { STR: 55, PER: 50, DEX: 50, MEM: 15, INT: 15, CHA: 5 },
    abilities: ['Corrosive Spores']
  },
  'vexillari-needlewing': {
    id: 'm91',
    slug: 'vexillari-needlewing',
    name: 'Vexillari Needlewing',
    level: 68,
    rank: 'Regular',
    xpReward: 40562,
    credits: 101405,
    description: 'Slim, high-altitude hunter that fires hardened bio-spikes at hypersonic speeds.',
    stats: { STR: 40, PER: 80, DEX: 85, MEM: 25, INT: 20, CHA: 5 },
    abilities: ['Hypersonic Bio-Spike']
  },
  'vexillari-bombardier': {
    id: 'm92',
    slug: 'vexillari-bombardier',
    name: 'Vexillari Bombardier',
    level: 70,
    rank: 'Regular',
    xpReward: 53643,
    credits: 134108,
    description: 'Heavily armored aerial creature that drops volatile bio-acid sacs on targets below.',
    stats: { STR: 80, PER: 50, DEX: 50, MEM: 20, INT: 20, CHA: 5 },
    abilities: ['Bio-Acid Bombardment']
  },
  'vexillari-cloudreaver': {
    id: 'm93',
    slug: 'vexillari-cloudreaver',
    name: 'Vexillari Cloudreaver',
    level: 72,
    rank: 'Regular',
    xpReward: 70943,
    credits: 177357,
    description: 'Large aerial unit that generates atmospheric interference to blind radar and jam targeting.',
    stats: { STR: 70, PER: 60, DEX: 60, MEM: 35, INT: 30, CHA: 10 },
    abilities: ['Radar Jamming', 'Atmospheric Interference']
  },
  'vexillari-hivehowler': {
    id: 'm94',
    slug: 'vexillari-hivehowler',
    name: 'Vexillari Hivehowler',
    level: 74,
    rank: 'Regular',
    xpReward: 93822,
    credits: 234555,
    description: 'Emits devastating subsonic pulses mid-flight to disrupt enemy coordination and tech systems.',
    stats: { STR: 85, PER: 65, DEX: 65, MEM: 40, INT: 35, CHA: 15 },
    abilities: ['Subsonic Pulse', 'Tech Disruption']
  },
  'vexillari-stratoskulk': {
    id: 'm95',
    slug: 'vexillari-stratoskulk',
    name: 'Vexillari Stratoskulk',
    level: 76,
    rank: 'Regular',
    xpReward: 124080,
    credits: 310199,
    description: 'Silent, long-range stealth flier with cloaking skin and assassinating toxin barbs.',
    stats: { STR: 60, PER: 90, DEX: 90, MEM: 50, INT: 40, CHA: 10 },
    abilities: ['Cloak', 'Toxin Barbs']
  },
  'vexillari-skytitan': {
    id: 'm96',
    slug: 'vexillari-skytitan',
    name: 'Vexillari Skytitan',
    level: 78,
    rank: 'Regular',
    xpReward: 164095,
    credits: 410238,
    description: 'Massive biomechanical behemoth, acts as air-hive relay, carries swarmer pods in abdominal cargo.',
    stats: { STR: 120, PER: 60, DEX: 40, MEM: 60, INT: 60, CHA: 40 },
    abilities: ['Swarmer Pod Deployment', 'Hive Relay']
  },

  // --- Varnathi (Sentient NPCs) ---
  'varnathi-skirmisher': {
    id: 'm97',
    slug: 'varnathi-skirmisher',
    name: 'Varnathi Skirmisher',
    level: 64,
    rank: 'Regular',
    xpReward: 23191,
    credits: 57978,
    description: 'Sleek, humanoid (5ft) with fur-covered, sinewy frames. Wields compact plasma pistols and traps.',
    stats: { STR: 40, PER: 55, DEX: 65, MEM: 45, INT: 50, CHA: 30 },
    abilities: ['Hit and Run', 'Trap Deployment']
  },
  'varnathi-sharpshooter': {
    id: 'm98',
    slug: 'varnathi-sharpshooter',
    name: 'Varnathi Sharpshooter',
    level: 64,
    rank: 'Regular',
    xpReward: 23191,
    credits: 57978,
    description: 'Tall and slender with augmented vision gear and a plasma sniper rifle.',
    stats: { STR: 40, PER: 75, DEX: 60, MEM: 50, INT: 55, CHA: 30 },
    abilities: ['Sniper Shot', 'Augmented Vision']
  },
  'varnathi-scout-drone': {
    id: 'm99',
    slug: 'varnathi-scout-drone',
    name: 'Varnathi Scout Drone',
    level: 64,
    rank: 'Regular',
    xpReward: 23191,
    credits: 57978,
    description: 'Small (2-3 ft) AI-driven flying unit with stealth capabilities and a plasma stinger.',
    stats: { STR: 20, PER: 65, DEX: 70, MEM: 40, INT: 40, CHA: 0 },
    abilities: ['Stealth Cloak', 'Plasma Stinger']
  },
  'varnathi-vanguard': {
    id: 'm100',
    slug: 'varnathi-vanguard',
    name: 'Varnathi Vanguard',
    level: 64,
    rank: 'Regular',
    xpReward: 23191,
    credits: 57978,
    description: 'Heavily muscled (7-8 ft) with reinforced battle armor and a large plasma cannon.',
    stats: { STR: 70, PER: 45, DEX: 40, MEM: 45, INT: 50, CHA: 40 },
    abilities: ['Plasma Cannon', 'Energy Shield']
  },
  'varnathi-sapper': {
    id: 'm101',
    slug: 'varnathi-sapper',
    name: 'Varnathi Sapper',
    level: 68,
    rank: 'Regular',
    xpReward: 40562,
    credits: 101405,
    description: 'Small and wiry, equipped with plasma charges and hacking tools. Specialized in destroying vehicles.',
    stats: { STR: 40, PER: 60, DEX: 65, MEM: 70, INT: 75, CHA: 35 },
    abilities: ['Plasma Charge', 'Sabotage']
  },
  'varnathi-mech-trooper': {
    id: 'm102',
    slug: 'varnathi-mech-trooper',
    name: 'Varnathi Mech Trooper',
    level: 70,
    rank: 'Regular',
    xpReward: 53643,
    credits: 134108,
    description: 'Varnathi pilot within a 12-ft bipedal battle mech armed with rotary plasma cannons.',
    stats: { STR: 90, PER: 55, DEX: 45, MEM: 55, INT: 60, CHA: 30 },
    abilities: ['Rotary Plasma Cannon', 'Missile Barrage']
  },
  'varnathi-commander': {
    id: 'm103',
    slug: 'varnathi-commander',
    name: 'Varnathi Commander',
    level: 70,
    rank: 'Regular',
    xpReward: 53643,
    credits: 134108,
    description: 'Charismatic and imposing leader equipped with advanced plasma rifles and tactical gear.',
    stats: { STR: 65, PER: 65, DEX: 60, MEM: 70, INT: 80, CHA: 80 },
    abilities: ['Tactical Command', 'Plasma Volley']
  },
  'varnathi-light-tank': {
    id: 'm104',
    slug: 'varnathi-light-tank',
    name: 'Varnathi Light Tank',
    level: 72,
    rank: 'Regular',
    xpReward: 70943,
    credits: 177357,
    description: 'A small, fast hover tank with twin plasma turrets and advanced targeting systems.',
    stats: { STR: 90, PER: 60, DEX: 70, MEM: 40, INT: 40, CHA: 0 },
    abilities: ['Twin Plasma Turrets', 'Hover Strafe']
  },
  'varnathi-heavy-tank': {
    id: 'm105',
    slug: 'varnathi-heavy-tank',
    name: 'Varnathi Heavy Tank',
    level: 76,
    rank: 'Regular',
    xpReward: 124080,
    credits: 310199,
    description: 'Massive hover tank (30 ft long) with thick armor and a plasma cannon turret.',
    stats: { STR: 130, PER: 55, DEX: 30, MEM: 50, INT: 50, CHA: 0 },
    abilities: ['Heavy Plasma Cannon', 'Mobile Bunker']
  },

  // --- Misc High Level ---
  'sporefang': {
    id: 'm106',
    slug: 'sporefang',
    name: 'Sporefang',
    level: 72,
    rank: 'Regular',
    xpReward: 70943,
    credits: 177357,
    description: 'A predatory beast whose bite infects victims with rapid-growth fungal spores.',
    stats: { STR: 75, PER: 60, DEX: 65, MEM: 30, INT: 25, CHA: 10 },
    abilities: ['Fungal Infection', 'Rending Bite']
  },
  'cliff-borer': {
    id: 'm107',
    slug: 'cliff-borer',
    name: 'Cliff Borer',
    level: 73,
    rank: 'Regular',
    xpReward: 81584,
    credits: 203961,
    description: 'A segmented worm-like creature capable of tunneling through solid rock faces to ambush climbers.',
    stats: { STR: 85, PER: 40, DEX: 45, MEM: 20, INT: 20, CHA: 5 },
    abilities: ['Rock Tunneling', 'Surprise Breach']
  }
};


// Lookup by numeric ID
export const MONSTERS_BY_ID: Record<string, ExportedMonster> = Object.fromEntries(
  Object.values(DB_MONSTERS).map(m => [m.id, m])
);

// Get all monsters as array
export const getAllMonsters = (): ExportedMonster[] => Object.values(DB_MONSTERS);

// Get monster by slug
export const getMonsterBySlug = (slug: string): ExportedMonster | undefined => DB_MONSTERS[slug];

// Get monster by ID  
export const getMonsterById = (id: string): ExportedMonster | undefined => MONSTERS_BY_ID[id];
