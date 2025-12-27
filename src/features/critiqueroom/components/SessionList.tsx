/**
 * SessionList - User's session management page
 * Requires Discord authentication to view owned sessions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../storytime/contexts/ThemeContext';
import { useCritiqueRoomAuth } from '../contexts/CritiqueRoomAuthContext';
import PageNavbar from '../../../components/PageNavbar';
import SocialIcons from '../../../components/SocialIcons';
import { critiqueRoomAPI } from '../utils/api-critiqueroom';
import type { Session } from '../types';
import {
  Clock,
  MessageSquare,
  Trash2,
  ExternalLink,
  Users,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export function SessionList() {
  const { theme } = useTheme();
  const { user } = useCritiqueRoomAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme-aware styles
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
  const textMuted = theme === 'light' ? 'text-gray-500' : 'text-neutral-400';
  const cardBg = theme === 'light'
    ? 'bg-white/90 border-gray-200'
    : 'bg-neutral-900/90 border-white/10';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (user) {
        const userSessions = await critiqueRoomAPI.sessions.list();
        setSessions(userSessions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) {
      return;
    }

    try {
      await critiqueRoomAPI.sessions.delete(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const handleLogin = () => {
    critiqueRoomAPI.auth.loginWithDiscord('/critiqueroom/my-sessions');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExpirationStatus = (expiresAt: number | null | undefined) => {
    if (!expiresAt) return { text: 'Never expires', color: 'text-emerald-500' };
    
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return { text: 'Expired', color: 'text-red-500' };
    if (remaining < 24 * 60 * 60 * 1000) return { text: 'Expires soon', color: 'text-amber-500' };
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    return { text: `${days} day${days > 1 ? 's' : ''} left`, color: 'text-emerald-500' };
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${textPrimary}`}>
        <PageNavbar breadcrumbs={[
          { label: 'Critique Room', path: '/critiqueroom' },
          { label: 'My Sessions' }
        ]} />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin cr-brand-text" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen ${textPrimary}`}>
        <PageNavbar breadcrumbs={[
          { label: 'Critique Room', path: '/critiqueroom' },
          { label: 'My Sessions' }
        ]} />
        <div className="max-w-md mx-auto py-32 px-6">
          <div className={`${cardBg} rounded-[2.5rem] p-12 border shadow-2xl space-y-8 text-center`}>
            <Users size={48} className="mx-auto text-[#5865F2]" />
            <div className="space-y-2">
              <h1 className={`text-2xl font-black ${textPrimary}`}>Discord Login Required</h1>
              <p className={`text-sm ${textMuted}`}>
                Log in with Discord to view and manage your critique sessions.
              </p>
            </div>
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 bg-[#5865F2] text-white font-black py-4 rounded-2xl hover:bg-[#4752C4] transition-colors"
            >
              <Users size={20} />
              Login with Discord
            </button>
            <Link to="/critiqueroom" className={`block text-sm ${textMuted} hover:underline`}>
              ← Back to CritiqueRoom
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${textPrimary}`}>
      <PageNavbar breadcrumbs={[
        { label: 'Critique Room', path: '/critiqueroom' },
        { label: 'My Sessions' }
      ]} />

      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-black ${textPrimary}`}>My Sessions</h1>
            <p className={`${textMuted} text-sm mt-1`}>
              Logged in as <span className="font-bold">{user.displayName}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className={`p-2 rounded-xl ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'} transition-colors`}
              title="Refresh"
            >
              <RefreshCw size={18} className={textMuted} />
            </button>
            <Link
              to="/critiqueroom/workspace"
              className="px-6 py-3 cr-brand-bg text-white rounded-2xl font-bold hover:opacity-90 transition-all"
            >
              New Session
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className={`${cardBg} rounded-[2rem] p-16 border text-center space-y-4`}>
            <MessageSquare size={48} className={`mx-auto ${textMuted}`} />
            <h2 className={`text-xl font-bold ${textPrimary}`}>No Sessions Yet</h2>
            <p className={`${textMuted} max-w-sm mx-auto`}>
              Create your first critique session to start getting feedback on your writing.
            </p>
            <Link
              to="/critiqueroom/workspace"
              className="inline-block mt-4 px-8 py-4 cr-brand-bg text-white rounded-2xl font-bold hover:opacity-90 transition-all"
            >
              Start Writing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => {
              const expStatus = getExpirationStatus(session.expiresAt);
              return (
                <div
                  key={session.id}
                  className={`${cardBg} rounded-2xl p-6 border transition-all hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-bold ${textPrimary} truncate`}>
                          {session.title}
                        </h3>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${expStatus.color}`}>
                          {expStatus.text}
                        </span>
                      </div>
                      <div className={`flex flex-wrap items-center gap-4 text-sm ${textMuted}`}>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(session.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          {session.comments.length} comments
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-white/10'}`}>
                          {session.id}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-3">
                        {session.modes.slice(0, 3).map(mode => (
                          <span
                            key={mode}
                            className="px-2 py-1 cr-brand-bg/20 cr-brand-text rounded-full text-[9px] font-black uppercase"
                          >
                            {mode}
                          </span>
                        ))}
                        {session.modes.length > 3 && (
                          <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-white/10 text-neutral-400'}`}>
                            +{session.modes.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/critiqueroom/session/${session.id}`}
                        className={`p-2 rounded-xl ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'} transition-colors`}
                        title="Open Session"
                      >
                        <ExternalLink size={18} className={textMuted} />
                      </Link>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className={`p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors`}
                        title="Delete Session"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={`mt-16 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
        <SocialIcons variant="footer" showCopyright={true} />
      </footer>
    </div>
  );
}

export default SessionList;
