import { useState, useMemo, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Zap, Loader2, RefreshCw } from 'lucide-react';
import { getCachedAbilities, createAbility, LitrpgAbility } from '../utils/api-litrpg';
import SocialIcons from '../../../components/SocialIcons';
import LitrpgNav from '../components/LitrpgNav';
import { useAuth } from '../../../contexts/AuthContext';

export default function AbilitiesPage() {
  const [search, setSearch] = useState('');
  const [abilities, setAbilities] = useState<LitrpgAbility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [newAbility, setNewAbility] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    maxLevel: 5,
    tierDuration: '',
    tierCooldown: '',
    tierEnergy: '',
    tierEffect: '',
  });
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    document.title = "Abilities - LitRPG Tools";
    loadAbilities();
  }, []);

  const loadAbilities = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const data = await getCachedAbilities();
      setAbilities(data);
    } catch (err) {
      setError('Failed to load abilities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setStatus(null);
    const result = await createAbility({
      name: newAbility.name,
      slug: newAbility.slug,
      description: newAbility.description,
      category: newAbility.category,
      maxLevel: Number(newAbility.maxLevel) || 1,
      tierPreview: newAbility.tierDuration || newAbility.tierCooldown || newAbility.tierEnergy || newAbility.tierEffect
        ? {
            level: 1,
            duration: newAbility.tierDuration || undefined,
            cooldown: newAbility.tierCooldown || undefined,
            energyCost: newAbility.tierEnergy ? Number(newAbility.tierEnergy) : undefined,
            effectDescription: newAbility.tierEffect || undefined,
          }
        : undefined,
    });

    if (!result.success) {
      setStatus(result.error || 'Failed to create ability');
      return;
    }

    setStatus(`Created ability ${result.ability?.name}`);
    setNewAbility({ name: '', slug: '', description: '', category: '', maxLevel: 5, tierDuration: '', tierCooldown: '', tierEnergy: '', tierEffect: '' });
    await loadAbilities();
  };

  // Group abilities (single section since DB doesn't have class associations yet)
  const sections = useMemo(() => {
    const groups: { id: string; title: string; abilities: LitrpgAbility[]; colorClass: string }[] = [];

    if (abilities.length > 0) {
      groups.push({
        id: 'all-abilities',
        title: 'All Abilities',
        abilities: abilities,
        colorClass: 'text-nexus-accent border-nexus-accent'
      });
    }

    return groups;
  }, [abilities]);

  // Filter sections based on search and sort alphabetically
  const filteredSections = sections.map(section => ({
      ...section,
      abilities: section.abilities
        .filter(a => 
          a.name.toLowerCase().includes(search.toLowerCase()) || 
          (a.description || '').toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name))
  })).filter(section => section.abilities.length > 0);

  // Find ability name by ID for evolution display
  const getAbilityNameById = (id: number): string => {
    const ability = abilities.find(a => a.id === id);
    return ability?.name || `Ability #${id}`;
  };

  return (
    <>
      <Helmet>
        <title>Abilities - LitRPG Tools</title>
        <meta name="description" content="Ability library for Destiny Among the Stars LitRPG game system." />
      </Helmet>
      
      <div className="min-h-screen bg-nexus-dark text-slate-200 font-sans selection:bg-nexus-accent/30 selection:text-white flex flex-col">
        {/* Shared Navigation */}
        <LitrpgNav />

        {/* Main Content Area with Sidebar */}
        <div className="flex-1 flex flex-col md:flex-row">
            
            {/* Sidebar (Left) - Sticky */}
            <div className="w-full md:w-80 bg-slate-900/50 border-r border-slate-700 flex flex-col shrink-0 p-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <Zap className="text-yellow-400" size={24} />
                    <h1 className="text-xl font-bold text-white font-mono tracking-wider">ABILITIES</h1>
                  </div>
                  <button
                    onClick={loadAbilities}
                    disabled={loading}
                    className="p-2 text-slate-500 hover:text-nexus-accent transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <input 
                        type="text" 
                        placeholder="Filter abilities..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:border-nexus-accent outline-none"
                    />
                    <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
                </div>

                {/* Stats */}
                <div className="mb-6 p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Abilities</div>
                  <div className="text-2xl font-bold text-nexus-accent">{abilities.length}</div>
                </div>

                {isAdmin && (
                  <div className="mb-6 p-3 bg-slate-800/60 rounded-lg border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-400 uppercase">Quick Add Ability</div>
                      {status && <div className="text-[10px] text-green-300">{status}</div>}
                    </div>
                    <input
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                      placeholder="Name"
                      value={newAbility.name}
                      onChange={(e) => setNewAbility({ ...newAbility, name: e.target.value })}
                    />
                    <input
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                      placeholder="Slug"
                      value={newAbility.slug}
                      onChange={(e) => setNewAbility({ ...newAbility, slug: e.target.value })}
                    />
                    <input
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                      placeholder="Category (optional)"
                      value={newAbility.category}
                      onChange={(e) => setNewAbility({ ...newAbility, category: e.target.value })}
                    />
                    <textarea
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                      placeholder="Description"
                      value={newAbility.description}
                      onChange={(e) => setNewAbility({ ...newAbility, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <label className="flex flex-col gap-1 text-slate-400">
                        <span className="text-[10px] uppercase text-slate-500">Max Level</span>
                        <input
                          type="number"
                          min={1}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
                          value={newAbility.maxLevel}
                          onChange={(e) => setNewAbility({ ...newAbility, maxLevel: Number(e.target.value) })}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-slate-400">
                        <span className="text-[10px] uppercase text-slate-500">Energy (L1)</span>
                        <input
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
                          value={newAbility.tierEnergy}
                          onChange={(e) => setNewAbility({ ...newAbility, tierEnergy: e.target.value })}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-slate-400">
                        <span className="text-[10px] uppercase text-slate-500">Duration (L1)</span>
                        <input
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
                          value={newAbility.tierDuration}
                          onChange={(e) => setNewAbility({ ...newAbility, tierDuration: e.target.value })}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-slate-400">
                        <span className="text-[10px] uppercase text-slate-500">Cooldown (L1)</span>
                        <input
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
                          value={newAbility.tierCooldown}
                          onChange={(e) => setNewAbility({ ...newAbility, tierCooldown: e.target.value })}
                        />
                      </label>
                    </div>
                    <textarea
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                      placeholder="Effect description (L1)"
                      value={newAbility.tierEffect}
                      onChange={(e) => setNewAbility({ ...newAbility, tierEffect: e.target.value })}
                    />
                    <button
                      onClick={handleCreate}
                      className="w-full bg-nexus-accent/80 hover:bg-nexus-accent text-white rounded py-2 text-sm font-semibold"
                    >
                      Add Ability
                    </button>
                  </div>
                )}

                {/* Ability Index */}
                <div className="flex-1 overflow-y-auto">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 sticky top-0 bg-slate-900/90 py-1">
                      All Abilities ({filteredSections.reduce((sum, s) => sum + s.abilities.length, 0)})
                    </h4>
                    <ul className="space-y-0.5 text-sm">
                        {filteredSections.flatMap((section) => 
                          section.abilities.map((ability) => (
                            <li key={ability.id}>
                                <button
                                    onClick={() => {
                                      const el = document.getElementById(`ability-${ability.id}`);
                                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }}
                                    className="w-full text-left px-2 py-1 rounded truncate transition-colors text-slate-400 hover:text-nexus-accent hover:bg-slate-800/50 text-xs"
                                    title={ability.name}
                                >
                                    {ability.name}
                                </button>
                            </li>
                          ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Results Grid (Right) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <Loader2 size={48} className="mb-4 animate-spin text-nexus-accent" />
                        <p className="text-lg">Loading abilities...</p>
                    </div>
                ) : error ? (
                    <div className="h-full flex flex-col items-center justify-center text-red-500">
                        <p className="text-lg mb-4">{error}</p>
                        <button 
                          onClick={loadAbilities}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white"
                        >
                          Retry
                        </button>
                    </div>
                ) : filteredSections.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p className="text-lg">No matching abilities found.</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-12">
                        {filteredSections.map((section) => (
                            <div 
                                key={section.id} 
                                id={section.id}
                                ref={(el) => { sectionRefs.current[section.id] = el; }}
                                className="scroll-mt-20"
                            >
                                <div className={`flex items-center gap-3 mb-4 pb-2 border-b ${section.colorClass} border-opacity-30`}>
                                    <Zap className="text-nexus-accent" />
                                    <h2 className={`text-2xl font-bold ${section.colorClass.split(' ')[0]}`}>{section.title}</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {section.abilities.map(ability => (
                                        <div key={ability.id} id={`ability-${ability.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors group scroll-mt-20">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">{ability.name}</h3>
                                                <span className="text-xs bg-slate-800 text-slate-500 px-2 py-1 rounded font-mono">Max Lvl {ability.maxLevel}</span>
                                            </div>
                                            
                                            <p className="text-sm text-slate-400 mb-4 h-10 line-clamp-2">{ability.description || 'No description available.'}</p>
                                            
                                            {/* Stats Preview */}
                                            <div className="bg-slate-950 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                {/* Level 1 Stats */}
                                                {ability.tiers && ability.tiers[0] && (
                                                  <>
                                                    <div className="col-span-2 text-slate-500 font-bold border-b border-slate-800 pb-1 mb-1">Level 1</div>
                                                    <div className="text-slate-400">Duration: <span className="text-slate-200">{ability.tiers[0].duration || 'N/A'}</span></div>
                                                    <div className="text-slate-400">Cooldown: <span className="text-slate-200">{ability.tiers[0].cooldown || 'N/A'}</span></div>
                                                    {ability.tiers[0].energyCost && (
                                                      <div className="text-slate-400">Energy: <span className="text-yellow-400">{ability.tiers[0].energyCost}</span></div>
                                                    )}
                                                    <div className="col-span-2 text-blue-400 mt-1">{ability.tiers[0].effectDescription || ''}</div>
                                                  </>
                                                )}
                                                
                                                {/* Max Level Stats */}
                                                {ability.tiers && ability.tiers.length > 1 && (
                                                  <>
                                                    <div className="col-span-2 text-nexus-accent font-bold border-b border-slate-800 pb-1 mb-1 mt-2">Level {ability.maxLevel}</div>
                                                    <div className="text-slate-400">Duration: <span className="text-slate-200">{ability.tiers[ability.tiers.length-1].duration || 'N/A'}</span></div>
                                                    <div className="text-slate-400">Cooldown: <span className="text-slate-200">{ability.tiers[ability.tiers.length-1].cooldown || 'N/A'}</span></div>
                                                    {ability.tiers[ability.tiers.length-1].energyCost && (
                                                      <div className="text-slate-400">Energy: <span className="text-yellow-400">{ability.tiers[ability.tiers.length-1].energyCost}</span></div>
                                                    )}
                                                    <div className="col-span-2 text-blue-400 mt-1">{ability.tiers[ability.tiers.length-1].effectDescription || ''}</div>
                                                  </>
                                                )}

                                                {/* No tiers message */}
                                                {(!ability.tiers || ability.tiers.length === 0) && (
                                                  <div className="col-span-2 text-slate-500 italic">No tier data available</div>
                                                )}
                                            </div>

                                            {ability.evolutionId && (
                                                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-purple-400">
                                                    <Zap size={12} className="animate-pulse" />
                                                    <span>Evolves into: <strong>{getAbilityNameById(ability.evolutionId)}</strong></span>
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
