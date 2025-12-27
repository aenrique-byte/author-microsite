import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../features/storytime/contexts/ThemeContext'

interface BreadcrumbItem {
  label: string
  path?: string
}

interface PageNavbarProps {
  breadcrumbs?: BreadcrumbItem[]
  showBreadcrumbs?: boolean
}

interface NavbarData {
  profile: {
    name: string
    tagline?: string
  }
  settings: {
    brand_color: string
    brand_color_dark: string
    newsletter_url?: string
    newsletter_cta_text?: string
  }
}

export default function PageNavbar({ breadcrumbs, showBreadcrumbs = true }: PageNavbarProps) {
  const location = useLocation()
  const { theme } = useTheme()
  const [data, setData] = useState<NavbarData | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/homepage/get.php')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData({
            profile: result.profile,
            settings: result.settings
          })
        }
      })
      .catch(() => {
        // Use defaults if fetch fails
        setData({
          profile: { name: 'Author' },
          settings: { brand_color: '#10b981', brand_color_dark: '#10b981' }
        })
      })
  }, [])

  const navLinks = [
    { label: 'Stories', path: '/storytime' },
    { label: 'Blog', path: '/blog' },
    { label: 'Galleries', path: '/galleries' },
    { label: 'Tools', path: '/litrpg' },
    { label: 'Critique Room', path: '/critiqueroom' },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // Select brand color based on current theme
  const brandColorLight = data?.settings?.brand_color || '#10b981'
  const brandColorDark = data?.settings?.brand_color_dark || brandColorLight
  const brandColor = theme === 'dark' ? brandColorDark : brandColorLight

  return (
    <>
      {/* Dynamic CSS for brand color */}
      <style>{`
        .nav-brand-bg { background-color: ${brandColor}; }
        .nav-brand-text { color: ${brandColor}; }
      `}</style>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-neutral-950/80 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-full nav-brand-bg flex items-center justify-center text-sm font-black text-white transition-transform group-hover:scale-105">
                {data?.profile?.name?.slice(0, 2).toUpperCase() || 'AU'}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold tracking-wide uppercase nav-brand-text">
                  {data?.profile?.name || 'Author'}
                </div>
                {data?.profile?.tagline && (
                  <div className="text-xs text-gray-600 dark:text-neutral-400">
                    {data.profile.tagline}
                  </div>
                )}
              </div>
            </Link>

            {/* Center: Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'nav-brand-text bg-gray-100 dark:bg-white/10'
                      : 'text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right: Theme Toggle + Newsletter CTA */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              {data?.settings?.newsletter_url && (
                <a
                  href={data.settings.newsletter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex rounded-full nav-brand-bg px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  {data.settings.newsletter_cta_text || 'Newsletter'}
                </a>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-white/10"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200 dark:border-white/10 mt-2 pt-4">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'nav-brand-text bg-gray-100 dark:bg-white/10'
                        : 'text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {data?.settings?.newsletter_url && (
                  <a
                    href={data.settings.newsletter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-center rounded-lg nav-brand-bg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    {data.settings.newsletter_cta_text || 'Newsletter'}
                  </a>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Breadcrumbs (below navbar) */}
      {showBreadcrumbs && breadcrumbs && breadcrumbs.length > 0 && (
        <div className="relative z-10 bg-gray-50/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-white/5">
          <div className="max-w-6xl mx-auto px-4">
            <nav className="flex items-center gap-2 py-3 text-sm" aria-label="Breadcrumb">
              <Link 
                to="/" 
                className="text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Home
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {crumb.path ? (
                    <Link
                      to={crumb.path}
                      className="text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 dark:text-white font-medium">
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
