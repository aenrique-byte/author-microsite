
import React, { useState, useRef } from 'react';
import { BookOpen, ScrollText, Download, Upload, Save, Zap, Shield, Package } from 'lucide-react';
import { Character, ClassName, Attribute, Monster, Quest, SaveData } from './types';
import { INITIAL_MONSTERS } from './constants';
import { CharacterSheet } from './components/CharacterSheet';
import { MonsterManual } from './components/MonsterManual';
import { QuestSystem } from './components/QuestSystem';
import { AbilityLibrary } from './components/AbilityLibrary';
import { AttributeEncyclopedia } from './components/AttributeEncyclopedia';
import { LootCatalog } from './components/LootCatalog';
import { Drawer } from './components/Drawer';

const App: React.FC = () => {
  // --- State ---
  const [character, setCharacter] = useState<Character>({
    name: 'Operative-7',
    headerImageUrl: './images/banner.webp',
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
    abilities: {
      'Ranged Weapons Familiarity': 0
    },
    inventory: ['Standard Issue Kinetic Pistol'],
    history: ['Initialized in the Nexus.']
  });

  const [monsters, setMonsters] = useState<Monster[]>(INITIAL_MONSTERS);
  const [quests, setQuests] = useState<Quest[]>([]);
  
  // Modal States
  const [isMonsterManualOpen, setIsMonsterManualOpen] = useState(false);
  const [isLootCatalogOpen, setIsLootCatalogOpen] = useState(false);
  const [isQuestDrawerOpen, setIsQuestDrawerOpen] = useState(false);
  const [isAbilityLibraryOpen, setIsAbilityLibraryOpen] = useState(false);
  const [isAttributeEncyclopediaOpen, setIsAttributeEncyclopediaOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const handleAddMonster = (m: Monster) => {
    setMonsters(prev => [m, ...prev]);
  };

  const handleAddQuest = (q: Quest) => {
    setQuests(prev => [q, ...prev]);
  };

  const handleUpdateQuestStatus = (id: string, status: Quest['status']) => {
    setQuests(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  };

  const handleExportData = () => {
    // Exclude monsters from export as per request
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
        
        // Basic validation
        if (data.character) {
          if (confirm(`Load data for ${data.character.name} (Level ${data.character.level})? This will overwrite current progress.`)) {
            setCharacter(data.character);
            setQuests(data.quests || []);
            // Only update monsters if included in save file (optional)
            if (data.monsters) {
              setMonsters(data.monsters);
            }
          }
        } else {
          alert("Invalid save file format.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse save file.");
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-nexus-dark text-slate-200 font-sans selection:bg-nexus-accent/30 selection:text-white flex flex-col">
      
      {/* Top Navigation Bar */}
      <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 z-30 flex items-center justify-between px-6 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-nexus-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <span className="font-bold text-slate-900 text-lg">D</span>
          </div>
          <span className="font-mono font-bold tracking-widest text-lg hidden sm:block">DESTINY AMONG THE STARS</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
           
           <button 
             onClick={() => setIsAttributeEncyclopediaOpen(true)}
             className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-nexus-accent transition-all border border-transparent hover:border-slate-700"
             title="Attribute Encyclopedia"
           >
             <Shield size={20} />
             <span className="hidden sm:inline font-medium">Attributes</span>
           </button>

           <button 
             onClick={() => setIsAbilityLibraryOpen(true)}
             className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-yellow-400 transition-all border border-transparent hover:border-slate-700"
             title="Abilities Encyclopedia"
           >
             <Zap size={20} />
             <span className="hidden sm:inline font-medium">Abilities</span>
           </button>

           <button 
             onClick={() => setIsMonsterManualOpen(true)}
             className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-purple-400 transition-all border border-transparent hover:border-slate-700"
             title="Monster Manual"
           >
             <BookOpen size={20} />
             <span className="hidden sm:inline font-medium">Bestiary</span>
           </button>

           <button 
             onClick={() => setIsLootCatalogOpen(true)}
             className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-green-400 transition-all border border-transparent hover:border-slate-700"
             title="Loot Catalog"
           >
             <Package size={20} />
             <span className="hidden sm:inline font-medium">Loot</span>
           </button>

           <button 
             onClick={() => setIsQuestDrawerOpen(true)}
             className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-nexus-success transition-all border border-transparent hover:border-slate-700"
           >
             <ScrollText size={20} />
             <span className="hidden sm:inline font-medium">Contracts</span>
           </button>
        </div>
      </header>

      {/* Sub-Header / Command Bar */}
      <div className="bg-slate-900 border-b border-slate-700 py-2 px-6 flex justify-end">
          <div className="flex items-center gap-2">
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
        />
      </main>

      {/* Full Screen Modals */}
      {isAbilityLibraryOpen && (
          <AbilityLibrary onClose={() => setIsAbilityLibraryOpen(false)} />
      )}
      
      {isAttributeEncyclopediaOpen && (
          <AttributeEncyclopedia onClose={() => setIsAttributeEncyclopediaOpen(false)} />
      )}

      {isMonsterManualOpen && (
          <MonsterManual 
            monsters={monsters} 
            addMonster={handleAddMonster} 
            onClose={() => setIsMonsterManualOpen(false)} 
          />
      )}

      {isLootCatalogOpen && (
          <LootCatalog onClose={() => setIsLootCatalogOpen(false)} />
      )}

      {/* Drawers */}
      <Drawer
        title="Active Contracts"
        isOpen={isQuestDrawerOpen}
        onClose={() => setIsQuestDrawerOpen(false)}
        width="w-full sm:w-[450px]"
      >
        <QuestSystem 
          character={character}
          quests={quests}
          addQuest={handleAddQuest}
          updateQuestStatus={handleUpdateQuestStatus}
        />
      </Drawer>

    </div>
  );
};

export default App;
