import { useEffect, useState } from "react";
import { Trash2, ExternalLink, RefreshCw, Users, FileText, MessageSquare, Clock, AlertCircle } from "lucide-react";

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

export default function CritiqueRoomManager() {
  const [sessions, setSessions] = useState<CritiqueSession[]>([]);
  const [users, setUsers] = useState<DiscordUser[]>([]);
  const [stats, setStats] = useState<CritiqueRoomStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'expiring' | 'comments'>('newest');

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

    const response = await fetch(`/api/admin/critiqueroom/sessions.php?${params.toString()}`, {
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Failed to load sessions');
    const data = await response.json();
    setSessions(data.sessions || []);
  };

  const loadUsers = async () => {
    const response = await fetch('/api/admin/critiqueroom/users.php', {
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Failed to load users');
    const data = await response.json();
    setUsers(data.users || []);
  };

  const loadStats = async () => {
    const response = await fetch('/api/admin/critiqueroom/stats.php', {
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Failed to load stats');
    const data = await response.json();
    setStats(data.stats || null);
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This will also delete all comments and feedback.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/critiqueroom/delete-session.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) throw new Error('Failed to delete session');

      setSuccess('Session deleted successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete session');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">CritiqueRoom Manager</h2>
          <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
            Manage critique sessions and Discord users
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-neutral-400 text-sm">
              <FileText size={16} />
              <span>Total Sessions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stats.total_sessions}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <Clock size={16} />
              <span>Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stats.active_sessions}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>Expired</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stats.expired_sessions}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-neutral-400 text-sm">
              <MessageSquare size={16} />
              <span>Comments</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stats.total_comments}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-neutral-400 text-sm">
              <Users size={16} />
              <span>Discord Users</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stats.total_users}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
              <FileText size={16} />
              <span>Last 24h</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
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

      {/* Sessions Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
        <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Critique Sessions ({sessions.length})
            </h3>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="expiring">Expiring Soon</option>
                <option value="comments">Most Comments</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Comments
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-neutral-900/50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {session.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400 font-mono">
                        {session.id}
                      </div>
                      {session.password_protected && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs rounded">
                          Password Protected
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {session.author_name}
                      </div>
                      {session.author_discord_id && (
                        <div className="text-xs text-gray-500 dark:text-neutral-400">
                          Discord: {session.author_discord_id.slice(0, 8)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-neutral-400">
                    {formatDate(session.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {getTimeRemaining(session.expires_at)}
                      </div>
                      {session.extension_count > 0 && (
                        <div className="text-xs text-gray-500 dark:text-neutral-400">
                          Extended {session.extension_count}x
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {session.comment_count}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/critiqueroom/session/${session.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        title="View Session"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        title="Delete Session"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sessions.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500 dark:text-neutral-400">
              No sessions found
            </div>
          )}
        </div>
      </div>

      {/* Discord Users Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
        <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Discord Users ({users.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Discord ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {users.map((user) => (
                <tr key={user.discord_id} className="hover:bg-gray-50 dark:hover:bg-neutral-900/50">
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.global_name || user.username}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-mono text-gray-600 dark:text-neutral-400">
                      {user.discord_id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {user.session_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-neutral-400">
                    {new Date(user.last_active).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500 dark:text-neutral-400">
              No Discord users found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
