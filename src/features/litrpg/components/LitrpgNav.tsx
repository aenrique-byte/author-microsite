import { Link, useLocation } from 'react-router-dom';
import { Shield, Swords, Zap, BookOpen, Package, ScrollText, User } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/litrpg', label: 'Status', icon: User, color: 'hover:text-nexus-accent' },
  { to: '/litrpg/attributes', label: 'Attributes', icon: Shield, color: 'hover:text-nexus-accent' },
  { to: '/litrpg/classes', label: 'Classes', icon: Swords, color: 'hover:text-orange-400' },
  { to: '/litrpg/abilities', label: 'Abilities', icon: Zap, color: 'hover:text-yellow-400' },
  { to: '/litrpg/bestiary', label: 'Bestiary', icon: BookOpen, color: 'hover:text-purple-400' },
  { to: '/litrpg/loot', label: 'Loot', icon: Package, color: 'hover:text-green-400' },
  { to: '/litrpg/contracts', label: 'Contracts', icon: ScrollText, color: 'hover:text-nexus-success' },
];

export default function LitrpgNav() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/litrpg') {
      return location.pathname === '/litrpg';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          {/* Logo / Title */}
          <Link to="/litrpg" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-nexus-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <span className="font-bold text-slate-900 text-lg">D</span>
            </div>
            <span className="font-mono font-bold tracking-widest text-sm hidden md:block">DESTINY AMONG THE STARS</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = isActive(item.to);
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all text-sm font-medium border ${
                    active 
                      ? 'bg-slate-800 border-slate-600 text-nexus-accent' 
                      : `text-slate-400 ${item.color} border-transparent hover:bg-slate-800/50 hover:border-slate-700`
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
