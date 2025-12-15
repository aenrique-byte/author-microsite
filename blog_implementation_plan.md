# Blog System Implementation Plan
## Multi-Phase Development Strategy

---

## 🚧 IMPLEMENTATION STATUS & TODO LIST

> **Last Updated:** 2025-12-14

### ✅ COMPLETED

**Phase 1: Backend Core**
- [x] Database schema (all 11 tables created in `api/migrations/2025-12-14-blog-system.sql`)
- [x] Blog CRUD API (`api/blog/create.php`, `update.php`, `delete.php`, `get.php`, `list.php`)
- [x] Categories API (`api/blog/categories/list.php`)
- [x] Tags API (`api/blog/tags/list.php`)
- [x] RSS feed (`api/blog/rss.xml.php`)
- [x] TypeScript types (`src/types/blog.ts`)
- [x] API client utilities (`src/utils/api-blog.ts`)

**Phase 2: Gallery Integration**
- [x] Image picker API (`api/blog/images/picker.php`, `link.php`)
- [x] BlogImagePicker component (`src/components/admin/blog/BlogImagePicker.tsx`)
- [x] BlogImageExtension for TipTap (`src/components/admin/blog/BlogImageExtension.ts`)
- [x] BlogManager admin component (`src/components/admin/BlogManager.tsx`)

**Phase 3: Frontend**
- [x] BlogRoute with theme integration (`src/features/blog/BlogRoute.tsx`)
- [x] BlogIndex listing page (`src/features/blog/components/BlogIndex.tsx`)
- [x] BlogPost individual view (`src/features/blog/components/BlogPost.tsx`)
- [x] BlogCard component (`src/features/blog/components/BlogCard.tsx`)
- [x] BlogSidebar with widgets (`src/features/blog/components/BlogSidebar.tsx`)
- [x] BlogSearch component (`src/features/blog/components/BlogSearch.tsx`)
- [x] TagCloud widget (`src/features/blog/components/TagCloud.tsx`)
- [x] Router integration (`/blog/*` routes)
- [x] Navigation link in UniversePortalHomepage
- [x] SEO meta tags and JSON-LD in BlogPost.tsx
- [x] Social share buttons (Twitter, Facebook, LinkedIn, Copy Link)

---

### ✅ RECENTLY COMPLETED

#### Analytics System (Completed 2025-12-14)
**Implementation:** Reused existing site analytics infrastructure (analytics_events table)

- [x] **`api/blog/analytics/track.php`** - POST endpoint
  - Tracks blog_view, blog_like, blog_share events
  - IP-based deduplication (5-min for views, 24-hour for likes)
  - Updates blog_posts.view_count and like_count counters
  - Forwards to main analytics/ingest.php for unified tracking
  
- [x] **`api/admin/analytics/blog-details.php`** - GET endpoint
  - Blog overview: all posts with period stats (views, likes, unique visitors)
  - Per-post details: daily stats, traffic sources, geographic breakdown
  - Summary cards: total views, likes, published/draft/scheduled counts
  - Daily trend charts

- [x] **Frontend view tracking in BlogPost.tsx**
  - `trackBlogView(postId)` called on page load
  - Uses `useRef` to prevent duplicate tracking per post
  - Session-based tracking via localStorage

- [x] **Like button in BlogPost.tsx**
  - Heart icon with animation states (liked/unliked)
  - Optimistic UI update with like count
  - LocalStorage persistence to prevent re-liking
  - Calls `trackBlogLike()` API

- [x] **Share tracking in BlogPost.tsx**
  - Tracks shares to Twitter, Facebook, LinkedIn, and copy-link
  - Uses `trackBlogShare()` with platform parameter

- [x] **Blog tab in AnalyticsManager.tsx** (Admin Dashboard)
  - Summary cards: total views, likes, unique visitors, post counts
  - Daily trend chart (views + likes over time)
  - All posts table with period and total metrics
  - Per-post drill-down: daily stats, traffic sources, country breakdown

- [x] **API client functions in api-blog.ts**
  - `trackBlogView()`, `trackBlogLike()`, `trackBlogShare()`
  - `hasLikedPost()`, `markPostLiked()` for localStorage state
  - `getAnalyticsSessionId()` for session management

**Note:** Uses existing `analytics_events` table instead of separate `blog_analytics` table - more consistent with site-wide analytics

---

### ✅ RECENTLY COMPLETED

#### Comments System (Completed 2025-12-14)
**Implementation:** Same pattern as chapter comments - auto-approved, unified admin moderation

- [x] **`api/blog/comments/list.php`** - GET endpoint
  - Paginated, threaded comments with nested replies
  - `?post_id=X&status=approved` for public view
  - `?post_id=X` for admin (all statuses)
  - Includes post title/slug in response

- [x] **`api/blog/comments/create.php`** - POST endpoint
  - Fields: `post_id`, `author_name`, `author_email`, `content`, `parent_id`
  - Honeypot field (`website`) for spam detection - silently rejects bots
  - `content_hash` for duplicate detection (24-hour window)
  - Time-on-page check (< 3 seconds = likely bot)
  - User-agent bot signature detection
  - Rate limit: 5 comments per IP per hour
  - **Auto-approved** (status = 'approved') - matches chapter comment behavior
  - Bots automatically marked as spam

- [x] **`api/blog/comments/moderate.php`** - POST (AUTH)
  - Actions: approve, reject, spam, trash, delete
  - Batch moderation support
  - Updates `blog_posts.comment_count` automatically

- [x] **Comment section in BlogPost.tsx**
  - Display approved comments (threaded with nested replies)
  - Comment submission form with honeypot
  - Reply functionality (inline reply forms)
  - Saves commenter name/email to localStorage
  - Relative time formatting ("2 hours ago")
  - Auto-generated avatars based on name

- [x] **Unified admin moderation**
  - Updated `api/admin/comments/list.php` to include blog comments via UNION
  - Updated `api/admin/comments/moderate.php` to handle blog_comments table
  - Blog comments appear alongside image/chapter comments in existing moderation UI
  - Comment type shown in admin ('blog', 'chapter', 'image')
  - Direct link to blog post from admin

- [x] **API client functions in api-blog.ts**
  - `listBlogComments()`, `createBlogComment()`, `moderateBlogComments()`
  - `BlogComment`, `BlogCommentsResponse` TypeScript types

**Design Decision:** Auto-approve comments (like chapter comments) instead of requiring moderation. Admin can still review/delete via unified moderation panel. This provides better user experience - comments appear immediately.

---

### ❌ NOT IMPLEMENTED - TODO LIST

---

#### Scheduled Publishing (Priority: High)
**Estimated Time:** 0.5 days

- [ ] **`api/cron/publish-scheduled-blog-posts.php`** - Every 5 minutes
  - Find posts where `status = 'scheduled'` AND `scheduled_at <= NOW()`
  - Update to `status = 'published'`, set `published_at = NOW()`
  - Log published posts
  - Trigger social crosspost if enabled (Phase 4)

---

#### Sitemap Generation (Priority: Low)
**Estimated Time:** 0.5 days

- [ ] **`api/cron/generate-sitemaps.php`** - Daily at 3 AM
  - Generate `sitemap-blog.xml` with all published posts
  - Update main sitemap index

---

### ✅ RECENTLY COMPLETED

#### Phase 4: Social Media Integration (Completed 2025-12-14)
**Implementation:** Full crossposting infrastructure with manual token entry (Phase 4 approach)

- [x] **`api/social/helpers/encryption.php`** - Token encryption/decryption
  - AES-256-CBC encryption using ENCRYPTION_KEY from config
  - Secure storage of platform access tokens
  - Decryption helpers for posting operations

- [x] **`api/social/helpers/content-formatter.php`** - Platform-specific formatting
  - `formatForInstagram()` - 2200 char limit, hashtags, "link in bio"
  - `formatForTwitter()` - 280 char limit with URL shortening
  - `formatForFacebook()` - 63K char limit with link previews
  - `formatForDiscord()` - Rich embeds with images and branding

- [x] **`api/social/credentials/get.php`** - GET endpoint (AUTH)
  - Returns status of all 7 platforms (instagram, twitter, facebook, discord, threads, bluesky, youtube)
  - Shows: connection status, expiry warnings, last used timestamps
  - Does NOT return actual tokens (security)
  - Summary stats: connected count, expiring soon count

- [x] **`api/social/credentials/update.php`** - POST endpoint (AUTH)
  - Actions: 'update', 'disconnect', 'test'
  - Platform-specific validation (e.g., Discord requires webhook URL)
  - Encrypts tokens before storage
  - Test connection functionality for each platform

- [x] **`api/social/platforms/instagram.php`** - Instagram Graph API
  - Two-step posting: create container → publish
  - Image verification (HTTPS, public URL)
  - Caption formatting with hashtags
  - Permalink retrieval after posting

- [x] **`api/social/platforms/twitter.php`** - Twitter/X API v2
  - OAuth 2.0 Bearer token authentication
  - Media upload via v1.1 endpoint (still required)
  - Tweet creation with images
  - 280 character handling

- [x] **`api/social/platforms/facebook.php`** - Facebook Graph API
  - Page posting with Page Access Token
  - Photo posts and link posts
  - Auto-generated link previews
  - Image accessibility validation

- [x] **`api/social/platforms/discord.php`** - Discord Webhooks
  - Rich embed posting with brand colors
  - No OAuth required (just webhook URL)
  - Message URL generation
  - Test webhook functionality

- [x] **`api/social/post.php`** - Orchestrator endpoint (AUTH)
  - Coordinates posting to multiple platforms
  - Fetches blog post data and builds post data
  - Gets decrypted credentials per platform
  - Tracks success/failure in `blog_social_posts` table
  - Handles custom messages per platform
  - Skips already-posted platforms

- [x] **`api/cron/retry-failed-social-posts.php`** - Cron job
  - Runs hourly to retry failed posts
  - Exponential backoff: 1h → 4h → 12h → 24h → 48h
  - Max 5 retry attempts before giving up
  - Email notification on permanent failure
  - CLI-only execution (security)

- [x] **`src/components/admin/SocialCredentialsManager.tsx`** - Frontend Admin UI
  - Grid view of all 7 platforms with status badges
  - Connect/Disconnect functionality
  - Test Connection buttons
  - Platform-specific configuration forms:
    - Discord: Webhook URL + Guild ID
    - Instagram: Access Token + User ID + Page ID
    - Twitter: Access Token + Username
    - Facebook: Access Token + Page ID
  - Token expiry warnings
  - Last used timestamps
  - Coming soon badges for future platforms

- [x] **`src/utils/api-social.ts`** - Frontend API client
  - `getSocialCredentials()` - Fetch platform status
  - `updateSocialCredentials()` - Update/disconnect/test
  - `crosspostBlogPost()` - Trigger crossposting
  - `getBlogCrosspostSettings()` - Per-post settings
  - `saveBlogCrosspostSettings()` - Save per-post settings
  - `getConnectedPlatforms()` - Helper for UI
  - Platform display info (names, icons, colors)

**Database Tables Used:**
- `social_api_credentials` - Encrypted token storage
- `blog_crosspost_settings` - Per-post platform settings
- `blog_social_posts` - Post status tracking

**Design Decisions:**
- Manual token entry (not OAuth flows) - simpler, more reliable
- Encrypted storage using AES-256-CBC
- Exponential backoff for retries
- Platform-specific image validation
- Discord via webhooks (no OAuth needed)
- Future-ready: Threads, Bluesky, YouTube placeholders

**Files Created:**
```
api/social/
├── helpers/
│   ├── content-formatter.php
│   └── encryption.php
├── credentials/
│   ├── get.php
│   └── update.php
├── platforms/
│   ├── instagram.php
│   ├── twitter.php
│   ├── facebook.php
│   └── discord.php
└── post.php

api/cron/
└── retry-failed-social-posts.php

src/components/admin/
└── SocialCredentialsManager.tsx

src/utils/
└── api-social.ts
```

---

#### Crosspost Staging UI (Completed 2025-12-14)
**Implementation:** Per-platform message staging in BlogManager admin editor

- [x] **Shared Hashtags Field**
  - Single input field for hashtags shared across platforms
  - Automatically appended to Instagram and Twitter posts
  - Example: `#writing #fantasy #books`

- [x] **Instagram Staging Panel**
  - Custom caption textarea (2,200 char limit)
  - Character counter with warning when near limit
  - Enable/disable checkbox (requires Instagram image)
  - Color-coded pink/purple gradient card
  - Placeholder shows title + excerpt + "Link in bio"

- [x] **Twitter/X Staging Panel**
  - Custom tweet textarea (280 char limit)
  - Character counter (URL = 23 chars note)
  - Enable/disable checkbox (requires Twitter image)
  - Color-coded blue gradient card
  - Placeholder shows title + URL

- [x] **Facebook Staging Panel**
  - Custom post textarea (unlimited)
  - Enable/disable checkbox (requires Facebook OR Featured image)
  - Color-coded blue gradient card
  - Placeholder shows title + excerpt + URL

- [x] **Discord Staging Panel**
  - Custom embed message textarea (2,000 char limit)
  - Character counter with warning
  - Enable/disable checkbox (no image required)
  - Color-coded indigo/purple gradient card
  - Supports Discord markdown formatting

