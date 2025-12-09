import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Swords, 
  Brain, 
  Zap, 
  Eye, 
  MessageSquare, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Coins,
  Pencil,
  Check,
  X,
  Sparkles,
  ArrowBigUpDash,
  Scroll,
  Trophy,
  Plus,
  Disc,
  Search,
  Download,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { Attribute, Character, ClassName, Monster, EquippedItems, ClassHistoryEntry } from '../types';
import { ATTRIBUTE_DESCRIPTIONS } from '../attribute-metadata';
import { getTotalXpRequired, getCumulativePoints, getLevelRewards, getCooldownReduction, applyCooldownReduction, getDurationExtension, applyDurationExtension } from '../xp-constants';
import { BattleSimulator } from './BattleSimulator';
import { EquipmentSection } from './EquipmentSection';
import { ClassSelectionModal } from './ClassSelectionModal';
import { getCachedClasses, getCachedAbilities, getCachedProfessions, getCachedItems, LitrpgAbility, LitrpgClass, LitrpgProfession, LitrpgItem } from '../utils/api-litrpg';
import { getTierNumber, TIER_COLORS, TIER_NAMES, ClassTier } from '../tier-constants';

// Bonus ability points awarded per tier upgrade (when selecting a new tier class)
const TIER_UPGRADE_ABILITY_BONUS = 5;

interface CharacterSheetProps {
  character: Character;
  updateCharacter: (c: Character) => void;
  monsters: Monster[];
  currentDbClassId?: number | null;
  onDbClassChange?: (classId: number | null) => void;
}

interface LevelUpData {
    oldLevel: number;
    newLevel: number;
    attrGained: number;
    abilGained: number;
    unlocks: string[];
}

