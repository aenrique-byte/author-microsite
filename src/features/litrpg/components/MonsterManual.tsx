import React, { useState, useMemo } from 'react';
import { Ghost, Skull, Coins, Search, X, BookOpen, AlertTriangle } from 'lucide-react';
import { Monster, MonsterRank } from '../types';

interface MonsterManualProps {
  monsters: Monster[];
  addMonster: (m: Monster) => void;
  onClose: () => void;
}

const RANK_COLORS: Record<MonsterRank, string> = {
  'Trash': 'text-slate-400 border-slate-600 bg-slate-800',
  'Regular': 'text-blue-400 border-blue-800 bg-blue-900/10',
  'Champion': 'text-yellow-400 border-yellow-800 bg-yellow-900/10',
  'Boss': 'text-red-500 border-red-800 bg-red-900/10'
};

const RANK_BORDER_COLORS: Record<MonsterRank, string> = {
  'Trash': 'border-slate-700 hover:border-slate-500',
  'Regular': 'border-blue-900/50 hover:border-blue-500/50',
  'Champion': 'border-yellow-900/50 hover:border-yellow-500/50',
  'Boss': 'border-red-900/50 hover:border-red-500/50'
};

export const MonsterManual: React.FC<MonsterManualProps> = ({ monsters, onClose }) => {
  const [search, setSearch] = useState('');
  const [filterRank, setFilterRank] = useState<MonsterRank | 'All'>('All');

  const filteredMonsters = useMemo(() => {
      return monsters.filter(m => {
          const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase());
          const matchesRank = filterRank === 'All' || m.rank === filterRank;
          return matchesSearch && matchesRank;
      });
  }, [monsters, search, filterRank]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
              <BookOpen className="text-purple-400" size={24} />
              <h1 className="text-xl font-bold text-white font-mono tracking-wider">MONSTER MANUAL</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
          >
              <X size={24} />
          </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Sidebar */}
          <div className="w-full md:w-80 bg-slate-900/50 border-r border-slate-700 flex flex-col shrink-0 p-4 overflow-y-auto">
              
              {/* Info Panel */}
              <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl mb-6">
                  <h3 className="text-purple-300 font-bold mb-2 flex items-center gap-2">
                      <Ghost size={16} /> Threat Database
                  </h3>
                  <p className="text-xs text-slate-400">
                      Browse known biological and mechanical threats. Filter by rank or search by name.
                  </p>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                  <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search threats..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-purple-500 outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                   </div>

                   <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Rank Filter</label>
                       <div className="grid grid-cols-2 gap-2">
                           {(['All', 'Trash', 'Regular', 'Champion', 'Boss'] as const).map((r) => (
                               <button
                                  key={r}
                                  onClick={() => setFilterRank(r)}
                                  className={`px-2 py-1.5 rounded text-xs font-medium transition-colors border ${
                                      filterRank === r 
                                      ? 'bg-purple-500/20 border-purple-500 text-white' 
                                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                  }`}
                               >
                                   {r}
                               </button>
                           ))}
                       </div>
                   </div>

                   <div className="bg-slate-800/50 p-3 rounded border border-slate-700 mt-auto">
                       <div className="text-xs text-slate-400 mb-1">Total Entries</div>
                       <div className="text-2xl font-mono font-bold text-white">{monsters.length}</div>
                   </div>
              </div>
          </div>

          {/* Grid Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-slate-950">
               {filteredMonsters.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                       <Ghost size={64} className="mb-4" />
                       <p className="text-lg">No threats matching parameters.</p>
                   </div>
               ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                       {filteredMonsters.map(monster => (
                           <div key={monster.id} className={`bg-slate-900 border rounded-xl p-5 transition-all hover:scale-[1.01] hover:shadow-xl ${RANK_BORDER_COLORS[monster.rank]}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg text-slate-200">{monster.name}</h3>
                                        {monster.rank === 'Boss' && <Skull size={16} className="text-red-500" />}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xs bg-black/40 px-2 py-0.5 rounded text-slate-400 font-mono border border-slate-800">Lvl {monster.level}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${RANK_COLORS[monster.rank]}`}>
                                            {monster.rank}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-400 mb-4 h-10 line-clamp-2 italic border-l-2 border-slate-800 pl-3">
                                    "{monster.description}"
                                </p>

                                {/* Stats Hex */}
                                <div className="grid grid-cols-6 gap-1 mb-4">
                                    {Object.entries(monster.stats).map(([key, val]) => (
                                        <div key={key} className="bg-slate-950 rounded p-1 text-center border border-slate-800">
                                            <div className="text-[9px] text-slate-600 font-bold">{key}</div>
                                            <div className="text-xs font-bold text-slate-300">{val as number}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Abilities */}
                                <div className="flex flex-wrap gap-2 mb-4 h-12 overflow-hidden content-start">
                                    {monster.abilities.map((ab: string, idx: number) => (
                                        <span key={idx} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 truncate max-w-[150px]">
                                            {ab}
                                        </span>
                                    ))}
                                </div>

                                {/* Rewards Footer */}
                                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
                                    <div className="flex items-center gap-1 text-slate-500">
                                        <AlertTriangle size={12} />
                                        Threat Reward
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="text-nexus-accent font-bold">XP: {monster.xpReward.toLocaleString()}</span>
                                        <span className="text-yellow-400 font-bold flex items-center gap-1">
                                            {monster.credits.toLocaleString()} <Coins size={10} />
                                        </span>
                                    </div>
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
