import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ScrollText, CheckCircle, Circle, ArrowLeft, Target, Coins, Zap, Clock } from 'lucide-react';
import { listContracts, LitrpgContract } from '../utils/api-litrpg';
import SocialIcons from '../../../components/SocialIcons';
import LitrpgNav from '../components/LitrpgNav';

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
  const [filterDifficulty, setFilterDifficulty] = useState<string | 'All'>('All');
  const [filterType, setFilterType] = useState<string | 'All'>('All');
  const [contracts, setContracts] = useState<LitrpgContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load contracts from API
  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      setError(null);
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

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesDifficulty = filterDifficulty === 'All' || c.difficulty === filterDifficulty;
      const matchesType = filterType === 'All' || c.contract_type === filterType;
      return matchesDifficulty && matchesType;
    });
  }, [contracts, filterDifficulty, filterType]);

  return (
    <>
      <Helmet>
        <title>Contracts - LitRPG Tools</title>
        <meta name="description" content="Active contracts and missions for your LitRPG character." />
      </Helmet>

      <div className="min-h-screen bg-nexus-dark text-slate-200 font-sans selection:bg-nexus-accent/30 selection:text-white flex flex-col">
        {/* Shared Navigation */}
        <LitrpgNav />

        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-700">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  to="/litrpg"
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </Link>
                <ScrollText className="text-nexus-success" size={28} />
                <div>
                  <h1 className="text-2xl font-bold text-white font-mono tracking-wider">ACTIVE CONTRACTS</h1>
                  <p className="text-sm text-slate-400">Mission log and quest tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/50 border-b border-slate-700 px-6 py-4">
          <div className="max-w-5xl mx-auto flex flex-wrap gap-4 items-center">
            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase">Difficulty:</span>
              <div className="flex gap-1">
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

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase">Type:</span>
              <div className="flex gap-1 flex-wrap">
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

            <span className="text-sm text-slate-500 ml-auto">{filteredContracts.length} contracts</span>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 py-8 px-6">
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