- [x] **Integration with BlogManager**
  - Crosspost state cleared on form reset
  - Settings saved to `blog_crosspost_settings` table via API
  - Hashtags combined with per-platform messages on save
  - Summary shows "X platform(s) enabled"

**Database Used (existing schema):**
- `blog_crosspost_settings.custom_message` - Stores combined message + hashtags per platform
- `blog_crosspost_settings.enabled` - Boolean for each platform
- `blog_social_posts` - Tracks posting status after publish

---

#### Crosspost Trigger Implementation (Completed 2025-12-14)
**Implementation:** Automatic and manual posting mechanisms

- [x] **Auto-Crosspost on First Publish**
  - Detects `allow_crosspost` flag from `api/blog/update.php` response
  - Only triggers when `status === 'published'` AND `is_first_publish === true`
  - Prevents social media spam when updating already-published posts
  - Calls `crosspostBlogPost(postId)` automatically after save
  - Silent operation - logs to console, doesn't block save on failure

- [x] **Manual Share Button in Blog List**
  - Purple "Share" button (Share2 icon) appears on all published posts
  - Confirmation dialog: "Post '{title}' to social media?"
  - Shows success/failure summary with platform breakdown
  - Handles partial success gracefully (some platforms succeed, others fail)
  - Alert messages show which platforms succeeded/failed with error details

- [x] **Modified Files:**
  - `src/components/admin/BlogManager.tsx`:
    - Added `crosspostBlogPost` import from `api-social.ts`
    - Added `handleCrosspost()` function for manual posting
    - Added auto-crosspost logic after successful publish
    - Added Share button in post list UI (only for published posts)

**User Workflows:**
1. **Automatic:** Enable Discord/platforms → Publish post → Auto-posts to enabled platforms (first time only)
2. **Manual:** Click purple Share button on any published post → Posts to all enabled platforms
3. **Re-post:** Click Share button again to re-post (useful if credentials were fixed)

---

### 🔮 FUTURE PHASES (Not Started)

#### Phase 5+: Advanced Features (Future)
- [ ] OAuth automation (3-4 days)
- [ ] Engagement sync from platforms (2-3 days)
- [ ] Advanced analytics dashboard (3-5 days)
- [ ] Email newsletters integration (2-3 days)
- [ ] Content snippets/shortcodes (1-2 days)

---

### Implementation Priority Order

1. **Scheduled Publishing** (High) - 0.5 days - Critical for planning content
2. **Analytics System** (Medium) - 1-2 days - Important for engagement tracking
3. **Comments System** (Medium) - 2-3 days - Reader engagement
4. **Sitemap Generation** (Low) - 0.5 days - SEO enhancement
5. **Social Media** (Optional) - 4-6 days - Nice to have, complex

**Total Remaining for Core Features:** ~4-6 days

---

> **Template References:**
> - Frontend Template: [UniversePortalHomepage.tsx](src/components/UniversePortalHomepage.tsx)
> - Design Inspiration: [universe_portal_homepage.jsx](universe_portal_homepage.jsx)
> - Backend Pattern: [StoryManager.tsx](src/components/admin/StoryManager.tsx) + API pattern
> - Database Bootstrap: [bootstrap.php](api/bootstrap.php)

---

## 🚀 RECOMMENDED BUILD ORDER

**For fastest time-to-launch, build in this order:**

1. **Phase 1: Backend Core** (Database + Basic Editor) - 4-6 days
   - Get data structure right first
   - Build minimal admin editor
   - Test content storage (JSON + HTML)

2. **Phase 2: Gallery Integration** - 2-3 days
   - Don't build separate image system
   - Hook into existing gallery immediately
   - Less work, better architecture

3. **Phase 3: Frontend (Reading Experience)** - 3-5 days
   - Now you know what data you have
   - Build public-facing blog views
   - Polish the reader experience

4. **Phase 4: Social Media** (Optional/Future) - 4-6 days
   - "Cherry on top" feature
   - Most likely to break (external APIs)
   - Don't make it a launch dependency

**Total Core Blog: 9-14 days** (vs 15-22 with social)

---

## Database Schema (REVISED)

> ✅ **IMPLEMENTED** - Schema created in `api/migrations/2025-12-14-blog-system.sql` on 2025-12-14
> - 11 tables with all features from this plan
> - Includes triggers for automatic comment counting
> - Default categories seeded
> - Blog-assets gallery creation included
> - Gallery integration (Phase 5) fields included

```sql
-- Blog posts table
CREATE TABLE blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,

    -- DUAL STORAGE: JSON for editor, HTML for rendering
    content_json LONGTEXT NOT NULL COMMENT 'TipTap JSON for editor re-opening',
    content_html LONGTEXT NOT NULL COMMENT 'Sanitized HTML for frontend rendering',

    cover_image VARCHAR(500),

    -- Social media specific images (USER MUST UPLOAD - NO AUTO-GENERATION)
    instagram_image VARCHAR(500) COMMENT 'User-uploaded 1080x1080 or 1080x1350',
    twitter_image VARCHAR(500) COMMENT 'User-uploaded 1200x675',
    facebook_image VARCHAR(500) COMMENT 'User-uploaded 1200x630',

    -- OpenGraph metadata
    og_title VARCHAR(255),
    og_description TEXT,

    -- SEO
    meta_description TEXT,
    primary_keywords VARCHAR(500),
    longtail_keywords TEXT,

    -- Categorization
    tags JSON COMMENT 'Array of tag strings',
    categories JSON COMMENT 'Array of category strings',
    universe_tag VARCHAR(255) COMMENT 'Associated story universe (Destiny, Sinbad, etc.)',

    -- Publishing
    author_id INT NOT NULL,
    status ENUM('draft', 'published', 'scheduled') DEFAULT 'draft',
    published_at DATETIME,
    scheduled_at DATETIME,

    -- Post metadata (aggregated from analytics daily)
    reading_time INT COMMENT 'Estimated reading time in minutes',
    view_count INT DEFAULT 0 COMMENT 'Synced from daily aggregates',
    like_count INT DEFAULT 0 COMMENT 'Synced from daily aggregates',

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_slug (slug),
    INDEX idx_status_published (status, published_at),
    INDEX idx_universe (universe_tag),
    INDEX idx_author (author_id),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog images table (for TipTap image uploads within content)
CREATE TABLE blog_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    width INT,
    height INT,
    file_size INT COMMENT 'Size in bytes',
    mime_type VARCHAR(50),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_post (post_id),
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social media post tracking
CREATE TABLE blog_social_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blog_post_id INT NOT NULL,
    platform ENUM('instagram', 'twitter', 'facebook', 'discord') NOT NULL,
    platform_post_id VARCHAR(255) COMMENT 'ID from the social platform',
    post_url VARCHAR(500),
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    error_message TEXT,
    posted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_blog_post (blog_post_id),
    INDEX idx_platform (platform),
    INDEX idx_status (status),
    FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_platform (blog_post_id, platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog comments (REUSE EXISTING STORYTIME COMMENT SYSTEM)
-- Add blog post support to existing comments table via ALTER or create unified table:
CREATE TABLE blog_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    content TEXT NOT NULL,
    content_hash VARCHAR(64) COMMENT 'SHA256 hash for duplicate detection',
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    user_agent_hash VARCHAR(64),
    is_bot BOOLEAN DEFAULT FALSE COMMENT 'Detected bot/crawler',
    is_flagged BOOLEAN DEFAULT FALSE COMMENT 'User-flagged for review',
    status ENUM('pending', 'approved', 'spam', 'trash') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_post (post_id),
    INDEX idx_status (status),
    INDEX idx_parent (parent_id),
    INDEX idx_content_hash (content_hash),
    INDEX idx_ip (ip_address),
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog categories (for filtering)
CREATE TABLE blog_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog analytics (raw events - retained for 90 days)
CREATE TABLE blog_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    event_type ENUM('view', 'like', 'share', 'comment') NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    referer VARCHAR(500),
    country_code VARCHAR(2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_post_event (post_id, event_type),
    INDEX idx_created (created_at),
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog analytics daily aggregates (permanent storage)
CREATE TABLE blog_analytics_daily (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    date DATE NOT NULL,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    shares INT DEFAULT 0,
    comments INT DEFAULT 0,
    unique_visitors INT DEFAULT 0 COMMENT 'Count of unique IPs',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_post_date (post_id, date),
    INDEX idx_date (date),
    INDEX idx_post (post_id),
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social media API credentials (encrypted storage)
CREATE TABLE social_api_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform ENUM('instagram', 'twitter', 'facebook', 'discord', 'threads', 'bluesky', 'youtube') NOT NULL UNIQUE,
    access_token TEXT COMMENT 'Encrypted token',
    refresh_token TEXT COMMENT 'Encrypted refresh token (Phase 3+)',
    token_expires_at DATETIME,
    config JSON COMMENT 'Platform-specific configuration (webhooks, app IDs, etc.)',
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crosspost settings (replaces boolean fields in blog_posts)
CREATE TABLE blog_crosspost_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blog_post_id INT NOT NULL,
    platform ENUM('instagram', 'twitter', 'facebook', 'discord', 'threads', 'bluesky', 'youtube') NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    custom_message TEXT COMMENT 'Platform-specific message override',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_post_platform (blog_post_id, platform),
    INDEX idx_post (blog_post_id),
    INDEX idx_enabled (enabled),
    FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Post revision history
CREATE TABLE blog_revisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    content_json LONGTEXT NOT NULL,
    content_html LONGTEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    edited_by INT NOT NULL,
    change_summary VARCHAR(255) COMMENT 'Brief description of changes',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_post (post_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Phase 1: Frontend with Filler Content
**Goal:** Create a fully functional blog frontend that matches the UniversePortalHomepage theme with static/mock data

**SIMPLIFIED SCOPE:**
- Focus on core reading experience
- No analytics dashboard (Phase 2)
- No social integration (Phase 3)
- Basic comment display only (moderation in Phase 2)

### 1.1 Blog Index Page Component
**File:** `src/components/BlogIndex.tsx`

**Features:**
- Dynamic background (light/dark theme aware) using `getRandomBackground()`
- Shared navbar with brand color integration
- Hero section with blog-specific tagline
- Search bar with MySQL-ready placeholder
- Filter buttons (All Posts, by Universe, by Category)
- Post grid/list with cards matching the design system
- Sidebar with:
  - Tag cloud
  - Popular posts
  - Newsletter signup
  - Social crosspost info widget
- Pagination component
- Footer with social icons using `SocialIcons` component

**Theme Integration:**
- Uses `useTheme()` context for light/dark mode
- Dynamic brand colors from homepage settings
- Card backgrounds: `bg-neutral-900/80` (dark) / `bg-white/40` (light)
- Glassmorphism with `backdrop-blur-xl`
- Consistent border styles: `border-white/10` (dark) / `border-gray-200` (light)

**Data Structure (Mock):**
```typescript
interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  cover_image?: string
  tags: string[]
  categories: string[]
  universe_tag?: string
  published_at: string
  reading_time: number
  view_count: number
  like_count: number
  author_name: string
  author_image?: string
}
```

**Files to Create:**
- `src/components/BlogIndex.tsx` - Main blog listing
- `src/components/BlogPost.tsx` - Individual post view
- `src/components/blog/BlogCard.tsx` - Post card component
- `src/components/blog/BlogHero.tsx` - Hero section
- `src/components/blog/BlogSidebar.tsx` - Sidebar widgets
- `src/components/blog/BlogSearch.tsx` - Search component
- `src/components/blog/TagCloud.tsx` - Tag cloud widget

### 1.2 Individual Blog Post Page
**File:** `src/components/BlogPost.tsx`

**Features:**
- Full-width hero with cover image
- Breadcrumb navigation
- Post metadata (date, reading time, tags, universe)
- Rich content area (styled for TipTap output)
- Image galleries within content
- Social share buttons (Instagram, Twitter, Facebook, Discord)
- Like/engagement counter
- Comment section (following existing comment pattern)
- Related posts section
- Newsletter CTA at bottom
- Author bio card

**Content Styling:**
- Typography: Match existing story reader typography
- Code blocks with syntax highlighting
- Blockquotes styled like chapter content
- Image captions
- Video embeds support
- Drop caps option (like stories)

### 1.3 Router Integration
**File:** `src/app/router.tsx`

Add routes:
```typescript
{
  path: '/blog',
  element: <BlogIndex />
},
{
  path: '/blog/:slug',
  element: <BlogPost />
},
{
  path: '/blog/category/:category',
  element: <BlogIndex />
},
{
  path: '/blog/tag/:tag',
  element: <BlogIndex />
},
{
  path: '/blog/universe/:universe',
  element: <BlogIndex />
}
```

### 1.4 Navigation Updates
Update navbar in:
- `UniversePortalHomepage.tsx` - Add "Blog" link
- Main site navigation components

### 1.5 Mock Data
**File:** `src/data/blogMockData.ts`

Create 10-15 realistic blog posts with:
- Dev logs
- Worldbuilding notes
- Writing process posts
- Chapter announcements
- LitRPG system breakdowns
- Cover various universes (Destiny, Sinbad, Knights Errant, Warlock)

---

## Phase 2: Backend (Create, Edit, Delete) + Admin Dashboard
**Goal:** Full admin interface for blog management with MySQL integration and image uploads

### 2.1 Database Migration
**File:** `api/migrations/2025-12-14-blog-system.sql`

> ✅ **COMPLETED** - Migration file created on 2025-12-14

Execute the schema above + seed data:
- ✅ Create default blog categories (8 categories seeded)
- ✅ Create blog-assets gallery for image integration
- ✅ Set up indexes for search performance
- ✅ Triggers for automatic comment counting
- [ ] Insert sample post for testing (manual step after migration runs)

### 2.2 API Endpoints

#### 2.2.1 Blog Post CRUD
**Pattern:** Follow `api/stories/` structure

**Files to Create:**

1. **`api/blog/list.php`** - GET
   - Pagination support (`?page=1&limit=10`)
   - Filtering (`?status=published&universe=destiny&tag=worldbuilding`)
   - Search (`?q=litrpg system`)
   - Sorting (`?sort=published_at&order=DESC`)
   - Include analytics (view count, like count)
   - Rate limit: 60 requests/minute

2. **`api/blog/get.php?slug=post-slug`** - GET
   - Fetch single post by slug
   - Include related posts
   - Track view analytics
   - Rate limit: 100 requests/minute

3. **`api/blog/create.php`** - POST (AUTH REQUIRED)
   - Validate title, slug, content
   - Auto-generate slug if not provided
   - Calculate reading time from content
   - Upload and link cover images
   - Rate limit: 10 requests/minute

   Request body:
   ```json
   {
     "title": "string",
     "slug": "string",
     "excerpt": "string",
     "content_json": "string (TipTap JSON)",
     "content_html": "string (TipTap HTML - will be sanitized)",
     "cover_image": "string",
     "instagram_image": "string (REQUIRED for Instagram crosspost)",
     "twitter_image": "string (REQUIRED for Twitter crosspost)",
     "facebook_image": "string (REQUIRED for Facebook crosspost)",
     "tags": ["tag1", "tag2"],
     "categories": ["category1"],
     "universe_tag": "string",
     "status": "draft|published|scheduled",
     "scheduled_at": "datetime",
     "og_title": "string",
     "og_description": "string",
     "meta_description": "string",
     "primary_keywords": "string",
     "longtail_keywords": "string"
   }
   ```

   **CRITICAL: Dual Storage**
   ```php
   // Save both JSON and HTML
   $contentJson = $input['content_json']; // TipTap JSON
   $contentHtml = sanitizeHtml($input['content_html']); // Sanitized HTML

   // Store both in database
   $stmt->execute([
       // ...
       'content_json' => $contentJson,
       'content_html' => $contentHtml,
       // ...
   ]);
   ```

4. **`api/blog/update.php`** - PUT (AUTH REQUIRED)
   - Same validation as create
   - Update `updated_at` timestamp
   - Invalidate cache if published
   - Rate limit: 10 requests/minute

5. **`api/blog/delete.php?id=123`** - DELETE (AUTH REQUIRED)
   - Soft delete option (status='trash')
   - Cascade delete comments and analytics
   - Delete associated images from filesystem
   - Rate limit: 5 requests/minute

#### 2.2.2 Image Upload
**Files to Create:**

1. **`api/blog/upload-image.php`** - POST (AUTH REQUIRED)
   - Multi-purpose image upload
   - Types: `cover`, `instagram`, `twitter`, `facebook`, `content`
   - **NO AUTOMATIC RESIZING** - User must upload correct dimensions:
     - Cover: 1200x630 (standard OG size)
     - Instagram: 1080x1080 or 1080x1350
     - Twitter: 1200x675
     - Facebook: 1200x630
     - Content: Max 1920px wide (reject if larger)
   - **Validation only:**
     - Check dimensions match requirements
     - Reject if incorrect size
     - Show user error with required dimensions
   - Generate WebP versions for performance
   - Rate limit: 20 uploads/minute

   **Why no auto-resize:**
   - Prevents server load on shared hosting
   - User has full control over image quality
   - Avoids unexpected crops/distortions
   - Simpler, more reliable code

   Request: `multipart/form-data`
   ```
   image: File
   type: "cover" | "instagram" | "twitter" | "facebook" | "content"
   post_id: number (optional, for tracking)
   alt_text: string (optional)
   ```

   Response:
   ```json
   {
     "success": true,
     "url": "/uploads/blog/2025/12/image-name.jpg",
     "url_webp": "/uploads/blog/2025/12/image-name.webp",
     "width": 1200,
     "height": 630,
     "file_size": 245678
   }
   ```

2. **`api/blog/images/list.php?post_id=123`** - GET
   - List all images for a post
   - Used for image gallery management

3. **`api/blog/images/delete.php?id=456`** - DELETE (AUTH REQUIRED)
   - Delete image from filesystem and DB
   - Check if image is used in content before deleting

#### 2.2.3 Search & Filter
**Files to Create:**

1. **`api/blog/search.php?q=keyword`** - GET
   - Full-text search on title, excerpt, content, tags
   - MySQL FULLTEXT index or LIKE queries
   - Return ranked results
   - Rate limit: 30 requests/minute

2. **`api/blog/tags/list.php`** - GET
   - Get all unique tags with post counts
   - Used for tag cloud

3. **`api/blog/categories/list.php`** - GET
   - Get all categories with post counts

#### 2.2.4 Analytics
**Files to Create:**

1. **`api/blog/analytics/track.php`** - POST
   - Track views, likes, shares
   - IP-based deduplication (24-hour window)
   - Store referer, user agent
   - Rate limit: 100 requests/minute

2. **`api/blog/analytics/stats.php?post_id=123`** - GET
   - Return aggregated stats for a post
   - Used in admin dashboard

#### 2.2.5 Comments
**Files to Create:**

1. **`api/blog/comments/list.php?post_id=123`** - GET
   - Paginated, threaded comments
   - Only approved comments for public
   - All statuses for admin

2. **`api/blog/comments/create.php`** - POST
   - Create new comment (with moderation)
   - Spam detection integration
   - Rate limit: 5 comments/10 minutes per IP

3. **`api/blog/comments/moderate.php`** - POST (AUTH REQUIRED)
   - Approve/reject/spam/trash comments
   - Follows existing moderation pattern

### 2.3 Admin Dashboard Component
**File:** `src/components/admin/BlogManager.tsx`

**Pattern:** Follow `StoryManager.tsx` structure

**Features:**

#### Dashboard View
- Stats cards:
  - Total posts (draft, published, scheduled)
  - Total views (last 30 days)
  - Total comments (pending moderation count)
  - Top performing post
- Recent posts table with quick actions
- Scheduling calendar view
- Comment moderation queue

#### Post Editor
**TipTap Integration:**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-character-count
```

