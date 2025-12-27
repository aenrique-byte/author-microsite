import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ExternalLink, RefreshCw, Users, FileText, MessageSquare, Clock, AlertCircle, ArrowLeft } from "lucide-react";

type CritiqueSession = {
  id: string;
  title: string;
  author_name: string;
  author_discord_id: string | null;
  created_at: number;
  expires_at: number | null;
  expiration: string;
  extension_count: number;
  comment_count: number;
  password_protected: boolean;
};

type DiscordUser = {
  discord_id: string;
  username: string;
  global_name: string | null;
  session_count: number;
  last_active: string;
};

type CritiqueRoomStats = {
  total_sessions: number;
  active_sessions: number;
  expired_sessions: number;
  total_comments: number;
  total_users: number;
  sessions_24h: number;
};

interface CritiqueRoomAdminPageProps {
  onExit: () => void;
}

export default function CritiqueRoomAdminPage({ onExit }: CritiqueRoomAdminPageProps) {
  const [sessions, setSessions] = useState<CritiqueSession[]>([]);
  const [users, setUsers] = useState<DiscordUser[]>([]);
  const [stats, setStats] = useState<CritiqueRoomStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'expiring' | 'comments'>('newest');
  const [activeTab, setActiveTab] = useState<'sessions' | 'users'>('sessions');

  useEffect(() => {
    loadData();
  }, [statusFilter, sortBy]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadSessions(),
        loadUsers(),
        loadStats()
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (sortBy) params.set('sort', sortBy);

    const response = await fetch(`/api/critiqueroom/admin/sessions.php?${params.toString()}`, {
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Failed to load sessions');
    const data = await response.json();
    setSessions(data.sessions || []);
  };

  const loadUsers = async () => {
    const response = await fetch('/api/critiqueroom/admin/users.php', {
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Failed to load users');
    const data = await response.json();
    setUsers(data.users || []);
  };

  const loadStats = async () => {
    const response = await fetch('/api/critiqueroom/admin/stats.php', {
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Failed to load stats');
    const data = await response.json();
    setStats(data.stats || null);
  };

  const deleteSession = async (sessionId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis will also delete all comments and feedback.`)) {
      return;
    }

    try {
      const response = await fetch('/api/critiqueroom/admin/delete-session.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ session_id: sessionId })
      });

      if (!response.ok) throw new Error('Failed to delete session');

      setSuccess('Session deleted successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete session');
      setTimeout(() => setError(null), 5000);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt: number | null) => {
    if (!expiresAt) return 'Never';

    const now = Date.now();
    const diff = expiresAt - now;

    if (diff < 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '<1h';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/critiqueroom"
                className="text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  CritiqueRoom Admin
                </h1>
                <p className="text-sm text-gray-600 dark:text-neutral-400 mt-0.5">
                  Manage critique sessions and users
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-neutral-400 text-sm mb-2">
                <FileText size={16} />
                <span>Total</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total_sessions}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm mb-2">
                <Clock size={16} />
                <span>Active</span>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.active_sessions}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-2">
                <AlertCircle size={16} />
                <span>Expired</span>
              </div>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.expired_sessions}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-neutral-400 text-sm mb-2">
                <MessageSquare size={16} />
                <span>Comments</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total_comments}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-neutral-400 text-sm mb-2">
                <Users size={16} />
                <span>Users</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total_users}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm mb-2">
                <FileText size={16} />
                <span>Last 24h</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.sessions_24h}
              </p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'sessions'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Discord Users ({users.length})
          </button>
        </div>

        {/* Sessions Table */}
        {activeTab === 'sessions' && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                All Sessions
              </h3>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="expired">Expired Only</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="expiring">Expiring Soon</option>
                  <option value="comments">Most Comments</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-neutral-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase">
                      Session
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase">
                      Author
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase">
                      Expires
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase">
                      Comments
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/30">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white mb-1">
                            {session.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-neutral-500 font-mono">
                            {session.id}
                          </div>
                          {session.password_protected && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-medium rounded">
                              🔒 Protected
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {session.author_name}
                          </div>
                          {session.author_discord_id && (
                            <div className="text-xs text-gray-500 dark:text-neutral-500 mt-0.5">
                              {session.author_discord_id.slice(0, 10)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-neutral-400">
                        {formatDate(session.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className={`text-sm font-semibold ${
                            session.expires_at && session.expires_at < Date.now()
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {getTimeRemaining(session.expires_at)}
                          </div>
                          {session.extension_count > 0 && (
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                              +{session.extension_count} ext
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-full text-sm font-semibold">
                          <MessageSquare size={14} />
                          {session.comment_count}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <a
                            href={`/critiqueroom/session/${session.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                            title="View Session"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button
                            onClick={() => deleteSession(session.id, session.title)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                            title="Delete Session"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sessions.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-500 dark:text-neutral-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">No sessions found</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-16">
                  <div className="inline-block w-8 h-8 border-4 border-gray-300 dark:border-neutral-700 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Discord Users
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-neutral-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase">
                      Discord ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase">
                      Sessions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                  {users.map((user) => (
                    <tr key={user.discord_id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/30">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {user.global_name || user.username}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-mono text-gray-600 dark:text-neutral-400">
                          {user.discord_id}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300 rounded-full text-sm font-semibold">
                          {user.session_count}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-neutral-400">
                        {new Date(user.last_active).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-500 dark:text-neutral-400">
                  <Users size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">No Discord users found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
