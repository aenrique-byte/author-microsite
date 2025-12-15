import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BlogIndex } from './components/BlogIndex'
import { BlogPost } from './components/BlogPost'
import { getRandomBackground } from '../../utils/backgroundUtils'

interface AuthorProfile {
  name: string
  bio: string
  tagline: string
  profile_image?: string
  background_image?: string
  background_image_light?: string
  background_image_dark?: string
  site_domain?: string
}

interface HomepageSettings {
  brand_color: string
  brand_color_dark: string
  hero_title?: string
  hero_tagline?: string
}

export default function BlogRoute() {
  const [profile, setProfile] = useState<AuthorProfile | null>(null)
  const [settings, setSettings] = useState<HomepageSettings | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme')
    return (savedTheme as 'light' | 'dark') || 'dark'
  })

  useEffect(() => {
    // Fetch author profile for background image
    fetch('/api/author/get.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.profile)
        }
      })
      .catch(err => {
        console.error('Failed to fetch author profile:', err)
      })

    // Fetch homepage settings for brand color
    fetch('/api/homepage/settings.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings(data.settings)
        }
      })
      .catch(err => {
        console.error('Failed to fetch homepage settings:', err)
      })

    // Listen for theme changes from localStorage
    const checkTheme = () => {
      const savedTheme = localStorage.getItem('theme')
      setTheme((savedTheme as 'light' | 'dark') || 'dark')
    }

    // Check theme periodically to sync with other components
    const interval = setInterval(checkTheme, 100)
    
    return () => clearInterval(interval)
  }, [])

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
      : '/images/lofi_bg.webp'

  const overlayClass = theme === 'light' ? 'bg-white/60' : 'bg-black/40'
  
  // Brand color based on theme
  const brandColor = theme === 'light'
    ? (settings?.brand_color || '#10b981')
    : (settings?.brand_color_dark || '#10b981')

  return (
    <div className="relative font-sans min-h-screen transition-colors duration-200">
      {/* Dynamic CSS for brand color */}
      <style>{`
        :root { --brand-color: ${brandColor}; }
        .brand-bg { background-color: ${brandColor}; }
        .brand-text { color: ${brandColor}; }
        .brand-border { border-color: ${brandColor}; }
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
          <Route path="/" element={<BlogIndex />} />
          <Route path="/category/:category" element={<BlogIndex />} />
          <Route path="/tag/:tag" element={<BlogIndex />} />
          <Route path="/universe/:universe" element={<BlogIndex />} />
          <Route path="/:slug" element={<BlogPost />} />
        </Routes>
      </div>
    </div>
  )
}
