// Unified API-based story utilities
// This replaces the file-based story.js with database-driven functionality

import { API_BASE } from '../../../lib/apiBase';
// MOCK DATA - Import mock data for offline development
import mockData from '../../../data/mock-data.json';

const API_BASE_URL = API_BASE;

// Helper function to get correct image path based on current location
function getImagePath(imagePath: string | null): string | null {
  if (!imagePath) return null;
  const raw = String(imagePath);

  // Absolute URL - return as-is
  if (/^https?:\/\//i.test(raw)) return raw;

  // Normalize slashes
  const sanitized = raw.replace(/^\/+/, '');

  // Ensure uploaded assets resolve to the consolidated API folder
  // Cases:
  //  - '/api/uploads/...' => keep as-is
  //  - 'api/uploads/...'  => prefix leading slash
  //  - '/uploads/...'     => rewrite to '/api/uploads/...'
  //  - 'uploads/...'      => rewrite to '/api/uploads/...'
  if (sanitized.startsWith('api/uploads/')) return `/${sanitized}`;
  if (sanitized.startsWith('uploads/')) return `/api/${sanitized}`;
  if (sanitized.startsWith('uploads')) return `/api/${sanitized}`;

  // If it already starts with '/api/uploads', return as-is
  if (raw.startsWith('/api/uploads/')) return raw;
  if (raw.startsWith('/uploads/')) return `/api${raw}`;

  // Fallback: root-relative path
  return raw.startsWith('/') ? raw : `/${raw}`;
}

// Types - matching original storytime app structure
export interface Story {
  id: string;
  title: string;
  blurb?: string;
  cover: string;
  breakImage?: string;
  enableDropCap?: boolean;
  dropCapFont?: string;
  startIndex: number;
  status?: string;
  // SEO fields from database
  genres?: string[];
  primary_keywords?: string;
  longtail_keywords?: string;
  target_audience?: string;
  // External platform links
  external_links?: { label: string; url: string }[];
  // Aggregates
  chapter_count?: number;
  total_likes?: number;
  total_words?: number;
}

export interface Chapter {
  num: number;
  title: string;
  id?: number;
  status?: string;
  like_count?: number;
  comment_count?: number;
}

export interface ChapterDetails extends Chapter {
  soundtrack_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  chapterIndex?: number;
  percent?: number;
  scrollY?: number;
}

export interface Comment {
  id: number;
  author_name: string;
  content: string;
  created_at: string;
}

export interface AuthorProfile {
  name: string;
  bio: string;
  tagline: string;
  profile_image: string | null;
  background_image?: string | null;
  background_image_light: string | null;
  background_image_dark: string | null;
  site_domain: string | null;
  updated_at: string;
}

// Caches
const storiesCache = new Map<string, Story>();
const chaptersCache = new Map<string, Chapter[]>();
const chapterContentCache = new Map<string, string>();
let authorProfileCache: AuthorProfile | null = null;

/**
 * Fetches all stories from the unified API
 */
export async function getAllStories(): Promise<Story[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/stories/list.php?status=published`);
    const data = await response.json();

    if (data.success) {
      // Transform stories to match expected format
      const transformedStories: Story[] = (data.stories || []).map((story: any) => ({
        id: story.slug,
        title: story.title,
        blurb: story.description,
        cover: story.cover_image ? (getImagePath(story.cover_image) || '/images/default-cover.jpg') : '/images/default-cover.jpg',
        breakImage: story.break_image ? (getImagePath(story.break_image) || undefined) : undefined,
        startIndex: 1,
        status: story.status,
        // SEO fields
        genres: story.genres || [],
        primary_keywords: story.primary_keywords,
        longtail_keywords: story.longtail_keywords,
        target_audience: story.target_audience,
        // External platform links
        external_links: Array.isArray(story.external_links) ? story.external_links : [],
        // Aggregates
        chapter_count: story.chapter_count || 0,
        total_likes: story.total_likes || 0,
        total_words: story.total_words || 0
      }));
      return transformedStories;
    } else {
      console.error('Failed to load stories:', data.error);
      return [];
    }
  } catch (error) {
    // MOCK DATA - Fallback to mock data when database is offline
    console.log('Database offline, using mock storytime data');
    const mockStories = mockData.storytime.stories as any[];
    return mockStories.map((story: any) => ({
      id: story.slug,
      title: story.title,
      blurb: story.blurb,
      cover: story.cover,
      startIndex: 1,
      status: story.status || 'published',
      genres: story.genres || [],
      chapter_count: story.chapter_count || 0,
      total_likes: story.total_likes || 0,
      total_words: 0
    }));
  }
}

/**
 * Fetches a single story by slug from the unified API
 */
export async function getStory(storySlug: string): Promise<Story | null> {
  // Check cache first
  if (storiesCache.has(storySlug)) {
    return storiesCache.get(storySlug)!;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/stories/list.php?slug=${encodeURIComponent(storySlug)}`);
    const data = await response.json();

    if (data.success && data.stories && data.stories.length > 0) {
      const story = data.stories[0];
      // Transform to match expected format
      const transformedStory: Story = {
        id: story.slug,
        title: story.title,
        blurb: story.description,
        cover: story.cover_image ? (getImagePath(story.cover_image) || '/images/default-cover.jpg') : '/images/default-cover.jpg',
        breakImage: story.break_image ? (getImagePath(story.break_image) || undefined) : undefined,
        enableDropCap: !!story.enable_drop_cap,
        dropCapFont: story.drop_cap_font || 'serif',
        startIndex: 1,
        status: story.status,
        // SEO fields
        genres: story.genres || [],
        primary_keywords: story.primary_keywords,
        longtail_keywords: story.longtail_keywords,
        target_audience: story.target_audience,
        // External platform links
        external_links: Array.isArray(story.external_links) ? story.external_links : [],
        // Aggregates
        chapter_count: story.chapter_count || 0,
        total_likes: story.total_likes || 0,
        total_words: story.total_words || 0
      };

      storiesCache.set(storySlug, transformedStory);
      return transformedStory;
    } else {
      return null;
    }
  } catch (error) {
    // MOCK DATA - Fallback to mock data when database is offline
    console.log('Database offline, using mock storytime data');
    const mockStories = mockData.storytime.stories as any[];
    const mockStory = mockStories.find((s: any) => s.slug === storySlug);

    if (mockStory) {
      const transformedStory: Story = {
        id: mockStory.slug,
        title: mockStory.title,
        blurb: mockStory.blurb,
        cover: mockStory.cover,
        startIndex: 1,
        status: mockStory.status || 'published',
        genres: mockStory.genres || [],
        chapter_count: mockStory.chapter_count || 0,
        total_likes: mockStory.total_likes || 0,
        total_words: 0
      };

      storiesCache.set(storySlug, transformedStory);
      return transformedStory;
    }

    return null;
  }
}

