import { Link } from 'react-router-dom';
import { Shield, Zap, BookOpen, Package } from 'lucide-react';

export default function LitrpgHome() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-nexus-accent rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
          <span className="font-bold text-slate-900 text-3xl">D</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tighter mb-4">
          DESTINY AMONG THE STARS
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Interactive tools for tracking your character, exploring abilities, and managing your adventure in the LitRPG universe.
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link 
          to="/litrpg/attributes" 
          className="group bg-slate-900 border border-slate-700 hover:border-nexus-accent rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-nexus-accent/10"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-nexus-accent/20 rounded-lg flex items-center justify-center group-hover:bg-nexus-accent/30 transition-colors">
              <Shield className="text-nexus-accent" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-nexus-accent transition-colors">Attributes</h2>
              <p className="text-sm text-slate-500">Core stats & mechanics</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            Learn about STR, PER, DEX, MEM, INT, and CHA attributes. Understand cooldown reduction, duration scaling, and game mechanics.
          </p>
        </Link>

        <Link 
          to="/litrpg/abilities" 
          className="group bg-slate-900 border border-slate-700 hover:border-yellow-400 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-yellow-400/10"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
              <Zap className="text-yellow-400" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">Abilities</h2>
              <p className="text-sm text-slate-500">Skills & powers</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            Browse all abilities organized by class. View tier progression, cooldowns, durations, and evolution paths.
          </p>
        </Link>

        <Link 
          to="/litrpg/bestiary" 
          className="group bg-slate-900 border border-slate-700 hover:border-purple-400 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-purple-400/10"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <BookOpen className="text-purple-400" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">Bestiary</h2>
              <p className="text-sm text-slate-500">Creature database</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            Explore monsters from Trash to Boss rank. View stats, abilities, XP rewards, and credit drops.
          </p>
        </Link>

        <Link 
          to="/litrpg/loot" 
          className="group bg-slate-900 border border-slate-700 hover:border-green-400 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-green-400/10"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <Package className="text-green-400" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">Loot Catalog</h2>
              <p className="text-sm text-slate-500">Items & equipment</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            Browse common materials, uncommon parts, and rare components. Find the loot you need for crafting and progression.
          </p>
        </Link>
      </div>

      {/* Info Section */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-slate-300 mb-2">Character Sheet Coming Soon</h3>
        <p className="text-slate-500 text-sm">
          Full character creation, XP tracking, inventory management, and battle simulation tools will be available in Phase 2.
        </p>
      </div>
    </div>
  );
}
