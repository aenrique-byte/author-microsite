
import React, { useState, useMemo } from 'react';
import { Search, Zap, X, Shield, Swords } from 'lucide-react';
import { ABILITY_REGISTRY, CLASS_REGISTRY, RECRUIT_CLASS } from '../constants';
import { Ability, ClassName } from '../types';

interface AbilityLibraryProps {
    onClose: () => void;
}

export const AbilityLibrary: React.FC<AbilityLibraryProps> = ({ onClose }) => {
  const [search, setSearch] = useState('');
  
  // Group Abilities by Class
  const sections = useMemo(() => {
    const registryKeys = new Set(Object.keys(ABILITY_REGISTRY));
    const processedAbilities = new Set<string>();
    
    const groups: { title: string; abilities: Ability[]; colorClass: string }[] = [];

    // 1. Recruit
    groups.push({
        title: 'Recruit (Base)',
        abilities: RECRUIT_CLASS.abilities,
        colorClass: 'text-slate-300 border-slate-600'
    });
    RECRUIT_CLASS.abilities.forEach(a => processedAbilities.add(a.name));

    // 2. Advanced Classes
    Object.values(CLASS_REGISTRY).forEach(cls => {
        if (cls.name === ClassName.RECRUIT) return;
        
        // Filter out abilities already shown (unlikely given structure, but safe)
        const classAbilities = cls.abilities.filter(a => !processedAbilities.has(a.name));
        if (classAbilities.length > 0) {
            groups.push({
                title: cls.name,
                abilities: classAbilities,
                colorClass: 'text-nexus-accent border-nexus-accent'
            });
            classAbilities.forEach(a => processedAbilities.add(a.name));
        }
    });

    // 3. General / Other (Evolutions or leftovers)
    const generalAbilities = Object.values(ABILITY_REGISTRY).filter(a => !processedAbilities.has(a.name));
    if (generalAbilities.length > 0) {
        groups.push({
            title: 'General / Evolutions / Other',
            abilities: generalAbilities,
            colorClass: 'text-purple-400 border-purple-500'
        });
    }

    return groups;
  }, []);

  // Filter sections based on search
  const filteredSections = sections.map(section => ({
      ...section,
      abilities: section.abilities.filter(a => 
          a.name.toLowerCase().includes(search.toLowerCase()) || 
          a.description.toLowerCase().includes(search.toLowerCase())
      )
  })).filter(section => section.abilities.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
              <Zap className="text-yellow-400" size={24} />
              <h1 className="text-xl font-bold text-white font-mono tracking-wider">ABILITY ENCYCLOPEDIA</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
          >
              <X size={24} />
          </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Sidebar (Left) */}
          <div className="w-full md:w-80 bg-slate-900/50 border-r border-slate-700 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-4">
               {/* Search */}
               <div className="relative mb-6">
                    <input 
                        type="text" 
                        placeholder="Filter Database..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:border-nexus-accent outline-none"
                        autoFocus
                    />
                    <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
                </div>

                {/* Quick Nav (Hidden on mobile) */}
                <div className="hidden md:block">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Class Index</h4>
                    <ul className="space-y-1 text-sm text-slate-400">
                        {filteredSections.map((section, idx) => (
                            <li key={idx} className="truncate hover:text-white cursor-default">
                                • {section.title}
                            </li>
                        ))}
                    </ul>
                </div>
          </div>

          {/* Results Grid (Right) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-slate-950">
              {filteredSections.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600">
                      <Search size={48} className="mb-4 opacity-20" />
                      <p className="text-lg">No matching abilities found.</p>
                  </div>
              ) : (
                  <div className="max-w-4xl mx-auto space-y-12">
                      {filteredSections.map((section) => (
                          <div key={section.title} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <div className={`flex items-center gap-3 mb-4 pb-2 border-b ${section.colorClass} border-opacity-30`}>
                                   {section.title.includes('Recruit') ? <Shield className="text-slate-400" /> :
                                    section.title.includes('General') ? <Zap className="text-purple-400" /> :
                                    <Swords className="text-nexus-accent" />}
                                   <h2 className={`text-2xl font-bold ${section.colorClass.split(' ')[0]}`}>{section.title}</h2>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {section.abilities.map(ability => (
                                      <div key={ability.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors group">
                                          <div className="flex justify-between items-start mb-2">
                                              <h3 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">{ability.name}</h3>
                                              <span className="text-xs bg-slate-800 text-slate-500 px-2 py-1 rounded font-mono">Max Lvl {ability.maxLevel}</span>
                                          </div>
                                          
                                          <p className="text-sm text-slate-400 mb-4 h-10 line-clamp-2">{ability.description}</p>
                                          
                                          {/* Stats Preview */}
                                          <div className="bg-slate-950 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                              {/* Level 1 Stats */}
                                              {ability.tiers[0] && (
                                                  <>
                                                    <div className="col-span-2 text-slate-500 font-bold border-b border-slate-800 pb-1 mb-1">Level 1</div>
                                                    <div className="text-slate-400">Duration: <span className="text-slate-200">{ability.tiers[0].duration}</span></div>
                                                    <div className="text-slate-400">Cooldown: <span className="text-slate-200">{ability.tiers[0].cooldown}</span></div>
                                                    <div className="col-span-2 text-blue-400 mt-1">{ability.tiers[0].effectDescription}</div>
                                                  </>
                                              )}
                                              
                                              {/* Max Level Stats */}
                                              {ability.tiers.length > 1 && (
                                                  <>
                                                    <div className="col-span-2 text-nexus-accent font-bold border-b border-slate-800 pb-1 mb-1 mt-2">Level {ability.maxLevel}</div>
                                                    <div className="text-slate-400">Duration: <span className="text-slate-200">{ability.tiers[ability.tiers.length-1].duration}</span></div>
                                                    <div className="text-slate-400">Cooldown: <span className="text-slate-200">{ability.tiers[ability.tiers.length-1].cooldown}</span></div>
                                                    <div className="col-span-2 text-blue-400 mt-1">{ability.tiers[ability.tiers.length-1].effectDescription}</div>
                                                  </>
                                              )}
                                          </div>

                                          {ability.evolutionId && (
                                              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-purple-400">
                                                  <Zap size={12} className="animate-pulse" />
                                                  <span>Evolves into: <strong>{ABILITY_REGISTRY[ability.evolutionId]?.name}</strong></span>
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