**Features:**
- Rich text editor with TipTap
  - Headings (H2-H6)
  - Bold, italic, underline, strikethrough
  - Bullet and numbered lists
  - Blockquotes
  - Code blocks
  - Links
  - Images (drag-and-drop upload)
  - Horizontal rules
  - Character count
  - Word count
  - Reading time estimate
- Live preview toggle
- Auto-save draft (every 30 seconds)
- Revision history
- SEO preview card (shows OG preview)
- Social media image previews

#### Post Settings Sidebar
**Tabs:**
1. **General**
   - Status (Draft/Published/Scheduled)
   - Publish date/time
   - Slug (editable with validation)
   - Excerpt (auto-generated or custom)
   - Reading time (auto-calculated)

2. **SEO**
   - Meta description
   - Primary keywords
   - Longtail keywords
   - OG title override
   - OG description override
   - Preview card

3. **Images**
   - Cover image upload/selector
   - Instagram image upload (1080x1080)
   - Twitter image upload (1200x675)
   - Facebook image upload (1200x630)
   - Alt text fields
   - Image previews
   - Crop/resize tools

4. **Categorization**
   - Tags (multi-select with autocomplete)
   - Categories (multi-select)
   - Universe tag (Destiny, Sinbad, etc.)

5. **Social Media** (Phase 3)
   - Crosspost checkboxes with validation:
     - [ ] Instagram (requires instagram_image)
     - [ ] Twitter/X (requires twitter_image)
     - [ ] Facebook (requires facebook_image)
     - [ ] Discord (uses cover_image)
   - Custom social messages per platform
   - **Disable checkbox if required image not uploaded**
   - Schedule social posts
   - View crosspost status

6. **Analytics**
   - View count
   - Like count
   - Share count
   - Top referers
   - Geographic breakdown
   - Comments count

#### Image Library Modal
- Grid view of all uploaded blog images
- Filter by post, date, size
- Bulk delete
- Search by alt text
- Click to insert into editor

#### Comments Management
- List view with filtering (pending/approved/spam)
- Quick approve/reject actions
- Reply to comments
- Bulk moderation

**File Structure:**
```
src/components/admin/
  BlogManager.tsx           # Main component
  blog/
    BlogEditor.tsx          # TipTap editor wrapper
    BlogPostList.tsx        # Table of posts
    BlogSettingsSidebar.tsx # Settings panel
    BlogImageManager.tsx    # Image library
    BlogCommentModerator.tsx # Comment moderation
    BlogAnalytics.tsx       # Analytics dashboard
    BlogScheduler.tsx       # Calendar view
```

### 2.4 Admin Integration
**File:** `src/components/admin/UnifiedAdminDashboard.tsx`

Add "Blog" tab to the existing admin dashboard:
```typescript
const tabs = [
  { id: 'stories', label: 'Stories', icon: '📚' },
  { id: 'blog', label: 'Blog', icon: '✍️' },
  { id: 'galleries', label: 'Galleries', icon: '🖼️' },
  // ... existing tabs
]
```

### 2.5 Security & Validation

#### Authentication
- All write operations require `requireAuth()`
- All endpoints use `require_method()` for HTTP verb validation
- CSRF protection via session tokens

#### Input Validation
- Sanitize all HTML content (allow safe tags only)
- Validate slug format (lowercase, hyphens, alphanumeric)
- Check image MIME types and file sizes
- XSS prevention on comments
- SQL injection prevention (PDO prepared statements)

#### Rate Limiting
Follow existing `requireRateLimit()` pattern:
```php
// In api/blog/create.php
requireRateLimit('blog:create', 10, 60, $_SESSION['user_id'], true);
```

#### Image Upload Security
- Validate MIME types (JPEG, PNG, WebP only)
- Check magic bytes (not just extension)
- Maximum file size: 10MB
- Sanitize file names
- Store outside web root or use .htaccess protection
- Generate random file names to prevent overwriting

---

## Phase 3: Social Media API Integration (SIMPLIFIED)
**Goal:** Basic crossposting to Instagram, Twitter/X, Facebook, and Discord

**DEFERRED TO PHASE 3+ (Not in initial launch):**
- ❌ OAuth token refresh automation
- ❌ Engagement sync (likes/shares from platforms)
- ❌ Advanced analytics dashboard
- ❌ Social listening/monitoring
- ❌ Unified comment threads

**Phase 3 CORE Features:**
- ✅ Manual OAuth setup (one-time per platform)
- ✅ Basic posting with user-uploaded images
- ✅ Success/failure tracking
- ✅ Manual retry for failed posts
- ✅ Webhook-only for Discord (no OAuth needed)

### 3.1 Social Media API Setup

#### 3.1.1 Platform Requirements

**Instagram (via Facebook Graph API):**
- Facebook Developer App
- Instagram Business Account
- Access tokens with permissions:
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_read_engagement`
- Limitations:
  - Single image posts only (1080x1080 or 1080x1350)
  - Max 25 posts per day
  - No link in caption (link in bio only)
  - Requires approval for production

**Twitter/X API v2:**
- Twitter Developer Account (Basic tier minimum)
- OAuth 2.0 tokens
- Permissions:
  - `tweet.read`
  - `tweet.write`
  - `users.read`
- Limitations:
  - 280 character limit
  - Up to 4 images per tweet
  - Rate limit: 50 tweets per 24 hours (Basic tier)

**Facebook (Graph API):**
- Facebook Page (not personal profile)
- Page access token
- Permissions:
  - `pages_manage_posts`
  - `pages_read_engagement`
- Limitations:
  - No link suppression issues
  - Good image support (1200x630 recommended)

**Discord (Webhooks):**
- Create webhook in Discord server
- No OAuth required (just webhook URL)
- Limitations:
  - 2000 character limit
  - Embed support for rich formatting
  - Rate limit: 30 requests/minute per webhook

#### 3.1.2 Credential Storage (SIMPLIFIED)
**File:** `api/social/credentials/update.php` (AUTH REQUIRED)

**Phase 3 Approach: Manual token entry**
- Admin manually obtains tokens from platform developer consoles
- Paste tokens into admin UI
- Tokens encrypted at rest
- **No automatic refresh in Phase 3** - manual renewal when expired

Store encrypted tokens in `social_api_credentials` table:
```php
// Encryption helper (same as existing system)
function encryptToken($token) {
    $key = hash('sha256', ENCRYPTION_KEY); // From config.php
    $iv = openssl_random_pseudo_bytes(16);
    $encrypted = openssl_encrypt($token, 'AES-256-CBC', $key, 0, $iv);
    return base64_encode($iv . $encrypted);
}