/**
 * Fetches chapters for a story from the unified API
 */
export async function loadChapterList(story: Story, _onUpdate: ((chapters: Chapter[]) => void) | null = null): Promise<Chapter[]> {
  const cacheKey = story.id;

  // Check cache first
  if (chaptersCache.has(cacheKey)) {
    return chaptersCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chapters/list.php?story_slug=${encodeURIComponent(story.id)}`);
    const data = await response.json();

    if (data.success) {
      const chapters: Chapter[] = (data.chapters || []).map((chapter: any) => ({
        num: chapter.chapter_number,
        title: chapter.title,
        id: chapter.id,
        status: chapter.status,
        like_count: chapter.like_count || 0,
        comment_count: chapter.comment_count || 0
      }));

      chaptersCache.set(cacheKey, chapters);
      return chapters;
    } else {
      console.error('Failed to load chapters:', data.error);
      return [];
    }
  } catch (error) {
    // MOCK DATA - Fallback to mock data when database is offline
    console.log('Database offline, using mock storytime data');
    const mockChapters = (mockData.storytime.chapters as any)[story.id];

    if (mockChapters && Array.isArray(mockChapters)) {
      const chapters: Chapter[] = mockChapters.map((chapter: any) => ({
        num: chapter.num,
        title: chapter.title,
        status: 'published',
        like_count: chapter.like_count || 0,
        comment_count: chapter.comment_count || 0
      }));

      chaptersCache.set(cacheKey, chapters);
      return chapters;
    }

    return [];
  }
}

/**
 * Force refresh chapter list (for refresh functionality)
 */
export async function loadChapterListWithCacheBust(story: Story, onUpdate: ((chapters: Chapter[]) => void) | null = null): Promise<Chapter[]> {
  // Clear cache
  chaptersCache.delete(story.id);
  
  // Reload fresh data
  return await loadChapterList(story, onUpdate);
}

/**
 * Clear chapter cache for a story
 */
export function clearChapterCache(storyId: string): void {
  chaptersCache.delete(storyId);
  chapterContentCache.delete(storyId);
}

/**
 * Fetches chapter content from the unified API
 */
export async function getChapterContent(story: Story, chapterId: string): Promise<string> {
  const cacheKey = `${story.id}-${chapterId}`;

  // Check cache first
  if (chapterContentCache.has(cacheKey)) {
    return chapterContentCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chapters/list.php?story_slug=${encodeURIComponent(story.id)}&chapter_number=${chapterId}`);
    const data = await response.json();

    if (data.success && data.chapters && data.chapters.length > 0) {
      const chapter = data.chapters[0];
      const content = chapter.content || '';

      chapterContentCache.set(cacheKey, content);
      return content;
    } else {
      throw new Error('Chapter not found');
    }
  } catch (error) {
    // MOCK DATA - Fallback to mock data when database is offline
    console.log('Database offline, using mock storytime data');
    const mockChapters = (mockData.storytime.chapters as any)[story.id];

    if (mockChapters && Array.isArray(mockChapters)) {
      const chapterNum = parseInt(chapterId, 10);
      const mockChapter = mockChapters.find((ch: any) => ch.num === chapterNum);

      if (mockChapter && mockChapter.content) {
        chapterContentCache.set(cacheKey, mockChapter.content);
        return mockChapter.content;
      }
    }

    throw new Error('Chapter not found');
  }
}

