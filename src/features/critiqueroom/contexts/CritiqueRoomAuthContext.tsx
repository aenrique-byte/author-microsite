/**
 * CritiqueRoom Authentication Context
 * Handles Discord OAuth authentication for CritiqueRoom feature
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { critiqueRoomAPI } from '../utils/api-critiqueroom';
import type { DiscordUser } from '../types';

interface CritiqueRoomAuthContextType {
  user: DiscordUser | null;
  loading: boolean;
  error: string | null;
  loginWithDiscord: (returnTo?: string) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CritiqueRoomAuthContext = createContext<CritiqueRoomAuthContextType | undefined>(undefined);

interface CritiqueRoomAuthProviderProps {
  children: ReactNode;
}

export function CritiqueRoomAuthProvider({ children }: CritiqueRoomAuthProviderProps) {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    try {
      setError(null);
      const discordUser = await critiqueRoomAPI.auth.getCurrentUser();
      setUser(discordUser);
    } catch (err) {
      // 401 is expected for non-authenticated users
      if (err instanceof Error && !err.message.includes('401')) {
        console.error('CritiqueRoom auth check failed:', err);
        setError(err.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    await checkAuthStatus();
  };

  const loginWithDiscord = (returnTo?: string) => {
    critiqueRoomAPI.auth.loginWithDiscord(returnTo);
  };

  const logout = async () => {
    try {
      await critiqueRoomAPI.auth.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: CritiqueRoomAuthContextType = {
    user,
    loading,
    error,
    loginWithDiscord,
    logout,
    refresh,
  };

  return (
    <CritiqueRoomAuthContext.Provider value={value}>
      {children}
    </CritiqueRoomAuthContext.Provider>
  );
}

export function useCritiqueRoomAuth(): CritiqueRoomAuthContextType {
  const context = useContext(CritiqueRoomAuthContext);
  if (context === undefined) {
    throw new Error('useCritiqueRoomAuth must be used within a CritiqueRoomAuthProvider');
  }
  return context;
}