function decryptToken($encrypted) {
    $key = hash('sha256', ENCRYPTION_KEY);
    $data = base64_decode($encrypted);
    $iv = substr($data, 0, 16);
    $encrypted = substr($data, 16);
    return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
}
```

**Phase 4+: Full OAuth flows**
- Automated token refresh
- OAuth callback handlers
- PKCE flow for security

**Add to `api/config.php`:**
```php
// Social Media API Keys (encrypted in DB)
define('ENCRYPTION_KEY', getenv('ENCRYPTION_KEY') ?: 'your-secret-key-here');

// OAuth redirect URIs
define('INSTAGRAM_REDIRECT_URI', 'https://yourdomain.com/api/social/oauth/instagram');
define('TWITTER_REDIRECT_URI', 'https://yourdomain.com/api/social/oauth/twitter');
define('FACEBOOK_REDIRECT_URI', 'https://yourdomain.com/api/social/oauth/facebook');
```

### 3.2 OAuth Flow Implementation (DEFERRED TO PHASE 4+)

**Phase 3 Alternative: Manual Token Entry**

Instead of full OAuth flows, use simpler approach:

1. Admin generates tokens manually from:
   - Instagram: Meta Business Suite
   - Twitter: Developer Portal
   - Facebook: Graph API Explorer
   - Discord: Webhook URL from server settings

2. Admin UI provides:
   - Text input for token
   - "Test Connection" button
   - Expiry date reminder
   - Link to platform developer console

3. Benefits:
   - Much simpler implementation
   - No OAuth callback complexity
   - No PKCE/state management
   - Works immediately

4. Drawbacks:
   - Manual token renewal
   - User needs developer accounts
   - Less user-friendly

**For Phase 4+:**
- Full OAuth flows with PKCE
- Automatic token refresh
- Better UX for non-technical users

### 3.3 Posting Logic

#### 3.3.1 Main Posting Orchestrator
**File:** `api/social/post.php` (AUTH REQUIRED)

**Trigger:** Called when blog post is published or scheduled

**Flow:**
1. Check which platforms are enabled (checkboxes)
2. For each enabled platform:
   - Validate credentials (check token expiry)
   - Prepare platform-specific content
   - Upload image to platform
   - Post content
   - Log result in `blog_social_posts`
3. Return summary of successes/failures

**Request:**
```json
{
  "blog_post_id": 123,
  "platforms": ["instagram", "twitter", "facebook", "discord"],
  "custom_messages": {
    "instagram": "Custom caption for IG",
    "twitter": "Custom tweet text",
    "facebook": "Custom FB post",
    "discord": "Custom Discord message"
  },
  "schedule_for": "2025-12-20 10:00:00" // Optional
}
```

#### 3.3.2 Platform-Specific Posting

**File:** `api/social/platforms/instagram.php`

```php
function postToInstagram($postData, $credentials) {
    $accessToken = decryptToken($credentials['access_token']);
    $config = json_decode($credentials['config'], true);
    $igUserId = $config['instagram_user_id'];
    $pageId = $config['facebook_page_id'];

    // Step 1: Create media container
    $imageUrl = $postData['instagram_image']; // Must be publicly accessible
    $caption = $postData['caption'];

    $containerUrl = "https://graph.facebook.com/v18.0/{$igUserId}/media";
    $containerParams = [
        'image_url' => $imageUrl,
        'caption' => $caption,
        'access_token' => $accessToken
    ];

    $containerResponse = file_get_contents($containerUrl . '?' . http_build_query($containerParams));
    $container = json_decode($containerResponse, true);

    if (!isset($container['id'])) {
        throw new Exception('Failed to create Instagram media container');
    }

    // Step 2: Publish container
    $publishUrl = "https://graph.facebook.com/v18.0/{$igUserId}/media_publish";
    $publishParams = [
        'creation_id' => $container['id'],
        'access_token' => $accessToken
    ];

    $publishResponse = file_get_contents($publishUrl . '?' . http_build_query($publishParams));
    $result = json_decode($publishResponse, true);

    if (!isset($result['id'])) {
        throw new Exception('Failed to publish Instagram post');
    }

    return [
        'platform_post_id' => $result['id'],
        'post_url' => "https://www.instagram.com/p/{$result['id']}"
    ];
}
```

**File:** `api/social/platforms/twitter.php`

```php
function postToTwitter($postData, $credentials) {
    $accessToken = decryptToken($credentials['access_token']);

    // Step 1: Upload image
    $imageData = file_get_contents($postData['twitter_image']);
    $imageBase64 = base64_encode($imageData);

    $uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
    $uploadHeaders = [
        "Authorization: Bearer {$accessToken}",
        "Content-Type: multipart/form-data"
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $uploadUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ['media_data' => $imageBase64]);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $uploadHeaders);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $uploadResponse = curl_exec($ch);
    curl_close($ch);

    $mediaData = json_decode($uploadResponse, true);
    $mediaId = $mediaData['media_id_string'];

    // Step 2: Create tweet with media
    $tweetUrl = 'https://api.twitter.com/2/tweets';
    $tweetBody = json_encode([
        'text' => $postData['text'],
        'media' => ['media_ids' => [$mediaId]]
    ]);

    $tweetHeaders = [
        "Authorization: Bearer {$accessToken}",
        "Content-Type: application/json"
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $tweetUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $tweetBody);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $tweetHeaders);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $tweetResponse = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($tweetResponse, true);

    return [
        'platform_post_id' => $result['data']['id'],
        'post_url' => "https://twitter.com/user/status/{$result['data']['id']}"
    ];
}
```

**File:** `api/social/platforms/facebook.php`

```php
function postToFacebook($postData, $credentials) {
    $accessToken = decryptToken($credentials['access_token']);
    $config = json_decode($credentials['config'], true);
    $pageId = $config['page_id'];

    // Upload photo and publish in one request
    $url = "https://graph.facebook.com/v18.0/{$pageId}/photos";
    $params = [
        'url' => $postData['facebook_image'], // Publicly accessible URL
        'caption' => $postData['message'],
        'access_token' => $accessToken,
        'published' => true
    ];

    $response = file_get_contents($url . '?' . http_build_query($params));
    $result = json_decode($response, true);

    if (!isset($result['id'])) {
        throw new Exception('Failed to post to Facebook');
    }

    return [
        'platform_post_id' => $result['id'],
        'post_url' => "https://www.facebook.com/{$pageId}/posts/{$result['id']}"
    ];
}
```

**File:** `api/social/platforms/discord.php`

```php
function postToDiscord($postData, $credentials) {
    $config = json_decode($credentials['config'], true);
    $webhookUrl = $config['webhook_url'];

    // Discord embed format
    $embed = [
        'embeds' => [[
            'title' => $postData['title'],
            'description' => $postData['excerpt'],
            'url' => $postData['post_url'],
            'color' => 0x10b981, // Brand color
            'image' => ['url' => $postData['cover_image']],
            'footer' => ['text' => 'New blog post'],
            'timestamp' => date('c')
        ]]
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $webhookUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($embed));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 204) {
        throw new Exception('Failed to post to Discord');
    }

    return [
        'platform_post_id' => null,
        'post_url' => null // Discord webhooks don't return post URLs
    ];
}
```

### 3.4 Content Preparation

#### 3.4.1 Character Limits & Formatting
**File:** `api/social/helpers/content-formatter.php`

```php
function formatForInstagram($post) {
    // Instagram allows ~2200 characters, but first 125 show before "more"
    $caption = $post['title'] . "\n\n" . $post['excerpt'];

    // Add hashtags
    $tags = array_slice($post['tags'], 0, 30); // Max 30 hashtags
    $hashtags = "\n\n" . implode(' ', array_map(fn($t) => '#' . str_replace(' ', '', $t), $tags));

    // Add link in bio mention
    $caption .= "\n\n🔗 Link in bio to read more";

    return substr($caption . $hashtags, 0, 2200);
}

function formatForTwitter($post) {
    // Twitter: 280 chars max
    $title = $post['title'];
    $url = $post['url'];
    $urlLength = 23; // Twitter auto-shortens to t.co (23 chars)

    $maxLength = 280 - $urlLength - 3; // -3 for spacing and newlines

    if (strlen($title) <= $maxLength) {
        return $title . "\n\n" . $url;
    }

    // Truncate title
    $truncated = substr($title, 0, $maxLength - 3) . '...';
    return $truncated . "\n\n" . $url;
}

function formatForFacebook($post) {
    // Facebook: 63,206 character limit (very generous)
    // Link previews work automatically
    return $post['title'] . "\n\n" . $post['excerpt'] . "\n\n" . $post['url'];
}

function formatForDiscord($post) {
    // Discord: 2000 character limit
    // Use embeds for rich formatting (handled in platform file)
    return substr($post['content'], 0, 2000);
}
```

#### 3.4.2 Image URL Requirements
All social platforms require **publicly accessible HTTPS URLs**.

**Options:**
1. **Direct server URLs:** `https://yourdomain.com/uploads/blog/image.jpg`
   - Ensure images are in public directory
   - Set proper CORS headers if needed

2. **CDN URLs:** Use Cloudflare, Imgix, or similar
   - Better performance
   - Geographic distribution

3. **Temporary signed URLs:** For draft posts
   - Generate time-limited signed URLs
   - Prevents indexing of unpublished content

### 3.5 Scheduling System

#### 3.5.1 Scheduled Posts Table
Already included in schema: `blog_posts.scheduled_at`

#### 3.5.2 Cron Job
**File:** `api/cron/publish-scheduled-blog-posts.php`

Run every 5 minutes via cron:
```bash
*/5 * * * * php /path/to/api/cron/publish-scheduled-blog-posts.php
```

**Logic:**
```php
<?php
require_once '../bootstrap.php';

// Find posts scheduled for publication
$stmt = $pdo->prepare("
    SELECT * FROM blog_posts
    WHERE status = 'scheduled'
    AND scheduled_at <= NOW()
");
$stmt->execute();
$posts = $stmt->fetchAll();

foreach ($posts as $post) {
    try {
        // Update status to published
        $update = $pdo->prepare("
            UPDATE blog_posts
            SET status = 'published', published_at = NOW()
            WHERE id = ?
        ");
        $update->execute([$post['id']]);

        // Trigger social media crossposting
        $platforms = [];
        if ($post['crosspost_instagram']) $platforms[] = 'instagram';
        if ($post['crosspost_twitter']) $platforms[] = 'twitter';
        if ($post['crosspost_facebook']) $platforms[] = 'facebook';
        if ($post['crosspost_discord']) $platforms[] = 'discord';

        if (!empty($platforms)) {
            // Call posting orchestrator
            include_once '../social/post.php';
            crosspostBlogPost($post['id'], $platforms);
        }

        error_log("Published scheduled post: {$post['title']} (ID: {$post['id']})");
    } catch (Exception $e) {
        error_log("Failed to publish post {$post['id']}: " . $e->getMessage());
    }
}
?>
```

### 3.6 Admin UI for Social Integration

#### 3.6.1 Social Credentials Manager
**File:** `src/components/admin/SocialCredentialsManager.tsx`

**Features:**
- Connect/disconnect buttons for each platform
- OAuth flow initiation
- Token status (active, expired, error)
- Last used timestamp
- Test connection button
- Webhook URL input for Discord

**UI Example:**
```
┌─────────────────────────────────────────────┐
│ Social Media Integrations                   │
├─────────────────────────────────────────────┤
│                                             │
│ Instagram                                   │
│ ├─ Status: ✅ Connected                     │
│ ├─ Last used: 2 hours ago                  │
│ └─ [Disconnect] [Test Connection]          │
│                                             │
│ Twitter/X                                   │
│ ├─ Status: ❌ Not connected                 │
│ └─ [Connect with Twitter]                  │
│                                             │
│ Facebook                                    │
│ ├─ Status: ⚠️ Token expires in 5 days      │
│ ├─ Page: My Author Page                   │
│ └─ [Reconnect] [Change Page]               │
│                                             │
│ Discord                                     │
│ ├─ Status: ✅ Connected                     │
│ ├─ Webhook URL: https://discord.com/...   │
│ └─ [Edit Webhook] [Test Webhook]           │
└─────────────────────────────────────────────┘
```

#### 3.6.2 Crosspost Status Widget
**In `BlogEditor.tsx` sidebar:**

```
┌─────────────────────────────────────────────┐
│ Social Media Crossposting                   │
├─────────────────────────────────────────────┤
│ ☑ Instagram                                 │
│   Custom caption: [__________________]      │
│   Status: ✅ Posted (View)                  │
│                                             │
│ ☑ Twitter/X                                 │
│   Custom tweet: [__________________]        │
│   Status: ⏳ Scheduled for 10:00 AM         │
│                                             │
│ ☐ Facebook                                  │
│                                             │
│ ☑ Discord                                   │
│   Status: ❌ Failed (Retry)                 │
│   Error: Webhook URL not found             │
└─────────────────────────────────────────────┘
```

### 3.7 Error Handling & Retry Logic

#### 3.7.1 Retry Queue
**File:** `api/social/retry-failed.php`

