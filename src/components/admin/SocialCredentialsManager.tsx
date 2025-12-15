/**
 * SocialCredentialsManager Component
 * 
 * Admin interface for managing social media platform credentials.
 * Supports manual token entry (Phase 4 approach).
 *
 * @package AuthorCMS
 * @since Phase 4 - Social Media Integration
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Check, X, AlertTriangle, RefreshCw, Eye, EyeOff,
  ExternalLink, Clock, Wifi, WifiOff
} from 'lucide-react';

// Platform info and icons
const PLATFORMS: Record<string, {
  name: string;
  icon: string;
  color: string;
  description: string;
  docsUrl: string;
  fields: string[];
  disabled?: boolean;
}> = {
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: 'from-pink-500 to-purple-600',
    description: 'Requires Instagram Business Account + Facebook Page',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api/',
    fields: ['access_token', 'instagram_user_id', 'facebook_page_id'],
    disabled: false
  },
  twitter: {
    name: 'Twitter/X',
    icon: '𝕏',
    color: 'from-blue-400 to-blue-600',
    description: 'Requires Twitter Developer Account (Basic tier+)',
    docsUrl: 'https://developer.twitter.com/en/docs/twitter-api',
    fields: ['access_token', 'username'],
    disabled: false
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: 'from-blue-600 to-blue-800',
    description: 'Requires Facebook Page + Page Access Token',
    docsUrl: 'https://developers.facebook.com/docs/pages-api/',
    fields: ['access_token', 'page_id'],
    disabled: false
  },
  discord: {
    name: 'Discord',
    icon: '💬',
    color: 'from-indigo-500 to-purple-600',
    description: 'Uses webhook URL (no OAuth needed)',
    docsUrl: 'https://discord.com/developers/docs/resources/webhook',
    fields: ['webhook_url', 'guild_id'],
    disabled: false
  },
  threads: {
    name: 'Threads',
    icon: '@',
    color: 'from-gray-600 to-gray-800',
    description: 'Coming soon - Uses Instagram API',
    docsUrl: '#',
    fields: ['access_token'],
    disabled: true
  },
  bluesky: {
    name: 'Bluesky',
    icon: '🦋',
    color: 'from-sky-400 to-blue-500',
    description: 'Coming soon',
    docsUrl: '#',
    fields: ['access_token'],
    disabled: true
  },
  youtube: {
    name: 'YouTube',
    icon: '▶️',
    color: 'from-red-500 to-red-700',
    description: 'Coming soon - For community posts',
    docsUrl: '#',
    fields: ['access_token'],
    disabled: true
  }
};

interface PlatformCredential {
  platform: string;
  status: 'connected' | 'not_connected' | 'expired' | 'expiring_soon';
  is_active: boolean;
  has_credentials: boolean;
  expires_at: string | null;
  expires_in_days: number | null;
  last_used_at: string | null;
  config: {
    has_page_id: boolean;
    has_webhook_url: boolean;
    has_instagram_user_id: boolean;
  };
}

interface CredentialsResponse {
  success: boolean;
  platforms: Record<string, PlatformCredential>;
  summary: {
    total_platforms: number;
    connected: number;
    expiring_soon: number;
  };
}

export default function SocialCredentialsManager() {
  const [platforms, setPlatforms] = useState<Record<string, PlatformCredential>>({});
  const [summary, setSummary] = useState({ total_platforms: 0, connected: 0, expiring_soon: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showTokens, setShowTokens] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch credentials
  const fetchCredentials = useCallback(async () => {
    try {
      const response = await fetch('/api/social/credentials/get.php', {
        credentials: 'include'
      });
      const data: CredentialsResponse = await response.json();
      
      if (data.success) {
        setPlatforms(data.platforms);
        setSummary(data.summary);
      } else {
        setError('Failed to load credentials');
      }
    } catch (err) {
      setError('Network error loading credentials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Test connection
  const testConnection = async (platform: string) => {
    setTesting(platform);
    try {
      const response = await fetch('/api/social/credentials/update.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, action: 'test' })
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`✓ ${PLATFORMS[platform as keyof typeof PLATFORMS]?.name} connected!\nAccount: ${data.account || 'Connected'}`);
      } else {
        alert(`✗ Connection failed: ${data.error || data.message}`);
      }
    } catch {
      alert('Network error testing connection');
    } finally {
      setTesting(null);
    }
  };

  // Disconnect platform
  const disconnectPlatform = async (platform: string) => {
    if (!confirm(`Disconnect ${PLATFORMS[platform as keyof typeof PLATFORMS]?.name}? You'll need to re-enter credentials to reconnect.`)) {
      return;
    }

    try {
      const response = await fetch('/api/social/credentials/update.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, action: 'disconnect' })
      });
      const data = await response.json();
      
      if (data.success) {
        fetchCredentials();
      } else {
        alert(`Failed to disconnect: ${data.error}`);
      }
    } catch {
      alert('Network error');
    }
  };

  // Open edit modal
  const openEditor = (platform: string) => {
    setEditingPlatform(platform);
    setFormData({});
    setShowTokens(false);
  };

  // Save credentials
  const saveCredentials = async () => {
    if (!editingPlatform) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Build config based on platform
      const config: Record<string, string> = {};
      if (formData.webhook_url) config.webhook_url = formData.webhook_url;
      if (formData.page_id) config.page_id = formData.page_id;
      if (formData.instagram_user_id) config.instagram_user_id = formData.instagram_user_id;
      if (formData.facebook_page_id) config.facebook_page_id = formData.facebook_page_id;
      if (formData.guild_id) config.guild_id = formData.guild_id;
      if (formData.username) config.username = formData.username;
      
      const payload: Record<string, unknown> = {
        platform: editingPlatform,
        action: 'update',
        is_active: true
      };
      
      if (formData.access_token) {
        payload.access_token = formData.access_token;
      }
      
      if (formData.token_expires_at) {
        payload.token_expires_at = formData.token_expires_at;
      }
      
      if (Object.keys(config).length > 0) {
        payload.config = config;
      }
      
      console.log('Saving credentials:', payload);
      
      const response = await fetch('/api/social/credentials/update.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Check for HTTP errors first
      if (!response.ok) {
        const text = await response.text();
        console.error('HTTP Error:', response.status, text);
        setError(`Server error (${response.status}): ${text.substring(0, 200)}`);
        return;
      }
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (data.success) {
        setEditingPlatform(null);
        setError(null);
        fetchCredentials();
        alert(`✓ ${PLATFORMS[editingPlatform as keyof typeof PLATFORMS]?.name} credentials saved!`);
      } else {
        setError(data.error || data.message || 'Unknown error saving credentials');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
            <Check className="w-3 h-3" /> Connected
          </span>
        );
      case 'expiring_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
            <AlertTriangle className="w-3 h-3" /> Expiring Soon
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
            <X className="w-3 h-3" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            <WifiOff className="w-3 h-3" /> Not Connected
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Social Media Integrations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Connect your social accounts to enable blog crossposting
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Wifi className="w-4 h-4" />
            {summary.connected} connected
          </span>
          {summary.expiring_soon > 0 && (
            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              {summary.expiring_soon} expiring
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Platform Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(PLATFORMS).map(([key, platform]) => {
          const cred = platforms[key];
          const isDisabled = platform.disabled;
          
          return (
            <div
              key={key}
              className={`relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${isDisabled ? 'opacity-50' : ''}`}
            >
              {/* Platform header */}
              <div className={`px-4 py-3 bg-gradient-to-r ${platform.color} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{platform.icon}</span>
                    <span className="font-semibold">{platform.name}</span>
                  </div>
                  {cred && getStatusBadge(cred.status)}
                </div>
              </div>
              
              {/* Platform body */}
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {platform.description}
                </p>
                
                {cred?.last_used_at && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    Last used: {new Date(cred.last_used_at).toLocaleDateString()}
                  </div>
                )}
                
                {cred?.expires_in_days !== null && cred.expires_in_days <= 30 && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Token expires in {cred.expires_in_days} days
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {!isDisabled && (
                    <>
                      {cred?.status === 'connected' || cred?.status === 'expiring_soon' ? (
                        <>
                          <button
                            onClick={() => testConnection(key)}
                            disabled={testing === key}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                          >
                            {testing === key ? 'Testing...' : 'Test'}
                          </button>
                          <button
                            onClick={() => openEditor(key)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => disconnectPlatform(key)}
                            className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openEditor(key)}
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                          Connect
                        </button>
                      )}
                      <a
                        href={platform.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
                      >
                        Docs <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                  {isDisabled && (
                    <span className="text-xs text-gray-400 italic">Coming soon</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingPlatform && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className={`px-6 py-4 bg-gradient-to-r ${PLATFORMS[editingPlatform as keyof typeof PLATFORMS]?.color} text-white rounded-t-lg`}>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span>{PLATFORMS[editingPlatform as keyof typeof PLATFORMS]?.icon}</span>
                Configure {PLATFORMS[editingPlatform as keyof typeof PLATFORMS]?.name}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Platform-specific fields */}
              {editingPlatform === 'discord' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Webhook URL *
                    </label>
                    <input
                      type="text"
                      value={formData.webhook_url || ''}
                      onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get this from Server Settings → Integrations → Webhooks
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Guild ID (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.guild_id || ''}
                      onChange={(e) => setFormData({ ...formData, guild_id: e.target.value })}
                      placeholder="Server ID for message links"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Access Token *
                    </label>
                    <div className="relative">
                      <input
                        type={showTokens ? 'text' : 'password'}
                        value={formData.access_token || ''}
                        onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                        placeholder="Paste your access token"
                        className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTokens(!showTokens)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  {editingPlatform === 'instagram' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Instagram User ID *
                        </label>
                        <input
                          type="text"
                          value={formData.instagram_user_id || ''}
                          onChange={(e) => setFormData({ ...formData, instagram_user_id: e.target.value })}
                          placeholder="Your Instagram Business Account ID"
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Facebook Page ID
                        </label>
                        <input
                          type="text"
                          value={formData.facebook_page_id || ''}
                          onChange={(e) => setFormData({ ...formData, facebook_page_id: e.target.value })}
                          placeholder="Linked Facebook Page ID"
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>
                    </>
                  )}
                  
                  {editingPlatform === 'facebook' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Page ID *
                      </label>
                      <input
                        type="text"
                        value={formData.page_id || ''}
                        onChange={(e) => setFormData({ ...formData, page_id: e.target.value })}
                        placeholder="Your Facebook Page ID"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                  
                  {editingPlatform === 'twitter' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Username (for URLs)
                      </label>
                      <input
                        type="text"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="@username (without @)"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Token Expiry Date (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.token_expires_at || ''}
                      onChange={(e) => setFormData({ ...formData, token_expires_at: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We'll remind you before it expires
                    </p>
                  </div>
                </>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => setEditingPlatform(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCredentials}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
