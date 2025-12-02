import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ScrollText, CheckCircle, Circle, ArrowLeft, Target, Coins, Zap, Clock, Search, PlusCircle } from 'lucide-react';
import { listContracts, LitrpgContract, createContract } from '../utils/api-litrpg';
import SocialIcons from '../../../components/SocialIcons';
import LitrpgNav from '../components/LitrpgNav';
import { useAuth } from '../../../contexts/AuthContext';

const DIFFICULTY_COLORS: Record<string, string> = {
  routine: 'text-green-400 bg-green-500/10 border-green-500/30',
  hazardous: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  critical: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  suicide: 'text-red-500 bg-red-500/10 border-red-500/30',
};

const TYPE_COLORS: Record<string, string> = {
  bounty: 'text-red-400',
  extraction: 'text-blue-400',
  escort: 'text-green-400',
  patrol: 'text-yellow-400',
  investigation: 'text-purple-400',
};

export default function ContractsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [filterDifficulty, setFilterDifficulty] = useState<string | 'All'>('All');
  const [filterType, setFilterType] = useState<string | 'All'>('All');
  const [search, setSearch] = useState('');
  const [contracts, setContracts] = useState<LitrpgContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [newContract, setNewContract] = useState({
    title: '',
    description: '',
    contract_type: 'bounty',
    difficulty: 'routine',
    level_requirement: 1,
    time_limit: '',
    rewards: { xp: 0, credits: 0 },
  });

  // Load contracts from API
  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      setError(null);
      setStatus(null);
      const result = await listContracts();
      if (result.success) {
        setContracts(result.contracts || []);
      } else {
        setError(result.error || 'Failed to load contracts');
      }
      setLoading(false);
    };

    fetchContracts();
  }, []);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const handleCreate = async () => {
    setStatus(null);
    setError(null);
    const payload: Omit<LitrpgContract, 'id'> = {
      slug: slugify(newContract.title),
      title: newContract.title,
      description: newContract.description,
      contract_type: newContract.contract_type,
      difficulty: newContract.difficulty,
      level_requirement: Number(newContract.level_requirement) || 1,
      time_limit: newContract.time_limit || undefined,
      rewards: {
        xp: Number(newContract.rewards.xp) || 0,
        credits: Number(newContract.rewards.credits) || 0,
      },
    };

    const result = await createContract(payload);
    if (!result.success) {
      setStatus(result.error || 'Failed to create contract');
      return;
    }

    setStatus(`Created ${result.contract?.title}`);
    setNewContract({
      title: '',
      description: '',
      contract_type: 'bounty',
      difficulty: 'routine',
      level_requirement: 1,
      time_limit: '',
      rewards: { xp: 0, credits: 0 },
    });
    const refreshed = await listContracts();
    if (refreshed.success) {
      setContracts(refreshed.contracts || []);
    }
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesDifficulty = filterDifficulty === 'All' || c.difficulty === filterDifficulty;
      const matchesType = filterType === 'All' || c.contract_type === filterType;
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase());
      return matchesDifficulty && matchesType && matchesSearch;
    });
  }, [contracts, filterDifficulty, filterType, search]);

  return (
    <>
      <Helmet>
        <title>Contracts - LitRPG Tools</title>
        <meta name="description" content="Active contracts and missions for your LitRPG character." />
      </Helmet>

      <div className="min-h-screen bg-nexus-dark text-slate-200 font-sans selection:bg-nexus-accent/30 selection:text-white flex flex-col">
        {/* Shared Navigation */}
        <LitrpgNav />

        <div className="flex-1 flex flex-col md:flex-row">
          <div className="w-full md:w-80 bg-slate-900/50 border-r border-slate-800 p-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto space-y-4">
            <div className="flex items-center gap-3">
              <Link
                to="/litrpg"
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                aria-label="Back to LitRPG home"
              >
                <ArrowLeft size={20} />
              </Link>
              <ScrollText className="text-nexus-success" size={28} />
              <div>
                <h1 className="text-xl font-bold text-white font-mono tracking-wider">CONTRACTS</h1>
                <div className="text-xs text-slate-500">Mission log and quest tracking</div>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search contracts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-nexus-accent outline-none"
              />
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Contracts</div>
              <div className="text-2xl font-bold text-nexus-accent">{contracts.length}</div>
            </div>

            {isAdmin && (
              <div className="bg-slate-800/60 p-3 rounded border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400 uppercase">Quick Add Contract</div>
                  {status && <div className="text-[10px] text-green-300">{status}</div>}
                </div>
                <div className="space-y-2">
                  <input
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                    placeholder="Title (slug auto-generated)"
                    value={newContract.title}
                    onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                  />
                  <textarea
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                    placeholder="Description"
                    value={newContract.description}
                    onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      value={newContract.contract_type}
                      onChange={(e) => setNewContract({ ...newContract, contract_type: e.target.value })}
                    >
                      {['bounty', 'extraction', 'escort', 'patrol', 'investigation'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 capitalize"
                      value={newContract.difficulty}
                      onChange={(e) => setNewContract({ ...newContract, difficulty: e.target.value })}
                    >
                      {['routine', 'hazardous', 'critical', 'suicide'].map(diff => (
                        <option key={diff} value={diff}>{diff}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      placeholder="Level Req"
                      min={1}
                      value={newContract.level_requirement}
                      onChange={(e) => setNewContract({ ...newContract, level_requirement: Number(e.target.value) })}
                    />
                    <input
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      placeholder="Time limit (optional)"
                      value={newContract.time_limit}
                      onChange={(e) => setNewContract({ ...newContract, time_limit: e.target.value })}
                    />
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      placeholder="XP Reward"
                      value={newContract.rewards.xp}
                      onChange={(e) => setNewContract({ ...newContract, rewards: { ...newContract.rewards, xp: Number(e.target.value) } })}
                    />
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
                      placeholder="Credits Reward"
                      value={newContract.rewards.credits}
                      onChange={(e) => setNewContract({ ...newContract, rewards: { ...newContract.rewards, credits: Number(e.target.value) } })}
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!newContract.title}
                  className="w-full bg-nexus-accent/80 hover:bg-nexus-accent text-white rounded py-2 text-sm font-semibold disabled:bg-slate-700 disabled:text-slate-500 flex items-center justify-center gap-2"
                >
                  <PlusCircle size={16} />
                  Add Contract
                </button>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-[11px] uppercase text-slate-500">Difficulty</div>
              <div className="flex gap-2 flex-wrap">
                {['All', 'routine', 'hazardous', 'critical', 'suicide'].map(d => (
                  <button
                    key={d}
                    onClick={() => setFilterDifficulty(d)}
                    className={`px-2 py-1 text-xs rounded border transition-colors capitalize ${
                      filterDifficulty === d
                        ? d === 'All' ? 'bg-nexus-accent/20 border-nexus-accent text-white' : DIFFICULTY_COLORS[d]
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] uppercase text-slate-500">Type</div>
              <div className="flex gap-2 flex-wrap">
                {['All', 'bounty', 'extraction', 'escort', 'patrol', 'investigation'].map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2 py-1 text-xs rounded border transition-colors capitalize ${
                      filterType === t
                        ? t === 'All' ? 'bg-nexus-accent/20 border-nexus-accent text-white' : `${TYPE_COLORS[t]} bg-current/10 border-current`
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
            <div className="max-w-5xl mx-auto">
              {loading && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400">
                  Loading contracts...
                </div>
              )}

              {error && !loading && (
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-6 text-center text-red-200">
                  {error}
                </div>
              )}

              {!loading && filteredContracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                  <ScrollText size={64} className="mb-4 opacity-20" />
                  <p className="text-lg">No contracts available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredContracts.map(contract => {
                    const contractType = contract.contract_type || 'bounty';
                    const difficulty = contract.difficulty || 'routine';

                    return (
                      <div key={contract.id} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-xl text-slate-200">{contract.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-xs uppercase font-bold ${TYPE_COLORS[contractType] || 'text-slate-400'}`}>
                                {contractType}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded border uppercase font-bold ${DIFFICULTY_COLORS[difficulty] || 'border-slate-700 text-slate-400'}`}>
                                {difficulty}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Target size={12} /> Level {contract.level_requirement}+
                              </span>
                            </div>
                          </div>
                          {contract.time_limit && (
                            <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded">
                              <Clock size={12} />
                              {contract.time_limit}
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-slate-400 mb-4">{contract.description || 'No description available.'}</p>

                        {/* Objectives */}
                        {contract.objectives && contract.objectives.length > 0 && (
                          <div className="space-y-2 mb-4 bg-slate-900/50 p-4 rounded-lg">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Objectives</h5>
                            {contract.objectives.map((obj, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className={`mt-0.5 ${obj.current && obj.current >= obj.target ? 'text-green-400' : 'text-slate-600'}`}>
                                  {obj.current && obj.current >= obj.target ? <CheckCircle size={14} /> : <Circle size={14} />}
                                </span>
                                <span>{obj.description}</span>
                                {obj.target > 1 && (
                                  <span className="text-xs text-slate-500 ml-auto">
                                    {obj.current ?? 0}/{obj.target}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Rewards */}
                        {contract.rewards && (
                          <div className="flex flex-wrap gap-3 text-sm">
                            <div className="flex items-center gap-1 bg-nexus-accent/10 text-nexus-accent px-3 py-1.5 rounded border border-nexus-accent/20">
                              <Zap size={14} />
                              <span className="font-bold">{typeof contract.rewards.xp === 'number' ? contract.rewards.xp.toLocaleString() : 'XP varies'} XP</span>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded border border-yellow-500/20">
                              <Coins size={14} />
                              <span className="font-bold">{typeof contract.rewards.credits === 'number' ? contract.rewards.credits.toLocaleString() : 'Credits vary'} Credits</span>
                            </div>
                            {Array.isArray(contract.rewards.items) && contract.rewards.items.length > 0 && (
                              <div className="flex items-center gap-1 bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded border border-purple-500/20">
                                <span className="font-bold">+{contract.rewards.items.length} Items</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
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
