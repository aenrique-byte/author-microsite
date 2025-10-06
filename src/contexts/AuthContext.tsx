import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE } from '../lib/apiBase';

export interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/auth/me.php`, {
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else if (response.status === 401) {
        // Not authenticated - this is expected for public users
        setUser(null);
      } else {
        throw new Error(`Auth check failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError(err instanceof Error ? err.message : 'Auth check failed');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    await checkAuthStatus();
  };

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/auth/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout.php`, {
        method: 'POST',
        credentials: 'same-origin'
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    refresh,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to check if user can edit chapters
export function canEditChapter(user: User | null): boolean {
  if (!user) return false;
  // Allow admin, author, or mod roles to edit
  return ['admin', 'author', 'mod'].includes(user.role.toLowerCase());
}