// Unified ability type for display
interface DisplayAbility {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  evolutionId?: number;
  tiers: Array<{
    level: number;
    duration?: string;
    cooldown?: string;
    effectDescription?: string;
  }>;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, updateCharacter, monsters, currentDbClassId, onDbClassChange }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(character.name);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(character.headerImageUrl || '');
  const [imageError, setImageError] = useState(false);
  const [levelUpNotification, setLevelUpNotification] = useState<LevelUpData | null>(null);
  
  // Database State
  const [dbClasses, setDbClasses] = useState<LitrpgClass[]>([]);
  const [dbAbilities, setDbAbilities] = useState<LitrpgAbility[]>([]);
  const [dbProfessions, setDbProfessions] = useState<LitrpgProfession[]>([]);
  const [items, setItems] = useState<LitrpgItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Ability Disk State
  const [isDiskModalOpen, setIsDiskModalOpen] = useState(false);
  const [diskSearch, setDiskSearch] = useState('');
  
  // Class Selection Modal State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [modalDefaultCategory, setModalDefaultCategory] = useState<'combat' | 'professional'>('combat');
  
  // Class Upgrade Required State
  const [classUpgradeRequired, setClassUpgradeRequired] = useState<{
    targetTier: ClassTier;
    availableClasses: LitrpgClass[];
  } | null>(null);
  
  // Profession Unlock State (separate from class upgrades)
  const [professionUnlockAvailable, setProfessionUnlockAvailable] = useState(false);
  
  // Profession Upgrade State (for tier 2 profession upgrades)
  const [professionUpgradeAvailable, setProfessionUpgradeAvailable] = useState<{
    targetTier: ClassTier;
    availableProfessions: LitrpgClass[];
  } | null>(null);
  
  // Class History State (tracks previous classes for ability retention)
  const [previousClasses, setPreviousClasses] = useState<string[]>(() => {
    // Initialize from character's class history if it exists
    return character.classHistory || [];
  });
  
  // Sync previousClasses with character.classHistory when it changes
  useEffect(() => {
    if (character.classHistory && character.classHistory.length > 0) {
      setPreviousClasses(character.classHistory);
    }
  }, [character.classHistory?.length]);
  
  // UI State
  const [collapsedAbilities, setCollapsedAbilities] = useState<Set<string>>(new Set());
  const [isClassSectionCollapsed, setIsClassSectionCollapsed] = useState(false);
  const [isProfessionSectionCollapsed, setIsProfessionSectionCollapsed] = useState(false);

  // Load classes from API (classes still use API for now)
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [classes, abilities, professions, apiItems] = await Promise.all([
          getCachedClasses(),
          getCachedAbilities(),
          getCachedProfessions(),
          getCachedItems(),
        ]);
        setDbClasses(classes);
        setDbAbilities(abilities);
        setDbProfessions(professions);
        setItems(apiItems);
      } catch (error) {
        console.error('Failed to load LitRPG data', error);
      }
      setIsLoadingData(false);
    };
    loadData();
  }, []);

  // Helper: Find class OR profession by name
  const findClassByName = (name: string): LitrpgClass | undefined => {
    // First search classes
    const foundClass = dbClasses.find(c => c.name === name);
    if (foundClass) return foundClass;

    // Then search professions (convert to class format)
    const foundProfession = dbProfessions.find(p => p.name === name);
    if (foundProfession) {
      return {
        id: foundProfession.id,
        name: foundProfession.name,
        slug: foundProfession.slug,
        description: foundProfession.description,
        tier: foundProfession.tier,
        unlock_level: foundProfession.unlock_level,
        prerequisite_class_id: foundProfession.prerequisite_profession_id,
        stat_bonuses: foundProfession.stat_bonuses,
        primary_attribute: undefined,
        secondary_attribute: undefined,
        starting_item: undefined,
        ability_ids: foundProfession.ability_ids,
        upgrade_ids: [],
        created_at: '',
        updated_at: ''
      } as LitrpgClass;
    }
    
    return undefined;
  };

  // Helper: Find ability by name in constants
  const findAbilityByName = (name: string): LitrpgAbility | undefined => {
    return dbAbilities.find((a) => a.name === name);
  };

  // Helper: Find ability by ID in constants
  const findAbilityById = (id: number): LitrpgAbility | undefined => {
    return dbAbilities.find((a) => a.id === id);
  };

  // Get current class from DB
  const currentDbClass = findClassByName(character.className);
  
  // Track class changes for history
  React.useEffect(() => {
    if (currentDbClass && !previousClasses.includes(currentDbClass.name)) {
      // When class changes, add old classes to history (not the current one)
      const allPreviousNames = dbClasses
        .filter(c => {
          const prevTier = getTierNumber(c.tier);
          const currentTier = getTierNumber(currentDbClass.tier);
          return prevTier < currentTier && (c.name === character.className || previousClasses.includes(c.name));
        })
        .map(c => c.name);
      
      // Add current-tier classes that were previously held (not current)
      previousClasses.forEach(name => {
        if (!allPreviousNames.includes(name) && name !== currentDbClass.name) {
          allPreviousNames.push(name);
        }
      });
      
      if (allPreviousNames.length !== previousClasses.length) {
        setPreviousClasses(allPreviousNames);
        // Update character with class history
        updateCharacter({ 
          ...character, 
          classHistory: allPreviousNames 
        });
      }
    }
  }, [currentDbClass?.name, dbClasses]);

  // Check if a class upgrade is required (higher tier classes now available)
  const checkClassUpgradeRequired = (): { targetTier: ClassTier; availableClasses: LitrpgClass[] } | null => {
    if (!currentDbClass) return null;

    const currentTierNum = getTierNumber(currentDbClass.tier);
    const highestTierAchieved = character.highestTierAchieved || 1;

    // If the player has already selected a class for this tier level, don't prompt again
    // (i.e., if current class tier matches or exceeds the highest tier they've achieved)
    if (currentTierNum >= highestTierAchieved) {
      // They've already chosen a class for their current tier, check if they can upgrade HIGHER
      // But only if their level qualifies for the NEXT tier

      // Combine combat classes and professions
      const professionsAsClasses = dbProfessions.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        tier: p.tier,
        unlock_level: p.unlock_level,
        prerequisite_class_id: p.prerequisite_profession_id,
        stat_bonuses: p.stat_bonuses,
        primary_attribute: undefined,
        secondary_attribute: undefined,
        starting_item: undefined,
        ability_ids: p.ability_ids,
        upgrade_ids: [],
        created_at: '',
        updated_at: ''
      } as LitrpgClass));

      const allClasses = [...dbClasses, ...professionsAsClasses];

      // Find all classes of STRICTLY higher tiers that are now unlocked
      // AND have the current class as a prerequisite
      const higherTierClasses = allClasses.filter(cls => {
        const clsTierNum = getTierNumber(cls.tier);
        const meetsLevelRequirement = character.level >= cls.unlock_level;
        const hasCorrectPrerequisite = cls.prerequisite_class_id === currentDbClass.id;

        return clsTierNum > currentTierNum && meetsLevelRequirement && hasCorrectPrerequisite;
      });

      if (higherTierClasses.length === 0) return null;

      // Find the minimum required tier among available higher classes
      const nextTierNum = Math.min(...higherTierClasses.map(c => getTierNumber(c.tier)));
      const targetTier = `tier-${nextTierNum}` as ClassTier;

      // Get classes of that target tier that are available
      const availableClasses = higherTierClasses.filter(c => getTierNumber(c.tier) === nextTierNum);

      return { targetTier, availableClasses };
    }

    // Player needs to catch up - they haven't selected a class for their achieved tier yet
    return null;
  };

  // Effect: Check for class upgrade requirement when level or classes change
  React.useEffect(() => {
    if (!isLoadingData && dbClasses.length > 0 && currentDbClass) {
      const upgradeInfo = checkClassUpgradeRequired();
      setClassUpgradeRequired(upgradeInfo);
    }
  }, [character.level, currentDbClass?.tier, dbClasses, isLoadingData]);
  
  // Check if a profession upgrade is available (higher tier professions now available)
  const checkProfessionUpgradeAvailable = (): { targetTier: ClassTier; availableProfessions: LitrpgClass[] } | null => {
    if (!character.professionName) return null;
    
    const currentProfession = dbProfessions.find(p => p.name === character.professionName);
    if (!currentProfession) return null;
    
    const currentTierNum = getTierNumber(currentProfession.tier);
    
    // Convert professions to LitrpgClass format
    const professionsAsClasses = dbProfessions.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      tier: p.tier,
      unlock_level: p.unlock_level,
      prerequisite_class_id: p.prerequisite_profession_id,
      stat_bonuses: p.stat_bonuses,
      primary_attribute: undefined,
      secondary_attribute: undefined,
      starting_item: undefined,
      ability_ids: p.ability_ids,
      upgrade_ids: [],
      created_at: '',
      updated_at: ''
    } as LitrpgClass));
    
    // Find higher tier professions that:
    // 1. Are higher tier than current
    // 2. Match the level requirement
    // 3. Have the current profession as a prerequisite
    const higherTierProfessions = professionsAsClasses.filter(prof => {
      const profTierNum = getTierNumber(prof.tier);
      const meetsLevelRequirement = character.level >= prof.unlock_level;
      const hasCorrectPrerequisite = prof.prerequisite_class_id === currentProfession.id;
      
      return profTierNum > currentTierNum && meetsLevelRequirement && hasCorrectPrerequisite;
    });
    
    if (higherTierProfessions.length === 0) return null;
    
    // Find the minimum required tier among available higher professions
    const nextTierNum = Math.min(...higherTierProfessions.map(p => getTierNumber(p.tier)));
    const targetTier = `tier-${nextTierNum}` as ClassTier;
    
    // Get professions of that target tier
    const availableProfessions = higherTierProfessions.filter(p => getTierNumber(p.tier) === nextTierNum);
    
    return { targetTier, availableProfessions };
  };
  
  // Effect: Check if professions are newly available based on actual unlock levels in database
  React.useEffect(() => {
    if (!isLoadingData && dbProfessions.length > 0) {
      const hasNoProfession = !character.professionName;

      if (hasNoProfession) {
        // Find the lowest unlock level among all tier 1 professions
        const tier1Professions = dbProfessions.filter(p => getTierNumber(p.tier) === 1);
        if (tier1Professions.length > 0) {
          const minUnlockLevel = Math.min(...tier1Professions.map(p => p.unlock_level));
          setProfessionUnlockAvailable(character.level >= minUnlockLevel);
        } else {
          setProfessionUnlockAvailable(false);
        }
      } else {
        setProfessionUnlockAvailable(false);
      }

      // Check if profession upgrade is available (higher tier professions unlocked)
      if (character.professionName) {
        const upgradeInfo = checkProfessionUpgradeAvailable();
        setProfessionUpgradeAvailable(upgradeInfo);
      } else {
        setProfessionUpgradeAvailable(null);
      }
    }
  }, [character.level, character.professionName, isLoadingData, dbProfessions]);

  // Helper: Get levels gained since current class was activated
  const getLevelsSinceClassActivation = (): number => {
    const activationLevel = character.classActivatedAtLevel || 1;
    return Math.max(0, character.level - activationLevel);
  };

  // Helper: Calculate TOTAL accumulated class AND profession bonuses
  // Returns the sum of (bonusPerLevel * levelsHeldForEachClass) for each attribute
  const getAccumulatedClassBonuses = (): Record<string, number> => {
    const totalBonuses: Record<string, number> = {};
    
    // Add bonuses from all previous classes (stored in classHistoryWithLevels)
    if (character.classHistoryWithLevels && character.classHistoryWithLevels.length > 0) {
      for (const entry of character.classHistoryWithLevels) {
        const historicalClass = findClassByName(entry.className);
        if (historicalClass?.stat_bonuses) {
          // Calculate levels held for this class
          const levelsHeld = (entry.deactivatedAtLevel || character.level) - entry.activatedAtLevel;
          if (levelsHeld > 0) {
            for (const [stat, bonusPerLevel] of Object.entries(historicalClass.stat_bonuses)) {
              totalBonuses[stat] = (totalBonuses[stat] || 0) + (bonusPerLevel * levelsHeld);
            }
          }
        }
      }
    }
    
    // Add bonuses from current class (levels since activation)
    if (currentDbClass?.stat_bonuses) {
      const levelsSinceActivation = getLevelsSinceClassActivation();
      // Only show bonuses after gaining levels (not immediately on selection)
      if (levelsSinceActivation > 0) {
        for (const [stat, bonusPerLevel] of Object.entries(currentDbClass.stat_bonuses)) {
          totalBonuses[stat] = (totalBonuses[stat] || 0) + (bonusPerLevel * levelsSinceActivation);
        }
      }
    }
    
    // Add bonuses from all previous professions
    if (character.professionHistoryWithLevels && character.professionHistoryWithLevels.length > 0) {
      for (const entry of character.professionHistoryWithLevels) {
        const historicalProfession = dbProfessions.find(p => p.name === entry.className);
        if (historicalProfession?.stat_bonuses) {
          const levelsHeld = (entry.deactivatedAtLevel || character.level) - entry.activatedAtLevel;
          if (levelsHeld > 0) {
            for (const [stat, bonusPerLevel] of Object.entries(historicalProfession.stat_bonuses)) {
              totalBonuses[stat] = (totalBonuses[stat] || 0) + (bonusPerLevel * levelsHeld);
            }
          }
        }
      }
    }

    // Add bonuses from current profession
    if (character.professionName && character.professionActivatedAtLevel) {
      const currentProfession = dbProfessions.find(p => p.name === character.professionName);
      if (currentProfession?.stat_bonuses) {
        const levelsHeld = character.level - character.professionActivatedAtLevel;
        // Only show bonuses after gaining levels (not immediately on selection)
        if (levelsHeld > 0) {
          for (const [stat, bonusPerLevel] of Object.entries(currentProfession.stat_bonuses)) {
            totalBonuses[stat] = (totalBonuses[stat] || 0) + (bonusPerLevel * levelsHeld);
          }
        }
      }
    }

    return totalBonuses;
  };

  // Helper: Get effective attribute (base + accumulated class bonuses from ALL classes)
  const getEffectiveAttribute = (attr: Attribute): number => {
    const base = character.attributes[attr];
    const accumulatedBonuses = getAccumulatedClassBonuses();
    return base + (accumulatedBonuses[attr] || 0);
  };

  // Helper: Get ONLY class bonuses (not profession) for an attribute
  const getClassOnlyBonus = (attr: Attribute): number => {
    let total = 0;
    let historyBonus = 0;

    // Add bonuses from all previous classes
    if (character.classHistoryWithLevels && character.classHistoryWithLevels.length > 0) {
      for (const entry of character.classHistoryWithLevels) {
        const historicalClass = dbClasses.find(c => c.name === entry.className);
        if (historicalClass?.stat_bonuses) {
          const levelsHeld = (entry.deactivatedAtLevel || character.level) - entry.activatedAtLevel;
          if (levelsHeld > 0) {
            const bonus = (historicalClass.stat_bonuses[attr] || 0) * levelsHeld;
            historyBonus += bonus;
            total += bonus;
          }
        }
      }
    }

    // Add bonuses from current class
    if (currentDbClass?.stat_bonuses) {
      const levelsSinceActivation = getLevelsSinceClassActivation();
      console.log(`🔍 Class Bonus Debug (${attr}):`, {
        className: character.className,
        level: character.level,
        classActivatedAtLevel: character.classActivatedAtLevel,
        historyLength: character.classHistoryWithLevels?.length || 0,
        historyBonus,
        levelsSinceActivation,
        statBonus: currentDbClass.stat_bonuses[attr],
        currentClassWillShowBonus: levelsSinceActivation > 0,
        totalBonus: total + (levelsSinceActivation > 0 ? (currentDbClass.stat_bonuses[attr] || 0) * levelsSinceActivation : 0)
      });
      // Only show bonuses after gaining levels (not immediately on selection)
      if (levelsSinceActivation > 0) {
        total += (currentDbClass.stat_bonuses[attr] || 0) * levelsSinceActivation;
      }
    }

    return total;
  };

  // Helper: Get ONLY profession bonuses (not class) for an attribute
  const getProfessionOnlyBonus = (attr: Attribute): number => {
    let total = 0;

    // Add bonuses from all previous professions
    if (character.professionHistoryWithLevels && character.professionHistoryWithLevels.length > 0) {
      for (const entry of character.professionHistoryWithLevels) {
        const historicalProfession = dbProfessions.find(p => p.name === entry.className);
        if (historicalProfession?.stat_bonuses) {
          const levelsHeld = (entry.deactivatedAtLevel || character.level) - entry.activatedAtLevel;
          if (levelsHeld > 0) {
            total += (historicalProfession.stat_bonuses[attr] || 0) * levelsHeld;
          }
        }
      }
    }

    // Add bonuses from current profession
    if (character.professionName && character.professionActivatedAtLevel) {
      const currentProfession = dbProfessions.find(p => p.name === character.professionName);
      if (currentProfession?.stat_bonuses) {
        const levelsHeld = character.level - character.professionActivatedAtLevel;
        console.log(`🔍 Profession Bonus Debug (${attr}):`, {
          professionName: character.professionName,
          level: character.level,
          professionActivatedAtLevel: character.professionActivatedAtLevel,
          levelsHeld,
          statBonus: currentProfession.stat_bonuses[attr],
          willShowBonus: levelsHeld > 0
        });
        // Only show bonuses after gaining levels (not immediately on selection)
        if (levelsHeld > 0) {
          total += (currentProfession.stat_bonuses[attr] || 0) * levelsHeld;
        }
      }
    }

    return total;
  };

  // Calculate tier bonus ability points (5 points per tier upgrade beyond tier 1)
  const getTierBonusAbilityPoints = (): number => {
    const highestTier = character.highestTierAchieved || 1;
    // Tier 1 = 0 bonus, Tier 2 = 5, Tier 3 = 10, etc.
    return Math.max(0, (highestTier - 1) * TIER_UPGRADE_ABILITY_BONUS);
  };

  const getPendingAttributeInvestment = (attr: Attribute): number => {
    const baseValue = character.baseStats?.[attr] ?? 3;
    return Math.max(0, character.attributes[attr] - baseValue);
  };

  const calculateUsedAttributePoints = () => {
    // Only count manually allocated points (exclude starting stats and class/profession bonuses)
    return (Object.keys(character.attributes) as Attribute[]).reduce((total, attr) => {
      const spent = getPendingAttributeInvestment(attr);
      return total + spent;
    }, 0);
  };

  // Derived calculations
  const cumulative = getCumulativePoints(character.level);
  const usedAttributePoints = calculateUsedAttributePoints();
  const availableAttributePoints = Math.max(0, cumulative.attributePoints - usedAttributePoints);
  const usedAbilityPoints = (Object.values(character.abilities) as number[]).reduce((sum, val) => sum + val, 0);
  const tierBonusAbilityPoints = getTierBonusAbilityPoints();
  const totalAbilityPoints = cumulative.abilityPoints + tierBonusAbilityPoints;
  const availableAbilityPoints = Math.max(0, totalAbilityPoints - usedAbilityPoints);

  // XP Calculations
  const currentLevelTotalXp = getTotalXpRequired(character.level);
  const nextLevelTotalXp = getTotalXpRequired(character.level + 1);
  const xpForCurrentLevel = nextLevelTotalXp - currentLevelTotalXp;
  const xpProgress = character.xp - currentLevelTotalXp;
  const xpPercent = Math.min(100, Math.max(0, (xpProgress / xpForCurrentLevel) * 100));

  // Use effective attributes for CDR/Duration calculations
  const effectiveMEM = getEffectiveAttribute(Attribute.MEM);
  const effectiveINT = getEffectiveAttribute(Attribute.INT);
  const cdrPercent = (getCooldownReduction(effectiveMEM) * 100).toFixed(1);
  const durationExtPercent = (getDurationExtension(effectiveINT) * 100).toFixed(1);

  const handleNameSave = () => {
    if (tempName.trim()) {
      updateCharacter({ ...character, name: tempName.trim() });
    } else {
      setTempName(character.name);
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(character.name);
    setIsEditingName(false);
  };

  const handleImageSave = () => {
    updateCharacter({ ...character, headerImageUrl: tempImageUrl.trim() });
    setIsEditingImage(false);
    setImageError(false);
  };

  const handleAttributeChange = (attr: Attribute, delta: number) => {
    const currentVal = character.attributes[attr];
    if (delta > 0 && availableAttributePoints <= 0) return;
    if (delta < 0 && currentVal <= 3) return;
    updateCharacter({
      ...character,
      attributes: { ...character.attributes, [attr]: currentVal + delta }
    });
  };

  const handleLevelChange = (delta: number) => {
    const newLevel = Math.max(1, character.level + delta);
    let newXp = character.xp;
    if (delta > 0 && character.xp < getTotalXpRequired(newLevel)) {
      newXp = getTotalXpRequired(newLevel);
    }
    updateCharacter({ ...character, level: newLevel, xp: newXp });
  };

  const handleAbilityChange = (abilityName: string, delta: number, maxLevel: number) => {
    const currentLevel = character.abilities[abilityName] || 0;
    if (delta > 0 && (availableAbilityPoints <= 0 || currentLevel >= maxLevel)) return;
    if (delta < 0 && currentLevel <= 0) return;
    const newAbilities = { ...character.abilities };
    if (currentLevel + delta <= 0) {
      delete newAbilities[abilityName];
    } else {
      newAbilities[abilityName] = currentLevel + delta;
    }
    updateCharacter({ ...character, abilities: newAbilities });
  };

  const handleInstallAbility = (abilityName: string) => {
    const newAbilities = { ...character.abilities };
    if (!newAbilities[abilityName]) {
      newAbilities[abilityName] = 1;
      updateCharacter({
        ...character,
        abilities: newAbilities,
        history: [`Installed Ability Disk: ${abilityName}`, ...character.history]
      });
      setIsDiskModalOpen(false);
      setDiskSearch('');
    }
  };

  const handleEvolveAbility = (oldAbilityName: string, evolutionId: number) => {
    const newAbilities = { ...character.abilities };
    delete newAbilities[oldAbilityName];
    const evolutionAbility = findAbilityById(evolutionId);
    if (evolutionAbility) {
      newAbilities[evolutionAbility.name] = 1;
    }
    updateCharacter({ ...character, abilities: newAbilities });
  };

  const toggleAbilityCollapse = (abilityId: string) => {
    setCollapsedAbilities(prev => {
      const next = new Set(prev);
      if (next.has(abilityId)) next.delete(abilityId);
      else next.add(abilityId);
      return next;
    });
  };

  const handleApplyBattle = (xp: number, credits: number, description: string, loot: string[]) => {
    let newXp = character.xp + xp;
    let newLevel = character.level;
    let levelChanged = false;
    while (newXp >= getTotalXpRequired(newLevel + 1)) {
      newLevel++;
      levelChanged = true;
    }
    if (levelChanged) {
      let totalAttrGained = 0, totalAbilGained = 0;
      const allUnlocks: string[] = [];
      for (let l = character.level + 1; l <= newLevel; l++) {
        const rewards = getLevelRewards(l);
        totalAttrGained += rewards.attributePoints;
        totalAbilGained += rewards.abilityPoints;
        allUnlocks.push(...rewards.unlocks);
      }
      setLevelUpNotification({ oldLevel: character.level, newLevel, attrGained: totalAttrGained, abilGained: totalAbilGained, unlocks: allUnlocks });
    }
    updateCharacter({
      ...character,
      level: newLevel,
      xp: newXp,
      credits: character.credits + credits,
      history: [description, ...character.history],
      inventory: [...character.inventory, ...loot]
    });
  };

  const handleStatusDownload = () => {
    const nextXp = getTotalXpRequired(character.level + 1);
    let content = `[Status]\nName: ${character.name}\nLevel: ${character.level}\nClass: ${character.className}\nXP: ${character.xp.toLocaleString()} / ${nextXp.toLocaleString()}\nCredits: ${character.credits.toLocaleString()}\n\n[Attributes]\n`;
    (Object.entries(character.attributes) as [Attribute, number][]).forEach(([attr, val]) => {
      content += `${attr}: ${val}\n`;
    });
    content += '\n[Abilities]\n';
    Object.keys(character.abilities).forEach(name => {
      const lvl = character.abilities[name];
      const dbAbility = findAbilityByName(name);
      content += `${name} (Lvl ${lvl})\n${dbAbility?.description || ''}\n\n`;
    });
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name.replace(/\s+/g, '_')}_Status.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const AttrIcon = ({ attr }: { attr: Attribute }) => {
    switch (attr) {
      case Attribute.STR: return <Swords className="text-red-500" size={16} />;
      case Attribute.DEX: return <Zap className="text-yellow-500" size={16} />;
      case Attribute.PER: return <Eye className="text-emerald-500" size={16} />;
      case Attribute.MEM: return <Brain className="text-purple-500" size={16} />;
      case Attribute.INT: return <Shield className="text-blue-500" size={16} />;
      case Attribute.CHA: return <MessageSquare className="text-pink-500" size={16} />;
      default: return <div />;
    }
  };

  const convertToDisplayAbility = (ability: LitrpgAbility): DisplayAbility => ({
    id: String(ability.id),
    name: ability.name,
    description: ability.description || '',
    maxLevel: ability.maxLevel,
    evolutionId: ability.evolutionId,
    tiers: ability.tiers.map(t => ({
      level: t.level,
      duration: t.duration,
      cooldown: t.cooldown,
      effectDescription: t.effectDescription || ''
    }))
  });

  const getCombatAbilities = (): DisplayAbility[] => {
    const displayList: DisplayAbility[] = [];
    const addedNames = new Set<string>();

    // Helper to add abilities from a class
    const addAbilitiesFromClass = (cls: LitrpgClass) => {
      (cls.ability_ids || []).forEach(abilityId => {
        const fullAbility = findAbilityById(abilityId);
        if (fullAbility && !addedNames.has(fullAbility.name)) {
          displayList.push(convertToDisplayAbility(fullAbility));
          addedNames.add(fullAbility.name);
        }
      });
    };
    
    // Add abilities from previous classes
    if (character.classHistory && character.classHistory.length > 0) {
      character.classHistory.forEach(className => {
        const cls = findClassByName(className);
        if (cls) {
          addAbilitiesFromClass(cls);
        }
      });
    }
    
    // Add abilities from current class
    if (currentDbClass) {
      addAbilitiesFromClass(currentDbClass);
    }
    
    // Add manually learned combat abilities (from ability disks)
    // But exclude abilities that come from professions
    const professionalAbilityIds = new Set<number>();

    // Collect all professional ability IDs
    if (character.professionHistoryWithLevels && character.professionHistoryWithLevels.length > 0) {
      character.professionHistoryWithLevels.forEach(entry => {
        const historicalProfession = dbProfessions.find(p => p.name === entry.className);
        if (historicalProfession?.ability_ids) {
          historicalProfession.ability_ids.forEach(id => professionalAbilityIds.add(id));
        }
      });
    }

    if (character.professionName) {
      const currentProfession = dbProfessions.find(p => p.name === character.professionName);
      if (currentProfession?.ability_ids) {
        currentProfession.ability_ids.forEach(id => professionalAbilityIds.add(id));
      }
    }

    Object.keys(character.abilities).forEach(learnedName => {
      if (!addedNames.has(learnedName)) {
        const dbAbility = findAbilityByName(learnedName);
        // Only add if it's NOT a professional ability
        if (dbAbility && !professionalAbilityIds.has(dbAbility.id)) {
          displayList.push(convertToDisplayAbility(dbAbility));
          addedNames.add(learnedName);
        }
      }
    });
    
    return displayList;
  };

  const getProfessionalAbilities = (): DisplayAbility[] => {
    const displayList: DisplayAbility[] = [];
    const addedNames = new Set<string>();

    // Add abilities from previous professions (from profession history)
    if (character.professionHistoryWithLevels && character.professionHistoryWithLevels.length > 0) {
      character.professionHistoryWithLevels.forEach(entry => {
        const historicalProfession = dbProfessions.find(p => p.name === entry.className);
        const professionAbilities = historicalProfession?.ability_ids || [];
        if (professionAbilities.length > 0) {
          professionAbilities.forEach(abilityId => {
            const professionalAbility = findAbilityById(abilityId);
            if (professionalAbility && !addedNames.has(professionalAbility.name)) {
              displayList.push(convertToDisplayAbility(professionalAbility));
              addedNames.add(professionalAbility.name);
            }
          });
        }
      });
    }

    // Add abilities from current profession
    if (character.professionName) {
      const currentProfession = dbProfessions.find(p => p.name === character.professionName);
      const professionAbilities = currentProfession?.ability_ids || [];
      if (professionAbilities.length > 0) {
        professionAbilities.forEach(abilityId => {
          const professionalAbility = findAbilityById(abilityId);
          if (professionalAbility && !addedNames.has(professionalAbility.name)) {
            displayList.push(convertToDisplayAbility(professionalAbility));
            addedNames.add(professionalAbility.name);
          }
        });
      }
    }

    return displayList;
  };

  const getUnlearnedAbilities = (): LitrpgAbility[] => {
    const learnedSet = new Set(Object.keys(character.abilities));
    return dbAbilities.filter((a) => !learnedSet.has(a.name)).filter((a) => a.name.toLowerCase().includes(diskSearch.toLowerCase()));
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-nexus-accent" />
        <span className="ml-3 text-slate-400">Loading character data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Level Up Notification */}
      {levelUpNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-nexus-panel border-2 border-nexus-accent shadow-[0_0_50px_rgba(6,182,212,0.3)] rounded-2xl max-w-md w-full p-8 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-2 bg-nexus-accent"></div>
            <Trophy size={64} className="mx-auto text-yellow-400 mb-4 animate-bounce" />
            <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2">LEVEL UP!</h2>
            <div className="text-2xl font-mono text-nexus-accent mb-6">
              {levelUpNotification.oldLevel} <span className="text-slate-500 mx-2">➔</span> <span className="text-white font-bold">{levelUpNotification.newLevel}</span>
            </div>
            <div className="space-y-4 mb-8">
              {levelUpNotification.attrGained > 0 && (
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                  <span className="text-slate-300 font-bold flex items-center gap-2"><Shield size={18} /> Attribute Points</span>
                  <span className="text-green-400 font-black text-xl">+{levelUpNotification.attrGained}</span>
                </div>
              )}
              {levelUpNotification.abilGained > 0 && (
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                  <span className="text-slate-300 font-bold flex items-center gap-2"><Zap size={18} /> Ability Points</span>
                  <span className="text-yellow-400 font-black text-xl">+{levelUpNotification.abilGained}</span>
                </div>
              )}
            </div>
            <button onClick={() => setLevelUpNotification(null)} className="w-full py-3 bg-nexus-accent hover:bg-cyan-400 text-black font-bold text-lg rounded-lg transition-all transform hover:scale-105">CONTINUE</button>
          </div>
        </div>
      )}

      {/* Profession Unlock Modal */}
      {professionUnlockAvailable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-nexus-panel border-2 border-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.4)] rounded-2xl max-w-lg w-full p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 animate-pulse"></div>
            
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center border-2 border-blue-500 animate-bounce">
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-blue-400 uppercase tracking-wide mb-2">Professions Unlocked!</h2>
              <p className="text-slate-400 text-sm">
                You've reached level <span className="text-white font-bold">{character.level}</span> and can now choose a profession!
              </p>
              <p className="text-blue-300 text-xs mt-2 font-bold">
                Professions provide stat bonuses and special abilities.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700">
              <div className="text-xs text-slate-500 uppercase mb-2">Available Now</div>
              <div className="text-blue-400 font-bold">Tier 1 Professions (Level 16+)</div>
              <p className="text-xs text-slate-400 mt-1">Choose your starting profession below</p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setProfessionUnlockAvailable(false);
                  setModalDefaultCategory('professional');
                  setIsClassModalOpen(true);
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all transform hover:scale-105"
              >
                Choose Profession
              </button>
              <button
                onClick={() => setProfessionUnlockAvailable(false)}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-lg transition-all"
              >
                Later
              </button>
            </div>

            <div className="text-center text-xs text-slate-500 border-t border-slate-700 pt-4">
              <p>💡 You can select a profession from the Profession section on your character sheet</p>
            </div>
          </div>
        </div>
      )}

      {/* Profession Upgrade Modal */}
      {professionUpgradeAvailable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-nexus-panel border-2 border-cyan-500 shadow-[0_0_60px_rgba(6,182,212,0.4)] rounded-2xl max-w-lg w-full p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 animate-pulse"></div>
            
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-cyan-500/20 rounded-full flex items-center justify-center border-2 border-cyan-500 animate-bounce">
                <ArrowBigUpDash size={40} className="text-cyan-400" />
              </div>
              <h2 className="text-3xl font-black text-cyan-400 uppercase tracking-wide mb-2">Profession Upgrade Available!</h2>
              <p className="text-slate-400 text-sm">
                You've reached level <span className="text-white font-bold">{character.level}</span> and can now advance to <span className={`font-bold ${TIER_COLORS[professionUpgradeAvailable.targetTier]?.split(' ')[0] || 'text-cyan-400'}`}>{TIER_NAMES[professionUpgradeAvailable.targetTier]}</span> profession!
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-700">
              <div className="text-xs text-slate-500 uppercase mb-1">Current Profession</div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-bold text-slate-200">{character.professionName}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-cyan-400" />
                Choose Your {TIER_NAMES[professionUpgradeAvailable.targetTier]} Profession
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {professionUpgradeAvailable.availableProfessions.map(prof => {
                  const tierColor = TIER_COLORS[prof.tier as ClassTier]?.split(' ')[0] || 'text-cyan-400';
                  const profAbilities = (prof.ability_ids || [])
                    .map((id: number) => findAbilityById(id))
                    .filter((a): a is LitrpgAbility => a !== undefined);
                  
                  return (
                    <button
                      key={prof.id}
                      onClick={() => {
                        // Handle profession upgrade
                        const newProfessionHistoryWithLevels: ClassHistoryEntry[] = character.professionHistoryWithLevels ? [...character.professionHistoryWithLevels] : [];
                        
                        // Mark current profession as deactivated
                        if (character.professionName && character.professionActivatedAtLevel) {
                          newProfessionHistoryWithLevels.push({
                            className: character.professionName,
                            activatedAtLevel: character.professionActivatedAtLevel,
                            deactivatedAtLevel: character.level
                          });
                        }
                        
                        updateCharacter({
                          ...character,
                          professionName: prof.name,
                          professionActivatedAtLevel: character.level,
                          professionHistoryWithLevels: newProfessionHistoryWithLevels,
                          history: [`Advanced profession to ${TIER_NAMES[prof.tier as ClassTier]}: ${prof.name} at Lvl ${character.level}`, ...character.history]
                        });
                        setProfessionUpgradeAvailable(null);
                      }}
                      className="w-full text-left p-4 bg-slate-800/80 hover:bg-cyan-900/30 border border-slate-700 hover:border-cyan-500 rounded-lg transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold text-lg ${tierColor} group-hover:text-cyan-400`}>{prof.name}</span>
                        <ChevronRight size={20} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{prof.description || 'No description available.'}</p>
                      {prof.stat_bonuses && Object.keys(prof.stat_bonuses).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {Object.entries(prof.stat_bonuses).map(([stat, bonus]) => (
                            <span key={stat} className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded">
                              {stat} +{bonus}/lvl
                            </span>
                          ))}
                        </div>
                      )}
                      {profAbilities.length > 0 && (
                        <div className="text-xs text-cyan-300 mt-2 pt-2 border-t border-slate-700">
                          <span className="font-bold">New Abilities:</span> {profAbilities.map(a => a?.name).join(', ')}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 border-t border-slate-700 pt-4">
              <p>💡 Advancing your profession grants new professional abilities</p>
            </div>
          </div>
        </div>
      )}

      {/* Class Upgrade Required Modal */}
      {classUpgradeRequired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-nexus-panel border-2 border-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.4)] rounded-2xl max-w-lg w-full p-8 relative overflow-hidden">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 animate-pulse"></div>
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center border-2 border-orange-500 animate-bounce">
                <ArrowBigUpDash size={40} className="text-orange-400" />
              </div>
              <h2 className="text-3xl font-black text-orange-400 uppercase tracking-wide mb-2">New Tier Unlocked!</h2>
              <p className="text-slate-400 text-sm">
                You've reached level <span className="text-white font-bold">{character.level}</span> and unlocked <span className={`font-bold ${TIER_COLORS[classUpgradeRequired.targetTier]?.split(' ')[0] || 'text-orange-400'}`}>{TIER_NAMES[classUpgradeRequired.targetTier]}</span> classes!
              </p>
              <p className="text-orange-300 text-xs mt-2 font-bold">
                Choose a new class to continue your journey.
              </p>
            </div>

            {/* Current Class Info */}
            <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-700">
              <div className="text-xs text-slate-500 uppercase mb-1">Current Class</div>
              <div className="flex items-center gap-2">
                <Swords size={16} className="text-nexus-warn" />
                <span className="font-bold text-slate-200">{character.className}</span>
                {currentDbClass && (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                    {TIER_NAMES[currentDbClass.tier as ClassTier]}
                  </span>
                )}
              </div>
            </div>

            {/* Tier Upgrade Bonus Info */}
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 font-bold text-sm flex items-center gap-2">
                  <Zap size={16} />
                  Tier Upgrade Bonus
                </span>
                <span className="text-yellow-300 font-black text-lg">+{TIER_UPGRADE_ABILITY_BONUS} Ability Points</span>
              </div>
            </div>

            {/* Available Classes */}
            <div className="mb-6">
              <div className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-orange-400" />
                Choose Your {TIER_NAMES[classUpgradeRequired.targetTier]} Class
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {classUpgradeRequired.availableClasses.map(cls => {
                  const tierColor = TIER_COLORS[cls.tier as ClassTier]?.split(' ')[0] || 'text-orange-400';
                  const newTierNum = getTierNumber(cls.tier);
                  return (
                    <button
                      key={cls.id}
                      onClick={() => {
                        if (onDbClassChange) onDbClassChange(cls.id);
                        // Update character with new class AND track highest tier achieved
                        const currentHighest = character.highestTierAchieved || 1;
                        const newHighest = Math.max(currentHighest, newTierNum);
                        // Add current class to simple history (for ability retention)
                        const newHistory = character.classHistory ? [...character.classHistory] : [];
                        if (!newHistory.includes(character.className)) {
                          newHistory.push(character.className);
                        }
                        // Add current class to detailed history with levels (for stat bonus tracking)
                        const newHistoryWithLevels: ClassHistoryEntry[] = character.classHistoryWithLevels ? [...character.classHistoryWithLevels] : [];
                        // Mark any existing active entry as deactivated
                        newHistoryWithLevels.forEach(entry => {
                          if (!entry.deactivatedAtLevel) {
                            entry.deactivatedAtLevel = character.level;
                          }
                        });
                        // Add the old class as a completed entry (if it had any levels)
                        const oldActivationLevel = character.classActivatedAtLevel || 1;
                        if (character.level > oldActivationLevel) {
                          newHistoryWithLevels.push({
                            className: character.className,
                            activatedAtLevel: oldActivationLevel,
                            deactivatedAtLevel: character.level
                          });
                        }
                        updateCharacter({ 
                          ...character, 
                          className: cls.name as ClassName,
                          highestTierAchieved: newHighest,
                          classActivatedAtLevel: character.level, // Track when this class was activated
                          classHistory: newHistory,
                          classHistoryWithLevels: newHistoryWithLevels,
                          history: [`Advanced to ${TIER_NAMES[cls.tier as ClassTier]}: ${cls.name} at Lvl ${character.level} (+${TIER_UPGRADE_ABILITY_BONUS} Ability Points)`, ...character.history]
                        });
                        setPreviousClasses(newHistory);
                        setClassUpgradeRequired(null);
                      }}
                      className="w-full text-left p-4 bg-slate-800/80 hover:bg-orange-900/30 border border-slate-700 hover:border-orange-500 rounded-lg transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold text-lg ${tierColor} group-hover:text-orange-400`}>{cls.name}</span>
                        <ChevronRight size={20} className="text-slate-600 group-hover:text-orange-400 transition-colors" />
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{cls.description || 'No description available.'}</p>
                      {cls.stat_bonuses && Object.keys(cls.stat_bonuses).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(cls.stat_bonuses).map(([stat, bonus]) => (
                            <span key={stat} className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded">
                              {stat} +{bonus}/lvl
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center text-xs text-slate-500 border-t border-slate-700 pt-4">
              <p>⚠️ Class selection is required to continue leveling up</p>
            </div>
          </div>
        </div>
      )}

      {/* Ability Disk Modal */}
      {isDiskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-nexus-panel border border-slate-600 shadow-2xl rounded-xl max-w-lg w-full p-6 relative">
            <button onClick={() => setIsDiskModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
            <div className="flex items-center gap-3 mb-6">
              <Disc className="text-purple-400" size={32} />
              <div>
                <h2 className="text-xl font-bold text-white">Install Ability Disk</h2>
                <p className="text-xs text-slate-400">Select an ability from the database.</p>
              </div>
            </div>
            <div className="relative mb-4">
              <input type="text" placeholder="Search abilities..." value={diskSearch} onChange={(e) => setDiskSearch(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-nexus-accent outline-none" autoFocus />
              <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
            </div>
            <div className="h-60 overflow-y-auto space-y-2 mb-4 bg-slate-900/50 p-2 rounded border border-slate-800">
              {getUnlearnedAbilities().map(ability => (
                <button key={ability.id} onClick={() => handleInstallAbility(ability.name)} className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-nexus-accent rounded flex items-center justify-between group transition-all">
                  <div>
                    <div className="font-bold text-slate-200">{ability.name}</div>
                    <div className="text-xs text-slate-500 truncate">{ability.description}</div>
                  </div>
                  <Plus size={16} className="text-slate-500 group-hover:text-nexus-accent" />
                </button>
              ))}
              {getUnlearnedAbilities().length === 0 && <div className="text-center text-slate-500 py-8 text-sm">{diskSearch ? 'No matching abilities.' : 'No abilities in DB.'}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm relative overflow-hidden group mb-6">
        {character.headerImageUrl && !imageError && (
          <div className="h-32 sm:h-48 w-full overflow-hidden relative border-b border-slate-700">
            <img src={character.headerImageUrl} alt="Character Banner" className="w-full h-full object-cover object-left-top" onError={() => setImageError(true)} />
          </div>
        )}
        <div className="p-6 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="bg-slate-900 border border-nexus-accent text-3xl font-bold text-white font-mono tracking-tighter rounded px-2 py-1 w-full md:w-auto focus:outline-none" autoFocus />
                  <button onClick={handleNameSave} className="p-1 text-nexus-success hover:bg-nexus-success/20 rounded"><Check size={24}/></button>
                  <button onClick={handleNameCancel} className="p-1 text-red-400 hover:bg-red-400/20 rounded"><X size={24}/></button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-white font-mono tracking-tighter drop-shadow-md">{character.name}</h1>
                  <button onClick={() => { setIsEditingName(true); setTempName(character.name); }} className="text-slate-500 hover:text-nexus-accent transition-colors opacity-0 group-hover:opacity-100" title="Edit Name"><Pencil size={16} /></button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-nexus-accent font-semibold">{character.className}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">Level {character.level}</span>
                <button onClick={() => { setIsEditingImage(!isEditingImage); setTempImageUrl(character.headerImageUrl || ''); }} className="text-slate-600 hover:text-slate-300 ml-2 transition-colors opacity-0 group-hover:opacity-100" title="Change Banner Image"><ImageIcon size={14} /></button>
              </div>
              {isEditingImage && (
                <div className="mt-2 flex gap-2 animate-in fade-in slide-in-from-top-1">
                  <input type="text" value={tempImageUrl} onChange={(e) => setTempImageUrl(e.target.value)} placeholder="Paste WebP image URL..." className="text-xs bg-slate-900 border border-slate-600 rounded px-2 py-1 w-64 text-slate-300 outline-none focus:border-nexus-accent" />
                  <button onClick={handleImageSave} className="bg-nexus-success/20 text-nexus-success px-2 py-1 rounded text-xs hover:bg-nexus-success/30">Set</button>
                  <button onClick={() => setIsEditingImage(false)} className="bg-slate-700 text-slate-400 px-2 py-1 rounded text-xs hover:bg-slate-600">Cancel</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-900/50 p-2 px-3 rounded-lg border border-slate-700 h-[50px] backdrop-blur-md">
                <Coins className="text-yellow-400" size={20} />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Credits</div>
                  <div className="text-lg font-bold text-yellow-400 font-mono leading-none mt-1">{character.credits.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700 backdrop-blur-md">
                <button onClick={() => handleLevelChange(-1)} className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-white font-bold transition-colors">-</button>
                <div className="text-center min-w-[60px]">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mb-1">Level</div>
                  <div className="text-xl font-bold text-white font-mono leading-none">{character.level}</div>
                </div>
                <button onClick={() => handleLevelChange(1)} className="w-8 h-8 flex items-center justify-center bg-nexus-accent hover:bg-cyan-600 rounded text-black font-bold transition-colors">+</button>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs mb-1 text-slate-400">
              <span>XP: {character.xp.toLocaleString()}</span>
              <span>Next: {nextLevelTotalXp.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700 relative backdrop-blur-sm">
              <div className="h-full bg-nexus-accent transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-400 font-bold">Health</span>
                <span className="text-slate-200">{getEffectiveAttribute(Attribute.STR) * 2 + character.level * 5} HP</span>
              </div>
              <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden"><div className="h-full bg-red-500 w-full" /></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-400 font-bold">Energy</span>
                <span className="text-slate-200">{getEffectiveAttribute(Attribute.INT) + getEffectiveAttribute(Attribute.MEM)} EP</span>
              </div>
              <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-full" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className="bg-nexus-panel p-4 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2"><Shield size={18} className="text-nexus-accent" />Attributes</h2>
          <div className={`text-xs px-2 py-0.5 rounded-full border ${availableAttributePoints > 0 ? 'bg-nexus-accent/20 border-nexus-accent text-nexus-accent' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>Points: {availableAttributePoints}</div>
        </div>
        <p className="text-xs text-pink-300 mb-3">Pink + values are unbanked level-up points—apply them now and press Save to lock them in.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.keys(character.attributes) as Attribute[]).map((attr) => {
            const pendingInvestment = getPendingAttributeInvestment(attr);
            return (
              <div key={attr} className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-700">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <AttrIcon attr={attr} />
                    <span className="font-bold text-sm text-slate-300">{attr}</span>
                    {attr === Attribute.MEM && <span className="text-[9px] uppercase bg-purple-900/50 text-purple-300 px-1 rounded">-{cdrPercent}% CD</span>}
                    {attr === Attribute.INT && <span className="text-[9px] uppercase bg-blue-900/50 text-blue-300 px-1 rounded">+{durationExtPercent}% Dur</span>}
                  </div>
                  <span className="text-[10px] text-slate-500 truncate w-24">{ATTRIBUTE_DESCRIPTIONS[attr]?.split(',')[0]}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleAttributeChange(attr, -1)} className="w-5 h-5 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-30 text-xs" disabled={character.attributes[attr] <= 3}>-</button>
                  <div className="flex items-center gap-0.5 min-w-[60px] justify-center">
                    <span className="font-mono font-bold text-sm">{character.attributes[attr]}</span>
                    {pendingInvestment > 0 && (
                      <span className="text-[10px] font-bold text-pink-300" title="Unbanked level-up points">
                        +{pendingInvestment}
                      </span>
                    )}
                    {/* Show class bonus in orange */}
                    {getClassOnlyBonus(attr) > 0 && (
                      <span className="text-[10px] font-bold text-orange-400" title="Class bonus">
                        +{getClassOnlyBonus(attr)}
                      </span>
                    )}
                    {/* Show profession bonus in blue */}
                    {getProfessionOnlyBonus(attr) > 0 && (
                      <span className="text-[10px] font-bold text-blue-400" title="Profession bonus">
                        +{getProfessionOnlyBonus(attr)}
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleAttributeChange(attr, 1)} className="w-5 h-5 flex items-center justify-center rounded bg-nexus-accent/20 hover:bg-nexus-accent/40 text-nexus-accent disabled:opacity-30 disabled:bg-slate-800 disabled:text-slate-600 text-xs" disabled={availableAttributePoints <= 0}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equipment Section */}
      <EquipmentSection
        equippedItems={character.equippedItems || {}}
        onEquipmentChange={(equipped: EquippedItems) => updateCharacter({ ...character, equippedItems: equipped })}
        isEditable={true}
        items={items}
      />

      {/* Class */}
      <ClassSelectionModal 
        isOpen={isClassModalOpen} 
        onClose={() => setIsClassModalOpen(false)}
        defaultCategory={modalDefaultCategory}
        lockCategory={modalDefaultCategory === 'professional'}
        onSelectClass={(classId, className) => {
          // Check if we're selecting a profession or a combat class
          if (modalDefaultCategory === 'professional') {
            // Handle profession selection
            const newProfessionHistoryWithLevels: ClassHistoryEntry[] = character.professionHistoryWithLevels ? [...character.professionHistoryWithLevels] : [];
            
            // If there's an existing profession, mark it as deactivated
            if (character.professionName && character.professionActivatedAtLevel) {
              newProfessionHistoryWithLevels.push({
                className: character.professionName,
                activatedAtLevel: character.professionActivatedAtLevel,
                deactivatedAtLevel: character.level
              });
            }

            console.log('✨ Selecting profession:', {
              className,
              level: character.level,
              professionActivatedAtLevel: character.level
            });

            updateCharacter({
              ...character,
              professionName: className,
              professionActivatedAtLevel: character.level,
              professionHistoryWithLevels: newProfessionHistoryWithLevels,
              history: [`Selected profession: ${className} at Lvl ${character.level}`, ...character.history]
            });
          } else {
            // Handle combat class selection
            if (onDbClassChange) onDbClassChange(classId); 
            // Add current class to simple history (for ability retention)
            const newHistory = character.classHistory ? [...character.classHistory] : [];
            if (!newHistory.includes(character.className)) {
              newHistory.push(character.className);
            }
            // Add current class to detailed history with levels (for stat bonus tracking)
            const newHistoryWithLevels: ClassHistoryEntry[] = character.classHistoryWithLevels ? [...character.classHistoryWithLevels] : [];
            // Mark any existing active entry as deactivated
            newHistoryWithLevels.forEach(entry => {
              if (!entry.deactivatedAtLevel) {
                entry.deactivatedAtLevel = character.level;
              }
            });
            // Add the old class as a completed entry (if it had any levels)
            const oldActivationLevel = character.classActivatedAtLevel || 1;
            if (character.level > oldActivationLevel) {
              newHistoryWithLevels.push({
                className: character.className,
                activatedAtLevel: oldActivationLevel,
                deactivatedAtLevel: character.level
              });
            }
            updateCharacter({ 
              ...character, 
              className: className as ClassName, 
              classActivatedAtLevel: character.level,
              classHistory: newHistory,
              classHistoryWithLevels: newHistoryWithLevels,
              history: [`Changed class to ${className} at Lvl ${character.level}`, ...character.history]
            }); 
            setPreviousClasses(newHistory);
          }
          
          setIsClassModalOpen(false);
          setModalDefaultCategory('combat'); // Reset to default
        }}
        currentClassId={currentDbClassId ?? null} 
        characterLevel={character.level} 
      />
      <div className="bg-nexus-panel p-6 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-700 pb-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsClassSectionCollapsed(!isClassSectionCollapsed)}>
            {isClassSectionCollapsed ? <ChevronRight size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
            <Swords size={20} className="text-nexus-warn" />
            <h2 className="text-xl font-bold text-slate-200">Class</h2>
          </div>
          <button onClick={() => setIsClassModalOpen(true)} className="text-xs px-3 py-1 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded border border-orange-600/30 hover:border-orange-500 transition-colors">Change Class</button>
        </div>
        {!isClassSectionCollapsed && (
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-4">
          <h3 className="text-lg font-bold text-nexus-warn">{character.className}</h3>
          {currentDbClass && <p className="text-sm text-slate-300 mt-1">{currentDbClass.description}</p>}
          {currentDbClass?.stat_bonuses && Object.keys(currentDbClass.stat_bonuses).length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="text-xs text-slate-500 uppercase mb-2">
                Class Bonuses (per level × {getLevelsSinceClassActivation()} levels since Lvl {character.classActivatedAtLevel || 1})
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(currentDbClass.stat_bonuses).map(([stat, bonus]) => (
                  <span key={stat} className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-700/30">
                    {stat}: +{bonus}/lvl = <strong>+{bonus * getLevelsSinceClassActivation()}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
          {!currentDbClassId && <div className="mt-3 p-2 bg-orange-900/20 border border-orange-700/30 rounded text-xs text-orange-400">Click "Change Class" to select a class from the database.</div>}
        </div>

        )}
        
        {/* Class History - Only show current and previous tiers */}
        {!isClassSectionCollapsed && dbClasses.length > 0 && currentDbClass && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Scroll size={14} />
              Class Progression
            </h4>
            <div className="space-y-3">
              {/* Only show tiers up to and including current tier */}
              {['tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5', 'tier-6'].map(tier => {
                const tierNum = parseInt(tier.replace('tier-', ''));
                const currentTierNum = getTierNumber(currentDbClass.tier);
                
                // Only show current tier and previous tiers
                if (tierNum > currentTierNum) return null;
                
                const tierClasses = dbClasses.filter(c => c.tier === tier);
                if (tierClasses.length === 0) return null;
                
                const tierColors = {
                  1: 'border-slate-600 text-slate-400',
                  2: 'border-blue-600 text-blue-400',
                  3: 'border-purple-600 text-purple-400',
                  4: 'border-yellow-600 text-yellow-400',
                  5: 'border-orange-600 text-orange-400',
                  6: 'border-red-600 text-red-400'
                };
                const color = tierColors[tierNum as keyof typeof tierColors] || tierColors[1];
                
                // Filter to only show classes from this tier that were held by character
                const relevantClasses = tierClasses.filter(cls => {
                  const isCurrent = cls.name === character.className;
                  const isPrevious = previousClasses.includes(cls.name);
                  return isCurrent || isPrevious;
                });
                
                if (relevantClasses.length === 0) return null;
                
                return (
                  <div key={tier}>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${color.split(' ')[1]}`}>
                      {tierNum === currentTierNum ? '★ Current - ' : ''}{TIER_NAMES[tier as ClassTier]}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {relevantClasses.map(cls => {
                        const isCurrent = cls.name === character.className;
                        const isPrevious = previousClasses.includes(cls.name);
                        
                        return (
                          <div
                            key={cls.id}
                            className={`p-2 px-3 rounded-lg border text-xs transition-all ${
                              isCurrent 
                                ? `${color.replace('text-', 'bg-').replace('400', '900/40')} ${color.replace('600', '500')} font-bold`
                                : isPrevious
                                ? 'bg-slate-800/30 border-slate-700 text-slate-400'
                                : 'bg-slate-900/30 border-slate-800 text-slate-600'
                            }`}
                            title={`${cls.name}${cls.description ? ': ' + cls.description : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              {isCurrent && <span className="text-yellow-400">★</span>}
                              <span className={isCurrent ? color.split(' ')[1] : ''}>{cls.name}</span>
                              {isPrevious && !isCurrent && <span className="text-[9px] text-slate-600">(prev)</span>}
                            </div>
                            {cls.stat_bonuses && Object.keys(cls.stat_bonuses).length > 0 && (
                              <div className="text-[9px] text-slate-500 mt-1">
                                {Object.entries(cls.stat_bonuses).map(([s, v]) => `${s}+${v}`).join(' ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Profession - separate section for professions */}
      <div className="bg-nexus-panel p-6 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-700 pb-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsProfessionSectionCollapsed(!isProfessionSectionCollapsed)}>
            {isProfessionSectionCollapsed ? <ChevronRight size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-bold text-slate-200">Profession</h2>
          </div>
          {character.level >= 16 && (
            <button onClick={() => {
              setModalDefaultCategory('professional');
              setIsClassModalOpen(true);
            }} className="text-xs px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 hover:border-blue-500 transition-colors">
              {character.professionName ? 'Change' : 'Select'} Profession
            </button>
          )}
        </div>
        {!isProfessionSectionCollapsed && (
          <>
            {character.professionName ? (
              (() => {
                const currentProfession = dbProfessions.find(p => p.name === character.professionName);
                if (!currentProfession) return null;

                // Calculate levels held for display
                const levelsHeld = character.professionActivatedAtLevel
                  ? Math.max(0, character.level - character.professionActivatedAtLevel)
                  : 0;
                
                return (
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-lg font-bold text-blue-400">{currentProfession.name}</h3>
                    <p className="text-sm text-slate-300 mt-1">{currentProfession.description}</p>
                    {currentProfession.stat_bonuses && Object.keys(currentProfession.stat_bonuses).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <div className="text-xs text-slate-500 uppercase mb-2">
                          Profession Bonuses (per level × {levelsHeld} levels since Lvl {character.professionActivatedAtLevel || character.level})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(currentProfession.stat_bonuses).map(([stat, bonus]) => (
                            <span key={stat} className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-700/30">
                              {stat}: +{bonus}/lvl = <strong>+{bonus * levelsHeld}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8 text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No profession selected</p>
                <p className="text-xs text-slate-600 mt-1">
                  {character.level >= 16 
                    ? 'Click "Select Profession" to choose your profession'
                    : 'Professions unlock at level 16'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Abilities */}
      <div className="bg-nexus-panel p-6 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-2">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2"><Zap size={20} className="text-yellow-500" />Abilities</h2>
          <div className="flex items-center gap-2">
            <div className={`text-sm px-3 py-1 rounded-full border ${availableAbilityPoints > 0 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-slate-800 border-slate-600 text-slate-500'}`} title={tierBonusAbilityPoints > 0 ? `Base: ${cumulative.abilityPoints} + Tier Bonus: ${tierBonusAbilityPoints}` : undefined}>
              Points: {availableAbilityPoints}
              {tierBonusAbilityPoints > 0 && <span className="text-[10px] ml-1 text-orange-400">(+{tierBonusAbilityPoints} tier)</span>}
            </div>
            <button onClick={() => setIsDiskModalOpen(true)} className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-purple-600 border border-slate-600 hover:border-purple-400 rounded-full transition-colors text-slate-400 hover:text-white group" title="Install Ability Disk"><Plus size={16} /></button>
          </div>
        </div>

        {/* Combat Abilities Section */}
        <div className="mb-6">
          <div 
            className="flex items-center gap-2 cursor-pointer mb-4 p-2 hover:bg-slate-800/30 rounded transition-colors"
            onClick={() => setCollapsedAbilities(prev => {
              const next = new Set(prev);
              if (next.has('combat-section')) next.delete('combat-section');
              else next.add('combat-section');
              return next;
            })}
          >
            {collapsedAbilities.has('combat-section') ? <ChevronRight size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
            <Swords size={18} className="text-orange-400" />
            <h3 className="text-lg font-bold text-slate-300">Combat Abilities</h3>
          </div>
          {!collapsedAbilities.has('combat-section') && (
            <div className="space-y-4">
              {getCombatAbilities().map(ability => {
            const currentLvl = character.abilities[ability.name] || 0;
            const canUpgrade = availableAbilityPoints > 0 && currentLvl < ability.maxLevel;
            const canDowngrade = currentLvl > 0;
            const isCollapsed = collapsedAbilities.has(ability.id);
            const currentTier = ability.tiers.find(t => t.level === currentLvl);
            const nextTier = ability.tiers.find(t => t.level === currentLvl + 1);
            const canEvolve = currentLvl === ability.maxLevel && ability.evolutionId && availableAbilityPoints > 0;
            const evolutionAbility = ability.evolutionId ? findAbilityById(ability.evolutionId) : null;
            const adjustedCooldown = currentTier?.cooldown ? applyCooldownReduction(currentTier.cooldown, effectiveMEM) : undefined;
            const adjustedDuration = currentTier?.duration ? applyDurationExtension(currentTier.duration, effectiveINT) : undefined;
            return (
              <div key={ability.id} className="flex flex-col bg-slate-800/30 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
                <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-800/50 transition-colors rounded-t" onClick={() => toggleAbilityCollapse(ability.id)}>
                  <div className="flex items-center gap-2">{isCollapsed ? <ChevronRight size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}<span className="font-semibold text-slate-200">{ability.name}</span></div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="text-xs text-slate-500 font-mono">Lvl {currentLvl}/{ability.maxLevel}</div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleAbilityChange(ability.name, -1, ability.maxLevel)} disabled={!canDowngrade} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${canDowngrade ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}><ChevronLeft size={14} /></button>
                      <button onClick={() => handleAbilityChange(ability.name, 1, ability.maxLevel)} disabled={!canUpgrade} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${canUpgrade ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><ChevronRight size={14} /></button>
                    </div>
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-slate-400 mb-3 pl-6 border-l-2 border-slate-700/50">{ability.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/40 p-2 rounded ml-6">
                      {currentTier ? (
                        <>
                          <div className="text-slate-500">Duration: <span className="text-slate-300">{adjustedDuration || currentTier.duration || '-'}</span></div>
                          <div className="text-slate-500">Cooldown: <span className="text-slate-300">{adjustedCooldown || currentTier.cooldown || '-'}</span></div>
                          <div className="col-span-2 text-blue-300 border-t border-slate-800 pt-1 mt-1">Current: {currentTier.effectDescription}</div>
                        </>
                      ) : <div className="col-span-2 text-slate-600 italic">Not learned yet.</div>}
                      {nextTier && <div className="col-span-2 text-slate-500 border-t border-slate-800 pt-1 mt-1 flex items-center gap-1"><ArrowBigUpDash size={12} className="text-green-500" />Next: {nextTier.effectDescription}</div>}
                    </div>
                    {canEvolve && evolutionAbility && (
                      <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between ml-6">
                        <div className="text-xs text-purple-400"><span className="font-bold">Evolution Available:</span> {evolutionAbility.name}</div>
                        <button onClick={() => handleEvolveAbility(ability.name, ability.evolutionId!)} className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs font-bold transition-all animate-pulse"><Sparkles size={12} />Evolve</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
              })}
            </div>
          )}
        </div>

        {/* Professional Abilities Section */}
        {character.professionName && getProfessionalAbilities().length > 0 && (
          <div className="mb-6">
            <div 
              className="flex items-center gap-2 cursor-pointer mb-4 p-2 hover:bg-slate-800/30 rounded transition-colors"
              onClick={() => setCollapsedAbilities(prev => {
                const next = new Set(prev);
                if (next.has('professional-section')) next.delete('professional-section');
                else next.add('professional-section');
                return next;
              })}
            >
              {collapsedAbilities.has('professional-section') ? <ChevronRight size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-300">Professional Abilities</h3>
            </div>
            {!collapsedAbilities.has('professional-section') && (
              <div className="space-y-4">
                {getProfessionalAbilities().map(ability => {
                  const currentLvl = character.abilities[ability.name] || 0;
                  const canUpgrade = availableAbilityPoints > 0 && currentLvl < ability.maxLevel;
                  const canDowngrade = currentLvl > 0;
                  const isCollapsed = collapsedAbilities.has(ability.id);
                  const currentTier = ability.tiers.find(t => t.level === currentLvl);
                  const nextTier = ability.tiers.find(t => t.level === currentLvl + 1);
                  const adjustedCooldown = currentTier?.cooldown ? applyCooldownReduction(currentTier.cooldown, effectiveMEM) : undefined;
                  const adjustedDuration = currentTier?.duration ? applyDurationExtension(currentTier.duration, effectiveINT) : undefined;
                  return (
                    <div key={ability.id} className="flex flex-col bg-slate-800/30 rounded border border-blue-700/50 hover:border-blue-600 transition-colors">
                      <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-800/50 transition-colors rounded-t" onClick={() => toggleAbilityCollapse(ability.id)}>
                        <div className="flex items-center gap-2">{isCollapsed ? <ChevronRight size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}<span className="font-semibold text-blue-300">{ability.name}</span></div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="text-xs text-slate-500 font-mono">Lvl {currentLvl}/{ability.maxLevel}</div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleAbilityChange(ability.name, -1, ability.maxLevel)} disabled={!canDowngrade} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${canDowngrade ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}><ChevronLeft size={14} /></button>
                            <button onClick={() => handleAbilityChange(ability.name, 1, ability.maxLevel)} disabled={!canUpgrade} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${canUpgrade ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><ChevronRight size={14} /></button>
                          </div>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-sm text-slate-400 mb-3 pl-6 border-l-2 border-blue-700/50">{ability.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/40 p-2 rounded ml-6">
                            {currentTier ? (
                              <>
                                <div className="text-slate-500">Duration: <span className="text-slate-300">{adjustedDuration || currentTier.duration || '-'}</span></div>
                                <div className="text-slate-500">Cooldown: <span className="text-slate-300">{adjustedCooldown || currentTier.cooldown || '-'}</span></div>
                                <div className="col-span-2 text-blue-300 border-t border-slate-800 pt-1 mt-1">Current: {currentTier.effectDescription}</div>
                              </>
                            ) : <div className="col-span-2 text-slate-600 italic">Not learned yet.</div>}
                            {nextTier && <div className="col-span-2 text-slate-500 border-t border-slate-800 pt-1 mt-1 flex items-center gap-1"><ArrowBigUpDash size={12} className="text-green-500" />Next: {nextTier.effectDescription}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Download Button */}
      <div className="flex justify-end">
        <button onClick={handleStatusDownload} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2 rounded-lg transition-all text-sm font-medium"><Download size={18} /><span>Download Status Sheet</span></button>
      </div>

      {/* Battle Simulator */}
      <BattleSimulator
        character={character}
        monsters={monsters}
        onApplyResult={handleApplyBattle}
        currentDbClass={currentDbClass}
        items={items}
      />

      {/* Mission Log */}
      <div className="bg-nexus-panel p-6 rounded-xl border border-slate-700">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2"><Scroll size={20} className="text-slate-400" /><h2 className="text-xl font-bold text-slate-200">Adventure Log</h2></div>
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto shadow-inner border border-slate-800">
          {character.history.length === 0 ? <div className="text-slate-600 italic text-center mt-20">No data recorded.</div> : character.history.map((entry, idx) => (<div key={idx} className="mb-2 border-b border-slate-800 pb-2 last:border-0 last:pb-0"><span className="text-nexus-accent mr-2">[{character.history.length - idx}]</span><span className="text-slate-300">{entry}</span></div>))}
        </div>
      </div>
    </div>
  );
};
