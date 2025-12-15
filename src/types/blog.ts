/**
 * Blog System TypeScript Types
 * 
 * Defines interfaces for blog posts, categories, and related entities
 */

// =====================================================
// BLOG POST TYPES
// =====================================================

export type BlogPostStatus = 'draft' | 'published' | 'scheduled';

/**
 * Blog Post - Full entity with all fields
 */
export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  
  // Dual content storage
  content_json: string;  // TipTap JSON for editor
  content_html: string;  // Sanitized HTML for rendering
  
  // Images
  cover_image?: string | null;
  featured_image_id?: number | null;
  featured_image?: BlogFeaturedImage | null;
  instagram_image?: string | null;
  instagram_image_id?: number | null;
  twitter_image?: string | null;
  twitter_image_id?: number | null;
  facebook_image?: string | null;
  facebook_image_id?: number | null;
  
  // OpenGraph
  og_title?: string | null;
  og_description?: string | null;
  
  // SEO
  meta_description?: string | null;
  primary_keywords?: string | null;
  longtail_keywords?: string | null;
  
  // Categorization
  tags: string[];
  categories: string[];
  universe_tag?: string | null;
  
  // Publishing
  author_id: number;
  author_name?: string;
  status: BlogPostStatus;
  published_at?: string | null;
  scheduled_at?: string | null;
  
  // Metadata
  reading_time?: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Blog Post Summary - For list views (without full content)
 */
export interface BlogPostSummary {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_image?: string | null;
  featured_image_id?: number | null;
  tags: string[];
  categories: string[];
  universe_tag?: string | null;
  status: BlogPostStatus;
  published_at?: string | null;
  scheduled_at?: string | null;
  reading_time?: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  author_id: number;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Featured image details from gallery
 */
export interface BlogFeaturedImage {
  id: number;
  original_path: string;
  thumbnail_path?: string;
  alt_text?: string;
  width?: number;
  height?: number;
  prompt?: string;
  checkpoint?: string;
}

// =====================================================
// BLOG POST INPUT TYPES
// =====================================================

/**
 * Create blog post input
 */
export interface CreateBlogPostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content_json: string;
  content_html: string;
  cover_image?: string;
  featured_image_id?: number;
  instagram_image?: string;
  instagram_image_id?: number;
  twitter_image?: string;
  twitter_image_id?: number;
  facebook_image?: string;
  facebook_image_id?: number;
  og_title?: string;
  og_description?: string;
  meta_description?: string;
  primary_keywords?: string;
  longtail_keywords?: string;
  tags?: string[];
  categories?: string[];
  universe_tag?: string;
  status?: BlogPostStatus;
  scheduled_at?: string;
}

/**
 * Update blog post input
 */
export interface UpdateBlogPostInput {
  id: number;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content_json?: string;
  content_html?: string;
  cover_image?: string | null;
  featured_image_id?: number | null;
  instagram_image?: string | null;
  instagram_image_id?: number | null;
  twitter_image?: string | null;
  twitter_image_id?: number | null;
  facebook_image?: string | null;
  facebook_image_id?: number | null;
  og_title?: string | null;
  og_description?: string | null;
  meta_description?: string | null;
  primary_keywords?: string | null;
  longtail_keywords?: string | null;
  tags?: string[];
  categories?: string[];
  universe_tag?: string | null;
  status?: BlogPostStatus;
  scheduled_at?: string | null;
  change_summary?: string;
}

// =====================================================
// BLOG TAG TYPES
// =====================================================

export interface BlogTag {
  name: string;
  slug: string;
  post_count: number;
}

// =====================================================
// BLOG CATEGORY TYPES
// =====================================================

export interface BlogCategory {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  sort_order: number;
  post_count: number;
  created_at: string;
}

// =====================================================
// BLOG REVISION TYPES
// =====================================================

export interface BlogRevision {
  id: number;
  post_id: number;
  content_json: string;
  content_html: string;
  title: string;
  excerpt?: string | null;
  edited_by: number;
  change_summary?: string | null;
  created_at: string;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface BlogListResponse {
  success: boolean;
  posts: BlogPostSummary[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  error?: string;
}

export interface BlogGetResponse {
  success: boolean;
  post?: BlogPost;
  related_posts?: BlogPostSummary[];
  error?: string;
}

export interface BlogCreateResponse {
  success: boolean;
  post?: BlogPost;
  id?: number;
  error?: string;
}

export interface BlogUpdateResponse {
  success: boolean;
  post?: BlogPost;
  error?: string;
}

export interface BlogDeleteResponse {
  success: boolean;
  message?: string;
  deleted_id?: number;
  deleted_title?: string;
  post?: BlogPost;
  error?: string;
}

export interface BlogCategoriesResponse {
  success: boolean;
  categories: BlogCategory[];
  error?: string;
}

export interface BlogTagsResponse {
  success: boolean;
  tags: BlogTag[];
  total: number;
  error?: string;
}

// =====================================================
// QUERY PARAMETER TYPES
// =====================================================

export interface BlogListParams {
  page?: number;
  limit?: number;
  status?: BlogPostStatus;
  universe?: string;
  category?: string;
  tag?: string;
  q?: string;
  sort?: 'published_at' | 'created_at' | 'view_count' | 'title' | 'updated_at';
  order?: 'ASC' | 'DESC';
}

export interface BlogGetParams {
  slug?: string;
  id?: number;
  include_related?: boolean;
}
