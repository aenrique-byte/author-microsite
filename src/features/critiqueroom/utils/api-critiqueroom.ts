/**
 * CritiqueRoom API Service Layer
 * Replaces localStorage-based storage.ts with API calls to PHP backend
 */

import type {
  Session,
  SessionWithMeta,
  CreateSessionRequest,
  CreateSessionResponse,
  Comment,
  GlobalFeedback,
  DiscordUser,
} from '../types';

const API_BASE = '/api/critiqueroom';

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }
  return response.json();
}

/**
 * CritiqueRoom API client
 */
export const critiqueRoomAPI = {
  // ============================================
  // Session Management
  // ============================================
  sessions: {
    /**
     * Create a new critique session
     */
    async create(data: CreateSessionRequest): Promise<CreateSessionResponse> {
      const response = await fetch(`${API_BASE}/sessions/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return handleResponse<CreateSessionResponse>(response);
    },

    /**
     * Get a session by ID, optionally with password
     */
    async get(id: string, password?: string): Promise<SessionWithMeta> {
      const url = new URL(`${API_BASE}/sessions/get.php`, window.location.origin);
      url.searchParams.set('id', id);
      if (password) {
        url.searchParams.set('password', password);
      }

      const response = await fetch(url.toString(), {
        credentials: 'include',
      });
      return handleResponse<SessionWithMeta>(response);
    },

    /**
     * Update a session (author only)
     */
    async update(session: Partial<Session> & { id: string }): Promise<void> {
      const response = await fetch(`${API_BASE}/sessions/update.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(session),
      });
      await handleResponse<{ success: boolean }>(response);
    },

    /**
     * Delete a session (author only)
     */
    async delete(id: string): Promise<void> {
      const response = await fetch(`${API_BASE}/sessions/delete.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      await handleResponse<{ success: boolean }>(response);
    },

    /**
     * List user's sessions (requires Discord auth)
     */
    async list(): Promise<Session[]> {
      const response = await fetch(`${API_BASE}/sessions/list.php`, {
        credentials: 'include',
      });
      return handleResponse<Session[]>(response);
    },

    /**
     * Extend session expiration by 7 days (max 3 extensions)
     */
    async extend(sessionId: string): Promise<{
      success: boolean;
      newExpiresAt: number;
      extensionCount: number;
      extensionsRemaining: number;
    }> {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      // Include local author token for anonymous sessions
      if (isLocalAuthor(sessionId)) {
        headers['X-Local-Author'] = sessionId;
      }
      
      const response = await fetch(`${API_BASE}/sessions/extend.php`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      });
      return handleResponse<{
        success: boolean;
        newExpiresAt: number;
        extensionCount: number;
        extensionsRemaining: number;
      }>(response);
    },

    /**
     * Export session feedback via email
     */
    async exportEmail(sessionId: string, email: string, htmlContent: string): Promise<{ success: boolean }> {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      // Include local author token for anonymous sessions
      if (isLocalAuthor(sessionId)) {
        headers['X-Local-Author'] = sessionId;
      }
      
      const response = await fetch(`${API_BASE}/sessions/export-email.php`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ sessionId, email, htmlContent }),
      });
      return handleResponse<{ success: boolean }>(response);
    },
  },

  // ============================================
  // Comment Management
  // ============================================
  comments: {
    /**
     * Create a new comment on a session
     */
    async create(comment: {
      sessionId: string;
      paragraphIndex: number;
      startOffset?: number;
      endOffset?: number;
      textSelection?: string;
      content: string;
      authorName: string;
    }): Promise<{ id: string; timestamp: number }> {
      const response = await fetch(`${API_BASE}/comments/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(comment),
      });
      return handleResponse<{ id: string; timestamp: number }>(response);
    },

    /**
     * Update comment status or rating (author only)
     */
    async updateStatus(
      commentId: string,
      updates: {
        status?: Comment['status'];
        rating?: Comment['rating'];
      },
      sessionId?: string
    ): Promise<void> {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      // Include local author token for anonymous sessions
      if (sessionId && isLocalAuthor(sessionId)) {
        headers['X-Local-Author'] = sessionId;
      }
      
      const response = await fetch(`${API_BASE}/comments/update.php`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ commentId, ...updates }),
      });
      await handleResponse<{ success: boolean }>(response);
    },

    /**
     * Reply to a comment
     */
    async reply(
      commentId: string,
      content: string,
      authorName: string
    ): Promise<{ id: string; timestamp: number }> {
      const response = await fetch(`${API_BASE}/comments/reply.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ commentId, content, authorName }),
      });
      return handleResponse<{ id: string; timestamp: number }>(response);
    },
  },

  // ============================================
  // Global Feedback
  // ============================================
  feedback: {
    /**
     * Create global feedback for a session
     */
    async create(feedback: {
      sessionId: string;
      category: GlobalFeedback['category'];
      text: string;
      authorName: string;
    }): Promise<{ id: number; timestamp: number }> {
      const response = await fetch(`${API_BASE}/feedback/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(feedback),
      });
      return handleResponse<{ id: number; timestamp: number }>(response);
    },
  },

  // ============================================
  // Discord Authentication
  // ============================================
  auth: {
    /**
     * Redirect to Discord OAuth login
     */
    loginWithDiscord(returnTo?: string): void {
      const url = new URL(`${API_BASE}/auth/discord.php`, window.location.origin);
      if (returnTo) {
        url.searchParams.set('return_to', returnTo);
      }
      window.location.href = url.toString();
    },

    /**
     * Get currently logged in Discord user
     */
    async getCurrentUser(): Promise<DiscordUser | null> {
      try {
        const response = await fetch(`${API_BASE}/auth/me.php`, {
          credentials: 'include',
        });

        if (response.status === 401) {
          return null;
        }

        const data = await handleResponse<{ user: DiscordUser }>(response);
        return data.user;
      } catch {
        return null;
      }
    },

    /**
     * Logout Discord user
     */
    async logout(): Promise<void> {
      const response = await fetch(`${API_BASE}/auth/logout.php`, {
        method: 'POST',
        credentials: 'include',
      });
      await handleResponse<{ success: boolean }>(response);
    },
  },
};

