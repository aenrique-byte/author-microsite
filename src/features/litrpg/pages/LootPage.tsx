import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Package, Search, Wrench, Swords, Cpu, Layers, Pill, Shield, Heart } from 'lucide-react';
import { LOOT_DATABASE, LootItem, TechLevel, ItemCategory, CATEGORY_COLORS, TECH_LEVEL_COLORS } from '../loot-constants';
import SocialIcons from '../../../components/SocialIcons';
import LitrpgNav from '../components/LitrpgNav';

const CATEGORY_ICONS: Record<ItemCategory, React.ReactNode> = {
  Tool: <Wrench size={14} />,
  Weapon: <Swords size={14} />,
  Component: <Cpu size={14} />,
  Material: <Layers size={14} />,
  Consumable: <Pill size={14} />,
  Armor: <Shield size={14} />,
  Medical: <Heart size={14} />,
};

const TECH_LEVELS: TechLevel[] = ['TL8', 'TL9', 'TL10'];
const CATEGORIES: ItemCategory[] = ['Material', 'Component', 'Tool', 'Weapon', 'Armor', 'Consumable', 'Medical'];

export default function LootPage() {
  const [search, setSearch] = useState('');
  const [selectedTL, setSelectedTL] = useState<TechLevel | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'All'>('All');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Use constants data
  const items = LOOT_DATABASE;

  const filteredLoot = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                           (item.description?.toLowerCase().includes(search.toLowerCase()));
      const matchesTL = selectedTL === 'All' || item.techLevel === selectedTL;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesTL && matchesCategory;
    });
  }, [items, search, selectedTL, selectedCategory]);

  // Group by Tech Level then Category
  const groupedLoot = useMemo(() => {
    const groups: Record<TechLevel, Record<ItemCategory, LootItem[]>> = {
      TL8: { Tool: [], Weapon: [], Component: [], Material: [], Consumable: [], Armor: [], Medical: [] },
      TL9: { Tool: [], Weapon: [], Component: [], Material: [], Consumable: [], Armor: [], Medical: [] },
      TL10: { Tool: [], Weapon: [], Component: [], Material: [], Consumable: [], Armor: [], Medical: [] },
    };
    
    filteredLoot.forEach(item => {
      if (groups[item.techLevel] && groups[item.techLevel][item.category]) {
        groups[item.techLevel][item.category].push(item);
      }
    });
    
    return groups;
  }, [filteredLoot]);

  // Get text color from tailwind class
  const getTechLevelTextColor = (tl: TechLevel): string => {
    const colors = TECH_LEVEL_COLORS[tl];
    return colors.split(' ')[0]; // e.g., "text-slate-400"
  };

  return (
    <>
      <Helmet>
        <title>Loot Catalog - LitRPG Tools</title>
        <meta name="description" content="Item database organized by Tech Level and category for Destiny Among the Stars LitRPG." />
      </Helmet>
      
      <div className="min-h-screen bg-nexus-dark text-slate-200 font-sans selection:bg-nexus-accent/30 selection:text-white flex flex-col">
        {/* Shared Navigation */}
        <LitrpgNav />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <Package className="text-green-400" size={24} />
                <h1 className="text-xl font-bold text-white font-mono tracking-wider">LOOT CATALOG</h1>
                <span className="text-sm text-slate-500 ml-auto">{filteredLoot.length} items</span>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <input 
                    type="text" 
                    placeholder="Search items..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-green-500 outline-none"
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                </div>

                {/* Tech Level Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 uppercase">Tech Level:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedTL('All')}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        selectedTL === 'All' 
                          ? 'bg-nexus-accent/20 border-nexus-accent text-white' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      All
                    </button>
                    {TECH_LEVELS.map(tl => (
                      <button
                        key={tl}
                        onClick={() => setSelectedTL(tl)}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          selectedTL === tl 
                            ? `${TECH_LEVEL_COLORS[tl]} border-current` 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {tl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 uppercase">Category:</span>
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        selectedCategory === 'All' 
                          ? 'bg-nexus-accent/20 border-nexus-accent text-white' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      All
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${
                          selectedCategory === cat 
                            ? CATEGORY_COLORS[cat] 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {CATEGORY_ICONS[cat]}
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {TECH_LEVELS.filter(tl => selectedTL === 'All' || selectedTL === tl).map(tl => {
                const tlItems = Object.entries(groupedLoot[tl]).filter(([, items]) => items.length > 0);
                if (tlItems.length === 0) return null;
                
                return (
                  <div key={tl} className="space-y-4">
                    {/* Tech Level Header */}
                    <div className={`flex items-center gap-3 pb-2 border-b ${
                      tl === 'TL8' ? 'border-slate-600' :
                      tl === 'TL9' ? 'border-blue-600/50' :
                      'border-purple-600/50'
                    }`}>
                      <span className={`text-2xl font-bold font-mono ${
                        tl === 'TL8' ? 'text-slate-300' :
                        tl === 'TL9' ? 'text-blue-400' :
                        'text-purple-400'
                      }`}>{tl}</span>
                      <span className="text-slate-500 text-sm">
                        {tl === 'TL8' ? 'Basic Tech' : tl === 'TL9' ? 'Advanced Tech' : 'Elite Tech'}
                      </span>
                    </div>

                    {/* Categories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {CATEGORIES.filter(cat => selectedCategory === 'All' || selectedCategory === cat).map(category => {
                        const categoryItems = groupedLoot[tl][category];
                        if (categoryItems.length === 0) return null;

                        return (
                          <div key={`${tl}-${category}`} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            {/* Category Header */}
                            <div className={`p-3 border-b border-slate-700 flex items-center gap-2 ${CATEGORY_COLORS[category].split(' ').slice(0, 1).join(' ')}`}>
                              {CATEGORY_ICONS[category]}
                              <h3 className="font-bold text-sm">{category}</h3>
                              <span className="text-xs text-slate-500 ml-auto">{categoryItems.length}</span>
                            </div>
                            
                            {/* Items List */}
                            <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                              {categoryItems.map(item => {
                                const isExpanded = expandedItem === item.name;
                                return (
                                  <div 
                                    key={item.name} 
                                    onClick={() => setExpandedItem(isExpanded ? null : item.name)}
                                    className={`p-2 rounded border text-sm transition-all cursor-pointer ${
                                      isExpanded 
                                        ? `${CATEGORY_COLORS[item.category]} ring-1 ring-current` 
                                        : `${CATEGORY_COLORS[item.category]} hover:bg-slate-800/50`
                                    }`}
                                  >
                                    <div className="font-medium flex items-center justify-between">
                                      {item.name}
                                      <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                    </div>
                                    
                                    {isExpanded && (
                                      <div className="mt-3 pt-3 border-t border-current/20 space-y-2 animate-in slide-in-from-top-1 duration-200">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <span className="text-slate-500">Tech Level:</span>
                                            <span className={`ml-1 font-bold ${getTechLevelTextColor(item.techLevel)}`}>{item.techLevel}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Category:</span>
                                            <span className="ml-1 font-bold">{item.category}</span>
                                          </div>
                                        </div>
                                        {item.description && (
                                          <p className="text-xs text-slate-400 italic">{item.description}</p>
                                        )}
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
                );
              })}

              {filteredLoot.length === 0 && (
                <div className="text-center py-20 text-slate-600">
                  <Package size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg">No items matching filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Social Icons */}
        <footer className="bg-slate-900 border-t border-slate-700 py-8">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col items-center gap-4">
              <SocialIcons variant="footer" showCopyright={false} />
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
