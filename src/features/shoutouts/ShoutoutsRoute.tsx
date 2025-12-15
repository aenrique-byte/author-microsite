import { useState } from 'react';
import PublicPage from './pages/PublicPage';
import AdminPage from './pages/AdminPage';
import { Lock, User, Eye, EyeOff, X } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

// Standalone shoutouts app - works independently like the original

export default function ShoutoutsRoute() {
  const [view, setView] = useState<'public' | 'admin'>(() => {
    // Check if user is logged in on mount
    const adminUser = sessionStorage.getItem('shoutouts_admin_user');
    return adminUser ? 'admin' : 'public';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAdminLogin = () => {
    setShowLoginModal(true);
    setLoginError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      // Try the main site auth endpoint
      const response = await fetch('/api/auth/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      
      const data = await response.json();
      
      if (data.user || data.success) {
        // Store user info in session storage
        sessionStorage.setItem('shoutouts_admin_user', JSON.stringify(data.user || { username: loginUsername }));
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
    sessionStorage.removeItem('shoutouts_admin_user');
    setView('public');
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginError('');
    setLoginUsername('');
    setLoginPassword('');
  };

  const LoginModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
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
            <label htmlFor="username" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Username
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                id="username"
                name="username"
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-300 text-neutral-900 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-neutral-900/30 border-t-neutral-900 rounded-full animate-spin"></div>
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
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Use your main site admin credentials
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