Cron job runs hourly:
```sql
SELECT * FROM blog_social_posts
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL 24 HOUR
ORDER BY created_at ASC
LIMIT 50
```

Retry logic:
- Max 3 retry attempts
- Exponential backoff (1 hour, 4 hours, 12 hours)
- Log error details for debugging

#### 3.7.2 Error Notifications
Send email to admin on persistent failures:
```php
if ($retryCount >= 3) {
    mail(
        ADMIN_EMAIL,
        "Social Media Posting Failed: {$post['title']}",
        "Platform: {$platform}\nError: {$errorMessage}\n\nPost ID: {$postId}"
    );
}
```

### 3.8 Analytics & Tracking (DEFERRED TO PHASE 4+)

**Phase 3: Manual checking only**
- No automated engagement sync
- Admin can manually view posts on platforms
- Track success/failure of posting only

**Phase 4+: Engagement Sync**
- Cron job fetches metrics from platform APIs
- Display engagement in admin dashboard
- Aggregate cross-platform performance

---

## Maintenance Cron Jobs

### Daily Analytics Rollup
**File:** `api/cron/rollup-blog-analytics.php`

Run nightly at 2 AM:
```bash
0 2 * * * php /path/to/api/cron/rollup-blog-analytics.php
```

**Purpose:**
```php
<?php
// Aggregate yesterday's raw events into daily table
$yesterday = date('Y-m-d', strtotime('-1 day'));

$stmt = $pdo->prepare("
    INSERT INTO blog_analytics_daily (post_id, date, views, likes, shares, comments, unique_visitors)
    SELECT
        post_id,
        DATE(created_at) as date,
        SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as views,
        SUM(CASE WHEN event_type = 'like' THEN 1 ELSE 0 END) as likes,
        SUM(CASE WHEN event_type = 'share' THEN 1 ELSE 0 END) as shares,
        SUM(CASE WHEN event_type = 'comment' THEN 1 ELSE 0 END) as comments,
        COUNT(DISTINCT ip_address) as unique_visitors
    FROM blog_analytics
    WHERE DATE(created_at) = ?
    GROUP BY post_id, DATE(created_at)
    ON DUPLICATE KEY UPDATE
        views = VALUES(views),
        likes = VALUES(likes),
        shares = VALUES(shares),
        comments = VALUES(comments),
        unique_visitors = VALUES(unique_visitors)
");
$stmt->execute([$yesterday]);

// Update post view counts
$pdo->exec("
    UPDATE blog_posts bp
    JOIN (
        SELECT post_id, SUM(views) as total_views
        FROM blog_analytics_daily
        GROUP BY post_id
    ) ad ON bp.id = ad.post_id
    SET bp.view_count = ad.total_views
");

// Delete raw analytics older than 90 days
$pdo->exec("DELETE FROM blog_analytics WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)");
?>
```

### Sitemap Generation
**File:** `api/cron/generate-sitemaps.php`

Run daily at 3 AM:
```bash
0 3 * * * php /path/to/api/cron/generate-sitemaps.php
```

**Generate:**
1. `sitemap-blog.xml` - All published blog posts
2. `sitemap-blog-tags.xml` - All tag pages
3. `sitemap-blog-categories.xml` - All category pages
4. Update main `sitemap.xml` index

**Example:**
```php
<?php
$posts = $pdo->query("
    SELECT slug, updated_at
    FROM blog_posts
    WHERE status = 'published'
    ORDER BY updated_at DESC
")->fetchAll();

$xml = '<?xml version="1.0" encoding="UTF-8"?>';
$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

foreach ($posts as $post) {
    $xml .= '<url>';
    $xml .= '<loc>https://yourdomain.com/blog/' . $post['slug'] . '</loc>';
    $xml .= '<lastmod>' . date('Y-m-d', strtotime($post['updated_at'])) . '</lastmod>';
    $xml .= '<changefreq>monthly</changefreq>';
    $xml .= '<priority>0.8</priority>';
    $xml .= '</url>';
}

$xml .= '</urlset>';

file_put_contents(__DIR__ . '/../../public/sitemap-blog.xml', $xml);
?>
```

## Phase 4 (Bonus): Advanced Features

### 4.1 RSS Feed (INCLUDE IN PHASE 2)
**File:** `api/blog/rss.xml.php`
- Generate RSS 2.0 feed
- Use `content_html` field for content
- Include featured image
- Auto-discovery meta tag in HTML head

**Example:**
```php
<?php
header('Content-Type: application/rss+xml; charset=utf-8');

$posts = $pdo->query("
    SELECT title, slug, excerpt, content_html, cover_image, published_at
    FROM blog_posts
    WHERE status = 'published'
    ORDER BY published_at DESC
    LIMIT 20
")->fetchAll();

echo '<?xml version="1.0" encoding="UTF-8"?>';
echo '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">';
echo '<channel>';
echo '<title>Your Blog Title</title>';
echo '<link>https://yourdomain.com/blog</link>';
echo '<description>Blog description</description>';
echo '<atom:link href="https://yourdomain.com/api/blog/rss.xml.php" rel="self" type="application/rss+xml" />';

foreach ($posts as $post) {
    echo '<item>';
    echo '<title>' . htmlspecialchars($post['title']) . '</title>';
    echo '<link>https://yourdomain.com/blog/' . $post['slug'] . '</link>';
    echo '<description>' . htmlspecialchars($post['excerpt']) . '</description>';
    echo '<content:encoded><![CDATA[' . $post['content_html'] . ']]></content:encoded>';
    if ($post['cover_image']) {
        echo '<enclosure url="' . htmlspecialchars($post['cover_image']) . '" type="image/jpeg" />';
    }
    echo '<pubDate>' . date('r', strtotime($post['published_at'])) . '</pubDate>';
    echo '<guid>https://yourdomain.com/blog/' . $post['slug'] . '</guid>';
    echo '</item>';
}

echo '</channel>';
echo '</rss>';
?>
```

### 4.2 Email Newsletters
**Integration with existing email system:**
- "Send as newsletter" button in post editor
- Reuse email templates from `api/email/`
- Segment by tags/categories

### 4.3 Related Posts Algorithm
**File:** `api/blog/related.php?post_id=123`
- Match by tags, categories, universe
- Exclude current post
- Limit to 3-5 posts

### 4.4 Content Snippets (Shortcodes)
Embed story chapters, character cards, galleries in blog posts:
```html
[story-chapter id="123"]
[character-card name="Darron"]
[gallery id="45"]
```

### 4.5 Multi-Author Support (Already in Schema)
- `author_id` foreign key exists in schema
- Phase 1: Single author only
- Phase 4+: Multiple authors, author profile pages, co-authors

### 4.6 OAuth Automation (Phase 4+)
- Full OAuth flows for all platforms
- Automatic token refresh
- PKCE security
- User-friendly connection UI

### 4.7 Engagement Sync (Phase 4+)
- Sync likes/shares from platforms
- Display cross-platform analytics
- Track referral traffic

### 4.8 Advanced Analytics (Phase 5+)
- Integration with Google Analytics 4
- Heatmaps (scroll depth, click tracking)
- A/B testing for titles/images
- UTM parameter tracking from social posts

### 4.9 Social Media Listening (Phase 5+)
- Monitor mentions of post URLs
- Aggregate comments from social platforms
- Display unified comment thread (site + social)

---

## Phase 5: Gallery Integration (Leverage Existing Image System)

**Goal:** Replace separate blog image uploads with existing gallery infrastructure

### Why Integrate with Gallery System?

Your existing gallery system (`api/images/`, `api/galleries/`) already has:
- ✅ Automatic thumbnail generation (aspect-preserving, max 1280x960)
- ✅ WebP optimization for performance
- ✅ Metadata extraction from images (AI generation info)
- ✅ Video support with poster images
- ✅ Like/comment engagement system
- ✅ Search by title, prompt, checkpoint
- ✅ Collection grouping system
- ✅ Robust upload validation (100MB limit, MIME type checking)
- ✅ File naming sanitization
- ✅ Admin UI components (GalleryManager, CollectionGalleryManager)

**Instead of building a separate blog image system, reuse this mature infrastructure!**

---

### 5.1 Database Schema Changes

#### Option A: Direct Image Reference (RECOMMENDED)
Modify `blog_posts` table to reference existing `images` table:

```sql
-- Update blog_posts table
ALTER TABLE blog_posts
  ADD COLUMN featured_image_id INT DEFAULT NULL AFTER cover_image,
  ADD FOREIGN KEY (featured_image_id) REFERENCES images(id) ON DELETE SET NULL;

-- Social images can also reference images table
ALTER TABLE blog_posts
  ADD COLUMN instagram_image_id INT DEFAULT NULL AFTER instagram_image,
  ADD COLUMN twitter_image_id INT DEFAULT NULL AFTER twitter_image,
  ADD COLUMN facebook_image_id INT DEFAULT NULL AFTER facebook_image,
  ADD FOREIGN KEY (instagram_image_id) REFERENCES images(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (twitter_image_id) REFERENCES images(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (facebook_image_id) REFERENCES images(id) ON DELETE SET NULL;

-- Create blog image gallery (one-time setup)
INSERT INTO galleries (slug, title, description, status, created_by)
VALUES ('blog-assets', 'Blog Assets', 'Images and media for blog posts', 'published', 1);

-- For inline content images in TipTap editor
CREATE TABLE blog_content_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blog_post_id INT NOT NULL,
    image_id INT NOT NULL,
    source ENUM('inline', 'featured', 'social_instagram', 'social_twitter', 'social_facebook') DEFAULT 'inline' COMMENT 'Where image is used',
    position_order INT DEFAULT 0 COMMENT 'Order in post content (for inline images)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    INDEX idx_source (source),
    INDEX idx_post_source (blog_post_id, source),
    UNIQUE KEY unique_post_image_source (blog_post_id, image_id, source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add computed aspect_ratio column to images table (Phase 5 integration)
-- This enhances the existing gallery images table for blog filtering
ALTER TABLE images
  ADD COLUMN aspect_ratio FLOAT GENERATED ALWAYS AS (width / height) STORED COMMENT 'Auto-calculated aspect ratio for filtering',
  ADD INDEX idx_aspect_ratio (aspect_ratio);
```

**Benefits:**
- No duplicate code for image processing
- Reuse existing thumbnails (faster page loads)
- Access metadata extraction (AI generation info)
- Can display image prompts/checkpoints in blog posts
- Unified image management across site
- **Source tracking** enables analytics (most-used images, unused image cleanup)
- **Aspect ratio column** enables fast filtering without calculation

---

### 5.2 Backend API Changes

#### 5.2.1 Reuse Existing Gallery APIs

**For blog feature images:**
```php
// In api/blog/create.php or update.php
// Instead of uploading a new image, reference existing gallery image

$input = json_decode(file_get_contents('php://input'), true);

// User selects from gallery via image picker modal
$featured_image_id = $input['featured_image_id'] ?? null;

// Fetch image details from images table
if ($featured_image_id) {
    $stmt = $pdo->prepare("SELECT original_path, thumbnail_path FROM images WHERE id = ?");
    $stmt->execute([$featured_image_id]);
    $image = $stmt->fetch();

    // Store path in blog_posts for backward compatibility (or use JOIN in queries)
    $cover_image = $image['original_path'];
}

// Save to blog_posts
$stmt = $pdo->prepare("
    INSERT INTO blog_posts (title, featured_image_id, cover_image, ...)
    VALUES (?, ?, ?, ...)
");
$stmt->execute([$title, $featured_image_id, $cover_image, ...]);
```

**For TipTap inline images:**
```php
// In TipTap editor, when user inserts image:
// 1. Open image picker modal (reuse gallery selector)
// 2. User selects image from existing galleries or uploads new to blog-assets gallery
// 3. Insert image URL into TipTap content
// 4. Track relationship in blog_content_images table

// api/blog/images/link.php
$blog_post_id = $input['blog_post_id'];
$image_id = $input['image_id'];
$source = $input['source'] ?? 'inline'; // 'inline' | 'featured' | 'social_instagram' | etc.
$position = $input['position_order'] ?? 0;

$stmt = $pdo->prepare("
    INSERT INTO blog_content_images (blog_post_id, image_id, source, position_order)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE position_order = ?
");
$stmt->execute([$blog_post_id, $image_id, $source, $position, $position]);
```

#### 5.2.2 New Endpoints (Minimal)

**`api/blog/images/picker.php`** - GET
- Lists images from `blog-assets` gallery + user's galleries
- Paginated, searchable
- Returns: image URL, thumbnail, dimensions, metadata
- Reuses `/api/images/gallery-list.php` logic

**`api/blog/images/upload.php`** - POST
- Wrapper around `/api/images/gallery-upload.php`
- Automatically uploads to `blog-assets` gallery
- Returns image ID for insertion into blog post
- Handles dimension validation for social images

---

### 5.3 Admin UI Integration

#### 5.3.1 Image Picker Modal Component
**File:** `src/components/admin/blog/BlogImagePicker.tsx`

