import { Link, useLocation } from 'react-router-dom';
import { Shield, Swords, Zap, BookOpen, Package, ScrollText, User } from 'lucide-react';
import { useTheme } from '../../storytime/contexts/ThemeContext';

const NAV_ITEMS = [
  { to: '/litrpg', label: 'Character', icon: User, color: 'hover:text-nexus-accent', exact: true },
  { to: '/litrpg/attributes', label: 'Attributes', icon: Shield, color: 'hover:text-nexus-accent' },
  { to: '/litrpg/classes', label: 'Classes', icon: Swords, color: 'hover:text-orange-400' },
  { to: '/litrpg/abilities', label: 'Abilities', icon: Zap, color: 'hover:text-yellow-400' },
  { to: '/litrpg/bestiary', label: 'Bestiary', icon: BookOpen, color: 'hover:text-purple-400' },
  { to: '/litrpg/loot', label: 'Loot', icon: Package, color: 'hover:text-green-400' },
  { to: '/litrpg/contracts', label: 'Contracts', icon: ScrollText, color: 'hover:text-nexus-success' },
];

export default function LitrpgNav() {
  const location = useLocation();
  const { theme } = useTheme();
  
  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Theme-aware styles
  const bgHeader = theme === 'light' ? 'bg-white/80' : 'bg-slate-900/80';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-slate-700';
  const textInactive = theme === 'light' ? 'text-gray-500' : 'text-slate-400';
  const bgActive = theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-800 border-slate-600';
  const bgHover = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-slate-800/50';

  return (
    <nav className={`${bgHeader} backdrop-blur-md border-b ${borderColor} sticky top-0 z-30`}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-10 flex items-center justify-center gap-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-all text-xs font-medium border ${
                  active 
                    ? `${bgActive} text-nexus-accent` 
                    : `${textInactive} ${item.color} border-transparent ${bgHover}`
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
