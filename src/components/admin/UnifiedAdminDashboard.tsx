import { Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ThemeToggle from '../ThemeToggle'

// Admin Components
import StoryManager from './StoryManager'
import AuthorProfileManager from './AuthorProfileManager'
import CollectionGalleryManager from './CollectionGalleryManager'
import SocialMediaManager from './SocialMediaManager'
import SocialCredentialsManager from './SocialCredentialsManager'
import EmailSettingsManager from './EmailSettingsManager'
import ModerationManager from './ModerationManager'
import PasswordManager from './PasswordManager'
import UploadManager from './UploadManager'
import AnalyticsManager from './AnalyticsManager'
import LitrpgManager from './LitrpgManager'
import HomepageManager from './HomepageManager'
import BlogManager from './BlogManager'
import Breadcrumb from './Breadcrumb'

interface User {
  id: number
  username: string
  role: string
}

export default function UnifiedAdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me.php', {
        credentials: 'same-origin'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          setIsLoggedIn(true)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      
      if (data.success && data.user) {
        setUser(data.user)
        setIsLoggedIn(true)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout.php', {
        method: 'POST',
        credentials: 'same-origin'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsLoggedIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-gray-900 dark:text-white">Loading...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminHeader user={user} onLogout={handleLogout} />
      <Breadcrumb />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/author" element={<AuthorProfileManager />} />
          <Route path="/galleries/*" element={<CollectionGalleryManager />} />
          <Route path="/stories/*" element={<StoryManager />} />
          <Route path="/uploads" element={<UploadManager />} />
          <Route path="/socials" element={<SocialMediaManager />} />
          <Route path="/social-api" element={<SocialCredentialsManager />} />
          <Route path="/email" element={<EmailSettingsManager />} />
          <Route path="/moderation" element={<ModerationManager />} />
          <Route path="/password" element={<PasswordManager />} />
          <Route path="/analytics" element={<AnalyticsManager />} />
          <Route path="/litrpg" element={<LitrpgManager />} />
          <Route path="/homepage" element={<HomepageManager />} />
          <Route path="/blog" element={<BlogManager />} />
        </Routes>
      </div>
    </div>
  )
}

function LoginForm({ onLogin }: { onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }> }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await onLogin(username, password)
    
    if (!result.success) {
      setError(result.error || 'Login failed')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Author CMS Admin</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter username"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AdminHeader({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Author CMS Admin</h1>
            {user && (
              <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user.username} ({user.role})
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <a 
              href="/" 
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Site
            </a>
            <button
              onClick={onLogout}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

function AdminHome() {
  const [quickStats, setQuickStats] = useState<{
    galleries: number;
    stories: number;
    comments: number;
    total_likes: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    try {
      const response = await fetch('/api/admin/quick-stats.php', {
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quick stats');
      }

      const data = await response.json();
      if (data.success) {
        setQuickStats(data.data);
      } else {
        setStatsError(data.error || 'Failed to load stats');
      }
    } catch (error) {
      console.error('Quick stats error:', error);
      setStatsError('Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Admin Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminCard 
            title="Homepage Manager" 
            href="/admin/homepage" 
            description="Configure hero section, activity feed, and tools"
            icon="🏠"
          />

          <AdminCard 
            title="Author Profile" 
            href="/admin/author" 
            description="Manage author bio, tagline, and profile images"
            icon="👤"
          />
          
          <AdminCard 
            title="Image Galleries" 
            href="/admin/galleries" 
            description="Create and manage image galleries"
            icon="🖼️"
          />

          
          <AdminCard
            title="Stories & Chapters"
            href="/admin/stories"
            description="Write and publish stories and chapters"
            icon="📚"
          />

          <AdminCard
            title="Blog Manager"
            href="/admin/blog"
            description="Create and manage blog posts with TipTap editor"
            icon="✍️"
          />

          <AdminCard
            title="Upload Manager"
            href="/admin/uploads"
            description="Manage uploaded images and files"
            icon="📁"
          />
          
          <AdminCard 
            title="Social Media" 
            href="/admin/socials" 
            description="Update social media links across all sites"
            icon="🔗"
          />

          <AdminCard 
            title="Social API Credentials" 
            href="/admin/social-api" 
            description="Connect Instagram, Twitter, Facebook, Discord for blog crossposting"
            icon="🔑"
          />
          
          <AdminCard 
            title="Email Settings"
            href="/admin/email" 
            description="Configure SMTP settings for emails (shoutouts, blog, etc.)"
            icon="📧"
          />
          
          <AdminCard 
            title="Moderation" 
            href="/admin/moderation" 
            description="Moderate comments and manage user bans"
            icon="🛡️"
          />
          
          <AdminCard 
            title="Change Password" 
            href="/admin/password" 
            description="Update your admin account password securely"
            icon="🔐"
          />
          
          <AdminCard 
            title="Analytics" 
            href="/admin/analytics" 
            description="View site statistics and engagement metrics"
            icon="📊"
          />
          
          <AdminCard 
            title="LitRPG Manager" 
            href="/admin/litrpg" 
            description="Manage game data: characters, classes, abilities, monsters, items"
            icon="⚔️"
          />
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-semibold">Galleries</div>
              <div className="text-blue-800 dark:text-blue-300">
                {statsLoading ? 'Loading...' : statsError ? 'Error' : quickStats?.galleries || 0}
              </div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-semibold">Stories</div>
              <div className="text-blue-800 dark:text-blue-300">
                {statsLoading ? 'Loading...' : statsError ? 'Error' : quickStats?.stories || 0}
              </div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-semibold">Comments</div>
              <div className="text-blue-800 dark:text-blue-300">
                {statsLoading ? 'Loading...' : statsError ? 'Error' : quickStats?.comments || 0}
              </div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-semibold">Total Likes</div>
              <div className="text-blue-800 dark:text-blue-300">
                {statsLoading ? 'Loading...' : statsError ? 'Error' : quickStats?.total_likes || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminCard({ title, href, description, icon }: { 
  title: string
  href: string
  description: string
  icon: string
}) {
  return (
    <Link 
      to={href} 
      className="block p-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
    >
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-3">{icon}</span>
        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </Link>
  )
}