/**
 * Get chapter details (title, metadata) without full content
 */
export async function getChapterDetails(story: Story, chapterId: string): Promise<ChapterDetails | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/chapters/list.php?story_slug=${encodeURIComponent(story.id)}&chapter_number=${chapterId}`);
    const data = await response.json();

    if (data.success && data.chapters && data.chapters.length > 0) {
      const chapter = data.chapters[0];
      return {
        id: chapter.id,
        num: chapter.chapter_number,
        title: chapter.title,
        soundtrack_url: chapter.soundtrack_url || null,
        status: chapter.status,
        like_count: chapter.like_count || 0,
        comment_count: chapter.comment_count || 0,
        created_at: chapter.created_at,
        updated_at: chapter.updated_at
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching chapter details:', error);
    return null;
  }
}

/**
 * Add a like to a chapter
 */
export async function likeChapter(chapterId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/chapters/like.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chapter_id: chapterId })
    });
    
    const data = await response.json();
    // Return full payload so caller can update UI (like_count, user_liked)
    return data;
  } catch (error) {
    console.error('Error liking chapter:', error);
    return { success: false };
  }
}

/**
 * Get like status for a chapter
 */
export async function getChapterLikeStatus(chapterId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/chapters/like.php?chapter_id=${encodeURIComponent(chapterId)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching like status:', error);
    return { success: false, like_count: 0, user_liked: false };
  }
}

/**
 * Add a comment to a chapter
 */
export async function addComment(chapterId: number, authorName: string, content: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/chapters/comments/create.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chapter_id: chapterId,
        author_name: authorName || 'Anonymous',
        content: content
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false };
  }
}

/**
 * Get comments for a chapter
 */
export async function getChapterComments(chapterId: number): Promise<Comment[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/chapters/comments/list.php?chapter_id=${chapterId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.comments || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

// --- Progress Tracking (keep localStorage for now) ---

function getProgressKey(storyId: string): string { 
  return `story-progress:${storyId}`; 
}

export function loadProgress(storyId: string): Progress | null { 
  try { 
    const raw = localStorage.getItem(getProgressKey(storyId)); 
    return raw ? JSON.parse(raw) : null; 
  } catch { 
    return null; 
  } 
}

export function saveProgress(storyId: string, data: Progress): void { 
  try { 
    localStorage.setItem(getProgressKey(storyId), JSON.stringify(data)); 
  } catch {} 
}

export function resetProgress(storyId: string): void { 
  try { 
    localStorage.removeItem(getProgressKey(storyId)); 
  } catch {} 
}

// Legacy compatibility - find max chapter index from API data
export async function findMaxChapterIndex(story: Story): Promise<number> {
  const chapters = await loadChapterList(story);
  return chapters.length > 0 ? Math.max(...chapters.map(ch => ch.num)) : 0;
}

/**
 * Fetches author profile from the unified API
 */
export async function getAuthorProfile(): Promise<AuthorProfile> {
  // Check cache first
  if (authorProfileCache) {
    return authorProfileCache;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/author/get.php`);
    const data = await response.json();
    
    if (data.success && data.profile) {
      authorProfileCache = data.profile;
      return data.profile;
    } else {
      // Return default profile if API fails
      const defaultProfile: AuthorProfile = {
        name: 'O.C. Wanderer',
        bio: 'Sci-Fi & Fantasy Author',
        tagline: 'Worlds of adventure, danger, and love',
        profile_image: null,
        background_image_light: null,
        background_image_dark: null,
        site_domain: 'authorsite.com',
        updated_at: new Date().toISOString()
      };
      return defaultProfile;
    }
  } catch (error) {
    console.error('Error fetching author profile:', error);
    // Return default profile on error
    const defaultProfile: AuthorProfile = {
      name: 'O.C. Wanderer',
      bio: 'Sci-Fi & Fantasy Author',
      tagline: 'Worlds of adventure, danger, and love',
      profile_image: null,
      background_image_light: null,
      background_image_dark: null,
      site_domain: 'authorsite.com',
      updated_at: new Date().toISOString()
    };
    return defaultProfile;
  }
}