```tsx
import { useState, useEffect } from 'react'

interface Image {
  id: number
  title: string
  thumbnail_path: string
  original_path: string
  width: number
  height: number
  aspect_ratio: number // Pre-calculated width/height
  prompt?: string
  checkpoint?: string
}

interface Props {
  onSelect: (image: Image) => void
  onClose: () => void
  filter?: {
    minWidth?: number
    minHeight?: number
    aspectRatio?: 'square' | 'landscape' | 'portrait'
  }
}

export default function BlogImagePicker({ onSelect, onClose, filter }: Props) {
  const [images, setImages] = useState<Image[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch(`/api/blog/images/picker.php?page=${page}&q=${search}`)
      .then(res => res.json())
      .then(data => setImages(data.images))
  }, [page, search])

  const filteredImages = images.filter(img => {
    if (filter?.minWidth && img.width < filter.minWidth) return false
    if (filter?.minHeight && img.height < filter.minHeight) return false

    // Use pre-calculated aspect_ratio for faster filtering
    const ratio = img.aspect_ratio || (img.width / img.height)
    if (filter?.aspectRatio === 'square' && (ratio < 0.95 || ratio > 1.05)) return false
    if (filter?.aspectRatio === 'landscape' && ratio <= 1.0) return false
    if (filter?.aspectRatio === 'portrait' && ratio >= 1.0) return false

    return true
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Select Image</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>

        <input
          type="text"
          placeholder="Search images..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        {filter && (
          <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
            {filter.minWidth && `Min width: ${filter.minWidth}px`}
            {filter.aspectRatio && ` • Aspect: ${filter.aspectRatio}`}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          {filteredImages.map(img => (
            <div
              key={img.id}
              onClick={() => onSelect(img)}
              className="cursor-pointer hover:opacity-80 transition"
            >
              <img
                src={img.thumbnail_path}
                alt={img.title}
                className="w-full h-48 object-cover rounded"
              />
              <p className="text-xs mt-1 truncate">{img.title || 'Untitled'}</p>
              <p className="text-xs text-neutral-500">{img.width}x{img.height}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
          <button onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  )
}
```

#### 5.3.2 Update BlogEditor Settings Sidebar

**In `BlogSettingsSidebar.tsx` Images tab:**

```tsx
// Replace direct file upload with image picker + upload option

<div className="space-y-4">
  {/* Cover Image */}
  <div>
    <label>Cover Image (1200x630)</label>
    {coverImage ? (
      <div className="relative">
        <img src={coverImage.thumbnail_path} alt="Cover" className="w-full rounded" />
        <button onClick={() => setCoverImage(null)} className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded">
          Remove
        </button>
        {coverImage.prompt && (
          <p className="text-xs mt-1 text-neutral-600">Prompt: {coverImage.prompt}</p>
        )}
      </div>
    ) : (
      <div className="space-x-2">
        <button onClick={() => setShowCoverPicker(true)} className="btn-secondary">
          Choose from Gallery
        </button>
        <button onClick={() => handleUploadNew('cover')} className="btn-secondary">
          Upload New
        </button>
      </div>
    )}
  </div>

  {/* Instagram Image */}
  <div>
    <label>Instagram Image (1080x1080 or 1080x1350)</label>
    {instagramImage ? (
      <div className="relative">
        <img src={instagramImage.thumbnail_path} alt="Instagram" className="w-full rounded" />
        <button onClick={() => setInstagramImage(null)}>Remove</button>
      </div>
    ) : (
      <div className="space-x-2">
        <button onClick={() => setShowInstagramPicker(true)}>
          Choose from Gallery
        </button>
        <button onClick={() => handleUploadNew('instagram')}>
          Upload New
        </button>
      </div>
    )}
  </div>

  {/* Repeat for Twitter, Facebook */}
</div>

{/* Image Picker Modals */}
{showCoverPicker && (
  <BlogImagePicker
    onSelect={(img) => {
      setCoverImage(img)
      setShowCoverPicker(false)
    }}
    onClose={() => setShowCoverPicker(false)}
    filter={{ minWidth: 1200, minHeight: 630 }}
  />
)}

{showInstagramPicker && (
  <BlogImagePicker
    onSelect={(img) => {
      setInstagramImage(img)
      setShowInstagramPicker(false)
    }}
    onClose={() => setShowInstagramPicker(false)}
    filter={{ minWidth: 1080, aspectRatio: 'square' }}
  />
)}
```

#### 5.3.3 TipTap Editor Image Extension

**Custom TipTap Image Node:**

```tsx
import { Node } from '@tiptap/core'
import Image from '@tiptap/extension-image'

export const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      imageId: {
        default: null,
        parseHTML: element => element.getAttribute('data-image-id'),
        renderHTML: attributes => {
          if (!attributes.imageId) return {}
          return { 'data-image-id': attributes.imageId }
        }
      },
      prompt: {
        default: null,
        parseHTML: element => element.getAttribute('data-prompt'),
        renderHTML: attributes => {
          if (!attributes.prompt) return {}
          return { 'data-prompt': attributes.prompt }
        }
      }
    }
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageFromGallery: (image: Image) => ({ commands }) => {
        return commands.insertContent({
          type: 'image',
          attrs: {
            src: image.original_path,
            alt: image.title || '',
            imageId: image.id,
            prompt: image.prompt
          }
        })
      }
    }
  }
})
```

**In editor toolbar:**
```tsx
<button
  onClick={() => setShowImagePicker(true)}
  title="Insert image from gallery"
>
  🖼️ Gallery
</button>

{showImagePicker && (
  <BlogImagePicker
    onSelect={(img) => {
      editor.commands.setImageFromGallery(img)

      // Track relationship with source
      fetch('/api/blog/images/link.php', {
        method: 'POST',
        body: JSON.stringify({
          blog_post_id: currentPostId,
          image_id: img.id,
          source: 'inline',
          position_order: getCurrentCursorPosition() // Track order in content
        })
      })

      setShowImagePicker(false)
    }}
    onClose={() => setShowImagePicker(false)}
  />
)}
```

---

### 5.4 Frontend Display

#### 5.4.1 Blog Post Component Updates

**In `BlogPost.tsx`:**

```tsx
// Fetch post with image metadata
useEffect(() => {
  fetch(`/api/blog/get.php?slug=${slug}`)
    .then(res => res.json())
    .then(data => {
      setPost(data.post)
      setFeaturedImage(data.featured_image) // Includes prompt, checkpoint, etc.
    })
}, [slug])

// Display featured image with metadata
{featuredImage && (
  <div className="relative">
    <img
      src={featuredImage.original_path}
      alt={featuredImage.alt_text || post.title}
      className="w-full h-96 object-cover rounded-lg"
    />
    {featuredImage.prompt && (
      <details className="mt-2 text-sm text-neutral-600">
        <summary className="cursor-pointer">AI Generation Info</summary>
        <div className="mt-2 space-y-1">
          <p><strong>Prompt:</strong> {featuredImage.prompt}</p>
          {featuredImage.checkpoint && <p><strong>Model:</strong> {featuredImage.checkpoint}</p>}
          {featuredImage.parameters && <p><strong>Settings:</strong> {featuredImage.parameters}</p>}
        </div>
      </details>
    )}
  </div>
)}
```

#### 5.4.2 Gallery Cross-Linking

**Show related galleries in blog sidebar:**

```tsx
// If blog post uses images from a specific gallery, link to it
{relatedGallery && (
  <div className="rounded-lg bg-neutral-900/80 border border-white/10 p-4">
    <h3 className="font-semibold mb-2">Related Gallery</h3>
    <Link to={`/galleries/${relatedGallery.slug}`} className="flex items-center gap-2 hover:opacity-80">
      <img src={relatedGallery.hero_thumb} alt={relatedGallery.title} className="w-16 h-16 object-cover rounded" />
      <div>
        <p className="font-medium">{relatedGallery.title}</p>
        <p className="text-xs text-neutral-400">{relatedGallery.image_count} images</p>
      </div>
    </Link>
  </div>
)}
```

---

### 5.5 Migration Strategy

#### Step 1: Database Updates
```sql
-- Add foreign key columns to blog_posts
ALTER TABLE blog_posts ADD COLUMN featured_image_id INT AFTER cover_image;
ALTER TABLE blog_posts ADD FOREIGN KEY (featured_image_id) REFERENCES images(id) ON DELETE SET NULL;

-- Create blog-assets gallery
INSERT INTO galleries (slug, title, description, status, created_by)
VALUES ('blog-assets', 'Blog Assets', 'Centralized storage for blog post images', 'published', 1);

-- Create blog_content_images tracking table
CREATE TABLE blog_content_images (...);
```

#### Step 2: Migrate Existing Blog Images (if any)
```php
// Script: api/migrations/migrate-blog-images-to-gallery.php
// For each existing blog post with cover_image path:
// 1. Copy image file to gallery structure
// 2. Insert into images table
// 3. Update blog_posts.featured_image_id
// 4. Keep old cover_image path for backward compatibility
```

#### Step 3: Update Admin UI
- Add BlogImagePicker component
- Update BlogSettingsSidebar to use picker
- Add TipTap gallery image extension

#### Step 4: Update APIs
- Create `/api/blog/images/picker.php` (wrapper)
- Update `/api/blog/create.php` and `update.php` to handle image IDs
- Create `/api/blog/images/link.php` for tracking inline images

#### Step 5: Testing
- Upload blog post with gallery images
- Verify thumbnails display correctly
- Check metadata extraction works
- Test social crossposting with gallery images
- Verify image deletion doesn't break blog posts (ON DELETE SET NULL)

---

### 5.6 Benefits Summary

✅ **No Code Duplication**
- Reuse existing upload logic (`gallery-upload.php`)
- Reuse thumbnail generation
- Reuse metadata extraction

✅ **Better User Experience**
- Unified image library across site
- Can reuse AI-generated images from galleries in blog posts
- See prompts/checkpoints in blog context
- Search across all images

✅ **Performance**
- Thumbnails already generated
- WebP optimization already implemented
- Single storage location (easier CDN setup)

✅ **Maintenance**
- Single upload system to maintain
- Bug fixes apply to both galleries and blog
- Consistent behavior across features

✅ **Features for Free**
- Video support in blog posts
- Like/comment on blog images
- Collection grouping (can organize blog series)
- Search by AI generation metadata

---

### 5.7 Timeline Estimate

**Phase 5: Gallery Integration**
**Estimated Time:** 2-3 days

- Day 1: Database updates + BlogImagePicker component
- Day 2: Update BlogEditor + TipTap extension + API wrappers
- Day 3: Frontend display updates + testing + migration script

**Savings:** Avoids rebuilding image upload system (would take 3-4 days)

---

### 5.8 Future Enhancements

**Phase 6+:**
- Bulk image import from galleries to blog
- Auto-suggest related galleries based on shared images
- Generate blog post from gallery (turn image gallery into blog post with commentary)
- Image version history (if you edit an image, blog uses new version)
- Smart image recommendations (suggest images based on blog content/tags)

---

## Detailed Timeline (Reorganized by Build Order)

### Phase 1: Backend Core (Database + Basic Editor)
**Estimated Time:** 4-6 days
**Goal:** Get data structure right, build minimal admin editor

> ✅ **COMPLETED** - Phase 1 implemented on 2025-12-14
> - All PHP API endpoints created (`api/blog/list.php`, `get.php`, `create.php`, `update.php`, `delete.php`, `categories/list.php`, `tags/list.php`, `rss.xml.php`)
> - TypeScript types created (`src/types/blog.ts`)
> - API client utilities created (`src/utils/api-blog.ts`)
> - Features: dual storage (JSON+HTML), auto-slug generation, reading time calculation, revision history, rate limiting, RSS feed

- **Day 1:** Database migrations
  - Create all core tables (blog_posts, blog_categories, blog_tags, blog_analytics, blog_analytics_daily, blog_revisions)
  - Run migrations
  - Test with manual SQL inserts

- **Day 2:** Basic CRUD APIs
  - `api/blog/create.php` - Dual storage (JSON + HTML)
  - `api/blog/update.php` - With revision history
  - `api/blog/delete.php` - Soft delete
  - `api/blog/get.php` - Single post fetch
  - `api/blog/list.php` - Admin list view

- **Day 3:** Minimal Admin UI
  - Basic BlogEditor component (just title, slug, content)
  - Integrate TipTap editor
  - Save draft functionality
  - Test dual storage (can re-open editor with JSON)

- **Day 4-5:** Essential Features
  - Status workflow (draft → published)
  - SEO fields (meta description, keywords)
  - Tags/categories (basic JSON storage)
  - Revision history tracking

- **Day 6:** Testing & Polish
  - Test all CRUD operations
  - Verify dual storage works correctly
  - Test revision history
  - RSS feed generation (`api/blog/rss.xml.php`)

**Deliverable:** Working admin panel where you can create, edit, and publish blog posts

---

### Phase 2: Gallery Integration
**Estimated Time:** 2-3 days
**Goal:** Hook blog into existing gallery system (NO separate image upload)

> ✅ **COMPLETED** - Phase 2 implemented on 2025-12-14
> - API endpoints created: `api/blog/images/picker.php`, `api/blog/images/link.php`
> - API client functions added to `src/utils/api-blog.ts`
> - Frontend components created: `BlogImagePicker.tsx`, `BlogImageExtension.ts`, `BlogManager.tsx`
> - TipTap packages installed (@tiptap/react, @tiptap/starter-kit, @tiptap/extension-image, etc.)
> - BlogManager integrated into UnifiedAdminDashboard with route `/admin/blog`

