import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../storytime/contexts/ThemeContext'
import PageNavbar from '../../../components/PageNavbar'
import SocialIcons from '../../../components/SocialIcons'
import NewsletterCTA from '../../../components/NewsletterCTA'
import PatreonCTA from '../../../components/PatreonCTA'
import { BlogCard } from './BlogCard'
import { List } from 'lucide-react'
import { 
  getBlogPostBySlug, 
  formatBlogDate, 
  listBlogPosts,
  trackBlogView,
  trackBlogLike,
  trackBlogShare,
  hasLikedPost,
  markPostLiked,
  listBlogComments,
  createBlogComment,
  type BlogComment
} from '../../../utils/api-blog'
import { processYouTubeEmbeds } from '../../../utils/youtube-handler'
import type { BlogPost as BlogPostType, BlogPostSummary } from '../../../types/blog'

interface AuthorProfile {
  name: string
  bio: string
  tagline: string
  profile_image?: string
}

// Comments Section Component
interface CommentsSectionProps {
  postId: number
  comments: BlogComment[]
  setComments: (comments: BlogComment[]) => void
  commentsLoading: boolean
  setCommentsLoading: (loading: boolean) => void
  commentName: string
  setCommentName: (name: string) => void
  commentEmail: string
  setCommentEmail: (email: string) => void
  commentText: string
  setCommentText: (text: string) => void
  commentSubmitting: boolean
  setCommentSubmitting: (submitting: boolean) => void
  commentSuccess: boolean
  setCommentSuccess: (success: boolean) => void
  commentError: string | null
  setCommentError: (error: string | null) => void
  replyingTo: number | null
  setReplyingTo: (id: number | null) => void
  pageLoadTime: React.MutableRefObject<number>
  theme: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  cardBg: string
}

// Table of Contents component
interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  items: TocItem[]
  activeId: string | null
  textPrimary: string
  textSecondary: string
  cardBg: string
}

