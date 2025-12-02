import React, { useState, useMemo } from 'react';
import { Search, Zap, X, Shield, Swords } from 'lucide-react';
import { getAllClasses, ExportedClass } from '../class-constants';
import { getAllAbilities, ExportedAbility } from '../ability-constants';

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

interface AbilityLibraryProps {
    onClose: () => void;
}

export const AbilityLibrary: React.FC<AbilityLibraryProps> = ({ onClose }) => {
  const [search, setSearch] = useState('');
  
  // Load data from constants
  const dbClasses = useMemo(() => getAllClasses(), []);
  const dbAbilities = useMemo(() => getAllAbilities(), []);

  // Convert constants ability to display format
  const convertToDisplayAbility = (ability: ExportedAbility): DisplayAbility => ({
    id: String(ability.id),
    name: ability.name,
    description: ability.description || '',
    maxLevel: ability.maxLevel,
    evolutionId: ability.evolutionId,
    tiers: ability.tiers.map(t => ({
      level: t.level,
      duration: t.duration,
      cooldown: t.cooldown,
      effectDescription: t.effectDescription
    }))
  });

  // Find ability by ID
  const findAbilityById = (id: number): ExportedAbility | undefined => {
    return dbAbilities.find(a => a.id === id);
  };
  
  // Group Abilities by Class from constants
  const sections = useMemo(() => {
    if (dbClasses.length === 0 && dbAbilities.length === 0) return [];
    
    const processedAbilityIds = new Set<number>();
    const groups: { title: string; abilities: DisplayAbility[]; colorClass: string }[] = [];

    // Sort classes: tier-1 first, then by tier number, then by unlock level
    const sortedClasses = [...dbClasses].sort((a, b) => {
      const tierDiff = a.tier - b.tier;
      if (tierDiff !== 0) return tierDiff;
      return a.unlockLevel - b.unlockLevel;
    });

    // Add class abilities
    sortedClasses.forEach((cls: ExportedClass) => {
      if (cls.abilityIds && cls.abilityIds.length > 0) {
        const classDisplayAbilities: DisplayAbility[] = [];
        
        cls.abilityIds.forEach(abilityId => {
          if (!processedAbilityIds.has(abilityId)) {
            const fullAbility = dbAbilities.find(a => a.id === abilityId);
            if (fullAbility) {
              classDisplayAbilities.push(convertToDisplayAbility(fullAbility));
            }
            processedAbilityIds.add(abilityId);
          }
        });

        if (classDisplayAbilities.length > 0) {
          const tierNum = cls.tier;
          const colorClass = tierNum === 1 
            ? 'text-slate-300 border-slate-600'
            : tierNum === 2
            ? 'text-blue-400 border-blue-500'
            : tierNum === 3
            ? 'text-purple-400 border-purple-500'
            : tierNum === 4
            ? 'text-yellow-400 border-yellow-500'
            : tierNum === 5
            ? 'text-orange-400 border-orange-500'
            : 'text-red-400 border-red-500';

          groups.push({
            title: `${cls.name} (Tier ${cls.tier})`,
            abilities: classDisplayAbilities,
            colorClass
          });
        }
      }
    });

    // Add remaining abilities not assigned to any class
    const remainingAbilities = dbAbilities
      .filter(a => !processedAbilityIds.has(a.id))
      .map(a => convertToDisplayAbility(a));

    if (remainingAbilities.length > 0) {
      groups.push({
        title: 'General / Evolutions / Other',
        abilities: remainingAbilities,
        colorClass: 'text-purple-400 border-purple-500'
      });
    }

    return groups;
  }, [dbClasses, dbAbilities]);

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
          <div className="w-full md:w-80 bg-slate-900/50 border-r border-slate-700 flex flex-col shrink-0 p-4 md:h-full md:max-h-full">
               {/* Search */}
               <div className="relative mb-4 shrink-0">
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

                {/* Ability Index Navigation */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 sticky top-0 bg-slate-900/90 py-1">Ability Index ({dbAbilities.length} total)</h4>
                    
                    {filteredSections.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">No abilities found matching search.</p>
                    ) : (
                      <div className="space-y-3">
                        {filteredSections.map((section, idx) => (
                            <div key={idx}>
                              {/* Section Header - clickable */}
                              <button 
                                onClick={() => {
                                  const el = document.getElementById(`section-${idx}`);
                                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className={`w-full text-left text-sm font-semibold mb-1 hover:text-white transition-colors cursor-pointer ${section.colorClass.split(' ')[0]}`}
                              >
                                ▸ {section.title.replace(/ \(tier-\d\)/, '')} ({section.abilities.length})
                              </button>
                              {/* Ability List - each clickable */}
                              <ul className="space-y-0.5 pl-3 border-l-2 border-slate-700 ml-1">
                                {section.abilities.map((ability) => (
                                  <li key={ability.id}>
                                    <button
                                      onClick={() => {
                                        const el = document.getElementById(`ability-${ability.id}`);
                                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      }}
                                      className="text-xs text-slate-400 hover:text-nexus-accent hover:bg-slate-800/50 transition-colors truncate w-full text-left py-1 px-1 rounded cursor-pointer"
                                      title={ability.name}
                                    >
                                      {ability.name}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                        ))}
                      </div>
                    )}
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
                      {filteredSections.map((section, sectionIdx) => (
                          <div key={section.title} id={`section-${sectionIdx}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-4">
                              <div className={`flex items-center gap-3 mb-4 pb-2 border-b ${section.colorClass} border-opacity-30`}>
                                   {section.title.includes('tier-1') || section.title.includes('Tier 1') ? <Shield className="text-slate-400" /> :
                                    section.title.includes('General') ? <Zap className="text-purple-400" /> :
                                    <Swords className="text-nexus-accent" />}
                                   <h2 className={`text-2xl font-bold ${section.colorClass.split(' ')[0]}`}>{section.title}</h2>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {section.abilities.map(ability => (
                                      <div key={ability.id} id={`ability-${ability.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors group scroll-mt-8">
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
                                                    <div className="text-slate-400">Duration: <span className="text-slate-200">{ability.tiers[0].duration || '-'}</span></div>
                                                    <div className="text-slate-400">Cooldown: <span className="text-slate-200">{ability.tiers[0].cooldown || '-'}</span></div>
                                                    <div className="col-span-2 text-blue-400 mt-1">{ability.tiers[0].effectDescription || '-'}</div>
                                                  </>
                                              )}
                                              
                                              {/* Max Level Stats */}
                                              {ability.tiers.length > 1 && (
                                                  <>
                                                    <div className="col-span-2 text-nexus-accent font-bold border-b border-slate-800 pb-1 mb-1 mt-2">Level {ability.maxLevel}</div>
                                                    <div className="text-slate-400">Duration: <span className="text-slate-200">{ability.tiers[ability.tiers.length-1].duration || '-'}</span></div>
                                                    <div className="text-slate-400">Cooldown: <span className="text-slate-200">{ability.tiers[ability.tiers.length-1].cooldown || '-'}</span></div>
                                                    <div className="col-span-2 text-blue-400 mt-1">{ability.tiers[ability.tiers.length-1].effectDescription || '-'}</div>
                                                  </>
                                              )}
                                              
                                              {ability.tiers.length === 0 && (
                                                <div className="col-span-2 text-slate-600 italic">No tier data available.</div>
                                              )}
                                          </div>

                                          {ability.evolutionId && (
                                              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-purple-400">
                                                  <Zap size={12} className="animate-pulse" />
                                                  <span>Evolves into: <strong>{findAbilityById(ability.evolutionId)?.name || 'Unknown'}</strong></span>
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