- **Day 1:** Database Integration
  - Add foreign key columns to blog_posts (featured_image_id, instagram_image_id, etc.) ✅ (in Phase 1 migration)
  - Create `blog_content_images` tracking table with source tracking ✅ (in Phase 1 migration)
  - Add `aspect_ratio` computed column to images table ✅ (in Phase 1 migration)
  - Create `blog-assets` gallery for blog-specific uploads ✅ (in Phase 1 migration)

- **Day 2:** Admin UI Components
  - Build `BlogImagePicker` component ✅
  - Filter by dimensions and aspect ratio ✅
  - Update BlogEditor to use image picker ✅
  - TipTap custom image extension (tracks image_id) ✅

- **Day 3:** API Integration & Testing
  - `api/blog/images/picker.php` (wrapper around gallery list) ✅
  - `api/blog/images/link.php` (track image usage with source) ✅
  - Test inline images in TipTap
  - Test featured/social image selection
  - Verify thumbnails display correctly

**Deliverable:** Blog editor can select images from galleries, no separate upload system needed ✅

---

### Phase 3: Frontend (Reading Experience)
**Estimated Time:** 3-5 days
**Goal:** Build public-facing blog with theme integration

> ✅ **COMPLETED** - Phase 3 implemented on 2025-12-14
> - Blog feature module created in `src/features/blog/`
> - BlogRoute.tsx with theme integration and dynamic background
> - BlogIndex.tsx - Main listing page with pagination, search, filtering
> - BlogPost.tsx - Individual post view with SEO meta tags, JSON-LD structured data
> - BlogCard.tsx - Post card component with engagement stats
> - BlogSidebar.tsx - Categories, tags, author info, quick links
> - BlogSearch.tsx - Search component with keyboard support
> - TagCloud.tsx - Tag cloud widget with weighted sizing
> - Router updated with `/blog/*` routes
> - Blog link added to UniversePortalHomepage navigation
> - Supports filtering by category, tag, and universe
> - Social sharing buttons (Twitter, Facebook, LinkedIn, Copy Link)

- **Day 1:** Blog Index Page
  - `BlogIndex.tsx` component ✅
  - Dynamic background (matching UniversePortalHomepage theme) ✅
  - Post grid with cover images (using gallery thumbnails) ✅
  - Pagination ✅
  - Search UI (frontend only, backend in next phase) ✅

- **Day 2:** Blog Post Page ✅
  - `BlogPost.tsx` component ✅
  - Render `content_html` from database ✅
  - Display featured image with metadata (AI prompt if available) ✅
  - Author info, publish date ✅
  - Reading time estimate ✅

- **Day 3:** Sidebar & Navigation ✅
  - Recent posts widget ✅ (via BlogSidebar)
  - Categories/tags widget ✅ (BlogSidebar + TagCloud)
  - Universe tag filtering ✅ (via URL param /blog/universe/:slug)
  - Search implementation ✅ (backend already supports ?q= in list.php)
  - Related posts algorithm ✅ (fetched via API)

- **Day 4:** Polish & SEO ✅
  - OpenGraph meta tags ✅
  - Twitter cards ✅
  - Structured data (JSON-LD) ✅
  - Responsive design ✅
  - Loading states, error handling ✅

- **Day 5:** Testing & Performance
  - Test on mobile (manual testing recommended)
  - Verify gallery image integration works (via featured_image)
  - Check metadata display
  - Sitemap generation (`api/cron/generate-sitemaps.php`) - deferred to Phase 4
  - Analytics tracking (views, likes) - uses existing analytics system

**Deliverable:** Fully functional public blog matching your site's theme ✅

**Phase 3 Files Created:**
```
src/features/blog/
├── index.ts                    # Module exports
├── BlogRoute.tsx               # Route wrapper with ThemeProvider
└── components/
    ├── BlogIndex.tsx           # Main listing page with filtering/pagination
    ├── BlogPost.tsx            # Individual post view with SEO
    ├── BlogCard.tsx            # Post card component
    ├── BlogSidebar.tsx         # Sidebar widgets
    ├── BlogSearch.tsx          # Search component
    └── TagCloud.tsx            # Tag cloud widget
```

**Routes Added:**
- `/blog` - Blog index with all posts
- `/blog/:slug` - Individual post view
- `/blog/category/:category` - Filter by category
- `/blog/tag/:tag` - Filter by tag
- `/blog/universe/:universe` - Filter by universe

**Integration Points:**
- Router updated (`src/app/router.tsx`)
- Navigation link added to UniversePortalHomepage
- Uses existing ThemeContext for light/dark mode
- Connects to all Phase 1/2 API endpoints

**🎉 CORE BLOG IS NOW LIVE (9-14 days total)**

---

### Phase 4: Social Media Integration (OPTIONAL - Future Feature)
**Estimated Time:** 4-6 days
**Goal:** Crosspost to Instagram, Twitter, Facebook, Discord

- **Day 1:** Credential Management
  - Manual token entry UI
  - `social_api_credentials` table usage
  - Token encryption/decryption
  - Test connection buttons

- **Day 2:** Platform Posting Logic
  - Instagram Graph API posting
  - Twitter API v2 posting
  - Facebook Graph API posting
  - Discord webhook posting

- **Day 3:** Content Formatters
  - Character limit handling per platform
  - Image validation (check required dimensions)
  - Hashtag optimization
  - Link shortening

- **Day 4:** Crosspost Settings UI
  - `blog_crosspost_settings` table integration
  - Checkbox UI in blog editor
  - Disable checkbox if required image missing
  - Custom message per platform
  - `blog_crosspost_log` status tracking

- **Day 5:** Error Handling & Retry
  - Manual retry UI
  - Error logging
  - Email notifications on failure
  - Status display in admin

- **Day 6:** End-to-End Testing
  - Test posting to all platforms
  - Test error scenarios
  - Test image validation
  - Test scheduled posts (if implemented)

**Deliverable:** One-click crossposting to multiple social platforms

---

## Quick Reference Timeline

**RECOMMENDED BUILD ORDER:**
1. Phase 1: Backend Core - 4-6 days ✅ COMPLETED
2. Phase 2: Gallery Integration - 2-3 days ✅ COMPLETED
3. Phase 3: Frontend - 3-5 days
4. **LAUNCH HERE** ← Core blog is done (9-14 days)
5. Phase 4: Social Media - 4-6 days (add later when ready)

**Alternative (original order):**
- Frontend first - 3-5 days
- Backend + Admin - 6-8 days
- Social Integration - 4-6 days
- Gallery Integration - 2-3 days
- **Total: 15-22 days**