// ============================================
// Local Storage Helpers (for non-critical data)
// ============================================

const IDENTITY_KEY_PREFIX = 'critiqueroom_identity_';
const FONT_SIZE_KEY = 'critiqueroom_pref_fontsize';
const AUTHOR_SESSIONS_KEY = 'critiqueroom_author_sessions';

/**
 * Get flower identity for a session
 */
export function getSessionIdentity(sessionId: string): { name: string; color: string; isDiscord?: boolean } | null {
  const key = `${IDENTITY_KEY_PREFIX}${sessionId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save flower identity for a session
 */
export function setSessionIdentity(sessionId: string, identity: { name: string; color: string; isDiscord?: boolean }): void {
  const key = `${IDENTITY_KEY_PREFIX}${sessionId}`;
  localStorage.setItem(key, JSON.stringify(identity));
}

/**
 * Get preferred font size
 */
export function getPreferredFontSize(): number {
  const stored = localStorage.getItem(FONT_SIZE_KEY);
  return stored ? parseInt(stored, 10) : 20;
}

/**
 * Save preferred font size
 */
export function setPreferredFontSize(size: number): void {
  localStorage.setItem(FONT_SIZE_KEY, size.toString());
}

/**
 * Check if current user is the author of a session (legacy localStorage check)
 * This is a fallback for anonymous sessions before API auth
 */
export function isLocalAuthor(sessionId: string): boolean {
  const stored = localStorage.getItem(AUTHOR_SESSIONS_KEY);
  if (stored) {
    try {
      const sessions = JSON.parse(stored);
      return !!sessions[sessionId];
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Mark session as locally authored (for anonymous sessions)
 */
export function markAsLocalAuthor(sessionId: string): void {
  const stored = localStorage.getItem(AUTHOR_SESSIONS_KEY);
  let sessions: Record<string, boolean> = {};
  if (stored) {
    try {
      sessions = JSON.parse(stored);
    } catch {
      sessions = {};
    }
  }
  sessions[sessionId] = true;
  localStorage.setItem(AUTHOR_SESSIONS_KEY, JSON.stringify(sessions));
}

export default critiqueRoomAPI;
