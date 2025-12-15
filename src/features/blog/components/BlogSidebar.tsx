import { Link } from 'react-router-dom'
import { TagCloud } from './TagCloud'
import { getBlogRssFeedUrl } from '../../../utils/api-blog'
import type { BlogCategory, BlogTag } from '../../../types/blog'

interface AuthorProfile {
  name: string
  bio: string
  tagline: string
  profile_image?: string
}

interface BlogSidebarProps {
  categories: BlogCategory[]
  tags: BlogTag[]
  profile: AuthorProfile | null
  theme: 'light' | 'dark'
}

export function BlogSidebar({ categories, tags, profile, theme }: BlogSidebarProps) {
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-neutral-200'
  const textMuted = theme === 'light' ? 'text-gray-500' : 'text-neutral-400'
  const cardBg = theme === 'light' 
    ? 'bg-white/60 border-gray-200 backdrop-blur-xl' 
    : 'bg-neutral-900/60 border-white/10 backdrop-blur-xl'

  return (
    <aside className="space-y-6">
      {/* Author Card */}
      {profile && (
        <div className={`${cardBg} border rounded-2xl p-5`}>
          <div className="flex items-center gap-4 mb-4">
            {profile.profile_image ? (
              <img 
                src={profile.profile_image} 
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full brand-bg flex items-center justify-center text-xl font-bold text-white">
                {profile.name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className={`font-bold ${textPrimary}`}>{profile.name}</h3>
              <p className={`text-sm ${textMuted}`}>{profile.tagline}</p>
            </div>
          </div>
          {profile.bio && (
            <p className={`text-sm ${textSecondary} line-clamp-3`}>
              {profile.bio}
            </p>
          )}
          <Link 
            to="/"
            className={`mt-4 block text-center text-sm font-medium brand-text hover:underline`}
          >
            Learn more →
          </Link>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className={`${cardBg} border rounded-2xl p-5`}>
          <h3 className={`font-bold ${textPrimary} mb-4`}>Categories</h3>
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  to={`/blog/category/${cat.slug}`}
                  className={`flex items-center justify-between text-sm ${textSecondary} hover:brand-text transition-colors`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-xs ${textMuted} ${
                    theme === 'light' ? 'bg-gray-100' : 'bg-white/10'
                  } px-2 py-0.5 rounded-full`}>
                    {cat.post_count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tag Cloud */}
      {tags.length > 0 && (
        <div className={`${cardBg} border rounded-2xl p-5`}>
          <h3 className={`font-bold ${textPrimary} mb-4`}>Popular Tags</h3>
          <TagCloud tags={tags} theme={theme} limit={15} />
        </div>
      )}

      {/* Subscribe Section */}
      <div className={`${cardBg} border rounded-2xl p-5`}>
        <h3 className={`font-bold ${textPrimary} mb-2`}>Stay Updated</h3>
        <p className={`text-sm ${textSecondary} mb-4`}>
          Subscribe to the RSS feed to never miss a post.
        </p>
        <a
          href={getBlogRssFeedUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg brand-bg text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z"/>
          </svg>
          Subscribe via RSS
        </a>
      </div>

      {/* Quick Links */}
      <div className={`${cardBg} border rounded-2xl p-5`}>
        <h3 className={`font-bold ${textPrimary} mb-4`}>Quick Links</h3>
        <ul className="space-y-2">
          <li>
            <Link
              to="/storytime"
              className={`flex items-center gap-2 text-sm ${textSecondary} hover:brand-text transition-colors`}
            >
              <span className="text-lg">📚</span>
              <span>Read Stories</span>
            </Link>
          </li>
          <li>
            <Link
              to="/galleries"
              className={`flex items-center gap-2 text-sm ${textSecondary} hover:brand-text transition-colors`}
            >
              <span className="text-lg">🖼️</span>
              <span>Browse Galleries</span>
            </Link>
          </li>
          <li>
            <Link
              to="/litrpg"
              className={`flex items-center gap-2 text-sm ${textSecondary} hover:brand-text transition-colors`}
            >
              <span className="text-lg">🎮</span>
              <span>LitRPG Tools</span>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  )
}
