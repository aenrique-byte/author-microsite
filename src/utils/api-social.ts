/**
 * Social Media API Client
 * 
 * Frontend API functions for social media crossposting.
 *
 * @package AuthorCMS
 * @since Phase 4 - Social Media Integration
 */

const API_BASE = '/api/social';

// Types
export interface PlatformCredential {
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

export interface CredentialsResponse {
  success: boolean;
  platforms: Record<string, PlatformCredential>;
  summary: {
    total_platforms: number;
    connected: number;
    expiring_soon: number;
  };
}

export interface CrosspostResult {
  success: boolean;
  platform_post_id?: string | null;
  post_url?: string | null;
  error?: string;
  skipped?: boolean;
  message?: string;
}

export interface CrosspostResponse {
  success: boolean;
  message: string;
  results: Record<string, CrosspostResult>;
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

export interface SocialPostSettings {
  platform: string;
  enabled: boolean;
  custom_message?: string;
}

// Fetch credentials status for all platforms
export async function getSocialCredentials(): Promise<CredentialsResponse> {
  const response = await fetch(`${API_BASE}/credentials/get.php`, {
    credentials: 'include'
  });
  return response.json();
}

// Update platform credentials
export async function updateSocialCredentials(
  platform: string,
  data: {
    action?: 'update' | 'disconnect' | 'test';
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: string;
    config?: Record<string, string>;
    is_active?: boolean;
  }
): Promise<{ success: boolean; message?: string; error?: string; account?: string }> {
  const response = await fetch(`${API_BASE}/credentials/update.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, ...data })
  });
  return response.json();
}

// Test platform connection
export async function testPlatformConnection(platform: string): Promise<{
  success: boolean;
  message?: string;
  account?: string;
  error?: string;
}> {
  return updateSocialCredentials(platform, { action: 'test' });
}

// Disconnect platform
export async function disconnectPlatform(platform: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  return updateSocialCredentials(platform, { action: 'disconnect' });
}

// Crosspost a blog post to social media
export async function crosspostBlogPost(
  blogPostId: number,
  options?: {
    platforms?: string[];
    custom_messages?: Record<string, string>;
  }
): Promise<CrosspostResponse> {
  const response = await fetch(`${API_BASE}/post.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blog_post_id: blogPostId,
      ...options
    })
  });
  return response.json();
}

// Get crosspost settings for a blog post
export async function getBlogCrosspostSettings(blogPostId: number): Promise<{
  success: boolean;
  settings: SocialPostSettings[];
  social_posts: Array<{
    platform: string;
    status: string;
    post_url?: string;
    platform_post_id?: string;
    posted_at?: string;
    error_message?: string;
  }>;
}> {
  const response = await fetch(`/api/blog/crosspost-settings.php?blog_post_id=${blogPostId}`, {
    credentials: 'include'
  });
  return response.json();
}

// Save crosspost settings for a blog post
export async function saveBlogCrosspostSettings(
  blogPostId: number,
  settings: SocialPostSettings[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`/api/blog/crosspost-settings.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blog_post_id: blogPostId,
      settings
    })
  });
  return response.json();
}

// Helper: Get list of connected platforms
export async function getConnectedPlatforms(): Promise<string[]> {
  const data = await getSocialCredentials();
  if (!data.success) return [];
  
  return Object.entries(data.platforms)
    .filter(([_, cred]) => cred.status === 'connected' || cred.status === 'expiring_soon')
    .map(([platform]) => platform);
}

// Helper: Check if any platforms are connected
export async function hasConnectedPlatforms(): Promise<boolean> {
  const connected = await getConnectedPlatforms();
  return connected.length > 0;
}

// Platform display info
export const PLATFORM_INFO: Record<string, {
  name: string;
  icon: string;
  color: string;
}> = {
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F'
  },
  twitter: {
    name: 'Twitter/X',
    icon: '𝕏',
    color: '#1DA1F2'
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2'
  },
  discord: {
    name: 'Discord',
    icon: '💬',
    color: '#5865F2'
  },
  threads: {
    name: 'Threads',
    icon: '@',
    color: '#000000'
  },
  bluesky: {
    name: 'Bluesky',
    icon: '🦋',
    color: '#0085ff'
  },
  youtube: {
    name: 'YouTube',
    icon: '▶️',
    color: '#FF0000'
  }
};

// Get readable platform name
export function getPlatformName(platform: string): string {
  return PLATFORM_INFO[platform]?.name || platform;
}

// Get platform icon
export function getPlatformIcon(platform: string): string {
  return PLATFORM_INFO[platform]?.icon || '🔗';
}
