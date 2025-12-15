import { Link } from 'react-router-dom'
import type { BlogTag } from '../../../types/blog'

interface TagCloudProps {
  tags: BlogTag[]
  theme: 'light' | 'dark'
  limit?: number
}

export function TagCloud({ tags, theme, limit = 20 }: TagCloudProps) {
  const textMuted = theme === 'light' ? 'text-gray-600' : 'text-neutral-300'
  
  // Sort tags by post count and limit
  const sortedTags = [...tags]
    .sort((a, b) => b.post_count - a.post_count)
    .slice(0, limit)

  // Calculate font size based on post count
  const maxCount = Math.max(...sortedTags.map(t => t.post_count), 1)
  const minCount = Math.min(...sortedTags.map(t => t.post_count), 1)

  const getTagSize = (count: number): string => {
    if (maxCount === minCount) return 'text-sm'
    
    const ratio = (count - minCount) / (maxCount - minCount)
    
    if (ratio > 0.75) return 'text-base font-semibold'
    if (ratio > 0.5) return 'text-sm font-medium'
    if (ratio > 0.25) return 'text-sm'
    return 'text-xs'
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sortedTags.map((tag) => (
        <Link
          key={tag.slug}
          to={`/blog/tag/${tag.slug}`}
          className={`inline-flex items-center px-3 py-1.5 rounded-full ${
            theme === 'light' 
              ? 'bg-gray-100 hover:bg-gray-200' 
              : 'bg-white/10 hover:bg-white/20'
          } ${textMuted} hover:brand-text transition-all ${getTagSize(tag.post_count)}`}
          title={`${tag.post_count} post${tag.post_count !== 1 ? 's' : ''}`}
        >
          #{tag.name}
        </Link>
      ))}
    </div>
  )
}
