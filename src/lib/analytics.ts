import { API_BASE } from './apiBase';

// Generate and persist session ID
function getSessionId(): string {
  const key = 'analytics:session';
  let sessionId = localStorage.getItem(key);
  
  if (!sessionId) {
    // Generate UUID v4
    sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    localStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

// Core tracking function
async function track(eventType: string, payload: any = {}): Promise<void> {
  try {
    const data = {
      event_type: eventType,
      session_id: getSessionId(),
      url_path: window.location.pathname,
      referrer: document.referrer || undefined,
      ...payload
    };

    await fetch(`${API_BASE}/analytics/ingest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(data)
    });
  } catch (error) {
    // Silently fail - don't break user experience for analytics
    console.debug('Analytics tracking failed:', error);
  }
}

// Convenience helpers
export const analytics = {
  // Page views
  trackPageView() {
    track('page_view');
  },

  // Story/Chapter tracking
  trackStoryView(storySlug: string, storyId?: number) {
    track('story_view', {
      content_type: 'story',
      content_id: storyId,
      meta: { story_slug: storySlug }
    });
  },

  trackChapterView(params: {
    chapterId: number;
    storyId: number;
    storySlug: string;
    chapterNumber: number;
  }) {
    track('chapter_view', {
      content_type: 'chapter',
      content_id: params.chapterId,
      parent_type: 'story',
      parent_id: params.storyId,
      meta: {
        story_slug: params.storySlug,
        chapter_number: params.chapterNumber
      }
    });
  },

  trackChapterDepth(params: {
    chapterId: number;
    storyId: number;
  }, metrics: {
    depth: number; // 0..1
    timeMs: number;
  }) {
    track('chapter_depth', {
      content_type: 'chapter',
      content_id: params.chapterId,
      parent_type: 'story',
      parent_id: params.storyId,
      value_num: Math.max(0, Math.min(1, metrics.depth)), // Clamp 0..1
      meta: {
        time_ms: metrics.timeMs
      }
    });
  },

  // Gallery/Image tracking
  trackGalleryView(galleryId: number) {
    track('gallery_view', {
      content_type: 'gallery',
      content_id: galleryId
    });
  },

  trackImageView(imageId: number, galleryId: number) {
    track('image_view', {
      content_type: 'image',
      content_id: imageId,
      parent_type: 'gallery',
      parent_id: galleryId
    });
  },

  // Click tracking
  trackClick(name: string, meta: any = {}, contentHints: any = {}) {
    track('click', {
      content_type: contentHints.content_type,
      content_id: contentHints.content_id,
      parent_type: contentHints.parent_type,
      parent_id: contentHints.parent_id,
      meta: {
        name,
        ...meta
      }
    });
  }
};

// Chapter depth tracking utility
export class ChapterDepthTracker {
  private startTime: number;
  private maxDepth: number = 0;
  private element: HTMLElement | null = null;

  constructor(scrollElement: HTMLElement) {
    this.startTime = Date.now();
    this.element = scrollElement;
    this.handleScroll = this.handleScroll.bind(this);
    this.element.addEventListener('scroll', this.handleScroll, { passive: true });
  }

  private handleScroll() {
    if (!this.element) return;
    
    const scrollTop = this.element.scrollTop;
    const scrollHeight = this.element.scrollHeight;
    const clientHeight = this.element.clientHeight;
    
    const depth = Math.min(1, (scrollTop + clientHeight) / scrollHeight);
    this.maxDepth = Math.max(this.maxDepth, depth);
  }

  destroy(chapterParams: { chapterId: number; storyId: number }) {
    if (this.element) {
      this.element.removeEventListener('scroll', this.handleScroll);
    }
    
    const timeMs = Date.now() - this.startTime;
    
    // Only send if user actually engaged (read for >2s and scrolled >5%)
    if (timeMs > 2000 && this.maxDepth > 0.05) {
      analytics.trackChapterDepth(chapterParams, {
        depth: this.maxDepth,
        timeMs
      });
    }
  }
}

// Auto page view tracking (call this once in your router)
export function setupPageViewTracking() {
  // Track initial page view
  analytics.trackPageView();
  
  // Track subsequent navigation (for SPAs)
  let currentPath = window.location.pathname;
  
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      analytics.trackPageView();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also listen to popstate for back/forward navigation
  window.addEventListener('popstate', () => {
    analytics.trackPageView();
  });
}
