
import React, { useState } from 'react';
import { Package, X, Search, Gem, Box, Layers } from 'lucide-react';
import { COMMON_LOOT, UNCOMMON_LOOT, RARE_LOOT } from '../constants';

interface LootCatalogProps {
  onClose: () => void;
}

export const LootCatalog: React.FC<LootCatalogProps> = ({ onClose }) => {
  const [search, setSearch] = useState('');

  const filterLoot = (list: string[]) => list.filter(item => item.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
       {/* Header */}
       <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
              <Package className="text-green-400" size={24} />
              <h1 className="text-xl font-bold text-white font-mono tracking-wider">LOOT CATALOG</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
          >
              <X size={24} />
          </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
             <div className="max-w-md mx-auto relative">
                <input 
                    type="text" 
                    placeholder="Search commodities..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-green-500 outline-none"
                    autoFocus
                />
                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
             </div>
          </div>

          {/* Grid Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Common Column */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                      <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                          <Box size={18} className="text-slate-400" />
                          <h2 className="font-bold text-slate-200">Common Materials</h2>
                      </div>
                      <div className="p-2 bg-slate-950/50 flex-1">
                          {filterLoot(COMMON_LOOT).length === 0 && <div className="text-slate-600 text-center py-4 text-sm italic">No matches</div>}
                          {filterLoot(COMMON_LOOT).map((item, idx) => (
                              <div key={idx} className="p-2 mb-1 rounded bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                  {item}
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Uncommon Column */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                      <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                          <Layers size={18} className="text-blue-400" />
                          <h2 className="font-bold text-blue-200">Uncommon Parts</h2>
                      </div>
                      <div className="p-2 bg-blue-950/10 flex-1">
                          {filterLoot(UNCOMMON_LOOT).length === 0 && <div className="text-slate-600 text-center py-4 text-sm italic">No matches</div>}
                          {filterLoot(UNCOMMON_LOOT).map((item, idx) => (
                              <div key={idx} className="p-2 mb-1 rounded bg-slate-800/80 border border-blue-900/30 text-blue-100 text-sm flex items-center gap-2 shadow-sm">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                                  {item}
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Rare Column */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                      <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                          <Gem size={18} className="text-purple-400" />
                          <h2 className="font-bold text-purple-200">Rare Components</h2>
                      </div>
                      <div className="p-2 bg-purple-950/10 flex-1">
                          {filterLoot(RARE_LOOT).length === 0 && <div className="text-slate-600 text-center py-4 text-sm italic">No matches</div>}
                          {filterLoot(RARE_LOOT).map((item, idx) => (
                              <div key={idx} className="p-2 mb-1 rounded bg-slate-800/80 border border-purple-900/30 text-purple-100 text-sm flex items-center gap-2 shadow-sm">
                                  <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
                                  {item}
                              </div>
                          ))}
                      </div>
                  </div>

              </div>
          </div>
    </div>
  );
};
