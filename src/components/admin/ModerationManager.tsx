import { useEffect, useState } from "react";

type Comment = {
  id: number;
  content: string;
  author_name: string;
  author_email?: string;
  ip_address: string;
  is_approved: number;
  created_at: string;
  comment_type: 'image' | 'chapter';
  content_title: string;
  content_context: string;
  content_link: string;
  content_id: number;
};

type BannedIP = {
  id: number;
  ip_address: string;
  reason?: string | null;
  banned_at: string;
  banned_by: number;
  banned_by_username?: string;
};

type ModerationStats = {
  pending_comments: number;
  approved_comments: number;
  rejected_comments: number;
  banned_ips: number;
};

export default function ModerationManager() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'images' | 'stories'>('all');

  // Ban IP form state
  const [showBanForm, setShowBanForm] = useState(false);
  const [banForm, setBanForm] = useState({
    ip_address: "",
    reason: ""
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, contentTypeFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadComments(),
        loadBannedIPs(),
        loadStats()
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (contentTypeFilter !== 'all') params.set('type', contentTypeFilter);
    
    const response = await fetch(`/api/admin/comments/list.php?${params.toString()}`, {
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Failed to load comments');
    const data = await response.json();
    setComments(data.comments || []);
  };

  const loadBannedIPs = async () => {
    const response = await fetch('/api/admin/banned-ips/list.php', {
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Failed to load banned IPs');
    const data = await response.json();
    setBannedIPs(data.banned_ips || []);
  };

  const loadStats = async () => {
    const response = await fetch('/api/admin/mod-stats.php', {
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Failed to load stats');
    const data = await response.json();
    setStats(data);
  };

  const handleCommentAction = async (commentId: number, action: 'approve' | 'reject' | 'delete') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/comments/moderate.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: commentId, action })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to ${action} comment`);
      }

      setSuccess(`Comment ${action}d successfully!`);
      await loadData();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} comment`);
    } finally {
      setLoading(false);
    }
  };

  const handleBanIP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/ban-ip.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(banForm)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to ban IP');
      }

      setSuccess('IP address banned successfully!');
      setShowBanForm(false);
      setBanForm({ ip_address: "", reason: "" });
      await loadBannedIPs();
      await loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to ban IP');
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanIP = async (ipId: number) => {
    if (!confirm('Are you sure you want to unban this IP address?')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/unban-ip.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: ipId })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to unban IP');
      }

      setSuccess('IP address unbanned successfully!');
      await loadBannedIPs();
      await loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to unban IP');
    } finally {
      setLoading(false);
    }
  };

  const quickBanIP = (ip: string) => {
    setBanForm({ ip_address: ip, reason: "Spam/inappropriate content" });
    setShowBanForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getContentInfo = (comment: Comment) => {
    return { 
      type: comment.comment_type === 'image' ? 'Image' : 'Chapter', 
      title: comment.content_title 
    };
  };

  const getCommentStatus = (comment: Comment): 'pending' | 'approved' | 'rejected' => {
    return comment.is_approved === 1 ? 'approved' : 'pending';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Moderation Manager</h2>
        <button
          onClick={() => setShowBanForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Ban IP Address
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_comments}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending Comments</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.approved_comments}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Approved Comments</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{stats.rejected_comments}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Rejected Comments</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">{stats.banned_ips}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Banned IPs</div>
          </div>
        </div>
      )}

      {/* Ban IP Form Modal */}
      {showBanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Ban IP Address
            </h3>
            <form onSubmit={handleBanIP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  IP Address
                </label>
                <input
                  type="text"
                  value={banForm.ip_address}
                  onChange={(e) => setBanForm(prev => ({ ...prev, ip_address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="192.168.1.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={banForm.reason}
                  onChange={(e) => setBanForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Reason for banning this IP..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Banning...' : 'Ban IP'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBanForm(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Comments</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content Type
            </label>
            <select
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value as typeof contentTypeFilter)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Content</option>
              <option value="images">Images</option>
              <option value="stories">Stories</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Comments</h3>
          {loading ? (
            <div className="text-center py-4">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No comments found</div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const contentInfo = getContentInfo(comment);
                return (
                  <div key={comment.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {comment.author_name}
                          </span>
                          {comment.author_email && (
                            <span className="text-sm text-gray-500">
                              {comment.author_email}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            IP: {comment.ip_address}
                          </span>
                          <button
                            onClick={() => quickBanIP(comment.ip_address)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Ban IP
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            getCommentStatus(comment) === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {getCommentStatus(comment)}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            on {contentInfo.type}: 
                            <a 
                              href={comment.content_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline ml-1"
                            >
                              {contentInfo.title}
                            </a>
                          </span>
                          <span className="text-xs text-gray-500">
                            ({comment.content_context})
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          {comment.content}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(comment.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {getCommentStatus(comment) === 'pending' && (
                          <>
                            <button
                              onClick={() => handleCommentAction(comment.id, 'approve')}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              Approve
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleCommentAction(comment.id, 'delete')}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Banned IPs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Banned IP Addresses</h3>
          {bannedIPs.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No banned IPs</div>
          ) : (
            <div className="space-y-3">
              {bannedIPs.map((ban) => (
                <div key={ban.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-gray-900 dark:text-white">
                          {ban.ip_address}
                        </span>
                        <span className="text-sm text-gray-500">
                          Banned by: {ban.banned_by_username || `User ${ban.banned_by}`}
                        </span>
                      </div>
                      {ban.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Reason: {ban.reason}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Banned on: {formatDate(ban.banned_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnbanIP(ban.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Unban
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
