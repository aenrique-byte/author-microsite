import { Link } from 'react-router-dom'
import { formatBlogDate } from '../../../utils/api-blog'
import type { BlogPostSummary } from '../../../types/blog'

interface BlogCardProps {
  post: BlogPostSummary
  theme: 'light' | 'dark'
}

export function BlogCard({ post, theme }: BlogCardProps) {
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-neutral-200'
  const textMuted = theme === 'light' ? 'text-gray-500' : 'text-neutral-400'
  const cardBg = theme === 'light' 
    ? 'bg-white/60 border-gray-200 backdrop-blur-xl' 
    : 'bg-neutral-900/60 border-white/10 backdrop-blur-xl'

  // Format the published date
  const formattedDate = post.published_at 
    ? formatBlogDate(post.published_at)
    : 'Draft'

  return (
    <Link 
      to={`/blog/${post.slug}`}
      className={`group rounded-2xl ${cardBg} border overflow-hidden flex flex-col hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl`}
    >
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden">
        {post.cover_image ? (
          <img 
            src={post.cover_image} 
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-sky-500/20 flex items-center justify-center">
            <span className="text-6xl opacity-50">📝</span>
          </div>
        )}
        
        {/* Categories - TOP LEFT */}
        {post.categories && post.categories.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {post.categories.slice(0, 2).map((category, i) => (
              <span 
                key={i}
                className="px-2 py-1 rounded-full text-xs font-semibold brand-bg text-white backdrop-blur-sm uppercase tracking-wide"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        {/* Universe Tag - TOP RIGHT (if no categories, or as secondary badge) */}
        {post.universe_tag && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
              {post.universe_tag}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h3 className={`text-lg font-bold ${textPrimary} mb-2 line-clamp-2 group-hover:brand-text transition-colors`}>
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className={`text-sm ${textSecondary} line-clamp-3 mb-4 flex-1`}>
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.slice(0, 3).map((tag, i) => (
              <span 
                key={i}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  theme === 'light' ? 'bg-gray-100' : 'bg-white/10'
                } ${textMuted}`}
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className={`text-xs ${textMuted}`}>
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center justify-between pt-4 border-t ${
          theme === 'light' ? 'border-gray-200' : 'border-white/10'
        }`}>
          <span className={`text-xs ${textMuted}`}>
            {formattedDate}
          </span>
          <div className={`flex items-center gap-3 text-xs ${textMuted}`}>
            {/* Views */}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.view_count}
            </span>
            
            {/* Likes */}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.like_count}
            </span>

            {/* Comments */}
            {post.comment_count > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {post.comment_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