**Why reorganized order is better:**
- ✅ Know your data structure before building UI
- ✅ No throwaway image upload code
- ✅ Can launch without social (it's fragile)
- ✅ Faster to working prototype
- ✅ Less rework

**Advanced Features (Phase 5+):**
- OAuth automation (3-4 days)
- Engagement sync from platforms (2-3 days)
- Advanced analytics dashboard (3-5 days)
- Email newsletters (2-3 days)
- Content snippets/shortcodes (1-2 days)

---

## Testing Strategy

### Unit Tests
- API endpoint validation
- Content formatters (character limits)
- Image upload/resize functions
- OAuth token encryption/decryption

### Integration Tests
- Full blog post creation flow
- Image upload → post → publish → crosspost
- OAuth flows for each platform
- Scheduled post publishing

### Manual Testing Checklist
- [ ] Create draft blog post
- [ ] Upload images (all 4 types)
- [ ] Add tags, categories, SEO metadata
- [ ] Preview post on frontend
- [ ] Publish post
- [ ] Verify crossposting to all platforms
- [ ] Check social media links work
- [ ] Test search functionality
- [ ] Test comment submission
- [ ] Test analytics tracking
- [ ] Test scheduled publishing
- [ ] Test image library
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test light/dark theme switching

---

## Security Considerations

### Data Protection
- Encrypt social media tokens at rest
- Use HTTPS for all API calls
- Sanitize all user input (HTML, SQL, XSS)
- CSRF tokens on all forms
- Rate limiting on all endpoints

### API Security
- Store API keys in environment variables
- Never commit credentials to git
- Use `.gitignore` for `config.php`
- Implement IP allowlisting for cron jobs
- Use webhook secrets for Discord (HMAC validation)

### Content Security
- CSP headers to prevent XSS
- Validate image uploads (magic bytes, not just extension)
- Limit file sizes
- Sanitize TipTap HTML output (allow only safe tags)

---

## Performance Optimization

### Database
- Add indexes on frequently queried columns
- Use MySQL FULLTEXT index for search
- Cache popular posts in Redis/Memcached
- Paginate large result sets

### Images
- Generate WebP versions automatically
- Use lazy loading on frontend
- Implement CDN (Cloudflare Images)
- Compress images on upload

### Caching
- Cache blog post list responses (5 minutes)
- Cache individual posts (until updated)
- Cache tag/category lists (1 hour)
- Use `Cache-Control` headers

### API Rate Limits
- Implement per-user rate limits (not just IP)
- Use sliding window for fairness
- Return `Retry-After` headers

---

## Deployment Checklist

### Environment Setup
- [ ] Add social API keys to `.env`
- [ ] Configure OAuth redirect URIs in platform dashboards
- [ ] Set up encryption key for tokens
- [ ] Create `uploads/blog/` directory with write permissions
- [ ] Set up cron jobs for scheduling & sync

### Database
- [ ] Run migrations
- [ ] Seed initial categories
- [ ] Create indexes
- [ ] Set up backups

### DNS & Hosting
- [ ] Ensure public URLs for images (HTTPS)
- [ ] Configure CORS if using CDN
- [ ] Set up SSL certificate
- [ ] Test OAuth redirects

### Monitoring
- [ ] Set up error logging
- [ ] Monitor cron job execution
- [ ] Track API rate limit hits
- [ ] Set up uptime monitoring

---

## Maintenance & Future Enhancements

### Regular Tasks
- Monitor social API rate limits
- Review failed crosspost queue weekly
- Update OAuth tokens before expiry
- Clean up old analytics data (retain 1 year)
- Review and moderate comments

### Future Ideas
- Video embeds (YouTube, Vimeo)
- Podcast player integration
- Polls/surveys in posts
- Member-only content (paywall)
- Guest author submissions
- Content translation (multi-language)
- Progressive Web App (PWA) for offline reading

---

## Dependencies Summary

### NPM Packages (Phase 1 & 2)
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-character-count
```

### PHP Extensions (Phase 2 & 3)
- `php-curl` - For API requests
- `php-gd` or `php-imagick` - For image processing
- `php-openssl` - For token encryption
- `php-json` - For JSON handling

### External Services (Phase 3)
- Instagram Business Account + Facebook Developer App
- Twitter Developer Account (Basic tier minimum)
- Facebook Page + Developer App
- Discord Server with webhook

### Optional Services
- Cloudflare Images (CDN)
- Redis (caching)
- SendGrid/Mailgun (email notifications)
- Google Analytics 4

---

## File Structure Summary

```
Website/
├── api/
│   ├── blog/
│   │   ├── list.php
│   │   ├── get.php
│   │   ├── create.php
│   │   ├── update.php
│   │   ├── delete.php
│   │   ├── upload-image.php
│   │   ├── search.php
│   │   ├── images/
│   │   │   ├── list.php
│   │   │   └── delete.php
│   │   ├── tags/
│   │   │   └── list.php
│   │   ├── categories/
│   │   │   └── list.php
│   │   ├── analytics/
│   │   │   ├── track.php
│   │   │   └── stats.php
│   │   └── comments/
│   │       ├── list.php
│   │       ├── create.php
│   │       └── moderate.php
│   ├── social/
│   │   ├── post.php
│   │   ├── retry-failed.php
│   │   ├── sync-engagement.php
│   │   ├── platforms/
│   │   │   ├── instagram.php
│   │   │   ├── twitter.php
│   │   │   ├── facebook.php
│   │   │   └── discord.php
│   │   ├── oauth/
│   │   │   ├── initiate.php
│   │   │   ├── instagram.php
│   │   │   ├── twitter.php
│   │   │   └── facebook.php
│   │   ├── credentials/
│   │   │   ├── update.php
│   │   │   └── get.php
│   │   └── helpers/
│   │       └── content-formatter.php
│   ├── cron/
│   │   └── publish-scheduled-blog-posts.php
│   └── migrations/
│       └── 2025-12-14-blog-system.sql
├── src/
│   ├── components/
│   │   ├── BlogIndex.tsx
│   │   ├── BlogPost.tsx
│   │   ├── blog/
│   │   │   ├── BlogCard.tsx
│   │   │   ├── BlogHero.tsx
│   │   │   ├── BlogSidebar.tsx
│   │   │   ├── BlogSearch.tsx
│   │   │   └── TagCloud.tsx
│   │   └── admin/
│   │       ├── BlogManager.tsx
│   │       ├── SocialCredentialsManager.tsx
│   │       └── blog/
│   │           ├── BlogEditor.tsx
│   │           ├── BlogPostList.tsx
│   │           ├── BlogSettingsSidebar.tsx
│   │           ├── BlogImageManager.tsx
│   │           ├── BlogCommentModerator.tsx
│   │           ├── BlogAnalytics.tsx
│   │           └── BlogScheduler.tsx
│   ├── data/
│   │   └── blogMockData.ts
│   └── app/
│       └── router.tsx (updated)
└── uploads/
    └── blog/
        └── [year]/
            └── [month]/
                ├── covers/
                ├── instagram/
                ├── twitter/
                ├── facebook/
                └── content/
```

---

## Success Metrics

### Phase 1
- [ ] All blog pages render correctly
- [ ] Theme switching works
- [ ] Responsive on all devices
- [ ] Mock data displays properly

### Phase 2
- [ ] Can create, edit, delete posts
- [ ] TipTap editor saves content
- [ ] Images upload successfully
- [ ] SEO metadata saved correctly
- [ ] Comments can be moderated

### Phase 3
- [ ] OAuth connects to all platforms
- [ ] Posts crosspost successfully
- [ ] Scheduled posts publish on time
- [ ] Engagement metrics sync daily
- [ ] Error retry logic works

---

## Critical Improvements Implemented

✅ **Dual Content Storage (JSON + HTML)**
- Prevents TipTap round-trip issues
- JSON for editor re-opening
- HTML for frontend rendering
- Future-proof for schema changes

✅ **No Automatic Image Resizing**
- Prevents server overload on shared hosting
- User uploads exact dimensions needed
- Validation only (reject wrong sizes)
- Simpler, more reliable code

✅ **Daily Analytics Rollup**
- Raw events retained 90 days
- Daily aggregates stored permanently
- Prevents table bloat (millions of rows)
- Fast dashboard queries

✅ **Table-Based Crosspost Settings**
- Extensible to future platforms (Threads, Bluesky, YouTube)
- Per-post, per-platform customization
- No schema changes for new platforms

✅ **Enhanced Comment Anti-Spam**
- Reuses existing Storytime comment system
- Content hash for duplicate detection
- Bot detection flags
- User flagging support

✅ **Revision History**
- Track all content changes
- Compare versions
- Restore previous versions
- Audit trail for edits

✅ **Simplified Phase 3**
- Manual token entry (no OAuth complexity)
- No engagement sync initially
- Focus on core posting functionality
- Defer advanced features to Phase 4+

✅ **Sitemap + RSS in Phase 2**
- Essential for SEO
- RSS uses `content_html` field
- Auto-discovery tags
- Daily sitemap regeneration

---

## 🚨 Production Gotchas & Technical Refinements

### A. Slug Collision Handler (CRITICAL)

**The Problem:**
If you write two posts titled "Worldbuilding Update," they'll both try to claim the slug `/worldbuilding-update`. The second one will fail due to the `UNIQUE` constraint on `blog_posts.slug`.

**The Fix:**
Implement recursive collision detection in `api/blog/create.php`:

```php
function generateUniqueSlug($pdo, $baseSlug, $postId = null) {
    $slug = $baseSlug;
    $counter = 1;

    while (true) {
        // Check if slug exists (excluding current post if updating)
        $stmt = $pdo->prepare("
            SELECT id FROM blog_posts
            WHERE slug = ? AND (? IS NULL OR id != ?)
        ");
        $stmt->execute([$slug, $postId, $postId]);

        if (!$stmt->fetch()) {
            return $slug; // Slug is available
        }

        // Collision detected, append counter
        $slug = $baseSlug . '-' . $counter;
        $counter++;

        // Safety: prevent infinite loop
        if ($counter > 100) {
            $slug = $baseSlug . '-' . uniqid();
            break;
        }
    }

    return $slug;
}

// Usage in create.php:
$baseSlug = $input['slug'] ?? sanitizeSlug($input['title']);
$uniqueSlug = generateUniqueSlug($pdo, $baseSlug);
```

**Alternative UX Approach:**
Don't auto-fix collisions - instead, return a 409 Conflict error and let the user manually change the slug in the editor. This prevents unexpected URLs.

```php
// Check for collision
$stmt = $pdo->prepare("SELECT id FROM blog_posts WHERE slug = ?");
$stmt->execute([$input['slug']]);
if ($stmt->fetch()) {
    json_error('Slug already exists. Please choose a different slug.', 409);
}
```

---

### B. Instagram Public URL Requirement (CRITICAL FOR PHASE 4)

**The Problem:**
Instagram's Graph API does **not** upload files from your computer. It **fetches** images from a URL you provide via:
```
POST https://graph.facebook.com/v18.0/{ig-user-id}/media
{
  "image_url": "https://your-site.com/path/to/image.jpg",
  "caption": "Your post text"
}
```

**The Constraint:**
- ❌ Cannot test Instagram crossposting from `localhost`
- ❌ Images must be publicly accessible via HTTPS
- ❌ Self-signed SSL certificates will fail
- ✅ Must use production domain with valid SSL
- ✅ Images must return `200 OK` with correct `Content-Type: image/jpeg`

**Testing Strategy:**
1. **Development:** Skip Instagram during local dev, or use ngrok tunnel:
   ```bash
   ngrok http 80
   # Use ngrok URL for image_url (temporary)
   ```

2. **Staging:** Deploy to staging server with valid SSL first

3. **Production:** Verify image URLs are publicly accessible:
   ```bash
   curl -I https://yourdomain.com/api/uploads/galleries/originals/image.jpg
   # Should return: HTTP/2 200
   ```

**Code Addition for Phase 4:**
```php
// In api/social/platforms/instagram.php
function verifyImageAccessible($imageUrl) {
    $ch = curl_init($imageUrl);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($statusCode !== 200) {
        throw new Exception("Image not publicly accessible: HTTP $statusCode");
    }
}

// Before posting to Instagram:
verifyImageAccessible($instagramImage);
```

---

### C. TipTap Image Cleanup (Orphaned Images)

**The Problem:**
When you delete an image from the TipTap editor, it:
- ✅ Removes the `<img>` tag from `content_html`
- ✅ Removes the image node from `content_json`
- ❌ **Does NOT** delete the row from `blog_content_images`
- ❌ **Does NOT** delete the file from the gallery

Over time, you'll accumulate orphaned image references.

**The Fix:**
Implement a cleanup script that runs after each save:

```php
// api/blog/cleanup-orphaned-images.php
function cleanupOrphanedImages($postId, $contentJson) {
    global $pdo;

    // Parse TipTap JSON to extract all image IDs currently in use
    $usedImageIds = [];
    $doc = json_decode($contentJson, true);

    function extractImageIds($node, &$imageIds) {
        if ($node['type'] === 'image' && isset($node['attrs']['imageId'])) {
            $imageIds[] = (int)$node['attrs']['imageId'];
        }
        if (isset($node['content']) && is_array($node['content'])) {
            foreach ($node['content'] as $child) {
                extractImageIds($child, $imageIds);
            }
        }
    }

    extractImageIds($doc, $usedImageIds);

    // Delete links for inline images no longer in content
    if (empty($usedImageIds)) {
        // No images in content, delete all inline links
        $stmt = $pdo->prepare("
            DELETE FROM blog_content_images
            WHERE blog_post_id = ? AND source = 'inline'
        ");
        $stmt->execute([$postId]);
    } else {
        // Keep only images still in content
        $placeholders = implode(',', array_fill(0, count($usedImageIds), '?'));
        $stmt = $pdo->prepare("
            DELETE FROM blog_content_images
            WHERE blog_post_id = ?
            AND source = 'inline'
            AND image_id NOT IN ($placeholders)
        ");
        $stmt->execute(array_merge([$postId], $usedImageIds));
    }
}

// Call this in api/blog/update.php after saving:
cleanupOrphanedImages($postId, $input['content_json']);
```

**Optional: Global Cleanup Cron**
```php
// api/cron/cleanup-unused-gallery-images.php
// Run weekly to find gallery images not linked to any blog post or gallery

$stmt = $pdo->query("
    SELECT i.id, i.original_path
    FROM images i
    LEFT JOIN blog_content_images bci ON i.id = bci.image_id
    LEFT JOIN gallery_images gi ON i.id = gi.image_id
    WHERE i.gallery_id = (SELECT id FROM galleries WHERE slug = 'blog-assets')
    AND bci.id IS NULL  -- Not linked to any blog post
    AND gi.id IS NULL   -- Not in any gallery
    AND i.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)  -- Older than 30 days
");

foreach ($stmt->fetchAll() as $orphan) {
    // Log for review before deleting
    error_log("Orphaned image candidate: " . $orphan['original_path']);
    // Optionally: move to trash or delete
}
```

---

### D. Comment Spam Honeypot (CRITICAL)

**The Problem:**
Even with `content_hash` and bot detection, blog comments are **bot magnets**. Simple bots will fill out every form field they see.

**The Fix:**
Add a **honeypot field** - a hidden input that humans can't see but bots will fill:

```php
// In blog_comments table - already have these fields:
// - content_hash (duplicate detection)
// - is_bot (detection flag)
// - user_agent (bot signatures)

// Add honeypot validation in api/blog/comments/create.php:
$honeypot = $input['website'] ?? ''; // Field named "website" but hidden via CSS

if (!empty($honeypot)) {
    // Bot filled the honeypot - reject silently (no error message)
    http_response_code(200);
    echo json_encode(['success' => true]); // Fake success
    exit;
}

// Additional bot checks:
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$knownBots = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget'];

foreach ($knownBots as $bot) {
    if (stripos($userAgent, $bot) !== false) {
        $isBot = true;
        break;
    }
}

// Time-based check (too fast = bot)
$timeOnPage = $input['time_on_page'] ?? 0; // Track via JS
if ($timeOnPage < 3) { // Less than 3 seconds
    $isBot = true;
}
```

**Frontend Implementation:**
```tsx
// In BlogPost.tsx comment form:
<form onSubmit={handleCommentSubmit}>
  <input
    type="text"
    name="author_name"
    placeholder="Your name"
    required
  />

  <input
    type="email"
    name="author_email"
    placeholder="Your email"
    required
  />

  {/* HONEYPOT - hidden from humans via CSS */}
  <input
    type="text"
    name="website"
    autoComplete="off"
    tabIndex={-1}
    style={{ position: 'absolute', left: '-9999px' }}
    aria-hidden="true"
  />

  <textarea
    name="content"
    placeholder="Your comment"
    required
  />

  {/* Hidden field to track time on page */}
  <input
    type="hidden"
    name="time_on_page"
    value={timeOnPage}
  />

  <button type="submit">Submit</button>
</form>
```

**Additional Anti-Spam Layer:**
```php
// Rate limit comment submission per IP
requireRateLimit('blog_comment', 5, 3600); // 5 comments per hour per IP

// Check for duplicate content
$contentHash = hash('sha256', $input['content']);
$stmt = $pdo->prepare("
    SELECT id FROM blog_comments
    WHERE content_hash = ?
    AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
");
$stmt->execute([$contentHash]);
if ($stmt->fetch()) {
    json_error('Duplicate comment detected', 409);
}
```

---

### E. Additional Production Checklist

**Image Path Configuration:**
```php
// In api/config.php - add base URL for absolute image paths
define('BASE_URL', getenv('BASE_URL') ?: 'https://yourdomain.com');

// Use in Instagram posting:
$absoluteImageUrl = BASE_URL . $image['original_path'];
```

**Slug Sanitization:**
```php
function sanitizeSlug($title) {
    $slug = strtolower($title);
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug); // Remove special chars
    $slug = preg_replace('/[\s-]+/', '-', $slug);       // Collapse whitespace
    $slug = trim($slug, '-');                            // Trim dashes

    // Limit length
    if (strlen($slug) > 200) {
        $slug = substr($slug, 0, 200);
        $slug = substr($slug, 0, strrpos($slug, '-')); // Break on word
    }

    return $slug;
}
```

**TipTap JSON Validation:**
```php
// Before saving content_json, verify it's valid TipTap structure
function validateTipTapJson($json) {
    $doc = json_decode($json, true);

    if (!$doc || !isset($doc['type']) || $doc['type'] !== 'doc') {
        throw new Exception('Invalid TipTap JSON structure');
    }

    // Check for required fields
    if (!isset($doc['content']) || !is_array($doc['content'])) {
        throw new Exception('TipTap JSON missing content array');
    }

    return true;
}
```

---

## Questions to Resolve Before Starting

1. **Social Platform Priorities:** Which platforms are most important? (affects development order)
2. **Instagram Account:** Do you have Instagram Business + Facebook Page + developer access?
3. **Twitter Tier:** What Twitter/X API tier? (Basic = 50 tweets/day, Pro = unlimited)
4. **Hosting:** Shared hosting or VPS? (affects cron job setup)
5. **Domain:** Production domain for image URLs (must be publicly accessible HTTPS)
6. **Content Moderation:** Auto-approve comments or manual review?
7. **Publishing Workflow:** Single author direct publishing?
8. **Image Prep:** Comfortable resizing images yourself before upload?

---

This plan provides a complete roadmap from frontend to full social integration. Each phase is self-contained and can be deployed independently, allowing for iterative development and testing.
