import React, { useState, useEffect } from 'react';
import { PublicPage } from './pages/PublicPage';
import { AdminPage } from './pages/AdminPage';
import { Moon, Sun, Lock, User, Eye, EyeOff, X } from 'lucide-react';

// Simple router states
type View = 'public' | 'admin';

export default function App() {
  const [view, setView] = useState<View>(() => {
    // Check if user is logged in on mount
    const adminUser = sessionStorage.getItem('admin_user');
    return adminUser ? 'admin' : 'public';
  });
  const [isDark, setIsDark] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Check local storage or system preference on load
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to dark if not specified
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && true); 
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleAdminLogin = () => {
    setShowLoginModal(true);
    setLoginError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      const response = await fetch('/shoutouts/api/login.endpoint.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store user info in session storage
        sessionStorage.setItem('admin_user', JSON.stringify(data.user));
        setShowLoginModal(false);
        setLoginUsername('');
        setLoginPassword('');
        setView('admin');
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('admin_user');
    setView('public');
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginError('');
    setLoginUsername('');
    setLoginPassword('');
  };

  const ThemeToggle = () => (
    <button 
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 z-50 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-amber-400 p-3 rounded-full shadow-lg border border-slate-300 dark:border-slate-700 hover:scale-110 transition-transform"
      title="Toggle Theme"
    >
      {isDark ? <Sun size={24} /> : <Moon size={24} />}
    </button>
  );

  const LoginModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-center relative">
          <button 
            onClick={closeLoginModal}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Login</h2>
          <p className="text-white/80 text-sm mt-1">Enter your credentials to continue</p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4" autoComplete="on">
          {loginError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {loginError}
            </div>
          )}
          
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Username
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="username"
                name="username"
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="Enter username"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-300 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                Logging in...
              </>
            ) : (
              <>
                <Lock size={18} />
                Sign In
              </>
            )}
          </button>
        </form>
        
        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your browser can save these credentials for easy access
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ThemeToggle />
      {showLoginModal && <LoginModal />}
      {view === 'public' && <PublicPage onAdminLogin={handleAdminLogin} />}
      {view === 'admin' && <AdminPage onExit={handleAdminLogout} />}
    </>
  );
}
