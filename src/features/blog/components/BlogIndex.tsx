import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../storytime/contexts/ThemeContext'
import PageNavbar from '../../../components/PageNavbar'
import SocialIcons from '../../../components/SocialIcons'
import { BlogCard } from './BlogCard'
import { BlogSidebar } from './BlogSidebar'
import { BlogSearch } from './BlogSearch'
import { listBlogPosts, listBlogCategories, listBlogTags } from '../../../utils/api-blog'
import type { BlogPostSummary, BlogCategory, BlogTag } from '../../../types/blog'

interface AuthorProfile {
  name: string
  bio: string
  tagline: string
  profile_image?: string
}

export function BlogIndex() {
  const { theme } = useTheme()
  const { category, tag, universe } = useParams<{ category?: string; tag?: string; universe?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [posts, setPosts] = useState<BlogPostSummary[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [profile, setProfile] = useState<AuthorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 9

  // Search
  const searchQuery = searchParams.get('q') || ''

  // Theme-aware styles
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-neutral-200'
  const textMuted = theme === 'light' ? 'text-gray-500' : 'text-neutral-400'
  const cardBg = theme === 'light' 
    ? 'bg-white/60 border-gray-200 backdrop-blur-xl' 
    : 'bg-neutral-900/60 border-white/10 backdrop-blur-xl'

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch posts
        const postsResult = await listBlogPosts({
          page,
          limit,
          status: 'published',
          category: category,
          tag: tag,
          universe: universe,
          q: searchQuery || undefined,
          sort: 'published_at',
          order: 'DESC',
        })

        if (postsResult.success) {
          setPosts(postsResult.posts)
          setTotalPages(postsResult.pages)
          setTotal(postsResult.total)
        } else {
          setError(postsResult.error || 'Failed to load posts')
        }

        // Fetch categories
        const categoriesResult = await listBlogCategories()
        if (categoriesResult.success) {
          setCategories(categoriesResult.categories)
        }

        // Fetch tags
        const tagsResult = await listBlogTags()
        if (tagsResult.success) {
          setTags(tagsResult.tags)
        }

        // Fetch author profile - don't fail entire page if this fails
        try {
          const profileRes = await fetch('/api/author/get.php')
          const profileData = await profileRes.json()
          if (profileData.success) {
            setProfile(profileData.profile)
          }
        } catch (profileErr) {
          console.log('Author profile not available, continuing without it')
        }
      } catch (err) {
        console.error('Error loading blog data:', err)
        // Don't set error here - let the individual success checks handle it
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, category, tag, universe, searchQuery])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [category, tag, universe, searchQuery])

  // Page title based on filter
  const pageTitle = useMemo(() => {
    if (category) return `Category: ${category.replace(/-/g, ' ')}`
    if (tag) return `Tag: ${tag.replace(/-/g, ' ')}`
    if (universe) return `Universe: ${universe.replace(/-/g, ' ')}`
    if (searchQuery) return `Search: "${searchQuery}"`
    return 'Blog'
  }, [category, tag, universe, searchQuery])

  const handleSearch = (query: string) => {
    if (query) {
      setSearchParams({ q: query })
    } else {
      setSearchParams({})
    }
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasActiveFilters = category || tag || universe || searchQuery

  return (
    <div className={`min-h-screen ${textPrimary}`}>
      <PageNavbar breadcrumbs={[
        { label: 'Blog' },
        ...(category ? [{ label: `Category: ${category.replace(/-/g, ' ')}` }] : []),
        ...(tag ? [{ label: `Tag: ${tag.replace(/-/g, ' ')}` }] : []),
        ...(universe ? [{ label: `Universe: ${universe.replace(/-/g, ' ')}` }] : []),
      ]} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl font-extrabold ${textPrimary} mb-4`}>
            {pageTitle}
          </h1>
          <p className={`text-lg ${textSecondary} max-w-2xl mx-auto mb-6`}>
            {hasActiveFilters 
              ? `Showing ${total} post${total !== 1 ? 's' : ''}`
              : 'Thoughts, updates, and behind-the-scenes content from the author'
            }
          </p>
          
          {/* Search */}
          <div className="max-w-xl mx-auto">
            <BlogSearch 
              initialQuery={searchQuery}
              onSearch={handleSearch}
              theme={theme}
            />
          </div>

          {/* Filter Pills */}
          {hasActiveFilters && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {category && (
                <Link 
                  to="/blog" 
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${cardBg} border`}
                >
                  <span>Category: {category}</span>
                  <span className="text-lg leading-none">&times;</span>
                </Link>
              )}
              {tag && (
                <Link 
                  to="/blog" 
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${cardBg} border`}
                >
                  <span>Tag: {tag}</span>
                  <span className="text-lg leading-none">&times;</span>
                </Link>
              )}
              {universe && (
                <Link 
                  to="/blog" 
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${cardBg} border`}
                >
                  <span>Universe: {universe}</span>
                  <span className="text-lg leading-none">&times;</span>
                </Link>
              )}
              {searchQuery && (
                <button 
                  onClick={clearFilters}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${cardBg} border cursor-pointer`}
                >
                  <span>Search: {searchQuery}</span>
                  <span className="text-lg leading-none">&times;</span>
                </button>
              )}
            </div>
          )}

          {/* Category Filter */}
          {categories.length > 0 && !hasActiveFilters && (
            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              <Link
                to="/blog"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !category ? 'brand-bg text-white' : `${cardBg} border ${textSecondary} hover:brand-text`
                }`}
              >
                All Posts
              </Link>
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/blog/category/${cat.slug}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    category === cat.slug 
                      ? 'brand-bg text-white' 
                      : `${cardBg} border ${textSecondary} hover:brand-text`
                  }`}
                >
                  {cat.name}
                  <span className={`ml-1 ${textMuted}`}>({cat.post_count})</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Posts Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`${cardBg} border rounded-2xl h-80 animate-pulse`}
                  />
                ))}
              </div>
            ) : error ? (
              <div className={`${cardBg} border rounded-2xl p-8 text-center`}>
                <p className="text-red-500 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="brand-bg text-white px-4 py-2 rounded-lg hover:opacity-90"
                >
                  Try Again
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className={`${cardBg} border rounded-2xl p-12 text-center`}>
                <div className="text-6xl mb-4">📝</div>
                <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>No posts found</h3>
                <p className={textSecondary}>
                  {hasActiveFilters 
                    ? 'Try adjusting your filters or search query'
                    : 'Check back soon for new content!'
                  }
                </p>
                {hasActiveFilters && (
                  <Link 
                    to="/blog" 
                    className="inline-block mt-4 brand-bg text-white px-4 py-2 rounded-lg hover:opacity-90"
                  >
                    View All Posts
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} theme={theme} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className={`px-4 py-2 rounded-lg ${cardBg} border ${
                        page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:brand-text'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-10 h-10 rounded-lg ${
                              page === pageNum
                                ? 'brand-bg text-white'
                                : `${cardBg} border hover:brand-text`
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className={`px-4 py-2 rounded-lg ${cardBg} border ${
                        page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:brand-text'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <BlogSidebar 
              categories={categories}
              tags={tags}
              profile={profile}
              theme={theme}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} mt-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SocialIcons variant="footer" showCopyright={false} />
          <div className={`text-center text-xs pt-4 ${textMuted}`}>
            © {new Date().getFullYear()} {profile?.name || 'Author'}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
