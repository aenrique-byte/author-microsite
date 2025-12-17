import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Shield, Zap, BookOpen, Package, Swords, ScrollText } from 'lucide-react';
import SocialIcons from '../../../components/SocialIcons';
import PageNavbar from '../../../components/PageNavbar';
import { useTheme } from '../../storytime/contexts/ThemeContext';

export default function LitrpgHome() {
  const { theme } = useTheme();

  // Theme-aware style variables
  const bgPanel = theme === 'light' ? 'bg-white' : 'bg-slate-900';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-slate-200';
  const textMuted = theme === 'light' ? 'text-gray-500' : 'text-slate-400';
  const borderPrimary = theme === 'light' ? 'border-gray-200' : 'border-slate-700';

  return (
    <>
      <Helmet>
        <title>LitRPG Tools - Destiny Among the Stars</title>
        <meta name="description" content="Interactive tools for tracking your character, exploring abilities, and managing your adventure in the LitRPG universe." />
      </Helmet>

      <PageNavbar breadcrumbs={[{ label: 'Tools' }]} />

      <div className={`relative min-h-screen font-sans selection:bg-nexus-accent/30 selection:text-white flex flex-col ${textSecondary}`}>
          {/* Main Content */}
          <main className="flex-1 py-12">
            <div className="max-w-5xl mx-auto px-4">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-nexus-accent rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                  <span className={`font-bold ${theme === 'light' ? 'text-white' : 'text-slate-900'} text-3xl`}>D</span>
                </div>
                <h1 className={`text-4xl md:text-5xl font-bold font-mono tracking-tighter mb-4 ${textPrimary}`}>
                  DESTINY AMONG THE STARS
                </h1>
                <p className={`text-xl ${textMuted} max-w-2xl mx-auto`}>
                  Interactive tools for tracking your character, exploring abilities, and managing your adventure in the LitRPG universe.
                </p>
              </div>

              {/* Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <Link 
                  to="/litrpg/attributes" 
                  className={`group ${bgPanel}/80 backdrop-blur-xl border ${borderPrimary} hover:border-nexus-accent rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-nexus-accent/10`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-nexus-accent/20 rounded-lg flex items-center justify-center group-hover:bg-nexus-accent/30 transition-colors">
                      <Shield className="text-nexus-accent" size={28} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${textPrimary} group-hover:text-nexus-accent transition-colors`}>Attributes</h2>
                      <p className={`text-sm ${textMuted}`}>Core stats & mechanics</p>
                    </div>
                  </div>
                  <p className={`${textMuted} text-sm`}>
                    Learn about STR, PER, DEX, MEM, INT, and CHA attributes. Understand cooldown reduction, duration scaling, and game mechanics.
                  </p>
                </Link>

                <Link 
                  to="/litrpg/classes" 
                  className={`group ${bgPanel}/80 backdrop-blur-xl border ${borderPrimary} hover:border-orange-400 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-orange-400/10`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                      <Swords className="text-orange-400" size={28} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${textPrimary} group-hover:text-orange-400 transition-colors`}>Classes</h2>
                      <p className={`text-sm ${textMuted}`}>Combat & professions</p>
                    </div>
                  </div>
                  <p className={`${textMuted} text-sm`}>
                    Explore the 4-tier class progression system from Recruit to Master. View stat bonuses, prerequisites, and upgrade paths.
                  </p>
                </Link>

                <Link 
                  to="/litrpg/abilities" 
                  className={`group ${bgPanel}/80 backdrop-blur-xl border ${borderPrimary} hover:border-yellow-400 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-yellow-400/10`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                      <Zap className="text-yellow-400" size={28} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${textPrimary} group-hover:text-yellow-400 transition-colors`}>Abilities</h2>
                      <p className={`text-sm ${textMuted}`}>Skills & powers</p>
                    </div>
                  </div>
                  <p className={`${textMuted} text-sm`}>
                    Browse all abilities organized by class. View tier progression, cooldowns, durations, and evolution paths.
                  </p>
                </Link>

                <Link 
                  to="/litrpg/bestiary" 
                  className={`group ${bgPanel}/80 backdrop-blur-xl border ${borderPrimary} hover:border-purple-400 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-purple-400/10`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                      <BookOpen className="text-purple-400" size={28} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${textPrimary} group-hover:text-purple-400 transition-colors`}>Bestiary</h2>
                      <p className={`text-sm ${textMuted}`}>Creature database</p>
                    </div>
                  </div>
                  <p className={`${textMuted} text-sm`}>
                    Explore monsters from Trash to Boss rank. View stats, abilities, XP rewards, and credit drops.
                  </p>
                </Link>

                <Link 
                  to="/litrpg/loot" 
                  className={`group ${bgPanel}/80 backdrop-blur-xl border ${borderPrimary} hover:border-green-400 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-green-400/10`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <Package className="text-green-400" size={28} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${textPrimary} group-hover:text-green-400 transition-colors`}>Loot Catalog</h2>
                      <p className={`text-sm ${textMuted}`}>Items & equipment</p>
                    </div>
                  </div>
                  <p className={`${textMuted} text-sm`}>
                    Browse common materials, uncommon parts, and rare components. Find the loot you need for crafting and progression.
                  </p>
                </Link>

                <Link 
                  to="/litrpg/contracts" 
                  className={`group ${bgPanel}/80 backdrop-blur-xl border ${borderPrimary} hover:border-nexus-success rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-nexus-success/10`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                      <ScrollText className="text-nexus-success" size={28} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${textPrimary} group-hover:text-nexus-success transition-colors`}>Contracts</h2>
                      <p className={`text-sm ${textMuted}`}>Quests & missions</p>
                    </div>
                  </div>
                  <p className={`${textMuted} text-sm`}>
                    Browse available contracts from routine patrols to suicide missions. View objectives, rewards, and difficulty levels.
                  </p>
                </Link>
              </div>

              {/* Info Section */}
              <div className={`${bgPanel}/80 backdrop-blur-xl border ${borderPrimary} rounded-2xl p-6 text-center`}>
                <h3 className={`text-lg font-bold ${textSecondary} mb-2`}>Character Sheet Available</h3>
                <p className={`${textMuted} text-sm mb-4`}>
                  Full character creation, XP tracking, inventory management, and class progression tools are available for admins.
                </p>
                <Link 
                  to="/litrpg" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-nexus-accent/20 hover:bg-nexus-accent/30 text-nexus-accent rounded-lg font-medium transition-colors border border-nexus-accent/30 hover:border-nexus-accent"
                >
                  Open Character Sheet
                </Link>
              </div>
            </div>
          </main>

          {/* Footer with Social Icons */}
          <footer className={`${bgPanel}/80 backdrop-blur-xl border-t ${borderPrimary} py-8`}>
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
