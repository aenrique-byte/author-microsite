import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Swords, Search, Loader2, Star, ArrowRight, Shield, Brain, Zap, Eye, MessageSquare, Briefcase } from 'lucide-react';
import { getCachedClasses, getCachedProfessions, createClass, createProfession, LitrpgClass, LitrpgProfession } from '../utils/api-litrpg';
import SocialIcons from '../../../components/SocialIcons';
import PageNavbar from '../../../components/PageNavbar';
import LitrpgNav from '../components/LitrpgNav';
import { AbilityManagerModal } from '../components/AbilityManagerModal';
import { ClassEditorModal } from '../components/ClassEditorModal';
import { ProfessionEditorModal } from '../components/ProfessionEditorModal';
import { useAuth } from '../../../contexts/AuthContext';
import { TIER_ORDER, TIER_COLORS, TIER_TEXT_COLORS, TIER_BORDER_COLORS, ClassTier, getTierString } from '../tier-constants';
import { useTheme } from '../../storytime/contexts/ThemeContext';

const STAT_ICONS: Record<string, React.ReactNode> = {
  STR: <Swords size={12} className="text-red-500" />,
  PER: <Eye size={12} className="text-green-500" />,
  DEX: <Zap size={12} className="text-yellow-500" />,
  MEM: <Brain size={12} className="text-purple-500" />,
  INT: <Shield size={12} className="text-blue-500" />,
  CHA: <MessageSquare size={12} className="text-pink-500" />,
};

