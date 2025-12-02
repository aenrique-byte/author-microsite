
import { CharacterClass, ClassName, Attribute } from './types';
import { register, generateLinearTiers, ABILITY_LIGHT_ARMOR } from './ability-constants';

export const RECRUIT_CLASS: CharacterClass = {
  name: ClassName.RECRUIT,
  description: 'The starting point for all adventurers. Balanced potential.',
  startingItem: 'Standard Issue Kinetic Pistol',
  primaryAttribute: Attribute.STR,
  secondaryAttribute: Attribute.DEX,
  abilities: [
    register({
      id: 'ranged_weapons',
      name: 'Ranged Weapons Familiarity',
      description: 'Basic competence with firearms.',
      maxLevel: 5,
      tiers: generateLinearTiers(5, 5, 5, '%', 'Damage')
    })
  ],
  upgrades: [
    ClassName.RANGER,
    ClassName.HUNTER,
    ClassName.BRAWLER,
    ClassName.SCOUT,
    ClassName.DEFENDER,
    ClassName.TECHNICIAN,
    ClassName.MINUTEMAN,
    ClassName.MARAUDER,
    ClassName.FIELD_MEDIC
  ]
};

export const ADVANCED_CLASSES: Record<string, CharacterClass> = {
  // --- TIER 2 CLASSES ---
  [ClassName.RANGER]: {
    name: ClassName.RANGER,
    description: 'Masters of long-range engagement and survival.',
    startingItem: 'Energy Pulse Carbine',
    primaryAttribute: Attribute.PER,
    secondaryAttribute: Attribute.DEX,
    abilities: [
      register({ id: 'eagle_eye', name: 'Eagle Eye', description: 'Increases effective range.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 10, 'm', 'Effect') }),
      register({ id: 'survivalist', name: 'Survivalist', description: 'Bonus to foraging.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 5, '%', 'Effect') }),
      register({ id: 'focus_fire', name: 'Focus Fire', description: 'Consecutive hits dmg.', maxLevel: 10, tiers: generateLinearTiers(10, 2, 2, '%', 'Damage') }),
      register({ id: 'camouflage', name: 'Camouflage', description: 'Blend into nature.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, 's', 'Effect') }),
      register({ id: 'trap_setting', name: 'Trap Setting', description: 'Create energy snares.', maxLevel: 10, tiers: generateLinearTiers(10, 50, 50, 'dmg', 'Damage') }),
    ],
    upgrades: [] // Ready for Tier 3 additions
  },
  [ClassName.HUNTER]: {
    name: ClassName.HUNTER,
    description: 'Patient stalkers who eliminate high-value targets.',
    startingItem: 'Energy Sniper Rifle',
    primaryAttribute: Attribute.PER,
    secondaryAttribute: Attribute.DEX,
    abilities: [
      register({ id: 'headshot', name: 'Headshot', description: 'Crit damage bonus.', maxLevel: 10, tiers: generateLinearTiers(10, 20, 10, '%', 'Damage') }),
      register({ id: 'stalking', name: 'Stalking', description: 'Move silently.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, '%', 'Effect') }),
      register({ id: 'mark_target', name: 'Mark Target', description: 'Debuff evasion.', maxLevel: 10, tiers: generateLinearTiers(10, -5, -2, '%', 'Effect') }),
      register({ id: 'patience', name: 'Patience', description: 'Wait dmg bonus.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 5, '%', 'Damage') }),
      register({ id: 'decoy', name: 'Decoy', description: 'Holo lure.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, 's', 'Effect') }),
    ],
    upgrades: [ClassName.DEADEYE, ClassName.BLADE_MASTER]
  },
  [ClassName.BRAWLER]: {
    name: ClassName.BRAWLER,
    description: 'Close-quarters combatants relying on brute force.',
    startingItem: 'Energy Mace',
    primaryAttribute: Attribute.STR,
    secondaryAttribute: Attribute.CHA,
    abilities: [
      register({ id: 'power_strike', name: 'Power Strike', description: 'High damage melee.', maxLevel: 10, tiers: generateLinearTiers(10, 150, 10, '%', 'Damage') }),
      register({ id: 'adrenaline', name: 'Adrenaline Rush', description: 'Temp HP.', maxLevel: 10, tiers: generateLinearTiers(10, 20, 10, 'HP', 'Heal') }),
      register({ id: 'grapple', name: 'Grapple', description: 'Immobilize.', maxLevel: 10, tiers: generateLinearTiers(10, 2, 1, 's', 'Effect') }),
      register({ id: 'intimidate', name: 'Intimidate', description: 'Lower morale.', maxLevel: 10, tiers: generateLinearTiers(10, -5, -2, 'ATK', 'Effect') }),
      register({ id: 'thick_skin', name: 'Thick Skin', description: 'Physical resist.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 2, '%', 'Effect') }),
    ],
    upgrades: [ClassName.CRUSHER]
  },
  [ClassName.SCOUT]: {
    name: ClassName.SCOUT,
    description: 'Agile reconnaissance units.',
    startingItem: 'Energy Dagger',
    primaryAttribute: Attribute.PER,
    secondaryAttribute: Attribute.DEX,
    abilities: [
      register({ id: 'dash', name: 'Dash', description: 'Extra movement.', maxLevel: 10, tiers: generateLinearTiers(10, 2, 1, 'm', 'Effect') }),
      register({ id: 'radar_pulse', name: 'Radar Pulse', description: 'Detect enemies.', maxLevel: 10, tiers: generateLinearTiers(10, 20, 10, 'm', 'Effect') }),
      register({ id: 'backstab', name: 'Backstab', description: 'Rear damage.', maxLevel: 10, tiers: generateLinearTiers(10, 50, 10, '%', 'Damage') }),
      ABILITY_LIGHT_ARMOR, 
      register({ id: 'light_step', name: 'Light Step', description: 'Trap avoidance.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, '%', 'Effect') }),
    ],
    upgrades: [ClassName.ASSASSIN, ClassName.OPERATIVE]
  },
  [ClassName.DEFENDER]: {
    name: ClassName.DEFENDER,
    description: 'Protectors who hold the line.',
    startingItem: 'Deployable Energy Shield',
    primaryAttribute: Attribute.STR,
    secondaryAttribute: Attribute.MEM,
    abilities: [
      register({ id: 'energy_wall', name: 'Energy Wall', description: 'Stationary cover.', maxLevel: 10, tiers: generateLinearTiers(10, 100, 50, 'HP', 'Effect') }),
      register({ id: 'taunt', name: 'Taunt', description: 'Force attack.', maxLevel: 10, tiers: generateLinearTiers(10, 3, 1, 's', 'Effect') }),
      register({ id: 'armor_up', name: 'Armor Up', description: 'Mitigation.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 2, '%', 'Effect') }),
      register({ id: 'intervene', name: 'Intervene', description: 'Take damage.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 5, 'm', 'Effect') }),
      register({ id: 'shield_bash', name: 'Shield Bash', description: 'Stun.', maxLevel: 10, tiers: generateLinearTiers(10, 1, 0.5, 's', 'Effect') }),
    ],
    upgrades: []
  },
  [ClassName.TECHNICIAN]: {
    name: ClassName.TECHNICIAN,
    description: 'Masters of machines and automated warfare.',
    startingItem: 'Deployable Energy Turret',
    primaryAttribute: Attribute.INT,
    secondaryAttribute: Attribute.MEM,
    abilities: [
      register({ id: 'turret_mastery', name: 'Turret Mastery', description: 'Upgrade stats.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, '%', 'Effect') }),
      register({ id: 'repair', name: 'Repair', description: 'Heal mechs.', maxLevel: 10, tiers: generateLinearTiers(10, 20, 10, 'HP', 'Heal') }),
      register({ id: 'overclock', name: 'Overclock', description: 'Tech speed.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, '%', 'Effect') }),
      register({ id: 'hack', name: 'Hack', description: 'Control tech.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 2, 's', 'Effect') }),
      register({ id: 'drone_swarm', name: 'Drone Swarm', description: 'Mini-drones.', maxLevel: 10, tiers: generateLinearTiers(10, 1, 1, 'drone', 'Effect') }),
    ],
    upgrades: [ClassName.COMBAT_ENGINEER, ClassName.DEMOLITIONS_EXPERT]
  },
  [ClassName.MINUTEMAN]: {
    name: ClassName.MINUTEMAN,
    description: 'Versatile soldiers ready for anything.',
    startingItem: 'Energy Musket',
    primaryAttribute: Attribute.CHA,
    secondaryAttribute: Attribute.STR,
    abilities: [
      register({ id: 'rally', name: 'Rally', description: 'Buff allies.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 2, '%', 'Effect') }),
      register({ id: 'bayonet_charge', name: 'Bayonet Charge', description: 'Gap closer.', maxLevel: 10, tiers: generateLinearTiers(10, 120, 10, '%', 'Damage') }),
      register({ id: 'fortify', name: 'Fortify', description: 'Create cover.', maxLevel: 10, tiers: generateLinearTiers(10, 50, 20, 'HP', 'Effect') }),
      register({ id: 'suppressive_fire', name: 'Suppressive Fire', description: 'Lower accuracy.', maxLevel: 10, tiers: generateLinearTiers(10, -10, -2, '%', 'Effect') }),
      register({ id: 'quick_reload', name: 'Quick Reload', description: 'Reduce AP cost.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 5, '%', 'Effect') }),
    ],
    upgrades: []
  },
  [ClassName.MARAUDER]: {
    name: ClassName.MARAUDER,
    description: 'Chaos sowers who thrive in the thick of battle.',
    startingItem: 'Energy Waraxe',
    primaryAttribute: Attribute.STR,
    secondaryAttribute: Attribute.DEX,
    abilities: [
      register({ id: 'whirlwind', name: 'Whirlwind', description: 'AOE attack.', maxLevel: 10, tiers: generateLinearTiers(10, 80, 5, '%', 'Damage') }),
      register({ id: 'bloodlust', name: 'Bloodlust', description: 'Heal on kill.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, 'HP', 'Heal') }),
      register({ id: 'sunder', name: 'Sunder', description: 'Destroy armor.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 2, '%', 'Effect') }),
      register({ id: 'roar', name: 'Roar', description: 'Stun nearby.', maxLevel: 10, tiers: generateLinearTiers(10, 1, 0.2, 's', 'Effect') }),
      register({ id: 'reckless_swing', name: 'Reckless Swing', description: 'High dmg/self dmg.', maxLevel: 10, tiers: generateLinearTiers(10, 200, 20, '%', 'Damage') }),
    ],
    upgrades: [ClassName.SUPPRESSOR, ClassName.JUGGERNAUT]
  },
  [ClassName.FIELD_MEDIC]: {
    name: ClassName.FIELD_MEDIC,
    description: 'Support specialists who keep the team alive.',
    startingItem: 'Medical Scanner',
    primaryAttribute: Attribute.INT,
    secondaryAttribute: Attribute.MEM,
    abilities: [
      register({ id: 'heal_beam', name: 'Heal Beam', description: 'Restore HP.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, 'HP/s', 'Heal') }),
      register({ id: 'revive', name: 'Revive', description: 'Bring back ally.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, '% HP', 'Heal') }),
      register({ id: 'stim_pack', name: 'Stim Pack', description: 'Buff Stats.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 2, '%', 'Effect') }),
      register({ id: 'cleanse', name: 'Cleanse', description: 'Remove effects.', maxLevel: 10, tiers: generateLinearTiers(10, 1, 1, 'effect', 'Effect') }),
      register({ id: 'anatomy_study', name: 'Anatomy Study', description: 'Weak points.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 2, '%', 'Effect') }),
    ],
    upgrades: [ClassName.COMBAT_MEDIC, ClassName.BIO_ENGINEER]
  },

  // --- TIER 3 CLASSES ---

  [ClassName.ASSASSIN]: {
    name: ClassName.ASSASSIN,
    description: 'Lethal executioners specializing in single-target elimination.',
    startingItem: 'Mono-filament Wire',
    primaryAttribute: Attribute.DEX,
    secondaryAttribute: Attribute.PER,
    abilities: [
      register({ id: 'execute', name: 'Execute', description: 'Huge dmg on low HP.', maxLevel: 10, tiers: generateLinearTiers(10, 300, 50, '%', 'Damage') }),
      register({ id: 'shadow_step', name: 'Shadow Step', description: 'Teleport behind target.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, 'm', 'Effect') }),
      register({ id: 'poison_blade', name: 'Poison Blade', description: 'DoT damage.', maxLevel: 10, tiers: generateLinearTiers(10, 20, 10, 'dmg/s', 'Damage') })
    ],
    upgrades: []
  },
  [ClassName.OPERATIVE]: {
    name: ClassName.OPERATIVE,
    description: 'High-tech spies utilizing gadgets and subterfuge.',
    startingItem: 'Stealth Suit Mk IV',
    primaryAttribute: Attribute.INT,
    secondaryAttribute: Attribute.DEX,
    abilities: [
      register({ id: 'emp_blast', name: 'EMP Blast', description: 'Disable tech.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, 'm', 'Effect') }),
      register({ id: 'sensor_jam', name: 'Sensor Jam', description: 'Blind enemies.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 2, 's', 'Effect') }),
      register({ id: 'hologram', name: 'Hologram', description: 'Create clone.', maxLevel: 10, tiers: generateLinearTiers(10, 30, 10, 's', 'Effect') })
    ],
    upgrades: []
  },
  [ClassName.DEADEYE]: {
    name: ClassName.DEADEYE,
    description: 'Unmatched precision at extreme ranges.',
    startingItem: 'Anti-Materiel Rifle',
    primaryAttribute: Attribute.PER,
    secondaryAttribute: Attribute.DEX,
    abilities: [
      register({ id: 'one_shot', name: 'One Shot', description: 'Massive single hit.', maxLevel: 10, tiers: generateLinearTiers(10, 500, 100, '%', 'Damage') }),
      register({ id: 'ballistics', name: 'Ballistics Calc', description: 'Ignore armor.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 10, '%', 'Effect') }),
      register({ id: 'zone_control', name: 'Zone Control', description: 'Auto-fire on move.', maxLevel: 10, tiers: generateLinearTiers(10, 1, 1, 'shot', 'Damage') })
    ],
    upgrades: []
  },
  [ClassName.BLADE_MASTER]: {
    name: ClassName.BLADE_MASTER,
    description: 'A whirlwind of steel and energy blades.',
    startingItem: 'Dual Energy Sabers',
    primaryAttribute: Attribute.DEX,
    secondaryAttribute: Attribute.STR,
    abilities: [
      register({ id: 'blade_dance', name: 'Blade Dance', description: 'Strike multiple foes.', maxLevel: 10, tiers: generateLinearTiers(10, 3, 1, 'targets', 'Damage') }),
      register({ id: 'deflect', name: 'Deflect', description: 'Block projectiles.', maxLevel: 10, tiers: generateLinearTiers(10, 20, 5, '%', 'Effect') }),
      register({ id: 'precision_cut', name: 'Precision Cut', description: 'Sever limb chance.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 2, '%', 'Effect') })
    ],
    upgrades: []
  },
  [ClassName.COMBAT_MEDIC]: {
    name: ClassName.COMBAT_MEDIC,
    description: 'Healers who can hold their own on the front lines.',
    startingItem: 'Biotic Rifle',
    primaryAttribute: Attribute.INT,
    secondaryAttribute: Attribute.STR,
    abilities: [
      register({ id: 'combat_stim', name: 'Combat Stim', description: 'Buff dmg & speed.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, '%', 'Effect') }),
      register({ id: 'triage', name: 'Triage', description: 'Instant heal low HP.', maxLevel: 10, tiers: generateLinearTiers(10, 200, 50, 'HP', 'Heal') }),
      register({ id: 'biogrenade', name: 'Bio-Grenade', description: 'Heal ally/Harm foe.', maxLevel: 10, tiers: generateLinearTiers(10, 50, 10, 'HP', 'Effect') })
    ],
    upgrades: []
  },
  [ClassName.BIO_ENGINEER]: {
    name: ClassName.BIO_ENGINEER,
    description: 'Manipulators of biology to buff allies or mutate foes.',
    startingItem: 'Viral Injector',
    primaryAttribute: Attribute.INT,
    secondaryAttribute: Attribute.MEM,
    abilities: [
      register({ id: 'mutate', name: 'Mutate', description: 'Grant random buff.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, 's', 'Effect') }),
      register({ id: 'plague', name: 'Plague', description: 'Spreading DoT.', maxLevel: 10, tiers: generateLinearTiers(10, 10, 5, 'dmg/s', 'Damage') }),
      register({ id: 'regeneration', name: 'Regeneration', description: 'Passive healing.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 2, 'HP/s', 'Heal') })
    ],
    upgrades: []
  },
  [ClassName.SUPPRESSOR]: {
    name: ClassName.SUPPRESSOR,
    description: 'Heavy weapons specialists who dominate sectors with firepower.',
    startingItem: 'Rotary Plasma Cannon',
    primaryAttribute: Attribute.STR,
    secondaryAttribute: Attribute.PER,
    abilities: [
      register({ id: 'barrage', name: 'Barrage', description: 'Cone of fire.', maxLevel: 10, tiers: generateLinearTiers(10, 50, 10, 'dmg', 'Damage') }),
      register({ id: 'lock_down', name: 'Lock Down', description: 'Immobile, +FireRate.', maxLevel: 10, tiers: generateLinearTiers(10, 20, 10, '%', 'Effect') }),
      register({ id: 'suppression', name: 'Suppression', description: 'Slow enemies.', maxLevel: 10, tiers: generateLinearTiers(10, 30, 5, '%', 'Effect') })
    ],
    upgrades: []
  },
  [ClassName.JUGGERNAUT]: {
    name: ClassName.JUGGERNAUT,
    description: 'Unstoppable forces of nature encased in heavy armor.',
    startingItem: 'Powered Exo-Frame',
    primaryAttribute: Attribute.STR,
    secondaryAttribute: Attribute.CHA,
    abilities: [
      register({ id: 'unstoppable', name: 'Unstoppable', description: 'Immune to CC.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 2, 's', 'Effect') }),
      register({ id: 'impact', name: 'Impact', description: 'Charge dmg.', maxLevel: 10, tiers: generateLinearTiers(10, 100, 20, 'dmg', 'Damage') }),
      register({ id: 'iron_will', name: 'Iron Will', description: 'Survive fatal hit.', maxLevel: 10, tiers: generateLinearTiers(10, 1, 0, 'HP', 'Heal') })
    ],
    upgrades: []
  },
  [ClassName.CRUSHER]: {
    name: ClassName.CRUSHER,
    description: 'Masters of blunt force trauma and crowd control.',
    startingItem: 'Gravity Hammer',
    primaryAttribute: Attribute.STR,
    secondaryAttribute: Attribute.DEX,
    abilities: [
      register({ id: 'quake', name: 'Quake', description: 'Knockdown area.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 1, 'm', 'Effect') }),
      register({ id: 'shatter', name: 'Shatter', description: 'Bonus vs Armor.', maxLevel: 10, tiers: generateLinearTiers(10, 50, 10, '%', 'Damage') }),
      register({ id: 'grab_throw', name: 'Grab & Throw', description: 'Toss enemy.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 2, 'm', 'Effect') })
    ],
    upgrades: []
  },
  [ClassName.COMBAT_ENGINEER]: {
    name: ClassName.COMBAT_ENGINEER,
    description: 'Battlefield architects who build fortifications instantly.',
    startingItem: 'Matter Printer',
    primaryAttribute: Attribute.INT,
    secondaryAttribute: Attribute.STR,
    abilities: [
      register({ id: 'bunker', name: 'Bunker', description: 'Create cover.', maxLevel: 10, tiers: generateLinearTiers(10, 500, 100, 'HP', 'Effect') }),
      register({ id: 'auto_turret', name: 'Auto-Turret', description: 'Autonomous gun.', maxLevel: 10, tiers: generateLinearTiers(10, 20, 5, 'dmg', 'Damage') }),
      register({ id: 'minefield', name: 'Minefield', description: 'Area denial.', maxLevel: 10, tiers: generateLinearTiers(10, 100, 20, 'dmg', 'Damage') })
    ],
    upgrades: []
  },
  [ClassName.DEMOLITIONS_EXPERT]: {
    name: ClassName.DEMOLITIONS_EXPERT,
    description: 'Experts in high-yield explosives and destruction.',
    startingItem: 'Grenade Launcher',
    primaryAttribute: Attribute.INT,
    secondaryAttribute: Attribute.PER,
    abilities: [
      register({ id: 'big_boom', name: 'Big Boom', description: 'Large AOE.', maxLevel: 10, tiers: generateLinearTiers(10, 200, 50, 'dmg', 'Damage') }),
      register({ id: 'shaped_charge', name: 'Shaped Charge', description: 'Breach walls.', maxLevel: 10, tiers: generateLinearTiers(10, 1, 0, 'hole', 'Effect') }),
      register({ id: 'cluster_bomb', name: 'Cluster Bomb', description: 'Multiple hits.', maxLevel: 10, tiers: generateLinearTiers(10, 5, 1, 'bombs', 'Effect') })
    ],
    upgrades: []
  },
};

// Global Registry for Lookup
export const CLASS_REGISTRY: Record<string, CharacterClass> = {
  [ClassName.RECRUIT]: RECRUIT_CLASS,
  ...ADVANCED_CLASSES
};
