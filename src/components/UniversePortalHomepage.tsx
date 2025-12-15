import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../features/storytime/contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'
import SocialIcons from './SocialIcons'
import NewsletterCTA from './NewsletterCTA'
import PatreonCTA from './PatreonCTA'
import { getRandomBackground } from '../utils/backgroundUtils'

// Types
interface HomepageData {
  profile: {
    name: string
    bio: string
    tagline: string
    profile_image?: string
    background_image_light?: string
    background_image_dark?: string
  }
  settings: {
    hero_title: string
    hero_tagline: string
    hero_description: string
    show_featured_story: boolean
    show_activity_feed: boolean
    show_tools_section: boolean
    newsletter_cta_text: string
    newsletter_url: string
    brand_color: string
    brand_color_dark: string
    featured_story_id?: number
  }
  featured_story?: Story | null
  stories: Story[]
  activity: ActivityItem[]
  tools: Tool[]
  socials: Record<string, string>
}

interface Story {
  id: number
  title: string
  tagline?: string
  description?: string
  homepage_description?: string
  cover_image?: string
  genres?: string[]
  cta_text?: string
  slug?: string
  external_links?: { label: string; url: string }[]
  latest_chapter_number?: number
  latest_chapter_title?: string
}

interface ActivityItem {
  id: number
  type: string
  source: string
  label?: string
  title: string
  series_title?: string
  url?: string
  published_at: string
  time_ago?: string
}

interface Tool {
  id: number
  title: string
  description?: string
  icon: string
  link?: string
}

