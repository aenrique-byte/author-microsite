import React, { useEffect, useMemo, useState } from 'react';
import { Package, X, Search, Gem, Box, Layers } from 'lucide-react';
import { LitrpgItem, listItems } from '../utils/api-litrpg';

interface LootCatalogProps {
  onClose: () => void;
}

export const LootCatalog: React.FC<LootCatalogProps> = ({ onClose }) => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<LitrpgItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      setError(null);
      const response = await listItems();
      if (!response.success) {
        setError(response.error || 'Failed to load loot');
        setItems([]);
      } else {
        setItems(response.items);
      }
      setLoading(false);
    };

    void loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term) ||
      (item.tech_level || '').toLowerCase().includes(term)
    );
  }, [items, search]);

  const groupedByTechLevel = useMemo(() => {
    const groups: Record<string, LitrpgItem[]> = {};
    filteredItems.forEach(item => {
      const key = item.tech_level || 'General';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredItems]);

  const techLevels = useMemo(() => Object.keys(groupedByTechLevel).sort(), [groupedByTechLevel]);

  const getIconForIndex = (idx: number) => {
    if (idx === 0) return <Box size={18} className="text-slate-400" />;
    if (idx === 1) return <Layers size={18} className="text-blue-400" />;
    return <Gem size={18} className="text-purple-400" />;
  };

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
             {error && <div className="text-center text-sm text-red-400 mt-3">{error}</div>}
          </div>

          {/* Grid Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                  {loading && (
                    <div className="md:col-span-3 text-center text-slate-500">Loading loot...</div>
                  )}

                  {!loading && techLevels.length === 0 && (
                    <div className="md:col-span-3 text-center text-slate-500">No loot found.</div>
                  )}

                  {techLevels.map((level, idx) => (
                    <div key={level} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                            {getIconForIndex(idx)}
                            <h2 className="font-bold text-slate-200">{level}</h2>
                        </div>
                        <div className="p-2 bg-slate-950/50 flex-1">
                            {groupedByTechLevel[level].length === 0 && <div className="text-slate-600 text-center py-4 text-sm italic">No matches</div>}
                            {groupedByTechLevel[level].map((item) => (
                                <div key={item.id} className="p-2 mb-1 rounded bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                      <span className="font-medium">{item.name}</span>
                                    </div>
                                    {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};
