/**
 * CritiqueRoom Feature Route
 * Main entry point for the CritiqueRoom feature with dynamic backgrounds and nested routing
 */

import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CritiqueRoomHome } from './components/CritiqueRoomHome';
import { WriterWorkspace } from './components/WriterWorkspace';
import { CritiqueSession } from './components/CritiqueSession';
import { SessionList } from './components/SessionList';
import CritiqueRoomAdminPage from './pages/CritiqueRoomAdminPage';
import { getRandomBackground } from '../../utils/backgroundUtils';
import { CritiqueRoomAuthProvider } from './contexts/CritiqueRoomAuthContext';
import { Lock, User, Eye, EyeOff, X } from 'lucide-react';

interface AuthorProfile {
  name: string;
  bio: string;
  tagline: string;
  profile_image?: string;
  background_image?: string;
  background_image_light?: string;
  background_image_dark?: string;
  site_domain?: string;
}

interface HomepageSettings {
  brand_color: string;
  brand_color_dark: string;
  hero_title?: string;
  hero_tagline?: string;
}

export default function CritiqueRoomRoute() {
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'dark';
  });

  // Admin view state
  const [view, setView] = useState<'public' | 'admin'>(() => {
    const adminUser = sessionStorage.getItem('critiqueroom_admin_user');
    return adminUser ? 'admin' : 'public';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Fetch author profile for background image
    fetch('/api/author/get.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.profile);
        }
      })
      .catch(err => {
        console.error('Failed to fetch author profile:', err);
      });

    // Fetch homepage settings for brand color
    fetch('/api/homepage/settings.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings(data.settings);
        }
      })
      .catch(err => {
        console.error('Failed to fetch homepage settings:', err);
      });

    // Listen for theme changes from localStorage
    const checkTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      setTheme((savedTheme as 'light' | 'dark') || 'dark');
    };

    // Check theme periodically to sync with other components
    const interval = setInterval(checkTheme, 100);

    return () => clearInterval(interval);
  }, []);

  // Use theme-specific custom background if set, with smart fallback logic
  const backgroundImage = profile
    ? theme === 'light'
      ? getRandomBackground(
          profile.background_image_light || profile.background_image,
          '/images/lofi_light_bg.webp'
        )
      : getRandomBackground(
          profile.background_image_dark || profile.background_image,
          '/images/lofi_bg.webp'
        )
    : theme === 'light'
      ? '/images/lofi_light_bg.webp'
      : '/images/lofi_bg.webp';

  const overlayClass = theme === 'light' ? 'bg-white/60' : 'bg-black/40';

  // Brand color based on theme - use indigo as default for CritiqueRoom
  const brandColor = theme === 'light'
    ? (settings?.brand_color || '#6366f1')
    : (settings?.brand_color_dark || '#818cf8');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await response.json();

      if (data.user || data.success) {
        sessionStorage.setItem('critiqueroom_admin_user', JSON.stringify(data.user || { username: loginUsername }));
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
    sessionStorage.removeItem('critiqueroom_admin_user');
    setView('public');
  };

  const LoginModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-center relative">
          <button
            onClick={() => setShowLoginModal(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">CritiqueRoom Admin</h2>
          <p className="text-white/80 text-sm mt-1">Manage sessions and users</p>
        </div>

        <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
          {loginError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {loginError}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Username
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {isLoggingIn ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Use your main site admin credentials
          </p>
        </div>
      </div>
    </div>
  );

  // If admin view, show admin page
  if (view === 'admin') {
    return <CritiqueRoomAdminPage onExit={handleAdminLogout} />;
  }

  return (
    <>
      {showLoginModal && <LoginModal />}
      <CritiqueRoomAuthProvider>
        <div className="relative font-sans min-h-screen transition-colors duration-200">
          {/* Dynamic CSS for brand color */}
          <style>{`
            :root { --brand-color: ${brandColor}; --cr-brand: ${brandColor}; }
            .brand-bg { background-color: ${brandColor}; }
            .brand-text { color: ${brandColor}; }
            .brand-border { border-color: ${brandColor}; }
            .cr-brand-bg { background-color: ${brandColor}; }
            .cr-brand-text { color: ${brandColor}; }
            .cr-brand-border { border-color: ${brandColor}; }
          `}</style>

          {/* Fixed background layer */}
          <div
            className="fixed inset-0 -z-10 bg-no-repeat bg-cover bg-center"
            style={{
              backgroundImage: `url('${backgroundImage}')`,
              backgroundColor: theme === 'light' ? '#f7f7f7' : '#0a0a0a',
            }}
          />
          {/* Overlay */}
          <div className={`fixed inset-0 ${overlayClass} -z-10`} />

          {/* Content */}
          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<CritiqueRoomHome onAdminLogin={() => setShowLoginModal(true)} />} />
              <Route path="/workspace" element={<WriterWorkspace />} />
              <Route path="/session/:sessionId" element={<CritiqueSession />} />
              <Route path="/my-sessions" element={<SessionList />} />
            </Routes>
          </div>
        </div>
      </CritiqueRoomAuthProvider>
    </>
  );
}