// Calculate time ago
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function UniversePortalHomepage() {
  const { theme } = useTheme()
  const [data, setData] = useState<HomepageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/homepage/get.php')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result)
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // Background image based on theme
  const backgroundImage = useMemo(() => {
    if (!data?.profile) return '/images/lofi_bg.webp'
    return theme === 'light'
      ? getRandomBackground(data.profile.background_image_light, '/images/lofi_light_bg.webp')
      : getRandomBackground(data.profile.background_image_dark, '/images/lofi_bg.webp')
  }, [data, theme])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white text-lg">Failed to load homepage data</div>
      </div>
    )
  }

  const { profile, settings, featured_story, stories, activity, tools, socials } = data
  const brandColor = theme === 'light'
    ? (settings.brand_color || '#10b981')
    : (settings.brand_color_dark || '#10b981')

  // Theme-aware classes
  // Light mode: white overlay to brighten | Dark mode: dark overlay to darken
  const overlayClass = theme === 'light' ? 'bg-white/60' : 'bg-black/40'
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  const textSecondary = theme === 'light' ? 'text-gray-900' : 'text-neutral-100'
  const textMuted = theme === 'light' ? 'text-gray-900' : 'text-neutral-200'
  // Increased card opacity for better readability
  const cardBg = theme === 'light' ? 'bg-white/40 border-gray-200 backdrop-blur-sm' : 'bg-neutral-900/30 border-white/10 backdrop-blur-sm'
  const inputBg = theme === 'light' ? 'bg-white/90' : 'bg-white/10'

  return (
    <div className={`relative min-h-screen ${textPrimary} font-sans transition-colors duration-200`}>
      {/* Dynamic CSS for brand color */}
      <style>{`
        :root { --brand-color: ${brandColor}; }
        .brand-bg { background-color: ${brandColor}; }
        .brand-text { color: ${brandColor}; }
        .brand-border { border-color: ${brandColor}; }
      `}</style>

      {/* Fixed background image layer - z-0 */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          backgroundColor: theme === 'light' ? '#f7f7f7' : '#0a0a0a',
        }}
      />
      {/* Dark overlay on top of background - z-[1] */}
      <div className={`fixed inset-0 z-[1] ${overlayClass} pointer-events-none`} />

      {/* Page shell - z-10 */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-24">
        {/* NAVBAR */}
        <header className="flex items-center justify-between py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full brand-bg flex items-center justify-center text-sm font-black text-white">
              {profile.name?.slice(0, 2).toUpperCase() || 'OW'}
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide uppercase brand-text">
                {profile.name || 'Author'}
              </div>
              <div className={`text-xs ${textSecondary}`}>
                {profile.tagline || settings.hero_tagline}
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/storytime" className={`${textSecondary} hover:${textPrimary} transition-colors`}>
              Stories
            </Link>
            <Link to="/blog" className={`${textSecondary} hover:${textPrimary} transition-colors`}>
              Blog
            </Link>
            <Link to="/galleries" className={`${textSecondary} hover:${textPrimary} transition-colors`}>
              Galleries
            </Link>
            <Link to="/litrpg" className={`${textSecondary} hover:${textPrimary} transition-colors`}>
              Tools
            </Link>
            <ThemeToggle />
            {settings.newsletter_url && (
              <a
                href={settings.newsletter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full brand-bg px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                {settings.newsletter_cta_text || 'Newsletter'}
              </a>
            )}
          </nav>
        </header>

        {/* HERO */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-center pt-8 md:pt-16">
          {/* Left: copy */}
          <div>
            <p className={`inline-flex items-center gap-2 rounded-full ${inputBg} px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] brand-text border ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
              {settings.hero_tagline}
            </p>
            <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              {settings.hero_title}
              <span className="block brand-text">{profile.name}</span>
            </h1>
            <p className={`mt-4 ${textSecondary} text-base md:text-lg max-w-xl`}>
              {settings.hero_description}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/storytime"
                className="rounded-lg brand-bg px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
              >
                Start Reading
              </Link>
              <Link
                to="/galleries"
                className={`rounded-lg border ${theme === 'light' ? 'border-gray-300 bg-white/50' : 'border-white/20 bg-white/5'} px-6 py-3 text-sm font-semibold ${textPrimary} hover:bg-white/10 transition-colors`}
              >
                Browse Galleries
              </Link>
            </div>

            {(socials?.royalroad || socials?.patreon) && (
              <div className={`mt-6 flex flex-wrap items-center gap-4 text-xs ${textMuted}`}>
                {socials.royalroad && (
                  <a href={socials.royalroad} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      RR
                    </span>
                    Live on RoyalRoad
                  </a>
                )}
                {socials.patreon && (
                  <a href={socials.patreon} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold">
                      ✦
                    </span>
                    Early chapters on Patreon
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right: featured story card */}
        {settings.show_featured_story && featured_story && (
          <FeaturedStoryCard story={featured_story} theme={theme} cardBg={cardBg} textSecondary={textSecondary} />
        )}
      </section>

        {/* Newsletter + Patreon CTA Section */}
        <section className={`mt-14 md:mt-16 ${cardBg} border rounded-3xl p-8 md:p-10 text-center`}>
          <h2 className={`text-3xl font-bold ${textPrimary} mb-3`}>
            📬 Stay Updated
          </h2>
          <p className={`text-lg ${textSecondary} mb-6 max-w-2xl mx-auto`}>
            Get notified when I publish new chapters, blog posts, and galleries. Or support my work on Patreon for early access and exclusive content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NewsletterCTA
              variant="button"
              source="homepage"
              buttonText="Join Mailing List"
            />
            <PatreonCTA variant="button" />
          </div>
        </section>

        {/* STORY GRID */}
        {stories.length > 0 && (
          <section className="mt-16 md:mt-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl md:text-3xl font-bold ${textPrimary}`}>
                Explore the universes
              </h2>
              <Link to="/storytime" className={`text-xs font-semibold uppercase tracking-[0.2em] ${textMuted} hover:${textPrimary}`}>
                View all series
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {stories.slice(0, 4).map((story) => (
                <StoryCard key={story.id} story={story} theme={theme} cardBg={cardBg} textSecondary={textSecondary} />
              ))}
            </div>
          </section>
        )}

        {/* ACTIVITY FEED + TOOLS */}
        {(settings.show_activity_feed || settings.show_tools_section) && (
          <section className="mt-16 md:mt-20 grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* Activity feed */}
            {settings.show_activity_feed && activity.length > 0 && (
              <ActivityFeed activity={activity} theme={theme} cardBg={cardBg} textSecondary={textSecondary} textMuted={textMuted} />
            )}

            {/* Tools */}
            {settings.show_tools_section && tools.length > 0 && (
              <ToolsSidebar tools={tools} theme={theme} cardBg={cardBg} textSecondary={textSecondary} />
            )}
          </section>
        )}

        {/* FOOTER - Using shared SocialIcons component */}
        <footer className={`mt-16 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} pt-6`}>
          <SocialIcons variant="footer" showCopyright={false} />
          <div className={`text-center text-xs pb-4 ${textMuted}`}>
            © {new Date().getFullYear()} {profile.name}. All rights reserved.
          </div>
          {/* Admin login link */}
          <div className={`text-center text-xs pb-6 ${textMuted}`}>
            <span className="opacity-60">Owner of this site?</span>{' '}
            <Link 
              to="/admin" 
              className={`opacity-60 hover:opacity-100 transition-opacity underline-offset-2 hover:underline`}
            >
              Admin Login
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}

