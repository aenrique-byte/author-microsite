/**
 * Blog API Utilities
 *
 * Frontend functions to interact with the Blog backend API
 */

import { API_BASE } from '../lib/apiBase';
import type {
  BlogCategory,
  BlogTag,
  BlogListResponse,
  BlogGetResponse,
  BlogCreateResponse,
  BlogUpdateResponse,
  BlogDeleteResponse,
  BlogCategoriesResponse,
  BlogTagsResponse,
  BlogListParams,
  BlogGetParams,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from '../types/blog';
// MOCK DATA - Import mock data for offline development
import mockData from '../data/mock-data.json';

// =====================================================
// CACHE
// =====================================================

let categoriesCache: BlogCategory[] | null = null;
let tagsCache: BlogTag[] | null = null;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    const text = await response.text();
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    } catch {
      throw new Error(text || `HTTP ${response.status}`);
    }
  }
  return response.json();
}

async function postJson<T>(
  url: string,
  body: unknown,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST'
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    } catch (err) {
      if (err instanceof Error && err.message.includes('HTTP')) throw err;
      throw new Error(text || `HTTP ${response.status}`);
    }
  }

  return text ? JSON.parse(text) : ({} as T);
}

function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

// =====================================================
// BLOG POST API
// =====================================================

/**
 * List blog posts with pagination and filtering
 */
export async function listBlogPosts(
  params?: BlogListParams
): Promise<BlogListResponse> {
  try {
    const queryString = params ? buildQueryString(params as Record<string, unknown>) : '';
    return await fetchJson<BlogListResponse>(
      `${API_BASE}/blog/list.php${queryString}`
    );
  } catch (error) {
    // MOCK DATA - Fallback to mock data when database is offline
    console.log('Database offline, using mock blog data');
    const mockPosts = mockData.blog.posts as any[];
    return {
      success: true,
      posts: mockPosts,
      total: mockPosts.length,
      page: params?.page || 1,
      limit: params?.limit || 10,
      pages: Math.ceil(mockPosts.length / (params?.limit || 10)),
    };
  }
}

/**
 * Get a single blog post by slug or ID
 */
export async function getBlogPost(
  params: BlogGetParams
): Promise<BlogGetResponse> {
  try {
    const queryParams: Record<string, unknown> = {};
    if (params.slug) queryParams.slug = params.slug;
    if (params.id) queryParams.id = params.id;
    if (params.include_related) queryParams.include_related = 'true';

    const queryString = buildQueryString(queryParams);
    return await fetchJson<BlogGetResponse>(
      `${API_BASE}/blog/get.php${queryString}`
    );
  } catch (error) {
    // MOCK DATA - Fallback to mock data when database is offline
    console.log('Database offline, using mock blog data');
    const mockPosts = mockData.blog.posts as any[];
    const post = params.slug
      ? mockPosts.find(p => p.slug === params.slug)
      : mockPosts.find(p => p.id === params.id);

    if (post) {
      return {
        success: true,
        post: post,
      };
    }

    return {
      success: false,
      error: 'Post not found',
    };
  }
}

/**
 * Get a blog post by slug (convenience function)
 */
export async function getBlogPostBySlug(
  slug: string,
  includeRelated = false
): Promise<BlogGetResponse> {
  return getBlogPost({ slug, include_related: includeRelated });
}

/**
 * Get a blog post by ID (convenience function)
 */
export async function getBlogPostById(
  id: number,
  includeRelated = false
): Promise<BlogGetResponse> {
  return getBlogPost({ id, include_related: includeRelated });
}

/**
 * Create a new blog post (requires authentication)
 */
