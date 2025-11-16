import { useEffect, useState, createContext, useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import SocialIcons from './SocialIcons'
import { getRandomBackground } from '../utils/backgroundUtils'

// Theme Context for the main homepage
const ThemeContext = createContext<{
  theme: 'light' | 'dark'
  toggleTheme: () => void
} | null>(null)

const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme')
    return (savedTheme as 'light' | 'dark') || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    
    // Apply theme class to document element for consistency with other sections
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`fixed bottom-4 right-4 md:top-4 md:left-4 md:bottom-auto md:right-auto z-50 p-2 h-10 w-10 md:h-auto md:w-auto rounded-full md:rounded-lg transition-colors duration-200 shadow-lg ${
        theme === 'dark'
          ? 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
          : 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
      }`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  )
}

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

interface Socials {
  [key: string]: string
}

function AuthorHomepageContent() {
  const { theme } = useTheme()
  const [profile, setProfile] = useState<AuthorProfile | null>(null)
  const [socials, setSocials] = useState<Socials>({})
  const [hasStories, setHasStories] = useState(false)
  const [hasGalleries, setHasGalleries] = useState(false)
  const [contentLoading, setContentLoading] = useState(true)

  useEffect(() => {
    // Fetch author profile from API
    fetch('/api/author/get.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.profile)
        }
      })
      .catch(err => {
        console.error('Failed to fetch author profile:', err)
        // Fallback to static data
        setProfile({
          name: "Author Name",
          bio: "Author & Writer",
          tagline: "Stories that captivate and inspire"
        })
      })
    
    // Fetch social media links from API
    fetch('/api/socials/get.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSocials(data.socials)
        }
      })
      .catch(err => {
        console.error('Failed to fetch social links:', err)
        // Fallback to empty socials - will be configured by admin
        setSocials({})
      })

    // Check if there are any published stories
    fetch('/api/stories/list.php?status=published&limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stories && data.stories.length > 0) {
          setHasStories(true)
        }
      })
      .catch(err => {
        console.error('Failed to fetch stories:', err)
      })

    // Check if there are any galleries
    fetch('/api/galleries/list.php?limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.galleries && data.galleries.length > 0) {
          setHasGalleries(true)
        }
      })
      .catch(err => {
        console.error('Failed to fetch galleries:', err)
      })
      .finally(() => {
        setContentLoading(false)
      })
  }, [])

  if (!profile) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // Use theme-specific custom background if set, with smart fallback logic
  // getRandomBackground handles comma-separated filenames and randomly selects one
  const backgroundImage = theme === 'light'
    ? getRandomBackground(
        profile.background_image_light || profile.background_image,
        '/images/lofi_light_bg.webp'
      )
    : getRandomBackground(
        profile.background_image_dark || profile.background_image,
        '/images/lofi_bg.webp'
      )
  const overlayClass = theme === 'light' ? 'bg-white/60' : 'bg-black/40'
  const cardClass = theme === 'light' ? 'bg-white/70 text-gray-900' : 'bg-black/70 text-white'
  
  // Dynamic domain and image URLs
  const baseDomain = profile.site_domain || 'example.com'
  const baseUrl = `https://${baseDomain}`
  const profileImageUrl = profile.profile_image 
    ? (profile.profile_image.startsWith('http') ? profile.profile_image : `${baseUrl}${profile.profile_image}`)
    : `${baseUrl}/images/lofi_bg.webp` // fallback image for og:image

  return (
    <>
      <Helmet>
        <title>{profile.name} | {profile.bio}</title>
        <meta name="description" content={`${profile.name} - ${profile.bio}. ${profile.tagline}. Discover engaging stories and creative writing.`} />
        <link rel="canonical" href={`${baseUrl}/`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${profile.name} | ${profile.bio}`} />
        <meta property="og:description" content={`${profile.name} - ${profile.bio}. ${profile.tagline}. Discover engaging stories and creative writing.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${baseUrl}/`} />
        <meta property="og:image" content={profileImageUrl} />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${profile.name} | ${profile.bio}`} />
        <meta name="twitter:description" content={`${profile.name} - ${profile.bio}. ${profile.tagline}. Discover engaging stories and creative writing.`} />
        <meta name="twitter:image" content={profileImageUrl} />
        
        {/* Additional SEO */}
        <meta name="keywords" content="author, writer, stories, novels, creative writing" />
        <meta name="author" content={profile.name} />
      </Helmet>
      
      <ThemeToggle />
      <div className="relative h-screen w-full">
        {/* Fixed background layer */}
        <div
          className="fixed inset-0 -z-10 bg-no-repeat bg-top [background-size:auto_100%] md:[background-size:100%_auto]"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundColor: theme === 'light' ? '#f7f7f7' : '#0a0a0a',
          }}
        />
        {/* overlay */}
        <div className={`fixed inset-0 ${overlayClass} -z-10`} />

        {/* center card */}
        <div className="relative z-10 flex items-center justify-center h-full">
        <div className={`${cardClass} p-8 rounded-2xl shadow-xl max-w-md text-center`}>
          {profile.profile_image && (
            <div className="mb-4 flex justify-center">
              <img 
                src={profile.profile_image} 
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
          <p className="opacity-90 mb-2 text-sm sm:text-base md:text-lg leading-snug break-words">
            {profile.bio}
          </p>
          <p className="opacity-80 mb-6 text-sm sm:text-base md:text-lg leading-snug break-words line-clamp-2 sm:line-clamp-3 md:line-clamp-none">
            {profile.tagline}
          </p>
          {/* Navigation Buttons */}
          {!contentLoading && (hasStories || hasGalleries) && (
            <div className="flex justify-center gap-4 mb-6">
              {hasStories && (
                <a href="/storytime" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
                  Stories
                </a>
              )}
              {hasGalleries && (
                <a href="/galleries" className={`px-4 py-2 rounded-lg transition-colors ${
                  theme === 'light' 
                    ? 'bg-gray-600 text-white hover:bg-gray-500' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}>
                  Galleries
                </a>
              )}
            </div>
          )}
          
          {/* Social Icons */}
          <SocialIcons socials={socials} />
          
          {/* Admin Link (hidden for now) */}
          <div className="mt-4">
            <a href="/admin" className="text-xs opacity-50 hover:opacity-100 transition-opacity">
              Admin
            </a>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}

export default function AuthorHomepage() {
  return (
    <ThemeProvider>
      <AuthorHomepageContent />
    </ThemeProvider>
  )
}