// Sub-components
function FeaturedStoryCard({ story, theme, cardBg, textSecondary }: { story: Story; theme: string; cardBg: string; textSecondary: string }) {
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'

  return (
    <div className={`rounded-3xl ${cardBg} border shadow-2xl backdrop-blur-xl p-6 md:p-7 flex flex-col gap-4`}>
      <div className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme === 'light' ? 'text-gray-500' : 'text-neutral-400'}`}>
        Featured Universe
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        {story.cover_image ? (
          <img src={story.cover_image} alt={story.title} className="h-40 w-28 flex-shrink-0 rounded-xl object-cover shadow-lg" />
        ) : (
          <div className="h-40 w-28 flex-shrink-0 rounded-xl bg-gradient-to-b from-emerald-400 to-sky-700 shadow-lg" />
        )}
        <div className="flex-1">
          <h2 className={`text-xl font-bold ${textPrimary} mb-1`}>{story.title}</h2>
          {story.tagline && <p className="text-xs font-medium brand-text mb-2">{story.tagline}</p>}
          <p className={`text-sm ${textSecondary}`}>{story.homepage_description || story.description}</p>
          {story.genres && story.genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem]">
              {story.genres.map((tag: string, i: number) => (
                <span key={i} className={`rounded-full px-3 py-1 ${theme === 'light' ? 'bg-gray-200/80' : 'bg-white/10'}`}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={`flex flex-col gap-3 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} pt-4`}>
        {story.external_links && story.external_links.length > 0 && (
          <div className={`flex flex-col gap-2 text-xs ${textSecondary}`}>
            {story.external_links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between hover:opacity-80">
                <span>{link.label}</span>
                {link.label.toLowerCase().includes('royal') && story.latest_chapter_number && (
                  <span className="brand-text font-semibold">Ch. {story.latest_chapter_number}</span>
                )}
              </a>
            ))}
          </div>
        )}
        <Link
          to={`/storytime/story/${story.slug || story.id}`}
          className="rounded-lg brand-bg px-4 py-2 text-sm font-semibold text-white text-center hover:opacity-90 transition-opacity"
        >
          {story.cta_text || 'Start Reading'}
        </Link>
      </div>
    </div>
  )
}

function StoryCard({ story, theme, cardBg, textSecondary }: { story: Story; theme: string; cardBg: string; textSecondary: string }) {
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'

  return (
    <article className={`group rounded-3xl ${cardBg} border p-5 sm:p-6 md:p-7 backdrop-blur-xl shadow-xl flex flex-col`}>
      <div className="flex flex-col gap-4 sm:flex-row">
        {story.cover_image ? (
          <img src={story.cover_image} alt={story.title} className="h-32 w-24 flex-shrink-0 rounded-xl object-cover group-hover:scale-[1.02] transition-transform" />
        ) : (
          <div className="h-32 w-24 flex-shrink-0 rounded-xl bg-gradient-to-b from-slate-200/70 to-slate-800/80 group-hover:scale-[1.02] transition-transform" />
        )}
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${textPrimary}`}>{story.title}</h3>
          {story.tagline && <p className="mt-1 text-xs font-medium brand-text">{story.tagline}</p>}
          <p className={`mt-2 text-sm ${textSecondary} line-clamp-3`}>{story.homepage_description || story.description}</p>
          {story.genres && story.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 text-[0.6rem]">
              {story.genres.slice(0, 4).map((tag: string, i: number) => (
                <span key={i} className={`rounded-full px-2.5 py-0.5 ${theme === 'light' ? 'bg-gray-200/80' : 'bg-white/10'}`}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={`mt-4 flex items-center justify-end`}>
        <Link
          to={`/storytime/story/${story.slug || story.id}`}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'} ${textPrimary} group-hover:brand-bg group-hover:text-white transition-colors`}
        >
          {story.cta_text || 'Start Reading'}
        </Link>
      </div>
    </article>
  )
}

function ActivityFeed({ activity, theme, cardBg, textSecondary, textMuted }: { activity: ActivityItem[]; theme: string; cardBg: string; textSecondary: string; textMuted: string }) {
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  
  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary} mb-4`}>Latest updates</h2>
      <div className="space-y-3">
        {activity.slice(0, 5).map((item) => (
          <a
            key={item.id}
            href={item.url || '#'}
            target={item.url ? '_blank' : undefined}
            rel="noopener noreferrer"
            className={`flex items-start gap-4 rounded-2xl ${cardBg} border px-4 py-3 backdrop-blur-xl hover:opacity-90 transition-opacity`}
          >
            <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'} text-[0.65rem] font-semibold uppercase`}>
              {item.source.slice(0, 2)}
            </div>
            <div className="flex-1 text-sm">
              <div className="flex items-center gap-2 text-xs brand-text mb-0.5">
                <span className="font-semibold">{item.label || item.type}</span>
                {item.series_title && (
                  <>
                    <span className={textMuted}>•</span>
                    <span className={textSecondary}>{item.series_title}</span>
                  </>
                )}
              </div>
              <div className={`${textPrimary} font-medium`}>{item.title}</div>
              <div className={`mt-0.5 text-xs ${textMuted}`}>{item.time_ago || timeAgo(item.published_at)}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function ToolsSidebar({ tools, theme, cardBg, textSecondary }: { tools: Tool[]; theme: string; cardBg: string; textSecondary: string }) {
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  
  return (
    <div className={`rounded-3xl ${cardBg} border p-6 backdrop-blur-xl shadow-xl`}>
      <h2 className={`text-xl font-bold ${textPrimary} mb-2`}>Tools & Resources</h2>
      <p className={`text-sm ${textSecondary} mb-4`}>
        Explore tools built around the stories.
      </p>
      <div className="space-y-3">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.link || '#'}
            className={`rounded-2xl ${theme === 'light' ? 'bg-gray-100/80' : 'bg-white/5'} border ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} px-4 py-3 text-sm flex flex-col gap-1 hover:opacity-80 transition-opacity block`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{tool.icon}</span>
              <span className={`font-semibold ${textPrimary}`}>{tool.title}</span>
            </div>
            {tool.description && <div className={`text-xs ${textSecondary}`}>{tool.description}</div>}
          </Link>
        ))}
      </div>
      <Link
        to="/litrpg"
        className={`mt-5 w-full rounded-lg ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'} px-4 py-2.5 text-sm font-semibold ${textPrimary} hover:bg-emerald-500 hover:text-white transition-colors block text-center`}
      >
        Open tools hub
      </Link>
    </div>
  )
}
