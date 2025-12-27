/**
 * CritiqueRoom Home Page
 * Landing page for the CritiqueRoom feature
 * Migrated from critiqueroom/pages/LandingPage.tsx with theme support
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  PenTool,
  Shield,
  Zap,
  Target,
  MessageSquare,
  Users,
  Clock,
  X,
  Bookmark,
  LogOut
} from 'lucide-react';
import PageNavbar from '../../../components/PageNavbar';
import SocialIcons from '../../../components/SocialIcons';
import { useTheme } from '../../storytime/contexts/ThemeContext';
import { useCritiqueRoomAuth } from '../contexts/CritiqueRoomAuthContext';

// Quick Guide Modal Component
function QuickGuide({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  
  if (!isOpen) return null;

  const cardBg = theme === 'light' 
    ? 'bg-white' 
    : 'bg-neutral-900';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
  const textMuted = theme === 'light' ? 'text-gray-500' : 'text-neutral-400';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-white/10';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`${cardBg} w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl relative animate-in zoom-in-95 duration-300 hide-scrollbar`}>
        <button 
          onClick={onClose}
          className={`absolute top-8 right-8 p-2 ${theme === 'light' ? 'bg-gray-100 text-gray-400 hover:text-gray-600' : 'bg-neutral-800 text-neutral-400 hover:text-white'} rounded-full transition-colors`}
        >
          <X size={20} />
        </button>

        <div className="p-12 md:p-16 space-y-12">
          <div className="text-center space-y-4">
            <h2 className={`text-4xl font-black ${textPrimary} tracking-tight`}>How it Works</h2>
            <p className={`${textMuted} font-medium`}>Focused critique, better writing, zero friction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Author Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 cr-brand-text">
                <PenTool size={24} />
                <h3 className="text-xl font-black uppercase tracking-widest">For Authors</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full cr-brand-bg/20 cr-brand-text flex items-center justify-center flex-shrink-0 font-black text-sm">1</div>
                  <div className="space-y-1">
                    <p className={`font-bold ${textPrimary}`}>Draft & Import</p>
                    <p className={`text-sm ${textMuted} leading-relaxed`}>Paste text or upload .docx files. Use the Author Workspace to polish your draft before sharing.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full cr-brand-bg/20 cr-brand-text flex items-center justify-center flex-shrink-0 font-black text-sm">2</div>
                  <div className="space-y-1">
                    <p className={`font-bold ${textPrimary}`}>Set Feedback Goals</p>
                    <p className={`text-sm ${textMuted} leading-relaxed`}>Choose specific "Modes" like Pacing or Character Voice. This tells readers exactly where to focus.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full cr-brand-bg/20 cr-brand-text flex items-center justify-center flex-shrink-0 font-black text-sm">3</div>
                  <div className="space-y-1">
                    <p className={`font-bold ${textPrimary}`}>Mark Sections</p>
                    <p className={`text-sm ${textMuted} leading-relaxed`}>In Preview mode, click the <Bookmark size={14} className="inline" /> icon to label chapters or structural milestones.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Reviewer Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-emerald-500">
                <BookOpen size={24} />
                <h3 className="text-xl font-black uppercase tracking-widest">For Reviewers</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0 font-black text-sm">1</div>
                  <div className="space-y-1">
                    <p className={`font-bold ${textPrimary}`}>Precision Critique</p>
                    <p className={`text-sm ${textMuted} leading-relaxed`}>Highlight specific words or sentences to leave inline comments. Be precise with your feedback.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0 font-black text-sm">2</div>
                  <div className="space-y-1">
                    <p className={`font-bold ${textPrimary}`}>Guided Discussion</p>
                    <p className={`text-sm ${textMuted} leading-relaxed`}>Click any paragraph to start a discussion. Check the "Guided Critique" prompts in the sidebar.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0 font-black text-sm">3</div>
                  <div className="space-y-1">
                    <p className={`font-bold ${textPrimary}`}>Overall Thoughts</p>
                    <p className={`text-sm ${textMuted} leading-relaxed`}>Use the panel at the bottom for big-picture feedback on what worked and what didn't.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className={`pt-8 border-t ${borderColor} flex flex-col items-center gap-4`}>
            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${textMuted}`}>
                <Shield size={14} className="cr-brand-text" /> Private Sessions
              </div>
              <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${textMuted}`}>
                <Zap size={14} className="text-amber-400" /> Temporary Data
              </div>
              <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${textMuted}`}>
                <Target size={14} className="text-emerald-400" /> Goal-Oriented
              </div>
            </div>
            <button 
              onClick={onClose}
              className="px-12 py-4 cr-brand-bg text-white rounded-2xl font-black text-lg hover:opacity-90 shadow-xl transition-all active:scale-95"
            >
              Got it, let's go!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CritiqueRoomHomeProps {
  onAdminLogin?: () => void;
}

export function CritiqueRoomHome({ onAdminLogin }: CritiqueRoomHomeProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user: discordUser, loginWithDiscord, logout } = useCritiqueRoomAuth();
  const [sessionId, setSessionId] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Light-first theme styles (matching original /critiqueroom design)
  // pageBg is transparent to let dynamic background from route show through
  const textPrimary = theme === 'light' ? 'text-slate-900' : 'text-white';
  const textSecondary = theme === 'light' ? 'text-slate-600' : 'text-slate-300';
  const textMuted = theme === 'light' ? 'text-slate-500' : 'text-slate-400';
  const cardBg = theme === 'light'
    ? 'bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl'
    : 'bg-neutral-900/95 border-white/10 backdrop-blur-xl';
  const inputBg = theme === 'light'
    ? 'bg-white/90 border-slate-200'
    : 'bg-neutral-800/90 border-white/10';

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId.trim()) {
      navigate(`/critiqueroom/session/${sessionId.trim().toUpperCase()}`);
    }
  };

  const handleDiscordLogin = () => {
    loginWithDiscord(window.location.pathname);
  };

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div className={`min-h-screen ${textPrimary}`}>
      <QuickGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      
      {/* Navbar - no breadcrumbs on landing page */}
      <PageNavbar showBreadcrumbs={false} />

      {/* Privacy Banner */}
      <div className="cr-brand-bg text-white py-2 px-4 text-sm font-medium flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <Shield size={16} />
          <span>No-AI Policy: Your text is not used for AI training.</span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Clock size={16} />
          <span>Private & Temporary Sessions.</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto py-20 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className={`text-6xl font-black ${textPrimary} tracking-tighter leading-tight`}>
                Feedback that <span className="cr-brand-text">actually</span> helps.
              </h1>
              <p className={`text-xl ${textSecondary} font-medium leading-relaxed`}>
                Skip the Google Docs friction. Share your WIP, set specific feedback goals, and get structured critique from your community.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/critiqueroom/workspace"
                className={`px-8 py-4 ${theme === 'light' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-900/50'} text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl`}
              >
                Start a Session <ArrowRight size={20} />
              </Link>
              <div className={`h-px w-full sm:w-px sm:h-auto ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
              <form onSubmit={handleJoin} className="flex-grow flex gap-2">
                <input
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Session ID (e.g. AB12XY)"
                  className={`flex-grow px-6 py-4 rounded-2xl ${inputBg} border font-bold tracking-widest focus:ring-4 ${theme === 'light' ? 'focus:ring-indigo-100' : 'focus:ring-indigo-500/20'} outline-none transition-all`}
                />
                <button
                  type="submit"
                  className={`px-6 py-4 ${theme === 'light' ? 'bg-slate-900 hover:bg-black text-white' : 'bg-white text-slate-900 hover:bg-gray-100'} rounded-2xl font-bold transition-all`}
                >
                  Join
                </button>
              </form>
            </div>

            {/* User Actions */}
            <div className={`flex items-center gap-4 pt-4 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
              {discordUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${textPrimary}`}>{discordUser.displayName}</p>
                    <div className="flex items-center gap-2">
                      <Link to="/critiqueroom/my-sessions" className={`text-xs ${theme === 'light' ? 'text-indigo-600 hover:text-indigo-700' : 'text-indigo-400 hover:text-indigo-300'} hover:underline`}>
                        View My Sessions
                      </Link>
                      <span className={`text-xs ${textMuted}`}>•</span>
                      <button 
                        onClick={handleLogout}
                        className={`text-xs ${theme === 'light' ? 'text-red-500 hover:text-red-600' : 'text-red-400 hover:text-red-300'} hover:underline flex items-center gap-1`}
                      >
                        <LogOut size={12} /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleDiscordLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded-xl font-bold text-sm hover:bg-[#4752C4] transition-colors"
                >
                  <Users size={16} />
                  Login with Discord
                </button>
              )}
              <button
                onClick={() => setIsGuideOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/20 text-white'} rounded-xl font-bold text-sm transition-colors`}
              >
                <BookOpen size={16} />
                How it Works
              </button>
            </div>
          </div>

          {/* Demo Card */}
          <div className="relative">
            <div className={`absolute -inset-10 ${theme === 'light' ? 'bg-indigo-50' : 'bg-indigo-500/10'} rounded-full blur-3xl opacity-50 -z-10`} />
            <div className={`${cardBg} p-8 rounded-[2.5rem] border space-y-6 rotate-2 transform hover:rotate-0 transition-transform duration-500`}>
              <div className={`flex items-center gap-3 border-b pb-4 ${theme === 'light' ? 'border-slate-100' : 'border-white/10'}`}>
                <div className="w-10 h-10 rounded-xl bg-green-400 flex items-center justify-center text-white font-black text-xs">KT</div>
                <div>
                  <div className={`text-sm font-black ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Katniss</div>
                  <div className={`text-[10px] ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'} font-bold uppercase tracking-widest`}>Reader</div>
                </div>
              </div>
              <p className={`font-serif text-lg ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'} italic leading-relaxed`}>
                "The way you handled the internal monologue here really captures the character's voice. However, the pacing feels a bit rushed..."
              </p>
              <div className="flex gap-2">
                <span className={`px-3 py-1 ${theme === 'light' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'} rounded-full text-[10px] font-black uppercase tracking-widest border`}>Character Voice</span>
                <span className={`px-3 py-1 ${theme === 'light' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-white/5 text-slate-500 border-white/10'} rounded-full text-[10px] font-black uppercase tracking-widest border`}>Pacing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto py-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${cardBg} p-8 rounded-2xl border`}>
            <div className={`w-12 h-12 rounded-xl ${theme === 'light' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/20 text-indigo-400'} flex items-center justify-center mb-4`}>
              <MessageSquare size={24} />
            </div>
            <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>Precision Feedback</h3>
            <p className={`text-sm ${textMuted}`}>
              Highlight specific text for inline comments. No more vague "this part felt off" notes.
            </p>
          </div>
          <div className={`${cardBg} p-8 rounded-2xl border`}>
            <div className={`w-12 h-12 rounded-xl ${theme === 'light' ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'} flex items-center justify-center mb-4`}>
              <Target size={24} />
            </div>
            <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>Goal-Oriented</h3>
            <p className={`text-sm ${textMuted}`}>
              Set feedback modes to tell reviewers exactly what kind of feedback you're looking for.
            </p>
          </div>
          <div className={`${cardBg} p-8 rounded-2xl border`}>
            <div className={`w-12 h-12 rounded-xl ${theme === 'light' ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/20 text-amber-400'} flex items-center justify-center mb-4`}>
              <Shield size={24} />
            </div>
            <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>Private & Temporary</h3>
            <p className={`text-sm ${textMuted}`}>
              Sessions expire automatically. Your work is never used for AI training or shared publicly.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`mt-16 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="max-w-6xl mx-auto py-12 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div>
              <h2 className={`${textPrimary} font-bold text-xl mb-2`}>CritiqueRoom</h2>
              <p className={`max-w-md text-sm ${textMuted}`}>
                Built for Discord writing communities. Focus on feedback that actually helps authors grow.
              </p>
              {onAdminLogin && (
                <button
                  onClick={onAdminLogin}
                  className={`mt-3 text-xs ${textMuted} ${theme === 'light' ? 'hover:text-indigo-600' : 'hover:text-indigo-400'} transition-colors`}
                >
                  Admin Login
                </button>
              )}
            </div>
            <div className={`text-sm text-right ${textMuted}`}>
              <p>&copy; {new Date().getFullYear()} CritiqueRoom. No scraping allowed.</p>
              <p className="mt-1">Private. Temporary. Human-first.</p>
            </div>
          </div>
          <SocialIcons variant="footer" showCopyright={false} />
        </div>
      </footer>
    </div>
  );
}

export default CritiqueRoomHome;
