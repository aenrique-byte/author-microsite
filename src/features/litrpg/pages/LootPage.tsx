import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Package, Search, Wrench, Swords, Cpu, Layers, Pill, Shield, Heart } from 'lucide-react';
import { LitrpgItem, listItems, createItem } from '../utils/api-litrpg';
import SocialIcons from '../../../components/SocialIcons';
import PageNavbar from '../../../components/PageNavbar';
import LitrpgNav from '../components/LitrpgNav';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../storytime/contexts/ThemeContext';

type TechLevel = string;
type ItemCategory = string;

const CATEGORY_COLORS: Record<ItemCategory, string> = {
  Tool: 'text-amber-400 border-amber-500/30 bg-amber-900/10',
  Weapon: 'text-red-400 border-red-500/30 bg-red-900/10',
  Component: 'text-cyan-400 border-cyan-500/30 bg-cyan-900/10',
  Material: 'text-slate-300 border-slate-500/30 bg-slate-800/30',
  Consumable: 'text-green-400 border-green-500/30 bg-green-900/10',
  Armor: 'text-blue-400 border-blue-500/30 bg-blue-900/10',
  Medical: 'text-pink-400 border-pink-500/30 bg-pink-900/10',
};

const TECH_LEVEL_COLORS: Record<TechLevel, string> = {
  TL8: 'text-slate-400 border-slate-600 bg-slate-800',
  TL9: 'text-blue-400 border-blue-600 bg-blue-900/20',
  TL10: 'text-purple-400 border-purple-600 bg-purple-900/20',
};

const CATEGORY_ICONS: Record<ItemCategory, React.ReactNode> = {
  Tool: <Wrench size={14} />,
  Weapon: <Swords size={14} />,
  Component: <Cpu size={14} />,
  Material: <Layers size={14} />,
  Consumable: <Pill size={14} />,
  Armor: <Shield size={14} />,
  Medical: <Heart size={14} />,
};

const DEFAULT_TECH_LEVELS: TechLevel[] = ['TL8', 'TL9', 'TL10'];
const DEFAULT_CATEGORIES: ItemCategory[] = ['Material', 'Component', 'Tool', 'Weapon', 'Armor', 'Consumable', 'Medical'];