function TableOfContents({ items, activeId, textPrimary, textSecondary, cardBg }: TableOfContentsProps) {
  if (items.length === 0) return null

  // Handle smooth scroll with offset for sticky header
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const headerOffset = 120 // Account for sticky navbar + breadcrumbs
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      
      // Update URL hash without jumping
      history.pushState(null, '', `#${id}`)
    }
  }

  return (
    <nav className={`${cardBg} border rounded-2xl p-5 sticky top-24`}>
      <h3 className={`text-sm font-semibold ${textPrimary} mb-4 flex items-center gap-2`}>
        <List className="w-4 h-4" />
        On This Page
      </h3>
      <ul className="space-y-1 border-l-2 border-gray-200 dark:border-white/10">
        {items.map((item) => (
          <li key={item.id} className="relative">
            {/* Active indicator line */}
            {activeId === item.id && (
              <span className="absolute left-[-2px] top-0 bottom-0 w-[2px] brand-bg" />
            )}
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={`block text-sm py-1.5 transition-colors ${
                item.level === 3 ? 'pl-6' : 'pl-4'
              } ${
                activeId === item.id
                  ? 'brand-text font-medium'
                  : `${textSecondary} hover:brand-text hover:bg-gray-50 dark:hover:bg-white/5`
              }`}
            >
              <span className="flex items-start gap-2">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  activeId === item.id 
                    ? 'brand-bg' 
                    : 'bg-gray-300 dark:bg-white/30'
                }`} />
                <span className="line-clamp-2">{item.text}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Extract headings from HTML content
function extractHeadings(html: string): TocItem[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h2, h3')
  const items: TocItem[] = []

  headings.forEach((heading, index) => {
    const text = heading.textContent?.trim() || ''
    if (text) {
      // Generate ID if not present
      let id = heading.id
      if (!id) {
        id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `heading-${index}`
      }
      items.push({
        id,
        text,
        level: heading.tagName === 'H2' ? 2 : 3
      })
    }
  })

  return items
}

// Add IDs to headings in HTML content
function addHeadingIds(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h2, h3')

  headings.forEach((heading, index) => {
    if (!heading.id) {
      const text = heading.textContent?.trim() || ''
      heading.id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `heading-${index}`
    }
  })

  return doc.body.innerHTML
}

function CommentsSection({
  postId,
  comments,
  setComments,
  commentsLoading,
  setCommentsLoading,
  commentName,
  setCommentName,
  commentEmail,
  setCommentEmail,
  commentText,
  setCommentText,
  commentSubmitting,
  setCommentSubmitting,
  commentSuccess,
  setCommentSuccess,
  commentError,
  setCommentError,
  replyingTo,
  setReplyingTo,
  pageLoadTime,
  theme,
  textPrimary,
  textSecondary,
  textMuted,
  cardBg
}: CommentsSectionProps) {
  
  // Fetch comments on mount
  useEffect(() => {
    const fetchComments = async () => {
      setCommentsLoading(true)
      try {
        const result = await listBlogComments(postId, { status: 'approved', include_replies: true })
        if (result.success && result.data) {
          setComments(result.data.comments)
        }
      } catch (err) {
        console.error('Failed to load comments:', err)
      } finally {
        setCommentsLoading(false)
      }
    }
    fetchComments()
  }, [postId, setComments, setCommentsLoading])
  
  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!commentText.trim()) {
      setCommentError('Comment is required')
      return
    }
    
    // Use "Anonymous" if no name provided
    const authorName = commentName.trim() || 'Anonymous'
    
    setCommentSubmitting(true)
    setCommentError(null)
    setCommentSuccess(false)
    
    try {
      const timeOnPage = Math.floor((Date.now() - pageLoadTime.current) / 1000)
      const result = await createBlogComment(postId, authorName, commentText.trim(), {
        author_email: commentEmail.trim() || undefined,
        parent_id: replyingTo || undefined,
        time_on_page: timeOnPage
      })
      
      if (result.success) {
        setCommentSuccess(true)
        setCommentText('')
        setReplyingTo(null)
        // Save name/email for future comments (only if they entered a name)
        if (commentName.trim()) localStorage.setItem('blog_comment_name', commentName.trim())
        if (commentEmail) localStorage.setItem('blog_comment_email', commentEmail.trim())
      } else {
        setCommentError(result.error || result.errors?.join(', ') || 'Failed to submit comment')
      }
    } catch (err) {
      setCommentError('Failed to submit comment')
    } finally {
      setCommentSubmitting(false)
    }
  }
  
  // Load saved name/email from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('blog_comment_name')
    const savedEmail = localStorage.getItem('blog_comment_email')
    if (savedName) setCommentName(savedName)
    if (savedEmail) setCommentEmail(savedEmail)
  }, [setCommentName, setCommentEmail])
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  // Render a single comment
  const renderComment = (comment: BlogComment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-4' : ''}`}>
      <div className={`${cardBg} border rounded-xl p-4`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" 
               style={{ backgroundColor: `hsl(${comment.author_name.charCodeAt(0) * 10 % 360}, 60%, 50%)` }}>
            {comment.author_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold ${textPrimary}`}>{comment.author_name}</span>
              <span className={`text-xs ${textMuted}`}>{formatRelativeTime(comment.created_at)}</span>
            </div>
            <p className={`text-sm ${textSecondary} whitespace-pre-wrap break-words`}>{comment.content}</p>
            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className={`mt-2 text-xs font-medium brand-text hover:underline`}
              >
                {replyingTo === comment.id ? 'Cancel Reply' : 'Reply'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3 mt-3">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
      
      {/* Reply form */}
      {replyingTo === comment.id && (
        <div className="ml-8 mt-3">
          <form onSubmit={handleSubmitComment} className={`${cardBg} border rounded-xl p-4`}>
            <p className={`text-sm ${textMuted} mb-3`}>Replying to {comment.author_name}</p>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write your reply..."
              required
              maxLength={5000}
              className={`w-full px-3 py-2 rounded-lg border ${
                theme === 'light' ? 'bg-white border-gray-300' : 'bg-neutral-800 border-white/20'
              } ${textPrimary} text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/50`}
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={commentSubmitting || !commentText.trim()}
                className="px-4 py-2 rounded-lg brand-bg text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {commentSubmitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
  
  return (
    <section className={`mt-16 pt-8 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
      <h2 className={`text-2xl font-bold ${textPrimary} mb-6`}>
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>
      
      {/* Comment Form */}
      {!replyingTo && (
        <form onSubmit={handleSubmitComment} className={`${cardBg} border rounded-2xl p-6 mb-8`}>
          <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Leave a Comment</h3>
          
          {commentSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm">
              Comment posted successfully!
            </div>
          )}
          
          {commentError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              {commentError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Name <span className={textMuted}>(optional)</span></label>
              <input
                type="text"
                value={commentName}
                onChange={e => setCommentName(e.target.value)}
                placeholder="Anonymous"
                maxLength={100}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-neutral-800 border-white/20'
                } ${textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-brand/50`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Email (optional)</label>
              <input
                type="email"
                value={commentEmail}
                onChange={e => setCommentEmail(e.target.value)}
                placeholder="your@email.com"
                maxLength={200}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-neutral-800 border-white/20'
                } ${textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-brand/50`}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Comment *</label>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              required
              maxLength={5000}
              className={`w-full px-3 py-2 rounded-lg border ${
                theme === 'light' ? 'bg-white border-gray-300' : 'bg-neutral-800 border-white/20'
              } ${textPrimary} text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/50`}
              rows={4}
            />
            <p className={`text-xs ${textMuted} mt-1`}>{commentText.length}/5000 characters</p>
          </div>
          
          {/* Honeypot field - hidden from users */}
          <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
          
          <div className="flex items-center justify-between">
            <p className={`text-xs ${textMuted}`}>Be respectful and keep it civil.</p>
            <button
              type="submit"
              disabled={commentSubmitting || !commentText.trim()}
              className="px-6 py-2.5 rounded-lg brand-bg text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {commentSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}
      
      {/* Comments List */}
      {commentsLoading ? (
        <div className={`text-center py-8 ${textMuted}`}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className={`text-center py-8 ${textMuted}`}>
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </section>
  )
}

export function BlogPost() {
  const { theme } = useTheme()
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  
  const [post, setPost] = useState<BlogPostType | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPostSummary[]>([])
  const [profile, setProfile] = useState<AuthorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const viewTrackedRef = useRef(false)
  
  // Comments state
  const [comments, setComments] = useState<BlogComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentName, setCommentName] = useState('')
  const [commentEmail, setCommentEmail] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentSuccess, setCommentSuccess] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const pageLoadTime = useRef(Date.now())
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)

  // Theme-aware styles
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-neutral-200'
  const textMuted = theme === 'light' ? 'text-gray-500' : 'text-neutral-400'
  const cardBg = theme === 'light' 
    ? 'bg-white/60 border-gray-200 backdrop-blur-xl' 
    : 'bg-neutral-900/60 border-white/10 backdrop-blur-xl'

  // Extract and process headings for TOC
  const { tocItems, processedHtml } = useMemo(() => {
    if (!post?.content_html) return { tocItems: [], processedHtml: '' }
    const items = extractHeadings(post.content_html)
    const html = addHeadingIds(post.content_html)
    return { tocItems: items, processedHtml: html }
  }, [post?.content_html])

  // Process YouTube embeds after content renders
  // This reconstructs iframes from data-youtube-id attributes
  // (iframes are stripped by PHP sanitizer for security)
  useEffect(() => {
    if (!processedHtml) return
    
    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      processYouTubeEmbeds()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [processedHtml])

  // Scroll observer for active heading
  useEffect(() => {
    if (tocItems.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0
      }
    )

    // Observe all headings
    tocItems.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [tocItems])

  // Fetch post data
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) {
        navigate('/blog')
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch the blog post
        const postResult = await getBlogPostBySlug(slug, true)
        
        if (!postResult.success || !postResult.post) {
          setError(postResult.error || 'Post not found')
          return
        }

        setPost(postResult.post)
        
        // Use related posts from API if available
        if (postResult.related_posts) {
          setRelatedPosts(postResult.related_posts)
        } else {
          // Fetch related posts by category or tag
          const relatedResult = await listBlogPosts({
            limit: 3,
            status: 'published',
            category: postResult.post.categories?.[0],
          })
          
          if (relatedResult.success) {
            // Filter out current post
            setRelatedPosts(
              relatedResult.posts.filter(p => p.id !== postResult.post!.id).slice(0, 3)
            )
          }
        }

        // Fetch author profile
        const profileRes = await fetch('/api/author/get.php')
        const profileData = await profileRes.json()
        if (profileData.success) {
          setProfile(profileData.profile)
        }

        // Update document title for SEO
        document.title = `${postResult.post.title} | Blog`
        
        // Update meta tags
        updateMetaTags(postResult.post)
        
        // Initialize like state
        setLikeCount(postResult.post.like_count || 0)
        setLiked(hasLikedPost(postResult.post.id))

      } catch (err) {
        setError('Failed to load blog post')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Cleanup meta tags on unmount
    return () => {
      document.title = 'Blog'
    }
  }, [slug, navigate])

  // Track view when post loads (only once per post)
  useEffect(() => {
    if (post && !viewTrackedRef.current) {
      viewTrackedRef.current = true
      trackBlogView(post.id, post.slug).catch(console.error)
    }
    
    // Reset tracking ref when slug changes
    return () => {
      viewTrackedRef.current = false
    }
  }, [post?.id, post?.slug])

  // Handle like button
  const handleLike = async () => {
    if (!post || isLiking || liked) return
    
    setIsLiking(true)
    try {
      const result = await trackBlogLike(post.id, post.slug)
      if (result.success && !result.already_tracked) {
        setLikeCount(prev => prev + 1)
        setLiked(true)
        markPostLiked(post.id)
      } else if (result.success && result.already_tracked) {
        // Already liked before
        setLiked(true)
        markPostLiked(post.id)
      }
    } catch (err) {
      console.error('Failed to like post:', err)
    } finally {
      setIsLiking(false)
    }
  }

  // Handle share with tracking
  const handleShare = async (platform: string, shareFn: () => void) => {
    if (post) {
      trackBlogShare(post.id, post.slug, platform).catch(console.error)
    }
    shareFn()
  }

  // Update meta tags for SEO
  const updateMetaTags = (post: BlogPostType) => {
    // Helper to set or create meta tag
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attr}="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attr, name)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Basic meta
    setMeta('description', post.meta_description || post.excerpt || '')
    if (post.primary_keywords) {
      setMeta('keywords', post.primary_keywords)
    }

    // OpenGraph
    setMeta('og:title', post.og_title || post.title, true)
    setMeta('og:description', post.og_description || post.meta_description || post.excerpt || '', true)
    setMeta('og:type', 'article', true)
    setMeta('og:url', window.location.href, true)
    if (post.cover_image) {
      setMeta('og:image', post.cover_image, true)
    }

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', post.og_title || post.title)
    setMeta('twitter:description', post.og_description || post.meta_description || post.excerpt || '')
    if (post.cover_image) {
      setMeta('twitter:image', post.cover_image)
    }

    // Article metadata
    if (post.published_at) {
      setMeta('article:published_time', post.published_at, true)
    }
    if (post.updated_at) {
      setMeta('article:modified_time', post.updated_at, true)
    }
    post.tags?.forEach((tag) => {
      setMeta('article:tag', tag, true)
    })

    // JSON-LD structured data
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.meta_description || post.excerpt,
      image: post.cover_image,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: {
        '@type': 'Person',
        name: post.author_name || profile?.name,
      },
      keywords: post.tags?.join(', '),
    }

    let script = document.querySelector('script[type="application/ld+json"]')
    if (!script) {
      script = document.createElement('script')
      script.setAttribute('type', 'application/ld+json')
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(jsonLd)
  }

  // Social share functions
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTitle = post?.title || ''

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const shareToLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    // Could add toast notification here
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-lg ${textSecondary}`}>Loading...</div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`${cardBg} border rounded-2xl p-8 text-center max-w-md`}>
          <div className="text-6xl mb-4">📄</div>
          <h2 className={`text-xl font-bold ${textPrimary} mb-2`}>Post Not Found</h2>
          <p className={textSecondary + ' mb-4'}>{error || 'This blog post does not exist or has been removed.'}</p>
          <Link 
            to="/blog"
            className="brand-bg text-white px-4 py-2 rounded-lg hover:opacity-90 inline-block"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${textPrimary}`}>
      <PageNavbar breadcrumbs={[
        { label: 'Blog', path: '/blog' },
        ...(post.categories?.[0] ? [{ label: post.categories[0], path: `/blog/category/${post.categories[0].toLowerCase().replace(/\s+/g, '-')}` }] : []),
        { label: post.title }
      ]} />

      {/* Main content area with TOC sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
        <div className={`flex gap-8 ${tocItems.length > 0 ? 'lg:flex-row' : ''} flex-col`}>
          {/* Main Article */}
          <article className={`flex-1 min-w-0 pb-16 ${
            theme === 'light' ? 'bg-white/80' : 'bg-black/40'
          } backdrop-blur-xl rounded-2xl py-8 px-6 lg:px-10`}>
            {/* Header */}
            <header className="mb-8">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((category, i) => (
                <Link 
                  key={i}
                  to={`/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm font-medium brand-text uppercase tracking-wider hover:underline"
                >
                  {category}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-extrabold ${textPrimary} mb-4 leading-tight`}>
            {post.title}
          </h1>

          {/* Meta */}
          <div className={`flex flex-wrap items-center gap-4 text-sm ${textMuted} mb-6`}>
            {/* Author */}
            <div className="flex items-center gap-2">
              {profile?.profile_image ? (
                <img 
                  src={profile.profile_image} 
                  alt={profile.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full brand-bg flex items-center justify-center text-xs font-bold text-white">
                  {profile?.name?.slice(0, 2).toUpperCase() || 'AU'}
                </div>
              )}
              <span className={textSecondary}>{post.author_name || profile?.name || 'Author'}</span>
            </div>

            <span>•</span>

            {/* Date */}
            <time dateTime={post.published_at || undefined}>
              {post.published_at ? formatBlogDate(post.published_at) : 'Draft'}
            </time>

            {/* Reading Time */}
            {post.reading_time && (
              <>
                <span>•</span>
                <span>{post.reading_time} min read</span>
              </>
            )}

            {/* Universe Tag */}
            {post.universe_tag && (
              <>
                <span>•</span>
                <Link 
                  to={`/blog/universe/${post.universe_tag.toLowerCase().replace(/\s+/g, '-')}`}
                  className="brand-text hover:underline"
                >
                  {post.universe_tag}
                </Link>
              </>
            )}
          </div>

          {/* Cover Image */}
          {post.cover_image && (
            <div className="relative rounded-2xl overflow-hidden mb-8 shadow-2xl">
              <img 
                src={post.cover_image}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover"
              />
              {/* Featured Image Metadata (from gallery) */}
              {post.featured_image?.prompt && (
                <details className={`absolute bottom-0 left-0 right-0 ${cardBg} p-4`}>
                  <summary className={`cursor-pointer text-sm font-medium ${textSecondary}`}>
                    AI Generation Info
                  </summary>
                  <div className={`mt-2 text-sm ${textMuted}`}>
                    <p><strong>Prompt:</strong> {post.featured_image.prompt}</p>
                    {post.featured_image.checkpoint && (
                      <p><strong>Model:</strong> {post.featured_image.checkpoint}</p>
                    )}
                  </div>
                </details>
              )}
            </div>
          )}
        </header>

        {/* Content */}
        <div 
          className={`prose prose-lg max-w-none ${
            theme === 'dark' ? 'prose-invert' : ''
          } prose-headings:font-bold prose-a:brand-text prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-blockquote:border-l-4 prose-blockquote:brand-border prose-code:brand-text`}
          dangerouslySetInnerHTML={{ __html: processedHtml || post.content_html }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className={`mt-8 pt-8 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
            <h3 className={`text-sm font-medium ${textMuted} mb-3`}>Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, i) => (
                <Link
                  key={i}
                  to={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
                  } ${textSecondary} hover:brand-text transition-colors`}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Like & Share Section */}
        <div className={`mt-8 pt-8 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={isLiking || liked}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
                liked
                  ? 'bg-red-500 text-white cursor-default'
                  : theme === 'light'
                    ? 'bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-700'
                    : 'bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-neutral-200'
              } ${isLiking ? 'opacity-50' : ''}`}
            >
              <svg 
                className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} 
                fill={liked ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={liked ? 0 : 2} 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
              <span>{liked ? 'Liked' : 'Like'}</span>
              {likeCount > 0 && (
                <span className={`text-sm ${liked ? 'text-white/80' : textMuted}`}>
                  ({likeCount})
                </span>
              )}
            </button>
            
            <span className={textMuted}>Share this post</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleShare('twitter', shareToTwitter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
              } ${textSecondary} transition-colors`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-sm font-medium">Twitter</span>
            </button>
            <button
              onClick={() => handleShare('facebook', shareToFacebook)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
              } ${textSecondary} transition-colors`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium">Facebook</span>
            </button>
            <button
              onClick={() => handleShare('linkedin', shareToLinkedIn)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
              } ${textSecondary} transition-colors`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="text-sm font-medium">LinkedIn</span>
            </button>
            <button
              onClick={() => handleShare('copy_link', copyLink)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
              } ${textSecondary} transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Copy Link</span>
            </button>
          </div>
        </div>

        {/* Author Bio */}
        {profile && (
          <div className={`mt-8 ${cardBg} border rounded-2xl p-6`}>
            <div className="flex items-start gap-4">
              {profile.profile_image ? (
                <img 
                  src={profile.profile_image} 
                  alt={profile.name}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full brand-bg flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                  {profile.name?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className={`text-lg font-bold ${textPrimary}`}>{profile.name}</h3>
                <p className={`text-sm ${textMuted} mb-2`}>{profile.tagline}</p>
                <p className={`text-sm ${textSecondary}`}>{profile.bio}</p>
                <Link 
                  to="/"
                  className="mt-3 inline-block text-sm font-medium brand-text hover:underline"
                >
                  View all posts →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Dual CTA: Newsletter + Patreon */}
        <div className={`mt-8 ${cardBg} border rounded-2xl p-6`}>
          <h3 className={`text-xl font-bold ${textPrimary} mb-4 text-center`}>
            📬 Enjoyed this post?
          </h3>
          <p className={`text-sm ${textSecondary} text-center mb-6`}>
            Get notified when I publish new content, or support me on Patreon for exclusive access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NewsletterCTA variant="button" source="blog_post_bottom" />
            <PatreonCTA variant="button" />
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className={`text-2xl font-bold ${textPrimary} mb-6`}>Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} theme={theme} />
              ))}
            </div>
          </section>
        )}

        {/* Comments Section */}
        <CommentsSection 
          postId={post.id}
          comments={comments}
          setComments={setComments}
          commentsLoading={commentsLoading}
          setCommentsLoading={setCommentsLoading}
          commentName={commentName}
          setCommentName={setCommentName}
          commentEmail={commentEmail}
          setCommentEmail={setCommentEmail}
          commentText={commentText}
          setCommentText={setCommentText}
          commentSubmitting={commentSubmitting}
          setCommentSubmitting={setCommentSubmitting}
          commentSuccess={commentSuccess}
          setCommentSuccess={setCommentSuccess}
          commentError={commentError}
          setCommentError={setCommentError}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          pageLoadTime={pageLoadTime}
          theme={theme}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          textMuted={textMuted}
          cardBg={cardBg}
        />
          </article>

          {/* Table of Contents - Right Sidebar */}
          {tocItems.length > 0 && (
            <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col gap-4">
              <TableOfContents
                items={tocItems}
                activeId={activeHeadingId}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                cardBg={cardBg}
              />
              <NewsletterCTA
                variant="card"
                source="blog_post_top"
                className={`sticky top-36 ${cardBg}`}
              />
            </aside>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SocialIcons variant="footer" showCopyright={false} />
          <div className={`text-center text-xs pt-4 ${textMuted}`}>
            © {new Date().getFullYear()} {profile?.name || 'Author'}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