export async function createBlogPost(
  input: CreateBlogPostInput
): Promise<BlogCreateResponse> {
  try {
    return await postJson<BlogCreateResponse>(
      `${API_BASE}/blog/create.php`,
      input
    );
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Update an existing blog post (requires authentication)
 */
export async function updateBlogPost(
  input: UpdateBlogPostInput
): Promise<BlogUpdateResponse> {
  try {
    return await postJson<BlogUpdateResponse>(
      `${API_BASE}/blog/update.php`,
      input
    );
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Delete a blog post (requires authentication)
 * 
 * @param id - Post ID to delete
 * @param permanent - If true, permanently deletes; if false, moves to draft
 */
export async function deleteBlogPost(
  id: number,
  permanent = false
): Promise<BlogDeleteResponse> {
  try {
    return await postJson<BlogDeleteResponse>(
      `${API_BASE}/blog/delete.php`,
      { id, permanent }
    );
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// =====================================================
// BLOG CATEGORIES API
// =====================================================

/**
 * List all blog categories with post counts
 */
export async function listBlogCategories(
  includeEmpty = false
): Promise<BlogCategoriesResponse> {
  try {
    const queryString = includeEmpty ? '?include_empty=true' : '';
    const response = await fetchJson<BlogCategoriesResponse>(
      `${API_BASE}/blog/categories/list.php${queryString}`
    );

    if (response.success) {
      categoriesCache = response.categories;
    }

    return response;
  } catch (error) {
    // MOCK DATA - Fallback to mock data when database is offline
    console.log('Database offline, using mock blog categories');
    const mockCategories = mockData.blog.categories as any[];
    return {
      success: true,
      categories: mockCategories,
    };
  }
}

/**
 * Get cached categories (fetches if not cached)
 */
export async function getCachedBlogCategories(): Promise<BlogCategory[]> {
  if (categoriesCache) return categoriesCache;
  const result = await listBlogCategories(true);
  return result.success ? result.categories : [];
}

/**
 * Create a new blog category (requires authentication)
 */
export async function createBlogCategory(
  name: string,
  description?: string,
  sortOrder?: number
): Promise<{ success: boolean; category?: BlogCategory; error?: string }> {
  try {
    const result = await postJson<{ success: boolean; category: BlogCategory; error?: string }>(
      `${API_BASE}/blog/categories/create.php`,
      { name, description, sort_order: sortOrder }
    );
    if (result.success) {
      categoriesCache = null; // Invalidate cache
    }
    return result;
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Delete a blog category (requires authentication)
 */
export async function deleteBlogCategory(
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const result = await postJson<{ success: boolean; message?: string; error?: string }>(
      `${API_BASE}/blog/categories/delete.php`,
      { id }
    );
    if (result.success) {
      categoriesCache = null; // Invalidate cache
    }
    return result;
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// =====================================================
// BLOG TAGS API
// =====================================================

/**
 * List all unique tags with post counts
 */
export async function listBlogTags(): Promise<BlogTagsResponse> {
  try {
    const response = await fetchJson<BlogTagsResponse>(
      `${API_BASE}/blog/tags/list.php`
    );

    if (response.success) {
      tagsCache = response.tags;
    }

    return response;
  } catch (error) {
    // MOCK DATA - Fallback to mock data when database is offline
    console.log('Database offline, using mock blog tags');
    const mockTags = mockData.blog.tags as any[];
    return {
      success: true,
      tags: mockTags,
      total: mockTags.length,
    };
  }
}

/**
 * Get cached tags (fetches if not cached)
 */
export async function getCachedBlogTags(): Promise<BlogTag[]> {
  if (tagsCache) return tagsCache;
  const result = await listBlogTags();
  return result.success ? result.tags : [];
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
}

/**
 * Calculate estimated reading time from HTML content
 */
export function calculateReadingTime(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]*>/g, '');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Format date for display
 */
export function formatBlogDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date for datetime input
 */
export function formatDateForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}

/**
 * Get RSS feed URL
 */
export function getBlogRssFeedUrl(params?: {
  category?: string;
  universe?: string;
  limit?: number;
}): string {
  const queryString = params ? buildQueryString(params) : '';
  return `${API_BASE}/blog/rss.xml.php${queryString}`;
}

/**
 * Clear all caches
 */
export function clearBlogCaches(): void {
  categoriesCache = null;
  tagsCache = null;
}

// =====================================================
// EXPORT TYPES FOR CONVENIENCE
// =====================================================

// =====================================================
// BLOG IMAGES API (Phase 2 - Gallery Integration)
// =====================================================

/**
 * Image from gallery for blog picker
 */
export interface BlogPickerImage {
  id: number;
  title: string;
  original_path: string;
  thumbnail_path: string | null;
  width: number | null;
  height: number | null;
  aspect_ratio: number | null;
  file_size: number | null;
  mime_type: string | null;
  prompt: string | null;
  checkpoint: string | null;
  gallery_id: number;
  gallery_slug: string;
  gallery_title: string;
  created_at: string;
}

/**
 * Gallery info for picker dropdown
 */
export interface BlogPickerGallery {
  id: number;
  slug: string;
  title: string;
  image_count: number;
}

/**
 * Image picker params
 */
export interface BlogImagePickerParams {
  page?: number;
  limit?: number;
  q?: string;
  gallery_id?: number;
  min_width?: number;
  min_height?: number;
  aspect_ratio?: 'square' | 'landscape' | 'portrait';
  source?: 'blog-assets' | 'all';
}

/**
 * Image picker response
 */
export interface BlogImagePickerResponse {
  success: boolean;
  images: BlogPickerImage[];
  galleries: BlogPickerGallery[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  error?: string;
}

/**
 * Linked image with source info
 */
export interface BlogLinkedImage {
  link_id: number;
  source: 'inline' | 'featured' | 'social_instagram' | 'social_twitter' | 'social_facebook';
  position_order: number;
  linked_at: string;
  image_id: number;
  title: string;
  original_path: string;
  thumbnail_path: string | null;
  width: number | null;
  height: number | null;
  prompt: string | null;
  checkpoint: string | null;
  gallery_slug: string;
  gallery_title: string;
}

/**
 * Image link response
 */
export interface BlogImageLinkResponse {
  success: boolean;
  blog_post_id?: number;
  images?: BlogLinkedImage[];
  grouped?: {
    inline: BlogLinkedImage[];
    featured: BlogLinkedImage[];
    social_instagram: BlogLinkedImage[];
    social_twitter: BlogLinkedImage[];
    social_facebook: BlogLinkedImage[];
  };
  totals?: {
    inline: number;
    featured: number;
    social_instagram: number;
    social_twitter: number;
    social_facebook: number;
    total: number;
  };
  link?: {
    id: number;
    blog_post_id: number;
    image_id: number;
    source: string;
    position_order: number;
    created_at: string;
  };
  deleted?: boolean;
  message?: string;
  error?: string;
}

/**
 * List images for blog image picker
 */
export async function listBlogImages(
  params?: BlogImagePickerParams
): Promise<BlogImagePickerResponse> {
  try {
    const queryString = params ? buildQueryString(params as Record<string, unknown>) : '';
    return await fetchJson<BlogImagePickerResponse>(
      `${API_BASE}/blog/images/picker.php${queryString}`
    );
  } catch (error) {
    return {
      success: false,
      images: [],
      galleries: [],
      total: 0,
      page: 1,
      limit: 24,
      pages: 0,
      error: String(error),
    };
  }
}

/**
 * Get linked images for a blog post
 */
export async function getBlogLinkedImages(
  blogPostId: number
): Promise<BlogImageLinkResponse> {
  try {
    return await fetchJson<BlogImageLinkResponse>(
      `${API_BASE}/blog/images/link.php?blog_post_id=${blogPostId}`
    );
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Link an image to a blog post
 */
export async function linkBlogImage(
  blogPostId: number,
  imageId: number,
  source: 'inline' | 'featured' | 'social_instagram' | 'social_twitter' | 'social_facebook',
  positionOrder = 0
): Promise<BlogImageLinkResponse> {
  try {
    return await postJson<BlogImageLinkResponse>(
      `${API_BASE}/blog/images/link.php`,
      { blog_post_id: blogPostId, image_id: imageId, source, position_order: positionOrder }
    );
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Unlink an image from a blog post
 */
export async function unlinkBlogImage(
  blogPostId: number,
  imageId: number,
  source: 'inline' | 'featured' | 'social_instagram' | 'social_twitter' | 'social_facebook'
): Promise<BlogImageLinkResponse> {
  try {
    return await postJson<BlogImageLinkResponse>(
      `${API_BASE}/blog/images/link.php`,
      { blog_post_id: blogPostId, image_id: imageId, source },
      'DELETE'
    );
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// =====================================================
// BLOG ANALYTICS API
// =====================================================

/**
 * Track blog analytics response
 */
export interface BlogTrackResponse {
  success: boolean;
  already_tracked?: boolean;
  error?: string;
}

/**
 * Get or create session ID for analytics
 */
function getAnalyticsSessionId(): string {
  const storageKey = 'analytics_session';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    // Generate a random session ID
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

/**
 * Track a blog view
 */
export async function trackBlogView(
  postId: number,
  postSlug?: string
): Promise<BlogTrackResponse> {
  try {
    return await postJson<BlogTrackResponse>(
      `${API_BASE}/blog/analytics/track.php`,
      {
        event_type: 'blog_view',
        post_id: postId,
        post_slug: postSlug,
        session_id: getAnalyticsSessionId(),
        source: document.referrer ? 'referral' : 'direct'
      }
    );
  } catch (error) {
    console.error('Failed to track blog view:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Track a blog like
 */
export async function trackBlogLike(
  postId: number,
  _postSlug?: string
): Promise<BlogTrackResponse & { like_count?: number; user_liked?: boolean; already_tracked?: boolean }> {
  try {
    const response = await postJson<any>(
      `${API_BASE}/blog/like.php`,
      {
        post_id: postId
      }
    );

    // Return format compatible with existing code
    return {
      success: response.success || false,
      like_count: response.like_count,
      user_liked: response.user_liked,
      already_tracked: response.user_liked // If user_liked is true, they already liked it
    };
  } catch (error) {
    console.error('Failed to track blog like:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Track a blog share
 */
export async function trackBlogShare(
  postId: number,
  postSlug?: string,
  platform?: string
): Promise<BlogTrackResponse> {
  try {
    return await postJson<BlogTrackResponse>(
      `${API_BASE}/blog/analytics/track.php`,
      {
        event_type: 'blog_share',
        post_id: postId,
        post_slug: postSlug,
        session_id: getAnalyticsSessionId(),
        source: platform
      }
    );
  } catch (error) {
    console.error('Failed to track blog share:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get blog post like status (server-side check)
 */
export async function getBlogLikeStatus(postId: number): Promise<{ success: boolean; like_count?: number; user_liked?: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/blog/like.php?post_id=${postId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get blog like status:', error);
    return { success: false, like_count: 0, user_liked: false };
  }
}

/**
 * Check if user has liked a post (based on localStorage - deprecated, use getBlogLikeStatus)
 * @deprecated Use getBlogLikeStatus for server-side check
 */
export function hasLikedPost(postId: number): boolean {
  const likedPosts = JSON.parse(localStorage.getItem('blog_likes') || '[]');
  return likedPosts.includes(postId);
}

/**
 * Mark post as liked in localStorage (kept for backwards compatibility)
 * @deprecated Server now tracks this, no need for localStorage
 */
export function markPostLiked(postId: number): void {
  const likedPosts = JSON.parse(localStorage.getItem('blog_likes') || '[]');
  if (!likedPosts.includes(postId)) {
    likedPosts.push(postId);
    localStorage.setItem('blog_likes', JSON.stringify(likedPosts));
  }
}

// =====================================================
// BLOG COMMENTS API
// =====================================================

/**
 * Blog comment
 */
export interface BlogComment {
  id: number;
  post_id: number;
  parent_id: number | null;
  author_name: string;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'trash';
  is_flagged: boolean;
  created_at: string;
  reply_count?: number;
  replies?: BlogComment[];
}

/**
 * Comments list response
 */
export interface BlogCommentsResponse {
  success: boolean;
  data?: {
    comments: BlogComment[];
    post: {
      id: number;
      title: string;
      slug: string;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
    status_counts?: Record<string, number>;
    is_admin: boolean;
  };
  error?: string;
}

/**
 * Comment create response
 */
export interface BlogCommentCreateResponse {
  success: boolean;
  message?: string;
  comment_id?: number;
  status?: string;
  error?: string;
  errors?: string[];
}

/**
 * Comment moderate response
 */
export interface BlogCommentModerateResponse {
  success: boolean;
  message?: string;
  affected_count?: number;
  affected_posts?: number[];
  error?: string;
}

/**
 * List comments for a blog post
 */
export async function listBlogComments(
  postId: number,
  params?: {
    status?: string;
    page?: number;
    limit?: number;
    include_replies?: boolean;
  }
): Promise<BlogCommentsResponse> {
  try {
    const queryParams: Record<string, unknown> = { post_id: postId, ...params };
    const queryString = buildQueryString(queryParams);
    return await fetchJson<BlogCommentsResponse>(
      `${API_BASE}/blog/comments/list.php${queryString}`
    );
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Create a new comment on a blog post
 */
export async function createBlogComment(
  postId: number,
  authorName: string,
  content: string,
  options?: {
    author_email?: string;
    parent_id?: number;
    time_on_page?: number;
  }
): Promise<BlogCommentCreateResponse> {
  try {
    return await postJson<BlogCommentCreateResponse>(
      `${API_BASE}/blog/comments/create.php`,
      {
        post_id: postId,
        author_name: authorName,
        content,
        author_email: options?.author_email,
        parent_id: options?.parent_id,
        time_on_page: options?.time_on_page,
        website: '', // Honeypot - should always be empty
      }
    );
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Moderate comments (requires authentication)
 */
export async function moderateBlogComments(
  commentIds: number[],
  action: 'approve' | 'reject' | 'spam' | 'trash' | 'delete'
): Promise<BlogCommentModerateResponse> {
  try {
    return await postJson<BlogCommentModerateResponse>(
      `${API_BASE}/blog/comments/moderate.php`,
      { comment_ids: commentIds, action }
    );
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// =====================================================
// EXPORT TYPES FOR CONVENIENCE
// =====================================================

export type {
  BlogPost,
  BlogPostSummary,
  BlogCategory,
  BlogTag,
  BlogListResponse,
  BlogGetResponse,
  BlogCreateResponse,
  BlogUpdateResponse,
  BlogDeleteResponse,
  BlogCategoriesResponse,
  BlogTagsResponse,
  BlogListParams,
  BlogGetParams,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from '../types/blog';
