
import React, { useState } from 'react';
import { Swords, Calculator, TrendingUp, Users, Trash2, Check, X, Coins, Package, Bookmark, Trophy, Skull } from 'lucide-react';
import { Character, Monster, CharacterClass } from '../types';
import { RECRUIT_CLASS, ADVANCED_CLASSES, ALL_LOOT } from '../constants';

interface BattleSimulatorProps {
  character: Character;
  monsters: Monster[];
  onApplyResult: (xp: number, credits: number, description: string, loot: string[]) => void;
}

interface SelectedMonster {
  monsterId: string;
  quantity: number;
}

interface SelectedLoot {
  item: string;
  quantity: number;
}

interface BattleLogEntry {
  id: number;
  xp: number;
  credits: number;
  description: string;
  loot: string[]; // List of loot string items (flattened)
  lootSummary: string; // Pre-formatted string for the log UI
  timestamp: number;
  chapterRef: string;
}

type SimMode = 'combat' | 'reward';

export const BattleSimulator: React.FC<BattleSimulatorProps> = ({ character, monsters, onApplyResult }) => {
  const [mode, setMode] = useState<SimMode>('combat');
  const [partySize, setPartySize] = useState<number>(1);
  const [chapterRef, setChapterRef] = useState<string>('');
  
  // Combat Mode State
  const [selectedMonsters, setSelectedMonsters] = useState<(SelectedMonster | null)[]>([null, null, null, null, null]);
  
  // Reward Mode State
  const [customDescription, setCustomDescription] = useState<string>('Portal Delve Completion');
  const [customXp, setCustomXp] = useState<number>(10000);
  const [customCredits, setCustomCredits] = useState<number>(5000);

  // Shared State
  const [selectedLoot, setSelectedLoot] = useState<SelectedLoot[]>([
    { item: '', quantity: 1 },
    { item: '', quantity: 1 },
    { item: '', quantity: 1 },
    { item: '', quantity: 1 },
    { item: '', quantity: 1 }
  ]);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);

  const currentClass: CharacterClass = character.className === 'Recruit' 
    ? RECRUIT_CLASS 
    : ADVANCED_CLASSES[character.className];

  const handleSelectMonster = (index: number, monsterId: string) => {
    const newSelection = [...selectedMonsters];
    if (monsterId === '') {
      newSelection[index] = null;
    } else {
      newSelection[index] = { monsterId, quantity: 1 };
    }
    setSelectedMonsters(newSelection);
  };

  const handleMonsterQuantityChange = (index: number, quantity: number) => {
    const newSelection = [...selectedMonsters];
    if (newSelection[index]) {
      newSelection[index]!.quantity = Math.max(1, quantity);
    }
    setSelectedMonsters(newSelection);
  };

  const handleLootItemChange = (index: number, item: string) => {
    const newLoot = [...selectedLoot];
    newLoot[index].item = item;
    setSelectedLoot(newLoot);
  };

  const handleLootQuantityChange = (index: number, quantity: number) => {
    const newLoot = [...selectedLoot];
    newLoot[index].quantity = Math.max(1, quantity);
    setSelectedLoot(newLoot);
  };

  const getLevelDisparityMultiplier = (monsterLevel: number, charLevel: number) => {
    const diff = monsterLevel - charLevel;
    if (diff <= -11) return 0;
    if (diff <= -6) return 0.5;
    if (diff <= -1) return 0.8;
    if (diff <= 4) return 1;
    if (diff <= 9) return 1.2;
    if (diff <= 14) return 1.5;
    return 2;
  };

  const calculate = () => {
    let finalXp = 0;
    let finalCredits = 0;
    let description = '';

    if (mode === 'combat') {
        let totalEncounterXp = 0;
        let totalEncounterCredits = 0;
        let descriptionParts: string[] = [];

        selectedMonsters.forEach(sel => {
            if (!sel) return;
            const monster = monsters.find(m => m.id === sel.monsterId);
            if (!monster) return;

            const disparityMult = getLevelDisparityMultiplier(monster.level, character.level);
            const groupXp = (monster.xpReward * sel.quantity) * disparityMult;
            const groupCredits = monster.credits * sel.quantity;
            
            totalEncounterXp += groupXp;
            totalEncounterCredits += groupCredits;
            
            descriptionParts.push(`${sel.quantity}x ${monster.name}`);
        });

        if (descriptionParts.length === 0) return;

        const partySplitXp = totalEncounterXp / partySize;
        const partySplitCredits = Math.floor(totalEncounterCredits / partySize);

        const primaryAttrVal = character.attributes[currentClass.primaryAttribute];
        const secondaryAttrVal = character.attributes[currentClass.secondaryAttribute];

        // Formula: Total monster XP * (1 + PER/100 * 1 + DEX/100 * 0.6)
        const classBonusMult = 1 + (primaryAttrVal / 100) + ((secondaryAttrVal / 100) * 0.6);

        finalXp = Math.round(partySplitXp * classBonusMult);
        finalCredits = partySplitCredits;
        description = `Defeated: ${descriptionParts.join(', ')}`;
    } else {
        // Custom Reward Mode
        // Manual rewards are split by party but usually don't get Combat Attribute Bonuses
        finalXp = Math.floor(customXp / partySize);
        finalCredits = Math.floor(customCredits / partySize);
        description = customDescription || 'Custom Reward';
    }

    // Process Loot (Common to both modes)
    const validLootSelections = selectedLoot.filter(l => l.item !== '');
    const flatLoot: string[] = [];
    const lootSummaryParts: string[] = [];

    validLootSelections.forEach(l => {
        // Add to flattened inventory list
        for (let i = 0; i < l.quantity; i++) {
            flatLoot.push(l.item);
        }
        // Add to summary string
        lootSummaryParts.push(`${l.item} (x${l.quantity})`);
    });

    const newEntry: BattleLogEntry = {
      id: Date.now(),
      xp: finalXp,
      credits: finalCredits,
      description: description,
      loot: flatLoot,
      lootSummary: lootSummaryParts.join(', '),
      timestamp: Date.now(),
      chapterRef: chapterRef.trim()
    };

    setBattleLog(prev => [newEntry, ...prev]);
    
    // Reset selections depending on mode
    if (mode === 'combat') {
        // Don't reset selected monsters fully, maybe user wants to run it again
    } 
    
    // Always reset loot
    setSelectedLoot([
      { item: '', quantity: 1 },
      { item: '', quantity: 1 },
      { item: '', quantity: 1 },
      { item: '', quantity: 1 },
      { item: '', quantity: 1 }
    ]);
  };

  const removeLogEntry = (id: number) => {
    setBattleLog(prev => prev.filter(entry => entry.id !== id));
  };

  const applyLogEntry = (entry: BattleLogEntry) => {
    // Construct a comprehensive history log string
    // Format: "Battle: [Chapter 1] Defeated: ..." or "Battle: Defeated: ..."
    const prefix = entry.chapterRef ? `[${entry.chapterRef}] ` : '';
    // Determine context label based on description content or mode intuition
    const label = entry.description.startsWith('Defeated') ? 'Battle' : 'Event';
    
    let fullDescription = `${label}: ${prefix}${entry.description}. Rewards: ${entry.xp} XP, ${entry.credits} Credits.`;
    
    if (entry.lootSummary) {
        fullDescription += ` Loot: ${entry.lootSummary}.`;
    }

    onApplyResult(entry.xp, entry.credits, fullDescription, entry.loot);
    removeLogEntry(entry.id);
  };

  return (
    <div className="bg-nexus-panel p-6 rounded-xl border border-slate-700">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-2">
        <Swords size={20} className="text-red-500" />
        <h2 className="text-xl font-bold text-slate-200">Encounter & Rewards</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Col: Setup */}
        <div className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                
                {/* Mode Toggle */}
                <div className="flex bg-slate-900 rounded-lg p-1 mb-4 border border-slate-700">
                    <button 
                        onClick={() => setMode('combat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-bold rounded ${mode === 'combat' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Skull size={16} /> Combat
                    </button>
                    <button 
                        onClick={() => setMode('reward')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-bold rounded ${mode === 'reward' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Trophy size={16} /> Custom Reward
                    </button>
                </div>

                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-300">
                        {mode === 'combat' ? 'Encounter Details' : 'Reward Details'}
                    </h3>
                    
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-400">
                            <Bookmark size={14} className="text-nexus-accent" />
                            Chapter
                            <input 
                            type="text"
                            placeholder="#"
                            value={chapterRef}
                            onChange={(e) => setChapterRef(e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-600 rounded px-1 text-center text-white focus:border-nexus-accent outline-none"
                            />
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-400">
                            <Users size={14} className="text-nexus-accent" />
                            Party Size
                            <input 
                            type="number" 
                            min="1" 
                            max="20"
                            value={partySize}
                            onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-12 bg-slate-900 border border-slate-600 rounded px-1 text-center text-white focus:border-nexus-accent outline-none"
                            />
                        </label>
                    </div>
                </div>
                
                {/* Dynamic Content based on Mode */}
                {mode === 'combat' ? (
                    <div className="space-y-2 mb-4">
                        {selectedMonsters.map((sel, idx) => (
                        <div key={`mob-${idx}`} className="flex gap-2">
                            <select
                            className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-nexus-accent"
                            value={sel?.monsterId || ''}
                            onChange={(e) => handleSelectMonster(idx, e.target.value)}
                            >
                            <option value="">-- Empty Monster Slot --</option>
                            {monsters.map(m => (
                                <option key={m.id} value={m.id}>
                                Lvl {m.level} {m.name} ({m.rank})
                                </option>
                            ))}
                            </select>
                            <input
                            type="number"
                            min="1"
                            disabled={!sel}
                            value={sel?.quantity || 1}
                            onChange={(e) => handleMonsterQuantityChange(idx, parseInt(e.target.value) || 1)}
                            className="w-14 bg-slate-900 border border-slate-600 rounded px-1 text-center text-white focus:border-nexus-accent outline-none disabled:opacity-50 text-sm"
                            placeholder="Qty"
                            />
                        </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Event Description</label>
                            <input 
                                type="text"
                                value={customDescription}
                                onChange={(e) => setCustomDescription(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 text-sm text-white focus:border-nexus-accent outline-none"
                                placeholder="e.g. Portal Delve Complete"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-nexus-accent mb-1">Total XP Reward</label>
                                <input 
                                    type="number"
                                    value={customXp}
                                    onChange={(e) => setCustomXp(parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 text-sm text-white focus:border-nexus-accent outline-none font-mono"
                                />
                                {partySize > 1 && (
                                    <div className="text-[10px] text-slate-500 mt-1 text-right">
                                        Split: {(customXp / partySize).toLocaleString()} XP
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-yellow-400 mb-1">Total Credits Reward</label>
                                <input 
                                    type="number"
                                    value={customCredits}
                                    onChange={(e) => setCustomCredits(parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 text-sm text-white focus:border-nexus-accent outline-none font-mono"
                                />
                                {partySize > 1 && (
                                    <div className="text-[10px] text-slate-500 mt-1 text-right">
                                        Split: {(customCredits / partySize).toLocaleString()} CR
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Loot Dropdowns */}
                <h3 className="text-xs font-bold text-slate-400 mb-2 border-t border-slate-700 pt-2">Add Loot / Rewards</h3>
                <div className="space-y-2">
                    {selectedLoot.map((selection, idx) => (
                        <div key={`loot-${idx}`} className="flex gap-2">
                            <select
                                className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-nexus-accent"
                                value={selection.item}
                                onChange={(e) => handleLootItemChange(idx, e.target.value)}
                            >
                                <option value="">-- No Loot --</option>
                                {ALL_LOOT.map(lootItem => (
                                    <option key={lootItem} value={lootItem}>{lootItem}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min="1"
                                disabled={selection.item === ''}
                                value={selection.quantity}
                                onChange={(e) => handleLootQuantityChange(idx, parseInt(e.target.value) || 1)}
                                className="w-14 bg-slate-900 border border-slate-600 rounded px-1 text-center text-white focus:border-nexus-accent outline-none disabled:opacity-50 text-sm"
                                placeholder="Qty"
                            />
                        </div>
                    ))}
                </div>

                <button
                    onClick={calculate}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-nexus-accent/10 hover:bg-nexus-accent/20 border border-nexus-accent/50 text-nexus-accent font-bold py-2 rounded transition-colors"
                >
                    <Calculator size={18} />
                    <span>Calculate & Add to Log</span>
                </button>
            </div>
        </div>

        {/* Right Col: Log */}
        <div className="bg-slate-900/50 rounded-lg border border-slate-700 flex flex-col h-full min-h-[400px]">
            <div className="p-3 border-b border-slate-700 bg-slate-800/50 rounded-t-lg flex justify-between items-center">
                <span className="text-sm font-bold text-slate-300">Unapplied Results</span>
                <span className="text-xs text-slate-500">{battleLog.length} pending</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {battleLog.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm italic">
                        <TrendingUp size={24} className="mb-2 opacity-50" />
                        No events calculated yet.
                    </div>
                ) : (
                    battleLog.map(entry => (
                        <div key={entry.id} className="bg-slate-800 border border-slate-700 p-3 rounded flex flex-col gap-2 group hover:border-slate-600 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    {entry.chapterRef && (
                                        <span className="text-xs bg-slate-900 text-nexus-accent px-1.5 py-0.5 rounded mr-2 border border-slate-700">
                                            {entry.chapterRef}
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400">{entry.description}</span>
                                </div>
                                <div className="text-right min-w-fit pl-2">
                                    <div className="font-mono font-bold text-nexus-success text-sm">+{entry.xp.toLocaleString()} XP</div>
                                    <div className="font-mono font-bold text-yellow-400 text-sm flex items-center justify-end gap-1">
                                        +{entry.credits.toLocaleString()} 
                                        <Coins size={10} />
                                    </div>
                                </div>
                            </div>

                            {entry.lootSummary && (
                                <div className="flex flex-wrap gap-1 mt-1 bg-slate-900/50 p-2 rounded text-[10px] text-slate-300 border border-slate-700/50">
                                    <Package size={12} className="text-slate-500" />
                                    {entry.lootSummary}
                                </div>
                            )}
                            
                            <div className="flex gap-2 justify-end mt-1 pt-2 border-t border-slate-700/50">
                                <button 
                                    onClick={() => removeLogEntry(entry.id)}
                                    className="p-1.5 rounded bg-slate-700 hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                                    title="Dismiss"
                                >
                                    <X size={14} />
                                </button>
                                <button 
                                    onClick={() => applyLogEntry(entry)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-nexus-success/20 hover:bg-nexus-success/30 text-nexus-success border border-nexus-success/50 text-xs font-bold transition-colors"
                                    title="Apply Rewards to Character"
                                >
                                    <Check size={14} />
                                    APPLY
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
