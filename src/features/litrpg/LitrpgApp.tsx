import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ScrollText, Upload, Save, Zap, Shield, Package, Users, RefreshCw, ChevronLeft, Database, Swords, Plus, X } from 'lucide-react';
import { Character, ClassName, Attribute, Monster, Quest, SaveData } from './types';
import { CharacterSheet } from './components/CharacterSheet';
import { listCharacters, updateCharacter as apiUpdateCharacter, createCharacter as apiCreateCharacter, LitrpgCharacter, getCachedClasses, getCachedAbilities, getCachedProfessions, getCachedMonsters, LitrpgMonster } from './utils/api-litrpg';
import { useAuth } from '../../contexts/AuthContext';

const LitrpgApp: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // --- State ---
  const [character, setCharacter] = useState<Character>({
    name: 'Operative-7',
    headerImageUrl: '/images/litrpg/banner.webp',
    level: 1,
    xp: 0,
    credits: 0,
    className: ClassName.RECRUIT,
    attributes: {
      [Attribute.STR]: 3,
      [Attribute.PER]: 3,
      [Attribute.DEX]: 3,
      [Attribute.MEM]: 3,
      [Attribute.INT]: 3,
      [Attribute.CHA]: 3
    },
    abilities: {},
    inventory: ['Standard Issue Kinetic Pistol'],
    history: ['Initialized in the Nexus.']
  });

  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  
  // Database Character State
  const [dbCharacters, setDbCharacters] = useState<LitrpgCharacter[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [selectedDbCharacterId, setSelectedDbCharacterId] = useState<number | null>(null);
  const [selectedDbClassId, setSelectedDbClassId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Character creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load characters from database on mount
  useEffect(() => {
    loadDbCharacters();
    loadMonsters();
  }, []);

  const loadDbCharacters = async () => {
    setLoadingCharacters(true);
    const result = await listCharacters();
    if (result.success) {
      setDbCharacters(result.characters);
    }
    setLoadingCharacters(false);
  };

  const handleCreateCharacter = async () => {
    if (!newCharacterName.trim() || isCreating) return;
    
    setIsCreating(true);
    try {
      // Create minimal character data - backend will set defaults
      const charData = {
        name: newCharacterName.trim(),
        slug: newCharacterName.trim().toLowerCase().replace(/\s+/g, '-'),
        class_id: 1, // Recruit class
        level: 1,
        xp_current: 0,
        xp_to_level: 100,
        class_level: 1,
        hp_max: 100,
        hp_current: 100,
        ep_max: 50,
        ep_current: 50,
        neural_heat: 0,
        credits: 0,
        stats: { STR: 3, PER: 3, DEX: 3, MEM: 3, INT: 3, CHA: 3 },
        status: 'active'
      } as Omit<LitrpgCharacter, 'id'>;
      
      const result = await apiCreateCharacter(charData);
      
      if (result.success && result.character) {
        setNewCharacterName('');
        setShowCreateForm(false);
        await loadDbCharacters();
        // Auto-select the new character
        handleSelectDbCharacter(result.character);
      } else {
        alert(result.error || 'Failed to create character');
      }
    } catch (error) {
      alert('Failed to create character: ' + String(error));
    }
    setIsCreating(false);
  };

  const normalizeMonsters = (apiMonsters: LitrpgMonster[]): Monster[] => {
    return apiMonsters.map((monster) => ({
      id: String(monster.id),
      name: monster.name,
      description: monster.description || 'No description provided.',
      level: monster.level,
      rank: (monster.rank as Monster['rank']) || 'Regular',
      xpReward: monster.xp_reward ?? 0,
      credits: monster.credits ?? 0,
      stats: {
        [Attribute.STR]: monster.stats?.STR ?? monster.stats?.str ?? 1,
        [Attribute.PER]: monster.stats?.PER ?? monster.stats?.per ?? 1,
        [Attribute.DEX]: monster.stats?.DEX ?? monster.stats?.dex ?? 1,
        [Attribute.MEM]: monster.stats?.MEM ?? monster.stats?.mem ?? 1,
        [Attribute.INT]: monster.stats?.INT ?? monster.stats?.int ?? 1,
        [Attribute.CHA]: monster.stats?.CHA ?? monster.stats?.cha ?? 1,
      },
      abilities: monster.abilities || [],
    }));
  };

  const loadMonsters = async () => {
    try {
      const apiMonsters = await getCachedMonsters();
      setMonsters(normalizeMonsters(apiMonsters));
    } catch (error) {
      console.error('Failed to load monsters', error);
    }
  };

  const handleSelectDbCharacter = async (dbChar: LitrpgCharacter) => {
    // Convert database character to local Character format
    const stats = dbChar.stats || {};
    const baseStats = dbChar.base_stats || stats; // Use base_stats if available, fallback to stats

    // Get the actual class name from class_id if class_name is not set
    const dbClasses = await getCachedClasses();
    // Professions are loaded but not needed for name lookup since profession_name is stored directly
    await getCachedProfessions(); // Pre-cache for CharacterSheet
    let mappedClassName: ClassName;

    if (dbChar.class_id) {
      const classObj = dbClasses.find(c => c.id === dbChar.class_id);
      mappedClassName = (classObj?.name || 'Recruit') as ClassName;
    } else {
      mappedClassName = (dbChar.class_name || 'Recruit') as ClassName;
    }
    
    // Get profession name directly from DB (table uses profession_name column, not profession_id)
    let professionName: string | undefined = dbChar.profession_name;
    
    // Convert unlocked_abilities from DB format to frontend format
    // DB could store: { "ability_id": level } or just [ability_id, ...]
    // Frontend needs: { "Ability Name": level }
    let abilitiesMap: Record<string, number> = {};
    if (dbChar.unlocked_abilities) {
      const dbAbilities = await getCachedAbilities();
      
      // Check if it's an object with levels { ability_id: level } or just array [id, id, ...]
      if (Array.isArray(dbChar.unlocked_abilities)) {
        // Array of IDs - set level to 1 for each
        for (const abilityId of dbChar.unlocked_abilities) {
          const ability = dbAbilities.find(a => a.id === abilityId);
          if (ability) {
            abilitiesMap[ability.name] = 1;
          }
        }
      } else if (typeof dbChar.unlocked_abilities === 'object') {
        // Object: { ability_id: level }
        for (const [idStr, level] of Object.entries(dbChar.unlocked_abilities)) {
          const abilityId = parseInt(idStr);
          const ability = dbAbilities.find(a => a.id === abilityId);
          if (ability) {
            abilitiesMap[ability.name] = level as number;
          }
        }
      }
    }

    // Get the tier of the current class to initialize highestTierAchieved
    const currentClass = dbClasses.find(c => c.name === mappedClassName);
    const currentTier = currentClass ? parseInt(currentClass.tier.replace('tier-', '')) : 1;
    
    // Parse class and profession history from DB if available
    const classHistoryWithLevels = dbChar.class_history_with_levels || [];
    const professionHistoryWithLevels = dbChar.profession_history_with_levels || [];
    
    setCharacter({
      name: dbChar.name,
      headerImageUrl: dbChar.portrait_image || '/images/litrpg/banner.webp',
      level: dbChar.level,
      xp: dbChar.xp_current,
      credits: dbChar.credits,
      className: mappedClassName,
      classActivatedAtLevel: dbChar.class_activated_at_level || 1, // Use stored activation level
      classHistory: classHistoryWithLevels.map(h => h.className), // Extract names for simple history
      classHistoryWithLevels: classHistoryWithLevels, // Keep detailed history
      highestTierAchieved: dbChar.highest_tier_achieved || currentTier,
      // Load profession data
      professionName: professionName,
      professionActivatedAtLevel: dbChar.profession_activated_at_level,
      professionHistoryWithLevels: professionHistoryWithLevels,
      // Use BASE stats only - bonuses are calculated separately in CharacterSheet
      attributes: {
        [Attribute.STR]: baseStats.STR || 3,
        [Attribute.PER]: baseStats.PER || 3,
        [Attribute.DEX]: baseStats.DEX || 3,
        [Attribute.MEM]: baseStats.MEM || 3,
        [Attribute.INT]: baseStats.INT || 3,
        [Attribute.CHA]: baseStats.CHA || 3
      },
      abilities: abilitiesMap,
      inventory: [], // DB uses item IDs (numbers), local uses strings - keeping local for now
      history: [],
      equippedItems: dbChar.equipped_items || {}
    });
    setSelectedDbCharacterId(dbChar.id);
    setSelectedDbClassId(dbChar.class_id || null);
    setSidebarOpen(false);
  };

  const handleSaveToDatabase = async () => {
    if (!selectedDbCharacterId || !isAdmin) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const dbClasses = await getCachedClasses();
      const dbProfessions = await getCachedProfessions();
      
      // Get class_id: use saved one, or lookup from DB by className
      let classIdToSave = selectedDbClassId;
      if (classIdToSave === null) {
        const matchingClass = dbClasses.find(c => c.name === character.className);
        if (matchingClass) {
          classIdToSave = matchingClass.id;
        }
      }

      // ======= BANKING: Calculate accumulated bonuses and consolidate into base stats =======
      // Calculate class bonuses from history
      const accumulatedBonuses: Record<string, number> = {};
      
      // Add bonuses from all previous classes
      if (character.classHistoryWithLevels && character.classHistoryWithLevels.length > 0) {
        for (const entry of character.classHistoryWithLevels) {
          const historicalClass = dbClasses.find(c => c.name === entry.className);
          if (historicalClass?.stat_bonuses) {
            const levelsHeld = (entry.deactivatedAtLevel || character.level) - entry.activatedAtLevel;
            if (levelsHeld > 0) {
              for (const [stat, bonusPerLevel] of Object.entries(historicalClass.stat_bonuses)) {
                accumulatedBonuses[stat] = (accumulatedBonuses[stat] || 0) + (bonusPerLevel * levelsHeld);
              }
            }
          }
        }
      }
      
      // Add bonuses from current class (levels since activation)
      const currentClass = dbClasses.find(c => c.name === character.className);
      if (currentClass?.stat_bonuses) {
        const activationLevel = character.classActivatedAtLevel || 1;
        const levelsSinceActivation = Math.max(0, character.level - activationLevel);
        // Only add bonuses after gaining levels (not immediately on selection)
        if (levelsSinceActivation > 0) {
          for (const [stat, bonusPerLevel] of Object.entries(currentClass.stat_bonuses)) {
            accumulatedBonuses[stat] = (accumulatedBonuses[stat] || 0) + (bonusPerLevel * levelsSinceActivation);
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
                accumulatedBonuses[stat] = (accumulatedBonuses[stat] || 0) + (bonusPerLevel * levelsHeld);
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
          // Only add bonuses after gaining levels (not immediately on selection)
          if (levelsHeld > 0) {
            for (const [stat, bonusPerLevel] of Object.entries(currentProfession.stat_bonuses)) {
              accumulatedBonuses[stat] = (accumulatedBonuses[stat] || 0) + (bonusPerLevel * levelsHeld);
            }
          }
        }
      }
      
      // Create the "banked" stats (base + accumulated bonuses)
      const bankedStats = {
        STR: character.attributes[Attribute.STR] + (accumulatedBonuses['STR'] || 0),
        PER: character.attributes[Attribute.PER] + (accumulatedBonuses['PER'] || 0),
        DEX: character.attributes[Attribute.DEX] + (accumulatedBonuses['DEX'] || 0),
        MEM: character.attributes[Attribute.MEM] + (accumulatedBonuses['MEM'] || 0),
        INT: character.attributes[Attribute.INT] + (accumulatedBonuses['INT'] || 0),
        CHA: character.attributes[Attribute.CHA] + (accumulatedBonuses['CHA'] || 0)
      };

      // Build update payload
      const updatePayload: Parameters<typeof apiUpdateCharacter>[0] = {
        id: selectedDbCharacterId,
        name: character.name,
        level: character.level,
        xp_current: character.xp,
        credits: character.credits,
        highest_tier_achieved: character.highestTierAchieved || 1,
        // Save total stats (for display/combat calculations)
        stats: bankedStats,
        // Save base_stats WITH accumulated bonuses banked in (this becomes the new baseline)
        base_stats: bankedStats,
        equipped_items: character.equippedItems,
        portrait_image: character.headerImageUrl,
        // Reset activation levels to current level (bonuses are now banked)
        class_activated_at_level: character.level,
        class_history_with_levels: [], // Clear history since bonuses are banked
        // Save profession data - reset activation level
        profession_name: character.professionName,
        profession_activated_at_level: character.professionName ? character.level : undefined,
        profession_history_with_levels: [] // Clear history since bonuses are banked
      };

      // Debug: Log save data
      console.log('💾 BEFORE SAVE - Character state:', {
        level: character.level,
        className: character.className,
        classActivatedAtLevel: character.classActivatedAtLevel,
        professionName: character.professionName,
        professionActivatedAtLevel: character.professionActivatedAtLevel,
        baseStats: character.attributes,
        accumulatedBonuses
      });
      console.log('💾 SAVE PAYLOAD:', {
        stats: bankedStats,
        base_stats: bankedStats,
        class_activated_at_level: updatePayload.class_activated_at_level,
        profession_activated_at_level: updatePayload.profession_activated_at_level
      });

      // Update local character state - bank the bonuses into attributes
      const bankedCharacter = {
        ...character,
        // Bank the accumulated bonuses into attributes (this becomes the new base)
        attributes: {
          [Attribute.STR]: bankedStats.STR,
          [Attribute.PER]: bankedStats.PER,
          [Attribute.DEX]: bankedStats.DEX,
          [Attribute.MEM]: bankedStats.MEM,
          [Attribute.INT]: bankedStats.INT,
          [Attribute.CHA]: bankedStats.CHA
        },
        classActivatedAtLevel: character.level,
        classHistoryWithLevels: [],
        professionActivatedAtLevel: character.professionName ? character.level : undefined,
        professionHistoryWithLevels: []
      };
      console.log('💾 AFTER SAVE - Updated character state:', {
        level: bankedCharacter.level,
        classActivatedAtLevel: bankedCharacter.classActivatedAtLevel,
        professionActivatedAtLevel: bankedCharacter.professionActivatedAtLevel,
        baseStats: bankedCharacter.attributes,
        totalStatsWithBonuses: bankedStats
      });
      setCharacter(bankedCharacter);
      
      if (classIdToSave !== null) {
        updatePayload.class_id = classIdToSave;
      }
      
      // Convert abilities from frontend format (name -> level) to backend format ({ ability_id: level })
      // This preserves ability levels, not just which ones are unlocked
      const abilityNames = Object.keys(character.abilities).filter(name => character.abilities[name] > 0);
      if (abilityNames.length > 0) {
        const dbAbilities = await getCachedAbilities();
        const abilitiesWithLevels: Record<string, number> = {};
        for (const name of abilityNames) {
          const matchingAbility = dbAbilities.find(a => a.name === name);
          if (matchingAbility) {
            abilitiesWithLevels[String(matchingAbility.id)] = character.abilities[name];
          }
        }
        if (Object.keys(abilitiesWithLevels).length > 0) {
          // Cast to 'any' since backend will accept object format as JSON
          (updatePayload as any).unlocked_abilities = abilitiesWithLevels;
        }
      }
      
      const result = await apiUpdateCharacter(updatePayload);
      
      setIsSaving(false);
      
      if (result.success) {
        setSaveMessage('Saved!');
        // Update local selectedDbClassId if we found one
        if (classIdToSave !== null && selectedDbClassId === null) {
          setSelectedDbClassId(classIdToSave);
        }
        loadDbCharacters(); // Refresh list
      } else {
        setSaveMessage(result.error || 'Save failed');
      }
    } catch (error) {
      setIsSaving(false);
      setSaveMessage('Save failed: ' + String(error));
    }
    
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // --- Handlers ---
  const handleExportData = () => {
    const data: SaveData = {
      version: '1.0',
      timestamp: Date.now(),
      character,
      quests
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name.replace(/\s+/g, '_')}_SaveData.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const data: SaveData = JSON.parse(json);
        
        if (data.character) {
          if (confirm(`Load data for ${data.character.name} (Level ${data.character.level})? This will overwrite current progress.`)) {
            setCharacter(data.character);
            setQuests(data.quests || []);
            if (data.monsters) {
              setMonsters(data.monsters);
            }
            setSelectedDbCharacterId(null); // Disconnect from DB
          }
        } else {
          alert("Invalid save file format.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse save file.");
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col flex-1">
      
      {/* Character Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-700 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '280px' }}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-nexus-accent" />
            <h3 className="font-bold text-white">Characters</h3>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-white">
            <ChevronLeft size={20} />
          </button>
        </div>
        
        <div className="p-2 flex gap-2">
          <button
            onClick={loadDbCharacters}
            disabled={loadingCharacters}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm transition-colors"
          >
            <RefreshCw size={14} className={loadingCharacters ? 'animate-spin' : ''} />
            Refresh
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-10 h-10 flex items-center justify-center bg-nexus-accent/20 hover:bg-nexus-accent/30 text-nexus-accent rounded transition-colors"
              title="Create New Character"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
        
        {/* Create Character Form */}
        {showCreateForm && (
          <div className="p-2 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-400 font-medium">New Character</span>
              <button
                onClick={() => { setShowCreateForm(false); setNewCharacterName(''); }}
                className="ml-auto text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <input
              type="text"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              placeholder="Character name..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-nexus-accent mb-2"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCharacter()}
              autoFocus
            />
            <button
              onClick={handleCreateCharacter}
              disabled={!newCharacterName.trim() || isCreating}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-nexus-accent hover:bg-nexus-accent/80 text-slate-900 font-medium rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              Create
            </button>
          </div>
        )}
        
        <div className="overflow-y-auto h-[calc(100%-120px)]">
          {dbCharacters.length === 0 && !loadingCharacters ? (
            <div className="text-center text-slate-500 py-8 text-sm">
              No characters in database.
              <br />
              <span className="text-xs">Run seed data to add some!</span>
            </div>
          ) : (
            dbCharacters.map(char => (
              <button
                key={char.id}
                onClick={() => handleSelectDbCharacter(char)}
                className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800 transition-colors ${selectedDbCharacterId === char.id ? 'bg-nexus-accent/10 border-l-2 border-l-nexus-accent' : ''}`}
              >
                <div className="font-medium text-white">{char.name}</div>
                <div className="text-xs text-slate-500">Level {char.level} • {char.class_name || 'Recruit'}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-slate-800 hover:bg-slate-700 border border-slate-700 border-l-0 rounded-r-lg p-2 transition-all ${sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Users size={18} className="text-slate-400" />
      </button>

      {/* Top Navigation Bar */}
      <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 z-30 flex items-center justify-between px-6 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center mr-2 transition-colors"
            title="Character List"
          >
            <Users size={16} className="text-slate-400" />
          </button>
          <div className="w-8 h-8 bg-nexus-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <span className="font-bold text-slate-900 text-lg">D</span>
          </div>
          <span className="font-mono font-bold tracking-widest text-lg hidden sm:block">DESTINY AMONG THE STARS</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
           
           <Link 
             to="/litrpg/attributes"
             className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-nexus-accent transition-all border border-transparent hover:border-slate-700"
             title="Attribute Encyclopedia"
           >
             <Shield size={20} />
             <span className="hidden sm:inline font-medium">Attributes</span>
           </Link>

           <Link 
             to="/litrpg/classes"
             className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-orange-400 transition-all border border-transparent hover:border-slate-700"
             title="Class System"
           >
             <Swords size={20} />
             <span className="hidden sm:inline font-medium">Classes</span>
           </Link>

           <Link 
             to="/litrpg/abilities"
             className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-yellow-400 transition-all border border-transparent hover:border-slate-700"
             title="Abilities Encyclopedia"
           >
             <Zap size={20} />
             <span className="hidden sm:inline font-medium">Abilities</span>
           </Link>

           <Link 
             to="/litrpg/bestiary"
             className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-purple-400 transition-all border border-transparent hover:border-slate-700"
             title="Monster Manual"
           >
             <BookOpen size={20} />
             <span className="hidden sm:inline font-medium">Bestiary</span>
           </Link>

           <Link 
             to="/litrpg/loot"
             className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-green-400 transition-all border border-transparent hover:border-slate-700"
             title="Loot Catalog"
           >
             <Package size={20} />
             <span className="hidden sm:inline font-medium">Loot</span>
           </Link>

           <Link 
             to="/litrpg/contracts"
             className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-nexus-success transition-all border border-transparent hover:border-slate-700"
           >
             <ScrollText size={20} />
             <span className="hidden sm:inline font-medium">Contracts</span>
           </Link>
        </div>
      </header>

      {/* Sub-Header / Command Bar */}
      <div className="bg-slate-900 border-b border-slate-700 py-2 px-6 flex justify-between items-center">
          {/* Left side - DB Status */}
          <div className="flex items-center gap-2">
            {selectedDbCharacterId ? (
              <span className="flex items-center gap-2 text-xs text-nexus-accent">
                <Database size={12} />
                Connected to Database (ID: {selectedDbCharacterId})
              </span>
            ) : (
              <span className="text-xs text-slate-500">Local Mode (not connected to database)</span>
            )}
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
              {/* Admin Save Button */}
              {isAdmin && selectedDbCharacterId && (
                <button 
                  onClick={handleSaveToDatabase}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 rounded border border-green-600/30 hover:border-green-500 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Save to Database
                </button>
              )}
              
              {saveMessage && (
                <span className={`text-xs ${saveMessage === 'Saved!' ? 'text-green-400' : 'text-red-400'}`}>
                  {saveMessage}
                </span>
              )}
              
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold mr-2">System IO</span>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImportData}
                accept=".json"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-600 text-xs font-medium transition-colors"
              >
                <Upload size={14} /> Import JSON
              </button>
              <button 
                onClick={handleExportData}
                className="flex items-center gap-2 px-3 py-1 bg-nexus-accent/10 hover:bg-nexus-accent/20 text-nexus-accent hover:text-white rounded border border-nexus-accent/30 hover:border-nexus-accent text-xs font-medium transition-colors"
              >
                <Save size={14} /> Export JSON
              </button>
          </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-8 w-full">
        <CharacterSheet
          character={character}
          updateCharacter={setCharacter}
          monsters={monsters}
          currentDbClassId={selectedDbClassId}
          onDbClassChange={(classId) => {
            setSelectedDbClassId(classId);
            // Don't auto-save on class change - let user manually save
            // Auto-save was causing loops with the tier upgrade modal
          }}
        />
      </main>
    </div>
  );
};

export default LitrpgApp;