export default function LootPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { theme } = useTheme();

  // Theme-aware style variables
  const bgPanel = theme === 'light' ? 'bg-white' : 'bg-slate-900';
  const bgCard = theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-700';

  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-slate-200';
  const textMuted = theme === 'light' ? 'text-gray-500' : 'text-slate-400';

  const borderPrimary = theme === 'light' ? 'border-gray-200' : 'border-slate-700';


  const [search, setSearch] = useState('');
  const [selectedTL, setSelectedTL] = useState<TechLevel | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'All'>('All');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [items, setItems] = useState<LitrpgItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    tech_level: 'TL8' as TechLevel,
    category: 'Material' as ItemCategory,
    rarity: 'common',
    base_value: 0,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    const response = await listItems();
    if (!response.success) {
      setError(response.error || 'Failed to load items');
      setItems([]);
    } else {
      setItems(response.items);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    setStatus(null);
    const result = await createItem({
      name: newItem.name,
      description: newItem.description,
      tech_level: newItem.tech_level,
      category: newItem.category,
      rarity: newItem.rarity,
      base_value: Number(newItem.base_value) || 0,
    });

    if (!result.success) {
      setStatus(result.error || 'Failed to create item');
      return;
    }

    setStatus(`Created ${result.item?.name}`);
    setNewItem({ name: '', description: '', tech_level: 'TL8', category: 'Material', rarity: 'common', base_value: 0 });
    await loadItems();
  };

  const techLevels = useMemo(() => {
    const levels = Array.from(new Set(items.map(item => item.tech_level).filter(Boolean))) as TechLevel[];
    const sorted = levels.sort((a, b) => DEFAULT_TECH_LEVELS.indexOf(a) - DEFAULT_TECH_LEVELS.indexOf(b));
    return sorted.length > 0 ? sorted : DEFAULT_TECH_LEVELS;
  }, [items]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map(item => item.category).filter(Boolean))) as ItemCategory[];
    return cats.length > 0 ? cats : DEFAULT_CATEGORIES;
  }, [items]);

  const filteredLoot = useMemo(() => {
    const searchTerm = search.toLowerCase();
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm) || item.description?.toLowerCase().includes(searchTerm);
      const matchesTL = selectedTL === 'All' || item.tech_level === selectedTL;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesTL && matchesCategory;
    });
  }, [items, search, selectedTL, selectedCategory]);

  const groupedLoot = useMemo(() => {
    const groups: Record<TechLevel, Record<ItemCategory, LitrpgItem[]>> = {};

    filteredLoot.forEach(item => {
      const tl = (item.tech_level as TechLevel) || 'Unspecified';
      const cat = (item.category as ItemCategory) || 'General';
      if (!groups[tl]) {
        groups[tl] = {} as Record<ItemCategory, LitrpgItem[]>;
      }
      if (!groups[tl][cat]) {
        groups[tl][cat] = [];
      }
      groups[tl][cat].push(item);
    });

    return groups;
  }, [filteredLoot]);

  const getTechLevelTextColor = (tl: TechLevel): string => {
    const colors = TECH_LEVEL_COLORS[tl];
    return colors ? colors.split(' ')[0] : 'text-slate-300';
  };

  return (
    <>
      <Helmet>
        <title>Loot Catalog - LitRPG Tools</title>
        <meta name="description" content="Item database organized by Tech Level and category for Destiny Among the Stars LitRPG." />
      </Helmet>

      <PageNavbar breadcrumbs={[
        { label: 'Tools', path: '/litrpg/home' },
        { label: 'Loot' }
      ]} />

      <div className={`relative min-h-screen font-sans selection:bg-nexus-accent/30 selection:text-white flex flex-col ${textSecondary}`}>
          {/* Shared Navigation */}
          <LitrpgNav />

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row">
          <div className={`w-full md:w-80 ${bgPanel}/50 border-r ${borderPrimary} p-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto space-y-4`}>
            <div className="flex items-center gap-3">
              <Package className="text-green-400" size={24} />
              <div>
                <h1 className={`text-xl font-bold ${textPrimary} font-mono tracking-wider`}>LOOT CATALOG</h1>
                <div className={`text-xs ${textMuted}`}>{loading ? 'Loading...' : `${items.length} items`}</div>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-800 border-slate-600 text-white'} border rounded-lg py-2 pl-10 pr-4 text-sm focus:border-green-500 outline-none`}
              />
              <Search className={`absolute left-3 top-2.5 ${textMuted}`} size={16} />
            </div>

            <div className={`p-3 ${theme === 'light' ? 'bg-gray-100' : 'bg-slate-800/50'} rounded-lg`}>
              <div className={`text-xs ${textMuted} uppercase tracking-wide mb-1`}>Total Items</div>
              <div className="text-2xl font-bold text-green-400">{items.length}</div>
            </div>

            {isAdmin && (
              <div className={`${theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-800/60 border-slate-700'} p-3 rounded border space-y-2`}>
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-bold ${textMuted} uppercase`}>Quick Add Item</div>
                  {status && <div className="text-[10px] text-green-500">{status}</div>}
                </div>
                <div className="space-y-2">
                  <input
                    className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-900 border-slate-700 text-white'} border rounded px-2 py-1 text-sm`}
                    placeholder="Name (slug auto-generated)"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                  <input
                    className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-900 border-slate-700 text-white'} border rounded px-2 py-1 text-sm`}
                    placeholder="Description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />
                  <select
                    className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-900 border-slate-700 text-white'} border rounded px-2 py-1 text-sm`}
                    value={newItem.tech_level}
                    onChange={(e) => setNewItem({ ...newItem, tech_level: e.target.value })}
                  >
                    <option value="TL8">TL8 - Basic Tech</option>
                    <option value="TL9">TL9 - Advanced Tech</option>
                    <option value="TL10">TL10 - Elite Tech</option>
                  </select>
                  <select
                    className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-900 border-slate-700 text-white'} border rounded px-2 py-1 text-sm`}
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-900 border-slate-700 text-white'} border rounded px-2 py-1 text-sm`}
                    value={newItem.rarity}
                    onChange={(e) => setNewItem({ ...newItem, rarity: e.target.value })}
                  >
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="legendary">Legendary</option>
                  </select>
                  <input
                    type="number"
                    className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-900 border-slate-700 text-white'} border rounded px-2 py-1 text-sm`}
                    placeholder="Base Value (credits)"
                    value={newItem.base_value}
                    onChange={(e) => setNewItem({ ...newItem, base_value: Number(e.target.value) })}
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!newItem.name}
                  className={`w-full bg-green-600 hover:bg-green-700 ${theme === 'light' ? 'disabled:bg-gray-300 disabled:text-gray-500' : 'disabled:bg-slate-700 disabled:text-slate-500'} text-white px-3 py-1.5 rounded text-sm font-medium transition-colors`}
                >
                  Add Item
                </button>
              </div>
            )}

            <div className="space-y-2">
              <div className={`text-[11px] uppercase ${textMuted}`}>Tech Level</div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedTL('All')}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    selectedTL === 'All'
                      ? `bg-nexus-accent/20 border-nexus-accent ${theme === 'light' ? 'text-gray-900' : 'text-white'}`
                      : `${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-600 hover:border-gray-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`
                  }`}
                >
                  All
                </button>
                {techLevels.map(tl => (
                  <button
                    key={tl}
                    onClick={() => setSelectedTL(tl)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      selectedTL === tl
                        ? `${TECH_LEVEL_COLORS[tl] || `${theme === 'light' ? 'bg-gray-100 text-gray-900 border-gray-400' : 'bg-slate-800 text-white border-slate-500'}`} border-current`
                        : `${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-600 hover:border-gray-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`
                    }`}
                  >
                    {tl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className={`text-[11px] uppercase ${textMuted}`}>Category</div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    selectedCategory === 'All'
                      ? `bg-nexus-accent/20 border-nexus-accent ${theme === 'light' ? 'text-gray-900' : 'text-white'}`
                      : `${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-600 hover:border-gray-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${
                      selectedCategory === cat && CATEGORY_COLORS[cat]
                        ? CATEGORY_COLORS[cat]
                        : `${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-600 hover:border-gray-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`
                    }`}
                  >
                    {CATEGORY_ICONS[cat]}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          {/* Grid Content */}
          <div className={`flex-1 overflow-y-auto p-6 md:p-8 ${bgPanel}/80`}>
            <div className="max-w-7xl mx-auto space-y-8">
              {techLevels.filter(tl => selectedTL === 'All' || selectedTL === tl).map(tl => {
                const tlItems = Object.entries(groupedLoot[tl] || {}).filter(([, items]) => items.length > 0);
                if (tlItems.length === 0) return null;

                return (
                  <div key={tl} className="space-y-4">
                    {/* Tech Level Header */}
                    <div className={`flex items-center gap-3 pb-2 border-b ${
                      tl === 'TL8' ? 'border-slate-600' : tl === 'TL9' ? 'border-blue-600/50' : 'border-purple-600/50'
                    }`}>
                      <span className={`text-2xl font-bold font-mono ${
                        tl === 'TL8' ? 'text-slate-300' : tl === 'TL9' ? 'text-blue-400' : 'text-purple-400'
                      }`}>{tl}</span>
                      <span className="text-slate-500 text-sm">
                        {tl === 'TL8' ? 'Basic Tech' : tl === 'TL9' ? 'Advanced Tech' : 'Elite Tech'}
                      </span>
                    </div>

                    {/* Categories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {categories.filter(cat => selectedCategory === 'All' || selectedCategory === cat).map(category => {
                        const categoryItems = groupedLoot[tl]?.[category] || [];
                        if (categoryItems.length === 0) return null;

                        return (
                          <div key={`${tl}-${category}`} className={`${bgCard} border rounded-xl overflow-hidden`}>
                            {/* Category Header */}
                            <div className={`p-3 border-b ${borderPrimary} flex items-center gap-2 ${(CATEGORY_COLORS[category] || textSecondary).split(' ').slice(0, 1).join(' ')}`}>
                              {CATEGORY_ICONS[category]}
                              <h3 className="font-bold text-sm">{category}</h3>
                              <span className={`text-xs ${textMuted} ml-auto`}>{categoryItems.length}</span>
                            </div>

                            {/* Items List */}
                            <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                              {categoryItems.map(item => {
                                const isExpanded = expandedItem === item.name;
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => setExpandedItem(isExpanded ? null : item.name)}
                                    className={`p-2 rounded border text-sm transition-all cursor-pointer ${
                                      isExpanded
                                        ? `${item.category ? CATEGORY_COLORS[item.category] : ''} text-slate-200 border-slate-700 bg-slate-800 ring-1 ring-current`
                                        : `${item.category ? CATEGORY_COLORS[item.category] : ''} text-slate-200 border-slate-700 bg-slate-900 hover:bg-slate-800/50`
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
                                            <span className={`ml-1 font-bold ${getTechLevelTextColor(item.tech_level as TechLevel)}`}>{item.tech_level || 'N/A'}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Category:</span>
                                            <span className="ml-1 font-bold">{item.category || 'General'}</span>
                                          </div>
                                          {item.rarity && (
                                            <div>
                                              <span className="text-slate-500">Rarity:</span>
                                              <span className="ml-1 font-bold">{item.rarity}</span>
                                            </div>
                                          )}
                                          {typeof item.base_value === 'number' && (
                                            <div>
                                              <span className="text-slate-500">Value:</span>
                                              <span className="ml-1 font-bold">{item.base_value} cr</span>
                                            </div>
                                          )}
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

              {filteredLoot.length === 0 && !loading && (
                <div className="text-center py-20 text-slate-600">
                  <Package size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg">No items matching filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Social Icons */}
        <footer className={`${bgPanel} border-t ${borderPrimary} py-8`}>
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col items-center gap-4">
              <SocialIcons variant="footer" showCopyright={false} />
              <p className={`text-sm ${textMuted}`}>
                © {new Date().getFullYear()} All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
