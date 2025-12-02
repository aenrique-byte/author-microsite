
import React, { useState } from 'react';
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
  ChevronUp,
  Coins,
  Pencil,
  Check,
  X,
  Sparkles,
  ArrowBigUpDash,
  Scroll,
  Trophy,
  Star,
  Clock,
  Lock,
  Plus,
  Disc,
  Search,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { Attribute, Character, ClassName, CharacterClass, Monster, Ability } from '../types';
import { ATTRIBUTE_DESCRIPTIONS, CLASS_REGISTRY, getTotalXpRequired, ABILITY_REGISTRY, getCumulativePoints, getLevelRewards, getCooldownReduction, applyCooldownReduction, getDurationExtension, applyDurationExtension } from '../constants';
import { BattleSimulator } from './BattleSimulator';

interface CharacterSheetProps {
  character: Character;
  updateCharacter: (c: Character) => void;
  monsters: Monster[];
}

interface LevelUpData {
    oldLevel: number;
    newLevel: number;
    attrGained: number;
    abilGained: number;
    unlocks: string[];
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, updateCharacter, monsters }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(character.name);
  
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(character.headerImageUrl || '');
  const [imageError, setImageError] = useState(false);

  const [levelUpNotification, setLevelUpNotification] = useState<LevelUpData | null>(null);
  
  // Ability Disk State
  const [isDiskModalOpen, setIsDiskModalOpen] = useState(false);
  const [diskSearch, setDiskSearch] = useState('');
  
  // UI State
  const [collapsedAbilities, setCollapsedAbilities] = useState<Set<string>>(new Set());

  // Derived calculations using new cumulative math
  const cumulative = getCumulativePoints(character.level);
  
  const usedAttributePoints = (Object.values(character.attributes) as number[]).reduce((sum, val) => sum + val, 0) - 18; // Base 3 * 6 = 18
  const availableAttributePoints = Math.max(0, cumulative.attributePoints - usedAttributePoints);
  
  const usedAbilityPoints = (Object.values(character.abilities) as number[]).reduce((sum, val) => sum + val, 0);
  const availableAbilityPoints = Math.max(0, cumulative.abilityPoints - usedAbilityPoints);

  const currentClass: CharacterClass = CLASS_REGISTRY[character.className];

  // XP Calculations
  const currentLevelTotalXp = getTotalXpRequired(character.level);
  const nextLevelTotalXp = getTotalXpRequired(character.level + 1);
  const xpForCurrentLevel = nextLevelTotalXp - currentLevelTotalXp;
  const xpProgress = character.xp - currentLevelTotalXp;
  const xpPercent = Math.min(100, Math.max(0, (xpProgress / xpForCurrentLevel) * 100));

  // CDR Calc
  const cdrPercent = (getCooldownReduction(character.attributes.MEM) * 100).toFixed(1);
  // Duration Extension Calc
  const durationExtPercent = (getDurationExtension(character.attributes.INT) * 100).toFixed(1);

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
    setImageError(false); // Reset error state on new image
  };

  const handleAttributeChange = (attr: Attribute, delta: number) => {
    const currentVal = character.attributes[attr];
    if (delta > 0 && availableAttributePoints <= 0) return;
    if (delta < 0 && currentVal <= 3) return; // Minimum 3
    
    updateCharacter({
      ...character,
      attributes: {
        ...character.attributes,
        [attr]: currentVal + delta
      }
    });
  };

  const handleLevelChange = (delta: number) => {
    // Manual Level override for debugging/admin
    const newLevel = Math.max(1, character.level + delta);
    let newClass = character.className;
    let newXp = character.xp;
    
    // Auto-adjust XP to match level floor if leveling up manually
    if (delta > 0 && character.xp < getTotalXpRequired(newLevel)) {
        newXp = getTotalXpRequired(newLevel);
    }

    if (newLevel < 10 && character.className !== ClassName.RECRUIT) {
      newClass = ClassName.RECRUIT;
    }

    updateCharacter({
      ...character,
      level: newLevel,
      xp: newXp,
      className: newClass
    });
  };

  const handleClassSelect = (clsName: ClassName) => {
    const cls = CLASS_REGISTRY[clsName];
    const newInv = [...character.inventory];
    if (!newInv.includes(cls.startingItem)) {
      newInv.push(cls.startingItem);
    }

    updateCharacter({
      ...character,
      className: clsName,
      inventory: newInv
    });
  };

  const handleAbilityChange = (abilityName: string, delta: number, maxLevel: number) => {
    const currentLevel = character.abilities[abilityName] || 0;
    
    if (delta > 0) {
        if (availableAbilityPoints <= 0) return;
        if (currentLevel >= maxLevel) return;
    } else {
        if (currentLevel <= 0) return;
    }

    const newAbilities = { ...character.abilities };
    if (currentLevel + delta <= 0) {
        delete newAbilities[abilityName];
    } else {
        newAbilities[abilityName] = currentLevel + delta;
    }

    updateCharacter({
      ...character,
      abilities: newAbilities
    });
  };

  const handleInstallAbility = (abilityName: string) => {
    // Adds ability at Level 1 immediately (Disk Install)
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

  const handleEvolveAbility = (oldAbilityId: string, evolutionId: string) => {
     const newAbilities = { ...character.abilities };
     const oldName = ABILITY_REGISTRY[oldAbilityId]?.name;
     if (oldName) delete newAbilities[oldName];

     const newName = ABILITY_REGISTRY[evolutionId]?.name;
     if (newName) newAbilities[newName] = 1;

     updateCharacter({
        ...character,
        abilities: newAbilities
     });
  };

  const toggleAbilityCollapse = (abilityId: string) => {
    setCollapsedAbilities(prev => {
        const next = new Set(prev);
        if (next.has(abilityId)) {
            next.delete(abilityId);
        } else {
            next.add(abilityId);
        }
        return next;
    });
  };

  const handleApplyBattle = (xp: number, credits: number, description: string, loot: string[]) => {
    let newXp = character.xp + xp;
    let newLevel = character.level;
    let levelChanged = false;

    // Check for Level Up Loop
    while (newXp >= getTotalXpRequired(newLevel + 1)) {
        newLevel++;
        levelChanged = true;
    }

    // Trigger Notification if level changed
    if (levelChanged) {
        // Calculate total points gained across all new levels
        let totalAttrGained = 0;
        let totalAbilGained = 0;
        let allUnlocks: string[] = [];
        
        for (let l = character.level + 1; l <= newLevel; l++) {
            const rewards = getLevelRewards(l);
            totalAttrGained += rewards.attributePoints;
            totalAbilGained += rewards.abilityPoints;
            allUnlocks = [...allUnlocks, ...rewards.unlocks];
        }

        setLevelUpNotification({
            oldLevel: character.level,
            newLevel: newLevel,
            attrGained: totalAttrGained,
            abilGained: totalAbilGained,
            unlocks: allUnlocks
        });
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
    
    // Header
    let content = `[Status]
Name: ${character.name}
Level: ${character.level}
Combat Path: ${character.className}
Professional Path: None
Experience Points Total/Needed for next level: ${character.xp.toLocaleString()} / ${nextXp.toLocaleString()}
Credits: ${character.credits.toLocaleString()}

[Attributes]
`;

    // Attributes
    (Object.entries(character.attributes) as [Attribute, number][]).forEach(([attr, val]) => {
        content += `${attr}: ${val}\n`;
    });
    content += '\n[Abilities]\n';

    // Abilities Logic
    const learnedAbilityNames = Object.keys(character.abilities);
    const printedAbilities = new Set<string>();

    // Helper to print a class section
    const printClassAbilities = (cls: CharacterClass) => {
        const classAbilities = cls.abilities.filter(a => character.abilities[a.name]);
        if (classAbilities.length > 0) {
            content += `\n-- ${cls.name} --\n`;
            classAbilities.forEach(a => {
                if (!printedAbilities.has(a.name)) {
                    const lvl = character.abilities[a.name];
                    content += `${a.name} (Lvl ${lvl})\n`;
                    content += `${a.description}\n\n`;
                    printedAbilities.add(a.name);
                }
            });
        }
    };

    // Print Full Lineage for Status Sheet
    const lineage = getClassLineage(character.className);
    lineage.forEach(cls => {
        printClassAbilities(cls);
    });

    // General / Other (Disks or Evolutions)
    const leftovers = learnedAbilityNames.filter(name => !printedAbilities.has(name));
    if (leftovers.length > 0) {
        content += `\n-- General / Advanced --\n`;
        leftovers.forEach(name => {
            const lvl = character.abilities[name];
            // Lookup description from registry if possible
            const def = Object.values(ABILITY_REGISTRY).find(a => a.name === name);
            const desc = def ? def.description : 'Custom/Unknown Ability';
            
            content += `${name} (Lvl ${lvl})\n`;
            content += `${desc}\n\n`;
        });
    }

    // Download Logic
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

  // Helper to get class lineage (e.g., Recruit -> Scout -> Assassin)
  const getClassLineage = (currentClsName: ClassName): CharacterClass[] => {
    const lineage = [CLASS_REGISTRY[currentClsName]];
    let curr = currentClsName;
    
    // Safety break loop
    let attempts = 0;
    while (attempts < 5) {
        attempts++;
        // Find parent: who lists 'curr' in their upgrades?
        const parent = Object.values(CLASS_REGISTRY).find(c => c.upgrades?.includes(curr));
        if (!parent) break;
        lineage.unshift(parent);
        curr = parent.name;
    }
    return lineage;
  };

  const getDisplayAbilities = () => {
    const lineage = getClassLineage(character.className);
    
    // Gather all abilities from lineage
    const displayList: Ability[] = [];
    const addedNames = new Set<string>();

    // Add lineage abilities
    lineage.forEach(cls => {
        cls.abilities.forEach(ability => {
            if (!addedNames.has(ability.name)) {
                displayList.push(ability);
                addedNames.add(ability.name);
            }
        });
    });

    // Add learned abilities not in lineage
    Object.keys(character.abilities).forEach(learnedName => {
        if (!addedNames.has(learnedName)) {
            const def = Object.values(ABILITY_REGISTRY).find(a => a.name === learnedName);
            if (def) {
                displayList.push(def);
                addedNames.add(def.name);
            } else {
                displayList.push({
                    id: learnedName,
                    name: learnedName,
                    description: 'Unknown Ability',
                    maxLevel: 10,
                    tiers: []
                });
                addedNames.add(learnedName);
            }
        }
    });

    return displayList;
  };

  // Filter abilities for the Disk Modal
  const getUnlearnedAbilities = () => {
    const learnedSet = new Set(Object.keys(character.abilities));
    return Object.values(ABILITY_REGISTRY)
        .filter(a => !learnedSet.has(a.name))
        .filter(a => a.name.toLowerCase().includes(diskSearch.toLowerCase()));
  };

  return (
    <div className="space-y-6 pb-20 relative">
      
      {/* Level Up Notification Drawer/Overlay */}
      {levelUpNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-nexus-panel border-2 border-nexus-accent shadow-[0_0_50px_rgba(6,182,212,0.3)] rounded-2xl max-w-md w-full p-8 relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-nexus-accent"></div>
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-nexus-accent/20 rounded-full blur-3xl"></div>
                
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
                    {levelUpNotification.unlocks.length > 0 && (
                        <div className="bg-nexus-accent/10 p-3 rounded-lg border border-nexus-accent/30">
                            <div className="text-nexus-accent text-xs uppercase font-bold tracking-widest mb-2 flex items-center justify-center gap-1">
                                <Star size={12} /> New Features Unlocked
                            </div>
                            {levelUpNotification.unlocks.map((u, i) => (
                                <div key={i} className="text-white font-bold text-sm">{u}</div>
                            ))}
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => setLevelUpNotification(null)}
                    className="w-full py-3 bg-nexus-accent hover:bg-cyan-400 text-black font-bold text-lg rounded-lg transition-all transform hover:scale-105"
                >
                    CONTINUE
                </button>
            </div>
        </div>
      )}

      {/* Ability Disk Installation Modal */}
      {isDiskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
             <div className="bg-nexus-panel border border-slate-600 shadow-2xl rounded-xl max-w-lg w-full p-6 relative">
                 <button 
                    onClick={() => setIsDiskModalOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                 >
                    <X size={24} />
                 </button>

                 <div className="flex items-center gap-3 mb-6">
                    <Disc className="text-purple-400 animate-spin-slow" size={32} />
                    <div>
                        <h2 className="text-xl font-bold text-white">Install Ability Disk</h2>
                        <p className="text-xs text-slate-400">Insert data disk to learn new sub-routines.</p>
                    </div>
                 </div>

                 <div className="relative mb-4">
                    <input 
                        type="text"
                        placeholder="Search or Enter Custom Ability Name..."
                        value={diskSearch}
                        onChange={(e) => setDiskSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-nexus-accent outline-none"
                        autoFocus
                    />
                    <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
                 </div>

                 <div className="h-60 overflow-y-auto custom-scrollbar space-y-2 mb-4 bg-slate-900/50 p-2 rounded border border-slate-800">
                    {diskSearch.length > 0 && getUnlearnedAbilities().length === 0 && (
                        <div 
                            onClick={() => handleInstallAbility(diskSearch)}
                            className="p-3 bg-slate-800 hover:bg-purple-900/30 border border-dashed border-slate-700 hover:border-purple-500 rounded cursor-pointer flex items-center justify-between group"
                        >
                            <span className="text-slate-300 font-mono">Install Custom: "{diskSearch}"</span>
                            <Plus size={16} className="text-purple-400 group-hover:scale-110 transition-transform"/>
                        </div>
                    )}
                    
                    {getUnlearnedAbilities().map(ability => (
                        <button
                            key={ability.id}
                            onClick={() => handleInstallAbility(ability.name)}
                            className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-nexus-accent rounded flex items-center justify-between group transition-all"
                        >
                            <div>
                                <div className="font-bold text-slate-200">{ability.name}</div>
                                <div className="text-xs text-slate-500 truncate">{ability.description}</div>
                            </div>
                            <Plus size={16} className="text-slate-500 group-hover:text-nexus-accent" />
                        </button>
                    ))}
                    
                    {getUnlearnedAbilities().length === 0 && diskSearch.length === 0 && (
                        <div className="text-center text-slate-500 py-8 text-sm">
                            No compatible ability disks found in database.
                        </div>
                    )}
                 </div>

                 <div className="text-xs text-yellow-500/80 bg-yellow-900/20 p-2 rounded border border-yellow-900/50">
                    <span className="font-bold">Note:</span> Installing an Ability Disk grants Level 1 proficiency immediately without spending Ability Points.
                 </div>
             </div>
        </div>
      )}

      {/* Header Image & Stats */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm relative overflow-hidden group mb-6">
        
        {/* Banner Image */}
        {character.headerImageUrl && !imageError && (
            <div className="h-32 sm:h-48 w-full overflow-hidden relative border-b border-slate-700">
                <img 
                    src={character.headerImageUrl} 
                    alt="Character Banner" 
                    className="w-full h-full object-cover object-center opacity-60 group-hover:opacity-80 transition-opacity duration-500" 
                    onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
            </div>
        )}

        <div className="p-6 relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-nexus-accent/20 transition-colors pointer-events-none" />
             
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    {isEditingName ? (
                    <div className="flex items-center gap-2 mb-1">
                        <input 
                        type="text" 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="bg-slate-900 border border-nexus-accent text-3xl font-bold text-white font-mono tracking-tighter rounded px-2 py-1 w-full md:w-auto focus:outline-none"
                        autoFocus
                        />
                        <button onClick={handleNameSave} className="p-1 text-nexus-success hover:bg-nexus-success/20 rounded"><Check size={24}/></button>
                        <button onClick={handleNameCancel} className="p-1 text-red-400 hover:bg-red-400/20 rounded"><X size={24}/></button>
                    </div>
                    ) : (
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-bold text-white font-mono tracking-tighter drop-shadow-md">{character.name}</h1>
                        <button 
                        onClick={() => { setIsEditingName(true); setTempName(character.name); }}
                        className="text-slate-500 hover:text-nexus-accent transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit Name"
                        >
                        <Pencil size={16} />
                        </button>
                    </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-nexus-accent font-semibold">{character.className}</span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400">Level {character.level}</span>
                        
                        <button 
                             onClick={() => { setIsEditingImage(!isEditingImage); setTempImageUrl(character.headerImageUrl || ''); }}
                             className="text-slate-600 hover:text-slate-300 ml-2 transition-colors opacity-0 group-hover:opacity-100"
                             title="Change Banner Image"
                        >
                            <ImageIcon size={14} />
                        </button>
                    </div>

                    {isEditingImage && (
                        <div className="mt-2 flex gap-2 animate-in fade-in slide-in-from-top-1">
                            <input 
                                type="text"
                                value={tempImageUrl}
                                onChange={(e) => setTempImageUrl(e.target.value)}
                                placeholder="Paste WebP image URL..."
                                className="text-xs bg-slate-900 border border-slate-600 rounded px-2 py-1 w-64 text-slate-300 outline-none focus:border-nexus-accent"
                            />
                            <button onClick={handleImageSave} className="bg-nexus-success/20 text-nexus-success px-2 py-1 rounded text-xs hover:bg-nexus-success/30">Set</button>
                            <button onClick={() => setIsEditingImage(false)} className="bg-slate-700 text-slate-400 px-2 py-1 rounded text-xs hover:bg-slate-600">Cancel</button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Credits Box */}
                    <div className="flex items-center gap-2 bg-slate-900/50 p-2 px-3 rounded-lg border border-slate-700 h-[50px] backdrop-blur-md">
                        <Coins className="text-yellow-400" size={20} />
                        <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Credits</div>
                        <div className="text-lg font-bold text-yellow-400 font-mono leading-none mt-1">{character.credits.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Level Controls */}
                    <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700 backdrop-blur-md">
                        <button 
                            onClick={() => handleLevelChange(-1)}
                            className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-white font-bold transition-colors"
                        >-</button>
                        <div className="text-center min-w-[60px]">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mb-1">Level</div>
                        <div className="text-xl font-bold text-white font-mono leading-none">{character.level}</div>
                        </div>
                        <button 
                            onClick={() => handleLevelChange(1)}
                            className="w-8 h-8 flex items-center justify-center bg-nexus-accent hover:bg-cyan-600 rounded text-black font-bold transition-colors"
                        >+</button>
                    </div>
                </div>
             </div>

             {/* XP Bar */}
             <div className="mt-6">
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                    <span>XP: {character.xp.toLocaleString()}</span>
                    <span>Next: {nextLevelTotalXp.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700 relative backdrop-blur-sm">
                    <div 
                    className="h-full bg-nexus-accent transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                    style={{ width: `${xpPercent}%` }}
                    />
                </div>
             </div>

             {/* Resources Bars */}
             <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-red-400 font-bold shadow-black drop-shadow-sm">Health</span>
                        <span className="text-slate-200 shadow-black drop-shadow-sm">{character.attributes.STR * 2 + character.level * 5} HP</span>
                    </div>
                    <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full bg-red-500 w-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-400 font-bold shadow-black drop-shadow-sm">Energy</span>
                        <span className="text-slate-200 shadow-black drop-shadow-sm">{character.attributes.INT + character.attributes.MEM} EP</span>
                    </div>
                    <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full bg-blue-500 w-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                </div>
             </div>
        </div>
      </div>

      {/* Attributes - Compact Grid */}
      <div className="bg-nexus-panel p-4 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Shield size={18} className="text-nexus-accent" />
              Attributes
            </h2>
            <div className={`text-xs px-2 py-0.5 rounded-full border ${availableAttributePoints > 0 ? 'bg-nexus-accent/20 border-nexus-accent text-nexus-accent' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>
              Points: {availableAttributePoints}
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.keys(character.attributes) as Attribute[]).map((attr) => {
                const isPrimary = currentClass.primaryAttribute === attr;
                const isSecondary = currentClass.secondaryAttribute === attr;
                return (
                    <div key={attr} className={`flex items-center justify-between p-2 rounded bg-slate-800/50 border ${isPrimary ? 'border-green-500/40' : isSecondary ? 'border-blue-500/40' : 'border-slate-700'}`}>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <AttrIcon attr={attr} />
                                <span className={`font-bold text-sm ${isPrimary ? 'text-green-400' : isSecondary ? 'text-blue-400' : 'text-slate-300'}`}>{attr}</span>
                                {isPrimary && <span className="text-[9px] uppercase bg-green-900/50 text-green-400 px-1 rounded">PRI</span>}
                                {isSecondary && <span className="text-[9px] uppercase bg-blue-900/50 text-blue-400 px-1 rounded">SEC</span>}
                                {attr === Attribute.MEM && (
                                   <span className="text-[9px] uppercase bg-purple-900/50 text-purple-300 px-1 rounded" title="Cooldown Reduction">
                                     -{cdrPercent}% CD
                                   </span>
                                )}
                                {attr === Attribute.INT && (
                                   <span className="text-[9px] uppercase bg-blue-900/50 text-blue-300 px-1 rounded" title="Duration Extension">
                                     +{durationExtPercent}% Dur
                                   </span>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-500 truncate w-24">{ATTRIBUTE_DESCRIPTIONS[attr].split(',')[0]}</span>
                        </div>
                        <div className="flex items-center gap-1">
                             <button 
                                onClick={() => handleAttributeChange(attr, -1)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-30 text-xs"
                                disabled={character.attributes[attr] <= 3}
                             >-</button>
                             <span className="w-6 text-center font-mono font-bold text-sm">{character.attributes[attr]}</span>
                             <button 
                                onClick={() => handleAttributeChange(attr, 1)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-nexus-accent/20 hover:bg-nexus-accent/40 text-nexus-accent disabled:opacity-30 disabled:bg-slate-800 disabled:text-slate-600 text-xs"
                                disabled={availableAttributePoints <= 0}
                             >+</button>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Class & Abilities Stack */}
      <div className="space-y-6">
        {/* Class Selection */}
        <div className="bg-nexus-panel p-6 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                <Swords size={20} className="text-nexus-warn" />
                <h2 className="text-xl font-bold text-slate-200">Class Progression</h2>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-4">
                 <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-nexus-warn">{character.className}</h3>
                        <p className="text-sm text-slate-300 mt-1">{currentClass.description}</p>
                    </div>
                    {character.className !== ClassName.RECRUIT && (
                        <button 
                        onClick={() => updateCharacter({...character, className: ClassName.RECRUIT})}
                        className="text-xs text-slate-500 hover:text-white underline"
                        >
                        Respec to Recruit
                        </button>
                    )}
                </div>
                {/* Current Class Info */}
                <div className="mt-2 text-xs text-nexus-warn/80">
                     Primary: {currentClass.primaryAttribute} | Secondary: {currentClass.secondaryAttribute}
                </div>
            </div>

            {/* Upgrades List */}
            {currentClass.upgrades && currentClass.upgrades.length > 0 && (
                <div>
                     <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                         <ChevronRight size={14} /> Available Upgrades
                     </h3>
                     
                     {/* Check Level Requirement Logic */}
                     {(() => {
                         // Simple logic: Recruit -> Tier 2 (Lvl 10), Tier 2 -> Tier 3 (Lvl 32)
                         const reqLevel = character.className === ClassName.RECRUIT ? 10 : 32;
                         const locked = character.level < reqLevel;

                         return locked ? (
                             <div className="flex items-center gap-2 text-slate-500 bg-slate-900/50 p-3 rounded border border-slate-800">
                                 <Lock size={16} />
                                 <span>Next class upgrade available at Level {reqLevel}.</span>
                             </div>
                         ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {currentClass.upgrades.map((clsName) => {
                                    const cls = CLASS_REGISTRY[clsName];
                                    if (!cls) return null;
                                    return (
                                        <button
                                        key={clsName}
                                        onClick={() => handleClassSelect(clsName)}
                                        className="text-left p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-nexus-warn transition-all group"
                                        >
                                            <div className="font-bold text-slate-200 group-hover:text-white mb-1">{clsName}</div>
                                            <div className="text-xs text-slate-400 line-clamp-2">{cls.description}</div>
                                            <div className="mt-2 text-[10px] text-nexus-warn opacity-0 group-hover:opacity-100 transition-opacity">
                                                Click to Select
                                            </div>
                                        </button>
                                    );
                                })}
                             </div>
                         );
                     })()}
                </div>
            )}
            
            {/* If no upgrades available (Max Tier) */}
            {(!currentClass.upgrades || currentClass.upgrades.length === 0) && (
                <div className="text-center text-slate-500 italic text-sm mt-4">
                    Maximum class tier reached.
                </div>
            )}
        </div>

        {/* Abilities */}
        <div className="bg-nexus-panel p-6 rounded-xl border border-slate-700">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-2">
                <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                    <Zap size={20} className="text-yellow-500" />
                    Abilities
                </h2>
                <div className="flex items-center gap-2">
                    <div className={`text-sm px-3 py-1 rounded-full border ${availableAbilityPoints > 0 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>
                        Points: {availableAbilityPoints}
                    </div>
                    <button 
                      onClick={() => setIsDiskModalOpen(true)}
                      className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-purple-600 border border-slate-600 hover:border-purple-400 rounded-full transition-colors text-slate-400 hover:text-white group"
                      title="Install Ability Disk"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
            {getDisplayAbilities().map(ability => {
                const currentLvl = character.abilities[ability.name] || 0;
                const canUpgrade = availableAbilityPoints > 0 && currentLvl < ability.maxLevel;
                const canDowngrade = currentLvl > 0;
                const isCollapsed = collapsedAbilities.has(ability.id);
                
                // Get Tier Data
                const currentTier = ability.tiers.find(t => t.level === currentLvl);
                const nextTier = ability.tiers.find(t => t.level === currentLvl + 1);

                // Evolution Check
                const canEvolve = currentLvl === ability.maxLevel && ability.evolutionId && availableAbilityPoints > 0;
                const evolutionName = ability.evolutionId ? ABILITY_REGISTRY[ability.evolutionId]?.name : 'Unknown';

                // CDR Application
                const adjustedCooldown = currentTier?.cooldown 
                   ? applyCooldownReduction(currentTier.cooldown, character.attributes.MEM)
                   : undefined;
                const hasReducedCD = adjustedCooldown !== currentTier?.cooldown;

                // Duration Application
                const adjustedDuration = currentTier?.duration
                   ? applyDurationExtension(currentTier.duration, character.attributes.INT)
                   : undefined;
                const hasExtendedDur = adjustedDuration !== currentTier?.duration && currentTier?.duration !== 'Instant' && currentTier?.duration !== 'Toggle';

                return (
                <div key={ability.id} className="flex flex-col bg-slate-800/30 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
                    
                    {/* Collapsible Header */}
                    <div 
                        className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-800/50 transition-colors rounded-t"
                        onClick={() => toggleAbilityCollapse(ability.id)}
                    >
                        <div className="flex items-center gap-2">
                             {isCollapsed ? <ChevronRight size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                             <span className="font-semibold text-slate-200">{ability.name}</span>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <div className="text-xs text-slate-500 font-mono">Lvl {currentLvl}/{ability.maxLevel}</div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleAbilityChange(ability.name, -1, ability.maxLevel)}
                                    disabled={!canDowngrade}
                                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${canDowngrade ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    onClick={() => handleAbilityChange(ability.name, 1, ability.maxLevel)}
                                    disabled={!canUpgrade}
                                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${canUpgrade ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Collapsible Content */}
                    {!isCollapsed && (
                        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                            <p className="text-sm text-slate-400 mb-3 pl-6 border-l-2 border-slate-700/50">{ability.description}</p>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/40 p-2 rounded ml-6">
                                {currentTier ? (
                                    <>
                                        <div className="text-slate-500 flex items-center gap-1">
                                            Duration: 
                                            {hasExtendedDur ? (
                                                <>
                                                    <span className="text-blue-300 font-bold">{adjustedDuration}</span>
                                                    <span className="text-slate-600 text-[10px] opacity-70">(Base: {currentTier.duration})</span>
                                                </>
                                            ) : (
                                                <span className="text-slate-300">{currentTier.duration}</span>
                                            )}
                                        </div>
                                        <div className="text-slate-500 flex items-center gap-1">
                                            Cooldown: 
                                            {hasReducedCD ? (
                                                <>
                                                    <span className="text-purple-300 font-bold">{adjustedCooldown}</span>
                                                    <span className="text-slate-600 line-through text-[10px] opacity-70">{currentTier.cooldown}</span>
                                                </>
                                            ) : (
                                                <span className="text-slate-300">{currentTier.cooldown}</span>
                                            )}
                                        </div>
                                        <div className="col-span-2 text-blue-300 border-t border-slate-800 pt-1 mt-1">
                                            Current: {currentTier.effectDescription}
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-span-2 text-slate-600 italic">Not learned yet.</div>
                                )}
                                
                                {/* Next Level Preview */}
                                {nextTier && (
                                    <div className="col-span-2 text-slate-500 border-t border-slate-800 pt-1 mt-1 flex items-center gap-1">
                                        <ArrowBigUpDash size={12} className="text-green-500"/>
                                        <span>Next: {nextTier.effectDescription} ({nextTier.duration})</span>
                                    </div>
                                )}
                            </div>

                            {/* Evolution Button */}
                            {canEvolve && ability.evolutionId && (
                                <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between ml-6">
                                    <div className="text-xs text-purple-400">
                                        <span className="font-bold">Evolution Available:</span> {evolutionName}
                                    </div>
                                    <button 
                                        onClick={() => handleEvolveAbility(ability.id, ability.evolutionId!)}
                                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs font-bold transition-all animate-pulse"
                                    >
                                        <Sparkles size={12} />
                                        Evolve
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                );
            })}
            </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
            onClick={handleStatusDownload}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2 rounded-lg transition-all text-sm font-medium"
        >
            <Download size={18} />
            <span>Download Status Sheet</span>
        </button>
      </div>

      {/* Battle Simulator (Inline) */}
      <BattleSimulator 
         character={character}
         monsters={monsters}
         onApplyResult={handleApplyBattle}
      />

      {/* Mission Log (Persistent) */}
      <div className="bg-nexus-panel p-6 rounded-xl border border-slate-700">
         <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
            <Scroll size={20} className="text-slate-400" />
            <h2 className="text-xl font-bold text-slate-200">Adventure Log</h2>
         </div>
         <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto custom-scrollbar shadow-inner border border-slate-800">
             {character.history.length === 0 ? (
                 <div className="text-slate-600 italic text-center mt-20">No data recorded.</div>
             ) : (
                 character.history.map((entry, idx) => (
                     <div key={idx} className="mb-2 border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                         <span className="text-nexus-accent mr-2">[{character.history.length - idx}]</span>
                         <span className="text-slate-300">{entry}</span>
                     </div>
                 ))
             )}
         </div>
      </div>

    </div>
  );
};