export default function ClassesPage() {
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
  const borderSecondary = theme === 'light' ? 'border-gray-300' : 'border-slate-600';

  const [classes, setClasses] = useState<LitrpgClass[]>([]);
  const [professions, setProfessions] = useState<LitrpgProfession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<string | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<'combat' | 'professional'>('combat');
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showClassEditor, setShowClassEditor] = useState(false);
  const [showProfessionEditor, setShowProfessionEditor] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [newClass, setNewClass] = useState({
    name: '',
    tier: 1,
    unlock_level: 1,
    description: '',
    primary_attribute: '',
    secondary_attribute: '',
  });

  useEffect(() => {
    document.title = "Classes - LitRPG Tools";
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const [dbClasses, dbProfessions] = await Promise.all([getCachedClasses(), getCachedProfessions()]);
      setClasses(dbClasses);
      setProfessions(dbProfessions);
    } catch (err) {
      setError('Failed to load classes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (filterCategory === 'combat') {
      const result = await createClass({
        name: newClass.name,
        tier: Number(newClass.tier) || 1,
        unlock_level: Number(newClass.unlock_level) || 1,
        description: newClass.description,
        primary_attribute: newClass.primary_attribute || undefined,
        secondary_attribute: newClass.secondary_attribute || undefined,
      });

      if (!result.success) {
        setStatus(result.error || 'Failed to create class');
        return;
      }

      setStatus(`Created ${result.class?.name}`);
    } else {
      const result = await createProfession({
        name: newClass.name,
        tier: Number(newClass.tier) || 1,
        unlock_level: Number(newClass.unlock_level) || 1,
        description: newClass.description,
      });

      if (!result.success) {
        setStatus(result.error || 'Failed to create profession');
        return;
      }

      setStatus(`Created ${result.profession?.name}`);
    }

    setNewClass({ name: '', tier: 1, unlock_level: 1, description: '', primary_attribute: '', secondary_attribute: '' });
    const refreshed = await Promise.all([getCachedClasses(), getCachedProfessions()]);
    setClasses(refreshed[0]);
    setProfessions(refreshed[1]);
  };

  // Combine classes and professions based on category
  const displayItems = useMemo(() => {
    if (filterCategory === 'combat') {
      return classes;
    } else {
      // Convert professions to class-like format for display
      return professions.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        tier: p.tier,
        unlock_level: p.unlock_level,
        prerequisite_class_id: p.prerequisite_profession_id,
        stat_bonuses: p.stat_bonuses,
        primary_attribute: undefined,
        secondary_attribute: undefined,
        starting_item: undefined,
        ability_ids: p.ability_ids,
        upgrade_ids: [],
        created_at: '',
        updated_at: ''
      } as LitrpgClass));
    }
  }, [classes, filterCategory, professions]);

  // Group items by tier
  const groupedClasses = useMemo(() => {
    const filtered = displayItems.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                           (c.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesTier = filterTier === 'All' || c.tier === filterTier;
      return matchesSearch && matchesTier;
    });

    const groups: Record<string, LitrpgClass[]> = {};
    TIER_ORDER.forEach(tier => {
      const tierClasses = filtered.filter(c => c.tier === tier);
      if (tierClasses.length > 0) {
        groups[tier] = tierClasses;
      }
    });

    return groups;
  }, [displayItems, search, filterTier]);

  const getPrerequisiteClassName = (id: number): string => {
    if (filterCategory === 'combat') {
      const cls = classes.find(c => c.id === id);
      return cls?.name || `Class #${id}`;
    } else {
      const prof = professions.find(p => p.id === id);
      return prof?.name || `Profession #${id}`;
    }
  };

  return (
    <>
      <Helmet>
        <title>Classes - LitRPG Tools</title>
        <meta name="description" content="Class progression system for Destiny Among the Stars LitRPG." />
      </Helmet>

      <PageNavbar breadcrumbs={[
        { label: 'Tools', path: '/litrpg/home' },
        { label: 'Classes' }
      ]} />

      <div className={`relative min-h-screen font-sans selection:bg-nexus-accent/30 selection:text-white flex flex-col ${textSecondary}`}>
          {/* Shared Navigation */}
          <LitrpgNav />

        {/* Filters & Admin Tools */}
        <div className={`${bgPanel}/80 border-b ${borderPrimary} px-6 py-4`}>
          <div className="max-w-5xl mx-auto flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search classes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-800 border-slate-600 text-white'} border rounded-lg py-2 pl-10 pr-4 text-sm focus:border-nexus-accent outline-none`}
              />
              <Search className={`absolute left-3 top-2.5 ${textMuted}`} size={18} />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className={`text-xs ${textMuted} uppercase`}>Category:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setFilterCategory('combat')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs rounded border transition-colors ${
                    filterCategory === 'combat'
                      ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                      : `${theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-800 border-slate-700'} ${textMuted} hover:${borderSecondary}`
                  }`}
                >
                  <Swords size={12} />
                  Combat
                </button>
                <button
                  onClick={() => setFilterCategory('professional')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs rounded border transition-colors ${
                    filterCategory === 'professional'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : `${theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-800 border-slate-700'} ${textMuted} hover:${borderSecondary}`
                  }`}
                >
                  <Briefcase size={12} />
                  Professional
                </button>
              </div>
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-2">
              <span className={`text-xs ${textMuted} uppercase`}>Tier:</span>
              <div className="flex gap-1">
                {['All', ...TIER_ORDER].map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterTier(t)}
                    className={`px-2 py-1 text-xs rounded border transition-colors capitalize ${
                      filterTier === t
                        ? t === 'All' ? `bg-nexus-accent/20 border-nexus-accent ${textPrimary}` : (TIER_COLORS[t as ClassTier] || `${theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-800 border-slate-700'} ${textPrimary}`)
                        : `${theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-800 border-slate-700'} ${textMuted} hover:${borderSecondary}`
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <span className={`text-sm ${textMuted}`}>
              {displayItems.length} {filterCategory === 'combat' ? 'classes' : 'professions'} total
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="max-w-5xl mx-auto px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${bgCard} border rounded-lg p-4 space-y-2`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold ${textPrimary}`}>Add New Class</h3>
                {status && <span className="text-[10px] text-green-300">{status}</span>}
              </div>
              <input
                className={`w-full ${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-slate-800 border-slate-700 text-white'} border rounded px-2 py-1 text-sm`}
                placeholder="Name (slug auto-generated)"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              />
              <textarea
                className={`w-full ${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-slate-800 border-slate-700 text-white'} border rounded px-2 py-1 text-sm`}
                placeholder="Description"
                value={newClass.description}
                onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <label className={`flex flex-col gap-1 ${textMuted}`}>
                  <span className={`text-[10px] uppercase ${textMuted}`}>Tier #</span>
                  <input
                    className={`${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-slate-800 border-slate-700 text-white'} border rounded px-2 py-1`}
                    type="number"
                    min={1}
                    max={4}
                    value={newClass.tier}
                    onChange={(e) => setNewClass({ ...newClass, tier: Number(e.target.value) })}
                  />
                </label>
                <label className={`flex flex-col gap-1 ${textMuted}`}>
                  <span className={`text-[10px] uppercase ${textMuted}`}>Unlock Level</span>
                  <input
                    className={`${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-slate-800 border-slate-700 text-white'} border rounded px-2 py-1`}
                    type="number"
                    min={1}
                    value={newClass.unlock_level}
                    onChange={(e) => setNewClass({ ...newClass, unlock_level: Number(e.target.value) })}
                  />
                </label>
                {filterCategory === 'combat' && (
                  <>
                    <label className={`flex flex-col gap-1 ${textMuted}`}>
                      <span className={`text-[10px] uppercase ${textMuted}`}>Primary Attribute</span>
                      <input
                        className={`${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-slate-800 border-slate-700 text-white'} border rounded px-2 py-1`}
                        value={newClass.primary_attribute}
                        onChange={(e) => setNewClass({ ...newClass, primary_attribute: e.target.value })}
                      />
                    </label>
                    <label className={`flex flex-col gap-1 ${textMuted}`}>
                      <span className={`text-[10px] uppercase ${textMuted}`}>Secondary Attribute</span>
                      <input
                        className={`${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-slate-800 border-slate-700 text-white'} border rounded px-2 py-1`}
                        value={newClass.secondary_attribute}
                        onChange={(e) => setNewClass({ ...newClass, secondary_attribute: e.target.value })}
                      />
                    </label>
                  </>
                )}
              </div>
              <button
                onClick={handleCreate}
                className={`w-full bg-nexus-accent/80 hover:bg-nexus-accent ${theme === 'light' ? 'text-white' : 'text-slate-900'} rounded py-2 text-sm font-semibold`}
              >
                {filterCategory === 'combat' ? 'Create Class' : 'Create Profession'}
              </button>
            </div>
            <div className={`${bgCard} border rounded-lg p-4 text-sm ${textMuted}`}>
              <div className={`font-semibold ${textPrimary} mb-2`}>Tip</div>
              Use "Manage Abilities" to attach abilities to your new class after saving. Data is stored in MySQL and refreshed for
              all LitRPG pages.
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 py-8 px-6">
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                <Loader2 size={48} className="mb-4 animate-spin text-orange-400" />
                <p className="text-lg">Loading classes...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-red-500">
                <p className="text-lg mb-4">{error}</p>
                <button 
                  onClick={loadClasses}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white"
                >
                  Retry
                </button>
              </div>
            ) : Object.keys(groupedClasses).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                {filterCategory === 'combat' ? (
                  <Swords size={64} className="mb-4 opacity-20" />
                ) : (
                  <Briefcase size={64} className="mb-4 opacity-20" />
                )}
                <p className="text-lg">No {filterCategory === 'combat' ? 'classes' : 'professions'} found.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {TIER_ORDER.map(tier => {
                  const tierClasses = groupedClasses[tier];
                  if (!tierClasses) return null;

                  return (
                    <div key={tier}>
                      <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 capitalize ${
                        TIER_TEXT_COLORS[tier as ClassTier] || 'text-slate-400'
                      }`}>
                        <Star size={20} />
                        {tier} {filterCategory === 'combat' ? 'Classes' : 'Professions'}
                        <span className="text-xs text-slate-500 ml-2">({tierClasses.length})</span>
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tierClasses.map(cls => (
                          <div
                            key={cls.id}
                            className={`${bgCard} border rounded-xl p-5 hover:${borderSecondary} transition-colors ${
                              TIER_BORDER_COLORS[tier as ClassTier] || borderPrimary
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className={`font-bold text-lg ${textPrimary}`}>{cls.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded border uppercase ${TIER_COLORS[typeof cls.tier === 'number' ? getTierString(cls.tier) : cls.tier as ClassTier] || `${textMuted} ${theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-500/10 border-slate-500/30'}`}`}>
                                {typeof cls.tier === 'number' ? `Tier ${cls.tier}` : cls.tier}
                              </span>
                            </div>

                            <p className={`text-sm ${textMuted} mb-4 line-clamp-2`}>{cls.description || 'No description.'}</p>

                            {/* Unlock Level */}
                            <div className={`text-xs ${textMuted} mb-2`}>
                              Unlock Level: <span className={`${textPrimary} font-bold`}>{cls.unlock_level}</span>
                            </div>

                            {/* Prerequisite */}
                            {cls.prerequisite_class_id && (
                              <div className={`text-xs ${textMuted} mb-2 flex items-center gap-1`}>
                                Requires:
                                <span className="text-nexus-accent">
                                  {getPrerequisiteClassName(cls.prerequisite_class_id)}
                                </span>
                                <ArrowRight size={10} className={textMuted} />
                              </div>
                            )}

                            {/* Stat Bonuses */}
                            {cls.stat_bonuses && Object.keys(cls.stat_bonuses).length > 0 && (
                              <div className={`${theme === 'light' ? 'bg-gray-100' : 'bg-slate-950'} rounded-lg p-3 mt-3`}>
                                <div className={`text-xs ${textMuted} uppercase tracking-wide mb-2`}>Stat Bonuses</div>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(cls.stat_bonuses).map(([stat, bonus]) => (
                                    <div key={stat} className={`flex items-center gap-1 text-xs ${theme === 'light' ? 'bg-gray-200' : 'bg-slate-800'} px-2 py-1 rounded`}>
                                      {STAT_ICONS[stat] || null}
                                      <span className={textSecondary}>{stat}</span>
                                      <span className={bonus > 0 ? 'text-green-400' : 'text-red-400'}>
                                        {bonus > 0 ? '+' : ''}{bonus}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Unified Ability Manager Modal (Classes & Professions) */}
        <AbilityManagerModal
          isOpen={showEditorModal}
          onClose={() => setShowEditorModal(false)}
        />

        {/* Class Editor Modal */}
        <ClassEditorModal
          isOpen={showClassEditor}
          onClose={() => setShowClassEditor(false)}
        />

        {/* Profession Editor Modal */}
        <ProfessionEditorModal
          isOpen={showProfessionEditor}
          onClose={() => setShowProfessionEditor(false)}
        />

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
